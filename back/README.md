# Piter Jaluzi Backend

Backend сервиса `piter-jaluzi.ru`: Express public API, Telegram admin bot и (опционально) IMAP listener.

Хранилище: **SQLite** (`better-sqlite3`). JSON (`data/db.json`) — только seed/миграция.

Прод и роли процессов: [DEPLOY.md](../DEPLOY.md). Версии: [ROADMAP.md](../ROADMAP.md) / [docs/V2.md](../docs/V2.md).

## Запуск

```bash
npm install
npm run dev
```

Основные команды:

- `npm start`
- `npm run dev`
- `npm run check`
- `npm run test:smoke`
- `npm run test:contract`
- `npm run test:telegram`

## `PROCESS_ROLE`

| Значение | Когда | Что делает |
| --- | --- | --- |
| `all` | локально | HTTP + Telegram + IMAP в одном процессе |
| `api` | Docker `api` | публичный HTTP (`/api`, `/uploads`, `/health`, webhook, SEO) |
| `worker` | Docker `worker` | Telegram send + IMAP; без портов наружу |

Задаётся в корневом `.env` / переопределяется в `docker-compose.yml`.

## Переменные окружения

Обязательный минимум:

- `PORT`
- `CORS_ORIGIN`

Интеграции:

- `TELEGRAM_API_ROOT` — CF Worker proxy (прод: `https://piter-jaluzi-tg-proxy.chemical-red.workers.dev`)
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_BOT_PASSWORD` / webhook secret
- `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` (v1: Mailpit)
- `INCOMING_EMAIL_*` (пусто = listener выключен)
- `STORAGE_DIR`
- `PUBLIC_API_BASE_URL`
- `PROCESS_ROLE`

См. шаблон в [../.env.example](../.env.example).

## Входящая почта

Listener в [src/services/emailListener.js](./src/services/emailListener.js) каждые 3 минуты (если задан `INCOMING_EMAIL_HOST`):

- подключается к `INBOX` через IMAP
- ищет новые письма без IMAP keyword `$JaluziProcessed`
- парсит письмо через `mailparser`
- классифицирует письмо
- если письмо похоже на реальное письмо от человека, пересылает его целиком в Telegram
- если письмо внутреннее, сервисное, автоматическое, bounce, bulk или уже помечено как spam, не отправляет его целиком в Telegram
- для таких неважных писем ведёт суточную сводку и отправляет её в Telegram раз в день
- после обработки помечает письмо как `\Seen` и `$JaluziProcessed`

Состояние digest хранится локально в `data/email-listener-state.json` и не трекается в git.

## Почтовый контур

- исходящие письма по заявкам: [src/services/email.js](./src/services/email.js)
- в v1 на проде — Mailpit; боевой REG.RU SMTP — план v2
- входящие письма больше не пересылаются на личный email
- Telegram остаётся единственным каналом оперативной доставки полезных входящих писем

## Telegram

Авторизованные chat id лежат в `data/authorizedChats.json`.
Исходящие Bot API-вызовы идут через `TELEGRAM_API_ROOT` (Cloudflare Worker).

Бот используется для:

- уведомлений о заявках
- уведомлений о полезных входящих письмах
- суточной сводки по неважным письмам
- административного управления товарами, отзывами и работами
