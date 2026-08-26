const fs = require('fs');
const os = require('os');
const path = require('path');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'piter-jaluzi-catalog-sort-'));
}

function assertManualBeforeParser(products, label) {
  let sawParser = false;
  products.forEach((product, index) => {
    if (product.source === 'parser') {
      sawParser = true;
    } else if (sawParser) {
      throw new Error(`${label}: manual product at index ${index} appears after parser products`);
    }
  });
}

async function main() {
  const tempRoot = createTempDir();
  const tempDataDir = path.join(tempRoot, 'data');
  const sourceDbPath = path.join(__dirname, 'data', 'db.json');
  const tempDbPath = path.join(tempDataDir, 'db.json');

  fs.mkdirSync(tempDataDir, { recursive: true });
  fs.writeFileSync(tempDbPath, JSON.stringify({ products: [], orders: [], reviews: [], works: [] }), 'utf8');

  process.env.DB_PATH = tempDbPath;

  delete require.cache[require.resolve('./src/database/db')];
  delete require.cache[require.resolve('./src/database/initDb')];
  const db = require('./src/database/db');
  const { getDb } = require('./src/database/initDb');

  getDb().exec('DELETE FROM products');

  const insert = (row) => {
    getDb().prepare(
      'INSERT INTO products (id, name, category, price, description, image, in_stock, source, slug, created_at, updated_at) ' +
      'VALUES (@id, @name, @category, @price, @description, @image, @in_stock, @source, @slug, @created_at, @updated_at)'
    ).run(row);
  };

  insert({
    id: 'parser-newer',
    name: 'Parsed newer',
    category: 'Рулонные',
    price: 1000,
    description: '',
    image: '',
    in_stock: 1,
    source: 'parser',
    slug: null,
    created_at: '2026-01-02T00:00:00.000Z',
    updated_at: null
  });
  insert({
    id: 'manual-older',
    name: 'Manual older',
    category: 'Рулонные',
    price: 1100,
    description: '',
    image: '',
    in_stock: 1,
    source: 'manual',
    slug: 'manual-older',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: null
  });
  insert({
    id: 'parser-older',
    name: 'Parsed older',
    category: 'Вертикальные',
    price: 900,
    description: '',
    image: '',
    in_stock: 1,
    source: 'parser',
    slug: null,
    created_at: '2025-12-01T00:00:00.000Z',
    updated_at: null
  });
  insert({
    id: 'manual-newer',
    name: 'Manual newer',
    category: 'Вертикальные',
    price: 1200,
    description: '',
    image: '',
    in_stock: 1,
    source: 'manual',
    slug: 'manual-newer',
    created_at: '2026-02-01T00:00:00.000Z',
    updated_at: null
  });

  const all = db.getAllProducts();
  assert(all.length === 4, 'expected 4 products in temp db');
  assertManualBeforeParser(all, 'getAllProducts');

  const manualProducts = all.filter((product) => product.source === 'manual');
  assert(manualProducts[0].id === 'manual-newer', 'manual group should stay sorted by created_at DESC');
  assert(manualProducts[1].id === 'manual-older', 'manual group should stay sorted by created_at DESC');

  const parserProducts = all.filter((product) => product.source === 'parser');
  assert(parserProducts[0].id === 'parser-newer', 'parser group should stay sorted by created_at DESC');
  assert(parserProducts[1].id === 'parser-older', 'parser group should stay sorted by created_at DESC');

  const roller = all.filter((product) => product.category === 'Рулонные');
  assertManualBeforeParser(roller, 'category filter order');
  assert(roller[0].source === 'manual', 'manual product should lead within category');

  console.log('✅ catalog sort: manual products appear before parser products');
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
