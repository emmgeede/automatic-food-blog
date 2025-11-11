import type { APIRoute } from "astro";
import {
  addComment,
  isValidEmail,
  sanitizeInput,
  type CommentSubmission,
} from "../../../utils/comments";

// Verify hCaptcha token
async function verifyHCaptcha(token: string, secret: string): Promise<boolean> {
  try {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `response=${token}&secret=${secret}`,
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("hCaptcha verification error:", error);
    return false;
  }
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (
      !data.recipeUuid ||
      !data.name ||
      !data.email ||
      !data.message ||
      !data.rating ||
      !data.captchaToken
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Alle Felder sind erforderlich.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate email
    if (!isValidEmail(data.email)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Bitte geben Sie eine gültige E-Mail-Adresse ein.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate rating (1-5)
    const rating = parseInt(data.rating);
    if (isNaN(rating) || rating < 1 || rating > 5) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Die Bewertung muss zwischen 1 und 5 Sternen liegen.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify hCaptcha
    const hCaptchaSecret = import.meta.env.HCAPTCHA_SECRET_KEY;
    if (!hCaptchaSecret) {
      console.error("HCAPTCHA_SECRET_KEY is not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Captcha-Konfigurationsfehler.",
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const captchaValid = await verifyHCaptcha(data.captchaToken, hCaptchaSecret);
    if (!captchaValid) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Captcha-Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Sanitize inputs
    const submission: Omit<CommentSubmission, "captchaToken"> = {
      recipeUuid: data.recipeUuid,
      name: sanitizeInput(data.name.trim()),
      email: data.email.trim().toLowerCase(),
      message: sanitizeInput(data.message.trim()),
      rating: rating,
    };

    // Add comment to storage
    const comment = await addComment(submission);

    return new Response(
      JSON.stringify({
        success: true,
        comment: {
          id: comment.id,
          name: comment.name,
          message: comment.message,
          rating: comment.rating,
          createdAt: comment.createdAt,
        },
      }),
      { status: 201, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error submitting comment:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
