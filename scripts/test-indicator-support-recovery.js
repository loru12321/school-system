/**
 * Regression: a scoreless cohort metadata record must be able to recover the
 * active exam's Grade 9 indicator inputs without applying that exam's scores.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const examKey = '2022级-9年级-2025-2026-下学期-中考-2026-07-28';
const storage = {
    getItem() { return null; },
    setItem() {},
    removeItem() {}
};
const requests = [];
const restored = { targets: null, indicator: null, runtimeSyncs: 0, uiRefreshes: 0 };
const originalRows = [{ name: '原成绩不得被替换' }];

const cloudWindow = {
    addEventListener() {},
    localStorage: storage,
    sessionStorage: storage,
    setTimeout() {},
    clearTimeout() {},
    requestIdleCallback() {},
    CloudApi: {},
    sbClient: null,
    idbKeyval: null,
    CURRENT_COHORT_ID: '2022',
    CURRENT_EXAM_ID: examKey,
    RAW_DATA: originalRows,
    CloudDataService: {
        async selectSystemData(options) {
            requests.push({ ...options });
            if (options.keyEq === 'cohort::2022') {
                return {
                    data: {
                        content: JSON.stringify({
                            CURRENT_COHORT_ID: '2022',
                            CURRENT_EXAM_ID: examKey,
                            TARGETS: {},
                            INDICATOR_PARAMS: { ind1: '', ind2: '', highSchoolLine: '390' }
                        })
                    },
                    error: null
                };
            }
            if (options.keyEq === examKey) {
                return {
                    data: {
                        content: JSON.stringify({
                            CURRENT_COHORT_ID: '2022',
                            CURRENT_EXAM_ID: examKey,
                            RAW_DATA: [{ name: '云端成绩不可应用' }],
                            TARGETS: { 银山实验: { t1: 21, t2: 69 } },
                            INDICATOR_PARAMS: { ind1: '222', ind2: '1353', highSchoolLine: '390' }
                        })
                    },
                    error: null
                };
            }
            if (options.keyLike === 'BACKUP_cohort::2022_pre_split_%') {
                return { data: [], error: null };
            }
            return { data: null, error: null };
        }
    },
    setTargetsState(value) { restored.targets = value; },
    setIndicatorState(value) { restored.indicator = value; },
    syncRuntimeStateToWindow() { restored.runtimeSyncs += 1; },
    updateIndicatorUIState() { restored.uiRefreshes += 1; }
};
const context = {
    window: cloudWindow,
    localStorage: storage,
    sessionStorage: storage,
    setTimeout() {},
    clearTimeout() {},
    console,
    Promise,
    JSON,
    Object,
    Array,
    String,
    Number,
    Math,
    Date,
    Set,
    Map
};

const source = fs.readFileSync(path.join(root, 'public/assets/js/cloud.js'), 'utf8');
vm.runInNewContext(source, context, { filename: 'cloud.js' });

const appSource = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');
const indicatorCalcSource = fs.readFileSync(path.join(root, 'public/assets/js/indicator-calc-runtime.js'), 'utf8');
assert.ok(
    !appSource.includes('SummaryIndicatorHydrationState'),
    'summary indicator hydration must not permanently suppress retries after one timeout'
);
assert.ok(
    appSource.includes('const activeLoad = IndicatorCloudInputState.promise;')
        && appSource.includes('Promise.race([\n        activeLoad,'),
    'the UI timeout must wrap the active cloud load instead of replacing or cancelling it'
);
assert.ok(
    appSource.includes("if (ready && document.querySelector('#tb-summary tbody tr') && typeof calcSummary === 'function')"),
    'a late successful support restore must refresh an already-rendered summary'
);
assert.ok(
    appSource.includes('const indicatorReady = indicatorRowsForSummary.length > 0 && indicatorScoreMap.size > 0;'),
    'computed indicator rows must render even if input controls are hydrating'
);
assert.ok(
    appSource.includes("window.__LAST_INDICATOR_CALC_CONTEXT_KEY__ === getIndicatorResultContextKey()"),
    'summary fallback rows must be scoped to the active cohort, exam and score version'
);
assert.ok(
    indicatorCalcSource.includes('markIndicatorResultContext();'),
    'indicator calculations must tag their result context before summary fallback'
);

(async () => {
    const changed = await cloudWindow.loadIndicatorSupportFromCloud();

    assert.strictEqual(changed, true, 'active-exam support should restore missing inputs');
    assert.strictEqual(restored.targets?.银山实验?.t1, 21, 'must recover target-one count from the active exam');
    assert.strictEqual(restored.targets?.银山实验?.t2, 69, 'must recover target-two count from the active exam');
    assert.strictEqual(restored.indicator?.ind1, '222', 'must recover the first rank line');
    assert.strictEqual(restored.indicator?.ind2, '1353', 'must recover the second rank line');
    assert.strictEqual(restored.indicator?.highSchoolLine, '390', 'must retain the admission line');
    assert.strictEqual(restored.runtimeSyncs, 1, 'restored support state should sync once');
    assert.strictEqual(restored.uiRefreshes, 1, 'indicator UI should refresh once');
    assert.strictEqual(cloudWindow.RAW_DATA, originalRows, 'support recovery must never replace the loaded score rows');
    assert.ok(
        requests.some((request) => request.keyEq === examKey),
        'support recovery must query the exact active exam record when cohort metadata is incomplete'
    );
    assert.ok(
        !requests.some((request) => request.kind === 'exam'),
        'support recovery must not scan all exam snapshots'
    );

    console.log('✅ indicator support recovery — active exam inputs restored without applying score data');
})().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
