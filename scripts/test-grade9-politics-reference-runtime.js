const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '../public/assets/js/grade9-politics-reference-runtime.js'), 'utf8');
const currentExamId = '2022级-9年级-2025-2026-中考-2026-07-28';
const secondMockId = '2022级-9年级-2025-2026-下学期-二模-2026-05-27';

function makeLatestRows() {
    return [
        { id: 'a1', name: '甲一', school: '甲校', class: '9.1', total: 500, scores: { 语文: 100, 政治: 82 } },
        { id: 'a2', name: '甲二', school: '甲校', class: '9.1', total: 480, scores: { 语文: 90, 政治: 60 } },
        { id: 'b1', name: '乙一', school: '乙校', class: '9.1', total: 510, scores: { 语文: 105, 政治: 90 } },
        { id: 'b2', name: '乙二', school: '乙校', class: '9.1', total: 490, scores: { 语文: 95, 政治: 70 } }
    ];
}

function makeSecondMock() {
    return {
        meta: { cohortId: '2022', grade: '9', year: '2025-2026', type: '二模', date: '2026-05-27' },
        data: [
            { id: 'a1', name: '甲一', school: '甲校', class: '9.1', scores: { 政治: 82 } },
            { id: 'a2', name: '甲二', school: '甲校', class: '9.1', scores: { 政治: 66 } },
            { id: 'a3', name: '甲三', school: '甲校', class: '9.1', scores: { 政治: 88 } },
            { id: 'b1', name: '乙一', school: '乙校', class: '9.1', scores: { 政治: 90 } },
            { id: 'b2', name: '乙二', school: '乙校', class: '9.1', scores: { 政治: 70 } }
        ]
    };
}

const latestRows = makeLatestRows();
const secondMock = makeSecondMock();
const context = {
    window: {
        CURRENT_EXAM_ID: currentExamId,
        CURRENT_COHORT_ID: '2022',
        __RAW_DATA_VERSION: 7,
        CONFIG: { name: '9年级' },
        RAW_DATA: latestRows,
        SUBJECTS: ['语文', '数学', '英语', '物理', '化学'],
        SCHOOLS: { 甲校: { name: '甲校' }, 乙校: { name: '乙校' } },
        COHORT_DB: {
            exams: {
                [currentExamId]: {
                    meta: { cohortId: '2022', grade: '9', year: '2025-2026', type: '中考', date: '2026-07-28' },
                    thresholds: { 政治: { exc: 80, pass: 60 } },
                    data: latestRows
                },
                [secondMockId]: secondMock
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
    const totalsBefore = latestRows.map((row) => row.total);
    const summary = await context.window.Grade9PoliticsReferenceRuntime.ensureSummary();

    assert.ok(summary.available, 'latest zhongkao politics rows should be available');
    assert.strictEqual(summary.sourceExamId, currentExamId);
    assert.strictEqual(summary.sourceMode, 'latest-zhongkao-politics');
    assert.deepStrictEqual({ ...summary.thresholds }, { exc: 80, pass: 60, source: '最新中考整理表归档分数线' });
    assert.strictEqual(summary.matched, 4);
    assert.strictEqual(summary.unmatched, 0);
    assert.strictEqual(summary.schools.length, 2);
    assert.strictEqual(summary.referenceSchools.length, 2, 'external-school aggregates must come from the latest upload too');
    assert.strictEqual(Number(summary.schools.find((item) => item.name === '甲校').metrics.avg.toFixed(2)), 71);
    assert.strictEqual(Number(summary.schools.find((item) => item.name === '乙校').metrics.avg.toFixed(2)), 80);
    assert.deepStrictEqual(latestRows.map((row) => row.scores.政治), [82, 60, 90, 70], 'latest uploaded politics scores must never be overwritten from the second mock');
    assert.deepStrictEqual(latestRows.map((row) => row.total), totalsBefore, 'politics display must not change formal five-subject totals');
    assert.deepStrictEqual(context.window.SUBJECTS, ['语文', '数学', '英语', '物理', '化学'], 'politics must stay out of formal subjects');

    assert.strictEqual(summary.audit.status, 'ready');
    assert.strictEqual(summary.audit.schoolCount, 2, 'audit must cover every configured township school');
    assert.deepStrictEqual({
        compared: summary.audit.compared,
        same: summary.audit.same,
        different: summary.audit.different,
        missingInMock: summary.audit.missingInMock,
        mockOnly: summary.audit.mockOnly
    }, { compared: 4, same: 3, different: 1, missingInMock: 0, mockOnly: 1 });
    assert.deepStrictEqual({ ...summary.audit.schools.find((item) => item.name === '甲校') }, {
        name: '甲校', latest: 2, same: 1, different: 1, missingInMock: 0, mockOnly: 1
    });

    // 中考表删除政治分的学生即不参加统计；二模仍有该学生只能记入审计的 mockOnly，不能补回。
    delete latestRows[1].scores.政治;
    const revised = await context.window.Grade9PoliticsReferenceRuntime.ensureSummary();
    assert.strictEqual(revised.matched, 3);
    assert.strictEqual(revised.schools.find((item) => item.name === '甲校').metrics.count, 1);
    assert.strictEqual(revised.audit.mockOnly, 2);
    assert.strictEqual(revised.audit.different, 0);
    assert.strictEqual(await context.window.Grade9PoliticsReferenceRuntime.flushPendingPersistence(), 'idle');
    assert.strictEqual(context.window.Grade9PoliticsReferenceRuntime.getPersistenceState(), null);
    console.log('grade9 politics reference runtime tests passed');
})().catch((error) => {
    console.error(error);
    process.exit(1);
});
