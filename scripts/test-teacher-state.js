const assert = require('assert');
const path = require('path');

const createTeacherStateRuntime = require(path.resolve(__dirname, '../public/assets/js/teacher-state-runtime.js'));

function run() {
    const root = {
        TEACHER_MAP: { '9.1_语文': '张老师' },
        TEACHER_SCHOOL_MAP: { '9.1_语文': '学校A' },
        TEACHER_STATS: {
            张老师: {
                语文: { avg: 86.5, passRate: 0.92 }
            }
        }
    };

    const teacherState = createTeacherStateRuntime(root);

    assert.deepStrictEqual(teacherState.getTeacherMap(), { '9.1_语文': '张老师' });
    assert.deepStrictEqual(teacherState.getTeacherSchoolMap(), { '9.1_语文': '学校A' });
    assert.deepStrictEqual(teacherState.getTeacherStats(), {
        张老师: {
            语文: { avg: 86.5, passRate: 0.92 }
        }
    });

    const snapshot = teacherState.syncTeacherState({
        teacherMap: { '9.2_数学': '李老师' },
        teacherSchoolMap: { '9.2_数学': '学校B' },
        teacherStats: {
            李老师: {
                数学: { avg: 88, passRate: 0.95 }
            }
        }
    });

    assert.deepStrictEqual(snapshot.teacherMap, { '9.2_数学': '李老师' });
    assert.deepStrictEqual(snapshot.teacherSchoolMap, { '9.2_数学': '学校B' });
    assert.deepStrictEqual(snapshot.teacherStats, {
        李老师: {
            数学: { avg: 88, passRate: 0.95 }
        }
    });

    teacherState.clearTeacherState();
    assert.deepStrictEqual(teacherState.getTeacherMap(), {});
    assert.deepStrictEqual(teacherState.getTeacherSchoolMap(), {});
    assert.deepStrictEqual(teacherState.getTeacherStats(), {});

    console.log('teacher-state-runtime tests passed');
}

run();
