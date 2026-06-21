const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(
  path.resolve(__dirname, '../public/assets/js/app-release-catalog-runtime.js'),
  'utf8'
);
assert.match(source, /download-map\.json/, 'catalog runtime should use the first-party chunk map');
assert.match(source, /showSaveFilePicker/, 'catalog runtime should stream large packages to disk when supported');
assert.match(source, /saveChunksAsBlob/, 'catalog runtime should retain a browser fallback');
const manifest = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../public/releases/release-manifest.json'), 'utf8'));
const html = fs.readFileSync(path.resolve(__dirname, '../src/index.html'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
const window = {};
const sandbox = {
  window,
  globalThis: window,
  console,
  URL,
  Date,
  setTimeout,
  clearTimeout
};

vm.runInNewContext(source, sandbox, { filename: 'app-release-catalog-runtime.js' });

const runtime = window.AppReleaseCatalogRuntime;
assert.ok(runtime, 'AppReleaseCatalogRuntime should be exported');
assert.deepStrictEqual(Array.from(runtime.PLATFORMS), ['windows', 'android', 'ios']);

const releases = runtime.normalizeCatalog({
  releases: [
    {
      schemaVersion: 1,
      releaseTag: 'v2.0.0-beta.1',
      channel: 'beta',
      sourceSha: 'ABC123',
      generatedAt: '2026-06-20T08:00:00.000Z',
      expiresAt: '2026-07-20T08:00:00.000Z',
      releaseUrl: 'https://example.com/releases/v2.0.0-beta.1',
      platforms: {
        windows: {
          iconUrl: './assets/brand/windows-test.png',
          version: '2.0.0-beta.1',
          buildNumber: 20,
          status: 'ready',
          signed: true,
          minimumOs: 'Windows 10',
          architectures: ['x64'],
          assetName: 'school-system-windows.zip',
          assetUrl: 'https://example.com/school-system-windows.zip',
          bytes: 1024,
          sha256: 'A'.repeat(64),
          notes: ['Portable build'],
          buildUrl: 'https://example.com/builds/20'
        },
        android: {
          iconUrl: './assets/brand/android-test.png',
          version: '2.0.0-beta.1',
          buildNumber: '20',
          status: 'ready',
          signed: 'test-signed',
          minimumOs: 'Android 10',
          architectures: ['arm64-v8a'],
          assetName: 'school-system.apk',
          assetUrl: 'https://example.com/school-system.apk',
          bytes: 2048,
          sha256: 'b'.repeat(64),
          notes: 'Internal testing',
          buildUrl: 'https://example.com/builds/20'
        },
        ios: {
          iconUrl: './assets/brand/ios-test.png',
          version: '2.0.0-beta.1',
          buildNumber: 20,
          status: 'awaiting-signing',
          signed: false,
          minimumOs: 'iOS 17',
          architectures: ['arm64'],
          assetName: 'school-system.ipa',
          assetUrl: 'https://example.com/school-system.ipa',
          bytes: 4096,
          sha256: 'c'.repeat(64),
          notes: [],
          buildUrl: 'https://example.com/builds/20'
        }
      }
    },
    {
      releaseTag: 'v1.0.0',
      channel: 'stable',
      generatedAt: '2026-06-01T08:00:00.000Z',
      expiresAt: '2026-06-02T08:00:00.000Z',
      platforms: {}
    }
  ]
});

assert.strictEqual(releases.length, 2);
assert.strictEqual(releases[0].releaseTag, 'v2.0.0-beta.1', 'newest release should be first');
assert.strictEqual(releases[0].platforms.windows.platform, 'windows');
assert.strictEqual(releases[0].platforms.windows.iconUrl, './assets/brand/windows-test.png');
assert.strictEqual(releases[0].platforms.windows.signed, 'signed');
assert.strictEqual(releases[0].platforms.windows.sha256, 'a'.repeat(64));
assert.strictEqual(releases[0].platforms.android.signed, 'test-signed');
assert.strictEqual(releases[0].platforms.android.iconUrl, './assets/brand/android-test.png');
assert.deepStrictEqual(Array.from(releases[0].platforms.android.notes), ['Internal testing']);
assert.strictEqual(releases[0].platforms.ios.signed, 'unsigned');
assert.strictEqual(releases[0].platforms.ios.iconUrl, './assets/brand/ios-test.png');
assert.strictEqual(releases[1].platforms.windows.status, 'unavailable');
assert.strictEqual(runtime.isDownloadable(releases[0].platforms.windows), true);
assert.strictEqual(runtime.isDownloadable(releases[0].platforms.ios), false);
const validWindowsAsset = releases[0].platforms.windows;
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { assetName: '   ' })), false);
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { assetUrl: 'http://example.com/app.zip' })), false);
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { assetUrl: 'https://user:secret@example.com/app.zip' })), false);
assert.strictEqual(
  runtime.isDownloadable(Object.assign({}, validWindowsAsset, { assetUrl: 'https://' })),
  false,
  'download URLs should be structurally valid'
);
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { assetUrl: 'file:///app.zip' })), false);
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { bytes: Infinity })), false);
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { bytes: true })), false);
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { bytes: 1.5 })), false);
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { bytes: '1024' })), false);
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { bytes: 0 })), false);
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { bytes: -1 })), false);
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { sha256: 'a'.repeat(63) })), false);
assert.strictEqual(runtime.isDownloadable(Object.assign({}, validWindowsAsset, { sha256: 'g'.repeat(64) })), false);
assert.strictEqual(runtime.isExpired(releases[1], new Date('2099-01-01T00:00:00.000Z')), false);
assert.strictEqual(
  runtime.isExpired(releases[0], new Date('2026-07-20T08:00:00.000Z')),
  true,
  'beta releases should expire at their expiration instant'
);
assert.deepStrictEqual(
  Array.from(runtime.filterCatalog(releases, { platform: 'android', channel: 'beta' }), (release) => release.releaseTag),
  ['v2.0.0-beta.1']
);
assert.strictEqual(runtime.detectPlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)'), 'windows');
assert.strictEqual(runtime.detectPlatform('Mozilla/5.0 (Linux; Android 15; Pixel 9)'), 'android');
assert.strictEqual(runtime.detectPlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'), 'ios');

assert.strictEqual(
  runtime.normalizeCatalog({ releaseTag: '   ' }).length,
  0,
  'whitespace-only release tags should be rejected'
);
const trimmed = runtime.normalizeCatalog({
  schemaVersion: '2',
  releaseTag: '  v2.1.0  ',
  sourceSha: '  abcdef  ',
  generatedAt: '  2026-06-21T08:00:00.000Z  ',
  platforms: {
    android: {
      buildNumber: '  42  ',
      architectures: [' arm64-v8a ', '  ', ' x86_64 '],
      notes: [' Internal build ', '', '  Test only  ']
    }
  }
})[0];
assert.strictEqual(trimmed.schemaVersion, 2);
assert.strictEqual(trimmed.releaseTag, 'v2.1.0');
assert.strictEqual(trimmed.sourceSha, 'abcdef');
assert.strictEqual(trimmed.platforms.android.buildNumber, '42');
assert.deepStrictEqual(Array.from(trimmed.platforms.android.architectures), ['arm64-v8a', 'x86_64']);
assert.deepStrictEqual(Array.from(trimmed.platforms.android.notes), ['Internal build', 'Test only']);

assert.strictEqual(manifest.schemaVersion, 1);
assert.ok(Array.isArray(manifest.releases));
assert.strictEqual(manifest.releases.length, 1);
assert.ok(String(manifest.releases[0].releaseTag || '').trim());
const cachedReleases = runtime.normalizeCatalog(manifest);
assert.strictEqual(cachedReleases.length, 1);
assert.deepStrictEqual(
  Array.from(runtime.PLATFORMS, (platform) => cachedReleases[0].platforms[platform].status),
  ['ready', 'ready', 'awaiting-signing']
);
assert.deepStrictEqual(
  Array.from(runtime.PLATFORMS, (platform) => cachedReleases[0].platforms[platform].iconUrl),
  ['./assets/brand/app-icon-128.png', './assets/brand/app-icon-128.png', './assets/brand/app-icon-128.png'],
  'cached manifest models should receive the shared release icon explicitly'
);
assert.match(cachedReleases[0].platforms.windows.assetUrl, /^https:\/\/schoolsystem\.com\.cn\/downloads\//);
assert.match(cachedReleases[0].platforms.android.assetUrl, /^https:\/\/schoolsystem\.com\.cn\/downloads\//);

const catalogScript = html.match(/<script defer src="\.\/assets\/js\/app-release-catalog-runtime\.js\?v=[^"]+"><\/script>/);
const downloadScript = html.match(/<script defer src="\.\/assets\/js\/app-download-runtime\.js\?v=[^"]+"><\/script>/);
assert.ok(catalogScript, 'index should defer the release catalog runtime with a cache key');
assert.ok(downloadScript, 'index should defer the app download runtime with a cache key');
assert.ok(catalogScript.index < downloadScript.index, 'catalog runtime should load before download runtime');

assert.strictEqual(packageJson.scripts['test:app-release-catalog-runtime'], 'node scripts/test-app-release-catalog-runtime.js');
const validateSteps = packageJson.scripts.validate.split('&&').map((step) => step.trim());
const catalogStep = validateSteps.indexOf('npm run test:app-release-catalog-runtime');
assert.ok(catalogStep >= 0, 'validate should invoke the release catalog test');
assert.strictEqual(validateSteps[catalogStep + 1], 'npm run test:app-download-runtime-hygiene');

console.log('app release catalog runtime tests passed');
