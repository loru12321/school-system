const assert = require('assert');
const path = require('path');

const createReportSessionStateRuntime = require(path.resolve(__dirname, '../public/assets/js/report-session-state-runtime.js'));

function run() {
    const root = {
        CURRENT_REPORT_STUDENT: { name: 'Alice', class: '701', scores: { math: 96 } },
        BATCH_AI_CACHE: { sample_key: 'stable output' },
        IS_BATCH_AI_RUNNING: true,
        CURRENT_CONTEXT_STUDENTS: [{ name: 'Alice' }, { name: 'Bob' }]
    };

    const reportSessionState = createReportSessionStateRuntime(root);

    assert.strictEqual(root.ReportSessionState, reportSessionState);
    assert.strictEqual(typeof root.readCurrentReportStudentState, 'function');
    assert.strictEqual(typeof root.setCurrentReportStudentState, 'function');
    assert.strictEqual(typeof root.clearCurrentReportStudentState, 'function');
    assert.strictEqual(typeof root.readBatchAICacheState, 'function');
    assert.strictEqual(typeof root.setBatchAICacheState, 'function');
    assert.strictEqual(typeof root.readIsBatchAIRunningState, 'function');
    assert.strictEqual(typeof root.setBatchAIRunningState, 'function');
    assert.strictEqual(typeof root.readCurrentContextStudentsState, 'function');
    assert.strictEqual(typeof root.setCurrentContextStudentsState, 'function');
    assert.strictEqual(typeof root.syncReportSessionRuntimeState, 'function');
    assert.strictEqual(typeof root.clearReportSessionRuntimeState, 'function');

    assert.deepStrictEqual(reportSessionState.getCurrentReportStudent(), { name: 'Alice', class: '701', scores: { math: 96 } });
    assert.deepStrictEqual(reportSessionState.getBatchAICache(), { sample_key: 'stable output' });
    assert.strictEqual(reportSessionState.getIsBatchAiRunning(), true);
    assert.deepStrictEqual(reportSessionState.getCurrentContextStudents(), [{ name: 'Alice' }, { name: 'Bob' }]);

    const snapshot = reportSessionState.syncReportSessionState({
        currentReportStudent: { name: 'Carol', class: '702', scores: { math: 101 } },
        batchAiCache: { carol_key: 'math advantage' },
        isBatchAiRunning: false,
        currentContextStudents: [{ name: 'Carol' }]
    });

    assert.deepStrictEqual(snapshot.currentReportStudent, { name: 'Carol', class: '702', scores: { math: 101 } });
    assert.deepStrictEqual(snapshot.batchAiCache, { carol_key: 'math advantage' });
    assert.strictEqual(snapshot.isBatchAiRunning, false);
    assert.deepStrictEqual(snapshot.currentContextStudents, [{ name: 'Carol' }]);
    assert.strictEqual(root.readCurrentReportStudentState().name, 'Carol');
    assert.strictEqual(root.readCurrentReportStudentState().class, '702');
    assert.strictEqual(root.readCurrentReportStudentState().scores.math, 101);
    assert.deepStrictEqual(root.readBatchAICacheState(), { carol_key: 'math advantage' });
    assert.strictEqual(root.readIsBatchAIRunningState(), false);
    assert.deepStrictEqual(root.readCurrentContextStudentsState(), [{ name: 'Carol' }]);

    root.clearCurrentReportStudentState();
    assert.strictEqual(root.readCurrentReportStudentState(), null);
    assert.deepStrictEqual(root.readBatchAICacheState(), { carol_key: 'math advantage' });
    assert.strictEqual(root.readIsBatchAIRunningState(), false);
    assert.deepStrictEqual(root.readCurrentContextStudentsState(), [{ name: 'Carol' }]);

    reportSessionState.clearReportSessionState();
    assert.strictEqual(reportSessionState.getCurrentReportStudent(), null);
    assert.deepStrictEqual(reportSessionState.getBatchAICache(), {});
    assert.strictEqual(reportSessionState.getIsBatchAiRunning(), false);
    assert.deepStrictEqual(reportSessionState.getCurrentContextStudents(), []);

    const isolatedRoot = {};
    const isolatedRuntime = createReportSessionStateRuntime(isolatedRoot);
    assert.strictEqual(isolatedRoot.clearCurrentReportStudentState, isolatedRuntime.clearCurrentReportStudent);
    assert.strictEqual(isolatedRoot.clearReportSessionRuntimeState, isolatedRuntime.clearReportSessionState);

    console.log('report-session-state-runtime tests passed');
}

run();
