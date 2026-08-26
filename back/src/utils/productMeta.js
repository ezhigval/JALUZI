const crypto = require('crypto');

const SOURCE_PARSER = 'parser';
const SOURCE_MANUAL = 'manual';

function normalizeSource(value) {
  return String(value || '').trim().toLowerCase() === SOURCE_PARSER
    ? SOURCE_PARSER
    : SOURCE_MANUAL;
}

function isParserSource(value) {
  return normalizeSource(value) === SOURCE_PARSER;
}

function isSeoIndexable(product) {
  return !isParserSource(product?.source);
}

function looksLikeParsedProduct(product) {
  const image = String(product?.image || '');
  const description = String(product?.description || '');
  return (
    /(?:^|\/)is-/i.test(image) ||
    /intersklad/i.test(description) ||
    /intersklad/i.test(image)
  );
}

function slugifyName(name) {
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
    ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya'
  };

  return String(name || '')
    .toLowerCase()
    .split('')
    .map((ch) => map[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'tovar';
}

function buildProductSlug(name, id) {
  return `${slugifyName(name)}-${String(id)}`;
}

function createManualProductId() {
  return `m${Date.now().toString(36)}${crypto.randomBytes(2).toString('hex')}`;
}

function productPath(product) {
  if (!isSeoIndexable(product)) {
    return null;
  }
  const key = product.slug || String(product.id);
  return `/catalog/p/${encodeURIComponent(key)}`;
}

function isInterskladUrl(value) {
  const text = String(value || '').trim();
  return /^https?:\/\//i.test(text) && /intersklad/i.test(text);
}

function isUrlOnlyDescription(value) {
  const text = String(value || '').trim();
  return /^https?:\/\//i.test(text);
}

function parserDescriptionFallback(product) {
  const category = String(product?.category || 'Жалюзи').trim();
  return `${category} на заказ в Санкт-Петербурге. Бесплатный замер, профессиональный монтаж, гарантия 1 год.`;
}

function publicProductDescription(product) {
  const raw = String(product?.description || '').trim();
  if (!raw || isInterskladUrl(raw) || (isParserSource(product?.source) && isUrlOnlyDescription(raw))) {
    return parserDescriptionFallback(product);
  }
  return raw;
}

module.exports = {
  SOURCE_PARSER,
  SOURCE_MANUAL,
  normalizeSource,
  isParserSource,
  isSeoIndexable,
  looksLikeParsedProduct,
  buildProductSlug,
  createManualProductId,
  productPath,
  isInterskladUrl,
  isUrlOnlyDescription,
  parserDescriptionFallback,
  publicProductDescription
};
