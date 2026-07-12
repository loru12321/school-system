// Report history query runtime split from app.js.
function examKeyEq(a, b) {
    const fn = window.isExamKeyEquivalentForCompare;
    if (typeof fn === 'function') return fn(a, b);
    const v = k => { const p = String(k || '').trim().replace(/\s+/g, '_').toLowerCase().split('_').filter(Boolean); return [p.join('_'), p.slice(4).join('_'), p.slice(3).join('_')].filter(Boolean); };
    return v(a).some(key => v(b).includes(key));
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
        return !effectiveCurrentExamId || !examKeyEq(hid, effectiveCurrentExamId);
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
        setPrevDataState(rows);
        ReportHistoryPerfCache.historyByStudent.clear();
        ReportHistoryPerfCache.lastChartScheduleKey = '';
        clearStudentReportCache(stu);
    }
    return historyRes.data.length;
}

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

function hasCachedReportHistoryForSelectedExams(stu, selectedReportExamIds = [], effectiveCurrentExamId = '') {
    return getMissingReportHistoryExamIds(stu, selectedReportExamIds, effectiveCurrentExamId).length === 0;
}

function getMissingReportHistoryExamIds(stu, selectedReportExamIds = [], effectiveCurrentExamId = '') {
    const selectedIds = getHistoricalReportExamIds(selectedReportExamIds, effectiveCurrentExamId);
    if (!selectedIds.length) return [];

    const history = getCachedStudentReportHistory(stu, selectedReportExamIds, effectiveCurrentExamId);
    if (!Array.isArray(history) || !history.length) return selectedIds;
    return selectedIds.filter(selectedId => !history.some(item => {
        const examKey = String(item?.examFullKey || item?.examId || '').trim();
        return examKey && examKeyEq(examKey, selectedId);
    }));
}

function getHistoricalReportExamIds(selectedReportExamIds = [], effectiveCurrentExamId = '') {
    return (Array.isArray(selectedReportExamIds) ? selectedReportExamIds : [])
        .map(id => String(id || '').trim())
        .filter(Boolean)
        .filter(id => !effectiveCurrentExamId || !examKeyEq(id, effectiveCurrentExamId));
}

async function refreshRenderedStudentReportAfterHistory(stu, token) {
    if (token !== __reportQueryToken) return;
    const currentStudent = typeof readCurrentReportStudentState === 'function' ? readCurrentReportStudentState() : null;
    if (getReportStudentIdentity(currentStudent || {}) !== getReportStudentIdentity(stu)) return;

    const container = document.getElementById('report-card-capture-area');
    if (!container || typeof renderSingleReportCardHTML !== 'function') return;
    try {
        container.classList.add('student-report-canvas-full');
        const reportCache = getStudentReportPerformanceRuntime();
        const selectedIds = getStudentReportSelectedExamIds();
        const reportKey = buildStudentReportCacheKey(stu, 'FULL', selectedIds, selectedIds[selectedIds.length - 1] || getEffectiveCurrentExamId());
        const history = getCachedStudentReportHistory(stu, selectedIds, selectedIds[selectedIds.length - 1] || getEffectiveCurrentExamId());
        let reportHtml = reportCache?.getReportHtml?.(reportKey);
        if (!reportHtml) {
            reportHtml = await Promise.resolve(renderSingleReportCardHTML(stu, 'FULL', { reportExamHistory: history }));
            reportCache?.setReportHtml?.(reportKey, reportHtml);
        }
        if (token !== __reportQueryToken) return;
        const nextReportHtml = typeof reportHtml === 'string' ? reportHtml : '';
        if (container.dataset.reportHtmlCacheKey !== reportKey) {
            container.innerHTML = nextReportHtml;
            container.dataset.reportHtmlCacheKey = reportKey;
            container.dataset.reportChartCacheKey = '';
            enhanceStudentReportMetrics(container);
        }
        window.setTimeout(() => {
            if (token !== __reportQueryToken) return;
            scheduleStudentReportCharts(stu, history);
        }, 80);
    } catch (error) {
        console.warn('[doQuery] 云端历史补齐后刷新报告失败:', error);
    }
}

function hydrateStudentReportHistoryInBackground(stu, selectedReportExamIds, effectiveCurrentExamId, token) {
    if (!stu || !window.CloudManager || typeof window.CloudManager.fetchStudentExamHistory !== 'function') return;
    const historicalExamIds = getHistoricalReportExamIds(selectedReportExamIds, effectiveCurrentExamId);
    if (!historicalExamIds.length) return;
    const missingHistoricalExamIds = getMissingReportHistoryExamIds(stu, historicalExamIds, effectiveCurrentExamId);
    if (!missingHistoricalExamIds.length) return;
    const hydrateKey = `${getReportStudentIdentity(stu)}::${missingHistoricalExamIds.join('|')}::${effectiveCurrentExamId || ''}`;
    if (ReportHistoryPerfCache.hydratingKeys.has(hydrateKey)) return;
    ReportHistoryPerfCache.hydratingKeys.add(hydrateKey);
    const task = async () => {
        try {
            const still = () => document.getElementById('report-generator')?.classList.contains('active') && token === __reportQueryToken;
            if (!still()) return;
            const ready = (
                (typeof window.CloudManager.ensureClientReady === 'function' && await window.CloudManager.ensureClientReady({ silent: true })) ||
                (typeof window.CloudManager.check === 'function' && window.CloudManager.check(true))
            );
            if (!ready || token !== __reportQueryToken) return;
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
            await refreshRenderedStudentReportAfterHistory(stu, token);
        } catch (e) {
            console.warn('[doQuery] 云端历史后台获取失败:', e);
        } finally {
            ReportHistoryPerfCache.hydratingKeys.delete(hydrateKey);
        }
    };
    if (window.SystemPerformance && typeof window.SystemPerformance.scheduleTask === 'function') {
        window.SystemPerformance.scheduleTask(`report-history-hydrate:${hydrateKey}`, task, {
            delay: 400,
            idle: true,
            timeout: 3000
        });
    } else if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
        window.setTimeout(() => {
            window.SystemPerformance.scheduleIdle(task, { timeout: 9000 });
        }, 400);
    } else {
        window.setTimeout(task, 400);
    }
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

function scheduleReportComparisonRetry(stu, token) {
    if (!stu || !ReportHistoryPerfCache) return;
    const retryKey = `${getReportStudentIdentity(stu)}::${token}`;
    if (ReportHistoryPerfCache.reportComparisonRetryKey === retryKey) return;
    ReportHistoryPerfCache.reportComparisonRetryKey = retryKey;
    let attempts = 0;
    const retry = () => {
        const activeStudent = typeof readCurrentReportStudentState === 'function'
            ? readCurrentReportStudentState()
            : window.CURRENT_REPORT_STUDENT;
        if (token !== __reportQueryToken
            || !document.getElementById('report-generator')?.classList.contains('active')
            || getReportStudentIdentity(activeStudent || {}) !== getReportStudentIdentity(stu)) {
            return;
        }
        if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
        const selectedIds = getSelectedReportCompareExamIds();
        const currentExamId = selectedIds[selectedIds.length - 1] || getEffectiveCurrentExamId();
        if (getHistoricalReportExamIds(selectedIds, currentExamId).length) {
            ReportHistoryPerfCache.reportComparisonRetryKey = '';
            void doQuery(stu);
            return;
        }
        attempts += 1;
        if (attempts >= 8) {
            ReportHistoryPerfCache.reportComparisonRetryKey = '';
            return;
        }
        ReportHistoryPerfCache.reportComparisonRetryTimer = window.setTimeout(retry, 700);
    };
    retry();
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
    if (!stu) return alert("未找到该学生");
    syncReportControlsToStudent(stu);
    const reportQueryMode = PermissionPolicy.isClassTeacher(user) ? 'homeroom' : 'teaching';
    if (!PermissionPolicy.canQueryStudent(user, stu, { mode: reportQueryMode })) return alert("当前角色没有权限查询该学生");

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
                    if (typeof window.ensureReportRenderRuntimeLoaded === 'function') {
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
        if (!getHistoricalReportExamIds(selectedReportExamIds, effectiveCurrentExamId).length) {
            scheduleReportComparisonRetry(stu, queryToken);
        }

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
