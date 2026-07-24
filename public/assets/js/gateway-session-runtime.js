(function installGatewaySessionRuntime(root) {
    // This runtime is an early, stateful dependency. It is present in the initial
    // document and may be encountered again by a dynamic module loader. Replacing
    // it would discard the in-memory token issued during the login hand-off.
    if (root.GatewaySessionRuntime?.runtimeVersion === '1') return;

    const TOKEN_STORAGE_KEY = 'EDGE_GATEWAY_TOKEN_V1';
    const USER_STORAGE_KEY = 'EDGE_GATEWAY_USER_V1';
    let memoryToken = '';

    function sameOrigin(url) {
        try {
            return new URL(url, root.location.href).origin === root.location.origin;
        } catch (_) {
            return false;
        }
    }

    function getToken() {
        return memoryToken;
    }

    function setToken(token) {
        memoryToken = String(token || '').trim();
        root.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        return memoryToken;
    }

    function clearSession(gateway) {
        memoryToken = '';
        root.sessionStorage.removeItem(TOKEN_STORAGE_KEY);
        root.sessionStorage.removeItem(USER_STORAGE_KEY);

        const url = gateway.getGatewayCandidates().find(sameOrigin);
        if (!url) return;
        fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'session.logout', payload: {} })
        }).catch(() => {});
    }

    function hasCookieRoute(urls) {
        return urls.some(sameOrigin);
    }

    function canRetry(gateway, status, message) {
        return typeof gateway.shouldRetryRequest === 'function'
            && gateway.shouldRetryRequest(status, message);
    }

    async function request(gateway, action, payload = {}, options = {}) {
        const urls = gateway.getGatewayCandidates();
        const apikey = gateway.getPublishableKey();
        if (!urls.length || (!apikey && !hasCookieRoute(urls))) {
            throw new Error('EDGE_GATEWAY_NOT_CONFIGURED');
        }

        const token = options.allowAnonymous ? '' : (options.token || getToken());
        if (!options.allowAnonymous && !token && !hasCookieRoute(urls)) {
            throw new Error('EDGE_GATEWAY_SESSION_MISSING');
        }

        let lastError = null;
        for (let index = 0; index < urls.length; index += 1) {
            const url = urls[index];
            const cookieRoute = sameOrigin(url);
            if (!options.allowAnonymous && !token && !cookieRoute) continue;

            const headers = { 'Content-Type': 'application/json' };
            if (apikey) headers.apikey = apikey;
            if (!options.allowAnonymous && token) headers.Authorization = `Bearer ${token}`;

            const controller = new AbortController();
            const timeoutMs = index === urls.length - 1 ? 18000 : 6000;
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify({ action, payload }),
                    signal: controller.signal,
                    credentials: cookieRoute ? 'include' : 'omit'
                });
                let data = null;
                try {
                    data = await response.json();
                } catch (_) {}

                if (response.ok && data?.ok) {
                    gateway.resolvedGatewayUrl = url;
                    if (action === 'session.verify' && data.token) setToken(data.token);
                    return data;
                }

                const message = data?.error || (response.ok ? 'EDGE_GATEWAY_INVALID_RESPONSE' : `EDGE_GATEWAY_HTTP_${response.status}`);
                lastError = new Error(message);
                if (index < urls.length - 1 && canRetry(gateway, response.status, message)) continue;
                throw lastError;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                if (index < urls.length - 1 && canRetry(gateway, 0, lastError.message)) continue;
                throw lastError;
            } finally {
                clearTimeout(timeoutId);
            }
        }
        throw lastError || new Error('EDGE_GATEWAY_REQUEST_FAILED');
    }

    root.GatewaySessionRuntime = {
        runtimeVersion: '1',
        clearSession,
        getToken,
        hasCookieRoute,
        request,
        restore: (gateway) => request(gateway, 'session.verify', {}),
        sameOrigin,
        setToken
    };
}(window));
