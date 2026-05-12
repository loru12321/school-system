const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const runtimePath = path.resolve(__dirname, '../public/assets/js/teacher-analysis-core-runtime.js');
const source = fs.readFileSync(runtimePath, 'utf8');

function normalizeAliasSchool(value) {
    return String(value || '').trim().replace(/别名/g, '');
}

const elementMap = new Map();
const pairingContainer = {
    _html: '',
    children: [],
    set innerHTML(value) {
        this._html = String(value || '');
        if (!this._html) this.children = [];
    },
    get innerHTML() {
        return this._html;
    },
    appendChild(child) {
        this.children.push(child);
    }
};
elementMap.set('teacher-pairing-suggestions', pairingContainer);

const storage = { MY_SCHOOL: '甲校别名' };
const context = {
    console,
    DEFAULT_MY_SCHOOL_NAME: '甲校别名',
    alert(message) {
        context.lastAlert = message;
    },
    document: {
        getElementById(id) {
            return elementMap.get(id) || null;
        },
        createElement() {
            return {
                className: '',
                innerHTML: ''
            };
        }
    },
    localStorage: {
        getItem(key) {
            return storage[key] || '';
        },
        setItem(key, value) {
            storage[key] = String(value || '');
        }
    },
    normalizeClass(value) {
        return String(value || '').trim().replace(/班$/, '');
    },
    normalizeSubject(value) {
        return String(value || '').trim();
    },
    areSchoolNamesEquivalent(left, right) {
        return normalizeAliasSchool(left) === normalizeAliasSchool(right);
    },
    listAvailableSchoolsForCompare() {
        return ['甲校别名', '乙校'];
    },
    CONFIG: { name: '9年级模拟' },
    CURRENT_EXAM_ID: '',
    CURRENT_TERM_ID: '',
    TARGETS: {},
    SUBJECTS: ['数学'],
    THRESHOLDS: { 数学: { exc: 90, pass: 60 } },
    RAW_DATA: [],
    SCHOOLS: {},
    TEACHER_MAP: {},
    TEACHER_SCHOOL_MAP: {},
    TEACHER_STATS: {}
};
context.window = context;

vm.createContext(context);
vm.runInContext(source, context, { filename: runtimePath });

context.MY_SCHOOL = '甲校别名';
context.SCHOOLS = {
    甲校: { metrics: { 数学: { avg: 80, excRate: 0.4, passRate: 0.8, count: 2 } } },
    乙校: { metrics: { 数学: { avg: 70, excRate: 0.2, passRate: 0.7, count: 2 } } }
};
context.TEACHER_STATS = {
    基础老师: { 数学: { passRate: 0.9, excellentRate: 0.2 } },
    培优老师: { 数学: { passRate: 0.7, excellentRate: 0.6 } }
};
context.generateTeacherPairing();
assert.strictEqual(pairingContainer.children.length, 1, 'pairing should use the equivalent canonical school metrics');

context.TEACHER_STATS = {
    甲校教师: {
        数学: {
            avg: 85,
            avgValue: 85,
            excellentRate: 0.5,
            passRate: 1,
            studentCount: 2
        }
    }
};
context.calculateTeacherTownshipRanking({ force: true });
let rankingRows = context.TOWNSHIP_RANKING_DATA.数学 || [];
assert.ok(
    !rankingRows.some((row) => row.type === 'school' && row.name === '甲校'),
    'current-school alias should exclude the canonical school from township competitors'
);
assert.ok(
    rankingRows.some((row) => row.type === 'school' && row.name === '乙校'),
    'other schools should remain township competitors'
);

context.MY_SCHOOL = '乙校';
storage.MY_SCHOOL = '乙校';
context.calculateTeacherTownshipRanking();
rankingRows = context.TOWNSHIP_RANKING_DATA.数学 || [];
assert.ok(
    rankingRows.some((row) => row.type === 'school' && row.name === '甲校'),
    'township ranking cache should refresh when the current school changes'
);
assert.ok(
    !rankingRows.some((row) => row.type === 'school' && row.name === '乙校'),
    'new current school should be excluded after cache refresh'
);

context.MY_SCHOOL = '甲校别名';
storage.MY_SCHOOL = '甲校别名';
context.RAW_DATA = [
    { school: '甲校', class: '9.1', name: '甲一', total: 100, scores: { 数学: 90 } },
    { school: '甲校', class: '9.1', name: '甲二', total: 80, scores: { 数学: 80 } },
    { school: '乙校', class: '9.1', name: '乙一', total: 100, scores: { 数学: 100 } }
];
context.TEACHER_MAP = {
    '9.1_数学': '甲校教师'
};
context.TEACHER_SCHOOL_MAP = {
    '9.1_数学': '甲校'
};
context.TEACHER_STATS = {};
context.analyzeTeachers({ render: false, force: true });
const aliasStats = context.TEACHER_STATS['甲校教师']?.数学;
assert.ok(aliasStats, 'teacher stats should be generated for an equivalent school alias');
assert.strictEqual(aliasStats.studentCount, 2);
assert.strictEqual(Number(aliasStats.avg), 85);
assert.strictEqual(context.lastAlert, undefined);

console.log('teacher-analysis-core-runtime tests passed');
