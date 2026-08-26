# Deploy: Яндекс Облако + Mailpit + Cloudflare Telegram + GitHub autodeploy

Дата актуализации: 2026-08-26

Канонический git-репозиторий: `https://github.com/ezhigval/JALUZI`.

Прод — одна Ubuntu VM в Yandex Cloud. Фронт и публичный API на `https://piter-jaluzi.ru`.
Telegram admin bot работает во `worker`. Исходящие заявки пишутся в **Mailpit** (SMTP внутри compose).
Исходящие запросы к Telegram идут через Cloudflare Worker (`TELEGRAM_API_ROOT`).

## Каталог и SEO

- Товары из парсера Intersklad помечаются `source=parser`: видны в каталоге (те же карточки/модалки), **без** отдельных SEO-страниц и без попадания в sitemap.
- Товары, добавленные вручную (Telegram и т.п.), получают `source=manual`, slug и страницу `/catalog/p/<slug>` + запись в `/sitemap.xml`.
- Повторный импорт парсера заменяет только `parser`-строки и **не удаляет** ручные товары.

### Google Search Console + Яндекс.Вебмастер

1. [Google Search Console](https://search.google.com/search-console) → ресурс `https://piter-jaluzi.ru` → подтверждение meta `google-site-verification` (код в `.env` / `config.json`).
2. [Яндекс.Вебмастер](https://webmaster.yandex.ru) → сайт → HTML-файл `/yandex_132f0d56d1d3cf89.html` или meta `yandex-verification`.
3. После деплоя отправить sitemap: `https://piter-jaluzi.ru/sitemap.xml`.
4. Для Метрики/GA задать `PUBLIC_YANDEX_METRIKA_ID` / `PUBLIC_GA_MEASUREMENT_ID` и пересобрать `web`.

Домен DNS остаётся на REG.RU. MX для боевой почты не трогаем; локальный Mailpit — только исходящие заявки с сайта.

## Модель безопасности

| Слой | Что открыто | Что закрыто |
| --- | --- | --- |
| Интернет → Caddy `:80/:443` | статика, публичный API, `/health`, `/internal/*` только с `DEPLOY_HOOK_SECRET` | admin CRUD, Telegram, IMAP |
| Docker `backend` | `api` ↔ `worker` ↔ `mailpit:1025` | Mailpit UI только `127.0.0.1:8025` |
| Исходящий Telegram | Cloudflare Worker → `api.telegram.org` | прямой доступ с VM к Telegram не обязателен |

Админка — только Telegram-бот во `worker`.

## VM (актуально)

| Поле | Значение |
| --- | --- |
| Hostname | `compute-vm-2-2-20-ssd-1787471749812` |
| Login | `smailikin70` |
| Публичный IPv4 | `93.77.163.4` |
| Каталог | `/opt/piter-jaluzi` |

Inbound SSH с чужих сетей часто режется до eth0. Рабочие каналы доступа:

1. **GitHub autodeploy** (основной, без лимита 60 мин) — VM сама тянет git каждые 2 минуты.
2. **HTTPS hook** `POST /internal/deploy` + `Authorization: Bearer $DEPLOY_HOOK_SECRET`.
3. **Cloudflare Tunnel** (`deploy/install-cloudflared.sh`) — постоянный SSH без открытия :22 в интернет.
4. Временный Pinggy reverse tunnel — только пока сессия жива.

## 1. Локальный запуск

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

- сайт: http://localhost:8080  
- Mailpit UI: http://localhost:8025  

## 2. DNS

| Тип | Хост | Значение |
| --- | --- | --- |
| A | `@` | `93.77.163.4` |
| A | `www` | `93.77.163.4` |

MX / SPF / DKIM не трогать.

## 3. Cloudflare Worker для Telegram + webhook

```bash
cd deploy/cloudflare
npx wrangler deploy
```

В `.env` на VM:

```env
TELEGRAM_API_ROOT=https://piter-jaluzi-tg-proxy.<subdomain>.workers.dev
TELEGRAM_MODE=webhook
TELEGRAM_WEBHOOK_PATH=/telegram/webhook
TELEGRAM_WEBHOOK_SECRET=<openssl rand -hex 24>
SITE_URL=https://piter-jaluzi.ru
```

Caddy отдаёт `POST /telegram/webhook` на `api`. Бот вызывает `setWebhook` через `TELEGRAM_API_ROOT` (CF Worker).  
Пока DNS/SSL не готовы, временно `TELEGRAM_MODE=polling`.

## 4. SSL (Let's Encrypt через Caddy)

Caddy сам выпускает сертификат для `piter-jaluzi.ru`, когда:

1. A-записи `@` и `www` указывают на IP VM (`93.77.163.4`), не на REG.RU parking.
2. С интернета открыты `:80` и `:443` до этой VM.
3. В `.env` задан `ACME_EMAIL`.

Проверка:

```bash
dig +short A piter-jaluzi.ru   # должно быть 93.77.163.4
curl -fsS https://piter-jaluzi.ru/health
docker compose logs web | tail -50
```

Если домен ещё на `31.31.x.x` (parking REG.RU) — сертификат и webhook не заработают, пока не смените A-записи.

## 5. Google Search Console и Яндекс.Вебмастер (подробно)

Техническая база (JSON-LD LocalBusiness/WebSite, Open Graph, `robots.txt` Host/Clean-param, sitemap) уже в коде. Краткая шпаргалка также в разделе «Каталог и SEO» выше. Чтобы поисковики приняли сайт:

1. Зарегистрируйте сайт в [Google Search Console](https://search.google.com/search-console) и [Яндекс.Вебмастер](https://webmaster.yandex.ru) как `https://piter-jaluzi.ru`.
2. Выберите проверку через HTML-meta (`google-site-verification` / `yandex-verification`) и скопируйте **только значение** `content=…` (или используйте уже задеплоенный файл `/yandex_132f0d56d1d3cf89.html`).
3. На VM в `/opt/piter-jaluzi/.env` добавьте (перекрывают значения из `front/src/data/config.json`; при необходимости — ID счётчиков):

```env
PUBLIC_GOOGLE_SITE_VERIFICATION=<код из Search Console>
PUBLIC_YANDEX_VERIFICATION=<код из Вебмастера>
PUBLIC_YANDEX_METRIKA_ID=
PUBLIC_GA_MEASUREMENT_ID=
```

4. Пересоберите фронт (переменные `PUBLIC_*` вшиваются в образ Astro на этапе `build`, hot-patch HTML недостаточен):

```bash
cd /opt/piter-jaluzi
docker compose build web
docker compose up -d web
```

5. В обоих кабинетах подтвердите владение, затем отправьте sitemap: `https://piter-jaluzi.ru/sitemap.xml`.

Рост позиций занимает время; этот шаг только подключает индексацию и аналитику.

## 6. Первый запуск / обновление на VM

```bash
cd /opt/piter-jaluzi
cp -n .env.example .env   # затем заполнить секреты
sudo ./deploy/install-autodeploy.sh
./deploy/deploy.sh
```

Mailpit UI с ноутбука:

```bash
ssh -L 8025:127.0.0.1:8025 smailikin70@93.77.163.4
# открыть http://127.0.0.1:8025
```

## 7. Постоянный доступ агента (не Pinggy)

### A. Autodeploy с GitHub (рекомендуется)

```bash
sudo ./deploy/install-autodeploy.sh
```

Пуш в tracked branch (`AUTODEPLOY_BRANCH`, по умолчанию `main`) → VM сама `git pull` + `compose up` за ~2 минуты.  
Лог: `deploy/logs/autodeploy.log`.

Опционально сразу после пуша:

```bash
curl -X POST -H "Authorization: Bearer $DEPLOY_HOOK_SECRET" \
  https://piter-jaluzi.ru/internal/deploy
```

### B. Cloudflare Tunnel (постоянный SSH)

```bash
export CLOUDFLARED_TUNNEL_TOKEN='…'
sudo ./deploy/install-cloudflared.sh
```

В Zero Trust привяжите hostname → `ssh://localhost:22`.

## 8. Почта

По умолчанию исходящие заявки → **Mailpit** (`EMAIL_HOST=mailpit`, порт `1025`).  
IMAP listener выключен (`INCOMING_EMAIL_HOST=` пустой), пока REG.RU пароль не починен.

Вернуть REG.RU SMTP:

```env
EMAIL_HOST=mail.hosting.reg.ru
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=info@piter-jaluzi.ru
EMAIL_PASS=…
```

## 9. Образы без Docker Hub

`deploy/api.Dockerfile` берёт Node с `mirror.gcr.io`.  
Mailpit — с `ghcr.io/axllent/mailpit` (Hub с VM часто timeout).
