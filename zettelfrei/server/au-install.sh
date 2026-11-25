#!/usr/bin/env bash
# Mailcut: richtet das automatische Update einmalig ein (in der IONOS-Remotekonsole als root):
#   curl -fsSLo a.sh xenosmart.de/zettelfrei/server/au-install.sh
#   bash a.sh
set -euo pipefail
U="https://raw.githubusercontent.com/trawigo67-web/xenosmart-website/main/zettelfrei/server"
curl -fsSL "$U/autoupdate.sh?t=$(date +%s)" -o /usr/local/bin/mailcut-update
chmod 755 /usr/local/bin/mailcut-update
cat > /etc/systemd/system/mailcut-update.service <<'EOF'
[Unit]
Description=Mailcut automatisches Update
After=network-online.target docker.service
Wants=network-online.target
[Service]
Type=oneshot
ExecStart=/usr/local/bin/mailcut-update
TimeoutStartSec=900
EOF
cat > /etc/systemd/system/mailcut-update.timer <<'EOF'
[Unit]
Description=Mailcut alle 5 Minuten auf Updates pruefen
[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
[Install]
WantedBy=timers.target
EOF
systemctl daemon-reload
systemctl enable --now mailcut-update.timer
echo "[OK] Automatisches Update eingerichtet. Erstes Update laeuft jetzt ..."
/usr/local/bin/mailcut-update || true
tail -n 15 /var/log/mailcut-update.log 2>/dev/null || true
echo "===== ENDE ====="
