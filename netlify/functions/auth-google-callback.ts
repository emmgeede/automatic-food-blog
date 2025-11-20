import type { Context } from "@netlify/functions";

const ALLOWED_EMAILS = ['foofourtyone@gmail.com']; // Only this email can access admin

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (!code) {
    return new Response('Missing authorization code', { status: 400 });
  }

  const googleClientId = process.env.AUTH_GOOGLE_CID;
  const googleClientSecret = process.env.AUTH_GOOGLE_CSEC;
  const siteUrl = process.env.URL || 'https://die-mama-kocht.de';
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  if (!googleClientId || !googleClientSecret) {
    return new Response('Google OAuth not configured', { status: 500 });
  }

  try {
    // Exchange code for token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: googleClientId,
        client_secret: googleClientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Token exchange failed:', error);
      return new Response('OAuth token exchange failed', { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return new Response('Failed to get user info', { status: 500 });
    }

    const userData = await userResponse.json();
    const userEmail = userData.email;

    // Check if user is allowed
    if (!ALLOWED_EMAILS.includes(userEmail)) {
      return new Response(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Unauthorized</title>
            <style>
              body { font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f3f4f6; }
              .error { background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
              h1 { color: #ef4444; }
              p { color: #6b7280; }
              a { color: #06b6d4; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="error">
              <h1>Zugriff verweigert</h1>
              <p>Du bist nicht berechtigt, auf den Admin-Bereich zuzugreifen.</p>
              <p>Email: ${userEmail}</p>
              <p><a href="/">Zurück zur Startseite</a></p>
            </div>
          </body>
        </html>
      `, {
        status: 403,
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Create a simple JWT-like token (for simplicity, we'll just use base64 encoded data)
    // In production, you'd want to use proper JWT signing
    const adminToken = Buffer.from(JSON.stringify({
      email: userEmail,
      name: userData.name,
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000), // 7 days
    })).toString('base64');

    // Set cookie and redirect to admin
    return new Response(null, {
      status: 302,
      headers: {
        'Location': '/admin/',
        'Set-Cookie': `admin_token=${adminToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`,
      },
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response('Authentication failed', { status: 500 });
  }
};
