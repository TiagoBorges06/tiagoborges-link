import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://tiagoborges.tech',
  output: 'static',
  integrations: [sitemap()],
  build: {
    format: 'file',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
