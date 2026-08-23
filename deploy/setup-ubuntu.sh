#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/piter-jaluzi}"
REPO_URL="${REPO_URL:-https://github.com/ezhigval/piter-jaluzi.git}"

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run as root: sudo ./deploy/setup-ubuntu.sh"
  exit 1
fi

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y --no-install-recommends \
  ca-certificates \
  curl \
  git \
  ufw \
  fail2ban \
  unattended-upgrades

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

systemctl enable --now docker
systemctl enable --now fail2ban

if id jaluzi-admin >/dev/null 2>&1; then
  usermod -aG docker jaluzi-admin
fi

ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

timedatectl set-timezone Europe/Moscow || true

if [[ ! -d "${APP_DIR}/.git" ]]; then
  mkdir -p "$(dirname "${APP_DIR}")"
  git clone "${REPO_URL}" "${APP_DIR}"
  chown -R jaluzi-admin:jaluzi-admin "${APP_DIR}" || true
fi

cd "${APP_DIR}"

if [[ ! -f .env ]]; then
  cp .env.example .env
  chown jaluzi-admin:jaluzi-admin .env || true
  echo "Created ${APP_DIR}/.env — fill secrets + TELEGRAM_API_ROOT, then run ./deploy/deploy.sh"
  exit 0
fi

./deploy/deploy.sh
