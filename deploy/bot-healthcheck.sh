#!/usr/bin/env bash
# Healthcheck: site API + optional Telegram webhook ingress.
# Exit 0 when healthy, 1 otherwise. For cron/systemd on VM.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

if [[ -f .env ]]; then
  # shellcheck disable=SC1091
  set -a
  source .env
  set +a
fi

SITE_URL="${SITE_URL:-https://piter-jaluzi.ru}"
HEALTH_URL="${SITE_URL%/}/health"
WEBHOOK_PUBLIC="${TELEGRAM_WEBHOOK_PUBLIC_URL:-}"
TELEGRAM_API_ROOT="${TELEGRAM_API_ROOT:-}"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"

fail=0

check_url() {
  local label="$1"
  local url="$2"
  local method="${3:-GET}"
  local code

  if [[ "${method}" == "POST" ]]; then
    code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "${url}" -H 'Content-Type: application/json' -d '{}' --max-time 15 || echo 000)"
  else
    code="$(curl -sS -o /dev/null -w '%{http_code}' "${url}" --max-time 15 || echo 000)"
  fi

  if [[ "${code}" =~ ^(200|201|204|400|401|403|404|405)$ ]]; then
    echo "OK  ${label} (${code})"
  else
    echo "FAIL ${label} (${code}) ${url}" >&2
    fail=1
  fi
}

check_url "health" "${HEALTH_URL}"

if [[ -n "${WEBHOOK_PUBLIC}" ]]; then
  check_url "telegram-webhook-ingress" "${WEBHOOK_PUBLIC}" POST
fi

if [[ -n "${TELEGRAM_BOT_TOKEN}" && -n "${TELEGRAM_API_ROOT}" ]]; then
  info="$(curl -sS --max-time 15 "${TELEGRAM_API_ROOT}/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo" || true)"
  if echo "${info}" | grep -q '"ok":true'; then
    echo "OK  telegram-getWebhookInfo"
  else
    echo "FAIL telegram-getWebhookInfo" >&2
    fail=1
  fi
fi

exit "${fail}"
