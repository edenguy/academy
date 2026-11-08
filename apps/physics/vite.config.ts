import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// The app is published under https://edenguy.github.io/academy/subjects/physics/.
// ACADEMY_PHYSICS_BASE overrides it for a preview host served from a different path.
const base = process.env.ACADEMY_PHYSICS_BASE ?? '/academy/subjects/physics/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    target: 'es2022',
    sourcemap: false,
    // The built app is committed under docs/, which GitHub Pages is configured to serve
    // (Settings → Pages → Branch: main, folder: /docs) — apps/ (source) is never published.
    outDir: process.env.ACADEMY_PHYSICS_OUT_DIR ?? '../../docs/subjects/physics',
    emptyOutDir: true,
  },
});
