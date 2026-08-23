import { lockScroll, unlockScroll } from '/scripts/scroll-lock.js';

export function initMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-nav');

  if (!mobileMenuBtn || !mobileMenu) {
    return;
  }

  const syncMenuState = (isOpen) => {
    mobileMenu.hidden = !isOpen;
    mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    mobileMenuBtn.textContent = isOpen ? '✕' : '☰';

    if (isOpen) {
      lockScroll('mobile-menu');
    } else {
      unlockScroll('mobile-menu');
    }
  };

  const closeMenu = () => syncMenuState(false);

  syncMenuState(false);

  mobileMenuBtn.addEventListener('click', () => {
    const isOpen = mobileMenuBtn.getAttribute('aria-expanded') === 'true';
    syncMenuState(!isOpen);
  });

  mobileMenu.querySelectorAll('.mobile-nav-link').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  document.addEventListener('click', (event) => {
    const target = event.target;

    if (!(target instanceof Node)) {
      return;
    }

    if (
      mobileMenu.hidden ||
      mobileMenu.contains(target) ||
      mobileMenuBtn.contains(target)
    ) {
      return;
    }

    closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 992) {
      closeMenu();
    }
  });
}
