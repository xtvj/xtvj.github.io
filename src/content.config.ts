import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import icon from 'astro-icon';

const tableLayoutSchema = z.object({
  width: z.number().positive().max(100).default(100),
  minWidth: z.number().nonnegative().default(900),
  columns: z.array(z.number().positive().max(100)).min(1)
    .refine((columns) => Math.abs(columns.reduce((sum, width) => sum + width, 0) - 100) < 0.001, {
      message: '表格各列宽度的百分比总和必须为 100',
    }),
});

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    date: z.preprocess(parsePostDate, z.coerce.date()),
    updated: z.preprocess((value) => value === undefined ? undefined : parsePostDate(value), z.coerce.date().optional()),
    tags: z.array(z.string()).default([]),
    views: z.number().optional(),
    readMinutes: z.number().optional(),
    tableLayout: tableLayoutSchema.optional(),
  }).catchall(z.unknown()).superRefine((data, context) => {
    for (const [key, value] of Object.entries(data)) {
      if (!/^tableLayout(?:[2-9]|[1-9]\d+)$/.test(key)) continue;
      const result = tableLayoutSchema.safeParse(value);
      if (!result.success) {
        for (const issue of result.error.issues) {
          context.addIssue({ ...issue, path: [key, ...issue.path] });
        }
      }
    }
  }),
  integrations: [icon()],
});

function parsePostDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split('-').map(Number);
  const target = Date.UTC(year, month - 1, day);
  let timestamp = target + 8 * 60 * 60 * 1000;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: 'numeric', day: 'numeric',
    hour: 'numeric', minute: 'numeric', second: 'numeric', hourCycle: 'h23',
  });
  for (let attempt = 0; attempt < 2; attempt++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(timestamp)).map(({ type, value }) => [type, Number(value)]));
    const represented = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second);
    timestamp += target - represented;
  }
  return new Date(timestamp);
}

export const collections = { posts };
