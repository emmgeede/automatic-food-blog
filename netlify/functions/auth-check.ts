import type { Context } from "@netlify/functions";

// Helper to verify admin token
function verifyAdminToken(cookie: string | undefined): boolean {
  if (!cookie) return false;

  try {
    const token = cookie.split('admin_token=')[1]?.split(';')[0];
    if (!token) return false;

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    return decoded.exp > Date.now();
  } catch {
    return false;
  }
}

export default async (req: Request, context: Context) => {
  const cookie = req.headers.get('cookie');
  const isAuthenticated = verifyAdminToken(cookie);

  console.log('Auth check:', isAuthenticated ? 'authenticated' : 'not authenticated');

  return new Response(JSON.stringify({ isAuthenticated }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
