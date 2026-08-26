/**
 * Cloudflare Worker: Telegram Bot API reverse proxy + webhook ingress.
 *
 * Outbound (VM → Telegram): /bot<token>/… → api.telegram.org
 * Inbound (Telegram → VM):  /telegram/webhook → WEBHOOK_TARGET on the site
 *
 * Telegram often cannot reach Yandex Cloud VMs directly (webhook timeout).
 * Register webhook on this worker URL instead of the VM IP.
 */

const TELEGRAM_API = 'https://api.telegram.org';
const DEFAULT_WEBHOOK_TARGET = 'https://piter-jaluzi.ru/telegram/webhook';

function corsPreflight() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers':
        'Content-Type,X-Proxy-Secret,X-Telegram-Bot-Api-Secret-Token'
    }
  });
}

async function forwardWebhook(request, env) {
  const target = env.WEBHOOK_TARGET || DEFAULT_WEBHOOK_TARGET;
  const headers = new Headers(request.headers);
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('x-proxy-secret');
  headers.set('Host', new URL(target).host);

  return fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'follow'
  });
}

async function forwardBotApi(request, env) {
  if (env.WORKER_SHARED_SECRET) {
    const secret = request.headers.get('x-proxy-secret') || '';
    if (secret !== env.WORKER_SHARED_SECRET) {
      return new Response('Unauthorized', { status: 401 });
    }
  }

  const url = new URL(request.url);
  const target = new URL(url.pathname + url.search, TELEGRAM_API);
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('cf-connecting-ip');
  headers.delete('cf-ipcountry');
  headers.delete('cf-ray');
  headers.delete('x-forwarded-for');
  headers.delete('x-proxy-secret');

  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'follow'
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return corsPreflight();
    }

    if (url.pathname === '/telegram/webhook' || url.pathname === '/telegram/webhook/') {
      return forwardWebhook(request, env);
    }

    return forwardBotApi(request, env);
  }
};
