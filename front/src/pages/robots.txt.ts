const siteUrl = (import.meta.env.SITE_URL || 'https://piter-jaluzi.ru').replace(/\/+$/, '');

export function GET() {
  return new Response(
    `User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ${siteUrl}/sitemap.xml\n`,
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8'
      }
    }
  );
}
