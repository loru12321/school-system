(function() {
    function renderOptions(selectEl, options, placeholder) {
        if (!selectEl) return;
        const placeholderHtml = placeholder ? `<option value="">${placeholder}</option>` : '';
        const optionsHtml = (options || []).map(option => {
            const value = option && typeof option === 'object' ? option.value : option;
            const label = option && typeof option === 'object' ? option.label : option;
            return `<option value="${value}">${label}</option>`;
        }).join('');
        selectEl.innerHTML = placeholderHtml + optionsHtml;
    }

    function renderSchoolSelect(selectEl, schoolList, preferredSchool) {
        renderOptions(selectEl, schoolList || [], '--请选择学校--');
        const targetSchool = String(preferredSchool || '').trim();
        if (targetSchool && Array.isArray(schoolList) && schoolList.includes(targetSchool)) {
            selectEl.value = targetSchool;
        }
    }

    function renderSubjectSelect(selectEl, subjects, options) {
        const opts = options || {};
        const list = Array.isArray(subjects) ? [...subjects] : [];
        if (typeof opts.sortFn === 'function') {
            list.sort(opts.sortFn);
        }
        renderOptions(selectEl, list, opts.placeholder || '--请选择学科--');
    }

    function renderExamTriplet(exam1Sel, exam2Sel, exam3Sel, options) {
        const opts = options || {};
        if (window.ExamCatalog && typeof window.ExamCatalog.renderExamSelectTriplet === 'function') {
            return window.ExamCatalog.renderExamSelectTriplet(
                [exam1Sel, exam2Sel, exam3Sel],
                opts.examList || [],
                { currentExamId: opts.currentExamId }
            );
        }
        return { ok: false };
    }

    function initializeCompareFilters(config) {
        const cfg = config || {};
        const schoolList = Array.isArray(cfg.schoolList) ? cfg.schoolList : [];
        if (cfg.schoolSelect) {
            renderSchoolSelect(cfg.schoolSelect, schoolList, cfg.preferredSchool);
        }
        if (cfg.subjectSelect) {
            renderSubjectSelect(cfg.subjectSelect, cfg.subjects || [], {
                sortFn: cfg.subjectSortFn,
                placeholder: cfg.subjectPlaceholder || '--请选择学科--'
            });
        }
        if (cfg.examSelects && cfg.examSelects.length === 3) {
            renderExamTriplet(cfg.examSelects[0], cfg.examSelects[1], cfg.examSelects[2], {
                examList: cfg.examList || [],
                currentExamId: cfg.currentExamId
            });
        }
    }

    window.CompareUiService = {
        renderOptions,
        renderSchoolSelect,
        renderSubjectSelect,
        renderExamTriplet,
        initializeCompareFilters
    };
})();