(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.SchoolState) return;
    root.SchoolState = runtime;
    runtime.syncSchoolState(runtime.snapshotSchoolState());
})(typeof globalThis !== 'undefined' ? globalThis : this, function createSchoolStateRuntime(root) {
    const CURRENT_SCHOOL_STORAGE = 'MY_SCHOOL';

    function normalizeText(value) {
        return String(value || '').trim();
    }

    function getStorage(name) {
        try {
            const storage = root && root[name];
            if (!storage) return null;
            if (typeof storage.getItem !== 'function') return null;
            if (typeof storage.setItem !== 'function') return null;
            if (typeof storage.removeItem !== 'function') return null;
            return storage;
        } catch {
            return null;
        }
    }

    function getCurrentSchool() {
        const storage = getStorage('localStorage');
        return normalizeText(root.MY_SCHOOL || (storage && storage.getItem(CURRENT_SCHOOL_STORAGE)) || '');
    }

    function setCurrentSchool(school) {
        const storage = getStorage('localStorage');
        const nextSchool = normalizeText(school);
        if (!nextSchool) {
            if (storage) storage.removeItem(CURRENT_SCHOOL_STORAGE);
            root.MY_SCHOOL = '';
            return '';
        }
        if (storage) storage.setItem(CURRENT_SCHOOL_STORAGE, nextSchool);
        root.MY_SCHOOL = nextSchool;
        return nextSchool;
    }

    function clearCurrentSchool() {
        return setCurrentSchool('');
    }

    function snapshotSchoolState() {
        return {
            currentSchool: getCurrentSchool()
        };
    }

    function syncSchoolState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        const nextSchool = normalizeText(
            Object.prototype.hasOwnProperty.call(source, 'currentSchool') ? source.currentSchool : (
                Object.prototype.hasOwnProperty.call(source, 'MY_SCHOOL') ? source.MY_SCHOOL : getCurrentSchool()
            )
        );
        setCurrentSchool(nextSchool);
        return snapshotSchoolState();
    }

    return {
        CURRENT_SCHOOL_STORAGE,
        getCurrentSchool,
        setCurrentSchool,
        clearCurrentSchool,
        snapshotSchoolState,
        syncSchoolState
    };
});
