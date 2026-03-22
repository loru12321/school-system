const assert = require('assert');
const path = require('path');

const createRuntime = require(path.resolve(__dirname, '../public/assets/js/compare-summary-state-runtime.js'));

const root = {};
const runtime = createRuntime(root);

assert.deepStrictEqual(runtime.snapshotCompareSummaryState(), {
    multiPeriodCompareCache: null,
    allTeachersDiffCache: null
});

runtime.setMultiPeriodCompareCache({ school: '示例学校', examIds: ['A', 'B'] });
assert.deepStrictEqual(runtime.getMultiPeriodCompareCache(), { school: '示例学校', examIds: ['A', 'B'] });

runtime.setAllTeachersDiffCache({ results: [{ teacher: '张三' }], examIds: ['A', 'B'] });
assert.deepStrictEqual(runtime.getAllTeachersDiffCache(), { results: [{ teacher: '张三' }], examIds: ['A', 'B'] });

runtime.syncCompareSummaryState({
    multiPeriodCompareCache: { school: '另一学校', periodCount: 3 },
    allTeachersDiffCache: { results: [], school: '另一学校' }
});
assert.deepStrictEqual(runtime.getMultiPeriodCompareCache(), { school: '另一学校', periodCount: 3 });
assert.deepStrictEqual(runtime.getAllTeachersDiffCache(), { results: [], school: '另一学校' });

runtime.clearCompareSummaryState();
assert.strictEqual(runtime.getMultiPeriodCompareCache(), null);
assert.strictEqual(runtime.getAllTeachersDiffCache(), null);

console.log('compare-summary-state-runtime tests passed');
