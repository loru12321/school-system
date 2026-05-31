
const UI = {
    // 1. 加载动画控制
    loading: (show, text = '系统正在处理数据...') => {
        const loader = document.getElementById('global-loader');
        const txt = document.getElementById('loader-text');
        if (show) {
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
    // 2. 消息提示控制
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
    },
    alert: async (message, type = 'info') => {
        if (window.Swal && typeof window.Swal.fire === 'function') {
            await window.Swal.fire({
                icon: type === 'error' ? 'error' : type === 'success' ? 'success' : 'info',
                title: type === 'error' ? '操作未完成' : '提示',
                text: String(message || ''),
                confirmButtonText: '确定'
            });
            return;
        }
        window.alert(String(message || ''));
    },
    confirm: async (message, options = {}) => {
        if (window.Swal && typeof window.Swal.fire === 'function') {
            const result = await window.Swal.fire({
                icon: options.icon || 'warning',
                title: options.title || '请确认',
                text: String(message || ''),
                showCancelButton: true,
                confirmButtonText: options.confirmText || '确认',
                cancelButtonText: options.cancelText || '取消',
                reverseButtons: true
            });
            return !!result.isConfirmed;
        }
        return window.confirm(String(message || ''));
    },
    prompt: async (message, defaultValue = '', options = {}) => {
        if (window.Swal && typeof window.Swal.fire === 'function') {
            const result = await window.Swal.fire({
                icon: options.icon || 'question',
                title: options.title || '请输入',
                text: String(message || ''),
                input: options.input || 'text',
                inputValue: String(defaultValue || ''),
                inputAttributes: options.inputAttributes || {},
                showCancelButton: true,
                confirmButtonText: options.confirmText || '确认',
                cancelButtonText: options.cancelText || '取消',
                inputValidator: options.inputValidator
            });
            return result.isConfirmed ? result.value : null;
        }
        return window.prompt(String(message || ''), String(defaultValue || ''));
    }
};


const EdgeGateway = {
    tokenStorageKey: 'EDGE_GATEWAY_TOKEN_V1',
    userStorageKey: 'EDGE_GATEWAY_USER_V1',
    resolvedGatewayUrl: '',
    normalizeGatewayUrl: function (url) {
        return String(url || '').trim().replace(/\/$/, '');
    },
    getGatewayCandidates: function () {
        const candidates = [];
        const pushCandidate = (value) => {
            const normalized = this.normalizeGatewayUrl(value);
            if (!normalized || candidates.includes(normalized)) return;
            candidates.push(normalized);
        };
        if (isLocalFileRuntimeForApp()) {
            if (typeof window.__DIRECT_EDGE_GATEWAY_URL !== 'undefined') {
                pushCandidate(window.__DIRECT_EDGE_GATEWAY_URL);
            } else if (typeof DIRECT_EDGE_GATEWAY_URL !== 'undefined') {
                pushCandidate(DIRECT_EDGE_GATEWAY_URL);
            }
            return candidates;
        }

        // Priority 1: Direct Cloudflare Gateway (resilient to DNS/Proxy issues)
        if (typeof window.DIRECT_CLOUDFLARE_GATEWAY_URL !== 'undefined') {
            pushCandidate(window.DIRECT_CLOUDFLARE_GATEWAY_URL);
        } else if (typeof DIRECT_CLOUDFLARE_GATEWAY_URL !== 'undefined') {
            pushCandidate(DIRECT_CLOUDFLARE_GATEWAY_URL);
        }

        // Priority 2: Standard candidates
        pushCandidate(this.resolvedGatewayUrl);
        pushCandidate(localStorage.getItem('EDGE_GATEWAY_URL'));
        pushCandidate(window.EDGE_GATEWAY_URL);

        // Fallback constant if defined
        if (typeof DIRECT_EDGE_GATEWAY_URL !== 'undefined') {
            pushCandidate(DIRECT_EDGE_GATEWAY_URL);
        }

        return candidates;
    },
    getGatewayUrl: function () {
        return this.getGatewayCandidates()[0] || '';
    },
    isHostedGatewayUrl: function (url) {
        try {
            const parsed = new URL(url, window.location.href);
            return parsed.origin === window.location.origin || parsed.pathname === '/api/edu-gateway';
        } catch (e) {
            return false;
        }
    },
    getPublishableKey: function () {
        return String(
            localStorage.getItem('CLOUD_API_KEY')
            || localStorage.getItem('SUPABASE_KEY')
            || window.CLOUD_API_KEY
            || window.SUPABASE_KEY
            || ''
        ).trim();
    },
    getToken: function () {
        return String(sessionStorage.getItem(this.tokenStorageKey) || '').trim();
    },
    setToken: function (token) {
        if (!token) return;
        sessionStorage.setItem(this.tokenStorageKey, String(token).trim());
    },
    clearSession: function () {
        sessionStorage.removeItem(this.tokenStorageKey);
        sessionStorage.removeItem(this.userStorageKey);
    },
    hasGatewayConfig: function () {
        const urls = this.getGatewayCandidates();
        return !!(urls.length && (this.getPublishableKey() || urls.some(url => this.isHostedGatewayUrl(url))));
    },
    canUseAuthorizedRequests: function () {
        return this.hasGatewayConfig() && !!this.getToken();
    },
    shouldRetryRequest: function (status, message) {
        if (status === 404 || status >= 500) return true;
        const text = String(message || '').trim().toLowerCase();
        return text.includes('function not found')
            || text.includes('edge_gateway_http_404')
            || text.includes('failed to fetch')
            || text.includes('abort')
            || text.includes('timeout')
            || text.includes('networkerror');
    },
    buildLoginClassCandidates: function (className = '') {
        const rawValue = String(className || '').trim();
        const candidates = [];
        const push = (value) => {
            const normalized = String(value || '').trim();
            if (!normalized || candidates.includes(normalized)) return;
            candidates.push(normalized);
        };

        if (!rawValue) return [''];

        push(rawValue);

        const normalized = (typeof AuthState !== 'undefined' && AuthState && typeof AuthState.normalizeClassName === 'function')
            ? AuthState.normalizeClassName(rawValue)
            : rawValue;
        push(normalized);

        const digitsOnly = String(normalized || rawValue).replace(/\D/g, '');
        if (/^[6-9]\d{1,3}$/.test(digitsOnly)) {
            const grade = digitsOnly.charAt(0);
            const classNumber = String(Number(digitsOnly.slice(1)));
            const paddedClassNumber = classNumber.padStart(2, '0');
            push(`${grade}.${classNumber}`);
            push(`${grade}.${paddedClassNumber}`);
            push(`${grade}${classNumber}`);
            push(`${grade}${paddedClassNumber}`);
            push(`${grade}-${classNumber}`);
            push(`${grade}/${classNumber}`);
            push(`${grade}.${classNumber}班`);
        } else if (digitsOnly) {
            push(digitsOnly);
        }

        return candidates.length ? candidates : [rawValue];
    },
    isClassVariantRetryableError: function (message = '') {
        const text = String(message || '').trim().toLowerCase();
        return text.includes('class_name mismatch')
            || text.includes('invalid username or password');
    },
    request: async function (action, payload = {}, options = {}) {
        const urls = this.getGatewayCandidates();
        const apikey = this.getPublishableKey();
        if (!urls.length || (!apikey && !urls.some(url => this.isHostedGatewayUrl(url)))) {
            throw new Error('EDGE_GATEWAY_NOT_CONFIGURED');
        }
        const protocol = window.location.protocol;
        const origin = window.location.origin;
        appDebug(`[EdgeGateway] Requesting ${action}, Protocol: ${protocol}, Origin: ${origin}`);
        if (protocol === 'file:') {
            console.warn('[EdgeGateway] Running from file:// may trigger CORS blocks (Origin: null). Recommended: Use local web server.');
        }
        const headers = {
            'Content-Type': 'application/json'
        };
        if (apikey) headers.apikey = apikey;
        const token = options.allowAnonymous ? '' : (options.token || this.getToken());
        if (!options.allowAnonymous) {
            if (!token) throw new Error('EDGE_GATEWAY_SESSION_MISSING');
            headers.Authorization = `Bearer ${token}`;
        }
        let lastError = null;
        for (let i = 0; i < urls.length; i += 1) {
            const url = urls[i];
            appDebug(`[EdgeGateway] Attempt ${i + 1}/${urls.length}: ${url}`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 18000);
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ action, payload }),
                    signal: controller.signal
                });
                clearTimeout(timeoutId);
                let data = null;
                try {
                    data = await response.json();
                } catch (e) { }
                if (response.ok && data?.ok) {
                    this.resolvedGatewayUrl = url;
                    return data;
                }
                const message = data?.error || `EDGE_GATEWAY_HTTP_${response.status}`;
                lastError = new Error(message);
                if (i < urls.length - 1 && this.shouldRetryRequest(response.status, message)) {
                    console.warn(`[EdgeGateway] ${url} unavailable, retrying fallback endpoint`, message);
                    continue;
                }
                throw lastError;
            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error instanceof Error ? error : new Error(String(error));
                if (i < urls.length - 1 && this.shouldRetryRequest(0, lastError.message)) {
                    console.warn(`[EdgeGateway] ${url} request failed, retrying fallback endpoint`, lastError.message);
                    continue;
                }
                throw lastError;
            }
        }
        throw lastError || new Error('EDGE_GATEWAY_REQUEST_FAILED');
    },
    login: async function (username, password, className = '') {
        const classCandidates = this.buildLoginClassCandidates(className);
        let lastError = null;

        for (let index = 0; index < classCandidates.length; index += 1) {
            const currentClassName = classCandidates[index];
            try {
                const data = await this.request('login', {
                    username,
                    password,
                    class_name: currentClassName || ''
                }, { allowAnonymous: true });
                if (data?.token) this.setToken(data.token);
                if (data?.user) sessionStorage.setItem(this.userStorageKey, JSON.stringify(data.user));
                return data;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                const canRetryWithClassVariant = !!className
                    && index < classCandidates.length - 1
                    && this.isClassVariantRetryableError(lastError.message);
                if (canRetryWithClassVariant) continue;
                throw lastError;
            }
        }

        throw lastError || new Error('EDGE_GATEWAY_LOGIN_FAILED');
    },
    verify: async function () {
        return await this.request('session.verify', {});
    },
    listAliasRules: async function (extraPayload = {}) {
        return await this.request('alias.list', Object.assign({ rule_type: 'school' }, extraPayload || {}));
    },
    saveAliasRules: async function (rows, extraPayload = {}) {
        return await this.request('alias.save', Object.assign({
            rule_type: 'school',
            scope: 'global',
            replace_scope: true,
            rows: Array.isArray(rows) ? rows : []
        }, extraPayload || {}));
    },
    listWarnings: async function (payload = {}) {
        return await this.request('warning.list', payload || {});
    },
    ignoreWarning: async function (id) {
        return await this.request('warning.ignore', { id: String(id || '').trim() });
    },
    listRectifyTasks: async function (payload = {}) {
        return await this.request('rectify.list', payload || {});
    },
    saveRectifyTask: async function (payload = {}) {
        return await this.request('rectify.save', payload || {});
    },
    updateRectifyTask: async function (payload = {}) {
        return await this.request('rectify.update', payload || {});
    },
    listVersions: async function (payload = {}) {
        return await this.request('version.list', payload || {});
    },
    createVersion: async function (payload = {}) {
        return await this.request('version.create', payload || {});
    },
    updateVersion: async function (payload = {}) {
        return await this.request('version.update', payload || {});
    },
    deleteVersion: async function (id) {
        return await this.request('version.delete', { id: String(id || '').trim() });
    },
    searchAccounts: async function (keyword, payload = {}) {
        return await this.request('account.search', Object.assign({
            keyword: String(keyword || '').trim()
        }, payload || {}));
    },
    updateAccount: async function (payload = {}) {
        return await this.request('account.update', payload || {});
    },
    resetAccountPassword: async function (username, newPassword) {
        return await this.request('account.reset_password', {
            username: String(username || '').trim(),
            new_password: String(newPassword || '').trim()
        });
    },
    changeOwnPassword: async function (oldPassword, newPassword) {
        return await this.request('account.change_password', {
            old_password: String(oldPassword || '').trim(),
            new_password: String(newPassword || '').trim()
        });
    },
    exportAccounts: async function () {
        return await this.request('account.export', {});
    },
    upsertAccounts: async function (rows) {
        return await this.request('account.upsert_many', {
            rows: Array.isArray(rows) ? rows : []
        });
    },
    deleteManagedAccounts: async function () {
        return await this.request('account.delete_non_admin', {});
    },
    getAccountMigrationStatus: async function () {
        return await this.request('account.migration_status', {});
    }
};

window.EdgeGateway = EdgeGateway;

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

function isParentLikeRole(role) {
    const normalizedRole = String(role || '').trim();
    return normalizedRole === 'parent' || normalizedRole === 'student';
}

function isParentLikeUser(user) {
    if (!user || typeof user !== 'object') return false;
    const roles = Array.isArray(user.roles) && user.roles.length
        ? user.roles
        : [user.role].filter(Boolean);
    return roles.some(isParentLikeRole);
}

const MASKED_PASSWORD_DISPLAY = AuthState.MASKED_PASSWORD_DISPLAY;
const sanitizeLocalAuthDb = AuthState.sanitizeLocalAuthDb.bind(AuthState);
const persistLocalAuthDb = AuthState.persistLocalAuthDb.bind(AuthState);
const WorkspaceStateRuntime = window.WorkspaceState || null;

function createManagedTemporaryPassword(role = 'user') {
    const prefix = role === 'teacher' ? 'T' : 'U';
    const bytes = new Uint8Array(9);
    const cryptoApi = window.crypto || window.msCrypto;
    if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
        cryptoApi.getRandomValues(bytes);
    } else {
        for (let index = 0; index < bytes.length; index++) {
            bytes[index] = Math.floor(Math.random() * 256);
        }
    }
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
    const body = Array.from(bytes, value => alphabet[value % alphabet.length]).join('');
    return `${prefix}-${body}`;
}

function getRecoverableManagedPassword(record, role) {
    const password = String(AuthState.getManagedAccountPassword(record, role) || '').trim();
    if (password) return password;
    if (record && typeof record === 'object') {
        record.pass = createManagedTemporaryPassword(role);
        record.password_mode = 'temporary';
        record.must_change_password = true;
        return record.pass;
    }
    return createManagedTemporaryPassword(role);
}

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
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.setCurrentCohortId === 'function') {
        return WorkspaceStateRuntime.setCurrentCohortId(cohortId, options);
    }
    const nextId = String(cohortId || '').trim();
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
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.setCurrentExamId === 'function') {
        return WorkspaceStateRuntime.setCurrentExamId(examId);
    }
    const nextExamId = String(examId || '').trim();
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

function writeWorkspaceCohortDb(db) {
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.setCohortDb === 'function') {
        return WorkspaceStateRuntime.setCohortDb(db);
    }
    window.COHORT_DB = db || null;
    return window.COHORT_DB;
}

function syncWorkspaceRuntimeState(patch = {}) {
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.syncWorkspaceState === 'function') {
        return WorkspaceStateRuntime.syncWorkspaceState(patch);
    }
    const next = patch && typeof patch === 'object' ? patch : {};
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

Object.assign(window, {
    normalizeAppSchoolName,
    sameAppSchoolName,
    readAppSchools,
    resolveAppSchoolKey,
    getAppSchoolRecord,
    filterRowsByAppSchool
});

// 🔐 权限与账号管理系统核心
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

var PUBLIC_DOWNLOAD_RELEASE_PAGE_URL = 'https://github.com/hka123321/school-system/releases/latest';
var PUBLIC_VERSION_CENTER_BUILD_INFO = {
    shared: {
        releaseTag: 'school-system-v2026.04.09-about-update-v59',
        releaseDate: '2026-04-09'
    },
    web: {
        label: 'Web 工作台',
        version: '2026.04.09-v59',
        notes: '当前打开的是网页端工作台构建。'
    },
    android: {
        label: 'Android APK',
        version: '1.0.1',
        build: '2',
        notes: '安卓客户端会跟随 GitHub release 同步更新。'
    },
    desktop: {
        label: 'Windows 客户端',
        version: '1.0.1',
        notes: 'Windows 客户端会跟随 GitHub release 同步更新。'
    }
};
var PUBLIC_VERSION_CENTER_RELEASES = [];
var PUBLIC_DOWNLOAD_CHANNELS = {
    android: {
        key: 'android',
        label: '安卓下载',
        shortLabel: 'Android APK',
        badge: '手机 / 平板',
        icon: 'ti-brand-android',
        accent: '#22c55e',
        url: './downloads/school-system-android-v1.0.apk',
        fileName: 'school-system-android-v1.0.apk',
        helper: '适合安卓手机和平板直接安装，安装后沿用现有账号登录。',
        notes: [
            '适合教师、班主任、家长与学生在移动端直接打开系统。',
            '建议在安卓浏览器里下载，安装完成后使用现有账号登录。',
            '如需统一转发，优先复制当前链接或 release 页面链接。'
        ]
    },
    desktop: {
        key: 'desktop',
        label: '桌面端下载',
        shortLabel: 'Windows 应用',
        badge: 'Windows 桌面',
        icon: 'ti-brand-windows',
        accent: '#60a5fa',
        url: './downloads/smartedu-windows-latest.zip',
        fileName: 'smartedu-windows-latest.zip',
        helper: '适合 Windows 办公电脑本地打开，会优先用 Edge/Chrome 应用窗口启动正式系统。',
        notes: [
            '适合教务处、办公室、机房与固定工位使用。',
            '解压 ZIP 后双击启动脚本即可打开，避免反复找浏览器入口。',
            '桌面端和网页端使用同一套数据口径与登录逻辑。'
        ]
    }
};
var PUBLIC_APK_DOWNLOAD_URL = PUBLIC_DOWNLOAD_CHANNELS.android.url;
var PUBLIC_DESKTOP_DOWNLOAD_URL = PUBLIC_DOWNLOAD_CHANNELS.desktop.url;

function getPublicDownloadChannel(type = 'android') {
    const key = type === 'desktop' ? 'desktop' : 'android';
    return PUBLIC_DOWNLOAD_CHANNELS[key];
}

function notifyPublicDownloadAction(message, type = 'success') {
    if (window.UI && typeof window.UI.toast === 'function') {
        window.UI.toast(message, type);
        return;
    }
    if (window.Swal && typeof window.Swal.fire === 'function') {
        window.Swal.fire({
            toast: true,
            position: 'top',
            icon: type === 'error' ? 'error' : 'success',
            title: message,
            showConfirmButton: false,
            timer: 1800
        });
        return;
    }
    appDebug(message);
}

window.PUBLIC_DOWNLOAD_RELEASE_PAGE_URL = PUBLIC_DOWNLOAD_RELEASE_PAGE_URL;
window.PUBLIC_VERSION_CENTER_BUILD_INFO = PUBLIC_VERSION_CENTER_BUILD_INFO;
window.PUBLIC_VERSION_CENTER_RELEASES = PUBLIC_VERSION_CENTER_RELEASES;
window.PUBLIC_DOWNLOAD_CHANNELS = PUBLIC_DOWNLOAD_CHANNELS;
window.PUBLIC_APK_DOWNLOAD_URL = PUBLIC_APK_DOWNLOAD_URL;
window.PUBLIC_DESKTOP_DOWNLOAD_URL = PUBLIC_DESKTOP_DOWNLOAD_URL;
window.copyPublicDownloadLink = async function (type = 'android') {
    const channel = getPublicDownloadChannel(type);
    const downloadUrl = String(channel?.url || '').trim();
    if (!downloadUrl) {
        notifyPublicDownloadAction('下载链接暂未准备好，请稍后再试', 'error');
        return false;
    }
    try {
        if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
            await navigator.clipboard.writeText(downloadUrl);
            notifyPublicDownloadAction(`${channel?.label || '下载'}链接已复制`);
            return true;
        }
    } catch (error) {
        console.warn('[login-download] clipboard copy failed:', error);
    }

    const input = document.createElement('textarea');
    input.value = downloadUrl;
    input.setAttribute('readonly', 'readonly');
    input.style.position = 'fixed';
    input.style.opacity = '0';
    document.body.appendChild(input);
    input.select();

    try {
        document.execCommand('copy');
        notifyPublicDownloadAction(`${channel?.label || '下载'}链接已复制`);
        return true;
    } catch (error) {
        console.warn('[login-download] fallback copy failed:', error);
        notifyPublicDownloadAction('复制失败，请手动复制下载链接', 'error');
        return false;
    } finally {
        input.remove();
    }
};
window.copyPublicApkDownloadLink = function () {
    return window.copyPublicDownloadLink('android');
};
window.copyPublicDesktopDownloadLink = function () {
    return window.copyPublicDownloadLink('desktop');
};

function scheduleStartupCloudTask(task, options = {}) {
    const delay = Number.isFinite(Number(options.delay)) ? Number(options.delay) : 1200;
    const timeout = Number.isFinite(Number(options.timeout)) ? Number(options.timeout) : 2500;
    const run = () => {
        const execute = () => {
            try {
                task();
            } catch (error) {
                console.warn('[startup-cloud] deferred task failed:', error);
            }
        };
        if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
            window.SystemPerformance.scheduleIdle(execute, { timeout });
            return;
        }
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(execute, { timeout });
            return;
        }
        window.setTimeout(execute, 0);
    };
    return window.setTimeout(run, Math.max(0, delay));
}

var Auth = {
    currentUser: null,
    _parentDataRecovering: false,
    _parentRenderRetrying: false,
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
    syncParentMobileScrollRoot: function (enabled) {
        const canUseMatchMedia = typeof window.matchMedia === 'function';
        const shouldEnable = !!enabled && (!canUseMatchMedia || window.matchMedia('(max-width: 960px)').matches);
        document.documentElement.classList.toggle('parent-mobile-scroll-root', shouldEnable);
        document.body.classList.toggle('parent-mobile-scroll-root', shouldEnable);
    },

    // 模拟数据库 (实际存储在 localStorage 'SYS_USERS')
    db: (typeof AuthState.readLocalAuthDb === 'function'
        ? AuthState.readLocalAuthDb()
        : sanitizeLocalAuthDb(JSON.parse(localStorage.getItem('SYS_USERS')) || {
            admin: { pass: MASKED_PASSWORD_DISPLAY },
            teachers: [],
            parents: []
        })),

    // 初始化：检查会话状态
    loginPortalStorageKey: 'LOGIN_PORTAL_V1',

    getLoginPortal: function () {
        return localStorage.getItem(this.loginPortalStorageKey) === 'parent' ? 'parent' : 'school';
    },

    getPublicDownloadCatalog: function () {
        const runtimeCatalog = window.PUBLIC_DOWNLOAD_CHANNELS && typeof window.PUBLIC_DOWNLOAD_CHANNELS === 'object'
            ? window.PUBLIC_DOWNLOAD_CHANNELS
            : {};
        return {
            android: {
                ...PUBLIC_DOWNLOAD_CHANNELS.android,
                ...(runtimeCatalog.android || {})
            },
            desktop: {
                ...PUBLIC_DOWNLOAD_CHANNELS.desktop,
                ...(runtimeCatalog.desktop || {})
            }
        };
    },

    getPublicDownloadChannel: function (type = 'android') {
        const catalog = this.getPublicDownloadCatalog();
        return catalog[type === 'desktop' ? 'desktop' : 'android'];
    },

    getPublicApkDownloadUrl: function () {
        return String(this.getPublicDownloadChannel('android')?.url || PUBLIC_APK_DOWNLOAD_URL).trim();
    },

    getPublicApkDownloadFileName: function (url = this.getPublicApkDownloadUrl()) {
        const normalizedUrl = String(url || '').split('#')[0].split('?')[0];
        const fileName = normalizedUrl.split('/').filter(Boolean).pop();
        return fileName || this.getPublicDownloadChannel('android')?.fileName || 'school-system-android-v1.0.apk';
    },

    getPublicDesktopDownloadUrl: function () {
        return String(this.getPublicDownloadChannel('desktop')?.url || PUBLIC_DESKTOP_DOWNLOAD_URL).trim();
    },

    getPublicDesktopDownloadFileName: function (url = this.getPublicDesktopDownloadUrl()) {
        const normalizedUrl = String(url || '').split('#')[0].split('?')[0];
        const fileName = normalizedUrl.split('/').filter(Boolean).pop();
        return fileName || this.getPublicDownloadChannel('desktop')?.fileName || 'smartedu-windows-latest.zip';
    },

    syncPublicDownloadLinks: function () {
        const linkMap = {
            android: {
                url: this.getPublicApkDownloadUrl(),
                fileName: this.getPublicApkDownloadFileName()
            },
            desktop: {
                url: this.getPublicDesktopDownloadUrl(),
                fileName: this.getPublicDesktopDownloadFileName()
            }
        };
        document.querySelectorAll('[data-public-download]').forEach((link) => {
            if (!(link instanceof HTMLAnchorElement)) return;
            const type = link.dataset.publicDownload === 'desktop' ? 'desktop' : 'android';
            const config = linkMap[type];
            if (!config?.url) return;
            link.href = config.url;
            link.setAttribute('download', config.fileName);
        });
    },

    setLoginPortal: function (portal) {
        const nextPortal = portal === 'parent' ? 'parent' : 'school';
        localStorage.setItem(this.loginPortalStorageKey, nextPortal);
        this.syncLoginPortalUI(nextPortal);
        return nextPortal;
    },

    rebuildInstagramLoginShell: function () {
        const overlay = document.getElementById('login-overlay');
        if (!overlay) return null;
        if (overlay.dataset.igRebuilt === 'true') return overlay;

        const portal = overlay.dataset.loginPortal === 'parent' ? 'parent' : 'school';
        overlay.dataset.loginPortal = portal;
        // overlay.dataset.loginLayout = 'qq-fullscreen';
        // overlay.dataset.loginSkin = 'instagram';
        const dummyHTML = `
            <div class="login-shell login-shell--instagram">
                <section class="login-stage login-stage--instagram" aria-label="系统首页">
                    <nav class="login-stage-nav login-stage-nav--instagram" aria-label="首页导航">
                        <a class="login-stage-brand" href="#login-hero">
                            <span class="login-stage-brand-mark">SE</span>
                            <span class="login-stage-brand-copy">
                                <strong>智慧教务管理系统</strong>
                                <small>School Intelligence OS</small>
                            </span>
                        </a>
                        <div class="login-stage-nav-links">
                            <a href="#login-hero" class="active">首页</a>
                            <a href="#login-portal-hub">登录</a>
                            <a href="#app-download">下载</a>
                            <button type="button" class="login-stage-nav-login" onclick="window.Auth?.openLoginPortalModal('school')">打开学校端</button>
                        </div>
                    </nav>

                    <div id="login-hero" class="login-stage-hero login-stage-hero--instagram">
                        <span id="login-stage-kicker" class="login-stage-hero-kicker">School Command Center</span>
                        <h1 id="login-stage-title">
                            <span class="login-stage-title-line">学校工作台与家长入口</span>
                            <span class="login-stage-title-line login-stage-title-line--accent">在同一张首页里打开登录窗口</span>
                        </h1>
                        <p id="login-stage-copy">把说明、下载与登录动作拆开，让首页先呈现品牌感和唯一主入口，再进入真正的登录表单。</p>
                        <div class="login-stage-actions">
                            <button type="button" class="login-stage-primary-action" onclick="window.Auth?.openLoginPortalModal('school')">
                                <i class="ti ti-building-community"></i> 学校端登录
                            </button>
                            <button type="button" class="login-stage-secondary-action" onclick="window.Auth?.openLoginPortalModal('parent')">
                                <i class="ti ti-heart-handshake"></i> 家长端登录
                            </button>
                            <button type="button" class="login-stage-tertiary-action" onclick="window.Auth?.openDownloadHubModal('android')">
                                <i class="ti ti-download"></i> 打开下载中心
                            </button>
                        </div>
                        <div class="login-stage-meta">
                            <span><i class="ti ti-layout-dashboard"></i> 教学分析 / 数据维护 / 学校工作台</span>
                            <span><i class="ti ti-devices"></i> Web / Android / Desktop 共用登录入口</span>
                            <span><i class="ti ti-sparkles"></i> 当前稳定版 v1.0 · 2026-04-08</span>
                        </div>
                        <div class="login-stage-platforms" aria-label="支持终端">
                            <span><i class="ti ti-device-desktop"></i> Web</span>
                            <span><i class="ti ti-device-mobile"></i> Android</span>
                            <span><i class="ti ti-brand-windows"></i> Desktop</span>
                        </div>
                    </div>

                    <div class="login-stage-spotlight login-stage-spotlight--instagram">
                        <div class="login-stage-spotlight-grid login-stage-phone-stack">
                            <article class="login-stage-spotlight-item">
                                <span>学校驾驶舱</span>
                                <strong>分析、预警、教学联动</strong>
                            </article>
                            <article class="login-stage-spotlight-item">
                                <span>统一登录窗口</span>
                                <strong>唯一表单，唯一验证入口</strong>
                            </article>
                            <article class="login-stage-spotlight-item">
                                <span>家长端</span>
                                <strong>成长报告、成绩与家校提醒</strong>
                            </article>
                        </div>
                        <div class="login-stage-spotlight-copy">
                            <span class="login-stage-featured-label">Instagram-inspired Entry</span>
                            <strong id="login-stage-featured-title" class="login-stage-featured-title">一屏直达成绩分析、教学管理、质量预警与数据维护</strong>
                            <p id="login-stage-featured-copy" class="login-stage-featured-copy">左侧只负责品牌和场景感，右侧只负责角色选择和打开表单，减少视觉噪音，让登录动作更集中。</p>
                        </div>
                    </div>
                </section>

                <section class="login-auth-panel login-auth-panel--instagram" id="login-portal-hub" aria-label="统一登录入口">
                    <div class="login-auth-panel-inner login-auth-panel-inner--instagram">
                        <div class="login-auth-card login-auth-card--portal">
                            <div class="login-auth-head">
                                <div class="login-brand-block">
                                    <div id="login-portal-badge" class="login-portal-badge">学校工作台</div>
                                    <span class="login-brand-kicker">Login Center</span>
                                    <h2 class="login-auth-title">统一登录入口</h2>
                                    <p id="login-portal-copy">选择学校端或家长端，然后打开唯一登录窗口完成验证。</p>
                                </div>
                                <div class="login-auth-utility" id="app-download">
                                    <button type="button" class="login-system-download-link" onclick="window.Auth?.openDownloadHubModal('android')">
                                        <i class="ti ti-download"></i> 应用下载
                                    </button>
                                    <button type="button" class="login-system-download-ghost" onclick="window.copyPublicDownloadLink?.('android')">
                                        <i class="ti ti-link"></i> 复制链接
                                    </button>
                                </div>
                            </div>

                            <div class="login-portal-launch-head">
                                <span>Choose Portal</span>
                                <p>先切换角色，再进入唯一登录窗口；学校端与家长端共用同一套视觉与验证路径。</p>
                            </div>

                            <div class="login-portal-grid" aria-label="登录入口选择">
                                <button type="button" class="login-portal-card active" data-portal="school" data-login-open="school" onclick="window.Auth?.openLoginPortalModal('school')">
                                    <span class="login-portal-icon"><i class="ti ti-building-community"></i></span>
                                    <span class="login-portal-title">学校端</span>
                                    <span class="login-portal-desc">适用于教务、年级、班主任与教师的统一工作台。</span>
                                    <span class="login-portal-meta">Analysis / Data / Workspace</span>
                                    <span class="login-portal-action">打开学校端窗口</span>
                                </button>
                                <button type="button" class="login-portal-card" data-portal="parent" data-login-open="parent" onclick="window.Auth?.openLoginPortalModal('parent')">
                                    <span class="login-portal-icon"><i class="ti ti-heart-handshake"></i></span>
                                    <span class="login-portal-title">家长端</span>
                                    <span class="login-portal-desc">输入学生姓名、班级与密码，查看成长报告、成绩与提醒。</span>
                                    <span class="login-portal-meta">Report / Score / Reminder</span>
                                    <span class="login-portal-action">打开家长端窗口</span>
                                </button>
                            </div>

                            <div class="login-portal-note">
                                <i class="ti ti-hand-click"></i> 首页只保留角色选择和下载动作，真正的账号验证统一在登录窗口中完成。
                            </div>
                        </div>

                        <div class="login-auth-footer">
                            <span>Web / Android / Desktop</span>
                            <span>统一账号逻辑</span>
                            <span>更接近 Instagram 的简洁登录骨架</span>
                        </div>
                    </div>
                </section>
            </div>

            <div id="login-modal-backdrop" class="login-modal-backdrop" style="display:none;" aria-hidden="true" onclick="if(event.target===this) window.Auth?.closeLoginPortalModal()">
                <div class="login-modal-dialog login-modal-dialog--instagram" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
                    <div class="login-modal-head login-modal-head--instagram">
                        <div class="login-modal-head-top">
                            <span id="login-modal-chip" class="login-modal-chip">学校端登录窗口</span>
                            <button type="button" class="login-modal-close" onclick="window.Auth?.closeLoginPortalModal()" aria-label="关闭登录窗口">
                                <i class="ti ti-x"></i>
                            </button>
                        </div>
                        <h2 id="login-modal-title" class="login-modal-title">进入学校工作台</h2>
                        <p id="login-modal-copy" class="login-modal-copy">输入账号与密码后，直接进入教学分析、数据维护与学校工作台。</p>
                        <div class="login-modal-visuals">
                            <div class="login-modal-visual-card">
                                <span>Single Login Window</span>
                                <strong>唯一表单，减少跳转与干扰</strong>
                            </div>
                            <div class="login-modal-visual-card">
                                <span>School / Parent</span>
                                <strong>切换角色，但保持同一套入口体验</strong>
                            </div>
                        </div>
                    </div>

                    <div class="login-auth-card login-auth-card--modal">
                        <div class="login-auth-card-brand">
                            <div class="login-auth-card-logo">SE</div>
                            <div class="login-auth-card-copy">
                                <strong>登录工作台</strong>
                                <span>简洁表单、清晰层级、唯一主动作</span>
                            </div>
                        </div>

                        <div id="login-form">
                            <div class="form-group">
                                <label id="login-user-label" for="login-user">账号 / 姓名</label>
                                <input type="text" id="login-user" placeholder="管理员账号 / 教师姓名" data-login-submit-on-enter="1">
                                <div id="login-user-helper" class="login-inline-tip">支持管理员、教务、年级、班主任与教师账号登录。</div>
                            </div>

                            <div id="login-class-group" class="form-group">
                                <label for="login-class">班级 <span id="login-class-label-note">(学校端无需填写)</span></label>
                                <input type="text" id="login-class" placeholder="请输入学生班级，如 701" data-login-submit-on-enter="1">
                            </div>

                            <div class="form-group">
                                <label for="login-pass">密码</label>
                                <input type="password" id="login-pass" placeholder="输入密码" data-login-submit-on-enter="1">
                            </div>

                            <button id="login-submit-button" data-login-submit="1">进入学校工作台</button>

                            <div id="login-portal-helper" class="login-portal-helper">当前为学校端，验证通过后直达教学分析与数据维护。</div>

                            <div class="login-form-divider"><span>or</span></div>

                            <button type="button" class="login-form-alt" onclick="window.Auth?.openDownloadHubModal('android')">
                                <i class="ti ti-download"></i> 下载 Android / Desktop
                            </button>

                            <div class="login-trust-strip">
                                <span><i class="ti ti-shield-lock"></i> 统一身份认证</span>
                                <span><i class="ti ti-cloud-lock"></i> 云端安全校验</span>
                                <span><i class="ti ti-bolt"></i> 验证后直达工作台</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        overlay.dataset.igRebuilt = 'true';
        return overlay;
    },

    rebuildCommandDeckLoginShell: function () {
        const overlay = document.getElementById('login-overlay');
        if (!overlay) return null;
        if (overlay.dataset.commanddeckRebuilt === 'true') return overlay;

        const portal = overlay.dataset.loginPortal === 'parent' ? 'parent' : 'school';
        overlay.dataset.loginPortal = portal;
        overlay.dataset.loginLayout = 'commanddeck';
        overlay.dataset.loginSkin = 'commanddeck';
        overlay.innerHTML = `
            <div class="login-shell login-shell--commanddeck">
                <section class="login-stage login-stage--commanddeck" aria-label="系统首页">
                    <nav class="login-stage-nav login-stage-nav--commanddeck" aria-label="首页导航">
                        <a class="login-stage-brand" href="#login-hero">
                            <span class="login-stage-brand-mark">SE</span>
                            <span class="login-stage-brand-copy">
                                <strong>智慧教务管理系统</strong>
                                <small>School Intelligence OS</small>
                            </span>
                        </a>
                        <div class="login-stage-nav-links">
                            <a href="#login-hero" class="active">首页</a>
                            <a href="#login-portal-hub">登录</a>
                            <a href="#app-download">下载</a>
                            <button type="button" class="login-stage-nav-login" onclick="window.Auth?.openLoginPortalModal('school')">打开学校端</button>
                        </div>
                    </nav>

                    <div id="login-hero" class="login-stage-hero login-stage-hero--commanddeck">
                        <span id="login-stage-kicker" class="login-stage-hero-kicker">School Command Center</span>
                        <h1 id="login-stage-title">
                            <span class="login-stage-title-line">一个登录入口</span>
                            <span class="login-stage-title-line login-stage-title-line--accent">直达学校工作台与家长成长端</span>
                        </h1>
                        <p id="login-stage-copy">把登录、下载和系统说明拆分成清晰的工作台入口。首屏只负责方向感，登录动作集中在同一张认证面板里完成。</p>
                        <div class="login-stage-actions">
                            <button type="button" class="login-stage-primary-action" onclick="window.Auth?.openLoginPortalModal('school')">
                                <i class="ti ti-building-community"></i> 进入学校端
                            </button>
                            <button type="button" class="login-stage-secondary-action" onclick="window.Auth?.openLoginPortalModal('parent')">
                                <i class="ti ti-heart-handshake"></i> 进入家长端
                            </button>
                            <button type="button" class="login-stage-tertiary-action" onclick="window.Auth?.openDownloadHubModal('android')">
                                <i class="ti ti-download"></i> 打开下载中心
                            </button>
                        </div>
                        <div class="login-stage-meta">
                            <span><i class="ti ti-layout-dashboard"></i> 教学分析 / 数据维护 / 学校工作台</span>
                            <span><i class="ti ti-devices"></i> Web / Android / Desktop 统一入口</span>
                            <span><i class="ti ti-sparkles"></i> 新版登录工作台 · 2026-04-19</span>
                        </div>
                        <div class="login-stage-platforms" aria-label="支持终端">
                            <span><i class="ti ti-device-desktop"></i> Web</span>
                            <span><i class="ti ti-device-mobile"></i> Android</span>
                            <span><i class="ti ti-brand-windows"></i> Desktop</span>
                        </div>
                        <div class="login-stage-scanline">
                            <article class="login-stage-data-card">
                                <span class="login-stage-data-label">工作台能力</span>
                                <strong>分析、预警、整改、账号</strong>
                                <p>把老师常用的数据链路集中在一张首页里，不再四处找入口。</p>
                            </article>
                            <article class="login-stage-data-card">
                                <span class="login-stage-data-label">统一认证</span>
                                <strong>学校端与家长端共用同一套登录面板</strong>
                                <p>切换角色时只变更内容，不再切页面，使用路径更稳定。</p>
                            </article>
                            <article class="login-stage-data-card">
                                <span class="login-stage-data-label">多端同步</span>
                                <strong>网页、安卓、桌面保持同一操作习惯</strong>
                                <p>入口和身份逻辑一致，登录后自动进入对应工作区。</p>
                            </article>
                        </div>
                        <div class="login-stage-spotlight login-stage-spotlight--commanddeck">
                            <div class="login-stage-spotlight-copy">
                                <span class="login-stage-featured-label">Command Deck</span>
                                <strong id="login-stage-featured-title" class="login-stage-featured-title">先看清入口，再完成身份验证</strong>
                                <p id="login-stage-featured-copy" class="login-stage-featured-copy">左侧聚焦系统价值和工作流，右侧负责角色切换与登录动作，避免旧版首屏信息拥挤、登录位置不明确的问题。</p>
                            </div>
                            <div class="login-stage-status-grid">
                                <div class="login-stage-status-pill"><span>01</span><strong>选择端口</strong></div>
                                <div class="login-stage-status-pill"><span>02</span><strong>验证身份</strong></div>
                                <div class="login-stage-status-pill"><span>03</span><strong>进入模块</strong></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="login-auth-panel login-auth-panel--commanddeck" id="login-portal-hub" aria-label="统一登录入口">
                    <div class="login-auth-panel-inner login-auth-panel-inner--commanddeck">
                        <div class="login-auth-card login-auth-card--portal">
                            <div class="login-auth-head">
                                <div class="login-brand-block">
                                    <div id="login-portal-badge" class="login-portal-badge">学校工作台</div>
                                    <span class="login-brand-kicker">Login Center</span>
                                    <h2 class="login-auth-title">统一登录入口</h2>
                                    <p id="login-portal-copy">先选角色，再在同一张面板里完成验证。登录后会自动进入对应工作区，不需要额外跳转。</p>
                                </div>
                                <div class="login-auth-utility" id="app-download">
                                    <button type="button" class="login-system-download-link" onclick="window.Auth?.openDownloadHubModal('android')">
                                        <i class="ti ti-download"></i> 应用下载
                                    </button>
                                    <button type="button" class="login-system-download-ghost" onclick="window.copyPublicDownloadLink?.('android')">
                                        <i class="ti ti-link"></i> 复制链接
                                    </button>
                                </div>
                            </div>

                            <div class="login-portal-launch-head">
                                <span>Choose Portal</span>
                                <p>学校端和家长端共享同一套认证逻辑，但保留各自的引导文案和入口说明。</p>
                            </div>

                            <div class="login-portal-grid" aria-label="登录入口选择">
                                <button type="button" class="login-portal-card active" data-portal="school" data-login-open="school" onclick="window.Auth?.openLoginPortalModal('school')">
                                    <span class="login-portal-icon"><i class="ti ti-building-community"></i></span>
                                    <span class="login-portal-title">学校端</span>
                                    <span class="login-portal-desc">面向管理员、教务、年级主任、班主任和教师的统一工作台。</span>
                                    <span class="login-portal-meta">Analysis / Data / Workspace</span>
                                    <span class="login-portal-action">打开学校端窗口</span>
                                </button>
                                <button type="button" class="login-portal-card" data-portal="parent" data-login-open="parent" onclick="window.Auth?.openLoginPortalModal('parent')">
                                    <span class="login-portal-icon"><i class="ti ti-heart-handshake"></i></span>
                                    <span class="login-portal-title">家长端</span>
                                    <span class="login-portal-desc">输入学生姓名、班级和密码后，直接查看成长报告、成绩与提醒。</span>
                                    <span class="login-portal-meta">Report / Score / Reminder</span>
                                    <span class="login-portal-action">打开家长端窗口</span>
                                </button>
                            </div>

                            <div class="login-portal-note">
                                <i class="ti ti-hand-click"></i> 首页只保留角色选择和关键动作，真实账号验证统一在登录窗口中完成。
                            </div>
                        </div>

                        <div class="login-auth-footer">
                            <span>Web / Android / Desktop</span>
                            <span>统一账号逻辑</span>
                            <span>新的工作台式登录体验</span>
                        </div>
                    </div>
                </section>
            </div>

            <div id="login-modal-backdrop" class="login-modal-backdrop" style="display:none;" aria-hidden="true" onclick="if(event.target===this) window.Auth?.closeLoginPortalModal()">
                <div class="login-modal-dialog login-modal-dialog--commanddeck" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
                    <div class="login-modal-head login-modal-head--commanddeck">
                        <div class="login-modal-head-top">
                            <span id="login-modal-chip" class="login-modal-chip">学校端登录窗口</span>
                            <button type="button" class="login-modal-close" onclick="window.Auth?.closeLoginPortalModal()" aria-label="关闭登录窗口">
                                <i class="ti ti-x"></i>
                            </button>
                        </div>
                        <h2 id="login-modal-title" class="login-modal-title">进入学校工作台</h2>
                        <p id="login-modal-copy" class="login-modal-copy">输入账号与密码后，直接进入教学分析、数据维护与学校工作台。</p>
                        <div class="login-modal-visuals">
                            <div class="login-modal-visual-card">
                                <span>Single Login Window</span>
                                <strong>唯一认证面板，减少跳转与干扰</strong>
                            </div>
                            <div class="login-modal-visual-card">
                                <span>School / Parent</span>
                                <strong>切换角色，但保持同一套入口体验</strong>
                            </div>
                        </div>
                    </div>

                    <div class="login-auth-card login-auth-card--modal">
                        <div class="login-auth-card-brand">
                            <div class="login-auth-card-logo">SE</div>
                            <div class="login-auth-card-copy">
                                <strong>登录工作台</strong>
                                <span>清晰表单、明确角色、统一认证动作</span>
                            </div>
                        </div>

                        <div id="login-form">
                            <div class="form-group">
                                <label id="login-user-label" for="login-user">账号 / 姓名</label>
                                <input type="text" id="login-user" placeholder="管理员账号 / 教师姓名" data-login-submit-on-enter="1">
                                <div id="login-user-helper" class="login-inline-tip">支持管理员、教务、年级、班主任与教师账号登录。</div>
                            </div>

                            <div id="login-class-group" class="form-group">
                                <label for="login-class">班级 <span id="login-class-label-note">(学校端无需填写)</span></label>
                                <input type="text" id="login-class" placeholder="请输入学生班级，如 701" data-login-submit-on-enter="1">
                            </div>

                            <div class="form-group">
                                <label for="login-pass">密码</label>
                                <input type="password" id="login-pass" placeholder="输入密码" data-login-submit-on-enter="1">
                            </div>

                            <button id="login-submit-button" data-login-submit="1">进入学校工作台</button>

                            <div id="login-portal-helper" class="login-portal-helper">当前为学校端，验证通过后直达教学分析与数据维护。</div>

                            <div class="login-form-divider"><span>or</span></div>

                            <button type="button" class="login-form-alt" onclick="window.Auth?.openDownloadHubModal('android')">
                                <i class="ti ti-download"></i> 下载 Android / Desktop
                            </button>

                            <div class="login-trust-strip">
                                <span><i class="ti ti-shield-lock"></i> 统一身份认证</span>
                                <span><i class="ti ti-cloud-lock"></i> 云端安全校验</span>
                                <span><i class="ti ti-bolt"></i> 验证后直达工作台</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        overlay.dataset.igRebuilt = 'true';
        overlay.dataset.commanddeckRebuilt = 'true';
        return overlay;
    },

    rebuildPassportLoginShell: function () {
        const overlay = document.getElementById('login-overlay');
        if (!overlay) return null;

        const portal = this.getLoginPortal();
        overlay.dataset.loginPortal = portal;
        overlay.dataset.loginLayout = 'passport';
        overlay.dataset.loginSkin = 'passport';
        overlay.innerHTML = `
            <div class="login-shell login-shell--passport">
                <section class="login-stage login-stage--passport" aria-label="系统登录说明">
                    <nav class="login-stage-nav login-stage-nav--passport" aria-label="登录辅助导航">
                        <a class="login-stage-brand" href="#login-hero">
                            <span class="login-stage-brand-mark">SE</span>
                            <span class="login-stage-brand-copy">
                                <strong>智慧教务管理系统</strong>
                                <small>School Intelligence OS</small>
                            </span>
                        </a>
                        <div class="login-stage-nav-links">
                            <a href="#login-hero" class="active">登录验证</a>
                            <a href="#login-portal-hub">流程说明</a>
                            <a href="#app-download">应用下载</a>
                            <button type="button" class="login-stage-nav-login" onclick="window.Auth?.openLoginPortalModal('school')">切到学校端</button>
                        </div>
                    </nav>

                    <div id="login-hero" class="login-stage-hero login-stage-hero--passport">
                        <span id="login-stage-kicker" class="login-stage-hero-kicker">Step 1 / Login</span>
                        <h1 id="login-stage-title">
                            <span class="login-stage-title-line">先登录</span>
                            <span class="login-stage-title-line login-stage-title-line--accent">再选择届别进入工作台</span>
                        </h1>
                        <p id="login-stage-copy">登录页现在只负责身份验证。学校端验证成功后，会先进入届别选择界面，再由你决定进入哪个届别工作区。</p>
                        <div class="login-stage-meta">
                            <span><i class="ti ti-shield-lock"></i> 登录验证与工作区选择拆开</span>
                            <span><i class="ti ti-route-2"></i> 学校端登录后固定进入届别选择</span>
                            <span><i class="ti ti-devices"></i> Web / Android / Desktop 共用同一套流程</span>
                        </div>
                        <div class="login-stage-status-grid login-stage-status-grid--passport">
                            <div class="login-stage-status-pill"><span>01</span><strong>登录界面</strong><p>只做账号验证，不直跳系统。</p></div>
                            <div class="login-stage-status-pill"><span>02</span><strong>届别选择</strong><p>登录成功后，先选择届别。</p></div>
                            <div class="login-stage-status-pill"><span>03</span><strong>进入工作台</strong><p>届别就绪后再装载模块。</p></div>
                        </div>
                        <div class="login-stage-spotlight login-stage-spotlight--passport">
                            <div class="login-stage-spotlight-copy">
                                <span class="login-stage-featured-label">Two-step Flow</span>
                                <strong id="login-stage-featured-title" class="login-stage-featured-title">登录成功后不会直接进入系统</strong>
                                <p id="login-stage-featured-copy" class="login-stage-featured-copy">学校端采用“登录验证 → 届别选择 → 工作台”的固定路径，避免直接落进空数据或错误届别。</p>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="login-auth-panel login-auth-panel--passport" id="login-portal-hub" aria-label="统一登录入口">
                    <div class="login-auth-panel-inner login-auth-panel-inner--passport">
                        <div class="login-auth-card login-auth-card--passport">
                            <div class="login-auth-head login-auth-head--passport">
                                <div class="login-brand-block">
                                    <div id="login-portal-badge" class="login-portal-badge">学校身份验证</div>
                                    <span class="login-brand-kicker">Inline Login</span>
                                    <h2 class="login-auth-title">登录验证</h2>
                                    <p id="login-portal-copy">学校端验证成功后进入届别选择，家长端保持直接进入成长查看界面。</p>
                                </div>
                                <div class="login-auth-utility" id="app-download">
                                    <button type="button" class="login-system-download-link" onclick="window.Auth?.openDownloadHubModal('android')">
                                        <i class="ti ti-download"></i> 应用下载
                                    </button>
                                    <button type="button" class="login-system-download-ghost" onclick="window.copyPublicDownloadLink?.('android')">
                                        <i class="ti ti-link"></i> 复制链接
                                    </button>
                                </div>
                            </div>

                            <div class="login-portal-launch-head">
                                <span>Switch Portal</span>
                                <p>学校端与家长端共用一张内联登录页，但学校端会在验证后进入届别选择，家长端保持直接查看成长数据。</p>
                            </div>

                            <div class="login-portal-switch" aria-label="登录入口选择">
                                <button type="button" class="login-portal-chip active" data-portal="school" data-login-open="school" onclick="window.Auth?.openLoginPortalModal('school')">学校端</button>
                                <button type="button" class="login-portal-chip" data-portal="parent" data-login-open="parent" onclick="window.Auth?.openLoginPortalModal('parent')">家长端</button>
                            </div>

                            <div class="login-portal-note">
                                登录页已改为内联表单，不再打开单独的登录弹窗。
                            </div>

                            <div id="login-form">
                                <div class="form-group">
                                    <label id="login-user-label" for="login-user">账号 / 姓名</label>
                                    <input type="text" id="login-user" placeholder="管理员账号 / 教师姓名" data-login-submit-on-enter="1">
                                    <div id="login-user-helper" class="login-inline-tip">支持管理员、教务、年级主任、班主任和教师账号登录。</div>
                                </div>

                                <div id="login-class-group" class="form-group">
                                    <label for="login-class">班级 <span id="login-class-label-note">(学校端无需填写)</span></label>
                                    <input type="text" id="login-class" placeholder="请输入学生班级，如 701" data-login-submit-on-enter="1">
                                </div>

                                <div class="form-group">
                                    <label for="login-pass">密码</label>
                                    <input type="password" id="login-pass" placeholder="输入密码" data-login-submit-on-enter="1">
                                </div>

                                <button id="login-submit-button" data-login-submit="1">验证并进入届别选择</button>

                                <div id="login-portal-helper" class="login-portal-helper">当前为学校端，验证成功后会先进入届别选择界面。</div>

                                <div class="login-form-actions">
                                    <button type="button" class="login-form-alt" onclick="window.Auth?.openSystemIntroModal(window.Auth?.getLoginPortal?.())">
                                        <i class="ti ti-file-text"></i> 查看系统说明
                                    </button>
                                    <button type="button" class="login-form-alt" onclick="window.Auth?.openDownloadHubModal('android')">
                                        <i class="ti ti-download"></i> 下载 Android / Desktop
                                    </button>
                                </div>

                                <div class="login-trust-strip">
                                    <span><i class="ti ti-shield-lock"></i> 统一身份认证</span>
                                    <span><i class="ti ti-layers-subtract"></i> 登录与届别选择分步完成</span>
                                    <span><i class="ti ti-database-export"></i> 模块按届别加载</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            <div id="login-modal-backdrop" class="login-modal-backdrop" style="display:none;" aria-hidden="true"></div>
        `;
        overlay.dataset.passportRebuilt = 'true';
        return overlay;
    },

    ensureLoginWorkbench: function () {
        const existingOverlay = document.getElementById('login-overlay');
        if (existingOverlay?.querySelector('.login-clean-shell')) {
            existingOverlay.dataset.loginLayout = 'clean';
            existingOverlay.dataset.loginSkin = 'clean';
            existingOverlay.dataset.loginModal = 'inline';
            this.syncPublicDownloadLinks();
            this.ensureSystemIntroModal();
            this.ensureDownloadHubModal();
            return existingOverlay;
        }

        const overlay = this.rebuildPassportLoginShell();
        const panel = document.getElementById('login-portal-hub');
        const modalBackdrop = document.getElementById('login-modal-backdrop');
        if (!overlay || !panel) return;
        this.syncPublicDownloadLinks();
        this.ensureSystemIntroModal();
        this.ensureDownloadHubModal();

        if (modalBackdrop && modalBackdrop.dataset.loginModalBound !== 'true') {
            modalBackdrop.addEventListener('click', (event) => {
                if (event.target === modalBackdrop) this.closeLoginPortalModal();
            });
            modalBackdrop.dataset.loginModalBound = 'true';
        }

        const navLinks = Array.from(overlay.querySelectorAll('.login-stage-nav-links a'));
        const navLinksWrap = overlay.querySelector('.login-stage-nav-links');
        const navButton = overlay.querySelector('.login-stage-nav-login');
        const introLink = navLinks[0];
        const modalLink = navLinks[1];
        const downloadLink = navLinks[2];

        if (navLinksWrap && modalLink && downloadLink && introLink) {
            [modalLink, downloadLink, introLink].forEach((link) => navLinksWrap.appendChild(link));
        }

        [introLink, modalLink, downloadLink].forEach((link) => {
            if (link) link.classList.remove('active');
        });

        if (introLink) {
            introLink.textContent = '系统介绍';
            introLink.href = '#';
            introLink.dataset.nav = 'intro';
            introLink.onclick = (event) => {
                event.preventDefault();
                this.openSystemIntroModal(this.getLoginPortal());
            };
        }

        if (downloadLink) {
            downloadLink.textContent = '应用下载';
            downloadLink.href = '#';
            downloadLink.dataset.nav = 'download';
            downloadLink.removeAttribute('download');
            downloadLink.onclick = (event) => {
                event.preventDefault();
                this.openDownloadHubModal('android');
            };
        }

        if (modalLink) {
            modalLink.textContent = '登录验证';
            modalLink.href = '#';
            modalLink.dataset.nav = 'modal';
            modalLink.classList.add('active');
            modalLink.onclick = (event) => {
                event.preventDefault();
                this.openLoginPortalModal(this.getLoginPortal());
            };
        }

        if (navButton) {
            navButton.textContent = '切到学校端';
            navButton.onclick = () => this.openLoginPortalModal('school');
        }

        overlay.dataset.loginModal = 'inline';
        this.setLoginWorkbenchNavState(document.body.classList.contains('login-system-intro-open') ? 'intro' : 'modal');
        panel.dataset.loginWorkbenchReady = 'true';
    },

    focusLoginWorkbench: function (options = {}) {
        this.ensureLoginWorkbench();
        const focusTarget = document.getElementById('login-user');
        const backdrop = document.getElementById('login-modal-backdrop');

        if (options.scroll !== false && backdrop) {
            backdrop.scrollTop = 0;
        }

        if (options.focus === false) return;

        setTimeout(() => {
            if (focusTarget && typeof focusTarget.focus === 'function') {
                focusTarget.focus({ preventScroll: true });
            }
        }, typeof options.delay === 'number' ? options.delay : 60);
    },

    setLoginWorkbenchNavState: function (activeNav = 'modal') {
        const overlay = document.getElementById('login-overlay');
        if (!overlay) return;
        overlay.querySelectorAll('.login-stage-nav-links a[data-nav]').forEach((link) => {
            link.classList.toggle('active', link.dataset.nav === activeNav);
        });
    },

    ensureSystemIntroModal: function () {
        const overlay = document.getElementById('login-overlay');
        if (!overlay) return null;

        let backdrop = document.getElementById('login-system-intro-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'login-system-intro-backdrop';
            backdrop.className = 'login-system-intro-backdrop';
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
            backdrop.innerHTML = `
                <div class="login-system-intro-dialog" role="dialog" aria-modal="true" aria-labelledby="login-system-intro-title">
                    <div class="login-system-intro-hero">
                        <div class="login-system-intro-top">
                            <span class="login-system-intro-chip" data-intro-chip>系统介绍</span>
                            <button type="button" class="login-system-intro-close" data-intro-close aria-label="关闭系统介绍">
                                <i class="ti ti-x"></i>
                            </button>
                        </div>
                        <div class="login-system-intro-copy-block">
                            <h2 id="login-system-intro-title" class="login-system-intro-title" data-intro-title tabindex="-1">系统介绍</h2>
                            <p class="login-system-intro-copy" data-intro-copy></p>
                        </div>
                        <section class="login-system-intro-focus" aria-label="当前入口重点">
                            <span class="login-system-intro-focus-label" data-intro-focus-label></span>
                            <strong class="login-system-intro-focus-title" data-intro-focus-title></strong>
                            <p class="login-system-intro-focus-copy" data-intro-focus-copy></p>
                        </section>
                        <div class="login-system-intro-quickstats" data-intro-quickstats></div>
                    </div>
                    <div class="login-system-intro-body" data-intro-body></div>
                </div>
            `;
            overlay.appendChild(backdrop);
        }

        if (backdrop.dataset.introBound !== 'true') {
            backdrop.addEventListener('click', (event) => {
                if (event.target === backdrop) this.closeSystemIntroModal();
            });
            const closeButton = backdrop.querySelector('[data-intro-close]');
            if (closeButton) {
                closeButton.addEventListener('click', () => this.closeSystemIntroModal());
            }
            backdrop.dataset.introBound = 'true';
        }

        return backdrop;
    },

    ensureDownloadHubModal: function () {
        const overlay = document.getElementById('login-overlay');
        if (!overlay) return null;

        let backdrop = document.getElementById('login-download-hub-backdrop');
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.id = 'login-download-hub-backdrop';
            backdrop.className = 'login-download-hub-backdrop';
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
            backdrop.innerHTML = `
                <div class="login-download-hub-dialog" role="dialog" aria-modal="true" aria-labelledby="login-download-hub-title">
                    <div class="login-download-hub-shell">
                        <div class="login-download-hub-top">
                            <span class="login-download-hub-chip">应用下载</span>
                            <button type="button" class="login-download-hub-close" data-download-close aria-label="关闭应用下载">
                                <i class="ti ti-x"></i>
                            </button>
                        </div>
                        <div class="login-download-hub-brand">
                            <h2 id="login-download-hub-title" tabindex="-1">Android 与桌面端统一下载中心</h2>
                            <p>先选平台，再复制链接或直接下载；安卓 APK 和 Windows EXE 都跟随最新 GitHub release 更新。</p>
                        </div>
                        <div class="login-download-hub-platforms" data-download-platforms></div>
                        <div class="login-download-hub-detail" data-download-detail></div>
                    </div>
                </div>
            `;
            overlay.appendChild(backdrop);
        }

        if (backdrop.dataset.downloadBound !== 'true') {
            backdrop.addEventListener('click', (event) => {
                if (event.target === backdrop) this.closeDownloadHubModal();
            });
            const closeButton = backdrop.querySelector('[data-download-close]');
            if (closeButton) {
                closeButton.addEventListener('click', () => this.closeDownloadHubModal());
            }
            backdrop.dataset.downloadBound = 'true';
        }

        return backdrop;
    },

    renderDownloadHubModal: function (type = 'android') {
        const backdrop = this.ensureDownloadHubModal();
        if (!backdrop) return null;

        const channels = ['android', 'desktop']
            .map((key) => this.getPublicDownloadChannel(key))
            .filter(Boolean);
        const activeType = type === 'desktop' ? 'desktop' : 'android';
        const activeChannel = this.getPublicDownloadChannel(activeType);
        const platformWrap = backdrop.querySelector('[data-download-platforms]');
        const detailWrap = backdrop.querySelector('[data-download-detail]');

        if (platformWrap) {
            platformWrap.innerHTML = channels.map((channel) => `
                <button
                    type="button"
                    class="login-download-hub-platform${channel.key === activeType ? ' is-active' : ''}"
                    data-download-platform="${channel.key}"
                    style="--download-accent:${channel.accent || '#22c55e'};"
                >
                    <span class="login-download-hub-platform-icon"><i class="ti ${channel.icon || 'ti-download'}"></i></span>
                    <span class="login-download-hub-platform-copy">
                        <strong>${channel.label}</strong>
                        <span>${channel.badge || ''}</span>
                    </span>
                </button>
            `).join('');

            platformWrap.querySelectorAll('[data-download-platform]').forEach((button) => {
                button.addEventListener('click', () => this.renderDownloadHubModal(button.dataset.downloadPlatform || 'android'));
            });
        }

        if (detailWrap && activeChannel) {
            const notes = Array.isArray(activeChannel.notes) ? activeChannel.notes : [];
            detailWrap.innerHTML = `
                <div class="login-download-hub-card" style="--download-accent:${activeChannel.accent || '#22c55e'};">
                    <div class="login-download-hub-card-head">
                        <div>
                            <span class="login-download-hub-card-kicker">${activeChannel.shortLabel || activeChannel.label}</span>
                            <h3>${activeChannel.badge || activeChannel.label}</h3>
                        </div>
                        <span class="login-download-hub-card-badge">Latest</span>
                    </div>
                    <p class="login-download-hub-card-copy">${activeChannel.helper || ''}</p>
                    <div class="login-download-hub-link">
                        <input type="text" readonly value="${activeChannel.url || ''}" />
                    </div>
                    <div class="login-download-hub-actions">
                        <a class="btn btn-blue" href="${activeChannel.url || '#'}" download="${activeChannel.fileName || ''}">
                            <i class="ti ti-download"></i> 直接下载
                        </a>
                        <button type="button" class="btn btn-gray" data-download-copy="${activeChannel.key}">
                            <i class="ti ti-copy"></i> 复制链接
                        </button>
                        <a class="btn btn-green" href="${PUBLIC_DOWNLOAD_RELEASE_PAGE_URL}" target="_blank" rel="noopener">
                            <i class="ti ti-brand-github"></i> 查看 Release
                        </a>
                    </div>
                    <div class="login-download-hub-note-list">
                        ${notes.map((note) => `<span>${note}</span>`).join('')}
                    </div>
                </div>
            `;

            const copyButton = detailWrap.querySelector('[data-download-copy]');
            if (copyButton) {
                copyButton.addEventListener('click', () => {
                    window.copyPublicDownloadLink?.(copyButton.dataset.downloadCopy || activeType);
                });
            }
        }

        return backdrop;
    },

    getSystemIntroContent: function (portal = this.getLoginPortal()) {
        const nextPortal = portal === 'parent' ? 'parent' : 'school';
        const spotlight = nextPortal === 'parent'
            ? {
                label: '当前入口重点',
                title: '家长端只看学生个人成绩、成长报告与关键提醒',
                copy: '无论从家长端还是学校端进入，系统都使用同一份成绩数据、同一套比较口径与统一权限边界。'
            }
            : {
                label: '当前入口重点',
                title: '学校端覆盖数据维护、教学分析、绩效比较与结果输出',
                copy: '管理员、教务、班主任与教师都在同一套口径下工作，网页端与 Android 端看到的核心结果保持一致。'
            };

        return {
            chip: nextPortal === 'parent' ? '家长端说明' : '学校端说明',
            title: '智慧教务管理系统如何使用',
            copy: '系统介绍集中说明使用流程、模块结构、角色权限、成绩计算和绩效比较规则，首页不再直接展开这些说明。',
            spotlight,
            quickStats: [
                { label: '适用角色', value: '管理员 / 教务 / 年级负责人 / 班主任 / 教师 / 家长' },
                { label: '核心模块', value: '数据导入、综合分析、教师分析、成长报告、绩效比较、应用下载' },
                { label: '统一口径', value: 'Web、Android、Desktop EXE 与家长端共用同一套数据和规则' }
            ],
            sections: [
                {
                    title: '系统如何使用',
                    copy: '建议按“导入数据 -> 校验参数 -> 进入分析 -> 生成结果 -> 导出或同步”的顺序使用。',
                    type: 'steps',
                    items: [
                        { label: '1. 导入与建档', text: '在数据枢纽上传原始成绩、班级名册、任课表与历史考试，系统会自动识别学校、班级和学科。' },
                        { label: '2. 校验口径', text: '按考试或年级配置总分、优良及格线、分层阈值和比较参数，确保不同批次结果可直接对照。' },
                        { label: '3. 进入分析', text: '进入综合分析、教师分析、进退步追踪、学生详情和横向对比模块查看结果。' },
                        { label: '4. 输出结果', text: '生成成绩单、成长报告、整改任务、绩效比较结果，并按需要同步云端或分发移动端。' }
                    ]
                },
                {
                    title: '系统有哪些模块',
                    copy: '工作区按“数据、分析、管理、报告、服务”组织，常用模块会围绕同一份成绩库联动。',
                    type: 'grid',
                    items: [
                        { label: '数据枢纽', text: '导入成绩、历史档案、任课表和基础配置，是全部分析的起点。' },
                        { label: '综合分析 / 两率一分', text: '查看均分、优秀率、及格率、总分、排名、分层和质量预警。' },
                        { label: '教师分析 / 教学评价', text: '结合任课表、历史基线和联考口径比较教师学科绩效。' },
                        { label: '学生详情 / 成长报告', text: '查看单个学生成绩、排名变化、报告卡和家长端展示结果。' },
                        { label: '横向对比 / 绩效比较', text: '按学校、班级、教师、学科和多次考试做同口径比较。' },
                        { label: '应用下载中心 / 系统维护', text: '统一分发 Android APK 与桌面端 EXE，维护账号、权限、版本信息与云端同步。' }
                    ]
                },
                {
                    title: '不同角色有哪些权限',
                    copy: '系统按职责分层授权，用户只会看到与自己职责相关的模块和数据范围。',
                    type: 'roles',
                    items: [
                        { label: '管理员 / 教务', text: '维护账号与权限、导入全校数据、管理考试参数、查看全部分析和导出结果。' },
                        { label: '年级负责人', text: '查看本年级质量分析、横向比较、分层名单、整改任务和汇总结果。' },
                        { label: '班主任', text: '查看本班学生成绩、成长报告、临界生名单、班级比较和家校提醒。' },
                        { label: '学科教师', text: '聚焦本人任课班级与学科，查看教学绩效、进退步和培优辅差名单。' },
                        { label: '家长 / 学生', text: '只查看个人成绩、成长报告、排名变化与提醒，不参与后台维护。' }
                    ]
                },
                {
                    title: '如何计算成绩',
                    copy: '所有结果都基于导入成绩与当前参数自动计算，不依赖人工手工拼表。',
                    type: 'metrics',
                    items: [
                        { label: '基础汇总', text: '系统会按科目自动生成单科分、总分、均分、班级/年级/镇域排名，并保留缺考、作弊等特殊值处理口径。' },
                        { label: '等级与达线', text: '根据优良及格线、目标线或分层线自动生成优秀率、及格率、达线人数与临界名单。' },
                        { label: '进退步', text: '把本次考试和历史考试按学生或班级匹配，比对总分、单科、排名和达线变化。' },
                        { label: '统一结果', text: '同一套配置会同时作用于网页端、Android 和家长端，保证查看和导出结果一致。' }
                    ]
                },
                {
                    title: '如何比较绩效',
                    copy: '绩效比较强调同条件、同口径、同维度，避免只看单次原始分数。',
                    type: 'metrics',
                    items: [
                        { label: '横向比较', text: '在同年级、同学科、同考试条件下比较学校、班级和教师的均分、两率一分与达线情况。' },
                        { label: '纵向比较', text: '按多次考试连续比较进退步、稳定性、目标达成率和阶段改善幅度。' },
                        { label: '基线校正', text: '教师绩效会结合历史基础或同基础学生分层，比较实际表现与预期表现，减少生源差异影响。' },
                        { label: '结果落地', text: '比较结果会继续联动到培优辅差、整改任务、学生详情和报告生成，形成闭环。' }
                    ]
                },
                {
                    title: '数据同步与结果输出',
                    copy: '系统既适合办公室 Web，也支持移动端分发与外部查看。',
                    type: 'grid',
                    items: [
                        { label: 'Web / Android / Desktop EXE', text: '网页端、安卓 APK 和桌面 EXE 共用统一登录入口与主要工作流，便于办公室电脑、手机和本地桌面端切换。' },
                        { label: '导出与分发', text: '可输出成绩单、成长报告、对比结果与分发版页面，便于班主任或家长查看。' },
                        { label: '云端协同', text: '支持账号同步、数据同步与统一下载入口，版本更新后能继续集中分发 APK。' },
                        { label: '使用建议', text: '每次新考试先导入原始数据并核对阈值，再做分析和绩效比较，结果会更稳定。' }
                    ]
                }
            ]
        };
    },

    renderSystemIntroModal: function (portal = this.getLoginPortal()) {
        const backdrop = this.ensureSystemIntroModal();
        if (!backdrop) return null;

        const content = this.getSystemIntroContent(portal);
        const chip = backdrop.querySelector('[data-intro-chip]');
        const title = backdrop.querySelector('[data-intro-title]');
        const copy = backdrop.querySelector('[data-intro-copy]');
        const focusLabel = backdrop.querySelector('[data-intro-focus-label]');
        const focusTitle = backdrop.querySelector('[data-intro-focus-title]');
        const focusCopy = backdrop.querySelector('[data-intro-focus-copy]');
        const quickStats = backdrop.querySelector('[data-intro-quickstats]');
        const body = backdrop.querySelector('[data-intro-body]');

        if (chip) chip.textContent = content.chip;
        if (title) title.textContent = content.title;
        if (copy) copy.textContent = content.copy;
        if (focusLabel) focusLabel.textContent = content.spotlight?.label || '';
        if (focusTitle) focusTitle.textContent = content.spotlight?.title || '';
        if (focusCopy) focusCopy.textContent = content.spotlight?.copy || '';
        if (quickStats) {
            quickStats.innerHTML = (content.quickStats || [])
                .map((item) => `
                    <article class="login-system-intro-stat">
                        <span>${item.label}</span>
                        <strong>${item.value}</strong>
                    </article>
                `)
                .join('');
        }
        if (body) {
            const renderCollection = (section) => {
                const items = Array.isArray(section.items) ? section.items : [];
                if (section.type === 'roles') {
                    return `
                        <div class="login-system-intro-role-list">
                            ${items.map((item) => `
                                <div class="login-system-intro-role-row">
                                    <strong>${item.label}</strong>
                                    <p>${item.text}</p>
                                </div>
                            `).join('')}
                        </div>
                    `;
                }
                const itemClass = section.type === 'steps'
                    ? 'login-system-intro-step'
                    : 'login-system-intro-metric';
                const wrapperClass = section.type === 'steps'
                    ? 'login-system-intro-flow'
                    : 'login-system-intro-grid';
                return `
                    <div class="${wrapperClass}">
                        ${items.map((item) => `
                            <article class="${itemClass}">
                                <strong>${item.label}</strong>
                                <p>${item.text}</p>
                            </article>
                        `).join('')}
                    </div>
                `;
            };

            body.innerHTML = (content.sections || [])
                .map((section, index) => `
                    <article class="login-system-intro-section login-system-intro-section--${section.type || 'grid'}">
                        <div class="login-system-intro-section-head">
                            <span class="login-system-intro-section-index">${String(index + 1).padStart(2, '0')}</span>
                            <div>
                                <h3>${section.title}</h3>
                                <p>${section.copy}</p>
                            </div>
                        </div>
                        ${renderCollection(section)}
                    </article>
                `)
                .join('');
        }

        return backdrop;
    },

    openDownloadHubModal: function (type = 'android') {
        this.ensureLoginWorkbench();
        this.closeSystemIntroModal();
        this.closeLoginPortalModal();
        const backdrop = this.renderDownloadHubModal(type);
        if (backdrop) {
            backdrop.style.display = 'flex';
            backdrop.setAttribute('aria-hidden', 'false');
        }
        document.body.classList.add('login-download-hub-open');
        this.setLoginWorkbenchNavState('download');
        setTimeout(() => {
            const title = backdrop?.querySelector('#login-download-hub-title');
            if (title && typeof title.focus === 'function') {
                title.focus({ preventScroll: true });
            }
        }, 60);
        return type === 'desktop' ? 'desktop' : 'android';
    },

    closeDownloadHubModal: function () {
        const backdrop = document.getElementById('login-download-hub-backdrop');
        if (backdrop) {
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('login-download-hub-open');
        if (!document.body.classList.contains('login-system-intro-open')) {
            this.setLoginWorkbenchNavState('modal');
        }
    },

    openSystemIntroModal: function (portal) {
        this.ensureLoginWorkbench();
        this.ensureSystemIntroModal();
        const nextPortal = this.setLoginPortal(portal || this.getLoginPortal());
        this.closeDownloadHubModal();
        this.closeLoginPortalModal();
        const backdrop = this.renderSystemIntroModal(nextPortal);
        if (backdrop) {
            backdrop.style.display = 'flex';
            backdrop.setAttribute('aria-hidden', 'false');
        }
        document.body.classList.add('login-system-intro-open');
        this.setLoginWorkbenchNavState('intro');
        setTimeout(() => {
            const title = backdrop?.querySelector('[data-intro-title]');
            if (title && typeof title.focus === 'function') {
                title.focus({ preventScroll: true });
            }
        }, 60);
        return nextPortal;
    },

    closeSystemIntroModal: function () {
        const backdrop = document.getElementById('login-system-intro-backdrop');
        if (backdrop) {
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('login-system-intro-open');
        this.setLoginWorkbenchNavState('modal');
    },

    openLoginPortalModal: function (portal) {
        this.ensureLoginWorkbench();
        this.closeSystemIntroModal();
        this.closeDownloadHubModal();
        const nextPortal = this.setLoginPortal(portal);
        const overlay = document.getElementById('login-overlay');
        const backdrop = document.getElementById('login-modal-backdrop');
        if (overlay) overlay.dataset.loginModal = 'inline';
        if (backdrop) {
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
        }
        document.body.classList.remove('login-modal-open');
        this.setLoginWorkbenchNavState('modal');
        this.focusLoginWorkbench({ scroll: false });
        return nextPortal;
    },

    closeLoginPortalModal: function () {
        const overlay = document.getElementById('login-overlay');
        const backdrop = document.getElementById('login-modal-backdrop');
        if (overlay) overlay.dataset.loginModal = 'inline';
        if (backdrop) {
            backdrop.style.display = 'none';
            backdrop.setAttribute('aria-hidden', 'true');
        }
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
            document.activeElement.blur();
        }
        document.body.classList.remove('login-modal-open');
        if (!document.body.classList.contains('login-system-intro-open')) {
            this.setLoginWorkbenchNavState('modal');
        }
    },

    syncLoginOverlayState: function (visible) {
        const overlay = document.getElementById('login-overlay');
        const app = document.getElementById('app');
        this.closeSystemIntroModal();
        this.closeDownloadHubModal();
        this.closeLoginPortalModal();
        if (visible) {
            this.syncParentMobileScrollRoot(false);
            setManualCohortSelectionGate(false);
            if (this._parentRenderTimer) {
                clearTimeout(this._parentRenderTimer);
                this._parentRenderTimer = null;
            }
        }
        document.body.classList.toggle('login-overlay-active', !!visible);
        document.body.dataset.authState = visible ? 'logged_out' : 'logged_in';
        if (overlay) {
            if (!visible && overlay.contains(document.activeElement) && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            overlay.style.display = visible ? 'flex' : 'none';
            overlay.style.visibility = visible ? 'visible' : 'hidden';
            overlay.style.opacity = visible ? '1' : '0';
            overlay.style.pointerEvents = visible ? 'auto' : 'none';
            overlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
            try { overlay.inert = !visible; } catch (_) { /* inert is best-effort */ }
            overlay.dataset.loginState = visible ? 'active' : 'hidden';
            if (visible) overlay.dataset.loginModal = 'inline';
            if (!visible) overlay.dataset.loginModal = 'hidden';
        }
        if (app) {
            app.classList.toggle('hidden', !!visible);
            app.setAttribute('aria-hidden', visible ? 'true' : 'false');
        }
    },

    syncLoginPortalUI: function (portal = this.getLoginPortal()) {
        const nextPortal = portal === 'parent' ? 'parent' : 'school';
        const overlay = document.getElementById('login-overlay');
        if (overlay) overlay.dataset.loginPortal = nextPortal;
        const panel = document.getElementById('login-portal-hub');
        if (panel) panel.dataset.loginPortal = nextPortal;

        document.querySelectorAll('.login-portal-card[data-portal], .login-portal-chip[data-portal]').forEach(card => {
            card.classList.toggle('active', card.dataset.portal === nextPortal);
            card.setAttribute('aria-pressed', card.dataset.portal === nextPortal ? 'true' : 'false');
        });

        const badgeEl = document.getElementById('login-portal-badge');
        const copyEl = document.getElementById('login-portal-copy');
        const userInput = document.getElementById('login-user');
        const classInput = document.getElementById('login-class');
        const classGroup = document.getElementById('login-class-group');
        const userHelper = document.getElementById('login-user-helper');
        const portalHelper = document.getElementById('login-portal-helper');
        const submitButton = document.getElementById('login-submit-button');
        const userLabel = document.getElementById('login-user-label');
        const classNote = document.getElementById('login-class-label-note');
        const stageKicker = document.getElementById('login-stage-kicker');
        const stageTitle = document.getElementById('login-stage-title');
        const stageCopy = document.getElementById('login-stage-copy');
        const stageMeta = document.querySelector('.login-stage-meta');
        const stageFeatureTitle = document.getElementById('login-stage-featured-title');
        const stageFeatureCopy = document.getElementById('login-stage-featured-copy');
        const modalChip = document.getElementById('login-modal-chip');
        const modalTitle = document.getElementById('login-modal-title');
        const modalCopy = document.getElementById('login-modal-copy');
        const authTitle = document.querySelector('.login-auth-title');
        const portalLaunchKicker = document.querySelector('.login-portal-launch-head span');
        const portalLaunchCopy = document.querySelector('.login-portal-launch-head p');
        const portalNote = document.querySelector('.login-portal-note');
        const authFacts = document.getElementById('login-auth-facts');
        if (authFacts) authFacts.remove();

        const config = nextPortal === 'parent'
            ? {
                badge: '家长成长入口',
                authTitle: '登录入口',
                copy: '',
                userLabel: '学生姓名',
                userPlaceholder: '请输入学生姓名',
                userHelper: '建议使用学生姓名登录，并完整填写班级信息。',
                classNote: '(家长端必填，如 701)',
                classPlaceholder: '请输入学生班级，如 701',
                helper: '当前为家长端，验证后进入成长报告与成绩视图。',
                submit: '进入家长端',
                stageKicker: 'Family Growth Portal',
                stageTitle: '<span class="login-stage-title-line">查看成长报告</span><span class="login-stage-title-line login-stage-title-line--accent">更轻、更清楚、更直接</span>',
                stageCopy: '像 Instagram 一样把入口和动作分清楚，让家长端登录页更聚焦，也更适合移动端。',
                stageMeta: [
                    { icon: 'ti ti-heart-handshake', text: '成长报告 / 成绩查询 / 家校提醒' },
                    { icon: 'ti ti-devices', text: '手机、安卓与桌面端共用同一套入口' },
                    { icon: 'ti ti-sparkles', text: '当前稳定版 v1.0 · 2026-04-08' }
                ],
                launchKicker: '登录窗口',
                launchCopy: '先选择家长端，再打开唯一登录窗口；表单、说明和下载都各归其位。',
                launchNote: '应用下载会打开下载中心，系统介绍会说明角色权限、流程和成绩规则。',
                stageFeatureTitle: '家长端聚焦成绩、报告与提醒',
                stageFeatureCopy: '首页只留下最重要的入口和价值点，避免像旧版那样把所有信息都堆在首屏。',
                modalChip: '家长端登录窗口',
                modalTitle: '进入家长端',
                modalCopy: '输入学生姓名、班级与密码后，直接查看成长报告、成绩与家校提醒。',
                navButton: '打开家长端'
            }
            : {
                badge: '学校工作台',
                authTitle: '登录入口',
                copy: '',
                userLabel: '账号 / 姓名',
                userPlaceholder: '管理员账号 / 教师姓名',
                userHelper: '支持管理员、教务、年级、班主任与教师账号登录。',
                classNote: '(学校端无需填写)',
                classPlaceholder: '学校端无需填写',
                helper: '当前为学校端，验证通过后直达教学分析与数据维护。',
                submit: '进入学校工作台',
                stageKicker: 'School Command Center',
                stageTitle: '<span class="login-stage-title-line">统一登录</span><span class="login-stage-title-line login-stage-title-line--accent">把学校端和家长端放在一张首页里</span>',
                stageCopy: '借鉴 Instagram 的左右双栏逻辑，把品牌、入口和表单层级重新理顺。',
                stageMeta: [
                    { icon: 'ti ti-layout-dashboard', text: '教学分析 / 数据维护 / 学校工作台' },
                    { icon: 'ti ti-devices', text: 'Web、Android 与 Desktop 共用入口逻辑' },
                    { icon: 'ti ti-sparkles', text: '当前稳定版 v1.0 · 2026-04-08' }
                ],
                launchKicker: '登录窗口',
                launchCopy: '先选学校端或家长端，再在唯一登录窗口里完成验证，减少跳转和视觉噪音。',
                launchNote: '应用下载会打开双端下载中心，系统介绍会说明模块结构、角色权限和核心逻辑。',
                stageFeatureTitle: '登录、下载与系统说明各自独立',
                stageFeatureCopy: '首屏只负责建立品牌感和主入口，不再把所有解释文字都堆到同一块大面板里。',
                modalChip: '学校端登录窗口',
                modalTitle: '进入学校端',
                modalCopy: '输入账号与密码后，直接进入教学分析、数据维护与学校工作台。',
                navButton: '打开学校端'
            };

        if (nextPortal === 'parent') {
            Object.assign(config, {
                badge: '家长身份验证',
                authTitle: '家长登录',
                copy: '家长端验证成功后，直接进入成长报告、成绩与提醒页面。',
                helper: '当前为家长端，验证成功后直接进入成长查看界面。',
                submit: '进入家长端',
                stageKicker: 'Family Portal',
                stageTitle: '<span class="login-stage-title-line">家长端登录</span><span class="login-stage-title-line login-stage-title-line--accent">验证后直接查看成长数据</span>',
                stageCopy: '家长端保持轻量路径，输入学生姓名、班级和密码后，直接查看成长报告、成绩与提醒。',
                stageFeatureTitle: '家长端保持直接进入成长视图',
                stageFeatureCopy: '学校端与家长端共用同一张登录页，但家长端不进入届别选择，验证后直接打开成长数据。',
                launchKicker: 'Switch Portal',
                launchCopy: '切换到家长端后，内联表单会自动改成学生姓名、班级和密码验证。',
                launchNote: '家长端仍然保留直接进入成长查看的短路径。'
            });
        } else {
            Object.assign(config, {
                badge: '学校身份验证',
                authTitle: '登录验证',
                copy: '学校端验证成功后，会先进入届别选择界面，再进入对应届别工作台。',
                helper: '当前为学校端，验证成功后会先进入届别选择界面。',
                submit: '验证并进入届别选择',
                stageKicker: 'Step 1 / Login',
                stageTitle: '<span class="login-stage-title-line">先登录</span><span class="login-stage-title-line login-stage-title-line--accent">再选择届别进入工作台</span>',
                stageCopy: '登录页只负责身份验证，不再把届别选择和主工作台混在同一层里。',
                stageFeatureTitle: '登录成功后不会直接进入系统',
                stageFeatureCopy: '学校端固定采用“登录验证 → 届别选择 → 工作台”的路径，避免直接落到错误届别或空模块。',
                launchKicker: 'Two-step Flow',
                launchCopy: '学校端与家长端共用内联登录页，但学校端验证后必须先经过届别选择。',
                launchNote: '下载与系统说明都留在辅助入口里，登录动作本身只负责验证。'
            });
        }

        const portalCards = {
            school: {
                title: '学校端',
                desc: '教学分析、数据维护与学校管理入口。',
                meta: 'Analysis / Data / Workspace',
                action: '打开学校端窗口'
            },
            parent: {
                title: '家长端',
                desc: '成长报告、成绩查询与家校提醒入口。',
                meta: 'Report / Score / Reminder',
                action: '打开家长端窗口'
            }
        };

        Object.entries(portalCards).forEach(([portalName, cardConfig]) => {
            const card = document.querySelector(`.login-portal-card[data-portal="${portalName}"], .login-portal-chip[data-portal="${portalName}"]`);
            if (!card) return;
            const titleEl = card.querySelector('.login-portal-title');
            const descEl = card.querySelector('.login-portal-desc');
            const metaEl = card.querySelector('.login-portal-meta');
            const actionEl = card.querySelector('.login-portal-action');
            if (titleEl) titleEl.textContent = cardConfig.title;
            if (descEl) descEl.textContent = cardConfig.desc;
            if (metaEl) metaEl.textContent = cardConfig.meta;
            if (actionEl) actionEl.textContent = cardConfig.action;
            if (!titleEl && !descEl && !metaEl && !actionEl) card.textContent = cardConfig.title;
        });

        if (badgeEl) badgeEl.textContent = config.badge;
        if (copyEl) {
            const nextCopy = String(config.copy || '').trim();
            copyEl.textContent = nextCopy;
            copyEl.style.display = nextCopy ? '' : 'none';
            copyEl.setAttribute('aria-hidden', nextCopy ? 'false' : 'true');
        }
        if (userLabel) userLabel.textContent = config.userLabel;
        if (userInput) userInput.placeholder = config.userPlaceholder;
        if (userHelper) userHelper.textContent = config.userHelper;
        if (classNote) classNote.textContent = config.classNote;
        if (classInput) classInput.placeholder = config.classPlaceholder;
        if (classGroup) {
            classGroup.style.display = nextPortal === 'parent' ? 'block' : 'none';
            classGroup.setAttribute('aria-hidden', nextPortal === 'parent' ? 'false' : 'true');
        }
        if (portalHelper) portalHelper.textContent = config.helper;
        if (submitButton) submitButton.textContent = config.submit;
        if (stageKicker) stageKicker.textContent = config.stageKicker;
        if (stageTitle) stageTitle.innerHTML = config.stageTitle;
        if (stageCopy) stageCopy.textContent = config.stageCopy;
        if (stageMeta) {
            stageMeta.innerHTML = (config.stageMeta || [])
                .map(item => `<span><i class="${item.icon}"></i> ${item.text}</span>`)
                .join('');
        }
        if (stageFeatureTitle) stageFeatureTitle.textContent = config.stageFeatureTitle;
        if (stageFeatureCopy) stageFeatureCopy.textContent = config.stageFeatureCopy;
        if (authTitle) authTitle.textContent = config.authTitle;
        if (portalLaunchKicker) portalLaunchKicker.textContent = config.launchKicker;
        if (portalLaunchCopy) portalLaunchCopy.textContent = config.launchCopy;
        if (portalNote) portalNote.textContent = config.launchNote;
        if (modalChip) modalChip.textContent = config.modalChip;
        if (modalTitle) modalTitle.textContent = config.modalTitle;
        if (modalCopy) modalCopy.textContent = config.modalCopy;
        const navButton = document.querySelector('.login-stage-nav-login');
        if (navButton) navButton.textContent = config.navButton || '打开登录窗口';
        this.renderSystemIntroModal(nextPortal);
    },

    resolveLocalManagedSchool: function (name, className = '') {
        const normalizedName = String(name || '').trim();
        const normalizedClass = this.normalizeManagedClass(className);
        if (normalizedName && normalizedClass && Array.isArray(RAW_DATA)) {
            const parentRow = RAW_DATA.find(row =>
                String(row?.name || '').trim() === normalizedName
                && this.areEquivalentClasses(row?.class, normalizedClass)
            );
            if (parentRow && parentRow.school) return String(parentRow.school).trim();
        }
        if (normalizedName && typeof TEACHER_SCHOOL_MAP === 'object' && TEACHER_SCHOOL_MAP) {
            const teacherSchool = TEACHER_SCHOOL_MAP[normalizedName];
            if (teacherSchool) return String(teacherSchool).trim();
        }
        if (normalizedName && typeof TEACHER_MAP === 'object' && TEACHER_MAP && Array.isArray(RAW_DATA)) {
            for (const [key, teacherName] of Object.entries(TEACHER_MAP)) {
                if (String(teacherName || '').trim() !== normalizedName) continue;
                const cls = String(key || '').split('_')[0];
                const classRow = RAW_DATA.find(row => String(row?.class || '').trim() === cls);
                if (classRow && classRow.school) return String(classRow.school).trim();
            }
        }
        return readCurrentSchool();
    },

    tryLocalManagedLogin: function (username, password, inputClass = '') {
        const canUseLocalManagedLogin = !!window.EMBEDDED_DB || window.location.protocol === 'file:' || !navigator.onLine || !EdgeGateway.hasGatewayConfig();
        if (!canUseLocalManagedLogin) return null;
        const match = AuthState.findManagedAccount(this.db, username, inputClass);
        if (!match || !AuthState.matchesManagedPassword(match.record, match.role, password)) return null;

        const normalizedClass = String(match.record?.class || inputClass || '').trim();
        const localSchool = this.resolveLocalManagedSchool(match.record?.name, normalizedClass);
        const role = match.role;
        return {
            username: String(match.record?.name || username).trim(),
            role,
            roles: [role],
            school: localSchool,
            class_name: isParentLikeRole(role) ? normalizedClass : '教师',
            local_only: true,
            must_change_password: match.record?.must_change_password !== false
        };
    },

    init: async function () {
        this.ensureLoginWorkbench();
        this.syncLoginPortalUI();
        this.closeSystemIntroModal();
        this.closeLoginPortalModal();
        if (!this._loginModalEscapeBound) {
            document.addEventListener('keydown', (event) => {
                if (event.key !== 'Escape') return;
                if (document.body.classList.contains('login-system-intro-open')) {
                    this.closeSystemIntroModal();
                    return;
                }
                this.closeLoginPortalModal();
            });
            this._loginModalEscapeBound = true;
        }
        const sessionUser = AuthState.getCurrentUser();
        this.syncLoginOverlayState(!sessionUser);
        if (sessionUser) {
            this.currentUser = sessionUser;
            this.setLoginPortal(isParentLikeUser(this.currentUser) ? 'parent' : 'school');
            if (window.EdgeGateway && typeof EdgeGateway.verify === 'function' && EdgeGateway.getToken()) {
                EdgeGateway.verify().catch(err => {
                    console.warn('[EdgeGateway] session verify failed:', err?.message || err);
                    EdgeGateway.clearSession();
                });
            }
            this.syncLoginOverlayState(false);
            this.applyRoleView();

            // 如果是家长，恢复视图
            if (isParentLikeUser(this.currentUser)) {
                if (!this.currentUser.local_only && (!RAW_DATA || RAW_DATA.length === 0) && typeof loadCloudData === 'function' && !this._parentDataRecovering) {
                    this._parentDataRecovering = true;
                    try {
                        UI.loading(true, "正在恢复学生数据...");
                        await loadCloudData();
                    } catch (e) {
                        console.warn('家长会话恢复：云端数据拉取失败', e);
                    } finally {
                        this._parentDataRecovering = false;
                        UI.loading(false);
                    }
                }
                this.renderParentView();
            }
            // 🟢 补充：如果是其他角色，恢复主视图 (防止刷新后空白)
            else if (!isParentLikeUser(this.currentUser)) {
                if (typeof renderNavigation === 'function') renderNavigation();
                const restoredCohortId = String(CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
                const restoredExamId = String(CURRENT_EXAM_ID || readWorkspaceExamId() || COHORT_DB?.currentExamId || '').trim();
                const hasReadyWorkspace = !!restoredCohortId
                    && !!restoredExamId
                    && Array.isArray(RAW_DATA)
                    && RAW_DATA.length > 0;
                if (hasReadyWorkspace) {
                    tryAutoRestoreWorkspaceExam({ preferredExamId: restoredExamId, cohortId: restoredCohortId });
                    tryAutoEnterReadyCohortWorkspace();
                } else {
                    showCohortPicker();
                }
                if (!this.currentUser.local_only && (!RAW_DATA || RAW_DATA.length === 0) && typeof loadCloudData === 'function') {
                    scheduleStartupCloudTask(() => {
                        withTimeout(loadCloudData(), CLOUD_STARTUP_LOAD_TIMEOUT_MS, 'cloud-load-timeout')
                            .then(() => {
                                tryAutoRestoreWorkspaceExam({
                                    preferredExamId: CURRENT_EXAM_ID || readWorkspaceExamId() || COHORT_DB?.currentExamId || '',
                                    cohortId: CURRENT_COHORT_ID || readWorkspaceCohortId() || ''
                                });
                                tryAutoEnterReadyCohortWorkspace();
                                if (typeof scheduleTeacherSyncPrompt === 'function') {
                                    setTimeout(() => scheduleTeacherSyncPrompt(), 200);
                                }
                            })
                            .catch(e => console.warn('[Auth.init] background cloud load failed:', e));
                    }, { delay: 1400, timeout: 2600 });
                } else if (typeof scheduleTeacherSyncPrompt === 'function') {
                    setTimeout(() => scheduleTeacherSyncPrompt(), 200);
                }
            }
        }
    },

    /* 👇👇👇 ✋ 🟢 [此处开始替换] 重写 login 函数 (登录后立即刷新主界面) 🟢 ✋ 👇👇👇 */

    // 🟢 核心登录逻辑：改为查 Supabase 数据库 (已修复 406 报错 + 增加班级强校验)
    login: async function () {
        const user = document.getElementById('login-user').value.trim();
        const pass = document.getElementById('login-pass').value.trim();
        // 获取输入的班级 (去除空格)
        const loginPortal = this.getLoginPortal();
        const classInputEl = document.getElementById('login-class');
        const inputClass = classInputEl ? classInputEl.value.trim() : '';
        if (loginPortal === 'parent' && user && pass && !inputClass) return UI.toast('家长端请输入学生班级', 'error');

        if (!user || !pass) return UI.toast('请输入账号和密码', 'error');

        UI.loading(true, "正在验证身份...");

        try {
            let data = null;
            let gatewayError = null;
            const canUseGatewayLogin = !!(window.EdgeGateway && typeof EdgeGateway.login === 'function' && EdgeGateway.hasGatewayConfig());
            const canUseLocalManagedLogin = !!window.EMBEDDED_DB || window.location.protocol === 'file:' || !navigator.onLine || !canUseGatewayLogin;

            if (canUseGatewayLogin) {
                try {
                    const gatewayRes = await EdgeGateway.login(user, pass, inputClass);
                    data = gatewayRes?.user || null;
                } catch (error) {
                    gatewayError = error instanceof Error ? error : new Error(String(error));
                }
            }

            if (!data && canUseLocalManagedLogin) {
                data = this.tryLocalManagedLogin(user, pass, inputClass);
            }

            /* legacy browser-direct login fallback removed
                    alert("❌ 系统连接失败！\n\n网关暂不可用，且云端数据库尚未加载完毕。\n\n请稍后刷新页面重试。");
                const directRes = { error: new Error('EDGE_GATEWAY_REQUIRED'), data: null };
                if (directRes.error) {
                    UI.loading(false);
                    console.error("Database Login Error:", directRes.error);
                    return alert("系统连接错误：" + directRes.error.message);
                }
                data = directRes.data || null;
            }

            */
            UI.loading(false);

            if (!data) {
                if (gatewayError) {
                    const message = String(gatewayError.message || '').trim();
                    if (message.includes('class_name mismatch')) {
                        return alert(`❌ 班级不匹配！\n\n您输入的班级：${inputClass || '未填写'}\n请核对后重试。`);
                    }
                    if (message.includes('Invalid username or password')) {
                        return alert("❌ 登录失败！\n\n可能原因：\n1. 账号或密码错误\n2. 管理员尚未将账号同步到云端");
                    }
                    return alert("❌ 登录失败：" + message);
                }
                if (!canUseGatewayLogin) {
                    return alert("❌ 登录失败！\n\n当前页面未配置云端账号网关，且在本地分发账号中未找到匹配用户。");
                }
                return alert("❌ 登录失败！\n\n可能原因：\n1. 账号或密码错误\n2. 管理员尚未将账号【同步到云端】");
            }

            /* 👇👇👇 🟢 新增代码：家长角色强制校验班级 🟢 👇👇👇 */
            if (isParentLikeRole(data.role) || data.role === 'class_teacher') {
                if (!inputClass) {
                    if (isParentLikeRole(data.role)) {
                        return alert("❌ 登录失败：家长/学生必须输入【班级】才能登录。");
                    }
                }

                // 对比输入的班级和数据库存的班级，兼容 9.4 / 94 / 904 这类常见写法差异
                const dbClass = String(data.class_name || '').trim();
                const userClass = String(inputClass || '').trim();
                const classMatches = userClass
                    && dbClass
                    && this.areEquivalentClasses(dbClass, userClass);

                if (userClass && (!dbClass || !classMatches)) {
                    return alert(`❌ 班级不匹配！\n\n您输入的班级：${inputClass}\n系统记录的班级：${data.class_name || '未录入'}\n\n请核对后重试。`);
                }
            }
            /* 👆👆👆 🟢 结束 🟢 👆👆👆 */

            // 4. 登录成功，构建用户对象
            const matchedUser = {
                name: data.username || data.name,
                role: data.role, // 主角色（兼容）
                roles: data.roles || [data.role], // 🆕 支持多角色数组
                school: data.school,
                class: data.class_name, // 数据库字段名
                local_only: !!data.local_only,
                must_change_password: !!data.must_change_password
            };

            const isLocalOnlySession = !!data.local_only;
            this.currentUser = AuthState.setCurrentUser(matchedUser) || matchedUser;
            this.setLoginPortal(isParentLikeUser(this.currentUser) ? 'parent' : 'school');
            const selectedLoginCohort = String(document.getElementById('login-cohort-select')?.value || '').trim();
            if (!isParentLikeUser(this.currentUser) && selectedLoginCohort) {
                const yearInput = document.getElementById('entry-cohort-year');
                if (yearInput) yearInput.value = selectedLoginCohort;
                if (typeof enterCohortFromMask === 'function') {
                    try {
                        await enterCohortFromMask();
                    } catch (cohortError) {
                        console.warn('[Auth] failed to enter selected login cohort:', cohortError?.message || cohortError);
                    }
                }
            }
            if (!isLocalOnlySession && (!window.EdgeGateway || !EdgeGateway.getToken()) && window.EdgeGateway && typeof EdgeGateway.login === 'function') {
                const gatewayClassName = (isParentLikeUser(this.currentUser) || this.currentUser.role === 'class_teacher') ? inputClass : '';
                EdgeGateway.login(user, pass, gatewayClassName).catch(err => {
                    console.warn('[EdgeGateway] login skipped:', err?.message || err);
                });
            }
            // 先彻底隐藏登录层，再进入业务界面，避免旧登录页残留一帧。
            this.syncLoginOverlayState(false);
            // 界面切换
            this.applyRoleView();
            updateAdminOnlyButtons();
            updateWatermark();
            updateRoleHint();

            // 🆕 记录所有角色信息
            const rolesInfo = this.currentUser.roles && this.currentUser.roles.length > 1
                ? `${this.currentUser.role} (${this.currentUser.roles.join(', ')})`
                : this.currentUser.role;
            logAction('登录', `用户 ${this.currentUser.name} (${rolesInfo}) 登录`);

            // === 安全检查：临时密码或后端标记账号首次登录后必须改密 ===
            const isDefaultPass = AuthState.isDefaultManagedPassword(this.currentUser.role, pass);

            if (isDefaultPass || this.currentUser.must_change_password) {
                this.syncLoginOverlayState(false); // 先关掉登录框

                // 弹出提示
                alert("⚠️ 安全警告：\n检测到当前账号需要完成首次改密。\n为了保障账号安全，请立即修改密码。");

                // 打开修改密码弹窗 (传入 true 表示强制模式)
                setTimeout(() => openUserPasswordModal(true), 500);
                return; // ⛔ 终止后续加载，直到密码修改完成
            }
            // === 🛡️ 安全检查结束 ===
            const loginUserEl = document.getElementById('login-user');
            const loginPassEl = document.getElementById('login-pass');
            const loginClassEl = document.getElementById('login-class');
            if (document.activeElement && typeof document.activeElement.blur === 'function') {
                document.activeElement.blur();
            }
            [loginUserEl, loginPassEl, loginClassEl].forEach(el => {
                if (el && typeof el.blur === 'function') el.blur();
            });
            this.syncLoginOverlayState(false);

            if (window.UI) UI.toast(`登录成功！欢迎 ${this.currentUser.name}`, 'success');

            const shouldHydrateCloudInBackground = !isLocalOnlySession && typeof loadCloudData === 'function';
            const tryResumeReadyWorkspace = () => {
                tryAutoRestoreWorkspaceExam({
                    preferredExamId: CURRENT_EXAM_ID || readWorkspaceExamId() || COHORT_DB?.currentExamId || '',
                    cohortId: CURRENT_COHORT_ID || readWorkspaceCohortId() || ''
                });
                const restoredCohortId = String(CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
                const restoredExamId = String(CURRENT_EXAM_ID || readWorkspaceExamId() || '').trim();
                const hasReadyWorkspace = !!restoredCohortId
                    && !!restoredExamId
                    && Array.isArray(RAW_DATA)
                    && RAW_DATA.length > 0;
                if (!hasReadyWorkspace) return false;
                const mask = document.getElementById('mode-mask');
                const app = document.getElementById('app');
                const maskVisible = !!mask && getComputedStyle(mask).display !== 'none';
                const appHidden = !!app && app.classList.contains('hidden');
                if (maskVisible && appHidden) setManualCohortSelectionGate(false);
                return tryAutoEnterReadyCohortWorkspace();
            };
            const startBackgroundCloudHydration = (loaderText) => {
                if (!shouldHydrateCloudInBackground) return;
                const needsManualCohort = typeof requiresManualCohortSelection === 'function' && requiresManualCohortSelection();
                if (needsManualCohort) return;
                const runHydration = () => {
                    if (window.__COHORT_SWITCH_IN_PROGRESS__) return;
                    if (Array.isArray(RAW_DATA) && RAW_DATA.length > 0) return;
                    withTimeout(loadCloudData(), CLOUD_STARTUP_LOAD_TIMEOUT_MS, 'cloud-load-timeout')
                    .then(() => {
                        tryResumeReadyWorkspace();
                        if (typeof scheduleTeacherSyncPrompt === 'function') {
                            setTimeout(() => scheduleTeacherSyncPrompt(), 200);
                        }
                    })
                    .catch(err => {
                        console.warn('[Auth.login] background cloud load failed:', err);
                        if (typeof loadCloudData === 'function') {
                            loadCloudData()
                                .then(() => {
                                    tryResumeReadyWorkspace();
                                    if (typeof scheduleTeacherSyncPrompt === 'function') {
                                        setTimeout(() => scheduleTeacherSyncPrompt(), 200);
                                    }
                                })
                                .catch(bgErr => console.warn('[Auth.login] delayed cloud retry failed:', bgErr));
                        }
                    });
                };
                if (window.__STARTUP_CLOUD_HYDRATION_TIMER__) clearTimeout(window.__STARTUP_CLOUD_HYDRATION_TIMER__);
                window.__STARTUP_CLOUD_HYDRATION_TIMER__ = scheduleStartupCloudTask(runHydration, { delay: 1400, timeout: 2600 });
            };

            // 5. 分流跳转与权限初始化
            if (isParentLikeUser(this.currentUser)) {
                if (!isLocalOnlySession && (!RAW_DATA || RAW_DATA.length === 0) && typeof loadCloudData === 'function') {
                    UI.loading(true, "正在恢复学生数据...");
                    try {
                        await withTimeout(loadCloudData(), CLOUD_STARTUP_LOAD_TIMEOUT_MS, 'cloud-load-timeout');
                    } catch (e) {
                        console.warn('[Auth.login] parent cloud load timeout/fail:', e);
                        if (typeof loadCloudData === 'function') {
                            loadCloudData().catch(err => console.warn('[Auth.login] parent background cloud load failed:', err));
                        }
                    } finally {
                        UI.loading(false);
                    }
                }
                // === 家长模式 ===
                this.renderParentView();
            } else {
                // === 教职工模式 (管理员/主任/教师/班主任/级部主任) ===
                // 初始化轻量导航；重表格在届别数据就绪后统一调度，避免登录后主线程阻塞。
                if (typeof renderNavigation === 'function') renderNavigation();
                if (typeof updateSchoolSelect === 'function') updateSchoolSelect();

                // 7. 先展示届别选择，不再从登录页直接进入工作台
                if (typeof CohortManager !== 'undefined') {
                    CohortManager.init();
                }
                const restoredCohortId = String(CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
                const restoredExamId = String(CURRENT_EXAM_ID || readWorkspaceExamId() || '').trim();
                const hasReadyWorkspace = !!restoredCohortId
                    && !!restoredExamId
                    && Array.isArray(RAW_DATA)
                    && RAW_DATA.length > 0;
                setManualCohortSelectionGate(!hasReadyWorkspace);
                showCohortPicker();
                if (hasReadyWorkspace) {
                    tryResumeReadyWorkspace();
                }

                // 👇👇👇 🟢 新增：角色专属初始化逻辑 🟢 👇👇👇

                // A. 如果有学校绑定 (除管理员外通常都有)
                if (this.currentUser.school) {
                    // 自动设置本校全局变量
                    writeCurrentSchool(this.currentUser.school);

                    // 尝试更新界面上的“选择本校”下拉框
                    const sel = document.getElementById('mySchoolSelect');
                    if (sel) {
                        sel.value = readCurrentSchool();
                        // 触发一次 change 事件以更新相关下拉框 (如班级列表)
                        sel.dispatchEvent(new Event('change'));
                    }
                }

                // B. 角色权限细分处理
                if (this.currentUser.role === 'teacher') {
                    // 普通教师：后续将在 renderStudentDetails 中过滤只能看自己教的课
                    UI.toast(`欢迎您，${this.currentUser.name}老师`, "success");
                }
                else if (this.currentUser.role === 'class_teacher') {
                    // 班主任：后续将在 renderStudentDetails 中过滤只能看本班
                    UI.toast(`欢迎您，${this.currentUser.class}班班主任`, "success");

                    // 尝试自动定位到“学生档案查询”模块的班级筛选
                    setTimeout(() => {
                        const clsSel = document.getElementById('studentClassSelect');
                        if (clsSel) {
                            clsSel.value = this.currentUser.class;
                            clsSel.dispatchEvent(new Event('change')); // 触发筛选
                        }
                    }, 500);
                }
                else if (this.currentUser.role === 'grade_director') {
                    // 级部主任：
                    // 1. 拥有修改成绩权限 (在 updateStudentScore 中控制)
                    // 2. 能接收消息 (需显示铃铛按钮)
                    // 3. 只能看本级部 (在 renderStudentDetails 中控制)

                    UI.toast(`欢迎您，${this.currentUser.class}年级主任`, "success");

                    // 开启消息轮询 (复用管理员的逻辑)
                    const msgBtn = document.getElementById('admin-msg-btn');
                    if (msgBtn) msgBtn.style.display = 'block'; // 显示铃铛

                    // 轮询交由 applyRoleView 统一管理，避免重复定时器导致卡顿
                }
                /* 👆👆👆 🟢 结束 🟢 👆👆👆 */

                startBackgroundCloudHydration("正在后台恢复成绩数据...");
            }

        } catch (err) {
            UI.loading(false);
            console.error(err);
            alert("登录异常中断：" + err.message);
        }
    },

    // 登出
    logout: function () {
        logAction('登出', '退出登录');
        AuthState.clearCurrentUser();
        if (window.EdgeGateway && typeof EdgeGateway.clearSession === 'function') {
            EdgeGateway.clearSession();
        }
        location.reload(); // 刷新页面最彻底，清除所有临时状态
    },

    // 应用视图权限 (配合 CSS data-role 属性)
    applyRoleView: function () {
        if (!this.currentUser) return;

        // 🆕 使用 RoleManager 应用多角色
        RoleManager.applyRolesToBody(this.currentUser);
        this.syncParentMobileScrollRoot(isParentLikeUser(this.currentUser));

        const role = this.currentUser.role; // 主角色（兼容旧代码）

        // 🟢 [Bug #1 修复] 设置全局年级过滤器，供其他模块使用
        if (role === 'grade_director' && this.currentUser.class) {
            window.USER_GRADE_FILTER = String(this.currentUser.class).trim();
            appDebug(`[权限] 级部主任年级过滤已启用: ${window.USER_GRADE_FILTER}`);
        } else {
            window.USER_GRADE_FILTER = null;
        }

        const msgBtn = document.getElementById('admin-msg-btn');
        if (msgBtn) {
            // 🟢 修改：使用多角色检查
            const canSeeMessages = RoleManager.hasAnyRole(this.currentUser, ['admin', 'director', 'grade_director', 'class_teacher']);

            if (canSeeMessages) {
                msgBtn.style.display = 'block';

                // 启动消息轮询 (每30秒查一次，检查 IssueManager 是否已加载)
                if (typeof IssueManager !== 'undefined') {
                    IssueManager.checkIssues();
                    // 清除旧定时器防止重复
                    if (window.msgInterval) clearInterval(window.msgInterval);
                    window.msgInterval = setInterval(() => IssueManager.checkIssues(), 30000);
                }
            } else {
                msgBtn.style.display = 'none';
            }
        }

        // 🟢 添加或更新悬浮个人中心条 (包含修改密码) -> 改为注入到 Header 的 #account-actions
        let accountActionsContainer = document.getElementById('account-actions');

        if (accountActionsContainer) {
            accountActionsContainer.innerHTML = ''; // 清空重新渲染

            // 渲染两个按钮：修改密码 | 退出 (YouTube 风格纯图标)
            accountActionsContainer.innerHTML = `
                <button class="btn" onclick="openUserPasswordModal()" style="background:transparent; border:none; color:var(--text-color); font-size: 22px; padding: 8px; border-radius: 50%; display:flex; align-items:center; justify-content:center; width:40px; height:40px;" title="修改密码">
                    <i class="ti ti-key"></i>
                </button>
                <div onclick="Auth.logout()" style="cursor:pointer; background:var(--primary); color:white; font-size: 16px; font-weight:bold; border-radius: 50%; display:flex; align-items:center; justify-content:center; width:36px; height:36px; margin-left:8px;" title="退出登录 (${this.currentUser.name})">
                    ${this.currentUser.name ? this.currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
            `;
        }

        // 注意：这里移除了 btn.onclick，因为点击事件直接写在 span 里的 HTML 中了
        // 🟢 [新增] 动态添加“账号管理”入口按钮 (针对有权用户)
        // 1. 获取当前用户角色
        const currentRole = this.currentUser.role;
        const allowedRoles = ['admin', 'director', 'grade_director', 'class_teacher'];

        // 2. 查找 header 里的工具栏容器 (第三个子元素，即右侧容器)
        const toolbar = document.querySelector('#main-header > div:last-child');

        // 3. 先移除旧按钮(防止重复添加)
        const oldBtn = document.getElementById('header-acc-mgr-btn');
        if (oldBtn) oldBtn.remove();

        // 4. 如果有权限且容器存在，插入按钮
        if (toolbar && allowedRoles.includes(currentRole)) {
            const mgrBtn = document.createElement('button');
            mgrBtn.id = 'header-acc-mgr-btn';
            mgrBtn.className = 'btn';
            // 样式微调：纯图标按钮
            mgrBtn.style.cssText = 'background:transparent; border:none; color:var(--text-color); font-size: 22px; padding: 8px; border-radius: 50%; display:inline-flex; align-items:center; justify-content:center; width:40px; height:40px;';
            mgrBtn.innerHTML = '<i class="ti ti-user-cog"></i>';
            mgrBtn.title = "账号权限管理";

            // 绑定点击事件：打开账号管理弹窗
            mgrBtn.onclick = () => AccountManager.open();

            // 5. 插入到通知铃铛按钮前面 (寻找 admin-msg-btn)
            const msgBtnNode = document.getElementById('admin-msg-btn');
            if (msgBtnNode && msgBtnNode.parentNode === toolbar) {
                toolbar.insertBefore(mgrBtn, msgBtnNode);
            } else {
                toolbar.insertBefore(mgrBtn, toolbar.firstChild);
            }
        }
        // 🟢 [修正]：将以下代码移入 applyRoleView 函数内部，接在上面的代码后面

        // 🟢 [新增] 动态添加“数据管理”入口 (仅限 管理员/教务主任)
        const dataRoles = ['admin', 'director'];

        // 先移除旧按钮(防止重复)
        const oldDataBtn = document.getElementById('header-data-mgr-btn');
        if (oldDataBtn) oldDataBtn.remove();

        // 确保使用当前角色的引用进行判断
        if (toolbar && dataRoles.includes(currentRole)) {
            const dataBtn = document.createElement('button');
            dataBtn.id = 'header-data-mgr-btn';
            dataBtn.className = 'btn shell-cloud-data-button';
            dataBtn.style.cssText = 'background:linear-gradient(135deg,#0f766e 0%,#14b8a6 100%); border:none; color:#ffffff; font-size:13px; font-weight:800; padding:9px 14px; border-radius:999px; display:inline-flex; align-items:center; justify-content:center; gap:7px; min-width:96px; height:40px; box-shadow:0 14px 28px rgba(20,184,166,0.22); white-space:nowrap;';
            dataBtn.innerHTML = '<i class="ti ti-cloud-data-connection" style="font-size:18px;"></i><span>云端数据</span>';
            dataBtn.title = "打开云端教务数据管理";

            // 绑定点击事件
            dataBtn.onclick = () => {
                DataManager.open();
                setTimeout(() => {
                    if (window.DataManager && typeof window.DataManager.switchTab === 'function') {
                        window.DataManager.switchTab('cloud');
                    }
                }, 0);
            };

            // 插入到工具栏最前面 (作为最高频功能)
            toolbar.insertBefore(dataBtn, toolbar.firstChild);
        }

    },

    // 👨‍👩‍👧 渲染家长专属视图 (完全隔离)
    renderParentView: function () {
        // 1. 彻底隐藏主界面及所有干扰元素 (防止透视)
        const app = document.getElementById('app');
        const header = document.querySelector('header');
        const nav = document.querySelector('.nav-wrapper');
        const overlay = document.getElementById('login-overlay');
        const loader = document.getElementById('global-loader');

        if (this._parentRenderTimer) {
            clearTimeout(this._parentRenderTimer);
            this._parentRenderTimer = null;
        }

        if (app) app.style.display = 'none'; // 关键：隐藏主应用
        if (header) header.style.display = 'none';
        if (nav) nav.style.display = 'none';
        if (overlay) this.syncLoginOverlayState(false);
        if (loader) loader.classList.add('hidden');

        // 2. 创建或重置家长容器
        let container = document.getElementById('parent-view-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'parent-view-container';
            document.body.appendChild(container);
        }

        // 确保容器可见
        container.style.display = 'block';
        container.scrollTop = 0;
        this.syncParentMobileScrollRoot(true);

        // 3. 移动端视口适配 (防止表格太宽看不全)
        let viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes');
        }

        // A. 立即渲染骨架屏 (Skeleton Screen)
        container.innerHTML = `
                <div class="sk-card skeleton"><div class="sk-header"></div></div>
                <div class="sk-card skeleton"><div class="sk-block" style="width:80%"></div></div>
                <div style="display:flex; gap:10px;">
                    <div class="sk-card skeleton" style="flex:1;"><div class="sk-chart"></div></div>
                    <div class="sk-card skeleton" style="flex:1;"><div class="sk-chart"></div></div>
                </div>
            `;

        // 延时加载数据，给骨架屏一点展示时间
        this._parentRenderTimer = setTimeout(async () => {
            this._parentRenderTimer = null;
            if (!isParentLikeUser(this.currentUser)) return;
            if (!RAW_DATA || RAW_DATA.length === 0) {
                container.innerHTML = `<div style="text-align:center; padding:50px; color:#666;">
                        <i class="ti ti-database-off" style="font-size:48px; margin-bottom:10px; display:block;"></i>
                        数据加载中...<br><small>请稍候 (如长时间无反应请刷新)</small>
                    </div>`;

                if (!this._parentRenderRetrying && typeof loadCloudData === 'function') {
                    this._parentRenderRetrying = true;
                    loadCloudData()
                        .then(() => {
                            if (RAW_DATA && RAW_DATA.length > 0) {
                                this.renderParentView();
                            }
                        })
                        .catch(e => {
                            console.warn('家长视图自动重试拉取失败:', e);
                        })
                        .finally(() => {
                            this._parentRenderRetrying = false;
                        });
                }
                return;
            }

            // 容错查找：优先使用当前报告学生（云端对比命中后会写入）
            const currentReportStudent = readCurrentReportStudentState();
            const normalizeParentName = typeof normalizeCompareName === 'function'
                ? (value) => normalizeCompareName(value)
                : (value) => String(value || '').replace(/\s+/g, '').toLowerCase();
            const normalizeParentClass = typeof normalizeClass === 'function'
                ? (value) => normalizeClass(value)
                : (value) => String(value || '').replace(/\s+/g, '');
            const stuFromCurrent = currentReportStudent && currentReportStudent.scores && (
                normalizeParentName(currentReportStudent.name || '') === normalizeParentName(this.currentUser?.name || '')
            ) ? currentReportStudent : null;

            // 回退：优先使用云端对比运行时的绑定学生；若运行时未加载，则直接在当前成绩库中兜底查找
            const boundStudent = typeof getCurrentBoundStudentFromUser === 'function'
                ? getCurrentBoundStudentFromUser(this.currentUser)
                : null;
            if (!boundStudent && typeof getCurrentBoundStudentFromUser !== 'function') {
                console.warn('[ParentView] getCurrentBoundStudentFromUser is unavailable, fallback to RAW_DATA lookup');
            }
            const stu = stuFromCurrent
                || boundStudent
                || RAW_DATA.find(s =>
                    normalizeParentName(s?.name || '') === normalizeParentName(this.currentUser?.name || '') &&
                    normalizeParentClass(s?.class || '') === normalizeParentClass(this.currentUser?.class || '')
                );

            if (!stu) {
                container.innerHTML = `<div style="text-align:center; padding:50px; color:red;">
                        ❌ 未找到学生【${this.currentUser.name}】（${this.currentUser.class}班）的数据。<br>
                        请联系班主任确认名单是否已上传。
                    </div>`;
                return;
            }

            if (typeof window.ensureReportRenderRuntimeLoaded === 'function') {
                try {
                    await window.ensureReportRenderRuntimeLoaded();
                } catch (error) {
                    console.error('Failed to load report render runtime for parent view:', error);
                    container.innerHTML = `<div style="text-align:center; padding:50px; color:red;">
                        Report runtime failed to load. Please refresh and try again.
                    </div>`;
                    return;
                }
            }

            setCurrentReportStudentState(stu);

            // 渲染报表 HTML
            let reportHtml = renderSingleReportCardHTML(stu, 'A4');

            // 去除不必要的输入框
            const teacherName = TEACHER_MAP[stu.class + '_班主任'] || '班主任';
            reportHtml = reportHtml.replace(/<input.*id="inp-teacher-name".*?>/, `<span style="font-weight:bold">${teacherName}</span>`);

            // 安全处理：防止姓名或班级中有引号导致 JS 报错
            const safeName = stu.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeClass = stu.class.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeSchool = stu.school.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            // 追加底部功能栏 (申诉 & 退出)
            reportHtml += `
                    <div style="text-align:center; margin-top:30px; padding-bottom:80px; border-top:1px dashed #e5e7eb; padding-top:20px;">
                        <p style="font-size:14px; color:#64748b; margin-bottom:15px;">数据有疑问？</p>
                        <!-- 核心修复：使用转义后的变量 -->
                        <button class="btn" style="background:#fff7ed; color:#c2410c; border:1px solid #fed7aa; font-size:16px; padding:10px 20px; margin-bottom:20px;"
                                onclick="IssueManager.openSubmitModal('${safeName}', '${safeClass}', '${safeSchool}')">
                            <i class="ti ti-alert-circle"></i> 申请成绩核查
                        </button>

                        <br>
                        <button onclick="Auth.logout()" style="background:none; border:none; color:#94a3b8; text-decoration:underline; font-size:14px; cursor:pointer;">
                            退出登录
                        </button>
                    </div>
                `;

            container.innerHTML = reportHtml;
            enhanceStudentReportMetrics(container);

            // 渲染图表 (Canvas)
            setTimeout(() => {
                try {
                    if (typeof renderRadarChart === 'function') renderRadarChart(stu);
                    if (typeof renderVarianceChart === 'function') renderVarianceChart(stu);
                } catch (e) { console.error("图表渲染失败:", e); }
            }, 200);

        }, 500);
    },

    // 辅助：渲染生成账号时的学校列表
    renderSchoolCheckboxes: function () {
        const container = document.getElementById('admin-gen-school-list');
        if (!container) return; // 如果找不到容器（比如非管理员），直接返回，不报错

        if (typeof SCHOOLS === 'undefined' || Object.keys(SCHOOLS).length === 0) {
            container.innerHTML = '<div style="color:#999; text-align:center; padding:10px;">暂无数据，请先上传成绩</div>';
            return;
        }

        let html = '';
        Object.keys(SCHOOLS).forEach(sch => {
            html += `
                    <label style="display:flex; align-items:center; margin-bottom:3px; cursor:pointer;">
                        <input type="checkbox" class="gen-school-check" value="${sch}" checked>
                        <span style="margin-left:5px;">${sch}</span>
                    </label>
                `;
        });
        container.innerHTML = html;
    },

    // 辅助：全选/反选
    toggleAllSchools: function (check) {
        document.querySelectorAll('.gen-school-check').forEach(el => el.checked = check);
    },

    generateRecoverableAccountsForSchools: function (selectedSchools, options = {}) {
        const schools = Array.isArray(selectedSchools)
            ? Array.from(new Set(selectedSchools.map(item => String(item || '').trim()).filter(Boolean)))
            : [];
        if (!RAW_DATA.length) {
            return { ok: false, error: "请先在【数据中心】上传成绩数据" };
        }
        if (!schools.length) {
            return { ok: false, error: "请至少选择一所学校" };
        }

        let countParentNew = 0;
        let countParentUpd = 0;
        let countTeacherNew = 0;

        const targetStudents = RAW_DATA.filter(s => schools.includes(s.school));
        targetStudents.forEach(s => {
            const existIdx = this.db.parents.findIndex(p => p.name === s.name && p.class === s.class);
            const newAccount = {
                name: s.name,
                class: s.class,
                pass: createManagedTemporaryPassword('parent'),
                password_mode: 'temporary',
                must_change_password: true
            };
            if (existIdx >= 0) {
                this.db.parents[existIdx] = newAccount;
                countParentUpd++;
            } else {
                this.db.parents.push(newAccount);
                countParentNew++;
            }
        });

        const targetClasses = new Set();
        targetStudents.forEach(s => targetClasses.add(s.class));

        const targetTeachers = new Set();
        if (Object.keys(TEACHER_MAP).length > 0) {
            Object.keys(TEACHER_MAP).forEach(key => {
                const [cls] = key.split('_');
                if (targetClasses.has(cls)) {
                    targetTeachers.add(TEACHER_MAP[key]);
                }
            });
        } else {
            console.warn("未配置教师任课表，仅能生成家长账号");
        }

        targetTeachers.forEach(tName => {
            const existIdx = this.db.teachers.findIndex(t => t.name === tName);
            const newAccount = {
                name: tName,
                pass: createManagedTemporaryPassword('teacher'),
                password_mode: 'temporary',
                must_change_password: true,
                grade: 'all'
            };
            if (existIdx >= 0) {
                this.db.teachers[existIdx].pass = createManagedTemporaryPassword('teacher');
                this.db.teachers[existIdx].password_mode = 'temporary';
                this.db.teachers[existIdx].must_change_password = true;
            } else {
                this.db.teachers.push(newAccount);
                countTeacherNew++;
            }
        });

        if (options.persist !== false) {
            this.db = persistLocalAuthDb(this.db);
        }

        return {
            ok: true,
            selectedSchools: schools,
            parentNew: countParentNew,
            parentReset: countParentUpd,
            teacherNew: countTeacherNew,
            teacherTouched: targetTeachers.size,
            targetStudentCount: targetStudents.length
        };
    },

    // 🛠️ 管理员工具：批量生成账号 (支持指定学校增量更新)
    generateAccounts: function () {
        if (!RAW_DATA.length) return alert("请先在【数据中心】上传成绩数据");

        // 1. 获取界面上勾选的学校
        const checkboxes = document.querySelectorAll('.gen-school-check:checked');
        const selectedSchools = Array.from(checkboxes).map(cb => cb.value);

        if (selectedSchools.length === 0) {
            return alert("请至少勾选一所学校！\n(如果列表为空，请先上传数据)");
        }

        if (!confirm(`⚠️ 确定要为选中的 [${selectedSchools.length}] 所学校生成账号吗？\n\n1. 仅生成/更新选中学校的学生和老师账号。\n2. 未选中学校的现有账号将【保留】。\n3. 系统会生成一次性临时密码，账号首次登录后必须改密。`)) return;
        const generation = this.generateRecoverableAccountsForSchools(selectedSchools, { persist: true });
        if (!generation.ok) {
            return alert(`❌ ${generation.error}`);
        }

        let msg = `✅ 操作完成！\n\n`;
        msg += `覆盖学校：${generation.selectedSchools.join(', ')}\n`;
        msg += `家长账号：新增 ${generation.parentNew} / 重置 ${generation.parentReset}\n`;
        msg += `教师账号：新增 ${generation.teacherNew} / 涉及 ${generation.teacherTouched}\n`;
        msg += `\n(提示：未选中学校的旧账号已自动保留)`;

        // 🚫 已注释掉成功后的弹窗，避免干扰
        // alert(msg);

        // 仅在右下角显示轻提示
        if (window.UI) UI.toast("✅ 账号生成操作完成", "success");
    },


    // 🛠️ 管理员工具：导出账号明细 (新功能)
    exportAccounts: function () {
        if (!this.db.teachers.length && !this.db.parents.length) {
            return alert("当前没有生成任何普通账号，请先点击“一键生成”。");
        }

        // 1. 获取界面上勾选的学校
        const checkboxes = document.querySelectorAll('.gen-school-check:checked');
        const selectedSchools = Array.from(checkboxes).map(cb => cb.value);

        // 判断是否启用了筛选 (如果有勾选，且勾选数量小于总学校数，则视为筛选)
        // 逻辑优化：只要有勾选，就只导出勾选的；如果一个都没勾(或全没勾)，则导出全部
        const isFiltering = selectedSchools.length > 0;

        const wb = XLSX.utils.book_new();
        // 表头增加一列 "所属学校 (仅导出时计算)"
        const data = [['角色', '用户名/姓名', '登录班级 (家长必填)', '密码', '所属学校/备注']];

        // --- A. 写入管理员/主任 (始终导出，不受筛选影响) ---
        data.push(['管理员', 'admin', '-', MASKED_PASSWORD_DISPLAY, '最高权限（明文口令不导出）']);
        const dirPass = MASKED_PASSWORD_DISPLAY;
        data.push(['教务主任', 'director', '-', dirPass, '查看除账号外所有信息']);

        // --- 准备筛选辅助数据 ---
        let validClasses = new Set();   // 选中学校包含的所有班级

        if (isFiltering) {
            // 遍历 RAW_DATA 构建白名单，比每次 find 快
            RAW_DATA.forEach(s => {
                if (selectedSchools.includes(s.school)) {
                    validClasses.add(s.class);
                }
            });
        }

        // --- B. 写入教师信息 ---
        let teacherCount = 0;
        this.db.teachers.forEach(t => {
            let shouldExport = true;
            if (isFiltering) {
                // 检查该老师是否任教于选中的学校 (通过班级反查)
                let isRelevant = false;
                // 遍历 TEACHER_MAP 查找该老师教的班级
                for (const [key, tName] of Object.entries(TEACHER_MAP)) {
                    if (tName === t.name) {
                        const [cls, sub] = key.split('_');
                        if (validClasses.has(cls)) {
                            isRelevant = true;
                            break;
                        }
                    }
                }
                shouldExport = isRelevant;
            }

            if (shouldExport) {
                data.push(['教师', t.name, '-', getRecoverableManagedPassword(t, 'teacher'), `${isFiltering ? '关联选中学校；' : ''}首次登录后必须改密`]);
                teacherCount++;
            }
        });

        // --- C. 写入家长信息 ---
        let parentCount = 0;
        this.db.parents.forEach(p => {
            let shouldExport = true;
            let schoolName = '';

            // 尝试找回学校名以便填写在备注里 (账号库里没存学校，需要回查 RAW_DATA)
            const stuRecord = RAW_DATA.find(r => r.name === p.name && r.class === p.class);
            if (stuRecord) schoolName = stuRecord.school;

            if (isFiltering) {
                // 只有当学生属于选中学校时才导出
                if (stuRecord && selectedSchools.includes(stuRecord.school)) {
                    shouldExport = true;
                } else {
                    shouldExport = false;
                }
            }

            if (shouldExport) {
                data.push(['家长', p.name, p.class, getRecoverableManagedPassword(p, 'parent'), `${schoolName || '未知/已删除'}；首次登录后必须改密`]);
                parentCount++;
            }
        });

        this.db = persistLocalAuthDb(this.db);

        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 25 }];

        let fileName = `账号清单_${new Date().toLocaleDateString()}.xlsx`;
        if (isFiltering) {
            // 如果只选了一个学校，文件名带上学校名
            if (selectedSchools.length === 1) fileName = `${selectedSchools[0]}_账号清单.xlsx`;
            else fileName = `特定学校账号清单(共${selectedSchools.length}校).xlsx`;
        }

        XLSX.utils.book_append_sheet(wb, ws, "账号列表");
        XLSX.writeFile(wb, fileName);

        // 🚫 已注释掉导出成功后的弹窗
        /*
        if (isFiltering) {
            alert(`✅ 已导出选定范围的账号：\n教师: ${teacherCount} 人\n家长: ${parentCount} 人`);
        }
        */
    },

    // 🟢 [新增] 向云端数据库添加账号

    // 🟢 [修改] 适配级部主任和班主任的手动添加
    addCloudAccount: async function () {
        const role = document.getElementById('manual-role').value;
        const username = document.getElementById('manual-name').value.trim();
        const password = document.getElementById('manual-pass').value.trim();
        const school = document.getElementById('manual-school').value.trim();

        // 获取各个输入框的元素
        const classInput = document.getElementById('manual-class');
        const gradeInput = document.getElementById('manual-grade');

        // 根据角色获取 "class_name" 字段应该存什么
        let className = "";

        if (role === 'parent' || role === 'class_teacher') {
            // 必须检查元素是否存在
            if (classInput) className = classInput.value.trim();
        }
        else if (role === 'grade_director') {
            // 必须检查元素是否存在
            if (gradeInput) className = gradeInput.value.trim();
        }
        // 普通教师给一个默认值，防止数据库非空报错
        else if (role === 'teacher') {
            className = "教师";
        }

        // --- 校验逻辑 ---
        // 1. 账号密码必填
        if (!username || !password) return alert("❌ 请填写账号和密码");
        if (password.length < 8) return alert("❌ 临时密码至少需要 8 位，并将在首次登录后强制修改。");

        // 2. 学校必填 (除了管理员)
        if (role !== 'admin' && !school) return alert("❌ 请填写所属学校");

        // 3. 班级/年级必填校验
        if ((role === 'parent' || role === 'class_teacher') && !className) {
            return alert("❌ 请填写【班级】(例如: 701)");
        }
        if (role === 'grade_director' && !className) {
            return alert("❌ 请填写【级部/年级】(例如: 7)");
        }

        if (!window.EdgeGateway || typeof EdgeGateway.upsertAccounts !== 'function') {
            return alert("❌ 账号网关未就绪，请稍后重试。");
        }

        UI.loading(true, "正在写入账号库...");

        const newUserData = {
            username: username,
            password: password,
            role: role,
            school: role === 'admin' ? '系统' : school, // 管理员默认学校
            class_name: className // 这是一个复用字段：对家长/班主任是班级，对级部主任是年级
        };

        let error = null;
        try {
            await EdgeGateway.upsertAccounts([newUserData]);
        } catch (e) {
            error = e;
        }

        UI.loading(false);

        if (error) {
            console.error(error);
            alert("❌ 操作失败：" + (error.message || error));
        } else {
            UI.toast(`✅ 账号 [${username}] 已添加/更新成功！`, "success");
            if (typeof this.refreshCloudAccountMigrationStatus === 'function') {
                this.refreshCloudAccountMigrationStatus();
            }
            // 清空姓名输入框，方便继续添加
            document.getElementById('manual-name').value = '';
            // 如果是家长，不清空班级，方便连续添加同班学生
            if (role !== 'parent') {
                if (classInput) classInput.value = '';
                if (gradeInput) gradeInput.value = '';
            }
        }
    },
    // 🛠️ 管理员工具：批量同步本地生成的账号到云端 (V4 智能容错版)
    // 特性：自动去重 + 失败自动降级为单条上传 + 精确报错
    buildRecoverableCloudAccountRows: function () {
        const parents = this.db.parents || [];
        const teachers = this.db.teachers || [];
        const uniqueMap = new Map(); // key: username, value: dataObj
        const globalDefaultSchool = window.MY_SCHOOL || "默认学校";

        // 辅助：查找学校
        const getSchool = (name, cls) => {
            // 尝试从 RAW_DATA 查找准确学校
            if (typeof RAW_DATA !== 'undefined') {
                const s = RAW_DATA.find(r => r.name === name && r.class == cls);
                if (s) return s.school;
            }
            return globalDefaultSchool;
        };

        // 辅助：强力清洗字符串 (去空格、去特殊符)
        const cleanStr = (str) => String(str || "").trim().replace(/\s+/g, "");

        // --- A. 处理家长数据 ---
        parents.forEach(p => {
            const user = cleanStr(p.name);
            if (!user) return;

            uniqueMap.set(user, {
                username: user,
                password: cleanStr(getRecoverableManagedPassword(p, 'parent')),
                role: 'parent',
                school: getSchool(p.name, p.class),
                class_name: cleanStr(p.class) // 班级
            });
        });

        // --- B. 处理教师数据 (优先级高，覆盖同名家长) ---
        // 预处理教师学校映射
        const teaSchMap = {};
        if (typeof TEACHER_MAP !== 'undefined') {
            Object.entries(TEACHER_MAP).forEach(([k, v]) => {
                const cls = k.split('_')[0];
                // 简易反查：遍历学校找班级
                if (typeof SCHOOLS !== 'undefined') {
                    for (let sName in SCHOOLS) {
                        const schoolRecord = getAppSchoolRecord(sName);
                        if ((schoolRecord?.students || []).some(s => s.class == cls)) {
                            teaSchMap[v] = sName; break;
                        }
                    }
                }
            });
        }

        teachers.forEach(t => {
            const user = cleanStr(t.name);
            if (!user) return;

            uniqueMap.set(user, { // 写入 Map，自动覆盖同名 Key
                username: user,
                password: cleanStr(getRecoverableManagedPassword(t, 'teacher')),
                role: 'teacher',
                school: teaSchMap[t.name] || globalDefaultSchool,
                class_name: '教师'
            });
        });

        this.db = persistLocalAuthDb(this.db);

        return {
            parents,
            teachers,
            batchData: Array.from(uniqueMap.values())
        };
    },

    uploadRecoverableCloudAccounts: async function (batchData) {
        if (!window.EdgeGateway || typeof EdgeGateway.upsertAccounts !== 'function') {
            throw new Error("账号网关未就绪，请稍后重试。");
        }
        const safeRows = Array.isArray(batchData) ? batchData : [];
        if (!safeRows.length) {
            return { successCount: 0, failCount: 0, errorDetails: [] };
        }

        appDebug(`[同步准备] 去重后:${safeRows.length}`);

        // --- C. 智能分批上传 ---
        const BATCH_SIZE = 10; // 保守批次大小
        let successCount = 0;
        let failCount = 0;
        let errorDetails = [];

        // 定义单条重试函数
        const uploadOneByOne = async (items) => {
            let ok = 0;
            for (let item of items) {
                try {
                    await EdgeGateway.upsertAccounts([item]);
                    ok++;
                    successCount++;
                } catch (error) {
                    console.warn(`❌ 单条写入失败 [${item.username}]:`, error?.message || error);
                    failCount++;
                    errorDetails.push(`${item.username}: ${error?.message || error}`);
                }
            }
            return ok;
        };

        for (let i = 0; i < safeRows.length; i += BATCH_SIZE) {
            const chunk = safeRows.slice(i, i + BATCH_SIZE);

            // 1. 尝试批量写入
            const pct = Math.round(((i + chunk.length) / safeRows.length) * 100);
            try {
                await EdgeGateway.upsertAccounts(chunk);
                successCount += chunk.length;
            } catch (error) {
                console.warn(`⚠️ 批次 ${Math.ceil(i / BATCH_SIZE) + 1} 报错 (HTTP 500/409)，自动降级为单条上传模式...`);
                // 2. 批量失败，自动降级为单条循环
                await uploadOneByOne(chunk);
            }

            UI.loading(true, `☁️ 同步中... ${pct}% (成功:${successCount} / 失败:${failCount})`);
            // 稍微延时防止数据库压力过大
            if (failCount > 50) throw new Error("错误过多，中止上传"); // 熔断机制
            await new Promise(r => setTimeout(r, 50));
        }

        return { successCount, failCount, errorDetails };
    },

    syncBatchToCloud: async function () {
        const payload = this.buildRecoverableCloudAccountRows();
        const parents = payload.parents || [];
        const teachers = payload.teachers || [];
        const batchData = payload.batchData || [];

        if (parents.length === 0 && teachers.length === 0) {
            return alert("⚠️ 本地账号为空！请先点击【👤 一键生成所有账号】。");
        }

        if (!confirm(`⚠️ 准备同步账号到云端：\n\n👨‍👩‍👧 家长：${parents.length}\n👨‍🏫 教师：${teachers.length}\n\n确定覆盖云端数据吗？`)) return;

        UI.loading(true, "正在清洗并去重数据...");

        try {
            const result = await this.uploadRecoverableCloudAccounts(batchData);
            UI.loading(false);

            if (result.failCount > 0) {
                console.error("失败详情:", result.errorDetails);
                alert(`⚠️ 同步完成，但有 ${result.failCount} 个账号失败！\n\n✅ 成功：${result.successCount}\n❌ 失败：${result.failCount}\n\n可能原因：账号包含非法字符或数据库字段超长。\n按 F12 查看控制台可看具体失败名单。`);
            } else {
                UI.toast(`✅ 完美同步！共 ${result.successCount} 个账号已上线`, "success");
                if (window.Logger) Logger.log('同步账号', `同步了 ${result.successCount} 个账号`);
            }

            if (typeof this.refreshCloudAccountMigrationStatus === 'function') {
                this.refreshCloudAccountMigrationStatus();
            }

        } catch (e) {
            UI.loading(false);
            console.error(e);
            alert("❌ 同步中断：" + e.message);
        }
    },

    migrateRecoverableAccountsToCloud: async function () {
        const payload = this.buildRecoverableCloudAccountRows();
        const batchData = payload.batchData || [];

        if (!batchData.length) {
            this.setCloudAccountMigrationInlineMessage(
                '当前浏览器没有本地可恢复账号。这个按钮只会补迁本浏览器已保存的老师/家长账号，不会直接重置云端现有密码。请先点击上方“生成账号”或“一键同步所有账号到云端”。',
                'warning'
            );
            return alert("⚠️ 当前浏览器还没有可恢复密码的老师/家长账号。\n\n请先导入或生成账号，或改用“管理员/主任登录一次、后台改密一次”的方式完成迁移。");
        }

        const roleSummary = `👨‍👩‍👧 家长：${(payload.parents || []).length}\n👨‍🏫 教师：${(payload.teachers || []).length}\n🔐 可补迁账号：${batchData.length}`;
        const ok = confirm(`⚠️ 准备将本地可恢复密码的账号批量补迁到 Cloudflare。\n\n${roleSummary}\n\n说明：\n1. 只会补迁本地能恢复密码的账号\n2. 管理员/主任若未回填，仍需登录一次或后台改密\n3. 同名账号会直接更新为 Cloudflare 哈希\n\n是否继续？`);
        if (!ok) return;

        UI.loading(true, "正在补迁本地可恢复账号...");
        try {
            const result = await this.uploadRecoverableCloudAccounts(batchData);
            UI.loading(false);

            if (result.failCount > 0) {
                console.error("失败详情:", result.errorDetails);
                alert(`⚠️ 补迁完成，但有 ${result.failCount} 个账号失败！\n\n✅ 成功：${result.successCount}\n❌ 失败：${result.failCount}`);
            } else {
                UI.toast(`✅ 已补迁 ${result.successCount} 个本地可恢复账号`, "success");
            }

            if (window.Logger) {
                Logger.log('补迁账号', `从本地密码库补迁了 ${result.successCount} 个可恢复账号到 Cloudflare`);
            }
            if (typeof this.refreshCloudAccountMigrationStatus === 'function') {
                this.refreshCloudAccountMigrationStatus();
            }
        } catch (error) {
            UI.loading(false);
            console.error(error);
            alert("❌ 补迁失败：" + (error?.message || error));
        }
    },

    // 🛠️ 管理员工具：批量删除云端账号 (保留管理员)
    deleteCloudAccounts: async function () {
        if (!window.EdgeGateway || typeof EdgeGateway.deleteManagedAccounts !== 'function') {
            return alert("❌ 账号网关未就绪，请稍后重试。");
        }

        // 1. 第一重确认
        if (!confirm("⚠️【高风险操作】⚠️\n\n您确定要清空云端数据库中的所有【家长】和【教师】账号吗？\n\n注意：\n1. 此操作不可撤销！\n2. 管理员账号会被保留，不会被删除。\n3. 删除后用户将无法登录，直到您再次同步。")) {
            return;
        }

        // 2. 第二重确认 (防止误触)
        const input = prompt("🔴 请输入 '确认删除' 四个字以执行清空操作：");
        if (input !== "确认删除") {
            return alert("操作已取消。");
        }

        UI.loading(true, "正在清理云端账号库...");

        try {
            // 执行删除操作
            // 逻辑：删除所有 role 不等于 'admin' 和 'director' 的用户
            const { count } = await EdgeGateway.deleteManagedAccounts();

            UI.loading(false);

            alert(`✅ 清理完成！\n共删除了 ${count !== null ? count : '若干'} 个云端账号。\n\n现在您可以重新生成并同步新名单了。`);

            // 🛡️ [日志埋点] 记录清空账号操作
            Logger.log('清空账号', `管理员执行了清空云端普通账号操作 (影响:${count}人)`);
            if (typeof this.refreshCloudAccountMigrationStatus === 'function') {
                this.refreshCloudAccountMigrationStatus();
            }

        } catch (e) {
            UI.loading(false);
            console.error(e);
            alert("❌ 删除失败：" + e.message);
        }
    },

    exportAllCloudAccounts: async function () {
        if (!window.EdgeGateway || typeof EdgeGateway.exportAccounts !== 'function') {
            return alert("❌ 账号网关未就绪，无法导出。");
        }

        if (!confirm("⚠️ 准备从云端下载所有账号数据。\n\n这将包含数据库中存储的：\n1. 管理员\n2. 教师/班主任/主任\n3. 家长/学生\n\n确定要导出吗？")) return;

        UI.loading(true, "正在从云端拉取所有账号...");

        try {
            const { records: data } = await EdgeGateway.exportAccounts();

            if (!data || data.length === 0) {
                throw new Error("云端数据库为空，没有账号可导出。");
            }

            // 2. 准备 Excel 数据
            const headers = ['角色', '学校', '班级/范围', '账号/姓名', '密码状态'];
            const excelData = [headers];

            // 角色名称映射字典
            const roleMap = {
                'admin': '👑 管理员',
                'director': '🎓 教务主任',
                'grade_director': '🚀 级部主任',
                'class_teacher': '📋 班主任',
                'teacher': '👨‍🏫 科任教师',
                'parent': '👨‍👩‍👧 家长/学生'
            };

            data.forEach(u => {
                const roleName = roleMap[u.role] || u.role;
                excelData.push([
                    roleName,
                    u.school || '-',       // 学校
                    u.class_name || '-',   // 班级
                    u.username,            // 账号
                    u.password_display || '未设置'
                ]);
            });

            // 3. 生成并下载 Excel
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.aoa_to_sheet(excelData);

            // 设置列宽 (美观)
            ws['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 15 }];

            XLSX.utils.book_append_sheet(wb, ws, "云端全量账号");

            const fileName = `云端全量账号备份_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`;
            XLSX.writeFile(wb, fileName);

            UI.loading(false);
            UI.toast(`✅ 导出成功！共 ${data.length} 条数据`, "success");

        } catch (err) {
            UI.loading(false);
            console.error(err);
            alert("❌ 导出失败: " + err.message);
        }
    },

    formatCloudAccountMigrationRoleLabel: function (role) {
        const roleMap = {
            admin: '管理员',
            director: '教务主任',
            grade_director: '级部主任',
            class_teacher: '班主任',
            teacher: '教师',
            parent: '家长/学生'
        };
        return roleMap[String(role || '').trim()] || String(role || '未知角色').trim() || '未知角色';
    },

    renderCloudAccountMigrationStatus: function (payload) {
        const summaryEl = document.getElementById('cloud-account-migration-status');
        const updatedEl = document.getElementById('cloud-account-migration-updated');
        if (!summaryEl) return;

        const summary = payload && payload.summary ? payload.summary : {};
        const total = Number(summary.total_accounts || 0);
        const migrated = Number(summary.migrated_accounts || 0);
        const pending = Number(summary.pending_accounts || 0);
        const rate = Number(summary.completion_rate || 0);
        const roles = Array.isArray(payload?.roles) ? payload.roles : [];
        const sources = Array.isArray(payload?.sources) ? payload.sources : [];

        const roleRows = roles.slice(0, 6).map((row) => {
            const label = this.formatCloudAccountMigrationRoleLabel(row.role);
            const roleMigrated = Number(row.migrated_accounts || 0);
            const roleTotal = Number(row.total_accounts || 0);
            return `<div style="display:flex; justify-content:space-between; gap:10px;"><span>${label}</span><span>${roleMigrated}/${roleTotal}</span></div>`;
        }).join('');

        const sourceText = sources.slice(0, 3).map((row) => {
            const labelMap = {
                pending: '待迁移',
                supabase_export: '历史导入待激活',
                supabase_login: '旧登录回填',
                legacy_login_backfill: '旧登录回填',
                cloudflare_upsert: '云端同步',
                cloudflare_reset: '后台重置',
                cloudflare_change: '用户改密'
            };
            const label = labelMap[String(row.password_source || '').trim()] || String(row.password_source || 'unknown').trim();
            return `${label} ${Number(row.account_count || 0)} 个`;
        }).join(' / ');

        summaryEl.innerHTML = `
            <div style="display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; margin-bottom:10px;">
                <div style="background:white; border-radius:8px; padding:10px; border:1px solid #dbeafe;">
                    <div style="font-size:11px; color:#64748b;">活跃账号</div>
                    <div style="font-size:18px; font-weight:700; color:#0f172a;">${total}</div>
                </div>
                <div style="background:white; border-radius:8px; padding:10px; border:1px solid #dbeafe;">
                    <div style="font-size:11px; color:#64748b;">已迁移</div>
                    <div style="font-size:18px; font-weight:700; color:#166534;">${migrated}</div>
                </div>
                <div style="background:white; border-radius:8px; padding:10px; border:1px solid #dbeafe;">
                    <div style="font-size:11px; color:#64748b;">待迁移</div>
                    <div style="font-size:18px; font-weight:700; color:#b45309;">${pending}</div>
                </div>
            </div>
            <div style="margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:4px;">
                    <span>旧登录回退收口进度</span>
                    <span>${rate.toFixed(1)}%</span>
                </div>
                <div style="height:8px; border-radius:999px; background:#dbeafe; overflow:hidden;">
                    <div style="height:100%; width:${Math.max(0, Math.min(rate, 100))}%; background:linear-gradient(90deg,#2563eb,#16a34a);"></div>
                </div>
            </div>
            <div style="display:grid; gap:4px; font-size:12px; color:#334155; margin-bottom:8px;">
                ${roleRows || '<div>暂无角色分布数据</div>'}
            </div>
            <div style="font-size:12px; color:#64748b;">
                ${sourceText || '待迁移账号会在首次成功登录、后台重置密码或重新同步账号后自动补迁到 Cloudflare。'}
            </div>
        `;

        if (updatedEl) {
            updatedEl.textContent = `最近刷新：${new Date().toLocaleString()}`;
        }
    },

    setCloudAccountMigrationInlineMessage: function (message, tone = 'info') {
        const summaryEl = document.getElementById('cloud-account-migration-status');
        const updatedEl = document.getElementById('cloud-account-migration-updated');
        if (!summaryEl) return;
        const colorMap = {
            info: '#475569',
            warning: '#b45309',
            error: '#b91c1c',
            success: '#166534'
        };
        summaryEl.innerHTML = `<div style="font-size:13px; color:${colorMap[tone] || colorMap.info}; line-height:1.8;">${String(message || '').trim()}</div>`;
        if (updatedEl) {
            updatedEl.textContent = `最近提示：${new Date().toLocaleString()}`;
        }
    },

    refreshCloudAccountMigrationStatus: async function () {
        const summaryEl = document.getElementById('cloud-account-migration-status');
        const updatedEl = document.getElementById('cloud-account-migration-updated');
        if (!summaryEl) return;
        const canUseWorkerStatus = typeof shouldUseCloudProxy === 'function'
            ? shouldUseCloudProxy()
            : (typeof shouldUseSupabaseProxy === 'function'
                ? shouldUseSupabaseProxy()
                : (typeof shouldUseSameOriginCloudProxy === 'function'
                    ? shouldUseSameOriginCloudProxy()
                    : (typeof shouldUseSameOriginSupabaseProxy === 'function'
                        ? shouldUseSameOriginSupabaseProxy()
                        : false)));
        if (!canUseWorkerStatus) {
            summaryEl.innerHTML = '<span style="color:#64748b;">本地开发或离线环境下不显示迁移看板，请在线上域名查看 Cloudflare 迁移进度。</span>';
            if (updatedEl) updatedEl.textContent = '当前环境不支持';
            return;
        }
        if (!window.EdgeGateway || typeof EdgeGateway.getAccountMigrationStatus !== 'function') {
            summaryEl.innerHTML = '<span style="color:#b91c1c;">账号网关未就绪，暂时无法读取迁移状态。</span>';
            return;
        }

        summaryEl.innerHTML = '<span style="color:#475569;">正在读取 Cloudflare 迁移状态...</span>';
        if (updatedEl) updatedEl.textContent = '刷新中...';

        try {
            const payload = await EdgeGateway.getAccountMigrationStatus();
            this.renderCloudAccountMigrationStatus(payload || {});
        } catch (error) {
            console.warn(error);
            summaryEl.innerHTML = `<span style="color:#b91c1c;">读取失败：${error?.message || error}</span>`;
            if (updatedEl) updatedEl.textContent = '刷新失败';
        }
    },

    // 🛠️ 管理员工具：清除账号
    clearAccounts: function () {
        if (!confirm("⚠️ 确定清空所有教师和家长账号吗？\n(管理员密码不会被清除)")) return;
        this.db.teachers = [];
        this.db.parents = [];
        this.db = persistLocalAuthDb(this.db);
        alert("✅ 所有普通账号已清空");
    }
};

// 🟢 [修复] 确保 Auth 挂载到 window 以便 HTML onclick 访问
window.Auth = Auth;
Auth.ensureLoginWorkbench();
Auth.syncLoginPortalUI();

// Signal to the portal loader that Auth is ready
if (typeof window.markAuthReadyResolved === 'function') {
    window.markAuthReadyResolved();
    appDebug('[app] AuthReady signaled to portal');
} else if (typeof window.resolveAuthReady === 'function') {
    window.__AUTH_READY__ = true;
    window.resolveAuthReady();
    appDebug('[app] AuthReady signaled to portal');
}
window.openAdminCloudAccountModal = function () {
    const modal = document.getElementById('admin-modal');
    if (modal) modal.style.display = 'flex';
    if (window.Auth && typeof window.Auth.renderSchoolCheckboxes === 'function') {
        window.Auth.renderSchoolCheckboxes();
    }
    if (window.Auth && typeof window.Auth.refreshCloudAccountMigrationStatus === 'function') {
        window.Auth.refreshCloudAccountMigrationStatus();
    }
};

// 🆕 多角色权限系统
window.RoleManager = {
    getUserRoles: function (user) {
        return AuthState.getUserRoles(user);
    },
    hasRole: function (user, roleName) {
        return AuthState.hasRole(user, roleName);
    },
    hasAnyRole: function (user, roleNames) {
        return AuthState.hasAnyRole(user, roleNames);
    },
    hasAllRoles: function (user, roleNames) {
        return AuthState.hasAllRoles(user, roleNames);
    },
    getPrimaryRole: function (user) {
        return AuthState.getPrimaryRole(user);
    },
    applyRolesToBody: function (user) {
        const primaryRole = AuthState.applyRolesToBody(user);
        if (user) {
            const roles = AuthState.getUserRoles(user);
            appDebug(`🎭 用户角色：${roles.join(', ')} (主角色：${primaryRole})`);
        }
    },

    // 🆕 测试工具：为当前用户添加角色（仅用于开发测试）
    addRoleToCurrentUser: function (roleName) {
        if (!Auth.currentUser) {
            console.error('❌ 没有登录用户');
            return;
        }

        const currentRoles = this.getUserRoles(Auth.currentUser);
        if (currentRoles.includes(roleName)) {
            console.warn(`⚠️ 用户已拥有角色: ${roleName}`);
            return;
        }

        const newRoles = [...currentRoles, roleName];
        Auth.currentUser.roles = newRoles;

        AuthState.setCurrentUser(Auth.currentUser);

        // 重新应用角色
        this.applyRolesToBody(Auth.currentUser);

        // 更新角色提示
        if (typeof updateRoleHint === 'function') {
            updateRoleHint();
        }

        appDebug(`✅ 已添加角色 ${roleName}，当前角色：${newRoles.join(', ')}`);
        appDebug('💡 提示：这只是临时测试，刷新页面后会恢复。要永久设置，请在数据库中修改用户数据。');
    },

    // 🆕 测试工具：查看当前用户的所有权限
    showCurrentPermissions: function () {
        const user = Auth.currentUser;
        if (!user) {
            appDebug('❌ 没有登录用户');
            return;
        }

        const roles = this.getUserRoles(user);
        appDebug('%c当前用户权限信息', 'color: #10b981; font-weight: bold; font-size: 16px;');
        appDebug('用户名:', user.name);
        appDebug('所有角色:', roles.join(', '));
        appDebug('主角色:', this.getPrimaryRole(user));
        appDebug('\n权限检查示例:');
        appDebug('- 是否是管理员:', this.hasRole(user, 'admin'));
        appDebug('- 是否是教师类角色:', this.hasAnyRole(user, ['teacher', 'class_teacher']));
        appDebug('- 是否是管理类角色:', this.hasAnyRole(user, ['admin', 'director', 'grade_director']));
    }
};

const IssueManager = {
    isHistoryMode: false, // 状态标记：是否处于历史记录模式

    openSubmitModal: function (name, cls, school) {
        return requireIssueManagerRuntime().openSubmitModal(name, cls, school);
    },

    submit: async function () {
        return requireIssueManagerRuntime().submit();
    },

    checkIssues: async function () {
        return requireIssueManagerRuntime().checkIssues();
    },

    openAdminPanel: async function () {
        return requireIssueManagerRuntime().openAdminPanel(this);
    },

    toggleHistoryView: function () {
        return requireIssueManagerRuntime().toggleHistoryView(this);
    },

    updateUIState: function () {
        return requireIssueManagerRuntime().updateUIState(this);
    },

    toggleSelectAll: function (source) {
        return requireIssueManagerRuntime().toggleSelectAll(this, source);
    },

    getCheckedIds: function () {
        return requireIssueManagerRuntime().getCheckedIds();
    },

    loadIssues: async function () {
        return requireIssueManagerRuntime().loadIssues(this);
    },

    resolve: async function (id) {
        return requireIssueManagerRuntime().resolve(this, id);
    },

    batchSoftDelete: async function () {
        return requireIssueManagerRuntime().batchSoftDelete(this);
    },

    batchRestore: async function () {
        return requireIssueManagerRuntime().batchRestore(this);
    },

    batchHardDelete: async function () {
        return requireIssueManagerRuntime().batchHardDelete(this);
    }
};

// 📦 系统打包工具
const Packager = {
    exportDistributableHTML: async function () {
        const runtime = await ensurePackagerRuntime();
        return runtime.exportDistributableHTML();
    }
};

const HelpSystem = {
    content: requireHelpSystemRuntime().createDefaultContent(),
    show: function (key) {
        return requireHelpSystemRuntime().show(this, key);
    },
    startTour: function () {
        return requireHelpSystemRuntime().startTour(this);
    },
    checkFirstRun: function () {
        return requireHelpSystemRuntime().checkFirstRun(this);
    }
};

const DATA_PROCESSING_WORKER_SCRIPT = './assets/js/data-processing-worker.js';

function getDataProcessingWorkerScriptUrl() {
    return typeof getVersionedAssetPath === 'function'
        ? getVersionedAssetPath(DATA_PROCESSING_WORKER_SCRIPT)
        : DATA_PROCESSING_WORKER_SCRIPT;
}


// 2. Worker 管理器
const WorkerAPI = {
    worker: null,
    async init() {
        const runtime = await ensureWorkerApiRuntime();
        return runtime.init(this, '', getDataProcessingWorkerScriptUrl());
    },
    async run(data) {
        const runtime = await ensureWorkerApiRuntime();
        return runtime.run(this, data, '', getDataProcessingWorkerScriptUrl());
    }
};

// 【魔法】劫持原生 alert，你旧代码里的 alert 都会自动变漂亮
// 升级版：使用 SweetAlert2 替代原生弹窗
window.alert = function (msg, icon = 'info') {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            text: msg,
            icon: (msg.includes('成功') || msg.includes('✅')) ? 'success' : ((msg.includes('失败') || msg.includes('错误')) ? 'error' : 'info'),
            confirmButtonColor: '#4f46e5',
            timer: 2000,
            timerProgressBar: true
        });
    } else {
        // 降级处理
        UI.toast(msg);
    }
};

// 👇👇👇 ✋ 🔴 [修复重点开始]：调整代码顺序，防止递归死循环 🔴 ✋ 👇👇👇

// 🟢 [修正步骤 1]：必须在重写之前，先备份浏览器原生的 confirm 函数！
// 之前代码把这行放在了后面，导致备份的是“新函数自己”，从而引发死循环。
if (!window.originalConfirm) window.originalConfirm = window.confirm;

// 🟢 [修正步骤 2]：然后再重写 window.confirm
// (这是为了让 window.confirm = async function 变成异步，虽然这里暂时还是同步调用)
window.confirm = function (msg) {
    // 注意：原生的 confirm 是同步阻塞的，SweetAlert2 是异步 Promise。
    // 这里只是为了覆盖默认行为，实际代码中需要把 if(confirm(...)) 改为 await 模式
    // 为了兼容旧代码，这里暂时保留原生 confirm 作为同步阻塞，
    // 但建议在关键操作（如删除）中显式调用 Swal.fire

    // 这里的 window.originalConfirm 现在指向的是真正的原生函数，不会死循环了
    return window.originalConfirm ? window.originalConfirm(msg) : true;
};

// 备份原生 confirm 以防万一 (这段旧有的冗余代码可以保留，也可以删掉，上面的步骤1已经处理了)
if (!window.originalConfirm) window.originalConfirm = window.confirm;

// 👆👆👆 ✋ 🟢 [修复重点结束] 🟢 ✋ 👆👆👆

// 🛡️ [升级版] 系统操作日志记录器 (支持回收站)
const Logger = {
    isHistoryMode: false,
    log: async function (action, details) {
        return requireLoggerRuntime().log(action, details);
    },
    view: function () {
        return requireLoggerRuntime().view(this);
    },
    toggleHistoryView: function () {
        return requireLoggerRuntime().toggleHistoryView(this);
    },
    updateUIState: function () {
        return requireLoggerRuntime().updateUIState(this);
    },
    loadLogs: async function () {
        return requireLoggerRuntime().loadLogs(this);
    },
    toggleSelectAll: function (source) {
        return requireLoggerRuntime().toggleSelectAll(this, source);
    },
    getCheckedIds: function () {
        return requireLoggerRuntime().getCheckedIds();
    },
    batchSoftDelete: async function () {
        return requireLoggerRuntime().batchSoftDelete(this);
    },
    batchRestore: async function () {
        return requireLoggerRuntime().batchRestore(this);
    },
    batchHardDelete: async function () {
        return requireLoggerRuntime().batchHardDelete(this);
    }
};

// 🔐 [新增] 多角色账号管理控制器 (管理员/主任/班主任)
const AccountManager = {
    open: function () {
        return requireAccountManagerRuntime().open(this);
    },
    search: async function () {
        return requireAccountManagerRuntime().search(this);
    },
    renderTable: function (list) {
        return requireAccountManagerRuntime().renderTable(list);
    },
    editAttributes: async function (username, currentRole, currentClass) {
        return requireAccountManagerRuntime().editAttributes(this, username, currentRole, currentClass);
    },
    resetPassword: async function (username) {
        return requireAccountManagerRuntime().resetPassword(this, username);
    }
};
window.AccountManager = AccountManager;

// 📊 [新增] 数据综合管理器 (学生/教师/档案/参数/目标)
const DataManager = {
    init: function () {
        window.DataManager = this;
    },
    currentTab: 'student', // student | teacher | archive | params | targets
    cloudPanelView: 'list',
    pagination: { page: 1, size: 50, total: 0 },
    cloudSelection: new Set(),
    cloudBackupRows: new Map(),
    studentSelection: new Set(),

    isGrade9Context: function () {
        const meta = (typeof getExamMetaFromUI === 'function') ? getExamMetaFromUI() : null;
        if (meta && String(meta.grade || '') === '9') return true;
        if (window.CONFIG && String(CONFIG.name || '').includes('9')) return true;
        return false;
    },

    getGrade9TemplateKey: function (type) {
        const cohortId = CURRENT_COHORT_ID || readWorkspaceCohortId() || 'GLOBAL';
        return `GRADE9_${type}_${cohortId}`;
    },

    restoreGrade9IndicatorTemplate: function () {
        if (!this.isGrade9Context()) return false;
        try {
            const raw = localStorage.getItem(this.getGrade9TemplateKey('INDICATOR'));
            if (!raw) return false;
            const saved = JSON.parse(raw);
            if (!saved || (!saved.ind1 && !saved.ind2)) return false;
            setIndicatorState({ ind1: saved.ind1 || '', ind2: saved.ind2 || '' });
            const main1 = document.getElementById('ind1');
            const main2 = document.getElementById('ind2');
            if (main1 && !main1.value) main1.value = saved.ind1 || '';
            if (main2 && !main2.value) main2.value = saved.ind2 || '';
            return true;
        } catch (e) {
            return false;
        }
    },

    persistGrade9IndicatorTemplate: function () {
        if (!this.isGrade9Context()) return;
        const ind = readIndicatorState();
        const payload = { ind1: ind.ind1 || '', ind2: ind.ind2 || '' };
        if (!payload.ind1 && !payload.ind2) return;
        localStorage.setItem(this.getGrade9TemplateKey('INDICATOR'), JSON.stringify(payload));
    },

    restoreGrade9TargetsTemplate: function () {
        if (!this.isGrade9Context()) return false;
        try {
            const raw = localStorage.getItem(this.getGrade9TemplateKey('TARGETS'));
            if (!raw) return false;
            const saved = JSON.parse(raw);
            if (!saved || !Object.keys(saved).length) return false;
            setTargetsState(saved);
            return true;
        } catch (e) {
            return false;
        }
    },

    persistGrade9TargetsTemplate: function () {
        if (!this.isGrade9Context()) return;
        const targets = readTargetsState();
        const key = this.getGrade9TemplateKey('TARGETS');
        if (!Object.keys(targets).length) {
            localStorage.removeItem(key);
            return;
        }
        localStorage.setItem(key, JSON.stringify(targets));
    },

    // 1. 打开面板
    open: function () {
        const user = Auth.currentUser;
        if (!user) return alert("请先登录");
        if (user.role !== 'admin' && user.role !== 'director') {
            return alert("⛔ 权限不足：只有管理员或教务主任可操作底层数据。");
        }

        document.getElementById('data-manager-modal').style.display = 'flex';
        this.decorateLayout();
        this.switchTab('student');
        if (typeof this.syncSchoolAliasSettingsFromGateway === 'function') {
            this.syncSchoolAliasSettingsFromGateway().catch(err => {
                console.warn('[EdgeGateway] school alias refresh skipped:', err?.message || err);
            });
        }
    },

    ensureCloudPanelSwitch: function () {
        const modal = document.getElementById('data-manager-modal');
        const content = modal?.querySelector('.modal-content');
        const tabContainer = document.getElementById('tab-data-stu')?.parentElement;
        if (!content || !tabContainer) return null;

        let switcher = document.getElementById('dm-cloud-panel-switch');
        if (!switcher) {
            switcher = document.createElement('div');
            switcher.id = 'dm-cloud-panel-switch';
            switcher.style.display = 'none';
            switcher.style.marginBottom = '14px';
            switcher.style.padding = '6px';
            switcher.style.border = '1px solid #e2e8f0';
            switcher.style.borderRadius = '16px';
            switcher.style.background = '#f8fafc';
            switcher.style.gap = '8px';
            switcher.style.alignItems = 'center';
            switcher.style.justifyContent = 'space-between';
            switcher.style.flexWrap = 'wrap';
            switcher.innerHTML = `
                <div style="font-size:12px; color:#64748b; padding:0 6px;">左右点击切换显示区域</div>
                <div style="display:flex; gap:8px; flex:1; min-width:260px;">
                    <button type="button" id="dm-cloud-view-overview" onclick="DataManager.setCloudPanelView('overview')"
                        style="flex:1; border:none; border-radius:12px; padding:10px 14px; cursor:pointer; font-weight:700; background:#ffffff; color:#334155;">
                        ① 左侧显示概览
                    </button>
                    <button type="button" id="dm-cloud-view-list" onclick="DataManager.setCloudPanelView('list')"
                        style="flex:1; border:none; border-radius:12px; padding:10px 14px; cursor:pointer; font-weight:700; background:#ffffff; color:#334155;">
                        ② 右侧显示存档
                    </button>
                </div>
            `;
        }

        if (switcher.parentElement !== content) {
            content.insertBefore(switcher, tabContainer.nextSibling);
        }
        return switcher;
    },

    setCloudPanelView: function (view) {
        this.cloudPanelView = view === 'overview' ? 'overview' : 'list';
        this.updateCloudPanelView();
    },

    updateCloudPanelView: function () {
        const switcher = this.ensureCloudPanelSwitch();
        const workflow = document.getElementById('dm-workflow-strip');
        const statusOverview = document.getElementById('dm-status-overview');
        const cloudArea = document.getElementById('dm-cloud-area');
        const overviewBtn = document.getElementById('dm-cloud-view-overview');
        const listBtn = document.getElementById('dm-cloud-view-list');
        const isCloudTab = this.currentTab === 'cloud';

        if (switcher) {
            switcher.style.display = isCloudTab ? 'flex' : 'none';
        }

        if (!isCloudTab) {
            if (workflow) workflow.style.display = 'flex';
            if (statusOverview) statusOverview.style.display = 'block';
            if (cloudArea) cloudArea.style.display = 'none';
            return;
        }

        const showOverview = this.cloudPanelView === 'overview';
        if (workflow) workflow.style.display = showOverview ? 'flex' : 'none';
        if (statusOverview) statusOverview.style.display = showOverview ? 'block' : 'none';
        if (cloudArea) cloudArea.style.display = showOverview ? 'none' : 'flex';

        const activeStyle = {
            background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
            color: '#ffffff',
            boxShadow: '0 10px 24px rgba(37,99,235,0.18)'
        };
        const idleStyle = {
            background: '#ffffff',
            color: '#334155',
            boxShadow: 'none'
        };
        [overviewBtn, listBtn].forEach(btn => {
            if (!btn) return;
            btn.style.transition = 'all 0.2s ease';
        });
        if (overviewBtn) Object.assign(overviewBtn.style, showOverview ? activeStyle : idleStyle);
        if (listBtn) Object.assign(listBtn.style, showOverview ? idleStyle : activeStyle);
    },

    // 2. 切换标签页 (修复版：支持所有管理模块)
    decorateLayout: function () {
        const modal = document.getElementById('data-manager-modal');
        const content = modal?.querySelector('.modal-content');
        if (!content) return;

        content.style.width = 'min(1480px, 96vw)';
        content.style.maxWidth = '1480px';
        content.style.height = 'min(92vh, 960px)';
        content.style.padding = '22px 24px 18px';
        content.style.borderRadius = '22px';

        const tabContainer = document.getElementById('tab-data-stu')?.parentElement;
        const statusOverview = document.getElementById('dm-status-overview');
        const searchBar = document.getElementById('dm-search-bar');
        const saveBtn = content.querySelector('button[onclick="DataManager.saveAndSync()"]');
        const closeBtn = Array.from(content.querySelectorAll('button'))
            .find(btn => String(btn.getAttribute('onclick') || '').includes('data-manager-modal'));
        const legacyHeader = saveBtn?.parentElement?.parentElement;

        if (tabContainer) {
            tabContainer.id = 'dm-tab-strip';
            tabContainer.setAttribute('role', 'tablist');
            tabContainer.setAttribute('aria-label', '数据管理模块切换');
        }

        if (legacyHeader) {
            legacyHeader.style.display = 'flex';
            legacyHeader.style.justifyContent = 'space-between';
            legacyHeader.style.alignItems = 'flex-start';
            legacyHeader.style.gap = '18px';
            legacyHeader.style.flexWrap = 'wrap';
            legacyHeader.style.borderBottom = '1px solid #e2e8f0';
            legacyHeader.style.paddingBottom = '14px';
            legacyHeader.style.marginBottom = '14px';

            legacyHeader.querySelectorAll('h3').forEach(el => {
                el.style.display = 'none';
            });

            const buttonGroup = saveBtn?.parentElement;
            if (buttonGroup) {
                buttonGroup.style.display = 'flex';
                buttonGroup.style.gap = '10px';
                buttonGroup.style.alignItems = 'center';
            }

            if (saveBtn) {
                saveBtn.style.padding = '10px 16px';
                saveBtn.style.borderRadius = '12px';
            }
            if (closeBtn) {
                closeBtn.style.border = 'none';
                closeBtn.style.background = '#f8fafc';
                closeBtn.style.color = '#475569';
                closeBtn.style.width = '40px';
                closeBtn.style.height = '40px';
                closeBtn.style.borderRadius = '12px';
                closeBtn.style.fontSize = '24px';
                closeBtn.style.cursor = 'pointer';
            }

            let intro = document.getElementById('dm-layout-intro');
            if (!intro) {
                intro = document.createElement('div');
                intro.id = 'dm-layout-intro';
            }
            intro.innerHTML = `
                <div style="display:flex; gap:14px; align-items:flex-start;">
                    <div style="width:46px; height:46px; border-radius:14px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%); color:#1d4ed8; box-shadow:0 10px 24px rgba(59,130,246,0.14);">
                        <i class="ti ti-cloud-cog" style="font-size:22px;"></i>
                    </div>
                    <div>
                        <div style="color:#0f172a; font-size:24px; font-weight:800; line-height:1.2;">云端教务数据综合控制台</div>
                        <div style="margin-top:6px; font-size:12px; color:#64748b; line-height:1.7;">
                            建议顺序：导入成绩 -> 任课/目标人数 -> 设置指标参数 -> 保存并同步云端
                        </div>
                    </div>
                </div>
            `;
            if (buttonGroup) legacyHeader.insertBefore(intro, buttonGroup);
        }

        if (statusOverview && tabContainer && statusOverview.previousElementSibling === tabContainer) {
            content.insertBefore(statusOverview, tabContainer);
        }
        if (statusOverview) {
            statusOverview.style.marginBottom = '14px';
            statusOverview.style.borderRadius = '16px';
        }

        let workflow = document.getElementById('dm-workflow-strip');
        if (!workflow) {
            workflow = document.createElement('div');
            workflow.id = 'dm-workflow-strip';
        }
        workflow.innerHTML = `
            <span style="display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; background:#ecfdf5; color:#166534; font-size:12px; font-weight:700;"><i class="ti ti-file-import"></i> 1. 导入基础数据</span>
            <span style="display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:700;"><i class="ti ti-target-arrow"></i> 2. 配置目标与参数</span>
            <span style="display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; background:#fff7ed; color:#9a3412; font-size:12px; font-weight:700;"><i class="ti ti-cloud-up"></i> 3. 统一保存同步</span>
            <span style="display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; background:#f8fafc; color:#475569; font-size:12px; font-weight:700;"><i class="ti ti-chart-bar"></i> 4. 返回分析页面使用</span>
        `;
        workflow.style.display = 'flex';
        workflow.style.gap = '8px';
        workflow.style.flexWrap = 'wrap';
        workflow.style.marginBottom = '14px';
        workflow.style.padding = '10px 12px';
        workflow.style.border = '1px solid #e2e8f0';
        workflow.style.borderRadius = '14px';
        workflow.style.background = '#fafcff';

        if (tabContainer) {
            content.insertBefore(workflow, statusOverview || tabContainer);
            tabContainer.style.display = 'flex';
            tabContainer.style.gap = '10px';
            tabContainer.style.marginBottom = '14px';
            tabContainer.style.padding = '6px';
            tabContainer.style.border = '1px solid #e2e8f0';
            tabContainer.style.borderRadius = '14px';
            tabContainer.style.background = '#f8fafc';
            tabContainer.style.flexWrap = 'wrap';
            tabContainer.style.overflowX = 'auto';

            ['tab-data-stu', 'tab-data-tea', 'tab-data-targets', 'tab-data-params', 'tab-data-cloud', 'tab-data-sql']
                .forEach(id => {
                    const tab = document.getElementById(id);
                    if (tab && tab.parentElement === tabContainer) {
                        tab.style.minWidth = '132px';
                        tab.style.flex = '1 1 132px';
                        tab.style.textAlign = 'center';
                        tab.style.justifyContent = 'center';
                        tabContainer.appendChild(tab);
                    }
                });
        }

        if (searchBar) {
            searchBar.style.background = '#f8fafc';
            searchBar.style.padding = '12px';
            searchBar.style.borderRadius = '12px';
            searchBar.style.border = '1px solid #e2e8f0';
            searchBar.style.marginBottom = '12px';
            searchBar.style.gap = '10px';
            searchBar.style.flexWrap = 'wrap';
            searchBar.style.alignItems = 'center';
            const searchInput = document.getElementById('dm-search-input');
            if (searchInput) {
                searchInput.style.minWidth = '260px';
                searchInput.style.padding = '10px 12px';
                searchInput.style.borderRadius = '10px';
            }
        }

        this.ensureCloudPanelSwitch();
    },

    switchTab: function (tab) {
        if (tab === 'history') tab = 'student';
        this.currentTab = tab;
        this.pagination.page = 1;
        this.decorateLayout();
        const searchInput = document.getElementById('dm-search-input');
        if (searchInput) searchInput.value = '';

        // 样式切换
        document.querySelectorAll('.login-tab').forEach(el => el.classList.remove('active'));

        let tabId = 'tab-data-stu';
        if (tab === 'teacher') tabId = 'tab-data-tea';
        if (tab === 'archive') tabId = 'tab-data-arch';
        if (tab === 'params') tabId = 'tab-data-params';
        if (tab === 'targets') tabId = 'tab-data-targets';
        if (tab === 'sql') tabId = 'tab-data-sql';
        if (tab === 'cloud') tabId = 'tab-data-cloud';
        const el = document.getElementById(tabId);
        if (el) el.classList.add('active');

        // --- 区域显隐控制 ---

        // 学生表
        const stuTable = document.getElementById('dm-student-table');
        if (stuTable) stuTable.style.display = tab === 'student' ? 'table' : 'none';

        // 教师区域 (新版容器)
        const teaArea = document.getElementById('dm-teacher-area');
        if (teaArea) teaArea.style.display = tab === 'teacher' ? 'block' : 'none';

        // 隐藏旧版直接引用的教师表 (防止冲突)
        const oldTeaTable = document.getElementById('dm-teacher-table');
        if (oldTeaTable && !teaArea) oldTeaTable.style.display = tab === 'teacher' ? 'table' : 'none';

        // 其他区域
        const archArea = document.getElementById('dm-archive-area');
        if (archArea) archArea.style.display = tab === 'archive' ? 'block' : 'none';

        const paramArea = document.getElementById('dm-params-area');
        if (paramArea) paramArea.style.display = tab === 'params' ? 'block' : 'none';

        const targetArea = document.getElementById('dm-targets-area');
        if (targetArea) targetArea.style.display = tab === 'targets' ? 'block' : 'none';

        const sqlArea = document.getElementById('dm-sql-area');
        if (sqlArea) sqlArea.style.display = tab === 'sql' ? 'flex' : 'none';

        const cloudArea = document.getElementById('dm-cloud-area');
        if (cloudArea) cloudArea.style.display = tab === 'cloud' ? 'flex' : 'none';


        // 如果切到云端管理，立即加载列表
        if (tab === 'cloud') this.renderCloudBackups();
        if (tab === 'sql') {
            if (typeof this.renderSQLHistory === 'function') {
                this.renderSQLHistory();
            } else if (typeof window.ensureDataManagerSqlRuntimeLoaded === 'function') {
                window.ensureDataManagerSqlRuntimeLoaded()
                    .then(() => {
                        if (typeof this.renderSQLHistory === 'function') this.renderSQLHistory();
                    })
                    .catch(err => console.warn('[DataManager] sql runtime load failed:', err?.message || err));
            }
        }

        // 搜索栏和分页栏逻辑 (教师页现在有独立筛选，不再使用顶部通用搜索)
        const showSearch = (tab === 'student');
        const searchBar = document.getElementById('dm-search-bar');
        const pageBar = document.getElementById('dm-pagination');
        if (searchBar) searchBar.style.display = showSearch ? 'flex' : 'none';
        if (pageBar) pageBar.style.display = showSearch ? 'flex' : 'none';

        // 初始化教师页面的学校下拉框
        if (tab === 'teacher') {
            // 强制重新初始化届别元数据，防止因数据延迟导致的渲染失败
            if (!window.CURRENT_COHORT_META && window.CURRENT_COHORT_ID) {
                try {
                    const storedMeta = localStorage.getItem('CURRENT_COHORT_META');
                    if (storedMeta) writeWorkspaceCohortMeta(JSON.parse(storedMeta), { syncCohortId: false });
                    else writeWorkspaceCohortMeta({
                        id: window.CURRENT_COHORT_ID,
                        year: inferCohortIdFromValue(window.CURRENT_COHORT_ID) || String(window.CURRENT_COHORT_ID).replace(/\D/g, '').slice(0, 4)
                    }, { syncCohortId: false });
                } catch (e) { }
            }

            this.updateTeacherSchoolSelect();
            this.renderTeacherTermSelect();

            // 🟢 [修复]：选中学期并自动同步云端数据
            setTimeout(() => {
                const termId = getPreferredTeacherTermId() || buildTeacherTermId(getExamMetaFromUI());
                if (termId) {
                    const sel = document.getElementById('dm-teacher-term-select');
                    if (sel) sel.value = termId;
                    // switchTeacherTerm 内部已经包含云端同步逻辑
                    DataManager.switchTeacherTerm(termId);
                }
            }, 50);
        }

        // 👇👇👇 🟢 [同步修复]：切换到参数页时，强制刷新数据显示 🟢 👇👇👇
        if (tab === 'params') {
            this.renderParams();
        }

        this.renderCurrentTab();
        this.renderDataManagerStatus();
        this.updateCloudPanelView();
    },

    // --- 模块 A: 云端数据管理 (重构版) ---
    getCloudRecordKind: function (key) {
        const text = String(key || '').trim();
        if (!text) return 'other';
        if (/^cohort::/i.test(text)) return 'cohort';
        if (isLegacyWorkspaceShadowExamId(text)) return 'shadow';
        if (/^TEACHERS_/i.test(text)) return 'teacher';
        if (/^(STUDENT_COMPARE_|MACRO_COMPARE_|TEACHER_COMPARE_|TOWN_SUB_COMPARE_)/.test(text)) return 'compare';
        if (normalizeCompareCohortId(text)) return 'snapshot';
        return 'other';
    },

    isCloudWorkspaceSnapshotKey: function (key) {
        const kind = this.getCloudRecordKind(key);
        return kind === 'cohort' || kind === 'snapshot';
    },

    isCloudRecordInCurrentWorkspace: function (key) {
        const text = String(key || '').trim();
        if (!text) return false;
        const currentKey = readWorkspaceProjectKey();
        if (currentKey && text === currentKey) return true;
        const currentCohortId = normalizeCompareCohortId(
            CURRENT_COHORT_ID
            || window.CURRENT_COHORT_ID
            || readWorkspaceCohortId()
            || currentKey
        );
        if (!currentCohortId) return true;
        if (/^cohort::/i.test(text)) return text === `cohort::${currentCohortId}`;
        return normalizeCompareCohortId(text) === currentCohortId;
    },

    renderCloudBackups: async function () {
        return requireDataCloudRuntime().renderCloudBackups(this);
    },

    toggleCloudSelection: function (inputEl) {
        return requireDataCloudRuntime().toggleCloudSelection(this, inputEl);
    },

    toggleCloudSelectAll: function (checked) {
        return requireDataCloudRuntime().toggleCloudSelectAll(this, checked);
    },

    updateCloudSelectionUI: function () {
        return requireDataCloudRuntime().updateCloudSelectionUI(this);
    },

    deleteSelectedCloudBackups: async function () {
        return requireDataCloudRuntime().deleteSelectedCloudBackups(this);
    },

    // 加载指定的云端存档
    getCloudBackupRow: async function (key) {
        return requireDataCloudRuntime().getCloudBackupRow(this, key);
    },

    buildCloudArchiveExportPayload: function (item) {
        return requireDataCloudRuntime().buildCloudArchiveExportPayload(item);
    },

    getCloudArchiveDownloadName: function (key) {
        return requireDataCloudRuntime().getCloudArchiveDownloadName(key);
    },

    downloadCloudBackup: async function (key) {
        return requireDataCloudRuntime().downloadCloudBackup(this, key);
    },

    triggerCloudArchiveUpload: function () {
        return requireDataCloudRuntime().triggerCloudArchiveUpload();
    },

    parseCloudArchiveImportRecords: function (rawText, fallbackName = '') {
        return requireDataCloudRuntime().parseCloudArchiveImportRecords(rawText, fallbackName);
    },

    handleCloudArchiveUpload: async function (input) {
        return requireDataCloudRuntime().handleCloudArchiveUpload(this, input);
    },

    loadCloudBackup: async function (key) {
        return requireDataCloudRuntime().loadCloudBackup(this, key);
    },

    deleteCloudBackup: async function (key) {
        return requireDataCloudRuntime().deleteCloudBackup(this, key);
    },



    // --- 模块 B: 历史数据上传 (Sheet名=学校名, 班级+姓名=Key) ---
    handleHistoryUpload: function (input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });

                let parsedHistory = [];
                let calcModeMsg = "";

                // 1. 遍历所有 Sheet
                wb.SheetNames.forEach(sheetName => {
                    const json = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
                    if (json.length === 0) return;

                    const sample = json[0];
                    const keyName = Object.keys(sample).find(k => k.includes('姓名') || k.toLowerCase() === 'name');
                    const keyClass = Object.keys(sample).find(k => k.includes('班') || k.toLowerCase().includes('class'));
                    const keyScore = Object.keys(sample).find(k => k.includes('总分') || k.includes('得分') || k.includes('Total'));

                    const subjectKeywords = ['语文', '数学', '英语', '物理', '化学', '政治', '历史', '地理', '生物', '科学', '道法'];
                    const subjectColMap = {};

                    Object.keys(sample).forEach(header => {
                        const cleanHeader = header.trim();
                        if (cleanHeader.includes('排') || cleanHeader.includes('赋')) return;
                        const matchedSub = subjectKeywords.find(k => cleanHeader.includes(k));
                        if (matchedSub) {
                            subjectColMap[matchedSub] = header;
                            if (!SUBJECTS.includes(matchedSub)) SUBJECTS.push(matchedSub);
                        }
                    });
                    SUBJECTS.sort(sortSubjects);

                    // 确定计算策略
                    const isGrade9 = CONFIG.name && CONFIG.name.includes('9');
                    let targetSubjects = isGrade9 ? ['语文', '数学', '英语', '物理', '化学'] : Object.keys(subjectColMap);
                    if (isGrade9) calcModeMsg = "9年级模式"; else calcModeMsg = "全科模式";

                    let schoolStudents = [];

                    json.forEach((row, idx) => {
                        let name = keyName ? row[keyName] : "";
                        if (!name || String(name).trim() === '') name = `${sheetName}_考生_${idx + 1}`;
                        let className = (keyClass && row[keyClass]) ? normalizeClass(row[keyClass]) : "默认班级";

                        let totalScore = 0;
                        let scoresObj = {};

                        // 解析单科
                        Object.keys(subjectColMap).forEach(sub => {
                            const colName = subjectColMap[sub];
                            if (row[colName] !== undefined) {
                                const val = parseFloat(row[colName]);
                                if (!isNaN(val)) scoresObj[sub] = val;
                            }
                        });

                        // 计算总分
                        if (keyScore && row[keyScore] !== undefined) {
                            totalScore = parseFloat(row[keyScore]);
                        } else {
                            let sum = 0; let hasValidSub = false;
                            targetSubjects.forEach(sub => {
                                if (scoresObj[sub] !== undefined) { sum += scoresObj[sub]; hasValidSub = true; }
                            });
                            if (hasValidSub) totalScore = parseFloat(sum.toFixed(2));
                        }

                        schoolStudents.push({
                            name: String(name).trim(),
                            class: className,
                            school: sheetName,
                            total: totalScore || 0,
                            scores: scoresObj,
                            ranks: {} // 初始化排名对象
                        });
                    });
                    parsedHistory = parsedHistory.concat(schoolStudents);
                });

                if (parsedHistory.length === 0) throw new Error("未解析到有效数据");

                // ==========================================
                // 🔥 核心升级：计算历史数据的【总分】及【所有单科】排名 🔥
                // ==========================================

                // 辅助函数：通用排名计算
                const calcRank = (list, scoreGetter, rankSetter) => assignCompetitionRanks(list, scoreGetter, rankSetter);

                // 1. 全镇范围 (总分 + 单科)
                calcRank(parsedHistory, s => s.total, (s, r) => { if (!s.ranks.total) s.ranks.total = {}; s.townRank = r; s.ranks.total.township = r; });

                SUBJECTS.forEach(sub => {
                    // 过滤出有该科成绩的学生
                    const validList = parsedHistory.filter(s => s.scores[sub] !== undefined);
                    calcRank(validList, s => s.scores[sub], (s, r) => { if (!s.ranks[sub]) s.ranks[sub] = {}; s.ranks[sub].township = r; });
                });

                // 2. 学校范围 (总分 + 单科)
                const schools = {};
                parsedHistory.forEach(s => { if (!schools[s.school]) schools[s.school] = []; schools[s.school].push(s); });

                Object.values(schools).forEach(group => {
                    calcRank(group, s => s.total, (s, r) => {
                        if (!s.ranks.total) s.ranks.total = {};
                        s.schoolRank = r;
                        s.ranks.total.school = r;
                    });
                    SUBJECTS.forEach(sub => {
                        const validList = group.filter(s => s.scores[sub] !== undefined);
                        calcRank(validList, s => s.scores[sub], (s, r) => { if (!s.ranks[sub]) s.ranks[sub] = {}; s.ranks[sub].school = r; });
                    });
                });

                // 3. 班级范围 (总分 + 单科)
                const classes = {};
                parsedHistory.forEach(s => { const k = s.school + "_" + s.class; if (!classes[k]) classes[k] = []; classes[k].push(s); });

                Object.values(classes).forEach(group => {
                    calcRank(group, s => s.total, (s, r) => {
                        if (!s.ranks.total) s.ranks.total = {};
                        s.classRank = r;
                        s.ranks.total.class = r;
                    });
                    SUBJECTS.forEach(sub => {
                        const validList = group.filter(s => s.scores[sub] !== undefined);
                        calcRank(validList, s => s.scores[sub], (s, r) => { if (!s.ranks[sub]) s.ranks[sub] = {}; s.ranks[sub].class = r; });
                    });
                });
                // ==========================================

                setPrevDataState(parsedHistory);

                // 更新 UI
                const statusEl = document.getElementById('dm-history-status');
                statusEl.innerHTML = `✅ 已加载 ${parsedHistory.length} 条 | ${calcModeMsg}`;
                statusEl.style.color = "#16a34a";

                DataManager.renderHistoryPreview();
                if (typeof performSilentMatching === 'function') performSilentMatching();
                if (typeof saveCloudData === 'function') {
                    saveCloudData({ background: true, sourceLabel: 'history-import-auto' }).catch(err => {
                        logCloudSyncIssue("历史数据后台同步失败", err);
                    });
                }

                alert(`历史数据导入成功！\n共 ${parsedHistory.length} 人。\n✅ 已自动计算历史总分及单科的三级排名(班/校/镇)。`);
                DataManager.renderDataManagerStatus();
                input.value = '';

            } catch (err) {
                console.error(err);
                alert("解析失败: " + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    },


    renderHistoryPreview: function () {
        const tbody = document.querySelector('#dm-history-preview-table tbody');
        if (!tbody) return;
        if (!window.PREV_DATA || window.PREV_DATA.length === 0) return;

        // 判断是否单校
        const schools = new Set(window.PREV_DATA.map(s => s.school));
        const isSingleSchool = schools.size === 1;

        let html = '';
        // 只展示前 50 条预览
        window.PREV_DATA.slice(0, 50).forEach(s => {
            const townRankDisplay = isSingleSchool ? '<span style="color:#ccc">-</span>' : s.townRank;
            html += `
                <tr>
                    <td>${s.school}</td>
                    <td>${s.class}</td>
                    <td>${s.name.includes('无名氏') ? '<span style="color:#999;font-style:italic;">' + s.name + '</span>' : '<strong>' + s.name + '</strong>'}</td>
                    <td style="font-weight:bold; color:#1e3a8a;">${s.total}</td>
                    <td>${s.schoolRank}</td>
                    <td>${townRankDisplay}</td>
                </tr>
            `;
        });

        if (window.PREV_DATA.length > 50) {
            html += `<tr><td colspan="6" style="text-align:center; color:#666;">... 共 ${window.PREV_DATA.length} 条记录 ...</td></tr>`;
        }

        tbody.innerHTML = html;

        // 动态隐藏/显示表头
        const townTh = document.querySelector('#dm-history-preview-table th:last-child');
        if (townTh) {
            if (isSingleSchool) {
                townTh.innerHTML = '<span style="color:#ccc; text-decoration:line-through">全镇排名</span><br><small>(单校已隐藏)</small>';
            } else {
                townTh.innerText = '全镇排名';
            }
        }
    },

    // 3. 渲染调度器
    renderCurrentTab: function () {
        const input = document.getElementById('dm-search-input');
        const keyword = input ? input.value.trim().toLowerCase() : '';

        if (this.currentTab === 'student') {
            this.renderStudents(keyword);
        } else if (this.currentTab === 'teacher') {
            this.renderTeachers(); // 教师页独立渲染
        } else if (this.currentTab === 'archive') {
            this.renderArchives();
        } else if (this.currentTab === 'params') {
            this.renderParams();
        } else if (this.currentTab === 'targets') {
            this.renderTargets();
        }
    },

    // 4. 学生列表渲染 (优化版：使用 DocumentFragment 和字符串拼接优化性能)
    renderStudents: function (keyword) {
        if (!window.RAW_DATA) return;

        // 性能优化：仅在有搜索词时进行过滤
        let list = keyword
            ? RAW_DATA.filter(s =>
                (s.name && s.name.toLowerCase().includes(keyword)) ||
                (String(s.id) && String(s.id).includes(keyword)) ||
                (s.class && s.class.includes(keyword)) ||
                (s.school && s.school.includes(keyword))
            ).map((item, index) => ({ ...item, _originalIndex: RAW_DATA.indexOf(item) }))
            : RAW_DATA.map((item, index) => ({ ...item, _originalIndex: index }));

        this.pagination.total = list.length;
        const totalPages = Math.ceil(this.pagination.total / this.pagination.size) || 1;

        if (this.pagination.page > totalPages) this.pagination.page = totalPages;
        if (this.pagination.page < 1) this.pagination.page = 1;

        const start = (this.pagination.page - 1) * this.pagination.size;
        const pageData = list.slice(start, start + this.pagination.size);
        const validIndexSet = new Set(list.map(x => x._originalIndex));
        this.studentSelection.forEach(idx => {
            if (!validIndexSet.has(idx)) this.studentSelection.delete(idx);
        });

        const tbody = document.querySelector('#dm-student-table tbody');
        if (!tbody) return;

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#999;">无数据</td></tr>';
        } else {
            // 使用数组 join 拼接字符串，比 += 性能更好
            const rows = pageData.map(s => `
                <tr>
                    <td style="text-align:center;"><input type="checkbox" class="dm-stu-select" data-idx="${s._originalIndex}" ${this.studentSelection.has(s._originalIndex) ? 'checked' : ''} onchange="DataManager.toggleStudentSelection(this)"></td>
                    <td>${s.school}</td>
                    <td>${s.class}</td>
                    <td style="font-weight:bold;">${s.name}</td>
                    <td>${s.id}</td>
                    <td>${s.total}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="DataManager.editStudent(${s._originalIndex})" style="padding:2px 6px; font-size:11px;">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="DataManager.deleteStudent(${s._originalIndex})" style="padding:2px 6px; background:#dc2626; font-size:11px;">删除</button>
                    </td>
                </tr>`);
            tbody.innerHTML = rows.join('');
        }
        this.updateStudentSelectionUI();
        this.updatePaginationUI(totalPages);
    },

    toggleStudentSelection: function (inputEl) {
        if (!inputEl) return;
        const idx = parseInt(inputEl.dataset.idx);
        if (isNaN(idx)) return;
        if (inputEl.checked) this.studentSelection.add(idx);
        else this.studentSelection.delete(idx);
        this.updateStudentSelectionUI();
    },

    toggleStudentSelectAll: function (checked) {
        const boxes = Array.from(document.querySelectorAll('#dm-student-table tbody .dm-stu-select'));
        boxes.forEach(box => {
            box.checked = !!checked;
            const idx = parseInt(box.dataset.idx);
            if (isNaN(idx)) return;
            if (checked) this.studentSelection.add(idx);
            else this.studentSelection.delete(idx);
        });
        this.updateStudentSelectionUI();
    },

    updateStudentSelectionUI: function () {
        const boxes = Array.from(document.querySelectorAll('#dm-student-table tbody .dm-stu-select'));
        const headerBox = document.getElementById('dm-stu-select-all');
        const countEl = document.getElementById('dm-stu-selected-count');
        const batchBtn = document.getElementById('dm-stu-batch-delete');

        let visibleSelected = 0;
        boxes.forEach(box => {
            const idx = parseInt(box.dataset.idx);
            if (!isNaN(idx) && this.studentSelection.has(idx)) {
                box.checked = true;
                visibleSelected++;
            }
        });

        if (headerBox) {
            headerBox.indeterminate = visibleSelected > 0 && visibleSelected < boxes.length;
            headerBox.checked = boxes.length > 0 && visibleSelected === boxes.length;
        }
        if (countEl) countEl.textContent = `已选 ${this.studentSelection.size} 项`;
        if (batchBtn) {
            batchBtn.disabled = this.studentSelection.size === 0;
            batchBtn.style.opacity = this.studentSelection.size === 0 ? '0.6' : '1';
        }
    },

    deleteSelectedStudents: function () {
        const indexes = Array.from(this.studentSelection || []).filter(i => Number.isInteger(i));
        if (!indexes.length) return alert('请先勾选要删除的学生');
        if (!confirm(`⚠️ 确定删除选中的 ${indexes.length} 名学生吗？`)) return;

        indexes.sort((a, b) => b - a).forEach(idx => {
            if (idx >= 0 && idx < RAW_DATA.length) RAW_DATA.splice(idx, 1);
        });
        this.studentSelection.clear();
        this.renderCurrentTab();
        UI.toast(`已暂存删除 ${indexes.length} 项 (请点击保存)`, 'info');
    },

    // 5. 分页 UI 更新
    updatePaginationUI: function (totalPages) {
        const el = document.getElementById('dm-page-info');
        if (el) el.innerText = `${this.pagination.page} / ${totalPages}`;
    },

    changePage: function (delta) {
        this.pagination.page += delta;
        this.renderCurrentTab();
    },

    // --- 教师管理核心逻辑 ---



    // 🟢 [修复]：修正 updateTeacherSchoolSelect 缺失问题
    updateTeacherSchoolSelect: function () {
        const sel = document.getElementById('dm-teacher-school-select');
        if (!sel) return;

        const currentVal = sel.value;
        let schools = new Set();

        const schoolList = (typeof listAvailableSchoolsForCompare === 'function')
            ? listAvailableSchoolsForCompare()
            : Object.keys(SCHOOLS || {});
        schoolList.forEach(s => schools.add(s));
        const inferredSchool = (typeof inferDefaultSchoolFromContext === 'function') ? inferDefaultSchoolFromContext() : '';
        if (inferredSchool) schools.add(inferredSchool);

        const schoolOptionsHtml = [...schools]
            .sort((a, b) => a.localeCompare(b, 'zh-CN'))
            .map(s => `<option value="${s}">${s}</option>`)
            .join('');
        sel.innerHTML = `<option value="">-- 显示全部 --</option>${schoolOptionsHtml}`;

        // 🔥 自动选择当前学校
        if (currentVal && schools.has(currentVal)) {
            sel.value = currentVal;
        } else if (MY_SCHOOL && schools.has(MY_SCHOOL)) {
            sel.value = MY_SCHOOL;
            appDebug(`✅ 自动选择本校：${MY_SCHOOL}`);
        } else if (inferredSchool) {
            sel.value = inferredSchool;
            appDebug(`✅ 自动推断学校：${inferredSchool}`);
        }
    },

    updateTeacherSchoolFilter: function () {
        const sel = document.getElementById('dm-teacher-school-select');
        const selectedSchool = sel ? sel.value : '';
        if (selectedSchool) {
            writeCurrentSchool(selectedSchool);
            const mainSelect = document.getElementById('mySchoolSelect');
            if (mainSelect) {
                mainSelect.value = selectedSchool;
                mainSelect.dispatchEvent(new Event('change'));
            }
        }
        // 切换学校筛选时重新渲染表格
        this.renderTeachers();
    },

    renderTeacherTermSelect: function () {
        const sel = document.getElementById('dm-teacher-term-select');
        if (!sel) return;

        const getEntryYear = () => {
            // 1. 绝对优先：内存中的届别元数据
            if (window.CURRENT_COHORT_META && window.CURRENT_COHORT_META.year) {
                return parseInt(window.CURRENT_COHORT_META.year, 10);
            }

            // 2. 本地存储的元数据
            try {
                const metaStr = localStorage.getItem('CURRENT_COHORT_META');
                if (metaStr) {
                    const meta = JSON.parse(metaStr);
                    if (meta && meta.year) return parseInt(meta.year, 10);
                }
            } catch (e) { }

            // 3. 届别 ID (通常就是年份字符串，如 "2024")
            const id = window.CURRENT_COHORT_ID || readWorkspaceCohortId();
            if (id && /^\d{4}$/.test(String(id))) return parseInt(id, 10);

            // 4. 界面标签 (如 "2024级 (六年级入学)")
            const label = document.getElementById('cohort-current-label')?.innerText || '';
            const match = label.match(/(\d{4})级/); // 精确匹配 "xxxx级"
            if (match) return parseInt(match[1], 10);

            return null;
        };

        let years = [];
        const startYear = getEntryYear();

        if (startYear) {
            // 正常学制：初中四年 (6, 7, 8, 9)
            for (let i = 0; i < 4; i++) years.push(startYear + i);
        } else {
            const currentYear = new Date().getFullYear();
            years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
        }

        let options = '';
        years.forEach(year => {
            const yearStr = `${year}-${year + 1}`;
            let gradeLabel = '';
            let gradeNum = null;
            if (startYear) {
                gradeNum = 6 + (year - startYear);
                gradeLabel = ` [${gradeNum}年级]`;
            }
            ['上学期', '下学期'].forEach(term => {
                const termId = gradeNum ? `${yearStr}_${term}_${gradeNum}年级` : `${yearStr}_${term}`;
                options += `<option value="${termId}">${yearStr} ${term}${gradeLabel}</option>`;
            });
        });

        sel.innerHTML = options || '<option value="">暂无学期</option>';

        // 智能选中逻辑
        let prefer = null;
        const preferredCandidates = getTeacherTermCandidates();
        for (const candidate of preferredCandidates) {
            for (let opt of sel.options) {
                if (opt.value === candidate || opt.value.startsWith(candidate + '_')) {
                    prefer = opt.value;
                    break;
                }
            }
            if (prefer) break;
        }

        if (prefer) {
            sel.value = prefer;
            syncTeacherTermStorage(prefer);
        } else if (sel.options.length > 0) sel.value = sel.options[0].value;
    },

    switchTeacherTerm: function (termId) {
        if (!termId) return;

        // 🟢 改进：从termId中提取年级和届数信息
        // termId格式可能是："2025-2026_上学期_9年级" 或 "2025-2026_上学期"
        const parts = termId.split('_');
        const baseTerm = parts.slice(0, 2).join('_'); // "2025-2026_上学期"
        const gradeInfo = parts[2]; // "9年级" 或 undefined

        syncTeacherTermStorage(termId);

        // 如果有年级信息，计算并设置cohortId
        if (gradeInfo) {
            const gradeMatch = gradeInfo.match(/(\d+)/);
            if (gradeMatch) {
                const grade = parseInt(gradeMatch[1], 10);
                const yearMatch = parts[0].match(/(\d{4})/);
                if (yearMatch) {
                    const currentYear = parseInt(yearMatch[1], 10);
                    // 计算入学年份：当前学年 - (当前年级 - 6)
                    const entryYear = currentYear - (grade - 6);
                    const cohortId = entryYear;

                    // 更新全局cohortId
                    writeWorkspaceCohortId(String(cohortId));
                    appDebug(`📅 已设置届数：${cohortId}级 (${grade}年级)`);
                }
            }
        }

        // 🟢 [修复]：切换学期时，先尝试从本地历史读取
        const db = CohortDB.ensure();
        const history = db.teachingHistory || {};
        // 尝试用完整termId或baseTerm查找
        const entry = history[termId] || history[baseTerm];
        const localMap = entry?.map && typeof entry.map === 'object' ? entry.map : (entry || {});
        const localSchoolMap = entry?.schoolMap && typeof entry.schoolMap === 'object' ? entry.schoolMap : {};
        const hasLocal = localMap && Object.keys(localMap).length > 0;

        if (hasLocal) {
            // 🟢 [修复]：清洗已被上一版 Bug 污染的本地缓存 (如8年级学期里混入了9年级的历史数据)
            if (gradeInfo) {
                const gradeMatch = gradeInfo.match(/(\d+)/);
                if (gradeMatch) {
                    const gradePrefix = String(gradeMatch[1]); // 例如 "8"
                    const cleanedMap = {};
                    let cleanedCount = 0;
                    let droppedCount = 0;

                    Object.entries(localMap).forEach(([k, v]) => {
                        const clsName = String(k.split('_')[0]).replace(/班/g, '');
                        // 如果班级是以该年级开头（例如 "801", "8.1"），则保留；否则（如 "9.1"）丢弃
                        if (clsName.startsWith(gradePrefix)) {
                            cleanedMap[k] = v;
                            cleanedCount++;
                        } else {
                            droppedCount++; // 发现跨届污染数据，准备丢弃
                        }
                    });

                    if (droppedCount > 0) {
                        console.warn(`🧹 [自动清洗] 已从被污染的本地历史 '${baseTerm}' 中清除了 ${droppedCount} 条非 ${gradePrefix} 年级的脏数据`);
                    }
                    localMap = cleanedMap;
                }

                // 🟢 [修复]：同时清洗 "Sheet1" 这类因为当初 Excel 导入错误而遗留下来的假学校名
                if (localSchoolMap && typeof localSchoolMap === 'object') {
                    let scrubbedSchools = 0;
                    Object.keys(localSchoolMap).forEach(k => {
                        if (/^Sheet\d+$/i.test(localSchoolMap[k])) {
                            delete localSchoolMap[k];
                            scrubbedSchools++;
                        }
                    });
                    if (scrubbedSchools > 0) console.warn(`🧹 [自动清洗] 已清除 ${scrubbedSchools} 条包含 "SheetX" 的错误学校名称`);
                }
            }

            // 有本地数据(或清洗后的干净数据)，直接使用
            setTeacherMap(JSON.parse(JSON.stringify(localMap)));
            setTeacherSchoolMap(JSON.parse(JSON.stringify(localSchoolMap)));
            this.renderTeachers();
            appDebug(`✅ 已从本地历史加载学期 ${baseTerm} 的任课表，共展示 ${Object.keys(localMap).length} 条`);
            if (typeof this.refreshTeacherAnalysis === 'function') this.refreshTeacherAnalysis();
        } else {
            // 🟢 [修复]：本地无数据，自动尝试从云端拉取
            appDebug(`⚠️ 本地无学期 ${baseTerm} 的任课数据，尝试从云端同步...`);
            setTeacherMap({});
            setTeacherSchoolMap({});
            this.renderTeachers(); // 先渲染空表

            // 异步从云端加载
            if (window.CloudManager && CloudManager.loadTeachers) {
                if (window.UI) UI.toast('🔄 正在从云端加载教师任课数据...', 'info');
                CloudManager.loadTeachers({ background: true }).then(() => {
                    appDebug('✅ 云端数据加载完成');
                }).catch(err => {
                    console.warn('云端加载失败:', err);
                    if (window.UI) UI.toast('☁️ 云端暂无该学期任课数据', 'warning');
                });
            }
        }
    },

    syncTeacherHistory: function (opts = {}) {
        const termId = opts.termId || readCurrentTermId() || getTermId(getExamMetaFromUI());
        if (!termId) return;
        const db = CohortDB.ensure();
        db.teachingHistory = db.teachingHistory || {};
        const savedAt = (() => {
            const raw = opts.timestamp;
            if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
            if (typeof raw === 'string') {
                const parsed = Date.parse(raw);
                if (!Number.isNaN(parsed)) return parsed;
            }
            return Date.now();
        })();
        db.teachingHistory[termId] = {
            map: JSON.parse(JSON.stringify(TEACHER_MAP || {})),
            schoolMap: JSON.parse(JSON.stringify(TEACHER_SCHOOL_MAP || {})),
            savedAt,
            source: opts.source || 'local'
        };
        if (typeof this.refreshTeacherAnalysis === 'function') this.refreshTeacherAnalysis();
    },

    ensureTeacherMap: function (triggerCloud) {
        const termId = getPreferredTeacherTermId() || buildTeacherTermId(getExamMetaFromUI());
        if (!termId) return false;
        if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) return true;

        const db = CohortDB.ensure();
        const history = db.teachingHistory || {};
        const entry = history[termId];
        const localMap = entry?.map && typeof entry.map === 'object' ? entry.map : (entry || {});
        const localSchoolMap = entry?.schoolMap && typeof entry.schoolMap === 'object' ? entry.schoolMap : {};
        if (localMap && Object.keys(localMap).length > 0) {
            setTeacherMap(JSON.parse(JSON.stringify(localMap)));
            setTeacherSchoolMap(JSON.parse(JSON.stringify(localSchoolMap)));
            return true;
        }

        if (triggerCloud && window.CloudManager && CloudManager.loadTeachers) {
            CloudManager.loadTeachers({ background: true });
        }
        return false;
    },

    refreshTeacherAnalysis: function () {
        const section = document.getElementById('teacher-analysis');
        syncTeacherAnalysisSchoolContext();
        if (section && section.classList.contains('active')) {
            if (typeof renderTeacherAnalysisState === 'function') renderTeacherAnalysisState();
            else if (typeof analyzeTeachers === 'function') analyzeTeachers();
            if (typeof updateStatusPanel === 'function') updateStatusPanel();
        }
    },

    handleTeacherUpload: function (input) {
        const file = input.files[0];
        if (!file) {
            console.warn('未选择文件');
            return;
        }

        // 检查 XLSX 库
        if (typeof XLSX === 'undefined') {
            alert('❌ Excel解析库未加载，请刷新页面后重试');
            return;
        }

        // 检查学期
        const termId = readCurrentTermId() || getTermId(getExamMetaFromUI());
        if (!termId) {
            alert('⚠️ 请先选择学期！\n\n点击【学期】下拉框选择一个学期后再导入Excel。');
            return;
        }
        syncTeacherTermStorage(termId);

        appDebug(`开始导入教师Excel: ${file.name}, 学期: ${termId}`);

        if (window.UI) UI.loading(true, '✨ 正在解析Excel...');

        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                // 解析Excel
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });

                if (!wb.SheetNames || wb.SheetNames.length === 0) {
                    if (window.UI) UI.loading(false);
                    alert("❌ 表格为空或格式不正确\n\n请确保 Excel 包含至少一个Sheet，且每个Sheet含：班级、学科、教师姓名列");
                    return;
                }

                let totalRows = 0;

                // 导入数据
                let count = 0;
                const errors = [];
                const teacherAssignments = [];

                wb.SheetNames.forEach(sheetName => {
                    const json = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
                    if (!json || json.length === 0) return;
                    totalRows += json.length;

                    json.forEach((row, idx) => {
                        // 🟢 [修复]：大幅增加 Excel 表头别名的容错率，匹配更多中国学校常用教务表格头
                        const classAlias = ['班级', 'class', 'Class', '班级名称', '行政班', '所属班级', '年级班级', '教学班'];
                        const subjectAlias = ['学科', 'subject', '科目', 'Subject', '任教科目', '考试科目'];
                        const teacherAlias = ['教师', 'teacher', '教师姓名', '姓名', 'Teacher', '任课教师', '任课老师', '授课教师', '老师'];
                        const schoolAlias = ['学校', 'school', 'School', '校区', '所属学校'];

                        const getVal = (aliases) => {
                            for (let a of aliases) {
                                if (row[a] !== undefined && row[a] !== null) return String(row[a]).trim();
                            }
                            return '';
                        };

                        const className = normalizeClass(getVal(classAlias));
                        const subject = normalizeSubject(getVal(subjectAlias));
                        const teacher = getVal(teacherAlias);
                        let extractedSchool = getVal(schoolAlias);
                        if (!extractedSchool && !/^Sheet\d+$/i.test(sheetName)) {
                            extractedSchool = sheetName;
                        }
                        const schoolName = String(extractedSchool || '').trim();

                        if (className && subject && teacher) {
                            teacherAssignments.push({
                                key: `${className}_${subject}`,
                                teacher: String(teacher).trim(),
                                school: schoolName
                            });
                        } else {
                            if (errors.length < 5) {
                                errors.push(`[${sheetName}]第${idx + 2}行: 班级=${className || '空'}, 学科=${subject || '空'}, 教师=${teacher || '空'}`);
                            }
                        }
                    });
                });

                const importResult = requireDataManagerTeacherRuntime().buildTeacherImportMaps(teacherAssignments);
                if (importResult.conflicts.length > 0) {
                    if (window.UI) UI.loading(false);
                    alert(requireDataManagerTeacherRuntime().formatTeacherImportConflictMessage(importResult.conflicts));
                    input.value = '';
                    return;
                }

                // Apply a complete replacement only after the workbook passes conflict validation.
                const newTeacherMap = importResult.teacherMap;
                const newTeacherSchoolMap = importResult.schoolMap;
                count = importResult.count;

                // 应用新数据
                if (count > 0) {
                    setTeacherMap(newTeacherMap);
                    setTeacherSchoolMap(newTeacherSchoolMap);
                }

                if (window.DataManager && typeof DataManager.updateTeacherSchoolSelect === 'function') {
                    DataManager.updateTeacherSchoolSelect();
                }

                appDebug(`导入成功: ${count} 条记录`);
                appDebug(`解析总行数: ${totalRows}`);

                if (count === 0) {
                    if (window.UI) UI.loading(false);
                    alert(`❌ 未能导入任何数据\n\n请检查Excel格式：\n- 必须包含列：【班级】【学科】【教师】\n- 或英文列：class, subject, teacher\n\n${errors.length > 0 ? '错误示例：\n' + errors.join('\n') : ''}`);
                    return;
                }

                // 同步到本地历史
                DataManager.syncTeacherHistory();
                updateStatusPanel();

                // 渲染界面
                DataManager.renderTeachers();
                logAction('导入', `任课表导入 ${count} 条（${termId}）`);

                // 自动同步到云端
                if (window.CloudManager && CloudManager.saveTeachers) {
                    try {
                        appDebug('[TeacherSync] 尝试上传任课表到云端...');
                        const ok = await CloudManager.saveTeachers();
                        if (window.UI) UI.loading(false);
                        if (ok) {
                            if (window.UI) {
                                UI.toast(`✅ 成功导入 ${count} 条任课信息并同步到云端！`, "success");
                            } else {
                                alert(`✅ 成功导入 ${count} 条任课信息并同步到云端！`);
                            }
                        } else {
                            alert(`✅ 成功导入 ${count} 条任课信息！\n\n⚠️ 但云端同步失败，请检查 Cloudflare 数据接口或登录状态。`);
                        }
                    } catch (cloudErr) {
                        if (window.UI) UI.loading(false);
                        logCloudSyncIssue('云端同步失败:', cloudErr);
                        alert(`✅ 成功导入 ${count} 条任课信息！\n\n⚠️ 但云端同步失败：${cloudErr.message}\n\n请手动点击右上角【保存修改并同步云端】按钮。`);
                    }
                } else {
                    if (window.UI) UI.loading(false);
                    alert(`✅ 成功导入 ${count} 条任课信息！`);
                }

                // 清空输入
                input.value = '';

            } catch (err) {
                if (window.UI) UI.loading(false);
                console.error('Excel导入错误:', err);
                alert("❌ 解析失败：" + err.message + "\n\n请确保：\n1. Excel文件格式正确 (.xlsx 或 .xls)\n2. 包含'班级'、'学科'、'教师'列\n3. 数据格式符合要求");
            }
        };

        reader.onerror = function () {
            if (window.UI) UI.loading(false);
            alert('❌ 文件读取失败，请重试');
        };

        reader.readAsArrayBuffer(file);
    },

    renderTeachers: function () {
        const tbody = document.querySelector('#dm-teacher-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const sel = document.getElementById('dm-teacher-school-select');
        const selectedSchool = sel ? sel.value : "";

        // 若学期下拉仍未渲染，进行兜底刷新
        const termSel = document.getElementById('dm-teacher-term-select');
        if (termSel && termSel.options && termSel.options.length <= 1) {
            const txt = termSel.options[0]?.textContent || '';
            if (txt.includes('暂无学期')) {
                this.renderTeacherTermSelect();
            }
        }

        const classSchoolMap = (typeof getClassSchoolMapForAllData === 'function') ? getClassSchoolMapForAllData() : {};
        const inferredSchool = (typeof inferDefaultSchoolFromContext === 'function') ? inferDefaultSchoolFromContext() : '';

        let list = Object.entries(TEACHER_MAP).map(([key, name]) => {
            const parts = key.split('_');
            const clsName = parts[0];
            const subject = parts.length > 1 ? parts[1] : '(未知)';

            let schoolName = "未知/未上传";
            const explicitSchool = String((window.TEACHER_SCHOOL_MAP || {})[key] || '').trim();
            const normalizedClass = normalizeClass(clsName);
            if (explicitSchool) {
                schoolName = explicitSchool;
            } else if (normalizedClass && classSchoolMap[normalizedClass]) {
                schoolName = classSchoolMap[normalizedClass];
            } else if (typeof SCHOOLS !== 'undefined') {
                for (const [schName, schData] of Object.entries(SCHOOLS)) {
                    if (schData.students && schData.students.some(s => normalizeClass(s.class) === normalizedClass)) {
                        schoolName = schName;
                        break;
                    }
                }
            }
            if ((schoolName === '未知/未上传') && inferredSchool) {
                schoolName = inferredSchool;
            }
            return { key, class: clsName, subject, name, school: schoolName };
        });

        // 逻辑：仅在没有固定本校时才从任课表推断，避免覆盖学校默认口径
        if (list.length > 0) {
            const schoolCounts = {};
            list.forEach(t => {
                if (t.school && !t.school.includes("未知")) {
                    schoolCounts[t.school] = (schoolCounts[t.school] || 0) + 1;
                }
            });

            // 找出数量最多的学校
            let maxCount = 0;
            let autoDetectedSchool = "";
            for (const [sch, count] of Object.entries(schoolCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    autoDetectedSchool = sch;
                }
            }

            // 如果找到了有效学校，且当前未设置，则自动同步
            if (autoDetectedSchool && !readCurrentSchool()) {
                writeCurrentSchool(autoDetectedSchool);
                appDebug(`🤖 系统已自动将本校锁定为：${autoDetectedSchool}`);

                // 同步更新主界面的下拉框 UI
                const mainSelect = document.getElementById('mySchoolSelect');
                if (mainSelect) {
                    mainSelect.value = autoDetectedSchool;
                    // 稍微延时触发变更事件，确保数据加载完成
                    setTimeout(() => {
                        // 仅更新内存，不频繁触发 renderTables 以免卡顿，但在关闭模态框时会生效
                    }, 100);
                }
                updateStatusPanel();

                // 提示用户
                if (window.UI && list.length > 5) { // 只有数据量足够时才提示
                    // UI.toast(`已自动识别本校为：${autoDetectedSchool}`, "success");
                }
            }
        }

        if (selectedSchool) {
            list = list.filter(t => sameAppSchoolName(t.school, selectedSchool));
        }

        list.sort((a, b) => {
            if (a.school !== b.school) return a.school.localeCompare(b.school);
            if (a.class !== b.class) return a.class.localeCompare(b.class, undefined, { numeric: true });
            return a.subject.localeCompare(b.subject);
        });

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">暂无任课数据 (或未匹配到该校班级)</td></tr>';
        } else {
            const displayList = list.slice(0, 500);

            const teacherRowsHtml = displayList.map(t => {
                const schoolStyle = t.school.includes("未知") ? "color:#94a3b8; font-style:italic;" : "color:#475569;";
                return `
                    <tr>
                        <td style="${schoolStyle}">${t.school}</td>
                        <td style="font-weight:bold;">${t.class}</td>
                        <td><span class="badge" style="background:#f1f5f9; color:#475569;">${t.subject}</span></td>
                        <td style="font-weight:bold; color:#1e293b;">${t.name}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="DataManager.editTeacher('${t.key}', '${t.name}')" style="padding:2px 6px; font-size:11px;">修改</button>
                            <button class="btn btn-sm btn-danger" onclick="DataManager.deleteTeacher('${t.key}')" style="padding:2px 6px; background:#dc2626; font-size:11px;">删除</button>
                        </td>
                    </tr>`;
            });

            if (list.length > 500) {
                teacherRowsHtml.push(`<tr><td colspan="5" style="text-align:center; color:#999; padding:5px;">... 数据过多，仅显示前 500 条 ...</td></tr>`);
            }
            tbody.innerHTML = teacherRowsHtml.join('');
        }
    },

    // --- 数据操作辅助函数 ---

    deleteStudent: function (index) {
        const s = RAW_DATA[index];
        if (!s) return;
        if (!confirm(`⚠️ 确定要永久删除学生【${s.school} ${s.class}班 ${s.name}】吗？`)) return;
        RAW_DATA.splice(index, 1);
        this.studentSelection.clear();
        this.renderCurrentTab();
        UI.toast("已暂存删除 (请点击保存)", "info");
    },

    editStudent: function (index) {
        const s = RAW_DATA[index];
        Swal.fire({
            title: '编辑学生信息',
            html: `<div style="text-align:left; font-size:14px; line-height:2.5;">
                <label style="width:50px; display:inline-block;">姓名:</label> <input id="swal-name" class="swal2-input" value="${s.name}" style="width:200px; height:30px; margin:0;"><br>
                <label style="width:50px; display:inline-block;">班级:</label> <input id="swal-class" class="swal2-input" value="${s.class}" style="width:200px; height:30px; margin:0;"><br>
                <label style="width:50px; display:inline-block;">考号:</label> <input id="swal-id" class="swal2-input" value="${s.id}" style="width:200px; height:30px; margin:0;"><br>
                <label style="width:50px; display:inline-block;">学校:</label> <input id="swal-school" class="swal2-input" value="${s.school}" style="width:200px; height:30px; margin:0;"><br>
                <label style="width:50px; display:inline-block;">状态:</label>
                <select id="swal-status" class="swal2-input" style="width:200px; height:30px; margin:0;">
                    <option value="active">正常</option>
                    <option value="transfer_in">转入</option>
                    <option value="transfer_out">转出</option>
                    <option value="leave">休学/借读</option>
                </select>
            </div>`,
            showCancelButton: true,
            confirmButtonText: '暂存修改',
            didOpen: () => {
                const st = document.getElementById('swal-status');
                const saved = (s.status || (COHORT_DB?.students?.[s.uuid]?.status)) || 'active';
                if (st) st.value = saved;
            },
            preConfirm: () => ({
                name: document.getElementById('swal-name').value.trim(),
                class: document.getElementById('swal-class').value.trim(),
                id: document.getElementById('swal-id').value.trim(),
                school: document.getElementById('swal-school').value.trim(),
                status: document.getElementById('swal-status').value
            })
        }).then((result) => {
            if (result.isConfirmed) {
                const n = result.value;
                if (!n.name || !n.class) return;
                Object.assign(s, n);
                if (s.uuid && COHORT_DB && COHORT_DB.students && COHORT_DB.students[s.uuid]) {
                    COHORT_DB.students[s.uuid].status = n.status || 'active';
                }
                this.renderCurrentTab();
                UI.toast("已修改 (请点击保存)", "success");
            }
        });
    },

    editTeacher: function (key, oldName) {
        const newName = prompt(`修改 [${key.replace('_', ' ')}] 的任课教师：`, oldName);
        if (newName && newName.trim()) {
            setTeacherMap({ ...TEACHER_MAP, [key]: newName.trim() });
            this.syncTeacherHistory();
            this.renderTeachers();
            UI.toast("已修改 (需点击保存)", "info");
        }
    },

    deleteTeacher: function (key) {
        if (!confirm(`确定移除【${key.replace('_', ' ')}】的任课信息吗？`)) return;
        delete TEACHER_MAP[key];
        delete TEACHER_SCHOOL_MAP[key];
        setTeacherMap(TEACHER_MAP);
        setTeacherSchoolMap(TEACHER_SCHOOL_MAP);
        this.syncTeacherHistory();
        this.renderTeachers();
        UI.toast("已移除 (需点击保存)", "info");
    },

    addTeacher: function () {
        Swal.fire({
            title: '新增任课',
            html: `<div style="text-align:left; font-size:14px; line-height:2.5;">
                <label style="width:60px;">班级:</label> <input id="add-cls" class="swal2-input" placeholder="如: 701" style="width:180px; height:30px;"><br>
                <label style="width:60px;">学科:</label> <input id="add-sub" class="swal2-input" placeholder="如: 语文" style="width:180px; height:30px;"><br>
                <label style="width:60px;">教师:</label> <input id="add-name" class="swal2-input" placeholder="姓名" style="width:180px; height:30px;">
            </div>`,
            confirmButtonText: '添加', showCancelButton: true,
            preConfirm: () => ({
                cls: document.getElementById('add-cls').value.trim(),
                sub: document.getElementById('add-sub').value.trim(),
                name: document.getElementById('add-name').value.trim()
            })
        }).then((result) => {
            if (result.isConfirmed) {
                const d = result.value;
                if (!d.cls || !d.sub || !d.name) return alert("请填写完整");
                const key = `${normalizeClass(d.cls)}_${normalizeSubject(d.sub)}`;
                const school = String(document.getElementById('dm-teacher-school-select')?.value || readCurrentSchool() || '').trim();
                const previousSchool = String((TEACHER_SCHOOL_MAP || {})[key] || '').trim();
                if (previousSchool && school && !sameAppSchoolName(previousSchool, school)) {
                    return alert(requireDataManagerTeacherRuntime().formatTeacherSchoolOwnershipConflictMessage(key, previousSchool, school));
                }
                setTeacherMap({ ...TEACHER_MAP, [key]: d.name });
                if (school) setTeacherSchoolMap({ ...TEACHER_SCHOOL_MAP, [key]: school });
                this.syncTeacherHistory();
                this.renderTeachers();
                UI.toast("添加成功 (需点击保存)", "success");
            }
        });
    },

    // --- 档案管理 ---

    renderArchives: function () {
        const examStats = {};
        if (typeof HISTORY_ARCHIVE !== 'undefined') {
            Object.keys(HISTORY_ARCHIVE).forEach(uid => {
                const records = HISTORY_ARCHIVE[uid];
                records.forEach(r => { if (!examStats[r.exam]) examStats[r.exam] = 0; examStats[r.exam]++; });
            });
        }
        const tbody = document.getElementById('dm-history-tbody');
        if (!tbody) return;

        if (Object.keys(examStats).length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#999;">暂无历史轨迹数据</td></tr>';
        } else {
            let html = '';
            Object.keys(examStats).forEach(examName => {
                html += `<tr><td style="font-weight:bold;">${examName}</td><td>${examStats[examName]} 条记录</td><td><button class="btn btn-sm btn-primary" onclick="DataManager.renameHistoryExam('${examName}')" style="padding:2px 6px;">重命名</button> <button class="btn btn-sm btn-danger" onclick="DataManager.deleteHistoryExam('${examName}')" style="padding:2px 6px; background:#dc2626;">删除</button></td></tr>`;
            });
            tbody.innerHTML = html;
        }
        if (this.currentTab === 'archive') { this.loadCloudSnapshots(); }
    },

    deleteHistoryExam: function (examName) {
        if (!confirm(`⚠️ 确定要删除【${examName}】吗？`)) return;
        Object.keys(HISTORY_ARCHIVE).forEach(key => {
            HISTORY_ARCHIVE[key] = HISTORY_ARCHIVE[key].filter(r => r.exam !== examName);
            if (HISTORY_ARCHIVE[key].length === 0) delete HISTORY_ARCHIVE[key];
        });
        this.renderArchives();
        UI.toast("已删除", "success");
    },

    renameHistoryExam: function (oldName) {
        const newName = prompt("重命名为：", oldName);
        if (!newName) return;
        Object.values(HISTORY_ARCHIVE).forEach(records => {
            records.forEach(r => { if (r.exam === oldName) r.exam = newName; });
        });
        this.renderArchives();
    },

    loadCloudSnapshots: async function () {
        return requireDataCloudRuntime().loadCloudSnapshots(this);
    },

    deleteCloudSnapshot: async function (key) {
        return requireDataCloudRuntime().deleteCloudSnapshot(this, key);
    },

    // 👇👇👇 🟢 [同步修复]：参数管理渲染逻辑优化 🟢 👇👇👇
    getDataManagerSyncStorageKey: function () {
        return requireDataCloudRuntime().getDataManagerSyncStorageKey();
    },

    getDataManagerSyncScope: function () {
        return requireDataCloudRuntime().getDataManagerSyncScope();
    },

    readDataManagerSyncState: function () {
        return requireDataCloudRuntime().readDataManagerSyncState();
    },

    writeDataManagerSyncState: function (patch) {
        return requireDataCloudRuntime().writeDataManagerSyncState(patch);
    },

    getCurrentIndicatorValues: function () {
        return requireDataCloudRuntime().getCurrentIndicatorValues();
    },

    getParamsSyncSignature: function () {
        return requireDataCloudRuntime().getParamsSyncSignature();
    },

    getTargetsSyncSignature: function () {
        return requireDataCloudRuntime().getTargetsSyncSignature();
    },

    buildTeacherSignature: function (teacherMap, schoolMap) {
        return requireDataCloudRuntime().buildTeacherSignature(teacherMap, schoolMap);
    },

    getTeacherStatusSnapshot: function () {
        return requireDataCloudRuntime().getTeacherStatusSnapshot();
    },

    rememberDataManagerSyncSnapshot: function (sourceLabel = '统一保存同步') {
        return requireDataCloudRuntime().rememberDataManagerSyncSnapshot(this, sourceLabel);
    },

    getDataManagerStatusModel: function () {
        return requireDataCloudRuntime().getDataManagerStatusModel(this);
    },

    renderDataManagerStatus: function () {
        return requireDataCloudRuntime().renderDataManagerStatus(this);
    },

    renderParams: function () {
        if (!isIndicatorPromptAllowed()) {
            const area = document.getElementById('dm-params-area');
            if (area) area.style.display = 'none';
            this.renderDataManagerStatus();
            return;
        }
        // 1. 确保全局变量结构存在
        ensureSupportSysVars();

        // 2. 优先从全局变量读取
        let i1 = readIndicatorState().ind1;
        let i2 = readIndicatorState().ind2;

        if (!i1 && !i2) {
            this.restoreGrade9IndicatorTemplate();
            i1 = readIndicatorState().ind1;
            i2 = readIndicatorState().ind2;
        }

        // 3. 兜底：如果全局变量为空，尝试从主界面 DOM 获取（防止主界面有值但这里没显示）
        const mainInput1 = document.getElementById('ind1');
        const mainInput2 = document.getElementById('ind2');

        if (!i1 && mainInput1) i1 = mainInput1.value;
        if (!i2 && mainInput2) i2 = mainInput2.value;

        // 4. 将值填入弹窗的输入框
        const el1 = document.getElementById('dm_ind1_input');
        const el2 = document.getElementById('dm_ind2_input');

        if (el1) {
            el1.value = i1 || '';
            // 绑定实时更新
            el1.oninput = function () {
                setIndicatorState({ ...readIndicatorState(), ind1: this.value });
                if (window.DataManager && typeof DataManager.renderDataManagerStatus === 'function') {
                    DataManager.renderDataManagerStatus();
                }
            };
        }
        if (el2) {
            el2.value = i2 || '';
            el2.oninput = function () {
                setIndicatorState({ ...readIndicatorState(), ind2: this.value });
                if (window.DataManager && typeof DataManager.renderDataManagerStatus === 'function') {
                    DataManager.renderDataManagerStatus();
                }
            };
        }
        this.renderDataManagerStatus();
    },

    saveParamsLocally: async function (skipCloudSync = false) {
        if (!isIndicatorAllowed()) return;
        // 1. 防御性初始化
        ensureSupportSysVars();

        // 2. 获取管理面板弹窗内的值
        const v1 = document.getElementById('dm_ind1_input').value;
        const v2 = document.getElementById('dm_ind2_input').value;

        // 3. 更新内存全局变量
        setIndicatorState({ ind1: v1, ind2: v2 });

        // 4. 同步更新主界面的输入框 (确保 processData 运行时能读到)
        const main1 = document.getElementById('ind1');
        const main2 = document.getElementById('ind2');
        if (main1) main1.value = v1;
        if (main2) main2.value = v2;
        this.persistGrade9IndicatorTemplate();

        // 5. 🔥 核心新增：立即触发云端同步 🔥
        if (!skipCloudSync && typeof saveCloudData === 'function') {
            // 使用 toast 提示正在保存，体验更好
            UI.toast('💾 参数已暂存，正在后台同步...', 'info');
            const ok = await saveCloudData({ background: true, sourceLabel: 'params-auto-save' });
            if (ok) {
                UI.toast('✅ 参数已写入本地缓存，云端将继续后台同步', 'success');
            } else {
                UI.toast('⚠️ 参数已暂存，本次未成功同步到云端', 'warning');
            }
        } else {
            UI.toast('✅ 参数已暂存到内存 (未连接云端)', 'success');
        }
    },

    // --- 目标人数管理 (增强版) ---
    renderTargets: function () {
        const tbody = document.getElementById('dm-targets-tbody');
        if (!tbody) return;

        // 确保全局变量存在
        readTargetsState();
        ensureNormalizedTargets();
        if (Object.keys(readTargetsState()).length === 0) {
            this.restoreGrade9TargetsTemplate();
            ensureNormalizedTargets();
        }

        const list = Object.keys(readTargetsState()).sort();
        this.renderSchoolAliasMappings();

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#999;">暂无数据，请先点击上方按钮导入 Excel</td></tr>';
            return;
        }

        let html = '';
        list.forEach(sch => {
            const t = readTargetsState()[sch];
            html += `<tr><td style="font-weight:bold;">${sch}</td><td>${t.t1}</td><td>${t.t2}</td><td><button class="btn btn-sm btn-primary" onclick="DataManager.editTarget('${sch}')" style="padding:2px 6px;">修改</button> <button class="btn btn-sm btn-danger" onclick="DataManager.deleteTarget('${sch}')" style="padding:2px 6px;">删除</button></td></tr>`;
        });
        tbody.innerHTML = html;
        this.renderDataManagerStatus();
    },

    renderSchoolAliasMappings: function () {
        const defaultTbody = document.getElementById('dm-default-school-aliases-tbody');
        const customTbody = document.getElementById('dm-custom-school-aliases-tbody');
        const summaryEl = document.getElementById('dm-school-aliases-summary');
        if (!defaultTbody && !customTbody && !summaryEl) return;

        const defaultRows = SCHOOL_ALIAS_GROUPS
            .slice()
            .sort((a, b) => String(a.canonical || '').localeCompare(String(b.canonical || ''), 'zh-CN'));
        const customRows = ensureSchoolAliasStore()
            .slice()
            .map((item, index) => ({ index, canonical: String(item?.canonical || '').trim(), alias: String(item?.alias || '').trim() }))
            .filter(item => item.canonical && item.alias)
            .sort((a, b) => {
                const byCanonical = a.canonical.localeCompare(b.canonical, 'zh-CN');
                return byCanonical !== 0 ? byCanonical : a.alias.localeCompare(b.alias, 'zh-CN');
            });

        if (summaryEl) {
            summaryEl.innerHTML = `默认规则 <strong>${defaultRows.length}</strong> 组，自定义补充 <strong>${customRows.length}</strong> 条。系统会优先保留“实验学校”等关键区分，避免把相近学校误并。`;
        }

        if (defaultTbody) {
            defaultTbody.innerHTML = defaultRows.map(row => `
                <tr>
                    <td style="font-weight:700;">${row.canonical}</td>
                    <td>${(row.aliases || []).join('、') || '-'}</td>
                    <td><span class="badge" style="background:#e2e8f0; color:#475569;">系统默认</span></td>
                </tr>
            `).join('') || '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">暂无默认规则</td></tr>';
        }

        if (customTbody) {
            customTbody.innerHTML = customRows.map(row => `
                <tr>
                    <td style="font-weight:700;">${row.canonical}</td>
                    <td>${row.alias}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="DataManager.openSchoolAliasEditor(${row.index})" style="padding:2px 8px;">修改</button>
                        <button class="btn btn-sm btn-danger" onclick="DataManager.deleteSchoolAliasMapping(${row.index})" style="padding:2px 8px;">删除</button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">暂无自定义对应，可点击上方“新增对应”补充。</td></tr>';
        }
        this.renderDataManagerStatus();
    },

    syncSchoolAliasSettingsFromGateway: async function () {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : (window.Auth?.currentUser || null);
        const role = String(user?.role || '').trim();
        if (role !== 'admin' && role !== 'director') {
            return false;
        }
        if (!(window.EdgeGateway && typeof EdgeGateway.listAliasRules === 'function' && EdgeGateway.canUseAuthorizedRequests())) {
            return false;
        }
        const data = await EdgeGateway.listAliasRules();
        const remoteRows = mapGatewaySchoolAliasRows(data?.records || []);
        replaceCustomSchoolAliasStore(remoteRows);
        this.renderSchoolAliasMappings();
        return true;
    },

    persistSchoolAliasSettings: async function () {
        ensureSchoolAliasStore();
        persistSchoolAliasSettingsLocal();
        let gatewayOk = false;
        let gatewayError = null;
        if (window.EdgeGateway && typeof EdgeGateway.saveAliasRules === 'function' && EdgeGateway.canUseAuthorizedRequests()) {
            try {
                await EdgeGateway.saveAliasRules(buildSchoolAliasGatewayRows(), { replace_scope: true });
                gatewayOk = true;
            } catch (err) {
                gatewayError = err;
                console.warn('[EdgeGateway] school alias save failed:', err?.message || err);
            }
        }
        let snapshotOk = false;
        if (typeof saveCloudData === 'function') {
            const ok = await saveCloudData({ background: true, sourceLabel: 'school-alias-save' });
            snapshotOk = !!ok;
        }
        this.renderDataManagerStatus();
        if (!(gatewayOk || snapshotOk) && gatewayError) throw gatewayError;
        return gatewayOk || snapshotOk;
    },

    openSchoolAliasEditor: function (index = -1) {
        const list = ensureSchoolAliasStore();
        const current = index >= 0 ? (list[index] || {}) : {};
        Swal.fire({
            title: index >= 0 ? '修改学校名称对应' : '新增学校名称对应',
            html: `
                <div style="text-align:left; line-height:2.2;">
                    <label>规范学校名</label>
                    <input id="swal-school-canonical" class="swal2-input" placeholder="如：银山实验学校" value="${String(current.canonical || '').replace(/"/g, '&quot;')}">
                    <label>别名/导入名称</label>
                    <input id="swal-school-alias" class="swal2-input" placeholder="如：银山镇实验学校" value="${String(current.alias || '').replace(/"/g, '&quot;')}">
                    <div style="font-size:12px; color:#64748b; margin-top:6px;">提示：这里用于补充你自己的学校名称对应。系统默认规则仍会保留，不会把“中学”和“实验学校”混在一起。</div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '保存',
            cancelButtonText: '取消',
            focusConfirm: false,
            preConfirm: () => {
                const canonical = String(document.getElementById('swal-school-canonical')?.value || '').trim();
                const alias = String(document.getElementById('swal-school-alias')?.value || '').trim();
                if (!canonical || !alias) {
                    Swal.showValidationMessage('规范学校名和别名都不能为空');
                    return false;
                }
                if (sanitizeSchoolText(canonical) === sanitizeSchoolText(alias)) {
                    Swal.showValidationMessage('别名与规范学校名完全相同，无需重复添加');
                    return false;
                }
                const duplicate = list.findIndex((item, idx) =>
                    idx !== index &&
                    sanitizeSchoolText(item?.alias || '') === sanitizeSchoolText(alias)
                );
                if (duplicate >= 0) {
                    Swal.showValidationMessage(`别名“${alias}”已存在于自定义对应表中`);
                    return false;
                }
                return { canonical, alias };
            }
        }).then(async (result) => {
            if (!result.isConfirmed || !result.value) return;
            const next = ensureSchoolAliasStore().slice();
            if (index >= 0) next[index] = result.value;
            else next.push(result.value);
            setSchoolAliasState(next);
            this.renderSchoolAliasMappings();
            try {
                await this.persistSchoolAliasSettings();
                if (window.UI) UI.toast('学校名称对应已保存', 'success');
            } catch (e) {
                if (window.UI) UI.toast('学校名称对应已暂存到本地，云端同步失败', 'warning');
            }
        });
    },

    deleteSchoolAliasMapping: async function (index) {
        const list = ensureSchoolAliasStore().slice();
        const current = list[index];
        if (!current) return;
        if (!confirm(`确定删除对应：${current.alias} → ${current.canonical} 吗？`)) return;
        list.splice(index, 1);
        setSchoolAliasState(list);
        this.renderSchoolAliasMappings();
        try {
            await this.persistSchoolAliasSettings();
            if (window.UI) UI.toast('学校名称对应已删除', 'success');
        } catch (e) {
            if (window.UI) UI.toast('已删除本地对应，但云端同步失败', 'warning');
        }
    },

    handleTargetUpload: function (input) {
        if (isArchiveLocked()) return alert("⛔ 当前考试已封存，禁止导入目标人数");
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                if (json.length === 0) return alert("空表格");

                let successCount = 0;
                let errorCount = 0;
                let dupCount = 0;
                const seen = new Set();
                const errors = [];

                json.forEach((row, idx) => {
                    const rowNo = idx + 2;
                    const rawName = row['学校名称'] || row['学校'];
                    const t1Key = Object.keys(row).find(k => k.includes('指标一') || k.includes('目标一'));
                    const t2Key = Object.keys(row).find(k => k.includes('指标二') || k.includes('目标二'));

                    if (!rawName) {
                        errorCount++;
                        errors.push(`第 ${rowNo} 行：学校名称为空`);
                        return;
                    }
                    const existingKey = resolveSchoolNameFromCollection(window.TARGETS || {}, rawName);
                    const name = getCanonicalSchoolName(rawName, [...Object.keys(window.TARGETS || {}), ...Object.keys(SCHOOLS || {}), rawName]);
                    const seenKey = normalizeSchoolName(name) || name;
                    if (seen.has(seenKey)) {
                        dupCount++;
                    }
                    seen.add(seenKey);

                    const t1 = parseInt(row[t1Key] || row['指标一目标人数'] || 0);
                    const t2 = parseInt(row[t2Key] || row['指标二目标人数'] || 0);

                    if (isNaN(t1) || isNaN(t2)) {
                        errorCount++;
                        errors.push(`第 ${rowNo} 行：目标人数非数字 (${name})`);
                        return;
                    }

                    if (existingKey && existingKey !== name) delete window.TARGETS[existingKey];
                    window.TARGETS[name] = { t1, t2 };
                    successCount++;
                });

                DataManager.renderTargets();
                DataManager.persistGrade9TargetsTemplate();

                if (typeof saveCloudData === 'function') {
                    const ok = await saveCloudData({ background: true, sourceLabel: 'targets-upload' });
                    if (window.UI) {
                        UI.toast(ok ? "✅ 目标数据已写入本地缓存，云端正在后台同步" : "⚠️ 目标数据已暂存，本次未成功同步云端", ok ? "success" : "warning");
                    }
                }

                const msg = `✅ 导入完成：成功 ${successCount} 条，重复 ${dupCount} 条，错误 ${errorCount} 条。`;
                if (errors.length > 0 && typeof Swal !== 'undefined') {
                    Swal.fire('导入结果', `<div style="text-align:left; font-size:12px;">${msg}<br><br>${errors.slice(0, 8).join('<br>')}${errors.length > 8 ? '<br>...' : ''}</div>`, errorCount > 0 ? 'warning' : 'success');
                } else {
                    alert(msg);
                }
                input.value = '';
            } catch (err) { alert("失败：" + err.message); }
        };
        reader.readAsArrayBuffer(file);
    },

    editTarget: function (schoolName) {
        const t = window.TARGETS[schoolName] || { t1: 0, t2: 0 };
        Swal.fire({
            title: `编辑目标 - ${schoolName}`,
            html: `<div style="text-align:left;line-height:2.5;"><label>指标一:</label><input id="swal-t1" type="number" class="swal2-input" value="${t.t1}" style="width:100px;height:30px;"><br><label>指标二:</label><input id="swal-t2" type="number" class="swal2-input" value="${t.t2}" style="width:100px;height:30px;"></div>`,
            showCancelButton: true,
            confirmButtonText: '确定',
            preConfirm: () => ({ t1: parseInt(document.getElementById('swal-t1').value) || 0, t2: parseInt(document.getElementById('swal-t2').value) || 0 })
        }).then(async (result) => {
            if (result.isConfirmed) {
                window.TARGETS[schoolName] = result.value;
                this.renderTargets();
                this.persistGrade9TargetsTemplate();
                if (typeof saveCloudData === 'function') {
                    const ok = await saveCloudData({ background: true, sourceLabel: 'targets-edit' });
                    if (window.UI) UI.toast(ok ? "✅ 目标修改已暂存，云端正在后台同步" : "⚠️ 目标修改已暂存，本次未成功同步云端", ok ? "success" : "warning");
                }
            }
        });
    },

    deleteTarget: async function (schoolName) {
        if (!confirm("确定删除？")) return;
        delete window.TARGETS[schoolName];
        this.renderTargets();
        this.persistGrade9TargetsTemplate();
        if (typeof saveCloudData === 'function') {
            const ok = await saveCloudData({ background: true, sourceLabel: 'targets-delete' });
            if (window.UI) UI.toast(ok ? "✅ 目标删除已暂存，云端正在后台同步" : "⚠️ 目标删除已暂存，本次未成功同步云端", ok ? "success" : "warning");
        }
        this.renderDataManagerStatus();
    },

    // 7. 保存并同步 (核心修复)
    saveAndSync: async function () {
        if (isArchiveLocked()) return alert("⛔ 当前考试已封存，仅支持只读查看");
        if (!confirm("⚠️ 确定要应用所有修改并同步到云端吗？\n\n1. 系统将重算排名\n2. 目标/参数将被保存")) return;

        UI.loading(true, "正在保存...");

        try {
            // 1. 确保参数已同步到全局
            await this.saveParamsLocally(true);
            this.syncTeacherHistory();
            setTargetsState(ensureNormalizedTargets());
            setSchoolAliasState(ensureSchoolAliasStore());

            // 2. 重新计算数据 (会读取 ind1, ind2)
            if (window.RAW_DATA && window.RAW_DATA.length) {
                try {
                    await processData();
                    renderTables();
                } catch (e) {
                    console.warn('重算失败，仍将同步云端：', e);
                }
            }

            // 3. 上传到云端
            const ok = await saveCloudData({ background: true, sourceLabel: 'save-and-sync' });
            if (!ok) throw new Error('云端同步任务未能创建');

            UI.loading(false);
            Swal.fire('成功', '数据已更新，本地已秒级生效，云端正在后台同步。', 'success');
        } catch (e) {
            UI.loading(false);
            alert("保存失败: " + e.message);
        }
    }
}; // DataManager 对象结束；SQL 相关逻辑已拆分到 public/assets/js/data-manager-sql.js

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

// 🟢 [优化版] 数据持久化工具：支持云端同步 + IndexedDB 本地缓存
const DB = {
    getLocal: async (key) => {
        return requireDataCloudRuntime().dbGetLocal(key);
    },
    // 保存数据：同时保存到云端和本地缓存
    save: async (key, value, options = {}) => {
        return requireDataCloudRuntime().dbSave(key, value, options);
    },

    // 读取数据：优先本地缓存，后台静默更新
    get: async (key, options = {}) => {
        return requireDataCloudRuntime().dbGet(key, options);
    },

    // 从云端强制同步并更新本地
    syncFromCloud: async (key) => {
        return requireDataCloudRuntime().dbSyncFromCloud(key);
    },

    // 清除数据
    clear: async (key) => {
        return requireDataCloudRuntime().dbClear(key);
    }
};

// 🔄 切换届别 (安全修复版)
async function switchCohort(cohortId, options = {}) {
    if (!cohortId) return;
    const cohortKey = getCohortKey(cohortId);
    const current = readWorkspaceProjectKey() || '';
    const currentExamId = CURRENT_EXAM_ID || readWorkspaceExamId() || COHORT_DB?.currentExamId || '';
    const hasReadyData = Array.isArray(RAW_DATA) && RAW_DATA.length > 0;
    if (current === cohortKey && currentExamId && hasReadyData) {
        tryAutoEnterReadyCohortWorkspace();
        return true;
    }

    if (!options.skipConfirm && !confirm("⚠️ 正在切换届别档案...\n\n切换前请确保当前工作已保存（数据会自动保存），否则未同步的修改可能丢失。\n\n确定切换吗？")) {
        const selector = document.getElementById('cohort-selector');
        if (selector) selector.value = readWorkspaceCohortId() || '';
        return false;
    }

    window.__COHORT_SWITCH_IN_PROGRESS__ = true;
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
            }
        }).catch((error) => {
            console.warn('[switchCohort] background project fetch failed:', error);
        });
    }

    const data=options.preloadedData||await DB.get(cohortKey,{localOnly:options.fastEnter===true});

    if (data) {
        COHORT_DB = data.COHORT_DB || null;
        CURRENT_COHORT_ID = data.CURRENT_COHORT_ID || cohortId;
        CURRENT_COHORT_META = data.CURRENT_COHORT_META || CURRENT_COHORT_META;
        CURRENT_EXAM_ID = data.CURRENT_EXAM_ID || '';
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
        document.getElementById('mode-mask').style.display = 'none';
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
                if (restoredFromExamArchive) {
                    updateSchoolSelect();
                    updateMySchoolSelect();
                    if (CONFIG.name) renderNavigation();
                    document.getElementById('mode-mask').style.display = 'none';
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
                    return true;
                }
                    return false;
                })
                .catch((e) => {
                console.warn('[switchCohort] cloud exam snapshot restore failed:', e);
                    return false;
                });
            if (options.fastEnter === true) {
                CohortExamHydrationScheduler.schedule(cohortId, {
                    delay: 250,
                    background: true
                });
            } else {
                const restored = await hydrateFromExamArchive();
                if (restored) {
                    UI.loading(false);
                    window.__COHORT_SWITCH_IN_PROGRESS__ = false;
                    return true;
                }
            }
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
        document.getElementById('mode-mask').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        scheduleWorkspaceUiRefresh('switch-cohort-empty', { delay: 160, idle: true, timeout: 1800, renderTables: false });

        CohortDB.renderExamList();

        UI.toast(`✨ 已切换到 [${cohortKey}] (新存档)，请开始上传数据`, "info");
        logAction('届别切换', `新建并切换到 ${cohortKey}`);
        updateStatusPanel();
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

const CohortExamHydrationScheduler = (() => {
    const tasks = new Map();
    const pending = new Map();
    const lastRun = new Map();
    const MIN_INTERVAL_MS = 2500;

    function getCurrentCohortForHydration(rawCohortId) {
        return String(rawCohortId || CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
    }

    function refreshHydratedExamViews(cohortId) {
        tryAutoRestoreWorkspaceExam({ cohortId });
        scheduleExamSelectorRefresh({ progressBaseline: true });
    }

    function run(cohortId, options = {}) {
        const cid = getCurrentCohortForHydration(cohortId);
        if (!cid || !window.CloudManager || typeof window.CloudManager.fetchCohortExamsToLocal !== 'function') {
            return Promise.resolve({ success: false, skipped: true, message: '云端历史考试同步未就绪' });
        }
        if (tasks.has(cid)) return tasks.get(cid);

        const now = Date.now();
        const force = options.force === true;
        if (!force && now - Number(lastRun.get(cid) || 0) < MIN_INTERVAL_MS) {
            return Promise.resolve({ success: true, skipped: true, throttled: true });
        }
        lastRun.set(cid, now);

        const fetchOptions = {
            background: options.background !== false,
            minCount: Math.max(1, Number(options.minCount || 2)),
            refreshSelectors: false
        };
        if (force) fetchOptions.force = true;
        if(options.latestOnly===true)fetchOptions.latestOnly=true;

        const task = Promise.resolve(window.CloudManager.fetchCohortExamsToLocal(cid, fetchOptions))
            .then((res) => {
                if (!res || res.success !== false) refreshHydratedExamViews(cid);
                return res;
            })
            .catch((error) => {
                console.warn(options.warnPrefix || '[CohortExamHydration] 云端历史考试拉取失败:', error);
                return { success: false, error };
            })
            .finally(() => {
                tasks.delete(cid);
            });

        tasks.set(cid, task);
        return task;
    }

    function mergeOptions(base = {}, next = {}) {
        const minCount = Math.max(1, Number(base.minCount || 2), Number(next.minCount || 2));
        return Object.assign({}, base, next, {
            minCount,
            background: base.background !== false && next.background !== false,
            latestOnly: minCount === 1 && base.latestOnly === true && next.latestOnly === true
        });
    }

    function schedule(cohortId, options = {}) {
        const cid = getCurrentCohortForHydration(cohortId);
        if (!cid) return Promise.resolve({ success: false, skipped: true, message: '未选择届别' });
        if (tasks.has(cid)) return tasks.get(cid);
        const incoming = Object.assign({}, options, {
            delay: Math.max(0, Number(options.delay || 0)),
            minCount: Math.max(1, Number(options.minCount || 2))
        });
        const current = pending.get(cid);
        if (current) {
            current.o = mergeOptions(current.o, incoming);
            if (incoming.delay < current.d) {
                clearTimeout(current.t);
                current.a(incoming.delay);
            }
            return current.p;
        }
        const queued = { o: incoming, d: incoming.delay };
        queued.p = new Promise((resolve, reject) => {
            queued.a = (delay) => {
                queued.d = delay;
                queued.t = setTimeout(() => {
                    pending.delete(cid);
                    run(cid, queued.o).then(resolve, reject);
                }, delay);
            };
        });
        pending.set(cid, queued);
        queued.a(incoming.delay);
        return queued.p;
    }

    return { run, schedule, refreshViews: refreshHydratedExamViews };
})();

window.CohortExamHydrationScheduler = CohortExamHydrationScheduler;


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
        document.getElementById('mode-mask').style.display = 'none';
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
            document.getElementById('mode-mask').style.display = 'flex';
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
    // 高性能列表渲染：解决 += HTML 导致的卡顿
    renderList: (data, templateFn) => {
        if (!data || !data.length) return '';
        return data.map(templateFn).join('');
    }
};
// ================= 全局变量 =================
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
// 🟢 [修复]：全局变量显式挂载到 window，确保 CloudManager 可访问
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

const initialWorkspaceSnapshot = readWorkspaceSnapshot();
let COHORT_DB = initialWorkspaceSnapshot.cohortDb || null;
let CURRENT_COHORT_ID = initialWorkspaceSnapshot.currentCohortId || '';
let CURRENT_COHORT_META = initialWorkspaceSnapshot.currentCohortMeta || null;
let CURRENT_EXAM_ID = initialWorkspaceSnapshot.currentExamId || '';
let TEACHER_TOWNSHIP_RANKINGS = {}; MARGINAL_STUDENTS = {};
let POTENTIAL_STUDENTS_CACHE = []; TOWNSHIP_RANKING_DATA = {};
let radarChartInstance = null;
let segmentChartInstance = null; // 新增：分数段直方图实例
let trendChartInstance = null; // 进退步趋势图实例
let TEACHER_STAMP_BASE64 = "";
// 存储结构: { "学校_姓名": [ {exam:"初一上", rank:100}, {exam:"初一下", rank:50} ... ] }
let HISTORY_ARCHIVE = readHistoryArchiveState();
let ROLLER_COASTER_STUDENTS = []; // 存储波动剧烈的学生名单
let historyChartInstance = null;
let CURRENT_REPORT_STUDENT = initialReportSessionSnapshot.currentReportStudent || null; // 暂存当前正在查询的学生对象
// 性能优化：定义学生明细表的分页状态
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

// 考务与分班相关变量
let FB_STUDENTS = []; let FB_CLASSES = readFbClassesState(); let FB_CUR_CLASS_IDX = -1; let FB_SIMULATED_DATA = {};
let EXAM_DATA = []; let EXAM_ROOMS = [];

let FB_SCHEMES_CACHE = []; // 存储生成的多种方案

const SUBJECT_ORDER = ['语文', '数学', '英语', '物理', '化学', '政治', '历史', '地理', '生物'];

// [修改] 导航配置与逻辑 (方案二：功能场景导向版)
// 说明：按“管数据 -> 比学校 -> 评班级 -> 抓学生 -> 用工具”的逻辑排列
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

// ================= 侧边栏与通用工具 =================
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

// ================= 辅助函数：Excel 格式化 =================
function getExcelPercent(val) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    return { t: 'n', v: val, z: '0.00%' };
}
function getExcelNum(val, decimals = 2) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    return { t: 'n', v: parseFloat(val.toFixed(decimals)) };
}

// 定义一套专业的样式配置
const XLS_STYLES = {
    // 表头样式
    HEADER: {
        font: { bold: true, sz: 12, color: { rgb: "333333" }, name: "Microsoft YaHei" },
        fill: { fgColor: { rgb: "E5E7EB" } }, // 浅灰背景
        border: { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true }
    },
    // 普通单元格
    CELL: {
        font: { sz: 11, name: "Arial" },
        border: { top: { style: 'thin', color: { rgb: "E5E7EB" } }, bottom: { style: 'thin', color: { rgb: "E5E7EB" } }, left: { style: 'thin', color: { rgb: "E5E7EB" } }, right: { style: 'thin', color: { rgb: "E5E7EB" } } },
        alignment: { horizontal: "center", vertical: "center" }
    },
    // 排名高亮 (前三名)
    RANK_TOP: {
        font: { bold: true, color: { rgb: "DC2626" } } // 红色
    },
    // 优秀 (绿色)
    SCORE_GOOD: {
        font: { color: { rgb: "16A34A" }, bold: true }
    },
    // 不及格 (红色)
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

            // 1. 基础样式应用
            let style = JSON.parse(JSON.stringify(R === 0 ? XLS_STYLES.HEADER : XLS_STYLES.CELL));

            // 2. 表头特殊处理
            if (R === 0) {
                // 如果是“总分”或“排名”，加深背景
                if (String(cell.v).includes("总分") || String(cell.v).includes("排名")) {
                    style.fill.fgColor = { rgb: "D1FAE5" }; // 浅绿
                }
            }
            // 3. 数据行智能处理
            else {
                // 🦓 斑马纹 (偶数行微灰)
                if (R % 2 === 0) style.fill = { fgColor: { rgb: "F9FAFB" } };

                // 🏆 排序列处理
                if (headerName.includes("排名") || headerName.includes("名次")) {
                    if (cell.v === 1 || cell.v === 2 || cell.v === 3) {
                        Object.assign(style.font, XLS_STYLES.RANK_TOP.font);
                        style.fill = { fgColor: { rgb: "FEF3C7" } }; // 浅黄底
                    }
                }

                // 📉 分数/率 处理
                if (typeof cell.v === 'number') {
                    // 及格率/优秀率 < 60% 标红 (如果是百分比数值 0.6)
                    if (headerName.includes("率") && cell.v < 0.6) {
                        Object.assign(style.font, XLS_STYLES.SCORE_BAD.font);
                    }
                    // 分数 < 60 标红 (假设满分100以上)
                    if ((headerName.includes("分") || headerName.includes("绩")) && cell.v < 60 && cell.v > 0) {
                        Object.assign(style.font, XLS_STYLES.SCORE_BAD.font);
                    }
                }

                // 文本对齐优化：姓名、学校左对齐
                if (headerName.includes("姓名") || headerName.includes("学校") || headerName.includes("班级")) {
                    style.alignment.horizontal = "left";
                    // 增加一点缩进
                    style.alignment.indent = 1;
                }
            }

            // 应用样式
            cell.s = style;

            // 4. 计算列宽 (简单估算)
            const valLen = (cell.v ? String(cell.v).length : 0) * 1.5;
            colWidths[C] = Math.max(colWidths[C] || 5, valLen > 50 ? 50 : valLen); // 限制最大宽度
        }
    }

    // 应用列宽
    ws['!cols'] = colWidths.map(w => ({ wch: w + 2 })); // 加一点padding

    // 冻结首行
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };
}

// --- 隐私/演示模式逻辑 ---

function togglePrivacyMode() {
    const btn = document.getElementById('btn-privacy-toggle');
    const indicator = document.getElementById('privacy-indicator');

    if (!IS_PRIVACY_ON) {
        // === 开启隐私模式 ===
        if (RAW_DATA.length === 0) return alert("请先上传数据后再开启演示模式。");

        if (!confirm("🛡️ 即将进入【隐私演示模式】：\n\n1. 所有学生姓名将变为代码 (如 S-001)\n2. 所有教师姓名将变为代码 (如 T-01)\n3. 适合投屏汇报或截图分享\n\n点击确定继续。")) return;

        // 1. 备份原始数据 (Deep Copy)
        DATA_BACKUP_PRIVACY = {
            RAW_DATA: JSON.parse(JSON.stringify(RAW_DATA)),
            TEACHER_MAP: JSON.parse(JSON.stringify(TEACHER_MAP)),
            // 也要备份历史数据，否则进退步分析会乱
            PREV_DATA: JSON.parse(JSON.stringify(PREV_DATA))
        };

        // 2. 执行脱敏 (Masking)
        // 建立映射表保证同名同ID
        const stuMap = new Map();
        let stuCounter = 1;

        // 脱敏 RAW_DATA
        RAW_DATA.forEach(s => {
            const key = s.name; // 简单按姓名映射，如果有重名会映射成同一个代码，符合演示逻辑
            if (!stuMap.has(key)) {
                stuMap.set(key, `S-${String(stuCounter++).padStart(3, '0')}`);
            }
            s.name = stuMap.get(key);
        });

        // 脱敏 PREV_DATA (如果有)
        if (PREV_DATA.length > 0) {
            PREV_DATA.forEach(p => {
                const key = p.name;
                // 如果是上次有但本次没有的学生，给新号；如果有，用旧号
                if (!stuMap.has(key)) {
                    stuMap.set(key, `S-${String(stuCounter++).padStart(3, '0')}`);
                }
                p.name = stuMap.get(key);
            });
        }

        // 脱敏 TEACHER_MAP
        const teacherMap = new Map();
        let teaCounter = 1;
        Object.keys(TEACHER_MAP).forEach(k => {
            const realName = TEACHER_MAP[k];
            if (!teacherMap.has(realName)) {
                teacherMap.set(realName, `T-${String(teaCounter++).padStart(2, '0')}`);
            }
            TEACHER_MAP[k] = teacherMap.get(realName);
        });

        // 3. 标记状态并刷新
        IS_PRIVACY_ON = true;
        btn.innerHTML = '<i class="ti ti-eye"></i> 退出隐私模式';
        btn.style.background = "#dc2626"; // 红色按钮提示退出
        indicator.style.display = "block";
        document.body.classList.add('privacy-mode-active'); // 可用于CSS扩展

    } else {
        // === 关闭隐私模式 (还原) ===
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

    // 4. 全局重算与重绘
    // 因为 SCHOOLS, TEACHER_STATS 等都是基于 RAW_DATA 计算的，必须重置
    setSchools({});
    setTeacherStats({});
    TEACHER_TOWNSHIP_RANKINGS = {};

    // 重新运行数据处理流程
    processData();
    calculateRankings();

    // 如果当前在教师分析页，重算教师数据
    if (Object.keys(TEACHER_MAP).length > 0 && MY_SCHOOL) {
        analyzeTeachers();
    }

    // 刷新所有表格视图
    renderTables();

    // 刷新特定的视图（如果当前正停留在这些Tab）
    // 比如教师卡片
    if (document.getElementById('teacherCardsContainer')) {
        renderTeacherCards();
        renderTeacherComparisonTable();
        renderTeacherTownshipRanking();
    }
    // 比如进退步
    if (document.getElementById('progress-analysis').classList.contains('active')) {
        if (PREV_DATA.length > 0) renderProgressAnalysis();
    }

    alert(IS_PRIVACY_ON ? "✅ 隐私模式已开启：姓名已脱敏，可进行汇报演示。" : "✅ 隐私模式已退出：数据已还原。");
}

window.IS_GUEST_MODE = false; // 全局标记

function toggleGuestMode() {
    const btn = document.getElementById('btn-guest-mode');

    if (!window.IS_GUEST_MODE) {
        // === 准备开启 ===
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
                // 1. 立即清除缓存
                await DB.clear('autosave_backup');

                // 2. 清除 LocalStorage 中的非配置类数据
                localStorage.removeItem('FB_DATA_BACKUP');
                localStorage.removeItem('MP_SNAPSHOTS');

                // 3. 改变状态
                window.IS_GUEST_MODE = true;

                // 4. UI 变化
                btn.innerHTML = '<i class="ti ti-flame-off"></i> 退出并清空';
                btn.style.background = "#dc2626";
                btn.style.borderColor = "#b91c1c";

                // 5. 页面增加水印或标识
                document.body.style.borderTop = "5px solid #dc2626";
                const statusEl = document.getElementById('auto-backup-status');
                if (statusEl) statusEl.innerHTML = `<span style="color:#dc2626; font-weight:bold;">🔥 阅后即焚模式：数据不落地</span>`;

                UI.toast("🔥 已开启阅后即焚：旧缓存已清理，新数据将不再保存。", "success");
            }
        });

    } else {
        // === 准备关闭 (其实就是重置) ===
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

// 拦截手动保存操作 (双重保险)
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

// ================= 初始化 =================
function initSystem(type) {
    document.getElementById('mode-mask').style.display = 'none';
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
        confirmButtonText: '去新手入口',
        cancelButtonText: '我知道了',
        confirmButtonColor: '#0ea5e9'
    }).then((r) => {
        if (r.isConfirmed) {
            __guardBypass = true;
            switchTab('starter-hub');
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
        'teacher-analysis',
        'student-overview', 'student-details', 'subject-balance', 'marginal-push', 'progress-analysis', 'cohort-growth',
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

// [优化] switchTab: 增加动态副标题更新，提升上下文感知
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

// Teaching management cloud/version runtime moved to public/assets/js/teaching-management-runtime.js.
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

// Teaching management overview/module runtime moved to public/assets/js/teaching-management-runtime.js.

function forceHideAllSectionsExcept(targetId = '') {
    const sections = getModuleSectionsCached(true);
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
    if (typeof window.ensureLazySectionLoaded === 'function') {
        const before = getModuleSectionById(id);
        const loaded = window.ensureLazySectionLoaded(id);
        if (loaded) removeModuleIntroPanels(document);
        if (loaded && loaded !== before) getModuleSectionsCached(true);
    }
    ensureCountySubmoduleSectionForSwitch(id);
    removeModuleIntroPanels(document);

    // 1. 切换内容区域显示
    forceHideAllSectionsExcept(id);
    if (id !== 'teacher-analysis' && typeof window.releaseTeacherAnalysisHeavyDom === 'function') {
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
    resetMainViewport();
    scheduleAfterPaint(() => scheduleCountyAnalysisRenderAfterSwitch(id));

    // 2. 定位所属大类
    let currentCategory = getCurrentCategoryKey();
    let foundCategory = getModuleCategoryKeyCached(id);

    // 3. 如果大类变化，刷新导航和全局颜色
    if (foundCategory && foundCategory !== currentCategory) {
        setCurrentCategoryKey(foundCategory);
        currentCategory = foundCategory;
        const newColor = NAV_STRUCTURE[currentCategory]?.color || '#334155';
        if (ModuleSwitchPerfCache.primaryColor !== newColor) {
            document.documentElement.style.setProperty('--primary', newColor);
            ModuleSwitchPerfCache.primaryColor = newColor;
        }

        // 重新渲染导航以更新高亮
        if (typeof renderNavigation === 'function') scheduleAfterPaint(() => renderNavigation());
    } else {
        // 如果大类没变，仅更新子模块芯片的高亮状态
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

    // 1. 打开入口
    open: function (title, studentList, scoreLabel = "总分") {
        ensureDrillModalDom();
        this.history = []; // 清空历史
        this.currentData = { title, list: studentList, scoreLabel };

        // 🟢 缓存导出数据：如果是普通名单，直接缓存学生列表
        this.exportData = { type: 'list', data: studentList, fileName: title };

        // 🟢 显示导出按钮 (防止之前被隐藏)
        const btn = document.getElementById('drill-export-btn');
        if (btn) btn.classList.remove('hidden');

        document.getElementById('drill-modal').style.display = 'flex';
        this.renderClassView();
    },

    // 🟢 新增：通用导出功能
    exportExcel: function () {
        if (!this.exportData || !this.exportData.data) return alert("当前无数据可导出");

        const wb = XLSX.utils.book_new();
        let ws = null;
        const filename = (this.exportData.fileName || "导出数据") + ".xlsx";

        if (this.exportData.type === 'gap') {
            // 🅰️ 导出临界生/潜力生分析数据 (特殊表头)
            const headers = ['班级', '姓名', '当前总分', '距目标分差', '建议补救/潜力学科', '该科与年级均分差'];
            const data = [headers];
            this.exportData.data.forEach(item => {
                // 去除HTML标签 (提取纯文本)
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
            // 🅱️ 导出普通学生名单 (如点击"达标人数"时)
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

    // 2. 渲染班级视图
    renderClassView: function () {
        const { title, list, scoreLabel } = this.currentData;
        document.getElementById('drill-title').innerText = title;
        document.getElementById('drill-back-btn').classList.add('hidden');

        // 按班级分组
        const classMap = {};
        list.forEach(s => {
            if (!classMap[s.class]) classMap[s.class] = [];
            classMap[s.class].push(s);
        });

        // 排序班级
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

    // 3. 渲染学生名单视图
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

    // 4. 返回上一级
    goBack: function () {
        if (this.history.length > 0) {
            this.history.pop();
            this.renderClassView();
        }
    }
};

// 辅助：各模块的点击处理器
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

    // 获取当前设定的划线
    const { r1, r2 } = getIndicatorRankParams();
    if (!r1 || !r2) return alert("请先设置指标参数");

    const townshipRows = (typeof filterRowsToTownshipSchools === 'function')
        ? filterRowsToTownshipSchools(RAW_DATA || [])
        : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    const allScores = townshipRows.map(s => s.total).filter(v => typeof v === 'number').sort((a, b) => b - a);
    const line = type === 'ind1' ? (allScores[r1 - 1] || 0) : (allScores[r2 - 1] || 0);
    const title = `${schoolName} - ${type === 'ind1' ? '指标一' : '指标二'}达标名单 (线≥${line})`;

    // 筛选学生
    const students = studentsBySchool.filter(s => s.total >= line);

    DrillSystem.open(title, students);
}

function handleHighClick(schoolName) {
    const schoolRecord = getAppSchoolRecord(schoolName);
    if (!schoolRecord) return;
    // 9年级默认490，或者这里可以做成动态的
    const line = 490;
    const students = (schoolRecord.students || []).filter(s => s.total >= line);
    DrillSystem.open(`${schoolName} - 高分段(≥${line})名单`, students);
}

function handleExcludedClick(schoolName) {
    const s = getAppSchoolRecord(schoolName);
    if (!s) return;
    // 重新计算剔除逻辑
    const sorted = [...s.students].sort((a, b) => a.total - b.total); // 升序
    const excN = s.bottom3 ? s.bottom3.excN : 0;

    // 取最低分的 N 个
    const students = sorted.slice(0, excN).sort((a, b) => b.total - a.total); // 展示时按分降序好看点

    DrillSystem.open(`${schoolName} - 后1/3核算剔除名单 (共${excN}人)`, students);
}

// === 渲染高分段表格 ===
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

    // 1. 提取所有学校数据
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

    // 2. 排序：按高分赋分降序
    list.sort((a, b) => b.score - a.score);

    // 3. 渲染所有行 (没有 slice)
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

    // 更新 UI 提示
    appDebug(`已渲染 ${list.length} 所学校的高分数据`);
}

// === 导出高分段 Excel ===
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

// ================= 数据处理 =================
async function prepareSameExamOverwrite(currentExamId, existingExam = null) {
    const examId = String(currentExamId || '').trim();
    if (!examId) return { localRemoved: false, cloudRemoved: false };

    let localRemoved = false;
    try {
        const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
        if (db && typeof db === 'object') {
            db.exams = db.exams || {};
            if (db.exams[examId]) {
                delete db.exams[examId];
                localRemoved = true;
            }
            if (Array.isArray(db.resetPoints)) {
                db.resetPoints = db.resetPoints.filter((item) => String(item || '').trim() !== examId);
            }
            Object.values(db.students || {}).forEach((student) => {
                if (!Array.isArray(student?.history)) return;
                student.history = student.history.filter((item) => String(item?.examId || '').trim() !== examId);
                if (String(student.lastExamId || '').trim() === examId) {
                    const last = student.history[student.history.length - 1] || null;
                    student.lastExamId = last?.examId || null;
                    student.lastScore = typeof last?.total === 'number' ? last.total : null;
                }
            });
            db.currentExamId = examId;
            syncRuntimeStateToWindow();
        }
    } catch (error) {
        console.warn('[upload] local overwrite cleanup failed:', error);
    }

    let cloudRemoved = false;
    try {
        if (typeof deleteSystemDataRecords === 'function') {
            const { error } = await deleteSystemDataRecords({ keyEq: examId });
            if (error && error.message !== 'CLOUD_CLIENT_MISSING') throw error;
            cloudRemoved = !error;
        }
        if (window.idbKeyval && typeof window.idbKeyval.del === 'function') {
            await window.idbKeyval.del(`cache_${examId}`);
        }
    } catch (error) {
        console.warn('[upload] cloud overwrite cleanup failed:', error);
    }

    appDebug('[upload] same exam overwrite prepared:', {
        examId,
        previousRows: Array.isArray(existingExam?.data) ? existingExam.data.length : 0,
        localRemoved,
        cloudRemoved
    });
    return { localRemoved, cloudRemoved };
}

document.getElementById('fileInput').addEventListener('change', function (e) {
    if (isArchiveLocked()) return alert("⛔ 当前考试已封存，禁止上传新数据");
    if (!CURRENT_COHORT_ID) return alert("请先选择或新建届别");
    const beforeExamId = CURRENT_EXAM_ID || readWorkspaceExamId() || '';
    const currentExamId = setCurrentExamMeta(true);
    if (!currentExamId) return;
    if (beforeExamId && beforeExamId !== currentExamId && window.UI) {
        UI.toast(`🧭 已自动切换考试批次：${currentExamId}`, 'info');
    }

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const existingExam = db?.exams?.[currentExamId];
    const hasExistingData = !!(existingExam && Array.isArray(existingExam.data) && existingExam.data.length > 0);
    const shouldOverwriteExistingExam = hasExistingData;
    if (hasExistingData) {
        const ok = confirm(`⚠️ 检测到考试批次「${currentExamId}」已存在 ${existingExam.data.length} 条成绩数据。\n继续上传将覆盖该批次原数据，是否继续？`);
        if (!ok) {
            e.target.value = '';
            if (window.UI) UI.toast('已取消上传，原批次数据未被修改', 'info');
            return;
        }
    }
    const files = e.target.files;
    if (!files.length) return;

    // 使用 Perf.runAsync 包裹，实现加载动画 + 防卡死
    Perf.runAsync(async () => {
        if (shouldOverwriteExistingExam) {
            await prepareSameExamOverwrite(currentExamId, existingExam);
        }

        // 重置数据
        clearDataRuntimeState({ keepConfig: true }); setTeacherMap({}); setTeacherStats({});
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

        // 耗时操作
        for (let f of files) await readExcel(f);
        SUBJECTS.sort(sortSubjects);
        await processData(); // 这是一个耗时操作
        syncRuntimeStateToWindow();

        updateSchoolMode();

        // 🟣 Cohort：写入考试快照并执行智能匹配
        await CohortDB.syncCurrentExam();

        // 🟣 上传后立即刷新多期对比选择器（analysis / teacher / progress）
        scheduleExamSelectorRefresh({ teacherCompareTeacher: true });

        // 🟢 [新增] 处理完数据后，立即同步到云端 (仅管理员有效)
        // 注意：因为是异步，我们在后台默默保存，不阻塞界面显示
        saveCloudData({ background: true, sourceLabel: 'auto-backup' }).then(() => {
            appDebug("自动备份完成");
        }).catch(e => logCloudSyncIssue("自动备份失败", e));
        renderTables();
        applySchoolModeToTables();
        // 更新所有下拉框
        updateSchoolSelect(); updateMySchoolSelect(); updateStudentSchoolSelect(); updateMarginalSchoolSelect();
        updateClassSelect(); updateSegmentSelects(); updatePotentialSchoolSelect();
        if (typeof updateCorrelationSchoolSelect === 'function') updateCorrelationSchoolSelect();
        updateSeatAdjSelects();
        updateProgressSchoolSelect();
        updateMutualAidSelects(); updateMpSchoolSelect();

        setUploadMessage(`✅ 成功导入 ${Object.keys(SCHOOLS).length} 所学校，共 ${RAW_DATA.length} 名学生。下一步建议确认本校、任课表与当前考试是否都已就绪。`, 'success');
        UI.toast(`✅ 导入成功！包含 ${RAW_DATA.length} 条数据`, 'success');
        logAction('导入', `成绩导入 ${RAW_DATA.length} 条`);
        updateStatusPanel();
    }, "正在解析 Excel 并计算排名...");
});

async function readExcel(file) {
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: 'array' });
    wb.SheetNames.forEach(sname => {
        if (sname.includes('二模本校') || sname.includes('各班各科') || sname.includes('横向对比')) return;
        const json = XLSX.utils.sheet_to_json(wb.Sheets[sname], { header: 1 });
        if (json.length < 2) return;
        parseRows(json, sname);
    });
}

// =========== 🔥 修改重点：parseRows 全自动版 (含缺考录入) ===========
// 逻辑说明：
// 1. 只要Excel里有姓名，就录入系统，作为【在籍人数】的基数。
// 2. 只有当学生有有效分数时，标记 hasValidScore=true，作为【实考人数】的基数。
function parseRows(rows, defaultSchool) {
    const headers = rows[0].map(h => String(h).trim());

    // 1. 初始化索引映射
    const idxMap = { name: -1, id: -1, school: -1, class: -1, examRoom: -1, scores: {} };

    // 2. 别名匹配
    const aliasMap = {
        name: ['姓名', '学生姓名', '学生', 'Name', '考生姓名'],
        id: ['考号', '学号', '准考证号', 'ID', '考生号'],
        school: ['学校名称', '学校名', '学校', '校名', '所在学校', '就读学校', '毕业学校', '初中学校', '报名学校', '参考学校', '参考单位', '单位名称', '单位'],
        class: ['班级', '班', '班次', 'Class', '行政班'],
        examRoom: ['考场', '考室', 'Room', '考试地点']
    };

    // 增加容错：常见的学科名称
    const subjectMap = { '语文': '语文', '数学': '数学', '英语': '英语', '物理': '物理', '化学': '化学', '政治': '政治', '道法': '政治', '道德与法治': '政治', '历史': '历史', '地理': '地理', '生物': '生物', '科学': '科学' };
    const excludeKeywords = ['排', '次', '级', 'Rank', '赋分', '相对分', '折算', '等级', '优劣'];

    // 3. 扫描表头
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

    // 1. 全角转半角工具 (针对分数录入错误)
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

    // 2. 姓名清洗工具 (去除空格、不可见字符)
    const cleanNameStr = (str) => {
        if (!str) return "";
        return String(str).replace(/\s+/g, '').replace(/[\u200b-\u200f\uFEFF]/g, '');
    };

    // 4. 遍历数据 (核心修改区)
    // 学校列支持逐行填写，也支持 Excel 合并单元格导出的“首行有值、后续空白”格式。
    let lastDetectedSchool = '';
    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        if (!r || !r.length) continue;

        // --- 修改点 A: 姓名处理 ---
        // 如果找不到姓名列，或者单元格为空，自动生成 "匿名考生_行号"
        let rawName = idxMap.name !== -1 ? (r[idxMap.name] || "") : "";
        let nameStr = cleanNameStr(rawName);
        let isAutoGeneratedName = false;

        if (!nameStr || nameStr === '-' || nameStr === '0' || nameStr === '0.0' || nameStr === '姓名') {
            nameStr = `考生${String(i).padStart(3, '0')}`;
            isAutoGeneratedName = true;
        }

        // --- 修改点 B: 班级处理 ---
        // 如果找不到班级列，默认为 "未分班"
        let classStr = "未分班";
        if (idxMap.class !== -1 && r[idxMap.class]) {
            classStr = normalizeClass(r[idxMap.class]);
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
            hasValidScore: false
        };

        // 数据读取逻辑
        let hasAnyScore = false;
        let hasExplicitScoreEvidence = false;
        detectedSubjects.forEach(sub => {
            const colIndices = idxMap.scores[sub];
            if (colIndices && colIndices.length > 0) {
                let subSum = 0;
                let validSub = false;
                colIndices.forEach(idx => {
                    let rawVal = r[idx];
                    if (isBlankSubjectScoreCell(rawVal)) {
                        validSub = true;
                        return;
                    }
                    // 如果是字符串，先尝试转半角
                    if (typeof rawVal === 'string') {
                        rawVal = toHalfWidth(rawVal).trim();
                    }
                    let val = parseFloat(rawVal);

                    // 如果解析结果不是数字，进行智能清洗
                    if (isNaN(val)) {
                        const strVal = String(rawVal || "").trim().toUpperCase(); // 转大写去空格

                        // 定义由于特殊原因导致的“0分”关键词
                        // 缺考(ABS/Q/缺), 作弊(CHE/违纪), 病假(BJ), 缓考 等
                        const zeroKeywords = ["缺", "ABS", "作弊", "违纪", "病假", "缓考", "取消", "零分", "Q", "CHE"];

                        // 如果包含上述关键词，强制视为 0 分 (参与排名)
                        if (zeroKeywords.some(key => strVal.includes(key))) {
                            val = 0;
                        }
                        // 否则，该数据依然为 NaN，后续逻辑会自动“排除” (不参与均分计算)
                    }
                    if (!isNaN(val)) { subSum += val; validSub = true; hasExplicitScoreEvidence = true; }
                });
                if (validSub) {
                    stu.scores[sub] = parseFloat(subSum.toFixed(2));
                    stu.hasValidScore = true;
                    hasAnyScore = true;
                    if (subsForTotal.includes(sub)) stu.total += subSum;
                }
            }
        });

        // 如果这一行完全没有成绩，并且名字也是自动生成的，大概率是空行，跳过
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

async function processData() {
    // 1. 预处理
    // 🟢 [修改开始]：引入单校模式判断与阈值计算优化

    // 重新构建临时的 SCHOOLS 键列表以检测数量
    const schoolSet = new Set(RAW_DATA.map(s => s.school));
    const isSingleSchool = schoolSet.size === 1;

    // 获取用户输入的指标参数 (用于单校模式下的精确划线)
    // 确保 window.SYS_VARS 已初始化
    const input1 = parseFloat(window.SYS_VARS?.indicator?.ind1) || 0;
    const input2 = parseFloat(window.SYS_VARS?.indicator?.ind2) || 0;

    const townshipRowsForCore = (typeof filterRowsToTownshipSchools === 'function')
        ? filterRowsToTownshipSchools(RAW_DATA || [])
        : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    const thresholdSourceRows = townshipRowsForCore.length ? townshipRowsForCore : (RAW_DATA || []);

    const keys = [...SUBJECTS, 'total'];
    keys.forEach(k => {
        const vals = thresholdSourceRows.map(s => k === 'total' ? s.total : s.scores[k]).filter(v => v !== undefined).sort((a, b) => b - a);

        if (vals.length) {
            // 如果是单校模式，且是总分，且用户输入了有效的名次指标
            if (isSingleSchool && k === 'total' && input1 > 0 && input2 > 0) {
                // 🏫 单校模式特殊逻辑：
                // 使用用户输入的“年级名次”来反推分数线，这在单校月考中比百分比更稳定
                const idx1 = Math.min(Math.floor(input1), vals.length) - 1;
                const idx2 = Math.min(Math.floor(input2), vals.length) - 1;

                THRESHOLDS[k] = {
                    exc: vals[Math.max(0, idx1)] || 0,
                    pass: vals[Math.max(0, idx2)] || 0
                };
                appDebug(`[单校模式] 总分划线锁定: 优=${THRESHOLDS[k].exc} (Top${input1}), 良=${THRESHOLDS[k].pass} (Top${input2})`);
            } else {
                // 🌍 多校联考模式 / 单科默认逻辑：按固定比例
                // 9年级 15%，其他 20%
                const excRatio = (CONFIG.name && CONFIG.name.includes('9')) ? 0.15 : 0.2;
                // 单校模式下，如果没有手动指定，单科依然沿用百分比，但可以考虑后续增加单科手动设置
                const pickPercentileLine = (ratio) => {
                    // Match Excel LARGE(range, count * ratio): Excel's rank is 1-based.
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

    // 2. 呼叫 Worker
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

    // 3. 接收结果 (RAW_DATA 是全新的，带有排名的数组)
    setRawData(result.RAW_DATA || []);

    // 4. 【关键修复】重建 SCHOOLS 与新 RAW_DATA 的关联
    // Worker 返回了全新的 RAW_DATA，必须把这些新对象重新塞回 SCHOOLS 的 students 数组里
    // 否则 SCHOOLS 里存的还是旧对象(无排名)，导致"本校"查询失效

    // A. 先清空所有学校的学生列表
    Object.keys(SCHOOLS).forEach(k => {
        if (SCHOOLS[k]) SCHOOLS[k].students = [];
    });

    // B. 重新分配新学生对象
    RAW_DATA.forEach(stu => {
        if (!SCHOOLS[stu.school]) {
            // 防止有漏网之鱼
            SCHOOLS[stu.school] = { name: stu.school, students: [], metrics: {}, rankings: {} };
        }
        SCHOOLS[stu.school].students.push(stu);
    });

    // 5. 更新统计指标 (metrics)
    const newSchools = result.SCHOOLS;
    Object.keys(newSchools).forEach(k => {
        if (SCHOOLS[k]) {
            const { students, ...metricsData } = newSchools[k];
            // 只合并统计数据，不动刚才重新生成的 students 数组
            Object.assign(SCHOOLS[k], metricsData);
        }
    });

    // 6. 补全班级排名
    calculateClassRanksOnly();

    if (typeof fuseInstance !== 'undefined') fuseInstance = null; // 强制重建索引

    setSchools(SCHOOLS);
    setThresholds(THRESHOLDS);

    if (isSingleSchool) {
        appDebug("🏫 检测到单校数据，自动切换 UI 为年级模式...");

        // 1. 隐藏横向对比入口 (自己跟自己没法比)
        const analysisMod = document.getElementById('analysis');
        if (analysisMod) analysisMod.classList.add('single-school-mode');

        // 2. 修改表头文字 (延迟执行确保 DOM 已渲染)
        // 将 "全镇"、"镇排" 替换为 "年级"、"级排"，消除歧义
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

        // 1. 自动计算指标生 (依赖 RAW_DATA 和 TARGETS)
        // 即使没有设置划线，运行一下也不会报错，只是得分为0
        if (typeof calcIndicators === 'function' && isIndicatorCalcAllowed()) {
            calcIndicators(true); // 传入 true 表示静默模式(可选，视函数实现而定)
        }

        // 2. 自动计算综合总榜 (依赖前一步计算出的 scoreInd)
        if (typeof calcSummary === 'function') {
            calcSummary(true);    // 传入 true 表示静默模式
        }

    } catch (e) {
        console.warn("⚠️ 自动计算衍生指标时遇到非致命错误:", e);
    }

    // 7. 自动保存
    if (typeof DB !== 'undefined') {
        // ✋ 🔴 [修复开始]：不要写死 'autosave_backup'，而是获取当前选中的项目 KEY
        // 如果获取不到，才兜底使用 'autosave_backup'
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
            DB.save(currentKey, snapshotPayload, { deferCloud: true, deferMs: 9000 });
            appDebug(`✅ 数据已自动保存至: ${currentKey}`);
        }
        // 👆 🟢 [修复结束]
    }
    updateStatusPanel();
}

// 辅助：仅计算班级排名
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
        // 总分
        if (window.RankingDataService && typeof window.RankingDataService.assignRankScope === 'function') {
            window.RankingDataService.assignRankScope(group, 'total', 'class', s => s.total);
        } else {
            group.sort((a, b) => b.total - a.total);
            group.forEach((s, i) => { if (!s.ranks) s.ranks = {}; if (!s.ranks.total) s.ranks.total = {}; s.ranks.total.class = i + 1; });
        }
        // 单科
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
// 核心逻辑：如果是数字，保留2位小数展示；如果是无效值，显示 '-'
// 注意：这只改变显示，不改变 underlying calculation (底层计算)
function formatVal(val) {
    if (typeof val !== 'number' || isNaN(val)) return '-';
    // toFixed(2) 会四舍五入并转为字符串，如 89.567 -> "89.57", 90 -> "90.00"
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
        CURRENT_EXAM_ID || '',
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
    const subjectRenderKey = `${summarySignature}::subjects`;

    if (subContainer?.dataset.summaryRenderSig !== subjectRenderKey || sideNavSubjects?.dataset.summaryRenderSig !== subjectRenderKey) {
    if (subContainer) subContainer.innerHTML = '';
    if (sideNavSubjects) sideNavSubjects.innerHTML = '';

    if (!subContainer || !sideNavSubjects) {
        console.warn("⚠️ [renderTables] 找不到学科表格或导航容器，跳过学科详情渲染。");
        return;
    }

    SUBJECTS.forEach(sub => {
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
    if (subContainer) subContainer.dataset.summaryRenderSig = subjectRenderKey;
    if (sideNavSubjects) sideNavSubjects.dataset.summaryRenderSig = subjectRenderKey;
    }

    const tbBottom = document.querySelector('#tb-bottom3 tbody'); let htmlBottom = '';
    let bottomList = townshipSchools.slice().sort((a, b) => (a.rankBottom || 9999) - (b.rankBottom || 9999));
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
    refreshIndicatorResults(true);
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

    // 遍历所有学校和所有科目进行“体检”
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

            // 1. 🔴 红色预警条件：及格率 < 60% 或 排名垫底
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
            // 2. 🟢 绿色标杆条件：优秀率 > 30% 或 排名第一
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
            // 3. 🟡 黄色关注条件：优秀率 < 15% (即缺乏尖子生) 且没被归入红灯
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

    // 更新计数徽章
    document.getElementById('count-red').innerText = cntRed;
    document.getElementById('count-yellow').innerText = cntYellow;
    document.getElementById('count-green').innerText = cntGreen;

    // 空状态处理
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

// 辅助跳转函数：点击卡片定位到对应表格
function jumpToDetail(school, subject) {
    // 如果是总分，跳到总表
    if (subject === 'total') {
        document.getElementById('anchor-total').scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
        // 如果是单科，跳到单科表
        const anchor = document.getElementById(`anchor-subject-${subject}`);
        if (anchor) {
            // 展开侧边栏（如果有的话）
            const navLink = document.querySelector(`.side-nav-sub-link[onclick*="${subject}"]`);
            if (navLink) {
                // 模拟点击展开父级菜单
                const parent = navLink.closest('.side-nav-sub-container');
                if (parent) parent.classList.add('show');
            }
            anchor.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    // 高亮行闪烁效果
    setTimeout(() => {
        // 简单查找包含学校名的行（不仅限于精确匹配，为了简化）
        // 实际应用中可能需要更精确的ID定位，但这里通过文字匹配即可
        // 提示用户
        UI.toast(`已定位到：${school} - ${subject}`, 'info');
    }, 500);
}

// ================= 教师配置与分析 =================
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
        ? listAvailableSchoolsForCompare()
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
    // 🟢 1. 【核心修复】无条件优先刷新管理员面板的学校列表
    // 无论界面上有没有 "mySchoolSelect" 下拉框，只要数据处理完了，就必须通知账号管理器
    if (typeof Auth !== 'undefined') {
        Auth.renderSchoolCheckboxes();
    }

    // 🟢 2. 然后再处理下拉框逻辑 (如果 ID 存在的话)
    const select = document.getElementById('mySchoolSelect');

    // 如果找不到下拉框，仅仅停止处理下拉框，不要影响上面的账号列表刷新
    if (!select) return;

    // 下面是原有的下拉框填充逻辑
    const schools = (typeof listAvailableSchoolsForCompare === 'function')
        ? listAvailableSchoolsForCompare()
        : Object.keys(SCHOOLS || {});
    const schoolSet = new Set((schools || []).map(s => String(s || '').trim()).filter(Boolean));
    const currentSchool = readCurrentSchool();
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

    // 当学校数据更新时，顺便刷新管理员面板里的“学校复选框列表” (此处旧代码已在上面第一步执行了，这里不需要重复)

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

    // 单校直接锁定
    if (schoolNames.length === 1) {
        detectedSchool = schoolNames[0];
    } else {
        // 策略1：从当前用户信息获取
        try {
            const user = getCurrentUser();
            if (user && user.school && schoolNames.includes(user.school)) {
                detectedSchool = user.school;
            }
        } catch (e) {
            console.warn('获取用户信息失败:', e);
        }

        // 策略2：从 TEACHER_MAP 统计
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

        // 策略3：从 RAW_DATA 统计哪个学校的数据最多
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

        // 策略4：从 SCHOOLS 对象统计哪个学校的学生最多
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

const StudentDetailsPerfCache = {
    schoolOptionsSignature: '',
    accessibleSchools: [],
    classOptions: new Map(),
    subjectListSignature: '',
    subjectList: [],
    renderMetaSignature: '',
    renderMeta: null,
    querySignature: '',
    queryData: [],
    queryMeta: null,
    pageSizeWidth: 0,
    pageSize: 40,
    domCache: null,
    domSignature: '',
    headerHtmlSignature: '',
    headerHtml: '',
    bodyHtmlSignature: '',
    bodyHtml: '',
    paginationSignature: '',
    paginationHtml: '',
    desktopRowsSignature: '',
    desktopRowsHtml: '',
    mobileRowsSignature: '',
    mobileRowsHtml: '',
    rankSnapshotSignature: '',
    rankSnapshotByStudent: new WeakMap(),
    cellValueSignature: '',
    cellValueByStudent: new WeakMap(),
    openFilterMenu: null,
    filterSearchCache: new WeakMap()
};

function updateStudentSchoolSelect() {
    const select = document.getElementById('studentSchoolSelect');
    const classSelect = document.getElementById('studentClassSelect');
    const modeWrap = document.getElementById('classTeacherViewModeWrap');
    const modeSelect = document.getElementById('classTeacherViewMode');
    if (!select || !classSelect) return;
    const setOptionsIfChanged = (target, html, signature) => {
        const sig = String(signature || html || '');
        if (target.dataset.studentDetailOptionsSig === sig) return;
        target.innerHTML = html;
        target.dataset.studentDetailOptionsSig = sig;
    };
    const buildClassOptions = (classes, includeAll = true) => {
        const classList = Array.from(classes || []).map(c => String(c || '').trim()).filter(Boolean);
        return (includeAll ? '<option value="">全部班级</option>' : '')
            + classList.map(c => `<option value="${c}">${c}</option>`).join('');
    };
    const previousSchool = select.value;
    const previousClass = classSelect.value;
    select.disabled = false;
    classSelect.disabled = false;
    if (modeWrap) modeWrap.style.display = 'none';

    const user = getCurrentUser();
    const role = user?.role;
    const schoolSignature = [
        Object.keys(SCHOOLS || {}).sort().join('|'),
        String(user?.role || ''),
        String(user?.school || ''),
        String(user?.class || ''),
        String(user?.name || '')
    ].join('::');
    if (StudentDetailsPerfCache.schoolOptionsSignature !== schoolSignature) {
        const availableSchools = (typeof listAvailableSchoolsForCompare === 'function')
            ? listAvailableSchoolsForCompare()
            : Object.keys(SCHOOLS || {});
        StudentDetailsPerfCache.accessibleSchools = PermissionPolicy.getAccessibleSchoolNames(user, availableSchools);
        StudentDetailsPerfCache.schoolOptionsSignature = schoolSignature;
        StudentDetailsPerfCache.classOptions.clear();
    }
    const accessibleSchools = StudentDetailsPerfCache.accessibleSchools;
    const schoolOptionsHtml = '<option value="">--请选择本校--</option>'
        + accessibleSchools.map(school => `<option value="${school}">${school}</option>`).join('');
    setOptionsIfChanged(select, schoolOptionsHtml, `schools:${accessibleSchools.join('|')}`);
    if (previousSchool && accessibleSchools.includes(previousSchool)) select.value = previousSchool;

    const updateClassOptionsForSchool = (school, options = {}) => {
        const includeAll = options.includeAll !== false;
        const selectedSchool = String(school || '').trim();
        const classQueryMode = role === 'class_teacher' ? getClassTeacherStudentViewMode() : (options.mode || 'teaching');
        const classCacheKey = `${selectedSchool}::${includeAll}::${classQueryMode}::${role || ''}::${user?.school || ''}::${user?.class || ''}`;
        let classes = StudentDetailsPerfCache.classOptions.get(classCacheKey);
        if (!classes) {
            classes = [];
            if (selectedSchool && SCHOOLS[selectedSchool]) {
                classes = PermissionPolicy.getAccessibleClassNames(
                    user,
                    [...new Set(SCHOOLS[selectedSchool].students.map(s => s.class))].sort(),
                    selectedSchool,
                    { mode: classQueryMode }
                );
            }
            StudentDetailsPerfCache.classOptions.set(classCacheKey, classes);
        }
        const html = buildClassOptions(classes, includeAll);
        setOptionsIfChanged(classSelect, html || '<option value="">全部班级</option>', `classes:${selectedSchool}:${includeAll}:${classes.join('|')}`);
        if (options.preservePrevious !== false && previousClass && classes.includes(previousClass)) classSelect.value = previousClass;
        else if (includeAll) classSelect.value = '';
    };

    if (role === 'class_teacher') {
        const school = user.school || MY_SCHOOL || '';
        if (school) {
            select.value = school;
            select.disabled = true;
        }
        setOptionsIfChanged(classSelect, `<option value="${user.class}">${user.class}</option>`, `class-teacher:${user.class}`);
        classSelect.value = user.class;
        classSelect.disabled = true;

        if (modeWrap) modeWrap.style.display = 'inline-flex';
        if (modeSelect && !modeSelect.value) modeSelect.value = 'class_all';
    } else if (role === 'teacher') {
        const school = user.school || MY_SCHOOL || '';
        if (school) {
            select.value = school;
            select.disabled = true;
        }
        const scope = getTeacherScopeForUser(user);
        const classes = Array.from(scope.classes).sort();
        setOptionsIfChanged(classSelect, buildClassOptions(classes, true), `teacher:${school}:${classes.join('|')}`);
        if (previousClass && classes.includes(previousClass)) classSelect.value = previousClass;
    } else if (role === 'director' || role === 'grade_director') {
        const school = PermissionPolicy.getBoundSchool(user);
        if (school) {
            select.value = school;
            select.disabled = true;
        }
        const classes = PermissionPolicy.getAccessibleClassNames(user, [...new Set((SCHOOLS[school]?.students || []).map(s => s.class))].sort(), school, { mode: 'homeroom' });
        setOptionsIfChanged(classSelect, buildClassOptions(classes, true), `director:${school}:${classes.join('|')}`);
        if (previousClass && classes.includes(previousClass)) classSelect.value = previousClass;
    } else {
        updateClassOptionsForSchool(select.value);
    }

    select.onchange = function () {
        const selectedSchool = this.value;
        classSelect.value = '';
        updateClassOptionsForSchool(selectedSchool, { preservePrevious: false });
        // ✋ 性能优化关键：切换学校时，重置分页并立即渲染
        renderStudentDetails(true);
    };

    // 🟢 新增：班级切换也触发重置
    classSelect.onchange = function () {
        renderStudentDetails(true);
    };

    if (modeSelect) {
        modeSelect.onchange = function () {
            renderStudentDetails(true);
        };
    }
}


// 全局状态管理
let STD_STATE = {
    page: 1,
    size: 40,
    sortCol: null,     // 当前排序列
    sortDir: 'desc',   // desc 或 asc
    activeFilters: {}, // 存储筛选状态: { 'school': new Set(['实验中学', '二中']), '语文': ... }
    cacheData: [],     // 最终展示的数据
    renderMeta: null,  // 当前筛选批次的表格渲染元信息
    dataSignature: '',
    filterValueCache: Object.create(null),
    lastBodySignature: '',
    lastHeaderSignature: '',
    lastScrollSignature: ''
};

function buildStudentDetailsFilterSignature() {
    return Object.entries(STD_STATE.activeFilters || {})
        .map(([key, values]) => {
            const list = values && typeof values.forEach === 'function'
                ? Array.from(values).map(value => String(value)).sort()
                : [];
            return `${key}:${list.join('|')}`;
        })
        .sort()
        .join(';');
}

function getStudentDetailsConfiguredSubjectList(list = []) {
    const configuredSubjects = Array.isArray(SUBJECTS) ? SUBJECTS.filter(Boolean) : [];
    const rows = Array.isArray(list) ? list : [];
    const detailSubjects = [...configuredSubjects];
    getConfiguredExtraDisplaySubjects(CONFIG).forEach((subject) => {
        if (!subject || detailSubjects.includes(subject)) return;
        const hasSubjectScore = rows.some((row) => Object.prototype.hasOwnProperty.call(row?.scores || {}, subject));
        if (hasSubjectScore) detailSubjects.push(subject);
    });
    return detailSubjects;
}

function buildStudentDetailsDataSignature(list = []) {
    const rows = Array.isArray(list) ? list : [];
    const detailSubjects = getStudentDetailsConfiguredSubjectList(rows);
    let totalSum = 0;
    let subjectSum = 0;
    rows.forEach((row) => {
        totalSum += Number(row?.total) || 0;
        const scores = row?.scores || {};
        detailSubjects.forEach((subject) => {
            subjectSum += Number(scores[subject]) || 0;
        });
    });
    const first = rows[0] || {};
    const last = rows[rows.length - 1] || {};
    return [
        rows.length,
        totalSum.toFixed(2),
        subjectSum.toFixed(2),
        String(first.school || ''),
        String(first.class || ''),
        String(first.name || ''),
        String(last.school || ''),
        String(last.class || ''),
        String(last.name || ''),
        STD_STATE.sortCol || '',
        STD_STATE.sortDir || '',
        buildStudentDetailsFilterSignature()
    ].join('::');
}

function setStudentDetailsHtmlIfChanged(element, html, signature) {
    if (!element) return false;
    if (element.dataset.studentDetailsRenderSig === signature && element.innerHTML === html) return false;
    element.innerHTML = html;
    element.dataset.studentDetailsRenderSig = signature;
    return true;
}

function getStudentDetailsDomCache() {
    const section = document.getElementById('student-details');
    const signature = section
        ? [
            section.isConnected ? 'connected' : 'detached',
            !!document.getElementById('studentDetailTable'),
            !!document.querySelector('#studentDetailTable thead tr'),
            !!document.querySelector('#studentDetailTable tbody')
        ].join('::')
        : 'missing';
    if (StudentDetailsPerfCache.domCache && StudentDetailsPerfCache.domSignature === signature) {
        return StudentDetailsPerfCache.domCache;
    }
    const detailTable = document.getElementById('studentDetailTable');
    StudentDetailsPerfCache.domSignature = signature;
    StudentDetailsPerfCache.domCache = {
        section,
        detailTable,
        thead: detailTable?.querySelector('thead tr') || document.querySelector('#studentDetailTable thead tr'),
        tbody: detailTable?.querySelector('tbody') || document.querySelector('#studentDetailTable tbody'),
        tableWrap: section?.querySelector('.table-wrap') || null,
        compareSection: document.getElementById('student-multi-period-compare-section')
    };
    return StudentDetailsPerfCache.domCache;
}

function getStudentDetailsPageSize() {
    const width = Number(window.innerWidth || 1280);
    if (StudentDetailsPerfCache.pageSizeWidth === width) return StudentDetailsPerfCache.pageSize;
    StudentDetailsPerfCache.pageSizeWidth = width;
    StudentDetailsPerfCache.pageSize = width <= 640 ? 12 : (width <= 1024 ? 24 : 40);
    return StudentDetailsPerfCache.pageSize;
}

function getStudentDetailsSubjectList(list = []) {
    const rows = Array.isArray(list) ? list : [];
    const configuredSubjects = getStudentDetailsConfiguredSubjectList(rows);
    const signature = [
        configuredSubjects.join('|'),
        rows.length,
        String(rows[0]?.school || ''),
        String(rows[0]?.class || ''),
        String(rows[rows.length - 1]?.school || ''),
        String(rows[rows.length - 1]?.class || '')
    ].join('::');
    if (StudentDetailsPerfCache.subjectListSignature === signature) {
        return StudentDetailsPerfCache.subjectList;
    }
    if (configuredSubjects.length) {
        StudentDetailsPerfCache.subjectListSignature = signature;
        StudentDetailsPerfCache.subjectList = configuredSubjects;
        return configuredSubjects;
    }

    const seen = new Set();
    rows.forEach(row => {
        Object.keys(row?.scores || {}).forEach(subject => {
            const normalized = normalizeSubject(subject);
            if (normalized) seen.add(normalized);
        });
    });
    const preferredOrder = ['语文', '数学', '英语', '物理', '化学', '历史', '地理', '生物', '政治'];
    const ordered = preferredOrder.filter(subject => seen.has(subject));
    Array.from(seen).forEach(subject => {
        if (!ordered.includes(subject)) ordered.push(subject);
    });
    StudentDetailsPerfCache.subjectListSignature = signature;
    StudentDetailsPerfCache.subjectList = ordered;
    return ordered;
}

function buildStudentDetailsRenderMeta(list = []) {
    const user = getCurrentUser();
    const role = user?.role || 'guest';
    const isTeacher = role === 'teacher';
    const isClassTeacher = role === 'class_teacher';
    const classTeacherMode = isClassTeacher ? getClassTeacherStudentViewMode() : 'teaching';
    const needTeacherScope = isTeacher || (isClassTeacher && classTeacherMode === 'teaching');
    const teacherScope = needTeacherScope ? getTeacherScopeForUser(user) : null;
    const listSignature = buildStudentDetailsDataSignature(list);
    const metaSignature = [
        listSignature,
        role,
        classTeacherMode,
        teacherScope ? Array.from(teacherScope.subjects || []).sort().join('|') : '',
        teacherScope ? Array.from(teacherScope.classes || []).sort().join('|') : ''
    ].join('::');
    if (StudentDetailsPerfCache.renderMetaSignature === metaSignature && StudentDetailsPerfCache.renderMeta) {
        return StudentDetailsPerfCache.renderMeta;
    }
    const subjectList = getStudentDetailsSubjectList(list);
    const visibleSubjects = (isTeacher || (isClassTeacher && classTeacherMode === 'teaching'))
        ? subjectList.filter(s => teacherScope.subjects.has(normalizeSubject(s)))
        : subjectList;
    const rankVisibility = window.RankingDataService && typeof window.RankingDataService.getStudentRankVisibility === 'function'
        ? window.RankingDataService.getStudentRankVisibility(list, visibleSubjects, { isSingleSchoolMode })
        : {
            countyRankVisible: hasStudentCountyRankData(list, visibleSubjects),
            townRankVisible: hasStudentTownshipRankData(list, visibleSubjects)
        };
    const meta = {
        role,
        isTeacher,
        isClassTeacher,
        visibleSubjects,
        countyRankVisible: rankVisibility.countyRankVisible,
        townRankVisible: rankVisibility.townRankVisible
    };
    StudentDetailsPerfCache.renderMetaSignature = metaSignature;
    StudentDetailsPerfCache.renderMeta = meta;
    return meta;
}

// 1. 主渲染函数
function getClassTeacherStudentViewMode() {
    const sel = document.getElementById('classTeacherViewMode');
    const val = sel?.value;
    return (val === 'teaching') ? 'teaching' : 'class_all';
}

function isStudentDetailsMobileCardMode() {
    if (document.body?.dataset?.mobileQuery === 'true') return true;
    return typeof window !== 'undefined'
        && typeof window.matchMedia === 'function'
        && window.matchMedia('(max-width: 768px)').matches;
}

function getStudentDetailsRankSnapshot(student, visibleSubjects, townRankVisible, countyRankVisible, dataSignature) {
    if (!student || typeof student !== 'object') return null;
    const signature = [
        dataSignature || '',
        visibleSubjects.join('|'),
        townRankVisible ? 'town' : 'no-town',
        countyRankVisible ? 'county' : 'no-county',
        getReportStudentIdentity(student)
    ].join('::');
    if (StudentDetailsPerfCache.rankSnapshotSignature !== (dataSignature || '')) {
        StudentDetailsPerfCache.rankSnapshotSignature = dataSignature || '';
        StudentDetailsPerfCache.rankSnapshotByStudent = new WeakMap();
    }
    const cached = StudentDetailsPerfCache.rankSnapshotByStudent.get(student);
    if (cached?.signature === signature) return cached;
    const showTownRankForStudent = !isCountyDirectStudentForRank(student);
    const subjects = {};
    visibleSubjects.forEach((sub) => {
        subjects[sub] = {
            score: student.scores?.[sub] !== undefined ? student.scores[sub] : '-',
            school: safeGet(student, `ranks.${sub}.school`, '-'),
            township: townRankVisible && showTownRankForStudent ? getDisplayRankValue(student, `ranks.${sub}.township`, { scope: 'township' }) : '-',
            county: countyRankVisible ? getStudentCountyRankValue(student, sub) : '-'
        };
    });
    const snapshot = {
        signature,
        showTownRankForStudent,
        subjects,
        totalClass: getDisplayRankValue(student, 'ranks.total.class', { scope: 'class' }),
        totalSchool: safeGet(student, 'ranks.total.school', '-'),
        totalTown: townRankVisible && showTownRankForStudent ? getDisplayRankValue(student, 'ranks.total.township', { scope: 'township' }) : '-',
        totalCounty: countyRankVisible ? getStudentCountyRankValue(student, 'total') : '-'
    };
    StudentDetailsPerfCache.rankSnapshotByStudent.set(student, snapshot);
    return snapshot;
}

function buildStudentDetailMobileInfoItem(label, value, accentClass = '') {
    const displayValue = value == null || value === '' ? '-' : String(value);
    return `
        <div class="student-detail-mobile-info ${accentClass}">
            <span>${tmEscapeHtml(label)}</span>
            <strong>${tmEscapeHtml(displayValue)}</strong>
        </div>
    `;
}

function getStudentCountyRankValue(student, key = 'total') {
    if (window.RankingDataService && typeof window.RankingDataService.getStudentRankValue === 'function') {
        return window.RankingDataService.getStudentRankValue(student, key, 'county');
    }
    const fallback = key === 'total' ? (student?.countyRank ?? '-') : '-';
    const value = safeGet(student, `ranks.${key}.county`, fallback);
    return value == null || value === '' ? fallback : value;
}
window.getStudentCountyRankValue = getStudentCountyRankValue;

function hasStudentClassRankScope(studentLike) {
    if (window.RankingDataService && typeof window.RankingDataService.hasStudentClassRankScope === 'function') {
        return window.RankingDataService.hasStudentClassRankScope(studentLike);
    }
    const rawClass = String(studentLike?.class ?? '').trim();
    const normalizedClass = typeof normalizeClass === 'function' ? normalizeClass(rawClass) : rawClass;
    if (!normalizedClass || normalizedClass === '-') return false;
    return !/^(?:无|未分班|无班级|暂无|undefined|null|nan)$/i.test(normalizedClass);
}
window.hasStudentClassRankScope = hasStudentClassRankScope;

function isCountyDirectStudentForRank(studentLike) {
    if (window.RankingDataService && typeof window.RankingDataService.isCountyDirectStudent === 'function') {
        return window.RankingDataService.isCountyDirectStudent(studentLike, { rows: RAW_DATA });
    }
    const schoolName = String(studentLike?.school || '').trim();
    if (!schoolName || typeof getCountyDirectSchoolNames !== 'function' || typeof getTownshipManagedSchoolNames !== 'function') return false;
    const schoolKeys = Object.keys(SCHOOLS || {});
    const candidateNames = schoolKeys.length
        ? schoolKeys.map(name => String(name || '').trim()).filter(Boolean)
        : Array.from(new Set((RAW_DATA || []).map(row => String(row?.school || '').trim()).filter(Boolean)));
    const baseKey = candidateNames.slice().sort().join('||');
    if (!window.__countyDirectRankCache || window.__countyDirectRankCache.baseKey !== baseKey) {
        const townshipNames = getTownshipManagedSchoolNames(candidateNames);
        const directNames = townshipNames.length ? getCountyDirectSchoolNames(candidateNames) : [];
        window.__countyDirectRankCache = {
            baseKey,
            townshipNames,
            directNames,
            resultBySchool: new Map()
        };
    }
    const cache = window.__countyDirectRankCache;
    if (!cache.townshipNames.length) return false;
    if (cache.resultBySchool.has(schoolName)) return cache.resultBySchool.get(schoolName);
    const isDirect = cache.directNames.some(name => (
        name === schoolName
        || (typeof areSchoolNamesEquivalent === 'function' && areSchoolNamesEquivalent(name, schoolName))
        || (typeof areSchoolNamesMatched === 'function' && areSchoolNamesMatched(name, schoolName, true))
    ));
    cache.resultBySchool.set(schoolName, isDirect);
    return isDirect;
}
window.isCountyDirectStudentForRank = isCountyDirectStudentForRank;

function getDisplayRankValue(studentLike, keyPath, options = {}) {
    if (window.RankingDataService && typeof window.RankingDataService.getStudentRankValue === 'function') {
        const match = String(keyPath || '').match(/^ranks\.([^.]+)\.([^.]+)$/);
        if (match) return window.RankingDataService.getStudentRankValue(studentLike, match[1], options.scope || match[2], { rows: RAW_DATA });
    }
    if (options.scope === 'class' && !hasStudentClassRankScope(studentLike)) return '-';
    if (options.scope === 'township' && isCountyDirectStudentForRank(studentLike)) return '-';
    const value = safeGet(studentLike, keyPath, '-');
    return value == null || value === '' ? '-' : value;
}
window.getDisplayRankValue = getDisplayRankValue;

function getCountyRankScopeForDisplay() {
    if (window.COUNTY_ANALYSIS_SCOPE && typeof window.COUNTY_ANALYSIS_SCOPE === 'object') {
        return window.COUNTY_ANALYSIS_SCOPE;
    }
    try {
        const rawMap = localStorage.getItem('COUNTY_ANALYSIS_SCOPE_V1');
        const map = rawMap ? JSON.parse(rawMap) : {};
        const examKey = String(
            window.CURRENT_EXAM_ID
            || (typeof readWorkspaceExamId === 'function' ? readWorkspaceExamId() : '')
            || window.COHORT_DB?.currentExamId
            || 'current'
        ).trim() || 'current';
        return map?.[examKey] || null;
    } catch (_) {
        return null;
    }
}
window.getCountyRankScopeForDisplay = getCountyRankScopeForDisplay;

function hasCountyRankScopeForDisplay() {
    const scope = getCountyRankScopeForDisplay();
    if (!scope || scope.includesCounty !== true) return false;
    const countyCount = Array.isArray(scope.countySchools) ? scope.countySchools.length : 0;
    const townshipCount = Array.isArray(scope.townshipSchools) ? scope.townshipSchools.length : 0;
    return countyCount > 0 || townshipCount > 0;
}
window.hasCountyRankScopeForDisplay = hasCountyRankScopeForDisplay;

function hasCountyRankValuesInData(list = RAW_DATA, subjects = SUBJECTS) {
    if (!Array.isArray(list) || list.length === 0) return false;
    return list.some((student) => {
        if (getStudentCountyRankValue(student, 'total') !== '-') return true;
        return (subjects || []).some((subject) => getStudentCountyRankValue(student, subject) !== '-');
    });
}
window.hasCountyRankValuesInData = hasCountyRankValuesInData;

function hasStudentCountyRankData(list = RAW_DATA, subjects = SUBJECTS) {
    if (window.RankingDataService && typeof window.RankingDataService.hasStudentRankData === 'function') {
        return window.RankingDataService.hasStudentRankData(list, subjects, 'county', { rows: RAW_DATA });
    }
    return hasCountyRankValuesInData(list, subjects);
}
window.hasStudentCountyRankData = hasStudentCountyRankData;

function hasStudentTownshipRankData(list = RAW_DATA, subjects = SUBJECTS) {
    if (window.RankingDataService && typeof window.RankingDataService.hasStudentRankData === 'function') {
        return !isSingleSchoolMode() && window.RankingDataService.hasStudentRankData(list, subjects, 'township', { rows: RAW_DATA });
    }
    if (!Array.isArray(list) || list.length === 0 || isSingleSchoolMode()) return false;
    return list.some((student) => {
        if (isCountyDirectStudentForRank(student)) return false;
        if (getDisplayRankValue(student, 'ranks.total.township', { scope: 'township' }) !== '-') return true;
        return (subjects || []).some((subject) => (
            getDisplayRankValue(student, `ranks.${subject}.township`, { scope: 'township' }) !== '-'
        ));
    });
}
window.hasStudentTownshipRankData = hasStudentTownshipRankData;

function buildStudentDetailMobileSubjectCard(student, sub, isTeacher, isClassTeacher, townRankVisible, countyRankVisible) {
    const score = student.scores[sub] !== undefined ? student.scores[sub] : '-';
    const townRank = getDisplayRankValue(student, `ranks.${sub}.township`, { scope: 'township' });
    const clickAttr = `onclick="updateStudentScore('${student.name}', '${student.class}', '${sub}', ${score})"`;
    const scoreButton = `
        <button type="button" class="student-detail-mobile-score-btn" ${clickAttr} title="点击修改${tmEscapeHtml(sub)}成绩">
            ${tmEscapeHtml(score)}
        </button>
    `;

    const rankChips = [];
    if (!isTeacher && !isClassTeacher) {
        rankChips.push(`<span>校 ${tmEscapeHtml(safeGet(student, `ranks.${sub}.school`, '-'))}</span>`);
        if (townRankVisible) rankChips.push(`<span>镇 ${tmEscapeHtml(townRank)}</span>`);
        if (countyRankVisible) rankChips.push(`<span>县 ${tmEscapeHtml(getStudentCountyRankValue(student, sub))}</span>`);
    } else {
        rankChips.push(`<span>级 ${tmEscapeHtml(safeGet(student, `ranks.${sub}.school`, '-'))}</span>`);
        if (townRankVisible) rankChips.push(`<span>镇 ${tmEscapeHtml(townRank)}</span>`);
        if (countyRankVisible) rankChips.push(`<span>县 ${tmEscapeHtml(getStudentCountyRankValue(student, sub))}</span>`);
    }

    return `
        <div class="student-detail-mobile-subject">
            <div class="student-detail-mobile-subject-head">
                <span>${tmEscapeHtml(sub)}</span>
                ${scoreButton}
            </div>
            <div class="student-detail-mobile-rank-row">
                ${rankChips.join('')}
            </div>
        </div>
    `;
}

function buildStudentDetailMobileRow(student, visibleSubjects, isTeacher, isClassTeacher, townRankVisible, countyRankVisible) {
    const schoolText = student.school || '-';
    const classText = student.class || '-';
    const totalText = student.total != null ? student.total : '-';
    const idText = student.id || '-';
    const examRoomText = student.examRoom || '-';
    const totalRankLabel = isTeacher || isClassTeacher ? '总分级排' : '总分校排';
    const totalRankValue = isTeacher || isClassTeacher
        ? safeGet(student, 'ranks.total.school', '-')
        : safeGet(student, 'ranks.total.school', '-');
    const totalRankClassLabel = '总分班排';
    const totalRankClassValue = getDisplayRankValue(student, 'ranks.total.class', { scope: 'class' });
    const totalRankCountyValue = getStudentCountyRankValue(student, 'total');
    const totalRankTownValue = getDisplayRankValue(student, 'ranks.total.township', { scope: 'township' });

    const subjectCards = visibleSubjects.map((sub) => (
        buildStudentDetailMobileSubjectCard(student, sub, isTeacher, isClassTeacher, townRankVisible, countyRankVisible)
    )).join('');

    const metaCards = [
        buildStudentDetailMobileInfoItem('学校', schoolText),
        buildStudentDetailMobileInfoItem('考号', idText),
        buildStudentDetailMobileInfoItem('考场', examRoomText)
    ].join('');

    const rankCards = [
        buildStudentDetailMobileInfoItem(totalRankClassLabel, totalRankClassValue),
        buildStudentDetailMobileInfoItem(totalRankLabel, totalRankValue),
        townRankVisible ? buildStudentDetailMobileInfoItem('总分镇排', totalRankTownValue) : '',
        countyRankVisible ? buildStudentDetailMobileInfoItem('总分县排', totalRankCountyValue) : ''
    ].join('');

    return `
        <tr class="student-detail-mobile-row">
            <td colspan="100" class="student-detail-mobile-cell">
                <article class="student-detail-mobile-card">
                    <div class="student-detail-mobile-head">
                        <div>
                            <a href="javascript:void(0)" class="student-detail-mobile-name" onclick="jumpToStudent(${jsStringLiteral(student.name)}, ${jsStringLiteral(student.school)}, ${jsStringLiteral(student.class)})">${tmEscapeHtml(student.name || '-')}</a>
                            <div class="student-detail-mobile-submeta">${tmEscapeHtml(`${schoolText} · ${classText}`)}</div>
                        </div>
                        <div class="student-detail-mobile-score-summary">
                            <span>总分</span>
                            <strong>${tmEscapeHtml(totalText)}</strong>
                        </div>
                    </div>
                    <div class="student-detail-mobile-meta-grid">
                        ${metaCards}
                    </div>
                    <div class="student-detail-mobile-rank-grid">
                        ${rankCards}
                    </div>
                    <div class="student-detail-mobile-subject-grid">
                        ${subjectCards}
                    </div>
                </article>
            </td>
        </tr>
    `;
}

function shouldAutoFocusStudentDetailsDataOnMobile(reset) {
    if (!reset) return false;
    return document.body?.dataset?.mobileQuery === 'true' || window.innerWidth <= 768;
}

let __studentDetailsPrimaryFocusTimer = 0;
const STUDENT_DETAILS_PRIMARY_FOCUS_DELAYS = [0, 120, 320, 760, 1280];

function focusStudentDetailsPrimaryFlow() {
    const section = document.getElementById('student-details');
    const firstCard = section?.querySelector('.student-detail-mobile-card');
    const primaryFlow = section?.querySelector('.student-details-primary-flow');
    const tableWrap = section?.querySelector('.table-wrap');
    const target = firstCard || primaryFlow || tableWrap || section;
    if (!target) return false;

    const appMain = document.querySelector('main.app-main');
    const mainCanScroll = appMain
        && typeof appMain.scrollTo === 'function'
        && (appMain.scrollHeight - appMain.clientHeight) > 24;
    if (mainCanScroll) {
        const nextTop = appMain.scrollTop + target.getBoundingClientRect().top - appMain.getBoundingClientRect().top - 16;
        appMain.scrollTo({ top: Math.max(0, nextTop), behavior: 'auto' });
        return true;
    }

    const scrollingEl = document.scrollingElement || document.documentElement || document.body;
    if (scrollingEl && typeof scrollingEl.scrollTo === 'function') {
        const currentTop = window.scrollY || scrollingEl.scrollTop || document.documentElement.scrollTop || document.body.scrollTop || 0;
        const nextTop = currentTop + target.getBoundingClientRect().top - 16;
        scrollingEl.scrollTo({ top: Math.max(0, nextTop), behavior: 'auto' });
        return true;
    }

    if (typeof target.scrollIntoView === 'function') {
        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        return true;
    }
    return false;
}

function requestStudentDetailsPrimaryFocus(startIndex = 0) {
    if (!(document.body?.dataset?.mobileQuery === 'true' || window.innerWidth <= 768)) return;
    clearTimeout(__studentDetailsPrimaryFocusTimer);
    const initialIndex = Math.max(0, Math.min(Number(startIndex) || 0, STUDENT_DETAILS_PRIMARY_FOCUS_DELAYS.length - 1));
    const runFocus = (index) => {
        const section = document.getElementById('student-details');
        if (!section || !section.classList.contains('active')) return;
        const target = section.querySelector('.student-detail-mobile-card')
            || section.querySelector('.student-details-primary-flow')
            || section.querySelector('.table-wrap')
            || section;
        const appMain = document.querySelector('main.app-main');
        const didScroll = focusStudentDetailsPrimaryFlow();
        const targetTop = target?.getBoundingClientRect?.().top ?? 0;
        const appTop = appMain?.getBoundingClientRect?.().top ?? 0;
        const aligned = !!target && Math.abs(targetTop - appTop) <= 96;
        if ((didScroll && aligned) || index >= (STUDENT_DETAILS_PRIMARY_FOCUS_DELAYS.length - 1)) return;
        const nextIndex = index + 1;
        __studentDetailsPrimaryFocusTimer = window.setTimeout(() => runFocus(nextIndex), STUDENT_DETAILS_PRIMARY_FOCUS_DELAYS[nextIndex]);
    };
    __studentDetailsPrimaryFocusTimer = window.setTimeout(() => runFocus(initialIndex), STUDENT_DETAILS_PRIMARY_FOCUS_DELAYS[initialIndex]);
}
window.requestStudentDetailsPrimaryFocus = requestStudentDetailsPrimaryFocus;

function renderStudentReportSkeleton(container, student) {
    if (!container) return;
    container.innerHTML = `
        <div class="student-report-wide-card student-report-loading">
            <div class="report-wide-header">
                <div>
                    <h2>${student?.school || '学生'} 学业发展报告</h2>
                    <p>${student?.name || '正在生成'} · ${student?.class || ''}</p>
                </div>
                <span class="pill">生成中</span>
            </div>
            <div class="report-wide-grid">
                <div class="report-metric-card shimmer"></div>
                <div class="report-metric-card shimmer"></div>
                <div class="report-metric-card shimmer"></div>
                <div class="report-metric-card shimmer"></div>
            </div>
            <div class="report-wide-grid report-wide-grid--two">
                <div class="report-panel shimmer"></div>
                <div class="report-panel shimmer"></div>
            </div>
        </div>
    `;
}

function scheduleStudentReportCharts(student, history) {
    const chartKey = buildStudentReportCacheKey(student, 'CHARTS');
    const scheduleKey = `${chartKey}::${Array.isArray(history) ? history.length : 0}`;
    if (ReportHistoryPerfCache.lastChartScheduleKey === scheduleKey) return;
    ReportHistoryPerfCache.lastChartScheduleKey = scheduleKey;
    const { container } = getReportDomCache();
    if (container?.dataset.reportChartCacheKey === chartKey) return;
    const render = () => {
        const currentContainer = document.getElementById('report-card-capture-area');
        if (currentContainer?.dataset.reportChartCacheKey === chartKey) return;
        try { if (typeof renderRadarChart === 'function') renderRadarChart(student, history); } catch (e) { console.error(e); }
        try { if (typeof renderVarianceChart === 'function') renderVarianceChart(student, history); } catch (e) { console.error(e); }
        if (currentContainer) currentContainer.dataset.reportChartCacheKey = chartKey;
    };
    if (typeof window.requestIdleCallback === 'function') {
        window.requestIdleCallback(render, { timeout: 1200 });
    } else {
        setTimeout(render, 160);
    }
}

function renderStudentDetails(reset = true) {
    // 隐藏可能存在的筛选菜单
    closeAllMenus();

    if (reset) {
        STD_STATE.page = 1;
        STD_STATE.size = getStudentDetailsPageSize();
        const selectedSchool = document.getElementById('studentSchoolSelect')?.value;
        const selectedClass = document.getElementById('studentClassSelect')?.value;
        const hasSelectedSchool = selectedSchool && !selectedSchool.includes('请选择');
        const hasSelectedClass = selectedClass && selectedClass !== '全部';
        let data = window.RankingDataService && typeof window.RankingDataService.getRowsBySchoolClass === 'function'
            ? window.RankingDataService.getRowsBySchoolClass(RAW_DATA, hasSelectedSchool ? selectedSchool : '', hasSelectedClass ? selectedClass : '')
            : [...RAW_DATA];

        const user = getCurrentUser();
        const role = user?.role || 'guest';
        const classTeacherMode = role === 'class_teacher' ? getClassTeacherStudentViewMode() : 'teaching';
        const queryMode = role === 'class_teacher' ? (classTeacherMode === 'class_all' ? 'homeroom' : 'teaching') : 'teaching';
        const activeFilterSignature = buildStudentDetailsFilterSignature();
        const querySignature = [
            Array.isArray(RAW_DATA) ? RAW_DATA.length : 0,
            String(window.__RAW_DATA_VERSION || 0),
            String(window.CURRENT_EXAM_ID || ''),
            String(RAW_DATA?.[0]?.name || ''),
            String(RAW_DATA?.[RAW_DATA.length - 1]?.name || ''),
            String(selectedSchool || ''),
            String(selectedClass || ''),
            hasSelectedSchool ? 'school' : 'all-school',
            hasSelectedClass ? 'class' : 'all-class',
            String(role || ''),
            String(user?.school || ''),
            String(user?.class || ''),
            String(user?.name || ''),
            classTeacherMode,
            queryMode,
            STD_STATE.sortCol || '',
            STD_STATE.sortDir || '',
            activeFilterSignature,
            Object.keys(SCHOOLS || {}).length
        ].join('::');
        if (StudentDetailsPerfCache.querySignature === querySignature && Array.isArray(StudentDetailsPerfCache.queryData)) {
            STD_STATE.cacheData = StudentDetailsPerfCache.queryData;
            STD_STATE.renderMeta = StudentDetailsPerfCache.queryMeta || buildStudentDetailsRenderMeta(STD_STATE.cacheData);
            STD_STATE.dataSignature = buildStudentDetailsDataSignature(STD_STATE.cacheData);
            STD_STATE.filterValueCache = Object.create(null);
        } else {
        data = PermissionPolicy.filterStudentRows(user, data, { mode: queryMode });
        appDebug('[考试明细] 当前用户:', user);

        // --- A. 权限过滤 ---
        // 🆕 使用多角色系统进行权限控制
        if (false && user && RoleManager.hasAnyRole(user, ['teacher', 'class_teacher']) &&
            !RoleManager.hasAnyRole(user, ['admin', 'director', 'grade_director'])) {
            // 纯教师或班主任角色：只能看自己任教的班级
            appDebug('[考试明细] 🔒 检测到教师角色，启用权限过滤');
            const scope = getTeacherScopeForUser(user);

            // 班主任“本班全科”模式：按本班过滤，不受任教学科限制
            if (role === 'class_teacher' && classTeacherMode === 'class_all') {
                const myClass = normalizeClass(user?.class || '');
                if (!myClass) {
                    data = [];
                    UI.toast('⚠️ 班主任账号未配置班级，无法显示本班数据。', 'warning');
                } else {
                    const before = data.length;
                    data = data.filter(s => normalizeClass(s.class) === myClass);
                    appDebug(`[考试明细] 班主任本班全科模式：过滤前${before}人，过滤后${data.length}人，班级=${myClass}`);
                }
            } else if (scope.classes.size > 0) {
                const originalCount = data.length;

                if (data.length > 0) {
                    appDebug(`[考试明细] 数据样本班级: ${data[0].class} (规范化: ${normalizeClass(data[0].class)})`);
                }
                appDebug(`[考试明细] 权限班级:`, Array.from(scope.classes));

                data = data.filter(s => {
                    const rawClass = String(s.class || '').trim();
                    const normalizedClass = normalizeClass(s.class);

                    // 宽容匹配策略
                    let hasPermission = scope.classes.has(normalizedClass);
                    if (!hasPermission) hasPermission = scope.classes.has(rawClass);
                    if (!hasPermission) {
                        // 尝试模糊匹配，如 "701" 和 "7.01"
                        for (const allowedCls of scope.classes) {
                            // 移除所有点和空格再比较
                            if (String(allowedCls).replace(/[\s\.]/g, '') === String(rawClass).replace(/[\s\.]/g, '')) {
                                hasPermission = true;
                                break;
                            }
                        }
                    }

                    if (!hasPermission && Math.random() < 0.001) { // 抽样打印被过滤的
                        appDebug(`[考试明细] ❌ 过滤: ${s.class} -> ${normalizedClass}`);
                    }
                    return hasPermission;
                });
                appDebug(`[考试明细] 🔐 权限筛选：过滤前${originalCount}人，过滤后${data.length}人`);

                if (data.length === 0) {
                    console.warn('[考试明细] ⚠️ 过滤后无数据');
                    const userClasses = Array.from(scope.classes).join(', ');
                    UI.toast(`⚠️ 暂无考试数据。您的任教班级：${userClasses}`, 'warning');
                }
            } else {
                console.warn('[考试明细] ⚠️ 未找到任课信息，显示空数据');
                data = []; // 没有任课信息则不显示任何数据
                UI.toast('⚠️ 未找到您的任课信息，无法显示数据。请在“数据管理-教师任课”中检查配置。', 'warning');
            }
        } else if (false && user) {
            // 其他角色的权限控制
            if (!RoleManager.hasAnyRole(user, ['admin', 'director'])) {
                // 🟢 [Bug #1 修复] 级部主任：按年级过滤，只能看到自己级部的数据
                if (RoleManager.hasAnyRole(user, ['grade_director']) && user.class) {
                    const gradePrefix = String(user.class).trim();
                    const beforeCount = data.length;
                    data = data.filter(s => {
                        const cls = String(s.class || '').trim();
                        // 班级号以年级号开头（例如年级"7" → 班级"701","702"等）
                        return cls.startsWith(gradePrefix);
                    });
                    appDebug(`[考试明细] 🔒 级部主任过滤: 年级=${gradePrefix}, 过滤前${beforeCount}人, 过滤后${data.length}人`);
                    if (data.length === 0) {
                        UI.toast(`⚠️ 未找到${gradePrefix}年级的考试数据`, 'warning');
                    }
                }
                // 非管理员、非教务主任、非级部主任的其他角色：按学校过滤
                else if (user.school) {
                    data = data.filter(s => sameAppSchoolName(s.school, user.school));
                    appDebug(`[考试明细] 按学校过滤: ${user.school}`);
                }
            }
            appDebug('[考试明细] 其他角色或管理员，显示所有/学校范围数据');
        }

        // --- B. 顶部下拉框过滤 (依然保留，作为一级筛选) ---
        // 下拉框筛选逻辑（在权限筛选的基础上二次筛选）
        if (hasSelectedSchool && !(window.RankingDataService && typeof window.RankingDataService.getRowsBySchoolClass === 'function')) {
            data = data.filter(s => sameAppSchoolName(s.school, selectedSchool));
            if (hasSelectedClass) {
                // 如果是教师，需要确保选中的班级在权限范围内（虽然下拉框可能已经限制了）
                data = data.filter(s => normalizeClass(s.class) === normalizeClass(selectedClass));
            }
        }

        const hasExcelFilters = Object.values(STD_STATE.activeFilters || {}).some(values => values && values.size > 0);
        const canUseAllRowsFallback = ['admin', 'director', 'grade_director'].includes(role);
        if (!data.length && canUseAllRowsFallback && !hasExcelFilters && !hasSelectedSchool && Array.isArray(RAW_DATA) && RAW_DATA.length) {
            data = [...RAW_DATA];
            appDebug('[考试明细] 检测到空首屏，已回落到当前成绩库数据');
        }

        // --- C. Excel 列筛选 (核心逻辑) ---
        // 遍历所有已激活的筛选器
        Object.keys(STD_STATE.activeFilters).forEach(colKey => {
            const allowedValues = STD_STATE.activeFilters[colKey]; // Set 对象
            if (!allowedValues || allowedValues.size === 0) return;

            data = data.filter(s => {
                let val = getCellValue(s, colKey);
                // 将值统一转为字符串进行比对
                return allowedValues.has(String(val));
            });
        });

        // --- D. 排序 ---
        if (STD_STATE.sortCol) {
            const key = STD_STATE.sortCol;
            const dir = STD_STATE.sortDir === 'asc' ? 1 : -1;

            data.sort((a, b) => {
                let valA = getCellValue(a, key);
                let valB = getCellValue(b, key);

                // 处理空值
                if (valA === '-' || valA === undefined) valA = -9999;
                if (valB === '-' || valB === undefined) valB = -9999;

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return (valA - valB) * dir;
                }
                return String(valA).localeCompare(String(valB), 'zh-CN', { numeric: true }) * dir;
            });
        } else {
            // 默认按总分降序
            data.sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
        }

        STD_STATE.cacheData = data;
        STD_STATE.renderMeta = buildStudentDetailsRenderMeta(data);
        STD_STATE.dataSignature = buildStudentDetailsDataSignature(data);
        STD_STATE.filterValueCache = Object.create(null);
        StudentDetailsPerfCache.querySignature = querySignature;
        StudentDetailsPerfCache.queryData = data;
        StudentDetailsPerfCache.queryMeta = STD_STATE.renderMeta;
        }
    }

    // --- E. 分页与渲染 ---
    const totalItems = STD_STATE.cacheData.length;
    STD_STATE.size = getStudentDetailsPageSize();
    const totalPages = Math.ceil(totalItems / STD_STATE.size) || 1;
    if (STD_STATE.page > totalPages) STD_STATE.page = totalPages;
    if (STD_STATE.page < 1) STD_STATE.page = 1;

    const startIdx = (STD_STATE.page - 1) * STD_STATE.size;
    const endIdx = startIdx + STD_STATE.size;
    const displaySourceList = STD_STATE.cacheData.slice(startIdx, endIdx);
    const comparisonContext = getCachedComparisonStudentRankContext(RAW_DATA);
    const displayList = displaySourceList.map((student) => getComparisonStudentView(student, RAW_DATA, comparisonContext));

    const dom = getStudentDetailsDomCache();
    const thead = dom.thead;
    const tbody = dom.tbody;
    const detailTable = dom.detailTable;
    const isMobileStudentDetails = isStudentDetailsMobileCardMode();
    const shouldAutoFocusData = shouldAutoFocusStudentDetailsDataOnMobile(reset);
    if (detailTable) {
        detailTable.classList.toggle('student-detail-mobile-table', isMobileStudentDetails);
        if (isMobileStudentDetails) {
            detailTable.classList.remove('mobile-card-table');
        }
    }

    const renderMeta = STD_STATE.renderMeta || buildStudentDetailsRenderMeta(STD_STATE.cacheData);
    STD_STATE.renderMeta = renderMeta;
    const isTeacher = renderMeta.isTeacher;
    const isClassTeacher = renderMeta.isClassTeacher;
    const visibleSubjects = renderMeta.visibleSubjects;
    const countyRankVisible = renderMeta.countyRankVisible;
    const townRankVisible = renderMeta.townRankVisible;

    // 生成表头 (带漏斗图标)
    let headerHTML = '';

    // 辅助：生成表头单元格
    const buildTh = (label, colKey, width = 'auto') => {
        // 判断该列是否有激活的筛选
        const isFiltered = STD_STATE.activeFilters[colKey] && STD_STATE.activeFilters[colKey].size > 0;
        // 判断该列是否正在排序
        const isSorted = STD_STATE.sortCol === colKey;
        const sortIcon = isSorted ? (STD_STATE.sortDir === 'asc' ? '↑' : '↓') : '';

        const activeClass = (isFiltered || isSorted) ? 'active' : '';

        return `
                <th style="min-width:${width}">
                    <div class="excel-header" onclick="toggleExcelMenu('${colKey}', event)">
                        <div class="header-text">${label} <span style="color:#2563eb">${sortIcon}</span></div>
                        <div class="filter-icon-btn ${activeClass}">
                            <i class="ti ti-filter"></i>
                        </div>
                        <!-- 下拉菜单容器，点击时动态填充 -->
                        <div id="menu-${colKey}" class="excel-filter-menu" onclick="event.stopPropagation()"></div>
                    </div>
                </th>
            `;
    };

    headerHTML += buildTh('学校', 'school', '120px');
    headerHTML += buildTh('班级', 'class', '80px');
    headerHTML += buildTh('姓名', 'name', '100px');
    if (!isTeacher && !isClassTeacher) {
        headerHTML += buildTh('考号', 'id', '100px');
        headerHTML += buildTh('考场', 'examRoom', '80px');
    }

    // 动态判断当前数据是否只有一所学校
    const isSingleSchool = isSingleSchoolMode();
    const townHeaderStyle = townRankVisible ? '' : 'display:none;'; // 没有全镇成绩时隐藏列
    const countyHeaderStyle = countyRankVisible ? '' : 'display:none;'; // 没有全县成绩时隐藏列

    visibleSubjects.forEach(sub => {
        headerHTML += buildTh(sub, sub, '80px');
        if (!isTeacher && !isClassTeacher) {
            headerHTML += `<th>校排</th><th style="${townHeaderStyle}">镇排</th><th style="${countyHeaderStyle}">县排</th>`;
        } else {
            // 科任教师/班主任：展示分数 + 级部排 + 镇排 + 县排
            headerHTML += `<th>级排</th><th style="${townHeaderStyle}">镇排</th><th style="${countyHeaderStyle}">县排</th>`;
        }
    });

    const totalLabel = CONFIG.name === '9年级' ? '五科总分' : '总分';
    if (!isTeacher && !isClassTeacher) {
        headerHTML += buildTh(totalLabel, 'total', '80px');
        headerHTML += `<th>班排</th><th>校排</th><th style="${townHeaderStyle}">镇排</th><th style="${countyHeaderStyle}">县排</th>`;
    } else {
        // 科任教师/班主任：显示总分及排名（便于诊断学生整体位置）
        headerHTML += buildTh(totalLabel, 'total', '80px');
        headerHTML += `<th>班排</th><th>级排</th><th style="${townHeaderStyle}">镇排</th><th style="${countyHeaderStyle}">县排</th>`;
    }

    const headerSignature = [
        STD_STATE.dataSignature,
        isTeacher ? 'teacher' : 'staff',
        isClassTeacher ? 'class-teacher' : 'regular',
        visibleSubjects.join('|'),
        townRankVisible ? 'town' : 'no-town',
        countyRankVisible ? 'county' : 'no-county',
        STD_STATE.sortCol || '',
        STD_STATE.sortDir || '',
        buildStudentDetailsFilterSignature()
    ].join('::');
    setStudentDetailsHtmlIfChanged(thead, headerHTML, headerSignature);
    StudentDetailsPerfCache.headerHtmlSignature = headerSignature;
    StudentDetailsPerfCache.headerHtml = headerHTML;

    const bodySignature = [
        STD_STATE.dataSignature,
        STD_STATE.page,
        STD_STATE.size,
        isMobileStudentDetails ? 'mobile' : 'desktop',
        visibleSubjects.join('|'),
        townRankVisible ? 'town' : 'no-town',
        countyRankVisible ? 'county' : 'no-county'
    ].join('::');
    let bodyHTML = StudentDetailsPerfCache.bodyHtmlSignature === bodySignature
        ? StudentDetailsPerfCache.bodyHtml
        : '';
    // 生成数据行
    let rowsHTML = '';
    if (!bodyHTML) {
    const rowsSignature = `${bodySignature}::${startIdx}::${endIdx}`;
    const cachedRowsHtml = isMobileStudentDetails
        ? (StudentDetailsPerfCache.mobileRowsSignature === rowsSignature ? StudentDetailsPerfCache.mobileRowsHtml : '')
        : (StudentDetailsPerfCache.desktopRowsSignature === rowsSignature ? StudentDetailsPerfCache.desktopRowsHtml : '');
    if (cachedRowsHtml) {
        rowsHTML = cachedRowsHtml;
    } else if (isMobileStudentDetails) {
        rowsHTML = displayList.map(student => (
            buildStudentDetailMobileRow(student, visibleSubjects, isTeacher, isClassTeacher, townRankVisible, countyRankVisible)
        )).join('');
        StudentDetailsPerfCache.mobileRowsSignature = rowsSignature;
        StudentDetailsPerfCache.mobileRowsHtml = rowsHTML;
    } else {
        rowsHTML = displayList.map(student => {
            const nameLink = `<a href="javascript:void(0)" onclick="jumpToStudent(${jsStringLiteral(student.name)}, ${jsStringLiteral(student.school)}, ${jsStringLiteral(student.class)})" style="color:var(--primary); font-weight:800;">${student.name}</a>`;
            const rank = getStudentDetailsRankSnapshot(student, visibleSubjects, townRankVisible, countyRankVisible, STD_STATE.dataSignature);

            let row = `<tr>
                    <td data-label="学校">${student.school}</td>
                    <td data-label="班级">${student.class}</td>
                    <td data-label="姓名">${nameLink}</td>
                    ${!isTeacher && !isClassTeacher ? `<td data-label="考号">${student.id}</td><td data-label="考场">${student.examRoom || '-'}</td>` : ''}`;

            visibleSubjects.forEach(sub => {
                const rankItem = rank?.subjects?.[sub] || {};
                const score = rankItem.score !== undefined ? rankItem.score : '-';

                const clickAttr = `onclick="updateStudentScore('${student.name}', '${student.class}', '${sub}', ${score})"`;

                if (!isTeacher && !isClassTeacher) {
                    row += `<td data-label="${sub}分数" ${clickAttr} style="cursor:pointer;" title="点击修改">${score}</td>
                                <td data-label="${sub}校排" class="text-gray">${rankItem.school ?? '-'}</td>
                                <td data-label="${sub}镇排" class="text-gray" style="${townHeaderStyle}">${rankItem.township ?? '-'}</td>
                                <td data-label="${sub}县排" class="text-gray" style="${countyHeaderStyle}">${rankItem.county ?? '-'}</td>`;
                } else {
                    row += `<td data-label="${sub}分数" ${clickAttr} style="cursor:pointer;" title="点击修改">${score}</td>
                                <td data-label="${sub}级排" class="text-gray">${rankItem.school ?? '-'}</td>
                                <td data-label="${sub}镇排" class="text-gray" style="${townHeaderStyle}">${rankItem.township ?? '-'}</td>
                                <td data-label="${sub}县排" class="text-gray" style="${countyHeaderStyle}">${rankItem.county ?? '-'}</td>`;
                }
            });

            if (!isTeacher && !isClassTeacher) {
                row += `<td data-label="总分" style="color:#2563eb; font-weight:bold;">${student.total}</td>
                            <td data-label="总分班排">${rank?.totalClass ?? '-'}</td>
                            <td data-label="总分校排">${rank?.totalSchool ?? '-'}</td>
                            <td data-label="总分镇排" style="${townHeaderStyle}">${rank?.totalTown ?? '-'}</td>
                            <td data-label="总分县排" style="${countyHeaderStyle}">${rank?.totalCounty ?? '-'}</td>
                        </tr>`;
            } else {
                row += `<td data-label="总分" style="color:#2563eb; font-weight:bold;">${student.total}</td>
                        <td data-label="总分班排">${rank?.totalClass ?? '-'}</td>
                        <td data-label="总分级排">${rank?.totalSchool ?? '-'}</td>
                        <td data-label="总分镇排" style="${townHeaderStyle}">${rank?.totalTown ?? '-'}</td>
                        <td data-label="总分县排" style="${countyHeaderStyle}">${rank?.totalCounty ?? '-'}</td>
                    </tr>`;
            }
            return row;
        }).join('');
        StudentDetailsPerfCache.desktopRowsSignature = rowsSignature;
        StudentDetailsPerfCache.desktopRowsHtml = rowsHTML;
    }

    // 分页条
    const paginationSignature = `${bodySignature}::${totalItems}::${totalPages}::${STD_STATE.page}`;
    let paginationHTML = StudentDetailsPerfCache.paginationSignature === paginationSignature
        ? StudentDetailsPerfCache.paginationHtml
        : '';
    if (!paginationHTML) {
        paginationHTML = isMobileStudentDetails
            ? `
            <tr class="student-detail-mobile-pagination">
                <td colspan="100" class="student-detail-mobile-pagination-cell">
                    <div class="student-detail-mobile-pagination-bar">
                        <span>共 ${totalItems} 条 · ${STD_STATE.page}/${totalPages} 页</span>
                        <div class="student-detail-mobile-pagination-actions">
                            <button class="btn btn-sm" onclick="changeStdPage(-1)" ${STD_STATE.page === 1 ? 'disabled' : ''}>◀ 上一页</button>
                            <button class="btn btn-sm" onclick="changeStdPage(1)" ${STD_STATE.page === totalPages ? 'disabled' : ''}>下一页 ▶</button>
                        </div>
                    </div>
                </td>
            </tr>`
        : `
            <tr style="background:#f8fafc; font-weight:bold; position:sticky; bottom:0; z-index:150; border-top:2px solid #cbd5e1;">
                <td colspan="100" style="text-align:center; padding:8px;">
                    <div style="display:flex; align-items:center; justify-content:center; gap:15px;">
                        <span style="font-size:12px; color:#666;">共 ${totalItems} 条 · ${STD_STATE.page}/${totalPages} 页</span>
                        <button class="btn btn-sm" onclick="changeStdPage(-1)" ${STD_STATE.page === 1 ? 'disabled' : ''}>◀</button>
                        <button class="btn btn-sm" onclick="changeStdPage(1)" ${STD_STATE.page === totalPages ? 'disabled' : ''}>▶</button>
                    </div>
                </td>
            </tr>`;
        StudentDetailsPerfCache.paginationSignature = paginationSignature;
        StudentDetailsPerfCache.paginationHtml = paginationHTML;
    }

    bodyHTML = totalItems === 0
        ? `<tr><td colspan="100" style="text-align:center; padding:30px; color:#999;">无数据</td></tr>`
        : rowsHTML + paginationHTML;
    StudentDetailsPerfCache.bodyHtmlSignature = bodySignature;
    StudentDetailsPerfCache.bodyHtml = bodyHTML;
    }
    const bodyChanged = setStudentDetailsHtmlIfChanged(tbody, bodyHTML, bodySignature);

    // 隐藏可能存在的对比区域
    const compareSection = dom.compareSection;
    if (compareSection && compareSection.style.display !== 'none') compareSection.style.display = 'none';

    // 滚动到学生明细区域
    const scrollSignature = `${bodySignature}::${reset ? 'reset' : 'page'}`;
    if (bodyChanged || STD_STATE.lastScrollSignature !== scrollSignature) {
        STD_STATE.lastScrollSignature = scrollSignature;
        setTimeout(() => {
            const tableWrap = getStudentDetailsDomCache().tableWrap;
            const isMobileViewport = document.body?.dataset?.mobileQuery === 'true' || window.innerWidth <= 768;
            if (isMobileViewport) {
                if (shouldAutoFocusData) {
                    requestStudentDetailsPrimaryFocus();
                }
                return;
            }
            if (tableWrap) {
                tableWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    }
}

// 辅助：获取单元格值
function getCellValue(student, colKey) {
    if (StudentDetailsPerfCache.cellValueSignature !== STD_STATE.dataSignature) {
        StudentDetailsPerfCache.cellValueSignature = STD_STATE.dataSignature;
        StudentDetailsPerfCache.cellValueByStudent = new WeakMap();
    }
    if (student && typeof student === 'object') {
        let cached = StudentDetailsPerfCache.cellValueByStudent.get(student);
        if (!cached) {
            cached = Object.create(null);
            StudentDetailsPerfCache.cellValueByStudent.set(student, cached);
        } else if (Object.prototype.hasOwnProperty.call(cached, colKey)) {
            return cached[colKey];
        }
        let value;
        if (colKey === 'total') value = Number.isFinite(Number(student.total)) ? student.total : getComparisonStudentView(student, RAW_DATA)?.total;
        else if (colKey === 'totalTScore') value = student.totalTScore;
        else if (['school', 'class', 'name', 'id', 'examRoom'].includes(colKey)) value = student[colKey];
        else value = student.scores?.[colKey] !== undefined ? student.scores[colKey] : '-';
        cached[colKey] = value;
        return value;
    }
    if (colKey === 'totalTScore') return student.totalTScore;
    if (['school', 'class', 'name', 'id', 'examRoom'].includes(colKey)) return student[colKey];
    return student.scores[colKey] !== undefined ? student.scores[colKey] : '-';
}

// 2. 切换显示 Excel 菜单
function toggleExcelMenu(colKey, event) {
    // 阻止冒泡
    event.stopPropagation();

    const menuId = `menu-${colKey}`;
    const menu = document.getElementById(menuId);

    // 如果该菜单已打开，则关闭
    if (menu.classList.contains('show')) {
        menu.classList.remove('show');
        if (StudentDetailsPerfCache.openFilterMenu === menu) StudentDetailsPerfCache.openFilterMenu = null;
        return;
    }

    // 关闭其他所有菜单
    closeAllMenus();

    // 填充菜单内容
    buildFilterMenuContent(colKey, menu);

    // 显示
    menu.classList.add('show');
    StudentDetailsPerfCache.openFilterMenu = menu;
}

// 3. 构建菜单内容 (核心：提取唯一值)
function buildFilterMenuContent(colKey, container) {
    const cacheKey = `${STD_STATE.dataSignature || buildStudentDetailsDataSignature(STD_STATE.cacheData)}::${colKey}`;
    let sortedValues = STD_STATE.filterValueCache[cacheKey];
    if (!sortedValues) {
        // 简单策略：从当前显示的 cacheData 中提取唯一值
        const uniqueValues = new Set();
        STD_STATE.cacheData.forEach(s => {
            let val = getCellValue(s, colKey);
            uniqueValues.add(String(val));
        });

        // 转为数组并排序
        sortedValues = Array.from(uniqueValues).sort((a, b) => {
            const numA = parseFloat(a);
            const numB = parseFloat(b);
            if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
            return a.localeCompare(b, 'zh-CN', { numeric: true });
        });
        STD_STATE.filterValueCache[cacheKey] = sortedValues;
    }

    // 检查哪些被选中了
    const currentSet = STD_STATE.activeFilters[colKey];
    const isAllChecked = !currentSet;
    const menuSignature = `${cacheKey}::${isAllChecked ? 'all' : Array.from(currentSet || []).sort().join('|')}`;
    if (container?.dataset.studentDetailsFilterMenuSig === menuSignature) return;

    let listHtml = '';
    sortedValues.forEach(v => {
        const checked = isAllChecked || currentSet.has(v) ? 'checked' : '';
        listHtml += `
                <label class="menu-item">
                    <input type="checkbox" value="${v}" ${checked} class="filter-cb-${colKey}"> ${v}
                </label>`;
    });

    container.innerHTML = `
            <div class="menu-actions">
                <button class="btn btn-sm btn-gray" style="width:100%" onclick="applySort('${colKey}', 'asc')">⬆️ 升序排列</button>
                <button class="btn btn-sm btn-gray" style="width:100%" onclick="applySort('${colKey}', 'desc')">⬇️ 降序排列</button>
                <input type="text" class="menu-search" placeholder="搜索..." oninput="filterCheckboxList(this)">
            </div>
            <div class="menu-list">
                <label class="menu-item" style="font-weight:bold; border-bottom:1px solid #eee;">
                    <input type="checkbox" id="cb-all-${colKey}" ${isAllChecked ? 'checked' : ''} onchange="toggleAllCheckboxes('${colKey}', this)"> (全选)
                </label>
                ${listHtml}
            </div>
            <div class="menu-footer">
                <button class="btn btn-sm btn-primary" onclick="confirmFilter('${colKey}')">确定</button>
                <button class="btn btn-sm btn-gray" onclick="clearFilter('${colKey}')">重置</button>
            </div>
        `;
    container.dataset.studentDetailsFilterMenuSig = menuSignature;
}

// 4. 菜单内部交互函数
window.applySort = function (colKey, dir) {
    STD_STATE.sortCol = colKey;
    STD_STATE.sortDir = dir;
    renderStudentDetails(true); // 重绘
};

window.filterCheckboxList = function (input) {
    const text = input.value.toLowerCase();
    if (StudentDetailsPerfCache.filterSearchCache.get(input) === text) return;
    StudentDetailsPerfCache.filterSearchCache.set(input, text);
    const list = input.closest('.menu-actions').nextElementSibling;
    const items = list.querySelectorAll('.menu-item');
    // 跳过第一个(全选)
    for (let i = 1; i < items.length; i++) {
        const itemText = items[i].innerText.toLowerCase();
        items[i].style.display = itemText.includes(text) ? 'flex' : 'none';
    }
};

window.toggleAllCheckboxes = function (colKey, source) {
    const cbs = document.querySelectorAll(`.filter-cb-${colKey}`);
    cbs.forEach(cb => {
        if (cb.parentElement.style.display !== 'none') {
            cb.checked = source.checked;
        }
    });
};

window.confirmFilter = function (colKey) {
    const cbs = document.querySelectorAll(`.filter-cb-${colKey}:checked`);
    const allCbs = document.querySelectorAll(`.filter-cb-${colKey}`);

    if (cbs.length === allCbs.length) {
        delete STD_STATE.activeFilters[colKey];
    } else {
        const selectedValues = new Set();
        cbs.forEach(cb => selectedValues.add(cb.value));
        STD_STATE.activeFilters[colKey] = selectedValues;
    }

    renderStudentDetails(true);
};

window.clearFilter = function (colKey) {
    delete STD_STATE.activeFilters[colKey];
    renderStudentDetails(true);
};

function closeAllMenus() {
    const openMenu = StudentDetailsPerfCache.openFilterMenu;
    if (openMenu?.classList?.contains('show')) {
        openMenu.classList.remove('show');
        StudentDetailsPerfCache.openFilterMenu = null;
        return;
    }
    document.querySelectorAll('.excel-filter-menu.show').forEach(el => el.classList.remove('show'));
    StudentDetailsPerfCache.openFilterMenu = null;
}

// 点击空白关闭菜单
document.addEventListener('click', closeAllMenus);

// 辅助：翻页
window.changeStdPage = function (delta) {
    STD_STATE.page += delta;
    renderStudentDetails(false);
    const tableWrap = getStudentDetailsDomCache().tableWrap;
    if (tableWrap && tableWrap.scrollTop !== 0) tableWrap.scrollTop = 0;
};


function exportStudentDetails() {
    if (!RAW_DATA.length) { alert('请先上传数据'); return; }

    const user = getCurrentUser();
    const role = user?.role || 'guest';
    const isTeacher = role === 'teacher';
    const isClassTeacher = role === 'class_teacher';
    const classTeacherMode = isClassTeacher ? getClassTeacherStudentViewMode() : 'teaching';
    const needTeacherScope = isTeacher || (isClassTeacher && classTeacherMode === 'teaching');
    const teacherScope = needTeacherScope ? getTeacherScopeForUser(user) : null;

    const selectedSchool = document.getElementById('studentSchoolSelect').value;
    const selectedClass = document.getElementById('studentClassSelect').value;

    // 1. 判断是否为单校模式 (只有1所学校)
    const isSingleSchool = Object.keys(SCHOOLS).length <= 1;

    const wb = XLSX.utils.book_new();

    // 2. 动态构建表头
    const headers = isClassTeacher
        ? ['学校', '班级', '姓名']
        : (isTeacher
            ? ['学校', '班级', '姓名']
            : ['学校', '班级', '姓名', '考号', '考场']);

    visibleSubjects.forEach(subject => {
        if (isTeacher || isClassTeacher) {
            headers.push(`${subject} 分数`, `${subject} 级排`);
            if (!isSingleSchool) headers.push(`${subject} 镇排`, `${subject} 县排`);
        } else {
            headers.push(`${subject} 分数`, `${subject} 校排`);
            if (!isSingleSchool) headers.push(`${subject} 镇排`, `${subject} 县排`);
        }
    });

    if (!isClassTeacher && !isTeacher) {
        if (CONFIG.name === '9年级') {
            headers.push('五科总分', '五科班排', '五科校排');
            if (!isSingleSchool) headers.push('五科镇排', '五科县排');
        } else {
            headers.push('总分', '总分班排', '总分校排');
            if (!isSingleSchool) headers.push('总分镇排', '总分县排');
        }
    } else {
        headers.push(CONFIG.name === '9年级' ? '五科总分' : '总分', '总分班排', '总分级排');
        if (!isSingleSchool) headers.push('总分镇排', '总分县排');
    }

    const data = [headers];

    let studentsToShow = window.RankingDataService && typeof window.RankingDataService.getRowsBySchoolClass === 'function'
        ? window.RankingDataService.getRowsBySchoolClass(
            RAW_DATA,
            selectedSchool && !selectedSchool.includes('请选择') ? selectedSchool : '',
            selectedClass && selectedClass !== '全部' ? selectedClass : ''
        )
        : [...RAW_DATA];
    if ((isTeacher || (isClassTeacher && classTeacherMode === 'teaching')) && teacherScope && teacherScope.classes.size > 0) {
        studentsToShow = studentsToShow.filter(s => {
            const rawClass = String(s.class || '').trim();
            const normalizedClass = normalizeClass(s.class);
            if (teacherScope.classes.has(normalizedClass) || teacherScope.classes.has(rawClass)) return true;
            for (const allowedCls of teacherScope.classes) {
                if (String(allowedCls).replace(/[\s\.]/g, '') === String(rawClass).replace(/[\s\.]/g, '')) {
                    return true;
                }
            }
            return false;
        });
    } else if (isClassTeacher && user?.class) {
        const myClass = normalizeClass(user.class);
        studentsToShow = studentsToShow.filter(s => normalizeClass(s.class) === myClass);
    } else if (selectedSchool && !selectedSchool.includes('请选择') && !(window.RankingDataService && typeof window.RankingDataService.getRowsBySchoolClass === 'function')) {
        studentsToShow = studentsToShow.filter(s => sameAppSchoolName(s.school, selectedSchool));
        if (selectedClass && selectedClass !== '全部') studentsToShow = studentsToShow.filter(s => normalizeClass(s.class) === normalizeClass(selectedClass));
    }

    if (selectedSchool && !selectedSchool.includes('请选择') && !(window.RankingDataService && typeof window.RankingDataService.getRowsBySchoolClass === 'function')) {
        studentsToShow = studentsToShow.filter(s => sameAppSchoolName(s.school, selectedSchool));
    }
    if (selectedClass && selectedClass !== '全部' && !(window.RankingDataService && typeof window.RankingDataService.getRowsBySchoolClass === 'function')) {
        studentsToShow = studentsToShow.filter(s => normalizeClass(s.class) === normalizeClass(selectedClass));
    }

    studentsToShow = getComparisonStudentList(studentsToShow, RAW_DATA);
    const subjectListForExport = getStudentDetailsSubjectList(studentsToShow);
    const visibleSubjects = (isTeacher || (isClassTeacher && classTeacherMode === 'teaching'))
        ? subjectListForExport.filter(s => teacherScope.subjects.has(normalizeSubject(s)))
        : subjectListForExport;
    studentsToShow.sort((a, b) => (Number(b.total) || 0) - (Number(a.total) || 0));
    const exportTownRankVisible = hasStudentTownshipRankData(studentsToShow, visibleSubjects);
    const exportCountyRankVisible = hasStudentCountyRankData(studentsToShow, visibleSubjects);

    headers.length = isClassTeacher
        ? 3
        : (isTeacher ? 3 : 5);
    visibleSubjects.forEach(subject => {
        if (isTeacher || isClassTeacher) {
            headers.push(`${subject} 分数`, `${subject} 级排`);
        } else {
            headers.push(`${subject} 分数`, `${subject} 校排`);
        }
        if (exportTownRankVisible) headers.push(`${subject} 镇排`);
        if (exportCountyRankVisible) headers.push(`${subject} 县排`);
    });

    if (!isClassTeacher && !isTeacher) {
        if (CONFIG.name === '9年级') {
            headers.push('五科总分', '五科班排', '五科校排');
            if (exportTownRankVisible) headers.push('五科镇排');
            if (exportCountyRankVisible) headers.push('五科县排');
        } else {
            headers.push('总分', '总分班排', '总分校排');
            if (exportTownRankVisible) headers.push('总分镇排');
            if (exportCountyRankVisible) headers.push('总分县排');
        }
    } else {
        headers.push(CONFIG.name === '9年级' ? '五科总分' : '总分', '总分班排', '总分级排');
        if (exportTownRankVisible) headers.push('总分镇排');
        if (exportCountyRankVisible) headers.push('总分县排');
    }

    // 3. 填充数据行 (需与表头逻辑严格对应)
    studentsToShow.forEach(student => {
        const row = (isTeacher || isClassTeacher)
            ? [student.school, student.class, student.name]
            : [student.school, student.class, student.name, student.id, student.examRoom];
        const showTownRankForStudent = !isCountyDirectStudentForRank(student);

        visibleSubjects.forEach(subject => {
            if (isTeacher || isClassTeacher) {
                row.push(
                    student.scores[subject] || '-',
                    safeGet(student, `ranks.${subject}.school`, '-')
                );
                if (exportTownRankVisible) {
                    row.push(showTownRankForStudent ? getDisplayRankValue(student, `ranks.${subject}.township`, { scope: 'township' }) : '-');
                }
                if (exportCountyRankVisible) {
                    row.push(getStudentCountyRankValue(student, subject));
                }
            } else {
                row.push(
                    student.scores[subject] || '-',
                    safeGet(student, `ranks.${subject}.school`, '-')
                );
                if (exportTownRankVisible) {
                    row.push(showTownRankForStudent ? getDisplayRankValue(student, `ranks.${subject}.township`, { scope: 'township' }) : '-');
                }
                if (exportCountyRankVisible) {
                    row.push(getStudentCountyRankValue(student, subject));
                }
            }
        });

        if (!isClassTeacher && !isTeacher) {
            row.push(
                student.total,
                getDisplayRankValue(student, 'ranks.total.class', { scope: 'class' }),
                safeGet(student, 'ranks.total.school', '-')
            );
            if (exportTownRankVisible) {
                row.push(showTownRankForStudent ? getDisplayRankValue(student, 'ranks.total.township', { scope: 'township' }) : '-');
            }
            if (exportCountyRankVisible) {
                row.push(getStudentCountyRankValue(student, 'total'));
            }
        } else {
            row.push(
                student.total,
                getDisplayRankValue(student, 'ranks.total.class', { scope: 'class' }),
                safeGet(student, 'ranks.total.school', '-')
            );
            if (exportTownRankVisible) {
                row.push(showTownRankForStudent ? getDisplayRankValue(student, 'ranks.total.township', { scope: 'township' }) : '-');
            }
            if (exportCountyRankVisible) {
                row.push(getStudentCountyRankValue(student, 'total'));
            }
        }

        data.push(row);
    });

    const ws = XLSX.utils.aoa_to_sheet(data);

    // 调用装饰函数美化 Excel
    decorateExcelSheet(ws, headers);

    XLSX.utils.book_append_sheet(wb, ws, '学生考试明细');
    if (isTeacher || isClassTeacher) {
        const exportTag = buildTeacherExportTag(user, new Set(visibleSubjects || []));
        XLSX.writeFile(wb, `学生考试明细_${exportTag}.xlsx`);
    } else {
        XLSX.writeFile(wb, '学生考试明细.xlsx');
    }
}

function updateMarginalSchoolSelect() {
    const select = document.getElementById('marginalSchoolSelect');
    if (!select) return;
    const schoolList = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare() : Object.keys(SCHOOLS || {});
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
                DB.save(currentKey, snapshotPayload, { deferCloud: true, deferMs: 9000 });
            }, 1000);
        });
    });
}

function importTeacherExcel() {
    // 🟢 [重写] 使用新的统一导入逻辑
    const fileInput = document.getElementById('teacherFileInput');
    if (!fileInput) {
        alert('❌ 系统错误：找不到文件输入框');
        return;
    }

    if (!fileInput.files || !fileInput.files.length) {
        alert('⚠️ 请选择教师信息Excel文件');
        return;
    }

    // 检查是否封存
    if (typeof isArchiveLocked === 'function' && isArchiveLocked()) {
        alert("⛔ 当前考试已封存，禁止导入任课表");
        return;
    }

    // 检查 XLSX 库
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

            // 导入数据
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

            // 刷新显示
            if (typeof generateTeacherInputs === 'function') {
                generateTeacherInputs();
            }

            // 同步到云端
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

// [核心修改] 教师四维评价计算逻辑 (含贡献值、增值、低分率)
// Teacher analysis main runtime moved to public/assets/js/teacher-analysis-main-runtime.js

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
    selectedExamIdsSignature: '',
    selectedExamIds: [],
    historyByStudent: new Map(),
    hydratingKeys: new Set(),
    lastQueryKey: '',
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

function clearStudentReportCache(student) {
    const runtime = getStudentReportPerformanceRuntime();
    if (!runtime || typeof runtime.clear !== 'function') return;
    const identity = getReportStudentIdentity(student);
    runtime.clear(identity || '');
}

function applyCloudStudentHistoryToPrevData(stu, historyRes, selectedReportExamIds = [], effectiveCurrentExamId = '') {
    if (!historyRes || !historyRes.success || !Array.isArray(historyRes.data) || historyRes.data.length === 0) return 0;
    const selectedForCompare = Array.isArray(selectedReportExamIds) ? selectedReportExamIds : [];
    const rows = historyRes.data.filter(h => {
        const hid = String(h.examFullKey || h.examId || '').trim();
        if (!hid) return false;
        if (selectedForCompare.length > 0) {
            const inSelected = selectedForCompare.some(id => isExamKeyEquivalentForCompare(hid, id));
            if (!inSelected) return false;
        }
        return !effectiveCurrentExamId || !isExamKeyEquivalentForCompare(hid, effectiveCurrentExamId);
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
                    township: h.rankTown || '-'
                }
            }, Object.fromEntries(
                Object.entries(h.subjectRanks || {}).map(([sub, ranks]) => [sub, {
                    class: ranks?.class ?? '-',
                    school: ranks?.school ?? '-',
                    township: ranks?.township ?? '-'
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

function getCachedStudentReportHistory(stu) {
    const key = `${getReportStudentIdentity(stu)}::${String(window.CURRENT_EXAM_ID || '')}::${ReportHistoryPerfCache.selectedExamIdsSignature || ''}`;
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
    const selectedIds = (Array.isArray(selectedReportExamIds) ? selectedReportExamIds : [])
        .map(id => String(id || '').trim())
        .filter(Boolean)
        .filter(id => !effectiveCurrentExamId || !isExamKeyEquivalentForCompare(id, effectiveCurrentExamId));
    if (!selectedIds.length) return false;

    const history = getCachedStudentReportHistory(stu);
    if (!Array.isArray(history) || !history.length) return false;
    return selectedIds.every(selectedId => history.some(item => {
        const examKey = String(item?.examFullKey || item?.examId || '').trim();
        return examKey && isExamKeyEquivalentForCompare(examKey, selectedId);
    }));
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
        let reportHtml = reportCache?.getReportHtml?.(reportKey);
        if (!reportHtml) {
            reportHtml = await Promise.resolve(renderSingleReportCardHTML(stu, 'FULL'));
            reportCache?.setReportHtml?.(reportKey, reportHtml);
        }
        if (token !== __reportQueryToken) return;
        const nextReportHtml = typeof reportHtml === 'string' ? reportHtml : '';
        if (container.dataset.reportHtmlCacheKey !== reportKey || container.innerHTML !== nextReportHtml) {
            container.innerHTML = nextReportHtml;
            container.dataset.reportHtmlCacheKey = reportKey;
            container.dataset.reportChartCacheKey = '';
            enhanceStudentReportMetrics(container);
        }
        const history = getCachedStudentReportHistory(stu);
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
    if (hasCachedReportHistoryForSelectedExams(stu, selectedReportExamIds, effectiveCurrentExamId)) return;
    const hydrateKey = `${getReportStudentIdentity(stu)}::${(selectedReportExamIds || []).join('|')}::${effectiveCurrentExamId || ''}`;
    if (ReportHistoryPerfCache.hydratingKeys.has(hydrateKey)) return;
    ReportHistoryPerfCache.hydratingKeys.add(hydrateKey);
    const task = async () => {
        try {
            const ready = (
                (typeof window.CloudManager.ensureClientReady === 'function' && await window.CloudManager.ensureClientReady({ silent: true })) ||
                (typeof window.CloudManager.check === 'function' && window.CloudManager.check(true))
            );
            if (!ready || token !== __reportQueryToken) return;
            if (window.UI) UI.toast('正在后台同步历史成绩...', 'info');
            const historyRes = await window.CloudManager.fetchStudentExamHistory(stu);
            const loadedCount = applyCloudStudentHistoryToPrevData(stu, historyRes, selectedReportExamIds, effectiveCurrentExamId);
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
    if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
        window.SystemPerformance.scheduleIdle(task, { timeout: 800, delay: 120 });
    } else {
        window.setTimeout(task, 120);
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
    if (typeof window.ensureStudentCompareRuntimeLoaded !== 'function') return;
    const loadRuntime = () => {
        window.ensureStudentCompareRuntimeLoaded()
            .then(() => {
                if (typeof setCloudCompareTarget === 'function') setCloudCompareTarget(stu);
            })
            .catch((error) => {
                console.warn('Failed to warm student compare runtime after report query:', error);
            });
    };
    if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
        window.SystemPerformance.scheduleIdle(loadRuntime, { label: 'report-student-compare-warmup', delay: 120, timeout: 1500 });
        return;
    }
    window.setTimeout(loadRuntime, 120);
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
        CURRENT_EXAM_ID = effectiveCurrentExamId;
        writeWorkspaceExamId(effectiveCurrentExamId);
    }

    syncReportCompareTargetForQuery(stu);
    setCurrentReportStudentState(stu);
    warmStudentCompareRuntimeForReport(stu);

    const { resultEl, container } = getReportDomCache();

    if (resultEl && container) {
        resultEl.classList.remove('hidden');
        try {
            container.classList.add('student-report-canvas-full');
            const reportCache = getStudentReportPerformanceRuntime();
            const reportCacheKey = buildStudentReportCacheKey(stu, 'FULL', selectedReportExamIds, effectiveCurrentExamId);
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
                reportHtml = await Promise.resolve(renderSingleReportCardHTML(stu, 'FULL'));
                reportCache?.setReportHtml?.(reportCacheKey, reportHtml);
            }
            const nextReportHtml = typeof reportHtml === 'string' ? reportHtml : '';
            if (container.dataset.reportHtmlCacheKey !== reportCacheKey || container.innerHTML !== nextReportHtml) {
                container.innerHTML = nextReportHtml;
                container.dataset.reportHtmlCacheKey = reportCacheKey;
                container.dataset.reportChartCacheKey = '';
                enhanceStudentReportMetrics(container);
            }
        } catch (e) {
            console.error('Render Report Error:', e);
            container.innerHTML = `<div style="color:red; padding:20px; text-align:left;"><h3 style="color:red">Rendering Error</h3><pre>${e.stack || e.message || e}</pre></div>`;
        }
    }

    const history = getCachedStudentReportHistory(stu);

    scheduleStudentReportCharts(stu, history);

    hydrateStudentReportHistoryInBackground(stu, selectedReportExamIds, effectiveCurrentExamId, queryToken);

    const strengthKey = `${getReportStudentIdentity(stu)}::${effectiveCurrentExamId || ''}`;
    if (ReportHistoryPerfCache.lastStrengthKey !== strengthKey) {
        ReportHistoryPerfCache.lastStrengthKey = strengthKey;
        try { if (typeof analyzeStrengthsAndWeaknesses === 'function') analyzeStrengthsAndWeaknesses(stu); } catch (e) { console.error(e); }
    }

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
}

function setSingleSelectOptions(selectEl, values, placeholderText, preferredValue) {
    if (!selectEl) return '';
    const list = Array.isArray(values)
        ? values.map(v => String(v || '').trim()).filter(Boolean)
        : [];
    let html = '';
    if (placeholderText !== null && placeholderText !== undefined) {
        html += `<option value="">${placeholderText}</option>`;
    }
    html += list.map(value => `<option value="${value}">${value}</option>`).join('');
    selectEl.innerHTML = html;

    const preferred = preferredValue == null ? '' : String(preferredValue).trim();
    if (preferred && list.includes(preferred)) {
        selectEl.value = preferred;
    } else if (placeholderText === null && list.length) {
        selectEl.value = list[0];
    } else {
        selectEl.value = '';
    }
    return selectEl.value;
}

function setMultiSelectOptions(selectEl, values, preferredValues) {
    if (!selectEl) return;
    const list = Array.isArray(values)
        ? values.map(v => String(v || '').trim()).filter(Boolean)
        : [];
    const preferredSet = new Set((preferredValues || []).map(v => String(v || '').trim()).filter(Boolean));
    selectEl.innerHTML = list.map(value => `<option value="${value}">${value}</option>`).join('');
    Array.from(selectEl.options).forEach(option => {
        option.selected = preferredSet.has(option.value);
    });
}

function getSchoolClassOptions(schoolName) {
    if (window.RankingDataService && typeof window.RankingDataService.getClassesForSchool === 'function') {
        return window.RankingDataService.getClassesForSchool(RAW_DATA, schoolName);
    }
    const schoolRecord = getAppSchoolRecord(schoolName);
    if (!schoolName || !schoolRecord || !Array.isArray(schoolRecord.students)) return [];
    return [...new Set(schoolRecord.students.map(s => s.class).filter(Boolean))]
        .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));
}

function updateMutualAidSelects() {
    const sourceEl = document.getElementById('aid_source');
    const schSel = document.getElementById('aidSchoolSelect');
    const clsSel = document.getElementById('aidClassSelect');
    const subSel = document.getElementById('aidSubjectSelect');
    if (!sourceEl || !schSel || !clsSel || !subSel) return;
    const source = sourceEl.value;
    const prevSchool = schSel.value;
    const prevClass = clsSel.value;
    const prevSubject = subSel.value;
    if (source === 'freshman') {
        schSel.disabled = true;
        schSel.onchange = null;
        schSel.innerHTML = '<option value="SIM">🎌 新生模拟数据</option>';
        schSel.value = 'SIM';

        const classes = Object.keys(FB_SIMULATED_DATA || {}).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));
        clsSel.disabled = classes.length === 0;
        setSingleSelectOptions(clsSel, classes, classes.length ? '--班级--' : '(暂无数据)', prevClass);

        subSel.disabled = true;
        subSel.innerHTML = '<option value="total">入学总分</option>';
        subSel.value = 'total';
        return;
    }

    schSel.disabled = false;
    clsSel.disabled = false;
    setSingleSelectOptions(
        schSel,
        Object.keys(SCHOOLS || {}).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true })),
        '--请选择学校--',
        prevSchool
    );

    const syncAidClasses = (preferredClass) => {
        setSingleSelectOptions(clsSel, getSchoolClassOptions(schSel.value), '--班级--', preferredClass);
    };

    schSel.onchange = () => syncAidClasses(clsSel.value);
    syncAidClasses(prevClass);

    subSel.disabled = false;
    subSel.innerHTML = `<option value="total">总分(综合)</option>${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('')}`;
    subSel.value = (prevSubject === 'total' || SUBJECTS.includes(prevSubject)) ? prevSubject : 'total';
}

function renderMutualAidGroups() {
    const source = document.getElementById('aid_source').value;
    const sch = document.getElementById('aidSchoolSelect').value;
    const cls = document.getElementById('aidClassSelect').value;
    const sub = document.getElementById('aidSubjectSelect').value;
    const groupSizeInput = document.getElementById('aidGroupSize');
    const groupSize = Math.max(2, parseInt(groupSizeInput && groupSizeInput.value, 10) || 4);
    if (groupSizeInput && String(groupSizeInput.value) !== String(groupSize)) {
        groupSizeInput.value = groupSize;
    }
    let students = [];
    if (source === 'freshman') {
        if (!cls || !FB_SIMULATED_DATA[cls]) return alert("无分班数据");
        students = FB_SIMULATED_DATA[cls].map(s => ({ ...s, class: cls, total: s.score, scores: { total: s.score }, ranks: { total: { class: 0 } } }));
    } else {
        if (!sch || !cls) return alert("请选择学校和班级");
        const schoolRecord = getAppSchoolRecord(sch);
        students = JSON.parse(JSON.stringify((schoolRecord?.students || []).filter(s => s.class === cls)));
    }
    if (students.length < groupSize) return alert("班级人数不足以分组");
    const getScore = (s) => (sub === 'total' ? s.total : (s.scores[sub] || 0));
    students.sort((a, b) => getScore(b) - getScore(a));
    students.forEach((s, i) => s._subRankPct = (i + 1) / students.length);
    let totalSorted = [...students].sort((a, b) => b.total - a.total);
    totalSorted.forEach((s, i) => { let target = students.find(x => x.name === s.name); if (target) target._totalRankPct = (i + 1) / students.length; });
    let mentors = students.filter(s => s._subRankPct <= 0.25 && s._totalRankPct <= 0.40);
    if (mentors.length < (students.length / groupSize) * 0.5) { mentors = students.filter(s => s._subRankPct <= 0.25 && s._totalRankPct <= 0.50); }
    const targetGroupCount = Math.ceil(students.length / groupSize);
    if (mentors.length < targetGroupCount) { mentors = students.slice(0, targetGroupCount); }
    mentors = mentors.slice(0, targetGroupCount);
    let remaining = students.filter(s => !mentors.includes(s));
    let groups = mentors.map((m, i) => ({ id: i + 1, leader: m, members: [] }));
    remaining.sort((a, b) => getScore(b) - getScore(a));
    let direction = 1; let gIdx = 0;
    while (remaining.length > 0) {
        let student = remaining.shift(); groups[gIdx].members.push(student);
        gIdx += direction;
        if (gIdx >= groups.length) { gIdx = groups.length - 1; direction = -1; } else if (gIdx < 0) { gIdx = 0; direction = 1; }
    }
    AID_GROUPS_CACHE = groups;
    renderAidGroupsHTML(groups, sub);
}

function renderAidGroupsHTML(groups, sub) {
    const container = document.getElementById('aid-groups-container'); container.innerHTML = '';
    const aidGroupFragment = document.createDocumentFragment();
    groups.forEach(g => {
        const allScores = [g.leader, ...g.members].map(s => sub === 'total' ? s.total : (s.scores[sub] || 0)); const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
        const membersHtml = g.members.map(m => {
            const score = sub === 'total' ? m.total : (m.scores[sub] || 0); let tag = ''; if (m._subRankPct > 0.8) tag = `<span class="aid-tag tag-weak">需帮扶</span>`;
            return `<div class="aid-role-row aid-member"><div class="aid-avatar">${m.name[0]}</div><div class="aid-info"><div class="aid-name">${m.name} ${tag}</div><div class="aid-score">${sub}: ${score}</div></div></div>`;
        }).join('');
        const leaderScore = sub === 'total' ? g.leader.total : (g.leader.scores[sub] || 0);
        const card = document.createElement('div'); card.className = 'aid-card';
        card.innerHTML = `<div class="aid-header"><span>第 ${g.id} 组</span><span style="font-weight:normal; color:#666;">均分: ${avg.toFixed(1)}</span></div><div class="aid-body"><div class="aid-role-row aid-leader"><div class="aid-avatar">组</div><div class="aid-info"><div class="aid-name">${g.leader.name} <span class="aid-tag tag-strong">组长</span></div><div class="aid-score">${sub}: ${leaderScore}</div></div></div>${membersHtml}</div>`;
        aidGroupFragment.appendChild(card);
    });
    container.appendChild(aidGroupFragment);
}

function exportMutualAidGroups() {
    if (AID_GROUPS_CACHE.length === 0) return alert("请先生成分组");
    const wb = XLSX.utils.book_new(); const data = [['组号', '角色', '姓名', '参考分数']];
    AID_GROUPS_CACHE.forEach(g => {
        const sub = document.getElementById('aidSubjectSelect').value; const getS = (s) => sub === 'total' ? s.total : (s.scores[sub] || 0);
        data.push([g.id, '组长', g.leader.name, getS(g.leader)]);
        g.members.forEach(m => { data.push([g.id, '组员', m.name, getS(m)]); });
        data.push(['', '', '', '']);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "学科互助分组"); XLSX.writeFile(wb, "互助分组名单.xlsx");
}

function generateStudentComment(student) {
    const style = 'encouraging';
    const teacherName = '老师'; // 默认称呼
    const totalRank = safeGet(student, 'ranks.total.township', 99999); const totalStudents = RAW_DATA.length || 1; const percentile = totalRank / totalStudents;
    const progressCache = readProgressCacheState();
    let progress = 0; if (progressCache.length > 0) { const progRecord = progressCache.find(p => p.name === student.name && p.class === student.class); if (progRecord) progress = progRecord.change; }
    let bestSub = { name: '', rank: 99999 }; let worstSub = { name: '', rank: 0 };
    SUBJECTS.forEach(sub => { const r = safeGet(student, `ranks.${sub}.township`, 0); if (r > 0) { if (r < bestSub.rank) bestSub = { name: sub, rank: r }; if (r > worstSub.rank) worstSub = { name: sub, rank: r }; } });
    const isPartial = (worstSub.rank - bestSub.rank) > (totalStudents * 0.4);
    const phrases = {
        opening: { top: [`${student.name}同学，你一直是班级的领头羊。`, `你优秀的成绩证明了你的努力和天赋。`], mid: [`${student.name}同学，你是一个潜力巨大的学生。`, `你的成绩保持在班级中游，基础比较扎实。`], low: [`${student.name}同学，老师看到了你身上的闪光点。`, `虽然目前的成绩不尽如人意，但只要不放弃，总有希望。`] },
        progress: { up: [`本次考试你进步了${progress}名，这是你辛勤付出的回报！`, `欣喜地看到你的排名在稳步上升，继续保持！`], down: [`本次排名有所下滑，我们需要一起找找原因。`, `最近是不是有些分心？成绩出现了一点波动。`], flat: [`你的成绩非常稳定，保持这种状态很难得。`] },
        subjects: { partial: [`你的${bestSub.name}非常有优势，但${worstSub.name}稍微拖了后腿，如果能平衡一下，总分会更高。`, `要警惕偏科现象，${worstSub.name}学科需要投入更多精力。`], balanced: [`各科发展比较均衡，没有明显的短板，这是你的核心竞争力。`, `全面发展是你最大的优势，请继续保持这种良好的学习节奏。`] },
        advice: { encouraging: [`相信自己，你一定行！${teacherName}老师会一直支持你。`, `期待在下次光荣榜上看到更耀眼的你！`] }
    };
    let parts = []; let tier = 'mid'; if (percentile <= 0.15) tier = 'top'; else if (percentile >= 0.75) tier = 'low';
    parts.push(phrases.opening[tier][Math.floor(Math.random() * phrases.opening[tier].length)]);
    if (Math.abs(progress) >= 10) { let pType = progress > 0 ? 'up' : 'down'; parts.push(phrases.progress[pType][Math.floor(Math.random() * phrases.progress[pType].length)]); } else { if (Math.random() > 0.5) parts.push(phrases.progress.flat[Math.floor(Math.random() * phrases.progress.flat.length)]); }
    if (isPartial) { parts.push(phrases.subjects.partial[Math.floor(Math.random() * phrases.subjects.partial.length)]); } else { parts.push(phrases.subjects.balanced[Math.floor(Math.random() * phrases.subjects.balanced.length)]); }
    parts.push(phrases.advice[style][Math.floor(Math.random() * phrases.advice[style].length)]);
    return parts.join("");
}

function getComparisonTotalSubjects() {
    const subsForTotal = (CONFIG.totalSubs === 'auto') ? SUBJECTS : CONFIG.totalSubs;
    return Array.isArray(subsForTotal) ? subsForTotal.filter(Boolean) : [];
}

const ComparisonRankContextPerfCache = {
    maxEntries: 4,
    contexts: new Map()
};

function buildComparisonRankContextSignature(allStudents, totalSubjects = getComparisonTotalSubjects()) {
    const rows = Array.isArray(allStudents) ? allStudents : [];
    const first = rows[0] || {};
    const last = rows[rows.length - 1] || {};
    let totalChecksum = 0;
    for (let i = 0; i < rows.length; i += 1) {
        totalChecksum += Number(rows[i]?.total) || 0;
    }
    return [
        window.__RAW_DATA_VERSION || 0,
        window.CURRENT_EXAM_ID || '',
        rows.length,
        totalChecksum.toFixed(2),
        totalSubjects.join('|'),
        getReportStudentIdentity(first),
        getReportStudentIdentity(last)
    ].join('::');
}

function buildComparisonStudentRankContext(allStudents, totalSubjects = getComparisonTotalSubjects()) {
    const rows = Array.isArray(allStudents) ? allStudents.filter(Boolean) : [];
    const keyOf = (row) => `${String(row?.school || '').trim()}::${String(row?.class || '').trim()}::${String(row?.name || '').trim()}`;
    const classKeyOf = (value) => (typeof normalizeClass === 'function')
        ? normalizeClass(value)
        : String(value || '').trim();
    const withTotals = rows
        .map(row => ({ row, total: getComparisonTotalValue(row, totalSubjects) }))
        .filter(item => Number.isFinite(item.total));
    const townshipSourceRows = (() => {
        if (typeof filterRowsToTownshipSchools !== 'function') return rows;
        const filtered = filterRowsToTownshipSchools(rows);
        return filtered.length ? filtered : rows;
    })();
    const townshipKeys = new Set(townshipSourceRows.map(row => keyOf(row)));
    const townshipWithTotals = withTotals.filter(item => townshipKeys.has(keyOf(item.row)));
    const townRankMap = buildCompetitionRankMap(townshipWithTotals, item => keyOf(item.row), item => item.total);
    const countyRankMap = buildCompetitionRankMap(withTotals, item => keyOf(item.row), item => item.total);
    const totalsBySchool = new Map();
    const totalsByClass = new Map();
    withTotals.forEach((item) => {
        const schoolKey = String(item.row?.school || '').trim();
        const classKey = classKeyOf(item.row?.class || '');
        if (!totalsBySchool.has(schoolKey)) totalsBySchool.set(schoolKey, []);
        totalsBySchool.get(schoolKey).push(item);
        const classCacheKey = `${schoolKey}::${classKey}`;
        if (!totalsByClass.has(classCacheKey)) totalsByClass.set(classCacheKey, []);
        totalsByClass.get(classCacheKey).push(item);
    });
    const schoolRankMaps = new Map();
    const classRankMaps = new Map();
    const resolveRankSchoolKey = (school) => {
        const requested = String(school || '').trim();
        if (totalsBySchool.has(requested)) return requested;
        return Array.from(totalsBySchool.keys()).find(key => sameAppSchoolName(key, requested)) || requested;
    };

    const getSchoolRankMap = (school) => {
        const schoolKey = resolveRankSchoolKey(school);
        if (!schoolRankMaps.has(schoolKey)) {
            schoolRankMaps.set(
                schoolKey,
                buildCompetitionRankMap(
                    totalsBySchool.get(schoolKey) || [],
                    item => keyOf(item.row),
                    item => item.total
                )
            );
        }
        return schoolRankMaps.get(schoolKey);
    };

    const getClassRankMap = (school, className) => {
        const schoolKey = resolveRankSchoolKey(school);
        const classKey = classKeyOf(className);
        const cacheKey = `${schoolKey}::${classKey}`;
        if (!classRankMaps.has(cacheKey)) {
            classRankMaps.set(
                cacheKey,
                buildCompetitionRankMap(
                    totalsByClass.get(cacheKey) || [],
                    item => keyOf(item.row),
                    item => item.total
                )
            );
        }
        return classRankMaps.get(cacheKey);
    };

    return {
        totalSubjects,
        rows,
        withTotals,
        keyOf,
        townRankMap,
        countyRankMap,
        getSchoolRankMap,
        getClassRankMap
    };
}

function getCachedComparisonStudentRankContext(allStudents = RAW_DATA, totalSubjects = getComparisonTotalSubjects()) {
    const signature = buildComparisonRankContextSignature(allStudents, totalSubjects);
    if (ComparisonRankContextPerfCache.contexts.has(signature)) {
        const cached = ComparisonRankContextPerfCache.contexts.get(signature);
        ComparisonRankContextPerfCache.contexts.delete(signature);
        ComparisonRankContextPerfCache.contexts.set(signature, cached);
        return cached;
    }
    const context = buildComparisonStudentRankContext(allStudents, totalSubjects);
    ComparisonRankContextPerfCache.contexts.set(signature, context);
    while (ComparisonRankContextPerfCache.contexts.size > ComparisonRankContextPerfCache.maxEntries) {
        const firstKey = ComparisonRankContextPerfCache.contexts.keys().next().value;
        if (!firstKey) break;
        ComparisonRankContextPerfCache.contexts.delete(firstKey);
    }
    return context;
}

function getComparisonStudentView(record, allStudents = RAW_DATA, comparisonContext = null) {
    if (!record || typeof record !== 'object') return record;
    try {
        return createComparisonStudentView(
            record,
            allStudents,
            comparisonContext || getCachedComparisonStudentRankContext(allStudents)
        );
    } catch (error) {
        console.warn('[report] failed to normalize comparison student view:', error);
        return record;
    }
}

function getComparisonStudentList(records, allStudents = RAW_DATA) {
    if (!Array.isArray(records)) return [];
    const comparisonContext = getCachedComparisonStudentRankContext(allStudents);
    return records.map(record => getComparisonStudentView(record, allStudents, comparisonContext));
}

Object.assign(window, {
    buildComparisonStudentRankContext,
    getCachedComparisonStudentRankContext,
    getComparisonStudentView,
    getComparisonStudentList
});

function formatComparisonExamLabel(rawLabel, fallback = '本次') {
    const raw = String(rawLabel || '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
    if (!raw) return fallback;
    const tokens = raw.split(' ').filter(Boolean);
    if (tokens.length >= 4) return tokens.slice(-4).join(' ');
    return raw.length > 28 ? raw.slice(-28) : raw;
}

function getLatestHistoryExamEntry(student, passedHistory = null) {
    const history = Array.isArray(passedHistory)
        ? passedHistory
        : (typeof getStudentExamHistory === 'function' ? getStudentExamHistory(student) : []);
    const currentExamId = getEffectiveCurrentExamId();

    return history
        .filter(entry => {
            const entryKey = entry?.examFullKey || entry?.examId;
            return !currentExamId || (
                !isExamKeyEquivalentForCompare(entryKey, currentExamId) &&
                !isExamKeyEquivalentForCompare(entry?.examId, currentExamId)
            );
        })
        .sort((a, b) => {
            const timeA = Number(a?.createdAt || a?.student?.updatedAt || 0);
            const timeB = Number(b?.createdAt || b?.student?.updatedAt || 0);
            if (timeA !== timeB) return timeA - timeB;
            return String(a?.examFullKey || a?.examId || '').localeCompare(String(b?.examFullKey || b?.examId || ''));
        })
        .slice(-1)[0] || null;
}

function getComparisonTotalValue(record, subjects) {
    if (!record || !record.scores || typeof record.scores !== 'object') {
        return (typeof record?.total === 'number' && Number.isFinite(record.total)) ? record.total : null;
    }

    const totalSubjects = Array.isArray(subjects) && subjects.length ? subjects : getComparisonTotalSubjects();
    if (!totalSubjects.length) {
        return (typeof record.total === 'number' && Number.isFinite(record.total)) ? record.total : null;
    }

    let sum = 0;
    let matchCount = 0;
    totalSubjects.forEach(sub => {
        const score = Number(record.scores?.[sub]);
        if (Number.isFinite(score)) {
            sum += score;
            matchCount++;
        }
    });

    if (matchCount === totalSubjects.length) {
        return parseFloat(sum.toFixed(1));
    }

    return (typeof record.total === 'number' && Number.isFinite(record.total)) ? record.total : null;
}

function resolveIsClassEquivalent(leftClass, rightClass) {
    if (typeof window.isClassEquivalent === 'function') {
        return window.isClassEquivalent(leftClass, rightClass);
    }
    if (window.CompareCloudContextRuntime && typeof window.CompareCloudContextRuntime.isClassEquivalent === 'function') {
        return window.CompareCloudContextRuntime.isClassEquivalent(leftClass, rightClass);
    }
    return String(leftClass || '').trim() === String(rightClass || '').trim();
}

function readCloudPreviousRecordForStudent(student) {
    if (typeof window.getCloudCompareHint === 'function') {
        return window.getCloudCompareHint(student)?.previousRecord || null;
    }
    if (typeof window.getCloudPreviousRecord === 'function') {
        return window.getCloudPreviousRecord(student) || null;
    }
    const cloudCompareContext = readCloudStudentCompareContextState();
    if (cloudCompareContext?.previousRecord && isCloudContextLikelyCurrentTarget(student)) {
        return cloudCompareContext.previousRecord;
    }
    return null;
}

function createComparisonStudentView(record, allStudents, comparisonContext = null) {
    if (!record || typeof record !== 'object') return record;

    const totalSubjects = comparisonContext?.totalSubjects || getComparisonTotalSubjects();
    const normalizedTotal = getComparisonTotalValue(record, totalSubjects);
    const view = {
        ...record,
        scores: { ...(record.scores || {}) },
        ranks: {
            ...(record.ranks || {}),
            total: { ...((record.ranks && record.ranks.total) || {}) }
        }
    };

    if (typeof normalizedTotal === 'number' && Number.isFinite(normalizedTotal)) {
        view.total = normalizedTotal;
    }

    const context = comparisonContext || buildComparisonStudentRankContext(allStudents, totalSubjects);
    if (!context.withTotals.length) return view;

    const targetKey = context.keyOf(record);
    const schoolRankMap = context.getSchoolRankMap(record.school);
    const classRankMap = context.getClassRankMap(record.school, record.class);
    const countyRank = context.countyRankMap.get(targetKey) ?? view.ranks.total.county ?? view.countyRank ?? '-';

    view.ranks.total = {
        ...view.ranks.total,
        township: context.townRankMap.get(targetKey) ?? view.ranks.total.township ?? '-',
        county: countyRank,
        school: schoolRankMap.get(targetKey) ?? view.ranks.total.school ?? '-',
        class: classRankMap.get(targetKey) ?? view.ranks.total.class ?? '-'
    };
    if (countyRank !== '-') view.countyRank = countyRank;

    return view;
}

function recalcPrevTotal(prevRecord) {
    if (!prevRecord || !prevRecord.scores || typeof prevRecord.scores !== 'object') return '-';
    const subsForTotal = getComparisonTotalSubjects();
    if (!subsForTotal || subsForTotal.length === 0) {
        return (typeof prevRecord.total === 'number') ? prevRecord.total : '-';
    }
    let sum = 0, matchCount = 0;
    subsForTotal.forEach(sub => {
        const score = prevRecord.scores[sub];
        if (typeof score === 'number' && Number.isFinite(score)) {
            sum += score;
            matchCount++;
        }
    });
    if (matchCount === 0 || matchCount < subsForTotal.length) return '-';
    return sum;
}

function findPreviousRecord(student) {
    const cloudPrev = readCloudPreviousRecordForStudent(student);
    if (cloudPrev) {
        return cloudPrev;
    }

    const cleanStr = (str) => String(str || "").trim().replace(/\s+/g, "");
    const normClass = (cls) => {
        let s = String(cls || "").trim();
        return s.replace(/[班级\(\)\.\-gradeclass]/gi, "");
    };
    const matchStudent = (p, targetName, targetClass, targetSchool) => {
        const sObj = p.student || p;
        if (sObj.school && targetSchool && !areSchoolNamesEquivalent(sObj.school, targetSchool)) return false;
        if (cleanStr(sObj.name) !== targetName) return false;
        const histClass = normClass(sObj.class);
        if (histClass === targetClass) return true;
        const numC1 = histClass.replace(/0/g, '');
        const numC2 = targetClass.replace(/0/g, '');
        if (numC1 === numC2 && numC1.length > 0) return true;
        return false;
    };

    const targetName = cleanStr(student.name);
    const targetClass = normClass(student.class);
    const targetSchool = student.school;
    const getRecordTime = (row) => {
        const raw = row?.updatedAt || row?.createdAt || row?.student?.updatedAt || 0;
        const asNum = Number(raw);
        if (Number.isFinite(asNum) && asNum > 0) return asNum;
        const asDate = new Date(raw).getTime();
        return Number.isFinite(asDate) ? asDate : 0;
    };

    const currentExamId = getEffectiveCurrentExamId();
    const currentFingerprint = computeExamDataFingerprint(RAW_DATA || []);


    if (window.PREV_DATA && window.PREV_DATA.length > 0) {
        const otherExams = window.PREV_DATA.filter(p => {
            const hid = p.examFullKey || p.examId;
            const sameExam = currentExamId && (isExamKeyEquivalentForCompare(hid, currentExamId) || isExamKeyEquivalentForCompare(p.examId, currentExamId));
            const sameFingerprint = currentFingerprint && p?.fingerprint && String(p.fingerprint) === currentFingerprint;
            return !sameExam && !sameFingerprint;
        }).sort((a, b) => getRecordTime(b) - getRecordTime(a));
        const match = otherExams.find(p => matchStudent(p, targetName, targetClass, targetSchool));
        if (match) return match;
    }

    if (typeof CohortDB !== 'undefined') {
        try {
            const db = CohortDB.ensure();
            if (db && db.exams && Object.keys(db.exams).length > 0) {
                const examEntries = Object.entries(db.exams)
                    .filter(([id]) => !currentExamId || !isExamKeyEquivalentForCompare(id, currentExamId)) // 排除当前考试
                    .sort((a, b) => (b[1].createdAt || 0) - (a[1].createdAt || 0)); // 按时间降序

                for (const [examId, exam] of examEntries) {
                    const examData = exam.data || [];
                    if (examData.length === 0) continue;
                    const examFingerprint = String(exam.fingerprint || computeExamDataFingerprint(examData)).trim();
                    if (currentFingerprint && examFingerprint && examFingerprint === currentFingerprint) continue;

                    const found = window.RankingDataService && typeof window.RankingDataService.findStudent === 'function'
                        ? window.RankingDataService.findStudent(examData, {
                            name: student.name,
                            school: targetSchool,
                            className: student.class
                        })
                        : examData.find(p => matchStudent(p, targetName, targetClass, targetSchool));
                    if (found) {
                        appDebug(`[对比] 从历史考试 "${examId}" 中找到 ${student.name} 的历史记录`);
                        return {
                            ...found,
                            townRank: found.ranks?.total?.township || '-',
                            classRank: found.ranks?.total?.class || '-',
                            schoolRank: found.ranks?.total?.school || '-',
                            _sourceExam: examId
                        };
                    }
                }
            }
        } catch (e) {
            console.warn('[对比] COHORT_DB 历史查找异常:', e);
        }
    }
    const user = getCurrentUser();
    const isParentOrStudent = user && RoleManager.hasAnyRole(user, ['parent', 'student']) &&
        !RoleManager.hasAnyRole(user, ['admin', 'director', 'grade_director', 'teacher', 'class_teacher']);
    if (!readCloudStudentCompareContextState()?.previousRecord && !isParentOrStudent) {
        console.warn("历史数据(PREV_DATA)为空且COHORT_DB中无历史快照，无法进行对比。");
    }

    return null;
}

// 🟢 [Bug #5 新增] 获取学生在所有历史考试中的记录（用于多期雷达图对比）
function getStudentExamHistory(student) {
    const results = [];
    if (!student) return results;
    const reportCache = getStudentReportPerformanceRuntime();
    const historyCacheKey = buildStudentReportCacheKey(student, 'HISTORY');
    const cachedHistory = reportCache?.getHistory?.(historyCacheKey);
    if (Array.isArray(cachedHistory)) return cachedHistory;

    const cleanStr = (str) => String(str || "").trim().replace(/\s+/g, "");
    const normClass = (cls) => String(cls || "").trim().replace(/[班级\(\)\.\-gradeclass]/gi, "");
    const getHistoryKey = (row) => String(row?.examFullKey || row?.examId || '').trim();
    const getHistoryTime = (row) => {
        const raw = row?.createdAt || row?.student?.updatedAt || row?.updatedAt || 0;
        const asNum = Number(raw);
        if (Number.isFinite(asNum) && asNum > 0) return asNum;
        const asDate = new Date(raw).getTime();
        return Number.isFinite(asDate) ? asDate : 0;
    };
    const targetName = cleanStr(student.name);
    const targetClass = normClass(student.class);
    const targetSchool = student.school;
    const currentExamId = getEffectiveCurrentExamId();
    const currentFingerprint = getCurrentReportDataFingerprint();
    const isTargetStudent = (row) => {
        const sObj = row?.student || row || {};
        if (sObj.school && targetSchool && !areSchoolNamesEquivalent(sObj.school, targetSchool)) return false;
        if (cleanStr(sObj.name) !== targetName) return false;
        const histClass = normClass(sObj.class);
        if (histClass === targetClass) return true;
        const numC1 = histClass.replace(/0/g, '');
        const numC2 = targetClass.replace(/0/g, '');
        return numC1 === numC2 && numC1.length > 0;
    };

    if (typeof CohortDB === 'undefined') return results;

    // 🟢 [新增] 检查是否启用了“个性化历史期数”的手动覆盖
    const manualExams = [];
    ['reportCompareExam1', 'reportCompareExam2', 'reportCompareExam3'].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.value) manualExams.push(el.value);
    });

    try {
        const db = CohortDB.ensure();
        if (!db || !db.exams) return results;

        const examEntries = Object.entries(db.exams)
            .sort((a, b) => (a[1].createdAt || 0) - (b[1].createdAt || 0)); // 按时间升序
        const comparisonContextByExam = new Map();
        const getExamComparisonContext = (examId, examFingerprint, examData) => {
            const contextKey = `${String(examFingerprint || examId || '').trim()}::${Array.isArray(examData) ? examData.length : 0}`;
            if (comparisonContextByExam.has(contextKey)) return comparisonContextByExam.get(contextKey);
            const context = typeof getCachedComparisonStudentRankContext === 'function'
                ? getCachedComparisonStudentRankContext(examData)
                : null;
            comparisonContextByExam.set(contextKey, context);
            return context;
        };

        for (const [examId, exam] of examEntries) {
            const examData = exam.data || [];
            if (examData.length === 0) continue;
            const examFingerprint = String(exam.fingerprint || computeExamDataFingerprint(examData)).trim();
            if (currentFingerprint && examFingerprint && examFingerprint === currentFingerprint && !isExamKeyEquivalentForCompare(examId, currentExamId)) {
                continue;
            }

            // 如果启用了手动覆盖，必须在指定的 examId 列表中
            if (manualExams.length > 0 && !manualExams.some(id => isExamKeyEquivalentForCompare(examId, id)) && !isExamKeyEquivalentForCompare(examId, currentExamId)) {
                continue;
            }

            const found = window.RankingDataService && typeof window.RankingDataService.findStudent === 'function'
                ? window.RankingDataService.findStudent(examData, {
                    name: student.name,
                    school: targetSchool,
                    className: student.class
                })
                : examData.find(p => {
                    if (p.school && targetSchool && !areSchoolNamesEquivalent(p.school, targetSchool)) return false;
                    if (cleanStr(p.name) !== targetName) return false;
                    const histClass = normClass(p.class);
                    if (histClass === targetClass) return true;
                    const numC1 = histClass.replace(/0/g, '');
                    const numC2 = targetClass.replace(/0/g, '');
                    return numC1 === numC2 && numC1.length > 0;
            });

            if (found) {
                const comparisonContext = getExamComparisonContext(examId, examFingerprint, examData);
                const normalizedStudent = createComparisonStudentView(found, examData, comparisonContext);

                results.push({
                    examId,
                    examFullKey: exam.examFullKey || examId, // 记录全名
                    examLabel: examId.replace(/_/g, ' '),
                    createdAt: exam.createdAt || 0,
                    fingerprint: examFingerprint,
                    student: normalizedStudent,
                    percentiles: {},
                    allStudents: examData
                });
            }
        }
    } catch (e) {
        console.warn('[多期对比] 获取学生本地考试历史异常:', e);
    }

    // 🆕 整合云端异步拉取的数据 (PREV_DATA)
    if (window.PREV_DATA && Array.isArray(window.PREV_DATA)) {
        window.PREV_DATA.forEach(h => {
            if (!isTargetStudent(h)) return;
            // 如果启用了手动覆盖，过滤掉不在覆盖列表里的云端数据 (当前考试除外)
            const matchKey = getHistoryKey(h);
            if (currentFingerprint && h?.fingerprint && String(h.fingerprint) === currentFingerprint && !isExamKeyEquivalentForCompare(matchKey, currentExamId)) {
                return;
            }
            if (manualExams.length > 0 && !manualExams.some(id => isExamKeyEquivalentForCompare(matchKey, id)) && !isExamKeyEquivalentForCompare(matchKey, currentExamId)) {
                return;
            }
            if (!matchKey) return;

            // 统一结构后再做去重，避免 examId/examFullKey 混用导致误判
            const normalized = {
                ...h,
                examFullKey: h.examFullKey || h.examId,
                examId: h.examId || h.examFullKey,
                examLabel: String(h.examLabel || h.examId || h.examFullKey || '').replace(/_/g, ' '),
                fingerprint: h.fingerprint || ''
            };
            const existsIdx = results.findIndex(r => isExamKeyEquivalentForCompare(getHistoryKey(r), matchKey));
            if (existsIdx === -1) {
                results.push(normalized);
            } else if (getHistoryTime(normalized) > getHistoryTime(results[existsIdx])) {
                results[existsIdx] = normalized;
            }
        });
    }

    // 重新按考试身份去重：允许“不同考试但成绩恰好相同”并存
    const dedupedResults = [];
    const getHistoryIdentity = (entry) => getCompareExamIdentity({
        id: entry?.examFullKey || entry?.examId || '',
        label: entry?.examLabel || ''
    });
    results.forEach(item => {
        const matchKey = getHistoryKey(item);
        const identity = getHistoryIdentity(item);
        const existingIdx = dedupedResults.findIndex(existing => {
            const existingKey = getHistoryKey(existing);
            if (matchKey && existingKey && isExamKeyEquivalentForCompare(existingKey, matchKey)) return true;
            return !!identity && identity === getHistoryIdentity(existing);
        });
        if (existingIdx === -1) {
            dedupedResults.push(item);
            return;
        }
        const existing = dedupedResults[existingIdx];
        const keep = pickPreferredExamEntry({
            id: existing.examFullKey || existing.examId,
            source: existing.source || 'local',
            sortTs: getHistoryTime(existing),
            label: existing.examLabel,
            payload: existing
        }, {
            id: item.examFullKey || item.examId,
            source: item.source || 'local',
            sortTs: getHistoryTime(item),
            label: item.examLabel,
            payload: item
        });
        dedupedResults[existingIdx] = keep.payload;
    });

    dedupedResults.sort((a, b) => {
        const timeA = getHistoryTime(a);
        const timeB = getHistoryTime(b);
        if (timeA !== timeB) return timeA - timeB;
        return getHistoryKey(a).localeCompare(getHistoryKey(b));
    });

    reportCache?.setHistory?.(historyCacheKey, dedupedResults);
    return dedupedResults;
}

// 🟢 [新增]：生成进退步胶囊标签 (Windows 风格)
// Report render runtime moved to public/assets/js/report-render-runtime.js


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

function refreshIndicatorResults(isSilent = true) {
    updateIndicatorUIState();
    if (!isIndicatorCalcAllowed() || !hasIndicatorCalcInputs()) return [];
    const result = calcIndicators(isSilent);
    return Array.isArray(result) ? result : [];
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

function calcIndicators(isSilent = false) {
    clearIndicatorTargetMatchPanel();
    if (!isIndicatorPromptAllowed()) {
        if (!isSilent && window.UI) UI.toast('仅 9 年级可使用指标生功能', 'warning');
        return [];
    }
    // 1. 优先读取全局变量 SYS_VARS (这是最可靠的数据源)
    // 如果全局变量是空的，尝试读取管理面板里的输入框 (dm_ind...)
    let val1 = window.SYS_VARS?.indicator?.ind1;
    let val2 = window.SYS_VARS?.indicator?.ind2;

    if (!val1) val1 = document.getElementById('dm_ind1_input')?.value;
    if (!val2) val2 = document.getElementById('dm_ind2_input')?.value;

    const r1 = parseInt(val1);
    const r2 = parseInt(val2);

    // 2. 检查：如果参数未设置，自动打开管理面板并跳转到【年级指标参数】页
    if (!r1 || !r2) {
        if (!isSilent && confirm("❌ 检测到【划线名次】尚未设置！\n\n是否立即打开「教务数据综合控制台」进行设置？")) {
            DataManager.open(); // 打开弹窗
            DataManager.switchTab('params'); // 自动切换到参数设置Tab
        }
        return [];
    }

    if (!isIndicatorCalcAllowed()) {
        if (window.UI) UI.toast('请先加载当前 9 年级考试成绩后再开始计算', 'warning');
        return [];
    }
    if (!isIndicatorCalcAllowed()) {
        if (window.UI) UI.toast('仅 9 年级期中/期末考试可开始计算', 'warning');
        return;
    }

    // 3. 检查：如果目标人数未导入，自动打开管理面板并跳转到【目标人数管理】页
    // window.TARGETS 是在 loadCloudData 或 DataManager 中加载的
    if (!window.TARGETS || Object.keys(window.TARGETS).length === 0) {
        if (!isSilent && confirm("❌ 检测到【目标人数】尚未导入！\n\n是否立即打开「教务数据综合控制台」进行导入？")) {
            DataManager.open(); // 打开弹窗
            DataManager.switchTab('targets'); // 自动切换到目标管理Tab
        }
        return [];
    }

    Object.values(SCHOOLS || {}).forEach(school => {
        if (school && typeof school === 'object') school.scoreInd = 0;
    });

    // 1. 确定全镇划线分数。县直学校不参与指标生划线与达标统计。
    const townshipRows = (typeof filterRowsToTownshipSchools === 'function')
        ? filterRowsToTownshipSchools(RAW_DATA || [])
        : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    const allScores = townshipRows.map(s => s.total).filter(v => typeof v === 'number').sort((a, b) => b - a);
    const line1 = allScores[r1 - 1] || 0;
    const line2 = allScores[r2 - 1] || 0;

    // 2. 第一轮遍历：计算达标人数、基础分、超额数
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
        const rawT1 = parseInt(targetInfo.value?.t1, 10) || 0;
        const rawT2 = parseInt(targetInfo.value?.t2, 10) || 0;
        const invalidTarget1 = rawT1 > 0 && studentCount > 0 && rawT1 > studentCount;
        const invalidTarget2 = rawT2 > 0 && studentCount > 0 && rawT2 > studentCount;
        const t = {
            t1: invalidTarget1 ? 0 : rawT1,
            t2: invalidTarget2 ? 0 : rawT2
        };
        const invalidTarget = invalidTarget1 || invalidTarget2;
        const missingTarget = !targetInfo.key || (!t.t1 && !t.t2);

        // --- 指标一计算 ---
        // 基础分 (满分30)
        let base1 = 0;
        if (t.t1 > 0) {
            if (reach1 < t.t1 * 0.6) base1 = 0;
            else if (reach1 >= t.t1) base1 = 30;
            else base1 = (reach1 / t.t1) * 30;
        }

        // 超额数
        const excess1 = t.t1 > 0 ? Math.max(0, reach1 - t.t1) : 0;
        if (excess1 > maxExcess1) maxExcess1 = excess1;

        // --- 指标二计算 ---
        // 基础分 (满分30)
        let base2 = 0;
        if (t.t2 > 0) {
            if (reach2 < t.t2 * 0.6) base2 = 0;
            else if (reach2 >= t.t2) base2 = 30;
            else base2 = (reach2 / t.t2) * 30;
        }

        // 超额数
        const excess2 = t.t2 > 0 ? Math.max(0, reach2 - t.t2) : 0;
        if (excess2 > maxExcess2) maxExcess2 = excess2;

        calcData.push({
            name: s.name,
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

    // 3. 第二轮遍历：计算附加分、总分并排序
    calcData.forEach(d => {
        // 附加分公式：(某校超额 / 最大超额) * 5
        d.bonus1 = (maxExcess1 > 0) ? (d.excess1 / maxExcess1 * 5) : 0;
        d.score1 = d.base1 + d.bonus1;

        d.bonus2 = (maxExcess2 > 0) ? (d.excess2 / maxExcess2 * 5) : 0;
        d.score2 = d.base2 + d.bonus2;

        d.finalScore = d.score1 + d.score2;

        // 同步到全局对象供综合排名使用
        syncIndicatorScoreToSchools(d.name, d.finalScore);
    });

    // 排序
    calcData.sort((a, b) => b.finalScore - a.finalScore).forEach((d, i) => d.rank = i + 1);

    const missingTargetSchools = calcData.filter(d => d.missingTarget).map(d => d.name);
    const invalidTargetSchools = calcData
        .filter(d => d.invalidTarget)
        .map(d => `${d.name}(人数${d.studentCount}, 目标${d.rawT1}/${d.rawT2})`);

    // 4. 渲染表格 (表头增加基础分/附加分列)
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

    // 1. 获取该校的目标人数设定
    // 注意：TARGETS 是全局变量，存储了导入的目标配置
    const targetConfig = getTargetConfigBySchool(schoolName).value || { t1: 0, t2: 0 };
    const targetCount = type === 'ind1' ? parseInt(targetConfig.t1) : parseInt(targetConfig.t2);

    if (!targetCount) return alert(`未找到 ${schoolName} 的目标设定，请先导入目标人数Excel。`);

    // 2. 将学生分为“已达标”和“未达标”两组
    // 按总分降序排列，保证未达标组的第一个就是离线最近的
    const allStudents = [...schoolStudents].sort((a, b) => b.total - a.total);
    const reached = allStudents.filter(s => s.total >= lineScore);
    const below = allStudents.filter(s => s.total < lineScore);

    // 3. 计算需要抓取的人数 (策略：补齐缺口 + 适当富余以便培优)
    const currentCount = reached.length;
    const gap = targetCount - currentCount; // 缺口人数

    // 设置“缓冲量”：比如为了保险起见，多抓取目标数的 10% 或至少 5 人
    const buffer = Math.ceil(targetCount * 0.1) || 5;

    let countToFetch = 0;
    let strategyText = "";

    if (gap > 0) {
        // 情况A: 尚未达标 -> 抓取 (缺口 + 缓冲) 人
        countToFetch = gap + buffer;
        strategyText = `当前差 <strong style="color:red">${gap}</strong> 人达标。已为您筛选最接近目标的 <strong>${countToFetch}</strong> 名潜力生（含 ${buffer} 名保险备份）。`;
    } else {
        // 情况B: 已经达标 -> 依然推荐 (缓冲) 人，用于巩固防守
        countToFetch = buffer;
        strategyText = `当前已达标 (超 ${Math.abs(gap)} 人)。建议继续关注线下前 <strong>${countToFetch}</strong> 名学生，防止上线生波动下滑。`;
    }

    // 4. 截取名单
    let candidates = below.slice(0, countToFetch);

    if (candidates.length === 0) {
        return alert("线下没有更多学生可供挖掘了。");
    }

    // 5. 计算全镇各科均分 (作为诊断弱科的基准)
    const gradeStatsRows = (typeof filterRowsToTownshipSchools === 'function')
        ? filterRowsToTownshipSchools(RAW_DATA || [])
        : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    const gradeStats = {};
    SUBJECTS.forEach(sub => {
        const allScores = gradeStatsRows.map(s => s.scores[sub]).filter(v => typeof v === 'number');
        gradeStats[sub] = allScores.reduce((a, b) => a + b, 0) / (allScores.length || 1);
    });

    // 6. 深度分析每一位候选人 (计算差距 + 找弱科)
    candidates = candidates.map(s => {
        // A. 计算差距
        const scoreGap = lineScore - s.total;

        // 1. 确定计分科目范围 (避免政治等不计入总分的科目被错误推荐)
        // 逻辑：如果是9年级模式，CONFIG.totalSubs 只有[语,数,英,物,化]
        let validSubjects = SUBJECTS;
        if (CONFIG && Array.isArray(CONFIG.totalSubs)) {
            validSubjects = CONFIG.totalSubs;
        }

        // 2. 辅助函数：获取带老师姓名的学科名 (例如: "物理(张师)")
        const getSubWithTeacher = (sub) => {
            // 键名格式参考 generateTeacherInputs 函数: "班级_学科"
            const teacherKey = `${s.class}_${sub}`;
            let teacher = TEACHER_MAP[teacherKey];
            if (teacher) {
                // 只取姓氏以节省空间，如 "张老师" -> "张"
                const surname = teacher.charAt(0);
                return `${sub}<small style="color:#666; font-size:0.9em;">(${surname}师)</small>`;
            }
            return sub;
        };

        // 3. 遍历计算所有有效科目的分差
        let allDiffs = [];  // 存储所有科目差值 (用于挖掘潜力)
        let hardWeakness = []; // 存储明显弱项 (低于均分5分)

        validSubjects.forEach(sub => {
            if (s.scores[sub] !== undefined) {
                // 核心算法：学生分数 - 年级均分 (正数=优势，负数=劣势)
                const diff = s.scores[sub] - gradeStats[sub];
                const item = { name: sub, diff: diff };

                allDiffs.push(item);

                // 阈值判定：低于均分 5 分算“硬伤”，需要优先补救
                if (diff < -5) {
                    hardWeakness.push(item);
                }
            }
        });

        // 按差值升序排序 (数值越小/越负，排在越前面，代表越需要补)
        allDiffs.sort((a, b) => a.diff - b.diff);
        hardWeakness.sort((a, b) => a.diff - b.diff);

        let worstSubName = "";
        let worstSubDiff = "";

        // 4. 决策逻辑：是补短板，还是挖潜力？
        if (hardWeakness.length > 0) {
            // 🛑 情况A：有明显弱科 (有科目低于均分5分) -> 显示最差的 2 科
            const targets = hardWeakness.slice(0, 2);

            worstSubName = targets.map(t => getSubWithTeacher(t.name)).join("、");
            worstSubDiff = targets.map(t => t.diff.toFixed(1)).join(" / ");
        } else {
            // 💡 情况B：无明显弱科 (各科都还行，但总分未达标) -> 强制挖掘相对最弱的 2 科作为潜力点
            const targets = allDiffs.slice(0, 2);

            if (targets.length > 0) {
                // 加个 "潜力:" 前缀提示班主任这是相对弱项，不是绝对差
                worstSubName = "<span style='font-size:10px; color:#666; border:1px solid #ccc; padding:0 2px; border-radius:2px; margin-right:2px;'>潜力</span>" +
                    targets.map(t => getSubWithTeacher(t.name)).join("、");

                // 显示分差 (正数加+号，提示老师其实这科可能已经高于均分了，只是在个人维度里算短板)
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

    // 7. 构建弹窗内容
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
        // 样式逻辑
        const isBalanced = c.worstSub.includes("潜力"); // 匹配"潜力"关键字
        const subStyle = isBalanced ? "color:#64748b; font-size:12px;" : "color:#b91c1c; font-weight:bold;";
        const diffStyle = isBalanced ? "color:#64748b;" : "color:#b91c1c; font-weight:bold;";

        // 🟢 计算进度百分比 (用于画进度条)
        // 比如 目标490，考了485 -> 进度 98.9%
        const percent = Math.min(100, (c.total / lineScore) * 100).toFixed(1);

        // 🟢 进度条颜色：越接近目标越红(警示/冲刺)，或者用绿色表示健康度？
        // 这里用黄色到绿色的渐变概念：>98% 用橙色(只差一口气)，<95% 用蓝色
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

    // 8. 调用通用弹窗显示
    ensureDrillModalDom();
    document.getElementById('drill-title').innerText = title;
    document.getElementById('drill-back-btn').classList.add('hidden');
    document.getElementById('drill-content').innerHTML = html;

    // 底部统计：按班级汇总潜力生人数，方便主任平衡各班指标
    // 简单的 reduce 统计
    const classCount = {};
    candidates.forEach(c => { classCount[c.class] = (classCount[c.class] || 0) + 1; });
    const classSummary = Object.entries(classCount)
        .map(([cls, cnt]) => `${cls}班:${cnt}人`)
        .join('， ');

    document.getElementById('drill-footer').innerText = `各班潜力生分布：${classSummary} (请平衡各班指标压力)`;

    // 🟢 关键：将计算好的 candidates 数组传给 DrillSystem，并标记类型为 'gap'
    DrillSystem.exportData = {
        type: 'gap',
        fileName: title, // 使用弹窗标题作为文件名
        data: candidates
    };

    // 🟢 确保导出按钮显示
    const exportBtn = document.getElementById('drill-export-btn');
    if (exportBtn) exportBtn.classList.remove('hidden');

    document.getElementById('drill-modal').style.display = 'flex';
}

function calcSummary(isSilent = false) {
    const isGrade9 = CONFIG.name && CONFIG.name.includes('9');

    if (isGrade9 && typeof calcIndicators === 'function') {
        try {
            calcIndicators(true);
        } catch (e) {
            console.warn('[calcSummary] 指标生静默重算失败:', e);
        }
    }

    const hasSummaryScopeHelper = typeof listAvailableSchoolsForCompare === 'function';
    const summarySchoolNames = hasSummaryScopeHelper
        ? listAvailableSchoolsForCompare()
        : Object.keys(SCHOOLS || {});
    const summarySchoolSet = new Set((summarySchoolNames || []).map(name => String(name || '').trim()).filter(Boolean));

    // 1. 汇总各项得分 (仅乡镇学校)
    const list = Object.values(SCHOOLS || {}).filter(s => (
        hasSummaryScopeHelper
            ? (typeof isTownshipManagedSchool === 'function'
                ? isTownshipManagedSchool(s?.name, Object.keys(SCHOOLS || {}))
                : summarySchoolSet.has(String(s?.name || '').trim()))
            : true
    )).map(s => {
        const s1 = s.score2Rate || 0;  // 两率一分
        const s2 = s.scoreBottom || 0; // 后1/3
        const s3 = isGrade9 ? (s.scoreInd || 0) : 0;    // 指标生仅9年级参与

        let s4 = 0; // 高分段赋分
        if (isGrade9 && s.highScoreStats) {
            s4 = s.highScoreStats.score || 0;
        }

        const total = s1 + s2 + s3 + s4;
        return { name: s.name, s1, s2, s3, s4, total };
    });

    // 2. 排序 (按综合总分降序)
    list.sort((a, b) => b.total - a.total).forEach((d, i) => d.rank = i + 1);

    // 3. 动态生成表头
    const thead = document.querySelector('#tb-summary thead');
    let theadHtml = `<tr><th>学校名称</th><th>两率一分得分</th><th>后1/3得分</th>`;
    if (isGrade9) theadHtml += `<th>指标生得分</th>`;
    if (isGrade9) theadHtml += `<th style="color:#b45309; background:#fff7ed;">高分段赋分(70)</th>`;
    theadHtml += `<th>综合总分</th><th>总排名</th></tr>`;
    thead.innerHTML = theadHtml;

    // 4. 生成表格内容 (遍历所有，无截断)
    let html = '';
    list.forEach(d => {
        const isMySchool = sameAppSchoolName(d.name, MY_SCHOOL);
        let indicatorCell = '';
        if (isGrade9) indicatorCell = `<td data-label="指标生得分">${d.s3.toFixed(2)}</td>`;
        let highScoreCell = '';
        if (isGrade9) highScoreCell = `<td data-label="高分段赋分" style="color:#b45309; background:#fff7ed; font-weight:bold;">${d.s4.toFixed(2)}</td>`;
        const rankClass = ['rank-cell', d.rank === 1 ? 'r-1' : '', d.rank === 2 ? 'r-2' : '', d.rank === 3 ? 'r-3' : '']
            .filter(Boolean)
            .join(' ');

        html += `<tr class="${isMySchool ? 'bg-highlight' : ''}">
                <td data-label="学校名称">${d.name}</td>
                <td data-label="两率一分得分">${d.s1.toFixed(2)}</td>
                <td data-label="后1/3得分">${d.s2.toFixed(2)}</td>
                ${indicatorCell}
                ${highScoreCell}
                <td data-label="综合总分" class="text-red" style="font-size:16px; font-weight:bold;">${d.total.toFixed(2)}</td>
                <td data-label="总排名" class="${rankClass}">${d.rank}</td>
            </tr>`;
    });
    document.querySelector('#tb-summary tbody').innerHTML = html;

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
    const schoolList = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare() : Object.keys(SCHOOLS || {});
    schSel.innerHTML = `<option value="ALL">全乡镇</option>${schoolList.map(s => `<option value="${s}">${s}</option>`).join('')}`; if (oldSch && (oldSch === 'ALL' || SCHOOLS[oldSch])) schSel.value = oldSch;
    const oldSub = subSel.value; subSel.innerHTML = `<option value="total">总分</option>${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('')}`; if (oldSub) subSel.value = oldSub;
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
    const subject = document.getElementById('segSubjectSelect').value;
    const step = parseInt(document.getElementById('segStep').value) || 10;

    const townshipRows = (typeof filterRowsToTownshipSchools === 'function') ? filterRowsToTownshipSchools(RAW_DATA || []) : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    let students = school === 'ALL' ? townshipRows : (SCHOOLS[school] ? SCHOOLS[school].students : []);
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

    // 🟢 准备图表数据容器
    const rowsData = []; // 临时存储数据以便后续给图表使用

    // 从高到低遍历生成表格
    for (let high = topCeil; high > 0; high -= step) {
        const low = high - step;
        const isTopBucket = high === topCeil;
        const bucketList = validStudents.filter(s => {
            const val = s._filterScore;
            return val >= low && (isTopBucket ? val <= high : val < high);
        });
        const count = bucketList.length;

        // 优化：去掉两头均为0的空行，但保留中间的0以体现断层
        if (count === 0 && cumulative === 0) continue;

        cumulative += count;

        const label = `${low}-${high}`;

        html += `<tr><td>${label} 分</td><td>${count}</td><td>${cumulative}</td><td>${(count / total * 100).toFixed(2)}%</td><td>${(cumulative / total * 100).toFixed(2)}%</td></tr>`;

        // 收集图表数据 (使用 unshift 存入头部，保证图表是从低分到高分排列，符合直方图习惯)
        rowsData.unshift({
            label: label,
            count: count,
            studentList: bucketList // 👈 关键：保存该分数段的学生名单
        });
    }

    document.getElementById('tb-segment').innerHTML = html + `</tbody>`;

    // 🟢 绘制图表核心逻辑
    const ctx = document.getElementById('segmentChart');
    if (ctx) {
        // 如果已有图表实例，先销毁，防止重影
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
                    // 增加一条平滑曲线 (趋势线)
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

                    // 获取被点击的数据点索引
                    const index = elements[0].index;
                    const dataItem = rowsData[index];

                    if (dataItem && dataItem.count > 0) {
                        // 调用 DrillSystem (钻取系统) 显示该分数段的学生名单
                        // 标题如：全镇 语文 分数段详情 (110-120)
                        const title = `${school === 'ALL' ? '全镇' : school} ${subject} 分数段详情 (${dataItem.label})`;
                        DrillSystem.open(title, dataItem.studentList);
                    } else {
                        UI.toast('该分数段暂无学生', 'info');
                    }
                },
                onHover: (event, chartElement) => {
                    // 鼠标悬停时变成小手图标，提示可点击
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

// 1. 初始化下拉框
function updateSubjectBalanceSelects() {
    const schSel = document.getElementById('sbSchoolSelect');
    const clsSel = document.getElementById('sbClassSelect');

    const schoolList = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare() : Object.keys(SCHOOLS || {});
    schSel.innerHTML = `<option value="">--请选择学校--</option>${schoolList.map(s => `<option value="${s}">${s}</option>`).join('')}`;
    const currentSchool = readCurrentSchool();
    const matched = Array.from(schSel.options || []).find(option => sameAppSchoolName(option.value, currentSchool));
    if (matched) schSel.value = matched.value;

    // 联动更新班级
    schSel.onchange = () => {
        const schoolRecord = getAppSchoolRecord(schSel.value);
        const classes = schoolRecord ? [...new Set((schoolRecord.students || []).map(s => s.class))].sort() : [];
        clsSel.innerHTML = `<option value="">全部</option>${classes.map(c => `<option value="${c}">${c}</option>`).join('')}`;
    };
    schSel.onchange();
}

let SB_CACHE_DATA = []; // 缓存用于导出

// 2. 渲染主表格
function SB_renderTable() {
    const sch = document.getElementById('sbSchoolSelect').value;
    const cls = document.getElementById('sbClassSelect').value;
    const sortType = document.getElementById('sbSortBy').value;

    if (!sch) return alert("请先选择学校");

    // A. 筛选学生
    const schoolRecord = getAppSchoolRecord(sch);
    if (!schoolRecord || !Array.isArray(schoolRecord.students)) return alert("该学校暂无学生数据");
    let students = schoolRecord.students;
    if (cls && cls !== '全部') students = students.filter(s => s.class === cls);

    // B. 计算全镇各科均分 (作为基准线)
    const gradeStats = SB_getGradeStats();

    // C. 处理每个学生的数据
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

        // 按差值排序：优势在前，劣势在后
        items.sort((a, b) => b.diff - a.diff);

        // 计算偏科指数 (极差)
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

    // D. 排序
    if (sortType === 'total') {
        renderList.sort((a, b) => b.total - a.total);
    } else {
        renderList.sort((a, b) => b.balanceScore - a.balanceScore); // 越不均衡排越前
    }

    SB_CACHE_DATA = renderList; // 存入缓存

    // E. 生成 HTML
    const tbody = document.querySelector('#sb-table tbody');
    let html = '';

    renderList.forEach(row => {
        // 构建可视化条
        // 我们只展示最强的2科和最弱的2科，避免太长，或者展示全部但缩小
        // 为了“一看就懂”，我们展示全部，但用 Flex 布局一行显示

        let barsHtml = `<div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">`;

        row.items.forEach(item => {
            const isStrong = item.diff >= 0;
            const color = isStrong ? '#16a34a' : '#dc2626';
            const bg = isStrong ? '#dcfce7' : '#fee2e2';
            const icon = isStrong ? '📈' : '📉';

            // 仅当差值绝对值大于 5 分时才显著展示，否则作为“平”
            const absDiff = Math.abs(item.diff);
            const barWidth = Math.min(absDiff * 2, 50); // 限制最大宽度

            // 小孩易读的胶囊样式
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

        // 生成简评
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

    // 给每个簇命名
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

// 简单 K-Means 实现
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
        // assignment
        for (let i = 0; i < data.length; i++) {
            let best = 0, bestDist = Infinity;
            for (let c = 0; c < centroids.length; c++) {
                const dist = euclid(data[i], centroids[c]);
                if (dist < bestDist) { bestDist = dist; best = c; }
            }
            labels[i] = best;
        }
        // update
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

// 3. 导出 Excel
function SB_exportExcel() {
    if (!SB_CACHE_DATA.length) return alert("请先生成分析数据");

    const wb = XLSX.utils.book_new();
    const headers = ["班级", "姓名", "总分", "全镇排名", "最强学科", "最强分差", "最弱学科", "最弱分差"];

    // 动态添加所有学科列
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

        // 填充各科分差
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

    // 修复：确保 value 属性被引号包裹，防止学校名中有空格导致截断
    const schoolList = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare() : Object.keys(SCHOOLS || {});
    sel.innerHTML = `<option value="ALL">全乡镇</option>${schoolList.map(s => `<option value="${s}">${s}</option>`).join('')}`;

    // 恢复之前的选择
    if (old && (old === 'ALL' || SCHOOLS[old])) sel.value = old;
}

function renderPotentialAnalysis() {
    if (!RAW_DATA.length) return alert('请先上传数据');
    const scope = document.getElementById('potSchoolSelect').value;
    const topRatio = parseFloat(document.getElementById('potTopSelect').value);

    let candidates = [];
    const townshipRows = (typeof filterRowsToTownshipSchools === 'function')
        ? filterRowsToTownshipSchools(RAW_DATA || [])
        : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
    let scopeStudents = (scope === 'ALL') ? townshipRows : (SCHOOLS[scope]?.students || []);

    // 1. 筛选总分优生
    const totalCount = townshipRows.length || RAW_DATA.length;
    const topRankThreshold = Math.floor(totalCount * topRatio);

    // 2. 遍历优生，计算偏科指数
    scopeStudents.forEach(stu => {
        const tRank = safeGet(stu, 'ranks.total.township', 99999);
        if (tRank === '-' || tRank > topRankThreshold) return;

        // 获取该生的总分相对位置值

        // 如果只有排名数据，回退到 Rank Gap 模式
        // 如果有相对位置数据，使用科目偏离差
        const useAdvancedMetrics = (stu.tScores && stu.totalTScore);

        SUBJECTS.forEach(sub => {
            const subRank = safeGet(stu, `ranks.${sub}.township`, 0);
            if (!subRank) return;

            let isPotential = false;
            let gapVal = 0;
            let gapLabel = '';

            if (useAdvancedMetrics) {
                // 业务逻辑深化：使用科目相对偏离差
                const subT = stu.tScores[sub];
                // 估算学生自身的平均水平
                const validSubCount = Object.values(stu.tScores).filter(v => v > 0).length || 1;
                const selfAvgT = stu.totalTScore / validSubCount;

                // 判定：该科比自己平均水平低 8 分以上，且该科绝对值 < 45 (稍微偏弱)
                if ((selfAvgT - subT) > 8) {
                    isPotential = true;
                    gapVal = (selfAvgT - subT).toFixed(1);
                    gapLabel = `相对偏离 -${gapVal}`;
                }
            } else {
                // 回退逻辑：排名落差法
                // 如果单科排名比总排名 落后 30% 的总人数
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

    // 按偏科严重程度排序
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

    // 1. 导出后1/3 (逻辑不变)
    if (type === 'bottom3') {
        const table = document.getElementById('tb-bottom3');
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.table_to_sheet(table);
        XLSX.utils.book_append_sheet(wb, ws, "核算结果");
        XLSX.writeFile(wb, '后1_3核算结果.xlsx');
        return;
    }

    // 2. 导出指标生 (逻辑更新：从界面表格获取太麻烦，直接重算一遍或者从DOM解析)
    // 为了准确性，我们这里解析刚才生成的表格 DOM，这样所见即所得
    if (type === 'indicator') {
        const table = document.getElementById('tb-indicator');
        if (table.rows.length < 3) return alert("请先点击【开始计算】");

        const wb = XLSX.utils.book_new();

        // 自定义表头数据，因为DOM表头是双层的，直接转换可能格式不好看
        const wsData = [];
        //这一行是合并后的逻辑表头
        wsData.push(["学校",
            "指标一目标", "指标一达标", "指标一基础分", "指标一附加分", "指标一小计",
            "指标二目标", "指标二达标", "指标二基础分", "指标二附加分", "指标二小计",
            "指标总分", "排名"]);

        // 遍历 tbody 获取数据
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            // 解析 "目标/达标" 这种格式
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

    // 设置列宽，让模板稍微好看点
    ws['!cols'] = headers.map(() => ({ wch: 15 }));

    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);

    if (window.UI) UI.toast(`✅ 已下载：${filename}`, "success");
    logAction('下载模板', filename);
}
// Freshman class division and exam arrangement moved to public/assets/js/freshman-exam-runtime.js.
// Grade scheduler moved to public/assets/js/grade-scheduler-runtime.js.
// 初始化下拉框 (当切换到此 Tab 时调用)
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

    // 填充科目 (保留总分选项)
    subSel.innerHTML = `<option value="total">🏆 总分光荣榜</option>${SUBJECTS.map(s => `<option value="${s}">📘 ${s}单科状元</option>`).join('')}`;
    subSel.value = (prevSubject === 'total' || SUBJECTS.includes(prevSubject)) ? prevSubject : 'total';

    // 默认触发一次班级更新
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
    // 移除旧主题
    canvas.classList.remove('theme-red', 'theme-blue', 'theme-tech');
    // 添加新主题
    canvas.classList.add(`theme-${themeName}`);

    // 更新按钮状态
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

    // 1. 筛选数据
    let students = schoolRecord.students;
    if (cls) students = students.filter(s => s.class === cls);

    // 2. 排序数据
    const getScore = (s) => (sub === 'total') ? s.total : (s.scores[sub] || -1);

    // 过滤掉没成绩的
    let list = students.filter(s => getScore(s) >= 0);
    list.sort((a, b) => getScore(b) - getScore(a));

    // 截取前N名
    list = list.slice(0, limit);

    // 3. 更新标题
    const titleEl = canvas.querySelector('.p-title');
    const subTitleEl = canvas.querySelector('.p-sub');
    if (titleEl) titleEl.innerText = customTitle;
    if (subTitleEl) subTitleEl.innerText = customSub || `${sch} ${cls || '全年级'} ${sub === 'total' ? '总分' : sub}前${limit}名`;

    // 4. 渲染列表
    let html = '';

    if (list.length === 0) {
        html = '<div style="text-align:center; padding:50px;">暂无数据</div>';
    } else {
        list.forEach((s, i) => {
            const scoreVal = getScore(s);
            // 仅在前3名显示特殊图标，其他显示数字
            let rankDisplay = i + 1;
            // 为了通用性，这里用纯数字+CSS样式控制

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

    // 防止截图时文字被截断或错位，先临时锁定宽高
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
            // 恢复样式
            canvasDiv.style.transform = originalTransform;

            // 下载
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

// ================== 临界生精准推送逻辑 ==================
function updateMpSchoolSelect() {
    const sel = document.getElementById('mpSchoolSelect');
    if (!sel) return;
    const old = sel.value;
    const schoolList = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare() : Object.keys(SCHOOLS || {});
    sel.innerHTML = `<option value="">--请选择学校--</option>${schoolList.map(s => `<option value="${s}">${s}</option>`).join('')}`;
    const currentSchool = old || readCurrentSchool();
    const matched = Array.from(sel.options || []).find(option => sameAppSchoolName(option.value, currentSchool));
    if (matched) sel.value = matched.value;
    updateMpClassSelect();
    const subSel = document.getElementById('mpSubjectSelect'); const oldSub = subSel.value;
    subSel.innerHTML = `<option value="ALL">全部学科</option>${SUBJECTS.map(s => `<option value="${s}">${s}</option>`).join('')}`;
    if (oldSub) subSel.value = oldSub;
}

function updateMpClassSelect() {
    const schEl = document.getElementById('mpSchoolSelect');
    const clsSel = document.getElementById('mpClassSelect');
    if (!schEl || !clsSel) return;
    const sch = schEl.value;
    const schoolRecord = getAppSchoolRecord(sch);
    const classes = (sch && schoolRecord) ? [...new Set((schoolRecord.students || []).map(s => s.class))].sort() : [];
    clsSel.innerHTML = `<option value="">全部班级</option>${classes.map(c => `<option value="${c}">${c}</option>`).join('')}`;
}

function generateMarginalTickets() {
    const sch = document.getElementById('mpSchoolSelect').value; const clsLimit = document.getElementById('mpClassSelect').value; const subLimit = document.getElementById('mpSubjectSelect').value; const gap = parseFloat(document.getElementById('mpGap').value) || 5; const type = document.getElementById('mpType').value;
    const schoolRecord = getAppSchoolRecord(sch);
    if (!sch || !schoolRecord || !Array.isArray(schoolRecord.students)) return alert("请先选择学校");
    MP_DATA_CACHE = []; const container = document.getElementById('mp-tickets-container'); container.innerHTML = '';
    let students = schoolRecord.students; if (clsLimit) students = students.filter(s => s.class === clsLimit);
    let subjectsToAnalyze = (subLimit === 'ALL') ? SUBJECTS : [subLimit]; let taskMap = {};
    students.forEach(stu => {
        subjectsToAnalyze.forEach(sub => {
            if (stu.scores[sub] === undefined) return;
            const excLine = THRESHOLDS[sub].exc; const passLine = THRESHOLDS[sub].pass; const score = stu.scores[sub];
            let category = null; let targetScore = 0; let diff = 0;
            if (type !== 'pass') { if (score >= (excLine - gap) && score < excLine) { category = '拟优'; targetScore = excLine; diff = excLine - score; } }
            if (!category && type !== 'exc') { if (score >= (passLine - gap) && score < passLine) { category = '拟合格'; targetScore = passLine; diff = passLine - score; } }
            if (category) {
                if (!taskMap[stu.class]) taskMap[stu.class] = {}; if (!taskMap[stu.class][sub]) taskMap[stu.class][sub] = [];
                taskMap[stu.class][sub].push({ name: stu.name, score: score, category: category, target: targetScore, diff: parseFloat(diff.toFixed(1)), rank: safeGet(stu, `ranks.${sub}.class`, '-') });
            }
        });
    });
    let hasData = false;
    const marginalTicketRows = [];
    Object.keys(taskMap).sort().forEach(className => {
        Object.keys(taskMap[className]).forEach(subject => {
            const list = taskMap[className][subject]; if (list.length === 0) return; hasData = true;
            list.sort((a, b) => a.diff - b.diff);
            list.forEach(item => { MP_DATA_CACHE.push({ school: sch, class: className, subject: subject, name: item.name, score: item.score, category: item.category, target: item.target.toFixed(1), diff: item.diff }); });
            const teacherKey = `${className}_${subject}`; const teacherName = TEACHER_MAP[teacherKey] || "科任老师";
            const rows = list.map(item => {
                let gapClass = 'gap-green'; if (item.diff > gap / 2) gapClass = 'gap-orange'; if (item.diff > gap * 0.8) gapClass = 'gap-red';
                let catStyle = item.category === '拟优' ? 'color:var(--primary);font-weight:bold;' : 'color:#b45309;';
                let warningTag = '';
                const uid = sch + "_" + item.name;
                if (ROLLER_COASTER_STUDENTS.includes(uid)) {
                    warningTag = '<br><span style="background:#fee2e2; color:#b91c1c; font-size:10px; padding:1px 3px; border-radius:3px;">⚠️ 需心理干预</span>';
                }
                return `<tr><td style="text-align:left; font-weight:bold;">${item.name}${warningTag}</td><td>${item.score}</td><td style="${catStyle}">${item.category}</td><td><span class="tag-gap ${gapClass}">差 ${item.diff}分</span></td><td style="color:#999;">${item.rank}</td><td><div class="chk-box"></div></td></tr>`;
            }).join('');
            marginalTicketRows.push(`<div class="task-ticket"><div class="ticket-header"><div><div class="ticket-title">${subject} · ${className}</div><div class="ticket-sub">教师: ${teacherName} | 目标人数: ${list.length}人</div></div><div style="text-align:right;"><i class="ti ti-clipboard-check" style="font-size:24px; color:#cbd5e1;"></i></div></div><div class="ticket-body"><table class="ticket-table"><thead><tr><th style="text-align:left;">学生姓名</th><th>当前分</th><th>目标</th><th>差距</th><th>班排</th><th>辅导</th></tr></thead><tbody>${rows}</tbody></table><div style="padding:8px; font-size:11px; color:#999; border-top:1px dashed #eee; text-align:center;">🎯 目标线参考: 优秀≥${THRESHOLDS[subject].exc.toFixed(1)} / 及格≥${THRESHOLDS[subject].pass.toFixed(1)}</div></div></div>`);
        });
    });
    container.innerHTML = hasData
        ? marginalTicketRows.join('')
        : `<div style="grid-column:1/-1; text-align:center; padding:50px;"><p>🔍 在当前设定范围内（${gap}分）未找到符合条件的临界生。</p><p style="color:#999;">请尝试增大“临界分值”或切换目标类型。</p></div>`;
}

function printMarginalTickets() { if (document.getElementById('mp-tickets-container').children.length === 0) return alert("请先生成任务单"); window.print(); }
function exportMarginalTasks() {
    if (MP_DATA_CACHE.length === 0) return alert("请先生成数据");
    const wb = XLSX.utils.book_new(); const data = [['学校', '班级', '学科', '姓名', '当前分数', '临界类型', '目标分数', '分差']];
    MP_DATA_CACHE.forEach(d => { data.push([d.school, d.class, d.subject, d.name, d.score, d.category, d.target, d.diff]); });
    const ws = XLSX.utils.aoa_to_sheet(data); ws['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, ws, "临界生辅导名单"); XLSX.writeFile(wb, "临界生精准辅导任务单.xlsx");
}

// --- 临界生闭环管理逻辑 ---

// 1. 初始化下拉框 (页面加载或数据变动时调用)
function MP_initSnapshotSelect() {
    const sel = document.getElementById('mp_snapshot_select');
    if (!sel) return;
    const snapshotOptions = Object.keys(MP_SNAPSHOTS).map(key => {
        const snap = MP_SNAPSHOTS[key];
        const date = new Date(snap.timestamp).toLocaleDateString();
        return `<option value="${key}">${key} (${snap.count}人, ${date})</option>`;
    });
    sel.innerHTML = `<option value="">-- 选择历史任务 --</option>${snapshotOptions.join('')}`;
}
// Hook: 在 switchTab 切换到 marginal-push 时初始化
// (由于无法直接修改 switchTab，我们在保存/删除后手动调用一次即可，首次加载需要用户点击一下或被动触发)
// 为了方便，我们在保存后直接刷新UI

// 2. 存档当前生成的临界生名单
function MP_saveSnapshot() {
    if (!MP_DATA_CACHE || MP_DATA_CACHE.length === 0) return alert("当前没有生成的临界生名单，请先设置参数并点击'生成辅导单'");

    const name = document.getElementById('mp_save_name').value.trim();
    if (!name) return alert("请输入任务名称（例如：初一上期中临界生）");

    if (MP_SNAPSHOTS[name] && !confirm(`任务名 [${name}] 已存在，是否覆盖？`)) return;

    MP_SNAPSHOTS[name] = {
        timestamp: new Date().getTime(),
        count: MP_DATA_CACHE.length,
        data: MP_DATA_CACHE // 结构: {school, class, subject, name, category...}
    };

    localStorage.setItem('MP_SNAPSHOTS', JSON.stringify(MP_SNAPSHOTS));
    alert("✅ 存档成功！下次考试导入数据后，可选择此任务进行转化率分析。");
    MP_initSnapshotSelect();
    document.getElementById('mp_save_name').value = '';
}

// 3. 删除存档
function MP_deleteSnapshot() {
    const key = document.getElementById('mp_snapshot_select').value;
    if (!key) return;
    if (!confirm(`确定删除历史任务 [${key}] 吗？`)) return;

    delete MP_SNAPSHOTS[key];
    localStorage.setItem('MP_SNAPSHOTS', JSON.stringify(MP_SNAPSHOTS));
    MP_initSnapshotSelect();
}

// 4. 计算转化率 (核心)
function MP_analyzeConversion() {
    const key = document.getElementById('mp_snapshot_select').value;
    if (!key) return alert("请选择一个历史任务进行对比");
    if (RAW_DATA.length === 0) return alert("请先上传【本次考试】的成绩数据");

    const snapshot = MP_SNAPSHOTS[key];
    const oldList = snapshot.data;

    // 统计容器: key = "School_Class_Subject_Category"
    const stats = {};

    oldList.forEach(task => {
        // 唯一标识：班级+学科+类型 (如: 701_数学_拟及格)
        // 尝试获取教师名
        const teacherKey = `${task.class}_${task.subject}`;
        const teacherName = TEACHER_MAP[teacherKey] || "未配置";

        const groupKey = `${task.school}::${task.class}::${teacherName}::${task.subject}::${task.category}`;

        if (!stats[groupKey]) {
            stats[groupKey] = {
                school: task.school, className: task.class, teacher: teacherName,
                subject: task.subject, category: task.category,
                total: 0, success: 0
            };
        }

        stats[groupKey].total++;

        // 在本次数据中寻找该学生
        // 匹配逻辑：姓名 + 学校 (防止同名)
        const currStudent = SCHOOLS[task.school]?.students.find(s => s.name === task.name);

        if (currStudent && currStudent.scores[task.subject] !== undefined) {
            const currScore = currStudent.scores[task.subject];
            const thresholds = THRESHOLDS[task.subject]; // 本次考试的划线

            let isSuccess = false;
            // 判断逻辑：
            // 如果当初是“拟优”，现在是否达到“优秀线”？
            // 如果当初是“拟合格”，现在是否达到“及格线”？
            if (task.category === '拟优' && currScore >= thresholds.exc) isSuccess = true;
            if (task.category === '拟合格' && currScore >= thresholds.pass) isSuccess = true;

            if (isSuccess) stats[groupKey].success++;
        }
    });

    // 渲染结果
    const tbody = document.querySelector('#mp_conversion_table tbody');
    let html = '';
    const sortedKeys = Object.keys(stats).sort();

    sortedKeys.forEach(k => {
        const d = stats[k];
        const rate = d.total > 0 ? (d.success / d.total) : 0;
        const ratePct = (rate * 100).toFixed(1) + '%';

        // 评价徽章
        let badge = '';
        if (rate >= 0.8) badge = '<span class="badge" style="background:#16a34a">⭐⭐⭐ 卓越</span>';
        else if (rate >= 0.5) badge = '<span class="badge" style="background:#2563eb">⭐⭐ 良好</span>';
        else if (rate >= 0.2) badge = '<span class="badge" style="background:#f59e0b">⭐ 一般</span>';
        else badge = '<span class="badge" style="background:#dc2626">⚠️ 需反思</span>';

        html += `<tr>
                <td><div style="font-weight:bold;">${d.teacher}</div><div style="font-size:10px;color:#666">${d.className}</div></td>
                <td>${d.subject}</td>
                <td><span style="padding:2px 5px; background:${d.category === '拟优' ? '#dbeafe' : '#fef9c3'}; border-radius:4px; font-size:11px;">${d.category}</span></td>
                <td>${d.total}</td>
                <td style="font-weight:bold; color:#166534;">${d.success}</td>
                <td style="font-weight:bold; font-size:14px;">${ratePct}</td>
                <td>${badge}</td>
            </tr>`;
    });

    if (!html) html = '<tr><td colspan="7" style="text-align:center; padding:20px;">未匹配到任何学生，请检查姓名是否一致。</td></tr>';

    tbody.innerHTML = html;
    document.getElementById('mp-conversion-result').classList.remove('hidden');
}

// 初始化一次
window.addEventListener('load', MP_initSnapshotSelect);

// ================== 考后座位微调 (联动版) ==================
function updateSeatAdjSelects() {
    const schSel = document.getElementById('seatAdjSchoolSelect');
    const clsSel = document.getElementById('seatAdjClassSelect');
    if (!schSel || !clsSel) return;
    const prevSchool = schSel.value;
    const prevClass = clsSel.value;

    // 初始化学校下拉框
    setSingleSelectOptions(
        schSel,
        Object.keys(SCHOOLS || {}).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true })),
        '--请选择学校--',
        prevSchool
    );
    const syncSeatAdjClasses = (preferredClass) => {
        setSingleSelectOptions(clsSel, getSchoolClassOptions(schSel.value), '--请选择班级--', preferredClass);
    };

    // 学校变更 -> 更新班级
    schSel.onchange = () => {
        syncSeatAdjClasses('');
        // 清空学生列表
        setCurrentContextStudentsState([]);
        updateConstraintWidgetsContext('adj'); // 立即更新一次，清空下拉框
    };

    // 班级变更 -> 更新学生名单 (核心修复点)
    clsSel.onchange = () => {
        updateConstraintWidgetsContext('adj');
    };
    syncSeatAdjClasses(prevClass);
    updateConstraintWidgetsContext('adj');
}
function renderSeatGrid() {
    // 仅在座位工作区已生成后才重新渲染（响应行列数输入变化）
    const workspace = document.getElementById('seat-adj-workspace');
    if (workspace && !workspace.classList.contains('hidden')) {
        generateSeatSuggestions();
    }
}

function generateSeatSuggestions() {
    const sch = document.getElementById('seatAdjSchoolSelect').value;
    const cls = document.getElementById('seatAdjClassSelect').value;
    if (!sch || !cls) return alert("请先选择学校和班级");

    let students = [];
    const schoolRecord = getAppSchoolRecord(sch);
    if (schoolRecord && schoolRecord.students) {
        students = JSON.parse(JSON.stringify(schoolRecord.students.filter(s => s.class === cls)));
    }
    if (!students.length) return alert("该班级无学生数据");

    const diffInput = parseConstraintStr(document.getElementById('adj_c_diff').value);
    const visionInput = parseConstraintStr(document.getElementById('adj_c_vision').value);
    const psyInput = parseConstraintStr(document.getElementById('adj_c_psy').value);
    const talkInput = parseConstraintStr(document.getElementById('adj_c_talk').value);
    const conflictInput = parseConflictStr(document.getElementById('adj_c_conflict').value);

    const hasInputs = (diffInput.length || visionInput.length || psyInput.length || talkInput.length || conflictInput.length);
    if (!hasInputs) {
        if (!confirm("您未输入任何特殊情况约束（如视力、难管、矛盾等）。\n确定要按纯成绩生成座次吗？")) return;
    }

    students.forEach(s => {
        s._isDiff = false; s._isVision = false; s._isPsy = false; // Reset
        if (diffInput.includes(s.name) || talkInput.includes(s.name)) s._isDiff = true;
        if (psyInput.includes(s.name)) s._isPsy = true;
        if (visionInput.includes(s.name)) s._isVision = true;
    });

    students.sort((a, b) => b.total - a.total);
    const total = students.length;
    const strategy = document.getElementById('seatAdjStrategy').value;
    const groupsCount = parseInt(document.getElementById('seatAdjGroups').value) || 2;
    const colsPerGroup = parseInt(document.getElementById('seatAdjCols').value) || 4;

    let seatList = [];
    let strategyText = "";

    if (strategy === 'conversion') {
        strategyText = "【A带C，B带D】将学生按成绩分为4层。A层(优)与C层(潜)同桌，B层(良)与D层(后)同桌。旨在通过优生拉动临界生。";
        let quarter = Math.ceil(total / 4);
        let A = students.slice(0, quarter);
        let B = students.slice(quarter, quarter * 2);
        let C = students.slice(quarter * 2, quarter * 3);
        let D = students.slice(quarter * 3);

        let maxLen = Math.max(A.length, B.length, C.length, D.length);
        for (let i = 0; i < maxLen; i++) {
            if (i < A.length) seatList.push(A[i]);
            if (i < C.length) seatList.push(C[i]);
            if (i < B.length) seatList.push(B[i]);
            if (i < D.length) seatList.push(D[i]);
        }
    } else if (strategy === 'balanced') {
        strategyText = "【4人均分平衡】S型蛇形排列，确保每4人小组（2x2区域）的平均分尽可能一致，适合开展小组PK机制。";
        seatList = [...students];
    } else {
        strategyText = "【传统互助】第1名与最后1名同桌。";
        let left = 0, right = total - 1;
        while (left <= right) {
            if (left === right) { seatList.push(students[left]); }
            else { seatList.push(students[left]); seatList.push(students[right]); }
            left++; right--;
        }
    }

    if (visionInput.length > 0) {
        const visions = seatList.filter(s => s._isVision);
        const others = seatList.filter(s => !s._isVision);
        seatList = [...visions, ...others];
    }

    if (conflictInput.length > 0) {
        for (let k = 0; k < 3; k++) {
            conflictInput.forEach(pair => {
                const idx1 = seatList.findIndex(s => s.name === pair[0]);
                const idx2 = seatList.findIndex(s => s.name === pair[1]);
                if (idx1 !== -1 && idx2 !== -1 && Math.abs(idx1 - idx2) <= 1) {
                    const safeIdx = Math.floor(seatList.length * 0.75);
                    if (safeIdx < seatList.length && safeIdx !== idx1) {
                        [seatList[idx2], seatList[safeIdx]] = [seatList[safeIdx], seatList[idx2]];
                    }
                }
            });
        }
    }

    document.getElementById('seat-strategy-desc').innerText = strategyText;
    const container = document.getElementById('seat-adj-container');
    const countDisplay = document.getElementById('seat-count-display');
    container.innerHTML = '';
    document.getElementById('seat-adj-workspace').classList.remove('hidden');
    countDisplay.innerHTML = `当前班级：${cls} | 总人数：${total} 人`;

    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${groupsCount}, 1fr)`;
    container.style.gap = '50px';
    container.style.alignItems = 'start';

    const rowCapacity = groupsCount * colsPerGroup;
    const totalRows = Math.ceil(seatList.length / rowCapacity);

    const groupEls = [];
    for (let g = 0; g < groupsCount; g++) {
        const gel = document.createElement('div'); gel.className = 'seat-group';
        gel.style.display = 'grid'; gel.style.gridTemplateColumns = `repeat(${colsPerGroup}, 1fr)`;
        gel.style.gap = '10px'; gel.style.position = 'relative';
        groupEls.push(gel); container.appendChild(gel);
    }

    for (let r = 0; r < totalRows; r++) {
        for (let g = 0; g < groupsCount; g++) {
            for (let c = 0; c < colsPerGroup; c++) {
                let idx = r * rowCapacity + g * colsPerGroup + c;
                if (strategy === 'balanced' && r % 2 !== 0) { idx = r * rowCapacity + g * colsPerGroup + (colsPerGroup - 1 - c); }

                if (idx < seatList.length) {
                    const stu = seatList[idx];
                    const desk = document.createElement('div');
                    desk.className = 'desk';

                    const originalRank = students.findIndex(x => x.name === stu.name);
                    const rankPct = (originalRank + 1) / total;
                    if (rankPct <= 0.25) desk.classList.add('desk-rank-A'); else if (rankPct <= 0.5) desk.classList.add('desk-rank-B'); else if (rankPct <= 0.75) desk.classList.add('desk-rank-C'); else desk.classList.add('desk-rank-D');

                    if (stu._isDiff) desk.classList.add('is-diff');
                    if (stu._isVision) desk.style.border = "2px solid #3b82f6";
                    if (stu._isPsy) desk.style.border = "2px dashed #ec4899";

                    desk.draggable = true;
                    desk.innerHTML = `<div class="desk-name">${stu.name}</div><div class="desk-info">${stu.total}分</div>`;

                    desk.ondragstart = (e) => { e.dataTransfer.setData('text/html', desk.outerHTML); desk.classList.add('dragging'); window.dragSrcEl = desk; };
                    desk.ondragover = (e) => { e.preventDefault(); };
                    desk.ondrop = (e) => {
                        e.preventDefault();
                        if (window.dragSrcEl !== desk) {
                            const srcHTML = window.dragSrcEl.innerHTML; const srcClass = window.dragSrcEl.className; const srcStyle = window.dragSrcEl.style.cssText;
                            window.dragSrcEl.innerHTML = desk.innerHTML; window.dragSrcEl.className = desk.className; window.dragSrcEl.style.cssText = desk.style.cssText;
                            desk.innerHTML = srcHTML; desk.className = srcClass; desk.style.cssText = srcStyle;
                        }
                        window.dragSrcEl.classList.remove('dragging');
                    };
                    groupEls[g].appendChild(desk);
                } else {
                    const emptyDesk = document.createElement('div'); emptyDesk.style.visibility = 'hidden'; groupEls[g].appendChild(emptyDesk);
                }
            }
        }
    }

    for (let g = 0; g < groupsCount; g++) {
        const gel = groupEls[g];
        if (colsPerGroup % 2 === 0) {
            for (let r = 0; r < totalRows; r += 2) {
                for (let c = 0; c < colsPerGroup; c += 2) {
                    const box = document.createElement('div'); box.className = 'learning-group-box';
                    box.style.left = `${c * 90 - 5}px`; box.style.top = `${r * 65 - 5}px`; box.style.width = `175px`; box.style.height = `125px`;
                    box.innerHTML = `<div class="learning-group-label">小组 ${g + 1}-${Math.ceil((c + 1) / 2) + (r / 2) * (colsPerGroup / 2)}</div>`;
                    gel.appendChild(box);
                }
            }
        }
    }

    if (strategy === 'balanced') document.getElementById('seat-stats').innerText = "提示：虚线框内为4人学习共同体，建议设立组长负责制，实行组间积分PK。";
    else document.getElementById('seat-stats').innerText = "";
}

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

// ================== [新增] 智能标签输入组件逻辑 ==================
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
    // 根据类型获取对应的下拉框 ID
    const idA = type === 'adj' ? 'conflict_sel_a' : 'fb_conflict_sel_a';
    const idB = type === 'adj' ? 'conflict_sel_b' : 'fb_conflict_sel_b';
    const wrapperId = type === 'adj' ? 'widget_adj_conflict' : 'widget_fb_conflict';
    const hiddenId = type === 'adj' ? 'adj_c_conflict' : 'fb_c_conflict';

    const selA = document.getElementById(idA);
    const selB = document.getElementById(idB);

    // 校验选择
    if (!selA || !selB) return console.error("找不到下拉框元素");
    if (!selA.value || !selB.value) return alert("请先选择两个学生");
    if (selA.value === selB.value) return alert("不能选择同一个学生");

    // 添加到标签栏
    addTagToWidget(wrapperId, hiddenId, `${selA.value}&${selB.value}`);

    // 重置选项
    selA.value = "";
    selB.value = "";
}

function updateConstraintWidgetsContext(type) {
    let students = [];

    // 1. 获取当前上下文的学生列表
    if (type === 'adj') {
        // 考后排座模式：从学校和班级下拉框获取数据
        const sch = document.getElementById('seatAdjSchoolSelect').value;
        const cls = document.getElementById('seatAdjClassSelect').value;

        const schoolRecord = getAppSchoolRecord(sch);
        if (sch && cls && schoolRecord) {
            // 过滤出该班学生
            students = (schoolRecord.students || []).filter(s => s.class === cls);
        }

        // 更新全局上下文
        setCurrentContextStudentsState(students);

        // 初始化其他标签组件
        ['diff', 'vision', 'psy', 'talk'].forEach(f => {
            initTagWidget(`widget_adj_${f}`, `adj_c_${f}`);
            renderTagsUI(`widget_adj_${f}`, `adj_c_${f}`);
        });
        renderTagsUI('widget_adj_conflict', 'adj_c_conflict');

    } else if (type === 'fb') {
        // 新生分班模式：从当前选中的班级对象获取数据
        if (FB_CUR_CLASS_IDX !== -1 && FB_CLASSES[FB_CUR_CLASS_IDX]) {
            students = FB_CLASSES[FB_CUR_CLASS_IDX].students;
        }

        setCurrentContextStudentsState(students);

        ['diff', 'vision', 'talk'].forEach(f => {
            initTagWidget(`widget_fb_${f}`, `fb_c_${f}`);
            renderTagsUI(`widget_fb_${f}`, `fb_c_${f}`);
        });
        renderTagsUI('widget_fb_conflict', 'fb_c_conflict');

        // ★★★ 新增：初始化“强行绑定”组件 ★★★
        renderTagsUI('widget_fb_bind', 'fb_c_bind');
    }

    // 2. 生成下拉框选项 HTML (统一处理)
    let opts = '<option value="">--点击选择--</option>';
    if (students.length > 0) {
        // 按姓名排序，方便查找
        students.sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
        opts += students.map(s => `<option value="${s.name}">${s.name}</option>`).join('');
    } else {
        opts = '<option value="">(暂无学生数据)</option>';
    }

    // 3. 将选项填充到对应的下拉框中
    if (type === 'fb') {
        // 更新新生分班的“矛盾”下拉框
        const cA = document.getElementById('fb_conflict_sel_a');
        const cB = document.getElementById('fb_conflict_sel_b');
        if (cA && cB) { cA.innerHTML = opts; cB.innerHTML = opts; }

        // ★★★ 新增：更新新生分班的“绑定”下拉框 ★★★
        const bA = document.getElementById('fb_bind_sel_a');
        const bB = document.getElementById('fb_bind_sel_b');
        if (bA && bB) { bA.innerHTML = opts; bB.innerHTML = opts; }

    } else if (type === 'adj') {
        // 更新考后排座的“矛盾”下拉框
        const elA = document.getElementById('conflict_sel_a');
        const elB = document.getElementById('conflict_sel_b');
        if (elA && elB) { elA.innerHTML = opts; elB.innerHTML = opts; }
    }
}

// --- 1. 表格热力图功能 (智能识别横向/纵向 + 强制覆盖本校高亮) ---
function toggleTableHeatmap(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const tables = container.querySelectorAll('table');
    if (!tables.length) return alert("请先生成表格");

    // 切换状态标记
    const isHeatmapOn = container.classList.toggle('heatmap-mode');
    // 判断是否为“乡镇横向对比表” (该表结构特殊：行是指标，列是学校，需行内对比)
    const isHorizontalMode = (containerId === 'horizontal-table');

    tables.forEach(table => {
        if (!isHeatmapOn) {
            // 关闭：清除背景色 (使用 removeProperty 以确保清除 important 样式)
            table.querySelectorAll('td').forEach(td => td.style.removeProperty('background-color'));
            return;
        }

        const rows = Array.from(table.querySelectorAll('tbody tr'));
        if (rows.length === 0) return;

        // 提取数值的辅助函数
        const getVal = (cell) => {
            // 移除 %, +, (排名) 等符号，只取主数值
            const txt = cell.innerText.split('(')[0].replace(/[%+]/g, '').trim();
            return parseFloat(txt);
        };

        // 颜色计算辅助函数
        const applyColorToGroup = (cells, isRankType) => {
            const values = cells.map(c => c.val);
            const max = Math.max(...values);
            const min = Math.min(...values);
            const range = max - min;
            if (range === 0) return;

            cells.forEach(item => {
                let ratio = (item.val - min) / range;
                // 排名(Rank)类数据，数值越小越好(绿) -> ratio应大
                if (isRankType) ratio = 1 - ratio;

                // 仿Excel色阶：低=红, 中=黄, 高=绿
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

                // [修改点] 使用 setProperty(..., 'important') 强制覆盖 .bg-highlight 的 !important 样式
                // 这样热力图颜色会优先显示，但本校的文字颜色和边框依然保留
                item.el.style.setProperty('background-color', `rgb(${r}, ${g}, ${b})`, 'important');
            });
        };

        if (isHorizontalMode) {
            // === 模式 A：行内对比 (适用于乡镇横向对比表) ===
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
            // === 模式 B：列内对比 (适用于班级对比等) ===
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

// --- 2. 学科列筛选功能 ---
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
    // 默认全选
    SUBJECTS.forEach(sub => {
        if (COL_FILTER_STATE[sub] === undefined) COL_FILTER_STATE[sub] = true;

        const label = document.createElement('label');
        label.className = 'filter-check-label';
        label.innerHTML = `<input type="checkbox" value="${sub}" ${COL_FILTER_STATE[sub] ? 'checked' : ''} onchange="applyColFilter(this)"> ${sub}`;
        popover.appendChild(label);
    });

    // 点击外部关闭
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

    // 查找班级对比区域的所有表格
    const container = document.getElementById('class-comp-results');
    const tables = container.querySelectorAll('table');

    // 逻辑：
    // 1. 总分表格 ("两率一分"等) 不受影响，通常保留
    // 2. 单科表格：如果该表格的标题（或上方的小标题）包含未选中的学科名，则隐藏整个表格块

    // 针对当前系统的 DOM 结构：
    // 每个学科是一个 <div id="anchor-class-数学">...<table>...</table></div>

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

    // 另外，如果是针对长表格（如学生明细表）的列筛选，逻辑如下（通用化）：
    // 遍历所有 th，如果 th 文本包含未选中的学科，则隐藏该列
    // 这里主要针对班级对比的单科卡片显隐，已满足“只看语数英”的需求。
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
            // 1. 清空 IndexedDB 存储
            await DB.clear('autosave_backup');

            // 2. 清空 LocalStorage (如果有相关的)
            localStorage.removeItem('FB_DATA_BACKUP');
            localStorage.removeItem('MP_SNAPSHOTS');

            // 3. 刷新页面 -> 触发 onload -> 发现无数据 -> 显示模式选择
            location.reload();
        }
    });
}

// 拦截页面刷新或关闭，防止未保存的数据丢失
window.addEventListener('beforeunload', (e) => {
    // 如果 RAW_DATA 里有数据，说明老师已经导入过文件
    if (RAW_DATA.length > 0) {
        const msg = "系统检测到您有正在处理的成绩数据，刷新或关闭页面将导致配置（如教师名单）丢失。确定离开吗？";
        e.preventDefault();
        e.returnValue = msg; // 现代浏览器大多数会展示其默认的提示语，但必须设置这个值
        return msg;
    }
});
// Voice control moved to public/assets/js/voice-control-runtime.js.
// School profile runtime moved to public/assets/js/school-profile-runtime.js.

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
// 页面加载完成后，强制移除所有 max-height 限制
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

    // SVG 背景水印
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

// === 届别管理 (Cohort) ===
const COHORT_STORAGE_KEY = 'COHORT_LIST';

function getCohortKey(cohortId) {
    if (WorkspaceStateRuntime && typeof WorkspaceStateRuntime.getCohortKey === 'function') {
        return WorkspaceStateRuntime.getCohortKey(cohortId);
    }
    return `cohort::${cohortId}`;
}

function inferCohortIdFromValue(value) {
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
    if (!key) return;
    localStorage.setItem(key, cohortId);
}

function ensureCohortRegistered(cohortId) {
    const id = String(cohortId || '').trim();
    if (!id || typeof CohortManager === 'undefined') return null;
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
    const knownIds = (typeof CohortManager !== 'undefined' && Array.isArray(CohortManager.list))
        ? CohortManager.list.map(item => String(item?.id || '').trim()).filter(Boolean)
        : [];

    if (saved) {
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

function showCohortPicker() {
    const mask = document.getElementById('mode-mask');
    const app = document.getElementById('app');
    prefillMaskCohortYear();
    if (mask) mask.style.display = 'flex';
    if (app) app.classList.add('hidden');
}

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
        CURRENT_COHORT_ID = cohortId;
        CURRENT_COHORT_META = meta;
        syncWorkspaceRuntimeState({
            currentCohortId: cohortId,
            currentCohortMeta: meta,
            currentExamId: CURRENT_EXAM_ID,
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

async function enterCohortFromMask() {
    const year = parseInt(resolveMaskCohortYear(), 10);
    const startGrade = 6;
    if (!year || year < 2000) return alert('请输入有效的入学年份');
    setManualCohortSelectionGate(false);
    await CohortManager.addCohort({ year, startGrade }, { skipConfirm: true, fastEnter: false });
    refreshAuthRoleViewFromSession();
}

function tryAutoEnterReadyCohortWorkspace() {
    const mask = document.getElementById('mode-mask');
    const app = document.getElementById('app');
    if (!mask || !app) return false;
    if (getComputedStyle(mask).display === 'none') return false;
    if (requiresManualCohortSelection()) return false;

    const cohortId = CURRENT_COHORT_ID || readWorkspaceCohortId();
    const examId = CURRENT_EXAM_ID || readWorkspaceExamId();
    const hasReadyData = Array.isArray(RAW_DATA) && RAW_DATA.length > 0;
    if (!cohortId || !examId || !hasReadyData) return false;

    mask.style.display = 'none';
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

// === 考试档案化与封存逻辑 ===
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

// 🟢 [新增]：学期变化时自动加载教师任课数据
function onExamTermChange() {
    const meta = getExamMetaFromUI();
    if (!meta.cohortId || !meta.year || !meta.term) {
        appDebug('⏸️ 学期信息不完整，暂不加载教师数据');
        return;
    }

    // 构建学期ID：年份_学期_年级
    const termId = buildTeacherTermId(meta);
    const baseTerm = getTeacherTermBase(termId);

    appDebug(`📅 学期已选择：${termId}，准备加载教师任课数据...`);

    // 更新学期ID到localStorage，供DataManager使用
    syncTeacherTermStorage(termId);

    // 同步到教师管理界面的学期选择器
    const teacherTermSel = document.getElementById('dm-teacher-term-select');
    if (teacherTermSel) {
        // 查找匹配的选项
        for (let i = 0; i < teacherTermSel.options.length; i++) {
            if (teacherTermSel.options[i].value === termId ||
                teacherTermSel.options[i].value === baseTerm) {
                teacherTermSel.value = teacherTermSel.options[i].value;
                break;
            }
        }
    }

    // 尝试从本地历史加载
    const db = CohortDB.ensure();
    const resolved = resolveTeacherHistoryEntry(termId);

    if (resolved) {
        // 有本地数据
        syncTeacherTermStorage(resolved.key);
        setTeacherMap(JSON.parse(JSON.stringify(resolved.map || {})));
        setTeacherSchoolMap(JSON.parse(JSON.stringify(resolved.schoolMap || {})));
        if (window.DataManager && typeof DataManager.renderTeachers === 'function') {
            DataManager.renderTeachers();
        }
        appDebug(`✅ 已从本地历史加载 ${resolved.key} 的任课表（${Object.keys(resolved.map || {}).length}条）`);
        if (window.UI) UI.toast(`✅ 已加载该学期任课表（${Object.keys(resolved.map || {}).length}条）`, 'success');
    } else {
        // 本地无数据，尝试从云端加载
        appDebug(`⚠️ 本地无 ${baseTerm} 的任课数据，尝试从云端加载...`);
        setTeacherMap({});
        setTeacherSchoolMap({});
        if (window.DataManager && typeof DataManager.renderTeachers === 'function') {
            DataManager.renderTeachers();
        }

        // Avoid forcing a cloud teacher sync during generic startup flows.
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

    // 刷新教师分析
    if (window.DataManager && typeof DataManager.refreshTeacherAnalysis === 'function') {
        DataManager.refreshTeacherAnalysis();
    }
}

function getAutoRestoreExamId(db, cohortId = '') {
    const sourceDb = db && typeof db === 'object' ? db : null;
    if (!sourceDb || !sourceDb.exams || typeof sourceDb.exams !== 'object') return '';
    const normalizedCohortId = String(cohortId || CURRENT_COHORT_ID || readWorkspaceCohortId() || '').trim();
    const entries = Object.values(sourceDb.exams)
        .filter((exam) => {
            const examId = String(exam?.examId || '').trim();
            const rows = Array.isArray(exam?.data) ? exam.data : [];
            if (!examId || rows.length === 0) return false;
            if (!normalizedCohortId) return true;
            const examCohortId = normalizeCompareCohortId(
                exam?.meta?.cohortId
                || (typeof inferCohortIdFromValue === 'function' ? inferCohortIdFromValue(examId) : '')
                || ''
            );
            return !examCohortId || examCohortId === normalizedCohortId;
        })
        .map((exam) => {
            const examId = String(exam?.examId || '').trim();
            const ts = typeof getExamSortTimestamp === 'function'
                ? getExamSortTimestamp(examId, Number(exam?.createdAt || exam?.updatedAt || 0))
                : Number(exam?.createdAt || exam?.updatedAt || 0);
            return { examId, ts };
        });
    if (!entries.length) return '';
    entries.sort((a, b) => {
        if (a.ts !== b.ts) return b.ts - a.ts;
        return String(b.examId || '').localeCompare(String(a.examId || ''), 'zh-CN');
    });
    return entries[0].examId || '';
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
    if (boundSchool) candidateSet.add(boundSchool);
    if (inferredSchool) candidateSet.add(inferredSchool);
    Object.keys(SCHOOLS || {})
        .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'))
        .forEach((school) => {
            const normalized = String(school || '').trim();
            if (normalized) candidateSet.add(normalized);
        });

    const schoolNames = new Set(Object.keys(SCHOOLS || {}).map((school) => String(school || '').trim()).filter(Boolean));
    const fallbackSchool = Array.from(candidateSet).find((school) => schoolNames.has(school)) || '';
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

function tryAutoRestoreWorkspaceExam(options = {}) {
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

    if (preferredExamId && db.exams?.[preferredExamId] && currentRows.length > 0 && preferredMatchesCohort) {
        const preferredMeta = db.exams[preferredExamId].meta || {};
        const effectiveGrade = String(getEffectiveGrade(preferredMeta) || '').trim();
        if (effectiveGrade && String(preferredMeta.grade || '').trim() !== effectiveGrade && typeof CohortDB?.applyExamToWorkspace === 'function') {
            CohortDB.applyExamToWorkspace(preferredExamId, { renderTables: false, recalculate: false });
        }
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
    if (!confirm("⚠️ 封存后将进入只读模式，避免误改历史数据。确定封存吗？")) return;

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

    // 保存真实考试快照，并同步整届工作区
    await saveCloudData({ mode: 'exam' });
    await saveCloudData({ mode: 'workspace' });
    createAutoSnapshot(getCurrentSnapshotPayload());

    writeArchiveLockState(true, key);
    applyExamMetaUI();
    applyArchiveLockUI();
    if (window.UI) UI.toast("✅ 已封存并进入只读模式", "success");
    if (window.Logger) Logger.log('封存考试', `封存考试 ${key}`);
}

function unlockArchive() {
    if (!isArchiveLocked()) return alert("当前未封存");
    if (!confirm("⚠️ 解除封存将允许编辑历史数据，是否继续？")) return;
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

    const uploadBox = document.getElementById('uploadBox');
    if (uploadBox) {
        uploadBox.style.pointerEvents = locked ? 'none' : 'auto';
        uploadBox.style.opacity = locked ? '0.6' : '1';
        uploadBox.title = lockNotice;
    }
    const ids = ['fileInput', 'teacherFileInput', 'projectFileInput', 'btn-reset-system', 'btn-save-project', 'btn-load-project'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.disabled = !!locked;
    });
    if (typeof updateUploadWorkbenchStatus === 'function') updateUploadWorkbenchStatus();
}

// === Cohort DB & Smart Link ===
const CohortDB = {
    ensure: function () {
        if (!COHORT_DB) {
            const runtimeDb = readWorkspaceCohortDb();
            if (runtimeDb && typeof runtimeDb === 'object') {
                COHORT_DB = runtimeDb;
                COHORT_DB.students = COHORT_DB.students || {};
                COHORT_DB.teachingHistory = COHORT_DB.teachingHistory || {};
                COHORT_DB.exams = COHORT_DB.exams || {};
                COHORT_DB.resetPoints = COHORT_DB.resetPoints || [];
                COHORT_DB.currentExamId = COHORT_DB.currentExamId || CURRENT_EXAM_ID || readWorkspaceExamId() || '';
            } else {
                COHORT_DB = {
                    cohortId: CURRENT_COHORT_ID || '',
                    cohortMeta: CURRENT_COHORT_META || null,
                    students: {},
                    teachingHistory: {},
                    exams: {},
                    currentExamId: CURRENT_EXAM_ID || '',
                    resetPoints: []
                };
            }
            syncRuntimeStateToWindow();
        }
        return COHORT_DB;
    },

    isLoaderActive: function () {
        const loader = document.getElementById('global-loader');
        if (!loader) return false;
        return !loader.classList.contains('hidden');
    },

    removeStudentHistoryByExamId: function (examId) {
        const normalizedExamId = String(examId || '').trim();
        if (!normalizedExamId) return 0;
        const db = this.ensure();
        let removed = 0;
        Object.values(db.students || {}).forEach((student) => {
            if (!Array.isArray(student?.history)) return;
            const before = student.history.length;
            student.history = student.history.filter((item) => String(item?.examId || '').trim() !== normalizedExamId);
            removed += before - student.history.length;
            if (String(student.lastExamId || '').trim() === normalizedExamId) {
                const last = student.history[student.history.length - 1] || null;
                student.lastExamId = last?.examId || null;
                student.lastScore = typeof last?.total === 'number' ? last.total : null;
            }
        });
        return removed;
    },

    renderExamList: function () {
        const sel = document.getElementById('exam-history-select');
        if (!sel) {
            scheduleExamSelectorRefresh();
            return;
        }
        const db = this.ensure();
        const exams = Object.values(db.exams || {});
        if (!exams.length) {
            sel.innerHTML = '<option value="">暂无历史考试</option>';
            scheduleExamSelectorRefresh();
            return;
        }
        exams.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        sel.innerHTML = exams.map(ex => `<option value="${ex.examId}">${ex.examId}</option>`).join('');
        if (db.currentExamId) sel.value = db.currentExamId;
        scheduleExamSelectorRefresh();
    },

    loadExamFromSelect: function () {
        const sel = document.getElementById('exam-history-select');
        if (!sel || !sel.value) return;
        const examId = sel.value;
        const ok = this.applyExamToWorkspace(examId);
        if (ok) {
            applyExamMetaUI();
            renderTables();
            updateSchoolSelect();
            updateMySchoolSelect();
            updateStudentSchoolSelect();
            updateMarginalSchoolSelect();
            updateClassSelect();
            updateSegmentSelects();
            updatePotentialSchoolSelect();
            if (typeof updateCorrelationSchoolSelect === 'function') updateCorrelationSchoolSelect();
            updateSeatAdjSelects();
            updateProgressSchoolSelect();
            updateMutualAidSelects();
            updateMpSchoolSelect();
            UI.toast('✅ 已切换到历史考试', 'success');
        }
    },

    syncCurrentExam: async function () {
        if (!CURRENT_COHORT_ID) return;
        if (!CURRENT_EXAM_ID) setCurrentExamMeta();
        if (!CURRENT_EXAM_ID) return;

        const meta = getExamMetaFromUI();
        const db = this.ensure();
        const examId = CURRENT_EXAM_ID;
        const existing = db.exams?.[examId] || null;

        this.removeStudentHistoryByExamId(examId);
        await this.smartLinkStudents(examId, meta);

        db.exams[examId] = {
            examId,
            meta,
            data: JSON.parse(JSON.stringify(RAW_DATA || [])),
            schools: JSON.parse(JSON.stringify(SCHOOLS || {})),
            teacherMap: JSON.parse(JSON.stringify(TEACHER_MAP || {})),
            subjects: JSON.parse(JSON.stringify(SUBJECTS || [])),
            thresholds: JSON.parse(JSON.stringify(THRESHOLDS || {})),
            config: JSON.parse(JSON.stringify(CONFIG || {})),
            fingerprint: computeExamDataFingerprint(RAW_DATA || []),
            createdAt: existing?.createdAt || Date.now(),
            updatedAt: Date.now()
        };
        db.currentExamId = examId;
        const termId = getTermId(meta);
        if (termId) {
            db.teachingHistory = db.teachingHistory || {};
            db.teachingHistory[termId] = JSON.parse(JSON.stringify(TEACHER_MAP || {}));
        }
        this.renderExamList();
        if (meta.resetPoint) {
            db.resetPoints = db.resetPoints || [];
            if (!db.resetPoints.includes(examId)) db.resetPoints.push(examId);
        }
        syncRuntimeStateToWindow();
    },

    applyExamToWorkspace: function (examId, options = {}) {
        const db = this.ensure();
        const exam = db.exams?.[examId];
        if (!exam) return false;
        const hasProcessedSchools = !!(exam.schools && typeof exam.schools === 'object' && Object.keys(exam.schools).length > 0);
        const shouldRecalculate = options.recalculate !== false || !hasProcessedSchools;
        const shouldRenderTables = options.renderTables !== false;
        syncDataRuntimeState({
            rawData: exam.data || [],
            schools: (exam.schools && typeof exam.schools === 'object') ? exam.schools : {},
            subjects: exam.subjects || [],
            thresholds: exam.thresholds || {},
            config: exam.config || readConfigState()
        });
        setTeacherMap(exam.teacherMap || {});

        if (!SCHOOLS || Object.keys(SCHOOLS).length === 0) {
            const rebuiltSchools = {};
            (RAW_DATA || []).forEach(stu => {
                const schoolName = String(stu?.school || '').trim() || '未命名学校';
                if (!rebuiltSchools[schoolName]) {
                    rebuiltSchools[schoolName] = { name: schoolName, students: [], metrics: {}, rankings: {} };
                }
                rebuiltSchools[schoolName].students.push(stu);
            });
            setSchools(rebuiltSchools);
        }

        CURRENT_EXAM_ID = examId;
        writeWorkspaceExamId(examId);
        writeArchiveMeta(exam.meta || {});
        syncRuntimeStateToWindow();
        const effectiveGrade = getEffectiveGrade(exam.meta || {});
        if (effectiveGrade && exam.meta && exam.meta.grade !== effectiveGrade) exam.meta.grade = effectiveGrade;
        const termId = getTermId(exam.meta || {});
        if (termId) writeCurrentTermId(termId);
        applyModeByGrade(effectiveGrade || exam.meta?.grade);

        if (shouldRecalculate && RAW_DATA.length > 0 && typeof processData === 'function') {
            setTimeout(() => {
                processData()
                    .then(() => {
                        if (shouldRenderTables && typeof renderTables === 'function') renderTables();
                        if (typeof updateStatusPanel === 'function') updateStatusPanel();
                    })
                    .catch(err => console.warn('历史考试重算失败:', err));
            }, 0);
        } else if (typeof updateStatusPanel === 'function') {
            setTimeout(() => updateStatusPanel(), 0);
        }

        return true;
    },

    smartLinkStudents: async function (examId, meta) {
        const db = this.ensure();
        const roster = db.students || {};
        const nameIndex = {};

        Object.values(roster).forEach(stu => {
            if (!nameIndex[stu.name]) nameIndex[stu.name] = [];
            nameIndex[stu.name].push(stu);
        });

        const conflicts = [];

        RAW_DATA.forEach(stu => {
            const name = String(stu.name || '').trim();
            if (!name) return;
            const candidates = nameIndex[name] || [];
            if (candidates.length === 0) {
                const uuid = this.createUUID();
                const rec = {
                    uuid,
                    name,
                    status: 'transfer_in',
                    history: [],
                    lastScore: null,
                    lastExamId: null
                };
                roster[uuid] = rec;
                stu.uuid = uuid;
            } else if (candidates.length === 1) {
                const target = candidates[0];
                stu.uuid = target.uuid;
            } else {
                conflicts.push({ current: stu, candidates });
            }
        });

        if (conflicts.length) {
            if (this.isLoaderActive()) {
                this.autoResolveConflicts(conflicts);
                if (window.UI) UI.toast(`⚠️ 检测到 ${conflicts.length} 条重名，已按分数最接近自动匹配`, 'warning');
            } else {
                await this.resolveConflicts(conflicts);
            }
        }

        RAW_DATA.forEach(stu => {
            if (!stu.uuid) return;
            const rec = roster[stu.uuid];
            if (!rec) return;
            rec.name = stu.name;
            rec.lastScore = typeof stu.total === 'number' ? stu.total : null;
            rec.lastExamId = examId;
            rec.history = rec.history || [];
            rec.history.push({ examId, class: stu.class, school: stu.school, total: stu.total });
        });

        db.students = roster;
        syncRuntimeStateToWindow();
    },

    autoResolveConflicts: function (conflicts) {
        const db = this.ensure();
        conflicts.forEach(item => {
            const current = item.current;
            const candidates = item.candidates || [];
            const currentScore = parseFloat(current.total) || 0;
            const sorted = candidates.slice().sort((a, b) => {
                const da = Math.abs((a.lastScore ?? 0) - currentScore);
                const dbv = Math.abs((b.lastScore ?? 0) - currentScore);
                return da - dbv;
            });
            const best = sorted[0];
            if (best && best.uuid) {
                current.uuid = best.uuid;
            } else {
                const uuid = this.createUUID();
                db.students[uuid] = {
                    uuid,
                    name: current.name,
                    status: 'transfer_in',
                    history: [],
                    lastScore: null,
                    lastExamId: null
                };
                current.uuid = uuid;
            }
        });
    },

    resolveConflicts: async function (conflicts) {
        const db = this.ensure();
        for (const item of conflicts) {
            const current = item.current;
            const candidates = item.candidates || [];
            const options = {};
            const currentScore = current.total || 0;
            const sorted = candidates.slice().sort((a, b) => {
                const da = Math.abs((a.lastScore ?? 0) - currentScore);
                const db = Math.abs((b.lastScore ?? 0) - currentScore);
                return da - db;
            });

            sorted.forEach((c, idx) => {
                const label = `原${c.history?.slice(-1)[0]?.class || c.lastClass || '-'}班 ${c.name} (上次${c.lastScore ?? '-'})${idx === 0 ? ' —— 系统推荐' : ''}`;
                options[c.uuid] = label;
            });
            options['NEW'] = '以上都不是（新增转学生）';

            const result = await Swal.fire({
                title: '⚠️ 检测到重名冲突',
                html: `您上传了 ${current.class || '-'}班 的 ${current.name} (本次${currentScore}分)，请选择其历史身份：`,
                input: 'radio',
                inputOptions: options,
                inputValidator: value => !value ? '请选择一个匹配项' : undefined,
                confirmButtonText: '确认匹配',
                confirmButtonColor: '#4f46e5',
                showCancelButton: true,
                cancelButtonText: '设为新增'
            });

            const chosen = result.isConfirmed ? result.value : 'NEW';
            if (chosen === 'NEW') {
                const uuid = this.createUUID();
                db.students[uuid] = {
                    uuid,
                    name: current.name,
                    status: 'transfer_in',
                    history: [],
                    lastScore: null,
                    lastExamId: null
                };
                current.uuid = uuid;
            } else {
                current.uuid = chosen;
            }
        }
    },

    createUUID: function () {
        return 'stu_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
};

window.CohortDB = CohortDB;

const CohortGrowth = {
    cache: { volatility: [], growth: [] },

    render: function () {
        if (!COHORT_DB || !COHORT_DB.exams || Object.keys(COHORT_DB.exams).length === 0) {
            return alert('当前届别暂无历史考试数据');
        }
        const result = this.compute();
        this.cache = result;
        this.renderVolatility(result.volatility);
        this.renderGrowth(result.growth);
    },

    compute: function () {
        const exams = Object.values(COHORT_DB.exams || {}).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        const studentSeries = {};

        exams.forEach(exam => {
            const data = exam.data || [];
            const totals = data.map(s => Number(s.total)).filter(v => !isNaN(v));
            if (!totals.length) return;
            const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
            const variance = totals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / totals.length;
            const std = Math.sqrt(variance) || 1;

            const sorted = data.slice().sort((a, b) => (b.total || 0) - (a.total || 0));
            const rankMap = new Map();
            sorted.forEach((s, idx) => {
                const key = this.getStudentKey(s);
                if (!rankMap.has(key)) rankMap.set(key, idx + 1);
            });

            data.forEach(s => {
                const key = this.getStudentKey(s);
                if (!studentSeries[key]) studentSeries[key] = { name: s.name, class: s.class, z: [], p: [] };
                studentSeries[key].name = s.name || studentSeries[key].name;
                studentSeries[key].class = s.class || studentSeries[key].class;
                const z = (Number(s.total) - mean) / std;
                const rank = rankMap.get(key) || null;
                const p = rank && sorted.length > 1 ? (1 - (rank - 1) / (sorted.length - 1)) : 0.5;
                studentSeries[key].z.push(z);
                studentSeries[key].p.push(p);
            });
        });

        const volatility = [];
        const growth = [];

        Object.values(studentSeries).forEach(s => {
            if (s.z.length >= 4) {
                const sigma = this.std(s.z);
                volatility.push({ name: s.name, class: s.class, count: s.z.length, sigma });
            }
            if (s.p.length >= 2) {
                const start = s.p[0];
                const end = s.p[s.p.length - 1];
                const delta = end - start;
                growth.push({ name: s.name, class: s.class, start, end, delta });
            }
        });

        volatility.sort((a, b) => b.sigma - a.sigma);
        growth.sort((a, b) => b.delta - a.delta);

        return { volatility: volatility.slice(0, 50), growth: growth.slice(0, 50) };
    },

    renderVolatility: function (list) {
        const tbody = document.querySelector('#cohort-volatility-table tbody');
        if (!tbody) return;
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#999; padding:20px;">暂无足够数据</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(s => `
                <tr>
                    <td>${s.name}</td>
                    <td>${s.class || '-'}</td>
                    <td>${s.count}</td>
                    <td style="font-weight:bold; color:#0ea5e9;">${s.sigma.toFixed(2)}</td>
                </tr>
            `).join('');
    },

    renderGrowth: function (list) {
        const tbody = document.querySelector('#cohort-growth-table tbody');
        if (!tbody) return;
        if (!list.length) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#999; padding:20px;">暂无足够数据</td></tr>';
            return;
        }
        tbody.innerHTML = list.map(s => {
            const delta = s.delta;
            const color = delta >= 0 ? '#16a34a' : '#dc2626';
            return `
                <tr>
                    <td>${s.name}</td>
                    <td>${s.class || '-'}</td>
                    <td>${(s.start * 100).toFixed(1)}%</td>
                    <td>${(s.end * 100).toFixed(1)}%</td>
                    <td style="font-weight:bold; color:${color};">${(delta * 100).toFixed(1)}%</td>
                </tr>`;
        }).join('');
    },

    exportVolatility: function () {
        if (!this.cache.volatility || !this.cache.volatility.length) return alert('暂无可导出数据');
        const wsData = [['姓名', '班级', '考试次数', '波动率(σ)']];
        this.cache.volatility.forEach(s => wsData.push([s.name, s.class || '-', s.count, Number(s.sigma.toFixed(3))]));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), 'Z-Score波动率');
        XLSX.writeFile(wb, `纵向成长档案_波动率_${CURRENT_COHORT_ID || 'cohort'}.xlsx`);
    },

    std: function (arr) {
        const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
        const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
        return Math.sqrt(variance);
    },

    getStudentKey: function (s) {
        return s.uuid || `${s.name || ''}|${s.class || ''}|${s.school || ''}`;
    }
};

// === 自动快照/回滚 ===
function getCurrentSnapshotPayload() {
    window.getCurrentSnapshotPayload = getCurrentSnapshotPayload;
    const workspaceSnapshot = readWorkspaceSnapshot();
    const examSnapshot = ExamStateRuntime && typeof ExamStateRuntime.snapshotExamState === 'function'
        ? ExamStateRuntime.snapshotExamState()
        : {
            archiveMeta: readArchiveMeta(),
            currentTermId: readCurrentTermId(),
            currentTeacherTermId: readCurrentTeacherTermId(),
            archiveLocked: readArchiveLockState().locked,
            archiveLockedKey: readArchiveLockState().lockedKey
        };
    return {
        CURRENT_PROJECT_KEY: workspaceSnapshot.currentProjectKey || '',
        COHORT_DB: workspaceSnapshot.cohortDb || null,
        CURRENT_COHORT_ID: workspaceSnapshot.currentCohortId || '',
        CURRENT_COHORT_META: workspaceSnapshot.currentCohortMeta || null,
        CURRENT_EXAM_ID: workspaceSnapshot.currentExamId || '',
        CURRENT_TERM_ID: examSnapshot.currentTermId || '',
        CURRENT_TEACHER_TERM_ID: examSnapshot.currentTeacherTermId || '',
        ARCHIVE_META: examSnapshot.archiveMeta || null,
        ARCHIVE_LOCKED: examSnapshot.archiveLocked ? 'true' : 'false',
        ARCHIVE_LOCKED_KEY: examSnapshot.archiveLockedKey || '',
        RAW_DATA: readRawData(),
        SCHOOLS: readSchools(),
        SUBJECTS: readSubjects(),
        THRESHOLDS: readThresholds(),
        TEACHER_MAP: window.TEACHER_MAP || {},
        TEACHER_SCHOOL_MAP: window.TEACHER_SCHOOL_MAP || {},
        CONFIG: readConfigState(),
        MY_SCHOOL: readCurrentSchool(),
        TARGETS: readTargetsState(),
        INDICATOR_PARAMS: readIndicatorState(),
        SCHOOL_ALIAS_SETTINGS: readSchoolAliasState(),
        PREV_DATA: readPrevDataState(),
        PROGRESS_CACHE: readProgressCacheState(),
        PROGRESS_CACHE_FULL: readProgressCacheFullState(),
        MANUAL_ID_MAPPINGS: readManualIdMappingsState(),
        LAST_VA_DATA: readLastVaDataState(),
        VA_VIEW_MODE: readProgressViewModeState(),
        __PROGRESS_QUICK_MODE: readProgressQuickModeState(),
        CURRENT_REPORT_STUDENT: readCurrentReportStudentState(),
        CURRENT_CONTEXT_STUDENTS: readCurrentContextStudentsState(),
        TEACHER_STATS: window.TEACHER_STATS || {},
        HISTORY_ARCHIVE: readHistoryArchiveState(),
        FB_CLASSES: readFbClassesState(),
        MP_SNAPSHOTS: readMpSnapshotsState(),
        FINGERPRINT: computeExamDataFingerprint(readRawData()),
        timestamp: new Date().getTime()
    };
}

function createAutoSnapshot(payload) {
    try {
        if (!payload) return;
        const list = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
        const item = {
            ts: Date.now(),
            key: String(payload.CURRENT_PROJECT_KEY || readWorkspaceProjectKey() || 'autosave_backup').trim(),
            data: "LZ|" + LZString.compressToUTF16(JSON.stringify(payload))
        };
        list.unshift(item);
        const trimmed = list.slice(0, 5);
        localStorage.setItem('AUTO_SNAPSHOTS', JSON.stringify(trimmed));
        renderAutoSnapshotsUI();
        updateExamHistoryStatusBar();
    } catch (e) {
        console.warn('自动快照失败:', e);
    }
}

function updateExamHistoryStatusBar() {
    const statusEl = document.getElementById('exam-history-status');
    if (!statusEl) return;

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : (window.COHORT_DB || null);
    const examCount = db?.exams ? Object.keys(db.exams).length : 0;

    const snapshots = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
    const latest = snapshots.reduce((acc, item) => {
        const ts = Number(item?.ts || 0);
        if (ts > acc.ts) {
            return { ts, key: (item?.key || '').trim() || '未知项目' };
        }
        return acc;
    }, { ts: 0, key: '' });

    const latestText = latest.ts > 0
        ? `${latest.key}（${new Date(latest.ts).toLocaleString('zh-CN')}）`
        : '无';
    statusEl.textContent = `历史考试: ${examCount} 期｜最近快照: ${latestText}`;
    if (typeof updateUploadWorkbenchStatus === 'function') updateUploadWorkbenchStatus();
}

function showMultiCompareDataSourceDiag() {
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const cohortId = CURRENT_COHORT_ID || readWorkspaceCohortId() || '(未选择届别)';
    const currentExamId = CURRENT_EXAM_ID || readWorkspaceExamId() || '(未设置当前考试)';
    const exams = Object.values(db?.exams || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    const lines = exams.map((ex, idx) => {
        const id = ex?.examId || '(无ID)';
        const created = ex?.createdAt ? new Date(ex.createdAt).toLocaleString('zh-CN') : '未知时间';
        const count = Array.isArray(ex?.data) ? ex.data.length : 0;
        const tag = id === currentExamId ? '【当前】' : '';
        return `${idx + 1}. ${id}${tag}｜${created}｜数据${count}条`;
    });

    const summary = [
        `届别：${cohortId}`,
        `当前考试：${currentExamId}`,
        `历史考试总数：${exams.length}`,
        '',
        exams.length ? '历史考试明细：' : '历史考试明细：暂无',
        ...(exams.length ? lines : [])
    ].join('\n');

    if (window.Swal) {
        Swal.fire({
            title: '多期数据源诊断',
            html: `<pre style="text-align:left; white-space:pre-wrap; font-size:12px; line-height:1.7; color:#334155; margin:0;">${summary.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>`,
            width: 760,
            confirmButtonText: '知道了',
            confirmButtonColor: '#0ea5e9'
        });
        return;
    }

    alert(summary);
}

function renderAutoSnapshotsUI() {
    const container = document.getElementById('auto-snapshot-list');
    if (!container) return;
    const list = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
    if (list.length === 0) {
        container.innerHTML = '<div class="upload-inline-status upload-inline-status--block">暂无快照</div>';
        return;
    }
    container.innerHTML = list.map((item, idx) => {
        const time = new Date(item.ts).toLocaleString();
        return `<div class="auto-snapshot-card">
                <div class="auto-snapshot-copy">
                    <strong>⏱️ ${time}</strong>
                    <span>${item.key}</span>
                </div>
                <button class="btn btn-sm btn-gray" onclick="restoreAutoSnapshot(${idx})">回滚</button>
            </div>`;
    }).join('');
}

function restoreAutoSnapshot(index) {
    if (!confirm('确定回滚到该快照吗？当前未保存的修改将丢失。')) return;
    const list = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
    const item = list[index];
    if (!item || !item.data) return;
    try {
        let dataStr = item.data;
        if (typeof dataStr === 'string' && dataStr.startsWith('LZ|')) {
            dataStr = LZString.decompressFromUTF16(dataStr.substring(3));
        }
        const db = JSON.parse(dataStr);
        applySnapshotPayload(db);
        if (window.UI) UI.toast('✅ 已回滚到快照', 'success');
    } catch (e) {
        alert('回滚失败: ' + e.message);
    }
}

function restoreLatestAutoSnapshotDirect() {
    const list = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
    const item = list[0];
    if (!item || !item.data) return false;
    try {
        let dataStr = item.data;
        if (typeof dataStr === 'string' && dataStr.startsWith('LZ|')) {
            dataStr = LZString.decompressFromUTF16(dataStr.substring(3));
        }
        const db = JSON.parse(dataStr);
        applySnapshotPayload(db);
        updateExamHistoryStatusBar();
        if (window.UI) UI.toast('✅ 已从最近自动快照恢复历史考试数据', 'success');
        return true;
    } catch (e) {
        console.error('最近快照恢复失败:', e);
        if (window.UI) UI.toast('❌ 最近快照恢复失败：' + e.message, 'error');
        return false;
    }
}

function promptHistoryRecoveryIfEmpty() {
    // Disabled by product requirement: no "历史考试为空" popup.
    return;
    const cohortId = CURRENT_COHORT_ID || readWorkspaceCohortId() || '';
    if (!cohortId) return;

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const hasHistory = !!(db?.exams && Object.keys(db.exams).length > 0);
    if (hasHistory) return;

    const guardKey = `HISTORY_EMPTY_PROMPTED_${cohortId}`;
    if (sessionStorage.getItem(guardKey) === '1') return;
    sessionStorage.setItem(guardKey, '1');

    const list = JSON.parse(localStorage.getItem('AUTO_SNAPSHOTS') || '[]');
    const hasSnapshots = list.length > 0;

    if (!window.Swal) {
        if (hasSnapshots && confirm('⚠️ 检测到当前届别历史考试为空。\n是否一键回滚最近自动快照进行恢复？')) {
            restoreLatestAutoSnapshotDirect();
            if (typeof CohortDB !== 'undefined') CohortDB.renderExamList();
        }
        return;
    }

    Swal.fire({
        title: '⚠️ 历史考试为空',
        html: hasSnapshots
            ? '<div style="text-align:left; font-size:13px; color:#475569; line-height:1.8;">检测到当前届别没有历史考试记录。<br>可尝试一键回滚最近自动快照恢复历史数据。</div>'
            : '<div style="text-align:left; font-size:13px; color:#475569; line-height:1.8;">检测到当前届别没有历史考试记录。<br>且本地暂无自动快照可恢复，请检查云端项目键或重新导入。</div>',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: hasSnapshots ? '一键恢复最近快照' : '知道了',
        cancelButtonText: '暂不处理',
        confirmButtonColor: '#0ea5e9'
    }).then(r => {
        if (!r.isConfirmed) return;
        if (!hasSnapshots) return;
        const ok = restoreLatestAutoSnapshotDirect();
        if (ok && typeof CohortDB !== 'undefined') CohortDB.renderExamList();
    });
}

function applySnapshotPayload(db) {
    window.applySnapshotPayload = applySnapshotPayload;
    COHORT_DB = db.COHORT_DB || COHORT_DB || null;
    CURRENT_COHORT_ID = db.CURRENT_COHORT_ID || CURRENT_COHORT_ID || '';
    CURRENT_COHORT_META = db.CURRENT_COHORT_META || CURRENT_COHORT_META || null;
    CURRENT_EXAM_ID = db.CURRENT_EXAM_ID || CURRENT_EXAM_ID || '';
    syncExamRuntimeState({
        currentTermId: db.CURRENT_TERM_ID || readCurrentTermId(),
        currentTeacherTermId: db.CURRENT_TEACHER_TERM_ID || readCurrentTeacherTermId(),
        archiveMeta: db.ARCHIVE_META || readArchiveMeta(),
        archiveLocked: String(db.ARCHIVE_LOCKED || '').trim() === 'true',
        archiveLockedKey: db.ARCHIVE_LOCKED_KEY || ''
    });
    syncWorkspaceRuntimeState({
        currentProjectKey: String(db.CURRENT_PROJECT_KEY || '').trim() || (CURRENT_COHORT_ID ? getCohortKey(CURRENT_COHORT_ID) : readWorkspaceProjectKey()),
        cohortDb: COHORT_DB,
        currentCohortId: CURRENT_COHORT_ID,
        currentCohortMeta: CURRENT_COHORT_META,
        currentExamId: CURRENT_EXAM_ID
    });
    if (readWorkspaceExamId()) {
        try {
            const meta = readArchiveMeta();
            const termId = getTermId(meta || {});
            if (termId) writeCurrentTermId(termId);
        } catch (e) { }
    }
    syncDataRuntimeState({
        rawData: db.RAW_DATA || [],
        schools: db.SCHOOLS || {},
        subjects: db.SUBJECTS || [],
        thresholds: db.THRESHOLDS || {},
        config: db.CONFIG || readConfigState()
    });
    setTeacherMap(db.TEACHER_MAP || {});
    setTeacherSchoolMap(db.TEACHER_SCHOOL_MAP || {});
    writeCurrentSchool(db.MY_SCHOOL || '');
    setTargetsState(db.TARGETS || {});
    setSchoolAliasState(Array.isArray(db.SCHOOL_ALIAS_SETTINGS) ? db.SCHOOL_ALIAS_SETTINGS : readSchoolAliasState());
    persistSchoolAliasSettingsLocal();
    if (db.INDICATOR_PARAMS) {
        const indicator = setIndicatorState(db.INDICATOR_PARAMS);
        const dm1 = document.getElementById('dm_ind1_input');
        const dm2 = document.getElementById('dm_ind2_input');
        const main1 = document.getElementById('ind1');
        const main2 = document.getElementById('ind2');
        if (dm1) dm1.value = indicator.ind1;
        if (dm2) dm2.value = indicator.ind2;
        if (main1) main1.value = indicator.ind1;
        if (main2) main2.value = indicator.ind2;
    }
    if (db.PREV_DATA) setPrevDataState(db.PREV_DATA);
    syncProgressRuntimeState({
        progressCache: db.PROGRESS_CACHE || [],
        progressCacheFull: db.PROGRESS_CACHE_FULL || [],
        manualIdMappings: db.MANUAL_ID_MAPPINGS || {},
        lastVaData: db.LAST_VA_DATA || [],
        vaViewMode: Object.prototype.hasOwnProperty.call(db, 'VA_VIEW_MODE')
            ? db.VA_VIEW_MODE
            : readProgressViewModeState(),
        quickMode: Object.prototype.hasOwnProperty.call(db, '__PROGRESS_QUICK_MODE')
            ? db.__PROGRESS_QUICK_MODE
            : readProgressQuickModeState()
    });
    syncReportSessionRuntimeState({
        currentReportStudent: Object.prototype.hasOwnProperty.call(db, 'CURRENT_REPORT_STUDENT')
            ? (db.CURRENT_REPORT_STUDENT || null)
            : readCurrentReportStudentState(),
        currentContextStudents: Object.prototype.hasOwnProperty.call(db, 'CURRENT_CONTEXT_STUDENTS')
            ? (db.CURRENT_CONTEXT_STUDENTS || [])
            : readCurrentContextStudentsState()
    });
    if (Object.prototype.hasOwnProperty.call(db, 'TEACHER_STATS')) {
        setTeacherStats(db.TEACHER_STATS || {});
    }
    if (db.HISTORY_ARCHIVE) setHistoryArchiveState(db.HISTORY_ARCHIVE);
    if (db.FB_CLASSES) setFbClassesState(db.FB_CLASSES);
    if (db.MP_SNAPSHOTS) setMpSnapshotsState(db.MP_SNAPSHOTS);
    syncRuntimeStateToWindow();

    if (window.COHORT_DB && window.COHORT_DB.currentExamId) {
        try { CohortDB.applyExamToWorkspace(window.COHORT_DB.currentExamId, { renderTables: false }); } catch (e) { }
    }

    try { if (typeof renderTables === 'function') renderTables(); } catch (e) { }
    try { if (typeof updateSchoolSelect === 'function') updateSchoolSelect(); } catch (e) { }
    try { if (typeof renderAll === 'function') renderAll(); } catch (e) { }
    try {
        if (typeof DataManager !== 'undefined' && typeof DataManager.renderSchoolAliasMappings === 'function') {
            DataManager.renderSchoolAliasMappings();
        }
        if (typeof DataManager !== 'undefined' && typeof DataManager.syncSchoolAliasSettingsFromGateway === 'function') {
            DataManager.syncSchoolAliasSettingsFromGateway().catch(err => console.warn('[EdgeGateway] post-load alias refresh skipped:', err?.message || err));
        }
    } catch (e) { }
    try { updateExamHistoryStatusBar(); } catch (e) { }
    if (typeof DataManager !== 'undefined' && DataManager.renderHistoryPreview) DataManager.renderHistoryPreview();
    closeBaseConfigGuardModalIfRecovered();
    flushDeferredGuardResume('snapshot');
}
// === 项目快照逻辑 ===
function getConfigTransferRuntime() {
    if (window.ConfigTransferRuntime) return window.ConfigTransferRuntime;
    return {
        downloadJson(data, options = {}) {
            const fileName = String(options.fileName || 'config.json').trim() || 'config.json';
            const space = typeof options.space === 'number' ? options.space : 2;
            const content = typeof data === 'string' ? data : JSON.stringify(data, null, space);
            const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            link.remove();
            URL.revokeObjectURL(url);
            return fileName;
        },
        async readJson(file) {
            if (!file) throw new Error('未选择文件');
            const text = typeof file.text === 'function'
                ? await file.text()
                : await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(String(reader.result || ''));
                    reader.onerror = () => reject(reader.error || new Error('文件读取失败'));
                    reader.readAsText(file, 'utf-8');
                });
            return JSON.parse(text);
        }
    };
}

function buildProjectSnapshotFileName() {
    const dateStr = new Date().toLocaleDateString('en-CA').replace(/\//g, '-');
    return `system-project-backup-${dateStr}.json`;
}

function markProjectFileBackupSaved(fileName) {
    localStorage.setItem('MANUAL_BACKUP_AT', new Date().toISOString());
    if (typeof logAction === 'function') logAction('文件备份', `已保存到 ${fileName}`);
    if (typeof updateStatusPanel === 'function') updateStatusPanel();
    if (typeof updateUploadWorkbenchStatus === 'function') updateUploadWorkbenchStatus();
}

function saveProjectSnapshot() {
    const hasData = RAW_DATA.length > 0 || Object.keys(TEACHER_MAP).length > 0;
    const hasConfig = localStorage.getItem('app_skin_config');

    if (!hasData && !hasConfig) {
        return alert("当前系统为空，无需备份！");
    }

    // 获取当前界面上的输入框数值
    const elInd1 = document.getElementById('ind1');
    const elInd2 = document.getElementById('ind2');
    const freshmanExamState = window.FreshmanExamRuntime || null;

    const snapshot = {
        meta: {
            version: "3.3",
            timestamp: new Date().toISOString(),
            desc: "全量备份(含指标参数)"
        },
        db: {
            // 核心变量
            CONFIG, MY_SCHOOL, RAW_DATA, SCHOOLS, SUBJECTS, THRESHOLDS,
            TARGETS, // 👈 确保这里包含目标人数对象
            TEACHER_MAP, TEACHER_STATS, TEACHER_TOWNSHIP_RANKINGS, TEACHER_STAMP_BASE64,
            PREV_DATA,
            PROGRESS_CACHE: readProgressCacheState(),
            PROGRESS_CACHE_FULL: readProgressCacheFullState(),
            MANUAL_ID_MAPPINGS: readManualIdMappingsState(),
            LAST_VA_DATA: readLastVaDataState(),
            VA_VIEW_MODE: readProgressViewModeState(),
            __PROGRESS_QUICK_MODE: readProgressQuickModeState(),
            CURRENT_REPORT_STUDENT: readCurrentReportStudentState(),
            CURRENT_CONTEXT_STUDENTS: readCurrentContextStudentsState(),
            MARGINAL_STUDENTS, POTENTIAL_STUDENTS_CACHE,
            MP_DATA_CACHE,
            FB_STUDENTS: freshmanExamState?.students || FB_STUDENTS,
            FB_CLASSES: typeof readFbClassesState === 'function' ? readFbClassesState() : FB_CLASSES,
            FB_SIMULATED_DATA: freshmanExamState?.simulatedData || FB_SIMULATED_DATA,
            EXAM_DATA: freshmanExamState?.examData || EXAM_DATA,
            EXAM_ROOMS: freshmanExamState?.examRooms || EXAM_ROOMS,
            AID_GROUPS_CACHE, HISTORY_ARCHIVE, ROLLER_COASTER_STUDENTS,
            MP_SNAPSHOTS,

            // 🟢 关键修改：保存输入框的具体数值
            INDICATOR_PARAMS: {
                ind1: elInd1 ? elInd1.value : '',
                ind2: elInd2 ? elInd2.value : ''
            }
        },
        settings: {
            skin: localStorage.getItem('app_skin_config'),
            themeDark: localStorage.getItem('theme-dark'),
            hasSeenTour: localStorage.getItem('hasSeenV3Tour')
        }
    };

    try {
        const transfer = getConfigTransferRuntime();
        const fileName = transfer.downloadJson(snapshot, { fileName: buildProjectSnapshotFileName() });
        markProjectFileBackupSaved(fileName);
        UI.toast("✅ 当前项目已保存到文件", "success");
    } catch (e) {
        console.error(e);
        alert("保存失败：" + e.message);
    }
}

async function loadProjectSnapshot(input) {
    if (isArchiveLocked()) return alert("⛔ 当前考试已封存，禁止从文件恢复项目");
    const file = input && input.files ? input.files[0] : input;
    if (!file) return;

    if (!confirm("⚠️ 警告：从文件恢复会覆盖当前系统中的所有数据！\n确定要继续吗？")) {
        if (input && input.value !== undefined) input.value = '';
        return;
    }

    try {
        UI.loading(true, "正在从文件恢复全站数据...");
        const transfer = getConfigTransferRuntime();
        const snapshot = await transfer.readJson(file);

        // 1. 校验版本结构
        if (!snapshot.meta || (!snapshot.data && !snapshot.db)) {
            throw new Error("文件格式不兼容或已损坏");
        }

        // 兼容旧版备份 (旧版数据在 .data，新版在 .db)
        const db = snapshot.db || snapshot.data || {};
        const settings = snapshot.settings || {};

        // 2. 恢复 LocalStorage 配置
        if (settings.skin) localStorage.setItem('app_skin_config', settings.skin);
        if (settings.themeDark) localStorage.setItem('theme-dark', settings.themeDark);
        if (settings.hasSeenTour) localStorage.setItem('hasSeenV3Tour', settings.hasSeenTour);

        // 3. 恢复 IndexedDB 数据 (关键步骤：写入后刷新页面)
        if (Object.keys(db).length > 0) {
            /* 👇👇👇 🟢 关键：恢复全局变量 TARGETS (防止刷新前点击无效) 🟢 👇👇👇 */
            setTargetsState(db.TARGETS || {});

            await DB.save('autosave_backup', {
                timestamp: Date.now(),
                RAW_DATA: db.RAW_DATA || [],
                SCHOOLS: db.SCHOOLS || {},
                SUBJECTS: db.SUBJECTS || [],
                THRESHOLDS: db.THRESHOLDS || {},

                /* 👇👇👇 🟢 关键：写入 TARGETS 到缓存 🟢 👇👇👇 */
                TARGETS: db.TARGETS || {},

                /* 👇👇👇 🟢 关键：写入 指标参数 到缓存 🟢 👇👇👇 */
                INDICATOR_PARAMS: db.INDICATOR_PARAMS || { ind1: '', ind2: '' },

                TEACHER_MAP: db.TEACHER_MAP || {},
                TEACHER_STATS: db.TEACHER_STATS || {},
                FB_CLASSES: db.FB_CLASSES || [],
                CONFIG: db.CONFIG || {},
                MY_SCHOOL: db.MY_SCHOOL || "",
                // 其他字段...
                TEACHER_TOWNSHIP_RANKINGS: db.TEACHER_TOWNSHIP_RANKINGS || {},
                PREV_DATA: db.PREV_DATA || [],
                PROGRESS_CACHE: db.PROGRESS_CACHE || [],
                PROGRESS_CACHE_FULL: db.PROGRESS_CACHE_FULL || [],
                MANUAL_ID_MAPPINGS: db.MANUAL_ID_MAPPINGS || {},
                LAST_VA_DATA: db.LAST_VA_DATA || [],
                VA_VIEW_MODE: db.VA_VIEW_MODE || 'school',
                __PROGRESS_QUICK_MODE: db.__PROGRESS_QUICK_MODE || 'all',
                CURRENT_REPORT_STUDENT: db.CURRENT_REPORT_STUDENT || null,
                CURRENT_CONTEXT_STUDENTS: db.CURRENT_CONTEXT_STUDENTS || [],
                MARGINAL_STUDENTS: db.MARGINAL_STUDENTS || {},
                POTENTIAL_STUDENTS_CACHE: db.POTENTIAL_STUDENTS_CACHE || [],
                FB_STUDENTS: db.FB_STUDENTS || [],
                FB_SIMULATED_DATA: db.FB_SIMULATED_DATA || {},
                EXAM_DATA: db.EXAM_DATA || [],
                EXAM_ROOMS: db.EXAM_ROOMS || [],
                AID_GROUPS_CACHE: db.AID_GROUPS_CACHE || [],
                HISTORY_ARCHIVE: db.HISTORY_ARCHIVE || {},
                ROLLER_COASTER_STUDENTS: db.ROLLER_COASTER_STUDENTS || []
            });

            // 恢复临界生快照到 LocalStorage
            if (db.MP_SNAPSHOTS) {
                localStorage.setItem('MP_SNAPSHOTS', JSON.stringify(db.MP_SNAPSHOTS));
            }
        }

        if (typeof logAction === 'function') logAction('文件恢复', `已从 ${file.name || '备份文件'} 恢复项目`);

        // 标记强制恢复
        localStorage.setItem('SYS_FORCE_RESTORE', 'true');

        UI.loading(false);

        // 4. 成功提示并刷新
        Swal.fire({
            title: '恢复成功',
            text: '项目已从文件恢复，系统即将重启以应用更改...',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
        }).then(() => {
            location.reload();
        });

    } catch (err) {
        UI.loading(false);
        console.error(err);
        alert("❌ 恢复失败：所选文件可能已损坏。\nDEBUG: " + err.message);
    } finally {
        if (input && input.value !== undefined) input.value = '';
    }
}

function openTargetEditor() {
    if (Object.keys(SCHOOLS).length === 0) return alert("请先上传成绩数据，系统需要读取学校列表。");

    ensureNormalizedTargets();
    const tbody = document.querySelector('#target-editor-table tbody');
    tbody.innerHTML = '';

    // 遍历所有学校，生成输入框
    const targetRowsHtml = Object.keys(SCHOOLS).map(sch => {
        // 获取现有目标，如果没有则默认为 0
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

    // 自动触发一次计算，让用户看到变化
    const { r1, r2 } = getIndicatorRankParams();
    if (r1 && r2) {
        calcIndicators();
    } else {
        alert("目标已保存！\n请记得在上方输入框设置【划线名次】，然后点击【开始计算】。");
    }
}

// === 全局搜索 (Spotlight) 逻辑 ===
// 快捷键绑定
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

    if (target.id === 'uploadBox') {
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

// 辅助：更新 Spotlight 选中样式
function updateSpotlightSelection(items, index) {
    items.forEach(el => el.classList.remove('active'));
    if (items[index]) {
        items[index].classList.add('active');
        items[index].scrollIntoView({ block: 'nearest' }); // 确保可见
        // 样式补丁：确保 .active 有高亮 (配合 CSS)
        items[index].style.backgroundColor = 'var(--primary-light)';
    }
}

let fuseInstance = null;

function initFuse() {
    if (!window.Fuse || RAW_DATA.length === 0) return;

    // 配置 Fuse 选项
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

    // 1. 搜功能模块 (保持原有逻辑，简单包含匹配即可)
    const modules = [
        { name: "新生分班", id: "freshman-simulator" },
        { name: "考场编排", id: "exam-arranger" },
        { name: "座位微调", id: "seat-adjustment" },
        { name: "教师分析", id: "teacher-analysis" },
        { name: "进退步追踪", id: "progress-analysis" },
        { name: "两率一分(宏观)", id: "analysis" },
        { name: "临界生任务单", id: "marginal-push" },
        { name: "学生成绩单", id: "report-generator" },
        { name: "应用下载中心", id: "app-download-center" }
    ];

    modules.forEach(m => {
        if (m.name.includes(val)) {
            spotlightRowsHtml.push(`
                    <div class="spotlight-item" onclick="switchTab('${m.id}');closeSpotlight()">
                        <span>🛠️ 功能：${m.name}</span>
                        <span style="font-size:10px;color:#999">跳转</span>
                    </div>`);
        }
    });

    // 2. 搜学生 (使用 Fuse.js 模糊搜索)
    let matches = [];

    // 如果 Fuse 还没初始化或者数据更新了，重新初始化
    if (!fuseInstance && RAW_DATA.length > 0) initFuse();

    if (fuseInstance) {
        // 使用 Fuse 搜索
        const results = fuseInstance.search(val);
        // Fuse 返回格式是 [{item: ...}, ...]
        matches = results.map(r => r.item).slice(0, 8); // 取前8个
    } else {
        // 降级方案：原有简单搜索
        matches = RAW_DATA.filter(s => s.name.includes(val) || String(s.id).includes(val)).slice(0, 5);
    }

    if (matches.length === 0) {
        spotlightRowsHtml.push(`<div style="padding:10px; text-align:center; color:#999;">无匹配结果</div>`);
    } else {
        matches.forEach(s => {
            // 高亮匹配文字逻辑略复杂，这里直接显示结果
            spotlightRowsHtml.push(`
                    <div class="spotlight-item" onclick="jumpToStudent(${jsStringLiteral(s.name)}, ${jsStringLiteral(s.school)}, ${jsStringLiteral(s.class)})">
                        <span>👤 ${s.name} <small style="color:#666">(${s.school} ${s.class})</small></span>
                        <span style="font-weight:bold;">${s.total}分</span>
                    </div>`);
        });
    }
    resDiv.innerHTML = spotlightRowsHtml.join('');
}
// Module help runtime moved to public/assets/js/module-help-runtime.js.

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

    // 🆕 显示所有角色
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
    // 🎭 全方位演示数据引擎 - 营造“系统已就绪”的沉浸式体验
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

    // 为每个届别生成班级和学生
    ['9', '8', '7'].forEach((gradeLevel, gIdx) => {
        const cohort = cohorts[gIdx];
        const classCount = 4;

        for (let cNum = 1; cNum <= classCount; cNum++) {
            const cls = `${gradeLevel}.${cNum}`;

            // 为每个学科随机分配教师
            subjects.forEach(sub => {
                const tName = teachers[Math.floor(Math.random() * teachers.length)];
                teacherAssignments[`${cls}_${sub}`] = tName;
            });

            // 生成学生
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

    // 1. 基础字段校验 + 收集重复信息
    const nameMap = {};
    RAW_DATA.forEach((s, idx) => {
        const rowNo = s.__row || (idx + 2); // 默认第2行开始是数据

        // 必填字段检查
        if (!s.school || !s.class || !s.name) {
            stats.emptyFieldCount++;
            issues.push(`🔴 <strong>关键字段缺失：</strong> 行 ${rowNo} 学校/班级/姓名为空`);
            return;
        }

        const key = `${s.school}_${s.class}_${s.name}`;
        if (!nameMap[key]) nameMap[key] = [];
        nameMap[key].push(rowNo);
    });

    // 1.1 同班同名检测 (致命错误)
    Object.entries(nameMap).forEach(([key, rows]) => {
        if (rows.length > 1) {
            const [school, cls, name] = key.split('_');
            issues.push(`🔴 <strong>重复录入/同名：</strong> ${school} ${cls}班 "${name}" 行号: ${rows.join('、')}`);
        }
    });

    // 2. 检查异常分值 (高分/负分)
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

    // 3. 检查班级人数极值 (过大或过小)
    Object.values(SCHOOLS).forEach(sch => {
        // 简单统计该校班级人数
        const clsCounts = {};
        sch.students.forEach(s => clsCounts[s.class] = (clsCounts[s.class] || 0) + 1);
        Object.entries(clsCounts).forEach(([cls, count]) => {
            if (count < 10) warnings.push(`🟠 <strong>班级人数过少：</strong> ${sch.name} ${cls} 仅 ${count} 人。`);
            if (count > 70) warnings.push(`🟠 <strong>班级人数过多：</strong> ${sch.name} ${cls} 达 ${count} 人。`);
        });
    });

    // 4. 生成报告 HTML
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
    // 延迟执行，确保 DOM 已经完全渲染
    setTimeout(() => {
        const modalIds = [
            'issue-submit-modal',   // 成绩核查申诉弹窗
            'admin-issue-modal',    // 管理员申诉处理弹窗
            'user-password-modal',  // 修改密码弹窗
            'account-manager-modal' // 账号管理弹窗
        ];

        modalIds.forEach(id => {
            const el = document.getElementById(id);
            // 如果元素存在，且它不是 body 的直接子元素，就移动它
            if (el && el.parentNode !== document.body) {
                appDebug(`🔧 [AutoFix] 正在修复弹窗 DOM 位置: ${id}`);
                document.body.appendChild(el); // 移动到 body 末尾
            }
        });
    }, 1000); // 延迟 1 秒执行
});
window.DataManager = DataManager;
window.DrillSystem = DrillSystem;
window.CohortGrowth = CohortGrowth;
if (typeof window.wrapXlsxRuntimeExports === 'function') window.wrapXlsxRuntimeExports();

// 🚀 [AutoFix] Demo Mode Trigger
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
