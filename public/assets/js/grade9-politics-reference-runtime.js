(() => {
    if (typeof window === 'undefined' || window.Grade9PoliticsReferenceRuntime) return;

    const state = { key: '', summary: null, promise: null, persistence: null };
    const POLITICS = '政治';
    const WEIGHTS = Object.freeze({ avg: 50, excellent: 80, pass: 50 });

    function text(value) {
        return String(value ?? '').trim();
    }

    function score(value) {
        if (value === null || value === undefined || text(value) === '') return NaN;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : NaN;
    }

    function sameScore(left, right) {
        const a = score(left);
        const b = score(right);
        return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.0001;
    }

    function normalized(value) {
        return text(value).replace(/[\s\u200b-\u200f\ufeff]/g, '');
    }

    function cohortId(value) {
        return text(value).match(/20\d{2}/)?.[0] || '';
    }

    function academicYear(examId, exam = {}) {
        const meta = exam?.meta && typeof exam.meta === 'object' ? exam.meta : {};
        const candidates = [meta.year, meta.academicYear, meta.academic_year, exam.year, exam.academicYear, examId];
        for (const candidate of candidates) {
            const match = text(candidate).match(/(20\d{2})\s*[-~—至]\s*(20\d{2})/);
            if (match) return `${match[1]}-${match[2]}`;
        }
        return '';
    }

    function examDate(examId, exam = {}) {
        const meta = exam?.meta && typeof exam.meta === 'object' ? exam.meta : {};
        const candidates = [meta.date, meta.examDate, meta.exam_date, exam.date, exam.examDate, examId, meta.name, meta.examName, exam.examLabel];
        for (const candidate of candidates) {
            const match = text(candidate).match(/(20\d{2})[-_/年.](\d{1,2})(?:[-_/月.](\d{1,2}))?/);
            if (!match) continue;
            const month = Number(match[2]);
            const day = Number(match[3] || 1);
            if (month < 1 || month > 12 || day < 1 || day > 31) continue;
            return `${match[1]}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
        return '';
    }

    function currentContext() {
        const examId = text(window.CURRENT_EXAM_ID || window.localStorage?.getItem('CURRENT_EXAM_ID'));
        const exam = window.COHORT_DB?.exams?.[examId] || {};
        const meta = exam?.meta && typeof exam.meta === 'object' ? exam.meta : {};
        const source = [window.CONFIG?.name, examId, meta.name, meta.examName, meta.type, exam.examLabel]
            .map(text)
            .join(' ');
        const isGrade9 = /9\s*年级|九年级/.test(source);
        const isZhongkao = /中考/.test(source);
        const activeCohort = cohortId(window.CURRENT_COHORT_ID || window.CURRENT_COHORT_META?.id || window.CURRENT_COHORT_META?.year || examId || meta.cohortId);
        const rows = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
        return {
            examId,
            exam,
            meta,
            cohort: activeCohort,
            year: academicYear(examId, exam),
            rows,
            applicable: isGrade9 && isZhongkao,
            key: [examId, window.__RAW_DATA_VERSION || 0, rows.length, activeCohort, academicYear(examId, exam)].join('::')
        };
    }

    function isGrade9SecondMock(examId, exam = {}) {
        const meta = exam?.meta && typeof exam.meta === 'object' ? exam.meta : {};
        const source = [examId, meta.type, meta.name, meta.examName, exam.name, exam.title, exam.examLabel].map(text).join(' ');
        const grade = text(meta.grade || meta.gradeLabel || exam.grade || exam.gradeLabel);
        return /二模/.test(source) && (/9\s*年级|九年级/.test(`${source} ${grade}`) || grade === '9');
    }

    function findSecondMock(context) {
        const exams = window.COHORT_DB?.exams && typeof window.COHORT_DB.exams === 'object' ? window.COHORT_DB.exams : {};
        return Object.entries(exams)
            .filter(([examId, exam]) => {
                if (examId === context.examId || !isGrade9SecondMock(examId, exam)) return false;
                const examCohort = cohortId(exam?.meta?.cohortId || exam?.meta?.cohort_id || examId);
                const examYear = academicYear(examId, exam);
                return (!context.cohort || !examCohort || context.cohort === examCohort)
                    && (!context.year || !examYear || context.year === examYear)
                    && Array.isArray(exam?.data) && exam.data.length > 0;
            })
            .map(([examId, exam]) => ({ examId, exam, date: examDate(examId, exam) }))
            .sort((left, right) => String(right.date).localeCompare(String(left.date)) || String(right.examId).localeCompare(String(left.examId)))[0] || null;
    }

    function schoolKeys(row = {}) {
        const raw = [row.school, row.originalSchoolName, row.originSchoolName];
        const keys = new Set();
        raw.forEach(value => {
            const valueText = text(value);
            if (!valueText) return;
            keys.add(normalized(valueText));
            if (typeof window.getCanonicalSchoolName === 'function') {
                const canonical = text(window.getCanonicalSchoolName(valueText));
                if (canonical) keys.add(normalized(canonical));
            }
        });
        return Array.from(keys).filter(Boolean);
    }

    function identityKeys(row = {}) {
        const name = normalized(row.name || row.studentName);
        if (!name) return [];
        const id = normalized(row.id || row.studentId || row.student_id);
        const className = normalized(row.class || row.className);
        const schools = schoolKeys(row);
        const keys = [];
        if (id && !/^[-—]+$/.test(id)) keys.push(`id:${id}`);
        schools.forEach(school => {
            if (className) keys.push(`school-class-name:${school}|${className}|${name}`);
            keys.push(`school-name:${school}|${name}`);
        });
        keys.push(`name:${name}`);
        return Array.from(new Set(keys));
    }

    function buildSecondMockIndex(rows) {
        const index = new Map();
        (rows || []).forEach(row => {
            if (!Number.isFinite(score(row?.scores?.[POLITICS]))) return;
            identityKeys(row).forEach(key => {
                const matches = index.get(key) || [];
                matches.push(row);
                index.set(key, matches);
            });
        });
        return index;
    }

    function resolveSecondMockRow(row, index) {
        for (const key of identityKeys(row)) {
            const matches = index.get(key) || [];
            if (matches.length === 1) return matches[0];
        }
        return null;
    }

    function sameSchool(left, right) {
        const leftName = text(left);
        const rightName = text(right);
        if (!leftName || !rightName) return false;
        if (typeof window.areSchoolNamesEquivalent === 'function') return window.areSchoolNamesEquivalent(leftName, rightName);
        return schoolKeys({ school: leftName }).some(key => schoolKeys({ school: rightName }).includes(key));
    }

    function getTownshipSchoolNames() {
        const all = Object.keys(window.SCHOOLS || {}).map(text).filter(Boolean);
        if (typeof window.getTownshipManagedSchoolNames !== 'function') return all;
        const names = window.getTownshipManagedSchoolNames(all);
        return Array.isArray(names) && names.length ? names.map(text).filter(Boolean) : all;
    }

    function getDisplaySchoolName(sourceName, scopeNames) {
        return scopeNames.find(name => sameSchool(name, sourceName)) || text(sourceName);
    }

    function getThresholds(secondMock, values) {
        const source = secondMock?.exam?.thresholds || secondMock?.exam?.meta?.thresholds || {};
        const raw = source?.[POLITICS] || source?.政治 || {};
        const exc = score(raw?.exc ?? raw?.excellent ?? raw?.excellentLine);
        const pass = score(raw?.pass ?? raw?.passing ?? raw?.passLine);
        if (Number.isFinite(exc) && Number.isFinite(pass)) return { exc, pass, source: '二模归档分数线' };
        const sorted = values.slice().sort((left, right) => right - left);
        if (!sorted.length) return { exc: 0, pass: 0, source: '无可用分数线' };
        const percentileLine = ratio => sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)] || 0;
        return { exc: percentileLine(0.15), pass: percentileLine(0.5), source: '按二模成绩重建（前15% / 前50%）' };
    }

    function rank(records, valueOf, write) {
        let previousValue = null;
        let previousRank = 0;
        records.slice().sort((left, right) => valueOf(right) - valueOf(left)).forEach((record, index) => {
            const value = valueOf(record);
            const nextRank = index > 0 && Math.abs(value - previousValue) < 0.0001 ? previousRank : index + 1;
            write(record, nextRank);
            previousValue = value;
            previousRank = nextRank;
        });
    }

    function buildMetricsSummary(context, matchedRows, unmatched, details) {
        const thresholds = details.thresholds;
        const bySchool = new Map();
        matchedRows.forEach(row => {
            const name = text(row.school) || '未命名学校';
            const list = bySchool.get(name) || [];
            list.push(row);
            bySchool.set(name, list);
        });
        const schools = Array.from(bySchool.entries()).map(([name, rows]) => {
            const values = rows.map(row => row.politicsScore);
            const average = values.reduce((sum, value) => sum + value, 0) / values.length;
            return {
                name,
                metrics: {
                    count: values.length,
                    avg: average,
                    excRate: values.filter(value => value >= thresholds.exc).length / values.length,
                    passRate: values.filter(value => value >= thresholds.pass).length / values.length,
                    ratedAvg: 0,
                    ratedExc: 0,
                    ratedPass: 0
                },
                rankings: {},
                score2Rate: 0
            };
        });
        const max = schools.reduce((acc, school) => ({
            avg: Math.max(acc.avg, school.metrics.avg),
            excRate: Math.max(acc.excRate, school.metrics.excRate),
            passRate: Math.max(acc.passRate, school.metrics.passRate)
        }), { avg: 0, excRate: 0, passRate: 0 });
        schools.forEach(school => {
            const metric = school.metrics;
            metric.ratedAvg = max.avg ? metric.avg / max.avg * WEIGHTS.avg : 0;
            metric.ratedExc = max.excRate ? metric.excRate / max.excRate * WEIGHTS.excellent : 0;
            metric.ratedPass = max.passRate ? metric.passRate / max.passRate * WEIGHTS.pass : 0;
            school.score2Rate = metric.ratedAvg + metric.ratedExc + metric.ratedPass;
        });
        ['avg', 'excRate', 'passRate'].forEach(key => rank(schools, school => school.metrics[key], (school, value) => {
            school.rankings[key] = value;
        }));
        rank(schools, school => school.score2Rate, (school, value) => { school.rankings.score2Rate = value; });
        schools.sort((left, right) => (left.rankings.score2Rate || Infinity) - (right.rankings.score2Rate || Infinity));
        return {
            status: 'ready',
            available: schools.length > 0,
            signature: `${context.key}::${details.sourceExamId}::${matchedRows.length}`,
            sourceLabel: details.sourceLabel,
            sourceExamId: details.sourceExamId,
            sourceMode: details.sourceMode,
            thresholds,
            matched: matchedRows.length,
            unmatched,
            schools,
            reason: schools.length ? '' : '没有匹配到当前中考学生的政治二模成绩。'
        };
    }

    function getMatchedRows(context, valueOf) {
        const scopeNames = getTownshipSchoolNames();
        const matchedRows = [];
        let unmatched = 0;
        context.rows.forEach(row => {
            if (scopeNames.length && !scopeNames.some(name => sameSchool(name, row?.school))) return;
            const politicsScore = score(valueOf(row));
            if (!Number.isFinite(politicsScore)) {
                unmatched += 1;
                return;
            }
            matchedRows.push({ ...row, school: getDisplaySchoolName(row?.school, scopeNames), politicsScore });
        });
        return { matchedRows, unmatched };
    }

    function buildSummary(context, secondMock) {
        const index = buildSecondMockIndex(secondMock?.exam?.data || []);
        const matched = getMatchedRows(context, row => resolveSecondMockRow(row, index)?.scores?.[POLITICS]);
        const thresholds = getThresholds(secondMock, matched.matchedRows.map(row => row.politicsScore));
        return buildMetricsSummary(context, matched.matchedRows, matched.unmatched, {
            thresholds,
            sourceExamId: secondMock.examId,
            sourceLabel: examDate(secondMock.examId, secondMock.exam) || secondMock.examId,
            sourceMode: 'second-mock'
        });
    }

    function getStoredReference(context) {
        const reference = context.exam?.meta?.politicsReference;
        if (!reference || typeof reference !== 'object') return null;
        const sourceExamId = text(reference.sourceExamId);
        const exc = score(reference?.thresholds?.exc);
        const pass = score(reference?.thresholds?.pass);
        if (!sourceExamId || !Number.isFinite(exc) || !Number.isFinite(pass)) return null;
        return {
            sourceExamId,
            sourceLabel: text(reference.sourceLabel) || sourceExamId,
            thresholds: {
                exc,
                pass,
                source: text(reference?.thresholds?.source) || '已归档二模分数线'
            }
        };
    }

    function buildStoredSummary(context) {
        const reference = getStoredReference(context);
        if (!reference) return null;
        const matched = getMatchedRows(context, row => row?.scores?.[POLITICS]);
        if (!matched.matchedRows.length) return null;
        return buildMetricsSummary(context, matched.matchedRows, matched.unmatched, {
            ...reference,
            sourceMode: 'archived-copy'
        });
    }

    function updatePoliticsScores(rows, index) {
        let matched = 0;
        let updated = 0;
        (Array.isArray(rows) ? rows : []).forEach(row => {
            const referenceRow = resolveSecondMockRow(row, index);
            const politicsScore = score(referenceRow?.scores?.[POLITICS]);
            if (!Number.isFinite(politicsScore)) return;
            matched += 1;
            if (sameScore(row?.scores?.[POLITICS], politicsScore)) return;
            row.scores = { ...(row?.scores || {}), [POLITICS]: politicsScore };
            updated += 1;
        });
        return { matched, updated };
    }

    function sameReferenceMetadata(left, right) {
        return text(left?.sourceExamId) === text(right?.sourceExamId)
            && text(left?.sourceLabel) === text(right?.sourceLabel)
            && sameScore(left?.thresholds?.exc, right?.thresholds?.exc)
            && sameScore(left?.thresholds?.pass, right?.thresholds?.pass)
            && text(left?.thresholds?.source) === text(right?.thresholds?.source)
            && Number(left?.matched || 0) === Number(right?.matched || 0);
    }

    // 将二模政治固化为中考归档的展示字段。政治不加入 SUBJECTS，也绝不改 total、
    // 正式排名、指标生、高分段或高中上线；这些字段始终只由正式五科/中考总分计算。
    function copyPoliticsToCurrentExam(context, secondMock, summary) {
        const index = buildSecondMockIndex(secondMock?.exam?.data || []);
        const runtimeResult = updatePoliticsScores(context.rows, index);
        const archivedRows = Array.isArray(context.exam?.data) ? context.exam.data : [];
        const archiveResult = archivedRows === context.rows ? { matched: runtimeResult.matched, updated: 0 } : updatePoliticsScores(archivedRows, index);
        const nextReference = {
            sourceExamId: secondMock.examId,
            sourceLabel: summary.sourceLabel,
            thresholds: {
                exc: summary.thresholds.exc,
                pass: summary.thresholds.pass,
                source: summary.thresholds.source
            },
            matched: runtimeResult.matched,
            copiedAt: new Date().toISOString()
        };
        const existingMeta = context.exam?.meta && typeof context.exam.meta === 'object' ? context.exam.meta : {};
        const metadataChanged = !sameReferenceMetadata(existingMeta.politicsReference, nextReference);
        if (metadataChanged && context.exam && typeof context.exam === 'object') {
            context.exam.meta = { ...existingMeta, politicsReference: nextReference };
            context.meta = context.exam.meta;
        }
        return {
            changed: runtimeResult.updated > 0 || archiveResult.updated > 0 || metadataChanged,
            matched: runtimeResult.matched,
            updated: runtimeResult.updated + archiveResult.updated,
            sourceExamId: secondMock.examId
        };
    }

    function queuePoliticsCopySave(context, copy) {
        if (!copy?.changed || !context.examId) return null;
        const key = `${context.examId}::${copy.sourceExamId}`;
        if (state.persistence?.key === key && state.persistence.status === 'pending' && state.persistence.promise) {
            return state.persistence.promise;
        }
        const persistence = {
            key,
            status: 'pending',
            examId: context.examId,
            sourceExamId: copy.sourceExamId,
            matched: copy.matched,
            updated: copy.updated,
            promise: null
        };
        state.persistence = persistence;
        persistence.promise = (async () => {
            const save = typeof window.saveCloudData === 'function'
                ? window.saveCloudData
                : window.CloudManager?.save;
            if (typeof save !== 'function') {
                persistence.status = 'unavailable';
                console.warn('[politics-reference] 未找到云端保存入口，政治二模参考仍只保留在当前页面。');
                return false;
            }
            if (text(window.CURRENT_EXAM_ID) !== context.examId) {
                persistence.status = 'skipped';
                return false;
            }
            try {
                const queued = await save({
                    mode: 'exam',
                    examKey: context.examId,
                    background: true,
                    forceUpload: true,
                    sourceLabel: 'grade9-politics-reference-copy'
                });
                persistence.status = queued ? 'queued' : 'failed';
                if (!queued) console.warn('[politics-reference] 政治二模参考未进入云端同步队列。');
                return queued === true;
            } catch (error) {
                persistence.status = 'failed';
                console.warn('[politics-reference] 政治二模参考云端同步失败:', error?.message || error);
                return false;
            }
        })();
        return persistence.promise;
    }

    async function ensureSummary() {
        const context = currentContext();
        if (!context.applicable) return null;
        if (state.key === context.key && state.summary?.status === 'ready') return state.summary;
        if (state.key === context.key && state.promise) return state.promise;
        state.key = context.key;
        state.summary = { status: 'loading', available: false, signature: `${context.key}::loading` };
        state.promise = (async () => {
            // 一旦已经由二模复制并保存到中考归档，直接读中考分片，不再重复拉历史二模。
            const storedSummary = buildStoredSummary(context);
            if (storedSummary) {
                state.summary = storedSummary;
                return state.summary;
            }

            let secondMock = findSecondMock(context);
            if (!secondMock && context.cohort && typeof window.CloudManager?.fetchCohortExamsToLocal === 'function') {
                try {
                    await window.CloudManager.fetchCohortExamsToLocal(context.cohort, {
                        background: false,
                        latestOnly: false,
                        // 中考和二模通常是同届最新两次考试。先只取这两个元数据/快照，
                        // 避免首次打开单科参考时把整届历史数据排队拉完。
                        minCount: 2,
                        maxFetch: 2,
                        refreshSelectors: false
                    });
                    secondMock = findSecondMock(context);
                    // 若二模不是最近两次（例如中间还有一次补测），再兜底拉完整历史。
                    if (!secondMock) {
                        await window.CloudManager.fetchCohortExamsToLocal(context.cohort, {
                            background: false,
                            latestOnly: false,
                            minCount: 3,
                            refreshSelectors: false
                        });
                        secondMock = findSecondMock(context);
                    }
                } catch (error) {
                    state.summary = {
                        status: 'ready',
                        available: false,
                        signature: `${context.key}::error`,
                        reason: `读取同届二模失败：${text(error?.message || error)}`
                    };
                    return state.summary;
                }
            }
            if (!secondMock) {
                state.summary = {
                    status: 'ready',
                    available: false,
                    signature: `${context.key}::missing`,
                    reason: '未找到同届同学年度的九年级二模政治成绩。'
                };
                return state.summary;
            }

            const summary = buildSummary(context, secondMock);
            const copy = copyPoliticsToCurrentExam(context, secondMock, summary);
            queuePoliticsCopySave(context, copy);
            state.summary = summary;
            return state.summary;
        })();
        try {
            return await state.promise;
        } finally {
            state.promise = null;
        }
    }

    function getSummary() {
        const context = currentContext();
        if (!context.applicable || state.key !== context.key) return null;
        return state.summary;
    }

    async function flushPendingPersistence() {
        if (!state.persistence?.promise) return state.persistence?.status || 'idle';
        await state.persistence.promise;
        return state.persistence.status;
    }

    function getPersistenceState() {
        if (!state.persistence) return null;
        const { promise, ...snapshot } = state.persistence;
        return { ...snapshot };
    }

    window.Grade9PoliticsReferenceRuntime = Object.freeze({
        ensureSummary,
        getSummary,
        flushPendingPersistence,
        getPersistenceState
    });
})();
