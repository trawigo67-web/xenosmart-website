#!/usr/bin/env bash
# Markiert eine neue Fassung fuer das automatische Update des Servers.
#   bash zettelfrei/server/mark-deploy.sh "Kurzbeschreibung"
# Danach deploy.txt zusammen mit dem Paket committen und pushen. Der Server spielt das
# Paket nur ein, wenn seine Pruefsumme zu der in deploy.txt passt.
set -euo pipefail
cd "$(dirname "$0")"
SHA=$(sha256sum zettelfrei-server.tar.gz | cut -d' ' -f1)
echo "$(date '+%Y-%m-%d %H:%M') ${1:-Update} | sha256=$SHA" > deploy.txt
cat deploy.txt
