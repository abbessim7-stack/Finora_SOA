import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Le proxy de développement renvoie /api vers le service NestJS (port 3001).
export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port: 5300,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
