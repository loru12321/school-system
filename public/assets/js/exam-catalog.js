(function() {
    const DERIVED_KEY_PREFIXES = /^(TEACHERS_|STUDENT_COMPARE_|MACRO_COMPARE_|TEACHER_COMPARE_|TOWN_SUB_COMPARE_)/;
    const TEMPLATE_KEY_PATTERN = /(?:^|_)(?:\u671f\u4e2d\u6807\u51c6|\u671f\u672b\u6807\u51c6)(?:_|$)/;

    function normalizeCohortId(raw) {
        return String(raw || '').replace(/\D/g, '');
    }

    function extractCohortIdFromExamKey(examKey) {
        const key = String(examKey || '').trim();
        const match = key.match(/^(\d{4})\D*_/);
        return match ? match[1] : '';
    }

    function isSelectableExamKey(examKey, cohortId) {
        const key = String(examKey || '').trim();
        if (!key) return false;
        if (DERIVED_KEY_PREFIXES.test(key)) return false;
        if (TEMPLATE_KEY_PATTERN.test(key)) return false;

        const normalizedCohortId = normalizeCohortId(cohortId);
        if (!normalizedCohortId) return true;
        return extractCohortIdFromExamKey(key) === normalizedCohortId;
    }

    function sortExamList(examList) {
        return [...examList].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    }

    function collectAvailableExams(options) {
        const opts = options || {};
        const examMap = new Map();
        const db = opts.db || null;
        const cohortId = normalizeCohortId(
            opts.cohortId ||
            window.CURRENT_COHORT_ID ||
            localStorage.getItem('CURRENT_COHORT_ID')
        );
        const currentExamId = String(opts.currentExamId || window.CURRENT_EXAM_ID || '').trim();
        const currentExamLabel = String(opts.currentExamLabel || '').trim();
        const prevData = Array.isArray(opts.prevData) ? opts.prevData : (window.PREV_DATA || []);

        if (db?.exams) {
            Object.values(db.exams).forEach(exam => {
                if (!exam?.examId || !isSelectableExamKey(exam.examId, cohortId)) return;
                examMap.set(exam.examId, {
                    id: exam.examId,
                    createdAt: exam.createdAt || 0,
                    label: exam.examLabel || exam.examId,
                    source: 'local'
                });
            });
        }

        if (currentExamId && isSelectableExamKey(currentExamId, cohortId) && !examMap.has(currentExamId)) {
            examMap.set(currentExamId, {
                id: currentExamId,
                createdAt: Date.now(),
                label: currentExamLabel || `${currentExamId.split('_').pop()} (当前)`,
                source: 'current'
            });
        }

        prevData.forEach(item => {
            const examId = String(item?.examFullKey || item?.examId || '').trim();
            if (!examId || !isSelectableExamKey(examId, cohortId) || examMap.has(examId)) return;
            examMap.set(examId, {
                id: examId,
                createdAt: item?.updatedAt ? new Date(item.updatedAt).getTime() : 0,
                label: item?.examLabel || item?.examId || examId,
                source: 'cloud'
            });
        });

        return sortExamList(Array.from(examMap.values()));
    }

    function getSelectionDefaults(examList, currentExamId) {
        const list = Array.isArray(examList) ? examList : [];
        if (!list.length) return { exam1: '', exam2: '', exam3: '' };

        const activeExamId = String(currentExamId || window.CURRENT_EXAM_ID || '').trim();
        const currentIndex = activeExamId && list.some(item => item.id === activeExamId)
            ? list.findIndex(item => item.id === activeExamId)
            : list.length - 1;
        const prevIndex = Math.max(0, currentIndex - 1);
        const prev2Index = Math.max(0, currentIndex - 2);

        if (list.length >= 3) {
            return {
                exam1: list[prev2Index].id,
                exam2: list[prevIndex].id,
                exam3: list[currentIndex].id
            };
        }

        return {
            exam1: list[prevIndex].id,
            exam2: list[currentIndex].id,
            exam3: list[currentIndex].id
        };
    }

    function renderExamSelectTriplet(selects, examList, options) {
        const selList = Array.isArray(selects) ? selects.filter(Boolean) : [];
        const list = Array.isArray(examList) ? examList : [];
        const opts = options || {};
        const minCount = Number.isFinite(opts.minCount) ? opts.minCount : 2;
        const emptyHtml = opts.emptyHtml || '<option value="">--考试数量不足(至少2期)--</option>';
        const includeBlankOption = !!opts.includeBlankOption;
        const blankHtml = `<option value="">${opts.blankLabel || '--未选择(自动)--'}</option>`;

        if (!selList.length) return { ok: false, defaults: { exam1: '', exam2: '', exam3: '' } };
        if (list.length < minCount) {
            selList.forEach(select => {
                select.innerHTML = emptyHtml;
            });
            return { ok: false, defaults: { exam1: '', exam2: '', exam3: '' } };
        }

        const optionsHtml = (includeBlankOption ? blankHtml : '') +
            list.map(item => `<option value="${item.id}">${item.label}</option>`).join('');

        selList.forEach(select => {
            select.innerHTML = optionsHtml;
        });

        const defaults = getSelectionDefaults(list, opts.currentExamId);
        if (selList[0]) selList[0].value = defaults.exam1;
        if (selList[1]) selList[1].value = defaults.exam2;
        if (selList[2]) selList[2].value = defaults.exam3;
        return { ok: true, defaults };
    }

    function refreshCompareSelectors() {
        if (typeof window.updateMacroMultiExamSelects === 'function') window.updateMacroMultiExamSelects();
        if (typeof window.updateTeacherMultiExamSelects === 'function') window.updateTeacherMultiExamSelects();
        if (typeof window.updateStudentCompareExamSelects === 'function') window.updateStudentCompareExamSelects();
        if (typeof window.updateProgressMultiExamSelects === 'function') window.updateProgressMultiExamSelects();
    }

    window.ExamCatalog = {
        normalizeCohortId,
        extractCohortIdFromExamKey,
        isSelectableExamKey,
        collectAvailableExams,
        getSelectionDefaults,
        renderExamSelectTriplet,
        refreshCompareSelectors
    };
})();