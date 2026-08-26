import { fetchJson } from '/scripts/api.js';
import { hydrateAssetImages } from '/scripts/asset-loader.js';
import { renderProductEntry } from '/scripts/product-markup.js';

const ITEMS_PER_PAGE = 12;

let filteredProducts = [];
let currentPage = 1;
let currentCategory = 'Все';
let currentQuery = '';

function renderPagination(totalItems) {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  const buttons = [];

  buttons.push(`<button class="btn page-btn" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''}>◀</button>`);

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      const active = i === currentPage ? 'style="background:#2563EB;color:white;border-color:#2563EB;"' : '';
      buttons.push(`<button class="btn page-btn" data-page="${i}" ${active}>${i}</button>`);
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      buttons.push(`<span style="padding:0.5rem 1rem;color:#64748b;">...</span>`);
    }
  }

  buttons.push(`<button class="btn page-btn" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''}>▶</button>`);

  pagination.innerHTML = buttons.join('');

  pagination.querySelectorAll('.page-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const page = parseInt(e.currentTarget.dataset.page, 10);
      if (page && page !== currentPage) {
        currentPage = page;
        renderProducts();
        renderPagination(filteredProducts.length);
        document.getElementById('products-grid')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageProducts = filteredProducts.slice(start, start + ITEMS_PER_PAGE);

  if (!pageProducts.length) {
    grid.innerHTML = '<div class="section-placeholder">Товары не найдены.</div>';
    return;
  }

  grid.innerHTML = pageProducts.map(renderProductEntry).join('');
  hydrateAssetImages(grid);
}

function updateCategoryButtons(category) {
  document.querySelectorAll('#category-filters .btn').forEach(btn => {
    const isCat = btn.dataset.category === category;
    btn.style.background = isCat ? '#2563EB' : 'white';
    btn.style.color = isCat ? 'white' : '#0F172A';
    btn.style.borderColor = isCat ? '#2563EB' : '#CBD5E1';
  });
}

function buildProductsUrl() {
  const params = new URLSearchParams();
  if (currentCategory && currentCategory !== 'Все') {
    params.set('category', currentCategory);
  }
  if (currentQuery.trim()) {
    params.set('q', currentQuery.trim());
  }
  const query = params.toString();
  return query ? `/api/products?${query}` : '/api/products';
}

async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = '<div class="section-placeholder">Загружаем товары...</div>';

  try {
    const { data } = await fetchJson(buildProductsUrl());
    filteredProducts = Array.isArray(data) ? data : [];
    currentPage = 1;

    if (!filteredProducts.length) {
      grid.innerHTML = '<div class="section-placeholder">Товары не найдены.</div>';
      document.getElementById('pagination').innerHTML = '';
      return;
    }

    renderProducts();
    renderPagination(filteredProducts.length);
  } catch (error) {
    console.error('Catalog page error:', error);
    grid.innerHTML = '<div class="section-placeholder" data-state="error">Не удалось загрузить товары.</div>';
  }
}

export async function initCatalogPage() {
  const grid = document.getElementById('products-grid');
  const filters = document.getElementById('category-filters');
  const search = document.getElementById('catalog-search');

  if (!grid) return;

  if (filters) {
    filters.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentCategory = e.currentTarget.dataset.category;
        updateCategoryButtons(currentCategory);
        loadProducts();
      });
    });
  }

  if (search) {
    let debounceTimer;
    search.addEventListener('input', (e) => {
      currentQuery = e.target.value;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(loadProducts, 250);
    });
  }

  await loadProducts();
}
