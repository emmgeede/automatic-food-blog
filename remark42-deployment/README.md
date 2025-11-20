# Remark42 Deployment Files

Diese Dateien werden für das Deployment von Remark42 auf dem Hetzner Cloud Server benötigt.

## Dateien

- `docker-compose.yml` - Docker Compose Konfiguration
- `Caddyfile` - Caddy Reverse Proxy mit Auto-SSL
- `.env.example` - Environment Variables Template

## Deployment

### 1. Auf den Server kopieren

```bash
# SSH in den Server
ssh root@comments.die-mama-kocht.de

# Verzeichnis erstellen
mkdir -p /opt/remark42
cd /opt/remark42

# Dateien kopieren (von deinem lokalen Rechner aus)
scp remark42-deployment/* root@comments.die-mama-kocht.de:/opt/remark42/
```

### 2. Environment Variables konfigurieren

```bash
cd /opt/remark42
cp .env.example .env
nano .env

# Secret generieren
openssl rand -hex 32

# Füge das generierte Secret und deine SMTP-Daten ein
```

### 3. Starten

```bash
docker compose pull
docker compose up -d

# Logs ansehen
docker compose logs -f
```

### 4. Admin-Login konfigurieren

1. Öffne https://comments.die-mama-kocht.de/web/
2. Login mit Google/GitHub
3. Browser Console (F12): `localStorage.getItem('remark42-user')`
4. Kopiere die ID
5. Aktualisiere `ADMIN_SHARED_ID` in `.env`
6. Restart: `docker compose restart remark42`

## Backup

```bash
# Backup erstellen
docker compose down
tar -czf remark42-backup-$(date +%Y%m%d).tar.gz /opt/remark42
docker compose up -d

# Backup herunterladen
scp root@comments.die-mama-kocht.de:/opt/remark42/remark42-backup-*.tar.gz ./
```

## Updates

```bash
cd /opt/remark42
docker compose pull
docker compose up -d
```

## Weitere Informationen

Siehe `REMARK42-SETUP-GUIDE.md` für die vollständige Schritt-für-Schritt-Anleitung.
