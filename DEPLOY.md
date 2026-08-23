# Deploy: Яндекс Облако + REG.RU DNS + Cloudflare для Telegram

Дата актуализации: 2026-08-23

Прод — одна Ubuntu VM в Yandex Cloud. Фронт и публичный API на `https://piter-jaluzi.ru`.
Telegram admin bot и IMAP listener работают во внутреннем контейнере `worker` без открытых портов.
Исходящие запросы к Telegram идут через Cloudflare Worker proxy (`TELEGRAM_API_ROOT`).

Домен остаётся на REG.RU. Почта остаётся на `mail.hosting.reg.ru`. A-записи правятся вручную.

## Модель безопасности

| Слой | Что открыто | Что закрыто |
| --- | --- | --- |
| Интернет → Caddy `:80/:443` | статика, `GET /api/products`, `POST /api/orders`, `GET|POST /api/reviews`, `GET /api/reviews/works`, `/uploads`, `/health` | admin CRUD товаров/работ/отзывов, Telegram, IMAP |
| Docker network `backend` | `api` ↔ `worker` через общий том данных | нет publish портов worker |
| Исходящий Telegram | Cloudflare Worker → `api.telegram.org` | прямой доступ с VM к Telegram не обязателен |

Админка — только Telegram-бот во `worker`. Публичный HTTP не умеет создавать/удалять товары и работы.

## 1. Локальный запуск

### Backend

```bash
cd back
cp .env.example .env
npm install
npm run dev
```

`PROCESS_ROLE=all` поднимает HTTP + Telegram + IMAP в одном процессе.

### Frontend

```bash
cd front
cp .env.example .env.local
npm install
npm run dev
```

## 2. DNS на REG.RU

После того как VM получила IP `158.160.226.47`:

| Тип | Хост | Значение |
| --- | --- | --- |
| A | `@` | `158.160.226.47` |
| A | `www` | `158.160.226.47` |

Не трогайте MX / SPF / DKIM / DMARC и `mail.*`.

## 3. Cloudflare Worker для Telegram

С Yandex Cloud VM в РФ `api.telegram.org` **не открывается** (timeout).
Cloudflare WARP на этой VM тоже не зарегистрировался (`Failed to communicate with the WARP API`).

Нужен **постоянный** Cloudflare Worker. Temporary preview (`wrangler deploy --temporary`) с IP датацентра ловит challenge 403 — для прода не подходит.

На Mac:

```bash
npm i -g wrangler
wrangler login
npx wrangler deploy deploy/cloudflare/telegram-proxy-worker.js \
  --name piter-jaluzi-tg-proxy \
  --compatibility-date 2026-08-23
```

В `/opt/piter-jaluzi/.env` на VM:

```env
TELEGRAM_API_ROOT=https://piter-jaluzi-tg-proxy.<ваш-subdomain>.workers.dev
```

Перезапуск:

```bash
cd /opt/piter-jaluzi
docker compose up -d --force-recreate api worker
docker compose logs -f worker
```

Ожидаемая строка: `Telegram bot initialized via https://...workers.dev`.

## 4. Первый запуск на Ubuntu

С Mac:

```bash
ssh -i ~/.ssh/ssh-key-1787471802829 -l jaluzi-admin 158.160.226.47
```

На VM:

```bash
sudo apt-get update
sudo apt-get install -y git
sudo git clone https://github.com/ezhigval/piter-jaluzi.git /opt/piter-jaluzi
cd /opt/piter-jaluzi
sudo ./deploy/setup-ubuntu.sh
sudo nano /opt/piter-jaluzi/.env
sudo ./deploy/deploy.sh
```

В `.env` обязательны: Telegram, почта, `TELEGRAM_API_ROOT`, `ACME_EMAIL`.

Проверка до переключения DNS:

```bash
curl -fsS http://158.160.226.47/health
curl -H 'Host: piter-jaluzi.ru' http://158.160.226.47/api/products
```

После DNS + HTTPS:

```bash
curl -fsS https://piter-jaluzi.ru/health
curl -fsS https://piter-jaluzi.ru/api/products
```

## 5. Перенос данных

```bash
./deploy/pack-local-data.sh
scp -i ~/.ssh/ssh-key-1787471802829 /tmp/jaluzi-data.tar.gz jaluzi-admin@158.160.226.47:/tmp/
```

На VM:

```bash
cd /opt/piter-jaluzi
docker compose stop api worker
docker run --rm \
  -v piter-jaluzi_jaluzi-data:/var/data/jaluzi \
  -v /tmp/jaluzi-data.tar.gz:/tmp/jaluzi-data.tar.gz \
  alpine sh -c 'mkdir -p /var/data/jaluzi && tar -xzf /tmp/jaluzi-data.tar.gz -C /var/data/jaluzi'
docker compose start api worker
```

## 6. Обновление

```bash
cd /opt/piter-jaluzi
sudo ./deploy/deploy.sh
```

## 7. Что выключить после переезда

- Render backend
- статику фронта на хостинге REG.RU
- старые `*.onrender.com` URL
