import { lockScroll, unlockScroll } from '/scripts/scroll-lock.js';

export function initProductModals() {
  const openModal = (modal) => {
    modal.style.display = 'flex';
    lockScroll(`product-modal:${modal.dataset.modalProductId || 'unknown'}`);
  };

  const closeModal = (modal) => {
    modal.style.display = 'none';
    unlockScroll(`product-modal:${modal.dataset.modalProductId || 'unknown'}`);
  };

  document.addEventListener('click', function(e) {
    const card = e.target.closest('.product-card');

    // Открываем модалку только если клик по карточке и не по контенту самой модалки
    if (card && !e.target.closest('.modal-content')) {
      const productId = card.getAttribute('data-product-id');

      // ✅ ИСПРАВЛЕНИЕ: ищем модалку относительно карточки, а не во всём документе
      // Вариант 1: модалка — следующий сосед карточки (как в renderProductEntry)
      const modal = card.nextElementSibling;

      // Проверяем, что это действительно нужная модалка
      if (modal &&
          modal.classList.contains('modal-overlay') &&
          modal.dataset.modalProductId === productId) {
        openModal(modal);
      }
      // Вариант 2 (более надёжный, если структура изменится):
      // const modal = card.parentElement?.querySelector(`.modal-overlay[data-modal-product-id="${productId}"]`);
      // if (modal instanceof HTMLElement) { openModal(modal); }
    }

    // Закрытие по кнопке ×
    const closeBtn = e.target.closest('[data-close-modal]');
    if (closeBtn) {
      const modal = closeBtn.closest('.modal-overlay');
      if (modal instanceof HTMLElement) {
        closeModal(modal);
      }
    }

    // Закрытие по клику на оверлей
    const modalOverlay = e.target.closest('.modal-overlay');
    if (modalOverlay && e.target === modalOverlay) {
      closeModal(modalOverlay);
    }
  });

  // Закрытие по Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach((modal) => {
        if (modal instanceof HTMLElement && modal.style.display !== 'none') {
          closeModal(modal);
        }
      });
    }
  });
}