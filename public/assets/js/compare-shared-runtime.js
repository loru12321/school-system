(() => {
    if (typeof window === 'undefined' || window.__COMPARE_SHARED_RUNTIME_PATCHED__) return;

const CompareSessionStateRuntime = window.CompareSessionState || null;
const readDuplicateCompareExamsState = typeof window.readDuplicateCompareExamsState === 'function'
    ? window.readDuplicateCompareExamsState
    : (() => {
        if (CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getDuplicateCompareExams === 'function') {
            return CompareSessionStateRuntime.getDuplicateCompareExams() || [];
        }
        return Array.isArray(window.DUPLICATE_COMPARE_EXAMS) ? window.DUPLICATE_COMPARE_EXAMS : [];
    });
const setDuplicateCompareExamsState = typeof window.setDuplicateCompareExamsState === 'function'
    ? window.setDuplicateCompareExamsState
    : ((groups) => {
        const nextGroups = Array.isArray(groups) ? groups : [];
        if (CompareSessionStateRuntime && typeof CompareSessionStateRuntime.setDuplicateCompareExams === 'function') {
            return CompareSessionStateRuntime.setDuplicateCompareExams(nextGroups) || [];
        }
        window.DUPLICATE_COMPARE_EXAMS = nextGroups;
        return nextGroups;
    });
const readDuplicateCompareWarnedKeyState = typeof window.readDuplicateCompareWarnedKeyState === 'function'
    ? window.readDuplicateCompareWarnedKeyState
    : (() => {
        if (CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getDuplicateCompareWarnedKey === 'function') {
            return String(CompareSessionStateRuntime.getDuplicateCompareWarnedKey() || '').trim();
        }
        return String(window.__DUPLICATE_COMPARE_WARNED_KEY || '').trim();
    });
const setDuplicateCompareWarnedKeyState = typeof window.setDuplicateCompareWarnedKeyState === 'function'
    ? window.setDuplicateCompareWarnedKeyState
    : ((key) => {
        const nextKey = String(key || '').trim();
        if (CompareSessionStateRuntime && typeof CompareSessionStateRuntime.setDuplicateCompareWarnedKey === 'function') {
            return String(CompareSessionStateRuntime.setDuplicateCompareWarnedKey(nextKey) || '').trim();
        }
        window.__DUPLICATE_COMPARE_WARNED_KEY = nextKey;
        return nextKey;
    });

function isExamKeyEquivalentForCompare(a, b) {
    const normalize = (key) => String(key || '').trim().replace(/\s+/g, '_').toLowerCase();
    const ka = normalize(a);
    const kb = normalize(b);
    if (!ka || !kb) return false;
    if (ka === kb) return true;

    const isLikelyFullKey = (key) => /^(\d{4})\D*_/.test(key);
    const extractShortVariants = (fullKey) => {
        const parts = String(fullKey || '').split('_').filter(Boolean);
        const variants = new Set();
        if (parts.length >= 5) variants.add(parts.slice(4).join('_'));
        if (parts.length >= 4) variants.add(parts.slice(3).join('_'));
        return variants;
    };

    const aFull = isLikelyFullKey(ka);
    const bFull = isLikelyFullKey(kb);

    if (aFull && bFull) {
        if (ka === kb) return true;
        const sa = extractShortVariants(ka);
        const sb = extractShortVariants(kb);
        for (const value of sa) {
            if (sb.has(value)) return true;
        }
        return false;
    }

    if (aFull && !bFull) return extractShortVariants(ka).has(kb);
    if (!aFull && bFull) return extractShortVariants(kb).has(ka);
    return ka === kb;
}

function getEffectiveCurrentExamId() {
    try {
        if (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') {
            const db = CohortDB.ensure();
            const exams = Object.values(db?.exams || {}).map(ex => ({
                id: String(ex?.examId || '').trim(),
                ts: Number(ex?.createdAt || ex?.updatedAt || 0)
            })).filter(item => item.id);
            if (exams.length > 0) {
                exams.sort((a, b) => {
                    const ta = getExamSortTimestamp(a.id, a.ts);
                    const tb = getExamSortTimestamp(b.id, b.ts);
                    if (ta !== tb) return tb - ta;
                    return String(b.id || '').localeCompare(String(a.id || ''), 'zh-CN');
                });
                if (exams[0].id) return exams[0].id;
            }
        }
    } catch (e) {}

    const candidates = [
        CURRENT_EXAM_ID,
        window.CURRENT_EXAM_ID,
        localStorage.getItem('CURRENT_EXAM_ID'),
        (typeof COHORT_DB !== 'undefined' && COHORT_DB) ? COHORT_DB.currentExamId : '',
        (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? (CohortDB.ensure()?.currentExamId || '') : ''
    ];
    for (const candidate of candidates) {
        const key = String(candidate || '').trim();
        if (key) return key;
    }
    return '';
}

function normalizeCompareCohortId(raw) {
    const text = String(raw || '').trim();
    if (!text) return '';
    const inferred = typeof inferCohortIdFromValue === 'function' ? inferCohortIdFromValue(text) : '';
    if (inferred) return inferred;
    const digits = text.replace(/\D/g, '');
    return digits.length > 4 ? digits.slice(0, 4) : digits;
}

function isLegacyWorkspaceShadowExamId(key) {
    const text = String(key || '').trim();
    if (!text) return false;
    if (/^cohort::/i.test(text)) return false;
    if (/^(TEACHERS_|STUDENT_COMPARE_|MACRO_COMPARE_|TEACHER_COMPARE_|TOWN_SUB_COMPARE_)/.test(text)) return false;
    return /^\d{4}级_[^_]+年级_\d{4}-\d{4}_[^_]+_[^_]+(?:_[^_]+)?$/i.test(text);
}

const COMPARE_EXAM_TYPE_KEYWORDS = [
    '开学考', '摸底', '月考', '期中', '期末', '联考', '调研', '模考', '模拟',
    '一模', '二模', '三模', '周测', '单元', '阶段测试'
];

function normalizeCompareExamToken(value) {
    return String(value || '')
        .trim()
        .replace(/[—–－-]/g, '_')
        .replace(/[()（）【】\[\]{}]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/^_+|_+$/g, '')
        .toLowerCase();
}

function isGenericCompareExamSuffixToken(token, meta = {}) {
    const raw = String(token || '').trim();
    const normalized = normalizeCompareExamToken(raw);
    if (!normalized) return true;
    if (/^\d{1,2}$/.test(raw)) return true;
    if (/^\d{4}$/.test(raw)) return true;
    if (/^\d{4}(?:[-_/]\d{1,2}(?:[-_/]\d{1,2})?)?$/.test(raw)) return true;
    if (/^\d+年级$/.test(raw)) return true;
    if (/^(?:标准考试|考试|测试)$/i.test(raw)) return true;
    const metaTokens = [
        meta.cohort,
        meta.grade,
        meta.year,
        meta.term,
        meta.type
    ].map(normalizeCompareExamToken).filter(Boolean);
    return metaTokens.includes(normalized);
}

function getCompareExamIdentity(entryOrId, fallbackLabel = '') {
    const entry = (entryOrId && typeof entryOrId === 'object')
        ? entryOrId
        : { id: entryOrId, label: fallbackLabel };
    const idText = String(entry?.id || '').trim();
    const labelText = String(entry?.label || fallbackLabel || '').trim();
    const sourceText = `${idText} ${labelText}`.trim();
    if (!sourceText) return '';

    const cohort = normalizeCompareCohortId(sourceText);
    const gradeMatch = sourceText.match(/\d+年级/);
    const yearMatch = sourceText.match(/\d{4}-\d{4}/);
    const termMatch = sourceText.match(/上学期|下学期|第一学期|第二学期/);
    const type = COMPARE_EXAM_TYPE_KEYWORDS.find(keyword => sourceText.includes(keyword)) || '';

    const normalized = String(idText || labelText || sourceText)
        .replace(/[—–－-]/g, '_')
        .replace(/[()（）【】\[\]{}]/g, '_')
        .replace(/\s+/g, '_');
    const parts = normalized.split('_').filter(Boolean);
    const meta = {
        cohort: cohort ? `${cohort}级` : '',
        grade: gradeMatch?.[0] || '',
        year: yearMatch?.[0] || '',
        term: termMatch?.[0] || '',
        type
    };

    let afterType = !type;
    const suffixParts = [];
    parts.forEach(part => {
        const rawPart = String(part || '').trim();
        if (!rawPart) return;
        if (!afterType) {
            if (rawPart.includes(type)) afterType = true;
            return;
        }
        if (isGenericCompareExamSuffixToken(rawPart, meta)) return;
        suffixParts.push(rawPart);
    });

    const identity = [
        cohort,
        gradeMatch?.[0] || '',
        yearMatch?.[0] || '',
        termMatch?.[0] || '',
        type,
        suffixParts[0] || ''
    ].filter(Boolean).join('|');

    return identity || normalizeCompareExamToken(sourceText);
}

function parseExamSemanticTimestamp(examId) {
    const key = String(examId || '').trim();
    if (!key) return 0;
    const parts = key.split('_');
    if (parts.length < 5) return 0;
    const yearPart = String(parts[2] || '');
    const termPart = String(parts[3] || '');
    const typePart = String(parts[4] || '');
    const yearMatch = yearPart.match(/(\d{4})/);
    if (!yearMatch) return 0;
    const startYear = parseInt(yearMatch[1], 10);
    if (!Number.isFinite(startYear)) return 0;

    let y = startYear;
    let m = 9;
    if (termPart.includes('上')) {
        if (typePart.includes('期中')) { y = startYear; m = 11; }
        else if (typePart.includes('期末')) { y = startYear + 1; m = 1; }
        else { y = startYear; m = 10; }
    } else if (termPart.includes('下')) {
        if (typePart.includes('期中')) { y = startYear + 1; m = 4; }
        else if (typePart.includes('期末')) { y = startYear + 1; m = 6; }
        else { y = startYear + 1; m = 3; }
    } else {
        if (typePart.includes('期中')) { y = startYear; m = 11; }
        else if (typePart.includes('期末')) { y = startYear + 1; m = 1; }
    }
    return new Date(y, m - 1, 1).getTime();
}

function getExamSortTimestamp(examId, fallbackTs = 0) {
    const semantic = parseExamSemanticTimestamp(examId);
    if (semantic > 0) return semantic;
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const snap = db?.exams?.[examId];
    const metaDate = snap?.meta?.date ? new Date(snap.meta.date).getTime() : 0;
    const snapTs = Number(snap?.createdAt || 0);
    const fbTs = Number(fallbackTs || 0);
    return metaDate || snapTs || fbTs || 0;
}

function sortExamIdsChronologically(examIds) {
    const ids = Array.isArray(examIds) ? examIds.filter(Boolean) : [];
    return ids.slice().sort((a, b) => {
        const ta = getExamSortTimestamp(a);
        const tb = getExamSortTimestamp(b);
        if (ta !== tb) return ta - tb;
        return String(a).localeCompare(String(b), 'zh-CN');
    });
}

function ensureCompareSharedComputationCache() {
    const cache = window.__COMPARE_SHARED_COMPUTATION_CACHE__ && typeof window.__COMPARE_SHARED_COMPUTATION_CACHE__ === 'object'
        ? window.__COMPARE_SHARED_COMPUTATION_CACHE__
        : {};
    if (!cache.examRows || typeof cache.examRows !== 'object') cache.examRows = {};
    if (!cache.schoolOverviews || typeof cache.schoolOverviews !== 'object') cache.schoolOverviews = {};
    if (!cache.rawCurrent || typeof cache.rawCurrent !== 'object') {
        cache.rawCurrent = { ref: null, length: 0, fingerprint: '' };
    }
    window.__COMPARE_SHARED_COMPUTATION_CACHE__ = cache;
    return cache;
}

function clearCompareSharedComputationCache() {
    window.__COMPARE_SHARED_COMPUTATION_CACHE__ = {
        examRows: {},
        schoolOverviews: {},
        rawCurrent: { ref: null, length: 0, fingerprint: '' }
    };
    return window.__COMPARE_SHARED_COMPUTATION_CACHE__;
}

function tagCompareCacheKey(target, cacheKey) {
    if (!target || typeof target !== 'object' || !cacheKey) return target;
    try {
        Object.defineProperty(target, '__compareCacheKey', {
            value: cacheKey,
            configurable: true,
            enumerable: false,
            writable: true
        });
    } catch (e) {
        target.__compareCacheKey = cacheKey;
    }
    return target;
}

function getLiveRawDataFingerprint() {
    const cache = ensureCompareSharedComputationCache();
    const rows = Array.isArray(RAW_DATA) ? RAW_DATA : [];
    if (cache.rawCurrent.ref === rows && cache.rawCurrent.length === rows.length && cache.rawCurrent.fingerprint) {
        return cache.rawCurrent.fingerprint;
    }
    const fingerprint = computeExamDataFingerprint(rows);
    cache.rawCurrent = {
        ref: rows,
        length: rows.length,
        fingerprint
    };
    return fingerprint;
}


function assignCompetitionRanks(list, scoreGetter, rankSetter) {
    const rows = Array.isArray(list) ? list.slice() : [];
    rows.sort((a, b) => Number(scoreGetter(b) ?? Number.NEGATIVE_INFINITY) - Number(scoreGetter(a) ?? Number.NEGATIVE_INFINITY));

    let prevScore = null;
    let prevRank = 0;
    rows.forEach((item, index) => {
        const score = Number(scoreGetter(item) ?? Number.NEGATIVE_INFINITY);
        const rank = index > 0 && prevScore !== null && Math.abs(score - prevScore) < 0.0001 ? prevRank : index + 1;
        prevScore = score;
        prevRank = rank;
        rankSetter(item, rank, index, rows);
    });

    return rows;
}

function buildCompetitionRankMap(list, keyGetter, scoreGetter) {
    const rankMap = new Map();
    assignCompetitionRanks(list, scoreGetter, (item, rank) => {
        const key = keyGetter(item);
        if (key && !rankMap.has(key)) rankMap.set(key, rank);
    });
    return rankMap;
}

function computeExamDataFingerprint(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const normalized = list.map(row => ({
        school: String(row?.school || '').trim(),
        class: String(row?.class || '').trim(),
        name: String(row?.name || '').trim(),
        total: Number(row?.total || 0),
        scores: Object.fromEntries(
            Object.entries(row?.scores || {})
                .map(([subject, score]) => [String(subject), Number(score)])
                .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'zh-CN'))
        )
    })).sort((a, b) => {
        const schoolDiff = a.school.localeCompare(b.school, 'zh-CN');
        if (schoolDiff !== 0) return schoolDiff;
        const classDiff = a.class.localeCompare(b.class, 'zh-CN', { numeric: true });
        if (classDiff !== 0) return classDiff;
        return a.name.localeCompare(b.name, 'zh-CN');
    });

    const json = JSON.stringify(normalized);
    let hash = 2166136261;
    for (let i = 0; i < json.length; i++) {
        hash ^= json.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return `fp_${(hash >>> 0).toString(16)}`;
}

function pickPreferredExamEntry(existing, candidate) {
    const score = (entry) => {
        const id = String(entry?.id || '');
        let weight = 0;
        if (/^cohort::/i.test(id)) weight -= 1000;
        if (!/^cohort::/i.test(id)) weight += 100;
        if (entry?.source === 'local') weight += 10;
        if (entry?.source === 'current') weight += 8;
        if (entry?.source === 'cloud') weight += 5;
        if (/\d{4}-\d{2}-\d{2}/.test(id)) weight += 3;
        weight += Number(entry?.sortTs || entry?.createdAt || 0) / 1e13;
        return weight;
    };
    return score(candidate) >= score(existing) ? candidate : existing;
}

function warnIfDuplicateCompareSnapshots() {
    const groups = readDuplicateCompareExamsState();
    if (!groups.length) return;
    const key = groups.map(group => group.map(item => item.label || item.id).join('|')).join('||');
    if (readDuplicateCompareWarnedKeyState() === key) return;
    setDuplicateCompareWarnedKeyState(key);
    if (window.UI) UI.toast('检测到重复考试快照，系统已自动去重；如期数异常请重新封存对应考试。', 'warning');
}

function extractCohortIdFromExamKey(examKey) {
    const key = String(examKey || '').trim();
    if (!key) return '';
    const inferred = typeof inferCohortIdFromValue === 'function' ? inferCohortIdFromValue(key) : '';
    if (inferred) return inferred;
    const digits = key.replace(/\D/g, '');
    return digits.length > 4 ? digits.slice(0, 4) : digits;
}

function isRealExamIdForCompare(examId, cohortId) {
    const key = String(examId || '').trim();
    if (!key) return false;
    if (/^cohort::/i.test(key)) return false;
    if (isLegacyWorkspaceShadowExamId(key)) return false;
    if (/^(TEACHERS_|STUDENT_COMPARE_|MACRO_COMPARE_|TEACHER_COMPARE_|TOWN_SUB_COMPARE_)/.test(key)) return false;
    if (/(?:^|_)(?:\u671f\u4e2d\u6807\u51c6|\u671f\u672b\u6807\u51c6)(?:_|$)/.test(key)) return false;

    const normalizedCohort = normalizeCompareCohortId(cohortId);
    if (!normalizedCohort) return true;
    return extractCohortIdFromExamKey(key) === normalizedCohort;
}

function isExamSelectableForCompare(examId) {
    const cohortId = normalizeCompareCohortId(CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID'));
    return isRealExamIdForCompare(examId, cohortId);
}

function listAvailableExamsForCompare() {
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const examMap = new Map();
    const cohortId = normalizeCompareCohortId(CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID'));
    const upsertExam = (entry) => {
        if (!entry?.id || !isRealExamIdForCompare(entry.id, cohortId)) return;
        const identity = getCompareExamIdentity(entry);
        const normalizedEntry = {
            ...entry,
            sortTs: getExamSortTimestamp(entry.id, entry.createdAt || 0)
        };
        const existingKey = Array.from(examMap.keys()).find(key => {
            if (isExamKeyEquivalentForCompare(key, entry.id)) return true;
            const existing = examMap.get(key);
            return getCompareExamIdentity(existing) === identity;
        });
        if (!existingKey) {
            examMap.set(entry.id, normalizedEntry);
            return;
        }
        const existing = examMap.get(existingKey) || {};
        const preferred = pickPreferredExamEntry(existing, normalizedEntry);
        examMap.set(existingKey, {
            ...existing,
            ...normalizedEntry,
            id: preferred.id || existing.id || normalizedEntry.id,
            createdAt: Math.max(existing.createdAt || 0, normalizedEntry.createdAt || 0),
            sortTs: Math.max(existing.sortTs || 0, normalizedEntry.sortTs || 0),
            label: preferred.label || existing.label || normalizedEntry.label || preferred.id,
            source: preferred.source || existing.source || normalizedEntry.source || 'local',
            fingerprint: preferred.fingerprint || existing.fingerprint || normalizedEntry.fingerprint || ''
        });
    };
    if (db?.exams) {
        Object.values(db.exams).forEach(ex => {
            if (!ex?.examId) return;
            upsertExam({
                id: ex.examId,
                createdAt: ex.createdAt || 0,
                label: ex.examLabel || ex.examId,
                source: 'local',
                fingerprint: ex.fingerprint || computeExamDataFingerprint(ex.data || [])
            });
        });
    }
    if (CURRENT_EXAM_ID) {
        upsertExam({
            id: CURRENT_EXAM_ID,
            createdAt: Date.now(),
            label: `${CURRENT_EXAM_ID.split('_').pop()} (当前)`,
            source: 'current',
            fingerprint: computeExamDataFingerprint(RAW_DATA || [])
        });
    }
    if (window.PREV_DATA && Array.isArray(window.PREV_DATA)) {
        window.PREV_DATA.forEach(h => {
            const hid = h.examFullKey || h.examId;
            if (!hid) return;
            upsertExam({
                id: hid,
                createdAt: h.updatedAt ? new Date(h.updatedAt).getTime() : 0,
                label: h.examLabel || hid,
                source: 'cloud',
                fingerprint: h.fingerprint || ''
            });
        });
    }
    const finalExamList = Array.from(examMap.values());
    setDuplicateCompareExamsState([]);
    warnIfDuplicateCompareSnapshots();
    finalExamList.sort((a, b) => {
        const ta = Number(a.sortTs || a.createdAt || 0);
        const tb = Number(b.sortTs || b.createdAt || 0);
        if (ta !== tb) return ta - tb;
        return String(a.id || '').localeCompare(String(b.id || ''), 'zh-CN');
    });
    return finalExamList;
}

function getSelectedReportCompareExamIds() {
    const countEl = document.getElementById('reportComparePeriodCount');
    const exam1Sel = document.getElementById('reportCompareExam1');
    const exam2Sel = document.getElementById('reportCompareExam2');
    const exam3Sel = document.getElementById('reportCompareExam3');
    const periodCount = Number(countEl?.value || 2);
    const ids = [exam1Sel?.value || '', exam2Sel?.value || ''];
    if (periodCount === 3) ids.push(exam3Sel?.value || '');
    return sortExamIdsChronologically(ids.filter(Boolean));
}

function getExamRowsForCompare(examId) {
    if (!examId) return [];
    if (!isExamSelectableForCompare(examId)) return [];

    const normalizedExamId = String(examId || '').trim();
    let rawRows = [];
    let sourceFingerprint = '';

    if (CURRENT_EXAM_ID && isExamKeyEquivalentForCompare(normalizedExamId, CURRENT_EXAM_ID)) {
        sourceFingerprint = getLiveRawDataFingerprint();
        const cacheKey = `current:${sourceFingerprint}`;
        const cachedRows = ensureCompareSharedComputationCache().examRows[cacheKey];
        if (Array.isArray(cachedRows)) return cachedRows;
        rawRows = (RAW_DATA || []).map(s => ({
            name: s.name,
            school: s.school,
            class: normalizeClass(s.class),
            total: Number.isFinite(Number(s.total)) ? Number(s.total) : NaN,
            scores: s.scores || {}
        }));
    } else {
        const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
        const identity = getCompareExamIdentity({ id: normalizedExamId });
        const exam = db?.exams?.[normalizedExamId] || Object.values(db?.exams || {}).find(item => {
            const storedId = String(item?.examId || '').trim();
            if (!storedId || !isExamSelectableForCompare(storedId)) return false;
            if (isExamKeyEquivalentForCompare(storedId, normalizedExamId)) return true;
            return getCompareExamIdentity({ id: storedId, label: item?.examLabel || '' }) === identity;
        });
        if (!exam) return [];
        sourceFingerprint = String(exam?.fingerprint || '').trim() || computeExamDataFingerprint(exam?.data || []);
        const cacheKey = `exam:${normalizedExamId}:${sourceFingerprint}`;
        const cachedRows = ensureCompareSharedComputationCache().examRows[cacheKey];
        if (Array.isArray(cachedRows)) return cachedRows;
        const list = exam?.data || [];
        const examSubjects = Array.isArray(exam?.subjects) && exam.subjects.length
            ? exam.subjects
            : (Array.isArray(SUBJECTS) ? SUBJECTS : []);
        rawRows = list.map(s => {
            const scores = s.scores || {};
            let total = s.total;
            if (!Number.isFinite(Number(total))) {
                const baseSubs = examSubjects.length ? examSubjects : Object.keys(scores || {});
                const vals = baseSubs.map(sub => parseFloat(scores[sub])).filter(v => !isNaN(v));
                total = vals.length ? vals.reduce((a, b) => a + b, 0) : NaN;
            } else {
                total = Number(total);
            }
            return {
                name: s.name,
                school: s.school,
                class: normalizeClass(s.class),
                total,
                scores
            };
        });
    }

    const rows = rawRows.filter(r => r.name && r.school && typeof r.total === 'number' && !isNaN(r.total));
    const bySchool = {};
    rows.forEach(r => {
        if (!bySchool[r.school]) bySchool[r.school] = [];
        bySchool[r.school].push(r);
    });
    Object.values(bySchool).forEach(arr => {
        arr.sort((a, b) => b.total - a.total);
        arr.forEach((r, i) => {
            if (i > 0 && Math.abs(r.total - arr[i - 1].total) < 0.001) r.rankSchool = arr[i - 1].rankSchool;
            else r.rankSchool = i + 1;
        });
    });

    const cacheKey = (CURRENT_EXAM_ID && isExamKeyEquivalentForCompare(normalizedExamId, CURRENT_EXAM_ID))
        ? `current:${sourceFingerprint || getLiveRawDataFingerprint()}`
        : `exam:${normalizedExamId}:${sourceFingerprint}`;
    tagCompareCacheKey(rows, cacheKey);
    ensureCompareSharedComputationCache().examRows[cacheKey] = rows;
    return rows;
}

function filterRowsBySchool(rows, school) {
    const matchedNames = new Set(
        getMatchedSchoolNamesFromCollection(
            (rows || []).map(r => r?.school),
            school
        )
    );
    if (!matchedNames.size) return [];
    return (rows || []).filter(r => matchedNames.has(String(r?.school || '').trim()));
}

function calcSchoolMetricsFromRows(rows) {
    const list = (rows || []).filter(r => Number.isFinite(Number(r.total)));
    const count = list.length;
    if (!count) return null;

    const subjectCountFromRows = list.reduce((maxCnt, r) => {
        const cnt = Object.keys(r.scores || {}).length;
        return Math.max(maxCnt, cnt);
    }, 0);
    const subCount = (SUBJECTS && SUBJECTS.length) ? SUBJECTS.length : (subjectCountFromRows || 1);
    const totalExc = subCount * 90;
    const totalPass = subCount * 72;

    const totals = list.map(x => Number(x.total));
    const avg = totals.reduce((a, b) => a + b, 0) / count;
    const excRate = totals.filter(v => v >= totalExc).length / count;
    const passRate = totals.filter(v => v >= totalPass).length / count;
    return { count, avg, excRate, passRate };
}

function calcSubjectMetricsFromRows(rows, subject) {
    const list = (rows || [])
        .map(r => Number(r?.scores?.[subject]))
        .filter(v => Number.isFinite(v));
    const count = list.length;
    if (!count) return null;

    const avg = list.reduce((a, b) => a + b, 0) / count;
    const sorted = list.slice().sort((a, b) => b - a);
    const configured = THRESHOLDS?.[subject] || {};
    let exc = Number(configured.exc);
    let pass = Number(configured.pass);

    if (!Number.isFinite(exc)) {
        const excRate = Number(CONFIG?.excRate);
        const excIndex = Math.max(0, Math.floor(sorted.length * (Number.isFinite(excRate) ? excRate : 0.2)) - 1);
        exc = sorted[excIndex] || 0;
    }
    if (!Number.isFinite(pass)) {
        const passIndex = Math.max(0, Math.floor(sorted.length * 0.5) - 1);
        pass = sorted[passIndex] || 0;
    }

    return {
        count,
        avg,
        exc,
        pass,
        excRate: list.filter(v => v >= exc).length / count,
        passRate: list.filter(v => v >= pass).length / count
    };
}

function buildSchoolRankOverviewForRows(rows, subjectList = SUBJECTS) {
    const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
    const normalizedSubjects = Array.isArray(subjectList)
        ? subjectList.map(subject => String(subject || '').trim()).filter(Boolean)
        : [];
    const subjectSignature = normalizedSubjects.join('|');
    const cacheKey = rows && typeof rows === 'object' && rows.__compareCacheKey
        ? `${rows.__compareCacheKey}|overview|${subjectSignature}`
        : '';
    if (cacheKey) {
        const cached = ensureCompareSharedComputationCache().schoolOverviews[cacheKey];
        if (cached) return cached;
    }

    const grouped = {};
    list.forEach((row) => {
        const school = String(row?.school || '').trim();
        if (!school) return;
        if (!grouped[school]) grouped[school] = [];
        grouped[school].push(row);
    });

    const schools = Object.entries(grouped).map(([school, schoolRows]) => {
        const total = calcSchoolMetricsFromRows(schoolRows);
        const subjects = {};
        normalizedSubjects.forEach((subject) => {
            const metrics = calcSubjectMetricsFromRows(schoolRows, subject);
            if (metrics) subjects[subject] = metrics;
        });
        return {
            school,
            total,
            subjects,
            avgSubjectRank: null,
            subjectLeaderCount: 0,
            leaderSubjects: [],
            advantageSubjects: [],
            weakSubjects: [],
            subjectRankSummary: ''
        };
    }).filter(entry => entry.total);

    assignCompetitionRanks(
        schools.filter(entry => entry.total),
        entry => entry.total.avg,
        (entry, rank) => { entry.total.rankAvg = rank; }
    );
    assignCompetitionRanks(
        schools.filter(entry => entry.total),
        entry => entry.total.excRate,
        (entry, rank) => { entry.total.rankExc = rank; }
    );
    assignCompetitionRanks(
        schools.filter(entry => entry.total),
        entry => entry.total.passRate,
        (entry, rank) => { entry.total.rankPass = rank; }
    );

    normalizedSubjects.forEach((subject) => {
        const ranked = schools.filter(entry => entry.subjects[subject]);
        assignCompetitionRanks(
            ranked,
            entry => entry.subjects[subject].avg,
            (entry, rank) => { entry.subjects[subject].rankAvg = rank; }
        );
        assignCompetitionRanks(
            ranked,
            entry => entry.subjects[subject].excRate,
            (entry, rank) => { entry.subjects[subject].rankExc = rank; }
        );
        assignCompetitionRanks(
            ranked,
            entry => entry.subjects[subject].passRate,
            (entry, rank) => { entry.subjects[subject].rankPass = rank; }
        );
    });

    schools.forEach((entry) => {
        const rankedSubjects = normalizedSubjects
            .map(subject => ({ subject, metrics: entry.subjects[subject] || null }))
            .filter(item => item.metrics && Number.isFinite(Number(item.metrics.rankAvg)));
        const totalRank = Number(entry.total?.rankAvg || NaN);
        const subjectRanks = rankedSubjects.map(item => Number(item.metrics.rankAvg)).filter(Number.isFinite);
        entry.avgSubjectRank = subjectRanks.length
            ? subjectRanks.reduce((sum, rank) => sum + rank, 0) / subjectRanks.length
            : null;
        entry.subjectLeaderCount = rankedSubjects.filter(item => item.metrics.rankAvg === 1).length;
        entry.leaderSubjects = rankedSubjects.filter(item => item.metrics.rankAvg === 1).map(item => item.subject);

        const bestSubjects = rankedSubjects
            .slice()
            .sort((left, right) => (left.metrics.rankAvg - right.metrics.rankAvg) || (right.metrics.avg - left.metrics.avg));
        const weakSubjects = rankedSubjects
            .slice()
            .sort((left, right) => (right.metrics.rankAvg - left.metrics.rankAvg) || (left.metrics.avg - right.metrics.avg));

        entry.advantageSubjects = rankedSubjects
            .filter(item => Number.isFinite(totalRank) && item.metrics.rankAvg < totalRank)
            .sort((left, right) => (left.metrics.rankAvg - right.metrics.rankAvg) || (right.metrics.avg - left.metrics.avg))
            .slice(0, 3)
            .map(item => item.subject);
        if (!entry.advantageSubjects.length) {
            entry.advantageSubjects = bestSubjects.slice(0, 2).map(item => item.subject);
        }

        entry.weakSubjects = rankedSubjects
            .filter(item => Number.isFinite(totalRank) && item.metrics.rankAvg > totalRank)
            .sort((left, right) => (right.metrics.rankAvg - left.metrics.rankAvg) || (left.metrics.avg - right.metrics.avg))
            .slice(0, 3)
            .map(item => item.subject);
        if (!entry.weakSubjects.length) {
            entry.weakSubjects = weakSubjects.slice(0, 2).map(item => item.subject);
        }

        entry.subjectRankSummary = rankedSubjects
            .map(item => `${item.subject}#${item.metrics.rankAvg}`)
            .join(' / ');
    });

    schools.sort((left, right) => {
        const totalRankDiff = Number(left.total?.rankAvg || Number.POSITIVE_INFINITY) - Number(right.total?.rankAvg || Number.POSITIVE_INFINITY);
        if (totalRankDiff !== 0) return totalRankDiff;
        const subjectRankDiff = Number(left.avgSubjectRank || Number.POSITIVE_INFINITY) - Number(right.avgSubjectRank || Number.POSITIVE_INFINITY);
        if (subjectRankDiff !== 0) return subjectRankDiff;
        return String(left.school || '').localeCompare(String(right.school || ''), 'zh-CN');
    });

    const bySchool = {};
    schools.forEach((entry) => {
        bySchool[entry.school] = entry;
    });

    const overview = {
        subjectList: normalizedSubjects,
        schools,
        bySchool
    };

    if (cacheKey) {
        ensureCompareSharedComputationCache().schoolOverviews[cacheKey] = overview;
    }
    return overview;
}

function getSummaryEntryBySchool(summary, school) {
    if (!summary) return null;
    if (summary[school]) return summary[school];
    const matchedKeys = getMatchedSchoolNamesFromCollection(Object.keys(summary), school);
    if (!matchedKeys.length) return null;
    const bestKey = matchedKeys.reduce((best, item) => pickPreferredSchoolDisplayName(best, item), '');
    return bestKey ? summary[bestKey] : null;
}

function buildSchoolSummaryForExam(rows) {
    const summary = {};
    const grouped = {};
    (rows || []).forEach(r => {
        const school = String(r.school || '').trim();
        if (!school) return;
        if (!grouped[school]) grouped[school] = [];
        grouped[school].push(r);
    });

    Object.entries(grouped).forEach(([school, schoolRows]) => {
        const m = calcSchoolMetricsFromRows(schoolRows);
        if (m) summary[school] = m;
    });

    const rank = Object.entries(summary).sort((a, b) => b[1].avg - a[1].avg);
    rank.forEach(([school], idx) => summary[school].rankAvg = idx + 1);
    return summary;
}

function getSchoolRankOverviewEntryBySchool(overview, school) {
    if (!overview || !school) return null;
    if (overview.bySchool?.[school]) return overview.bySchool[school];
    const matchedKeys = getMatchedSchoolNamesFromCollection(Object.keys(overview.bySchool || {}), school);
    if (!matchedKeys.length) return null;
    const bestKey = matchedKeys.reduce((best, item) => pickPreferredSchoolDisplayName(best, item), '');
    return bestKey ? (overview.bySchool?.[bestKey] || null) : null;
}

    Object.assign(window, {
        isExamKeyEquivalentForCompare,
        getEffectiveCurrentExamId,
        normalizeCompareCohortId,
        isLegacyWorkspaceShadowExamId,
        normalizeCompareExamToken,
        isGenericCompareExamSuffixToken,
        getCompareExamIdentity,
        parseExamSemanticTimestamp,
        getExamSortTimestamp,
        sortExamIdsChronologically,
        assignCompetitionRanks,
        buildCompetitionRankMap,
        computeExamDataFingerprint,
        pickPreferredExamEntry,
        warnIfDuplicateCompareSnapshots,
        extractCohortIdFromExamKey,
        isRealExamIdForCompare,
        isExamSelectableForCompare,
        ensureCompareSharedComputationCache,
        clearCompareSharedComputationCache,
        getLiveRawDataFingerprint,
        listAvailableExamsForCompare,
        getSelectedReportCompareExamIds,
        getExamRowsForCompare,
        filterRowsBySchool,
        calcSchoolMetricsFromRows,
        calcSubjectMetricsFromRows,
        buildSchoolRankOverviewForRows,
        getSummaryEntryBySchool,
        buildSchoolSummaryForExam,
        getSchoolRankOverviewEntryBySchool
    });

    window.__COMPARE_SHARED_RUNTIME_PATCHED__ = true;
})();
