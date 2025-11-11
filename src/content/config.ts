import { defineCollection, z } from "astro:content";

const blogCollection = defineCollection({
  type: "content",
  schema: z.object({
    uuid: z.string().uuid(),
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaCanonical: z.string().optional(),
    metaKeywords: z.array(z.string()).optional(),
    heroImage: z.string(),
    images: z.array(z.string()).optional(),
    keywords: z.array(z.string()),
    ingredients: z.array(z.string()),
    pubDate: z.date(),
    title: z.string(),
    description: z.string(),
    categories: z.array(z.string()),
    nutrition: z.object({
      servings: z.string().optional(),
      calories: z.string().optional(),
      carbohydrates: z.string().optional(),
      protein: z.string().optional(),
      fat: z.string().optional(),
    }),
    prepTime: z.string().optional(),
    cookTime: z.string().optional(),
    servings: z.string().optional(),
    cuisine: z.string().optional(),
    sourceUrl: z.string().optional(),
  }),
});

export const collections = {
  blog: blogCollection,
};
