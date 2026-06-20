const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

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

console.log('android signing contract tests passed');
