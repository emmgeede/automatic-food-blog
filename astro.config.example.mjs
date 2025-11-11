// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Choose and import your adapter:
// For Node.js: npm install @astrojs/node
import node from '@astrojs/node';

// For Vercel: npm install @astrojs/vercel
// import vercel from '@astrojs/vercel/serverless';

// For Netlify: npm install @astrojs/netlify
// import netlify from '@astrojs/netlify/functions';

// For Cloudflare: npm install @astrojs/cloudflare
// import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  // Enable server-side rendering for API routes
  output: 'hybrid', // Use 'server' for fully SSR or 'hybrid' for mixed static/dynamic

  // Configure your adapter (uncomment the one you're using)
  adapter: node({
    mode: 'standalone'
  }),
  // adapter: vercel(),
  // adapter: netlify(),
  // adapter: cloudflare(),
});
