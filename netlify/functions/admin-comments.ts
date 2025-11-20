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
  // Check authentication
  const cookie = req.headers.get('cookie');
  if (!verifyAdminToken(cookie)) {
    return new Response('Unauthorized', { status: 401 });
  }

  const remark42Url = process.env.PUBLIC_REMARK42_URL || 'https://comments.die-mama-kocht.de';

  try {
    // Fetch all comments from Remark42
    // Using the public API to get comments for all pages
    const siteUrl = 'https://die-mama-kocht.de';

    // Get list of all blog post URLs
    // For now, we'll use a find endpoint that gets recent comments
    const apiUrl = `${remark42Url}/api/v1/find?site=food-blog&format=tree&sort=-time&limit=1000`;

    const response = await fetch(apiUrl);

    if (!response.ok) {
      console.error('Failed to fetch comments:', await response.text());
      return new Response(JSON.stringify({ error: 'Failed to fetch comments' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();

    // Flatten the tree structure to a simple list
    const comments = flattenComments(data.comments || []);

    return new Response(JSON.stringify({ comments }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Helper to flatten nested comment tree
function flattenComments(comments: any[]): any[] {
  const result: any[] = [];

  function flatten(comment: any) {
    // Add the comment (without children) to result
    const { comments: children, ...commentData } = comment;
    result.push(commentData);

    // Recursively flatten children
    if (children && Array.isArray(children)) {
      children.forEach(flatten);
    }
  }

  comments.forEach(flatten);
  return result;
}
