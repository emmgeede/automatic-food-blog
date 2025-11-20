# Remark42 + Cloudflare Turnstile Setup-Anleitung

Komplette Schritt-für-Schritt-Anleitung für DSGVO-konforme Kommentarfunktion.

**Geschätzte Gesamtzeit:** 2-3 Stunden
**Kosten:** 3.79€/Monat (Hetzner Cloud VPS CX11)

---

## Phase 1: Cloudflare Turnstile Setup (10-15 Minuten)

### Schritt 1: Cloudflare Account erstellen

1. Gehe zu https://www.cloudflare.com/
2. Klicke auf "Sign Up" (kostenlos)
3. Bestätige deine E-Mail-Adresse

### Schritt 2: Turnstile Site erstellen

1. Nach Login: Dashboard → Turnstile
2. Oder direkt: https://dash.cloudflare.com/?to=/:account/turnstile
3. Klicke auf "Add Site"

**Konfiguration:**
```
Site Name: Food Blog Comments
Domain: die-mama-kocht.de
Widget Mode: Managed (empfohlen - unsichtbar)
```

### Schritt 3: Keys kopieren

Nach Erstellung erhältst du:
- **Site Key** (öffentlich, Frontend)
- **Secret Key** (privat, Backend)

**Wichtig:** Secret Key sicher speichern (z.B. in Passwort-Manager)!

**Speichere diese Keys für später:**
```
TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

---

## Phase 2: Hetzner Cloud VPS Setup (30-40 Minuten)

### Schritt 1: Hetzner Cloud Account

1. Gehe zu https://console.hetzner.cloud/
2. Erstelle Account (falls noch nicht vorhanden)
3. Bestätige E-Mail und wähle Zahlungsmethode

### Schritt 2: Projekt erstellen

1. Im Dashboard: "New Project"
2. Name: "Food Blog Services" (oder ähnlich)

### Schritt 3: Server erstellen

1. Klicke auf "Add Server"

**Konfiguration:**
```
Location: Nürnberg (DE) oder Falkenstein (DE)
Image: Ubuntu 24.04 LTS
Type: Shared vCPU
Plan: CX11 (1 vCPU, 2GB RAM, 20GB SSD) - 3.79€/Monat
Networking: IPv4 + IPv6
SSH Key: Erstelle neuen Key oder wähle bestehenden
Name: comments-server
```

2. Klicke auf "Create & Buy now"

**Wichtig:** Speichere die **Server-IP-Adresse** (z.B. 123.45.67.89)

### Schritt 4: DNS konfigurieren

Erstelle einen A-Record bei deinem DNS-Provider:

```
Type: A
Name: comments
Value: [DEINE-SERVER-IP]
TTL: 300 (5 Minuten)
```

**Ergebnis:** `comments.die-mama-kocht.de` → Server-IP

**Test:** Warte 5-10 Minuten, dann:
```bash
ping comments.die-mama-kocht.de
```

### Schritt 5: Server vorbereiten

Verbinde dich mit deinem Server:
```bash
ssh root@comments.die-mama-kocht.de
# oder
ssh root@[DEINE-SERVER-IP]
```

**Updates installieren:**
```bash
apt update && apt upgrade -y
```

**Docker installieren:**
```bash
curl -fsSL https://get.docker.com | sh
```

**Docker Compose installieren (falls nicht dabei):**
```bash
apt install docker-compose-plugin -y
```

**Arbeitsverzeichnis erstellen:**
```bash
mkdir -p /opt/remark42
cd /opt/remark42
```

---

## Phase 3: Remark42 Deployment (30 Minuten)

### Schritt 1: Docker Compose Datei erstellen

Erstelle `/opt/remark42/docker-compose.yml`:

```bash
nano docker-compose.yml
```

**Inhalt:**
```yaml
version: '3.8'

services:
  caddy:
    image: caddy:2-alpine
    container_name: caddy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
    networks:
      - remark_network

  remark42:
    image: umputun/remark42:latest
    container_name: remark42
    restart: unless-stopped
    environment:
      - REMARK_URL=https://comments.die-mama-kocht.de
      - SECRET=${REMARK_SECRET}
      - SITE=food-blog
      - AUTH_ANON=true
      - ADMIN_SHARED_ID=${ADMIN_SHARED_ID}
      - ADMIN_SHARED_EMAIL=${ADMIN_EMAIL}
      - TIME_ZONE=Europe/Berlin
      - EMOJI=true
      - NOTIFY_ADMINS=email
      - NOTIFY_EMAIL_FROM=${ADMIN_EMAIL}
      - NOTIFY_EMAIL_VERIFICATION_SUBJ=Bestätige deine E-Mail für Kommentare
      - SMTP_HOST=${SMTP_HOST}
      - SMTP_PORT=${SMTP_PORT}
      - SMTP_USERNAME=${SMTP_USERNAME}
      - SMTP_PASSWORD=${SMTP_PASSWORD}
      - SMTP_TLS=true
    volumes:
      - remark_data:/srv/var
    networks:
      - remark_network
    depends_on:
      - caddy

volumes:
  remark_data:
    driver: local
  caddy_data:
    driver: local
  caddy_config:
    driver: local

networks:
  remark_network:
    driver: bridge
```

### Schritt 2: Caddyfile erstellen

Erstelle `/opt/remark42/Caddyfile`:

```bash
nano Caddyfile
```

**Inhalt:**
```
comments.die-mama-kocht.de {
    reverse_proxy remark42:8080

    # Optional: Rate Limiting
    rate_limit {
        zone comments {
            key {remote_host}
            events 100
            window 1m
        }
    }
}
```

### Schritt 3: Environment Variables konfigurieren

Erstelle `/opt/remark42/.env`:

```bash
nano .env
```

**Inhalt (ANPASSEN!):**
```bash
# Remark42 Secret (generiere mit: openssl rand -hex 32)
REMARK_SECRET=HIER_DEIN_GENERIERTES_SECRET

# Admin Credentials (deine Google/GitHub ID nach erstem Login)
ADMIN_SHARED_ID=admin
ADMIN_EMAIL=deine@email.de

# SMTP für E-Mail-Benachrichtigungen (optional, aber empfohlen)
# Beispiel für Gmail:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=deine@gmail.com
SMTP_PASSWORD=dein_app_passwort

# Oder für anderes Hosting
# SMTP_HOST=smtp.strato.de
# SMTP_PORT=465
# SMTP_USERNAME=deine@domain.de
# SMTP_PASSWORD=dein_passwort
```

**Secret generieren:**
```bash
openssl rand -hex 32
```

### Schritt 4: Firewall konfigurieren (Hetzner Cloud)

In der Hetzner Cloud Console:
1. Gehe zu "Firewalls" → "Create Firewall"
2. Name: "comments-firewall"

**Inbound Rules:**
```
Port 22 (SSH)    - Source: Deine IP (für Admin-Zugriff)
Port 80 (HTTP)   - Source: 0.0.0.0/0 (alle)
Port 443 (HTTPS) - Source: 0.0.0.0/0 (alle)
```

3. Weise Firewall dem Server zu

### Schritt 5: Deployment starten

```bash
cd /opt/remark42

# Docker Images herunterladen
docker compose pull

# Container starten
docker compose up -d

# Logs überprüfen
docker compose logs -f
```

**Warte 1-2 Minuten** bis Caddy das SSL-Zertifikat von Let's Encrypt geholt hat.

**Test:** Öffne im Browser:
```
https://comments.die-mama-kocht.de/web/
```

Du solltest die Remark42 Web-UI sehen!

### Schritt 6: Admin-Login konfigurieren

1. Gehe zu `https://comments.die-mama-kocht.de/web/`
2. Klicke auf "Login" → Wähle Google/GitHub/etc.
3. Nach Login: Kopiere deine **User ID** aus der Browser-Konsole
4. Füge die ID in `.env` ein:
```bash
ADMIN_SHARED_ID=google_abc123def456
```
5. Restart:
```bash
docker compose restart remark42
```

---

## Phase 4: Astro Integration (60-90 Minuten)

### Schritt 1: Netlify Function für Turnstile-Validation erstellen

Erstelle `netlify/functions/validate-turnstile.ts`:

```typescript
import type { Context } from "@netlify/functions";

interface TurnstileValidationRequest {
  token: string;
}

interface CloudflareResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
}

export default async (req: Request, context: Context) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body: TurnstileValidationRequest = await req.json();
    const { token } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, message: "Token is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate with Cloudflare
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      console.error("TURNSTILE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, message: "Server configuration error" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);

    const cloudflareResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    const result: CloudflareResponse = await cloudflareResponse.json();

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Validation successful",
          timestamp: result.challenge_ts
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Validation failed",
          errors: result["error-codes"]
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error validating Turnstile token:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Server error during validation",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
```

### Schritt 2: RecipeComments.astro Component erstellen

Erstelle `src/components/recipe/RecipeComments.astro`:

```astro
---
interface Props {
  recipeSlug: string;
  recipeTitle: string;
}

const { recipeSlug, recipeTitle } = Astro.props;

// Turnstile Site Key from environment
const turnstileSiteKey = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY;
---

<section class="bg-white rounded-lg p-8 mb-8">
  <h2 class="text-2xl font-bold text-gray-900 mb-6">Kommentare</h2>

  <!-- Turnstile Container -->
  <div id="turnstile-container" class="mb-6">
    <div
      class="cf-turnstile"
      data-sitekey={turnstileSiteKey}
      data-callback="onTurnstileSuccess"
      data-error-callback="onTurnstileError"
      data-theme="light"
      data-size="normal"
    ></div>
  </div>

  <!-- Remark42 Container (initially hidden) -->
  <div id="remark42" class="hidden"></div>

  <!-- Status Messages -->
  <div id="turnstile-status" class="mb-4"></div>
</section>

<!-- Cloudflare Turnstile Script -->
<script is:inline src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<!-- Remark42 Script -->
<script is:inline>
  let turnstileVerified = false;

  // Turnstile Success Callback
  window.onTurnstileSuccess = async function(token) {
    console.log('Turnstile success, validating...');

    const statusDiv = document.getElementById('turnstile-status');
    statusDiv.innerHTML = '<p class="text-sm text-blue-600">Verifizierung läuft...</p>';

    try {
      // Validate with backend
      const response = await fetch('/.netlify/functions/validate-turnstile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (result.success) {
        turnstileVerified = true;
        statusDiv.innerHTML = '<p class="text-sm text-green-600">✓ Verifizierung erfolgreich</p>';

        // Hide Turnstile, show Remark42
        document.getElementById('turnstile-container').classList.add('hidden');
        document.getElementById('remark42').classList.remove('hidden');

        // Initialize Remark42
        initRemark42();
      } else {
        statusDiv.innerHTML = '<p class="text-sm text-red-600">Verifizierung fehlgeschlagen. Bitte lade die Seite neu.</p>';
      }
    } catch (error) {
      console.error('Validation error:', error);
      statusDiv.innerHTML = '<p class="text-sm text-red-600">Fehler bei der Verifizierung. Bitte versuche es später erneut.</p>';
    }
  };

  // Turnstile Error Callback
  window.onTurnstileError = function() {
    const statusDiv = document.getElementById('turnstile-status');
    statusDiv.innerHTML = '<p class="text-sm text-red-600">Verifizierung fehlgeschlagen. Bitte lade die Seite neu.</p>';
  };

  // Initialize Remark42
  function initRemark42() {
    var remark_config = {
      host: 'https://comments.die-mama-kocht.de',
      site_id: 'food-blog',
      components: ['embed', 'counter'],
      url: window.location.href,
      locale: 'de',
      theme: 'light',
      page_title: document.querySelector('meta[property="og:title"]')?.content || document.title,
      show_email_subscription: false,
      simple_view: false,
      no_footer: false,
    };

    // Load Remark42 script
    (function(c) {
      for(var i = 0; i < c.length; i++){
        var d = document, s = d.createElement('script');
        s.src = remark_config.host + '/web/' +c[i] +'.js';
        s.defer = true;
        (d.head || d.body).appendChild(s);
      }
    })(remark_config.components || ['embed']);
  }
</script>

<style>
  /* Custom Remark42 styling to match your design */
  #remark42 {
    margin-top: 1rem;
  }
</style>
```

### Schritt 3: Environment Variables hinzufügen

Füge zu `.env` (lokal) hinzu:
```bash
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

Füge zu Netlify Environment Variables hinzu:
1. Netlify Dashboard → Site Settings → Environment Variables
2. Füge hinzu:
```
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

### Schritt 4: Component in Rezeptseite einbinden

Editiere `src/pages/blog/[slug].astro`:

```astro
---
import RecipeComments from "../../components/recipe/RecipeComments.astro";
// ... andere Imports
---

<Layout>
  <!-- ... anderer Content ... -->

  <!-- Bewertungen -->
  <RecipeRating recipeSlug={metadata?.slug || ""} />

  <!-- ... Rezeptinhalt ... -->

  <!-- Kommentare -->
  <RecipeComments
    recipeSlug={metadata?.slug || ""}
    recipeTitle={metadata?.title || ""}
  />
</Layout>
```

---

## Phase 5: Testing & Optimierung (30 Minuten)

### Schritt 1: Lokaler Test

```bash
npm run dev
```

Öffne ein Rezept und prüfe:
- ✅ Turnstile wird angezeigt
- ✅ Nach Lösung: Remark42 lädt
- ✅ Anonyme Kommentare funktionieren

### Schritt 2: Netlify Deploy

```bash
git add -A
git commit -m "feat: add Remark42 comments with Cloudflare Turnstile"
git push
```

### Schritt 3: Production Test

1. Öffne deine Live-Website
2. Navigiere zu einem Rezept
3. Teste:
   - Turnstile-Verifizierung
   - Anonymen Kommentar abgeben
   - Antwort auf Kommentar
   - Admin-Moderation

---

## Wartung & Backup

### Updates

**Remark42 updaten:**
```bash
cd /opt/remark42
docker compose pull
docker compose up -d
```

### Backup

**Daten sichern:**
```bash
# Auf dem Server
docker compose down
tar -czf remark42-backup-$(date +%Y%m%d).tar.gz /opt/remark42
docker compose up -d

# Backup herunterladen
scp root@comments.die-mama-kocht.de:/opt/remark42/remark42-backup-*.tar.gz ./
```

**Automatisches Backup (Cronjob):**
```bash
# Auf dem Server
crontab -e

# Füge hinzu (täglich um 3 Uhr):
0 3 * * * cd /opt/remark42 && docker compose down && tar -czf /root/backups/remark42-$(date +\%Y\%m\%d).tar.gz /opt/remark42 && docker compose up -d && find /root/backups -name "remark42-*.tar.gz" -mtime +30 -delete
```

---

## Troubleshooting

### Turnstile funktioniert nicht
- Prüfe Site Key in `.env`
- Prüfe Domain in Cloudflare Dashboard
- Browser Console auf Fehler prüfen

### Remark42 lädt nicht
- Prüfe Docker Logs: `docker compose logs remark42`
- Prüfe Caddy Logs: `docker compose logs caddy`
- Prüfe DNS: `nslookup comments.die-mama-kocht.de`

### SSL-Fehler
- Warte 2-3 Minuten nach erstem Start
- Prüfe Caddy Logs: `docker compose logs caddy`
- Manuell neues Zertifikat: `docker compose restart caddy`

### E-Mail-Benachrichtigungen funktionieren nicht
- Prüfe SMTP-Credentials in `.env`
- Teste SMTP-Verbindung:
```bash
docker compose exec remark42 sh
nc -zv smtp.gmail.com 587
```

---

## Kosten-Übersicht

| Service | Kosten |
|---------|--------|
| Hetzner Cloud CX11 | 3.79€/Monat |
| Domain (bereits vorhanden) | 0€ |
| Cloudflare Turnstile | 0€ (bis 1M Requests) |
| SSL-Zertifikat (Let's Encrypt) | 0€ |
| **Gesamt** | **3.79€/Monat** |

**Jährlich:** ~45€

---

## Nächste Schritte

1. ✅ Phase 1: Cloudflare Turnstile Setup
2. ✅ Phase 2: Hetzner Cloud VPS Setup
3. ✅ Phase 3: Remark42 Deployment
4. ✅ Phase 4: Astro Integration
5. ✅ Phase 5: Testing

**Optional:**
- Custom CSS für Remark42 (Design anpassen)
- E-Mail-Benachrichtigungen konfigurieren
- Admin-Interface erkunden
- Import alter Kommentare (falls vorhanden)

Bei Fragen oder Problemen: Siehe Troubleshooting oder frag mich!
