import { fetchJson } from '/scripts/api.js';
import { renderReviewCards, injectReviewsJsonLd } from '/scripts/reviews-shared.js';

export async function initHomepageReviews() {
  const grid = document.getElementById('homepage-reviews-grid');
  const state = document.getElementById('homepage-reviews-state');

  if (!grid || !state) {
    return;
  }

  try {
    const limit = Number(grid.dataset.limit || '3');
    const { data } = await fetchJson('/api/reviews');
    const reviews = Array.isArray(data) ? data.slice(0, limit) : [];

    if (!reviews.length) {
      state.textContent = 'Отзывы скоро появятся.';
      grid.hidden = true;
      return;
    }

    state.hidden = true;
    state.textContent = '';
    grid.hidden = false;
    grid.removeAttribute('hidden');
    grid.innerHTML = renderReviewCards(reviews);
    injectReviewsJsonLd(data);
  } catch (error) {
    console.error('Homepage reviews error:', error);
    state.dataset.state = 'error';
    state.textContent = 'Не удалось загрузить отзывы.';
    grid.hidden = true;
  }
}
