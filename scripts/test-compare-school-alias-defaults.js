const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class SelectElement {
    constructor(id) {
        this.id = id;
        this.dataset = {};
        this.style = {};
        this.options = [];
        this._value = '';
        this._html = '';
    }

    set innerHTML(value) {
        this._html = String(value || '');
        this.options = Array.from(this._html.matchAll(/<option[^>]*value=["']?([^"'>]*)["']?[^>]*>(.*?)<\/option>/g))
            .map((match) => ({
                value: match[1],
                textContent: match[2].replace(/<[^>]+>/g, ''),
                disabled: false
            }));
        const optionValues = new Set(this.options.map((option) => option.value));
        this._value = optionValues.has(this._value) ? this._value : (this.options[0]?.value || '');
    }

    get innerHTML() {
        return this._html;
    }

    set value(nextValue) {
        const value = String(nextValue || '');
        const optionValues = new Set(this.options.map((option) => option.value));
        this._value = optionValues.size === 0 || optionValues.has(value) ? value : '';
    }

    get value() {
        return this._value;
    }

    querySelector(selector) {
        const match = String(selector || '').match(/^option\[value=["']?([^"'\]]+)["']?\]$/);
        if (!match) return null;
        return this.options.find((option) => option.value === match[1]) || null;
    }
}

function createSelectMap(ids) {
    const map = new Map();
    ids.forEach((id) => map.set(id, new SelectElement(id)));
    return map;
}

function createBaseContext(selectIds = []) {
    const elements = createSelectMap(selectIds);
    const context = {
        console,
        Promise,
        setTimeout,
        clearTimeout,
        CURRENT_COHORT_ID: '2022',
        CURRENT_EXAM_ID: 'exam-3',
        MY_SCHOOL: '甲校别名',
        SUBJECTS: ['数学'],
        SCHOOLS: {
            甲校: { students: [{ school: '甲校', class: '9.1', scores: { 数学: 90 } }] },
            乙校: { students: [{ school: '乙校', class: '9.2', scores: { 数学: 80 } }] }
        },
        TEACHER_MAP: { '9.1_数学': '甲校教师' },
        TEACHER_SCHOOL_MAP: { '9.1_数学': '甲校' },
        localStorage: {
            getItem(key) {
                return key === 'MY_SCHOOL' ? '甲校别名' : '';
            },
            setItem() {},
            removeItem() {}
        },
        document: {
            getElementById(id) {
                return elements.get(id) || null;
            }
        },
        listAvailableSchoolsForCompare() {
            return ['甲校', '乙校'];
        },
        listAvailableExamsForCompare() {
            return [
                { id: 'exam-1', label: '第一次', createdAt: 1 },
                { id: 'exam-2', label: '第二次', createdAt: 2 },
                { id: 'exam-3', label: '第三次', createdAt: 3 }
            ];
        },
        isExamKeyEquivalentForCompare(left, right) {
            return String(left || '') === String(right || '');
        },
        getEffectiveCurrentExamId() {
            return 'exam-3';
        },
        sortSubjects(left, right) {
            return String(left || '').localeCompare(String(right || ''), 'zh-CN');
        },
        normalizeClass(value) {
            return String(value || '').trim();
        },
        normalizeSubject(value) {
            return String(value || '').trim();
        },
        getClassSchoolMapForAllData() {
            return { '9.1': '甲校', '9.2': '乙校' };
        },
        areSchoolNamesEquivalent(left, right) {
            const normalize = (value) => String(value || '').trim().replace(/别名/g, '');
            return normalize(left) === normalize(right);
        }
    };
    context.window = context;
    context.globalThis = context;
    return { context, elements };
}

function runCompareSelectorsAliasDefaultTest() {
    const selectorIds = [
        'progressCompareSchool', 'progressCompareExam1', 'progressCompareExam2', 'progressCompareExam3',
        'studentCompareSchool', 'studentCompareExam1', 'studentCompareExam2', 'studentCompareExam3',
        'macroCompareSchool', 'macroCompareExam1', 'macroCompareExam2', 'macroCompareExam3',
        'teacherCompareSchool', 'teacherCompareSubject', 'teacherCompareTeacher',
        'teacherCompareExam1', 'teacherCompareExam2', 'teacherCompareExam3',
        'progressComparePeriodCount', 'progressCompareExam3Wrap',
        'studentComparePeriodCount', 'studentCompareExam3Wrap',
        'macroComparePeriodCount', 'macroCompareExam3Wrap',
        'teacherComparePeriodCount', 'teacherCompareExam3Wrap'
    ];
    const { context, elements } = createBaseContext(selectorIds);
    ['progressComparePeriodCount', 'studentComparePeriodCount', 'macroComparePeriodCount', 'teacherComparePeriodCount']
        .forEach((id) => {
            elements.get(id).innerHTML = '<option value="2">2期</option><option value="3">3期</option>';
            elements.get(id).value = '3';
        });

    const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/compare-selectors-runtime.js'), 'utf8');
    vm.runInNewContext(source, context, { filename: 'compare-selectors-runtime.js' });

    context.updateProgressMultiExamSelects();
    context.updateStudentCompareExamSelects();
    context.updateMacroMultiExamSelects();
    context.updateTeacherCompareExamSelects();

    assert.strictEqual(elements.get('progressCompareSchool').value, '甲校');
    assert.strictEqual(elements.get('studentCompareSchool').value, '甲校');
    assert.strictEqual(elements.get('macroCompareSchool').value, '甲校');
    assert.strictEqual(elements.get('teacherCompareSchool').value, '甲校');
    assert.strictEqual(elements.get('teacherCompareTeacher').value, '甲校教师');
    assert.strictEqual(context.resolveCompareSchoolOption(['甲校', '乙校'], '甲校别名'), '甲校');
}

function runProgressAliasDefaultTest() {
    const { context } = createBaseContext();
    context.__PROGRESS_ANALYSIS_RUNTIME_PATCHED__ = false;
    context.requestAnimationFrame = (callback) => {
        if (typeof callback === 'function') callback();
        return 0;
    };
    context.CohortDB = {
        ensure() {
            return { exams: {} };
        }
    };
    context.PermissionPolicy = {
        getAccessibleSchoolNames(_user, schools) {
            return schools;
        },
        getBoundSchool() {
            return '';
        },
        sameSchoolName(left, right) {
            return context.areSchoolNamesEquivalent(left, right);
        }
    };
    context.getCurrentUser = () => ({ role: 'admin' });
    const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/progress-analysis-runtime.js'), 'utf8');
    vm.runInNewContext(source, context, { filename: 'progress-analysis-runtime.js' });

    assert.strictEqual(context.progressResolveSchoolOption(['甲校', '乙校'], '甲校别名'), '甲校');
}

function runTownSubmoduleAliasDefaultTest() {
    const { context } = createBaseContext();
    context.__TOWN_SUBMODULE_COMPARE_RUNTIME_PATCHED__ = false;
    context.document.createElement = () => ({
        style: {},
        setAttribute() {},
        querySelector() { return null; },
        innerHTML: ''
    });
    const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/town-submodule-compare-runtime.js'), 'utf8');
    vm.runInNewContext(source, context, { filename: 'town-submodule-compare-runtime.js' });

    assert.strictEqual(context.resolveTownSubmoduleDefaultSchool(['甲校', '乙校'], '甲校别名'), '甲校');
    assert.strictEqual(context.resolveTownSubmoduleDefaultSchool(['甲校', '乙校'], ''), '甲校');
}

runCompareSelectorsAliasDefaultTest();
runProgressAliasDefaultTest();
runTownSubmoduleAliasDefaultTest();

console.log('compare school alias defaults tests passed');
