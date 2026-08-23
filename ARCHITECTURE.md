# JALUZI Architecture

Дата актуализации: 2026-08-23

## Состав проекта

Это один git-репозиторий.

- `front/` — статический сайт на Astro 6.
- `back/` — Express API, Telegram-бот для администрирования и почтовый listener на ImapFlow.
- `deploy/` — образы, Caddyfile и скрипты для Ubuntu VM.

`front` и `back` остаются отдельными Node-проектами со своими `package.json`.

## Основной runtime-поток

1. Astro рендерит страницы и layout.
2. `BaseLayout.astro` пробрасывает `PUBLIC_API_URL` в `data-api-url`.
3. Если `PUBLIC_API_URL` пустой, клиент ходит на тот же origin: `/api`, `/uploads`.
4. Клиентские модули из `front/public/scripts` поднимают UI-логику.
5. Бэкенд хранит данные в SQLite; при пустой базе мигрирует из JSON.
6. Telegram-бот редактирует ту же базу и загружает изображения в storage uploads.

## Frontend

### Стек

- Astro 6
- Vite
- vanilla JavaScript modules
- обычный CSS
- статический build output

### Точки входа

- `front/src/layouts/BaseLayout.astro` — HTML-обвязка, SEO-мета, подключение `main.js`
- `front/src/pages/index.astro`
- `front/src/pages/catalog.astro`
- `front/src/pages/works-reviews.astro`

### Клиентские модули

- `front/public/scripts/main.js` — общий bootstrap
- `front/public/scripts/api.js` — API helper
- `front/public/scripts/asset-loader.js` — резолв `/uploads`
- `front/public/scripts/catalog-preview.js`
- `front/public/scripts/catalog-page.js`
- `front/public/scripts/works-reviews-page.js`
- `front/public/scripts/order-modal.js`
- `front/public/scripts/product-modal.js`
- `front/public/scripts/mobile-menu.js`
- `front/public/scripts/contact-map.js`

## Backend

### Стек

- Node.js + Express 4
- better-sqlite3
- helmet, cors, express-rate-limit
- telegraf
- imapflow + mailparser
- nodemailer

### Ключевые модули

- `back/src/index.js` — запуск HTTP API
- `back/src/config.js` — разбор env
- `back/src/database/db.js` и `initDb.js` — SQLite + миграция из JSON
- `back/src/routes/*`
- `back/src/services/email.js`
- `back/src/services/emailListener.js`
- `back/src/services/telegram.js`
- `back/src/services/uploads.js`

### Данные

- локально: `back/data/db.db`, `back/src/uploads`
- прод: `STORAGE_DIR=/var/data/jaluzi`

Пути картинок в базе относительные: `/uploads/products/...`.
В API они собираются в абсолютные URL от `PUBLIC_API_BASE_URL`.

## Production

Одна VM в Yandex Cloud:

- Caddy слушает 80/443, Let's Encrypt, редирект `www` → apex
- контейнер `api` слушает только внутренний `:3001`
- том `jaluzi-data` хранит SQLite и uploads
- почта остаётся на REG.RU

Подробности — в [DEPLOY.md](./DEPLOY.md).
