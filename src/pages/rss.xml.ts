import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { excerpt } from '../lib/text';

const SITE = 'https://thxwelchs.github.io';

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft))
    .sort((a, b) => +b.data.date - +a.data.date)
    .slice(0, 30);

  const items = posts
    .map(p => {
      const url = `${SITE}/${encodeURI(p.id)}/`;
      return [
        '    <item>',
        `      <title>${esc(p.data.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${p.data.date.toUTCString()}</pubDate>`,
        `      <description>${esc(excerpt(p.body, 300))}</description>`,
        ...p.data.tags.map(t => `      <category>${esc(t)}</category>`),
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
    '  <channel>\n' +
    '    <title>thxwelchs</title>\n' +
    `    <link>${SITE}/</link>\n` +
    '    <description>끄적끄적</description>\n' +
    '    <language>ko</language>\n' +
    `    <atom:link href="${SITE}/rss.xml" rel="self" type="application/rss+xml" />\n` +
    items +
    '\n  </channel>\n</rss>\n';

  return new Response(body, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
};
