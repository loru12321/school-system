const assert = require('assert');
const path = require('path');

const createThresholdRuntime = require(path.resolve(__dirname, '../public/assets/js/threshold-runtime.js'));

const rows = [
    { school: '甲校', scores: { 数学: 100 }, total: 100 },
    { school: '甲校', scores: { 数学: 90 }, total: 90 },
    { school: '乙校', scores: { 数学: 80 }, total: 80 },
    { school: '乙校', scores: { 数学: 70 }, total: 70 },
    { school: '丙校', scores: { 数学: 60 }, total: 60 },
    { school: '丙校', scores: { 数学: 50 }, total: 50 },
    { school: '丁校', scores: { 数学: 40 }, total: 40 },
    { school: '丁校', scores: { 数学: 30 }, total: 30 },
    { school: '戊校', scores: { 数学: 20 }, total: 20 },
    { school: '戊校', scores: { 数学: 10 }, total: 10 }
];

const townshipRows = rows.slice(0, 6);
const runtime = createThresholdRuntime({});

const township = runtime.buildThresholdSnapshot({
    rows,
    subjects: ['数学'],
    townshipRows
});
assert.strictEqual(township.source, 'township');
assert.strictEqual(township.sampleCount, townshipRows.length);
assert.strictEqual(township.schoolCount, 3);
assert.strictEqual(township.thresholds.数学.exc, 100, 'excellent should use the top 15% line in descending order');
assert.strictEqual(township.thresholds.数学.pass, 80, 'pass should use the top 50% line in descending order');
assert.strictEqual(township.metadata.数学.sourceLabel, '全乡镇参评学校统一划线');

const current = runtime.buildThresholdSnapshot({
    rows,
    subjects: ['数学'],
    townshipRows: []
});
assert.strictEqual(current.source, 'current');
assert.strictEqual(current.thresholds.数学.exc, 90);
assert.strictEqual(current.thresholds.数学.pass, 60);

const ranked = runtime.buildThresholdSnapshot({
    rows: rows.slice(0, 4).map((row) => ({ ...row, school: '银山实验学校' })),
    subjects: ['数学'],
    townshipRows: [],
    topExcellent: 2,
    topPass: 3
});
assert.strictEqual(ranked.singleSchool, true);
assert.strictEqual(ranked.thresholds.total.exc, 90);
assert.strictEqual(ranked.thresholds.total.pass, 80);
assert.strictEqual(ranked.metadata.total.excellent.source, 'rank');

const explicit = runtime.buildThresholdSnapshot({
    rows,
    subjects: ['数学'],
    thresholds: { 数学: { exc: 88, pass: 55 } },
    townshipRows: []
});
assert.deepStrictEqual(explicit.thresholds.数学, { exc: 88, pass: 55 });
assert.strictEqual(explicit.metadata.数学.source, 'explicit');

const analyticsRoot = {
    ThresholdRuntime: runtime,
    RAW_DATA: rows,
    SCHOOLS: {},
    SUBJECTS: ['数学'],
    THRESHOLDS: {}
};
const analytics = require(path.resolve(__dirname, '../public/assets/js/analytics-kernel-runtime.js'))(analyticsRoot);
const analyticsSnapshot = analytics.buildSnapshot({ force: true });
assert.strictEqual(analyticsSnapshot.teacherStats && typeof analyticsSnapshot.teacherStats, 'object');

console.log('threshold-runtime tests passed');
