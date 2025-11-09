import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Read recipes.json
const recipes = JSON.parse(fs.readFileSync('recipes.json', 'utf8'));

// Take 11 recipes total (0-10), these will become recipes 01-11
const recipesToConvert = recipes.slice(0, 11);

// Helper function to create slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Helper function to extract keywords from ingredients
function extractKeywords(ingredients) {
  return ingredients.slice(0, 6).map(ing => {
    // Remove quantities and units, keep main ingredient
    return ing.replace(/^\d+\s*(g|ml|EL|TL|Stk\.|Becher|Dose|Stange|Kugel|Prise)?\s*/i, '')
              .split(',')[0]
              .trim();
  });
}

// Convert each recipe
recipesToConvert.forEach((recipe, index) => {
  const slug = createSlug(recipe.name);
  // Start numbering from 01
  const recipeNumber = index + 1;
  const filename = `${String(recipeNumber).padStart(2, '0')}-${slug}.md`;
  const filepath = path.join('src', 'content', 'blog', filename);

  // Extract meta keywords from recipe keywords field
  const metaKeywords = recipe.keywords
    ? recipe.keywords.split(',').map(k => k.trim()).slice(0, 4)
    : extractKeywords(recipe.recipeIngredient);

  // Format instructions
  const instructions = recipe.recipeInstructions
    .map((step, i) => {
      const text = step.text.replace(/\r\n/g, '\n').trim();
      return `**Schritt ${i + 1}:** ${text}`;
    })
    .join('\n\n');

  // Create markdown content
  const markdown = `---
title: "${recipe.name}"
description: "${recipe.description}"
metaTitle: "${recipe.name}"
metaDescription: "${recipe.description}"
metaKeywords:
${metaKeywords.map(k => `  - "${k}"`).join('\n')}
pubDate: ${recipe.datePublished}
heroImage: "${recipe.image}"
categories:
${recipe.recipeCategory.map(c => `  - "${c}"`).join('\n')}
keywords:
${extractKeywords(recipe.recipeIngredient).map(k => `  - "${k}"`).join('\n')}
ingredients:
${recipe.recipeIngredient.map(ing => `  - "${ing}"`).join('\n')}
nutrition:
  servings: "${recipe.recipeYield}"
  calories: "${recipe.nutrition.calories}"
  carbohydrates: "${recipe.nutrition.carbohydrateContent}"
  protein: "${recipe.nutrition.proteinContent}"
  fat: "${recipe.nutrition.fatContent}"
prepTime: "${recipe.prepTime}"
cookTime: "${recipe.cookTime}"
servings: "${recipe.recipeYield}"
cuisine: "${recipe.recipeCuisine}"
sourceUrl: "${recipe.url}"
---

## Zubereitung

${instructions}

---

_Quelle: [Original-Rezept](${recipe.url})_
`;

  // Write file
  fs.writeFileSync(filepath, markdown, 'utf8');
  console.log(`Created: ${filename}`);
});

console.log('\nSuccessfully created 10 recipe markdown files!');
