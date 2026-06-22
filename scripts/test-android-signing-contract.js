const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const gradlePath = path.join(root, 'android', 'app', 'build.gradle');
const bootstrapPath = path.join(root, 'scripts', 'configure-android-test-signing.mjs');
const gradle = fs.readFileSync(gradlePath, 'utf8');

[
  'ANDROID_TEST_KEYSTORE_FILE',
  'ANDROID_TEST_KEYSTORE_PASSWORD',
  'ANDROID_TEST_KEY_ALIAS',
  'ANDROID_TEST_KEY_PASSWORD',
].forEach((name) => assert.ok(gradle.includes(name), `Gradle must read ${name}`));

assert.ok(!/storePassword\s+["'][^$]/.test(gradle), 'Gradle must not contain a literal store password');
assert.ok(!/keyPassword\s+["'][^$]/.test(gradle), 'Gradle must not contain a literal key password');
assert.ok(!fs.existsSync(path.join(root, 'android-test.keystore')), 'test keystore must never be committed at repository root');
assert.ok(!fs.existsSync(path.join(root, 'android', 'android-test.keystore')), 'test keystore must never be committed in Android project');
assert.ok(fs.existsSync(bootstrapPath), 'signing bootstrap script should exist');
const bootstrap = fs.readFileSync(bootstrapPath, 'utf8');
assert.match(bootstrap, /readFileSync\(outputPath\)\.toString\(['"]base64['"]\)/, 'keystore file secret should be portable base64, not a local path');

const refusedOutput = path.join(root, '.tmp-test-signing.keystore');
fs.rmSync(refusedOutput, { force: true });
const refused = spawnSync(process.execPath, [bootstrapPath, refusedOutput], {
  cwd: root,
  encoding: 'utf8',
});
assert.notEqual(refused.status, 0, 'bootstrap must refuse output paths inside the repository');
assert.match(`${refused.stdout}\n${refused.stderr}`, /outside the repository/i);
assert.ok(!fs.existsSync(refusedOutput), 'refused bootstrap must not create a keystore');

const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');
assert.match(gitignore, /^\*\.keystore$/m, 'root ignore rules should exclude keystores');
assert.match(gitignore, /^\*\.jks$/m, 'root ignore rules should exclude JKS files');

const manifestPath = path.join(root, 'public', 'releases', 'release-manifest.json');
const releaseManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const currentRelease = releaseManifest.releases.find((release) => release.releaseTag === 'beta-20260621-9a362b3');
assert.ok(currentRelease, 'public release manifest should include the current Android package');
const androidAsset = currentRelease.platforms.android;
const apkPath = path.join(root, 'public', 'downloads', androidAsset.assetName);
assert.ok(fs.existsSync(apkPath), 'current Android APK should exist in public downloads');
const apk = fs.readFileSync(apkPath);
assert.equal(apk.subarray(0, 4).toString('hex'), '504b0304', 'Android package should be a ZIP/APK file');
assert.equal(androidAsset.bytes, apk.length, 'Android manifest bytes should match the APK file');
assert.equal(
  androidAsset.sha256,
  crypto.createHash('sha256').update(apk).digest('hex'),
  'Android manifest sha256 should match the APK file'
);
const apkListingResult = spawnSync('jar', ['tf', apkPath], { cwd: root, encoding: 'utf8' });
assert.equal(apkListingResult.status, 0, apkListingResult.stderr || apkListingResult.stdout);
const apkEntries = new Set(apkListingResult.stdout.split(/\r?\n/).filter(Boolean));
for (const requiredEntry of [
  'AndroidManifest.xml',
  'classes.dex',
  'resources.arsc',
  'assets/capacitor.config.json',
  'assets/public/index.html',
  'assets/public/assets/js/app.js',
]) {
  assert.ok(apkEntries.has(requiredEntry), `APK should contain ${requiredEntry}`);
}
assert.ok(
  ![...apkEntries].some((entry) => entry.startsWith('assets/public/downloads/')),
  'APK should not bundle historical downloadable installers inside the Android app'
);
assert.ok(
  ![...apkEntries].some((entry) => entry.startsWith('assets/public/releases/')),
  'APK should not bundle release chunk metadata inside the Android app'
);
assert.ok(
  apk.includes(Buffer.from('APK Sig Block 42')) || [...apkEntries].some((entry) => /^META-INF\/.+\.(RSA|DSA|EC)$/.test(entry)),
  'APK should include an APK signing block or legacy signing certificate block'
);
assert.ok(
  androidAsset.notes.some((note) => /本地安装|Android APK/.test(note)),
  'Android release notes should describe a locally installable APK'
);

console.log('android signing contract tests passed');
