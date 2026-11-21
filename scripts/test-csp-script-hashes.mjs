// The build replaces 'unsafe-inline' in both enforced Content-Security-Policy
// and Content-Security-Policy-Report-Only script-src with hashes of the inline
// scripts that remain in dist/index.html.
import assert from 'assert';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { computeInlineScriptHashes, applyCspScriptHashes } from './build/inject-csp-script-hashes.mjs';

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
const updated = applyCspScriptHashes(headers, ["'sha256-AAA='"]);
const [, enforced, reportOnly] = updated.split('\r\n');
assert.ok(enforced.includes("script-src 'self' 'sha256-AAA=' 'unsafe-eval';"), 'enforced policy swaps unsafe-inline for the hashes');
assert.ok(!enforced.includes("'unsafe-inline'"), 'enforced policy drops unsafe-inline from script-src');
assert.ok(reportOnly.includes("script-src 'self' 'sha256-AAA=' 'unsafe-eval';"), 'Report-Only swaps unsafe-inline for the hashes');
const reapplied = applyCspScriptHashes(updated, ["'sha256-BBB='"]).split('\r\n');
assert.strictEqual(reapplied[1].match(/sha256-/g).length, 1,
  're-running replaces previous hashes in enforced policy instead of accumulating them');
assert.strictEqual(reapplied[2].match(/sha256-/g).length, 1,
  're-running replaces previous hashes in Report-Only policy instead of accumulating them');
assert.throws(() => applyCspScriptHashes('/*\n  X-Frame-Options: DENY\n', []), /Content-Security-Policy/);

const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const post = pkg.scripts['build:post'];
assert.ok(post.indexOf('inject-csp-script-hashes.mjs') > post.indexOf('build:post:group2'),
  'hashes must be computed after dist/index.html is minified');
assert.ok(fs.readFileSync(path.join(root, 'public/_headers'), 'utf8').includes('Content-Security-Policy-Report-Only:'));

console.log('csp script hash tests passed');
