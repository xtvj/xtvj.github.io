import type { CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;

export function sortPosts(posts: Post[]) {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function postHref(slug: string) {
  return `${import.meta.env.BASE_URL}posts/${encodeURIComponent(slug)}/`;
}

export function tagHref(tag: string) {
  return `${import.meta.env.BASE_URL}tags/${encodeURIComponent(tag)}/`;
}

export function pageHref(page: number) {
  return page === 1 ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}page/${page}/`;
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date).replaceAll('/', '.');
}
