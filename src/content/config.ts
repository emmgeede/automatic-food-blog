import { defineCollection, z } from "astro:content";

// Funktion zum Erstellen eines Schemas für Bilder/Assets, die im JSON verwendet werden
const imageAssetSchema = z.object({
  src: z.string(), // Der Pfad zur Bilddatei (z.B. "./images/...")
  alt: z.string(), // Alternativer Text für SEO und Barrierefreiheit
  filename: z.string().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  caption: z.string().nullable().optional(),
});

// Das Schema für die Blog Collection basierend auf Ihrer JSON-Struktur
const blogCollection = defineCollection({
  // Für JSON-Dateien ist der Typ 'data' in Content Collections
  type: "data",

  schema: z.object({
    uuid: z.string().uuid(),

    // --- METADATA (aus JSON "metadata") ---
    metadata: z
      .object({
        title: z.string(),
        description: z.string(),
        slug: z.string(),
        pubDate: z.coerce.date(), // Wandelt den String in ein Date-Objekt um
        modifiedDate: z.coerce.date().optional(),
        author: z.string().optional(),
        language: z.string().optional(),
      })
      .optional(),

    // --- SEO (aus JSON "seo") ---
    seo: z
      .object({
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaKeywords: z.array(z.string()).optional(),
        metaCanonical: z.string().optional(), // Ihr Schema-Feld, optional
        ogImage: z.string().optional(),
        ogType: z.string().optional(),
      })
      .optional(),

    // --- TAXONOMY (aus JSON "taxonomy") ---
    taxonomy: z
      .object({
        categories: z.array(z.string()),
        tags: z.array(z.string()).optional(),
        cuisine: z.string().optional(),
        difficulty: z.string().optional(),
        mealType: z.string().optional(),
      })
      .optional(),

    // --- TIMING (aus JSON "timing") ---
    timing: z
      .object({
        prepTime: z.string().optional(), // PT30M
        cookTime: z.string().optional(), // PT45M
        totalTime: z.string().optional(), // PT75M
        prepTimeMinutes: z.number().optional(),
        cookTimeMinutes: z.number().optional(),
        totalTimeMinutes: z.number().optional(),
      })
      .optional(),

    // --- NUTRITION (aus JSON "nutrition") ---
    nutrition: z
      .object({
        servings: z.number().or(z.string()).optional(), // Kann Zahl oder String sein
        servingSize: z.string().optional(),
        calories: z.string().optional(),
        carbohydrates: z.string().optional(),
        protein: z.string().optional(),
        fat: z.string().optional(),
        fiber: z.string().nullable().optional(),
        sugar: z.string().nullable().optional(),
        sodium: z.string().nullable().optional(),
      })
      .optional(),

    // --- INGREDIENTS (aus JSON "ingredients") ---
    ingredients: z.array(
      z.object({
        name: z.string(),
        amount: z.number().or(z.string()).nullable().optional(),
        unit: z.string().nullable().optional(),
        note: z.string().nullable().optional(),
        group: z.string().nullable().optional(),
      })
    ),

    // --- IMAGES (aus JSON "images") ---
    images: z
      .object({
        featured: imageAssetSchema.optional(),
        content: z
          .array(
            imageAssetSchema.extend({
              id: z.string().optional(),
              position: z.string().optional(),
            })
          )
          .optional(),
        steps: z
          .array(
            imageAssetSchema.extend({
              stepNumber: z.number(),
            })
          )
          .optional(),
      })
      .optional(),

    // --- CONTENT/BODY (nur für JSON-Dateien optional, da sie keinen "Body" haben) ---
    content: z
      .object({
        introduction: z
          .object({
            text: z.string(),
            characterCount: z.number().optional(),
          })
          .optional(),
        facts: z
          .array(
            z.object({
              title: z.string(),
              text: z.string(),
              order: z.number(),
            })
          )
          .optional(),
        steps: z
          .array(
            z.object({
              number: z.number(),
              title: z.string(),
              shortText: z.string(),
              text: z.string(),
              image: z.string().optional(),
              tips: z.array(z.string()).optional(),
            })
          )
          .optional(),
        tips: z
          .object({
            title: z.string(),
            items: z.array(
              z.object({
                title: z.string(),
                text: z.string(),
              })
            ),
          })
          .optional(),
        conclusion: z
          .object({
            text: z.string(),
          })
          .optional(),
      })
      .optional(),

    // --- FAQs (aus JSON "faqs") ---
    faqs: z
      .array(
        z.object({
          question: z.string(),
          answer: z.string(),
          category: z.string().optional(),
        })
      )
      .optional(),

    // --- REZEPT-SCHEMA (aus JSON "recipeSchema") ---
    recipeSchema: z.object({}).passthrough().optional(), // Wir behandeln das Schema.org-Objekt als Passthrough

    // --- VGWORT (optional) ---
    vgwort: z.object({}).passthrough().optional(),
  }),
});

// Exportieren der Collections
export const collections = {
  blog: blogCollection,
};
