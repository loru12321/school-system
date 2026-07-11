const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function extract(source, pattern, label) {
  const match = source.match(pattern);
  assert.ok(match, `${label} should exist`);
  return match[1];
}

const packageJson = JSON.parse(read('package.json'));
const srcIndex = read('src/index.html');
const bootRuntime = read('public/assets/js/boot-runtime.js');
const serviceWorkerRuntime = read('public/assets/js/service-worker-runtime.js');
const publicSw = read('public/sw.js');
const buildScript = read('scripts/build/update-runtime-cache-version.mjs');

const serviceWorkerVersion = extract(serviceWorkerRuntime, /const\s+SERVICE_WORKER_VERSION\s*=\s*'([^']+)'/, 'service worker version');
const bootVersion = extract(bootRuntime, /var\s+BOOT_ASSET_VERSION_FALLBACK\s*=\s*'([^']+)'/, 'boot asset version');
const cacheVersion = extract(publicSw, /const\s+CACHE_VERSION\s*=\s*'([^']+)'/, 'service worker cache version');

assert.match(serviceWorkerVersion, /^runtime-[0-9a-f]{12}$/, 'runtime version should be content-hash shaped');
assert.strictEqual(bootVersion, serviceWorkerVersion, 'boot runtime fallback should match generated runtime version');
assert.strictEqual(cacheVersion, `school-system-${serviceWorkerVersion}`, 'service worker cache should follow generated runtime version');
assert.ok(!srcIndex.includes('runtimeRefresh'), 'HTML should not depend on runtimeRefresh query-cache churn');
assert.ok(!srcIndex.includes('SCHOOL_RUNTIME_REFRESH_VERSION'), 'HTML should not depend on local runtime version stamps');
assert.ok(srcIndex.includes('entrance-sound-runtime.js') && !srcIndex.includes('entrance-sound-runtime.js?v='), 'entrance sound runtime should not depend on query-versioned caching');
assert.match(srcIndex, /runtime-loader-runtime-runtime-[0-9a-f]{12}\.js/, 'runtime loader should use a content-versioned filename');
assert.ok(srcIndex.includes(`boot-runtime-${serviceWorkerVersion}.js`), 'boot runtime should use a content-versioned pathname that bypasses stale CDN objects');
assert.ok(srcIndex.includes(`service-worker-runtime-${serviceWorkerVersion}.js`), 'service worker runtime loader should use a content-versioned pathname');
assert.ok(serviceWorkerRuntime.includes(`const SERVICE_WORKER_PATH = './sw-${serviceWorkerVersion}.js';`), 'service worker registration should use a content-versioned script pathname');
assert.ok(!/\.\/assets\/js\/[^"']+\.js\?v=/.test(srcIndex), 'HTML should not query-version any runtime JS entry');
assert.ok(packageJson.scripts['build:pre'] && packageJson.scripts['build:pre'].includes('scripts/build/update-runtime-cache-version.mjs'), 'build:pre should update runtime versions before bundling');
assert.ok(buildScript.includes('normalizeVersionTokens'), 'version generator should normalize existing version tokens before hashing');
assert.ok(buildScript.includes("public', 'assets', 'js'"), 'version generator should hash public runtime JS sources');

console.log(JSON.stringify({ ok: true, runtimeVersion: serviceWorkerVersion }, null, 2));
