const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const gateway = read('src/worker-gateway-d1.js');
const worker = read('src/worker-dummy.js');
const workerHelpers = read('src/worker-http-helpers.js');
const boot = read('public/assets/js/boot-runtime.js');
const runtimeLoader = read('public/assets/js/runtime-loader-runtime.js');
const app = read('public/assets/js/app.js');
const authState = read('public/assets/js/auth-state-runtime.js');
const accountAdmin = read('public/assets/js/account-admin-runtime.js');
const srcIndex = read('src/index.html');
const serviceWorker = read('public/sw.js');
const supabaseBootstrap = read('supabase/sql/000_app_tables_bootstrap.sql');
const keySensitiveFiles = [
    'wrangler.jsonc',
    'src/worker-gateway-d1.js',
    'src/worker-dummy.js',
    'scripts/migrate-system-data-to-cloudflare.js',
    'scripts/migrate-supabase-project-data.mjs',
    'scripts/migrate-gateway-data-to-cloudflare.mjs'
];

assert.ok(!gateway.includes('internal_gateway_secret_v1_fallback'), 'gateway must not fall back to a static session secret');
assert.ok(gateway.includes('throw new Error(\'APP_SESSION_SECRET_MISSING\')'), 'gateway must fail closed when APP_SESSION_SECRET is missing');
assert.ok(!gateway.includes('DEFAULT_LEGACY_GATEWAY_API_KEY'), 'gateway must not fall back to a static legacy Supabase key');
assert.ok(!worker.includes('DEFAULT_LEGACY_GATEWAY_API_KEY'), 'worker must not fall back to a static legacy Supabase key');
assert.ok(gateway.includes("from './worker-http-helpers.js'"), 'gateway should use shared HTTP helpers');
assert.ok(workerHelpers.includes('DEFAULT_ALLOWED_CORS_ORIGINS'), 'shared HTTP helpers should keep an explicit CORS allowlist');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(gateway), 'gateway should not emit wildcard CORS');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(worker), 'worker should not emit wildcard CORS');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(workerHelpers), 'shared HTTP helpers should not emit wildcard CORS');
assert.ok(worker.includes('WORKER_DEBUG_ERRORS'), 'worker stack traces should require an explicit debug flag');
assert.ok(!worker.includes("stack: error instanceof Error ? error.stack : ''"), 'worker should not expose stack traces by default');
assert.ok(!boot.includes('sb_publishable_'), 'boot runtime should not embed Supabase publishable keys');
assert.ok(!runtimeLoader.includes('sb_publishable_'), 'runtime loader should not embed Supabase publishable keys');
[
    ['src/index.html', srcIndex],
    ['public/assets/js/app.js', app],
    ['public/assets/js/auth-state-runtime.js', authState],
    ['public/assets/js/account-admin-runtime.js', accountAdmin],
    ['public/assets/js/boot-runtime.js', boot],
    ['public/assets/js/runtime-loader-runtime.js', runtimeLoader]
].forEach(([file, text]) => {
    ['123456', 'admin123', 'yssy2016'].forEach((token) => {
        assert.ok(!text.includes(token), `${file} should not expose weak default password ${token}`);
    });
});
for (const file of keySensitiveFiles) {
    assert.ok(!read(file).includes('sb_publishable_'), `${file} should not embed Supabase publishable keys`);
}
assert.ok(boot.includes("getBootStorageValue('SUPABASE_DIRECT_LOCAL') !== 'true'"), 'localhost should use the same-origin proxy unless direct local Supabase is explicitly requested');
assert.ok(
    boot.includes("return normalizeProxyOrigin(window.location.origin) + '/sb/rest/v1';"),
    'localhost REST compatibility client should use the same-origin Supabase proxy'
);
assert.ok(app.includes('isHostedGatewayUrl'), 'app EdgeGateway should recognize same-origin hosted gateway URLs');
assert.ok(
    app.includes("urls.length && (this.getPublishableKey() || urls.some(url => this.isHostedGatewayUrl(url)))"),
    'app EdgeGateway should allow same-origin hosted gateway calls without a browser-side publishable key'
);
assert.ok(app.includes('if (apikey) headers.apikey = apikey;'), 'app EdgeGateway should omit empty apikey headers for hosted gateway calls');
assert.ok(serviceWorker.includes('isApiCacheEligible'), 'service worker should gate API caching');
assert.ok(!serviceWorker.includes("console.log('[SW] loaded')"), 'service worker should not log on every load');
assert.ok(!boot.includes('DEMO_TOKEN'), 'boot runtime should not provide an offline admin demo token');
assert.ok(!runtimeLoader.includes('DEMO_TOKEN'), 'runtime loader should not provide an offline admin demo token');
assert.ok(!/\bpassword\s+text\b/i.test(supabaseBootstrap), 'Supabase bootstrap should not recreate the legacy plaintext password column');

console.log('security hygiene tests passed');
