const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const appSource = read('public/assets/js/app.js');
const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};

function extractFunction(name) {
    const start = appSource.indexOf(`function ${name}`);
    assert.ok(start >= 0, `${name} should exist`);
    const next = appSource.indexOf('\nfunction ', start + 1);
    return appSource.slice(start, next > start ? next : appSource.length);
}

[
    'archiveCurrentExam',
    'unlockArchive',
    'restoreAutoSnapshot',
    'promptHistoryRecoveryIfEmpty',
    'loadProjectSnapshot'
].forEach((name) => {
    const body = extractFunction(name);
    assert.ok(body.includes('UI.confirm'), `${name} should use shared UI.confirm`);
    assert.ok(!/(^|[^\w$.])confirm\s*\(/.test(body), `${name} should not call bare confirm()`);
});

assert.strictEqual(
    scripts['test:danger-confirm'],
    'node scripts/test-danger-confirm-contract.js',
    'package.json should expose the high-risk confirmation contract'
);
assert.ok(
    scripts['check:release-fast']?.includes('test:danger-confirm'),
    'fast release checks should include high-risk confirmation contract'
);

console.log(JSON.stringify({ ok: true }, null, 2));
