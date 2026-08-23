const siteUrl = (import.meta.env.SITE_URL || 'https://piter-jaluzi.ru').replace(/\/+$/, '');

const pages = [
  { path: '/', changefreq: 'weekly', priority: '1.0' },
  { path: '/catalog', changefreq: 'daily', priority: '0.9' },
  { path: '/works-reviews', changefreq: 'weekly', priority: '0.8' }
];

export function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(({ path, changefreq, priority }) => `  <url><loc>${siteUrl}${path}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`).join('\n')}
</urlset>
`;

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8'
    }
  });
}
