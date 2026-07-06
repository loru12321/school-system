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

function formatCohortLabel(meta) {
    if (!meta || !meta.year) return '未选择';
    return `${meta.year}级 (六年级入学)`;
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

function getTeacherTermBase(termId) {
    const text = String(termId || '').trim();
    if (!text) return '';
    const parts = text.split('_').filter(Boolean);
    if (parts.length >= 2 && /^\d{4}-\d{4}$/.test(parts[0])) {
        return parts.slice(0, 2).join('_');
    }
    return text;
}

function getPreferredTeacherTermId() {
    const uiMeta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
    const uiTeacherTermId = buildTeacherTermId(uiMeta);
    const termSel = document.getElementById('dm-teacher-term-select');
    return String(
        termSel?.value
        || readCurrentTeacherTermId()
        || uiTeacherTermId
        || readCurrentTermId()
        || ''
    ).trim();
}

function syncTeacherTermStorage(termId) {
    return syncTeacherTermRuntimeState(termId);
}

function getTeacherTermCandidates(termId) {
    const preferred = String(termId || '').trim();
    const uiMeta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
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
        savedTeacherTermId,
        uiTeacherTermId,
        getTeacherTermBase(preferred),
        getTeacherTermBase(savedTeacherTermId),
        getTeacherTermBase(uiTeacherTermId),
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
    const saved = String(localStorage.getItem(key) || '').trim();
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
        if (knownIds.includes(saved) && saved !== current) {
            CohortManager.switchTo(saved);
            rememberUserCohort(saved);
            return;
        }
        if (saved === current && restoreActiveCohortUI(saved)) {
            rememberUserCohort(saved);
            return;
        }
        localStorage.removeItem(key);
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

function showCohortPicker() {
    const mask = document.getElementById('mode-mask');
    const app = document.getElementById('app');
    if (mask) mask.remove();
    if (app) app.classList.remove('hidden');
    setManualCohortSelectionGate(false);

    const year = parseInt(resolveMaskCohortYear(), 10);
    if (year && year >= 2000 && window.__COHORT_MANAGER_READY__) {
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

function applyModeByGrade(grade) {
    const isGrade9 = String(grade) === '9';
    if (isGrade9) {
        setConfigState({ name: '9年级', label: '五科总', excRate: 0.06, totalSubs: ['语文', '数学', '英语', '物理', '化学'], analysisSubs: ['语文', '数学', '英语', '物理', '化学'], extraDisplaySubs: ['政治'], showQuery: true, mode: CONFIG.mode || 'multi' });
    } else {
        setConfigState({ name: '6-8年级', label: '全科总', excRate: 0.05, totalSubs: 'auto', analysisSubs: 'auto', extraDisplaySubs: [], showQuery: true, mode: CONFIG.mode || 'multi' });
    }
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
    renderNavigation();
}

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
        syncShellChromeBridge();
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
        return switchCohort(cohortId, switchOptions);
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
    }
};

window.CohortManager = CohortManager;
window.__COHORT_MANAGER_READY__ = true;

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
    await CohortManager.addCohort({ year, startGrade }, {
        skipConfirm: true,
        fastEnter: options.fastEnter !== false,
        requireCloudData: options.requireCloudData === true
    });
    rememberUserCohort(String(year));
    refreshAuthRoleViewFromSession();
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
        setTeacherMap({});
        setTeacherSchoolMap({});
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
    if (!CohortDB.applyExamToWorkspace(autoExamId, { renderTables: false })) return false;
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
