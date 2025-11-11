# Comments System - Quick Start

## 5-Minute Setup

### 1. Install Adapter (Choose One)

```bash
# For Node.js deployment
npm install @astrojs/node

# For Vercel
npm install @astrojs/vercel

# For Netlify
npm install @astrojs/netlify
```

### 2. Update astro.config.mjs

Copy from `astro.config.example.mjs` or add:

```javascript
import node from '@astrojs/node';

export default defineConfig({
  output: 'hybrid',
  adapter: node({ mode: 'standalone' }),
  // ... rest of config
});
```

### 3. Get hCaptcha Keys

1. Go to https://www.hcaptcha.com/
2. Sign up (free)
3. Create a new site
4. Copy Site Key and Secret Key

### 4. Create .env File

```bash
PUBLIC_HCAPTCHA_SITE_KEY=your_site_key
HCAPTCHA_SECRET_KEY=your_secret_key
```

### 5. Add UUIDs to Recipes

```bash
node scripts/add-uuids-to-recipes.js
```

### 6. Create Comments Directory

```bash
mkdir -p data/comments
```

### 7. Add to Recipe Page

Edit `src/pages/blog/[slug].astro`:

```astro
---
import Comments from "../../components/Comments.astro";
// ... existing imports
---

<LayoutBlogPost frontmatter={post.data}>
  <Content />
  <Comments recipeUuid={post.data.uuid} />
</LayoutBlogPost>
```

### 8. Test It

```bash
npm run dev
```

Visit a recipe page and try submitting a comment!

## That's It! 🎉

For detailed documentation, see `COMMENTS_SETUP.md`

## Troubleshooting

**Comments not saving?**
- Check that `data/comments/` directory exists
- Verify environment variables are set
- Check browser console for errors

**hCaptcha not showing?**
- Verify `PUBLIC_HCAPTCHA_SITE_KEY` is set
- Check it starts with `PUBLIC_`
- Restart dev server after adding env variables

**Recipe UUID errors?**
- Run `node scripts/add-uuids-to-recipes.js`
- Check that frontmatter has `uuid: ...` field
- Rebuild with `npm run dev`
