# Runbook — Питер-Жалюзи

Операционные сценарии для прод (`piter-jaluzi.ru`, VM `93.77.163.4`, каталог `/opt/piter-jaluzi`).

## Быстрая диагностика

```bash
curl -fsS https://piter-jaluzi.ru/health
curl -fsS https://piter-jaluzi.ru/sitemap.xml | head
docker compose -f /opt/piter-jaluzi/docker-compose.yml ps
tail -50 /opt/piter-jaluzi/deploy/logs/autodeploy.log
```

---

## Сайт недоступен (502 / timeout / белая страница)

1. **Проверить контейнеры:** `docker compose ps` — `web`, `api`, `worker` должны быть `Up`.
2. **Логи Caddy:** `docker compose logs web --tail=100`
3. **Логи API:** `docker compose logs api --tail=100`
4. **Health:** `curl -fsS https://piter-jaluzi.ru/health` — если локально на VM `curl localhost:3001/health` работает, проблема в Caddy/DNS.
5. **DNS:** `dig +short A piter-jaluzi.ru` → `93.77.163.4`
6. **SSL:** если сертификат истёк — `docker compose restart web`, проверить `ACME_EMAIL` в `.env`.
7. **Перезапуск:** `cd /opt/piter-jaluzi && docker compose up -d --build`
8. **Откат:** `git log -3` → `git checkout <commit> && ./deploy/deploy.sh`

---

## Telegram-бот молчит (не отвечает на команды)

1. **Worker жив:** `docker compose logs worker --tail=100`
2. **Webhook зарегистрирован на CF Worker**, не на IP VM:
   - `.env`: `TELEGRAM_WEBHOOK_PUBLIC_URL=https://piter-jaluzi-tg-proxy.chemical-red.workers.dev/telegram/webhook`
   - `TELEGRAM_API_ROOT` — тот же Worker (исходящие вызовы)
3. **Проверка ingress:** POST на Worker URL должен проксироваться на `https://piter-jaluzi.ru/telegram/webhook`
4. **Секрет:** `TELEGRAM_WEBHOOK_SECRET` совпадает в `.env` и заголовке `X-Telegram-Bot-Api-Secret-Token`
5. **Временный fallback:** `TELEGRAM_MODE=polling` + restart worker (только если CF недоступен)
6. **Перерегистрация webhook:** restart worker — при старте вызывается `setWebhook` с `TELEGRAM_WEBHOOK_PUBLIC_URL`

Подробнее: [DEPLOY.md](../DEPLOY.md) §3.

---

## Заявки не приходят (форма / почта / Telegram)

1. **API:** `curl -X POST https://piter-jaluzi.ru/api/orders -H 'Content-Type: application/json' -d '{"name":"Test","phone":"+79990001122","blindsType":"Рулонные"}'`
2. **Mailpit (dev/prod default):** `ssh -L 8025:127.0.0.1:8025 smailikin70@93.77.163.4` → http://127.0.0.1:8025
3. **SMTP credentials:** если переключились на REG.RU — проверить `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`
4. **Логи API:** `docker compose logs api | grep -i order`
5. **CORS:** заявка идёт с того же origin (`piter-jaluzi.ru`)

---

## Autodeploy не подтягивает main

1. `systemctl status piter-jaluzi-autodeploy.timer`
2. `tail -100 /opt/piter-jaluzi/deploy/logs/autodeploy.log`
3. `.env`: `AUTODEPLOY_BRANCH=main`, `AUTODEPLOY_REMOTE=origin`
4. Ручной деплой: `curl -X POST -H "Authorization: Bearer $DEPLOY_HOOK_SECRET" https://piter-jaluzi.ru/internal/deploy`
5. На VM: `cd /opt/piter-jaluzi && git fetch origin main && git reset --hard origin/main && ./deploy/deploy.sh`

---

## Бэкап и восстановление

Скрипт бэкапа: `deploy/backup.sh` — SQLite + uploads в `deploy/backups/` (или путь аргументом).

```bash
cd /opt/piter-jaluzi
./deploy/backup.sh /opt/backups
```

Проверка бота и webhook: `deploy/bot-healthcheck.sh` (cron каждые 5–15 мин).

**Restore (на тестовой копии, не на прод без проверки):**

```bash
docker compose stop api worker
cp /var/data/jaluzi/data/db.sqlite /var/data/jaluzi/data/db.sqlite.bak
tar -xzf backup-YYYYMMDD.tar.gz -C /var/data/jaluzi/
docker compose up -d api worker
curl -fsS https://piter-jaluzi.ru/health
```

---

## Контакты и ссылки

| Ресурс | URL |
| --- | --- |
| Сайт | https://piter-jaluzi.ru |
| GitHub | https://github.com/ezhigval/JALUZI |
| CF Worker | https://piter-jaluzi-tg-proxy.chemical-red.workers.dev |
| Mailpit (SSH tunnel) | http://127.0.0.1:8025 |
| План v2 | [docs/V2.md](./V2.md) |
