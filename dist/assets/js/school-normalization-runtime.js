(() => {
    if (typeof window === 'undefined' || window.__SCHOOL_NORMALIZATION_RUNTIME_PATCHED__) return;

const SCHOOL_ALIAS_GROUPS = [
    { canonical: '银山中学', aliases: ['银山镇中学'] },
    { canonical: '老湖中学', aliases: ['老湖'] },
    { canonical: '梯门中学', aliases: ['梯门'] },
    { canonical: '商老庄中学', aliases: ['商老庄实验学校'] },
    { canonical: '彭集中学', aliases: ['彭集街道中学'] },
    { canonical: '接山中学', aliases: ['接山镇中学'] },
    { canonical: '州城中学', aliases: ['州城街道', '州城街道中学'] },
    { canonical: '新湖中学', aliases: ['新湖镇中学'] },
    { canonical: '大羊中学', aliases: ['大羊'] },
    { canonical: '沙河站中学', aliases: ['沙河站镇中学'] },
    { canonical: '银山实验学校', aliases: ['银山镇实验学校', '银山实验中学', '银山镇实验中学'] },
    { canonical: '旧县中学', aliases: ['旧县乡中心学校', '旧县中心学校'] },
    { canonical: '斑鸠店中学', aliases: ['斑鸠店镇中学'] },
    { canonical: '戴庙中学', aliases: ['戴庙'] }
];

function sanitizeSchoolText(name) {
    return String(name || '')
        .replace(/\s+/g, '')
        .replace(/[()（）\-—_·、,，.。]/g, '')
        .trim();
}

const SCHOOL_ORG_SUFFIX_RULES = [
    [/(\u5b66\u6821|\u4e2d\u5b66)\u6559\u80b2\u96c6\u56e2$/u, '$1'],
    [/(\u5b66\u6821|\u4e2d\u5b66)\u96c6\u56e2$/u, '$1'],
    [/(\u5b66\u6821|\u4e2d\u5b66)(?:\u521d\u4e2d\u90e8|\u9ad8\u4e2d\u90e8|\u5c0f\u5b66\u90e8|\u672c\u90e8|\u6821\u672c\u90e8|\u5206\u6821|\u6821\u533a|\u603b\u6821)$/u, '$1'],
    [/\u4e5d\u5e74\u4e00\u8d2f\u5236\u5b66\u6821$/u, '\u5b66\u6821'],
    [/\u4e5d\u5e74\u4e00\u8d2f\u5236$/u, ''],
    [/\u5b8c\u5168\u4e2d\u5b66$/u, '\u4e2d\u5b66'],
    [/\u9644\u5c5e\u5b66\u6821$/u, '\u5b66\u6821'],
    [/\u9644\u5c5e\u4e2d\u5b66$/u, '\u4e2d\u5b66'],
    [/\u6559\u80b2\u8054\u76df$/u, ''],
    [/\u76f4\u5c5e\u6821\u533a$/u, ''],
    [/\u6821\u533a$/u, ''],
    [/\u5206\u6821$/u, ''],
    [/\u6559\u5b66\u70b9$/u, ''],
    [/\u672c\u90e8$/u, ''],
    [/\u6821\u672c\u90e8$/u, ''],
    [/\u603b\u6821$/u, '']
];

function stripSchoolAdministrativePrefix(name) {
    let text = sanitizeSchoolText(name);
    if (!text) return '';
    let prev = '';
    while (text && text !== prev) {
        prev = text;
        text = text.replace(
            /^[\u4e00-\u9fa5]{2,7}?(?:\u7701|\u5e02|\u53bf|\u533a)(?=[\u4e00-\u9fa5]*(?:\u5b9e\u9a8c\u4e2d\u5b66|\u5b9e\u9a8c\u5b66\u6821|\u4e2d\u5b66|\u5b66\u6821))/u,
            ''
        );
    }
    return text;
}

function stripSchoolOrganizationalSuffixes(name) {
    let text = stripSchoolAdministrativePrefix(name);
    if (!text) return '';
    let prev = '';
    while (text && text !== prev) {
        prev = text;
        SCHOOL_ORG_SUFFIX_RULES.forEach(([pattern, replacement]) => {
            text = text.replace(pattern, replacement);
        });
    }
    return text;
}

function computeSchoolBaseKey(name) {
    let text = stripSchoolOrganizationalSuffixes(name);
    if (!text) return '';
    text = text
        .replace(/镇实验学校$/u, '实验')
        .replace(/街道实验学校$/u, '实验')
        .replace(/乡实验学校$/u, '实验')
        .replace(/实验学校$/u, '实验')
        .replace(/实验中学$/u, '实验')
        .replace(/镇中学$/u, '')
        .replace(/街道中学$/u, '')
        .replace(/乡中心学校$/u, '')
        .replace(/中心学校$/u, '')
        .replace(/中学$/u, '')
        .replace(/学校$/u, '')
        .replace(/街道$/u, '')
        .replace(/乡$/u, '')
        .replace(/镇$/u, '');
    return text || stripSchoolOrganizationalSuffixes(name) || sanitizeSchoolText(name);
}

const SCHOOL_ALIAS_CANONICAL_MAP = (() => {
    const map = Object.create(null);
    SCHOOL_ALIAS_GROUPS.forEach(group => {
        [group.canonical, ...(group.aliases || [])].forEach(name => {
            const key = sanitizeSchoolText(name);
            if (key) map[key] = group.canonical;
        });
    });
    return map;
})();

const SCHOOL_BASEKEY_CANONICAL_MAP = (() => {
    const map = Object.create(null);
    SCHOOL_ALIAS_GROUPS.forEach(group => {
        const keys = new Set(
            [group.canonical, ...(group.aliases || [])]
                .map(name => computeSchoolBaseKey(name))
                .filter(Boolean)
        );
        if (keys.size === 1) {
            map[[...keys][0]] = group.canonical;
        }
    });
    return map;
})();

const SCHOOL_ALIAS_STORAGE_KEY = 'CUSTOM_SCHOOL_ALIAS_SETTINGS';

function ensureSchoolAliasStore() {
    window.SYS_VARS = window.SYS_VARS || { indicator: { ind1: '', ind2: '' }, targets: {} };
    if (!Array.isArray(window.SYS_VARS.schoolAliases)) {
        try {
            const raw = localStorage.getItem(SCHOOL_ALIAS_STORAGE_KEY);
            const saved = raw ? JSON.parse(raw) : [];
            window.SYS_VARS.schoolAliases = Array.isArray(saved) ? saved : [];
        } catch (e) {
            window.SYS_VARS.schoolAliases = [];
        }
    }
    return window.SYS_VARS.schoolAliases;
}

function persistSchoolAliasSettingsLocal() {
    const list = ensureSchoolAliasStore();
    localStorage.setItem(SCHOOL_ALIAS_STORAGE_KEY, JSON.stringify(list));
}

function replaceCustomSchoolAliasStore(list) {
    const next = Array.isArray(list)
        ? list
            .map(item => ({
                canonical: String(item?.canonical || '').trim(),
                alias: String(item?.alias || '').trim()
            }))
            .filter(item => item.canonical && item.alias)
        : [];
    window.SYS_VARS = window.SYS_VARS || { indicator: { ind1: '', ind2: '' }, targets: {}, schoolAliases: [] };
    window.SYS_VARS.schoolAliases = next;
    persistSchoolAliasSettingsLocal();
    return next;
}

function buildSchoolAliasGatewayRows() {
    return ensureSchoolAliasStore()
        .map(item => ({
            rule_type: 'school',
            standard_name: String(item?.canonical || '').trim(),
            alias_name: String(item?.alias || '').trim(),
            scope: 'global',
            project_key: '',
            cohort_id: '',
            is_active: true
        }))
        .filter(item => item.standard_name && item.alias_name);
}

function mapGatewaySchoolAliasRows(records) {
    return (Array.isArray(records) ? records : [])
        .filter(row => String(row?.rule_type || '') === 'school')
        .map(row => ({
            canonical: String(row?.standard_name || '').trim(),
            alias: String(row?.alias_name || '').trim()
        }))
        .filter(row => row.canonical && row.alias);
}

function getCustomSchoolAliasGroups() {
    const groups = new Map();
    ensureSchoolAliasStore().forEach(item => {
        const canonical = String(item?.canonical || '').trim();
        const alias = String(item?.alias || '').trim();
        if (!canonical || !alias) return;
        if (!groups.has(canonical)) groups.set(canonical, new Set());
        if (alias !== canonical) groups.get(canonical).add(alias);
    });
    return Array.from(groups.entries()).map(([canonical, aliases]) => ({
        canonical,
        aliases: Array.from(aliases)
    }));
}

function getMergedSchoolAliasCanonicalMap() {
    const map = Object.assign(Object.create(null), SCHOOL_ALIAS_CANONICAL_MAP);
    getCustomSchoolAliasGroups().forEach(group => {
        [group.canonical, ...(group.aliases || [])].forEach(name => {
            const key = sanitizeSchoolText(name);
            if (key) map[key] = group.canonical;
        });
    });
    return map;
}

function getMergedSchoolBasekeyCanonicalMap() {
    const map = Object.assign(Object.create(null), SCHOOL_BASEKEY_CANONICAL_MAP);
    getCustomSchoolAliasGroups().forEach(group => {
        const keys = new Set(
            [group.canonical, ...(group.aliases || [])]
                .map(name => computeSchoolBaseKey(name))
                .filter(Boolean)
        );
        if (keys.size === 1) {
            map[[...keys][0]] = group.canonical;
        }
    });
    return map;
}

function pickPreferredSchoolDisplayName(existing, candidate) {
    const a = String(existing || '').trim();
    const b = String(candidate || '').trim();
    if (!a) return b;
    if (!b) return a;
    const canonicalMap = getMergedSchoolAliasCanonicalMap();
    const score = (raw) => {
        const text = sanitizeSchoolText(raw);
        if (!text) return Number.NEGATIVE_INFINITY;
        let value = 0;
        const canonical = canonicalMap[text];
        if (canonical && text === sanitizeSchoolText(canonical)) value += 100;
        if (/实验学校|实验中学/u.test(text)) value += 25;
        else if (/中学|学校/u.test(text)) value += 15;
        if (/未知|Sheet/i.test(text)) value -= 100;
        value += Math.min(text.length, 20);
        return value;
    };
    return score(b) > score(a) ? b : a;
}

function normalizeSchoolFuzzyText(name) {
    return stripSchoolOrganizationalSuffixes(name);
}

function getSchoolFuzzyMatchScore(sourceName, candidateName) {
    const rawSource = String(sourceName || '').trim();
    const rawCandidate = String(candidateName || '').trim();
    if (!rawSource || !rawCandidate) return 0;

    const sourceText = normalizeSchoolFuzzyText(rawSource);
    const candidateText = normalizeSchoolFuzzyText(rawCandidate);
    if (!sourceText || !candidateText) return 0;

    const sourceIsExperiment = /实验/u.test(sourceText);
    const candidateIsExperiment = /实验/u.test(candidateText);
    if (sourceIsExperiment !== candidateIsExperiment) return 0;

    const shorter = sourceText.length <= candidateText.length ? sourceText : candidateText;
    const longer = shorter === sourceText ? candidateText : sourceText;
    if (shorter.length < 4 || !longer.includes(shorter)) return 0;

    let score = 400 + shorter.length;
    const sourceRawText = sanitizeSchoolText(rawSource);
    const candidateRawText = sanitizeSchoolText(rawCandidate);
    if (sourceRawText === sourceText || candidateRawText === candidateText) score += 20;
    if (longer.startsWith(shorter)) score += 10;
    if (longer.endsWith(shorter)) score += 5;
    return score;
}

function findBestFuzzySchoolNameMatch(collection, schoolName) {
    const raw = String(schoolName || '').trim();
    if (!raw) return '';
    const candidates = Array.isArray(collection) ? collection : Object.keys(collection || {});
    const names = Array.from(new Set(
        candidates
            .map(name => String(name || '').trim())
            .filter(Boolean)
    ));
    const scoredMatches = names
        .map((name) => ({
            name,
            score: getSchoolFuzzyMatchScore(raw, name)
        }))
        .filter(item => item.score > 0);
    if (!scoredMatches.length) return '';

    const bestScore = scoredMatches.reduce((max, item) => Math.max(max, item.score), 0);
    const bestMatches = scoredMatches
        .filter(item => item.score === bestScore)
        .map(item => item.name);
    if (bestMatches.length === 1) return bestMatches[0];

    const normalizedKeys = Array.from(new Set(
        bestMatches
            .map(name => normalizeSchoolName(name))
            .filter(Boolean)
    ));
    if (normalizedKeys.length !== 1) return '';
    return bestMatches.reduce((best, item) => pickPreferredSchoolDisplayName(best, item), '');
}

function normalizeSchoolName(name) {
    const text = sanitizeSchoolText(name);
    if (!text) return '';
    const directCanonical = getMergedSchoolAliasCanonicalMap()[text];
    if (directCanonical) return `canon:${directCanonical}`;
    const baseKey = computeSchoolBaseKey(text);
    if (!baseKey) return text;
    const mappedCanonical = getMergedSchoolBasekeyCanonicalMap()[baseKey];
    return mappedCanonical ? `canon:${mappedCanonical}` : baseKey;
}

function areSchoolNamesEquivalent(a, b) {
    const keyA = normalizeSchoolName(a);
    const keyB = normalizeSchoolName(b);
    return !!keyA && !!keyB && keyA === keyB;
}

function areSchoolNamesMatched(a, b, allowFuzzy = false) {
    if (areSchoolNamesEquivalent(a, b)) return true;
    if (!allowFuzzy) return false;
    const fuzzyA = normalizeSchoolFuzzyText(a);
    const fuzzyB = normalizeSchoolFuzzyText(b);
    if (!fuzzyA || !fuzzyB) return false;
    if (/实验/u.test(fuzzyA) !== /实验/u.test(fuzzyB)) return false;
    return fuzzyA === fuzzyB;
}

function getMatchedSchoolNamesFromCollection(collection, schoolName) {
    const candidates = Array.isArray(collection) ? collection : Object.keys(collection || {});
    const raw = String(schoolName || '').trim();
    if (!raw) return [];
    const names = Array.from(new Set(
        candidates
            .map(name => String(name || '').trim())
            .filter(Boolean)
    ));
    const exact = names.filter(name => name === raw);
    if (exact.length) return exact;

    const targetKey = normalizeSchoolName(raw);
    if (targetKey) {
        const strictMatches = names.filter(name => normalizeSchoolName(name) === targetKey);
        if (strictMatches.length) return strictMatches;
    }

    const fuzzyMatch = findBestFuzzySchoolNameMatch(names, raw);
    return fuzzyMatch ? [fuzzyMatch] : [];
}

function resolveSchoolNameFromCollection(collection, schoolName) {
    const matches = getMatchedSchoolNamesFromCollection(collection, schoolName);
    if (!matches.length) return '';
    return matches.reduce((best, item) => pickPreferredSchoolDisplayName(best, item), '');
}

function getCanonicalSchoolName(name, candidateNames = []) {
    const raw = String(name || '').trim();
    if (!raw) return '';
    const directCanonical = getMergedSchoolAliasCanonicalMap()[sanitizeSchoolText(raw)];
    if (directCanonical) return directCanonical;
    const resolved = resolveSchoolNameFromCollection(candidateNames, raw);
    if (resolved) return resolved;
    const key = normalizeSchoolName(raw);
    return typeof key === 'string' && key.startsWith('canon:') ? key.slice(6) : raw;
}

function normalizeTargetsMap(targets) {
    const source = (targets && typeof targets === 'object') ? targets : {};
    const normalized = {};
    const pickedMeta = {};
    const candidates = [...Object.keys(source), ...Object.keys(SCHOOLS || {})];
    const schoolSizes = {};
    Object.values(SCHOOLS || {}).forEach(school => {
        const canonicalSchool = getCanonicalSchoolName(school?.name, [...Object.keys(source), ...Object.keys(SCHOOLS || {}), school?.name]);
        if (!canonicalSchool) return;
        schoolSizes[canonicalSchool] = Math.max(
            schoolSizes[canonicalSchool] || 0,
            Array.isArray(school?.students) ? school.students.length : 0
        );
    });

    function scoreTargetCandidate(rawKey, canonicalSchool, value) {
        const t1 = parseInt(value?.t1, 10) || 0;
        const t2 = parseInt(value?.t2, 10) || 0;
        const total = t1 + t2;
        const schoolSize = schoolSizes[canonicalSchool] || 0;
        let score = 0;

        if (String(rawKey || '').trim() === canonicalSchool) score += 100;
        if (normalizeSchoolName(rawKey) === normalizeSchoolName(canonicalSchool)) score += 50;
        else if (getSchoolFuzzyMatchScore(rawKey, canonicalSchool) > 0) score += 35;
        if (t1 > 0 || t2 > 0) score += 80;
        else score -= 120;

        if (schoolSize > 0) {
            const overflow = Math.max(0, t1 - schoolSize) + Math.max(0, t2 - schoolSize);
            if (overflow === 0) score += 60;
            else score -= Math.min(80, overflow);
            score -= Math.max(0, total - schoolSize) * 0.01;
        } else {
            score -= total * 0.001;
        }

        return score;
    }

    Object.entries(source).forEach(([schoolName, value]) => {
        const canonicalSchool = getCanonicalSchoolName(schoolName, [...candidates, schoolName]);
        if (!canonicalSchool) return;
        const nextValue = {
            t1: parseInt(value?.t1, 10) || 0,
            t2: parseInt(value?.t2, 10) || 0
        };
        const nextScore = scoreTargetCandidate(schoolName, canonicalSchool, nextValue);
        if (!pickedMeta[canonicalSchool] || nextScore >= pickedMeta[canonicalSchool].score) {
            normalized[canonicalSchool] = nextValue;
            pickedMeta[canonicalSchool] = { score: nextScore, sourceKey: schoolName };
        }
    });
    return normalized;
}

function ensureNormalizedTargets() {
    const normalized = normalizeTargetsMap(window.TARGETS || {});
    if (JSON.stringify(window.TARGETS || {}) !== JSON.stringify(normalized)) {
        window.TARGETS = normalized;
    }
    TARGETS = window.TARGETS || {};
    if (window.SYS_VARS) window.SYS_VARS.targets = window.TARGETS;
    return window.TARGETS;
}

function getTargetConfigBySchool(schoolName) {
    ensureNormalizedTargets();
    const key = resolveSchoolNameFromCollection(window.TARGETS || {}, schoolName)
        || getCanonicalSchoolName(schoolName, Object.keys(window.TARGETS || {}));
    return {
        key,
        value: key ? (window.TARGETS[key] || null) : null
    };
}

function getEquivalentSchoolStudents(schoolName) {
    const rows = filterRowsBySchool(RAW_DATA || [], schoolName);
    if (rows.length) return rows.slice();
    const matchedNames = new Set(
        getMatchedSchoolNamesFromCollection(
            Object.values(SCHOOLS || {}).map(item => item?.name),
            schoolName
        )
    );
    return Object.values(SCHOOLS || {})
        .filter(item => matchedNames.has(String(item?.name || '').trim()))
        .flatMap(item => Array.isArray(item?.students) ? item.students : []);
}

function buildIndicatorSchoolBuckets() {
    ensureNormalizedTargets();
    const buckets = new Map();
    Object.values(SCHOOLS || {}).forEach((school) => {
        const rawName = String(school?.name || '').trim();
        const canonicalName = resolveSchoolNameFromCollection(window.TARGETS || {}, rawName)
            || getCanonicalSchoolName(rawName, [
                ...Object.keys(window.TARGETS || {}),
                rawName
            ])
            || rawName;
        if (!canonicalName) return;
        if (!buckets.has(canonicalName)) {
            buckets.set(canonicalName, {
                name: canonicalName,
                rawNames: [],
                students: []
            });
        }
        const bucket = buckets.get(canonicalName);
        if (rawName && !bucket.rawNames.includes(rawName)) bucket.rawNames.push(rawName);
        if (Array.isArray(school?.students) && school.students.length) {
            bucket.students.push(...school.students);
        }
    });
    return Array.from(buckets.values());
}

function syncIndicatorScoreToSchools(schoolName, score) {
    const matchedNames = new Set(
        getMatchedSchoolNamesFromCollection(
            Object.values(SCHOOLS || {}).map(item => item?.name),
            schoolName
        )
    );
    Object.values(SCHOOLS || {}).forEach((school) => {
        if (matchedNames.has(String(school?.name || '').trim())) {
            school.scoreInd = score;
        }
    });
}

function listAvailableSchoolsForCompare() {
    const names = new Map();
    const collectName = (rawName) => {
        const school = String(rawName || '').trim();
        if (!school) return;
        const key = normalizeSchoolName(school) || school;
        const existing = names.get(key);
        names.set(key, existing ? pickPreferredSchoolDisplayName(existing, school) : school);
    };

    Object.keys(SCHOOLS || {}).forEach(collectName);

    (RAW_DATA || []).forEach((row) => {
        collectName(row?.school);
    });

    Object.values(window.TEACHER_SCHOOL_MAP || {}).forEach(collectName);

    const persistedSchool = String(localStorage.getItem('MY_SCHOOL') || '').trim();
    const runtimeSchool = String(MY_SCHOOL || '').trim();
    if (persistedSchool) collectName(persistedSchool);
    if (runtimeSchool) collectName(runtimeSchool);

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    if (db?.exams) {
        Object.values(db.exams).forEach((exam) => {
            (exam?.data || []).forEach((row) => {
                collectName(row?.school);
            });
        });
    }

    const blockList = ['教育局', '教体局', '市局', '区局', '市直局', '区直局', 'admin', '测试', '默认'];
    return [...names.values()]
        .filter((name) => {
            if (!name || /^Sheet\d+$/i.test(name)) return false;
            return !blockList.some((blocked) => name.includes(blocked) || name.toLowerCase() === blocked);
        })
        .sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function getClassSchoolMapForAllData() {
    const map = {};

    Object.entries(window.TEACHER_SCHOOL_MAP || {}).forEach(([key, school]) => {
        const cls = normalizeClass(String(key || '').split('_')[0]);
        const normalizedSchool = String(school || '').trim();
        if (cls && normalizedSchool) map[cls] = normalizedSchool;
    });

    Object.entries(SCHOOLS || {}).forEach(([school, payload]) => {
        (payload?.students || []).forEach((stu) => {
            const cls = normalizeClass(stu?.class);
            if (cls && school && !map[cls]) map[cls] = school;
        });
    });

    (RAW_DATA || []).forEach((row) => {
        const school = String(row?.school || '').trim();
        const cls = normalizeClass(row?.class);
        if (cls && school && !map[cls]) map[cls] = school;
    });

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    if (db?.exams) {
        Object.values(db.exams).forEach((exam) => {
            (exam?.data || []).forEach((row) => {
                const school = String(row?.school || '').trim();
                const cls = normalizeClass(row?.class);
                if (cls && school && !map[cls]) map[cls] = school;
            });
        });
    }

    return map;
}

function inferDefaultSchoolFromContext() {
    const saved = String(MY_SCHOOL || localStorage.getItem('MY_SCHOOL') || '').trim();
    if (saved) return saved;
    const list = listAvailableSchoolsForCompare();
    return list.length === 1 ? list[0] : '';
}

// Compare school summary runtime moved to public/assets/js/compare-shared-runtime.js

// Town submodule compare runtime moved to public/assets/js/town-submodule-compare-runtime.js

    Object.assign(window, {
        SCHOOL_ALIAS_GROUPS,
        sanitizeSchoolText,
        stripSchoolAdministrativePrefix,
        stripSchoolOrganizationalSuffixes,
        computeSchoolBaseKey,
        ensureSchoolAliasStore,
        persistSchoolAliasSettingsLocal,
        replaceCustomSchoolAliasStore,
        buildSchoolAliasGatewayRows,
        mapGatewaySchoolAliasRows,
        getCustomSchoolAliasGroups,
        getMergedSchoolAliasCanonicalMap,
        getMergedSchoolBasekeyCanonicalMap,
        pickPreferredSchoolDisplayName,
        normalizeSchoolFuzzyText,
        getSchoolFuzzyMatchScore,
        findBestFuzzySchoolNameMatch,
        normalizeSchoolName,
        areSchoolNamesEquivalent,
        areSchoolNamesMatched,
        getMatchedSchoolNamesFromCollection,
        resolveSchoolNameFromCollection,
        getCanonicalSchoolName,
        normalizeTargetsMap,
        ensureNormalizedTargets,
        getTargetConfigBySchool,
        getEquivalentSchoolStudents,
        buildIndicatorSchoolBuckets,
        syncIndicatorScoreToSchools,
        listAvailableSchoolsForCompare,
        getClassSchoolMapForAllData,
        inferDefaultSchoolFromContext
    });

    window.__SCHOOL_NORMALIZATION_RUNTIME_PATCHED__ = true;
})();
