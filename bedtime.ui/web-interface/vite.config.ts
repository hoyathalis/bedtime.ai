import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';



export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow connections from the network
    port: 5173,       // Explicitly specify port
    strictPort: true, // Ensure the server runs on the specified port
    proxy: {
      '/infer': {
        target: 'http://34.71.209.167:6000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/infer/, '/infer'),
      },
    },
  },
});
