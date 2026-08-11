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
    context.UI = context.window.UI;
    context.globalThis = context.window;

    vm.runInNewContext(sharedCode, context, { filename: sharedPath });

    assert.strictEqual(typeof context.window.warnIfDuplicateCompareSnapshots, 'function');
    context.window.warnIfDuplicateCompareSnapshots();

    assert.strictEqual(warnedKey, 'Exam A|Exam B');
    assert.strictEqual(toasts.length, 1);
    assert.strictEqual(toasts[0].type, 'warning');
}

function runCompareExamRowsCacheTest() {
    const sharedPath = path.resolve(__dirname, '../public/assets/js/compare-shared-runtime.js');
    const sharedCode = fs.readFileSync(sharedPath, 'utf8');
    const rawRows = [
        { name: '甲', school: '银山实验学校', class: '6.1', total: 90, scores: { 语文: 90 } },
        { name: '乙', school: '银山实验学校', class: '6.1', total: 95, scores: { 语文: 95 } }
    ];
    const localStorage = { getItem: () => '' };
    const context = {
        console,
        CURRENT_COHORT_ID: '2022',
        CURRENT_EXAM_ID: '2022_6年级_期中_2025-11-20',
        RAW_DATA: rawRows,
        SUBJECTS: ['语文'],
        normalizeClass: (value) => String(value || '').trim(),
        localStorage,
        document: { getElementById: () => null },
        window: {
            __RAW_DATA_VERSION: 1,
            CURRENT_COHORT_ID: '2022',
            CURRENT_EXAM_ID: '2022_6年级_期中_2025-11-20',
            RAW_DATA: rawRows,
            SUBJECTS: ['语文'],
            localStorage,
            normalizeClass: (value) => String(value || '').trim()
        }
    };
    context.globalThis = context.window;

    vm.runInNewContext(sharedCode, context, { filename: sharedPath });

    const first = context.window.getExamRowsForCompare(context.CURRENT_EXAM_ID);
    const second = context.window.getExamRowsForCompare(context.CURRENT_EXAM_ID);
    assert.notStrictEqual(first, second);
    assert.strictEqual(first.find((row) => row.name === '乙').rankSchool, 1);

    rawRows[0].total = 99;
    context.window.__RAW_DATA_VERSION = 2;
    const refreshed = context.window.getExamRowsForCompare(context.CURRENT_EXAM_ID);
    assert.strictEqual(refreshed.find((row) => row.name === '甲').rankSchool, 1);
}

function runCompareExamReadinessTest() {
    const sharedPath = path.resolve(__dirname, '../public/assets/js/compare-shared-runtime.js');
    const sharedCode = fs.readFileSync(sharedPath, 'utf8');
    const rawRows = [{ name: '当前学生', school: '银山实验学校', class: '9.1', total: 600, scores: { 语文: 120 } }];
    const readyRows = [{ name: '历史学生', school: '银山实验学校', class: '9.1', total: 580, scores: { 语文: 118 } }];
    const db = {
        exams: {
            '2022_9年级_一模_2026-04-16': { examId: '2022_9年级_一模_2026-04-16', data: [] },
            '2022_9年级_二模_2026-05-27': { examId: '2022_9年级_二模_2026-05-27', data: readyRows }
        }
    };
    const localStorage = { getItem: () => '' };
    const context = {
        console,
        CURRENT_COHORT_ID: '2022',
        CURRENT_EXAM_ID: '2022_9年级_中考_2026-07-28',
        RAW_DATA: rawRows,
        SUBJECTS: ['语文'],
        CohortDB: { ensure: () => db },
        normalizeClass: (value) => String(value || '').trim(),
        localStorage,
        document: { getElementById: () => null },
        window: {
            __RAW_DATA_VERSION: 1,
            CURRENT_COHORT_ID: '2022',
            CURRENT_EXAM_ID: '2022_9年级_中考_2026-07-28',
            RAW_DATA: rawRows,
            SUBJECTS: ['语文'],
            CohortDB: { ensure: () => db },
            normalizeClass: (value) => String(value || '').trim(),
            localStorage
        }
    };
    context.globalThis = context.window;

    vm.runInNewContext(sharedCode, context, { filename: sharedPath });
    const ids = context.window.listAvailableExamsForCompare().map((entry) => entry.id);
    assert.ok(ids.includes('2022_9年级_中考_2026-07-28'));
    assert.ok(ids.includes('2022_9年级_二模_2026-05-27'));
    assert.ok(!ids.includes('2022_9年级_一模_2026-04-16'));
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

function runSchoolNormalizationCacheTest() {
    const runtimePath = path.resolve(__dirname, '../public/assets/js/school-normalization-runtime.js');
    const runtimeCode = fs.readFileSync(runtimePath, 'utf8');
    const localStorageState = new Map();
    const context = {
        console,
        localStorage: {
            getItem: (key) => localStorageState.get(key) || null,
            setItem: (key, value) => localStorageState.set(key, String(value))
        },
        SCHOOLS: {},
        TARGETS: {},
        MY_SCHOOL: '',
        window: {
            __SCHOOL_NORMALIZATION_RUNTIME_PATCHED__: false,
            SYS_VARS: { schoolAliases: [] },
            SCHOOLS: {},
            TARGETS: {},
            MY_SCHOOL: ''
        }
    };
    context.globalThis = context.window;
    context.window.localStorage = context.localStorage;

    vm.runInNewContext(runtimeCode, context, { filename: runtimePath });

    assert.strictEqual(context.window.normalizeSchoolName('银山实验学校'), 'canon:银山实验');
    assert.strictEqual(context.window.areSchoolNamesEquivalent('银山实验学校', '银山实验'), true);
    context.window.replaceCustomSchoolAliasStore([{ alias: '临时实验学校', canonical: '银山实验' }]);
    assert.strictEqual(context.window.areSchoolNamesEquivalent('临时实验学校', '银山实验'), true);
    assert.strictEqual(typeof context.window.clearSchoolNormalizationCache, 'function');
}

function run() {
    runCompareSharedFallbackTest();
    runCompareExamRowsCacheTest();
    runCompareExamReadinessTest();
    runCompareSelectorsFallbackTest();
    runProgressAnalysisFallbackTest();
    runSchoolNormalizationCacheTest();
    console.log('compare helper fallback tests passed');
}

run();
