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

const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const manifestText = read('public/site.webmanifest');
const manifest = JSON.parse(manifestText);
const publicHeaders = read('public/_headers');
const srcIndex = read('src/index.html');
const swRuntime = read('public/assets/js/service-worker-runtime.js');
const worker = read('src/worker-dummy.js');
const performanceWorkflow = read('.github/workflows/performance-trend.yml');
const userFacingReleaseFiles = [
  'public/site.webmanifest',
  'public/assets/js/app.js',
  'public/assets/js/app-foundation-runtime.js'
];

assert.strictEqual(scripts['test:release-hardening'], 'node scripts/test-release-hardening.js', 'release hardening script should be exposed');
assert.strictEqual(scripts.build, 'npm-run-all build:pre build:core build:post', 'build should be split into readable phases');
assert.ok(scripts['build:pre'] && scripts['build:pre'].includes('update-runtime-cache-version.mjs'), 'build:pre should prepare runtime versions');
assert.strictEqual(scripts['build:core'], 'vite build', 'build:core should own Vite compilation');
assert.ok(scripts['build:post'] && scripts['build:post'].includes('inline-scripts.mjs'), 'build:post should own dist sync and lt.html generation');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:release-hardening'), 'fast release check should include release hardening');

[
  'public/releases',
  'public/downloads',
  'public/assets/js/app-release-catalog-runtime.js',
  'src/worker-release-downloads.mjs',
  'electron-builder.yml',
  'desktop',
  'desktop/windows-client',
  'scripts/ad-client-startup-update.ps1',
  'scripts/publish-ad-release.ps1',
  'scripts/verify-release-assets.mjs',
  'scripts/verify-windows-client-release.mjs'
].forEach((relativePath) => {
  assert.ok(!exists(relativePath), `${relativePath} should stay removed with installer distribution`);
});

assert.ok(!scripts['release:verify-assets'], 'release asset verifier script should be removed');
assert.ok(!scripts['verify:windows-client-release'], 'Windows client verifier script should be removed');
assert.ok(!scripts['desktop:start'], 'desktop runtime script should be removed');
assert.ok(!packageJson.devDependencies?.electron, 'Electron dependency should be removed');
assert.ok(!scripts['test:app-release-catalog-runtime'], 'release catalog runtime test should be removed');
assert.ok(!srcIndex.includes('app-release-catalog-runtime.js'), 'HTML should not load the removed release catalog runtime');
assert.ok(!publicHeaders.includes('/downloads/*'), 'Cloudflare static headers should not expose hosted installer downloads');
assert.ok(!worker.includes("pathname.startsWith('/downloads/')"), 'Worker should not special-case hosted installer downloads');
assert.ok(!worker.includes('worker-release-downloads'), 'Worker should not import removed installer download proxy');

assert.strictEqual(manifest.name, '校衡台', 'manifest app name should be readable Chinese');
assert.strictEqual(manifest.short_name, '校衡台', 'manifest short name should be readable Chinese');
assert.ok(manifest.description.includes('教务'), 'manifest description should stay readable');
assert.ok(!/[锟�]/.test(manifestText), 'manifest should not contain replacement or mojibake characters');
assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 2, 'manifest should keep app shortcuts');
assert.ok(!manifest.shortcuts.some((shortcut) => shortcut.name === '应用下载'), 'manifest should not expose removed app download shortcut');
assert.ok(manifest.icons?.some((icon) => icon.src === '/assets/brand/app-icon-192.png' && icon.sizes === '192x192'), 'manifest should include 192 PNG icon');
assert.ok(manifest.icons?.some((icon) => icon.src === '/assets/brand/app-icon-512.png' && icon.sizes === '512x512'), 'manifest should include 512 PNG icon');

const swVersionMatch = swRuntime.match(/const\s+SERVICE_WORKER_VERSION\s*=\s*['"]([^'"]+)['"]/);
const swVersion = swVersionMatch ? swVersionMatch[1] : '';
assert.ok(swVersion, 'could not extract SERVICE_WORKER_VERSION from service-worker-runtime.js');
assert.ok(!srcIndex.includes('runtimeRefresh') && !srcIndex.includes('SCHOOL_RUNTIME_REFRESH_VERSION'), 'HTML should not rely on runtime-version refresh churn');
assert.ok(!/\.\/assets\/js\/[^"']+\.js\?v=/.test(srcIndex), 'HTML should not query-version runtime JS entries');
assert.ok(srcIndex.includes('校衡台'), 'HTML metadata should keep readable Chinese application name');
userFacingReleaseFiles.forEach((relativePath) => {
  assert.ok(!read(relativePath).includes('\uFFFD'), `${relativePath} should not contain replacement characters`);
});

assert.ok(publicHeaders.includes('/index.html'), 'Cloudflare static headers should cover index.html');
assert.ok(publicHeaders.includes('Content-Type: text/html; charset=utf-8'), 'HTML responses should declare UTF-8 charset');
assert.ok(publicHeaders.includes('/assets/js/*') && publicHeaders.includes('Cache-Control: no-store, max-age=0, must-revalidate'), 'runtime JS headers should bypass browser and CDN storage');
assert.ok(publicHeaders.includes('/sw.js') && publicHeaders.includes('max-age=0, must-revalidate'), 'service worker headers should still require revalidation');
assert.ok(worker.includes('buildWorkerErrorHeaders()'), 'Worker crash responses should use hardened headers');
assert.ok(worker.includes("'Cache-Control': 'no-store'"), 'Worker crash responses should be no-store');
assert.ok(worker.includes("'X-Content-Type-Options': 'nosniff'"), 'Worker crash responses should set nosniff');
assert.ok(performanceWorkflow.includes('concurrency:'), 'performance workflow should avoid overlapping trend writers');
assert.ok(performanceWorkflow.includes('cancel-in-progress: true'), 'performance workflow should cancel stale trend runs');
assert.ok(performanceWorkflow.includes('npm run check:release-fast'), 'performance trend workflow should run fast guards before smoke');

console.log(JSON.stringify({
  ok: true,
  installerDistributionRemoved: true,
  webReleaseHardened: true
}, null, 2));
