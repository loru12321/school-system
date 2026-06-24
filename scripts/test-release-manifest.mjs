import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import crypto from 'node:crypto';
import { buildReleaseManifest } from './build-release-manifest.mjs';

const rootDir = path.resolve(import.meta.dirname, '..');
const fixtureDir = fs.mkdtempSync(path.join(os.tmpdir(), 'school-release-manifest-'));
const requireLocalReleaseAssets = process.env.REQUIRE_LOCAL_RELEASE_ASSETS === 'true';

function snapshotTree(directory) {
  const snapshot = {};
  const visit = (current, relative = '') => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const entryRelative = path.join(relative, entry.name).replace(/\\/g, '/');
      const entryPath = path.join(current, entry.name);
      snapshot[entryRelative] = entry.isDirectory() ? '<directory>' : fs.readFileSync(entryPath).toString('hex');
      if (entry.isDirectory()) visit(entryPath, entryRelative);
    }
  };
  visit(directory);
  return snapshot;
}

try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const androidGradle = fs.readFileSync(path.join(rootDir, 'android/app/build.gradle'), 'utf8');
  const publicCatalog = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/releases/release-manifest.json'), 'utf8'));
  const currentPublicRelease = publicCatalog.releases[0];
  assert.ok(currentPublicRelease, 'public catalog must include the current beta');
  assert.equal(currentPublicRelease.platforms.windows.version, packageJson.version, 'current Windows manifest version should match the system package version');
  assert.equal(currentPublicRelease.platforms.android.version, packageJson.version, 'current Android manifest version should match the system package version');
  assert.match(androidGradle, new RegExp(`findProperty\\(['"]appVersionName['"]\\) \\?: ['"]${packageJson.version.replace(/\./g, '\\.')}['"]`), 'Android local default versionName should match the system package version');
  assert.match(currentPublicRelease.platforms.windows.assetUrl, /^https:\/\/schoolsystem\.com\.cn\/downloads\//);
  assert.match(currentPublicRelease.platforms.android.assetUrl, /^https:\/\/schoolsystem\.com\.cn\/downloads\//);
  assert.ok(
    currentPublicRelease.platforms.windows.assetName.includes(currentPublicRelease.releaseTag),
    'current Windows asset name should include the release tag instead of a stale latest alias'
  );
  assert.ok(
    currentPublicRelease.platforms.android.assetName.includes(currentPublicRelease.releaseTag),
    'current Android asset name should include the release tag instead of an old v1.0 filename'
  );
  assert.ok(!currentPublicRelease.platforms.windows.assetName.includes('latest'), 'current Windows manifest asset should not use the old latest alias');
  assert.ok(!currentPublicRelease.platforms.android.assetName.includes('v1.0'), 'current Android manifest asset should not use the old v1.0 filename');
  assert.ok(
    currentPublicRelease.platforms.windows.notes.some((note) => /NSIS|安装器/.test(note) && /系统卸载入口/.test(note) && /本地系统资源/.test(note)),
    'current Windows manifest notes should describe the NSIS local installer, bundled resources, and uninstall entry'
  );
  assert.ok(
    currentPublicRelease.platforms.android.notes.some((note) => /Android/.test(note) && /本地安装/.test(note) && /APK/.test(note)),
    'current Android manifest notes should describe a locally installable APK'
  );
  assert.equal(currentPublicRelease.platforms.ios.status, 'awaiting-signing');
  for (const platform of ['windows', 'android']) {
    const asset = currentPublicRelease.platforms[platform];
    const assetPath = path.join(rootDir, 'public/downloads', asset.assetName);
    if (!fs.existsSync(assetPath)) {
      assert.ok(!requireLocalReleaseAssets, `${platform} catalog asset should exist in public/downloads`);
      continue;
    }
    const bytes = fs.statSync(assetPath).size;
    const sha256 = crypto.createHash('sha256').update(fs.readFileSync(assetPath)).digest('hex');
    assert.strictEqual(asset.bytes, bytes, `${platform} catalog bytes should match the hosted file`);
    assert.strictEqual(asset.sha256, sha256, `${platform} catalog sha256 should match the hosted file`);
  }

  const assetDir = path.join(fixtureDir, 'assets');
  const outputPath = path.join(assetDir, 'release-manifest.json');
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
  for (const [platform, asset] of Object.entries(manifest.platforms)) {
    assert.strictEqual(asset.platform, platform);
    assert.ok(asset.version);
    assert.ok(asset.buildNumber);
    assert.ok(Array.isArray(asset.notes));
  }
  assert.strictEqual(manifest.platforms.windows.version, '20260620-0123456');
  assert.strictEqual(manifest.platforms.windows.buildNumber, '0123456789ab');
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
  const runtimeSandbox = { URL };
  vm.runInNewContext(fs.readFileSync(path.join(rootDir, 'public/assets/js/app-release-catalog-runtime.js'), 'utf8'), runtimeSandbox);
  const normalized = runtimeSandbox.AppReleaseCatalogRuntime.normalizeCatalog(manifest)[0];
  assert.strictEqual(normalized.platforms.windows.platform, 'windows');
  assert.strictEqual(normalized.platforms.windows.version, manifest.platforms.windows.version);
  assert.strictEqual(normalized.platforms.windows.buildNumber, manifest.platforms.windows.buildNumber);

  const preparedDir = path.join(fixtureDir, 'prepared');
  const inputDir = path.join(preparedDir, 'input');
  fs.mkdirSync(inputDir, { recursive: true });
  fs.writeFileSync(path.join(inputDir, 'desktop-build.exe'), 'fresh-windows');
  fs.writeFileSync(path.join(inputDir, 'mobile-build.apk'), 'fresh-android');
  fs.writeFileSync(path.join(inputDir, 'ios-build.ipa'), 'fresh-ios');
  fs.writeFileSync(path.join(preparedDir, 'stale-package.zip'), 'stale-zip');
  fs.writeFileSync(path.join(preparedDir, 'school-system-windows-old.exe'), 'stale-windows');

  const prepareResult = spawnSync(process.execPath, ['scripts/prepare-github-release-assets.mjs'], {
    cwd: rootDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      RELEASE_INPUT_DIR: inputDir,
      RELEASE_ASSET_DIR: preparedDir,
      RELEASE_CHANNEL: 'stable',
      RELEASE_TAG: 'school-system-v2026.06.20',
      RELEASE_SOURCE_SHA: '0123456789abcdef0123456789abcdef01234567',
      RELEASE_BUILD_URL: 'https://github.com/example/school-system/actions/runs/456',
      GITHUB_REPOSITORY: 'example/school-system'
    }
  });
  assert.strictEqual(prepareResult.status, 0, prepareResult.stderr || prepareResult.stdout);
  assert.deepStrictEqual(fs.readdirSync(preparedDir).sort(), [
    'release-manifest.json',
    'release-notes.md',
    'school-system-android-school-system-v2026.06.20.apk',
    'school-system-ios-school-system-v2026.06.20.ipa',
    'school-system-windows-school-system-v2026.06.20.exe'
  ]);
  assert.strictEqual(fs.existsSync(path.join(preparedDir, 'input')), false);
  assert.strictEqual(fs.existsSync(path.join(preparedDir, 'stale-package.zip')), false);
  assert.deepStrictEqual(fs.readdirSync(fixtureDir).filter((name) => name.startsWith('.prepared.')), []);
  const stableManifest = JSON.parse(fs.readFileSync(path.join(preparedDir, 'release-manifest.json'), 'utf8'));
  assert.strictEqual(stableManifest.expiresAt, '');
  assert.strictEqual(stableManifest.platforms.ios.status, 'ready');
  assert.strictEqual(stableManifest.platforms.ios.signed, false);
  assert.match(stableManifest.platforms.ios.sha256, /^[a-f0-9]{64}$/);
  assert.strictEqual(stableManifest.platforms.ios.minimumOs, 'iOS 16');

  const generatorOptions = (dir, outputPath) => ({
    channel: 'stable',
    releaseTag: 'school-system-v2026.06.20',
    sourceSha: '0123456789abcdef0123456789abcdef01234567',
    assetDir: dir,
    outputPath,
    buildUrl: 'https://github.com/example/school-system/actions/runs/789',
    repository: 'example/school-system'
  });
  for (const extension of ['.exe', '.apk', '.ipa']) {
    const duplicateDir = path.join(fixtureDir, `duplicate-${extension.slice(1)}`);
    fs.mkdirSync(duplicateDir);
    fs.writeFileSync(path.join(duplicateDir, `one${extension}`), 'one');
    fs.writeFileSync(path.join(duplicateDir, `two${extension}`), 'two');
    assert.throws(
      () => buildReleaseManifest(generatorOptions(duplicateDir, path.join(duplicateDir, 'release-manifest.json'))),
      /Multiple .* assets/
    );
  }

  const emptyDir = path.join(fixtureDir, 'empty-asset');
  fs.mkdirSync(emptyDir);
  fs.writeFileSync(path.join(emptyDir, 'empty.exe'), '');
  assert.throws(() => buildReleaseManifest(generatorOptions(emptyDir, path.join(emptyDir, 'release-manifest.json'))), /non-empty/);

  const collisionDir = path.join(fixtureDir, 'collision');
  fs.mkdirSync(collisionDir);
  const collisionAsset = path.join(collisionDir, 'app.exe');
  fs.writeFileSync(collisionAsset, 'collision');
  assert.throws(() => buildReleaseManifest(generatorOptions(collisionDir, collisionAsset)), /collide/i);
  const packageTarget = path.join(collisionDir, 'package.json');
  fs.writeFileSync(packageTarget, 'do-not-touch');
  assert.throws(
    () => buildReleaseManifest(generatorOptions(collisionDir, packageTarget)),
    /release-manifest\.json/
  );
  assert.strictEqual(fs.readFileSync(packageTarget, 'utf8'), 'do-not-touch');
  const siblingDestination = path.join(fixtureDir, 'release-manifest.json');
  fs.writeFileSync(siblingDestination, 'sibling-do-not-touch');
  assert.throws(() => buildReleaseManifest(generatorOptions(collisionDir, siblingDestination)), /parent.*RELEASE_ASSET_DIR/i);
  assert.strictEqual(fs.readFileSync(siblingDestination, 'utf8'), 'sibling-do-not-touch');

  const junctionTarget = path.join(fixtureDir, 'junction-target');
  const junctionAssetDir = path.join(fixtureDir, 'junction-assets');
  fs.mkdirSync(junctionTarget);
  fs.writeFileSync(path.join(junctionTarget, 'app.exe'), 'junction-windows');
  fs.writeFileSync(path.join(junctionTarget, 'app.apk'), 'junction-android');
  let junctionSupported = true;
  let junctionError = '';
  try {
    fs.symlinkSync(junctionTarget, junctionAssetDir, 'junction');
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) {
      junctionSupported = false;
      junctionError = `${error.code}: ${error.message}`;
    } else {
      throw error;
    }
  }
  if (junctionSupported) {
    assert.throws(
      () => buildReleaseManifest(generatorOptions(junctionAssetDir, path.join(junctionAssetDir, 'release-manifest.json'))),
      /symbolic link|junction|reparse/i
    );
    assert.strictEqual(fs.existsSync(path.join(junctionTarget, 'release-manifest.json')), false);
  } else {
    console.log(`junction fixture skipped: ${junctionError}`);
  }

  const failedOutputDir = path.join(fixtureDir, 'failed-preservation');
  const failedInputDir = path.join(failedOutputDir, 'input');
  fs.mkdirSync(failedInputDir, { recursive: true });
  fs.writeFileSync(path.join(failedInputDir, 'app.exe'), 'valid-windows');
  fs.writeFileSync(path.join(failedInputDir, 'app.apk'), 'valid-android');
  fs.writeFileSync(path.join(failedOutputDir, 'existing.zip'), 'keep-me');
  const beforeFailure = snapshotTree(failedOutputDir);
  const failedPrepare = spawnSync(process.execPath, ['scripts/prepare-github-release-assets.mjs'], {
    cwd: rootDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      RELEASE_INPUT_DIR: failedInputDir,
      RELEASE_ASSET_DIR: failedOutputDir,
      RELEASE_CHANNEL: 'stable',
      RELEASE_TAG: 'school-system-v2026.06.20',
      RELEASE_SOURCE_SHA: 'bad-sha',
      RELEASE_BUILD_URL: 'https://github.com/example/school-system/actions/runs/999',
      GITHUB_REPOSITORY: 'example/school-system'
    }
  });
  assert.notStrictEqual(failedPrepare.status, 0);
  assert.deepStrictEqual(snapshotTree(failedOutputDir), beforeFailure);

  const linkedDir = path.join(fixtureDir, 'linked-output');
  const linkedInput = path.join(linkedDir, 'input');
  fs.mkdirSync(linkedInput, { recursive: true });
  fs.writeFileSync(path.join(linkedInput, 'app.exe'), 'windows');
  fs.writeFileSync(path.join(linkedInput, 'app.apk'), 'android');
  const linkTarget = path.join(fixtureDir, 'link-target.txt');
  fs.writeFileSync(linkTarget, 'outside');
  let symlinkSupported = true;
  try {
    fs.symlinkSync(linkTarget, path.join(linkedInput, 'unsafe-link'));
  } catch (error) {
    if (['EPERM', 'EACCES', 'ENOTSUP'].includes(error.code)) symlinkSupported = false;
    else throw error;
  }
  if (symlinkSupported) {
    const linkedPrepare = spawnSync(process.execPath, ['scripts/prepare-github-release-assets.mjs'], {
      cwd: rootDir,
      encoding: 'utf8',
      env: {
        ...process.env,
        RELEASE_INPUT_DIR: linkedInput,
        RELEASE_ASSET_DIR: linkedDir,
        RELEASE_CHANNEL: 'stable',
        RELEASE_TAG: 'school-system-v2026.06.20',
        RELEASE_SOURCE_SHA: '0123456789abcdef0123456789abcdef01234567',
        RELEASE_BUILD_URL: 'https://github.com/example/school-system/actions/runs/1000',
        GITHUB_REPOSITORY: 'example/school-system'
      }
    });
    assert.notStrictEqual(linkedPrepare.status, 0, 'prepare must reject linked input trees');
  } else {
    console.log('symlink fixture skipped: platform did not permit symlink creation');
  }

  console.log(JSON.stringify({ ok: true, fixtureCleaned: true }, null, 2));
} finally {
  fs.rmSync(fixtureDir, { recursive: true, force: true });
}
