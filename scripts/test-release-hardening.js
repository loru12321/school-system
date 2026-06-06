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

function size(relativePath) {
  return fs.statSync(path.join(root, relativePath)).size;
}

function parseJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function assertZipLike(relativePath) {
  const signature = fs.readFileSync(path.join(root, relativePath)).subarray(0, 4).toString('binary');
  assert.ok(
    signature === 'PK\u0003\u0004' || signature === 'PK\u0005\u0006' || signature === 'PK\u0007\u0008',
    `${relativePath} should have a ZIP/APK signature`
  );
}

const packageJson = parseJson('package.json');
const scripts = packageJson.scripts || {};
const manifestText = read('public/site.webmanifest');
const manifest = JSON.parse(manifestText);
const publicHeaders = read('public/_headers');
const srcIndex = read('src/index.html');
const swRuntime = read('public/assets/js/service-worker-runtime.js');
const worker = read('src/worker-dummy.js');
const releaseWorkflow = read('.github/workflows/release-apps.yml');
const performanceWorkflow = read('.github/workflows/performance-trend.yml');

const hostedDownloads = [
  'public/downloads/school-system-android-v1.0.apk',
  'public/downloads/smartedu-windows-latest.zip',
  'dist/downloads/school-system-android-v1.0.apk',
  'dist/downloads/smartedu-windows-latest.zip'
];

const userFacingReleaseFiles = [
  'public/site.webmanifest',
  'public/assets/js/app.js',
  'public/assets/js/app-foundation-runtime.js',
  'dist/site.webmanifest',
  'dist/assets/js/app.js'
];

assert.strictEqual(scripts['test:release-hardening'], 'node scripts/test-release-hardening.js', 'release hardening script should be exposed');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:release-hardening'), 'fast release check should include release hardening');
assert.strictEqual(manifest.name, '菁莪云枢', 'manifest app name should be readable Chinese');
assert.strictEqual(manifest.short_name, '菁莪云枢', 'manifest short name should be readable Chinese');
assert.ok(manifest.description.includes('教务'), 'manifest description should stay readable');
assert.ok(!/[�锟]/.test(manifestText), 'manifest should not contain replacement or mojibake characters');
assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 3, 'manifest should keep app shortcuts');
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.name === '数据导入'), 'manifest should keep readable import shortcut');
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.name === '学情总览'), 'manifest should keep readable overview shortcut');
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.name === '应用下载'), 'manifest should keep readable download shortcut');
assert.ok(manifest.shortcuts.every((shortcut) => shortcut.icons?.some((icon) => icon.src === '/icon.svg')), 'manifest shortcuts should include app icons');
const swVersionMatch = swRuntime.match(/const\s+SERVICE_WORKER_VERSION\s*=\s*['"]([^'"]+)['"]/);
const swVersion = swVersionMatch ? swVersionMatch[1] : '';
assert.ok(swVersion, 'could not extract SERVICE_WORKER_VERSION from service-worker-runtime.js');
assert.ok(srcIndex.includes(`var refreshVersion = '${swVersion}';`), 'early runtime refresh should match the current service worker runtime');
assert.ok(srcIndex.includes('菁莪云枢'), 'HTML metadata should keep readable Chinese application name');
assert.ok(!/[�锟鏅烘収]/.test(srcIndex.slice(0, srcIndex.indexOf('</head>'))), 'HTML head metadata should not contain mojibake');
userFacingReleaseFiles.forEach((relativePath) => {
  assert.ok(!read(relativePath).includes('\uFFFD'), `${relativePath} should not contain replacement characters`);
});
assert.ok(publicHeaders.includes('/downloads/*'), 'Cloudflare static headers should cover hosted downloads');
assert.ok(publicHeaders.includes('/index.html'), 'Cloudflare static headers should cover index.html');
assert.ok(publicHeaders.includes('Content-Type: text/html; charset=utf-8'), 'HTML responses should declare UTF-8 charset');
assert.ok(publicHeaders.includes('stale-while-revalidate=86400'), 'download headers should allow short browser caching with revalidation');
assert.ok(worker.includes("pathname.startsWith('/downloads/')"), 'Worker cache policy should recognize hosted downloads');
assert.ok(worker.includes('buildWorkerErrorHeaders()'), 'Worker crash responses should use hardened headers');
assert.ok(worker.includes("'Cache-Control': 'no-store'"), 'Worker crash responses should be no-store');
assert.ok(worker.includes("'X-Content-Type-Options': 'nosniff'"), 'Worker crash responses should set nosniff');
assert.ok(worker.includes("'X-School-System-Gateway': 'cloudflare-worker'"), 'Worker crash responses should keep gateway identification');
assert.ok(releaseWorkflow.includes('concurrency:'), 'release workflow should serialize release jobs');
assert.ok(releaseWorkflow.includes('npm run test:release-surface'), 'release workflow should guard release surface');
assert.ok(releaseWorkflow.includes('npm run test:build-size-budget'), 'release workflow should guard hosted package budgets');
assert.ok(releaseWorkflow.includes('npm run test:app-download-clicks'), 'release workflow should smoke-test downloads');
assert.ok(performanceWorkflow.includes('concurrency:'), 'performance workflow should avoid overlapping trend writers');
assert.ok(performanceWorkflow.includes('cancel-in-progress: true'), 'performance workflow should cancel stale trend runs');
assert.ok(performanceWorkflow.includes('npm run check:release-fast'), 'performance trend workflow should run fast guards before smoke');

hostedDownloads.forEach((relativePath) => {
  assert.ok(exists(relativePath), `${relativePath} should exist`);
  assertZipLike(relativePath);
});

assert.ok(size('public/downloads/school-system-android-v1.0.apk') > 10_000_000, 'public APK should look real');
assert.ok(size('dist/downloads/school-system-android-v1.0.apk') > 10_000_000, 'dist APK should look real');
assert.ok(size('public/downloads/smartedu-windows-latest.zip') >= 500, 'public Windows package should not be a tiny placeholder');
assert.ok(size('dist/downloads/smartedu-windows-latest.zip') >= 500, 'dist Windows package should not be a tiny placeholder');
assert.ok(
  size('dist/downloads/school-system-android-v1.0.apk') + size('dist/downloads/smartedu-windows-latest.zip') < 30_000_000,
  'hosted download payload should stay below the Cloudflare budget'
);

console.log(JSON.stringify({
  ok: true,
  optimizationsGuarded: 24,
  hostedDownloadBytes: size('dist/downloads/school-system-android-v1.0.apk') + size('dist/downloads/smartedu-windows-latest.zip')
}, null, 2));
