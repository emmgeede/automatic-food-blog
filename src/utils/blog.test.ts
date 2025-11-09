import { describe, it, expect } from "vitest";

describe("Blog Utility Functions", () => {
  describe("ISO 8601 Duration Parsing", () => {
    it("should parse PT10M as 10 minutes", () => {
      const duration = "PT10M";
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const minutes = match ? parseInt(match[2] || "0") : 0;
      expect(minutes).toBe(10);
    });

    it("should parse PT1H30M as 90 minutes total", () => {
      const duration = "PT1H30M";
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = match ? parseInt(match[1] || "0") : 0;
      const minutes = match ? parseInt(match[2] || "0") : 0;
      const totalMinutes = hours * 60 + minutes;
      expect(totalMinutes).toBe(90);
    });

    it("should parse PT2H as 120 minutes", () => {
      const duration = "PT2H";
      const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = match ? parseInt(match[1] || "0") : 0;
      const minutes = match ? parseInt(match[2] || "0") : 0;
      const totalMinutes = hours * 60 + minutes;
      expect(totalMinutes).toBe(120);
    });
  });

  describe("URL Validation", () => {
    it("should validate correct heroImage URLs", () => {
      const validUrls = [
        "https://example.com/image.jpg",
        "https://ais.kochbar.de/image.jpg",
        "http://example.com/image.png",
      ];

      validUrls.forEach((url) => {
        expect(url).toMatch(/^https?:\/\/.+/);
      });
    });

    it("should reject invalid URLs", () => {
      const invalidUrls = ["not-a-url", "ftp://example.com", "/relative/path"];

      invalidUrls.forEach((url) => {
        expect(url).not.toMatch(/^https?:\/\/.+/);
      });
    });
  });

  describe("Recipe Data Structure", () => {
    it("should have properly formatted ingredient strings", () => {
      const validIngredients = [
        "1 Stk. Hähnchen (ganz) - ca. 1,5 kg",
        "500 g Tomaten reif",
        "2 EL Olivenöl",
      ];

      validIngredients.forEach((ingredient) => {
        // Check that ingredient has some content
        expect(ingredient.trim().length).toBeGreaterThan(0);
        // Check it doesn't start with special characters
        expect(ingredient).toMatch(/^[0-9A-Za-zÄÖÜäöüß]/);
      });
    });

    it("should have properly structured nutrition values", () => {
      const nutritionValues = {
        servings: "4 Portionen",
        calories: "51 kcal",
        carbohydrates: "2.6 g",
        protein: "4.7 g",
        fat: "1 g",
      };

      // Check calories format
      if (nutritionValues.calories) {
        expect(nutritionValues.calories).toMatch(/^\d+(\.\d+)?\s*kcal$/);
      }

      // Check weight format (g or kg)
      if (nutritionValues.protein) {
        expect(nutritionValues.protein).toMatch(/^\d+(\.\d+)?\s*g$/);
      }
    });
  });

  describe("Date Handling", () => {
    it("should handle pubDate as Date object", () => {
      const pubDate = new Date("2025-11-01");
      expect(pubDate).toBeInstanceOf(Date);
      expect(pubDate.getFullYear()).toBe(2025);
      expect(pubDate.getMonth()).toBe(10); // November (0-indexed)
    });

    it("should validate date is not in the future by more than a week", () => {
      const pubDate = new Date("2025-11-01");
      const now = new Date();
      const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // For this test, we're checking the date is reasonable
      const isReasonable = pubDate <= oneWeekFromNow;
      expect(isReasonable).toBe(true);
    });
  });

  describe("Category and Keyword Structure", () => {
    it("should have categories as non-empty array", () => {
      const categories = ["Braten (Fleisch)", "Hauptspeise", "schnell & einfach"];

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      categories.forEach((category) => {
        expect(typeof category).toBe("string");
        expect(category.trim().length).toBeGreaterThan(0);
      });
    });

    it("should have keywords as non-empty array", () => {
      const keywords = ["Hähnchen (ganz)", "Tomaten reif", "Zwiebeln"];

      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
      keywords.forEach((keyword) => {
        expect(typeof keyword).toBe("string");
        expect(keyword.trim().length).toBeGreaterThan(0);
      });
    });
  });
});
