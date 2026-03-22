const assert = require('assert');
const path = require('path');

const createRuntime = require(path.resolve(__dirname, '../public/assets/js/compare-summary-state-runtime.js'));

function run() {
    const root = {};
    const runtime = createRuntime(root);

    assert.deepStrictEqual(runtime.snapshotCompareSummaryState(), {
        multiPeriodCompareCache: null,
        allTeachersDiffCache: null
    });

    runtime.setMultiPeriodCompareCache({ school: 'Demo School', examIds: ['A', 'B'] });
    assert.deepStrictEqual(runtime.getMultiPeriodCompareCache(), { school: 'Demo School', examIds: ['A', 'B'] });

    runtime.setAllTeachersDiffCache({ results: [{ teacher: 'Teacher A' }], examIds: ['A', 'B'] });
    assert.deepStrictEqual(runtime.getAllTeachersDiffCache(), { results: [{ teacher: 'Teacher A' }], examIds: ['A', 'B'] });

    assert.strictEqual(root.readMultiPeriodCompareCacheState, runtime.getMultiPeriodCompareCache);
    assert.strictEqual(root.setAllTeachersDiffCacheState, runtime.setAllTeachersDiffCache);
    assert.strictEqual(root.syncCompareSummaryRuntimeState, runtime.syncCompareSummaryState);
    assert.strictEqual(root.clearCompareSummaryRuntimeState, runtime.clearCompareSummaryState);

    runtime.syncCompareSummaryState({
        multiPeriodCompareCache: { school: 'Another School', periodCount: 3 },
        allTeachersDiffCache: { results: [], school: 'Another School' }
    });
    assert.deepStrictEqual(runtime.getMultiPeriodCompareCache(), { school: 'Another School', periodCount: 3 });
    assert.deepStrictEqual(runtime.getAllTeachersDiffCache(), { results: [], school: 'Another School' });

    runtime.clearCompareSummaryState();
    assert.strictEqual(runtime.getMultiPeriodCompareCache(), null);
    assert.strictEqual(runtime.getAllTeachersDiffCache(), null);

    const isolatedRoot = {};
    const isolatedRuntime = createRuntime(isolatedRoot);
    assert.strictEqual(isolatedRoot.readMultiPeriodCompareCacheState, isolatedRuntime.getMultiPeriodCompareCache);
    assert.strictEqual(isolatedRoot.setMultiPeriodCompareCacheState, isolatedRuntime.setMultiPeriodCompareCache);
    assert.strictEqual(isolatedRoot.clearCompareSummaryRuntimeState, isolatedRuntime.clearCompareSummaryState);

    console.log('compare-summary-state-runtime tests passed');
}

run();
