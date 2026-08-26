const express = require('express');
const router = express.Router();
const products = require('../services/products');
const { resolveAssetUrl } = require('../utils/http');
const { productPath, publicProductDescription } = require('../utils/productMeta');

function serializeProduct(req, product) {
  const slim = {
    id: String(product.id),
    name: product.name,
    category: product.category,
    price: product.price,
    description: publicProductDescription(product),
    image: resolveAssetUrl(req, product.image),
    in_stock: product.in_stock,
    source: product.source,
    indexable: product.indexable,
    path: productPath(product)
  };
  return slim;
}

function filterByCategory(items, category) {
  const value = String(category || '').trim();
  if (!value || value === 'Все') {
    return items;
  }
  return items.filter((product) => product.category === value);
}

function filterByQuery(items, query) {
  const needle = String(query || '').trim().toLowerCase();
  if (!needle) {
    return items;
  }
  return items.filter((product) => {
    const haystack = `${product.name} ${product.category} ${product.description}`.toLowerCase();
    return haystack.includes(needle);
  });
}

router.get('/', (req, res) => {
  try {
    let data = products.getAll().map((product) => serializeProduct(req, product));
    data = filterByCategory(data, req.query.category);
    data = filterByQuery(data, req.query.q);
    res.json({ success: true, data, meta: { count: data.length } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/:id', (req, res) => {
  try {
    const product = products.getById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    res.json({ success: true, data: serializeProduct(req, product) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
