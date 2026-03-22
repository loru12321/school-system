(function (root, factory) {
    function installCompareResultState(target, runtime) {
        if (!target || !runtime) return;
        target.readMacroCompareCacheState = runtime.getMacroCompareCache;
        target.setMacroCompareCacheState = runtime.setMacroCompareCache;
        target.readTeacherCompareCacheState = runtime.getTeacherCompareCache;
        target.setTeacherCompareCacheState = runtime.setTeacherCompareCache;
        target.readStudentCompareCacheState = runtime.getStudentCompareCache;
        target.setStudentCompareCacheState = runtime.setStudentCompareCache;
        target.syncCompareResultRuntimeState = runtime.syncCompareResultState;
        target.clearCompareResultRuntimeState = runtime.clearCompareResultState;
    }

    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            const nextRoot = overrideRoot || root || {};
            const nextRuntime = factory(nextRoot);
            installCompareResultState(nextRoot, nextRuntime);
            return nextRuntime;
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.CompareResultState) return;
    installCompareResultState(root, runtime);
    root.CompareResultState = runtime;
    runtime.syncCompareResultState(runtime.snapshotCompareResultState());
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCompareResultStateRuntime(root) {
    function normalizeCache(value) {
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

    function getMacroCompareCache() {
        const nextCache = normalizeCache(root.MACRO_MULTI_PERIOD_COMPARE_CACHE);
        root.MACRO_MULTI_PERIOD_COMPARE_CACHE = nextCache;
        return nextCache;
    }

    function setMacroCompareCache(cache) {
        const nextCache = normalizeCache(cache);
        root.MACRO_MULTI_PERIOD_COMPARE_CACHE = nextCache;
        return nextCache;
    }

    function getTeacherCompareCache() {
        const nextCache = normalizeCache(root.TEACHER_MULTI_PERIOD_COMPARE_CACHE);
        root.TEACHER_MULTI_PERIOD_COMPARE_CACHE = nextCache;
        return nextCache;
    }

    function setTeacherCompareCache(cache) {
        const nextCache = normalizeCache(cache);
        root.TEACHER_MULTI_PERIOD_COMPARE_CACHE = nextCache;
        return nextCache;
    }

    function getStudentCompareCache() {
        const nextCache = normalizeCache(root.STUDENT_MULTI_PERIOD_COMPARE_CACHE);
        root.STUDENT_MULTI_PERIOD_COMPARE_CACHE = nextCache;
        return nextCache;
    }

    function setStudentCompareCache(cache) {
        const nextCache = normalizeCache(cache);
        root.STUDENT_MULTI_PERIOD_COMPARE_CACHE = nextCache;
        return nextCache;
    }

    function snapshotCompareResultState() {
        return {
            macroCompareCache: cloneJson(getMacroCompareCache(), null),
            teacherCompareCache: cloneJson(getTeacherCompareCache(), null),
            studentCompareCache: cloneJson(getStudentCompareCache(), null)
        };
    }

    function syncCompareResultState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        setMacroCompareCache(
            Object.prototype.hasOwnProperty.call(source, 'macroCompareCache')
                ? source.macroCompareCache
                : (Object.prototype.hasOwnProperty.call(source, 'MACRO_MULTI_PERIOD_COMPARE_CACHE') ? source.MACRO_MULTI_PERIOD_COMPARE_CACHE : getMacroCompareCache())
        );
        setTeacherCompareCache(
            Object.prototype.hasOwnProperty.call(source, 'teacherCompareCache')
                ? source.teacherCompareCache
                : (Object.prototype.hasOwnProperty.call(source, 'TEACHER_MULTI_PERIOD_COMPARE_CACHE') ? source.TEACHER_MULTI_PERIOD_COMPARE_CACHE : getTeacherCompareCache())
        );
        setStudentCompareCache(
            Object.prototype.hasOwnProperty.call(source, 'studentCompareCache')
                ? source.studentCompareCache
                : (Object.prototype.hasOwnProperty.call(source, 'STUDENT_MULTI_PERIOD_COMPARE_CACHE') ? source.STUDENT_MULTI_PERIOD_COMPARE_CACHE : getStudentCompareCache())
        );
        return snapshotCompareResultState();
    }

    function clearCompareResultState() {
        setMacroCompareCache(null);
        setTeacherCompareCache(null);
        setStudentCompareCache(null);
        return snapshotCompareResultState();
    }

    return {
        getMacroCompareCache,
        setMacroCompareCache,
        getTeacherCompareCache,
        setTeacherCompareCache,
        getStudentCompareCache,
        setStudentCompareCache,
        snapshotCompareResultState,
        syncCompareResultState,
        clearCompareResultState
    };
});
