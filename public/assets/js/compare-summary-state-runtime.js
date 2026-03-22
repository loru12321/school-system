(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.CompareSummaryState) return;
    root.CompareSummaryState = runtime;
    root.readMultiPeriodCompareCacheState = runtime.getMultiPeriodCompareCache;
    root.setMultiPeriodCompareCacheState = runtime.setMultiPeriodCompareCache;
    root.readAllTeachersDiffCacheState = runtime.getAllTeachersDiffCache;
    root.setAllTeachersDiffCacheState = runtime.setAllTeachersDiffCache;
    root.syncCompareSummaryRuntimeState = runtime.syncCompareSummaryState;
    runtime.syncCompareSummaryState(runtime.snapshotCompareSummaryState());
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCompareSummaryStateRuntime(root) {
    function normalizeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    }

    function cloneJson(value, fallbackValue) {
        if (value == null) return fallbackValue;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch {
            return fallbackValue;
        }
    }

    function getMultiPeriodCompareCache() {
        const nextCache = normalizeObject(root.MULTI_PERIOD_COMPARE_CACHE);
        root.MULTI_PERIOD_COMPARE_CACHE = nextCache;
        return nextCache;
    }

    function setMultiPeriodCompareCache(cache) {
        const nextCache = normalizeObject(cache);
        root.MULTI_PERIOD_COMPARE_CACHE = nextCache;
        return nextCache;
    }

    function getAllTeachersDiffCache() {
        const nextCache = normalizeObject(root.ALL_TEACHERS_DIFF_CACHE);
        root.ALL_TEACHERS_DIFF_CACHE = nextCache;
        return nextCache;
    }

    function setAllTeachersDiffCache(cache) {
        const nextCache = normalizeObject(cache);
        root.ALL_TEACHERS_DIFF_CACHE = nextCache;
        return nextCache;
    }

    function snapshotCompareSummaryState() {
        return {
            multiPeriodCompareCache: cloneJson(getMultiPeriodCompareCache(), null),
            allTeachersDiffCache: cloneJson(getAllTeachersDiffCache(), null)
        };
    }

    function syncCompareSummaryState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        setMultiPeriodCompareCache(
            Object.prototype.hasOwnProperty.call(source, 'multiPeriodCompareCache')
                ? source.multiPeriodCompareCache
                : (Object.prototype.hasOwnProperty.call(source, 'MULTI_PERIOD_COMPARE_CACHE') ? source.MULTI_PERIOD_COMPARE_CACHE : getMultiPeriodCompareCache())
        );
        setAllTeachersDiffCache(
            Object.prototype.hasOwnProperty.call(source, 'allTeachersDiffCache')
                ? source.allTeachersDiffCache
                : (Object.prototype.hasOwnProperty.call(source, 'ALL_TEACHERS_DIFF_CACHE') ? source.ALL_TEACHERS_DIFF_CACHE : getAllTeachersDiffCache())
        );
        return snapshotCompareSummaryState();
    }

    function clearCompareSummaryState() {
        setMultiPeriodCompareCache(null);
        setAllTeachersDiffCache(null);
        return snapshotCompareSummaryState();
    }

    return {
        getMultiPeriodCompareCache,
        setMultiPeriodCompareCache,
        getAllTeachersDiffCache,
        setAllTeachersDiffCache,
        snapshotCompareSummaryState,
        syncCompareSummaryState,
        clearCompareSummaryState
    };
});
