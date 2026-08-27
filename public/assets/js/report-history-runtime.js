// Report history query runtime split from app.js.
function reportHistorySafeAlert(message) {
    const text = String(message || '');
    if (window.UI && typeof window.UI === 'object' && typeof window.UI.alert === 'function') {
        return window.UI.alert(text);
    }
}

function examKeyEq(a, b) {
    const fn = window.isExamKeyEquivalentForCompare;
    if (typeof fn === 'function') return fn(a, b);
    const v = k => { const p = String(k || '').trim().replace(/\s+/g, '_').toLowerCase().split('_').filter(Boolean); return [p.join('_'), p.slice(4).join('_'), p.slice(3).join('_')].filter(Boolean); };
    return v(a).some(key => v(b).includes(key));
}

function getReportExamDateKey(value) {
    const matches = Array.from(String(value || '').matchAll(/(20\d{2})[^\d]{1,3}(\d{1,2})[^\d]{1,3}(\d{1,2})(?!\d)/g));
    const match = matches[matches.length - 1];
    if (!match) return '';
    return `${match[1]}-${String(match[2]).padStart(2, '0')}-${String(match[3]).padStart(2, '0')}`;
}

function isReportCurrentExamEntry(examId, currentExamId) {
    if (examKeyEq(examId, currentExamId)) return true;
    // Older cloud rows can use a cohort::... alias for the current snapshot.
    // It is not an earlier exam merely because its storage key differs.
    const alias = String(examId || '').trim();
    return /^cohort::/i.test(alias)
        && !!getReportExamDateKey(alias)
        && getReportExamDateKey(alias) === getReportExamDateKey(currentExamId);
}

function applyCloudStudentHistoryToPrevData(stu, historyRes, selectedReportExamIds = [], effectiveCurrentExamId = '') {
    if (!historyRes || !historyRes.success || !Array.isArray(historyRes.data) || historyRes.data.length === 0) return 0;
    const selectedForCompare = Array.isArray(selectedReportExamIds) ? selectedReportExamIds : [];
    const rows = historyRes.data.filter(h => {
        const hid = String(h.examFullKey || h.examId || '').trim();
        if (!hid) return false;
        if (selectedForCompare.length > 0) {
            const inSelected = selectedForCompare.some(id => examKeyEq(hid, id));
            if (!inSelected) return false;
        }
        return !effectiveCurrentExamId || !isReportCurrentExamEntry(hid, effectiveCurrentExamId);
    }).map(h => ({
        examId: h.examId,
        examFullKey: h.examFullKey,
        examLabel: String(h.examLabel || h.examId || h.examFullKey || '').replace(/_/g, ' '),
        fingerprint: h.fingerprint || '',
        updatedAt: h.updatedAt || new Date().toISOString(),
        student: {
            name: stu.name,
            class: stu.class,
            school: stu.school || '',
            total: Number(h.total) || 0,
            scores: h.scores || {},
            ranks: Object.assign({
                    total: {
                        class: h.rankClass || '-',
                        school: h.rankSchool || '-',
                        township: h.rankTown || '-',
                        county: h.rankCounty || h.subjectRanks?.total?.county || '-'
                    }
                }, Object.fromEntries(
                    Object.entries(h.subjectRanks || {}).map(([sub, ranks]) => [sub, {
                        class: ranks?.class ?? '-',
                        school: ranks?.school ?? '-',
                        township: ranks?.township ?? '-',
                        county: ranks?.county ?? '-'
                    }])
                )),
            updatedAt: h.updatedAt || new Date().toISOString()
        },
        percentiles: h.percentiles || {}
    }));
    if (rows.length > 0) {
        // Student-report history is intentionally separate from PREV_DATA.
        // PREV_DATA belongs to the cohort-wide progress baseline; replacing it
        // with one student's report rows makes the value-added module lose its
        // full previous-exam cohort and renders every match unavailable.
        const studentHistoryCache = ReportHistoryPerfCache.cloudHistoryByStudent
            || (ReportHistoryPerfCache.cloudHistoryByStudent = new Map());
        const studentKey = getReportStudentIdentity(stu);
        const existingRows = studentHistoryCache.get(studentKey) || [];
        const mergedRows = existingRows.slice();
        rows.forEach((row) => {
            const rowKey = String(row.examFullKey || row.examId || '').trim();
            const existingIndex = mergedRows.findIndex((item) => examKeyEq(item?.examFullKey || item?.examId, rowKey));
            if (existingIndex >= 0) mergedRows[existingIndex] = row;
            else mergedRows.push(row);
        });
        studentHistoryCache.set(studentKey, mergedRows);
        if (studentHistoryCache.size > 60) {
            studentHistoryCache.delete(studentHistoryCache.keys().next().value);
        }
        ReportHistoryPerfCache.historyByStudent.clear();
        ReportHistoryPerfCache.lastChartScheduleKey = '';
        clearStudentReportCache(stu);
        window.__REPORT_HISTORY_VERSION = (window.__REPORT_HISTORY_VERSION || 0) + 1;
    }
    return rows.length;
}

function getCloudReportHistoryExamEntries(stu, currentExamId = '') {
    const cache = ReportHistoryPerfCache.cloudHistoryByStudent;
    const rows = cache instanceof Map ? (cache.get(getReportStudentIdentity(stu)) || []) : [];
    return rows.map((row) => ({
        id: String(row?.examFullKey || row?.examId || '').trim(),
        label: String(row?.examLabel || row?.examFullKey || row?.examId || '').trim(),
        createdAt: row?.updatedAt || row?.student?.updatedAt || 0,
        source: 'report-history'
    })).filter((entry) => entry.id && !isReportCurrentExamEntry(entry.id, currentExamId));
}

window.getCloudReportHistoryExamEntries = getCloudReportHistoryExamEntries;

function getCachedStudentReportHistory(stu, selectedExamIds = null, effectiveCurrentExamId = '') {
    const key = [
        getReportStudentIdentity(stu),
        getCurrentReportDataFingerprint(),
        buildStudentReportSelectionSignature(selectedExamIds, effectiveCurrentExamId)
    ].join('::');
    if (ReportHistoryPerfCache.historyByStudent.has(key)) {
        return ReportHistoryPerfCache.historyByStudent.get(key);
    }
    const history = typeof getStudentExamHistory === 'function' ? getStudentExamHistory(stu) : [];
    ReportHistoryPerfCache.historyByStudent.set(key, history);
    if (ReportHistoryPerfCache.historyByStudent.size > 60) {
        const firstKey = ReportHistoryPerfCache.historyByStudent.keys().next().value;
        ReportHistoryPerfCache.historyByStudent.delete(firstKey);
    }
    return history;
}

function refreshHydratedStudentReport(stu, selectedExamIds = [], effectiveCurrentExamId = '') {
    const { container } = getReportDomCache();
    if (!stu || !container) return;
    const history = getCachedStudentReportHistory(stu, selectedExamIds, effectiveCurrentExamId);
    const reportCacheKey = buildStudentReportCacheKey(stu, 'FULL', selectedExamIds, effectiveCurrentExamId);
    const reportHtml = renderSingleReportCardHTML(stu, 'FULL', { reportExamHistory: history });
    if (typeof reportHtml !== 'string') return;
    getStudentReportPerformanceRuntime()?.setReportHtml?.(reportCacheKey, reportHtml);
    container.innerHTML = reportHtml;
    container.dataset.reportHtmlCacheKey = reportCacheKey;
    container.dataset.reportChartCacheKey = '';
    enhanceStudentReportMetrics(container);
    scheduleStudentReportCharts(stu, history);
}

function hasUsableHistoricalRankValue(value) {
    const text = String(value ?? '').trim();
    return text !== '' && text !== '-' && text !== '—' && text.toLowerCase() !== 'undefined' && text.toLowerCase() !== 'null';
}

function hasCompleteSubjectRankComparisonHistory(historyEntry) {
    const student = historyEntry?.student || historyEntry || {};
    const scores = student?.scores || historyEntry?.scores || {};
    const subjectRanks = student?.ranks || historyEntry?.subjectRanks || {};
    const subjects = Object.keys(scores || {});
    if (!subjects.length) return false;

    return subjects.every((subject) => {
        const ranks = subjectRanks?.[subject] || historyEntry?.subjectRanks?.[subject] || {};
        return hasUsableHistoricalRankValue(ranks?.class ?? ranks?.rankClass)
            && hasUsableHistoricalRankValue(ranks?.school ?? ranks?.rankSchool);
    });
}

function getMissingReportHistoryExamIds(stu, selectedReportExamIds = [], effectiveCurrentExamId = '') {
    const selectedIds = getHistoricalReportExamIds(selectedReportExamIds, effectiveCurrentExamId);
    if (!selectedIds.length) return [];

    const history = getCachedStudentReportHistory(stu, selectedReportExamIds, effectiveCurrentExamId);
    if (!Array.isArray(history) || !history.length) return selectedIds;
    return selectedIds.filter(selectedId => !history.some(item => {
        const examKey = String(item?.examFullKey || item?.examId || '').trim();
        return examKey
            && examKeyEq(examKey, selectedId)
            && hasCompleteSubjectRankComparisonHistory(item);
    }));
}

function getHistoricalReportExamIds(selectedReportExamIds = [], effectiveCurrentExamId = '') {
    return (Array.isArray(selectedReportExamIds) ? selectedReportExamIds : [])
        .map(id => String(id || '').trim())
        .filter(Boolean)
        .filter(id => !effectiveCurrentExamId || !examKeyEq(id, effectiveCurrentExamId));
}

function hydrateStudentReportHistoryInBackground(stu, selectedReportExamIds, effectiveCurrentExamId, token) {
    if (!stu || !window.CloudManager || typeof window.CloudManager.fetchStudentExamHistory !== 'function') return;
    const historicalExamIds = getHistoricalReportExamIds(selectedReportExamIds, effectiveCurrentExamId);
    const cachedHistory = getCachedStudentReportHistory(stu, selectedReportExamIds, effectiveCurrentExamId);
    // A report may be opened before the local comparison selector has a prior
    // exam option. In that case, a score-only PREV_DATA row used to suppress
    // the cloud request and mask the complete subject ranks already in cloud.
    // Do not let a current-exam snapshot (or a stale, unrelated local record)
    // count as prior history. The cloud request is small and is the source of
    // truth for the subject ranks shown in the comparison columns.
    const hasCompletePriorHistory = cachedHistory.some((entry) => {
        const entryExamId = String(entry?.examFullKey || entry?.examId || '').trim();
        return hasCompleteSubjectRankComparisonHistory(entry)
            && (!effectiveCurrentExamId || !entryExamId || !isReportCurrentExamEntry(entryExamId, effectiveCurrentExamId));
    });
    const shouldDiscoverCloudHistory = !hasCompletePriorHistory;
    const missingHistoricalExamIds = historicalExamIds.length
        ? getMissingReportHistoryExamIds(stu, historicalExamIds, effectiveCurrentExamId)
        : [];
    if (!shouldDiscoverCloudHistory && !missingHistoricalExamIds.length) return;
    const hydrateKey = `${getReportStudentIdentity(stu)}::${missingHistoricalExamIds.join('|') || 'discover'}::${effectiveCurrentExamId || ''}`;
    if (ReportHistoryPerfCache.hydratingKeys.has(hydrateKey)) return;
    ReportHistoryPerfCache.hydratingKeys.add(hydrateKey);
    const task = async () => {
        try {
            // The report may be generated by a direct student entry before the
            // lazy module shell applies its `active` class.  The visible report
            // and the current student identity are the reliable ownership
            // checks; relying on the shell class drops a valid cloud hydrate.
            const still = () => {
                if (token !== __reportQueryToken) return false;
                const currentStudent = typeof readCurrentReportStudentState === 'function'
                    ? readCurrentReportStudentState()
                    : window.CURRENT_REPORT_STUDENT;
                if (getReportStudentIdentity(currentStudent || {}) !== getReportStudentIdentity(stu)) return false;
                const reportResult = document.getElementById('single-report-result');
                return document.getElementById('report-generator')?.classList.contains('active')
                    || !!(reportResult && !reportResult.classList.contains('hidden'));
            };
            if (!still()) return;
            // The history endpoint performs the authoritative client/auth
            // validation. Its bootstrap probe may remain pending after login.
            if (window.UI) UI.toast('正在后台同步历史成绩...', 'info');
            const historyRes = await window.CloudManager.fetchStudentExamHistory(stu, {
                examIds: missingHistoricalExamIds,
                currentExamId: effectiveCurrentExamId,
                background: true
            });
            if (!still()) return;
            const loadedCount = applyCloudStudentHistoryToPrevData(stu, historyRes, missingHistoricalExamIds, effectiveCurrentExamId);
            if (!loadedCount || token !== __reportQueryToken) return;
            if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
            if (window.UI) UI.toast(`已后台匹配 ${loadedCount} 次历史成绩`, 'success');
            const refreshedSelectedExamIds = typeof getSelectedReportCompareExamIds === 'function'
                ? getSelectedReportCompareExamIds()
                : selectedReportExamIds;
            await refreshHydratedStudentReport(stu, refreshedSelectedExamIds, effectiveCurrentExamId);
        } catch (e) {
            console.warn('[doQuery] 云端历史后台获取失败:', e);
        } finally {
            ReportHistoryPerfCache.hydratingKeys.delete(hydrateKey);
        }
    };
    window.SystemPerformance.scheduleTask(`report-history-hydrate:${hydrateKey}`, task, {
        delay: 3000,
        idle: true,
        timeout: 6000
    });
}

function syncReportCompareTargetForQuery(stu) {
    if (typeof clearCloudStudentCompareContext === 'function') {
        clearCloudStudentCompareContext();
    } else if (typeof clearCloudStudentCompareContextState === 'function') {
        clearCloudStudentCompareContextState();
    } else if (typeof setCloudStudentCompareContextState === 'function') {
        setCloudStudentCompareContextState(null);
    } else {
        window.CLOUD_STUDENT_COMPARE_CONTEXT = null;
    }

    if (typeof setCloudCompareTarget === 'function') {
        setCloudCompareTarget(stu);
    } else if (typeof setCloudCompareTargetState === 'function') {
        setCloudCompareTargetState(stu);
    } else {
        window.CLOUD_COMPARE_TARGET = {
            name: String(stu?.name || '').trim(),
            class: String(stu?.class || '').trim(),
            school: String(stu?.school || '').trim()
        };
    }
}

function warmStudentCompareRuntimeForReport(stu) {
    if (typeof setCloudCompareTarget === 'function') setCloudCompareTarget(stu);
}

async function doQuery(targetStudent = null) {
    const queryToken = ++__reportQueryToken;
    const name = String(document.getElementById('inp-name')?.value || targetStudent?.name || '').trim();
    const sch = String(document.getElementById('sel-school')?.value || targetStudent?.school || '').trim();
    const cls = String(document.getElementById('sel-class')?.value || targetStudent?.class || '').trim();
    const user = getCurrentUser();

    let stu = targetStudent && typeof targetStudent === 'object' ? targetStudent : null;
    if (!stu) {
        if (window.RankingDataService && typeof window.RankingDataService.findStudent === 'function') {
            stu = window.RankingDataService.findStudent(RAW_DATA, {
                name,
                school: sch,
                className: (cls === '--请先选择学校--') ? '' : cls
            });
        } else {
            const schoolRecord = getAppSchoolRecord(sch);
            stu = (schoolRecord?.students || []).find(s => (
                String(s.name || '').trim() === name
                && (cls === '--请先选择学校--' || !cls || normalizeJumpClass(s.class) === normalizeJumpClass(cls))
            ));
        }
    }
    if (!stu && name) {
        stu = findStudentForJump(name, sch, cls);
    }
    if (!stu) return reportHistorySafeAlert("未找到该学生");
    syncReportControlsToStudent(stu);
    const reportQueryMode = PermissionPolicy.isClassTeacher(user) ? 'homeroom' : 'teaching';
    if (!PermissionPolicy.canQueryStudent(user, stu, { mode: reportQueryMode })) return reportHistorySafeAlert("当前角色没有权限查询该学生");

    const selectedReportExamIds = getSelectedReportCompareExamIds();
    const effectiveCurrentExamId = selectedReportExamIds[selectedReportExamIds.length - 1] || getEffectiveCurrentExamId();
    if (effectiveCurrentExamId) {
        CURRENT_EXAM_ID = effectiveCurrentExamId;
        writeWorkspaceExamId(effectiveCurrentExamId);
    }

    syncReportCompareTargetForQuery(stu);
    setCurrentReportStudentState(stu);
    warmStudentCompareRuntimeForReport(stu);

    const reportCacheKey = buildStudentReportCacheKey(stu, 'FULL', selectedReportExamIds, effectiveCurrentExamId);
    const renderedQueryKey = `${reportCacheKey}::${getReportStudentIdentity(stu)}`;
    if (!targetStudent
        && ReportHistoryPerfCache.inflightReportQueryKey === renderedQueryKey
        && ReportHistoryPerfCache.inflightReportQueryPromise) {
        return ReportHistoryPerfCache.inflightReportQueryPromise;
    }

    const executeReportQuery = async () => {
        const { resultEl, container } = getReportDomCache();
        let reportHistoryForQuery = null;
        const getReportHistoryForQuery = () => {
            if (!reportHistoryForQuery) reportHistoryForQuery = getCachedStudentReportHistory(stu, selectedReportExamIds, effectiveCurrentExamId);
            return reportHistoryForQuery;
        };

        if (resultEl && container) {
            resultEl.classList.remove('hidden');
            try {
                container.classList.add('student-report-canvas-full');
                const reportCache = getStudentReportPerformanceRuntime();
                if (!targetStudent
                    && ReportHistoryPerfCache.lastRenderedReportQueryKey === renderedQueryKey
                    && container.dataset.reportHtmlCacheKey === reportCacheKey
                    && String(container.innerHTML || '').trim()) {
                    scheduleStudentReportCharts(stu, getReportHistoryForQuery());
                    return;
                }
                let reportHtml = reportCache?.getReportHtml?.(reportCacheKey);
                if (!reportHtml) {
                    // A cloud-history refresh immediately follows the first
                    // render.  The report renderer is already present then;
                    // asking the lazy loader to resolve it again can leave a
                    // competing refresh on the loading skeleton.  Reuse the
                    // loaded runtime and only wait when it is genuinely absent.
                    if (!window.__REPORT_RENDER_RUNTIME_PATCHED__
                        && typeof window.ensureReportRenderRuntimeLoaded === 'function') {
                        try {
                            await window.ensureReportRenderRuntimeLoaded();
                        } catch (error) {
                            console.warn('Failed to load report render runtime before query:', error);
                        }
                    }
                    renderStudentReportSkeleton(container, stu);
                    reportHtml = await Promise.resolve(renderSingleReportCardHTML(stu, 'FULL', {
                        reportExamHistory: getReportHistoryForQuery()
                    }));
                    reportCache?.setReportHtml?.(reportCacheKey, reportHtml);
                }
                const nextReportHtml = typeof reportHtml === 'string' ? reportHtml : '';
                if (container.dataset.reportHtmlCacheKey !== reportCacheKey) {
                    container.innerHTML = nextReportHtml;
                    container.dataset.reportHtmlCacheKey = reportCacheKey;
                    container.dataset.reportChartCacheKey = '';
                    enhanceStudentReportMetrics(container);
                }
                ReportHistoryPerfCache.lastRenderedReportQueryKey = renderedQueryKey;
            } catch (e) {
                console.error('Render Report Error:', e);
                container.innerHTML = `<div style="color:red; padding:20px; text-align:left;"><h3 style="color:red">Rendering Error</h3><pre>${e.stack || e.message || e}</pre></div>`;
            }
        }

        const history = getReportHistoryForQuery();

        scheduleStudentReportCharts(stu, history);

        hydrateStudentReportHistoryInBackground(stu, selectedReportExamIds, effectiveCurrentExamId, queryToken);

        const strengthKey = `${getReportStudentIdentity(stu)}::${effectiveCurrentExamId || ''}`;
        scheduleStudentReportStrengthAnalysis(stu, strengthKey);

        const { compareSection } = getReportDomCache();
        if (compareSection && ReportHistoryPerfCache.lastCompareHiddenKey !== strengthKey) {
            ReportHistoryPerfCache.lastCompareHiddenKey = strengthKey;
            compareSection.style.display = 'none';
        }

        const reportScrollKey = `${getReportStudentIdentity(stu)}::${effectiveCurrentExamId || ''}::${selectedReportExamIds.join('|')}`;
        if (ReportHistoryPerfCache.lastScrollKey !== reportScrollKey) {
            ReportHistoryPerfCache.lastScrollKey = reportScrollKey;
            setTimeout(() => {
                const reportElement = document.getElementById('single-report-result');
                if (reportElement) {
                    reportElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 200);
        }
    };

    const queryPromise = executeReportQuery();
    if (!targetStudent) {
        ReportHistoryPerfCache.inflightReportQueryKey = renderedQueryKey;
        ReportHistoryPerfCache.inflightReportQueryPromise = queryPromise;
        try {
            return await queryPromise;
        } finally {
            if (ReportHistoryPerfCache.inflightReportQueryKey === renderedQueryKey) {
                ReportHistoryPerfCache.inflightReportQueryKey = '';
                ReportHistoryPerfCache.inflightReportQueryPromise = null;
            }
        }
    }
    return queryPromise;
}
