import { stat } from 'node:fs/promises';
import { getCollection } from 'astro:content';

export function postExcerpt(body: string, limit = 260) {
  const text = body
    .replace(/```[\s\S]*?```|~~~[\s\S]*?~~~/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/^(?:\s{0,3}#{1,6}\s+|\s{0,3}>\s*|\s*[-*+]\s+|\s*\d+[.)]\s+)/gm, '')
    .replace(/^[\s|:-]+$/gm, ' ')
    .replace(/[|*_`~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const characters = Array.from(text);
  return characters.length > limit ? `${characters.slice(0, limit).join('')}…` : text;
}

export async function getPosts() {
  const posts = await getCollection('posts');

  return Promise.all(posts.map(async (post) => {
    if (post.data.updated !== undefined) return post;
    if (!post.filePath) {
      throw new Error(`Missing source file path for post: ${post.id}`);
    }

    const { mtime } = await stat(post.filePath);
    return { ...post, data: { ...post.data, updated: mtime } };
  }));
}
