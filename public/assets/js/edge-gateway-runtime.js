(function installEdgeGatewayRuntime(root) {
function isLocalFileRuntimeForEdgeGateway() {
    if (typeof isLocalFileRuntimeForApp === 'function') return isLocalFileRuntimeForApp();
    return window.__IS_LOCAL_FILE_RUNTIME__ === true
        || (window.location && String(window.location.protocol || '').trim().toLowerCase() === 'file:');
}

const edgeGateway = Object.assign(root.EdgeGateway || {}, {
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

        // The login shell can become interactive while the boot runtime is
        // still being restored from a stale Service Worker cache. In that
        // window the boot script may not have populated EDGE_GATEWAY_URL (or
        // the direct Supabase fallback constants). Always derive a same-origin
        // route from the current page as a final, keyless-safe fallback.
        try {
            const protocol = String(window.location?.protocol || '').trim().toLowerCase();
            const origin = String(window.location?.origin || '').trim().replace(/\/$/, '');
            if (/^https?:$/.test(protocol) && origin) {
                pushCandidate(`${origin}/api/edu-gateway`);
            }
        } catch (_) {}

        pushCandidate(this.resolvedGatewayUrl);
        pushCandidate(window.EDGE_GATEWAY_URL);

        if (typeof window.DIRECT_CLOUDFLARE_GATEWAY_URL !== 'undefined') {
            pushCandidate(window.DIRECT_CLOUDFLARE_GATEWAY_URL);
        } else if (typeof DIRECT_CLOUDFLARE_GATEWAY_URL !== 'undefined') {
            pushCandidate(DIRECT_CLOUDFLARE_GATEWAY_URL);
        }

        if (typeof DIRECT_EDGE_GATEWAY_URL !== 'undefined') {
            pushCandidate(DIRECT_EDGE_GATEWAY_URL);
        }

        return candidates;
    },
    getGatewayUrl: function () {
        return this.getGatewayCandidates()[0] || '';
    },
    isHostedGatewayUrl: function (url) {
        return window.GatewaySessionRuntime.sameOrigin(url);
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
        return window.GatewaySessionRuntime.getToken();
    },
    setToken: function (token) {
        return window.GatewaySessionRuntime.setToken(token);
    },
    clearSession: function () {
        return window.GatewaySessionRuntime.clearSession(this);
    },
    hasGatewayConfig: function () {
        const urls = this.getGatewayCandidates();
        return !!(urls.length && (this.getPublishableKey() || urls.some(url => this.isHostedGatewayUrl(url))));
    },
    canUseAuthorizedRequests: function () {
        return this.hasGatewayConfig() && !!(
            this.getToken() || window.GatewaySessionRuntime.hasCookieRoute(this.getGatewayCandidates())
        );
    },
    shouldRetryRequest: function (status, message) {
        if (status === 404 || status >= 500) return true;
        const text = String(message || '').trim().toLowerCase();
        return text.includes('function not found')
            || text.includes('edge_gateway_http_404')
            || text.includes('edge_gateway_invalid_response')
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
    request: function (action, payload = {}, options = {}) {
        return window.GatewaySessionRuntime.request(this, action, payload, options);
    },
    getClientDeviceInfo: function () {
        const nav = typeof navigator !== 'undefined' ? navigator : {};
        const screenObj = typeof screen !== 'undefined' ? screen : {};
        const ua = String(nav.userAgent || '');
        const browser = (() => {
            if (/Edg\//.test(ua)) return 'Microsoft Edge';
            if (/Chrome\//.test(ua)) return 'Chrome';
            if (/Firefox\//.test(ua)) return 'Firefox';
            if (/Safari\//.test(ua)) return 'Safari';
            return 'Browser';
        })();
        const os = (() => {
            if (/Windows/i.test(ua)) return 'Windows';
            if (/Mac OS X/i.test(ua)) return 'macOS';
            if (/Android/i.test(ua)) return 'Android';
            if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
            return String(nav.platform || 'Unknown');
        })();
        const deviceType = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) ? 'mobile' : 'desktop';
        const screenText = screenObj.width && screenObj.height ? `${screenObj.width}x${screenObj.height}` : '';
        return {
            device_label: `${browser} / ${os}${screenText ? ` / ${screenText}` : ''}`,
            device_type: deviceType,
            browser,
            os,
            platform: String(nav.platform || ''),
            language: String(nav.language || ''),
            timezone: (Intl.DateTimeFormat().resolvedOptions() || {}).timeZone || '',
            screen: screenText,
            user_agent: ua
        };
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
                    class_name: currentClassName || '',
                    device: this.getClientDeviceInfo()
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
    listLoginSessions: async function (payload = {}) {
        return await this.request('account.login_sessions', payload || {});
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
    },
    syncAssessmentScores: async function (payload = {}) {
        return await this.request('assessment.sync_scores', payload || {});
    },
    getAssessmentSyncSettings: async function (payload = {}) {
        return await this.request('assessment.get_sync_settings', payload || {});
    }
});

root.EdgeGateway = edgeGateway;
}(window));
