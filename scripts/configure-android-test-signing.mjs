import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, '..');
const requestedOutput = process.argv[2];

if (!requestedOutput) {
  console.error('Usage: node scripts/configure-android-test-signing.mjs <absolute-output-path-outside-repository>');
  process.exit(1);
}

const outputPath = path.resolve(requestedOutput);
const relativeToRepository = path.relative(repositoryRoot, outputPath);
const isInsideRepository = relativeToRepository === ''
  || (!relativeToRepository.startsWith(`..${path.sep}`) && relativeToRepository !== '..' && !path.isAbsolute(relativeToRepository));

if (isInsideRepository) {
  console.error('The test keystore output path must be outside the repository.');
  process.exit(1);
}

if (existsSync(outputPath)) {
  console.error(`Refusing to overwrite an existing file: ${outputPath}`);
  process.exit(1);
}

const password = randomBytes(24).toString('base64url');
const alias = 'school-system-test';
const keytoolName = process.platform === 'win32' ? 'keytool.exe' : 'keytool';
const keytool = process.env.JAVA_HOME
  ? path.join(process.env.JAVA_HOME, 'bin', keytoolName)
  : keytoolName;
const result = spawnSync(keytool, [
  '-genkeypair',
  '-keystore', outputPath,
  '-storetype', 'PKCS12',
  '-storepass', password,
  '-keypass', password,
  '-alias', alias,
  '-keyalg', 'RSA',
  '-keysize', '4096',
  '-validity', '3650',
  '-dname', 'CN=School System Test, OU=Build Automation, O=School System, L=Shanghai, ST=Shanghai, C=CN',
  '-noprompt',
], { encoding: 'utf8' });

if (result.error || result.status !== 0) {
  console.error(result.error?.message || result.stderr || 'keytool failed');
  process.exit(result.status || 1);
}

console.log('Created Android test-signing keystore. Store these values as GitHub Actions secrets:');
console.log(`ANDROID_TEST_KEYSTORE_FILE=${readFileSync(outputPath).toString('base64')}`);
console.log(`ANDROID_TEST_KEYSTORE_PASSWORD=${password}`);
console.log(`ANDROID_TEST_KEY_ALIAS=${alias}`);
console.log(`ANDROID_TEST_KEY_PASSWORD=${password}`);
