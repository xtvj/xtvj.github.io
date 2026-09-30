import type { APIRoute } from 'astro';
import { getPosts } from '../lib/posts';
import { postHref, sortPosts } from '../lib/site';

export const GET: APIRoute = async () => {
  const posts = sortPosts(await getPosts());
  const index = posts.map(({ data }) => ({
    title: data.title,
    tags: data.tags,
    date: data.date.toISOString(),
    href: postHref(data.slug),
  }));

  return new Response(JSON.stringify(index), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
