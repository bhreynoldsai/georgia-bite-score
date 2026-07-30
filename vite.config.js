import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When deployed to GitHub Pages at https://<user>.github.io/<repo>/, asset
// paths must be prefixed with /<repo>/. Set BASE_PATH in the deploy workflow.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: { host: true, port: 5173 },
  build: {
    rollupOptions: {
      output: {
        // Split vendor code out of the app chunk so no single file trips the
        // 500 kB warning and vendor code caches independently of app changes.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/recharts|d3-|victory|decimal\.js/.test(id)) return 'charts';
          return 'vendor';
        },
      },
    },
  },
});
