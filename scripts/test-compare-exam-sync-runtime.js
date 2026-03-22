const assert = require('assert');
const path = require('path');

function run() {
    const runtimePath = path.resolve(__dirname, '../public/assets/js/compare-exam-sync-runtime.js');
    const createRuntime = require(runtimePath);

    const syncState = {};
    const refreshLog = [];
    let fetchArgs = null;
    const root = {
        normalizeCompareCohortId: (value) => String(value || '').trim().replace(/^cohort:/, ''),
        CompareSessionState: {
            getCompareExamSyncState: () => syncState,
            setCompareExamSyncState: (nextState) => {
                const normalized = JSON.parse(JSON.stringify(nextState || {}));
                Object.keys(syncState).forEach((key) => delete syncState[key]);
                Object.assign(syncState, normalized);
                return syncState;
            }
        },
        CloudManager: {
            fetchCohortExamsToLocal: (...args) => {
                fetchArgs = args;
                return new Promise(() => {});
            }
        },
        updateProgressMultiExamSelects: () => refreshLog.push('progress'),
        updateReportCompareExamSelects: () => refreshLog.push('report')
    };

    const runtime = createRuntime(root);
    assert.ok(runtime);
    assert.ok(root.CompareExamSyncRuntime);
    assert.strictEqual(root.CompareExamSyncRuntime, runtime);

    const entry = runtime.ensureCompareExamSyncStateEntry(' cohort:2022 ');
    assert.deepStrictEqual(entry, { pending: false, lastAttempt: 0 });
    assert.ok(syncState['2022']);

    const selects = [{ innerHTML: '' }, { innerHTML: '' }];
    runtime.setSelectPlaceholders(selects, 'Loading...');
    assert.strictEqual(selects[0].innerHTML, '<option value="">Loading...</option>');
    assert.strictEqual(selects[1].innerHTML, '<option value="">Loading...</option>');

    runtime.refreshSelectors();
    assert.deepStrictEqual(refreshLog, ['progress', 'report']);

    const started = runtime.trySyncOptions({ cohortId: 'cohort:2022', minCount: 2 });
    assert.strictEqual(started, true);
    assert.deepStrictEqual(fetchArgs, ['2022', { minCount: 2 }]);
    assert.strictEqual(syncState['2022'].pending, true);
    assert.ok(syncState['2022'].lastAttempt > 0);

    console.log('compare-exam-sync-runtime tests passed');
}

run();
