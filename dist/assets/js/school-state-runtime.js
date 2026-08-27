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
    const DEFAULT_MY_SCHOOL_NAME = normalizeText(root.DEFAULT_MY_SCHOOL_NAME || '银山实验');
    root.DEFAULT_MY_SCHOOL_NAME = DEFAULT_MY_SCHOOL_NAME;

    function normalizeText(value) {
        return String(value || '').trim();
    }

    function sameSchoolName(left, right) {
        const leftName = normalizeText(left);
        const rightName = normalizeText(right);
        if (!leftName || !rightName) return false;
        if (leftName === rightName) return true;
        if (typeof root.areSchoolNamesEquivalent === 'function') return root.areSchoolNamesEquivalent(leftName, rightName);
        if (typeof root.areSchoolNamesMatched === 'function') return root.areSchoolNamesMatched(leftName, rightName, true);
        if (typeof root.normalizeSchoolName === 'function') {
            const normalizedLeft = normalizeText(root.normalizeSchoolName(leftName));
            const normalizedRight = normalizeText(root.normalizeSchoolName(rightName));
            if (normalizedLeft && normalizedLeft === normalizedRight) return true;
        }
        const compact = (value) => normalizeText(value).replace(/\s+/g, '');
        const compactLeft = compact(leftName);
        const compactRight = compact(rightName);
        return !!compactLeft && !!compactRight && (compactLeft === compactRight || compactLeft.includes(compactRight) || compactRight.includes(compactLeft));
    }

    function getSchoolNames() {
        const names = new Set();
        const add = (value) => {
            const name = normalizeText(value);
            if (name) names.add(name);
        };
        const schoolMap = root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {};
        Object.entries(schoolMap).forEach(([key, school]) => {
            add(key);
            add(school && school.name);
        });
        if (typeof root.listAvailableSchoolsForCompare === 'function') {
            try {
                root.listAvailableSchoolsForCompare('all').forEach(add);
            } catch (_) {}
        }
        return Array.from(names);
    }

    function resolveAvailableSchoolName(school) {
        const target = normalizeText(school) || DEFAULT_MY_SCHOOL_NAME;
        const schoolNames = getSchoolNames();
        if (!target || !schoolNames.length) return target;
        return schoolNames.find((name) => sameSchoolName(name, target)) || target;
    }

    function invalidateAnalyticsKernel() {
        if (root.AnalyticsKernel && typeof root.AnalyticsKernel.invalidate === 'function') {
            root.AnalyticsKernel.invalidate({ keepProcessCache: true });
        }
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
        const nextSchool = resolveAvailableSchoolName(normalizeText(
            root.MY_SCHOOL
            || (storage && storage.getItem(CURRENT_SCHOOL_STORAGE))
            || DEFAULT_MY_SCHOOL_NAME
        ));
        if (normalizeText(root.MY_SCHOOL) !== nextSchool) root.MY_SCHOOL = nextSchool;
        if (storage && normalizeText(storage.getItem(CURRENT_SCHOOL_STORAGE)) !== nextSchool) {
            storage.setItem(CURRENT_SCHOOL_STORAGE, nextSchool);
        }
        return nextSchool;
    }

    function setCurrentSchool(school) {
        const storage = getStorage('localStorage');
        const nextSchool = resolveAvailableSchoolName(school);
        if (storage) storage.setItem(CURRENT_SCHOOL_STORAGE, nextSchool);
        root.MY_SCHOOL = nextSchool;
        invalidateAnalyticsKernel();
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
