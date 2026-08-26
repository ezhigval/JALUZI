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
        <img src="${IMG_PLACEHOLDER_SRC}" data-asset-src="${image}" alt="${name}" style="width:100%;height:250px;object-fit:cover;" />
        <div style="padding:1.5rem;">
          <span style="color:var(--color-primary);font-size:0.8rem;">${category}</span>
          <h2 style="font-size:1.5rem;margin:0.5rem 0;">${name}</h2>
          <p style="color:var(--color-text-muted);margin:1rem 0;line-height:1.7;">${description}</p>
          <div style="font-size:1.5rem;font-weight:bold;color:var(--color-primary);margin:1.5rem 0;">от ${price} ₽/м²</div>
          <button data-open-order-modal data-close-modal class="btn btn-primary" type="button" style="width:100%;">Заказать</button>
        </div>
      </div>
    </div>
  `;
}
