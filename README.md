# Питер-Жалюзи

Канонический монорепозиторий сайта [piter-jaluzi.ru](https://piter-jaluzi.ru):

- `front/` — Astro-витрина
- `back/` — Express API + Telegram admin bot + email listener
- `deploy/` — Docker, Caddy и скрипты для Ubuntu VM в Yandex Cloud

Репозиторий: [github.com/ezhigval/JALUZI](https://github.com/ezhigval/JALUZI).

## Быстрый старт

Из корня:

```bash
npm run install:all
npm run dev
```

Или раздельно:

```bash
cd back && cp .env.example .env && npm install && npm run dev
cd front && cp .env.example .env.local && npm install && npm run dev
```

Локально фронт: `http://localhost:4321`, API: `http://localhost:3001`.

```env
PUBLIC_API_URL=http://localhost:3001
SITE_URL=http://localhost:4321
```

В проде `PUBLIC_API_URL` пустой: сайт и API на одном домене.

Проверка стека в Docker без TLS:

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
# http://localhost:8080
```

## Архитектура

Подробная карта — в [ARCHITECTURE.md](./ARCHITECTURE.md).

Прод: одна Ubuntu VM, Caddy раздаёт статику и проксирует публичный `/api`, `/uploads`, `/health`.
Telegram и IMAP живут в контейнере `worker` без открытых портов.
Домен остаётся на REG.RU, DNS A-записи выставляются вручную.

## Deploy

Локальный запуск и переезд на Yandex Cloud — в [DEPLOY.md](./DEPLOY.md).

## AI Handoff

Единый контекст-файл для другой модели — [AI_PROJECT_CONTEXT.md](./AI_PROJECT_CONTEXT.md).
