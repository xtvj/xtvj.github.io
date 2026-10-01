import { getPosts } from '../lib/posts';
import { sortPosts } from '../lib/site';

const site = 'https://xtvj.github.io';

function escapeXml(value: string) {
  return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export async function GET() {
  const posts = sortPosts(await getPosts());
  const updated = posts[0]?.data.updated ?? posts[0]?.data.date ?? new Date(0);
  const entries = posts.map((post) => {
    const url = `${site}/posts/${encodeURIComponent(post.data.slug)}/`;
    const published = post.data.date.toISOString();
    const modified = (post.data.updated ?? post.data.date).toISOString();
    return `  <entry>\n    <title>${escapeXml(post.data.title)}</title>\n    <id>${escapeXml(url)}</id>\n    <link href="${escapeXml(url)}" />\n    <published>${published}</published>\n    <updated>${modified}</updated>\n    <summary>${escapeXml(post.data.tags.join(' · '))}</summary>\n  </entry>`;
  }).join('\n');

  return new Response(`<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>XTVJ 的博客</title>\n  <id>${site}/</id>\n  <link href="${site}/" />\n  <link href="${site}/atom.xml" rel="self" />\n  <updated>${updated.toISOString()}</updated>\n${entries}\n</feed>`, {
    headers: { 'Content-Type': 'application/atom+xml; charset=utf-8' },
  });
}