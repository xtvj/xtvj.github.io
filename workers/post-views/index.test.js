import test from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.js';

test('views are deduplicated, comments need verification and moderation', async () => {
  const views = new Map([['article', 5]]);
  const visitors = new Map();
  const comments = [];
  const limiter = { async limit() { return { success: true }; } };
  const db = {
    prepare(sql) {
      return {
        bind(...args) {
          return {
            async all() {
              if (sql.includes('FROM post_views')) return { results: args.filter((slug) => views.has(slug)).map((slug) => ({ slug, views: views.get(slug) })) };
              if (sql.includes('FROM comments')) {
                const admin = sql.includes('status = ?1');
                return { results: comments.filter((comment) => admin
                  ? comment.status === args[0] && comment.id > args[1]
                  : comment.post_slug === args[0] && comment.status === 'approved' && comment.id > args[1]) };
              }
              return { results: [] };
            },
            async first() {
              if (sql.includes('FROM post_views')) return views.has(args[0]) ? { slug: args[0], views: views.get(args[0]) } : null;
              if (sql.includes('FROM comments')) return comments.find((comment) => comment.id === args[0] && comment.post_slug === args[1] && comment.status === 'approved') || null;
              return null;
            },
            async run() {
              if (sql.includes('INTO view_visitors')) {
                const [slug, hash, now, threshold] = args;
                const key = `${slug}:${hash}`;
                if (visitors.has(key) && visitors.get(key) > threshold) return { meta: { changes: 0 } };
                visitors.set(key, now);
                views.set(slug, (views.get(slug) || 0) + 1);
                return { meta: { changes: 1 } };
              }
              if (sql.includes('INTO comments')) {
                comments.push({ id: comments.length + 1, post_slug: args[0], parent_id: args[1], nickname: args[2], body: args[3], status: 'pending', created_at: new Date().toISOString() });
                return { meta: { last_row_id: comments.length } };
              }
              if (sql.includes('UPDATE comments')) {
                const comment = comments.find((item) => item.id === args[0] && item.status === 'pending');
                if (comment) comment.status = 'approved';
                return { meta: { changes: comment ? 1 : 0 } };
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
      };
    },
  };
  const env = {
    DB: db, ALLOWED_ORIGIN: 'https://xtvj.github.io', VIEW_HASH_SECRET: 'test-hmac-secret',
    TURNSTILE_SECRET_KEY: 'test-turnstile-secret', ADMIN_TOKEN: 'test-admin-secret',
    VIEW_RATE_LIMITER: limiter, COMMENT_RATE_LIMITER: limiter,
  };
  const base = 'https://blog-api.example/api';
  const headers = { Origin: 'https://xtvj.github.io', 'Content-Type': 'application/json', 'CF-Connecting-IP': '192.0.2.1' };
  const post = (path, body, extra = {}) => new Request(`${base}${path}`, {
    method: 'POST', headers: { ...headers, ...extra }, body: JSON.stringify(body),
  });
  const get = (path, extra = {}) => new Request(`${base}${path}`, { headers: { ...headers, ...extra } });
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (_url, options) => Response.json({
    success: !String(options.body).includes('invalid'), hostname: 'xtvj.github.io', action: 'comment',
  });
  try {
    const viewBody = { slug: 'article', visitorId: 'f3b10118-236f-4553-a297-b79e55999a11' };
    let response = await worker.fetch(post('/views', viewBody), env);
    assert.deepEqual(await response.json(), { slug: 'article', views: 6, counted: true });
    response = await worker.fetch(post('/views', viewBody), env);
    assert.deepEqual(await response.json(), { slug: 'article', views: 6, counted: false });
    response = await worker.fetch(post('/comments', { slug: 'article', nickname: '游客', body: '你好', turnstileToken: 'valid' }), env);
    assert.equal(response.status, 202);
    response = await worker.fetch(post('/comments', { slug: 'article', nickname: '机器人', body: '内容', turnstileToken: 'invalid' }), env);
    assert.equal(response.status, 400);
    response = await worker.fetch(get('/comments?slug=article'), env);
    assert.deepEqual((await response.json()).comments, []);
    response = await worker.fetch(get('/admin/comments'), env);
    assert.equal(response.status, 401);
    response = await worker.fetch(new Request(`${base}/admin/comments`, { headers: { Authorization: 'Bearer test-admin-secret' } }), env);
    assert.equal((await response.json()).comments.length, 1);
    response = await worker.fetch(new Request(`${base}/admin/comments/1/approve`, {
      method: 'POST', headers: { Authorization: 'Bearer test-admin-secret' },
    }), env);
    assert.equal(response.status, 200);
    response = await worker.fetch(get('/comments?slug=article'), env);
    assert.equal((await response.json()).comments.length, 1);
    response = await worker.fetch(post('/comments', { slug: 'article', parentId: 1, nickname: '回复者', body: '回复', turnstileToken: 'valid' }), env);
    assert.equal(response.status, 202);
    response = await worker.fetch(post('/comments', { slug: 'article', parentId: 999, nickname: '坏回复', body: '回复', turnstileToken: 'valid' }), env);
    assert.equal(response.status, 400);
    response = await worker.fetch(post('/comments', { slug: 'article', nickname: '跨域', body: '内容', turnstileToken: 'valid' }, { Origin: 'https://evil.example' }), env);
    assert.equal(response.status, 403);
    response = await worker.fetch(new Request(`${base}/admin/comments/1`, {
      method: 'DELETE', headers: { Authorization: 'Bearer test-admin-secret' },
    }), env);
    assert.equal(response.status, 200);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
