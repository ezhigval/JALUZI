import { lockScroll, unlockScroll } from '/scripts/scroll-lock.js';

function formatRub(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(amount));
}

function updateProductCalculator(calcEl) {
  if (!(calcEl instanceof HTMLElement)) return;

  const pricePerM2 = Number(calcEl.dataset.pricePerM2) || 0;
  const width = Number(calcEl.querySelector('.product-calc-width')?.value) || 0;
  const height = Number(calcEl.querySelector('.product-calc-height')?.value) || 0;
  const quantity = Number(calcEl.querySelector('.product-calc-quantity')?.value) || 0;
  const resultEl = calcEl.querySelector('.product-calc-result strong');

  if (!resultEl) return;

  if (pricePerM2 <= 0 || width <= 0 || height <= 0 || quantity <= 0) {
    resultEl.textContent = '—';
    return;
  }

  const areaM2 = (width / 100) * (height / 100);
  const total = areaM2 * pricePerM2 * quantity;
  resultEl.textContent = `${formatRub(total)} ₽`;
}

function initCalculatorInModal(modal) {
  const calc = modal.querySelector('.product-price-calculator');
  if (calc) updateProductCalculator(calc);
}

export function initProductModals() {
  const openModal = (modal) => {
    modal.style.display = 'flex';
    lockScroll(`product-modal:${modal.dataset.modalProductId || 'unknown'}`);
  };

  const closeModal = (modal) => {
    modal.style.display = 'none';
    unlockScroll(`product-modal:${modal.dataset.modalProductId || 'unknown'}`);
  };

  document.addEventListener('input', (e) => {
    const calc = e.target.closest('.product-price-calculator');
    if (calc) updateProductCalculator(calc);
  });

  document.addEventListener('click', function(e) {
    const card = e.target.closest('.product-card');

    // Открываем модалку только если клик по карточке и не по контенту самой модалки
    if (card && !e.target.closest('.modal-content')) {
      const productId = card.getAttribute('data-product-id');

      // Ищем модалку относительно карточки (следующий sibling в renderProductEntry)
      const modal = card.nextElementSibling;

      // Проверяем, что это действительно нужная модалка
      if (modal &&
          modal.classList.contains('modal-overlay') &&
          modal.dataset.modalProductId === productId) {
        openModal(modal);
        initCalculatorInModal(modal);
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

  // Закрытие по Escape (только реально открытые модалки)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay').forEach((modal) => {
        if (!(modal instanceof HTMLElement) || modal.id === 'order-modal') {
          return;
        }
        if (modal.style.display === 'flex') {
          closeModal(modal);
        }
      });
    }
  });
}