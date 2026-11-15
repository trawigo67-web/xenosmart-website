#!/usr/bin/env bash
# Zettelfrei – Installation auf dem eigenen Server (Ubuntu/Debian, als root ausführen)
#   curl -fsSL https://xenosmart.de/zettelfrei/server/install.sh | bash
set -euo pipefail
DOMAIN="${ZF_DOMAIN:-zettelfrei.xenosmart.de}"
DIR="/opt/zettelfrei"
PKG="https://xenosmart.de/zettelfrei/server/zettelfrei-server.tar.gz"
say(){ printf "\n\033[1;34m==> %s\033[0m\n" "$*"; }
warn(){ printf "\n\033[1;33m!!  %s\033[0m\n" "$*"; }

[ "$(id -u)" = "0" ] || { echo "Bitte als root ausführen (sudo -i)."; exit 1; }

say "1/6 Bestandsaufnahme"
echo "System: $(. /etc/os-release; echo "$PRETTY_NAME")"
echo "Ports 80/443:"; (ss -tlnp 2>/dev/null | grep -E ':(80|443)\s' || echo "  (frei)")
command -v docker >/dev/null && { echo "Docker-Container:"; docker ps --format '  {{.Names}}  {{.Image}}  {{.Ports}}' || true; }

say "2/6 Docker prüfen"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || apt-get install -y docker-compose-plugin

say "3/6 Zettelfrei herunterladen nach $DIR"
mkdir -p "$DIR/data"
curl -fsSL "$PKG" -o /tmp/zettelfrei.tar.gz
tar -xzf /tmp/zettelfrei.tar.gz -C "$DIR"
chown -R 1000:1000 "$DIR/data"

say "4/6 Einstellungen (.env)"
if [ ! -f "$DIR/.env" ]; then
  cp "$DIR/.env.example" "$DIR/.env"
  echo "Welche KI soll Briefe lesen? [1] OpenAI  [2] Google Gemini"
  read -r -p "Auswahl (1/2): " CH </dev/tty || CH=1
  if [ "${CH:-1}" = "2" ]; then
    read -r -s -p "Gemini API-Key (wird nicht angezeigt): " KEY </dev/tty; echo
    sed -i "s|^AI_PROVIDER=.*|AI_PROVIDER=gemini|; s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=${KEY}|" "$DIR/.env"
  else
    read -r -s -p "OpenAI API-Key (wird nicht angezeigt): " KEY </dev/tty; echo
    sed -i "s|^AI_PROVIDER=.*|AI_PROVIDER=openai|; s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=${KEY}|" "$DIR/.env"
  fi
  read -r -p "Admin-E-Mail(s) für die Tester-Übersicht [trawigo67@gmail.com]: " AD </dev/tty || AD=""
  sed -i "s|^ADMIN_EMAILS=.*|ADMIN_EMAILS=${AD:-trawigo67@gmail.com}|" "$DIR/.env"
  chmod 600 "$DIR/.env"
else
  echo ".env existiert schon – bleibt unverändert."
fi

say "5/6 Zettelfrei starten"
cd "$DIR" && docker compose up -d --build
sleep 4
curl -fsS http://127.0.0.1:8090/api/health && echo " <- läuft"

say "6/6 Webadresse https://$DOMAIN einrichten"
SNIP_CADDY="$DOMAIN {
	encode gzip
	request_body { max_size 25MB }
	reverse_proxy 127.0.0.1:8090
}"
if systemctl is-active --quiet caddy 2>/dev/null; then
  F=/etc/caddy/Caddyfile
  grep -q "$DOMAIN" "$F" || printf "\n%s\n" "$SNIP_CADDY" >> "$F"
  caddy validate --config "$F" --adapter caddyfile && systemctl reload caddy && echo "Caddy aktualisiert."
elif systemctl is-active --quiet nginx 2>/dev/null; then
  cat > /etc/nginx/sites-available/zettelfrei <<EOF
server {
  listen 80;
  server_name $DOMAIN;
  client_max_body_size 25m;
  location / {
    proxy_pass http://127.0.0.1:8090;
    proxy_set_header Host \$host;
    proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto \$scheme;
    proxy_read_timeout 180s;
  }
}
EOF
  ln -sf /etc/nginx/sites-available/zettelfrei /etc/nginx/sites-enabled/zettelfrei
  nginx -t && systemctl reload nginx
  command -v certbot >/dev/null || apt-get install -y certbot python3-certbot-nginx
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$(grep ^ADMIN_EMAILS "$DIR/.env" | cut -d= -f2 | cut -d, -f1)" --redirect || warn "Zertifikat noch nicht möglich – zeigt $DOMAIN schon auf diesen Server?"
elif ! ss -tlnp 2>/dev/null | grep -qE ':(80|443)\s'; then
  apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' > /etc/apt/sources.list.d/caddy-stable.list
  apt-get update && apt-get install -y caddy
  printf "%s\n" "$SNIP_CADDY" > /etc/caddy/Caddyfile && systemctl reload caddy
else
  warn "Ports 80/443 werden von einem Programm in Docker belegt (siehe Liste oben)."
  echo "Bitte diese Ausgabe an Claude schicken – dann passe ich den Weiterleitungs-Eintrag genau an."
  echo "Zettelfrei läuft bereits intern auf Port 8090."
fi

say "Fertig. Test: https://$DOMAIN  ·  Tester-Übersicht: https://$DOMAIN/admin"
