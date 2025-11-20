import { getStore } from "@netlify/blobs";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

interface StoredRating {
  rating: number;
  timestamp: number;
  userHash: string;
}

interface AggregatedRating {
  average: number;
  totalRatings: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

async function aggregateRatings() {
  console.log("Starting rating aggregation...");

  // Check if we're in a Netlify environment with Blobs available
  // Blobs are only available in Functions, not during build time
  if (!process.env.NETLIFY) {
    console.log("⚠️  Not in Netlify environment - skipping rating aggregation");
    console.log("   Ratings will be aggregated during deployment on Netlify");
    return;
  }

  try {
    // Try to access Blobs - will throw if not available (e.g., during build)
    const ratingsStore = getStore("ratings");

    // Get all rating keys (recipe slugs)
    const { blobs } = await ratingsStore.list();

    console.log(`Found ${blobs.length} recipes with ratings`);

    // Ensure public/ratings directory exists
    const ratingsDir = join(process.cwd(), "public", "ratings");
    try {
      mkdirSync(ratingsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    for (const blob of blobs) {
      const recipeSlug = blob.key;
      console.log(`Processing ratings for: ${recipeSlug}`);

      const ratingsJson = await ratingsStore.get(recipeSlug, { type: "text" });

      if (!ratingsJson) {
        console.log(`No ratings found for ${recipeSlug}`);
        continue;
      }

      const ratings: StoredRating[] = JSON.parse(ratingsJson);

      // Filter out ratings older than 1 year (optional, for freshness)
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const validRatings = ratings.filter((r) => r.timestamp > oneYearAgo);

      if (validRatings.length === 0) {
        console.log(`No valid ratings for ${recipeSlug}`);
        continue;
      }

      // Calculate aggregated data
      const distribution = {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
      };

      let totalScore = 0;

      validRatings.forEach((rating) => {
        const score = rating.rating;
        distribution[score as keyof typeof distribution]++;
        totalScore += score;
      });

      const aggregated: AggregatedRating = {
        average: totalScore / validRatings.length,
        totalRatings: validRatings.length,
        distribution,
      };

      // Write to public/ratings/{slug}.json
      const outputPath = join(ratingsDir, `${recipeSlug}.json`);
      writeFileSync(outputPath, JSON.stringify(aggregated, null, 2));

      console.log(
        `✓ Aggregated ${validRatings.length} ratings for ${recipeSlug} (avg: ${aggregated.average.toFixed(1)})`
      );
    }

    console.log("Rating aggregation complete!");
  } catch (error) {
    // Check if it's a MissingBlobsEnvironmentError (happens during build)
    if (error instanceof Error && error.message.includes("MissingBlobsEnvironmentError")) {
      console.log("⚠️  Netlify Blobs not available during build - skipping rating aggregation");
      console.log("   Ratings will be available from pre-generated files");
      return; // Don't throw, just skip
    }
    console.error("Error aggregating ratings:", error);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  aggregateRatings().catch((error) => {
    console.error("Failed to aggregate ratings:", error);
    process.exit(1);
  });
}

export { aggregateRatings };
