#!/usr/bin/env bash
set -euo pipefail

# First-time setup on a fresh Ubuntu 22.04/24.04 VM in Yandex Cloud.
# Run as root or via sudo from the cloned monorepo root.

APP_DIR="${APP_DIR:-/opt/piter-jaluzi}"
REPO_URL="${REPO_URL:-https://github.com/ezhigval/JALUZI.git}"
APP_USER="${APP_USER:-jaluzi-admin}"

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

if id "${APP_USER}" >/dev/null 2>&1; then
  usermod -aG docker "${APP_USER}"
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
  if id "${APP_USER}" >/dev/null 2>&1; then
    chown -R "${APP_USER}:${APP_USER}" "${APP_DIR}"
  fi
fi

cd "${APP_DIR}"

if [[ ! -f .env ]]; then
  cp .env.example .env
  if id "${APP_USER}" >/dev/null 2>&1; then
    chown "${APP_USER}:${APP_USER}" .env
  fi
  echo "Created ${APP_DIR}/.env — fill Telegram, mailbox and TELEGRAM_API_ROOT, then run ./deploy/deploy.sh"
  exit 0
fi

./deploy/deploy.sh
