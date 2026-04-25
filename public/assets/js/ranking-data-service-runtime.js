(function (root, factory) {
    const service = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createService = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createService.service = service;
        module.exports = createService;
    }

    if (!root || root.RankingDataService) return;
    root.RankingDataService = service;
    if (typeof root.assignCompetitionRanks !== 'function') {
        root.assignCompetitionRanks = service.assignCompetitionRanks;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createRankingDataService(root) {
    const EPSILON = 0.0001;

    function normalizeText(value) {
        return String(value == null ? '' : value).trim();
    }

    function toFiniteNumber(value, fallback = Number.NEGATIVE_INFINITY) {
        const num = Number(value);
        return Number.isFinite(num) ? num : fallback;
    }

    function ensureSubjectRank(row, subject) {
        if (!row || typeof row !== 'object') return null;
        const key = normalizeText(subject) || 'total';
        if (!row.ranks || typeof row.ranks !== 'object') row.ranks = {};
        if (!row.ranks[key] || typeof row.ranks[key] !== 'object') row.ranks[key] = {};
        return row.ranks[key];
    }

    function setRank(row, subject, scope, rank) {
        const bucket = ensureSubjectRank(row, subject);
        const normalizedScope = normalizeText(scope);
        if (!bucket || !normalizedScope) return row;
        bucket[normalizedScope] = rank;
        if (subject === 'total') {
            if (normalizedScope === 'county') row.countyRank = rank;
            if (normalizedScope === 'township') row.townRank = rank;
            if (normalizedScope === 'school') row.schoolRank = rank;
            if (normalizedScope === 'class') row.classRank = rank;
        }
        return row;
    }

    function getRank(row, subject, scope, fallback = '-') {
        const key = normalizeText(subject) || 'total';
        const normalizedScope = normalizeText(scope);
        const value = row && row.ranks && row.ranks[key] ? row.ranks[key][normalizedScope] : undefined;
        return value == null || value === '' ? fallback : value;
    }

    function assignCompetitionRanks(list, scoreGetter, rankSetter, options = {}) {
        const rows = Array.isArray(list) ? list.slice() : [];
        const desc = options.desc !== false;
        const getter = typeof scoreGetter === 'function' ? scoreGetter : (item) => item;
        const setter = typeof rankSetter === 'function' ? rankSetter : function () {};

        rows.sort((a, b) => {
            const left = toFiniteNumber(getter(a));
            const right = toFiniteNumber(getter(b));
            return desc ? right - left : left - right;
        });

        let previousScore = null;
        let previousRank = 0;
        rows.forEach((item, index) => {
            const score = toFiniteNumber(getter(item));
            const tied = index > 0 && previousScore !== null && Math.abs(score - previousScore) < EPSILON;
            const rank = tied ? previousRank : index + 1;
            previousScore = score;
            previousRank = rank;
            setter(item, rank, index, rows);
        });

        return rows;
    }

    function assignRankScope(list, subject, scope, scoreGetter) {
        return assignCompetitionRanks(list, scoreGetter, (row, rank) => {
            setRank(row, subject, scope, rank);
        });
    }

    function groupBy(list, keyGetter) {
        const map = new Map();
        (Array.isArray(list) ? list : []).forEach((item) => {
            const key = normalizeText(typeof keyGetter === 'function' ? keyGetter(item) : item && item[keyGetter]);
            if (!key) return;
            if (!map.has(key)) map.set(key, []);
            map.get(key).push(item);
        });
        return map;
    }

    function assignGroupedRankScope(list, groupKeyGetter, subject, scope, scoreGetter) {
        const groups = groupBy(list, groupKeyGetter);
        groups.forEach((rows) => assignRankScope(rows, subject, scope, scoreGetter));
        return groups;
    }

    function buildScopeMetadata(rows, options = {}) {
        const list = Array.isArray(rows) ? rows : [];
        const schoolSet = new Set();
        const townSet = new Set();
        list.forEach((row) => {
            const school = normalizeText(row && row.school);
            const town = normalizeText(row && (row.town || row.township || row.townName));
            if (school) schoolSet.add(school);
            if (town) townSet.add(town);
        });
        const uploadedScopes = options.uploadedScopes && typeof options.uploadedScopes === 'object'
            ? options.uploadedScopes
            : {};
        return {
            rowCount: list.length,
            schoolCount: schoolSet.size,
            townCount: townSet.size,
            hasCountyDataset: uploadedScopes.county === true || schoolSet.size > 1 || options.forceCounty === true,
            hasTownDataset: uploadedScopes.town === true || uploadedScopes.township === true || townSet.size > 0 || options.forceTown === true,
            hasSchoolDataset: schoolSet.size > 0,
            hasClassDataset: list.some((row) => normalizeText(row && row.class))
        };
    }

    function canShowRank(scopeMetadata, scope) {
        const meta = scopeMetadata || {};
        const normalizedScope = normalizeText(scope);
        if (normalizedScope === 'county') return !!meta.hasCountyDataset;
        if (normalizedScope === 'township' || normalizedScope === 'town') return !!meta.hasTownDataset;
        if (normalizedScope === 'school') return !!meta.hasSchoolDataset;
        if (normalizedScope === 'class') return !!meta.hasClassDataset;
        return true;
    }

    function canShowRankComparison(records, scope) {
        const normalizedScope = normalizeText(scope);
        const list = Array.isArray(records) ? records : [];
        const usable = list.filter((record) => {
            const ranks = record && record.ranks && record.ranks.total ? record.ranks.total : {};
            const value = ranks[normalizedScope] ?? (record && record[`${normalizedScope}Rank`]);
            return value !== undefined && value !== null && value !== '';
        });
        const examIds = new Set(usable.map((record) => normalizeText(record && (record.examId || record.exam || record.key))).filter(Boolean));
        return usable.length > 1 && examIds.size > 1;
    }

    function makeStudentKey(student) {
        if (!student || typeof student !== 'object') return '';
        return [
            normalizeText(student.school),
            normalizeText(student.class),
            normalizeText(student.id || student.examNo || student.studentId),
            normalizeText(student.name)
        ].join('|');
    }

    return {
        EPSILON,
        normalizeText,
        toFiniteNumber,
        ensureSubjectRank,
        setRank,
        getRank,
        assignCompetitionRanks,
        assignRankScope,
        assignGroupedRankScope,
        buildScopeMetadata,
        canShowRank,
        canShowRankComparison,
        makeStudentKey
    };
});
