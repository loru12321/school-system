(() => {
    if (typeof window === 'undefined' || window.__COMPARE_SELECTORS_RUNTIME_PATCHED__) return;

    const CompareSessionStateRuntime = window.CompareSessionState || null;
    const CompareExamSyncRuntime = window.CompareExamSyncRuntime || null;
    const ReportCompareSelectPerfCache = {
        signature: ''
    };
    const ensureCompareExamSyncStateEntry = typeof window.ensureCompareExamSyncStateEntry === 'function'
        ? window.ensureCompareExamSyncStateEntry
        : ((cohortId) => {
            const key = String(cohortId || '').trim();
            const currentState = typeof window.readCompareExamSyncState === 'function'
                ? window.readCompareExamSyncState()
                : (CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getCompareExamSyncState === 'function'
                    ? (CompareSessionStateRuntime.getCompareExamSyncState() || {})
                    : (window.__COMPARE_EXAM_SYNC_STATE && typeof window.__COMPARE_EXAM_SYNC_STATE === 'object' ? window.__COMPARE_EXAM_SYNC_STATE : {}));
            if (!key) return { pending: false, lastAttempt: 0 };
            if (!currentState[key]) {
                currentState[key] = { pending: false, lastAttempt: 0 };
                if (typeof window.setCompareExamSyncState === 'function') {
                    window.setCompareExamSyncState(currentState);
                } else if (CompareSessionStateRuntime && typeof CompareSessionStateRuntime.setCompareExamSyncState === 'function') {
                    CompareSessionStateRuntime.setCompareExamSyncState(currentState);
                } else {
                    window.__COMPARE_EXAM_SYNC_STATE = currentState;
                }
            }
            return currentState[key];
        });

    function onProgressComparePeriodCountChange() {
        const countEl = document.getElementById('progressComparePeriodCount');
        const wrap = document.getElementById('progressCompareExam3Wrap');
        if (!countEl || !wrap) return;
        wrap.style.display = countEl.value === '3' ? 'inline-flex' : 'none';
    }

    const setCompareExamSelectPlaceholders = CompareExamSyncRuntime && typeof CompareExamSyncRuntime.setSelectPlaceholders === 'function'
        ? CompareExamSyncRuntime.setSelectPlaceholders
        : function setCompareExamSelectPlaceholders(selects, message) {
            const optionHtml = `<option value="">${message}</option>`;
            (selects || []).forEach(sel => {
                if (!sel) return;
                sel.innerHTML = optionHtml;
            });
        };

    const refreshCompareExamSelectors = CompareExamSyncRuntime && typeof CompareExamSyncRuntime.refreshSelectors === 'function'
        ? CompareExamSyncRuntime.refreshSelectors
        : function refreshCompareExamSelectors() {
            if (typeof updateProgressMultiExamSelects === 'function') updateProgressMultiExamSelects();
            if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
            if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
            if (typeof updateMacroMultiExamSelects === 'function') updateMacroMultiExamSelects();
            if (typeof updateTeacherMultiExamSelects === 'function') updateTeacherMultiExamSelects();
            if (typeof updateTeacherCompareExamSelects === 'function') updateTeacherCompareExamSelects();
        };

    const trySyncCompareExamOptions = CompareExamSyncRuntime && typeof CompareExamSyncRuntime.trySyncOptions === 'function'
        ? function trySyncCompareExamOptions() {
            return CompareExamSyncRuntime.trySyncOptions({
                cohortId: CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID'),
                minCount: 2
            });
        }
        : function trySyncCompareExamOptions() {
            const rawCohortId = CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID');
            const cohortId = typeof normalizeCompareCohortId === 'function'
                ? normalizeCompareCohortId(rawCohortId)
                : rawCohortId;
            if (!cohortId || !window.CloudManager || typeof window.CloudManager.fetchCohortExamsToLocal !== 'function') return false;
            const state = ensureCompareExamSyncStateEntry(cohortId);
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
        };

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

    function setSelectOptionsIfChanged(select, html, signature) {
        if (!select) return;
        const nextSignature = String(signature || html || '');
        if (select.dataset.compareOptionsSig === nextSignature) return;
        select.innerHTML = html;
        select.dataset.compareOptionsSig = nextSignature;
    }

    function buildSchoolOptionsHtml(schoolList, placeholder = '--请选择学校--') {
        return `<option value="">${placeholder}</option>` + (schoolList || []).map(s => `<option value="${s}">${s}</option>`).join('');
    }

    function normalizeCompareSchoolName(value) {
        return String(value || '').trim();
    }

    function getCurrentCompareSchoolName() {
        return normalizeCompareSchoolName(
            window.MY_SCHOOL
            || (typeof MY_SCHOOL !== 'undefined' ? MY_SCHOOL : '')
            || (window.localStorage && typeof window.localStorage.getItem === 'function' ? window.localStorage.getItem('MY_SCHOOL') : '')
        );
    }

    function areCompareSchoolsEquivalent(left, right) {
        const leftName = normalizeCompareSchoolName(left);
        const rightName = normalizeCompareSchoolName(right);
        if (!leftName || !rightName) return false;
        if (window.PermissionPolicy && typeof window.PermissionPolicy.sameSchoolName === 'function') {
            return window.PermissionPolicy.sameSchoolName(leftName, rightName);
        }
        if (typeof window.areSchoolNamesEquivalent === 'function') {
            return window.areSchoolNamesEquivalent(leftName, rightName);
        }
        if (typeof areSchoolNamesEquivalent === 'function') {
            return areSchoolNamesEquivalent(leftName, rightName);
        }
        return leftName === rightName;
    }

    function resolveCompareSchoolOption(schoolList, preferredSchool) {
        const preferred = normalizeCompareSchoolName(preferredSchool);
        const list = (schoolList || []).map(normalizeCompareSchoolName).filter(Boolean);
        if (!preferred || !list.length) return '';
        if (list.includes(preferred)) return preferred;
        return list.find((school) => areCompareSchoolsEquivalent(school, preferred)) || '';
    }

    function applyCompareSchoolDefault(select, schoolList, options = {}) {
        if (!select) return '';
        const settings = options && typeof options === 'object' ? options : {};
        const currentSchool = getCurrentCompareSchoolName();
        const currentMatch = resolveCompareSchoolOption(schoolList, currentSchool);
        if (currentMatch) {
            select.value = currentMatch;
            return currentMatch;
        }
        if (settings.preservePrevious) {
            const previousMatch = resolveCompareSchoolOption(schoolList, settings.previousValue || select.value);
            if (previousMatch) {
                select.value = previousMatch;
                return previousMatch;
            }
        }
        if (settings.fallbackFirst && !select.value && (schoolList || []).length > 0) {
            select.value = schoolList[0];
            return select.value;
        }
        return select.value || '';
    }

    function buildExamOptionsHtml(examList, options = {}) {
        const defaultOption = options.defaultOption || '';
        return defaultOption + (examList || []).map(e => {
            let label = e.label;
            if (options.decorateSource && e.source === 'cloud') label = '☁️ ' + label;
            if (options.decorateSource && e.source === 'local') label = '📇 ' + label;
            return `<option value="${e.id}">${label}</option>`;
        }).join('');
    }

    function signatureFromList(prefix, list, pick = item => item) {
        return `${prefix}:${(list || []).map(pick).join('|')}`;
    }

    function getReportCompareSelectStateSignature(optionsSig, autoCount, exam1Sel, exam2Sel, exam3Sel, countEl) {
        return [
            optionsSig,
            autoCount,
            getEffectiveCurrentExamId(),
            exam1Sel.value,
            exam2Sel.value,
            exam3Sel.value,
            countEl.value
        ].join('::');
    }

    function updateProgressMultiExamSelects() {
        const schoolSel = document.getElementById('progressCompareSchool');
        const exam1Sel = document.getElementById('progressCompareExam1');
        const exam2Sel = document.getElementById('progressCompareExam2');
        const exam3Sel = document.getElementById('progressCompareExam3');
        if (!schoolSel || !exam1Sel || !exam2Sel || !exam3Sel) return;

        const schoolList = listAvailableSchoolsForCompare('all');
        setSelectOptionsIfChanged(
            schoolSel,
            buildSchoolOptionsHtml(schoolList),
            signatureFromList('schools-all', schoolList)
        );
        applyCompareSchoolDefault(schoolSel, schoolList);

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

        const optionsHtml = buildExamOptionsHtml(examList);
        const optionsSig = signatureFromList('exams', examList, e => `${e.id}:${e.label}`);
        setSelectOptionsIfChanged(exam1Sel, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam2Sel, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam3Sel, optionsHtml, optionsSig);

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

        const schoolList = listAvailableSchoolsForCompare('all');
        setSelectOptionsIfChanged(
            schoolSel,
            buildSchoolOptionsHtml(schoolList),
            signatureFromList('schools-all', schoolList)
        );
        applyCompareSchoolDefault(schoolSel, schoolList);

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

        const optionsHtml = buildExamOptionsHtml(examList);
        const optionsSig = signatureFromList('exams', examList, e => `${e.id}:${e.label}`);
        setSelectOptionsIfChanged(exam1Sel, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam2Sel, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam3Sel, optionsHtml, optionsSig);

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
        const optionsSig = signatureFromList('report-exams', examList, e => `${e.id}:${e.label}:${e.source || ''}`);
        const stateSig = getReportCompareSelectStateSignature(optionsSig, autoCount, exam1Sel, exam2Sel, exam3Sel, countEl);
        if (ReportCompareSelectPerfCache.signature === stateSig
            && exam1Sel.dataset.compareOptionsSig === optionsSig
            && exam2Sel.dataset.compareOptionsSig === optionsSig
            && exam3Sel.dataset.compareOptionsSig === optionsSig) {
            return;
        }
        countEl.value = String(autoCount);
        const count3Option = countEl.querySelector('option[value="3"]');
        if (count3Option) count3Option.disabled = examList.length < 3;
        onReportComparePeriodCountChange();
        const optionsHtml = buildExamOptionsHtml(examList, { defaultOption, decorateSource: true });
        setSelectOptionsIfChanged(exam1Sel, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam2Sel, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam3Sel, optionsHtml, optionsSig);
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
            ReportCompareSelectPerfCache.signature = getReportCompareSelectStateSignature(optionsSig, autoCount, exam1Sel, exam2Sel, exam3Sel, countEl);
            return;
        }
        const defaultIds = getDefaultCompareExamIds(examList, autoCount, getEffectiveCurrentExamId());
        exam1Sel.value = defaultIds[0] || '';
        exam2Sel.value = defaultIds[1] || defaultIds[0] || '';
        exam3Sel.value = autoCount === 3 ? (defaultIds[2] || '') : '';
        ReportCompareSelectPerfCache.signature = getReportCompareSelectStateSignature(optionsSig, autoCount, exam1Sel, exam2Sel, exam3Sel, countEl);
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
        setSelectOptionsIfChanged(
            schoolSel,
            buildSchoolOptionsHtml(schoolList),
            signatureFromList('schools', schoolList)
        );
        applyCompareSchoolDefault(schoolSel, schoolList);

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

        const optionsHtml = buildExamOptionsHtml(examList);
        const optionsSig = signatureFromList('exams', examList, e => `${e.id}:${e.label}`);
        setSelectOptionsIfChanged(exam1Sel, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam2Sel, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam3Sel, optionsHtml, optionsSig);

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

        const schoolList = getTeacherCompareSchoolList(listAvailableSchoolsForCompare('all'));
        setSelectOptionsIfChanged(
            schoolSel,
            buildSchoolOptionsHtml(schoolList),
            signatureFromList('teacher-schools', schoolList)
        );
        applyCompareSchoolDefault(schoolSel, schoolList, { fallbackFirst: true });

        const sortedSubjects = getTeacherCompareSubjectList();
        setSelectOptionsIfChanged(
            subjectSel,
            '<option value="">--请选择学科--</option>' + sortedSubjects.map(sub => `<option value="${sub}">${sub}</option>`).join(''),
            signatureFromList('teacher-subjects', sortedSubjects)
        );

        const examList = getTeacherCompareExamList();
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

        const optionsHtml = buildExamOptionsHtml(examList);
        const optionsSig = signatureFromList('exams', examList, e => `${e.id}:${e.label}`);
        setSelectOptionsIfChanged(exam1Sel, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam2Sel, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam3Sel, optionsHtml, optionsSig);

        const defaultIds = getDefaultCompareExamIds(examList, examList.length >= 3 ? 3 : 2, CURRENT_EXAM_ID);
        exam1Sel.value = defaultIds[0] || '';
        exam2Sel.value = defaultIds[1] || defaultIds[0] || '';
        exam3Sel.value = defaultIds[2] || defaultIds[defaultIds.length - 1] || '';

        onTeacherComparePeriodCountChange();
        pickTeacherCompareDefaultSubjectAndTeacher();
    }

    function getTeacherMapForCompare() {
        if (typeof window.readTeacherMap === 'function') return window.readTeacherMap() || {};
        if (window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object') return window.TEACHER_MAP;
        if (typeof TEACHER_MAP !== 'undefined' && TEACHER_MAP && typeof TEACHER_MAP === 'object') return TEACHER_MAP;
        return {};
    }

    function getTeacherSchoolMapForCompare() {
        if (typeof window.readTeacherSchoolMap === 'function') return window.readTeacherSchoolMap() || {};
        if (window.TEACHER_SCHOOL_MAP && typeof window.TEACHER_SCHOOL_MAP === 'object') return window.TEACHER_SCHOOL_MAP;
        if (typeof TEACHER_SCHOOL_MAP !== 'undefined' && TEACHER_SCHOOL_MAP && typeof TEACHER_SCHOOL_MAP === 'object') return TEACHER_SCHOOL_MAP;
        return {};
    }

    function getTeacherCompareSchoolList(baseList = []) {
        const names = [];
        const addName = (rawName) => {
            const name = String(rawName || '').trim();
            if (!name) return;
            if (names.some(existing => areCompareSchoolsEquivalent(existing, name))) return;
            names.push(name);
        };
        (baseList || []).forEach(addName);
        Object.values(getTeacherSchoolMapForCompare()).forEach((school) => {
            addName(school);
        });
        const currentSchool = getCurrentCompareSchoolName();
        if (currentSchool) addName(currentSchool);
        const classSchoolMap = (typeof getClassSchoolMapForAllData === 'function') ? getClassSchoolMapForAllData() : {};
        Object.keys(getTeacherMapForCompare()).forEach((key) => {
            const [rawClass] = String(key).split('_');
            const cls = normalizeClass(rawClass);
            const mappedSchool = String(classSchoolMap[cls] || classSchoolMap[rawClass] || '').trim();
            if (mappedSchool) addName(mappedSchool);
        });
        return names.sort((a, b) => a.localeCompare(b, 'zh-CN'));
    }

    function getTeacherCompareSubjectList() {
        const subjects = new Map();
        (SUBJECTS || []).forEach((subject) => {
            const label = String(subject || '').trim();
            if (label) subjects.set(normalizeSubject(label) || label, label);
        });
        Object.keys(getTeacherMapForCompare()).forEach((key) => {
            const rawSubject = String(key).split('_')[1] || '';
            const normalized = normalizeSubject(rawSubject);
            if (!normalized) return;
            const matched = (SUBJECTS || []).find(s => normalizeSubject(s) === normalized);
            subjects.set(normalized, matched || rawSubject);
        });
        return [...subjects.values()].sort(sortSubjects);
    }

    function getTeacherCompareExamList() {
        const primary = typeof listAvailableExamsForCompare === 'function' ? listAvailableExamsForCompare() : [];
        if (Array.isArray(primary) && primary.length >= 2) return primary;
        const fallback = typeof window.tmGetAvailableExamList === 'function' ? window.tmGetAvailableExamList() : [];
        return Array.isArray(fallback) && fallback.length ? fallback : primary;
    }

    function updateTeacherCompareExamSelects() {
        const schoolEl = document.getElementById('teacherCompareSchool');
        const subjectEl = document.getElementById('teacherCompareSubject');
        const exam1El = document.getElementById('teacherCompareExam1');
        const exam2El = document.getElementById('teacherCompareExam2');
        const exam3El = document.getElementById('teacherCompareExam3');

        if (!schoolEl || !subjectEl || !exam1El || !exam2El || !exam3El) return;

        const schoolList = getTeacherCompareSchoolList(listAvailableSchoolsForCompare('all'));
        setSelectOptionsIfChanged(
            schoolEl,
            buildSchoolOptionsHtml(schoolList),
            signatureFromList('teacher-schools', schoolList)
        );
        applyCompareSchoolDefault(schoolEl, schoolList, { fallbackFirst: true });

        const teacherSubjects = getTeacherCompareSubjectList();
        setSelectOptionsIfChanged(
            subjectEl,
            '<option value="">--请选择学科--</option>' + teacherSubjects.map(sub => `<option value="${sub}">${sub}</option>`).join(''),
            signatureFromList('teacher-subjects', teacherSubjects)
        );

        const examList = getTeacherCompareExamList();
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

        const optionsHtml = buildExamOptionsHtml(examList);
        const optionsSig = signatureFromList('exams', examList, e => `${e.id}:${e.label}`);
        setSelectOptionsIfChanged(exam1El, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam2El, optionsHtml, optionsSig);
        setSelectOptionsIfChanged(exam3El, optionsHtml, optionsSig);

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

        const schoolRows = Object.entries(SCHOOLS || {}).flatMap(([schoolName, schoolData]) => (
            areCompareSchoolsEquivalent(schoolName, school) ? (schoolData?.students || []) : []
        ));
        const schoolClasses = new Set(schoolRows.map(s => normalizeClass(s.class)));
        const classSchoolMap = (typeof getClassSchoolMapForAllData === 'function') ? getClassSchoolMapForAllData() : {};
        Object.entries(classSchoolMap).forEach(([cls, sch]) => {
            if (areCompareSchoolsEquivalent(sch, school)) schoolClasses.add(normalizeClass(cls));
        });
        const names = new Set();
        const teacherMap = getTeacherMapForCompare();
        const teacherSchoolMap = getTeacherSchoolMapForCompare();
        Object.entries(teacherMap).forEach(([key, teacherName]) => {
            const explicitSchool = String(teacherSchoolMap[key] || '').trim();
            let hasExplicitSchoolMatch = false;
            if (explicitSchool) {
                const sameSchool = typeof areSchoolNamesEquivalent === 'function'
                    ? areSchoolNamesEquivalent(explicitSchool, school)
                    : explicitSchool === school;
                if (!sameSchool) return;
                hasExplicitSchoolMatch = true;
            }
            const [rawClass, rawSubject] = String(key).split('_');
            const cls = normalizeClass(rawClass);
            const sub = (SUBJECTS || []).find(s => normalizeSubject(s) === normalizeSubject(rawSubject)) || String(rawSubject || '').trim();
            if (!cls || !sub) return;
            if (sub !== subject) return;
            if (!hasExplicitSchoolMatch && schoolClasses.size > 0 && !schoolClasses.has(cls)) return;
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
        resolveCompareSchoolOption,
        applyCompareSchoolDefault,
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
