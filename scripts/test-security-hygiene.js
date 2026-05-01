const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const gateway = read('src/worker-gateway-d1.js');
const worker = read('src/worker-dummy.js');
const boot = read('public/assets/js/boot-runtime.js');
const serviceWorker = read('public/sw.js');

assert.ok(!gateway.includes('internal_gateway_secret_v1_fallback'), 'gateway must not fall back to a static session secret');
assert.ok(gateway.includes('throw new Error(\'APP_SESSION_SECRET_MISSING\')'), 'gateway must fail closed when APP_SESSION_SECRET is missing');
assert.ok(!worker.includes('DEFAULT_LEGACY_GATEWAY_API_KEY'), 'worker must not fall back to a static legacy Supabase key');
assert.ok(gateway.includes('DEFAULT_ALLOWED_CORS_ORIGINS'), 'gateway should keep an explicit CORS allowlist');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(gateway), 'gateway should not emit wildcard CORS');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(worker), 'worker should not emit wildcard CORS');
assert.ok(!boot.includes('sb_publishable_'), 'boot runtime should not embed Supabase publishable keys');
assert.ok(boot.includes("getBootStorageValue('SUPABASE_DIRECT_LOCAL') !== 'true'"), 'localhost should use the same-origin proxy unless direct local Supabase is explicitly requested');
assert.ok(
    boot.includes("return normalizeProxyOrigin(window.location.origin) + '/sb/rest/v1';"),
    'localhost REST compatibility client should use the same-origin Supabase proxy'
);
assert.ok(serviceWorker.includes('isApiCacheEligible'), 'service worker should gate API caching');
assert.ok(!serviceWorker.includes("console.log('[SW] loaded')"), 'service worker should not log on every load');

console.log('security hygiene tests passed');
