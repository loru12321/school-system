const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mobileLoginPath = path.join(root, 'src', 'assets', 'css', 'mobile-login.css');
const productRedesignPath = path.join(root, 'src', 'assets', 'css', 'product-redesign.css');
const activeThemeLayers = [
  ['product-redesign.css', 118_000, 900],
  ['readable-pop-workspace.css', 13_000, 130],
  ['designer-studio-workspace.css', 164_000, 2_160],
  ['editorial-control-system.css', 33_000, 540],
];
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

for (const [fileName, maxBytes, maxImportant] of activeThemeLayers) {
  const themeSource = fs.readFileSync(path.join(root, 'src', 'assets', 'css', fileName), 'utf8');
  const themeBytes = Buffer.byteLength(themeSource, 'utf8');
  const importantCount = (themeSource.match(/!important\b/g) || []).length;
  if (themeBytes > maxBytes) {
    throw new Error(`${fileName} is ${themeBytes} bytes, above its ${maxBytes} byte theme budget`);
  }
  if (importantCount > maxImportant) {
    throw new Error(`${fileName} has ${importantCount} !important declarations, above its ${maxImportant} cascade budget`);
  }
}

const favoriteThemeMarkers = [
  'Favorite evidence refresh',
  'Creator and favorite variation',
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
if (entranceManifest.tracks.length !== 1) {
  throw new Error(`Entrance manifest should expose only the selected built-in track, found ${entranceManifest.tracks.length}`);
}
if (!entranceManifest.note.includes('authorizedForEmbedding')) {
  throw new Error('Entrance manifest should document that bundled tracks require embedding authorization');
}
for (const track of entranceManifest.tracks) {
  if (!track.src || track.authorizedForEmbedding !== true || !track.license) {
    throw new Error(`Bundled entrance track must include src, license, and authorizedForEmbedding=true: ${track.id || track.name || 'unnamed'}`);
  }
  const trackPath = path.join(entranceAudioPath, track.src);
  if (!fs.existsSync(trackPath) || fs.statSync(trackPath).size < 100 * 1024) {
    throw new Error(`Bundled entrance track file is missing or unexpectedly small: ${track.src}`);
  }
  if (fs.statSync(trackPath).size > 4 * 1024 * 1024) {
    throw new Error(`Bundled entrance track exceeds the 4 MB web budget: ${track.src}`);
  }
}
if (!entranceSound.includes("activeAudio.preload = 'metadata'")) {
  throw new Error('Entrance audio should preload metadata only so it does not compete with application modules');
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
if (!entranceSound.includes("window.location.protocol === 'file:' ? 'https://schoolsystem.com.cn/' : './'")) {
  throw new Error('Entrance sound runtime should use hosted audio assets for file:// lt.html');
}
if (!entranceSound.includes('https://schoolsystem.com.cn/api/entrance-audio-manifest')) {
  throw new Error('Entrance sound runtime should read the bundled playlist through the Worker manifest API for file:// lt.html');
}
if (!entranceSound.includes("['assets', 'audio', 'entrance'].join('/')")) {
  throw new Error('Entrance sound runtime should build audio paths dynamically so lt.html asset rewriting does not corrupt hosted URLs');
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
