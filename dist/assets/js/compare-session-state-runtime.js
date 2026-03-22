(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.CompareSessionState) return;
    root.CompareSessionState = runtime;
    root.readCloudCompareTargetState = runtime.getCloudCompareTarget;
    root.setCloudCompareTargetState = runtime.setCloudCompareTarget;
    root.readCloudStudentCompareContextState = runtime.getCloudStudentCompareContext;
    root.setCloudStudentCompareContextState = runtime.setCloudStudentCompareContext;
    root.readCloudComparePrevDataBackupState = runtime.getCloudComparePrevDataBackup;
    root.setCloudComparePrevDataBackupState = runtime.setCloudComparePrevDataBackup;
    root.readDuplicateCompareExamsState = runtime.getDuplicateCompareExams;
    root.setDuplicateCompareExamsState = runtime.setDuplicateCompareExams;
    root.readDuplicateCompareWarnedKeyState = runtime.getDuplicateCompareWarnedKey;
    root.setDuplicateCompareWarnedKeyState = runtime.setDuplicateCompareWarnedKey;
    root.readCompareExamSyncState = runtime.getCompareExamSyncState;
    root.setCompareExamSyncState = runtime.setCompareExamSyncState;
    root.ensureCompareExamSyncStateEntry = runtime.ensureCompareExamSyncStateEntry;
    root.syncCompareSessionRuntimeState = runtime.syncCompareSessionState;
    runtime.syncCompareSessionState(runtime.snapshotCompareSessionState());
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCompareSessionStateRuntime(root) {
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

    function normalizeString(value) {
        return String(value || '').trim();
    }

    function normalizeCompareTarget(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
        const target = {
            name: normalizeString(value.name),
            class: normalizeString(value.class),
            school: normalizeString(value.school)
        };
        return target.name || target.class || target.school ? target : null;
    }

    function normalizeCompareContext(value) {
        return value && typeof value === 'object' && !Array.isArray(value)
            ? cloneJson(value, null)
            : null;
    }

    function normalizeCompareBackup(value) {
        if (value == null) return null;
        return cloneJson(value, null);
    }

    function normalizeDuplicateCompareExams(value) {
        return Array.isArray(value) ? cloneJson(value, []) : [];
    }

    function normalizeCompareExamSyncState(value) {
        const source = normalizeObject(value);
        const nextState = {};
        Object.entries(source).forEach(([cohortId, entry]) => {
            const normalizedCohortId = normalizeString(cohortId);
            if (!normalizedCohortId) return;
            const normalizedEntry = entry && typeof entry === 'object' && !Array.isArray(entry) ? entry : {};
            nextState[normalizedCohortId] = {
                pending: !!normalizedEntry.pending,
                lastAttempt: Number(normalizedEntry.lastAttempt || 0) || 0
            };
        });
        return nextState;
    }

    function getCloudCompareTarget() {
        const nextTarget = normalizeCompareTarget(root.CLOUD_COMPARE_TARGET);
        root.CLOUD_COMPARE_TARGET = nextTarget;
        return nextTarget;
    }

    function setCloudCompareTarget(target) {
        const nextTarget = normalizeCompareTarget(target);
        root.CLOUD_COMPARE_TARGET = nextTarget;
        return nextTarget;
    }

    function getCloudStudentCompareContext() {
        const nextContext = normalizeCompareContext(root.CLOUD_STUDENT_COMPARE_CONTEXT);
        root.CLOUD_STUDENT_COMPARE_CONTEXT = nextContext;
        return nextContext;
    }

    function setCloudStudentCompareContext(context) {
        const nextContext = normalizeCompareContext(context);
        root.CLOUD_STUDENT_COMPARE_CONTEXT = nextContext;
        return nextContext;
    }

    function getCloudComparePrevDataBackup() {
        const nextBackup = normalizeCompareBackup(root.CLOUD_COMPARE_PREV_DATA_BACKUP);
        root.CLOUD_COMPARE_PREV_DATA_BACKUP = nextBackup;
        return nextBackup;
    }

    function setCloudComparePrevDataBackup(rows) {
        const nextBackup = normalizeCompareBackup(rows);
        root.CLOUD_COMPARE_PREV_DATA_BACKUP = nextBackup;
        return nextBackup;
    }

    function getDuplicateCompareExams() {
        const nextGroups = normalizeDuplicateCompareExams(root.DUPLICATE_COMPARE_EXAMS);
        root.DUPLICATE_COMPARE_EXAMS = nextGroups;
        return nextGroups;
    }

    function setDuplicateCompareExams(groups) {
        const nextGroups = normalizeDuplicateCompareExams(groups);
        root.DUPLICATE_COMPARE_EXAMS = nextGroups;
        return nextGroups;
    }

    function getDuplicateCompareWarnedKey() {
        const nextKey = normalizeString(root.__DUPLICATE_COMPARE_WARNED_KEY);
        root.__DUPLICATE_COMPARE_WARNED_KEY = nextKey;
        return nextKey;
    }

    function setDuplicateCompareWarnedKey(key) {
        const nextKey = normalizeString(key);
        root.__DUPLICATE_COMPARE_WARNED_KEY = nextKey;
        return nextKey;
    }

    function getCompareExamSyncState() {
        const nextState = normalizeCompareExamSyncState(root.__COMPARE_EXAM_SYNC_STATE);
        root.__COMPARE_EXAM_SYNC_STATE = nextState;
        return nextState;
    }

    function setCompareExamSyncState(state) {
        const nextState = normalizeCompareExamSyncState(state);
        root.__COMPARE_EXAM_SYNC_STATE = nextState;
        return nextState;
    }

    function ensureCompareExamSyncStateEntry(cohortId) {
        const normalizedCohortId = normalizeString(cohortId);
        const state = getCompareExamSyncState();
        if (!normalizedCohortId) return { pending: false, lastAttempt: 0 };
        if (!state[normalizedCohortId]) {
            state[normalizedCohortId] = { pending: false, lastAttempt: 0 };
            root.__COMPARE_EXAM_SYNC_STATE = state;
        }
        return state[normalizedCohortId];
    }

    function snapshotCompareSessionState() {
        return {
            cloudCompareTarget: getCloudCompareTarget(),
            cloudStudentCompareContext: getCloudStudentCompareContext(),
            cloudComparePrevDataBackup: getCloudComparePrevDataBackup(),
            duplicateCompareExams: getDuplicateCompareExams(),
            duplicateCompareWarnedKey: getDuplicateCompareWarnedKey(),
            compareExamSyncState: getCompareExamSyncState()
        };
    }

    function syncCompareSessionState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        setCloudCompareTarget(
            Object.prototype.hasOwnProperty.call(source, 'cloudCompareTarget')
                ? source.cloudCompareTarget
                : (Object.prototype.hasOwnProperty.call(source, 'CLOUD_COMPARE_TARGET') ? source.CLOUD_COMPARE_TARGET : getCloudCompareTarget())
        );
        setCloudStudentCompareContext(
            Object.prototype.hasOwnProperty.call(source, 'cloudStudentCompareContext')
                ? source.cloudStudentCompareContext
                : (Object.prototype.hasOwnProperty.call(source, 'CLOUD_STUDENT_COMPARE_CONTEXT') ? source.CLOUD_STUDENT_COMPARE_CONTEXT : getCloudStudentCompareContext())
        );
        setCloudComparePrevDataBackup(
            Object.prototype.hasOwnProperty.call(source, 'cloudComparePrevDataBackup')
                ? source.cloudComparePrevDataBackup
                : (Object.prototype.hasOwnProperty.call(source, 'CLOUD_COMPARE_PREV_DATA_BACKUP') ? source.CLOUD_COMPARE_PREV_DATA_BACKUP : getCloudComparePrevDataBackup())
        );
        setDuplicateCompareExams(
            Object.prototype.hasOwnProperty.call(source, 'duplicateCompareExams')
                ? source.duplicateCompareExams
                : (Object.prototype.hasOwnProperty.call(source, 'DUPLICATE_COMPARE_EXAMS') ? source.DUPLICATE_COMPARE_EXAMS : getDuplicateCompareExams())
        );
        setDuplicateCompareWarnedKey(
            Object.prototype.hasOwnProperty.call(source, 'duplicateCompareWarnedKey')
                ? source.duplicateCompareWarnedKey
                : (Object.prototype.hasOwnProperty.call(source, '__DUPLICATE_COMPARE_WARNED_KEY') ? source.__DUPLICATE_COMPARE_WARNED_KEY : getDuplicateCompareWarnedKey())
        );
        setCompareExamSyncState(
            Object.prototype.hasOwnProperty.call(source, 'compareExamSyncState')
                ? source.compareExamSyncState
                : (Object.prototype.hasOwnProperty.call(source, '__COMPARE_EXAM_SYNC_STATE') ? source.__COMPARE_EXAM_SYNC_STATE : getCompareExamSyncState())
        );
        return snapshotCompareSessionState();
    }

    function clearCloudCompareState() {
        setCloudCompareTarget(null);
        setCloudStudentCompareContext(null);
        setCloudComparePrevDataBackup(null);
        return snapshotCompareSessionState();
    }

    function clearCompareSessionState(options = {}) {
        clearCloudCompareState();
        if (!options.keepDuplicateCompareExams) setDuplicateCompareExams([]);
        if (!options.keepDuplicateCompareWarnedKey) setDuplicateCompareWarnedKey('');
        if (!options.keepCompareExamSyncState) setCompareExamSyncState({});
        return snapshotCompareSessionState();
    }

    return {
        getCloudCompareTarget,
        setCloudCompareTarget,
        getCloudStudentCompareContext,
        setCloudStudentCompareContext,
        getCloudComparePrevDataBackup,
        setCloudComparePrevDataBackup,
        getDuplicateCompareExams,
        setDuplicateCompareExams,
        getDuplicateCompareWarnedKey,
        setDuplicateCompareWarnedKey,
        getCompareExamSyncState,
        setCompareExamSyncState,
        ensureCompareExamSyncStateEntry,
        snapshotCompareSessionState,
        syncCompareSessionState,
        clearCloudCompareState,
        clearCompareSessionState
    };
});
