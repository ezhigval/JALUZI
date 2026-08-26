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

    const catalogLink = event.target.closest('a[href="/catalog"], a[href="/catalog/"]');
    if (catalogLink) {
      reachGoal('open_catalog');
    }
  });

  if (window.location.pathname === '/catalog' || window.location.pathname === '/catalog/') {
    reachGoal('open_catalog');
  }
}
