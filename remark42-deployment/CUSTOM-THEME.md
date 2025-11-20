# Remark42 Custom Theme einrichten

Die Custom-CSS-Datei für das Remark42-Styling muss auf dem Remark42-Server gehostet werden, da Remark42 in einem iframe läuft und aus Sicherheitsgründen kein Cross-Origin-CSS laden kann.

## Schritt 1: CSS-Datei auf Server kopieren

```bash
# SSH zum Remark42-Server
ssh root@remark42-dmk

# Erstelle Verzeichnis für statische Dateien
mkdir -p /opt/remark42/static

# Erstelle die CSS-Datei
nano /opt/remark42/static/custom-theme.css
```

Kopiere den Inhalt aus `public/remark42-custom.css` in diese Datei.

## Schritt 2: Nginx/Caddy konfigurieren für statische Dateien

Füge in `/opt/remark42/Caddyfile` folgendes hinzu:

```caddyfile
comments.die-mama-kocht.de {
    # Statische Dateien
    handle /static/* {
        root * /opt/remark42
        file_server
    }

    # Remark42 Reverse Proxy
    reverse_proxy remark42:8080

    # ... restliche Konfiguration
}
```

## Schritt 3: Docker-Compose Volume-Mount hinzufügen

Füge in `/opt/remark42/docker-compose.yml` folgendes hinzu:

```yaml
remark42:
  volumes:
    - remark_data:/srv/var
    - ./static:/opt/remark42/static:ro  # NEU: Statische Dateien
```

## Schritt 4: Umgebungsvariable für Custom Theme setzen

Füge in `/opt/remark42/docker-compose.yml` die Umgebungsvariable hinzu:

```yaml
environment:
  # ... bestehende Variablen
  - THEME=https://comments.die-mama-kocht.de/static/custom-theme.css
```

## Schritt 5: Services neu starten

```bash
cd /opt/remark42
docker compose restart
```

## Alternative: Direktes Kopieren der CSS

Du kannst die Datei auch direkt vom Blog-Repo zum Server kopieren:

```bash
# Von deinem lokalen Rechner
scp public/remark42-custom.css root@remark42-dmk:/opt/remark42/static/custom-theme.css
```

## Überprüfung

1. Teste ob die CSS-Datei erreichbar ist:
   ```bash
   curl https://comments.die-mama-kocht.de/static/custom-theme.css
   ```

2. Öffne eine Rezeptseite und prüfe in den Browser-DevTools:
   - Unter "Network" solltest du sehen, dass `custom-theme.css` geladen wird
   - Die Buttons sollten jetzt rot (Accent-Farbe) sein

## Troubleshooting

### CSS wird nicht geladen
- Prüfe die Caddy-Logs: `docker compose logs caddy`
- Prüfe die Remark42-Logs: `docker compose logs remark42`
- Stelle sicher, dass die Datei-Berechtigung korrekt ist: `chmod 644 /opt/remark42/static/custom-theme.css`

### Styles werden nicht angewendet
- Hard-Refresh im Browser: `Ctrl+F5` (Windows) oder `Cmd+Shift+R` (Mac)
- Prüfe in den Browser-DevTools, ob die CSS-Regeln korrekt sind
- Schaue ins iframe-Element und prüfe, ob das Stylesheet geladen wurde

## Ohne Server-Zugriff (nur Netlify-Hosting)

Falls du keinen Zugriff auf den Remark42-Server hast, gibt es eine alternative Lösung über JavaScript-Injection (funktioniert nur, wenn beide Domains gleich sind oder CORS richtig konfiguriert ist).

Diese Lösung ist bereits im Code vorbereitet, funktioniert aber möglicherweise nicht wegen Browser-Sicherheitsrichtlinien.
