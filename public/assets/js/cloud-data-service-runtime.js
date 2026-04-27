(() => {
    if (typeof window === 'undefined' || window.CloudDataService) return;

    const DEFAULT_TTL_MS = 30000;
    const LONG_TTL_MS = 120000;
    const state = {
        cache: new Map(),
        inflight: new Map()
    };

    function stableStringify(value) {
        if (value === null || typeof value !== 'object') return JSON.stringify(value);
        if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
        return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
    }

    function getCacheKey(type, options) {
        return `${type}:${stableStringify(options || {})}`;
    }

    function cloneResult(result) {
        if (!result || typeof result !== 'object') return result;
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
        return value;
    }

    async function runCached(type, options, task, config = {}) {
        const key = getCacheKey(type, options);
        const cached = getCached(key);
        if (!config.force && cached) return cached;
        if (!config.force && state.inflight.has(key)) return state.inflight.get(key);
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
        return promise;
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
    }

    async function selectSystemData(options = {}, taskOrConfig, maybeConfig) {
        const hasTask = typeof taskOrConfig === 'function';
        const task = hasTask
            ? taskOrConfig
            : (() => {
                const api = window.CloudApi;
                if (!api || typeof api.selectSystemData !== 'function') {
                    return { data: [], error: new Error('CloudApi.selectSystemData unavailable') };
                }
                return api.selectSystemData(options);
            });
        const config = hasTask ? (maybeConfig || {}) : (taskOrConfig || {});
        const ttl = options?.maybeSingle || options?.keyEq ? LONG_TTL_MS : DEFAULT_TTL_MS;
        return runCached('selectSystemData', options, task, { ttl, ...config });
    }

    async function selectSystemDataRecords(options = {}, taskOrConfig, maybeConfig) {
        const hasTask = typeof taskOrConfig === 'function';
        const task = hasTask
            ? taskOrConfig
            : (() => {
                if (typeof window.selectSystemDataRecords !== 'function') {
                    return { data: [], error: new Error('selectSystemDataRecords unavailable') };
                }
                return window.selectSystemDataRecords(options);
            });
        const config = hasTask ? (maybeConfig || {}) : (taskOrConfig || {});
        return runCached('selectSystemDataRecords', options, task, { ttl: DEFAULT_TTL_MS, ...config });
    }

    window.CloudDataService = {
        selectSystemData,
        selectSystemDataRecords,
        runCached,
        clear,
        getStats() {
            return {
                cacheSize: state.cache.size,
                inflightSize: state.inflight.size
            };
        }
    };
})();
