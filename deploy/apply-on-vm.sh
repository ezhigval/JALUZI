#!/usr/bin/env bash
# One-shot apply on the VM after SSH (Pinggy / cloudflared / console).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "${ROOT}"

REMOTE_URL="${1:-https://github.com/ezhigval/JALUZI.git}"
BRANCH="${2:-cursor/mailpit-autodeploy-781d}"

git remote remove jaluzi 2>/dev/null || true
git remote add jaluzi "${REMOTE_URL}"
git fetch jaluzi "${BRANCH}"

git checkout "jaluzi/${BRANCH}" -- \
  .env.example .gitignore DEPLOY.md docker-compose.yml docker-compose.dev.yml \
  back/src \
  deploy/Caddyfile deploy/api.Dockerfile deploy/web.Dockerfile \
  deploy/autodeploy.sh deploy/install-autodeploy.sh deploy/install-cloudflared.sh \
  deploy/cloudflare \
  .github/workflows/autodeploy.yml || true

chmod +x deploy/*.sh

HOOK="$(grep -E '^DEPLOY_HOOK_SECRET=' .env | cut -d= -f2- || true)"
if [[ -z "${HOOK}" ]]; then
  HOOK="$(openssl rand -hex 32)"
  echo "DEPLOY_HOOK_SECRET=${HOOK}" >> .env
  echo "Generated DEPLOY_HOOK_SECRET"
fi

WH_SECRET="$(grep -E '^TELEGRAM_WEBHOOK_SECRET=' .env | cut -d= -f2- || true)"
if [[ -z "${WH_SECRET}" ]]; then
  WH_SECRET="$(openssl rand -hex 24)"
  if grep -q '^TELEGRAM_WEBHOOK_SECRET=' .env; then
    sed -i "s/^TELEGRAM_WEBHOOK_SECRET=.*/TELEGRAM_WEBHOOK_SECRET=${WH_SECRET}/" .env
  else
    echo "TELEGRAM_WEBHOOK_SECRET=${WH_SECRET}" >> .env
  fi
fi

# Normalize mail + telegram mode without printing secrets
python3 - <<'PY'
from pathlib import Path
p = Path('.env')
text = p.read_text()
lines = text.splitlines()
kv = {}
order = []
for line in lines:
    if not line or line.startswith('#') or '=' not in line:
        order.append(('raw', line))
        continue
    k, v = line.split('=', 1)
    kv[k] = v
    order.append(('kv', k))

def setk(k, v):
    kv[k] = v
    if not any(t == 'kv' and x == k for t, x in order):
        order.append(('kv', k))

setk('EMAIL_HOST', 'mailpit')
setk('EMAIL_PORT', '1025')
setk('EMAIL_SECURE', 'false')
setk('EMAIL_USER', kv.get('EMAIL_USER') or 'orders@piter-jaluzi.local')
setk('INCOMING_EMAIL_HOST', '')
setk('INCOMING_EMAIL_PASS', '')
setk('TELEGRAM_MODE', 'webhook')
setk('TELEGRAM_WEBHOOK_PATH', '/telegram/webhook')
setk('COMPOSE_PROJECT_NAME', 'piter-jaluzi')
setk('AUTODEPLOY_REMOTE', 'jaluzi')
setk('AUTODEPLOY_BRANCH', 'main')

out = []
seen = set()
for t, x in order:
    if t == 'raw':
        out.append(x)
    elif x not in seen:
        out.append(f'{x}={kv[x]}')
        seen.add(x)
for k, v in kv.items():
    if k not in seen:
        out.append(f'{k}={v}')
p.write_text('\n'.join(out) + '\n')
print('Updated .env keys for mailpit + webhook + autodeploy')
PY

# Pull mailpit (ghcr works from YC RU)
docker pull ghcr.io/axllent/mailpit:v1.21

export COMPOSE_PROJECT_NAME=piter-jaluzi
docker compose --env-file .env up -d mailpit || true

# Prefer rebuild; fall back to docker cp of sources
if ! docker compose --env-file .env up -d --build; then
  echo "build failed — hot-patching source into containers"
  API_CID="$(docker compose --env-file .env ps -q api || true)"
  WORKER_CID="$(docker compose --env-file .env ps -q worker || true)"
  WEB_CID="$(docker compose --env-file .env ps -q web || true)"
  [[ -n "${API_CID}" ]] && docker cp back/src/. "${API_CID}:/app/src/"
  [[ -n "${WORKER_CID}" ]] && docker cp back/src/. "${WORKER_CID}:/app/src/"
  [[ -n "${WEB_CID}" ]] && docker cp deploy/Caddyfile "${WEB_CID}:/etc/caddy/Caddyfile" && docker exec "${WEB_CID}" caddy reload --config /etc/caddy/Caddyfile || docker compose restart web
  docker compose --env-file .env up -d
  docker compose --env-file .env restart api worker
fi

sudo ./deploy/install-autodeploy.sh || ./deploy/install-autodeploy.sh

echo "DNS must be A @/www → $(curl -s ifconfig.me || echo '158.160.139.202') for SSL + Telegram webhook"
docker compose --env-file .env ps
curl -fsS -H 'Host: piter-jaluzi.ru' http://127.0.0.1/health || true
