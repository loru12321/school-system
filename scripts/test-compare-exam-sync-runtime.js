const assert = require('assert');
const path = require('path');
const fs = require('fs');

function run() {
    const runtimePath = path.resolve(__dirname, '../public/assets/js/compare-exam-sync-runtime.js');
    const progressPath = path.resolve(__dirname, '../public/assets/js/progress-analysis-runtime.js');
    const createRuntime = require(runtimePath);
    const syncSource = fs.readFileSync(runtimePath, 'utf8');
    const progressSource = fs.readFileSync(progressPath, 'utf8');

    assert.ok(syncSource.includes('latestOnly: false'), 'compare exam sync should request full cloud exam history by default');
    assert.ok(syncSource.includes('minCount: Number(settings.minCount || 50) || 50'), 'compare exam sync should not stop after only two cached exams');
    assert.ok(progressSource.includes('fetchOptions: { latestOnly: false, maxFetch: 2, minCount: 2, background: true }'), 'progress compare selector sync should hydrate only enough exams for default selectors');
    assert.ok(progressSource.includes('fetchCohortExamsToLocal(cohortId, { latestOnly: false, maxFetch: 2, minCount: 2, background: true })'), 'progress baseline sync should avoid full-history hydration during module entry');

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

    const started = runtime.trySyncOptions({
        cohortId: 'cohort:2022',
        fetchOptions: {
            background: true,
            minCount: 2,
            maxFetch: 4,
            refreshSelectors: false
        }
    });
    assert.strictEqual(started, true);
    assert.deepStrictEqual(fetchArgs, ['2022', {
        background: true,
        minCount: 2,
        maxFetch: 4,
        refreshSelectors: false
    }]);
    assert.strictEqual(syncState['2022'].pending, true);
    assert.ok(syncState['2022'].lastAttempt > 0);

    fetchArgs = null;
    syncState['2023'] = { pending: false, lastAttempt: 0 };
    const defaultStarted = runtime.trySyncOptions({ cohortId: '2023', throttleMs: 0 });
    assert.strictEqual(defaultStarted, true);
    assert.deepStrictEqual(fetchArgs, ['2023', { latestOnly: false, maxFetch: 0, minCount: 50 }]);

    console.log('compare-exam-sync-runtime tests passed');
}

run();
