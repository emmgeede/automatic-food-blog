import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

interface StoredRating {
  rating: number;
  timestamp: number;
  userHash: string;
}

export default async (req: Request, context: Context) => {
  // Only allow GET
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const url = new URL(req.url);
    const recipeSlug = url.searchParams.get("recipeSlug");

    // Validation
    if (!recipeSlug) {
      return new Response(
        JSON.stringify({ message: "Recipe slug is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get the ratings store
    const ratingsStore = getStore("ratings");

    // Get existing ratings for this recipe
    const existingRatingsJson = await ratingsStore.get(`${recipeSlug}`, {
      type: "text",
    });

    let ratings: StoredRating[] = [];
    if (existingRatingsJson) {
      ratings = JSON.parse(existingRatingsJson);
    }

    // Calculate aggregated data
    const aggregatedData = calculateAggregatedRating(ratings);

    return new Response(JSON.stringify(aggregatedData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching rating:", error);
    return new Response(
      JSON.stringify({
        message: "Fehler beim Abrufen der Bewertung",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Calculate aggregated rating data
function calculateAggregatedRating(ratings: StoredRating[]) {
  const totalRatings = ratings.length;

  if (totalRatings === 0) {
    return {
      averageRating: 0,
      totalRatings: 0,
      ratings: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    };
  }

  const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
  const averageRating = sum / totalRatings;

  const ratingCounts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  ratings.forEach((r) => {
    ratingCounts[r.rating.toString() as keyof typeof ratingCounts]++;
  });

  return {
    averageRating,
    totalRatings,
    ratings: ratingCounts,
  };
}
