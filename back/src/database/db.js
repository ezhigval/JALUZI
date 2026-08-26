const { getDb } = require('./initDb');
const {
  SOURCE_MANUAL,
  SOURCE_PARSER,
  normalizeSource,
  buildProductSlug,
  createManualProductId,
  isSeoIndexable
} = require('../utils/productMeta');

function normalizeProductRow(row) {
  if (!row) return null;
  return {
    ...row,
    in_stock: !!row.in_stock,
    source: normalizeSource(row.source),
    slug: row.slug || null,
    indexable: isSeoIndexable(row)
  };
}

// === PRODUCTS ===
module.exports.getAllProducts = () => {
  const db = getDb();
  return db.prepare('SELECT * FROM products ORDER BY created_at DESC, id').all().map(normalizeProductRow);
};

module.exports.getIndexableProducts = () => {
  const db = getDb();
  return db
    .prepare("SELECT * FROM products WHERE source != ? ORDER BY created_at DESC, id")
    .all(SOURCE_PARSER)
    .map(normalizeProductRow);
};

module.exports.getProductById = (id) => {
  const db = getDb();
  return normalizeProductRow(db.prepare('SELECT * FROM products WHERE id = ?').get(String(id)));
};

module.exports.getProductBySlugOrId = (value) => {
  const db = getDb();
  const key = decodeURIComponent(String(value || '')).trim();
  if (!key) return null;
  const bySlug = db.prepare('SELECT * FROM products WHERE slug = ?').get(key);
  if (bySlug) return normalizeProductRow(bySlug);
  return normalizeProductRow(db.prepare('SELECT * FROM products WHERE id = ?').get(key));
};

module.exports.createProduct = (data) => {
  const db = getDb();
  const now = new Date().toISOString();
  const source = normalizeSource(data.source || SOURCE_MANUAL);
  const id = data.id ? String(data.id) : createManualProductId();
  const product = {
    id,
    name: data.name,
    category: data.category,
    price: Number(data.price),
    description: data.description || '',
    image: data.image || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    in_stock: data.in_stock !== false ? 1 : 0,
    source,
    slug: source === SOURCE_PARSER ? null : (data.slug || buildProductSlug(data.name, id)),
    created_at: now,
    updated_at: null
  };
  db.prepare(
    'INSERT INTO products (id, name, category, price, description, image, in_stock, source, slug, created_at, updated_at) ' +
    'VALUES (@id, @name, @category, @price, @description, @image, @in_stock, @source, @slug, @created_at, @updated_at)'
  ).run(product);
  return normalizeProductRow(product);
};

module.exports.updateProduct = (id, data) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(String(id));
  if (!existing) return null;

  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.category !== undefined) updates.category = data.category;
  if (data.price !== undefined) updates.price = Number(data.price);
  if (data.description !== undefined) updates.description = data.description;
  if (data.image !== undefined) updates.image = data.image;
  if (data.in_stock !== undefined) updates.in_stock = data.in_stock ? 1 : 0;
  if (data.inStock !== undefined) updates.in_stock = data.inStock ? 1 : 0;
  if (data.source !== undefined) updates.source = normalizeSource(data.source);
  if (data.slug !== undefined) updates.slug = data.slug || null;
  updates.updated_at = new Date().toISOString();

  const nextSource = updates.source || existing.source;
  if (normalizeSource(nextSource) !== SOURCE_PARSER && !existing.slug && updates.slug === undefined) {
    updates.slug = buildProductSlug(updates.name || existing.name, existing.id);
  }
  if (normalizeSource(nextSource) === SOURCE_PARSER) {
    updates.slug = null;
  }

  const keys = Object.keys(updates);
  if (keys.length === 0) return normalizeProductRow(existing);

  const setClause = keys.map(k => `${k} = @${k}`).join(', ');
  const stmt = db.prepare(`UPDATE products SET ${setClause} WHERE id = @id`);
  stmt.run({ ...updates, id: String(id) });

  const updated = db.prepare('SELECT * FROM products WHERE id = ?').get(String(id));
  return normalizeProductRow(updated);
};

module.exports.deleteProduct = (id) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM products WHERE id = ?').run(String(id));
  return result.changes > 0;
};

// === ORDERS ===
module.exports.createOrder = (data) => {
  const db = getDb();
  const blindsType = data.blindsType || data.blinds_type || '';
  const now = new Date().toISOString();
  const order = {
    id: Date.now(),
    name: data.name,
    phone: data.phone,
    blindsType,
    blinds_type: blindsType,
    message: data.message || '',
    created_at: now
  };
  db.prepare(
    'INSERT INTO orders (id, name, phone, blindsType, blinds_type, message, created_at) ' +
    'VALUES (@id, @name, @phone, @blindsType, @blinds_type, @message, @created_at)'
  ).run(order);
  return order;
};

module.exports.getAllOrders = () => {
  const db = getDb();
  return db.prepare('SELECT * FROM orders ORDER BY id').all();
};

// === REVIEWS ===
module.exports.getAllReviews = () => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all();
  return rows.map(r => ({
    ...r,
    photos: typeof r.photos === 'string' ? JSON.parse(r.photos) : r.photos
  }));
};

module.exports.createReview = (data) => {
  const db = getDb();
  const maxId = db.prepare('SELECT COALESCE(MAX(id), 0) as maxId FROM reviews').get();
  const newId = maxId.maxId + 1;
  const review = {
    id: newId,
    name: data.name,
    blindsType: data.blindsType,
    photos: Array.isArray(data.photos) ? JSON.stringify(data.photos) : '[]',
    comment: data.comment,
    rating: data.rating || 5,
    created_at: new Date().toISOString()
  };
  db.prepare(
    'INSERT INTO reviews (id, name, blindsType, photos, comment, rating, created_at) ' +
    'VALUES (@id, @name, @blindsType, @photos, @comment, @rating, @created_at)'
  ).run(review);
  return {
    ...review,
    photos: typeof review.photos === 'string' ? JSON.parse(review.photos) : review.photos
  };
};

module.exports.deleteReview = (id) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  return result.changes > 0;
};

// === WORKS ===
module.exports.getAllWorks = () => {
  const db = getDb();
  return db.prepare('SELECT * FROM works ORDER BY created_at DESC').all();
};

module.exports.createWork = (data) => {
  const db = getDb();
  const maxId = db.prepare('SELECT COALESCE(MAX(id), 0) as maxId FROM works').get();
  const newId = maxId.maxId + 1;
  const work = {
    id: newId,
    photo: data.photo,
    title: data.title || '',
    created_at: new Date().toISOString()
  };
  db.prepare(
    'INSERT INTO works (id, photo, title, created_at) ' +
    'VALUES (@id, @photo, @title, @created_at)'
  ).run(work);
  return work;
};

module.exports.deleteWork = (id) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM works WHERE id = ?').run(id);
  return result.changes > 0;
};

// === LEGACY API: readDb / writeDb ===
// For backwards compatibility with modules that still use readDb()
module.exports.readDb = () => {
  const db = getDb();
  return {
    products: db.prepare('SELECT * FROM products').all().map(p => ({ ...p, in_stock: !!p.in_stock })),
    orders: db.prepare('SELECT * FROM orders').all(),
    reviews: db.prepare('SELECT * FROM reviews').all().map(r => ({
      ...r,
      photos: typeof r.photos === 'string' ? JSON.parse(r.photos) : r.photos
    })),
    works: db.prepare('SELECT * FROM works').all()
  };
};

module.exports.writeDb = (data) => {
  // For now, this is a no-op since SQLite doesn't need it
  // In the future, could be used for bulk operations
  console.warn('writeDb() is deprecated with SQLite backend');
};

require('./seed').seed();
console.log('✅ SQLite Database initialized');
