# Mailcut-Videos (Stand 25.11.2026, neue Oberfläche)

Acht Videos, je Deutsch und Türkisch: `spot` (9:16), `expl` (16:9), `kosten` (16:9), `install` (9:16).
Die Bilder entstehen im Code: `stage.html` zeichnet jede Szene, `render.py` filmt sie Bild für Bild (30 fps) und legt den Ton darunter.

- `scripts.py` – Sprechertexte (ein Absatz = eine Szene). „Meylkat“ steht nur für die Aussprache; Untertitel zeigen „Mailcut“.
- `cfg.py` – Szenen, Überschriften, Tipp-Punkte, Untertitel je Video und Sprache.
- `align.py` – findet die Szenengrenzen im Ton (Pausen).
- `cap.py` + `seed.py` – nehmen die App-Bildschirme aus der laufenden App auf (Demo-Familie Yılmaz) nach `shots/<sprache>/`.
- Ton: ElevenLabs, eleven_v4, Stimmen Michael Kurzweil (`hBOVjideqPyMYjloL1lg`) und Doga (`IuRRIAcbQK5AQk1XevPj`); Dateien nach `audio/<name>.mp3`.
- Aufruf: `python3 render.py spot_de` → `out/spot_de.mp4`; Einzelbilder zur Kontrolle: `python3 render.py spot_de frames 3.5,11.5`.
- Danach Lautstärke angleichen: `ffmpeg -i x.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac y.mp4`.
- `stage.html` erwartet die Schriften unter `../pkg/app/static/fonts/` (aus dem Server-Paket).
- Ohne Musik.
