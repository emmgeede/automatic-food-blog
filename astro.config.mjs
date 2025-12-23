// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import icon from 'astro-icon';

import netlify from '@astrojs/netlify';

import matomo from 'astro-matomo';

import preact from '@astrojs/preact';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://die-mama-kocht.de',

  vite: {
    plugins: [tailwindcss()]
  },

  image: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },

  integrations: [
    icon(),
    preact(),
    sitemap(),
    matomo({
      enabled: true,
      host: 'https://analytics.die-mama-kocht.de',
      siteId: 1,
      heartBeatTimer: 15,
      disableCookies: true,
      requireConsent: false,
      requireCookieConsent: false,
      trackPageView: true,
      trackLinks: true,
      enableLinkTracking: true,
      debug: false,
    })
  ],
  adapter: netlify()
});