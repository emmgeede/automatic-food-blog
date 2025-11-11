import type { APIRoute } from "astro";
import { getApprovedComments, getAverageRating } from "../../../utils/comments";

export const GET: APIRoute = async ({ params }) => {
  try {
    const { recipeUuid } = params;

    if (!recipeUuid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Rezept-UUID ist erforderlich.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get approved comments
    const comments = await getApprovedComments(recipeUuid);

    // Get average rating
    const rating = await getAverageRating(recipeUuid);

    // Remove email addresses from response for privacy
    const publicComments = comments.map((comment) => ({
      id: comment.id,
      name: comment.name,
      message: comment.message,
      rating: comment.rating,
      createdAt: comment.createdAt,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        comments: publicComments,
        rating: rating,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error fetching comments:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Fehler beim Abrufen der Kommentare.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
