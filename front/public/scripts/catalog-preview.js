import { fetchJson } from '/scripts/api.js';
import { hydrateAssetImages } from '/scripts/asset-loader.js';
import { renderProductEntry } from '/scripts/product-markup.js';

export async function initCatalogPreview() {
  const grid = document.getElementById('catalog-preview-grid');

  if (!grid) {
    return;
  }

  try {
    const limit = Number(grid.dataset.limit || '3');
    const { data } = await fetchJson('/api/products');
    const products = Array.isArray(data) ? data.slice(0, limit) : [];

    if (!products.length) {
      grid.innerHTML = '<div class="section-placeholder">Каталог пока пуст.</div>';
      return;
    }

    grid.innerHTML = products.map(renderProductEntry).join('');
    await hydrateAssetImages(grid);
  } catch (error) {
    console.error('Catalog preview error:', error);
    grid.innerHTML = '<div class="section-placeholder" data-state="error">Не удалось загрузить товары.</div>';
  }
}
