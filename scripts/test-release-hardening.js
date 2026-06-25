const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function parseJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function assertContiguousScriptSequence(scriptName, expectedCommands, message) {
  const commands = (scripts[scriptName] || '').split('&&').map((command) => command.trim());
  const start = commands.findIndex((command) => command === expectedCommands[0]);
  assert.ok(
    start >= 0 && expectedCommands.every((command, offset) => commands[start + offset] === command),
    message
  );
}

function assertScriptIncludesTokens(scriptName, expectedTokens, message) {
  const script = scripts[scriptName] || '';
  assert.ok(
    expectedTokens.every((token) => script.includes(token)),
    message
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
const betaWorkflow = read('.github/workflows/build-apps-beta.yml');
const performanceWorkflow = read('.github/workflows/performance-trend.yml');
const verifier = read('scripts/verify-release-assets.mjs');

const userFacingReleaseFiles = [
  'public/site.webmanifest',
  'public/assets/js/app.js',
  'public/assets/js/app-foundation-runtime.js',
  'dist/site.webmanifest',
  'dist/assets/js/app.js'
];

assert.strictEqual(scripts['test:release-hardening'], 'node scripts/test-release-hardening.js', 'release hardening script should be exposed');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:release-hardening'), 'fast release check should include release hardening');
const requiredContractGate = [
  'npm run test:release-surface',
  'npm run test:release-manifest',
  'npm run test:app-icon-assets',
  'npm run test:desktop-package-contract',
  'npm run test:windows-installer-contract',
  'npm run test:beta-release-workflow',
];
assertContiguousScriptSequence('check:release-fast', requiredContractGate, 'fast release checks should verify icons before all package contracts immediately after release surface');
const validateContractGate = [
  'test:release-manifest',
  'test:app-icon-assets',
  'test:desktop-package-contract',
  'test:beta-release-workflow',
];
assertScriptIncludesTokens('validate:build', validateContractGate, 'validate:build should verify icons and all package contracts before build');
assert.match(scripts.validate || '', /validate:build[\s\S]*&&\s*npm run build/, 'validate should run build contract group before build');
assert.match(verifier, /release-manifest\.json/, 'release verifier should load the published manifest');
assert.match(verifier, /windows:[\s\S]*extension:\s*['"]\.exe['"][\s\S]*minimumBytes:\s*50\s*\*\s*1024\s*\*\s*1024/, 'Windows packages should be real EXE installers');
assert.doesNotMatch(verifier, /android|\.apk|ios|\.ipa/i, 'release verifier should ignore removed Android and iOS packages');
assert.match(verifier, /method:\s*['"]HEAD['"]/, 'downloadable assets should receive a HEAD request');
assert.match(verifier, /text\/html/, 'HTML responses masquerading as packages should be rejected');
assert.match(verifier, /failures:\s*\[/, 'release verification should report structured failures');
for (const workflow of [releaseWorkflow, betaWorkflow]) {
  assert.ok(workflow.includes('npm run test:release-manifest'), 'native workflows should guard release manifests before builds');
  assert.ok(workflow.includes('npm run test:desktop-package-contract'), 'native workflows should guard desktop packaging before builds');
  assert.ok(workflow.includes('npm run test:beta-release-workflow'), 'native workflows should guard workflow contracts before builds');
  assert.ok(!workflow.includes('assembleRelease'), 'native workflows should not build Android packages');
  assert.ok(!workflow.includes('xcodebuild'), 'native workflows should not validate iOS packages');
}
assert.strictEqual(manifest.name, '校衡台', 'manifest app name should be readable Chinese');
assert.strictEqual(manifest.short_name, '校衡台', 'manifest short name should be readable Chinese');
assert.ok(manifest.description.includes('教务'), 'manifest description should stay readable');
assert.ok(!/[�锟]/.test(manifestText), 'manifest should not contain replacement or mojibake characters');
assert.ok(Array.isArray(manifest.shortcuts) && manifest.shortcuts.length >= 2, 'manifest should keep app shortcuts');
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.name === '数据导入'), 'manifest should keep readable import shortcut');
assert.ok(manifest.shortcuts.some((shortcut) => shortcut.name === '学情总览'), 'manifest should keep readable overview shortcut');
assert.ok(!manifest.shortcuts.some((shortcut) => shortcut.name === '应用下载'), 'manifest should not expose removed app download shortcut');
assert.ok(manifest.shortcuts.every((shortcut) => shortcut.icons?.some((icon) => icon.src === '/icon.svg')), 'manifest shortcuts should include app icons');
assert.ok(manifest.icons?.some((icon) => icon.src === '/assets/brand/app-icon-192.png' && icon.sizes === '192x192'), 'manifest should include 192 PNG icon');
assert.ok(manifest.icons?.some((icon) => icon.src === '/assets/brand/app-icon-512.png' && icon.sizes === '512x512'), 'manifest should include 512 PNG icon');
assert.ok(manifest.shortcuts.every((shortcut) => shortcut.icons?.some((icon) => icon.src === '/assets/brand/app-icon-192.png')), 'manifest shortcuts should include PNG app icons');
const swVersionMatch = swRuntime.match(/const\s+SERVICE_WORKER_VERSION\s*=\s*['"]([^'"]+)['"]/);
const swVersion = swVersionMatch ? swVersionMatch[1] : '';
assert.ok(swVersion, 'could not extract SERVICE_WORKER_VERSION from service-worker-runtime.js');
assert.ok(srcIndex.includes(`var refreshVersion = '${swVersion}';`), 'early runtime refresh should match the current service worker runtime');
assert.ok(srcIndex.includes('校衡台'), 'HTML metadata should keep readable Chinese application name');
assert.ok(!/[�锟鏅烘収]/.test(srcIndex.slice(0, srcIndex.indexOf('</head>'))), 'HTML head metadata should not contain mojibake');
userFacingReleaseFiles.forEach((relativePath) => {
  assert.ok(!read(relativePath).includes('\uFFFD'), `${relativePath} should not contain replacement characters`);
});
assert.ok(publicHeaders.includes('/downloads/*'), 'Cloudflare static headers should cover hosted downloads');
assert.ok(publicHeaders.includes('/index.html'), 'Cloudflare static headers should cover index.html');
assert.ok(publicHeaders.includes('Content-Type: text/html; charset=utf-8'), 'HTML responses should declare UTF-8 charset');
assert.ok(publicHeaders.includes('/assets/js/*') && publicHeaders.includes('max-age=31536000, immutable'), 'versioned runtime JS headers should allow immutable caching');
assert.ok(publicHeaders.includes('/sw.js') && publicHeaders.includes('max-age=0, must-revalidate'), 'service worker headers should still require revalidation');
assert.ok(worker.includes("pathname.startsWith('/downloads/')"), 'Worker cache policy should recognize hosted downloads');
assert.ok(worker.includes('buildWorkerErrorHeaders()'), 'Worker crash responses should use hardened headers');
assert.ok(worker.includes("'Cache-Control': 'no-store'"), 'Worker crash responses should be no-store');
assert.ok(worker.includes("'X-Content-Type-Options': 'nosniff'"), 'Worker crash responses should set nosniff');
assert.ok(worker.includes("'X-School-System-Gateway': 'cloudflare-worker'"), 'Worker crash responses should keep gateway identification');
assert.ok(releaseWorkflow.includes('concurrency:'), 'release workflow should serialize release jobs');
assert.ok(releaseWorkflow.includes('npm run test:release-surface'), 'release workflow should guard release surface');
assert.ok(releaseWorkflow.includes('npm run test:build-size-budget'), 'release workflow should guard hosted package budgets');
assert.ok(!releaseWorkflow.includes('npm run test:app-download-clicks'), 'release workflow should not run removed download center smoke tests');
assert.ok(performanceWorkflow.includes('concurrency:'), 'performance workflow should avoid overlapping trend writers');
assert.ok(performanceWorkflow.includes('cancel-in-progress: true'), 'performance workflow should cancel stale trend runs');
assert.ok(performanceWorkflow.includes('npm run check:release-fast'), 'performance trend workflow should run fast guards before smoke');

async function testManifestVerification() {
  const { verifyReleaseManifest } = await import(pathToFileURL(path.join(root, 'scripts/verify-release-assets.mjs')).href);
  const manifestFixture = {
    schemaVersion: 1,
    releaseTag: 'school-system-v2026.06.20',
    channel: 'stable',
    sourceSha: 'a'.repeat(40),
    platforms: {
      windows: {
        status: 'ready', assetName: 'school-system.exe', assetUrl: 'https://example.com/school-system.exe',
        bytes: 60 * 1024 * 1024, sha256: 'a'.repeat(64),
      }
    },
  };
  const packageRequest = async (url, options) => {
    assert.strictEqual(options.method, 'HEAD');
    return {
      ok: true,
      status: 200,
      headers: { get: (name) => name === 'content-type' ? 'application/octet-stream' : name === 'content-length' ? String(60 * 1024 * 1024) : '' },
    };
  };
  const verified = await verifyReleaseManifest(manifestFixture, { request: packageRequest });
  assert.strictEqual(verified.ok, true, JSON.stringify(verified.failures));

  const htmlResponse = await verifyReleaseManifest(manifestFixture, {
    request: async () => ({ ok: true, status: 200, headers: { get: (name) => name === 'content-type' ? 'text/html; charset=utf-8' : '' } }),
  });
  assert.ok(htmlResponse.failures.some((failure) => failure.code === 'html-or-error-response'));

  console.log(JSON.stringify({
    ok: true,
    optimizationsGuarded: 24,
    releasePackagesVerifiedFromManifest: true,
  }, null, 2));
}

testManifestVerification().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
