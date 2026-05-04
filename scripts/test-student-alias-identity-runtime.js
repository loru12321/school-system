const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createContext() {
    const context = {
        console,
        setTimeout,
        clearTimeout,
        Promise,
        STUDENT_MULTI_PERIOD_COMPARE_CACHE: null,
        CLOUD_COMPARE_TARGET: null,
        CLOUD_STUDENT_COMPARE_CONTEXT: null,
        CLOUD_COMPARE_PREV_DATA_BACKUP: null,
        CURRENT_REPORT_STUDENT: null,
        RAW_DATA: [
            { school: '甲校', class: '9.1', name: '张三', scores: { 数学: 90 } },
            { school: '乙校', class: '9.1', name: '张三', scores: { 数学: 60 } },
            { school: '甲校', class: '9.2', name: '李四', scores: { 数学: 88 } }
        ],
        SCHOOLS: {
            甲校: {
                name: '甲校',
                students: [
                    { school: '甲校', class: '9.1', name: '张三', scores: { 数学: 90 } },
                    { school: '甲校', class: '9.2', name: '李四', scores: { 数学: 88 } }
                ]
            },
            乙校: {
                name: '乙校',
                students: [
                    { school: '乙校', class: '9.1', name: '张三', scores: { 数学: 60 } }
                ]
            }
        },
        localStorage: {
            getItem() { return ''; },
            setItem() {},
            removeItem() {}
        },
        document: {
            activeElement: null,
            body: { appendChild() {} },
            createElement() {
                return {
                    style: {},
                    appendChild() {},
                    setAttribute() {},
                    focus() {},
                    blur() {}
                };
            },
            getElementById() { return null; },
            querySelector() { return null; }
        },
        normalizeClass(value) {
            return String(value || '').trim();
        },
        normalizeSchoolName(value) {
            return String(value || '').trim().replace(/别名/g, '');
        },
        areSchoolNamesEquivalent(left, right) {
            return context.normalizeSchoolName(left) === context.normalizeSchoolName(right);
        },
        PermissionPolicy: {
            sameSchoolName(left, right) {
                return context.areSchoolNamesEquivalent(left, right);
            }
        },
        CompareSessionState: {
            getCloudCompareTarget() { return null; },
            setCloudCompareTarget(target) { context.CLOUD_COMPARE_TARGET = target; return target; },
            getCloudStudentCompareContext() { return null; },
            setCloudStudentCompareContext(value) { context.CLOUD_STUDENT_COMPARE_CONTEXT = value; return value; },
            getCloudComparePrevDataBackup() { return null; },
            setCloudComparePrevDataBackup(value) { context.CLOUD_COMPARE_PREV_DATA_BACKUP = value; return value; }
        },
        ReportSessionState: {
            getCurrentReportStudent() { return context.CURRENT_REPORT_STUDENT; },
            setCurrentReportStudent(student) { context.CURRENT_REPORT_STUDENT = student; return student; }
        }
    };
    context.window = context;
    context.globalThis = context;
    return context;
}

function runStudentAliasIdentityTest() {
    const context = createContext();
    const studentCompareCloudSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/student-compare-cloud-runtime.js'), 'utf8');
    const studentJumpSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/student-jump-runtime.js'), 'utf8');
    vm.createContext(context);
    vm.runInContext(studentCompareCloudSource, context, { filename: 'student-compare-cloud-runtime.js' });
    vm.runInContext(studentJumpSource, context, { filename: 'student-jump-runtime.js' });

    assert.strictEqual(context.sameCloudCompareSchoolName('甲校别名', '甲校'), true);
    assert.strictEqual(context.sameJumpSchoolName('甲校别名', '甲校'), true);

    const bound = context.getCurrentBoundStudentFromUser({
        role: 'student',
        name: '张三',
        class: '9.1',
        school: '甲校别名'
    });
    assert.ok(bound, 'bound student should be found through a school alias');
    assert.strictEqual(bound.school, '甲校');
    assert.strictEqual(bound.scores.数学, 90);

    const picked = context.pickSelfStudentFromCloudRows([
        { school: '乙校', class: '9.1', name: '张三', latestTotal: 60 },
        { school: '甲校', class: '9.1', name: '张三', latestTotal: 90 }
    ], {
        name: context.normalizeCompareName('张三'),
        class: '9.1',
        school: '甲校别名'
    });
    assert.strictEqual(picked.student.school, '甲校');
    assert.strictEqual(picked.strategy, 'name+class');

    const jumpStudent = context.findStudentForJump('张三', '甲校别名', '9.1');
    assert.ok(jumpStudent, 'jump target should be found through a school alias');
    assert.strictEqual(jumpStudent.school, '甲校');
    assert.strictEqual(jumpStudent.scores.数学, 90);
}

runStudentAliasIdentityTest();
console.log('student alias identity runtime tests passed');
