import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://tiagoborges.tech',
  output: 'static',
  build: {
    format: 'file',
  },
  vite: {
    plugins: [tailwindcss()],
  },
});
