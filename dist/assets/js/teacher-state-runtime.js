(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.TeacherState) return;
    root.TeacherState = runtime;
    runtime.syncTeacherState(runtime.snapshotTeacherState());
})(typeof globalThis !== 'undefined' ? globalThis : this, function createTeacherStateRuntime(root) {
    function normalizeRecordMap(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
        return { ...value };
    }

    function cloneJson(value, fallbackValue) {
        if (value == null) return fallbackValue;
        try {
            return JSON.parse(JSON.stringify(value));
        } catch {
            return fallbackValue;
        }
    }

    function getTeacherMap() {
        return normalizeRecordMap(root.TEACHER_MAP);
    }

    function setTeacherMap(map) {
        const nextMap = normalizeRecordMap(map);
        root.TEACHER_MAP = nextMap;
        return nextMap;
    }

    function getTeacherSchoolMap() {
        return normalizeRecordMap(root.TEACHER_SCHOOL_MAP);
    }

    function setTeacherSchoolMap(map) {
        const nextMap = normalizeRecordMap(map);
        root.TEACHER_SCHOOL_MAP = nextMap;
        return nextMap;
    }

    function getTeacherStats() {
        return cloneJson(root.TEACHER_STATS, {});
    }

    function setTeacherStats(stats) {
        const nextStats = cloneJson(stats, {});
        root.TEACHER_STATS = nextStats;
        return nextStats;
    }

    function snapshotTeacherState() {
        return {
            teacherMap: getTeacherMap(),
            teacherSchoolMap: getTeacherSchoolMap(),
            teacherStats: getTeacherStats()
        };
    }

    function syncTeacherState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        const teacherMap = Object.prototype.hasOwnProperty.call(source, 'teacherMap')
            ? source.teacherMap
            : (Object.prototype.hasOwnProperty.call(source, 'TEACHER_MAP') ? source.TEACHER_MAP : getTeacherMap());
        const teacherSchoolMap = Object.prototype.hasOwnProperty.call(source, 'teacherSchoolMap')
            ? source.teacherSchoolMap
            : (Object.prototype.hasOwnProperty.call(source, 'TEACHER_SCHOOL_MAP') ? source.TEACHER_SCHOOL_MAP : getTeacherSchoolMap());
        const teacherStats = Object.prototype.hasOwnProperty.call(source, 'teacherStats')
            ? source.teacherStats
            : (Object.prototype.hasOwnProperty.call(source, 'TEACHER_STATS') ? source.TEACHER_STATS : getTeacherStats());

        setTeacherMap(teacherMap);
        setTeacherSchoolMap(teacherSchoolMap);
        setTeacherStats(teacherStats);

        return snapshotTeacherState();
    }

    function clearTeacherState(options = {}) {
        setTeacherMap({});
        setTeacherSchoolMap({});
        if (!options.keepStats) setTeacherStats({});
        return snapshotTeacherState();
    }

    return {
        getTeacherMap,
        setTeacherMap,
        getTeacherSchoolMap,
        setTeacherSchoolMap,
        getTeacherStats,
        setTeacherStats,
        snapshotTeacherState,
        syncTeacherState,
        clearTeacherState
    };
});
