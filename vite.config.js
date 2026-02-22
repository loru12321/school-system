import { defineConfig } from 'vite';
import path from 'path';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  root: 'src',
  publicDir: '../public', // Since root is 'src', publicDir must point to '../public'
  base: './', // Use relative paths for assets so it works on GitHub Pages/Cloudflare without domain root
  plugins: [
    viteSingleFile()
  ],
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    open: true
  }
});
