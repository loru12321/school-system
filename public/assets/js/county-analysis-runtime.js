(() => {
    if (typeof window === 'undefined' || window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__) return;

    const SCOPE_KEY = 'COUNTY_ANALYSIS_SCOPE_V1';
    const HISTORY_KEY = 'COUNTY_ANALYSIS_HISTORY_V1';
    const state = {
        promptArmed: false,
        lastSignature: '',
        teacherContextPromise: null,
        preUploadTownshipSchools: [],
        isRendering: false,
        lastRankSignature: ''
    };
    const COUNTY_SUBMODULES = {
        'county-teacher-portrait': {
            title: '县域教师画像',
            badge: '教师县域排名',
            description: '对照“教师教学质量画像”，把本校教师放到县域所有学校同学科样本中排名，查看学科教师县域站位。'
        },
        'county-school-horizontal': {
            title: '县域学校横向分析',
            badge: '全县横向对比',
            description: '对照“两率一分(横向)”，生成五科总综合分析表和各学科明细表，按县域所有学校统一排名。'
        }
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

    function assignCompetitionRanks(rows, scoreGetter, rankSetter) {
        let lastScore = null;
        let lastRank = 0;
        rows.forEach((row, index) => {
            const score = Number(scoreGetter(row));
            const rank = (lastScore !== null && Math.abs(score - lastScore) < 0.0001)
                ? lastRank
                : index + 1;
            rankSetter(row, rank);
            lastScore = score;
            lastRank = rank;
        });
    }

    function formatNumber(value, digits = 2) {
        const num = Number(value);
        return Number.isFinite(num) ? num.toFixed(digits) : '-';
    }

    function formatPercent(value) {
        const num = Number(value);
        return Number.isFinite(num) ? `${(num * 100).toFixed(1)}%` : '-';
    }

    function getTwoRateWeights() {
        const name = String(window.CONFIG?.name || '').trim();
        return name.includes('9')
            ? { avg: 50, excellent: 80, pass: 50 }
            : { avg: 60, excellent: 70, pass: 70 };
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

    function isAggregateSchoolName(name) {
        const text = String(name || '').trim();
        return /^(?:\u6574\u4f53|\u5168\u90e8|\u6c47\u603b|\u603b\u8868|\u5408\u8ba1|\u5168\u53bf|\u53bf\u57df|Sheet\d*|\u5de5\u4f5c\u8868\d*)$/i.test(text);
    }

    function normalizeSchoolKey(name) {
        if (typeof window.normalizeSchoolName === 'function') {
            return window.normalizeSchoolName(name) || String(name || '').trim();
        }
        return String(name || '').trim();
    }

    function getTargetManagedTownshipSchools(names) {
        const currentNames = Array.isArray(names) ? names.filter(Boolean) : getSchoolNames();
        if (!currentNames.length) return [];
        if (typeof window.getTownshipManagedSchoolNames === 'function') {
            const inferred = window.getTownshipManagedSchoolNames(currentNames);
            if (Array.isArray(inferred) && inferred.length) return inferred;
        }
        const targets = window.TARGETS && typeof window.TARGETS === 'object' ? window.TARGETS : {};
        const targetKeys = Object.keys(targets);
        if (!targetKeys.length) return [];

        const byNormalizedName = new Map();
        currentNames.forEach((name) => {
            byNormalizedName.set(normalizeSchoolKey(name), name);
        });

        const resolved = targetKeys
            .map((rawName) => {
                if (typeof window.resolveSchoolNameFromCollection === 'function') {
                    const exact = window.resolveSchoolNameFromCollection(currentNames, rawName);
                    if (exact) return exact;
                }
                if (typeof window.getCanonicalSchoolName === 'function') {
                    const canonical = window.getCanonicalSchoolName(rawName, currentNames);
                    if (canonical && currentNames.includes(canonical)) return canonical;
                }
                return byNormalizedName.get(normalizeSchoolKey(rawName)) || '';
            })
            .filter((name) => name && !isAggregateSchoolName(name));

        return Array.from(new Set(resolved)).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    }

    function getDataSignature() {
        const targetKeys = Object.keys(window.TARGETS && typeof window.TARGETS === 'object' ? window.TARGETS : {})
            .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'));
        const rawDataVersion = Number(window.__RAW_DATA_VERSION || 0);
        return [
            getExamKey(),
            Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            rawDataVersion,
            getSchoolNames().join('|'),
            targetKeys.join('|')
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

    function getBestKnownTownshipSchools(names, existingScope = null) {
        const currentNames = Array.isArray(names) ? names.filter(Boolean) : getSchoolNames();
        return getTargetManagedTownshipSchools(currentNames);
    }

    function normalizeScope(scope) {
        const names = getSchoolNames();
        const inferredTownshipSchools = getTargetManagedTownshipSchools(names);
        const townshipSet = new Set(inferredTownshipSchools);
        const isTownship = (name) => {
            if (townshipSet.has(name)) return true;
            if (typeof window.isTownshipManagedSchool === 'function') {
                return window.isTownshipManagedSchool(name, names);
            }
            return inferredTownshipSchools.some((item) => (
                typeof window.areSchoolNamesMatched === 'function'
                    ? window.areSchoolNamesMatched(item, name, true)
                    : item === name
            ));
        };
        const townshipSchools = names.filter((name) => isTownship(name));
        const countySchools = names.filter((name) => !isTownship(name));
        const hasCountyScope = !!scope?.includesCounty && (townshipSchools.length > 0 || countySchools.length > 0);
        return {
            examKey: getExamKey(),
            includesCounty: hasCountyScope,
            explicitCountyUpload: hasCountyScope && scope?.explicitCountyUpload === true,
            townshipSchools,
            countySchools,
            signature: scope?.signature || getDataSignature(),
            updatedAt: scope?.updatedAt || new Date().toISOString()
        };
    }

    function getCountyRankRows() {
        return Object.values(window.SCHOOLS || {})
            .slice()
            .sort((a, b) => (a.countyRank2Rate || 9999) - (b.countyRank2Rate || 9999));
    }

    function resolveCurrentCountySchoolName() {
        const names = getSchoolNames();
        if (!names.length) return '';
        const candidates = [
            typeof window.readCurrentSchool === 'function' ? window.readCurrentSchool() : '',
            window.MY_SCHOOL,
            (() => {
                try { return localStorage.getItem('MY_SCHOOL') || ''; } catch (_) { return ''; }
            })()
        ].map((item) => String(item || '').trim()).filter(Boolean);

        for (const rawName of candidates) {
            if (names.includes(rawName)) return rawName;
            if (typeof window.resolveSchoolNameFromCollection === 'function') {
                const resolved = window.resolveSchoolNameFromCollection(names, rawName);
                if (resolved) return resolved;
            }
            if (typeof window.getCanonicalSchoolName === 'function') {
                const canonical = window.getCanonicalSchoolName(rawName, names);
                if (canonical && names.includes(canonical)) return canonical;
            }
        }
        return '';
    }

    function scoreMetricAgainstMax(metric, maxes) {
        const weights = getTwoRateWeights();
        return {
            ratedAvg: maxes.avg ? (toNumber(metric?.avg) / maxes.avg * weights.avg) : 0,
            ratedExc: maxes.excellent ? (toNumber(metric?.excRate) / maxes.excellent * weights.excellent) : 0,
            ratedPass: maxes.pass ? (toNumber(metric?.passRate) / maxes.pass * weights.pass) : 0
        };
    }

    function getSubjectSchoolRank(subject, schoolName, scopeName, scope) {
        const normalizedScope = normalizeScope(scope || getCurrentScope() || {});
        const townshipSet = new Set(normalizedScope.townshipSchools || []);
        const rows = Object.values(window.SCHOOLS || {})
            .filter((school) => school?.metrics?.[subject])
            .filter((school) => scopeName !== 'township' || townshipSet.has(school.name));
        if (!rows.length) return null;

        const maxes = rows.reduce((acc, school) => {
            const metric = school?.metrics?.[subject] || {};
            acc.avg = Math.max(acc.avg, toNumber(metric.avg));
            acc.excellent = Math.max(acc.excellent, toNumber(metric.excRate));
            acc.pass = Math.max(acc.pass, toNumber(metric.passRate));
            return acc;
        }, { avg: 0, excellent: 0, pass: 0 });

        const scored = rows.map((school) => {
            const metric = school?.metrics?.[subject] || {};
            const parts = scoreMetricAgainstMax(metric, maxes);
            return {
                name: school.name,
                metric,
                score: parts.ratedAvg + parts.ratedExc + parts.ratedPass
            };
        }).sort((a, b) => b.score - a.score);

        let target = scored.find((row) => row.name === schoolName);
        if (!target && typeof window.areSchoolNamesMatched === 'function') {
            target = scored.find((row) => window.areSchoolNamesMatched(row.name, schoolName, true));
        }
        if (!target) return null;
        const rank = scored.findIndex((row) => row === target) + 1;
        return { rank, total: scored.length, score: target.score, metric: target.metric };
    }

    function renderMySchoolCountyFocus(scope) {
        const schoolName = resolveCurrentCountySchoolName();
        const school = schoolName ? (window.SCHOOLS || {})[schoolName] : null;
        if (!school) {
            return '<div class="county-empty">未锁定本校。请先在数据管理里设置本校，县域分析会自动补充本校学科对比。</div>';
        }
        const metric = school.metrics?.total || {};
        const isTownship = school.countyScope !== 'county';
        const subjectRows = (window.SUBJECTS || [])
            .map((subject) => {
                const countyRank = getSubjectSchoolRank(subject, schoolName, 'county', scope);
                const townRank = isTownship ? getSubjectSchoolRank(subject, schoolName, 'township', scope) : null;
                if (!countyRank && !townRank) return '';
                const source = countyRank || townRank;
                return `
                    <tr>
                        <td>${escapeHtml(subject)}</td>
                        <td>${formatNumber(source?.metric?.avg, 1)}</td>
                        <td>${formatPercent(source?.metric?.excRate)}</td>
                        <td>${formatPercent(source?.metric?.passRate)}</td>
                        <td>${townRank ? `${townRank.rank}/${townRank.total}` : '-'}</td>
                        <td>${countyRank ? `${countyRank.rank}/${countyRank.total}` : '-'}</td>
                    </tr>
                `;
            })
            .filter(Boolean)
            .join('');

        return `
            <div class="county-focus-card">
                <div>
                    <span>本校县域站位</span>
                    <strong>${escapeHtml(schoolName)}</strong>
                    <p>${isTownship ? '本校属于乡镇学校：普通模块只按乡镇计算，县域分析里同时显示县排名。' : '本校当前按县直学校处理：仅在县域分析和学生县排名场景参与。'}</p>
                </div>
                <div class="county-focus-metrics">
                    <em>乡镇总排 <b>${isTownship ? (school.townshipRank2Rate || '-') : '-'}</b></em>
                    <em>县域总排 <b>${school.countyRank2Rate || '-'}</b></em>
                    <em>两率一分 <b>${formatNumber(school.countyScore2Rate ?? school.score2Rate)}</b></em>
                    <em>样本 <b>${metric.count || 0}</b></em>
                </div>
            </div>
            ${subjectRows ? `
                <div class="table-wrap analysis-table-shell county-focus-table">
                    <table class="analysis-generated-table county-analysis-table">
                        <thead><tr><th>学科</th><th>均分</th><th>优秀率</th><th>及格率</th><th>乡镇学科排</th><th>县域学科排</th></tr></thead>
                        <tbody>${subjectRows}</tbody>
                    </table>
                </div>
            ` : ''}
        `;
    }

    function getStudentArchiveData() {
        return (window.RAW_DATA || [])
            .filter((student) => Number.isFinite(Number(student?.total)))
            .slice()
            .sort((a, b) => {
                const townA = Number(a.townshipRank || 9999);
                const townB = Number(b.townshipRank || 9999);
                if (townA !== townB) return townA - townB;
                return (a.countyRank || 9999) - (b.countyRank || 9999);
            });
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
        if (!hasTeacherStats() && hasTeacherAssignments() && typeof window.analyzeTeachers === 'function') {
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
            ['学校', '范围', '人数', '平均分', '优秀率', '及格率', '两率一分', '乡镇排名', '县排名'],
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
                    formatNumber(school.countyScore2Rate ?? school.score2Rate),
                    isTownship ? (school.townshipRank2Rate || '-') : '-',
                    school.countyRank2Rate || school.rank2Rate || '-'
                ];
            })
        ];
    }

    function buildCountySubjectExportRows(subject) {
        return [
            ['排名', '学校', '人数', '均分', '优秀率', '及格率', '两率一分'],
            ...buildCountySubjectRows(subject).map((row) => [
                row.rank,
                row.schoolName || '',
                row.count || 0,
                formatNumber(row.avg, 1),
                formatPercent(row.excellentRate),
                formatPercent(row.passRate),
                formatNumber(row.score)
            ])
        ];
    }

    function buildCountySchoolHorizontalSheets() {
        return [
            { name: '五科总-综合分析表', rows: buildCountyRankExportRows() },
            ...(window.SUBJECTS || []).map((subject) => ({
                name: `${subject}学科明细`,
                rows: buildCountySubjectExportRows(subject)
            }))
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
        const subjects = window.SUBJECTS || [];
        return [
            ['乡镇排名', '县排名', '学生', '学校', '班级', '总分', '学科县排速览', ...subjects.flatMap((s) => [`${s}乡排`, `${s}县排`])],
            ...getStudentArchiveData().map((student) => ([
                student.townshipRank || '-',
                student.countyRank || '-',
                student.name || '',
                student.school || '',
                student.class || '',
                formatNumber(student.total, 1),
                buildStudentSubjectRankSummary(student),
                ...subjects.flatMap((s) => [
                    student?.ranks?.[s]?.township ?? '-',
                    student?.ranks?.[s]?.county ?? '-'
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
        const key = String(section || '').trim();
        if (key === 'student') {
            if (window.UI?.toast) window.UI.toast('学生县排名已移到“学生档案查询”的学生考试明细中，县域分析不再单独导出学生档案县排。', 'info');
            return;
        }
        const exporters = {
            rank: {
                fileName: `县域两率一分排名_${examKey}.xlsx`,
                sheets: [{ name: '县域排名', rows: buildCountyRankExportRows() }]
            },
            school: {
                fileName: `县域学校横向分析_${examKey}.xlsx`,
                sheets: buildCountySchoolHorizontalSheets()
            },
            teacher: {
                fileName: `县域教师画像_${examKey}.xlsx`,
                sheets: [{ name: '教师画像', rows: buildTeacherPortraitExportRows() }]
            },
            history: {
                fileName: `县域历史对比_${examKey}.xlsx`,
                sheets: [{ name: '历史对比', rows: buildHistoryCompareExportRows() }]
            },
            all: {
                fileName: `县域分析_${examKey}.xlsx`,
                sheets: [
                    ...buildCountySchoolHorizontalSheets(),
                    { name: '教师画像', rows: buildTeacherPortraitExportRows() },
                    { name: '历史对比', rows: buildHistoryCompareExportRows() }
                ]
            }
        };
        const target = exporters[key] || exporters.all;
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

        const knownTownshipSchools = getBestKnownTownshipSchools(names, existing);
        const knownTownshipSet = new Set(knownTownshipSchools);
        const inferredCountySchools = knownTownshipSchools.length
            ? names.filter((name) => !knownTownshipSet.has(name))
            : [];

        const includesCounty = inferredCountySchools.length > 0;
        const townshipSchools = knownTownshipSchools;

        if (includesCounty && window.UI?.toast) {
            window.UI.toast(`已按目标人数管理自动识别：乡镇 ${townshipSchools.length} 所，县直/县域 ${inferredCountySchools.length} 所`, 'info');
        }

        const scope = normalizeScope({
            includesCounty,
            explicitCountyUpload: includesCounty,
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
        const sig = getDataSignature();
        if (sig && sig === state.lastRankSignature && window.COUNTY_ANALYSIS_SCOPE) {
            return window.COUNTY_ANALYSIS_SCOPE;
        }
        state.lastRankSignature = sig;

        const scope = normalizeScope(getCurrentScope() || { includesCounty: false, townshipSchools: getSchoolNames() });
        const townshipSet = new Set(scope.townshipSchools || []);
        const schools = Object.values(window.SCHOOLS || {});
        const weights = getTwoRateWeights();
        const countyMax = { avg: 0, excellent: 0, pass: 0 };

        schools.forEach((school) => {
            const metric = school?.metrics?.total || {};
            countyMax.avg = Math.max(countyMax.avg, toNumber(metric.avg));
            countyMax.excellent = Math.max(countyMax.excellent, toNumber(metric.excRate));
            countyMax.pass = Math.max(countyMax.pass, toNumber(metric.passRate));
        });

        schools.forEach((school) => {
            const metric = school?.metrics?.total || {};
            const ratedAvg = countyMax.avg ? (toNumber(metric.avg) / countyMax.avg * weights.avg) : 0;
            const ratedExc = countyMax.excellent ? (toNumber(metric.excRate) / countyMax.excellent * weights.excellent) : 0;
            const ratedPass = countyMax.pass ? (toNumber(metric.passRate) / countyMax.pass * weights.pass) : 0;
            school.countyRatedAvg = ratedAvg;
            school.countyRatedExc = ratedExc;
            school.countyRatedPass = ratedPass;
            school.countyScore2Rate = ratedAvg + ratedExc + ratedPass;
            if (metric) {
                metric.countyRatedAvg = ratedAvg;
                metric.countyRatedExc = ratedExc;
                metric.countyRatedPass = ratedPass;
                metric.countyScore2Rate = school.countyScore2Rate;
            }
        });

        // 1. 学校排名
        schools
            .slice()
            .sort((a, b) => toNumber(b.countyScore2Rate) - toNumber(a.countyScore2Rate))
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

        // 2. 学生排名 (总分)
        const allStudents = (window.RAW_DATA || []).filter((s) => Number.isFinite(Number(s?.total)));
        const rankedAll = allStudents.slice().sort((a, b) => Number(b.total) - Number(a.total));

        assignCompetitionRanks(rankedAll, (s) => s.total, (s, rank) => {
            if (!s.ranks) s.ranks = {};
            if (!s.ranks.total) s.ranks.total = {};
            s.countyRank = rank;
            s.countyScope = townshipSet.has(s.school) ? 'township' : 'county';
            s.ranks.total.county = rank;
        });

        const townshipStudents = rankedAll.filter((s) => townshipSet.has(s.school));
        assignCompetitionRanks(townshipStudents, (s) => s.total, (s, rank) => {
            s.townshipRank = rank;
            if (!s.ranks.total) s.ranks.total = {};
            s.ranks.total.township = rank;
        });

        // 3. 学生排名 (各科)
        (window.SUBJECTS || []).forEach((subject) => {
            const subjectStudents = (window.RAW_DATA || [])
                .filter((s) => Number.isFinite(Number(s?.scores?.[subject])))
                .slice()
                .sort((a, b) => Number(b?.scores?.[subject]) - Number(a?.scores?.[subject]));

            assignCompetitionRanks(subjectStudents, (s) => s?.scores?.[subject], (s, rank) => {
                if (!s.ranks) s.ranks = {};
                if (!s.ranks[subject]) s.ranks[subject] = {};
                s.ranks[subject].county = rank;
            });

            const townshipSubjectStudents = subjectStudents.filter((s) => townshipSet.has(s.school));
            assignCompetitionRanks(townshipSubjectStudents, (s) => s?.scores?.[subject], (s, rank) => {
                if (!s.ranks[subject]) s.ranks[subject] = {};
                s.ranks[subject].township = rank;
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
                score2Rate: toNumber(school.countyScore2Rate ?? school.score2Rate),
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
                            <th>乡镇排名</th>
                            <th>县排名</th>
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
                                    <td><strong>${formatNumber(school.countyScore2Rate ?? school.score2Rate)}</strong></td>
                                    <td>${isTownship ? (school.townshipRank2Rate || '-') : '-'}</td>
                                    <td>${school.countyRank2Rate || school.rank2Rate || '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderMyTeacherCountyFocus(rankingRows) {
        const rows = Array.isArray(rankingRows) ? rankingRows.slice() : getTeacherCountyRankingRows();
        if (!rows.length) return '';
        const bestAvg = rows.slice().sort((a, b) => (a.countyRankAvg || 9999) - (b.countyRankAvg || 9999))[0];
        const bestExc = rows.slice().sort((a, b) => (a.countyRankExc || 9999) - (b.countyRankExc || 9999))[0];
        const bestPass = rows.slice().sort((a, b) => (a.countyRankPass || 9999) - (b.countyRankPass || 9999))[0];
        const subjectSet = new Set(rows.map((row) => row.subject).filter(Boolean));
        const topRows = rows.slice()
            .sort((a, b) => (a.countyRankAvg || 9999) - (b.countyRankAvg || 9999))
            .slice(0, 8);
        return `
            <div class="county-focus-card county-teacher-focus">
                <div>
                    <span>本校教师县域画像</span>
                    <strong>${rows.length} 个教师-学科样本</strong>
                    <p>县域口径会把本校任课教师与县直、乡镇所有学校同学科整体表现放在一起对标，普通教师模块仍只看乡镇口径。</p>
                </div>
                <div class="county-focus-metrics">
                    <em>覆盖学科 <b>${subjectSet.size}</b></em>
                    <em>均分最好 <b>${escapeHtml(bestAvg?.teacherName || '-')} #${bestAvg?.countyRankAvg ?? '-'}</b></em>
                    <em>优秀率最好 <b>${escapeHtml(bestExc?.teacherName || '-')} #${bestExc?.countyRankExc ?? '-'}</b></em>
                    <em>及格率最好 <b>${escapeHtml(bestPass?.teacherName || '-')} #${bestPass?.countyRankPass ?? '-'}</b></em>
                </div>
            </div>
            <div class="table-wrap analysis-table-shell county-focus-table">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>教师</th><th>学科</th><th>均分</th><th>优秀率</th><th>及格率</th><th>县均排</th><th>县优排</th><th>县及格排</th></tr></thead>
                    <tbody>
                        ${topRows.map((row) => `
                            <tr>
                                <td>${escapeHtml(row.teacherName)}</td>
                                <td>${escapeHtml(row.subject)}</td>
                                <td>${formatNumber(row.avg, 1)}</td>
                                <td>${formatPercent(row.excellentRate)}</td>
                                <td>${formatPercent(row.passRate)}</td>
                                <td>${row.countyRankAvg ?? '-'}</td>
                                <td>${row.countyRankExc ?? '-'}</td>
                                <td>${row.countyRankPass ?? '-'}</td>
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
            ${renderMyTeacherCountyFocus(rankingRows)}
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
        const subjects = window.SUBJECTS || [];
        return `
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead>
                        <tr>
                            <th>乡镇排名</th>
                            <th>县排名</th>
                            <th>学生</th>
                            <th>学校</th>
                            <th>班级</th>
                            <th>总分</th>
                            ${subjects.map(s => `<th>${s}乡排</th><th>${s}县排</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((student) => `
                            <tr>
                                <td>${student.townshipRank || '-'}</td>
                                <td>${student.countyRank || '-'}</td>
                                <td>${escapeHtml(student.name)}</td>
                                <td>${escapeHtml(student.school)}</td>
                                <td>${escapeHtml(student.class || '')}</td>
                                <td>${formatNumber(student.total, 1)}</td>
                                ${subjects.map(s => `
                                    <td>${student?.ranks?.[s]?.township || '-'}</td>
                                    <td>${student?.ranks?.[s]?.county || '-'}</td>
                                `).join('')}
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

    function getActiveCountySubmoduleId() {
        const active = ['county-teacher-portrait', 'county-school-horizontal', 'county-analysis']
            .find((id) => document.getElementById(id)?.classList?.contains('active'));
        return active === 'county-analysis' ? 'county-teacher-portrait' : (active || 'county-teacher-portrait');
    }

    function getCountyRootForSubmodule(id = getActiveCountySubmoduleId()) {
        const section = document.getElementById(id) || document.getElementById('county-analysis');
        return section?.querySelector?.('.county-analysis-root') || document.getElementById('county-analysis-root');
    }

    function ensureCountySubmoduleSections() {
        const base = document.getElementById('county-analysis');
        if (!base || base.dataset.countySubmoduleHost === '1') return;
        base.dataset.countySubmoduleHost = '1';
        Object.entries(COUNTY_SUBMODULES).forEach(([id, meta]) => {
            if (document.getElementById(id)) return;
            const section = document.createElement('div');
            section.id = id;
            section.className = 'section card-box analysis-workspace analysis-workspace-county';
            section.innerHTML = `
                <div class="module-desc-bar analysis-hero" style="border-color:#0f766e;">
                    <h3><i class="ti ti-map-2"></i> ${escapeHtml(meta.title)} <span class="badge" style="background:#0f766e;">${escapeHtml(meta.badge)}</span></h3>
                    <p>${escapeHtml(meta.description)}</p>
                </div>
                <div class="county-analysis-root">
                    <div class="info-bar analysis-info-band">导入县级成绩后，这里只呈现县域专用分析，不改变联考分析、教学管理和学情诊断的原有口径。</div>
                </div>
            `;
            base.insertAdjacentElement('afterend', section);
        });
    }

    function buildCountySubjectRows(subject) {
        const rows = Object.values(window.SCHOOLS || {})
            .filter((school) => school?.metrics?.[subject])
            .map((school) => ({ school, metric: school.metrics[subject] }));
        if (!rows.length) return [];
        const maxes = rows.reduce((acc, row) => {
            acc.avg = Math.max(acc.avg, toNumber(row.metric.avg));
            acc.excellent = Math.max(acc.excellent, toNumber(row.metric.excRate));
            acc.pass = Math.max(acc.pass, toNumber(row.metric.passRate));
            return acc;
        }, { avg: 0, excellent: 0, pass: 0 });
        return rows.map((row) => {
            const parts = scoreMetricAgainstMax(row.metric, maxes);
            return {
                schoolName: row.school.name || '',
                count: toNumber(row.metric.count),
                avg: toNumber(row.metric.avg),
                excellentRate: toNumber(row.metric.excRate),
                passRate: toNumber(row.metric.passRate),
                score: parts.ratedAvg + parts.ratedExc + parts.ratedPass
            };
        }).sort((a, b) => b.score - a.score)
            .map((row, index) => ({ ...row, rank: index + 1 }));
    }

    function renderCountySchoolHorizontal() {
        const totalRows = getCountyRankRows();
        if (!totalRows.length) return '<div class="county-empty">暂无学校成绩数据，请先导入本次县级成绩。</div>';
        const subjects = window.SUBJECTS || [];
        const subjectTables = subjects.map((subject) => {
            const rows = buildCountySubjectRows(subject);
            if (!rows.length) return '';
            return `
                <div class="analysis-anchor-panel county-subject-detail">
                    <div class="county-section-head">
                        <div class="sub-header analysis-section-head">${escapeHtml(subject)} 学科明细</div>
                    </div>
                    <div class="table-wrap analysis-table-shell">
                        <table class="analysis-generated-table county-analysis-table">
                            <thead><tr><th>排名</th><th>学校</th><th>人数</th><th>均分</th><th>优秀率</th><th>及格率</th><th>两率一分</th></tr></thead>
                            <tbody>
                                ${rows.map((row) => `
                                    <tr>
                                        <td>${row.rank}</td>
                                        <td>${escapeHtml(row.schoolName)}</td>
                                        <td>${row.count || 0}</td>
                                        <td>${formatNumber(row.avg, 1)}</td>
                                        <td>${formatPercent(row.excellentRate)}</td>
                                        <td>${formatPercent(row.passRate)}</td>
                                        <td><strong>${formatNumber(row.score)}</strong></td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');

        return `
            <div class="county-kpi-grid">
                <div><span>学校样本</span><strong>${totalRows.length}</strong><em>县域所有学校</em></div>
                <div><span>学科明细</span><strong>${subjects.length}</strong><em>按两率一分统一折算</em></div>
                <div><span>学生样本</span><strong>${(window.RAW_DATA || []).length}</strong><em>${escapeHtml(getExamKey())}</em></div>
                <div><span>输出</span><strong>横向表</strong><em>五科总 + 单科明细</em></div>
            </div>
            <div class="analysis-anchor-panel">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">五科总 - 综合分析表</div>
                    <div class="county-section-actions">
                        <button class="btn btn-sm btn-green" type="button" onclick="exportCountyAnalysisSection('school')">下载Excel</button>
                    </div>
                </div>
                <div class="analysis-table-meta">
                    <span><strong>口径：</strong>本表只用于县域分析母模块，按当前导入的全部县级学校统一排名。</span>
                </div>
                ${renderCountyRankTable()}
            </div>
            ${subjectTables || '<div class="county-empty">暂无学科明细数据。</div>'}
        `;
    }

    function renderCountyTeacherModule() {
        return `
            <div class="county-kpi-grid">
                <div><span>教师样本</span><strong>${getTeacherRows(Number.POSITIVE_INFINITY).length}</strong><em>本校教师-学科</em></div>
                <div><span>对标范围</span><strong>${getSchoolNames().length}</strong><em>县域所有学校</em></div>
                <div><span>学科数</span><strong>${(window.SUBJECTS || []).length}</strong><em>同学科排名</em></div>
                <div><span>输出</span><strong>画像表</strong><em>均分 / 优率 / 及格率</em></div>
            </div>
            <div class="analysis-anchor-panel">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">县域教师教学质量画像</div>
                    <div class="county-section-actions">
                        <button class="btn btn-sm btn-green" type="button" onclick="exportCountyAnalysisSection('teacher')">下载Excel</button>
                    </div>
                </div>
                <div class="analysis-table-meta">
                    <span><strong>口径：</strong>本校教师按任教学科，与县域所有学校该学科整体表现同表排名。</span>
                </div>
                ${renderTeacherPortraits()}
            </div>
        `;
    }

    function renderCountyAnalysis(id = getActiveCountySubmoduleId()) {
        if (state.isRendering) return;
        state.isRendering = true;
        try {
        ensureCountySubmoduleSections();
        const activeId = id === 'county-analysis' ? 'county-teacher-portrait' : id;
        const root = getCountyRootForSubmodule(activeId);
        if (!root) return;
        const scope = applyCountyRanks();
        window.setTimeout(() => {
            void ensureTeacherContextForCountyAnalysis().then((result) => {
                const isCountyVisible = ['county-teacher-portrait', 'county-school-horizontal', 'county-analysis']
                    .some((sectionId) => document.getElementById(sectionId)?.classList?.contains('active'));
                if (result?.changed && isCountyVisible && !state.isRendering) {
                    renderCountyAnalysis(activeId);
                }
            });
        }, 0);
        const names = getSchoolNames();
        const countyCount = scope.countySchools?.length || 0;
        const townshipCount = scope.townshipSchools?.length || 0;
        const totalStudents = (window.RAW_DATA || []).length;
        const html = `
            <div class="county-kpi-grid">
                <div><span>本次范围</span><strong>${scope.includesCounty ? '县域 + 乡镇' : '乡镇'}</strong><em>${escapeHtml(getExamKey())}</em></div>
                <div><span>学校数</span><strong>${names.length}</strong><em>乡镇 ${townshipCount} · 县域 ${countyCount}</em></div>
                <div><span>学生样本</span><strong>${totalStudents}</strong><em>已补充 countyRank / townshipRank</em></div>
                <div><span>当前子模块</span><strong>${escapeHtml(COUNTY_SUBMODULES[activeId]?.title || '县域教师画像')}</strong><em>不影响其他母模块</em></div>
            </div>
            ${activeId === 'county-school-horizontal' ? renderCountySchoolHorizontal() : renderCountyTeacherModule()}
        `;
        root.innerHTML = html;
        } finally {
            state.isRendering = false;
        }
    }

    function decorateAnalysisTable() {
        // 常规校际/教师模块始终只展示乡镇数据。
        // 县直数据只在“县域分析”、学情档案查询、成绩单/家长查分的县排名中参与。
    }

    function decorateStudentDetails() {
        // 学生明细保留乡镇主口径，同时在镇排后补充县排；县域模块不再单独渲染学生档案县排名块。
    }

    function getStudentCountyRankValue(student, subject) {
        if (!student?.ranks) return '-';
        if (subject === 'total') return student.countyRank || '-';
        return student.ranks[subject]?.county || '-';
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
            : ['学校', '班级', '姓名', '考号', '考场', '相对总分'];

        visibleSubjects.forEach((subject) => {
            if (isTeacher || isClassTeacher) {
                headers.push(`${subject} 分数`, `${subject} 班排`, `${subject} 级排`);
            } else {
                headers.push(`${subject} 分数`, `${subject} 相对分`, `${subject} 校排`, `${subject} 班排`);
            }
            if (!isSingleSchool) headers.push(`${subject} 镇排`);
            if (countyRankVisible) headers.push(`${subject} 县排`);
        });

        const totalLabel = String(window.CONFIG?.name || '').includes('9') ? '五科总分' : '总分';
        if (isTeacher || isClassTeacher) {
            headers.push(totalLabel, '总分班排', '总分级排');
        } else {
            headers.push(totalLabel, `${totalLabel}校排`, `${totalLabel}班排`);
        }
        if (!isSingleSchool) headers.push(`${totalLabel}镇排`);
        if (countyRankVisible) headers.push(`${totalLabel}县排`);

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
                if (!isSingleSchool) row.push(student?.ranks?.[subject]?.township ?? '-');
                if (countyRankVisible) row.push(getStudentCountyRankValue(student, subject));
            });

            if (isTeacher || isClassTeacher) {
                row.push(student.total, student?.ranks?.total?.class ?? '-', student?.ranks?.total?.school ?? '-');
            } else {
                row.push(student.total, student?.ranks?.total?.school ?? '-', student?.ranks?.total?.class ?? '-');
            }
            if (!isSingleSchool) row.push(student?.ranks?.total?.township ?? '-');
            if (countyRankVisible) row.push(getStudentCountyRankValue(student, 'total'));
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
        });
        patchGlobalFunction('switchTab', (id) => {
            if (id === 'county-analysis' || id === 'county-teacher-portrait' || id === 'county-school-horizontal') {
                setTimeout(() => renderCountyAnalysis(id), 0);
            }
        });
    }

    function bindUploadPromptArm() {
        document.addEventListener('change', (event) => {
            const target = event.target;
            if (!target || target.id !== 'fileInput') return;
            if (target.files && target.files.length) {
                state.preUploadTownshipSchools = getSchoolNames().filter((name) => !isAggregateSchoolName(name));
                state.promptArmed = true;
            }
        }, true);
    }

    function installStyles() {
        if (document.getElementById('county-analysis-runtime-style')) return;
        const style = document.createElement('style');
        style.id = 'county-analysis-runtime-style';
        style.textContent = `
            .county-module-nav{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:10px 0 14px;padding:12px 14px;border:1px solid #99f6e4;border-radius:16px;background:linear-gradient(135deg,#ecfeff,#f8fafc)}
            .county-module-nav a{display:inline-flex;align-items:center;justify-content:center;padding:7px 12px;border-radius:999px;background:#0f766e;color:#fff;font-size:12px;font-weight:900;text-decoration:none}
            .county-module-nav span{color:#475569;font-size:12px;font-weight:700}
            .county-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}
            .county-kpi-grid>div{padding:16px;border:1px solid #ccfbf1;border-radius:18px;background:linear-gradient(135deg,#f0fdfa,#fff)}
            .county-kpi-grid span,.county-kpi-grid em{display:block;color:#64748b;font-size:12px;font-style:normal}
            .county-kpi-grid strong{display:block;margin:8px 0 4px;color:#0f766e;font-size:24px}
            .county-focus-card{display:flex;align-items:stretch;justify-content:space-between;gap:16px;margin:12px 0;padding:16px;border:1px solid #bfdbfe;border-radius:18px;background:linear-gradient(135deg,#eff6ff,#fff)}
            .county-focus-card span{display:block;color:#2563eb;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
            .county-focus-card strong{display:block;margin:6px 0;color:#0f172a;font-size:20px}
            .county-focus-card p{margin:0;color:#64748b;font-size:13px;line-height:1.7}
            .county-focus-metrics{display:grid;grid-template-columns:repeat(2,minmax(120px,1fr));gap:8px;min-width:280px}
            .county-focus-metrics em{display:block;padding:10px 12px;border:1px solid rgba(148,163,184,.28);border-radius:14px;background:#fff;color:#64748b;font-size:12px;font-style:normal}
            .county-focus-metrics b{display:block;margin-top:4px;color:#0f766e;font-size:16px}
            .county-focus-table{margin:12px 0}
            .county-teacher-focus{border-color:#ddd6fe;background:linear-gradient(135deg,#f5f3ff,#fff)}
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
            @media(max-width:900px){.county-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.county-focus-card{display:block}.county-focus-metrics{grid-template-columns:1fr;min-width:0;margin-top:12px}}
            @media(max-width:560px){.county-kpi-grid{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    function boot() {
        installStyles();
        ensureCountySubmoduleSections();
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
    window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__ = true;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
