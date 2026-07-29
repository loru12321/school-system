import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transformSync } from 'esbuild';
import { writeFileWithRetry } from './file-write-retry.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_PROJECT_ROOT = path.resolve(__dirname, '../../');

const sourceDir = path.join(DEFAULT_PROJECT_ROOT, 'public', 'assets', 'js');
const targetDir = path.join(DEFAULT_PROJECT_ROOT, 'dist', 'assets', 'js');
const sourceIndexPath = path.join(DEFAULT_PROJECT_ROOT, 'src', 'index.html');
const rootPublicFiles = ['favicon.ico', '_headers', 'sw.js', 'robots.txt', 'sitemap.xml', 'site.webmanifest', 'icon.svg'];
const releaseAssetsDir = 'releases';
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
  const bootJsCallRegex = /\bbootJs\(\s*['"]([^'"]+\.js)['"]\s*\)/g;
  for (const match of String(sourceCode || '').matchAll(bootJsCallRegex)) {
    refs.add(String(match[1] || '').trim());
  }
  const bootModuleManifestRegex = /var\s+(?:APP_MODULES|DEFERRED_APP_MODULES)\s*=\s*\[([\s\S]*?)\]\.map\(bootJs\);/g;
  for (const appModulesMatch of String(sourceCode || '').matchAll(bootModuleManifestRegex)) {
    const appModuleRegex = /['"]([^'"]+\.js)['"]/g;
    for (const match of appModulesMatch[1].matchAll(appModuleRegex)) {
      refs.add(String(match[1] || '').trim());
    }
  }
  return refs;
}

export async function syncReferencedAssets({
  sourceJsDir = sourceDir,
  targetJsDir = targetDir,
  indexHtmlPath = sourceIndexPath,
  projectRoot = DEFAULT_PROJECT_ROOT
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

  const scannedAssets = new Set();
  const scanQueue = Array.from(referencedAssets);
  while (scanQueue.length) {
    const assetName = scanQueue.shift();
    if (!assetName || scannedAssets.has(assetName)) continue;
    scannedAssets.add(assetName);
    const assetPath = path.join(sourceJsDir, assetName);
    if (!fs.existsSync(assetPath)) continue;
    const sourceCode = fs.readFileSync(assetPath, 'utf8');
    for (const nestedAsset of collectLazyLoadedJsAssets(sourceCode)) {
      if (!referencedAssets.has(nestedAsset)) {
        referencedAssets.add(nestedAsset);
        scanQueue.push(nestedAsset);
      }
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
    // 分析包只会在已进入系统的现代浏览器中按需加载；保留可选链等现代语法，
    // 避免为了历史浏览器把离线导出包重复展开，挤占 lt.html 的发布体积预算。
    const target = entry.name === 'exam-analysis-package-runtime.js' ? 'es2020' : 'es2018';
    const minified = transformSync(sourceCode, {
      loader: 'js',
      minify: true,
      legalComments: 'none',
      charset: 'utf8',
      target
    });
    await writeFileWithRetry(targetPath, minified.code, 'utf8');
    console.log(`Synced asset: ${sourcePath} -> ${targetPath} (${sourceCode.length}B -> ${minified.code.length}B)`);
  }

  for (const fileName of rootPublicFiles) {
    const sourcePath = path.join(projectRoot, 'public', fileName);
    if (!fs.existsSync(sourcePath)) continue;
    const targetPath = path.join(projectRoot, 'dist', fileName);
    fs.copyFileSync(sourcePath, targetPath);
    console.log(`Synced root asset: ${sourcePath} -> ${targetPath}`);
  }

  const sourceReleasePath = path.join(projectRoot, 'public', releaseAssetsDir);
  const targetReleasePath = path.join(projectRoot, 'dist', releaseAssetsDir);
  if (fs.existsSync(sourceReleasePath)) {
    fs.rmSync(targetReleasePath, { recursive: true, force: true });
    fs.cpSync(sourceReleasePath, targetReleasePath, { recursive: true });
    console.log(`Synced release assets: ${sourceReleasePath} -> ${targetReleasePath}`);
  }
}

async function main() {
  try {
    await syncReferencedAssets();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}
