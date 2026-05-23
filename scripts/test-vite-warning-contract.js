const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const viteConfig = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const scripts = packageJson.scripts || {};

const suppressedWarnings = [
  "can't be bundled without type=\"module\" attribute",
  "./assets/vendor/tabler-icons/tabler-icons.min.css doesn't exist at build time"
];

suppressedWarnings.forEach((warning) => {
  assert.ok(viteConfig.includes(warning), `Vite warning suppression should stay explicit: ${warning}`);
});

assert.ok(viteConfig.includes('originalWarn(msg, options);'), 'Vite logger should forward unknown warnings');
assert.strictEqual(
  (viteConfig.match(/return;/g) || []).length,
  suppressedWarnings.length,
  'Vite logger should only suppress the documented warnings'
);
assert.ok(scripts['test:vite-warning-contract'] === 'node scripts/test-vite-warning-contract.js', 'package script should expose Vite warning contract');
assert.ok(scripts['check:release-fast'] && scripts['check:release-fast'].includes('test:vite-warning-contract'), 'fast release check should include Vite warning contract');

console.log('vite warning contract tests passed');
