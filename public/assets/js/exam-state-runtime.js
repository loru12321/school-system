(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.ExamState) return;
    root.ExamState = runtime;
    runtime.syncExamState(runtime.snapshotExamState());
})(typeof globalThis !== 'undefined' ? globalThis : this, function createExamStateRuntime(root) {
    const ARCHIVE_META_STORAGE = 'ARCHIVE_META';
    const CURRENT_TERM_ID_STORAGE = 'CURRENT_TERM_ID';
    const CURRENT_TEACHER_TERM_ID_STORAGE = 'CURRENT_TEACHER_TERM_ID';
    const ARCHIVE_LOCKED_STORAGE = 'ARCHIVE_LOCKED';
    const ARCHIVE_LOCKED_KEY_STORAGE = 'ARCHIVE_LOCKED_KEY';

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

    function deleteRootKey(key, fallbackValue = '') {
        if (!root || typeof key !== 'string') return;
        try {
            delete root[key];
        } catch {
            root[key] = fallbackValue;
        }
    }

    function getTeacherTermBase(termId) {
        const text = normalizeText(termId);
        if (!text) return '';
        const parts = text.split('_').filter(Boolean);
        if (parts.length >= 2 && /^\d{4}-\d{4}$/.test(parts[0])) {
            return parts.slice(0, 2).join('_');
        }
        return text;
    }

    function getArchiveMeta() {
        if (root.ARCHIVE_META && typeof root.ARCHIVE_META === 'object') {
            return root.ARCHIVE_META;
        }
        const storage = getStorage('localStorage');
        return readJson(storage, ARCHIVE_META_STORAGE, null);
    }

    function setArchiveMeta(meta) {
        const storage = getStorage('localStorage');
        if (!meta || typeof meta !== 'object') {
            if (storage) storage.removeItem(ARCHIVE_META_STORAGE);
            deleteRootKey('ARCHIVE_META', null);
            return null;
        }
        const nextMeta = { ...meta };
        if (storage) writeJson(storage, ARCHIVE_META_STORAGE, nextMeta);
        root.ARCHIVE_META = nextMeta;
        return nextMeta;
    }

    function getCurrentTermId() {
        const storage = getStorage('localStorage');
        return normalizeText(root.CURRENT_TERM_ID || (storage && storage.getItem(CURRENT_TERM_ID_STORAGE)) || '');
    }

    function setCurrentTermId(termId) {
        const storage = getStorage('localStorage');
        const nextTermId = normalizeText(termId);
        if (!nextTermId) {
            if (storage) storage.removeItem(CURRENT_TERM_ID_STORAGE);
            deleteRootKey('CURRENT_TERM_ID');
            return '';
        }
        if (storage) storage.setItem(CURRENT_TERM_ID_STORAGE, nextTermId);
        root.CURRENT_TERM_ID = nextTermId;
        return nextTermId;
    }

    function getCurrentTeacherTermId() {
        const storage = getStorage('localStorage');
        return normalizeText(root.CURRENT_TEACHER_TERM_ID || (storage && storage.getItem(CURRENT_TEACHER_TERM_ID_STORAGE)) || '');
    }

    function setCurrentTeacherTermId(termId, options = {}) {
        const storage = getStorage('localStorage');
        const nextTeacherTermId = normalizeText(termId);
        if (!nextTeacherTermId) {
            if (storage) storage.removeItem(CURRENT_TEACHER_TERM_ID_STORAGE);
            deleteRootKey('CURRENT_TEACHER_TERM_ID');
            if (options.syncBaseTerm === true) setCurrentTermId('');
            return '';
        }
        if (storage) storage.setItem(CURRENT_TEACHER_TERM_ID_STORAGE, nextTeacherTermId);
        root.CURRENT_TEACHER_TERM_ID = nextTeacherTermId;
        if (options.syncBaseTerm !== false) {
            setCurrentTermId(getTeacherTermBase(nextTeacherTermId));
        }
        return nextTeacherTermId;
    }

    function syncTeacherTerm(termId) {
        const exactTermId = normalizeText(termId);
        if (!exactTermId) {
            setCurrentTeacherTermId('', { syncBaseTerm: true });
            return { exactTermId: '', baseTermId: '' };
        }
        const baseTermId = getTeacherTermBase(exactTermId);
        setCurrentTeacherTermId(exactTermId, { syncBaseTerm: false });
        if (baseTermId) setCurrentTermId(baseTermId);
        return { exactTermId, baseTermId };
    }

    function getArchiveLocked() {
        const storage = getStorage('localStorage');
        const rawValue = normalizeText(root.ARCHIVE_LOCKED || (storage && storage.getItem(ARCHIVE_LOCKED_STORAGE)) || '');
        return rawValue === 'true';
    }

    function getArchiveLockedKey() {
        const storage = getStorage('localStorage');
        return normalizeText(root.ARCHIVE_LOCKED_KEY || (storage && storage.getItem(ARCHIVE_LOCKED_KEY_STORAGE)) || '');
    }

    function setArchiveLock(locked, lockedKey = '') {
        const storage = getStorage('localStorage');
        const nextLocked = !!locked;
        const nextLockedKey = normalizeText(lockedKey);

        if (storage) storage.setItem(ARCHIVE_LOCKED_STORAGE, nextLocked ? 'true' : 'false');
        root.ARCHIVE_LOCKED = nextLocked ? 'true' : 'false';

        if (!nextLocked || !nextLockedKey) {
            if (storage) storage.removeItem(ARCHIVE_LOCKED_KEY_STORAGE);
            deleteRootKey('ARCHIVE_LOCKED_KEY');
            return { locked: nextLocked, lockedKey: '' };
        }

        if (storage) storage.setItem(ARCHIVE_LOCKED_KEY_STORAGE, nextLockedKey);
        root.ARCHIVE_LOCKED_KEY = nextLockedKey;
        return { locked: nextLocked, lockedKey: nextLockedKey };
    }

    function getCurrentExamId() {
        if (root.WorkspaceState && typeof root.WorkspaceState.getCurrentExamId === 'function') {
            return normalizeText(root.WorkspaceState.getCurrentExamId());
        }
        return normalizeText(root.CURRENT_EXAM_ID || '');
    }

    function isArchiveLocked(currentExamId) {
        const targetExamId = normalizeText(currentExamId || getCurrentExamId());
        const lockedKey = getArchiveLockedKey();
        return !!(getArchiveLocked() && lockedKey && targetExamId && lockedKey === targetExamId);
    }

    function snapshotExamState() {
        return {
            archiveMeta: getArchiveMeta(),
            currentTermId: getCurrentTermId(),
            currentTeacherTermId: getCurrentTeacherTermId(),
            archiveLocked: getArchiveLocked(),
            archiveLockedKey: getArchiveLockedKey()
        };
    }

    function syncExamState(nextState = {}) {
        const source = nextState && typeof nextState === 'object' ? nextState : {};
        const nextArchiveMeta = Object.prototype.hasOwnProperty.call(source, 'archiveMeta') ? source.archiveMeta : (
            Object.prototype.hasOwnProperty.call(source, 'ARCHIVE_META') ? source.ARCHIVE_META : getArchiveMeta()
        );
        const nextCurrentTermId = normalizeText(
            Object.prototype.hasOwnProperty.call(source, 'currentTermId') ? source.currentTermId : (
                Object.prototype.hasOwnProperty.call(source, 'CURRENT_TERM_ID') ? source.CURRENT_TERM_ID : getCurrentTermId()
            )
        );
        const nextTeacherTermId = normalizeText(
            Object.prototype.hasOwnProperty.call(source, 'currentTeacherTermId') ? source.currentTeacherTermId : (
                Object.prototype.hasOwnProperty.call(source, 'CURRENT_TEACHER_TERM_ID') ? source.CURRENT_TEACHER_TERM_ID : getCurrentTeacherTermId()
            )
        );
        const nextArchiveLocked = Object.prototype.hasOwnProperty.call(source, 'archiveLocked') ? !!source.archiveLocked : (
            Object.prototype.hasOwnProperty.call(source, 'ARCHIVE_LOCKED') ? String(source.ARCHIVE_LOCKED) === 'true' : getArchiveLocked()
        );
        const nextArchiveLockedKey = normalizeText(
            Object.prototype.hasOwnProperty.call(source, 'archiveLockedKey') ? source.archiveLockedKey : (
                Object.prototype.hasOwnProperty.call(source, 'ARCHIVE_LOCKED_KEY') ? source.ARCHIVE_LOCKED_KEY : getArchiveLockedKey()
            )
        );

        setArchiveMeta(nextArchiveMeta);
        if (nextTeacherTermId) {
            syncTeacherTerm(nextTeacherTermId);
        } else {
            setCurrentTeacherTermId('', { syncBaseTerm: false });
            setCurrentTermId(nextCurrentTermId);
        }
        setArchiveLock(nextArchiveLocked, nextArchiveLockedKey);

        return snapshotExamState();
    }

    function clearExamState(options = {}) {
        const storage = getStorage('localStorage');
        if (storage) {
            storage.removeItem(ARCHIVE_META_STORAGE);
            storage.removeItem(ARCHIVE_LOCKED_STORAGE);
            storage.removeItem(ARCHIVE_LOCKED_KEY_STORAGE);
            if (!options.keepTermIds) {
                storage.removeItem(CURRENT_TERM_ID_STORAGE);
                storage.removeItem(CURRENT_TEACHER_TERM_ID_STORAGE);
            }
        }

        deleteRootKey('ARCHIVE_META', null);
        deleteRootKey('ARCHIVE_LOCKED');
        deleteRootKey('ARCHIVE_LOCKED_KEY');
        if (!options.keepTermIds) {
            deleteRootKey('CURRENT_TERM_ID');
            deleteRootKey('CURRENT_TEACHER_TERM_ID');
        }

        return snapshotExamState();
    }

    return {
        ARCHIVE_META_STORAGE,
        CURRENT_TERM_ID_STORAGE,
        CURRENT_TEACHER_TERM_ID_STORAGE,
        ARCHIVE_LOCKED_STORAGE,
        ARCHIVE_LOCKED_KEY_STORAGE,
        getTeacherTermBase,
        getArchiveMeta,
        setArchiveMeta,
        getCurrentTermId,
        setCurrentTermId,
        getCurrentTeacherTermId,
        setCurrentTeacherTermId,
        syncTeacherTerm,
        getArchiveLocked,
        getArchiveLockedKey,
        setArchiveLock,
        isArchiveLocked,
        snapshotExamState,
        syncExamState,
        clearExamState
    };
});
