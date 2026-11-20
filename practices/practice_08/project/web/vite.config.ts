import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ui/',
  resolve: {
    alias: {
      '@': '/src',
      '@legacy': new URL('../src', import.meta.url).pathname,
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
});
