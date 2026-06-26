const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
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
const releaseSurface = read('scripts/test-release-surface.js');
const releaseHardening = read('scripts/test-release-hardening.js');
const workerEntrypointContract = read('scripts/test-worker-entrypoint-contract.js');
const securityHygiene = read('scripts/test-security-hygiene.js');
const vendorBudget = read('scripts/test-vendor-budget.js');
const buildSizeBudget = read('scripts/test-build-size-budget.js');
const serviceWorkerContract = read('scripts/test-service-worker-contract.js');
const docsHygiene = read('scripts/test-docs-hygiene.js');
const ciWorkflow = read('.github/workflows/ci.yml');
const releaseWorkflow = read('.github/workflows/release-apps.yml');
const betaWorkflow = read('.github/workflows/build-apps-beta.yml');
const deployWorkflow = read('.github/workflows/deploy-cloudflare.yml');
const performanceWorkflow = read('.github/workflows/performance-trend.yml');
const supabaseBootstrap = read('supabase/sql/000_app_tables_bootstrap.sql');
const supabaseSystemUsersRls = read('supabase/sql/006_system_users_rls_lockdown.sql');
const wrangler = parseJson('wrangler.jsonc');
const headers = read('public/_headers').replace(/\r\n/g, '\n');
const bootRuntime = read('public/assets/js/boot-runtime.js');
const edgeGatewayRuntime = read('public/assets/js/edge-gateway-runtime.js');
const cohortExamHydrationRuntime = read('public/assets/js/cohort-exam-hydration-runtime.js');
const runtimeLoaderRuntime = read('public/assets/js/runtime-loader-runtime.js');
const bootRuntimeSurface = `${bootRuntime}\n${runtimeLoaderRuntime}`;
const appRuntime = read('public/assets/js/app.js');
const dialogRuntime = read('public/assets/js/dialog-runtime.js');
const dialogRuntimeContract = read('scripts/test-dialog-runtime-contract.js');
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
  () => assertScriptIncludes(scripts, 'check:release-fast', 'test:worker-entrypoint-contract'),
  () => assertScriptIncludes(scripts, 'check:release-fast', 'test:dialog-runtime-contract'),
  () => assertScriptIncludes(scripts, 'verify:prod-minimal', 'verify-production-minimal.mjs'),
  () => assertScriptIncludes(scripts, 'smoke:prod-minimal', 'verify:prod-minimal'),
  () => assertScriptIncludes(scripts, 'deploy:cloudflare:verified', 'wrangler deploy'),
  () => assertScriptIncludes(scripts, 'deploy:cloudflare:verified', 'smoke:prod-minimal'),
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
  () => assert.strictEqual(wrangler.name, 'school-system', 'Worker name should match the project name'),
  () => assert.strictEqual(wrangler.assets.directory, './dist', 'Cloudflare should deploy dist assets'),
  () => assertIncludes(headers, 'Content-Type: text/html; charset=utf-8', 'HTML charset header should stay explicit'),
  () => assertIncludes(headers, '/index.html\n  Content-Type: text/html; charset=utf-8\n  Cache-Control: no-cache, max-age=0, must-revalidate', 'index HTML should stay revalidation-friendly'),
  () => assertIncludes(worker, "return 'no-cache, max-age=0, must-revalidate, no-transform';", 'Worker HTML shell should force strict revalidation'),
  () => assertIncludes(headers, '/downloads/*', 'download headers should stay configured'),
  () => assertIncludes(headers, '/sw.js', 'service worker header should stay configured'),
  () => assertIncludes(releaseSurface, 'dist/index.html', 'release surface should guard dist HTML'),
  () => assertIncludes(workerEntrypointContract, 'exactly one Wrangler config', 'Worker entrypoint contract should reject alternate root Wrangler configs'),
  () => assertIncludes(workerEntrypointContract, 'schoolsystem.com.cn/*', 'Worker entrypoint contract should guard production routes'),
  () => assertIncludes(releaseHardening, 'releasePackagesVerifiedFromManifest', 'release hardening should guard manifest-backed native packages'),
  () => assertIncludes(securityHygiene, 'APP_SESSION_SECRET_MISSING', 'security hygiene should guard fail-closed sessions'),
  () => assertIncludes(vendorBudget, 'ensureXlsxVendorLoaded', 'vendor budget should guard XLSX lazy loading'),
  () => assertIncludes(buildSizeBudget, 'distAppJs', 'build size budget should guard app bundle size'),
  () => assertIncludes(serviceWorkerContract, 'isApiCacheEligible', 'service worker contract should guard API cache policy'),
  () => assertIncludes(docsHygiene, 'optimization-backlog.md', 'docs hygiene should guard optimization backlog'),
  () => assertIncludes(ciWorkflow, 'npm run validate', 'CI should keep full validation'),
  () => assertIncludes(ciWorkflow, 'p0-quick:', 'CI should keep a dedicated P0 quick gate'),
  () => assertIncludes(ciWorkflow, 'npm run check:p0', 'CI P0 quick gate should run check:p0'),
  () => assertIncludes(ciWorkflow, 'needs: p0-quick', 'CI release guards should wait for the P0 quick gate'),
  () => assertIncludes(ciWorkflow, 'release-guards:', 'CI should split fast release guards into their own job'),
  () => assertIncludes(ciWorkflow, 'browser-smoke:', 'CI should split browser smoke into its own job'),
  () => assertIncludes(ciWorkflow, 'needs: release-guards', 'browser smoke should wait for fast release guards'),
  () => assertIncludes(releaseWorkflow, 'npm run test:release-surface', 'release workflow should guard surface'),
  () => assertIncludes(deployWorkflow, 'npx wrangler deploy', 'Cloudflare deploy workflow should deploy with Wrangler'),
  () => assertIncludes(deployWorkflow, 'npm run smoke:prod-minimal', 'Cloudflare deploy workflow should smoke production after deployment'),
  () => assert.ok(deployWorkflow.indexOf('npx wrangler deploy') < deployWorkflow.indexOf('npm run smoke:prod-minimal'), 'Cloudflare deploy workflow should smoke only after deployment'),
  () => assertIncludes(performanceWorkflow, 'npm run check:release-fast', 'performance workflow should run fast release guards'),
  () => assertIncludes(performanceWorkflow, 'npm run test:performance-thresholds', 'performance workflow should fail obvious regressions'),
  () => assertIncludes(performanceWorkflow, '[skip performance]', 'performance workflow should support skip marker'),
  () => assert.ok(!scripts['check:android-signing-secrets'], 'Android signing precheck should stay removed from package scripts'),
  () => assert.ok(!betaWorkflow.includes('android') && !betaWorkflow.includes('ios'), 'beta app workflow should stay Windows-only'),
  () => assert.ok(!releaseWorkflow.includes('android') && !releaseWorkflow.includes('ios'), 'stable app workflow should stay Windows-only'),
  () => assert.strictEqual(wrangler.vars?.CLOUD_SYSTEM_DATA_MODE, 'primary', 'system_data should stay on D1 primary storage'),
  () => assert.ok((wrangler.d1_databases || []).some((db) => db.binding === 'CLOUD_SYSTEM_DATA_DB'), 'system_data D1 binding should stay configured'),
  () => assert.ok(!/\bpassword\s+text\b/i.test(supabaseBootstrap), 'Supabase bootstrap should not recreate plaintext account passwords'),
  () => assertIncludes(supabaseBootstrap, 'alter table public.system_users enable row level security', 'Supabase bootstrap should enable RLS on system_users'),
  () => assertIncludes(supabaseBootstrap, 'revoke all on public.system_users from anon, authenticated', 'Supabase bootstrap should revoke browser roles from system_users'),
  () => assertIncludes(supabaseSystemUsersRls, 'alter table if exists public.system_users enable row level security', 'Supabase RLS migration should enable RLS on existing system_users'),
  () => assertIncludes(supabaseSystemUsersRls, 'revoke all on public.system_users from anon, authenticated', 'Supabase RLS migration should revoke browser roles from existing system_users'),
  () => assert.ok(!readme.includes('C:\\Users\\'), 'README should remain free of local paths'),
  () => assertIncludes(headers, 'max-age=31536000, immutable', 'versioned runtime JS should use immutable caching'),
  () => assertIncludes(headers, '/assets/css/*\n  Cache-Control: public, max-age=31536000, immutable', 'versioned runtime CSS should use immutable caching'),
  () => assertIncludes(sw, 'cacheFirstRuntimeAsset(request)', 'service worker should cache-first explicit-version runtime assets'),
  () => assertIncludes(sw, 'isVersionedRuntimeAsset(url)', 'service worker should detect explicit-version runtime assets'),
  () => assertIncludes(headers, 'Content-Security-Policy-Report-Only:', 'static headers should start CSP in report-only mode'),
  () => assertIncludes(headers, 'Content-Security-Policy:', 'static headers should enforce CSP after report-only rollout'),
  () => assertIncludes(headers, "'unsafe-eval'", 'CSP should temporarily allow Alpine expression evaluation until inline expressions are removed'),
  () => assertIncludes(worker, "url.pathname === '/api/csp-report'", 'Worker should accept CSP violation reports'),
  () => assertIncludes(worker, 'const [d1Response, supabaseResponse] = await Promise.all([', 'hybrid system_data writes should dual-write concurrently'),
  () => assertIncludes(headers, '/sw.js', 'service worker should keep a dedicated revalidation header'),
  () => assertIncludes(runtimeLoaderRuntime, 'ensureXlsxVendorLoaded', 'runtime loader should lazy-load XLSX'),
  () => assertIncludes(bootRuntime, 'bindBootLoginActions', 'boot runtime should bind first-screen login actions before app modules load'),
  () => assertIncludes(bootRuntime, '[data-login-submit]', 'boot runtime should bind data-login-submit buttons'),
  () => assert.ok(fileSize('public/assets/js/app.js') <= 910_000, 'public app.js should stay within tightened budget'),
  () => assert.ok(fileSize('public/assets/js/app.js') <= 790_000, 'public app.js should preserve the hydration scheduler runtime split'),
  () => assert.ok(fileSize('public/assets/js/cohort-exam-hydration-runtime.js') <= 7_000, 'cohort exam hydration runtime should stay focused'),
  () => assert.ok(fileSize('public/assets/js/edge-gateway-runtime.js') <= 16_000, 'EdgeGateway runtime should stay focused'),
  () => assert.ok(fileSize('public/assets/js/boot-runtime.js') <= 85_000, 'boot runtime should stay within tightened budget'),
  () => assert.ok(fileSize('public/assets/js/runtime-loader-runtime.js') <= 58_000, 'runtime loader should stay within its split budget'),
  () => assert.ok(fileSize('lt.html.br') <= 330_000, 'offline lt.html Brotli artifact should stay compressed enough for distribution'),
  () => assertIncludes(bootRuntime, 'edge-gateway-runtime.js', 'boot runtime should load the split EdgeGateway runtime before app.js'),
  () => assertIncludes(bootRuntime, 'cohort-exam-hydration-runtime.js', 'boot runtime should load the split hydration scheduler before app.js'),
  () => assertIncludes(cohortExamHydrationRuntime, 'window.CohortExamHydrationScheduler', 'hydration scheduler should publish its runtime surface'),
  () => assertIncludes(edgeGatewayRuntime, 'isHostedGatewayUrl', 'EdgeGateway runtime should support hosted gateway URLs'),
  () => assertIncludes(dialogRuntime, 'UI.prompt = async function', 'dialog runtime should expose shared prompt modal API'),
  () => assertIncludes(dialogRuntime, 'UI.confirm = async function', 'dialog runtime should expose shared confirm modal API'),
  () => assertIncludes(dialogRuntime, 'UI.alert = async function', 'dialog runtime should expose shared alert modal API'),
  () => assert.ok(!gateway.includes('proxyGatewayActionToLegacyGateway'), 'auth cutover should keep D1 login/session verification Cloudflare-only'),
  () => assertIncludes(gateway, 'cloudflare-only-ready', 'account migration status should expose Cloudflare-only readiness'),
  () => assertIncludes(worker, 'CLOUDFLARE_GATEWAY_ACTION_NOT_SUPPORTED', 'unsupported gateway actions should not proxy to legacy Edge Functions'),
  () => assertIncludes(dialogRuntimeContract, 'tmPromptInput', 'dialog runtime contract should guard teaching management prompts'),
  () => assertIncludes(dialogRuntimeContract, 'promptTeacherTermId', 'dialog runtime contract should guard teacher sync prompts'),
  () => assertIncludes(dialogRuntimeContract, 'confirmReportExport', 'dialog runtime contract should guard report export confirmation'),
  () => assertIncludes(freshmanExamRuntime, 'window.UI.prompt', 'freshman exam access password should use shared prompt API'),
  () => assert.ok(!freshmanExamRuntime.includes('例如: 123456'), 'freshman exam password prompt should not suggest weak defaults'),
  () => assertIncludes(sw, 'CACHE_VERSION', 'service worker cache version should remain explicit')
  ,() => ['123456', 'admin123', 'yssy2016'].forEach((token) => {
    [
      ['src/index.html', srcIndex],
      ['public/assets/js/app.js', appRuntime],
      ['public/assets/js/auth-state-runtime.js', authState],
      ['public/assets/js/account-admin-runtime.js', accountAdmin],
      ['public/assets/js/boot-runtime.js', bootRuntime],
      ['public/assets/js/runtime-loader-runtime.js', runtimeLoaderRuntime]
    ].forEach(([file, text]) => assert.ok(!text.includes(token), `${file} should not expose ${token}`));
  }),
  () => assertIncludes(appRuntime, 'createManagedTemporaryPassword', 'account generation should use temporary passwords'),
  () => assertIncludes(appRuntime, '首次登录后必须改密', 'account generation should tell admins about mandatory password changes'),
  () => assertIncludes(gateway, "return source !== 'cloudflare_change';", 'gateway should force password change until user changes password'),
  () => assertIncludes(worker, "from './worker-http-helpers.js'", 'worker should use shared HTTP helpers'),
  () => assertIncludes(gateway, "from './worker-http-helpers.js'", 'D1 gateway should use shared HTTP helpers'),
  () => assertIncludes(workerHelpers, 'DEFAULT_ALLOWED_CORS_ORIGINS', 'shared worker helpers should own CORS origins'),
  () => assertIncludes(workerHelpers, 'HOP_BY_HOP_HEADERS', 'shared worker helpers should own hop-by-hop header list'),
  () => assert.ok(!bootRuntimeSurface.includes('console.log('), 'boot runtime surface should not emit production console.log noise'),
  () => assert.ok(!read('public/assets/js/data-cloud-runtime.js').includes('console.log('), 'data cloud runtime should not emit production console.log noise')
];

guardedItems.forEach((check) => check());

console.log(JSON.stringify({
  ok: true,
  guardedMaintenanceItems: guardedItems.length
}, null, 2));
