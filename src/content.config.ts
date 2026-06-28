import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 글은 src/posts/*.md. glob 로더의 entry id = 파일명(슬러그)이라 기존 URL과 동일.
const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    category: z.string(),
    image: z.string().optional(),
    author: z.string().optional(),
    draft: z.boolean().default(false),
    layout: z.string().optional(),
    series: z.string().optional(),
    seriesOrder: z.number().optional(),
  }),
});

export const collections = { blog };
