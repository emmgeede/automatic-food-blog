import type { Context } from "@netlify/functions";

// Helper to verify admin token and extract user info
function verifyAndExtractUserInfo(cookie: string | undefined): { isAuthenticated: boolean; user?: { name: string; email: string } } {
  if (!cookie) return { isAuthenticated: false };

  try {
    const token = cookie.split('admin_token=')[1]?.split(';')[0];
    if (!token) return { isAuthenticated: false };

    const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
    const isValid = decoded.exp > Date.now();

    if (!isValid) return { isAuthenticated: false };

    return {
      isAuthenticated: true,
      user: {
        name: decoded.name || 'Admin',
        email: decoded.email || '',
      },
    };
  } catch {
    return { isAuthenticated: false };
  }
}

export default async (req: Request, context: Context) => {
  const cookie = req.headers.get('cookie');
  const result = verifyAndExtractUserInfo(cookie);

  console.log('Auth check:', result.isAuthenticated ? 'authenticated' : 'not authenticated');
  if (result.user) {
    console.log('User:', result.user.name, result.user.email);
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};
