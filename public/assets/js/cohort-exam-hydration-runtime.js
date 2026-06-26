(function () {
    const tasks = new Map();
    const pending = new Map();
    const lastRun = new Map();
    const MIN_INTERVAL_MS = 2500;

    function readCurrentCohortId() {
        if (typeof window.readWorkspaceCohortId === 'function') {
            return window.readWorkspaceCohortId();
        }
        try {
            return localStorage.getItem('CURRENT_COHORT_ID') || '';
        } catch {
            return '';
        }
    }

    function getCurrentCohortForHydration(rawCohortId) {
        return String(rawCohortId || window.CURRENT_COHORT_ID || readCurrentCohortId() || '').trim();
    }

    function refreshHydratedExamViews(cohortId) {
        if (typeof window.tryAutoRestoreWorkspaceExam === 'function') {
            window.tryAutoRestoreWorkspaceExam({ cohortId });
        }
        if (typeof window.scheduleExamSelectorRefresh === 'function') {
            window.scheduleExamSelectorRefresh({ progressBaseline: true });
        }
    }

    function run(cohortId, options = {}) {
        const cid = getCurrentCohortForHydration(cohortId);
        if (!cid || !window.CloudManager || typeof window.CloudManager.fetchCohortExamsToLocal !== 'function') {
            return Promise.resolve({ success: false, skipped: true, message: '云端历史考试同步未就绪' });
        }
        if (tasks.has(cid)) return tasks.get(cid);

        const now = Date.now();
        const force = options.force === true;
        if (!force && now - Number(lastRun.get(cid) || 0) < MIN_INTERVAL_MS) {
            return Promise.resolve({ success: true, skipped: true, throttled: true });
        }
        lastRun.set(cid, now);

        const fetchOptions = {
            background: options.background !== false,
            minCount: Math.max(1, Number(options.minCount || 2)),
            refreshSelectors: false
        };
        if (force) fetchOptions.force = true;
        if (options.latestOnly === true) fetchOptions.latestOnly = true;

        const task = Promise.resolve(window.CloudManager.fetchCohortExamsToLocal(cid, fetchOptions))
            .then((res) => {
                if (!res || res.success !== false) refreshHydratedExamViews(cid);
                return res;
            })
            .catch((error) => {
                console.warn(options.warnPrefix || '[CohortExamHydration] 云端历史考试拉取失败:', error);
                return { success: false, error };
            })
            .finally(() => {
                tasks.delete(cid);
            });

        tasks.set(cid, task);
        return task;
    }

    function mergeOptions(base = {}, next = {}) {
        const minCount = Math.max(1, Number(base.minCount || 2), Number(next.minCount || 2));
        return Object.assign({}, base, next, {
            minCount,
            background: base.background !== false && next.background !== false,
            latestOnly: minCount === 1 && base.latestOnly === true && next.latestOnly === true
        });
    }

    function schedule(cohortId, options = {}) {
        const cid = getCurrentCohortForHydration(cohortId);
        if (!cid) return Promise.resolve({ success: false, skipped: true, message: '未选择届别' });
        if (tasks.has(cid)) return tasks.get(cid);
        const incoming = Object.assign({}, options, {
            delay: Math.max(0, Number(options.delay || 0)),
            minCount: Math.max(1, Number(options.minCount || 2))
        });
        const current = pending.get(cid);
        if (current) {
            current.o = mergeOptions(current.o, incoming);
            if (incoming.delay < current.d) {
                clearTimeout(current.t);
                current.a(incoming.delay);
            }
            return current.p;
        }
        const queued = { o: incoming, d: incoming.delay };
        queued.p = new Promise((resolve, reject) => {
            queued.a = (delay) => {
                queued.d = delay;
                queued.t = setTimeout(() => {
                    pending.delete(cid);
                    run(cid, queued.o).then(resolve, reject);
                }, delay);
            };
        });
        pending.set(cid, queued);
        queued.a(incoming.delay);
        return queued.p;
    }

    window.CohortExamHydrationScheduler = { run, schedule, refreshViews: refreshHydratedExamViews };
})();
