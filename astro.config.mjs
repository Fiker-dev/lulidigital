// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

const site = 'https://lulidigital.com';

// Pages that are SSR (prerender = false) must be listed manually
// so @astrojs/sitemap can include them alongside the prerendered ones.
const ssrPages = [
  '/',
  '/marketing-desk',
  '/ai-desk',
  '/va-desk',
  '/amsterdam',
  '/stockholm',
  '/munich',
  '/africa',
  '/united-states',
  '/united-kingdom',
  '/denmark',
  '/switzerland',
  '/ireland',
  '/belgium',
  '/norway',
  '/blog',
];

// https://astro.build/config
export default defineConfig({
  site,
  trailingSlash: 'never',
  output: 'server',
  adapter: vercel(),
  integrations: [
    sitemap({
      customPages: ssrPages.map((path) => `${site}${path}`),
      filter: (page) =>
        // exclude internal/private pages from the sitemap
        !page.includes('/Fikerte') &&
        !page.includes('/Teshome') &&
        !page.includes('/api/'),
      changefreq: 'weekly',
      priority: 0.8,
      serialize(item) {
        // bump homepage and market pages priority
        if (item.url === `${site}/`) return { ...item, priority: 1.0, changefreq: 'daily' };
        if (['/marketing-desk', '/ai-desk', '/va-desk', '/contact'].some(p => item.url.endsWith(p))) {
          return { ...item, priority: 0.9 };
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()]
  }
});
