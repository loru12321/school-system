import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const rootDir = path.resolve(import.meta.dirname, '..');
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'school-release-manifest-'));

try {
  const assetDir = path.join(fixtureDir, 'assets');
  const outputPath = path.join(fixtureDir, 'release-manifest.json');
  fs.mkdirSync(assetDir);
  fs.writeFileSync(path.join(assetDir, 'school-system-windows-beta.exe'), 'windows-build-fixture');
  fs.writeFileSync(path.join(assetDir, 'school-system-android-beta.apk'), 'android-build-fixture');

  const result = spawnSync(process.execPath, ['scripts/build-release-manifest.mjs'], {
    cwd: rootDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      RELEASE_CHANNEL: 'beta',
      RELEASE_TAG: 'beta-20260620-0123456',
      RELEASE_SOURCE_SHA: '0123456789abcdef0123456789abcdef01234567',
      RELEASE_ASSET_DIR: assetDir,
      RELEASE_OUTPUT: outputPath,
      RELEASE_BUILD_URL: 'https://github.com/example/school-system/actions/runs/123',
      GITHUB_REPOSITORY: 'example/school-system'
    }
  });

  assert.strictEqual(result.status, 0, result.stderr || result.stdout);
  const manifest = JSON.parse(fs.readFileSync(outputPath, 'utf8'));
  assert.strictEqual(manifest.schemaVersion, 1);
  assert.strictEqual(manifest.channel, 'beta');
  assert.match(manifest.releaseTag, /^beta-/);
  assert.strictEqual(manifest.platforms.windows.status, 'ready');
  assert.strictEqual(manifest.platforms.android.signed, 'test-signed');
  assert.strictEqual(manifest.platforms.ios.status, 'awaiting-signing');
  assert.strictEqual(manifest.platforms.ios.assetName, '');
  assert.strictEqual(manifest.platforms.ios.assetUrl, '');
  assert.match(manifest.platforms.windows.sha256, /^[a-f0-9]{64}$/);
  assert.strictEqual(
    Date.parse(manifest.expiresAt) - Date.parse(manifest.generatedAt),
    90 * 86400000
  );
  assert.ok(manifest.platforms.windows.assetUrl.endsWith(`/${manifest.platforms.windows.assetName}`));
  assert.strictEqual(manifest.platforms.windows.bytes, Buffer.byteLength('windows-build-fixture'));

  console.log(JSON.stringify({ ok: true, fixtureCleaned: true }, null, 2));
} finally {
  fs.rmSync(fixtureDir, { recursive: true, force: true });
}
