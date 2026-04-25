(() => {
    if (typeof window === 'undefined' || window.__SYSTEM_PERFORMANCE_RUNTIME_PATCHED__) return;

    const DEFAULT_TTL_MS = 30000;
    const MAX_CACHE_SIZE = 80;
    const MAX_CONCURRENT_TASKS = 2;
    const DIRECT_READ_METHODS = new Set(['loadTeachers']);
    const state = {
        active: 0,
        queue: [],
        inflight: new Map(),
        cache: new Map(),
        patchAttempts: 0,
        longTasks: []
    };

    function now() {
        return Date.now();
    }

    function stableStringify(value) {
        if (value == null) return '';
        if (typeof value !== 'object') return String(value);
        if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
        return `{${Object.keys(value).sort().map((key) => `${key}:${stableStringify(value[key])}`).join(',')}}`;
    }

    function cloneValue(value) {
        if (value == null) return value;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch (_) {
            return value;
        }
    }

    function remember(cacheKey, value, ttlMs) {
        if (!cacheKey || ttlMs <= 0) return;
        state.cache.set(cacheKey, {
            time: now(),
            ttlMs,
            value: cloneValue(value)
        });
        if (state.cache.size > MAX_CACHE_SIZE) {
            const firstKey = state.cache.keys().next().value;
            if (firstKey) state.cache.delete(firstKey);
        }
    }

    function readCache(cacheKey) {
        if (!cacheKey) return { hit: false };
        const cached = state.cache.get(cacheKey);
        if (!cached) return { hit: false };
        if (now() - cached.time > cached.ttlMs) {
            state.cache.delete(cacheKey);
            return { hit: false };
        }
        return { hit: true, value: cloneValue(cached.value) };
    }

    function drainQueue() {
        while (state.active < MAX_CONCURRENT_TASKS && state.queue.length) {
            const item = state.queue.shift();
            state.active += 1;
            const start = now();
            Promise.resolve()
                .then(item.task)
                .then((value) => {
                    remember(item.cacheKey, value, item.ttlMs);
                    item.resolve(value);
                })
                .catch(item.reject)
                .finally(() => {
                    state.active -= 1;
                    if (item.cacheKey) state.inflight.delete(item.cacheKey);
                    const duration = now() - start;
                    if (duration > 1200) {
                        state.longTasks.push({
                            key: item.cacheKey || item.label || 'task',
                            duration,
                            time: new Date().toISOString()
                        });
                        state.longTasks = state.longTasks.slice(-20);
                    }
                    drainQueue();
                });
        }
    }

    function enqueue(task, options = {}) {
        const label = String(options.label || 'task');
        const cacheKey = String(options.cacheKey || '');
        const ttlMs = Number.isFinite(Number(options.ttlMs)) ? Number(options.ttlMs) : DEFAULT_TTL_MS;
        if (cacheKey) {
            const cached = readCache(cacheKey);
            if (cached.hit) return Promise.resolve(cached.value);
            if (state.inflight.has(cacheKey)) return state.inflight.get(cacheKey);
        }

        const promise = new Promise((resolve, reject) => {
            state.queue.push({
                label,
                cacheKey,
                ttlMs,
                task,
                resolve,
                reject,
                priority: Number(options.priority || 0)
            });
            state.queue.sort((a, b) => b.priority - a.priority);
            scheduleIdle(drainQueue);
        });
        if (cacheKey) state.inflight.set(cacheKey, promise);
        return promise;
    }

    function scheduleIdle(task, options = {}) {
        const timeout = Number.isFinite(Number(options.timeout)) ? Number(options.timeout) : 1200;
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(task, { timeout });
            return;
        }
        window.setTimeout(task, Number.isFinite(Number(options.delay)) ? Number(options.delay) : 0);
    }

    function clearCache(prefix = '') {
        const text = String(prefix || '');
        if (!text) {
            state.cache.clear();
            state.inflight.clear();
            return;
        }
        Array.from(state.cache.keys()).forEach((key) => {
            if (String(key).startsWith(text)) state.cache.delete(key);
        });
        Array.from(state.inflight.keys()).forEach((key) => {
            if (String(key).startsWith(text)) state.inflight.delete(key);
        });
    }

    function buildCloudKey(method, args) {
        return `cloud:${method}:${stableStringify(args)}`;
    }

    function wrapCloudRead(manager, method, ttlMs) {
        const original = manager && manager[method];
        if (typeof original !== 'function' || original.__systemPerformanceWrapped) return;
        const wrapped = function (...args) {
            const options = args.length && args[args.length - 1] && typeof args[args.length - 1] === 'object'
                ? args[args.length - 1]
                : {};
            const isBackground = !!options.background;
            const noCache = options.cache === false || options.noCache === true || options.force === true;
            const cacheKey = noCache ? '' : buildCloudKey(method, args);
            if (DIRECT_READ_METHODS.has(method)) {
                const cached = noCache ? { hit: false } : readCache(cacheKey);
                if (cached.hit) return Promise.resolve(cached.value);
                if (cacheKey && state.inflight.has(cacheKey)) return state.inflight.get(cacheKey);
                const directPromise = Promise.resolve()
                    .then(() => original.apply(this, args))
                    .then((value) => {
                        remember(cacheKey, value, noCache ? 0 : ttlMs);
                        return value;
                    })
                    .finally(() => {
                        if (cacheKey) state.inflight.delete(cacheKey);
                    });
                if (cacheKey) state.inflight.set(cacheKey, directPromise);
                return directPromise;
            }
            return enqueue(() => original.apply(this, args), {
                label: method,
                cacheKey,
                ttlMs: noCache ? 0 : ttlMs,
                priority: isBackground ? -1 : 1
            });
        };
        wrapped.__systemPerformanceWrapped = true;
        manager[method] = wrapped;
    }

    function wrapCloudWrite(manager, method) {
        const original = manager && manager[method];
        if (typeof original !== 'function' || original.__systemPerformanceWrapped) return;
        const wrapped = async function (...args) {
            clearCache('cloud:');
            if (window.CloudApi && typeof window.CloudApi.clearSystemDataCache === 'function') {
                window.CloudApi.clearSystemDataCache();
            }
            return original.apply(this, args);
        };
        wrapped.__systemPerformanceWrapped = true;
        manager[method] = wrapped;
    }

    function patchCloudManager() {
        const manager = window.CloudManager;
        if (!manager) return false;
        wrapCloudRead(manager, 'load', 15000);
        wrapCloudRead(manager, 'loadTeachers', 45000);
        wrapCloudRead(manager, 'fetchAllCohortExams', 60000);
        wrapCloudRead(manager, 'fetchCohortExamsToLocal', 45000);
        wrapCloudRead(manager, 'fetchStudentExamHistory', 30000);
        ['save', 'saveTeachers', 'uploadReport', 'uploadAuditLogs', 'flushWorkspaceSyncQueue'].forEach((method) => {
            wrapCloudWrite(manager, method);
        });
        return ['load', 'loadTeachers', 'fetchAllCohortExams', 'fetchCohortExamsToLocal', 'fetchStudentExamHistory']
            .every((method) => typeof manager[method] !== 'function' || manager[method].__systemPerformanceWrapped);
    }

    function installLongTaskObserver() {
        if (typeof PerformanceObserver !== 'function') return;
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    state.longTasks.push({
                        key: entry.name || 'longtask',
                        duration: Math.round(entry.duration || 0),
                        time: new Date().toISOString()
                    });
                });
                state.longTasks = state.longTasks.slice(-20);
            });
            observer.observe({ entryTypes: ['longtask'] });
        } catch (_) {}
    }

    function getSnapshot() {
        return {
            active: state.active,
            queued: state.queue.length,
            inflight: state.inflight.size,
            cached: state.cache.size,
            cloudPatched: patchCloudManager(),
            longTasks: state.longTasks.slice()
        };
    }

    window.SystemPerformance = {
        enqueue,
        scheduleIdle,
        clearCache,
        patchCloudManager,
        getSnapshot
    };

    installLongTaskObserver();

    const patchTimer = window.setInterval(() => {
        state.patchAttempts += 1;
        const patched = patchCloudManager();
        if (patched && state.patchAttempts > 12) window.clearInterval(patchTimer);
        if (state.patchAttempts > 80) window.clearInterval(patchTimer);
    }, 250);
    scheduleIdle(patchCloudManager, { timeout: 800 });

    window.__SYSTEM_PERFORMANCE_RUNTIME_PATCHED__ = true;
})();
