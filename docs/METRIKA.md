# Яндекс.Метрика — цели v2

Счётчик: `PUBLIC_YANDEX_METRIKA_ID` (прод: `111985236`).

Создайте цели в интерфейсе [Метрики](https://metrika.yandex.ru) → **Цели** → **JavaScript-событие**.

| ID цели (reachGoal) | Когда срабатывает | Тип в Метрике |
| --- | --- | --- |
| `order_submit` | Успешная отправка формы заявки (до редиректа) | JS-событие |
| `order_thank_you` | Загрузка страницы `/thank-you` | JS-событие |
| `click_phone` | Клик по `tel:` ссылке | JS-событие |
| `click_whatsapp` | Клик по WhatsApp deep-link | JS-событие |
| `click_telegram` | Клик по Telegram deep-link | JS-событие |
| `open_order_modal` | Открытие модалки заявки | JS-событие |
| `open_catalog` | Переход в каталог / категорию | JS-событие |

Реализация: `front/public/scripts/metrika.js`, подключение в `main.js`.

После создания целей в UI проверьте в **Вебvisor** или **Отчёты → Конверсии**.
