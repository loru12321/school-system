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

function assertHeaderRule(source, route, cacheControl, message) {
  const normalized = String(source || '').replace(/\r\n/g, '\n');
  const escapedRoute = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escapedCache = cacheControl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert.ok(new RegExp(`(^|\\n)${escapedRoute}\\n\\s+Cache-Control: ${escapedCache}(\\n|$)`).test(normalized), message);
}

function extractSingleQuotedConst(source, name) {
  const match = source.match(new RegExp(`const\\s+${name}\\s*=\\s*'([^']+)'`));
  assert.ok(match, `${name} should be declared as a single-quoted const`);
  return match[1];
}

const packageJson = JSON.parse(read('package.json'));
const publicSw = read('public/sw.js');
const serviceWorkerRuntime = read('public/assets/js/service-worker-runtime.js');
const srcIndex = read('src/index.html');
const publicHeaders = read('public/_headers');
const distSw = read('dist/sw.js');
const releaseSurface = read('scripts/test-release-surface.js');
const scripts = packageJson.scripts || {};
const publicAppShellAssets = parseAppShellAssets(publicSw);
const distAppShellAssets = parseAppShellAssets(distSw);
const serviceWorkerVersion = extractSingleQuotedConst(serviceWorkerRuntime, 'SERVICE_WORKER_VERSION');
const distVersionedSw = read(`dist/sw-${serviceWorkerVersion}.js`);
const cacheVersion = extractSingleQuotedConst(publicSw, 'CACHE_VERSION');

assert.deepStrictEqual(distSw, publicSw, 'dist service worker should match public service worker after build');
assert.deepStrictEqual(publicAppShellAssets, ['./favicon.ico', './icon.svg', './site.webmanifest', './robots.txt', './sitemap.xml'], 'service worker should not precache HTML and should only precache stable public metadata');
assert.deepStrictEqual(distAppShellAssets, publicAppShellAssets, 'dist service worker app shell assets should match source');
assert.match(serviceWorkerVersion, /^runtime-[0-9a-f]{12}$/, 'service worker runtime version should be generated from runtime content');
assert.strictEqual(cacheVersion, `school-system-${serviceWorkerVersion}`, 'service worker cache version should follow the generated runtime version');
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
assertIncludes(publicSw, "if (request.method !== 'GET') {", 'service worker must branch mutating requests before caching');
assertIncludes(publicSw, "event.waitUntil(clearApiCacheAfterMutation(url));", 'service worker should clear API cache after mutating API requests');
assertIncludes(publicSw, "if (url.protocol === 'chrome-extension:') return;", 'service worker should ignore browser extension requests');
assertIncludes(publicSw, "request.mode === 'navigate' || acceptsHtml(request)", 'HTML navigation should use network-first handling');
assertIncludes(publicSw, 'event.respondWith(networkFirstApi(request, url));', 'API requests should use network-first handling');
assertIncludes(publicSw, 'event.respondWith(networkFirstRuntimeAsset(request));', 'runtime JS/CSS assets should always use network-first handling');
assertIncludes(publicSw, "fetch(new Request(request, { cache: 'reload' }))", 'runtime JS/CSS and HTML should bypass stale browser caches');
assert.ok(!publicSw.includes('isVersionedRuntimeAsset'), 'service worker should not branch on query-versioned runtime assets');
assert.ok(!publicSw.includes('cacheFirstRuntimeAsset'), 'service worker should not cache-first runtime assets by version marker');
assertIncludes(publicSw, 'event.respondWith(cacheFirstStatic(request));', 'non-runtime static assets should keep cache-first handling');
assertIncludes(publicSw, 'function isRuntimeAsset(pathname)', 'runtime asset routing should be centralized');
assertIncludes(publicSw, 'function isApiCacheEligible(url)', 'API cache eligibility should be centralized');
assertIncludes(publicSw, "if (pathname === '/api/health') return true;", 'health API should be cache eligible');
assertIncludes(publicSw, "if (pathname === '/api/system-data') {", 'readonly system_data selects should be cache eligible');
assertIncludes(publicSw, "searchParams.has('select')", 'system_data cache eligibility should require an explicit select');
assertIncludes(publicSw, "&& (searchParams.has('key') || searchParams.has('limit'));", 'system_data cache eligibility should require a bounded readonly query');
assertIncludes(publicSw, 'return false;', 'API cache eligibility should fail closed');
assertIncludes(publicSw, 'async function clearApiCacheAfterMutation(url)', 'API cache invalidation should be centralized');
assertIncludes(publicSw, "headers: buildOfflineHeaders('application/json; charset=utf-8')", 'offline API fallback should be JSON with charset');
assertIncludes(publicSw, "headers: buildOfflineHeaders('text/html; charset=utf-8')", 'offline HTML fallback should be HTML with charset');
assertIncludes(publicSw, "function buildOfflineHeaders(contentType)", 'offline fallback headers should be centralized');
assertIncludes(publicSw, "'Cache-Control': 'no-store'", 'offline fallback responses should not be stored');
assertIncludes(publicSw, "'X-Content-Type-Options': 'nosniff'", 'offline fallback responses should set nosniff');
assertIncludes(publicSw, '<title>离线模式</title>', 'offline HTML fallback should be localized');
assertIncludes(publicSw, "if (event.tag === 'sync-data')", 'background sync tag should remain explicit');
assert.ok(!publicSw.includes("console.log('[SW] loaded')"), 'service worker should not log on every load');
assert.ok(!/\/\/[^\n]*const\s+APP_SHELL_ASSETS/.test(publicSw), 'APP_SHELL_ASSETS declaration should not be hidden inside a comment');
assert.ok(scripts['build:pre'] && scripts['build:pre'].includes('scripts/build/update-runtime-cache-version.mjs'), 'build:pre should update runtime cache versions before Vite runs');
assertHeaderRule(publicHeaders, '/assets/js/*', 'no-store, max-age=0, must-revalidate', 'runtime JS assets should bypass browser and CDN storage');
assertHeaderRule(publicHeaders, '/assets/css/*', 'public, max-age=31536000, immutable', 'versioned CSS runtime assets should use immutable cache headers');
assertHeaderRule(publicHeaders, '/sw.js', 'no-store, max-age=0, must-revalidate', 'service worker script should bypass browser and CDN storage');
assertIncludes(serviceWorkerRuntime, `const SERVICE_WORKER_VERSION = '${serviceWorkerVersion}';`, 'service worker runtime should version registration updates');
assertIncludes(serviceWorkerRuntime, `const SERVICE_WORKER_PATH = './sw-${serviceWorkerVersion}.js';`, 'service worker runtime should use a content-versioned service worker pathname');
assert.strictEqual(distVersionedSw, distSw, 'content-versioned dist service worker should match the canonical service worker');
assert.ok(!srcIndex.includes('entrance-sound-runtime.js'), 'HTML should not load an entrance sound runtime without an approved source');
assert.ok(srcIndex.includes(`service-worker-runtime-${serviceWorkerVersion}.js`), 'HTML should content-version the service worker runtime loader pathname');
assert.ok(srcIndex.includes('runtime-loader-runtime.js') && !srcIndex.includes('runtime-loader-runtime.js?v='), 'HTML should not cache-bust the split runtime loader with query versions');
assert.ok(srcIndex.includes(`boot-runtime-${serviceWorkerVersion}.js`), 'HTML should content-version the boot runtime loader pathname');
assert.ok(!/\.\/assets\/js\/[^"']+\.js\?v=/.test(srcIndex), 'HTML should not query-version any runtime JS entry');
assert.ok(!srcIndex.includes('runtimeRefresh') && !srcIndex.includes('SCHOOL_RUNTIME_REFRESH_VERSION'), 'HTML should not depend on runtime version refresh stamps');
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
  cacheVersion,
  apiCachePolicy: 'health-and-bounded-system-data'
}, null, 2));
