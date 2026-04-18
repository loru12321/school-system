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

    function normalizeText(value) {
        return String(value || '').trim();
    }

    function normalizeOrigin(value) {
        return normalizeText(value).replace(/\/+$/, '');
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
        return getBackendMode() === 'api'
            ? selectViaApi(options)
            : selectViaCompat(options);
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
            .map((row) => ({
                key: normalizeText(row && row.key),
                content: typeof (row && row.content) === 'string' ? row.content : '',
                created_at: normalizeText(row && row.created_at),
                updated_at: normalizeText(row && row.updated_at)
            }))
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
            const result = await client.from(SYSTEM_DATA_TABLE).upsert(
                Array.isArray(rows) ? normalizedRows : normalizedRows[0],
                { onConflict: 'key' }
            );
            return {
                data: result && Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : null,
                error: result && Object.prototype.hasOwnProperty.call(result, 'error') ? result.error : null,
                source: 'compat'
            };
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
            const result = await query;
            return {
                data: result && Object.prototype.hasOwnProperty.call(result, 'data') ? result.data : null,
                error: result && Object.prototype.hasOwnProperty.call(result, 'error') ? result.error : null,
                source: 'compat'
            };
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
        probeSystemData
    };
});
