const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function parseAppShellAssets(source) {
  const match = source.match(/const\s+APP_SHELL_ASSETS\s*=\s*\[([\s\S]*?)\];/);
  assert.ok(match, 'APP_SHELL_ASSETS must be declared as executable code');
  return Array.from(match[1].matchAll(/['"]([^'"]+)['"]/g), (item) => item[1]);
}

function assertIncludes(source, token, message) {
  assert.ok(source.includes(token), message || `missing token: ${token}`);
}

const packageJson = JSON.parse(read('package.json'));
const publicSw = read('public/sw.js');
const serviceWorkerRuntime = read('public/assets/js/service-worker-runtime.js');
const srcIndex = read('src/index.html');
const distSw = read('dist/sw.js');
const releaseSurface = read('scripts/test-release-surface.js');
const scripts = packageJson.scripts || {};
const publicAppShellAssets = parseAppShellAssets(publicSw);
const distAppShellAssets = parseAppShellAssets(distSw);

assert.deepStrictEqual(distSw, publicSw, 'dist service worker should match public service worker after build');
assert.deepStrictEqual(publicAppShellAssets, ['./', './index.html', './favicon.ico', './icon.svg', './site.webmanifest', './robots.txt', './sitemap.xml'], 'service worker should precache only stable app shell assets and public metadata');
assert.deepStrictEqual(distAppShellAssets, publicAppShellAssets, 'dist service worker app shell assets should match source');
assertIncludes(publicSw, "const CACHE_VERSION = 'school-system-v1.6-county-cache';", 'cache version should be explicit and bumped when the app shell changes');
assertIncludes(publicSw, 'const STATIC_CACHE = `${CACHE_VERSION}-static`;', 'static cache name should be versioned');
assertIncludes(publicSw, 'const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;', 'dynamic cache name should be versioned');
assertIncludes(publicSw, 'const API_CACHE = `${CACHE_VERSION}-api`;', 'API cache name should be versioned');
assertIncludes(publicSw, "self.addEventListener('install'", 'install handler should be registered');
assertIncludes(publicSw, 'await Promise.all(APP_SHELL_ASSETS.map(asset => precacheAsset(cache, asset)));', 'install should precache app shell assets safely');
assertIncludes(publicSw, 'await self.skipWaiting();', 'install should activate updates promptly');
assertIncludes(publicSw, "self.addEventListener('activate'", 'activate handler should be registered');
assertIncludes(publicSw, 'await self.clients.claim();', 'activate should claim clients');
assert.ok(!publicSw.includes('client.navigate'), 'service worker should not force-navigate clients during activation');
assertIncludes(publicSw, "self.addEventListener('fetch'", 'fetch handler should be registered');
assertIncludes(publicSw, "if (request.method !== 'GET') return;", 'service worker must not cache mutating requests');
assertIncludes(publicSw, "if (url.protocol === 'chrome-extension:') return;", 'service worker should ignore browser extension requests');
assertIncludes(publicSw, "request.mode === 'navigate' || acceptsHtml(request)", 'HTML navigation should use network-first handling');
assertIncludes(publicSw, 'event.respondWith(networkFirstApi(request, url));', 'API requests should use network-first handling');
assertIncludes(publicSw, 'event.respondWith(networkFirstRuntimeAsset(request));', 'runtime JS/CSS assets should use network-first handling');
assertIncludes(publicSw, "fetch(new Request(request, { cache: 'reload' }))", 'runtime JS/CSS assets should bypass stale browser caches');
assertIncludes(publicSw, 'event.respondWith(cacheFirstStatic(request));', 'non-runtime static assets should keep cache-first handling');
assertIncludes(publicSw, 'function isRuntimeAsset(pathname)', 'runtime asset routing should be centralized');
assertIncludes(publicSw, 'function isApiCacheEligible(url)', 'API cache eligibility should be centralized');
assertIncludes(publicSw, "if (pathname === '/api/health') return true;", 'only health API should be cache eligible by default');
assertIncludes(publicSw, 'return false;', 'API cache eligibility should fail closed');
assertIncludes(publicSw, "headers: buildOfflineHeaders('application/json; charset=utf-8')", 'offline API fallback should be JSON with charset');
assertIncludes(publicSw, "headers: buildOfflineHeaders('text/html; charset=utf-8')", 'offline HTML fallback should be HTML with charset');
assertIncludes(publicSw, "function buildOfflineHeaders(contentType)", 'offline fallback headers should be centralized');
assertIncludes(publicSw, "'Cache-Control': 'no-store'", 'offline fallback responses should not be stored');
assertIncludes(publicSw, "'X-Content-Type-Options': 'nosniff'", 'offline fallback responses should set nosniff');
assertIncludes(publicSw, '<title>离线模式</title>', 'offline HTML fallback should be localized');
assertIncludes(publicSw, "if (event.tag === 'sync-data')", 'background sync tag should remain explicit');
assert.ok(!publicSw.includes("console.log('[SW] loaded')"), 'service worker should not log on every load');
assert.ok(!/\/\/[^\n]*const\s+APP_SHELL_ASSETS/.test(publicSw), 'APP_SHELL_ASSETS declaration should not be hidden inside a comment');
assertIncludes(serviceWorkerRuntime, "const SERVICE_WORKER_VERSION = '20260606-town-idle-v1';", 'service worker runtime should version registration updates');
assertIncludes(serviceWorkerRuntime, 'const SERVICE_WORKER_PATH = `./sw.js?v=${SERVICE_WORKER_VERSION}`;', 'service worker runtime should register the versioned local sw.js');
assertIncludes(srcIndex, 'service-worker-runtime.js?v=20260606-town-idle-v1', 'HTML should cache-bust the service worker runtime loader');
assertIncludes(srcIndex, "var refreshVersion = '20260606-town-idle-v1';", 'early runtime refresh should use the same service worker runtime version');
assertIncludes(serviceWorkerRuntime, "root.location.reload();", 'service worker runtime should refresh controlled pages after an update claims them');
assertIncludes(serviceWorkerRuntime, "'schoolsystem.com.cn'", 'service worker runtime should allow the canonical production host');
assertIncludes(serviceWorkerRuntime, "root.addEventListener('load', registerServiceWorker", 'service worker registration should wait until page load');
assertIncludes(serviceWorkerRuntime, 'requestIdleCallback', 'service worker registration should avoid competing with initial rendering');
assert.ok(!serviceWorkerRuntime.includes("console.log('[SW] loaded')"), 'service worker runtime should not log on every load');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:service-worker-contract'), 'fast release check must include service worker contract guard');
assert.strictEqual(scripts['check:syntax'], 'node scripts/test-syntax.js', 'syntax check must use recursive service worker coverage');
assert.ok(releaseSurface.includes("exists('dist/sw.js')"), 'release surface check should require dist service worker');

console.log(JSON.stringify({
  ok: true,
  appShellAssets: publicAppShellAssets,
  cacheVersion: (publicSw.match(/CACHE_VERSION\s*=\s*'([^']+)'/) || [])[1],
  apiCachePolicy: 'health-only'
}, null, 2));
