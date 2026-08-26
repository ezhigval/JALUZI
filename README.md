# Питер-Жалюзи

Монорепозиторий сайта [piter-jaluzi.ru](https://piter-jaluzi.ru):

- `front/` — Astro-витрина (статика)
- `back/` — Express public API + Telegram admin worker + email listener + SQLite
- `deploy/` — Docker/Caddy, Ubuntu setup, Cloudflare Telegram proxy

**Версия на проде:** v1 (закрыта). **Следующая:** [v2](./docs/V2.md) — старт с чистки кода и AI-следов. Общий план: [ROADMAP.md](./ROADMAP.md).

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

### Compose (локально)

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

## Production

Одна Ubuntu VM в Yandex Cloud (`93.77.163.4`). Домен на REG.RU.  
Telegram Bot API — через Cloudflare Worker. Заявки в v1 пишутся в Mailpit (боевая почта — v2).

Подробности: [DEPLOY.md](./DEPLOY.md).

## Документация

| Файл | Назначение |
| --- | --- |
| [ROADMAP.md](./ROADMAP.md) | v1 done / v2+ план |
| [docs/V2.md](./docs/V2.md) | Детальный бэклог v2 |
| [DEPLOY.md](./DEPLOY.md) | VM, DNS, SSL, CF Worker, SEO/Метрика |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Стек и потоки данных |
| [AI_PROJECT_CONTEXT.md](./AI_PROJECT_CONTEXT.md) | Handoff для агентов |
| [back/README.md](./back/README.md) | Backend commands / email / bot |
