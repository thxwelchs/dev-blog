import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// 글은 src/posts/*.md. entry id = 파일명 그대로라 기존 URL과 동일.
const blog = defineCollection({
  // 기본 generateId는 소문자·슬러그화해서(/AOP/ → /aop/) 옛 URL이 404가 된다.
  // GitHub Pages는 대소문자를 구분하므로 파일명을 그대로 id(=URL)로 쓴다.
  loader: glob({
    pattern: '*.md',
    base: './src/posts',
    generateId: ({ entry }) => entry.replace(/\.md$/, ''),
  }),
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
