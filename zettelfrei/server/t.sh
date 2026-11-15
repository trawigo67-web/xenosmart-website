#!/usr/bin/env bash
# Zettelfrei – Installation hinter dem vorhandenen Traefik (Docker) auf dem IONOS-Server.
# Übernimmt Entrypoint, Zertifikat-Resolver und Netzwerk von dem Container, der ai.xenosmart.de bedient.
set -uo pipefail
DOMAIN="zettelfrei.xenosmart.de"
DIR="/opt/zettelfrei"
PKG="https://xenosmart.de/zettelfrei/server/zettelfrei-server.tar.gz"
ok(){ printf "\033[1;32m[OK]\033[0m %s\n" "$*"; }
info(){ printf "\033[1;34m[..]\033[0m %s\n" "$*"; }
bad(){ printf "\033[1;31m[!!]\033[0m %s\n" "$*"; }
clear
echo "===== ZETTELFREI INSTALLATION ====="

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
curl -fsSL "$PKG" -o /tmp/zettelfrei.tar.gz && tar -xzf /tmp/zettelfrei.tar.gz -C "$DIR" && ok "Programm geladen nach $DIR" || { bad "Download fehlgeschlagen"; exit 1; }
chown -R 1000:1000 "$DIR/data"

# 3) Einstellungen
if [ ! -f "$DIR/.env" ]; then
  cp "$DIR/.env.example" "$DIR/.env"; chmod 600 "$DIR/.env"
fi
if ! grep -qE '^(ANTHROPIC|OPENAI|GEMINI)_API_KEY=.+' "$DIR/.env"; then
  echo
  echo ">>> KI-Schluessel: am einfachsten spaeter im Browser unter https://$DOMAIN/admin eintragen."
  echo ">>> Hier einfach Enter druecken (oder Claude sk-ant-..., OpenAI sk-..., Gemini AIza... einfuegen)."
  read -r -s -p "Schluessel: " KEY </dev/tty; echo
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
      - traefik.http.routers.zettelfrei.rule=Host(\`$DOMAIN\`)
      - traefik.http.routers.zettelfrei.entrypoints=$EP
      - traefik.http.routers.zettelfrei.tls=true
$TLS_LINE
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
if [ "$C" = "200" ]; then ok "ONLINE: https://$DOMAIN"; else bad "HTTPS noch nicht erreichbar (Code $C). Ausgabe an Claude schicken."; fi
echo "===== ENDE ====="
