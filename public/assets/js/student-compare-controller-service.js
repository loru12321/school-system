(function() {
    function getStudentCompareElements() {
        return {
            hintEl: document.getElementById('studentCompareHint'),
            summaryEl: document.getElementById('studentCompareSummary'),
            resultEl: document.getElementById('studentCompareResult'),
            countEl: document.getElementById('studentComparePeriodCount'),
            schoolEl: document.getElementById('studentCompareSchool'),
            exam1El: document.getElementById('studentCompareExam1'),
            exam2El: document.getElementById('studentCompareExam2'),
            exam3El: document.getElementById('studentCompareExam3'),
            exam3WrapEl: document.getElementById('studentCompareExam3Wrap')
        };
    }

    function hasCoreElements(elements) {
        const els = elements || {};
        const required = [els.hintEl, els.resultEl, els.countEl, els.schoolEl, els.exam1El, els.exam2El, els.exam3El];
        return required.every(Boolean);
    }

    function readStudentCompareState(options) {
        const opts = options || {};
        const elements = opts.elements || getStudentCompareElements();
        if (!hasCoreElements(elements)) {
            return { ok: false, elements: elements };
        }

        const periodCount = parseInt((elements.countEl && elements.countEl.value) || '2', 10) === 3 ? 3 : 2;
        const examIds = periodCount === 3
            ? [elements.exam1El.value, elements.exam2El.value, elements.exam3El.value]
            : [elements.exam1El.value, elements.exam2El.value];

        return {
            ok: true,
            elements: elements,
            periodCount: periodCount,
            school: String(elements.schoolEl && elements.schoolEl.value || '').trim(),
            examIds: examIds
        };
    }

    function syncStudentComparePeriodWrap(options) {
        const opts = options || {};
        const elements = opts.elements || getStudentCompareElements();
        const compareUi = window.CompareUiService;
        if (compareUi && typeof compareUi.toggleConditionalWrap === 'function') {
            compareUi.toggleConditionalWrap(elements.countEl, elements.exam3WrapEl, { displayValue: '3', displayStyle: 'inline-flex' });
            return;
        }
        if (!elements.countEl || !elements.exam3WrapEl) return;
        elements.exam3WrapEl.style.display = String(elements.countEl.value || '') === '3' ? 'inline-flex' : 'none';
    }

    function setStudentCompareFeedback(options) {
        const opts = options || {};
        const elements = opts.elements || getStudentCompareElements();
        const compareUi = window.CompareUiService;
        if (compareUi && typeof compareUi.setCompareFeedback === 'function') {
            compareUi.setCompareFeedback({
                hintEl: elements.hintEl,
                resultEl: elements.resultEl,
                message: opts.message || '',
                color: opts.color || '#64748b',
                clearResult: !!opts.clearResult
            });
        } else {
            if (elements.hintEl) {
                elements.hintEl.innerHTML = opts.message || '';
                elements.hintEl.style.color = opts.color || '#64748b';
            }
            if (elements.resultEl && opts.clearResult) {
                elements.resultEl.innerHTML = '';
            }
        }

        if (elements.summaryEl && opts.clearSummary) {
            elements.summaryEl.innerHTML = '';
        }
    }

    function validateStudentCompareState(state) {
        if (!state || !state.ok) {
            return { ok: false, message: '\u5b66\u751f\u591a\u671f\u5bf9\u6bd4\u9875\u9762\u63a7\u4ef6\u672a\u5c31\u7eea\u3002' };
        }
        if (!state.school) {
            return { ok: false, message: '\u8bf7\u5148\u9009\u62e9\u5b66\u6821\u3002' };
        }
        if ((state.examIds || []).some(function(id) { return !id; })) {
            return { ok: false, message: '\u8bf7\u4e3a\u5b66\u751f\u591a\u671f\u5bf9\u6bd4\u9009\u9f50\u6240\u6709\u671f\u6b21\u3002' };
        }
        if (new Set(state.examIds).size !== state.examIds.length) {
            return { ok: false, message: '\u5b66\u751f\u591a\u671f\u5bf9\u6bd4\u4e0d\u80fd\u91cd\u590d\u9009\u62e9\u540c\u4e00\u573a\u8003\u8bd5\u3002' };
        }
        return { ok: true };
    }

    function buildStudentCompareCache(options) {
        const opts = options || {};
        return {
            school: String(opts.school || '').trim(),
            examIds: Array.isArray(opts.examIds) ? opts.examIds.slice() : [],
            periodCount: parseInt(opts.periodCount, 10) === 3 ? 3 : 2,
            studentsCompareData: Array.isArray(opts.studentsCompareData) ? opts.studentsCompareData : [],
            subjects: Array.isArray(opts.subjects) ? opts.subjects : [],
            currentPage: 1,
            pageSize: typeof opts.pageSize === 'number' ? opts.pageSize : 20
        };
    }

    function applyStudentCompareResult(options) {
        const opts = options || {};
        const state = opts.state || {};
        const elements = state.elements || opts.elements || getStudentCompareElements();
        const cache = buildStudentCompareCache({
            school: state.school,
            examIds: state.examIds,
            periodCount: state.periodCount,
            studentsCompareData: opts.studentsCompareData,
            subjects: opts.subjects,
            pageSize: opts.pageSize
        });

        setStudentCompareFeedback({
            elements: elements,
            message: opts.message || '',
            color: opts.color || '#16a34a',
            clearResult: false,
            clearSummary: false
        });

        return cache;
    }

    function hydrateStudentCompareCache(payload, options) {
        const opts = options || {};
        const data = payload || {};
        return buildStudentCompareCache({
            school: data.school,
            examIds: data.examIds,
            periodCount: data.periodCount,
            studentsCompareData: Array.isArray(opts.studentsCompareData) ? opts.studentsCompareData : data.studentsCompareData,
            subjects: data.subjects,
            pageSize: opts.pageSize
        });
    }

    function applyStudentCloudDetail(options) {
        const opts = options || {};
        const elements = opts.elements || getStudentCompareElements();
        const detailView = opts.detailView || {};
        setStudentCompareFeedback({
            elements: elements,
            message: detailView.hintHtml || '',
            color: detailView.hintColor || '#16a34a',
            clearResult: false,
            clearSummary: false
        });
    }


    function getStudentCompareFilterElements() {
        return {
            hintEl: document.getElementById('studentCompareHint'),
            nameInputEl: document.getElementById('studentCompareNameInput'),
            sortEl: document.getElementById('studentCompareSortBy'),
            groupEl: document.getElementById('studentCompareGroupBy')
        };
    }

    function ensureStudentCompareOriginalData(cache) {
        const dataCache = cache || {};
        if (!Array.isArray(dataCache.originalStudentsCompareData)) {
            dataCache.originalStudentsCompareData = Array.isArray(dataCache.studentsCompareData)
                ? dataCache.studentsCompareData.slice()
                : [];
        }
        return dataCache.originalStudentsCompareData;
    }

    function normalizeStudentSearchNames(text) {
        const rawText = String(text || '').trim();
        const cleanName = function(name) {
            return String(name || '').replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
        };
        return rawText
            .split(/[\s,\uFF0C\u3001;\uFF1B]+/)
            .map(cleanName)
            .filter(Boolean);
    }

    function filterStudentCompareByNames(cache, searchText) {
        const source = ensureStudentCompareOriginalData(cache || {});
        const names = normalizeStudentSearchNames(searchText);
        const matchedStudents = source.filter(function(student) {
            const studentName = String(student && student.name || '').replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
            return names.some(function(name) { return studentName.indexOf(name) !== -1; });
        });
        return {
            searchNames: names,
            matchedStudents: matchedStudents,
            displayNames: names.length > 3 ? names.slice(0, 3).join(', ') + '...' : names.join(', ')
        };
    }

    function restoreStudentCompareOriginalData(cache) {
        const dataCache = cache || {};
        const originalData = ensureStudentCompareOriginalData(dataCache);
        dataCache.studentsCompareData = originalData.slice();
        dataCache.isFiltered = false;
        return dataCache.studentsCompareData;
    }

    function filterStudentCompareByProgressType(cache, type) {
        const dataCache = cache || {};
        const originalData = ensureStudentCompareOriginalData(dataCache);
        const filteredStudents = originalData.filter(function(student) {
            return String(student && student.progressType || '') === String(type || '');
        });
        dataCache.studentsCompareData = filteredStudents;
        dataCache.isFiltered = true;
        const typeLabelMap = {
            improve: '\u8fdb\u6b65',
            decline: '\u9000\u6b65',
            stable: '\u7a33\u5b9a'
        };
        return {
            filteredStudents: filteredStudents,
            typeLabel: typeLabelMap[type] || '\u7b5b\u9009'
        };
    }

    function sortStudentCompareRows(rows, sortBy) {
        const list = Array.isArray(rows) ? rows.slice() : [];
        switch (String(sortBy || 'class')) {
            case 'totalDesc':
                list.sort(function(a, b) { return Number(b.latestTotal || 0) - Number(a.latestTotal || 0); });
                break;
            case 'totalAsc':
                list.sort(function(a, b) { return Number(a.latestTotal || 0) - Number(b.latestTotal || 0); });
                break;
            case 'improveDesc':
                list.sort(function(a, b) { return Number(b.scoreDiff || 0) - Number(a.scoreDiff || 0); });
                break;
            case 'improveAsc':
                list.sort(function(a, b) { return Number(a.scoreDiff || 0) - Number(b.scoreDiff || 0); });
                break;
            case 'rankImprove':
                list.sort(function(a, b) { return Number(b.rankSchoolDiff || 0) - Number(a.rankSchoolDiff || 0); });
                break;
            case 'class':
            default:
                list.sort(function(a, b) {
                    const classCompare = String(a && a.class || '').localeCompare(String(b && b.class || ''), 'zh-CN');
                    if (classCompare !== 0) return classCompare;
                    return String(a && a.name || '').localeCompare(String(b && b.name || ''), 'zh-CN');
                });
                break;
        }
        return list;
    }

    window.StudentCompareControllerService = {
        getStudentCompareElements: getStudentCompareElements,
        readStudentCompareState: readStudentCompareState,
        syncStudentComparePeriodWrap: syncStudentComparePeriodWrap,
        setStudentCompareFeedback: setStudentCompareFeedback,
        validateStudentCompareState: validateStudentCompareState,
        buildStudentCompareCache: buildStudentCompareCache,
        applyStudentCompareResult: applyStudentCompareResult,
        hydrateStudentCompareCache: hydrateStudentCompareCache,
        applyStudentCloudDetail: applyStudentCloudDetail,
        getStudentCompareFilterElements: getStudentCompareFilterElements,
        ensureStudentCompareOriginalData: ensureStudentCompareOriginalData,
        normalizeStudentSearchNames: normalizeStudentSearchNames,
        filterStudentCompareByNames: filterStudentCompareByNames,
        restoreStudentCompareOriginalData: restoreStudentCompareOriginalData,
        filterStudentCompareByProgressType: filterStudentCompareByProgressType,
        sortStudentCompareRows: sortStudentCompareRows
    };
})();

