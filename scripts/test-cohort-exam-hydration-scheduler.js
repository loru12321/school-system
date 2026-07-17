const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function run() {
    const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/app.js'), 'utf8');
    const schedulerSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/cohort-exam-hydration-runtime.js'), 'utf8');
    const snapshotSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/snapshot-system-runtime.js'), 'utf8');
    const cloudSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/cloud.js'), 'utf8');
    const cloudWorkspaceSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/cloud-workspace-runtime.js'), 'utf8');
    const fastEntryStart = source.indexOf('if (options.fastEnter === true) {');
    const fastEntryEnd = source.indexOf('} else {', fastEntryStart);
    const fastEntrySource = source.slice(fastEntryStart, fastEntryEnd);
    assert.ok(fastEntryStart >= 0 && fastEntryEnd > fastEntryStart, 'fast entry hydration source should be present');
    assert.ok(!fastEntrySource.includes('minCount: 1'), 'fast entry must not schedule an insufficient one-exam sync');
    assert.ok(!fastEntrySource.includes('latestOnly: true'), 'fast entry must keep multi-period comparisons warm');
    assert.ok(!cloudSource.includes('minCount: 1'), 'idle cloud hydration must keep multi-period comparisons warm');
    assert.ok(
        cloudWorkspaceSource.includes('this._cohortExamSyncTaskOptions'),
        'cloud exam sync should track active task requirements'
    );
    assert.ok(
        cloudWorkspaceSource.includes('minCount > activeMinCount')
            && cloudWorkspaceSource.includes('activeLatestOnly && !latestOnly')
            && cloudWorkspaceSource.includes('activeMaxFetch > 0 && maxFetch === 0'),
        'cloud exam sync should upgrade an in-flight quick/latest fetch when comparisons need full history'
    );
    assert.ok(
        cloudWorkspaceSource.includes('latestOnly: false') && cloudWorkspaceSource.includes('maxFetch: undefined'),
        'upgraded cloud exam sync must request a full historical fetch'
    );
    assert.ok(
        cloudWorkspaceSource.includes('const backgroundContentLimit = options.background === true && !forceSync ? minCount : 0;')
            && cloudWorkspaceSource.includes('const maxKeysToFetch = maxFetch > 0 ? maxFetch : (latestOnly ? 1 : backgroundContentLimit);'),
        'background cloud hydration should only fetch enough exam payloads for its minCount requirement'
    );
    const backgroundHistoryDelayMatch = cloudWorkspaceSource.match(
        /const BACKGROUND_COHORT_HISTORY_DELAY_MS = (\d+);/
    );
    assert.ok(
        cloudWorkspaceSource.includes('function scheduleBackgroundCohortHistory(manager, cohortId)')
            && cloudWorkspaceSource.includes('const options = { background: true, minCount: 2 };')
            && backgroundHistoryDelayMatch
            && Number(backgroundHistoryDelayMatch[1]) <= 3000
            && cloudWorkspaceSource.includes('scheduleBackgroundCloudTask(run, BACKGROUND_COHORT_HISTORY_DELAY_MS, 12000);'),
        'workspace restore should prefetch two current-cohort exams shortly after the first paint'
    );
    assert.ok(
        snapshotSource.includes("Object.prototype.hasOwnProperty.call(db, 'TARGETS')"),
        'snapshot restore must preserve existing targets when an exam snapshot omits TARGETS'
    );
    assert.ok(
        cloudSource.includes("cached && typeof cached === 'object' && !needsIndicatorPayloadSupplement(cached)"),
        'indicator supplement lookups must bypass stale cached snapshots that lack target/parameter fields'
    );
    assert.ok(
        !cloudSource.includes('candidateKey !== preferredKey'),
        'indicator supplement must allow the preferred remote workspace key to repair stale local caches'
    );
    assert.ok(
        cloudWorkspaceSource.includes('lastAppliedCachedNeedsIndicatorRefresh')
            && cloudWorkspaceSource.includes('force: lastAppliedCachedNeedsIndicatorRefresh')
            && cloudWorkspaceSource.includes('(!force && remoteTs <= localTs + 1000)'),
        'cached workspace loads missing indicator fields must force one remote refresh'
    );

    assert.ok(
        source.includes('const CohortExamHydrationScheduler = window.CohortExamHydrationScheduler;'),
        'app.js should consume the split hydration scheduler runtime'
    );
    assert.ok(
        !source.includes('const CohortExamHydrationScheduler = (() => {'),
        'app.js should not carry the hydration scheduler implementation'
    );

    const requests = [];
    const window = {
        CloudManager: {
            fetchCohortExamsToLocal(cohortId, options) {
                requests.push({ cohortId, options: { ...options } });
                return Promise.resolve({ success: true });
            }
        }
    };
    const context = {
        window,
        localStorage: { getItem: () => '2022' },
        setTimeout,
        clearTimeout,
        Promise,
        Map,
        Math,
        Number,
        String,
        Object,
        console
    };
    window.window = window;
    window.CURRENT_COHORT_ID = '2022';
    window.readWorkspaceCohortId = () => '2022';
    window.tryAutoRestoreWorkspaceExam = () => true;
    window.scheduleExamSelectorRefresh = () => {};
    vm.runInNewContext(schedulerSource, context, { filename: 'cohort-exam-hydration-runtime.js' });

    const quick = window.CohortExamHydrationScheduler.schedule('2022', {
        delay: 30,
        minCount: 1,
        latestOnly: true
    });
    const comparison = window.CohortExamHydrationScheduler.schedule('2022', {
        delay: 0,
        minCount: 2
    });

    assert.strictEqual(quick, comparison, 'replacement scheduling must preserve the original promise');
    await Promise.all([quick, comparison]);
    assert.strictEqual(requests.length, 1, 'merged hydration demand should issue only one cloud read');
    assert.strictEqual(requests[0].cohortId, '2022');
    assert.strictEqual(requests[0].options.minCount, 2, 'comparison demand should upgrade quick hydration');
    assert.strictEqual(requests[0].options.latestOnly, undefined, 'upgraded hydration must not load only one exam');

    console.log('cohort exam hydration scheduler tests passed');
}

run().catch((error) => {
    console.error(error);
    process.exit(1);
});
