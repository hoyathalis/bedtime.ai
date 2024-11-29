import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Define __dirname for ESM in TypeScript
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      // Ensure these paths are correct and readable
      key: fs.readFileSync(path.resolve(__dirname, 'key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert.pem')),
    },
    host: '0.0.0.0', // Allow connections from the network
    port: 5173, // Explicitly specify port
    strictPort: true, // Ensure the server runs on the specified port
    force: true, // Force Vite to serve HTTPS
    proxy: {
      '/infer': {
        target: 'http://34.71.209.167:6000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/infer/, '/infer'),
      },
    },
  },
});
