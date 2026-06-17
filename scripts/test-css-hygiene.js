const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mobileLoginPath = path.join(root, 'src', 'assets', 'css', 'mobile-login.css');
const productRedesignPath = path.join(root, 'src', 'assets', 'css', 'product-redesign.css');
const entranceSoundPath = path.join(root, 'public', 'assets', 'js', 'entrance-sound-runtime.js');
const entranceAudioPath = path.join(root, 'public', 'assets', 'audio', 'entrance');
const source = fs.readFileSync(mobileLoginPath, 'utf8');
const productRedesign = fs.readFileSync(productRedesignPath, 'utf8');
const entranceSound = fs.readFileSync(entranceSoundPath, 'utf8');

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
  if (!productRedesign.includes(marker) && !entranceSound.includes(marker)) {
    throw new Error(`Favorite-inspired UI marker is missing: ${marker}`);
  }
}

const audioFiles = fs.readdirSync(entranceAudioPath).filter((name) => name.endsWith('.wav'));
if (audioFiles.length < 10) {
  throw new Error(`Expected at least 10 original built-in entrance tracks, found ${audioFiles.length}`);
}
if (!entranceSound.includes("const DEFAULT_MODE = 'random'")) {
  throw new Error('Entrance sound should default to random playback across built-in tracks');
}
if (!entranceSound.includes('function pickRandomTrack()') || !entranceSound.includes('data-sound-choice="random"')) {
  throw new Error('Entrance sound runtime should expose random playback selection');
}

for (const fileName of audioFiles) {
  const id = fileName.replace(/\.wav$/, '');
  if (!entranceSound.includes(`./assets/audio/entrance/${fileName}`)) {
    throw new Error(`Built-in entrance track is not referenced by runtime: ${fileName}`);
  }
  if (fs.statSync(path.join(entranceAudioPath, fileName)).size < 100000) {
    throw new Error(`Built-in entrance track is unexpectedly tiny: ${fileName}`);
  }
  if (!entranceSound.includes(id)) {
    throw new Error(`Built-in entrance track id is missing from runtime: ${id}`);
  }
}

console.log(`[css-hygiene] mobile-login.css ${byteLength} bytes`);
