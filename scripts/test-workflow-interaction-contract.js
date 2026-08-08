const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const indexHtml = read('src/index.html');
const bootRuntime = read('public/assets/js/boot-runtime.js');
const workflowRuntime = read('public/assets/js/workflow-insight-runtime.js');
const studentOverviewRuntime = read('public/assets/js/student-overview-runtime.js');
const shellCss = read('src/assets/css/shell.css');
const mainCss = read('src/assets/css/main.css');

assert.ok(indexHtml.includes('id="shell-workflow-path"'), 'shell overview should include workflow path mount');
assert.ok(indexHtml.includes('id="workspace-drawer-workflow"'), 'workspace drawer should include workflow path mount');
assert.ok(bootRuntime.includes("'workflow-insight-runtime.js'"), 'workflow insight runtime should boot with app modules');
assert.ok(
    bootRuntime.indexOf("'shell-runtime.js'") < bootRuntime.indexOf("'workflow-insight-runtime.js'"),
    'workflow insight runtime should load after shell navigation runtime'
);

[
    'function renderWorkflowPath',
    'function decorateTableAffordances',
    'function renderCalculationPolicyStrip',
    'CALCULATION_POLICY_TAGS',
    'data-workflow-key',
    'data-table-affordance',
    'calculation-policy-strip'
].forEach((token) => {
    assert.ok(workflowRuntime.includes(token), `workflow interaction runtime missing contract token: ${token}`);
});

[
    '.workflow-path',
    '.workflow-path__step',
    '.table-affordance-shell',
    '.calculation-policy-strip'
].forEach((token) => {
    assert.ok(shellCss.includes(token), `shell css missing workflow interaction style: ${token}`);
});

[
    'function smBuildActionQueue',
    'function smRenderActionQueue',
    'function smOpenStudentDataManager',
    'window.MP_DATA_CACHE',
    'data-sm-action',
    "DataManager.open('student')",
    'smJumpToStudentModule(target)'
].forEach((token) => {
    assert.ok(studentOverviewRuntime.includes(token), `student overview action queue missing contract token: ${token}`);
});

[
    'id="smActionQueue"',
    'id="smActionQueueList"',
    'data-scroll-anchor="smActionQueue"'
].forEach((token) => {
    assert.ok(indexHtml.includes(token), `student overview action queue HTML missing contract token: ${token}`);
});

[
    '#student-overview .sm-action-queue',
    '#student-overview .sm-action-item',
    'body.dark-mode #student-overview .sm-action-queue',
    '#student-overview .sm-action-cta:focus-visible'
].forEach((token) => {
    assert.ok(mainCss.includes(token), `student overview action queue CSS missing contract token: ${token}`);
});

assert.strictEqual(
    scripts['test:workflow-interaction'],
    'node scripts/test-workflow-interaction-contract.js',
    'package.json should expose the workflow interaction contract'
);
assert.ok(
    scripts['validate:build']?.includes('test:workflow-interaction'),
    'build validation should include workflow interaction contract'
);
assert.ok(
    scripts['check:release-fast']?.includes('test:workflow-interaction'),
    'fast release checks should include workflow interaction contract'
);

console.log(JSON.stringify({ ok: true }, null, 2));
