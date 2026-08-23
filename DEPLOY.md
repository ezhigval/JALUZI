# Deploy: Яндекс Облако + REG.RU DNS

Дата актуализации: 2026-08-23

Прод — одна Ubuntu VM в Yandex Cloud. Фронт и API на одном домене `https://piter-jaluzi.ru`.
Домен остаётся на REG.RU. Почта остаётся на `mail.hosting.reg.ru`. A-записи вы прописываете вручную.

## 1. Локальный запуск

### Backend

Создайте `back/.env` на основе `back/.env.example`.

```env
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:4321,http://127.0.0.1:4321
API_URL=http://localhost:3001
PUBLIC_API_BASE_URL=http://localhost:3001
```

```bash
cd back
npm install
npm run dev
```

### Frontend

Создайте `front/.env.local`:

```env
PUBLIC_API_URL=http://localhost:3001
SITE_URL=http://localhost:4321
```

```bash
cd front
npm install
npm run dev
```

## 2. Что должно получиться в проде

```
браузер
  → https://piter-jaluzi.ru          статическая витрина (Astro)
  → https://piter-jaluzi.ru/api/*    Express API
  → https://piter-jaluzi.ru/uploads  фото товаров и работ
  → https://piter-jaluzi.ru/health   healthcheck
```

Caddy закрывает 80/443, выпускает Let's Encrypt и проксирует `/api`, `/uploads`, `/health` в контейнер API.
`PUBLIC_API_URL` в проде пустой: браузер ходит на тот же домен, без Render и без CORS между площадками.

Данные API живут на Docker-томе:

- `/var/data/jaluzi/data/db.db`
- `/var/data/jaluzi/data/authorizedChats.json`
- `/var/data/jaluzi/uploads/*`

## 3. DNS на REG.RU — только это меняете руками

Оставьте NS и почтовые записи как есть. Меняйте только адреса сайта.

После того как у VM появится постоянный публичный IPv4:

| Тип | Хост | Значение | TTL |
| --- | --- | --- | --- |
| A | `@` | публичный IP виртуалки | 300–3600 |
| A | `www` | тот же IP | 300–3600 |

Не трогайте:

- MX, SPF, DKIM, DMARC
- записи `mail`, `mail.hosting.reg.ru`
- TXT для почты

Проверка после смены:

```bash
dig +short A piter-jaluzi.ru
dig +short A www.piter-jaluzi.ru
dig +short MX piter-jaluzi.ru
```

A должны смотреть на VM. MX должен по-прежнему указывать на почту REG.RU.

Caddy получит сертификат только когда A-записи уже резолвятся на эту машину.

## 4. Виртуалка в Yandex Cloud

Минимум:

- Ubuntu 24.04 LTS
- 2 vCPU / 2 ГБ RAM / 20 ГБ диск
- публичный IPv4, лучше зарезервированный
- security group / сетевой ACL: `22`, `80/tcp`, `443/tcp`, `443/udp`

SSH-ключ положите в метаданные VM. Парольный вход лучше выключить.

## 5. Первый запуск на Ubuntu

На своей машине:

```bash
ssh ubuntu@<VM_IP>
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

В `.env` обязательны:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_BOT_PASSWORD`
- `EMAIL_PASS`
- `INCOMING_EMAIL_PASS`
- `ACME_EMAIL`

Шаблон — корневой `.env.example`.

Проверка:

```bash
curl -fsS https://piter-jaluzi.ru/health
curl -fsS https://piter-jaluzi.ru/api/products
```

Сайт должен открываться и подтягивать каталог, работы и отзывы без отдельного backend-домена.

## 6. Перенос текущих данных

На ноутбуке:

```bash
./deploy/pack-local-data.sh
scp /tmp/jaluzi-data.tar.gz ubuntu@<VM_IP>:/tmp/
```

На VM, после первого `docker compose up`:

```bash
cd /opt/piter-jaluzi
docker compose stop api
docker run --rm \
  -v piter-jaluzi_jaluzi-data:/var/data/jaluzi \
  -v /tmp/jaluzi-data.tar.gz:/tmp/jaluzi-data.tar.gz \
  alpine sh -c 'mkdir -p /var/data/jaluzi && tar -xzf /tmp/jaluzi-data.tar.gz -C /var/data/jaluzi'
docker compose start api
```

Имя тома проверьте через `docker volume ls`.

Если архив не копировать, API поднимет каталог из `back/data/db.seed.json` (товары, отзывы, работы, без заявок).

## 7. Обновление сайта

```bash
cd /opt/piter-jaluzi
sudo ./deploy/deploy.sh
```

Скрипт делает `git pull`, пересобирает фронт и API, перезапускает контейнеры.

## 8. Почта и Telegram

Почтовый ящик `info@piter-jaluzi.ru` остаётся на REG.RU.

- SMTP: `mail.hosting.reg.ru:465`
- IMAP: `mail.hosting.reg.ru:993`

VM только ходит туда наружу. Отдельный почтовый сервер на виртуалке не нужен.

Telegram-бот работает long polling из контейнера API. Откройте бота и авторизуйтесь паролем из `.env`.

## 9. Что выключить после переезда

- Render web service `piter-jaluzi-backend`
- статическую заливку `front/dist/` на хостинг REG.RU
- старые `PUBLIC_API_URL` вида `*.onrender.com`

Пока DNS не переключили, текущий сайт на REG.RU + Render продолжит работать.
