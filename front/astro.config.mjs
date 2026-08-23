import { defineConfig } from 'astro/config';

export default defineConfig({
  site: process.env.SITE_URL || 'https://piter-jaluzi.ru',
  output: 'static',
  image: {
    domains: ['images.unsplash.com', 'api.telegram.org']
  }
});
