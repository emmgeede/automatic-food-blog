# Remark42: Admin-Namen zu "Ingrid" ändern

Es gibt mehrere Möglichkeiten, den Anzeigenamen in Remark42 von "Admin" zu "Ingrid" zu ändern:

## Option 1: Namen in Remark42 UI ändern (Empfohlen)

1. Gehe zu einem Blog-Post mit Remark42 Kommentaren
2. Logge dich mit deinem Google-Account ein (falls noch nicht eingeloggt)
3. Klicke auf dein Avatar/Profilbild im Remark42 Widget
4. Es sollte ein Profil-Dialog erscheinen
5. Dort kannst du deinen Anzeigenamen ändern zu "Ingrid"

## Option 2: Google Account Namen ändern

Falls Option 1 nicht funktioniert, kannst du temporär deinen Google-Account Namen ändern:

1. Gehe zu https://myaccount.google.com/personal-info
2. Klicke auf "Name"
3. Ändere den Vornamen zu "Ingrid" und Nachnamen zu "Großklos"
4. Logge dich bei Remark42 neu ein
5. Der neue Name sollte übernommen werden
6. Du kannst dann deinen Google-Namen wieder zurückändern (Remark42 behält den einmal gesetzten Namen bei)

## Option 3: Separates Google-Konto für den Blog (Professionell)

Erstelle ein separates Google-Konto speziell für den Blog:

1. Erstelle ein neues Google-Konto mit Name "Ingrid Großklos"
2. Email könnte sein: ingrid@die-mama-kocht.de oder ähnlich
3. Füge dieses Google-Konto als ADMIN in der Remark42 Config hinzu:
   - Logge dich mit diesem Account auf der Website ein
   - Kopiere die User ID (doppelclick auf Avatar → Cmd/Ctrl+C)
   - Füge diese ID zu ADMIN_SHARED_ID in docker-compose.yml hinzu (kommasepariert wenn mehrere Admins)

## Option 4: ADMIN_SHARED_NAME in Docker setzen (Falls unterstützt)

Prüfe ob Remark42 eine `ADMIN_SHARED_NAME` Umgebungsvariable unterstützt:

```yaml
# In docker-compose.yml unter remark42 environment:
- ADMIN_SHARED_NAME=Ingrid Großklos
```

Dann Container neu starten:
```bash
cd /opt/remark42
docker-compose down && docker-compose up -d
```

---

**Meine Empfehlung:** Option 1 (Namen in Remark42 UI ändern) ist am einfachsten und schnellsten.

Falls keine dieser Optionen funktioniert, lass es mich wissen und wir finden eine andere Lösung!
