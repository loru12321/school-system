const assert = require('assert');
const path = require('path');

const createCompareResultStateRuntime = require(path.resolve(__dirname, '../public/assets/js/compare-result-state-runtime.js'));

function run() {
    const root = {
        MACRO_MULTI_PERIOD_COMPARE_CACHE: { school: '实验学校', examIds: ['A', 'B'], periodCount: 2 },
        TEACHER_MULTI_PERIOD_COMPARE_CACHE: { school: '实验学校', teacher: '张老师', subject: '数学' },
        STUDENT_MULTI_PERIOD_COMPARE_CACHE: { school: '实验学校', studentsCompareData: [{ name: 'Alice' }], currentPage: 1 }
    };

    const runtime = createCompareResultStateRuntime(root);

    assert.deepStrictEqual(runtime.getMacroCompareCache(), { school: '实验学校', examIds: ['A', 'B'], periodCount: 2 });
    assert.deepStrictEqual(runtime.getTeacherCompareCache(), { school: '实验学校', teacher: '张老师', subject: '数学' });
    assert.deepStrictEqual(runtime.getStudentCompareCache(), { school: '实验学校', studentsCompareData: [{ name: 'Alice' }], currentPage: 1 });

    const teacherCache = runtime.getTeacherCompareCache();
    teacherCache.periodCount = 3;
    assert.strictEqual(runtime.getTeacherCompareCache().periodCount, 3);

    const snapshot = runtime.syncCompareResultState({
        macroCompareCache: { school: '示范学校', html: '<div>macro</div>' },
        teacherCompareCache: { school: '示范学校', teacher: '李老师', isBatchMode: true },
        studentCompareCache: { school: '示范学校', studentsCompareData: [{ name: 'Bob' }], pageSize: 20 }
    });

    assert.deepStrictEqual(snapshot.macroCompareCache, { school: '示范学校', html: '<div>macro</div>' });
    assert.deepStrictEqual(snapshot.teacherCompareCache, { school: '示范学校', teacher: '李老师', isBatchMode: true });
    assert.deepStrictEqual(snapshot.studentCompareCache, { school: '示范学校', studentsCompareData: [{ name: 'Bob' }], pageSize: 20 });

    runtime.clearCompareResultState();
    assert.strictEqual(runtime.getMacroCompareCache(), null);
    assert.strictEqual(runtime.getTeacherCompareCache(), null);
    assert.strictEqual(runtime.getStudentCompareCache(), null);

    console.log('compare-result-state-runtime tests passed');
}

run();
