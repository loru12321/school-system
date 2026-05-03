const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function createContext() {
    const rows = [
        { school: '甲校', class: '9.1', name: '甲一', total: 90, scores: { 数学: 90 } },
        { school: '甲校', class: '9.1', name: '甲二', total: 80, scores: { 数学: 80 } },
        { school: '乙校', class: '9.2', name: '乙一', total: 100, scores: { 数学: 100 } }
    ];
    const context = {
        console,
        Promise,
        setTimeout,
        clearTimeout,
        requestIdleCallback(callback) {
            callback();
            return 0;
        },
        MY_SCHOOL: '甲校别名',
        CURRENT_EXAM_ID: 'exam-1',
        SUBJECTS: ['数学'],
        RAW_DATA: rows,
        SCHOOLS: {
            甲校: {
                name: '甲校',
                score2Rate: 120,
                metrics: {
                    total: { count: 2, avg: 85, excRate: 0.5, passRate: 1 },
                    数学: { count: 2, avg: 85, excRate: 0.5, passRate: 1 }
                }
            },
            乙校: {
                name: '乙校',
                score2Rate: 150,
                metrics: {
                    total: { count: 1, avg: 100, excRate: 1, passRate: 1 },
                    数学: { count: 1, avg: 100, excRate: 1, passRate: 1 }
                }
            }
        },
        TARGETS: {
            甲校别名: { ind1: 1, ind2: 1 }
        },
        TEACHER_MAP: {
            '9.1_数学': '甲校教师',
            '9.2_数学': '乙校教师'
        },
        TEACHER_SCHOOL_MAP: {
            '9.1_数学': '甲校',
            '9.2_数学': '乙校'
        },
        localStorage: {
            getItem(key) {
                return key === 'MY_SCHOOL' ? '甲校别名' : '';
            },
            setItem() {},
            removeItem() {}
        },
        document: {
            readyState: 'loading',
            addEventListener() {},
            getElementById() {
                return null;
            },
            querySelector() {
                return null;
            },
            querySelectorAll() {
                return [];
            },
            createElement() {
                return { style: {}, setAttribute() {}, appendChild() {} };
            },
            head: { appendChild() {} },
            body: { appendChild() {} }
        },
        readCurrentSchool() {
            return '甲校别名';
        },
        writeCurrentSchool(value) {
            context.MY_SCHOOL = value;
        },
        normalizeSubject(value) {
            return String(value || '').trim();
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
        getTownshipManagedSchoolNames(names = []) {
            return names.filter((name) => context.areSchoolNamesEquivalent(name, '甲校别名'));
        }
    };
    context.window = context;
    context.globalThis = context;
    return context;
}

function runCountyRuntimeAliasTest() {
    const context = createContext();
    const countySource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/county-analysis-runtime.js'), 'utf8');
    const horizontalSource = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/county-school-horizontal-runtime.js'), 'utf8');
    vm.runInNewContext(countySource, context, { filename: 'county-analysis-runtime.js' });
    vm.runInNewContext(horizontalSource, context, { filename: 'county-school-horizontal-runtime.js' });

    const runtime = context.CountyAnalysisRuntime;
    assert.ok(runtime, 'county runtime should export helpers');
    assert.strictEqual(runtime.resolveSchoolOption(['甲校', '乙校'], '甲校别名'), '甲校');
    assert.strictEqual(runtime.resolveCurrentCountySchoolName(), '甲校');
    assert.strictEqual(runtime.sameSchoolName('甲校别名', '甲校'), true);

    const scoped = runtime.getScopedTeacherAssignmentsForCounty();
    assert.strictEqual(scoped.matched, true);
    assert.deepStrictEqual(Object.keys(scoped.map), ['9.1_数学']);
    assert.strictEqual(scoped.map['9.1_数学'], '甲校教师');

    const teacherStats = runtime.buildCountyTeacherStats();
    assert.strictEqual(teacherStats?.甲校教师?.数学?.studentCount, 2);
    assert.strictEqual(teacherStats?.甲校教师?.数学?.avg, 85);
    assert.strictEqual(teacherStats?.乙校教师, undefined);

    const html = context.CountySchoolHorizontalRenderer.renderTotalTable({
        buildCountyHorizontalTotalRows: () => [
            { schoolName: '甲校', count: 2, avg: 85, excellentRate: 0.5, passRate: 1, ratedAvg: 50, ratedExc: 80, ratedPass: 50, score: 180, rankScore: 1 },
            { schoolName: '乙校', count: 1, avg: 100, excellentRate: 1, passRate: 1, ratedAvg: 60, ratedExc: 80, ratedPass: 50, score: 190, rankScore: 2 }
        ],
        toNumber: Number,
        escapeHtml(value) {
            return String(value ?? '');
        },
        formatCountyRankDisplay(value) {
            return String(value);
        },
        formatNumber(value) {
            return String(value);
        },
        sameSchoolName: runtime.sameSchoolName
    }, '甲校别名');
    const highlightedRows = String(html).match(/<tr class="bg-highlight">[\s\S]*?<\/tr>/g) || [];
    assert.strictEqual(highlightedRows.length, 1);
    assert.ok(highlightedRows[0].includes('甲校'));
    assert.ok(!highlightedRows[0].includes('乙校'));
}

runCountyRuntimeAliasTest();
console.log('county analysis school alias runtime tests passed');
