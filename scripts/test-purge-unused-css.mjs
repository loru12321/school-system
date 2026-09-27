import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixture = fs.mkdtempSync(path.join(root, '.tmp-css-purge-'));
try {
  fs.mkdirSync(path.join(fixture, 'scripts/build'), { recursive: true });
  fs.mkdirSync(path.join(fixture, 'dist/assets/js/lazy'), { recursive: true });
  fs.copyFileSync(path.join(root, 'scripts/build/purge-unused-css.mjs'), path.join(fixture, 'scripts/build/purge-unused-css.mjs'));
  fs.writeFileSync(path.join(fixture, 'dist/index.html'), '<html><body><div class="static-card"></div></body></html>');
  fs.writeFileSync(path.join(fixture, 'dist/assets/js/lazy/feature.js'), 'node.innerHTML = `<div class="dynamic-result"></div>`; node.style.animation = "runtime-pulse 1s";');
  fs.writeFileSync(path.join(fixture, 'dist/style-fixture.css'), '.static-card{color:red}.dynamic-result{color:blue}.unused-rule{color:pink}:root{--runtime-color:green}@keyframes runtime-pulse{from{opacity:0}to{opacity:1}}@font-face{font-family:RuntimeFont;src:url(font.woff2)}');
  const result = spawnSync(process.execPath, [path.join(fixture, 'scripts/build/purge-unused-css.mjs')], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  const css = fs.readFileSync(path.join(fixture, 'dist/style-fixture.css'), 'utf8');
  assert.ok(css.includes('.dynamic-result'), 'lazy JS generated markup must retain its styles');
  assert.ok(css.includes('@keyframes runtime-pulse'), 'JS-selected animation must survive');
  assert.ok(css.includes('--runtime-color'), 'JS-consumed CSS variables must survive');
  assert.ok(css.includes('@font-face'), 'runtime font choices must survive');
  assert.ok(!css.includes('.unused-rule'), 'unused static selectors should still be removed');
  console.log('CSS purge runtime retention tests passed');
} finally {
  assert.ok(fixture.startsWith(root + path.sep + '.tmp-css-purge-'));
  fs.rmSync(fixture, { recursive: true, force: true });
}
