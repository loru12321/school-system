const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const appRuntime = read('public/assets/js/app.js');
const mainCss = read('src/assets/css/main.css');

assert.ok(
  appRuntime.includes('.table-wrap:not(.analysis-table-shell):not(.analysis-scroll-shell):not([style*="overflow"])'),
  'runtime table-height guard must exclude analysis table shells and explicit overflow containers'
);
assert.ok(
  !/\.table-wrap\s*\{[\s\S]{0,220}overflow-y:\s*visible\s*!important/.test(appRuntime),
  'app runtime must not globally force every table-wrap to overflow-y: visible'
);
assert.ok(
  mainCss.includes('.analysis-table-shell,\n.analysis-workspace .table-wrap.analysis-table-shell'),
  'analysis table shells should have an explicit stable scroll-container rule'
);
assert.ok(
  /(?:\.analysis-table-shell[\s\S]{0,260}overflow:\s*auto\s*!important)/.test(mainCss),
  'analysis table shells should keep overflow auto so sticky headers stay inside the table shell'
);
assert.ok(
  /(?:\.analysis-table-shell[\s\S]{0,360}thead th[\s\S]{0,180}top:\s*0)/.test(mainCss),
  'analysis table headers should stick to the top of their own scroll shell'
);
assert.ok(
  !/\.table-wrap\s*\{[\s\S]{0,360}overflow-y:\s*visible\s*!important/.test(mainCss),
  'base table-wrap CSS must not use !important visible overflow that overrides analysis shells'
);

console.log(JSON.stringify({
  ok: true,
  contract: 'analysis-table-scroll-shell'
}, null, 2));
