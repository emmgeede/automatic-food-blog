# Admin Dashboard Setup

Diese Anleitung erklärt, wie du das Admin Dashboard für die Kommentarverwaltung einrichtest.

## Features

✅ **Google OAuth Login** - Sicherer Login mit deinem Google-Account
✅ **Kommentarübersicht** - Alle Kommentare in einer Tabelle
✅ **Suche & Filter** - Nach Autor, Text oder Rezept filtern
✅ **Bulk-Delete** - Mehrere Kommentare gleichzeitig löschen
✅ **Kein Turnstile** - Direkter Zugriff ohne Captcha

## Schritt 1: Google Cloud Console konfigurieren

1. Gehe zu https://console.cloud.google.com/
2. Wähle dein Projekt (z.B. "Die Mama Kocht Comments")
3. Gehe zu **APIs & Services** → **Credentials**
4. Klicke auf deine OAuth 2.0 Client ID
5. Füge eine neue **Authorized redirect URI** hinzu:
   ```
   https://die-mama-kocht.de/api/auth/google/callback
   ```
6. Klicke **Save**

### Bestehende URIs (sollten bereits vorhanden sein):
```
https://comments.die-mama-kocht.de/auth/google/callback  (für Remark42)
https://die-mama-kocht.de/api/auth/google/callback       (neu für Admin)
```

## Schritt 2: Remark42 Admin Secret holen

Auf deinem Remark42-Server:

```bash
ssh root@remark42-dmk
cd /opt/remark42
cat .env | grep REMARK_SECRET
```

Kopiere den Wert von `REMARK_SECRET` (z.B. `abc123def456...`)

## Schritt 3: Netlify Environment Variables setzen

1. Gehe zu deinem Netlify Dashboard
2. Site settings → Environment variables
3. Füge folgende Variable hinzu:

```
Name: REMARK_ADMIN_SECRET
Value: [Der Wert von REMARK_SECRET vom Server]
```

### Bereits vorhandene Variables (zur Kontrolle):
```
AUTH_GOOGLE_CID=deine_google_client_id
AUTH_GOOGLE_CSEC=deine_google_client_secret
PUBLIC_REMARK42_URL=https://comments.die-mama-kocht.de
PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAACB_38WXiFBPxkiA
TURNSTILE_SECRET_KEY=0x4AAAAAACB_3zYKRCaoFBwTPCcCRW6TOxg
REMARK_ADMIN_SECRET=<neu hinzufügen>
```

## Schritt 4: Deploy triggern

Nach dem Hinzufügen der Environment Variable:

1. Gehe zu **Deploys**
2. Klicke **Trigger deploy** → **Clear cache and deploy site**

## Schritt 5: Admin Dashboard nutzen

1. Öffne https://die-mama-kocht.de/admin/
2. Klicke "Mit Google anmelden"
3. Logge dich mit `foofourtyone@gmail.com` ein
4. Du siehst jetzt alle Kommentare in einer Tabelle

## Features im Detail

### Suche
- Suche nach Autor-Namen
- Suche nach Kommentar-Text
- Suche nach Rezept-Namen

### Filter
- Dropdown: Nach spezifischem Rezept filtern
- Kombination mit Suche möglich

### Bulk-Delete
1. Wähle mehrere Kommentare über die Checkboxen aus
2. Klicke "Ausgewählte löschen"
3. Bestätige die Aktion

### Einzelne Kommentare
- Klicke "Löschen" in der Aktions-Spalte
- Bestätige die Aktion

## Sicherheit

### Nur autorisierte Email
Nur `foofourtyone@gmail.com` kann sich einloggen. Andere Google-Accounts werden abgelehnt.

### Ändern der autorisierten Email
Editiere `/Users/michael/code/automatic-food-blog/netlify/functions/auth-google-callback.ts`:

```typescript
const ALLOWED_EMAILS = ['foofourtyone@gmail.com', 'andere@email.de'];
```

### Session-Dauer
- Login-Session ist 7 Tage gültig
- Nach 7 Tagen automatischer Logout
- Cookie ist HttpOnly, Secure, SameSite=Lax (Lax ermöglicht OAuth-Redirects)

## Troubleshooting

### "Google OAuth not configured"
- Prüfe ob `AUTH_GOOGLE_CID` und `AUTH_GOOGLE_CSEC` in Netlify gesetzt sind
- Trigger einen neuen Deploy

### "Failed to fetch comments"
- Prüfe ob `PUBLIC_REMARK42_URL` korrekt ist
- Prüfe ob Remark42-Server erreichbar ist
- Schaue in die Netlify Function Logs

### "Failed to delete comment"
- Prüfe ob `REMARK_ADMIN_SECRET` korrekt gesetzt ist
- Das Secret muss identisch mit dem REMARK_SECRET vom Server sein
- Trigger einen neuen Deploy nach Änderung

### "Zugriff verweigert"
- Deine Email ist nicht in der ALLOWED_EMAILS Liste
- Editiere `auth-google-callback.ts` und füge deine Email hinzu

### "Login funktioniert nicht / Cookie wird nicht gesetzt"
- Prüfe ob `SameSite=Lax` in auth-google-callback.ts gesetzt ist (nicht Strict!)
- `SameSite=Strict` blockiert Cookies bei OAuth-Redirects von Google
- Browser Console (F12) zeigt Warnungen über blockierte Cookies

## API Endpoints

Die Admin-Seite nutzt folgende Netlify Functions:

```
POST   /api/auth/google/login       - Startet OAuth Flow
GET    /api/auth/google/callback    - OAuth Callback Handler
POST   /api/auth/logout             - Logout
GET    /api/admin/comments          - Holt alle Kommentare
DELETE /api/admin/comments/:id      - Löscht einen Kommentar
```

## Nächste Schritte (Optional)

Mögliche Erweiterungen:

- CSV Export aller Kommentare
- Kommentar-Statistiken & Charts
- Email-Benachrichtigungen bei neuen Kommentaren
- Spam-Filter mit Machine Learning
- Kommentar-Moderation Queue
- Antworten direkt aus dem Admin-Panel

Soll ich eines dieser Features implementieren?
