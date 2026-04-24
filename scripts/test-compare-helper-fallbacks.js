const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function runCompareSharedFallbackTest() {
    const sharedPath = path.resolve(__dirname, '../public/assets/js/compare-shared-runtime.js');
    const sharedCode = fs.readFileSync(sharedPath, 'utf8');

    let warnedKey = '';
    const toasts = [];
    const runtimeState = {
        groups: [
            [
                { id: 'exam-a', label: 'Exam A' },
                { id: 'exam-b', label: 'Exam B' }
            ]
        ]
    };

    const context = {
        console,
        window: {
            CompareSessionState: {
                getDuplicateCompareExams: () => runtimeState.groups,
                getDuplicateCompareWarnedKey: () => warnedKey,
                setDuplicateCompareWarnedKey: (key) => {
                    warnedKey = String(key || '').trim();
                    return warnedKey;
                }
            },
            UI: {
                toast: (message, type) => {
                    toasts.push({ message, type });
                }
            }
        }
    };
    context.SUBJECTS = ['语文', '数学'];
    context.THRESHOLDS = {
        语文: { exc: 90, pass: 60 },
        数学: { exc: 90, pass: 60 }
    };
    context.CONFIG = { excRate: 0.2 };
    context.RAW_DATA = [];
    context.window.SUBJECTS = context.SUBJECTS;
    context.window.THRESHOLDS = context.THRESHOLDS;
    context.window.CONFIG = context.CONFIG;
    context.window.RAW_DATA = context.RAW_DATA;
    context.UI = context.window.UI;
    context.globalThis = context.window;

    vm.runInNewContext(sharedCode, context, { filename: sharedPath });

    assert.strictEqual(typeof context.window.warnIfDuplicateCompareSnapshots, 'function');
    context.window.warnIfDuplicateCompareSnapshots();

    assert.strictEqual(warnedKey, 'Exam A|Exam B');
    assert.strictEqual(toasts.length, 1);
    assert.strictEqual(toasts[0].type, 'warning');

    const overview = context.window.buildSchoolRankOverviewForRows([
        { school: '甲校', total: 180, scores: { 语文: 92, 数学: 88 } },
        { school: '甲校', total: 170, scores: { 语文: 89, 数学: 81 } },
        { school: '乙校', total: 160, scores: { 语文: 84, 数学: 79 } },
        { school: '乙校', total: 150, scores: { 语文: 80, 数学: 72 } }
    ], ['语文', '数学']);

    assert.ok(overview);
    assert.strictEqual(overview.schools.length, 2);
    assert.strictEqual(overview.schools[0].school, '甲校');
    assert.strictEqual(overview.schools[0].total.rankAvg, 1);
    assert.strictEqual(overview.schools[0].subjects['语文'].rankAvg, 1);
    assert.strictEqual(overview.schools[1].subjects['数学'].rankAvg, 2);
    assert.strictEqual(typeof context.window.getSchoolRankOverviewEntryBySchool, 'function');
    assert.strictEqual(context.window.getSchoolRankOverviewEntryBySchool(overview, '甲校').school, '甲校');
}

function runCompareSelectorsFallbackTest() {
    const selectorsPath = path.resolve(__dirname, '../public/assets/js/compare-selectors-runtime.js');
    const selectorsCode = fs.readFileSync(selectorsPath, 'utf8');

    const syncState = {};
    let fetchCalled = false;
    const pendingFetch = new Promise(() => {});

    const context = {
        console,
        Promise,
        setTimeout,
        clearTimeout,
        CURRENT_COHORT_ID: '2022',
        localStorage: {
            getItem: () => ''
        },
        document: {
            getElementById: () => null
        },
        window: {
            CompareSessionState: {
                getCompareExamSyncState: () => syncState,
                setCompareExamSyncState: (nextState) => {
                    const source = JSON.parse(JSON.stringify(nextState || {}));
                    Object.keys(syncState).forEach((key) => delete syncState[key]);
                    Object.assign(syncState, source);
                    return syncState;
                }
            },
            CloudManager: {
                fetchCohortExamsToLocal: () => {
                    fetchCalled = true;
                    return pendingFetch;
                }
            }
        }
    };
    context.globalThis = context.window;
    context.window.localStorage = context.localStorage;
    context.window.document = context.document;

    vm.runInNewContext(selectorsCode, context, { filename: selectorsPath });

    assert.strictEqual(typeof context.window.trySyncCompareExamOptions, 'function');
    const started = context.window.trySyncCompareExamOptions();

    assert.strictEqual(started, true);
    assert.strictEqual(fetchCalled, true);
    assert.ok(syncState['2022']);
    assert.strictEqual(syncState['2022'].pending, true);
    assert.ok(syncState['2022'].lastAttempt > 0);
}

function runProgressAnalysisFallbackTest() {
    const progressPath = path.resolve(__dirname, '../public/assets/js/progress-analysis-runtime.js');
    const progressCode = fs.readFileSync(progressPath, 'utf8');

    const syncState = {};
    let fetchCalled = false;
    const pendingFetch = new Promise(() => {});

    const context = {
        console,
        Promise,
        setTimeout,
        clearTimeout,
        CURRENT_COHORT_ID: '2022',
        localStorage: {
            getItem: () => ''
        },
        document: {
            getElementById: () => null
        },
        window: {
            __PROGRESS_ANALYSIS_RUNTIME_PATCHED__: false,
            trendChartInstance: null,
            sankeyChartInstance: null,
            CompareSessionState: {
                getCompareExamSyncState: () => syncState,
                setCompareExamSyncState: (nextState) => {
                    const source = JSON.parse(JSON.stringify(nextState || {}));
                    Object.keys(syncState).forEach((key) => delete syncState[key]);
                    Object.assign(syncState, source);
                    return syncState;
                }
            },
            CloudManager: {
                fetchCohortExamsToLocal: () => {
                    fetchCalled = true;
                    return pendingFetch;
                }
            }
        }
    };
    context.globalThis = context.window;
    context.window.localStorage = context.localStorage;
    context.window.document = context.document;

    vm.runInNewContext(progressCode, context, { filename: progressPath });

    assert.strictEqual(typeof context.window.trySyncCompareExamOptions, 'function');
    const started = context.window.trySyncCompareExamOptions();

    assert.strictEqual(started, true);
    assert.strictEqual(fetchCalled, true);
    assert.ok(syncState['2022']);
    assert.strictEqual(syncState['2022'].pending, true);
    assert.ok(syncState['2022'].lastAttempt > 0);
}

function run() {
    runCompareSharedFallbackTest();
    runCompareSelectorsFallbackTest();
    runProgressAnalysisFallbackTest();
    console.log('compare helper fallback tests passed');
}

run();
