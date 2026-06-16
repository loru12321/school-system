const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mobileLoginPath = path.join(root, 'src', 'assets', 'css', 'mobile-login.css');
const productRedesignPath = path.join(root, 'src', 'assets', 'css', 'product-redesign.css');
const source = fs.readFileSync(mobileLoginPath, 'utf8');
const productRedesign = fs.readFileSync(productRedesignPath, 'utf8');

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

const favoriteThemeMarkers = [
  'Douyin favorite full-scan refresh',
  'Douyin creator pair variation',
  '--pd-sun',
  '--pd-sky-soft',
  '--pd-beat',
  'CLEAN / BEAT / FLOW',
];

for (const marker of favoriteThemeMarkers) {
  if (!productRedesign.includes(marker) && !fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'entrance-sound-runtime.js'), 'utf8').includes(marker)) {
    throw new Error(`Favorite-inspired UI marker is missing: ${marker}`);
  }
}

console.log(`[css-hygiene] mobile-login.css ${byteLength} bytes`);
