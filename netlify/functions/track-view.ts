import { getStore } from "@netlify/blobs";
import type { Context } from "@netlify/functions";

interface TrackViewRequest {
  slug: string;
  timestamp: number;
}

// Rate limiting using simple in-memory store (for serverless, resets on cold start)
// In production, consider using Netlify Blobs or Redis for persistent rate limiting
const recentViews = new Map<string, number>();
const RATE_LIMIT_WINDOW = 30 * 60 * 1000; // 30 minutes

/**
 * Tracks page views for recipes
 * GDPR-compliant: No personal data stored, only slug and count
 */
export default async (req: Request, context: Context) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body: TrackViewRequest = await req.json();
    const { slug, timestamp } = body;

    // Validate input
    if (!slug || typeof slug !== "string" || slug.trim() === "") {
      return new Response(JSON.stringify({ error: "Invalid slug" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Basic bot detection (check user agent)
    const userAgent = req.headers.get("user-agent") || "";
    if (/bot|crawler|spider|scraper/i.test(userAgent)) {
      return new Response(JSON.stringify({ success: false, reason: "bot" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Rate limiting: Check if this slug was tracked recently (simple de-duplication)
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    const rateKey = `${slug}:${clientIP}`;
    const lastView = recentViews.get(rateKey);

    if (lastView && Date.now() - lastView < RATE_LIMIT_WINDOW) {
      return new Response(
        JSON.stringify({ success: false, reason: "rate_limited" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update rate limit tracker
    recentViews.set(rateKey, Date.now());

    // Clean up old entries (simple garbage collection)
    if (recentViews.size > 10000) {
      const now = Date.now();
      for (const [key, time] of recentViews.entries()) {
        if (now - time > RATE_LIMIT_WINDOW) {
          recentViews.delete(key);
        }
      }
    }

    // Get Netlify Blobs store
    const store = getStore({
      name: "recipe-views",
      consistency: "strong", // Ensure consistent reads
    });

    // Increment view count
    const currentCount = (await store.get(slug, { type: "json" })) as number | null;
    const newCount = (currentCount || 0) + 1;
    await store.set(slug, JSON.stringify(newCount));

    return new Response(
      JSON.stringify({
        success: true,
        slug,
        views: newCount,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("Error tracking view:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

export const config = {
  path: "/api/track-view",
};
