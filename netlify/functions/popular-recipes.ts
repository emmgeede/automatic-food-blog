import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

interface RecipeView {
  slug: string;
  views: number;
}

/**
 * Returns the most popular recipes based on view count
 * Includes caching for performance
 */
export default async (req: Request, context: Context) => {
  // Only allow GET requests
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Parse query parameters
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get("limit") || "12", 10);

    // Validate limit
    if (limit < 1 || limit > 50) {
      return new Response(
        JSON.stringify({ error: "Limit must be between 1 and 50" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
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

    return new Response(
      JSON.stringify({
        success: true,
        recipes: topRecipes,
        total: recipeViews.length,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Cache for 5 minutes on CDN
          "Cache-Control": "public, max-age=300, s-maxage=300",
          "CDN-Cache-Control": "max-age=300",
        },
      }
    );
  } catch (error) {
    console.error("Error fetching popular recipes:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        success: false,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config = {
  path: "/api/popular-recipes",
};
