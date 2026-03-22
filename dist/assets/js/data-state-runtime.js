(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataState) return;
    root.DataState = runtime;
    runtime.syncDataState(runtime.snapshotDataState());
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataStateRuntime(root) {
    function normalizeArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function normalizeObject(value) {
        return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    }

    function getRawData() {
        return normalizeArray(root.RAW_DATA);
    }

    function setRawData(rows) {
        const nextRows = normalizeArray(rows);
        root.RAW_DATA = nextRows;
        return nextRows;
    }

    function getSchools() {
        return normalizeObject(root.SCHOOLS);
    }

    function setSchools(schools) {
        const nextSchools = normalizeObject(schools);
        root.SCHOOLS = nextSchools;
        return nextSchools;
    }

    function getSubjects() {
        return normalizeArray(root.SUBJECTS);
    }

    function setSubjects(subjects) {
        const nextSubjects = normalizeArray(subjects);
        root.SUBJECTS = nextSubjects;
        return nextSubjects;
    }

    function getThresholds() {
        return normalizeObject(root.THRESHOLDS);
    }

    function setThresholds(thresholds) {
        const nextThresholds = normalizeObject(thresholds);
        root.THRESHOLDS = nextThresholds;
        return nextThresholds;
    }

    function getConfig() {
        return normalizeObject(root.CONFIG);
    }

    function setConfig(config) {
        const nextConfig = normalizeObject(config);
        root.CONFIG = nextConfig;
        return nextConfig;
    }

    function snapshotDataState() {
        return {
            rawData: getRawData(),
            schools: getSchools(),
            subjects: getSubjects(),
            thresholds: getThresholds(),
            config: getConfig()
        };
    }

    function syncDataState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        const rawData = Object.prototype.hasOwnProperty.call(source, 'rawData')
            ? source.rawData
            : (Object.prototype.hasOwnProperty.call(source, 'RAW_DATA') ? source.RAW_DATA : getRawData());
        const schools = Object.prototype.hasOwnProperty.call(source, 'schools')
            ? source.schools
            : (Object.prototype.hasOwnProperty.call(source, 'SCHOOLS') ? source.SCHOOLS : getSchools());
        const subjects = Object.prototype.hasOwnProperty.call(source, 'subjects')
            ? source.subjects
            : (Object.prototype.hasOwnProperty.call(source, 'SUBJECTS') ? source.SUBJECTS : getSubjects());
        const thresholds = Object.prototype.hasOwnProperty.call(source, 'thresholds')
            ? source.thresholds
            : (Object.prototype.hasOwnProperty.call(source, 'THRESHOLDS') ? source.THRESHOLDS : getThresholds());
        const config = Object.prototype.hasOwnProperty.call(source, 'config')
            ? source.config
            : (Object.prototype.hasOwnProperty.call(source, 'CONFIG') ? source.CONFIG : getConfig());

        setRawData(rawData);
        setSchools(schools);
        setSubjects(subjects);
        setThresholds(thresholds);
        setConfig(config);

        return snapshotDataState();
    }

    function clearDataState(options = {}) {
        setRawData([]);
        setSchools({});
        setSubjects([]);
        setThresholds({});
        if (!options.keepConfig) setConfig({});
        return snapshotDataState();
    }

    return {
        getRawData,
        setRawData,
        getSchools,
        setSchools,
        getSubjects,
        setSubjects,
        getThresholds,
        setThresholds,
        getConfig,
        setConfig,
        snapshotDataState,
        syncDataState,
        clearDataState
    };
});
