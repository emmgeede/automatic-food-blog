# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Astro-based food blog designed to automatically publish recipe content. The site uses Tailwind CSS v4 for styling and supports German language content. The architecture is built around Astro's content collections for managing blog posts as markdown files with structured frontmatter.

## Development Commands

```bash
npm run dev        # Start dev server at localhost:4321
npm run build      # Build production site to ./dist/
npm run preview    # Preview production build locally
npm run astro ...  # Run Astro CLI commands
npm run test       # Run tests in watch mode
npm run test:ui    # Run tests with Vitest UI
npm run test:run   # Run tests once (CI mode)
```

## Code Architecture

### Content Collection Schema

The blog uses Astro's content collections with a highly structured schema defined in `src/content/config.ts`. Blog posts are markdown files in `src/content/blog/` with comprehensive frontmatter including:

- Recipe metadata (title, description, heroImage, sourceUrl)
- SEO fields (metaTitle, metaDescription, metaKeywords, metaCanonical)
- Recipe-specific data (ingredients, keywords, categories, cuisine)
- Nutritional information (servings, calories, carbohydrates, protein, fat)
- Timing data (prepTime, cookTime in ISO 8601 duration format like "PT10M")
- Multiple images support

All these fields flow through the content collection schema validation and are available in layouts/components.

### Layout System

Two-layer layout architecture:

1. **layoutBase.astro**: Base HTML structure with meta tags, OpenGraph tags, and canonical URLs. Accepts `frontmatter` prop containing all metadata fields from the content collection schema.

2. **layoutBlogPost.astro**: Wraps layoutBase and adds the PostHeader component. Acts as the intermediary between blog content and the base layout.

Blog posts are rendered via dynamic route `src/pages/blog/[slug].astro` which:
- Uses `getStaticPaths()` with `getCollection("blog")` to generate routes
- Renders content using the `Content` component from `post.render()`
- Passes `post.data` as frontmatter to layoutBlogPost

### Styling Approach

- Uses Tailwind CSS v4 via Vite plugin (`@tailwindcss/vite`)
- Custom theme variables defined in `src/styles/global.css` using the `@theme` directive:
  - Color palette: primary, secondary, accent, muted, neutral
  - Font: Faustina (Google Fonts serif) as `--font-display`
- Tailwind content configured to scan: `./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}`
- Global styles import Tailwind via `@import "tailwindcss"`

### Components

Reusable components in `src/components/`:
- **PostHeader.astro**: Blog post header display
- **MainNavigation.astro**: Site navigation
- **StarReviews.astro**: Recipe rating display
- **Categories.astro**: Category display/filtering
- **Button.astro**, **Pill.astro**: UI elements

## Testing

The project uses Vitest for testing with the following setup:

- Test runner: Vitest with happy-dom environment
- Test files: `src/**/*.{test,spec}.{js,ts}`
- Mock for Astro imports: `src/__mocks__/astro-content.ts` provides mocks for `astro:content`

### Test Coverage

1. **Content Collection Schema Tests** (`src/content/config.test.ts`):
   - Validates required fields (heroImage, title, ingredients, etc.)
   - Tests optional fields (prepTime, cookTime, images, etc.)
   - Verifies field types (arrays, dates, objects)
   - Ensures nutrition object structure

2. **Blog Post Validation Tests** (`src/content/blog.test.ts`):
   - Validates all blog posts have proper frontmatter
   - Checks for unique titles across posts
   - Verifies content exists after frontmatter
   - Validates ISO 8601 duration format for timing fields
   - Ensures required arrays (ingredients, categories) are populated

3. **Utility Tests** (`src/utils/blog.test.ts`):
   - ISO 8601 duration parsing
   - URL validation
   - Recipe data structure validation
   - Date handling
   - Category and keyword structure validation

When modifying the content collection schema, update the corresponding tests to maintain coverage.

## Code Formatting

Prettier is configured with:
- Plugins: `prettier-plugin-astro`, `prettier-plugin-tailwindcss`
- Semi: true
- Single quote: false
- Tab width: 2
- Trailing comma: es5
- Print width: 100
- Special parser for `*.astro` files

When editing code, maintain these formatting standards.

## Important Notes

- Site language is German (`<html lang="de">`)
- Blog posts may contain duplicate frontmatter (formatting issue in existing content)
- Recipe content format follows German recipe conventions with structured ingredients list (quantity, unit, ingredient name)
- When adding new blog posts, ensure they pass validation by running `npm run test:run`
