import { createLogger, defineConfig } from 'vite';
import path from 'path';
import { viteSingleFile } from 'vite-plugin-singlefile';

const viteLogger = createLogger();
const noisyClassicScriptWarning = `can't be bundled without type="module" attribute`;
const knownPublicAssetWarning = `./assets/vendor/tabler-icons/tabler-icons.min.css doesn't exist at build time`;
const originalWarn = viteLogger.warn;

viteLogger.warn = (msg, options) => {
  if (typeof msg === 'string' && msg.includes(noisyClassicScriptWarning)) {
    return;
  }
  if (typeof msg === 'string' && msg.includes(knownPublicAssetWarning)) {
    return;
  }
  originalWarn(msg, options);
};

export default defineConfig({
  root: 'src',
  publicDir: '../public', // Since root is 'src', publicDir must point to '../public'
  base: './', // Use relative paths for assets so it works on GitHub Pages/Cloudflare without domain root
  customLogger: viteLogger,
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
