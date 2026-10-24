const MAX_SLUGS = 50;

function validSlug(value) {
  return typeof value === 'string' && value.length > 0 && value.length <= 200 &&
    !/[\u0000-\u001f\u007f/?#]/u.test(value);
}

function responseHeaders(origin, allowedOrigins) {
  const headers = new Headers({
    'Cache-Control': 'no-store',
    'Vary': 'Origin',
  });
  if (allowedOrigins.has(origin)) {
    headers.set('Access-Control-Allow-Origin', origin);
    headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return headers;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = new Set([
      env.ALLOWED_ORIGIN || 'https://xtvj.github.io',
      'http://localhost:4321',
      'http://127.0.0.1:4321',
    ]);
    const headers = responseHeaders(origin, allowedOrigins);
    const json = (body, status = 200) => Response.json(body, { status, headers });

    if (url.pathname !== '/api/views') return json({ error: 'Not found' }, 404);
    if (!allowedOrigins.has(origin)) return json({ error: 'Origin not allowed' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (!env.DB) return json({ error: 'Database is not configured' }, 503);

    try {
      if (request.method === 'GET') {
        const slugs = [...new Set(url.searchParams.getAll('slug'))];
        if (!slugs.length || slugs.length > MAX_SLUGS || slugs.some((slug) => !validSlug(slug))) {
          return json({ error: 'Invalid slugs' }, 400);
        }
        const placeholders = slugs.map(() => '?').join(', ');
        const rows = await env.DB.prepare(
          `SELECT slug, views FROM post_views WHERE slug IN (${placeholders})`,
        ).bind(...slugs).all();
        const views = Object.fromEntries(slugs.map((slug) => [slug, 0]));
        for (const row of rows.results) views[row.slug] = row.views;
        return json({ views });
      }

      if (request.method === 'POST') {
        if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
          return json({ error: 'Expected JSON' }, 415);
        }
        let body;
        try {
          body = await request.json();
        } catch {
          return json({ error: 'Invalid JSON' }, 400);
        }
        if (!validSlug(body?.slug)) return json({ error: 'Invalid slug' }, 400);
        const row = await env.DB.prepare(`
          INSERT INTO post_views (slug, views) VALUES (?1, 1)
          ON CONFLICT(slug) DO UPDATE SET views = views + 1
          RETURNING views
        `).bind(body.slug).first();
        return json({ slug: body.slug, views: row.views });
      }

      return json({ error: 'Method not allowed' }, 405);
    } catch {
      return json({ error: 'Database request failed' }, 500);
    }
  },
};
