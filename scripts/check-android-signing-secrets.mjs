const requiredSecrets = [
  'ANDROID_TEST_KEYSTORE_FILE',
  'ANDROID_TEST_KEYSTORE_PASSWORD',
  'ANDROID_TEST_KEY_ALIAS',
  'ANDROID_TEST_KEY_PASSWORD'
];

const missing = requiredSecrets.filter((name) => !String(process.env[name] || '').trim());
if (missing.length) {
  console.error(`Missing Android signing secrets: ${missing.join(', ')}`);
  console.error('Run `node scripts/configure-android-test-signing.mjs <absolute-output-path-outside-repository>` and add the printed values to GitHub Actions Secrets.');
  process.exit(1);
}

const keystoreSecret = String(process.env.ANDROID_TEST_KEYSTORE_FILE || '').trim();
const normalizedKeystoreSecret = keystoreSecret.replace(/\s+/g, '');
const isLikelyBase64 = normalizedKeystoreSecret.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(normalizedKeystoreSecret);
const keystoreBytes = isLikelyBase64 ? Buffer.from(normalizedKeystoreSecret, 'base64') : Buffer.alloc(0);
if (!isLikelyBase64 || keystoreBytes.length < 1024 || /^[A-Za-z]:[\\/]|^\//.test(keystoreSecret)) {
  console.error('ANDROID_TEST_KEYSTORE_FILE must be the base64 contents of the generated test keystore, not a local filesystem path.');
  process.exit(1);
}

console.log(JSON.stringify({
  ok: true,
  checked: requiredSecrets,
  keystoreBytes: keystoreBytes.length,
  alias: process.env.ANDROID_TEST_KEY_ALIAS
}, null, 2));
