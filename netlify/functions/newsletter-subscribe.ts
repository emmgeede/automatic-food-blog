import type { Context } from "@netlify/functions";

interface NewsletterSubscription {
  email: string;
}

interface BrevoContact {
  email: string;
  listIds?: number[];
  updateEnabled?: boolean;
  attributes?: {
    [key: string]: string | number | boolean;
  };
}

interface BrevoErrorResponse {
  code: string;
  message: string;
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
        JSON.stringify({ message: "E-Mail-Adresse ist erforderlich" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ message: "Ungültige E-Mail-Adresse" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get Brevo API key from environment
    const brevoApiKey = process.env.BREVO_API_KEY;
    if (!brevoApiKey) {
      console.error("BREVO_API_KEY not configured");
      return new Response(
        JSON.stringify({ message: "Newsletter-Service nicht konfiguriert" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Prepare Brevo contact data
    const contactData: BrevoContact = {
      email: email,
      listIds: [2], // Default list ID (adjust as needed)
      updateEnabled: false, // Don't update existing contacts
      attributes: {
        QUELLE: "Website Footer",
        ANMELDEDATUM: new Date().toISOString().split('T')[0],
      },
    };

    // Call Brevo API
    const brevoResponse = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoApiKey,
      },
      body: JSON.stringify({
        email: email,
        includeListIds: [2], // Adjust list ID as needed
        templateId: 1, // Adjust template ID for double opt-in email
        redirectionUrl: "https://die-mama-kocht.de/newsletter-bestaetigung",
        attributes: contactData.attributes,
      }),
    });

    // Handle Brevo API response
    if (!brevoResponse.ok) {
      const errorData: BrevoErrorResponse = await brevoResponse.json();
      console.error("Brevo API error:", errorData);

      // Check for duplicate contact
      if (errorData.code === "duplicate_parameter") {
        return new Response(
          JSON.stringify({
            message: "Diese E-Mail-Adresse ist bereits registriert",
            success: false
          }),
          {
            status: 409,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          message: "Newsletter-Anmeldung fehlgeschlagen. Bitte versuchen Sie es später erneut.",
          success: false
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        message: "Vielen Dank! Bitte bestätigen Sie Ihre Anmeldung über die E-Mail, die wir Ihnen geschickt haben.",
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return new Response(
      JSON.stringify({
        message: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es später erneut.",
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
