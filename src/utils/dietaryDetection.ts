/**
 * Utility zur automatischen Erkennung von Ernährungsweisen (Dietary Labels)
 * basierend auf Zutaten und Nährwertdaten
 */

export interface DietaryLabels {
  vegan: boolean;
  vegetarian: boolean;
  lactoVegetarian: boolean;
  ovoVegetarian: boolean;
  pescatarian: boolean;
  keto: boolean;
  paleo: boolean;
  highProtein: boolean;
  highCarb: boolean;
  glutenFree: boolean;
  dairyFree: boolean;
  lowCarb: boolean;
  autoDetected: boolean;
  manuallyVerified: boolean;
}

export interface Ingredient {
  name: string;
  amount?: number | string | null;
  unit?: string | null;
  note?: string | null;
  group?: string | null;
}

export interface Nutrition {
  calories?: string;
  carbohydrates?: string;
  protein?: string;
  fat?: string;
  fiber?: string | null;
  sugar?: string | null;
}

// Blacklists für verschiedene Ernährungsweisen
const ANIMAL_PRODUCTS = [
  'fleisch', 'rindfleisch', 'schweinefleisch', 'hähnchen', 'huhn', 'geflügel',
  'lamm', 'kalb', 'ente', 'gans', 'wild', 'wurst', 'speck', 'schinken',
  'fisch', 'lachs', 'thunfisch', 'forelle', 'kabeljau', 'garnelen', 'shrimps',
  'muscheln', 'tintenfisch', 'meeresfrüchte', 'austern', 'hummer',
  'ei', 'eier', 'eigelb', 'eiweiß', 'eischnee',
  'milch', 'sahne', 'butter', 'käse', 'quark', 'joghurt', 'schmand',
  'crème fraîche', 'mascarpone', 'ricotta', 'mozzarella', 'parmesan',
  'honig', 'gelatine', 'schmalz', 'ghee', 'butterschmalz',
  'knochenbrühe', 'fleischbrühe', 'hühnerbrühe',
];

const MEAT_PRODUCTS = [
  'fleisch', 'rindfleisch', 'schweinefleisch', 'hähnchen', 'huhn', 'geflügel',
  'lamm', 'kalb', 'ente', 'gans', 'wild', 'wurst', 'speck', 'schinken',
  'knochenbrühe', 'fleischbrühe', 'hühnerbrühe',
];

const FISH_PRODUCTS = [
  'fisch', 'lachs', 'thunfisch', 'forelle', 'kabeljau', 'garnelen', 'shrimps',
  'muscheln', 'tintenfisch', 'meeresfrüchte', 'austern', 'hummer', 'krabben',
];

const DAIRY_PRODUCTS = [
  'milch', 'sahne', 'butter', 'käse', 'quark', 'joghurt', 'schmand',
  'crème fraîche', 'mascarpone', 'ricotta', 'mozzarella', 'parmesan',
  'butterschmalz', 'ghee', 'molke', 'frischkäse', 'schafskäse',
];

const EGG_PRODUCTS = [
  'ei', 'eier', 'eigelb', 'eiweiß', 'eischnee',
];

const GRAINS = [
  'mehl', 'weizenmehl', 'dinkelmehl', 'roggenmehl', 'brot', 'brötchen',
  'pasta', 'nudeln', 'spaghetti', 'penne', 'reis', 'vollkornreis',
  'gerste', 'hafer', 'haferflocken', 'quinoa', 'couscous', 'bulgur',
  'weizen', 'dinkel', 'roggen', 'mais', 'polenta',
];

const GLUTEN_GRAINS = [
  'mehl', 'weizenmehl', 'dinkelmehl', 'roggenmehl', 'weizen', 'dinkel',
  'roggen', 'gerste', 'hafer', 'haferflocken', 'brot', 'brötchen',
  'pasta', 'nudeln', 'spaghetti', 'penne', 'couscous', 'bulgur', 'seitan',
];

const LEGUMES = [
  'bohnen', 'linsen', 'kichererbsen', 'erbsen', 'sojabohnen', 'tofu',
  'tempeh', 'edamame', 'erdnüsse', 'erdnussbutter',
];

const STARCHY_VEGETABLES = [
  'kartoffel', 'kartoffeln', 'süßkartoffel', 'süßkartoffeln',
  'kürbis', 'hokkaido', 'butternut',
];

const HIGH_CARB_FOODS = [
  ...GRAINS,
  ...LEGUMES,
  ...STARCHY_VEGETABLES,
  'zucker', 'honig', 'ahornsirup', 'agavendicksaft', 'sirup',
];

const HIGH_PROTEIN_FOODS = [
  ...MEAT_PRODUCTS,
  ...FISH_PRODUCTS,
  'tofu', 'tempeh', 'seitan', 'linsen', 'kichererbsen', 'bohnen',
  'quark', 'hüttenkäse', 'cottage cheese', 'griechischer joghurt',
  'proteinpulver', 'eier',
];

/**
 * Prüft, ob eine Zutat in einer Liste von Begriffen vorkommt
 */
function ingredientContains(ingredient: Ingredient, terms: string[]): boolean {
  const ingredientName = ingredient.name.toLowerCase();
  const ingredientNote = ingredient.note?.toLowerCase() || '';

  return terms.some(term =>
    ingredientName.includes(term) || ingredientNote.includes(term)
  );
}

/**
 * Berechnet Makronährstoff-Verhältnisse
 */
function calculateMacroRatios(nutrition?: Nutrition): { protein: number; carbs: number; fat: number } {
  if (!nutrition) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  const protein = parseFloat(nutrition.protein || '0');
  const carbs = parseFloat(nutrition.carbohydrates || '0');
  const fat = parseFloat(nutrition.fat || '0');

  const total = protein * 4 + carbs * 4 + fat * 9; // Kalorien aus Makros

  if (total === 0) {
    return { protein: 0, carbs: 0, fat: 0 };
  }

  return {
    protein: (protein * 4 / total) * 100,
    carbs: (carbs * 4 / total) * 100,
    fat: (fat * 9 / total) * 100,
  };
}

/**
 * Hauptfunktion: Erkennt Ernährungsweisen basierend auf Zutaten und Nährwerten
 */
export function detectDietaryLabels(
  ingredients: Ingredient[],
  nutrition?: Nutrition
): DietaryLabels {
  const labels: DietaryLabels = {
    vegan: false,
    vegetarian: false,
    lactoVegetarian: false,
    ovoVegetarian: false,
    pescatarian: false,
    keto: false,
    paleo: false,
    highProtein: false,
    highCarb: false,
    glutenFree: false,
    dairyFree: false,
    lowCarb: false,
    autoDetected: true,
    manuallyVerified: false,
  };

  // Prüfungen für verschiedene tierische Produkte
  const hasMeat = ingredients.some(ing => ingredientContains(ing, MEAT_PRODUCTS));
  const hasFish = ingredients.some(ing => ingredientContains(ing, FISH_PRODUCTS));
  const hasDairy = ingredients.some(ing => ingredientContains(ing, DAIRY_PRODUCTS));
  const hasEggs = ingredients.some(ing => ingredientContains(ing, EGG_PRODUCTS));
  const hasAnimalProducts = ingredients.some(ing => ingredientContains(ing, ANIMAL_PRODUCTS));

  // Prüfungen für pflanzliche Lebensmittel
  const hasGrains = ingredients.some(ing => ingredientContains(ing, GRAINS));
  const hasLegumes = ingredients.some(ing => ingredientContains(ing, LEGUMES));
  const hasGlutenGrains = ingredients.some(ing => ingredientContains(ing, GLUTEN_GRAINS));

  // Makronährstoff-Verhältnisse
  const macros = calculateMacroRatios(nutrition);

  // VEGAN: Keine tierischen Produkte
  labels.vegan = !hasAnimalProducts;

  // VEGETARIAN: Keine Fleisch/Fisch, aber Eier/Milch erlaubt
  labels.vegetarian = !hasMeat && !hasFish;

  // LACTO-VEGETARIAN: Vegetarisch ohne Eier
  labels.lactoVegetarian = !hasMeat && !hasFish && !hasEggs && hasDairy;

  // OVO-VEGETARIAN: Vegetarisch ohne Milchprodukte
  labels.ovoVegetarian = !hasMeat && !hasFish && hasEggs && !hasDairy;

  // PESCATARIAN: Kein Fleisch, aber Fisch erlaubt
  labels.pescatarian = !hasMeat && hasFish;

  // KETO: Sehr wenig Kohlenhydrate (<10%), hoher Fettanteil
  // Keine Grains, Legumes, stärkehaltige Gemüse, Zucker
  const hasHighCarbFoods = ingredients.some(ing => ingredientContains(ing, HIGH_CARB_FOODS));
  labels.keto = !hasHighCarbFoods && macros.carbs < 10 && macros.fat > 60;

  // PALEO: Keine Grains, Legumes, Dairy, raffinierter Zucker
  const hasZucker = ingredients.some(ing =>
    ingredientContains(ing, ['zucker', 'rohrzucker', 'kristallzucker'])
  );
  labels.paleo = !hasGrains && !hasLegumes && !hasDairy && !hasZucker;

  // HIGH-PROTEIN: Protein >30% der Kalorien
  const hasHighProteinFoods = ingredients.some(ing => ingredientContains(ing, HIGH_PROTEIN_FOODS));
  labels.highProtein = macros.protein > 30 || hasHighProteinFoods;

  // HIGH-CARB: Kohlenhydrate >60% der Kalorien
  labels.highCarb = macros.carbs > 60 || hasHighCarbFoods;

  // LOW-CARB: Kohlenhydrate <20% der Kalorien
  labels.lowCarb = macros.carbs < 20 && !hasHighCarbFoods;

  // GLUTEN-FREE: Keine glutenhaltigen Getreide
  labels.glutenFree = !hasGlutenGrains;

  // DAIRY-FREE: Keine Milchprodukte
  labels.dairyFree = !hasDairy;

  return labels;
}

/**
 * Konvertiert DietaryLabels zu Schema.org suitableForDiet URLs
 */
export function dietaryLabelsToSchemaOrgDiet(labels: DietaryLabels): string[] {
  const schemaOrgDiets: string[] = [];

  if (labels.vegan) {
    schemaOrgDiets.push('https://schema.org/VeganDiet');
  }
  if (labels.vegetarian) {
    schemaOrgDiets.push('https://schema.org/VegetarianDiet');
  }
  if (labels.glutenFree) {
    schemaOrgDiets.push('https://schema.org/GlutenFreeDiet');
  }
  if (labels.keto) {
    schemaOrgDiets.push('https://schema.org/KetogenicDiet');
  }
  if (labels.lowCarb) {
    schemaOrgDiets.push('https://schema.org/LowCalorieDiet');
  }
  if (labels.dairyFree) {
    schemaOrgDiets.push('https://schema.org/DiabeticDiet'); // Closest match
  }

  return schemaOrgDiets;
}

/**
 * Liefert deutsche Labels für die Frontend-Anzeige
 */
export function getDietaryLabelDisplay(key: keyof DietaryLabels): { label: string; color: string } | null {
  const labelMap: Record<string, { label: string; color: string }> = {
    vegan: { label: 'Vegan', color: 'green' },
    vegetarian: { label: 'Vegetarisch', color: 'green' },
    lactoVegetarian: { label: 'Lacto-Vegetarisch', color: 'green' },
    ovoVegetarian: { label: 'Ovo-Vegetarisch', color: 'green' },
    pescatarian: { label: 'Pescatarisch', color: 'blue' },
    keto: { label: 'Keto', color: 'purple' },
    paleo: { label: 'Paleo', color: 'orange' },
    highProtein: { label: 'High Protein', color: 'red' },
    highCarb: { label: 'High Carb', color: 'yellow' },
    glutenFree: { label: 'Glutenfrei', color: 'teal' },
    dairyFree: { label: 'Laktosefrei', color: 'blue' },
    lowCarb: { label: 'Low Carb', color: 'purple' },
  };

  return labelMap[key] || null;
}

/**
 * Gibt alle aktiven Dietary Labels zurück (für Filterung)
 */
export function getActiveDietaryLabels(labels?: DietaryLabels): string[] {
  if (!labels) return [];

  return Object.entries(labels)
    .filter(([key, value]) =>
      value === true &&
      key !== 'autoDetected' &&
      key !== 'manuallyVerified'
    )
    .map(([key]) => key);
}
