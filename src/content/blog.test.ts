import { describe, it, expect } from "vitest";
import { glob } from "glob";
import { readFile } from "fs/promises";
import matter from "gray-matter";
import { collections } from "./config";

describe("Blog Posts Content Validation", () => {
  it("should have at least one blog post", async () => {
    const posts = await glob("src/content/blog/*.md");
    expect(posts.length).toBeGreaterThan(0);
  });

  it("all blog posts should have valid frontmatter", async () => {
    const posts = await glob("src/content/blog/*.md");
    const blogSchema = collections.blog.schema;

    for (const postPath of posts) {
      const fileContent = await readFile(postPath, "utf-8");
      const { data } = matter(fileContent);

      // Convert pubDate string to Date if needed
      if (typeof data.pubDate === "string") {
        data.pubDate = new Date(data.pubDate);
      }

      const result = blogSchema.safeParse(data);

      if (!result.success) {
        console.error(`Validation failed for ${postPath}:`, result.error.errors);
      }

      expect(result.success, `${postPath} should have valid frontmatter`).toBe(true);
    }
  });

  it("all blog posts should have unique titles", async () => {
    const posts = await glob("src/content/blog/*.md");
    const titles = new Set<string>();

    for (const postPath of posts) {
      const fileContent = await readFile(postPath, "utf-8");
      const { data } = matter(fileContent);

      expect(titles.has(data.title), `Duplicate title found: ${data.title}`).toBe(false);
      titles.add(data.title);
    }
  });

  it("all blog posts should have content after frontmatter", async () => {
    const posts = await glob("src/content/blog/*.md");

    for (const postPath of posts) {
      const fileContent = await readFile(postPath, "utf-8");
      const { content } = matter(fileContent);

      expect(
        content.trim().length,
        `${postPath} should have content after frontmatter`
      ).toBeGreaterThan(0);
    }
  });

  it("all blog posts should have valid ISO 8601 duration format for prepTime and cookTime", async () => {
    const posts = await glob("src/content/blog/*.md");
    const iso8601DurationRegex = /^PT(?:\d+H)?(?:\d+M)?(?:\d+S)?$/;

    for (const postPath of posts) {
      const fileContent = await readFile(postPath, "utf-8");
      const { data } = matter(fileContent);

      if (data.prepTime) {
        expect(
          iso8601DurationRegex.test(data.prepTime),
          `${postPath} prepTime should be in ISO 8601 format (e.g., PT10M)`
        ).toBe(true);
      }

      if (data.cookTime) {
        expect(
          iso8601DurationRegex.test(data.cookTime),
          `${postPath} cookTime should be in ISO 8601 format (e.g., PT30M)`
        ).toBe(true);
      }
    }
  });

  it("all blog posts should have at least one ingredient", async () => {
    const posts = await glob("src/content/blog/*.md");

    for (const postPath of posts) {
      const fileContent = await readFile(postPath, "utf-8");
      const { data } = matter(fileContent);

      expect(
        data.ingredients?.length,
        `${postPath} should have at least one ingredient`
      ).toBeGreaterThan(0);
    }
  });

  it("all blog posts should have at least one category", async () => {
    const posts = await glob("src/content/blog/*.md");

    for (const postPath of posts) {
      const fileContent = await readFile(postPath, "utf-8");
      const { data } = matter(fileContent);

      expect(
        data.categories?.length,
        `${postPath} should have at least one category`
      ).toBeGreaterThan(0);
    }
  });
});
