#!/usr/bin/env bash
# Post-deploy smoke tests for Piter-Jaluzi prod.
# Exit 0 when all checks pass.
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
BASE="${SITE_URL%/}"
WEBHOOK_PUBLIC="${TELEGRAM_WEBHOOK_PUBLIC_URL:-}"

fail=0

check() {
  local label="$1"
  shift
  if "$@"; then
    echo "OK  ${label}"
  else
    echo "FAIL ${label}" >&2
    fail=1
  fi
}

check "health" curl -fsS "${BASE}/health" >/dev/null

check "sitemap" bash -c "curl -fsS '${BASE}/sitemap.xml' | head -c 200 | grep -q urlset"

check "api-products" bash -c "curl -fsS '${BASE}/api/products' | grep -q '\"success\":true'"

check "homepage" curl -fsS "${BASE}/" >/dev/null

check "thank-you" curl -fsS "${BASE}/thank-you/" >/dev/null

check "privacy" curl -fsS "${BASE}/politika-konfidentsialnosti/" >/dev/null

check "api-product-id-string" bash -c "curl -fsS '${BASE}/api/products' | grep -q '\"id\":\"'"

if [[ -n "${WEBHOOK_PUBLIC}" ]]; then
  code="$(curl -sS -o /dev/null -w '%{http_code}' -X POST "${WEBHOOK_PUBLIC}" \
    -H 'Content-Type: application/json' -d '{}' --max-time 20 || echo 000)"
  if [[ "${code}" =~ ^(200|400|401|403|404|405)$ ]]; then
    echo "OK  telegram-webhook-ingress (${code})"
  else
    echo "FAIL telegram-webhook-ingress (${code})" >&2
    fail=1
  fi
fi

exit "${fail}"
