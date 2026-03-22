const assert = require('assert');
const path = require('path');

const createExamStateRuntime = require(path.resolve(__dirname, '../public/assets/js/exam-state-runtime.js'));

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
        WorkspaceState: {
            getCurrentExamId() {
                return '2022-grade9-2025-2026-term1-final';
            }
        },
        localStorage: createMockStorage({
            ARCHIVE_META: JSON.stringify({ year: '2025-2026', term: 'term1', examName: 'final' }),
            CURRENT_TERM_ID: '2025-2026_term1',
            CURRENT_TEACHER_TERM_ID: '2025-2026_term1_grade9',
            ARCHIVE_LOCKED: 'true',
            ARCHIVE_LOCKED_KEY: '2022-grade9-2025-2026-term1-final'
        })
    };

    const examState = createExamStateRuntime(root);

    assert.deepStrictEqual(examState.getArchiveMeta(), { year: '2025-2026', term: 'term1', examName: 'final' });
    assert.strictEqual(examState.getCurrentTermId(), '2025-2026_term1');
    assert.strictEqual(examState.getCurrentTeacherTermId(), '2025-2026_term1_grade9');
    assert.strictEqual(examState.getTeacherTermBase('2025-2026_term1_grade9'), '2025-2026_term1');
    assert.strictEqual(examState.isArchiveLocked(), true);

    examState.setArchiveMeta({ year: '2026-2027', term: 'term2', examName: 'mock-1' });
    assert.deepStrictEqual(examState.getArchiveMeta(), { year: '2026-2027', term: 'term2', examName: 'mock-1' });

    const syncResult = examState.syncTeacherTerm('2026-2027_term2_grade8');
    assert.deepStrictEqual(syncResult, {
        exactTermId: '2026-2027_term2_grade8',
        baseTermId: '2026-2027_term2'
    });
    assert.strictEqual(examState.getCurrentTeacherTermId(), '2026-2027_term2_grade8');
    assert.strictEqual(examState.getCurrentTermId(), '2026-2027_term2');

    const snapshot = examState.syncExamState({
        archiveMeta: { year: '2027-2028', term: 'term1', examName: 'mid' },
        currentTeacherTermId: '2027-2028_term1_grade7',
        archiveLocked: true,
        archiveLockedKey: '2027-grade7-2027-2028-term1-mid'
    });
    assert.deepStrictEqual(snapshot.archiveMeta, { year: '2027-2028', term: 'term1', examName: 'mid' });
    assert.strictEqual(snapshot.currentTeacherTermId, '2027-2028_term1_grade7');
    assert.strictEqual(snapshot.currentTermId, '2027-2028_term1');
    assert.strictEqual(snapshot.archiveLocked, true);
    assert.strictEqual(snapshot.archiveLockedKey, '2027-grade7-2027-2028-term1-mid');

    examState.clearExamState();
    assert.strictEqual(examState.getArchiveMeta(), null);
    assert.strictEqual(examState.getCurrentTermId(), '');
    assert.strictEqual(examState.getCurrentTeacherTermId(), '');
    assert.strictEqual(examState.getArchiveLocked(), false);
    assert.strictEqual(examState.getArchiveLockedKey(), '');

    console.log('exam-state-runtime tests passed');
}

run();
