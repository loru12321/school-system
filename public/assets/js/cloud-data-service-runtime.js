(() => {
    if (typeof window === 'undefined' || window.CloudDataService) return;

    const DEFAULT_TTL_MS = 2 * 60 * 1000;
    const LONG_TTL_MS = 10 * 60 * 1000;
    const METADATA_TTL_MS = 5 * 60 * 1000;
    const CACHE_MAX = 240;
    const state = {
        cache: new Map(),
        inflight: new Map()
    };
    const perfTimings = [];
    const PERF_TIMING_MAX = 80;
    const PERF_SLOW_MS = 250;

    function stableStringify(value) {
        if (value === null || typeof value !== 'object') return JSON.stringify(value);
        if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }

    function getCacheKey(type, options) {
        return `${type}:${stableStringify(options || {})}`;
    }

    function nowMs() {
        return window.performance && typeof window.performance.now === 'function'
            ? window.performance.now()
            : Date.now();
    }

    function shouldLogPerf(durationMs) {
        if (durationMs >= PERF_SLOW_MS) return true;
        try {
            return window.localStorage && window.localStorage.getItem('SCHOOL_SYSTEM_PERF') === 'true';
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
            window.console?.info?.('[school-perf]', entry);
        }
        return entry;
    }

    function summarizeRows(result) {
        return Array.isArray(result?.data) ? result.data.length : (result?.data ? 1 : 0);
    }

    function cloneResult(result) {
        if (!result || typeof result !== 'object') return result;
        if (typeof window.structuredClone === 'function') {
            try {
                return window.structuredClone(result);
            } catch (_) { }
        }
        try {
            return JSON.parse(JSON.stringify(result));
        } catch (_) {
            return result;
        }
    }

    function getCached(key) {
        const cached = state.cache.get(key);
        if (!cached) return null;
        if (Date.now() - cached.at > cached.ttl) {
            state.cache.delete(key);
            return null;
        }
        return cloneResult(cached.value);
    }

    function setCached(key, value, ttl) {
        state.cache.set(key, {
            at: Date.now(),
            ttl: Number(ttl) > 0 ? Number(ttl) : DEFAULT_TTL_MS,
            value: cloneResult(value)
        });
        if (state.cache.size > CACHE_MAX) {
            const firstKey = state.cache.keys().next().value;
            if (firstKey) state.cache.delete(firstKey);
        }
        return value;
    }

    function isMetadataSelect(select) {
        const text = String(select || '').toLowerCase();
        return !!text && !text.includes('content');
    }

    function getReadTtl(options = {}) {
        if (options?.maybeSingle || options?.keyEq) return LONG_TTL_MS;
        if (isMetadataSelect(options?.select)) return METADATA_TTL_MS;
        return DEFAULT_TTL_MS;
    }

    function getCloudApi() {
        return window.CloudApi && typeof window.CloudApi === 'object' ? window.CloudApi : null;
    }

    function makeUnavailableResult(data, message) {
        return {
            data,
            error: new Error(message || 'Cloud data service unavailable'),
            source: 'none'
        };
    }

    async function runCached(type, options, task, config = {}) {
        const startedAt = nowMs();
        const key = getCacheKey(type, options);
        const cached = getCached(key);
        if (!config.force && cached) {
            rememberPerfTiming(`CloudDataService.${type}`, startedAt, {
                cache: 'hit',
                rows: summarizeRows(cached),
                select: String(options?.select || ''),
                keyMode: options?.keyEq ? 'eq' : options?.keyLike ? 'like' : Array.isArray(options?.keyIn) && options.keyIn.length ? 'in' : 'all',
                limit: Number(options?.limit) || 0,
                offset: Number(options?.offset) || 0
            });
            return cached;
        }
        if (!config.force && state.inflight.has(key)) {
            const result = await state.inflight.get(key);
            rememberPerfTiming(`CloudDataService.${type}`, startedAt, {
                cache: 'inflight',
                rows: summarizeRows(result),
                select: String(options?.select || ''),
                keyMode: options?.keyEq ? 'eq' : options?.keyLike ? 'like' : Array.isArray(options?.keyIn) && options.keyIn.length ? 'in' : 'all',
                limit: Number(options?.limit) || 0,
                offset: Number(options?.offset) || 0
            });
            return result;
        }
        const promise = Promise.resolve()
            .then(task)
            .then((result) => {
                const hasError = result && typeof result === 'object' && result.error;
                if (!hasError) setCached(key, result, config.ttl || DEFAULT_TTL_MS);
                return result;
            })
            .finally(() => {
                state.inflight.delete(key);
            });
        state.inflight.set(key, promise);
        const result = await promise;
        rememberPerfTiming(`CloudDataService.${type}`, startedAt, {
            cache: config.force ? 'force' : 'miss',
            source: result?.source || '',
            rows: summarizeRows(result),
            select: String(options?.select || ''),
            keyMode: options?.keyEq ? 'eq' : options?.keyLike ? 'like' : Array.isArray(options?.keyIn) && options.keyIn.length ? 'in' : 'all',
            limit: Number(options?.limit) || 0,
            offset: Number(options?.offset) || 0,
            error: result?.error ? String(result.error.message || result.error) : ''
        });
        return result;
    }

    function clear(pattern = '') {
        const text = String(pattern || '').trim();
        if (!text) {
            state.cache.clear();
            state.inflight.clear();
            return;
        }
        Array.from(state.cache.keys()).forEach((key) => {
            if (key.includes(text)) state.cache.delete(key);
        });
        Array.from(state.inflight.keys()).forEach((key) => {
            if (key.includes(text)) state.inflight.delete(key);
        });
    }

    async function selectSystemData(options = {}, taskOrConfig, maybeConfig) {
        const hasTask = typeof taskOrConfig === 'function';
        const task = hasTask
            ? taskOrConfig
            : (() => {
                const api = getCloudApi();
                if (api && typeof api.selectSystemData === 'function') {
                    return api.selectSystemData(options);
                }
                const legacy = window.selectSystemDataRecords;
                if (typeof legacy === 'function' && legacy !== selectSystemDataRecords) {
                    return legacy(options);
                }
                return makeUnavailableResult(options.maybeSingle ? null : [], 'CloudApi.selectSystemData unavailable');
            });
        const config = hasTask ? (maybeConfig || {}) : (taskOrConfig || {});
        const ttl = getReadTtl(options);
        return runCached('selectSystemData', options, task, { ttl, ...config });
    }

    async function selectSystemDataRecords(options = {}, taskOrConfig, maybeConfig) {
        const hasTask = typeof taskOrConfig === 'function';
        const task = hasTask
            ? taskOrConfig
            : (() => {
                const api = getCloudApi();
                if (api && typeof api.selectSystemData === 'function') {
                    return api.selectSystemData(options);
                }
                const legacy = window.selectSystemDataRecords;
                if (typeof legacy === 'function' && legacy !== selectSystemDataRecords) {
                    return legacy(options);
                }
                return makeUnavailableResult(options.maybeSingle ? null : [], 'selectSystemDataRecords unavailable');
            });
        const config = hasTask ? (maybeConfig || {}) : (taskOrConfig || {});
        return runCached('selectSystemDataRecords', options, task, { ttl: getReadTtl(options), ...config });
    }

    async function readSystemDataRecord(key, select = 'content', config = {}) {
        const normalizedKey = String(key || '').trim();
        const options = {
            keyEq: normalizedKey,
            select: select || 'content',
            maybeSingle: true
        };
        if (!normalizedKey) return makeUnavailableResult(null, 'SYSTEM_DATA_KEY_MISSING');
        return runCached('readSystemDataRecord', options, () => {
            const api = getCloudApi();
            if (api && typeof api.readSystemDataRecord === 'function') {
                return api.readSystemDataRecord(normalizedKey, options.select);
            }
            const legacy = window.readSystemDataRecord;
            if (typeof legacy === 'function' && legacy !== readSystemDataRecord) {
                return legacy(normalizedKey, options.select);
            }
            return makeUnavailableResult(null, 'readSystemDataRecord unavailable');
        }, { ttl: getReadTtl(options), ...config });
    }

    async function upsertSystemDataRecord(rows, config = {}) {
        clear();
        const api = getCloudApi();
        let result;
        if (api && typeof api.upsertSystemData === 'function') {
            result = await api.upsertSystemData(rows, config);
        } else {
            const legacy = window.upsertSystemDataRecord;
            result = typeof legacy === 'function' && legacy !== upsertSystemDataRecord
                ? await legacy(rows)
                : makeUnavailableResult(null, 'upsertSystemDataRecord unavailable');
        }
        if (!result?.error) clear();
        return result;
    }

    async function deleteSystemDataRecords(options = {}, config = {}) {
        clear();
        const api = getCloudApi();
        let result;
        if (api && typeof api.deleteSystemData === 'function') {
            result = await api.deleteSystemData(options, config);
        } else {
            const legacy = window.deleteSystemDataRecords;
            result = typeof legacy === 'function' && legacy !== deleteSystemDataRecords
                ? await legacy(options)
                : makeUnavailableResult(null, 'deleteSystemDataRecords unavailable');
        }
        if (!result?.error) clear();
        return result;
    }

    window.CloudDataService = {
        selectSystemData,
        selectSystemDataRecords,
        readSystemDataRecord,
        upsertSystemDataRecord,
        deleteSystemDataRecords,
        runCached,
        clear,
        getStats() {
            return {
                cacheSize: state.cache.size,
                inflightSize: state.inflight.size,
                ttlMs: {
                    default: DEFAULT_TTL_MS,
                    long: LONG_TTL_MS,
                    metadata: METADATA_TTL_MS
                },
                max: CACHE_MAX
            };
        },
        getPerfTimings() {
            return perfTimings.map((item) => ({ ...item }));
        }
    };
})();
