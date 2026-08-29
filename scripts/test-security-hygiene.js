const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const gateway = read('src/worker-gateway-d1.js');
const gatewayAuth = read('src/worker-auth.js');
const gatewayAccounts = read('src/worker-accounts.js');
const gatewayVersions = read('src/worker-versions.js');
const gatewayDataQuality = read('src/worker-data-quality.js');
const gatewayAssessment = read('src/worker-assessment.js');
const gatewayCrypto = read('src/worker-crypto.js');
const gatewayContractSource = [
    gateway,
    gatewayAuth,
    gatewayAccounts,
    gatewayVersions,
    gatewayDataQuality,
    gatewayAssessment,
    gatewayCrypto
].join('\n');
const worker = read('src/worker-dummy.js');
const workerHelpers = read('src/worker-http-helpers.js');
const workerSystemData = read('src/worker-system-data.js');
const workerAssetProtection = read('src/worker-asset-protection.js');
const workerContractSource = [worker, workerHelpers, workerSystemData, workerAssetProtection].join('\n');
const boot = read('public/assets/js/boot-runtime.js');
const edgeGateway = read('public/assets/js/edge-gateway-runtime.js');
const gatewaySession = read('public/assets/js/gateway-session-runtime.js');
const runtimeLoader = read('public/assets/js/runtime-loader-runtime.js');
const app = read('public/assets/js/app.js');
const authState = read('public/assets/js/auth-state-runtime.js');
const accountAdmin = read('public/assets/js/account-admin-runtime.js');
const srcIndex = read('src/index.html');
const serviceWorker = read('public/sw.js');
const publicHeaders = read('public/_headers');
const supabaseBootstrap = read('supabase/sql/000_app_tables_bootstrap.sql');
const supabaseLegacyLockdown = read('supabase/sql/009_lockdown_legacy_public_tables.sql');
const keySensitiveFiles = [
    'wrangler.jsonc',
    'src/worker-gateway-d1.js',
    'src/worker-dummy.js',
    'scripts/migrate-system-data-to-cloudflare.js',
    'scripts/migrate-supabase-project-data.mjs',
    'scripts/migrate-gateway-data-to-cloudflare.mjs'
];
const migrationScripts = [
    'scripts/migrate-supabase-project-data.mjs',
    'scripts/migrate-gateway-data-to-cloudflare.mjs'
];

assert.ok(!gatewayContractSource.includes('internal_gateway_secret_v1_fallback'), 'gateway must not fall back to a static session secret');
assert.ok(gatewayContractSource.includes('throw new Error(\'APP_SESSION_SECRET_MISSING\')'), 'gateway must fail closed when APP_SESSION_SECRET is missing');
assert.ok(!gatewayContractSource.includes('DEFAULT_LEGACY_GATEWAY_API_KEY'), 'gateway must not fall back to a static legacy Supabase key');
assert.ok(!workerContractSource.includes('DEFAULT_LEGACY_GATEWAY_API_KEY'), 'worker must not fall back to a static legacy Supabase key');
assert.ok(!workerSystemData.includes("request.headers.get('apikey')"), 'Worker Supabase REST proxy must not trust browser-provided apikey headers');
assert.ok(workerSystemData.includes("import { resolveSession, hasAnyRole, isAdmin } from './worker-auth.js';"), 'system_data auth must require gateway sessions and role helpers');
assert.ok(workerSystemData.includes('const auth = await requireSystemDataSession(request, env);'), 'system_data reads and writes must require gateway sessions before backend dispatch');
assert.ok(workerSystemData.includes('requireRestWriteSession(request, env)'), 'managed REST writes must require gateway sessions');
assert.ok(workerSystemData.includes("'/sb/rest/v1/issues'") && workerSystemData.includes("'/sb/rest/v1/system_logs'"), 'mutable management REST tables should be session-protected');
assert.ok(!boot.includes("localStorage.getItem('EDGE_GATEWAY_URL')"), 'boot login shell should not accept gateway endpoints from localStorage');
assert.ok(gateway.includes("from './worker-http-helpers.js'"), 'gateway should use shared HTTP helpers');
assert.ok(workerHelpers.includes('DEFAULT_ALLOWED_CORS_ORIGINS'), 'shared HTTP helpers should keep an explicit CORS allowlist');
assert.ok(workerHelpers.includes('DEFAULT_ALLOWED_CORS_HEADERS'), 'shared HTTP helpers should use a fixed CORS request-header allowlist');
assert.ok(!workerHelpers.includes("request.headers.get('Access-Control-Request-Headers')"), 'shared HTTP helpers must not reflect arbitrary CORS request headers');
assert.ok(workerHelpers.includes("if (normalizedOrigin === 'null') return '';"), 'shared HTTP helpers should reject null Origin instead of reflecting it');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(gatewayContractSource), 'gateway should not emit wildcard CORS');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(workerContractSource), 'worker should not emit wildcard CORS');
assert.ok(!/Access-Control-Allow-Origin['"]:\s*['"]\*/.test(workerHelpers), 'shared HTTP helpers should not emit wildcard CORS');
assert.ok(workerContractSource.includes('WORKER_DEBUG_ERRORS'), 'worker stack traces should require an explicit debug flag');
assert.ok(!workerContractSource.includes("stack: error instanceof Error ? error.stack : ''"), 'worker should not expose stack traces by default');
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
for (const file of migrationScripts) {
    const source = read(file);
    assert.ok(!source.includes('admin123'), `${file} must not carry a shared default administrator password`);
    assert.ok(source.includes("requireSecretEnv('MIGRATION_ADMIN_PASS')"), `${file} must require an explicit migration administrator password`);
}
assert.ok(boot.includes("getBootStorageValue('SUPABASE_DIRECT_LOCAL') !== 'true'"), 'localhost should use the same-origin proxy unless direct local Supabase is explicitly requested');
const retiredSupabaseProjectRef = ['dpwsxxgo', 'jpqevzwyxrot'].join('');
assert.ok(!boot.includes(retiredSupabaseProjectRef), 'boot runtime should not hardcode the legacy Supabase project ref');
assert.ok(!workerContractSource.includes(retiredSupabaseProjectRef), 'Worker should not hardcode the legacy Supabase project ref');
assert.ok(
    boot.includes("return normalizeProxyOrigin(window.location.origin) + '/sb/rest/v1';"),
    'localhost REST compatibility client should use the same-origin Supabase proxy'
);
assert.ok(edgeGateway.includes('isHostedGatewayUrl'), 'EdgeGateway runtime should recognize same-origin hosted gateway URLs');
assert.ok(
    edgeGateway.includes("urls.length && (this.getPublishableKey() || urls.some(url => this.isHostedGatewayUrl(url)))"),
    'EdgeGateway runtime should allow same-origin hosted gateway calls without a browser-side publishable key'
);
assert.ok(gatewaySession.includes('if (apikey) headers.apikey = apikey;'), 'gateway session runtime should omit empty apikey headers for hosted gateway calls');
assert.ok(!edgeGateway.includes("localStorage.getItem('EDGE_GATEWAY_URL')"), 'EdgeGateway runtime should not accept gateway endpoints from localStorage');
assert.ok(serviceWorker.includes('isApiCacheEligible'), 'service worker should gate API caching');
assert.ok(!serviceWorker.includes("console.log('[SW] loaded')"), 'service worker should not log on every load');
assert.ok(publicHeaders.includes('Content-Security-Policy-Report-Only:'), 'static headers should start CSP in report-only mode');
assert.ok(publicHeaders.includes('Content-Security-Policy:'), 'static headers should enforce CSP after report-only rollout');
assert.ok(publicHeaders.includes("'unsafe-eval' 'wasm-unsafe-eval'"), 'CSP should allow the current Alpine expression runtime without production console failures');
assert.ok(worker.includes("url.pathname === '/api/csp-report'"), 'worker should receive CSP violation reports');
assert.ok(!boot.includes('DEMO_TOKEN'), 'boot runtime should not provide an offline admin demo token');
assert.ok(!runtimeLoader.includes('DEMO_TOKEN'), 'runtime loader should not provide an offline admin demo token');
assert.ok(!/\bpassword\s+text\b/i.test(supabaseBootstrap), 'Supabase bootstrap should not recreate the legacy plaintext password column');
[
    'system_data',
    'issues',
    'system_logs',
    'migration_runs'
].forEach((table) => {
    const enableRls = new RegExp(`alter table (if exists )?public\\.${table} enable row level security`, 'i');
    const revokeDirect = new RegExp(`revoke all on public\\.${table} from anon, authenticated`, 'i');
    assert.ok(enableRls.test(supabaseBootstrap), `Supabase bootstrap should enable RLS on ${table}`);
    assert.ok(revokeDirect.test(supabaseBootstrap), `Supabase bootstrap should revoke direct browser grants on ${table}`);
    assert.ok(enableRls.test(supabaseLegacyLockdown), `legacy lockdown migration should enable RLS on ${table}`);
    assert.ok(revokeDirect.test(supabaseLegacyLockdown), `legacy lockdown migration should revoke direct browser grants on ${table}`);
});

console.log('security hygiene tests passed');
