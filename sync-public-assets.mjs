import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transformSync } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, 'public', 'assets', 'js');
const targetDir = path.join(__dirname, 'dist', 'assets', 'js');
const sourceIndexPath = path.join(__dirname, 'src', 'index.html');
const rootPublicFiles = ['favicon.ico'];

export function collectReferencedJsAssets(html) {
  const refs = new Set();
  const scriptRegex = /<script[^>]*src="([^"]+)"[^>]*><\/script>/gi;
  for (const match of String(html || '').matchAll(scriptRegex)) {
    const src = String(match[1] || '').trim();
    if (!src.startsWith('./assets/js/') && !src.startsWith('/assets/js/')) continue;
    refs.add(src.replace(/^\.?\//, '').split('?')[0].split('#')[0].replace(/^assets\/js\//, ''));
  }
  return refs;
}

export function collectLazyLoadedJsAssets(sourceCode) {
  const refs = new Set();
  const lazyLoadRegex = /['"]\.\/assets\/js\/([^'"]+\.js)['"]/g;
  for (const match of String(sourceCode || '').matchAll(lazyLoadRegex)) {
    refs.add(String(match[1] || '').trim());
  }
  return refs;
}

export function syncReferencedAssets({
  sourceJsDir = sourceDir,
  targetJsDir = targetDir,
  indexHtmlPath = sourceIndexPath,
  projectRoot = __dirname
} = {}) {
  if (!fs.existsSync(sourceJsDir)) {
    throw new Error(`Source JS directory not found: ${sourceJsDir}`);
  }

  fs.mkdirSync(targetJsDir, { recursive: true });

  const sourceIndexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  const referencedAssets = collectReferencedJsAssets(sourceIndexHtml);
  const resolvedBootRuntimePath = path.join(sourceJsDir, 'boot-runtime.js');
  if (fs.existsSync(resolvedBootRuntimePath)) {
    const bootRuntime = fs.readFileSync(resolvedBootRuntimePath, 'utf8');
    for (const asset of collectLazyLoadedJsAssets(bootRuntime)) {
      referencedAssets.add(asset);
    }
  }

  for (const entry of fs.readdirSync(targetJsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    if (referencedAssets.has(entry.name)) continue;
    const targetPath = path.join(targetJsDir, entry.name);
    fs.rmSync(targetPath, { force: true });
    console.log(`Removed stale asset: ${targetPath}`);
  }

  for (const entry of fs.readdirSync(sourceJsDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
    if (!referencedAssets.has(entry.name)) continue;
    const sourcePath = path.join(sourceJsDir, entry.name);
    const targetPath = path.join(targetJsDir, entry.name);
    const sourceCode = fs.readFileSync(sourcePath, 'utf8');
    const minified = transformSync(sourceCode, {
      loader: 'js',
      minify: true,
      legalComments: 'none',
      charset: 'utf8',
      target: 'es2018'
    });
    fs.writeFileSync(targetPath, minified.code, 'utf8');
    console.log(`Synced asset: ${sourcePath} -> ${targetPath} (${sourceCode.length}B -> ${minified.code.length}B)`);
  }

  for (const fileName of rootPublicFiles) {
    const sourcePath = path.join(projectRoot, 'public', fileName);
    if (!fs.existsSync(sourcePath)) continue;
    const targetPath = path.join(projectRoot, 'dist', fileName);
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Synced root asset: ${sourcePath} -> ${targetPath}`);
  }
}

function main() {
  try {
    syncReferencedAssets();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
