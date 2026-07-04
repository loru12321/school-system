
const UI = Object.assign(window.UI || {}, {
    loading: (show, text = '系统正在处理数据...') => {
        const loader = document.getElementById('global-loader');
        const txt = document.getElementById('loader-text');
        if (show) {
            if (window.__BOOT_BACKGROUND_HYDRATING__ === true && sessionStorage.getItem('CURRENT_USER')) return;
            if (txt) txt.innerText = text;
            if (loader) {
                loader.classList.remove('hidden');
                loader.style.display = 'flex';
                loader.style.opacity = '1';
            }
        } else {
            setTimeout(() => {
                if (loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => {
                        loader.style.display = 'none';
                        loader.classList.add('hidden');
                    }, 300);
                }
            }, 200); // 稍微延迟防止闪烁
        }
    },
    toast: (msg, type = 'info') => {
        const container = document.getElementById('toast-container');
        const div = document.createElement('div');
        let icon = 'ℹ️';
        if (type === 'success' || msg.includes('成功') || msg.includes('✅')) { type = 'success'; icon = '✅'; }
        if (type === 'error' || msg.includes('失败') || msg.includes('错误') || msg.includes('❌')) { type = 'error'; icon = '❌'; }
        div.className = `toast-msg toast-${type}`;
        div.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
        container.appendChild(div);
        setTimeout(() => {
            div.style.opacity = '0';
            div.style.transform = 'translateY(-20px)';
            setTimeout(() => div.remove(), 300);
        }, 3000);
    }
});
window.UI = UI;


const EdgeGateway = window.EdgeGateway || {};
if (!window.EdgeGateway) window.EdgeGateway = EdgeGateway;

const AuthState = window.AuthState || {
    MASKED_PASSWORD_DISPLAY: '已设置(不显示明文)',
    ROLE_HIERARCHY: ['admin', 'director', 'grade_director', 'class_teacher', 'teacher', 'parent', 'student', 'guest'],
    sanitizeLocalAuthDb: function (rawDb) { return rawDb && typeof rawDb === 'object' ? rawDb : {}; },
    persistLocalAuthDb: function (rawDb) {
        const safeDb = rawDb && typeof rawDb === 'object' ? rawDb : {};
        localStorage.setItem('SYS_USERS', JSON.stringify(safeDb));
        return safeDb;
    },
    readLocalAuthDb: function () {
        return this.sanitizeLocalAuthDb(JSON.parse(localStorage.getItem('SYS_USERS')) || {
            admin: { pass: this.MASKED_PASSWORD_DISPLAY },
            teachers: [],
            parents: []
        });
    },
    getCurrentUser: function () {
        try {
            const raw = sessionStorage.getItem('CURRENT_USER');
            if (!raw) return null;
            const user = JSON.parse(raw);
            if (!user || typeof user !== 'object') return null;
            const roles = this.getUserRoles(user);
            return {
                ...user,
                roles,
                role: this.getPrimaryRole({ ...user, roles })
            };
        } catch {
            return null;
        }
    },
    setCurrentUser: function (user) {
        if (!user) return this.clearCurrentUser();
        const normalizedUser = {
            ...user,
            roles: this.getUserRoles(user)
        };
        normalizedUser.role = this.getPrimaryRole(normalizedUser);
        sessionStorage.setItem('CURRENT_USER', JSON.stringify(normalizedUser));
        sessionStorage.setItem('CURRENT_ROLE', normalizedUser.role);
        sessionStorage.setItem('CURRENT_ROLES', JSON.stringify(normalizedUser.roles));
        return normalizedUser;
    },
    clearCurrentUser: function () {
        sessionStorage.removeItem('CURRENT_USER');
        sessionStorage.removeItem('CURRENT_ROLE');
        sessionStorage.removeItem('CURRENT_ROLES');
    },
    hasActiveSession: function (user) {
        return !!(user || this.getCurrentUser());
    },
    getUserRoles: function (user) {
        if (!user) return ['guest'];
        const rawRoles = Array.isArray(user.roles) && user.roles.length ? user.roles : [user.role];
        const roles = rawRoles
            .map(role => String(role || '').trim())
            .filter(Boolean);
        return roles.length ? Array.from(new Set(roles)) : ['guest'];
    },
    getPrimaryRole: function (user) {
        const roles = this.getUserRoles(user);
        for (const role of this.ROLE_HIERARCHY) {
            if (roles.includes(role)) return role;
        }
        return roles[0] || 'guest';
    },
    hasRole: function (user, roleName) {
        return this.getUserRoles(user).includes(roleName);
    },
    hasAnyRole: function (user, roleNames) {
        const expectedRoles = Array.isArray(roleNames) ? roleNames : [roleNames];
        const roleSet = new Set(this.getUserRoles(user));
        return expectedRoles.some(role => roleSet.has(role));
    },
    hasAllRoles: function (user, roleNames) {
        const expectedRoles = Array.isArray(roleNames) ? roleNames : [roleNames];
        const roleSet = new Set(this.getUserRoles(user));
        return expectedRoles.every(role => roleSet.has(role));
    },
    applyRolesToBody: function (user) {
        if (!user) return;
        const primaryRole = this.getPrimaryRole(user);
        const roles = this.getUserRoles(user);
        document.body.dataset.role = primaryRole;
        Array.from(document.body.classList)
            .filter(className => /^role-/.test(className))
            .forEach(className => document.body.classList.remove(className));
        roles.forEach(role => document.body.classList.add(`role-${role}`));
        return primaryRole;
    },
    getDefaultManagedPassword: function (role) {
        return '';
    },
    isDefaultManagedPassword: function (role, password) {
        const defaultPassword = this.getDefaultManagedPassword(role);
        return !!defaultPassword && String(password || '').trim() === defaultPassword;
    },
    getManagedAccountPassword: function (record, role) {
        return String(record?.pass || '').trim();
    },
    matchesManagedPassword: function (record, role, password) {
        return this.getManagedAccountPassword(record, role) === String(password || '').trim();
    },
    normalizeManagedClass: function (value) {
        if (typeof AuthState !== 'undefined' && AuthState && typeof AuthState.normalizeClassName === 'function') {
            return AuthState.normalizeClassName(value);
        }
        return normalizeClass(value);
    },
    areEquivalentClasses: function (left, right) {
        if (typeof AuthState !== 'undefined' && AuthState && typeof AuthState.areEquivalentClasses === 'function') {
            return AuthState.areEquivalentClasses(left, right);
        }
        return normalizeClass(left) === normalizeClass(right);
    },
    findManagedAccount: function (authDb, username, className) {
        const safeDb = authDb && typeof authDb === 'object' ? authDb : { teachers: [], parents: [] };
        const normalizedName = String(username || '').trim();
        const normalizedClass = this.normalizeManagedClass(className);
        const rawClass = String(className || '').trim();
        const parent = (safeDb.parents || []).find(item => {
            if (String(item?.name || '').trim() !== normalizedName) return false;
            const recordClass = String(item?.class || '').trim();
            const normalizedRecordClass = this.normalizeManagedClass(recordClass);
            if (normalizedClass && normalizedRecordClass) {
                return this.areEquivalentClasses(normalizedRecordClass, normalizedClass);
            }
            return recordClass === rawClass;
        });
        if (parent) return { role: 'parent', record: parent };
        const teacher = (safeDb.teachers || []).find(item => String(item?.name || '').trim() === normalizedName);
        if (teacher) return { role: 'teacher', record: teacher };
        return null;
    },
    syncParentMobileScrollRoot: function (enabled) {
        const shouldEnable = !!enabled && window.matchMedia && window.matchMedia('(max-width: 960px)').matches;
        document.documentElement.classList.toggle('parent-mobile-scroll-root', shouldEnable);
        document.body.classList.toggle('parent-mobile-scroll-root', shouldEnable);
    }
};

function getManagedPasswordStatus(record) {
    if (!record || typeof record !== 'object') return '未设置';
    const explicit = String(record.password_display || '').trim();
    if (explicit) return explicit;
    if (record.has_password === true || Number(record.has_password || 0) > 0) {
        return AuthState.MASKED_PASSWORD_DISPLAY;
    }
    if (String(record.password_hash || '').trim()) {
        return AuthState.MASKED_PASSWORD_DISPLAY;
    }
    return '未设置';
}

function isParentLikeRole(role) {
    return PermissionPolicy.isParentLikeRole(role);
}

function isParentLikeUser(user) {
    return PermissionPolicy.isParentLikeUser(user);
}

function applyRoleAllowVisibility(root = document) {
    return PermissionPolicy.applyRoleAllowVisibility(root);
}

const MASKED_PASSWORD_DISPLAY = AuthState.MASKED_PASSWORD_DISPLAY;
const sanitizeLocalAuthDb = AuthState.sanitizeLocalAuthDb.bind(AuthState);
const persistLocalAuthDb = AuthState.persistLocalAuthDb.bind(AuthState);
const createManagedTemporaryPassword = AuthState.createManagedTemporaryPassword.bind(AuthState);
const getRecoverableManagedPassword = AuthState.getRecoverableManagedPassword.bind(AuthState);
const WorkspaceStateRuntime = window.WorkspaceState || null;

function readWorkspaceProjectKey() {
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.getCurrentProjectKey === 'function') {
        return String(WorkspaceStateRuntime.getCurrentProjectKey() || '').trim();
    }
    return String(localStorage.getItem('CURRENT_PROJECT_KEY') || window.CURRENT_PROJECT_KEY || '').trim();
}

function readWorkspaceCohortId() {
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.getCurrentCohortId === 'function') {
        return String(WorkspaceStateRuntime.getCurrentCohortId() || '').trim();
    }
    return String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
}

function readWorkspaceCohortMeta() {
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
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.getCurrentExamId === 'function') {
        return String(WorkspaceStateRuntime.getCurrentExamId() || '').trim();
    }
    return String(window.CURRENT_EXAM_ID || localStorage.getItem('CURRENT_EXAM_ID') || '').trim();
}

function readWorkspaceCohortDb() {
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.getCohortDb === 'function') {
        return WorkspaceStateRuntime.getCohortDb() || null;
    }
    return window.COHORT_DB || null;
}

function readWorkspaceSnapshot() {
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.snapshotWorkspaceState === 'function') {
        return WorkspaceStateRuntime.snapshotWorkspaceState();
    }
    return {
        currentProjectKey: readWorkspaceProjectKey(),
        currentCohortId: readWorkspaceCohortId(),
        currentCohortMeta: readWorkspaceCohortMeta(),
        currentExamId: readWorkspaceExamId(),
        cohortDb: readWorkspaceCohortDb()
    };
}

function normalizeCohortGuardId(value) {
    const inferred = (typeof inferCohortIdFromValue === 'function' ? inferCohortIdFromValue(value) : '') || value;
    const text = String(inferred || '').trim();
    return /^\d{4}$/.test(text) ? text : '';
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

function isCrossCohortRuntimeValue(value, guardId = getRuntimeCohortGuardId()) {
    const incoming = normalizeCohortGuardId(value);
    return !!guardId && !!incoming && incoming !== guardId;
}

window.lockRuntimeCohortId = lockRuntimeCohortId;
window.getRuntimeCohortGuardId = getRuntimeCohortGuardId;

function writeWorkspaceProjectKey(key) {
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.setCurrentProjectKey === 'function') {
        return WorkspaceStateRuntime.setCurrentProjectKey(key);
    }
    const nextKey = String(key || '').trim();
    if (!nextKey) {
        localStorage.removeItem('CURRENT_PROJECT_KEY');
        try {
            delete window.CURRENT_PROJECT_KEY;
        } catch (e) {
            window.CURRENT_PROJECT_KEY = '';
        }
        return '';
    }
    localStorage.setItem('CURRENT_PROJECT_KEY', nextKey);
    window.CURRENT_PROJECT_KEY = nextKey;
    return nextKey;
}

function writeWorkspaceCohortId(cohortId, options = {}) {
    const nextId = String(cohortId || '').trim();
    if (!options.allowCrossCohort && isCrossCohortRuntimeValue(nextId)) {
        console.warn('[WorkspaceState] blocked cross-cohort cohort identity write', {
            lockedCohortId: getRuntimeCohortGuardId(),
            incomingCohortId: nextId
        });
        return readWorkspaceCohortId();
    }
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.setCurrentCohortId === 'function') {
        return WorkspaceStateRuntime.setCurrentCohortId(cohortId, options);
    }
    if (!nextId) {
        localStorage.removeItem('CURRENT_COHORT_ID');
        try {
            delete window.CURRENT_COHORT_ID;
        } catch (e) {
            window.CURRENT_COHORT_ID = '';
        }
        if (options.syncProjectKey !== false) writeWorkspaceProjectKey('');
        return '';
    }
    localStorage.setItem('CURRENT_COHORT_ID', nextId);
    window.CURRENT_COHORT_ID = nextId;
    lockRuntimeCohortId(nextId);
    if (options.syncProjectKey !== false) writeWorkspaceProjectKey(`cohort::${nextId}`);
    return nextId;
}

function writeWorkspaceCohortMeta(meta, options = {}) {
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
    const nextExamId = String(examId || '').trim();
    if (!isCrossCohortRuntimeValue(nextExamId)) {
        const examCohortId = normalizeCohortGuardId(nextExamId);
        if (examCohortId) lockRuntimeCohortId(examCohortId);
    } else {
        console.warn('[WorkspaceState] blocked cross-cohort exam identity write', {
            lockedCohortId: getRuntimeCohortGuardId(),
            incomingExamId: nextExamId
        });
        return readWorkspaceExamId();
    }
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.setCurrentExamId === 'function') {
        return WorkspaceStateRuntime.setCurrentExamId(examId);
    }
    if (!nextExamId) {
        localStorage.removeItem('CURRENT_EXAM_ID');
        try {
            delete window.CURRENT_EXAM_ID;
        } catch (e) {
            window.CURRENT_EXAM_ID = '';
        }
        return '';
    }
    localStorage.setItem('CURRENT_EXAM_ID', nextExamId);
    window.CURRENT_EXAM_ID = nextExamId;
    return nextExamId;
}

function persistWorkspaceExamIdentity(examId, db = COHORT_DB, options = {}) {
    const nextExamId = String(examId || '').trim();
    if (!nextExamId) return '';
    const normalizedCohortId = normalizeCompareCohortId(options.cohortId || CURRENT_COHORT_ID || readWorkspaceCohortId() || '');
    const examCohortId = normalizeCompareCohortId(
        typeof inferCohortIdFromValue === 'function' ? inferCohortIdFromValue(nextExamId) : ''
    );
    if (normalizedCohortId && examCohortId && normalizedCohortId !== examCohortId && options.allowCrossCohort !== true) {
        console.warn('[WorkspaceState] blocked cross-cohort restored exam identity', {
            cohortId: normalizedCohortId,
            examId: nextExamId,
            examCohortId
        });
        return '';
    }
    const persistedExamId = String(writeWorkspaceExamId(nextExamId) || '').trim();
    if (persistedExamId !== nextExamId) return '';
    CURRENT_EXAM_ID = nextExamId;
    window.CURRENT_EXAM_ID = nextExamId;
    if (db && typeof db === 'object') {
        db.currentExamId = nextExamId;
        window.COHORT_DB = db;
    }
    if (options.sync !== false && typeof syncRuntimeStateToWindow === 'function') syncRuntimeStateToWindow();
    return nextExamId;
}
window.persistWorkspaceExamIdentity = window.persistWorkspaceExamIdentity || persistWorkspaceExamIdentity;

function writeWorkspaceCohortDb(db) {
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.setCohortDb === 'function') {
        return WorkspaceStateRuntime.setCohortDb(db);
    }
    window.COHORT_DB = db || null;
    return window.COHORT_DB;
}

function syncWorkspaceRuntimeState(patch = {}) {
    const next = patch && typeof patch === 'object' ? patch : {};
    const guardId = getRuntimeCohortGuardId();
    if (guardId) {
        const incomingCohortId = Object.prototype.hasOwnProperty.call(next, 'currentCohortId')
            ? normalizeCohortGuardId(next.currentCohortId)
            : '';
        const incomingExamCohortId = Object.prototype.hasOwnProperty.call(next, 'currentExamId')
            ? normalizeCohortGuardId(next.currentExamId)
            : '';
        const incomingProjectCohortId = Object.prototype.hasOwnProperty.call(next, 'currentProjectKey')
            ? normalizeCohortGuardId(next.currentProjectKey)
            : '';
        const mismatch = [incomingCohortId, incomingExamCohortId, incomingProjectCohortId]
            .filter(Boolean)
            .find(id => id !== guardId);
        if (mismatch) {
            console.warn('[WorkspaceState] blocked cross-cohort workspace sync', {
                lockedCohortId: guardId,
                incomingCohortId,
                incomingExamCohortId,
                incomingProjectCohortId
            });
            return readWorkspaceSnapshot();
        }
    }
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.syncWorkspaceState === 'function') {
        return WorkspaceStateRuntime.syncWorkspaceState(patch);
    }
    if (Object.prototype.hasOwnProperty.call(next, 'cohortDb')) writeWorkspaceCohortDb(next.cohortDb);
    if (Object.prototype.hasOwnProperty.call(next, 'currentCohortId')) writeWorkspaceCohortId(next.currentCohortId, { syncProjectKey: false });
    if (Object.prototype.hasOwnProperty.call(next, 'currentCohortMeta')) writeWorkspaceCohortMeta(next.currentCohortMeta, { syncCohortId: false });
    if (Object.prototype.hasOwnProperty.call(next, 'currentExamId')) writeWorkspaceExamId(next.currentExamId);
    const projectKey = Object.prototype.hasOwnProperty.call(next, 'currentProjectKey')
        ? String(next.currentProjectKey || '').trim()
        : (readWorkspaceCohortId() ? `cohort::${readWorkspaceCohortId()}` : readWorkspaceProjectKey());
    writeWorkspaceProjectKey(projectKey);
    return readWorkspaceSnapshot();
}

function clearWorkspaceRuntimeIdentity(options = {}) {
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
const ExamStateRuntime = window.ExamState || null;

function readArchiveMeta() {
    if (ExamStateRuntime && typeof ExamStateRuntime.getArchiveMeta === 'function') {
        return ExamStateRuntime.getArchiveMeta() || null;
    }
    if (window.ARCHIVE_META && typeof window.ARCHIVE_META === 'object') return window.ARCHIVE_META;
    try {
        return JSON.parse(localStorage.getItem('ARCHIVE_META') || 'null');
    } catch (e) {
        return null;
    }
}

function writeArchiveMeta(meta) {
    if (ExamStateRuntime && typeof ExamStateRuntime.setArchiveMeta === 'function') {
        return ExamStateRuntime.setArchiveMeta(meta);
    }
    if (!meta || typeof meta !== 'object') {
        localStorage.removeItem('ARCHIVE_META');
        window.ARCHIVE_META = null;
        return null;
    }
    const nextMeta = { ...meta };
    localStorage.setItem('ARCHIVE_META', JSON.stringify(nextMeta));
    window.ARCHIVE_META = nextMeta;
    return nextMeta;
}

function readCurrentTermId() {
    if (ExamStateRuntime && typeof ExamStateRuntime.getCurrentTermId === 'function') {
        return String(ExamStateRuntime.getCurrentTermId() || '').trim();
    }
    return String(window.CURRENT_TERM_ID || localStorage.getItem('CURRENT_TERM_ID') || '').trim();
}

function writeCurrentTermId(termId) {
    if (ExamStateRuntime && typeof ExamStateRuntime.setCurrentTermId === 'function') {
        return ExamStateRuntime.setCurrentTermId(termId);
    }
    const nextTermId = String(termId || '').trim();
    if (!nextTermId) {
        localStorage.removeItem('CURRENT_TERM_ID');
        window.CURRENT_TERM_ID = '';
        return '';
    }
    localStorage.setItem('CURRENT_TERM_ID', nextTermId);
    window.CURRENT_TERM_ID = nextTermId;
    return nextTermId;
}

function readCurrentTeacherTermId() {
    if (ExamStateRuntime && typeof ExamStateRuntime.getCurrentTeacherTermId === 'function') {
        return String(ExamStateRuntime.getCurrentTeacherTermId() || '').trim();
    }
    return String(window.CURRENT_TEACHER_TERM_ID || localStorage.getItem('CURRENT_TEACHER_TERM_ID') || '').trim();
}

function writeCurrentTeacherTermId(termId, options = {}) {
    if (ExamStateRuntime && typeof ExamStateRuntime.setCurrentTeacherTermId === 'function') {
        return ExamStateRuntime.setCurrentTeacherTermId(termId, options);
    }
    const nextTeacherTermId = String(termId || '').trim();
    if (!nextTeacherTermId) {
        localStorage.removeItem('CURRENT_TEACHER_TERM_ID');
        window.CURRENT_TEACHER_TERM_ID = '';
        if (options.syncBaseTerm === true) writeCurrentTermId('');
        return '';
    }
    localStorage.setItem('CURRENT_TEACHER_TERM_ID', nextTeacherTermId);
    window.CURRENT_TEACHER_TERM_ID = nextTeacherTermId;
    return nextTeacherTermId;
}

function syncTeacherTermRuntimeState(termId) {
    if (ExamStateRuntime && typeof ExamStateRuntime.syncTeacherTerm === 'function') {
        return ExamStateRuntime.syncTeacherTerm(termId);
    }
    const exactTermId = String(termId || '').trim();
    if (!exactTermId) {
        writeCurrentTeacherTermId('', { syncBaseTerm: true });
        return { exactTermId: '', baseTermId: '' };
    }
    const baseTermId = getTeacherTermBase(exactTermId);
    writeCurrentTeacherTermId(exactTermId, { syncBaseTerm: false });
    if (baseTermId) writeCurrentTermId(baseTermId);
    return { exactTermId, baseTermId };
}

function readArchiveLockState() {
    if (ExamStateRuntime && typeof ExamStateRuntime.getArchiveLocked === 'function' && typeof ExamStateRuntime.getArchiveLockedKey === 'function') {
        return {
            locked: ExamStateRuntime.getArchiveLocked(),
            lockedKey: String(ExamStateRuntime.getArchiveLockedKey() || '').trim()
        };
    }
    return {
        locked: localStorage.getItem('ARCHIVE_LOCKED') === 'true',
        lockedKey: String(localStorage.getItem('ARCHIVE_LOCKED_KEY') || '').trim()
    };
}

function writeArchiveLockState(locked, lockedKey = '') {
    if (ExamStateRuntime && typeof ExamStateRuntime.setArchiveLock === 'function') {
        return ExamStateRuntime.setArchiveLock(locked, lockedKey);
    }
    localStorage.setItem('ARCHIVE_LOCKED', locked ? 'true' : 'false');
    window.ARCHIVE_LOCKED = locked ? 'true' : 'false';
    if (!locked || !String(lockedKey || '').trim()) {
        localStorage.removeItem('ARCHIVE_LOCKED_KEY');
        window.ARCHIVE_LOCKED_KEY = '';
        return { locked: !!locked, lockedKey: '' };
    }
    localStorage.setItem('ARCHIVE_LOCKED_KEY', String(lockedKey).trim());
    window.ARCHIVE_LOCKED_KEY = String(lockedKey).trim();
    return { locked: !!locked, lockedKey: String(lockedKey).trim() };
}

function isArchiveLockedState(currentExamId) {
    if (ExamStateRuntime && typeof ExamStateRuntime.isArchiveLocked === 'function') {
        return ExamStateRuntime.isArchiveLocked(currentExamId);
    }
    const lockState = readArchiveLockState();
    const targetExamId = String(currentExamId || readWorkspaceExamId() || '').trim();
    return !!(lockState.locked && lockState.lockedKey && targetExamId && lockState.lockedKey === targetExamId);
}

function syncExamRuntimeState(patch = {}) {
    if (ExamStateRuntime && typeof ExamStateRuntime.syncExamState === 'function') {
        return ExamStateRuntime.syncExamState(patch);
    }
    const next = patch && typeof patch === 'object' ? patch : {};
    if (Object.prototype.hasOwnProperty.call(next, 'archiveMeta')) writeArchiveMeta(next.archiveMeta);
    if (Object.prototype.hasOwnProperty.call(next, 'currentTeacherTermId')) {
        syncTeacherTermRuntimeState(next.currentTeacherTermId);
    } else if (Object.prototype.hasOwnProperty.call(next, 'currentTermId')) {
        writeCurrentTermId(next.currentTermId);
    }
    if (Object.prototype.hasOwnProperty.call(next, 'archiveLocked') || Object.prototype.hasOwnProperty.call(next, 'archiveLockedKey')) {
        writeArchiveLockState(!!next.archiveLocked, next.archiveLockedKey || '');
    }
    return {
        archiveMeta: readArchiveMeta(),
        currentTermId: readCurrentTermId(),
        currentTeacherTermId: readCurrentTeacherTermId(),
        archiveLocked: readArchiveLockState().locked,
        archiveLockedKey: readArchiveLockState().lockedKey
    };
}

function clearExamRuntimeState(options = {}) {
    if (ExamStateRuntime && typeof ExamStateRuntime.clearExamState === 'function') {
        return ExamStateRuntime.clearExamState(options);
    }
    localStorage.removeItem('ARCHIVE_META');
    localStorage.removeItem('ARCHIVE_LOCKED');
    localStorage.removeItem('ARCHIVE_LOCKED_KEY');
    window.ARCHIVE_META = null;
    window.ARCHIVE_LOCKED = '';
    window.ARCHIVE_LOCKED_KEY = '';
    if (!options.keepTermIds) {
        localStorage.removeItem('CURRENT_TERM_ID');
        localStorage.removeItem('CURRENT_TEACHER_TERM_ID');
        window.CURRENT_TERM_ID = '';
        window.CURRENT_TEACHER_TERM_ID = '';
    }
    return syncExamRuntimeState({});
}

const DEFAULT_MY_SCHOOL_NAME = String(window.DEFAULT_MY_SCHOOL_NAME || '银山实验').trim();
window.DEFAULT_MY_SCHOOL_NAME = DEFAULT_MY_SCHOOL_NAME;
const SchoolStateRuntime = window.SchoolState || null;

function readCurrentSchool() {
    const nextSchool = SchoolStateRuntime && typeof SchoolStateRuntime.getCurrentSchool === 'function'
        ? String(SchoolStateRuntime.getCurrentSchool() || '').trim()
        : String(
            (typeof MY_SCHOOL !== 'undefined' ? MY_SCHOOL : '')
            || window.MY_SCHOOL
            || localStorage.getItem('MY_SCHOOL')
            || DEFAULT_MY_SCHOOL_NAME
        ).trim();
    if (typeof MY_SCHOOL !== 'undefined') MY_SCHOOL = nextSchool;
    window.MY_SCHOOL = nextSchool;
    if (nextSchool) {
        try { localStorage.setItem('MY_SCHOOL', nextSchool); } catch (_) {}
    }
    return nextSchool;
}

function writeCurrentSchool(school) {
    const nextSchool = String(school || '').trim() || DEFAULT_MY_SCHOOL_NAME;
    if (SchoolStateRuntime && typeof SchoolStateRuntime.setCurrentSchool === 'function') {
        SchoolStateRuntime.setCurrentSchool(nextSchool);
    } else {
        localStorage.setItem('MY_SCHOOL', nextSchool);
        window.MY_SCHOOL = nextSchool;
    }
    if (typeof MY_SCHOOL !== 'undefined') MY_SCHOOL = nextSchool;
    window.MY_SCHOOL = nextSchool;
    return nextSchool;
}

function clearCurrentSchool() {
    if (SchoolStateRuntime && typeof SchoolStateRuntime.clearCurrentSchool === 'function') {
        SchoolStateRuntime.clearCurrentSchool();
    } else {
        localStorage.setItem('MY_SCHOOL', DEFAULT_MY_SCHOOL_NAME);
        window.MY_SCHOOL = DEFAULT_MY_SCHOOL_NAME;
    }
    if (typeof MY_SCHOOL !== 'undefined') MY_SCHOOL = DEFAULT_MY_SCHOOL_NAME;
    window.MY_SCHOOL = DEFAULT_MY_SCHOOL_NAME;
    return DEFAULT_MY_SCHOOL_NAME;
}

function normalizeAppSchoolName(value) {
    const text = String(value || '').trim();
    if (typeof window.normalizeSchoolName === 'function') return window.normalizeSchoolName(text) || text;
    if (typeof normalizeSchoolName === 'function') return normalizeSchoolName(text) || text;
    return text;
}

function sameAppSchoolName(left, right) {
    const leftName = String(left || '').trim();
    const rightName = String(right || '').trim();
    if (!leftName || !rightName) return false;
    if (leftName === rightName) return true;
    if (window.PermissionPolicy && typeof window.PermissionPolicy.sameSchoolName === 'function') {
        return window.PermissionPolicy.sameSchoolName(leftName, rightName);
    }
    if (typeof window.areSchoolNamesEquivalent === 'function') return window.areSchoolNamesEquivalent(leftName, rightName);
    if (typeof areSchoolNamesEquivalent === 'function') return areSchoolNamesEquivalent(leftName, rightName);
    return normalizeAppSchoolName(leftName) === normalizeAppSchoolName(rightName);
}

function readAppSchools(schools) {
    if (schools && typeof schools === 'object' && !Array.isArray(schools)) return schools;
    if (window.SCHOOLS && typeof window.SCHOOLS === 'object') return window.SCHOOLS;
    if (typeof SCHOOLS !== 'undefined' && SCHOOLS && typeof SCHOOLS === 'object') return SCHOOLS;
    return {};
}

function resolveAppSchoolKey(schoolName, schools) {
    const targetSchool = String(schoolName || '').trim();
    const schoolMap = readAppSchools(schools);
    if (!targetSchool || !schoolMap || typeof schoolMap !== 'object') return '';
    if (Object.prototype.hasOwnProperty.call(schoolMap, targetSchool)) return targetSchool;
    const keyMatch = Object.keys(schoolMap).find(key => sameAppSchoolName(key, targetSchool));
    if (keyMatch) return keyMatch;
    const namedMatch = Object.entries(schoolMap).find(([, schoolData]) => sameAppSchoolName(schoolData?.name, targetSchool));
    return namedMatch?.[0] || '';
}

function getAppSchoolRecord(schoolName, schools) {
    const schoolMap = readAppSchools(schools);
    const key = resolveAppSchoolKey(schoolName, schoolMap);
    return key ? schoolMap[key] : null;
}

function filterRowsByAppSchool(rows, schoolName) {
    const targetSchool = String(schoolName || '').trim();
    const sourceRows = Array.isArray(rows) ? rows : [];
    if (!targetSchool) return sourceRows;
    return sourceRows.filter(row => sameAppSchoolName(row?.school, targetSchool));
}

function isConcreteSchoolCandidate(schoolName) {
    const name = String(schoolName || '').trim();
    return !!name && name !== '教育局' && !/教育局|教体局|教委/.test(name);
}

function getAvailableSchoolNamesForDefault() {
    const names = new Set();
    const add = (value) => {
        const name = String(value || '').trim();
        if (isConcreteSchoolCandidate(name)) names.add(name);
    };
    if (typeof listAvailableSchoolsForCompare === 'function') {
        listAvailableSchoolsForCompare('all').forEach(add);
    }
    Object.keys(readAppSchools()).forEach(add);
    (Array.isArray(window.RAW_DATA) ? window.RAW_DATA : []).forEach(row => add(row?.school));
    return Array.from(names);
}

function findAvailableSchool(targetSchool, schoolNames = getAvailableSchoolNamesForDefault()) {
    const target = String(targetSchool || '').trim();
    if (!target) return '';
    return (schoolNames || []).find(school => sameAppSchoolName(school, target) || school === target) || '';
}

function ensureWorkspaceDefaultSchool() {
    const schoolNames = getAvailableSchoolNamesForDefault();
    const candidateSet = new Set();
    const defaultSchool = findAvailableSchool(DEFAULT_MY_SCHOOL_NAME);
    if (defaultSchool) candidateSet.add(defaultSchool);
    const currentSchool = findAvailableSchool(readCurrentSchool(), schoolNames);
    if (currentSchool) candidateSet.add(currentSchool);
    try {
        const user = getCurrentUser();
        const boundSchool = String(user?.school || '').trim();
        if (boundSchool && boundSchool !== '教育局') {
            const boundMatch = findAvailableSchool(boundSchool, schoolNames);
            if (boundMatch) candidateSet.add(boundMatch);
        }
    } catch (_) {}
    const nextSchool = Array.from(candidateSet).find(isConcreteSchoolCandidate)
        || defaultSchool
        || schoolNames.find(isConcreteSchoolCandidate)
        || DEFAULT_MY_SCHOOL_NAME;
    return writeCurrentSchool(nextSchool);
}

Object.assign(window, {
    normalizeAppSchoolName,
    sameAppSchoolName,
    readAppSchools,
    resolveAppSchoolKey,
    getAppSchoolRecord,
    filterRowsByAppSchool,
    ensureWorkspaceDefaultSchool
});

const TeacherStateRuntime = window.TeacherState || null;

function readTeacherMap() {
    const nextMap = TeacherStateRuntime && typeof TeacherStateRuntime.getTeacherMap === 'function'
        ? (TeacherStateRuntime.getTeacherMap() || {})
        : (window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object' ? window.TEACHER_MAP : (
            typeof TEACHER_MAP !== 'undefined' && TEACHER_MAP && typeof TEACHER_MAP === 'object' ? TEACHER_MAP : {}
        ));
    if (typeof TEACHER_MAP !== 'undefined') TEACHER_MAP = nextMap;
    window.TEACHER_MAP = nextMap;
    return nextMap;
}

function setTeacherMap(map) {
    const nextMap = TeacherStateRuntime && typeof TeacherStateRuntime.setTeacherMap === 'function'
        ? (TeacherStateRuntime.setTeacherMap(map) || {})
        : (map && typeof map === 'object' ? map : {});
    if (typeof TEACHER_MAP !== 'undefined') TEACHER_MAP = nextMap;
    window.TEACHER_MAP = nextMap;
    return nextMap;
}

function readTeacherSchoolMap() {
    const nextSchoolMap = TeacherStateRuntime && typeof TeacherStateRuntime.getTeacherSchoolMap === 'function'
        ? (TeacherStateRuntime.getTeacherSchoolMap() || {})
        : (window.TEACHER_SCHOOL_MAP && typeof window.TEACHER_SCHOOL_MAP === 'object' ? window.TEACHER_SCHOOL_MAP : (
            typeof TEACHER_SCHOOL_MAP !== 'undefined' && TEACHER_SCHOOL_MAP && typeof TEACHER_SCHOOL_MAP === 'object' ? TEACHER_SCHOOL_MAP : {}
        ));
    if (typeof TEACHER_SCHOOL_MAP !== 'undefined') TEACHER_SCHOOL_MAP = nextSchoolMap;
    window.TEACHER_SCHOOL_MAP = nextSchoolMap;
    return nextSchoolMap;
}

function setTeacherSchoolMap(map) {
    const nextSchoolMap = TeacherStateRuntime && typeof TeacherStateRuntime.setTeacherSchoolMap === 'function'
        ? (TeacherStateRuntime.setTeacherSchoolMap(map) || {})
        : (map && typeof map === 'object' ? map : {});
    if (typeof TEACHER_SCHOOL_MAP !== 'undefined') TEACHER_SCHOOL_MAP = nextSchoolMap;
    window.TEACHER_SCHOOL_MAP = nextSchoolMap;
    return nextSchoolMap;
}

function readTeacherStats() {
    const nextStats = TeacherStateRuntime && typeof TeacherStateRuntime.peekTeacherStats === 'function'
        ? (TeacherStateRuntime.peekTeacherStats() || {})
        : TeacherStateRuntime && typeof TeacherStateRuntime.getTeacherStats === 'function'
            ? (TeacherStateRuntime.getTeacherStats() || {})
        : (window.TEACHER_STATS && typeof window.TEACHER_STATS === 'object' ? window.TEACHER_STATS : (
            typeof TEACHER_STATS !== 'undefined' && TEACHER_STATS && typeof TEACHER_STATS === 'object' ? TEACHER_STATS : {}
        ));
    if (typeof TEACHER_STATS !== 'undefined') TEACHER_STATS = nextStats;
    window.TEACHER_STATS = nextStats;
    return nextStats;
}

function setTeacherStats(stats) {
    const nextStats = TeacherStateRuntime && typeof TeacherStateRuntime.setTeacherStats === 'function'
        ? (TeacherStateRuntime.setTeacherStats(stats) || {})
        : (stats && typeof stats === 'object' ? stats : {});
    if (typeof TEACHER_STATS !== 'undefined') TEACHER_STATS = nextStats;
    window.TEACHER_STATS = nextStats;
    return nextStats;
}

function syncTeacherRuntimeState(patch = {}) {
    if (TeacherStateRuntime && typeof TeacherStateRuntime.syncTeacherState === 'function') {
        const snapshot = TeacherStateRuntime.syncTeacherState(patch);
        if (typeof TEACHER_MAP !== 'undefined') TEACHER_MAP = snapshot.teacherMap || {};
        if (typeof TEACHER_SCHOOL_MAP !== 'undefined') TEACHER_SCHOOL_MAP = snapshot.teacherSchoolMap || {};
        if (typeof TEACHER_STATS !== 'undefined') TEACHER_STATS = snapshot.teacherStats || {};
        window.TEACHER_MAP = TEACHER_MAP;
        window.TEACHER_SCHOOL_MAP = TEACHER_SCHOOL_MAP;
        window.TEACHER_STATS = TEACHER_STATS;
        return snapshot;
    }
    return {
        teacherMap: setTeacherMap(patch.teacherMap ?? patch.TEACHER_MAP ?? readTeacherMap()),
        teacherSchoolMap: setTeacherSchoolMap(patch.teacherSchoolMap ?? patch.TEACHER_SCHOOL_MAP ?? readTeacherSchoolMap()),
        teacherStats: setTeacherStats(patch.teacherStats ?? patch.TEACHER_STATS ?? readTeacherStats())
    };
}

function clearTeacherRuntimeState(options = {}) {
    if (TeacherStateRuntime && typeof TeacherStateRuntime.clearTeacherState === 'function') {
        return syncTeacherRuntimeState(TeacherStateRuntime.clearTeacherState(options));
    }
    setTeacherMap({});
    setTeacherSchoolMap({});
    if (!options.keepStats) setTeacherStats({});
    return {
        teacherMap: readTeacherMap(),
        teacherSchoolMap: readTeacherSchoolMap(),
        teacherStats: readTeacherStats()
    };
}

window.readTeacherMap = readTeacherMap;
window.setTeacherMap = setTeacherMap;
window.readTeacherSchoolMap = readTeacherSchoolMap;
window.setTeacherSchoolMap = setTeacherSchoolMap;
window.readTeacherStats = readTeacherStats;
window.setTeacherStats = setTeacherStats;

const DataStateRuntime = window.DataState || null;

function readRawData() {
    const nextRows = DataStateRuntime && typeof DataStateRuntime.getRawData === 'function'
        ? (DataStateRuntime.getRawData() || [])
        : (window.RAW_DATA && Array.isArray(window.RAW_DATA) ? window.RAW_DATA : (
            typeof RAW_DATA !== 'undefined' && Array.isArray(RAW_DATA) ? RAW_DATA : []
        ));
    if (typeof RAW_DATA !== 'undefined') RAW_DATA = nextRows;
    window.RAW_DATA = nextRows;
    return nextRows;
}

function setRawData(rows) {
    if (Array.isArray(rows) && rows.length > 0) {
        const guardId = getRuntimeCohortGuardId();
        const activeExamId = window.CURRENT_EXAM_ID || readWorkspaceExamId();
        const activeExamCohortId = normalizeCohortGuardId(activeExamId);
        if (guardId && activeExamCohortId && activeExamCohortId !== guardId) {
            console.warn('[DataRuntime] blocked cross-cohort raw data write', {
                lockedCohortId: guardId,
                activeExamId,
                activeExamCohortId
            });
            return readRawData();
        }
    }
    const nextRows = DataStateRuntime && typeof DataStateRuntime.setRawData === 'function'
        ? (DataStateRuntime.setRawData(rows) || [])
        : (Array.isArray(rows) ? rows : []);
    if (typeof RAW_DATA !== 'undefined') RAW_DATA = nextRows;
    window.RAW_DATA = nextRows;
    window.__RAW_DATA_VERSION = (Number(window.__RAW_DATA_VERSION) || 0) + 1;
    return nextRows;
}

function readSchools() {
    const nextSchools = DataStateRuntime && typeof DataStateRuntime.getSchools === 'function'
        ? (DataStateRuntime.getSchools() || {})
        : (window.SCHOOLS && typeof window.SCHOOLS === 'object' ? window.SCHOOLS : (
            typeof SCHOOLS !== 'undefined' && SCHOOLS && typeof SCHOOLS === 'object' ? SCHOOLS : {}
        ));
    if (typeof SCHOOLS !== 'undefined') SCHOOLS = nextSchools;
    window.SCHOOLS = nextSchools;
    return nextSchools;
}

function setSchools(schools) {
    const nextSchools = DataStateRuntime && typeof DataStateRuntime.setSchools === 'function'
        ? (DataStateRuntime.setSchools(schools) || {})
        : (schools && typeof schools === 'object' && !Array.isArray(schools) ? schools : {});
    if (typeof SCHOOLS !== 'undefined') SCHOOLS = nextSchools;
    window.SCHOOLS = nextSchools;
    return nextSchools;
}

function readSubjects() {
    const nextSubjects = DataStateRuntime && typeof DataStateRuntime.getSubjects === 'function'
        ? (DataStateRuntime.getSubjects() || [])
        : (window.SUBJECTS && Array.isArray(window.SUBJECTS) ? window.SUBJECTS : (
            typeof SUBJECTS !== 'undefined' && Array.isArray(SUBJECTS) ? SUBJECTS : []
        ));
    if (typeof SUBJECTS !== 'undefined') SUBJECTS = nextSubjects;
    window.SUBJECTS = nextSubjects;
    return nextSubjects;
}

function setSubjects(subjects) {
    const nextSubjects = DataStateRuntime && typeof DataStateRuntime.setSubjects === 'function'
        ? (DataStateRuntime.setSubjects(subjects) || [])
        : (Array.isArray(subjects) ? subjects : []);
    if (typeof SUBJECTS !== 'undefined') SUBJECTS = nextSubjects;
    window.SUBJECTS = nextSubjects;
    return nextSubjects;
}

function readThresholds() {
    const nextThresholds = DataStateRuntime && typeof DataStateRuntime.getThresholds === 'function'
        ? (DataStateRuntime.getThresholds() || {})
        : (window.THRESHOLDS && typeof window.THRESHOLDS === 'object' ? window.THRESHOLDS : (
            typeof THRESHOLDS !== 'undefined' && THRESHOLDS && typeof THRESHOLDS === 'object' ? THRESHOLDS : {}
        ));
    if (typeof THRESHOLDS !== 'undefined') THRESHOLDS = nextThresholds;
    window.THRESHOLDS = nextThresholds;
    return nextThresholds;
}

function setThresholds(thresholds) {
    const nextThresholds = DataStateRuntime && typeof DataStateRuntime.setThresholds === 'function'
        ? (DataStateRuntime.setThresholds(thresholds) || {})
        : (thresholds && typeof thresholds === 'object' && !Array.isArray(thresholds) ? thresholds : {});
    if (typeof THRESHOLDS !== 'undefined') THRESHOLDS = nextThresholds;
    window.THRESHOLDS = nextThresholds;
    return nextThresholds;
}

function readConfigState() {
    const nextConfig = DataStateRuntime && typeof DataStateRuntime.getConfig === 'function'
        ? (DataStateRuntime.getConfig() || {})
        : (window.CONFIG && typeof window.CONFIG === 'object' ? window.CONFIG : (
            typeof CONFIG !== 'undefined' && CONFIG && typeof CONFIG === 'object' ? CONFIG : {}
        ));
    if (typeof CONFIG !== 'undefined') CONFIG = nextConfig;
    window.CONFIG = nextConfig;
    return nextConfig;
}

function setConfigState(config) {
    const nextConfig = DataStateRuntime && typeof DataStateRuntime.setConfig === 'function'
        ? (DataStateRuntime.setConfig(config) || {})
        : (config && typeof config === 'object' && !Array.isArray(config) ? config : {});
    if (typeof CONFIG !== 'undefined') CONFIG = nextConfig;
    window.CONFIG = nextConfig;
    return nextConfig;
}

function syncDataRuntimeState(patch = {}) {
    const incomingRows = patch.rawData ?? patch.RAW_DATA;
    const incomingHasRows = Array.isArray(incomingRows) && incomingRows.length > 0;
    const activeCohortId = getRuntimeCohortGuardId()
        || window.CURRENT_COHORT_ID
        || readWorkspaceCohortId();
    const incomingCohortId = getSnapshotPayloadCohortId({
        CURRENT_COHORT_ID: patch.currentCohortId || patch.CURRENT_COHORT_ID || '',
        CURRENT_EXAM_ID: patch.currentExamId || patch.CURRENT_EXAM_ID || window.CURRENT_EXAM_ID || readWorkspaceExamId(),
        CURRENT_PROJECT_KEY: patch.currentProjectKey || patch.CURRENT_PROJECT_KEY || ''
    });
    if (incomingHasRows && activeCohortId && incomingCohortId && String(activeCohortId) !== String(incomingCohortId)) {
        console.warn('[DataRuntime] blocked cross-cohort data write', { activeCohortId, incomingCohortId });
        return {
            rawData: readRawData(),
            schools: readSchools(),
            subjects: readSubjects(),
            thresholds: readThresholds(),
            config: readConfigState()
        };
    }
    if (DataStateRuntime && typeof DataStateRuntime.syncDataState === 'function') {
        const snapshot = DataStateRuntime.syncDataState(patch);
        if (typeof RAW_DATA !== 'undefined') RAW_DATA = snapshot.rawData || [];
        if (typeof SCHOOLS !== 'undefined') SCHOOLS = snapshot.schools || {};
        if (typeof SUBJECTS !== 'undefined') SUBJECTS = snapshot.subjects || [];
        if (typeof THRESHOLDS !== 'undefined') THRESHOLDS = snapshot.thresholds || {};
        if (typeof CONFIG !== 'undefined') CONFIG = snapshot.config || {};
        window.RAW_DATA = RAW_DATA;
        window.SCHOOLS = SCHOOLS;
        window.SUBJECTS = SUBJECTS;
        window.THRESHOLDS = THRESHOLDS;
        window.CONFIG = CONFIG;
        return snapshot;
    }
    return {
        rawData: setRawData(patch.rawData ?? patch.RAW_DATA ?? readRawData()),
        schools: setSchools(patch.schools ?? patch.SCHOOLS ?? readSchools()),
        subjects: setSubjects(patch.subjects ?? patch.SUBJECTS ?? readSubjects()),
        thresholds: setThresholds(patch.thresholds ?? patch.THRESHOLDS ?? readThresholds()),
        config: setConfigState(patch.config ?? patch.CONFIG ?? readConfigState())
    };
}

function clearDataRuntimeState(options = {}) {
    if (DataStateRuntime && typeof DataStateRuntime.clearDataState === 'function') {
        return syncDataRuntimeState(DataStateRuntime.clearDataState(options));
    }
    setRawData([]);
    setSchools({});
    setSubjects([]);
    setThresholds({});
    if (!options.keepConfig) setConfigState({});
    return {
        rawData: readRawData(),
        schools: readSchools(),
        subjects: readSubjects(),
        thresholds: readThresholds(),
        config: readConfigState()
    };
}

window.readRawData = readRawData;
window.setRawData = setRawData;
window.readSchools = readSchools;
window.setSchools = setSchools;
window.readSubjects = readSubjects;
window.setSubjects = setSubjects;
window.readThresholds = readThresholds;
window.setThresholds = setThresholds;
window.readConfigState = readConfigState;
window.setConfigState = setConfigState;

const SupportStateRuntime = window.SupportState || null;

function ensureSupportSysVars() {
    if (SupportStateRuntime && typeof SupportStateRuntime.ensureSysVars === 'function') {
        return SupportStateRuntime.ensureSysVars();
    }
    window.SYS_VARS = window.SYS_VARS || {};
    if (!window.SYS_VARS.indicator || typeof window.SYS_VARS.indicator !== 'object') window.SYS_VARS.indicator = { ind1: '', ind2: '' };
    if (!window.SYS_VARS.targets || typeof window.SYS_VARS.targets !== 'object') window.SYS_VARS.targets = {};
    if (!Array.isArray(window.SYS_VARS.schoolAliases)) window.SYS_VARS.schoolAliases = [];
    if (!window.SYS_VARS.dataManagerSyncState || typeof window.SYS_VARS.dataManagerSyncState !== 'object') window.SYS_VARS.dataManagerSyncState = {};
    return window.SYS_VARS;
}

function readIndicatorState() {
    const nextIndicator = SupportStateRuntime && typeof SupportStateRuntime.getIndicator === 'function'
        ? (SupportStateRuntime.getIndicator() || { ind1: '', ind2: '' })
        : (ensureSupportSysVars().indicator || { ind1: '', ind2: '' });
    ensureSupportSysVars().indicator = nextIndicator;
    return nextIndicator;
}

function setIndicatorState(indicator) {
    const nextIndicator = SupportStateRuntime && typeof SupportStateRuntime.setIndicator === 'function'
        ? (SupportStateRuntime.setIndicator(indicator) || { ind1: '', ind2: '' })
        : {
            ind1: String(indicator?.ind1 || '').trim(),
            ind2: String(indicator?.ind2 || '').trim()
        };
    ensureSupportSysVars().indicator = nextIndicator;
    return nextIndicator;
}

function readTargetsState() {
    const nextTargets = SupportStateRuntime && typeof SupportStateRuntime.getTargets === 'function'
        ? (SupportStateRuntime.getTargets() || {})
        : (window.TARGETS && typeof window.TARGETS === 'object' ? window.TARGETS : (typeof TARGETS !== 'undefined' && TARGETS && typeof TARGETS === 'object' ? TARGETS : {}));
    if (typeof TARGETS !== 'undefined') TARGETS = nextTargets;
    window.TARGETS = nextTargets;
    ensureSupportSysVars().targets = nextTargets;
    return nextTargets;
}

function setTargetsState(targets) {
    const nextTargets = SupportStateRuntime && typeof SupportStateRuntime.setTargets === 'function'
        ? (SupportStateRuntime.setTargets(targets) || {})
        : (targets && typeof targets === 'object' && !Array.isArray(targets) ? targets : {});
    if (typeof TARGETS !== 'undefined') TARGETS = nextTargets;
    window.TARGETS = nextTargets;
    ensureSupportSysVars().targets = nextTargets;
    return nextTargets;
}

function readSchoolAliasState() {
    const nextAliases = SupportStateRuntime && typeof SupportStateRuntime.getSchoolAliases === 'function'
        ? (SupportStateRuntime.getSchoolAliases() || [])
        : (Array.isArray(ensureSupportSysVars().schoolAliases) ? ensureSupportSysVars().schoolAliases : []);
    ensureSupportSysVars().schoolAliases = nextAliases;
    return nextAliases;
}

function setSchoolAliasState(list) {
    const nextAliases = SupportStateRuntime && typeof SupportStateRuntime.setSchoolAliases === 'function'
        ? (SupportStateRuntime.setSchoolAliases(list) || [])
        : (Array.isArray(list) ? list : []);
    ensureSupportSysVars().schoolAliases = nextAliases;
    return nextAliases;
}

function persistSchoolAliasSettingsLocal() {
    const aliases = readSchoolAliasState();
    try {
        localStorage.setItem('CUSTOM_SCHOOL_ALIAS_SETTINGS', JSON.stringify(aliases));
    } catch (e) { }
    return aliases;
}

function readDataManagerSyncStateValue() {
    const nextState = SupportStateRuntime && typeof SupportStateRuntime.getDataManagerSyncState === 'function'
        ? (SupportStateRuntime.getDataManagerSyncState() || {})
        : (ensureSupportSysVars().dataManagerSyncState || {});
    ensureSupportSysVars().dataManagerSyncState = nextState;
    return nextState;
}

function setDataManagerSyncStateValue(syncState) {
    const nextState = SupportStateRuntime && typeof SupportStateRuntime.setDataManagerSyncState === 'function'
        ? (SupportStateRuntime.setDataManagerSyncState(syncState) || {})
        : (syncState && typeof syncState === 'object' && !Array.isArray(syncState) ? syncState : {});
    ensureSupportSysVars().dataManagerSyncState = nextState;
    return nextState;
}

function readLateBoundState(readValue, fallbackValue) {
    try {
        const value = readValue();
        return value === undefined ? fallbackValue : value;
    } catch (error) {
        return fallbackValue;
    }
}

function writeLateBoundState(writeValue, value) {
    try {
        writeValue(value);
        return true;
    } catch (error) {
        return false;
    }
}

function readPrevDataState() {
    const latePrevData = readLateBoundState(() => PREV_DATA, []);
    const nextRows = SupportStateRuntime && typeof SupportStateRuntime.getPrevData === 'function'
        ? (SupportStateRuntime.getPrevData() || [])
        : (window.PREV_DATA && Array.isArray(window.PREV_DATA) ? window.PREV_DATA : (Array.isArray(latePrevData) ? latePrevData : []));
    writeLateBoundState((value) => { PREV_DATA = value; }, nextRows);
    window.PREV_DATA = nextRows;
    return nextRows;
}

function setPrevDataState(rows) {
    const nextRows = SupportStateRuntime && typeof SupportStateRuntime.setPrevData === 'function'
        ? (SupportStateRuntime.setPrevData(rows) || [])
        : (Array.isArray(rows) ? rows : []);
    writeLateBoundState((value) => { PREV_DATA = value; }, nextRows);
    window.PREV_DATA = nextRows;
    return nextRows;
}

function readHistoryArchiveState() {
    const lateHistoryArchive = readLateBoundState(() => HISTORY_ARCHIVE, {});
    const nextArchive = SupportStateRuntime && typeof SupportStateRuntime.getHistoryArchive === 'function'
        ? (SupportStateRuntime.getHistoryArchive() || {})
        : (window.HISTORY_ARCHIVE && typeof window.HISTORY_ARCHIVE === 'object' ? window.HISTORY_ARCHIVE : (lateHistoryArchive && typeof lateHistoryArchive === 'object' ? lateHistoryArchive : {}));
    writeLateBoundState((value) => { HISTORY_ARCHIVE = value; }, nextArchive);
    window.HISTORY_ARCHIVE = nextArchive;
    return nextArchive;
}

function setHistoryArchiveState(archive) {
    const nextArchive = SupportStateRuntime && typeof SupportStateRuntime.setHistoryArchive === 'function'
        ? (SupportStateRuntime.setHistoryArchive(archive) || {})
        : (archive && typeof archive === 'object' && !Array.isArray(archive) ? archive : {});
    writeLateBoundState((value) => { HISTORY_ARCHIVE = value; }, nextArchive);
    window.HISTORY_ARCHIVE = nextArchive;
    return nextArchive;
}

function readFbClassesState() {
    const lateFbClasses = readLateBoundState(() => FB_CLASSES, []);
    const nextClasses = SupportStateRuntime && typeof SupportStateRuntime.getFbClasses === 'function'
        ? (SupportStateRuntime.getFbClasses() || [])
        : (window.FB_CLASSES && Array.isArray(window.FB_CLASSES) ? window.FB_CLASSES : (Array.isArray(lateFbClasses) ? lateFbClasses : []));
    writeLateBoundState((value) => { FB_CLASSES = value; }, nextClasses);
    window.FB_CLASSES = nextClasses;
    return nextClasses;
}

function setFbClassesState(classes) {
    const nextClasses = SupportStateRuntime && typeof SupportStateRuntime.setFbClasses === 'function'
        ? (SupportStateRuntime.setFbClasses(classes) || [])
        : (Array.isArray(classes) ? classes : []);
    writeLateBoundState((value) => { FB_CLASSES = value; }, nextClasses);
    window.FB_CLASSES = nextClasses;
    return nextClasses;
}

function readMpSnapshotsState() {
    const lateMpSnapshots = readLateBoundState(() => MP_SNAPSHOTS, {});
    const nextSnapshots = SupportStateRuntime && typeof SupportStateRuntime.getMpSnapshots === 'function'
        ? (SupportStateRuntime.getMpSnapshots() || {})
        : (window.MP_SNAPSHOTS && typeof window.MP_SNAPSHOTS === 'object' ? window.MP_SNAPSHOTS : (lateMpSnapshots && typeof lateMpSnapshots === 'object' ? lateMpSnapshots : {}));
    writeLateBoundState((value) => { MP_SNAPSHOTS = value; }, nextSnapshots);
    window.MP_SNAPSHOTS = nextSnapshots;
    return nextSnapshots;
}

function setMpSnapshotsState(snapshots) {
    const nextSnapshots = SupportStateRuntime && typeof SupportStateRuntime.setMpSnapshots === 'function'
        ? (SupportStateRuntime.setMpSnapshots(snapshots) || {})
        : (snapshots && typeof snapshots === 'object' && !Array.isArray(snapshots) ? snapshots : {});
    writeLateBoundState((value) => { MP_SNAPSHOTS = value; }, nextSnapshots);
    window.MP_SNAPSHOTS = nextSnapshots;
    return nextSnapshots;
}

function applySupportLateBoundState(snapshot = {}) {
    const nextTargets = snapshot.targets || {};
    const nextPrevData = snapshot.prevData || [];
    const nextHistoryArchive = snapshot.historyArchive || {};
    const nextFbClasses = snapshot.fbClasses || [];
    const nextMpSnapshots = snapshot.mpSnapshots || {};
    writeLateBoundState((value) => { TARGETS = value; }, nextTargets);
    writeLateBoundState((value) => { PREV_DATA = value; }, nextPrevData);
    writeLateBoundState((value) => { HISTORY_ARCHIVE = value; }, nextHistoryArchive);
    writeLateBoundState((value) => { FB_CLASSES = value; }, nextFbClasses);
    writeLateBoundState((value) => { MP_SNAPSHOTS = value; }, nextMpSnapshots);
    window.TARGETS = readLateBoundState(() => TARGETS, nextTargets);
    window.PREV_DATA = readLateBoundState(() => PREV_DATA, nextPrevData);
    window.HISTORY_ARCHIVE = readLateBoundState(() => HISTORY_ARCHIVE, nextHistoryArchive);
    window.FB_CLASSES = readLateBoundState(() => FB_CLASSES, nextFbClasses);
    window.MP_SNAPSHOTS = readLateBoundState(() => MP_SNAPSHOTS, nextMpSnapshots);
    ensureSupportSysVars().targets = window.TARGETS;
    return snapshot;
}

function syncSupportRuntimeState(patch = {}) {
    if (SupportStateRuntime && typeof SupportStateRuntime.syncSupportState === 'function') {
        const snapshot = applySupportLateBoundState(SupportStateRuntime.syncSupportState(patch));
        ensureSupportSysVars().indicator = snapshot.indicator || { ind1: '', ind2: '' };
        ensureSupportSysVars().schoolAliases = snapshot.schoolAliases || [];
        ensureSupportSysVars().dataManagerSyncState = snapshot.dataManagerSyncState || {};
        return snapshot;
    }
    return applySupportLateBoundState({
        indicator: setIndicatorState(patch.indicator ?? patch.INDICATOR_PARAMS ?? readIndicatorState()),
        targets: setTargetsState(patch.targets ?? patch.TARGETS ?? readTargetsState()),
        schoolAliases: setSchoolAliasState(patch.schoolAliases ?? patch.SCHOOL_ALIAS_SETTINGS ?? readSchoolAliasState()),
        dataManagerSyncState: setDataManagerSyncStateValue(patch.dataManagerSyncState ?? readDataManagerSyncStateValue()),
        prevData: setPrevDataState(patch.prevData ?? patch.PREV_DATA ?? readPrevDataState()),
        historyArchive: setHistoryArchiveState(patch.historyArchive ?? patch.HISTORY_ARCHIVE ?? readHistoryArchiveState()),
        fbClasses: setFbClassesState(patch.fbClasses ?? patch.FB_CLASSES ?? readFbClassesState()),
        mpSnapshots: setMpSnapshotsState(patch.mpSnapshots ?? patch.MP_SNAPSHOTS ?? readMpSnapshotsState())
    });
}

window.ensureSupportSysVars = ensureSupportSysVars;
window.readIndicatorState = readIndicatorState;
window.setIndicatorState = setIndicatorState;
window.readTargetsState = readTargetsState;
window.setTargetsState = setTargetsState;
window.readSchoolAliasState = readSchoolAliasState;
window.setSchoolAliasState = setSchoolAliasState;
window.persistSchoolAliasSettingsLocal = window.persistSchoolAliasSettingsLocal || persistSchoolAliasSettingsLocal;
window.readDataManagerSyncStateValue = readDataManagerSyncStateValue;
window.setDataManagerSyncStateValue = setDataManagerSyncStateValue;
window.readPrevDataState = readPrevDataState;
window.setPrevDataState = setPrevDataState;
window.readHistoryArchiveState = readHistoryArchiveState;
window.setHistoryArchiveState = setHistoryArchiveState;
window.readFbClassesState = readFbClassesState;
window.setFbClassesState = setFbClassesState;
window.readMpSnapshotsState = readMpSnapshotsState;
window.setMpSnapshotsState = setMpSnapshotsState;

const ProgressStateRuntime = window.ProgressState || null;

function readProgressCacheState() {
    const lateRows = readLateBoundState(() => PROGRESS_CACHE, []);
    const nextRows = ProgressStateRuntime && typeof ProgressStateRuntime.getProgressCache === 'function'
        ? (ProgressStateRuntime.getProgressCache() || [])
        : (window.PROGRESS_CACHE && Array.isArray(window.PROGRESS_CACHE) ? window.PROGRESS_CACHE : (Array.isArray(lateRows) ? lateRows : []));
    writeLateBoundState((value) => { PROGRESS_CACHE = value; }, nextRows);
    window.PROGRESS_CACHE = nextRows;
    return nextRows;
}

function setProgressCacheState(rows) {
    const nextRows = ProgressStateRuntime && typeof ProgressStateRuntime.setProgressCache === 'function'
        ? (ProgressStateRuntime.setProgressCache(rows) || [])
        : (Array.isArray(rows) ? rows : []);
    writeLateBoundState((value) => { PROGRESS_CACHE = value; }, nextRows);
    window.PROGRESS_CACHE = nextRows;
    return nextRows;
}

function readProgressCacheFullState() {
    const nextRows = ProgressStateRuntime && typeof ProgressStateRuntime.getProgressCacheFull === 'function'
        ? (ProgressStateRuntime.getProgressCacheFull() || [])
        : (window.PROGRESS_CACHE_FULL && Array.isArray(window.PROGRESS_CACHE_FULL) ? window.PROGRESS_CACHE_FULL : []);
    window.PROGRESS_CACHE_FULL = nextRows;
    return nextRows;
}

function setProgressCacheFullState(rows) {
    const nextRows = ProgressStateRuntime && typeof ProgressStateRuntime.setProgressCacheFull === 'function'
        ? (ProgressStateRuntime.setProgressCacheFull(rows) || [])
        : (Array.isArray(rows) ? rows : []);
    window.PROGRESS_CACHE_FULL = nextRows;
    return nextRows;
}

function readManualIdMappingsState() {
    const lateMappings = readLateBoundState(() => MANUAL_ID_MAPPINGS, {});
    const nextMappings = ProgressStateRuntime && typeof ProgressStateRuntime.getManualIdMappings === 'function'
        ? (ProgressStateRuntime.getManualIdMappings() || {})
        : (window.MANUAL_ID_MAPPINGS && typeof window.MANUAL_ID_MAPPINGS === 'object' ? window.MANUAL_ID_MAPPINGS : (lateMappings && typeof lateMappings === 'object' ? lateMappings : {}));
    writeLateBoundState((value) => { MANUAL_ID_MAPPINGS = value; }, nextMappings);
    window.MANUAL_ID_MAPPINGS = nextMappings;
    return nextMappings;
}

function setManualIdMappingsState(mappings) {
    const nextMappings = ProgressStateRuntime && typeof ProgressStateRuntime.setManualIdMappings === 'function'
        ? (ProgressStateRuntime.setManualIdMappings(mappings) || {})
        : (mappings && typeof mappings === 'object' && !Array.isArray(mappings) ? mappings : {});
    writeLateBoundState((value) => { MANUAL_ID_MAPPINGS = value; }, nextMappings);
    window.MANUAL_ID_MAPPINGS = nextMappings;
    return nextMappings;
}

function readLastVaDataState() {
    const nextRows = ProgressStateRuntime && typeof ProgressStateRuntime.getLastVaData === 'function'
        ? (ProgressStateRuntime.getLastVaData() || [])
        : (window.LAST_VA_DATA && Array.isArray(window.LAST_VA_DATA) ? window.LAST_VA_DATA : []);
    window.LAST_VA_DATA = nextRows;
    return nextRows;
}

function setLastVaDataState(rows) {
    const nextRows = ProgressStateRuntime && typeof ProgressStateRuntime.setLastVaData === 'function'
        ? (ProgressStateRuntime.setLastVaData(rows) || [])
        : (Array.isArray(rows) ? rows : []);
    window.LAST_VA_DATA = nextRows;
    return nextRows;
}

function readProgressViewModeState() {
    const nextMode = ProgressStateRuntime && typeof ProgressStateRuntime.getVaViewMode === 'function'
        ? String(ProgressStateRuntime.getVaViewMode() || 'school').trim()
        : String(window.VA_VIEW_MODE || 'school').trim();
    window.VA_VIEW_MODE = nextMode === 'class' ? 'class' : 'school';
    return window.VA_VIEW_MODE;
}

function setProgressViewModeState(mode) {
    const nextMode = ProgressStateRuntime && typeof ProgressStateRuntime.setVaViewMode === 'function'
        ? String(ProgressStateRuntime.setVaViewMode(mode) || 'school').trim()
        : String(mode || 'school').trim();
    window.VA_VIEW_MODE = nextMode === 'class' ? 'class' : 'school';
    return window.VA_VIEW_MODE;
}

function readProgressQuickModeState() {
    const nextMode = ProgressStateRuntime && typeof ProgressStateRuntime.getQuickMode === 'function'
        ? String(ProgressStateRuntime.getQuickMode() || 'all').trim()
        : String(window.__PROGRESS_QUICK_MODE || 'all').trim();
    window.__PROGRESS_QUICK_MODE = ['all', 'my_class', 'focus'].includes(nextMode) ? nextMode : 'all';
    return window.__PROGRESS_QUICK_MODE;
}

function setProgressQuickModeState(mode) {
    const nextMode = ProgressStateRuntime && typeof ProgressStateRuntime.setQuickMode === 'function'
        ? String(ProgressStateRuntime.setQuickMode(mode) || 'all').trim()
        : String(mode || 'all').trim();
    window.__PROGRESS_QUICK_MODE = ['all', 'my_class', 'focus'].includes(nextMode) ? nextMode : 'all';
    return window.__PROGRESS_QUICK_MODE;
}

function applyProgressLateBoundState(snapshot = {}) {
    const nextCache = snapshot.progressCache || [];
    const nextMappings = snapshot.manualIdMappings || {};
    writeLateBoundState((value) => { PROGRESS_CACHE = value; }, nextCache);
    writeLateBoundState((value) => { MANUAL_ID_MAPPINGS = value; }, nextMappings);
    window.PROGRESS_CACHE = nextCache;
    window.PROGRESS_CACHE_FULL = snapshot.progressCacheFull || [];
    window.MANUAL_ID_MAPPINGS = nextMappings;
    window.LAST_VA_DATA = snapshot.lastVaData || [];
    window.VA_VIEW_MODE = snapshot.vaViewMode || 'school';
    window.__PROGRESS_QUICK_MODE = snapshot.quickMode || 'all';
    return snapshot;
}

function syncProgressRuntimeState(patch = {}) {
    if (ProgressStateRuntime && typeof ProgressStateRuntime.syncProgressState === 'function') {
        return applyProgressLateBoundState(ProgressStateRuntime.syncProgressState(patch));
    }
    return applyProgressLateBoundState({
        progressCache: setProgressCacheState(patch.progressCache ?? patch.PROGRESS_CACHE ?? readProgressCacheState()),
        progressCacheFull: setProgressCacheFullState(patch.progressCacheFull ?? patch.PROGRESS_CACHE_FULL ?? readProgressCacheFullState()),
        manualIdMappings: setManualIdMappingsState(patch.manualIdMappings ?? patch.MANUAL_ID_MAPPINGS ?? readManualIdMappingsState()),
        lastVaData: setLastVaDataState(patch.lastVaData ?? patch.LAST_VA_DATA ?? readLastVaDataState()),
        vaViewMode: setProgressViewModeState(patch.vaViewMode ?? patch.VA_VIEW_MODE ?? readProgressViewModeState()),
        quickMode: setProgressQuickModeState(patch.quickMode ?? patch.__PROGRESS_QUICK_MODE ?? readProgressQuickModeState())
    });
}

window.readProgressCacheState = readProgressCacheState;
window.setProgressCacheState = setProgressCacheState;
window.readProgressCacheFullState = readProgressCacheFullState;
window.setProgressCacheFullState = setProgressCacheFullState;
window.readManualIdMappingsState = readManualIdMappingsState;
window.setManualIdMappingsState = setManualIdMappingsState;
window.readLastVaDataState = readLastVaDataState;
window.setLastVaDataState = setLastVaDataState;
window.readProgressViewModeState = readProgressViewModeState;
window.setProgressViewModeState = setProgressViewModeState;
window.readProgressQuickModeState = readProgressQuickModeState;
window.setProgressQuickModeState = setProgressQuickModeState;
window.syncProgressRuntimeState = syncProgressRuntimeState;

const ReportSessionStateRuntime = window.ReportSessionState || null;

function readCurrentReportStudentState() {
    const lateStudent = readLateBoundState(() => CURRENT_REPORT_STUDENT, null);
    const nextStudent = ReportSessionStateRuntime && typeof ReportSessionStateRuntime.getCurrentReportStudent === 'function'
        ? (ReportSessionStateRuntime.getCurrentReportStudent() || null)
        : (window.CURRENT_REPORT_STUDENT && typeof window.CURRENT_REPORT_STUDENT === 'object'
            ? window.CURRENT_REPORT_STUDENT
            : (lateStudent && typeof lateStudent === 'object' ? lateStudent : null));
    writeLateBoundState((value) => { CURRENT_REPORT_STUDENT = value; }, nextStudent);
    window.CURRENT_REPORT_STUDENT = nextStudent;
    return nextStudent;
}

function setCurrentReportStudentState(student) {
    const nextStudent = ReportSessionStateRuntime && typeof ReportSessionStateRuntime.setCurrentReportStudent === 'function'
        ? (ReportSessionStateRuntime.setCurrentReportStudent(student) || null)
        : (student && typeof student === 'object' ? student : null);
    writeLateBoundState((value) => { CURRENT_REPORT_STUDENT = value; }, nextStudent);
    window.CURRENT_REPORT_STUDENT = nextStudent;
    return nextStudent;
}

function readCurrentContextStudentsState() {
    const lateStudents = readLateBoundState(() => CURRENT_CONTEXT_STUDENTS, []);
    const nextStudents = ReportSessionStateRuntime && typeof ReportSessionStateRuntime.getCurrentContextStudents === 'function'
        ? (ReportSessionStateRuntime.getCurrentContextStudents() || [])
        : (Array.isArray(window.CURRENT_CONTEXT_STUDENTS)
            ? window.CURRENT_CONTEXT_STUDENTS
            : (Array.isArray(lateStudents) ? lateStudents : []));
    writeLateBoundState((value) => { CURRENT_CONTEXT_STUDENTS = value; }, nextStudents);
    window.CURRENT_CONTEXT_STUDENTS = nextStudents;
    return nextStudents;
}

function setCurrentContextStudentsState(students) {
    const nextStudents = ReportSessionStateRuntime && typeof ReportSessionStateRuntime.setCurrentContextStudents === 'function'
        ? (ReportSessionStateRuntime.setCurrentContextStudents(students) || [])
        : (Array.isArray(students) ? students : []);
    writeLateBoundState((value) => { CURRENT_CONTEXT_STUDENTS = value; }, nextStudents);
    window.CURRENT_CONTEXT_STUDENTS = nextStudents;
    return nextStudents;
}

function applyReportSessionLateBoundState(snapshot = {}) {
    writeLateBoundState((value) => { CURRENT_REPORT_STUDENT = value; }, snapshot.currentReportStudent || null);
    writeLateBoundState((value) => { CURRENT_CONTEXT_STUDENTS = value; }, snapshot.currentContextStudents || []);
    window.CURRENT_REPORT_STUDENT = snapshot.currentReportStudent || null;
    window.CURRENT_CONTEXT_STUDENTS = snapshot.currentContextStudents || [];
    return snapshot;
}

function syncReportSessionRuntimeState(patch = {}) {
    if (ReportSessionStateRuntime && typeof ReportSessionStateRuntime.syncReportSessionState === 'function') {
        return applyReportSessionLateBoundState(ReportSessionStateRuntime.syncReportSessionState(patch));
    }
    return applyReportSessionLateBoundState({
        currentReportStudent: setCurrentReportStudentState(patch.currentReportStudent ?? patch.CURRENT_REPORT_STUDENT ?? readCurrentReportStudentState()),
        currentContextStudents: setCurrentContextStudentsState(patch.currentContextStudents ?? patch.CURRENT_CONTEXT_STUDENTS ?? readCurrentContextStudentsState())
    });
}

window.readCurrentReportStudentState = readCurrentReportStudentState;
window.setCurrentReportStudentState = setCurrentReportStudentState;
window.readCurrentContextStudentsState = readCurrentContextStudentsState;
window.setCurrentContextStudentsState = setCurrentContextStudentsState;
window.syncReportSessionRuntimeState = syncReportSessionRuntimeState;

const CompareSessionStateRuntime = window.CompareSessionState || null;

function normalizeCompareSessionObject(value) {
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
}

function normalizeCompareSessionArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizeCompareSessionString(value) {
    return String(value || '').trim();
}

function readCloudCompareTargetState() {
    const nextTarget = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getCloudCompareTarget === 'function'
        ? (CompareSessionStateRuntime.getCloudCompareTarget() || null)
        : normalizeCompareSessionObject(window.CLOUD_COMPARE_TARGET);
    window.CLOUD_COMPARE_TARGET = nextTarget;
    return nextTarget;
}

function setCloudCompareTargetState(target) {
    const nextTarget = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.setCloudCompareTarget === 'function'
        ? (CompareSessionStateRuntime.setCloudCompareTarget(target) || null)
        : normalizeCompareSessionObject(target);
    window.CLOUD_COMPARE_TARGET = nextTarget;
    return nextTarget;
}

function readCloudStudentCompareContextState() {
    const nextContext = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getCloudStudentCompareContext === 'function'
        ? (CompareSessionStateRuntime.getCloudStudentCompareContext() || null)
        : normalizeCompareSessionObject(window.CLOUD_STUDENT_COMPARE_CONTEXT);
    window.CLOUD_STUDENT_COMPARE_CONTEXT = nextContext;
    return nextContext;
}

function setCloudStudentCompareContextState(context) {
    const nextContext = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.setCloudStudentCompareContext === 'function'
        ? (CompareSessionStateRuntime.setCloudStudentCompareContext(context) || null)
        : normalizeCompareSessionObject(context);
    window.CLOUD_STUDENT_COMPARE_CONTEXT = nextContext;
    return nextContext;
}

function readCloudComparePrevDataBackupState() {
    const nextRows = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getCloudComparePrevDataBackup === 'function'
        ? (CompareSessionStateRuntime.getCloudComparePrevDataBackup() ?? null)
        : (window.CLOUD_COMPARE_PREV_DATA_BACKUP ?? null);
    window.CLOUD_COMPARE_PREV_DATA_BACKUP = nextRows;
    return nextRows;
}

function setCloudComparePrevDataBackupState(rows) {
    const nextRows = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.setCloudComparePrevDataBackup === 'function'
        ? (CompareSessionStateRuntime.setCloudComparePrevDataBackup(rows) ?? null)
        : (rows ?? null);
    window.CLOUD_COMPARE_PREV_DATA_BACKUP = nextRows;
    return nextRows;
}

function readDuplicateCompareExamsState() {
    const nextGroups = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getDuplicateCompareExams === 'function'
        ? (CompareSessionStateRuntime.getDuplicateCompareExams() || [])
        : normalizeCompareSessionArray(window.DUPLICATE_COMPARE_EXAMS);
    window.DUPLICATE_COMPARE_EXAMS = nextGroups;
    return nextGroups;
}

function setDuplicateCompareExamsState(groups) {
    const nextGroups = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.setDuplicateCompareExams === 'function'
        ? (CompareSessionStateRuntime.setDuplicateCompareExams(groups) || [])
        : normalizeCompareSessionArray(groups);
    window.DUPLICATE_COMPARE_EXAMS = nextGroups;
    return nextGroups;
}

function readDuplicateCompareWarnedKeyState() {
    const nextKey = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getDuplicateCompareWarnedKey === 'function'
        ? String(CompareSessionStateRuntime.getDuplicateCompareWarnedKey() || '').trim()
        : normalizeCompareSessionString(window.__DUPLICATE_COMPARE_WARNED_KEY);
    window.__DUPLICATE_COMPARE_WARNED_KEY = nextKey;
    return nextKey;
}

function setDuplicateCompareWarnedKeyState(key) {
    const nextKey = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.setDuplicateCompareWarnedKey === 'function'
        ? String(CompareSessionStateRuntime.setDuplicateCompareWarnedKey(key) || '').trim()
        : normalizeCompareSessionString(key);
    window.__DUPLICATE_COMPARE_WARNED_KEY = nextKey;
    return nextKey;
}

function readCompareExamSyncState() {
    const nextState = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getCompareExamSyncState === 'function'
        ? (CompareSessionStateRuntime.getCompareExamSyncState() || {})
        : (window.__COMPARE_EXAM_SYNC_STATE && typeof window.__COMPARE_EXAM_SYNC_STATE === 'object' && !Array.isArray(window.__COMPARE_EXAM_SYNC_STATE)
            ? window.__COMPARE_EXAM_SYNC_STATE
            : {});
    window.__COMPARE_EXAM_SYNC_STATE = nextState;
    return nextState;
}

function setCompareExamSyncState(state) {
    const nextState = CompareSessionStateRuntime && typeof CompareSessionStateRuntime.setCompareExamSyncState === 'function'
        ? (CompareSessionStateRuntime.setCompareExamSyncState(state) || {})
        : (state && typeof state === 'object' && !Array.isArray(state) ? state : {});
    window.__COMPARE_EXAM_SYNC_STATE = nextState;
    return nextState;
}

function applyCompareSessionLateBoundState(snapshot = {}) {
    window.CLOUD_COMPARE_TARGET = snapshot.cloudCompareTarget || null;
    window.CLOUD_STUDENT_COMPARE_CONTEXT = snapshot.cloudStudentCompareContext || null;
    window.CLOUD_COMPARE_PREV_DATA_BACKUP = snapshot.cloudComparePrevDataBackup ?? null;
    window.DUPLICATE_COMPARE_EXAMS = snapshot.duplicateCompareExams || [];
    window.__DUPLICATE_COMPARE_WARNED_KEY = snapshot.duplicateCompareWarnedKey || '';
    window.__COMPARE_EXAM_SYNC_STATE = snapshot.compareExamSyncState || {};
    return snapshot;
}

function syncCompareSessionRuntimeState(patch = {}) {
    if (CompareSessionStateRuntime && typeof CompareSessionStateRuntime.syncCompareSessionState === 'function') {
        return applyCompareSessionLateBoundState(CompareSessionStateRuntime.syncCompareSessionState(patch));
    }
    return applyCompareSessionLateBoundState({
        cloudCompareTarget: setCloudCompareTargetState(patch.cloudCompareTarget ?? patch.CLOUD_COMPARE_TARGET ?? readCloudCompareTargetState()),
        cloudStudentCompareContext: setCloudStudentCompareContextState(patch.cloudStudentCompareContext ?? patch.CLOUD_STUDENT_COMPARE_CONTEXT ?? readCloudStudentCompareContextState()),
        cloudComparePrevDataBackup: setCloudComparePrevDataBackupState(patch.cloudComparePrevDataBackup ?? patch.CLOUD_COMPARE_PREV_DATA_BACKUP ?? readCloudComparePrevDataBackupState()),
        duplicateCompareExams: setDuplicateCompareExamsState(patch.duplicateCompareExams ?? patch.DUPLICATE_COMPARE_EXAMS ?? readDuplicateCompareExamsState()),
        duplicateCompareWarnedKey: setDuplicateCompareWarnedKeyState(patch.duplicateCompareWarnedKey ?? patch.__DUPLICATE_COMPARE_WARNED_KEY ?? readDuplicateCompareWarnedKeyState()),
        compareExamSyncState: setCompareExamSyncState(patch.compareExamSyncState ?? patch.__COMPARE_EXAM_SYNC_STATE ?? readCompareExamSyncState())
    });
}

window.readCloudCompareTargetState = readCloudCompareTargetState;
window.setCloudCompareTargetState = setCloudCompareTargetState;
window.readCloudStudentCompareContextState = readCloudStudentCompareContextState;
window.setCloudStudentCompareContextState = setCloudStudentCompareContextState;
window.readCloudComparePrevDataBackupState = readCloudComparePrevDataBackupState;
window.setCloudComparePrevDataBackupState = setCloudComparePrevDataBackupState;
window.readDuplicateCompareExamsState = readDuplicateCompareExamsState;
window.setDuplicateCompareExamsState = setDuplicateCompareExamsState;
window.readDuplicateCompareWarnedKeyState = readDuplicateCompareWarnedKeyState;
window.setDuplicateCompareWarnedKeyState = setDuplicateCompareWarnedKeyState;
window.readCompareExamSyncState = readCompareExamSyncState;
window.setCompareExamSyncState = setCompareExamSyncState;
window.syncCompareSessionRuntimeState = syncCompareSessionRuntimeState;

// Moved to auth-login-runtime.js (Auth, scheduleStartupCloudTask, RoleManager, alert/confirm)
// Moved to data-manager-core-runtime.js (DataManager)
function isRecoverableCloudSyncError(error) {
    const text = `${error?.message || ''} ${error?.details || ''} ${error || ''}`.toLowerCase();
    return text.includes('aborterror')
        || text.includes('signal is aborted')
        || text.includes('request was aborted')
        || text.includes('timeout');
}

function logCloudSyncIssue(label, error) {
    if (isRecoverableCloudSyncError(error)) {
        console.warn(label, error);
        return;
    }
    console.error(label, error);
}

const DB = {
    getLocal: async (key) => {
        return requireDataCloudRuntime().dbGetLocal(key);
    },
    save: async (key, value, options = {}) => {
        return requireDataCloudRuntime().dbSave(key, value, options);
    },

    get: async (key, options = {}) => {
        return requireDataCloudRuntime().dbGet(key, options);
    },

    syncFromCloud: async (key) => {
        return requireDataCloudRuntime().dbSyncFromCloud(key);
    },

    clear: async (key) => {
        return requireDataCloudRuntime().dbClear(key);
    }
};

function setCohortSyncStatus(state = 'idle', options = {}) {
    const cohortId = String(options.cohortId || CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
    const runtime = window.CohortSyncStatusRuntime;
    if (!runtime?.setStatus) {
        console.warn('cohort-sync-status-runtime.js 未加载，跳过同步状态展示。');
        return { state: 'idle', cohortId, syncedAt: 0 };
    }
    return runtime.setStatus(state, { ...options, cohortId });
}

async function retryCurrentCohortSync() {
    const cohortId = String(CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
    return window.CohortSyncStatusRuntime?.retry({
        cohortId,
        load: () => loadCloudData(),
        restore: () => tryAutoRestoreWorkspaceExam({ cohortId }),
        hasData: () => Array.isArray(RAW_DATA) && RAW_DATA.length > 0,
        toast: (...args) => window.UI?.toast(...args)
    }) ?? false;
}

window.setCohortSyncStatus = setCohortSyncStatus;
window.retryCurrentCohortSync = retryCurrentCohortSync;

function hasAuthenticatedAppSession() {
    const user = !!(window.AuthState && typeof AuthState.getCurrentUser === 'function' && AuthState.getCurrentUser());
    let token = '';
    try {
        token = String(sessionStorage.getItem('EDGE_GATEWAY_TOKEN_V1') || sessionStorage.getItem('edu:session:token') || '').trim();
    } catch (_) { }
    return !!(user && token);
}

function enforceLoggedOutShellGate() {
    if (hasAuthenticatedAppSession()) return false;
    const overlay = document.getElementById('login-overlay');
    const app = document.getElementById('app');
    document.body.classList.add('login-overlay-active', 'role-guest');
    document.body.dataset.authState = 'logged_out';
    document.body.dataset.role = 'guest';
    document.body.className = document.body.className.replace(/\brole-(?!guest\b)\w+\b/g, '').trim();
    if (overlay) {
        overlay.style.display = 'flex';
        overlay.style.visibility = 'visible';
        overlay.style.opacity = '1';
        overlay.style.pointerEvents = 'auto';
        overlay.setAttribute('aria-hidden', 'false');
        try { overlay.inert = false; } catch (_) { }
        overlay.dataset.loginState = 'active';
        overlay.dataset.loginModal = 'inline';
    }
    if (app) {
        app.classList.add('hidden');
        app.setAttribute('aria-hidden', 'true');
    }
    return true;
}

window.enforceLoggedOutShellGate = enforceLoggedOutShellGate;
if (!window.__LOGGED_OUT_SHELL_GATE_BOUND__) {
    window.__LOGGED_OUT_SHELL_GATE_BOUND__ = true;
    const runLoggedOutGate = () => enforceLoggedOutShellGate();
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runLoggedOutGate, { once: true });
    } else {
        setTimeout(runLoggedOutGate, 0);
    }
    window.addEventListener('load', runLoggedOutGate, { once: true });
    setTimeout(runLoggedOutGate, 1200);
    setTimeout(runLoggedOutGate, 4000);
    setTimeout(runLoggedOutGate, 9000);
    setTimeout(runLoggedOutGate, 16000);
}

const initialWorkspaceSnapshot = readWorkspaceSnapshot();
var COHORT_DB = initialWorkspaceSnapshot.cohortDb || null;
var CURRENT_COHORT_ID = initialWorkspaceSnapshot.currentCohortId || '';
var CURRENT_COHORT_META = initialWorkspaceSnapshot.currentCohortMeta || null;
var CURRENT_EXAM_ID = initialWorkspaceSnapshot.currentExamId || '';

async function switchCohort(cohortId, options = {}) {
    if (!cohortId) return;
    const cohortKey = getCohortKey(cohortId);
    const current = readWorkspaceProjectKey() || '';
    const currentExamId = CURRENT_EXAM_ID || readWorkspaceExamId() || COHORT_DB?.currentExamId || '';
    const hasReadyData = Array.isArray(RAW_DATA) && RAW_DATA.length > 0;
    const currentExamCohortId = normalizeCompareCohortId(currentExamId);
    const targetCohortId = normalizeCompareCohortId(cohortId);
    const readyDataMatchesTarget = !!targetCohortId && !!currentExamCohortId && currentExamCohortId === targetCohortId;
    if (current === cohortKey && currentExamId && hasReadyData && readyDataMatchesTarget) {
        tryAutoEnterReadyCohortWorkspace();
        return true;
    }

    if (!options.skipConfirm && !confirm("⚠️ 正在切换届别档案...\n\n切换前请确保当前工作已保存（数据会自动保存），否则未同步的修改可能丢失。\n\n确定切换吗？")) {
        const selector = document.getElementById('cohort-selector');
        if (selector) selector.value = readWorkspaceCohortId() || '';
        return false;
    }

    window.__COHORT_SWITCH_IN_PROGRESS__ = true;
    setCohortSyncStatus('syncing', { cohortId, detail: `正在同步 ${cohortKey}` });
    if (window.__STARTUP_CLOUD_HYDRATION_TIMER__) {
        clearTimeout(window.__STARTUP_CLOUD_HYDRATION_TIMER__);
        window.__STARTUP_CLOUD_HYDRATION_TIMER__ = null;
    }
    UI.loading(true, "正在从云端拉取 [" + cohortKey + "] 的数据...");

    CURRENT_EXAM_ID = '';
    COHORT_DB = null;
    syncWorkspaceRuntimeState({
        currentProjectKey: cohortKey,
        currentCohortId: cohortId,
        currentCohortMeta: CURRENT_COHORT_META,
        currentExamId: '',
        cohortDb: null
    });
    const label = CURRENT_COHORT_META ? formatCohortLabel(CURRENT_COHORT_META) : `${cohortId}级`;
    const currentLabel = document.getElementById('cohort-current-label');
    if (currentLabel) currentLabel.innerText = label;
    const examCohortLabel = document.getElementById('exam-cohort-label');
    if (examCohortLabel) examCohortLabel.innerText = label;

    clearDataRuntimeState();
    setTeacherMap({});
    setTeacherSchoolMap({});

    if (options.fastEnter === true) {
        DB.get(cohortKey).then((cloudData) => {
            if (!cloudData) return;
            if (String(readWorkspaceCohortId() || CURRENT_COHORT_ID || '') !== String(cohortId)) return;
            const stillEmpty = !(Array.isArray(RAW_DATA) && RAW_DATA.length > 0);
            if (stillEmpty) {
                switchCohort(cohortId,{skipConfirm:true,fastEnter:false,preloadedData:cloudData}).catch(error=>console.warn('[switchCohort] background project hydrate failed:',error));
            } else {
                setCohortSyncStatus('synced', { cohortId });
            }
        }).catch((error) => {
            console.warn('[switchCohort] background project fetch failed:', error);
            setCohortSyncStatus('error', { cohortId, detail: String(error?.message || '云端项目数据拉取失败') });
        });
    }

    const data=options.preloadedData||await DB.get(cohortKey,{localOnly:options.fastEnter===true});

    if (data) {
        COHORT_DB = data.COHORT_DB || null;
        CURRENT_COHORT_ID = data.CURRENT_COHORT_ID || cohortId;
        CURRENT_COHORT_META = data.CURRENT_COHORT_META || CURRENT_COHORT_META;
        CURRENT_EXAM_ID = persistWorkspaceExamIdentity(data.CURRENT_EXAM_ID || COHORT_DB?.currentExamId || '', COHORT_DB, {
            cohortId: CURRENT_COHORT_ID || cohortId,
            sync: false
        }) || '';
        syncRuntimeStateToWindow();

        if (COHORT_DB && COHORT_DB.currentExamId && CohortDB.applyExamToWorkspace(COHORT_DB.currentExamId, { renderTables: false })) {
        } else {
            syncDataRuntimeState({
                rawData: data.RAW_DATA || [],
                schools: data.SCHOOLS || {},
                subjects: data.SUBJECTS || [],
                thresholds: data.THRESHOLDS || {},
                config: data.CONFIG || {}
            });
            setTeacherMap(data.TEACHER_MAP || {});
            setTeacherSchoolMap(data.TEACHER_SCHOOL_MAP || {});
        }
        tryAutoRestoreWorkspaceExam({
            preferredExamId: data.CURRENT_EXAM_ID || COHORT_DB?.currentExamId || '',
            cohortId: CURRENT_COHORT_ID || cohortId
        });
        if (!readWorkspaceExamId() && Array.isArray(RAW_DATA) && RAW_DATA.length > 0) {
            const fallbackExamId = getAutoRestoreExamId(COHORT_DB, CURRENT_COHORT_ID || cohortId);
            if (fallbackExamId) {
                persistWorkspaceExamIdentity(fallbackExamId, COHORT_DB, { cohortId: CURRENT_COHORT_ID || cohortId });
            }
        }
        scheduleTeacherSyncPrompt();

        if (data.AUTH_DB) {
            Auth.db = persistLocalAuthDb(data.AUTH_DB);
            appDebug("✅ 账号已切换为 [" + cohortKey + "] 的版本");
        }

        if (data.INDICATOR_PARAMS) {
            const indicator = setIndicatorState(data.INDICATOR_PARAMS);
            const i1 = document.getElementById('ind1');
            const i2 = document.getElementById('ind2');
            if (i1) i1.value = indicator.ind1 || '';
            if (i2) i2.value = indicator.ind2 || '';

            setIndicatorState(indicator);
        }

        if (data.TARGETS) {
            setTargetsState(data.TARGETS);
        }
        if (Array.isArray(data.SCHOOL_ALIAS_SETTINGS)) {
            setSchoolAliasState(data.SCHOOL_ALIAS_SETTINGS);
            persistSchoolAliasSettingsLocal();
        }
        if (data.PREV_DATA) setPrevDataState(data.PREV_DATA);
        if (data.HISTORY_ARCHIVE) setHistoryArchiveState(data.HISTORY_ARCHIVE);
        if (data.FB_CLASSES) setFbClassesState(data.FB_CLASSES);
        if (data.MP_SNAPSHOTS) setMpSnapshotsState(data.MP_SNAPSHOTS);

        const restoredGrade = getEffectiveGrade(getExamMetaFromUI());
        if (restoredGrade) applyModeByGrade(restoredGrade);
        updateSchoolSelect();
        updateMySchoolSelect();

        const badge = document.getElementById('mode-badge');
        if (badge && CONFIG.name) badge.innerText = CONFIG.name;
        renderNavigation();
        hideCohortPicker();
        document.getElementById('app').classList.remove('hidden');
        scheduleWorkspaceUiRefresh('switch-cohort-restored', { delay: 120, idle: true, timeout: 1800, renderTables: false });

        CohortDB.renderExamList();

        CohortExamHydrationScheduler.schedule(cohortId, {
            delay: 0,
            warnPrefix: '[switchCohort] 云端历史考试拉取失败:'
        });

        UI.toast(`✅ 已切换到 [${cohortKey}]，数据加载完毕`, "success");
        logAction('届别切换', `已切换到 ${cohortKey}`);
        updateStatusPanel();
    } else {
        if (window.CloudManager && typeof window.CloudManager.fetchCohortExamsToLocal === 'function') {
            const hydrateFromExamArchive = () => window.CloudManager.fetchCohortExamsToLocal(cohortId, {
                background: true,
                latestOnly: true,
                minCount: 1,
                refreshSelectors: false
            })
                .then((syncRes) => {
                    if (String(readWorkspaceCohortId() || CURRENT_COHORT_ID || '') !== String(cohortId)) return false;
                const restoredFromExamArchive = syncRes && syncRes.success && tryAutoRestoreWorkspaceExam({ cohortId });
                const restoredExamId = restoredFromExamArchive
                    ? persistWorkspaceExamIdentity(
                        CURRENT_EXAM_ID || COHORT_DB?.currentExamId || getAutoRestoreExamId(COHORT_DB, cohortId),
                        COHORT_DB,
                        { cohortId }
                    )
                    : '';
                if (restoredFromExamArchive) {
                    if (!restoredExamId) {
                        setCohortSyncStatus('error', { cohortId, detail: '云端考试快照已拉取，但未能确定当前考试' });
                        return false;
                    }
                    updateSchoolSelect();
                    updateMySchoolSelect();
                    if (CONFIG.name) renderNavigation();
                    hideCohortPicker();
                    document.getElementById('app').classList.remove('hidden');
                    scheduleWorkspaceUiRefresh('switch-cohort-exam-archive', { delay: 120, idle: true, timeout: 1800, renderTables: false });
                    CohortDB.renderExamList();
                    CohortExamHydrationScheduler.schedule(cohortId, {
                        delay: 1200,
                        background: true,
                        minCount: 2,
                        warnPrefix: '[switchCohort] 后台历史考试补全失败:'
                    });
                    UI.toast(`已从云端考试快照恢复 [${cohortKey}] 数据`, "success");
                    logAction('届别切换', `已从云端考试快照恢复 ${cohortKey}`);
                    updateStatusPanel();
                    setCohortSyncStatus('synced', { cohortId });
                    return true;
                }
                    return false;
                })
                .catch((e) => {
                console.warn('[switchCohort] cloud exam snapshot restore failed:', e);
                    setCohortSyncStatus('error', { cohortId, detail: String(e?.message || '云端考试快照恢复失败') });
                    return false;
                });
            if (options.fastEnter === true) {
                // Do not block the shell, but keep the restore step attached to
                // the download. A scheduler-only fetch updates local storage and
                // leaves the already-open workspace empty until another switch.
                void hydrateFromExamArchive();
            } else {
                const restored = await hydrateFromExamArchive();
                if (restored) {
                    UI.loading(false);
                    window.__COHORT_SWITCH_IN_PROGRESS__ = false;
                    return true;
                }
            }
        }
        if (options.requireCloudData === true) {
            setManualCohortSelectionGate(true);
            setCohortSyncStatus('error', { cohortId, detail: '未能从云端恢复该届别数据' });
            UI.toast(`未能从云端恢复 [${cohortKey}] 数据，请稍后重试同步`, 'error');
            UI.loading(false);
            window.__COHORT_SWITCH_IN_PROGRESS__ = false;
            return false;
        }
        clearDataRuntimeState();
        COHORT_DB = {
            cohortId,
            cohortMeta: CURRENT_COHORT_META || null,
            students: {},
            teachingHistory: {},
            exams: {},
            currentExamId: '',
            resetPoints: []
        };
        syncRuntimeStateToWindow();

        Auth.db = persistLocalAuthDb({ admin: { pass: MASKED_PASSWORD_DISPLAY }, teachers: [], parents: [] });

        const i1 = document.getElementById('ind1');
        const i2 = document.getElementById('ind2');
        if (i1) i1.value = '';
        if (i2) i2.value = '';

        updateSchoolSelect();
        const grade = computeCohortGrade(CURRENT_COHORT_META, getExamMetaFromUI());
        applyModeByGrade(grade);
        hideCohortPicker();
        document.getElementById('app').classList.remove('hidden');
        scheduleWorkspaceUiRefresh('switch-cohort-empty', { delay: 160, idle: true, timeout: 1800, renderTables: false });

        CohortDB.renderExamList();

        UI.toast(`✨ 已切换到 [${cohortKey}] (新存档)，请开始上传数据`, "info");
        logAction('届别切换', `新建并切换到 ${cohortKey}`);
        updateStatusPanel();
    }

    if (options.fastEnter !== true && Array.isArray(RAW_DATA) && RAW_DATA.length > 0) {
        setCohortSyncStatus('synced', { cohortId });
    } else if (options.fastEnter === true) {
        setCohortSyncStatus('local', { cohortId, detail: '已使用本地数据进入，云端继续在后台同步' });
    }

    UI.loading(false);
    window.__COHORT_SWITCH_IN_PROGRESS__ = false;
    return true;
}

window.switchProject = switchCohort;

let __workspaceRefreshTimer = null;
function scheduleWorkspaceUiRefresh(label = 'workspace-refresh', options = {}) {
    if (__workspaceRefreshTimer) {
        clearTimeout(__workspaceRefreshTimer);
        __workspaceRefreshTimer = null;
    }

    const delay = Math.max(0, Number(options.delay || 120));
    const run = () => {
        __workspaceRefreshTimer = null;
        const shouldRenderTables = options.renderTables !== false;
        const shouldGenerateTeacherInputs = options.generateTeacherInputs !== false;
        const refresh = () => {
            try { if (typeof updateSchoolSelect === 'function') updateSchoolSelect(); } catch (e) { console.warn(e); }
            try { if (typeof updateMySchoolSelect === 'function') updateMySchoolSelect(); } catch (e) { console.warn(e); }
            try { if (shouldRenderTables && typeof renderTables === 'function') renderTables(); } catch (e) { console.warn(e); }
            try { if (shouldGenerateTeacherInputs && MY_SCHOOL && typeof generateTeacherInputs === 'function') generateTeacherInputs(); } catch (e) { console.warn(e); }
            try { if (typeof updateStatusPanel === 'function') updateStatusPanel(); } catch (e) { console.warn(e); }
        };
        scheduleStartupHydration(label, refresh, {
            idle: options.idle !== false,
            timeout: Number(options.timeout || 1600)
        });
    };

    __workspaceRefreshTimer = window.setTimeout(run, delay);
}

function scheduleStartupHydration(label, callback, options = {}) {
    const safeRun = () => {
        try {
            callback();
        } catch (error) {
            console.warn(`[StartupHydration:${label}]`, error);
        }
    };

    const trigger = () => {
        if (options.idle) {
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(() => safeRun(), { timeout: Number(options.timeout || 1200) });
                return;
            }
            window.setTimeout(safeRun, Math.max(0, Number(options.timeout || 180)));
            return;
        }

        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => window.requestAnimationFrame(safeRun));
            return;
        }

        window.setTimeout(safeRun, 0);
    };

    const delay = Math.max(0, Number(options.delay || 0));
    if (delay > 0) {
        window.setTimeout(trigger, delay);
        return;
    }

    trigger();
}

const ExamSelectorRefreshScheduler = (() => {
    let queued = false;
    let pending = null;

    const DEFAULT_FLAGS = {
        status: true,
        macro: true,
        teacher: true,
        teacherCompareTeacher: false,
        studentCompare: true,
        reportCompare: true,
        progress: true,
        progressBaseline: false
    };

    function mergeOptions(options = {}) {
        pending = Object.assign({}, DEFAULT_FLAGS, pending || {}, options);
    }

    function callRefresh(name, callback, warnLabel) {
        if (typeof callback !== 'function') return;
        try {
            callback();
        } catch (error) {
            console.warn(warnLabel || `${name} refresh failed:`, error);
        }
    }

    function run(options = {}) {
        const flags = Object.assign({}, DEFAULT_FLAGS, pending || {}, options);
        pending = null;
        queued = false;

        if (flags.status) callRefresh('examHistoryStatusBar', typeof updateExamHistoryStatusBar === 'function' ? updateExamHistoryStatusBar : null, '状态条刷新异常:');
        if (flags.macro) callRefresh('macroMultiExamSelects', typeof updateMacroMultiExamSelects === 'function' ? updateMacroMultiExamSelects : null);
        if (flags.teacher) callRefresh('teacherMultiExamSelects', typeof updateTeacherMultiExamSelects === 'function' ? updateTeacherMultiExamSelects : null);
        if (flags.teacherCompareTeacher) callRefresh('teacherCompareTeacherSelect', typeof updateTeacherCompareTeacherSelect === 'function' ? updateTeacherCompareTeacherSelect : null);
        if (flags.studentCompare) callRefresh('studentCompareExamSelects', typeof updateStudentCompareExamSelects === 'function' ? updateStudentCompareExamSelects : null);
        if (flags.reportCompare) callRefresh('reportCompareExamSelects', typeof updateReportCompareExamSelects === 'function' ? updateReportCompareExamSelects : null);
        if (flags.progress) callRefresh('progressMultiExamSelects', typeof updateProgressMultiExamSelects === 'function' ? updateProgressMultiExamSelects : null);
        if (flags.progressBaseline) callRefresh('progressBaselineSelect', typeof updateProgressBaselineSelect === 'function' ? updateProgressBaselineSelect : null);
    }

    function schedule(options = {}) {
        if (options.immediate) {
            run(options);
            return;
        }

        mergeOptions(options);
        if (queued) return;
        queued = true;

        const execute = () => run();
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(execute, { timeout: Number(options.timeout || 700) });
            return;
        }
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => window.setTimeout(execute, 0));
            return;
        }
        window.setTimeout(execute, 0);
    }

    return { schedule, run };
})();

function scheduleExamSelectorRefresh(options = {}) {
    ExamSelectorRefreshScheduler.schedule(options);
}

function runExamSelectorRefresh(options = {}) {
    ExamSelectorRefreshScheduler.run(options);
}

window.scheduleExamSelectorRefresh = scheduleExamSelectorRefresh;
window.runExamSelectorRefresh = runExamSelectorRefresh;

const CohortExamHydrationScheduler = window.CohortExamHydrationScheduler;

const getLegacyDbSaveOptionsForKey=k=>/^cohort::/i.test(k||'')?{cloud:!1}:{deferCloud:!0,deferMs:9e3};


window.addEventListener('load', async () => {
    try { CloudSyncIndicator.start(); } catch (e) { console.warn('CloudSyncIndicator start failed:', e); }

    if (typeof CohortManager !== 'undefined') {
        CohortManager.init();
    }
    const selector = document.getElementById('cohort-selector');
    if (selector) selector.value = readWorkspaceCohortId() || '';

    if (typeof Auth !== 'undefined') {
        Auth.init();
    }

    if (typeof HelpSystem !== 'undefined') {
        HelpSystem.checkFirstRun();
    }

    if (window.EMBEDDED_DB) {
        appDebug("检测到内置数据包，正在装载...");
        const loader = document.getElementById('global-loader');
        if (loader) loader.classList.add('hidden');
        AuthState.clearCurrentUser();
        if (typeof Auth !== 'undefined' && typeof Auth.syncLoginOverlayState === 'function') Auth.syncLoginOverlayState(true);
        document.getElementById('app').classList.add('hidden');
        const db = window.EMBEDDED_DB;

        syncDataRuntimeState({
            rawData: db.RAW_DATA || [],
            schools: db.SCHOOLS || {},
            subjects: db.SUBJECTS || [],
            thresholds: db.THRESHOLDS || {},
            config: db.CONFIG || {}
        });
        setTeacherMap(db.TEACHER_MAP || {});
        setTeacherSchoolMap(db.TEACHER_SCHOOL_MAP || {});
        writeCurrentSchool(db.MY_SCHOOL || '');

        if (db.AUTH_DB) {
            if (typeof Auth !== 'undefined') Auth.db = persistLocalAuthDb(db.AUTH_DB);
        }

        if (db.INDICATOR_PARAMS) {
            setTimeout(() => {
                const i1 = document.getElementById('ind1');
                const i2 = document.getElementById('ind2');
                if (i1) i1.value = db.INDICATOR_PARAMS.ind1 || '';
                if (i2) i2.value = db.INDICATOR_PARAMS.ind2 || '';
            }, 100);
        }
        if (db.TARGETS) setTargetsState(db.TARGETS);

        updateSchoolSelect();
        updateMySchoolSelect();
        hideCohortPicker();
        if (CONFIG.name) renderNavigation();
        scheduleWorkspaceUiRefresh('embedded-db-tables', { delay: 120, idle: true, timeout: 1800, renderTables: false });

        UI.toast("✅ 数据已自动加载 (分发版模式)", "success");
    }

    else {
        const savedCohortId = readWorkspaceCohortId();
        const savedProjectKey = readWorkspaceProjectKey();
        if (savedCohortId && savedProjectKey) {
            const expectedKey = getCohortKey(savedCohortId);
            if (savedProjectKey !== expectedKey && savedProjectKey !== 'autosave_backup') {
                console.warn(`[届别校验] CURRENT_PROJECT_KEY (${savedProjectKey}) 与 CURRENT_COHORT_ID (${savedCohortId}) 不匹配，自动修正为 ${expectedKey}`);
                writeWorkspaceProjectKey(expectedKey);
            }
        }

        const currentKey = readWorkspaceProjectKey() || 'autosave_backup';
        const hasSessionUser = AuthState.hasActiveSession(window.Auth && Auth.currentUser);
        const backup = await DB.get(currentKey, { localOnly: !hasSessionUser });
        const isForceRestore = localStorage.getItem('SYS_FORCE_RESTORE');

        const performRestore = async () => {
            const backupCohortId = getSnapshotPayloadCohortId(backup);
            const activeCohortId = getExplicitCohortSelection() || CURRENT_COHORT_ID || readWorkspaceCohortId();
            if (!isForceRestore && backupCohortId && activeCohortId && backupCohortId !== activeCohortId) {
                console.warn('[WorkspaceRestore] blocked stale local backup restore', { backupCohortId, activeCohortId, currentKey });
                return false;
            }
            await Perf.runAsync(async () => {
                COHORT_DB = backup.COHORT_DB || COHORT_DB || null;
                CURRENT_COHORT_ID = backup.CURRENT_COHORT_ID || CURRENT_COHORT_ID || readWorkspaceCohortId() || '';
                CURRENT_COHORT_META = backup.CURRENT_COHORT_META || CURRENT_COHORT_META || null;
                CURRENT_EXAM_ID = backup.CURRENT_EXAM_ID || CURRENT_EXAM_ID || readWorkspaceExamId() || '';

                syncDataRuntimeState({
                    rawData: backup.RAW_DATA || [],
                    schools: backup.SCHOOLS || {},
                    subjects: backup.SUBJECTS || [],
                    thresholds: backup.THRESHOLDS || {},
                    config: backup.CONFIG || readConfigState()
                });
                setTeacherMap(backup.TEACHER_MAP || {});
                setTeacherSchoolMap(backup.TEACHER_SCHOOL_MAP || {});
                writeCurrentSchool(backup.MY_SCHOOL || '');

                if (backup.AUTH_DB) {
                    Auth.db = persistLocalAuthDb(backup.AUTH_DB);
                    appDebug("✅ 账号信息已同步");
                }

                if (backup.INDICATOR_PARAMS) {
                    const indicator = setIndicatorState(backup.INDICATOR_PARAMS);

                    setTimeout(() => {
                        const dm1 = document.getElementById('dm_ind1_input');
                        const dm2 = document.getElementById('dm_ind2_input');

                        if (dm1) dm1.value = indicator.ind1 || '';
                        if (dm2) dm2.value = indicator.ind2 || '';

                    }, 500);

                    appDebug("✅ [自动恢复] 指标参数已加载到内存:", readIndicatorState());
                }
                if (backup.TARGETS) setTargetsState(backup.TARGETS);
                if (Array.isArray(backup.SCHOOL_ALIAS_SETTINGS)) {
                    setSchoolAliasState(backup.SCHOOL_ALIAS_SETTINGS);
                    persistSchoolAliasSettingsLocal();
                }

                if (backup.PREV_DATA) setPrevDataState(backup.PREV_DATA);
                if (backup.HISTORY_ARCHIVE) setHistoryArchiveState(backup.HISTORY_ARCHIVE);
                if (backup.FB_CLASSES) setFbClassesState(backup.FB_CLASSES);
                if (backup.MP_SNAPSHOTS) setMpSnapshotsState(backup.MP_SNAPSHOTS);
                syncRuntimeStateToWindow();
                tryAutoRestoreWorkspaceExam({
                    preferredExamId: backup.CURRENT_EXAM_ID || COHORT_DB?.currentExamId || '',
                    cohortId: CURRENT_COHORT_ID
                });

                const restoredExamMeta =
                    (COHORT_DB && CURRENT_EXAM_ID && COHORT_DB.exams && COHORT_DB.exams[CURRENT_EXAM_ID]?.meta)
                    || (typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {})
                    || {};
                const restoredGrade = getEffectiveGrade(restoredExamMeta);
                if (restoredGrade) applyModeByGrade(restoredGrade);

                const modeMask = document.getElementById('mode-mask');
                const appRoot = document.getElementById('app');
                if (modeMask) modeMask.style.display = 'none';
                if (appRoot) appRoot.classList.remove('hidden');

                if (CONFIG.name) {
                    const modeBadge = document.getElementById('mode-badge');
                    const modeInfo = document.getElementById('mode-info');
                    if (modeBadge) modeBadge.innerText = CONFIG.name;
                    if (modeInfo) modeInfo.innerText = `${CONFIG.name}模式`;
                    renderNavigation();
                }

                scheduleStartupHydration('restore-shell', () => {
                    updateSchoolSelect();
                    updateMySchoolSelect();

                    const mySchoolSelect = document.getElementById('mySchoolSelect');
                    if (MY_SCHOOL && mySchoolSelect) mySchoolSelect.value = MY_SCHOOL;

                    if (typeof CohortDB !== 'undefined') CohortDB.renderExamList();
                    updateExamHistoryStatusBar();
                    UI.toast(`✅ 已加载项目：[${currentKey}]`, 'success');
                });

                scheduleWorkspaceUiRefresh('restore-tables', { delay: 160, idle: true, timeout: 1800, renderTables: false });

                CohortExamHydrationScheduler.schedule(CURRENT_COHORT_ID || readWorkspaceCohortId(), {
                    delay: 700,
                    warnPrefix: '[Init] 云端历史考试拉取失败:'
                });
            }, "正在加载数据...");
        };

        if (isForceRestore === 'true' && backup) {
            localStorage.removeItem('SYS_FORCE_RESTORE');
            await performRestore();
        }
        else if (
            backup &&
            (
                (backup.RAW_DATA && backup.RAW_DATA.length > 0) ||
                (backup.COHORT_DB && backup.COHORT_DB.exams && Object.keys(backup.COHORT_DB.exams).length > 0)
            ) &&
            RAW_DATA.length === 0
        ) {
            await performRestore();
        }
        else {
            showCohortPicker();
        }
    }

    CohortExamHydrationScheduler.schedule(CURRENT_COHORT_ID || readWorkspaceCohortId(), {
        delay: 1200,
        warnPrefix: '[Startup] fetch cohort exams failed:'
    });
});


const Perf = {
    runAsync: (fn, loadingText) => {
        UI.loading(true, loadingText);
        setTimeout(async () => {
            try {
                await fn();
            } catch (e) {
                console.error(e);
                UI.toast("发生错误: " + e.message, 'error');
            } finally {
                UI.loading(false);
            }
        }, 50);
    },
    renderList: (data, templateFn) => {
        if (!data || !data.length) return '';
        return data.map(templateFn).join('');
    }
};
Perf.runAsync = (fn, loadingText) => {
    UI.loading(true, loadingText);
    return new Promise((resolve) => {
        setTimeout(async () => {
            try {
                resolve(await fn());
            } catch (e) {
                console.error(e);
                UI.toast("发生错误: " + e.message, 'error');
                resolve(undefined);
            } finally {
                UI.loading(false);
            }
        }, 50);
    });
};

let CONFIG = {
    name: '6-8年级',
    label: '全科总',
    excRate: 0.05,
    totalSubs: 'auto',
    analysisSubs: 'auto',
    extraDisplaySubs: [],
    showQuery: true,
    mode: 'multi'
};
let RAW_DATA = [], SCHOOLS = {}, SUBJECTS = [], THRESHOLDS = {}, TARGETS = {};
const initialDataSnapshot = syncDataRuntimeState({
    config: (window.CONFIG && typeof window.CONFIG === 'object' && Object.keys(window.CONFIG).length > 0)
        ? window.CONFIG
        : CONFIG,
    rawData: Array.isArray(window.RAW_DATA) ? window.RAW_DATA : RAW_DATA,
    schools: window.SCHOOLS && typeof window.SCHOOLS === 'object' ? window.SCHOOLS : SCHOOLS,
    subjects: Array.isArray(window.SUBJECTS) ? window.SUBJECTS : SUBJECTS,
    thresholds: window.THRESHOLDS && typeof window.THRESHOLDS === 'object' ? window.THRESHOLDS : THRESHOLDS
});
CONFIG = initialDataSnapshot.config && Object.keys(initialDataSnapshot.config).length
    ? { ...CONFIG, ...initialDataSnapshot.config }
    : CONFIG;

function getConfiguredDisplaySubjects(config = CONFIG, options = {}) {
    const analysisSubjects = config.analysisSubs;
    if (!analysisSubjects || analysisSubjects === 'auto') return 'auto';
    const displaySubjects = Array.isArray(analysisSubjects) ? [...analysisSubjects] : [];
    if (options.includeExtra !== false) {
        const extraDisplaySubjects = Array.isArray(config.extraDisplaySubs) ? config.extraDisplaySubs : [];
        extraDisplaySubjects.forEach((subject) => {
            if (subject && !displaySubjects.includes(subject)) displaySubjects.push(subject);
        });
    }
    return displaySubjects;
}

function getConfiguredExtraDisplaySubjects(config = CONFIG) {
    return Array.isArray(config.extraDisplaySubs) ? config.extraDisplaySubs.filter(Boolean) : [];
}
RAW_DATA = initialDataSnapshot.rawData || [];
SCHOOLS = initialDataSnapshot.schools || {};
SUBJECTS = initialDataSnapshot.subjects || [];
THRESHOLDS = initialDataSnapshot.thresholds || {};
const initialSupportSnapshot = syncSupportRuntimeState({
    indicator: window.SYS_VARS?.indicator || { ind1: '', ind2: '' },
    targets: window.TARGETS && typeof window.TARGETS === 'object' ? window.TARGETS : TARGETS,
    schoolAliases: Array.isArray(window.SYS_VARS?.schoolAliases) ? window.SYS_VARS.schoolAliases : [],
    dataManagerSyncState: window.SYS_VARS?.dataManagerSyncState || {},
    prevData: Array.isArray(window.PREV_DATA) ? window.PREV_DATA : [],
    historyArchive: window.HISTORY_ARCHIVE && typeof window.HISTORY_ARCHIVE === 'object' ? window.HISTORY_ARCHIVE : {},
    fbClasses: Array.isArray(window.FB_CLASSES) ? window.FB_CLASSES : [],
    mpSnapshots: window.MP_SNAPSHOTS && typeof window.MP_SNAPSHOTS === 'object' ? window.MP_SNAPSHOTS : {}
});
TARGETS = initialSupportSnapshot.targets || {};
const initialProgressSnapshot = syncProgressRuntimeState({
    progressCache: readProgressCacheState(),
    progressCacheFull: readProgressCacheFullState(),
    manualIdMappings: readManualIdMappingsState(),
    lastVaData: readLastVaDataState(),
    vaViewMode: readProgressViewModeState(),
    quickMode: readProgressQuickModeState()
});
const initialReportSessionSnapshot = syncReportSessionRuntimeState({
    currentReportStudent: readCurrentReportStudentState(),
    currentContextStudents: readCurrentContextStudentsState()
});
var TEACHER_MAP = readTeacherMap(), TEACHER_SCHOOL_MAP = readTeacherSchoolMap(), MY_SCHOOL = "", TEACHER_STATS = readTeacherStats();
window.TEACHER_MAP = TEACHER_MAP;
window.TEACHER_SCHOOL_MAP = TEACHER_SCHOOL_MAP;
MY_SCHOOL = readCurrentSchool();
window.MY_SCHOOL = MY_SCHOOL;
window.TEACHER_STATS = TEACHER_STATS;

function uiAlert(message, type = 'info') {
    if (window.Swal) {
        return Swal.fire({
            title: type === 'error' ? '出错了' : (type === 'warning' ? '提示' : '提示'),
            text: message,
            icon: type === 'error' ? 'error' : (type === 'warning' ? 'warning' : 'info'),
            confirmButtonText: '知道了'
        });
    }
    if (window.UI) {
        const map = { error: 'error', warning: 'warning', info: 'info' };
        UI.toast(message, map[type] || 'info');
        return;
    }
    alert(message);
}

function syncRuntimeStateToWindow() {
    const dataSnapshot = syncDataRuntimeState({
        rawData: RAW_DATA,
        schools: SCHOOLS,
        subjects: SUBJECTS,
        thresholds: THRESHOLDS,
        config: CONFIG
    });
    RAW_DATA = dataSnapshot.rawData || [];
    SCHOOLS = dataSnapshot.schools || {};
    SUBJECTS = dataSnapshot.subjects || [];
    THRESHOLDS = dataSnapshot.thresholds || {};
    CONFIG = dataSnapshot.config || {};
    const supportSnapshot = syncSupportRuntimeState({
        indicator: window.SYS_VARS?.indicator || readIndicatorState(),
        targets: TARGETS,
        schoolAliases: Array.isArray(window.SYS_VARS?.schoolAliases) ? window.SYS_VARS.schoolAliases : readSchoolAliasState(),
        dataManagerSyncState: window.SYS_VARS?.dataManagerSyncState || readDataManagerSyncStateValue(),
        prevData: readLateBoundState(() => PREV_DATA, readPrevDataState()),
        historyArchive: readLateBoundState(() => HISTORY_ARCHIVE, readHistoryArchiveState()),
        fbClasses: readLateBoundState(() => FB_CLASSES, readFbClassesState()),
        mpSnapshots: readLateBoundState(() => MP_SNAPSHOTS, readMpSnapshotsState())
    });
    TARGETS = supportSnapshot.targets || {};
    syncProgressRuntimeState({
        progressCache: readLateBoundState(() => PROGRESS_CACHE, readProgressCacheState()),
        progressCacheFull: readProgressCacheFullState(),
        manualIdMappings: readLateBoundState(() => MANUAL_ID_MAPPINGS, readManualIdMappingsState()),
        lastVaData: readLastVaDataState(),
        vaViewMode: readProgressViewModeState(),
        quickMode: readProgressQuickModeState()
    });
    syncReportSessionRuntimeState({
        currentReportStudent: readLateBoundState(() => CURRENT_REPORT_STUDENT, readCurrentReportStudentState()),
        currentContextStudents: readLateBoundState(() => CURRENT_CONTEXT_STUDENTS, readCurrentContextStudentsState())
    });
    syncCompareSessionRuntimeState({
        cloudCompareTarget: readCloudCompareTargetState(),
        cloudStudentCompareContext: readCloudStudentCompareContextState(),
        cloudComparePrevDataBackup: readCloudComparePrevDataBackupState(),
        duplicateCompareExams: readDuplicateCompareExamsState(),
        duplicateCompareWarnedKey: readDuplicateCompareWarnedKeyState(),
        compareExamSyncState: readCompareExamSyncState()
    });
    const teacherSnapshot = syncTeacherRuntimeState({
        teacherMap: TEACHER_MAP,
        teacherSchoolMap: TEACHER_SCHOOL_MAP,
        teacherStats: TEACHER_STATS
    });
    TEACHER_MAP = teacherSnapshot.teacherMap || {};
    TEACHER_SCHOOL_MAP = teacherSnapshot.teacherSchoolMap || {};
    TEACHER_STATS = teacherSnapshot.teacherStats || {};
    const workspaceSnapshot = syncWorkspaceRuntimeState({
        cohortDb: COHORT_DB,
        currentCohortId: CURRENT_COHORT_ID,
        currentCohortMeta: CURRENT_COHORT_META,
        currentExamId: CURRENT_EXAM_ID,
        currentProjectKey: CURRENT_COHORT_ID ? getCohortKey(CURRENT_COHORT_ID) : readWorkspaceProjectKey()
    });
    COHORT_DB = workspaceSnapshot.cohortDb || null;
    CURRENT_COHORT_ID = workspaceSnapshot.currentCohortId || '';
    CURRENT_COHORT_META = workspaceSnapshot.currentCohortMeta || null;
    CURRENT_EXAM_ID = workspaceSnapshot.currentExamId || '';
    window.COHORT_DB = COHORT_DB;
    window.CURRENT_COHORT_ID = CURRENT_COHORT_ID;
    window.CURRENT_COHORT_META = CURRENT_COHORT_META;
    window.CURRENT_EXAM_ID = CURRENT_EXAM_ID;
    window.CURRENT_PROJECT_KEY = workspaceSnapshot.currentProjectKey || '';
    window.RAW_DATA = RAW_DATA;
    window.SCHOOLS = SCHOOLS;
    window.SUBJECTS = SUBJECTS;
    window.THRESHOLDS = THRESHOLDS;
    window.TEACHER_MAP = TEACHER_MAP;
    window.TEACHER_SCHOOL_MAP = TEACHER_SCHOOL_MAP;
    window.CONFIG = CONFIG;
    window.MY_SCHOOL = MY_SCHOOL;
    window.TEACHER_STATS = TEACHER_STATS;
}

let TEACHER_TOWNSHIP_RANKINGS = {}; MARGINAL_STUDENTS = {};
let POTENTIAL_STUDENTS_CACHE = []; TOWNSHIP_RANKING_DATA = {};
let radarChartInstance = null;
let segmentChartInstance = null; // 新增：分数段直方图实例
let trendChartInstance = null; // 进退步趋势图实例
let TEACHER_STAMP_BASE64 = "";
let HISTORY_ARCHIVE = readHistoryArchiveState();
let ROLLER_COASTER_STUDENTS = []; // 存储波动剧烈的学生名单
let historyChartInstance = null;
let CURRENT_REPORT_STUDENT = initialReportSessionSnapshot.currentReportStudent || null; // 暂存当前正在查询的学生对象
let STD_PAGINATION = {
    page: 1,       // 当前页码
    size: 100,     // 每页显示条数 (调整此数值平衡性能与信息量)
    data: []       // 缓存当前筛选后的完整数据，避免翻页时重复筛选
};

let PREV_DATA = readPrevDataState(); // 进退步分析专用
let PROGRESS_CACHE = [];
let MANUAL_ID_MAPPINGS = {}; // 存储用户手动确认的同名映射关系 key: "Current_Class_Name" -> val: "Prev_Class_Name"
PROGRESS_CACHE = initialProgressSnapshot.progressCache || [];
MANUAL_ID_MAPPINGS = initialProgressSnapshot.manualIdMappings || {};
let balanceChartInstance = null;
let AID_GROUPS_CACHE = [];
let MP_DATA_CACHE = []; // 临界生数据缓存
let MP_SNAPSHOTS = readMpSnapshotsState(); // 持久化存储临界生快照
let CURRENT_CONTEXT_STUDENTS = initialReportSessionSnapshot.currentContextStudents || []; // 标签组件用

let FB_STUDENTS = []; let FB_CLASSES = readFbClassesState(); let FB_CUR_CLASS_IDX = -1; let FB_SIMULATED_DATA = {};
let EXAM_DATA = []; let EXAM_ROOMS = [];

let FB_SCHEMES_CACHE = []; // 存储生成的多种方案

const SUBJECT_ORDER = ['语文', '数学', '英语', '物理', '化学', '政治', '历史', '地理', '生物'];

const NAV_STRUCTURE = window.NAV_STRUCTURE || {};
if (!window.NAV_STRUCTURE) {
    console.warn('shell-runtime.js 未加载，导航结构将保持空对象。');
}

const ModuleSwitchPerfCache = {
    sections: null,
    sectionById: new Map(),
    categoryByModule: new Map(),
    navSignature: '',
    activeId: '',
    activeSection: null,
    primaryColor: '',
    dockRefreshTimer: 0
};

function scheduleAfterPaint(callback, delay = 0) {
    const run = () => {
        try {
            callback();
        } catch (error) {
            console.warn('[scheduleAfterPaint]', error);
        }
    };
    const wait = Math.max(0, Number(delay || 0));
    const scheduleFrame = () => {
        if (typeof window.requestAnimationFrame === 'function') {
            window.requestAnimationFrame(() => window.requestAnimationFrame(run));
            return;
        }
        window.setTimeout(run, 0);
    };
    if (wait > 0) {
        window.setTimeout(scheduleFrame, wait);
    } else {
        scheduleFrame();
    }
}

function removeModuleIntroPanels(scope = document) {
    (scope?.querySelectorAll ? scope : document).querySelectorAll('.module-desc-bar').forEach(panel => panel.remove());
}

function installModuleIntroPanelRemover() {
    removeModuleIntroPanels(document);
    if (window.__MODULE_INTRO_PANEL_REMOVER__) return;
    window.__MODULE_INTRO_PANEL_REMOVER__ = true;
    if (typeof MutationObserver !== 'function') return;
    new MutationObserver((mutations) => {
        mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
            if (!node || node.nodeType !== 1) return;
            node.matches?.('.module-desc-bar') ? node.remove() : removeModuleIntroPanels(node);
        }));
    }).observe(document.documentElement, { childList: true, subtree: true });
}

installModuleIntroPanelRemover();

function getModuleSectionsCached(force = false) {
    if (!force && Array.isArray(ModuleSwitchPerfCache.sections)) {
        return ModuleSwitchPerfCache.sections;
    }
    const sections = Array.from(document.querySelectorAll('.section'));
    ModuleSwitchPerfCache.sections = sections;
    ModuleSwitchPerfCache.sectionById = new Map(sections.map(section => [section.id, section]));
    return sections;
}

function getModuleSectionById(id) {
    const key = String(id || '').trim();
    if (!key) return null;
    if (!ModuleSwitchPerfCache.sectionById.size) getModuleSectionsCached(true);
    return ModuleSwitchPerfCache.sectionById.get(key) || document.getElementById(key);
}

function getModuleCategoryKeyCached(id) {
    const navSignature = Object.keys(NAV_STRUCTURE).map(catKey => {
        const items = Array.isArray(NAV_STRUCTURE[catKey]?.items) ? NAV_STRUCTURE[catKey].items : [];
        return `${catKey}:${items.map(item => item.id).join('|')}`;
    }).join(';');
    if (ModuleSwitchPerfCache.navSignature !== navSignature) {
        ModuleSwitchPerfCache.categoryByModule.clear();
        Object.keys(NAV_STRUCTURE).forEach(catKey => {
            const items = Array.isArray(NAV_STRUCTURE[catKey]?.items) ? NAV_STRUCTURE[catKey].items : [];
            items.forEach(item => {
                if (item?.id) ModuleSwitchPerfCache.categoryByModule.set(item.id, catKey);
            });
        });
        ModuleSwitchPerfCache.navSignature = navSignature;
    }
    return ModuleSwitchPerfCache.categoryByModule.get(id) || null;
}

function scheduleModuleDockRefresh() {
    if (typeof window.refreshModuleSubnavDock !== 'function') return;
    window.clearTimeout(ModuleSwitchPerfCache.dockRefreshTimer);
    ModuleSwitchPerfCache.dockRefreshTimer = window.setTimeout(() => {
        window.refreshModuleSubnavDock();
        window.setTimeout(window.refreshModuleSubnavDock, 120);
    }, 80);
}

function ensureCountySubmoduleSectionForSwitch(id) {
    if (id !== 'county-teacher-portrait' && id !== 'county-school-horizontal') return;
    if (document.getElementById(id)) return;
    const base = document.getElementById('county-analysis');
    if (!base) return;
    const meta = id === 'county-school-horizontal'
        ? {
            title: '县域学校横向分析',
            badge: '全县横向对比',
            desc: '对照“两率一分(横向)”，生成五科总综合分析表和各学科明细表，按县域所有学校统一排名。'
        }
        : {
            title: '县域教师画像',
            badge: '教师县域排名',
            desc: '对照“教师教学质量画像”，把本校教师放到县域所有学校同学科样本中排名，查看学科教师县域站位。'
        };
    const section = document.createElement('div');
    section.id = id;
    section.className = 'section card-box analysis-workspace analysis-workspace-county';
    section.innerHTML = `
        <div class="module-desc-bar analysis-hero" style="border-color:#0f766e;">
            <h3><i class="ti ti-map-2"></i> ${tmEscapeHtml(meta.title)} <span class="badge" style="background:#0f766e;">${tmEscapeHtml(meta.badge)}</span></h3>
            <p>${tmEscapeHtml(meta.desc)}</p>
        </div>
        <div class="county-analysis-root">
            <div class="info-bar analysis-info-band">导入县级成绩后，这里只呈现县域专用分析，不改变联考分析、教学管理和学情诊断的原有口径。</div>
        </div>
    `;
    base.insertAdjacentElement('afterend', section);
    getModuleSectionsCached(true);
}

function getCurrentCategoryKey() {
    return (typeof window.getCurrentNavCategory === 'function')
        ? window.getCurrentNavCategory()
        : 'data';
}

function setCurrentCategoryKey(key) {
    if (typeof window.setCurrentNavCategorySilently === 'function') {
        window.setCurrentNavCategorySilently(key);
    }
}

function syncShellChromeBridge(activeId) {
    if (typeof window.syncShellChrome === 'function') {
        window.syncShellChrome(activeId);
    }
}

function enhanceStudentReportMetrics(root) {
    const scope = root || document;
    const board = scope.querySelector('.report-subject-board');
    if (!board) return;

    if (!scope.querySelector('.report-metric-explain')) {
        const explain = document.createElement('div');
        explain.className = 'report-reality-note report-metric-explain';
        explain.style.marginBottom = '16px';
        explain.innerHTML = `
            <div class="report-reality-title">怎么看百分位和 Z 值</div>
            <ul class="report-reality-list">
                <li><strong>百分位</strong>：可以理解成“这门学科大约超过了多少同届学生”，数值越高越靠前。</li>
                <li><strong>Z 值</strong>：可以理解成“和平均水平差多远”，0 附近接近平均，正数越大优势越明显，负数越小越要优先补弱。</li>
            </ul>
        `;
        board.parentNode.insertBefore(explain, board);
        const tipline = document.createElement('div');
        tipline.className = 'report-metric-tipline';
        tipline.textContent = '一句话记忆：百分位看位置，Z 值看和平均水平差多远。';
        explain.appendChild(tipline);
    }

    board.querySelectorAll('.report-subject-meta span').forEach((span) => {
        const text = String(span.textContent || '').trim();
        if (!text) return;
        if (text.startsWith('百分位')) {
            const value = text.replace(/^百分位\s*/, '').trim();
            span.textContent = `超过同范围 ${value} 学生`;
        }
        if (/^Z\s*/i.test(text)) {
            const value = text.replace(/^Z\s*/i, '').trim();
            span.textContent = `领先指数 Z ${value}`;
        }
    });

    board.querySelectorAll('.report-subject-item').forEach((item) => {
        if (item.querySelector('.report-subject-note')) return;
        const note = document.createElement('div');
        note.className = 'report-subject-note';
        note.textContent = '百分位看位置，Z 值看和平均水平差异。';
        item.appendChild(note);
    });
}

enhanceStudentReportMetrics = function (root) {
    const scope = root || document;
    const board = scope.querySelector('.report-subject-board');
    if (!board) return;

    if (!scope.querySelector('.report-metric-explain')) {
        const explain = document.createElement('div');
        explain.className = 'report-reality-note report-metric-explain';
        explain.style.marginBottom = '16px';
        explain.innerHTML = `
            <div class="report-reality-title">怎么看百分位和 Z 值</div>
            <ul class="report-reality-list">
                <li><strong>百分位</strong>：可以理解成“这门学科大约超过了多少同届学生”，数值越高越靠前。</li>
                <li><strong>Z 值</strong>：可以理解成“和平均水平差多远”，0 附近接近平均，正数越大优势越明显，负数越小越要优先补弱。</li>
            </ul>
        `;
        board.parentNode.insertBefore(explain, board);
        const tipline = document.createElement('div');
        tipline.className = 'report-metric-tipline';
        tipline.textContent = '一句话记忆：百分位看位置，Z 值看和平均水平差多远。';
        explain.appendChild(tipline);
    }

    board.querySelectorAll('.report-subject-meta span').forEach((span) => {
        const text = String(span.textContent || '').trim();
        if (!text) return;
        if (text.startsWith('百分位')) {
            const value = text.replace(/^百分位\s*/, '').trim();
            span.textContent = `超过同范围 ${value} 学生`;
        }
        if (/^Z\s*/i.test(text)) {
            const value = text.replace(/^Z\s*/i, '').trim();
            span.textContent = `领先指数 Z ${value}`;
        }
    });

    board.querySelectorAll('.report-subject-item').forEach((item) => {
        if (item.querySelector('.report-subject-note')) return;
        const note = document.createElement('div');
        note.className = 'report-subject-note';
        note.textContent = '百分位看位置，Z 值看和平均水平差多远。';
        item.appendChild(note);
    });
};

function scrollToAnchor(id, element) {
    const target = document.getElementById(id);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (element && element.closest) {
            const parent = element.closest('.side-nav');
            if (parent) {
                parent.querySelectorAll('.side-nav-link').forEach(el => el.classList.remove('active'));
                parent.querySelectorAll('.side-nav-sub-link').forEach(el => el.classList.remove('active'));
            }
            if (element.classList) element.classList.add('active');
        }
    }
}

function toggleSubNav(element) {
    const container = element.nextElementSibling;
    if (container && container.classList.contains('side-nav-sub-container')) {
        container.classList.toggle('show');
        element.classList.toggle('expanded');
    }
}

function scrollToSubAnchor(id, element) {
    const target = document.getElementById(id);
    if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const sideNav = element.closest('.side-nav');
        if (sideNav) {
            sideNav.querySelectorAll('.side-nav-link').forEach(el => el.classList.remove('active'));
            sideNav.querySelectorAll('.side-nav-sub-link').forEach(el => el.classList.remove('active'));
            const parentContainer = element.closest('.side-nav-sub-container');
            if (parentContainer && parentContainer.previousElementSibling) parentContainer.previousElementSibling.classList.add('active');
        }
        element.classList.add('active');
    }
}

function safeGet(obj, path, defaultValue = '-') { return path.split('.').reduce((acc, key) => acc && acc[key], obj) || defaultValue; }
function getSubjectOrderIndex(sub) { const idx = SUBJECT_ORDER.indexOf(sub); return idx === -1 ? 999 : idx; }
function sortSubjects(a, b) { const idxA = getSubjectOrderIndex(a); const idxB = getSubjectOrderIndex(b); if (idxA !== idxB) return idxA - idxB; return a.localeCompare(b); }

function getExcelPercent(val) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    return { t: 'n', v: val, z: '0.00%' };
}
function getExcelNum(val, decimals = 2) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    return { t: 'n', v: parseFloat(val.toFixed(decimals)) };
}

const XLS_STYLES = {
    HEADER: {
        font: { bold: true, sz: 12, color: { rgb: "333333" }, name: "Microsoft YaHei" },
        fill: { fgColor: { rgb: "E5E7EB" } }, // 浅灰背景
        border: { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true }
    },
    CELL: {
        font: { sz: 11, name: "Arial" },
        border: { top: { style: 'thin', color: { rgb: "E5E7EB" } }, bottom: { style: 'thin', color: { rgb: "E5E7EB" } }, left: { style: 'thin', color: { rgb: "E5E7EB" } }, right: { style: 'thin', color: { rgb: "E5E7EB" } } },
        alignment: { horizontal: "center", vertical: "center" }
    },
    RANK_TOP: {
        font: { bold: true, color: { rgb: "DC2626" } } // 红色
    },
    SCORE_GOOD: {
        font: { color: { rgb: "16A34A" }, bold: true }
    },
    SCORE_BAD: {
        font: { color: { rgb: "DC2626" } }
    }
};

/**
 * 一键美化 Worksheet 对象
 * @param {Object} ws SheetJS 的 worksheet 对象
 * @param {Array} headers 表头数组（用于判断列类型）
 */
function decorateExcelSheet(ws, headers = []) {
    if (!ws['!ref']) return;

    const range = XLSX.utils.decode_range(ws['!ref']);
    const colWidths = [];

    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
            if (!ws[cellRef]) continue;

            const cell = ws[cellRef];
            const headerName = headers[C] || ""; // 获取当前列的表头名

            let style = JSON.parse(JSON.stringify(R === 0 ? XLS_STYLES.HEADER : XLS_STYLES.CELL));

            if (R === 0) {
                if (String(cell.v).includes("总分") || String(cell.v).includes("排名")) {
                    style.fill.fgColor = { rgb: "D1FAE5" }; // 浅绿
                }
            }
            else {
                if (R % 2 === 0) style.fill = { fgColor: { rgb: "F9FAFB" } };

                if (headerName.includes("排名") || headerName.includes("名次")) {
                    if (cell.v === 1 || cell.v === 2 || cell.v === 3) {
                        Object.assign(style.font, XLS_STYLES.RANK_TOP.font);
                        style.fill = { fgColor: { rgb: "FEF3C7" } }; // 浅黄底
                    }
                }

                if (typeof cell.v === 'number') {
                    if (headerName.includes("率") && cell.v < 0.6) {
                        Object.assign(style.font, XLS_STYLES.SCORE_BAD.font);
                    }
                    if ((headerName.includes("分") || headerName.includes("绩")) && cell.v < 60 && cell.v > 0) {
                        Object.assign(style.font, XLS_STYLES.SCORE_BAD.font);
                    }
                }

                if (headerName.includes("姓名") || headerName.includes("学校") || headerName.includes("班级")) {
                    style.alignment.horizontal = "left";
                    style.alignment.indent = 1;
                }
            }

            cell.s = style;

            const valLen = (cell.v ? String(cell.v).length : 0) * 1.5;
            colWidths[C] = Math.max(colWidths[C] || 5, valLen > 50 ? 50 : valLen); // 限制最大宽度
        }
    }

    ws['!cols'] = colWidths.map(w => ({ wch: w + 2 })); // 加一点padding

    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
}


function togglePrivacyMode() {
    const btn = document.getElementById('btn-privacy-toggle');
    const indicator = document.getElementById('privacy-indicator');

    if (!IS_PRIVACY_ON) {
        if (RAW_DATA.length === 0) return alert("请先上传数据后再开启演示模式。");

        if (!confirm("🛡️ 即将进入【隐私演示模式】：\n\n1. 所有学生姓名将变为代码 (如 S-001)\n2. 所有教师姓名将变为代码 (如 T-01)\n3. 适合投屏汇报或截图分享\n\n点击确定继续。")) return;

        DATA_BACKUP_PRIVACY = {
            RAW_DATA: JSON.parse(JSON.stringify(RAW_DATA)),
            TEACHER_MAP: JSON.parse(JSON.stringify(TEACHER_MAP)),
            PREV_DATA: JSON.parse(JSON.stringify(PREV_DATA))
        };

        const stuMap = new Map();
        let stuCounter = 1;

        RAW_DATA.forEach(s => {
            const key = s.name; // 简单按姓名映射，如果有重名会映射成同一个代码，符合演示逻辑
            if (!stuMap.has(key)) {
                stuMap.set(key, `S-${String(stuCounter++).padStart(3, '0')}`);
            }
            s.name = stuMap.get(key);
        });

        if (PREV_DATA.length > 0) {
            PREV_DATA.forEach(p => {
                const key = p.name;
                if (!stuMap.has(key)) {
                    stuMap.set(key, `S-${String(stuCounter++).padStart(3, '0')}`);
                }
                p.name = stuMap.get(key);
            });
        }

        const teacherMap = new Map();
        let teaCounter = 1;
        Object.keys(TEACHER_MAP).forEach(k => {
            const realName = TEACHER_MAP[k];
            if (!teacherMap.has(realName)) {
                teacherMap.set(realName, `T-${String(teaCounter++).padStart(2, '0')}`);
            }
            TEACHER_MAP[k] = teacherMap.get(realName);
        });

        IS_PRIVACY_ON = true;
        btn.innerHTML = '<i class="ti ti-eye"></i> 退出隐私模式';
        btn.style.background = "#dc2626"; // 红色按钮提示退出
        indicator.style.display = "block";
        document.body.classList.add('privacy-mode-active'); // 可用于CSS扩展

    } else {
        if (DATA_BACKUP_PRIVACY) {
            setRawData(DATA_BACKUP_PRIVACY.RAW_DATA);
            setTeacherMap(DATA_BACKUP_PRIVACY.TEACHER_MAP);
            setPrevDataState(DATA_BACKUP_PRIVACY.PREV_DATA);
            DATA_BACKUP_PRIVACY = null;
        }

        IS_PRIVACY_ON = false;
        btn.innerHTML = '<i class="ti ti-eye-off"></i> 开启隐私模式';
        btn.style.background = "rgba(255,255,255,0.2)";
        indicator.style.display = "none";
        document.body.classList.remove('privacy-mode-active');
    }

    setSchools({});
    setTeacherStats({});
    TEACHER_TOWNSHIP_RANKINGS = {};

    processData();
    calculateRankings();

    if (Object.keys(TEACHER_MAP).length > 0 && MY_SCHOOL) {
        analyzeTeachers();
    }

    renderTables();

    if (document.getElementById('teacherCardsContainer')) {
        renderTeacherCards();
        renderTeacherComparisonTable();
        renderTeacherTownshipRanking();
    }
    if (document.getElementById('progress-analysis').classList.contains('active')) {
        if (PREV_DATA.length > 0) renderProgressAnalysis();
    }

    alert(IS_PRIVACY_ON ? "✅ 隐私模式已开启：姓名已脱敏，可进行汇报演示。" : "✅ 隐私模式已退出：数据已还原。");
}

window.IS_GUEST_MODE = false; // 全局标记

function toggleGuestMode() {
    const btn = document.getElementById('btn-guest-mode');

    if (!window.IS_GUEST_MODE) {
        Swal.fire({
            title: '🔥 开启“阅后即焚”模式？',
            html: `
                    <div style="text-align:left; font-size:14px; color:#555;">
                        <p>此模式适用于公用电脑或临时处理数据。</p>
                        <ul style="color:#b91c1c; font-weight:bold;">
                            <li>1. 立即清空现有的自动存档。</li>
                            <li>2. 停止一切自动备份功能。</li>
                            <li>3. 关闭页面或刷新后，所有数据将永久丢失。</li>
                        </ul>
                        <p>确定要进入此模式吗？</p>
                    </div>
                `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            confirmButtonText: '确定开启 (清除旧缓存)',
            cancelButtonText: '取消'
        }).then(async (result) => {
            if (result.isConfirmed) {
                await DB.clear('autosave_backup');

                localStorage.removeItem('FB_DATA_BACKUP');
                localStorage.removeItem('MP_SNAPSHOTS');

                window.IS_GUEST_MODE = true;

                btn.innerHTML = '<i class="ti ti-flame-off"></i> 退出并清空';
                btn.style.background = "#dc2626";
                btn.style.borderColor = "#b91c1c";

                document.body.style.borderTop = "5px solid #dc2626";
                const statusEl = document.getElementById('auto-backup-status');
                if (statusEl) statusEl.innerHTML = `<span style="color:#dc2626; font-weight:bold;">🔥 阅后即焚模式：数据不落地</span>`;

                UI.toast("🔥 已开启阅后即焚：旧缓存已清理，新数据将不再保存。", "success");
            }
        });

    } else {
        Swal.fire({
            title: '退出阅后即焚',
            text: "退出将刷新页面并重置系统。当前屏幕上的数据将会丢失。",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '退出并刷新',
            confirmButtonColor: '#4f46e5'
        }).then((result) => {
            if (result.isConfirmed) {
                location.reload(); // 直接刷新，回归初始状态
            }
        });
    }
}

const originalSaveSnapshot = saveProjectSnapshot; // 备份原函数
saveProjectSnapshot = function () {
    if (window.IS_GUEST_MODE) {
        Swal.fire({
            title: '⚠️ 模式限制',
            text: '当前处于“阅后即焚”模式，禁止保存项目快照到本地硬盘。请先退出此模式。',
            icon: 'error',
            confirmButtonColor: '#dc2626'
        });
        return;
    }
    originalSaveSnapshot();
};

function initSystem(type) {
    hideCohortPicker();
    document.getElementById('app').classList.remove('hidden');
    if (type === '6-8') setConfigState({ name: '6-8年级', label: '全科总', excRate: 0.05, totalSubs: 'auto', analysisSubs: 'auto', extraDisplaySubs: [], showQuery: true });
    else setConfigState({ name: '9年级', label: '五科总', excRate: 0.06, totalSubs: ['语文', '数学', '英语', '物理', '化学'], analysisSubs: ['语文', '数学', '英语', '物理', '化学'], extraDisplaySubs: ['政治'], showQuery: true });
    const modeBadge = document.getElementById('mode-badge');
    const modeInfo = document.getElementById('mode-info');
    if (modeBadge) modeBadge.innerText = CONFIG.name;
    if (modeInfo) {
        const displayOnlyText = Array.isArray(CONFIG.extraDisplaySubs) && CONFIG.extraDisplaySubs.length
            ? `，单科展示: ${CONFIG.extraDisplaySubs.join('、')}`
            : '';
        modeInfo.innerText = `${CONFIG.name}模式 (总分: ${CONFIG.label}${displayOnlyText}, 后1/3剔除: ${CONFIG.excRate * 100}%)`;
    }
    document.querySelectorAll('.label-total').forEach(e => e.innerText = CONFIG.label);
    const labelExc = document.getElementById('label-exc');
    if (labelExc) labelExc.innerText = (CONFIG.excRate * 100) + '%';
    renderNavigation();
}

let __guardBypass = false;
let __guardResumeModuleId = '';
let __guardResumeToastAt = 0;

function getGuardSessionUser() {
    if (window.AuthState && typeof window.AuthState.getCurrentUser === 'function') {
        return window.AuthState.getCurrentUser();
    }
    if (window.Auth && window.Auth.currentUser) return window.Auth.currentUser;
    return null;
}

function canRecoverCloudScoresFromGuard() {
    const user = getGuardSessionUser();
    return !!(user && !user.local_only && typeof loadCloudData === 'function');
}

function showBaseConfigGuardModal(missing) {
    const missingList = Array.isArray(missing) ? missing.filter(Boolean) : [];
    if (!missingList.length) return;
    if (!window.Swal || typeof Swal.fire !== 'function') {
        alert(`需要先完成基础配置：${missingList.join('、')}`);
        return;
    }
    Swal.fire({
        title: '⛔ 需要先完成基础配置',
        html: `<div style="text-align:left; font-size:13px; color:#475569;">
                    缺少：<strong>${missingList.join('、')}</strong><br>
                    建议先进入<strong>新手入口</strong>完成引导步骤。
                </div>`,
        showCancelButton: true,
        confirmButtonText: '去可用入口',
        cancelButtonText: '我知道了',
        confirmButtonColor: '#0ea5e9'
    }).then((r) => {
        if (r.isConfirmed) {
            __guardBypass = true;
            const fallbackIds = ['starter-hub', 'teacher-analysis', 'student-overview', 'report-generator'];
            const targetId = fallbackIds.find((moduleId) => typeof canAccessModule !== 'function' || canAccessModule(moduleId))
                || 'starter-hub';
            switchTab(targetId);
        }
    });
}

function closeBaseConfigGuardModalIfRecovered() {
    if (!Array.isArray(RAW_DATA) || RAW_DATA.length === 0) return;
    if (!window.Swal || typeof Swal.isVisible !== 'function' || typeof Swal.close !== 'function') return;
    if (!Swal.isVisible()) return;
    const title = String(Swal.getTitle?.()?.textContent || '').trim();
    if (title.includes('需要先完成基础配置')) {
        Swal.close();
    }
}

function flushDeferredGuardResume(reason = '') {
    if (!__guardResumeModuleId || !Array.isArray(RAW_DATA) || RAW_DATA.length === 0) return false;
    const pendingId = __guardResumeModuleId;
    __guardResumeModuleId = '';
    closeBaseConfigGuardModalIfRecovered();
    window.setTimeout(() => {
        if (typeof switchTab !== 'function') return;
        __guardBypass = true;
        switchTab(pendingId);
    }, reason === 'snapshot' ? 90 : 140);
    return true;
}

function queueGuardedModuleUntilScoresReady(id) {
    if (!id || typeof loadCloudData !== 'function') return false;
    __guardResumeModuleId = id;
    closeBaseConfigGuardModalIfRecovered();
    const now = Date.now();
    if (window.UI && now - __guardResumeToastAt > 1500) {
        UI.toast('成绩数据正在恢复，稍后会自动进入该模块。', 'info');
        __guardResumeToastAt = now;
    }
    Promise.resolve(loadCloudData())
        .then(() => {
            if (flushDeferredGuardResume('cloud-load')) return;
            if (__guardResumeModuleId === id) {
                __guardResumeModuleId = '';
                showBaseConfigGuardModal(['成绩数据']);
            }
        })
        .catch((error) => {
            console.warn('[Guard] deferred cloud restore failed:', error);
            if (__guardResumeModuleId === id) {
                __guardResumeModuleId = '';
                showBaseConfigGuardModal(['成绩数据']);
            }
        });
    return false;
}

if (!window.__BASE_CONFIG_GUARD_CLOUD_EVENTS__) {
    window.__BASE_CONFIG_GUARD_CLOUD_EVENTS__ = true;
    window.addEventListener('cloud-load-state', (event) => {
        const detail = event?.detail || {};
        if (detail.stage === 'loaded' || detail.stage === 'settled') {
            closeBaseConfigGuardModalIfRecovered();
            if (detail.hasScores) {
                flushDeferredGuardResume('cloud-event');
            }
        }
    });
}

function guardBeforeSwitch(id) {
    if (id === 'starter-hub' || id === 'upload') return true;
    const needGuard = [
        'summary', 'analysis', 'county-analysis', 'high-score', 'indicator', 'bottom3',
        'teacher-analysis', 'teacher-detail-comparison', 'teacher-pairing', 'teacher-township-ranking',
        'student-overview', 'student-details', 'blank-score-audit', 'subject-balance', 'marginal-push', 'progress-analysis', 'cohort-growth',
        'potential-analysis', 'segment-analysis', 'correlation-analysis', 'report-generator'
    ];
    if (!needGuard.includes(id)) return true;

    const termId = readCurrentTermId() || (typeof getTermId === 'function' ? getTermId(getExamMetaFromUI()) : '');
    const hasSchool = !!MY_SCHOOL;
    const hasScores = RAW_DATA && RAW_DATA.length > 0;
    const missing = [];
    if (!termId) missing.push('学期');
    if (!hasSchool) missing.push('本校');
    if (!hasScores) missing.push('成绩数据');

    if (!hasScores && missing.length === 1 && missing[0] === '成绩数据' && canRecoverCloudScoresFromGuard()) {
        return queueGuardedModuleUntilScoresReady(id);
    }

    if (missing.length) {
        showBaseConfigGuardModal(missing);
        return false;
    }
    return true;
}

function tmEscapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function tmSetHtml(id, html) {
    const el = document.getElementById(id);
    if (el && el.innerHTML !== html) el.innerHTML = html;
}

function tmLooksLikePendingValue(value) {
    const text = String(value || '').trim();
    if (!text) return true;
    return text.includes('请选择') || text.includes('考试数量不足') || text.includes('正在同步');
}

function tmGetSelectDisplayValue(ids, fallback = '') {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const text = el.selectedOptions && el.selectedOptions[0]
            ? String(el.selectedOptions[0].textContent || '').trim()
            : String(el.value || '').trim();
        if (tmLooksLikePendingValue(text)) continue;
        return text;
    }
    return fallback;
}

function tmGetSelectRawValue(ids, fallback = '') {
    for (const id of ids) {
        const el = document.getElementById(id);
        if (!el) continue;
        const value = String(el.value || '').trim();
        if (tmLooksLikePendingValue(value)) continue;
        return value;
    }
    return fallback;
}

function tmBuildStatusChip(text, tone = 'neutral') {
    return `<span class="status-chip ${tone}">${tmEscapeHtml(text)}</span>`;
}

function tmBuildStatCard(title, stateText, tone, main, sub) {
    return `
        <div class="tm-stat-card-inner">
            <div class="tm-stat-head">
                <strong>${tmEscapeHtml(title)}</strong>
                ${tmBuildStatusChip(stateText, tone)}
            </div>
            <div class="tm-stat-main">${tmEscapeHtml(main)}</div>
            <div class="tm-stat-sub">${tmEscapeHtml(sub)}</div>
        </div>
    `;
}

function tmBuildMiniCard(title, value) {
    return `
        <div class="tm-mini-card">
            <strong>${tmEscapeHtml(title)}</strong>
            <span>${tmEscapeHtml(value)}</span>
        </div>
    `;
}

var TM_TEACHER_COVERAGE_CACHE = { teacherMap: null, result: null };
var TM_AVAILABLE_EXAM_LIST_CACHE = { signature: '', result: [] };
var TM_TEACHER_INSIGHT_CACHE = {
    stats: null,
    subjectFilter: '',
    teacherFilter: '',
    result: null
};

function tmGetTeacherCoverageFromMap() {
    const teacherMap = window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object' ? window.TEACHER_MAP : {};
    if (TM_TEACHER_COVERAGE_CACHE.teacherMap === teacherMap && TM_TEACHER_COVERAGE_CACHE.result) {
        return TM_TEACHER_COVERAGE_CACHE.result;
    }
    const keys = Object.keys(teacherMap);
    const teachers = new Set();
    const classes = new Set();
    const subjects = new Set();
    keys.forEach((key) => {
        const teacherName = String(teacherMap[key] || '').trim();
        if (teacherName) teachers.add(teacherName);
        const [className, subjectName] = String(key).split('_');
        if (className) classes.add(String(className).trim());
        if (subjectName) subjects.add(String(subjectName).trim());
    });
    const result = {
        mappingCount: keys.length,
        teacherCount: teachers.size,
        classCount: classes.size,
        subjectCount: subjects.size
    };
    TM_TEACHER_COVERAGE_CACHE = { teacherMap, result };
    return result;
}

function tmGetAvailableExamList() {
    const db = (typeof CohortDB !== 'undefined' && CohortDB && typeof CohortDB.ensure === 'function')
        ? CohortDB.ensure()
        : (window.COHORT_DB || null);
    const examSignature = db?.exams && typeof db.exams === 'object'
        ? Object.values(db.exams).map(ex => [
            String(ex?.examId || ex?.id || ''),
            String(ex?.createdAt || 0),
            String(ex?.fingerprint || ''),
            Array.isArray(ex?.data) ? ex.data.length : 0
        ].join(':')).sort().join('|')
        : '';
    const cloudHistorySignature = Array.isArray(window.PREV_DATA)
        ? window.PREV_DATA.map(row => [
            String(row?.examFullKey || row?.examId || ''),
            String(row?.fingerprint || ''),
            String(row?.updatedAt || '')
        ].join(':')).sort().join('|')
        : '';
    const signature = [
        typeof listAvailableExamsForCompare === 'function' ? 'compare' : 'local',
        String(CURRENT_COHORT_ID || window.CURRENT_COHORT_ID || ''),
        String(CURRENT_EXAM_ID || window.CURRENT_EXAM_ID || ''),
        String(window.__RAW_DATA_VERSION || 0),
        Array.isArray(RAW_DATA) ? RAW_DATA.length : 0,
        examSignature,
        cloudHistorySignature
    ].join('::');
    if (TM_AVAILABLE_EXAM_LIST_CACHE.signature === signature && Array.isArray(TM_AVAILABLE_EXAM_LIST_CACHE.result)) {
        return TM_AVAILABLE_EXAM_LIST_CACHE.result.map(ex => ({ ...ex }));
    }
    if (typeof listAvailableExamsForCompare === 'function') {
        const compareList = listAvailableExamsForCompare();
        if (Array.isArray(compareList) && compareList.length) {
            TM_AVAILABLE_EXAM_LIST_CACHE = { signature, result: compareList.map(ex => ({ ...ex })) };
            return compareList;
        }
    }
    if (db?.exams && typeof db.exams === 'object') {
        const result = Object.values(db.exams).map(ex => ({
            id: ex?.examId || ex?.id || '',
            label: ex?.examLabel || ex?.label || ex?.examId || ex?.id || '',
            createdAt: ex?.createdAt || 0
        })).filter(ex => ex.id);
        TM_AVAILABLE_EXAM_LIST_CACHE = { signature, result: result.map(ex => ({ ...ex })) };
        return result;
    }
    TM_AVAILABLE_EXAM_LIST_CACHE = { signature, result: [] };
    return [];
}

function tmBuildTeacherInsight(subjectFilter = '', teacherFilter = '') {
    const stats = readTeacherStats();
    const useSubjectFilter = String(subjectFilter || '').trim();
    const useTeacherFilter = String(teacherFilter || '').trim();
    if (TM_TEACHER_INSIGHT_CACHE.stats === stats
        && TM_TEACHER_INSIGHT_CACHE.subjectFilter === useSubjectFilter
        && TM_TEACHER_INSIGHT_CACHE.teacherFilter === useTeacherFilter
        && TM_TEACHER_INSIGHT_CACHE.result) {
        return TM_TEACHER_INSIGHT_CACHE.result;
    }
    const teacherSet = new Set();
    const classSet = new Set();
    const subjectSet = new Set();
    const lowRiskTeachers = new Set();
    const scoreRiskTeachers = new Set();
    const passRiskTeachers = new Set();
    const subjectBuckets = {};

    Object.entries(stats).forEach(([teacherName, subjectMap]) => {
        if (useTeacherFilter && useTeacherFilter !== '全部教师' && teacherName !== useTeacherFilter) return;
        Object.entries(subjectMap || {}).forEach(([subjectName, data]) => {
            if (useSubjectFilter && useSubjectFilter !== '全部学科' && subjectName !== useSubjectFilter) return;
            teacherSet.add(teacherName);
            subjectSet.add(subjectName);

            const classText = Array.isArray(data?.classes) ? data.classes.join(',') : String(data?.classes || '');
            classText
                .split(',')
                .map(item => item.trim())
                .filter(Boolean)
                .forEach(item => classSet.add(item));

            const lowRate = Number(data?.lowRate || 0);
            const passRate = Number(data?.passRate || 0);
            const fairScore = Number(data?.fairScore ?? data?.finalScore ?? 0);
            const baselineAdjustment = Number(data?.baselineAdjustment || 0);
            const sampleStabilityRate = Number(data?.sampleStabilityRate || 0);
            const sampleShiftCount = Number(data?.sampleShiftCount || 0);
            const teacherChangeProtected = !!data?.teacherChangeProtected;
            const conversionScore = Number(data?.conversionScore || 50);

            if (lowRate >= 0.12) lowRiskTeachers.add(teacherName);
            if (passRate > 0 && passRate < 0.6) passRiskTeachers.add(teacherName);
            if ((fairScore > 0 && fairScore < 60) || baselineAdjustment <= -6 || teacherChangeProtected || conversionScore < 45 || (sampleStabilityRate > 0 && sampleStabilityRate < 0.75 && sampleShiftCount >= 3)) scoreRiskTeachers.add(teacherName);

            if (!subjectBuckets[subjectName]) {
                subjectBuckets[subjectName] = {
                    count: 0,
                    totalLowRate: 0,
                    totalScore: 0,
                    riskCount: 0
                };
            }
            subjectBuckets[subjectName].count += 1;
            subjectBuckets[subjectName].totalLowRate += lowRate;
            subjectBuckets[subjectName].totalScore += fairScore;
            if (lowRate >= 0.12 || fairScore < 60 || baselineAdjustment <= -6 || teacherChangeProtected || conversionScore < 45 || (passRate > 0 && passRate < 0.6) || (sampleStabilityRate > 0 && sampleStabilityRate < 0.75 && sampleShiftCount >= 3)) {
                subjectBuckets[subjectName].riskCount += 1;
            }
        });
    });

    const focusSubject = Object.entries(subjectBuckets)
        .map(([subjectName, bucket]) => ({
            subjectName,
            avgLowRate: bucket.count ? bucket.totalLowRate / bucket.count : 0,
            avgScore: bucket.count ? bucket.totalScore / bucket.count : 0,
            riskCount: bucket.riskCount
        }))
        .sort((a, b) => {
            if (b.riskCount !== a.riskCount) return b.riskCount - a.riskCount;
            if (b.avgLowRate !== a.avgLowRate) return b.avgLowRate - a.avgLowRate;
            return a.avgScore - b.avgScore;
        })[0] || null;

    const result = {
        teacherCount: teacherSet.size,
        classCount: classSet.size,
        subjectCount: subjectSet.size,
        lowRiskTeacherCount: lowRiskTeachers.size,
        scoreRiskTeacherCount: scoreRiskTeachers.size,
        passRiskTeacherCount: passRiskTeachers.size,
        riskTeacherCount: new Set([...lowRiskTeachers, ...scoreRiskTeachers, ...passRiskTeachers]).size,
        focusSubject
    };
    TM_TEACHER_INSIGHT_CACHE = {
        stats,
        subjectFilter: useSubjectFilter,
        teacherFilter: useTeacherFilter,
        result
    };
    return result;
}

function tmApplySelectValue(selectId, preferredValue = '', preferredText = '') {
    const el = document.getElementById(selectId);
    if (!el) return false;
    const valueText = String(preferredValue || '').trim();
    const labelText = String(preferredText || preferredValue || '').trim();
    if (!valueText && !labelText) return false;

    let matched = null;
    const options = Array.from(el.options || []);
    if (valueText) {
        matched = options.find(opt => String(opt.value || '').trim() === valueText);
    }
    if (!matched && labelText) {
        matched = options.find(opt => String(opt.textContent || '').trim() === labelText);
    }
    if (!matched) return false;

    el.value = matched.value;
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
}


function forceHideAllSectionsExcept(targetId = '') {
    const sections = getModuleSectionsCached(false);
    sections.forEach(el => {
        if (targetId && el.id === targetId) return;
        if (!el.classList.contains('active') && el.style.display === 'none') return;
        el.classList.remove('active');
        el.style.display = 'none';
    });
    if (targetId) {
        ModuleSwitchPerfCache.activeId = targetId;
        ModuleSwitchPerfCache.activeSection = getModuleSectionById(targetId);
    }
}

function enforceSectionIsolation(targetId) {
    if (!targetId) return;
    const targetSection = document.getElementById(targetId);
    forceHideAllSectionsExcept(targetId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
}

function resetMainViewport() {
    const appMain = document.querySelector('.app-main');
    if (appMain && typeof appMain.scrollTo === 'function') {
        appMain.scrollTo({ top: 0, behavior: 'auto' });
    }
    if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'auto' });
    }
}

function scheduleCountyAnalysisRenderAfterSwitch(id) {
    if (window.__SMOKE_LIGHTWEIGHT_MODULE_SWITCH__) {
        return;
    }
    if (id !== 'county-teacher-portrait' && id !== 'county-school-horizontal' && id !== 'county-analysis') {
        return;
    }
    const isCountyTargetActive = () => {
        if (document.getElementById(id)?.classList.contains('active')) return true;
        return id === 'county-analysis'
            && (document.getElementById('county-teacher-portrait')?.classList.contains('active')
                || document.getElementById('county-school-horizontal')?.classList.contains('active'));
    };
    const renderCounty = () => {
        if (!isCountyTargetActive()) return false;
        if (typeof window.renderCountyAnalysis !== 'function') return false;
        const result = window.renderCountyAnalysis(id);
        if (result && typeof result.then === 'function') {
            result
                .then(() => window.setTimeout(renderCounty, 0))
                .catch(error => console.warn('county analysis runtime render failed:', error));
            return false;
        }
        return true;
    };
    if (renderCounty()) return;
    const retryDelays = [160, 480, 1000, 1800];
    retryDelays.forEach(delay => window.setTimeout(renderCounty, delay));
    if (typeof window.ensureCountyAnalysisRuntimeLoaded === 'function') {
        window.ensureCountyAnalysisRuntimeLoaded()
            .then(() => {
                renderCounty();
                window.setTimeout(renderCounty, 120);
            })
            .catch(error => console.warn('county analysis runtime load failed:', error));
    }
}

function closeBlockingModalsBeforeModuleSwitch() {
    const modalIds = [
        'drill-modal',
        'target-editor-modal',
        'teacherModal',
        'mobileShareModal',
        'mappingModal',
        'cert-modal',
        'school-profile-modal',
        'skin-modal',
        'admin-modal',
        'user-password-modal',
        'issue-submit-modal',
        'admin-issue-modal',
        'admin-log-modal',
        'account-manager-modal',
        'login-session-modal',
        'data-manager-modal',
        'version-center-backdrop'
    ];
    modalIds.forEach((modalId) => {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        const display = window.getComputedStyle ? getComputedStyle(modal).display : modal.style.display;
        if (display !== 'none') {
            modal.style.display = 'none';
        }
        if (modal.hasAttribute('aria-hidden')) modal.setAttribute('aria-hidden', 'true');
    });
    document.querySelectorAll('.modal').forEach((modal) => {
        const display = window.getComputedStyle ? getComputedStyle(modal).display : modal.style.display;
        if (display !== 'none') modal.style.display = 'none';
    });
    const releaseHistoryDrawer = document.getElementById('app-release-history-drawer');
    if (releaseHistoryDrawer) releaseHistoryDrawer.hidden = true;
    const spotlight = document.getElementById('spotlight-mask');
    if (spotlight) spotlight.style.display = 'none';
    document.body.classList.remove('app-release-history-open', 'version-center-open');
}

function switchTab(id) {
    if (id === 'school-internal-grades') {
        console.warn('school-internal-grades has been removed; redirecting to exam-arranger');
        id = 'exam-arranger';
    }
    const removedModuleRedirects = {
        'macro-watch': 'summary',
        'teaching-overview': 'teacher-analysis',
        'teaching-issue-board': 'teacher-analysis',
        'teaching-warning-center': 'teacher-analysis',
        'teaching-rectify-center': 'teacher-analysis',
        'teaching-version-center': 'teacher-analysis',
        'single-school-eval': 'teacher-analysis'
    };
    if (removedModuleRedirects[id]) {
        console.warn(`${id} has been removed; redirecting to ${removedModuleRedirects[id]}`);
        id = removedModuleRedirects[id];
    }
    if (window.DEBUG_MODULE_SWITCH) console.debug(`🔄 切换模块: ${id}`);
    if (!canAccessModule(id)) {
        alert('⛔ 权限不足：该模块对当前角色不可见');
        return;
    }
    if (!__guardBypass && !guardBeforeSwitch(id)) return;
    if (__guardBypass) __guardBypass = false;
    closeBlockingModalsBeforeModuleSwitch();
    if (typeof window.ensureLazySectionLoaded === 'function') {
        const before = getModuleSectionById(id);
        const loaded = window.ensureLazySectionLoaded(id);
        if (loaded) removeModuleIntroPanels(document);
        if (loaded && loaded !== before) getModuleSectionsCached(true);
    }
    ensureCountySubmoduleSectionForSwitch(id);
    removeModuleIntroPanels(document);

    forceHideAllSectionsExcept(id);
    const teacherInsightModuleIds = ['teacher-analysis', 'teacher-detail-comparison', 'teacher-pairing', 'teacher-township-ranking'];
    if (!teacherInsightModuleIds.includes(id) && typeof window.releaseTeacherAnalysisHeavyDom === 'function') {
        window.setTimeout(() => window.releaseTeacherAnalysisHeavyDom(), 0);
    }
    const targetSection = getModuleSectionById(id);
    if (!targetSection) {
        console.error(`❌ 找不到模块: ${id}`);
        alert(`模块 "${id}" 不存在，请联系管理员`);
        return;
    }
    if (window.DEBUG_MODULE_SWITCH) console.debug(`✅ 激活模块: ${id}`);
    targetSection.classList.add('active');
    targetSection.style.display = 'block';
    if (id === 'blank-score-audit' && typeof renderBlankScoreAuditModule === 'function') {
        scheduleAfterPaint(() => renderBlankScoreAuditModule());
    }
    resetMainViewport();
    scheduleAfterPaint(() => scheduleCountyAnalysisRenderAfterSwitch(id));

    let currentCategory = getCurrentCategoryKey();
    let foundCategory = getModuleCategoryKeyCached(id);

    if (foundCategory && foundCategory !== currentCategory) {
        setCurrentCategoryKey(foundCategory);
        currentCategory = foundCategory;
        const newColor = NAV_STRUCTURE[currentCategory]?.color || '#334155';
        if (ModuleSwitchPerfCache.primaryColor !== newColor) {
            document.documentElement.style.setProperty('--primary', newColor);
            ModuleSwitchPerfCache.primaryColor = newColor;
        }

        if (typeof renderNavigation === 'function') scheduleAfterPaint(() => renderNavigation());
    } else {
        if (typeof renderSubNavigation === 'function') {
            scheduleAfterPaint(() => renderSubNavigation());
        }
    }

    const currentCategoryMeta = NAV_STRUCTURE[currentCategory] || NAV_STRUCTURE.data || null;
    const dispatchModuleEnter = () => {
        if (typeof window.runModuleTabEnter !== 'function') return false;
        window.runModuleTabEnter({ id, currentCategory, currentCategoryMeta }).catch((error) => {
            console.error('switchTab module dispatch failed:', error);
        });
        return true;
    };
    scheduleAfterPaint(() => {
        removeModuleIntroPanels(document);
        if (dispatchModuleEnter()) return;
        window.setTimeout(dispatchModuleEnter, 180);
        window.setTimeout(dispatchModuleEnter, 700);
    });
    scheduleModuleDockRefresh();
}

function ensureDrillModalDom() {
    if (typeof window.ensureLazySectionLoaded === 'function') {
        window.ensureLazySectionLoaded('drill-modal');
    }
    return document.getElementById('drill-modal');
}

const DrillSystem = {
    history: [], // 导航历史栈
    currentData: null, // 当前暂存数据
    exportData: null, // 🟢 新增：专门用于导出的数据缓存

    open: function (title, studentList, scoreLabel = "总分") {
        ensureDrillModalDom();
        this.history = []; // 清空历史
        this.currentData = { title, list: studentList, scoreLabel };

        this.exportData = { type: 'list', data: studentList, fileName: title };

        const btn = document.getElementById('drill-export-btn');
        if (btn) btn.classList.remove('hidden');

        document.getElementById('drill-modal').style.display = 'flex';
        this.renderClassView();
    },

    exportExcel: function () {
        if (!this.exportData || !this.exportData.data) return alert("当前无数据可导出");

        const wb = XLSX.utils.book_new();
        let ws = null;
        const filename = (this.exportData.fileName || "导出数据") + ".xlsx";

        if (this.exportData.type === 'gap') {
            const headers = ['班级', '姓名', '当前总分', '距目标分差', '建议补救/潜力学科', '该科与年级均分差'];
            const data = [headers];
            this.exportData.data.forEach(item => {
                const cleanSub = item.worstSub.replace(/<[^>]+>/g, "");
                data.push([
                    item.class,
                    item.name,
                    item.total,
                    item.scoreGap.toFixed(1),
                    cleanSub,
                    item.worstDiff
                ]);
            });
            ws = XLSX.utils.aoa_to_sheet(data);
            ws['!cols'] = [{ wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 30 }, { wch: 15 }];

        } else {
            const headers = ['班级', '姓名', '考号', '总分', '全镇排名'];
            const data = [headers];
            this.exportData.data.forEach(s => {
                data.push([
                    s.class,
                    s.name,
                    s.id,
                    s.total,
                    safeGet(s, 'ranks.total.township', '-')
                ]);
            });
            ws = XLSX.utils.aoa_to_sheet(data);
        }

        XLSX.utils.book_append_sheet(wb, ws, "导出数据");
        XLSX.writeFile(wb, filename);
    },

    renderClassView: function () {
        const { title, list, scoreLabel } = this.currentData;
        document.getElementById('drill-title').innerText = title;
        document.getElementById('drill-back-btn').classList.add('hidden');

        const classMap = {};
        list.forEach(s => {
            if (!classMap[s.class]) classMap[s.class] = [];
            classMap[s.class].push(s);
        });

        const classes = Object.keys(classMap).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

        let html = `<div class="drill-class-grid">`;
        classes.forEach(cls => {
            const count = classMap[cls].length;
            html += `
                    <div class="drill-class-card" onclick="DrillSystem.renderStudentView('${cls}')">
                        <div class="drill-label">${cls}</div>
                        <div class="drill-val">${count} 人</div>
                        <div class="drill-label" style="font-size:10px;">点击查看名单 &gt;</div>
                    </div>`;
        });
        html += `</div>`;

        if (list.length === 0) html = '<div style="text-align:center; padding:30px; color:#999;">暂无相关学生数据</div>';

        document.getElementById('drill-content').innerHTML = html;
        document.getElementById('drill-footer').innerText = `合计: ${list.length} 人`;
    },

    renderStudentView: function (className) {
        const { list, scoreLabel } = this.currentData;
        this.history.push('class_view');

        document.getElementById('drill-title').innerText = `${className} - 名单`;
        document.getElementById('drill-back-btn').classList.remove('hidden');

        const students = list.filter(s => s.class === className).sort((a, b) => b.total - a.total);

        let html = `<div class="drill-stu-list">`;
        students.forEach(s => {
            html += `
                    <div class="drill-stu-tag">
                        <span style="cursor:pointer;" onclick="jumpToStudent(${jsStringLiteral(s.name)}, ${jsStringLiteral(s.school)}, ${jsStringLiteral(s.class)}); document.getElementById('drill-modal').style.display='none';">${s.name}</span>
                        <span class="drill-stu-score">${s.total}</span>
                    </div>`;
        });
        html += `</div>`;

        document.getElementById('drill-content').innerHTML = html;
    },

    goBack: function () {
        if (this.history.length > 0) {
            this.history.pop();
            this.renderClassView();
        }
    }
};

function getIndicatorRankParams() {
    const indicator = window.SYS_VARS?.indicator || {};
    const raw1 = indicator.ind1 || document.getElementById('dm_ind1_input')?.value || document.getElementById('ind1')?.value || '';
    const raw2 = indicator.ind2 || document.getElementById('dm_ind2_input')?.value || document.getElementById('ind2')?.value || '';
    return {
        r1: parseInt(String(raw1).trim(), 10) || 0,
        r2: parseInt(String(raw2).trim(), 10) || 0
    };
}

function handleIndicatorClick(schoolName, type) {
    const studentsBySchool = getEquivalentSchoolStudents(schoolName);
    if (!studentsBySchool.length) return;

    const { r1, r2 } = getIndicatorRankParams();
    if (!r1 || !r2) return alert("请先设置指标参数");

    const townshipRows = (typeof filterRowsToTownshipSchools === 'function')
        ? filterRowsToTownshipSchools(RAW_DATA || [])
        : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    const allScores = townshipRows.map(s => s.total).filter(v => typeof v === 'number').sort((a, b) => b - a);
    const line = type === 'ind1' ? (allScores[r1 - 1] || 0) : (allScores[r2 - 1] || 0);
    const title = `${schoolName} - ${type === 'ind1' ? '指标一' : '指标二'}达标名单 (线≥${line})`;

    const students = studentsBySchool.filter(s => s.total >= line);

    DrillSystem.open(title, students);
}

function handleHighClick(schoolName) {
    const schoolRecord = getAppSchoolRecord(schoolName);
    if (!schoolRecord) return;
    const line = 490;
    const students = (schoolRecord.students || []).filter(s => s.total >= line);
    DrillSystem.open(`${schoolName} - 高分段(≥${line})名单`, students);
}

function handleExcludedClick(schoolName) {
    const s = getAppSchoolRecord(schoolName);
    if (!s) return;
    const sorted = [...s.students].sort((a, b) => a.total - b.total); // 升序
    const excN = s.bottom3 ? s.bottom3.excN : 0;

    const students = sorted.slice(0, excN).sort((a, b) => b.total - a.total); // 展示时按分降序好看点

    DrillSystem.open(`${schoolName} - 后1/3核算剔除名单 (共${excN}人)`, students);
}

const SummaryRefreshState = {
    dirty: false,
    reason: '',
    version: 0,
    lastGeneratedVersion: 0,
    suppress: false,
    dependencySignatures: {}
};

function buildSummaryDependencySignature(type, rows = []) {
    const parts = [
        String(type || ''),
        String(CURRENT_EXAM_ID || ''),
        String(window.__RAW_DATA_VERSION || 0),
        String(MY_SCHOOL || '')
    ];
    (rows || []).forEach((row) => {
        if (!row) return;
        if (type === 'indicator') {
            parts.push([
                row.name,
                row.rank,
                row.finalScore,
                row.score1,
                row.score2,
                row.r1,
                row.r2,
                row.t1,
                row.t2,
                row.targetKey,
                row.missingTarget ? 1 : 0,
                row.invalidTarget ? 1 : 0
            ].join(':'));
            return;
        }
        if (type === 'highScore') {
            parts.push([
                row.name,
                row.count,
                row.hsCount,
                row.hsRatio,
                row.score
            ].join(':'));
            return;
        }
        parts.push([
            row.name,
            row.rank2Rate,
            row.score2Rate,
            row.rankBottom,
            row.scoreBottom,
            row.bottom3?.totalN,
            row.bottom3?.bottomN,
            row.bottom3?.excN,
            row.bottom3?.avg
        ].join(':'));
    });
    return parts.join('|');
}

function updateSummaryRefreshState() {
    const btn = document.getElementById('btn-summary-generate');
    const notice = document.getElementById('summary-refresh-notice');
    const isDirty = !!SummaryRefreshState.dirty;

    if (btn) {
        btn.classList.toggle('is-stale', isDirty);
        btn.dataset.stale = isDirty ? '1' : '0';
        btn.textContent = isDirty ? '数据已变更，请重新生成' : '生成总排名';
        btn.title = isDirty
            ? (SummaryRefreshState.reason || '前置数据已变化，请重新生成总排名')
            : '生成综合总排名';
    }

    if (notice) {
        notice.textContent = isDirty
            ? (SummaryRefreshState.reason || '前置数据已变化，请重新生成总排名。')
            : '';
        notice.style.display = isDirty ? 'block' : 'none';
    }
}

function markSummaryDataChanged(reason = '前置数据已变化，请重新生成总排名。') {
    if (SummaryRefreshState.suppress) return;
    SummaryRefreshState.version += 1;
    const hasGeneratedSummary = !!document.querySelector('#tb-summary tbody tr');
    SummaryRefreshState.dirty = hasGeneratedSummary;
    SummaryRefreshState.reason = reason;
    updateSummaryRefreshState();
}

function markSummaryDataChangedIfDependencyChanged(type, signature, reason = '前置数据已变化，请重新生成总排名。') {
    const key = String(type || '').trim();
    const nextSignature = String(signature || '');
    if (!key || !nextSignature) return;
    const previousSignature = SummaryRefreshState.dependencySignatures[key] || '';
    SummaryRefreshState.dependencySignatures[key] = nextSignature;
    if (!previousSignature || previousSignature === nextSignature) return;
    markSummaryDataChanged(reason);
}

function captureSummaryDependencyBaselines() {
    const townshipSchools = getSummaryTownshipSchools();
    SummaryRefreshState.dependencySignatures.twoRateBottom = buildSummaryDependencySignature('twoRateBottom', townshipSchools);
    const highScoreRows = Array.isArray(window.__LAST_HIGH_SCORE_SUMMARY_ROWS__) ? window.__LAST_HIGH_SCORE_SUMMARY_ROWS__ : [];
    if (highScoreRows.length) {
        SummaryRefreshState.dependencySignatures.highScore = buildSummaryDependencySignature('highScore', highScoreRows);
    }
    const indicatorRows = Array.isArray(window.__LAST_INDICATOR_CALC_DATA__) ? window.__LAST_INDICATOR_CALC_DATA__ : [];
    if (indicatorRows.length) {
        SummaryRefreshState.dependencySignatures.indicator = buildSummaryDependencySignature('indicator', indicatorRows);
    }
}

function markSummaryFresh() {
    captureSummaryDependencyBaselines();
    SummaryRefreshState.dirty = false;
    SummaryRefreshState.lastGeneratedVersion = SummaryRefreshState.version;
    SummaryRefreshState.reason = '';
    updateSummaryRefreshState();
}

function renderHighScoreTable() {
    const tbody = document.querySelector('#tb-high-score tbody');
    tbody.innerHTML = '';

    if (!CONFIG.name || !CONFIG.name.includes('9')) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#999;">🚫 当前非 9 年级模式，无高分段核算数据。</td></tr>';
        return;
    }
    const hasHighScoreScopeHelper = typeof getTownshipManagedSchoolNames === 'function';
    const townshipSchoolNames = hasHighScoreScopeHelper ? getTownshipManagedSchoolNames(Object.keys(SCHOOLS || {})) : Object.keys(SCHOOLS || {});
    const townshipSchoolSet = new Set((townshipSchoolNames || []).map(name => String(name || '').trim()).filter(Boolean));
    const townshipSchools = Object.values(SCHOOLS).filter((school) => {
        if (!hasHighScoreScopeHelper) return true;
        const name = String(school?.name || '').trim();
        return typeof isTownshipManagedSchool === 'function'
            ? isTownshipManagedSchool(name, Object.keys(SCHOOLS || {}))
            : townshipSchoolSet.has(name);
    });
    if (townshipSchools.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px;">请先上传数据</td></tr>';
        return;
    }

    const list = townshipSchools.map(s => {
        const hs = s.highScoreStats || { count: 0, ratio: 0, score: 0 };
        return {
            name: s.name,
            count: s.metrics.total ? s.metrics.total.count : 0,
            hsCount: hs.count,
            hsRatio: hs.ratio,
            score: hs.score
        };
    });

    list.sort((a, b) => b.score - a.score);

    let html = '';
    list.forEach((d, i) => {
        const isMySchool = sameAppSchoolName(d.name, MY_SCHOOL);
        html += `<tr class="${isMySchool ? 'bg-highlight' : ''}">
                <td>${d.name}</td>
                <td>${d.count}</td>
                <td style="font-weight:bold;">
                    <!-- 添加点击事件 -->
                    <span class="clickable-num" onclick="handleHighClick('${d.name}')" title="点击查看高分学生名单">
                        ${d.hsCount}
                    </span>
                </td>
                <td>${(d.hsRatio * 100).toFixed(2)}%</td>
                <td class="text-red" style="font-size:1.1em; font-weight:bold;">${d.score.toFixed(2)}</td>
                ${getRankHTML(i + 1)}
            </tr>`;
    });
    tbody.innerHTML = html;
    window.__LAST_HIGH_SCORE_SUMMARY_ROWS__ = list;
    markSummaryDataChangedIfDependencyChanged(
        'highScore',
        buildSummaryDependencySignature('highScore', list),
        '高分段赋分已更新，请重新生成总排名。'
    );

    appDebug(`已渲染 ${list.length} 所学校的高分数据`);
}

function exportHighScoreExcel() {
    const hasHighScoreScopeHelper = typeof getTownshipManagedSchoolNames === 'function';
    const townshipSchoolNames = hasHighScoreScopeHelper ? getTownshipManagedSchoolNames(Object.keys(SCHOOLS || {})) : Object.keys(SCHOOLS || {});
    const townshipSchoolSet = new Set((townshipSchoolNames || []).map(name => String(name || '').trim()).filter(Boolean));
    const townshipSchools = Object.values(SCHOOLS).filter((school) => {
        if (!hasHighScoreScopeHelper) return true;
        const name = String(school?.name || '').trim();
        return typeof isTownshipManagedSchool === 'function'
            ? isTownshipManagedSchool(name, Object.keys(SCHOOLS || {}))
            : townshipSchoolSet.has(name);
    });
    if (!townshipSchools.length) return alert("无数据");
    if (!CONFIG.name.includes('9')) return alert("非9年级模式无此数据");

    const wb = XLSX.utils.book_new();
    const headers = ["学校名称", "实考人数", "高分人数(≥490)", "高分率", "高分赋分(70)", "排名"];
    const wsData = [headers];

    const list = townshipSchools.map(s => {
        const hs = s.highScoreStats || { count: 0, ratio: 0, score: 0 };
        return {
            name: s.name,
            count: s.metrics.total ? s.metrics.total.count : 0,
            hsCount: hs.count,
            hsRatio: hs.ratio,
            score: hs.score
        };
    }).sort((a, b) => b.score - a.score);

    list.forEach((d, i) => {
        wsData.push([
            d.name,
            d.count,
            d.hsCount,
            getExcelPercent(d.hsRatio),
            getExcelNum(d.score),
            i + 1
        ]);
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "高分段核算");
    XLSX.writeFile(wb, `高分段核算_${CONFIG.name}.xlsx`);
}

async function prepareSameExamOverwrite(currentExamId, existingExam = null) {
    const examId = String(currentExamId || '').trim();
    if (!examId) return { localExists: false, cloudExists: false, existingRows: 0 };

    // existingRows: row count from the exam entry passed in (db.exams or current workspace).
    // This is the same source used by the confirmation dialog above, so localExists
    // stays consistent with what the user already acknowledged.
    const existingRows = getUploadExamDataRowCount(existingExam?.data);
    let localExists = existingRows > 0;
    try {
        const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
        if (db && typeof db === 'object') {
            db.exams = db.exams || {};
            // Also flag localExists when the exam entry exists in db.exams regardless
            // of whether the caller passed a non-null existingExam (e.g. on repeated
            // saves the in-memory entry may differ from the one in CohortDB).
            if (db.exams[examId]) localExists = true;
        }
    } catch (error) {
        console.warn('[upload] local overwrite check failed:', error);
    }

    let cloudExists = false;
    try {
        if (window.CloudDataService && typeof window.CloudDataService.readSystemDataRecord === 'function') {
            const { data, error } = await window.CloudDataService.readSystemDataRecord(examId, 'key,updated_at');
            if (error && error.message !== 'CLOUD_CLIENT_MISSING') throw error;
            cloudExists = Boolean(data?.key);
        } else if (window.CloudApi && typeof window.CloudApi.selectSystemData === 'function') {
            const { data, error } = await window.CloudApi.selectSystemData({
                select: 'key,updated_at',
                keyEq: examId,
                maybeSingle: true
            });
            if (error && error.message !== 'CLOUD_CLIENT_MISSING') throw error;
            cloudExists = Boolean(data?.key);
        }
    } catch (error) {
        console.warn('[upload] cloud overwrite check failed:', error);
    }

    appDebug('[upload] same exam overwrite checked without destructive cleanup:', {
        examId,
        previousRows: existingRows,
        localExists,
        cloudExists
    });
    return { localExists, cloudExists, existingRows };
}

function getUploadExamDataRowCount(data) {
    if (Array.isArray(data)) return data.length;
    if (data && typeof data === 'object' && data.__packedRows && Array.isArray(data.rows)) return data.rows.length;
    return 0;
}

function beginScoreImportGuard(examId) {
    const guard = {
        examId: String(examId || '').trim(),
        startedAt: Date.now(),
        token: `score-import-${Date.now()}-${Math.random().toString(36).slice(2)}`
    };
    window.__SCORE_IMPORT_IN_PROGRESS__ = guard;
    return guard;
}

function clearScoreImportGuard(guard) {
    if (!guard || window.__SCORE_IMPORT_IN_PROGRESS__?.token === guard.token) {
        window.__SCORE_IMPORT_IN_PROGRESS__ = null;
    }
}

function isScoreImportInProgress() {
    const guard = window.__SCORE_IMPORT_IN_PROGRESS__;
    if (!guard || typeof guard !== 'object') return false;
    // Wall-clock fallback: guard is cleared in the finally block of the upload async
    // callback, but if that callback crashes without reaching finally (edge case), the
    // guard would leak forever.  30 min covers even the slowest processData() runs on
    // constrained devices while still eventually unblocking applyExamToWorkspace.
    if (Date.now() - Number(guard.startedAt || 0) > 30 * 60 * 1000) {
        window.__SCORE_IMPORT_IN_PROGRESS__ = null;
        return false;
    }
    return true;
}

document.getElementById('fileInput').addEventListener('change', function (e) {
    if (isArchiveLocked()) return alert("⛔ 当前考试已封存，禁止上传新数据");
    if (!CURRENT_COHORT_ID) return alert("请先选择或新建届别");
    const inputEl = e.target;
    const files = Array.from(inputEl?.files || []);
    if (!files.length) return;
    const beforeExamId = CURRENT_EXAM_ID || readWorkspaceExamId() || '';
    const currentExamId = setCurrentExamMeta(true);
    if (!currentExamId) {
        inputEl.value = '';
        return;
    }
    if (beforeExamId && beforeExamId !== currentExamId && window.UI) {
        UI.toast(`🧭 已自动切换考试批次：${currentExamId}`, 'info');
    }

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const existingExam = db?.exams?.[currentExamId];
    const existingExamRows = getUploadExamDataRowCount(existingExam?.data);
    const currentWorkspaceRows = beforeExamId && beforeExamId === currentExamId ? getUploadExamDataRowCount(RAW_DATA) : 0;
    const existingRows = existingExamRows || currentWorkspaceRows;
    const existingSourceLabel = existingExamRows ? '历史考试' : '当前工作区';
    const effectiveExistingExam = existingExam || (currentWorkspaceRows ? { data: RAW_DATA, source: 'workspace-current' } : null);
    const hasExistingData = existingRows > 0;
    const shouldOverwriteExistingExam = hasExistingData;
    if (hasExistingData) {
        const ok = confirm(`⚠️ 检测到考试批次「${currentExamId}」在${existingSourceLabel}已存在 ${existingRows} 条成绩数据。\n继续上传将覆盖该批次原数据，是否继续？`);
        if (!ok) {
            inputEl.value = '';
            if (window.UI) UI.toast('已取消上传，原批次数据未被修改', 'info');
            return;
        }
    }

    const importGuard = beginScoreImportGuard(currentExamId);
    Perf.runAsync(async () => {
        try {
            if ((!window.XLSX || !window.XLSX.utils) && typeof window.ensureXlsxVendorLoaded === 'function') {
                await window.ensureXlsxVendorLoaded();
            }
            if (!window.XLSX || !window.XLSX.utils) {
                throw new Error('Excel 解析组件未加载，请刷新页面后重试');
            }
            const overwriteInfo = shouldOverwriteExistingExam
                ? await prepareSameExamOverwrite(currentExamId, effectiveExistingExam)
                : { localExists: false, cloudExists: false, existingRows: 0 };

            clearDataRuntimeState({ keepConfig: true });
            setRawData([]);
            setSchools({});
            setSubjects([]);
            setThresholds({});
            syncRuntimeStateToWindow();
            setTeacherMap({}); setTeacherStats({});
            TEACHER_TOWNSHIP_RANKINGS = {}; MARGINAL_STUDENTS = {}; POTENTIAL_STUDENTS_CACHE = []; TOWNSHIP_RANKING_DATA = {}; clearCurrentSchool();
            const teacherCards = document.getElementById('teacherCardsContainer');
            const teacherTable = document.getElementById('teacherComparisonTable');
            const teacherTownship = document.getElementById('teacher-township-ranking-container');
            const detailTable = document.getElementById('studentDetailTable');
            const marginalResult = document.getElementById('marginal-student-results');
            if (teacherCards) teacherCards.innerHTML = '';
            if (teacherTable) {
                const tbody = teacherTable.querySelector('tbody');
                if (tbody) tbody.innerHTML = '';
                else teacherTable.innerHTML = '';
            }
            if (teacherTownship) teacherTownship.innerHTML = '';
            if (detailTable) {
                const tbody = detailTable.querySelector('tbody');
                if (tbody) tbody.innerHTML = '';
            }
            if (marginalResult) marginalResult.innerHTML = '';

            for (let f of files) await readExcel(f);
            SUBJECTS.sort(sortSubjects);
            await processData(); // 这是一个耗时操作
            // 仅更新运行时内存变量，供后续 saveCloudData 和 UI 使用。
            // writeWorkspaceExamId 和 COHORT_DB.currentExamId 延迟到云端上传成功后写入，
            // 避免首次上传失败时 localStorage 指向一个 db.exams 中不存在的考试 ID。
            CURRENT_EXAM_ID = currentExamId;
            window.CURRENT_EXAM_ID = currentExamId;
            syncRuntimeStateToWindow();

            updateSchoolMode();

            setUploadMessage(`✅ 已解析 ${Object.keys(SCHOOLS).length} 所学校，共 ${RAW_DATA.length} 名学生，正在同步云端...`, 'info');
            let cloudSynced = true;
            if (typeof saveCloudData === 'function') {
                cloudSynced = await saveCloudData({
                    mode: 'exam',
                    examKey: currentExamId,
                    background: false,
                    sourceLabel: (overwriteInfo.localExists || overwriteInfo.cloudExists) ? 'score-import-overwrite' : 'score-import-create',
                    forceUpload: true
                });
                if (!cloudSynced) {
                    const cloudError = String(window.__LAST_CLOUD_SAVE_ERROR__ || '').trim();
                    const preserveText = shouldOverwriteExistingExam ? '原归档考试和云端旧记录已保留。' : '';
                    const detail = cloudError ? `原因：${cloudError}` : '请稍后重新登录再试。';
                    setUploadMessage(`⚠️ 已在当前页面解析 ${RAW_DATA.length} 名学生，但云端同步失败，未覆盖考试归档。${preserveText}${detail}`, 'warning');
                    UI.toast(cloudError ? `⚠️ 云端同步失败：${cloudError}` : '⚠️ 成绩已导入本机，云端同步失败', 'warning');
                    return;
                }
                appDebug("成绩导入云端同步完成");
            }

            await CohortDB.syncCurrentExam();
            // 云端上传 + 本地 CohortDB 写入均已成功，现在才持久化工作区 exam 指针。
            // 这样若上传失败（早退），localStorage 仍指向旧的、db.exams 中存在的考试。
            writeWorkspaceExamId(currentExamId);
            if (COHORT_DB) COHORT_DB.currentExamId = currentExamId;

            scheduleExamSelectorRefresh({ teacherCompareTeacher: true });
            renderTables();
            applySchoolModeToTables();
            updateSchoolSelect(); updateMySchoolSelect(); updateStudentSchoolSelect(); updateMarginalSchoolSelect();
            updateClassSelect(); updateSegmentSelects(); updatePotentialSchoolSelect();
            if (typeof updateCorrelationSchoolSelect === 'function') updateCorrelationSchoolSelect();
            if (typeof updateSeatAdjSelects === 'function') updateSeatAdjSelects();
            updateProgressSchoolSelect();
            updateMutualAidSelects(); updateMpSchoolSelect();

            setUploadMessage(`✅ 成功导入并同步 ${Object.keys(SCHOOLS).length} 所学校，共 ${RAW_DATA.length} 名学生。下一步建议确认本校、任课表与当前考试是否都已就绪。`, 'success');
            UI.toast(`✅ 导入并同步成功！包含 ${RAW_DATA.length} 条数据`, 'success');
            logAction('导入', `成绩导入 ${RAW_DATA.length} 条`);
            updateStatusPanel();
        } finally {
            inputEl.value = '';
            clearScoreImportGuard(importGuard);
        }
    }, "正在解析 Excel 并计算排名...");
});

async function readExcel(file) {
    if ((!window.XLSX || !window.XLSX.utils) && typeof window.ensureXlsxVendorLoaded === 'function') {
        await window.ensureXlsxVendorLoaded();
    }
    if (!window.XLSX || !window.XLSX.utils) {
        throw new Error('Excel 解析组件未加载，请刷新页面后重试');
    }
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    wb.SheetNames.forEach(sname => {
        if (sname.includes('二模本校') || sname.includes('各班各科') || sname.includes('横向对比')) return;
        const json = XLSX.utils.sheet_to_json(wb.Sheets[sname], { header: 1 });
        if (json.length < 2) return;
        parseRows(json, sname);
    });
}

function parseRows(rows, defaultSchool) {
    const headers = rows[0].map(h => String(h).trim());
    const importExamMeta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
    const importGrade = String(
        (typeof getEffectiveGrade === 'function' ? getEffectiveGrade(importExamMeta) : '')
        || importExamMeta?.grade
        || (typeof getActiveGrade === 'function' ? getActiveGrade() : '')
        || ''
    ).trim();

    const idxMap = { name: -1, id: -1, school: -1, class: -1, examRoom: -1, scores: {} };

    const aliasMap = {
        name: ['姓名', '学生姓名', '学生', 'Name', '考生姓名'],
        id: ['考号', '学号', '准考证号', 'ID', '考生号'],
        school: ['学校名称', '学校名', '学校', '校名', '所在学校', '就读学校', '毕业学校', '初中学校', '报名学校', '参考学校', '参考单位', '单位名称', '单位'],
        class: ['班级', '班', '班次', 'Class', '行政班'],
        examRoom: ['考场', '考室', 'Room', '考试地点']
    };

    const subjectMap = { '语文': '语文', '数学': '数学', '英语': '英语', '物理': '物理', '化学': '化学', '政治': '政治', '道法': '政治', '道德与法治': '政治', '历史': '历史', '地理': '地理', '生物': '生物', '科学': '科学' };
    const excludeKeywords = ['排', '次', '级', 'Rank', '赋分', '相对分', '折算', '等级', '优劣'];

    const schoolHeaderExcludeKeywords = ['排名', '名次', '序号', '代码', '编号', '赋分', '得分', '分数', '成绩', '班级', '年级'];
    const findBestHeaderIndex = (aliases, excludes = []) => {
        let best = { index: -1, score: -1 };
        headers.forEach((header, index) => {
            const text = String(header || '').trim().replace(/\s+/g, '').replace(/[：:]/g, '');
            if (!text) return;
            if (excludes.some(ex => text.includes(ex))) return;
            aliases.forEach(alias => {
                const key = String(alias || '').trim().replace(/\s+/g, '').replace(/[：:]/g, '');
                if (!key) return;
                let score = -1;
                if (text === key) score = 100 + key.length;
                else if (text.includes(key)) score = 50 + key.length;
                if (score > best.score) best = { index, score };
            });
        });
        return best.index;
    };

    headers.forEach((h, i) => {
        const hTrim = h.replace(/\s+/g, '');
        for (const [key, aliases] of Object.entries(aliasMap)) {
            if (key === 'school') continue;
            if (aliases.some(alias => hTrim.includes(alias))) idxMap[key] = i;
        }
        for (const [key, standardName] of Object.entries(subjectMap)) {
            if (h.includes(key) && !excludeKeywords.some(ex => h.includes(ex))) {
                if (!idxMap.scores[standardName]) idxMap.scores[standardName] = [];
                idxMap.scores[standardName].push(i);
                if (!SUBJECTS.includes(standardName)) SUBJECTS.push(standardName);
            }
        }
    });
    idxMap.school = findBestHeaderIndex(aliasMap.school, schoolHeaderExcludeKeywords);

    const detectedSubjects = Array.isArray(SUBJECTS) ? [...SUBJECTS] : [];
    const analysisSubjects = getConfiguredDisplaySubjects(CONFIG, { includeExtra: false });
    if (analysisSubjects && analysisSubjects !== 'auto') {
        setSubjects(SUBJECTS.filter(s => analysisSubjects.includes(s)));
    }
    const subsForTotal = CONFIG.totalSubs === 'auto' ? SUBJECTS : CONFIG.totalSubs;

    const toHalfWidth = (str) => {
        if (typeof str !== 'string') return str;
        return str.replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
            .replace(/\u3000/g, ' ');
    };

    const isBlankSubjectScoreCell = (value) => {
        if (value === undefined || value === null) return true;
        const normalized = typeof value === 'string' ? toHalfWidth(value) : value;
        return typeof normalized === 'string' && normalized.trim() === '';
    };

    const cleanNameStr = (str) => {
        if (!str) return "";
        return String(str).replace(/\s+/g, '').replace(/[\u200b-\u200f\uFEFF]/g, '');
    };

    let lastDetectedSchool = '';
    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r.length) continue;

        let rawName = idxMap.name !== -1 ? (r[idxMap.name] || "") : "";
        let nameStr = cleanNameStr(rawName);
        let isAutoGeneratedName = false;
        const rawIdValue = idxMap.id !== -1 ? r[idxMap.id] : '';
        const idStr = String(rawIdValue || '').trim();

        const rowHasExplicitScoreEvidence = Object.values(idxMap.scores || {}).some((colIndices) => (
            Array.isArray(colIndices) && colIndices.some((idx) => {
                let rawVal = r[idx];
                if (isBlankSubjectScoreCell(rawVal)) return false;
                if (typeof rawVal === 'string') rawVal = toHalfWidth(rawVal).trim();
                const numeric = parseFloat(rawVal);
                if (!isNaN(numeric)) return true;
                const strVal = String(rawVal || "").trim().toUpperCase();
                const zeroKeywords = ["缺", "ABS", "作弊", "违纪", "病假", "缓考", "取消", "零分", "Q", "CHE"];
                return zeroKeywords.some(key => strVal.includes(key));
            })
        ));

        if (!nameStr && !idStr && !rowHasExplicitScoreEvidence) continue;

        if (!nameStr || nameStr === '-' || nameStr === '0' || nameStr === '0.0' || nameStr === '姓名') {
            nameStr = `考生${String(i).padStart(3, '0')}`;
            isAutoGeneratedName = true;
        }

        let classStr = "未分班";
        if (idxMap.class !== -1 && r[idxMap.class]) {
            classStr = normalizeImportedClassForGrade(r[idxMap.class], importGrade);
        }

        const rawSchool = idxMap.school !== -1 ? String(r[idxMap.school] || '').trim() : '';
        const fallbackSchool = String(defaultSchool || '').trim();
        const schoolCandidates = [
            ...Object.keys(SCHOOLS || {}),
            ...Object.keys(window.TARGETS || {}),
            rawSchool,
            fallbackSchool
        ].filter(Boolean);
        const detectedSchool = rawSchool
            ? (typeof getCanonicalSchoolName === 'function'
                ? (getCanonicalSchoolName(rawSchool, schoolCandidates) || rawSchool)
                : rawSchool)
            : '';
        if (detectedSchool) lastDetectedSchool = detectedSchool;
        const schoolName = detectedSchool || lastDetectedSchool || fallbackSchool;

        const stu = {
            name: nameStr,
            id: idxMap.id !== -1 ? r[idxMap.id] : '-',

            school: schoolName || fallbackSchool || '未知学校',
            class: classStr,

            examRoom: idxMap.examRoom !== -1 ? r[idxMap.examRoom] : '-',
            scores: {},
            total: 0,
            hasValidScore: false,
            blankScoreSubjects: []
        };

        let hasAnyScore = false;
        let hasExplicitScoreEvidence = false;
        const blankScoreSubjects = [];
        detectedSubjects.forEach(sub => {
            const colIndices = idxMap.scores[sub];
            if (colIndices && colIndices.length > 0) {
                let subSum = 0;
                let validSub = false;
                let hasBlankScoreCell = false;
                colIndices.forEach(idx => {
                    let rawVal = r[idx];
                    if (isBlankSubjectScoreCell(rawVal)) {
                        validSub = true;
                        hasBlankScoreCell = true;
                        return;
                    }
                    if (typeof rawVal === 'string') {
                        rawVal = toHalfWidth(rawVal).trim();
                    }
                    let val = parseFloat(rawVal);

                    if (isNaN(val)) {
                        const strVal = String(rawVal || "").trim().toUpperCase(); // 转大写去空格

                        const zeroKeywords = ["缺", "ABS", "作弊", "违纪", "病假", "缓考", "取消", "零分", "Q", "CHE"];

                        if (zeroKeywords.some(key => strVal.includes(key))) {
                            val = 0;
                        }
                    }
                    if (!isNaN(val)) { subSum += val; validSub = true; hasExplicitScoreEvidence = true; }
                });
                if (validSub) {
                    stu.scores[sub] = parseFloat(subSum.toFixed(2));
                    if (hasBlankScoreCell) blankScoreSubjects.push(sub);
                    stu.hasValidScore = true;
                    hasAnyScore = true;
                    if (subsForTotal.includes(sub)) stu.total += subSum;
                }
            }
        });
        stu.blankScoreSubjects = [...new Set(blankScoreSubjects)];

        if (!hasExplicitScoreEvidence && isAutoGeneratedName) continue;
        if (!hasAnyScore && nameStr.startsWith("考生")) continue;

        stu.total = parseFloat(stu.total.toFixed(2));
        RAW_DATA.push(stu);

        if (!SCHOOLS[stu.school]) SCHOOLS[stu.school] = { name: stu.school, students: [], metrics: {}, rankings: {} };
        SCHOOLS[stu.school].students.push(stu);
    }
    updateStatusPanel();
}


const CHINESE_CLASS_GRADE_MAP = Object.freeze({
    '六': '6',
    '七': '7',
    '八': '8',
    '九': '9',
    '初一': '7',
    '初二': '8',
    '初三': '9'
});

function normalizeChineseClassText(classStr) {
    return String(classStr || '')
        .trim()
        .replace(/[()（）]/g, '')
        .replace(/初([一二三])(?:年级|年級|级|級)?(\d{1,3})班?/g, (_, grade, classNo) => `${CHINESE_CLASS_GRADE_MAP[`初${grade}`]}.${classNo}`)
        .replace(/([六七八九])(?:年级|年級|级|級)?(\d{1,3})班?/g, (_, grade, classNo) => `${CHINESE_CLASS_GRADE_MAP[grade]}.${classNo}`);
}

function normalizeComparableClassValue(classStr) {
    const raw = normalizeChineseClassText(classStr)
        .replace(/[()（）]/g, '')
        .replace(/(?:班级|班|年级|grade|class)/gi, '')
        .replace(/[／/、_-]+/g, '.')
        .replace(/[·,，]+/g, '.')
        .replace(/\s+/g, '')
        .replace(/\.{2,}/g, '.')
        .replace(/^\./, '')
        .replace(/\.$/, '');

    if (!raw) return '';

    const digitChunks = raw.match(/\d+/g) || [];
    if ((raw.includes('.') || digitChunks.length >= 2) && digitChunks.length >= 2) {
        const grade = String(Number(digitChunks[0] || 0));
        const classNum = String(Number(digitChunks.slice(1).join('') || 0));
        if (grade && classNum) return `${grade}.${classNum}`;
    }

    const digitsOnly = raw.replace(/\D/g, '');
    if (/^[6-9]\d{1,3}$/.test(digitsOnly)) {
        return `${digitsOnly.charAt(0)}.${String(Number(digitsOnly.slice(1)))}`;
    }
    if (/^\d+$/.test(digitsOnly)) {
        const grade = String(getActiveGrade() || '6');
        return `${grade}.${String(Number(digitsOnly))}`;
    }
    return raw;
}

function normalizeImportedClassForGrade(classStr, grade) {
    const normalized = normalizeClass(classStr);
    const gradeText = String(grade || '').trim();
    const gradeMatch = gradeText.match(/[6-9]/);
    const importGrade = gradeMatch ? gradeMatch[0] : '';
    if (!importGrade) return normalized;

    const rawText = normalizeChineseClassText(classStr)
        .replace(/[()（）]/g, '')
        .replace(/(?:班级|行政班|班次|班|年级|grade|class)/gi, '')
        .replace(/[／/、_-]+/g, '.')
        .replace(/[·,，]+/g, '.')
        .replace(/\s+/g, '')
        .replace(/\.{2,}/g, '.')
        .replace(/^\./, '')
        .replace(/\.$/, '');

    if (/^\d{1,2}$/.test(rawText)) {
        return `${importGrade}.${String(Number(rawText))}`;
    }
    return normalized;
}

function normalizeClass(classStr) {
    if (!classStr) return '';
    if (typeof AuthState !== 'undefined' && AuthState && typeof AuthState.normalizeClassName === 'function') {
        const normalized = AuthState.normalizeClassName(classStr);
        if (/^\d+$/.test(String(normalized || ''))) {
            const digitsOnly = String(normalized);
            if (/^[6-9]\d{1,3}$/.test(digitsOnly)) {
                return `${digitsOnly.charAt(0)}.${String(Number(digitsOnly.slice(1)))}`;
            }
            const grade = String(getActiveGrade() || '6');
            return `${grade}.${String(Number(digitsOnly))}`;
        }
        return normalized;
    }
    return normalizeComparableClassValue(classStr);
}

function normalizeSubject(subj) {
    if (!subj) return '';
    const s = String(subj).replace(/\s/g, '').trim();
    const subjectMap = {
        '语文': '语文',
        '数学': '数学',
        '英语': '英语',
        '物理': '物理',
        '化学': '化学',
        '政治': '政治',
        '道法': '政治',
        '道德与法治': '政治',
        '思政': '政治',
        '历史': '历史',
        '地理': '地理',
        '生物': '生物',
        '生物学': '生物',
        '科学': '科学'
    };
    if (subjectMap[s]) return subjectMap[s];
    return s;
}

function normalizeStudentTotalsForCurrentConfig(rows = RAW_DATA, subjects = SUBJECTS, config = CONFIG) {
    const list = Array.isArray(rows) ? rows : [];
    const configuredTotalSubs = config?.totalSubs === 'auto'
        ? (Array.isArray(subjects) ? subjects : [])
        : (Array.isArray(config?.totalSubs) ? config.totalSubs : []);
    if (!configuredTotalSubs.length) return { changed: 0, subjects: [] };
    let changed = 0;
    list.forEach((student) => {
        if (!student || typeof student !== 'object') return;
        const scores = student.scores && typeof student.scores === 'object' ? student.scores : {};
        const nextTotal = configuredTotalSubs.reduce((sum, subject) => {
            const value = scores[subject];
            const numeric = typeof value === 'number' ? value : Number(value);
            return Number.isFinite(numeric) ? sum + numeric : sum;
        }, 0);
        const normalizedTotal = parseFloat(nextTotal.toFixed(2));
        const currentTotal = Number(student.total);
        if (!Number.isFinite(currentTotal) || Math.abs(currentTotal - normalizedTotal) > 0.0001) {
            student.total = normalizedTotal;
            changed += 1;
        }
    });
    return { changed, subjects: configuredTotalSubs.slice() };
}

async function processData() {

    const totalNormalization = normalizeStudentTotalsForCurrentConfig(RAW_DATA, SUBJECTS, CONFIG);
    if (totalNormalization.changed) {
        appDebug('[score] normalized student totals for current config:', totalNormalization);
    }

    const schoolSet = new Set(RAW_DATA.map(s => s.school));
    const isSingleSchool = schoolSet.size === 1;

    const input1 = parseFloat(window.SYS_VARS?.indicator?.ind1) || 0;
    const input2 = parseFloat(window.SYS_VARS?.indicator?.ind2) || 0;

    const townshipRowsForCore = (typeof filterRowsToTownshipSchools === 'function')
        ? filterRowsToTownshipSchools(RAW_DATA || [])
        : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    const thresholdSourceRows = townshipRowsForCore.length ? townshipRowsForCore : (RAW_DATA || []);

    const keys = [...SUBJECTS, 'total'];
    keys.forEach(k => {
        const vals = thresholdSourceRows
            .map(s => k === 'total' ? Number(s.total) : Number(s.scores[k]))
            .filter(Number.isFinite)
            .sort((a, b) => b - a);

        if (vals.length) {
            if (isSingleSchool && k === 'total' && input1 > 0 && input2 > 0) {
                const idx1 = Math.min(Math.floor(input1), vals.length) - 1;
                const idx2 = Math.min(Math.floor(input2), vals.length) - 1;

                THRESHOLDS[k] = {
                    exc: vals[Math.max(0, idx1)] || 0,
                    pass: vals[Math.max(0, idx2)] || 0
                };
                appDebug(`[单校模式] 总分划线锁定: 优=${THRESHOLDS[k].exc} (Top${input1}), 良=${THRESHOLDS[k].pass} (Top${input2})`);
            } else {
                const excRatio = (CONFIG.name && CONFIG.name.includes('9')) ? 0.15 : 0.2;
                const pickPercentileLine = (ratio) => {
                    const index = Math.max(0, Math.ceil(vals.length * ratio) - 1);
                    return vals[index] || 0;
                };
                THRESHOLDS[k] = {
                    exc: pickPercentileLine(excRatio),
                    pass: pickPercentileLine(0.5)
                };
            }
        }
    });

    const schoolKeysForWorker = Object.keys(SCHOOLS || {});
    const townshipSchoolNamesForWorker = (typeof getTownshipManagedSchoolNames === 'function')
        ? Array.from(new Set([
            ...getTownshipManagedSchoolNames(schoolKeysForWorker),
            ...schoolKeysForWorker.filter((name) => (
                typeof isTownshipManagedSchool === 'function'
                    ? isTownshipManagedSchool(name, schoolKeysForWorker)
                    : false
            ))
        ]))
        : schoolKeysForWorker;
    const result = await WorkerAPI.run({ RAW_DATA, SUBJECTS, CONFIG, THRESHOLDS, SCHOOLS, TOWNSHIP_SCHOOL_NAMES: townshipSchoolNamesForWorker });

    setRawData(result.RAW_DATA || []);


    Object.keys(SCHOOLS).forEach(k => {
        if (SCHOOLS[k]) SCHOOLS[k].students = [];
    });

    RAW_DATA.forEach(stu => {
        if (!SCHOOLS[stu.school]) {
            SCHOOLS[stu.school] = { name: stu.school, students: [], metrics: {}, rankings: {} };
        }
        SCHOOLS[stu.school].students.push(stu);
    });

    const newSchools = result.SCHOOLS;
    Object.keys(newSchools).forEach(k => {
        if (SCHOOLS[k]) {
            const { students, ...metricsData } = newSchools[k];
            Object.assign(SCHOOLS[k], metricsData);
        }
    });

    calculateClassRanksOnly();

    if (typeof fuseInstance !== 'undefined') fuseInstance = null; // 强制重建索引

    setSchools(SCHOOLS);
    setThresholds(THRESHOLDS);

    if (isSingleSchool) {
        appDebug("🏫 检测到单校数据，自动切换 UI 为年级模式...");

        const analysisMod = document.getElementById('analysis');
        if (analysisMod) analysisMod.classList.add('single-school-mode');

        setTimeout(() => {
            document.querySelectorAll('th').forEach(th => {
                if (th.innerText.includes('镇排')) th.innerHTML = th.innerHTML.replace('镇排', '级排');
                if (th.innerText.includes('全镇')) th.innerHTML = th.innerHTML.replace('全镇', '年级');
            });
        }, 500);
    } else {
        const analysisMod = document.getElementById('analysis');
        if (analysisMod) analysisMod.classList.remove('single-school-mode');
    }

    try {
        appDebug("🔄 正在自动执行衍生计算...");

        if (typeof DataManager !== 'undefined' && DataManager && typeof DataManager.isGrade9Context === 'function' && DataManager.isGrade9Context()) {
            if (typeof hasIndicatorCalcInputs === 'function' && !hasIndicatorCalcInputs()) {
                if (typeof DataManager.restoreGrade9IndicatorTemplate === 'function') DataManager.restoreGrade9IndicatorTemplate();
                if (typeof DataManager.restoreGrade9TargetsTemplate === 'function') DataManager.restoreGrade9TargetsTemplate();
            }
        }

        if (typeof calcSummary === 'function') {
            calcSummary(true);    // 汇总内部会按需同步指标生，避免上传后重复全量计算。
        }
        if (typeof scheduleIndicatorAutoScoreAfterDataReady === 'function') {
            scheduleIndicatorAutoScoreAfterDataReady('processData');
        }

    } catch (e) {
        console.warn("⚠️ 自动计算衍生指标时遇到非致命错误:", e);
    }

    if (typeof DB !== 'undefined') {
        const currentKey = readWorkspaceProjectKey() || 'autosave_backup';
        const snapshotPayload = typeof getCurrentSnapshotPayload === 'function'
            ? getCurrentSnapshotPayload()
            : {
                timestamp: Date.now(),
                RAW_DATA, SCHOOLS, SUBJECTS, THRESHOLDS, TEACHER_MAP, CONFIG, MY_SCHOOL
            };
        const isCohortKey = /^cohort::/i.test(currentKey);
        const indicatorRequired = typeof isIndicatorCalcAllowed === 'function' ? isIndicatorCalcAllowed() : false;
        const targetCount = snapshotPayload?.TARGETS && typeof snapshotPayload.TARGETS === 'object'
            ? Object.keys(snapshotPayload.TARGETS).length
            : 0;

        if (isCohortKey && indicatorRequired && Array.isArray(snapshotPayload?.RAW_DATA) && snapshotPayload.RAW_DATA.length > 0 && targetCount === 0) {
            console.warn(`[AutoSave] skip partial cohort snapshot without targets: ${currentKey}`);
        } else {
            DB.save(currentKey, snapshotPayload, getLegacyDbSaveOptionsForKey(currentKey));
            appDebug(`✅ 数据已自动保存至: ${currentKey}`);
        }
    }
    updateStatusPanel();
}

function calculateClassRanksOnly() {
    const classes = {};
    RAW_DATA.forEach(s => {
        const schoolKey = String(s?.school || '').trim() || '未知学校';
        const classKey = (typeof normalizeClass === 'function')
            ? normalizeClass(s?.class || '')
            : String(s?.class || '').trim();
        const scopedKey = `${schoolKey}::${classKey || '未分班'}`;
        if (!classes[scopedKey]) classes[scopedKey] = [];
        classes[scopedKey].push(s);
    });

    Object.values(classes).forEach(group => {
        if (window.RankingDataService && typeof window.RankingDataService.assignRankScope === 'function') {
            window.RankingDataService.assignRankScope(group, 'total', 'class', s => s.total);
        } else {
            group.sort((a, b) => b.total - a.total);
            group.forEach((s, i) => { if (!s.ranks) s.ranks = {}; if (!s.ranks.total) s.ranks.total = {}; s.ranks.total.class = i + 1; });
        }
        SUBJECTS.forEach(sub => {
            const subGroup = group.filter(s => s.scores[sub] !== undefined);
            if (window.RankingDataService && typeof window.RankingDataService.assignRankScope === 'function') {
                window.RankingDataService.assignRankScope(subGroup, sub, 'class', s => s.scores[sub]);
            } else {
                subGroup.sort((a, b) => b.scores[sub] - a.scores[sub]);
                subGroup.forEach((s, i) => { if (!s.ranks[sub]) s.ranks[sub] = {}; s.ranks[sub].class = i + 1; });
            }
        });
    });
}

function calculateStudentRanks() {
    return; SUBJECTS.forEach(subject => {
        const subjectStudents = RAW_DATA.filter(s => s.scores[subject] !== undefined).sort((a, b) => b.scores[subject] - a.scores[subject]);
        subjectStudents.forEach((student, index) => {
            if (!student.ranks) student.ranks = {}; if (!student.ranks[subject]) student.ranks[subject] = {};
            if (index > 0 && student.scores[subject] === subjectStudents[index - 1].scores[subject]) student.ranks[subject].township = subjectStudents[index - 1].ranks[subject].township;
            else student.ranks[subject].township = index + 1;
        });
        Object.values(SCHOOLS).forEach(school => {
            const schStus = school.students.filter(s => s.scores[subject] !== undefined).sort((a, b) => b.scores[subject] - a.scores[subject]);
            schStus.forEach((s, i) => { if (!s.ranks[subject]) s.ranks[subject] = {}; if (i > 0 && s.scores[subject] === schStus[i - 1].scores[subject]) s.ranks[subject].school = schStus[i - 1].ranks[subject].school; else s.ranks[subject].school = i + 1; });
        });
        const classes = {}; RAW_DATA.forEach(student => { if (!classes[student.class]) classes[student.class] = []; classes[student.class].push(student); });
        Object.values(classes).forEach(classStudents => {
            const classSubjectStudents = classStudents.filter(s => s.scores[subject] !== undefined).sort((a, b) => b.scores[subject] - a.scores[subject]);
            classSubjectStudents.forEach((student, index) => { if (index > 0 && student.scores[subject] === classSubjectStudents[index - 1].scores[subject]) student.ranks[subject].class = classSubjectStudents[index - 1].ranks[subject].class; else student.ranks[subject].class = index + 1; });
        });
    });
    const totalStudents = RAW_DATA.filter(s => s.total !== undefined).sort((a, b) => b.total - a.total);
    totalStudents.forEach((student, index) => {
        if (!student.ranks) student.ranks = {}; if (!student.ranks.total) student.ranks.total = {};
        if (index > 0 && Math.abs(student.total - totalStudents[index - 1].total) < 0.0001) student.ranks.total.township = totalStudents[index - 1].ranks.total.township; else student.ranks.total.township = index + 1;
    });
    Object.values(SCHOOLS).forEach(school => {
        const schStus = school.students.sort((a, b) => b.total - a.total);
        schStus.forEach((s, i) => { if (i > 0 && Math.abs(s.total - schStus[i - 1].total) < 0.0001) s.ranks.total.school = schStus[i - 1].ranks.total.school; else s.ranks.total.school = i + 1; });
    });
    const classes = {}; RAW_DATA.forEach(student => { if (!classes[student.class]) classes[student.class] = []; classes[student.class].push(student); });
    Object.values(classes).forEach(classStudents => {
        const classTotalStudents = classStudents.sort((a, b) => b.total - a.total);
        classTotalStudents.forEach((student, index) => { if (index > 0 && Math.abs(student.total - classTotalStudents[index - 1].total) < 0.0001) student.ranks.total.class = classTotalStudents[index - 1].ranks.total.class; else student.ranks.total.class = index + 1; });
    });
}

function calculateRankings() {
    return; const doRank = (subject, key) => {
        const list = Object.values(SCHOOLS).filter(s => s.metrics[subject]);
        list.sort((a, b) => b.metrics[subject][key] - a.metrics[subject][key]);
        list.forEach((s, i) => {
            if (!s.rankings[subject]) s.rankings[subject] = {};
            if (i > 0 && Math.abs(s.metrics[subject][key] - list[i - 1].metrics[subject][key]) < 0.0001) s.rankings[subject][key] = list[i - 1].rankings[subject][key]; else s.rankings[subject][key] = i + 1;
        });
    };
    [...SUBJECTS, 'total'].forEach(sub => { doRank(sub, 'avg'); doRank(sub, 'excRate'); doRank(sub, 'passRate'); });
    const max = { avg: 0, exc: 0, pass: 0 };
    Object.values(SCHOOLS).forEach(s => { if (s.metrics.total) { max.avg = Math.max(max.avg, s.metrics.total.avg); max.exc = Math.max(max.exc, s.metrics.total.excRate); max.pass = Math.max(max.pass, s.metrics.total.passRate); } });
    const isGrade9 = CONFIG.name && CONFIG.name.includes('9');
    const wAvg = isGrade9 ? 50 : 60;
    const wExc = isGrade9 ? 80 : 70;
    const wPass = isGrade9 ? 50 : 70;
    townshipSchools.forEach(s => {
        if (s.metrics.total) {
            const m = s.metrics.total; const ratedAvg = max.avg > 0 ? (m.avg / max.avg * wAvg) : 0; const ratedExc = max.exc > 0 ? (m.excRate / max.exc * wExc) : 0; const ratedPass = max.pass > 0 ? (m.passRate / max.pass * wPass) : 0;
            m.ratedAvg = ratedAvg; m.ratedExc = ratedExc; m.ratedPass = ratedPass; s.score2Rate = ratedAvg + ratedExc + ratedPass;
        } else { s.score2Rate = 0; }
    });
    const list = Object.values(SCHOOLS); list.sort((a, b) => b.score2Rate - a.score2Rate); list.forEach((s, i) => s.rank2Rate = i + 1);
    let maxBAvg = 0; list.forEach(s => maxBAvg = Math.max(maxBAvg, s.bottom3.avg));
    list.forEach(s => s.scoreBottom = maxBAvg ? (s.bottom3.avg / maxBAvg * 40) : 0); list.sort((a, b) => b.scoreBottom - a.scoreBottom).forEach((s, i) => s.rankBottom = i + 1);
}

function getRankHTML(rank, type = 'school') { let cls = 'rank-cell'; if (rank === 1) cls += ' r-1'; if (rank === 2) cls += ' r-2'; if (rank === 3) cls += ' r-3'; return `<td class="${cls}">${rank}</td>`; }
function formatVal(val) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    return val.toFixed(2);
}
function escapeAppHtml(value) {
    const root = typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : {});
    const runtimeEscape = root.SchoolRuntime && typeof root.SchoolRuntime.escapeHtml === 'function'
        ? root.SchoolRuntime.escapeHtml
        : null;
    if (runtimeEscape) return runtimeEscape(value);
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
    }[char]));
}
function formatRankDisplay(value, rank, type = 'school', isPercent = false) { const displayValue = isPercent ? (value * 100).toFixed(2) + '%' : value.toFixed(2); return `${displayValue} <span style="font-size:0.9em; color:#94a3b8">(${rank})</span>`; }

const SummaryRenderPerfCache = {
    signature: '',
    townshipSchoolNames: [],
    townshipSchools: [],
    totalHeadHtml: '',
    totalBodyHtml: '',
    subjectTablesHtml: '',
    subjectNavHtml: '',
    bottomBodyHtml: '',
    profileEventsBound: false
};

function getSummaryRenderSignature() {
    const targetKeys = Object.keys(TARGETS || {}).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'));
    const signature = [
        window.CURRENT_EXAM_ID || readWorkspaceExamId() || '',
        window.__RAW_DATA_VERSION || 0,
        Array.isArray(RAW_DATA) ? RAW_DATA.length : 0,
        Array.isArray(SUBJECTS) ? SUBJECTS.join('|') : '',
        Object.keys(SCHOOLS || {}).join('|'),
        targetKeys.join('|'),
        MY_SCHOOL || ''
    ].join('::');
    if (SummaryRenderPerfCache.signature !== signature) {
        SummaryRenderPerfCache.signature = signature;
        SummaryRenderPerfCache.townshipSchoolNames = [];
        SummaryRenderPerfCache.townshipSchools = [];
        SummaryRenderPerfCache.totalHeadHtml = '';
        SummaryRenderPerfCache.totalBodyHtml = '';
        SummaryRenderPerfCache.subjectTablesHtml = '';
        SummaryRenderPerfCache.subjectNavHtml = '';
        SummaryRenderPerfCache.bottomBodyHtml = '';
    }
    return signature;
}

function getSummaryTownshipSchools() {
    getSummaryRenderSignature();
    if (SummaryRenderPerfCache.townshipSchools.length) return SummaryRenderPerfCache.townshipSchools;
    const hasTownshipScopeHelper = typeof getTownshipManagedSchoolNames === 'function';
    const townshipSchoolNames = hasTownshipScopeHelper
        ? getTownshipManagedSchoolNames(Object.keys(SCHOOLS || {}))
        : Object.keys(SCHOOLS || {});
    const townshipSchoolSet = new Set((townshipSchoolNames || []).map(name => String(name || '').trim()).filter(Boolean));
    SummaryRenderPerfCache.townshipSchoolNames = townshipSchoolNames;
    SummaryRenderPerfCache.townshipSchools = Object.values(SCHOOLS || {}).filter((school) => (
        hasTownshipScopeHelper
            ? (typeof isTownshipManagedSchool === 'function'
                ? isTownshipManagedSchool(school?.name, Object.keys(SCHOOLS || {}))
                : townshipSchoolSet.has(String(school?.name || '').trim()))
            : true
    ));
    return SummaryRenderPerfCache.townshipSchools;
}

function setSummaryHtmlIfChanged(element, html, key) {
    if (!element) return;
    const next = String(html || '');
    if (element.dataset.summaryRenderSig === key && element.innerHTML === next) return;
    element.innerHTML = next;
    element.dataset.summaryRenderSig = key;
}

function renderBottom3TableBody(summarySignature = getSummaryRenderSignature(), townshipSchools = getSummaryTownshipSchools()) {
    const tbBottom = document.querySelector('#tb-bottom3 tbody');
    if (!tbBottom) return false;
    let htmlBottom = '';
    const bottomList = townshipSchools.slice().sort((a, b) => (a.rankBottom || 9999) - (b.rankBottom || 9999));
    bottomList.forEach(s => {
        const isMySchool = sameAppSchoolName(s.name, MY_SCHOOL);
        htmlBottom += `
            <tr class="${isMySchool ? 'bg-highlight' : ''}">
                <td>${s.name}</td>
                <td>${s.bottom3 ? s.bottom3.totalN : ''}</td>
                <td>${s.bottom3 ? s.bottom3.bottomN : ''}</td>
                <td>
                    <span class="clickable-num" onclick="handleExcludedClick('${s.name}')" title="点击查看被剔除的低分学生">
                        ${s.bottom3 ? s.bottom3.excN : ''}
                    </span>
                </td>
                <td>${s.bottom3 ? s.bottom3.avg.toFixed(2) : ''}</td>
                <td class="text-red">${s.scoreBottom ? s.scoreBottom.toFixed(2) : ''}</td>
                ${getRankHTML(s.rankBottom)}
            </tr>`;
    });
    setSummaryHtmlIfChanged(tbBottom, htmlBottom, `${summarySignature}::bottom-body`);
    return true;
}

function renderBottom3TableOnly() {
    updateSchoolMode();
    const rendered = renderBottom3TableBody();
    if (window.SupportMetricsRuntime && typeof window.SupportMetricsRuntime.refreshBottom3Summary === 'function') {
        window.SupportMetricsRuntime.refreshBottom3Summary();
    }
    return rendered;
}

function bindSummaryProfileEvents(tbTotal) {
    if (!tbTotal || tbTotal.dataset.summaryProfileEventsBound === '1') return;
    tbTotal.addEventListener('click', event => {
        const cell = event.target.closest('[data-school-profile-name]');
        if (!cell || !tbTotal.contains(cell)) return;
        showSchoolProfile(cell.dataset.schoolProfileName || '');
    });
    tbTotal.addEventListener('keydown', event => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        const cell = event.target.closest('[data-school-profile-name]');
        if (!cell || !tbTotal.contains(cell)) return;
        event.preventDefault();
        showSchoolProfile(cell.dataset.schoolProfileName || '');
    });
    tbTotal.dataset.summaryProfileEventsBound = '1';
}

function getTownAnalysisVisibleSubjectsForCurrentUser() {
    const allSubjects = Array.isArray(SUBJECTS) ? SUBJECTS.filter(Boolean) : [];
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const role = user?.role || 'guest';
    if (role !== 'teacher') return allSubjects;

    let visibleSet = null;
    if (typeof getVisibleSubjectsForTeacherUser === 'function') {
        visibleSet = getVisibleSubjectsForTeacherUser(user);
    }
    if (!(visibleSet instanceof Set) || visibleSet.size === 0) {
        const scope = typeof getTeacherScopeForUser === 'function'
            ? getTeacherScopeForUser(user)
            : { subjects: new Set() };
        visibleSet = scope?.subjects instanceof Set ? scope.subjects : new Set();
    }

    const normalizedVisible = new Set(
        Array.from(visibleSet || [])
            .map(subject => normalizeSubject(subject))
            .filter(Boolean)
    );
    if (normalizedVisible.size === 0) return [];
    return allSubjects.filter(subject => normalizedVisible.has(normalizeSubject(subject)));
}

function scrollToTableAnchor(anchorId, trigger = null) {
    const target = document.getElementById(anchorId);
    if (!target) {
        if (typeof UI !== 'undefined' && UI && typeof UI.toast === 'function') {
            UI.toast('当前表格尚未生成，请先生成结果。', 'info');
        }
        return false;
    }
    document.querySelectorAll('.table-anchor-jumpbar button, .side-nav-link, .side-nav-sub-link')
        .forEach(item => item.classList.remove('active', 'is-active'));
    if (trigger && trigger.classList) trigger.classList.add('active');
    target.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    return true;
}

function renderTwoRateTableJumpbar(visibleSubjects, summarySignature) {
    const jumpbar = document.getElementById('two-rate-table-jumpbar');
    if (!jumpbar) return;
    const subjects = Array.isArray(visibleSubjects) ? visibleSubjects.filter(Boolean) : [];
    const navKey = `${summarySignature}::jumpbar::${subjects.map(s => normalizeSubject(s)).join('|')}`;
    if (jumpbar.dataset.summaryRenderSig === navKey && jumpbar.children.length) return;
    const buttons = [
        { label: '综合总表', anchorId: 'anchor-total', tone: 'total' },
        ...subjects.map(subject => ({
            label: subject,
            anchorId: `anchor-subject-${subject}`,
            tone: 'subject'
        })),
        { label: '横向对比', anchorId: 'horizontal-box', tone: 'compare' }
    ];
    jumpbar.innerHTML = `
        <div class="table-anchor-jumpbar-head">
            <strong>表格快速定位</strong>
            <span>点击按钮直接跳到总表、单科表或横向对比。</span>
        </div>
        <div class="table-anchor-jumpbar-links">
            ${buttons.map((button, index) => `
                <button type="button" class="${index === 0 ? 'active' : ''}" data-anchor-id="${escapeAppHtml(button.anchorId)}" data-anchor-tone="${escapeAppHtml(button.tone)}">
                    <span>${escapeAppHtml(button.label)}</span>
                </button>
            `).join('')}
        </div>
    `;
    jumpbar.querySelectorAll('[data-anchor-id]').forEach(button => {
        button.addEventListener('click', () => {
            const anchorId = button.getAttribute('data-anchor-id');
            if (anchorId === 'horizontal-box' && document.getElementById('horizontal-box')?.classList.contains('hidden')) {
                if (typeof renderHorizontalTable === 'function') renderHorizontalTable();
            }
            scrollToTableAnchor(anchorId, button);
        });
    });
    jumpbar.dataset.summaryRenderSig = navKey;
}

function renderTables() {
    updateSchoolMode();
    const tbTotal = document.querySelector('#tb-total tbody');
    const summarySignature = getSummaryRenderSignature();
    const townshipSchools = getSummaryTownshipSchools();
    if (!tbTotal) {
        console.warn("⚠️ [renderTables] 找不到 #tb-total tbody，跳过核心报表渲染。");
        return;
    }

    const theadTotal = document.querySelector('#tb-total thead tr');

    let list = townshipSchools.slice();

    appDebug(`系统共识别到 ${list.length} 所学校：`, list.map(s => s.name));

    const totalHeadHtml = `
            <th>学校名称</th><th>实考人数</th><th>平均分</th><th>优秀率</th><th>及格率</th>
            <th>平均分赋分</th><th>优秀率赋分</th><th>及格率赋分</th>
            <th>两率一分总分</th><th>排名</th>
        `;
    setSummaryHtmlIfChanged(theadTotal, totalHeadHtml, `${summarySignature}::total-head`);

    list.sort((a, b) => (a.rank2Rate || 9999) - (b.rank2Rate || 9999));
    const maxAvg = list.reduce((max, school) => (
        Math.max(max, Number(school.metrics?.total?.avg || 0))
    ), 0) || 100;

    let html = '';
    list.forEach(s => {
        const m = s.metrics.total || {};
        const rA = m.ratedAvg || 0;
        const rE = m.ratedExc || 0;
        const rP = m.ratedPass || 0;
        const isMySchool = sameAppSchoolName(s.name, MY_SCHOOL);

        const barPercent = m.avg ? Math.min(100, m.avg / maxAvg * 100).toFixed(1) : 0;
        const safeSchoolName = escapeAppHtml(s.name);
        html += `<tr class="${isMySchool ? 'bg-highlight' : ''}">
                <td data-label="学校" class="clickable-school" data-school-profile-name="${safeSchoolName}" role="button" tabindex="0" title="点击查看学校学科诊断">
                    ${safeSchoolName} <i class="ti ti-chart-radar" style="font-size:12px; opacity:0.5;"></i>
                </td>
                <td data-label="人数">${m.count || 0}</td>

                <td data-label="平均分" class="data-bar-bg" style="--percent: ${barPercent}%">
                    ${formatRankDisplay(m.avg || 0, s.rankings.total?.avg || 0)}
                </td>

                <td data-label="优秀率">${formatRankDisplay(m.excRate || 0, s.rankings.total?.excRate || 0, 'school', true)}</td>
                <td data-label="及格率">${formatRankDisplay(m.passRate || 0, s.rankings.total?.passRate || 0, 'school', true)}</td>
                <td data-label="均分赋分">${rA.toFixed(2)}</td>
                <td data-label="优率赋分">${rE.toFixed(2)}</td>
                <td data-label="及格赋分">${rP.toFixed(2)}</td>
                <td data-label="总分" class="text-red" style="font-size:1.1em; font-weight:bold;">${(s.score2Rate || 0).toFixed(2)}</td>
                ${getRankHTML(s.rank2Rate)}
            </tr>`;
    });
    setSummaryHtmlIfChanged(tbTotal, html, `${summarySignature}::total-body`);
    bindSummaryProfileEvents(tbTotal);
    applySchoolModeToTables();

    const subContainer = document.getElementById('subject-tables-container');
    const sideNavSubjects = document.getElementById('side-nav-subjects-container');
    const visibleSubjects = getTownAnalysisVisibleSubjectsForCurrentUser();
    const subjectRenderKey = `${summarySignature}::subjects::${visibleSubjects.map(s => normalizeSubject(s)).join('|')}`;
    renderTwoRateTableJumpbar(visibleSubjects, summarySignature);

    if (subContainer?.dataset.summaryRenderSig !== subjectRenderKey || sideNavSubjects?.dataset.summaryRenderSig !== subjectRenderKey) {
    if (subContainer) subContainer.innerHTML = '';
    if (sideNavSubjects) sideNavSubjects.innerHTML = '';

    if (!subContainer || !sideNavSubjects) {
        console.warn("⚠️ [renderTables] 找不到学科表格或导航容器，跳过学科详情渲染。");
        return;
    }

    visibleSubjects.forEach(sub => {
        const thresh = THRESHOLDS[sub];
        const subList = townshipSchools.filter(s => s.metrics[sub]).sort((a, b) => (a.rankings[sub].avg - b.rankings[sub].avg));
        const box = document.createElement('div');
        const anchorId = `anchor-subject-${sub}`;
        box.id = anchorId;
        box.className = 'anchor-target analysis-anchor-panel analysis-generated-panel';
        box.innerHTML = `<div class="sub-header analysis-section-head analysis-generated-header"><span>📘 ${sub} 学科明细</span><span class="analysis-generated-meta"><span class="analysis-table-tag">覆盖 ${subList.length} 校</span><span class="analysis-table-tag">优秀线 ≥ ${(thresh?.exc || 0).toFixed(1)}</span><span class="analysis-table-tag">及格线 ≥ ${(thresh?.pass || 0).toFixed(1)}</span></span></div><div class="analysis-generated-note">按平均分排序，可快速定位本校在该学科的站位与各校差距。</div><div class="table-wrap analysis-table-shell"><table class="analysis-generated-table"><thead><tr><th>学校名称</th><th>实考人数</th><th>平均分</th><th>优秀率</th><th>及格率</th></tr></thead><tbody></tbody></table></div>`;
        const tbody = box.querySelector('tbody');
        let htmlSub = '';
        if (subList.length === 0) {
            htmlSub = `<tr><td colspan="5" class="analysis-empty-cell">暂无 ${sub} 学科数据</td></tr>`;
        } else {
            subList.forEach(s => {
                const m = s.metrics[sub];
                const r = s.rankings[sub];
                const isMySchool = sameAppSchoolName(s.name, MY_SCHOOL);
                htmlSub += `<tr class="${isMySchool ? 'bg-highlight' : ''}"><td data-label="学校名称">${s.name}</td><td data-label="实考人数">${m.count}</td><td data-label="平均分">${formatRankDisplay(m.avg, r.avg)}</td><td data-label="优秀率">${formatRankDisplay(m.excRate, r.excRate, 'school', true)}</td><td data-label="及格率">${formatRankDisplay(m.passRate, r.passRate, 'school', true)}</td></tr>`;
            });
        }
        tbody.innerHTML = htmlSub; subContainer.appendChild(box); const navLink = document.createElement('a'); navLink.className = 'side-nav-sub-link'; navLink.innerText = sub; navLink.onclick = () => scrollToSubAnchor(anchorId, navLink); sideNavSubjects.appendChild(navLink);
    });
    if (visibleSubjects.length === 0) {
        subContainer.innerHTML = '<div class="analysis-empty-state">当前教师账号未匹配到任教学科，暂不展示学科明细。</div>';
        sideNavSubjects.innerHTML = '<span class="analysis-empty-cell">暂无可见学科</span>';
    }
    if (subContainer) subContainer.dataset.summaryRenderSig = subjectRenderKey;
    if (sideNavSubjects) sideNavSubjects.dataset.summaryRenderSig = subjectRenderKey;
    }

    renderBottom3TableBody(summarySignature, townshipSchools);
    refreshIndicatorResults(true);
    markSummaryDataChangedIfDependencyChanged(
        'twoRateBottom',
        buildSummaryDependencySignature('twoRateBottom', townshipSchools),
        '两率一分或后1/3结果已更新，请重新生成总排名。'
    );
}

function getStudentBlankScoreSubjects(student, visibleSubjects = SUBJECTS) {
    const allowed = new Set(Array.isArray(visibleSubjects) ? visibleSubjects : []);
    const recorded = Array.isArray(student?.blankScoreSubjects)
        ? student.blankScoreSubjects.filter(sub => !allowed.size || allowed.has(sub))
        : [];
    return [...new Set(recorded)];
}

function getStudentZeroScoreAuditSubjects(student, visibleSubjects = SUBJECTS) {
    const allowedSubjects = Array.isArray(visibleSubjects) && visibleSubjects.length ? visibleSubjects : SUBJECTS;
    const blankSubjects = getStudentBlankScoreSubjects(student, allowedSubjects);
    const blankSet = new Set(blankSubjects);
    const zeroSubjects = [];
    allowedSubjects.forEach(sub => {
        const score = Number(student?.scores?.[sub]);
        if (Number.isFinite(score) && score === 0 && !blankSet.has(sub)) zeroSubjects.push(sub);
    });
    return {
        blankSubjects,
        zeroSubjects,
        allSubjects: [...blankSubjects, ...zeroSubjects]
    };
}

const BlankScoreAuditPerfCache = {
    rowsSignature: '',
    rows: [],
    summarySignature: '',
    summaryHtml: '',
    tableSignature: '',
    tableHtml: ''
};

function buildBlankScoreAuditSignature(visibleSubjects = SUBJECTS) {
    const subjects = Array.isArray(visibleSubjects) ? visibleSubjects : [];
    const rows = Array.isArray(RAW_DATA) ? RAW_DATA : [];
    let blankCount = 0;
    let zeroCount = 0;
    let totalSum = 0;
    rows.forEach(student => {
        totalSum += Number(student?.total) || 0;
        const blankSubjects = Array.isArray(student?.blankScoreSubjects) ? student.blankScoreSubjects : [];
        blankCount += blankSubjects.length;
        subjects.forEach(subject => {
            const score = Number(student?.scores?.[subject]);
            if (Number.isFinite(score) && score === 0 && !blankSubjects.includes(subject)) zeroCount += 1;
        });
    });
    return [
        window.__RAW_DATA_VERSION || 0,
        rows.length,
        subjects.join('|'),
        blankCount,
        zeroCount,
        totalSum.toFixed(2)
    ].join('::');
}

function collectBlankScoreAuditRows(visibleSubjects = SUBJECTS) {
    const subjects = Array.isArray(visibleSubjects) ? visibleSubjects : (Array.isArray(SUBJECTS) ? SUBJECTS : []);
    const signature = buildBlankScoreAuditSignature(subjects);
    if (BlankScoreAuditPerfCache.rowsSignature === signature) {
        return BlankScoreAuditPerfCache.rows;
    }
    const rows = [];
    (Array.isArray(RAW_DATA) ? RAW_DATA : []).forEach(student => {
        const audit = getStudentZeroScoreAuditSubjects(student, subjects);
        audit.blankSubjects.forEach(subject => rows.push({ student, subject, type: '原始空白，按0分计' }));
        audit.zeroSubjects.forEach(subject => rows.push({ student, subject, type: '0分记录，需核对是否空分' }));
    });
    BlankScoreAuditPerfCache.rowsSignature = signature;
    BlankScoreAuditPerfCache.rows = rows;
    return rows;
}

function renderBlankScoreAuditTable(tbody, rows, options = {}) {
    if (!tbody) return;
    const limit = Number(options.limit || 120);
    const tableSignature = `${BlankScoreAuditPerfCache.rowsSignature}::${limit}`;
    if (tbody.dataset.blankScoreAuditSig === tableSignature && BlankScoreAuditPerfCache.tableSignature === tableSignature) return;
    const html = rows.slice(0, limit).map(({ student, subject, type }) => {
        const rank = student?.ranks || {};
        const subjectRank = rank?.[subject] || {};
        const townRank = subjectRank.township ?? subjectRank.town ?? '-';
        return `<tr>
            <td>${escapeAppHtml(student?.school || '-')}</td>
            <td>${escapeAppHtml(student?.class || '-')}</td>
            <td>${escapeAppHtml(student?.name || '-')}</td>
            <td>${escapeAppHtml(student?.id || '-')}</td>
            <td>${escapeAppHtml(subject)}</td>
            <td><span style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:999px; background:#fff7ed; color:#b45309; font-weight:700; font-size:12px;">${escapeAppHtml(type)}</span></td>
            <td>${Number.isFinite(Number(student?.total)) ? Number(student.total).toFixed(1).replace(/\.0$/, '') : '-'}</td>
            <td>${subjectRank.school ?? '-'}</td>
            <td>${townRank}</td>
            <td>${subjectRank.county ?? '-'}</td>
        </tr>`;
    }).join('');
    tbody.innerHTML = html;
    tbody.dataset.blankScoreAuditSig = tableSignature;
    BlankScoreAuditPerfCache.tableSignature = tableSignature;
    BlankScoreAuditPerfCache.tableHtml = html;
}

function buildBlankScoreAuditSummaryHtml(rows, options = {}) {
    const limit = Number(options.limit || 120);
    const summarySignature = `${BlankScoreAuditPerfCache.rowsSignature}::${limit}`;
    if (BlankScoreAuditPerfCache.summarySignature === summarySignature) {
        return BlankScoreAuditPerfCache.summaryHtml;
    }
    const subjectCounts = rows.reduce((acc, item) => {
        acc[item.subject] = (acc[item.subject] || 0) + 1;
        return acc;
    }, {});
    const summaryText = Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([subject, count]) => `<span><strong>${escapeAppHtml(subject)}：</strong>${count} 人次</span>`)
        .join('');
    const tail = rows.length > limit ? `当前展示前 ${limit} 条，完整名单请按学校/班级继续筛选。` : '已展示全部核对记录。';
    const html = `<span><strong>共 ${rows.length} 条学科记录</strong></span>${summaryText}<span>${tail}</span>`;
    BlankScoreAuditPerfCache.summarySignature = summarySignature;
    BlankScoreAuditPerfCache.summaryHtml = html;
    return html;
}

function renderBlankScoreAuditPanel() {
    const panel = document.getElementById('blank-score-audit-panel');
    const tbody = document.getElementById('blank-score-audit-body');
    const summary = document.getElementById('blank-score-audit-summary');
    if (!panel) return;
    panel.style.display = 'none';
    if (tbody) tbody.innerHTML = '';
    if (summary) summary.innerHTML = '';
}

function renderBlankScoreAuditModule() {
    const root = document.getElementById('blank-score-audit-module-root');
    const summary = document.getElementById('blank-score-audit-module-summary');
    const tbody = document.getElementById('blank-score-audit-module-body');
    const empty = document.getElementById('blank-score-audit-module-empty');
    if (!root || !summary || !tbody) return;
    const rows = collectBlankScoreAuditRows(SUBJECTS);
    if (!rows.length) {
        const emptyHtml = '<span><strong>暂无需要单独核对的空分/0分学科。</strong></span><span>如学生单科为空，系统会按 0 分参与排名，并自动在这里生成记录。</span>';
        if (summary.innerHTML !== emptyHtml) summary.innerHTML = emptyHtml;
        if (tbody.innerHTML) tbody.innerHTML = '';
        if (empty) empty.style.display = '';
        return;
    }
    if (empty) empty.style.display = 'none';
    const summaryHtml = buildBlankScoreAuditSummaryHtml(rows, { limit: 500 });
    if (summary.innerHTML !== summaryHtml) summary.innerHTML = summaryHtml;
    renderBlankScoreAuditTable(tbody, rows, { limit: 500 });
}

Object.assign(window, {
    collectBlankScoreAuditRows,
    getStudentBlankScoreSubjects,
    getStudentZeroScoreAuditSubjects,
    renderBlankScoreAuditPanel,
    renderBlankScoreAuditModule
});

if (!window.__blankScoreAuditRefreshBound) {
    window.__blankScoreAuditRefreshBound = true;
    document.addEventListener('click', (event) => {
        const button = event.target && typeof event.target.closest === 'function'
            ? event.target.closest('[data-blank-score-audit-refresh]')
            : null;
        if (!button) return;
        event.preventDefault();
        renderBlankScoreAuditModule();
    });
}

function renderTrafficLightDashboard() {
    const container = document.getElementById('traffic-light-dashboard');
    const listRed = document.getElementById('list-red');
    const listYellow = document.getElementById('list-yellow');
    const listGreen = document.getElementById('list-green');
    if (!container || !listRed || !listYellow || !listGreen) return;
    const hasTrafficScopeHelper = typeof listAvailableSchoolsForCompare === 'function';
    const townshipSchoolNames = hasTrafficScopeHelper
        ? listAvailableSchoolsForCompare()
        : Object.keys(SCHOOLS || {});
    const townshipSchoolSet = new Set((townshipSchoolNames || []).map(name => String(name || '').trim()).filter(Boolean));
    const townshipSchools = Object.values(SCHOOLS || {}).filter((school) => (
        hasTrafficScopeHelper
            ? (typeof isTownshipManagedSchool === 'function'
                ? isTownshipManagedSchool(school?.name, Object.keys(SCHOOLS || {}))
                : townshipSchoolSet.has(String(school?.name || '').trim()))
            : true
    ));

    if (townshipSchools.length === 0) {
        container.classList.add('hidden');
        return;
    }

    container.classList.remove('hidden');
    listRed.innerHTML = ''; listYellow.innerHTML = ''; listGreen.innerHTML = '';

    let cntRed = 0, cntYellow = 0, cntGreen = 0;
    const redTrafficRows = [];
    const yellowTrafficRows = [];
    const greenTrafficRows = [];

    townshipSchools.forEach(s => {
        if (hasTrafficScopeHelper && typeof isTownshipManagedSchool === 'function' && !isTownshipManagedSchool(s?.name, Object.keys(SCHOOLS || {}))) return;
        if (townshipSchoolSet.size && typeof isTownshipManagedSchool !== 'function' && !townshipSchoolSet.has(String(s?.name || '').trim())) return;
        [...SUBJECTS, 'total'].forEach(sub => {
            const m = s.metrics[sub];
            if (!m) return;

            const subName = sub === 'total' ? CONFIG.label : sub;
            const excP = m.excRate * 100;
            const passP = m.passRate * 100;
            const rank = s.rankings[sub]?.avg || 999;
            const totalSchools = townshipSchools.length;

            if (passP < 60 || rank === totalSchools) {
                const reason = passP < 60 ? `及格率过低 (${passP.toFixed(1)}%)` : `全镇排名倒数第一`;
                const html = `
                        <div class="traffic-item" onclick="jumpToDetail('${s.name}', '${sub}')">
                            <div class="t-school">${s.name} <span class="t-badge bg-red-light">${subName}</span></div>
                            <div class="t-sub">
                                <span>${reason}</span>
                                <span style="font-weight:bold;">📉 Avg: ${m.avg.toFixed(1)}</span>
                            </div>
                        </div>`;
                redTrafficRows.push(html);
                cntRed++;
            }
            else if (excP > 30 || rank === 1) {
                const reason = rank === 1 ? `全镇排名第一` : `优秀率突出 (${excP.toFixed(1)}%)`;
                const rankText = Number.isFinite(Number(rank)) && Number(rank) > 0 ? `排：${Number(rank)}` : '排：-';
                const html = `
                        <div class="traffic-item" onclick="jumpToDetail('${s.name}', '${sub}')">
                            <div class="t-school">${s.name} <span class="t-badge bg-green-light">${subName}</span></div>
                            <div class="t-sub">
                                <span>${reason}</span>
                                <span style="font-weight:bold;">${rankText}</span>
                            </div>
                        </div>`;
                greenTrafficRows.push(html);
                cntGreen++;
            }
            else if (excP < 15) {
                const html = `
                        <div class="traffic-item" onclick="jumpToDetail('${s.name}', '${sub}')">
                            <div class="t-school">${s.name} <span class="t-badge bg-yellow-light">${subName}</span></div>
                            <div class="t-sub">
                                <span>尖子生匮乏 (优率${excP.toFixed(1)}%)</span>
                                <span>排: ${rank}</span>
                            </div>
                        </div>`;
                yellowTrafficRows.push(html);
                cntYellow++;
            }
        });
    });

    document.getElementById('count-red').innerText = cntRed;
    document.getElementById('count-yellow').innerText = cntYellow;
    document.getElementById('count-green').innerText = cntGreen;

    listRed.innerHTML = cntRed === 0
        ? '<div style="text-align:center;color:#999;font-size:12px;padding:10px;">🎉 平安无事，暂无严重警告</div>'
        : redTrafficRows.join('');
    listYellow.innerHTML = cntYellow === 0
        ? '<div style="text-align:center;color:#999;font-size:12px;padding:10px;">无风险预警</div>'
        : yellowTrafficRows.join('');
    listGreen.innerHTML = cntGreen === 0
        ? '<div style="text-align:center;color:#999;font-size:12px;padding:10px;">暂无突出标杆，继续加油</div>'
        : greenTrafficRows.join('');
}

function jumpToDetail(school, subject) {
    if (subject === 'total') {
        document.getElementById('anchor-total').scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
        const anchor = document.getElementById(`anchor-subject-${subject}`);
        if (anchor) {
            const navLink = document.querySelector(`.side-nav-sub-link[onclick*="${subject}"]`);
            if (navLink) {
                const parent = navLink.closest('.side-nav-sub-container');
                if (parent) parent.classList.add('show');
            }
            anchor.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    setTimeout(() => {
        UI.toast(`已定位到：${school} - ${subject}`, 'info');
    }, 500);
}

function setTeacherConfigSelectOptionsIfChanged(select, html, signature) {
    if (!select) return;
    const sig = String(signature || html || '');
    if (select.dataset.teacherConfigOptionsSig === sig) return;
    select.innerHTML = html;
    select.dataset.teacherConfigOptionsSig = sig;
}

function updateSchoolSelect() {
    const sel = document.getElementById('sel-school');
    if (!sel) return;
    const previousValue = String(sel.value || '').trim();
    const user = getCurrentUser();
    const availableSchools = (typeof listAvailableSchoolsForCompare === 'function')
        ? listAvailableSchoolsForCompare('all')
        : Object.keys(SCHOOLS || {});
    const schools = PermissionPolicy.getAccessibleSchoolNames(user, availableSchools);
    const optionsHtml = '<option value="">--请选择学校--</option>'
        + schools.map(name => `<option value="${tmEscapeHtml(name)}">${tmEscapeHtml(name)}</option>`).join('');
    setTeacherConfigSelectOptionsIfChanged(sel, optionsHtml, `schools:${schools.join('|')}`);
    if (!PermissionPolicy.isAdmin(user)) {
        const boundSchool = PermissionPolicy.getBoundSchool(user);
        if (boundSchool && Array.from(sel.options).some(option => option.value === boundSchool)) {
            sel.value = boundSchool;
            sel.disabled = true;
        }
    } else {
        sel.disabled = false;
        if (previousValue && schools.includes(previousValue)) {
            sel.value = previousValue;
        }
    }
    if (sel.dataset.boundUpdateClassSelect !== '1') {
        sel.dataset.boundUpdateClassSelect = '1';
        sel.addEventListener('change', updateClassSelect);
    }
}

function updateMySchoolSelect() {
    if (typeof Auth !== 'undefined') {
        Auth.renderSchoolCheckboxes();
    }

    const select = document.getElementById('mySchoolSelect');

    if (!select) return;

    const schools = (typeof listAvailableSchoolsForCompare === 'function')
        ? listAvailableSchoolsForCompare('all')
        : Object.keys(SCHOOLS || {});
    const schoolSet = new Set((schools || []).map(s => String(s || '').trim()).filter(Boolean));
    const currentSchool = ensureWorkspaceDefaultSchool();
    if (currentSchool) schoolSet.add(currentSchool);
    const mergedSchools = [...schoolSet].sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const optionsHtml = '<option value="">--请选择本校--</option>'
        + mergedSchools.map(school => `<option value="${tmEscapeHtml(school)}">${tmEscapeHtml(school)}</option>`).join('');
    setTeacherConfigSelectOptionsIfChanged(select, optionsHtml, `my-school:${mergedSchools.join('|')}`);

    const savedTrim = String(currentSchool || '').trim();
    const matchedSaved = mergedSchools.find(s => String(s).trim() === savedTrim) || '';
    const currentTrim = String(currentSchool || '').trim();
    const matchedCurrent = mergedSchools.find(s => String(s).trim() === currentTrim) || '';

    if (matchedSaved) {
        writeCurrentSchool(matchedSaved);
        select.value = matchedSaved;
    } else if (matchedCurrent) {
        writeCurrentSchool(matchedCurrent);
        select.value = matchedCurrent;
    } else if (mergedSchools.length === 1) {
        writeCurrentSchool(mergedSchools[0]);
        select.value = readCurrentSchool();
    }


    if (select.dataset.boundMySchoolSelect !== '1') {
        select.dataset.boundMySchoolSelect = '1';
        select.addEventListener('change', function () {
            writeCurrentSchool(this.value);
            if (readCurrentSchool()) generateTeacherInputs();
            renderTables();
            const mySchoolInput = document.getElementById('mySchool');
            if (mySchoolInput && readCurrentSchool()) mySchoolInput.value = readCurrentSchool();
            updateStatusPanel();
        });
    }
}

function updateClassSelect() {
    const schoolSelect = document.getElementById('sel-school');
    const classSelect = document.getElementById('sel-class');
    if (!schoolSelect || !classSelect) return;
    let optionsHtml = '<option>--请先选择学校--</option>';
    let signature = `classes:${schoolSelect.value || ''}:empty`;
    const schoolRecord = getAppSchoolRecord(schoolSelect.value);
    if (schoolSelect.value && schoolRecord) {
        const user = getCurrentUser();
        const classMode = PermissionPolicy.isClassTeacher(user) ? 'homeroom' : 'teaching';
        const classes = PermissionPolicy.getAccessibleClassNames(user, [...new Set((schoolRecord.students || []).map(s => s.class))].sort(), schoolSelect.value, { mode: classMode });
        optionsHtml = '<option>--请先选择学校--</option>' + classes.map(cls => `<option>${tmEscapeHtml(cls)}</option>`).join('');
        signature = `classes:${schoolSelect.value}:${classMode}:${classes.join('|')}`;
    }
    setTeacherConfigSelectOptionsIfChanged(classSelect, optionsHtml, signature);
}

function autoDetectMySchool() {
    const schoolNames = (typeof listAvailableSchoolsForCompare === 'function')
        ? listAvailableSchoolsForCompare()
        : Object.keys(SCHOOLS || {});
    if (!schoolNames.length) return alert('未找到可识别学校（当前与历史考试均为空）');

    let detectedSchool = '';

    const defaultSchool = findAvailableSchool(DEFAULT_MY_SCHOOL_NAME, schoolNames);

    if (defaultSchool) {
        detectedSchool = defaultSchool;
    } else if (schoolNames.length === 1 && isConcreteSchoolCandidate(schoolNames[0])) {
        detectedSchool = schoolNames[0];
    } else {
        try {
            const user = getCurrentUser();
            if (user && user.school && isConcreteSchoolCandidate(user.school)) {
                const boundSchool = findAvailableSchool(user.school, schoolNames);
                if (boundSchool) detectedSchool = boundSchool;
            }
        } catch (e) {
            console.warn('获取用户信息失败:', e);
        }

        if (!detectedSchool) {
            try {
                if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) {
                    const schoolCounts = {};
                    const classSchoolMap = (typeof getClassSchoolMapForAllData === 'function') ? getClassSchoolMapForAllData() : {};
                    Object.keys(TEACHER_MAP).forEach(key => {
                        const cls = normalizeClass(key.split('_')[0]);
                        const hitSchool = classSchoolMap[cls];
                        if (hitSchool && schoolNames.includes(hitSchool)) {
                            schoolCounts[hitSchool] = (schoolCounts[hitSchool] || 0) + 1;
                        }
                    });
                    let max = 0; let winner = '';
                    for (const [s, c] of Object.entries(schoolCounts)) {
                        if (c > max) { max = c; winner = s; }
                    }
                    if (winner) detectedSchool = winner;
                }
            } catch (e) {
                console.warn('从教师任课统计识别学校失败:', e);
            }
        }

        if (!detectedSchool) {
            try {
                if (window.RAW_DATA && Array.isArray(RAW_DATA) && RAW_DATA.length > 0) {
                    const schoolCounts = {};
                    RAW_DATA.forEach(row => {
                        if (!row) return;
                        const school = String(row.school || '').trim();
                        if (school && schoolNames.includes(school)) {
                            schoolCounts[school] = (schoolCounts[school] || 0) + 1;
                        }
                    });
                    let max = 0; let winner = '';
                    for (const [s, c] of Object.entries(schoolCounts)) {
                        if (c > max) { max = c; winner = s; }
                    }
                    if (winner) detectedSchool = winner;
                }
            } catch (e) {
                console.warn('从原始数据统计识别学校失败:', e);
            }
        }

        if (!detectedSchool) {
            try {
                if (window.SCHOOLS && typeof SCHOOLS === 'object') {
                    let max = 0; let winner = '';
                    for (const [school, data] of Object.entries(SCHOOLS)) {
                        if (!data || !Array.isArray(data.students)) continue;
                        const count = data.students.length;
                        if (count > max && schoolNames.includes(school)) {
                            max = count;
                            winner = school;
                        }
                    }
                    if (winner) detectedSchool = winner;
                }
            } catch (e) {
                console.warn('从学校对象统计识别学校失败:', e);
            }
        }
    }

    if (!detectedSchool) return alert('未能自动识别本校，请手动选择');

    writeCurrentSchool(detectedSchool);

    const sel = document.getElementById('mySchoolSelect');
    if (sel) sel.value = readCurrentSchool();
    const mySchoolInput = document.getElementById('mySchool');
    if (mySchoolInput) mySchoolInput.value = readCurrentSchool();
    updateStatusPanel();
    if (window.UI) UI.toast(`✅ 已识别本校：${MY_SCHOOL}`, 'success');
}

// Moved to student-details-render-runtime.js (StudentDetailsPerfCache, renderStudentDetails, exportStudentDetails, etc.)
function updateMarginalSchoolSelect() {
    const select = document.getElementById('marginalSchoolSelect');
    if (!select) return;
    const schoolList = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare('all') : Object.keys(SCHOOLS || {});
    select.innerHTML = `<option value="">--请选择本校--</option>${schoolList.map(school => `<option value="${school}">${school}</option>`).join('')}`;
    const currentSchool = readCurrentSchool();
    const matched = Array.from(select.options || []).find(option => sameAppSchoolName(option.value, currentSchool));
    if (matched) select.value = matched.value;
}

function generateTeacherInputs() {
    if (!MY_SCHOOL) { alert('请先选择本校'); return; }
    const container = document.getElementById('teacherInputsContainer');
    if (!container) return;
    container.innerHTML = '';
    const mySchoolData = getAppSchoolRecord(readCurrentSchool() || MY_SCHOOL);
    if (!mySchoolData) return;
    const classes = [...new Set(mySchoolData.students.map(s => s.class))].sort((a, b) => { const [gradeA, classA] = a.split('.').map(Number); const [gradeB, classB] = b.split('.').map(Number); if (gradeA !== gradeB) return gradeA - gradeB; return classA - classB; });
    const teacherInputFragment = document.createDocumentFragment();
    classes.forEach(cls => {
        SUBJECTS.forEach(sub => { const key = `${cls}_${sub}`; const currentTeacher = TEACHER_MAP[key] || ''; const inputDiv = document.createElement('div'); inputDiv.innerHTML = `<label style="font-size:12px;color:#666;">${cls}班 ${sub}</label><input type="text" class="teacher-input" data-key="${key}" value="${currentTeacher}" placeholder="姓名" style="width:100%;margin-top:2px;">`; teacherInputFragment.appendChild(inputDiv); });
    });
    container.appendChild(teacherInputFragment);
    container.querySelectorAll('.teacher-input').forEach(input => {
        input.addEventListener('input', function () {
            const key = this.dataset.key; const value = this.value.trim(); if (value) TEACHER_MAP[key] = value; else delete TEACHER_MAP[key];             // 防抖保存：输入停止 1 秒后保存，避免频繁写入
            clearTimeout(window.saveTimer);
            window.saveTimer = setTimeout(() => {
                const currentKey = readWorkspaceProjectKey() || 'autosave_backup';
                const snapshotPayload = typeof getCurrentSnapshotPayload === 'function'
                    ? getCurrentSnapshotPayload()
                    : {
                        timestamp: Date.now(),
                        RAW_DATA: RAW_DATA,
                        SCHOOLS: SCHOOLS,
                        SUBJECTS: SUBJECTS,
                        THRESHOLDS: THRESHOLDS,
                        TEACHER_MAP: TEACHER_MAP,
                        TEACHER_STATS: TEACHER_STATS,
                        FB_CLASSES: FB_CLASSES,
                        CONFIG: CONFIG,
                        MY_SCHOOL: MY_SCHOOL
                    };
                DB.save(currentKey, snapshotPayload, getLegacyDbSaveOptionsForKey(currentKey));
            }, 1000);
        });
    });
}

function importTeacherExcel() {
    const fileInput = document.getElementById('teacherFileInput');
    if (!fileInput) {
        alert('❌ 系统错误：找不到文件输入框');
        return;
    }

    if (!fileInput.files || !fileInput.files.length) {
        alert('⚠️ 请选择教师信息Excel文件');
        return;
    }

    if (typeof isArchiveLocked === 'function' && isArchiveLocked()) {
        alert("⛔ 当前考试已封存，禁止导入任课表");
        return;
    }

    if (typeof XLSX === 'undefined') {
        alert('❌ Excel解析库未加载，请刷新页面后重试');
        return;
    }

    const file = fileInput.files[0];
    appDebug(`[旧版入口] 开始导入: ${file.name}`);

    if (window.UI) UI.loading(true, '✨ 正在导入教师信息...');

    const reader = new FileReader();
    reader.onload = async function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(firstSheet);

            if (!jsonData || jsonData.length === 0) {
                if (window.UI) UI.loading(false);
                alert('❌ 表格为空或格式不正确');
                return;
            }

            let count = 0;
            jsonData.forEach(row => {
                const className = normalizeClass(row['班级'] || row['class'] || row['Class']);
                const subject = row['学科'] || row['subject'] || row['科目'];
                const teacher = row['教师'] || row['teacher'] || row['教师姓名'] || row['姓名'];

                if (className && subject && teacher) {
                    TEACHER_MAP[`${className}_${subject}`] = String(teacher).trim();
                    count++;
                }
            });

            if (count === 0) {
                if (window.UI) UI.loading(false);
                alert('❌ 未能导入任何数据，请检查Excel格式');
                return;
            }

            if (typeof generateTeacherInputs === 'function') {
                generateTeacherInputs();
            }

            if (typeof saveCloudData === 'function') {
                try {
                    await saveCloudData({ background: true, sourceLabel: 'teacher-import' });
                    if (window.UI) {
                        UI.loading(false);
                        UI.toast(`✅ 成功导入 ${count} 条教师信息，云端正在后台同步`, "success");
                    } else {
                        alert(`✅ 成功导入 ${count} 条教师信息，云端正在后台同步`);
                    }
                } catch (err) {
                    if (window.UI) UI.loading(false);
                    logCloudSyncIssue('云端同步失败:', err);
                    alert(`✅ 成功导入 ${count} 条教师信息\n\n⚠️ 但云端同步失败，请手动保存。`);
                }
            } else {
                if (window.UI) UI.loading(false);
                alert(`✅ 成功导入 ${count} 条教师信息`);
            }

        } catch (error) {
            if (window.UI) UI.loading(false);
            console.error('导入错误:', error);
            alert('❌ 导入失败：' + error.message);
        }
    };

    reader.onerror = function () {
        if (window.UI) UI.loading(false);
        alert('❌ 文件读取失败');
    };

    reader.readAsArrayBuffer(file);
}


let __reportQueryToken = 0;
const ReportHistoryPerfCache = {
    subjectScores: new Map(),
    lastScrollKey: '',
    domCache: null,
    domSignature: '',
    currentFingerprintRows: null,
    currentFingerprintVersion: -1,
    currentFingerprintLength: -1,
    currentFingerprint: '',
    examFingerprintByExam: new WeakMap(),
    selectedExamIdsSignature: '',
    selectedExamIds: [],
    historyByStudent: new Map(),
    examStudentLookup: new Map(),
    hydratingKeys: new Set(),
    lastQueryKey: '',
    inflightReportQueryKey: '',
    inflightReportQueryPromise: null,
    lastRenderedReportQueryKey: '',
    lastChartScheduleKey: '',
    lastStrengthKey: '',
    lastCompareHiddenKey: ''
};

function getCurrentReportDataFingerprint() {
    const rows = RAW_DATA || [];
    const version = Number(window.__RAW_DATA_VERSION || 0);
    const length = Array.isArray(rows) ? rows.length : 0;
    if (ReportHistoryPerfCache.currentFingerprintRows === rows
        && ReportHistoryPerfCache.currentFingerprintVersion === version
        && ReportHistoryPerfCache.currentFingerprintLength === length
        && ReportHistoryPerfCache.currentFingerprint) {
        return ReportHistoryPerfCache.currentFingerprint;
    }
    const fingerprint = typeof computeExamDataFingerprint === 'function'
        ? String(computeExamDataFingerprint(rows) || '').trim()
        : String(length || 0);
    ReportHistoryPerfCache.currentFingerprintRows = rows;
    ReportHistoryPerfCache.currentFingerprintVersion = version;
    ReportHistoryPerfCache.currentFingerprintLength = length;
    ReportHistoryPerfCache.currentFingerprint = fingerprint;
    return fingerprint;
}

function getReportExamFingerprint(exam, examData = null) {
    const rows = Array.isArray(examData) ? examData : (Array.isArray(exam?.data) ? exam.data : []);
    const stored = String(exam?.fingerprint || '').trim();
    if (stored) return stored;
    if (!exam || typeof exam !== 'object') {
        return typeof computeExamDataFingerprint === 'function'
            ? String(computeExamDataFingerprint(rows) || '').trim()
            : String(rows.length || 0);
    }
    const cached = ReportHistoryPerfCache.examFingerprintByExam.get(exam);
    if (cached && cached.rows === rows && cached.length === rows.length && cached.fingerprint) {
        return cached.fingerprint;
    }
    const fingerprint = typeof computeExamDataFingerprint === 'function'
        ? String(computeExamDataFingerprint(rows) || '').trim()
        : String(rows.length || 0);
    ReportHistoryPerfCache.examFingerprintByExam.set(exam, {
        rows,
        length: rows.length,
        fingerprint
    });
    return fingerprint;
}

function getReportDomCache() {
    const resultEl = document.getElementById('single-report-result');
    const container = document.getElementById('report-card-capture-area');
    const compareSection = document.getElementById('student-multi-period-compare-section');
    const signature = [
        !!resultEl,
        !!container,
        !!compareSection,
        container?.dataset?.reportHtmlCacheKey || ''
    ].join('::');
    if (ReportHistoryPerfCache.domCache && ReportHistoryPerfCache.domSignature === signature) {
        return ReportHistoryPerfCache.domCache;
    }
    ReportHistoryPerfCache.domSignature = signature;
    ReportHistoryPerfCache.domCache = { resultEl, container, compareSection };
    return ReportHistoryPerfCache.domCache;
}

function getReportStudentIdentity(student) {
    if (!student || typeof student !== 'object') return '';
    return [
        String(student.school || '').trim(),
        typeof normalizeJumpClass === 'function' ? normalizeJumpClass(student.class) : String(student.class || '').trim(),
        String(student.name || '').trim(),
        String(student.examNo || student.id || '').trim()
    ].join('|');
}

function getStudentReportPerformanceRuntime() {
    return window.StudentReportPerformance && typeof window.StudentReportPerformance === 'object'
        ? window.StudentReportPerformance
        : null;
}

function getReportSubjectSortedScores(examKey, examData, subject) {
    const key = `${String(examKey || '').trim()}::${String(subject || '').trim()}::${Array.isArray(examData) ? examData.length : 0}`;
    if (ReportHistoryPerfCache.subjectScores.has(key)) {
        return ReportHistoryPerfCache.subjectScores.get(key);
    }
    const scores = (Array.isArray(examData) ? examData : [])
        .map(s => s.scores?.[subject])
        .filter(v => typeof v === 'number')
        .sort((a, b) => b - a);
    ReportHistoryPerfCache.subjectScores.set(key, scores);
    if (ReportHistoryPerfCache.subjectScores.size > 120) {
        const firstKey = ReportHistoryPerfCache.subjectScores.keys().next().value;
        ReportHistoryPerfCache.subjectScores.delete(firstKey);
    }
    return scores;
}

function normalizeReportHistoryName(value) {
    return String(value || "").trim().replace(/\s+/g, "");
}

function normalizeReportHistoryClass(value) {
    return String(value || "").trim().replace(/[班级\(\)\.\-gradeclass]/gi, "");
}

function isReportHistoryStudentMatch(row, targetName, targetClass, targetSchool) {
    const sObj = row?.student || row || {};
    if (sObj.school && targetSchool && !areSchoolNamesEquivalent(sObj.school, targetSchool)) return false;
    if (normalizeReportHistoryName(sObj.name) !== targetName) return false;
    const histClass = normalizeReportHistoryClass(sObj.class);
    if (histClass === targetClass) return true;
    const numC1 = histClass.replace(/0/g, '');
    const numC2 = targetClass.replace(/0/g, '');
    return numC1 === numC2 && numC1.length > 0;
}

function getCachedHistoryExamStudent(examData, student, examFingerprint = '') {
    const rows = Array.isArray(examData) ? examData : [];
    if (!rows.length || !student) return null;
    const targetSchool = student.school;
    const targetName = normalizeReportHistoryName(student.name);
    const targetClass = normalizeReportHistoryClass(student.class);
    const lookupKey = [
        String(examFingerprint || '').trim(),
        rows.length,
        String(targetSchool || '').trim(),
        targetClass,
        targetName,
        String(student.id || student.examNo || student.studentId || '').trim()
    ].join('::');
    if (ReportHistoryPerfCache.examStudentLookup.has(lookupKey)) {
        return ReportHistoryPerfCache.examStudentLookup.get(lookupKey) || null;
    }
    const found = window.RankingDataService && typeof window.RankingDataService.findStudent === 'function'
        ? window.RankingDataService.findStudent(rows, {
            name: student.name,
            school: targetSchool,
            className: student.class
        })
        : rows.find(p => isReportHistoryStudentMatch(p, targetName, targetClass, targetSchool));
    ReportHistoryPerfCache.examStudentLookup.set(lookupKey, found || null);
    if (ReportHistoryPerfCache.examStudentLookup.size > 240) {
        const firstKey = ReportHistoryPerfCache.examStudentLookup.keys().next().value;
        ReportHistoryPerfCache.examStudentLookup.delete(firstKey);
    }
    return found || null;
}

function getStudentReportSelectedExamIds() {
    const signature = ['reportCompareExam1', 'reportCompareExam2', 'reportCompareExam3']
        .map(id => `${id}:${String(document.getElementById(id)?.value || '').trim()}`)
        .join('|');
    if (ReportHistoryPerfCache.selectedExamIdsSignature === signature) {
        return ReportHistoryPerfCache.selectedExamIds.slice();
    }
    const ids = [];
    ['reportCompareExam1', 'reportCompareExam2', 'reportCompareExam3'].forEach(id => {
        const value = String(document.getElementById(id)?.value || '').trim();
        if (value) ids.push(value);
    });
    ReportHistoryPerfCache.selectedExamIdsSignature = signature;
    ReportHistoryPerfCache.selectedExamIds = ids;
    return ids;
}

function buildStudentReportCacheKey(student, mode = 'FULL', selectedExamIds = null, effectiveCurrentExamId = '') {
    const selected = Array.isArray(selectedExamIds) ? selectedExamIds : getStudentReportSelectedExamIds();
    const examId = String(effectiveCurrentExamId || (typeof getEffectiveCurrentExamId === 'function' ? getEffectiveCurrentExamId() : '') || '').trim();
    const fingerprint = getCurrentReportDataFingerprint();
    return [
        getReportStudentIdentity(student),
        String(mode || 'FULL').trim(),
        examId,
        fingerprint,
        selected.map(String).sort().join(',')
    ].join('::');
}

function buildStudentReportSelectionSignature(selectedExamIds = null, effectiveCurrentExamId = '') {
    const selected = Array.isArray(selectedExamIds) ? selectedExamIds : getStudentReportSelectedExamIds();
    const examId = String(effectiveCurrentExamId || (typeof getEffectiveCurrentExamId === 'function' ? getEffectiveCurrentExamId() : '') || '').trim();
    return [
        examId,
        selected.map(id => String(id || '').trim()).filter(Boolean).sort().join(',')
    ].join('::');
}

function clearStudentReportCache(student) {
    const runtime = getStudentReportPerformanceRuntime();
    if (!runtime || typeof runtime.clear !== 'function') return;
    const identity = getReportStudentIdentity(student);
    runtime.clear(identity || '');
}

function examKeyEq(a, b) {
    const fn = window.isExamKeyEquivalentForCompare;
    if (typeof fn === 'function') return fn(a, b);
    const v = k => { const p = String(k || '').trim().replace(/\s+/g, '_').toLowerCase().split('_').filter(Boolean); return [p.join('_'), p.slice(4).join('_'), p.slice(3).join('_')].filter(Boolean); };
    return v(a).some(key => v(b).includes(key));
}

function applyCloudStudentHistoryToPrevData(stu, historyRes, selectedReportExamIds = [], effectiveCurrentExamId = '') {
    if (!historyRes || !historyRes.success || !Array.isArray(historyRes.data) || historyRes.data.length === 0) return 0;
    const selectedForCompare = Array.isArray(selectedReportExamIds) ? selectedReportExamIds : [];
    const rows = historyRes.data.filter(h => {
        const hid = String(h.examFullKey || h.examId || '').trim();
        if (!hid) return false;
        if (selectedForCompare.length > 0) {
            const inSelected = selectedForCompare.some(id => examKeyEq(hid, id));
            if (!inSelected) return false;
        }
        return !effectiveCurrentExamId || !examKeyEq(hid, effectiveCurrentExamId);
    }).map(h => ({
        examId: h.examId,
        examFullKey: h.examFullKey,
        examLabel: String(h.examLabel || h.examId || h.examFullKey || '').replace(/_/g, ' '),
        fingerprint: h.fingerprint || '',
        updatedAt: h.updatedAt || new Date().toISOString(),
        student: {
            name: stu.name,
            class: stu.class,
            school: stu.school || '',
            total: Number(h.total) || 0,
            scores: h.scores || {},
            ranks: Object.assign({
                    total: {
                        class: h.rankClass || '-',
                        school: h.rankSchool || '-',
                        township: h.rankTown || '-',
                        county: h.rankCounty || h.subjectRanks?.total?.county || '-'
                    }
                }, Object.fromEntries(
                    Object.entries(h.subjectRanks || {}).map(([sub, ranks]) => [sub, {
                        class: ranks?.class ?? '-',
                        school: ranks?.school ?? '-',
                        township: ranks?.township ?? '-',
                        county: ranks?.county ?? '-'
                    }])
                )),
            updatedAt: h.updatedAt || new Date().toISOString()
        },
        percentiles: h.percentiles || {}
    }));
    if (rows.length > 0) {
        setPrevDataState(rows);
        ReportHistoryPerfCache.historyByStudent.clear();
        ReportHistoryPerfCache.lastChartScheduleKey = '';
        clearStudentReportCache(stu);
    }
    return historyRes.data.length;
}

function getCachedStudentReportHistory(stu, selectedExamIds = null, effectiveCurrentExamId = '') {
    const key = [
        getReportStudentIdentity(stu),
        getCurrentReportDataFingerprint(),
        buildStudentReportSelectionSignature(selectedExamIds, effectiveCurrentExamId)
    ].join('::');
    if (ReportHistoryPerfCache.historyByStudent.has(key)) {
        return ReportHistoryPerfCache.historyByStudent.get(key);
    }
    const history = typeof getStudentExamHistory === 'function' ? getStudentExamHistory(stu) : [];
    ReportHistoryPerfCache.historyByStudent.set(key, history);
    if (ReportHistoryPerfCache.historyByStudent.size > 60) {
        const firstKey = ReportHistoryPerfCache.historyByStudent.keys().next().value;
        ReportHistoryPerfCache.historyByStudent.delete(firstKey);
    }
    return history;
}

function hasCachedReportHistoryForSelectedExams(stu, selectedReportExamIds = [], effectiveCurrentExamId = '') {
    return getMissingReportHistoryExamIds(stu, selectedReportExamIds, effectiveCurrentExamId).length === 0;
}

function getMissingReportHistoryExamIds(stu, selectedReportExamIds = [], effectiveCurrentExamId = '') {
    const selectedIds = getHistoricalReportExamIds(selectedReportExamIds, effectiveCurrentExamId);
    if (!selectedIds.length) return [];

    const history = getCachedStudentReportHistory(stu, selectedReportExamIds, effectiveCurrentExamId);
    if (!Array.isArray(history) || !history.length) return selectedIds;
    return selectedIds.filter(selectedId => !history.some(item => {
        const examKey = String(item?.examFullKey || item?.examId || '').trim();
        return examKey && examKeyEq(examKey, selectedId);
    }));
}

function getHistoricalReportExamIds(selectedReportExamIds = [], effectiveCurrentExamId = '') {
    return (Array.isArray(selectedReportExamIds) ? selectedReportExamIds : [])
        .map(id => String(id || '').trim())
        .filter(Boolean)
        .filter(id => !effectiveCurrentExamId || !examKeyEq(id, effectiveCurrentExamId));
}

async function refreshRenderedStudentReportAfterHistory(stu, token) {
    if (token !== __reportQueryToken) return;
    const currentStudent = typeof readCurrentReportStudentState === 'function' ? readCurrentReportStudentState() : null;
    if (getReportStudentIdentity(currentStudent || {}) !== getReportStudentIdentity(stu)) return;

    const container = document.getElementById('report-card-capture-area');
    if (!container || typeof renderSingleReportCardHTML !== 'function') return;
    try {
        container.classList.add('student-report-canvas-full');
        const reportCache = getStudentReportPerformanceRuntime();
        const selectedIds = getStudentReportSelectedExamIds();
        const reportKey = buildStudentReportCacheKey(stu, 'FULL', selectedIds, selectedIds[selectedIds.length - 1] || getEffectiveCurrentExamId());
        const history = getCachedStudentReportHistory(stu, selectedIds, selectedIds[selectedIds.length - 1] || getEffectiveCurrentExamId());
        let reportHtml = reportCache?.getReportHtml?.(reportKey);
        if (!reportHtml) {
            reportHtml = await Promise.resolve(renderSingleReportCardHTML(stu, 'FULL', { reportExamHistory: history }));
            reportCache?.setReportHtml?.(reportKey, reportHtml);
        }
        if (token !== __reportQueryToken) return;
        const nextReportHtml = typeof reportHtml === 'string' ? reportHtml : '';
        if (container.dataset.reportHtmlCacheKey !== reportKey) {
            container.innerHTML = nextReportHtml;
            container.dataset.reportHtmlCacheKey = reportKey;
            container.dataset.reportChartCacheKey = '';
            enhanceStudentReportMetrics(container);
        }
        window.setTimeout(() => {
            if (token !== __reportQueryToken) return;
            scheduleStudentReportCharts(stu, history);
        }, 80);
    } catch (error) {
        console.warn('[doQuery] 云端历史补齐后刷新报告失败:', error);
    }
}

function hydrateStudentReportHistoryInBackground(stu, selectedReportExamIds, effectiveCurrentExamId, token) {
    if (!stu || !window.CloudManager || typeof window.CloudManager.fetchStudentExamHistory !== 'function') return;
    const historicalExamIds = getHistoricalReportExamIds(selectedReportExamIds, effectiveCurrentExamId);
    if (!historicalExamIds.length) return;
    const missingHistoricalExamIds = getMissingReportHistoryExamIds(stu, historicalExamIds, effectiveCurrentExamId);
    if (!missingHistoricalExamIds.length) return;
    const hydrateKey = `${getReportStudentIdentity(stu)}::${missingHistoricalExamIds.join('|')}::${effectiveCurrentExamId || ''}`;
    if (ReportHistoryPerfCache.hydratingKeys.has(hydrateKey)) return;
    ReportHistoryPerfCache.hydratingKeys.add(hydrateKey);
    const task = async () => {
        try {
            const still = () => document.getElementById('report-generator')?.classList.contains('active') && token === __reportQueryToken;
            if (!still()) return;
            const ready = (
                (typeof window.CloudManager.ensureClientReady === 'function' && await window.CloudManager.ensureClientReady({ silent: true })) ||
                (typeof window.CloudManager.check === 'function' && window.CloudManager.check(true))
            );
            if (!ready || token !== __reportQueryToken) return;
            if (window.UI) UI.toast('正在后台同步历史成绩...', 'info');
            const historyRes = await window.CloudManager.fetchStudentExamHistory(stu, {
                examIds: missingHistoricalExamIds,
                currentExamId: effectiveCurrentExamId,
                background: true
            });
            if (!still()) return;
            const loadedCount = applyCloudStudentHistoryToPrevData(stu, historyRes, missingHistoricalExamIds, effectiveCurrentExamId);
            if (!loadedCount || token !== __reportQueryToken) return;
            if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
            if (window.UI) UI.toast(`已后台匹配 ${loadedCount} 次历史成绩`, 'success');
            await refreshRenderedStudentReportAfterHistory(stu, token);
        } catch (e) {
            console.warn('[doQuery] 云端历史后台获取失败:', e);
        } finally {
            ReportHistoryPerfCache.hydratingKeys.delete(hydrateKey);
        }
    };
    if (window.SystemPerformance && typeof window.SystemPerformance.scheduleTask === 'function') {
        window.SystemPerformance.scheduleTask(`report-history-hydrate:${hydrateKey}`, task, {
            delay: 4800,
            idle: true,
            timeout: 9000
        });
    } else if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
        window.setTimeout(() => {
            window.SystemPerformance.scheduleIdle(task, { timeout: 9000 });
        }, 4800);
    } else {
        window.setTimeout(task, 4800);
    }
}

function syncReportCompareTargetForQuery(stu) {
    if (typeof clearCloudStudentCompareContext === 'function') {
        clearCloudStudentCompareContext();
    } else if (typeof clearCloudStudentCompareContextState === 'function') {
        clearCloudStudentCompareContextState();
    } else if (typeof setCloudStudentCompareContextState === 'function') {
        setCloudStudentCompareContextState(null);
    } else {
        window.CLOUD_STUDENT_COMPARE_CONTEXT = null;
    }

    if (typeof setCloudCompareTarget === 'function') {
        setCloudCompareTarget(stu);
    } else if (typeof setCloudCompareTargetState === 'function') {
        setCloudCompareTargetState(stu);
    } else {
        window.CLOUD_COMPARE_TARGET = {
            name: String(stu?.name || '').trim(),
            class: String(stu?.class || '').trim(),
            school: String(stu?.school || '').trim()
        };
    }
}

function warmStudentCompareRuntimeForReport(stu) {
    if (typeof setCloudCompareTarget === 'function') setCloudCompareTarget(stu);
}


async function doQuery(targetStudent = null) {
    const queryToken = ++__reportQueryToken;
    const name = String(document.getElementById('inp-name')?.value || targetStudent?.name || '').trim();
    const sch = String(document.getElementById('sel-school')?.value || targetStudent?.school || '').trim();
    const cls = String(document.getElementById('sel-class')?.value || targetStudent?.class || '').trim();
    const user = getCurrentUser();

    let stu = targetStudent && typeof targetStudent === 'object' ? targetStudent : null;
    if (!stu) {
        if (window.RankingDataService && typeof window.RankingDataService.findStudent === 'function') {
            stu = window.RankingDataService.findStudent(RAW_DATA, {
                name,
                school: sch,
                className: (cls === '--请先选择学校--') ? '' : cls
            });
        } else {
            const schoolRecord = getAppSchoolRecord(sch);
            stu = (schoolRecord?.students || []).find(s => (
                String(s.name || '').trim() === name
                && (cls === '--请先选择学校--' || !cls || normalizeJumpClass(s.class) === normalizeJumpClass(cls))
            ));
        }
    }
    if (!stu && name) {
        stu = findStudentForJump(name, sch, cls);
    }
    if (!stu) return alert("未找到该学生");
    syncReportControlsToStudent(stu);
    const reportQueryMode = PermissionPolicy.isClassTeacher(user) ? 'homeroom' : 'teaching';
    if (!PermissionPolicy.canQueryStudent(user, stu, { mode: reportQueryMode })) return alert("当前角色没有权限查询该学生");

    const selectedReportExamIds = getSelectedReportCompareExamIds();
    const effectiveCurrentExamId = selectedReportExamIds[selectedReportExamIds.length - 1] || getEffectiveCurrentExamId();
    if (effectiveCurrentExamId) {
        CURRENT_EXAM_ID = effectiveCurrentExamId;
        writeWorkspaceExamId(effectiveCurrentExamId);
    }

    syncReportCompareTargetForQuery(stu);
    setCurrentReportStudentState(stu);
    warmStudentCompareRuntimeForReport(stu);

    const reportCacheKey = buildStudentReportCacheKey(stu, 'FULL', selectedReportExamIds, effectiveCurrentExamId);
    const renderedQueryKey = `${reportCacheKey}::${getReportStudentIdentity(stu)}`;
    if (!targetStudent
        && ReportHistoryPerfCache.inflightReportQueryKey === renderedQueryKey
        && ReportHistoryPerfCache.inflightReportQueryPromise) {
        return ReportHistoryPerfCache.inflightReportQueryPromise;
    }

    const executeReportQuery = async () => {
        const { resultEl, container } = getReportDomCache();
        let reportHistoryForQuery = null;
        const getReportHistoryForQuery = () => {
            if (!reportHistoryForQuery) reportHistoryForQuery = getCachedStudentReportHistory(stu, selectedReportExamIds, effectiveCurrentExamId);
            return reportHistoryForQuery;
        };

        if (resultEl && container) {
            resultEl.classList.remove('hidden');
            try {
                container.classList.add('student-report-canvas-full');
                const reportCache = getStudentReportPerformanceRuntime();
                if (!targetStudent
                    && ReportHistoryPerfCache.lastRenderedReportQueryKey === renderedQueryKey
                    && container.dataset.reportHtmlCacheKey === reportCacheKey
                    && String(container.innerHTML || '').trim()) {
                    scheduleStudentReportCharts(stu, getReportHistoryForQuery());
                    return;
                }
                let reportHtml = reportCache?.getReportHtml?.(reportCacheKey);
                if (!reportHtml) {
                    if (typeof window.ensureReportRenderRuntimeLoaded === 'function') {
                        try {
                            await window.ensureReportRenderRuntimeLoaded();
                        } catch (error) {
                            console.warn('Failed to load report render runtime before query:', error);
                        }
                    }
                    renderStudentReportSkeleton(container, stu);
                    reportHtml = await Promise.resolve(renderSingleReportCardHTML(stu, 'FULL', {
                        reportExamHistory: getReportHistoryForQuery()
                    }));
                    reportCache?.setReportHtml?.(reportCacheKey, reportHtml);
                }
                const nextReportHtml = typeof reportHtml === 'string' ? reportHtml : '';
                if (container.dataset.reportHtmlCacheKey !== reportCacheKey) {
                    container.innerHTML = nextReportHtml;
                    container.dataset.reportHtmlCacheKey = reportCacheKey;
                    container.dataset.reportChartCacheKey = '';
                    enhanceStudentReportMetrics(container);
                }
                ReportHistoryPerfCache.lastRenderedReportQueryKey = renderedQueryKey;
            } catch (e) {
                console.error('Render Report Error:', e);
                container.innerHTML = `<div style="color:red; padding:20px; text-align:left;"><h3 style="color:red">Rendering Error</h3><pre>${e.stack || e.message || e}</pre></div>`;
            }
        }

        const history = getReportHistoryForQuery();

        scheduleStudentReportCharts(stu, history);

        hydrateStudentReportHistoryInBackground(stu, selectedReportExamIds, effectiveCurrentExamId, queryToken);

        const strengthKey = `${getReportStudentIdentity(stu)}::${effectiveCurrentExamId || ''}`;
        scheduleStudentReportStrengthAnalysis(stu, strengthKey);

        const { compareSection } = getReportDomCache();
        if (compareSection && ReportHistoryPerfCache.lastCompareHiddenKey !== strengthKey) {
            ReportHistoryPerfCache.lastCompareHiddenKey = strengthKey;
            compareSection.style.display = 'none';
        }

        const reportScrollKey = `${getReportStudentIdentity(stu)}::${effectiveCurrentExamId || ''}::${selectedReportExamIds.join('|')}`;
        if (ReportHistoryPerfCache.lastScrollKey !== reportScrollKey) {
            ReportHistoryPerfCache.lastScrollKey = reportScrollKey;
            setTimeout(() => {
                const reportElement = document.getElementById('single-report-result');
                if (reportElement) {
                    reportElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 200);
        }
    };

    const queryPromise = executeReportQuery();
    if (!targetStudent) {
        ReportHistoryPerfCache.inflightReportQueryKey = renderedQueryKey;
        ReportHistoryPerfCache.inflightReportQueryPromise = queryPromise;
        try {
            return await queryPromise;
        } finally {
            if (ReportHistoryPerfCache.inflightReportQueryKey === renderedQueryKey) {
                ReportHistoryPerfCache.inflightReportQueryKey = '';
                ReportHistoryPerfCache.inflightReportQueryPromise = null;
            }
        }
    }
    return queryPromise;
}

// Moved to comparison-render-runtime.js (setSingleSelectOptions, MutualAid, Comparison, findPreviousRecord, getStudentExamHistory)
function getIndicatorContext() {
    const liveMeta = (typeof getExamMetaFromUI === 'function') ? (getExamMetaFromUI() || {}) : {};
    let archiveMeta = null;
    archiveMeta = readArchiveMeta();
    const hasLive = !!(liveMeta && (liveMeta.grade || liveMeta.type || liveMeta.year || liveMeta.term));
    const meta = hasLive ? liveMeta : (archiveMeta || liveMeta);
    const grade = String(meta?.grade || computeCohortGrade(CURRENT_COHORT_META, meta) || '');
    const type = meta?.type || '';
    return { grade, type, meta };
}

function isIndicatorPromptAllowed() {
    const ctx = getIndicatorContext();
    return ctx.grade === '9';
}

function isIndicatorAllowed() {
    return isIndicatorPromptAllowed();
}

function hasIndicatorScoreData() {
    if (!Array.isArray(RAW_DATA) || RAW_DATA.length === 0) return false;
    return RAW_DATA.some(row => Number.isFinite(Number(row?.total)));
}

function hasIndicatorCalcInputs() {
    const indicator = window.SYS_VARS?.indicator || {};
    const raw1 = indicator.ind1 || document.getElementById('dm_ind1_input')?.value || document.getElementById('ind1')?.value || '';
    const raw2 = indicator.ind2 || document.getElementById('dm_ind2_input')?.value || document.getElementById('ind2')?.value || '';
    const rank1 = parseInt(String(raw1).trim(), 10);
    const rank2 = parseInt(String(raw2).trim(), 10);
    const targetCount = window.TARGETS && typeof window.TARGETS === 'object'
        ? Object.keys(window.TARGETS).length
        : 0;
    return rank1 > 0 && rank2 > 0 && targetCount > 0;
}

function isIndicatorCalcAllowed() {
    const ctx = getIndicatorContext();
    return ctx.grade === '9' && hasIndicatorScoreData();
}

function updateIndicatorUIState() {
    const promptAllowed = isIndicatorPromptAllowed();
    const calcAllowed = isIndicatorCalcAllowed();
    const btn = document.getElementById('btn-indicator-calc');
    if (btn) {
        btn.disabled = !calcAllowed;
        if (!promptAllowed) btn.title = '仅 9 年级可使用指标生功能';
        else if (!calcAllowed) btn.title = '请先加载当前考试成绩';
        else if (!hasIndicatorCalcInputs()) btn.title = '参数未补齐，点击后可按提示继续设置';
        else btn.title = '重新计算当前考试的指标生得分';
    }
    const paramsArea = document.getElementById('dm-params-area');
    if (paramsArea) paramsArea.style.display = promptAllowed ? 'block' : 'none';
    const i1 = document.getElementById('dm_ind1_input');
    const i2 = document.getElementById('dm_ind2_input');
    if (i1) i1.disabled = !promptAllowed;
    if (i2) i2.disabled = !promptAllowed;
    const tip = document.getElementById('dm-params-tip');
    if (tip) {
        let tipText = '';
        if (!promptAllowed) tipText = '提示：当前仅 9 年级显示并使用指标生参数。';
        else if (!calcAllowed) tipText = '提示：请先加载当前考试成绩，再开始计算。';
        else if (!hasIndicatorCalcInputs()) tipText = '提示：请先补齐划线名次和目标人数，再点击“开始计算”。';
        tip.textContent = tipText;
        tip.style.display = tipText ? 'block' : 'none';
    }
}

function waitForIndicatorCalcInputs(timeoutMs = 6000) {
    const deadline = Date.now() + Math.max(0, Number(timeoutMs) || 0);
    return new Promise(resolve => {
        const tick = () => {
            updateIndicatorUIState();
            if (!isIndicatorCalcAllowed()) {
                resolve(false);
                return;
            }
            if (hasIndicatorCalcInputs()) {
                resolve(true);
                return;
            }
            if (Date.now() >= deadline) {
                resolve(false);
                return;
            }
            setTimeout(tick, 160);
        };
        tick();
    });
}

const IndicatorCloudInputState = { promise: null, key: '' };

function getIndicatorWorkspaceKey() {
    const readCohort = typeof readWorkspaceCohortId === 'function' ? readWorkspaceCohortId : () => '';
    const readExam = typeof readWorkspaceExamId === 'function' ? readWorkspaceExamId : () => '';
    return [
        String(CURRENT_COHORT_ID || window.CURRENT_COHORT_ID || readCohort() || '').trim(),
        String(CURRENT_EXAM_ID || window.CURRENT_EXAM_ID || readExam() || '').trim()
    ].join('::');
}

function setIndicatorSyncTip(text = '') {
    const tip = document.getElementById('dm-params-tip');
    if (!tip || !isIndicatorPromptAllowed()) return;
    if (text) {
        tip.textContent = text;
        tip.style.display = 'block';
        return;
    }
    updateIndicatorUIState();
}

async function ensureIndicatorWorkspaceFromCloud(reason = 'indicator-refresh', timeoutMs = 12000) {
    if (hasIndicatorCalcInputs() && isIndicatorCalcAllowed()) return true;
    if (!isIndicatorPromptAllowed() || typeof loadCloudData !== 'function') return false;
    const currentUser = (window.Auth && window.Auth.currentUser) || null;
    if (currentUser?.local_only) return false;

    const key = getIndicatorWorkspaceKey();
    if (IndicatorCloudInputState.promise && IndicatorCloudInputState.key === key) {
        return IndicatorCloudInputState.promise;
    }

    setIndicatorSyncTip('正在从云端同步指标生参数和目标人数...');
    IndicatorCloudInputState.key = key;
    IndicatorCloudInputState.promise = Promise.race([
        Promise.resolve(loadCloudData()),
        new Promise((resolve) => setTimeout(() => resolve(false), Math.max(3000, Number(timeoutMs) || 12000)))
    ])
        .then(() => {
            syncRuntimeStateToWindow();
            updateIndicatorUIState();
            const ready = hasIndicatorCalcInputs() && isIndicatorCalcAllowed();
            if (!ready) {
                console.warn(`[Indicator] cloud workspace still missing inputs after ${reason}`, {
                    rawData: Array.isArray(RAW_DATA) ? RAW_DATA.length : 0,
                    targetCount: window.TARGETS && typeof window.TARGETS === 'object' ? Object.keys(window.TARGETS).length : 0,
                    indicator: window.SYS_VARS?.indicator || {}
                });
            }
            return ready;
        })
        .catch((error) => {
            console.warn(`[Indicator] 云端补载失败 (${reason}):`, error);
            return false;
        })
        .finally(() => {
            IndicatorCloudInputState.promise = null;
            IndicatorCloudInputState.key = '';
            if (hasIndicatorCalcInputs() && isIndicatorCalcAllowed()) setIndicatorSyncTip('');
        });
    return IndicatorCloudInputState.promise;
}

function refreshIndicatorResults(isSilent = true, options = {}) {
    updateIndicatorUIState();
    const waitForInputs = !!(options && options.waitForInputs);
    if (waitForInputs && isIndicatorPromptAllowed() && (!isIndicatorCalcAllowed() || !hasIndicatorCalcInputs())) {
        const timeoutMs = options.timeoutMs || 6000;
        return ensureIndicatorWorkspaceFromCloud('module-enter', Math.max(9000, timeoutMs)).then(() => {
            updateIndicatorUIState();
            if (!isIndicatorCalcAllowed()) return [];
            if (hasIndicatorCalcInputs()) {
                const result = calcIndicators(isSilent);
                return Array.isArray(result) ? result : [];
            }
            return waitForIndicatorCalcInputs(timeoutMs);
        }).then((ready) => {
            if (Array.isArray(ready)) return ready;
            if (!ready) return [];
            const result = calcIndicators(isSilent);
            return Array.isArray(result) ? result : [];
        });
    }
    if (!isIndicatorCalcAllowed() || !hasIndicatorCalcInputs()) return [];
    const result = calcIndicators(isSilent);
    return Array.isArray(result) ? result : [];
}

const IndicatorAutoScoreState = { token: 0 };

function scheduleIndicatorAutoScoreAfterDataReady(reason = 'data-ready') {
    if (typeof refreshIndicatorResults !== 'function') return;
    const token = ++IndicatorAutoScoreState.token;
    const run = () => {
        if (token !== IndicatorAutoScoreState.token) return;
        if (typeof isIndicatorCalcAllowed === 'function' && !isIndicatorCalcAllowed()) return;

        Promise.resolve(refreshIndicatorResults(true, { waitForInputs: true, timeoutMs: 7000 }))
            .then((rows) => {
                if (token !== IndicatorAutoScoreState.token) return;
                if (!Array.isArray(rows) || rows.length === 0) {
                    if (typeof updateIndicatorUIState === 'function') updateIndicatorUIState();
                    return;
                }
                if (typeof calcSummary === 'function') calcSummary(true);
                appDebug(`[Indicator] auto-scored after ${reason}: ${rows.length} school rows`);
            })
            .catch((error) => {
                console.warn('[Indicator] 自动补算失败:', error);
            });
    };
    const scheduleIdle = window.requestIdleCallback
        ? (task) => window.requestIdleCallback(task, { timeout: 2500 })
        : (task) => setTimeout(task, 240);
    setTimeout(() => scheduleIdle(run), 120);
}

function ensureIndicatorTargetMatchPanel() {
    const table = document.getElementById('tb-indicator');
    if (!table) return null;
    let panel = document.getElementById('indicator-target-match-panel');
    if (!panel) {
        panel = document.createElement('div');
        panel.id = 'indicator-target-match-panel';
        panel.style.marginTop = '12px';
        panel.style.border = '1px solid #dbeafe';
        panel.style.borderRadius = '10px';
        panel.style.background = '#f8fbff';
        const wrap = table.closest('.table-wrap') || table.parentElement;
        if (wrap?.parentNode) wrap.parentNode.insertBefore(panel, wrap.nextSibling);
    }
    return panel;
}

function clearIndicatorTargetMatchPanel() {
    const panel = document.getElementById('indicator-target-match-panel');
    if (panel) {
        panel.innerHTML = '';
        panel.style.display = 'none';
    }
}

function renderIndicatorTargetMatchPanel(calcData, line1, line2) {
    const panel = ensureIndicatorTargetMatchPanel();
    if (!panel) return;
    if (!Array.isArray(calcData) || !calcData.length) {
        clearIndicatorTargetMatchPanel();
        return;
    }

    const rows = [...calcData]
        .sort((a, b) => a.rank - b.rank)
        .map((d) => {
            const status = d.invalidTarget
                ? '<span style="color:#b45309;font-weight:700;">目标异常</span>'
                : (d.missingTarget
                    ? '<span style="color:#dc2626;font-weight:700;">未匹配</span>'
                    : '<span style="color:#15803d;font-weight:700;">正常</span>');
            return `<tr>
                <td>${d.rank}</td>
                <td>${d.name}</td>
                <td>${d.targetKey || '-'}</td>
                <td>${d.studentCount}</td>
                <td>${d.rawT1 || 0} / ${d.rawT2 || 0}</td>
                <td>${d.t1 || 0} / ${d.t2 || 0}</td>
                <td>${status}</td>
            </tr>`;
        }).join('');

    panel.style.display = 'block';
    panel.innerHTML = `
        <div style="padding:10px 12px;border-bottom:1px solid #dbeafe;color:#1e3a8a;font-weight:700;">
            目标人数匹配明细（参考线：指标一 ${line1}，指标二 ${line2}）
        </div>
        <div class="table-wrap" style="max-height:260px;overflow:auto;">
            <table>
                <thead>
                    <tr>
                        <th>排名</th>
                        <th>学校</th>
                        <th>匹配目标键</th>
                        <th>学生数</th>
                        <th>原始目标(t1/t2)</th>
                        <th>参与计算(t1/t2)</th>
                        <th>状态</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        </div>`;
}

const IndicatorCalcPerfCache = { signature: '', rows: [] };

function cloneIndicatorCalcRows(rows) {
    return Array.isArray(rows) ? rows.map((row) => ({ ...row })) : [];
}

function normalizeIndicatorTargetNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : 0;
}

function buildIndicatorCalcSignature(rankLine1, rankLine2) {
    const targets = (typeof ensureNormalizedTargets === 'function')
        ? ensureNormalizedTargets()
        : (window.TARGETS || {});
    const targetSignature = Object.keys(targets || {})
        .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'))
        .map((name) => {
            const target = targets[name] || {};
            return `${String(name).trim()}:${normalizeIndicatorTargetNumber(target.t1)}:${normalizeIndicatorTargetNumber(target.t2)}`;
        })
        .join('|');
    return [
        CURRENT_EXAM_ID || '',
        window.__RAW_DATA_VERSION || 0,
        Array.isArray(RAW_DATA) ? RAW_DATA.length : 0,
        Object.keys(SCHOOLS || {}).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN')).join('|'),
        parseInt(rankLine1, 10) || 0,
        parseInt(rankLine2, 10) || 0,
        targetSignature
    ].join('::');
}

function calcIndicators(isSilent = false) {
    if (!isIndicatorPromptAllowed()) {
        clearIndicatorTargetMatchPanel();
        if (!isSilent && window.UI) UI.toast('仅 9 年级可使用指标生功能', 'warning');
        return [];
    }
    let val1 = window.SYS_VARS?.indicator?.ind1;
    let val2 = window.SYS_VARS?.indicator?.ind2;

    if (!val1) val1 = document.getElementById('dm_ind1_input')?.value;
    if (!val2) val2 = document.getElementById('dm_ind2_input')?.value;

    const r1 = parseInt(val1);
    const r2 = parseInt(val2);

    if (!r1 || !r2) {
        clearIndicatorTargetMatchPanel();
        if (!isSilent && confirm("❌ 检测到【划线名次】尚未设置！\n\n是否立即打开「教务数据综合控制台」进行设置？")) {
            DataManager.open(); // 打开弹窗
            DataManager.switchTab('params'); // 自动切换到参数设置Tab
        }
        return [];
    }

    if (!isIndicatorCalcAllowed()) {
        clearIndicatorTargetMatchPanel();
        if (window.UI) UI.toast('请先加载当前 9 年级考试成绩后再开始计算', 'warning');
        return [];
    }
    if (!isIndicatorCalcAllowed()) {
        clearIndicatorTargetMatchPanel();
        if (window.UI) UI.toast('仅 9 年级期中/期末考试可开始计算', 'warning');
        return;
    }

    if (!window.TARGETS || Object.keys(window.TARGETS).length === 0) {
        clearIndicatorTargetMatchPanel();
        if (!isSilent && confirm("❌ 检测到【目标人数】尚未导入！\n\n是否立即打开「教务数据综合控制台」进行导入？")) {
            DataManager.open(); // 打开弹窗
            DataManager.switchTab('targets'); // 自动切换到目标管理Tab
        }
        return [];
    }

    const calcSignature = buildIndicatorCalcSignature(r1, r2);
    if (
        isSilent
        && IndicatorCalcPerfCache.signature === calcSignature
        && Array.isArray(IndicatorCalcPerfCache.rows)
        && IndicatorCalcPerfCache.rows.length
    ) {
        const cachedRows = cloneIndicatorCalcRows(IndicatorCalcPerfCache.rows);
        window.INDICATOR_LAST_RESULT = cachedRows;
        window.__LAST_INDICATOR_CALC_DATA__ = cachedRows;
        return cachedRows;
    }

    clearIndicatorTargetMatchPanel();
    Object.values(SCHOOLS || {}).forEach(school => {
        if (school && typeof school === 'object') school.scoreInd = 0;
    });

    const townshipRows = (typeof filterRowsToTownshipSchools === 'function')
        ? filterRowsToTownshipSchools(RAW_DATA || [])
        : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    const allScores = townshipRows.map(s => s.total).filter(v => typeof v === 'number').sort((a, b) => b - a);
    if (!allScores.length) {
        clearIndicatorTargetMatchPanel();
        if (!isSilent && window.UI) UI.toast('暂无可计算的指标生成绩数据', 'warning');
        return [];
    }
    const line1Index = Math.min(Math.max(r1, 1), allScores.length) - 1;
    const line2Index = Math.min(Math.max(r2, 1), allScores.length) - 1;
    const line1 = allScores[line1Index];
    const line2 = allScores[line2Index];

    let calcData = [];
    let maxExcess1 = 0; // 指标一最大超额数
    let maxExcess2 = 0; // 指标二最大超额数

    const indicatorBuckets = buildIndicatorSchoolBuckets().filter((bucket) => (
        typeof isTownshipManagedSchool === 'function'
            ? isTownshipManagedSchool(bucket.name, Object.keys(SCHOOLS || {}))
            : true
    ));

    indicatorBuckets.forEach(s => {
        const scores = s.students.map(stu => stu.total);
        const reach1 = scores.filter(v => v >= line1).length; // 实际达标1
        const reach2 = scores.filter(v => v >= line2).length; // 实际达标2

        const targetInfo = getTargetConfigBySchool(s.name);
        const studentCount = scores.length;
        const rawT1 = normalizeIndicatorTargetNumber(targetInfo.value?.t1);
        const rawT2 = normalizeIndicatorTargetNumber(targetInfo.value?.t2);
        const invalidTarget1 = rawT1 > 0 && studentCount > 0 && rawT1 > studentCount;
        const invalidTarget2 = rawT2 > 0 && studentCount > 0 && rawT2 > studentCount;
        const t = {
            t1: invalidTarget1 ? 0 : rawT1,
            t2: invalidTarget2 ? 0 : rawT2
        };
        const invalidTarget = invalidTarget1 || invalidTarget2;
        const missingTarget = !targetInfo.key || (!t.t1 && !t.t2);

        let base1 = 0;
        if (t.t1 > 0) {
            if (reach1 < t.t1 * 0.6) base1 = 0;
            else if (reach1 >= t.t1) base1 = 30;
            else base1 = (reach1 / t.t1) * 30;
        }

        const excess1 = t.t1 > 0 ? Math.max(0, reach1 - t.t1) : 0;
        if (excess1 > maxExcess1) maxExcess1 = excess1;

        let base2 = 0;
        if (t.t2 > 0) {
            if (reach2 < t.t2 * 0.6) base2 = 0;
            else if (reach2 >= t.t2) base2 = 30;
            else base2 = (reach2 / t.t2) * 30;
        }

        const excess2 = t.t2 > 0 ? Math.max(0, reach2 - t.t2) : 0;
        if (excess2 > maxExcess2) maxExcess2 = excess2;

        calcData.push({
            name: s.name,
            rawNames: Array.isArray(s.rawNames) ? s.rawNames.slice() : [],
            targetKey: targetInfo.key || '',
            missingTarget,
            invalidTarget,
            studentCount,
            rawT1,
            rawT2,
            t1: t.t1, r1: reach1, base1: base1, excess1: excess1,
            t2: t.t2, r2: reach2, base2: base2, excess2: excess2
        });
    });

    calcData.forEach(d => {
        d.bonus1 = (maxExcess1 > 0) ? (d.excess1 / maxExcess1 * 5) : 0;
        d.score1 = d.base1 + d.bonus1;

        d.bonus2 = (maxExcess2 > 0) ? (d.excess2 / maxExcess2 * 5) : 0;
        d.score2 = d.base2 + d.bonus2;

        d.finalScore = d.score1 + d.score2;

        syncIndicatorScoreToSchools(d.name, d.finalScore);
        if (Array.isArray(d.rawNames)) {
            d.rawNames.forEach((rawName) => syncIndicatorScoreToSchools(rawName, d.finalScore));
        }
    });

    calcData.sort((a, b) => b.finalScore - a.finalScore).forEach((d, i) => d.rank = i + 1);

    const missingTargetSchools = calcData.filter(d => d.missingTarget).map(d => d.name);
    const invalidTargetSchools = calcData
        .filter(d => d.invalidTarget)
        .map(d => `${d.name}(人数${d.studentCount}, 目标${d.rawT1}/${d.rawT2})`);

    const thead = document.querySelector('#tb-indicator thead');
    thead.innerHTML = `
            <tr>
                <th rowspan="2">学校</th>
                <th colspan="4" style="background:#e0f2fe; color:#0369a1;">指标一 (参考分:${line1})</th>
                <th colspan="4" style="background:#fff7ed; color:#b45309;">指标二 (参考分:${line2})</th>
                <th rowspan="2">指标总分</th>
                <th rowspan="2">排名</th>
            </tr>
            <tr>
                <th>目标/达标</th><th>基础分</th><th>附加分</th><th>小计</th>
                <th>目标/达标</th><th>基础分</th><th>附加分</th><th>小计</th>
            </tr>
        `;

    let html = '';
    calcData.forEach(d => {
        const isMySchool = sameAppSchoolName(d.name, MY_SCHOOL);
        html += `
            <tr class="${isMySchool ? 'bg-highlight' : ''}">
                <td style="font-weight:bold;" title="${d.targetKey ? `目标人数匹配：${d.targetKey}` : '未匹配目标人数'}">${d.name}${d.invalidTarget ? '<span style="display:block; font-size:11px; color:#d97706; font-weight:600;">目标异常</span>' : (d.missingTarget ? '<span style="display:block; font-size:11px; color:#dc2626; font-weight:600;">未匹配目标人数</span>' : '')}</td>

                <!-- 指标一 -->
                <td>
                    <!-- 👇 新增点击事件：点击目标人数，分析如何达标 -->
                    <span class="clickable-num" style="color:#d97706; border-bottom:1px dashed #d97706;"
                          onclick="analyzeTargetGap('${d.name}', 'ind1', ${line1})"
                          title="点击分析：哪些学生差一点就达标？补哪科？">
                        ${d.t1 || (d.invalidTarget ? '异常' : (d.missingTarget ? '未匹配' : 0))}
                    </span> /
                    <strong class="clickable-num" onclick="handleIndicatorClick('${d.name}', 'ind1')">${d.r1}</strong>
                </td>
                <td>${d.base1.toFixed(2)}</td>
                <td style="color:${d.bonus1 > 0 ? 'green' : '#ccc'}; font-weight:bold;">${d.bonus1 > 0 ? '+' : ''}${d.bonus1.toFixed(2)}</td>
                <td style="background:#f0f9ff; font-weight:bold;">${d.score1.toFixed(2)}</td>

                <!-- 指标二 -->
                <td>

                    <span class="clickable-num" style="color:#d97706; border-bottom:1px dashed #d97706;"
                          onclick="analyzeTargetGap('${d.name}', 'ind2', ${line2})"
                          title="点击分析：哪些学生差一点就达标？补哪科？">
                        ${d.t2 || (d.invalidTarget ? '异常' : (d.missingTarget ? '未匹配' : 0))}
                    </span> /
                    <strong class="clickable-num" onclick="handleIndicatorClick('${d.name}', 'ind2')">${d.r2}</strong>
                </td>
                <td>${d.base2.toFixed(2)}</td>
                <td style="color:${d.bonus2 > 0 ? 'green' : '#ccc'}; font-weight:bold;">${d.bonus2 > 0 ? '+' : ''}${d.bonus2.toFixed(2)}</td>
                <td style="background:#fffaf0; font-weight:bold;">${d.score2.toFixed(2)}</td>

                <!-- 总分 -->
                <td class="text-red" style="font-size:1.1em; font-weight:bold;">${d.finalScore.toFixed(2)}</td>
                ${getRankHTML(d.rank)}
            </tr>`;
    });
    document.querySelector('#tb-indicator tbody').innerHTML = html;
    renderIndicatorTargetMatchPanel(calcData, line1, line2);
    const cachedCalcData = cloneIndicatorCalcRows(calcData);
    IndicatorCalcPerfCache.signature = calcSignature;
    IndicatorCalcPerfCache.rows = cachedCalcData;
    window.INDICATOR_LAST_RESULT = cachedCalcData;
    window.__LAST_INDICATOR_CALC_DATA__ = cachedCalcData;
    markSummaryDataChangedIfDependencyChanged(
        'indicator',
        buildSummaryDependencySignature('indicator', calcData),
        '指标生核算结果已更新，请重新生成总排名。'
    );

    if (!isSilent && window.UI) {
        UI.toast("✅ 指标生核算完成 (含附加分)", "success");
    }
    if (!isSilent && missingTargetSchools.length && window.UI) {
        UI.toast(`⚠️ ${missingTargetSchools.length} 所学校未匹配到目标人数，指标基础分已按 0 分处理`, 'warning');
    }
    if (!isSilent && invalidTargetSchools.length && window.UI) {
        UI.toast(`⚠️ 以下学校目标人数异常（大于学生总数），已按未匹配处理：${invalidTargetSchools.join('、')}`, 'warning');
    }
    return calcData;
}

function analyzeTargetGap(schoolName, type, lineScore) {
    const schoolStudents = getEquivalentSchoolStudents(schoolName);
    if (!schoolStudents.length) return;

    const targetConfig = getTargetConfigBySchool(schoolName).value || { t1: 0, t2: 0 };
    const targetCount = type === 'ind1' ? parseInt(targetConfig.t1) : parseInt(targetConfig.t2);

    if (!targetCount) return alert(`未找到 ${schoolName} 的目标设定，请先导入目标人数Excel。`);

    const allStudents = [...schoolStudents].sort((a, b) => b.total - a.total);
    const reached = allStudents.filter(s => s.total >= lineScore);
    const below = allStudents.filter(s => s.total < lineScore);

    const currentCount = reached.length;
    const gap = targetCount - currentCount; // 缺口人数

    const buffer = Math.ceil(targetCount * 0.1) || 5;

    let countToFetch = 0;
    let strategyText = "";

    if (gap > 0) {
        countToFetch = gap + buffer;
        strategyText = `当前差 <strong style="color:red">${gap}</strong> 人达标。已为您筛选最接近目标的 <strong>${countToFetch}</strong> 名潜力生（含 ${buffer} 名保险备份）。`;
    } else {
        countToFetch = buffer;
        strategyText = `当前已达标 (超 ${Math.abs(gap)} 人)。建议继续关注线下前 <strong>${countToFetch}</strong> 名学生，防止上线生波动下滑。`;
    }

    let candidates = below.slice(0, countToFetch);

    if (candidates.length === 0) {
        return alert("线下没有更多学生可供挖掘了。");
    }

    const gradeStatsRows = (typeof filterRowsToTownshipSchools === 'function')
        ? filterRowsToTownshipSchools(RAW_DATA || [])
        : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    const gradeStats = {};
    SUBJECTS.forEach(sub => {
        const allScores = gradeStatsRows.map(s => s.scores[sub]).filter(v => typeof v === 'number');
        gradeStats[sub] = allScores.reduce((a, b) => a + b, 0) / (allScores.length || 1);
    });

    candidates = candidates.map(s => {
        const scoreGap = lineScore - s.total;

        let validSubjects = SUBJECTS;
        if (CONFIG && Array.isArray(CONFIG.totalSubs)) {
            validSubjects = CONFIG.totalSubs;
        }

        const getSubWithTeacher = (sub) => {
            const teacherKey = `${s.class}_${sub}`;
            let teacher = TEACHER_MAP[teacherKey];
            if (teacher) {
                const surname = teacher.charAt(0);
                return `${sub}<small style="color:#666; font-size:0.9em;">(${surname}师)</small>`;
            }
            return sub;
        };

        let allDiffs = [];  // 存储所有科目差值 (用于挖掘潜力)
        let hardWeakness = []; // 存储明显弱项 (低于均分5分)

        validSubjects.forEach(sub => {
            if (s.scores[sub] !== undefined) {
                const diff = s.scores[sub] - gradeStats[sub];
                const item = { name: sub, diff: diff };

                allDiffs.push(item);

                if (diff < -5) {
                    hardWeakness.push(item);
                }
            }
        });

        allDiffs.sort((a, b) => a.diff - b.diff);
        hardWeakness.sort((a, b) => a.diff - b.diff);

        let worstSubName = "";
        let worstSubDiff = "";

        if (hardWeakness.length > 0) {
            const targets = hardWeakness.slice(0, 2);

            worstSubName = targets.map(t => getSubWithTeacher(t.name)).join("、");
            worstSubDiff = targets.map(t => t.diff.toFixed(1)).join(" / ");
        } else {
            const targets = allDiffs.slice(0, 2);

            if (targets.length > 0) {
                worstSubName = "<span style='font-size:10px; color:#666; border:1px solid #ccc; padding:0 2px; border-radius:2px; margin-right:2px;'>潜力</span>" +
                    targets.map(t => getSubWithTeacher(t.name)).join("、");

                worstSubDiff = targets.map(t => (t.diff > 0 ? '+' : '') + t.diff.toFixed(1)).join(" / ");
            } else {
                worstSubName = "数据不足";
                worstSubDiff = "-";
            }
        }

        return {
            name: s.name,
            class: s.class,
            total: s.total,
            scoreGap: scoreGap, // 距离目标的总分差距
            worstSub: worstSubName, // 建议学科 (已带老师名)
            worstDiff: worstSubDiff // 与年级均分差
        };
    });

    const typeName = type === 'ind1' ? '指标一' : '指标二';
    const title = `${schoolName} - ${typeName} 冲刺名单 (目标:${targetCount}人)`;

    let html = `
            <div class="info-bar">
                <div>🎯 <strong>划线分数：${lineScore} 分</strong></div>
                <div style="margin-top:4px;">📊 现状：已达标 ${currentCount} 人 / 目标 ${targetCount} 人。</div>
                <div style="margin-top:4px; color:#0369a1;">💡 策略：${strategyText}</div>
            </div>
            <div class="table-wrap">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>班级</th>
                            <th>姓名</th>
                            <th>当前总分</th>
                            <th>距划线差</th>
                            <th style="background:#fee2e2; color:#b91c1c;">🆘 建议补救学科</th>
                            <th>与年级均分差</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

    candidates.forEach(c => {
        const isBalanced = c.worstSub.includes("潜力"); // 匹配"潜力"关键字
        const subStyle = isBalanced ? "color:#64748b; font-size:12px;" : "color:#b91c1c; font-weight:bold;";
        const diffStyle = isBalanced ? "color:#64748b;" : "color:#b91c1c; font-weight:bold;";

        const percent = Math.min(100, (c.total / lineScore) * 100).toFixed(1);

        const barColor = percent >= 98 ? '#f59e0b' : '#3b82f6';

        html += `
                <tr>
                    <td style="vertical-align:middle;">${c.class}</td>
                    <td style="vertical-align:middle;">
                        <div style="font-weight:bold; font-size:14px;">${c.name}</div>
                    </td>

                    <!-- 🟢 改造：当前总分 + 可视化进度条 -->
                    <td style="vertical-align:middle;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:12px; margin-bottom:2px;">
                            <span style="font-weight:800; font-size:15px; color:#333;">${c.total}</span>
                            <span style="color:#94a3b8; transform:scale(0.9);">目标:${lineScore}</span>
                        </div>
                        <div style="width:100%; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;" title="达成率: ${percent}%">
                            <div style="width:${percent}%; height:100%; background:${barColor}; border-radius:3px;"></div>
                        </div>
                    </td>

                    <td style="vertical-align:middle;">
                        <span class="badge" style="background:#eff6ff; color:#1d4ed8; border:1px solid #dbeafe; font-size:12px;">
                            -${c.scoreGap.toFixed(1)}
                        </span>
                    </td>

                    <td style="vertical-align:middle; ${subStyle}">
                        ${c.worstSub}
                    </td>

                    <td style="vertical-align:middle; ${diffStyle}">
                        ${c.worstDiff}
                    </td>
                </tr>
            `;
    });

    html += `</tbody></table></div>`;

    ensureDrillModalDom();
    document.getElementById('drill-title').innerText = title;
    document.getElementById('drill-back-btn').classList.add('hidden');
    document.getElementById('drill-content').innerHTML = html;

    const classCount = {};
    candidates.forEach(c => { classCount[c.class] = (classCount[c.class] || 0) + 1; });
    const classSummary = Object.entries(classCount)
        .map(([cls, cnt]) => `${cls}班:${cnt}人`)
        .join('， ');

    document.getElementById('drill-footer').innerText = `各班潜力生分布：${classSummary} (请平衡各班指标压力)`;

    DrillSystem.exportData = {
        type: 'gap',
        fileName: title, // 使用弹窗标题作为文件名
        data: candidates
    };

    const exportBtn = document.getElementById('drill-export-btn');
    if (exportBtn) exportBtn.classList.remove('hidden');

    document.getElementById('drill-modal').style.display = 'flex';
}

function calcSummary(isSilent = false) {
    const isGrade9 = CONFIG.name && CONFIG.name.includes('9');
    let indicatorRowsForSummary = [];

    if (isGrade9 && typeof calcIndicators === 'function') {
        const previousSuppress = SummaryRefreshState.suppress;
        SummaryRefreshState.suppress = true;
        try {
            const result = calcIndicators(true);
            indicatorRowsForSummary = Array.isArray(result) ? result : [];
        } catch (e) {
            console.warn('[calcSummary] 指标生静默重算失败:', e);
        } finally {
            SummaryRefreshState.suppress = previousSuppress;
        }
    }
    if (!indicatorRowsForSummary.length && Array.isArray(window.INDICATOR_LAST_RESULT)) {
        indicatorRowsForSummary = window.INDICATOR_LAST_RESULT;
    }
    const indicatorScoreMap = new Map();
    (indicatorRowsForSummary || []).forEach((row) => {
        const score = Number(row?.finalScore);
        if (!Number.isFinite(score)) return;
        const names = [row?.name, ...(Array.isArray(row?.rawNames) ? row.rawNames : [])]
            .map((name) => String(name || '').trim())
            .filter(Boolean);
        names.forEach((name) => {
            indicatorScoreMap.set(name, score);
            if (typeof normalizeSchoolName === 'function') {
                const normalized = normalizeSchoolName(name);
                if (normalized) indicatorScoreMap.set(normalized, score);
            }
        });
    });

    const hasSummaryScopeHelper = typeof listAvailableSchoolsForCompare === 'function';
    const summarySchoolNames = hasSummaryScopeHelper
        ? listAvailableSchoolsForCompare()
        : Object.keys(SCHOOLS || {});
    const summarySchoolSet = new Set((summarySchoolNames || []).map(name => String(name || '').trim()).filter(Boolean));

    const list = Object.values(SCHOOLS || {}).filter(s => (
        hasSummaryScopeHelper
            ? (typeof isTownshipManagedSchool === 'function'
                ? isTownshipManagedSchool(s?.name, Object.keys(SCHOOLS || {}))
                : summarySchoolSet.has(String(s?.name || '').trim()))
            : true
    )).map(s => {
        const s1 = s.score2Rate || 0;  // 两率一分
        const s2 = s.scoreBottom || 0; // 后1/3
        const indicatorFallbackKey = typeof normalizeSchoolName === 'function' ? normalizeSchoolName(s.name) : '';
        const indicatorFallbackScore = indicatorScoreMap.get(s.name) ?? indicatorScoreMap.get(indicatorFallbackKey) ?? 0;
        const s3 = isGrade9 ? (Number(s.scoreInd) || indicatorFallbackScore || 0) : 0;    // 指标生仅9年级参与

        let s4 = 0; // 高分段赋分
        if (isGrade9 && s.highScoreStats) {
            s4 = s.highScoreStats.score || 0;
        }

        const total = s1 + s2 + s3 + s4;
        return { name: s.name, s1, s2, s3, s4, total };
    });

    list.sort((a, b) => b.total - a.total).forEach((d, i) => d.rank = i + 1);

    const thead = document.querySelector('#tb-summary thead');
    let theadHtml = `<tr><th>学校名称</th><th>两率一分得分</th><th>后1/3得分</th>`;
    if (isGrade9) theadHtml += `<th>指标生得分</th>`;
    if (isGrade9) theadHtml += `<th style="color:#b45309; background:#fff7ed;">高分段赋分(70)</th>`;
    theadHtml += `<th>综合总分</th><th>总排名</th></tr>`;
    thead.innerHTML = theadHtml;

    let html = '';
    list.forEach(d => {
        const isMySchool = sameAppSchoolName(d.name, MY_SCHOOL);
        const safeName = escapeAppHtml(d.name);
        const safeSchoolArg = jsStringLiteral(d.name);
        let indicatorCell = '';
        if (isGrade9) indicatorCell = `<td data-label="指标生得分">${d.s3.toFixed(2)}</td>`;
        let highScoreCell = '';
        if (isGrade9) highScoreCell = `<td data-label="高分段赋分" style="color:#b45309; background:#fff7ed; font-weight:bold;"><button type="button" class="summary-drill-link summary-drill-link-warm" onclick="handleHighClick(${safeSchoolArg})" title="点击查看高分段学生名单">${d.s4.toFixed(2)}</button></td>`;
        const rankClass = ['rank-cell', d.rank === 1 ? 'r-1' : '', d.rank === 2 ? 'r-2' : '', d.rank === 3 ? 'r-3' : '']
            .filter(Boolean)
            .join(' ');

        html += `<tr class="${isMySchool ? 'bg-highlight' : ''}">
                <td data-label="学校名称">${safeName}</td>
                <td data-label="两率一分得分">${d.s1.toFixed(2)}</td>
                <td data-label="后1/3得分"><button type="button" class="summary-drill-link" onclick="handleExcludedClick(${safeSchoolArg})" title="点击查看后1/3核算剔除名单">${d.s2.toFixed(2)}</button></td>
                ${indicatorCell}
                ${highScoreCell}
                <td data-label="综合总分" class="text-red" style="font-size:16px; font-weight:bold;">${d.total.toFixed(2)}</td>
                <td data-label="总排名" class="${rankClass}">${d.rank}</td>
            </tr>`;
    });
    document.querySelector('#tb-summary tbody').innerHTML = html;
    markSummaryFresh();

    appDebug(`综合排名已生成，共 ${list.length} 所学校`);
}

function exportSummaryTable() {
    if (!RAW_DATA.length || !Object.keys(SCHOOLS || {}).length) {
        alert('请先上传成绩数据');
        return;
    }
    if (typeof calcSummary === 'function') calcSummary(true);
    const table = document.getElementById('tb-summary');
    if (!table || !window.XLSX?.utils?.table_to_sheet) {
        alert('综合分析表未就绪，无法导出');
        return;
    }
    const rowCount = table.querySelectorAll('tbody tr').length;
    if (!rowCount) {
        alert('暂无乡镇学校综合排名数据，请先确认目标人数管理中的乡镇学校名单。');
        return;
    }
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.table_to_sheet(table);
    if (typeof decorateExcelSheet === 'function') {
        const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim());
        decorateExcelSheet(worksheet, headers);
    }
    XLSX.utils.book_append_sheet(workbook, worksheet, '综合评价总览');
    const examLabel = String(CONFIG?.name || '当前考试').replace(/[\\/:*?"<>|]/g, '_');
    XLSX.writeFile(workbook, `综合评价总览_${examLabel}.xlsx`);
}
window.exportSummaryTable = exportSummaryTable;

function exportTeacherAnalysis() {
    const user = getCurrentUser();
    const role = user?.role || 'guest';
    if (!MY_SCHOOL || Object.keys(TEACHER_STATS).length === 0) { alert('请先选择本校并配置教师信息'); return; }
    analyzeTeachers();
    if (role === 'teacher' || role === 'class_teacher') {
        const visibleSubjects = Array.from(getVisibleSubjectsForTeacherUser(user) || []).map(s => normalizeSubject(s)).filter(Boolean);
        const rangeText = visibleSubjects.length ? visibleSubjects.join('、') : '本学科';
        alert(`教师分析数据已准备就绪（当前可见学科：${rangeText}），请查看"本校教师分析"标签页`);
        return;
    }
    alert('教师分析数据已准备就绪，请查看"本校教师分析"标签页');
}

function updateSegmentSelects() {
    const schSel = document.getElementById('segSchoolSelect'); const subSel = document.getElementById('segSubjectSelect');
    if (!schSel || !subSel) return;
    const oldSch = schSel.value;
    const schoolList = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare('all') : Object.keys(SCHOOLS || {});
    schSel.innerHTML = `<option value="ALL">全部学校</option>${schoolList.map(s => `<option value="${s}">${s}</option>`).join('')}`; if (oldSch && (oldSch === 'ALL' || SCHOOLS[oldSch])) schSel.value = oldSch;
    const oldSub = subSel.value; subSel.innerHTML = `<option value="total">总分</option>${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('')}`; if (oldSub) subSel.value = oldSub;
    schSel.onchange = updateSegmentClassSelect;
    updateSegmentClassSelect();
}

function updateSegmentClassSelect() {
    const schSel = document.getElementById('segSchoolSelect');
    const clsSel = document.getElementById('segClassSelect');
    if (!schSel || !clsSel) return;
    const oldClass = clsSel.value;
    const townshipRows = (typeof filterRowsToTownshipSchools === 'function') ? filterRowsToTownshipSchools(RAW_DATA || []) : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    const schoolRecord = typeof getAppSchoolRecord === 'function' ? getAppSchoolRecord(schSel.value) : null;
    const students = schSel.value === 'ALL' ? townshipRows : (schoolRecord?.students || []);
    const classes = Array.from(new Set(students.map(s => s.class).filter(Boolean)))
        .sort((a, b) => normalizeClass(a).localeCompare(normalizeClass(b), 'zh-Hans-CN', { numeric: true }));
    clsSel.innerHTML = `<option value="ALL">全部班级</option>${classes.map(c => `<option value="${c}">${c}</option>`).join('')}`;
    if (oldClass && Array.from(clsSel.options || []).some(option => option.value === oldClass)) clsSel.value = oldClass;
}

function renderSegmentAnalysis() {
    if (!window.Chart && typeof window.ensureChartVendorLoaded === 'function') {
        return window.ensureChartVendorLoaded()
            .then(() => renderSegmentAnalysis())
            .catch((error) => {
                console.warn('[segment-analysis] Chart runtime load failed:', error);
                if (typeof uiAlert === 'function') uiAlert('图表组件加载失败，请刷新页面后重试', 'error');
                else alert('图表组件加载失败，请刷新页面后重试');
                return false;
            });
    }

    const school = document.getElementById('segSchoolSelect').value;
    const selectedClass = document.getElementById('segClassSelect')?.value || 'ALL';
    const subject = document.getElementById('segSubjectSelect').value;
    const step = parseInt(document.getElementById('segStep').value) || 10;

    const townshipRows = (typeof filterRowsToTownshipSchools === 'function') ? filterRowsToTownshipSchools(RAW_DATA || []) : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    let students = school === 'ALL' ? townshipRows : (SCHOOLS[school] ? SCHOOLS[school].students : []);
    const normalizedSelectedClass = normalizeClass(selectedClass);
    if (normalizedSelectedClass && normalizedSelectedClass.toLowerCase() !== 'all') {
        students = students.filter(s => normalizeClass(s.class || '') === normalizedSelectedClass);
    }
    const validStudents = students.filter(s => {
        const v = subject === 'total' ? s.total : s.scores[subject];
        return typeof v === 'number';
    }).map(s => ({
        ...s, // 浅拷贝学生信息
        _filterScore: subject === 'total' ? s.total : s.scores[subject]
    }));

    const scores = validStudents.map(s => s._filterScore); // 兼容旧逻辑的 scores 数组用于计算 max/total

    if (!scores.length) { alert('没有找到相关成绩数据'); return; }

    const maxScore = Math.ceil(Math.max(...scores));
    const topCeil = Math.ceil(maxScore / step) * step;

    let html = `<thead><tr><th>分数段</th><th>人数</th><th>累计人数</th><th>比例</th><th>累计比例</th></tr></thead><tbody>`;
    let cumulative = 0, total = scores.length;

    const rowsData = []; // 临时存储数据以便后续给图表使用

    for (let high = topCeil; high > 0; high -= step) {
        const low = high - step;
        const isTopBucket = high === topCeil;
        const bucketList = validStudents.filter(s => {
            const val = s._filterScore;
            return val >= low && (isTopBucket ? val <= high : val < high);
        });
        const count = bucketList.length;

        if (count === 0 && cumulative === 0) continue;

        cumulative += count;

        const label = `${low}-${high}`;

        html += `<tr><td>${label} 分</td><td>${count}</td><td>${cumulative}</td><td>${(count / total * 100).toFixed(2)}%</td><td>${(cumulative / total * 100).toFixed(2)}%</td></tr>`;

        rowsData.unshift({
            label: label,
            count: count,
            studentList: bucketList // 👈 关键：保存该分数段的学生名单
        });
    }

    document.getElementById('tb-segment').innerHTML = html + `</tbody>`;

    const ctx = document.getElementById('segmentChart');
    if (ctx) {
        if (segmentChartInstance) segmentChartInstance.destroy();

        segmentChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: rowsData.map(d => d.label),
                datasets: [{
                    label: '人数分布',
                    data: rowsData.map(d => d.count),
                    backgroundColor: 'rgba(59, 130, 246, 0.6)', // 蓝色柱体
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    barPercentage: 0.9, // 让柱子宽一点，更有直方图的感觉
                    categoryPercentage: 0.9,
                    order: 2
                }, {
                    type: 'line',
                    label: '分布趋势',
                    data: rowsData.map(d => d.count),
                    borderColor: '#f59e0b', // 橙色线条
                    borderWidth: 2,
                    tension: 0.4, // 平滑曲线
                    pointRadius: 0,
                    order: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: (event, elements) => {
                    if (!elements || elements.length === 0) return;

                    const index = elements[0].index;
                    const dataItem = rowsData[index];

                    if (dataItem && dataItem.count > 0) {
                        const title = `${school === 'ALL' ? '全镇' : school} ${subject} 分数段详情 (${dataItem.label})`;
                        DrillSystem.open(title, dataItem.studentList);
                    } else {
                        UI.toast('该分数段暂无学生', 'info');
                    }
                },
                onHover: (event, chartElement) => {
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                },
                plugins: {
                    legend: { display: true },
                    title: {
                        display: true,
                        text: `${school === 'ALL' ? '全镇' : school} ${subject} 成绩分布直方图 (💡点击柱子可查看名单)`,
                        font: { size: 16 }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: '人数' }
                    },
                    x: {
                        title: { display: true, text: '分数段 (低 → 高)' }
                    }
                }
            }
        });
    }
}

function exportSegmentExcel() {
    const table = document.getElementById('tb-segment');
    if (!table || !table.rows.length) return alert("请先生成统计表");
    const wb = XLSX.utils.table_to_book(table);
    XLSX.writeFile(wb, "分数段统计.xlsx");
}

function updateSubjectBalanceSelects() {
    const schSel = document.getElementById('sbSchoolSelect');
    const clsSel = document.getElementById('sbClassSelect');

    const schoolList = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare('all') : Object.keys(SCHOOLS || {});
    schSel.innerHTML = `<option value="">--请选择学校--</option>${schoolList.map(s => `<option value="${s}">${s}</option>`).join('')}`;
    const currentSchool = readCurrentSchool();
    const matched = Array.from(schSel.options || []).find(option => sameAppSchoolName(option.value, currentSchool));
    if (matched) schSel.value = matched.value;

    schSel.onchange = () => {
        const schoolRecord = getAppSchoolRecord(schSel.value);
        const classes = schoolRecord ? [...new Set((schoolRecord.students || []).map(s => s.class))].sort() : [];
        clsSel.innerHTML = `<option value="">全部</option>${classes.map(c => `<option value="${c}">${c}</option>`).join('')}`;
    };
    schSel.onchange();
}

let SB_CACHE_DATA = []; // 缓存用于导出

function SB_renderTable() {
    const sch = document.getElementById('sbSchoolSelect').value;
    const cls = document.getElementById('sbClassSelect').value;
    const sortType = document.getElementById('sbSortBy').value;

    if (!sch) return alert("请先选择学校");

    const schoolRecord = getAppSchoolRecord(sch);
    if (!schoolRecord || !Array.isArray(schoolRecord.students)) return alert("该学校暂无学生数据");
    let students = schoolRecord.students;
    if (cls && cls !== '全部') students = students.filter(s => s.class === cls);

    const gradeStats = SB_getGradeStats();

    const renderList = students.map(s => {
        const items = [];
        let maxDiff = -999;
        let minDiff = 999;

        SUBJECTS.forEach(sub => {
            if (s.scores[sub] === undefined) return;
            const diff = s.scores[sub] - gradeStats[sub]; // 差值
            items.push({ sub, score: s.scores[sub], diff });

            if (diff > maxDiff) maxDiff = diff;
            if (diff < minDiff) minDiff = diff;
        });

        items.sort((a, b) => b.diff - a.diff);

        const balanceScore = maxDiff - minDiff;

        return {
            name: s.name,
            class: s.class,
            total: s.total,
            rank: safeGet(s, 'ranks.total.township', '-'),
            items,
            balanceScore
        };
    });

    if (sortType === 'total') {
        renderList.sort((a, b) => b.total - a.total);
    } else {
        renderList.sort((a, b) => b.balanceScore - a.balanceScore); // 越不均衡排越前
    }

    SB_CACHE_DATA = renderList; // 存入缓存

    const tbody = document.querySelector('#sb-table tbody');
    let html = '';

    renderList.forEach(row => {

        let barsHtml = `<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">`;

        row.items.forEach(item => {
            const isStrong = item.diff >= 0;
            const color = isStrong ? '#16a34a' : '#dc2626';
            const bg = isStrong ? '#dcfce7' : '#fee2e2';
            const icon = isStrong ? '📈' : '📉';

            const absDiff = Math.abs(item.diff);
            const barWidth = Math.min(absDiff * 2, 50); // 限制最大宽度

            barsHtml += `
                    <div style="display:flex; flex-direction:column; align-items:center; width:50px;">
                        <div style="font-size:10px; font-weight:bold; color:#333;">${item.sub}</div>
                        <div style="display:flex; align-items:flex-end; height:40px; justify-content:center; width:100%;">
                            <div style="
                                width: 12px;
                                height: ${Math.max(barWidth, 2)}px;
                                background-color: ${color};
                                border-radius: 2px;
                                opacity: ${absDiff < 2 ? 0.3 : 1};
                            " title="分数: ${item.score} (比平均${item.diff > 0 ? '+' : ''}${item.diff.toFixed(1)})"></div>
                        </div>
                        <div style="font-size:10px; color:${color}; font-weight:bold;">
                            ${item.diff > 0 ? '+' : ''}${item.diff.toFixed(0)}
                        </div>
                    </div>
                `;
        });
        barsHtml += `</div>`;

        const strongSub = row.items[0];
        const weakSub = row.items[row.items.length - 1];
        let comment = "";
        if (row.balanceScore < 15) comment = `<span class="badge" style="background:#3b82f6">⚖️ 非常均衡</span>`;
        else {
            comment = `<div style="font-size:12px; line-height:1.4;">
                    <div>👍 强: <strong>${strongSub.sub}</strong> (+${strongSub.diff.toFixed(0)})</div>
                    <div style="color:#dc2626;">🆘 弱: <strong>${weakSub.sub}</strong> (${weakSub.diff.toFixed(0)})</div>
                </div>`;
        }

        html += `
                <tr>
                    <td>
                        <div style="font-weight:bold;">${row.name}</div>
                        <div style="font-size:10px; color:#999;">${row.class}</div>
                    </td>
                    <td style="font-weight:bold; font-size:14px;">${row.total}</td>
                    <td>${row.rank}</td>
                    <td style="padding:10px 5px;">${barsHtml}</td>
                    <td>${comment}</td>
                </tr>
            `;
    });

    tbody.innerHTML = html;
    if (renderList.length === 0) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">无数据</td></tr>';
}

function SB_getGradeStats() {
    const gradeStats = {};
    SUBJECTS.forEach(sub => {
        const allScores = RAW_DATA.map(s => s.scores[sub]).filter(v => typeof v === 'number');
        const avg = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
        gradeStats[sub] = avg;
    });
    return gradeStats;
}

function SB_runCluster() {
    const sch = document.getElementById('sbSchoolSelect').value;
    const cls = document.getElementById('sbClassSelect').value;
    if (!sch) return alert("请先选择学校");

    const schoolRecord = getAppSchoolRecord(sch);
    if (!schoolRecord || !Array.isArray(schoolRecord.students)) return alert("该学校暂无学生数据");
    let students = schoolRecord.students;
    if (cls && cls !== '全部') students = students.filter(s => s.class === cls);
    if (!students.length) return alert("无可用学生数据");

    const gradeStats = SB_getGradeStats();
    const humanities = ['语文', '英语', '政治', '历史', '地理'];
    const sciences = ['数学', '物理', '化学', '生物', '科学'];

    const vectors = [];
    const meta = [];

    students.forEach(s => {
        const diffs = [];
        SUBJECTS.forEach(sub => {
            const v = s.scores[sub];
            if (typeof v === 'number') diffs.push({ sub, diff: v - (gradeStats[sub] || 0) });
        });
        if (diffs.length === 0) return;

        const hList = diffs.filter(d => humanities.includes(d.sub));
        const sList = diffs.filter(d => sciences.includes(d.sub));
        const hAvg = hList.length ? hList.reduce((a, b) => a + b.diff, 0) / hList.length : 0;
        const sAvg = sList.length ? sList.reduce((a, b) => a + b.diff, 0) / sList.length : 0;
        const maxAbs = Math.max(...diffs.map(d => Math.abs(d.diff)));
        const balance = Math.max(...diffs.map(d => d.diff)) - Math.min(...diffs.map(d => d.diff));

        vectors.push([hAvg, sAvg, maxAbs, balance]);
        meta.push({ name: s.name, class: s.class, hAvg, sAvg, maxAbs, balance });
    });

    const { labels, centroids } = kmeans(vectors, 4, 12);
    const clusterMap = {};
    labels.forEach((c, i) => {
        if (!clusterMap[c]) clusterMap[c] = [];
        clusterMap[c].push(meta[i]);
    });

    const clusterLabels = {};
    centroids.forEach((centroid, idx) => {
        const [hAvg, sAvg, maxAbs, balance] = centroid;
        let tag = '全科均衡型';
        if (balance < 8 && Math.abs(hAvg - sAvg) < 6) tag = '全科均衡型';
        else if (hAvg - sAvg > 6) tag = '文强理弱型';
        else if (sAvg - hAvg > 6) tag = '理强文弱型';
        else if (maxAbs > 12 || balance > 18) tag = '单科突围型';
        clusterLabels[idx] = tag;
    });

    SB_renderClusterResults(clusterMap, clusterLabels);
}

function SB_renderClusterResults(clusterMap, clusterLabels) {
    const container = document.getElementById('sb-cluster-results');
    if (!container) return;

    const strategy = {
        '全科均衡型': '策略：保持节奏，适度强化拔高题；每周1次综合训练，避免短板出现。',
        '文强理弱型': '策略：补数学/物理基础概念与题型套路，每天固定15-20分钟理科训练。',
        '理强文弱型': '策略：语文/英语以“阅读+词汇+写作”三板斧推进，重点提升语感与表达。',
        '单科突围型': '策略：保优势学科的同时补齐最弱科，制定“主攻+补弱”双轨计划。'
    };

    let html = '';
    Object.keys(clusterMap).forEach(k => {
        const label = clusterLabels[k] || '未命名';
        const list = clusterMap[k] || [];
        html += `<div style="margin-bottom:12px; padding:10px; border:1px dashed #fed7aa; border-radius:8px; background:#fff;">
                <div style="font-weight:bold; color:#9a3412;">${label}（${list.length}人）</div>
                <div style="margin:6px 0; color:#7c2d12;">${strategy[label] || ''}</div>
                <div style="font-size:11px; color:#64748b;">示例名单：${list.slice(0, 8).map(s => `${s.name}(${s.class})`).join('、')}${list.length > 8 ? ' …' : ''}</div>
            </div>`;
    });
    container.innerHTML = html || '暂无聚类结果';
}

function kmeans(data, k = 4, maxIter = 10) {
    if (!data.length) return { labels: [], centroids: [] };
    const dim = data[0].length;
    const centroids = [];
    const used = new Set();
    while (centroids.length < k && used.size < data.length) {
        const idx = Math.floor(Math.random() * data.length);
        if (!used.has(idx)) { used.add(idx); centroids.push([...data[idx]]); }
    }
    const labels = new Array(data.length).fill(0);

    for (let iter = 0; iter < maxIter; iter++) {
        for (let i = 0; i < data.length; i++) {
            let best = 0, bestDist = Infinity;
            for (let c = 0; c < centroids.length; c++) {
                const dist = euclid(data[i], centroids[c]);
                if (dist < bestDist) { bestDist = dist; best = c; }
            }
            labels[i] = best;
        }
        const sums = Array.from({ length: centroids.length }, () => new Array(dim).fill(0));
        const counts = new Array(centroids.length).fill(0);
        for (let i = 0; i < data.length; i++) {
            const c = labels[i];
            counts[c]++;
            for (let d = 0; d < dim; d++) sums[c][d] += data[i][d];
        }
        for (let c = 0; c < centroids.length; c++) {
            if (counts[c] === 0) continue;
            for (let d = 0; d < dim; d++) centroids[c][d] = sums[c][d] / counts[c];
        }
    }
    return { labels, centroids };
}

function euclid(a, b) {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += Math.pow(a[i] - b[i], 2);
    return Math.sqrt(s);
}

function SB_exportExcel() {
    if (!SB_CACHE_DATA.length) return alert("请先生成分析数据");

    const wb = XLSX.utils.book_new();
    const headers = ["班级", "姓名", "总分", "全镇排名", "最强学科", "最强分差", "最弱学科", "最弱分差"];

    SUBJECTS.forEach(s => headers.push(`${s}分差`));

    const data = [headers];

    SB_CACHE_DATA.forEach(r => {
        const strong = r.items[0];
        const weak = r.items[r.items.length - 1];

        const row = [
            r.class, r.name, r.total, r.rank,
            strong.sub, `+${strong.diff.toFixed(1)}`,
            weak.sub, weak.diff.toFixed(1)
        ];

        SUBJECTS.forEach(s => {
            const item = r.items.find(i => i.sub === s);
            row.push(item ? item.diff.toFixed(1) : '-');
        });

        data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, "学生优劣势分析");
    XLSX.writeFile(wb, `优劣势学科分析_${document.getElementById('sbSchoolSelect').value}.xlsx`);
}

function updatePotentialSchoolSelect() {
    const sel = document.getElementById('potSchoolSelect');
    if (!sel) return;
    const old = sel.value;

    const schoolList = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare('all') : Object.keys(SCHOOLS || {});
    sel.innerHTML = `<option value="ALL">全部学校</option>${schoolList.map(s => `<option value="${s}">${s}</option>`).join('')}`;

    if (old && (old === 'ALL' || SCHOOLS[old])) sel.value = old;
    sel.onchange = updatePotentialClassSelect;
    updatePotentialClassSelect();
}

function updatePotentialClassSelect() {
    const schoolSelect = document.getElementById('potSchoolSelect');
    const classSelect = document.getElementById('potClassSelect');
    if (!schoolSelect || !classSelect) return;
    const oldClass = classSelect.value;
    const townshipRows = (typeof filterRowsToTownshipSchools === 'function') ? filterRowsToTownshipSchools(RAW_DATA || []) : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    const schoolRecord = typeof getAppSchoolRecord === 'function' ? getAppSchoolRecord(schoolSelect.value) : null;
    const students = schoolSelect.value === 'ALL' ? townshipRows : (schoolRecord?.students || []);
    const classes = Array.from(new Set(students.map(s => s.class).filter(Boolean)))
        .sort((a, b) => normalizeClass(a).localeCompare(normalizeClass(b), 'zh-Hans-CN', { numeric: true }));
    classSelect.innerHTML = `<option value="ALL">全部班级</option>${classes.map(c => `<option value="${c}">${c}</option>`).join('')}`;
    if (oldClass && Array.from(classSelect.options || []).some(option => option.value === oldClass)) classSelect.value = oldClass;
}

function renderPotentialAnalysis() {
    if (!RAW_DATA.length) return alert('请先上传数据');
    const scope = document.getElementById('potSchoolSelect').value;
    const selectedClass = document.getElementById('potClassSelect')?.value || 'ALL';
    const topRatio = parseFloat(document.getElementById('potTopSelect').value);

    let candidates = [];
    const townshipRows = (typeof filterRowsToTownshipSchools === 'function')
        ? filterRowsToTownshipSchools(RAW_DATA || [])
        : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    let scopeStudents = (scope === 'ALL') ? townshipRows : (SCHOOLS[scope]?.students || []);
    const normalizedSelectedClass = normalizeClass(selectedClass);
    if (normalizedSelectedClass && normalizedSelectedClass.toLowerCase() !== 'all') {
        scopeStudents = scopeStudents.filter(s => normalizeClass(s.class || '') === normalizedSelectedClass);
    }

    const totalCount = townshipRows.length || RAW_DATA.length;
    const topRankThreshold = Math.floor(totalCount * topRatio);

    scopeStudents.forEach(stu => {
        const tRank = safeGet(stu, 'ranks.total.township', 99999);
        if (tRank === '-' || tRank > topRankThreshold) return;


        const useAdvancedMetrics = (stu.tScores && stu.totalTScore);

        SUBJECTS.forEach(sub => {
            const subRank = safeGet(stu, `ranks.${sub}.township`, 0);
            if (!subRank) return;

            let isPotential = false;
            let gapVal = 0;
            let gapLabel = '';

            if (useAdvancedMetrics) {
                const subT = stu.tScores[sub];
                const validSubCount = Object.values(stu.tScores).filter(v => v > 0).length || 1;
                const selfAvgT = stu.totalTScore / validSubCount;

                if ((selfAvgT - subT) > 8) {
                    isPotential = true;
                    gapVal = (selfAvgT - subT).toFixed(1);
                    gapLabel = `相对偏离 -${gapVal}`;
                }
            } else {
                const gap = subRank - tRank;
                if (gap > (totalCount * 0.3)) {
                    isPotential = true;
                    gapVal = gap;
                    gapLabel = `名次落差 ${gap}`;
                }
            }

            if (isPotential) {
                candidates.push({
                    school: stu.school, class: stu.class, name: stu.name,
                    totalScore: stu.total, totalRank: tRank,
                    subject: sub, subScore: stu.scores[sub], subRank: subRank,
                    gap: gapLabel, // 显示文本
                    sortVal: parseFloat(gapVal) // 用于排序
                });
            }
        });
    });

    candidates.sort((a, b) => b.sortVal - a.sortVal);
    POTENTIAL_STUDENTS_CACHE = candidates;

    let html = `<div class="info-bar">
            <strong>💡 分析模型升级：</strong>
            系统已自动启用 <b>${candidates.length > 0 && candidates[0].gap.includes('相对偏离') ? '相对偏离模型' : '名次落差模型'}</b>。
            <br>筛选范围：总分前 ${(topRatio * 100).toFixed(0)}% 的学生中，单科显著“拖后腿”的潜力股。
        </div>
        <div class="table-wrap"><table><thead><tr><th>学校</th><th>班级</th><th>姓名</th><th>总分排名</th><th>跛脚学科</th><th>学科分数</th><th>学科排名</th><th>偏科指数</th></tr></thead><tbody>`;

    if (candidates.length === 0) {
        html += `<tr><td colspan="8" style="padding:30px; text-align:center;">🎉 恭喜！在前 ${(topRatio * 100)}% 学生中未发现严重偏科现象。</td></tr>`;
    } else {
        candidates.forEach(c => {
            html += `<tr>
                    <td>${c.school}</td>
                    <td>${c.class}</td>
                    <td><strong>${c.name}</strong></td>
                    <td class="text-green">${c.totalRank}</td>
                    <td style="color:var(--primary); font-weight:bold;">${c.subject}</td>
                    <td>${formatVal(c.subScore)}</td>
                    <td class="text-red">${c.subRank}</td>
                    <td style="color:red; font-weight:bold;">📉 ${c.gap}</td>
                </tr>`;
        });
    }
    document.getElementById('potential-results').innerHTML = html + `</tbody></table></div>`;
}

function exportPotentialAnalysis() {
    if (!POTENTIAL_STUDENTS_CACHE.length) { alert('请先生成数据或结果为空'); return; }
    const wb = XLSX.utils.book_new(); const data = [['学校', '班级', '姓名', '总分', '总分全镇排名', '跛脚学科', '学科分数', '学科全镇排名', '名次落差']];
    POTENTIAL_STUDENTS_CACHE.forEach(c => data.push([c.school, c.class, c.name, c.totalScore, c.totalRank, c.subject, c.subScore, c.subRank, c.gap]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "偏科生名单"); XLSX.writeFile(wb, "偏科潜力生挖掘名单.xlsx");
}

function exportCorrelationExcel() {
    const matrixTable = document.getElementById('corrMatrixTable'); const liftDragTable = document.getElementById('liftDragTable');
    if (!matrixTable || matrixTable.rows.length === 0) return alert("请先生成分析结果");
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.table_to_sheet(matrixTable), "相关性矩阵"); XLSX.utils.book_append_sheet(wb, XLSX.utils.table_to_sheet(liftDragTable), "提分与拖分分析"); XLSX.writeFile(wb, "学科关联深度分析.xlsx");
}

function exportExcel(type) {
    if (!RAW_DATA.length) { alert('请先上传数据'); return; }

    if (type === 'bottom3') {
        const table = document.getElementById('tb-bottom3');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(wb, ws, "核算结果");
        XLSX.writeFile(wb, '后1_3核算结果.xlsx');
        return;
    }

    if (type === 'indicator') {
        const table = document.getElementById('tb-indicator');
        if (table.rows.length < 3) return alert("请先点击【开始计算】");

        const wb = XLSX.utils.book_new();

        const wsData = [];
        wsData.push(["学校",
            "指标一目标", "指标一达标", "指标一基础分", "指标一附加分", "指标一小计",
            "指标二目标", "指标二达标", "指标二基础分", "指标二附加分", "指标二小计",
            "指标总分", "排名"]);

        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            const parseTargetReach = (str) => {
                const parts = str.split('/');
                return { t: parts[0].trim(), r: parts[1].trim() };
            };

            const ind1 = parseTargetReach(tds[1].innerText);
            const ind2 = parseTargetReach(tds[5].innerText);

            wsData.push([
                tds[0].innerText, // 学校
                ind1.t, ind1.r, tds[2].innerText, tds[3].innerText, tds[4].innerText, // 指标一
                ind2.t, ind2.r, tds[6].innerText, tds[7].innerText, tds[8].innerText, // 指标二
                tds[9].innerText, // 总分
                tds[10].innerText // 排名
            ]);
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        XLSX.utils.book_append_sheet(wb, ws, "指标生核算详细");
        XLSX.writeFile(wb, '指标生核算结果(含附加分).xlsx');
    }
}
function downloadTemplate(type) {
    const wb = XLSX.utils.book_new();
    let headers = [];
    let sampleData = [];
    let filename = "模板.xlsx";
    let sheetName = "成绩表";

    switch (type) {
        case 'primary':
            headers = ["学校", "班级", "姓名", "考号", "语文", "数学", "英语"];
            sampleData = [
                ["实验小学", "601", "张三", "2024001", 95, 98, 92],
                ["实验小学", "601", "李四", "2024002", 88, 90, 85]
            ];
            filename = "小学期末考试_标准模板.xlsx";
            break;
        case 'junior':
            headers = ["学校", "班级", "姓名", "考号", "语文", "数学", "英语", "物理", "历史", "地理", "生物", "政治"];
            sampleData = [
                ["镇中", "801", "王五", "2024101", 105, 110, 108, 85, 90, 88, 92, 80],
                ["镇中", "801", "赵六", "2024102", 98, 102, 95, 78, 85, 80, 88, 75]
            ];
            filename = "初中月考_标准模板.xlsx";
            break;
        case 'grade9':
            headers = ["学校", "班级", "姓名", "考号", "语文", "数学", "英语", "物理", "化学", "政治", "历史", "体育"];
            sampleData = [
                ["一中", "901", "孙七", "2024901", 112, 115, 110, 68, 48, 55, 58, 40],
                ["一中", "901", "周八", "2024902", 105, 108, 102, 60, 42, 50, 52, 38]
            ];
            filename = "中考一模_标准模板.xlsx";
            break;
        case 'teacher':
            headers = ["班级", "学科", "教师姓名"];
            sampleData = [
                ["701", "语文", "张老师"],
                ["701", "数学", "李老师"],
                ["702", "语文", "张老师"],
                ["702", "数学", "王老师"]
            ];
            filename = "教师任课信息_导入模板.xlsx";
            sheetName = "请改为学校名称";
            break;
    }

    const wsData = [headers, ...sampleData];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    ws['!cols'] = headers.map(() => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);

    if (window.UI) UI.toast(`✅ 已下载：${filename}`, "success");
    logAction('下载模板', filename);
}
function updatePosterSelects() {
    const schSel = document.getElementById('posterSchoolSelect');
    const clsSel = document.getElementById('posterClassSelect');
    const subSel = document.getElementById('posterSubjectSelect');
    if (!schSel || !clsSel || !subSel) return;
    const prevSchool = schSel.value;
    const prevClass = clsSel.value;
    const prevSubject = subSel.value;

    setSingleSelectOptions(
        schSel,
        Object.keys(SCHOOLS || {}).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true })),
        '--请选择学校--',
        prevSchool
    );

    subSel.innerHTML = `<option value="total">🏆 总分光荣榜</option>${SUBJECTS.map(s => `<option value="${s}">📘 ${s}单科状元</option>`).join('')}`;
    subSel.value = (prevSubject === 'total' || SUBJECTS.includes(prevSubject)) ? prevSubject : 'total';

    schSel.onchange = () => updatePosterClassSelect();
    updatePosterClassSelect(prevClass);
}

function updatePosterClassSelect(preferredClass) {
    const sch = document.getElementById('posterSchoolSelect').value;
    const clsSel = document.getElementById('posterClassSelect');
    if (!clsSel) return;
    const keepClass = preferredClass !== undefined ? preferredClass : clsSel.value;
    setSingleSelectOptions(clsSel, getSchoolClassOptions(sch), '全校排名', keepClass);
}

function setPosterTheme(themeName, btn) {
    const canvas = document.getElementById('poster-canvas');
    if (!canvas || !btn || !btn.parentNode) return;
    canvas.classList.remove('theme-red', 'theme-blue', 'theme-tech');
    canvas.classList.add(`theme-${themeName}`);

    const btns = btn.parentNode.querySelectorAll('.thumb-btn');
    btns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
}

function renderPoster() {
    const sch = document.getElementById('posterSchoolSelect').value;
    const cls = document.getElementById('posterClassSelect').value;
    const sub = document.getElementById('posterSubjectSelect').value;
    const limit = parseInt(document.getElementById('posterCount').value) || 10;
    const customTitle = document.getElementById('posterTitleInput').value;
    const customSub = document.getElementById('posterSubInput').value;
    const canvas = document.getElementById('poster-canvas');
    const container = document.getElementById('poster-list-container');

    if (!canvas || !container) return;
    const schoolRecord = getAppSchoolRecord(sch);
    if (!sch || !schoolRecord || !Array.isArray(schoolRecord.students)) return alert("请先选择学校");

    let students = schoolRecord.students;
    if (cls) students = students.filter(s => s.class === cls);

    const getScore = (s) => (sub === 'total') ? s.total : (s.scores[sub] || -1);

    let list = students.filter(s => getScore(s) >= 0);
    list.sort((a, b) => getScore(b) - getScore(a));

    list = list.slice(0, limit);

    const titleEl = canvas.querySelector('.p-title');
    const subTitleEl = canvas.querySelector('.p-sub');
    if (titleEl) titleEl.innerText = customTitle;
    if (subTitleEl) subTitleEl.innerText = customSub || `${sch} ${cls || '全年级'} ${sub === 'total' ? '总分' : sub}前${limit}名`;

    let html = '';

    if (list.length === 0) {
        html = '<div style="text-align:center; padding:50px;">暂无数据</div>';
    } else {
        list.forEach((s, i) => {
            const scoreVal = getScore(s);
            let rankDisplay = i + 1;

            html += `
                <div class="p-item">
                    <div class="p-rank">${rankDisplay}</div>
                    <div class="p-name">
                        ${s.name} <span style="font-size:0.8em; opacity:0.8; font-weight:normal;">(${s.class})</span>
                    </div>
                    <div class="p-score">${scoreVal}</div>
                </div>`;
        });
    }
    container.innerHTML = html;
}

function downloadPoster() {
    const canvasDiv = document.getElementById('poster-canvas');
    if (!canvasDiv) return;
    if (typeof html2canvas !== 'function') return alert("截图组件尚未加载完成，请刷新页面后重试。");

    const originalTransform = canvasDiv.style.transform;
    canvasDiv.style.transform = "none"; // 确保无缩放

    alert("🖼️ 正在生成高清图片，请稍候...");

    setTimeout(() => {
        html2canvas(canvasDiv, {
            scale: 2, // 2倍高清
            useCORS: true,
            backgroundColor: null, // 透明背景
            logging: false
        }).then(canvas => {
            canvasDiv.style.transform = originalTransform;

            const link = document.createElement('a');
            link.download = `光荣榜_${new Date().getTime()}.png`;
            link.href = canvas.toDataURL("image/png");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }).catch(err => {
            canvasDiv.style.transform = originalTransform;
            alert("生成失败: " + err.message);
        });
    }, 200);
}

// 临界生任务单与座位调整逻辑已拆分到 marginal-push-runtime.js 和 seat-adjustment-runtime.js。

function applyPrintSettings() {
    const size = document.getElementById('ps-size').value;
    const orient = document.getElementById('ps-orient').value;
    const scale = document.getElementById('ps-scale').value;
    const compact = document.getElementById('ps-compact').checked;
    const hideHeader = document.getElementById('ps-hide-header').checked;
    const hideNav = document.getElementById('ps-hide-nav').checked;
    const hideCharts = document.getElementById('ps-hide-charts').checked;
    const watermarkText = document.getElementById('ps-watermark-text').value;
    const watermarkOpacity = document.getElementById('ps-watermark-opacity').value;

    document.documentElement.style.setProperty('--p-size', size);
    document.documentElement.style.setProperty('--p-orient', orient);
    document.documentElement.style.setProperty('--p-scale', scale);
    document.documentElement.style.setProperty('--p-watermark-text', `"${watermarkText}"`);
    document.documentElement.style.setProperty('--p-watermark-opacity', watermarkOpacity);

    const body = document.body;
    if (watermarkText.trim()) body.classList.add('print-watermarked'); else body.classList.remove('print-watermarked');
    if (hideHeader) body.classList.add('p-hide-header'); else body.classList.remove('p-hide-header');
    if (hideNav) body.classList.add('p-hide-nav'); else body.classList.remove('p-hide-nav');
    if (hideCharts) body.classList.add('p-hide-charts'); else body.classList.remove('p-hide-charts');
    if (compact) body.classList.add('p-compact-table'); else body.classList.remove('p-compact-table');

    alert("✅ 打印配置已应用！\n\n请点击“调用打印机”按钮查看预览效果。\n提示：浏览器打印设置中请勾选“背景图形”以显示颜色。");
}

function initTagWidget(wrapperId, hiddenInputId) {
    const wrapper = document.getElementById(wrapperId); if (!wrapper) return;
    const input = wrapper.querySelector('.tag-input-field'); const dropdown = wrapper.querySelector('.suggestion-dropdown');
    wrapper.addEventListener('click', (e) => { if (e.target === wrapper) input.focus(); });
    if (input) {
        input.addEventListener('input', function () {
            const val = this.value.trim().toLowerCase();
            if (!val) { dropdown.style.display = 'none'; return; }
            const matches = readCurrentContextStudentsState().filter(s => s.name.includes(val)).slice(0, 8);
            if (matches.length) { dropdown.innerHTML = matches.map(s => `<div class="suggestion-item" onclick="addTagToWidget('${wrapperId}', '${hiddenInputId}', '${s.name}')">${s.name} <small>${s.score || s.total}分</small></div>`).join(''); dropdown.style.display = 'block'; }
            else { dropdown.style.display = 'none'; }
        });
        input.addEventListener('blur', () => { setTimeout(() => dropdown.style.display = 'none', 200); });
    }
}
function addTagToWidget(wrapperId, hiddenInputId, name) {
    const currentTags = getTagsFromHidden(hiddenInputId);
    if (currentTags.includes(name)) { const input = document.getElementById(wrapperId).querySelector('.tag-input-field'); if (input) input.value = ''; return; }
    currentTags.push(name); document.getElementById(hiddenInputId).value = currentTags.join(', ');
    renderTagsUI(wrapperId, hiddenInputId);
    const input = document.getElementById(wrapperId).querySelector('.tag-input-field'); if (input) { input.value = ''; input.focus(); }
}
function removeTagFromWidget(wrapperId, hiddenInputId, name) {
    const currentTags = getTagsFromHidden(hiddenInputId); const newTags = currentTags.filter(t => t !== name);
    document.getElementById(hiddenInputId).value = newTags.join(', '); renderTagsUI(wrapperId, hiddenInputId);
}
function getTagsFromHidden(id) { const val = document.getElementById(id).value; return val ? val.split(/[,;]/).map(s => s.trim()).filter(s => s) : []; }
function renderTagsUI(wrapperId, hiddenInputId) {
    const wrapper = document.getElementById(wrapperId); const tags = getTagsFromHidden(hiddenInputId);
    wrapper.querySelectorAll('.tag-chip').forEach(c => c.remove());
    const input = wrapper.querySelector('.tag-input-field');
    tags.forEach(tag => {
        const chip = document.createElement('div'); chip.className = 'tag-chip';
        chip.innerHTML = `${tag} <span class="tag-chip-remove" onclick="removeTagFromWidget('${wrapperId}', '${hiddenInputId}', '${tag}')">&times;</span>`;
        if (input) wrapper.insertBefore(chip, input); else wrapper.appendChild(chip);
    });
}
function addConflictPair(type) {
    const idA = type === 'adj' ? 'conflict_sel_a' : 'fb_conflict_sel_a';
    const idB = type === 'adj' ? 'conflict_sel_b' : 'fb_conflict_sel_b';
    const wrapperId = type === 'adj' ? 'widget_adj_conflict' : 'widget_fb_conflict';
    const hiddenId = type === 'adj' ? 'adj_c_conflict' : 'fb_c_conflict';

    const selA = document.getElementById(idA);
    const selB = document.getElementById(idB);

    if (!selA || !selB) return console.error("找不到下拉框元素");
    if (!selA.value || !selB.value) return alert("请先选择两个学生");
    if (selA.value === selB.value) return alert("不能选择同一个学生");

    addTagToWidget(wrapperId, hiddenId, `${selA.value}&${selB.value}`);

    selA.value = "";
    selB.value = "";
}

function updateConstraintWidgetsContext(type) {
    let students = [];

    if (type === 'adj') {
        const sch = document.getElementById('seatAdjSchoolSelect').value;
        const cls = document.getElementById('seatAdjClassSelect').value;

        const schoolRecord = getAppSchoolRecord(sch);
        if (sch && cls && schoolRecord) {
            students = (schoolRecord.students || []).filter(s => s.class === cls);
        }

        setCurrentContextStudentsState(students);

        ['diff', 'vision', 'psy', 'talk'].forEach(f => {
            initTagWidget(`widget_adj_${f}`, `adj_c_${f}`);
            renderTagsUI(`widget_adj_${f}`, `adj_c_${f}`);
        });
        renderTagsUI('widget_adj_conflict', 'adj_c_conflict');

    } else if (type === 'fb') {
        if (FB_CUR_CLASS_IDX !== -1 && FB_CLASSES[FB_CUR_CLASS_IDX]) {
            students = FB_CLASSES[FB_CUR_CLASS_IDX].students;
        }

        setCurrentContextStudentsState(students);

        ['diff', 'vision', 'talk'].forEach(f => {
            initTagWidget(`widget_fb_${f}`, `fb_c_${f}`);
            renderTagsUI(`widget_fb_${f}`, `fb_c_${f}`);
        });
        renderTagsUI('widget_fb_conflict', 'fb_c_conflict');

        renderTagsUI('widget_fb_bind', 'fb_c_bind');
    }

    let opts = '<option value="">--点击选择--</option>';
    if (students.length > 0) {
        students.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
        opts += students.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    } else {
        opts = '<option value="">(暂无学生数据)</option>';
    }

    if (type === 'fb') {
        const cA = document.getElementById('fb_conflict_sel_a');
        const cB = document.getElementById('fb_conflict_sel_b');
        if (cA && cB) { cA.innerHTML = opts; cB.innerHTML = opts; }

        const bA = document.getElementById('fb_bind_sel_a');
        const bB = document.getElementById('fb_bind_sel_b');
        if (bA && bB) { bA.innerHTML = opts; bB.innerHTML = opts; }

    } else if (type === 'adj') {
        const elA = document.getElementById('conflict_sel_a');
        const elB = document.getElementById('conflict_sel_b');
        if (elA && elB) { elA.innerHTML = opts; elB.innerHTML = opts; }
    }
}

function toggleTableHeatmap(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const tables = container.querySelectorAll('table');
    if (!tables.length) return alert("请先生成表格");

    const isHeatmapOn = container.classList.toggle('heatmap-mode');
    const isHorizontalMode = (containerId === 'horizontal-table');

    tables.forEach(table => {
        if (!isHeatmapOn) {
            table.querySelectorAll('td').forEach(td => td.style.removeProperty('background-color'));
            return;
        }

        const rows = Array.from(table.querySelectorAll('tbody tr'));
        if (rows.length === 0) return;

        const getVal = (cell) => {
            const txt = cell.innerText.split('(')[0].replace(/[%+]/g, '').trim();
            return parseFloat(txt);
        };

        const applyColorToGroup = (cells, isRankType) => {
            const values = cells.map(c => c.val);
            const max = Math.max(...values);
            const min = Math.min(...values);
            const range = max - min;
            if (range === 0) return;

            cells.forEach(item => {
                let ratio = (item.val - min) / range;
                if (isRankType) ratio = 1 - ratio;

                let r, g, b;
                if (ratio < 0.5) { // 红 -> 黄
                    r = 255;
                    g = Math.round(200 + (ratio * 2) * 55);
                    b = 200;
                } else { // 黄 -> 绿
                    r = Math.round(255 - ((ratio - 0.5) * 2) * 55);
                    g = 255;
                    b = 200;
                }

                item.el.style.setProperty('background-color', `rgb(${r}, ${g}, ${b})`, 'important');
            });
        };

        if (isHorizontalMode) {
            rows.forEach(tr => {
                let cells = [];
                const label = tr.children[0].innerText;
                const isRank = label.includes('排名') || label.includes('名次');

                for (let c = 1; c < tr.children.length; c++) {
                    const cell = tr.children[c];
                    const val = getVal(cell);
                    if (!isNaN(val)) cells.push({ el: cell, val: val });
                }
                applyColorToGroup(cells, isRank);
            });

        } else {
            const colCount = rows[0].children.length;
            for (let c = 1; c < colCount; c++) {
                let cells = [];
                const headerText = table.querySelector(`thead th:nth-child(${c + 1})`)?.innerText || "";
                const isRank = headerText.includes('排') || headerText.includes('名');

                rows.forEach(r => {
                    const cell = r.children[c];
                    const val = getVal(cell);
                    if (!isNaN(val)) cells.push({ el: cell, val: val });
                });
                applyColorToGroup(cells, isRank);
            }
        }
    });
}

let COL_FILTER_STATE = {}; // 存储选中状态

function toggleColFilterMenu() {
    const popover = document.getElementById('col-filter-popover');
    if (popover.style.display === 'grid') {
        popover.style.display = 'none';
    } else {
        initColFilterUI();
        popover.style.display = 'grid';
    }
}

function initColFilterUI() {
    const popover = document.getElementById('col-filter-popover');
    if (popover.children.length > 0 && SUBJECTS.length === popover.children.length) return; // 已初始化

    popover.innerHTML = '';
    SUBJECTS.forEach(sub => {
        if (COL_FILTER_STATE[sub] === undefined) COL_FILTER_STATE[sub] = true;

        const label = document.createElement('label');
        label.className = 'filter-check-label';
        label.innerHTML = `<input type="checkbox" value="${sub}" ${COL_FILTER_STATE[sub] ? 'checked' : ''} onchange="applyColFilter(this)"> ${sub}`;
        popover.appendChild(label);
    });

    document.addEventListener('click', function closeMenu(e) {
        if (!e.target.closest('#col-filter-popover') && !e.target.closest('#btn-col-filter')) {
            document.getElementById('col-filter-popover').style.display = 'none';
            document.removeEventListener('click', closeMenu);
        }
    });
}

function applyColFilter(checkbox) {
    const sub = checkbox.value;
    const isChecked = checkbox.checked;
    COL_FILTER_STATE[sub] = isChecked;

    const container = document.getElementById('class-comp-results');
    const tables = container.querySelectorAll('table');



    SUBJECTS.forEach(s => {
        const anchorDiv = document.getElementById(`anchor-class-${s}`);
        if (anchorDiv) {
            if (COL_FILTER_STATE[s]) {
                anchorDiv.classList.remove('hidden');
            } else {
                anchorDiv.classList.add('hidden');
            }
        }
    });

}

function resetSystem() {
    if (isArchiveLocked()) {
        return alert("⛔ 当前考试已封存，仅支持只读查看");
    }
    Swal.fire({
        title: '⚠️ 确定要重置系统吗？',
        text: "此操作将清空当前所有导入的数据、教师设置以及自动存档，且无法撤销！系统将回到初始“模式选择”界面。",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626', // 红色警示
        cancelButtonColor: '#6b7280',
        confirmButtonText: '确定清空重置',
        cancelButtonText: '取消'
    }).then(async (result) => {
        if (result.isConfirmed) {
            await DB.clear('autosave_backup');

            localStorage.removeItem('FB_DATA_BACKUP');
            localStorage.removeItem('MP_SNAPSHOTS');

            location.reload();
        }
    });
}

window.addEventListener('beforeunload', (e) => {
    if (RAW_DATA.length > 0) {
        const msg = "系统检测到您有正在处理的成绩数据，刷新或关闭页面将导致配置（如教师名单）丢失。确定离开吗？";
        e.preventDefault();
        e.returnValue = msg; // 现代浏览器大多数会展示其默认的提示语，但必须设置这个值
        return msg;
    }
});

function bindModalInteractionGuards() {
    const modalIds = [
        'drill-modal',
        'target-editor-modal',
        'teacherModal',
        'mobileShareModal',
        'mappingModal',
        'cert-modal',
        'school-profile-modal',
        'skin-modal',
        'admin-modal',
        'user-password-modal',
        'issue-submit-modal',
        'admin-issue-modal',
        'admin-log-modal',
        'account-manager-modal',
        'login-session-modal',
        'data-manager-modal'
    ];

    modalIds.forEach((id) => {
        const modal = document.getElementById(id);
        if (!modal || modal.dataset.modalGuardBound === '1') return;
        modal.dataset.modalGuardBound = '1';

        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });

        const content = modal.querySelector('.modal-content');
        if (content && content.dataset.modalGuardBound !== '1') {
            content.dataset.modalGuardBound = '1';
            content.addEventListener('click', (event) => {
                event.stopPropagation();
            });
        }
    });
}

window.bindModalInteractionGuards = bindModalInteractionGuards;
window.addEventListener('load', () => {
    const style = document.createElement('style');
    style.innerHTML = `
            .table-wrap {
                max-height: none !important;
                height: auto !important;
                overflow-y: visible !important;
                display: block !important;
            }
            /* 防止 rank2Rate 计算错误导致行隐藏 */
            tr { display: table-row !important; }
        `;
    document.head.appendChild(style);
    appDebug("✅ 已强制解除表格高度限制");
    applyExamMetaUI();
    applyArchiveLockUI();
    if (typeof CohortDB !== 'undefined') CohortDB.renderExamList();
    updateIndicatorUIState();
    ['exam-year', 'exam-term', 'exam-type', 'exam-name', 'exam-date', 'exam-reset-point'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('change', refreshExamGradePreview);
    });
    renderAutoSnapshotsUI();
    updateAdminOnlyButtons();
    updateWatermark();
    if (Auth?.currentUser && !ensureCurrentCohortIdentity()) {
        showCohortPicker();
    }
    bindModalInteractionGuards();
});
document.addEventListener('DOMContentLoaded', () => {
    bindModalInteractionGuards();
});

function openCloudRollback() {
    const user = Auth?.currentUser;
    if (!user) return alert('请先登录');
    if (user.role !== 'admin') return alert('⛔ 权限不足');
    const modal = document.getElementById('data-manager-modal');
    if (modal) modal.style.display = 'flex';
    if (typeof DataManager !== 'undefined') {
        DataManager.switchTab('cloud');
        setTimeout(() => {
            const chkSnap = document.getElementById('cloud-filter-snapshots');
            const chkCur = document.getElementById('cloud-filter-current');
            if (chkSnap) chkSnap.checked = true;
            if (chkCur) chkCur.checked = true;
            DataManager.renderCloudBackups();
        }, 100);
    }
}

function updateAdminOnlyButtons() {
    const user = Auth?.currentUser;
    const btn = document.getElementById('btn-cloud-rollback');
    if (!btn) return;
    btn.style.display = (user && user.role === 'admin') ? 'inline-flex' : 'none';
}

function updateWatermark() {
    const layer = document.getElementById('watermark-layer');
    if (!layer) return;
    if (document.visibilityState === 'hidden') return;
    const user = window.Auth?.currentUser;
    const name = user?.name || '未登录';
    const ts = new Date().toLocaleString();
    const text = `${name} | ${ts} | 内部资料`;
    if (layer.dataset.watermarkText === text) return;
    layer.dataset.watermarkText = text;

    const svg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="320" height="220">
                <style>
                    text { font: 14px 'Microsoft YaHei', Arial, sans-serif; fill: rgba(0,0,0,0.6); }
                </style>
                <g transform="rotate(-20 160 110)">
                    <text x="10" y="80">${text}</text>
                    <text x="10" y="160">${text}</text>
                </g>
            </svg>
        `;
    const encoded = encodeURIComponent(svg).replace(/'/g, '%27').replace(/"/g, '%22');
    layer.style.backgroundImage = `url("data:image/svg+xml,${encoded}")`;
}

let watermarkTimer = 0;
function syncWatermarkTimer() {
    if (document.visibilityState === 'hidden') {
        if (watermarkTimer) {
            clearInterval(watermarkTimer);
            watermarkTimer = 0;
        }
        return;
    }
    updateWatermark();
    if (!watermarkTimer) watermarkTimer = setInterval(updateWatermark, 60000);
}

document.addEventListener('visibilitychange', syncWatermarkTimer);
syncWatermarkTimer();

// Moved to cohort-exam-meta-runtime.js (COHORT_STORAGE_KEY, CohortManager, buildExamKey, applyArchiveLockUI)
// Moved to cohort-db-core-runtime.js (CohortDB)
// Moved to snapshot-system-runtime.js (getCurrentSnapshotPayload, createAutoSnapshot, applySnapshotPayload, saveProjectSnapshot)
function openTargetEditor() {
    if (Object.keys(SCHOOLS).length === 0) return alert("请先上传成绩数据，系统需要读取学校列表。");

    ensureNormalizedTargets();
    const tbody = document.querySelector('#target-editor-table tbody');
    tbody.innerHTML = '';

    const targetRowsHtml = Object.keys(SCHOOLS).map(sch => {
        const t = getTargetConfigBySchool(sch).value || { t1: 0, t2: 0 };

        return `
                <tr data-school="${sch}">
                    <td style="font-weight:bold;">${sch}</td>
                    <td>
                        <input type="number" class="inp-t1" value="${t.t1}" style="width:80px; text-align:center; border:1px solid #93c5fd;">
                    </td>
                    <td>
                        <input type="number" class="inp-t2" value="${t.t2}" style="width:80px; text-align:center; border:1px solid #fdba74;">
                    </td>
                </tr>
            `;
    });
    tbody.innerHTML = targetRowsHtml.join('');

    document.getElementById('target-editor-modal').style.display = 'flex';
}

function saveTargetEditor() {
    const rows = document.querySelectorAll('#target-editor-table tbody tr');
    let updateCount = 0;

    setTargetsState(ensureNormalizedTargets());

    rows.forEach(tr => {
        const sch = getCanonicalSchoolName(tr.dataset.school, [...Object.keys(readTargetsState() || {}), ...Object.keys(SCHOOLS || {}), tr.dataset.school]);
        const t1 = parseInt(tr.querySelector('.inp-t1').value) || 0;
        const t2 = parseInt(tr.querySelector('.inp-t2').value) || 0;

        readTargetsState()[sch] = { t1: t1, t2: t2 };
        updateCount++;
    });

    setTargetsState(ensureNormalizedTargets());

    document.getElementById('target-editor-modal').style.display = 'none';

    UI.toast(`✅ 已更新 ${updateCount} 所学校的目标设定`, "success");

    const { r1, r2 } = getIndicatorRankParams();
    if (r1 && r2) {
        calcIndicators();
    } else {
        alert("目标已保存！\n请记得在上方输入框设置【划线名次】，然后点击【开始计算】。");
    }
}

document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openSpotlight();
    }
    if (e.key === 'Escape') {
        closeSpotlight();
        const modals = Array.from(document.querySelectorAll('.modal'))
            .filter(m => m.style.display !== 'none' && m.style.display !== '')
            .sort((a, b) => {
                const zA = parseInt(window.getComputedStyle(a).zIndex) || 0;
                const zB = parseInt(window.getComputedStyle(b).zIndex) || 0;
                return zB - zA;
            });

        if (modals.length > 0) {
            modals[0].style.display = 'none';
            e.preventDefault();
            return;
        }
    }

    const spotlightBox = document.getElementById('spotlight-mask');
    if (spotlightBox && spotlightBox.style.display === 'flex') {
        const resultsDiv = document.getElementById('spotlight-results');
        const items = resultsDiv.querySelectorAll('.spotlight-item');
        if (items.length === 0) return;

        let activeIdx = Array.from(items).findIndex(el => el.classList.contains('active'));

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIdx = (activeIdx + 1) % items.length;
            updateSpotlightSelection(items, activeIdx);
            return;
        }
        if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIdx = (activeIdx - 1 + items.length) % items.length;
            updateSpotlightSelection(items, activeIdx);
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            if (activeIdx >= 0 && items[activeIdx]) items[activeIdx].click();
            return;
        }
    }

    if (e.key !== 'Enter' || e.isComposing) return;

    const target = e.target;
    if (!target || target.isContentEditable) return;
    if (target.closest && target.closest('.swal2-container')) return;

    const tag = String(target.tagName || '').toUpperCase();
    if (tag === 'TEXTAREA') return;

    const role = target.getAttribute ? target.getAttribute('role') : '';
    if (role === 'button' && target.id !== 'uploadBox') {
        e.preventDefault();
        target.click();
        return;
    }

    if (target.id === 'uploadBox' || target.hasAttribute?.('data-upload-box')) {
        e.preventDefault();
        const fileInput = document.getElementById('fileInput');
        if (fileInput && !fileInput.disabled) fileInput.click();
        return;
    }

    const inputType = String(target.type || '').toLowerCase();
    const isInputLike = tag === 'INPUT' || tag === 'SELECT';
    if (!isInputLike || ['checkbox', 'radio', 'file', 'button', 'submit'].includes(inputType)) return;

    const preferRe = /生成|查询|搜索|计算|保存|导出|对比|切换|应用|确认|开始|诊断|加载|同步|分析|查看/;
    const skipRe = /取消|关闭|删除|重置|退出/;
    let node = target.closest('div, td, form') || target.parentElement || target;
    let btn = null;

    for (let depth = 0; depth < 5 && node && !btn; depth++) {
        const candidates = Array.from(node.querySelectorAll('button, .btn, [role="button"]')).filter(el => {
            if (el === target || el.disabled) return false;
            const style = window.getComputedStyle(el);
            return !(style.display === 'none' || style.visibility === 'hidden');
        });
        if (candidates.length) {
            btn = candidates.find(el => {
                const txt = String((el.innerText || el.textContent || '')).trim();
                return txt && !skipRe.test(txt) && preferRe.test(txt);
            }) || candidates[0];
        }
        node = node.parentElement;
    }

    if (!btn) return;
    e.preventDefault();
    btn.click();
});

function updateSpotlightSelection(items, index) {
    items.forEach(el => el.classList.remove('active'));
    if (items[index]) {
        items[index].classList.add('active');
        items[index].scrollIntoView({ block: 'nearest' }); // 确保可见
        items[index].style.backgroundColor = 'var(--primary-light)';
    }
}

let fuseInstance = null;

function initFuse() {
    if (!window.Fuse || RAW_DATA.length === 0) return;

    const options = {
        keys: ['name', 'id', 'class', 'school'], // 搜索字段
        threshold: 0.3, // 模糊阈值：0.0完全匹配，1.0匹配任何。0.3适合人名容错
        distance: 100,
        ignoreLocation: true, // 忽略位置，只要包含就行
        minMatchCharLength: 2
    };
    fuseInstance = new Fuse(RAW_DATA, options);
}

function doSpotlightSearch() {
    const val = document.getElementById('spotlight-input').value.trim();
    const resDiv = document.getElementById('spotlight-results');
    resDiv.innerHTML = '';
    if (!val) return;
    const spotlightRowsHtml = [];

    const modules = [
        { name: "新生分班", id: "freshman-simulator" },
        { name: "考场编排", id: "exam-arranger" },
        { name: "座位微调", id: "seat-adjustment" },
        { name: "教师分析", id: "teacher-analysis" },
        { name: "进退步追踪", id: "progress-analysis" },
        { name: "两率一分(宏观)", id: "analysis" },
        { name: "临界生任务单", id: "marginal-push" },
        { name: "学生成绩单", id: "report-generator" }
    ];

    modules
        .filter(m => typeof canAccessModule !== 'function' || canAccessModule(m.id))
        .forEach(m => {
        if (m.name.includes(val)) {
            spotlightRowsHtml.push(`
                    <div class="spotlight-item" onclick="switchTab('${m.id}');closeSpotlight()">
                        <span>🛠️ 功能：${m.name}</span>
                        <span style="font-size:10px;color:#999">跳转</span>
                    </div>`);
        }
    });

    let matches = [];

    if (!fuseInstance && RAW_DATA.length > 0) initFuse();

    if (fuseInstance) {
        const results = fuseInstance.search(val);
        matches = results.map(r => r.item).slice(0, 8); // 取前8个
    } else {
        matches = RAW_DATA.filter(s => s.name.includes(val) || String(s.id).includes(val)).slice(0, 5);
    }
    if (window.PermissionPolicy && typeof window.PermissionPolicy.filterStudentRows === 'function') {
        const currentUser = typeof getCurrentUser === 'function'
            ? getCurrentUser()
            : (window.AuthState && typeof window.AuthState.getCurrentUser === 'function'
                ? window.AuthState.getCurrentUser()
                : (typeof Auth !== 'undefined' ? Auth.currentUser : null));
        matches = window.PermissionPolicy.filterStudentRows(currentUser, matches);
    }

    if (matches.length === 0) {
        spotlightRowsHtml.push(`<div style="padding:10px; text-align:center; color:#999;">无匹配结果</div>`);
    } else {
        matches.forEach(s => {
            spotlightRowsHtml.push(`
                    <div class="spotlight-item" onclick="jumpToStudent(${jsStringLiteral(s.name)}, ${jsStringLiteral(s.school)}, ${jsStringLiteral(s.class)})">
                        <span>👤 ${s.name} <small style="color:#666">(${s.school} ${s.class})</small></span>
                        <span style="font-weight:bold;">${s.total}分</span>
                    </div>`);
        });
    }
    resDiv.innerHTML = spotlightRowsHtml.join('');
}

function ensureAuthCurrentUserFromSession() {
    let sessionUser = null;
    try {
        if (window.AuthState && typeof window.AuthState.getCurrentUser === 'function') {
            sessionUser = window.AuthState.getCurrentUser();
        }
    } catch (_) {
        sessionUser = null;
    }

    if (typeof Auth !== 'undefined' && Auth) {
        if (!Auth.currentUser && sessionUser) {
            Auth.currentUser = sessionUser;
        }
        return Auth.currentUser || sessionUser || null;
    }
    return sessionUser || null;
}

function refreshAuthRoleViewFromSession() {
    const user = ensureAuthCurrentUserFromSession();
    if (!user) return null;
    if (typeof Auth !== 'undefined' && Auth && typeof Auth.applyRoleView === 'function') {
        Auth.applyRoleView();
    }
    if (typeof updateRoleHint === 'function') {
        updateRoleHint();
    }
    return user;
}

function updateRoleHint() {
    const targets = [
        document.getElementById('role-hint'),
        document.getElementById('role-hint-sidebar'),
        document.getElementById('shell-role-pill')
    ].filter(Boolean);
    if (targets.length === 0) return;
    const user = ensureAuthCurrentUserFromSession();

    const roleMap = {
        admin: '管理员',
        director: '教务主任',
        grade_director: '级部主任',
        class_teacher: '班主任',
        teacher: '任课教师',
        parent: '家长',
        guest: '访客'
    };

    if (user && typeof RoleManager !== 'undefined') {
        const roles = RoleManager.getUserRoles(user);
        if (roles.length > 1) {
            const roleLabels = roles.map(r => roleMap[r] || r).join(' + ');
            targets.forEach((el) => {
                el.textContent = `角色：${roleLabels}`;
                el.title = `您拥有多个角色：${roles.join(', ')}`;
            });
        } else {
            const role = roles[0] || 'guest';
            targets.forEach((el) => {
                el.textContent = `角色：${roleMap[role] || role}`;
            });
        }
    } else {
        const role = user?.role || 'guest';
        targets.forEach((el) => {
            el.textContent = `角色：${roleMap[role] || role}`;
        });
    }
    syncShellChromeBridge();
}

function getCurrentUser() {
    window.getCurrentUser = getCurrentUser;
    return ensureAuthCurrentUserFromSession();
}


function openStarterGuide() {
    if (typeof Swal === 'undefined') {
        alert('新教师上手引导：\n1. 选择【届别】与【学期】\n2. 导入成绩表\n3. 导入任课表并同步\n4. 选择本校\n5. 进入教师画像查看结果');
        localStorage.setItem('HAS_SEEN_STARTER', '1');
        return;
    }
    Swal.fire({
        title: '🧭 新教师上手引导',
        html: `
                <ol style="text-align:left; line-height:1.8; font-size:13px; color:#475569;">
                    <li>选择【届别】与【学期】</li>
                    <li>在“数据上传与设置”导入成绩表</li>
                    <li>在“教师任课”导入任课表并同步</li>
                    <li>选择本校</li>
                    <li>进入“教师教学质量画像”查看结果</li>
                </ol>
            `,
        confirmButtonText: '我知道了',
        confirmButtonColor: '#0ea5e9'
    });
    localStorage.setItem('HAS_SEEN_STARTER', '1');
}

async function runAutoDiagnosis() {
    const termId = readCurrentTermId() || (typeof getTermId === 'function' ? getTermId(getExamMetaFromUI()) : '');
    const hasScores = RAW_DATA && RAW_DATA.length > 0;
    const hasTeachers = window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0;
    const hasSchool = !!MY_SCHOOL;

    let cloudStatus = { text: '未连接', badge: 'badge-err' };
    if (window.CloudApi || window.sbClient) {
        try {
            const { error } = await selectSystemDataRecords({
                select: 'key',
                limit: 1
            });
            cloudStatus = error ? { text: '连接成功但可能无权限', badge: 'badge-warn' } : { text: '连接正常', badge: 'badge-ok' };
        } catch (e) {
            cloudStatus = { text: '连接异常', badge: 'badge-err' };
        }
    }

    const html = `
            <div style="text-align:left; font-size:13px; color:#475569; line-height:1.8;">
                <div>学期：${termId || '未选择'} ${termId ? '<span class="status-badge badge-ok">通过</span>' : '<span class="status-badge badge-err">缺失</span>'}</div>
                <div>本校：${hasSchool ? MY_SCHOOL : '未选择'} ${hasSchool ? '<span class="status-badge badge-ok">通过</span>' : '<span class="status-badge badge-err">缺失</span>'}</div>
                <div>成绩数据：${hasScores ? RAW_DATA.length + ' 条' : '未导入'} ${hasScores ? '<span class="status-badge badge-ok">通过</span>' : '<span class="status-badge badge-err">缺失</span>'}</div>
                <div>任课表：${hasTeachers ? Object.keys(TEACHER_MAP).length + ' 条' : '未导入'} ${hasTeachers ? '<span class="status-badge badge-ok">通过</span>' : '<span class="status-badge badge-err">缺失</span>'}</div>
                <div>云端权限：${cloudStatus.text} <span class="status-badge ${cloudStatus.badge}">诊断</span></div>
            </div>
        `;

    const resultEl = document.getElementById('starter-diagnose-result');
    if (resultEl) resultEl.innerHTML = html;

    Swal.fire({
        title: '🧪 系统诊断结果',
        html,
        width: 620,
        confirmButtonText: '知道了',
        confirmButtonColor: '#4f46e5'
    });
}

async function loadDemoData() {
    const demoSchool = DEFAULT_MY_SCHOOL_NAME;
    const subjects = ['语文', '数学', '英语', '物理', '化学', '生物', '政治', '历史', '地理'];
    const cohorts = ['2022', '2023', '2024'];
    const teachers = ['张伟', '王芳', '李娜', '刘强', '陈静', '杨敏', '黄磊', '赵磊', '周涛', '吴洋', '孙丽', '胡勇'];

    setSubjects(subjects);
    setRawData([]);
    setSchools({});
    setThresholds({
        '总分': { excellent: 650, pass: 420 },
        '语文': { excellent: 108, pass: 72 },
        '数学': { excellent: 108, pass: 72 },
        '英语': { excellent: 108, pass: 72 }
    });

    let studentId = 1;
    const teacherAssignments = {};

    function generateChineseName() {
        const familyNames = "赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜";
        const givenNames = "嘉懿煜城懿轩烨华煜祺智宸正豪昊然志泽明杰弘文熠彤鸿煊远航旭尧";
        const f = familyNames[Math.floor(Math.random() * familyNames.length)];
        const g1 = givenNames[Math.floor(Math.random() * givenNames.length)];
        const g2 = Math.random() > 0.3 ? givenNames[Math.floor(Math.random() * givenNames.length)] : "";
        return f + g1 + g2;
    }

    ['9', '8', '7'].forEach((gradeLevel, gIdx) => {
        const cohort = cohorts[gIdx];
        const classCount = 4;

        for (let cNum = 1; cNum <= classCount; cNum++) {
            const cls = `${gradeLevel}.${cNum}`;

            subjects.forEach(sub => {
                const tName = teachers[Math.floor(Math.random() * teachers.length)];
                teacherAssignments[`${cls}_${sub}`] = tName;
            });

            for (let i = 0; i < 40; i++) {
                const stu = {
                    id: `S${String(studentId).padStart(5, '0')}`,
                    name: generateChineseName(),
                    school: demoSchool,
                    class: cls,
                    cohort: cohort,
                    scores: {},
                    total: 0
                };

                subjects.forEach(sub => {
                    const base = 65 + Math.random() * 30;
                    const bonus = Math.random() > 0.8 ? 5 : 0;
                    stu.scores[sub] = Math.floor(Math.min(120, Math.max(20, base + bonus + (Math.random() * 10 - 5))));
                    stu.total += stu.scores[sub];
                });

                RAW_DATA.push(stu);
                if (!SCHOOLS[demoSchool]) SCHOOLS[demoSchool] = { name: demoSchool, students: [], metrics: {}, rankings: {} };
                SCHOOLS[demoSchool].students.push(stu);
                studentId++;
            }
        }
    });

    setTeacherMap(teacherAssignments);
    writeCurrentSchool(demoSchool);
    writeCurrentTermId('2025-2026_上学期');

    CURRENT_COHORT_ID = '2022';
    CURRENT_EXAM_ID = '2026_校内首模';

    syncWorkspaceRuntimeState({
        currentCohortId: CURRENT_COHORT_ID,
        currentExamId: CURRENT_EXAM_ID,
        cohortDb: COHORT_DB
    });

    if (window.UI) UI.toast('✨ 演示环境已就绪，所有模块均已载入模拟数据', 'success');

    await processData();
    calculateRankings();
    analyzeTeachers();
    renderTeacherComparisonTable();
    renderTeacherCards();
    updateStatusPanel();
}

async function openTeacherSync() {
    const user = getCurrentUser();
    const role = user?.role || 'guest';
    const preferredTerm = getPreferredTeacherTermId() || pickAutoTeacherTerm();

    try {
        if (preferredTerm && applyTeacherTermWithoutPrompt(preferredTerm)) {
            if (window.DataManager && typeof DataManager.renderDataManagerStatus === 'function') DataManager.renderDataManagerStatus();
            if (window.UI) UI.toast(`已恢复 ${preferredTerm} 的任课表`, 'success');
            return;
        }

        if (window.CloudManager && typeof CloudManager.loadTeachers === 'function') {
            if (window.UI) UI.toast(preferredTerm ? `正在同步 ${preferredTerm} 的任课表...` : '正在同步任课表...', 'info');
            await CloudManager.loadTeachers();
            if (preferredTerm && applyTeacherTermWithoutPrompt(preferredTerm)) {
                if (window.DataManager && typeof DataManager.renderDataManagerStatus === 'function') DataManager.renderDataManagerStatus();
                if (window.UI) UI.toast(`已从云端恢复 ${preferredTerm} 的任课表`, 'success');
                return;
            }
            if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) {
                if (window.DataManager && typeof DataManager.renderDataManagerStatus === 'function') DataManager.renderDataManagerStatus();
                if (window.UI) UI.toast('任课表已同步到当前页面', 'success');
                return;
            }
        }

        if (role === 'teacher' || role === 'class_teacher') {
            if (window.UI) UI.toast('当前学期暂无可用任课表，请联系管理员在“教师任课”中导入或同步', 'warning');
            return;
        }

        if (window.DataManager && typeof DataManager.open === 'function') {
            DataManager.open();
            DataManager.switchTab('teacher');
        } else {
            switchTab('upload');
        }
    } catch (err) {
        console.error('openTeacherSync failed:', err);
        if (window.UI) {
            UI.toast(`任课表同步失败：${err?.message || err}`, 'error');
            return;
        }
        alert(`任课表同步失败：${err?.message || err}`);
    }
}


if (typeof DataManager !== 'undefined') {
    DataManager.isGrade9Context = function () {
        return requireDataManagerGrade9TemplateRuntime().isGrade9Context(this);
    };

    DataManager.getGrade9TemplateKey = function (type) {
        return requireDataManagerGrade9TemplateRuntime().getGrade9TemplateKey(this, type);
    };

    DataManager.restoreGrade9IndicatorTemplate = function () {
        return requireDataManagerGrade9TemplateRuntime().restoreGrade9IndicatorTemplate(this);
    };

    DataManager.persistGrade9IndicatorTemplate = function () {
        return requireDataManagerGrade9TemplateRuntime().persistGrade9IndicatorTemplate(this);
    };

    DataManager.restoreGrade9TargetsTemplate = function () {
        return requireDataManagerGrade9TemplateRuntime().restoreGrade9TargetsTemplate(this);
    };

    DataManager.persistGrade9TargetsTemplate = function () {
        return requireDataManagerGrade9TemplateRuntime().persistGrade9TargetsTemplate(this);
    };

    DataManager.renderParams = function () {
        return requireDataManagerParamsRuntime().renderParams(this);
    };

    DataManager.saveParamsLocally = async function (skipCloudSync = false) {
        return requireDataManagerParamsRuntime().saveParamsLocally(this, skipCloudSync);
    };

    DataManager.renderTargets = function () {
        return requireDataManagerTargetsRuntime().renderTargets(this);
    };

    DataManager.editTarget = function (schoolName) {
        return requireDataManagerTargetsRuntime().editTarget(this, schoolName);
    };

    DataManager.deleteTarget = async function (schoolName) {
        return requireDataManagerTargetsRuntime().deleteTarget(this, schoolName);
    };

    DataManager.handleTargetUpload = function (input) {
        return requireDataManagerTargetsRuntime().handleTargetUpload(this, input);
    };

    DataManager.renderSchoolAliasMappings = function () {
        return requireDataManagerSchoolAliasRuntime().renderSchoolAliasMappings(this);
    };

    DataManager.syncSchoolAliasSettingsFromGateway = async function () {
        return requireDataManagerSchoolAliasRuntime().syncSchoolAliasSettingsFromGateway(this);
    };

    DataManager.persistSchoolAliasSettings = async function () {
        return requireDataManagerSchoolAliasRuntime().persistSchoolAliasSettings(this);
    };

    DataManager.openSchoolAliasEditor = function (index = -1) {
        return requireDataManagerSchoolAliasRuntime().openSchoolAliasEditor(this, index);
    };

    DataManager.deleteSchoolAliasMapping = async function (index) {
        return requireDataManagerSchoolAliasRuntime().deleteSchoolAliasMapping(this, index);
    };

    DataManager.saveAndSync = async function () {
        return requireDataManagerSaveSyncRuntime().saveAndSync(this);
    };

    DataManager.handleHistoryUpload = function (input) {
        return requireDataManagerHistoryRuntime().handleHistoryUpload(this, input);
    };

    DataManager.renderHistoryPreview = function () {
        return requireDataManagerHistoryRuntime().renderHistoryPreview(this);
    };

    DataManager.renderCurrentTab = function () {
        return requireDataManagerTabRuntime().renderCurrentTab(this);
    };

    DataManager.updatePaginationUI = function (totalPages) {
        return requireDataManagerTabRuntime().updatePaginationUI(this, totalPages);
    };

    DataManager.renderStudents = function (keyword) {
        return requireDataManagerStudentRuntime().renderStudents(this, keyword);
    };

    DataManager.toggleStudentSelection = function (inputEl) {
        return requireDataManagerStudentRuntime().toggleStudentSelection(this, inputEl);
    };

    DataManager.toggleStudentSelectAll = function (checked) {
        return requireDataManagerStudentRuntime().toggleStudentSelectAll(this, checked);
    };

    DataManager.updateStudentSelectionUI = function () {
        return requireDataManagerStudentRuntime().updateStudentSelectionUI(this);
    };

    DataManager.deleteSelectedStudents = function () {
        return requireDataManagerStudentRuntime().deleteSelectedStudents(this);
    };

    DataManager.changePage = function (delta) {
        return requireDataManagerStudentRuntime().changePage(this, delta);
    };

    DataManager.renderArchives = function () {
        return requireDataManagerArchiveRuntime().renderArchives(this);
    };

    DataManager.deleteHistoryExam = function (examName) {
        return requireDataManagerArchiveRuntime().deleteHistoryExam(this, examName);
    };

    DataManager.renameHistoryExam = function (oldName) {
        return requireDataManagerArchiveRuntime().renameHistoryExam(this, oldName);
    };

    DataManager.switchTeacherTerm = function (termId) {
        return requireDataManagerTeacherRuntime().switchTeacherTerm(this, termId);
    };

    DataManager.syncTeacherHistory = function (opts = {}) {
        return requireDataManagerTeacherRuntime().syncTeacherHistory(this, opts);
    };

    DataManager.ensureTeacherMap = function (triggerCloud) {
        return requireDataManagerTeacherRuntime().ensureTeacherMap(this, triggerCloud);
    };

    DataManager.refreshTeacherAnalysis = function () {
        return requireDataManagerTeacherRuntime().refreshTeacherAnalysis(this);
    };

    DataManager.getDataManagerSyncStorageKey = function () {
        return requireDataCloudRuntime().getDataManagerSyncStorageKey();
    };

    DataManager.getDataManagerSyncScope = function () {
        return requireDataCloudRuntime().getDataManagerSyncScope();
    };

    DataManager.readDataManagerSyncState = function () {
        return requireDataCloudRuntime().readDataManagerSyncState();
    };

    DataManager.writeDataManagerSyncState = function (patch) {
        return requireDataCloudRuntime().writeDataManagerSyncState(patch);
    };

    DataManager.getCurrentIndicatorValues = function () {
        return requireDataCloudRuntime().getCurrentIndicatorValues();
    };

    DataManager.getParamsSyncSignature = function () {
        return requireDataCloudRuntime().getParamsSyncSignature();
    };

    DataManager.getTargetsSyncSignature = function () {
        return requireDataCloudRuntime().getTargetsSyncSignature();
    };

    DataManager.buildTeacherSignature = function (teacherMap, schoolMap) {
        return requireDataCloudRuntime().buildTeacherSignature(teacherMap, schoolMap);
    };

    DataManager.getTeacherStatusSnapshot = function () {
        return requireDataCloudRuntime().getTeacherStatusSnapshot();
    };

    DataManager.rememberDataManagerSyncSnapshot = function (sourceLabel = 'save-and-sync') {
        return requireDataCloudRuntime().rememberDataManagerSyncSnapshot(this, sourceLabel);
    };

    DataManager.getDataManagerStatusModel = function () {
        return requireDataCloudRuntime().getDataManagerStatusModel(this);
    };

    DataManager.renderDataManagerStatus = function () {
        return requireDataCloudRuntime().renderDataManagerStatus(this);
    };

    if (!window.__DATA_MANAGER_CLOUD_SYNC_EVENTS__) {
        window.__DATA_MANAGER_CLOUD_SYNC_EVENTS__ = true;
        window.addEventListener('cloud-sync-state', (event) => {
            const detail = event?.detail || {};
            if (detail.mode && detail.mode !== 'workspace') return;
            if (!window.DataManager || typeof DataManager.writeDataManagerSyncState !== 'function') return;

            if (detail.stage === 'queued') {
                DataManager.writeDataManagerSyncState({
                    pendingCloudSync: true,
                    pendingSyncSource: String(detail.sourceLabel || '').trim(),
                    lastQueuedSyncAt: Date.now(),
                    lastCloudError: ''
                });
            } else if (detail.stage === 'success' || detail.stage === 'skipped') {
                DataManager.rememberDataManagerSyncSnapshot(String(detail.sourceLabel || '').trim() || 'cloud-sync');
            } else if (detail.stage === 'error') {
                DataManager.writeDataManagerSyncState({
                    pendingCloudSync: true,
                    pendingSyncSource: String(detail.sourceLabel || '').trim(),
                    lastQueuedSyncAt: Date.now(),
                    lastCloudError: String(detail.message || '').trim()
                });
            }

            if (typeof DataManager.renderDataManagerStatus === 'function') {
                DataManager.renderDataManagerStatus();
            }
        });
    }
}
function runDataDoctor() {
    if (!RAW_DATA.length) return alert("请先上传数据，医生才能进行诊断！");

    let issues = [];
    let warnings = [];
    let stats = { total: RAW_DATA.length, zeroCount: 0, highCount: 0, emptyFieldCount: 0 };

    const nameMap = {};
    RAW_DATA.forEach((s, idx) => {
        const rowNo = s.__row || (idx + 2); // 默认第2行开始是数据

        if (!s.school || !s.class || !s.name) {
            stats.emptyFieldCount++;
            issues.push(`🔴 <strong>关键字段缺失：</strong> 行 ${rowNo} 学校/班级/姓名为空`);
            return;
        }

        const key = `${s.school}_${s.class}_${s.name}`;
        if (!nameMap[key]) nameMap[key] = [];
        nameMap[key].push(rowNo);
    });

    Object.entries(nameMap).forEach(([key, rows]) => {
        if (rows.length > 1) {
            const [school, cls, name] = key.split('_');
            issues.push(`🔴 <strong>重复录入/同名：</strong> ${school} ${cls}班 "${name}" 行号: ${rows.join('、')}`);
        }
    });

    RAW_DATA.forEach((s, idx) => {
        const rowNo = s.__row || (idx + 2);
        if (typeof s.total === 'number' && s.total <= 0) stats.zeroCount++;
        if (s.total !== undefined && s.total !== null && isNaN(Number(s.total))) {
            issues.push(`🔴 <strong>总分非数值：</strong> 行 ${rowNo} ${s.name || '未知姓名'} (total = ${s.total})`);
        }

        SUBJECTS.forEach(sub => {
            const val = s.scores ? s.scores[sub] : undefined;
            if (val === undefined || val === null || val === '') {
                warnings.push(`🟠 <strong>科目缺失：</strong> 行 ${rowNo} ${s.name || '未知姓名'} 未填写 ${sub}`);
                return;
            }
            if (isNaN(Number(val))) {
                issues.push(`🔴 <strong>分数非数值：</strong> 行 ${rowNo} ${s.name || '未知姓名'} (${sub} = ${val})`);
                return;
            }
            if (Number(val) < 0) issues.push(`🔴 <strong>负分异常：</strong> 行 ${rowNo} ${s.name || '未知姓名'} (${sub} = ${val})`);
            const configuredFullScore = window.AnalyticsKernel?.getSubjectFullScore?.(sub, { config: CONFIG });
            const maxScore = Number.isFinite(Number(configuredFullScore)) ? Number(configuredFullScore) : 150;
            if (Number(val) > maxScore) warnings.push(`🟠 <strong>超满分预警：</strong> 行 ${rowNo} ${s.name || '未知姓名'} (${sub} = ${val}，满分 ${maxScore}) - 请确认是否录入错误？`);
        });
    });

    Object.values(SCHOOLS).forEach(sch => {
        const clsCounts = {};
        sch.students.forEach(s => clsCounts[s.class] = (clsCounts[s.class] || 0) + 1);
        Object.entries(clsCounts).forEach(([cls, count]) => {
            if (count < 10) warnings.push(`🟠 <strong>班级人数过少：</strong> ${sch.name} ${cls} 仅 ${count} 人。`);
            if (count > 70) warnings.push(`🟠 <strong>班级人数过多：</strong> ${sch.name} ${cls} 达 ${count} 人。`);
        });
    });

    let reportHtml = `<div style="text-align:left; max-height:400px; overflow-y:auto;">`;

    if (issues.length === 0 && warnings.length === 0) {
        reportHtml += `<div style="text-align:center; padding:20px; color:#16a34a;">
                <i class="ti ti-heart-rate-monitor" style="font-size:48px;"></i><br>
                <h3>数据非常健康！</h3>
                <p>共检测 ${stats.total} 条数据，未发现明显异常。</p>
            </div>`;
    } else {
        reportHtml += `<p>共检测 <strong>${stats.total}</strong> 名学生。</p>`;
        if (stats.emptyFieldCount > 0) {
            reportHtml += `<p style="color:#b91c1c;">关键字段缺失：<strong>${stats.emptyFieldCount}</strong> 条</p>`;
        }

        if (issues.length > 0) {
            reportHtml += `<h4 style="color:#dc2626; margin-top:10px;">❌ 必须处理的错误 (${issues.length})</h4>`;
            reportHtml += `<ul style="color:#b91c1c; background:#fee2e2; padding:10px 20px; border-radius:6px;">`;
            issues.slice(0, 10).forEach(i => reportHtml += `<li>${i}</li>`);
            if (issues.length > 10) reportHtml += `<li>...等共 ${issues.length} 项</li>`;
            reportHtml += `</ul>`;
        }

        if (warnings.length > 0) {
            reportHtml += `<h4 style="color:#b45309; margin-top:10px;">⚠️ 值得注意的预警 (${warnings.length})</h4>`;
            reportHtml += `<ul style="color:#92400e; background:#fffbeb; padding:10px 20px; border-radius:6px;">`;
            warnings.slice(0, 10).forEach(w => reportHtml += `<li>${w}</li>`);
            if (warnings.length > 10) reportHtml += `<li>...等共 ${warnings.length} 项</li>`;
            reportHtml += `</ul>`;
        }
    }
    reportHtml += `</div>`;

    Swal.fire({
        title: '🏥 数据体检报告',
        html: reportHtml,
        icon: issues.length > 0 ? 'error' : (warnings.length > 0 ? 'warning' : 'success'),
        confirmButtonText: '确定',
        width: 600
    });
}

window.addEventListener('load', () => {
    setTimeout(() => {
        const modalIds = [
            'issue-submit-modal',   // 成绩核查申诉弹窗
            'admin-issue-modal',    // 管理员申诉处理弹窗
            'user-password-modal',  // 修改密码弹窗
            'account-manager-modal', // 账号管理弹窗
            'login-session-modal' // 登录状态弹窗
        ];

        modalIds.forEach(id => {
            const el = document.getElementById(id);
            if (el && el.parentNode !== document.body) {
                appDebug(`🔧 [AutoFix] 正在修复弹窗 DOM 位置: ${id}`);
                document.body.appendChild(el); // 移动到 body 末尾
            }
        });
    }, 1000); // 延迟 1 秒执行
});
window.DataManager = DataManager;
window.DrillSystem = DrillSystem;
if (!window.CohortGrowth) {
    console.warn('[cohort-growth] runtime unavailable; cohort growth module will lazy-load via boot runtime.');
}
if (typeof window.wrapXlsxRuntimeExports === 'function') window.wrapXlsxRuntimeExports();

(function autoTriggerDemoMode() {
    const user = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
    const hasData = Array.isArray(window.RAW_DATA) && window.RAW_DATA.length > 0;

    if (user && user.id === 'demo-admin' && !hasData) {
        appDebug('[DemoMode] Auto-triggering demo data load for demo-admin');
        window.setTimeout(() => {
            if (typeof loadDemoData === 'function') {
                loadDemoData();
            }
        }, 1500);
    }
})();
