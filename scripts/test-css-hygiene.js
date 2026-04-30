const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mobileLoginPath = path.join(root, 'src', 'assets', 'css', 'mobile-login.css');
const source = fs.readFileSync(mobileLoginPath, 'utf8');

const removedBlocks = [
  'Login Poster Final Overrides',
];

for (const marker of removedBlocks) {
  if (source.includes(marker)) {
    throw new Error(`Removed duplicate CSS block is back: ${marker}`);
  }
}

const requiredBlocks = [
  'Login Poster Endcap',
  'Final QQ Desktop Tune',
];

for (const marker of requiredBlocks) {
  if (!source.includes(marker)) {
    throw new Error(`Required login CSS block is missing: ${marker}`);
  }
}

const byteLength = Buffer.byteLength(source, 'utf8');
const maxMobileLoginBytes = 136 * 1024;

if (byteLength > maxMobileLoginBytes) {
  throw new Error(`mobile-login.css is ${byteLength} bytes, above ${maxMobileLoginBytes} byte hygiene budget`);
}

console.log(`[css-hygiene] mobile-login.css ${byteLength} bytes`);
