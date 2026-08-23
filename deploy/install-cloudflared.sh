#!/usr/bin/env bash
# Permanent outbound SSH/access via Cloudflare Tunnel (named tunnel).
# Replaces free Pinggy (~60 min). Requires a Cloudflare account + tunnel token.
#
# 1. In Zero Trust → Networks → Tunnels → Create → copy the token.
# 2. On the VM:
#      export CLOUDFLARED_TUNNEL_TOKEN='eyJ...'
#      sudo ./deploy/install-cloudflared.sh
# 3. Publish an SSH hostname (e.g. ssh.piter-jaluzi.ru) → service ssh://localhost:22
# 4. From the agent / laptop:
#      cloudflared access ssh --hostname ssh.piter-jaluzi.ru
#    or use ~/.ssh/config ProxyCommand for cloudflared access.
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo CLOUDFLARED_TUNNEL_TOKEN=... $0"
  exit 1
fi

if [[ -z "${CLOUDFLARED_TUNNEL_TOKEN:-}" ]]; then
  echo "Set CLOUDFLARED_TUNNEL_TOKEN from the Cloudflare Zero Trust tunnel UI."
  exit 1
fi

ARCH="$(uname -m)"
case "${ARCH}" in
  x86_64|amd64) CF_ARCH=amd64 ;;
  aarch64|arm64) CF_ARCH=arm64 ;;
  *) echo "Unsupported arch: ${ARCH}"; exit 1 ;;
esac

TMP="$(mktemp -d)"
trap 'rm -rf "${TMP}"' EXIT

curl -fsSL "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${CF_ARCH}" \
  -o "${TMP}/cloudflared"
install -m 0755 "${TMP}/cloudflared" /usr/local/bin/cloudflared

cloudflared service install "${CLOUDFLARED_TUNNEL_TOKEN}"
systemctl enable --now cloudflared
systemctl --no-pager --full status cloudflared | head -20 || true
echo "cloudflared installed. Map an SSH hostname in the tunnel dashboard to ssh://localhost:22"
