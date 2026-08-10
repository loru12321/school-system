const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const mobileLoginPath = path.join(root, 'src', 'assets', 'css', 'mobile-login.css');
const productRedesignPath = path.join(root, 'src', 'assets', 'css', 'product-redesign.css');
const activeThemeLayers = [
  ['product-redesign.css', 104_000, 900],
  ['designer-studio-workspace.css', 115_000, 1_500],
  // 2026-07-05: allow the final mature shell layer to carry the
  // production workspace/table/modal polish while the global dist CSS cap
  // remains fixed in test-build-size-budget.js.
  ['mature-system-shell.css', 28_000, 280],
  ['workbench-design-language.css', 24_000, 340],
];
const source = fs.readFileSync(mobileLoginPath, 'utf8');
const productRedesign = fs.readFileSync(productRedesignPath, 'utf8');
const matureSystemShell = fs.readFileSync(path.join(root, 'src', 'assets', 'css', 'mature-system-shell.css'), 'utf8');

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
  if (!productRedesign.includes(marker)) {
    throw new Error(`Favorite-inspired UI marker is missing: ${marker}`);
  }
}

[
  '--mature-surface',
  '.shell-overview-card--dock',
  '.shell-module-rail-chip.is-active',
  '.starter-card--status',
  '.workspace-drawer-panel'
].forEach((marker) => {
  if (!matureSystemShell.includes(marker)) {
    throw new Error(`Mature system shell marker is missing: ${marker}`);
  }
});

const removedAudioDirectory = path.join(root, 'public', 'assets', 'audio', 'entrance');
if (fs.existsSync(path.join(root, 'public', 'assets', 'js', 'entrance-sound-runtime.js'))
  || (fs.existsSync(removedAudioDirectory) && fs.readdirSync(removedAudioDirectory).length > 0)) {
  throw new Error('Entrance audio runtime and bundled sources must stay removed until a new source is explicitly requested');
}

console.log(`[css-hygiene] mobile-login.css ${byteLength} bytes`);
