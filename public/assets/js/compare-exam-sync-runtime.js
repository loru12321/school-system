(function (root, factory) {
    function installCompareExamSyncRuntime(target, runtime) {
        if (!target || !runtime) return runtime;
        target.CompareExamSyncRuntime = runtime;
        target.refreshCompareExamSelectors = runtime.refreshSelectors;
        target.setCompareExamSelectPlaceholders = runtime.setSelectPlaceholders;
        target.trySyncCompareExamOptionsWithRuntime = runtime.trySyncOptions;
        if (typeof target.ensureCompareExamSyncStateEntry !== 'function') {
            target.ensureCompareExamSyncStateEntry = runtime.ensureCompareExamSyncStateEntry;
        }
        return runtime;
    }

    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return installCompareExamSyncRuntime(overrideRoot || root || {}, factory(overrideRoot || root || {}));
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.CompareExamSyncRuntime) return;
    installCompareExamSyncRuntime(root, runtime);
})(typeof globalThis !== 'undefined' ? globalThis : this, function createCompareExamSyncRuntime(root) {
    function normalizeString(value) {
        return String(value || '').trim();
    }

    function readCompareExamSyncState() {
        if (typeof root.readCompareExamSyncState === 'function') {
            return root.readCompareExamSyncState() || {};
        }
        if (root.CompareSessionState && typeof root.CompareSessionState.getCompareExamSyncState === 'function') {
            return root.CompareSessionState.getCompareExamSyncState() || {};
        }
        return root.__COMPARE_EXAM_SYNC_STATE && typeof root.__COMPARE_EXAM_SYNC_STATE === 'object' && !Array.isArray(root.__COMPARE_EXAM_SYNC_STATE)
            ? root.__COMPARE_EXAM_SYNC_STATE
            : {};
    }

    function writeCompareExamSyncState(state) {
        const nextState = state && typeof state === 'object' && !Array.isArray(state) ? state : {};
        if (typeof root.setCompareExamSyncState === 'function') {
            return root.setCompareExamSyncState(nextState) || nextState;
        }
        if (root.CompareSessionState && typeof root.CompareSessionState.setCompareExamSyncState === 'function') {
            return root.CompareSessionState.setCompareExamSyncState(nextState) || nextState;
        }
        root.__COMPARE_EXAM_SYNC_STATE = nextState;
        return nextState;
    }

    function normalizeCohortId(cohortId, options) {
        const settings = options && typeof options === 'object' ? options : {};
        const rawCohortId = normalizeString(cohortId);
        if (!rawCohortId) return '';
        if (settings.normalize === false) return rawCohortId;
        return typeof root.normalizeCompareCohortId === 'function'
            ? normalizeString(root.normalizeCompareCohortId(rawCohortId))
            : rawCohortId;
    }

    function ensureCompareExamSyncStateEntry(cohortId, options) {
        const key = normalizeCohortId(cohortId, options);
        const currentState = readCompareExamSyncState();
        if (!key) return { pending: false, lastAttempt: 0 };
        if (!currentState[key]) {
            currentState[key] = { pending: false, lastAttempt: 0 };
            writeCompareExamSyncState(currentState);
        }
        return currentState[key];
    }

    function setSelectPlaceholders(selects, message) {
        const optionHtml = '<option value="">' + String(message || '') + '</option>';
        (selects || []).forEach(function applyPlaceholder(select) {
            if (!select) return;
            select.innerHTML = optionHtml;
        });
    }

    function refreshSelectors() {
        if (typeof root.updateProgressMultiExamSelects === 'function') root.updateProgressMultiExamSelects();
        if (typeof root.updateStudentCompareExamSelects === 'function') root.updateStudentCompareExamSelects();
        if (typeof root.updateReportCompareExamSelects === 'function') root.updateReportCompareExamSelects();
        if (typeof root.updateMacroMultiExamSelects === 'function') root.updateMacroMultiExamSelects();
        if (typeof root.updateTeacherMultiExamSelects === 'function') root.updateTeacherMultiExamSelects();
        if (typeof root.updateTeacherCompareExamSelects === 'function') root.updateTeacherCompareExamSelects();
    }

    function trySyncOptions(options) {
        const settings = options && typeof options === 'object' ? options : {};
        const storageCohortId = root.localStorage && typeof root.localStorage.getItem === 'function'
            ? root.localStorage.getItem('CURRENT_COHORT_ID')
            : '';
        const cohortId = normalizeCohortId(settings.cohortId || root.CURRENT_COHORT_ID || storageCohortId, settings);
        if (!cohortId || !root.CloudManager || typeof root.CloudManager.fetchCohortExamsToLocal !== 'function') return false;

        const state = ensureCompareExamSyncStateEntry(cohortId, { normalize: false });
        if (state.pending) return true;

        const throttleMs = Number(settings.throttleMs || 5000) || 5000;
        if (Date.now() - Number(state.lastAttempt || 0) < throttleMs) return false;

        state.pending = true;
        state.lastAttempt = Date.now();

        const fetchArgs = [cohortId];
        if (Object.prototype.hasOwnProperty.call(settings, 'fetchOptions')) {
            if (settings.fetchOptions !== undefined) fetchArgs.push(settings.fetchOptions);
        } else if (Object.prototype.hasOwnProperty.call(settings, 'minCount')) {
            fetchArgs.push({ minCount: settings.minCount });
        }

        Promise.resolve(root.CloudManager.fetchCohortExamsToLocal.apply(root.CloudManager, fetchArgs))
            .catch(function handleCompareSyncError(error) {
                console.warn(settings.warnPrefix || '[compare-sync] fetchCohortExamsToLocal failed:', error);
            })
            .finally(function finalizeCompareSync() {
                state.pending = false;
                setTimeout(function refreshAfterSync() {
                    if (settings.refreshSelectors !== false) refreshSelectors();
                    if (settings.refreshBaseline && typeof root.updateProgressBaselineSelect === 'function') {
                        root.updateProgressBaselineSelect();
                    }
                    if (typeof settings.onFinally === 'function') {
                        settings.onFinally(state);
                    }
                }, 0);
            });

        return true;
    }

    return {
        normalizeCohortId: normalizeCohortId,
        ensureCompareExamSyncStateEntry: ensureCompareExamSyncStateEntry,
        setSelectPlaceholders: setSelectPlaceholders,
        refreshSelectors: refreshSelectors,
        trySyncOptions: trySyncOptions
    };
});
