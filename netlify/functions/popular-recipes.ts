import { getStore } from "@netlify/blobs";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";

interface RecipeView {
  slug: string;
  views: number;
}

/**
 * Returns the most popular recipes based on view count
 * Includes caching for performance
 */
export const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only allow GET requests
  if (event.httpMethod !== "GET") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
      headers: { "Content-Type": "application/json" },
    };
  }

  try {
    // Parse query parameters
    const limit = parseInt(event.queryStringParameters?.limit || "12", 10);

    // Validate limit
    if (limit < 1 || limit > 50) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Limit must be between 1 and 50" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Get Netlify Blobs store
    const store = getStore({
      name: "recipe-views",
      consistency: "strong",
    });

    // Get all recipe views
    const recipeViews: RecipeView[] = [];

    // List all blobs (recipe slugs)
    const { blobs } = await store.list();

    // Fetch view counts for all recipes
    for (const blob of blobs) {
      const views = (await store.get(blob.key, { type: "json" })) as number | null;
      if (views && views > 0) {
        recipeViews.push({
          slug: blob.key,
          views,
        });
      }
    }

    // Sort by views descending
    recipeViews.sort((a, b) => b.views - a.views);

    // Take top N recipes
    const topRecipes = recipeViews.slice(0, limit);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        recipes: topRecipes,
        total: recipeViews.length,
      }),
      headers: {
        "Content-Type": "application/json",
        // Cache for 5 minutes on CDN
        "Cache-Control": "public, max-age=300, s-maxage=300",
        "CDN-Cache-Control": "max-age=300",
      },
    };
  } catch (error) {
    console.error("Error fetching popular recipes:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        success: false,
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
};

export const config = {
  path: "/api/popular-recipes",
};
