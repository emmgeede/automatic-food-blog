# Comment System Setup Guide

This guide will walk you through setting up the comment and rating system for your recipe blog.

## Overview

The comment system includes:
- ⭐ Interactive 5-star rating system
- 💬 Comment submission with user verification
- 🔒 hCaptcha spam protection
- 📊 Average rating calculation
- 💾 JSON file-based storage
- 🔗 UUID-based recipe identification

## Prerequisites

- Node.js installed
- Astro project set up (already done)
- hCaptcha account (free tier available)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

No additional dependencies are required as the system uses Node.js built-in modules and browser APIs.

### 2. Set Up hCaptcha

1. Go to [hCaptcha](https://www.hcaptcha.com/) and create a free account
2. Create a new site in your hCaptcha dashboard
3. Copy your **Site Key** and **Secret Key**

### 3. Configure Environment Variables

Create a `.env` file in your project root (if it doesn't exist):

```bash
# Public key (visible in browser)
PUBLIC_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key_here

# Secret key (server-side only)
HCAPTCHA_SECRET_KEY=your_hcaptcha_secret_key_here
```

**Important:** Add `.env` to your `.gitignore` to keep your secret key safe!

### 4. Add UUIDs to Existing Recipes

Run the UUID generation script to add unique identifiers to all existing recipes:

```bash
node scripts/add-uuids-to-recipes.js
```

This script will:
- Add a UUID field to each recipe's frontmatter
- Skip recipes that already have UUIDs
- Report on the progress

**For new recipes:** Always include a UUID in the frontmatter. You can generate one using:

```javascript
// In Node.js
import { randomUUID } from "crypto";
console.log(randomUUID());
```

Or online at: https://www.uuidgenerator.net/

### 5. Create Data Directory

The comments will be stored in JSON files. Create the directory structure:

```bash
mkdir -p data/comments
```

**Important:** Add the `data/` directory to your `.gitignore` if you don't want to commit user comments to your repository:

```
# .gitignore
data/
```

If you want to version control comments, you can keep them in git.

### 6. Update Your Recipe Pages

Add the Comments component to your recipe pages. Edit `src/pages/blog/[slug].astro`:

```astro
---
import { getCollection } from "astro:content";
import LayoutBlogPost from "../../layouts/layoutBlogPost.astro";
import Comments from "../../components/Comments.astro";

export async function getStaticPaths() {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content } = await post.render();
---

<LayoutBlogPost frontmatter={post.data}>
  <Content />

  <!-- Add the Comments component -->
  <Comments recipeUuid={post.data.uuid} />
</LayoutBlogPost>
```

### 7. Configure Astro for API Routes

Ensure your Astro configuration supports API routes. Update `astro.config.mjs`:

```javascript
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },
  output: "server", // or "hybrid" for mixed static/dynamic pages
  adapter: /* your adapter here, e.g., node(), vercel(), netlify() */,
});
```

**Note:** The comment system requires server-side rendering for the API routes. You'll need to choose an adapter:

- **Node.js:** `@astrojs/node`
- **Vercel:** `@astrojs/vercel/serverless`
- **Netlify:** `@astrojs/netlify/functions`
- **Cloudflare:** `@astrojs/cloudflare`

Install your chosen adapter:

```bash
# Example for Node.js
npm install @astrojs/node

# Example for Vercel
npm install @astrojs/vercel
```

Then update your config:

```javascript
import node from "@astrojs/node";

export default defineConfig({
  // ...
  output: "server", // or "hybrid"
  adapter: node({
    mode: "standalone"
  }),
});
```

### 8. Build and Test

Start the development server:

```bash
npm run dev
```

Navigate to a recipe page and test:
1. Fill out the comment form
2. Select a star rating
3. Complete the hCaptcha
4. Submit the comment
5. Verify the comment appears in the list

## File Structure

After setup, your project will have:

```
automatic-food-blog/
├── src/
│   ├── components/
│   │   ├── Comments.astro           # Main component to use
│   │   ├── CommentForm.astro        # Form with hCaptcha
│   │   ├── CommentList.astro        # Display existing comments
│   │   └── StarRating.astro         # Star rating component
│   ├── pages/
│   │   ├── api/
│   │   │   └── comments/
│   │   │       ├── submit.ts        # Submit comment endpoint
│   │   │       └── [recipeUuid].ts  # Fetch comments endpoint
│   │   └── blog/
│   │       └── [slug].astro         # Recipe page
│   ├── utils/
│   │   └── comments.ts              # Utility functions
│   └── content/
│       ├── config.ts                # Updated with uuid field
│       └── blog/                    # Recipe markdown files
├── data/
│   └── comments/                    # JSON files (one per recipe)
│       └── {uuid}.json
├── scripts/
│   └── add-uuids-to-recipes.js     # UUID generation script
└── .env                             # Environment variables
```

## Usage in Recipe Pages

### Basic Usage

```astro
---
import Comments from "../components/Comments.astro";
---

<Comments recipeUuid={post.data.uuid} />
```

### Using Individual Components

If you need more control, you can use the components separately:

```astro
---
import CommentForm from "../components/CommentForm.astro";
import CommentList from "../components/CommentList.astro";
---

<!-- Display comments first -->
<CommentList recipeUuid={post.data.uuid} />

<!-- Then the form -->
<CommentForm recipeUuid={post.data.uuid} />
```

### Using the Star Rating Component Alone

```astro
---
import StarRating from "../components/StarRating.astro";
---

<!-- Read-only display -->
<StarRating rating={4.5} size="md" />

<!-- Interactive (for forms) -->
<StarRating interactive={true} size="lg" name="rating" />
```

## Comment Data Structure

Comments are stored in `data/comments/{uuid}.json` with this structure:

```json
[
  {
    "id": "comment-uuid",
    "recipeUuid": "recipe-uuid",
    "name": "User Name",
    "email": "user@example.com",
    "message": "Great recipe!",
    "rating": 5,
    "createdAt": "2025-11-10T10:30:00.000Z",
    "approved": true
  }
]
```

## API Endpoints

### GET `/api/comments/{recipeUuid}`

Fetches approved comments for a recipe.

**Response:**
```json
{
  "success": true,
  "comments": [...],
  "rating": {
    "average": 4.5,
    "count": 10
  }
}
```

### POST `/api/comments/submit`

Submits a new comment.

**Request:**
```json
{
  "recipeUuid": "recipe-uuid",
  "name": "User Name",
  "email": "user@example.com",
  "message": "Comment text",
  "rating": 5,
  "captchaToken": "hcaptcha-token"
}
```

**Response:**
```json
{
  "success": true,
  "comment": {
    "id": "comment-uuid",
    "name": "User Name",
    "message": "Comment text",
    "rating": 5,
    "createdAt": "2025-11-10T10:30:00.000Z"
  }
}
```

## Customization

### Styling

All components use Tailwind CSS with your custom theme. To customize:

1. **Colors:** Defined in `src/styles/global.css` using the `@theme` directive
2. **Component styles:** Edit the respective `.astro` files
3. **Form layout:** Modify `CommentForm.astro`
4. **Comment cards:** Modify `CommentList.astro`

### Moderation

By default, comments are auto-approved. To add moderation:

1. Edit `src/utils/comments.ts`
2. Change `approved: true` to `approved: false` in `addComment()`
3. Create an admin interface to approve comments
4. Update `getApprovedComments()` to filter by approval status

### Email Notifications

To add email notifications when comments are submitted:

1. Install a mail service (e.g., Nodemailer)
2. Add email sending to `src/pages/api/comments/submit.ts`
3. Configure SMTP settings in `.env`

## Troubleshooting

### Comments not appearing

- Check browser console for errors
- Verify the API endpoints are accessible
- Ensure `data/comments/` directory exists and is writable
- Check that UUIDs are present in recipe frontmatter

### hCaptcha not loading

- Verify `PUBLIC_HCAPTCHA_SITE_KEY` is set correctly
- Check browser console for errors
- Ensure the hCaptcha script is loading (check Network tab)

### API routes not working

- Ensure your Astro config has `output: "server"` or `output: "hybrid"`
- Verify an adapter is installed and configured
- Check server logs for errors

### UUID validation errors

- Run `node scripts/add-uuids-to-recipes.js` to add UUIDs
- Ensure all recipes have valid UUIDs in frontmatter
- UUIDs must be in the format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

## Security Considerations

1. **Email Privacy:** Email addresses are not exposed in the public API
2. **XSS Protection:** User input is sanitized using `sanitizeInput()`
3. **CAPTCHA:** hCaptcha prevents spam and bot submissions
4. **Email Validation:** Email format is validated server-side
5. **Rate Limiting:** Consider adding rate limiting for production

## Production Deployment

Before deploying:

1. ✅ Ensure `.env` is in `.gitignore`
2. ✅ Set environment variables in your hosting platform
3. ✅ Create `data/comments/` directory on the server
4. ✅ Ensure the directory has write permissions
5. ✅ Test comment submission and display
6. ✅ Consider adding rate limiting
7. ✅ Set up backups for the `data/comments/` directory

## Support

For issues or questions:
- Check the Astro documentation: https://docs.astro.build
- hCaptcha docs: https://docs.hcaptcha.com
- Review component code and comments for implementation details

## License

This comment system is part of your Astro project and follows the same license.
