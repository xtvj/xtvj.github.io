import { stat } from 'node:fs/promises';
import { getCollection } from 'astro:content';

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
