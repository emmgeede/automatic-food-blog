import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lorem Ipsum Texte
const loremShort = "Lorem ipsum dolor sit amet, consectetur adipiscing elit.";
const loremMedium = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.";
const loremLong = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.";

// 10 Rezepte mit gleichen Taxonomien (Italienisch)
const italianRecipes = [
  { slug: "fake-spaghetti-carbonara", title: "Spaghetti Carbonara", image: 1 },
  { slug: "fake-pizza-margherita", title: "Pizza Margherita", image: 2 },
  { slug: "fake-lasagne-bolognese", title: "Lasagne Bolognese", image: 3 },
  { slug: "fake-risotto-milanese", title: "Risotto Milanese", image: 4 },
  { slug: "fake-pasta-pesto", title: "Pasta al Pesto", image: 5 },
  { slug: "fake-ossobuco", title: "Ossobuco alla Milanese", image: 6 },
  { slug: "fake-saltimbocca", title: "Saltimbocca alla Romana", image: 7 },
  { slug: "fake-parmigiana", title: "Parmigiana di Melanzane", image: 8 },
  { slug: "fake-gnocchi", title: "Gnocchi al Gorgonzola", image: 9 },
  { slug: "fake-ravioli", title: "Ravioli Ricotta Spinaci", image: 10 }
];

// 10 Rezepte mit verschiedenen Taxonomien
const variedRecipes = [
  { slug: "fake-apple-pie", title: "Apple Pie", categories: ["Dessert", "Backen"], cuisine: "Amerikanisch", difficulty: "mittel", mealType: "Dessert", image: 11 },
  { slug: "fake-croissant", title: "Französische Croissants", categories: ["Frühstück", "Backen"], cuisine: "Französisch", difficulty: "schwer", mealType: "Frühstück", image: 12 },
  { slug: "fake-tom-yum", title: "Tom Yum Suppe", categories: ["Vorspeise", "Suppe"], cuisine: "Thailändisch", difficulty: "mittel", mealType: "Vorspeise", image: 13 },
  { slug: "fake-sushi-rolls", title: "California Sushi Rolls", categories: ["Hauptgericht", "Fisch"], cuisine: "Japanisch", difficulty: "schwer", mealType: "Hauptgericht", image: 14 },
  { slug: "fake-paella", title: "Paella Valenciana", categories: ["Hauptgericht", "Meeresfrüchte"], cuisine: "Spanisch", difficulty: "mittel", mealType: "Hauptgericht", image: 15 },
  { slug: "fake-schnitzel", title: "Wiener Schnitzel", categories: ["Hauptgericht", "Fleisch"], cuisine: "Österreichisch", difficulty: "einfach", mealType: "Hauptgericht", image: 16 },
  { slug: "fake-falafel", title: "Falafel mit Tahini", categories: ["Vorspeise", "Vegetarisch"], cuisine: "Orientalisch", difficulty: "einfach", mealType: "Vorspeise", image: 17 },
  { slug: "fake-pancakes", title: "Amerikanische Pancakes", categories: ["Frühstück", "Süßspeise"], cuisine: "Amerikanisch", difficulty: "einfach", mealType: "Frühstück", image: 18 },
  { slug: "fake-biryani", title: "Chicken Biryani", categories: ["Hauptgericht", "Reis"], cuisine: "Indisch", difficulty: "mittel", mealType: "Hauptgericht", image: 19 },
  { slug: "fake-tiramisu", title: "Tiramisu Classico", categories: ["Dessert", "Italienisch"], cuisine: "Italienisch", difficulty: "einfach", mealType: "Dessert", image: 20 }
];

// Hilfsfunktion zum Generieren von Zutaten
function generateIngredients(count = 8) {
  const ingredientNames = [
    "Mehl", "Zucker", "Eier", "Butter", "Milch", "Salz", "Pfeffer",
    "Olivenöl", "Knoblauch", "Zwiebeln", "Tomaten", "Paprika",
    "Karotten", "Kartoffeln", "Reis", "Nudeln", "Käse", "Sahne"
  ];

  const units = ["g", "ml", "EL", "TL", "Stück", "Prise"];
  const groups = ["Hauptzutaten", "Gewürze", "Zum Servieren", "Optional"];

  const ingredients = [];
  for (let i = 0; i < count; i++) {
    ingredients.push({
      name: ingredientNames[Math.floor(Math.random() * ingredientNames.length)],
      amount: Math.floor(Math.random() * 500) + 50,
      unit: units[Math.floor(Math.random() * units.length)],
      note: Math.random() > 0.7 ? "nach Geschmack" : null,
      group: groups[Math.floor(Math.random() * groups.length)]
    });
  }

  return ingredients;
}

// Hilfsfunktion zum Generieren von Schritten
function generateSteps(count = 5) {
  const steps = [];
  for (let i = 1; i <= count; i++) {
    steps.push({
      number: i,
      title: `Schritt ${i}`,
      shortText: loremShort,
      text: loremMedium,
      tips: []
    });
  }
  return steps;
}

// Hilfsfunktion zum Generieren eines Rezepts
function generateRecipe(recipeData, isItalian = false) {
  const uuid = crypto.randomUUID();
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 365)); // Zufälliges Datum im letzten Jahr

  const prepTime = Math.floor(Math.random() * 30) + 10;
  const cookTime = Math.floor(Math.random() * 60) + 15;
  const totalTime = prepTime + cookTime;

  const recipe = {
    uuid: uuid,
    metadata: {
      title: recipeData.title,
      description: loremMedium,
      slug: recipeData.slug,
      pubDate: date.toISOString().split('T')[0],
      modifiedDate: date.toISOString().split('T')[0],
      author: "Food Blog Test",
      language: "de"
    },
    seo: {
      metaTitle: `${recipeData.title} - Leckeres Rezept`,
      metaDescription: loremShort,
      metaKeywords: [recipeData.title, "Rezept", "Kochen", "Food Blog"],
      ogImage: `https://picsum.photos/1200/800?random=${recipeData.image}`,
      ogType: "article"
    },
    taxonomy: {
      categories: isItalian
        ? ["Hauptgericht", "Abendessen", "Italienisch"]
        : recipeData.categories,
      tags: ["Test", "Lorem Ipsum", "Beispiel"],
      cuisine: isItalian ? "Italienisch" : recipeData.cuisine,
      difficulty: isItalian ? "einfach" : recipeData.difficulty,
      mealType: isItalian ? "Hauptgericht" : recipeData.mealType
    },
    timing: {
      prepTime: `PT${prepTime}M`,
      cookTime: `PT${cookTime}M`,
      totalTime: `PT${totalTime}M`,
      prepTimeMinutes: prepTime,
      cookTimeMinutes: cookTime,
      totalTimeMinutes: totalTime
    },
    nutrition: {
      servings: Math.floor(Math.random() * 6) + 2,
      servingSize: "1 Portion",
      calories: `${Math.floor(Math.random() * 400) + 200}`,
      carbohydrates: `${Math.floor(Math.random() * 50) + 10}g`,
      protein: `${Math.floor(Math.random() * 40) + 10}g`,
      fat: `${Math.floor(Math.random() * 30) + 5}g`,
      fiber: `${Math.floor(Math.random() * 10) + 2}g`,
      sugar: null,
      sodium: null
    },
    ingredients: generateIngredients(Math.floor(Math.random() * 8) + 6),
    images: {
      featured: {
        src: `https://picsum.photos/1200/800?random=${recipeData.image}`,
        alt: recipeData.title,
        width: 1200,
        height: 800,
        caption: null
      },
      content: [],
      steps: []
    },
    content: {
      introduction: {
        title: "Einleitung",
        text: loremLong
      },
      facts: [
        {
          title: "Wussten Sie?",
          text: loremShort,
          order: 1
        },
        {
          title: "Tipp",
          text: loremShort,
          order: 2
        }
      ],
      steps: generateSteps(Math.floor(Math.random() * 5) + 4),
      tips: {
        title: "Tipps",
        items: [
          {
            title: "Tipp 1",
            text: loremShort
          },
          {
            title: "Tipp 2",
            text: loremShort
          }
        ]
      },
      conclusion: {
        text: loremMedium
      }
    },
    recipeSchema: {
      "@context": "https://schema.org",
      "@type": "Recipe",
      name: recipeData.title,
      description: loremShort,
      author: {
        "@type": "Person",
        name: "Food Blog Test"
      },
      datePublished: date.toISOString(),
      image: `https://picsum.photos/1200/800?random=${recipeData.image}`,
      recipeYield: `${Math.floor(Math.random() * 6) + 2} Portionen`,
      prepTime: `PT${prepTime}M`,
      cookTime: `PT${cookTime}M`,
      totalTime: `PT${totalTime}M`,
      recipeCategory: isItalian ? "Hauptgericht" : recipeData.categories[0],
      recipeCuisine: isItalian ? "Italienisch" : recipeData.cuisine,
      keywords: recipeData.title,
      recipeIngredient: generateIngredients().map(ing => `${ing.amount} ${ing.unit} ${ing.name}`),
      recipeInstructions: generateSteps().map((step, idx) => ({
        "@type": "HowToStep",
        name: step.title,
        text: step.instruction,
        position: idx + 1
      }))
    }
  };

  return recipe;
}

// Hauptfunktion
function main() {
  const contentDir = path.join(__dirname, '../src/content/blog');

  // Erstelle Verzeichnis falls nicht vorhanden
  if (!fs.existsSync(contentDir)) {
    fs.mkdirSync(contentDir, { recursive: true });
  }

  console.log('Generiere 20 Fake-Rezepte...\n');

  // Generiere 10 italienische Rezepte (gleiche Taxonomien)
  console.log('10 Italienische Rezepte (für verwandte Beiträge):');
  italianRecipes.forEach(recipeData => {
    const recipe = generateRecipe(recipeData, true);
    const filePath = path.join(contentDir, `${recipeData.slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(recipe, null, 2));
    console.log(`✓ ${recipeData.title} (${recipeData.slug}.json)`);
  });

  console.log('\n10 Verschiedene Rezepte:');
  // Generiere 10 verschiedene Rezepte
  variedRecipes.forEach(recipeData => {
    const recipe = generateRecipe(recipeData, false);
    const filePath = path.join(contentDir, `${recipeData.slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(recipe, null, 2));
    console.log(`✓ ${recipeData.title} (${recipeData.slug}.json)`);
  });

  console.log('\n✅ 20 Fake-Rezepte erfolgreich erstellt!');
  console.log('\nTaxonomie-Übersicht:');
  console.log('- 10 Rezepte: Italienisch, Hauptgericht, Abendessen (zum Testen verwandter Beiträge)');
  console.log('- 10 Rezepte: Verschiedene Cuisines und Kategorien');
}

main();
