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
const refreshVersion = extract(srcIndex, /var\s+refreshVersion\s*=\s*'([^']+)'/, 'early refresh version');
const cacheVersion = extract(publicSw, /const\s+CACHE_VERSION\s*=\s*'([^']+)'/, 'service worker cache version');

assert.match(serviceWorkerVersion, /^runtime-[0-9a-f]{12}$/, 'runtime version should be content-hash shaped');
assert.strictEqual(bootVersion, serviceWorkerVersion, 'boot runtime fallback should match generated runtime version');
assert.strictEqual(refreshVersion, serviceWorkerVersion, 'early refresh guard should match generated runtime version');
assert.strictEqual(cacheVersion, `school-system-${serviceWorkerVersion}`, 'service worker cache should follow generated runtime version');
assert.ok(srcIndex.includes(`runtime-loader-runtime.js?v=${serviceWorkerVersion}`), 'runtime loader script tag should use generated runtime version');
assert.ok(srcIndex.includes(`boot-runtime.js?v=${serviceWorkerVersion}`), 'boot runtime script tag should use generated runtime version');
assert.ok(srcIndex.includes(`service-worker-runtime.js?v=${serviceWorkerVersion}`), 'service worker runtime script tag should use generated runtime version');
assert.ok(packageJson.scripts.build.includes('scripts/build/update-runtime-cache-version.mjs'), 'build script should update runtime versions before bundling');
assert.ok(buildScript.includes('normalizeVersionTokens'), 'version generator should normalize existing version tokens before hashing');
assert.ok(buildScript.includes("public', 'assets', 'js'"), 'version generator should hash public runtime JS sources');

console.log(JSON.stringify({ ok: true, runtimeVersion: serviceWorkerVersion }, null, 2));
