// Inline event handlers and javascript: URLs are what keep script-src
// 'unsafe-inline' in the CSP.  Runtime-rendered HTML must use the declarative
// data-ui-* attributes (see uiDeclaredAttrs / ui-actions-runtime.js) instead.
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const jsDir = path.join(root, 'public/assets/js');
const HANDLER = /(^|[^\w.-])on(click|dblclick|change|input|submit|keyup|keydown|keypress|mouseover|mouseout|mouseenter|mouseleave|mousedown|mouseup|focus|blur|load|error)\s*=\s*\\?["'`$]/i;
const JS_URL = /href\s*=\s*\\?["']\s*javascript:/i;

// Self-contained HTML pages that users download and open locally; they are
// never served under this site's CSP.
const STANDALONE_EXPORTS = [
  { file: 'freshman-exam-runtime.js', snippet: '<button onclick="doSearch()">' }
];

const offenders = [];
for (const name of fs.readdirSync(jsDir)) {
  if (!name.endsWith('.js') || /-[0-9a-f]{12}\.js$/.test(name)) continue;
  const lines = fs.readFileSync(path.join(jsDir, name), 'utf8').split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (/^(\/\/|\*|\/\*)/.test(trimmed)) return;
    if (!HANDLER.test(line) && !JS_URL.test(line)) return;
    if (STANDALONE_EXPORTS.some((entry) => entry.file === name && line.includes(entry.snippet))) return;
    offenders.push(`${name}:${index + 1}: ${trimmed.slice(0, 140)}`);
  });
}
assert.deepStrictEqual(offenders, [], `inline handlers / javascript: URLs must not be rendered at runtime:\n  ${offenders.join('\n  ')}`);

const indexHtml = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const htmlOffenders = indexHtml.split(/\r?\n/).filter((line) => HANDLER.test(line) || JS_URL.test(line));
assert.deepStrictEqual(htmlOffenders, [], 'src/index.html must not contain inline handlers or javascript: URLs');

console.log('inline handler budget tests passed');
