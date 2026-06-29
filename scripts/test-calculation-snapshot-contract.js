const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
    return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

const packageJson = JSON.parse(read('package.json'));
const scripts = packageJson.scripts || {};
const snapshotSource = read('scripts/test-calculation-snapshot.js');

const protectedPolicies = [
    'subjectFullScorePolicy',
    'blankSubjectScorePolicy',
    'classSchoolIsolationPolicy',
    'analyticsKernelSchoolAliasPolicy',
    'teacherCompareSchoolIsolationPolicy',
    'teacherTownshipValueMismatches',
    'teacherTownshipAverageMismatches',
    'standard0527'
];

protectedPolicies.forEach((token) => {
    assert.ok(snapshotSource.includes(token), `calculation snapshot must keep protected policy guard: ${token}`);
});

assert.ok(
    snapshotSource.includes('console.log(JSON.stringify(snapshot, null, 2))'),
    'calculation snapshot should print structured JSON for release comparison'
);
assert.strictEqual(
    scripts['test:calculation-snapshot:contract'],
    'node scripts/test-calculation-snapshot-contract.js',
    'package.json should expose the calculation snapshot source contract'
);
assert.ok(
    scripts['check:calculation']?.includes('test:calculation-snapshot:contract'),
    'calculation release check should run the source contract before browser snapshot'
);

console.log(JSON.stringify({
    ok: true,
    protectedPolicies: protectedPolicies.length
}, null, 2));
