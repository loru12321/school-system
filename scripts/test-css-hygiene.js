const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const productRedesignPath = path.join(root, 'src', 'assets', 'css', 'product-redesign.css');
const activeThemeLayers = [
  ['product-redesign.css', 104_000, 900],
  ['designer-studio-workspace.css', 115_000, 1_500],
  ['workbench-design-language.css', 24_000, 340],
];
const productRedesign = fs.readFileSync(productRedesignPath, 'utf8');

// Every stylesheet under src/assets/css must be reachable from application.css;
// unreferenced layers were deleted on 2026-10-31 and must not silently return.
const applicationCss = fs.readFileSync(path.join(root, 'src', 'assets', 'css', 'application.css'), 'utf8');
const importedCss = new Set(Array.from(applicationCss.matchAll(/@import\s+"\.\/([^"]+)"/g), (match) => match[1]));
const orphanCss = fs.readdirSync(path.join(root, 'src', 'assets', 'css'))
  .filter((name) => name.endsWith('.css') && name !== 'application.css' && !importedCss.has(name));
if (orphanCss.length) {
  throw new Error(`Unreferenced stylesheets in src/assets/css: ${orphanCss.join(', ')}`);
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

const removedAudioDirectory = path.join(root, 'public', 'assets', 'audio', 'entrance');
if (fs.existsSync(path.join(root, 'public', 'assets', 'js', 'entrance-sound-runtime.js'))
  || (fs.existsSync(removedAudioDirectory) && fs.readdirSync(removedAudioDirectory).length > 0)) {
  throw new Error('Entrance audio runtime and bundled sources must stay removed until a new source is explicitly requested');
}

console.log(`[css-hygiene] ${importedCss.size} imported stylesheets, no orphans`);
