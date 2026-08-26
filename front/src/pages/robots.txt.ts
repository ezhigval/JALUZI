const siteUrl = (import.meta.env.SITE_URL || 'https://piter-jaluzi.ru').replace(/\/+$/, '');

export function GET() {
  const body = [
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /internal/',
    '',
    'User-agent: Yandex',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /internal/',
    'Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&yclid&gclid',
    '',
    'User-agent: Googlebot',
    'Allow: /',
    'Disallow: /admin/',
    'Disallow: /internal/',
    '',
    `# Preferred host for Yandex`,
    `Host: ${siteUrl.replace(/^https?:\/\//, '')}`,
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ''
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
}
