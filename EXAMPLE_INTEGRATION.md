# Example Integration

This file shows exactly how to integrate the comment system into your recipe pages.

## Current Recipe Page Structure

Your current `src/pages/blog/[slug].astro` looks like this:

```astro
---
import { getCollection } from "astro:content";
import LayoutBlogPost from "../../layouts/layoutBlogPost.astro";

export const getStaticPaths = async () => {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
};

const { post } = Astro.props;
const { Content } = await post.render();
---

<LayoutBlogPost frontmatter={post.data}>
  <Content />
</LayoutBlogPost>
```

## Updated with Comments

Simply add the Comments component:

```astro
---
import { getCollection } from "astro:content";
import LayoutBlogPost from "../../layouts/layoutBlogPost.astro";
import Comments from "../../components/Comments.astro"; // ← Add this import

export const getStaticPaths = async () => {
  const posts = await getCollection("blog");
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
};

const { post } = Astro.props;
const { Content } = await post.render();
---

<LayoutBlogPost frontmatter={post.data}>
  <Content />

  <!-- Add the comments section -->
  <Comments recipeUuid={post.data.uuid} /> <!-- ← Add this line -->
</LayoutBlogPost>
```

That's it! The Comments component will render both the comment list and the form.

## Example Recipe Frontmatter

After running the UUID script, your recipe markdown files will look like this:

```markdown
---
uuid: 550e8400-e29b-41d4-a716-446655440000  # ← Added by script
title: "Hähnchen mit Reis"
description: "Ein leckeres und einfaches Rezept..."
metaTitle: "Hähnchen mit Reis - Einfaches Rezept"
metaDescription: "Entdecken Sie unser einfaches Rezept..."
pubDate: 2025-11-02
heroImage: "https://example.com/image.jpg"
categories:
  - "Hauptgerichte"
  - "Hähnchen"
keywords:
  - "Hähnchen"
  - "Reis"
ingredients:
  - "400 g Hähnchenbrustfilet"
  - "200 g Reis"
  - "1 Zwiebel"
nutrition:
  servings: "4 servings"
  calories: "232 kcal"
  carbohydrates: "31.2 g"
  protein: "8.6 g"
  fat: "7.9 g"
prepTime: "PT10M"
cookTime: "PT30M"
---

## Zubereitung

**Schritt 1:** Prepare the chicken...

**Schritt 2:** Cook the rice...
```

## Visual Layout

After integration, your recipe page will display:

```
┌─────────────────────────────────────┐
│   Recipe Title & Hero Image         │
│   Recipe Content                     │
│   Instructions                       │
├─────────────────────────────────────┤
│                                      │
│   COMMENTS (5)                       │
│   Average Rating: 4.5 ⭐⭐⭐⭐⭐      │
│                                      │
│   ┌───────────────────────────┐    │
│   │ User Name          ⭐⭐⭐⭐⭐│    │
│   │ Nov 10, 2025               │    │
│   │ Great recipe! Very easy... │    │
│   └───────────────────────────┘    │
│                                      │
│   ┌───────────────────────────┐    │
│   │ Another User       ⭐⭐⭐⭐⭐│    │
│   │ Nov 9, 2025                │    │
│   │ Delicious! My family...    │    │
│   └───────────────────────────┘    │
│                                      │
├─────────────────────────────────────┤
│                                      │
│   RATE AND COMMENT                   │
│                                      │
│   Name: [____________]               │
│   Email: [___________]               │
│   Rating: ⭐⭐⭐⭐⭐ (click to rate)  │
│   Message: [______________]          │
│            [______________]          │
│   [hCaptcha]                         │
│   [Submit Comment Button]            │
│                                      │
└─────────────────────────────────────┘
```

## Alternative: Separate Components

If you want more control over the layout, use the components separately:

```astro
---
import CommentList from "../../components/CommentList.astro";
import CommentForm from "../../components/CommentForm.astro";
---

<LayoutBlogPost frontmatter={post.data}>
  <Content />

  <!-- Custom section -->
  <section class="my-custom-section">
    <h2>Was unsere Leser sagen</h2>
    <CommentList recipeUuid={post.data.uuid} />
  </section>

  <!-- Another custom section -->
  <section class="my-form-section">
    <h2>Teilen Sie Ihre Erfahrung</h2>
    <CommentForm recipeUuid={post.data.uuid} />
  </section>
</LayoutBlogPost>
```

## Using StarRating Component Alone

You can also use the StarRating component independently:

```astro
---
import StarRating from "../../components/StarRating.astro";
---

<!-- Display only (non-interactive) -->
<div class="recipe-header">
  <h1>{post.data.title}</h1>
  <StarRating rating={4.5} size="md" />
  <span class="review-count">Based on 10 reviews</span>
</div>

<!-- Interactive (in a form) -->
<form>
  <label>Your Rating:</label>
  <StarRating interactive={true} size="lg" name="rating" />
</form>
```

### StarRating Props

- **rating** (number, 0-5) - The rating to display
- **interactive** (boolean) - Whether users can click to rate
- **size** ("sm" | "md" | "lg") - Size of the stars
- **name** (string) - Name for the hidden form input

## API Usage Examples

### Fetch Comments Programmatically

```javascript
const response = await fetch('/api/comments/550e8400-e29b-41d4-a716-446655440000');
const data = await response.json();

console.log(data.comments);      // Array of comments
console.log(data.rating.average); // 4.5
console.log(data.rating.count);   // 10
```

### Submit Comment Programmatically

```javascript
const response = await fetch('/api/comments/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    recipeUuid: '550e8400-e29b-41d4-a716-446655440000',
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Great recipe!',
    rating: 5,
    captchaToken: 'your-hcaptcha-token'
  })
});

const data = await response.json();
console.log(data.success); // true
console.log(data.comment);  // The submitted comment
```

## Customizing Styles

All components use Tailwind CSS. To customize:

### 1. Edit Component Files Directly

Edit `src/components/CommentForm.astro` or `CommentList.astro` to change classes.

### 2. Override with Custom CSS

```astro
<Comments recipeUuid={post.data.uuid} />

<style>
  .comment-form-container {
    background: linear-gradient(to bottom, #f0f0f0, #ffffff);
  }

  .comment {
    border-left: 4px solid var(--color-primary);
  }
</style>
```

### 3. Update Theme Variables

Edit `src/styles/global.css`:

```css
@theme {
  --color-primary: #your-color;
  --color-accent: #your-accent;
}
```

## Monitoring Comments

To check submitted comments manually:

```bash
# View all comment files
ls data/comments/

# View a specific recipe's comments
cat data/comments/550e8400-e29b-41d4-a716-446655440000.json

# Count total comments
jq '[.] | length' data/comments/*.json | awk '{sum+=$1} END {print sum}'
```

## Testing Checklist

After integration, test these scenarios:

- [ ] Recipe page loads without errors
- [ ] Comment form displays correctly
- [ ] Star rating is interactive
- [ ] hCaptcha widget loads
- [ ] Can submit a comment
- [ ] Comment appears in the list immediately
- [ ] Average rating updates
- [ ] Form validation works (try empty fields)
- [ ] Email validation works (try invalid email)
- [ ] Error messages display correctly
- [ ] Success message displays after submission
- [ ] Works on mobile devices
- [ ] Works in different browsers

## Next Steps

1. ✅ Complete the setup steps in `COMMENTS_QUICK_START.md`
2. ✅ Add the Comments component to your recipe pages
3. ✅ Test the system thoroughly
4. ✅ Deploy to production
5. 🎉 Start collecting feedback from your users!
