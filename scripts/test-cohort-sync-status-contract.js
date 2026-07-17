const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const sourceHtml = read('src/index.html');
const syncRuntime = read('public/assets/js/cohort-sync-status-runtime.js');
const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};

[
    'data-sync-label',
    'data-sync-meta'
].forEach((token) => {
    assert.ok(sourceHtml.includes(token), `shell sync chip should render ${token}`);
});

[
    'function resolveSyncMeta',
    'function formatSyncDetail',
    'function hasCurrentCohortScores',
    "normalizedState === 'synced' && !hasCurrentCohortScores(meta)",
    'dataSyncSource',
    'dataSyncExam',
    'dataSyncUpdated',
    "querySelector('[data-sync-meta]')"
].forEach((token) => {
    assert.ok(syncRuntime.includes(token), `cohort sync status runtime should expose metadata contract: ${token}`);
});

assert.ok(
    syncRuntime.includes("global.CohortSyncStatusRuntime = Object.freeze({ retry, setStatus, resolveSyncMeta })"),
    'sync runtime should expose resolveSyncMeta for source-level verification'
);
assert.strictEqual(
    scripts['test:cohort-sync-status'],
    'node scripts/test-cohort-sync-status-contract.js',
    'package.json should expose the cohort sync status contract'
);
assert.ok(
    scripts['validate:data']?.includes('test:cohort-sync-status'),
    'data validation should include the cohort sync status contract'
);

console.log(JSON.stringify({ ok: true }, null, 2));
