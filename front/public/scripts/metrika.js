export function reachGoal(goal, params) {
  if (!goal || typeof window === 'undefined') {
    return;
  }

  try {
    if (typeof window.ym === 'function' && window.__YM_ID__) {
      window.ym(window.__YM_ID__, 'reachGoal', goal, params);
    }
  } catch (error) {
    console.debug('Metrika goal skipped:', goal, error);
  }
}

export function initMetrikaTracking() {
  document.addEventListener('click', (event) => {
    const phoneLink = event.target.closest('a[href^="tel:"]');
    if (phoneLink) {
      reachGoal('click_phone');
      return;
    }

    const waLink = event.target.closest('a[href*="wa.me"], a[href*="whatsapp.com"]');
    if (waLink) {
      reachGoal('click_whatsapp');
      return;
    }

    const tgLink = event.target.closest('a[href*="t.me/"], a[href*="telegram.me/"]');
    if (tgLink) {
      reachGoal('click_telegram');
      return;
    }

    const orderBtn = event.target.closest('[data-open-order-modal]');
    if (orderBtn) {
      reachGoal('open_order_modal');
      return;
    }

    const catalogLink = event.target.closest('a[href="/catalog"], a[href="/catalog/"], a[href^="/catalog/"]');
    if (catalogLink) {
      reachGoal('open_catalog');
    }
  });

  const path = window.location.pathname;
  if (path === '/catalog' || path === '/catalog/' || path.startsWith('/catalog/')) {
    reachGoal('open_catalog');
  }
}
