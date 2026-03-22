const assert = require('assert');
const path = require('path');

const createProgressStateRuntime = require(path.resolve(__dirname, '../public/assets/js/progress-state-runtime.js'));

function run() {
    const root = {
        PROGRESS_CACHE: [{ name: 'Alice', change: 12 }],
        PROGRESS_CACHE_FULL: [{ name: 'Alice', change: 12 }, { name: 'Bob', change: -3 }],
        MANUAL_ID_MAPPINGS: { A_1_Alice: 'Class 1' },
        LAST_VA_DATA: [{ name: 'Class 1', valueAdded: 8.2 }],
        VA_VIEW_MODE: 'class',
        __PROGRESS_QUICK_MODE: 'focus'
    };

    const progressState = createProgressStateRuntime(root);

    assert.deepStrictEqual(progressState.getProgressCache(), [{ name: 'Alice', change: 12 }]);
    assert.deepStrictEqual(progressState.getProgressCacheFull(), [{ name: 'Alice', change: 12 }, { name: 'Bob', change: -3 }]);
    assert.deepStrictEqual(progressState.getManualIdMappings(), { A_1_Alice: 'Class 1' });
    assert.deepStrictEqual(progressState.getLastVaData(), [{ name: 'Class 1', valueAdded: 8.2 }]);
    assert.strictEqual(progressState.getVaViewMode(), 'class');
    assert.strictEqual(progressState.getQuickMode(), 'focus');
    assert.strictEqual(typeof root.readProgressCacheState, 'function');
    assert.strictEqual(root.readProgressCacheState, progressState.getProgressCache);
    assert.strictEqual(root.setProgressQuickModeState, progressState.setQuickMode);
    assert.strictEqual(root.syncProgressRuntimeState, progressState.syncProgressState);
    assert.strictEqual(root.clearProgressRuntimeState, progressState.clearProgressState);

    const snapshot = progressState.syncProgressState({
        progressCache: [{ name: 'Carol', change: 5 }],
        progressCacheFull: [{ name: 'Carol', change: 5 }, { name: 'Dave', change: -2 }],
        manualIdMappings: { B_2_Carol: '__IGNORE__' },
        lastVaData: [{ name: 'Class 2', valueAdded: 3.4 }],
        vaViewMode: 'school',
        quickMode: 'my_class'
    });

    assert.deepStrictEqual(snapshot.progressCache, [{ name: 'Carol', change: 5 }]);
    assert.deepStrictEqual(snapshot.progressCacheFull, [{ name: 'Carol', change: 5 }, { name: 'Dave', change: -2 }]);
    assert.deepStrictEqual(snapshot.manualIdMappings, { B_2_Carol: '__IGNORE__' });
    assert.deepStrictEqual(snapshot.lastVaData, [{ name: 'Class 2', valueAdded: 3.4 }]);
    assert.strictEqual(snapshot.vaViewMode, 'school');
    assert.strictEqual(snapshot.quickMode, 'my_class');

    progressState.clearProgressState();
    assert.deepStrictEqual(progressState.getProgressCache(), []);
    assert.deepStrictEqual(progressState.getProgressCacheFull(), []);
    assert.deepStrictEqual(progressState.getManualIdMappings(), {});
    assert.deepStrictEqual(progressState.getLastVaData(), []);
    assert.strictEqual(progressState.getVaViewMode(), 'school');
    assert.strictEqual(progressState.getQuickMode(), 'all');

    const isolatedRoot = {};
    const isolatedRuntime = createProgressStateRuntime(isolatedRoot);
    assert.strictEqual(isolatedRoot.readProgressCacheState, isolatedRuntime.getProgressCache);
    assert.strictEqual(isolatedRoot.setProgressCacheState, isolatedRuntime.setProgressCache);
    assert.strictEqual(isolatedRoot.clearProgressRuntimeState, isolatedRuntime.clearProgressState);

    console.log('progress-state-runtime tests passed');
}

run();
