(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.TownSubmoduleCompareState) return;
    root.TownSubmoduleCompareState = runtime;
    root.readTownSubmoduleCompareCacheState = runtime.getTownSubmoduleCompareCache;
    root.setTownSubmoduleCompareCacheState = runtime.setTownSubmoduleCompareCache;
    root.readTownSubmoduleCompareEntryState = runtime.getTownSubmoduleCompareEntry;
    root.setTownSubmoduleCompareEntryState = runtime.setTownSubmoduleCompareEntry;
    root.syncTownSubmoduleCompareRuntimeState = runtime.syncTownSubmoduleCompareState;
    runtime.syncTownSubmoduleCompareState(runtime.snapshotTownSubmoduleCompareState());
})(typeof globalThis !== 'undefined' ? globalThis : this, function createTownSubmoduleCompareStateRuntime(root) {
    function normalizeCache(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function cloneJson(value, fallbackValue) {
        if (value == null) return fallbackValue;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch {
            return fallbackValue;
        }
    }

    function getTownSubmoduleCompareCache() {
        const nextCache = normalizeCache(root.TOWN_SUBMODULE_COMPARE_CACHE);
        root.TOWN_SUBMODULE_COMPARE_CACHE = nextCache;
        return nextCache;
    }

    function setTownSubmoduleCompareCache(cache) {
        const nextCache = normalizeCache(cache);
        root.TOWN_SUBMODULE_COMPARE_CACHE = nextCache;
        return nextCache;
    }

    function getTownSubmoduleCompareEntry(submoduleId) {
        const cache = getTownSubmoduleCompareCache();
        return submoduleId && Object.prototype.hasOwnProperty.call(cache, submoduleId)
            ? cache[submoduleId]
            : null;
    }

    function setTownSubmoduleCompareEntry(submoduleId, entry) {
        const cache = { ...getTownSubmoduleCompareCache() };
        if (!submoduleId) {
            root.TOWN_SUBMODULE_COMPARE_CACHE = cache;
            return null;
        }
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
            cache[submoduleId] = entry;
        } else {
            delete cache[submoduleId];
        }
        root.TOWN_SUBMODULE_COMPARE_CACHE = cache;
        return Object.prototype.hasOwnProperty.call(cache, submoduleId) ? cache[submoduleId] : null;
    }

    function snapshotTownSubmoduleCompareState() {
        return {
            townSubmoduleCompareCache: cloneJson(getTownSubmoduleCompareCache(), {})
        };
    }

    function syncTownSubmoduleCompareState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        setTownSubmoduleCompareCache(
            Object.prototype.hasOwnProperty.call(source, 'townSubmoduleCompareCache')
                ? source.townSubmoduleCompareCache
                : (Object.prototype.hasOwnProperty.call(source, 'TOWN_SUBMODULE_COMPARE_CACHE') ? source.TOWN_SUBMODULE_COMPARE_CACHE : getTownSubmoduleCompareCache())
        );
        return snapshotTownSubmoduleCompareState();
    }

    function clearTownSubmoduleCompareState() {
        return syncTownSubmoduleCompareState({ townSubmoduleCompareCache: {} });
    }

    return {
        getTownSubmoduleCompareCache,
        setTownSubmoduleCompareCache,
        getTownSubmoduleCompareEntry,
        setTownSubmoduleCompareEntry,
        snapshotTownSubmoduleCompareState,
        syncTownSubmoduleCompareState,
        clearTownSubmoduleCompareState
    };
});
