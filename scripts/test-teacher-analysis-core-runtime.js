const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const runtimePath = path.resolve(__dirname, '../public/assets/js/teacher-analysis-core-runtime.js');
const pairingRuntimePath = path.resolve(__dirname, '../public/assets/js/teacher-pairing-runtime.js');
const source = fs.readFileSync(runtimePath, 'utf8');
const pairingSource = fs.readFileSync(pairingRuntimePath, 'utf8');

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
    SUBJECTS: ['数学', '语文', '物理'],
    THRESHOLDS: { 数学: { exc: 90, pass: 60 }, 语文: { exc: 90, pass: 60 }, 物理: { exc: 90, pass: 60 } },
    RAW_DATA: [],
    SCHOOLS: {},
    TEACHER_MAP: {},
    TEACHER_SCHOOL_MAP: {},
    TEACHER_STATS: {}
};
context.window = context;

vm.createContext(context);
vm.runInContext(source, context, { filename: runtimePath });
vm.runInContext(pairingSource, context, { filename: pairingRuntimePath });

context.MY_SCHOOL = '甲校别名';
context.SCHOOLS = {
    甲校: {
        metrics: {
            数学: { avg: 80, excRate: 0.4, passRate: 0.8, count: 2 },
            语文: { avg: 82, excRate: 0.35, passRate: 0.75, count: 2 },
            物理: { avg: 76, excRate: 0.3, passRate: 0.7, count: 2 }
        }
    },
    乙校: { metrics: { 数学: { avg: 70, excRate: 0.2, passRate: 0.7, count: 2 } } }
};
context.TEACHER_STATS = {
    基础老师: { 数学: { passRate: 0.9, excellentRate: 0.2 }, 语文: { passRate: 0.88, excellentRate: 0.3 }, 物理: { passRate: 0.74, excellentRate: 0.28, avg: 76 } },
    培优老师: { 数学: { passRate: 0.7, excellentRate: 0.6 }, 语文: { passRate: 0.74, excellentRate: 0.52 } }
};
context.generateTeacherPairing();
assert.strictEqual(pairingContainer.children.length, 3, 'pairing should generate at least one suggestion for each configured subject');
assert.ok(
    pairingContainer.children.some((child) => String(child.innerHTML || '').includes('语文')),
    'pairing should include non-math subject suggestions when complementary teachers exist'
);
assert.ok(
    pairingContainer.children.some((child) => String(child.innerHTML || '').includes('物理')),
    'pairing should include a subject-level advice card when a configured subject lacks enough pairable teachers'
);

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

const classTeacherUser = {
    role: 'class_teacher',
    roles: ['class_teacher', 'teacher'],
    teacher_name: '甲校教师',
    homeroom_class: '9.1'
};
context.Auth = { currentUser: classTeacherUser };
context.PermissionPolicy = {
    sameSchoolName(left, right) {
        return normalizeAliasSchool(left) === normalizeAliasSchool(right);
    },
    hasQueryRole(user, roleName) {
        return Array.isArray(user?.roles) ? user.roles.includes(roleName) : user?.role === roleName;
    },
    isClassTeacher(user) {
        return this.hasQueryRole(user, 'class_teacher');
    },
    getAccessibleSchoolNames() {
        return ['甲校别名', '乙校'];
    },
    filterStudentRows(user, rows, options = {}) {
        if (options.mode !== 'homeroom') return rows;
        return (rows || []).filter((row) => String(row?.class || '').trim() === user?.homeroom_class);
    }
};
context.RAW_DATA = [
    { school: '甲校', class: '9.1', name: '甲一', total: 100, scores: { 数学: 100 } },
    { school: '甲校', class: '9.1', name: '甲二', total: 90, scores: { 数学: 90 } },
    { school: '甲校', class: '9.2', name: '甲三', total: 60, scores: { 数学: 60 } },
    { school: '甲校', class: '9.2', name: '甲四', total: 50, scores: { 数学: 50 } },
    { school: '乙校', class: '9.3', name: '乙一', total: 80, scores: { 数学: 80 } }
];
context.TEACHER_MAP = {
    '9.1_数学': '甲校教师',
    '9.2_数学': '甲校教师'
};
context.TEACHER_SCHOOL_MAP = {
    '9.1_数学': '甲校',
    '9.2_数学': '甲校'
};
context.SCHOOLS = {
    甲校: { metrics: { 数学: { avg: 75, excRate: 0.5, passRate: 0.75, count: 4 } } },
    乙校: { metrics: { 数学: { avg: 80, excRate: 0, passRate: 1, count: 1 } } }
};
context.TEACHER_STATS = {};
context.analyzeTeachers({ render: false, force: true, township: false });
const homeroomStats = context.TEACHER_STATS['甲校教师']?.数学;
assert.ok(homeroomStats, 'class teacher scoped teacher stats should still render for the homeroom analysis context');
assert.strictEqual(homeroomStats.studentCount, 2);
assert.strictEqual(Number(homeroomStats.avg), 95);
context.calculateTeacherTownshipRanking({ force: true, teacherMetricScope: 'admin' });
const townshipStats = context.TEACHER_TOWNSHIP_RANKINGS?.['甲校教师']?.数学;
assert.ok(townshipStats, 'teacher township ranking should include class teacher subject rows');
assert.strictEqual(Number(townshipStats.avg), 75, 'teacher township ranking should use the admin/full-school teacher metric average');
assert.strictEqual(context.TEACHER_STATS['甲校教师'].数学.studentCount, 2, 'admin-scope township calculation should not overwrite role-scoped teacher stats');
assert.strictEqual(Number(context.TEACHER_STATS['甲校教师'].数学.avg), 95, 'admin-scope township calculation should restore class teacher analysis values');

console.log('teacher-analysis-core-runtime tests passed');
