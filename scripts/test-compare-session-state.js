const assert = require('assert');
const path = require('path');

const createCompareSessionStateRuntime = require(path.resolve(__dirname, '../public/assets/js/compare-session-state-runtime.js'));

function run() {
    const root = {
        CLOUD_COMPARE_TARGET: { name: 'Alice', class: '701', school: 'Demo School' },
        CLOUD_STUDENT_COMPARE_CONTEXT: {
            prevExamId: 'exam-prev',
            latestExamId: 'exam-latest',
            owner: { name: 'Alice', class: '701', school: 'Demo School' },
            previousRecord: { total: 680 }
        },
        CLOUD_COMPARE_PREV_DATA_BACKUP: [{ name: 'Alice', total: 680 }],
        DUPLICATE_COMPARE_EXAMS: [[{ id: 'exam-a', label: 'A' }, { id: 'exam-b', label: 'B' }]],
        __DUPLICATE_COMPARE_WARNED_KEY: 'A|B',
        __COMPARE_EXAM_SYNC_STATE: { '2022': { pending: true, lastAttempt: 1234 } }
    };

    const compareSessionState = createCompareSessionStateRuntime(root);

    assert.strictEqual(root.CompareSessionState, compareSessionState);
    assert.strictEqual(typeof root.readCloudCompareTargetState, 'function');
    assert.strictEqual(typeof root.setCloudCompareTargetState, 'function');
    assert.strictEqual(typeof root.readCloudStudentCompareContextState, 'function');
    assert.strictEqual(typeof root.setCloudStudentCompareContextState, 'function');
    assert.strictEqual(typeof root.readCloudComparePrevDataBackupState, 'function');
    assert.strictEqual(typeof root.setCloudComparePrevDataBackupState, 'function');
    assert.strictEqual(typeof root.readDuplicateCompareExamsState, 'function');
    assert.strictEqual(typeof root.setDuplicateCompareExamsState, 'function');
    assert.strictEqual(typeof root.readDuplicateCompareWarnedKeyState, 'function');
    assert.strictEqual(typeof root.setDuplicateCompareWarnedKeyState, 'function');
    assert.strictEqual(typeof root.readCompareExamSyncState, 'function');
    assert.strictEqual(typeof root.setCompareExamSyncState, 'function');
    assert.strictEqual(typeof root.ensureCompareExamSyncStateEntry, 'function');
    assert.strictEqual(typeof root.clearCloudCompareSessionState, 'function');
    assert.strictEqual(typeof root.syncCompareSessionRuntimeState, 'function');
    assert.strictEqual(typeof root.clearCompareSessionRuntimeState, 'function');

    assert.deepStrictEqual(compareSessionState.getCloudCompareTarget(), { name: 'Alice', class: '701', school: 'Demo School' });
    assert.strictEqual(compareSessionState.getCloudStudentCompareContext().prevExamId, 'exam-prev');
    assert.deepStrictEqual(compareSessionState.getCloudComparePrevDataBackup(), [{ name: 'Alice', total: 680 }]);
    assert.strictEqual(compareSessionState.getDuplicateCompareWarnedKey(), 'A|B');
    assert.deepStrictEqual(compareSessionState.getDuplicateCompareExams(), [[{ id: 'exam-a', label: 'A' }, { id: 'exam-b', label: 'B' }]]);

    const syncEntry = compareSessionState.ensureCompareExamSyncStateEntry('2023');
    assert.deepStrictEqual(syncEntry, { pending: false, lastAttempt: 0 });
    syncEntry.pending = true;
    syncEntry.lastAttempt = 5678;
    assert.deepStrictEqual(compareSessionState.getCompareExamSyncState()['2023'], { pending: true, lastAttempt: 5678 });

    const snapshot = compareSessionState.syncCompareSessionState({
        cloudCompareTarget: { name: 'Bob', class: '802', school: 'Model School' },
        cloudStudentCompareContext: { prevExamId: 'prev', latestExamId: 'latest', owner: { name: 'Bob' } },
        cloudComparePrevDataBackup: [{ name: 'Bob', total: 702 }],
        duplicateCompareExams: [],
        duplicateCompareWarnedKey: '',
        compareExamSyncState: { '2024': { pending: true, lastAttempt: 9999 } }
    });

    assert.deepStrictEqual(snapshot.cloudCompareTarget, { name: 'Bob', class: '802', school: 'Model School' });
    assert.strictEqual(snapshot.cloudStudentCompareContext.latestExamId, 'latest');
    assert.deepStrictEqual(snapshot.cloudComparePrevDataBackup, [{ name: 'Bob', total: 702 }]);
    assert.deepStrictEqual(snapshot.duplicateCompareExams, []);
    assert.strictEqual(snapshot.duplicateCompareWarnedKey, '');
    assert.deepStrictEqual(snapshot.compareExamSyncState, { '2024': { pending: true, lastAttempt: 9999 } });
    assert.deepStrictEqual(root.readCloudCompareTargetState(), { name: 'Bob', class: '802', school: 'Model School' });
    assert.strictEqual(root.readCloudStudentCompareContextState().latestExamId, 'latest');
    assert.deepStrictEqual(root.readCloudComparePrevDataBackupState(), [{ name: 'Bob', total: 702 }]);
    assert.deepStrictEqual(root.readDuplicateCompareExamsState(), []);
    assert.strictEqual(root.readDuplicateCompareWarnedKeyState(), '');
    assert.deepStrictEqual(root.readCompareExamSyncState(), { '2024': { pending: true, lastAttempt: 9999 } });

    root.clearCloudCompareSessionState();
    assert.strictEqual(root.readCloudCompareTargetState(), null);
    assert.strictEqual(root.readCloudStudentCompareContextState(), null);
    assert.strictEqual(root.readCloudComparePrevDataBackupState(), null);
    assert.deepStrictEqual(root.readDuplicateCompareExamsState(), []);
    assert.strictEqual(root.readDuplicateCompareWarnedKeyState(), '');
    assert.deepStrictEqual(root.readCompareExamSyncState(), { '2024': { pending: true, lastAttempt: 9999 } });

    compareSessionState.clearCompareSessionState();
    assert.strictEqual(compareSessionState.getCloudCompareTarget(), null);
    assert.strictEqual(compareSessionState.getCloudStudentCompareContext(), null);
    assert.strictEqual(compareSessionState.getCloudComparePrevDataBackup(), null);
    assert.deepStrictEqual(compareSessionState.getDuplicateCompareExams(), []);
    assert.strictEqual(compareSessionState.getDuplicateCompareWarnedKey(), '');
    assert.deepStrictEqual(compareSessionState.getCompareExamSyncState(), {});

    const isolatedRoot = {};
    const isolatedRuntime = createCompareSessionStateRuntime(isolatedRoot);
    assert.strictEqual(isolatedRoot.clearCloudCompareSessionState, isolatedRuntime.clearCloudCompareState);
    assert.strictEqual(isolatedRoot.clearCompareSessionRuntimeState, isolatedRuntime.clearCompareSessionState);

    console.log('compare-session-state-runtime tests passed');
}

run();
