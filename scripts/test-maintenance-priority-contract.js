const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function parseJson(relativePath) {
  return JSON.parse(read(relativePath));
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
const releaseSurface = read('scripts/test-release-surface.js');
const releaseHardening = read('scripts/test-release-hardening.js');
const securityHygiene = read('scripts/test-security-hygiene.js');
const vendorBudget = read('scripts/test-vendor-budget.js');
const buildSizeBudget = read('scripts/test-build-size-budget.js');
const serviceWorkerContract = read('scripts/test-service-worker-contract.js');
const docsHygiene = read('scripts/test-docs-hygiene.js');
const ciWorkflow = read('.github/workflows/ci.yml');
const releaseWorkflow = read('.github/workflows/release-apps.yml');
const performanceWorkflow = read('.github/workflows/performance-trend.yml');
const wrangler = parseJson('wrangler.jsonc');
const headers = read('public/_headers');
const bootRuntime = read('public/assets/js/boot-runtime.js');
const appRuntime = read('public/assets/js/app.js');
const appDownloadRuntime = read('public/assets/js/app-download-runtime.js');
const sw = read('public/sw.js');
const authState = read('public/assets/js/auth-state-runtime.js');
const accountAdmin = read('public/assets/js/account-admin-runtime.js');
const srcIndex = read('src/index.html');
const gateway = read('src/worker-gateway-d1.js');
const worker = read('src/worker-dummy.js');
const workerHelpers = read('src/worker-http-helpers.js');
const freshmanExamRuntime = read('public/assets/js/freshman-exam-runtime.js');
const legacyReadme = read('scripts/legacy/README.md');

const guardedItems = [
  () => assertScriptIncludes(scripts, 'check:p0', 'check:release-data-safe'),
  () => assertScriptIncludes(scripts, 'check:p0', 'test:ui-copy-integrity'),
  () => assertScriptIncludes(scripts, 'check:p1', 'test:html-hygiene'),
  () => assertScriptIncludes(scripts, 'check:p1', 'test:service-worker-contract'),
  () => assertScriptIncludes(scripts, 'check:p1', 'test:runtime-hygiene'),
  () => assertScriptIncludes(scripts, 'check:p2', 'test:docs-hygiene'),
  () => assertScriptIncludes(scripts, 'check:p2', 'test:release-automation'),
  () => assertScriptIncludes(scripts, 'check:p2', 'test:vendor-budget'),
  () => assertScriptIncludes(scripts, 'check:p2', 'smoke:prod-minimal'),
  () => assertScriptIncludes(scripts, 'check:release-fast', 'test:maintenance-priority-contract'),
  () => assertScriptIncludes(scripts, 'verify:prod-minimal', 'verify-production-minimal.mjs'),
  () => assertScriptIncludes(scripts, 'smoke:prod-minimal', 'verify:prod-minimal'),
  () => assertScriptIncludes(scripts, 'deploy:oss', 'scripts/legacy/deploy-oss.js'),
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
  () => assertIncludes(legacyReadme, 'direct-deploy', 'legacy README should document direct deploy archive'),
  () => assert.strictEqual(wrangler.main, 'src/worker-dummy.js', 'Worker entrypoint should stay explicit'),
  () => assert.strictEqual(wrangler.assets.directory, './dist', 'Cloudflare should deploy dist assets'),
  () => assertIncludes(headers, 'Content-Type: text/html; charset=utf-8', 'HTML charset header should stay explicit'),
  () => assertIncludes(headers, '/downloads/*', 'download headers should stay configured'),
  () => assertIncludes(headers, '/sw.js', 'service worker header should stay configured'),
  () => assertIncludes(releaseSurface, 'dist/index.html', 'release surface should guard dist HTML'),
  () => assertIncludes(releaseHardening, 'releasePackagesVerifiedFromManifest', 'release hardening should guard manifest-backed native packages'),
  () => assertIncludes(securityHygiene, 'APP_SESSION_SECRET_MISSING', 'security hygiene should guard fail-closed sessions'),
  () => assertIncludes(vendorBudget, 'ensureXlsxVendorLoaded', 'vendor budget should guard XLSX lazy loading'),
  () => assertIncludes(buildSizeBudget, 'distAppJs', 'build size budget should guard app bundle size'),
  () => assertIncludes(serviceWorkerContract, 'isApiCacheEligible', 'service worker contract should guard API cache policy'),
  () => assertIncludes(docsHygiene, 'optimization-backlog.md', 'docs hygiene should guard optimization backlog'),
  () => assertIncludes(ciWorkflow, 'npm run validate', 'CI should keep full validation'),
  () => assertIncludes(ciWorkflow, 'release-guards:', 'CI should split fast release guards into their own job'),
  () => assertIncludes(ciWorkflow, 'browser-smoke:', 'CI should split browser smoke into its own job'),
  () => assertIncludes(ciWorkflow, 'needs: release-guards', 'browser smoke should wait for fast release guards'),
  () => assertIncludes(releaseWorkflow, 'npm run test:release-surface', 'release workflow should guard surface'),
  () => assertIncludes(performanceWorkflow, 'npm run check:release-fast', 'performance workflow should run fast release guards'),
  () => assertIncludes(performanceWorkflow, '[skip performance]', 'performance workflow should support skip marker'),
  () => assert.ok(!readme.includes('C:\\Users\\'), 'README should remain free of local paths'),
  () => assertIncludes(headers, 'max-age=3600, stale-while-revalidate=86400', 'runtime JS should use short cache with background revalidation'),
  () => assertIncludes(bootRuntime, 'ensureXlsxVendorLoaded', 'boot runtime should lazy-load XLSX'),
  () => assertIncludes(bootRuntime, 'bindBootLoginActions', 'boot runtime should bind first-screen login actions before app modules load'),
  () => assertIncludes(bootRuntime, '[data-login-submit]', 'boot runtime should bind data-login-submit buttons'),
  () => assert.ok(fileSize('public/assets/js/app.js') <= 910_000, 'public app.js should stay within tightened budget'),
  () => assert.ok(fileSize('public/assets/js/boot-runtime.js') <= 130_000, 'boot runtime should stay within tightened budget'),
  () => assert.ok(fileSize('public/assets/js/app-download-runtime.js') <= 100_000, 'download runtime should stay within the multiplatform budget'),
  () => assertIncludes(appRuntime, 'isHostedGatewayUrl', 'app runtime should support hosted gateway URLs'),
  () => assertIncludes(appRuntime, 'prompt: async', 'app runtime should expose shared prompt modal API'),
  () => assertIncludes(appRuntime, 'confirm: async', 'app runtime should expose shared confirm modal API'),
  () => assertIncludes(appRuntime, 'alert: async', 'app runtime should expose shared alert modal API'),
  () => assertIncludes(freshmanExamRuntime, 'window.UI.prompt', 'freshman exam access password should use shared prompt API'),
  () => assert.ok(!freshmanExamRuntime.includes('例如: 123456'), 'freshman exam password prompt should not suggest weak defaults'),
  () => assertIncludes(appDownloadRuntime, 'school-system-windows-beta-20260621-9a362b3.exe', 'download runtime should keep the current Windows installer URL'),
  () => assertIncludes(sw, 'CACHE_VERSION', 'service worker cache version should remain explicit')
  ,() => ['123456', 'admin123', 'yssy2016'].forEach((token) => {
    [
      ['src/index.html', srcIndex],
      ['public/assets/js/app.js', appRuntime],
      ['public/assets/js/auth-state-runtime.js', authState],
      ['public/assets/js/account-admin-runtime.js', accountAdmin],
      ['public/assets/js/boot-runtime.js', bootRuntime]
    ].forEach(([file, text]) => assert.ok(!text.includes(token), `${file} should not expose ${token}`));
  }),
  () => assertIncludes(appRuntime, 'createManagedTemporaryPassword', 'account generation should use temporary passwords'),
  () => assertIncludes(appRuntime, '首次登录后必须改密', 'account generation should tell admins about mandatory password changes'),
  () => assertIncludes(gateway, "return source !== 'cloudflare_change';", 'gateway should force password change until user changes password'),
  () => assertIncludes(worker, "from './worker-http-helpers.js'", 'worker should use shared HTTP helpers'),
  () => assertIncludes(gateway, "from './worker-http-helpers.js'", 'D1 gateway should use shared HTTP helpers'),
  () => assertIncludes(workerHelpers, 'DEFAULT_ALLOWED_CORS_ORIGINS', 'shared worker helpers should own CORS origins'),
  () => assertIncludes(workerHelpers, 'HOP_BY_HOP_HEADERS', 'shared worker helpers should own hop-by-hop header list'),
  () => assert.ok(!bootRuntime.includes('console.log('), 'boot runtime should not emit production console.log noise'),
  () => assert.ok(!read('public/assets/js/data-cloud-runtime.js').includes('console.log('), 'data cloud runtime should not emit production console.log noise')
];

guardedItems.forEach((check) => check());

console.log(JSON.stringify({
  ok: true,
  guardedMaintenanceItems: guardedItems.length
}, null, 2));
