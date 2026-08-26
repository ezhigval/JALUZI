# JALUZI Architecture

Дата актуализации: 2026-08-26  
Версия платформы: **v1** (см. [ROADMAP.md](./ROADMAP.md))

## Состав проекта

Один git-репозиторий [`ezhigval/JALUZI`](https://github.com/ezhigval/JALUZI).

- `front/` — статический сайт на Astro 6
- `back/` — Express API, Telegram-бот (admin), IMAP listener, SQLite
- `deploy/` — Dockerfiles, Caddyfile, autodeploy, Cloudflare Worker, parser helpers

`front` и `back` — отдельные Node-пакеты со своими `package.json`.

## Runtime-поток

1. Astro собирает статический HTML (`output: 'static'`).
2. `BaseLayout.astro` — SEO meta, JSON-LD, Метрика/GA (если заданы `PUBLIC_*`), `data-api-url`.
3. Клиентские модули `front/public/scripts/*` ходят на `/api` и `/uploads` (same-origin в проде).
4. Backend хранит данные в **SQLite** (`STORAGE_DIR/.../db.db`); JSON — только legacy/миграция.
5. Товары:
   - `source=parser` — витрина (карточки/модалки), **без** SEO-страниц
   - `source=manual` — `/catalog/p/<slug>` (HTML с API) + sitemap
6. Telegram admin правит ту же БД; исходящие Bot API-вызовы идут через Cloudflare Worker.

## Frontend

### Стек

- Astro 6 + Vite
- vanilla JS modules + CSS
- статический `dist/`

### Страницы

| URL | Файл / источник |
| --- | --- |
| `/` | `front/src/pages/index.astro` |
| `/catalog` | `front/src/pages/catalog.astro` (товары — JS) |
| `/works-reviews` | `front/src/pages/works-reviews.astro` |
| `/robots.txt` | `front/src/pages/robots.txt.ts` |
| `/sitemap.xml` | API (`seoPages`) через Caddy |
| `/catalog/p/:slug` | API HTML для `manual` товаров |
| `/yandex_*.html` | verification file в `front/public/` |

### Клиентские модули

`main.js`, `api.js`, `asset-loader.js`, `catalog-page.js`, `catalog-preview.js`, `product-markup.js`, `product-modal.js`, `order-modal.js`, `works-reviews-page.js`, `mobile-menu.js`, `contact-map.js`, …

## Backend

### Стек

- Node.js + Express 4
- better-sqlite3
- telegraf, nodemailer, imapflow
- helmet, cors, rate-limit

### Роли процесса

| `PROCESS_ROLE` | Контейнер | Назначение |
| --- | --- | --- |
| `api` | `api` | HTTP: `/api`, `/uploads`, `/health`, webhook, SEO HTML/sitemap |
| `worker` | `worker` | Telegram send + (опц.) IMAP; без публичных портов |
| `all` | local dev | всё в одном процессе |

### Данные

- Прод: `STORAGE_DIR=/var/data/jaluzi` → SQLite + uploads
- Картинки в БД: относительные `/uploads/...`, в API — абсолютные от `PUBLIC_API_BASE_URL`

## Production topology

```
Internet → Caddy (:80/:443)
            ├─ static /srv (Astro)
            ├─ /api /uploads /health /telegram /internal → api:3001
            ├─ /sitemap.xml /catalog/p/* → api:3001
            └─ mailpit:1025 (только Docker network; UI :8025 на localhost)
api / worker → Cloudflare Worker → api.telegram.org
```

VM: `93.77.163.4`, путь `/opt/piter-jaluzi`.  
Деплой: [DEPLOY.md](./DEPLOY.md). План улучшений: [docs/V2.md](./docs/V2.md).
