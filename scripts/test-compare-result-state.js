const assert = require('assert');
const path = require('path');

const createCompareResultStateRuntime = require(path.resolve(__dirname, '../public/assets/js/compare-result-state-runtime.js'));

function run() {
    const root = {
        MACRO_MULTI_PERIOD_COMPARE_CACHE: { school: 'Demo School', examIds: ['A', 'B'], periodCount: 2 },
        TEACHER_MULTI_PERIOD_COMPARE_CACHE: { school: 'Demo School', teacher: 'Teacher A', subject: 'Math' },
        STUDENT_MULTI_PERIOD_COMPARE_CACHE: { school: 'Demo School', studentsCompareData: [{ name: 'Alice' }], currentPage: 1 }
    };

    const runtime = createCompareResultStateRuntime(root);

    assert.deepStrictEqual(runtime.getMacroCompareCache(), { school: 'Demo School', examIds: ['A', 'B'], periodCount: 2 });
    assert.deepStrictEqual(runtime.getTeacherCompareCache(), { school: 'Demo School', teacher: 'Teacher A', subject: 'Math' });
    assert.deepStrictEqual(runtime.getStudentCompareCache(), { school: 'Demo School', studentsCompareData: [{ name: 'Alice' }], currentPage: 1 });
    assert.strictEqual(root.readMacroCompareCacheState, runtime.getMacroCompareCache);
    assert.strictEqual(root.setTeacherCompareCacheState, runtime.setTeacherCompareCache);
    assert.strictEqual(root.syncCompareResultRuntimeState, runtime.syncCompareResultState);
    assert.strictEqual(root.clearCompareResultRuntimeState, runtime.clearCompareResultState);

    const teacherCache = runtime.getTeacherCompareCache();
    teacherCache.periodCount = 3;
    assert.strictEqual(runtime.getTeacherCompareCache().periodCount, 3);

    const snapshot = runtime.syncCompareResultState({
        macroCompareCache: { school: 'Model School', html: '<div>macro</div>' },
        teacherCompareCache: { school: 'Model School', teacher: 'Teacher B', isBatchMode: true },
        studentCompareCache: { school: 'Model School', studentsCompareData: [{ name: 'Bob' }], pageSize: 20 }
    });

    assert.deepStrictEqual(snapshot.macroCompareCache, { school: 'Model School', html: '<div>macro</div>' });
    assert.deepStrictEqual(snapshot.teacherCompareCache, { school: 'Model School', teacher: 'Teacher B', isBatchMode: true });
    assert.deepStrictEqual(snapshot.studentCompareCache, { school: 'Model School', studentsCompareData: [{ name: 'Bob' }], pageSize: 20 });

    runtime.clearCompareResultState();
    assert.strictEqual(runtime.getMacroCompareCache(), null);
    assert.strictEqual(runtime.getTeacherCompareCache(), null);
    assert.strictEqual(runtime.getStudentCompareCache(), null);

    const isolatedRoot = {};
    const isolatedRuntime = createCompareResultStateRuntime(isolatedRoot);
    assert.strictEqual(isolatedRoot.readMacroCompareCacheState, isolatedRuntime.getMacroCompareCache);
    assert.strictEqual(isolatedRoot.setStudentCompareCacheState, isolatedRuntime.setStudentCompareCache);
    assert.strictEqual(isolatedRoot.clearCompareResultRuntimeState, isolatedRuntime.clearCompareResultState);

    console.log('compare-result-state-runtime tests passed');
}

run();
