(() => {
    if (typeof window === 'undefined' || window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__) return;

    const SCOPE_KEY = 'COUNTY_ANALYSIS_SCOPE_V1';
    const HISTORY_KEY = 'COUNTY_ANALYSIS_HISTORY_V1';
    const state = {
        promptArmed: false,
        lastSignature: '',
        teacherContextPromise: null,
        lastTeacherContextSignature: '',
        lastTeacherContextAt: 0,
        subjectRowCacheSignature: '',
        subjectRowCache: new Map(),
        horizontalTotalCacheSignature: '',
        horizontalTotalCache: [],
        teacherRowsCacheSignature: '',
        teacherRowsCache: [],
        teacherSubjectTablesCacheSignature: '',
        teacherSubjectTablesCache: [],
        countyTeacherStatsSignature: '',
        countyTeacherStats: {},
        preUploadTownshipSchools: [],
        isRendering: false,
        teacherContextToken: 0,
        teacherContextScheduledSignature: '',
        lastDataRankSignature: '',
        lastTeacherRankSignature: ''
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
    const COUNTY_SUBJECT_ORDER_GRADE9 = ['语文', '数学', '英语', '物理', '化学', '政治'];
    const COUNTY_SUBJECT_ORDER_GRADE678 = ['语文', '数学', '英语', '物理', '化学', '历史', '地理', '生物', '政治'];

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
        if (window.RankingDataService && typeof window.RankingDataService.assignCompetitionRanks === 'function') {
            return window.RankingDataService.assignCompetitionRanks(rows, scoreGetter, rankSetter);
        }
        const list = Array.isArray(rows) ? rows.slice() : [];
        list.sort((a, b) => Number(scoreGetter(b) || 0) - Number(scoreGetter(a) || 0));
        let lastScore = null;
        let lastRank = 0;
        list.forEach((row, index) => {
            const score = Number(scoreGetter(row));
            const rank = (lastScore !== null && Math.abs(score - lastScore) < 0.0001)
                ? lastRank
                : index + 1;
            rankSetter(row, rank);
            lastScore = score;
            lastRank = rank;
        });
        return list;
    }

    function formatNumber(value, digits = 2) {
        const num = Number(value);
        return Number.isFinite(num) ? num.toFixed(digits) : '-';
    }

    function formatPercent(value) {
        const num = Number(value);
        return Number.isFinite(num) ? `${(num * 100).toFixed(1)}%` : '-';
    }

    function formatCountyRankDisplay(value, rank, isPercent = false) {
        const num = Number(value);
        const displayValue = Number.isFinite(num)
            ? (isPercent ? `${(num * 100).toFixed(2)}%` : num.toFixed(2))
            : '-';
        const displayRank = rank ? ` <span style="font-size:0.9em; color:#94a3b8">(${rank})</span>` : '';
        return `${displayValue}${displayRank}`;
    }

    function normalizeCountySubjectName(subject) {
        const text = String(subject || '').trim();
        if (typeof window.normalizeSubject === 'function') return window.normalizeSubject(text);
        return text.replace(/\s+/g, '');
    }

    function getCountyGradeNumber() {
        const meta = typeof window.getExamMetaFromUI === 'function' ? window.getExamMetaFromUI() : {};
        const readStorage = (key) => {
            try { return localStorage.getItem(key) || ''; } catch (_) { return ''; }
        };
        const candidates = [
            meta?.grade,
            window.CURRENT_COHORT_META?.grade,
            window.CONFIG?.grade,
            window.CONFIG?.name,
            readStorage('CURRENT_TEACHER_TERM_ID'),
            readStorage('CURRENT_TERM_ID')
        ];
        for (const value of candidates) {
            const match = String(value || '').match(/([6-9])\s*年?级?/);
            if (match) return Number(match[1]);
        }
        return 0;
    }

    function getCountySubjectOrder() {
        const grade = getCountyGradeNumber();
        if (grade === 9) return COUNTY_SUBJECT_ORDER_GRADE9;
        if ([6, 7, 8].includes(grade)) return COUNTY_SUBJECT_ORDER_GRADE678;
        return COUNTY_SUBJECT_ORDER_GRADE678;
    }

    function sortCountySubjects(subjects) {
        const order = getCountySubjectOrder().map(normalizeCountySubjectName);
        const source = Array.from(new Set((subjects || []).map((subject) => String(subject || '').trim()).filter(Boolean)));
        return source.sort((left, right) => {
            const a = getCountySubjectSortIndex(left);
            const b = getCountySubjectSortIndex(right);
            if (a !== b) return a - b;
            return String(left).localeCompare(String(right), 'zh-CN', { numeric: true });
        });
    }

    function getCountySubjectSortIndex(subject) {
        const order = getCountySubjectOrder().map(normalizeCountySubjectName);
        const idx = order.indexOf(normalizeCountySubjectName(subject));
        return idx >= 0 ? idx : 999;
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

    function waitForIdle(timeout = 1800) {
        return new Promise((resolve) => {
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(() => resolve(true), { timeout });
                return;
            }
            window.setTimeout(() => resolve(true), Math.min(250, timeout));
        });
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

    function countySameSchoolName(left, right) {
        const leftName = String(left || '').trim();
        const rightName = String(right || '').trim();
        if (!leftName || !rightName) return false;
        if (leftName === rightName) return true;
        if (window.PermissionPolicy && typeof window.PermissionPolicy.sameSchoolName === 'function') {
            return window.PermissionPolicy.sameSchoolName(leftName, rightName);
        }
        if (typeof window.areSchoolNamesEquivalent === 'function') {
            return window.areSchoolNamesEquivalent(leftName, rightName);
        }
        if (typeof areSchoolNamesEquivalent === 'function') {
            return areSchoolNamesEquivalent(leftName, rightName);
        }
        return normalizeSchoolKey(leftName) === normalizeSchoolKey(rightName);
    }

    function countySchoolListIncludes(list, target) {
        const targetName = String(target || '').trim();
        if (!targetName) return false;
        return (Array.isArray(list) ? list : []).some((name) => countySameSchoolName(name, targetName));
    }

    function resolveCountySchoolOption(options, preferred) {
        const list = Array.from(new Set((Array.isArray(options) ? options : [])
            .map((name) => String(name || '').trim())
            .filter(Boolean)));
        const target = String(preferred || '').trim();
        if (!list.length || !target) return '';
        if (list.includes(target)) return target;
        const aliasMatch = list.find((name) => countySameSchoolName(name, target));
        if (aliasMatch) return aliasMatch;
        if (typeof window.resolveSchoolNameFromCollection === 'function') {
            const resolved = window.resolveSchoolNameFromCollection(list, target);
            if (resolved) return resolved;
        }
        if (typeof window.getCanonicalSchoolName === 'function') {
            const canonical = window.getCanonicalSchoolName(target, list);
            if (canonical && list.includes(canonical)) return canonical;
            if (canonical) {
                const canonicalMatch = list.find((name) => countySameSchoolName(name, canonical));
                if (canonicalMatch) return canonicalMatch;
            }
        }
        const normalizedTarget = normalizeSchoolKey(target);
        return list.find((name) => normalizeSchoolKey(name) === normalizedTarget) || '';
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
                const resolvedName = resolveCountySchoolOption(currentNames, rawName);
                if (resolvedName) return resolvedName;
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

    function getTeacherStatsSignature() {
        const teacherStats = window.TEACHER_STATS && typeof window.TEACHER_STATS === 'object' ? window.TEACHER_STATS : {};
        const teacherMap = window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object' ? window.TEACHER_MAP : {};
        const teacherSchoolMap = window.TEACHER_SCHOOL_MAP && typeof window.TEACHER_SCHOOL_MAP === 'object' ? window.TEACHER_SCHOOL_MAP : {};
        const teacherMapShape = Object.entries(teacherMap)
            .map(([key, value]) => `${key}:${value}`)
            .sort()
            .join('|');
        const teacherSchoolShape = Object.entries(teacherSchoolMap)
            .map(([key, value]) => `${key}:${value}`)
            .sort()
            .join('|');
        const teacherStatsShape = Object.entries(teacherStats)
            .map(([teacherName, subjectMap]) => `${teacherName}:${Object.entries(subjectMap || {})
                .map(([subject, data]) => [
                    subject,
                    toNumber(data?.avgValue ?? data?.avg).toFixed(4),
                    toNumber(data?.excellentRate ?? data?.excRate).toFixed(6),
                    toNumber(data?.passRate).toFixed(6),
                    toNumber(data?.studentCount ?? data?.count)
                ].join(':'))
                .sort()
                .join(',')}`)
            .sort()
            .join('|');
        return [
            getDataSignature(),
            getCurrentSchoolNameForTeacherScope(),
            Object.keys(teacherMap).length,
            Object.keys(teacherSchoolMap).length,
            teacherMapShape,
            teacherSchoolShape,
            Object.keys(teacherStats).length,
            teacherStatsShape
        ].join('::');
    }

    function invalidateTeacherDerivedCaches() {
        state.teacherRowsCacheSignature = '';
        state.teacherRowsCache = [];
        state.teacherSubjectTablesCacheSignature = '';
        state.teacherSubjectTablesCache = [];
        state.countyTeacherStatsSignature = '';
        state.countyTeacherStats = {};
    }

    function invalidateTeacherRankingViewCaches() {
        state.teacherRowsCacheSignature = '';
        state.teacherRowsCache = [];
        state.teacherSubjectTablesCacheSignature = '';
        state.teacherSubjectTablesCache = [];
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
            if (countySchoolListIncludes(inferredTownshipSchools, name) || townshipSet.has(name)) return true;
            if (typeof window.isTownshipManagedSchool === 'function') {
                return window.isTownshipManagedSchool(name, names);
            }
            return inferredTownshipSchools.some((item) => (
                countySameSchoolName(item, name)
                || (typeof window.areSchoolNamesMatched === 'function'
                    ? window.areSchoolNamesMatched(item, name, true)
                    : item === name)
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

    function buildCountyHorizontalTotalRows() {
        const cacheSig = getDataSignature();
        if (state.horizontalTotalCacheSignature === cacheSig) {
            return state.horizontalTotalCache.map((row) => ({ ...row }));
        }
        const rows = Object.values(window.SCHOOLS || {})
            .filter((school) => school?.metrics?.total)
            .map((school) => {
                const metric = school.metrics.total || {};
                return {
                    school,
                    schoolName: school.name || '',
                    count: toNumber(metric.count),
                    avg: toNumber(metric.avg),
                    excellentRate: toNumber(metric.excRate),
                    passRate: toNumber(metric.passRate),
                    ratedAvg: toNumber(metric.countyRatedAvg ?? school.countyRatedAvg),
                    ratedExc: toNumber(metric.countyRatedExc ?? school.countyRatedExc),
                    ratedPass: toNumber(metric.countyRatedPass ?? school.countyRatedPass),
                    score: toNumber(metric.countyScore2Rate ?? school.countyScore2Rate ?? school.score2Rate)
                };
            });
        assignCompetitionRanks(rows, (row) => row.avg, (row, rank) => { row.rankAvg = rank; });
        assignCompetitionRanks(rows, (row) => row.excellentRate, (row, rank) => { row.rankExcellent = rank; });
        assignCompetitionRanks(rows, (row) => row.passRate, (row, rank) => { row.rankPass = rank; });
        assignCompetitionRanks(rows, (row) => row.score, (row, rank) => { row.rankScore = rank; });
        const sorted = rows.sort((a, b) => (a.rankScore || 9999) - (b.rankScore || 9999));
        state.horizontalTotalCacheSignature = cacheSig;
        state.horizontalTotalCache = sorted.map((row) => ({ ...row }));
        return sorted.map((row) => ({ ...row }));
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
            const resolved = resolveCountySchoolOption(names, rawName);
            if (resolved) return resolved;
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
            .filter((school) => scopeName !== 'township' || countySchoolListIncludes(normalizedScope.townshipSchools, school.name) || townshipSet.has(school.name));
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

        let target = scored.find((row) => countySameSchoolName(row.name, schoolName));
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
        return Object.keys(getScopedTeacherAssignmentsForCounty().map || {}).length > 0;
    }

    function hasTeacherStats() {
        return Object.keys(buildCountyTeacherStats() || {}).length > 0
            || (!!window.TEACHER_STATS && Object.keys(window.TEACHER_STATS).length > 0);
    }

    function getCurrentSchoolNameForTeacherScope() {
        const rawName = String(
            (typeof window.readCurrentSchool === 'function' ? window.readCurrentSchool() : '')
            || window.MY_SCHOOL
            || localStorage.getItem('MY_SCHOOL')
            || document.getElementById('mySchoolSelect')?.value
            || ''
        ).trim();
        return resolveCountySchoolOption(getSchoolNames(), rawName) || rawName;
    }

    function getScopedTeacherAssignmentsForCounty() {
        const teacherMap = window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object' ? window.TEACHER_MAP : {};
        const schoolMap = window.TEACHER_SCHOOL_MAP && typeof window.TEACHER_SCHOOL_MAP === 'object' ? window.TEACHER_SCHOOL_MAP : {};
        const schoolName = getCurrentSchoolNameForTeacherScope();
        const schoolValues = Object.values(schoolMap).map((value) => String(value || '').trim()).filter(Boolean);
        if (!schoolName || !schoolValues.length) {
            return { map: teacherMap, schoolMap, schoolName, scoped: false, matched: Object.keys(teacherMap).length > 0 };
        }
        const scopedMap = {};
        const scopedSchoolMap = {};
        Object.entries(teacherMap).forEach(([key, teacherName]) => {
            if (!countySameSchoolName(schoolMap[key], schoolName)) return;
            scopedMap[key] = teacherName;
            scopedSchoolMap[key] = schoolMap[key];
        });
        return {
            map: scopedMap,
            schoolMap: scopedSchoolMap,
            schoolName,
            scoped: true,
            matched: Object.keys(scopedMap).length > 0
        };
    }

    function applyScopedTeacherAssignmentsForCounty() {
        const scoped = getScopedTeacherAssignmentsForCounty();
        return scoped;
    }

    function getClassSchoolCandidatesForCounty() {
        const map = new Map();
        (window.RAW_DATA || []).forEach((student) => {
            const cls = normalizeClassNameForCounty(student?.class);
            const school = String(student?.school || '').trim();
            if (!cls || !school) return;
            if (!map.has(cls)) map.set(cls, new Set());
            map.get(cls).add(school);
        });
        return map;
    }

    function inferCountyTeacherSchoolFromMap(teacherMap) {
        const explicitSchool = getCurrentSchoolNameForTeacherScope();
        const schoolMap = window.TEACHER_SCHOOL_MAP && typeof window.TEACHER_SCHOOL_MAP === 'object' ? window.TEACHER_SCHOOL_MAP : {};
        const explicitValues = Object.values(schoolMap).map((value) => String(value || '').trim()).filter(Boolean);
        if (explicitValues.length) return explicitSchool || explicitValues[0] || '';
        const classCandidates = getClassSchoolCandidatesForCounty();
        const counts = new Map();
        Object.keys(teacherMap || {}).forEach((key) => {
            const cls = normalizeClassNameForCounty(String(key || '').split('_')[0]);
            if (!cls || !classCandidates.has(cls)) return;
            classCandidates.get(cls).forEach((school) => {
                counts.set(school, (counts.get(school) || 0) + 1);
            });
        });
        const ranked = Array.from(counts.entries()).sort((a, b) => {
            if (b[1] !== a[1]) return b[1] - a[1];
            if (countySameSchoolName(a[0], explicitSchool)) return -1;
            if (countySameSchoolName(b[0], explicitSchool)) return 1;
            return String(a[0]).localeCompare(String(b[0]), 'zh-CN', { numeric: true });
        });
        return ranked[0]?.[0] || explicitSchool || '';
    }

    function normalizeClassNameForCounty(value) {
        if (typeof window.normalizeClass === 'function') return window.normalizeClass(value);
        if (window.AuthState && typeof window.AuthState.normalizeClassName === 'function') {
            return window.AuthState.normalizeClassName(value);
        }
        return String(value || '').trim().replace(/班$/, '');
    }

    function getCountySubjectThreshold(subject, kind, scores) {
        const source = window.THRESHOLDS || {};
        const config = source?.[subject] || source?.[normalizeCountySubjectName(subject)] || {};
        const direct = kind === 'excellent'
            ? (config.exc ?? config.excellent ?? config.good)
            : (config.pass ?? config.passLine);
        const directNum = Number(direct);
        if (Number.isFinite(directNum) && directNum > 0) return directNum;
        const sorted = (scores || []).map(Number).filter(Number.isFinite).sort((a, b) => b - a);
        if (!sorted.length) return kind === 'excellent' ? 0 : 60;
        if (kind === 'excellent') {
            return sorted[Math.max(0, Math.floor(sorted.length * 0.25) - 1)] || 0;
        }
        return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.8))] || 60;
    }

    function summarizeCountyTeacherScores(subject, students, thresholdStudents = students) {
        const scores = (students || [])
            .map((student) => Number(student?.scores?.[subject]))
            .filter(Number.isFinite);
        const thresholdScores = (thresholdStudents || students || [])
            .map((student) => Number(student?.scores?.[subject]))
            .filter(Number.isFinite);
        const count = scores.length;
        const avg = count ? scores.reduce((sum, value) => sum + value, 0) / count : 0;
        const excellentLine = getCountySubjectThreshold(subject, 'excellent', thresholdScores);
        const passLine = getCountySubjectThreshold(subject, 'pass', thresholdScores);
        return {
            count,
            avg,
            excellentRate: count ? scores.filter((score) => score >= excellentLine).length / count : 0,
            passRate: count ? scores.filter((score) => score >= passLine).length / count : 0
        };
    }

    function buildCountyTeacherStats() {
        const scoped = getScopedTeacherAssignmentsForCounty();
        const teacherMap = scoped.map || {};
        const teacherSchool = scoped.scoped ? scoped.schoolName : inferCountyTeacherSchoolFromMap(teacherMap);
        const signature = `${getDataSignature()}::${teacherSchool}::${Object.entries(teacherMap).map(([key, value]) => `${key}:${value}`).sort().join('|')}`;
        if (state.countyTeacherStatsSignature === signature) return state.countyTeacherStats;

        const rows = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
        const schoolRows = teacherSchool ? rows.filter((student) => countySameSchoolName(student?.school, teacherSchool)) : rows;
        const subjectByNormalized = new Map(
            (window.SUBJECTS || []).map((subject) => [normalizeCountySubjectName(subject), subject])
        );
        const rowsByClassSubject = new Map();
        schoolRows.forEach((student) => {
            const className = normalizeClassNameForCounty(student?.class);
            if (!className || !student?.scores) return;
            Object.keys(student.scores || {}).forEach((rawSubject) => {
                if (!Number.isFinite(Number(student.scores[rawSubject]))) return;
                const normalizedSubject = normalizeCountySubjectName(rawSubject);
                if (!normalizedSubject) return;
                const key = `${className}__${normalizedSubject}`;
                if (!rowsByClassSubject.has(key)) rowsByClassSubject.set(key, []);
                rowsByClassSubject.get(key).push(student);
            });
        });
        const stats = {};
        Object.entries(teacherMap).forEach(([key, teacherName]) => {
            const [rawClass, rawSubject] = String(key || '').split('_');
            const className = normalizeClassNameForCounty(rawClass);
            const normalizedSubject = normalizeCountySubjectName(rawSubject);
            const subject = subjectByNormalized.get(normalizedSubject) || rawSubject;
            if (!teacherName || !className || !subject) return;
            const students = rowsByClassSubject.get(`${className}__${normalizedSubject}`) || [];
            if (!students.length) return;
            if (!stats[teacherName]) stats[teacherName] = {};
            if (!stats[teacherName][subject]) {
                stats[teacherName][subject] = {
                    classes: [],
                    students: [],
                    subject
                };
            }
            stats[teacherName][subject].classes.push(className);
            stats[teacherName][subject].students.push(...students);
        });
        Object.values(stats).forEach((subjectMap) => {
            Object.values(subjectMap || {}).forEach((data) => {
                const uniqueStudents = new Map();
                (data.students || []).forEach((student) => {
                    const key = [
                        String(student?.school || '').trim(),
                        normalizeClassNameForCounty(student?.class),
                        String(student?.name || '').trim(),
                        String(student?.examNo || student?.考号 || '').trim()
                    ].join('__');
                    uniqueStudents.set(key, student);
                });
                data.students = Array.from(uniqueStudents.values());
                data.classes = [...new Set((data.classes || []).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));
                const summary = summarizeCountyTeacherScores(data.subject, data.students, schoolRows);
                data.studentCount = summary.count;
                data.count = summary.count;
                data.avgValue = summary.avg;
                data.avg = summary.avg;
                data.excellentRate = summary.excellentRate;
                data.passRate = summary.passRate;
                data.fairScore = summary.avg;
            });
        });
        state.countyTeacherStatsSignature = signature;
        state.countyTeacherStats = stats;
        return stats;
    }

    function getCountyTeacherStats() {
        const localStats = buildCountyTeacherStats();
        return Object.keys(localStats || {}).length ? localStats : (window.TEACHER_STATS || {});
    }

    function shouldAttemptTeacherCloudLoad() {
        const host = String(window.location?.hostname || '').trim().toLowerCase();
        return host && host !== '127.0.0.1' && host !== 'localhost';
    }

    function isCountyTeacherContextStillActive(token) {
        if (token && token !== state.teacherContextToken) return false;
        return ['county-teacher-portrait', 'county-analysis'].some((sectionId) => (
            document.getElementById(sectionId)?.classList?.contains('active')
        ));
    }

    async function ensureTeacherAnalysisRuntimeForCounty() {
        if (window.__TEACHER_ANALYSIS_CORE_RUNTIME_PATCHED__ && typeof window.analyzeTeachers === 'function') return true;
        try {
            if (window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.load === 'function') {
                await withTimeout(window.SystemRuntimeLoader.load('teacher-analysis'), 6000, false);
            } else if (typeof window.ensureTeacherAnalysisRuntimeLoaded === 'function') {
                await withTimeout(window.ensureTeacherAnalysisRuntimeLoaded(), 6000, false);
            }
        } catch (error) {
            console.warn('[county-analysis] teacher runtime load failed:', error);
        }
        return !!window.__TEACHER_ANALYSIS_CORE_RUNTIME_PATCHED__ && typeof window.analyzeTeachers === 'function';
    }

    async function ensureTeacherContextForCountyAnalysis(force = false, options = {}) {
        const activeToken = Number(options.token || state.teacherContextToken || 0);
        const requireActive = options.requireActive !== false && !force;
        if (requireActive && !isCountyTeacherContextStillActive(activeToken)) {
            return {
                hasTeacherAssignments: hasTeacherAssignments(),
                hasTeacherStats: hasTeacherStats(),
                changed: false,
                cancelled: true
            };
        }
        const schoolName = getCurrentSchoolNameForTeacherScope();
        const scopedAssignments = getScopedTeacherAssignmentsForCounty();
        const teacherSig = `${getDataSignature()}::${schoolName}::${Object.keys(scopedAssignments.map || {}).length}::${Object.keys(window.TEACHER_STATS || {}).length}`;
        const now = Date.now();
        if (!force
            && state.lastTeacherContextSignature === teacherSig
            && now - Number(state.lastTeacherContextAt || 0) < 30000
            && (hasTeacherAssignments() || hasTeacherStats())) {
            return {
                hasTeacherAssignments: hasTeacherAssignments(),
                hasTeacherStats: hasTeacherStats(),
                changed: false,
                cached: true
            };
        }
        if (!force && state.teacherContextPromise) return state.teacherContextPromise;
        state.teacherContextPromise = (async () => {
            let changed = false;

            if (requireActive && !isCountyTeacherContextStillActive(activeToken)) {
                return {
                    hasTeacherAssignments: hasTeacherAssignments(),
                    hasTeacherStats: hasTeacherStats(),
                    changed: false,
                    cancelled: true
                };
            }

            if (!hasTeacherAssignments() && !schoolName && typeof window.tryAutoRestoreTeacherMap === 'function') {
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
                        blocking: false,
                        schoolName
                    }), 10000, false);
                    changed = !!loaded || changed;
                    if (!hasTeacherAssignments() && schoolName) {
                        const fallbackLoaded = await withTimeout(window.CloudManager.loadTeachers({
                            background: true,
                            toast: false,
                            blocking: false,
                            schoolName: ''
                        }), 10000, false);
                        changed = !!fallbackLoaded || changed;
                    }
                } catch (error) {
                    console.warn('[county-analysis] loadTeachers failed:', error);
                }
            }

            applyScopedTeacherAssignmentsForCounty();
            const localStats = buildCountyTeacherStats();
            if (Object.keys(localStats || {}).length) {
                calculateCountyTeacherRanking(getCurrentScope());
                changed = true;
            }

            if (!Object.keys(localStats || {}).length
                && !hasTeacherStats()
                && hasTeacherAssignments()
                && options.allowFullTeacherAnalysis === true) {
                try {
                    if (requireActive && !isCountyTeacherContextStillActive(activeToken)) {
                        return {
                            hasTeacherAssignments: hasTeacherAssignments(),
                            hasTeacherStats: hasTeacherStats(),
                            changed: false,
                            cancelled: true
                        };
                    }
                    const teacherRuntimeReady = await ensureTeacherAnalysisRuntimeForCounty();
                    if (requireActive && !isCountyTeacherContextStillActive(activeToken)) {
                        return {
                            hasTeacherAssignments: hasTeacherAssignments(),
                            hasTeacherStats: hasTeacherStats(),
                            changed: false,
                            cancelled: true
                        };
                    }
                    if (teacherRuntimeReady && typeof window.analyzeTeachers === 'function') {
                        if (!force) await waitForIdle(200);
                        if (requireActive && !isCountyTeacherContextStillActive(activeToken)) {
                            return {
                                hasTeacherAssignments: hasTeacherAssignments(),
                                hasTeacherStats: hasTeacherStats(),
                                changed: false,
                                cancelled: true
                            };
                        }
                        await withTimeout(Promise.resolve(window.analyzeTeachers({ render: false })), 8000, null);
                        changed = true;
                    }
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
            const result = await state.teacherContextPromise;
            if (result?.hasTeacherAssignments || result?.hasTeacherStats) {
                state.lastTeacherContextSignature = teacherSig;
                state.lastTeacherContextAt = Date.now();
            }
            return result;
        } finally {
            state.teacherContextPromise = null;
        }
    }

    function getTeacherRows(limit = 12) {
        applyScopedTeacherAssignmentsForCounty();
        const signature = getTeacherStatsSignature();
        let sorted = state.teacherRowsCache;
        if (state.teacherRowsCacheSignature !== signature) {
        const rankings = window.COUNTY_TEACHER_RANKINGS || {};
        const rows = [];
        Object.entries(getCountyTeacherStats() || {}).forEach(([teacherName, subjects]) => {
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
            sorted = rows.sort((a, b) => {
            const rankA = Number.isFinite(a.countyRankAvg) ? a.countyRankAvg : 9999;
            const rankB = Number.isFinite(b.countyRankAvg) ? b.countyRankAvg : 9999;
            if (rankA !== rankB) return rankA - rankB;
            return b.score - a.score;
        });
            state.teacherRowsCacheSignature = signature;
            state.teacherRowsCache = sorted;
        }
        if (!Number.isFinite(limit) || limit <= 0) return sorted.slice();
        return sorted.slice(0, limit);
    }

    function calculateCountyTeacherRanking(scope) {
        const normalized = normalizeScope(scope || getCurrentScope() || { includesCounty: false, townshipSchools: getSchoolNames() });
        const rankingSignature = `${getTeacherStatsSignature()}::${(normalized.townshipSchools || []).join('|')}::${normalized.includesCounty ? 'county' : 'township'}`;
        if (state.lastTeacherRankSignature === rankingSignature && window.COUNTY_TEACHER_RANKINGS && window.COUNTY_TEACHER_RANKING_DATA) {
            return window.COUNTY_TEACHER_RANKINGS;
        }
        const townshipSet = new Set(normalized.townshipSchools || []);
        const isTownshipSchool = (schoolName) => countySchoolListIncludes(normalized.townshipSchools, schoolName) || townshipSet.has(schoolName);
        const teacherStats = getCountyTeacherStats() || {};
        const rankings = {};
        const rankingDataMap = {};

        sortCountySubjects(window.SUBJECTS || []).forEach((subject) => {
            const rankingData = [];

            Object.entries(teacherStats).forEach(([teacherName, subjectMap]) => {
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
                    scope: isTownshipSchool(school.name) ? 'township' : 'county'
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
        state.lastTeacherRankSignature = rankingSignature;
        invalidateTeacherRankingViewCaches();
        return rankings;
    }

    function getTeacherCountyRankingRows() {
        return getTeacherRows(Number.POSITIVE_INFINITY)
            .filter((row) => Number.isFinite(row.countyRankAvg))
            .sort((a, b) => {
                const subjectDelta = getCountySubjectSortIndex(a.subject) - getCountySubjectSortIndex(b.subject);
                if (subjectDelta !== 0) return subjectDelta;
                if ((a.countyRankAvg || 9999) !== (b.countyRankAvg || 9999)) return (a.countyRankAvg || 9999) - (b.countyRankAvg || 9999);
                return b.score - a.score;
            });
    }

    function getTeacherSubjectCountyTables() {
        if ((!window.COUNTY_TEACHER_RANKING_DATA || !Object.keys(window.COUNTY_TEACHER_RANKING_DATA).length) && Object.keys(getCountyTeacherStats() || {}).length) {
            calculateCountyTeacherRanking(getCurrentScope());
        }
        const rankingSubjects = Object.keys(window.COUNTY_TEACHER_RANKING_DATA || {}).sort((a, b) => a.localeCompare(b, 'zh-CN')).join('|');
        const signature = `${getTeacherStatsSignature()}::${state.lastTeacherRankSignature || ''}::${rankingSubjects}`;
        if (state.teacherSubjectTablesCacheSignature === signature) {
            return state.teacherSubjectTablesCache.map((group) => ({
                subject: group.subject,
                rows: (group.rows || []).slice()
            }));
        }
        const rankingData = window.COUNTY_TEACHER_RANKING_DATA || {};
        const subjects = sortCountySubjects([
            ...Object.keys(rankingData),
            ...getTeacherRows(Number.POSITIVE_INFINITY).map((row) => row.subject)
        ]);
        const tables = subjects
            .map((subject) => {
                const rows = (rankingData[subject] || []).slice().sort((a, b) => {
                    if ((a.rankAvg || 9999) !== (b.rankAvg || 9999)) return (a.rankAvg || 9999) - (b.rankAvg || 9999);
                    if (a.type !== b.type) return a.type === 'teacher' ? -1 : 1;
                    return String(a.name || '').localeCompare(String(b.name || ''), 'zh-CN', { numeric: true });
                });
                return { subject, rows };
            })
            .filter((item) => item.rows.length);
        state.teacherSubjectTablesCacheSignature = signature;
        state.teacherSubjectTablesCache = tables;
        return tables.map((group) => ({
            subject: group.subject,
            rows: (group.rows || []).slice()
        }));
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
            ['学校名称', '实考人数', '平均分', '平均分排名', '优秀率', '优秀率排名', '及格率', '及格率排名', '平均分赋分', '优秀率赋分', '及格率赋分', '两率一分总分', '县域排名'],
            ...buildCountyHorizontalTotalRows().map((row) => [
                row.schoolName || '',
                row.count || 0,
                formatNumber(row.avg),
                row.rankAvg || '-',
                formatPercent(row.excellentRate),
                row.rankExcellent || '-',
                formatPercent(row.passRate),
                row.rankPass || '-',
                formatNumber(row.ratedAvg),
                formatNumber(row.ratedExc),
                formatNumber(row.ratedPass),
                formatNumber(row.score),
                row.rankScore || '-'
            ])
        ];
    }

    function buildCountySubjectExportRows(subject) {
        return [
            ['学校名称', '实考人数', '平均分', '平均分排名', '优秀率', '优秀率排名', '及格率', '及格率排名', '平均分赋分', '优秀率赋分', '及格率赋分', '两率一分', '县域排名'],
            ...buildCountySubjectRows(subject).map((row) => [
                row.schoolName || '',
                row.count || 0,
                formatNumber(row.avg, 2),
                row.rankAvg || '-',
                formatPercent(row.excellentRate),
                row.rankExcellent || '-',
                formatPercent(row.passRate),
                row.rankPass || '-',
                formatNumber(row.ratedAvg),
                formatNumber(row.ratedExc),
                formatNumber(row.ratedPass),
                formatNumber(row.score),
                row.rank || '-'
            ])
        ];
    }

    function buildLegacyCountyRankExportRows() {
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

    function buildCountySchoolHorizontalSheets() {
        return [
            { name: '五科总-综合分析表', rows: buildCountyRankExportRows() },
            ...sortCountySubjects(window.SUBJECTS || []).map((subject) => ({
                name: `${subject}学科明细`,
                rows: buildCountySubjectExportRows(subject)
            }))
        ];
    }

    function buildTeacherPortraitExportRows() {
        return [
            ['序位', '教师/学校', '类型', '学科', '综合得分', '均分', '优秀率', '及格率', '样本人数', '县域均分排', '县域优秀率排', '县域及格率排', '对标总量', '风险级别'],
            ...getTeacherRows(Number.POSITIVE_INFINITY).map((row, index) => ([
                index + 1,
                row.teacherName || '',
                '本校教师',
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
            ])),
            [],
            ['同学科完整县域排名'],
            ['学科', '排名', '教师/学校', '类型', '均分', '优秀率', '及格率', '样本人数'],
            ...getTeacherSubjectCountyTables().flatMap((group) => group.rows.map((row) => ([
                group.subject,
                row.rankAvg || '-',
                row.name || '',
                row.type === 'teacher' ? '本校教师' : '学校整体',
                formatNumber(row.avg, 1),
                formatPercent(row.excellentRate),
                formatPercent(row.passRate),
                row.studentCount || 0
            ])))
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
        if (sig && sig === state.lastDataRankSignature && window.COUNTY_ANALYSIS_SCOPE) {
            return window.COUNTY_ANALYSIS_SCOPE;
        }
        state.lastDataRankSignature = sig;

        const scope = normalizeScope(getCurrentScope() || { includesCounty: false, townshipSchools: getSchoolNames() });
        const townshipSet = new Set(scope.townshipSchools || []);
        const isTownshipSchool = (schoolName) => countySchoolListIncludes(scope.townshipSchools, schoolName) || townshipSet.has(schoolName);
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
                school.countyScope = isTownshipSchool(school.name) ? 'township' : 'county';
                school.countyRank2Rate = index + 1;
                if (school.metrics?.total) school.metrics.total.countyRank2Rate = index + 1;
            });

        schools
            .filter((school) => isTownshipSchool(school.name))
            .sort((a, b) => toNumber(b.score2Rate) - toNumber(a.score2Rate))
            .forEach((school, index) => {
                school.townshipRank2Rate = index + 1;
                if (school.metrics?.total) school.metrics.total.townshipRank2Rate = index + 1;
            });

        // 2. 学生排名 (总分)
        const allStudents = (window.RAW_DATA || []).filter((s) => Number.isFinite(Number(s?.total)));
        const rankedAll = assignCompetitionRanks(allStudents, (s) => s.total, (s, rank) => {
            if (!s.ranks) s.ranks = {};
            if (!s.ranks.total) s.ranks.total = {};
            s.countyRank = rank;
            s.countyScope = isTownshipSchool(s.school) ? 'township' : 'county';
            s.ranks.total.county = rank;
        });

        const townshipStudents = rankedAll.filter((s) => isTownshipSchool(s.school));
        assignCompetitionRanks(townshipStudents, (s) => s.total, (s, rank) => {
            s.townshipRank = rank;
            if (!s.ranks.total) s.ranks.total = {};
            s.ranks.total.township = rank;
        });

        // 3. 学生排名 (各科)
        (window.SUBJECTS || []).forEach((subject) => {
            const subjectStudents = (window.RAW_DATA || [])
                .filter((s) => Number.isFinite(Number(s?.scores?.[subject])));

            const rankedSubjectStudents = assignCompetitionRanks(subjectStudents, (s) => s?.scores?.[subject], (s, rank) => {
                if (!s.ranks) s.ranks = {};
                if (!s.ranks[subject]) s.ranks[subject] = {};
                s.ranks[subject].county = rank;
            });

            const townshipSubjectStudents = rankedSubjectStudents.filter((s) => isTownshipSchool(s.school));
            assignCompetitionRanks(townshipSubjectStudents, (s) => s?.scores?.[subject], (s, rank) => {
                if (!s.ranks[subject]) s.ranks[subject] = {};
                s.ranks[subject].township = rank;
            });
        });

        if (hasTeacherStats()) calculateCountyTeacherRanking(scope);
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
        if (Object.keys(getCountyTeacherStats() || {}).length) calculateCountyTeacherRanking(getCurrentScope());
        const rows = getTeacherRows(10);
        if (!rows.length) {
            return hasTeacherAssignments()
                ? '<div class="county-empty">已读取任课表，但当前学校与成绩数据暂未匹配到可计算班级。</div>'
                : '<div class="county-empty">暂无任课表或教师画像数据。导入任课表后，这里会展示县域样本下的教师教学画像。</div>';
        }
        const rankingRows = getTeacherCountyRankingRows();
        const subjectTables = getTeacherSubjectCountyTables().map((group) => `
            <div class="analysis-anchor-panel county-teacher-subject-rank">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">${escapeHtml(group.subject)} 同学科县域排名</div>
                </div>
                <div class="table-wrap analysis-table-shell county-teacher-rank-table">
                    <table class="analysis-generated-table county-analysis-table">
                        <thead>
                            <tr>
                                <th>县均分排</th>
                                <th>对象</th>
                                <th>类型</th>
                                <th>均分</th>
                                <th>县优率排</th>
                                <th>优秀率</th>
                                <th>县及格排</th>
                                <th>及格率</th>
                                <th>样本人数</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${group.rows.map((row) => `
                                <tr class="${row.type === 'teacher' ? 'county-teacher-own-row' : ''}">
                                    <td>${row.rankAvg ?? '-'}</td>
                                    <td>${escapeHtml(row.name || '')}</td>
                                    <td>${row.type === 'teacher' ? '本校教师' : '学校整体'}</td>
                                    <td>${formatNumber(row.avg, 1)}</td>
                                    <td>${row.rankExc ?? '-'}</td>
                                    <td>${formatPercent(row.excellentRate)}</td>
                                    <td>${row.rankPass ?? '-'}</td>
                                    <td>${formatPercent(row.passRate)}</td>
                                    <td>${row.studentCount || 0}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join('');
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
            ${subjectTables ? `
                <div class="analysis-table-meta">
                    <span><strong>同学科完整排名：</strong>每个学科单独成表，本校教师与其他学校同学科整体放在同一张县域榜里。</span>
                </div>
                ${subjectTables}
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
        const cacheSig = getDataSignature();
        if (state.subjectRowCacheSignature !== cacheSig) {
            state.subjectRowCacheSignature = cacheSig;
            state.subjectRowCache = new Map();
        }
        if (state.subjectRowCache.has(subject)) {
            return (state.subjectRowCache.get(subject) || []).map((row) => ({ ...row }));
        }
        const rows = Object.values(window.SCHOOLS || {})
            .filter((school) => school?.metrics?.[subject])
            .map((school) => ({ school, metric: school.metrics[subject] }));
        if (!rows.length) {
            state.subjectRowCache.set(subject, []);
            return [];
        }
        const maxes = rows.reduce((acc, row) => {
            acc.avg = Math.max(acc.avg, toNumber(row.metric.avg));
            acc.excellent = Math.max(acc.excellent, toNumber(row.metric.excRate));
            acc.pass = Math.max(acc.pass, toNumber(row.metric.passRate));
            return acc;
        }, { avg: 0, excellent: 0, pass: 0 });
        const result = rows.map((row) => {
            const parts = scoreMetricAgainstMax(row.metric, maxes);
            return {
                schoolName: row.school.name || '',
                count: toNumber(row.metric.count),
                avg: toNumber(row.metric.avg),
                excellentRate: toNumber(row.metric.excRate),
                passRate: toNumber(row.metric.passRate),
                ratedAvg: parts.ratedAvg,
                ratedExc: parts.ratedExc,
                ratedPass: parts.ratedPass,
                score: parts.ratedAvg + parts.ratedExc + parts.ratedPass
            };
        });
        assignCompetitionRanks(result, (row) => row.avg, (row, rank) => { row.rankAvg = rank; });
        assignCompetitionRanks(result, (row) => row.excellentRate, (row, rank) => { row.rankExcellent = rank; });
        assignCompetitionRanks(result, (row) => row.passRate, (row, rank) => { row.rankPass = rank; });
        assignCompetitionRanks(result, (row) => row.score, (row, rank) => { row.rank = rank; });
        result.sort((a, b) => (a.rank || 9999) - (b.rank || 9999));
        state.subjectRowCache.set(subject, result.map((row) => ({ ...row })));
        return result.map((row) => ({ ...row }));
    }

    function setCountyAnalysisSchoolNameFromInput(options = {}) {
        const required = options.required !== false;
        const silent = options.silent === true;
        const input = document.getElementById('countySchoolNameInput');
        const rawName = String(input?.value || '').trim();
        if (!rawName) {
            if (required) {
                if (!silent && window.UI?.toast) window.UI.toast('请输入本校名称', 'warning');
                return false;
            }
            return true;
        }
        const names = getSchoolNames();
        const schoolName = resolveCountySchoolOption(names, rawName) || rawName;
        if (names.length && !countySchoolListIncludes(names, schoolName)) {
            if (!silent && window.UI?.toast) window.UI.toast('当前县级成绩中没有匹配到该学校，请核对名称', 'warning');
            return false;
        }
        window.MY_SCHOOL = schoolName;
        try { localStorage.setItem('MY_SCHOOL', schoolName); } catch (_) {}
        if (typeof window.writeCurrentSchool === 'function') window.writeCurrentSchool(schoolName);
        const selector = document.getElementById('mySchoolSelect');
        if (selector) {
            const optionValue = Array.from(selector.options || [])
                .map((option) => String(option.value || '').trim())
                .find((value) => countySameSchoolName(value, schoolName));
            if (optionValue) selector.value = optionValue;
        }
        if (input) input.value = schoolName;
        if (!silent && window.UI?.toast) window.UI.toast(`已锁定本校：${schoolName}`, 'success');
        return true;
    }

    function generateCountySchoolHorizontalTable() {
        const locked = setCountyAnalysisSchoolNameFromInput({ required: false, silent: true });
        if (!locked) return;
        state.subjectRowCache = new Map();
        state.subjectRowCacheSignature = '';
        state.horizontalTotalCache = [];
        state.horizontalTotalCacheSignature = '';
        applyCountyRanks();
        saveCountySnapshot();
        renderCountyAnalysis('county-school-horizontal');
        if (window.UI?.toast) window.UI.toast('县域学校横向对比表已生成', 'success');
    }

    function getCountySchoolHorizontalContext() {
        return {
            buildCountyHorizontalTotalRows,
            buildCountySubjectRows,
            sortCountySubjects,
            resolveCurrentCountySchoolName,
            getExamKey,
            escapeHtml,
            toNumber,
            formatNumber,
            formatCountyRankDisplay,
            sameSchoolName: countySameSchoolName
        };
    }

    function renderCountyHorizontalTotalTable(currentSchoolName = '') {
        const renderer = window.CountySchoolHorizontalRenderer;
        if (!renderer || typeof renderer.renderTotalTable !== 'function') {
            return '<div class="county-empty">县域学校横向分析组件加载中，请稍后重试。</div>';
        }
        return renderer.renderTotalTable(getCountySchoolHorizontalContext(), currentSchoolName);
    }

    function renderCountySchoolHorizontal() {
        const renderer = window.CountySchoolHorizontalRenderer;
        if (!renderer || typeof renderer.renderSchoolHorizontal !== 'function') {
            return '<div class="county-empty">县域学校横向分析组件加载中，请稍后重试。</div>';
        }
        return renderer.renderSchoolHorizontal(getCountySchoolHorizontalContext());
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
            state.teacherContextToken += 1;
            const renderToken = state.teacherContextToken;
            ensureCountySubmoduleSections();
            const activeId = id === 'county-analysis' ? 'county-teacher-portrait' : id;
            const root = getCountyRootForSubmodule(activeId);
            if (!root) return;
            const scope = applyCountyRanks();
            if (activeId === 'county-teacher-portrait') {
                const scheduleSignature = [
                    getDataSignature(),
                    getCurrentSchoolNameForTeacherScope(),
                    Object.keys(window.TEACHER_MAP || {}).length,
                    Object.keys(window.TEACHER_STATS || {}).length,
                    window.__TEACHER_ANALYSIS_CORE_RUNTIME_PATCHED__ ? 'core' : 'boot'
                ].join('::');
                if (state.teacherContextScheduledSignature !== scheduleSignature && !state.teacherContextPromise) {
                    state.teacherContextScheduledSignature = scheduleSignature;
                    window.setTimeout(() => {
                        void ensureTeacherContextForCountyAnalysis(false, { token: renderToken, requireActive: false }).then((result) => {
                            if (result?.changed && !state.isRendering) {
                                renderCountyAnalysis(activeId);
                            }
                        });
                    }, 0);
                }
            }
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
            studentsToShow = studentsToShow.filter((student) => countySameSchoolName(student.school, selectedSchool));
        }
        if (selectedClass && selectedClass !== '全部') {
            const normalizedSelectedClass = normalizeClassNameForCounty(selectedClass);
            studentsToShow = studentsToShow.filter((student) => (
                normalizeClassNameForCounty(student.class) === normalizedSelectedClass
            ));
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

    function isCountyPatchReady(name) {
        const fn = window[name];
        return typeof fn === 'function' && !!fn[`__countyPatched_${name}`];
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
        return ['processData', 'renderTables', 'switchTab'].every(isCountyPatchReady);
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
            .county-control-panel{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:12px 0 16px;padding:14px 16px;border:1px solid #bfdbfe;border-radius:18px;background:#f8fafc}
            .county-control-field{display:grid;gap:6px;min-width:min(420px,100%);color:#334155;font-size:12px;font-weight:900}
            .county-control-field input{width:100%;height:38px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;background:#fff;color:#0f172a;font-size:13px;font-weight:700}
            .county-control-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
            .county-teacher-own-row{background:#f0fdfa}
            @media(max-width:900px){.county-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.county-focus-card{display:block}.county-focus-metrics{grid-template-columns:1fr;min-width:0;margin-top:12px}}
            @media(max-width:560px){.county-kpi-grid{grid-template-columns:1fr}}
        `;
        document.head.appendChild(style);
    }

    function boot() {
        installStyles();
        ensureCountySubmoduleSections();
        bindUploadPromptArm();
        const patchesReady = installPatches();
        decorateUploadCountyStatus();
        if (patchesReady) return;
        let attempts = 0;
        const timer = setInterval(() => {
            attempts += 1;
            if (installPatches() || attempts > 40) clearInterval(timer);
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
        sameSchoolName: countySameSchoolName,
        resolveSchoolOption: resolveCountySchoolOption,
        resolveCurrentCountySchoolName,
        getScopedTeacherAssignmentsForCounty,
        buildCountyTeacherStats,
        exportCountyAnalysisSection,
        setCountyAnalysisSchoolNameFromInput,
        generateCountySchoolHorizontalTable
    };
    window.renderCountyAnalysis = renderCountyAnalysis;
    window.exportCountyAnalysisSection = exportCountyAnalysisSection;
    window.setCountyAnalysisSchoolNameFromInput = setCountyAnalysisSchoolNameFromInput;
    window.generateCountySchoolHorizontalTable = generateCountySchoolHorizontalTable;
    window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__ = true;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot, { once: true });
    } else {
        boot();
    }
})();
