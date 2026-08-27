(function (root, factory) {
    function installProgressState(target, runtime) {
        if (!target || !runtime) return;
        target.readProgressCacheState = runtime.getProgressCache;
        target.setProgressCacheState = runtime.setProgressCache;
        target.readProgressCacheFullState = runtime.getProgressCacheFull;
        target.setProgressCacheFullState = runtime.setProgressCacheFull;
        target.readManualIdMappingsState = runtime.getManualIdMappings;
        target.setManualIdMappingsState = runtime.setManualIdMappings;
        target.readLastVaDataState = runtime.getLastVaData;
        target.setLastVaDataState = runtime.setLastVaData;
        target.readProgressViewModeState = runtime.getVaViewMode;
        target.setProgressViewModeState = runtime.setVaViewMode;
        target.readProgressQuickModeState = runtime.getQuickMode;
        target.setProgressQuickModeState = runtime.setQuickMode;
        target.syncProgressRuntimeState = runtime.syncProgressState;
        target.clearProgressRuntimeState = runtime.clearProgressState;
    }

    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            const nextRoot = overrideRoot || root || {};
            const nextRuntime = factory(nextRoot);
            installProgressState(nextRoot, nextRuntime);
            return nextRuntime;
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.ProgressState) return;
    installProgressState(root, runtime);
    root.ProgressState = runtime;
    runtime.syncProgressState(runtime.snapshotProgressState());
})(typeof globalThis !== 'undefined' ? globalThis : this, function createProgressStateRuntime(root) {
    function normalizeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function normalizeMode(value, allowed, fallback) {
        const nextValue = String(value || '').trim();
        return allowed.includes(nextValue) ? nextValue : fallback;
    }

    function getProgressCache() {
        const rows = normalizeArray(root.PROGRESS_CACHE);
        root.PROGRESS_CACHE = rows;
        return rows;
    }

    function setProgressCache(rows) {
        const nextRows = normalizeArray(rows);
        root.PROGRESS_CACHE = nextRows;
        return nextRows;
    }

    function getProgressCacheFull() {
        const rows = normalizeArray(root.PROGRESS_CACHE_FULL);
        root.PROGRESS_CACHE_FULL = rows;
        return rows;
    }

    function setProgressCacheFull(rows) {
        const nextRows = normalizeArray(rows);
        root.PROGRESS_CACHE_FULL = nextRows;
        return nextRows;
    }

    function getManualIdMappings() {
        const mappings = normalizeObject(root.MANUAL_ID_MAPPINGS);
        root.MANUAL_ID_MAPPINGS = mappings;
        return mappings;
    }

    function setManualIdMappings(mappings) {
        const nextMappings = normalizeObject(mappings);
        root.MANUAL_ID_MAPPINGS = nextMappings;
        return nextMappings;
    }

    function getLastVaData() {
        const rows = normalizeArray(root.LAST_VA_DATA);
        root.LAST_VA_DATA = rows;
        return rows;
    }

    function setLastVaData(rows) {
        const nextRows = normalizeArray(rows);
        root.LAST_VA_DATA = nextRows;
        return nextRows;
    }

    function getVaViewMode() {
        const mode = normalizeMode(root.VA_VIEW_MODE, ['school', 'class'], 'school');
        root.VA_VIEW_MODE = mode;
        return mode;
    }

    function setVaViewMode(mode) {
        const nextMode = normalizeMode(mode, ['school', 'class'], 'school');
        root.VA_VIEW_MODE = nextMode;
        return nextMode;
    }

    function getQuickMode() {
        const mode = normalizeMode(root.__PROGRESS_QUICK_MODE, ['all', 'my_class', 'focus'], 'all');
        root.__PROGRESS_QUICK_MODE = mode;
        return mode;
    }

    function setQuickMode(mode) {
        const nextMode = normalizeMode(mode, ['all', 'my_class', 'focus'], 'all');
        root.__PROGRESS_QUICK_MODE = nextMode;
        return nextMode;
    }

    function snapshotProgressState() {
        return {
            progressCache: getProgressCache(),
            progressCacheFull: getProgressCacheFull(),
            manualIdMappings: getManualIdMappings(),
            lastVaData: getLastVaData(),
            vaViewMode: getVaViewMode(),
            quickMode: getQuickMode()
        };
    }

    function syncProgressState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        setProgressCache(
            Object.prototype.hasOwnProperty.call(source, 'progressCache')
                ? source.progressCache
                : (Object.prototype.hasOwnProperty.call(source, 'PROGRESS_CACHE') ? source.PROGRESS_CACHE : getProgressCache())
        );
        setProgressCacheFull(
            Object.prototype.hasOwnProperty.call(source, 'progressCacheFull')
                ? source.progressCacheFull
                : (Object.prototype.hasOwnProperty.call(source, 'PROGRESS_CACHE_FULL') ? source.PROGRESS_CACHE_FULL : getProgressCacheFull())
        );
        setManualIdMappings(
            Object.prototype.hasOwnProperty.call(source, 'manualIdMappings')
                ? source.manualIdMappings
                : (Object.prototype.hasOwnProperty.call(source, 'MANUAL_ID_MAPPINGS') ? source.MANUAL_ID_MAPPINGS : getManualIdMappings())
        );
        setLastVaData(
            Object.prototype.hasOwnProperty.call(source, 'lastVaData')
                ? source.lastVaData
                : (Object.prototype.hasOwnProperty.call(source, 'LAST_VA_DATA') ? source.LAST_VA_DATA : getLastVaData())
        );
        setVaViewMode(
            Object.prototype.hasOwnProperty.call(source, 'vaViewMode')
                ? source.vaViewMode
                : (Object.prototype.hasOwnProperty.call(source, 'VA_VIEW_MODE') ? source.VA_VIEW_MODE : getVaViewMode())
        );
        setQuickMode(
            Object.prototype.hasOwnProperty.call(source, 'quickMode')
                ? source.quickMode
                : (Object.prototype.hasOwnProperty.call(source, '__PROGRESS_QUICK_MODE') ? source.__PROGRESS_QUICK_MODE : getQuickMode())
        );
        return snapshotProgressState();
    }

    function clearProgressState(options = {}) {
        setProgressCache([]);
        if (!options.keepFullCache) setProgressCacheFull([]);
        if (!options.keepManualMappings) setManualIdMappings({});
        if (!options.keepLastVaData) setLastVaData([]);
        if (!options.keepViewMode) setVaViewMode('school');
        if (!options.keepQuickMode) setQuickMode('all');
        return snapshotProgressState();
    }

    return {
        getProgressCache,
        setProgressCache,
        getProgressCacheFull,
        setProgressCacheFull,
        getManualIdMappings,
        setManualIdMappings,
        getLastVaData,
        setLastVaData,
        getVaViewMode,
        setVaViewMode,
        getQuickMode,
        setQuickMode,
        snapshotProgressState,
        syncProgressState,
        clearProgressState
    };
});
