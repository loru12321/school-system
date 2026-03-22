const assert = require('assert');
const path = require('path');

const createCompareSessionStateRuntime = require(path.resolve(__dirname, '../public/assets/js/compare-session-state-runtime.js'));

function run() {
    const root = {
        CLOUD_COMPARE_TARGET: { name: 'Alice', class: '701', school: '实验学校' },
        CLOUD_STUDENT_COMPARE_CONTEXT: {
            prevExamId: '2025_上学期期末',
            latestExamId: '2025_下学期期中',
            owner: { name: 'Alice', class: '701', school: '实验学校' },
            previousRecord: { total: 680 }
        },
        CLOUD_COMPARE_PREV_DATA_BACKUP: [{ name: 'Alice', total: 680 }],
        DUPLICATE_COMPARE_EXAMS: [[{ id: 'exam-a', label: 'A' }, { id: 'exam-b', label: 'B' }]],
        __DUPLICATE_COMPARE_WARNED_KEY: 'A|B',
        __COMPARE_EXAM_SYNC_STATE: { '2022': { pending: true, lastAttempt: 1234 } }
    };

    const compareSessionState = createCompareSessionStateRuntime(root);

    assert.deepStrictEqual(compareSessionState.getCloudCompareTarget(), { name: 'Alice', class: '701', school: '实验学校' });
    assert.strictEqual(compareSessionState.getCloudStudentCompareContext().prevExamId, '2025_上学期期末');
    assert.deepStrictEqual(compareSessionState.getCloudComparePrevDataBackup(), [{ name: 'Alice', total: 680 }]);
    assert.strictEqual(compareSessionState.getDuplicateCompareWarnedKey(), 'A|B');
    assert.deepStrictEqual(compareSessionState.getDuplicateCompareExams(), [[{ id: 'exam-a', label: 'A' }, { id: 'exam-b', label: 'B' }]]);

    const syncEntry = compareSessionState.ensureCompareExamSyncStateEntry('2023');
    assert.deepStrictEqual(syncEntry, { pending: false, lastAttempt: 0 });
    syncEntry.pending = true;
    syncEntry.lastAttempt = 5678;
    assert.deepStrictEqual(compareSessionState.getCompareExamSyncState()['2023'], { pending: true, lastAttempt: 5678 });

    const snapshot = compareSessionState.syncCompareSessionState({
        cloudCompareTarget: { name: 'Bob', class: '802', school: '示范学校' },
        cloudStudentCompareContext: { prevExamId: 'prev', latestExamId: 'latest', owner: { name: 'Bob' } },
        cloudComparePrevDataBackup: [{ name: 'Bob', total: 702 }],
        duplicateCompareExams: [],
        duplicateCompareWarnedKey: '',
        compareExamSyncState: { '2024': { pending: true, lastAttempt: 9999 } }
    });

    assert.deepStrictEqual(snapshot.cloudCompareTarget, { name: 'Bob', class: '802', school: '示范学校' });
    assert.strictEqual(snapshot.cloudStudentCompareContext.latestExamId, 'latest');
    assert.deepStrictEqual(snapshot.cloudComparePrevDataBackup, [{ name: 'Bob', total: 702 }]);
    assert.deepStrictEqual(snapshot.duplicateCompareExams, []);
    assert.strictEqual(snapshot.duplicateCompareWarnedKey, '');
    assert.deepStrictEqual(snapshot.compareExamSyncState, { '2024': { pending: true, lastAttempt: 9999 } });

    compareSessionState.clearCompareSessionState();
    assert.strictEqual(compareSessionState.getCloudCompareTarget(), null);
    assert.strictEqual(compareSessionState.getCloudStudentCompareContext(), null);
    assert.strictEqual(compareSessionState.getCloudComparePrevDataBackup(), null);
    assert.deepStrictEqual(compareSessionState.getDuplicateCompareExams(), []);
    assert.strictEqual(compareSessionState.getDuplicateCompareWarnedKey(), '');
    assert.deepStrictEqual(compareSessionState.getCompareExamSyncState(), {});

    console.log('compare-session-state-runtime tests passed');
}

run();
