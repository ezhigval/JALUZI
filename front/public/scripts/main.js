import { initMobileMenu } from '/scripts/mobile-menu.js';
import { initOrderModal } from '/scripts/order-modal.js';
import { initProductModals } from '/scripts/product-modal.js';
import { initProductFilters } from '/scripts/filters.js';
import { initCatalogPreview } from '/scripts/catalog-preview.js';
import { initCatalogPage } from '/scripts/catalog-page.js';
import { initWorksReviewsPage } from '/scripts/works-reviews-page.js';
import { initContactMap } from '/scripts/contact-map.js';

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initOrderModal();
  initProductModals();
  initProductFilters();
  initCatalogPreview();
  initCatalogPage();
  initWorksReviewsPage();
  initContactMap();
});
