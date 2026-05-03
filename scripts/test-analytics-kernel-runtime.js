const assert = require('assert');
const path = require('path');

const createAnalyticsKernelRuntime = require(path.resolve(__dirname, '../public/assets/js/analytics-kernel-runtime.js'));

function normalizeAliasSchool(value) {
    return String(value || '').trim().replace(/别名/g, '');
}

const root = {
    MY_SCHOOL: '甲校别名',
    RAW_DATA: [
        { school: '甲校', class: '9.1', name: '甲一', scores: { 数学: 90 } },
        { school: '甲校别名', class: '9.1', name: '甲二', scores: { 数学: 80 } },
        { school: '乙校', class: '9.2', name: '乙一', scores: { 数学: 100 } }
    ],
    SCHOOLS: {},
    SUBJECTS: ['数学'],
    THRESHOLDS: { 数学: { exc: 85, pass: 60 } },
    TEACHER_MAP: {
        '9.1_数学': '甲校教师',
        '9.2_数学': '乙校教师'
    },
    TEACHER_SCHOOL_MAP: {
        '9.1_数学': '甲校',
        '9.2_数学': '乙校'
    },
    areSchoolNamesEquivalent(left, right) {
        return normalizeAliasSchool(left) === normalizeAliasSchool(right);
    }
};

const analyticsKernel = createAnalyticsKernelRuntime(root);
const snapshot = analyticsKernel.buildSnapshot({ force: true });
const teacherStats = snapshot.teacherStats || {};

assert.deepStrictEqual(Object.keys(teacherStats), ['甲校教师']);
assert.strictEqual(snapshot.teacherSchoolName, '甲校别名');
assert.strictEqual(teacherStats['甲校教师'].数学.studentCount, 2);
assert.strictEqual(teacherStats['甲校教师'].数学.avg, 85);
assert.strictEqual(teacherStats['乙校教师'], undefined);

console.log('analytics-kernel-runtime tests passed');
