import node from '@astrojs/node';
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  base: '/nattsu-gallery/',
  adapter: node({ mode: 'standalone' }),
  integrations: [svelte()]
});
