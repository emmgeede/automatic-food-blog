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

  // Extract Remark42 JWT token from cookies to post as the logged-in user (Ingrid)
  const remark42JWT = cookie?.split('REMARK42-JWT=')[1]?.split(';')[0];
  if (!remark42JWT) {
    console.error('No Remark42 JWT token found - user not logged into Remark42');
    return new Response(JSON.stringify({ error: 'Not logged into Remark42' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
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

  console.log('Remark42 URL:', remark42Url);
  console.log('Using Remark42 JWT token to post as logged-in user');

  try {
    // Post reply via Remark42 API using the user's JWT token (Ingrid)
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
    console.log('Sending POST request to Remark42 with user JWT...');

    const response = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'X-JWT': remark42JWT, // Use Ingrid's JWT token
        'Content-Type': 'application/json',
      },
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
