(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.SupportState) return;
    root.SupportState = runtime;
    runtime.syncSupportState(runtime.snapshotSupportState());
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSupportStateRuntime(root) {
    function ensureSysVars() {
        if (!root.SYS_VARS || typeof root.SYS_VARS !== 'object' || Array.isArray(root.SYS_VARS)) {
            root.SYS_VARS = {};
        }
        if (!root.SYS_VARS.indicator || typeof root.SYS_VARS.indicator !== 'object' || Array.isArray(root.SYS_VARS.indicator)) {
            root.SYS_VARS.indicator = { ind1: '', ind2: '' };
        }
        if (!root.SYS_VARS.targets || typeof root.SYS_VARS.targets !== 'object' || Array.isArray(root.SYS_VARS.targets)) {
            root.SYS_VARS.targets = {};
        }
        if (!Array.isArray(root.SYS_VARS.schoolAliases)) {
            root.SYS_VARS.schoolAliases = [];
        }
        if (!root.SYS_VARS.dataManagerSyncState || typeof root.SYS_VARS.dataManagerSyncState !== 'object' || Array.isArray(root.SYS_VARS.dataManagerSyncState)) {
            root.SYS_VARS.dataManagerSyncState = {};
        }
        return root.SYS_VARS;
    }

    function normalizeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function normalizeIndicator(value) {
        const source = value && typeof value === 'object' ? value : {};
        return {
            ind1: String(source.ind1 || '').trim(),
            ind2: String(source.ind2 || '').trim()
        };
    }

    function getIndicator() {
        return normalizeIndicator(ensureSysVars().indicator);
    }

    function setIndicator(indicator) {
        const nextIndicator = normalizeIndicator(indicator);
        const sysVars = ensureSysVars();
        sysVars.indicator = nextIndicator;
        return nextIndicator;
    }

    function getTargets() {
        const targets = normalizeObject(root.TARGETS);
        root.TARGETS = targets;
        ensureSysVars().targets = targets;
        return targets;
    }

    function setTargets(targets) {
        const nextTargets = normalizeObject(targets);
        root.TARGETS = nextTargets;
        ensureSysVars().targets = nextTargets;
        return nextTargets;
    }

    function getSchoolAliases() {
        const sysVars = ensureSysVars();
        sysVars.schoolAliases = normalizeArray(sysVars.schoolAliases);
        return sysVars.schoolAliases;
    }

    function setSchoolAliases(list) {
        const nextList = normalizeArray(list);
        ensureSysVars().schoolAliases = nextList;
        return nextList;
    }

    function getDataManagerSyncState() {
        return normalizeObject(ensureSysVars().dataManagerSyncState);
    }

    function setDataManagerSyncState(syncState) {
        const nextSyncState = normalizeObject(syncState);
        ensureSysVars().dataManagerSyncState = nextSyncState;
        return nextSyncState;
    }

    function getPrevData() {
        const prevData = normalizeArray(root.PREV_DATA);
        root.PREV_DATA = prevData;
        return prevData;
    }

    function setPrevData(rows) {
        const nextRows = normalizeArray(rows);
        root.PREV_DATA = nextRows;
        return nextRows;
    }

    function getHistoryArchive() {
        const archive = normalizeObject(root.HISTORY_ARCHIVE);
        root.HISTORY_ARCHIVE = archive;
        return archive;
    }

    function setHistoryArchive(archive) {
        const nextArchive = normalizeObject(archive);
        root.HISTORY_ARCHIVE = nextArchive;
        return nextArchive;
    }

    function getFbClasses() {
        const classes = normalizeArray(root.FB_CLASSES);
        root.FB_CLASSES = classes;
        return classes;
    }

    function setFbClasses(classes) {
        const nextClasses = normalizeArray(classes);
        root.FB_CLASSES = nextClasses;
        return nextClasses;
    }

    function getMpSnapshots() {
        const snapshots = normalizeObject(root.MP_SNAPSHOTS);
        root.MP_SNAPSHOTS = snapshots;
        return snapshots;
    }

    function setMpSnapshots(snapshots) {
        const nextSnapshots = normalizeObject(snapshots);
        root.MP_SNAPSHOTS = nextSnapshots;
        return nextSnapshots;
    }

    function snapshotSupportState() {
        return {
            indicator: getIndicator(),
            targets: getTargets(),
            schoolAliases: getSchoolAliases(),
            dataManagerSyncState: getDataManagerSyncState(),
            prevData: getPrevData(),
            historyArchive: getHistoryArchive(),
            fbClasses: getFbClasses(),
            mpSnapshots: getMpSnapshots()
        };
    }

    function syncSupportState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        setIndicator(
            Object.prototype.hasOwnProperty.call(source, 'indicator')
                ? source.indicator
                : (Object.prototype.hasOwnProperty.call(source, 'INDICATOR_PARAMS') ? source.INDICATOR_PARAMS : getIndicator())
        );
        setTargets(
            Object.prototype.hasOwnProperty.call(source, 'targets')
                ? source.targets
                : (Object.prototype.hasOwnProperty.call(source, 'TARGETS') ? source.TARGETS : getTargets())
        );
        setSchoolAliases(
            Object.prototype.hasOwnProperty.call(source, 'schoolAliases')
                ? source.schoolAliases
                : (Object.prototype.hasOwnProperty.call(source, 'SCHOOL_ALIAS_SETTINGS') ? source.SCHOOL_ALIAS_SETTINGS : getSchoolAliases())
        );
        setDataManagerSyncState(
            Object.prototype.hasOwnProperty.call(source, 'dataManagerSyncState')
                ? source.dataManagerSyncState
                : getDataManagerSyncState()
        );
        setPrevData(
            Object.prototype.hasOwnProperty.call(source, 'prevData')
                ? source.prevData
                : (Object.prototype.hasOwnProperty.call(source, 'PREV_DATA') ? source.PREV_DATA : getPrevData())
        );
        setHistoryArchive(
            Object.prototype.hasOwnProperty.call(source, 'historyArchive')
                ? source.historyArchive
                : (Object.prototype.hasOwnProperty.call(source, 'HISTORY_ARCHIVE') ? source.HISTORY_ARCHIVE : getHistoryArchive())
        );
        setFbClasses(
            Object.prototype.hasOwnProperty.call(source, 'fbClasses')
                ? source.fbClasses
                : (Object.prototype.hasOwnProperty.call(source, 'FB_CLASSES') ? source.FB_CLASSES : getFbClasses())
        );
        setMpSnapshots(
            Object.prototype.hasOwnProperty.call(source, 'mpSnapshots')
                ? source.mpSnapshots
                : (Object.prototype.hasOwnProperty.call(source, 'MP_SNAPSHOTS') ? source.MP_SNAPSHOTS : getMpSnapshots())
        );

        return snapshotSupportState();
    }

    function clearSupportState(options = {}) {
        setIndicator({ ind1: '', ind2: '' });
        setTargets({});
        setSchoolAliases([]);
        if (!options.keepSyncState) setDataManagerSyncState({});
        setPrevData([]);
        if (!options.keepHistoryArchive) setHistoryArchive({});
        if (!options.keepFbClasses) setFbClasses([]);
        if (!options.keepMpSnapshots) setMpSnapshots({});
        return snapshotSupportState();
    }

    return {
        ensureSysVars,
        getIndicator,
        setIndicator,
        getTargets,
        setTargets,
        getSchoolAliases,
        setSchoolAliases,
        getDataManagerSyncState,
        setDataManagerSyncState,
        getPrevData,
        setPrevData,
        getHistoryArchive,
        setHistoryArchive,
        getFbClasses,
        setFbClasses,
        getMpSnapshots,
        setMpSnapshots,
        snapshotSupportState,
        syncSupportState,
        clearSupportState
    };
});
