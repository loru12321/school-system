(() => {
    if (typeof window === 'undefined') return;
    const CloudManager = window.CloudManager;
    const deps = window.CloudWorkspaceRuntimeDeps;
    const WorkspaceState = window.WorkspaceState || null;
    if (!CloudManager || !deps || window.__CLOUD_WORKSPACE_RUNTIME_PATCHED__) return;

    const {
        CLOUD_TABLE,
        AUTO_COHORT_SYNC_COOLDOWN_MS,
        safeToast,
        safeLoading,
        setCloudStatus,
        normalizeCohortId,
        extractCohortIdFromKey,
        getWorkspaceSnapshotKey,
        getCohortSyncCacheKey,
        countCachedCohortExams,
        parsePayload,
        packPayload,
        normalizeWorkspacePayload: normalizeCloudWorkspacePayload,
        supplementIndicatorPayload,
        seedCurrentExamToCohortDb,
        deriveExamLabel,
        upsertCloudExamSnapshot,
        hydrateBundledCohortExams,
        resolveCloudSnapshotKey,
        refreshCompareSelectors,
        getCurrentUserRole,
        isIgnoredExamKey
    } = deps;

    function normalizeWorkspacePayload(payload) {
        if (typeof normalizeCloudWorkspacePayload === 'function') {
            return normalizeCloudWorkspacePayload(payload);
        }
        return payload;
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

    function getExamKeyRecencyScore(key, updatedAt = '') {
        const text = String(key || '');
        const updatedScore = new Date(updatedAt || '').getTime() || 0;
        const dateMatch = text.match(/(20\d{2})[-_/年.](\d{1,2})[-_/月.](\d{1,2})/);
        const dateScore = dateMatch
            ? new Date(Number(dateMatch[1]), Number(dateMatch[2]) - 1, Number(dateMatch[3])).getTime()
            : 0;
        const termScore = text.includes('下学期') ? 200000 : text.includes('上学期') ? 100000 : 0;
        const typeOrder = ['期中', '期末', '一模', '二模', '三模', '四模', '中考'];
        const typeScore = typeOrder.reduce((score, label, index) => (
            text.includes(label) ? Math.max(score, (index + 1) * 1000) : score
        ), 0);
        return Math.max(updatedScore, dateScore) + termScore + typeScore;
    }

    function syncWorkspaceState(patch = {}) {
        if (WorkspaceState && typeof WorkspaceState.syncWorkspaceState === 'function') {
            return WorkspaceState.syncWorkspaceState(patch);
        }
        const next = patch && typeof patch === 'object' ? patch : {};
        if (Object.prototype.hasOwnProperty.call(next, 'currentProjectKey')) {
            const key = String(next.currentProjectKey || '').trim();
            if (key) {
                localStorage.setItem('CURRENT_PROJECT_KEY', key);
                window.CURRENT_PROJECT_KEY = key;
            }
        }
        if (Object.prototype.hasOwnProperty.call(next, 'currentExamId')) {
            const examId = String(next.currentExamId || '').trim();
            if (examId) {
                localStorage.setItem('CURRENT_EXAM_ID', examId);
                window.CURRENT_EXAM_ID = examId;
            }
        }
        return next;
    }

    function isRecoverableCloudRuntimeError(error) {
        const text = `${error?.message || ''} ${error?.details || ''} ${error || ''}`.toLowerCase();
        return text.includes('aborterror')
            || text.includes('signal is aborted')
            || text.includes('request was aborted')
            || text.includes('timeout');
    }

    function logCloudRuntimeIssue(label, error) {
        if (isRecoverableCloudRuntimeError(error)) {
            console.warn(label, error);
            return;
        }
        console.error(label, error);
    }

    function scheduleBackgroundCloudTask(task, delay = 0, timeout = 8000) {
        const run = () => {
            if (document.visibilityState === 'hidden') {
                window.setTimeout(() => scheduleBackgroundCloudTask(task, delay, timeout), 15000);
                return;
            }
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(() => task(), { timeout });
                return;
            }
            task();
        };
        window.setTimeout(run, Math.max(0, Number(delay) || 0));
    }

    async function selectSystemData(options = {}) {
        if (window.CloudDataService && typeof window.CloudDataService.selectSystemData === 'function') {
            return window.CloudDataService.selectSystemData(options);
        }
        if (window.CloudApi && typeof window.CloudApi.selectSystemData === 'function') {
            return window.CloudApi.selectSystemData(options);
        }
        if (typeof window.selectSystemDataRecords === 'function') {
            return window.selectSystemDataRecords(options);
        }
        if (!window.sbClient || typeof window.sbClient.from !== 'function') {
            return { data: options.maybeSingle ? null : [], error: new Error('CLOUD_CLIENT_MISSING') };
        }
        let query = window.sbClient.from(CLOUD_TABLE).select(options.select || '*');
        if (options.keyEq) query = query.eq('key', options.keyEq);
        if (options.keyLike) query = query.like('key', options.keyLike);
        if (Array.isArray(options.keyIn) && options.keyIn.length) query = query.in('key', options.keyIn);
        if (options.order) query = query.order(options.order, { ascending: options.ascending !== false });
        if (Number.isFinite(Number(options.limit)) && Number(options.limit) > 0) query = query.limit(Number(options.limit));
        if (Number.isFinite(Number(options.offset)) && Number(options.offset) > 0 && typeof query.range === 'function' && Number.isFinite(Number(options.limit)) && Number(options.limit) > 0) {
            const offset = Math.floor(Number(options.offset));
            const limit = Math.floor(Number(options.limit));
            query = query.range(offset, offset + limit - 1);
        }
        if (options.maybeSingle && typeof query.maybeSingle === 'function') query = query.maybeSingle();
        return query;
    }

    function getCohortExamMetaMemoryCache(manager) {
        if (!manager || typeof manager !== 'object') return null;
        manager._cohortExamMetaCache = manager._cohortExamMetaCache && typeof manager._cohortExamMetaCache === 'object'
            ? manager._cohortExamMetaCache
            : {};
        return manager._cohortExamMetaCache;
    }

    function clearCohortExamMetaMemoryCache(manager, cohortId = '') {
        const cache = getCohortExamMetaMemoryCache(manager);
        if (!cache) return;
        const cid = normalizeCohortId(cohortId);
        if (!cid) {
            Object.keys(cache).forEach((key) => delete cache[key]);
            return;
        }
        Object.keys(cache).forEach((key) => {
            if (String(key || '').startsWith(`${cid}:`)) delete cache[key];
        });
    }

    function readCachedCohortExamMetaRows(manager, cid, mode) {
        const cache = getCohortExamMetaMemoryCache(manager);
        if (!cache) return null;
        const key = `${cid}:${mode || 'all'}`;
        const entry = cache[key];
        if (!entry || Date.now() - Number(entry.at || 0) > COHORT_EXAM_META_CACHE_MS) return null;
        return Array.isArray(entry.rows) ? entry.rows.slice() : null;
    }

    function writeCachedCohortExamMetaRows(manager, cid, mode, rows) {
        const cache = getCohortExamMetaMemoryCache(manager);
        if (!cache) return rows;
        cache[`${cid}:${mode || 'all'}`] = {
            at: Date.now(),
            rows: Array.isArray(rows) ? rows.slice() : []
        };
        return rows;
    }

    async function fetchCohortExamMetaRows(manager, cid, options = {}) {
        const mode = options.latestOnly ? 'latest' : 'all';
        const cached = !options.force ? readCachedCohortExamMetaRows(manager, cid, mode) : null;
        if (cached) return cached;

        const startedAt = nowMs();
        const rows = [];
        const latestLimit = Math.max(COHORT_EXAM_LATEST_META_LIMIT, Number(options.minCount || 0) + 4);
        const firstLimit = options.latestOnly ? latestLimit : COHORT_EXAM_META_PAGE_SIZE;
        let offset = 0;

        while (true) {
            const limit = offset === 0 ? firstLimit : COHORT_EXAM_META_PAGE_SIZE;
            const { data, error } = await selectSystemData({
                select: 'key,updated_at',
                keyLike: `${cid}%`,
                order: 'updated_at',
                ascending: false,
                limit,
                offset
            });
            if (error) throw error;
            const pageRows = (Array.isArray(data) ? data : []).filter((row) => {
                if (isIgnoredExamKey(row?.key)) return false;
                return extractCohortIdFromKey(row?.key) === cid;
            });
            rows.push(...pageRows);
            if (options.latestOnly || !Array.isArray(data) || data.length < limit) break;
            offset += limit;
            if (offset >= 1000) break;
        }

        rememberWorkspacePerf('CloudWorkspace.fetchCohortExamMetaRows', startedAt, {
            cache: options.force ? 'force' : 'miss',
            rows: rows.length,
            mode,
            limit: firstLimit,
            pages: Math.max(1, Math.ceil((offset + firstLimit) / COHORT_EXAM_META_PAGE_SIZE))
        });
        return writeCachedCohortExamMetaRows(manager, cid, mode, rows);
    }

    async function upsertSystemDataRecord(row) {
        if (window.CloudDataService && typeof window.CloudDataService.upsertSystemDataRecord === 'function') {
            return window.CloudDataService.upsertSystemDataRecord(row);
        }
        if (window.CloudApi && typeof window.CloudApi.upsertSystemData === 'function') {
            return window.CloudApi.upsertSystemData(row);
        }
        if (typeof window.upsertSystemDataRecord === 'function') {
            return window.upsertSystemDataRecord(row);
        }
        if (!window.sbClient || typeof window.sbClient.from !== 'function') {
            return { data: null, error: new Error('CLOUD_CLIENT_MISSING') };
        }
        return window.sbClient.from(CLOUD_TABLE).upsert(row, { onConflict: 'key' });
    }

    const WORKSPACE_SYNC_META_PREFIX = 'CLOUD_WORKSPACE_META_V2::';
    const WORKSPACE_SYNC_QUEUE_KEY = 'CLOUD_WORKSPACE_SYNC_QUEUE_V2';
    const CACHE_MACHINE_ID_KEY = 'SCHOOL_SYSTEM_CACHE_MACHINE_ID_V1';
    const CACHE_READY_KEY = 'SCHOOL_SYSTEM_LOCAL_CACHE_READY_V1';
    const COHORT_EXAM_META_CACHE_MS = 2 * 60 * 1000;
    const COHORT_EXAM_META_PAGE_SIZE = 120;
    const COHORT_EXAM_LATEST_META_LIMIT = 24;

    function nowMs() {
        return window.performance && typeof window.performance.now === 'function'
            ? window.performance.now()
            : Date.now();
    }

    function shouldLogPerf(durationMs) {
        if (durationMs >= 250) return true;
        try {
            return window.localStorage && window.localStorage.getItem('SCHOOL_SYSTEM_PERF') === 'true';
        } catch (_) {
            return false;
        }
    }

    function rememberWorkspacePerf(name, startedAt, detail = {}) {
        const durationMs = Math.round((nowMs() - startedAt) * 10) / 10;
        const entry = {
            name,
            durationMs,
            at: new Date().toISOString(),
            ...detail
        };
        if (Array.isArray(window.__SCHOOL_PERF_TIMINGS__)) {
            window.__SCHOOL_PERF_TIMINGS__.push(entry);
            while (window.__SCHOOL_PERF_TIMINGS__.length > 120) window.__SCHOOL_PERF_TIMINGS__.shift();
        } else {
            window.__SCHOOL_PERF_TIMINGS__ = [entry];
        }
        if (shouldLogPerf(durationMs)) {
            console.info('[school-perf]', entry);
        }
        return entry;
    }
    const STUDENT_HISTORY_INDEX_PREFIX = 'STUDENT_HISTORY_V1';
    const storedJsonCache = new Map();

    if (!window.__CLOUD_WORKSPACE_STORAGE_CACHE_BOUND__) {
        window.__CLOUD_WORKSPACE_STORAGE_CACHE_BOUND__ = true;
        window.addEventListener('storage', (event) => {
            const key = String(event?.key || '');
            if (key === WORKSPACE_SYNC_QUEUE_KEY || key.startsWith(WORKSPACE_SYNC_META_PREFIX)) {
                storedJsonCache.delete(key);
            }
        });
    }

    function hashText(text) {
        const raw = String(text || '');
        let hash = 2166136261;
        for (let i = 0; i < raw.length; i++) {
            hash ^= raw.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return `ws_${(hash >>> 0).toString(16)}`;
    }

    function normalizeStudentHistoryText(value) {
        return String(value || '').trim().replace(/\s+/g, '');
    }

    function normalizeStudentHistoryClass(value) {
        return String(value || '').trim().replace(/[班级\(\)\.\-gradeclass]/gi, '').replace(/\s+/g, '');
    }

    function getStudentHistoryIdentity(row = {}) {
        const school = normalizeStudentHistoryText(row.school);
        const className = normalizeStudentHistoryClass(row.class);
        const id = normalizeStudentHistoryText(row.id || row.examNo || row.uuid);
        const name = normalizeStudentHistoryText(row.name);
        return [school, className, id, name].join('|');
    }

    function getStudentHistoryIndexKey(cohortId, examId, row) {
        const cohort = normalizeCohortId(cohortId || examId);
        const exactExamId = String(examId || '').trim();
        const identity = getStudentHistoryIdentity(row);
        if (!cohort || !exactExamId || !identity.replace(/\|/g, '')) return '';
        return [
            STUDENT_HISTORY_INDEX_PREFIX,
            cohort,
            hashText(identity),
            hashText(exactExamId)
        ].join('_');
    }

    function clonePayloadFragment(value) {
        if (value == null) return value;
        return JSON.parse(JSON.stringify(value));
    }

    const WORKSPACE_SPLIT_VERSION = 'workspace-split-v1';
    const WORKSPACE_META_ONLY_FIELDS = new Set([
        'RAW_DATA',
        'SCHOOLS',
        'PREV_DATA',
        'PROGRESS_CACHE',
        'PROGRESS_CACHE_FULL',
        'LAST_VA_DATA',
        'CURRENT_REPORT_STUDENT',
        'CURRENT_CONTEXT_STUDENTS',
        'TEACHER_STATS'
    ]);

    function isSplitWorkspacePayload(payload) {
        return payload && typeof payload === 'object'
            && payload.__CLOUD_WORKSPACE_SPLIT_VERSION === WORKSPACE_SPLIT_VERSION;
    }

    function getCurrentExamIdFromPayload(payload) {
        return String(payload?.CURRENT_EXAM_ID || payload?.COHORT_DB?.currentExamId || '').trim();
    }

    function compactExamMetadata(examId, examPayload = {}) {
        const next = {};
        Object.entries(examPayload && typeof examPayload === 'object' ? examPayload : {}).forEach(([field, value]) => {
            if (field === 'data' || field === 'schools' || field === 'teacherMap') return;
            next[field] = clonePayloadFragment(value);
        });
        next.examId = String(next.examId || examId || '').trim();
        const rowCount = Array.isArray(examPayload?.data) ? examPayload.data.length : Number(examPayload?.rowCount || 0);
        if (rowCount) next.rowCount = rowCount;
        return next;
    }

    function buildCurrentExamEntry(payload, examId) {
        const rows = Array.isArray(payload?.RAW_DATA) ? payload.RAW_DATA : [];
        if (!examId || !rows.length) return null;
        const existing = payload?.COHORT_DB?.exams?.[examId] || {};
        return {
            ...clonePayloadFragment(existing),
            examId,
            examLabel: existing.examLabel || deriveExamLabel(examId),
            meta: clonePayloadFragment(existing.meta || payload?.ARCHIVE_META || payload?.CONFIG || {}),
            data: clonePayloadFragment(rows),
            schools: clonePayloadFragment(existing.schools || payload?.SCHOOLS || {}),
            teacherMap: clonePayloadFragment(existing.teacherMap || payload?.TEACHER_MAP || {}),
            subjects: clonePayloadFragment(existing.subjects || payload?.SUBJECTS || []),
            thresholds: clonePayloadFragment(existing.thresholds || payload?.THRESHOLDS || {}),
            config: clonePayloadFragment(existing.config || payload?.CONFIG || {}),
            fingerprint: String(existing.fingerprint || payload?.FINGERPRINT || '').trim(),
            updatedAt: existing.updatedAt || ''
        };
    }

    function buildWorkspaceMetaPayload(payload, workspaceKey) {
        const source = clonePayloadFragment(payload || {});
        Object.keys(source).forEach((field) => {
            if (WORKSPACE_META_ONLY_FIELDS.has(field)) delete source[field];
        });

        const currentExamId = getCurrentExamIdFromPayload(payload);
        const cohortDb = source.COHORT_DB && typeof source.COHORT_DB === 'object' ? source.COHORT_DB : {};
        const sourceExams = payload?.COHORT_DB?.exams && typeof payload.COHORT_DB.exams === 'object'
            ? payload.COHORT_DB.exams
            : {};
        const exams = {};
        Object.entries(sourceExams).forEach(([examId, examPayload]) => {
            const exactExamId = String(examId || '').trim();
            if (!exactExamId || isIgnoredExamKey(exactExamId)) return;
            exams[exactExamId] = compactExamMetadata(exactExamId, examPayload);
        });

        const currentEntry = buildCurrentExamEntry(payload, currentExamId);
        if (currentEntry) exams[currentExamId] = compactExamMetadata(currentExamId, currentEntry);

        source.COHORT_DB = {
            ...cohortDb,
            exams,
            currentExamId: currentExamId || cohortDb.currentExamId || ''
        };
        source.CURRENT_PROJECT_KEY = String(source.CURRENT_PROJECT_KEY || workspaceKey || '').trim();
        source.CURRENT_EXAM_ID = currentExamId || source.COHORT_DB.currentExamId || '';
        source.__CLOUD_WORKSPACE_SPLIT_VERSION = WORKSPACE_SPLIT_VERSION;
        source.__CURRENT_EXAM_KEY = source.CURRENT_EXAM_ID;
        source.__EXAM_KEYS = Object.keys(exams);
        source.__META_UPDATED_AT = new Date().toISOString();
        return source;
    }

    function buildExamShardPayload(payload, examId, examPayload) {
        const exactExamId = String(examId || '').trim();
        if (!exactExamId || isIgnoredExamKey(exactExamId)) return null;
        const exam = examPayload && typeof examPayload === 'object' ? examPayload : {};
        const rows = Array.isArray(exam.data) && exam.data.length
            ? exam.data
            : (exactExamId === getCurrentExamIdFromPayload(payload) && Array.isArray(payload?.RAW_DATA) ? payload.RAW_DATA : []);
        if (!rows.length) return null;

        const shard = {
            CURRENT_PROJECT_KEY: payload?.CURRENT_PROJECT_KEY || '',
            CURRENT_COHORT_ID: payload?.CURRENT_COHORT_ID || '',
            CURRENT_COHORT_META: clonePayloadFragment(payload?.CURRENT_COHORT_META || null),
            CURRENT_EXAM_ID: exactExamId,
            CURRENT_TERM_ID: payload?.CURRENT_TERM_ID || '',
            CURRENT_TEACHER_TERM_ID: payload?.CURRENT_TEACHER_TERM_ID || '',
            ARCHIVE_META: clonePayloadFragment(exam.meta || payload?.ARCHIVE_META || payload?.CONFIG || {}),
            ARCHIVE_LOCKED: payload?.ARCHIVE_LOCKED || '',
            ARCHIVE_LOCKED_KEY: payload?.ARCHIVE_LOCKED_KEY || '',
            RAW_DATA: clonePayloadFragment(rows),
            SCHOOLS: clonePayloadFragment(exam.schools || (exactExamId === getCurrentExamIdFromPayload(payload) ? payload?.SCHOOLS : {}) || {}),
            SUBJECTS: clonePayloadFragment(exam.subjects || payload?.SUBJECTS || []),
            THRESHOLDS: clonePayloadFragment(exam.thresholds || payload?.THRESHOLDS || {}),
            TEACHER_MAP: clonePayloadFragment(exam.teacherMap || payload?.TEACHER_MAP || {}),
            TEACHER_SCHOOL_MAP: clonePayloadFragment(payload?.TEACHER_SCHOOL_MAP || {}),
            CONFIG: clonePayloadFragment(exam.config || payload?.CONFIG || {}),
            MY_SCHOOL: payload?.MY_SCHOOL || '',
            TARGETS: clonePayloadFragment(payload?.TARGETS || {}),
            INDICATOR_PARAMS: clonePayloadFragment(payload?.INDICATOR_PARAMS || {}),
            SCHOOL_ALIAS_SETTINGS: clonePayloadFragment(payload?.SCHOOL_ALIAS_SETTINGS || []),
            FINGERPRINT: String(exam.fingerprint || payload?.FINGERPRINT || '').trim(),
            timestamp: Number(exam.createdAt || payload?.timestamp || Date.now()),
            COHORT_DB: {
                cohortId: payload?.COHORT_DB?.cohortId || payload?.CURRENT_COHORT_ID || '',
                cohortMeta: clonePayloadFragment(payload?.COHORT_DB?.cohortMeta || payload?.CURRENT_COHORT_META || null),
                students: clonePayloadFragment(payload?.COHORT_DB?.students || {}),
                teachingHistory: clonePayloadFragment(payload?.COHORT_DB?.teachingHistory || {}),
                exams: {
                    [exactExamId]: {
                        ...clonePayloadFragment(exam),
                        examId: exactExamId,
                        examLabel: exam.examLabel || deriveExamLabel(exactExamId),
                        data: clonePayloadFragment(rows),
                        schools: clonePayloadFragment(exam.schools || {}),
                        subjects: clonePayloadFragment(exam.subjects || payload?.SUBJECTS || []),
                        thresholds: clonePayloadFragment(exam.thresholds || payload?.THRESHOLDS || {}),
                        config: clonePayloadFragment(exam.config || payload?.CONFIG || {}),
                        teacherMap: clonePayloadFragment(exam.teacherMap || payload?.TEACHER_MAP || {}),
                        fingerprint: String(exam.fingerprint || payload?.FINGERPRINT || '').trim()
                    }
                },
                currentExamId: exactExamId,
                resetPoints: clonePayloadFragment(payload?.COHORT_DB?.resetPoints || [])
            }
        };
        return shard;
    }

    function buildRankFallbackBySubject(rows, subject) {
        const subjectKey = String(subject || 'total');
        const readValue = (row) => {
            if (subjectKey === 'total') return Number(row?.total);
            const value = row?.scores && Object.prototype.hasOwnProperty.call(row.scores, subjectKey)
                ? Number(row.scores[subjectKey])
                : NaN;
            return value;
        };
        const scoreCounts = new Map();
        (Array.isArray(rows) ? rows : []).forEach((row) => {
            const value = readValue(row);
            if (!Number.isFinite(value)) return;
            scoreCounts.set(value, (scoreCounts.get(value) || 0) + 1);
        });
        const rankByScore = new Map();
        let seen = 0;
        Array.from(scoreCounts.keys()).sort((a, b) => b - a).forEach((value) => {
            rankByScore.set(value, seen + 1);
            seen += scoreCounts.get(value) || 0;
        });
        return { readValue, rankByScore };
    }

    function buildStudentHistoryIndexRowsForExam(payload, examId, shard, syncedAt) {
        const examPayload = shard && typeof shard === 'object' ? shard : {};
        const rows = Array.isArray(examPayload.RAW_DATA) ? examPayload.RAW_DATA : [];
        const exactExamId = String(examId || examPayload.CURRENT_EXAM_ID || '').trim();
        if (!exactExamId || !rows.length) return [];

        const cohortId = normalizeCohortId(examPayload.CURRENT_COHORT_ID || payload?.CURRENT_COHORT_ID || exactExamId);
        const subjects = Array.isArray(examPayload.SUBJECTS) && examPayload.SUBJECTS.length
            ? examPayload.SUBJECTS.map(subject => String(subject || '').trim()).filter(Boolean)
            : Array.from(new Set(rows.flatMap(row => Object.keys(row?.scores || {}))));
        const fallbackCache = new Map();
        const getCountyFallback = (row, subject = 'total') => {
            const subjectKey = String(subject || 'total');
            if (!fallbackCache.has(subjectKey)) {
                fallbackCache.set(subjectKey, buildRankFallbackBySubject(rows, subjectKey));
            }
            const context = fallbackCache.get(subjectKey);
            const value = context.readValue(row);
            return Number.isFinite(value) ? context.rankByScore.get(value) : undefined;
        };
        const examLabel = examPayload.ARCHIVE_META?.examName
            || examPayload.ARCHIVE_META?.name
            || examPayload.COHORT_DB?.exams?.[exactExamId]?.examLabel
            || deriveExamLabel(exactExamId)
            || exactExamId;
        const fingerprint = String(examPayload.FINGERPRINT || examPayload.COHORT_DB?.exams?.[exactExamId]?.fingerprint || '').trim();
        const updatedAt = syncedAt || new Date().toISOString();

        return rows.map((row) => {
            if (!row || typeof row !== 'object' || !String(row.name || '').trim()) return null;
            const key = getStudentHistoryIndexKey(cohortId, exactExamId, row);
            if (!key) return null;

            const subjectRanks = { ...(row.ranks || {}) };
            subjects.forEach((subject) => {
                const ranks = { ...(subjectRanks[subject] || {}) };
                if (ranks.county === undefined || ranks.county === null || ranks.county === '') {
                    const fallback = getCountyFallback(row, subject);
                    if (fallback !== undefined) ranks.county = fallback;
                }
                if (Object.keys(ranks).length) subjectRanks[subject] = ranks;
            });
            const totalRanks = { ...((subjectRanks && subjectRanks.total) || {}) };
            if (totalRanks.county === undefined || totalRanks.county === null || totalRanks.county === '') {
                const fallback = getCountyFallback(row, 'total');
                if (fallback !== undefined) totalRanks.county = fallback;
            }
            if (Object.keys(totalRanks).length) subjectRanks.total = totalRanks;

            return {
                key,
                content: packPayload({
                    __STUDENT_HISTORY_INDEX_VERSION: 1,
                    cohortId,
                    examId: exactExamId,
                    identity: getStudentHistoryIdentity(row),
                    student: {
                        school: row.school || '',
                        class: row.class || '',
                        id: row.id || row.examNo || row.uuid || '',
                        name: row.name || ''
                    },
                    entry: {
                        examId: exactExamId,
                        examFullKey: exactExamId,
                        examLabel,
                        fingerprint: fingerprint || [exactExamId, updatedAt, rows.length].join(':'),
                        total: row.total,
                        rankClass: subjectRanks.total?.class ?? row.classRank,
                        rankSchool: subjectRanks.total?.school ?? row.schoolRank,
                        rankTown: subjectRanks.total?.township ?? row.townRank,
                        rankCounty: subjectRanks.total?.county ?? row.rankCounty ?? row.countyRank,
                        subjectRanks,
                        scores: clonePayloadFragment(row.scores || {}),
                        updatedAt
                    }
                }),
                updated_at: updatedAt
            };
        }).filter(Boolean);
    }

    function buildStudentHistoryIndexRowsForBundle(payload, examRows, syncedAt) {
        const rows = [];
        (Array.isArray(examRows) ? examRows : []).forEach((examRow) => {
            if (!examRow?.shard) return;
            rows.push(...buildStudentHistoryIndexRowsForExam(payload, examRow.key, examRow.shard, syncedAt));
        });
        return rows;
    }

    function buildWorkspaceSplitUploadBundle(workspaceKey, payload) {
        const metaPayload = buildWorkspaceMetaPayload(payload, workspaceKey);
        const metaContent = packPayload(metaPayload);
        const sourceExams = payload?.COHORT_DB?.exams && typeof payload.COHORT_DB.exams === 'object'
            ? payload.COHORT_DB.exams
            : {};
        const currentExamId = getCurrentExamIdFromPayload(payload);
        const examRows = [];
        const seen = new Set();
        Object.entries(sourceExams).forEach(([examId, examPayload]) => {
            const exactExamId = String(examId || '').trim();
            if (!exactExamId || seen.has(exactExamId)) return;
            const shard = buildExamShardPayload(payload, exactExamId, examPayload);
            if (!shard) return;
            seen.add(exactExamId);
            examRows.push({ key: exactExamId, content: packPayload(shard), shard });
        });
        if (currentExamId && !seen.has(currentExamId)) {
            const shard = buildExamShardPayload(payload, currentExamId, buildCurrentExamEntry(payload, currentExamId));
            if (shard) examRows.push({ key: currentExamId, content: packPayload(shard), shard });
        }
        const contentHash = hashText([
            metaContent,
            ...examRows
                .slice()
                .sort((a, b) => a.key.localeCompare(b.key, 'zh-CN'))
                .map(row => `${row.key}:${hashText(row.content)}`)
        ].join('|'));
        return {
            mode: 'workspace-split',
            workspaceKey,
            metaPayload,
            metaContent,
            examRows,
            contentHash
        };
    }

    async function uploadWorkspaceBundle(bundle, syncedAt) {
        if (!bundle || bundle.mode !== 'workspace-split') return false;
        const historyIndexRows = buildStudentHistoryIndexRowsForBundle(bundle.metaPayload, bundle.examRows, syncedAt);
        const rows = [
            { key: bundle.workspaceKey, content: bundle.metaContent, updated_at: syncedAt },
            ...bundle.examRows.map(row => ({ key: row.key, content: row.content, updated_at: syncedAt }))
        ];
        const { error } = await upsertSystemDataRecord(rows);
        if (error) throw error;
        for (let i = 0; i < historyIndexRows.length; i += 400) {
            const chunk = historyIndexRows.slice(i, i + 400);
            const { error: indexError } = await upsertSystemDataRecord(chunk);
            if (indexError) throw indexError;
        }
        return true;
    }

    function mergeWorkspaceSplitPayload(metaPayload, examPayload, examKey) {
        const merged = clonePayloadFragment(metaPayload || {});
        delete merged.__CLOUD_WORKSPACE_SPLIT_VERSION;
        delete merged.__CURRENT_EXAM_KEY;
        delete merged.__EXAM_KEYS;
        delete merged.__META_UPDATED_AT;

        const current = examPayload && typeof examPayload === 'object' ? examPayload : {};
        [
            'RAW_DATA',
            'SCHOOLS',
            'SUBJECTS',
            'THRESHOLDS',
            'TEACHER_MAP',
            'TEACHER_SCHOOL_MAP',
            'CONFIG',
            'MY_SCHOOL',
            'TARGETS',
            'INDICATOR_PARAMS',
            'SCHOOL_ALIAS_SETTINGS',
            'FINGERPRINT',
            'ARCHIVE_META',
            'ARCHIVE_LOCKED',
            'ARCHIVE_LOCKED_KEY',
            'CURRENT_TERM_ID',
            'CURRENT_TEACHER_TERM_ID'
        ].forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(current, field)) {
                merged[field] = clonePayloadFragment(current[field]);
            }
        });

        const currentExamId = String(current.CURRENT_EXAM_ID || examKey || metaPayload?.__CURRENT_EXAM_KEY || metaPayload?.CURRENT_EXAM_ID || '').trim();
        const metaDb = merged.COHORT_DB && typeof merged.COHORT_DB === 'object' ? merged.COHORT_DB : {};
        const currentDb = current.COHORT_DB && typeof current.COHORT_DB === 'object' ? current.COHORT_DB : {};
        merged.COHORT_DB = {
            ...metaDb,
            ...currentDb,
            exams: {
                ...(metaDb.exams || {}),
                ...(currentDb.exams || {})
            },
            currentExamId: currentExamId || currentDb.currentExamId || metaDb.currentExamId || ''
        };
        merged.CURRENT_EXAM_ID = currentExamId || merged.COHORT_DB.currentExamId || '';
        return merged;
    }

    async function fetchLatestCohortExamRow(cohortId) {
        const cid = normalizeCohortId(cohortId || getCurrentCohortId());
        if (!cid) return null;
        const { data, error } = await selectSystemData({
            select: 'key,content,updated_at',
            keyLike: `${cid}%`,
            order: 'updated_at',
            ascending: false,
            limit: 8
        });
        if (error) throw error;
        return (data || []).find(row => {
            if (!row?.key || !row?.content) return false;
            if (isIgnoredExamKey(row.key)) return false;
            return extractCohortIdFromKey(row.key) === cid;
        }) || null;
    }

    async function hydrateSplitWorkspacePayload(key, metaPayload) {
        const currentExamKey = String(metaPayload?.__CURRENT_EXAM_KEY || metaPayload?.CURRENT_EXAM_ID || metaPayload?.COHORT_DB?.currentExamId || '').trim();
        let examRow = currentExamKey ? await fetchWorkspaceSnapshotRow(currentExamKey) : null;
        if (!examRow?.content) {
            examRow = await fetchLatestCohortExamRow(metaPayload?.CURRENT_COHORT_ID || getCurrentCohortId());
        }
        if (!examRow?.content) return normalizeWorkspacePayload(metaPayload);
        const examPayload = parsePayload(examRow.content);
        return normalizeWorkspacePayload(mergeWorkspaceSplitPayload(metaPayload, examPayload, examRow.key || currentExamKey || key));
    }

    function getWorkspaceMetaStorageKey(key) {
        return `${WORKSPACE_SYNC_META_PREFIX}${encodeURIComponent(String(key || '').trim())}`;
    }

    function readStoredJson(key, fallbackValue) {
        try {
            if (storedJsonCache.has(key)) {
                return cloneStoredJsonValue(storedJsonCache.get(key), fallbackValue);
            }
            const raw = localStorage.getItem(key);
            const parsed = raw ? (JSON.parse(raw) || fallbackValue) : fallbackValue;
            storedJsonCache.set(key, parsed);
            return cloneStoredJsonValue(parsed, fallbackValue);
        } catch (_) {
            storedJsonCache.delete(key);
            return fallbackValue;
        }
    }

    function writeStoredJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            storedJsonCache.set(key, value);
        } catch (_) { }
        return value;
    }

    function cloneStoredJsonValue(value, fallbackValue) {
        if (!value || typeof value !== 'object') return value || fallbackValue;
        if (Array.isArray(value)) return value.slice();
        return { ...value };
    }

    function readWorkspaceSyncMeta(key) {
        return readStoredJson(getWorkspaceMetaStorageKey(key), {});
    }

    function writeWorkspaceSyncMeta(key, patch = {}) {
        const storageKey = getWorkspaceMetaStorageKey(key);
        const next = {
            ...(readWorkspaceSyncMeta(key) || {}),
            ...(patch && typeof patch === 'object' ? patch : {})
        };
        writeStoredJson(storageKey, next);
        return next;
    }

    function readWorkspaceSyncQueue() {
        return readStoredJson(WORKSPACE_SYNC_QUEUE_KEY, {});
    }

    function writeWorkspaceSyncQueue(queue) {
        return writeStoredJson(WORKSPACE_SYNC_QUEUE_KEY, queue && typeof queue === 'object' ? queue : {});
    }

    function ensureLocalCacheProfile() {
        try {
            let machineId = localStorage.getItem(CACHE_MACHINE_ID_KEY);
            if (!machineId) {
                machineId = `machine-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
                localStorage.setItem(CACHE_MACHINE_ID_KEY, machineId);
            }
            if (!localStorage.getItem(CACHE_READY_KEY)) {
                localStorage.setItem(CACHE_READY_KEY, new Date().toISOString());
            }
            return machineId;
        } catch (_) {
            return '';
        }
    }

    function dispatchWorkspaceSyncEvent(stage, detail = {}) {
        if (typeof window.CustomEvent !== 'function') return;
        window.dispatchEvent(new CustomEvent('cloud-sync-state', {
            detail: {
                stage,
                ...(detail && typeof detail === 'object' ? detail : {})
            }
        }));
    }

    async function readCachedWorkspaceSnapshot(key) {
        ensureLocalCacheProfile();
        if (!(window.idbKeyval && typeof window.idbKeyval.get === 'function')) return null;
        try {
            const cached = await window.idbKeyval.get(`cache_${key}`);
            return cached && typeof cached === 'object' ? cached : null;
        } catch (error) {
            console.warn('[CloudSync] read cache failed:', error);
            return null;
        }
    }

    async function writeCachedWorkspaceSnapshot(key, payload) {
        const machineId = ensureLocalCacheProfile();
        if (!(window.idbKeyval && typeof window.idbKeyval.set === 'function')) return false;
        try {
            await window.idbKeyval.set(`cache_${key}`, payload);
            if (machineId) {
                await window.idbKeyval.set(`cache_meta_${key}`, {
                    machineId,
                    key,
                    updatedAt: new Date().toISOString()
                });
            }
            return true;
        } catch (error) {
            console.warn('[CloudSync] write cache failed:', error);
            return false;
        }
    }

    function buildWorkspaceApplySignature(key, payload, updatedAt = '', meta = {}) {
        const source = payload && typeof payload === 'object' ? payload : {};
        const fingerprint = String(source.FINGERPRINT || '').trim();
        const contentHash = String(meta.contentHash || meta.lastUploadedHash || '').trim();
        const remoteAt = String(updatedAt || meta.remoteUpdatedAt || meta.lastSyncedAt || meta.lastLocalSaveAt || '').trim();
        const examId = String(source.CURRENT_EXAM_ID || meta.currentExamId || '').trim();
        const rowCount = Array.isArray(source.RAW_DATA) ? source.RAW_DATA.length : 0;
        const cohortId = normalizeCohortId(source.CURRENT_COHORT_ID || getCurrentCohortId());
        return [
            String(key || '').trim(),
            cohortId,
            examId,
            contentHash,
            fingerprint,
            remoteAt,
            rowCount
        ].join('|');
    }

    function markWorkspaceSnapshotApplied(signature) {
        const text = String(signature || '').trim();
        if (text) window.__CLOUD_WORKSPACE_APPLIED_SIGNATURE__ = text;
    }

    function isWorkspaceSnapshotAlreadyApplied(signature) {
        const text = String(signature || '').trim();
        if (!text || window.__CLOUD_WORKSPACE_APPLIED_SIGNATURE__ !== text) return false;
        return Array.isArray(window.RAW_DATA) && window.RAW_DATA.length > 0;
    }

    async function applyCachedWorkspaceSnapshot(key, payload, updatedAt = '') {
        if (!payload || typeof payload !== 'object') return false;
        let normalizedPayload = isSplitWorkspacePayload(payload)
            ? await hydrateSplitWorkspacePayload(key, payload)
            : normalizeWorkspacePayload(payload);
        normalizedPayload = await supplementIndicatorPayload(key, normalizedPayload);
        const meta = readWorkspaceSyncMeta(key);
        const signature = buildWorkspaceApplySignature(key, normalizedPayload, updatedAt, meta);
        if (isWorkspaceSnapshotAlreadyApplied(signature)) return true;
        syncWorkspaceState({
            currentProjectKey: key,
            currentExamId: normalizedPayload?.CURRENT_EXAM_ID || ''
        });
        seedCurrentExamToCohortDb(normalizedPayload, key, updatedAt);
        if (typeof applySnapshotPayload === 'function') applySnapshotPayload(normalizedPayload);
        await writeCachedWorkspaceSnapshot(key, normalizedPayload);
        await refreshCompareSelectors();
        markWorkspaceSnapshotApplied(signature);
        return true;
    }

    async function fetchWorkspaceSnapshotMeta(key) {
        const { data, error } = await selectSystemData({
            select: 'updated_at',
            keyEq: key,
            maybeSingle: true
        });
        if (error) throw error;
        return data || null;
    }

    async function fetchWorkspaceSnapshotRow(key) {
        const exactKey = String(key || '').trim();
        const { data, error } = await selectSystemData({
            select: 'content,updated_at',
            keyEq: exactKey,
            maybeSingle: true
        });
        if (error) throw error;
        if (data) return data;

        const { data: fallbackRows, error: fallbackError } = await selectSystemData({
            select: 'key,content,updated_at',
            keyIn: [exactKey],
            limit: 1
        });
        if (fallbackError) throw fallbackError;
        return (fallbackRows || [])[0] || null;
    }

    function queueWorkspaceSyncJob(key, job = {}) {
        const queue = readWorkspaceSyncQueue();
        queue[key] = {
            ...(queue[key] || {}),
            key,
            ...(job && typeof job === 'object' ? job : {})
        };
        writeWorkspaceSyncQueue(queue);
        dispatchWorkspaceSyncEvent('queued', queue[key]);
        return queue[key];
    }

    function scheduleBackgroundQueueFlush(manager) {
        if (!manager || manager._workspaceSyncFlushScheduled) return;
        manager._workspaceSyncFlushScheduled = true;
        scheduleBackgroundCloudTask(() => {
            manager._workspaceSyncFlushScheduled = false;
            manager.flushWorkspaceSyncQueue().catch((error) => {
                console.warn('[CloudSync] background flush failed:', error);
            });
        }, 4500, 12000);
    }

    function markFullCloudSyncComplete(syncedAt = '', message = '') {
        const stamp = String(syncedAt || '').trim() || new Date().toISOString();
        localStorage.setItem('CLOUD_SYNC_AT', stamp);
        if (message && typeof logAction === 'function') logAction('云端同步', message);
        if (typeof updateStatusPanel === 'function') updateStatusPanel();
        return stamp;
    }

    function scheduleWorkspaceRemoteRefresh(manager, key, cachedMeta = {}) {
        const normalizedKey = String(key || '').trim();
        if (!normalizedKey) return;
        manager._workspaceRefreshTasks = manager._workspaceRefreshTasks || {};
        if (manager._workspaceRefreshTasks[normalizedKey]) return;

        manager._workspaceRefreshTasks[normalizedKey] = (async () => {
            if (!(await manager.ensureClientReady({ silent: true, timeoutMs: 3500 }))) return false;
            const remoteMeta = await fetchWorkspaceSnapshotMeta(normalizedKey);
            const remoteTs = Date.parse(String(remoteMeta?.updated_at || '')) || 0;
            const localTs = Date.parse(String(cachedMeta.remoteUpdatedAt || cachedMeta.lastSyncedAt || '')) || 0;
            if (!remoteMeta?.updated_at || remoteTs <= localTs + 1000) return false;
            const row = await fetchWorkspaceSnapshotRow(normalizedKey);
            return fetchAndApplyWorkspaceSnapshot(manager, normalizedKey, row);
        })()
            .catch((error) => {
                console.warn('[CloudLoad] background remote refresh failed:', error);
                return false;
            })
            .finally(() => {
                delete manager._workspaceRefreshTasks[normalizedKey];
            });
    }

    async function fetchAndApplyWorkspaceSnapshot(manager, key, row) {
        const snapshotRow = row && typeof row === 'object' ? row : await fetchWorkspaceSnapshotRow(key);
        if (!snapshotRow || !snapshotRow.content) return false;

        let payload = parsePayload(snapshotRow.content);
        payload = isSplitWorkspacePayload(payload)
            ? await hydrateSplitWorkspacePayload(key, payload)
            : normalizeWorkspacePayload(payload);
        payload = await supplementIndicatorPayload(key, payload);

        seedCurrentExamToCohortDb(payload, key, snapshotRow.updated_at || '');
        if (typeof applySnapshotPayload === 'function') applySnapshotPayload(payload);

        const contentHash = hashText(snapshotRow.content);
        const cohortId = normalizeCohortId(payload?.CURRENT_COHORT_ID || getCurrentCohortId());

        await writeCachedWorkspaceSnapshot(key, payload);
        writeWorkspaceSyncMeta(key, {
            contentHash,
            lastUploadedHash: contentHash,
            remoteUpdatedAt: snapshotRow.updated_at || '',
            lastSyncedAt: snapshotRow.updated_at || '',
            pendingCloudSync: false,
            pendingSyncSource: '',
            lastCloudError: '',
            currentProjectKey: key,
            currentExamId: payload?.CURRENT_EXAM_ID || ''
        });

        syncWorkspaceState({
            currentProjectKey: key,
            currentExamId: payload?.CURRENT_EXAM_ID || ''
        });
        localStorage.setItem('CLOUD_SYNC_AT', snapshotRow.updated_at || new Date().toISOString());
        markWorkspaceSnapshotApplied(buildWorkspaceApplySignature(key, payload, snapshotRow.updated_at || '', {
            contentHash,
            remoteUpdatedAt: snapshotRow.updated_at || '',
            currentExamId: payload?.CURRENT_EXAM_ID || ''
        }));

        await refreshCompareSelectors();
        if (cohortId && typeof manager.fetchCohortExamsToLocal === 'function') {
            manager.fetchCohortExamsToLocal(cohortId, { background: true }).catch((syncError) => {
                console.warn('[CloudExams] background sync failed:', syncError);
            });
        }
        return true;
    }

    Object.assign(CloudManager, {
        save: async function (options = {}) {
            if (!(await this.ensureClientReady())) return false;
            setCloudStatus('syncing', '保存中');

            const role = getCurrentUserRole();
            if (!['admin', 'director', 'grade_director'].includes(role)) {
                safeToast('权限不足', 'warning');
                return false;
            }

            const mode = options?.mode === 'exam' ? 'exam' : 'workspace';
            const key = mode === 'exam'
                ? this.getKey()
                : (getWorkspaceSnapshotKey() || this.getKey());
            if (!key) {
                alert(mode === 'exam' ? '请先完善考试信息' : '请先选择届别');
                return false;
            }

            safeLoading(true, '正在同步云端数据...');
            try {
                const ind1 = document.getElementById('dm_ind1_input');
                const ind2 = document.getElementById('dm_ind2_input');
                if (typeof window.ensureSupportSysVars === 'function') window.ensureSupportSysVars();
                if (typeof window.setIndicatorState === 'function') {
                    const currentIndicator = typeof window.readIndicatorState === 'function'
                        ? window.readIndicatorState()
                        : { ind1: '', ind2: '' };
                    window.setIndicatorState({
                        ind1: ind1 ? ind1.value : currentIndicator.ind1,
                        ind2: ind2 ? ind2.value : currentIndicator.ind2
                    });
                }
                if (typeof window.setTargetsState === 'function') {
                    window.setTargetsState((typeof ensureNormalizedTargets === 'function') ? ensureNormalizedTargets() : (window.TARGETS || {}));
                }
                if (typeof window.setSchoolAliasState === 'function') {
                    window.setSchoolAliasState((typeof ensureSchoolAliasStore === 'function') ? ensureSchoolAliasStore() : (typeof window.readSchoolAliasState === 'function' ? window.readSchoolAliasState() : []));
                }

                const payload = typeof getCurrentSnapshotPayload === 'function' ? getCurrentSnapshotPayload() : {};
                if (mode === 'workspace') normalizeWorkspacePayload(payload);
                const content = packPayload(payload);
                const nowIso = new Date().toISOString();
                const currentExamId = getCurrentExamIdFromPayload(payload);
                const legacyShard = mode === 'exam' && currentExamId
                    ? buildExamShardPayload(payload, currentExamId, buildCurrentExamEntry(payload, currentExamId))
                    : null;
                const legacyHistoryIndexRows = legacyShard
                    ? buildStudentHistoryIndexRowsForExam(payload, currentExamId, legacyShard, nowIso)
                    : [];

                const { error } = await upsertSystemDataRecord({
                    key,
                    content,
                    updated_at: nowIso
                });
                if (error) throw error;
                if (legacyHistoryIndexRows.length) {
                    for (let i = 0; i < legacyHistoryIndexRows.length; i += 400) {
                        const chunk = legacyHistoryIndexRows.slice(i, i + 400);
                        const { error: indexError } = await upsertSystemDataRecord(chunk);
                        if (indexError) throw indexError;
                    }
                }

                if (mode === 'workspace') {
                    syncWorkspaceState({
                        currentProjectKey: key,
                        currentExamId: payload?.CURRENT_EXAM_ID || ''
                    });
                }
                localStorage.setItem('CLOUD_SYNC_AT', new Date().toISOString());
                if (window.idbKeyval) await idbKeyval.set(`cache_${key}`, payload);
                if (typeof logAction === 'function') logAction('云端同步', `全量数据已同步：${key}`);
                if (typeof updateStatusPanel === 'function') updateStatusPanel();
                safeToast('云端同步成功', 'success');
                setCloudStatus('success', '已保存');
                return true;
            } catch (e) {
                console.error('Cloud save error:', e);
                alert(`同步失败: ${e.message || e}`);
                setCloudStatus('error', e?.message ? String(e.message).slice(0, 24) : '保存失败');
                return false;
            } finally {
                safeLoading(false);
            }
        },

        load: async function () {
            if (!(await this.ensureClientReady())) return false;
            setCloudStatus('syncing', '拉取中');

            let key = getWorkspaceSnapshotKey() || getCurrentProjectKey() || this.getKey();
            try {
                key = await resolveCloudSnapshotKey(key);
                if (key) syncWorkspaceState({ currentProjectKey: key });
            } catch (e) {
                logCloudRuntimeIssue('Cloud load key lookup error:', e);
                setCloudStatus('error', e?.message ? String(e.message).slice(0, 24) : '加载失败');
                return false;
            }

            if (!key) return false;

            safeToast('正在检查云端数据...', 'info');
            try {
                const { data, error } = await selectSystemData({
                    select: 'content,updated_at',
                    keyEq: key,
                    maybeSingle: true
                });
                if (error) throw error;
                if (!data) return false;

                let payload = parsePayload(data.content);
                payload = normalizeWorkspacePayload(payload);
                payload = await supplementIndicatorPayload(key, payload);
                seedCurrentExamToCohortDb(payload, key, data.updated_at);
                if (typeof applySnapshotPayload === 'function') applySnapshotPayload(payload);
                const cohortId = normalizeCohortId(payload?.CURRENT_COHORT_ID || getCurrentCohortId());
                await refreshCompareSelectors();
                if (cohortId && typeof this.fetchCohortExamsToLocal === 'function') {
                    this.fetchCohortExamsToLocal(cohortId, { background: true }).catch((syncError) => {
                        console.warn('[CloudExams] background sync failed:', syncError);
                    });
                }
                if (typeof logAction === 'function') logAction('云端加载', `已加载全量数据：${key}`);
                safeToast('数据已同步到本地', 'success');
                setCloudStatus('success', '已拉取');
                return true;
            } catch (e) {
                logCloudRuntimeIssue('Cloud load error:', e);
                safeToast('加载失败', 'error');
                setCloudStatus('error', e?.message ? String(e.message).slice(0, 24) : '拉取失败');
                return false;
            }
        },

        fetchCohortExamsToLocal: async function (cohortId, options = {}) {
            const cid = normalizeCohortId(cohortId || getCurrentCohortId());
            if (!cid) return { success: false, message: '无法确定届别' };
            const hasSessionUser = !!(window.AuthState && typeof window.AuthState.hasActiveSession === 'function'
                ? window.AuthState.hasActiveSession(window.Auth && Auth.currentUser)
                : (window.Auth && Auth.currentUser));
            if (!hasSessionUser && !options.force) {
                return { success: false, skipped: true, message: '未登录，跳过自动拉取' };
            }
            if (!this._cohortExamSyncTasks) this._cohortExamSyncTasks = {};
            if (!this._cohortExamSyncTaskOptions) this._cohortExamSyncTaskOptions = {};
            const forceSync = Boolean(options.force);
            const minCount = Math.max(1, Number(options.minCount || 2));
            const latestOnly = options.latestOnly === true || Number(options.maxFetch || 0) === 1;
            if (this._cohortExamSyncTasks[cid]) {
                const activeOptions = this._cohortExamSyncTaskOptions[cid] || {};
                const activeMinCount = Math.max(1, Number(activeOptions.minCount || 2));
                const activeLatestOnly = activeOptions.latestOnly === true || Number(activeOptions.maxFetch || 0) === 1;
                const needsUpgrade = !forceSync
                    && (minCount > activeMinCount || (activeLatestOnly && !latestOnly));
                if (!needsUpgrade) return this._cohortExamSyncTasks[cid];
                return this._cohortExamSyncTasks[cid].then(() => this.fetchCohortExamsToLocal(cid, {
                    ...options,
                    latestOnly: false,
                    maxFetch: undefined,
                    minCount
                }));
            }
            this._cohortExamSyncTaskOptions[cid] = { ...options, minCount, latestOnly };

            this._cohortExamSyncTasks[cid] = (async () => {
                if (!(await this.ensureClientReady())) return { success: false, message: '云端未连接' };
                setCloudStatus('syncing', '拉取考试');
                if (typeof CohortDB === 'undefined' || typeof CohortDB.ensure !== 'function') {
                    return { success: false, message: 'CohortDB 未初始化' };
                }

                const db = CohortDB.ensure();
                db.exams = db.exams || {};
                const cacheKey = getCohortSyncCacheKey(cid);
                const shouldRefreshSelectors = options.refreshSelectors !== false;
                const lastSyncAt = Number(localStorage.getItem(cacheKey) || 0);
                const localExamCount = countCachedCohortExams(db, cid);

                if (!forceSync && localExamCount >= minCount && lastSyncAt && (Date.now() - lastSyncAt) < AUTO_COHORT_SYNC_COOLDOWN_MS) {
                    if (shouldRefreshSelectors) await refreshCompareSelectors();
                    markFullCloudSyncComplete(new Date(lastSyncAt).toISOString());
                    setCloudStatus('success', '使用缓存');
                    return { success: true, count: localExamCount, updated: 0, cached: true };
                }

                try {
                    const chunkSize = 10;
                    const candidates = await fetchCohortExamMetaRows(this, cid, {
                        force: forceSync,
                        latestOnly,
                        minCount
                    });

                    const keysToFetch = [];
                    for (const row of candidates) {
                        const remoteTs = new Date(row.updated_at).getTime() || 0;
                        const localTs = db.exams[row.key] ? Math.max(new Date(db.exams[row.key].updatedAt || 0).getTime(), Number(db.exams[row.key].createdAt || 0)) : 0;
                        if (!db.exams[row.key] || remoteTs > localTs + 1000) {
                            keysToFetch.push(row.key);
                        }
                    }

                    if (keysToFetch.length === 0 && localExamCount < minCount && candidates.length > 0) {
                        keysToFetch.push(candidates[candidates.length - 1].key);
                    }

                    if (latestOnly && keysToFetch.length > 1) {
                        const candidateByKey = new Map(candidates.map(row => [row.key, row]));
                        keysToFetch.sort((left, right) => {
                            const leftRow = candidateByKey.get(left) || {};
                            const rightRow = candidateByKey.get(right) || {};
                            return getExamKeyRecencyScore(right, rightRow.updated_at) - getExamKeyRecencyScore(left, leftRow.updated_at);
                        });
                        keysToFetch.length = 1;
                    }

                    if (keysToFetch.length === 0) {
                        const syncedAt = new Date().toISOString();
                        localStorage.setItem(cacheKey, String(Date.now()));
                        if (shouldRefreshSelectors) await refreshCompareSelectors();
                        markFullCloudSyncComplete(syncedAt, `全量考试已检查：${cid}`);
                        setCloudStatus('success', '已最新');
                        return { success: true, count: candidates.length, updated: 0 };
                    }

                    const rowMap = new Map();
                    for (let i = 0; i < keysToFetch.length; i += chunkSize) {
                        const chunk = keysToFetch.slice(i, i + chunkSize);
                        const { data: chunkRows, error: chunkErr } = await selectSystemData({
                            select: 'key,content,updated_at',
                            keyIn: chunk
                        });
                        if (chunkErr) throw chunkErr;
                        (chunkRows || []).forEach(r => rowMap.set(r.key, r));
                    }

                    let loadedCount = 0;
                    for (const key of keysToFetch) {
                        const row = rowMap.get(key);
                        if (!row) continue;
                        try {
                            const payload = parsePayload(row.content);
                            if (!payload) continue;
                            loadedCount += upsertCloudExamSnapshot(db, row.key, payload, row.updated_at, deriveExamLabel(row.key));
                            loadedCount += hydrateBundledCohortExams(db, payload, row.updated_at);
                        } catch (rowErr) {
                            console.warn('[CloudExams] parse row failed:', rowErr);
                        }
                    }

                    window.COHORT_DB = db;
                    const syncedAt = new Date().toISOString();
                    localStorage.setItem(cacheKey, String(Date.now()));
                    if (shouldRefreshSelectors) await refreshCompareSelectors();
                    markFullCloudSyncComplete(syncedAt, `全量考试已同步：${cid}，更新 ${loadedCount} 期`);

                    if (loadedCount > 0) safeToast(`已从云端加载 ${loadedCount} 期历史考试`, 'success');
                    setCloudStatus('success', loadedCount > 0 ? `更新${loadedCount}期` : '已最新');
                    return { success: true, count: candidates.length, updated: loadedCount };
                } catch (e) {
                    logCloudRuntimeIssue('[CloudExams] failed:', e);
                    setCloudStatus('error', '考试拉取失败');
                    return { success: false, message: e.message || String(e) };
                }
            })().finally(() => {
                delete this._cohortExamSyncTasks[cid];
                delete this._cohortExamSyncTaskOptions[cid];
            });

            return this._cohortExamSyncTasks[cid];
        },

        fetchAllCohortExams: async function (options = {}) {
            const hasSessionUser = !!(window.AuthState && typeof window.AuthState.hasActiveSession === 'function'
                ? window.AuthState.hasActiveSession(window.Auth && Auth.currentUser)
                : (window.Auth && Auth.currentUser));
            if (!hasSessionUser && !options.force) {
                return { success: false, skipped: true, message: '未登录，跳过自动拉取' };
            }
            const cid = normalizeCohortId(getCurrentCohortId());
            if (!cid) return;
            return this.fetchCohortExamsToLocal(cid, options);
        }
    });

    CloudManager.save = async function (options = {}) {
        const opts = options && typeof options === 'object' ? { ...options } : {};
        const background = Boolean(opts.background);
        const sourceLabel = String(opts.sourceLabel || '').trim() || (opts.mode === 'exam' ? 'exam-save' : 'workspace-save');

        const role = getCurrentUserRole();
        if (!['admin', 'director', 'grade_director'].includes(role)) {
            safeToast('权限不足', 'warning');
            return false;
        }

        const mode = opts.mode === 'exam' ? 'exam' : 'workspace';
        const key = mode === 'exam'
            ? this.getKey()
            : (getWorkspaceSnapshotKey() || this.getKey());
        if (!key) {
            alert(mode === 'exam' ? '请先完善考试信息' : '请先选择届别');
            return false;
        }

        try {
            setCloudStatus('syncing', background ? '后台同步' : '保存中');

            const ind1 = document.getElementById('dm_ind1_input');
            const ind2 = document.getElementById('dm_ind2_input');
            if (typeof window.ensureSupportSysVars === 'function') window.ensureSupportSysVars();
            if (typeof window.setIndicatorState === 'function') {
                const currentIndicator = typeof window.readIndicatorState === 'function'
                    ? window.readIndicatorState()
                    : { ind1: '', ind2: '' };
                window.setIndicatorState({
                    ind1: ind1 ? ind1.value : currentIndicator.ind1,
                    ind2: ind2 ? ind2.value : currentIndicator.ind2
                });
            }
            if (typeof window.setTargetsState === 'function') {
                window.setTargetsState((typeof ensureNormalizedTargets === 'function') ? ensureNormalizedTargets() : (window.TARGETS || {}));
            }
            if (typeof window.setSchoolAliasState === 'function') {
                window.setSchoolAliasState((typeof ensureSchoolAliasStore === 'function')
                    ? ensureSchoolAliasStore()
                    : (typeof window.readSchoolAliasState === 'function' ? window.readSchoolAliasState() : []));
            }

            const payload = typeof getCurrentSnapshotPayload === 'function' ? getCurrentSnapshotPayload() : {};
            if (mode === 'workspace') normalizeWorkspacePayload(payload);

            const nowIso = new Date().toISOString();
            const currentMeta = readWorkspaceSyncMeta(key);
            let contentHash = '';
            if (!background) {
                contentHash = mode === 'workspace'
                    ? buildWorkspaceSplitUploadBundle(key, payload).contentHash
                    : hashText(packPayload(payload));
            }

            await writeCachedWorkspaceSnapshot(key, payload);
            writeWorkspaceSyncMeta(key, {
                contentHash: contentHash || currentMeta.contentHash || '',
                pendingCloudSync: background ? true : Boolean(currentMeta.pendingCloudSync),
                pendingSyncSource: background ? sourceLabel : (currentMeta.pendingSyncSource || ''),
                currentProjectKey: key,
                currentExamId: payload?.CURRENT_EXAM_ID || '',
                lastLocalSaveAt: nowIso
            });

            if (mode === 'workspace') {
                syncWorkspaceState({
                    currentProjectKey: key,
                    currentExamId: payload?.CURRENT_EXAM_ID || ''
                });
            }

            if (!background && !opts.forceUpload && currentMeta.lastUploadedHash && currentMeta.lastUploadedHash === contentHash && !currentMeta.pendingCloudSync) {
                const syncedAt = currentMeta.lastSyncedAt || nowIso;
                writeWorkspaceSyncMeta(key, {
                    pendingCloudSync: false,
                    pendingSyncSource: '',
                    lastCloudError: '',
                    lastSyncedAt: syncedAt
                });
                dispatchWorkspaceSyncEvent('skipped', {
                    key,
                    mode,
                    sourceLabel,
                    syncedAt
                });
                if (typeof updateStatusPanel === 'function') updateStatusPanel();
                setCloudStatus('success', '已同步');
                return true;
            }

            queueWorkspaceSyncJob(key, {
                key,
                mode,
                sourceLabel,
                contentHash: contentHash || currentMeta.contentHash || '',
                queuedAt: nowIso,
                currentExamId: payload?.CURRENT_EXAM_ID || ''
            });

            if (background) {
                if (typeof updateStatusPanel === 'function') updateStatusPanel();
                scheduleBackgroundQueueFlush(this);
                return true;
            }

            const flushOk = await this.flushWorkspaceSyncQueue({ targetKey: key });
            if (!flushOk) {
                const nextMeta = readWorkspaceSyncMeta(key);
                throw new Error(nextMeta.lastCloudError || '云端同步失败');
            }

            if (typeof updateStatusPanel === 'function') updateStatusPanel();
            safeToast('云端同步成功', 'success');
            setCloudStatus('success', '已保存');
            return true;
        } catch (error) {
            console.error('Cloud save error:', error);
            if (!background) {
                alert(`同步失败: ${error?.message || error}`);
            }
            setCloudStatus('error', error?.message ? String(error.message).slice(0, 24) : '保存失败');
            return false;
        }
    };

    CloudManager.flushWorkspaceSyncQueue = async function (options = {}) {
        const opts = options && typeof options === 'object' ? { ...options } : {};
        const targetKey = String(opts.targetKey || '').trim();
        if (this._workspaceSyncFlushTask) return this._workspaceSyncFlushTask;

        this._workspaceSyncFlushTask = (async () => {
            let queue = readWorkspaceSyncQueue();
            const entries = Object.values(queue)
                .filter(item => item && typeof item === 'object' && String(item.key || '').trim())
                .sort((a, b) => String(a.queuedAt || '').localeCompare(String(b.queuedAt || '')));

            if (!entries.length) return !targetKey;
            if (!(await this.ensureClientReady({ silent: true, timeoutMs: 4000 }))) {
                return false;
            }

            let targetOk = !targetKey;
            for (const job of entries) {
                const cacheKey = String(job.key || '').trim();
                if (!cacheKey) continue;

                const payload = await readCachedWorkspaceSnapshot(cacheKey);
                if (!payload) {
                    delete queue[cacheKey];
                    writeWorkspaceSyncQueue(queue);
                    continue;
                }

                const uploadBundle = (job.mode || 'workspace') === 'workspace'
                    ? buildWorkspaceSplitUploadBundle(cacheKey, payload)
                    : null;
                const packedContent = uploadBundle ? '' : packPayload(payload);
                const contentHash = uploadBundle ? uploadBundle.contentHash : hashText(packedContent);
                const syncedAt = new Date().toISOString();
                const currentMeta = readWorkspaceSyncMeta(cacheKey);

                if (!opts.forceUpload && currentMeta.lastUploadedHash && currentMeta.lastUploadedHash === contentHash) {
                    delete queue[cacheKey];
                    writeWorkspaceSyncQueue(queue);
                    writeWorkspaceSyncMeta(cacheKey, {
                        contentHash,
                        pendingCloudSync: false,
                        pendingSyncSource: '',
                        lastCloudError: '',
                        lastSyncedAt: currentMeta.lastSyncedAt || syncedAt,
                        currentProjectKey: cacheKey,
                        currentExamId: payload?.CURRENT_EXAM_ID || ''
                    });
                    if (job.mode === 'workspace') {
                        syncWorkspaceState({
                            currentProjectKey: cacheKey,
                            currentExamId: payload?.CURRENT_EXAM_ID || ''
                        });
                    }
                    dispatchWorkspaceSyncEvent('skipped', {
                        key: cacheKey,
                        mode: job.mode || 'workspace',
                        sourceLabel: String(job.sourceLabel || '').trim(),
                        syncedAt: currentMeta.lastSyncedAt || syncedAt
                    });
                    if (cacheKey === targetKey) targetOk = true;
                    continue;
                }

                try {
                    if (uploadBundle) {
                        await uploadWorkspaceBundle(uploadBundle, syncedAt);
                    } else {
                        const { error } = await upsertSystemDataRecord({
                            key: cacheKey,
                            content: packedContent,
                            updated_at: syncedAt
                        });
                        if (error) throw error;
                    }

                    delete queue[cacheKey];
                    writeWorkspaceSyncQueue(queue);
                    writeWorkspaceSyncMeta(cacheKey, {
                        contentHash,
                        lastUploadedHash: contentHash,
                        remoteUpdatedAt: syncedAt,
                        lastSyncedAt: syncedAt,
                        lastSyncSource: String(job.sourceLabel || '').trim(),
                        pendingCloudSync: false,
                        pendingSyncSource: '',
                        lastCloudError: '',
                        currentProjectKey: cacheKey,
                        currentExamId: payload?.CURRENT_EXAM_ID || ''
                    });

                    if (job.mode === 'workspace') {
                        syncWorkspaceState({
                            currentProjectKey: cacheKey,
                            currentExamId: payload?.CURRENT_EXAM_ID || ''
                        });
                    }
                    clearCohortExamMetaMemoryCache(
                        this,
                        payload?.CURRENT_COHORT_ID || payload?.cohortId || readWorkspaceCohortId()
                    );
                    localStorage.setItem('CLOUD_SYNC_AT', syncedAt);
                    if (typeof logAction === 'function') {
                        logAction('云端同步', `全量数据已同步：${cacheKey}`);
                    }
                    if (typeof updateStatusPanel === 'function') updateStatusPanel();
                    setCloudStatus('success', '已保存');
                    dispatchWorkspaceSyncEvent('success', {
                        key: cacheKey,
                        mode: job.mode || 'workspace',
                        sourceLabel: String(job.sourceLabel || '').trim(),
                        syncedAt
                    });
                    if (targetKey && cacheKey === targetKey) targetOk = true;
                } catch (error) {
                    console.error('[CloudSync] queue flush error:', error);
                    const message = error?.message || String(error);
                    writeWorkspaceSyncMeta(cacheKey, {
                        pendingCloudSync: true,
                        pendingSyncSource: String(job.sourceLabel || '').trim(),
                        lastCloudError: message,
                        lastFailedSyncAt: syncedAt
                    });
                    setCloudStatus('error', message ? String(message).slice(0, 24) : '同步失败');
                    dispatchWorkspaceSyncEvent('error', {
                        key: cacheKey,
                        mode: job.mode || 'workspace',
                        sourceLabel: String(job.sourceLabel || '').trim(),
                        message
                    });
                    if (targetKey && cacheKey === targetKey) targetOk = false;
                }
            }

            return targetOk;
        })().finally(() => {
            this._workspaceSyncFlushTask = null;
        });

        return this._workspaceSyncFlushTask;
    };

    CloudManager.load = async function () {
        let requestedKey = getWorkspaceSnapshotKey() || getCurrentProjectKey() || this.getKey();
        let cachedPayload = requestedKey ? await readCachedWorkspaceSnapshot(requestedKey) : null;
        let cachedMeta = requestedKey ? readWorkspaceSyncMeta(requestedKey) : {};
        let appliedCached = false;

        if (requestedKey && cachedPayload) {
            try {
                appliedCached = await applyCachedWorkspaceSnapshot(
                    requestedKey,
                    cachedPayload,
                    cachedMeta.remoteUpdatedAt || cachedMeta.lastSyncedAt || ''
                );
                if (cachedMeta.remoteUpdatedAt || cachedMeta.lastSyncedAt) {
                    markFullCloudSyncComplete(cachedMeta.remoteUpdatedAt || cachedMeta.lastSyncedAt);
                }
                setCloudStatus('syncing', '本地已就绪');
            } catch (error) {
                console.warn('[CloudLoad] apply cached snapshot failed:', error);
            }
        }

        if (requestedKey && cachedMeta.pendingCloudSync) {
            scheduleBackgroundQueueFlush(this);
            setCloudStatus('success', '本地已就绪');
            return true;
        }

        if (appliedCached) {
            scheduleWorkspaceRemoteRefresh(this, requestedKey, cachedMeta);
            setCloudStatus('success', '本地已就绪');
            return true;
        }

        if (!(await this.ensureClientReady({ silent: appliedCached }))) {
            return appliedCached;
        }

        let key = requestedKey;
        try {
            key = await resolveCloudSnapshotKey(key);
            if (key) syncWorkspaceState({ currentProjectKey: key });
        } catch (error) {
            logCloudRuntimeIssue('Cloud load key lookup error:', error);
            if (appliedCached) {
                setCloudStatus('success', '缓存可用');
                return true;
            }
            setCloudStatus('error', error?.message ? String(error.message).slice(0, 24) : '加载失败');
            return false;
        }

        if (!key) return appliedCached;

        if (key !== requestedKey) {
            requestedKey = key;
            cachedPayload = await readCachedWorkspaceSnapshot(key);
            cachedMeta = readWorkspaceSyncMeta(key);
            if (!appliedCached && cachedPayload) {
                try {
                    appliedCached = await applyCachedWorkspaceSnapshot(
                        key,
                        cachedPayload,
                        cachedMeta.remoteUpdatedAt || cachedMeta.lastSyncedAt || ''
                    );
                    if (cachedMeta.remoteUpdatedAt || cachedMeta.lastSyncedAt) {
                        markFullCloudSyncComplete(cachedMeta.remoteUpdatedAt || cachedMeta.lastSyncedAt);
                    }
                    setCloudStatus('syncing', '本地已就绪');
                } catch (error) {
                    console.warn('[CloudLoad] apply resolved cached snapshot failed:', error);
                }
            }
            if (cachedMeta.pendingCloudSync) {
                scheduleBackgroundQueueFlush(this);
                setCloudStatus('success', '本地已就绪');
                return true;
            }
            if (appliedCached) {
                scheduleWorkspaceRemoteRefresh(this, key, cachedMeta);
                setCloudStatus('success', '本地已就绪');
                return true;
            }
        }

        try {
            const remoteMeta = await fetchWorkspaceSnapshotMeta(key);
            if (!remoteMeta?.updated_at) {
                setCloudStatus('success', appliedCached ? '本地已就绪' : '暂无云端');
                return appliedCached;
            }

            const remoteTs = Date.parse(String(remoteMeta.updated_at || '')) || 0;
            const localTs = Date.parse(String(cachedMeta.remoteUpdatedAt || cachedMeta.lastSyncedAt || '')) || 0;
            const remoteIsNewer = remoteTs > (localTs + 1000);

            if (appliedCached && !remoteIsNewer) {
                const cohortId = normalizeCohortId(cachedPayload?.CURRENT_COHORT_ID || getCurrentCohortId());
                if (cohortId && typeof this.fetchCohortExamsToLocal === 'function') {
                    this.fetchCohortExamsToLocal(cohortId, { background: true }).catch((syncError) => {
                        console.warn('[CloudExams] background sync failed:', syncError);
                    });
                }
                setCloudStatus('success', '已最新');
                return true;
            }

            if (appliedCached && remoteIsNewer) {
                if (!this._workspaceRefreshTasks) this._workspaceRefreshTasks = {};
                if (!this._workspaceRefreshTasks[key]) {
                    this._workspaceRefreshTasks[key] = fetchWorkspaceSnapshotRow(key)
                        .then(row => fetchAndApplyWorkspaceSnapshot(this, key, row))
                        .finally(() => {
                            delete this._workspaceRefreshTasks[key];
                        });
                }
                this._workspaceRefreshTasks[key].catch((error) => {
                    console.warn('[CloudLoad] background refresh failed:', error);
                });
                setCloudStatus('success', '本地已就绪');
                return true;
            }

            const row = await fetchWorkspaceSnapshotRow(key);
            if (!row || !row.content) return appliedCached;

            const loaded = await fetchAndApplyWorkspaceSnapshot(this, key, row);
            if (!loaded) return appliedCached;

            if (typeof logAction === 'function') logAction('云端加载', `已加载全量数据：${key}`);
            safeToast('数据已同步到本地', 'success');
            setCloudStatus('success', '已拉取');
            return true;
        } catch (error) {
            logCloudRuntimeIssue('Cloud load error:', error);
            if (appliedCached) {
                setCloudStatus('success', '缓存可用');
                return true;
            }
            safeToast('加载失败', 'error');
            setCloudStatus('error', error?.message ? String(error.message).slice(0, 24) : '拉取失败');
            return false;
        }
    };

    const originalFetchCohortExamsToLocal = CloudManager.fetchCohortExamsToLocal;
    const originalWorkspaceLoad = CloudManager.load;

    async function runCohortExamSync(manager, cohortId, options = {}) {
        const nextOptions = options && typeof options === 'object' ? { ...options } : {};
        const background = Boolean(nextOptions.background);
        if (!background) {
            return originalFetchCohortExamsToLocal.call(manager, cohortId, nextOptions);
        }

        const previousToast = window.UI && typeof window.UI.toast === 'function'
            ? window.UI.toast
            : null;
        const previousSetCloudSyncStatus = typeof window.setCloudSyncStatus === 'function'
            ? window.setCloudSyncStatus
            : null;

        if (window.UI && typeof window.UI.toast === 'function') {
            window.UI.toast = function () { };
        }
        if (typeof window.setCloudSyncStatus === 'function') {
            window.setCloudSyncStatus = function () { };
        }

        try {
            return await originalFetchCohortExamsToLocal.call(manager, cohortId, nextOptions);
        } finally {
            if (window.UI && previousToast) {
                window.UI.toast = previousToast;
            }
            if (previousSetCloudSyncStatus) {
                window.setCloudSyncStatus = previousSetCloudSyncStatus;
            }
        }
    }

    CloudManager.fetchCohortExamsToLocal = function (cohortId, options = {}) {
        return runCohortExamSync(this, cohortId, options);
    };

    CloudManager.load = async function () {
        const manager = this;
        const previousFetch = manager.fetchCohortExamsToLocal;

        manager.fetchCohortExamsToLocal = function (cohortId, options = {}) {
            scheduleBackgroundCloudTask(() => {
                runCohortExamSync(manager, cohortId, {
                    ...(options || {}),
                    background: true,
                    refreshSelectors: options.refreshSelectors === true
                }).catch((syncError) => {
                    console.warn('[CloudExams] background sync failed:', syncError);
                });
            }, 1800);
            return Promise.resolve({ success: true, queued: true, background: true });
        };

        try {
            return await originalWorkspaceLoad.call(manager);
        } finally {
            manager.fetchCohortExamsToLocal = previousFetch;
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        scheduleBackgroundCloudTask(() => {
            if (!Object.keys(readWorkspaceSyncQueue()).length) return;
            CloudManager.flushWorkspaceSyncQueue().catch((error) => {
                console.warn('[CloudSync] startup queue flush failed:', error);
            });
        }, 3500);
    });

    window.__CLOUD_WORKSPACE_RUNTIME_PATCHED__ = true;
})();
