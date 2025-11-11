# Automatic Food Blog

Ein automatisierter Food-Blog basierend auf Astro, der Rezeptinhalte mit strukturierten Daten und umfangreichen Metadaten verwaltet. Der Blog ist auf deutsche Rezepte optimiert und nutzt moderne Web-Technologien für eine performante und SEO-freundliche Darstellung.

## 🌟 Features

- **Strukturierte Rezeptdaten**: Vollständige Content Collections mit Schema-Validierung
- **SEO-optimiert**: Meta-Tags, OpenGraph, Canonical URLs und strukturierte Daten
- **Responsive Design**: Mit Tailwind CSS v4 und anpassbaren Theme-Variablen
- **Mehrsprachig-fähig**: Aktuell auf Deutsch konfiguriert
- **Test-Coverage**: Umfassende Tests mit Vitest für Schema, Content und Utils
- **Nährwertangaben**: Strukturierte Angaben zu Kalorien, Makronährstoffen, etc.
- **ISO 8601 Zeitangaben**: Standardisierte Prep- und Cook-Times

## 🚀 Schnellstart

### Voraussetzungen

- Node.js (Version 18 oder höher)
- npm oder yarn

### Installation

```bash
# Repository klonen
git clone <repository-url>
cd automatic-food-blog

# Dependencies installieren
npm install

# Development Server starten
npm run dev
```

Der Blog ist nun unter `http://localhost:4321` erreichbar.

## 📋 Verfügbare Commands

| Command | Beschreibung |
|---------|--------------|
| `npm install` | Installiert alle Dependencies |
| `npm run dev` | Startet den Development Server (localhost:4321) |
| `npm run build` | Erstellt den Production Build in `./dist/` |
| `npm run preview` | Preview des Production Builds lokal |
| `npm run astro ...` | Führt Astro CLI Commands aus |
| `npm run test` | Startet Tests im Watch Mode |
| `npm run test:ui` | Startet Tests mit Vitest UI |
| `npm run test:run` | Führt Tests einmalig aus (CI Mode) |

## 🏗️ Projekt-Struktur

```
/
├── public/                      # Statische Assets (Bilder, Fonts, etc.)
├── src/
│   ├── components/             # Wiederverwendbare Astro-Komponenten
│   │   ├── PostHeader.astro   # Blog-Post Header
│   │   ├── MainNavigation.astro
│   │   ├── StarReviews.astro  # Rezept-Bewertungen
│   │   ├── Categories.astro   # Kategorie-Anzeige
│   │   ├── Button.astro       # UI-Elemente
│   │   └── Pill.astro
│   ├── content/               # Content Collections
│   │   ├── blog/             # Blog-Posts (Markdown-Dateien)
│   │   └── config.ts         # Content Collection Schema
│   ├── layouts/              # Layout-Templates
│   │   ├── layoutBase.astro  # Basis-Layout mit Meta-Tags
│   │   └── layoutBlogPost.astro
│   ├── pages/                # Astro Pages (File-based Routing)
│   │   ├── index.astro      # Homepage
│   │   ├── blog/
│   │   │   └── [slug].astro # Dynamische Blog-Post Route
│   │   └── api/             # API-Endpoints
│   ├── styles/              # Globale Styles
│   │   └── global.css       # Tailwind + Custom Theme
│   ├── utils/               # Utility-Funktionen
│   │   └── blog.ts         # Blog-Helpers
│   └── __mocks__/          # Test-Mocks
├── scripts/                 # Build- und Utility-Scripts
├── astro.config.mjs        # Astro-Konfiguration
├── package.json
├── vitest.config.ts        # Test-Konfiguration
├── prettier.config.mjs     # Code-Formatierung
└── CLAUDE.md              # Entwickler-Dokumentation
```

## 📝 Rezept-Format

Blog-Posts werden als Markdown-Dateien in `src/content/blog/` gespeichert. Jedes Rezept enthält umfangreiche Frontmatter-Daten:

```markdown
---
title: "Rezeptname"
description: "Kurzbeschreibung"
metaTitle: "SEO Title"
metaDescription: "SEO Description"
metaKeywords:
  - "Keyword 1"
  - "Keyword 2"
pubDate: 2025-11-02
heroImage: "https://example.com/image.jpg"
categories:
  - "Hauptspeise"
  - "Vegetarisch"
keywords:
  - "Zutat 1"
  - "Zutat 2"
ingredients:
  - "200 g Mehl"
  - "100 ml Milch"
  - "2 Eier"
servings: 4
calories: 450
carbohydrates: 45
protein: 15
fat: 20
prepTime: "PT15M"
cookTime: "PT30M"
cuisine: "Deutsch"
sourceUrl: "https://original-recipe.com"
---

# Rezeptinhalt hier...
```

### Frontmatter-Felder

#### Pflichtfelder
- `title`: Rezeptname
- `description`: Kurzbeschreibung
- `heroImage`: URL zum Hauptbild
- `ingredients`: Array von Zutaten mit Mengenangaben

#### Optionale Felder
- `metaTitle`, `metaDescription`, `metaKeywords`: SEO-Optimierung
- `metaCanonical`: Canonical URL
- `pubDate`: Veröffentlichungsdatum
- `categories`: Array von Kategorien
- `keywords`: Array von Schlagwörtern
- `servings`: Anzahl Portionen
- `calories`: Kalorien pro Portion
- `carbohydrates`, `protein`, `fat`: Nährwerte in Gramm
- `prepTime`, `cookTime`: Zeiten im ISO 8601 Format (z.B. "PT15M" = 15 Minuten)
- `cuisine`: Küchenstil (z.B. "Deutsch", "Italienisch")
- `sourceUrl`: Link zum Original-Rezept
- `images`: Array zusätzlicher Bilder

## 🎨 Styling

Das Projekt nutzt **Tailwind CSS v4** mit angepassten Theme-Variablen:

```css
/* src/styles/global.css */
@theme {
  --color-primary: #8b5a3c;
  --color-secondary: #d4a574;
  --color-accent: #e67e22;
  --font-display: 'Faustina', serif;
  /* ... weitere Variablen */
}
```

### Tailwind-Konfiguration

- Integration über `@tailwindcss/vite` Plugin
- Content-Scan: `./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}`
- Custom Font: Faustina (Google Fonts)

## 🧪 Testing

Das Projekt verwendet **Vitest** mit happy-dom Environment.

### Test-Struktur

1. **Schema-Tests** (`src/content/config.test.ts`)
   - Validierung von Pflicht- und optionalen Feldern
   - Typ-Prüfungen für Arrays, Dates, Objects
   - Nährwert-Objekt-Struktur

2. **Content-Tests** (`src/content/blog.test.ts`)
   - Frontmatter-Validierung aller Blog-Posts
   - Unique Title Check
   - ISO 8601 Duration Format
   - Content-Existenz-Prüfung

3. **Utility-Tests** (`src/utils/blog.test.ts`)
   - ISO 8601 Duration Parsing
   - URL-Validierung
   - Date Handling
   - Datenstruktur-Validierung

### Tests ausführen

```bash
# Watch Mode
npm run test

# Mit UI
npm run test:ui

# Single Run (CI)
npm run test:run
```

## 🔧 Konfiguration

### Astro Config

```javascript
// astro.config.mjs
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  }
});
```

### Prettier

Konfiguriert mit:
- `prettier-plugin-astro`
- `prettier-plugin-tailwindcss`
- Semikolons: true
- Quotes: double
- Tab Width: 2
- Print Width: 100

## 🌍 Internationalisierung

Aktuell ist die Site auf **Deutsch** konfiguriert (`<html lang="de">`). Die Rezeptinhalte folgen deutschen Konventionen mit strukturierten Zutatenlisten (Menge, Einheit, Zutat).

## 📦 Dependencies

### Haupt-Dependencies
- **Astro**: ^5.15.3 - Static Site Generator
- **Tailwind CSS**: ^4.1.16 - Utility-First CSS Framework
- **@tailwindcss/vite**: ^4.1.16 - Vite Plugin für Tailwind v4

### Dev-Dependencies
- **Vitest**: ^4.0.8 - Test Framework
- **@vitest/ui**: ^4.0.8 - Test UI
- **happy-dom**: ^20.0.10 - DOM Implementation für Tests
- **Prettier**: ^3.6.2 - Code Formatter
- **gray-matter**: ^4.0.3 - Frontmatter Parser
- **glob**: ^11.0.3 - File Pattern Matching
- **sass**: ^1.93.3 - CSS Preprocessor

## 🚀 Deployment

```bash
# Production Build erstellen
npm run build

# Build lokal testen
npm run preview
```

Der Build-Output befindet sich im `./dist/` Verzeichnis und kann auf jedem Static Hosting Service deployed werden (Netlify, Vercel, GitHub Pages, etc.).

## 📚 Content Collections

Das Projekt nutzt Astro's Content Collections mit typsicherem Schema. Alle Blog-Posts durchlaufen automatische Validierung beim Build.

### Neues Rezept hinzufügen

1. Markdown-Datei in `src/content/blog/` erstellen
2. Frontmatter mit allen Pflichtfeldern ausfüllen
3. Rezeptinhalt schreiben
4. Tests ausführen: `npm run test:run`
5. Build testen: `npm run build`

## 🔍 SEO-Features

- Meta-Tags für Titel, Description, Keywords
- OpenGraph Tags für Social Media
- Canonical URLs
- Strukturierte Daten (über Schema-Validierung vorbereitet)
- Responsive Images
- Semantisches HTML

## 🤝 Entwicklung

Für detaillierte Entwickler-Anweisungen siehe `CLAUDE.md`.

### Code-Formatierung

```bash
# Code formatieren
npx prettier --write .

# Code prüfen
npx prettier --check .
```

## 📄 Lizenz

[Lizenz hier einfügen]

## 👥 Beitragende

[Beitragende hier einfügen]

## 📞 Support

Bei Fragen oder Problemen öffne bitte ein Issue im Repository.

---

**Entwickelt mit ❤️ und Astro**
