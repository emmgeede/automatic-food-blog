import type { Context } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

interface RatingSubmission {
  recipeSlug: string;
  rating: number;
}

interface StoredRating {
  rating: number;
  timestamp: number;
  userHash: string;
}

export default async (req: Request, context: Context) => {
  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body: RatingSubmission = await req.json();
    const { recipeSlug, rating } = body;

    // Validation
    if (!recipeSlug || !rating) {
      return new Response(
        JSON.stringify({ message: "Recipe slug and rating are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({ message: "Rating must be between 1 and 5" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get user hash (simple IP-based to prevent multiple ratings)
    const userIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
    const userHash = await hashString(userIP + recipeSlug);

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

    // Check if user already rated (permanent check)
    const existingRating = ratings.find((r) => r.userHash === userHash);

    if (existingRating) {
      return new Response(
        JSON.stringify({
          message: "Du hast dieses Rezept bereits bewertet.",
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Add new rating
    const newRating: StoredRating = {
      rating,
      timestamp: Date.now(),
      userHash,
    };

    ratings.push(newRating);

    // Save updated ratings
    await ratingsStore.set(`${recipeSlug}`, JSON.stringify(ratings));

    return new Response(
      JSON.stringify({
        message: "Bewertung erfolgreich gespeichert",
        rating: newRating,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error saving rating:", error);
    return new Response(
      JSON.stringify({
        message: "Fehler beim Speichern der Bewertung",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

// Simple hash function for user identification
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
