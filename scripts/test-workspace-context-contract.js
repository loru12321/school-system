const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8');

const indexHtml = read('src/index.html');
const bootRuntime = read('public/assets/js/boot-runtime.js');
const appJs = read('public/assets/js/app.js');
const runtime = read('public/assets/js/workspace-context-runtime.js');
const stylesheet = read('src/assets/css/ins-workbench.css');
const packageJson = JSON.parse(read('package.json'));

assert.ok(indexHtml.includes('id="workspace-context-bar"'), 'shell overview should mount the workspace context bar');
assert.ok(bootRuntime.includes("'workspace-context-runtime.js'"), 'workspace context runtime should boot with app modules');
assert.ok(
    bootRuntime.indexOf("'workspace-rail-runtime.js'") < bootRuntime.indexOf("'workspace-context-runtime.js'"),
    'workspace context should load after the shell and rail runtimes'
);
assert.ok(
    appJs.includes("new CustomEvent('school:module-changed'"),
    'module switching should broadcast a read-only context refresh event'
);

[
    'school:workspace-context:v1',
    'MAX_RECENT_MODULES',
    'MAX_PINNED_MODULES',
    'school:module-changed',
    'data-context-module',
    'data-context-pin',
    'getCurrentCohortId',
    'getQualityStatus',
    'WorkspaceContextRuntime'
].forEach((token) => {
    assert.ok(runtime.includes(token), `workspace context runtime missing contract token: ${token}`);
});

assert.ok(!/RAW_DATA\s*=(?!=)/.test(runtime), 'workspace context must never mutate score rows');
assert.ok(!/COHORT_DB\s*=(?!=)/.test(runtime), 'workspace context must never mutate cohort data');
assert.ok(!/TEACHER_MAP\s*=(?!=)/.test(runtime), 'workspace context must never mutate teaching assignments');

[
    '.workspace-context-bar',
    '.workspace-context-status',
    '.workspace-context-module',
    '.workspace-context-pin'
].forEach((token) => {
    assert.ok(stylesheet.includes(token), `INS stylesheet missing workspace context style: ${token}`);
});

assert.strictEqual(
    packageJson.scripts['test:workspace-context'],
    'node scripts/test-workspace-context-contract.js',
    'package should expose workspace context contract'
);
assert.ok(
    packageJson.scripts['validate:build']?.includes('test:workspace-context'),
    'build validation should include the workspace context contract'
);
assert.ok(
    packageJson.scripts['check:release-fast']?.includes('test:workspace-context'),
    'release validation should include the workspace context contract'
);

console.log(JSON.stringify({ ok: true }, null, 2));
