const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const apiUrl = process.env.PUBLIC_INSTAGRAM_API_URL;
const version = process.env.INSTAGRAM_API_VERSION || 'v25.0';
const output = new URL('../public/instagram/posts.json', import.meta.url);
const mediaDir = new URL('../public/instagram/media/', import.meta.url);
if (!token) {
  if (!apiUrl) {
    console.log('Instagram sync skipped: neither INSTAGRAM_ACCESS_TOKEN nor PUBLIC_INSTAGRAM_API_URL is set.');
    process.exit(0);
  }
  try {
    const endpoint = new URL(apiUrl);
    endpoint.pathname = endpoint.pathname.replace(/\/+$/, '');
    if (!endpoint.pathname || endpoint.pathname === '/') endpoint.pathname = '/api/instagram';
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(15000) });
    const feed = await response.json();
    if (!response.ok || feed.error) throw new Error(feed.error || 'Instagram API HTTP ' + response.status);
    if (!Array.isArray(feed.posts) || feed.posts.length === 0) {
      throw new Error('Cloudflare Worker returned 0 Instagram posts. Check its token and Instagram permissions.');
    }
    const { mkdir, writeFile } = await import('node:fs/promises');
    await mkdir(new URL('../public/instagram/', import.meta.url), { recursive: true });
    const cachedFeed = {
      ...feed,
      posts: feed.posts.map(({ imageUrl, ...post }) => ({ ...post, image: imageUrl || post.image || null })),
    };
    await writeFile(output, JSON.stringify(cachedFeed, null, 2) + '\n');
    console.log('Instagram sync complete from Cloudflare Worker: ' + feed.posts.length + ' posts saved.');
  } catch (error) {
    console.error('Instagram Worker sync failed: ' + error.message);
    process.exitCode = 1;
  }
  process.exit();
}
const fields = 'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp,username,like_count,comments_count';
async function getJson(url) {
  const response = await fetch(url, { headers: { Authorization: 'Bearer ' + token } });
  const json = await response.json();
  if (!response.ok || json.error) throw new Error(json.error?.message || 'Instagram API HTTP ' + response.status);
  return json;
}
try {
  const profile = await getJson('https://graph.instagram.com/' + version + '/me?fields=user_id,username,account_type');
  if (profile.username?.toLowerCase() !== 'xtvjdev') throw new Error('Token belongs to @' + (profile.username || 'unknown') + ', expected @xtvjdev.');
  const posts = [];
  let next = 'https://graph.instagram.com/' + version + '/' + profile.user_id + '/media?fields=' + encodeURIComponent(fields) + '&limit=50';
  while (next && posts.length < 200) {
    const page = await getJson(next);
    posts.push(...(page.data || []));
    next = page.paging?.next || null;
  }
  const { mkdir, writeFile } = await import('node:fs/promises');
  await mkdir(mediaDir, { recursive: true });
  const result = [];
  for (const post of posts.slice(0, 200)) {
    const video = post.media_type === 'VIDEO' || post.media_type === 'REELS';
    const source = video ? post.thumbnail_url : post.media_url;
    let image = null;
    if (source) {
      const ext = video ? 'jpg' : (new URL(source).pathname.split('.').pop()?.match(/^[a-z0-9]{2,5}$/i)?.[0] || 'jpg');
      const filename = post.id.replace(/[^a-zA-Z0-9_-]/g, '') + '.' + ext;
      const response = await fetch(source);
      if (response.ok) {
        await writeFile(new URL(filename, mediaDir), new Uint8Array(await response.arrayBuffer()));
        image = '/instagram/media/' + filename;
      }
    }
    result.push({ id: post.id, caption: post.caption || '', mediaType: post.media_type, image, permalink: post.permalink, timestamp: post.timestamp, likes: post.like_count ?? null, comments: post.comments_count ?? null });
  }
  await writeFile(output, JSON.stringify({ username: profile.username, fetchedAt: new Date().toISOString(), posts: result }, null, 2) + '\n');
  console.log('Instagram sync complete: ' + result.length + ' posts saved.');
} catch (error) {
  console.error('Instagram sync failed: ' + error.message);
  process.exitCode = 1;
}
