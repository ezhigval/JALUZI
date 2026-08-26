import { fetchJson } from '/scripts/api.js';
import { hydrateAssetImages } from '/scripts/asset-loader.js';
import { renderProductEntry } from '/scripts/product-markup.js';

export async function initCategoryLanding(slug, category) {
  const grid = document.getElementById(`category-products-${slug}`);
  if (!grid) return;

  try {
    const { data } = await fetchJson(`/api/products?category=${encodeURIComponent(category)}`);
    const products = Array.isArray(data) ? data.slice(0, 12) : [];

    if (!products.length) {
      grid.innerHTML = '<div class="section-placeholder">Товары этой категории скоро появятся.</div>';
      return;
    }

    grid.innerHTML = products.map(renderProductEntry).join('');
    hydrateAssetImages(grid);
  } catch (error) {
    console.error('Category landing error:', error);
    grid.innerHTML = '<div class="section-placeholder" data-state="error">Не удалось загрузить товары.</div>';
  }
}
