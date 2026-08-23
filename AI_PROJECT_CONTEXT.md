# AI Project Context

Дата актуализации: 2026-08-23

Этот файл предназначен как единый handoff-документ для любой другой модели/агента.
Если у новой модели есть только один файл для входа в проект, нужно читать именно этот.

## 1. Что это за проект

Проект называется `Питер-Жалюзи`.

Бизнес-сущность:

- компания по продаже, изготовлению, установке и ремонту жалюзи в Санкт-Петербурге
- текущий публичный домен фронтенда: `https://piter-jaluzi.ru`
- рабочий email бренда: `info@piter-jaluzi.ru`

Технически проект — монорепозиторий `ezhigval/JALUZI` из двух Node-пакетов:

- `front/` — статический сайт на Astro
- `back/` — Express API + Telegram admin bot + email listener + SQLite
- `deploy/` — Docker Compose, Caddy, Cloudflare Telegram proxy

Типовая production-схема:

- одна Ubuntu VM в Yandex Cloud (`fv41g9i64264k1j55ogh`, login `jaluzi-admin`)
- Caddy отдаёт `front/dist` и проксирует публичный `/api`, `/uploads`, `/health` в контейнер `api`
- контейнер `worker` держит Telegram polling и IMAP, без publish-портов
- Telegram Bot API с VM в РФ идёт через Cloudflare Worker (`TELEGRAM_API_ROOT`)
- данные API живут на Docker-томе `STORAGE_DIR=/var/data/jaluzi`
- домен `piter-jaluzi.ru` остаётся на REG.RU, A-записи правятся вручную
- почта остаётся на `mail.hosting.reg.ru`

## 2. Что важно понять сразу

Это не full SSR-приложение.

Архитектура такая:

1. Astro рендерит статические HTML-страницы.
2. Во `front/src/layouts/BaseLayout.astro` в `body` прокидывается `data-api-url`.
3. Клиентские JS-модули из `front/public/scripts/` уже в браузере подтягивают динамику с бэкенда.
4. Бэкенд хранит данные в JSON-файле и раздаёт их через REST API.
5. Админка фактически реализована через Telegram-бота, который умеет редактировать товары, отзывы и работы.

То есть фронт и бэк связаны только через HTTP API.

## 3. Актуальный бренд и домены

Все новые изменения должны использовать именно эти значения:

- бренд: `Питер-Жалюзи`
- backend API brand label: `Piter-Jaluzi API`
- frontend domain: `https://piter-jaluzi.ru`
- email: `info@piter-jaluzi.ru`
- почта размещается через REG.RU

Почтовые настройки REG.RU, зафиксированные в проекте:

- SMTP host: `mail.hosting.reg.ru`
- SMTP port: `465`
- IMAP host: `mail.hosting.reg.ru`
- IMAP port: `993`

## 4. Что можно игнорировать при чтении проекта

При анализе проекта не нужно тратить время на:

- `front/node_modules/`
- `back/node_modules/`
- `front/dist/`
- `front/.astro/`
- `front/.idea/`, `back/.idea/`
- `front/.git/`, `back/.git/`
- `back/logs/`

Корневой каталог — единый git-репозиторий `ezhigval/JALUZI`.
`front/` и `back/` больше не являются отдельными git-репозиториями.

## 5. Корневая структура

На уровне корня наиболее важны:

- `README.md` — общий краткий readme
- `ARCHITECTURE.md` — краткая архитектурная сводка
- `DEPLOY.md` — локальный запуск и Yandex Cloud / REG.RU DNS
- `AI_PROJECT_CONTEXT.md` — этот файл
- `docker-compose.yml`
- `deploy/`
- `front/`
- `back/`

## 6. Frontend: подробная карта

### 6.1. Стек фронта

- Astro 6
- Vite
- vanilla JS modules
- обычный CSS без Tailwind
- статический build output

### 6.2. Основные файлы фронта

- `front/package.json`
- `front/astro.config.mjs`
- `front/.env.example`
- `front/src/layouts/BaseLayout.astro`
- `front/src/data/config.json`
- `front/src/pages/index.astro`
- `front/src/pages/catalog.astro`
- `front/src/pages/works-reviews.astro`
- `front/src/pages/robots.txt.ts`
- `front/src/pages/sitemap.xml.ts`
- `front/src/styles/global.css`
- `front/src/styles/components.css`
- `front/public/manifest.json`
- `front/public/icon.svg`
- `front/public/scripts/*.js`

### 6.3. Frontend routing

Страницы:

- `/` — главная
- `/catalog` — каталог товаров
- `/works-reviews` — наши работы + отзывы + форма отправки отзыва
- `/robots.txt`
- `/sitemap.xml`

### 6.4. Layout и конфиг

`front/src/layouts/BaseLayout.astro`:

- подключает глобальные стили
- получает `title`, `description`, `canonical`
- вычисляет canonical URL из `SITE_URL`
- прокидывает `PUBLIC_API_URL` в `body data-api-url`
- подключает основной bootstrap-скрипт `/scripts/main.js`

`front/src/data/config.json`:

- хранит бизнес-константы для сайта
- бренд
- телефон
- email
- адрес
- SEO title/description
- служебные числа вроде `years`, `installations`, `warranty`

Если нужно менять публичное название компании, телефон, email, SEO-тексты, сначала нужно смотреть именно сюда.

### 6.5. Состав страниц

`front/src/pages/index.astro`:

- `OrderModal`
- `Header`
- `Hero`
- `Features`
- `CatalogPreview`
- `Repair`
- `About`
- `ContactForm`
- `Footer`

Это лендинг.
На нём есть динамический блок предпросмотра каталога.

`front/src/pages/catalog.astro`:

- статический заголовок
- фильтры категорий
- контейнер `#products-grid`
- товары загружаются клиентским JS

`front/src/pages/works-reviews.astro`:

- hero-блок страницы
- контейнер работ `#works-slider-root`
- контейнер отзывов `#reviews-grid`
- форма отправки отзыва
- CTA внизу с кнопкой открытия заказа

### 6.6. Клиентские JS-модули фронта

`front/public/scripts/main.js`

- единая точка инициализации
- вызывает:
  - `initMobileMenu()`
  - `initOrderModal()`
  - `initProductModals()`
  - `initProductFilters()`
  - `initCatalogPreview()`
  - `initCatalogPage()`
  - `initWorksReviewsPage()`
  - `initContactMap()`

`front/public/scripts/api.js`

- получает API URL из `body[data-api-url]`
- нормализует URL без завершающего `/`
- добавляет таймаут на fetch
- если URL содержит `ngrok`, добавляет header `ngrok-skip-browser-warning`
- считает ответ ошибкой, если `response.ok === false` или `payload.success !== true`

`front/public/scripts/catalog-preview.js`

- вызывает `GET /api/products`
- берёт первые `N` товаров, где `N` читается из `data-limit`
- рендерит карточки через `renderProductEntry()`

`front/public/scripts/catalog-page.js`

- вызывает `GET /api/products`
- рендерит весь список товаров в `#products-grid`

`front/public/scripts/product-markup.js`

- строит HTML карточки товара
- одновременно строит modal для каждого товара
- использует поля:
  - `id`
  - `name`
  - `category`
  - `description`
  - `image`
  - `price`

`front/public/scripts/product-modal.js`

- открывает modal при клике по карточке товара
- закрывает по overlay, close button и `Escape`
- использует `scroll-lock.js`, чтобы не ломать scroll при нескольких модалках

`front/public/scripts/order-modal.js`

- открывает общую форму заказа
- делегированно ловит `[data-open-order-modal]`
- отправляет `POST /api/orders`
- показывает успех/ошибку в `#order-form-status`

`front/public/scripts/filters.js`

- переключает отображение `.product-item` по `data-category`

`front/public/scripts/works-reviews-page.js`

- параллельно грузит:
  - `GET /api/reviews/works`
  - `GET /api/reviews`
- рендерит слайдер работ
- рендерит сетку отзывов
- отправляет форму отзыва через `POST /api/reviews`
- после успешной отправки заново перезагружает данные
- старый interval слайдера корректно очищается при re-render

`front/public/scripts/contact-map.js`

- лениво подгружает Яндекс.Карты
- строит карту по `data-*` атрибутам контейнера `#yandex-map`

`front/public/scripts/mobile-menu.js`

- управляет мобильной навигацией

`front/public/scripts/scroll-lock.js`

- хранит lock state по ключам
- нужен, чтобы `order modal` и `product modal` не конфликтовали

### 6.7. Frontend styling

Стиль централизован в:

- `front/src/styles/global.css`
- `front/src/styles/components.css`

Общая философия:

- минимум тяжёлого inline JS
- Astro-компоненты в основном статические
- интерактивность вынесена в отдельные модули
- CSS без CSS-in-JS и без utility-framework

### 6.8. Frontend SEO и служебные файлы

`front/src/pages/robots.txt.ts`

- генерирует `robots.txt` из `SITE_URL`

`front/src/pages/sitemap.xml.ts`

- генерирует sitemap из `SITE_URL`
- сейчас перечисляет:
  - `/`
  - `/catalog`
  - `/works-reviews`

`front/public/manifest.json`

- web app manifest

`front/public/icon.svg`

- favicon/icon

## 7. Backend: подробная карта

### 7.1. Стек бэка

- Node.js
- Express 4
- helmet
- cors
- express-rate-limit
- telegraf
- imapflow
- mailparser
- nodemailer 8
- JSON-file storage

### 7.2. Основные backend файлы

- `back/package.json`
- `back/.env.example`
- `back/src/index.js`
- `back/src/config.js`
- `back/src/database/db.js`
- `back/src/routes/products.js`
- `back/src/routes/orders.js`
- `back/src/routes/reviews.js`
- `back/src/services/products.js`
- `back/src/services/telegram.js`
- `back/src/services/email.js`
- `back/src/services/emailListener.js`
- `back/src/services/uploads.js`
- `back/src/utils/http.js`
- `back/src/utils/sanitize.js`
- `back/src/scripts/normalize-db.js`
- `back/src/telegram/**`
- `back/test-backend.js`
- `back/test-api.js`
- `back/test-order.js`
- `back/test-front-contract.js`

### 7.3. Запуск backend

Точка входа: `back/src/index.js`

Что делает:

- грузит `.env`
- настраивает глобальные обработчики ошибок процесса
- создаёт Express app
- включает:
  - helmet
  - cors
  - `express.json`
  - `express.urlencoded`
  - rate limiters
- раздаёт `/uploads`
- подключает роуты `/api/products`, `/api/orders`, `/api/reviews`
- отдаёт `/health`
- отдаёт `/api` со списком endpoint'ов
- стартует Telegram bot
- стартует email listener
- умеет graceful shutdown по `SIGINT`/`SIGTERM`

### 7.4. Конфигурация backend

`back/src/config.js` — центральное место для env.

Ключевые поля:

- `port`
- `apiUrl`
- `publicApiBaseUrl`
- `corsOrigins`
- `storageRoot`
- `dataDir`
- `uploadsDir`
- `dbPath`
- `authorizedChatsFile`
- `telegramBotToken`
- `telegramBotPassword`
- `email.{host,port,user,pass}`
- `incomingEmail.{host,port,user,pass}`

Очень важная логика:

- `PUBLIC_API_BASE_URL` приоритетнее runtime-хоста для абсолютных asset URLs
- если `PUBLIC_API_BASE_URL` не задан, используется `RENDER_EXTERNAL_URL`, а потом `API_URL`
- если задан `STORAGE_DIR`, данные и загрузки уезжают в persistent storage

### 7.5. Static uploads

`/uploads` раздаётся из `config.uploadsDir`.

По умолчанию локально:

- uploads dir = `back/src/uploads`

В production при `STORAGE_DIR=/var/data/jaluzi`:

- uploads dir = `/var/data/jaluzi/uploads`

### 7.6. Rate limits

API limiter:

- окно 15 минут
- максимум 100 запросов

Order limiter:

- окно 1 час
- максимум 10 заявок

### 7.7. CORS

Бэкенд принимает origin только из `CORS_ORIGIN`.

Особенности:

- origin список нормализуется без завершающего `/`
- disallowed origin не вызывает 500, просто не получает CORS headers
- для `ngrok` фронт может слать `ngrok-skip-browser-warning`, этот header разрешён на бэке

## 8. REST API: фактические контракты

### 8.1. Общие правила

Успешный ответ обычно имеет вид:

```json
{
  "success": true,
  "data": ...
}
```

Ошибки обычно имеют вид:

```json
{
  "success": false,
  "error": "..."
}
```

### 8.2. Health

`GET /health`

Ответ:

```json
{
  "status": "ok",
  "timestamp": "ISO date",
  "uptime": 123.45
}
```

### 8.3. API info

`GET /api`

Служебный endpoint со списком основных роутов.

### 8.4. Products

`GET /api/products`

Возвращает массив товаров.

Поля товара:

- `id: number`
- `name: string`
- `category: string`
- `price: number`
- `description: string`
- `image: string`
- `in_stock: boolean`
- `created_at?: string`
- `updated_at?: string`

Важно:

- `image` в API уже абсолютный URL
- в JSON-хранилище изображение лежит как относительный путь `/uploads/...`

`GET /api/products/:id`

- один товар

`POST /api/products`

Ожидает:

- `name`
- `category`
- `price`
- optional `description`
- optional `image`
- optional `in_stock` или `inStock`

`PUT /api/products/:id`

- partial update
- `in_stock` и `inStock` оба поддерживаются

`DELETE /api/products/:id`

- удаляет товар

### 8.5. Orders

`POST /api/orders`

Ожидает:

- `name`
- `phone`
- `blindsType`
- optional `message`

Особенности:

- `blindsType` нормализуется
- телефон валидируется регуляркой
- заявка сохраняется в JSON
- потом параллельно отправляются уведомления в Telegram и email
- даже если уведомление не ушло, заказ уже сохранён

Ответ:

```json
{
  "success": true,
  "orderId": 123,
  "message": "Order created",
  "notifications": {
    "telegram": { "...": "..." },
    "email": { "...": "..." }
  }
}
```

### 8.6. Reviews

`GET /api/reviews`

Возвращает отзывы, отсортированные по `created_at desc`.

Поля:

- `id`
- `name`
- `blindsType`
- `photos: string[]`
- `comment`
- `rating`
- `created_at`

Важно:

- `photos` в API всегда массив
- относительные `/uploads/...` преобразуются в абсолютные URL

`POST /api/reviews`

Ожидает:

- `name`
- `blindsType`
- `comment`
- optional `photos`
- optional `rating`

Если `rating` некорректный, по умолчанию ставится `5`.

`DELETE /api/reviews/:id`

- удаляет отзыв

### 8.7. Works

`GET /api/reviews/works`

Возвращает массив работ, отсортированный по `created_at desc`.

Поля:

- `id`
- `title`
- `photo`
- `created_at`

Важно:

- `photo` в API абсолютный URL
- если у работы нет фото, подставляется fallback из первого товара

`POST /api/reviews/works`

Ожидает:

- `photo`
- optional `title`

`DELETE /api/reviews/works/:id`

- удаляет работу

## 9. Нормализация данных и доменная логика

`back/src/utils/sanitize.js` содержит основные доменные helper'ы.

Канонические типы жалюзи:

- `Рулонные`
- `Вертикальные`
- `Горизонтальные`
- `Другое`

Поддерживаемые входные alias:

- `roller` -> `Рулонные`
- `vertical` -> `Вертикальные`
- `horizontal` -> `Горизонтальные`
- `other` -> `Другое`

Это важно, потому что:

- фронт отправляет русские значения
- старые тесты и часть старых данных могли отправлять английские

## 10. JSON storage и реальные модели данных

### 10.1. Где лежат данные

Локально по умолчанию:

- `back/data/db.json`
- `back/data/authorizedChats.json`
- `back/src/uploads/`

В production при `STORAGE_DIR=/var/data/jaluzi`:

- `/var/data/jaluzi/data/db.json`
- `/var/data/jaluzi/data/authorizedChats.json`
- `/var/data/jaluzi/uploads/`

### 10.2. Структура `db.json`

Корневые ключи:

- `products`
- `orders`
- `reviews`
- `works`

### 10.3. Product schema

Пример:

```json
{
  "id": 1,
  "name": "Рулонные жалюзи Mini",
  "category": "Рулонные",
  "price": 890,
  "description": "...",
  "image": "/uploads/products/....jpg",
  "in_stock": true,
  "created_at": "...",
  "updated_at": "..."
}
```

### 10.4. Order schema

Пример:

```json
{
  "id": 1775089621281,
  "name": "Иван",
  "phone": "+79999999999",
  "blindsType": "Рулонные",
  "blinds_type": "Рулонные",
  "message": "..."
}
```

Поля `blindsType` и `blinds_type` поддерживаются одновременно ради совместимости.

### 10.5. Review schema

Пример:

```json
{
  "id": 1,
  "name": "Анна",
  "blindsType": "Рулонные",
  "photos": ["https://..."],
  "comment": "...",
  "rating": 5,
  "created_at": "..."
}
```

### 10.6. Work schema

Пример:

```json
{
  "id": 1,
  "title": "Вертикальные арки ...",
  "photo": "/uploads/products/....jpg",
  "created_at": "..."
}
```

### 10.7. Authorized chats

`authorizedChats.json` — это простой массив Telegram chat id.

Пример:

```json
[1034074077]
```

## 11. Telegram admin: как устроено

### 11.1. Общая идея

Вместо отдельной веб-админки используется Telegram-бот.

Файлы:

- `back/src/telegram/index.js`
- `back/src/telegram/keyboards/main.js`
- `back/src/telegram/handlers/products.js`
- `back/src/telegram/handlers/reviews.js`
- `back/src/telegram/handlers/works.js`
- `back/src/telegram/handlers/photos.js`
- `back/src/telegram/middleware/auth.js`
- `back/src/telegram/middleware/state.js`

### 11.2. Авторизация

Сценарий:

- пользователь пишет боту
- если chat id не авторизован, бот ждёт пароль `TELEGRAM_BOT_PASSWORD`
- после успешного ввода chat id сохраняется в `authorizedChats.json`

### 11.3. Команды

Поддерживаются:

- `/start`
- `/stats`
- `/products`
- `/reviews`
- `/works`
- `/help`

### 11.4. Главное меню

Кнопки:

- `📊 Статистика`
- `📦 Товары`
- `📝 Отзывы`
- `🖼️ Наши работы`
- `📚 Помощь`

### 11.5. Product wizard

Добавление товара:

1. название
2. категория
3. цена
4. описание
5. URL фото или upload файла

Редактирование товара:

- название
- категория
- цена
- флаг наличия
- загрузка фото

Удаление:

- по ID

### 11.6. Review wizard

Добавление отзыва:

1. имя
2. тип жалюзи
3. рейтинг
4. текст

Удаление:

- по ID

### 11.7. Work wizard

Добавление работы:

1. фото файлом или URL
2. title

Удаление:

- по ID

### 11.8. Uploads через Telegram

`back/src/services/uploads.js`

- получает Telegram file link
- скачивает файл через `fetch`
- сохраняет в uploads directory
- возвращает относительный путь `/uploads/...`

Товары сейчас загружаются в поддиректорию `products`.
Работы могут загружаться в другую поддиректорию, если это потребуется в дальнейшем.

### 11.9. State management

`back/src/telegram/middleware/state.js`

- in-memory объект `userStates`
- хранит wizard state по `chatId`
- очищает старые состояния раз в 10 минут
- maxAge по умолчанию 1 час

Это значит:

- после рестарта процесса незавершённые wizard-состояния теряются
- это нормально и считается допустимым для текущей архитектуры

## 12. Email subsystem

### 12.1. Outgoing order emails

`back/src/services/email.js`

- создаёт transporter lazily
- использует `nodemailer`
- отправляет уведомление о новой заявке на `config.email.user`
- брендированный sender name: `Питер-Жалюзи`

### 12.2. Incoming email listener

`back/src/services/emailListener.js`

Назначение:

- подключаться к почте через IMAP
- находить непрочитанные письма
- парсить письмо
- классифицировать письмо
- если письмо похоже на заявку или на реальное письмо от человека, пересылать его целиком в Telegram
- если письмо автоматическое, сервисное, внутреннее или спам-подобное, учитывать его в суточной сводке

Текущее поведение:

- раз в 3 минуты создаётся цикл проверки
- на каждой проверке создаётся ImapFlow client
- открывается `INBOX`
- выбираются `seen: false` и письма без custom keyword обработки
- письмо парсится `simpleParser`
- после обработки письмо помечается как `\Seen` и IMAP keyword обработки
- неважные письма не пересылаются в Telegram целиком, а копятся в daily digest

### 12.3. Telegram уведомления о почте

Отправляются всем chat id из `authorizedChats.json`.

## 13. Runtime storage и деплой

### 13.1. Локальный режим

Фронт:

- `PUBLIC_API_URL=http://localhost:3001`
- `SITE_URL=http://localhost:4321`

Бэк:

- `PORT=3001`
- `PUBLIC_API_BASE_URL=http://localhost:3001`
- `CORS_ORIGIN=http://localhost:4321,http://127.0.0.1:4321,...`

### 13.2. Production режим

Одна Ubuntu VM в Yandex Cloud, Docker Compose (`docker-compose.yml`):

- Caddy отдаёт статику и проксирует публичный `/api`, `/uploads`, `/health`
- контейнер `api` с `PROCESS_ROLE=api` (публичный HTTP, Telegram send-only)
- контейнер `worker` с `PROCESS_ROLE=worker` (Telegram polling + IMAP)
- фронт собирается с пустым `PUBLIC_API_URL` (same-origin)
- `PUBLIC_API_BASE_URL=https://piter-jaluzi.ru`
- `STORAGE_DIR=/var/data/jaluzi` на Docker-томе `piter-jaluzi_jaluzi-data`
- `TELEGRAM_API_ROOT` указывает на Cloudflare Worker, не на `api.telegram.org`
- домен и почта остаются на REG.RU, вручную меняются только A-записи `@` и `www`

Локальный Docker без TLS: `docker compose -f docker-compose.dev.yml up --build` → `http://localhost:8080`.

### 13.3. Важное про диск

Без постоянного тома production недопустим.

Если том потерять:

- пропадёт SQLite (`db.db`)
- пропадут uploads
- пропадут `authorizedChats.json`

### 13.4. Рекомендуемые production env

Шаблон — корневой `.env.example`.

Минимум:

- `NODE_ENV=production`
- `PROCESS_ROLE=api` (worker-контейнер переопределяет на `worker`)
- `CORS_ORIGIN=https://piter-jaluzi.ru,https://www.piter-jaluzi.ru`
- `STORAGE_DIR=/var/data/jaluzi`
- `PUBLIC_API_BASE_URL=https://piter-jaluzi.ru`
- `PUBLIC_API_URL=`
- `TELEGRAM_API_ROOT=https://piter-jaluzi-tg-proxy.<subdomain>.workers.dev`

Остальное:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_PASSWORD`
- `EMAIL_HOST=mail.hosting.reg.ru`
- `EMAIL_PORT=465`
- `EMAIL_USER=info@piter-jaluzi.ru`
- `EMAIL_PASS=...`
- `INCOMING_EMAIL_HOST=mail.hosting.reg.ru`
- `INCOMING_EMAIL_PORT=993`
- `INCOMING_EMAIL_USER=info@piter-jaluzi.ru`
- `INCOMING_EMAIL_PASS=...`
- `ACME_EMAIL=info@piter-jaluzi.ru`

## 14. Тесты и команды

### 14.1. Front

Основные команды:

- `npm run dev`
- `npm run check`
- `npm run build`
- `npm run preview`

### 14.2. Back

Основные команды:

- `npm run dev`
- `npm run start`
- `npm run check`
- `npm run normalize:data`
- `npm run test:smoke`
- `npm run test:contract`

### 14.3. Назначение тестов

`back/test-front-contract.js`

- проверяет фронт-бэк контракт по:
  - `/api/products`
  - `/api/reviews`
  - `/api/reviews/works`
- проверяет CORS для разрешённого и запрещённого origin

`back/test-backend.js`

- health
- товары
- существование JSON-базы
- write-test заявок по умолчанию выключен

`back/test-order.js`

- имитация запроса формы заказа
- write-test включается только при `ALLOW_WRITE_TESTS=1`

`back/test-api.js`

- простой smoke для health/products/orders

### 14.4. Важное про тесты записи

По умолчанию проект больше не засоряет `db.json` тестовыми заказами.

Чтобы включить write-smoke:

```bash
ALLOW_WRITE_TESTS=1 node test-order.js
```

## 15. Нормализация данных

`back/src/scripts/normalize-db.js`

Назначение:

- привести asset paths к относительному виду `/uploads/...`
- нормализовать категории товаров
- нормализовать `blindsType` / `blinds_type`
- выровнять фото работ
- гарантировать корректный shape JSON

Это полезно запускать после ручных массовых правок в `db.json` или после миграции хранилища.

## 16. Кодстайл и инженерные правила проекта

### 16.1. Frontend style

- Astro используется для статических шаблонов
- тяжёлая логика не пишется inline в `.astro`, а выносится в `public/scripts`
- состояние UI решается простым DOM API, без framework-runtime
- стили централизованы в двух CSS-файлах

### 16.2. Backend style

- CommonJS
- небольшие route/service модули
- без ORM
- основное хранилище — SQLite (`better-sqlite3`), JSON используется как seed/миграция

### 16.3. API style

- как правило `success + data`
- asset paths в storage относительные
- asset URLs в API абсолютные

## 17. Известные ограничения и технические долги

1. JSON-хранилище не является полноценной БД.
   При росте проекта лучше мигрировать на PostgreSQL.

2. Telegram state in-memory.
   После рестарта wizard-состояния пользователей теряются.

3. Форма отзыва на фронте пока не загружает фото.
   API поддерживает `photos`, но UI-форма отправляет только текстовый отзыв.

4. Админка через Telegram удобна для малого проекта, но это не замена полноценной CMS.

5. В `front/src/pages/works-reviews.astro` ещё остаётся заметный объём inline-styles.
   Это не критическая ошибка, но потенциальная зона для дальнейшей чистки.

6. В `back/data/db.json` есть исторические мусорные записи в orders с неидеальными данными.
   Технически это не ломает проект, но при желании можно отдельно зачистить старые заявки.

## 18. Что особенно важно будущей модели не сломать

1. Фронт статический.
   В проде `PUBLIC_API_URL` пустой. Если снова нужен отдельный API-домен, фронт нужно пересобрать.

2. API-контракт между фронтом и бэком уже выровнен.
   Не менять поля без необходимости:
   - product: `id,name,category,price,description,image`
   - review: `id,name,blindsType,comment,rating,photos,created_at`
   - work: `id,title,photo,created_at`

3. Asset paths в `db.json` должны оставаться относительными.
   Пример: `/uploads/products/file.jpg`

4. Для production нельзя убирать `STORAGE_DIR`/persistent disk.

5. `CORS_ORIGIN` указывается без завершающего `/`.

6. В репозитории есть локальные `.env` с реальными секретами.
   Их нельзя печатать в лог, копировать в документацию или коммитить.

## 19. Если нужно быстро продолжить разработку

Минимальный порядок действий для новой модели:

1. Прочитать этот файл.
2. Проверить `README.md`, `DEPLOY.md`, `ARCHITECTURE.md` только как вспомогательные материалы.
3. Игнорировать `node_modules`, `dist`, `.astro`, `.git`, `.idea`.
4. Для UI-изменений смотреть:
   - `front/src/pages/*`
   - `front/src/components/*`
   - `front/public/scripts/*`
   - `front/src/styles/*`
5. Для данных и API смотреть:
   - `back/src/index.js`
   - `back/src/config.js`
   - `back/src/routes/*`
   - `back/src/database/db.js`
   - `back/src/utils/*`
6. Для Telegram-админки смотреть:
   - `back/src/telegram/index.js`
   - `back/src/telegram/handlers/*`
   - `back/src/telegram/keyboards/main.js`
7. После любых значимых изменений гонять:
   - `front/npm run build`
   - `back/npm run check`
   - при изменении контракта `back/npm run test:contract`

## 20. Текущее рабочее состояние на дату документа

На дату 2026-04-04 подтверждено:

- фронт собирается
- бэкенд проходит syntax/check
- контракт фронт-бэк проходит
- локальная схема `localhost:4321 -> localhost:3001` рабочая
- проект подготовлен под схему `Yandex Cloud Ubuntu VM + Docker Compose + REG.RU DNS + Cloudflare Telegram proxy`
- канонический репозиторий: `ezhigval/JALUZI`
- бренд и домен приведены к:
- бренд и домен приведены к:
  - `Питер-Жалюзи`
  - `piter-jaluzi.ru`
  - `info@piter-jaluzi.ru`

Если будущая модель сомневается, с чего начать, нужно начинать с этого файла, потом смотреть реальные точки входа:

- `front/src/layouts/BaseLayout.astro`
- `front/public/scripts/main.js`
- `back/src/index.js`
- `back/src/config.js`
- `back/src/routes/*.js`
