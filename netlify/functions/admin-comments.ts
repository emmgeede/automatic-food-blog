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

    console.log('Raw API response:', JSON.stringify(data).substring(0, 500));
    console.log('Comments count (before flatten):', data.comments?.length || 0);

    // Flatten the tree structure to a simple list
    const comments = flattenComments(data.comments || []);

    console.log('Comments count (after flatten):', comments.length);
    console.log('Sample comment structure:', comments[0] ? JSON.stringify(comments[0]).substring(0, 300) : 'none');

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

  function flatten(item: any, depth = 0) {
    if (!item) return;

    // Extract the actual comment data (Remark42 wraps it in { comment: {...}, replies: [...] })
    const commentData = item.comment || item;

    // Remark42 uses "replies" not "comments" for nested comments!
    const children = item.replies || commentData.comments || [];

    // Add depth information for better display
    const { comments: _, replies: __, ...flatComment } = commentData;
    flatComment.depth = depth;

    // Add parent indicator if this is a reply
    if (commentData.pid && commentData.pid !== "") {
      flatComment.isReply = true;
      flatComment.parentId = commentData.pid;
    }

    result.push(flatComment);

    // Recursively flatten children (replies)
    if (children && Array.isArray(children) && children.length > 0) {
      console.log(`Comment ${commentData.id} has ${children.length} replies`);
      children.forEach(child => flatten(child, depth + 1));
    }
  }

  comments.forEach(comment => flatten(comment, 0));

  console.log(`Flattened ${result.length} total comments (including replies)`);
  return result;
}
