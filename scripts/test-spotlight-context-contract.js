const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const appJs = read('public/assets/js/app.js');
const bootRuntime = read('public/assets/js/boot-runtime.js');
const runtime = read('public/assets/js/spotlight-context-runtime.js');
const uiActions = read('public/assets/js/ui-actions-runtime.js');
const indexHtml = read('src/index.html');
const stylesheet = read('src/assets/css/ins-workbench.css');
const packageJson = JSON.parse(read('package.json'));

assert.ok(bootRuntime.includes("'spotlight-context-runtime.js'"), 'spotlight context should boot before app.js');
assert.ok(
    bootRuntime.indexOf("'student-jump-runtime.js'") < bootRuntime.indexOf("'spotlight-context-runtime.js'"),
    'spotlight context should load after student jump helpers'
);

[
    'SpotlightRuntime',
    'invalidateIndex',
    'PermissionPolicy.filterStudentRows',
    'canShowModule',
    'spotlight-item__title',
    'role',
    'aria-selected'
].forEach((token) => {
    assert.ok(runtime.includes(token), `spotlight context runtime missing ${token}`);
});

assert.ok(!runtime.includes('.innerHTML'), 'spotlight rows must be built as DOM nodes rather than interpolated HTML');
assert.ok(!/function doSpotlightSearch\s*\(/.test(appJs), 'legacy spotlight rendering must not remain in app.js');
assert.ok(appJs.includes('SpotlightRuntime?.invalidateIndex?.()'), 'score refresh should invalidate the isolated spotlight index');
assert.ok(uiActions.includes('__spotlightReturnFocus'), 'closing Spotlight should return focus to its launcher');
assert.ok(indexHtml.includes('role="listbox"'), 'spotlight results should expose listbox semantics');
assert.ok(indexHtml.includes('aria-modal="true"'), 'spotlight shell should expose dialog semantics');
assert.ok(stylesheet.includes('#spotlight-mask .spotlight-item__title'), 'INS stylesheet should style spotlight context rows');
assert.ok(stylesheet.includes('ins-spotlight-panel-in'), 'spotlight should provide restrained open motion');
assert.strictEqual(packageJson.scripts['test:spotlight-context'], 'node scripts/test-spotlight-context-contract.js');
assert.ok(packageJson.scripts['validate:build']?.includes('test:spotlight-context'));
assert.ok(packageJson.scripts['check:release-fast']?.includes('test:spotlight-context'));

console.log(JSON.stringify({ ok: true }, null, 2));
