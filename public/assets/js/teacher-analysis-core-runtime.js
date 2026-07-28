(() => {
    if (typeof window === 'undefined' || window.__TEACHER_ANALYSIS_CORE_RUNTIME_PATCHED__) return;

    const normalizeClassFn = typeof window.normalizeClass === 'function'
        ? window.normalizeClass
        : ((value) => String(value || '').trim());
    const normalizeSubjectFn = typeof window.normalizeSubject === 'function'
        ? window.normalizeSubject
        : ((value) => String(value || '').trim());
    const areSchoolNamesEquivalentFn = typeof window.areSchoolNamesEquivalent === 'function'
        ? window.areSchoolNamesEquivalent
        : ((left, right) => String(left || '').trim() === String(right || '').trim());
    const getCurrentUserFn = typeof window.getCurrentUser === 'function'
        ? window.getCurrentUser
        : (() => (window.Auth?.currentUser || null));
    const syncTeacherSchoolContext = typeof window.syncTeacherAnalysisSchoolContext === 'function'
        ? window.syncTeacherAnalysisSchoolContext
        : ((preferredSchool = '') => {
            const nextSchool = String(
                preferredSchool
                || window.DEFAULT_MY_SCHOOL_NAME
                || (window.SchoolState && typeof window.SchoolState.getCurrentSchool === 'function' ? window.SchoolState.getCurrentSchool() : '')
                || window.MY_SCHOOL
                || localStorage.getItem('MY_SCHOOL')
                || ''
            ).trim();
            if (nextSchool) {
                window.MY_SCHOOL = nextSchool;
                localStorage.setItem('MY_SCHOOL', nextSchool);
            }
            return nextSchool;
        });

    function getTeacherExamDateSortTimestamp(exam) {
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

    function teacherNormalizeSchoolName(value) {
        return String(value || '').trim();
    }

    function teacherSameSchoolName(left, right) {
        const leftName = teacherNormalizeSchoolName(left);
        const rightName = teacherNormalizeSchoolName(right);
        if (!leftName || !rightName) return false;
        if (window.PermissionPolicy && typeof window.PermissionPolicy.sameSchoolName === 'function') {
            return window.PermissionPolicy.sameSchoolName(leftName, rightName);
        }
        if (typeof window.areSchoolNamesEquivalent === 'function') {
            return window.areSchoolNamesEquivalent(leftName, rightName);
        }
        return areSchoolNamesEquivalentFn(leftName, rightName);
    }

    // 九年级政治是中考页面的二模参考展示科目。把它只加入单科教师统计/排名，
    // 不回写 SUBJECTS，因此不会进入五科总或任何正式中考汇总公式。
    function getTeacherAnalysisDisplaySubjects() {
        const baseSubjects = Array.isArray(window.SUBJECTS) ? window.SUBJECTS.filter(Boolean) : [];
        const configuredExtras = typeof window.getConfiguredExtraDisplaySubjects === 'function'
            ? window.getConfiguredExtraDisplaySubjects(window.CONFIG || {})
            : [];
        const rows = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
        const result = [...baseSubjects];
        (Array.isArray(configuredExtras) ? configuredExtras : []).forEach((subject) => {
            const normalized = normalizeSubjectFn(subject);
            if (!normalized || result.some((item) => normalizeSubjectFn(item) === normalized)) return;
            if (rows.some((row) => Number.isFinite(teacherToNumber(row?.scores?.[normalized], NaN)))) {
                result.push(normalized);
            }
        });
        return result;
    }

    function teacherSchoolListContains(candidates, schoolName) {
        const targetSchool = teacherNormalizeSchoolName(schoolName);
        if (!targetSchool) return false;
        return (candidates || []).some((candidate) => teacherSameSchoolName(candidate, targetSchool));
    }

    function teacherResolveSchoolKey(schoolName, candidates = Object.keys(window.SCHOOLS || {})) {
        const targetSchool = teacherNormalizeSchoolName(schoolName);
        if (!targetSchool) return '';
        const list = (candidates || []).map(teacherNormalizeSchoolName).filter(Boolean);
        if (list.includes(targetSchool)) return targetSchool;
        return list.find((candidate) => teacherSameSchoolName(candidate, targetSchool)) || targetSchool;
    }

    function teacherGetSchoolRecord(schoolName) {
        const schools = window.SCHOOLS && typeof window.SCHOOLS === 'object' ? window.SCHOOLS : {};
        const schoolKey = teacherResolveSchoolKey(schoolName, Object.keys(schools));
        return schoolKey && schools[schoolKey] ? schools[schoolKey] : null;
    }

    function teacherCollectRowsForSchool(rowMap, schoolName) {
        const targetSchool = teacherNormalizeSchoolName(schoolName);
        if (!targetSchool || !(rowMap instanceof Map)) return [];
        const exactRows = rowMap.get(targetSchool) || [];
        const rows = exactRows.slice();
        rowMap.forEach((schoolRows, rowSchool) => {
            if (rowSchool === targetSchool || !teacherSameSchoolName(rowSchool, targetSchool)) return;
            rows.push(...(schoolRows || []));
        });
        return rows;
    }

    function isTeacherAssignmentScopedToSchool(assignment, schoolName) {
        const explicitSchool = teacherNormalizeSchoolName(assignment?.schoolName);
        const targetSchool = teacherNormalizeSchoolName(schoolName);
        return !explicitSchool || !targetSchool || teacherSameSchoolName(explicitSchool, targetSchool);
    }

    const TEACHER_BASELINE_BANDS = [
        { id: 'top', max: 0.25 },
        { id: 'upper', max: 0.5 },
        { id: 'middle', max: 0.75 },
        { id: 'tail', max: 1.01 }
    ];
    const teacherAnalysisCacheState = {
        signature: '',
        townshipSignature: '',
        historyEntryCache: new Map(),
        statsBySignature: new Map()
    };

    function cacheTeacherStatsForSignature(signature, stats) {
        if (!signature || !stats || typeof stats !== 'object' || !Object.keys(stats).length) return;
        teacherAnalysisCacheState.statsBySignature.set(signature, stats);
        if (teacherAnalysisCacheState.statsBySignature.size > 6) {
            const firstKey = teacherAnalysisCacheState.statsBySignature.keys().next().value;
            if (firstKey) teacherAnalysisCacheState.statsBySignature.delete(firstKey);
        }
    }

    function teacherStableObjectSignature(value) {
        if (!value || typeof value !== 'object') return '';
        return Object.keys(value)
            .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }))
            .map((key) => {
                const item = value[key];
                if (item && typeof item === 'object' && !Array.isArray(item)) {
                    return `${key}:{${teacherStableObjectSignature(item)}}`;
                }
                return `${key}:${String(item ?? '')}`;
            })
            .join('|');
    }

    function buildTeacherRowsFingerprint(rows) {
        const list = Array.isArray(rows) ? rows : [];
        if (typeof window.computeExamDataFingerprint === 'function') {
            return String(window.computeExamDataFingerprint(list) || '').trim();
        }
        return [
            list.length,
            list[0]?.school || '',
            list[0]?.class || '',
            list[0]?.name || '',
            list[list.length - 1]?.school || '',
            list[list.length - 1]?.class || '',
            list[list.length - 1]?.name || ''
        ].join(':');
    }

    function buildTeacherRuntimeSignature(rows, activeSchool = '') {
        const subjectList = getTeacherAnalysisDisplaySubjects();
        const teacherMap = window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object' ? window.TEACHER_MAP : {};
        const teacherSchoolMap = window.TEACHER_SCHOOL_MAP && typeof window.TEACHER_SCHOOL_MAP === 'object' ? window.TEACHER_SCHOOL_MAP : {};
        const baselineId = String(
            window.__PROGRESS_BASELINE_ACTIVE_ID
            || document.getElementById('progressBaselineSelect')?.value
            || ''
        ).trim();
        let baselineEntriesSignature = '';
        try {
            baselineEntriesSignature = (teacherGetRollingBaselineExamEntries(3) || [])
                .map((entry) => [
                    entry?.id || entry?.key || entry?.examId || entry?.name || '',
                    entry?.createdAt || entry?.savedAt || '',
                    Array.isArray(entry?.data) ? entry.data.length : 0
                ].join(':'))
                .join('|');
        } catch {
            baselineEntriesSignature = '';
        }
        return [
            Number(window.__RAW_DATA_VERSION || 0),
            Array.isArray(rows) ? rows.length : 0,
            buildTeacherRowsFingerprint(rows),
            String(window.CURRENT_EXAM_ID || ''),
            String(window.CURRENT_TERM_ID || ''),
            String(window.CONFIG?.name || ''),
            String(activeSchool || ''),
            subjectList.join(','),
            teacherStableObjectSignature(teacherMap),
            teacherStableObjectSignature(teacherSchoolMap),
            baselineId,
            baselineEntriesSignature
        ].join('::');
    }

    function buildTeacherTownshipRankingSignature() {
        const stats = window.TEACHER_STATS && typeof window.TEACHER_STATS === 'object' ? window.TEACHER_STATS : {};
        const statsShape = Object.entries(stats)
            .map(([teacherName, subjectMap]) => `${teacherName}:${Object.entries(subjectMap || {})
                .map(([subject, data]) => `${subject}:${teacherToNumber(data?.avgValue ?? data?.avg, 0).toFixed(4)}:${teacherToNumber(data?.excellentRate, 0).toFixed(6)}:${teacherToNumber(data?.passRate, 0).toFixed(6)}:${teacherToNumber(data?.studentCount, 0)}`)
                .sort()
                .join(',')}`)
            .sort()
            .join('|');
        return [
            Number(window.__RAW_DATA_VERSION || 0),
            Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            Object.keys(window.SCHOOLS || {}).sort().join('|'),
            Object.keys(window.TARGETS || {}).sort().join('|'),
            (window.SUBJECTS || []).join(','),
            teacherNormalizeSchoolName(window.MY_SCHOOL || (window.localStorage && window.localStorage.getItem('MY_SCHOOL')) || ''),
            statsShape
        ].join('::');
    }

    function renderTeacherAnalysisOutputs(renderOptions = {}) {
        if (renderOptions.township !== false && typeof window.calculateTeacherTownshipRanking === 'function') {
            window.calculateTeacherTownshipRanking();
        }
        if (typeof window.refreshTeacherPerformanceCopy === 'function') window.refreshTeacherPerformanceCopy();
        if (renderOptions.render === false) return;
        if (typeof window.renderTeacherCards === 'function') window.renderTeacherCards();
        if (typeof window.renderTeacherComparisonTable === 'function') window.renderTeacherComparisonTable();
        if (typeof window.generateTeacherPairing === 'function') window.generateTeacherPairing();
        if (typeof window.tmScheduleTeachingOverviewRender === 'function') {
            window.tmScheduleTeachingOverviewRender();
        } else if (typeof window.renderTeachingOverview === 'function') {
            window.renderTeachingOverview();
        }
        if (typeof window.tmRenderTeachingModuleStateBars === 'function') window.tmRenderTeachingModuleStateBars('teacher-analysis');
    }

    function createTeacherPerfProbe(label) {
        if (!window.__TEACHER_ANALYSIS_PERF_DEBUG__ || typeof performance === 'undefined') {
            return { mark() {}, flush() {} };
        }
        const rows = [];
        const start = performance.now();
        let last = start;
        return {
            mark(step) {
                const now = performance.now();
                rows.push({
                    label,
                    step,
                    delta: Math.round(now - last),
                    total: Math.round(now - start)
                });
                last = now;
            },
            flush() {
                const now = performance.now();
                rows.push({
                    label,
                    step: 'done',
                    delta: Math.round(now - last),
                    total: Math.round(now - start)
                });
                console.table(rows);
            }
        };
    }

    function teacherClamp(value, min, max) {
        return Math.min(Math.max(Number(value) || 0, min), max);
    }

    function teacherToNumber(value, fallback = 0) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function teacherFormatSigned(value, digits = 1) {
        const num = teacherToNumber(value, 0);
        return `${num >= 0 ? '+' : ''}${num.toFixed(digits)}`;
    }

    function teacherFormatPercent(value, digits = 1) {
        return `${(teacherToNumber(value, 0) * 100).toFixed(digits)}%`;
    }

    function teacherEscapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#39;'
        }[ch]));
    }

    function teacherGetCleanName(value) {
        if (typeof window.getProgressCleanName === 'function') {
            return window.getProgressCleanName(value);
        }
        return String(value || '')
            .replace(/\s+/g, '')
            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '')
            .toLowerCase();
    }

    function teacherIsGrade9Context() {
        if (window.AnalyticsKernel && typeof window.AnalyticsKernel.inferGradeNumber === 'function') {
            return window.AnalyticsKernel.inferGradeNumber({
                config: window.CONFIG,
                examId: window.CURRENT_EXAM_ID,
                examName: window.CONFIG?.name
            }) === 9;
        }
        const grade = Number(window.CONFIG?.grade ?? window.CONFIG?.gradeNumber);
        return Number.isFinite(grade) && grade === 9;
    }

    function teacherGetWeightConfig() {
        return teacherIsGrade9Context()
            ? { avg: 50, exc: 80, pass: 50, total: 180 }
            : { avg: 60, exc: 70, pass: 70, total: 200 };
    }

    function teacherBuildStudentKey(student) {
        const school = String(student?.school || '').trim();
        const cls = normalizeClassFn(student?.class || '');
        const cleanName = teacherGetCleanName(student?.name);
        return `${school}__${cls}__${cleanName}`;
    }

    function teacherBuildBaselineRowKey(row) {
        return `${String(row?.school || '').trim()}__${normalizeClassFn(row?.class || '')}__${teacherGetCleanName(row?.name)}`;
    }

    function teacherResolveThresholds(subject, students = []) {
        const fallbackScores = students
            .map((student) => teacherToNumber(student?.scores?.[subject], NaN))
            .filter((score) => Number.isFinite(score))
            .sort((a, b) => b - a);
        const config = window.THRESHOLDS?.[subject] || {};
        let exc = teacherToNumber(config.exc, NaN);
        let pass = teacherToNumber(config.pass, NaN);
        if (!Number.isFinite(exc) && fallbackScores.length) {
            exc = fallbackScores[Math.max(0, Math.floor(fallbackScores.length * 0.25) - 1)] || 0;
        }
        if (!Number.isFinite(pass) && fallbackScores.length) {
            pass = fallbackScores[Math.min(fallbackScores.length - 1, Math.floor(fallbackScores.length * 0.8))] || 60;
        }
        if (!Number.isFinite(exc)) exc = 0;
        if (!Number.isFinite(pass)) pass = 60;
        return { exc, pass, low: pass * 0.6 };
    }

    function teacherBuildMetricSummary(scores, thresholds) {
        const list = (scores || []).map((score) => teacherToNumber(score, NaN)).filter((score) => Number.isFinite(score));
        if (!list.length) {
            return { count: 0, avg: 0, excellentRate: 0, passRate: 0, lowRate: 0 };
        }
        const total = list.reduce((sum, score) => sum + score, 0);
        return {
            count: list.length,
            avg: total / list.length,
            excellentRate: list.filter((score) => score >= thresholds.exc).length / list.length,
            passRate: list.filter((score) => score >= thresholds.pass).length / list.length,
            lowRate: list.filter((score) => score < thresholds.low).length / list.length
        };
    }

    function teacherMedian(values) {
        const list = (values || [])
            .map((value) => teacherToNumber(value, NaN))
            .filter((value) => Number.isFinite(value))
            .sort((a, b) => a - b);
        if (!list.length) return 0;
        const mid = Math.floor(list.length / 2);
        return list.length % 2 ? list[mid] : (list[mid - 1] + list[mid]) / 2;
    }

    function teacherGetZScore(value, values) {
        const list = (values || []).map((item) => teacherToNumber(item, NaN)).filter((item) => Number.isFinite(item));
        if (list.length <= 1) return 0;
        const mean = list.reduce((sum, item) => sum + item, 0) / list.length;
        const variance = list.reduce((sum, item) => sum + Math.pow(item - mean, 2), 0) / list.length;
        const sd = Math.sqrt(variance);
        if (!sd || !Number.isFinite(sd)) return 0;
        return (teacherToNumber(value, 0) - mean) / sd;
    }

    function teacherBuildSchoolRankMap(students) {
        const ranked = (students || [])
            .map((student) => ({
                key: teacherBuildStudentKey(student),
                total: teacherToNumber(student?.total, NaN)
            }))
            .filter((row) => Number.isFinite(row.total))
            .sort((a, b) => b.total - a.total);
        const map = new Map();
        let lastRank = 0;
        let lastTotal = null;
        ranked.forEach((row, index) => {
            if (lastTotal === null || Math.abs(row.total - lastTotal) > 0.001) {
                lastRank = index + 1;
                lastTotal = row.total;
            }
            map.set(row.key, lastRank);
        });
        return { map, count: ranked.length };
    }

    function teacherResolveBaselineBand(rank, totalCount) {
        if (!Number.isFinite(rank) || rank <= 0 || !totalCount) return 'tail';
        const percentile = (rank - 1) / Math.max(totalCount - 1, 1);
        return (TEACHER_BASELINE_BANDS.find((band) => percentile <= band.max) || TEACHER_BASELINE_BANDS[TEACHER_BASELINE_BANDS.length - 1]).id;
    }

    function teacherBuildFocusTargets(students, subject, thresholds) {
        const excellentEdges = [];
        const passEdges = [];
        const lowRisk = [];
        (students || []).forEach((student) => {
            const score = teacherToNumber(student?.scores?.[subject], NaN);
            if (!Number.isFinite(score)) return;
            const name = String(student?.name || '').trim();
            const school = String(student?.school || '').trim();
            const cls = normalizeClassFn(student?.class || '');
            if (score >= thresholds.exc - 5 && score < thresholds.exc) {
                excellentEdges.push({ name, school, className: cls, score, gap: thresholds.exc - score });
            }
            if (score >= thresholds.pass - 5 && score < thresholds.pass) {
                passEdges.push({ name, school, className: cls, score, gap: thresholds.pass - score });
            }
            if (score < thresholds.low || score <= thresholds.low + 5) {
                lowRisk.push({ name, school, className: cls, score, gap: score - thresholds.low });
            }
        });
        excellentEdges.sort((a, b) => b.score - a.score);
        passEdges.sort((a, b) => b.score - a.score);
        lowRisk.sort((a, b) => a.score - b.score);
        return {
            excellentEdges,
            passEdges,
            lowRisk,
            summaryText: `培优 ${excellentEdges.length} / 临界 ${passEdges.length} / 辅差 ${lowRisk.length}`
        };
    }

    function teacherBuildSampleSnapshot(currentStudents, baselineRows, baselineInfoMap, classes, keyResolver = teacherBuildStudentKey) {
        const classSet = new Set((classes || []).map((item) => normalizeClassFn(item)).filter(Boolean));
        const previousRosterMap = new Map();
        (baselineRows || []).forEach((row) => {
            const cls = normalizeClassFn(row?.class || '');
            if (!classSet.has(cls)) return;
            previousRosterMap.set(teacherBuildBaselineRowKey(row), row);
        });

        let commonCount = 0;
        (currentStudents || []).forEach((student) => {
            const info = baselineInfoMap.get(keyResolver(student));
            if (!info?.row) return;
            commonCount += 1;
            previousRosterMap.set(teacherBuildBaselineRowKey(info.row), info.row);
        });

        const currentCount = Array.isArray(currentStudents) ? currentStudents.length : 0;
        const previousCount = previousRosterMap.size;
        const addedCount = previousCount > 0 ? Math.max(currentCount - commonCount, 0) : 0;
        const exitedCount = previousCount > 0 ? Math.max(previousCount - commonCount, 0) : 0;
        const shiftCount = addedCount + exitedCount;
        const stabilityRate = previousCount > 0 ? (commonCount / Math.max(currentCount, previousCount, 1)) : 0;

        return {
            currentCount,
            previousCount,
            commonCount,
            addedCount,
            exitedCount,
            shiftCount,
            stabilityRate,
            stabilityText: `${Math.round(stabilityRate * 100)}%`,
            summary: previousCount
                ? `共样 ${commonCount} / 新增 ${addedCount} / 退出 ${exitedCount}`
                : `共样 ${commonCount} / 暂无上次班级样本`,
            detailText: previousCount
                ? `上次样本 ${previousCount} 人；本次实考 ${currentCount} 人；共同样本 ${commonCount} 人；新增 ${addedCount} 人；退出 ${exitedCount} 人；样本稳定度 ${Math.round(stabilityRate * 100)}%。`
                : `本次实考 ${currentCount} 人；暂无可对照的上次班级样本。`
        };
    }

    function teacherNormalizeExamStudents(rows) {
        return (rows || []).map((student) => ({
            ...student,
            school: String(student?.school || student?.student?.school || '').trim(),
            class: normalizeClassFn(student?.class || student?.student?.class || ''),
            name: String(student?.name || student?.student?.name || '').trim(),
            total: teacherToNumber(student?.total ?? student?.student?.total, NaN),
            scores: student?.scores || student?.student?.scores || {}
        }));
    }

    function teacherFilterExamStudentsBySchool(rows, schoolName, user, mode = 'teaching') {
        let list = teacherNormalizeExamStudents(rows).filter((student) => (
            !schoolName || teacherSameSchoolName(student.school, schoolName)
        ));
        if (user && window.PermissionPolicy && typeof window.PermissionPolicy.filterStudentRows === 'function') {
            list = window.PermissionPolicy.filterStudentRows(user, list, { mode });
        }
        return list;
    }

    function getProgressBaselineExamList() {
        const db = (typeof window.CohortDB !== 'undefined' && typeof window.CohortDB.ensure === 'function') ? window.CohortDB.ensure() : null;
        return Object.values(db?.exams || {})
            .filter((exam) => exam?.examId && Array.isArray(exam.data) && exam.data.length > 0)
            .map((exam) => ({
                id: exam.examId,
                key: exam.examFullKey || exam.examId,
                examId: exam.examId,
                examFullKey: exam.examFullKey || exam.examId,
                meta: exam.meta || {},
                createdAt: Number(exam.createdAt || 0),
                updatedAt: Number(exam.updatedAt || 0),
                dataCount: exam.data.length
            }))
            .sort((a, b) => getTeacherExamDateSortTimestamp(a) - getTeacherExamDateSortTimestamp(b));
    }

    function resolveProgressBaselineExamEntry(examId) {
        if (!examId) return null;
        const db = (typeof window.CohortDB !== 'undefined' && typeof window.CohortDB.ensure === 'function') ? window.CohortDB.ensure() : null;
        const entries = Object.entries(db?.exams || {});
        if (!entries.length) return null;
        const direct = entries.find(([key, exam]) => {
            const fullKey = String(exam?.examFullKey || '').trim();
            const storedId = String(exam?.examId || '').trim();
            return String(key).trim() === String(examId).trim()
                || fullKey === String(examId).trim()
                || storedId === String(examId).trim()
                || (typeof window.isExamKeyEquivalentForCompare === 'function'
                    && (
                        window.isExamKeyEquivalentForCompare(key, examId)
                        || window.isExamKeyEquivalentForCompare(fullKey, examId)
                        || window.isExamKeyEquivalentForCompare(storedId, examId)
                    ));
        });
        if (!direct) return null;
        const [key, exam] = direct;
        return {
            key,
            examId: exam?.examId || key,
            examFullKey: exam?.examFullKey || exam?.examId || key,
            createdAt: Number(exam?.createdAt || 0),
            updatedAt: Number(exam?.updatedAt || 0),
            data: Array.isArray(exam?.data) ? exam.data : [],
            meta: exam?.meta || {}
        };
    }

    function pickDefaultProgressBaselineExamId(examList) {
        const historicalList = (examList || []).filter((exam) => !window.CURRENT_EXAM_ID || !window.isExamKeyEquivalentForCompare?.(exam.id, window.CURRENT_EXAM_ID));
        if (!historicalList.length) return '';
        if (window.CURRENT_EXAM_ID) {
            const currentIndex = (examList || []).findIndex((exam) => window.isExamKeyEquivalentForCompare?.(exam.id, window.CURRENT_EXAM_ID));
            if (currentIndex > 0) return examList[currentIndex - 1].id;
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
                class: normalizeClassFn(row?.class || student?.class || ''),
                total,
                rank: Number.isFinite(rankValue) && rankValue > 0 ? rankValue : null,
                examId: examId || row?.examId || row?.examFullKey || row?._sourceExam || ''
            };
        }).filter((item) => item.name && Number.isFinite(item.total));

        if (!normalized.length) return [];
        if (normalized.some((item) => !Number.isFinite(item.rank) || item.rank <= 0)) {
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

    function teacherBuildComparableBaselineRows(rows) {
        const normalized = normalizeProgressBaselineRows(rows || []);
        const sorted = normalized
            .map((row) => {
                const total = teacherToNumber(
                    typeof window.recalcPrevTotal === 'function' ? window.recalcPrevTotal(row) : row.total,
                    row.total
                );
                return Number.isFinite(total) ? { ...row, _progressTotal: total } : null;
            })
            .filter(Boolean)
            .sort((left, right) => right._progressTotal - left._progressTotal);
        let lastRank = 0;
        let lastTotal = null;
        sorted.forEach((row, index) => {
            if (lastTotal === null || Math.abs(row._progressTotal - lastTotal) > 0.001) {
                lastRank = index + 1;
                lastTotal = row._progressTotal;
            }
            row._progressSchoolRank = lastRank;
        });
        return sorted;
    }

    function teacherGetRollingBaselineExamEntries(limit = 3) {
        const examList = getProgressBaselineExamList();
        const historicalList = examList.filter((exam) => (
            !window.CURRENT_EXAM_ID || !window.isExamKeyEquivalentForCompare?.(exam.id, window.CURRENT_EXAM_ID)
        ));
        if (!historicalList.length) return [];
        const preferredId = String(
            window.__PROGRESS_BASELINE_ACTIVE_ID
            || document.getElementById('progressBaselineSelect')?.value
            || pickDefaultProgressBaselineExamId(examList)
            || ''
        ).trim();
        const ordered = [];
        const pushEntry = (examId) => {
            if (!examId) return;
            if (ordered.some((item) => (
                window.isExamKeyEquivalentForCompare?.(item.examId, examId)
                || window.isExamKeyEquivalentForCompare?.(item.examFullKey, examId)
            ))) {
                return;
            }
            const entry = resolveProgressBaselineExamEntry(examId);
            if (entry) ordered.push(entry);
        };
        if (preferredId) pushEntry(preferredId);
        historicalList
            .slice()
            .sort((left, right) => getTeacherExamDateSortTimestamp(right) - getTeacherExamDateSortTimestamp(left))
            .forEach((exam) => pushEntry(exam.id));
        return ordered.slice(0, limit);
    }

    function teacherResolveExamTermId(examEntry) {
        const meta = examEntry?.meta || {};
        if (typeof window.buildTeacherTermId === 'function') {
            const termId = window.buildTeacherTermId(meta);
            if (termId) return termId;
        }
        const fullKey = String(examEntry?.examFullKey || examEntry?.examId || '').trim();
        const match = fullKey.match(/(\d{4}-\d{4})[_-](上学期|下学期)/);
        if (match) {
            const grade = String(meta.grade || meta.gradeLabel || '').trim();
            return grade ? `${match[1]}_${match[2]}_${grade}` : `${match[1]}_${match[2]}`;
        }
        return '';
    }

    function teacherResolveHistoryTeacherName(className, subject, termId) {
        if (!termId || typeof window.resolveTeacherHistoryEntry !== 'function') return '';
        const cacheKey = String(termId || '').trim();
        if (!teacherAnalysisCacheState.historyEntryCache.has(cacheKey)) {
            teacherAnalysisCacheState.historyEntryCache.set(cacheKey, window.resolveTeacherHistoryEntry(termId) || null);
        }
        const resolved = teacherAnalysisCacheState.historyEntryCache.get(cacheKey);
        const map = resolved?.map && typeof resolved.map === 'object' ? resolved.map : {};
        const key = `${normalizeClassFn(className)}_${normalizeSubjectFn(subject)}`;
        return String(map[key] || '').trim();
    }

    function teacherEvaluateContinuity(teacherName, subject, classes, baselineContexts = []) {
        const currentTermId = (typeof window.getPreferredTeacherTermId === 'function'
            ? window.getPreferredTeacherTermId()
            : '') || '';
        const teacherNameNorm = teacherGetCleanName(teacherName);
        const detail = [];
        let changed = false;
        let unknown = false;
        (baselineContexts || []).forEach((context) => {
            const termId = String(context?.termId || '').trim();
            if (!termId || !currentTermId || termId === currentTermId) return;
            (classes || []).forEach((className) => {
                const historyTeacher = teacherResolveHistoryTeacherName(className, subject, termId);
                if (!historyTeacher) {
                    unknown = true;
                    detail.push(`${termId} ${className} 任课快照缺失`);
                    return;
                }
                const historyTeacherNorm = teacherGetCleanName(historyTeacher);
                if (historyTeacherNorm !== teacherNameNorm) {
                    changed = true;
                    detail.push(`${termId} ${className} 曾由 ${historyTeacher} 任教`);
                }
            });
        });
        return {
            status: changed ? 'changed' : (unknown ? 'unknown' : 'safe'),
            changed,
            unknown,
            detailText: detail.join('；')
        };
    }

    function teacherBuildConversionMetrics(students, subject, currentThresholds, primaryContext, baselineInfoMap, keyResolver = teacherBuildStudentKey) {
        const neutral = {
            score: 50,
            adjustment: 0,
            eligibleCount: 0,
            excellentHoldRate: null,
            edgeToExcellentRate: null,
            edgeToPassRate: null,
            lowLiftRate: null,
            summary: '暂无可用转化样本',
            detail: '暂无共同样本，无法计算边缘生转化效果。'
        };
        if (!primaryContext?.rawMap || !students?.length) return neutral;

        const prevThresholds = primaryContext.thresholds?.[subject];
        if (!prevThresholds) return neutral;

        let excellentPool = 0;
        let excellentHold = 0;
        let edgeExcellentPool = 0;
        let edgeExcellentHit = 0;
        let edgePassPool = 0;
        let edgePassHit = 0;
        let lowPool = 0;
        let lowLift = 0;
        let matchedCount = 0;

        students.forEach((student) => {
            const info = baselineInfoMap.get(keyResolver(student));
            const primaryRow = info?.primaryRow;
            if (!primaryRow) return;
            const rawPrev = primaryContext.rawMap.get(teacherBuildBaselineRowKey(primaryRow));
            const prevScore = teacherToNumber(rawPrev?.scores?.[subject], NaN);
            const currScore = teacherToNumber(student?.scores?.[subject], NaN);
            if (!Number.isFinite(prevScore) || !Number.isFinite(currScore)) return;
            matchedCount += 1;

            if (prevScore >= prevThresholds.exc) {
                excellentPool += 1;
                if (currScore >= currentThresholds.exc) excellentHold += 1;
            }
            if (prevScore >= prevThresholds.exc - 5 && prevScore < prevThresholds.exc) {
                edgeExcellentPool += 1;
                if (currScore >= currentThresholds.exc) edgeExcellentHit += 1;
            }
            if (prevScore >= prevThresholds.pass - 5 && prevScore < prevThresholds.pass) {
                edgePassPool += 1;
                if (currScore >= currentThresholds.pass) edgePassHit += 1;
            }
            if (prevScore < prevThresholds.low) {
                lowPool += 1;
                if (currScore >= currentThresholds.low) lowLift += 1;
            }
        });

        const parts = [];
        const weights = [];
        const pushPart = (rate, weight) => {
            if (rate === null) return;
            parts.push(rate * 100 * weight);
            weights.push(weight);
        };
        const excellentHoldRate = excellentPool ? excellentHold / excellentPool : null;
        const edgeToExcellentRate = edgeExcellentPool ? edgeExcellentHit / edgeExcellentPool : null;
        const edgeToPassRate = edgePassPool ? edgePassHit / edgePassPool : null;
        const lowLiftRate = lowPool ? lowLift / lowPool : null;
        pushPart(excellentHoldRate, 0.25);
        pushPart(edgeToExcellentRate, 0.25);
        pushPart(edgeToPassRate, 0.30);
        pushPart(lowLiftRate, 0.20);

        const baseScore = weights.length
            ? parts.reduce((sum, item) => sum + item, 0) / weights.reduce((sum, item) => sum + item, 0)
            : 50;
        const reliability = teacherClamp(
            (matchedCount / Math.max(students.length, 1)) * Math.min(1, matchedCount / 10),
            0,
            1
        );
        const adjustment = teacherClamp(((baseScore - 50) / 8) * reliability, -5, 5);

        return {
            score: baseScore,
            adjustment,
            eligibleCount: matchedCount,
            excellentHoldRate,
            edgeToExcellentRate,
            edgeToPassRate,
            lowLiftRate,
            summary: `转优 ${edgeExcellentHit}/${edgeExcellentPool || 0} · 转及格 ${edgePassHit}/${edgePassPool || 0} · 脱低 ${lowLift}/${lowPool || 0}`,
            detail: `优秀保持 ${excellentHold}/${excellentPool || 0}；优秀边缘转优 ${edgeExcellentHit}/${edgeExcellentPool || 0}；及格临界转及格 ${edgePassHit}/${edgePassPool || 0}；低分脱低 ${lowLift}/${lowPool || 0}。`
        };
    }

    function analyzeTeachersV2(options = {}) {
        const perfProbe = createTeacherPerfProbe('analyzeTeachersV2');
        const renderOptions = (options && typeof options === 'object') ? options : {};
        const resolveRowsForTeacherAnalysis = () => {
            if (Array.isArray(window.RAW_DATA) && window.RAW_DATA.length > 0) return window.RAW_DATA;
            const db = (typeof window.CohortDB !== 'undefined' && typeof window.CohortDB.ensure === 'function')
                ? window.CohortDB.ensure()
                : null;
            if (!db?.exams) return [];
            const currentId = window.CURRENT_EXAM_ID || db.currentExamId || '';
            let exam = currentId ? db.exams[currentId] : null;
            if (!exam) {
                const list = Object.values(db.exams).sort((left, right) => getTeacherExamDateSortTimestamp(right) - getTeacherExamDateSortTimestamp(left));
                exam = list[0] || null;
            }
            return Array.isArray(exam?.data) ? exam.data : [];
        };

        const rows = resolveRowsForTeacherAnalysis();
        const useAdminTeacherMetricScope = renderOptions.teacherMetricScope === 'admin'
            || renderOptions.forceAdminTeacherMetricScope === true;
        perfProbe.mark('resolve rows');
        const schools = (typeof window.listAvailableSchoolsForCompare === 'function')
            ? window.listAvailableSchoolsForCompare()
            : Object.keys(window.SCHOOLS || {});
        const inferredSchool = (typeof window.inferDefaultSchoolFromContext === 'function')
            ? window.inferDefaultSchoolFromContext()
            : '';
        const scopedUser = getCurrentUserFn();
        const accessibleSchools = (window.PermissionPolicy && typeof window.PermissionPolicy.getAccessibleSchoolNames === 'function')
            ? window.PermissionPolicy.getAccessibleSchoolNames(scopedUser, schools)
            : schools.slice();
        const canAccessSchool = (schoolName) => !accessibleSchools.length || teacherSchoolListContains(accessibleSchools, schoolName);
        let activeSchool = syncTeacherSchoolContext(
            document.getElementById('mySchoolSelect')?.value
            || window.MY_SCHOOL
            || localStorage.getItem('MY_SCHOOL')
            || inferredSchool
        );

        const teacherAssignments = Object.entries(window.TEACHER_MAP || {})
            .map(([key, teacherName]) => {
                const [rawClass, rawSubject] = String(key || '').split('_');
                const className = normalizeClassFn(rawClass);
                const normalizedSubject = normalizeSubjectFn(rawSubject);
                const schoolName = teacherNormalizeSchoolName((window.TEACHER_SCHOOL_MAP || {})[key]);
                return {
                    key,
                    teacherName,
                    className,
                    normalizedSubject,
                    schoolName
                };
            })
            .filter((item) => item.className && item.normalizedSubject && item.teacherName);
        const teacherClassSetFromMap = new Set(teacherAssignments.map((item) => item.className));

        const inferSchoolFromTeacherMap = () => {
            const classToSchools = new Map();
            rows.forEach((student) => {
                const cls = normalizeClassFn(student?.class);
                const school = String(student?.school || '').trim();
                if (!cls || !school) return;
                if (!classToSchools.has(cls)) classToSchools.set(cls, new Set());
                classToSchools.get(cls).add(school);
            });
            const hitCounts = new Map();
            teacherAssignments.forEach((assignment) => {
                if (assignment.schoolName) {
                    if (canAccessSchool(assignment.schoolName)) {
                        hitCounts.set(assignment.schoolName, (hitCounts.get(assignment.schoolName) || 0) + 1);
                    }
                    return;
                }
                const cls = assignment.className;
                if (!cls || !classToSchools.has(cls)) return;
                classToSchools.get(cls).forEach((school) => {
                    hitCounts.set(school, (hitCounts.get(school) || 0) + 1);
                });
            });
            const ranked = Array.from(hitCounts.entries())
                .filter(([school]) => canAccessSchool(school))
                .sort((a, b) => b[1] - a[1]);
            return ranked[0]?.[0] || '';
        };

        const teacherMapSchool = inferSchoolFromTeacherMap();
        if (teacherMapSchool && !teacherSameSchoolName(teacherMapSchool, activeSchool)) {
            const activeHasTeacherClasses = rows.some((student) => (
                teacherSameSchoolName(student?.school, activeSchool)
                && teacherAssignments.some((assignment) => (
                    isTeacherAssignmentScopedToSchool(assignment, activeSchool)
                    && assignment.className === normalizeClassFn(student?.class)
                ))
            ));
            const hasExplicitTeacherSchoolMap = window.TEACHER_SCHOOL_MAP
                && Object.values(window.TEACHER_SCHOOL_MAP).some((school) => String(school || '').trim());
            if (!activeSchool || !activeHasTeacherClasses || !hasExplicitTeacherSchoolMap) {
                activeSchool = syncTeacherSchoolContext(teacherMapSchool);
            }
        }

        const user = getCurrentUserFn();
        const hasQueryRole = (roleName) => {
            if (window.PermissionPolicy && typeof window.PermissionPolicy.hasQueryRole === 'function') {
                return window.PermissionPolicy.hasQueryRole(user, roleName);
            }
            if (Array.isArray(user?.roles)) return user.roles.includes(roleName);
            return user?.role === roleName;
        };
        const isClassTeacherUser = window.PermissionPolicy && typeof window.PermissionPolicy.isClassTeacher === 'function'
            ? window.PermissionPolicy.isClassTeacher(user)
            : hasQueryRole('class_teacher');
        const isTeacherUser = hasQueryRole('teacher');
        if (user && (isTeacherUser || isClassTeacherUser)) {
            const userNameNorm = String(user.teacher_name || user.name || user.username || '').replace(/\s+/g, '').toLowerCase();
            const classSchoolMap = (typeof window.getClassSchoolMapForAllData === 'function')
                ? window.getClassSchoolMapForAllData()
                : {};
            teacherAssignments.some(({ key, teacherName, className }) => {
                const teacherNameNorm = String(teacherName || '').replace(/\s+/g, '').toLowerCase();
                if (teacherNameNorm !== userNameNorm
                    && !teacherNameNorm.startsWith(`${userNameNorm}(`)
                    && !teacherNameNorm.startsWith(`${userNameNorm}（`)) {
                    return false;
                }
                if (window.TEACHER_SCHOOL_MAP && window.TEACHER_SCHOOL_MAP[key]) {
                    activeSchool = window.TEACHER_SCHOOL_MAP[key];
                    return true;
                }
                if (classSchoolMap[className]) {
                    activeSchool = classSchoolMap[className];
                    return true;
                }
                return false;
            });
            if (activeSchool) {
                activeSchool = syncTeacherSchoolContext(activeSchool);
            }
        }

        if (activeSchool && accessibleSchools.length && !canAccessSchool(activeSchool)) activeSchool = '';
        if (!activeSchool && accessibleSchools.length === 1) activeSchool = syncTeacherSchoolContext(accessibleSchools[0]);
        if (!activeSchool) {
            const firstFromRows = rows.find((row) => canAccessSchool(String(row?.school || '').trim()));
            if (firstFromRows) activeSchool = syncTeacherSchoolContext(String(firstFromRows.school).trim());
        }
        if (!activeSchool) {
            window.UI.alert('请先选择本校');
            return;
        }
        syncTeacherSchoolContext(activeSchool);
        perfProbe.mark('resolve school');

        if (window.DataManager && typeof window.DataManager.ensureTeacherMap === 'function') {
            const ok = window.DataManager.ensureTeacherMap(false);
            if (!ok) {
                if (window.UI) window.UI.toast('请先同步教师任课表后再分析', 'warning');
                return;
            }
        }

        const runtimeSignature = `${buildTeacherRuntimeSignature(rows, activeSchool)}::teacherMetricScope:${useAdminTeacherMetricScope ? 'admin' : 'role'}`;
        const preserveCurrentStats = renderOptions.preserveCurrentStats === true;
        const cachedStats = teacherAnalysisCacheState.statsBySignature.get(runtimeSignature);
        if (renderOptions.force !== true && cachedStats && Object.keys(cachedStats || {}).length) {
            if (!preserveCurrentStats) {
                window.TEACHER_STATS = cachedStats;
                teacherAnalysisCacheState.signature = runtimeSignature;
                renderTeacherAnalysisOutputs(renderOptions);
            }
            perfProbe.mark('cached stats');
            perfProbe.flush();
            return cachedStats;
        }
        if (renderOptions.force !== true
            && teacherAnalysisCacheState.signature === runtimeSignature
            && window.TEACHER_STATS
            && Object.keys(window.TEACHER_STATS).length) {
            cacheTeacherStatsForSignature(runtimeSignature, window.TEACHER_STATS);
            renderTeacherAnalysisOutputs(renderOptions);
            perfProbe.mark('cached render');
            perfProbe.flush();
            return window.TEACHER_STATS;
        }

        const previousStatsForPreserve = preserveCurrentStats ? window.TEACHER_STATS : null;
        const previousSignatureForPreserve = preserveCurrentStats ? teacherAnalysisCacheState.signature : '';
        window.TEACHER_STATS = {};
        teacherAnalysisCacheState.historyEntryCache = new Map();
        const classSchoolMap = (typeof window.getClassSchoolMapForAllData === 'function')
            ? window.getClassSchoolMapForAllData()
            : {};
        const teacherAssignmentsForActiveSchool = teacherAssignments.filter((assignment) => (
            isTeacherAssignmentScopedToSchool(assignment, activeSchool)
        ));
        const normalizedRows = rows.map((student) => ({
            ...student,
            school: String(student?.school || '').trim(),
            class: normalizeClassFn(student?.class),
            scores: student?.scores || {}
        }));
        const studentsBySchool = new Map();
        const studentsByClass = new Map();
        normalizedRows.forEach((student) => {
            if (student.school) {
                if (!studentsBySchool.has(student.school)) studentsBySchool.set(student.school, []);
                studentsBySchool.get(student.school).push(student);
            }
            if (student.class) {
                if (!studentsByClass.has(student.class)) studentsByClass.set(student.class, []);
                studentsByClass.get(student.class).push(student);
            }
        });
        const teacherClassSet = new Set(teacherAssignmentsForActiveSchool.map((item) => item.className));
        const pickTeacherStudentsForSchool = (schoolName) => {
            const targetSchool = String(schoolName || '').trim();
            if (!targetSchool) return [];
            const directRows = teacherCollectRowsForSchool(studentsBySchool, targetSchool);
            if (directRows.length) return directRows;
            const fallbackRows = [];
            teacherClassSet.forEach((cls) => {
                if (!teacherSameSchoolName(classSchoolMap[cls], targetSchool)) return;
                const classRows = studentsByClass.get(cls);
                if (classRows && classRows.length) fallbackRows.push(...classRows);
            });
            return fallbackRows;
        };
        const hasTeacherStudentsForSchool = (schoolName) => {
            const targetSchool = String(schoolName || '').trim();
            if (!targetSchool) return false;
            if (teacherCollectRowsForSchool(studentsBySchool, targetSchool).length) return true;
            let found = false;
            teacherClassSet.forEach((cls) => {
                if (found || !teacherSameSchoolName(classSchoolMap[cls], targetSchool)) return;
                found = !!(studentsByClass.get(cls) || []).length;
            });
            return found;
        };
        let mySchoolStudents = pickTeacherStudentsForSchool(activeSchool);
        if (!mySchoolStudents.length) {
            const fallbackSchool = teacherMapSchool || inferredSchool || schools.find(hasTeacherStudentsForSchool);
            if (fallbackSchool && !teacherSameSchoolName(fallbackSchool, activeSchool)) {
                activeSchool = syncTeacherSchoolContext(fallbackSchool);
                mySchoolStudents = pickTeacherStudentsForSchool(activeSchool);
            }
        }
        const queryMode = isClassTeacherUser ? 'homeroom' : 'teaching';
        const useSchoolWideTeacherPeerScope = useAdminTeacherMetricScope || (isTeacherUser && !isClassTeacherUser);
        if (!useSchoolWideTeacherPeerScope && window.PermissionPolicy && typeof window.PermissionPolicy.filterStudentRows === 'function') {
            mySchoolStudents = window.PermissionPolicy.filterStudentRows(user, mySchoolStudents, { mode: queryMode });
            if (!mySchoolStudents.length && teacherMapSchool && !teacherSameSchoolName(teacherMapSchool, activeSchool)) {
                activeSchool = syncTeacherSchoolContext(teacherMapSchool);
                mySchoolStudents = window.PermissionPolicy.filterStudentRows(user, pickTeacherStudentsForSchool(activeSchool), { mode: queryMode });
            }
        }
        if (!mySchoolStudents.length) {
            if (preserveCurrentStats) {
                window.TEACHER_STATS = previousStatsForPreserve;
                teacherAnalysisCacheState.signature = previousSignatureForPreserve;
            }
            return;
        }
        const studentKeyCache = new WeakMap();
        const getStudentKey = (student) => {
            if (!student || typeof student !== 'object') return teacherBuildStudentKey(student);
            if (!studentKeyCache.has(student)) studentKeyCache.set(student, teacherBuildStudentKey(student));
            return studentKeyCache.get(student);
        };
        perfProbe.mark('scope students');

        const displaySubjects = getTeacherAnalysisDisplaySubjects();
        const subjectList = displaySubjects.length
            ? displaySubjects
            : [...new Set(mySchoolStudents.flatMap((student) => Object.keys(student.scores || {})).map(normalizeSubjectFn))];
        const subjectByNormalized = new Map(subjectList.map((subject) => [normalizeSubjectFn(subject), subject]));
        const studentsByClassSubject = new Map();
        mySchoolStudents.forEach((student) => {
            const className = normalizeClassFn(student?.class || '');
            if (!className || !student?.scores) return;
            Object.keys(student.scores || {}).forEach((rawSubject) => {
                if (!Number.isFinite(teacherToNumber(student.scores[rawSubject], NaN))) return;
                const subjectKey = normalizeSubjectFn(rawSubject);
                if (!subjectKey) return;
                const indexKey = `${className}__${subjectKey}`;
                if (!studentsByClassSubject.has(indexKey)) studentsByClassSubject.set(indexKey, []);
                studentsByClassSubject.get(indexKey).push(student);
            });
        });
        const weightConfig = teacherGetWeightConfig();
        const gradeStats = {};
        subjectList.forEach((subject) => {
            gradeStats[subject] = teacherResolveThresholds(subject, mySchoolStudents);
            const subjectSummary = teacherBuildMetricSummary(
                mySchoolStudents.map((student) => teacherToNumber(student?.scores?.[subject], NaN)),
                gradeStats[subject]
            );
            gradeStats[subject].avg = subjectSummary.avg;
        });
        perfProbe.mark('grade stats');

        const schoolRankMap = teacherBuildSchoolRankMap(mySchoolStudents);
        const requestedHistoryLimit = Number(renderOptions.historyLimit);
        const rollingBaselineLimit = Number.isFinite(requestedHistoryLimit)
            ? Math.max(0, Math.min(3, Math.floor(requestedHistoryLimit)))
            : 1;
        const rollingBaselineEntries = teacherGetRollingBaselineExamEntries(rollingBaselineLimit);
        const baselineContexts = rollingBaselineEntries.map((entry) => {
            const examStudents = teacherFilterExamStudentsBySchool(
                entry?.data || [],
                activeSchool,
                useSchoolWideTeacherPeerScope ? null : user,
                queryMode
            );
            const rowsForCompare = teacherBuildComparableBaselineRows(examStudents);
            const indexes = rowsForCompare.length && typeof window.buildProgressPreviousMatchIndex === 'function'
                ? window.buildProgressPreviousMatchIndex(rowsForCompare)
                : null;
            const rawMap = new Map();
            examStudents.forEach((student) => {
                rawMap.set(teacherBuildBaselineRowKey(student), student);
            });
            const thresholdsBySubject = {};
            subjectList.forEach((subject) => {
                thresholdsBySubject[subject] = teacherResolveThresholds(subject, examStudents);
            });
            return {
                entry,
                termId: teacherResolveExamTermId(entry),
                rows: rowsForCompare,
                indexes,
                students: examStudents,
                rawMap,
                thresholds: thresholdsBySubject
            };
        }).filter((context) => Array.isArray(context.rows) && context.rows.length > 0);
        perfProbe.mark('baseline contexts');
        const primaryBaselineContext = baselineContexts[0] || null;
        const primaryBaselineRows = primaryBaselineContext?.rows || [];
        const baselineInfoMap = new Map();
        const expectationMap = {};

        subjectList.forEach((subject) => {
            expectationMap[subject] = {
                overall: teacherBuildMetricSummary(
                    mySchoolStudents.map((student) => teacherToNumber(student?.scores?.[subject], NaN)),
                    gradeStats[subject]
                ),
                bands: {}
            };
            TEACHER_BASELINE_BANDS.forEach((band) => {
                expectationMap[subject].bands[band.id] = null;
            });
        });

        mySchoolStudents.forEach((student) => {
            const key = getStudentKey(student);
            const currentRank = teacherToNumber(
                typeof window.safeGet === 'function'
                    ? window.safeGet(student, 'ranks.total.school', schoolRankMap.map.get(key))
                    : schoolRankMap.map.get(key),
                schoolRankMap.map.get(key) || 0
            );
            const historyMatches = [];
            baselineContexts.forEach((context, index) => {
                if (!context.indexes || typeof window.resolveProgressBaselineMatch !== 'function') return;
                const match = window.resolveProgressBaselineMatch(student, context.indexes);
                if (!match?.row) return;
                historyMatches.push({
                    row: match.row,
                    matchType: match.matchType || 'missing',
                    matchLabel: match.matchLabel || '暂无历史',
                    examId: context.entry?.examId || '',
                    examFullKey: context.entry?.examFullKey || '',
                    termId: context.termId || '',
                    order: index
                });
            });
            const primaryMatch = historyMatches[0] || null;
            const rankSamples = historyMatches
                .map((item) => teacherToNumber(item.row?._progressSchoolRank || item.row?.rankSchool || item.row?.rank, NaN))
                .filter((value) => Number.isFinite(value));
            const medianRank = rankSamples.length ? teacherMedian(rankSamples) : NaN;
            baselineInfoMap.set(key, {
                row: primaryMatch?.row || null,
                primaryRow: primaryMatch?.row || null,
                historyMatches,
                bandId: teacherResolveBaselineBand(medianRank, primaryBaselineRows.length || 0),
                baselineRank: medianRank,
                currentRank,
                matchType: primaryMatch?.matchType || 'missing',
                matchLabel: primaryMatch?.matchLabel || '暂无历史',
                rollingMatchCount: historyMatches.length
            });
        });
        perfProbe.mark('baseline matches');

        subjectList.forEach((subject) => {
            const buckets = {};
            TEACHER_BASELINE_BANDS.forEach((band) => {
                buckets[band.id] = [];
            });
            mySchoolStudents.forEach((student) => {
                const score = teacherToNumber(student?.scores?.[subject], NaN);
                if (!Number.isFinite(score)) return;
                const info = baselineInfoMap.get(getStudentKey(student));
                if (!info?.historyMatches?.length) return;
                buckets[info.bandId || 'tail'].push(score);
            });
            TEACHER_BASELINE_BANDS.forEach((band) => {
                const bucketSummary = teacherBuildMetricSummary(buckets[band.id], gradeStats[subject]);
                expectationMap[subject].bands[band.id] = bucketSummary.count >= 3
                    ? bucketSummary
                    : expectationMap[subject].overall;
            });
        });
        perfProbe.mark('expectations');

        teacherAssignmentsForActiveSchool.forEach(({ teacherName, className, normalizedSubject }) => {
            const matchedSubject = subjectByNormalized.get(normalizedSubject);
            if (!matchedSubject) return;
            if (!window.TEACHER_STATS[teacherName]) window.TEACHER_STATS[teacherName] = {};
            if (!window.TEACHER_STATS[teacherName][matchedSubject]) {
                window.TEACHER_STATS[teacherName][matchedSubject] = {
                    classes: [],
                    students: [],
                    subject: matchedSubject
                };
            }
            const teacherStudents = studentsByClassSubject.get(`${className}__${normalizedSubject}`) || [];
            window.TEACHER_STATS[teacherName][matchedSubject].classes.push(className);
            window.TEACHER_STATS[teacherName][matchedSubject].students.push(...teacherStudents);
        });
        perfProbe.mark('teacher groups');

        const subjectGroups = {};
        Object.keys(window.TEACHER_STATS).forEach((teacherName) => {
            Object.keys(window.TEACHER_STATS[teacherName]).forEach((subject) => {
                const data = window.TEACHER_STATS[teacherName][subject];
                const studentMap = new Map();
                (data.students || []).forEach((student) => {
                    studentMap.set(getStudentKey(student), student);
                });
                const students = Array.from(studentMap.values());
                data.students = students;
                data.classes = [...new Set((data.classes || []).filter(Boolean))].sort();
                data.classesText = data.classes.join(',');

                const thresholds = gradeStats[subject] || teacherResolveThresholds(subject, students);
                const summary = teacherBuildMetricSummary(
                    students.map((student) => teacherToNumber(student?.scores?.[subject], NaN)),
                    thresholds
                );
                data.thresholds = thresholds;
                data.studentCount = summary.count;
                data.totalScore = students.reduce((sum, student) => sum + teacherToNumber(student?.scores?.[subject], 0), 0);
                data.avgValue = summary.avg;
                data.avg = summary.avg.toFixed(2);
                data.excellentRate = summary.excellentRate;
                data.passRate = summary.passRate;
                data.lowRate = summary.lowRate;
                data.excellentCount = Math.round(summary.excellentRate * summary.count);
                data.passCount = Math.round(summary.passRate * summary.count);
                data.lowCount = Math.round(summary.lowRate * summary.count);
                data.contributionValue = summary.avg - teacherToNumber(gradeStats[subject]?.avg, 0);
                data.contribution = data.contributionValue.toFixed(2);

                const expectedAccumulator = { avg: 0, exc: 0, pass: 0, low: 0, count: 0 };
                let rollingMatchedCount = 0;
                let primaryMatchedCount = 0;
                students.forEach((student) => {
                    const info = baselineInfoMap.get(getStudentKey(student));
                    const fallback = expectationMap[subject]?.overall || teacherBuildMetricSummary([], thresholds);
                    const expected = info?.historyMatches?.length
                        ? (expectationMap[subject]?.bands?.[info.bandId] || fallback)
                        : fallback;
                    if (info?.historyMatches?.length) rollingMatchedCount += 1;
                    if (info?.primaryRow) primaryMatchedCount += 1;
                    expectedAccumulator.avg += teacherToNumber(expected?.avg, 0);
                    expectedAccumulator.exc += teacherToNumber(expected?.excellentRate, 0);
                    expectedAccumulator.pass += teacherToNumber(expected?.passRate, 0);
                    expectedAccumulator.low += teacherToNumber(expected?.lowRate, 0);
                    expectedAccumulator.count += 1;
                });

                const divisor = Math.max(expectedAccumulator.count, 1);
                data.expectedAvg = expectedAccumulator.avg / divisor;
                data.expectedExcellentRate = expectedAccumulator.exc / divisor;
                data.expectedPassRate = expectedAccumulator.pass / divisor;
                data.expectedLowRate = expectedAccumulator.low / divisor;
                data.baselineMatchedCount = rollingMatchedCount;
                data.primaryMatchedCount = primaryMatchedCount;
                data.baselineCoverage = data.studentCount ? rollingMatchedCount / data.studentCount : 0;
                data.baselineCoverageText = `${Math.round(data.baselineCoverage * 100)}%`;
                data.deltaAvg = data.avgValue - data.expectedAvg;
                data.deltaExcellentRate = data.excellentRate - data.expectedExcellentRate;
                data.deltaPassRate = data.passRate - data.expectedPassRate;
                data.deltaLowBetter = data.expectedLowRate - data.lowRate;
                data.focusTargets = teacherBuildFocusTargets(students, subject, thresholds);
                data.focusSummary = data.focusTargets.summaryText;
                const sampleSnapshot = teacherBuildSampleSnapshot(students, primaryBaselineRows, baselineInfoMap, data.classes, getStudentKey);
                data.commonSampleCount = sampleSnapshot.commonCount;
                data.previousSampleCount = sampleSnapshot.previousCount;
                data.addedSampleCount = sampleSnapshot.addedCount;
                data.exitedSampleCount = sampleSnapshot.exitedCount;
                data.sampleShiftCount = sampleSnapshot.shiftCount;
                data.sampleStabilityRate = sampleSnapshot.stabilityRate;
                data.sampleStabilityText = sampleSnapshot.stabilityText;
                data.sampleSummary = sampleSnapshot.summary;
                data.sampleDetailText = sampleSnapshot.detailText;
                data.sampleWarning = sampleSnapshot.stabilityRate < 0.75 || sampleSnapshot.shiftCount >= 3;
                data.teacherContinuity = teacherEvaluateContinuity(teacherName, subject, data.classes, baselineContexts);
                data.teacherContinuityText = data.teacherContinuity.detailText || (data.teacherContinuity.status === 'safe' ? '任课连续' : '跨学期任课待核验');
                data.teacherChangeProtected = data.teacherContinuity.status === 'changed' || data.teacherContinuity.status === 'unknown';
                data.conversionMetrics = teacherBuildConversionMetrics(students, subject, thresholds, primaryBaselineContext, baselineInfoMap, getStudentKey);
                data.conversionScore = teacherToNumber(data.conversionMetrics.score, 50);
                data.conversionAdjustment = teacherToNumber(data.conversionMetrics.adjustment, 0);
                data.conversionSummary = data.conversionMetrics.summary;
                data.baselineExamId = String(
                    window.__PROGRESS_BASELINE_ACTIVE_ID
                    || document.getElementById('progressBaselineSelect')?.value
                    || ''
                ).trim();
                data.ratedAvg = 0;
                data.ratedExc = 0;
                data.ratedPass = 0;
                data.leagueScoreRaw = 0;
                data.leagueScore = 0;
                data.baselineAdjustment = 0;
                data.workloadAdjustment = 0;
                data.confidenceFactor = 1;
                data.fairScore = 0;
                data.finalScore = '0.0';
                data.fairRank = 0;

                if (!subjectGroups[subject]) subjectGroups[subject] = [];
                subjectGroups[subject].push({ teacherName, data });
            });
        });
        perfProbe.mark('teacher metrics');

        Object.entries(subjectGroups).forEach(([subject, entries]) => {
            const maxAvg = Math.max(...entries.map((entry) => teacherToNumber(entry.data.avgValue, 0)), 0);
            const maxExc = Math.max(...entries.map((entry) => teacherToNumber(entry.data.excellentRate, 0)), 0);
            const maxPass = Math.max(...entries.map((entry) => teacherToNumber(entry.data.passRate, 0)), 0);
            const medianCount = teacherMedian(entries.map((entry) => teacherToNumber(entry.data.studentCount, 0))) || 1;
            const deltaAvgList = entries.map((entry) => entry.data.deltaAvg);
            const deltaExcList = entries.map((entry) => entry.data.deltaExcellentRate);
            const deltaPassList = entries.map((entry) => entry.data.deltaPassRate);
            const deltaLowList = entries.map((entry) => entry.data.deltaLowBetter);

            entries.forEach(({ data }) => {
                data.ratedAvg = maxAvg > 0 ? (data.avgValue / maxAvg) * weightConfig.avg : 0;
                data.ratedExc = maxExc > 0 ? (data.excellentRate / maxExc) * weightConfig.exc : 0;
                data.ratedPass = maxPass > 0 ? (data.passRate / maxPass) * weightConfig.pass : 0;
                data.leagueScoreRaw = data.ratedAvg + data.ratedExc + data.ratedPass;
                data.leagueScore = weightConfig.total > 0 ? (data.leagueScoreRaw / weightConfig.total) * 100 : 0;

                let baselineReliability = data.baselineMatchedCount > 0
                    ? teacherClamp(
                        (data.baselineCoverage * 0.4)
                        + (teacherToNumber(data.sampleStabilityRate, 0) * 0.4)
                        + ((Math.min(data.baselineMatchedCount, 20) / 20) * 0.2),
                        0,
                        1
                    )
                    : 0;
                if (data.teacherChangeProtected) baselineReliability = 0;
                if (data.commonSampleCount < 5) baselineReliability = 0;
                const baselineAdjustment = (
                    teacherGetZScore(data.deltaAvg, deltaAvgList) * 6
                    + teacherGetZScore(data.deltaExcellentRate, deltaExcList) * 5
                    + teacherGetZScore(data.deltaPassRate, deltaPassList) * 5
                    + teacherGetZScore(data.deltaLowBetter, deltaLowList) * 4
                ) * baselineReliability;
                data.baselineAdjustment = teacherClamp(baselineAdjustment, -20, 20);

                const workloadDiff = Math.sqrt(Math.max(data.studentCount, 0)) - Math.sqrt(Math.max(medianCount, 1));
                data.workloadAdjustment = teacherClamp(workloadDiff * 2.4, -3, 3);
                const sampleFactor = teacherClamp(Math.sqrt(Math.max(data.studentCount, 1) / Math.max(medianCount, 1)), 0, 1);
                const stabilityFactor = teacherToNumber(data.sampleStabilityRate, 0) > 0
                    ? teacherToNumber(data.sampleStabilityRate, 0)
                    : 0.35;
                data.confidenceFactor = teacherClamp(0.88 + 0.12 * ((sampleFactor + Math.max(baselineReliability, stabilityFactor)) / 2), 0.85, 1);
                const conversionAdjustment = data.teacherChangeProtected
                    ? 0
                    : teacherClamp(teacherToNumber(data.conversionAdjustment, 0), -5, 5);
                data.conversionAdjustment = conversionAdjustment;
                data.fairScore = teacherClamp(
                    data.leagueScore * data.confidenceFactor + data.baselineAdjustment + data.workloadAdjustment + conversionAdjustment,
                    0,
                    100
                );
                data.finalScore = data.fairScore.toFixed(1);
                data.sampleWarning = data.sampleWarning || data.teacherChangeProtected;
                data.riskLevel = (data.fairScore < 60
                    || data.lowRate >= 0.12
                    || data.baselineAdjustment <= -6
                    || data.teacherChangeProtected)
                    ? 'risk'
                    : 'normal';
            });

            entries.sort((left, right) => right.data.fairScore - left.data.fairScore).forEach((entry, index) => {
                entry.data.fairRank = index + 1;
            });
        });
        perfProbe.mark('fair scoring');

        const computedStats = window.TEACHER_STATS;
        cacheTeacherStatsForSignature(runtimeSignature, computedStats);
        teacherAnalysisCacheState.signature = runtimeSignature;
        if (preserveCurrentStats) {
            window.TEACHER_STATS = previousStatsForPreserve;
            teacherAnalysisCacheState.signature = previousSignatureForPreserve;
            perfProbe.mark('cache detached stats');
            perfProbe.flush();
            return computedStats;
        }
        renderTeacherAnalysisOutputs(renderOptions);
        perfProbe.mark('render outputs');
        perfProbe.flush();
        return computedStats;
    }

    function calculateTeacherTownshipRanking(options = {}) {
        let sourceTeacherStats = options.teacherStats || null;
        if (!sourceTeacherStats && options.teacherMetricScope === 'admin' && typeof analyzeTeachersV2 === 'function') {
            const previousStats = window.TEACHER_STATS;
            const previousSignature = teacherAnalysisCacheState.signature;
            try {
                sourceTeacherStats = analyzeTeachersV2({
                    force: options.force === true,
                    render: false,
                    township: false,
                    teacherMetricScope: 'admin',
                    preserveCurrentStats: true
                }) || {};
            } finally {
                window.TEACHER_STATS = previousStats;
                teacherAnalysisCacheState.signature = previousSignature;
            }
        }
        const teacherStatsSource = sourceTeacherStats || window.TEACHER_STATS || {};
        const signature = `${buildTeacherTownshipRankingSignature()}::teacherMetricScope:${options.teacherMetricScope === 'admin' ? 'admin' : 'current'}::${teacherStableObjectSignature(teacherStatsSource)}`;
        if (options.force !== true
            && teacherAnalysisCacheState.townshipSignature === signature
            && window.TEACHER_TOWNSHIP_RANKINGS
            && window.TOWNSHIP_RANKING_DATA
            && Object.keys(window.TOWNSHIP_RANKING_DATA || {}).length) {
            return window.TEACHER_TOWNSHIP_RANKINGS;
        }
        window.TEACHER_TOWNSHIP_RANKINGS = {};
        window.TOWNSHIP_RANKING_DATA = {};
        window.TEACHER_TOWNSHIP_AVERAGES = {};
        const hasTownshipSchoolHelper = typeof window.getTownshipManagedSchoolNames === 'function';
        const townshipSchoolSet = new Set(
            hasTownshipSchoolHelper
                ? window.getTownshipManagedSchoolNames(Object.keys(window.SCHOOLS || {}))
                : Object.keys(window.SCHOOLS || {})
        );
        const townshipSchoolList = Array.from(townshipSchoolSet);
        const townshipSchoolEligibilityCache = new Map();
        const isTownshipSchoolName = (schoolName) => {
            const normalizedSchool = String(schoolName || '').trim();
            if (townshipSchoolEligibilityCache.has(normalizedSchool)) {
                return townshipSchoolEligibilityCache.get(normalizedSchool);
            }
            let matched = false;
            if (!hasTownshipSchoolHelper) {
                townshipSchoolEligibilityCache.set(normalizedSchool, true);
                return true;
            }
            if (typeof window.isTownshipManagedSchool === 'function') {
                if (window.isTownshipManagedSchool(normalizedSchool, Object.keys(window.SCHOOLS || {}))) matched = true;
            }
            if (!matched) {
                matched = townshipSchoolSet.has(normalizedSchool)
                    || townshipSchoolList.some((item) => teacherSameSchoolName(item, normalizedSchool));
            }
            townshipSchoolEligibilityCache.set(normalizedSchool, matched);
            return matched;
        };
        const buildTownshipAverage = (subject) => {
            let rawCount = 0;
            let rawTotal = 0;
            const rawRows = [];
            const rawScores = [];
            (window.RAW_DATA || []).forEach((row) => {
                const schoolName = String(row?.school || '').trim();
                const score = teacherToNumber(row?.scores?.[subject], NaN);
                if (!Number.isFinite(score)) return;
                if (schoolName ? !isTownshipSchoolName(schoolName) : hasTownshipSchoolHelper) return;
                rawRows.push(row);
                rawScores.push(score);
                rawCount += 1;
                rawTotal += score;
            });
            if (rawCount) {
                const thresholds = teacherResolveThresholds(subject, rawRows);
                const rawExcCount = rawScores.filter((score) => score >= thresholds.exc).length;
                const rawPassCount = rawScores.filter((score) => score >= thresholds.pass).length;
                return {
                    avg: rawTotal / rawCount,
                    excRate: rawExcCount / rawCount,
                    passRate: rawPassCount / rawCount,
                    count: rawCount,
                    source: 'raw'
                };
            }

            let weightedCount = 0;
            let avgTotal = 0;
            let excTotal = 0;
            let passTotal = 0;
            Object.keys(window.SCHOOLS || {}).forEach((schoolName) => {
                if (!isTownshipSchoolName(schoolName)) return;
                const metrics = window.SCHOOLS?.[schoolName]?.metrics?.[subject];
                const count = teacherToNumber(metrics?.count, 0);
                if (!metrics || count <= 0) return;
                weightedCount += count;
                avgTotal += teacherToNumber(metrics.avg, 0) * count;
                excTotal += teacherToNumber(metrics.excRate, 0) * count;
                passTotal += teacherToNumber(metrics.passRate, 0) * count;
            });
            if (weightedCount <= 0) return null;
            return {
                avg: avgTotal / weightedCount,
                excRate: excTotal / weightedCount,
                passRate: passTotal / weightedCount,
                count: weightedCount,
                source: 'school-metrics'
            };
        };
        getTeacherAnalysisDisplaySubjects().forEach((subject) => {
            const townshipAverage = buildTownshipAverage(subject);
            if (townshipAverage) window.TEACHER_TOWNSHIP_AVERAGES[subject] = townshipAverage;
            const rankingData = [];
            Object.keys(teacherStatsSource || {}).forEach((teacherName) => {
                const data = teacherStatsSource[teacherName]?.[subject];
                if (!data) return;
                rankingData.push({
                    name: teacherName,
                    type: 'teacher',
                    subject,
                    avg: teacherToNumber(data.avg, 0),
                    excellentRate: teacherToNumber(data.excellentRate, 0),
                    passRate: teacherToNumber(data.passRate, 0),
                    studentCount: teacherToNumber(data.studentCount, 0)
                });
            });
            Object.keys(window.SCHOOLS || {}).forEach((schoolName) => {
                const metrics = window.SCHOOLS?.[schoolName]?.metrics?.[subject];
                if (!metrics || teacherSameSchoolName(schoolName, window.MY_SCHOOL) || !isTownshipSchoolName(schoolName)) return;
                rankingData.push({
                    name: schoolName,
                    type: 'school',
                    subject,
                    avg: teacherToNumber(metrics.avg, 0),
                    excellentRate: teacherToNumber(metrics.excRate, 0),
                    passRate: teacherToNumber(metrics.passRate, 0),
                    studentCount: teacherToNumber(metrics.count, 0)
                });
            });
            rankingData.sort((left, right) => right.avg - left.avg);
            rankingData.forEach((item, index) => { item.rankAvg = index + 1; });
            rankingData.sort((left, right) => right.excellentRate - left.excellentRate);
            rankingData.forEach((item, index) => { item.rankExc = index + 1; });
            rankingData.sort((left, right) => right.passRate - left.passRate);
            rankingData.forEach((item, index) => { item.rankPass = index + 1; });
            rankingData.sort((left, right) => right.avg - left.avg);
            rankingData.forEach((item) => {
                if (item.type !== 'teacher') return;
                if (!window.TEACHER_TOWNSHIP_RANKINGS[item.name]) window.TEACHER_TOWNSHIP_RANKINGS[item.name] = {};
                window.TEACHER_TOWNSHIP_RANKINGS[item.name][subject] = {
                    avg: item.avg,
                    rankAvg: item.rankAvg,
                    excellentRate: item.excellentRate,
                    rankExc: item.rankExc,
                    passRate: item.passRate,
                    rankPass: item.rankPass,
                    rank: item.rankAvg
                };
            });
            window.TOWNSHIP_RANKING_DATA[subject] = rankingData;
        });
        teacherAnalysisCacheState.townshipSignature = signature;
        return window.TEACHER_TOWNSHIP_RANKINGS;
    }

    Object.assign(window, {
        teacherClamp,
        teacherToNumber,
        teacherFormatSigned,
        teacherFormatPercent,
        teacherEscapeHtml,
        teacherGetSchoolRecord,
        teacherGetWeightConfig,
        getTeacherAnalysisDisplaySubjects,
        getProgressBaselineExamList,
        resolveProgressBaselineExamEntry,
        pickDefaultProgressBaselineExamId,
        normalizeProgressBaselineRows,
        teacherBuildComparableBaselineRows,
        teacherGetRollingBaselineExamEntries,
        analyzeTeachers: analyzeTeachersV2,
        analyzeTeachersV2,
        calculateTeacherTownshipRanking
    });

    window.__TEACHER_ANALYSIS_CORE_RUNTIME_PATCHED__ = true;
})();
