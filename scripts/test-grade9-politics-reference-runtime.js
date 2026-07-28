const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '../public/assets/js/grade9-politics-reference-runtime.js'), 'utf8');
const currentExamId = '2022级-9年级-2025-2026-中考-2026-07-28';
const secondMockId = '2022级-9年级-2025-2026-下学期-二模-2026-05-27';
const currentRows = [
    { id: 'a1', name: '甲一', school: '甲校', class: '9.1', total: 500, scores: { 语文: 100 } },
    { id: 'a2', name: '甲二', school: '甲校', class: '9.1', total: 480, scores: { 语文: 90 } },
    { id: 'b1', name: '乙一', school: '乙校', class: '9.1', total: 510, scores: { 语文: 105 } },
    { id: 'b2', name: '乙二', school: '乙校', class: '9.1', total: 490, scores: { 语文: 95 } }
];
const context = {
    window: {
        CURRENT_EXAM_ID: currentExamId,
        CURRENT_COHORT_ID: '2022',
        __RAW_DATA_VERSION: 7,
        CONFIG: { name: '9年级' },
        RAW_DATA: currentRows,
        SCHOOLS: { 甲校: { name: '甲校' }, 乙校: { name: '乙校' } },
        COHORT_DB: {
            exams: {
                [currentExamId]: {
                    meta: { cohortId: '2022', grade: '9', year: '2025-2026', type: '中考', date: '2026-07-28' },
                    data: currentRows
                },
                [secondMockId]: {
                    meta: { cohortId: '2022', grade: '9', year: '2025-2026', type: '二模', date: '2026-05-27' },
                    thresholds: { 政治: { exc: 80, pass: 60 } },
                    data: [
                        { id: 'a1', name: '甲一', school: '甲校', class: '9.1', scores: { 政治: 82 } },
                        { id: 'a2', name: '甲二', school: '甲校', class: '9.1', scores: { 政治: 60 } },
                        { id: 'b1', name: '乙一', school: '乙校', class: '9.1', scores: { 政治: 90 } },
                        { id: 'b2', name: '乙二', school: '乙校', class: '9.1', scores: { 政治: 70 } }
                    ]
                }
            }
        },
        getTownshipManagedSchoolNames: (names) => names,
        areSchoolNamesEquivalent: (left, right) => String(left).trim() === String(right).trim(),
        localStorage: { getItem: () => '' }
    },
    console
};
context.window.window = context.window;
vm.createContext(context);
vm.runInContext(source, context, { filename: 'grade9-politics-reference-runtime.js' });

(async () => {
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
    assert.strictEqual(currentRows.every(row => row.scores.政治 === undefined), true, 'politics reference must not write back to the formal zhongkao rows');
    assert.strictEqual(context.window.Grade9PoliticsReferenceRuntime.getSummary(), summary, 'cached summary should be available for the table renderer');
    console.log('grade9 politics reference runtime tests passed');
})().catch(error => {
    console.error(error);
    process.exit(1);
});
