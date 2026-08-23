const activeLocks = new Set();

function syncBodyLock() {
  document.body.style.overflow = activeLocks.size ? 'hidden' : '';
}

export function lockScroll(lockId) {
  activeLocks.add(lockId);
  syncBodyLock();
}

export function unlockScroll(lockId) {
  activeLocks.delete(lockId);
  syncBodyLock();
}

export function clearScrollLocks() {
  activeLocks.clear();
  syncBodyLock();
}
