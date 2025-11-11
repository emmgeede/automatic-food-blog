/**
 * Script to add UUIDs to existing recipe markdown files
 * Run with: node scripts/add-uuids-to-recipes.js
 */

import { readFile, writeFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const BLOG_DIR = join(process.cwd(), "src", "content", "blog");

/**
 * Parse frontmatter from a markdown file
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error("No frontmatter found");
  }

  return {
    frontmatter: match[1],
    content: match[2],
  };
}

/**
 * Check if frontmatter already has a UUID
 */
function hasUuid(frontmatter) {
  return /^uuid:/m.test(frontmatter);
}

/**
 * Add UUID to frontmatter (as the first field)
 */
function addUuidToFrontmatter(frontmatter) {
  const uuid = randomUUID();
  return `uuid: ${uuid}\n${frontmatter}`;
}

/**
 * Process a single recipe file
 */
async function processRecipeFile(filename) {
  const filePath = join(BLOG_DIR, filename);

  try {
    // Read file
    const content = await readFile(filePath, "utf-8");

    // Parse frontmatter
    const { frontmatter, content: bodyContent } = parseFrontmatter(content);

    // Check if UUID already exists
    if (hasUuid(frontmatter)) {
      console.log(`✓ ${filename} already has a UUID, skipping...`);
      return { filename, status: "skipped", uuid: null };
    }

    // Add UUID
    const updatedFrontmatter = addUuidToFrontmatter(frontmatter);

    // Reconstruct file
    const updatedContent = `---\n${updatedFrontmatter}\n---\n${bodyContent}`;

    // Write back to file
    await writeFile(filePath, updatedContent, "utf-8");

    // Extract UUID for reporting
    const uuidMatch = updatedFrontmatter.match(/^uuid: (.+)$/m);
    const uuid = uuidMatch ? uuidMatch[1] : null;

    console.log(`✓ ${filename} - Added UUID: ${uuid}`);
    return { filename, status: "updated", uuid };
  } catch (error) {
    console.error(`✗ ${filename} - Error: ${error.message}`);
    return { filename, status: "error", error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  console.log("Starting UUID generation for recipes...\n");

  try {
    // Get all markdown files in the blog directory
    const files = await readdir(BLOG_DIR);
    const markdownFiles = files.filter((file) => file.endsWith(".md"));

    console.log(`Found ${markdownFiles.length} recipe files\n`);

    // Process each file
    const results = await Promise.all(
      markdownFiles.map((file) => processRecipeFile(file))
    );

    // Summary
    const updated = results.filter((r) => r.status === "updated").length;
    const skipped = results.filter((r) => r.status === "skipped").length;
    const errors = results.filter((r) => r.status === "error").length;

    console.log("\n" + "=".repeat(50));
    console.log("Summary:");
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Errors: ${errors}`);
    console.log("=".repeat(50));

    if (errors > 0) {
      console.log("\nSome files had errors. Please check the output above.");
      process.exit(1);
    }

    console.log("\n✓ All recipes processed successfully!");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
