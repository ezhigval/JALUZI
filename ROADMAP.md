# Roadmap — Питер-Жалюзи

Дата: 2026-08-26

## Версии

| Версия | Статус | Суть |
| --- | --- | --- |
| **v1** | ✅ Закрыт (прод) | Рабочий сайт на Yandex Cloud: каталог, заявки, Telegram admin, SEO-база, Метрика, CF-прокси |
| **v2** | 🔜 Следующий | Качество кода, анти-AI следы, скорость, конверсия, боевая почта, **SEO-продвижение (Wordstat, семантика, карты)** |
| **v3** | Идея | Категорийные лендинги, расширенная аналитика/ecommerce, бэкапы/hardening |

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

1. **Оптимизация кода, баги, следы ИИ** ← старт v2  
2. Производительность (картинки, API payload, CWV)  
3. Конверсия и доверие (описания, цены, CTA, цели Метрики)  
4. Операционка (REG.RU почта, алерты заявок в TG, бэкапы)  
5. **SEO-продвижение**: Wordstat → семантика → посадочные по основным запросам → локальное SEO (карты) → мониторинг и доп. каналы

Детали и критерии приёмки — в [docs/V2.md](./docs/V2.md).
