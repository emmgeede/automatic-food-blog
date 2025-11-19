# Recipe Rating System

## Übersicht

Das Rating-System ermöglicht es Besuchern, Rezepte mit 1-5 Sternen zu bewerten. Die Bewertungen werden gesammelt, aggregiert und täglich beim Build-Prozess aktualisiert.

## Architektur

### 1. Datenspeicherung (Netlify Blobs)

Einzelne Bewertungen werden in **Netlify Blobs** gespeichert:
- Store: `ratings`
- Key: `{recipe-slug}` (z.B. `doener-aus-dem-ofen`)
- Value: JSON-Array mit allen Bewertungen

Jede Bewertung enthält:
```typescript
{
  rating: number;        // 1-5
  timestamp: number;     // Unix timestamp
  userHash: string;      // SHA-256 hash (IP + slug)
}
```

### 2. API-Endpoint (Netlify Function)

**File:** `netlify/functions/submit-rating.ts`
**URL:** `/.netlify/functions/submit-rating`

**Features:**
- Validierung (rating muss 1-5 sein)
- Duplikat-Prävention (permanent - ein User kann ein Rezept nur einmal bewerten)
- User-Identifikation via IP-Hash (Privacy-friendly)
- Frontend-Check via localStorage (sofortiges Feedback)

**Request:**
```json
{
  "recipeSlug": "doener-aus-dem-ofen",
  "rating": 5
}
```

**Response (Success):**
```json
{
  "message": "Bewertung erfolgreich gespeichert",
  "rating": { ... }
}
```

### 3. Aggregation (Build-Zeit)

**File:** `scripts/aggregate-ratings.ts`
**Wird ausgeführt:** Bei jedem Build (automatisch via `npm run build`)

**Funktion:**
1. Liest alle Bewertungen aus Netlify Blobs
2. Filtert Bewertungen älter als 1 Jahr (optional)
3. Berechnet Durchschnitt und Verteilung
4. Erstellt JSON-Dateien: `public/ratings/{slug}.json`

**Output-Format:**
```json
{
  "average": 4.9,
  "totalRatings": 8,
  "distribution": {
    "5": 7,
    "4": 1,
    "3": 0,
    "2": 0,
    "1": 0
  }
}
```

### 4. Anzeige (Astro Component)

**File:** `src/components/recipe/RecipeRating.astro`
**Integration:** Automatisch auf jeder Rezeptseite (über der Einleitung)

**Features:**
- Zeigt aggregierte Bewertungen an (Durchschnitt, Verteilung, Sternchen)
- Interaktives Bewertungsformular
- Visuelles Feedback beim Hovern über Sterne
- Erfolgsmeldung nach Absenden

## Setup

### Voraussetzungen

- Netlify-Deployment
- Netlify Blobs aktiviert (automatisch verfügbar)

### Lokale Entwicklung

Das Rating-System funktioniert nur im Netlify-Deployment. Lokal:
- **Anzeige:** Zeigt "Noch keine Bewertungen"
- **Formular:** Funktioniert, aber Submit schlägt fehl (Blobs nicht verfügbar)
- **Aggregation:** Wird übersprungen (siehe Console-Log)

### Deployment

Bei jedem Deployment auf Netlify:
1. `npm run aggregate-ratings` wird ausgeführt
2. Bewertungen werden aus Blobs geladen
3. JSON-Dateien werden generiert
4. Build erstellt statische Seiten mit aktuellen Ratings

## Täglicher Cronjob

Um Bewertungen täglich zu aktualisieren, Netlify Build Hook einrichten:

1. **Build Hook erstellen:**
   - Netlify Dashboard → Site Settings → Build & deploy → Build hooks
   - Name: "Daily Rating Update"
   - Branch: `main`
   - URL kopieren (z.B. `https://api.netlify.com/build_hooks/...`)

2. **Cron-Service nutzen:**
   - **Option A:** GitHub Actions (empfohlen)
     ```yaml
     # .github/workflows/daily-build.yml
     name: Daily Build
     on:
       schedule:
         - cron: '0 2 * * *'  # Täglich um 2 Uhr UTC
     jobs:
       trigger-build:
         runs-on: ubuntu-latest
         steps:
           - name: Trigger Netlify Build
             run: curl -X POST -d {} YOUR_BUILD_HOOK_URL
     ```

   - **Option B:** Externe Cron-Services
     - [cron-job.org](https://cron-job.org)
     - [EasyCron](https://www.easycron.com)

## Datenbank-Schema

### Netlify Blobs Store: "ratings"

```
Key: doener-aus-dem-ofen
Value: [
  {
    "rating": 5,
    "timestamp": 1700000000000,
    "userHash": "abc123..."
  },
  {
    "rating": 4,
    "timestamp": 1700000001000,
    "userHash": "def456..."
  }
]
```

### Generierte JSON-Dateien

```
public/ratings/
  ├── doener-aus-dem-ofen.json
  ├── another-recipe.json
  └── .gitkeep
```

## Sicherheit & Privacy

- **IP-Hashing:** Nutzer-IPs werden gehasht (SHA-256), nicht gespeichert
- **Einmalige Bewertung:** 1 Bewertung pro User/Rezept (permanent)
- **localStorage-Check:** Verhindert Mehrfachbewertungen im Browser
- **Keine persönlichen Daten:** Keine Namen, Emails, etc.
- **GDPR-konform:** Keine personenbezogenen Daten

## Wartung

### Bewertungen löschen

Über Netlify CLI oder Dashboard:
```bash
netlify blobs:delete ratings:doener-aus-dem-ofen
```

### Alle Bewertungen exportieren

```bash
netlify blobs:list ratings
```

### Manuell aggregieren

```bash
# Nur in Netlify-Umgebung
npm run aggregate-ratings
```

## Troubleshooting

### "No rating data found"
- Normal bei neuen Rezepten ohne Bewertungen
- Oder: Aggregations-Script noch nicht ausgeführt

### "Fehler beim Speichern"
- Netlify Blobs nicht verfügbar (lokal)
- Netzwerkproblem
- Rate-Limit erreicht (bereits bewertet)

### Build-Fehler
- `MissingBlobsEnvironmentError`: Normal lokal, wird übersprungen
- Auf Netlify: Blobs aktiviert? (automatisch bei Netlify-Adapter)
