const MAX_SLUGS = 50;
const VIEW_WINDOW_SECONDS = 24 * 60 * 60;
const COMMENT_PAGE_SIZE = 50;

function validSlug(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 200 &&
    !/[\u0000-\u001f\u007f/?#]/u.test(value);
}

function responseHeaders(origin, allowedOrigins) {
  const headers = new Headers({ 'Cache-Control': 'no-store', Vary: 'Origin' });
  if (allowedOrigins.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return headers;
}

async function digest(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const bytes = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function adminAuthorized(request, token) {
  const supplied = request.headers.get('Authorization')?.match(/^Bearer (\S+)$/)?.[1];
  if (!token || !supplied) return false;
  const [left, right] = await Promise.all([digest(token), digest(supplied)]);
  let difference = 0;
  for (let index = 0; index < left.length; index++) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return difference === 0;
}

async function readJson(request) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return null;
  if (Number(request.headers.get('Content-Length') || 0) > 8192) return null;
  const text = await request.text();
  if (text.length > 8192) return null;
  try { return JSON.parse(text); } catch { return null; }
}

function positiveId(value) {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function verifyTurnstile(token, request, env, origin) {
  if (!env.TURNSTILE_SECRET_KEY || typeof token !== 'string' || !token || token.length > 2048) return false;
  const form = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) form.set('remoteip', ip);
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', body: form,
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true && result.hostname === new URL(origin).hostname && result.action === 'comment';
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigin = env.ALLOWED_ORIGIN || 'https://xtvj.github.io';
    const allowedOrigins = new Set([allowedOrigin, 'http://localhost:4321', 'http://127.0.0.1:4321']);
    const headers = responseHeaders(origin, allowedOrigins);
    const json = (body, status = 200, extraHeaders = {}) => Response.json(body, {
      status, headers: { ...Object.fromEntries(headers), ...extraHeaders },
    });

    if (url.pathname.startsWith('/api/admin/comments')) {
      // The moderation API has no browser CORS access. Keep the bearer token in an admin terminal.
      const adminJson = (body, status = 200) => Response.json(body, {
        status, headers: { 'Cache-Control': 'no-store' },
      });
      if (!await adminAuthorized(request, env.ADMIN_TOKEN)) return adminJson({ error: 'Unauthorized' }, 401);
      if (!env.DB) return adminJson({ error: 'Database is not configured' }, 503);
      try {
        if (url.pathname === '/api/admin/comments' && request.method === 'GET') {
          const status = url.searchParams.get('status') || 'pending';
          const cursor = url.searchParams.get('cursor') || '0';
          if (!['pending', 'approved'].includes(status) || !/^\d+$/.test(cursor) || !Number.isSafeInteger(Number(cursor))) {
            return adminJson({ error: 'Invalid query' }, 400);
          }
          const rows = await env.DB.prepare(`
            SELECT id, post_slug, parent_id, nickname, body, status, created_at
            FROM comments WHERE status = ?1 AND id > ?2 ORDER BY id LIMIT ?3
          `).bind(status, Number(cursor), COMMENT_PAGE_SIZE + 1).all();
          const comments = rows.results.slice(0, COMMENT_PAGE_SIZE);
          return adminJson({ comments, nextCursor: rows.results.length > COMMENT_PAGE_SIZE ? comments.at(-1).id : null });
        }
        const match = url.pathname.match(/^\/api\/admin\/comments\/(\d+)(?:\/(approve))?$/);
        const id = match && positiveId(match[1]);
        if (!id) return adminJson({ error: 'Not found' }, 404);
        if (request.method === 'POST' && match[2] === 'approve') {
          const result = await env.DB.prepare(`
            UPDATE comments SET status = 'approved', reviewed_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
            WHERE id = ?1 AND status = 'pending'
          `).bind(id).run();
          return result.meta.changes ? adminJson({ id, status: 'approved' }) : adminJson({ error: 'Pending comment not found' }, 404);
        }
        if (request.method === 'DELETE' && !match[2]) {
          const result = await env.DB.prepare('DELETE FROM comments WHERE id = ?1').bind(id).run();
          return result.meta.changes ? adminJson({ id, deleted: true }) : adminJson({ error: 'Comment not found' }, 404);
        }
        return adminJson({ error: 'Method not allowed' }, 405);
      } catch {
        return adminJson({ error: 'Database request failed' }, 500);
      }
    }

    if (!['/api/views', '/api/comments'].includes(url.pathname)) return json({ error: 'Not found' }, 404);
    if (!allowedOrigins.has(origin)) return json({ error: 'Origin not allowed' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!env.DB) return json({ error: 'Database is not configured' }, 503);

    try {
      if (url.pathname === '/api/views' && request.method === 'GET') {
        const slugs = [...new Set(url.searchParams.getAll('slug'))];
        if (!slugs.length || slugs.length > MAX_SLUGS || slugs.some((slug) => !validSlug(slug))) {
          return json({ error: 'Invalid slugs' }, 400);
        }
        const placeholders = slugs.map(() => '?').join(', ');
        const rows = await env.DB.prepare(`SELECT slug, views FROM post_views WHERE slug IN (${placeholders})`).bind(...slugs).all();
        const views = Object.fromEntries(slugs.map((slug) => [slug, 0]));
        for (const row of rows.results) views[row.slug] = row.views;
        return json({ views });
      }

      if (url.pathname === '/api/views' && request.method === 'POST') {
        if (!env.VIEW_HASH_SECRET || !env.VIEW_RATE_LIMITER) return json({ error: 'View protection is not configured' }, 503);
        const body = await readJson(request);
        if (!validSlug(body?.slug) || (body.visitorId !== undefined &&
          (typeof body.visitorId !== 'string' || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(body.visitorId)))) {
          return json({ error: 'Invalid view request' }, 400);
        }
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const agent = (request.headers.get('User-Agent') || '').slice(0, 200);
        const key = await hmac(env.VIEW_HASH_SECRET, `${ip}\n${agent}`);
        if (!(await env.VIEW_RATE_LIMITER.limit({ key })).success) return json({ error: 'Too many requests' }, 429);
        const visitorHash = await hmac(env.VIEW_HASH_SECRET, `${ip}\n${agent}\n${body.visitorId || ''}`);
        const now = Math.floor(Date.now() / 1000);
        const result = await env.DB.prepare(`
          INSERT INTO view_visitors (post_slug, visitor_hash, last_counted) VALUES (?1, ?2, ?3)
          ON CONFLICT(post_slug, visitor_hash) DO UPDATE SET last_counted = excluded.last_counted
          WHERE view_visitors.last_counted <= ?4
        `).bind(body.slug, visitorHash, now, now - VIEW_WINDOW_SECONDS).run();
        const row = await env.DB.prepare('SELECT views FROM post_views WHERE slug = ?1').bind(body.slug).first();
        return json({ slug: body.slug, views: row?.views ?? 0, counted: result.meta.changes > 0 });
      }

      if (url.pathname === '/api/comments' && request.method === 'GET') {
        const slug = url.searchParams.get('slug');
        const cursor = url.searchParams.get('cursor') || '0';
        if (!validSlug(slug) || !/^\d+$/.test(cursor) || !Number.isSafeInteger(Number(cursor))) return json({ error: 'Invalid query' }, 400);
        const rows = await env.DB.prepare(`
          SELECT id, parent_id, nickname, body, created_at FROM comments
          WHERE post_slug = ?1 AND status = 'approved' AND id > ?2 ORDER BY id LIMIT ?3
        `).bind(slug, Number(cursor), COMMENT_PAGE_SIZE + 1).all();
        const comments = rows.results.slice(0, COMMENT_PAGE_SIZE);
        return json({ comments, nextCursor: rows.results.length > COMMENT_PAGE_SIZE ? comments.at(-1).id : null });
      }

      if (url.pathname === '/api/comments' && request.method === 'POST') {
        if (!env.TURNSTILE_SECRET_KEY || !env.COMMENT_RATE_LIMITER || !env.VIEW_HASH_SECRET) {
          return json({ error: 'Comment protection is not configured' }, 503);
        }
        const body = await readJson(request);
        const slug = body?.slug;
        const nickname = typeof body?.nickname === 'string' ? body.nickname.trim() : '';
        const content = typeof body?.body === 'string' ? body.body.trim() : '';
        const parentId = body?.parentId == null ? null : positiveId(body.parentId);
        if (!validSlug(slug) || !nickname || nickname.length > 30 || /[\u0000-\u001f\u007f]/u.test(nickname) ||
          !content || content.length > 2000 || (body.parentId != null && !parentId)) {
          return json({ error: 'Invalid comment' }, 400);
        }
        const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
        const agent = (request.headers.get('User-Agent') || '').slice(0, 200);
        const key = await hmac(env.VIEW_HASH_SECRET, `${ip}\n${agent}`);
        if (!(await env.COMMENT_RATE_LIMITER.limit({ key })).success) return json({ error: 'Too many comments' }, 429);
        const post = await env.DB.prepare('SELECT slug FROM post_views WHERE slug = ?1').bind(slug).first();
        if (!post) return json({ error: 'Article not found' }, 404);
        if (parentId) {
          const parent = await env.DB.prepare(`
            SELECT id FROM comments WHERE id = ?1 AND post_slug = ?2 AND status = 'approved'
          `).bind(parentId, slug).first();
          if (!parent) return json({ error: 'Reply target not found' }, 400);
        }
        if (!await verifyTurnstile(body.turnstileToken, request, env, origin)) {
          return json({ error: 'Verification failed or expired' }, 400);
        }
        const result = await env.DB.prepare(`
          INSERT INTO comments (post_slug, parent_id, nickname, body) VALUES (?1, ?2, ?3, ?4)
        `).bind(slug, parentId, nickname, content).run();
        return json({ id: result.meta.last_row_id, status: 'pending' }, 202);
      }

      return json({ error: 'Method not allowed' }, 405);
    } catch {
      return json({ error: 'Request failed' }, 500);
    }
  },

  async scheduled(_event, env) {
    // Keep a month of deduplication state; current visitors are refreshed on return.
    await env.DB.prepare('DELETE FROM view_visitors WHERE last_counted < ?1')
      .bind(Math.floor(Date.now() / 1000) - 30 * VIEW_WINDOW_SECONDS).run();
  },
};
