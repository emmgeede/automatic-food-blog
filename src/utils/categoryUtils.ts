/**
 * Utility functions for category handling
 */

/**
 * Convert category name to URL-safe slug
 * @param category - Category display name (e.g., "Kaffee & Kuchen")
 * @returns URL-safe slug (e.g., "kaffee-kuchen")
 */
export function categoryToSlug(category: string): string {
  return category
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Get category archive URL
 * @param category - Category display name
 * @returns Category archive URL (e.g., "/kategorien/kaffee-kuchen")
 */
export function getCategoryUrl(category: string): string {
  return `/kategorien/${categoryToSlug(category)}`;
}

/**
 * Category display name mapping
 * Used to convert slugs back to display names
 */
export const categoryDisplayNames: Record<string, string> = {
  'abendessen': 'Abendessen',
  'advent': 'Advent',
  'backen': 'Backen',
  'dessert': 'Dessert',
  'fisch': 'Fisch',
  'fleisch': 'Fleisch',
  'fruehstueck': 'Frühstück',
  'hauptgericht': 'Hauptgericht',
  'italienisch': 'Italienisch',
  'kaffee-kuchen': 'Kaffee & Kuchen',
  'meeresfruechte': 'Meeresfrüchte',
  'mittagessen': 'Mittagessen',
  'plaetzchen-kekse': 'Plätzchen/Kekse',
  'reis': 'Reis',
  'suppe': 'Suppe',
  'suessspeise': 'Süßspeise',
  'tuerkisch': 'Türkisch',
  'vegetarisch': 'Vegetarisch',
  'vorspeise': 'Vorspeise',
  'weihnachten': 'Weihnachten',
};

/**
 * Get display name from slug
 * @param slug - Category URL slug
 * @returns Display name or slug if not found
 */
export function slugToCategory(slug: string): string {
  return categoryDisplayNames[slug] || slug;
}
