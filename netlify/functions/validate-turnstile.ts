import type { Context } from "@netlify/functions";

interface TurnstileValidationRequest {
  token: string;
}

interface CloudflareResponse {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  "error-codes"?: string[];
  action?: string;
  cdata?: string;
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
    const body: TurnstileValidationRequest = await req.json();
    const { token } = body;

    if (!token) {
      return new Response(
        JSON.stringify({ success: false, message: "Token is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get secret key from environment
    const secretKey = process.env.TURNSTILE_SECRET_KEY;

    if (!secretKey) {
      console.error("TURNSTILE_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Server configuration error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate with Cloudflare Turnstile API
    const formData = new FormData();
    formData.append("secret", secretKey);
    formData.append("response", token);

    // Optional: Include visitor's IP for better validation
    const visitorIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (visitorIP !== "unknown") {
      formData.append("remoteip", visitorIP);
    }

    const cloudflareResponse = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
      }
    );

    if (!cloudflareResponse.ok) {
      console.error(
        "Cloudflare API error:",
        cloudflareResponse.status,
        cloudflareResponse.statusText
      );
      return new Response(
        JSON.stringify({
          success: false,
          message: "Cloudflare API error",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const result: CloudflareResponse = await cloudflareResponse.json();

    if (result.success) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Validation successful",
          timestamp: result.challenge_ts,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } else {
      console.warn("Turnstile validation failed:", result["error-codes"]);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Validation failed",
          errors: result["error-codes"] || ["unknown-error"],
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Error validating Turnstile token:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Server error during validation",
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
