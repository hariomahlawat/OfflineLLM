import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Development middleware to mirror the production nginx behaviour
// of serving `admin.html` when the `/admin` path is requested.
function adminRewrite() {
  return {
    name: 'admin-rewrite',
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        if (req.url === '/admin') req.url = '/admin.html';
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), adminRewrite()],
  server: {
    proxy: {
      // Proxy any call to /api/* → localhost:8000/*
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        admin: resolve(__dirname, 'admin.html'),
      },
    },
  },
});

