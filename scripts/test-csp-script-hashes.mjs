// The build replaces 'unsafe-inline' in the Report-Only script-src with hashes
// of the inline scripts that remain in dist/index.html; the enforced policy is
// left alone until the reports are clean.
import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeInlineScriptHashes, applyReportOnlyScriptHashes } from './build/inject-csp-script-hashes.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sha = (text) => `'sha256-${crypto.createHash('sha256').update(text, 'utf8').digest('base64')}'`;

const html = [
  '<script>window.a=1</script>',
  '<script defer src="./x.js"></script>',
  '<script type="text/html" id="tpl"><div onclick="x()"></div></script>',
  '<script type="application/ld+json">{"a":1}</script>',
  '<script type="module">import "./m.js"</script>',
  '<script>window.a=1</script>'
].join('\n');
assert.deepStrictEqual(computeInlineScriptHashes(html), [sha('window.a=1'), sha('import "./m.js"')],
  'only executed inline scripts are hashed, once each; src scripts and templates are skipped');

const headers = [
  '/*',
  "  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; report-uri /api/csp-report",
  "  Content-Security-Policy-Report-Only: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; report-uri /api/csp-report",
  ''
].join('\r\n');
const updated = applyReportOnlyScriptHashes(headers, ["'sha256-AAA='"]);
const [, enforced, reportOnly] = updated.split('\r\n');
assert.ok(enforced.includes("script-src 'self' 'unsafe-inline' 'unsafe-eval'"), 'the enforced policy is untouched');
assert.ok(reportOnly.includes("script-src 'self' 'sha256-AAA=' 'unsafe-eval';"), 'Report-Only swaps unsafe-inline for the hashes');
assert.strictEqual(applyReportOnlyScriptHashes(updated, ["'sha256-BBB='"]).split('\r\n')[2].match(/sha256-/g).length, 1,
  're-running replaces previous hashes instead of accumulating them');
assert.throws(() => applyReportOnlyScriptHashes('/*\n  X-Frame-Options: DENY\n', []), /Report-Only/);

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const post = pkg.scripts['build:post'];
assert.ok(post.indexOf('inject-csp-script-hashes.mjs') > post.indexOf('build:post:group2'),
  'hashes must be computed after dist/index.html is minified');
assert.ok(fs.readFileSync(path.join(root, 'public/_headers'), 'utf8').includes('Content-Security-Policy-Report-Only:'));

console.log('csp script hash tests passed');
