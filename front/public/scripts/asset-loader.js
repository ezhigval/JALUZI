import { getApiUrl } from '/scripts/api.js';

export const IMG_PLACEHOLDER_SRC = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

const resolvedAssetUrls = new Map();
const pendingAssetUrls = new Map();
let cleanupRegistered = false;

function getApiBase() {
  return getApiUrl() || window.location.origin;
}

function getApiOrigin() {
  try {
    return new URL(getApiBase()).origin;
  } catch {
    return window.location.origin;
  }
}

function normalizeAssetUrl(assetUrl) {
  const value = String(assetUrl || '').trim();

  if (!value) {
    return '';
  }

  try {
    return new URL(value, `${getApiBase()}/`).toString();
  } catch {
    return value;
  }
}

function shouldProxyThroughFetch(assetUrl) {
  const apiOrigin = getApiOrigin();

  if (!apiOrigin || !apiOrigin.includes('ngrok')) {
    return false;
  }

  try {
    return new URL(assetUrl).origin === apiOrigin;
  } catch {
    return false;
  }
}

function registerCleanup() {
  if (cleanupRegistered) {
    return;
  }

  cleanupRegistered = true;

  window.addEventListener('beforeunload', () => {
    resolvedAssetUrls.forEach((objectUrl) => {
      URL.revokeObjectURL(objectUrl);
    });

    resolvedAssetUrls.clear();
  }, { once: true });
}

async function fetchAssetAsObjectUrl(assetUrl) {
  const cached = resolvedAssetUrls.get(assetUrl);

  if (cached) {
    return cached;
  }

  const pending = pendingAssetUrls.get(assetUrl);

  if (pending) {
    return pending;
  }

  const request = fetch(assetUrl, {
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Asset request failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';

    if (!contentType.startsWith('image/')) {
      throw new Error('Asset response is not an image.');
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    resolvedAssetUrls.set(assetUrl, objectUrl);
    registerCleanup();

    return objectUrl;
  }).finally(() => {
    pendingAssetUrls.delete(assetUrl);
  });

  pendingAssetUrls.set(assetUrl, request);

  return request;
}

export async function resolveAssetImageSrc(assetUrl) {
  const normalizedAssetUrl = normalizeAssetUrl(assetUrl);

  if (!normalizedAssetUrl) {
    return '';
  }

  if (!shouldProxyThroughFetch(normalizedAssetUrl)) {
    return normalizedAssetUrl;
  }

  return fetchAssetAsObjectUrl(normalizedAssetUrl);
}

export async function hydrateAssetImages(root = document) {
  const images = Array.from(root.querySelectorAll('img[data-asset-src]'));

  await Promise.all(images.map(async (image) => {
    if (!(image instanceof HTMLImageElement)) {
      return;
    }

    const assetUrl = image.dataset.assetSrc?.trim();

    if (!assetUrl) {
      return;
    }

    if (image.dataset.assetStatus === 'loaded') {
      return;
    }

    try {
      const resolvedAssetUrl = await resolveAssetImageSrc(assetUrl);

      if (!image.isConnected || image.dataset.assetSrc?.trim() !== assetUrl) {
        return;
      }

      image.src = resolvedAssetUrl;
      image.dataset.assetStatus = 'loaded';
    } catch (error) {
      console.error('Image asset load error:', error);
      image.dataset.assetStatus = 'error';
    }
  }));
}
