import { fetchJson, setStatus } from '/scripts/api.js';
import { lockScroll, unlockScroll } from '/scripts/scroll-lock.js';

export function initOrderModal() {
  const orderModal = document.getElementById('order-modal');
  const orderModalClose = document.getElementById('order-modal-close');
  const orderForm = document.getElementById('order-form');
  const statusEl = document.getElementById('order-form-status');

  window.openOrderModal = function() {
    if (orderModal) {
      orderModal.style.display = 'flex';
      lockScroll('order-modal');
      setStatus(statusEl, '');
    }
  };

  window.closeOrderModal = function() {
    if (orderModal) {
      orderModal.style.display = 'none';
      unlockScroll('order-modal');
      setStatus(statusEl, '');
    }
  };
  
  if (orderModalClose) orderModalClose.addEventListener('click', window.closeOrderModal);
  if (orderModal) orderModal.addEventListener('click', (e) => { if (e.target.id === 'order-modal') window.closeOrderModal(); });
  
  // ДЕЛЕГИРОВАНИЕ: ловим клики на всех [data-open-order-modal], даже динамических
  document.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-open-order-modal]');
    if (btn) {
      e.preventDefault();
      window.openOrderModal();
    }
  });
  
  if (orderForm) {
    orderForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.currentTarget;
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.textContent;

      setStatus(statusEl, '');
      btn.textContent = 'Отправка...';
      btn.disabled = true;

      try {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        await fetchJson('/api/orders', {
          method: 'POST', 
          body: JSON.stringify(data) 
        });

        setStatus(statusEl, 'Спасибо! Заявка отправлена.', 'success');
        form.reset();
        setTimeout(() => window.closeOrderModal(), 800);
      } catch (error) {
        console.error('Order error:', error);
        setStatus(statusEl, error.message || 'Не удалось отправить заявку.', 'error');
      }
      finally {
        btn.textContent = originalText;
        btn.disabled = false;
      }
    });
  }

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.closeOrderModal(); });
}
