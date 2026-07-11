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
    const rankValueCache = new WeakMap();
    const schoolScopeContextByRows = new WeakMap();
    const countyScopeCache = new Map();

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
        if (row && typeof row === 'object') rankValueCache.delete(row);
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

    function normalizeRankValue(value, fallback = '-') {
        return value == null || value === '' ? fallback : value;
    }

    function hasRankValue(value) {
        const normalized = normalizeRankValue(value, '-');
        return normalized !== '-' && normalized !== '—';
    }

    function hasStudentClassRankScope(studentLike) {
        const rawClass = normalizeText(studentLike && studentLike.class);
        const normalizedClass = normalizeClassValue(rawClass);
        if (!normalizedClass || normalizedClass === '-') return false;
        return !/^(?:无|未分班|无班级|暂无|undefined|null|nan)$/i.test(normalizedClass);
    }

    function getCandidateSchoolNames(rows) {
        if (root && root.SCHOOLS && typeof root.SCHOOLS === 'object') {
            const names = Object.keys(root.SCHOOLS).map(normalizeText).filter(Boolean);
            if (names.length) return names;
        }
        return Array.from(new Set((Array.isArray(rows) ? rows : (root.RAW_DATA || []))
            .map((row) => normalizeText(row && row.school))
            .filter(Boolean)));
    }

    function getSchoolScopeContext(rows) {
        const list = Array.isArray(rows) ? rows : (Array.isArray(root.RAW_DATA) ? root.RAW_DATA : []);
        const version = Number(root.__RAW_DATA_VERSION || 0);
        const schoolsRef = root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : null;
        const cached = schoolScopeContextByRows.get(list);
        if (cached
            && cached.version === version
            && cached.length === list.length
            && cached.schoolsRef === schoolsRef) {
            return cached;
        }
        const candidateNames = getCandidateSchoolNames(list);
        const context = {
            version,
            length: list.length,
            schoolsRef,
            candidateNames,
            baseKey: candidateNames.slice().sort().join('||')
        };
        schoolScopeContextByRows.set(list, context);
        return context;
    }

    const countyDirectCache = new Map();

    function isCountyDirectStudent(studentLike, options = {}) {
        const schoolName = normalizeText(studentLike && studentLike.school);
        if (!schoolName) return false;
        if (typeof options.isCountyDirect === 'function') return !!options.isCountyDirect(studentLike);
        if (!root || typeof root.getCountyDirectSchoolNames !== 'function' || typeof root.getTownshipManagedSchoolNames !== 'function') {
            return false;
        }

        const scopeContext = getSchoolScopeContext(options.rows);
        const candidateNames = scopeContext.candidateNames;
        const baseKey = scopeContext.baseKey;
        if (!countyDirectCache.has(baseKey)) {
            const townshipNames = root.getTownshipManagedSchoolNames(candidateNames);
            const directNames = townshipNames && townshipNames.length
                ? root.getCountyDirectSchoolNames(candidateNames)
                : [];
            countyDirectCache.set(baseKey, {
                townshipNames,
                directNames,
                resultBySchool: new Map()
            });
        }

        const cache = countyDirectCache.get(baseKey);
        if (!cache || !cache.townshipNames || !cache.townshipNames.length) return false;
        if (cache.resultBySchool.has(schoolName)) return cache.resultBySchool.get(schoolName);
        const direct = (cache.directNames || []).some((name) => {
            const candidate = normalizeText(name);
            return candidate === schoolName
                || (typeof root.areSchoolNamesEquivalent === 'function' && root.areSchoolNamesEquivalent(candidate, schoolName))
                || (typeof root.areSchoolNamesMatched === 'function' && root.areSchoolNamesMatched(candidate, schoolName, true));
        });
        cache.resultBySchool.set(schoolName, direct);
        return direct;
    }

    function hasCountyScope(rows, options = {}) {
        if (options.forceCounty === true) return true;
        const uploadedScopes = options.uploadedScopes && typeof options.uploadedScopes === 'object'
            ? options.uploadedScopes
            : {};
        if (uploadedScopes.county === true) return true;
        if (!root || typeof root.getCountyDirectSchoolNames !== 'function' || typeof root.getTownshipManagedSchoolNames !== 'function') {
            return false;
        }
        const scopeContext = getSchoolScopeContext(rows);
        const candidateNames = scopeContext.candidateNames;
        if (!candidateNames.length) return false;
        if (countyScopeCache.has(scopeContext.baseKey)) return countyScopeCache.get(scopeContext.baseKey);
        const townshipNames = root.getTownshipManagedSchoolNames(candidateNames);
        const hasScope = !!(townshipNames
            && townshipNames.length
            && root.getCountyDirectSchoolNames(candidateNames).length > 0);
        countyScopeCache.set(scopeContext.baseKey, hasScope);
        return hasScope;
    }

    function getStudentRankValue(studentLike, subject = 'total', scope = 'school', options = {}) {
        if (!studentLike || typeof studentLike !== 'object') return '-';
        const normalizedScope = normalizeText(scope);
        const key = normalizeText(subject) || 'total';
        const cacheContext = Array.isArray(options.rows)
            ? `${options.rows.length}:${normalizeText(options.rows[0]?.school)}:${normalizeText(options.rows[options.rows.length - 1]?.school)}`
            : '';
        const cacheKey = `${key}|${normalizedScope}|${cacheContext}`;
        let cache = rankValueCache.get(studentLike);
        if (cache && cache.has(cacheKey)) return cache.get(cacheKey);

        let result = '-';
        if (normalizedScope === 'class' && !hasStudentClassRankScope(studentLike)) return '-';
        if ((normalizedScope === 'township' || normalizedScope === 'town') && isCountyDirectStudent(studentLike, options)) return '-';
        if (normalizedScope === 'county' && !hasCountyScope(options.rows, options)) return '-';
        const fallback = key === 'total' && normalizedScope === 'county'
            ? normalizeRankValue(studentLike && studentLike.countyRank, '-')
            : '-';
        result = normalizeRankValue(getRank(studentLike, key, normalizedScope === 'town' ? 'township' : normalizedScope, fallback), fallback);
        if (!cache) {
            cache = new Map();
            rankValueCache.set(studentLike, cache);
        }
        cache.set(cacheKey, result);
        return result;
    }

    function hasStudentRankData(rows = [], subjects = [], scope = 'school', options = {}) {
        const list = Array.isArray(rows) ? rows : [];
        const subjectList = Array.isArray(subjects) && subjects.length ? subjects : ['total'];
        const normalizedScope = normalizeText(scope);
        if (normalizedScope === 'county' && !hasCountyScope(options.rows || list, options)) return false;
        return list.some((student) => {
            if (hasRankValue(getStudentRankValue(student, 'total', scope, options))) return true;
            return subjectList.some((subject) => hasRankValue(getStudentRankValue(student, subject, scope, options)));
        });
    }

    function getStudentRankVisibility(rows = [], subjects = [], options = {}) {
        const list = Array.isArray(rows) ? rows : [];
        const subjectList = Array.isArray(subjects) ? subjects : [];
        const singleSchool = typeof options.isSingleSchoolMode === 'function'
            ? !!options.isSingleSchoolMode()
            : !!options.isSingleSchool;
        return {
            countyRankVisible: hasStudentRankData(list, subjectList, 'county', options),
            townRankVisible: !singleSchool && hasStudentRankData(list, subjectList, 'township', options),
            classRankVisible: hasStudentRankData(list, ['total'], 'class', options)
        };
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

    function buildStudentRankIndex(rows = [], subjects = [], options = {}) {
        const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
        const subjectList = Array.from(new Set((Array.isArray(subjects) ? subjects : [])
            .map(normalizeText)
            .filter(Boolean)));
        const normalizedSchoolCache = new Map();
        const normalizeSchool = (value) => {
            const raw = normalizeText(value);
            if (!raw) return '';
            if (normalizedSchoolCache.has(raw)) return normalizedSchoolCache.get(raw);
            let normalized = raw;
            if (typeof options.normalizeSchool === 'function') normalized = normalizeText(options.normalizeSchool(raw)) || raw;
            if (root && typeof root.getCanonicalSchoolName === 'function') {
                normalized = normalizeText(root.getCanonicalSchoolName(raw)) || normalized;
            }
            normalizedSchoolCache.set(raw, normalized);
            return normalized;
        };
        const schoolOf = (row) => normalizeSchool(row && row.school);
        const classOf = (row) => normalizeClassValue(row && row.class);
        const schoolClassOf = (row) => `${schoolOf(row)}::${classOf(row)}`;
        const studentKeyCache = new WeakMap();
        const keyOf = (row) => {
            if (!row || typeof row !== 'object') return '';
            if (studentKeyCache.has(row)) return studentKeyCache.get(row);
            const key = makeStudentKey(row);
            studentKeyCache.set(row, key);
            return key;
        };
        const schools = new Set(list.map(schoolOf).filter(Boolean));
        const townSchoolThreshold = Number(options.townSchoolThreshold) || 14;
        const countySchoolThreshold = Number(options.countySchoolThreshold) || 24;
        const townRankVisible = schools.size >= townSchoolThreshold;
        const countyRankVisible = schools.size >= countySchoolThreshold;
        const rowsBySchool = groupBy(list, schoolOf);
        const rowsByClass = groupBy(list, schoolClassOf);
        const rankMaps = {
            class: new Map(),
            school: new Map(),
            township: new Map(),
            county: new Map()
        };

        let townshipRows = [];
        if (townRankVisible) {
            if (typeof options.getTownshipRows === 'function') {
                townshipRows = options.getTownshipRows(list) || [];
            } else if (root && typeof root.filterRowsToTownshipSchools === 'function') {
                townshipRows = root.filterRowsToTownshipSchools(list) || [];
            }
            if (!Array.isArray(townshipRows) || !townshipRows.length) townshipRows = list;
        }

        const readScore = (row, subject) => {
            if (typeof options.getScore === 'function') {
                const customValue = Number(options.getScore(row, subject));
                if (Number.isFinite(customValue)) return customValue;
            }
            if (subject === 'total') return Number(row && row.total);
            if (!row || !row.scores || row.scores[subject] === undefined) return Number.NaN;
            return Number(row.scores[subject]);
        };
        const buildMap = (sourceRows, subject) => {
            const rankedRows = (Array.isArray(sourceRows) ? sourceRows : [])
                .filter((row) => Number.isFinite(readScore(row, subject)));
            const map = new Map();
            assignCompetitionRanks(rankedRows, (row) => readScore(row, subject), (row, rank) => {
                const key = keyOf(row);
                if (key) map.set(key, rank);
            });
            return map;
        };
        const getScopeMap = (scope, subject, student) => {
            const normalizedScope = scope === 'town' ? 'township' : scope;
            const normalizedSubject = normalizeText(subject) || 'total';
            if (normalizedScope === 'class') {
                const cacheKey = `${schoolClassOf(student)}::${normalizedSubject}`;
                if (!rankMaps.class.has(cacheKey)) {
                    rankMaps.class.set(cacheKey, buildMap(rowsByClass.get(schoolClassOf(student)) || [], normalizedSubject));
                }
                return rankMaps.class.get(cacheKey);
            }
            if (normalizedScope === 'school') {
                const school = schoolOf(student);
                const cacheKey = `${school}::${normalizedSubject}`;
                if (!rankMaps.school.has(cacheKey)) {
                    rankMaps.school.set(cacheKey, buildMap(rowsBySchool.get(school) || [], normalizedSubject));
                }
                return rankMaps.school.get(cacheKey);
            }
            if (normalizedScope === 'township') {
                if (!townRankVisible) return null;
                if (!rankMaps.township.has(normalizedSubject)) {
                    rankMaps.township.set(normalizedSubject, buildMap(townshipRows, normalizedSubject));
                }
                return rankMaps.township.get(normalizedSubject);
            }
            if (normalizedScope === 'county') {
                if (!countyRankVisible) return null;
                if (!rankMaps.county.has(normalizedSubject)) {
                    rankMaps.county.set(normalizedSubject, buildMap(list, normalizedSubject));
                }
                return rankMaps.county.get(normalizedSubject);
            }
            return null;
        };

        return {
            rowCount: list.length,
            schoolCount: schools.size,
            subjects: subjectList,
            townRankVisible,
            countyRankVisible,
            getRank(student, subject = 'total', scope = 'school', fallback = '-') {
                if (!student || typeof student !== 'object') return fallback;
                const map = getScopeMap(scope, subject, student);
                if (!map) return fallback;
                const rank = map.get(keyOf(student));
                return rank == null || rank === '' ? fallback : rank;
            }
        };
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
            hasCountyDataset: hasCountyScope(list, options),
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

    const studentIndexCache = new WeakMap();

    function normalizeClassValue(value) {
        if (root && typeof root.normalizeClass === 'function') {
            return root.normalizeClass(value);
        }
        return normalizeText(value).replace(/[班级\(\)\.\-gradeclass]/gi, '');
    }

    function normalizeName(value) {
        return normalizeText(value).replace(/\s+/g, '');
    }

    function getStudentNameKeys(row) {
        const keys = new Set();
        const name = normalizeName(row && row.name);
        const id = normalizeText(row && (row.id || row.examNo || row.studentId));
        if (name) keys.add(name);
        if (id) keys.add(id);
        return Array.from(keys);
    }

    function sameSchoolForLookup(left, right) {
        const leftName = normalizeText(left);
        const rightName = normalizeText(right);
        if (!leftName || !rightName) return false;
        if (leftName === rightName) return true;
        if (root.PermissionPolicy && typeof root.PermissionPolicy.sameSchoolName === 'function') {
            return root.PermissionPolicy.sameSchoolName(leftName, rightName);
        }
        if (typeof root.areSchoolNamesEquivalent === 'function' && root.areSchoolNamesEquivalent(leftName, rightName)) {
            return true;
        }
        return typeof root.areSchoolNamesMatched === 'function' && root.areSchoolNamesMatched(leftName, rightName, true);
    }

    function getEquivalentSchoolLookupKeys(index, school) {
        const schoolKey = normalizeText(school);
        if (!schoolKey) return [];
        const keys = new Set([schoolKey]);
        const candidates = Array.from(index?.schoolNames || []);

        if (typeof root.getMatchedSchoolNamesFromCollection === 'function') {
            try {
                root.getMatchedSchoolNamesFromCollection(candidates, schoolKey)
                    .map(normalizeText)
                    .filter(Boolean)
                    .forEach((name) => keys.add(name));
            } catch (error) {}
        }

        const normalizedSchool = typeof root.normalizeSchoolName === 'function'
            ? root.normalizeSchoolName(schoolKey)
            : '';
        candidates.forEach((candidate) => {
            if (!candidate) return;
            if (sameSchoolForLookup(candidate, schoolKey)) {
                keys.add(candidate);
                return;
            }
            if (normalizedSchool && typeof root.normalizeSchoolName === 'function'
                && root.normalizeSchoolName(candidate) === normalizedSchool) {
                keys.add(candidate);
            }
        });

        return Array.from(keys);
    }

    function appendUniqueRows(target, seen, rows) {
        (Array.isArray(rows) ? rows : []).forEach((row) => {
            if (!row || seen.has(row)) return;
            seen.add(row);
            target.push(row);
        });
    }

    function pushToMap(map, key, row) {
        const normalizedKey = normalizeText(key);
        if (!normalizedKey) return;
        if (!map.has(normalizedKey)) map.set(normalizedKey, []);
        const bucket = map.get(normalizedKey);
        if (!bucket.includes(row)) bucket.push(row);
    }

    function getStudentIndex(rows) {
        const list = Array.isArray(rows) ? rows : [];
        const cached = studentIndexCache.get(list);
        if (cached && cached.length === list.length) return cached;

        const bySchool = new Map();
        const bySchoolClass = new Map();
        const byName = new Map();
        const byExact = new Map();
        const classesBySchool = new Map();
        const schoolNames = new Set();

        list.forEach((row) => {
            if (!row || typeof row !== 'object') return;
            const school = normalizeText(row.school);
            const cls = normalizeClassValue(row.class);
            const rawClass = normalizeText(row.class);
            const exactKey = [
                school,
                cls,
                normalizeText(row.id || row.examNo || row.studentId),
                normalizeName(row.name)
            ].join('|');

            pushToMap(bySchool, school, row);
            pushToMap(bySchoolClass, `${school}||${cls}`, row);
            pushToMap(bySchoolClass, `${school}||${rawClass}`, row);
            getStudentNameKeys(row).forEach((key) => pushToMap(byName, key, row));
            if (exactKey.replace(/\|/g, '')) byExact.set(exactKey, row);
            if (school) schoolNames.add(school);
            if (school && rawClass) {
                if (!classesBySchool.has(school)) classesBySchool.set(school, new Set());
                classesBySchool.get(school).add(rawClass);
            }
        });

        const index = {
            length: list.length,
            rows: list,
            bySchool,
            bySchoolClass,
            byName,
            byExact,
            classesBySchool,
            schoolNames
        };
        studentIndexCache.set(list, index);
        return index;
    }

    function getRowsBySchoolClass(rows, school, className) {
        const index = getStudentIndex(rows);
        const schoolKey = normalizeText(school);
        const classKey = normalizeClassValue(className);
        const rawClassKey = normalizeText(className);
        if (schoolKey && (classKey || rawClassKey)) {
            const matchedRows = [];
            const seen = new Set();
            getEquivalentSchoolLookupKeys(index, schoolKey).forEach((key) => {
                appendUniqueRows(matchedRows, seen, index.bySchoolClass.get(`${key}||${classKey}`));
                appendUniqueRows(matchedRows, seen, index.bySchoolClass.get(`${key}||${rawClassKey}`));
            });
            return matchedRows;
        }
        if (schoolKey) {
            const matchedRows = [];
            const seen = new Set();
            getEquivalentSchoolLookupKeys(index, schoolKey).forEach((key) => {
                appendUniqueRows(matchedRows, seen, index.bySchool.get(key));
            });
            return matchedRows;
        }
        return index.rows.slice();
    }

    function getClassesForSchool(rows, school) {
        const index = getStudentIndex(rows);
        const classes = new Set();
        getEquivalentSchoolLookupKeys(index, school).forEach((key) => {
            (index.classesBySchool.get(key) || new Set()).forEach((cls) => classes.add(cls));
        });
        return Array.from(classes).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));
    }

    function findStudent(rows, query = {}) {
        const index = getStudentIndex(rows);
        const nameKey = normalizeName(query.name);
        const schoolKey = normalizeText(query.school);
        const schoolKeys = new Set(getEquivalentSchoolLookupKeys(index, schoolKey));
        const classKey = normalizeClassValue(query.className || query.class);
        const rawClassKey = normalizeText(query.className || query.class);
        if (!nameKey) return null;

        const candidates = (index.byName.get(nameKey) || []).filter((row) => {
            const rowSchool = normalizeText(row && row.school);
            const rowClass = normalizeClassValue(row && row.class);
            const rowRawClass = normalizeText(row && row.class);
            if (schoolKey && !schoolKeys.has(rowSchool)) return false;
            if (classKey || rawClassKey) {
                return rowClass === classKey || rowRawClass === rawClassKey;
            }
            return true;
        });
        return candidates[0] || null;
    }

    return {
        EPSILON,
        normalizeText,
        toFiniteNumber,
        ensureSubjectRank,
        setRank,
        getRank,
        normalizeRankValue,
        hasRankValue,
        hasStudentClassRankScope,
        isCountyDirectStudent,
        hasCountyScope,
        getStudentRankValue,
        hasStudentRankData,
        getStudentRankVisibility,
        assignCompetitionRanks,
        assignRankScope,
        assignGroupedRankScope,
        buildStudentRankIndex,
        buildScopeMetadata,
        canShowRank,
        canShowRankComparison,
        makeStudentKey,
        getStudentIndex,
        getEquivalentSchoolLookupKeys,
        getRowsBySchoolClass,
        getClassesForSchool,
        findStudent
    };
});
