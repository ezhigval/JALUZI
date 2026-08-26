# Roadmap — Питер-Жалюзи

Дата: 2026-08-26

## Версии

| Версия | Статус | Суть |
| --- | --- | --- |
| **v1** | ✅ Закрыт (прод) | Рабочий сайт на Yandex Cloud: каталог, заявки, Telegram admin, SEO-база, Метрика, CF-прокси |
| **v2** | ✅ Код закрыт; manual ops осталось | Качество кода, анти-AI следы, скорость, конверсия, ops, надёжность, **SEO-продвижение (Wordstat, семантика, карты, реклама)** — PR1–PR12 на `main` (`21c4b04`) |
| **v3** | Идея | SSR каталог, CRM, A/B ecommerce, мульти-регион |

Подробный план v2: [docs/V2.md](./docs/V2.md).

---

## v1 — что считается сделанным

Инфраструктура

- [x] Monorepo `front` (Astro) + `back` (Express/SQLite) + `deploy`
- [x] Docker Compose: `web` (Caddy), `api`, `worker`, `mailpit`
- [x] VM `93.77.163.4`, домен `piter-jaluzi.ru`, HTTPS Let's Encrypt
- [x] Autodeploy (systemd timer) + `/internal/deploy`
- [x] Cloudflare Worker Telegram proxy → webhook на `/telegram/webhook`

Каталог и данные

- [x] Импорт Intersklad (`source=parser`), ~885 позиций в UI (карточки/модалки)
- [x] Ручные товары (`source=manual`) → `/catalog/p/<slug>` + sitemap
- [x] Парсерный реимпорт не затирает manual

SEO / аналитика

- [x] Verification Google + Яндекс, JSON-LD LocalBusiness/WebSite, OG/Twitter/geo
- [x] `robots.txt` (Host, Clean-param), динамический `/sitemap.xml`
- [x] Яндекс.Метрика `111985236`

Не входит в «готово v1» (перенесено в v2+)

- Боевой SMTP/IMAP вместо Mailpit
- Сжатие hero/about, пагинация API каталога
- Скрытие Intersklad-URL в описаниях parser-товаров
- Массовые SEO-страницы категорий и гео-посадочные (→ v2 шаг 5)
- Сбор семантики в Wordstat и кластеризация запросов (→ v2 шаг 5)
- Чистка AI-следов и рефакторинг фронта

---

## v2 — порядок работ (кратко)

| # | Блок | Ключевые пункты |
| --- | --- | --- |
| **1** | Код, баги, AI-следы | Intersklad URL fix, string id, CF webhook docs, bot healthcheck, autodeploy smoke, единый стиль |
| **2** | Производительность | WebP/AVIF, API `?category=` + slim payload, front catalog filter |
| **3** | Конверсия | Thank-you + Metrika, «от … ₽», блок замера, отзывы + Review schema, sticky CTA |
| **4** | Операционка | SMTP, TG алерты, бэкапы + restore test, honeypot, runbook |
| **4.5** | Надёжность | Uptime monitoring, CI gates, staging/dev-compose |
| **5** | SEO | Wordstat → посадочные → карты → мониторинг → **Директ/VK + сезонность + SERP audit** |

### Последовательные PR (merge каждый в main)

1. **PR1 docs** — полный бэклог (V2.md + этот файл)
2. **PR2 step1** — quick wins: parser, id, DEPLOY/runbook stub
3. **PR3 performance** — API filter, WebP, catalog front filter
4. **PR4 conversion** — thank-you, Metrika, CTA, price stub
5. **PR5 ops** — honeypot, backup, health, bot healthcheck
6. **PR6 telegram** — `.env.example`, autodeploy smoke
7. **PR7 visual** — visual cleanup, legal pages, homepage reviews
8. **PR8 images** — WebP hero, parser resize, optimize script
9. **PR9 deeplinks** — WhatsApp/Telegram deep-links, Metrika docs
10. **PR10 smtp-backup** — REG.RU SMTP docs, restore.sh, cron examples
11. **PR11 CI** — contract job, smoke checks, runbook CI/degraded
12. **PR12 SEO** — category landings, FAQ schema, semantic-core.csv

Детали, чек-листы и **manual ops** — в [docs/V2.md](./docs/V2.md).

---

## v2 — прогресс

**Статус:** код закрыт (PR1–PR12 → `main`, `21c4b04`); manual ops — см. [docs/V2.md § Manual / ops remaining](./docs/V2.md#manual--ops-remaining).

- [x] PR1: полный бэклог в документации
- [x] PR2: шаг 1 quick wins
- [x] PR3: шаг 2 производительность
- [x] PR4: шаг 3 конверсия
- [x] PR5: шаг 4 операционка (код)
- [x] PR6: Telegram + autodeploy
- [x] PR7: визуал, legal, отзывы
- [x] PR8: WebP и оптимизация изображений
- [x] PR9: deep-links и Metrika docs
- [x] PR10: SMTP docs, backup/restore scripts
- [x] PR11: CI contract + надёжность
- [x] PR12: SEO foundations (category landings, FAQ, semantic seed)
- [x] Шаг 4.5 надёжность (health, CI gates, dev-compose)
- [ ] Manual ops: SMTP на VM, Wordstat, карты, Metrika UI, cron, фото, гео-контент
