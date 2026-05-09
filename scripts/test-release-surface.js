const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function parseJson(relativePath) {
  return JSON.parse(read(relativePath));
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
const prodSmoke = read('scripts/run-prod-smoke.js');
const runLocalSmoke = read('scripts/run-local-smoke.js');
const smokeModules = read('scripts/smoke-all-modules.js');
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
assert.ok(exists('dist/sw.js'), 'dist/sw.js must exist before release');
assert.ok(exists('dist/favicon.ico'), 'dist/favicon.ico must exist before release');
assert.ok(exists('dist/assets/js/boot-runtime.js'), 'dist boot runtime must exist before release');
assert.ok(exists('dist/assets/js/app.js'), 'dist app runtime must exist before release');
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
