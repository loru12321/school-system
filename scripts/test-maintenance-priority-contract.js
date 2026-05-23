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

const guardedItems = [
  () => assertScriptIncludes(scripts, 'check:p0', 'check:release-data-safe'),
  () => assertScriptIncludes(scripts, 'check:p0', 'test:ui-copy-integrity'),
  () => assertScriptIncludes(scripts, 'check:p1', 'test:html-hygiene'),
  () => assertScriptIncludes(scripts, 'check:p1', 'test:service-worker-contract'),
  () => assertScriptIncludes(scripts, 'check:p1', 'test:runtime-hygiene'),
  () => assertScriptIncludes(scripts, 'check:p2', 'test:docs-hygiene'),
  () => assertScriptIncludes(scripts, 'check:p2', 'test:release-automation'),
  () => assertScriptIncludes(scripts, 'check:p2', 'test:vendor-budget'),
  () => assertScriptIncludes(scripts, 'check:release-fast', 'test:maintenance-priority-contract'),
  () => assertScriptIncludes(scripts, 'verify:prod-minimal', 'verify-production-minimal.mjs'),
  () => assertIncludes(readme, 'docs/optimization-backlog.md', 'README should link optimization backlog'),
  () => assertIncludes(readme, 'npx wrangler deploy', 'README should use portable Wrangler deployment'),
  () => assert.ok(!readme.includes('C:\\Users\\'), 'README should not expose local Windows paths'),
  () => assertIncludes(runbook, 'npm run verify:prod-minimal', 'runbook should document minimal production verification'),
  () => assertIncludes(backlog, '## P0: production correctness', 'backlog should keep P0 section'),
  () => assertIncludes(backlog, '## P1: release quality and user experience', 'backlog should keep P1 section'),
  () => assertIncludes(backlog, '## P2: sustainable maintenance', 'backlog should keep P2 section'),
  () => assert.ok((backlog.match(/^- /gm) || []).length >= 20, 'backlog should track at least 20 optimization items'),
  () => assert.strictEqual(wrangler.main, 'src/worker-dummy.js', 'Worker entrypoint should stay explicit'),
  () => assert.strictEqual(wrangler.assets.directory, './dist', 'Cloudflare should deploy dist assets'),
  () => assertIncludes(headers, 'Content-Type: text/html; charset=utf-8', 'HTML charset header should stay explicit'),
  () => assertIncludes(headers, '/downloads/*', 'download headers should stay configured'),
  () => assertIncludes(headers, '/sw.js', 'service worker header should stay configured'),
  () => assertIncludes(releaseSurface, 'dist/index.html', 'release surface should guard dist HTML'),
  () => assertIncludes(releaseHardening, 'hosted download payload', 'release hardening should guard hosted download payload'),
  () => assertIncludes(securityHygiene, 'APP_SESSION_SECRET_MISSING', 'security hygiene should guard fail-closed sessions'),
  () => assertIncludes(vendorBudget, 'ensureXlsxVendorLoaded', 'vendor budget should guard XLSX lazy loading'),
  () => assertIncludes(buildSizeBudget, 'distAppJs', 'build size budget should guard app bundle size'),
  () => assertIncludes(serviceWorkerContract, 'isApiCacheEligible', 'service worker contract should guard API cache policy'),
  () => assertIncludes(docsHygiene, 'optimization-backlog.md', 'docs hygiene should guard optimization backlog'),
  () => assertIncludes(ciWorkflow, 'npm run validate', 'CI should keep full validation'),
  () => assertIncludes(releaseWorkflow, 'npm run test:release-surface', 'release workflow should guard surface'),
  () => assertIncludes(performanceWorkflow, 'npm run check:release-fast', 'performance workflow should run fast release guards'),
  () => assertIncludes(bootRuntime, 'ensureXlsxVendorLoaded', 'boot runtime should lazy-load XLSX'),
  () => assert.ok(fileSize('public/assets/js/app.js') <= 930_000, 'public app.js should stay within budget'),
  () => assert.ok(fileSize('public/assets/js/boot-runtime.js') <= 135_000, 'boot runtime should stay within budget'),
  () => assert.ok(fileSize('public/assets/js/app-download-runtime.js') <= 76_000, 'download runtime should stay within budget'),
  () => assertIncludes(appRuntime, 'isHostedGatewayUrl', 'app runtime should support hosted gateway URLs'),
  () => assertIncludes(appDownloadRuntime, 'smartedu-windows-latest.zip', 'download runtime should keep Windows package URL'),
  () => assertIncludes(sw, 'CACHE_VERSION', 'service worker cache version should remain explicit')
];

guardedItems.forEach((check) => check());

console.log(JSON.stringify({
  ok: true,
  guardedMaintenanceItems: guardedItems.length
}, null, 2));
