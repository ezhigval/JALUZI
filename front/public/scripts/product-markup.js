import { escapeHtml } from '/scripts/api.js';
import { IMG_PLACEHOLDER_SRC } from '/scripts/asset-loader.js';

function isUrlDescription(value) {
  const text = String(value || '').trim();
  return /^https?:\/\//i.test(text);
}

function productDescription(product) {
  const raw = String(product.description || '').trim();
  const source = String(product.source || 'manual');
  if (!raw || isUrlDescription(raw) || (source === 'parser' && isUrlDescription(raw))) {
    const category = escapeHtml(product.category || 'Жалюзи');
    return `${category} на заказ в Санкт-Петербурге. Бесплатный замер, профессиональный монтаж, гарантия 1 год.`;
  }
  return escapeHtml(raw);
}

export function renderProductEntry(product) {
  const id = escapeHtml(String(product.id));
  const name = escapeHtml(product.name);
  const category = escapeHtml(product.category);
  const description = productDescription(product);
  const image = escapeHtml(product.image);
  const price = escapeHtml(product.price);
  const source = escapeHtml(product.source || 'manual');

  // Same card + modal UI for parser and manual products.
  return `
    <div class="product-card product-item" data-category="${category}" data-product-id="${id}" data-source="${source}">
      <img src="${IMG_PLACEHOLDER_SRC}" data-asset-src="${image}" alt="${name}" class="product-card-img" loading="lazy" />
      <div class="product-card-body">
        <span class="product-card-category">${category}</span>
        <h3 class="product-card-title">${name}</h3>
        <p class="product-card-price">от <strong>${price} ₽</strong>/м²</p>
        <span style="color:var(--color-primary);font-weight:500;">Подробнее →</span>
      </div>
    </div>
    <div id="modal-${id}" class="modal-overlay" data-modal-product-id="${id}">
      <div class="modal-content">
        <button class="modal-close-btn" data-close-modal type="button">×</button>
        <img src="${IMG_PLACEHOLDER_SRC}" data-asset-src="${image}" alt="${name}" class="product-modal-img" />
        <div class="product-modal-body">
          <span class="product-modal-category">${category}</span>
          <h2 class="product-modal-title">${name}</h2>
          <div class="product-modal-price">от ${price} ₽/м²</div>
          <div class="product-price-calculator" data-price-per-m2="${price}">
            <div class="product-calc-fields">
              <label>
                <span>Ширина (см)</span>
                <input type="number" class="modal-input product-calc-width" min="1" step="1" inputmode="numeric" value="100" aria-label="Ширина в сантиметрах" />
              </label>
              <label>
                <span>Высота (см)</span>
                <input type="number" class="modal-input product-calc-height" min="1" step="1" inputmode="numeric" value="150" aria-label="Высота в сантиметрах" />
              </label>
              <label>
                <span>Количество</span>
                <input type="number" class="modal-input product-calc-quantity" min="1" step="1" inputmode="numeric" value="1" aria-label="Количество" />
              </label>
            </div>
            <div class="product-calc-result">Примерная стоимость: <strong>—</strong></div>
            <p class="product-calc-disclaimer">Цена ориентировочная. Точный расчёт — после бесплатного замера.</p>
          </div>
          <p class="product-modal-description">${description}</p>
          <button data-open-order-modal data-close-modal class="btn btn-primary product-modal-order-btn" type="button">Заказать</button>
        </div>
      </div>
    </div>
  `;
}

export function relocateProductModals(root = document) {
  root.querySelectorAll('.product-grid .modal-overlay').forEach((modal) => {
    if (modal.parentElement !== document.body) {
      document.body.appendChild(modal);
    }
  });
}
