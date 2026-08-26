const express = require('express');
const router = express.Router();
const products = require('../services/products');
const { resolveAssetUrl } = require('../utils/http');
const { productPath } = require('../utils/productMeta');

function serializeProduct(req, product) {
  return {
    ...product,
    image: resolveAssetUrl(req, product.image),
    path: productPath(product)
  };
}

router.get('/', (req, res) => {
  try {
    const data = products.getAll().map((product) => serializeProduct(req, product));
    res.json({ success: true, data });
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
