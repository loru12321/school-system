const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const cloudSource = fs.readFileSync(path.join(root, 'public/assets/js/cloud.js'), 'utf8');
const workspaceSource = fs.readFileSync(path.join(root, 'public/assets/js/cloud-workspace-runtime.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');

const storage = {
    getItem() {
        return null;
    },
    setItem() {},
    removeItem() {}
};
const window = {
    addEventListener() {},
    localStorage: storage,
    sessionStorage: storage,
    setTimeout() {},
    CloudApi: {}
};
const context = {
    window,
    localStorage: storage,
    sessionStorage: storage,
    setTimeout() {},
    console
};

vm.runInNewContext(cloudSource, context, { filename: 'cloud.js' });

const normalize = window.CloudWorkspaceRuntimeDeps.normalizeWorkspacePayload;
assert.strictEqual(typeof normalize, 'function', 'workspace normalizer must be shared with the hydration runtime');

function rows(count, school) {
    return Array.from({ length: count }, (_, index) => ({
        school,
        class: '1',
        name: `学生${index}`,
        total: 100,
        scores: {}
    }));
}

const staleRows = rows(480, '实验完全中学');
const latestRows = rows(7809, '银山实验学校');
const payload = {
    CURRENT_COHORT_ID: '2022',
    CURRENT_COHORT_META: { id: '2026', year: '2026', startGrade: 6 },
    CURRENT_EXAM_ID: '2026_校内首模',
    FINGERPRINT: 'stale',
    RAW_DATA: staleRows,
    SCHOOLS: {},
    COHORT_DB: {
        currentExamId: '2026_校内首模',
        exams: {
            '2022级-9年级-2025-2026-上学期-期末-2026-01-31': {
                meta: { date: '2026-01-31', grade: '9' },
                data: rows(2029, '银山实验学校'),
                createdAt: Date.parse('2026-01-31T00:00:00Z')
            },
            '2022级-9年级-2025-2026-下学期-一模-2026-04-16': {
                meta: { date: '2026-04-16', grade: '9' },
                data: latestRows,
                createdAt: Date.parse('2026-04-16T00:00:00Z')
            }
        }
    }
};

const normalized = normalize(payload);
assert.strictEqual(
    normalized.CURRENT_EXAM_ID,
    '2022级-9年级-2025-2026-下学期-一模-2026-04-16',
    'latest real exam belonging to the selected cohort should be activated'
);
assert.strictEqual(normalized.RAW_DATA.length, 7809, 'stale workspace rows should be replaced by current exam rows');
assert.ok(!normalized.COHORT_DB.exams['2026_校内首模'], 'cross-cohort stale exam should not survive normalization');
assert.strictEqual(normalized.CURRENT_COHORT_META.id, '2022', 'workspace cohort metadata should follow the selected cohort');
assert.strictEqual(
    normalize({ CURRENT_COHORT_ID: '2022', CURRENT_COHORT_META: { id: '2026', year: '2026' } }).CURRENT_COHORT_META.id,
    '2022',
    'split metadata payload should repair cohort metadata before exam data is hydrated'
);
assert.ok(
    workspaceSource.includes('normalizeWorkspacePayload: normalizeCloudWorkspacePayload'),
    'workspace runtime should consume the shared normalizer'
);
assert.ok(
    workspaceSource.includes('normalizedPayload = await supplementIndicatorPayload'),
    'cached workspace payloads should be normalized before application'
);
assert.ok(
    appSource.includes('preferredMatchesCohort'),
    'post-hydration exam restoration should reject a foreign-cohort active snapshot'
);
assert.ok(
    appSource.includes('ensureCohortRegistered(normalizedCohortId);'),
    'post-hydration exam restoration should repair stale cohort metadata'
);
assert.ok(
    appSource.includes('CohortDB.applyExamToWorkspace(preferredExamId, { renderTables: false, recalculate: false });'),
    'post-hydration exam restoration should refresh stale grade-derived settings'
);

console.log('cloud workspace normalization tests passed');
