// cohort-exam-meta-runtime.js — Cohort storage, CohortManager, exam key/meta/lock functions (extracted from app.js)
const COHORT_STORAGE_KEY = 'COHORT_LIST';

function getWorkspaceStateRuntime() {
    return window.WorkspaceState || null;
}

function readWorkspaceProjectKey() {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.getCurrentProjectKey === 'function') {
        return String(WorkspaceStateRuntime.getCurrentProjectKey() || '').trim();
    }
    return String(localStorage.getItem('CURRENT_PROJECT_KEY') || window.CURRENT_PROJECT_KEY || '').trim();
}

function readWorkspaceCohortId() {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.getCurrentCohortId === 'function') {
        return String(WorkspaceStateRuntime.getCurrentCohortId() || '').trim();
    }
    return String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
}

function readWorkspaceCohortMeta() {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.getCurrentCohortMeta === 'function') {
        return WorkspaceStateRuntime.getCurrentCohortMeta() || null;
    }
    if (window.CURRENT_COHORT_META && typeof window.CURRENT_COHORT_META === 'object') return window.CURRENT_COHORT_META;
    try {
        return JSON.parse(localStorage.getItem('CURRENT_COHORT_META') || 'null');
    } catch (e) {
        return null;
    }
}

function readWorkspaceExamId() {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.getCurrentExamId === 'function') {
        return String(WorkspaceStateRuntime.getCurrentExamId() || '').trim();
    }
    return String(window.CURRENT_EXAM_ID || localStorage.getItem('CURRENT_EXAM_ID') || '').trim();
}

function readWorkspaceSnapshot() {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.snapshotWorkspaceState === 'function') {
        return WorkspaceStateRuntime.snapshotWorkspaceState();
    }
    return {
        currentProjectKey: readWorkspaceProjectKey(),
        currentCohortId: readWorkspaceCohortId(),
        currentCohortMeta: readWorkspaceCohortMeta(),
        currentExamId: readWorkspaceExamId(),
        cohortDb: window.COHORT_DB || null
    };
}

function syncWorkspaceRuntimeState(patch = {}) {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.syncWorkspaceState === 'function') {
        return WorkspaceStateRuntime.syncWorkspaceState(patch);
    }
    const next = patch && typeof patch === 'object' ? patch : {};
    if (Object.prototype.hasOwnProperty.call(next, 'cohortDb')) window.COHORT_DB = next.cohortDb || null;
    if (Object.prototype.hasOwnProperty.call(next, 'currentCohortId')) {
        const cohortId = String(next.currentCohortId || '').trim();
        if (cohortId) {
            localStorage.setItem('CURRENT_COHORT_ID', cohortId);
            window.CURRENT_COHORT_ID = cohortId;
        }
    }
    if (Object.prototype.hasOwnProperty.call(next, 'currentCohortMeta')) {
        const meta = next.currentCohortMeta || null;
        if (meta) localStorage.setItem('CURRENT_COHORT_META', JSON.stringify(meta));
        window.CURRENT_COHORT_META = meta;
    }
    if (Object.prototype.hasOwnProperty.call(next, 'currentExamId')) {
        const examId = String(next.currentExamId || '').trim();
        if (examId) {
            localStorage.setItem('CURRENT_EXAM_ID', examId);
            window.CURRENT_EXAM_ID = examId;
        }
    }
    const projectKey = Object.prototype.hasOwnProperty.call(next, 'currentProjectKey')
        ? String(next.currentProjectKey || '').trim()
        : (readWorkspaceCohortId() ? getCohortKey(readWorkspaceCohortId()) : readWorkspaceProjectKey());
    if (projectKey) {
        localStorage.setItem('CURRENT_PROJECT_KEY', projectKey);
        window.CURRENT_PROJECT_KEY = projectKey;
    }
    return readWorkspaceSnapshot();
}

function getCohortKey(cohortId) {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.getCohortKey === 'function') {
        return WorkspaceStateRuntime.getCohortKey(cohortId);
    }
    return `cohort::${cohortId}`;
}
window.getCohortKey = window.getCohortKey || getCohortKey;

function requestCohortSwitchRuntime(cohortId, switchOptions) {
    if (typeof window.switchCohort === 'function') {
        return window.switchCohort(cohortId, switchOptions);
    }
    const queue = Array.isArray(window.__PENDING_COHORT_SWITCH_QUEUE__)
        ? window.__PENDING_COHORT_SWITCH_QUEUE__
        : [];
    window.__PENDING_COHORT_SWITCH_QUEUE__ = queue;
    return new Promise((resolve, reject) => {
        queue.push({ cohortId, switchOptions, resolve, reject, createdAt: Date.now() });
        if (window.__COHORT_SWITCH_READY_WAIT_TIMER__) {
            clearTimeout(window.__COHORT_SWITCH_READY_WAIT_TIMER__);
        }
        window.__COHORT_SWITCH_READY_WAIT_TIMER__ = setTimeout(() => {
            window.__COHORT_SWITCH_READY_WAIT_TIMER__ = null;
            if (typeof window.__flushPendingCohortSwitches === 'function') {
                window.__flushPendingCohortSwitches();
            } else if (typeof window.switchCohort !== 'function') {
                console.warn('[CohortManager] switchCohort runtime is not ready yet; cohort switch remains queued.');
            }
        }, 100);
    });
}

function inferCohortIdFromValue(value) {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.inferCohortIdFromValue === 'function') {
        return WorkspaceStateRuntime.inferCohortIdFromValue(value);
    }
    const raw = String(value || '').trim();
    if (!raw) return '';
    let match = raw.match(/^cohort::(\d{4})$/i);
    if (match) return match[1];
    match = raw.match(/^cohort::(\d{4})/i);
    if (match) return match[1];
    match = raw.match(/^(\d{4})\D*_/);
    if (match) return match[1];
    match = raw.match(/(\d{4})级/);
    if (match) return match[1];
    match = raw.match(/(\d{4})/);
    if (match) return match[1];
    return '';
}

function normalizeCompareCohortId(value) {
    const inferred = inferCohortIdFromValue(value);
    const text = String(inferred || value || '').trim();
    return /^\d{4}$/.test(text) ? text : '';
}

window.normalizeCompareCohortId = normalizeCompareCohortId;

function normalizeCohortGuardId(value) {
    return normalizeCompareCohortId(value);
}

function lockRuntimeCohortId(cohortId) {
    const id = normalizeCohortGuardId(cohortId);
    if (!id) return '';
    window.__LOCKED_LOGIN_COHORT_ID__ = id;
    try {
        sessionStorage.setItem('LOCKED_LOGIN_COHORT_ID', id);
    } catch (e) { }
    return id;
}

function getRuntimeCohortGuardId() {
    const locked = window.__LOCKED_LOGIN_COHORT_ID__
        || (() => {
            try { return sessionStorage.getItem('LOCKED_LOGIN_COHORT_ID') || ''; } catch (e) { return ''; }
        })()
        || (typeof getExplicitCohortSelection === 'function' ? getExplicitCohortSelection() : '');
    return normalizeCohortGuardId(locked);
}

window.lockRuntimeCohortId = window.lockRuntimeCohortId || lockRuntimeCohortId;
window.getRuntimeCohortGuardId = window.getRuntimeCohortGuardId || getRuntimeCohortGuardId;

function writeWorkspaceProjectKey(key) {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.setCurrentProjectKey === 'function') {
        return WorkspaceStateRuntime.setCurrentProjectKey(key);
    }
    const nextKey = String(key || '').trim();
    if (!nextKey) {
        localStorage.removeItem('CURRENT_PROJECT_KEY');
        window.CURRENT_PROJECT_KEY = '';
        return '';
    }
    localStorage.setItem('CURRENT_PROJECT_KEY', nextKey);
    window.CURRENT_PROJECT_KEY = nextKey;
    return nextKey;
}

function writeWorkspaceCohortId(cohortId, options = {}) {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.setCurrentCohortId === 'function') {
        return WorkspaceStateRuntime.setCurrentCohortId(cohortId, options);
    }
    const nextId = String(cohortId || '').trim();
    if (!nextId) {
        localStorage.removeItem('CURRENT_COHORT_ID');
        window.CURRENT_COHORT_ID = '';
        if (options.syncProjectKey !== false) writeWorkspaceProjectKey('');
        return '';
    }
    localStorage.setItem('CURRENT_COHORT_ID', nextId);
    window.CURRENT_COHORT_ID = nextId;
    lockRuntimeCohortId(nextId);
    if (options.syncProjectKey !== false) writeWorkspaceProjectKey(getCohortKey(nextId));
    return nextId;
}

function writeWorkspaceCohortMeta(meta, options = {}) {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.setCurrentCohortMeta === 'function') {
        return WorkspaceStateRuntime.setCurrentCohortMeta(meta, options);
    }
    if (!meta || typeof meta !== 'object') {
        localStorage.removeItem('CURRENT_COHORT_META');
        window.CURRENT_COHORT_META = null;
        return null;
    }
    const nextMeta = { ...meta };
    localStorage.setItem('CURRENT_COHORT_META', JSON.stringify(nextMeta));
    window.CURRENT_COHORT_META = nextMeta;
    if (options.syncCohortId !== false && nextMeta.id) {
        writeWorkspaceCohortId(nextMeta.id, { syncProjectKey: options.syncProjectKey !== false });
    }
    return nextMeta;
}

function writeWorkspaceExamId(examId) {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.setCurrentExamId === 'function') {
        return WorkspaceStateRuntime.setCurrentExamId(examId);
    }
    const nextExamId = String(examId || '').trim();
    if (!nextExamId) {
        localStorage.removeItem('CURRENT_EXAM_ID');
        window.CURRENT_EXAM_ID = '';
        return '';
    }
    localStorage.setItem('CURRENT_EXAM_ID', nextExamId);
    window.CURRENT_EXAM_ID = nextExamId;
    return nextExamId;
}

function clearWorkspaceRuntimeIdentity(options = {}) {
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.clearWorkspaceIdentity === 'function') {
        return WorkspaceStateRuntime.clearWorkspaceIdentity(options);
    }
    localStorage.removeItem('CURRENT_PROJECT_KEY');
    localStorage.removeItem('CURRENT_COHORT_ID');
    localStorage.removeItem('CURRENT_COHORT_META');
    localStorage.removeItem('CURRENT_EXAM_ID');
    window.CURRENT_PROJECT_KEY = '';
    window.CURRENT_COHORT_ID = '';
    window.CURRENT_COHORT_META = null;
    window.CURRENT_EXAM_ID = '';
    if (options.clearCohortDb) window.COHORT_DB = null;
    return readWorkspaceSnapshot();
}

function ensureCurrentCohortIdentity() {
    const existing = String(CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
    if (existing) {
        CURRENT_COHORT_ID = existing;
        return existing;
    }

    const inferred = inferCohortIdFromValue(readWorkspaceProjectKey())
        || inferCohortIdFromValue(readWorkspaceExamId())
        || inferCohortIdFromValue(CURRENT_EXAM_ID)
        || inferCohortIdFromValue(window.CURRENT_EXAM_ID);
    if (!inferred) return '';

    CURRENT_COHORT_ID = inferred;
    const baseMeta = CURRENT_COHORT_META || readWorkspaceCohortMeta() || { id: inferred, year: inferred, startGrade: 6 };
    const WorkspaceStateRuntime = getWorkspaceStateRuntime();
    const meta = WorkspaceStateRuntime && typeof WorkspaceStateRuntime.normalizeCohortMeta === 'function'
        ? WorkspaceStateRuntime.normalizeCohortMeta(baseMeta, inferred)
        : baseMeta;
    CURRENT_COHORT_META = meta;
    syncWorkspaceRuntimeState({
        currentCohortId: inferred,
        currentCohortMeta: meta,
        currentExamId: CURRENT_EXAM_ID,
        cohortDb: COHORT_DB
    });

    return inferred;
}

function getCohortStageLabel(meta, referenceMeta = {}) {
    const grade = Number(computeCohortGrade(meta, referenceMeta));
    if (!Number.isFinite(grade)) return '年级待定';
    if (grade < 6) return '未入学';
    if (grade > 9) return '已毕业';
    return `${grade}年级`;
}

function formatCohortLabel(meta, referenceMeta = {}) {
    if (!meta || !meta.year) return '未选择';
    // Cohort IDs are admission years. Presenting only that fixed origin made
    // every cohort look like Grade 6 even after it advanced or graduated.
    // With no explicit exam context, compute against the current academic year
    // (Sep–Aug), so selector labels stay correct before and after September.
    return `${meta.year}级 · ${getCohortStageLabel(meta, referenceMeta)}`;
}

function computeCohortGrade(meta, examMeta) {
    if (!meta || !meta.year) return '';
    const startGrade = 6;
    const entryYear = parseInt(meta.year);
    const baseYear = getAcademicYearStart(examMeta);
    if (!baseYear || isNaN(entryYear)) return '';
    const offset = baseYear - entryYear;
    const grade = startGrade + offset;
    return grade < 1 ? '' : grade;
}

function getAcademicYearStart(examMeta) {
    if (!examMeta || !examMeta.year) return new Date().getMonth() + 1 >= 9 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    const parts = String(examMeta.year).split('-');
    const start = parseInt(parts[0]);
    return isNaN(start) ? new Date().getFullYear() : start;
}

function getEffectiveGrade(meta) {
    const cohortMeta = CURRENT_COHORT_META || readWorkspaceCohortMeta() || null;
    const recalculated = computeCohortGrade(cohortMeta, meta || {});
    if (recalculated) return String(recalculated);
    const direct = String(meta?.grade || '').trim();
    if (direct) return direct;
    const fallback = computeCohortGrade(cohortMeta, {});
    return fallback ? String(fallback) : '';
}

function getTermId(meta) {
    window.getTermId = getTermId;
    if (!meta) return '';
    const grade = getEffectiveGrade(meta) || '';
    const term = meta.term || '';
    return grade ? `${grade}年级_${term}` : term;
}

function buildTeacherTermId(meta) {
    if (!meta) return '';
    const year = String(meta.year || '').trim();
    const term = String(meta.term || '').trim();
    const grade = String(getEffectiveGrade(meta) || '').trim();
    if (!year || !term) return '';
    return grade ? `${year}_${term}_${grade}年级` : `${year}_${term}`;
}

function parseTeacherTermContext(termId) {
    const text = String(termId || '').trim();
    return {
        year: (text.match(/(?:^|_)(\d{4}-\d{4})(?:_|$)/) || [])[1] || '',
        grade: (text.match(/(?:^|_)(\d{1,2})年级(?:_|$)/) || [])[1] || '',
        term: (text.match(/(?:^|_)(上学期|下学期)(?:_|$)/) || [])[1] || ''
    };
}

function isTeacherTermCompatibleWithCurrentExam(termId, meta = getTeacherTermMetaFromRuntime()) {
    const candidate = parseTeacherTermContext(termId);
    if (!candidate.year && !candidate.grade) return true;
    const expectedYear = String(meta?.year || '').trim();
    const expectedGrade = String(getEffectiveGrade(meta) || '').trim().replace(/年级$/, '');
    if (candidate.year && expectedYear && candidate.year !== expectedYear) return false;
    if (candidate.grade && expectedGrade && candidate.grade !== expectedGrade) return false;
    return true;
}

function readArchiveExamMetaForTeacherTerm() {
    const archiveMeta = (() => {
        if (typeof readArchiveMeta === 'function') return readArchiveMeta();
        if (window.ARCHIVE_META && typeof window.ARCHIVE_META === 'object') return window.ARCHIVE_META;
        try {
            return JSON.parse(localStorage.getItem('ARCHIVE_META') || 'null');
        } catch (_) {
            return null;
        }
    })();
    if (!archiveMeta || typeof archiveMeta !== 'object') return null;
    const year = String(archiveMeta.year || '').trim();
    const term = String(archiveMeta.term || '').trim();
    if (!year || !term) return null;
    const currentExamId = String(readWorkspaceExamId() || '').trim();
    const archiveExamId = String(archiveMeta.examId || archiveMeta.id || '').trim();
    if (currentExamId && archiveExamId && currentExamId !== archiveExamId) return null;
    return archiveMeta;
}

function getTeacherTermMetaFromRuntime() {
    const uiMeta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
    const archiveMeta = readArchiveExamMetaForTeacherTerm();
    if (!archiveMeta) return uiMeta;
    const archiveTermId = buildTeacherTermId(archiveMeta);
    const uiTermId = buildTeacherTermId(uiMeta);
    if (archiveTermId && archiveTermId !== uiTermId) {
        return {
            ...uiMeta,
            ...archiveMeta,
            cohortId: archiveMeta.cohortId || uiMeta.cohortId,
            grade: archiveMeta.grade || uiMeta.grade
        };
    }
    return uiMeta;
}

function getTeacherTermBase(termId) {
    const text = String(termId || '').trim();
    if (!text) return '';
    const parts = text.split('_').filter(Boolean);
    if (parts.length >= 2 && /^\d{4}-\d{4}$/.test(parts[0])) {
        return parts.slice(0, 2).join('_');
    }
    return text;
}

function isTeacherTermSelectActive(selectEl) {
    if (!selectEl) return false;
    const teacherArea = document.getElementById('dm-teacher-area');
    if (!teacherArea) return true;
    if (teacherArea.style.display === 'none') return false;
    if (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function') {
        const style = window.getComputedStyle(teacherArea);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
    }
    if (typeof teacherArea.getClientRects === 'function' && teacherArea.getClientRects().length === 0) {
        return false;
    }
    return true;
}

function getPreferredTeacherTermId() {
    const termSel = document.getElementById('dm-teacher-term-select');
    const selectedTeacherTermId = isTeacherTermSelectActive(termSel) ? String(termSel?.value || '').trim() : '';

    // When the teacher-term selector is visible, its value is an explicit
    // user choice and must be authoritative.  The current exam/archive meta
    // can legitimately describe a different grade (for example, an existing
    // 7th-grade exam archive while the user is preparing the new 8th-grade
    // timetable).  Rejecting the visible selection against that archive
    // would save an otherwise valid upload under the wrong grade/term.
    if (selectedTeacherTermId) return selectedTeacherTermId;

    const uiMeta = getTeacherTermMetaFromRuntime();
    const uiTeacherTermId = buildTeacherTermId(uiMeta);
    const compatibleSelectedTeacherTermId = isTeacherTermCompatibleWithCurrentExam(selectedTeacherTermId, uiMeta)
        ? selectedTeacherTermId
        : '';
    // Pure preferred term: active DataManager select / current exam-derived term /
    // saved teacher term / saved base term. This is the AUTHORITATIVE current-exam
    // teacher term semantic — it must NOT be widened with teachingHistory fallbacks,
    // or a compatible old-semester 任课表 would pollute the current exam term.
    return String(
        compatibleSelectedTeacherTermId
        || uiTeacherTermId
        || readCurrentTeacherTermId()
        || readCurrentTermId()
        || ''
    ).trim();
}

function syncTeacherTermStorage(termId) {
    // This runtime can execute before app.js during parallel boot. Keep the
    // storage bridge self-contained so teacher auto-restore never throws a
    // ReferenceError while the main entry bundle is still arriving.
    if (typeof syncTeacherTermRuntimeState === 'function') {
        return syncTeacherTermRuntimeState(termId);
    }
    const runtime = window.ExamStateRuntime;
    if (runtime && typeof runtime.syncTeacherTerm === 'function') {
        return runtime.syncTeacherTerm(termId);
    }
    return { termId: String(termId || ''), deferred: true };
}

function getTeacherTermCandidates(termId) {
    const preferred = String(termId || '').trim();
    const uiMeta = getTeacherTermMetaFromRuntime();
    const uiTeacherTermId = buildTeacherTermId(uiMeta);
    const savedTeacherTermId = readCurrentTeacherTermId();
    const savedBaseTerm = readCurrentTermId();
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const history = db?.teachingHistory || {};
    const candidates = [];
    const pushUnique = (value) => {
        const text = String(value || '').trim();
        if (!text || candidates.includes(text)) return;
        candidates.push(text);
    };

    [
        preferred,
        uiTeacherTermId,
        savedTeacherTermId,
        getTeacherTermBase(preferred),
        getTeacherTermBase(uiTeacherTermId),
        getTeacherTermBase(savedTeacherTermId),
        savedBaseTerm
    ].forEach(pushUnique);

    const bases = [...new Set(candidates.map(getTeacherTermBase).filter(Boolean))];
    Object.keys(history).forEach(key => {
        const text = String(key || '').trim();
        if (!text) return;
        if (candidates.includes(text)) return;
        const keyBase = getTeacherTermBase(text);
        if (bases.includes(keyBase)) pushUnique(text);
    });

    // 当前学期没有任课表时，允许同一届、同一学年、同一年级的最近学期
    // 作为兼容来源。这里只扩展“读取候选”，不会改写当前考试/学期身份，
    // 因而不会把上一届或其他年级的教师污染到当前工作区。
    const parseContext = (value) => {
        const text = String(value || '').trim();
        const year = (text.match(/(?:^|_)(\d{4}-\d{4})(?:_|$)/) || [])[1] || '';
        const grade = (text.match(/(?:^|_)(\d{1,2})年级(?:_|$)/) || [])[1] || '';
        const term = (text.match(/(?:^|_)(上学期|下学期)(?:_|$)/) || [])[1] || '';
        return { text, year, grade, term };
    };
    const target = parseContext(preferred || uiTeacherTermId || savedTeacherTermId);
    if (target.year && target.grade) {
        Object.keys(history)
            .map((key) => ({ key, ...parseContext(key), entry: history[key] }))
            .filter((item) => item.year === target.year && item.grade === target.grade)
            .filter((item) => {
                const map = item.entry?.map && typeof item.entry.map === 'object' ? item.entry.map : (item.entry || {});
                return Object.keys(map).length > 0;
            })
            .sort((left, right) => {
                const leftTs = Date.parse(String(left.entry?.savedAt || left.entry?.updated_at || left.entry?.updatedAt || '')) || 0;
                const rightTs = Date.parse(String(right.entry?.savedAt || right.entry?.updated_at || right.entry?.updatedAt || '')) || 0;
                if (leftTs !== rightTs) return rightTs - leftTs;
                if (left.term === target.term) return -1;
                if (right.term === target.term) return 1;
                return right.key.localeCompare(left.key, 'zh-CN');
            })
            .forEach((item) => pushUnique(item.key));
    }

    return candidates;
}

function resolveTeacherHistoryEntry(termId) {
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const history = db?.teachingHistory || {};
    const candidates = getTeacherTermCandidates(termId);

    for (const key of candidates) {
        const entry = history[key];
        const localMap = entry?.map && typeof entry.map === 'object' ? entry.map : (entry || {});
        const localSchoolMap = entry?.schoolMap && typeof entry.schoolMap === 'object' ? entry.schoolMap : {};
        if (localMap && Object.keys(localMap).length > 0) {
            return {
                key,
                baseTerm: getTeacherTermBase(key),
                map: localMap,
                schoolMap: localSchoolMap
            };
        }
    }
    return null;
}

function getExamLabelForKey(meta) {
    if (!meta) return '';
    const cohort = meta.cohortId ? `${meta.cohortId}级` : '';
    const grade = meta.grade ? `${meta.grade}年级` : '';
    const year = meta.year || '';
    const term = meta.term || '';
    const examName = getPreferredExamName(meta);
    const date = meta.date || '';
    return [cohort, grade, year, term, examName, date].filter(Boolean).join('_');
}

function refreshExamYearOptions(entryYear) {
    const sel = document.getElementById('exam-year');
    if (!sel) return;
    const yearNum = parseInt(entryYear);
    if (!yearNum) return;
    const years = [];
    for (let y = yearNum; y <= yearNum + 3; y++) {
        years.push(`${y}-${y + 1}`);
    }
    const current = sel.value;
    sel.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join('');
    if (current && years.includes(current)) sel.value = current;
    else sel.value = years[0];
}

function getUserCohortPrefKey() {
    const user = Auth?.currentUser;
    if (!user) return '';
    return `LAST_COHORT_${user.name || 'user'}_${user.role || 'role'}`;
}

function rememberUserCohort(cohortId) {
    const key = getUserCohortPrefKey();
    lockRuntimeCohortId(cohortId);
    if (!key) return;
    localStorage.setItem(key, cohortId);
}

function getRememberedUserCohort() {
    const key = getUserCohortPrefKey();
    if (!key) return '';
    const saved = String(localStorage.getItem(key) || '').trim();
    return /^\d{4}$/.test(saved) ? saved : '';
}

window.getRememberedUserCohort = getRememberedUserCohort;

function getExplicitCohortSelection() {
    const selected = String(
        window.BootCohortLifecycle?.getSelectedLoginCohortYear?.()
        || document.getElementById('login-cohort-select')?.value
        || document.getElementById('entry-cohort-year')?.value
        || ''
    ).trim();
    return /^\d{4}$/.test(selected) ? selected : '';
}

function ensureCohortRegistered(cohortId) {
    const id = String(cohortId || '').trim();
    if (!id || !window.__COHORT_MANAGER_READY__) return null;
    CohortManager.list = Array.isArray(CohortManager.list) ? CohortManager.list : [];

    let meta = CohortManager.list.find(item => String(item?.id || '').trim() === id);
    if (!meta) {
        const currentMeta = CURRENT_COHORT_META && String(CURRENT_COHORT_META.id || CURRENT_COHORT_ID || '').trim() === id
            ? CURRENT_COHORT_META
            : null;
        const year = parseInt(id, 10);
        meta = currentMeta || {
            id,
            year: Number.isFinite(year) ? year : id,
            startGrade: 6,
            createdAt: Date.now()
        };
        CohortManager.list.unshift(meta);
        if (typeof CohortManager.save === 'function') CohortManager.save();
    }

    CURRENT_COHORT_ID = id;
    if (!CURRENT_COHORT_META || String(CURRENT_COHORT_META.id || '').trim() !== id) {
        CURRENT_COHORT_META = meta;
    }
    syncWorkspaceRuntimeState({
        currentCohortId: id,
        currentCohortMeta: CURRENT_COHORT_META || meta,
        currentExamId: CURRENT_EXAM_ID,
        cohortDb: COHORT_DB
    });

    if (typeof CohortManager.renderSelector === 'function') CohortManager.renderSelector();
    return meta;
}

function restoreActiveCohortUI(cohortId) {
    const meta = ensureCohortRegistered(cohortId);
    if (!meta) return false;

    const currentLabel = document.getElementById('cohort-current-label');
    if (currentLabel) currentLabel.innerText = formatCohortLabel(meta);

    const examCohortLabel = document.getElementById('exam-cohort-label');
    if (examCohortLabel) examCohortLabel.innerText = formatCohortLabel(meta);

    const selector = document.getElementById('cohort-selector');
    if (selector) selector.value = meta.id;

    const mask = document.getElementById('mode-mask');
    if (mask) mask.style.display = 'none';

    const app = document.getElementById('app');
    if (app) app.classList.remove('hidden');

    return true;
}

function applyUserCohortPreference() {
    const key = getUserCohortPrefKey();
    if (!key) return;
    const saved = getRememberedUserCohort();
    const current = String(CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
    const explicitSelection = getExplicitCohortSelection();
    const knownIds = (window.__COHORT_MANAGER_READY__ && Array.isArray(CohortManager.list))
        ? CohortManager.list.map(item => String(item?.id || '').trim()).filter(Boolean)
        : [];

    if (explicitSelection && current === explicitSelection && restoreActiveCohortUI(current)) {
        rememberUserCohort(current);
        return;
    }

    if (saved) {
        if (explicitSelection && saved !== explicitSelection) {
            localStorage.removeItem(key);
        } else
        if (saved !== current) {
            ensureCohortRegistered(saved);
            CohortManager.switchTo(saved);
            rememberUserCohort(saved);
            return;
        }
        if (saved === current && restoreActiveCohortUI(saved)) {
            rememberUserCohort(saved);
            return;
        }
        if (knownIds.length) localStorage.removeItem(key);
    }

    if (current && restoreActiveCohortUI(current)) {
        rememberUserCohort(current);
        return;
    }

    const fallback = knownIds[0];
    if (fallback) {
        CohortManager.switchTo(fallback);
        rememberUserCohort(fallback);
        return;
    }

    showCohortPicker();
}

function resolveMaskCohortYear() {
    const inputYear = parseYearFromInput('entry-cohort-year');
    if (inputYear && inputYear >= 2000) return String(inputYear);

    const loginSelected = String(
        window.BootCohortLifecycle?.getSelectedLoginCohortYear?.()
        || document.getElementById('login-cohort-select')?.value
        || ''
    ).trim();
    if (/^\d{4}$/.test(loginSelected)) return loginSelected;

    const shellSelected = String(document.getElementById('cohort-selector')?.value || '').trim();
    if (/^\d{4}$/.test(shellSelected)) return shellSelected;

    const current = String(CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
    if (/^\d{4}$/.test(current)) return current;

    const knownIds = (typeof CohortManager !== 'undefined' && Array.isArray(CohortManager.list))
        ? CohortManager.list.map(item => String(item?.id || '').trim()).filter(id => /^\d{4}$/.test(id))
        : [];
    if (knownIds.length) return knownIds[0];

    const inferred = inferCohortIdFromValue(readWorkspaceProjectKey())
        || inferCohortIdFromValue(readWorkspaceExamId());
    return /^\d{4}$/.test(String(inferred || '').trim()) ? String(inferred).trim() : '';
}

function prefillMaskCohortYear() {
    const input = document.getElementById('entry-cohort-year');
    if (!input) return '';
    if (String(input.value || '').trim()) return String(input.value || '').trim();
    const resolved = resolveMaskCohortYear();
    if (resolved) input.value = resolved;
    return String(input.value || '').trim();
}

function hideCohortPicker() {
    const mask = document.getElementById('mode-mask');
    const app = document.getElementById('app');
    if (mask) mask.style.display = 'none';
    if (app) app.classList.remove('hidden');
}

function showCohortPicker(options = {}) {
    const mask = document.getElementById('mode-mask');
    const app = document.getElementById('app');
    if (mask) mask.remove();
    if (app) app.classList.remove('hidden');
    const autoEnter = options.autoEnter !== false;
    setManualCohortSelectionGate(!autoEnter);

    const year = parseInt(resolveMaskCohortYear(), 10);
    if (year && year >= 2000 && window.__COHORT_MANAGER_READY__) {
        // Keep the selected cohort visible even when score recovery fails, but do
        // not turn a scoreless browser cache into an empty active workspace.
        if (!CohortManager.list.some(cohort => cohort.id === String(year))) {
            CohortManager.list.unshift({ id: String(year), year, startGrade: 6, createdAt: Date.now() });
            CohortManager.save();
            CohortManager.renderSelector();
        }
        if (!autoEnter) return;
        window.setTimeout(async () => {
            try {
                await CohortManager.addCohort({ year, startGrade: 6 }, {
                    skipConfirm: true,
                    fastEnter: true,
                    requireCloudData: false
                });
            } catch (error) {
                console.warn('[CohortPicker] auto-enter failed:', error);
            }
        }, 0);
    }
}
window.showCohortPicker = window.showCohortPicker || showCohortPicker;

function setManualCohortSelectionGate(required = false) {
    window.__REQUIRE_MANUAL_COHORT_SELECTION__ = !!required;
    if (document.body) {
        document.body.dataset.cohortGate = required ? 'manual' : 'auto';
    }
}

function requiresManualCohortSelection() {
    return !!window.__REQUIRE_MANUAL_COHORT_SELECTION__;
}

function resetCohortSelection() {
    clearExamRuntimeState();
    clearWorkspaceRuntimeIdentity({ clearCohortDb: true });
    COHORT_DB = null;
    CURRENT_COHORT_ID = '';
    CURRENT_COHORT_META = null;
    CURRENT_EXAM_ID = '';
    showCohortPicker();
}

function getActiveGrade() {
    const meta = readArchiveMeta();
    if (meta && meta.grade) return meta.grade;
    if (CURRENT_COHORT_META) {
        const guess = computeCohortGrade(CURRENT_COHORT_META, getExamMetaFromUI());
        if (guess) return guess;
    }
    if (CONFIG.name && CONFIG.name.includes('9')) return 9;
    if (CONFIG.name && CONFIG.name.includes('8')) return 8;
    if (CONFIG.name && CONFIG.name.includes('7')) return 7;
    return 6;
}

// 各年级考核口径（总分、两率一分、排名、综合评价只读这些学科）。
// 政治/历史/地理/生物在所有年级都只作单科展示与同学科教师对比，不进 SUBJECTS、不计总分。
// 8 年级列了化学：按当地课程 8 年级已开化学；成绩表里没有化学列时会在解析/加载阶段被自动剔除。
const GRADE_MODE_ASSESSMENT_SUBJECTS = Object.freeze({
    '6': Object.freeze(['语文', '数学', '英语']),
    '7': Object.freeze(['语文', '数学', '英语']),
    '8': Object.freeze(['语文', '数学', '英语', '物理', '化学']),
    '9': Object.freeze(['语文', '数学', '英语', '物理', '化学'])
});
const GRADE_MODE_DISPLAY_ONLY_SUBJECTS = Object.freeze({
    '9': Object.freeze(['政治']),
    default: Object.freeze(['政治', '历史', '地理', '生物'])
});
const SUBJECT_POLICY_VERSION = 'assessment-core-v1';

function normalizeGradeModeKey(grade) {
    const match = String(grade ?? '').match(/[6-9]/);
    return match ? match[0] : '6';
}

// 纯函数：只返回某年级的口径字段，不碰 CONFIG / DOM。applyModeByGrade 与老考试迁移共用它，
// 保证“当前考试”和“历史考试”永远是同一套学科口径。
function getGradeModeConfig(grade) {
    const key = normalizeGradeModeKey(grade);
    const isGrade9 = key === '9';
    const assessmentSubjects = [...(GRADE_MODE_ASSESSMENT_SUBJECTS[key] || GRADE_MODE_ASSESSMENT_SUBJECTS['6'])];
    const extraDisplaySubs = [...(GRADE_MODE_DISPLAY_ONLY_SUBJECTS[key] || GRADE_MODE_DISPLAY_ONLY_SUBJECTS.default)];
    return {
        name: `${key}年级`,
        label: isGrade9 ? '五科总' : `${['', '一', '二', '三', '四', '五', '六', '七', '八', '九'][assessmentSubjects.length] || assessmentSubjects.length}科总`,
        excRate: isGrade9 ? 0.06 : 0.05,
        totalSubs: assessmentSubjects,
        analysisSubs: assessmentSubjects.slice(),
        extraDisplaySubs,
        showQuery: true,
        subjectPolicy: SUBJECT_POLICY_VERSION
    };
}

function applyModeByGrade(grade) {
    setConfigState({ ...getGradeModeConfig(grade), mode: CONFIG.mode || 'multi' });
    // 老考试加载时 SUBJECTS 来自存档（可能还带着政史地生），这里按口径收敛；解析新表时也走同一函数。
    const subjectsResult = typeof applyConfiguredAnalysisSubjects === 'function'
        ? applyConfiguredAnalysisSubjects()
        : { changed: false, removed: [] };
    if (typeof refreshTotalSubjectPresentation === 'function') refreshTotalSubjectPresentation();
    const badge = document.getElementById('mode-badge');
    if (badge) badge.innerText = CONFIG.name;
    const info = document.getElementById('mode-info');
    if (info) {
        const displayOnlyText = Array.isArray(CONFIG.extraDisplaySubs) && CONFIG.extraDisplaySubs.length
            ? `，单科展示: ${CONFIG.extraDisplaySubs.join('、')}`
            : '';
        info.innerText = `${CONFIG.name}模式 (总分: ${CONFIG.label}${displayOnlyText}, 后1/3剔除: ${CONFIG.excRate * 100}%)`;
    }
    document.querySelectorAll('.label-total').forEach(e => e.innerText = CONFIG.label);
    const excEl = document.getElementById('label-exc');
    if (excEl) excEl.innerText = (CONFIG.excRate * 100) + '%';
    if (typeof renderNavigation === 'function') renderNavigation();
    return subjectsResult;
}

// 老考试统一到当前学科口径：收敛 exam.subjects、按口径重算每个学生的 total、同步 exam.config，
// 并清掉按旧口径算出的 exam.schools（下次加载会强制重算）。只读 scores，不删任何原始分。
// 幂等：已打上 subjectPolicy 标记的考试直接跳过，ensure() 高频调用也不会重复扫全表。
function normalizeCohortExamSubjectPolicy(db) {
    const exams = db && db.exams && typeof db.exams === 'object' ? db.exams : null;
    if (!exams) return { migrated: [], totalsChanged: 0 };
    const migrated = [];
    let totalsChanged = 0;
    const totalsByExam = new Map();
    Object.entries(exams).forEach(([examId, exam]) => {
        if (!exam || typeof exam !== 'object') return;
        if (exam.subjectPolicy === SUBJECT_POLICY_VERSION) return;
        const meta = exam.meta && typeof exam.meta === 'object' ? exam.meta : {};
        const grade = (typeof getEffectiveGrade === 'function' ? getEffectiveGrade(meta) : '') || meta.grade;
        const mode = getGradeModeConfig(grade);
        const allowed = new Set(mode.analysisSubs);
        const storedSubjects = Array.isArray(exam.subjects) ? exam.subjects.filter(Boolean) : [];
        const nextSubjects = storedSubjects.filter((subject) => allowed.has(subject));
        const rows = Array.isArray(exam.data) ? exam.data : [];
        const totals = typeof normalizeStudentTotalsForCurrentConfig === 'function'
            ? normalizeStudentTotalsForCurrentConfig(rows, nextSubjects, mode)
            : { changed: 0 };
        const subjectsChanged = nextSubjects.length !== storedSubjects.length;
        if (subjectsChanged || totals.changed > 0) {
            exam.subjects = nextSubjects;
            exam.config = { ...(exam.config && typeof exam.config === 'object' ? exam.config : {}), ...mode, mode: exam.config?.mode || 'multi' };
            exam.schools = {};
            if (typeof window.computeExamDataFingerprint === 'function') {
                exam.fingerprint = window.computeExamDataFingerprint(rows);
            } else {
                delete exam.fingerprint;
            }
            exam.updatedAt = Date.now();
            totalsChanged += totals.changed || 0;
            migrated.push(examId);
            const byUuid = new Map();
            rows.forEach((row) => { if (row?.uuid) byUuid.set(row.uuid, row.total); });
            totalsByExam.set(examId, byUuid);
        }
        exam.subjectPolicy = SUBJECT_POLICY_VERSION;
    });
    // 学生名册里每条 history 也存了当次 total，跟着改，否则个人轨迹仍是旧口径。
    if (totalsByExam.size && db.students && typeof db.students === 'object') {
        Object.values(db.students).forEach((student) => {
            (Array.isArray(student?.history) ? student.history : []).forEach((entry) => {
                const byUuid = totalsByExam.get(entry?.examId);
                if (!byUuid || !byUuid.has(student.uuid)) return;
                entry.total = byUuid.get(student.uuid);
            });
            if (student?.lastExamId && totalsByExam.get(student.lastExamId)?.has(student.uuid)) {
                student.lastScore = totalsByExam.get(student.lastExamId).get(student.uuid);
            }
        });
    }
    if (migrated.length) {
        console.info(`[SubjectPolicy] 已将 ${migrated.length} 场历史考试收敛到考核口径（重算 ${totalsChanged} 条总分）`, migrated);
    }
    return { migrated, totalsChanged };
}

window.getGradeModeConfig = getGradeModeConfig;
window.normalizeCohortExamSubjectPolicy = normalizeCohortExamSubjectPolicy;

const CohortManager = {
    list: [],

    load: function () {
        try {
            this.list = JSON.parse(localStorage.getItem(COHORT_STORAGE_KEY) || '[]');
            this.list.forEach(c => { c.startGrade = 6; });
        } catch (e) {
            this.list = [];
        }
    },

    save: function () {
        localStorage.setItem(COHORT_STORAGE_KEY, JSON.stringify(this.list));
    },

    // 从云端枚举“已保存工作区”的届别（key like 'cohort::%'），把本地列表缺失的届别补进下拉。
    // 这样管理员/教务主任可直接点击有数据的届别进入，无需先“新建”一遍再切换。
    // 纯增量发现：只补 list + 重渲下拉，不触碰 switchTo / 同步 / 计算口径；失败静默降级。
    discoverCloudCohorts: async function () {
        try {
            const service = (window.CloudDataService && typeof window.CloudDataService.selectSystemData === 'function')
                ? window.CloudDataService
                : null;
            if (!service) return [];
            const { data, error } = await service.selectSystemData({
                keyLike: 'cohort::%',
                select: 'key,cohort_id,updated_at'
            });
            if (error || !Array.isArray(data)) return [];

            const discovered = new Set();
            data.forEach((row) => {
                // 仅收顶层届别工作区键 cohort::YYYY，排除 cohort::YYYY::exam:: 等分片键。
                const key = String(row && row.key || '').trim();
                const match = key.match(/^cohort::(\d{4})$/i);
                const year = match ? match[1] : String(row && row.cohort_id || '').trim();
                if (/^\d{4}$/.test(year)) discovered.add(year);
            });
            if (discovered.size === 0) return [];

            this.list = Array.isArray(this.list) ? this.list : [];
            const known = new Set(this.list.map(c => String(c && c.id || '').trim()));
            let added = 0;
            discovered.forEach((year) => {
                if (known.has(year)) return;
                this.list.push({ id: year, year: parseInt(year, 10), startGrade: 6, createdAt: Date.now(), fromCloud: true });
                added += 1;
            });
            if (added > 0) {
                // 按年份倒序，最新届别在前，和手动新建时的 unshift 语义一致。
                this.list.sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));
                this.save();
                this.renderSelector();
            }
            return Array.from(discovered);
        } catch (discoverError) {
            console.warn('[CohortManager] cloud cohort discovery failed:', discoverError);
            return [];
        }
    },

    renderSelector: function () {
        const sel = document.getElementById('cohort-selector');
        if (!sel) return;
        const current = readWorkspaceCohortId() || '';
        sel.innerHTML = '<option value="">📂 请选择届别</option>' + this.list.map(c => {
            const label = formatCohortLabel(c);
            return `<option value="${c.id}">${label}</option>`;
        }).join('');
        if (current) sel.value = current;
        sel.onchange = () => {
            if (sel.value) {
                this.switchTo(sel.value);
                setTimeout(() => scheduleTeacherSyncPrompt(), 1200);
            }
        };
        // Keep every visible cohort label on the same current-school-year
        // calculation.  This also replaces a label left in the DOM by a
        // restored page, rather than preserving the old "六年级入学" wording.
        this.syncStageLabels();
        if (typeof window.syncShellChromeBridge === 'function') {
            window.syncShellChromeBridge();
        }
    },

    syncStageLabels: function () {
        const currentId = readWorkspaceCohortId() || '';
        const currentMeta = this.list.find(item => String(item?.id || '') === String(currentId))
            || CURRENT_COHORT_META
            || null;
        if (!currentMeta) return '';
        const label = formatCohortLabel(currentMeta);
        const currentLabel = document.getElementById('cohort-current-label');
        if (currentLabel) currentLabel.innerText = label;
        const examCohortLabel = document.getElementById('exam-cohort-label');
        if (examCohortLabel) examCohortLabel.innerText = label;
        return label;
    },

    addFromUI: function () {
        const year = parseYearFromInput('cohort-year');
        const startGrade = 6;
        if (!year || year < 2000) return alert('请输入有效的入学年份');
        return this.addCohort({ year, startGrade });
    },

    addCohort: function ({ year, startGrade }, options = {}) {
        const id = String(year);
        if (this.list.some(c => c.id === id)) {
            return this.switchTo(id, options);
        }
        const meta = { id, year, startGrade, createdAt: Date.now() };
        this.list.unshift(meta);
        this.save();
        this.renderSelector();
        return this.switchTo(id, options);
    },

    switchTo: function (cohortId, options = {}) {
        if (!cohortId) return;
        const switchOptions = Object.assign({ fastEnter: true }, options || {});
        const meta = this.list.find(c => c.id === cohortId);
        if (!meta) return alert('未找到该届别');
        lockRuntimeCohortId(cohortId);
        CURRENT_COHORT_ID = cohortId;
        CURRENT_COHORT_META = meta;
        CURRENT_EXAM_ID = '';
        window.CURRENT_EXAM_ID = '';
        syncWorkspaceRuntimeState({
            currentCohortId: cohortId,
            currentCohortMeta: meta,
            currentExamId: '',
            cohortDb: COHORT_DB
        });
        rememberUserCohort(cohortId);
        const label = formatCohortLabel(meta);
        const status = document.getElementById('cohort-status');
        if (status) status.innerText = `已切换至 ${label}`;
        const currentLabel = document.getElementById('cohort-current-label');
        if (currentLabel) currentLabel.innerText = label;
        const examCohortLabel = document.getElementById('exam-cohort-label');
        if (examCohortLabel) examCohortLabel.innerText = label;
        refreshExamYearOptions(meta.year);
        this.renderSelector();
        return requestCohortSwitchRuntime(cohortId, switchOptions);
    },

    init: function () {
        this.load();
        const saved = readWorkspaceCohortId() || ensureCurrentCohortIdentity();
        if (saved) {
            CURRENT_COHORT_META = readWorkspaceCohortMeta() || CURRENT_COHORT_META;
            CURRENT_COHORT_ID = saved;
            if (!CURRENT_COHORT_META) {
                const fallbackMeta = this.list.find(c => c.id === saved) || { id: saved, year: saved, startGrade: 6 };
                CURRENT_COHORT_META = fallbackMeta;
                writeWorkspaceCohortMeta(fallbackMeta, { syncCohortId: false });
            }
            syncWorkspaceRuntimeState({
                currentCohortId: CURRENT_COHORT_ID,
                currentCohortMeta: CURRENT_COHORT_META,
                currentExamId: CURRENT_EXAM_ID,
                cohortDb: COHORT_DB
            });
        }
        if (CURRENT_COHORT_META) CURRENT_COHORT_META.startGrade = 6;
        this.renderSelector();
        if (CURRENT_COHORT_META) {
            const currentLabel = document.getElementById('cohort-current-label');
            if (currentLabel) currentLabel.innerText = formatCohortLabel(CURRENT_COHORT_META);
            const examCohortLabel = document.getElementById('exam-cohort-label');
            if (examCohortLabel) examCohortLabel.innerText = formatCohortLabel(CURRENT_COHORT_META);
        }
        // 登录后云端可用时，异步补齐“云端有数据但本地未记录”的届别到下拉。
        // 不阻塞 init；失败静默降级，保持原有本地行为。
        Promise.resolve().then(() => this.discoverCloudCohorts());
    }
};

window.CohortManager = CohortManager;
window.__COHORT_MANAGER_READY__ = true;

// A browser may restore a previously rendered app from back/forward cache, or
// stay open across the September academic-year boundary.  Rebuild the options
// when it returns so the UI never keeps a historical fixed-entry-grade label.
let cohortStageRefreshQueued = false;
function refreshCohortStageLabelsWhenVisible() {
    if (cohortStageRefreshQueued) return;
    cohortStageRefreshQueued = true;
    window.setTimeout(() => {
        cohortStageRefreshQueued = false;
        if (window.__COHORT_MANAGER_READY__ && typeof CohortManager.renderSelector === 'function') {
            CohortManager.renderSelector();
        }
    }, 0);
}

window.addEventListener('pageshow', (event) => {
    if (event.persisted) refreshCohortStageLabelsWhenVisible();
});
window.addEventListener('focus', refreshCohortStageLabelsWhenVisible);
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refreshCohortStageLabelsWhenVisible();
});

async function enterCohortFromMask(options = {}) {
    const year = parseInt(resolveMaskCohortYear(), 10);
    const startGrade = 6;
    if (!year || year < 2000) return alert('请输入有效的入学年份');
    if (!window.__COHORT_MANAGER_READY__) {
        window.setTimeout(() => enterCohortFromMask(), 60);
        return false;
    }
    lockRuntimeCohortId(String(year));
    setManualCohortSelectionGate(false);
    const entered = await CohortManager.addCohort({ year, startGrade }, {
        skipConfirm: true,
        fastEnter: options.fastEnter !== false,
        requireCloudData: options.requireCloudData === true
    });
    rememberUserCohort(String(year));
    refreshAuthRoleViewFromSession();
    return entered !== false;
}

function tryAutoEnterReadyCohortWorkspace() {
    const mask = document.getElementById('mode-mask');
    const app = document.getElementById('app');
    if (!app) return false;
    const maskVisible = !!mask && getComputedStyle(mask).display !== 'none';
    const appHidden = app.classList.contains('hidden');
    if (!maskVisible && !appHidden) return false;
    if (requiresManualCohortSelection()) return false;

    const cohortId = CURRENT_COHORT_ID || readWorkspaceCohortId();
    const examId = CURRENT_EXAM_ID || readWorkspaceExamId();
    const hasReadyData = Array.isArray(RAW_DATA) && RAW_DATA.length > 0;
    if (!cohortId || !examId || !hasReadyData) return false;

    if (mask) mask.style.display = 'none';
    app.classList.remove('hidden');
    refreshAuthRoleViewFromSession();

    if (CONFIG.name) {
        const badge = document.getElementById('mode-badge');
        if (badge) badge.innerText = CONFIG.name;
        if (typeof renderNavigation === 'function') renderNavigation();
    }

    scheduleWorkspaceUiRefresh('auto-enter-ready-cohort', { delay: 180, idle: true, timeout: 1800, renderTables: false });
    return true;
}

function parseYearFromInput(id) {
    const val = document.getElementById(id)?.value || '';
    return parseInt(val, 10);
}

function getPreferredExamName(meta, fallback = '') {
    const customName = String(meta?.name || '').trim();
    if (customName) return customName;
    const typeName = String(meta?.type || '').trim();
    return typeName || fallback;
}

function buildLegacyExamKey(meta) {
    const cohortLabel = meta.cohortId ? `${meta.cohortId}级` : '未知届别';
    const gradeLabel = meta.grade ? `${meta.grade}年级` : '未知年级';
    const base = `${cohortLabel}-${gradeLabel}-${meta.year}-${meta.term}-${meta.type}` + (meta.date ? `-${meta.date}` : '');
    return meta.name ? `${base}-${meta.name}` : base;
}

function buildExamKey(meta) {
    const cohortLabel = meta.cohortId ? `${meta.cohortId}级` : '未知届别';
    const gradeLabel = meta.grade ? `${meta.grade}年级` : '未知年级';
    const examName = getPreferredExamName(meta, '标准考试');
    return `${cohortLabel}-${gradeLabel}-${meta.year}-${meta.term}-${examName}` + (meta.date ? `-${meta.date}` : '');
}

function moveExamRecordKey(db, fromKey, toKey) {
    if (!db || !fromKey || !toKey || fromKey === toKey) return false;
    if (!db.exams?.[fromKey] || db.exams?.[toKey]) return false;
    db.exams[toKey] = {
        ...db.exams[fromKey],
        examId: toKey
    };
    delete db.exams[fromKey];
    if (db.currentExamId === fromKey) db.currentExamId = toKey;
    if (Array.isArray(db.resetPoints)) {
        db.resetPoints = db.resetPoints.map((examId) => (examId === fromKey ? toKey : examId));
    }
    const lockState = readArchiveLockState();
    if (lockState.lockedKey === fromKey) {
        writeArchiveLockState(lockState.locked, toKey);
    }
    return true;
}

function isSameExamMomentMeta(leftMeta, rightMeta) {
    if (!leftMeta || !rightMeta) return false;
    const leftCohort = String(leftMeta.cohortId || '').trim();
    const rightCohort = String(rightMeta.cohortId || '').trim();
    const leftYear = String(leftMeta.year || '').trim();
    const rightYear = String(rightMeta.year || '').trim();
    const leftTerm = String(leftMeta.term || '').trim();
    const rightTerm = String(rightMeta.term || '').trim();
    const leftDate = String(leftMeta.date || '').trim();
    const rightDate = String(rightMeta.date || '').trim();
    const leftGrade = String(getEffectiveGrade(leftMeta) || leftMeta.grade || '').trim();
    const rightGrade = String(getEffectiveGrade(rightMeta) || rightMeta.grade || '').trim();
    return !!leftCohort
        && !!leftYear
        && !!leftTerm
        && !!leftDate
        && leftCohort === rightCohort
        && leftYear === rightYear
        && leftTerm === rightTerm
        && leftDate === rightDate
        && leftGrade === rightGrade;
}

function migrateSameMomentExamKey(meta, nextKey) {
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    if (!db || !meta || !nextKey || db.exams?.[nextKey]) return;
    const matchedEntry = Object.entries(db.exams || {})
        .filter(([examId, exam]) => examId !== nextKey && isSameExamMomentMeta(meta, exam?.meta || {}))
        .sort((a, b) => Number(b?.[1]?.createdAt || 0) - Number(a?.[1]?.createdAt || 0))[0];
    if (!matchedEntry) return;
    moveExamRecordKey(db, matchedEntry[0], nextKey);
}

function migrateLegacyExamKey(meta, nextKey) {
    const legacyKey = buildLegacyExamKey(meta);
    if (!legacyKey || !nextKey || legacyKey === nextKey) return;

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    moveExamRecordKey(db, legacyKey, nextKey);
}

function getIsoDateTimestamp(value) {
    const text = String(value || '').trim();
    if (!text) return 0;
    const match = text.match(/(\d{4}-\d{2}-\d{2})(?!.*\d{4}-\d{2}-\d{2})/);
    const dateText = match ? match[1] : (/^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '');
    if (!dateText) return 0;
    const ts = Date.parse(`${dateText}T00:00:00`);
    return Number.isNaN(ts) ? 0 : ts;
}

function getExamRecordDateSortTimestamp(examId, exam = {}) {
    const meta = exam?.meta || {};
    const candidates = [
        meta?.date,
        exam?.date,
        exam?.examDate,
        exam?.examFullKey,
        exam?.examLabel,
        examId
    ];
    for (const candidate of candidates) {
        const ts = getIsoDateTimestamp(candidate);
        if (ts > 0) return ts;
    }
    if (typeof getExamSortTimestamp === 'function') {
        const fallback = Number(exam?.updatedAt || exam?.createdAt || 0);
        const ts = getExamSortTimestamp(examId, fallback);
        if (Number.isFinite(ts) && ts > 0) return ts;
    }
    const raw = exam?.updatedAt || exam?.createdAt || exam?.student?.updatedAt || 0;
    const numeric = Number(raw);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    const parsed = new Date(raw).getTime();
    return Number.isFinite(parsed) ? parsed : 0;
}

function compareExamRecordsByDateDesc(left, right) {
    const [leftId, leftExam] = left || [];
    const [rightId, rightExam] = right || [];
    const leftTs = getExamRecordDateSortTimestamp(leftId, leftExam);
    const rightTs = getExamRecordDateSortTimestamp(rightId, rightExam);
    if (leftTs !== rightTs) return rightTs - leftTs;
    const leftUpdated = Number(leftExam?.updatedAt || leftExam?.createdAt || 0);
    const rightUpdated = Number(rightExam?.updatedAt || rightExam?.createdAt || 0);
    if (leftUpdated !== rightUpdated) return rightUpdated - leftUpdated;
    return String(rightId || '').localeCompare(String(leftId || ''), 'zh-CN');
}

function compareExamRecordsByDateAsc(left, right) {
    const desc = compareExamRecordsByDateDesc(left, right);
    return desc === 0 ? 0 : -desc;
}

function getLatestExamRecordId(exams = {}) {
    return Object.entries(exams || {}).sort(compareExamRecordsByDateDesc)[0]?.[0] || '';
}

if (typeof window !== 'undefined') {
    window.getExamRecordDateSortTimestamp = getExamRecordDateSortTimestamp;
    window.compareExamRecordsByDateDesc = compareExamRecordsByDateDesc;
    window.compareExamRecordsByDateAsc = compareExamRecordsByDateAsc;
    window.getLatestExamRecordId = getLatestExamRecordId;
}

function getExamMetaFromUI() {
    window.getExamMetaFromUI = getExamMetaFromUI;
    const year = document.getElementById('exam-year')?.value || '';
    const term = document.getElementById('exam-term')?.value || '';
    const type = document.getElementById('exam-type')?.value || '';
    const date = document.getElementById('exam-date')?.value || '';
    const name = (document.getElementById('exam-name')?.value || '').trim();
    const resetPoint = document.getElementById('exam-reset-point')?.checked || false;
    const cohortId = CURRENT_COHORT_ID || '';
    const cohortMeta = CURRENT_COHORT_META || null;
    const grade = computeCohortGrade(cohortMeta, { year, term, type, name, date });
    const examName = getPreferredExamName({ type, name });
    return { year, term, type, name, examName, date, cohortId, grade, resetPoint };
}

function refreshExamGradePreview() {
    const meta = getExamMetaFromUI();
    const gradeEl = document.getElementById('exam-grade-label');
    if (gradeEl) gradeEl.textContent = meta.grade || '-';
}
window.refreshExamGradePreview = window.refreshExamGradePreview || refreshExamGradePreview;

function onExamTermChange() {
    const meta = getExamMetaFromUI();
    if (!meta.cohortId || !meta.year || !meta.term) {
        appDebug('⏸️ 学期信息不完整，暂不加载教师数据');
        return;
    }

    const termId = buildTeacherTermId(meta);
    const baseTerm = getTeacherTermBase(termId);

    appDebug(`📅 学期已选择：${termId}，准备加载教师任课数据...`);

    syncTeacherTermStorage(termId);

    const teacherTermSel = document.getElementById('dm-teacher-term-select');
    if (teacherTermSel) {
        for (let i = 0; i < teacherTermSel.options.length; i++) {
            if (teacherTermSel.options[i].value === termId ||
                teacherTermSel.options[i].value === baseTerm) {
                teacherTermSel.value = teacherTermSel.options[i].value;
                break;
            }
        }
    }

    const db = CohortDB.ensure();
    const resolved = resolveTeacherHistoryEntry(termId);

    if (resolved) {
        syncTeacherTermStorage(resolved.key);
        setTeacherMap(JSON.parse(JSON.stringify(resolved.map || {})));
        setTeacherSchoolMap(JSON.parse(JSON.stringify(resolved.schoolMap || {})));
        if (window.DataManager && typeof DataManager.renderTeachers === 'function') {
            DataManager.renderTeachers();
        }
        appDebug(`✅ 已从本地历史加载 ${resolved.key} 的任课表（${Object.keys(resolved.map || {}).length}条）`);
        if (window.UI) UI.toast(`✅ 已加载该学期任课表（${Object.keys(resolved.map || {}).length}条）`, 'success');
    } else {
        appDebug(`⚠️ 本地无 ${baseTerm} 的任课数据，尝试从云端加载...`);
        if (window.DataManager && typeof DataManager.renderTeachers === 'function') {
            DataManager.renderTeachers();
        }

        if (!shouldAutoLoadTeacherData()) {
            appDebug('⏸️ 当前不在教师/数据模块，暂不自动拉取云端任课表');
        } else if (window.CloudManager && typeof CloudManager.loadTeachers === 'function') {
            if (window.UI) UI.toast('🔄 正在从云端加载该学期的教师任课数据...', 'info');
            CloudManager.loadTeachers({ background: true }).then(() => {
                appDebug('✅ 云端数据加载完成');
                const newMap = window.TEACHER_MAP || {};
                if (Object.keys(newMap).length > 0) {
                    if (window.UI) UI.toast(`✅ 已从云端加载任课表（${Object.keys(newMap).length}条）`, 'success');
                } else {
                    if (window.UI) UI.toast('ℹ️ 该学期暂无任课数据', 'info');
                }
            }).catch(err => {
                console.warn('云端加载失败:', err);
                if (window.UI) UI.toast('☁️ 云端暂无该学期任课数据', 'warning');
            });
        }
    }

    if (window.DataManager && typeof DataManager.refreshTeacherAnalysis === 'function') {
        DataManager.refreshTeacherAnalysis();
    }
}
window.onExamTermChange = window.onExamTermChange || onExamTermChange;

function getAutoRestoreExamId(db, cohortId = '') {
    const sourceDb = db && typeof db === 'object' ? db : null;
    if (!sourceDb || !sourceDb.exams || typeof sourceDb.exams !== 'object') return '';
    const normalizedCohortId = String(cohortId || CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
    const entries = Object.entries(sourceDb.exams)
        .filter((exam) => {
            const [examKey, examValue] = exam || [];
            const examId = String(examValue?.examId || examKey || '').trim();
            const rows = Array.isArray(examValue?.data) ? examValue.data : [];
            if (!examId || rows.length === 0) return false;
            if (!normalizedCohortId) return true;
            const examCohortId = normalizeCompareCohortId(
                examValue?.meta?.cohortId
                || (typeof inferCohortIdFromValue === 'function' ? inferCohortIdFromValue(examId) : '')
                || ''
            );
            return !examCohortId || examCohortId === normalizedCohortId;
        })
        .sort(compareExamRecordsByDateDesc);
    if (!entries.length) return '';
    return String(entries[0]?.[1]?.examId || entries[0]?.[0] || '').trim();
}

function ensureWorkspaceDefaultSchool() {
    const current = String(readCurrentSchool() || '').trim();
    if (current) return current;

    const candidateSet = new Set();
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const boundSchool = String(user?.school || '').trim();
    const inferredSchool = typeof inferDefaultSchoolFromContext === 'function'
        ? String(inferDefaultSchoolFromContext() || '').trim()
        : '';
    const schoolNames = new Set(Object.keys(SCHOOLS || {}).map((school) => String(school || '').trim()).filter(Boolean));
    const findAvailableSchool = (preferred) => {
        const value = String(preferred || '').trim();
        if (!value) return '';
        if (schoolNames.has(value)) return value;
        const matcher = typeof sameAppSchoolName === 'function'
            ? sameAppSchoolName
            : ((left, right) => String(left || '').trim() === String(right || '').trim());
        return Array.from(schoolNames).find((school) => matcher(school, value)) || '';
    };

    const defaultSchool = findAvailableSchool(DEFAULT_MY_SCHOOL_NAME);
    if (defaultSchool) candidateSet.add(defaultSchool);
    if (boundSchool && boundSchool !== '教育局') candidateSet.add(boundSchool);
    if (inferredSchool) candidateSet.add(inferredSchool);
    Object.keys(SCHOOLS || {})
        .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'))
        .forEach((school) => {
            const normalized = String(school || '').trim();
            if (normalized) candidateSet.add(normalized);
        });

    const fallbackSchool = Array.from(candidateSet).map(findAvailableSchool).find(Boolean) || '';
    if (!fallbackSchool) return '';

    writeCurrentSchool(fallbackSchool);
    ['mySchoolSelect', 'sel-school'].forEach((id) => {
        const select = document.getElementById(id);
        if (!select) return;
        const optionHit = Array.from(select.options || []).find((option) => String(option.value || '').trim() === fallbackSchool);
        if (optionHit) {
            select.value = optionHit.value;
            if (id === 'mySchoolSelect') {
                select.dispatchEvent(new Event('change'));
            }
        }
    });
    return fallbackSchool;
}

function hasUsableProcessedSchoolMetrics(schools) {
    const entries = Object.values((schools && typeof schools === 'object') ? schools : {});
    if (!entries.length) return false;
    return entries.some((school) => {
        const totalMetrics = school?.metrics?.total;
        if (!totalMetrics || typeof totalMetrics !== 'object') return false;
        const count = Number(totalMetrics.count);
        const avg = Number(totalMetrics.avg);
        return Number.isFinite(count) && count > 0 && Number.isFinite(avg);
    });
}

function tryAutoRestoreWorkspaceExam(options = {}) {
    if (isScoreImportInProgress()) {
        appDebug('[upload] skipped auto restore while score import is in progress', window.__SCORE_IMPORT_IN_PROGRESS__);
        return false;
    }
    const db = COHORT_DB || ((typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null);
    if (!db) return false;

    const normalizedCohortId = normalizeCompareCohortId(options.cohortId || CURRENT_COHORT_ID || readWorkspaceCohortId() || '');
    const preferredExamId = String(
        options.preferredExamId
        || db.currentExamId
        || CURRENT_EXAM_ID
        || readWorkspaceExamId()
        || ''
    ).trim();
    const preferredExamCohortId = normalizeCompareCohortId(typeof inferCohortIdFromValue === 'function' ? inferCohortIdFromValue(preferredExamId) : '');
    const preferredMatchesCohort = !normalizedCohortId || !preferredExamCohortId || preferredExamCohortId === normalizedCohortId;
    const activeCid = normalizeCompareCohortId(CURRENT_COHORT_META?.id || '');
    if (normalizedCohortId && activeCid !== normalizedCohortId) ensureCohortRegistered(normalizedCohortId);
    const currentRows = Array.isArray(RAW_DATA) ? RAW_DATA : [];
    const currentSchoolMetricsReady = hasUsableProcessedSchoolMetrics(SCHOOLS);
    if (preferredExamId && db.exams?.[preferredExamId] && currentRows.length > 0 && preferredMatchesCohort) {
        const preferredMeta = db.exams[preferredExamId].meta || {};
        const effectiveGrade = String(getEffectiveGrade(preferredMeta) || '').trim();
        if ((effectiveGrade && String(preferredMeta.grade || '').trim() !== effectiveGrade) || !currentSchoolMetricsReady) {
            if (typeof CohortDB?.applyExamToWorkspace === 'function') {
                CohortDB.applyExamToWorkspace(preferredExamId, {
                    renderTables: false,
                    recalculate: !currentSchoolMetricsReady
                });
            }
        }
        if (!persistWorkspaceExamIdentity(preferredExamId, db, { cohortId: normalizedCohortId })) return false;
        ensureWorkspaceDefaultSchool();
        return true;
    }

    const autoExamId = preferredExamId && db.exams?.[preferredExamId] && preferredMatchesCohort
        ? preferredExamId
        : getAutoRestoreExamId(db, options.cohortId);
    if (!autoExamId || typeof CohortDB === 'undefined' || typeof CohortDB.applyExamToWorkspace !== 'function') {
        return false;
    }

    db.currentExamId = autoExamId;
    window.COHORT_DB = db;
    if (!CohortDB.applyExamToWorkspace(autoExamId, {
        renderTables: false,
        recalculate: false
    })) return false;
    if (!persistWorkspaceExamIdentity(autoExamId, db, { cohortId: normalizedCohortId })) return false;

    ensureWorkspaceDefaultSchool();
    if (typeof CohortDB.renderExamList === 'function') CohortDB.renderExamList();
    if (typeof updateExamHistoryStatusBar === 'function') updateExamHistoryStatusBar();
    return true;
}

function setCurrentExamMeta(silent = false) {
    const meta = getExamMetaFromUI();
    if (!meta.cohortId) return alert("请先选择届别");
    if (!meta.year || !meta.term || !meta.type) return alert("请完整选择学年/学期/考试类型");
    if (!meta.date) return alert("请填写考试日期");
    const key = buildExamKey(meta);
    migrateLegacyExamKey(meta, key);
    migrateSameMomentExamKey(meta, key);
    const effectiveGrade = getEffectiveGrade(meta);
    if (effectiveGrade && meta.grade !== effectiveGrade) meta.grade = effectiveGrade;
    CURRENT_EXAM_ID = key;
    writeWorkspaceExamId(key);
    writeArchiveMeta(meta);
    if (COHORT_DB) COHORT_DB.currentExamId = key;
    syncExamRuntimeState({ archiveMeta: meta });
    syncRuntimeStateToWindow();
    applyModeByGrade(effectiveGrade || meta.grade);
    applyExamMetaUI();
    CohortDB.renderExamList();
    if (!silent && window.UI) UI.toast(`✅ 当前考试已设置: ${key}`, 'success');
    return key;
}

function applyExamMetaUI() {
    let meta = readArchiveMeta();
    if (meta) {
        const yearEl = document.getElementById('exam-year');
        const termEl = document.getElementById('exam-term');
        const typeEl = document.getElementById('exam-type');
        const dateEl = document.getElementById('exam-date');
        const nameEl = document.getElementById('exam-name');
        const resetEl = document.getElementById('exam-reset-point');
        if (yearEl && meta.year) yearEl.value = meta.year;
        if (termEl && meta.term) termEl.value = meta.term;
        if (typeEl && meta.type) typeEl.value = meta.type;
        if (dateEl && meta.date) dateEl.value = meta.date;
        if (nameEl && meta.name) nameEl.value = meta.name;
        if (resetEl) resetEl.checked = !!meta.resetPoint;
        if (CURRENT_COHORT_META) {
            const recalculated = computeCohortGrade(CURRENT_COHORT_META, meta);
            if (recalculated && meta.grade !== recalculated) {
                meta = { ...meta, grade: recalculated };
                writeArchiveMeta(meta);
            }
        }
    }
    const key = readWorkspaceExamId() || '未设置';
    const keyEl = document.getElementById('exam-key-display');
    if (keyEl) keyEl.textContent = key;
    const gradeEl = document.getElementById('exam-grade-label');
    if (gradeEl) gradeEl.textContent = meta ? (meta.grade || '-') : '-';
    const cohortLabel = document.getElementById('exam-cohort-label');
    if (cohortLabel) {
        if (CURRENT_COHORT_META) cohortLabel.textContent = formatCohortLabel(CURRENT_COHORT_META);
        else if (meta && meta.cohortId) cohortLabel.textContent = `${meta.cohortId}级`;
        else cohortLabel.textContent = '未选择';
    }
    if (CURRENT_COHORT_META?.year) refreshExamYearOptions(CURRENT_COHORT_META.year);
    const statusEl = document.getElementById('exam-archive-status');
    if (statusEl) statusEl.textContent = isArchiveLocked() ? '已封存(只读)' : '未封存';
    refreshExamGradePreview();
    updateIndicatorUIState();
}

function isArchiveLocked() {
    return isArchiveLockedState(readWorkspaceExamId());
}

async function archiveCurrentExam() {
    if (!RAW_DATA.length) return alert("当前无成绩数据，无法封存");
    if (isArchiveLocked()) return alert("当前考试已封存，无需重复操作");
    if (!(await UI.confirm("⚠️ 封存后将进入只读模式，避免误改历史数据。确定封存吗？", {
        title: '确认封存考试',
        confirmText: '封存'
    }))) return;

    const meta = getExamMetaFromUI();
    if (!meta.year || !meta.term || !meta.type) return alert("请先设置学年/学期/考试类型");
    const key = buildExamKey(meta);
    migrateLegacyExamKey(meta, key);
    CURRENT_EXAM_ID = key;
    writeWorkspaceExamId(key);
    writeArchiveMeta(meta);
    if (COHORT_DB) COHORT_DB.currentExamId = key;
    syncExamRuntimeState({ archiveMeta: meta });
    syncRuntimeStateToWindow();

    await saveCloudData({ mode: 'exam' });
    await saveCloudData({ mode: 'workspace' });
    createAutoSnapshot(getCurrentSnapshotPayload());

    writeArchiveLockState(true, key);
    applyExamMetaUI();
    applyArchiveLockUI();
    if (window.UI) UI.toast("✅ 已封存并进入只读模式", "success");
    if (window.Logger) Logger.log('封存考试', `封存考试 ${key}`);
}

async function unlockArchive() {
    if (!isArchiveLocked()) return alert("当前未封存");
    if (!(await UI.confirm("⚠️ 解除封存将允许编辑历史数据，是否继续？", {
        title: '解除封存',
        confirmText: '解除'
    }))) return;
    writeArchiveLockState(false, '');
    applyExamMetaUI();
    applyArchiveLockUI();
    if (window.UI) UI.toast("✅ 已解除封存", "success");
    if (window.Logger) Logger.log('解除封存', '解除封存只读模式');
}

function applyArchiveLockUI() {
    const locked = isArchiveLocked();
    const lockNotice = locked ? '⛔ 当前考试已封存，只读模式' : '';
    const statusEl = document.getElementById('exam-archive-status');
    if (statusEl) statusEl.textContent = locked ? '已封存(只读)' : '未封存';

    document.querySelectorAll('[data-upload-box], #uploadBox').forEach((uploadBox) => {
        uploadBox.style.pointerEvents = locked ? 'none' : 'auto';
        uploadBox.style.opacity = locked ? '0.6' : '1';
        uploadBox.title = lockNotice;
    });
    const ids = ['fileInput', 'teacherFileInput', 'projectFileInput', 'btn-reset-system', 'btn-save-project', 'btn-load-project'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !!locked;
    });
    if (typeof updateUploadWorkbenchStatus === 'function') updateUploadWorkbenchStatus();
}
