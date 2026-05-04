const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const runtimePath = path.resolve(__dirname, '../public/assets/js/teacher-visibility-runtime.js');
const source = fs.readFileSync(runtimePath, 'utf8');

const context = {
    console,
    appDebug() {},
    localStorage: {
        getItem(key) {
            return key === 'MY_SCHOOL' ? '甲校别名' : '';
        }
    },
    normalizeClass(value) {
        return String(value || '').trim().replace(/班$/, '');
    },
    normalizeSubject(value) {
        const text = String(value || '').trim();
        return text === '道法' ? '政治' : text;
    },
    areSchoolNamesEquivalent(left, right) {
        const normalize = (value) => String(value || '').trim().replace(/别名/g, '');
        return normalize(left) === normalize(right);
    },
    readCurrentSchool() {
        return '甲校别名';
    },
    getCurrentUser() {
        return context.currentUser;
    },
    PermissionPolicy: {
        sameSchoolName(left, right) {
            return context.areSchoolNamesEquivalent(left, right);
        },
        filterTeacherStats(_user, stats) {
            return stats || {};
        },
        canQueryTeacherMetric(_user, _teacherName, _statItem, schoolName) {
            return context.areSchoolNamesEquivalent(schoolName, '甲校');
        }
    },
    currentUser: { role: 'class_teacher', name: '王老师', school: '甲校别名', class: '9.1' },
    MY_SCHOOL: '甲校别名',
    TEACHER_MAP: {
        '9.1_数学': '王老师',
        '9.1_英语': '李老师',
        '9.2_语文': '王老师'
    },
    TEACHER_SCHOOL_MAP: {
        '9.1_数学': '甲校',
        '9.1_英语': '乙校',
        '9.2_语文': '乙校'
    },
    SCHOOLS: {
        甲校: {
            name: '甲校',
            students: [
                { school: '甲校', class: '9.1', name: '甲一', scores: { 数学: 100 } },
                { school: '甲校', class: '9.1', name: '甲二', scores: { 数学: 80 } }
            ]
        },
        乙校: {
            students: [
                { school: '乙校', class: '9.1', name: '乙一', scores: { 英语: 100 } }
            ]
        }
    },
    RAW_DATA: [
        { school: '甲校', class: '9.1', name: '甲一', scores: { 数学: 100 } },
        { school: '乙校', class: '9.1', name: '乙一', scores: { 英语: 100, 物理: 90 } }
    ],
    SUBJECTS: ['数学', '英语', '语文', '物理'],
    THRESHOLDS: { 数学: { exc: 90, pass: 60 } },
    TEACHER_STATS: {}
};
context.window = context;

vm.createContext(context);
vm.runInContext(source, context, { filename: runtimePath });

const scope = context.getTeacherScopeForUser(context.currentUser);
assert.deepStrictEqual(Array.from(scope.classes), ['9.1']);
assert.deepStrictEqual(Array.from(scope.subjects), ['数学']);

const visibleSubjects = Array.from(context.getVisibleSubjectsForTeacherUser(context.currentUser)).sort();
assert.deepStrictEqual(visibleSubjects, ['数学']);

const classStats = context.buildClassTeacherStatsForClass('9.1');
assert.deepStrictEqual(Object.keys(classStats), ['王老师']);
assert.strictEqual(classStats['王老师'].数学.studentCount, 2);
assert.strictEqual(classStats['王老师'].数学.totalScore, 180);
assert.strictEqual(classStats['王老师'].数学.avg, '90.00');
assert.strictEqual(classStats['李老师'], undefined);

console.log('teacher-visibility-runtime tests passed');
