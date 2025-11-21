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

  // Get comment ID from path and URL from query parameter
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

  // Get post URL from query parameter
  const postUrl = url.searchParams.get('url');
  console.log('Post URL:', postUrl);

  if (!postUrl) {
    console.error('Missing post URL');
    return new Response(JSON.stringify({ error: 'Missing post URL' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const remark42Url = process.env.PUBLIC_REMARK42_URL || 'https://comments.die-mama-kocht.de';
  const adminPassword = process.env.REMARK_ADMIN_PASSWD;

  console.log('Remark42 URL:', remark42Url);
  console.log('Admin password configured:', !!adminPassword);

  if (!adminPassword) {
    console.error('REMARK_ADMIN_PASSWD not configured');
    return new Response(JSON.stringify({ error: 'Admin password not configured' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Delete comment via Remark42 Admin API using Basic Auth
    const deleteUrl = `${remark42Url}/api/v1/admin/comment/${commentId}?site=food-blog&url=${encodeURIComponent(postUrl)}`;
    console.log('Delete URL:', deleteUrl);

    // Create Basic Auth header
    const credentials = Buffer.from(`admin:${adminPassword}`).toString('base64');
    console.log('Using Basic Auth with username: admin');

    console.log('Sending DELETE request to Remark42...');

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Basic ${credentials}`,
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
