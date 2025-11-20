import type { Context } from "@netlify/functions";

export default async (req: Request, context: Context) => {
  console.log('Google OAuth login initiated');

  const googleClientId = process.env.AUTH_GOOGLE_CID;
  const siteUrl = process.env.URL || 'https://die-mama-kocht.de';
  const redirectUri = `${siteUrl}/api/auth/google/callback`;

  console.log('Redirect URI:', redirectUri);

  if (!googleClientId) {
    console.error('AUTH_GOOGLE_CID not configured');
    return new Response('Google OAuth not configured', { status: 500 });
  }

  // Build Google OAuth URL
  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authUrl.searchParams.set('client_id', googleClientId);
  authUrl.searchParams.set('redirect_uri', redirectUri);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('access_type', 'online');

  console.log('Redirecting to Google OAuth:', authUrl.toString());

  // Return HTML redirect page as fallback for browsers that don't follow 302 properly
  const redirectHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta http-equiv="refresh" content="0;url=${authUrl.toString()}">
        <script>window.location.href = "${authUrl.toString()}";</script>
      </head>
      <body>
        <p>Redirecting to Google...</p>
      </body>
    </html>
  `;

  return new Response(redirectHtml, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
    },
  });
};
