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
  console.log('Reply to comment request received');
  console.log('Method:', req.method);

  if (req.method !== 'POST') {
    console.error('Method not allowed:', req.method);
    return new Response('Method not allowed', { status: 405 });
  }

  // Check authentication
  const cookie = req.headers.get('cookie');
  if (!verifyAdminToken(cookie)) {
    console.error('Unauthorized - invalid admin token');
    return new Response('Unauthorized', { status: 401 });
  }

  // Try to extract Remark42 JWT token from cookies (preferred - posts as Ingrid)
  // Remark42 JWT cookie format can be "REMARK42-JWT" or "REMARK42-JWT.food-blog"
  let remark42JWT: string | undefined;
  if (cookie) {
    // Try to find any cookie starting with REMARK42-JWT
    const jwtMatch = cookie.match(/REMARK42-JWT[^=]*=([^;]+)/);
    remark42JWT = jwtMatch?.[1];
  }

  const useJWT = !!remark42JWT;

  console.log('All cookies:', cookie);
  console.log('Remark42 JWT found:', useJWT);
  if (useJWT) {
    console.log('JWT token (first 20 chars):', remark42JWT?.substring(0, 20));
    console.log('Will post as logged-in user (Ingrid Hartmann)');
  } else {
    console.log('No Remark42 JWT - will post using Basic Auth (admin)');
  }

  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch (error) {
    console.error('Invalid JSON body:', error);
    return new Response(JSON.stringify({ error: 'Invalid request body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { commentId, text, url } = body;

  console.log('Parent comment ID:', commentId);
  console.log('Reply text length:', text?.length);
  console.log('Post URL:', url);

  if (!commentId) {
    console.error('Missing parent comment ID');
    return new Response(JSON.stringify({ error: 'Missing parent comment ID' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!text || text.trim() === '') {
    console.error('Missing reply text');
    return new Response(JSON.stringify({ error: 'Missing reply text' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!url) {
    console.error('Missing post URL');
    return new Response(JSON.stringify({ error: 'Missing post URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const remark42Url = process.env.PUBLIC_REMARK42_URL || 'https://comments.die-mama-kocht.de';
  const adminPassword = process.env.REMARK_ADMIN_PASSWD;

  console.log('Remark42 URL:', remark42Url);

  // Only check admin password if we need Basic Auth fallback
  if (!useJWT && !adminPassword) {
    console.error('REMARK_ADMIN_PASSWD not configured and no JWT token available');
    return new Response(JSON.stringify({ error: 'Authentication not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Post reply via Remark42 API
    const postUrl = `${remark42Url}/api/v1/comment`;
    console.log('Post URL:', postUrl);

    // Create request body for Remark42
    const requestBody = {
      text: text.trim(),
      locator: {
        site: 'food-blog',
        url: url,
      },
      pid: commentId, // Parent comment ID
    };

    console.log('Request body:', JSON.stringify(requestBody));

    // Build headers based on authentication method
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (useJWT) {
      // Use JWT token to post as Ingrid Hartmann
      console.log('Sending POST request with JWT (as Ingrid)...');
      headers['X-JWT'] = remark42JWT!;
    } else {
      // Fallback to Basic Auth (posts as admin)
      console.log('Sending POST request with Basic Auth (as admin)...');
      const credentials = Buffer.from(`admin:${adminPassword}`).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await fetch(postUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    console.log('Remark42 response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to post reply:', response.status, error);
      return new Response(JSON.stringify({ error: 'Failed to post reply', details: error }), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const responseData = await response.json();
    console.log('Reply posted successfully');

    return new Response(JSON.stringify({ success: true, comment: responseData }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error posting reply:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
