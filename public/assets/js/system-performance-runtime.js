(() => {
    if (typeof window === 'undefined' || window.__SYSTEM_PERFORMANCE_RUNTIME_PATCHED__) return;

    const DEFAULT_TTL_MS = 30000;
    const MAX_CACHE_SIZE = 80;
    const MAX_CONCURRENT_TASKS = 4;
    const MAX_TASK_HISTORY = 80;
    const DIRECT_READ_METHODS = new Set(['loadTeachers', 'fetchStudentExamHistory']);
    const state = {
        active: 0,
        queue: [],
        inflight: new Map(),
        scheduled: new Map(),
        cache: new Map(),
        patchAttempts: 0,
        patchedStableTicks: 0,
        // 仅 PerformanceObserver('longtask') 写入这里。不要把网络/await 的端到端
        // 等待混进来，否则“慢请求”会被错误地当作页面主线程卡顿。
        nativeLongTasks: [],
        // 调度器任务保留端到端数据：durationMs 是实际运行到完成，blockedMs 是同步
        // 主线程占用，networkWaitMs 是由二者派生的非阻塞等待（可能包含网络/定时器）。
        // 不建立独立 networkWaits 队列，避免同一事实被两套指标重复解释。
        scheduledTasks: [],
        phaseStack: []
    };

    function now() {
        return Date.now();
    }

    function monotonicNow() {
        const perf = window.performance;
        return perf && typeof perf.now === 'function' ? perf.now() : now();
    }

    function roundMs(value) {
        const number = Number(value);
        return Number.isFinite(number) ? Math.max(0, Math.round(number * 10) / 10) : 0;
    }

    function rememberScheduledTask(detail = {}) {
        const durationMs = roundMs(Number(detail.finishedAt) - Number(detail.startedAt));
        const blockedMs = Math.min(durationMs, roundMs(detail.blockedMs));
        state.scheduledTasks.push({
            key: String(detail.key || detail.label || 'task'),
            type: String(detail.type || 'scheduled'),
            durationMs,
            blockedMs,
            // This is intentionally a derived field, not a separate event stream.
            // It represents non-blocking wait and is only a network proxy when the
            // task itself is a cloud read.
            networkWaitMs: roundMs(durationMs - blockedMs),
            queuedMs: roundMs(Number(detail.startedAt) - Number(detail.queuedAt)),
            status: detail.status === 'error' ? 'error' : 'ok',
            phase: String(detail.phase || ''),
            time: new Date().toISOString()
        });
        state.scheduledTasks = state.scheduledTasks.slice(-MAX_TASK_HISTORY);
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
            const startedAt = monotonicNow();
            const phase = currentPhase();
            let blockedMs = 0;
            let status = 'ok';
            Promise.resolve()
                .then(() => {
                    const blockedStartedAt = monotonicNow();
                    try {
                        return item.task();
                    } finally {
                        blockedMs = roundMs(monotonicNow() - blockedStartedAt);
                    }
                })
                .then((value) => {
                    remember(item.cacheKey, value, item.ttlMs);
                    item.resolve(value);
                })
                .catch((error) => {
                    status = 'error';
                    item.reject(error);
                })
                .finally(() => {
                    state.active -= 1;
                    if (item.cacheKey) state.inflight.delete(item.cacheKey);
                    rememberScheduledTask({
                        key: item.cacheKey || item.label || 'task',
                        type: 'queue',
                        queuedAt: item.queuedAt,
                        startedAt,
                        finishedAt: monotonicNow(),
                        blockedMs,
                        status,
                        phase
                    });
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
                priority: Number(options.priority || 0),
                queuedAt: monotonicNow()
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

    function clearScheduledTask(label) {
        const key = String(label || '');
        if (!key || !state.scheduled.has(key)) return false;
        const item = state.scheduled.get(key);
        item.cancelled = true;
        if (item.timerId) window.clearTimeout(item.timerId);
        if (item.frameId && typeof window.cancelAnimationFrame === 'function') {
            window.cancelAnimationFrame(item.frameId);
        }
        if (item.idleId && typeof window.cancelIdleCallback === 'function') {
            window.cancelIdleCallback(item.idleId);
        }
        state.scheduled.delete(key);
        return true;
    }

    function scheduleTask(label, task, options = {}) {
        const key = String(label || options.label || 'task').trim();
        if (!key || typeof task !== 'function') return '';
        const replace = options.replace !== false;
        if (replace) clearScheduledTask(key);
        if (!replace && state.scheduled.has(key)) return key;

        const item = {
            label: key,
            task,
            timerId: 0,
            frameId: 0,
            idleId: 0,
            cancelled: false,
            queuedAt: monotonicNow()
        };

        const run = () => {
            if (item.cancelled) return;
            state.scheduled.delete(key);
            const startedAt = monotonicNow();
            const phase = currentPhase();
            let blockedMs = 0;
            let status = 'ok';
            let result;
            try {
                const blockedStartedAt = monotonicNow();
                try {
                    result = task();
                } finally {
                    blockedMs = roundMs(monotonicNow() - blockedStartedAt);
                }
            } catch (error) {
                status = 'error';
                console.warn(`[SystemPerformance:${key}]`, error);
            }
            Promise.resolve(result)
                .catch((error) => {
                    status = 'error';
                    console.warn(`[SystemPerformance:${key}]`, error);
                })
                .finally(() => {
                    rememberScheduledTask({
                        key,
                        type: 'scheduled',
                        queuedAt: item.queuedAt,
                        startedAt,
                        finishedAt: monotonicNow(),
                        blockedMs,
                        status,
                        phase
                    });
                });
        };

        const arm = () => {
            if (item.cancelled) return;
            const timeout = Number.isFinite(Number(options.timeout)) ? Number(options.timeout) : 1200;
            if (options.idle && typeof window.requestIdleCallback === 'function') {
                item.idleId = window.requestIdleCallback(run, { timeout });
                return;
            }
            if (options.frame && typeof window.requestAnimationFrame === 'function') {
                item.frameId = window.requestAnimationFrame(run);
                return;
            }
            run();
        };

        const delay = Math.max(0, Number(options.delay || 0));
        state.scheduled.set(key, item);
        if (delay > 0) {
            item.timerId = window.setTimeout(arm, delay);
        } else {
            arm();
        }
        return key;
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

    function normalizeCloudReadArgs(method, args) {
        const list = Array.isArray(args) ? args.slice() : [];
        if (method === 'load') return [];
        if (method === 'loadTeachers') {
            const options = list.find((item) => item && typeof item === 'object' && !Array.isArray(item)) || {};
            const currentTermId = typeof window.getPreferredTeacherTermId === 'function'
                ? window.getPreferredTeacherTermId()
                : '';
            const currentSchool = typeof window.readCurrentSchool === 'function'
                ? window.readCurrentSchool()
                : '';
            return [{
                schoolName: options.schoolName || options.scopeSchool || currentSchool || '',
                termId: options.termId || options.teacherTermId || currentTermId || '',
                cohortId: options.cohortId || window.CURRENT_COHORT_ID || ''
            }];
        }
        if (method === 'fetchCohortExamsToLocal') {
            const cohortId = list[0] || '';
            const options = list[1] && typeof list[1] === 'object' ? list[1] : {};
            return [cohortId, {
                minCount: options.minCount || 2,
                latestOnly: options.latestOnly === true || Number(options.maxFetch || 0) === 1,
                maxFetch: Number(options.maxFetch || 0) || 0
            }];
        }
        if (method === 'fetchAllCohortExams') {
            const options = list[0] && typeof list[0] === 'object' ? list[0] : {};
            const currentCohortId = typeof window.readWorkspaceCohortId === 'function'
                ? window.readWorkspaceCohortId()
                : '';
            return [{ cohortId: options.cohortId || window.CURRENT_COHORT_ID || currentCohortId || '' }];
        }
        if (method === 'fetchStudentExamHistory') {
            const student = list[0] && typeof list[0] === 'object' ? list[0] : {};
            const options = list[1] && typeof list[1] === 'object' ? list[1] : {};
            return [{
                name: student.name || '',
                school: student.school || '',
                class: student.class || '',
                examNo: student.examNo || student.id || '',
                cohort: student.cohort || ''
            }, {
                examIds: Array.isArray(options.examIds) ? options.examIds.map(String).sort() : [],
                currentExamId: options.currentExamId || ''
            }];
        }
        return list;
    }

    function buildCloudKey(method, args) {
        return `cloud:${method}:${stableStringify(normalizeCloudReadArgs(method, args))}`;
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

    function currentPhase() {
        const stack = state.phaseStack;
        return stack.length ? stack[stack.length - 1].label : '';
    }

    function beginPhase(label) {
        const name = String(label || '').trim();
        if (!name) return () => {};
        const entry = { label: name, startedAt: now() };
        state.phaseStack.push(entry);
        let ended = false;
        return function endPhase() {
            if (ended) return;
            ended = true;
            const index = state.phaseStack.lastIndexOf(entry);
            if (index >= 0) state.phaseStack.splice(index, 1);
        };
    }

    // Break a long synchronous burst into browser tasks so the main thread can
    // paint/respond between chunks. `scheduler.yield` keeps our continuation at
    // high priority; MessageChannel is a fast fallback; setTimeout(0) is last.
    function yieldToMain() {
        const scheduler = window.scheduler;
        if (scheduler && typeof scheduler.yield === 'function') {
            return scheduler.yield().catch(() => {});
        }
        if (typeof MessageChannel === 'function') {
            return new Promise((resolve) => {
                const channel = new MessageChannel();
                channel.port1.onmessage = () => {
                    channel.port1.close();
                    resolve();
                };
                channel.port2.postMessage(0);
            });
        }
        return new Promise((resolve) => window.setTimeout(resolve, 0));
    }

    // Run an ordered list of synchronous steps, yielding to the main thread
    // between them. Preserves execution order and results; only adds task
    // boundaries so no single step keeps the thread busy for the whole run.
    async function runChunked(steps, options = {}) {
        const list = Array.isArray(steps) ? steps.filter((step) => typeof step === 'function') : [];
        const phaseLabel = String(options.phase || '').trim();
        const endPhase = phaseLabel ? beginPhase(phaseLabel) : null;
        try {
            for (let i = 0; i < list.length; i += 1) {
                await list[i]();
                if (i < list.length - 1) await yieldToMain();
            }
        } finally {
            if (endPhase) endPhase();
        }
    }

    function installLongTaskObserver() {
        if (typeof PerformanceObserver !== 'function') return;
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach((entry) => {
                    const record = {
                        key: entry.name || 'longtask',
                        duration: Math.round(entry.duration || 0),
                        time: new Date().toISOString()
                    };
                    // Native longtask entries only expose a coarse `self` /
                    // `same-origin` container name. Attach the active app phase
                    // (if any) so real user jank can be told apart from noise.
                    const phase = currentPhase();
                    if (phase) record.phase = phase;
                    state.nativeLongTasks.push(record);
                });
                state.nativeLongTasks = state.nativeLongTasks.slice(-20);
            });
            observer.observe({ entryTypes: ['longtask'] });
        } catch (_) {}
    }

    function getSnapshot() {
        return {
            active: state.active,
            queued: state.queue.length,
            inflight: state.inflight.size,
            scheduled: state.scheduled.size,
            cached: state.cache.size,
            cloudPatched: patchCloudManager(),
            nativeLongTasks: state.nativeLongTasks.slice(),
            scheduledTasks: state.scheduledTasks.slice(),
            // 兼容已有 smoke / 性能趋势消费者；语义已固定为 nativeLongTasks。
            longTasks: state.nativeLongTasks.slice()
        };
    }

    window.SystemPerformance = {
        enqueue,
        scheduleIdle,
        scheduleTask,
        clearScheduledTask,
        clearCache,
        patchCloudManager,
        getSnapshot,
        beginPhase,
        currentPhase,
        yieldToMain,
        runChunked
    };

    installLongTaskObserver();

    const patchTimer = window.setInterval(() => {
        state.patchAttempts += 1;
        const patched = patchCloudManager();
        state.patchedStableTicks = patched ? state.patchedStableTicks + 1 : 0;
        if (state.patchedStableTicks >= 4) window.clearInterval(patchTimer);
        if (state.patchAttempts > 80) window.clearInterval(patchTimer);
    }, 250);
    scheduleIdle(patchCloudManager, { timeout: 800 });

    window.__SYSTEM_PERFORMANCE_RUNTIME_PATCHED__ = true;
})();
