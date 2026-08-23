# Питер-Жалюзи

Монорепозиторий сайта [piter-jaluzi.ru](https://piter-jaluzi.ru):

- `front/` — Astro-витрина
- `back/` — Express public API + Telegram admin worker + email listener
- `deploy/` — Docker/Caddy, Ubuntu setup, Cloudflare Telegram proxy

## Быстрый старт

### Frontend

```bash
cd front
npm install
npm run dev
```

Локально: `PUBLIC_API_URL=http://localhost:3001`. В проде URL пустой (same-origin).

### Backend

```bash
cd back
npm install
npm run dev
```

`PROCESS_ROLE=all` — локально HTTP + Telegram + IMAP.
В Docker: контейнер `api` (публичный HTTP) и `worker` (Telegram/IMAP без портов наружу).

## Production

Одна Ubuntu VM в Yandex Cloud. Домен на REG.RU. Telegram через Cloudflare Worker.
Подробности: [DEPLOY.md](./DEPLOY.md).

## Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [AI_PROJECT_CONTEXT.md](./AI_PROJECT_CONTEXT.md)
