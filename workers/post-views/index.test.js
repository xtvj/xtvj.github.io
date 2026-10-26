import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.js';
import { PASSWORD_ITERATIONS, passwordHash, randomHex, validPassword, verifySession } from './auth.js';

test('password login, immediate comments, deletion and session invalidation', async () => {
  assert.equal(validPassword('12345678'), true);
  assert.equal(validPassword('1234567'), false);
  const oldPassword = 'a-long-admin-password-123';
  const newPassword = 'admin123';
  const auth = { salt: randomHex(), iterations: PASSWORD_ITERATIONS, version: 1 };
  auth.password_hash = await passwordHash(oldPassword, auth.salt, auth.iterations);
  const views = new Map([['article', 5]]);
  const visitors = new Map();
  const comments = [];
  const profile = { nickname: '博主', avatar_id: 'moses' };
  const limiter = { async limit() { return { success: true }; } };
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async all() {
              if (sql.includes('FROM post_views')) return { results: args.filter((slug) => views.has(slug)).map((slug) => ({ slug, views: views.get(slug) })) };
              if (sql.includes('COUNT(*) AS count')) return { results: [...new Set(args)].map((slug) => ({ post_slug: slug, count: comments.filter((comment) => comment.status === 'approved' && comment.post_slug === slug).length })).filter((row) => row.count > 0) };
              if (sql.includes('ORDER BY c.id DESC')) return { results: comments.filter((comment) => comment.status === 'approved').slice().reverse().slice(0, args[0]).map((comment) => ({ ...comment, nickname: comment.is_admin ? profile.nickname : comment.nickname, avatar_id: comment.is_admin ? profile.avatar_id : comment.avatar_id })) };
              if (sql.includes('FROM comments')) return { results: comments.filter((comment) => comment.status === 'approved' && comment.post_slug === args[0] && comment.id > args[1]).map((comment) => ({ ...comment, nickname: comment.is_admin ? profile.nickname : comment.nickname, avatar_id: comment.is_admin ? profile.avatar_id : comment.avatar_id })) };
              return { results: [] };
            },
            async first() {
              if (sql.includes('FROM admin_auth')) return auth;
              if (sql.includes('FROM admin_profile')) return profile;
              if (sql.includes('UPDATE admin_auth')) {
                if (args[4] !== auth.version) return null;
                [auth.salt, auth.password_hash, auth.iterations] = args;
                auth.version += 1;
                return { version: auth.version };
              }
              if (sql.includes('FROM post_views')) return views.has(args[0]) ? { slug: args[0], views: views.get(args[0]) } : null;
              if (sql.includes('FROM comments') && sql.includes('post_slug')) return comments.find((comment) => comment.id === args[0] && comment.post_slug === args[1] && comment.status === 'approved') || null;
              if (sql.includes('FROM comments')) {
                const comment = comments.find((item) => item.id === args[0]);
                return comment ? { ...comment, nickname: comment.is_admin ? profile.nickname : comment.nickname, avatar_id: comment.is_admin ? profile.avatar_id : comment.avatar_id } : null;
              }
              return null;
            },
            async run() {
              if (sql.includes('INTO view_visitors')) {
                const [slug, hash, now] = args;
                const key = `${slug}:${hash}`;
                const shouldCount = !visitors.has(key) || now - visitors.get(key) >= 60;
                visitors.set(key, now);
                if (shouldCount) views.set(slug, (views.get(slug) || 0) + 1);
                return { meta: { changes: 1 } };
              }
              if (sql.includes('INTO comments')) {
                comments.push({ id: comments.length + 1, post_slug: args[0], parent_id: args[1], nickname: args[2], body: args[3], avatar_id: args[4], is_admin: args[5], status: 'approved', created_at: new Date().toISOString() });
                return { meta: { last_row_id: comments.length } };
              }
              if (sql.includes('UPDATE admin_profile')) {
                profile.nickname = args[0];
                profile.avatar_id = args[1];
                return { meta: { changes: 1 } };
              }
              if (sql.includes('DELETE FROM comments')) {
                const index = comments.findIndex((item) => item.id === args[0]);
                if (index >= 0) comments.splice(index, 1);
                return { meta: { changes: index >= 0 ? 1 : 0 } };
              }
              throw new Error('Unexpected SQL');
            },
          };
        },
        async first() {
          if (sql.includes('FROM admin_auth')) return auth;
          if (sql.includes('FROM admin_profile')) return profile;
          throw new Error('Unexpected SQL');
        },
      };
    },
  };
  const env = {
    DB: db, ALLOWED_ORIGIN: 'https://xtvj.github.io', VIEW_HASH_SECRET: 'test-hmac-secret',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret', VIEW_RATE_LIMITER: limiter,
    COMMENT_RATE_LIMITER: limiter, ADMIN_RATE_LIMITER: limiter, ADMIN_LOGIN_RATE_LIMITER: limiter,
  };
  const base = 'https://blog-api.example/api';
  const headers = { Origin: 'https://xtvj.github.io', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' };
  const post = (path, body, extra = {}) => new Request(`${base}${path}`, { method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body) });
  const get = (path, extra = {}) => new Request(`${base}${path}`, { headers: { ...headers, ...extra } });
  const originalFetch = globalThis.fetch;
  const originalNow = Date.now;
  let clock = Date.now();
  Date.now = () => clock;
  globalThis.fetch = async (_url, options) => Response.json({ success: !String(options.body).includes('invalid'), hostname: 'xtvj.github.io', action: 'comment' });
  try {
    const visitorId = 'f3b10118-236f-4553-a297-b79e55999a11';
    let response = await worker.fetch(post('/views', { slug: 'article', visitorId }), env);
    assert.equal((await response.json()).views, 6);
    clock += 30_000;
    response = await worker.fetch(post('/views', { slug: 'article', visitorId }, { 'CF-Connecting-IP': '192.0.2.2' }), env);
    assert.equal((await response.json()).views, 6);
    clock += 31_000;
    response = await worker.fetch(post('/views', { slug: 'article', visitorId }), env);
    assert.equal((await response.json()).views, 6);
    clock += 61_000;
    response = await worker.fetch(post('/views', { slug: 'article', visitorId }), env);
    assert.equal((await response.json()).views, 7);
    response = await worker.fetch(post('/comments', { slug: 'article', nickname: '游客', body: '你好', turnstileToken: 'valid', visitorId }), env);
    assert.equal(response.status, 201);
    const firstComment = (await response.json()).comment;
    assert.equal(firstComment.body, '你好');
    assert.ok(firstComment.avatar_id);
    response = await worker.fetch(post('/comments', { slug: 'article', nickname: '另一个昵称', body: '再见', turnstileToken: 'valid', visitorId }), env);
    assert.equal((await response.json()).comment.avatar_id, firstComment.avatar_id);
    response = await worker.fetch(post('/comments', { slug: 'article', nickname: '游客', body: '自选头像', turnstileToken: 'valid', visitorId, avatarId: 'david' }), env);
    assert.equal((await response.json()).comment.avatar_id, 'david');
    response = await worker.fetch(post('/comments', { slug: 'article', nickname: '游客', body: '错误头像', turnstileToken: 'valid', visitorId, avatarId: 'unknown' }), env);
    assert.equal(response.status, 400);
    response = await worker.fetch(get('/comments?slug=article'), env);
    assert.equal((await response.json()).comments.length, 3);
    response = await worker.fetch(get('/comment-overview?slug=article&slug=another&recent=1'), env);
    const overview = await response.json();
    assert.deepEqual(overview.counts, { article: 3, another: 0 });
    assert.equal(overview.recent[0].body, '自选头像');
    response = await worker.fetch(post('/comments', { slug: 'article', nickname: '机器', body: '垃圾', turnstileToken: 'invalid', visitorId }), env);
    assert.equal(response.status, 400);

    response = await worker.fetch(post('/admin/login', { password: 'wrong-password' }), env);
    assert.equal(response.status, 401);
    response = await worker.fetch(post('/admin/login', { password: oldPassword }), env);
    assert.equal(response.status, 200);
    const oldSession = (await response.json()).session;
    assert.equal(await verifySession(env.VIEW_HASH_SECRET, auth.version, oldSession), true);
    response = await worker.fetch(new Request(`${base}/admin/comments`, {
      method: 'OPTIONS', headers: { Origin: 'https://xtvj.github.io', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Headers': 'Authorization' },
    }), env);
    assert.equal(response.status, 204);
    assert.match(response.headers.get('Access-Control-Allow-Headers'), /Authorization/);
    response = await worker.fetch(get('/admin/comments?slug=article', { Authorization: `Bearer ${oldSession}` }), env);
    assert.equal((await response.json()).comments.length, 3);
    response = await worker.fetch(new Request(`${base}/admin/profile`, { method: 'PUT', headers: { ...headers, Authorization: `Bearer ${oldSession}` }, body: JSON.stringify({ nickname: '站长', avatarId: 'ruth' }) }), env);
    assert.equal(response.status, 200);
    response = await worker.fetch(post('/comments', { slug: 'article', nickname: '伪造', body: '管理员回复' }, { Authorization: `Bearer ${oldSession}` }), env);
    assert.equal(response.status, 201);
    const adminComment = (await response.json()).comment;
    assert.equal(adminComment.nickname, '站长');
    assert.equal(adminComment.avatar_id, 'ruth');
    assert.equal(adminComment.is_admin, 1);
    response = await worker.fetch(post('/admin/password', { currentPassword: oldPassword, newPassword }, { Authorization: `Bearer ${oldSession}` }), env);
    assert.equal(response.status, 200);
    const newSession = (await response.json()).session;
    response = await worker.fetch(get('/admin/comments?slug=article', { Authorization: `Bearer ${oldSession}` }), env);
    assert.equal(response.status, 401);
    response = await worker.fetch(get('/admin/comments?slug=article', { Authorization: `Bearer ${newSession}` }), env);
    assert.equal(response.status, 200);
    response = await worker.fetch(new Request(`${base}/admin/comments/1`, { method: 'DELETE', headers: { Authorization: `Bearer ${newSession}`, Origin: 'https://xtvj.github.io' } }), env);
    assert.equal(response.status, 200);
    response = await worker.fetch(get('/comments?slug=article'), env);
    assert.equal((await response.json()).comments.length, 3);
    response = await worker.fetch(get('/comment-overview?slug=article&recent=1'), env);
    assert.equal((await response.json()).counts.article, 3);
  } finally {
    globalThis.fetch = originalFetch;
    Date.now = originalNow;
  }
});
