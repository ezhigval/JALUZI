const DEFAULT_TIMEOUT_MS = 10000;

export function getApiUrl() {
  const apiUrl = document.body?.dataset.apiUrl?.trim();
  return (apiUrl || '').replace(/\/+$/, '');
}

export function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function setStatus(element, message = '', state = '') {
  if (!element) {
    return;
  }

  element.textContent = message;

  if (state) {
    element.dataset.state = state;
  } else {
    delete element.dataset.state;
  }
}

export async function fetchJson(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs || DEFAULT_TIMEOUT_MS);
  const apiUrl = getApiUrl();

  if (apiUrl.includes('ngrok')) {
    headers.set('ngrok-skip-browser-warning', 'true');
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const payload = isJson ? await response.json() : null;

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.error || `Request failed with status ${response.status}`);
    }

    return payload;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Превышено время ожидания ответа сервера.');
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}
