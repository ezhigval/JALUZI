const { getDb } = require('./initDb');

function toPublicId(id) {
  const n = Number(id);
  return Number.isFinite(n) ? n : id;
}

function mapProduct(row) {
  if (!row) return null;
  return { ...row, id: toPublicId(row.id), in_stock: !!row.in_stock };
}

function mapReview(row) {
  if (!row) return null;
  return {
    ...row,
    id: toPublicId(row.id),
    photos: typeof row.photos === 'string' ? JSON.parse(row.photos) : row.photos
  };
}

function mapWork(row) {
  if (!row) return null;
  return { ...row, id: toPublicId(row.id) };
}

function lookupById(table, id) {
  const allowed = new Set(['products', 'reviews', 'works', 'orders']);
  if (!allowed.has(table)) {
    throw new Error('Invalid table');
  }
  const db = getDb();
  const numeric = toPublicId(id);
  return db.prepare(`SELECT * FROM ${table} WHERE id = ? OR CAST(id AS TEXT) = ?`).get(numeric, String(numeric));
}

function deleteById(table, id) {
  const row = lookupById(table, id);
  if (!row) return false;
  const db = getDb();
  const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(row.id);
  return result.changes > 0;
}

// === PRODUCTS ===
module.exports.getAllProducts = () => {
  const db = getDb();
  return db.prepare('SELECT * FROM products ORDER BY CAST(id AS INTEGER), id').all().map(mapProduct);
};

module.exports.getProductById = (id) => {
  return mapProduct(lookupById('products', id));
};

module.exports.createProduct = (data) => {
  const db = getDb();
  const maxId = db.prepare('SELECT COALESCE(MAX(CAST(id AS INTEGER)), 0) as maxId FROM products').get();
  const newId = maxId.maxId + 1;
  const now = new Date().toISOString();
  const product = {
    id: newId,
    name: data.name,
    category: data.category,
    price: Number(data.price),
    description: data.description || '',
    image: data.image || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    in_stock: data.in_stock !== false ? 1 : 0,
    created_at: now,
    updated_at: null
  };
  db.prepare(
    'INSERT INTO products (id, name, category, price, description, image, in_stock, created_at, updated_at) ' +
    'VALUES (@id, @name, @category, @price, @description, @image, @in_stock, @created_at, @updated_at)'
  ).run(product);
  // Normalize back to boolean for backward compatibility
  return { ...product, in_stock: !!product.in_stock };
};

module.exports.updateProduct = (id, data) => {
  const db = getDb();
  const existing = lookupById('products', id);
  if (!existing) return null;

  const updates = {};
  if (data.name !== undefined) updates.name = data.name;
  if (data.category !== undefined) updates.category = data.category;
  if (data.price !== undefined) updates.price = Number(data.price);
  if (data.description !== undefined) updates.description = data.description;
  if (data.image !== undefined) updates.image = data.image;
  if (data.in_stock !== undefined) updates.in_stock = data.in_stock ? 1 : 0;
  if (data.inStock !== undefined) updates.in_stock = data.inStock ? 1 : 0;
  updates.updated_at = new Date().toISOString();

  const keys = Object.keys(updates);
  if (keys.length === 0) return mapProduct(existing);

  const setClause = keys.map(k => `${k} = @${k}`).join(', ');
  const stmt = db.prepare(`UPDATE products SET ${setClause} WHERE id = @id`);
  stmt.run({ ...updates, id: existing.id });

  return mapProduct(lookupById('products', existing.id));
};

module.exports.deleteProduct = (id) => {
  return deleteById('products', id);
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
  return db.prepare('SELECT * FROM reviews ORDER BY created_at DESC').all().map(mapReview);
};

module.exports.createReview = (data) => {
  const db = getDb();
  const maxId = db.prepare('SELECT COALESCE(MAX(CAST(id AS INTEGER)), 0) as maxId FROM reviews').get();
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
  return deleteById('reviews', id);
};

// === WORKS ===
module.exports.getAllWorks = () => {
  const db = getDb();
  return db.prepare('SELECT * FROM works ORDER BY created_at DESC').all().map(mapWork);
};

module.exports.createWork = (data) => {
  const db = getDb();
  const maxId = db.prepare('SELECT COALESCE(MAX(CAST(id AS INTEGER)), 0) as maxId FROM works').get();
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
  return deleteById('works', id);
};

// === LEGACY API: readDb / writeDb ===
// For backwards compatibility with modules that still use readDb()
module.exports.readDb = () => {
  const db = getDb();
  return {
    products: db.prepare('SELECT * FROM products').all().map(mapProduct),
    orders: db.prepare('SELECT * FROM orders').all().map((row) => ({ ...row, id: toPublicId(row.id) })),
    reviews: db.prepare('SELECT * FROM reviews').all().map(mapReview),
    works: db.prepare('SELECT * FROM works').all().map(mapWork)
  };
};

module.exports.writeDb = (data) => {
  // For now, this is a no-op since SQLite doesn't need it
  // In the future, could be used for bulk operations
  console.warn('writeDb() is deprecated with SQLite backend');
};

require('./seed').seed();
console.log('✅ SQLite Database initialized');
