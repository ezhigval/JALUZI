/**
 * Cloudflare Worker: Telegram Bot API reverse proxy.
 *
 * Yandex Cloud VMs in RU often cannot reach api.telegram.org directly.
 * This worker forwards Bot API calls from the VM.
 *
 * Deploy from the monorepo root:
 *   npx wrangler deploy deploy/cloudflare/telegram-proxy-worker.js \
 *     --name piter-jaluzi-tg-proxy \
 *     --compatibility-date 2026-08-23
 *
 * Then set on the VM:
 *   TELEGRAM_API_ROOT=https://piter-jaluzi-tg-proxy.<your-subdomain>.workers.dev
 *
 * Optional: set WORKER_SHARED_SECRET and require header X-Proxy-Secret.
 */

const TELEGRAM_API = 'https://api.telegram.org';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (env.WORKER_SHARED_SECRET) {
      const secret = request.headers.get('x-proxy-secret') || '';
      if (secret !== env.WORKER_SHARED_SECRET) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type,X-Proxy-Secret'
        }
      });
    }

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
};
