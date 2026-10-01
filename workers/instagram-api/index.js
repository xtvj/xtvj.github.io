const FIELDS = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count';

function corsHeaders(origin, allowedOrigin) {
  const allowed = new Set([allowedOrigin, 'http://localhost:4321', 'http://127.0.0.1:4321']);
  return {
    'Access-Control-Allow-Origin': allowed.has(origin) ? origin : allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const headers = corsHeaders(origin, env.ALLOWED_ORIGIN || 'https://xtvj.github.io');

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'GET' || url.pathname !== '/api/instagram') {
      return Response.json({ error: 'Not found' }, { status: 404, headers });
    }
    if (origin && headers['Access-Control-Allow-Origin'] !== origin) {
      return Response.json({ error: 'Origin not allowed' }, { status: 403, headers });
    }
    if (!env.INSTAGRAM_ACCESS_TOKEN) {
      return Response.json({ error: 'Instagram API is not configured.' }, { status: 503, headers });
    }

    const cache = caches.default;
    const cacheKey = new Request(new URL('/api/instagram', url.origin).toString(), { method: 'GET' });
    const cached = await cache.match(cacheKey);
    if (cached) {
      const responseHeaders = new Headers(cached.headers);
      for (const [key, value] of Object.entries(headers)) responseHeaders.set(key, value);
      return new Response(cached.body, { status: cached.status, headers: responseHeaders });
    }

    try {
      const version = env.GRAPH_API_VERSION || 'v25.0';
      const profileResponse = await fetch('https://graph.instagram.com/' + version + '/me?fields=user_id,username,account_type', {
        headers: { Authorization: 'Bearer ' + env.INSTAGRAM_ACCESS_TOKEN },
      });
      const profile = await profileResponse.json();
      if (!profileResponse.ok || profile.error) throw new Error(profile.error?.message || 'Instagram profile request failed.');
      if (profile.username?.toLowerCase() !== 'xtvjdev') throw new Error('Configured token is not for @xtvjdev.');

      const mediaUrl = new URL('https://graph.instagram.com/' + version + '/' + profile.user_id + '/media');
      mediaUrl.searchParams.set('fields', FIELDS);
      mediaUrl.searchParams.set('limit', '30');
      const mediaResponse = await fetch(mediaUrl, { headers: { Authorization: 'Bearer ' + env.INSTAGRAM_ACCESS_TOKEN } });
      const media = await mediaResponse.json();
      if (!mediaResponse.ok || media.error) throw new Error(media.error?.message || 'Instagram media request failed.');

      const payload = {
        username: profile.username,
        fetchedAt: new Date().toISOString(),
        posts: (media.data || []).map((post) => ({
          id: post.id,
          caption: post.caption || '',
          mediaType: post.media_type,
          imageUrl: post.media_type === 'VIDEO' || post.media_type === 'REELS' ? post.thumbnail_url : post.media_url,
          permalink: post.permalink,
          timestamp: post.timestamp,
          likes: post.like_count ?? null,
          comments: post.comments_count ?? null,
        })),
      };
      const responseHeaders = new Headers({
        ...headers,
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=60',
      });
      const response = new Response(JSON.stringify(payload), { headers: responseHeaders });
      ctx.waitUntil(cache.put(cacheKey, response.clone()));
      return response;
    } catch (error) {
      return Response.json({ error: error.message || 'Instagram request failed.' }, { status: 502, headers });
    }
  },
};
