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
  if (req.method !== 'DELETE') {
    return new Response('Method not allowed', { status: 405 });
  }

  // Check authentication
  const cookie = req.headers.get('cookie');
  if (!verifyAdminToken(cookie)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get comment ID from path
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/');
  const commentId = pathParts[pathParts.length - 1];

  if (!commentId) {
    return new Response('Missing comment ID', { status: 400 });
  }

  const remark42Url = process.env.PUBLIC_REMARK42_URL || 'https://comments.die-mama-kocht.de';
  const adminSecret = process.env.REMARK_ADMIN_SECRET;

  if (!adminSecret) {
    console.error('REMARK_ADMIN_SECRET not configured');
    return new Response(JSON.stringify({ error: 'Admin secret not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Delete comment via Remark42 Admin API
    const deleteUrl = `${remark42Url}/api/v1/admin/comment/${commentId}?site=food-blog`;
    const jwt = await createAdminJWT(adminSecret);

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'X-JWT': jwt,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to delete comment:', error);
      return new Response(JSON.stringify({ error: 'Failed to delete comment' }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Create a proper admin JWT for Remark42
async function createAdminJWT(secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const payload = {
    aud: 'food-blog',
    exp: Math.floor(Date.now() / 1000) + (60 * 5), // 5 minutes
    handshake: {
      id: 'admin',
      provider: 'admin',
    },
  };

  // Encode header and payload
  const headerB64 = Buffer.from(JSON.stringify(header)).toString('base64url');
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const data = `${headerB64}.${payloadB64}`;

  // Sign with HMAC-SHA256
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const signatureB64 = Buffer.from(signature).toString('base64url');

  return `${data}.${signatureB64}`;
}
