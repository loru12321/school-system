(() => {
    if (typeof window === 'undefined' || window.__PROGRESS_ANALYSIS_RUNTIME_PATCHED__) return;

    const CompareSessionStateRuntime = window.CompareSessionState || null;
    const CompareExamSyncRuntime = window.CompareExamSyncRuntime || null;
    const syncProgressState = typeof window.syncProgressRuntimeState === 'function'
        ? window.syncProgressRuntimeState
        : null;
    const readProgressCacheState = typeof window.readProgressCacheState === 'function'
        ? window.readProgressCacheState
        : (() => (Array.isArray(window.PROGRESS_CACHE) ? window.PROGRESS_CACHE : []));
    const readProgressCacheFullState = typeof window.readProgressCacheFullState === 'function'
        ? window.readProgressCacheFullState
        : (() => (Array.isArray(window.PROGRESS_CACHE_FULL) ? window.PROGRESS_CACHE_FULL : []));
    const readManualIdMappingsState = typeof window.readManualIdMappingsState === 'function'
        ? window.readManualIdMappingsState
        : (() => (window.MANUAL_ID_MAPPINGS && typeof window.MANUAL_ID_MAPPINGS === 'object' ? window.MANUAL_ID_MAPPINGS : {}));
    const readLastVaDataState = typeof window.readLastVaDataState === 'function'
        ? window.readLastVaDataState
        : (() => (Array.isArray(window.LAST_VA_DATA) ? window.LAST_VA_DATA : []));
    const readProgressViewModeState = typeof window.readProgressViewModeState === 'function'
        ? window.readProgressViewModeState
        : (() => (String(window.VA_VIEW_MODE || 'school').trim() === 'class' ? 'class' : 'school'));
    const readProgressQuickModeState = typeof window.readProgressQuickModeState === 'function'
        ? window.readProgressQuickModeState
        : (() => {
            const mode = String(window.__PROGRESS_QUICK_MODE || 'all').trim();
            return ['all', 'my_class', 'focus'].includes(mode) ? mode : 'all';
        });

    function getProgressExamDateSortTimestamp(exam) {
        if (typeof window.getExamRecordDateSortTimestamp === 'function') {
            return window.getExamRecordDateSortTimestamp(exam?.id || exam?.examId || exam?.examFullKey || '', exam);
        }
        const dateText = String(exam?.meta?.date || exam?.date || exam?.id || exam?.examId || exam?.examFullKey || '').match(/(\d{4}-\d{2}-\d{2})(?!.*\d{4}-\d{2}-\d{2})/)?.[1] || '';
        const dateTs = dateText ? Date.parse(`${dateText}T00:00:00`) : 0;
        if (Number.isFinite(dateTs) && dateTs > 0) return dateTs;
        if (typeof window.getExamSortTimestamp === 'function') {
            const ts = window.getExamSortTimestamp(exam?.id || exam?.examId || exam?.examFullKey || '', Number(exam?.updatedAt || exam?.createdAt || 0));
            if (Number.isFinite(ts) && ts > 0) return ts;
        }
        return Number(exam?.updatedAt || exam?.createdAt || 0);
    }

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

    let PROGRESS_CACHE = [];
    let MANUAL_ID_MAPPINGS = {};
    let VA_VIEW_MODE = 'school';
    let trendChartInstance = window.trendChartInstance || null;
    let sankeyChartInstance = window.sankeyChartInstance || null;
    let progressChartVendorPromise = null;
    let PROGRESS_VISUAL_RENDER_FRAME = 0;
    let PROGRESS_VISUAL_RENDER_TOKEN = 0;
    const ProgressBaselineExamPerfCache = {
        signature: '',
        list: []
    };
    const ProgressCompareSelectPerfCache = {
        schoolSignature: '',
        schoolOptionsHtml: '',
        examSignature: '',
        examOptionsHtml: ''
    };

    function syncLocalProgressState(patch = {}) {
        const snapshot = syncProgressState
            ? syncProgressState(patch)
            : {
                progressCache: Array.isArray(patch.progressCache) ? patch.progressCache : readProgressCacheState(),
                progressCacheFull: Array.isArray(patch.progressCacheFull) ? patch.progressCacheFull : readProgressCacheFullState(),
                manualIdMappings: patch.manualIdMappings && typeof patch.manualIdMappings === 'object' ? patch.manualIdMappings : readManualIdMappingsState(),
                lastVaData: Array.isArray(patch.lastVaData) ? patch.lastVaData : readLastVaDataState(),
                vaViewMode: String(patch.vaViewMode || readProgressViewModeState()).trim() === 'class' ? 'class' : 'school',
                quickMode: ['all', 'my_class', 'focus'].includes(String(patch.quickMode || readProgressQuickModeState()).trim())
                    ? String(patch.quickMode || readProgressQuickModeState()).trim()
                    : 'all'
            };
        PROGRESS_CACHE = Array.isArray(snapshot.progressCache) ? snapshot.progressCache : [];
        MANUAL_ID_MAPPINGS = snapshot.manualIdMappings && typeof snapshot.manualIdMappings === 'object' ? snapshot.manualIdMappings : {};
        VA_VIEW_MODE = String(snapshot.vaViewMode || 'school').trim() === 'class' ? 'class' : 'school';
        return snapshot;
    }

    syncLocalProgressState({
        progressCache: readProgressCacheState(),
        progressCacheFull: readProgressCacheFullState(),
        manualIdMappings: readManualIdMappingsState(),
        lastVaData: readLastVaDataState(),
        vaViewMode: readProgressViewModeState(),
        quickMode: readProgressQuickModeState()
    });

function progressEscapeHtml(value) {
    if (typeof window.tmEscapeHtml === 'function') return window.tmEscapeHtml(value);
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function setProgressSelectOptionsIfChanged(select, html, signature) {
    if (!select) return;
    const nextSignature = String(signature || html || '');
    if (select.dataset.progressOptionsSig === nextSignature) return;
    select.innerHTML = html;
    select.dataset.progressOptionsSig = nextSignature;
}

function progressNormalizeSchoolName(value) {
    return String(value || '').trim();
}

function progressGetCurrentSchoolName() {
    return progressNormalizeSchoolName(
        window.MY_SCHOOL
        || (typeof MY_SCHOOL !== 'undefined' ? MY_SCHOOL : '')
        || (window.localStorage && typeof window.localStorage.getItem === 'function' ? window.localStorage.getItem('MY_SCHOOL') : '')
    );
}

function progressSameSchoolName(left, right) {
    const leftName = progressNormalizeSchoolName(left);
    const rightName = progressNormalizeSchoolName(right);
    if (!leftName || !rightName) return false;
    if (window.PermissionPolicy && typeof window.PermissionPolicy.sameSchoolName === 'function') {
        return window.PermissionPolicy.sameSchoolName(leftName, rightName);
    }
    if (typeof window.areSchoolNamesEquivalent === 'function') {
        return window.areSchoolNamesEquivalent(leftName, rightName);
    }
    if (typeof areSchoolNamesEquivalent === 'function') return areSchoolNamesEquivalent(leftName, rightName);
    return leftName === rightName;
}

function progressResolveSchoolOption(schoolList, preferredSchool) {
    const preferred = progressNormalizeSchoolName(preferredSchool);
    const list = (schoolList || []).map(progressNormalizeSchoolName).filter(Boolean);
    if (!preferred || !list.length) return '';
    if (list.includes(preferred)) return preferred;
    return list.find((school) => progressSameSchoolName(school, preferred)) || '';
}

function progressGetSchoolRecord(schoolName) {
    if (typeof window.getAppSchoolRecord === 'function') return window.getAppSchoolRecord(schoolName);
    const schoolMap = SCHOOLS || {};
    const key = progressResolveSchoolOption(Object.keys(schoolMap), schoolName);
    return key ? schoolMap[key] : null;
}

function updateProgressSchoolSelect() {
    const sel = document.getElementById('progressSchoolSelect');
    if (!sel) return;
    const user = getCurrentUser();
    const availableSchools = (typeof window.listAvailableSchoolsForCompare === 'function')
        ? window.listAvailableSchoolsForCompare('all')
        : Object.keys(SCHOOLS || {});
    const schools = PermissionPolicy.getAccessibleSchoolNames(user, availableSchools);
    const optionsHtml = '<option value="">--请选择本校--</option>'
        + schools.map((school) => {
            const safeSchool = progressEscapeHtml(school);
            return `<option value="${safeSchool}">${safeSchool}</option>`;
        }).join('');
    setProgressSelectOptionsIfChanged(sel, optionsHtml, `progress-school:${schools.join('|')}`);

    const role = user?.role || 'guest';
    const previousSchool = progressResolveSchoolOption(schools, sel.value);
    const currentSchool = progressResolveSchoolOption(schools, progressGetCurrentSchoolName());
    if (role === 'teacher' || role === 'class_teacher' || role === 'director' || role === 'grade_director') {
        const school = progressResolveSchoolOption(schools, PermissionPolicy.getBoundSchool(user));
        if (school) {
            sel.value = school;
            sel.disabled = true;
        }
    } else {
        sel.disabled = false;
        if (previousSchool) sel.value = previousSchool;
        else if (currentSchool) sel.value = currentSchool;
    }

    requestAnimationFrame(() => {
        const active = document.getElementById('progress-analysis');
        if (active && active.classList.contains('active') && typeof enforceSectionIsolation === 'function') {
            enforceSectionIsolation('progress-analysis');
        }
    });
}

function getProgressBaselineExamList() {
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const exams = db?.exams || {};
    const signature = Object.entries(exams)
        .map(([key, exam]) => [
            key,
            String(exam?.examId || ''),
            String(exam?.examFullKey || ''),
            Number(exam?.createdAt || 0),
            Number(exam?.updatedAt || 0),
            Array.isArray(exam?.data) ? exam.data.length : 0
        ].join(':'))
        .sort()
        .join('|');
    if (ProgressBaselineExamPerfCache.signature === signature) {
        return ProgressBaselineExamPerfCache.list;
    }
    const list = Object.values(exams)
        .map((exam) => ({
            id: String(exam?.examId || '').trim(),
            examId: String(exam?.examId || '').trim(),
            examFullKey: String(exam?.examFullKey || exam?.examId || '').trim(),
            meta: exam?.meta || {},
            createdAt: Number(exam?.createdAt || exam?.updatedAt || 0),
            updatedAt: Number(exam?.updatedAt || 0),
            data: Array.isArray(exam?.data) ? exam.data : []
        }))
        .filter((exam) => exam.id && exam.data.length > 0)
        .sort((a, b) => getProgressExamDateSortTimestamp(a) - getProgressExamDateSortTimestamp(b));
    ProgressBaselineExamPerfCache.signature = signature;
    ProgressBaselineExamPerfCache.list = list;
    return list;
}

function isProgressBaselineCandidate(exam) {
    const examId = String(exam?.examFullKey || exam?.examId || exam?.id || '').trim();
    if (!examId || (CURRENT_EXAM_ID && isExamKeyEquivalentForCompare(examId, CURRENT_EXAM_ID))) return false;
    // CohortDB is already scoped to the active cohort. In 6-8 mode the mode
    // name is not part of a real exam key, so filtering by it hides valid
    // prior-grade exams and leaves value-added analysis without a baseline.
    return true;
}

function pickDefaultProgressBaselineExamId(examList) {
    const list = Array.isArray(examList) ? examList : [];
    const historicalList = list.filter(isProgressBaselineCandidate);
    if (!historicalList.length) return '';
    if (CURRENT_EXAM_ID) {
        const currentIndex = list.findIndex((exam) => isExamKeyEquivalentForCompare(exam.id, CURRENT_EXAM_ID));
        for (let index = currentIndex - 1; index >= 0; index -= 1) {
            if (isProgressBaselineCandidate(list[index])) return list[index].id;
        }
    }
    return historicalList[historicalList.length - 1].id;
}

function normalizeProgressBaselineRows(rows, examId = '') {
    const normalized = (rows || []).map((row) => {
        const student = row?.student || {};
        const total = Number(
            row?.total ??
            row?.totalScore ??
            row?.score ??
            student?.total ??
            student?.totalScore ??
            NaN
        );
        const rankValue = Number(
            row?.rank ??
            row?.townRank ??
            row?.prevRank ??
            row?.ranks?.total?.township ??
            student?.ranks?.total?.township ??
            NaN
        );
        return {
            name: row?.name || student?.name || '',
            school: row?.school || student?.school || '',
            class: normalizeClass(row?.class || student?.class || ''),
            total,
            rank: Number.isFinite(rankValue) && rankValue > 0 ? rankValue : null,
            examId: examId || row?.examId || row?.examFullKey || row?._sourceExam || ''
        };
    }).filter((item) => item.name && Number.isFinite(item.total));

    if (!normalized.length) return [];
    const needsRank = normalized.some((item) => !Number.isFinite(item.rank) || item.rank <= 0);
    if (needsRank) {
        const ranked = normalized.slice().sort((a, b) => (b.total || 0) - (a.total || 0));
        let lastRank = 0;
        let lastTotal = null;
        ranked.forEach((item, index) => {
            if (index > 0 && lastTotal !== null && Math.abs((item.total || 0) - lastTotal) < 0.001) {
                item.rank = lastRank;
            } else {
                item.rank = index + 1;
                lastRank = item.rank;
            }
            lastTotal = item.total || 0;
        });
    }
    return normalized;
}

function updateProgressBaselineSelect() {
    const sel = document.getElementById('progressBaselineSelect');
    if (!sel) return;
    const currentValue = sel.value || '';
    const examList = getProgressBaselineExamList();
    const baselineList = examList.filter(isProgressBaselineCandidate);

    const optionsHtml = '<option value="">--请选择历史考试--</option>'
        + baselineList.map((exam) => {
            const safeId = progressEscapeHtml(exam.id);
            return `<option value="${safeId}">${safeId}</option>`;
        }).join('');
    setProgressSelectOptionsIfChanged(sel, optionsHtml, `progress-baseline:${baselineList.map((exam) => exam.id).join('|')}`);

    const preferredId = baselineList.some((exam) => exam.id === currentValue)
        ? currentValue
        : pickDefaultProgressBaselineExamId(examList);
    if (preferredId) sel.value = preferredId;

    sel.onchange = () => {
        syncLocalProgressState({ progressCache: [], progressCacheFull: [], lastVaData: [] });
        window.__PROGRESS_BASELINE_ACTIVE_ID = '';
        Promise.resolve(ensureProgressBaselineData({
            allowCloudSync: false,
            rerenderReport: true,
            rerenderAnalysis: true
        })).catch((err) => {
            console.warn('[progress] baseline switch failed:', err);
            setProgressBaselineStatus('❌ 切换历史基准失败，请稍后重试', 'error');
        });
    };
}

function getBaselineDataFromExam(examId) {
    if (!examId) return [];
    const exam = getProgressBaselineExamList().find((item) => (
        isExamKeyEquivalentForCompare(item.id, examId) ||
        isExamKeyEquivalentForCompare(item.examFullKey, examId)
    ));
    if (!exam || !Array.isArray(exam.data) || exam.data.length === 0) return [];
    return normalizeProgressBaselineRows(exam.data, exam.examFullKey || exam.id || examId);
}

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
        (selects || []).forEach((sel) => {
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
            fetchOptions: { latestOnly: false, maxFetch: 2, minCount: 2, background: true },
            refreshBaseline: true
        });
    }
    : function trySyncCompareExamOptions() {
        const cohortId = CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID');
        if (!cohortId || !window.CloudManager || typeof window.CloudManager.fetchCohortExamsToLocal !== 'function') return false;
        const state = ensureCompareExamSyncStateEntry(cohortId);
        if (state.pending) return true;
        if (Date.now() - Number(state.lastAttempt || 0) < 5000) return false;
        state.pending = true;
        state.lastAttempt = Date.now();
        Promise.resolve(window.CloudManager.fetchCohortExamsToLocal(cohortId, { latestOnly: false, maxFetch: 2, minCount: 2, background: true }))
            .catch((err) => {
                console.warn('[compare-sync] fetchCohortExamsToLocal failed:', err);
            })
            .finally(() => {
                state.pending = false;
                setTimeout(() => {
                    refreshCompareExamSelectors();
                    if (typeof updateProgressBaselineSelect === 'function') updateProgressBaselineSelect();
                }, 0);
            });
        return true;
    };

function setProgressBaselineStatus(message, tone = 'info') {
    const statusEl = document.getElementById('va-data-status');
    if (!statusEl) return;
    const palette = {
        success: { color: '#16a34a', weight: 'bold' },
        error: { color: '#dc2626', weight: 'bold' },
        loading: { color: '#2563eb', weight: 'bold' },
        info: { color: '#475569', weight: 'normal' }
    };
    const style = palette[tone] || palette.info;
    statusEl.innerHTML = message;
    statusEl.style.color = style.color;
    statusEl.style.fontWeight = style.weight;
}

function scheduleProgressArchiveExamSync(cohortId) {
    const cid = String(cohortId || '').trim();
    if (!cid || !window.CloudManager || typeof window.CloudManager.fetchCohortExamsToLocal !== 'function') return;
    if (!window.__PROGRESS_ARCHIVE_SYNC_STATE) window.__PROGRESS_ARCHIVE_SYNC_STATE = {};
    const state = window.__PROGRESS_ARCHIVE_SYNC_STATE[cid] || { pending: false };
    window.__PROGRESS_ARCHIVE_SYNC_STATE[cid] = state;
    if (state.pending) return;
    state.pending = true;

    const task = async () => {
        try {
            await window.CloudManager.fetchCohortExamsToLocal(cid, {
                latestOnly: false,
                maxFetch: 0,
                minCount: 4,
                background: true
            });
            if (typeof updateProgressBaselineSelect === 'function') updateProgressBaselineSelect();
            if (typeof refreshCompareExamSelectors === 'function') refreshCompareExamSelectors();
        } catch (err) {
            console.warn('[progress-sync] background archive fetch failed:', err);
        } finally {
            state.pending = false;
        }
    };
    if (window.SystemPerformance && typeof window.SystemPerformance.scheduleTask === 'function') {
        window.SystemPerformance.scheduleTask(`progress-history-archive:${cid}`, task, {
            delay: 900,
            idle: true,
            timeout: 6000
        });
        return;
    }
    window.setTimeout(task, 900);
}

function syncProgressBaselineExamOptions() {
    const cohortId = CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID');
    if (!cohortId || !window.CloudManager || typeof window.CloudManager.fetchCohortExamsToLocal !== 'function') {
        return Promise.resolve(false);
    }
    if (!window.__PROGRESS_BASELINE_SYNC_STATE) window.__PROGRESS_BASELINE_SYNC_STATE = {};
    const state = window.__PROGRESS_BASELINE_SYNC_STATE[cohortId] || { pending: false, lastAttempt: 0, promise: null };
    window.__PROGRESS_BASELINE_SYNC_STATE[cohortId] = state;
    if (state.pending && state.promise) return state.promise;
    if (Date.now() - Number(state.lastAttempt || 0) < 5000) return Promise.resolve(false);

    state.pending = true;
    state.lastAttempt = Date.now();
    state.promise = Promise.resolve(window.CloudManager.fetchCohortExamsToLocal(cohortId, { latestOnly: false, maxFetch: 2, minCount: 2, background: false }))
        .then(() => {
            if (typeof updateProgressBaselineSelect === 'function') updateProgressBaselineSelect();
            if (typeof refreshCompareExamSelectors === 'function') refreshCompareExamSelectors();
            scheduleProgressArchiveExamSync(cohortId);
            return true;
        })
        .catch((err) => {
            console.warn('[progress-sync] fetchCohortExamsToLocal failed:', err);
            return false;
        })
        .finally(() => {
            state.pending = false;
            state.promise = null;
        });
    return state.promise;
}

function ensureProgressBaselineData(options = {}) {
    const pending = window.__PROGRESS_BASELINE_LOADING_PROMISE;
    if (pending && typeof pending.then === 'function') return pending;

    const task = resolveProgressBaselineData(options);
    const trackedTask = task.finally(() => {
        if (window.__PROGRESS_BASELINE_LOADING_PROMISE === trackedTask) {
            window.__PROGRESS_BASELINE_LOADING_PROMISE = null;
        }
        window.__PROGRESS_BASELINE_LOADING = false;
    });
    window.__PROGRESS_BASELINE_LOADING_PROMISE = trackedTask;
    return trackedTask;
}

async function resolveProgressBaselineData(options = {}) {
    const {
        allowCloudSync = false,
        rerenderReport = true,
        rerenderAnalysis = true
    } = options;
    window.__PROGRESS_BASELINE_LOADING = true;

    const baselineSel = document.getElementById('progressBaselineSelect');
    const progressSchoolSel = document.getElementById('progressSchoolSelect');
    let baselineId = baselineSel?.value || '';
    const hasHistoricalBaseline = getProgressBaselineExamList().some(isProgressBaselineCandidate);
    if (allowCloudSync && !hasHistoricalBaseline) {
        setProgressBaselineStatus('⏳ 正在补齐本届历史考试...', 'loading');
        const synced = await syncProgressBaselineExamOptions();
        if (synced) {
            updateProgressBaselineSelect();
            baselineId = baselineSel?.value || pickDefaultProgressBaselineExamId(getProgressBaselineExamList());
        }
    }
    if (!baselineId) {
        const examList = getProgressBaselineExamList();
        baselineId = pickDefaultProgressBaselineExamId(examList);
        if (baselineSel && baselineId) baselineSel.value = baselineId;
    }

    let baselineData = baselineId
        ? getBaselineDataFromExam(baselineId)
        : normalizeProgressBaselineRows(PREV_DATA || window.PREV_DATA || []);

    if (!baselineData.length) {
        const fallbackId = pickDefaultProgressBaselineExamId(getProgressBaselineExamList());
        if (fallbackId) {
            baselineId = fallbackId;
            if (baselineSel) baselineSel.value = fallbackId;
            baselineData = getBaselineDataFromExam(fallbackId);
        }
    }

    if (!baselineData.length && allowCloudSync) {
        setProgressBaselineStatus('⏳ 正在自动加载上次考试数据...', 'loading');
        const synced = await syncProgressBaselineExamOptions();
        if (synced) {
            const fallbackId = baselineSel?.value || pickDefaultProgressBaselineExamId(getProgressBaselineExamList());
            if (fallbackId) {
                baselineId = fallbackId;
                if (baselineSel) baselineSel.value = fallbackId;
                baselineData = getBaselineDataFromExam(fallbackId);
            }
        }
    }

    if (!baselineData.length) {
        setProgressBaselineStatus('❌ 未找到可用上次考试数据，请先同步当前届别考试或导入历史成绩', 'error');
        return [];
    }

    const baselineKey = `${baselineId}:${baselineData.length}:${window.__RAW_DATA_VERSION || 0}`;
    const baselineChanged = String(window.__PROGRESS_BASELINE_ACTIVE_KEY || '') !== baselineKey;
    if (baselineChanged) syncLocalProgressState({ progressCache: [], progressCacheFull: [], lastVaData: [] });
    window.__PROGRESS_BASELINE_ACTIVE_ID = baselineId || '';
    window.__PROGRESS_BASELINE_ACTIVE_KEY = baselineKey;
    PREV_DATA = baselineData;
    window.PREV_DATA = baselineData;
    setProgressBaselineStatus(`✅ 已自动加载上次考试数据（${baselineData.length} 条）${baselineId ? `：${baselineId}` : ''}`, 'success');

    const cacheReady = readProgressCacheFullState().length > 0;
    if (!baselineChanged && cacheReady) return baselineData;

    try {
        const shouldRenderAnalysis = rerenderAnalysis
            && !!progressSchoolSel?.value
            && typeof renderProgressAnalysis === 'function';
        if (shouldRenderAnalysis) {
            renderProgressAnalysis();
        } else {
            if (!cacheReady && typeof performSilentMatching === 'function') performSilentMatching();
            if (rerenderReport && typeof renderValueAddedReport === 'function') renderValueAddedReport(true);
        }
    } catch (renderErr) {
        console.warn('[progress] baseline loaded but rerender failed:', renderErr);
        setProgressBaselineStatus(`⚠️ 已加载上次考试数据（${baselineData.length} 条），但页面刷新失败，请稍后重试`, 'error');
    }
    return baselineData;
}

function updateProgressMultiExamSelects() {
    const schoolSel = document.getElementById('progressCompareSchool');
    const exam1Sel = document.getElementById('progressCompareExam1');
    const exam2Sel = document.getElementById('progressCompareExam2');
    const exam3Sel = document.getElementById('progressCompareExam3');
    if (!schoolSel || !exam1Sel || !exam2Sel || !exam3Sel) return;

    const schoolList = (typeof listAvailableSchoolsForCompare === 'function')
        ? listAvailableSchoolsForCompare('all')
        : Object.keys(SCHOOLS || {});
    const previousSchool = schoolSel.value || '';
    const schoolSignature = `progress-compare-schools:${schoolList.join('|')}`;
    if (ProgressCompareSelectPerfCache.schoolSignature !== schoolSignature) {
        ProgressCompareSelectPerfCache.schoolSignature = schoolSignature;
        ProgressCompareSelectPerfCache.schoolOptionsHtml = '<option value="">--请选择学校--</option>'
            + schoolList.map((school) => {
                const safeSchool = progressEscapeHtml(school);
                return `<option value="${safeSchool}">${safeSchool}</option>`;
            }).join('');
    }
    setProgressSelectOptionsIfChanged(schoolSel, ProgressCompareSelectPerfCache.schoolOptionsHtml, schoolSignature);
    const currentSchool = progressResolveSchoolOption(schoolList, progressGetCurrentSchoolName());
    const previousSchoolMatch = progressResolveSchoolOption(schoolList, previousSchool);
    if (currentSchool) schoolSel.value = currentSchool;
    else if (previousSchoolMatch) schoolSel.value = previousSchoolMatch;

    const examList = getProgressBaselineExamList().map((exam) => ({
        id: exam.id,
        createdAt: exam.createdAt || 0,
        meta: exam.meta || {},
        updatedAt: exam.updatedAt || 0,
        label: exam.id
    }));
    if (CURRENT_EXAM_ID && !examList.some((exam) => exam.id === CURRENT_EXAM_ID)) {
        examList.push({ id: CURRENT_EXAM_ID, createdAt: Date.now(), label: `${CURRENT_EXAM_ID} (当前)` });
    }
    examList.sort((a, b) => getProgressExamDateSortTimestamp(a) - getProgressExamDateSortTimestamp(b));

    if (examList.length < 2) {
        const syncing = trySyncCompareExamOptions();
        if (syncing) {
            setCompareExamSelectPlaceholders([exam1Sel, exam2Sel, exam3Sel], '正在同步云端考试期数...');
            return;
        }
        const msg = '<option value="">--考试数量不足(至少2次)--</option>';
        setProgressSelectOptionsIfChanged(exam1Sel, msg, 'progress-compare-exams:insufficient');
        setProgressSelectOptionsIfChanged(exam2Sel, msg, 'progress-compare-exams:insufficient');
        setProgressSelectOptionsIfChanged(exam3Sel, msg, 'progress-compare-exams:insufficient');
        return;
    }

    const examSignature = `progress-compare-exams:${examList.map((exam) => `${exam.id}:${exam.label}`).join('|')}`;
    if (ProgressCompareSelectPerfCache.examSignature !== examSignature) {
        ProgressCompareSelectPerfCache.examSignature = examSignature;
        ProgressCompareSelectPerfCache.examOptionsHtml = examList.map((exam) => {
            const safeId = progressEscapeHtml(exam.id);
            const safeLabel = progressEscapeHtml(exam.label);
            return `<option value="${safeId}">${safeLabel}</option>`;
        }).join('');
    }
    setProgressSelectOptionsIfChanged(exam1Sel, ProgressCompareSelectPerfCache.examOptionsHtml, examSignature);
    setProgressSelectOptionsIfChanged(exam2Sel, ProgressCompareSelectPerfCache.examOptionsHtml, examSignature);
    setProgressSelectOptionsIfChanged(exam3Sel, ProgressCompareSelectPerfCache.examOptionsHtml, examSignature);

    const currentIndex = (CURRENT_EXAM_ID && examList.some((exam) => exam.id === CURRENT_EXAM_ID))
        ? examList.findIndex((exam) => exam.id === CURRENT_EXAM_ID)
        : examList.length - 1;
    const prevIndex = Math.max(0, currentIndex - 1);
    const prev2Index = Math.max(0, currentIndex - 2);

    exam1Sel.value = examList[prevIndex].id;
    exam2Sel.value = examList[currentIndex].id;
    exam3Sel.value = examList[currentIndex].id;
    if (examList.length >= 3) {
        exam1Sel.value = examList[prev2Index].id;
        exam2Sel.value = examList[prevIndex].id;
        exam3Sel.value = examList[currentIndex].id;
    }

    onProgressComparePeriodCountChange();
}

function setProgressMultiPeriodHint(message, tone = 'info') {
    const hintEl = document.getElementById('multiPeriodCompareHint');
    if (!hintEl) return;
    const palette = {
        success: '#16a34a',
        error: '#dc2626',
        loading: '#2563eb',
        info: '#475569'
    };
    hintEl.innerHTML = message;
    hintEl.style.color = palette[tone] || palette.info;
    hintEl.style.fontWeight = tone === 'success' || tone === 'error' || tone === 'loading' ? '700' : '400';
}

function getProgressMultiPeriodCache() {
    if (typeof window.readMultiPeriodCompareCacheState === 'function') {
        return window.readMultiPeriodCompareCacheState();
    }
    return window.MULTI_PERIOD_COMPARE_CACHE && typeof window.MULTI_PERIOD_COMPARE_CACHE === 'object'
        ? window.MULTI_PERIOD_COMPARE_CACHE
        : null;
}

function setProgressMultiPeriodCache(cache) {
    if (typeof window.setMultiPeriodCompareCacheState === 'function') {
        return window.setMultiPeriodCompareCacheState(cache);
    }
    window.MULTI_PERIOD_COMPARE_CACHE = cache && typeof cache === 'object' ? cache : null;
    return window.MULTI_PERIOD_COMPARE_CACHE;
}

function getProgressMultiPeriodConfig() {
    const countEl = document.getElementById('progressComparePeriodCount');
    const schoolEl = document.getElementById('progressCompareSchool');
    const exam1El = document.getElementById('progressCompareExam1');
    const exam2El = document.getElementById('progressCompareExam2');
    const exam3El = document.getElementById('progressCompareExam3');
    const periodCount = parseInt(countEl?.value || '2', 10) === 3 ? 3 : 2;
    const examIds = periodCount === 3
        ? [exam1El?.value || '', exam2El?.value || '', exam3El?.value || '']
        : [exam1El?.value || '', exam2El?.value || ''];

    return {
        periodCount,
        school: String(schoolEl?.value || '').trim(),
        examIds: examIds.map(id => String(id || '').trim())
    };
}

function getProgressCompareTotal(row, totalSubjects) {
    if (!row) return null;
    if (typeof getComparisonTotalValue === 'function') {
        const value = Number(getComparisonTotalValue(row, totalSubjects));
        if (Number.isFinite(value)) return value;
    }
    const fallback = Number(row.total);
    return Number.isFinite(fallback) ? fallback : null;
}

function getProgressCompareClassKey(value) {
    const text = String(value || '').trim();
    if (typeof normalizeClass === 'function') return normalizeClass(text);
    return text.replace(/\s+/g, '');
}

function filterProgressCompareRowsForUser(rows) {
    const list = Array.isArray(rows) ? rows.slice() : [];
    try {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
        if (window.PermissionPolicy && typeof PermissionPolicy.filterStudentRows === 'function') {
            const mode = PermissionPolicy.isClassTeacher && PermissionPolicy.isClassTeacher(user)
                ? 'homeroom'
                : 'teaching';
            return PermissionPolicy.filterStudentRows(user, list, { mode });
        }
    } catch (error) {
        console.warn('[progress-compare] permission filter failed:', error);
    }
    return list;
}

function filterProgressCompareRowsToTownshipScope(rows) {
    const list = Array.isArray(rows) ? rows : [];
    if (!list.length) return [];
    if (typeof filterRowsToTownshipSchools === 'function') {
        const townshipRows = filterRowsToTownshipSchools(list);
        if (townshipRows.length) return townshipRows;
    }
    if (typeof listAvailableSchoolsForCompare === 'function'
        && typeof getMatchedSchoolNamesFromCollection === 'function') {
        const townshipSchools = listAvailableSchoolsForCompare();
        const matchedNames = new Set();
        townshipSchools.forEach((school) => {
            getMatchedSchoolNamesFromCollection(list.map(row => row?.school), school)
                .forEach(name => matchedNames.add(String(name || '').trim()));
        });
        const scopedRows = list.filter(row => matchedNames.has(String(row?.school || '').trim()));
        if (scopedRows.length) return scopedRows;
    }
    return list;
}

function buildProgressMultiPeriodRows(config) {
    if (typeof getExamRowsForCompare !== 'function' || typeof filterRowsBySchool !== 'function') {
        throw new Error('多期对比基础数据模块未就绪，请刷新页面后重试');
    }
    if (typeof buildCompetitionRankMap !== 'function') {
        throw new Error('排名计算模块未就绪，请刷新页面后重试');
    }

    const totalSubjects = typeof getComparisonTotalSubjects === 'function'
        ? getComparisonTotalSubjects()
        : [];
    const cleanName = typeof getProgressCleanName === 'function'
        ? getProgressCleanName
        : (name => String(name || '').replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').toLowerCase());
    const totalOf = row => {
        const total = getProgressCompareTotal(row, totalSubjects);
        return Number.isFinite(total) ? total : Number.NEGATIVE_INFINITY;
    };

    const examDataList = config.examIds.map((examId) => {
        const allRows = getExamRowsForCompare(examId);
        const townshipRows = filterProgressCompareRowsToTownshipScope(allRows);
        const schoolRows = filterProgressCompareRowsForUser(filterRowsBySchool(allRows, config.school));
        if (!schoolRows.length) {
            throw new Error(`在「${examId}」中找不到「${config.school}」的可对比学生数据`);
        }
        const schoolRowsByKey = new Map();
        schoolRows.forEach((row) => {
            const key = cleanName(row?.name);
            // Preserve first-row behavior for duplicate normalized names.
            if (key && !schoolRowsByKey.has(key)) schoolRowsByKey.set(key, row);
        });
        const rankTownMap = buildCompetitionRankMap(townshipRows, row => cleanName(row?.name), totalOf);
        const rankSchoolMap = buildCompetitionRankMap(schoolRows, row => cleanName(row?.name), totalOf);
        return { examId, allRows, townshipRows, schoolRows, schoolRowsByKey, rankTownMap, rankSchoolMap };
    });

    const studentKeys = new Set();
    examDataList.forEach(({ schoolRows }) => {
        schoolRows.forEach((row) => {
            const key = cleanName(row?.name);
            if (key) studentKeys.add(key);
        });
    });

    const rows = Array.from(studentKeys).map((key) => {
        let displayName = key;
        let displayClass = '';
        const periods = examDataList.map(({ examId, schoolRowsByKey, rankTownMap, rankSchoolMap }) => {
            const row = schoolRowsByKey.get(key) || null;
            if (row) {
                displayName = row.name || displayName;
                displayClass = row.class || displayClass;
            }
            const total = getProgressCompareTotal(row, totalSubjects);
            return {
                examId,
                total,
                rankSchool: row ? (rankSchoolMap.get(key) ?? null) : null,
                rankTown: row ? (rankTownMap.get(key) ?? null) : null,
                row
            };
        });
        const first = periods[0] || {};
        const last = periods[periods.length - 1] || {};
        const scoreDiff = Number.isFinite(first.total) && Number.isFinite(last.total)
            ? last.total - first.total
            : null;
        const rankSchoolDiff = Number.isFinite(first.rankSchool) && Number.isFinite(last.rankSchool)
            ? first.rankSchool - last.rankSchool
            : null;
        const rankTownDiff = Number.isFinite(first.rankTown) && Number.isFinite(last.rankTown)
            ? first.rankTown - last.rankTown
            : null;
        const mainRankDiff = Number.isFinite(rankTownDiff) ? rankTownDiff : rankSchoolDiff;
        const status = Number.isFinite(mainRankDiff)
            ? (mainRankDiff > 0 ? '进步' : (mainRankDiff < 0 ? '退步' : '稳定'))
            : (Number.isFinite(scoreDiff) ? (scoreDiff > 0 ? '进步' : (scoreDiff < 0 ? '退步' : '稳定')) : '缺少数据');

        return {
            key,
            name: displayName,
            class: displayClass,
            periods,
            scoreDiff,
            rankSchoolDiff,
            rankTownDiff,
            status
        };
    });

    rows.sort((a, b) => {
        const rankDiff = (Number.isFinite(b.rankTownDiff) ? b.rankTownDiff : -99999)
            - (Number.isFinite(a.rankTownDiff) ? a.rankTownDiff : -99999);
        if (rankDiff !== 0) return rankDiff;
        const schoolDiff = (Number.isFinite(b.rankSchoolDiff) ? b.rankSchoolDiff : -99999)
            - (Number.isFinite(a.rankSchoolDiff) ? a.rankSchoolDiff : -99999);
        if (schoolDiff !== 0) return schoolDiff;
        const classDiff = getProgressCompareClassKey(a.class).localeCompare(getProgressCompareClassKey(b.class), 'zh-CN', { numeric: true });
        if (classDiff !== 0) return classDiff;
        return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN', { numeric: true });
    });

    return { rows, totalSubjects };
}

function formatProgressCompareValue(value, digits = 1) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '-';
    return number.toFixed(digits);
}

function formatProgressCompareRank(value) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) return '-';
    return String(number);
}

function formatProgressCompareDiff(value, digits = 1) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '<span style="color:#94a3b8;">-</span>';
    const color = number > 0 ? '#16a34a' : (number < 0 ? '#dc2626' : '#64748b');
    const sign = number > 0 ? '+' : '';
    const text = Number.isInteger(number) ? `${sign}${number}` : `${sign}${number.toFixed(digits)}`;
    return `<span style="font-weight:700; color:${color};">${text}</span>`;
}

function canUseProgressMultiPeriodCompare() {
    const user = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : (window.Auth?.currentUser || null);
    const role = String(user?.role || '').trim();
    return role === 'admin' || role === 'director' || role === 'grade_director';
}

function renderMultiPeriodComparison() {
    if (!canUseProgressMultiPeriodCompare()) return false;
    const resultEl = document.getElementById('multiPeriodCompareResult');
    const config = getProgressMultiPeriodConfig();
    if (!resultEl) return false;
    setProgressMultiPeriodCache(null);

    if (!config.school) {
        setProgressMultiPeriodHint('❌ 请先选择对比学校。', 'error');
        resultEl.innerHTML = '<div class="analysis-empty-state analysis-empty-state-compact">请选择学校后再生成。</div>';
        return false;
    }
    if (config.examIds.some(id => !id)) {
        setProgressMultiPeriodHint('❌ 请完整选择所有考试期次。', 'error');
        resultEl.innerHTML = '<div class="analysis-empty-state analysis-empty-state-compact">请选择完整期次后再生成。</div>';
        return false;
    }
    if (new Set(config.examIds).size !== config.examIds.length) {
        setProgressMultiPeriodHint('❌ 期次不能重复，请选择不同考试。', 'error');
        resultEl.innerHTML = '<div class="analysis-empty-state analysis-empty-state-compact">期次重复，无法生成对比。</div>';
        return false;
    }

    setProgressMultiPeriodHint('⏳ 正在生成多期对比，请稍候...', 'loading');

    try {
        const { rows, totalSubjects } = buildProgressMultiPeriodRows(config);
        if (!rows.length) {
            setProgressMultiPeriodHint('⚠️ 当前条件下没有可对比学生。', 'error');
            resultEl.innerHTML = '<div class="analysis-empty-state analysis-empty-state-compact">没有找到可对比学生。</div>';
            return false;
        }

        const improved = rows.filter(row => row.status === '进步').length;
        const declined = rows.filter(row => row.status === '退步').length;
        const stable = rows.filter(row => row.status === '稳定').length;
        const visibleRows = rows.slice(0, 120);
        const periodHeaders = config.examIds.map(examId => `
            <th>${progressEscapeHtml(examId)}总分</th>
            <th>${progressEscapeHtml(examId)}校排</th>
            <th>${progressEscapeHtml(examId)}镇排</th>
        `).join('');
        const bodyHtml = visibleRows.map(row => {
            const periodCells = row.periods.map(period => `
                <td>${formatProgressCompareValue(period.total)}</td>
                <td>${formatProgressCompareRank(period.rankSchool)}</td>
                <td>${formatProgressCompareRank(period.rankTown)}</td>
            `).join('');
            const statusColor = row.status === '进步' ? '#16a34a' : (row.status === '退步' ? '#dc2626' : '#64748b');
            return `
                <tr>
                    <td>${progressEscapeHtml(row.class || '-')}</td>
                    <td><strong>${progressEscapeHtml(row.name || '-')}</strong></td>
                    ${periodCells}
                    <td>${formatProgressCompareDiff(row.scoreDiff)}</td>
                    <td>${formatProgressCompareDiff(row.rankSchoolDiff, 0)}</td>
                    <td>${formatProgressCompareDiff(row.rankTownDiff, 0)}</td>
                    <td style="font-weight:700; color:${statusColor};">${progressEscapeHtml(row.status)}</td>
                </tr>
            `;
        }).join('');

        resultEl.innerHTML = `
            <div class="analysis-stat-grid" style="margin-bottom:12px;">
                <div class="stat-card"><span>对比学生</span><strong>${rows.length}</strong></div>
                <div class="stat-card"><span>进步</span><strong style="color:#16a34a;">${improved}</strong></div>
                <div class="stat-card"><span>退步</span><strong style="color:#dc2626;">${declined}</strong></div>
                <div class="stat-card"><span>稳定</span><strong style="color:#64748b;">${stable}</strong></div>
            </div>
            <div class="table-wrap" style="max-height:520px; overflow:auto;">
                <table class="mobile-card-table" style="font-size:12px;">
                    <thead>
                        <tr>
                            <th>班级</th>
                            <th>姓名</th>
                            ${periodHeaders}
                            <th>总分变化</th>
                            <th>校排变化</th>
                            <th>镇排变化</th>
                            <th>状态</th>
                        </tr>
                    </thead>
                    <tbody>${bodyHtml}</tbody>
                </table>
            </div>
            ${rows.length > visibleRows.length ? `<div class="analysis-hint analysis-status-text" style="margin-top:8px;">页面展示前 ${visibleRows.length} 人，导出会包含全部 ${rows.length} 人。</div>` : ''}
        `;

        const cache = setProgressMultiPeriodCache({
            type: 'progress',
            school: config.school,
            examIds: config.examIds,
            periodCount: config.periodCount,
            totalSubjects,
            rows
        });
        setProgressMultiPeriodHint(`✅ 已生成 ${config.school} 的 ${rows.length} 名学生 ${config.periodCount} 期进退步对比。`, 'success');
        return cache;
    } catch (error) {
        const message = error && error.message ? error.message : '生成失败，请稍后重试。';
        const isMissingComparableData = message.includes('可对比学生数据');
        if (isMissingComparableData) {
            console.warn('[progress-compare] no comparable data:', message);
        } else {
            console.error('[progress-compare] render failed:', error);
        }
        setProgressMultiPeriodHint(`${isMissingComparableData ? '⚠️' : '❌'} ${message}`, isMissingComparableData ? 'warning' : 'error');
        resultEl.innerHTML = `<div class="analysis-empty-state analysis-empty-state-compact">${isMissingComparableData ? '当前学校在所选期次缺少可对比学生数据，请更换学校或期次。' : '生成失败，请检查学校和期次选择。'}</div>`;
        return false;
    }
}

async function exportMultiPeriodComparison() {
    if (!canUseProgressMultiPeriodCompare()) {
        if (typeof uiAlert === 'function') uiAlert('权限不足：多期对比仅管理员、教务主任、级部主任可用', 'error');
        else window.UI.alert('权限不足：多期对比仅管理员、教务主任、级部主任可用');
        return false;
    }
    let cache = getProgressMultiPeriodCache();
    if (!cache || cache.type !== 'progress' || !Array.isArray(cache.rows) || !cache.rows.length) {
        cache = renderMultiPeriodComparison();
    }
    if (!cache || cache.type !== 'progress' || !Array.isArray(cache.rows) || !cache.rows.length) return false;

    if ((!window.XLSX || !window.XLSX.utils) && typeof window.ensureXlsxVendorLoaded === 'function') {
        await window.ensureXlsxVendorLoaded();
    }
    if (!window.XLSX || !window.XLSX.utils) {
        if (typeof uiAlert === 'function') uiAlert('Excel 组件未加载，请刷新页面后重试', 'error');
        else window.UI.alert('Excel 组件未加载，请刷新页面后重试');
        return false;
    }

    const header = ['班级', '姓名'];
    cache.examIds.forEach((examId) => {
        header.push(`${examId}总分`, `${examId}校排`, `${examId}镇排`);
    });
    header.push('总分变化', '校排变化', '镇排变化', '状态');

    const data = [header];
    cache.rows.forEach((row) => {
        const line = [row.class || '-', row.name || '-'];
        row.periods.forEach((period) => {
            line.push(
                Number.isFinite(Number(period.total)) ? Number(period.total).toFixed(1) : '-',
                Number.isFinite(Number(period.rankSchool)) ? Number(period.rankSchool) : '-',
                Number.isFinite(Number(period.rankTown)) ? Number(period.rankTown) : '-'
            );
        });
        line.push(
            Number.isFinite(Number(row.scoreDiff)) ? Number(row.scoreDiff).toFixed(1) : '-',
            Number.isFinite(Number(row.rankSchoolDiff)) ? Number(row.rankSchoolDiff) : '-',
            Number.isFinite(Number(row.rankTownDiff)) ? Number(row.rankTownDiff) : '-',
            row.status || '-'
        );
        data.push(line);
    });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = header.map((title, index) => ({ wch: index < 2 ? 12 : Math.max(10, String(title).length + 2) }));
    XLSX.utils.book_append_sheet(wb, ws, '多期进退步对比');
    const safeSchool = String(cache.school || '学校').replace(/[\\/:*?"<>|]/g, '_');
    XLSX.writeFile(wb, `${safeSchool}_多期进退步对比.xlsx`);
    return true;
}

function showMappingModal(cases) {
    const modal = document.getElementById('mappingModal');
    const tbody = document.querySelector('#mappingModal tbody');
    if (!modal || !tbody) return;

    const rows = (cases || []).map((item) => {
        const curr = item.curr;
        let optionsHtml = `<option value="">-- 请选择对应的上次记录 --</option>`;
        (item.candidates || []).forEach(cand => {
            const safeClass = progressEscapeHtml(cand.class);
            const safeRank = progressEscapeHtml(cand.rank);
            optionsHtml += `<option value="${safeClass}">上次在：${safeClass} (排名:${safeRank})</option>`;
        });
        optionsHtml += `<option value="__IGNORE__">❌ 不是同一个人 (视为新生)</option>`;

        return `
                <tr data-school="${progressEscapeHtml(curr.school)}" data-class="${progressEscapeHtml(curr.class)}" data-name="${progressEscapeHtml(curr.name)}">
                    <td style="padding:10px;">
                        <div style="font-weight:bold;">${progressEscapeHtml(curr.name)}</div>
                        <div style="font-size:12px; color:#666;">本次：${progressEscapeHtml(curr.class)}</div>
                    </td>
                    <td style="padding:10px;">
                        <select class="mapping-select" style="width:100%; padding:5px; border:1px solid #d97706; border-radius:4px;">
                            ${optionsHtml}
                        </select>
                    </td>
                </tr>
            `;
    });
    tbody.innerHTML = rows.join('');

    modal.style.display = 'flex';
}

function confirmMappingsAndRun() {
    const rows = document.querySelectorAll('#mappingModal tbody tr');
    let allSelected = true;

    rows.forEach(row => {
        const select = row.querySelector('select');
        const val = select.value;
        if (!val) {
            allSelected = false;
            select.style.border = "2px solid red";
        } else {
            const s = row.dataset.school;
            const c = row.dataset.class;
            const n = row.dataset.name;
            const key = `${s}_${c}_${n}`;
            MANUAL_ID_MAPPINGS[key] = val;
        }
    });

    if (!allSelected) return window.UI.alert("请为所有疑似学生选择对应关系（如果是新生，请选“不是同一个人”）");

    syncLocalProgressState({ manualIdMappings: MANUAL_ID_MAPPINGS });
    document.getElementById('mappingModal').style.display = 'none';
    performProgressCalculation();
}

function switchValueAddedView(mode, btn) {
    VA_VIEW_MODE = String(mode || '').trim() === 'class' ? 'class' : 'school';
    syncLocalProgressState({ vaViewMode: VA_VIEW_MODE });

    const siblings = btn.parentNode.querySelectorAll('.btn');
    siblings.forEach(b => {
        b.classList.remove('active');
        b.style.backgroundColor = 'white';
        b.style.color = '#64748b';
    });

    btn.classList.add('active');
    btn.style.backgroundColor = '#e0f2fe';
    btn.style.color = '#0369a1';
    renderValueAddedReport(true);
}

function exportValueAddedExcel() {
    const lastVaData = readLastVaDataState();
    if (!lastVaData || lastVaData.length === 0) return window.UI.alert("请先生成报表");

    const wb = XLSX.utils.book_new();
    const data = [['单位名称', '匹配人数', '入口均位(上次排名)', '出口均位(本次排名)', '平均增值(名次)', '增值排名']];

    lastVaData.forEach(d => {
        data.push([d.name, d.count, d.entryAvg.toFixed(2), d.exitAvg.toFixed(2), d.valueAdded.toFixed(2), d.rank]);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    ws['!cols'] = [{ wch: 20 }, { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }];

    XLSX.utils.book_append_sheet(wb, ws, "增值性评价表");
    XLSX.writeFile(wb, `增值性评价报表_${VA_VIEW_MODE === 'school' ? '学校' : '班级'}.xlsx`);
}

function getProgressCleanName(name) {
    return String(name || '')
        .replace(/\s+/g, '')
        .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
        .toLowerCase();
}

function getProgressSelectedSchoolName() {
    const select = document.getElementById('progressSchoolSelect');
    const fallbackSchools = (typeof window.listAvailableSchoolsForCompare === 'function')
        ? window.listAvailableSchoolsForCompare('all')
        : Object.keys(SCHOOLS || {});
    const schoolName = String(select?.value || MY_SCHOOL || fallbackSchools[0] || '').trim();
    if (select && schoolName && !select.value) select.value = schoolName;
    return schoolName;
}

function getProgressCurrentStudentsForSchool(schoolName) {
    const school = progressGetSchoolRecord(schoolName);
    if (!school || !Array.isArray(school.students)) return [];

    const user = getCurrentUser();
    const mode = PermissionPolicy.isClassTeacher(user) ? 'homeroom' : 'teaching';
    return PermissionPolicy.filterStudentRows(user, school.students.slice(), { mode });
}

function getProgressBaselineRowsForSchool(schoolName) {
    const baselineExamId = document.getElementById('progressBaselineSelect')?.value || '';
    const normalizedRows = normalizeProgressBaselineRows(PREV_DATA || window.PREV_DATA || [], baselineExamId);
    const currentStudents = getProgressCurrentStudentsForSchool(schoolName);
    const currentNames = new Set(currentStudents.map(student => getProgressCleanName(student.name)).filter(Boolean));

    let rows = normalizedRows.filter(row => areSchoolNamesEquivalent(row.school, schoolName));
    if (rows.length < Math.max(5, Math.floor(currentStudents.length * 0.4))) {
        rows = normalizedRows.filter(row => currentNames.has(getProgressCleanName(row.name)));
    }

    rows = rows
        .map(row => {
            const recalculated = Number(recalcPrevTotal(row));
            const total = Number.isFinite(recalculated) ? recalculated : Number(row.total);
            return Number.isFinite(total) ? { ...row, _progressTotal: total } : null;
        })
        .filter(Boolean)
        .sort((a, b) => b._progressTotal - a._progressTotal);

    let lastRank = 0;
    let lastTotal = null;
    rows.forEach((row, index) => {
        if (lastTotal === null || Math.abs(row._progressTotal - lastTotal) > 0.001) {
            lastRank = index + 1;
            lastTotal = row._progressTotal;
        }
        row._progressSchoolRank = lastRank;
    });

    return rows;
}

function buildProgressPreviousMatchIndex(rows) {
    const strictMap = new Map();
    const looseMap = new Map();

    (rows || []).forEach(row => {
        const nameKey = getProgressCleanName(row.name);
        const classKey = normalizeClass(row.class || '');
        const strictKey = `${nameKey}__${classKey}`;
        if (!strictMap.has(strictKey)) strictMap.set(strictKey, []);
        strictMap.get(strictKey).push(row);
        if (!looseMap.has(nameKey)) looseMap.set(nameKey, []);
        looseMap.get(nameKey).push(row);
    });

    return { strictMap, looseMap };
}

function resolveProgressBaselineMatch(student, indexes) {
    const nameKey = getProgressCleanName(student.name);
    const classKey = normalizeClass(student.class || '');
    const manualKey = `${student.school}_${student.class}_${student.name}`;
    const manualValue = MANUAL_ID_MAPPINGS?.[manualKey];
    const looseCandidates = (indexes.looseMap.get(nameKey) || []).filter(row => (
        !student.school || !row.school || areSchoolNamesEquivalent(row.school, student.school)
    ));

    if (manualValue === '__IGNORE__') {
        return { row: null, matchType: 'ignored', matchLabel: '手动忽略' };
    }
    if (manualValue) {
        const manualRow = looseCandidates.find(row => (
            isClassEquivalent(row.class, manualValue) ||
            String(row.class || '').trim() === String(manualValue || '').trim()
        ));
        if (manualRow) {
            return { row: manualRow, matchType: 'manual', matchLabel: '手动映射' };
        }
    }

    const strictCandidates = (indexes.strictMap.get(`${nameKey}__${classKey}`) || []).filter(row => (
        !student.school || !row.school || areSchoolNamesEquivalent(row.school, student.school)
    ));
    if (strictCandidates.length === 1) {
        return { row: strictCandidates[0], matchType: 'strict', matchLabel: '同名同班' };
    }
    if (looseCandidates.length === 1) {
        return { row: looseCandidates[0], matchType: 'same_name_unique', matchLabel: '同名唯一' };
    }
    if (strictCandidates.length > 1 || looseCandidates.length > 1) {
        return { row: null, matchType: 'ambiguous', matchLabel: '同名待确认' };
    }
    return { row: null, matchType: 'missing', matchLabel: '未匹配' };
}

function getProgressStatusMeta(change) {
    if (change >= 20) return { label: '显著进步', className: 'trend-up', color: 'var(--success)' };
    if (change >= 5) return { label: '稳步提升', className: 'trend-up', color: 'var(--success)' };
    if (change <= -20) return { label: '明显退步', className: 'trend-down', color: 'var(--danger)' };
    if (change <= -5) return { label: '需要关注', className: 'trend-down', color: 'var(--danger)' };
    return { label: '基本稳定', className: 'trend-stable', color: '#64748b' };
}

function destroyProgressChart(canvasId, instanceRef) {
    const canvas = document.getElementById(canvasId);
    try {
        if (typeof Chart !== 'undefined' && typeof Chart.getChart === 'function' && canvas) {
            const existing = Chart.getChart(canvas);
            if (existing) existing.destroy();
        }
    } catch (error) {
        console.warn(`[progress] destroy chart ${canvasId} failed:`, error);
    }
    try {
        if (instanceRef && typeof instanceRef.destroy === 'function') instanceRef.destroy();
    } catch (error) {
        console.warn(`[progress] destroy chart instance ${canvasId} failed:`, error);
    }
    if (canvas && typeof canvas.getContext === 'function') {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    return null;
}

function clearProgressVisuals() {
    trendChartInstance = window.trendChartInstance = destroyProgressChart('trendChart', trendChartInstance);
    sankeyChartInstance = window.sankeyChartInstance = destroyProgressChart('sankeyChart', sankeyChartInstance);
}

function ensureProgressChartVendor() {
    if (typeof Chart !== 'undefined') return Promise.resolve(Chart);
    if (progressChartVendorPromise) return progressChartVendorPromise;
    const loader = typeof window.ensureChartVendorLoaded === 'function'
        ? window.ensureChartVendorLoaded
        : null;
    if (!loader) return Promise.reject(new Error('Chart runtime loader unavailable'));
    progressChartVendorPromise = Promise.resolve()
        .then(() => loader.call(window))
        .catch((error) => {
            progressChartVendorPromise = null;
            throw error;
        });
    return progressChartVendorPromise;
}

function runProgressSankeyWhenIdle(token) {
    const runner = () => {
        if (token !== PROGRESS_VISUAL_RENDER_TOKEN) return;
        if (!PROGRESS_CACHE.length) {
            clearProgressVisuals();
            return;
        }
        renderSankeyDiagram();
    };
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(runner, { timeout: 700 });
        return;
    }
    if (typeof window.requestAnimationFrame === 'function') {
        window.requestAnimationFrame(runner);
        return;
    }
    window.setTimeout(runner, 32);
}

function scheduleProgressVisualRender() {
    PROGRESS_VISUAL_RENDER_TOKEN += 1;
    if (PROGRESS_VISUAL_RENDER_FRAME) return;

    const runner = () => {
        PROGRESS_VISUAL_RENDER_FRAME = 0;
        const token = PROGRESS_VISUAL_RENDER_TOKEN;
        if (!PROGRESS_CACHE.length) {
            clearProgressVisuals();
            return;
        }
        ensureProgressChartVendor()
            .then(() => {
                if (token !== PROGRESS_VISUAL_RENDER_TOKEN || !PROGRESS_CACHE.length) return;
                renderTrendChart();
                runProgressSankeyWhenIdle(token);
            })
            .catch((error) => console.warn('[progress] Chart runtime load failed:', error));
    };

    if (typeof window.requestAnimationFrame === 'function') {
        PROGRESS_VISUAL_RENDER_FRAME = window.requestAnimationFrame(runner);
    } else {
        PROGRESS_VISUAL_RENDER_FRAME = window.setTimeout(runner, 16);
    }
}


function performProgressCalculation(options = {}) {
    const schoolName = String(options.schoolName || getProgressSelectedSchoolName() || '').trim();
    const silent = !!options.silent;
    const shouldRenderReport = options.rerenderReport !== false;
    const statusEl = document.getElementById('va-data-status');

    if (!schoolName || !progressGetSchoolRecord(schoolName)) {
        if (!silent) uiAlert("请选择要分析的学校", 'warning');
        return { schoolName, matched: 0, ambiguous: 0, ignored: 0, total: 0 };
    }

    const currentStudents = getProgressCurrentStudentsForSchool(schoolName);
    const baselineRows = getProgressBaselineRowsForSchool(schoolName);
    const currentRankIndex = window.RankingDataService?.buildStudentRankIndex(RAW_DATA, []) || null;

    window.__PROGRESS_CALCULATING = true;
    syncLocalProgressState({
        progressCache: [],
        progressCacheFull: [],
        lastVaData: []
    });

    if (!currentStudents.length) {
        clearProgressVisuals();
        renderProgressTable([]);
        if (statusEl) statusEl.innerHTML = '⚠️ 当前学校暂无可分析学生';
        window.__PROGRESS_CALCULATING = false;
        return { schoolName, matched: 0, ambiguous: 0, ignored: 0, total: 0 };
    }

    if (!baselineRows.length) {
        clearProgressVisuals();
        renderProgressTable([]);
        if (statusEl) statusEl.innerHTML = '⚠️ 未找到可用的上次考试数据';
        window.__PROGRESS_CALCULATING = false;
        return { schoolName, matched: 0, ambiguous: 0, ignored: 0, total: currentStudents.length };
    }

    const indexes = buildProgressPreviousMatchIndex(baselineRows);
    const results = [];
    let ambiguousCount = 0;
    let ignoredCount = 0;

    currentStudents.forEach(student => {
        const storedCurrentRank = Number(safeGet(student, 'ranks.total.school', 0));
        const currRank = Number.isFinite(storedCurrentRank) && storedCurrentRank > 0
            ? storedCurrentRank
            : Number(currentRankIndex?.getRank(student, 'total', 'school', 0));
        if (!Number.isFinite(currRank) || currRank <= 0) return;

        const match = resolveProgressBaselineMatch(student, indexes);
        if (match.matchType === 'ambiguous') ambiguousCount++;
        if (match.matchType === 'ignored') ignoredCount++;
        if (!match.row) return;

        const prevRank = Number(
            match.row._progressSchoolRank ||
            match.row.rankSchool ||
            match.row.rank ||
            0
        );
        if (!Number.isFinite(prevRank) || prevRank <= 0) return;

        const change = prevRank - currRank;
        const statusMeta = getProgressStatusMeta(change);
        results.push({
            school: student.school,
            class: student.class,
            name: student.name,
            currTotal: Number.isFinite(Number(student.total)) ? Number(student.total) : '-',
            currRank,
            prevTotal: Number.isFinite(Number(match.row._progressTotal)) ? Number(match.row._progressTotal) : '-',
            prevRank,
            change,
            matchType: match.matchType,
            matchTypeLabel: match.matchLabel,
            statusText: statusMeta.label,
            statusClass: statusMeta.className,
            statusColor: statusMeta.color
        });
    });

    syncLocalProgressState({
        progressCache: results.slice(),
        progressCacheFull: results.slice()
    });
    applyProgressFilter();
    if (shouldRenderReport) renderValueAddedReport(true);

    if (statusEl) {
        statusEl.innerHTML = results.length
            ? `✅ 已完成校内排名对比：匹配 ${results.length} 人，待确认 ${ambiguousCount} 人，忽略 ${ignoredCount} 人`
            : '⚠️ 已加载上次考试数据，但当前学校没有可匹配学生';
    }

    window.__PROGRESS_CALCULATING = false;
    return {
        schoolName,
        matched: results.length,
        ambiguous: ambiguousCount,
        ignored: ignoredCount,
        total: currentStudents.length
    };
}


function syncProgressResponsiveTableState() {
    const table = document.getElementById('progressTable');
    if (!table) return;

    const isMobileViewport = document.body?.dataset?.mobileQuery === 'true'
        || window.innerWidth <= 768;

    if (isMobileViewport) {
        if (typeof window.refreshResponsiveMobileTables === 'function') {
            window.refreshResponsiveMobileTables(table.closest('.section') || table);
        }
        return;
    }

    table.classList.remove('mobile-card-table');
    delete table.dataset.mobileEnhanced;
    Array.from(table.querySelectorAll('tbody tr')).forEach((row) => {
        row.removeAttribute('data-mobile-card-title');
    });
    Array.from(table.querySelectorAll('tbody td')).forEach((cell) => {
        cell.removeAttribute('data-label');
    });
}

function renderProgressTable(list) {
    const tbody = document.querySelector('#progressTable tbody');
    const thead = document.querySelector('#progressTable thead tr');
    if (!tbody || !thead) return;

    thead.innerHTML = '<th>班级</th><th>姓名</th><th>上次校排</th><th>本次校排</th><th>排名变化</th><th>上次总分</th><th>本次总分</th><th>匹配方式</th><th>状态</th>';

    if (!list || list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; padding:20px; color:#999;">暂无符合条件的学生</td></tr>';
        syncProgressResponsiveTableState();
        return;
    }

    tbody.innerHTML = list.map(row => {
        const changeText = `${row.change > 0 ? '+' : ''}${row.change}`;
        const changeColor = row.change > 0 ? 'var(--success)' : (row.change < 0 ? 'var(--danger)' : '#64748b');
        const statusHtml = `<span class="${row.statusClass || 'trend-stable'}" style="color:${row.statusColor || '#64748b'};">${row.statusText || '基本稳定'}</span>`;
        return `<tr>
            <td data-label="班级">${row.class || '-'}</td>
            <td data-label="姓名"><strong>${row.name}</strong></td>
            <td data-label="上次校排">${row.prevRank}</td>
            <td data-label="本次校排">${row.currRank}</td>
            <td data-label="排名变化" style="font-weight:bold; color:${changeColor};">${changeText}</td>
            <td data-label="上次总分" style="color:#666;">${row.prevTotal}</td>
            <td data-label="本次总分">${row.currTotal}</td>
            <td data-label="匹配方式">${row.matchTypeLabel || '-'}</td>
            <td data-label="状态">${statusHtml}</td>
        </tr>`;
    }).join('');
    syncProgressResponsiveTableState();
}

function renderTrendChart() {
    const ctx = document.getElementById('trendChart');
    if (!ctx || !PROGRESS_CACHE.length) {
        trendChartInstance = window.trendChartInstance = destroyProgressChart('trendChart', trendChartInstance);
        return;
    }
    if (typeof Chart === 'undefined') {
        ensureProgressChartVendor()
            .then(() => renderTrendChart())
            .catch((error) => console.warn('[progress] Chart runtime load failed:', error));
        return;
    }
    trendChartInstance = window.trendChartInstance = destroyProgressChart('trendChart', trendChartInstance);

    const improved = [];
    const regressed = [];
    const stable = [];

    PROGRESS_CACHE.forEach(item => {
        const point = { x: item.prevRank, y: item.currRank, name: item.name, cls: item.class, change: item.change };
        if (item.change > 0) improved.push(point);
        else if (item.change < 0) regressed.push(point);
        else stable.push(point);
    });

    const maxRank = Math.max(...PROGRESS_CACHE.map(item => Math.max(item.prevRank, item.currRank))) + 10;
    trendChartInstance = window.trendChartInstance = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [
                { label: '进步', data: improved, backgroundColor: 'rgba(22, 163, 74, 0.6)', borderColor: 'rgba(22, 163, 74, 1)' },
                { label: '退步', data: regressed, backgroundColor: 'rgba(220, 38, 38, 0.6)', borderColor: 'rgba(220, 38, 38, 1)' },
                { label: '稳定', data: stable, backgroundColor: 'rgba(71, 85, 105, 0.45)', borderColor: 'rgba(71, 85, 105, 0.8)' },
                { label: '基准线', data: [{ x: 0, y: 0 }, { x: maxRank, y: maxRank }], showLine: true, borderColor: '#94a3b8', borderDash: [5, 5], pointRadius: 0, fill: false }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: chartCtx => {
                            const point = chartCtx.raw;
                            return point?.name
                                ? `${point.cls} ${point.name}: 上次校排 ${point.x} -> 本次校排 ${point.y} (${point.change > 0 ? '+' : ''}${point.change})`
                                : '';
                        }
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: '上次校排' }, min: 0, max: maxRank },
                y: { title: { display: true, text: '本次校排' }, min: 0, max: maxRank, reverse: true }
            }
        }
    });
}

function renderSankeyDiagram() {
    const ctx = document.getElementById('sankeyChart');
    if (!ctx || !PROGRESS_CACHE.length) {
        sankeyChartInstance = window.sankeyChartInstance = destroyProgressChart('sankeyChart', sankeyChartInstance);
        return;
    }
    if (typeof Chart === 'undefined') {
        ensureProgressChartVendor()
            .then(() => renderSankeyDiagram())
            .catch((error) => console.warn('[progress] Chart runtime load failed:', error));
        return;
    }

    sankeyChartInstance = window.sankeyChartInstance = destroyProgressChart('sankeyChart', sankeyChartInstance);

    const buckets = [
        { label: '显著进步', color: '#16a34a', count: 0, test: change => change >= 20 },
        { label: '小幅进步', color: '#4ade80', count: 0, test: change => change >= 5 && change < 20 },
        { label: '基本稳定', color: '#94a3b8', count: 0, test: change => change > -5 && change < 5 },
        { label: '小幅退步', color: '#f97316', count: 0, test: change => change <= -5 && change > -20 },
        { label: '明显退步', color: '#dc2626', count: 0, test: change => change <= -20 }
    ];

    PROGRESS_CACHE.forEach(item => {
        const bucket = buckets.find(entry => entry.test(item.change));
        if (bucket) bucket.count += 1;
    });

    sankeyChartInstance = window.sankeyChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: buckets.map(item => item.label),
            datasets: [{
                label: '人数',
                data: buckets.map(item => item.count),
                backgroundColor: buckets.map(item => item.color),
                borderRadius: 8,
                maxBarThickness: 48
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: chartCtx => `${chartCtx.label}: ${chartCtx.raw} 人`
                    }
                }
            },
            scales: {
                x: { title: { display: true, text: '排名变化区间' } },
                y: { beginAtZero: true, ticks: { precision: 0 }, title: { display: true, text: '人数' } }
            }
        }
    });
}

function renderValueAddedReport(isSwitching = false) {
    const statusEl = document.getElementById('va-data-status');
    if (window.__PROGRESS_BASELINE_LOADING) {
        if (statusEl) statusEl.innerHTML = '⏳ 正在自动加载上次考试数据...';
        return;
    }

    if ((!PREV_DATA || PREV_DATA.length === 0) && RAW_DATA.length > 0 && typeof ensureProgressBaselineData === 'function') {
        setProgressBaselineStatus('⏳ 正在自动加载上次考试数据...', 'loading');
        Promise.resolve(ensureProgressBaselineData({
            allowCloudSync: true,
            rerenderReport: true,
            rerenderAnalysis: false
        })).catch(err => {
            console.warn('[progress] 自动补拉历史基准失败:', err);
            setProgressBaselineStatus('❌ 自动加载上次考试数据失败，请稍后重试', 'error');
        });
        return;
    }

    let sourceList = readProgressCacheFullState().length
        ? readProgressCacheFullState().slice()
        : (PROGRESS_CACHE || []).slice();

    if (!sourceList.length && PREV_DATA.length > 0 && RAW_DATA.length > 0 && !window.__PROGRESS_CALCULATING) {
        performSilentMatching();
        sourceList = readProgressCacheFullState().length
            ? readProgressCacheFullState().slice()
            : (PROGRESS_CACHE || []).slice();
    }

    const tbody = document.querySelector('#tb-value-added tbody');
    if (!sourceList.length) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">暂无可用匹配数据</td></tr>';
        if (statusEl) statusEl.innerHTML = '⚠️ 暂无可用的增值评价数据';
        syncLocalProgressState({ lastVaData: [] });
        return;
    }

    const groups = new Map();
    sourceList.forEach(item => {
        const key = VA_VIEW_MODE === 'class' ? item.class : (item.school || getProgressSelectedSchoolName());
        const label = VA_VIEW_MODE === 'class' ? item.class : (item.school || getProgressSelectedSchoolName());
        if (!groups.has(key)) {
            groups.set(key, {
                name: label,
                count: 0,
                sumPrev: 0,
                sumCurr: 0,
                improved: 0,
                stable: 0,
                regressed: 0
            });
        }
        const group = groups.get(key);
        group.count += 1;
        group.sumPrev += item.prevRank;
        group.sumCurr += item.currRank;
        if (item.change >= 5) group.improved += 1;
        else if (item.change <= -5) group.regressed += 1;
        else group.stable += 1;
    });

    const reportData = Array.from(groups.values()).map(group => {
        const entryAvg = group.sumPrev / group.count;
        const exitAvg = group.sumCurr / group.count;
        const valueAdded = entryAvg - exitAvg;
        let evaluation = '<span class="badge" style="background:#94a3b8">基本稳定</span>';
        if (valueAdded >= 20) evaluation = '<span class="badge" style="background:#16a34a">显著增值</span>';
        else if (valueAdded >= 5) evaluation = '<span class="badge" style="background:#2563eb">稳步提升</span>';
        else if (valueAdded <= -20) evaluation = '<span class="badge" style="background:#dc2626">明显回落</span>';
        else if (valueAdded < -5) evaluation = '<span class="badge" style="background:#f97316">需要关注</span>';
        return {
            name: group.name,
            count: group.count,
            entryAvg,
            exitAvg,
            valueAdded,
            improved: group.improved,
            stable: group.stable,
            regressed: group.regressed,
            evaluation
        };
    }).sort((a, b) => b.valueAdded - a.valueAdded);

    reportData.forEach((item, index) => {
        item.rank = index + 1;
    });

    if (tbody) {
        tbody.innerHTML = reportData.length
            ? reportData.map(item => `
                <tr>
                    <td style="font-weight:bold;">${item.name}</td>
                    <td>${item.count}</td>
                    <td style="color:#666;">${item.entryAvg.toFixed(1)}</td>
                    <td>${item.exitAvg.toFixed(1)}</td>
                    <td style="font-size:16px; font-weight:bold; color:${item.valueAdded >= 0 ? 'var(--success)' : 'var(--danger)'};">${item.valueAdded > 0 ? '+' : ''}${item.valueAdded.toFixed(1)}</td>
                    <td>${item.evaluation}</td>
                    <td class="rank-cell ${item.rank <= 3 ? `r-${item.rank}` : ''}">${item.rank}</td>
                </tr>
            `).join('')
            : '<tr><td colspan="7" style="text-align:center;">暂无可用匹配数据</td></tr>';
    }

    if (statusEl) statusEl.innerHTML = `✅ 数据就绪（已匹配 ${sourceList.length} 人）`;
    syncLocalProgressState({ lastVaData: reportData });
}

function performSilentMatching() {
    if (!PREV_DATA.length || !RAW_DATA.length) return [];
    const schoolName = getProgressSelectedSchoolName();
    if (!schoolName || !progressGetSchoolRecord(schoolName)) return [];
    performProgressCalculation({ schoolName, silent: true, rerenderReport: false });
    return readProgressCacheFullState() || [];
}

function exportProgressAnalysis() {
    if (!PROGRESS_CACHE.length) return window.UI.alert("暂无分析结果，请先进行分析");
    const user = getCurrentUser();
    const role = user?.role || 'guest';
    const scope = role === 'teacher' ? getTeacherScopeForUser(user) : null;
    const wb = XLSX.utils.book_new();
    const data = [['班级', '姓名', '上次校排', '本次校排', '排名变化', '上次总分', '本次总分', '匹配方式', '状态']];

    PROGRESS_CACHE
        .filter(row => {
            if (role === 'class_teacher' && user?.class) return isClassEquivalent(row.class, user.class);
            if (role === 'teacher' && scope?.classes instanceof Set && scope.classes.size > 0) return scope.classes.has(row.class);
            return true;
        })
        .forEach(row => {
            data.push([
                row.class,
                row.name,
                row.prevRank,
                row.currRank,
                row.change,
                row.prevTotal,
                row.currTotal,
                row.matchTypeLabel || '',
                row.statusText || ''
            ]);
        });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "进退步分析");
    XLSX.writeFile(wb, "学生进退步追踪分析表.xlsx");
}

function ensureProgressFilterSummaryElement() {
    let summaryEl = document.getElementById('progressFilterSummary');
    if (summaryEl) return summaryEl;
    const filterBar = document.querySelector('#progress-analysis .analysis-filter-group')
        || document.querySelector('#progress-analysis div[style*="justify-content:space-between"] > div[style*="font-size:12px"]');
    if (!filterBar) return null;
    const resetBtn = filterBar.querySelector('button[onclick="resetProgressFilter()"]');
    if (!resetBtn) return null;
    summaryEl = document.createElement('span');
    summaryEl.id = 'progressFilterSummary';
    summaryEl.style.color = '#64748b';
    summaryEl.style.whiteSpace = 'nowrap';
    summaryEl.textContent = '当前：全部学生 · 全部变化 · 进步优先';
    resetBtn.before(summaryEl);
    return summaryEl;
}


function updateProgressModuleCopy() {
    const infoBar = document.querySelector('#progress-analysis .info-bar');
    if (infoBar) {
        const tip = infoBar.querySelector('span:last-child');
        if (tip) tip.textContent = '核心口径：同校学生按“上次校排 - 本次校排”计算，正数=进步；可切换全部学生、本班、重点变化，并按进步或退步排序查看。';
    }
    const chartTitles = document.querySelectorAll('#anchor-va-trend h4');
    if (chartTitles[0]) chartTitles[0].textContent = '排名变化散点图（上次校排 vs 本次校排）';
    if (chartTitles[1]) chartTitles[1].textContent = '排名变化分布图（显著进步 / 稳定 / 退步）';
    const desc = document.querySelector('#progress-analysis .module-desc-bar p:last-of-type');
    if (desc) desc.textContent = '推荐顺序：先自动识别上次考试，再看集体增值，最后用“全部 / 本班 / 重点变化 + 方向 + 排序”查看个人明细。';

    const filterBar = document.querySelector('#progress-analysis .analysis-filter-group')
        || document.querySelector('#progress-analysis div[style*="justify-content:space-between"] > div[style*="font-size:12px"]');
    if (!filterBar) return;
    filterBar.style.flexWrap = 'wrap';
    const directionLabel = filterBar.querySelector('.progress-filter-label-direction');
    const labels = filterBar.querySelectorAll('label');
    if (labels[0] && !labels[0].classList.contains('progress-filter-label-direction')) labels[0].textContent = '筛选';
    if (directionLabel) directionLabel.textContent = '变化方向';
    if (labels[2]) labels[2].textContent = '重点阈值(名次)';
    if (labels[3]) labels[3].textContent = '排序';
    const resetBtn = filterBar.querySelector('button[onclick="resetProgressFilter()"]');
    if (resetBtn) resetBtn.textContent = '重置筛选';
    ensureProgressFilterSummaryElement();
}

function getProgressQuickFilterMode() {
    return readProgressQuickModeState();
}

function getProgressQuickFilterThreshold() {
    const thresholdEl = document.getElementById('progressFilterThreshold');
    const threshold = thresholdEl ? parseInt(thresholdEl.value || '20', 10) : 20;
    return Number.isFinite(threshold) && threshold >= 0 ? threshold : 20;
}

function getProgressQuickFilterClass() {
    try {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : (window.Auth?.currentUser || null);
        return String(user?.class || '').trim();
    } catch (_) {
        return '';
    }
}

function syncProgressQuickFilterButtons() {
    const mode = getProgressQuickFilterMode();
    const myClass = getProgressQuickFilterClass();
    const buttons = [
        { id: 'progressQuickAllBtn', key: 'all', activeBg: '#10b981' },
        { id: 'progressQuickMyClassBtn', key: 'my_class', activeBg: '#3b82f6' },
        { id: 'progressQuickFocusBtn', key: 'focus', activeBg: '#f59e0b' }
    ];
    buttons.forEach(item => {
        const btn = document.getElementById(item.id);
        if (!btn) return;
        const active = mode === item.key;
        btn.style.background = active ? item.activeBg : '#e2e8f0';
        btn.style.color = active ? '#ffffff' : '#475569';
        btn.style.border = active ? '1px solid transparent' : '1px solid #cbd5e1';
        btn.style.fontWeight = '700';
        btn.style.cursor = 'pointer';
        btn.style.opacity = '1';
        btn.disabled = false;
        if (item.key === 'my_class' && !myClass) {
            btn.style.background = '#f1f5f9';
            btn.style.color = '#94a3b8';
            btn.style.border = '1px dashed #cbd5e1';
            btn.style.cursor = 'not-allowed';
            btn.style.opacity = '0.8';
            btn.disabled = true;
        }
    });
    const thresholdEl = document.getElementById('progressFilterThreshold');
    if (thresholdEl) {
        const enabled = mode === 'focus';
        thresholdEl.disabled = !enabled;
        thresholdEl.style.opacity = enabled ? '1' : '0.6';
        thresholdEl.style.background = enabled ? '#ffffff' : '#f8fafc';
    }
}

function updateProgressFilterSummary(meta = {}) {
    const summaryEl = ensureProgressFilterSummaryElement();
    if (!summaryEl) return;
    const mode = meta.mode || getProgressQuickFilterMode();
    const type = meta.type || (document.getElementById('progressFilterType')?.value || 'all');
    const sortMode = meta.sortMode || (document.getElementById('progressSortOrder')?.value || 'improve_desc');
    const threshold = Number.isFinite(meta.threshold) ? meta.threshold : getProgressQuickFilterThreshold();
    const myClass = getProgressQuickFilterClass();
    const modeLabel = mode === 'my_class'
        ? (myClass ? `只看本班(${myClass})` : '只看本班')
        : (mode === 'focus' ? `重点变化(≥${threshold}名)` : '全部学生');
    const typeLabel = type === 'up' ? '仅进步' : (type === 'down' ? '仅退步' : '全部变化');
    const sortLabelMap = {
        improve_desc: '进步优先',
        regress_desc: '退步优先',
        current_rank_asc: '本次校排靠前',
        class_name_asc: '班级姓名'
    };
    summaryEl.textContent = `当前：${modeLabel} · ${typeLabel} · ${sortLabelMap[sortMode] || '进步优先'}`;
}

function setProgressQuickFilter(mode) {
    const myClass = getProgressQuickFilterClass();
    if (mode === 'my_class' && !myClass) {
        syncLocalProgressState({ quickMode: 'all' });
        syncProgressQuickFilterButtons();
        updateProgressFilterSummary();
        if (window.UI?.toast) window.UI.toast('当前账号没有班级范围，已切回全部学生。', 'warning');
        applyProgressFilter();
        return;
    }
    syncLocalProgressState({ quickMode: ['all', 'my_class', 'focus'].includes(mode) ? mode : 'all' });
    syncProgressQuickFilterButtons();
    applyProgressFilter();
}

function renderProgressAnalysis() {
    updateProgressModuleCopy();
    syncProgressQuickFilterButtons();
    updateProgressFilterSummary();
    if (!RAW_DATA.length) return uiAlert("请先上传【本次考试】数据", 'warning');

    if ((!PREV_DATA || !PREV_DATA.length) && typeof ensureProgressBaselineData === 'function') {
        setProgressBaselineStatus('⏳ 正在自动加载上次考试数据...', 'loading');
        Promise.resolve(ensureProgressBaselineData({
            allowCloudSync: true,
            rerenderReport: true,
            rerenderAnalysis: true
        })).catch(error => {
            console.warn('[progress] auto load baseline failed:', error);
            setProgressBaselineStatus('❌ 自动加载上次考试数据失败，请稍后重试', 'error');
        });
        return;
    }

    const schoolName = getProgressSelectedSchoolName();
    if (!schoolName || !progressGetSchoolRecord(schoolName)) return uiAlert("请选择要分析的学校", 'warning');
    performProgressCalculation({ schoolName });
}

function applyProgressFilter() {
    const typeEl = document.getElementById('progressFilterType');
    const thresholdEl = document.getElementById('progressFilterThreshold');
    const sortEl = document.getElementById('progressSortOrder');
    const type = typeEl ? typeEl.value : 'all';
    const threshold = thresholdEl ? parseInt(thresholdEl.value || '20', 10) : 20;
    const sortMode = sortEl ? sortEl.value : 'improve_desc';
    const quickMode = getProgressQuickFilterMode();

    let list = readProgressCacheFullState().slice();
    if (quickMode === 'my_class') {
        const myClass = getProgressQuickFilterClass();
        if (myClass) list = list.filter(item => isClassEquivalent(item.class, myClass));
    } else if (quickMode === 'focus') {
        list = list.filter(item => Math.abs(item.change) >= threshold);
    }
    if (type === 'up') list = list.filter(item => item.change > 0);
    if (type === 'down') list = list.filter(item => item.change < 0);
    list.sort((a, b) => {
        switch (sortMode) {
            case 'regress_desc':
                if (a.change !== b.change) return a.change - b.change;
                return a.currRank - b.currRank;
            case 'current_rank_asc':
                if (a.currRank !== b.currRank) return a.currRank - b.currRank;
                return b.change - a.change;
            case 'class_name_asc': {
                const classDiff = String(a.class || '').localeCompare(String(b.class || ''), 'zh-CN', { numeric: true });
                if (classDiff !== 0) return classDiff;
                return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN', { numeric: true });
            }
            case 'improve_desc':
            default:
                if (a.change !== b.change) return b.change - a.change;
                return a.currRank - b.currRank;
        }
    });

    syncLocalProgressState({ progressCache: list });
    syncProgressQuickFilterButtons();
    updateProgressFilterSummary({ mode: quickMode, type, threshold, sortMode });
    renderProgressTable(list);

    if (list.length > 0) {
        scheduleProgressVisualRender();
    } else {
        clearProgressVisuals();
    }
}

function resetProgressFilter() {
    const typeEl = document.getElementById('progressFilterType');
    const thresholdEl = document.getElementById('progressFilterThreshold');
    const sortEl = document.getElementById('progressSortOrder');
    if (typeEl) typeEl.value = 'all';
    if (thresholdEl) thresholdEl.value = 20;
    if (sortEl) sortEl.value = 'improve_desc';
    syncLocalProgressState({ quickMode: 'all' });
    applyProgressFilter();
}

    Object.assign(window, {
        showMappingModal,
        confirmMappingsAndRun,
        switchValueAddedView,
        exportValueAddedExcel,
        updateProgressSchoolSelect,
        getProgressBaselineExamList,
        pickDefaultProgressBaselineExamId,
        normalizeProgressBaselineRows,
        updateProgressBaselineSelect,
        getBaselineDataFromExam,
        onProgressComparePeriodCountChange,
        filterProgressCompareRowsToTownshipScope,
        renderMultiPeriodComparison,
        exportMultiPeriodComparison,
        setCompareExamSelectPlaceholders,
        refreshCompareExamSelectors,
        trySyncCompareExamOptions,
        setProgressBaselineStatus,
        syncProgressBaselineExamOptions,
        ensureProgressBaselineData,
        updateProgressMultiExamSelects,
        progressResolveSchoolOption,
        getProgressCleanName,
        getProgressSelectedSchoolName,
        getProgressCurrentStudentsForSchool,
        getProgressBaselineRowsForSchool,
        buildProgressPreviousMatchIndex,
        resolveProgressBaselineMatch,
        getProgressStatusMeta,
        destroyProgressChart,
        clearProgressVisuals,
        performProgressCalculation,
        renderProgressTable,
        renderTrendChart,
        renderSankeyDiagram,
        renderValueAddedReport,
        performSilentMatching,
        exportProgressAnalysis,
        ensureProgressFilterSummaryElement,
        updateProgressModuleCopy,
        getProgressQuickFilterMode,
        getProgressQuickFilterThreshold,
        getProgressQuickFilterClass,
        syncProgressQuickFilterButtons,
        updateProgressFilterSummary,
        setProgressQuickFilter,
        renderProgressAnalysis,
        applyProgressFilter,
        resetProgressFilter
    });

    syncLocalProgressState({
        progressCache: PROGRESS_CACHE,
        progressCacheFull: readProgressCacheFullState(),
        manualIdMappings: MANUAL_ID_MAPPINGS,
        lastVaData: readLastVaDataState(),
        vaViewMode: VA_VIEW_MODE,
        quickMode: readProgressQuickModeState()
    });
    window.trendChartInstance = trendChartInstance;
    window.sankeyChartInstance = sankeyChartInstance;
    window.__PROGRESS_ANALYSIS_RUNTIME_PATCHED__ = true;
})();
