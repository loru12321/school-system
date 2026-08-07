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
