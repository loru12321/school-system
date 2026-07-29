(() => {
    if (typeof window === 'undefined' || window.Grade9PoliticsReferenceRuntime) return;

    const state = { key: '', summary: null, promise: null };
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

    function politicsRowsSignature(rows) {
        return (rows || []).map((row) => [
            row?.id || row?.studentId || '', row?.name || row?.studentName || '',
            row?.school || '', row?.class || row?.className || '', row?.scores?.[POLITICS] ?? ''
        ].map(normalized).join(':')).join('|');
    }

    function currentContext() {
        const examId = text(window.CURRENT_EXAM_ID || window.localStorage?.getItem('CURRENT_EXAM_ID'));
        const exam = window.COHORT_DB?.exams?.[examId] || {};
        const meta = exam?.meta && typeof exam.meta === 'object' ? exam.meta : {};
        const source = [window.CONFIG?.name, examId, meta.name, meta.examName, meta.type, exam.examLabel].map(text).join(' ');
        const rows = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
        return {
            examId,
            exam,
            meta,
            cohort: cohortId(window.CURRENT_COHORT_ID || window.CURRENT_COHORT_META?.id || window.CURRENT_COHORT_META?.year || examId || meta.cohortId),
            year: academicYear(examId, exam),
            rows,
            applicable: /9\s*年级|九年级/.test(source) && /中考/.test(source),
            key: [examId, window.__RAW_DATA_VERSION || 0, rows.length, politicsRowsSignature(rows)].join('::')
        };
    }

    function schoolKeys(row = {}) {
        const keys = new Set();
        [row.school, row.originalSchoolName, row.originSchoolName].forEach((value) => {
            const name = text(value);
            if (!name) return;
            keys.add(normalized(name));
            if (typeof window.getCanonicalSchoolName === 'function') {
                const canonical = text(window.getCanonicalSchoolName(name));
                if (canonical) keys.add(normalized(canonical));
            }
        });
        return Array.from(keys).filter(Boolean);
    }

    function sameSchool(left, right) {
        const leftName = text(left);
        const rightName = text(right);
        if (!leftName || !rightName) return false;
        if (typeof window.areSchoolNamesEquivalent === 'function') return window.areSchoolNamesEquivalent(leftName, rightName);
        return schoolKeys({ school: leftName }).some((key) => schoolKeys({ school: rightName }).includes(key));
    }

    function identityKeys(row = {}) {
        const name = normalized(row.name || row.studentName);
        if (!name) return [];
        const id = normalized(row.id || row.studentId || row.student_id);
        const className = normalized(row.class || row.className);
        const keys = [];
        if (id && !/^[-—]+$/.test(id)) keys.push(`id:${id}`);
        schoolKeys(row).forEach((school) => {
            if (className) keys.push(`school-class-name:${school}|${className}|${name}`);
            keys.push(`school-name:${school}|${name}`);
        });
        keys.push(`name:${name}`);
        return Array.from(new Set(keys));
    }

    function buildPoliticsIndex(rows) {
        const index = new Map();
        (rows || []).forEach((row) => {
            if (!Number.isFinite(score(row?.scores?.[POLITICS]))) return;
            identityKeys(row).forEach((key) => {
                const matches = index.get(key) || [];
                matches.push(row);
                index.set(key, matches);
            });
        });
        return index;
    }

    function resolveIndexedRow(row, index) {
        for (const key of identityKeys(row)) {
            const matches = index.get(key) || [];
            if (matches.length === 1) return matches[0];
        }
        return null;
    }

    function getTownshipSchoolNames() {
        const all = Object.keys(window.SCHOOLS || {}).map(text).filter(Boolean);
        if (typeof window.getTownshipManagedSchoolNames !== 'function') return all;
        const names = window.getTownshipManagedSchoolNames(all);
        return Array.isArray(names) && names.length ? names.map(text).filter(Boolean) : all;
    }

    function getDisplaySchoolName(sourceName, scopeNames) {
        return scopeNames.find((name) => sameSchool(name, sourceName)) || text(sourceName);
    }

    function getLatestPoliticsRows(context) {
        const scopeNames = getTownshipSchoolNames();
        const rows = [];
        let missing = 0;
        context.rows.forEach((row) => {
            if (scopeNames.length && !scopeNames.some((name) => sameSchool(name, row?.school))) return;
            const politicsScore = score(row?.scores?.[POLITICS]);
            if (!Number.isFinite(politicsScore)) {
                missing += 1;
                return;
            }
            rows.push({ ...row, school: getDisplaySchoolName(row?.school, scopeNames), politicsScore });
        });
        return { rows, missing };
    }

    function getThresholds(context, values) {
        const source = context.exam?.thresholds || context.meta?.thresholds || {};
        const raw = source?.[POLITICS] || source?.政治 || {};
        const exc = score(raw?.exc ?? raw?.excellent ?? raw?.excellentLine);
        const pass = score(raw?.pass ?? raw?.passing ?? raw?.passLine);
        if (Number.isFinite(exc) && Number.isFinite(pass)) return { exc, pass, source: '最新中考整理表归档分数线' };
        const sorted = values.slice().sort((left, right) => right - left);
        if (!sorted.length) return { exc: 0, pass: 0, source: '无可用分数线' };
        const line = (ratio) => sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)] || 0;
        return { exc: line(0.15), pass: line(0.5), source: '按最新中考整理表重建（前15% / 前50%）' };
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

    function buildMetricsSummary(context, rows, missing, details) {
        const bySchool = new Map();
        rows.forEach((row) => {
            const name = text(row.school) || '未命名学校';
            const list = bySchool.get(name) || [];
            list.push(row);
            bySchool.set(name, list);
        });
        const schools = Array.from(bySchool.entries()).map(([name, schoolRows]) => {
            const values = schoolRows.map((row) => row.politicsScore);
            const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
            return {
                name,
                metrics: {
                    count: values.length,
                    avg,
                    excRate: values.filter((value) => value >= details.thresholds.exc).length / values.length,
                    passRate: values.filter((value) => value >= details.thresholds.pass).length / values.length,
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
        schools.forEach((school) => {
            const metric = school.metrics;
            metric.ratedAvg = max.avg ? metric.avg / max.avg * WEIGHTS.avg : 0;
            metric.ratedExc = max.excRate ? metric.excRate / max.excRate * WEIGHTS.excellent : 0;
            metric.ratedPass = max.passRate ? metric.passRate / max.passRate * WEIGHTS.pass : 0;
            school.score2Rate = metric.ratedAvg + metric.ratedExc + metric.ratedPass;
        });
        ['avg', 'excRate', 'passRate'].forEach((key) => rank(schools, (school) => school.metrics[key], (school, value) => {
            school.rankings[key] = value;
        }));
        rank(schools, (school) => school.score2Rate, (school, value) => { school.rankings.score2Rate = value; });
        schools.sort((left, right) => (left.rankings.score2Rate || Infinity) - (right.rankings.score2Rate || Infinity));
        return {
            status: 'ready',
            available: schools.length > 0,
            signature: `${context.key}::latest-zhongkao-politics::${rows.length}`,
            sourceExamId: context.examId,
            sourceLabel: `${examDate(context.examId, context.exam) || context.examId} 中考整理表`,
            sourceMode: 'latest-zhongkao-politics',
            thresholds: details.thresholds,
            matched: rows.length,
            unmatched: missing,
            schools,
            referenceSchools: schools,
            reason: schools.length ? '' : '最新中考整理表中没有可用的政治成绩。'
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
        return Object.entries(exams).filter(([examId, exam]) => {
            if (examId === context.examId || !isGrade9SecondMock(examId, exam)) return false;
            const examCohort = cohortId(exam?.meta?.cohortId || exam?.meta?.cohort_id || examId);
            const examYear = academicYear(examId, exam);
            return (!context.cohort || !examCohort || context.cohort === examCohort)
                && (!context.year || !examYear || context.year === examYear)
                && Array.isArray(exam?.data) && exam.data.length > 0;
        }).map(([examId, exam]) => ({ examId, exam, date: examDate(examId, exam) }))
            .sort((left, right) => String(right.date).localeCompare(String(left.date)) || String(right.examId).localeCompare(String(left.examId)))[0] || null;
    }

    function buildSecondMockAudit(context, sourceRows) {
        const secondMock = findSecondMock(context);
        if (!secondMock) return { status: 'unavailable', sourceLabel: '同届二模未加载' };
        const mockRows = secondMock.exam.data || [];
        const mockIndex = buildPoliticsIndex(mockRows);
        const latestIndex = buildPoliticsIndex(context.rows);
        const scopeNames = getTownshipSchoolNames();
        const schoolMap = new Map(scopeNames.map((name) => [name, {
            name,
            latest: 0,
            same: 0,
            different: 0,
            missingInMock: 0,
            mockOnly: 0
        }]));
        const getSchoolAudit = (name) => {
            const display = getDisplaySchoolName(name, scopeNames);
            if (!schoolMap.has(display)) schoolMap.set(display, {
                name: display,
                latest: 0,
                same: 0,
                different: 0,
                missingInMock: 0,
                mockOnly: 0
            });
            return schoolMap.get(display);
        };
        let same = 0;
        let different = 0;
        let missingInMock = 0;
        sourceRows.forEach((row) => {
            const school = getSchoolAudit(row.school);
            school.latest += 1;
            const mockRow = resolveIndexedRow(row, mockIndex);
            if (!mockRow) {
                missingInMock += 1;
                school.missingInMock += 1;
            } else if (sameScore(row.politicsScore, mockRow?.scores?.[POLITICS])) {
                same += 1;
                school.same += 1;
            } else {
                different += 1;
                school.different += 1;
            }
        });
        let mockOnly = 0;
        mockRows.forEach((row) => {
            if (!Number.isFinite(score(row?.scores?.[POLITICS]))) return;
            if (scopeNames.length && !scopeNames.some((name) => sameSchool(name, row?.school))) return;
            if (!resolveIndexedRow(row, latestIndex)) {
                mockOnly += 1;
                getSchoolAudit(row.school).mockOnly += 1;
            }
        });
        return {
            status: 'ready',
            sourceLabel: examDate(secondMock.examId, secondMock.exam) || secondMock.examId,
            schoolCount: schoolMap.size,
            compared: sourceRows.length,
            same,
            different,
            missingInMock,
            mockOnly,
            schools: Array.from(schoolMap.values())
        };
    }

    async function ensureSummary() {
        const context = currentContext();
        if (!context.applicable) return null;
        if (state.key === context.key && state.summary?.status === 'ready') return state.summary;
        if (state.key === context.key && state.promise) return state.promise;
        state.key = context.key;
        state.summary = { status: 'loading', available: false, signature: `${context.key}::loading` };
        state.promise = Promise.resolve().then(() => {
            const latest = getLatestPoliticsRows(context);
            const thresholds = getThresholds(context, latest.rows.map((row) => row.politicsScore));
            const summary = buildMetricsSummary(context, latest.rows, latest.missing, { thresholds });
            summary.audit = buildSecondMockAudit(context, latest.rows);
            state.summary = summary;
            return summary;
        });
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

    window.Grade9PoliticsReferenceRuntime = Object.freeze({
        ensureSummary,
        getSummary,
        flushPendingPersistence: async () => 'idle',
        getPersistenceState: () => null
    });
})();
