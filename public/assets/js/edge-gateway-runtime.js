function isLocalFileRuntimeForEdgeGateway() {
    if (typeof isLocalFileRuntimeForApp === 'function') return isLocalFileRuntimeForApp();
    return window.__IS_LOCAL_FILE_RUNTIME__ === true
        || (window.location && String(window.location.protocol || '').trim().toLowerCase() === 'file:');
}

function edgeGatewayDebug(...args) {
    if (typeof appDebug === 'function') {
        appDebug(...args);
        return;
    }
    try {
        if (window.APP_DEBUG === true || localStorage.getItem('APP_DEBUG') === '1') {
            console.debug(...args);
        }
    } catch (_) {}
}

var EdgeGateway = window.EdgeGateway || {
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
        if (isLocalFileRuntimeForEdgeGateway()) {
            if (typeof window.DIRECT_CLOUDFLARE_GATEWAY_URL !== 'undefined') {
                pushCandidate(window.DIRECT_CLOUDFLARE_GATEWAY_URL);
            } else if (typeof DIRECT_CLOUDFLARE_GATEWAY_URL !== 'undefined') {
                pushCandidate(DIRECT_CLOUDFLARE_GATEWAY_URL);
            }
            if (typeof window.__DIRECT_EDGE_GATEWAY_URL !== 'undefined') {
                pushCandidate(window.__DIRECT_EDGE_GATEWAY_URL);
            } else if (typeof DIRECT_EDGE_GATEWAY_URL !== 'undefined') {
                pushCandidate(DIRECT_EDGE_GATEWAY_URL);
            }
            return candidates;
        }

        if (typeof window.DIRECT_CLOUDFLARE_GATEWAY_URL !== 'undefined') {
            pushCandidate(window.DIRECT_CLOUDFLARE_GATEWAY_URL);
        } else if (typeof DIRECT_CLOUDFLARE_GATEWAY_URL !== 'undefined') {
            pushCandidate(DIRECT_CLOUDFLARE_GATEWAY_URL);
        }

        pushCandidate(this.resolvedGatewayUrl);
        pushCandidate(localStorage.getItem('EDGE_GATEWAY_URL'));
        pushCandidate(window.EDGE_GATEWAY_URL);

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
        edgeGatewayDebug(`[EdgeGateway] Requesting ${action}, Protocol: ${protocol}, Origin: ${origin}`);
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
            edgeGatewayDebug(`[EdgeGateway] Attempt ${i + 1}/${urls.length}: ${url}`);
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
