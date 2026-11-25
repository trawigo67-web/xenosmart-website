#!/usr/bin/env bash
# Mailcut (früher Zettelfrei) – Installation hinter dem vorhandenen Traefik (Docker) auf dem IONOS-Server.
# Übernimmt Entrypoint, Zertifikat-Resolver und Netzwerk von dem Container, der ai.xenosmart.de bedient.
set -uo pipefail
DOMAIN="zettelfrei.xenosmart.de"
# Weitere Adressen, unter denen die App erreichbar ist (neuer Name Mailcut)
HOSTS="zettelfrei.xenosmart.de app.mailcut.de"
# Produktseite mailcut.de (www leitet dorthin); mailcut.app und www.mailcut.app leiten auf die App app.mailcut.de (eigener Router, damit ein fehlendes Zertifikat dort die App nicht stoert)
SITE_HOSTS="mailcut.de www.mailcut.de mailcut.app www.mailcut.app"
SITE_RULE=$(for h in $SITE_HOSTS; do printf "Host(\`%s\`) || " "$h"; done | sed 's/ || $//')
RULE=$(for h in $HOSTS; do printf "Host(\`%s\`) || " "$h"; done | sed 's/ || $//')
DIR="/opt/zettelfrei"
PKG="https://xenosmart.de/zettelfrei/server/zettelfrei-server.tar.gz"
ok(){ printf "\033[1;32m[OK]\033[0m %s\n" "$*"; }
info(){ printf "\033[1;34m[..]\033[0m %s\n" "$*"; }
bad(){ printf "\033[1;31m[!!]\033[0m %s\n" "$*"; }
clear
echo "===== MAILCUT INSTALLATION ====="

# 1) Traefik-Einstellungen ermitteln
TR=$(docker ps --format '{{.Names}}' | grep -i traefik | head -1)
[ -n "$TR" ] || { bad "Kein Traefik-Container gefunden"; exit 1; }
REF=$(docker ps --format '{{.Names}}' | while read -r n; do docker inspect -f '{{json .Config.Labels}}' "$n" | grep -q 'ai.xenosmart.de' && echo "$n" && break; done)
read -r EP RES NET <<<"$(python3 - "$TR" "$REF" <<'PY'
import json, subprocess, sys, re
tr, ref = sys.argv[1], sys.argv[2]
def insp(n): return json.loads(subprocess.check_output(["docker","inspect",n]))[0] if n else {}
t, r = insp(tr), insp(ref)
labels = (r.get("Config") or {}).get("Labels") or {}
ep = res = net = ""
for k, v in labels.items():
    if k.endswith(".entrypoints") and ".routers." in k and not ep: ep = v.split(",")[0]
    if k.endswith(".tls.certresolver") and not res: res = v
    if k == "traefik.docker.network": net = v
args = " ".join((t.get("Config") or {}).get("Cmd") or []) + " " + " ".join((t.get("Args") or []))
if not res:
    m = re.search(r"--certificatesresolvers\.([A-Za-z0-9_-]+)\.", args); res = m.group(1) if m else ""
if not ep:
    eps = re.findall(r"--entrypoints\.([A-Za-z0-9_-]+)\.address=:443", args); ep = eps[0] if eps else "websecure"
tnets = list(((t.get("NetworkSettings") or {}).get("Networks") or {}).keys())
rnets = list(((r.get("NetworkSettings") or {}).get("Networks") or {}).keys())
if not net:
    common = [n for n in tnets if n in rnets]
    net = (common or tnets or ["bridge"])[0]
print(ep or "websecure", res or "-", net)
PY
)"
ok "Traefik: $TR | Vorlage: ${REF:-keine} | Entrypoint: $EP | Zertifikat: $RES | Netzwerk: $NET"

# 2) Programm holen
mkdir -p "$DIR/data"
if [ -n "${MAILCUT_AUTO:-}" ]; then
  # Automatisches Update: Paket direkt von GitHub, nur wenn die Pruefsumme aus deploy.txt passt
  RAW="https://raw.githubusercontent.com/trawigo67-web/xenosmart-website/main/zettelfrei/server"
  WANT=$(curl -fsS --max-time 20 "$RAW/deploy.txt?t=$(date +%s)" | grep -o 'sha256=[0-9a-f]*' | cut -d= -f2)
  curl -fsSL --max-time 120 "$RAW/zettelfrei-server.tar.gz?t=$(date +%s)" -o /tmp/zettelfrei.tar.gz || { bad "Download fehlgeschlagen"; exit 1; }
  GOT=$(sha256sum /tmp/zettelfrei.tar.gz | cut -d' ' -f1)
  if [ -n "$WANT" ] && [ "$GOT" != "$WANT" ]; then bad "Paket noch nicht aktuell (Pruefsumme) - neuer Versuch beim naechsten Mal"; exit 1; fi
  tar -xzf /tmp/zettelfrei.tar.gz -C "$DIR" && ok "Programm geladen nach $DIR (Pruefsumme ${GOT:0:12})" || { bad "Entpacken fehlgeschlagen"; exit 1; }
else
  curl -fsSL "$PKG" -o /tmp/zettelfrei.tar.gz && tar -xzf /tmp/zettelfrei.tar.gz -C "$DIR" && ok "Programm geladen nach $DIR" || { bad "Download fehlgeschlagen"; exit 1; }
fi
chown -R 1000:1000 "$DIR/data"

# 3) Einstellungen
if [ ! -f "$DIR/.env" ]; then
  cp "$DIR/.env.example" "$DIR/.env"; chmod 600 "$DIR/.env"
fi
# Schluessel fuer gespeicherte E-Mail-App-Passwoerter (einmalig erzeugen, danach nicht mehr aendern)
if ! grep -qE '^MAIL_SECRET=.+' "$DIR/.env"; then
  printf '\nMAIL_SECRET=%s\n' "$(head -c 32 /dev/urandom | base64 | tr -d '\n/+=')" >> "$DIR/.env"
  ok "Schluessel fuer E-Mail-Postfaecher erzeugt"
fi
if ! grep -qE '^(ANTHROPIC|OPENAI|GEMINI)_API_KEY=.+' "$DIR/.env"; then
  echo
  echo ">>> KI-Schluessel: am einfachsten spaeter im Browser unter https://$DOMAIN/admin eintragen."
  echo ">>> Hier einfach Enter druecken (oder Claude sk-ant-..., OpenAI sk-..., Gemini AIza... einfuegen)."
  KEY=""; if [ -z "${MAILCUT_AUTO:-}" ]; then read -r -s -p "Schluessel: " KEY </dev/tty || true; echo; fi
  case "$KEY" in
    sk-ant-*) grep -q '^ANTHROPIC_API_KEY=' "$DIR/.env" || echo "ANTHROPIC_API_KEY=" >> "$DIR/.env"
             sed -i "s|^AI_PROVIDER=.*|AI_PROVIDER=anthropic|; s|^ANTHROPIC_API_KEY=.*|ANTHROPIC_API_KEY=${KEY}|" "$DIR/.env"; ok "Claude-Schluessel gespeichert" ;;
    sk-*) sed -i "s|^AI_PROVIDER=.*|AI_PROVIDER=openai|; s|^OPENAI_API_KEY=.*|OPENAI_API_KEY=${KEY}|" "$DIR/.env"; ok "OpenAI-Schluessel gespeichert" ;;
    AIza*) sed -i "s|^AI_PROVIDER=.*|AI_PROVIDER=gemini|; s|^GEMINI_API_KEY=.*|GEMINI_API_KEY=${KEY}|" "$DIR/.env"; ok "Gemini-Schluessel gespeichert" ;;
    "") info "Kein Schluessel eingegeben – bitte unter https://$DOMAIN/admin eintragen" ;;
    *) info "Kein gueltiger Schluessel eingegeben – bitte unter https://$DOMAIN/admin eintragen" ;;
  esac
  unset KEY
fi

# 4) Compose-Datei für Traefik
TLS_LINE=""; [ "$RES" != "-" ] && TLS_LINE="      - traefik.http.routers.zettelfrei.tls.certresolver=$RES"
TLS_LINE2=""; [ "$RES" != "-" ] && TLS_LINE2="      - traefik.http.routers.mailcutsite.tls.certresolver=$RES"
cat > "$DIR/docker-compose.yml" <<EOF
services:
  zettelfrei:
    build: .
    container_name: zettelfrei
    restart: unless-stopped
    env_file: .env
    volumes:
      - ./data:/data
    networks:
      - web
    labels:
      - traefik.enable=true
      - traefik.docker.network=$NET
      - traefik.http.routers.zettelfrei.rule=$RULE
      - traefik.http.routers.zettelfrei.entrypoints=$EP
      - traefik.http.routers.zettelfrei.tls=true
$TLS_LINE
      - traefik.http.routers.zettelfrei.service=zettelfrei
      - traefik.http.routers.mailcutsite.rule=$SITE_RULE
      - traefik.http.routers.mailcutsite.entrypoints=$EP
      - traefik.http.routers.mailcutsite.tls=true
$TLS_LINE2
      - traefik.http.routers.mailcutsite.service=zettelfrei
      - traefik.http.services.zettelfrei.loadbalancer.server.port=8090
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
networks:
  web:
    external: true
    name: $NET
EOF
ok "Traefik-Konfiguration geschrieben"

# 5) Starten
cd "$DIR" && docker compose up -d --build >/tmp/zf-build.log 2>&1 && ok "Container gestartet" || { bad "Start fehlgeschlagen:"; tail -15 /tmp/zf-build.log; exit 1; }
sleep 6
H=$(docker exec zettelfrei python3 -c "import urllib.request;print(urllib.request.urlopen('http://127.0.0.1:8090/api/health').read().decode())" 2>/dev/null)
[ -n "$H" ] && ok "App antwortet intern: $H" || bad "App antwortet intern nicht"
info "Warte auf HTTPS-Zertifikat ..."
for i in 1 2 3 4 5 6 7 8 9 10 11 12; do
  C=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "https://$DOMAIN/api/health" || true)
  [ "$C" = "200" ] && break; sleep 5
done
if [ "$C" = "200" ]; then ok "ONLINE: https://$DOMAIN"; for h in $HOSTS; do [ "$h" = "$DOMAIN" ] && continue; for i in 1 2 3 4 5 6 7 8 9 10 11 12; do C2=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "https://$h/api/health" || true); [ "$C2" = "200" ] && break; sleep 5; done; [ "$C2" = "200" ] && ok "ONLINE: https://$h" || bad "https://$h noch nicht erreichbar (Code $C2)"; done; else bad "HTTPS noch nicht erreichbar (Code $C). Ausgabe an Claude schicken."; fi
for h in $SITE_HOSTS; do C3=""; for i in 1 2 3 4 5 6 7 8 9 10 11 12; do C3=$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 "https://$h/" || true); case "$C3" in 200|301) break;; esac; sleep 5; done; case "$C3" in 200|301) ok "ONLINE: https://$h ($C3)";; *) bad "https://$h noch nicht erreichbar (Code $C3) - DNS pruefen";; esac; done
# 7) Einmaliges Zuruecksetzen des Admin-Passworts (pw-reset.txt: ID Hash admins).
#    Ziel sind die Konten aus ADMIN_EMAILS im Container; keine E-Mail-Adresse im Repo.
RAWPW="https://raw.githubusercontent.com/trawigo67-web/xenosmart-website/main/zettelfrei/server/pw-reset.txt"
PWL=$(curl -fsS --max-time 20 "$RAWPW?t=$(date +%s)" 2>/dev/null | head -n1 || true)
if [ -n "$PWL" ]; then
  RID=$(echo "$PWL" | cut -d' ' -f1); PWH=$(echo "$PWL" | cut -d' ' -f2)
  if [ -n "$RID" ] && [ -n "$PWH" ] && [ ! -f "$DIR/data/.pwreset-$RID" ]; then
    N=$(docker exec -i zettelfrei python3 - "$PWH" <<'PYEOF'
import os, sqlite3, sys
h = sys.argv[1]
mails = [m.strip().lower() for m in os.environ.get("ADMIN_EMAILS", "").split(",") if m.strip()]
c = sqlite3.connect("/data/zettelfrei.db")
n = sum(c.execute("UPDATE users SET pw_hash=? WHERE lower(email)=?", (h, m)).rowcount for m in mails)
c.commit(); print(n)
PYEOF
)
    touch "$DIR/data/.pwreset-$RID"
    if [ "${N:-0}" -gt 0 ] 2>/dev/null; then ok "Admin-Passwort neu gesetzt ($N Konto)"; else bad "Passwort-Reset: kein Admin-Konto gefunden"; fi
  fi
fi
echo "===== ENDE ====="
