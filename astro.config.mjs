// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import pagefind from 'astro-pagefind';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  // Replace with your actual domain
  site: 'https://bytesandweb.pl',

  i18n: {
    defaultLocale: 'pl',
    locales: ['pl', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  integrations: [
    mdx(),
    sitemap({
      i18n: {
        defaultLocale: 'pl',
        locales: {
          pl: 'pl-PL',
          en: 'en-US',
        },
      },
    }),
    pagefind(),
  ],

  markdown: {
    shikiConfig: {
      theme: 'github-dark',
      wrap: true,
      transformers: [
        {
          pre(node) {
            // Add relative positioning for copy button placement
            this.addClassToHast(node, 'relative');
          },
          line(node, line) {
            // Add line numbers as data attribute
            node.properties['data-line'] = line;
          }
        }
      ]
    }
  },

  vite: {
    plugins: [tailwindcss()]
  }
});