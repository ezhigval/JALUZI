# Deploy: Яндекс Облако + REG.RU DNS + Cloudflare для Telegram

Дата актуализации: 2026-08-23

Канонический git-репозиторий: `https://github.com/ezhigval/JALUZI`.

Прод — одна Ubuntu VM в Yandex Cloud. Фронт и публичный API на `https://piter-jaluzi.ru`.
Telegram admin bot и IMAP listener работают во внутреннем контейнере `worker` без открытых портов.
Исходящие запросы к Telegram идут через Cloudflare Worker (`TELEGRAM_API_ROOT`).

Домен остаётся на REG.RU. Почта остаётся на `mail.hosting.reg.ru`. A-записи правятся вручную.

## Модель безопасности

| Слой | Что открыто | Что закрыто |
| --- | --- | --- |
| Интернет → Caddy `:80/:443` | статика, `GET /api/products`, `POST /api/orders`, `GET\|POST /api/reviews`, `GET /api/reviews/works`, `/uploads`, `/health` | admin CRUD товаров/работ/отзывов, Telegram, IMAP |
| Docker network `backend` | `api` ↔ `worker` через общий том данных | нет publish портов worker |
| Исходящий Telegram | Cloudflare Worker → `api.telegram.org` | прямой доступ с VM к Telegram не обязателен |

Админка — только Telegram-бот во `worker`. Публичный HTTP в production не создаёт и не удаляет товары и работы.

## VM

| Поле | Значение |
| --- | --- |
| Instance ID | `fv41g9i64264k1j55ogh` |
| Login | `jaluzi-admin` |
| Публичный IPv4 | `158.160.226.47` |
| Каталог на диске | `/opt/piter-jaluzi` |

## 1. Локальный запуск

### Backend

```bash
cd back
cp .env.example .env
npm install
npm run dev
```

`PROCESS_ROLE=all` поднимает HTTP + Telegram + IMAP в одном процессе.
В `NODE_ENV=development` HTTP ещё отдаёт admin CRUD (только для локальной отладки).

### Frontend

```bash
cd front
cp .env.example .env.local
npm install
npm run dev
```

### Docker, как в проде, но по HTTP

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

Сайт: `http://localhost:8080`. Let's Encrypt не используется.

## 2. DNS на REG.RU

Оставьте NS и почтовые записи как есть. После того как VM получила постоянный IPv4:

| Тип | Хост | Значение |
| --- | --- | --- |
| A | `@` | `158.160.226.47` |
| A | `www` | `158.160.226.47` |

Не трогайте MX / SPF / DKIM / DMARC и `mail.*`.

Проверка:

```bash
dig +short A piter-jaluzi.ru
dig +short MX piter-jaluzi.ru
```

Caddy получит сертификат только когда A-записи уже резолвятся на эту машину.

## 3. Cloudflare Worker для Telegram

С машины с Node и аккаунтом Cloudflare:

```bash
npx wrangler deploy deploy/cloudflare/telegram-proxy-worker.js \
  --name piter-jaluzi-tg-proxy \
  --compatibility-date 2026-08-23
```

В `.env` на VM:

```env
TELEGRAM_API_ROOT=https://piter-jaluzi-tg-proxy.<subdomain>.workers.dev
```

Без этого worker на Yandex Cloud в РФ часто не достучится до `api.telegram.org`.

## 4. Первый запуск на Ubuntu

С локальной машины (ключ из консоли Yandex Cloud, zip `ssh-key-*.zip`):

```bash
unzip ssh-key-*.zip -d ~/.ssh
chmod 600 ~/.ssh/ssh-key-*
ssh -i ~/.ssh/ssh-key-<id> -l jaluzi-admin 158.160.226.47
```

Или через YC CLI:

```bash
yc compute ssh \
  --id fv41g9i64264k1j55ogh \
  --identity-file ~/.ssh/ssh-key-<id> \
  --login jaluzi-admin
```

На VM:

```bash
sudo apt-get update
sudo apt-get install -y git
sudo git clone https://github.com/ezhigval/JALUZI.git /opt/piter-jaluzi
cd /opt/piter-jaluzi
sudo ./deploy/setup-ubuntu.sh
sudo nano /opt/piter-jaluzi/.env
sudo ./deploy/deploy.sh
```

В `.env` обязательны: Telegram, почта, `TELEGRAM_API_ROOT`, `ACME_EMAIL`.
Шаблон — корневой `.env.example`.

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

На ноутбуке:

```bash
./deploy/pack-local-data.sh
scp -i ~/.ssh/ssh-key-<id> /tmp/jaluzi-data.tar.gz jaluzi-admin@158.160.226.47:/tmp/
```

На VM, после первого `docker compose up`:

```bash
cd /opt/piter-jaluzi
docker compose -p piter-jaluzi stop api worker
docker run --rm \
  -v piter-jaluzi_jaluzi-data:/var/data/jaluzi \
  -v /tmp/jaluzi-data.tar.gz:/tmp/jaluzi-data.tar.gz \
  alpine sh -c 'mkdir -p /var/data/jaluzi && tar -xzf /tmp/jaluzi-data.tar.gz -C /var/data/jaluzi'
docker compose -p piter-jaluzi start api worker
```

Если архив не копировать, API поднимет каталог из `back/data/db.seed.json` и фото из `back/src/uploads/products`.

## 6. Обновление сайта

```bash
cd /opt/piter-jaluzi
sudo ./deploy/deploy.sh
```

Скрипт делает `git pull`, пересобирает фронт и API, перезапускает контейнеры.

## 7. Почта и Telegram

Почтовый ящик `info@piter-jaluzi.ru` остаётся на REG.RU.

- SMTP: `mail.hosting.reg.ru:465`
- IMAP: `mail.hosting.reg.ru:993`

VM только ходит туда наружу. Отдельный почтовый сервер на виртуалке не нужен.

Telegram-бот работает long polling из контейнера `worker`. Откройте бота и авторизуйтесь паролем из `.env`.

## 8. Что выключить после переезда

- Render web service `piter-jaluzi-backend`
- статическую заливку `front/dist/` на хостинг REG.RU
- старые `PUBLIC_API_URL` вида `*.onrender.com`

Пока DNS не переключили, текущий сайт на REG.RU + Render продолжит работать.
