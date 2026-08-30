const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const indexHtml = read('src/index.html');
const applicationCss = read('src/assets/css/application.css');
const distHtml = read('dist/index.html');

const expectedLayers = [
  'main.css',
  'shell.css',
  'fluent-overrides.css',
  'drill-modal.css',
  'dark-mode-fixes.css',
  'vendor-polish.css',
  'apple-platform.css',
  'apk-mobile-shell.css',
  'mobile-skeleton.css',
  'layout-refinement.css',
  'product-redesign.css',
  'designer-studio-workspace.css',
  'cloud-archive-visibility.css',
  'ins-workbench.css',
  'workbench-design-language.css',
  'data-workspace-foundation.css',
  'visual-polish-2026.css',
  'typography-optimization-2026.css',
  'ux-review-2026.css',
  'utility-classes.css',
  'responsive-login-final.css'
];

const imports = [...applicationCss.matchAll(/^\s*@import\s+(?:(?:url\()?\s*["']([^"']+)["']\s*\)?);/gm)]
  .map((match) => path.basename(match[1]));
assert.deepStrictEqual(imports, expectedLayers, 'application.css must preserve the historical CSS cascade order');
assert.strictEqual(imports.at(-1), 'responsive-login-final.css', 'responsive-login-final.css must remain the final application layer');

const stylesheetLinks = [...indexHtml.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]
  .map((match) => match[0]);
assert.strictEqual(stylesheetLinks.length, 2, 'source HTML should keep only the icon stylesheet and one application stylesheet');
assert.ok(stylesheetLinks.some((link) => link.includes('/assets/vendor/tabler-icons/tabler-icons.min.css')), 'source HTML must keep the local Tabler icon stylesheet');
assert.ok(stylesheetLinks.some((link) => link.includes('./assets/css/application.css')), 'source HTML must load the consolidated application stylesheet');
assert.ok(!stylesheetLinks.some((link) => /assets\/css\/(?:main|shell|responsive-login-final)\.css/.test(link)), 'source HTML must not reintroduce individual application CSS links');

const distStylesheetLinks = [...distHtml.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)]
  .map((match) => match[0]);
assert.strictEqual(distStylesheetLinks.length, 2, 'dist HTML should keep only the icon stylesheet and one hashed application stylesheet');
assert.ok(distStylesheetLinks.some((link) => link.includes('./assets/vendor/tabler-icons/tabler-icons.min.css')), 'dist HTML must keep the local Tabler icon stylesheet');
assert.ok(distStylesheetLinks.some((link) => /\.\/style-[\w-]+\.css/.test(link)), 'dist HTML must load the hashed application stylesheet');
assert.ok(!distHtml.includes('./assets/css/utility-classes.css'), 'dist HTML must not leave utility CSS as a second blocking request');

console.log(JSON.stringify({
  ok: true,
  sourceStylesheets: stylesheetLinks.length,
  distStylesheets: distStylesheetLinks.length,
  applicationLayers: imports.length
}, null, 2));
