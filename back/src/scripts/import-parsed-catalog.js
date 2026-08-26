#!/usr/bin/env node
/**
 * Import Intersklad parser output into the live SQLite catalog.
 * Replaces only parser-sourced rows; manual/SEO products are preserved.
 *
 * Usage inside the api container (after docker cp of json + images):
 *   PARSED_JSON=/tmp/parsed-catalog.json \
 *   PARSED_IMAGES=/var/data/jaluzi/uploads/products/parser \
 *   node src/scripts/import-parsed-catalog.js
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { getDb, initDb } = require('../database/initDb');
const config = require('../config');
const { SOURCE_PARSER } = require('../utils/productMeta');
const { resizeImageFile } = require('../utils/imageResize');

const CATEGORY_MAP = {
  'tkani-vertikalnye': 'Вертикальные',
  lenta: 'Горизонтальные',
  'tkani-rulonnye': 'Рулонные',
  plastik: 'Пластиковые',
  'tkani-rulonnye-zebra': 'Зебра'
};

const parsedJson = path.resolve(process.env.PARSED_JSON || '/tmp/parsed-catalog.json');
const parsedImages = path.resolve(
  process.env.PARSED_IMAGES || path.join(config.uploadsDir, 'products', 'parser')
);
const destDir = path.join(config.uploadsDir, 'products');

function stableId(linkFull, name) {
  return crypto
    .createHash('sha1')
    .update(String(linkFull || name || Math.random()))
    .digest('hex')
    .slice(0, 12);
}

function mapCategory(raw) {
  return CATEGORY_MAP[String(raw || '').trim()] || String(raw || 'Другое');
}

function copyImage(record) {
  const basename = record.localPath ? path.basename(record.localPath) : '';
  if (basename) {
    const src = path.join(parsedImages, basename);
    if (fs.existsSync(src)) {
      fs.mkdirSync(destDir, { recursive: true });
      const destName = `is-${basename}`.replace(/\s+/g, '_');
      const dest = path.join(destDir, destName);
      resizeImageFile(src, dest);
      return `/uploads/products/${destName}`;
    }
  }

  if (record.imageFull && /^https?:\/\//i.test(record.imageFull)) {
    return record.imageFull;
  }

  return '';
}

function main() {
  if (!fs.existsSync(parsedJson)) {
    console.error('Missing parser JSON:', parsedJson);
    process.exit(1);
  }

  initDb();
  const raw = JSON.parse(fs.readFileSync(parsedJson, 'utf8'));
  const items = Array.isArray(raw) ? raw : [];
  if (!items.length) {
    console.error('Parser JSON is empty');
    process.exit(1);
  }

  fs.mkdirSync(destDir, { recursive: true });

  const db = getDb();
  const now = new Date().toISOString();
  const insert = db.prepare(
    'INSERT INTO products (id, name, category, price, description, image, in_stock, source, slug, created_at, updated_at) ' +
      'VALUES (@id, @name, @category, @price, @description, @image, @in_stock, @source, @slug, @created_at, @updated_at)'
  );

  const products = items
    .filter((item) => item && item.name)
    .map((item) => ({
      id: stableId(item.linkFull, item.name),
      name: String(item.name).trim().slice(0, 200),
      category: mapCategory(item.category),
      price: 1500,
      description: '',
      image: copyImage(item),
      in_stock: 1,
      source: SOURCE_PARSER,
      slug: null,
      created_at: now,
      updated_at: now
    }));

  const beforeManual = db
    .prepare("SELECT COUNT(*) AS c FROM products WHERE source != ?")
    .get(SOURCE_PARSER).c;

  const tx = db.transaction(() => {
    db.prepare('DELETE FROM products WHERE source = ?').run(SOURCE_PARSER);
    for (const product of products) {
      insert.run(product);
    }
  });
  tx();

  const count = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  const parserCount = db
    .prepare('SELECT COUNT(*) AS c FROM products WHERE source = ?')
    .get(SOURCE_PARSER).c;
  const manualCount = db
    .prepare('SELECT COUNT(*) AS c FROM products WHERE source != ?')
    .get(SOURCE_PARSER).c;
  const byCat = db
    .prepare('SELECT category, COUNT(*) AS c FROM products GROUP BY category ORDER BY c DESC')
    .all();
  console.log(`Imported ${parserCount} parser products (kept ${manualCount} manual, was ${beforeManual})`);
  console.log(`Total products: ${count}`);
  for (const row of byCat) {
    console.log(`  ${row.category}: ${row.c}`);
  }
}

main();
