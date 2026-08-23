# Питер-Жалюзи

Монорепозиторий сайта [piter-jaluzi.ru](https://piter-jaluzi.ru):

- `front/` — Astro-витрина
- `back/` — Express API + Telegram admin bot + email listener
- `deploy/` — Docker/Caddy и скрипты для Ubuntu VM в Yandex Cloud

## Быстрый старт

### Frontend

```bash
cd front
npm install
npm run dev
```

Основные команды:

- `npm run check`
- `npm run build`
- `npm run preview`

Локально:

```env
PUBLIC_API_URL=http://localhost:3001
SITE_URL=http://localhost:4321
```

В проде `PUBLIC_API_URL` пустой: сайт и API на одном домене.

### Backend

```bash
cd back
npm install
npm run dev
```

Основные команды:

- `npm run check`
- `npm run normalize:data`
- `npm run test:smoke`
- `npm run test:contract`

Минимальные переменные:

- `PORT=3001`
- `CORS_ORIGIN=http://localhost:4321`

Опциональные интеграции: Telegram и почта REG.RU. Шаблон — `back/.env.example`.

По умолчанию тестовые скрипты не создают заявки и не загрязняют базу.
Для write-smoke `POST /api/orders`:

```bash
ALLOW_WRITE_TESTS=1 node test-order.js
```

## Архитектура

Подробная карта — в [ARCHITECTURE.md](./ARCHITECTURE.md).

Прод: одна Ubuntu VM, Caddy раздаёт статику и проксирует `/api` и `/uploads`.
Домен остаётся на REG.RU, DNS A-записи выставляются вручную.

## Deploy

Локальный запуск и переезд на Yandex Cloud — в [DEPLOY.md](./DEPLOY.md).

## AI Handoff

Единый контекст-файл для другой модели — [AI_PROJECT_CONTEXT.md](./AI_PROJECT_CONTEXT.md).
