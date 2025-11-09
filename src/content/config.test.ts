import { describe, it, expect } from "vitest";
import { collections } from "./config";

describe("Blog Collection Schema", () => {
  const blogSchema = collections.blog.schema;

  describe("Valid blog post data", () => {
    it("should validate a complete valid blog post", () => {
      const validPost = {
        metaTitle: "Test Recipe",
        metaDescription: "A test recipe description",
        metaCanonical: "https://example.com/test-recipe",
        metaKeywords: ["test", "recipe"],
        heroImage: "https://example.com/image.jpg",
        images: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
        keywords: ["chicken", "tomato"],
        ingredients: ["1 kg chicken", "500g tomatoes"],
        pubDate: new Date("2025-11-01"),
        title: "Test Recipe",
        description: "A delicious test recipe",
        categories: ["Main Course", "Dinner"],
        nutrition: {
          servings: "4 portions",
          calories: "300 kcal",
          carbohydrates: "20g",
          protein: "25g",
          fat: "10g",
        },
        prepTime: "PT15M",
        cookTime: "PT45M",
        servings: "4 portions",
        cuisine: "International",
        sourceUrl: "https://example.com/original",
      };

      const result = blogSchema.safeParse(validPost);
      expect(result.success).toBe(true);
    });

    it("should validate a minimal valid blog post", () => {
      const minimalPost = {
        heroImage: "https://example.com/image.jpg",
        keywords: ["test"],
        ingredients: ["ingredient 1"],
        pubDate: new Date("2025-11-01"),
        title: "Minimal Recipe",
        description: "Minimal description",
        categories: ["Test"],
        nutrition: {},
      };

      const result = blogSchema.safeParse(minimalPost);
      expect(result.success).toBe(true);
    });
  });

  describe("Required fields validation", () => {
    it("should reject post missing heroImage", () => {
      const invalidPost = {
        keywords: ["test"],
        ingredients: ["ingredient 1"],
        pubDate: new Date("2025-11-01"),
        title: "Test Recipe",
        description: "Test description",
        categories: ["Test"],
        nutrition: {},
      };

      const result = blogSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it("should reject post missing title", () => {
      const invalidPost = {
        heroImage: "https://example.com/image.jpg",
        keywords: ["test"],
        ingredients: ["ingredient 1"],
        pubDate: new Date("2025-11-01"),
        description: "Test description",
        categories: ["Test"],
        nutrition: {},
      };

      const result = blogSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it("should reject post missing ingredients array", () => {
      const invalidPost = {
        heroImage: "https://example.com/image.jpg",
        keywords: ["test"],
        pubDate: new Date("2025-11-01"),
        title: "Test Recipe",
        description: "Test description",
        categories: ["Test"],
        nutrition: {},
      };

      const result = blogSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });
  });

  describe("Field type validation", () => {
    it("should reject invalid date format", () => {
      const invalidPost = {
        heroImage: "https://example.com/image.jpg",
        keywords: ["test"],
        ingredients: ["ingredient 1"],
        pubDate: "not-a-date",
        title: "Test Recipe",
        description: "Test description",
        categories: ["Test"],
        nutrition: {},
      };

      const result = blogSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it("should reject non-array keywords", () => {
      const invalidPost = {
        heroImage: "https://example.com/image.jpg",
        keywords: "not-an-array",
        ingredients: ["ingredient 1"],
        pubDate: new Date("2025-11-01"),
        title: "Test Recipe",
        description: "Test description",
        categories: ["Test"],
        nutrition: {},
      };

      const result = blogSchema.safeParse(invalidPost);
      expect(result.success).toBe(false);
    });

    it("should accept valid nutrition object with optional fields", () => {
      const postWithPartialNutrition = {
        heroImage: "https://example.com/image.jpg",
        keywords: ["test"],
        ingredients: ["ingredient 1"],
        pubDate: new Date("2025-11-01"),
        title: "Test Recipe",
        description: "Test description",
        categories: ["Test"],
        nutrition: {
          servings: "4 portions",
          calories: "300 kcal",
        },
      };

      const result = blogSchema.safeParse(postWithPartialNutrition);
      expect(result.success).toBe(true);
    });
  });

  describe("Optional fields validation", () => {
    it("should accept post with optional prepTime and cookTime", () => {
      const postWithTiming = {
        heroImage: "https://example.com/image.jpg",
        keywords: ["test"],
        ingredients: ["ingredient 1"],
        pubDate: new Date("2025-11-01"),
        title: "Test Recipe",
        description: "Test description",
        categories: ["Test"],
        nutrition: {},
        prepTime: "PT10M",
        cookTime: "PT30M",
      };

      const result = blogSchema.safeParse(postWithTiming);
      expect(result.success).toBe(true);
    });

    it("should accept post with optional images array", () => {
      const postWithImages = {
        heroImage: "https://example.com/image.jpg",
        images: ["https://example.com/img1.jpg", "https://example.com/img2.jpg"],
        keywords: ["test"],
        ingredients: ["ingredient 1"],
        pubDate: new Date("2025-11-01"),
        title: "Test Recipe",
        description: "Test description",
        categories: ["Test"],
        nutrition: {},
      };

      const result = blogSchema.safeParse(postWithImages);
      expect(result.success).toBe(true);
    });
  });
});
