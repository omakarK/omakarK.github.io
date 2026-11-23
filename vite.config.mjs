import { cpSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const backend = process.env.SHOP_DEV_API || 'http://127.0.0.1:3000';

export default defineConfig({
  plugins: [{
    name: 'shop-assets',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url === '/admin' || request.url === '/admin/') request.url = '/admin.html';
        next();
      });
    },
    closeBundle() {
      cpSync('assets/images', 'dist/client/assets/images', { recursive: true });
      cpSync('assets/js', 'dist/client/assets/js', { recursive: true });
    }
  }],
  server: { proxy: { '/api': backend, '/media': backend } },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
    rollupOptions: {
      input: { shop: resolve('index.html'), admin: resolve('admin.html') }
    }
  }
});
