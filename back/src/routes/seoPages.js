const express = require('express');
const router = express.Router();
const config = require('../config');
const products = require('../services/products');
const { resolveAssetUrl } = require('../utils/http');
const { isSeoIndexable, productPath, publicProductDescription } = require('../utils/productMeta');

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderProductPage(req, product) {
  const site = config.siteUrl || 'https://piter-jaluzi.ru';
  const path = productPath(product);
  const canonical = `${site}${path}`;
  const image = resolveAssetUrl(req, product.image);
  const title = `${product.name} | ${product.category} | Питер-Жалюзи`;
  const description = publicProductDescription(product).slice(0, 180);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description,
    image: image || undefined,
    category: product.category,
    brand: {
      '@type': 'Brand',
      name: 'Питер-Жалюзи'
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RUB',
      price: String(product.price),
      availability: product.in_stock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonical,
      seller: { '@id': `${site}/#business` }
    }
  };

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}" />
  <link rel="canonical" href="${escapeHtml(canonical)}" />
  <meta property="og:type" content="product" />
  <meta property="og:locale" content="ru_RU" />
  <meta property="og:site_name" content="Питер-Жалюзи" />
  <meta property="og:title" content="${escapeHtml(title)}" />
  <meta property="og:description" content="${escapeHtml(description)}" />
  <meta property="og:url" content="${escapeHtml(canonical)}" />
  ${image ? `<meta property="og:image" content="${escapeHtml(image)}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <link rel="icon" href="/icon.svg" type="image/svg+xml" />
  <link rel="stylesheet" href="/_astro/Footer.DfgdYFw5.css" />
  <style>
    :root { --color-primary:#2563EB; --color-text:#0F172A; --color-text-muted:#64748B; --color-bg:#F8FAFC; }
    body { margin:0; font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; color:var(--color-text); background:#fff; }
    .header { border-bottom:1px solid #E2E8F0; }
    .header-inner, .container { max-width:1100px; margin:0 auto; padding:1rem 1.25rem; }
    .header-inner { display:flex; align-items:center; justify-content:space-between; gap:1rem; }
    .header-logo { font-weight:700; text-decoration:none; color:var(--color-text); }
    .header-link { margin-left:1rem; color:var(--color-text-muted); text-decoration:none; }
    .product-wrap { display:grid; grid-template-columns:1.1fr 1fr; gap:2rem; padding:2rem 1.25rem 3rem; }
    @media (max-width:800px){ .product-wrap { grid-template-columns:1fr; } }
    .product-wrap img { width:100%; height:auto; max-height:480px; object-fit:cover; border-radius:0.75rem; background:#E2E8F0; }
    .category { color:var(--color-primary); font-size:0.85rem; font-weight:600; }
    h1 { font-size:clamp(1.5rem, 3vw, 2rem); margin:0.4rem 0 1rem; }
    .desc { color:var(--color-text-muted); line-height:1.7; margin:1rem 0 1.5rem; }
    .price { font-size:1.5rem; font-weight:700; color:var(--color-primary); margin-bottom:1.25rem; }
    .btn { display:inline-block; padding:0.85rem 1.25rem; border-radius:0.5rem; background:var(--color-primary); color:#fff; text-decoration:none; font-weight:600; border:0; cursor:pointer; }
    .btn-outline { background:#fff; color:var(--color-primary); border:1px solid #BFDBFE; margin-left:0.75rem; }
    footer { background:#0F172A; color:#94A3B8; padding:2rem 1.25rem; margin-top:2rem; }
    footer a { color:#93C5FD; text-decoration:none; }
  </style>
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a class="header-logo" href="/">🪟 Питер-Жалюзи</a>
      <nav>
        <a class="header-link" href="/">Главная</a>
        <a class="header-link" href="/catalog">Каталог</a>
        <a class="header-link" href="/works-reviews">Работы и отзывы</a>
      </nav>
    </div>
  </header>
  <main class="container product-wrap">
    <div>
      ${image ? `<img src="${escapeHtml(image)}" alt="${escapeHtml(product.name)}" width="800" height="600" />` : ''}
    </div>
    <div>
      <div class="category">${escapeHtml(product.category)}</div>
      <h1>${escapeHtml(product.name)}</h1>
      <p class="desc">${escapeHtml(description)}</p>
      <div class="price">от ${escapeHtml(product.price)} ₽/м²</div>
      <a class="btn" href="/catalog">Смотреть каталог</a>
      <a class="btn btn-outline" href="tel:+79877955569">Позвонить</a>
    </div>
  </main>
  <footer>
    <div class="container">
      <div>Питер-Жалюзи · Санкт-Петербург, Боровая 52А · <a href="tel:+79877955569">+79877955569</a></div>
    </div>
  </footer>
</body>
</html>`;
}

router.get('/sitemap.xml', (req, res) => {
  try {
    const site = (config.siteUrl || 'https://piter-jaluzi.ru').replace(/\/+$/, '');
    const staticPages = [
      { path: '/', changefreq: 'weekly', priority: '1.0' },
      { path: '/catalog', changefreq: 'daily', priority: '0.9' },
      { path: '/works-reviews', changefreq: 'weekly', priority: '0.8' }
    ];

    const indexable = products.getIndexable();
    const productUrls = indexable
      .map((product) => {
        const path = productPath(product);
        if (!path) return '';
        return `  <url><loc>${site}${path}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
      })
      .filter(Boolean);

    const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(({ path, changefreq, priority }) => `  <url><loc>${site}${path}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`).join('\n')}
${productUrls.join('\n')}
</urlset>
`;

    res
      .status(200)
      .type('application/xml')
      .send(body);
  } catch (e) {
    res.status(500).type('text/plain').send('Sitemap error');
  }
});

router.get('/catalog/p/:idOrSlug', (req, res) => {
  try {
    const product = products.getBySlugOrId(req.params.idOrSlug);
    if (!product || !isSeoIndexable(product)) {
      return res.status(404).type('html').send(`<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Не найдено</title></head><body><p>Товар не найден.</p><a href="/catalog">В каталог</a></body></html>`);
    }
    res
      .status(200)
      .type('html')
      .set('Cache-Control', 'public, max-age=300')
      .send(renderProductPage(req, product));
  } catch (e) {
    res.status(500).type('text/plain').send('Error');
  }
});

module.exports = router;
