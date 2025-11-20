# OAuth Provider Setup für Remark42

Um Social Login (Google, GitHub, Facebook, etc.) zu aktivieren, musst du OAuth Apps bei den jeweiligen Providern erstellen.

## Google OAuth Setup

### Schritt 1: Google Cloud Console

1. Gehe zu https://console.cloud.google.com/
2. Erstelle ein neues Projekt (z.B. "Die Mama Kocht Comments")
3. Wähle das Projekt aus

### Schritt 2: OAuth Consent Screen konfigurieren

1. Gehe zu **APIs & Services** → **OAuth consent screen**
2. Wähle **External** (für öffentliche Nutzung)
3. Fülle aus:
   - **App name:** Die Mama Kocht Comments
   - **User support email:** deine@email.de
   - **Developer contact:** deine@email.de
4. Klicke **Save and Continue**
5. **Scopes:** Keine zusätzlichen nötig (Standard reicht)
6. **Test users:** Optional, kann leer bleiben
7. Klicke **Save and Continue**

### Schritt 3: OAuth 2.0 Client ID erstellen

1. Gehe zu **APIs & Services** → **Credentials**
2. Klicke **+ CREATE CREDENTIALS** → **OAuth client ID**
3. Wähle **Web application**
4. Konfiguration:
   ```
   Name: Remark42 Production

   Authorized JavaScript origins:
   https://comments.die-mama-kocht.de
   https://die-mama-kocht.de

   Authorized redirect URIs:
   https://comments.die-mama-kocht.de/auth/google/callback
   ```
5. Klicke **CREATE**

### Schritt 4: Client ID und Secret kopieren

Du erhältst:
- **Client ID:** `123456789-abc...apps.googleusercontent.com`
- **Client Secret:** `GOCSPX-abc123...`

**Speichere diese für .env!**

### Schritt 5: .env aktualisieren

Auf deinem Server in `/opt/remark42/.env`:

```bash
# Google OAuth
AUTH_GOOGLE_CID=123456789-abc...apps.googleusercontent.com
AUTH_GOOGLE_CSEC=GOCSPX-abc123...
```

### Schritt 6: Restart Remark42

```bash
cd /opt/remark42
docker compose restart remark42
```

Jetzt sollte "Login with Google" verfügbar sein!

---

## GitHub OAuth Setup

### Schritt 1: GitHub OAuth App erstellen

1. Gehe zu https://github.com/settings/developers
2. Klicke **OAuth Apps** → **New OAuth App**
3. Fülle aus:
   ```
   Application name: Die Mama Kocht Comments
   Homepage URL: https://die-mama-kocht.de
   Authorization callback URL: https://comments.die-mama-kocht.de/auth/github/callback
   ```
4. Klicke **Register application**

### Schritt 2: Client Secret generieren

1. Nach Erstellung: Klicke **Generate a new client secret**
2. Kopiere:
   - **Client ID:** `abc123def456...`
   - **Client Secret:** `secret123...` (nur einmal sichtbar!)

### Schritt 3: .env aktualisieren

```bash
# GitHub OAuth
AUTH_GITHUB_CID=abc123def456...
AUTH_GITHUB_CSEC=secret123...
```

### Schritt 4: Restart

```bash
docker compose restart remark42
```

---

## Facebook OAuth Setup

### Schritt 1: Facebook App erstellen

1. Gehe zu https://developers.facebook.com/apps/
2. Klicke **Create App**
3. Wähle **Consumer** als App Type
4. App Name: **Die Mama Kocht Comments**
5. Nach Erstellung: **Settings** → **Basic**

### Schritt 2: Konfiguration

1. Notiere:
   - **App ID:** `123456789012345`
   - **App Secret:** `abc123...` (klicke "Show")

2. Füge hinzu in **Settings** → **Basic**:
   - **App Domains:** `die-mama-kocht.de`

3. Gehe zu **Facebook Login** → **Settings**:
   - **Valid OAuth Redirect URIs:**
     ```
     https://comments.die-mama-kocht.de/auth/facebook/callback
     ```

4. App Status auf **Live** setzen

### Schritt 3: .env aktualisieren

```bash
# Facebook OAuth
AUTH_FACEBOOK_CID=123456789012345
AUTH_FACEBOOK_CSEC=abc123...
```

### Schritt 4: Restart

```bash
docker compose restart remark42
```

---

## Vollständige .env mit allen Providern

```bash
# Remark42 Secret
REMARK_SECRET=your_secret_here

# Admin (fülle nach erstem Login aus)
ADMIN_SHARED_ID=google_your_user_id_here
ADMIN_EMAIL=deine@email.de

# Google OAuth
AUTH_GOOGLE_CID=123456789-abc...apps.googleusercontent.com
AUTH_GOOGLE_CSEC=GOCSPX-abc123...

# GitHub OAuth
AUTH_GITHUB_CID=abc123def456...
AUTH_GITHUB_CSEC=secret123...

# Facebook OAuth (optional)
AUTH_FACEBOOK_CID=123456789012345
AUTH_FACEBOOK_CSEC=abc123...

# SMTP (optional, für E-Mail-Benachrichtigungen)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=deine@gmail.com
SMTP_PASSWORD=your_app_password
```

---

## docker-compose.yml erweitern

Deine `docker-compose.yml` muss die OAuth-Provider referenzieren:

```yaml
remark42:
  environment:
    # ... bestehende Variablen ...

    # OAuth Providers
    - AUTH_GOOGLE_CID=${AUTH_GOOGLE_CID}
    - AUTH_GOOGLE_CSEC=${AUTH_GOOGLE_CSEC}
    - AUTH_GITHUB_CID=${AUTH_GITHUB_CID}
    - AUTH_GITHUB_CSEC=${AUTH_GITHUB_CSEC}
    - AUTH_FACEBOOK_CID=${AUTH_FACEBOOK_CID}
    - AUTH_FACEBOOK_CSEC=${AUTH_FACEBOOK_CSEC}
```

---

## Nach dem Setup

1. **Öffne** https://comments.die-mama-kocht.de/web/
2. **Jetzt sollten Login-Buttons** für Google/GitHub/Facebook erscheinen
3. **Logge dich ein** mit deinem bevorzugten Provider
4. **Hole deine User-ID:**
   - Browser Console (F12)
   - `localStorage.getItem('remark42-user')`
   - Kopiere die `id` (z.B. `google_123456789...`)
5. **Aktualisiere .env:**
   ```bash
   ADMIN_SHARED_ID=google_123456789...
   ```
6. **Restart:**
   ```bash
   docker compose restart remark42
   ```

Du bist jetzt Admin!

---

## Empfehlung

**Minimum:** Google OAuth (am meisten genutzt)
**Optimal:** Google + GitHub
**Optional:** Facebook, Twitter/X, etc.

Anonyme Kommentare (`AUTH_ANON=true`) kannst du zusätzlich aktiviert lassen, damit Nutzer auch ohne Account kommentieren können.
