import type { Context } from "@netlify/functions";

interface NewsletterSubscription {
  email: string;
}

interface BrevoErrorResponse {
  code: string;
  message: string;
}

// Brevo Newsletter Liste ID - anpassen falls nötig
const BREVO_LIST_ID = 2;

export default async (req: Request, context: Context) => {
  // CORS headers for all responses
  const corsHeaders = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ message: "Method not allowed" }), {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    // Parse request body
    let email: string;

    // Support both JSON and form data
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body: NewsletterSubscription = await req.json();
      email = body.email;
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      email = formData.get("email") as string;
    } else {
      // Try JSON as fallback
      const body: NewsletterSubscription = await req.json();
      email = body.email;
    }

    // Validation
    if (!email) {
      return new Response(
        JSON.stringify({ message: "E-Mail-Adresse ist erforderlich", success: false }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ message: "Ungültige E-Mail-Adresse", success: false }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Get Brevo API key from environment
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY not configured in environment variables");
      return new Response(
        JSON.stringify({ message: "Newsletter-Service nicht konfiguriert", success: false }),
        { status: 500, headers: corsHeaders }
      );
    }

    console.log(`Newsletter subscription attempt for: ${email}`);

    // Create contact directly using the simple contacts API
    // This adds the contact to the list immediately
    const contactPayload = {
      email: email,
      listIds: [BREVO_LIST_ID],
      updateEnabled: true, // Update if contact already exists
      attributes: {
        QUELLE: "Website Footer",
        ANMELDEDATUM: new Date().toISOString().split('T')[0],
      },
    };

    console.log("Sending to Brevo API:", JSON.stringify(contactPayload));

    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
        "accept": "application/json",
      },
      body: JSON.stringify(contactPayload),
    });

    const responseText = await brevoResponse.text();
    console.log(`Brevo API response status: ${brevoResponse.status}`);
    console.log(`Brevo API response body: ${responseText}`);

    // Handle Brevo API response
    if (!brevoResponse.ok) {
      let errorData: BrevoErrorResponse;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { code: "unknown", message: responseText };
      }

      console.error("Brevo API error:", errorData);

      // Check for duplicate contact - this is actually success for us
      if (errorData.code === "duplicate_parameter" ||
          errorData.message?.includes("Contact already exist")) {
        return new Response(
          JSON.stringify({
            message: "Diese E-Mail-Adresse ist bereits für den Newsletter registriert.",
            success: true, // Consider this a success
          }),
          { status: 200, headers: corsHeaders }
        );
      }

      // Return detailed error for debugging
      return new Response(
        JSON.stringify({
          message: `Newsletter-Anmeldung fehlgeschlagen: ${errorData.message || 'Unbekannter Fehler'}`,
          success: false,
          debug: errorData,
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    // Success response
    console.log(`Newsletter subscription successful for: ${email}`);
    return new Response(
      JSON.stringify({
        message: "Vielen Dank! Sie wurden erfolgreich für den Newsletter angemeldet.",
        success: true,
      }),
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return new Response(
      JSON.stringify({
        message: `Ein Fehler ist aufgetreten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`,
        success: false,
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};
