import type { CollectionEntry } from "astro:content";

type BlogEntry = CollectionEntry<"blog">;

interface RelatedPost {
  post: BlogEntry;
  score: number;
  matches: {
    categories: number;
    cuisine: boolean;
    difficulty: boolean;
    ingredients: number;
    titleWords: number;
  };
}

/**
 * Extrahiert Hauptzutaten aus einem Rezept (Namen der ersten Zutaten)
 */
function extractMainIngredients(entry: BlogEntry, limit = 10): string[] {
  if (!entry.data.ingredients) return [];

  return entry.data.ingredients
    .slice(0, limit)
    .map(ing => ing.name.toLowerCase().trim())
    .filter(Boolean);
}

/**
 * Extrahiert relevante Wörter aus dem Titel (ohne Stopwords)
 */
function extractTitleKeywords(title: string): string[] {
  const stopwords = [
    'der', 'die', 'das', 'den', 'dem', 'des',
    'ein', 'eine', 'einer', 'einem', 'eines',
    'und', 'oder', 'mit', 'von', 'zu', 'im', 'in', 'aus',
    'für', 'auf', 'an', 'bei', 'nach', 'über'
  ];

  return title
    .toLowerCase()
    .split(/[\s-]+/)
    .filter(word => word.length > 3 && !stopwords.includes(word));
}

/**
 * Berechnet den Verwandtschafts-Score zwischen zwei Rezepten
 */
function calculateRelationScore(
  currentPost: BlogEntry,
  candidatePost: BlogEntry
): RelatedPost | null {
  // Aktuellen Post nicht als verwandt vorschlagen
  if (currentPost.data.metadata.slug === candidatePost.data.metadata.slug) {
    return null;
  }

  let score = 0;
  const matches = {
    categories: 0,
    cuisine: false,
    difficulty: false,
    ingredients: 0,
    titleWords: 0,
  };

  // 1. Kategorien-Übereinstimmungen (5 Punkte pro Match)
  const currentCategories = currentPost.data.taxonomy?.categories || [];
  const candidateCategories = candidatePost.data.taxonomy?.categories || [];

  currentCategories.forEach(cat => {
    if (candidateCategories.includes(cat)) {
      matches.categories++;
      score += 5;
    }
  });

  // 2. Cuisine-Übereinstimmung (10 Punkte)
  if (
    currentPost.data.taxonomy?.cuisine &&
    candidatePost.data.taxonomy?.cuisine &&
    currentPost.data.taxonomy.cuisine === candidatePost.data.taxonomy.cuisine
  ) {
    matches.cuisine = true;
    score += 10;
  }

  // 3. Difficulty-Übereinstimmung (3 Punkte)
  if (
    currentPost.data.taxonomy?.difficulty &&
    candidatePost.data.taxonomy?.difficulty &&
    currentPost.data.taxonomy.difficulty === candidatePost.data.taxonomy.difficulty
  ) {
    matches.difficulty = true;
    score += 3;
  }

  // 4. Zutaten-Übereinstimmungen (2 Punkte pro Match)
  const currentIngredients = extractMainIngredients(currentPost);
  const candidateIngredients = extractMainIngredients(candidatePost);

  currentIngredients.forEach(ing => {
    // Prüfe auf exakte Matches oder Teil-Matches
    const hasMatch = candidateIngredients.some(
      candIng =>
        candIng === ing ||
        candIng.includes(ing) ||
        ing.includes(candIng)
    );

    if (hasMatch) {
      matches.ingredients++;
      score += 2;
    }
  });

  // 5. Titel-Keywords-Übereinstimmungen (4 Punkte pro Match)
  const currentTitleWords = extractTitleKeywords(currentPost.data.metadata.title);
  const candidateTitleWords = extractTitleKeywords(candidatePost.data.metadata.title);

  currentTitleWords.forEach(word => {
    if (candidateTitleWords.includes(word)) {
      matches.titleWords++;
      score += 4;
    }
  });

  // Mindestens ein Match erforderlich
  if (score === 0) {
    return null;
  }

  return {
    post: candidatePost,
    score,
    matches,
  };
}

/**
 * Findet verwandte Beiträge basierend auf Taxonomie, Zutaten und Titel
 *
 * @param currentPost - Der aktuelle Beitrag
 * @param allPosts - Alle verfügbaren Beiträge
 * @param limit - Maximale Anzahl verwandter Beiträge (Standard: 12)
 * @returns Array von verwandten Beiträgen, sortiert nach Relevanz
 */
export function getRelatedPosts(
  currentPost: BlogEntry,
  allPosts: BlogEntry[],
  limit = 12
): BlogEntry[] {
  const relatedPosts: RelatedPost[] = [];

  // Berechne Scores für alle Posts
  allPosts.forEach(candidatePost => {
    const result = calculateRelationScore(currentPost, candidatePost);
    if (result) {
      relatedPosts.push(result);
    }
  });

  // Sortiere nach Score (höchster zuerst)
  relatedPosts.sort((a, b) => b.score - a.score);

  // Limitiere und gebe nur die Posts zurück (ohne Score-Infos)
  return relatedPosts.slice(0, limit).map(rp => rp.post);
}

/**
 * Debug-Funktion: Gibt detaillierte Informationen über verwandte Beiträge aus
 */
export function getRelatedPostsWithScores(
  currentPost: BlogEntry,
  allPosts: BlogEntry[],
  limit = 12
): RelatedPost[] {
  const relatedPosts: RelatedPost[] = [];

  allPosts.forEach(candidatePost => {
    const result = calculateRelationScore(currentPost, candidatePost);
    if (result) {
      relatedPosts.push(result);
    }
  });

  relatedPosts.sort((a, b) => b.score - a.score);

  return relatedPosts.slice(0, limit);
}
