const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function run() {
    const runtimePath = path.resolve(__dirname, '../public/assets/js/report-compare-runtime.js');
    const runtimeCode = fs.readFileSync(runtimePath, 'utf8');

    const cloudCompareContext = {
        prevExamId: 'exam-1',
        previousRecord: {
            name: 'Alice',
            class: '901',
            total: 512
        },
        previousSubjectScores: {
            Math: [96, 92, 88]
        }
    };

    const context = {
        console,
        Promise,
        setTimeout,
        clearTimeout,
        PREV_DATA: [],
        window: {
            CompareSessionState: {
                getCloudStudentCompareContext: () => cloudCompareContext
            }
        },
        document: {
            activeElement: null
        },
        isCloudContextMatchStudent: (student) => String(student?.name || '').trim() === 'Alice',
        isCloudContextLikelyCurrentTarget: () => false,
        doQuery: () => {},
        getComparisonTotalSubjects: () => [],
        getComparisonStudentView: (student) => student,
        getComparisonStudentList: () => [],
        formatComparisonExamLabel: () => '',
        getLatestHistoryExamEntry: () => null,
        getComparisonTotalValue: () => 0,
        createComparisonStudentView: (student) => student,
        recalcPrevTotal: () => 0,
        findPreviousRecord: () => null,
        getStudentExamHistory: () => [],
        viewCloudStudentCompares: () => null,
        loadCloudStudentCompare: () => null,
        setCloudCompareTarget: () => null,
        resolveCloudCompareTarget: () => null,
        getCurrentUser: () => null,
        moveFocusOutOfParentView: () => {},
        CohortDB: {
            ensure: () => ({ exams: {} })
        }
    };

    context.globalThis = context.window;
    context.window.document = context.document;

    vm.runInNewContext(runtimeCode, context, { filename: runtimePath });

    assert.strictEqual(typeof context.window.getCloudCompareHint, 'function');
    assert.strictEqual(typeof context.window.getCloudPreviousRecord, 'function');
    assert.strictEqual(typeof context.window.getCloudPreviousSubjectScores, 'function');

    const student = { name: 'Alice', class: '901' };
    const nonMatchStudent = { name: 'Bob', class: '902' };

    assert.deepStrictEqual(context.window.getCloudCompareHint(student), cloudCompareContext);
    assert.strictEqual(context.window.getCloudCompareHint(nonMatchStudent), null);
    assert.deepStrictEqual(context.window.getCloudPreviousRecord(student), cloudCompareContext.previousRecord);
    assert.strictEqual(context.window.getCloudPreviousRecord(nonMatchStudent), null);
    assert.deepStrictEqual(context.window.getCloudPreviousSubjectScores('Math', student), [96, 92, 88]);
    assert.strictEqual(context.window.getCloudPreviousSubjectScores('Math', nonMatchStudent), null);

    console.log('report-compare context helper tests passed');
}

run();
