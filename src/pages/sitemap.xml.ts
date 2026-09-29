import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

const SITE = 'https://thxwelchs.github.io';

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const GET: APIRoute = async () => {
  const posts = (await getCollection('blog', ({ data }) => !data.draft)).sort(
    (a, b) => +b.data.date - +a.data.date,
  );
  const categories = [...new Set(posts.map(p => p.data.category))];

  const urls: { loc: string; lastmod?: string }[] = [
    { loc: `${SITE}/`, lastmod: posts[0]?.data.date.toISOString() },
    { loc: `${SITE}/about/` },
    { loc: `${SITE}/series/` },
    { loc: `${SITE}/tags/` },
    ...categories.map(c => ({ loc: `${SITE}/category/${encodeURIComponent(c)}/` })),
    ...posts.map(p => ({
      loc: `${SITE}/${encodeURIComponent(p.id)}/`,
      lastmod: p.data.date.toISOString(),
    })),
  ];

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(u =>
        `  <url><loc>${esc(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`,
      )
      .join('\n') +
    '\n</urlset>\n';

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
