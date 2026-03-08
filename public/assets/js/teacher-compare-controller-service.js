(function() {
    function getTeacherCompareElements() {
        return {
            hintEl: document.getElementById('teacherCompareHint'),
            resultEl: document.getElementById('teacherCompareResult'),
            countEl: document.getElementById('teacherComparePeriodCount'),
            schoolEl: document.getElementById('teacherCompareSchool'),
            subjectEl: document.getElementById('teacherCompareSubject'),
            teacherEl: document.getElementById('teacherCompareTeacher'),
            exam1El: document.getElementById('teacherCompareExam1'),
            exam2El: document.getElementById('teacherCompareExam2'),
            exam3El: document.getElementById('teacherCompareExam3'),
            exam3WrapEl: document.getElementById('teacherCompareExam3Wrap')
        };
    }

    function hasCoreElements(elements, requireTeacher) {
        const els = elements || {};
        const required = [els.hintEl, els.resultEl, els.countEl, els.schoolEl, els.exam1El, els.exam2El, els.exam3El];
        if (requireTeacher !== false) {
            required.push(els.subjectEl, els.teacherEl);
        }
        return required.every(Boolean);
    }

    function readTeacherCompareState(options) {
        const opts = options || {};
        const elements = opts.elements || getTeacherCompareElements();
        if (!hasCoreElements(elements, opts.requireTeacher !== false)) {
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
            subject: String(elements.subjectEl && elements.subjectEl.value || '').trim(),
            teacher: String(elements.teacherEl && elements.teacherEl.value || '').trim(),
            examIds: examIds
        };
    }

    function syncTeacherComparePeriodWrap(options) {
        const opts = options || {};
        const elements = opts.elements || getTeacherCompareElements();
        const compareUi = window.CompareUiService;
        if (compareUi && typeof compareUi.toggleConditionalWrap === 'function') {
            compareUi.toggleConditionalWrap(elements.countEl, elements.exam3WrapEl, { displayValue: '3', displayStyle: 'inline-flex' });
            return;
        }
        if (!elements.countEl || !elements.exam3WrapEl) return;
        elements.exam3WrapEl.style.display = String(elements.countEl.value || '') === '3' ? 'inline-flex' : 'none';
    }

    function setTeacherCompareFeedback(options) {
        const opts = options || {};
        const elements = opts.elements || getTeacherCompareElements();
        const compareUi = window.CompareUiService;
        if (compareUi && typeof compareUi.setCompareFeedback === 'function') {
            compareUi.setCompareFeedback({
                hintEl: elements.hintEl,
                resultEl: elements.resultEl,
                message: opts.message || '',
                color: opts.color || '#64748b',
                clearResult: !!opts.clearResult
            });
            return;
        }
        if (elements.hintEl) {
            elements.hintEl.innerHTML = opts.message || '';
            elements.hintEl.style.color = opts.color || '#64748b';
        }
        if (elements.resultEl && opts.clearResult) {
            elements.resultEl.innerHTML = '';
        }
    }

    function validateTeacherCompareState(state, options) {
        const opts = options || {};
        const requireTeacher = opts.requireTeacher !== false;
        if (!state || !state.ok) {
            return { ok: false, message: '教师对比页面控件未就绪。' };
        }
        if (!state.school) {
            return { ok: false, message: requireTeacher ? '请先选择学校、学科和教师。' : '请先选择学校。' };
        }
        if (requireTeacher && (!state.subject || !state.teacher)) {
            return { ok: false, message: '请先选择学校、学科和教师。' };
        }
        if ((state.examIds || []).some(function(id) { return !id; })) {
            return { ok: false, message: requireTeacher ? '请为教师多期对比选齐所有期次。' : '请为全教师多期对比选齐所有期次。' };
        }
        if (new Set(state.examIds).size !== state.examIds.length) {
            return { ok: false, message: requireTeacher ? '教师多期对比不能重复选择同一场考试。' : '全教师多期对比不能重复选择同一场考试。' };
        }
        return { ok: true };
    }

    function applyTeacherSingleResult(options) {
        const opts = options || {};
        const state = opts.state || {};
        const elements = state.elements || opts.elements || getTeacherCompareElements();
        if (elements.resultEl) {
            elements.resultEl.innerHTML = opts.viewState && opts.viewState.resultHtml ? opts.viewState.resultHtml : '';
        }
        setTeacherCompareFeedback({
            elements: elements,
            message: opts.viewState && opts.viewState.hintHtml ? opts.viewState.hintHtml : '',
            color: opts.viewState && opts.viewState.hintColor ? opts.viewState.hintColor : '#16a34a',
            clearResult: false
        });
        window.TEACHER_MULTI_PERIOD_COMPARE_CACHE = {
            school: state.school,
            subject: state.subject,
            teacher: state.teacher,
            examIds: state.examIds,
            periodCount: state.periodCount,
            examStats: opts.examStats || [],
            delta: opts.delta || null,
            metricRows: opts.metricRows || ''
        };
    }

    function applyTeacherBatchResult(options) {
        const opts = options || {};
        const state = opts.state || {};
        const elements = state.elements || opts.elements || getTeacherCompareElements();
        if (elements.resultEl) {
            elements.resultEl.innerHTML = opts.viewState && opts.viewState.resultHtml ? opts.viewState.resultHtml : '';
        }
        setTeacherCompareFeedback({
            elements: elements,
            message: opts.viewState && opts.viewState.hintHtml ? opts.viewState.hintHtml : '',
            color: opts.viewState && opts.viewState.hintColor ? opts.viewState.hintColor : '#16a34a',
            clearResult: false
        });

        window.ALL_TEACHERS_DIFF_CACHE = {
            results: opts.results || [],
            school: state.school,
            examIds: state.examIds,
            periodCount: state.periodCount
        };
        window.TEACHER_MULTI_PERIOD_COMPARE_CACHE = {
            school: state.school,
            subject: '全学科',
            teacher: '全教师',
            examIds: state.examIds,
            periodCount: state.periodCount,
            delta: null,
            metricRows: opts.viewState && opts.viewState.trsHtml ? opts.viewState.trsHtml : '',
            isBatchMode: true,
            batchResults: opts.results || [],
            thsHtml: opts.viewState && opts.viewState.thsHtml ? opts.viewState.thsHtml : ''
        };
    }

    function applyTeacherCloudDetail(options) {
        const opts = options || {};
        const detailView = opts.detailView || {};
        const elements = opts.elements || getTeacherCompareElements();
        if (elements.resultEl) {
            elements.resultEl.innerHTML = detailView.resultHtml || '';
        }
        if (detailView.restoredAllTeachersCache) {
            window.ALL_TEACHERS_DIFF_CACHE = detailView.restoredAllTeachersCache;
        }
        if (detailView.restoredTeacherCompareCache) {
            window.TEACHER_MULTI_PERIOD_COMPARE_CACHE = detailView.restoredTeacherCompareCache;
        }
        setTeacherCompareFeedback({
            elements: elements,
            message: detailView.hintHtml || '',
            color: detailView.hintColor || '#7c3aed',
            clearResult: false
        });
    }

    window.TeacherCompareControllerService = {
        getTeacherCompareElements: getTeacherCompareElements,
        readTeacherCompareState: readTeacherCompareState,
        syncTeacherComparePeriodWrap: syncTeacherComparePeriodWrap,
        setTeacherCompareFeedback: setTeacherCompareFeedback,
        validateTeacherCompareState: validateTeacherCompareState,
        applyTeacherSingleResult: applyTeacherSingleResult,
        applyTeacherBatchResult: applyTeacherBatchResult,
        applyTeacherCloudDetail: applyTeacherCloudDetail
    };
})();
