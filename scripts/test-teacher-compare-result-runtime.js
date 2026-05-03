const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const runtimePath = path.resolve(__dirname, '../public/assets/js/teacher-compare-result-runtime.js');
const source = fs.readFileSync(runtimePath, 'utf8');

const context = {
    console,
    document: {
        getElementById() {
            return null;
        }
    },
    setTimeout() {
        return 0;
    },
    clearTimeout() {},
    normalizeClass(value) {
        return String(value || '').trim().replace(/班$/, '');
    },
    normalizeSubject(value) {
        return String(value || '').trim();
    },
    PermissionPolicy: {
        sameSchoolName(left, right) {
            const normalize = (value) => String(value || '').trim().replace('别名', '');
            return normalize(left) === normalize(right);
        }
    },
    CONFIG: { name: '9年级模拟' },
    SUBJECTS: ['数学', '英语'],
    TEACHER_MAP: {
        '9.1_数学': '乙校教师',
        '9.2_数学': '甲校教师',
        '9.3_数学': '未显式学校教师'
    },
    TEACHER_SCHOOL_MAP: {
        '9.1_数学': '乙校',
        '9.2_数学': '甲校'
    }
};
context.window = context;

vm.createContext(context);
vm.runInContext(source, context, { filename: runtimePath });

const rows = [
    { school: '甲校', class: '9.1', name: '甲一', scores: { 数学: 100 } },
    { school: '甲校', class: '9.1', name: '甲二', scores: { 数学: 80 } },
    { school: '甲校', class: '9.2', name: '甲三', scores: { 数学: 70 } },
    { school: '甲校', class: '9.3', name: '甲四', scores: { 数学: 75 } },
    { school: '乙校', class: '9.1', name: '乙一', scores: { 数学: 95 } }
];

const schoolAStats = context.buildTeacherStatsForExam(rows, '甲校', '数学');
assert.deepStrictEqual(
    Array.from(schoolAStats, (item) => item.teacher).sort(),
    ['未显式学校教师', '甲校教师'],
    'foreign explicit teacher assignment should not bind same-named local class'
);
assert.strictEqual(schoolAStats.find((item) => item.teacher === '乙校教师'), undefined);
assert.strictEqual(schoolAStats.find((item) => item.teacher === '甲校教师').studentCount, 1);
assert.strictEqual(schoolAStats.find((item) => item.teacher === '未显式学校教师').studentCount, 1);

const schoolBStats = context.buildTeacherStatsForExam(rows, '乙校', '数学');
assert.deepStrictEqual(Array.from(schoolBStats, (item) => item.teacher), ['乙校教师']);
assert.strictEqual(schoolBStats[0].studentCount, 1);

const rankStats = [{ teacher: '甲校教师', subject: '数学', avg: 80, excellentRate: 0, passRate: 0 }];
context.attachTeacherTownshipAvgRank([
    { school: '甲校', scores: { 数学: 80 } },
    { school: '甲校别名', scores: { 数学: 100 } },
    { school: '丙校', scores: { 数学: 50 } }
], '甲校', rankStats);
assert.strictEqual(rankStats[0].townshipRankAvg, 1, 'same-school aliases should not become township competitors');

console.log('teacher-compare-result-runtime tests passed');
