#!/usr/bin/env bash
# Install a systemd timer that pulls GitHub and redeploys without inbound SSH.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
UNIT_DIR=/etc/systemd/system
SERVICE=piter-jaluzi-autodeploy.service
TIMER=piter-jaluzi-autodeploy.timer
USER_NAME="$(stat -c '%U' "${ROOT}")"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root: sudo $0"
  exit 1
fi

chmod +x "${ROOT}/deploy/autodeploy.sh"
mkdir -p "${ROOT}/deploy/logs"
chown -R "${USER_NAME}:${USER_NAME}" "${ROOT}/deploy/logs"

cat >"${UNIT_DIR}/${SERVICE}" <<EOF
[Unit]
Description=Piter-Jaluzi pull-based autodeploy
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=oneshot
User=${USER_NAME}
WorkingDirectory=${ROOT}
ExecStart=${ROOT}/deploy/autodeploy.sh
Nice=10
EOF

cat >"${UNIT_DIR}/${TIMER}" <<EOF
[Unit]
Description=Run Piter-Jaluzi autodeploy every 2 minutes

[Timer]
OnBootSec=2min
OnUnitActiveSec=2min
AccuracySec=30s
Persistent=true
Unit=${SERVICE}

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now "${TIMER}"
systemctl start "${SERVICE}" || true
systemctl list-timers --all | grep piter-jaluzi || true
echo "Autodeploy installed. Push to ${ROOT}'s tracked branch; VM applies within ~2 minutes."
echo "Logs: ${ROOT}/deploy/logs/autodeploy.log"
