const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function normalizeLineEndings(value) {
  return String(value || '').replace(/\r\n/g, '\n');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function parseJson(relativePath) {
  let content = read(relativePath);
  if (relativePath.endsWith('.jsonc')) {
    content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  }
  return JSON.parse(content);
}

function listFiles(relativePath) {
  return fs.readdirSync(path.join(root, relativePath));
}

function countFilesRecursive(relativePath) {
  const fullPath = path.join(root, relativePath);
  return fs.readdirSync(fullPath, { withFileTypes: true }).reduce((total, entry) => {
    const childPath = path.join(relativePath, entry.name);
    return total + (entry.isDirectory() ? countFilesRecursive(childPath) : 1);
  }, 0);
}

const packageJson = parseJson('package.json');
const wrangler = parseJson('wrangler.jsonc');
const distIndex = read('dist/index.html');
const gitignore = normalizeLineEndings(read('.gitignore'));
const prodSmoke = read('scripts/run-prod-smoke.js');
const runLocalSmoke = read('scripts/run-local-smoke.js');
const smokeModules = read('scripts/smoke-all-modules.js');
const publicHeaders = normalizeLineEndings(read('public/_headers'));
const distHeaders = exists('dist/_headers') ? normalizeLineEndings(read('dist/_headers')) : '';
const publicRobots = read('public/robots.txt');
const publicSitemap = read('public/sitemap.xml');
const publicManifest = JSON.parse(read('public/site.webmanifest'));
const scripts = packageJson.scripts || {};
const wranglerRoutes = Array.isArray(wrangler.routes) ? wrangler.routes : [];
const distJsFiles = listFiles('dist/assets/js');
const distFileCount = countFilesRecursive('dist');
const forbiddenSecretPatterns = [
  /sbp_[A-Za-z0-9_]{20,}/,
  /ghp_[A-Za-z0-9_]{20,}/,
  /cloudflare[a-z0-9_-]*token\s*[:=]/i
];

assert.ok(exists('dist/index.html'), 'dist/index.html must exist before release');
assert.ok(exists('lt.html'), 'root lt.html must be generated before offline or AD release packaging');
assert.ok(/^lt\.html$/m.test(gitignore), 'generated root lt.html must stay ignored by Git');
assert.ok(exists('dist/_headers'), 'dist/_headers must be emitted for Cloudflare static asset headers');
assert.ok(exists('dist/robots.txt'), 'dist/robots.txt must be emitted for crawlers');
assert.ok(exists('dist/sitemap.xml'), 'dist/sitemap.xml must be emitted for crawlers');
assert.ok(exists('dist/site.webmanifest'), 'dist/site.webmanifest must be emitted for PWA metadata');
assert.ok(exists('dist/icon.svg'), 'dist/icon.svg must be emitted for app icons and sharing');
assert.ok(exists('dist/sw.js'), 'dist/sw.js must exist before release');
assert.ok(exists('dist/favicon.ico'), 'dist/favicon.ico must exist before release');
assert.ok(exists('dist/assets/js/boot-runtime.js'), 'dist boot runtime must exist before release');
assert.ok(exists('dist/assets/js/app.js'), 'dist app runtime must exist before release');
const entranceManifest = parseJson('dist/assets/audio/entrance/manifest.json');
assert.strictEqual(entranceManifest.tracks.length, 1, 'release should include only the selected built-in entrance track');
entranceManifest.tracks.forEach((track) => {
  assert.ok(exists(`dist/assets/audio/entrance/${track.src}`), `release should include built-in entrance track ${track.src}`);
});
assert.ok(exists('src/worker-dummy.js'), 'Cloudflare Worker entry must exist');
assert.strictEqual(wrangler.main, 'src/worker-dummy.js', 'Cloudflare Worker entry should stay on the static asset worker');
assert.strictEqual(wrangler.assets && wrangler.assets.directory, './dist', 'Cloudflare assets directory should deploy ./dist');
assert.strictEqual(wrangler.assets && wrangler.assets.binding, 'ASSETS', 'Cloudflare assets binding should be ASSETS');
assert.ok(wrangler.d1_databases && wrangler.d1_databases.some((db) => db.binding === 'GATEWAY_DATA_DB'), 'Cloudflare gateway D1 binding must be configured');
assert.ok(wranglerRoutes.some((route) => route.pattern === 'schoolsystem.com.cn/*'), 'root production route must be configured');
assert.ok(wranglerRoutes.some((route) => route.pattern === 'www.schoolsystem.com.cn/*'), 'www production route must be configured');
assert.ok(/^20\d{2}-\d{2}-\d{2}$/.test(wrangler.compatibility_date || ''), 'compatibility_date must be explicit');
assert.ok(new Date(wrangler.compatibility_date) >= new Date('2026-04-01'), 'compatibility_date should not drift too far behind this release line');
assert.ok(scripts.build && scripts.build.includes('vite build'), 'build script must run Vite');
assert.ok(scripts.build && scripts.build.includes('sync-public-assets.mjs'), 'build script must sync public assets');
assert.ok(scripts.build && scripts.build.includes('prune-dist-assets.mjs'), 'build script must prune stale dist assets');
assert.ok(scripts.build && scripts.build.includes('optimize-dist-html.mjs'), 'build script must optimize dist HTML');
assert.ok(scripts.build && scripts.build.includes('inline-scripts.mjs'), 'build script must inline the release HTML script surface');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:release-surface'), 'fast release check must include release surface guard');
['test:release-manifest', 'test:desktop-package-contract', 'test:capacitor-package-contract', 'test:beta-release-workflow'].forEach((scriptName) => {
  assert.ok(scripts[scriptName], `${scriptName} must be exposed as a release contract`);
  assert.ok(scripts['check:release-fast'].includes(scriptName), `fast release check must include ${scriptName}`);
});
assert.strictEqual(scripts['release:verify-assets'], 'node scripts/verify-release-assets.mjs', 'release verification should use the manifest-aware verifier');
assert.ok(scripts['smoke:modules:prod'] === 'node scripts/run-prod-smoke.js', 'production smoke script should use the guarded production wrapper');
assert.ok(prodSmoke.includes('https://schoolsystem.com.cn/'), 'production smoke wrapper should default to the canonical domain');
assert.ok(prodSmoke.includes('Refusing to run production smoke'), 'production smoke wrapper should reject unexpected URLs');
assert.ok(runLocalSmoke.includes('SMOKE_URL'), 'local smoke wrapper should preserve configurable smoke URLs');
assert.ok(smokeModules.includes('SWITCH_MODULE_IDS'), 'module smoke script must keep explicit module coverage');
assert.ok(distIndex.includes('id="app"'), 'dist HTML must contain the application root');
assert.ok(distIndex.includes('id="login-overlay"'), 'dist HTML must contain the login overlay');
assert.ok(distIndex.includes('./assets/js/boot-runtime.js'), 'dist HTML must load boot-runtime.js');
assert.ok(distIndex.includes('./assets/js/runtime-registry-runtime.js'), 'dist HTML must load runtime registry');
assert.ok(distIndex.includes('./assets/vendor/tabler-icons/tabler-icons.min.css'), 'dist HTML must load local Tabler icons CSS');
assert.strictEqual(
  distHeaders,
  publicHeaders,
  'dist static asset headers should match public/_headers'
);
assert.ok(publicHeaders.includes('/style-*.css'), 'static asset headers should cover hashed Vite CSS');
assert.ok(publicHeaders.includes('/assets/vendor/*'), 'static asset headers should cover vendored assets');
assert.ok(publicHeaders.includes('/assets/js/*'), 'static asset headers should cover runtime JS assets');
assert.ok(publicHeaders.includes('/assets/audio/*'), 'static asset headers should cover built-in entrance audio assets');
assert.ok(publicHeaders.includes('max-age=3600, stale-while-revalidate=86400'), 'runtime JS should use short browser caching with background revalidation');
assert.ok(publicHeaders.includes('/downloads/*'), 'static asset headers should cover hosted downloads');
assert.ok(
  publicHeaders.includes('/downloads/*\n  Cache-Control: public, max-age=31536000, immutable'),
  'hosted downloads should use long immutable CDN caching'
);
assert.ok(publicHeaders.includes('/index.html'), 'static asset headers should cover index.html');
assert.ok(publicHeaders.includes('Content-Type: text/html; charset=utf-8'), 'HTML responses should declare UTF-8 charset');
assert.ok(publicHeaders.includes('/\n  Content-Type: text/html; charset=utf-8\n  Cache-Control: no-cache, max-age=0, must-revalidate'), 'root HTML should revalidate strictly');
assert.ok(publicHeaders.includes('/index.html\n  Content-Type: text/html; charset=utf-8\n  Cache-Control: no-cache, max-age=0, must-revalidate'), 'index HTML should revalidate strictly');
assert.ok(publicHeaders.includes('/sw.js'), 'static asset headers should keep service worker updates revalidation-friendly');
assert.ok(publicHeaders.includes('max-age=31536000, immutable'), 'fingerprinted/vendor assets should get long browser caching');
assert.ok(publicHeaders.includes('/sw.js\n  Cache-Control: public, max-age=0, must-revalidate'), 'service worker should remain quickly updateable');
assert.ok(publicHeaders.includes('Strict-Transport-Security: max-age=31536000; includeSubDomains; preload'), 'static responses should send HSTS');
assert.ok(publicHeaders.includes('Referrer-Policy: strict-origin-when-cross-origin'), 'static responses should send a referrer policy');
assert.ok(publicHeaders.includes('X-Frame-Options: SAMEORIGIN'), 'static responses should limit framing');
assert.ok(publicHeaders.includes('Permissions-Policy: camera=(), microphone=(), geolocation=()'), 'static responses should disable unused sensitive browser features');
assert.ok(publicHeaders.includes('/robots.txt'), 'static asset headers should cover robots.txt');
assert.ok(publicHeaders.includes('/sitemap.xml'), 'static asset headers should cover sitemap.xml');
assert.ok(publicHeaders.includes('/site.webmanifest'), 'static asset headers should cover site.webmanifest');
assert.ok(publicHeaders.includes('/icon.svg'), 'static asset headers should cover icon.svg');
assert.strictEqual((publicHeaders.match(/X-Content-Type-Options: nosniff/g) || []).length, 1, 'nosniff should be defined once globally');
assert.ok(publicRobots.includes('Sitemap: https://schoolsystem.com.cn/sitemap.xml'), 'robots.txt should point to the canonical sitemap');
assert.ok(publicSitemap.includes('<loc>https://schoolsystem.com.cn/</loc>'), 'sitemap should include the canonical app URL');
assert.strictEqual(publicManifest.id, '/', 'web manifest should keep a stable app identity');
assert.strictEqual(publicManifest.start_url, '/', 'web manifest should start at the app root');
assert.strictEqual(publicManifest.orientation, 'any', 'web manifest should allow responsive orientation');
assert.strictEqual(publicManifest.dir, 'ltr', 'web manifest should declare text direction');
assert.strictEqual(publicManifest.display, 'standalone', 'web manifest should enable standalone app display');
assert.strictEqual(publicManifest.name, '校衡台', 'web manifest name should stay readable');
assert.strictEqual(publicManifest.short_name, '校衡台', 'web manifest short name should stay readable');
assert.ok(publicManifest.description.includes('教务'), 'web manifest description should stay readable');
assert.ok(!/[�锟]/.test(read('public/site.webmanifest')), 'web manifest should not contain mojibake');
assert.ok(Array.isArray(publicManifest.categories) && publicManifest.categories.includes('education'), 'web manifest should classify the app for education');
assert.ok(Array.isArray(publicManifest.icons) && publicManifest.icons.some((icon) => icon.src === '/icon.svg'), 'web manifest should include the SVG app icon');
assert.ok(Array.isArray(publicManifest.shortcuts) && publicManifest.shortcuts.length >= 3, 'web manifest should expose common app shortcuts');
assert.ok(publicManifest.shortcuts.some((shortcut) => shortcut.url === '/#upload'), 'web manifest should shortcut to data import');
assert.ok(publicManifest.shortcuts.some((shortcut) => shortcut.url === '/#student-overview'), 'web manifest should shortcut to student overview');
assert.ok(publicManifest.shortcuts.some((shortcut) => shortcut.url === '/#app-download-center'), 'web manifest should shortcut to app downloads');
assert.ok(publicManifest.shortcuts.some((shortcut) => shortcut.name === '数据导入'), 'web manifest should keep readable import shortcut');
assert.ok(publicManifest.shortcuts.some((shortcut) => shortcut.name === '学情总览'), 'web manifest should keep readable overview shortcut');
assert.ok(publicManifest.shortcuts.some((shortcut) => shortcut.name === '应用下载'), 'web manifest should keep readable download shortcut');
assert.ok(!distIndex.includes('http://localhost'), 'dist HTML must not reference localhost');
assert.ok(!distIndex.includes('127.0.0.1'), 'dist HTML must not reference loopback hosts');
forbiddenSecretPatterns.forEach((pattern) => {
  assert.ok(!pattern.test(distIndex), `dist HTML must not embed secret-like pattern ${pattern}`);
  assert.ok(!pattern.test(read('wrangler.jsonc')), `wrangler config must not embed secret-like pattern ${pattern}`);
});
assert.ok(distJsFiles.length >= 80, `dist JS asset count looks too small: ${distJsFiles.length}`);
assert.ok(distFileCount >= 120, `dist release asset count looks too small: ${distFileCount}`);

console.log(JSON.stringify({
  ok: true,
  distJsFiles: distJsFiles.length,
  distFileCount,
  routes: wranglerRoutes.map((route) => route.pattern)
}, null, 2));
