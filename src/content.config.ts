import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import icon from 'astro-icon';

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    views: z.number().optional(),
    readMinutes: z.number().optional(),
    tableLayout: z.object({
      width: z.number().positive().max(100).default(100),
      minWidth: z.number().nonnegative().default(900),
      columns: z.array(z.number().positive().max(100)).min(1)
        .refine((columns) => Math.abs(columns.reduce((sum, width) => sum + width, 0) - 100) < 0.001, {
          message: '表格各列宽度的百分比总和必须为 100',
        }),
    }).optional(),
  }),
  integrations: [icon()],
});

export const collections = { posts };
