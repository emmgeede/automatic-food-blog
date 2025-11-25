# Admin Name Replacement Challenge

## Problem Statement

When Ingrid Hartmann (the blog author) posts replies to comments from the admin backend at `/admin/`, the replies appear in the frontend comments section with the username "admin" instead of "Ingrid Hartmann".

This creates confusion for users who see an "admin" user responding, even though the profile box above comments states that Ingrid responds personally.

## What Was Attempted

### 1. Hybrid JWT/Basic Auth Strategy

**Implementation**: Modified `netlify/functions/admin-comments-reply.ts` to:
- First check for Remark42 JWT token in cookies (`REMARK42-JWT` or `REMARK42-JWT.food-blog`)
- If JWT found, use it via `X-JWT` header (posts as logged-in user)
- If no JWT, fallback to Basic Auth (posts as "admin")

**Code**:
```typescript
// Try to extract Remark42 JWT token from cookies
let remark42JWT: string | undefined;
if (cookie) {
  const jwtMatch = cookie.match(/REMARK42-JWT[^=]*=([^;]+)/);
  remark42JWT = jwtMatch?.[1];
}

const useJWT = !!remark42JWT;

if (useJWT) {
  headers['X-JWT'] = remark42JWT!;
} else {
  const credentials = Buffer.from(`admin:${adminPassword}`).toString('base64');
  headers['Authorization'] = `Basic ${credentials}`;
}
```

**Why it failed**:
- Remark42 sets JWT cookies for domain `comments.die-mama-kocht.de`
- Netlify functions run on domain `die-mama-kocht.de`
- Cookies don't cross domains - JWT token never reaches the Netlify function
- Result: Always falls back to Basic Auth, still posts as "admin"

### 2. DOM Manipulation (Client-side JavaScript)

**Implementation**: Added script in `RecipeComments.astro` to:
- Wait for Remark42 iframe to load
- Use MutationObserver to watch for new comments
- Find elements containing "admin" username
- Replace with "Ingrid Hartmann" and profile picture

**Code**:
```javascript
setTimeout(function() {
  try {
    const iframe = document.querySelector('iframe[id^="remark42"]');
    if (iframe && iframe.contentDocument) {
      // Find and replace admin username
      const adminElements = iframe.contentDocument.querySelectorAll('[data-username="admin"]');
      adminElements.forEach(el => {
        el.textContent = 'Ingrid Hartmann';
      });
    }
  } catch(e) {
    console.warn('Could not access Remark42 iframe (CORS):', e);
  }
}, 2000);
```

**Why it failed**:
- CORS (Cross-Origin Resource Sharing) prevents parent page from accessing iframe content
- Remark42 runs on `comments.die-mama-kocht.de`, main site on `die-mama-kocht.de`
- Browser blocks `iframe.contentDocument` access with SecurityError
- Result: Cannot manipulate DOM inside iframe

### 3. CSS Injection into Remark42 Iframe

**Implementation**: Attempted to inject custom stylesheet into Remark42 iframe to hide or replace admin username

**Why it failed**:
- CSS can hide elements but cannot replace text content
- CORS still prevents reliable stylesheet injection
- Would break if Remark42 updates their HTML structure

## Root Causes

1. **Cookie Domain Mismatch**:
   - Remark42: `comments.die-mama-kocht.de`
   - Main site: `die-mama-kocht.de`
   - Netlify functions: `die-mama-kocht.de`
   - Cookies don't cross subdomains

2. **CORS Security**:
   - Browser prevents cross-origin iframe access
   - Cannot read or modify Remark42 iframe content from parent page

3. **Remark42 Architecture**:
   - Comments render inside iframe (sandbox)
   - JWT authentication tied to user sessions on Remark42 domain
   - Basic Auth creates comments as "admin" system user

## Potential Future Solutions

### Option 1: Same-origin Proxy
- Run Remark42 on same domain via reverse proxy
- Set cookies for shared domain
- Allows JWT token to be accessible to Netlify functions
- **Complexity**: High (requires infrastructure changes)

### Option 2: Remark42 Admin API with Custom Display Name
- Check if Remark42 API supports setting custom display name in comment POST
- Override the "admin" username at API level
- **Research needed**: Review Remark42 API documentation

### Option 3: User Workflow Change
- Ingrid logs into Remark42 as herself (on main site) before using admin backend
- Admin backend uses session JWT from that login
- **Downside**: Extra step, session may expire

### Option 4: Direct Remark42 Interface Usage
- Ingrid replies directly through Remark42 interface (not admin backend)
- Requires separate login to Remark42
- **Downside**: Bypasses admin backend features

### Option 5: Database-level Username Change
- Directly modify Remark42 database to rename "admin" user to "Ingrid Hartmann"
- **Risk**: High (database integrity, updates might reset)

### Option 6: Remark42 Configuration
- Check if Remark42 allows configuring admin display name
- Modify Remark42 server configuration
- **Research needed**: Review Remark42 server settings

### Option 7: Accept "admin" with Clear Communication
- Keep "admin" username in comments
- Profile box above comments clarifies that Ingrid (the admin) responds
- Add explicit note: "Antworten von 'admin' = Antworten von Ingrid"
- **Complexity**: Low (already implemented)

## Recommended Next Steps

1. **Research Remark42 API**: Check if POST comment endpoint accepts custom username/name field
2. **Review Remark42 Config**: Look for admin display name settings in Remark42 server config
3. **Test Same-origin Setup**: Evaluate feasibility of running Remark42 on main domain
4. **User Testing**: Gather feedback on whether "admin" username actually confuses users

## Files Modified (To Be Reverted)

- `netlify/functions/admin-comments-reply.ts` - Remove hybrid JWT/Basic Auth logic
- `src/components/recipe/RecipeComments.astro` - Remove DOM manipulation script (already removed)

## Files to Keep (Successful Changes)

- `netlify/functions/auth-google-callback.ts` - diemamakocht@gmail.com in allowed emails
- `netlify/functions/auth-check.ts` - Returns user info from HttpOnly cookie
- `netlify/functions/admin-comments.ts` - Flattens replies correctly
- `src/pages/admin/index.astro` - Shows user info, displays replies with visual indicators
- `src/components/recipe/RecipeComments.astro` - Ingrid's profile box above comments

## Timeline

- **2025-11-25**: Initial implementation and testing
- **Decision**: Reverted for now, to be revisited when more research is done

## Status

⏸️ **PAUSED** - Waiting for further research on Remark42 API capabilities and configuration options.
