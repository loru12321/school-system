(() => {
    if (typeof window === 'undefined' || window.__COMPARE_SHARED_RUNTIME_PATCHED__) return;

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
    const groups = Array.isArray(window.DUPLICATE_COMPARE_EXAMS) ? window.DUPLICATE_COMPARE_EXAMS : [];
    if (!groups.length) return;
    const key = groups.map(group => group.map(item => item.label || item.id).join('|')).join('||');
    if (window.__DUPLICATE_COMPARE_WARNED_KEY === key) return;
    window.__DUPLICATE_COMPARE_WARNED_KEY = key;
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
    window.DUPLICATE_COMPARE_EXAMS = [];
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
    let rawRows = [];

    if (CURRENT_EXAM_ID && isExamKeyEquivalentForCompare(examId, CURRENT_EXAM_ID)) {
        rawRows = (RAW_DATA || []).map(s => ({
            name: s.name,
            school: s.school,
            class: normalizeClass(s.class),
            total: Number.isFinite(Number(s.total)) ? Number(s.total) : NaN,
            scores: s.scores || {}
        }));
    } else {
        const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
        const identity = getCompareExamIdentity({ id: examId });
        const exam = db?.exams?.[examId] || Object.values(db?.exams || {}).find(item => {
            const storedId = String(item?.examId || '').trim();
            if (!storedId || !isExamSelectableForCompare(storedId)) return false;
            if (isExamKeyEquivalentForCompare(storedId, examId)) return true;
            return getCompareExamIdentity({ id: storedId, label: item?.examLabel || '' }) === identity;
        });
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

    Object.assign(window, {
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
        listAvailableExamsForCompare,
        getSelectedReportCompareExamIds,
        getExamRowsForCompare,
        filterRowsBySchool,
        calcSchoolMetricsFromRows,
        getSummaryEntryBySchool,
        buildSchoolSummaryForExam
    });

    window.__COMPARE_SHARED_RUNTIME_PATCHED__ = true;
})();
