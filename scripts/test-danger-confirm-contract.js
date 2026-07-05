const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const sources = {
    app: read('public/assets/js/app.js'),
    cohortExamMeta: read('public/assets/js/cohort-exam-meta-runtime.js'),
    snapshotSystem: read('public/assets/js/snapshot-system-runtime.js')
};

function extractFunction(source, name) {
    const pattern = new RegExp(`(?:async\\s+)?function\\s+${name}\\s*\\(`);
    const match = pattern.exec(source);
    assert.ok(match, `${name} should exist`);
    const start = match.index;
    const next = source.slice(start + 1).search(/\n(?:async\s+)?function\s+/);
    return source.slice(start, next >= 0 ? start + 1 + next : source.length);
}

[
    ['cohortExamMeta', 'archiveCurrentExam'],
    ['cohortExamMeta', 'unlockArchive'],
    ['snapshotSystem', 'restoreAutoSnapshot'],
    ['snapshotSystem', 'promptHistoryRecoveryIfEmpty'],
    ['snapshotSystem', 'loadProjectSnapshot']
].forEach(([sourceName, name]) => {
    const body = extractFunction(sources[sourceName], name);
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
