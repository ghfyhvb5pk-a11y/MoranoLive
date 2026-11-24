import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Relative asset paths work on both local hosting and GitHub Pages project subpaths.
  base: './',
});
