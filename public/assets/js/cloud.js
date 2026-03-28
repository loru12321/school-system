(function () {
    const CLOUD_TABLE = 'system_data';
    const KEY_PREFIX_TEACHERS = 'TEACHERS_';
    const KEY_PREFIX_COMPARE = [
        'STUDENT_COMPARE_',
        'MACRO_COMPARE_',
        'TEACHER_COMPARE_',
        'TOWN_SUB_COMPARE_'
    ];
    const AUTO_COHORT_SYNC_COOLDOWN_MS = 10 * 60 * 1000;
    const WorkspaceState = window.WorkspaceState || null;
    const ExamState = window.ExamState || null;
    const TeacherState = window.TeacherState || null;

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function safeToast(msg, type) {
        if (window.UI && typeof UI.toast === 'function') UI.toast(msg, type);
    }

    function safeLoading(show, text) {
        if (window.UI && typeof UI.loading === 'function') UI.loading(show, text);
    }

    function setCloudStatus(state, detail = '') {
        if (typeof window.setCloudSyncStatus === 'function') {
            window.setCloudSyncStatus(state, detail);
        }
    }

    function normalizeCohortId(raw) {
        const text = String(raw || '').trim();
        if (!text) return '';
        let match = text.match(/^cohort::(\d{4})/i);
        if (match) return match[1];
        match = text.match(/^(\d{4})(?!\d)/);
        if (match) return match[1];
        match = text.match(/(\d{4})级/);
        if (match) return match[1];
        match = text.match(/(\d{4})/);
        if (match) return match[1];
        const digits = text.replace(/\D/g, '');
        return digits.length > 4 ? digits.slice(0, 4) : digits;
    }

    function extractCohortIdFromKey(key) {
        return normalizeCohortId(key);
    }

    function getCurrentProjectKey() {
        if (WorkspaceState && typeof WorkspaceState.getCurrentProjectKey === 'function') {
            return String(WorkspaceState.getCurrentProjectKey() || '').trim();
        }
        return String(localStorage.getItem('CURRENT_PROJECT_KEY') || window.CURRENT_PROJECT_KEY || '').trim();
    }

    function getCurrentCohortId() {
        if (WorkspaceState && typeof WorkspaceState.getCurrentCohortId === 'function') {
            return normalizeCohortId(WorkspaceState.getCurrentCohortId());
        }
        return normalizeCohortId(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID'));
    }

    function getCurrentTermId() {
        if (ExamState && typeof ExamState.getCurrentTermId === 'function') {
            return String(ExamState.getCurrentTermId() || '').trim();
        }
        return String(window.CURRENT_TERM_ID || localStorage.getItem('CURRENT_TERM_ID') || '').trim();
    }

    function getCurrentTeacherTermId() {
        if (ExamState && typeof ExamState.getCurrentTeacherTermId === 'function') {
            return String(ExamState.getCurrentTeacherTermId() || '').trim();
        }
        return String(window.CURRENT_TEACHER_TERM_ID || localStorage.getItem('CURRENT_TEACHER_TERM_ID') || '').trim();
    }

    function getTeacherTermBase(termId) {
        if (ExamState && typeof ExamState.getTeacherTermBase === 'function') {
            return String(ExamState.getTeacherTermBase(termId) || '').trim();
        }
        const text = String(termId || '').trim();
        if (!text) return '';
        const parts = text.split('_').filter(Boolean);
        if (parts.length >= 2 && /^\d{4}-\d{4}$/.test(parts[0])) {
            return parts.slice(0, 2).join('_');
        }
        return text;
    }

    function syncTeacherTermState(termId) {
        const exactTermId = String(termId || '').trim();
        if (ExamState && typeof ExamState.syncTeacherTerm === 'function') {
            return ExamState.syncTeacherTerm(exactTermId);
        }
        if (!exactTermId) {
            localStorage.removeItem('CURRENT_TEACHER_TERM_ID');
            localStorage.removeItem('CURRENT_TERM_ID');
            window.CURRENT_TEACHER_TERM_ID = '';
            window.CURRENT_TERM_ID = '';
            return { exactTermId: '', baseTermId: '' };
        }
        localStorage.setItem('CURRENT_TEACHER_TERM_ID', exactTermId);
        window.CURRENT_TEACHER_TERM_ID = exactTermId;
        const baseTermId = getTeacherTermBase(exactTermId);
        if (baseTermId) {
            localStorage.setItem('CURRENT_TERM_ID', baseTermId);
            window.CURRENT_TERM_ID = baseTermId;
        }
        return { exactTermId, baseTermId };
    }

    function getTeacherMap() {
        if (typeof window.readTeacherMap === 'function') {
            return window.readTeacherMap() || {};
        }
        if (TeacherState && typeof TeacherState.getTeacherMap === 'function') {
            return TeacherState.getTeacherMap() || {};
        }
        return window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object' ? window.TEACHER_MAP : {};
    }

    function getTeacherSchoolMap() {
        if (typeof window.readTeacherSchoolMap === 'function') {
            return window.readTeacherSchoolMap() || {};
        }
        if (TeacherState && typeof TeacherState.getTeacherSchoolMap === 'function') {
            return TeacherState.getTeacherSchoolMap() || {};
        }
        return window.TEACHER_SCHOOL_MAP && typeof window.TEACHER_SCHOOL_MAP === 'object' ? window.TEACHER_SCHOOL_MAP : {};
    }

    function applyTeacherState(map, schoolMap) {
        if (typeof window.setTeacherMap === 'function') {
            window.setTeacherMap(map || {});
        } else if (TeacherState && typeof TeacherState.setTeacherMap === 'function') {
            TeacherState.setTeacherMap(map || {});
        } else {
            window.TEACHER_MAP = map || {};
        }

        if (typeof window.setTeacherSchoolMap === 'function') {
            window.setTeacherSchoolMap(schoolMap || {});
        } else if (TeacherState && typeof TeacherState.setTeacherSchoolMap === 'function') {
            TeacherState.setTeacherSchoolMap(schoolMap || {});
        } else {
            window.TEACHER_SCHOOL_MAP = schoolMap || {};
        }
    }

    function parseTeacherHistoryTimestamp(entry) {
        if (!entry || typeof entry !== 'object') return 0;
        const rawTs = entry.savedAt || entry.updated_at || entry.updatedAt || entry.importedAt || entry.createdAt;
        if (typeof rawTs === 'number' && Number.isFinite(rawTs)) return rawTs;
        const parsed = Date.parse(String(rawTs || ''));
        return Number.isFinite(parsed) ? parsed : 0;
    }

    function resolveLocalTeacherHistoryEntry(termId) {
        const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
        const history = db?.teachingHistory || {};
        const candidates = [];
        const pushUnique = (value) => {
            const text = String(value || '').trim();
            if (!text || candidates.includes(text)) return;
            candidates.push(text);
        };

        const preferred = String(termId || '').trim();
        const savedTeacherTermId = getCurrentTeacherTermId();
        const savedBaseTerm = getCurrentTermId();
        [
            preferred,
            savedTeacherTermId,
            savedBaseTerm,
            getTeacherTermBase(preferred),
            getTeacherTermBase(savedTeacherTermId)
        ].forEach(pushUnique);

        const baseTerms = [...new Set(candidates.map(getTeacherTermBase).filter(Boolean))];
        Object.keys(history).forEach(key => {
            const text = String(key || '').trim();
            if (!text || candidates.includes(text)) return;
            if (baseTerms.includes(getTeacherTermBase(text))) pushUnique(text);
        });

        for (const key of candidates) {
            const entry = history[key];
            const map = entry?.map && typeof entry.map === 'object' ? entry.map : (entry || {});
            const schoolMap = entry?.schoolMap && typeof entry.schoolMap === 'object' ? entry.schoolMap : {};
            if (map && typeof map === 'object' && Object.keys(map).length > 0) {
                return {
                    key,
                    map,
                    schoolMap,
                    savedAt: parseTeacherHistoryTimestamp(entry)
                };
            }
        }
        return null;
    }

    function applyLoadedTeacherPayload(map, schoolMap, keyTermId, updatedAt) {
        if (keyTermId) syncTeacherTermState(keyTermId);
        applyTeacherState(map, schoolMap);
        if (window.DataManager && typeof DataManager.syncTeacherHistory === 'function') {
            DataManager.syncTeacherHistory({
                termId: keyTermId || getCurrentTeacherTermId() || getCurrentTermId() || '',
                source: 'cloud',
                timestamp: updatedAt || ''
            });
        }
        if (window.DataManager && typeof DataManager.rememberDataManagerSyncSnapshot === 'function') {
            DataManager.rememberDataManagerSyncSnapshot('teacher-cloud-load');
        }
        if (window.DataManager && typeof DataManager.renderTeachers === 'function') DataManager.renderTeachers();
        if (window.DataManager && typeof DataManager.refreshTeacherAnalysis === 'function') DataManager.refreshTeacherAnalysis();
        if (window.DataManager && typeof DataManager.renderDataManagerStatus === 'function') DataManager.renderDataManagerStatus();
        if (typeof updateStatusPanel === 'function') updateStatusPanel();
    }

    function hasSavedWorkspaceState() {
        if (WorkspaceState && typeof WorkspaceState.hasSavedWorkspace === 'function') {
            return WorkspaceState.hasSavedWorkspace();
        }
        return !!(getCurrentProjectKey() || getCurrentCohortId() || window.CURRENT_EXAM_ID || localStorage.getItem('CURRENT_EXAM_ID'));
    }

    function isLegacyWorkspaceShadowExamKey(key) {
        const text = String(key || '').trim();
        if (!text) return false;
        if (/^cohort::/i.test(text)) return false;
        if (isIgnoredExamKey(text)) return false;
        return /^\d{4}级_[^_]+年级_\d{4}-\d{4}_[^_]+_[^_]+(?:_[^_]+)?$/i.test(text);
    }

    function getWorkspaceExamSortTime(examId, examPayload) {
        const metaDate = examPayload?.meta?.date ? new Date(examPayload.meta.date).getTime() : 0;
        const updatedTs = examPayload?.updatedAt ? new Date(examPayload.updatedAt).getTime() : 0;
        const createdTs = Number(examPayload?.createdAt || 0);
        return metaDate || updatedTs || createdTs || 0;
    }

    function getWorkspaceSnapshotKey() {
        const explicitProjectKey = getCurrentProjectKey();
        if (/^cohort::/i.test(explicitProjectKey)) return explicitProjectKey;
        const cohortId = normalizeCohortId(getCurrentCohortId() || explicitProjectKey);
        if (cohortId) return `cohort::${cohortId}`;
        return explicitProjectKey;
    }

    function getCohortSyncCacheKey(cohortId) {
        return `CLOUD_EXAMS_SYNC_TS_${normalizeCohortId(cohortId)}`;
    }

    function countCachedCohortExams(db, cohortId) {
        const cid = normalizeCohortId(cohortId);
        if (!cid || !db || !db.exams || typeof db.exams !== 'object') return 0;
        return Object.keys(db.exams).reduce((count, examId) => {
            if (isIgnoredExamKey(examId) || isVirtualCohortSnapshotKey(examId)) return count;
            return extractCohortIdFromKey(examId) === cid ? count + 1 : count;
        }, 0);
    }

    function isVirtualCohortSnapshotKey(key) {
        return /^cohort::/i.test(String(key || '').trim());
    }

    function isIgnoredExamKey(key) {
        const k = String(key || '');
        if (!k) return true;
        if (k.startsWith(KEY_PREFIX_TEACHERS)) return true;
        if (KEY_PREFIX_COMPARE.some(prefix => k.startsWith(prefix))) return true;
        return false;
    }

    function parsePayload(content) {
        let raw = content;
        if (typeof raw === 'string' && raw.startsWith('LZ|')) {
            raw = LZString.decompressFromUTF16(raw.slice(3));
        }
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }

    function normalizeWorkspacePayload(payload) {
        const next = (payload && typeof payload === 'object') ? payload : {};
        const db = next.COHORT_DB && typeof next.COHORT_DB === 'object' ? next.COHORT_DB : null;
        const examMap = db?.exams && typeof db.exams === 'object' ? db.exams : null;
        if (!examMap) return next;

        const realExamEntries = Object.entries(examMap)
            .map(([examId, examPayload]) => ({
                examId: String(examId || '').trim(),
                examPayload: examPayload || {}
            }))
            .filter(item => item.examId && !isIgnoredExamKey(item.examId) && !isVirtualCohortSnapshotKey(item.examId) && !isLegacyWorkspaceShadowExamKey(item.examId));

        if (realExamEntries.length === 0) return next;

        Object.keys(examMap).forEach(examId => {
            if (isLegacyWorkspaceShadowExamKey(examId) || isVirtualCohortSnapshotKey(examId)) {
                delete examMap[examId];
            }
        });

        const sortedRealExamEntries = realExamEntries
            .slice()
            .sort((a, b) => {
                const ta = getWorkspaceExamSortTime(a.examId, a.examPayload);
                const tb = getWorkspaceExamSortTime(b.examId, b.examPayload);
                if (ta !== tb) return tb - ta;
                return String(b.examId || '').localeCompare(String(a.examId || ''), 'zh-CN');
            })
        ;

        const preferredCurrentExam = sortedRealExamEntries[0] || null;
        const preferredCurrentExamId = preferredCurrentExam?.examId || '';
        const preferredCurrentExamPayload = preferredCurrentExam?.examPayload || null;
        if (preferredCurrentExamId) {
            next.CURRENT_EXAM_ID = preferredCurrentExamId;
            db.currentExamId = preferredCurrentExamId;
        }

        if (preferredCurrentExamPayload && typeof preferredCurrentExamPayload === 'object') {
            next.ARCHIVE_META = clonePayloadFragment(preferredCurrentExamPayload.meta || next.ARCHIVE_META || null);
            next.RAW_DATA = clonePayloadFragment(preferredCurrentExamPayload.data || next.RAW_DATA || []);
            next.SCHOOLS = clonePayloadFragment(preferredCurrentExamPayload.schools || next.SCHOOLS || {});
            next.SUBJECTS = clonePayloadFragment(preferredCurrentExamPayload.subjects || next.SUBJECTS || []);
            next.THRESHOLDS = clonePayloadFragment(preferredCurrentExamPayload.thresholds || next.THRESHOLDS || {});
            next.TEACHER_MAP = clonePayloadFragment(preferredCurrentExamPayload.teacherMap || next.TEACHER_MAP || {});
            next.CONFIG = clonePayloadFragment(preferredCurrentExamPayload.config || next.CONFIG || {});
            next.FINGERPRINT = String(preferredCurrentExamPayload.fingerprint || next.FINGERPRINT || '').trim();
        }
        return next;
    }

    function packPayload(payload) {
        const json = JSON.stringify(payload || {});
        return 'LZ|' + LZString.compressToUTF16(json);
    }

    function clonePayloadFragment(value) {
        if (value == null) return value;
        return JSON.parse(JSON.stringify(value));
    }

    function getPayloadTargetCount(payload) {
        if (!payload || typeof payload !== 'object' || !payload.TARGETS || typeof payload.TARGETS !== 'object') return 0;
        return Object.keys(payload.TARGETS).length;
    }

    function hasPayloadIndicatorParams(payload) {
        const params = payload?.INDICATOR_PARAMS;
        if (!params || typeof params !== 'object') return false;
        return !!String(params.ind1 || '').trim() || !!String(params.ind2 || '').trim();
    }

    function hasPayloadAliasSettings(payload) {
        return Array.isArray(payload?.SCHOOL_ALIAS_SETTINGS) && payload.SCHOOL_ALIAS_SETTINGS.length > 0;
    }

    function needsIndicatorPayloadSupplement(payload) {
        return getPayloadTargetCount(payload) === 0 || !hasPayloadIndicatorParams(payload) || !hasPayloadAliasSettings(payload);
    }

    function mergeIndicatorPayloadFields(payload, supplement) {
        const base = (payload && typeof payload === 'object') ? { ...payload } : {};
        if (!supplement || typeof supplement !== 'object') return base;

        if (getPayloadTargetCount(base) === 0 && getPayloadTargetCount(supplement) > 0) {
            base.TARGETS = clonePayloadFragment(supplement.TARGETS);
        }
        if (!hasPayloadIndicatorParams(base) && hasPayloadIndicatorParams(supplement)) {
            base.INDICATOR_PARAMS = clonePayloadFragment(supplement.INDICATOR_PARAMS);
        }
        if (!hasPayloadAliasSettings(base) && hasPayloadAliasSettings(supplement)) {
            base.SCHOOL_ALIAS_SETTINGS = clonePayloadFragment(supplement.SCHOOL_ALIAS_SETTINGS);
        }
        return base;
    }

    async function loadSnapshotPayloadByKey(key) {
        const snapshotKey = String(key || '').trim();
        if (!snapshotKey) return null;

        try {
            if (window.idbKeyval) {
                const cached = await idbKeyval.get(`cache_${snapshotKey}`);
                if (cached && typeof cached === 'object') return cached;
            }
        } catch (e) {
            console.warn('[CloudLoad] read snapshot cache failed:', e);
        }

        const { data, error } = await window.sbClient
            .from(CLOUD_TABLE)
            .select('content')
            .eq('key', snapshotKey)
            .maybeSingle();
        if (error) throw error;
        if (!data?.content) return null;

        const payload = parsePayload(data.content);
        try {
            if (window.idbKeyval && payload && typeof payload === 'object') {
                await idbKeyval.set(`cache_${snapshotKey}`, payload);
            }
        } catch (e) {
            console.warn('[CloudLoad] write snapshot cache failed:', e);
        }
        return payload;
    }

    function scoreIndicatorSupplement(basePayload, preferredKey, candidateKey, candidatePayload) {
        if (!candidatePayload || typeof candidatePayload !== 'object') return Number.NEGATIVE_INFINITY;
        let score = 0;

        const targetCount = getPayloadTargetCount(candidatePayload);
        if (targetCount > 0) score += 500 + targetCount;
        if (hasPayloadIndicatorParams(candidatePayload)) score += 180;
        if (hasPayloadAliasSettings(candidatePayload)) score += 60;

        const preferredExamLabel = deriveExamLabel(preferredKey);
        const candidateExamLabel = deriveExamLabel(candidateKey);
        if (preferredExamLabel && candidateExamLabel && preferredExamLabel === candidateExamLabel) score += 120;

        const baseFingerprint = String(basePayload?.FINGERPRINT || '').trim();
        const candidateFingerprint = String(candidatePayload?.FINGERPRINT || '').trim();
        if (baseFingerprint && candidateFingerprint && baseFingerprint === candidateFingerprint) score += 220;

        const baseRows = Array.isArray(basePayload?.RAW_DATA) ? basePayload.RAW_DATA.length : 0;
        const candidateRows = Array.isArray(candidatePayload?.RAW_DATA) ? candidatePayload.RAW_DATA.length : 0;
        if (baseRows > 0 && candidateRows === baseRows) score += 90;

        const cohortId = normalizeCohortId(basePayload?.CURRENT_COHORT_ID || preferredKey || getCurrentCohortId());
        if (cohortId && candidateKey === `cohort::${cohortId}`) score += 40;

        return score;
    }

    async function supplementIndicatorPayload(preferredKey, payload) {
        if (!needsIndicatorPayloadSupplement(payload)) return payload;

        const cohortId = normalizeCohortId(
            payload?.CURRENT_COHORT_ID
            || extractCohortIdFromKey(preferredKey)
            || getCurrentCohortId()
        );
        if (!cohortId) return payload;

        const candidateKeys = new Set();
        candidateKeys.add(`cohort::${cohortId}`);

        const { data, error } = await window.sbClient
            .from(CLOUD_TABLE)
            .select('key,updated_at')
            .like('key', `${cohortId}%`)
            .order('updated_at', { ascending: false })
            .limit(50);
        if (error) throw error;

        (data || []).forEach((row) => {
            const key = String(row?.key || '').trim();
            if (!key || key === preferredKey || isIgnoredExamKey(key)) return;
            candidateKeys.add(key);
        });

        let bestPayload = null;
        let bestScore = Number.NEGATIVE_INFINITY;
        for (const candidateKey of candidateKeys) {
            if (!candidateKey || candidateKey === preferredKey) continue;
            try {
                const candidatePayload = await loadSnapshotPayloadByKey(candidateKey);
                const score = scoreIndicatorSupplement(payload, preferredKey, candidateKey, candidatePayload);
                if (score > bestScore) {
                    bestScore = score;
                    bestPayload = candidatePayload;
                }
            } catch (e) {
                console.warn('[CloudLoad] supplement candidate skipped:', candidateKey, e?.message || e);
            }
        }

        if (!bestPayload || bestScore === Number.NEGATIVE_INFINITY) return payload;
        const merged = mergeIndicatorPayloadFields(payload, bestPayload);

        try {
            if (window.idbKeyval && merged && typeof merged === 'object') {
                await idbKeyval.set(`cache_${preferredKey}`, merged);
            }
        } catch (e) {
            console.warn('[CloudLoad] cache merged payload failed:', e);
        }

        return merged;
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

    function seedCurrentExamToCohortDb(payload, fallbackKey, updatedAt) {
        if (typeof CohortDB === 'undefined' || typeof CohortDB.ensure !== 'function') return;
        const examId = String(payload?.CURRENT_EXAM_ID || fallbackKey || '').trim();
        if (!examId || isVirtualCohortSnapshotKey(examId)) return;

        const rows = Array.isArray(payload?.RAW_DATA) ? payload.RAW_DATA : [];
        if (!rows.length) return;

        const db = CohortDB.ensure();
        db.exams = db.exams || {};

        const keyParts = examId.split('_');
        const examLabel = keyParts.length >= 5 ? keyParts.slice(4).join('_') : examId;
        const remoteTs = updatedAt ? (new Date(updatedAt).getTime() || Date.now()) : Date.now();
        const existing = db.exams[examId];
        const existingCount = Array.isArray(existing?.data) ? existing.data.length : 0;

        if (!existing || existingCount === 0) {
            db.exams[examId] = {
                examId,
                examLabel,
                meta: payload?.ARCHIVE_META || payload?.CONFIG || {},
                data: rows,
                schools: payload?.SCHOOLS || {},
                teacherMap: payload?.TEACHER_MAP || {},
                subjects: payload?.SUBJECTS || [],
                thresholds: payload?.THRESHOLDS || {},
                config: payload?.CONFIG || {},
                fingerprint: payload?.FINGERPRINT || computeExamDataFingerprint(rows),
                createdAt: remoteTs,
                updatedAt: updatedAt || ''
            };
        }

        db.currentExamId = examId;
        window.COHORT_DB = db;
    }

    function deriveExamLabel(examId, fallbackLabel) {
        if (fallbackLabel) return fallbackLabel;
        const keyParts = String(examId || '').split('_');
        return keyParts.length >= 5 ? keyParts.slice(4).join('_') : String(examId || '');
    }

    function upsertCloudExamSnapshot(db, examId, payload, updatedAt, fallbackLabel) {
        if (!db || !examId || !payload || isIgnoredExamKey(examId) || isVirtualCohortSnapshotKey(examId)) return 0;
        const rows = Array.isArray(payload?.RAW_DATA) && payload.RAW_DATA.length
            ? payload.RAW_DATA
            : Array.isArray(payload?.data) && payload.data.length
                ? payload.data
                : [];
        if (!rows.length) return 0;

        const remoteTs = updatedAt ? (new Date(updatedAt).getTime() || Date.now()) : Date.now();
        const existing = db.exams?.[examId];
        const existingCount = Array.isArray(existing?.data) ? existing.data.length : 0;
        const existingTs = existing
            ? Math.max(new Date(existing.updatedAt || 0).getTime() || 0, Number(existing.createdAt || 0))
            : 0;
        if (existing && existingCount > 0 && remoteTs <= existingTs + 1000) return 0;

        db.exams[examId] = {
            examId,
            examLabel: payload?.examLabel || deriveExamLabel(examId, fallbackLabel),
            meta: payload?.ARCHIVE_META || payload?.meta || payload?.CONFIG || payload?.config || {},
            data: rows,
            schools: payload?.SCHOOLS || payload?.schools || {},
            teacherMap: payload?.TEACHER_MAP || payload?.teacherMap || {},
            subjects: payload?.SUBJECTS || payload?.subjects || [],
            thresholds: payload?.THRESHOLDS || payload?.thresholds || {},
            config: payload?.CONFIG || payload?.config || {},
            fingerprint: payload?.FINGERPRINT || payload?.fingerprint || computeExamDataFingerprint(rows),
            createdAt: existingCount > 0 ? (existing.createdAt || remoteTs) : remoteTs,
            updatedAt: updatedAt || existing?.updatedAt || ''
        };
        return 1;
    }

    function hydrateBundledCohortExams(db, payload, updatedAt) {
        const bundledExams = payload?.COHORT_DB?.exams;
        if (!bundledExams || typeof bundledExams !== 'object') return 0;
        let mergedCount = 0;
        Object.entries(bundledExams).forEach(([examId, examPayload]) => {
            mergedCount += upsertCloudExamSnapshot(db, examId, examPayload, updatedAt, examPayload?.examLabel || examId);
        });
        return mergedCount;
    }

    async function resolveCloudSnapshotKey(preferredKey) {
        const rawKey = String(preferredKey || '').trim();
        if (/^cohort::/i.test(rawKey)) return rawKey;
        const keyLooksLikeExam = rawKey
            && !/^cohort::/i.test(rawKey)
            && !isIgnoredExamKey(rawKey)
            && !!extractCohortIdFromKey(rawKey);
        if (keyLooksLikeExam) return rawKey;

        const cid = normalizeCohortId(
            extractCohortIdFromKey(rawKey)
            || getCurrentCohortId()
        );
        let query = window.sbClient.from(CLOUD_TABLE).select('key,updated_at');
        if (cid) query = query.like('key', `${cid}%`);
        const { data, error } = await query.order('updated_at', { ascending: false }).limit(50);
        if (error) throw error;

        const rows = (data || []).filter(row => {
            if (isIgnoredExamKey(row.key)) return false;
            if (!cid) return true;
            return extractCohortIdFromKey(row.key) === cid;
        });
        return rows[0]?.key || '';
    }

    async function refreshCompareSelectors() {
        if (typeof CohortDB !== 'undefined' && typeof CohortDB.renderExamList === 'function') CohortDB.renderExamList();
        if (typeof updateMacroMultiExamSelects === 'function') updateMacroMultiExamSelects();
        if (typeof updateTeacherMultiExamSelects === 'function') updateTeacherMultiExamSelects();
        if (typeof updateTeacherCompareExamSelects === 'function') updateTeacherCompareExamSelects();
        if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
        if (typeof updateProgressMultiExamSelects === 'function') updateProgressMultiExamSelects();
        if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
    }

    function getCurrentUserRole() {
        if (window.AuthState && typeof window.AuthState.getCurrentRole === 'function') {
            return window.AuthState.getCurrentRole();
        }
        return sessionStorage.getItem('CURRENT_ROLE') || 'guest';
    }

    window.CloudWorkspaceRuntimeDeps = {
        CLOUD_TABLE,
        AUTO_COHORT_SYNC_COOLDOWN_MS,
        safeToast,
        safeLoading,
        setCloudStatus,
        normalizeCohortId,
        extractCohortIdFromKey,
        isLegacyWorkspaceShadowExamKey,
        getWorkspaceExamSortTime,
        getWorkspaceSnapshotKey,
        getCohortSyncCacheKey,
        countCachedCohortExams,
        isVirtualCohortSnapshotKey,
        isIgnoredExamKey,
        parsePayload,
        packPayload,
        clonePayloadFragment,
        getPayloadTargetCount,
        hasPayloadIndicatorParams,
        hasPayloadAliasSettings,
        needsIndicatorPayloadSupplement,
        mergeIndicatorPayloadFields,
        loadSnapshotPayloadByKey,
        scoreIndicatorSupplement,
        supplementIndicatorPayload,
        computeExamDataFingerprint,
        seedCurrentExamToCohortDb,
        deriveExamLabel,
        upsertCloudExamSnapshot,
        hydrateBundledCohortExams,
        resolveCloudSnapshotKey,
        refreshCompareSelectors,
        getCurrentUserRole
    };

    const CloudManager = {
        check: (silent = false) => {
            if (!window.sbClient) {
                if (!silent) safeToast('云端未连接 (Supabase Disconnected)', 'error');
                return false;
            }
            return true;
        },

        ensureClientReady: async function (options = {}) {
            const timeoutMs = Number(options.timeoutMs || 8000);
            const retryMs = Number(options.retryMs || 250);
            const silent = Boolean(options.silent);

            if (this.check(true)) {
                setCloudStatus('connected');
                return true;
            }
            setCloudStatus('connecting');
            if (typeof window.initSupabase === 'function') window.initSupabase();

            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                if (this.check(true)) {
                    setCloudStatus('connected');
                    return true;
                }
                await sleep(retryMs);
                if (typeof window.initSupabase === 'function') window.initSupabase();
            }
            const ok = this.check(silent);
            if (!ok) setCloudStatus('error', '连接失败');
            return ok;
        },

        getKey: () => {
            const meta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
            if (!meta.cohortId || !meta.year || !meta.term || !meta.type) return null;
            const examName = String(
                meta.examName
                || meta.name
                || meta.type
                || '标准考试'
            ).trim() || '标准考试';
            const parts = [
                `${meta.cohortId}级`,
                meta.grade ? `${meta.grade}年级` : '未知年级',
                meta.year,
                meta.term,
                examName
            ];
            return parts.join('_').replace(/[\s\/\\?]/g, '');
        },

        getTeacherKey: () => {
            const termSel = document.getElementById('dm-teacher-term-select');
            const meta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
            const exactUiTeacherTerm = meta.year && meta.term
                ? `${meta.year}_${meta.term}${meta.grade ? '_' + meta.grade + '年级' : ''}`
                : '';
            const termId = termSel?.value
                || getCurrentTeacherTermId()
                || exactUiTeacherTerm
                || getCurrentTermId()
                || (typeof getTermId === 'function' ? getTermId(meta) : '');
            const cohortId = getCurrentCohortId() || window.CURRENT_COHORT_META?.id || meta.cohortId;
            if (!termId || !cohortId) return null;
            return `${KEY_PREFIX_TEACHERS}${cohortId}级_${termId}`;
        },

        // 工作区/考试快照运行时已拆分到 public/assets/js/cloud-workspace-runtime.js

        saveTeachers: async function () {
            if (!(await this.ensureClientReady())) return false;
            setCloudStatus('syncing', '同步任课');
            const key = this.getTeacherKey();
            if (!key) {
                safeToast('无法确定学期或年级信息', 'error');
                return false;
            }
            const teacherMap = getTeacherMap();
            if (!teacherMap || Object.keys(teacherMap).length === 0) {
                safeToast('当前无任课数据', 'warning');
                return false;
            }

            safeLoading(true, '正在同步任课数据...');
            try {
                const content = packPayload({
                    map: teacherMap,
                    schoolMap: getTeacherSchoolMap()
                });
                const { error } = await window.sbClient.from(CLOUD_TABLE).upsert({
                    key,
                    content,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
                if (error) throw error;

                localStorage.setItem('TEACHER_SYNC_AT', new Date().toISOString());
                if (typeof logAction === 'function') logAction('任课同步', `任课表已保存：${key}`);
                if (window.DataManager && typeof DataManager.rememberDataManagerSyncSnapshot === 'function') {
                    DataManager.rememberDataManagerSyncSnapshot('teacher-cloud-save');
                }
                if (window.DataManager && typeof DataManager.refreshTeacherAnalysis === 'function') {
                    DataManager.refreshTeacherAnalysis();
                }
                if (window.DataManager && typeof DataManager.renderDataManagerStatus === 'function') {
                    DataManager.renderDataManagerStatus();
                }
                if (typeof updateStatusPanel === 'function') updateStatusPanel();
                safeToast('任课表同步成功', 'success');
                setCloudStatus('success', '任课已同步');
                return true;
            } catch (e) {
                console.error('Teacher save error:', e);
                alert(`任课同步失败: ${e.message || e}`);
                setCloudStatus('error', '任课同步失败');
                return false;
            } finally {
                safeLoading(false);
            }
        },

        loadTeachers: async function (options = {}) {
            const opts = options && typeof options === 'object' ? { ...options } : {};
            const background = Boolean(opts.background);
            const showBlocking = !background && opts.blocking !== false;
            const showToast = opts.toast === false ? false : !background;
            if (!(await this.ensureClientReady())) return false;

            const requestKey = [
                this.getTeacherKey(),
                getCurrentTeacherTermId(),
                getCurrentTermId(),
                getCurrentCohortId()
            ].map(v => String(v || '').trim()).filter(Boolean).join('|') || 'default';
            this._teacherLoadTasks = this._teacherLoadTasks || {};
            if (this._teacherLoadTasks[requestKey]) return this._teacherLoadTasks[requestKey];

            this._teacherLoadTasks[requestKey] = (async () => {
                setCloudStatus('syncing', background ? '检查任课' : '拉取任课');
                if (showBlocking) safeLoading(true, '正在从云端拉取任课表...');
                try {
                    let key = this.getTeacherKey();
                    let metaRow = null;
                    let row = null;
                    const cohortId = getCurrentCohortId();
                    const termSel = document.getElementById('dm-teacher-term-select');
                    const meta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
                    const exactUiTeacherTerm = meta.year && meta.term
                        ? `${meta.year}_${meta.term}${meta.grade ? '_' + meta.grade + '年级' : ''}`
                        : '';
                    const desiredTerms = [
                        termSel?.value,
                        getCurrentTeacherTermId(),
                        exactUiTeacherTerm,
                        getCurrentTermId()
                    ].map(v => String(v || '').trim()).filter(Boolean);

                    if (key) {
                        const { data, error } = await window.sbClient
                            .from(CLOUD_TABLE)
                            .select('key,updated_at')
                            .eq('key', key)
                            .maybeSingle();
                        if (error) throw error;
                        metaRow = data || null;
                    }

                    if (!metaRow) {
                        let query = window.sbClient
                            .from(CLOUD_TABLE)
                            .select('key,updated_at')
                            .like('key', `${KEY_PREFIX_TEACHERS}%`)
                            .order('updated_at', { ascending: false })
                            .limit(20);

                        if (cohortId) {
                            query = window.sbClient
                                .from(CLOUD_TABLE)
                                .select('key,updated_at')
                                .like('key', `${KEY_PREFIX_TEACHERS}${cohortId}%`)
                                .order('updated_at', { ascending: false })
                                .limit(20);
                        }

                        const { data: rows, error } = await query;
                        if (error) throw error;
                        metaRow = (rows || []).find(item => desiredTerms.some(term => {
                            const keyText = String(item?.key || '');
                            return keyText.endsWith(`_${term}`) || keyText.includes(`_${term}_`);
                        })) || rows?.[0] || null;
                        key = metaRow?.key || key;
                    }

                    const keyTermId = String(key || metaRow?.key || '').replace(/^TEACHERS_[^_]+_/, '').trim();
                    const localEntry = resolveLocalTeacherHistoryEntry(keyTermId || desiredTerms[0] || '');
                    const remoteTs = Number.isFinite(Date.parse(String(metaRow?.updated_at || '')))
                        ? Date.parse(String(metaRow?.updated_at || ''))
                        : 0;

                    if (localEntry && (!metaRow || (remoteTs && localEntry.savedAt >= (remoteTs - 1000)))) {
                        applyLoadedTeacherPayload(localEntry.map, localEntry.schoolMap, localEntry.key || keyTermId, metaRow?.updated_at || localEntry.savedAt || '');
                        if (showToast && !metaRow) safeToast(`已使用本地任课缓存（${Object.keys(localEntry.map).length} 条）`, 'success');
                        if (typeof logAction === 'function') logAction('任课同步', `任课表使用缓存：${localEntry.key || keyTermId || 'local'}`);
                        setCloudStatus('success', '任课已就绪');
                        return true;
                    }

                    if (!metaRow) {
                        if (showToast) safeToast('未找到可用任课表', 'warning');
                        setCloudStatus('success', '暂无任课');
                        return false;
                    }

                    setCloudStatus('syncing', '拉取任课');
                    const { data, error } = await window.sbClient
                        .from(CLOUD_TABLE)
                        .select('key,content,updated_at')
                        .eq('key', metaRow.key)
                        .maybeSingle();
                    if (error) throw error;
                    row = data || null;

                    if (!row || !row.content) {
                        if (showToast) safeToast('未找到可用任课表', 'warning');
                        setCloudStatus('success', '暂无任课');
                        return false;
                    }

                    const parsed = parsePayload(row.content) || {};
                    const map = parsed.map && typeof parsed.map === 'object' ? parsed.map : {};
                    const schoolMap = parsed.schoolMap && typeof parsed.schoolMap === 'object' ? parsed.schoolMap : {};
                    applyLoadedTeacherPayload(map, schoolMap, keyTermId, row?.updated_at || '');

                    if (showToast) safeToast(`已加载任课表（${Object.keys(map).length} 条）`, 'success');
                    if (typeof logAction === 'function') logAction('任课同步', `任课表已加载：${metaRow.key || key || 'latest'}`);
                    setCloudStatus('success', '任课已拉取');
                    return true;
                } catch (e) {
                    console.error('Teacher load error:', e);
                    if (showToast) safeToast('任课表加载失败', 'error');
                    setCloudStatus('error', '任课拉取失败');
                    return false;
                } finally {
                    if (showBlocking) safeLoading(false);
                }
            })().finally(() => {
                delete this._teacherLoadTasks[requestKey];
            });

            return this._teacherLoadTasks[requestKey];
        },

        fetchStudentExamHistory: async function (student) {
            if (!(await this.ensureClientReady())) return { success: false, message: '云端未连接' };
            setCloudStatus('syncing', '拉取历史');
            if (!student || !student.name) return { success: false, message: '学生信息无效' };

            const cohortId = normalizeCohortId(student.cohort || getCurrentCohortId());
            if (!cohortId) return { success: false, message: '无法确定学生届别' };

            try {
                const { data, error } = await window.sbClient
                    .from(CLOUD_TABLE)
                    .select('key, content, updated_at')
                    .like('key', `${cohortId}%`)
                    .order('updated_at', { ascending: true });
                if (error) throw error;

                const rows = (data || []).filter(row => !isIgnoredExamKey(row.key));
                const targetName = String(student.name || '').trim();
                const targetClassNum = String(student.class || '').replace(/[^0-9]/g, '');
                const history = [];

                for (const row of rows) {
                    try {
                        const payload = parsePayload(row.content) || {};
                        let match = null;

                        const schools = payload.SCHOOLS || {};
                        for (const [schoolName, schoolData] of Object.entries(schools)) {
                            if (student.school && schoolName !== student.school) continue;
                            const list = Array.isArray(schoolData?.students) ? schoolData.students : [];
                            match = list.find(s => {
                                if (String(s?.name || '').trim() !== targetName) return false;
                                if (!targetClassNum) return true;
                                return String(s?.class || '').replace(/[^0-9]/g, '') === targetClassNum;
                            });
                            if (match) break;
                        }

                        if (!match) {
                            const list = payload.students || payload.RAW_DATA || [];
                            match = list.find(s => {
                                if (String(s?.name || '').trim() !== targetName) return false;
                                if (!targetClassNum) return true;
                                return String(s?.class || '').replace(/[^0-9]/g, '') === targetClassNum;
                            });
                        }

                        if (!match) continue;

                        const keyParts = String(row.key || '').split('_');
                        const examLabel = keyParts.length >= 5 ? keyParts.slice(4).join('_') : row.key;

                        history.push({
                            // Use full key as canonical ID to avoid "same exam" false positives.
                            examId: row.key,
                            examFullKey: row.key,
                            examLabel: examLabel || row.key,
                            fingerprint: payload?.FINGERPRINT || computeExamDataFingerprint(payload?.RAW_DATA || []),
                            total: match.total,
                            rankClass: match.ranks?.total?.class,
                            rankSchool: match.ranks?.total?.school,
                            rankTown: match.ranks?.total?.township,
                            subjectRanks: match.ranks || {},
                            scores: match.scores,
                            updatedAt: row.updated_at
                        });
                    } catch (rowErr) {
                        console.warn('[CloudHistory] parse row failed:', rowErr);
                    }
                }

                setCloudStatus('success', `历史${history.length}条`);
                return { success: true, data: history };
            } catch (e) {
                console.error('[CloudHistory] failed:', e);
                setCloudStatus('error', '历史拉取失败');
                return { success: false, message: e.message || String(e) };
            }
        },

        // 届别考试补拉运行时已拆分到 public/assets/js/cloud-workspace-runtime.js
    };

    window.CloudManager = CloudManager;
    window.saveCloudData = (options = {}) => CloudManager.save(options);

    let cloudLoadPromise = null;
    window.loadCloudData = () => {
        if (cloudLoadPromise) return cloudLoadPromise;
        cloudLoadPromise = Promise.resolve(CloudManager.load()).finally(() => {
            cloudLoadPromise = null;
        });
        return cloudLoadPromise;
    };

    window.getUniqueExamKey = () => CloudManager.getKey();
    window.saveCloudSnapshot = (options = {}) => CloudManager.save(options);

    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (typeof updateStatusPanel === 'function') updateStatusPanel();
            if (typeof updateRoleHint === 'function') updateRoleHint();
            if (typeof renderActionLogs === 'function') renderActionLogs();
            if (typeof scanDataIssues === 'function') scanDataIssues();
            const hasSessionUser = !!(window.AuthState && typeof window.AuthState.hasActiveSession === 'function'
                ? window.AuthState.hasActiveSession(window.Auth && Auth.currentUser)
                : (window.Auth && Auth.currentUser));
            const hasSavedWorkspace = hasSavedWorkspaceState();
            const hasRuntimeScores = Array.isArray(window.RAW_DATA) && window.RAW_DATA.length > 0;
            if (hasSessionUser && !localStorage.getItem('HAS_SEEN_STARTER') && !hasSavedWorkspace && !hasRuntimeScores && typeof switchTab === 'function' && typeof openStarterGuide === 'function') {
                if (typeof __guardBypass !== 'undefined') __guardBypass = true;
                switchTab('starter-hub');
                openStarterGuide();
            }
            if (typeof scheduleTeacherSyncPrompt === 'function') scheduleTeacherSyncPrompt();
            if (hasSessionUser && typeof CloudManager.fetchAllCohortExams === 'function') {
                CloudManager.fetchAllCohortExams({ background: true });
            }
        }, 800);
    });
})();
