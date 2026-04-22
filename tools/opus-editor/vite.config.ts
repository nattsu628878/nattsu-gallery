import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

const gallery = '/nattsu-gallery';

export default defineConfig({
  plugins: [svelte()],
  server: {
    port: 5174,
    strictPort: true,
    host: '127.0.0.1',
    proxy: {
      // Astro dev（同リポ）へ API ・ public/opus の静的ファイルを中継
      [`^${gallery}`]: {
        target: 'http://127.0.0.1:4321',
        changeOrigin: true
      }
    }
  }
});
