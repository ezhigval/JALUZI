const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { resolveAssetUrl } = require('../utils/http');
const {
  normalizeBlindsType,
  parseRating,
  sanitizeLongText,
  sanitizeStringArray,
  sanitizeText
} = require('../utils/sanitize');

function serializeReview(req, review) {
  return {
    ...review,
    id: Number.isFinite(Number(review.id)) ? Number(review.id) : review.id,
    photos: (review.photos || []).map((photo) => resolveAssetUrl(req, photo))
  };
}

function serializeWork(req, work, fallbackPhoto = '') {
  return {
    ...work,
    id: Number.isFinite(Number(work.id)) ? Number(work.id) : work.id,
    photo: resolveAssetUrl(req, work.photo || fallbackPhoto)
  };
}

router.get('/', (req, res) => {
  try {
    const reviews = db.getAllReviews().map((review) => serializeReview(req, review));
    res.json({ success: true, data: reviews });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, blindsType, photos, comment, rating } = req.body;
    const sanitizedBlindsType = normalizeBlindsType(blindsType);
    const sanitizedComment = sanitizeLongText(comment, 2000);
    const sanitizedPhotos = sanitizeStringArray(photos, 6, 1000);
    const sanitizedRating = parseRating(rating) || 5;

    if (!name || !sanitizedBlindsType || !sanitizedComment) {
      return res.status(400).json({ success: false, error: 'Required: name, blindsType, comment' });
    }

    const review = db.createReview({
      name: sanitizeText(name, 120),
      blindsType: sanitizedBlindsType,
      photos: sanitizedPhotos,
      comment: sanitizedComment,
      rating: sanitizedRating
    });

    res.status(201).json({ success: true, data: serializeReview(req, review) });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

router.get('/works', (req, res) => {
  try {
    const products = db.getAllProducts();
    const fallbackPhoto = products[0]?.image || '';
    const works = db.getAllWorks().map((work) => serializeWork(req, work, fallbackPhoto));
    res.json({ success: true, data: works });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

module.exports = router;
