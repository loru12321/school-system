(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.WorkspaceState) return;
    root.WorkspaceState = runtime;
    runtime.syncWorkspaceState(runtime.snapshotWorkspaceState());
})(typeof globalThis !== 'undefined' ? globalThis : this, function createWorkspaceStateRuntime(root) {
    const CURRENT_PROJECT_KEY_STORAGE = 'CURRENT_PROJECT_KEY';
    const CURRENT_COHORT_ID_STORAGE = 'CURRENT_COHORT_ID';
    const CURRENT_COHORT_META_STORAGE = 'CURRENT_COHORT_META';
    const CURRENT_EXAM_ID_STORAGE = 'CURRENT_EXAM_ID';

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

    function safeParseJson(rawValue, fallbackValue) {
        if (!normalizeText(rawValue)) return fallbackValue;
        try {
            return JSON.parse(rawValue);
        } catch {
            return fallbackValue;
        }
    }

    function readJson(storage, key, fallbackValue) {
        if (!storage) return fallbackValue;
        return safeParseJson(storage.getItem(key), fallbackValue);
    }

    function writeJson(storage, key, value) {
        if (!storage) return;
        storage.setItem(key, JSON.stringify(value));
    }

    function deleteRootKey(key) {
        if (!root || typeof key !== 'string') return;
        try {
            delete root[key];
        } catch {
            root[key] = key === 'CURRENT_COHORT_META' || key === 'COHORT_DB' ? null : '';
        }
    }

    function normalizeCohortId(raw) {
        const text = normalizeText(raw);
        if (!text) return '';
        let match = text.match(/^cohort::(\d{4})/i);
        if (match) return match[1];
        match = text.match(/^(\d{4})(?!\d)/);
        if (match) return match[1];
        match = text.match(/(\d{4})级/);
        if (match) return match[1];
        match = text.match(/(\d{4})/);
        if (match) return match[1];
        const digits = text.replace(/\D/g, '');
        return digits.length > 4 ? digits.slice(0, 4) : digits;
    }

    function inferCohortIdFromValue(value) {
        return normalizeCohortId(value);
    }

    function getCohortKey(cohortId) {
        const normalized = normalizeCohortId(cohortId);
        return normalized ? `cohort::${normalized}` : '';
    }

    function normalizeCohortMeta(meta, explicitCohortId) {
        if (!meta || typeof meta !== 'object') {
            const fallbackId = normalizeCohortId(explicitCohortId);
            return fallbackId ? { id: fallbackId, year: fallbackId, startGrade: 6 } : null;
        }
        const nextMeta = { ...meta };
        const resolvedId = normalizeCohortId(nextMeta.id || nextMeta.year || explicitCohortId);
        if (!resolvedId) return null;
        nextMeta.id = normalizeText(nextMeta.id) || resolvedId;
        nextMeta.year = normalizeText(nextMeta.year) || resolvedId;
        nextMeta.startGrade = Number(nextMeta.startGrade) || 6;
        return nextMeta;
    }

    function getCurrentProjectKey() {
        const storage = getStorage('localStorage');
        const explicitProjectKey = normalizeText((storage && storage.getItem(CURRENT_PROJECT_KEY_STORAGE)) || root.CURRENT_PROJECT_KEY);
        if (/^cohort::/i.test(explicitProjectKey)) return explicitProjectKey;
        const cohortId = getCurrentCohortId() || normalizeCohortId(explicitProjectKey);
        if (cohortId) return getCohortKey(cohortId);
        return explicitProjectKey;
    }

    function setCurrentProjectKey(key) {
        const storage = getStorage('localStorage');
        const nextKey = normalizeText(key);
        if (!nextKey) {
            if (storage) storage.removeItem(CURRENT_PROJECT_KEY_STORAGE);
            deleteRootKey('CURRENT_PROJECT_KEY');
            return '';
        }
        if (storage) storage.setItem(CURRENT_PROJECT_KEY_STORAGE, nextKey);
        root.CURRENT_PROJECT_KEY = nextKey;
        return nextKey;
    }

    function getCurrentCohortId() {
        const storage = getStorage('localStorage');
        return normalizeCohortId(root.CURRENT_COHORT_ID || (storage && storage.getItem(CURRENT_COHORT_ID_STORAGE)) || '');
    }

    function setCurrentCohortId(cohortId, options = {}) {
        const storage = getStorage('localStorage');
        const nextId = normalizeCohortId(cohortId);
        if (!nextId) {
            if (storage) storage.removeItem(CURRENT_COHORT_ID_STORAGE);
            deleteRootKey('CURRENT_COHORT_ID');
            if (options.syncProjectKey !== false) setCurrentProjectKey('');
            return '';
        }
        if (storage) storage.setItem(CURRENT_COHORT_ID_STORAGE, nextId);
        root.CURRENT_COHORT_ID = nextId;
        if (options.syncProjectKey !== false) setCurrentProjectKey(getCohortKey(nextId));
        return nextId;
    }

    function getCurrentCohortMeta() {
        if (root.CURRENT_COHORT_META && typeof root.CURRENT_COHORT_META === 'object') {
            return normalizeCohortMeta(root.CURRENT_COHORT_META, root.CURRENT_COHORT_ID);
        }
        const storage = getStorage('localStorage');
        return normalizeCohortMeta(readJson(storage, CURRENT_COHORT_META_STORAGE, null), getCurrentCohortId());
    }

    function setCurrentCohortMeta(meta, options = {}) {
        const storage = getStorage('localStorage');
        const nextMeta = normalizeCohortMeta(meta, options.explicitCohortId || getCurrentCohortId());
        if (!nextMeta) {
            if (storage) storage.removeItem(CURRENT_COHORT_META_STORAGE);
            deleteRootKey('CURRENT_COHORT_META');
            if (options.syncCohortId === true) setCurrentCohortId('', { syncProjectKey: options.syncProjectKey !== false });
            return null;
        }
        if (options.syncCohortId !== false) {
            setCurrentCohortId(nextMeta.id, { syncProjectKey: options.syncProjectKey !== false });
        }
        if (storage) writeJson(storage, CURRENT_COHORT_META_STORAGE, nextMeta);
        root.CURRENT_COHORT_META = nextMeta;
        return nextMeta;
    }

    function getCurrentExamId() {
        const storage = getStorage('localStorage');
        return normalizeText(root.CURRENT_EXAM_ID || (storage && storage.getItem(CURRENT_EXAM_ID_STORAGE)) || '');
    }

    function setCurrentExamId(examId) {
        const storage = getStorage('localStorage');
        const nextExamId = normalizeText(examId);
        if (!nextExamId) {
            if (storage) storage.removeItem(CURRENT_EXAM_ID_STORAGE);
            deleteRootKey('CURRENT_EXAM_ID');
            return '';
        }
        if (storage) storage.setItem(CURRENT_EXAM_ID_STORAGE, nextExamId);
        root.CURRENT_EXAM_ID = nextExamId;
        return nextExamId;
    }

    function getCohortDb() {
        return root.COHORT_DB && typeof root.COHORT_DB === 'object' ? root.COHORT_DB : null;
    }

    function setCohortDb(db) {
        if (!db || typeof db !== 'object') {
            deleteRootKey('COHORT_DB');
            return null;
        }
        root.COHORT_DB = db;
        return db;
    }

    function snapshotWorkspaceState() {
        return {
            currentProjectKey: getCurrentProjectKey(),
            currentCohortId: getCurrentCohortId(),
            currentCohortMeta: getCurrentCohortMeta(),
            currentExamId: getCurrentExamId(),
            cohortDb: getCohortDb()
        };
    }

    function syncWorkspaceState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        const nextCohortId = normalizeCohortId(
            Object.prototype.hasOwnProperty.call(source, 'currentCohortId') ? source.currentCohortId : (
                Object.prototype.hasOwnProperty.call(source, 'CURRENT_COHORT_ID') ? source.CURRENT_COHORT_ID : getCurrentCohortId()
            )
        );
        const nextCohortMeta = normalizeCohortMeta(
            Object.prototype.hasOwnProperty.call(source, 'currentCohortMeta') ? source.currentCohortMeta : (
                Object.prototype.hasOwnProperty.call(source, 'CURRENT_COHORT_META') ? source.CURRENT_COHORT_META : getCurrentCohortMeta()
            ),
            nextCohortId
        );
        const nextExamId = normalizeText(
            Object.prototype.hasOwnProperty.call(source, 'currentExamId') ? source.currentExamId : (
                Object.prototype.hasOwnProperty.call(source, 'CURRENT_EXAM_ID') ? source.CURRENT_EXAM_ID : getCurrentExamId()
            )
        );
        const nextProjectKeyInput = normalizeText(
            Object.prototype.hasOwnProperty.call(source, 'currentProjectKey') ? source.currentProjectKey : (
                Object.prototype.hasOwnProperty.call(source, 'CURRENT_PROJECT_KEY') ? source.CURRENT_PROJECT_KEY : getCurrentProjectKey()
            )
        );
        const nextProjectKey = nextProjectKeyInput || (nextCohortId ? getCohortKey(nextCohortId) : '');
        const nextCohortDb = Object.prototype.hasOwnProperty.call(source, 'cohortDb') ? source.cohortDb : (
            Object.prototype.hasOwnProperty.call(source, 'COHORT_DB') ? source.COHORT_DB : getCohortDb()
        );

        setCohortDb(nextCohortDb);
        setCurrentCohortId(nextCohortId, { syncProjectKey: false });
        setCurrentCohortMeta(nextCohortMeta, { syncCohortId: false });
        setCurrentExamId(nextExamId);
        setCurrentProjectKey(nextProjectKey);

        return snapshotWorkspaceState();
    }

    function clearWorkspaceIdentity(options = {}) {
        const storage = getStorage('localStorage');
        if (storage) {
            storage.removeItem(CURRENT_PROJECT_KEY_STORAGE);
            storage.removeItem(CURRENT_COHORT_ID_STORAGE);
            storage.removeItem(CURRENT_COHORT_META_STORAGE);
            storage.removeItem(CURRENT_EXAM_ID_STORAGE);
        }
        deleteRootKey('CURRENT_PROJECT_KEY');
        deleteRootKey('CURRENT_COHORT_ID');
        deleteRootKey('CURRENT_COHORT_META');
        deleteRootKey('CURRENT_EXAM_ID');
        if (options.clearCohortDb) setCohortDb(null);
        return snapshotWorkspaceState();
    }

    function hasSavedWorkspace() {
        const snapshot = snapshotWorkspaceState();
        return !!(
            snapshot.currentProjectKey
            || snapshot.currentCohortId
            || snapshot.currentExamId
            || snapshot.cohortDb
        );
    }

    return {
        CURRENT_PROJECT_KEY_STORAGE,
        CURRENT_COHORT_ID_STORAGE,
        CURRENT_COHORT_META_STORAGE,
        CURRENT_EXAM_ID_STORAGE,
        normalizeCohortId,
        inferCohortIdFromValue,
        normalizeCohortMeta,
        getCohortKey,
        getCurrentProjectKey,
        setCurrentProjectKey,
        getCurrentCohortId,
        setCurrentCohortId,
        getCurrentCohortMeta,
        setCurrentCohortMeta,
        getCurrentExamId,
        setCurrentExamId,
        getCohortDb,
        setCohortDb,
        snapshotWorkspaceState,
        syncWorkspaceState,
        clearWorkspaceIdentity,
        hasSavedWorkspace
    };
});
