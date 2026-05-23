const assert = require('assert');
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

const roots = [
  'public/sw.js',
  'public/assets/js',
  'scripts'
];

function collectSyntaxTargets(relativePath) {
  const fullPath = path.join(root, relativePath);
  assert.ok(fs.existsSync(fullPath), `syntax target root should exist: ${relativePath}`);

  const stat = fs.statSync(fullPath);
  if (stat.isFile()) {
    return /\.(?:m?js)$/.test(relativePath) ? [relativePath] : [];
  }

  return fs.readdirSync(fullPath, { withFileTypes: true })
    .flatMap((entry) => {
      const childPath = path.join(relativePath, entry.name).replace(/\\/g, '/');
      if (entry.isDirectory()) return collectSyntaxTargets(childPath);
      return /\.(?:m?js)$/.test(entry.name) ? [childPath] : [];
    });
}

const targets = [...new Set(roots.flatMap(collectSyntaxTargets))].sort();

assert.ok(targets.includes('public/sw.js'), 'syntax check should cover the service worker');
assert.ok(targets.includes('public/assets/js/app.js'), 'syntax check should cover the main app runtime');
assert.ok(targets.includes('public/assets/js/app-download-runtime.js'), 'syntax check should cover the download center runtime');
assert.ok(targets.includes('scripts/test-performance-budget.js'), 'syntax check should cover performance budget guards');
assert.ok(targets.includes('scripts/prepare-github-release-assets.mjs'), 'syntax check should cover release asset preparation');
assert.ok(targets.includes('scripts/record-performance-trend.mjs'), 'syntax check should cover performance trend recording');
assert.ok(targets.length >= 180, `syntax target count looks too small: ${targets.length}`);

for (const target of targets) {
  execFileSync(process.execPath, ['--check', target], {
    cwd: root,
    stdio: 'pipe'
  });
}

console.log(JSON.stringify({
  ok: true,
  syntaxTargets: targets.length
}, null, 2));
