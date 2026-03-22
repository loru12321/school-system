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

function run() {
    runCompareSharedFallbackTest();
    runCompareSelectorsFallbackTest();
    console.log('compare helper fallback tests passed');
}

run();
