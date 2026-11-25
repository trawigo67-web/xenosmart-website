#!/usr/bin/env bash
# Mailcut: automatisches Update (laeuft alle 5 Minuten per systemd-Timer auf dem IONOS-Server).
# Prueft, ob sich zettelfrei/server/deploy.txt im GitHub-Repo geaendert hat. Nur dann wird
# t.sh von GitHub geladen und ohne Rueckfragen ausgefuehrt. Protokoll: /var/log/mailcut-update.log
# Abschalten: systemctl disable --now mailcut-update.timer
set -uo pipefail
U="https://raw.githubusercontent.com/trawigo67-web/xenosmart-website/main/zettelfrei/server"
STATE="/opt/zettelfrei/deploy.applied"
LOG="/var/log/mailcut-update.log"
exec 9>/run/mailcut-update.lock
flock -n 9 || exit 0
NEW=$(curl -fsS --max-time 20 "$U/deploy.txt?t=$(date +%s)" | head -c 200) || exit 0
[ -n "$NEW" ] || exit 0
OLD=$(cat "$STATE" 2>/dev/null || true)
[ "$NEW" = "$OLD" ] && exit 0
TMP=$(mktemp)
curl -fsSL --max-time 60 "$U/t.sh?t=$(date +%s)" -o "$TMP" || { rm -f "$TMP"; exit 0; }
{ echo; echo "===== $(date '+%F %T') Update: $NEW ====="; } >> "$LOG"
if MAILCUT_AUTO=1 bash "$TMP" </dev/null >> "$LOG" 2>&1; then
  echo "$NEW" > "$STATE"
  echo "===== fertig =====" >> "$LOG"
else
  echo "===== FEHLER (wird beim naechsten Mal erneut versucht) =====" >> "$LOG"
fi
rm -f "$TMP"
tail -n 2000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
