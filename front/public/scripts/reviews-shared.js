import { escapeHtml } from '/scripts/api.js';

export function formatReviewDate(date) {
  try {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return '';
  }
}

export function renderReviewCards(reviews) {
  return reviews.map((review) => {
    const name = escapeHtml(review.name);
    const blindsType = escapeHtml(review.blindsType);
    const comment = escapeHtml(review.comment);
    const rating = Math.max(1, Math.min(5, Number(review.rating) || 5));
    const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
    const date = formatReviewDate(review.created_at);

    return `
      <article class="review-card">
        <div class="review-card-header">
          <div class="review-card-avatar" aria-hidden="true">${name.charAt(0).toUpperCase()}</div>
          <div class="review-card-meta">
            <div class="review-card-name">${name}</div>
            <div class="review-card-type">${blindsType}</div>
            ${date ? `<div class="review-card-date">${date}</div>` : ''}
          </div>
        </div>
        <div class="review-card-rating" aria-label="Оценка ${rating} из 5">${stars}</div>
        <p class="review-card-comment">${comment}</p>
      </article>
    `;
  }).join('');
}

export function buildReviewsJsonLd(reviews, siteUrl) {
  if (!reviews.length) {
    return null;
  }

  const ratings = reviews.map((r) => Number(r.rating) || 5);
  const avg = ratings.reduce((sum, value) => sum + value, 0) / ratings.length;

  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${siteUrl}/#business`,
    name: 'Питер-Жалюзи',
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: avg.toFixed(1),
      reviewCount: String(reviews.length),
      bestRating: '5',
      worstRating: '1'
    },
    review: reviews.slice(0, 5).map((review) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: review.name },
      reviewRating: {
        '@type': 'Rating',
        ratingValue: String(review.rating || 5),
        bestRating: '5',
        worstRating: '1'
      },
      reviewBody: review.comment,
      datePublished: review.created_at || undefined
    }))
  };
}

export function injectReviewsJsonLd(reviews) {
  const siteUrl = window.location.origin.replace(/\/+$/, '');
  const payload = buildReviewsJsonLd(reviews, siteUrl);
  if (!payload) {
    return;
  }

  let node = document.getElementById('reviews-jsonld');
  if (!node) {
    node = document.createElement('script');
    node.id = 'reviews-jsonld';
    node.type = 'application/ld+json';
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(payload);
}
