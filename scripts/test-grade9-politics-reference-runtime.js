const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '../public/assets/js/grade9-politics-reference-runtime.js'), 'utf8');
const currentExamId = '2022级-9年级-2025-2026-中考-2026-07-28';
const secondMockId = '2022级-9年级-2025-2026-下学期-二模-2026-05-27';

function makeCurrentRows() {
    return [
        { id: 'a1', name: '甲一', school: '甲校', class: '9.1', total: 500, scores: { 语文: 100 } },
        { id: 'a2', name: '甲二', school: '甲校', class: '9.1', total: 480, scores: { 语文: 90 } },
        { id: 'b1', name: '乙一', school: '乙校', class: '9.1', total: 510, scores: { 语文: 105 } },
        { id: 'b2', name: '乙二', school: '乙校', class: '9.1', total: 490, scores: { 语文: 95 } }
    ];
}

function makeSecondMock() {
    return {
        meta: { cohortId: '2022', grade: '9', year: '2025-2026', type: '二模', date: '2026-05-27' },
        thresholds: { 政治: { exc: 80, pass: 60 } },
        data: [
            { id: 'a1', name: '甲一', school: '甲校', class: '9.1', scores: { 政治: 82 } },
            { id: 'a2', name: '甲二', school: '甲校', class: '9.1', scores: { 政治: 60 } },
            { id: 'b1', name: '乙一', school: '乙校', class: '9.1', scores: { 政治: 90 } },
            { id: 'b2', name: '乙二', school: '乙校', class: '9.1', scores: { 政治: 70 } }
        ]
    };
}

const currentRows = makeCurrentRows();
const secondMock = makeSecondMock();
const cloudSaves = [];
const context = {
    window: {
        CURRENT_EXAM_ID: currentExamId,
        CURRENT_COHORT_ID: '2022',
        __RAW_DATA_VERSION: 7,
        CONFIG: { name: '9年级' },
        RAW_DATA: currentRows,
        SUBJECTS: ['语文', '数学', '英语', '物理', '化学'],
        SCHOOLS: { 甲校: { name: '甲校' }, 乙校: { name: '乙校' } },
        COHORT_DB: {
            exams: {
                [currentExamId]: {
                    meta: { cohortId: '2022', grade: '9', year: '2025-2026', type: '中考', date: '2026-07-28' },
                    data: currentRows
                },
                [secondMockId]: secondMock
            }
        },
        getTownshipManagedSchoolNames: (names) => names,
        areSchoolNamesEquivalent: (left, right) => String(left).trim() === String(right).trim(),
        localStorage: { getItem: () => '' },
        saveCloudData: async (options) => {
            cloudSaves.push({ ...options });
            return true;
        }
    },
    console
};
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'grade9-politics-reference-runtime.js' });

(async () => {
    const totalsBeforeCopy = currentRows.map(row => row.total);
    const summary = await context.window.Grade9PoliticsReferenceRuntime.ensureSummary();
    assert.ok(summary.available, 'same-cohort grade 9 second-mock politics should be available on the zhongkao page');
    assert.strictEqual(summary.sourceExamId, secondMockId);
    assert.deepStrictEqual({ ...summary.thresholds }, { exc: 80, pass: 60, source: '二模归档分数线' });
    assert.strictEqual(summary.matched, 4);
    assert.strictEqual(summary.unmatched, 0);
    assert.strictEqual(summary.schools.length, 2);
    const schoolA = summary.schools.find(item => item.name === '甲校');
    const schoolB = summary.schools.find(item => item.name === '乙校');
    assert.strictEqual(Number(schoolA.metrics.avg.toFixed(2)), 71);
    assert.strictEqual(Number(schoolA.metrics.excRate.toFixed(2)), 0.5);
    assert.strictEqual(Number(schoolA.metrics.passRate.toFixed(2)), 1);
    assert.strictEqual(Number(schoolB.metrics.avg.toFixed(2)), 80);
    assert.strictEqual(schoolB.rankings.avg, 1);
    assert.ok(schoolB.score2Rate > schoolA.score2Rate, 'politics reference scoring should rank only the politics metric set');

    assert.deepStrictEqual(currentRows.map(row => row.scores.政治), [82, 60, 90, 70], 'second-mock politics should be copied into the current zhongkao archive rows');
    assert.deepStrictEqual(currentRows.map(row => row.total), totalsBeforeCopy, 'copying politics must not change five-subject totals');
    assert.deepStrictEqual(context.window.SUBJECTS, ['语文', '数学', '英语', '物理', '化学'], 'display-only politics must not enter formal subjects');
    assert.strictEqual(context.window.COHORT_DB.exams[currentExamId].meta.politicsReference.sourceExamId, secondMockId, 'current zhongkao archive should retain the second-mock source');
    assert.strictEqual(context.window.COHORT_DB.exams[currentExamId].meta.politicsReference.thresholds.exc, 80, 'current zhongkao archive should retain the reference threshold');
    assert.strictEqual(await context.window.Grade9PoliticsReferenceRuntime.flushPendingPersistence(), 'queued', 'copy should be queued to the exam cloud shard');
    assert.deepStrictEqual(cloudSaves, [{
        mode: 'exam',
        examKey: currentExamId,
        background: true,
        forceUpload: true,
        sourceLabel: 'grade9-politics-reference-copy'
    }]);

    // 已归档的分数与二模分数线应直接复用中考分片，不再重复请求二模历史。
    context.window.__RAW_DATA_VERSION = 8;
    const stored = await context.window.Grade9PoliticsReferenceRuntime.ensureSummary();
    assert.ok(stored.available, 'stored politics reference should render from the zhongkao archive');
    assert.strictEqual(stored.sourceMode, 'archived-copy');
    assert.strictEqual(cloudSaves.length, 1, 'unchanged archived copy must not enqueue another cloud save');

    // 冷缓存先只取最近两条考试（中考 + 二模）；不要为了政治参考阻塞式拉完整届历史。
    const coldRows = makeCurrentRows();
    context.window.RAW_DATA = coldRows;
    context.window.COHORT_DB.exams[currentExamId] = {
        meta: { cohortId: '2022', grade: '9', year: '2025-2026', type: '中考', date: '2026-07-28' },
        data: coldRows
    };
    delete context.window.COHORT_DB.exams[secondMockId];
    const cloudCalls = [];
    context.window.CloudManager = {
        fetchCohortExamsToLocal: async (_cohortId, options) => {
            cloudCalls.push({ ...options });
            context.window.COHORT_DB.exams[secondMockId] = secondMock;
            return { success: true, updated: 1 };
        }
    };
    context.window.__RAW_DATA_VERSION = 9;
    const hydrated = await context.window.Grade9PoliticsReferenceRuntime.ensureSummary();
    assert.ok(hydrated.available, 'the fast history hydration should make politics reference available');
    assert.deepStrictEqual(cloudCalls[0], {
        background: false,
        latestOnly: false,
        minCount: 2,
        maxFetch: 2,
        refreshSelectors: false
    }, 'cold politics reference should fetch only the two newest snapshots first');

    // 失败只能留下“failed”状态，不能把未进入云端队列的结果误报为已保存。
    const failingRows = makeCurrentRows();
    context.window.RAW_DATA = failingRows;
    context.window.COHORT_DB.exams[currentExamId] = {
        meta: { cohortId: '2022', grade: '9', year: '2025-2026', type: '中考', date: '2026-07-28' },
        data: failingRows
    };
    context.window.saveCloudData = async () => false;
    context.window.__RAW_DATA_VERSION = 10;
    await context.window.Grade9PoliticsReferenceRuntime.ensureSummary();
    assert.strictEqual(await context.window.Grade9PoliticsReferenceRuntime.flushPendingPersistence(), 'failed');
    assert.strictEqual(context.window.Grade9PoliticsReferenceRuntime.getPersistenceState().status, 'failed');
    assert.deepStrictEqual(failingRows.map(row => row.scores.政治), [82, 60, 90, 70], 'failed cloud saves must not roll politics into totals or formal subjects');
    console.log('grade9 politics reference runtime tests passed');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
