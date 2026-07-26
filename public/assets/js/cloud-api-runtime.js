(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.CloudApi) return;
    root.CloudApi = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCloudApiRuntime(root) {
    const SYSTEM_DATA_TABLE = 'system_data';
    const SYSTEM_DATA_API_PATH = '/api/system-data';
    const SELECT_CACHE_TTL_MS = 5 * 60 * 1000;
    const SELECT_CACHE_MAX = 200;
    const selectCache = new Map();
    const selectInflight = new Map();
    const cacheStats = {
        hits: 0,
        misses: 0,
        inflightHits: 0,
        writes: 0,
        clears: 0
    };
    const perfTimings = [];
    const PERF_TIMING_MAX = 80;
    const PERF_SLOW_MS = 250;

    function normalizeText(value) {
        return String(value || '').trim();
    }

    function normalizeOrigin(value) {
        return normalizeText(value).replace(/\/+$/, '');
    }

    function normalizeTimestamp(value) {
        if (value == null || value === '') return '';

        const directDate = value instanceof Date ? value : null;
        if (directDate && Number.isFinite(directDate.getTime())) {
            return directDate.toISOString();
        }

        if (typeof value === 'number' && Number.isFinite(value)) {
            const numericDate = new Date(value);
            return Number.isFinite(numericDate.getTime()) ? numericDate.toISOString() : '';
        }

        const text = normalizeText(value);
        if (!text) return '';
        const parsedDate = new Date(text);
        return Number.isFinite(parsedDate.getTime()) ? parsedDate.toISOString() : '';
    }

    function normalizeKeyList(value) {
        return Array.isArray(value)
            ? value.map((item) => normalizeText(item)).filter(Boolean).sort()
            : [];
    }

    function buildSelectCacheKey(options = {}) {
        return JSON.stringify({
            backend: getBackendMode(),
            apiUrl: getSystemDataApiUrl(),
            select: normalizeText(options.select || '*'),
            keyEq: normalizeText(options.keyEq),
            keyLike: normalizeText(options.keyLike),
            keyIn: normalizeKeyList(options.keyIn),
            kind: normalizeText(options.kind),
            keyPrefix: normalizeText(options.keyPrefix),
            cohortId: normalizeText(options.cohortId),
            projectKey: normalizeText(options.projectKey),
            cacheVersion: normalizeText(options.cacheVersion),
            order: normalizeText(options.order),
            ascending: options.ascending !== false,
            limit: Number.isFinite(Number(options.limit)) ? Number(options.limit) : 0,
            offset: Number.isFinite(Number(options.offset)) ? Number(options.offset) : 0,
            maybeSingle: !!options.maybeSingle
        });
    }

    function nowMs() {
        return root.performance && typeof root.performance.now === 'function'
            ? root.performance.now()
            : Date.now();
    }

    function shouldLogPerf(durationMs) {
        if (durationMs >= PERF_SLOW_MS) return true;
        try {
            return root.localStorage && root.localStorage.getItem('SCHOOL_SYSTEM_PERF') === 'true';
        } catch (_) {
            return false;
        }
    }

    function rememberPerfTiming(name, startedAt, detail = {}) {
        const durationMs = Math.round((nowMs() - startedAt) * 10) / 10;
        const entry = {
            name,
            durationMs,
            at: new Date().toISOString(),
            ...detail
        };
        perfTimings.push(entry);
        while (perfTimings.length > PERF_TIMING_MAX) perfTimings.shift();
        if (shouldLogPerf(durationMs)) {
            root.console?.info?.('[school-perf]', entry);
        }
        return entry;
    }

    function cloneCloudRow(row) {
        if (!row || typeof row !== 'object') return row;
        if (Array.isArray(row)) return row.map(cloneCloudRow);
        return { ...row };
    }

    function cloneCachedValue(value) {
        if (value == null) return value;
        if (typeof root.structuredClone === 'function') {
            try {
                return root.structuredClone(value);
            } catch (_) { }
        }
        if (Array.isArray(value)) return value.map(cloneCloudRow);
        if (typeof value === 'object') return cloneCloudRow(value);
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_) {
            return value;
        }
    }

    function cloneSelectResult(result) {
        if (!result || typeof result !== 'object') return result;
        return {
            ...result,
            data: cloneCachedValue(result.data)
        };
    }

    function clearSystemDataCache() {
        selectCache.clear();
        selectInflight.clear();
        cacheStats.clears += 1;
    }

    function rememberSelectResult(cacheKey, result) {
        if (!cacheKey || (result && result.error)) return;
        selectCache.set(cacheKey, {
            time: Date.now(),
            result: cloneSelectResult(result)
        });
        cacheStats.writes += 1;
        if (selectCache.size > SELECT_CACHE_MAX) {
            const firstKey = selectCache.keys().next().value;
            if (firstKey) selectCache.delete(firstKey);
        }
    }

    function getSystemDataCacheStats() {
        return {
            ...cacheStats,
            size: selectCache.size,
            inflight: selectInflight.size,
            ttlMs: SELECT_CACHE_TTL_MS,
            max: SELECT_CACHE_MAX
        };
    }

    function normalizeApiUrl(value) {
        const text = normalizeText(value);
        if (!text) return '';

        try {
            if (/\/api\/system-data$/i.test(text)) {
                return new URL(text, root.location && root.location.href ? root.location.href : undefined).toString().replace(/\/+$/, '');
            }
            return new URL(`${text}${SYSTEM_DATA_API_PATH}`, root.location && root.location.href ? root.location.href : undefined).toString().replace(/\/+$/, '');
        } catch (_) {
            return '';
        }
    }

    function isLocalFileRuntime() {
        const location = root.location || null;
        if (!location) return false;
        return normalizeText(location.protocol).toLowerCase() === 'file:';
    }

    function isLocalHost(hostname) {
        const normalized = normalizeText(hostname).toLowerCase();
        return !normalized
            || normalized === 'localhost'
            || normalized === '127.0.0.1'
            || normalized === '[::1]'
            || normalized.endsWith('.local');
    }

    function getStorage(name) {
        try {
            const storage = root && root[name];
            if (!storage) return null;
            if (typeof storage.getItem !== 'function') return null;
            return storage;
        } catch {
            return null;
        }
    }

    function getStoredValue(storageKey) {
        const storage = getStorage('localStorage');
        if (!storage) return '';
        try {
            return normalizeText(storage.getItem(storageKey));
        } catch {
            return '';
        }
    }

    function getExplicitSystemDataApiUrl() {
        return normalizeApiUrl(root.SYSTEM_DATA_API_URL || getStoredValue('SYSTEM_DATA_API_URL'));
    }

    function getProxyOrigin() {
        const explicitApiUrl = getExplicitSystemDataApiUrl();
        if (explicitApiUrl) return explicitApiUrl;
        if (isLocalFileRuntime()) return '';

        const explicitOrigin = normalizeOrigin(root.__SUPABASE_PROXY_ORIGIN);
        if (explicitOrigin) return `${explicitOrigin}${SYSTEM_DATA_API_PATH}`;

        const location = root.location || null;
        if (!location) return '';
        const protocol = normalizeText(location.protocol).toLowerCase();
        if (protocol !== 'https:' && protocol !== 'http:') return '';
        if (isLocalHost(location.hostname)) return '';
        return normalizeApiUrl(location.origin);
    }

    function getSystemDataApiUrl() {
        const explicitApiUrl = getExplicitSystemDataApiUrl();
        if (explicitApiUrl) return explicitApiUrl;
        if (root && root.__API_FALLBACK_ACTIVE__) return '';
        return getProxyOrigin();
    }

    function getBackendMode() {
        return getSystemDataApiUrl() ? 'api' : 'compat';
    }

    function getFetch() {
        return typeof root.fetch === 'function' ? root.fetch.bind(root) : null;
    }

    // Guard against a stalled cloud connection hanging the login-critical read
    // (dbSyncFromCloud awaits this with no ceiling of its own). Without an
    // AbortController a hung socket blocks for the browser default (~300s).
    // The ceiling MUST sit safely above the worst real cold-path pull: a first
    // login with an empty cache does a full remote workspace-blob fetch that,
    // against a cold backend, can legitimately take ~45-60s. A tighter ceiling
    // would abort that slow-but-working login and make it FAIL instead of
    // slowly succeed. 90s still converts the pathological ~300s hang into a
    // surfaced error without truncating a genuine slow pull. Runtimes without
    // AbortController (older test stubs) fall through to a plain fetch.
    const SYSTEM_DATA_FETCH_TIMEOUT_MS = 90000;
    async function fetchWithTimeout(fetchImpl, requestUrl, init = {}) {
        if (typeof root.AbortController !== 'function') {
            return fetchImpl(requestUrl, init);
        }
        const controller = new root.AbortController();
        const timeoutId = setTimeout(() => controller.abort(), SYSTEM_DATA_FETCH_TIMEOUT_MS);
        try {
            return await fetchImpl(requestUrl, Object.assign({}, init, { signal: controller.signal }));
        } finally {
            clearTimeout(timeoutId);
        }
    }

    function getSessionValue(storageKey) {
        const storage = getStorage('sessionStorage');
        if (!storage) return '';
        try {
            return normalizeText(storage.getItem(storageKey));
        } catch {
            return '';
        }
    }

    function getPublishableKey() {
        return normalizeText(
            root.CLOUD_API_KEY
            || root.SUPABASE_KEY
            || getStoredValue('CLOUD_API_KEY')
            || getStoredValue('SUPABASE_KEY')
        );
    }

    function getSessionAccessToken() {
        return normalizeText(
            getSessionValue('edu:session:token')
            || (root.EdgeGateway && typeof root.EdgeGateway.getToken === 'function' ? root.EdgeGateway.getToken() : '')
            || getSessionValue('EDGE_GATEWAY_TOKEN_V1')
        );
    }

    function getAccessToken() {
        return getSessionAccessToken() || getPublishableKey();
    }

    function buildApiHeaders(extraHeaders) {
        const headers = Object.assign({}, extraHeaders || {});
        const publishableKey = getPublishableKey();
        const accessToken = getAccessToken();

        if (publishableKey && !headers.apikey) {
            headers.apikey = publishableKey;
        }
        if (!headers.Authorization) {
            const bearerToken = accessToken || publishableKey;
            if (bearerToken) {
                headers.Authorization = `Bearer ${bearerToken}`;
            }
        }

        return headers;
    }

    function getCloudClient() {
        if (root.cloudClient) return root.cloudClient;
        if (root.sbClient) return root.sbClient;
        if (typeof root.initCloudClient === 'function') {
            try {
                root.initCloudClient();
            } catch (_) { }
        } else if (typeof root.initSupabase === 'function') {
            try {
                root.initSupabase();
            } catch (_) { }
        }
        return root.cloudClient || root.sbClient || null;
    }

    function isDuplicateKeyError(error) {
        const message = normalizeText(
            error && (error.message || error.error || error.code || '')
        );
        const bodyText = error && error.body ? normalizeText(JSON.stringify(error.body)) : '';
        const combined = `${message} ${bodyText}`;
        return /duplicate key|unique constraint|23505|system_data_pkey/i.test(combined);
    }

    function buildUpdatePayloadFromRow(row) {
        const payload = Object.assign({}, row || {});
        delete payload.key;
        if (!payload.updated_at) {
            payload.updated_at = new Date().toISOString();
        }
        delete payload.created_at;
        return payload;
    }

    async function upsertCompatRows(client, rows) {
        const list = Array.isArray(rows) ? rows : [rows];
        const payload = Array.isArray(rows) ? list : list[0];
        let bulkResult = await client.from(SYSTEM_DATA_TABLE).upsert(payload, { onConflict: 'key' });
        if (bulkResult && !bulkResult.error) {
            return {
                data: Array.isArray(rows) ? (bulkResult.data ?? []) : bulkResult.data ?? null,
                error: null,
                source: 'compat'
            };
        }

        if (!isDuplicateKeyError(bulkResult && bulkResult.error) || !client || typeof client.from !== 'function') {
            return {
                data: Array.isArray(rows) ? [] : null,
                error: bulkResult && Object.prototype.hasOwnProperty.call(bulkResult, 'error') ? bulkResult.error : new Error('SYSTEM_DATA_UPSERT_FAILED'),
                source: 'compat'
            };
        }

        const results = [];
        for (const row of list) {
            const updatePayload = buildUpdatePayloadFromRow(row);
            const result = await client.from(SYSTEM_DATA_TABLE).update(updatePayload).eq('key', row.key);
            if (result && result.error) {
                return {
                    data: results,
                    error: result.error,
                    source: 'compat'
                };
            }
            results.push(result && Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : null);
        }

        return {
            data: Array.isArray(rows) ? results : results[0] ?? null,
            error: null,
            source: 'compat'
        };
    }

    function buildSystemDataUrl(options) {
        const apiUrl = getSystemDataApiUrl();
        if (!apiUrl) return '';
        const url = new URL(apiUrl);
        const select = normalizeText(options && options.select);
        const order = normalizeText(options && options.order);
        const keyEq = normalizeText(options && options.keyEq);
        const keyLike = normalizeText(options && options.keyLike);
        const kind = normalizeText(options && options.kind);
        const keyPrefix = normalizeText(options && options.keyPrefix);
        const cohortId = normalizeText(options && options.cohortId);
        const projectKey = normalizeText(options && options.projectKey);
        const cacheVersion = normalizeText(options && options.cacheVersion);
        const limit = Number(options && options.limit);
        const offset = Number(options && options.offset);
        const keyIn = Array.isArray(options && options.keyIn)
            ? options.keyIn.map((item) => normalizeText(item)).filter(Boolean)
            : [];

        if (select) url.searchParams.set('select', select);
        if (keyEq) {
            url.searchParams.set('key', `eq.${keyEq}`);
        } else if (keyLike) {
            url.searchParams.set('key', `like.${keyLike}`);
        } else if (keyIn.length) {
            url.searchParams.set('key', `in.(${keyIn.join(',')})`);
        }
        if (kind) url.searchParams.set('kind', `eq.${kind}`);
        if (keyPrefix) url.searchParams.set('key_prefix', `eq.${keyPrefix}`);
        if (cohortId) url.searchParams.set('cohort_id', `eq.${cohortId}`);
        if (projectKey) url.searchParams.set('project_key', `eq.${projectKey}`);
        if (cacheVersion) url.searchParams.set('cache_version', cacheVersion);
        if (order) {
            url.searchParams.set('order', `${order}.${options && options.ascending ? 'asc' : 'desc'}`);
        }
        if (Number.isFinite(limit) && limit > 0) {
            url.searchParams.set('limit', String(Math.floor(limit)));
        }
        if (Number.isFinite(offset) && offset > 0 && !(options && options.maybeSingle)) {
            url.searchParams.set('offset', String(Math.floor(offset)));
        }

        return url.toString();
    }

    async function parseJsonResponse(response) {
        const text = await response.text();
        if (!text) return null;
        try {
            return JSON.parse(text);
        } catch (error) {
            const wrapped = new Error('SYSTEM_DATA_RESPONSE_INVALID');
            wrapped.cause = error;
            wrapped.responseText = text;
            throw wrapped;
        }
    }

    function buildApiError(response, body) {
        const error = new Error(
            normalizeText(body && (body.error || body.message))
            || `SYSTEM_DATA_HTTP_${response.status}`
        );
        error.status = response.status;
        error.body = body;
        return error;
    }

    let cloudAuthExpiredHandled = false;

    function handleCloudSessionExpired(error, { requestHadSession = false } = {}) {
        const status = Number(error && error.status);
        if (status !== 401 || !requestHadSession) return false;
        if (cloudAuthExpiredHandled) return true;
        cloudAuthExpiredHandled = true;
        try {
            if (root.sessionStorage && typeof root.sessionStorage.removeItem === 'function') {
                root.sessionStorage.removeItem('edu:session:token');
            }
            if (root.EdgeGateway && typeof root.EdgeGateway.clearSession === 'function') {
                root.EdgeGateway.clearSession();
            }
            if (root.AuthState && typeof root.AuthState.clearCurrentUser === 'function') {
                root.AuthState.clearCurrentUser();
            }
            if (root.Auth && typeof root.Auth.syncLoginOverlayState === 'function') {
                root.Auth.syncLoginOverlayState(true);
            }
            if (root.UI && typeof root.UI.toast === 'function') {
                root.UI.toast('登录状态已过期，请重新登录', 'warning');
            }
        } catch (_) { }
        return true;
    }

    async function selectViaApi(options) {
        const fetchImpl = getFetch();
        const requestUrl = buildSystemDataUrl(options || {});
        const requestHadSession = !!getSessionAccessToken();
        if (!fetchImpl || !requestUrl) {
            return {
                data: options && options.maybeSingle ? null : [],
                error: new Error('SYSTEM_DATA_API_UNAVAILABLE'),
                source: 'api'
            };
        }

        const headers = {};
        if (options && options.maybeSingle) {
            headers.Accept = 'application/vnd.pgrst.object+json';
        }

        try {
            const response = await fetchWithTimeout(fetchImpl, requestUrl, {
                method: 'GET',
                headers: buildApiHeaders(headers)
            });
            if (!response.ok) {
                const body = await parseJsonResponse(response).catch(() => null);
                if (options && options.maybeSingle && (response.status === 404 || response.status === 406)) {
                    return { data: null, error: null, source: 'api' };
                }
                const error = buildApiError(response, body);
                handleCloudSessionExpired(error, { requestHadSession });
                return {
                    data: options && options.maybeSingle ? null : [],
                    error,
                    source: 'api'
                };
            }

            return {
                data: await parseJsonResponse(response),
                error: null,
                source: 'api'
            };
        } catch (error) {
            return {
                data: options && options.maybeSingle ? null : [],
                error: error instanceof Error ? error : new Error(String(error)),
                source: 'api'
            };
        }
    }

    async function selectViaCompat(options) {
        const client = getCloudClient();
        if (!client || typeof client.from !== 'function') {
            return {
                data: options && options.maybeSingle ? null : [],
                error: new Error('CLOUD_CLIENT_MISSING'),
                source: 'compat'
            };
        }

        try {
            let query = client.from(SYSTEM_DATA_TABLE).select(normalizeText(options && options.select) || 'key');
            const keyEq = normalizeText(options && options.keyEq);
            const keyLike = normalizeText(options && options.keyLike);
            const kind = normalizeText(options && options.kind);
            const keyPrefix = normalizeText(options && options.keyPrefix);
            const cohortId = normalizeText(options && options.cohortId);
            const projectKey = normalizeText(options && options.projectKey);
            const keyIn = Array.isArray(options && options.keyIn)
                ? options.keyIn.map((item) => normalizeText(item)).filter(Boolean)
                : [];

            if (keyEq) {
                query = query.eq('key', keyEq);
            } else if (keyLike) {
                query = query.like('key', keyLike);
            } else if (keyIn.length) {
                query = query.in('key', keyIn);
            }
            if (kind) query = query.eq('kind', kind);
            if (keyPrefix) query = query.eq('key_prefix', keyPrefix);
            if (cohortId) query = query.eq('cohort_id', cohortId);
            if (projectKey) query = query.eq('project_key', projectKey);

            const order = normalizeText(options && options.order);
            if (order) {
                query = query.order(order, { ascending: !!(options && options.ascending) });
            }

            const limit = Number(options && options.limit);
            if (Number.isFinite(limit) && limit > 0) {
                query = query.limit(Math.floor(limit));
            }
            const offset = Number(options && options.offset);
            if (Number.isFinite(offset) && offset > 0 && !(options && options.maybeSingle) && typeof query.range === 'function' && Number.isFinite(limit) && limit > 0) {
                const safeOffset = Math.floor(offset);
                query = query.range(safeOffset, safeOffset + Math.floor(limit) - 1);
            }

            if (options && options.maybeSingle) {
                query = query.maybeSingle();
            }

            const result = await query;
            return {
                data: result && Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : null,
                error: result && Object.prototype.hasOwnProperty.call(result, 'error') ? result.error : null,
                source: 'compat'
            };
        } catch (error) {
            return {
                data: options && options.maybeSingle ? null : [],
                error: error instanceof Error ? error : new Error(String(error)),
                source: 'compat'
            };
        }
    }

    async function selectSystemData(options = {}) {
        const startedAt = nowMs();
        const useCache = options && options.cache !== false && options.noCache !== true;
        const cacheKey = useCache ? buildSelectCacheKey(options) : '';
        if (cacheKey) {
            const cached = selectCache.get(cacheKey);
            if (cached && Date.now() - cached.time < SELECT_CACHE_TTL_MS) {
                cacheStats.hits += 1;
                rememberPerfTiming('CloudApi.selectSystemData', startedAt, {
                    cache: 'hit',
                    source: cached.result?.source || getBackendMode(),
                    rows: Array.isArray(cached.result?.data) ? cached.result.data.length : (cached.result?.data ? 1 : 0),
                    select: normalizeText(options.select || '*'),
                    keyMode: options.keyEq ? 'eq' : options.keyLike ? 'like' : Array.isArray(options.keyIn) && options.keyIn.length ? 'in' : 'all',
                    limit: Number(options.limit) || 0,
                    offset: Number(options.offset) || 0
                });
                return cloneSelectResult(cached.result);
            }
            if (selectInflight.has(cacheKey)) {
                cacheStats.inflightHits += 1;
                const result = await selectInflight.get(cacheKey);
                rememberPerfTiming('CloudApi.selectSystemData', startedAt, {
                    cache: 'inflight',
                    source: result?.source || getBackendMode(),
                    rows: Array.isArray(result?.data) ? result.data.length : (result?.data ? 1 : 0),
                    select: normalizeText(options.select || '*'),
                    keyMode: options.keyEq ? 'eq' : options.keyLike ? 'like' : Array.isArray(options.keyIn) && options.keyIn.length ? 'in' : 'all',
                    limit: Number(options.limit) || 0,
                    offset: Number(options.offset) || 0
                });
                return cloneSelectResult(result);
            }
        }
        cacheStats.misses += 1;

        const request = (getBackendMode() === 'api'
            ? selectViaApi(options)
            : selectViaCompat(options))
            .then((result) => {
                rememberSelectResult(cacheKey, result);
                return result;
            })
            .finally(() => {
                if (cacheKey) selectInflight.delete(cacheKey);
            });
        if (cacheKey) selectInflight.set(cacheKey, request);
        const result = await request;
        rememberPerfTiming('CloudApi.selectSystemData', startedAt, {
            cache: useCache ? 'miss' : 'bypass',
            source: result?.source || getBackendMode(),
            rows: Array.isArray(result?.data) ? result.data.length : (result?.data ? 1 : 0),
            select: normalizeText(options.select || '*'),
            keyMode: options.keyEq ? 'eq' : options.keyLike ? 'like' : Array.isArray(options.keyIn) && options.keyIn.length ? 'in' : 'all',
            limit: Number(options.limit) || 0,
            offset: Number(options.offset) || 0,
            error: result?.error ? normalizeText(result.error.message || result.error) : ''
        });
        return result;
    }

    async function readSystemDataRecord(key, select = 'content') {
        return selectSystemData({
            select,
            keyEq: key,
            maybeSingle: true
        });
    }

    // Cold-login bootstrap: fetch the workspace row + latest exam metadata (+ the
    // newest exam shard) in ONE request. Returns the parsed bundle, or null when
    // unavailable (compat mode, 501 on supabase-only deployments, network error)
    // so callers transparently fall back to the legacy multi-request path.
    async function fetchColdLoginBundle(params = {}) {
        if (getBackendMode() !== 'api') return null;
        const apiUrl = getSystemDataApiUrl();
        const fetchImpl = getFetch();
        if (!apiUrl || !fetchImpl) return null;
        const cohortKey = normalizeText(params.cohortKey);
        if (!cohortKey) return null;
        const bootstrapUrl = apiUrl.replace(/\/api\/system-data(?:\/+)?$/, '/api/system-data-bootstrap');
        if (bootstrapUrl === apiUrl) return null;
        const body = { cohortKey };
        const cohortId = normalizeText(params.cohortId);
        if (cohortId) body.cohortId = cohortId;
        const currentExamKey = normalizeText(params.currentExamKey);
        if (currentExamKey) body.currentExamKey = currentExamKey;
        if (Number.isFinite(Number(params.latestExamLimit)) && Number(params.latestExamLimit) > 0) {
            body.latestExamLimit = Math.floor(Number(params.latestExamLimit));
        }
        try {
            const response = await fetchWithTimeout(fetchImpl, bootstrapUrl, {
                method: 'POST',
                headers: buildApiHeaders({ 'Content-Type': 'application/json' }),
                body: JSON.stringify(body)
            });
            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    const parsed = await parseJsonResponse(response).catch(() => null);
                    handleCloudSessionExpired(buildApiError(response, parsed), { requestHadSession: true });
                }
                return null;
            }
            const parsed = await parseJsonResponse(response).catch(() => null);
            if (!parsed || parsed.ok !== true) return null;
            return parsed;
        } catch (error) {
            return null;
        }
    }

    async function upsertSystemData(rows) {
        const normalizedRows = (Array.isArray(rows) ? rows : [rows])
            .map((row) => {
                const normalizedRow = {
                    key: normalizeText(row && row.key),
                    content: typeof (row && row.content) === 'string' ? row.content : ''
                };
                const createdAt = normalizeTimestamp(row && row.created_at);
                const updatedAt = normalizeTimestamp(row && row.updated_at);
                if (createdAt) normalizedRow.created_at = createdAt;
                if (updatedAt) normalizedRow.updated_at = updatedAt;
                return normalizedRow;
            })
            .filter((row) => row.key);

        if (!normalizedRows.length) {
            return { data: [], error: new Error('SYSTEM_DATA_ROWS_MISSING'), source: getBackendMode() };
        }

        if (getBackendMode() === 'api') {
            const fetchImpl = getFetch();
            const requestUrl = getSystemDataApiUrl();
            if (!fetchImpl || !requestUrl) {
                return { data: [], error: new Error('SYSTEM_DATA_API_UNAVAILABLE'), source: 'api' };
            }
            try {
                const response = await fetchImpl(requestUrl, {
                    method: 'POST',
                    headers: buildApiHeaders({
                        'Content-Type': 'application/json'
                    }),
                    body: JSON.stringify(Array.isArray(rows) ? normalizedRows : normalizedRows[0])
                });
                const body = await parseJsonResponse(response).catch(() => null);
                if (!response.ok) {
                    const error = buildApiError(response, body);
                    handleCloudSessionExpired(error);
                    return { data: body, error, source: 'api' };
                }
                clearSystemDataCache();
                return { data: body, error: null, source: 'api' };
            } catch (error) {
                return { data: [], error: error instanceof Error ? error : new Error(String(error)), source: 'api' };
            }
        }

        const client = getCloudClient();
        if (!client || typeof client.from !== 'function') {
            return { data: [], error: new Error('CLOUD_CLIENT_MISSING'), source: 'compat' };
        }

        try {
            const result = await upsertCompatRows(client, Array.isArray(rows) ? normalizedRows : normalizedRows[0]);
            if (!result.error) clearSystemDataCache();
            return result;
        } catch (error) {
            return { data: [], error: error instanceof Error ? error : new Error(String(error)), source: 'compat' };
        }
    }

    async function deleteSystemData(options = {}) {
        const keyEq = normalizeText(options && options.keyEq);
        const keyIn = Array.isArray(options && options.keyIn)
            ? options.keyIn.map((item) => normalizeText(item)).filter(Boolean)
            : [];

        if (!keyEq && !keyIn.length) {
            return { data: [], error: new Error('SYSTEM_DATA_DELETE_FILTER_MISSING'), source: getBackendMode() };
        }

        if (getBackendMode() === 'api') {
            const fetchImpl = getFetch();
            const requestUrl = buildSystemDataUrl({
                keyEq,
                keyIn
            });
            if (!fetchImpl || !requestUrl) {
                return { data: [], error: new Error('SYSTEM_DATA_API_UNAVAILABLE'), source: 'api' };
            }
            try {
                const response = await fetchImpl(requestUrl, {
                    method: 'DELETE',
                    headers: buildApiHeaders()
                });
                const body = await parseJsonResponse(response).catch(() => null);
                if (!response.ok) {
                    const error = buildApiError(response, body);
                    handleCloudSessionExpired(error);
                    return { data: body, error, source: 'api' };
                }
                clearSystemDataCache();
                return { data: body, error: null, source: 'api' };
            } catch (error) {
                return { data: [], error: error instanceof Error ? error : new Error(String(error)), source: 'api' };
            }
        }

        const client = getCloudClient();
        if (!client || typeof client.from !== 'function') {
            return { data: [], error: new Error('CLOUD_CLIENT_MISSING'), source: 'compat' };
        }

        try {
            let query = client.from(SYSTEM_DATA_TABLE).delete();
            if (keyEq) {
                query = query.eq('key', keyEq);
            } else {
                query = query.in('key', keyIn);
            }
            const queryResult = await query;
            const result = {
                data: queryResult && Object.prototype.hasOwnProperty.call(queryResult, 'data') ? queryResult.data : null,
                error: queryResult && Object.prototype.hasOwnProperty.call(queryResult, 'error') ? queryResult.error : null,
                source: 'compat'
            };
            if (!result.error) clearSystemDataCache();
            return result;
        } catch (error) {
            return { data: [], error: error instanceof Error ? error : new Error(String(error)), source: 'compat' };
        }
    }

    async function probeSystemData() {
        const result = await selectSystemData({
            select: 'key',
            limit: 1
        });
        return {
            ok: !result.error,
            error: result.error || null,
            source: result.source || getBackendMode()
        };
    }

    const apiRuntime = {
        SYSTEM_DATA_TABLE,
        SYSTEM_DATA_API_PATH,
        getSystemDataApiUrl,
        getBackendMode,
        getCloudClient,
        getSupabaseClient: getCloudClient,
        selectSystemData,
        readSystemDataRecord,
        fetchColdLoginBundle,
        upsertSystemData,
        deleteSystemData,
        clearSystemDataCache,
        getSystemDataCacheStats,
        getSystemDataPerfTimings() {
            return perfTimings.map((item) => ({ ...item }));
        },
        probeSystemData
    };
    if (typeof module === 'object' && module.exports) {
        apiRuntime._test = {
            handleCloudSessionExpired
        };
    }
    return apiRuntime;
});
