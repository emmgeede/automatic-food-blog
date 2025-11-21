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
  console.log('Delete comment request received');
  console.log('Method:', req.method);
  console.log('URL:', req.url);

  if (req.method !== 'DELETE') {
    console.error('Method not allowed:', req.method);
    return new Response('Method not allowed', { status: 405 });
  }

  // Check authentication
  const cookie = req.headers.get('cookie');
  if (!verifyAdminToken(cookie)) {
    console.error('Unauthorized - invalid admin token');
    return new Response('Unauthorized', { status: 401 });
  }

  // Get comment ID from path
  const url = new URL(req.url);
  console.log('Full pathname:', url.pathname);
  const pathParts = url.pathname.split('/');
  console.log('Path parts:', pathParts);
  const commentId = pathParts[pathParts.length - 1];
  console.log('Extracted comment ID:', commentId);

  if (!commentId || commentId === '') {
    console.error('Missing comment ID');
    return new Response('Missing comment ID', { status: 400 });
  }

  const remark42Url = process.env.PUBLIC_REMARK42_URL || 'https://comments.die-mama-kocht.de';
  const adminSecret = process.env.REMARK_ADMIN_SECRET;

  console.log('Remark42 URL:', remark42Url);
  console.log('Admin secret configured:', !!adminSecret);

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
    console.log('Delete URL:', deleteUrl);

    const jwt = await createAdminJWT(adminSecret);
    console.log('JWT created, length:', jwt.length);

    console.log('Sending DELETE request to Remark42...');
    console.log('JWT header (first 50 chars):', jwt.substring(0, 50) + '...');

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'X-JWT': jwt,
        'Content-Type': 'application/json',
      },
    });

    console.log('Remark42 response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to delete comment:', response.status, error);
      return new Response(JSON.stringify({ error: 'Failed to delete comment', details: error }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('Comment deleted successfully');

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

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: 'food-blog',
    exp: now + (60 * 5), // 5 minutes
    nbf: now, // Not before
    iat: now, // Issued at
    handshake: {
      id: 'admin',
      provider: 'admin',
    },
  };

  console.log('JWT payload:', JSON.stringify(payload));

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
