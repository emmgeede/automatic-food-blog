// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import icon from 'astro-icon';

import netlify from '@astrojs/netlify';

import matomo from 'astro-matomo';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [
    icon(),
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