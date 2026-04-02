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
            const nextSchool = String(preferredSchool || '').trim();
            if (nextSchool) {
                window.MY_SCHOOL = nextSchool;
                localStorage.setItem('MY_SCHOOL', nextSchool);
            }
            return nextSchool;
        });

    const TEACHER_BASELINE_BANDS = [
        { id: 'top', max: 0.25 },
        { id: 'upper', max: 0.5 },
        { id: 'middle', max: 0.75 },
        { id: 'tail', max: 1.01 }
    ];

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

    function teacherGetWeightConfig() {
        const isGrade9 = String(window.CONFIG?.name || '').includes('9');
        return isGrade9
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
            const cls = normalizeClassFn(student?.class || '');
            if (score >= thresholds.exc - 5 && score < thresholds.exc) {
                excellentEdges.push({ name, className: cls, score, gap: thresholds.exc - score });
            }
            if (score >= thresholds.pass - 5 && score < thresholds.pass) {
                passEdges.push({ name, className: cls, score, gap: thresholds.pass - score });
            }
            if (score < thresholds.low || score <= thresholds.low + 5) {
                lowRisk.push({ name, className: cls, score, gap: score - thresholds.low });
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

    function teacherBuildSampleSnapshot(currentStudents, baselineRows, baselineInfoMap, classes) {
        const classSet = new Set((classes || []).map((item) => normalizeClassFn(item)).filter(Boolean));
        const previousRosterMap = new Map();
        (baselineRows || []).forEach((row) => {
            const cls = normalizeClassFn(row?.class || '');
            if (!classSet.has(cls)) return;
            previousRosterMap.set(teacherBuildBaselineRowKey(row), row);
        });

        let commonCount = 0;
        (currentStudents || []).forEach((student) => {
            const info = baselineInfoMap.get(teacherBuildStudentKey(student));
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
            !schoolName || areSchoolNamesEquivalentFn(student.school, schoolName)
        ));
        if (window.PermissionPolicy && typeof window.PermissionPolicy.filterStudentRows === 'function') {
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
                createdAt: Number(exam.createdAt || 0),
                dataCount: exam.data.length
            }))
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
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
            .sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0))
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
        const resolved = window.resolveTeacherHistoryEntry(termId);
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

    function teacherBuildConversionMetrics(students, subject, currentThresholds, primaryContext, baselineInfoMap) {
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
            const info = baselineInfoMap.get(teacherBuildStudentKey(student));
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

    function analyzeTeachersV2() {
        const resolveRowsForTeacherAnalysis = () => {
            if (Array.isArray(window.RAW_DATA) && window.RAW_DATA.length > 0) return window.RAW_DATA;
            const db = (typeof window.CohortDB !== 'undefined' && typeof window.CohortDB.ensure === 'function')
                ? window.CohortDB.ensure()
                : null;
            if (!db?.exams) return [];
            const currentId = window.CURRENT_EXAM_ID || db.currentExamId || '';
            let exam = currentId ? db.exams[currentId] : null;
            if (!exam) {
                const list = Object.values(db.exams).sort((left, right) => (right.createdAt || 0) - (left.createdAt || 0));
                exam = list[0] || null;
            }
            return Array.isArray(exam?.data) ? exam.data : [];
        };

        const rows = resolveRowsForTeacherAnalysis();
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
        let activeSchool = syncTeacherSchoolContext(
            document.getElementById('mySchoolSelect')?.value
            || window.MY_SCHOOL
            || localStorage.getItem('MY_SCHOOL')
            || inferredSchool
        );

        const user = getCurrentUserFn();
        if (user && user.role === 'teacher') {
            const userNameNorm = String(user.name || '').replace(/\s+/g, '').toLowerCase();
            const classSchoolMap = (typeof window.getClassSchoolMapForAllData === 'function')
                ? window.getClassSchoolMapForAllData()
                : {};
            Object.entries(window.TEACHER_MAP || {}).some(([key, teacherName]) => {
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
                const [rawCls] = key.split('_');
                const cls = normalizeClassFn(rawCls);
                if (classSchoolMap[cls]) {
                    activeSchool = classSchoolMap[cls];
                    return true;
                }
                return false;
            });
            if (activeSchool) {
                window.MY_SCHOOL = activeSchool;
                localStorage.setItem('MY_SCHOOL', activeSchool);
            }
        }

        if (activeSchool && accessibleSchools.length && !accessibleSchools.includes(activeSchool)) activeSchool = '';
        if (!activeSchool && accessibleSchools.length === 1) activeSchool = syncTeacherSchoolContext(accessibleSchools[0]);
        if (!activeSchool) {
            const firstFromRows = rows.find((row) => accessibleSchools.includes(String(row?.school || '').trim()));
            if (firstFromRows) activeSchool = syncTeacherSchoolContext(String(firstFromRows.school).trim());
        }
        if (!activeSchool) {
            alert('请先选择本校');
            return;
        }
        syncTeacherSchoolContext(activeSchool);

        if (window.DataManager && typeof window.DataManager.ensureTeacherMap === 'function') {
            const ok = window.DataManager.ensureTeacherMap(true);
            if (!ok) {
                if (window.UI) window.UI.toast('请先同步教师任课表后再分析', 'warning');
                return;
            }
        }

        window.TEACHER_STATS = {};
        const classSchoolMap = (typeof window.getClassSchoolMapForAllData === 'function')
            ? window.getClassSchoolMapForAllData()
            : {};
        const normalizedRows = rows.map((student) => ({
            ...student,
            school: String(student?.school || '').trim(),
            class: normalizeClassFn(student?.class),
            scores: student?.scores || {}
        }));
        const teacherClassSet = new Set(
            Object.keys(window.TEACHER_MAP || {})
                .map((key) => normalizeClassFn(String(key).split('_')[0]))
                .filter(Boolean)
        );
        let mySchoolStudents = normalizedRows.filter((student) => student.school === activeSchool);
        if (!mySchoolStudents.length) {
            mySchoolStudents = normalizedRows.filter((student) => {
                const cls = normalizeClassFn(student.class);
                if (!cls || !teacherClassSet.has(cls)) return false;
                return classSchoolMap[cls] === activeSchool;
            });
        }
        const queryMode = window.PermissionPolicy && window.PermissionPolicy.isClassTeacher(user) ? 'homeroom' : 'teaching';
        if (window.PermissionPolicy && typeof window.PermissionPolicy.filterStudentRows === 'function') {
            mySchoolStudents = window.PermissionPolicy.filterStudentRows(user, mySchoolStudents, { mode: queryMode });
        }
        if (!mySchoolStudents.length) return;

        const subjectList = (window.SUBJECTS && window.SUBJECTS.length)
            ? window.SUBJECTS
            : [...new Set(mySchoolStudents.flatMap((student) => Object.keys(student.scores || {})).map(normalizeSubjectFn))];
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

        const schoolRankMap = teacherBuildSchoolRankMap(mySchoolStudents);
        const rollingBaselineEntries = teacherGetRollingBaselineExamEntries(3);
        const baselineContexts = rollingBaselineEntries.map((entry) => {
            const examStudents = teacherFilterExamStudentsBySchool(entry?.data || [], activeSchool, user, queryMode);
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
            const key = teacherBuildStudentKey(student);
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

        subjectList.forEach((subject) => {
            const buckets = {};
            TEACHER_BASELINE_BANDS.forEach((band) => {
                buckets[band.id] = [];
            });
            mySchoolStudents.forEach((student) => {
                const score = teacherToNumber(student?.scores?.[subject], NaN);
                if (!Number.isFinite(score)) return;
                const info = baselineInfoMap.get(teacherBuildStudentKey(student));
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

        Object.entries(window.TEACHER_MAP || {}).forEach(([key, teacherName]) => {
            const [rawClass, rawSubject] = key.split('_');
            const className = normalizeClassFn(rawClass);
            const normalizedSubject = normalizeSubjectFn(rawSubject);
            const matchedSubject = subjectList.find((subject) => normalizeSubjectFn(subject) === normalizedSubject);
            if (!matchedSubject) return;
            if (!window.TEACHER_STATS[teacherName]) window.TEACHER_STATS[teacherName] = {};
            if (!window.TEACHER_STATS[teacherName][matchedSubject]) {
                window.TEACHER_STATS[teacherName][matchedSubject] = {
                    classes: [],
                    students: [],
                    subject: matchedSubject
                };
            }
            const teacherStudents = mySchoolStudents.filter((student) => (
                normalizeClassFn(student.class) === className && student.scores?.[matchedSubject] !== undefined
            ));
            window.TEACHER_STATS[teacherName][matchedSubject].classes.push(className);
            window.TEACHER_STATS[teacherName][matchedSubject].students.push(...teacherStudents);
        });

        const subjectGroups = {};
        Object.keys(window.TEACHER_STATS).forEach((teacherName) => {
            Object.keys(window.TEACHER_STATS[teacherName]).forEach((subject) => {
                const data = window.TEACHER_STATS[teacherName][subject];
                const studentMap = new Map();
                (data.students || []).forEach((student) => {
                    studentMap.set(teacherBuildStudentKey(student), student);
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
                    const info = baselineInfoMap.get(teacherBuildStudentKey(student));
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
                const sampleSnapshot = teacherBuildSampleSnapshot(students, primaryBaselineRows, baselineInfoMap, data.classes);
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
                data.conversionMetrics = teacherBuildConversionMetrics(students, subject, thresholds, primaryBaselineContext, baselineInfoMap);
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

        if (typeof window.refreshTeacherPerformanceCopy === 'function') window.refreshTeacherPerformanceCopy();
        if (typeof window.calculateTeacherTownshipRanking === 'function') window.calculateTeacherTownshipRanking();
        if (typeof window.renderTeacherCards === 'function') window.renderTeacherCards();
        if (typeof window.renderTeacherComparisonTable === 'function') window.renderTeacherComparisonTable();
        if (typeof window.generateTeacherPairing === 'function') window.generateTeacherPairing();
        if (typeof window.renderTeachingOverview === 'function') window.renderTeachingOverview();
        if (typeof window.tmRenderTeachingModuleStateBars === 'function') window.tmRenderTeachingModuleStateBars();
    }

    function generateTeacherPairing() {
        const container = document.getElementById('teacher-pairing-suggestions');
        if (!container) return;
        container.innerHTML = '';
        if (!window.MY_SCHOOL || !window.SCHOOLS?.[window.MY_SCHOOL]) return;

        const schoolMetrics = window.SCHOOLS[window.MY_SCHOOL].metrics || {};
        const pairs = [];
        (window.SUBJECTS || []).forEach((subject) => {
            const baseline = schoolMetrics[subject];
            if (!baseline) return;
            const teachers = [];
            Object.keys(window.TEACHER_STATS || {}).forEach((teacherName) => {
                if (window.TEACHER_STATS[teacherName]?.[subject]) {
                    teachers.push({ name: teacherName, data: window.TEACHER_STATS[teacherName][subject] });
                }
            });
            if (teachers.length < 2) return;

            const typeA = teachers.filter((teacher) => (
                teacher.data.passRate > baseline.passRate && teacher.data.excellentRate < baseline.excRate
            ));
            const typeB = teachers.filter((teacher) => (
                teacher.data.excellentRate > baseline.excRate && teacher.data.passRate < baseline.passRate
            ));
            typeA.forEach((left) => {
                typeB.forEach((right) => {
                    const id = `${[left.name, right.name].sort().join('-')}-${subject}`;
                    if (!pairs.some((item) => item.id === id)) {
                        pairs.push({ id, subject, teacher1: left, teacher2: right });
                    }
                });
            });
        });

        if (!pairs.length) {
            container.innerHTML = '<div style="text-align:center; color:#999; grid-column:1/-1;">暂无明显的互补型结对建议，说明各位老师发展较为均衡或差异不大。</div>';
            return;
        }

        pairs.forEach((pair) => {
            const card = document.createElement('div');
            card.className = 'pairing-card';
            card.innerHTML = `
                <div class="pairing-side">
                    <div class="pairing-role">基础扎实型</div>
                    <div class="pairing-name">${teacherEscapeHtml(pair.teacher1.name)}</div>
                    <div class="pairing-skill">及格率高 (${teacherFormatPercent(pair.teacher1.data.passRate, 1)})</div>
                    <div class="pairing-need">需提升优秀率</div>
                </div>
                <div class="pairing-arrow">
                    <div style="text-align:center;">
                        <i class="ti ti-arrows-left-right"></i>
                        <div class="pairing-tag">${teacherEscapeHtml(pair.subject)}</div>
                    </div>
                </div>
                <div class="pairing-side" style="text-align:right;">
                    <div class="pairing-role">培优拔尖型</div>
                    <div class="pairing-name">${teacherEscapeHtml(pair.teacher2.name)}</div>
                    <div class="pairing-skill">优秀率高 (${teacherFormatPercent(pair.teacher2.data.excellentRate, 1)})</div>
                    <div class="pairing-need">需提升及格率</div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    function calculateTeacherTownshipRanking() {
        window.TEACHER_TOWNSHIP_RANKINGS = {};
        window.TOWNSHIP_RANKING_DATA = {};
        (window.SUBJECTS || []).forEach((subject) => {
            const rankingData = [];
            Object.keys(window.TEACHER_STATS || {}).forEach((teacherName) => {
                const data = window.TEACHER_STATS[teacherName]?.[subject];
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
                if (!metrics || schoolName === window.MY_SCHOOL) return;
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
    }

    Object.assign(window, {
        teacherClamp,
        teacherToNumber,
        teacherFormatSigned,
        teacherFormatPercent,
        teacherEscapeHtml,
        teacherGetWeightConfig,
        getProgressBaselineExamList,
        resolveProgressBaselineExamEntry,
        pickDefaultProgressBaselineExamId,
        normalizeProgressBaselineRows,
        teacherBuildComparableBaselineRows,
        teacherGetRollingBaselineExamEntries,
        analyzeTeachers: analyzeTeachersV2,
        analyzeTeachersV2,
        generateTeacherPairing,
        calculateTeacherTownshipRanking
    });

    window.__TEACHER_ANALYSIS_CORE_RUNTIME_PATCHED__ = true;
})();
