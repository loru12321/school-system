const assert = require('assert');
const path = require('path');

const createWorkspaceStateRuntime = require(path.resolve(__dirname, '../public/assets/js/workspace-state-runtime.js'));

function createMockStorage(initialState = {}) {
    const state = new Map(Object.entries(initialState));
    return {
        getItem(key) {
            return state.has(key) ? state.get(key) : null;
        },
        setItem(key, value) {
            state.set(key, String(value));
        },
        removeItem(key) {
            state.delete(key);
        }
    };
}

function run() {
    const root = {
        localStorage: createMockStorage({
            CURRENT_PROJECT_KEY: 'cohort::2022',
            CURRENT_COHORT_ID: '2022',
            CURRENT_COHORT_META: JSON.stringify({ id: '2022', year: '2022', startGrade: 6 }),
            CURRENT_EXAM_ID: '2022级_9年级_2025-2026_上学期_期末'
        })
    };

    const workspaceState = createWorkspaceStateRuntime(root);

    assert.strictEqual(workspaceState.getCurrentProjectKey(), 'cohort::2022');
    assert.strictEqual(workspaceState.getCurrentCohortId(), '2022');
    assert.strictEqual(workspaceState.getCurrentExamId(), '2022级_9年级_2025-2026_上学期_期末');
    assert.deepStrictEqual(workspaceState.getCurrentCohortMeta(), { id: '2022', year: '2022', startGrade: 6 });
    assert.strictEqual(workspaceState.getCohortKey('2023'), 'cohort::2023');
    assert.strictEqual(workspaceState.inferCohortIdFromValue('2024级_7年级_2026-2027_上学期_期中'), '2024');

    workspaceState.setCurrentCohortId('2025');
    assert.strictEqual(root.localStorage.getItem('CURRENT_COHORT_ID'), '2025');
    assert.strictEqual(root.localStorage.getItem('CURRENT_PROJECT_KEY'), 'cohort::2025');

    workspaceState.setCurrentCohortMeta({ year: '2025' });
    assert.deepStrictEqual(workspaceState.getCurrentCohortMeta(), { id: '2025', year: '2025', startGrade: 6 });

    const snapshot = workspaceState.syncWorkspaceState({
        currentProjectKey: 'cohort::2026',
        currentCohortId: '2026',
        currentCohortMeta: { id: '2026', year: '2026', startGrade: 6 },
        currentExamId: '2026级_7年级_2026-2027_上学期_月考',
        cohortDb: { currentExamId: '2026级_7年级_2026-2027_上学期_月考', exams: {} }
    });

    assert.strictEqual(snapshot.currentProjectKey, 'cohort::2026');
    assert.strictEqual(snapshot.currentCohortId, '2026');
    assert.strictEqual(snapshot.currentExamId, '2026级_7年级_2026-2027_上学期_月考');
    assert.deepStrictEqual(snapshot.currentCohortMeta, { id: '2026', year: '2026', startGrade: 6 });
    assert.deepStrictEqual(snapshot.cohortDb, { currentExamId: '2026级_7年级_2026-2027_上学期_月考', exams: {} });
    assert.strictEqual(root.CURRENT_PROJECT_KEY, 'cohort::2026');
    assert.strictEqual(root.CURRENT_COHORT_ID, '2026');

    assert.strictEqual(workspaceState.hasSavedWorkspace(), true);

    workspaceState.clearWorkspaceIdentity({ clearCohortDb: true });
    assert.strictEqual(root.localStorage.getItem('CURRENT_PROJECT_KEY'), null);
    assert.strictEqual(root.localStorage.getItem('CURRENT_COHORT_ID'), null);
    assert.strictEqual(root.localStorage.getItem('CURRENT_COHORT_META'), null);
    assert.strictEqual(root.localStorage.getItem('CURRENT_EXAM_ID'), null);
    assert.strictEqual(workspaceState.getCohortDb(), null);
    assert.strictEqual(workspaceState.hasSavedWorkspace(), false);

    console.log('workspace-state-runtime tests passed');
}

run();
