(() => {
    if (typeof window === 'undefined' || window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__) return;

    const SCOPE_KEY = 'COUNTY_ANALYSIS_SCOPE_V1';
    const HISTORY_KEY = 'COUNTY_ANALYSIS_HISTORY_V1';
    const state = {
        promptArmed: false,
        lastSignature: '',
        teacherContextPromise: null
    };

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[ch]);
    }

    function toNumber(value, fallback = 0) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function formatNumber(value, digits = 2) {
        const num = Number(value);
        return Number.isFinite(num) ? num.toFixed(digits) : '-';
    }

    function formatPercent(value) {
        const num = Number(value);
        return Number.isFinite(num) ? `${(num * 100).toFixed(1)}%` : '-';
    }

    function withTimeout(task, ms = 5000, fallback = false) {
        return Promise.race([
            Promise.resolve(task).catch(() => fallback),
            new Promise((resolve) => setTimeout(() => resolve(fallback), ms))
        ]);
    }

    function readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (_) {
            return fallback;
        }
    }

    function writeJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn('[county-analysis] failed to persist state:', error);
        }
    }

    function getExamKey() {
        return String(
            window.CURRENT_EXAM_ID
            || (typeof window.readWorkspaceExamId === 'function' ? window.readWorkspaceExamId() : '')
            || window.COHORT_DB?.currentExamId
            || 'current'
        ).trim() || 'current';
    }

    function getSchoolNames() {
        return Object.keys(window.SCHOOLS || {}).filter(Boolean).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    }

    function getDataSignature() {
        return [
            getExamKey(),
            Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            getSchoolNames().join('|')
        ].join('::');
    }

    function getScopeMap() {
        const data = readJson(SCOPE_KEY, {});
        return data && typeof data === 'object' ? data : {};
    }

    function getCurrentScope() {
        return getScopeMap()[getExamKey()] || null;
    }

    function saveCurrentScope(scope) {
        const map = getScopeMap();
        map[getExamKey()] = scope;
        writeJson(SCOPE_KEY, map);
    }

    function parseSchoolList(value) {
        return String(value || '')
            .split(/[,\n，、]+/)
            .map((item) => item.trim())
            .filter(Boolean);
    }

    function normalizeScope(scope) {
        const names = getSchoolNames();
        const nameSet = new Set(names);
        const townshipSchools = (scope?.townshipSchools || []).filter((name) => nameSet.has(name));
        const townshipSet = new Set(townshipSchools);
        const countySchools = names.filter((name) => !townshipSet.has(name));
        return {
            examKey: getExamKey(),
            includesCounty: !!scope?.includesCounty,
            townshipSchools: townshipSchools.length ? townshipSchools : names,
            countySchools: townshipSchools.length ? countySchools : [],
            signature: scope?.signature || getDataSignature(),
            updatedAt: scope?.updatedAt || new Date().toISOString()
        };
    }

    function getCountyRankRows() {
        return Object.values(window.SCHOOLS || {})
            .slice()
            .sort((a, b) => (a.countyRank2Rate || 9999) - (b.countyRank2Rate || 9999));
    }

    function getStudentArchiveData() {
        return (window.RAW_DATA || [])
            .filter((student) => Number.isFinite(Number(student?.total)))
            .slice()
            .sort((a, b) => (a.countyRank || 9999) - (b.countyRank || 9999));
    }

    function hasTeacherAssignments() {
        return !!window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0;
    }

    function hasTeacherStats() {
        return !!window.TEACHER_STATS && Object.keys(window.TEACHER_STATS).length > 0;
    }

    function shouldAttemptTeacherCloudLoad() {
        const host = String(window.location?.hostname || '').trim().toLowerCase();
        return host && host !== '127.0.0.1' && host !== 'localhost';
    }

    async function ensureTeacherContextForCountyAnalysis(force = false) {
        if (!force && state.teacherContextPromise) return state.teacherContextPromise;
        state.teacherContextPromise = (async () => {
            let changed = false;

            if (!hasTeacherAssignments() && typeof window.tryAutoRestoreTeacherMap === 'function') {
                try {
                    const restored = await withTimeout(window.tryAutoRestoreTeacherMap(), 4000, false);
                    changed = !!restored || changed;
                } catch (error) {
                    console.warn('[county-analysis] tryAutoRestoreTeacherMap failed:', error);
                }
            }

            if (!hasTeacherAssignments()
                && shouldAttemptTeacherCloudLoad()
                && window.CloudManager
                && typeof window.CloudManager.loadTeachers === 'function') {
                try {
                    const loaded = await withTimeout(window.CloudManager.loadTeachers({
                        background: true,
                        toast: false,
                        blocking: false
                    }), 5000, false);
                    changed = !!loaded || changed;
                } catch (error) {
                    console.warn('[county-analysis] loadTeachers failed:', error);
                }
            }

            if (!hasTeacherStats() && hasTeacherAssignments() && typeof window.analyzeTeachers === 'function') {
                try {
                    window.analyzeTeachers();
                    changed = true;
                } catch (error) {
                    console.warn('[county-analysis] analyzeTeachers failed:', error);
                }
            }

            if (hasTeacherStats()) {
                calculateCountyTeacherRanking(getCurrentScope());
            }

            return {
                hasTeacherAssignments: hasTeacherAssignments(),
                hasTeacherStats: hasTeacherStats(),
                changed
            };
        })();
        try {
            return await state.teacherContextPromise;
        } finally {
            state.teacherContextPromise = null;
        }
    }

    function getTeacherRows(limit = 12) {
        if ((!window.TEACHER_STATS || !Object.keys(window.TEACHER_STATS).length) && typeof window.analyzeTeachers === 'function') {
            try {
                window.analyzeTeachers();
            } catch (error) {
                console.warn('[county-analysis] analyzeTeachers failed:', error);
            }
        }
        const rankings = window.COUNTY_TEACHER_RANKINGS || {};
        const rows = [];
        Object.entries(window.TEACHER_STATS || {}).forEach(([teacherName, subjects]) => {
            Object.entries(subjects || {}).forEach(([subject, data]) => {
                const countyRank = rankings?.[teacherName]?.[subject] || {};
                rows.push({
                    teacherName,
                    subject,
                    score: toNumber(data.finalScore ?? data.fairScore ?? data.leagueScore ?? data.avgValue ?? data.avg),
                    avg: toNumber(data.avgValue ?? data.avg),
                    passRate: toNumber(data.passRate),
                    excellentRate: toNumber(data.excellentRate ?? data.excRate),
                    studentCount: toNumber(data.studentCount ?? data.count),
                    riskLevel: data.riskLevel || 'normal',
                    countyRankAvg: countyRank.rankAvg ?? null,
                    countyRankExc: countyRank.rankExc ?? null,
                    countyRankPass: countyRank.rankPass ?? null,
                    benchmarkCount: countyRank.benchmarkCount ?? 0
                });
            });
        });
        const sorted = rows.sort((a, b) => {
            const rankA = Number.isFinite(a.countyRankAvg) ? a.countyRankAvg : 9999;
            const rankB = Number.isFinite(b.countyRankAvg) ? b.countyRankAvg : 9999;
            if (rankA !== rankB) return rankA - rankB;
            return b.score - a.score;
        });
        if (!Number.isFinite(limit) || limit <= 0) return sorted;
        return sorted.slice(0, limit);
    }

    function calculateCountyTeacherRanking(scope) {
        const normalized = normalizeScope(scope || getCurrentScope() || { includesCounty: false, townshipSchools: getSchoolNames() });
        const townshipSet = new Set(normalized.townshipSchools || []);
        const rankings = {};
        const rankingDataMap = {};

        (window.SUBJECTS || []).forEach((subject) => {
            const rankingData = [];

            Object.entries(window.TEACHER_STATS || {}).forEach(([teacherName, subjectMap]) => {
                const data = subjectMap?.[subject];
                if (!data) return;
                rankingData.push({
                    name: teacherName,
                    type: 'teacher',
                    subject,
                    avg: toNumber(data.avgValue ?? data.avg),
                    excellentRate: toNumber(data.excellentRate ?? data.excRate),
                    passRate: toNumber(data.passRate),
                    studentCount: toNumber(data.studentCount ?? data.count),
                    scope: 'teacher'
                });
            });

            Object.values(window.SCHOOLS || {}).forEach((school) => {
                const metrics = school?.metrics?.[subject];
                if (!metrics) return;
                rankingData.push({
                    name: school.name || '',
                    type: 'school',
                    subject,
                    avg: toNumber(metrics.avg),
                    excellentRate: toNumber(metrics.excRate),
                    passRate: toNumber(metrics.passRate),
                    studentCount: toNumber(metrics.count),
                    scope: townshipSet.has(school.name) ? 'township' : 'county'
                });
            });

            if (!rankingData.length) return;

            rankingData.sort((a, b) => b.avg - a.avg);
            rankingData.forEach((item, index) => { item.rankAvg = index + 1; });
            rankingData.sort((a, b) => b.excellentRate - a.excellentRate);
            rankingData.forEach((item, index) => { item.rankExc = index + 1; });
            rankingData.sort((a, b) => b.passRate - a.passRate);
            rankingData.forEach((item, index) => { item.rankPass = index + 1; });
            rankingData.sort((a, b) => {
                if ((a.rankAvg || 9999) !== (b.rankAvg || 9999)) return (a.rankAvg || 9999) - (b.rankAvg || 9999);
                if (a.type !== b.type) return a.type === 'teacher' ? -1 : 1;
                return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN');
            });

            rankingData.forEach((item) => {
                if (item.type !== 'teacher') return;
                if (!rankings[item.name]) rankings[item.name] = {};
                rankings[item.name][subject] = {
                    rankAvg: item.rankAvg,
                    rankExc: item.rankExc,
                    rankPass: item.rankPass,
                    benchmarkCount: rankingData.length
                };
            });

            rankingDataMap[subject] = rankingData;
        });

        window.COUNTY_TEACHER_RANKINGS = rankings;
        window.COUNTY_TEACHER_RANKING_DATA = rankingDataMap;
        return rankings;
    }

    function getTeacherCountyRankingRows() {
        return getTeacherRows(Number.POSITIVE_INFINITY)
            .filter((row) => Number.isFinite(row.countyRankAvg))
            .sort((a, b) => {
                if ((a.countyRankAvg || 9999) !== (b.countyRankAvg || 9999)) return (a.countyRankAvg || 9999) - (b.countyRankAvg || 9999);
                return b.score - a.score;
            });
    }

    function buildStudentSubjectRankSummary(student) {
        const pairs = (window.SUBJECTS || [])
            .map((subject) => {
                const countyRank = student?.ranks?.[subject]?.county;
                if (!Number.isFinite(Number(countyRank))) return '';
                return `${subject}#${countyRank}`;
            })
            .filter(Boolean);
        return pairs.length ? pairs.join(' / ') : '-';
    }

    function getHistoryCompareRows() {
        const history = readJson(HISTORY_KEY, []).filter((item) => item?.schools?.length);
        if (history.length < 2) return [];
        const current = history[history.length - 1];
        const previous = history[history.length - 2];
        const previousMap = new Map((previous.schools || []).map((school) => [school.name, school]));
        return (current.schools || [])
            .map((school) => ({ current: school, previous: previousMap.get(school.name) }))
            .filter((item) => item.previous)
            .sort((a, b) => (a.current.countyRank || 9999) - (b.current.countyRank || 9999));
    }

    function buildCountyRankExportRows() {
        return [
            ['学校', '范围', '人数', '平均分', '优秀率', '及格率', '两率一分', '县排名', '乡镇排名'],
            ...getCountyRankRows().map((school) => {
                const metric = school.metrics?.total || {};
                const isTownship = school.countyScope !== 'county';
                return [
                    school.name || '',
                    isTownship ? '本乡镇' : '县域学校',
                    metric.count || 0,
                    formatNumber(metric.avg),
                    formatPercent(metric.excRate),
                    formatPercent(metric.passRate),
                    formatNumber(school.score2Rate),
                    school.countyRank2Rate || school.rank2Rate || '-',
                    isTownship ? (school.townshipRank2Rate || '-') : '-'
                ];
            })
        ];
    }

    function buildTeacherPortraitExportRows() {
        return [
            ['序位', '教师', '学科', '综合得分', '均分', '优秀率', '及格率', '样本人数', '风险级别'],
            ...getTeacherRows(Number.POSITIVE_INFINITY).map((row, index) => ([
                index + 1,
                row.teacherName || '',
                row.subject || '',
                formatNumber(row.score, 1),
                formatNumber(row.avg, 1),
                formatPercent(row.excellentRate),
                formatPercent(row.passRate),
                row.studentCount || 0,
                row.riskLevel || 'normal'
            ]))
        ];
    }

    function buildStudentArchiveExportRows() {
        return [
            ['县排名', '乡镇排名', '学生', '学校', '班级', '总分'],
            ...getStudentArchiveData().map((student) => ([
                student.countyRank || '-',
                student.townshipRank || '-',
                student.name || '',
                student.school || '',
                student.class || '',
                formatNumber(student.total, 1)
            ]))
        ];
    }

    function buildTeacherPortraitExportRows() {
        return [
            ['序位', '教师', '学科', '综合得分', '均分', '优秀率', '及格率', '样本人数', '县域均分排', '县域优秀率排', '县域及格率排', '对标总量', '风险级别'],
            ...getTeacherRows(Number.POSITIVE_INFINITY).map((row, index) => ([
                index + 1,
                row.teacherName || '',
                row.subject || '',
                formatNumber(row.score, 1),
                formatNumber(row.avg, 1),
                formatPercent(row.excellentRate),
                formatPercent(row.passRate),
                row.studentCount || 0,
                row.countyRankAvg ?? '-',
                row.countyRankExc ?? '-',
                row.countyRankPass ?? '-',
                row.benchmarkCount || '-',
                row.riskLevel || 'normal'
            ]))
        ];
    }

    function buildStudentArchiveExportRows() {
        return [
            ['县排名', '乡镇排名', '学生', '学校', '班级', '总分', '学科县排速览', ...(window.SUBJECTS || []).flatMap((subject) => [`${subject}县排`, `${subject}乡排`])],
            ...getStudentArchiveData().map((student) => ([
                student.countyRank || '-',
                student.townshipRank || '-',
                student.name || '',
                student.school || '',
                student.class || '',
                formatNumber(student.total, 1),
                buildStudentSubjectRankSummary(student),
                ...(window.SUBJECTS || []).flatMap((subject) => [
                    student?.ranks?.[subject]?.county ?? '-',
                    student?.ranks?.[subject]?.township ?? '-'
                ])
            ]))
        ];
    }

    function buildHistoryCompareExportRows() {
        return [
            ['学校', '本次县排名', '上次县排名', '变化', '本次两率一分'],
            ...getHistoryCompareRows().map(({ current, previous }) => {
                const delta = toNumber(previous.countyRank) - toNumber(current.countyRank);
                const changeText = delta > 0 ? `上升 ${delta}` : (delta < 0 ? `下降 ${Math.abs(delta)}` : '持平');
                return [
                    current.name || '',
                    current.countyRank || '-',
                    previous.countyRank || '-',
                    changeText,
                    formatNumber(current.score2Rate)
                ];
            })
        ];
    }

    function exportWorkbook(fileName, sheets) {
        if (!window.XLSX || typeof window.XLSX.utils?.book_new !== 'function') {
            throw new Error('XLSX export unavailable');
        }
        const workbook = window.XLSX.utils.book_new();
        (Array.isArray(sheets) ? sheets : []).forEach((sheet, index) => {
            const rows = Array.isArray(sheet?.rows) ? sheet.rows : [];
            const worksheet = window.XLSX.utils.aoa_to_sheet(rows);
            const maxColumns = rows.reduce((max, row) => Math.max(max, Array.isArray(row) ? row.length : 0), 0);
            if (maxColumns > 0) {
                worksheet['!cols'] = Array.from({ length: maxColumns }, () => ({ wch: 16 }));
            }
            const name = String(sheet?.name || `Sheet${index + 1}`).trim() || `Sheet${index + 1}`;
            window.XLSX.utils.book_append_sheet(workbook, worksheet, name.slice(0, 31));
        });
        window.XLSX.writeFile(workbook, fileName);
    }

    function exportCountyAnalysisSection(section) {
        const examKey = getExamKey();
        const exporters = {
            rank: {
                fileName: `县域两率一分排名_${examKey}.xlsx`,
                sheets: [{ name: '县域排名', rows: buildCountyRankExportRows() }]
            },
            teacher: {
                fileName: `县域教师画像_${examKey}.xlsx`,
                sheets: [{ name: '教师画像', rows: buildTeacherPortraitExportRows() }]
            },
            student: {
                fileName: `县域学生档案_${examKey}.xlsx`,
                sheets: [{ name: '学生县排', rows: buildStudentArchiveExportRows() }]
            },
            history: {
                fileName: `县域历史对比_${examKey}.xlsx`,
                sheets: [{ name: '历史对比', rows: buildHistoryCompareExportRows() }]
            },
            all: {
                fileName: `县域质量排名_${examKey}.xlsx`,
                sheets: [
                    { name: '县域排名', rows: buildCountyRankExportRows() },
                    { name: '教师画像', rows: buildTeacherPortraitExportRows() },
                    { name: '学生县排', rows: buildStudentArchiveExportRows() },
                    { name: '历史对比', rows: buildHistoryCompareExportRows() }
                ]
            }
        };
        const target = exporters[String(section || '').trim()] || exporters.all;
        exportWorkbook(target.fileName, target.sheets);
        if (window.UI?.toast) window.UI.toast('✅ 县域分析导出完成', 'success');
    }

    async function promptCountyScopeIfNeeded() {
        const signature = getDataSignature();
        const names = getSchoolNames();
        if (!state.promptArmed || !names.length || signature === state.lastSignature) return getCurrentScope();

        state.promptArmed = false;
        state.lastSignature = signature;

        const existing = getCurrentScope();
        if (existing?.signature === signature) return normalizeScope(existing);

        const includesCounty = window.confirm(
            '本次导入的成绩是否包含县里其他学校？\n\n确定：包含县域学校，系统会增加县排名。\n取消：仅乡镇学校，继续按乡镇口径分析。'
        );

        let townshipSchools = names;
        if (includesCounty) {
            const previousTownship = existing?.townshipSchools?.length ? existing.townshipSchools : names;
            const answer = window.prompt(
                '请输入“本乡镇学校”名单，用逗号分隔。\n\n留空则先按全部学校都属于乡镇处理，后续可再调整。',
                previousTownship.join('，')
            );
            const parsed = parseSchoolList(answer);
            if (parsed.length) {
                const exactSet = new Set(names);
                townshipSchools = parsed.filter((name) => exactSet.has(name));
                if (!townshipSchools.length) townshipSchools = names;
            }
        }

        const scope = normalizeScope({
            includesCounty,
            townshipSchools,
            signature,
            updatedAt: new Date().toISOString()
        });
        saveCurrentScope(scope);
        applyCountyRanks();
        saveCountySnapshot();
        renderCountyAnalysis();
        decorateAnalysisTable();
        decorateUploadCountyStatus();
        return scope;
    }

    function applyCountyRanks() {
        const scope = normalizeScope(getCurrentScope() || { includesCounty: false, townshipSchools: getSchoolNames() });
        const townshipSet = new Set(scope.townshipSchools || []);
        const schools = Object.values(window.SCHOOLS || {});

        schools
            .slice()
            .sort((a, b) => toNumber(b.score2Rate) - toNumber(a.score2Rate))
            .forEach((school, index) => {
                school.countyScope = townshipSet.has(school.name) ? 'township' : 'county';
                school.countyRank2Rate = index + 1;
                if (school.metrics?.total) school.metrics.total.countyRank2Rate = index + 1;
            });

        schools
            .filter((school) => townshipSet.has(school.name))
            .sort((a, b) => toNumber(b.score2Rate) - toNumber(a.score2Rate))
            .forEach((school, index) => {
                school.townshipRank2Rate = index + 1;
                if (school.metrics?.total) school.metrics.total.townshipRank2Rate = index + 1;
            });

        const rankedAll = (window.RAW_DATA || [])
            .filter((student) => Number.isFinite(Number(student?.total)))
            .slice()
            .sort((a, b) => Number(b.total) - Number(a.total));

        rankedAll.forEach((student, index) => {
            student.countyRank = index + 1;
            student.countyScope = townshipSet.has(student.school) ? 'township' : 'county';
        });

        rankedAll
            .filter((student) => townshipSet.has(student.school))
            .forEach((student, index) => {
                student.townshipRank = index + 1;
            });

        window.COUNTY_ANALYSIS_SCOPE = scope;
        return scope;
    }

    function applyCountyRanks() {
        const scope = normalizeScope(getCurrentScope() || { includesCounty: false, townshipSchools: getSchoolNames() });
        const townshipSet = new Set(scope.townshipSchools || []);
        const schools = Object.values(window.SCHOOLS || {});

        schools
            .slice()
            .sort((a, b) => toNumber(b.score2Rate) - toNumber(a.score2Rate))
            .forEach((school, index) => {
                school.countyScope = townshipSet.has(school.name) ? 'township' : 'county';
                school.countyRank2Rate = index + 1;
                if (school.metrics?.total) school.metrics.total.countyRank2Rate = index + 1;
            });

        schools
            .filter((school) => townshipSet.has(school.name))
            .sort((a, b) => toNumber(b.score2Rate) - toNumber(a.score2Rate))
            .forEach((school, index) => {
                school.townshipRank2Rate = index + 1;
                if (school.metrics?.total) school.metrics.total.townshipRank2Rate = index + 1;
            });

        const rankedAll = (window.RAW_DATA || [])
            .filter((student) => Number.isFinite(Number(student?.total)))
            .slice()
            .sort((a, b) => Number(b.total) - Number(a.total));

        rankedAll.forEach((student, index) => {
            if (!student.ranks) student.ranks = {};
            if (!student.ranks.total) student.ranks.total = {};
            student.countyRank = index + 1;
            student.countyScope = townshipSet.has(student.school) ? 'township' : 'county';
            student.ranks.total.county = index + 1;
        });

        rankedAll
            .filter((student) => townshipSet.has(student.school))
            .forEach((student, index) => {
                student.townshipRank = index + 1;
                if (!student.ranks) student.ranks = {};
                if (!student.ranks.total) student.ranks.total = {};
                student.ranks.total.township = index + 1;
            });

        (window.SUBJECTS || []).forEach((subject) => {
            const rankedSubjectAll = (window.RAW_DATA || [])
                .filter((student) => Number.isFinite(Number(student?.scores?.[subject])))
                .slice()
                .sort((a, b) => Number(b?.scores?.[subject]) - Number(a?.scores?.[subject]));

            rankedSubjectAll.forEach((student, index) => {
                if (!student.ranks) student.ranks = {};
                if (!student.ranks[subject]) student.ranks[subject] = {};
                student.ranks[subject].county = index + 1;
            });

            rankedSubjectAll
                .filter((student) => townshipSet.has(student.school))
                .forEach((student, index) => {
                    if (!student.ranks) student.ranks = {};
                    if (!student.ranks[subject]) student.ranks[subject] = {};
                    student.ranks[subject].township = index + 1;
                });
        });

        calculateCountyTeacherRanking(scope);
        window.COUNTY_ANALYSIS_SCOPE = scope;
        return scope;
    }

    function saveCountySnapshot() {
        const scope = getCurrentScope();
        const names = getSchoolNames();
        if (!scope || !names.length) return;
        const signature = getDataSignature();
        const history = readJson(HISTORY_KEY, []);
        const snapshot = {
            examKey: getExamKey(),
            signature,
            includesCounty: !!scope.includesCounty,
            at: new Date().toISOString(),
            schools: Object.values(window.SCHOOLS || {}).map((school) => ({
                name: school.name,
                scope: school.countyScope || 'township',
                score2Rate: toNumber(school.score2Rate),
                countyRank: school.countyRank2Rate || school.rank2Rate || 0,
                townshipRank: school.townshipRank2Rate || 0
            }))
        };
        const next = history
            .filter((item) => item.signature !== signature && item.examKey !== snapshot.examKey)
            .concat(snapshot)
            .slice(-12);
        writeJson(HISTORY_KEY, next);
    }

    function renderCountyRankTable() {
        const rows = getCountyRankRows();
        if (!rows.length) return '<div class="county-empty">暂无学校成绩数据，请先导入本次成绩。</div>';
        return `
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead>
                        <tr>
                            <th>学校</th>
                            <th>范围</th>
                            <th>人数</th>
                            <th>平均分</th>
                            <th>优秀率</th>
                            <th>及格率</th>
                            <th>两率一分</th>
                            <th>县排名</th>
                            <th>乡镇排名</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((school) => {
                            const metric = school.metrics?.total || {};
                            const isTownship = school.countyScope !== 'county';
                            return `
                                <tr>
                                    <td>${escapeHtml(school.name)}</td>
                                    <td><span class="county-scope-badge ${isTownship ? 'is-township' : 'is-county'}">${isTownship ? '本乡镇' : '县域学校'}</span></td>
                                    <td>${metric.count || 0}</td>
                                    <td>${formatNumber(metric.avg)}</td>
                                    <td>${formatPercent(metric.excRate)}</td>
                                    <td>${formatPercent(metric.passRate)}</td>
                                    <td><strong>${formatNumber(school.score2Rate)}</strong></td>
                                    <td>${school.countyRank2Rate || school.rank2Rate || '-'}</td>
                                    <td>${isTownship ? (school.townshipRank2Rate || '-') : '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderTeacherPortraits() {
        const rows = getTeacherRows(10);
        if (!rows.length) {
            return '<div class="county-empty">暂无任课表或教师画像数据。导入任课表后，这里会展示县域样本下的教师教学画像。</div>';
        }
        return `
            <div class="county-portrait-grid">
                ${rows.map((row, index) => `
                    <article class="county-portrait-card ${row.riskLevel === 'risk' ? 'is-risk' : ''}">
                        <span class="county-portrait-rank">#${index + 1}</span>
                        <h4>${escapeHtml(row.teacherName)} / ${escapeHtml(row.subject)}</h4>
                        <strong>${formatNumber(row.score, 1)}</strong>
                        <p>均分 ${formatNumber(row.avg, 1)} · 优秀率 ${formatPercent(row.excellentRate)} · 及格率 ${formatPercent(row.passRate)} · 样本 ${row.studentCount}</p>
                    </article>
                `).join('')}
            </div>
        `;
    }

    function renderStudentArchiveRows() {
        const rows = getStudentArchiveData().slice(0, 40);
        if (!rows.length) return '<div class="county-empty">暂无学生成绩数据。</div>';
        return `
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>县排名</th><th>学生</th><th>学校</th><th>班级</th><th>总分</th><th>乡镇排名</th></tr></thead>
                    <tbody>
                        ${rows.map((student) => `
                            <tr>
                                <td>${student.countyRank || '-'}</td>
                                <td>${escapeHtml(student.name)}</td>
                                <td>${escapeHtml(student.school)}</td>
                                <td>${escapeHtml(student.class || '')}</td>
                                <td>${formatNumber(student.total, 1)}</td>
                                <td>${student.townshipRank || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderTeacherPortraits() {
        const rows = getTeacherRows(10);
        if (!rows.length) {
            return '<div class="county-empty">暂无任课表或教师画像数据。导入任课表后，这里会展示县域样本下的教师教学画像。</div>';
        }
        const rankingRows = getTeacherCountyRankingRows();
        return `
            <div class="county-portrait-grid">
                ${rows.map((row, index) => `
                    <article class="county-portrait-card ${row.riskLevel === 'risk' ? 'is-risk' : ''}">
                        <span class="county-portrait-rank">#${index + 1}</span>
                        <h4>${escapeHtml(row.teacherName)} / ${escapeHtml(row.subject)}</h4>
                        <strong>${formatNumber(row.score, 1)}</strong>
                        <p>均分 ${formatNumber(row.avg, 1)} · 优秀率 ${formatPercent(row.excellentRate)} · 及格率 ${formatPercent(row.passRate)} · 样本 ${row.studentCount}</p>
                        <div class="county-portrait-rankline">
                            <span>县均排 #${row.countyRankAvg ?? '-'}</span>
                            <span>优排 #${row.countyRankExc ?? '-'}</span>
                            <span>及排 #${row.countyRankPass ?? '-'}</span>
                        </div>
                    </article>
                `).join('')}
            </div>
            ${rankingRows.length ? `
                <div class="analysis-table-meta">
                    <span><strong>县域教师总排名：</strong>按“本校教师 + 县直/乡镇各校该学科整体”混合口径对标，便于快速判断老师在县域中的位置。</span>
                </div>
                <div class="table-wrap analysis-table-shell county-teacher-rank-table">
                    <table class="analysis-generated-table county-analysis-table">
                        <thead>
                            <tr>
                                <th>教师</th>
                                <th>学科</th>
                                <th>综合得分</th>
                                <th>县均分排</th>
                                <th>县优率排</th>
                                <th>县及格排</th>
                                <th>样本人数</th>
                                <th>对标总量</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rankingRows.map((row) => `
                                <tr>
                                    <td>${escapeHtml(row.teacherName)}</td>
                                    <td>${escapeHtml(row.subject)}</td>
                                    <td>${formatNumber(row.score, 1)}</td>
                                    <td>${row.countyRankAvg ?? '-'}</td>
                                    <td>${row.countyRankExc ?? '-'}</td>
                                    <td>${row.countyRankPass ?? '-'}</td>
                                    <td>${row.studentCount || 0}</td>
                                    <td>${row.benchmarkCount || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : ''}
        `;
    }

    function renderStudentArchiveRows() {
        const rows = getStudentArchiveData().slice(0, 40);
        if (!rows.length) return '<div class="county-empty">暂无学生成绩数据。</div>';
        return `
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>县排名</th><th>学生</th><th>学校</th><th>班级</th><th>总分</th><th>乡镇排名</th><th>学科县排速览</th></tr></thead>
                    <tbody>
                        ${rows.map((student) => `
                            <tr>
                                <td>${student.countyRank || '-'}</td>
                                <td>${escapeHtml(student.name)}</td>
                                <td>${escapeHtml(student.school)}</td>
                                <td>${escapeHtml(student.class || '')}</td>
                                <td>${formatNumber(student.total, 1)}</td>
                                <td>${student.townshipRank || '-'}</td>
                                <td class="county-student-subject-summary">${escapeHtml(buildStudentSubjectRankSummary(student))}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderHistoryCompare() {
        const rows = getHistoryCompareRows().slice(0, 20);
        if (!rows.length) {
            return '<div class="county-empty">县域历史样本不足。后续再次导入县域成绩后，这里会自动显示县排名变化。</div>';
        }
        return `
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>学校</th><th>本次县排名</th><th>上次县排名</th><th>变化</th><th>本次两率一分</th></tr></thead>
                    <tbody>
                        ${rows.map(({ current, previous }) => {
                            const delta = toNumber(previous.countyRank) - toNumber(current.countyRank);
                            return `
                                <tr>
                                    <td>${escapeHtml(current.name)}</td>
                                    <td>${current.countyRank || '-'}</td>
                                    <td>${previous.countyRank || '-'}</td>
                                    <td class="${delta > 0 ? 'text-green' : delta < 0 ? 'text-red' : ''}">${delta > 0 ? `上升 ${delta}` : delta < 0 ? `下降 ${Math.abs(delta)}` : '持平'}</td>
                                    <td>${formatNumber(current.score2Rate)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderCountyAnalysis() {
        const root = document.getElementById('county-analysis-root');
        if (!root) return;
        const scope = applyCountyRanks();
        void ensureTeacherContextForCountyAnalysis().then((result) => {
            const isCountyVisible = document.getElementById('county-analysis')?.classList?.contains('active');
            if (result?.changed && isCountyVisible) {
                renderCountyAnalysis();
            }
        });
        const names = getSchoolNames();
        const countyCount = scope.countySchools?.length || 0;
        const townshipCount = scope.townshipSchools?.length || 0;
        const totalStudents = (window.RAW_DATA || []).length;
        root.innerHTML = `
            <div class="county-kpi-grid">
                <div><span>本次范围</span><strong>${scope.includesCounty ? '县域 + 乡镇' : '乡镇'}</strong><em>${escapeHtml(getExamKey())}</em></div>
                <div><span>学校数</span><strong>${names.length}</strong><em>乡镇 ${townshipCount} · 县域 ${countyCount}</em></div>
                <div><span>学生样本</span><strong>${totalStudents}</strong><em>已补充 countyRank / townshipRank</em></div>
                <div><span>历史快照</span><strong>${readJson(HISTORY_KEY, []).length}</strong><em>支持县域排名对比</em></div>
            </div>
            <div class="analysis-anchor-panel">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">县域两率一分排名</div>
                    <div class="county-section-actions">
                        <button class="btn btn-sm btn-green" type="button" onclick="exportCountyAnalysisSection('rank')">下载Excel</button>
                    </div>
                </div>
                <div class="analysis-table-meta">
                    <span><strong>口径：</strong>县排名按本次导入的全部学校排序；乡镇排名只在本乡镇学校内排序。</span>
                </div>
                ${renderCountyRankTable()}
            </div>
            <div class="analysis-anchor-panel">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">教师教学质量画像</div>
                    <div class="county-section-actions">
                        <button class="btn btn-sm btn-green" type="button" onclick="exportCountyAnalysisSection('teacher')">下载Excel</button>
                    </div>
                </div>
                ${renderTeacherPortraits()}
            </div>
            <div class="analysis-anchor-panel">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">学生档案县排名</div>
                    <div class="county-section-actions">
                        <button class="btn btn-sm btn-green" type="button" onclick="exportCountyAnalysisSection('student')">下载Excel</button>
                    </div>
                </div>
                ${renderStudentArchiveRows()}
            </div>
            <div class="analysis-anchor-panel">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">县域历史对比</div>
                    <div class="county-section-actions">
                        <button class="btn btn-sm btn-green" type="button" onclick="exportCountyAnalysisSection('history')">下载Excel</button>
                        <button class="btn btn-sm btn-primary" type="button" onclick="exportCountyAnalysisSection('all')">打包下载</button>
                    </div>
                </div>
                ${renderHistoryCompare()}
            </div>
        `;
    }

    function decorateAnalysisTable() {
        const scope = getCurrentScope();
        if (!scope?.includesCounty) return;
        applyCountyRanks();
        const table = document.getElementById('tb-total');
        if (!table) return;
        const headRow = table.querySelector('thead tr');
        if (headRow) {
            const heads = Array.from(headRow.children);
            const last = heads[heads.length - 1];
            if (last && !last.dataset.countyRankLabel) {
                last.textContent = '县排名';
                last.dataset.countyRankLabel = '1';
            }
            if (!headRow.querySelector('[data-county-township-rank]')) {
                const th = document.createElement('th');
                th.dataset.countyTownshipRank = '1';
                th.textContent = '乡镇排名';
                headRow.appendChild(th);
            }
        }
        const schoolMap = new Map(Object.values(window.SCHOOLS || {}).map((school) => [school.name, school]));
        table.querySelectorAll('tbody tr').forEach((row) => {
            const firstCellText = row.cells?.[0]?.textContent || '';
            const schoolName = Array.from(schoolMap.keys()).find((name) => firstCellText.includes(name));
            const school = schoolMap.get(schoolName);
            if (!school) return;
            let cell = row.querySelector('[data-county-township-rank-cell]');
            if (!cell) {
                cell = document.createElement('td');
                cell.dataset.countyTownshipRankCell = '1';
                row.appendChild(cell);
            }
            cell.textContent = school.countyScope === 'county' ? '-' : (school.townshipRank2Rate || '-');
        });
    }

    function decorateStudentDetails() {
        const section = document.getElementById('student-details');
        if (!section || !getCurrentScope()?.includesCounty) return;
        let note = section.querySelector('#county-student-rank-note');
        if (!note) {
            note = document.createElement('div');
            note.id = 'county-student-rank-note';
            note.className = 'info-bar analysis-info-band';
            const target = section.querySelector('.student-details-primary-flow') || section.firstElementChild;
            if (target?.parentNode) target.parentNode.insertBefore(note, target);
            else section.prepend(note);
        }
        note.innerHTML = '<span><strong>县域排名已启用：</strong>本次学生档案已写入 countyRank / townshipRank，成绩单与明细可同时引用县排名和乡镇排名。</span>';
    }

    function decorateStudentDetails() {
        const section = document.getElementById('student-details');
        if (!section || !getCurrentScope()?.includesCounty) return;
        applyCountyRanks();

        let note = section.querySelector('#county-student-rank-note');
        if (!note) {
            note = document.createElement('div');
            note.id = 'county-student-rank-note';
            note.className = 'info-bar analysis-info-band';
            const target = section.querySelector('.student-details-primary-flow') || section.firstElementChild;
            if (target?.parentNode) target.parentNode.insertBefore(note, target);
            else section.prepend(note);
        }
        note.innerHTML = '<span><strong>县域排名已启用：</strong>本次学生档案已写入总分与单科的 county / township 排名，成绩单、学生明细和县域模块都可直接引用。</span>';

        const table = document.getElementById('studentDetailTable');
        const theadRow = table?.querySelector('thead tr');
        const tbody = table?.querySelector('tbody');
        const totalItems = Number(window.STD_STATE?.cacheData?.length || 0);
        const startIdx = ((Number(window.STD_STATE?.page || 1) - 1) * Number(window.STD_STATE?.size || 50));
        const displayList = Array.isArray(window.STD_STATE?.cacheData)
            ? window.STD_STATE.cacheData.slice(startIdx, startIdx + Number(window.STD_STATE?.size || 50))
            : [];
        const user = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null;
        const role = user?.role || 'guest';
        const isTeacher = role === 'teacher';
        const isClassTeacher = role === 'class_teacher';
        const classTeacherMode = isClassTeacher && typeof window.getClassTeacherStudentViewMode === 'function'
            ? window.getClassTeacherStudentViewMode()
            : 'teaching';
        const teacherScope = (isTeacher || (isClassTeacher && classTeacherMode === 'teaching')) && typeof window.getTeacherScopeForUser === 'function'
            ? window.getTeacherScopeForUser(user)
            : null;
        const visibleSubjects = (isTeacher || (isClassTeacher && classTeacherMode === 'teaching'))
            ? (window.SUBJECTS || []).filter((subject) => teacherScope?.subjects?.has(window.normalizeSubject ? window.normalizeSubject(subject) : subject))
            : (window.SUBJECTS || []);
        const isMobileMode = table?.classList?.contains('student-detail-mobile-table');
        const isSingleSchool = typeof window.isSingleSchoolMode === 'function' ? window.isSingleSchoolMode() : Object.keys(window.SCHOOLS || {}).length <= 1;

        if (isMobileMode) {
            const cards = Array.from(section.querySelectorAll('.student-detail-mobile-card'));
            cards.forEach((card, index) => {
                const student = displayList[index];
                if (!student) return;
                const rankGrid = card.querySelector('.student-detail-mobile-rank-grid');
                if (rankGrid && !rankGrid.querySelector('[data-county-total-rank]')) {
                    const item = document.createElement('div');
                    item.className = 'student-detail-mobile-info';
                    item.dataset.countyTotalRank = '1';
                    item.innerHTML = `<span>总分县排</span><strong>${escapeHtml(getStudentCountyRankValue(student, 'total'))}</strong>`;
                    rankGrid.appendChild(item);
                }
                Array.from(card.querySelectorAll('.student-detail-mobile-subject')).forEach((subjectCard, subjectIndex) => {
                    const subject = visibleSubjects[subjectIndex];
                    if (!subject) return;
                    const rankRow = subjectCard.querySelector('.student-detail-mobile-rank-row');
                    if (!rankRow || rankRow.querySelector('[data-county-subject-rank]')) return;
                    const chip = document.createElement('span');
                    chip.dataset.countySubjectRank = '1';
                    chip.textContent = `县 ${getStudentCountyRankValue(student, subject)}`;
                    rankRow.appendChild(chip);
                });
            });
            return;
        }

        if (!theadRow || !tbody || !displayList.length || !totalItems) return;
        if (theadRow.querySelector('[data-county-rank-col="1"]')) return;

        const baseCount = (!isTeacher && !isClassTeacher) ? 6 : 3;
        const subjectGroupSize = (!isTeacher && !isClassTeacher) ? (isSingleSchool ? 4 : 5) : (isSingleSchool ? 3 : 4);
        const totalGroupSize = (!isTeacher && !isClassTeacher) ? (isSingleSchool ? 3 : 4) : (isSingleSchool ? 2 : 3);
        const subjectInsertOffset = (!isTeacher && !isClassTeacher) ? 4 : 3;
        const totalInsertOffset = (!isTeacher && !isClassTeacher) ? 3 : 2;

        for (let subjectIndex = visibleSubjects.length - 1; subjectIndex >= 0; subjectIndex -= 1) {
            const insertPos = baseCount + (subjectIndex * subjectGroupSize) + subjectInsertOffset;
            const th = document.createElement('th');
            th.dataset.countyRankCol = '1';
            th.textContent = '县';
            theadRow.insertBefore(th, theadRow.children[insertPos] || null);
        }
        const totalInsertPos = baseCount + (visibleSubjects.length * subjectGroupSize) + totalInsertOffset;
        const totalTh = document.createElement('th');
        totalTh.dataset.countyRankCol = '1';
        totalTh.textContent = '县';
        theadRow.insertBefore(totalTh, theadRow.children[totalInsertPos] || null);

        const dataRows = Array.from(tbody.querySelectorAll('tr')).filter((row) => !(row.cells.length === 1 && Number(row.cells[0]?.colSpan || 0) >= 50));
        dataRows.forEach((row, index) => {
            const student = displayList[index];
            if (!student) return;
            for (let subjectIndex = visibleSubjects.length - 1; subjectIndex >= 0; subjectIndex -= 1) {
                const subject = visibleSubjects[subjectIndex];
                const insertPos = baseCount + (subjectIndex * subjectGroupSize) + subjectInsertOffset;
                const td = document.createElement('td');
                td.className = 'text-gray';
                td.dataset.countyRankCol = '1';
                td.textContent = getStudentCountyRankValue(student, subject);
                row.insertBefore(td, row.children[insertPos] || null);
            }
            const totalTd = document.createElement('td');
            totalTd.dataset.countyRankCol = '1';
            totalTd.textContent = getStudentCountyRankValue(student, 'total');
            row.insertBefore(totalTd, row.children[totalInsertPos] || null);
        });
    }

    function exportStudentDetailsWithCountyRanks() {
        if (!(window.RAW_DATA || []).length) {
            alert('请先上传数据');
            return;
        }
        applyCountyRanks();

        const user = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null;
        const role = user?.role || 'guest';
        const isTeacher = role === 'teacher';
        const isClassTeacher = role === 'class_teacher';
        const classTeacherMode = isClassTeacher && typeof window.getClassTeacherStudentViewMode === 'function'
            ? window.getClassTeacherStudentViewMode()
            : 'teaching';
        const needTeacherScope = isTeacher || (isClassTeacher && classTeacherMode === 'teaching');
        const teacherScope = needTeacherScope && typeof window.getTeacherScopeForUser === 'function'
            ? window.getTeacherScopeForUser(user)
            : null;
        const visibleSubjects = (isTeacher || (isClassTeacher && classTeacherMode === 'teaching'))
            ? (window.SUBJECTS || []).filter((subject) => teacherScope?.subjects?.has(window.normalizeSubject ? window.normalizeSubject(subject) : subject))
            : (window.SUBJECTS || []);
        const selectedSchool = document.getElementById('studentSchoolSelect')?.value || '';
        const selectedClass = document.getElementById('studentClassSelect')?.value || '';
        const isSingleSchool = typeof window.isSingleSchoolMode === 'function' ? window.isSingleSchoolMode() : Object.keys(window.SCHOOLS || {}).length <= 1;

        let studentsToShow = [...(window.RAW_DATA || [])];
        if ((isTeacher || (isClassTeacher && classTeacherMode === 'teaching')) && teacherScope?.classes?.size > 0) {
            studentsToShow = studentsToShow.filter((student) => {
                const rawClass = String(student.class || '').trim();
                const normalizedClass = typeof window.normalizeClass === 'function' ? window.normalizeClass(student.class) : rawClass;
                if (teacherScope.classes.has(normalizedClass) || teacherScope.classes.has(rawClass)) return true;
                return Array.from(teacherScope.classes).some((allowedCls) => String(allowedCls).replace(/[\s\.]/g, '') === rawClass.replace(/[\s\.]/g, ''));
            });
        } else if (isClassTeacher && user?.class && typeof window.normalizeClass === 'function') {
            const myClass = window.normalizeClass(user.class);
            studentsToShow = studentsToShow.filter((student) => window.normalizeClass(student.class) === myClass);
        }

        if (selectedSchool && !selectedSchool.includes('请选择')) {
            studentsToShow = studentsToShow.filter((student) => student.school === selectedSchool);
        }
        if (selectedClass && selectedClass !== '全部') {
            studentsToShow = studentsToShow.filter((student) => student.class === selectedClass);
        }

        if (typeof window.getComparisonStudentList === 'function') {
            studentsToShow = window.getComparisonStudentList(studentsToShow, window.RAW_DATA || []);
        }
        studentsToShow.sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));

        const countyRankVisible = typeof window.hasStudentCountyRankData === 'function'
            ? window.hasStudentCountyRankData(studentsToShow, visibleSubjects)
            : studentsToShow.some((student) => getStudentCountyRankValue(student, 'total') !== '-');

        const headers = (isTeacher || isClassTeacher)
            ? ['学校', '班级', '姓名']
            : ['学校', '班级', '姓名', '考号', '考场', '标准总T分'];

        visibleSubjects.forEach((subject) => {
            if (isTeacher || isClassTeacher) {
                headers.push(`${subject} 分数`, `${subject} 班排`, `${subject} 级排`);
            } else {
                headers.push(`${subject} 分数`, `${subject} T分`, `${subject} 校排`, `${subject} 班排`);
            }
            if (countyRankVisible) headers.push(`${subject} 县排`);
            if (!isSingleSchool) headers.push(`${subject} 镇排`);
        });

        const totalLabel = String(window.CONFIG?.name || '').includes('9') ? '五科总分' : '总分';
        if (isTeacher || isClassTeacher) {
            headers.push(totalLabel, '总分班排', '总分级排');
        } else {
            headers.push(totalLabel, `${totalLabel}校排`, `${totalLabel}班排`);
        }
        if (countyRankVisible) headers.push(`${totalLabel}县排`);
        if (!isSingleSchool) headers.push(`${totalLabel}镇排`);

        const data = [headers];
        studentsToShow.forEach((student) => {
            const row = (isTeacher || isClassTeacher)
                ? [student.school, student.class, student.name]
                : [student.school, student.class, student.name, student.id, student.examRoom, student.totalTScore || 0];

            visibleSubjects.forEach((subject) => {
                if (isTeacher || isClassTeacher) {
                    row.push(
                        student.scores?.[subject] ?? '-',
                        student?.ranks?.[subject]?.class ?? '-',
                        student?.ranks?.[subject]?.school ?? '-'
                    );
                } else {
                    row.push(
                        student.scores?.[subject] ?? '-',
                        student?.tScores?.[subject] ?? '-',
                        student?.ranks?.[subject]?.school ?? '-',
                        student?.ranks?.[subject]?.class ?? '-'
                    );
                }
                if (countyRankVisible) row.push(getStudentCountyRankValue(student, subject));
                if (!isSingleSchool) row.push(student?.ranks?.[subject]?.township ?? '-');
            });

            if (isTeacher || isClassTeacher) {
                row.push(student.total, student?.ranks?.total?.class ?? '-', student?.ranks?.total?.school ?? '-');
            } else {
                row.push(student.total, student?.ranks?.total?.school ?? '-', student?.ranks?.total?.class ?? '-');
            }
            if (countyRankVisible) row.push(getStudentCountyRankValue(student, 'total'));
            if (!isSingleSchool) row.push(student?.ranks?.total?.township ?? '-');
            data.push(row);
        });

        const workbook = window.XLSX.utils.book_new();
        const worksheet = window.XLSX.utils.aoa_to_sheet(data);
        if (typeof window.decorateExcelSheet === 'function') window.decorateExcelSheet(worksheet, headers);
        window.XLSX.utils.book_append_sheet(workbook, worksheet, '学生考试明细');
        if (isTeacher || isClassTeacher) {
            const exportTag = typeof window.buildTeacherExportTag === 'function'
                ? window.buildTeacherExportTag(user, new Set(visibleSubjects || []))
                : 'teacher';
            window.XLSX.writeFile(workbook, `学生考试明细_${exportTag}.xlsx`);
        } else {
            window.XLSX.writeFile(workbook, '学生考试明细.xlsx');
        }
    }

    function decorateUploadCountyStatus() {
        const feedback = document.getElementById('upload-feedback-board');
        if (!feedback) return;
        let card = document.getElementById('upload-county-scope-card');
        if (!card) {
            card = document.createElement('div');
            card.id = 'upload-county-scope-card';
            card.className = 'upload-feedback-card';
            feedback.appendChild(card);
        }
        const scope = getCurrentScope();
        card.innerHTML = `
            <h4><i class="ti ti-map-2"></i> 县域对比口径</h4>
            <p>${scope?.includesCounty
                ? `已启用县域排名：乡镇 ${scope.townshipSchools.length} 所，县域学校 ${scope.countySchools.length} 所。`
                : '本次暂按乡镇成绩处理。导入新成绩时会询问是否包含县里学校。'}</p>
        `;
    }

    function patchGlobalFunction(name, after) {
        const original = window[name];
        if (typeof original !== 'function' || original[`__countyPatched_${name}`]) return false;
        const patched = function countyPatchedFunction(...args) {
            const result = original.apply(this, args);
            const runAfter = (value) => {
                after(...args);
                return value;
            };
            if (result && typeof result.then === 'function') {
                return result.then(runAfter);
            }
            runAfter(result);
            return result;
        };
        patched[`__countyPatched_${name}`] = true;
        window[name] = patched;
        return true;
    }

    function installPatches() {
        patchGlobalFunction('processData', () => {
            applyCountyRanks();
            saveCountySnapshot();
            promptCountyScopeIfNeeded();
        });
        patchGlobalFunction('renderTables', () => {
            applyCountyRanks();
            decorateAnalysisTable();
        });
        patchGlobalFunction('renderStudentDetails', () => {
            applyCountyRanks();
            decorateStudentDetails();
        });
        patchGlobalFunction('switchTab', (id) => {
            if (id === 'county-analysis') setTimeout(renderCountyAnalysis, 0);
            if (id === 'student-details') setTimeout(decorateStudentDetails, 0);
        });
    }

    function bindUploadPromptArm() {
        document.addEventListener('change', (event) => {
            const target = event.target;
            if (!target || target.id !== 'fileInput') return;
            if (target.files && target.files.length) state.promptArmed = true;
        }, true);
    }

    function installStyles() {
        if (document.getElementById('county-analysis-runtime-style')) return;
        const style = document.createElement('style');
        style.id = 'county-analysis-runtime-style';
        style.textContent = `
            .county-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}
            .county-kpi-grid>div{padding:16px;border:1px solid #ccfbf1;border-radius:18px;background:linear-gradient(135deg,#f0fdfa,#fff)}
            .county-kpi-grid span,.county-kpi-grid em{display:block;color:#64748b;font-size:12px;font-style:normal}
            .county-kpi-grid strong{display:block;margin:8px 0 4px;color:#0f766e;font-size:24px}
            .county-scope-badge{display:inline-flex;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:800}
            .county-scope-badge.is-township{background:#dcfce7;color:#166534}
            .county-scope-badge.is-county{background:#dbeafe;color:#1d4ed8}
            .county-empty{padding:14px 16px;border:1px dashed #cbd5e1;border-radius:14px;background:#f8fafc;color:#64748b}
            .county-portrait-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
            .county-portrait-card{position:relative;padding:16px;border:1px solid #dbeafe;border-radius:18px;background:#fff}
            .county-portrait-card.is-risk{border-color:#fecaca;background:#fff7f7}
            .county-portrait-card h4{margin:0 0 8px;color:#0f172a}
            .county-portrait-card strong{font-size:28px;color:#0f766e}
            .county-portrait-card p{margin:8px 0 0;color:#64748b;font-size:12px;line-height:1.6}
            .county-portrait-rank{position:absolute;right:14px;top:12px;color:#94a3b8;font-weight:900}
            .county-portrait-rankline{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;color:#0f172a;font-size:12px}
            .county-portrait-rankline span{background:#f8fafc;border:1px solid rgba(148,163,184,.35);border-radius:999px;padding:4px 10px}
            .county-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
            .county-section-actions{display:flex;gap:8px;flex-wrap:wrap}
            @media(max-width:900px){.county-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
            @media(max-width:560px){.county-kpi-grid{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    function boot() {
        installStyles();
        bindUploadPromptArm();
        installPatches();
        applyCountyRanks();
        decorateUploadCountyStatus();
        let attempts = 0;
        const timer = setInterval(() => {
            attempts += 1;
            installPatches();
            if (attempts > 40) clearInterval(timer);
        }, 300);
    }

    window.CountyAnalysisRuntime = {
        applyCountyRanks,
        renderCountyAnalysis,
        ensureTeacherContextForCountyAnalysis,
        promptCountyScopeIfNeeded,
        decorateAnalysisTable,
        decorateStudentDetails,
        saveCountySnapshot,
        getCurrentScope,
        exportCountyAnalysisSection
    };
    window.renderCountyAnalysis = renderCountyAnalysis;
    window.exportCountyAnalysisSection = exportCountyAnalysisSection;
    window.exportStudentDetails = exportStudentDetailsWithCountyRanks;
    window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__ = true;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
