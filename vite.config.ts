import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      // All /api/* requests are forwarded to the Express server.
      // Extension point: add more proxy rules here if you add new API routes.
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
