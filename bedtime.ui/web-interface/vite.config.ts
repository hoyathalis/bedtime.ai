import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/infer': {
        target: 'http://34.71.209.167:6000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/infer/, '/infer'),
      },
    },
  },
});
