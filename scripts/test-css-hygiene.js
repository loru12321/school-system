const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mobileLoginPath = path.join(root, 'src', 'assets', 'css', 'mobile-login.css');
const productRedesignPath = path.join(root, 'src', 'assets', 'css', 'product-redesign.css');
const entranceSoundPath = path.join(root, 'public', 'assets', 'js', 'entrance-sound-runtime.js');
const entranceAudioPath = path.join(root, 'public', 'assets', 'audio', 'entrance');
const entranceManifestPath = path.join(entranceAudioPath, 'manifest.json');
const source = fs.readFileSync(mobileLoginPath, 'utf8');
const productRedesign = fs.readFileSync(productRedesignPath, 'utf8');
const entranceSound = fs.readFileSync(entranceSoundPath, 'utf8');
const entranceManifest = JSON.parse(fs.readFileSync(entranceManifestPath, 'utf8'));

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
  'Douyin favorite evidence refresh',
  'Douyin creator and favorite variation',
  'Added-profile editorial shell',
  '--pd-sun',
  '--pd-sky-soft',
  '--pd-beat',
  '--pd-editorial-jade',
  'CLEAN / BEAT / FLOW',
];

for (const marker of favoriteThemeMarkers) {
  if (!productRedesign.includes(marker) && !entranceSound.includes(marker)) {
    throw new Error(`Favorite-inspired UI marker is missing: ${marker}`);
  }
}

const audioFiles = fs.readdirSync(entranceAudioPath).filter((name) => name.endsWith('.wav'));
if (audioFiles.length !== 0) {
  throw new Error(`Legacy generated wav files should stay removed, found ${audioFiles.length} wav files`);
}
if (!Array.isArray(entranceManifest.tracks)) {
  throw new Error('Entrance manifest should expose a tracks array');
}
if (!entranceManifest.note.includes('authorizedForEmbedding')) {
  throw new Error('Entrance manifest should document that bundled tracks require embedding authorization');
}
for (const track of entranceManifest.tracks) {
  if (!track.src || track.authorizedForEmbedding !== true || !track.license) {
    throw new Error(`Bundled entrance track must include src, license, and authorizedForEmbedding=true: ${track.id || track.name || 'unnamed'}`);
  }
}
if (!entranceSound.includes("const DEFAULT_MODE = 'random'")) {
  throw new Error('Entrance sound should default to random playback');
}
if (entranceSound.includes('BUILTIN_TRACKS') || entranceSound.includes('playToneSequence') || entranceSound.includes('getAudioContext')) {
  throw new Error('Entrance sound runtime should not include built-in tracks or generated fallback tones');
}
if (!entranceSound.includes('BUNDLED_PLAYLIST_MANIFEST') || !entranceSound.includes('authorizedForEmbedding')) {
  throw new Error('Entrance sound runtime should load only manifest-authorized bundled audio/video tracks');
}
if (!entranceSound.includes('data-sound-choice="random"') || !entranceSound.includes('storeAuthorizedPlaylist')) {
  throw new Error('Entrance sound runtime should expose random playback for authorized playlists');
}
if (!entranceSound.includes('onended') || !entranceSound.includes('autoAdvanceTimer')) {
  throw new Error('Imported playlist playback should automatically advance to the next track');
}
if (!entranceSound.includes('multiple') && !entranceSound.includes('Array.from(files')) {
  throw new Error('Entrance sound runtime should support importing more than one authorized track');
}

console.log(`[css-hygiene] mobile-login.css ${byteLength} bytes`);
