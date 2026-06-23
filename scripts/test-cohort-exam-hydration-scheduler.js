const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

async function run() {
    const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/app.js'), 'utf8');
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
        cloudWorkspaceSource.includes('minCount > activeMinCount || (activeLatestOnly && !latestOnly)'),
        'cloud exam sync should upgrade an in-flight latest-only fetch when comparisons need history'
    );
    assert.ok(
        cloudWorkspaceSource.includes('latestOnly: false') && cloudWorkspaceSource.includes('maxFetch: undefined'),
        'upgraded cloud exam sync must request a full historical fetch'
    );
    assert.ok(
        source.includes("Object.prototype.hasOwnProperty.call(db, 'TARGETS')"),
        'snapshot restore must preserve existing targets when an exam snapshot omits TARGETS'
    );

    const start = source.indexOf('const CohortExamHydrationScheduler = (() => {');
    const endMarker = 'window.CohortExamHydrationScheduler = CohortExamHydrationScheduler;';
    const end = source.indexOf(endMarker, start) + endMarker.length;
    assert.ok(start >= 0 && end > start, 'hydration scheduler source should be present');

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
        CURRENT_COHORT_ID: '2022',
        readWorkspaceCohortId: () => '2022',
        tryAutoRestoreWorkspaceExam: () => true,
        scheduleExamSelectorRefresh: () => {},
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
    vm.runInNewContext(source.slice(start, end), context, { filename: 'cohort-hydration-scheduler.js' });

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
