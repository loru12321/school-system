(() => {
    if (typeof window === 'undefined' || window.__COMPARE_SELECTORS_RUNTIME_PATCHED__) return;

    function onProgressComparePeriodCountChange() {
        const countEl = document.getElementById('progressComparePeriodCount');
        const wrap = document.getElementById('progressCompareExam3Wrap');
        if (!countEl || !wrap) return;
        wrap.style.display = countEl.value === '3' ? 'inline-flex' : 'none';
    }

    function setCompareExamSelectPlaceholders(selects, message) {
        const optionHtml = `<option value="">${message}</option>`;
        (selects || []).forEach(sel => {
            if (!sel) return;
            sel.innerHTML = optionHtml;
        });
    }

    function refreshCompareExamSelectors() {
        if (typeof updateProgressMultiExamSelects === 'function') updateProgressMultiExamSelects();
        if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
        if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
        if (typeof updateMacroMultiExamSelects === 'function') updateMacroMultiExamSelects();
        if (typeof updateTeacherMultiExamSelects === 'function') updateTeacherMultiExamSelects();
        if (typeof updateTeacherCompareExamSelects === 'function') updateTeacherCompareExamSelects();
    }

    function trySyncCompareExamOptions() {
        const rawCohortId = CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID');
        const cohortId = typeof normalizeCompareCohortId === 'function'
            ? normalizeCompareCohortId(rawCohortId)
            : rawCohortId;
        if (!cohortId || !window.CloudManager || typeof window.CloudManager.fetchCohortExamsToLocal !== 'function') return false;
        if (!window.__COMPARE_EXAM_SYNC_STATE) window.__COMPARE_EXAM_SYNC_STATE = {};
        const state = window.__COMPARE_EXAM_SYNC_STATE[cohortId] || { pending: false, lastAttempt: 0 };
        window.__COMPARE_EXAM_SYNC_STATE[cohortId] = state;
        if (state.pending) return true;
        if (Date.now() - Number(state.lastAttempt || 0) < 5000) return false;
        state.pending = true;
        state.lastAttempt = Date.now();
        Promise.resolve(window.CloudManager.fetchCohortExamsToLocal(cohortId, { minCount: 2 }))
            .catch(err => {
                console.warn('[compare-sync] fetchCohortExamsToLocal failed:', err);
            })
            .finally(() => {
                state.pending = false;
                setTimeout(() => {
                    refreshCompareExamSelectors();
                }, 0);
            });
        return true;
    }

    function getDefaultCompareExamIds(examList, desiredCount = 2, preferredCurrentExamId = '') {
        const list = Array.isArray(examList) ? examList.filter(item => item?.id) : [];
        if (!list.length) return [];

        const count = Math.max(1, Math.min(Number(desiredCount) || 2, list.length));
        const effectiveCurrentExamId = String(
            preferredCurrentExamId
            || (typeof getEffectiveCurrentExamId === 'function' ? getEffectiveCurrentExamId() : '')
            || CURRENT_EXAM_ID
            || ''
        ).trim();

        let currentIndex = effectiveCurrentExamId
            ? list.findIndex(item => isExamKeyEquivalentForCompare(item.id, effectiveCurrentExamId))
            : -1;
        if (currentIndex < 0) currentIndex = list.length - 1;

        let selected = list.slice(Math.max(0, currentIndex - count + 1), currentIndex + 1);
        if (selected.length < count) {
            selected = list.slice(Math.max(0, list.length - count));
        }
        return selected.map(item => item.id);
    }

    function updateProgressMultiExamSelects() {
        const schoolSel = document.getElementById('progressCompareSchool');
        const exam1Sel = document.getElementById('progressCompareExam1');
        const exam2Sel = document.getElementById('progressCompareExam2');
        const exam3Sel = document.getElementById('progressCompareExam3');
        if (!schoolSel || !exam1Sel || !exam2Sel || !exam3Sel) return;

        const schoolList = listAvailableSchoolsForCompare();
        schoolSel.innerHTML = '<option value="">--请选择学校--</option>';
        schoolList.forEach(s => schoolSel.innerHTML += `<option value="${s}">${s}</option>`);
        if (MY_SCHOOL && schoolList.includes(MY_SCHOOL)) schoolSel.value = MY_SCHOOL;

        const examList = listAvailableExamsForCompare();
        if (examList.length < 2) {
            const syncing = trySyncCompareExamOptions();
            if (syncing) {
                setCompareExamSelectPlaceholders([exam1Sel, exam2Sel, exam3Sel], '正在同步云端考试期数...');
                return;
            }
            const msg = '<option value="">--考试数量不足(至少2期)--</option>';
            exam1Sel.innerHTML = msg;
            exam2Sel.innerHTML = msg;
            exam3Sel.innerHTML = msg;
            return;
        }

        const optionsHtml = examList.map(e => `<option value="${e.id}">${e.label}</option>`).join('');
        exam1Sel.innerHTML = optionsHtml;
        exam2Sel.innerHTML = optionsHtml;
        exam3Sel.innerHTML = optionsHtml;

        const defaultIds = getDefaultCompareExamIds(examList, examList.length >= 3 ? 3 : 2, CURRENT_EXAM_ID);
        exam1Sel.value = defaultIds[0] || '';
        exam2Sel.value = defaultIds[1] || defaultIds[0] || '';
        exam3Sel.value = defaultIds[2] || defaultIds[defaultIds.length - 1] || '';

        onProgressComparePeriodCountChange();
    }

    function onStudentComparePeriodCountChange() {
        const countEl = document.getElementById('studentComparePeriodCount');
        const wrap = document.getElementById('studentCompareExam3Wrap');
        if (!countEl || !wrap) return;
        wrap.style.display = countEl.value === '3' ? 'inline-flex' : 'none';
    }

    function updateStudentCompareExamSelects() {
        const schoolSel = document.getElementById('studentCompareSchool');
        const exam1Sel = document.getElementById('studentCompareExam1');
        const exam2Sel = document.getElementById('studentCompareExam2');
        const exam3Sel = document.getElementById('studentCompareExam3');
        if (!schoolSel || !exam1Sel || !exam2Sel || !exam3Sel) return;

        const schoolList = listAvailableSchoolsForCompare();
        schoolSel.innerHTML = '<option value="">--请选择学校--</option>';
        schoolList.forEach(s => schoolSel.innerHTML += `<option value="${s}">${s}</option>`);
        if (MY_SCHOOL && schoolList.includes(MY_SCHOOL)) {
            schoolSel.value = MY_SCHOOL;
        }

        const examList = listAvailableExamsForCompare();
        if (examList.length < 2) {
            const syncing = trySyncCompareExamOptions();
            if (syncing) {
                setCompareExamSelectPlaceholders([exam1Sel, exam2Sel, exam3Sel], '正在同步云端考试期数...');
                return;
            }
            const msg = '<option value="">--考试数量不足(至少2期)--</option>';
            exam1Sel.innerHTML = msg;
            exam2Sel.innerHTML = msg;
            exam3Sel.innerHTML = msg;
            return;
        }

        const optionsHtml = examList.map(e => `<option value="${e.id}">${e.label}</option>`).join('');
        exam1Sel.innerHTML = optionsHtml;
        exam2Sel.innerHTML = optionsHtml;
        exam3Sel.innerHTML = optionsHtml;

        const defaultIds = getDefaultCompareExamIds(examList, examList.length >= 3 ? 3 : 2, CURRENT_EXAM_ID);
        exam1Sel.value = defaultIds[0] || '';
        exam2Sel.value = defaultIds[1] || defaultIds[0] || '';
        exam3Sel.value = defaultIds[2] || defaultIds[defaultIds.length - 1] || '';

        onStudentComparePeriodCountChange();
    }

    function updateReportCompareExamSelects() {
        const countEl = document.getElementById('reportComparePeriodCount');
        const exam1Sel = document.getElementById('reportCompareExam1');
        const exam2Sel = document.getElementById('reportCompareExam2');
        const exam3Sel = document.getElementById('reportCompareExam3');
        if (!countEl || !exam1Sel || !exam2Sel || !exam3Sel) return;
        const v1 = exam1Sel.value;
        const v2 = exam2Sel.value;
        const v3 = exam3Sel.value;
        const examList = typeof listAvailableExamsForCompare === 'function'
            ? listAvailableExamsForCompare()
            : [];
        const defaultOption = '<option value="">--未选择(自动)--</option>';
        if (examList.length < 2) {
            const syncing = trySyncCompareExamOptions();
            if (syncing) {
                setCompareExamSelectPlaceholders([exam1Sel, exam2Sel, exam3Sel], '正在同步云端考试期数...');
                return;
            }
            const msg = '<option value="">--无可用历史数据--</option>';
            exam1Sel.innerHTML = msg;
            exam2Sel.innerHTML = msg;
            exam3Sel.innerHTML = msg;
            return;
        }
        const autoCount = examList.length >= 3 ? 3 : 2;
        countEl.value = String(autoCount);
        const count3Option = countEl.querySelector('option[value="3"]');
        if (count3Option) count3Option.disabled = examList.length < 3;
        onReportComparePeriodCountChange();
        const optionsHtml = defaultOption + examList.map(e => {
            let label = e.label;
            if (e.source === 'cloud') label = '☁️ ' + label;
            if (e.source === 'local') label = '📇 ' + label;
            return `<option value="${e.id}">${label}</option>`;
        }).join('');
        exam1Sel.innerHTML = optionsHtml;
        exam2Sel.innerHTML = optionsHtml;
        exam3Sel.innerHTML = optionsHtml;
        const resolveExamId = (value) => {
            if (!value) return '';
            const hit = examList.find(e => isExamKeyEquivalentForCompare(e.id, value));
            return hit ? hit.id : '';
        };
        const manualValues = autoCount === 3
            ? [resolveExamId(v1), resolveExamId(v2), resolveExamId(v3)]
            : [resolveExamId(v1), resolveExamId(v2)];
        const hasValidManualSelection = manualValues.every(Boolean) && (new Set(manualValues).size === manualValues.length);
        if (hasValidManualSelection) {
            const ordered = sortExamIdsChronologically(manualValues);
            exam1Sel.value = ordered[0] || '';
            exam2Sel.value = ordered[1] || '';
            exam3Sel.value = autoCount === 3 ? (ordered[2] || '') : '';
            return;
        }
        const defaultIds = getDefaultCompareExamIds(examList, autoCount, getEffectiveCurrentExamId());
        exam1Sel.value = defaultIds[0] || '';
        exam2Sel.value = defaultIds[1] || defaultIds[0] || '';
        exam3Sel.value = autoCount === 3 ? (defaultIds[2] || '') : '';
    }

    function onReportComparePeriodCountChange() {
        const countEl = document.getElementById('reportComparePeriodCount');
        const wrap3 = document.getElementById('reportCompareExam3Wrap');
        const sel3 = document.getElementById('reportCompareExam3');
        if (!countEl || !wrap3 || !sel3) return;

        if (countEl.value === '2') {
            wrap3.style.display = 'none';
            sel3.value = "";
        } else {
            wrap3.style.display = 'flex';
        }
    }

    function onMacroComparePeriodCountChange() {
        const countEl = document.getElementById('macroComparePeriodCount');
        const wrap = document.getElementById('macroCompareExam3Wrap');
        if (!countEl || !wrap) return;
        wrap.style.display = countEl.value === '3' ? 'inline-flex' : 'none';
    }

    function updateMacroMultiExamSelects() {
        const schoolSel = document.getElementById('macroCompareSchool');
        const exam1Sel = document.getElementById('macroCompareExam1');
        const exam2Sel = document.getElementById('macroCompareExam2');
        const exam3Sel = document.getElementById('macroCompareExam3');
        if (!schoolSel || !exam1Sel || !exam2Sel || !exam3Sel) return;

        const schoolList = listAvailableSchoolsForCompare();
        schoolSel.innerHTML = '<option value="">--请选择学校--</option>';
        schoolList.forEach(s => schoolSel.innerHTML += `<option value="${s}">${s}</option>`);
        if (MY_SCHOOL && schoolList.includes(MY_SCHOOL)) schoolSel.value = MY_SCHOOL;

        const examList = listAvailableExamsForCompare();
        if (examList.length < 2) {
            const syncing = trySyncCompareExamOptions();
            if (syncing) {
                setCompareExamSelectPlaceholders([exam1Sel, exam2Sel, exam3Sel], '正在同步云端考试期数...');
                return;
            }
            const msg = '<option value="">--考试数量不足(至少2期)--</option>';
            exam1Sel.innerHTML = msg;
            exam2Sel.innerHTML = msg;
            exam3Sel.innerHTML = msg;
            return;
        }

        const optionsHtml = examList.map(e => `<option value="${e.id}">${e.label}</option>`).join('');
        exam1Sel.innerHTML = optionsHtml;
        exam2Sel.innerHTML = optionsHtml;
        exam3Sel.innerHTML = optionsHtml;

        const defaultIds = getDefaultCompareExamIds(examList, examList.length >= 3 ? 3 : 2, CURRENT_EXAM_ID);
        exam1Sel.value = defaultIds[0] || '';
        exam2Sel.value = defaultIds[1] || defaultIds[0] || '';
        exam3Sel.value = defaultIds[2] || defaultIds[defaultIds.length - 1] || '';

        onMacroComparePeriodCountChange();
    }

    function onTeacherComparePeriodCountChange() {
        const countEl = document.getElementById('teacherComparePeriodCount');
        const wrap = document.getElementById('teacherCompareExam3Wrap');
        if (!countEl || !wrap) return;
        wrap.style.display = countEl.value === '3' ? 'inline-flex' : 'none';
    }

    function updateTeacherMultiExamSelects() {
        const schoolSel = document.getElementById('teacherCompareSchool');
        const subjectSel = document.getElementById('teacherCompareSubject');
        const exam1Sel = document.getElementById('teacherCompareExam1');
        const exam2Sel = document.getElementById('teacherCompareExam2');
        const exam3Sel = document.getElementById('teacherCompareExam3');
        if (!schoolSel || !subjectSel || !exam1Sel || !exam2Sel || !exam3Sel) return;

        const schoolList = listAvailableSchoolsForCompare();
        schoolSel.innerHTML = '<option value="">--请选择学校--</option>';
        schoolList.forEach(s => schoolSel.innerHTML += `<option value="${s}">${s}</option>`);
        if (MY_SCHOOL && schoolList.includes(MY_SCHOOL)) schoolSel.value = MY_SCHOOL;
        else if (!schoolSel.value && schoolList.length > 0) schoolSel.value = schoolList[0];

        subjectSel.innerHTML = '<option value="">--请选择学科--</option>';
        [...SUBJECTS].sort(sortSubjects).forEach(sub => {
            subjectSel.innerHTML += `<option value="${sub}">${sub}</option>`;
        });

        const examList = listAvailableExamsForCompare();
        if (examList.length < 2) {
            const syncing = trySyncCompareExamOptions();
            if (syncing) {
                setCompareExamSelectPlaceholders([exam1Sel, exam2Sel, exam3Sel], '正在同步云端考试期数...');
                return;
            }
            const msg = '<option value="">--考试数量不足(至少2期)--</option>';
            exam1Sel.innerHTML = msg;
            exam2Sel.innerHTML = msg;
            exam3Sel.innerHTML = msg;
            return;
        }

        const optionsHtml = examList.map(e => `<option value="${e.id}">${e.label}</option>`).join('');
        exam1Sel.innerHTML = optionsHtml;
        exam2Sel.innerHTML = optionsHtml;
        exam3Sel.innerHTML = optionsHtml;

        const defaultIds = getDefaultCompareExamIds(examList, examList.length >= 3 ? 3 : 2, CURRENT_EXAM_ID);
        exam1Sel.value = defaultIds[0] || '';
        exam2Sel.value = defaultIds[1] || defaultIds[0] || '';
        exam3Sel.value = defaultIds[2] || defaultIds[defaultIds.length - 1] || '';

        onTeacherComparePeriodCountChange();
        pickTeacherCompareDefaultSubjectAndTeacher();
    }

    function updateTeacherCompareExamSelects() {
        const schoolEl = document.getElementById('teacherCompareSchool');
        const subjectEl = document.getElementById('teacherCompareSubject');
        const exam1El = document.getElementById('teacherCompareExam1');
        const exam2El = document.getElementById('teacherCompareExam2');
        const exam3El = document.getElementById('teacherCompareExam3');

        if (!schoolEl || !subjectEl || !exam1El || !exam2El || !exam3El) return;

        const schoolList = listAvailableSchoolsForCompare();
        schoolEl.innerHTML = '<option value="">--请选择学校--</option>';
        schoolList.forEach(s => schoolEl.innerHTML += `<option value="${s}">${s}</option>`);
        if (MY_SCHOOL && schoolList.includes(MY_SCHOOL)) {
            schoolEl.value = MY_SCHOOL;
        } else if (!schoolEl.value && schoolList.length > 0) {
            schoolEl.value = schoolList[0];
        }

        subjectEl.innerHTML = '<option value="">--请选择学科--</option>';
        (SUBJECTS || []).forEach(sub => {
            subjectEl.innerHTML += `<option value="${sub}">${sub}</option>`;
        });

        const examList = listAvailableExamsForCompare();
        if (examList.length < 2) {
            const syncing = trySyncCompareExamOptions();
            if (syncing) {
                setCompareExamSelectPlaceholders([exam1El, exam2El, exam3El], '正在同步云端考试期数...');
                return;
            }
            const msg = '<option value="">--考试数量不足(至少2期)--</option>';
            exam1El.innerHTML = msg;
            exam2El.innerHTML = msg;
            exam3El.innerHTML = msg;
            return;
        }

        const optionsHtml = examList.map(e => `<option value="${e.id}">${e.label}</option>`).join('');
        exam1El.innerHTML = optionsHtml;
        exam2El.innerHTML = optionsHtml;
        exam3El.innerHTML = optionsHtml;

        const defaultIds = getDefaultCompareExamIds(examList, examList.length >= 3 ? 3 : 2, CURRENT_EXAM_ID);
        exam1El.value = defaultIds[0] || '';
        exam2El.value = defaultIds[1] || defaultIds[0] || '';
        exam3El.value = defaultIds[2] || defaultIds[defaultIds.length - 1] || '';

        if (typeof updateTeacherCompareTeacherSelect === 'function') {
            updateTeacherCompareTeacherSelect();
        }
        pickTeacherCompareDefaultSubjectAndTeacher();
    }

    function pickTeacherCompareDefaultSubjectAndTeacher() {
        const schoolEl = document.getElementById('teacherCompareSchool');
        const subjectEl = document.getElementById('teacherCompareSubject');
        const teacherEl = document.getElementById('teacherCompareTeacher');
        if (!schoolEl || !subjectEl || !teacherEl) return;
        const schools = Array.from(schoolEl.options).map(option => option.value).filter(Boolean);
        const subjects = Array.from(subjectEl.options).map(option => option.value).filter(Boolean);
        if (!schools.length || !subjects.length) return;

        const tryPick = (school, subject) => {
            schoolEl.value = school;
            subjectEl.value = subject;
            updateTeacherCompareTeacherSelect();
            const firstTeacher = Array.from(teacherEl.options).find(option => option.value)?.value || '';
            if (!firstTeacher) return false;
            teacherEl.value = firstTeacher;
            return true;
        };

        const preferredSchoolOrder = [];
        if (schoolEl.value) preferredSchoolOrder.push(schoolEl.value);
        schools.forEach(school => {
            if (!preferredSchoolOrder.includes(school)) preferredSchoolOrder.push(school);
        });

        if (schoolEl.value && subjectEl.value && tryPick(schoolEl.value, subjectEl.value)) return;
        for (const school of preferredSchoolOrder) {
            for (const subject of subjects) {
                if (tryPick(school, subject)) return;
            }
        }
    }

    function updateTeacherCompareTeacherSelect() {
        const schoolEl = document.getElementById('teacherCompareSchool');
        const subjectEl = document.getElementById('teacherCompareSubject');
        const teacherEl = document.getElementById('teacherCompareTeacher');
        if (!schoolEl || !subjectEl || !teacherEl) return;

        const school = schoolEl.value;
        const subject = subjectEl.value;
        teacherEl.innerHTML = '<option value="">--请选择教师--</option>';
        if (!school || !subject) return;

        const schoolClasses = new Set((SCHOOLS[school]?.students || []).map(s => normalizeClass(s.class)));
        const classSchoolMap = (typeof getClassSchoolMapForAllData === 'function') ? getClassSchoolMapForAllData() : {};
        Object.entries(classSchoolMap).forEach(([cls, sch]) => {
            if (sch === school) schoolClasses.add(normalizeClass(cls));
        });
        const names = new Set();
        Object.entries(TEACHER_MAP || {}).forEach(([key, teacherName]) => {
            const [rawClass, rawSubject] = String(key).split('_');
            const cls = normalizeClass(rawClass);
            const sub = SUBJECTS.find(s => normalizeSubject(s) === normalizeSubject(rawSubject));
            if (!cls || !sub) return;
            if (sub !== subject) return;
            if (!schoolClasses.has(cls)) return;
            const name = String(teacherName || '').trim();
            if (name) names.add(name);
        });

        [...names].sort((a, b) => a.localeCompare(b, 'zh-CN')).forEach(name => {
            teacherEl.innerHTML += `<option value="${name}">${name}</option>`;
        });
        if (!teacherEl.value) {
            teacherEl.value = Array.from(teacherEl.options).find(option => option.value)?.value || '';
        }
    }

    Object.assign(window, {
        onProgressComparePeriodCountChange,
        setCompareExamSelectPlaceholders,
        refreshCompareExamSelectors,
        trySyncCompareExamOptions,
        updateProgressMultiExamSelects,
        onStudentComparePeriodCountChange,
        updateStudentCompareExamSelects,
        updateReportCompareExamSelects,
        onReportComparePeriodCountChange,
        getDefaultCompareExamIds,
        onMacroComparePeriodCountChange,
        updateMacroMultiExamSelects,
        onTeacherComparePeriodCountChange,
        updateTeacherMultiExamSelects,
        updateTeacherCompareExamSelects,
        pickTeacherCompareDefaultSubjectAndTeacher,
        updateTeacherCompareTeacherSelect
    });

    window.__COMPARE_SELECTORS_RUNTIME_PATCHED__ = true;
})();
