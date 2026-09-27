import assert from 'node:assert/strict';
import { dedupeCssRules } from './build/dedupe-dist-css.mjs';

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
console.log('CSS deduplication scope and cascade tests passed');
