import { PurgeCSS } from 'purgecss';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distRoot = path.resolve(__dirname, '../../dist');

console.log('🧹 Purging unused CSS...');
const startTime = Date.now();

// Find the CSS bundle
const cssFiles = fs.readdirSync(distRoot).filter(f => f.startsWith('style-') && f.endsWith('.css') && !f.endsWith('.br'));
if (cssFiles.length === 0) {
  console.log('❌ No CSS bundle found');
  process.exit(1);
}

const cssFile = path.join(distRoot, cssFiles[0]);
const originalSize = fs.statSync(cssFile).size;

// Safelist for dynamic classes and patterns
const safelist = {
  standard: [
    'hidden',
    'dark-mode',
    'active',
    'performance-badge',
    'badge-ok',
    'badge-warn',
    'badge-err',
    'badge-success',
    'badge-school'
  ],
  // Safelist patterns that match dynamic usage
  greedy: [
    /^ti-/,           // Tabler icons
    /^mob-/,          // Mobile classes
    /^login-/,        // Login page classes
    /^role-/,         // Role classes
    /^shell-/,        // Shell layout classes
    /^nav-/,          // Navigation classes
    /^card-/,         // Card components
    /^btn-/,          // Button variants
    /^modal-/,        // Modal classes
    /^table-/,        // Table classes
    /^form-/,         // Form classes
    /^badge-/,        // All badge variants
    /^teacher-/,      // Teacher module classes
    /^report-/,       // Report module classes
    /^tm-/,           // Teaching management classes
    /^pairing-/,      // Pairing classes
    /^loader-/,       // Loader classes
    /^drill-/,        // Dynamic drill modal and class-card surfaces
    /^clickable-num$/ // Dynamic number drill controls
  ]
};

console.log(`Processing: ${cssFile}`);
console.log(`Content: ${path.join(distRoot, 'index.html')}`);
console.log(`Content exists: ${fs.existsSync(path.join(distRoot, 'index.html'))}`);
console.log(`CSS exists: ${fs.existsSync(cssFile)}`);

const cssContent = fs.readFileSync(cssFile, 'utf8');
const htmlContent = fs.readFileSync(path.join(distRoot, 'index.html'), 'utf8');
console.log(`CSS file size: ${cssContent.length} bytes`);
console.log(`HTML file size: ${htmlContent.length} bytes`);

const purgeCSSResults = await new PurgeCSS().purge({
  content: [{
    raw: htmlContent,
    extension: 'html'
  }],
  css: [{
    raw: cssContent
  }],
  safelist,
  // Keep keyframes and font-face rules
  keyframes: true,
  fontFace: true,
  // Reject removed rules so we can see what was purged
  rejected: true,
  // Variables used in :root should be kept
  variables: true
});

console.log(`PurgeCSS results count: ${purgeCSSResults.length}`);
if (purgeCSSResults.length > 0) {
  console.log(`First result has css: ${!!purgeCSSResults[0].css}`);
  console.log(`CSS length: ${purgeCSSResults[0].css ? purgeCSSResults[0].css.length : 0}`);
}

if (purgeCSSResults.length === 0 || !purgeCSSResults[0].css) {
  console.log('❌ PurgeCSS returned no valid results');
  process.exit(1);
}

const result = purgeCSSResults[0];
const purgedCSS = result.css;
const newSize = Buffer.byteLength(purgedCSS, 'utf8');
const savings = originalSize - newSize;
const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

// Write the purged CSS
fs.writeFileSync(cssFile, purgedCSS, 'utf8');

console.log(`\n✨ CSS purged successfully:\n`);
console.log(`  Original: ${(originalSize / 1024).toFixed(1)}KB`);
console.log(`  Purged: ${(newSize / 1024).toFixed(1)}KB`);
console.log(`  Savings: ${(savings / 1024).toFixed(1)}KB (${savingsPercent}%)`);

if (result.rejected) {
  console.log(`  Removed: ${result.rejected.length} unused rules`);
}

const duration = ((Date.now() - startTime) / 1000).toFixed(2);
console.log(`\n⏱️  Completed in ${duration}s`);
