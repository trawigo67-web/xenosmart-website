#!/bin/bash
# Baut die Server-Datei der neuen Oberflaeche mit allen 12 Sprachen.
set -e
cd "$(dirname "$0")"
python3 patch_app.py app-src.orig.html app-src.html
python3 patch_shim.py shim.orig.html shim.html
python3 ../ml/src/build_ml.py app-src.html app-ml.html | tail -1
python3 patch_shim_ml.py shim.html shim-ml.html ../ml/v2texts.json
APP=app-ml.html SHIM=shim-ml.html python3 build.py "$1"
