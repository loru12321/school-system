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
  let content = read(relativePath);
  if (relativePath.endsWith('.jsonc')) {
    content = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
  }
  return JSON.parse(content);
}

function fileSize(relativePath) {
  return fs.statSync(path.join(root, relativePath)).size;
}

function assertIncludes(source, token, message) {
  assert.ok(source.includes(token), message || `missing token: ${token}`);
}

function assertScriptIncludes(scripts, name, token) {
  assert.ok(scripts[name], `${name} should be defined`);
  assertIncludes(scripts[name], token, `${name} should include ${token}`);
}

const packageJson = parseJson('package.json');
const scripts = packageJson.scripts || {};
const backlog = read('docs/optimization-backlog.md');
const runbook = read('docs/maintenance-runbook.md');
const readme = read('README.md');
const wrangler = parseJson('wrangler.jsonc');
const headers = read('public/_headers').replace(/\r\n/g, '\n');
const bootRuntime = read('public/assets/js/boot-runtime.js');
const edgeGatewayRuntime = read('public/assets/js/edge-gateway-runtime.js');
const cohortExamHydrationRuntime = read('public/assets/js/cohort-exam-hydration-runtime.js');
const runtimeLoaderRuntime = read('public/assets/js/runtime-loader-runtime.js');
const appRuntime = read('public/assets/js/app.js');
const dialogRuntime = read('public/assets/js/dialog-runtime.js');
const sw = read('public/sw.js');
const authState = read('public/assets/js/auth-state-runtime.js');
const accountAdmin = read('public/assets/js/account-admin-runtime.js');
const srcIndex = read('src/index.html');
const gateway = read('src/worker-gateway-d1.js');
const worker = read('src/worker-dummy.js');
const workerHelpers = read('src/worker-http-helpers.js');
const workerSystemData = read('src/worker-system-data.js');
const workerAssetProtection = read('src/worker-asset-protection.js');
const workerContractSource = [worker, workerHelpers, workerSystemData, workerAssetProtection].join('\n');
const freshmanExamRuntime = read('public/assets/js/freshman-exam-runtime.js');
const legacyReadme = read('scripts/legacy/README.md');

const guardedItems = [
  () => assertScriptIncludes(scripts, 'check:p0', 'check:release-data-safe'),
  () => assertScriptIncludes(scripts, 'check:p0', 'test:ui-copy-integrity'),
  () => assertScriptIncludes(scripts, 'check:p1', 'test:html-hygiene'),
  () => assertScriptIncludes(scripts, 'check:p1', 'test:service-worker-contract'),
  () => assertScriptIncludes(scripts, 'check:p2', 'test:docs-hygiene'),
  () => assertScriptIncludes(scripts, 'check:p2', 'test:release-automation'),
  () => assertScriptIncludes(scripts, 'check:p2', 'test:vendor-budget'),
  () => assertScriptIncludes(scripts, 'check:p2', 'smoke:prod-minimal'),
  () => assertScriptIncludes(scripts, 'check:release-fast', 'test:maintenance-priority-contract'),
  () => assertScriptIncludes(scripts, 'check:release-fast', 'test:worker-entrypoint-contract'),
  () => assertScriptIncludes(scripts, 'verify:prod-minimal', 'verify-production-minimal.mjs'),
  () => assertScriptIncludes(scripts, 'smoke:prod-minimal', 'verify:prod-minimal'),
  () => assertScriptIncludes(scripts, 'deploy:cloudflare:verified', 'wrangler deploy'),
  () => assertScriptIncludes(scripts, 'deploy:cloudflare:verified', 'smoke:prod-minimal'),
  () => assert.ok(!String(scripts.sync || '').includes('deploy:oss'), 'sync should not call legacy OSS deployment by default'),
  () => assertIncludes(readme, 'docs/optimization-backlog.md', 'README should link optimization backlog'),
  () => assertIncludes(readme, 'npx wrangler deploy', 'README should use portable Wrangler deployment'),
  () => assertIncludes(readme, 'scripts/legacy/', 'README should explain archived legacy scripts'),
  () => assert.ok(!readme.includes('C:\\Users\\'), 'README should not expose local Windows paths'),
  () => assertIncludes(runbook, 'npm run verify:prod-minimal', 'runbook should document minimal production verification'),
  () => assertIncludes(runbook, 'npm run smoke:prod-minimal', 'runbook should document minimal production smoke'),
  () => assertIncludes(runbook, 'scripts/legacy/', 'runbook should document legacy script archive'),
  () => assertIncludes(backlog, '## P0: production correctness', 'backlog should keep P0 section'),
  () => assertIncludes(backlog, '## P1: release quality and user experience', 'backlog should keep P1 section'),
  () => assertIncludes(backlog, '## P2: sustainable maintenance', 'backlog should keep P2 section'),
  () => assertIncludes(backlog, '## Optimization pass log', 'backlog should keep optimization pass log'),
  () => assert.ok((backlog.match(/^- /gm) || []).length >= 20, 'backlog should track at least 20 optimization items'),
  () => assertIncludes(legacyReadme, 'npx wrangler deploy', 'legacy README should point to Wrangler path'),
  () => assert.strictEqual(wrangler.main, 'src/worker-dummy.js', 'Worker entrypoint should stay explicit'),
  () => assert.strictEqual(wrangler.name, 'school-system', 'Worker name should match the project name'),
  () => assert.strictEqual(wrangler.assets.directory, './dist', 'Cloudflare should deploy dist assets'),
  () => assertIncludes(headers, 'Content-Type: text/html; charset=utf-8', 'HTML charset header should stay explicit'),
  () => assert.ok(!headers.includes('/downloads/*'), 'download headers should stay removed'),
  () => assertIncludes(headers, '/sw.js', 'service worker header should stay configured'),
  () => assert.ok(!exists('public/releases'), 'public release catalog should stay removed'),
  () => assert.ok(!exists('public/downloads'), 'public installer downloads should stay removed'),
  () => assert.ok(!exists('electron-builder.yml'), 'Electron Builder installer config should stay removed'),
  () => assert.ok(!exists('desktop'), 'Electron desktop shell should stay removed with Windows packages'),
  () => assert.ok(!exists('desktop/windows-client'), 'Windows installer source should stay removed'),
  () => assert.ok(!exists('scripts/ad-client-startup-update.ps1'), 'AD local Windows client updater should stay removed'),
  () => assert.ok(!exists('scripts/publish-ad-release.ps1'), 'AD local Windows client publisher should stay removed'),
  () => assert.ok(!exists('.github/workflows/build-apps-beta.yml'), 'native beta build workflow should stay removed'),
  () => assert.ok(!exists('.github/workflows/release-apps.yml'), 'native release workflow should stay removed'),
  () => assert.ok(!exists('src/worker-release-downloads.mjs'), 'Worker release download proxy should stay removed'),
  () => assert.ok(!scripts['desktop:build'], 'desktop installer build script should stay removed'),
  () => assert.ok(!scripts['desktop:start'], 'desktop runtime script should stay removed'),
  () => assert.ok(!packageJson.devDependencies?.electron, 'Electron dependency should stay removed'),
  () => assert.ok(!scripts['release:prepare-assets'], 'native release asset script should stay removed'),
  () => assert.ok(!scripts['test:release-manifest'], 'release manifest test script should stay removed'),
  () => assert.ok(!scripts['test:windows-installer-contract'], 'Windows installer contract script should stay removed'),
  () => assert.ok(!scripts['verify:windows-client-release'], 'Windows verifier script should stay removed'),
  () => assertIncludes(workerContractSource, "return 'no-store, max-age=0, must-revalidate, no-transform';", 'Worker HTML shell should bypass browser and CDN storage'),
  () => assert.ok(!workerContractSource.includes("pathname.startsWith('/downloads/')"), 'Worker should not route hosted installers'),
  () => assert.ok(!workerContractSource.includes('worker-release-downloads'), 'Worker should not import installer download proxy'),
  () => assert.strictEqual(wrangler.vars?.CLOUD_SYSTEM_DATA_MODE, 'primary', 'system_data should stay on D1 primary storage'),
  () => assert.ok((wrangler.d1_databases || []).some((db) => db.binding === 'CLOUD_SYSTEM_DATA_DB'), 'system_data D1 binding should stay configured'),
  () => assertIncludes(headers, 'max-age=31536000, immutable', 'versioned runtime JS should use immutable caching'),
  () => assertIncludes(headers, '/assets/css/*\n  Cache-Control: public, max-age=31536000, immutable', 'versioned runtime CSS should use immutable caching'),
  () => assertIncludes(sw, 'cacheFirstRuntimeAsset(request)', 'service worker should cache-first explicit-version runtime assets'),
  () => assertIncludes(sw, 'isVersionedRuntimeAsset(url)', 'service worker should detect explicit-version runtime assets'),
  () => assertIncludes(headers, 'Content-Security-Policy-Report-Only:', 'static headers should start CSP in report-only mode'),
  () => assertIncludes(headers, 'Content-Security-Policy:', 'static headers should enforce CSP after report-only rollout'),
  () => assertIncludes(worker, "url.pathname === '/api/csp-report'", 'Worker should accept CSP violation reports'),
  () => assertIncludes(runtimeLoaderRuntime, 'ensureXlsxVendorLoaded', 'runtime loader should lazy-load XLSX'),
  () => assertIncludes(bootRuntime, 'bindBootLoginActions', 'boot runtime should bind first-screen login actions before app modules load'),
  () => assert.ok(fileSize('public/assets/js/app.js') <= 910_000, 'public app.js should stay within tightened budget'),
  () => assert.ok(fileSize('public/assets/js/edge-gateway-runtime.js') <= 16_000, 'EdgeGateway runtime should stay focused'),
  () => assert.ok(fileSize('public/assets/js/boot-runtime.js') <= 85_000, 'boot runtime should stay within tightened budget'),
  () => assert.ok(fileSize('public/assets/js/runtime-loader-runtime.js') <= 58_000, 'runtime loader should stay within its split budget'),
  () => assertIncludes(bootRuntime, 'edge-gateway-runtime.js', 'boot runtime should load the split EdgeGateway runtime before app.js'),
  () => assertIncludes(bootRuntime, 'cohort-exam-hydration-runtime.js', 'boot runtime should load the split hydration scheduler before app.js'),
  () => assertIncludes(cohortExamHydrationRuntime, 'window.CohortExamHydrationScheduler', 'hydration scheduler should publish its runtime surface'),
  () => assertIncludes(edgeGatewayRuntime, 'isHostedGatewayUrl', 'EdgeGateway runtime should support hosted gateway URLs'),
  () => assertIncludes(dialogRuntime, 'UI.prompt = async function', 'dialog runtime should expose shared prompt modal API'),
  () => assert.ok(!gateway.includes('proxyGatewayActionToLegacyGateway'), 'auth cutover should keep D1 login/session verification Cloudflare-only'),
  () => assertIncludes(gateway, 'cloudflare-only-ready', 'account migration status should expose Cloudflare-only readiness'),
  () => assertIncludes(worker, 'CLOUDFLARE_GATEWAY_ACTION_NOT_SUPPORTED', 'unsupported gateway actions should not proxy to legacy Edge Functions'),
  () => assertIncludes(freshmanExamRuntime, 'window.UI.prompt', 'freshman exam access password should use shared prompt API'),
  () => ['123456', 'admin123', 'yssy2016'].forEach((token) => {
    [
      ['src/index.html', srcIndex],
      ['public/assets/js/app.js', appRuntime],
      ['public/assets/js/auth-state-runtime.js', authState],
      ['public/assets/js/account-admin-runtime.js', accountAdmin],
      ['public/assets/js/boot-runtime.js', bootRuntime],
      ['public/assets/js/runtime-loader-runtime.js', runtimeLoaderRuntime]
    ].forEach(([file, text]) => assert.ok(!text.includes(token), `${file} should not expose ${token}`));
  }),
  () => assertIncludes(gateway, "return source !== 'cloudflare_change';", 'gateway should force password change until user changes password'),
  () => assertIncludes(worker, "from './worker-http-helpers.js'", 'worker should use shared HTTP helpers'),
  () => assertIncludes(gateway, "from './worker-http-helpers.js'", 'D1 gateway should use shared HTTP helpers'),
  () => assertIncludes(workerHelpers, 'DEFAULT_ALLOWED_CORS_ORIGINS', 'shared worker helpers should own CORS origins'),
  () => assertIncludes(workerHelpers, 'HOP_BY_HOP_HEADERS', 'shared worker helpers should own hop-by-hop header list'),
  () => assert.ok(!read('public/assets/js/data-cloud-runtime.js').includes('console.log('), 'data cloud runtime should not emit production console.log noise')
];

guardedItems.forEach((check) => check());

console.log(JSON.stringify({
  ok: true,
  guardedMaintenanceItems: guardedItems.length,
  installerDistributionRemoved: true
}, null, 2));
