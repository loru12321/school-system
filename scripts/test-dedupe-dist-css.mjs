import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { dedupeCssRules, dedupeDistStylesheets } from './build/dedupe-dist-css.mjs';

// Deleting a rule across a conditional boundary changes desktop/print rendering.
for (const css of [
  '.x{color:red}@media(max-width:600px){.x{color:red}}',
  '@media(min-width:900px){.x{color:red}}@media(max-width:600px){.x{color:red}}',
  '.x{color:red}@supports(display:grid){.x{color:red}}',
  '@layer base{.x{color:red}}@layer theme{.x{color:red}}',
  '@keyframes a{from{opacity:0}to{opacity:1}}@keyframes b{from{opacity:0}to{opacity:1}}',
  '.x{color:red}.y{color:blue}.x{color:red}',
  '.x{content:"{a}"}.y{content:"{a}"}',
]) {
  assert.equal(dedupeCssRules(css).css, css, 'nonadjacent/conditional rules must keep their cascade: ' + css);
}
assert.equal(dedupeCssRules('.x{color:red}.x{color:red}').css, '.x{color:red}');
assert.equal(dedupeCssRules('@media print{.x{color:red}.x{color:red}}').css, '@media print{.x{color:red}}');

const distRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dedupe-dist-css-'));
try {
  fs.writeFileSync(path.join(distRoot, 'index.html'), '<link rel="stylesheet" href="./style-current.css">');
  fs.writeFileSync(path.join(distRoot, 'style-current.css'), '.x{color:red}.x{color:red}');
  fs.writeFileSync(path.join(distRoot, 'style-stale.css'), '.stale{color:blue}');
  dedupeDistStylesheets(distRoot);
  assert.equal(fs.readFileSync(path.join(distRoot, 'style-current.css'), 'utf8'), '.x{color:red}');
  assert.equal(fs.existsSync(path.join(distRoot, 'style-stale.css')), false);
  dedupeDistStylesheets(distRoot);
  assert.equal(fs.readFileSync(path.join(distRoot, 'style-current.css'), 'utf8'), '.x{color:red}');
} finally {
  fs.rmSync(distRoot, { recursive: true, force: true });
}
console.log('CSS deduplication scope and cascade tests passed');
