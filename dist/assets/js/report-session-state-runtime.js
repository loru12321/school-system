(function (root, factory) {
    function installReportSessionState(target, runtime) {
        if (!target || !runtime) return runtime;
        target.ReportSessionState = runtime;
        target.readCurrentReportStudentState = runtime.getCurrentReportStudent;
        target.setCurrentReportStudentState = runtime.setCurrentReportStudent;
        target.clearCurrentReportStudentState = runtime.clearCurrentReportStudent;
        target.readBatchAICacheState = runtime.getBatchAICache;
        target.setBatchAICacheState = runtime.setBatchAICache;
        target.readIsBatchAIRunningState = runtime.getIsBatchAiRunning;
        target.setBatchAIRunningState = runtime.setIsBatchAiRunning;
        target.readCurrentContextStudentsState = runtime.getCurrentContextStudents;
        target.setCurrentContextStudentsState = runtime.setCurrentContextStudents;
        target.syncReportSessionRuntimeState = runtime.syncReportSessionState;
        target.clearReportSessionRuntimeState = runtime.clearReportSessionState;
        runtime.syncReportSessionState(runtime.snapshotReportSessionState());
        return runtime;
    }

    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return installReportSessionState(overrideRoot || root || {}, factory(overrideRoot || root || {}));
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.ReportSessionState) return;
    installReportSessionState(root, runtime);
})(typeof globalThis !== 'undefined' ? globalThis : this, function createReportSessionStateRuntime(root) {
    function cloneJson(value, fallbackValue) {
        if (value == null) return fallbackValue;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch {
            return fallbackValue;
        }
    }

    function normalizeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? { ...value } : {};
    }

    function normalizeStudent(value) {
        return value && typeof value === 'object' && !Array.isArray(value)
            ? cloneJson(value, null)
            : null;
    }

    function normalizeStudents(value) {
        return Array.isArray(value) ? cloneJson(value, []) : [];
    }

    function getCurrentReportStudent() {
        const nextStudent = normalizeStudent(root.CURRENT_REPORT_STUDENT);
        root.CURRENT_REPORT_STUDENT = nextStudent;
        return nextStudent;
    }

    function setCurrentReportStudent(student) {
        const nextStudent = normalizeStudent(student);
        root.CURRENT_REPORT_STUDENT = nextStudent;
        return nextStudent;
    }

    function clearCurrentReportStudent() {
        root.CURRENT_REPORT_STUDENT = null;
        return root.CURRENT_REPORT_STUDENT;
    }

    function getBatchAICache() {
        const nextCache = normalizeObject(root.BATCH_AI_CACHE);
        root.BATCH_AI_CACHE = nextCache;
        return nextCache;
    }

    function setBatchAICache(cache) {
        const nextCache = normalizeObject(cache);
        root.BATCH_AI_CACHE = nextCache;
        return nextCache;
    }

    function getIsBatchAiRunning() {
        const nextFlag = !!root.IS_BATCH_AI_RUNNING;
        root.IS_BATCH_AI_RUNNING = nextFlag;
        return nextFlag;
    }

    function setIsBatchAiRunning(flag) {
        const nextFlag = !!flag;
        root.IS_BATCH_AI_RUNNING = nextFlag;
        return nextFlag;
    }

    function getCurrentContextStudents() {
        const nextStudents = normalizeStudents(root.CURRENT_CONTEXT_STUDENTS);
        root.CURRENT_CONTEXT_STUDENTS = nextStudents;
        return nextStudents;
    }

    function setCurrentContextStudents(rows) {
        const nextStudents = normalizeStudents(rows);
        root.CURRENT_CONTEXT_STUDENTS = nextStudents;
        return nextStudents;
    }

    function snapshotReportSessionState() {
        return {
            currentReportStudent: getCurrentReportStudent(),
            batchAiCache: getBatchAICache(),
            isBatchAiRunning: getIsBatchAiRunning(),
            currentContextStudents: getCurrentContextStudents()
        };
    }

    function syncReportSessionState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        setCurrentReportStudent(
            Object.prototype.hasOwnProperty.call(source, 'currentReportStudent')
                ? source.currentReportStudent
                : (Object.prototype.hasOwnProperty.call(source, 'CURRENT_REPORT_STUDENT') ? source.CURRENT_REPORT_STUDENT : getCurrentReportStudent())
        );
        setBatchAICache(
            Object.prototype.hasOwnProperty.call(source, 'batchAiCache')
                ? source.batchAiCache
                : (Object.prototype.hasOwnProperty.call(source, 'BATCH_AI_CACHE') ? source.BATCH_AI_CACHE : getBatchAICache())
        );
        setIsBatchAiRunning(
            Object.prototype.hasOwnProperty.call(source, 'isBatchAiRunning')
                ? source.isBatchAiRunning
                : (Object.prototype.hasOwnProperty.call(source, 'IS_BATCH_AI_RUNNING') ? source.IS_BATCH_AI_RUNNING : getIsBatchAiRunning())
        );
        setCurrentContextStudents(
            Object.prototype.hasOwnProperty.call(source, 'currentContextStudents')
                ? source.currentContextStudents
                : (Object.prototype.hasOwnProperty.call(source, 'CURRENT_CONTEXT_STUDENTS') ? source.CURRENT_CONTEXT_STUDENTS : getCurrentContextStudents())
        );
        return snapshotReportSessionState();
    }

    function clearReportSessionState(options = {}) {
        setCurrentReportStudent(null);
        if (!options.keepBatchCache) setBatchAICache({});
        setIsBatchAiRunning(false);
        if (!options.keepContextStudents) setCurrentContextStudents([]);
        return snapshotReportSessionState();
    }

    return {
        getCurrentReportStudent,
        setCurrentReportStudent,
        clearCurrentReportStudent,
        getBatchAICache,
        setBatchAICache,
        getIsBatchAiRunning,
        setIsBatchAiRunning,
        getCurrentContextStudents,
        setCurrentContextStudents,
        snapshotReportSessionState,
        syncReportSessionState,
        clearReportSessionState
    };
});
