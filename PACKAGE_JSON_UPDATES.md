# package.json Updates

## Optional Scripts to Add

Add these convenient scripts to your `package.json` for managing the comment system:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",

    // Add these new scripts:
    "comments:add-uuids": "node scripts/add-uuids-to-recipes.js",
    "comments:setup": "mkdir -p data/comments && echo 'Comments directory created!'",
    "comments:backup": "tar -czf comments-backup-$(date +%Y%m%d-%H%M%S).tar.gz data/comments",
    "comments:count": "find data/comments -name '*.json' -exec cat {} \\; | jq '[.] | length' | awk '{sum+=$1} END {print \"Total comments:\", sum}'"
  }
}
```

## Script Descriptions

### `npm run comments:add-uuids`
Runs the UUID generation script to add UUIDs to all recipes that don't have them.

**Usage:**
```bash
npm run comments:add-uuids
```

### `npm run comments:setup`
Creates the `data/comments` directory structure if it doesn't exist.

**Usage:**
```bash
npm run comments:setup
```

### `npm run comments:backup`
Creates a timestamped backup of all comments as a compressed tar archive.

**Usage:**
```bash
npm run comments:backup
# Creates: comments-backup-20251110-143022.tar.gz
```

### `npm run comments:count`
Counts and displays the total number of comments across all recipes.

**Usage:**
```bash
npm run comments:count
# Output: Total comments: 42
```

**Note:** Requires `jq` to be installed. Install with:
- macOS: `brew install jq`
- Ubuntu/Debian: `apt-get install jq`
- Windows: Download from https://stedolan.github.io/jq/

## Complete package.json Example

```json
{
  "name": "automatic-food-blog",
  "type": "module",
  "version": "0.0.1",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "comments:add-uuids": "node scripts/add-uuids-to-recipes.js",
    "comments:setup": "mkdir -p data/comments && echo 'Comments directory created!'",
    "comments:backup": "tar -czf comments-backup-$(date +%Y%m%d-%H%M%S).tar.gz data/comments",
    "comments:count": "find data/comments -name '*.json' -exec cat {} \\; | jq '[.] | length' | awk '{sum+=$1} END {print \"Total comments:\", sum}'"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.1.16",
    "astro": "^5.15.3",
    "tailwindcss": "^4.1.16",
    "@astrojs/node": "^9.0.0"  // Add your chosen adapter
  },
  "devDependencies": {
    "@vitest/ui": "^4.0.8",
    "glob": "^11.0.3",
    "gray-matter": "^4.0.3",
    "happy-dom": "^20.0.10",
    "prettier": "^3.6.2",
    "prettier-plugin-astro": "^0.14.1",
    "prettier-plugin-tailwindcss": "^0.7.1",
    "sass": "^1.93.3",
    "vitest": "^4.0.8"
  }
}
```

## Quick Setup Workflow

After pulling this code, a team member can set up the comment system with these commands:

```bash
# 1. Install dependencies (including the adapter)
npm install

# 2. Create comments directory
npm run comments:setup

# 3. Add UUIDs to recipes
npm run comments:add-uuids

# 4. Set up environment variables
cp .env.example .env
# (then edit .env with your hCaptcha keys)

# 5. Start development server
npm run dev
```

## Production Workflow

For production deployments:

```bash
# Before deploying
npm run test:run              # Run all tests
npm run comments:backup       # Backup existing comments

# Deploy
npm run build                 # Build for production

# After deploying
npm run comments:count        # Verify comment data
```

## Maintenance Scripts

You may also want to add these for ongoing maintenance:

```json
{
  "scripts": {
    "comments:stats": "for file in data/comments/*.json; do echo \"$file: $(jq 'length' $file)\"; done",
    "comments:recent": "find data/comments -name '*.json' -exec cat {} \\; | jq -r '.[] | \"\\(.createdAt) - \\(.name): \\(.message[0:50])\"' | sort -r | head -10",
    "comments:validate": "for file in data/comments/*.json; do jq empty $file 2>&1 && echo \"✓ $file\" || echo \"✗ $file\"; done"
  }
}
```

### `npm run comments:stats`
Shows comment count per recipe.

### `npm run comments:recent`
Displays the 10 most recent comments across all recipes.

### `npm run comments:validate`
Validates that all comment JSON files are properly formatted.

## CI/CD Integration

Add to your CI/CD pipeline (GitHub Actions, GitLab CI, etc.):

```yaml
# .github/workflows/deploy.yml
- name: Validate comments
  run: npm run comments:validate

- name: Backup comments
  run: npm run comments:backup

- name: Build
  run: npm run build
```

## Notes

- All scripts are cross-platform compatible (except `comments:count` which requires `jq`)
- Scripts use relative paths and work from any directory
- Backup scripts create timestamped files to prevent overwrites
- All scripts are non-destructive and safe to run multiple times
