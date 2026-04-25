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
    const SELECT_CACHE_TTL_MS = 90000;
    const SELECT_CACHE_MAX = 200;
    const selectCache = new Map();
    const selectInflight = new Map();

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
            order: normalizeText(options.order),
            ascending: options.ascending !== false,
            limit: Number.isFinite(Number(options.limit)) ? Number(options.limit) : 0,
            maybeSingle: !!options.maybeSingle
        });
    }

    function cloneCachedValue(value) {
        if (value == null) return value;
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
    }

    function rememberSelectResult(cacheKey, result) {
        if (!cacheKey || (result && result.error)) return;
        selectCache.set(cacheKey, {
            time: Date.now(),
            result: cloneSelectResult(result)
        });
        if (selectCache.size > SELECT_CACHE_MAX) {
            const firstKey = selectCache.keys().next().value;
            if (firstKey) selectCache.delete(firstKey);
        }
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

    function getProxyOrigin() {
        if (isLocalFileRuntime()) return '';
        const explicitApiUrl = normalizeApiUrl(root.SYSTEM_DATA_API_URL || getStoredValue('SYSTEM_DATA_API_URL'));
        if (explicitApiUrl) return explicitApiUrl;

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
        if (root && root.__API_FALLBACK_ACTIVE__) return '';
        return getProxyOrigin();
    }

    function getBackendMode() {
        return getSystemDataApiUrl() ? 'api' : 'compat';
    }

    function getFetch() {
        return typeof root.fetch === 'function' ? root.fetch.bind(root) : null;
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

    function getAccessToken() {
        return getSessionValue('edu:session:token');
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
        const results = [];

        for (const row of list) {
            let result = await client.from(SYSTEM_DATA_TABLE).upsert(row, { onConflict: 'key' });
            if (result && !result.error) {
                results.push(result.data ?? null);
                continue;
            }

            if (!isDuplicateKeyError(result && result.error) || !client || typeof client.from !== 'function') {
                return {
                    data: results,
                    error: result && Object.prototype.hasOwnProperty.call(result, 'error') ? result.error : new Error('SYSTEM_DATA_UPSERT_FAILED'),
                    source: 'compat'
                };
            }

            const updatePayload = buildUpdatePayloadFromRow(row);
            const updateQuery = client.from(SYSTEM_DATA_TABLE).update(updatePayload).eq('key', row.key);
            result = await updateQuery;
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
        const limit = Number(options && options.limit);
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
        if (order) {
            url.searchParams.set('order', `${order}.${options && options.ascending ? 'asc' : 'desc'}`);
        }
        if (Number.isFinite(limit) && limit > 0) {
            url.searchParams.set('limit', String(Math.floor(limit)));
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

    async function selectViaApi(options) {
        const fetchImpl = getFetch();
        const requestUrl = buildSystemDataUrl(options || {});
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
            const response = await fetchImpl(requestUrl, {
                method: 'GET',
                headers: buildApiHeaders(headers)
            });
            if (!response.ok) {
                const body = await parseJsonResponse(response).catch(() => null);
                if (options && options.maybeSingle && (response.status === 404 || response.status === 406)) {
                    return { data: null, error: null, source: 'api' };
                }
                return {
                    data: options && options.maybeSingle ? null : [],
                    error: buildApiError(response, body),
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

            const order = normalizeText(options && options.order);
            if (order) {
                query = query.order(order, { ascending: !!(options && options.ascending) });
            }

            const limit = Number(options && options.limit);
            if (Number.isFinite(limit) && limit > 0) {
                query = query.limit(Math.floor(limit));
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
        const useCache = options && options.cache !== false && options.noCache !== true;
        const cacheKey = useCache ? buildSelectCacheKey(options) : '';
        if (cacheKey) {
            const cached = selectCache.get(cacheKey);
            if (cached && Date.now() - cached.time < SELECT_CACHE_TTL_MS) {
                return cloneSelectResult(cached.result);
            }
            if (selectInflight.has(cacheKey)) {
                return cloneSelectResult(await selectInflight.get(cacheKey));
            }
        }

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
        return cloneSelectResult(await request);
    }

    async function readSystemDataRecord(key, select = 'content') {
        return selectSystemData({
            select,
            keyEq: key,
            maybeSingle: true
        });
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
                    return { data: body, error: buildApiError(response, body), source: 'api' };
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
                    return { data: body, error: buildApiError(response, body), source: 'api' };
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

    return {
        SYSTEM_DATA_TABLE,
        SYSTEM_DATA_API_PATH,
        getSystemDataApiUrl,
        getBackendMode,
        getCloudClient,
        getSupabaseClient: getCloudClient,
        selectSystemData,
        readSystemDataRecord,
        upsertSystemData,
        deleteSystemData,
        clearSystemDataCache,
        probeSystemData
    };
});
