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

  console.log('Returning OAuth URL:', authUrl.toString());

  // Return the OAuth URL as JSON for the client to handle the redirect
  return new Response(JSON.stringify({ redirectUrl: authUrl.toString() }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
