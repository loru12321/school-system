const assert = require('assert');
const path = require('path');

const createReportSessionStateRuntime = require(path.resolve(__dirname, '../public/assets/js/report-session-state-runtime.js'));

function run() {
    const root = {
        CURRENT_REPORT_STUDENT: { name: 'Alice', class: '701', scores: { 语文: 96 } },
        BATCH_AI_CACHE: { '示范学校_701_Alice': '表现稳定，继续保持。' },
        IS_BATCH_AI_RUNNING: true,
        CURRENT_CONTEXT_STUDENTS: [{ name: 'Alice' }, { name: 'Bob' }]
    };

    const reportSessionState = createReportSessionStateRuntime(root);

    assert.deepStrictEqual(reportSessionState.getCurrentReportStudent(), { name: 'Alice', class: '701', scores: { 语文: 96 } });
    assert.deepStrictEqual(reportSessionState.getBatchAICache(), { '示范学校_701_Alice': '表现稳定，继续保持。' });
    assert.strictEqual(reportSessionState.getIsBatchAiRunning(), true);
    assert.deepStrictEqual(reportSessionState.getCurrentContextStudents(), [{ name: 'Alice' }, { name: 'Bob' }]);

    const snapshot = reportSessionState.syncReportSessionState({
        currentReportStudent: { name: 'Carol', class: '702', scores: { 数学: 101 } },
        batchAiCache: { '实验学校_702_Carol': '数学优势明显。' },
        isBatchAiRunning: false,
        currentContextStudents: [{ name: 'Carol' }]
    });

    assert.deepStrictEqual(snapshot.currentReportStudent, { name: 'Carol', class: '702', scores: { 数学: 101 } });
    assert.deepStrictEqual(snapshot.batchAiCache, { '实验学校_702_Carol': '数学优势明显。' });
    assert.strictEqual(snapshot.isBatchAiRunning, false);
    assert.deepStrictEqual(snapshot.currentContextStudents, [{ name: 'Carol' }]);

    reportSessionState.clearReportSessionState();
    assert.strictEqual(reportSessionState.getCurrentReportStudent(), null);
    assert.deepStrictEqual(reportSessionState.getBatchAICache(), {});
    assert.strictEqual(reportSessionState.getIsBatchAiRunning(), false);
    assert.deepStrictEqual(reportSessionState.getCurrentContextStudents(), []);

    console.log('report-session-state-runtime tests passed');
}

run();
