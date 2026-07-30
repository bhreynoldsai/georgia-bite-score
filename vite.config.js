import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When deployed to GitHub Pages at https://<user>.github.io/<repo>/, asset
// paths must be prefixed with /<repo>/. Set BASE_PATH in the deploy workflow.
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: { host: true, port: 5173 },
});
