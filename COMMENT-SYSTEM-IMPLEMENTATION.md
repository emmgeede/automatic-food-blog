# Comment System Implementation

## Übersicht

Dieses Projekt verwendet **Remark42** als selbst-gehostetes Kommentarsystem mit **Cloudflare Turnstile** für DSGVO-konformen Spam-Schutz.

## Architektur

### Backend: Remark42 (selbst-gehostet)
- **Hosting:** Hetzner Cloud VPS CX11 (3.79€/Monat)
- **URL:** https://comments.die-mama-kocht.de
- **Features:**
  - Anonyme Kommentare
  - Social Login (Google, GitHub, Facebook, etc.)
  - Verschachtelte Antworten
  - Voting-System
  - Markdown-Support
  - E-Mail-Benachrichtigungen
  - Admin-Moderation

### Spam-Schutz: Cloudflare Turnstile
- **DSGVO-konform** (keine Google-Server)
- **Kostenlos** (1 Million Requests/Monat)
- **Privacy-First** (keine Cookies, kein Tracking)
- **Unsichtbar** (Managed Mode, keine User-Interaktion nötig)

### Frontend: Astro Component
- **Component:** `src/components/recipe/RecipeComments.astro`
- **Integration:** Automatisch auf jeder Rezeptseite
- **Flow:**
  1. User öffnet Rezeptseite
  2. Turnstile lädt und verifiziert im Hintergrund
  3. Nach erfolgreicher Verifizierung: Remark42 lädt
  4. User kann Kommentare lesen/schreiben

## Implementierte Dateien

### Backend (Remark42 Deployment)
```
remark42-deployment/
├── docker-compose.yml    # Docker Compose Konfiguration
├── Caddyfile            # Caddy Reverse Proxy (Auto-SSL)
├── .env.example         # Environment Variables Template
└── README.md            # Deployment-Anleitung
```

### Frontend (Astro)
```
src/components/recipe/
└── RecipeComments.astro # Kommentar-Komponente mit Turnstile

netlify/functions/
└── validate-turnstile.ts # Turnstile-Validation API
```

### Dokumentation
```
REMARK42-SETUP-GUIDE.md                  # Komplette Setup-Anleitung
REMARK42-HOSTING-OPTIONS.md             # Hosting-Optionen Vergleich
COMMENT-SYSTEM-OPTIONS.md               # Kommentarsystem-Vergleich
COMMENT-SYSTEM-FINAL-RECOMMENDATION.md  # Finale Empfehlung
```

## Setup-Status

### ✅ Erledigt (Code-seitig)
- [x] Remark42 Docker Compose Konfiguration
- [x] Caddy Reverse Proxy mit Auto-SSL
- [x] Turnstile Validation Netlify Function
- [x] RecipeComments.astro Component
- [x] Integration in Rezeptseiten
- [x] Environment Variables konfiguriert
- [x] Dokumentation erstellt

### ⏳ Noch zu tun (Deployment)
- [ ] Cloudflare Turnstile Site erstellen (10 Min)
- [ ] Hetzner Cloud VPS erstellen (30 Min)
- [ ] DNS konfigurieren (5 Min)
- [ ] Remark42 auf VPS deployen (30 Min)
- [ ] Environment Variables in Netlify setzen (5 Min)
- [ ] Production-Test (15 Min)

## Deployment-Anleitung

Siehe `REMARK42-SETUP-GUIDE.md` für die vollständige Schritt-für-Schritt-Anleitung.

**Quick Start:**
1. Cloudflare Turnstile Keys generieren
2. Hetzner Cloud VPS erstellen (CX11)
3. DNS A-Record setzen: `comments.die-mama-kocht.de`
4. Dateien aus `remark42-deployment/` auf Server kopieren
5. `.env` konfigurieren
6. `docker compose up -d`
7. Turnstile Keys in Netlify Environment Variables setzen
8. Website deployen

## Environment Variables

### Lokal (.env)
```bash
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
PUBLIC_REMARK42_URL=https://comments.die-mama-kocht.de
```

### Netlify
Setze diese Environment Variables in:
**Netlify Dashboard → Site Settings → Environment Variables**

```
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
PUBLIC_REMARK42_URL=https://comments.die-mama-kocht.de
```

### Remark42 Server (/opt/remark42/.env)
```bash
REMARK_SECRET=<generiert mit: openssl rand -hex 32>
ADMIN_SHARED_ID=<deine User ID nach Login>
ADMIN_EMAIL=deine@email.de
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=deine@gmail.com
SMTP_PASSWORD=<Gmail App Password>
```

## Kosten

| Service | Kosten/Monat |
|---------|--------------|
| Hetzner Cloud CX11 | 3.79€ |
| Cloudflare Turnstile | 0€ (bis 1M Requests) |
| SSL (Let's Encrypt) | 0€ |
| **Gesamt** | **3.79€** |

**Jährlich:** ~45€

## DSGVO-Compliance

### Turnstile
- ✅ Keine Cookies
- ✅ Kein Tracking
- ✅ Keine Datenübertragung an Google
- ✅ EU-Server verfügbar
- ✅ Privacy-First Design

### Remark42
- ✅ Selbst-gehostet auf deutschem Server
- ✅ Volle Datenkontrolle
- ✅ Opt-in für E-Mail-Benachrichtigungen
- ✅ IP-Adressen optional (standardmäßig aus)
- ✅ Keine externen Tracker

### Datenschutzerklärung
Füge diesen Abschnitt zu deiner Datenschutzerklärung hinzu:

```
## Kommentarfunktion

Wir verwenden das selbst-gehostete Kommentarsystem Remark42.
Die Kommentare werden auf unserem Server in Deutschland gespeichert.

Beim Kommentieren werden folgende Daten verarbeitet:
- Name oder Pseudonym (optional)
- E-Mail-Adresse (optional, nur für Benachrichtigungen)
- Kommentartext
- Zeitstempel

Spam-Schutz: Wir verwenden Cloudflare Turnstile zur Spam-Prävention.
Dabei werden keine personenbezogenen Daten an Dritte übertragen.

Rechtsgrundlage: Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)
```

## Features

### Für Besucher
- ✅ Anonyme Kommentare möglich (ohne Registrierung)
- ✅ Social Login (Google, GitHub, Facebook, etc.)
- ✅ Verschachtelte Antworten
- ✅ Markdown-Formatierung
- ✅ Voting (Upvote/Downvote)
- ✅ E-Mail-Benachrichtigungen (opt-in)
- ✅ Avatare (Gravatar)
- ✅ Deutscher Sprache

### Für Admins
- ✅ Moderations-Interface
- ✅ Kommentar-Freigabe
- ✅ User-Blocking
- ✅ Export/Import
- ✅ E-Mail-Benachrichtigungen bei neuen Kommentaren
- ✅ Statistiken

## Wartung

### Updates
```bash
# Auf dem Server
cd /opt/remark42
docker compose pull
docker compose up -d
```

### Backup
```bash
# Automatisches tägliches Backup via Cronjob
# Siehe REMARK42-SETUP-GUIDE.md
```

### Monitoring
```bash
# Logs ansehen
docker compose logs -f remark42
docker compose logs -f caddy

# Status prüfen
docker compose ps
```

## Troubleshooting

### Turnstile lädt nicht
- Prüfe `PUBLIC_TURNSTILE_SITE_KEY` in `.env`
- Prüfe Browser Console auf Fehler
- Verifiziere Domain in Cloudflare Dashboard

### Remark42 lädt nicht nach Turnstile
- Prüfe `PUBLIC_REMARK42_URL` in `.env`
- Prüfe Netlify Function Logs
- Teste Turnstile-Validation manuell

### Kommentare werden nicht gespeichert
- Prüfe Remark42 Docker Logs: `docker compose logs remark42`
- Prüfe CORS-Einstellungen in `docker-compose.yml`
- Verifiziere `ALLOWED_HOSTS` Einstellung

### E-Mail-Benachrichtigungen funktionieren nicht
- Prüfe SMTP-Credentials in `.env`
- Teste SMTP-Verbindung vom Server
- Prüfe Gmail App Password (falls Gmail)

Für weitere Hilfe siehe `REMARK42-SETUP-GUIDE.md` Troubleshooting-Sektion.

## Nächste Schritte

1. **Cloudflare Turnstile Setup** (siehe REMARK42-SETUP-GUIDE.md Phase 1)
2. **Hetzner Cloud VPS Setup** (siehe REMARK42-SETUP-GUIDE.md Phase 2)
3. **Remark42 Deployment** (siehe REMARK42-SETUP-GUIDE.md Phase 3)
4. **Netlify Environment Variables** setzen
5. **Production Deploy** und testen

Bei Fragen oder Problemen: Siehe Dokumentation oder frag mich!
