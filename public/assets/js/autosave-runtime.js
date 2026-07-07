// autosave-runtime.js — Local autosave snapshot persistence (extracted from app.js).
//
// This runtime owns ONLY the "write the current in-memory state to a local
// IndexedDB backup" step. It performs NO score calculation, NO school
// normalization, NO Excel shaping and NO assessment (考核) logic — it saves a
// payload that app.js has already computed. The payload bytes are identical to
// the previous inline implementation; this is a pure code-location change.
//
// app.js-local values (DB, getLegacyDbSaveOptionsForKey, fallback payload
// builders) are not reachable as globals from here, so app.js injects them
// through a context bag on each call. Everything else (readWorkspaceProjectKey,
// getCurrentSnapshotPayload, appDebug) is read from window with guards, matching
// the pattern used by the other *-runtime.js files.
(function () {
    function readProjectKey() {
        if (typeof window.readWorkspaceProjectKey === 'function') {
            return window.readWorkspaceProjectKey() || 'autosave_backup';
        }
        return 'autosave_backup';
    }

    function debug(...args) {
        if (typeof window.appDebug === 'function') {
            window.appDebug(...args);
        }
    }

    // processData tail autosave. Mirrors the former inline runAutosave() closure
    // exactly, including the "skip partial cohort snapshot without targets" guard.
    function buildAndSaveSnapshot(ctx = {}) {
        const DB = ctx.DB;
        if (!DB) return { saved: false, reason: 'no-db' };
        try {
            const currentKey = readProjectKey();
            const snapshotPayload = typeof window.getCurrentSnapshotPayload === 'function'
                ? window.getCurrentSnapshotPayload()
                : (typeof ctx.buildFallbackPayload === 'function' ? ctx.buildFallbackPayload() : null);

            if (!snapshotPayload) return { saved: false, reason: 'no-payload' };

            const isCohortKey = /^cohort::/i.test(currentKey);
            const indicatorRequired = typeof ctx.isIndicatorCalcAllowed === 'function'
                ? ctx.isIndicatorCalcAllowed()
                : false;
            const targetCount = snapshotPayload?.TARGETS && typeof snapshotPayload.TARGETS === 'object'
                ? Object.keys(snapshotPayload.TARGETS).length
                : 0;

            if (isCohortKey && indicatorRequired && Array.isArray(snapshotPayload?.RAW_DATA) && snapshotPayload.RAW_DATA.length > 0 && targetCount === 0) {
                console.warn(`[AutoSave] skip partial cohort snapshot without targets: ${currentKey}`);
                return { saved: false, reason: 'partial-cohort' };
            }

            const saveOptions = typeof ctx.getSaveOptions === 'function' ? ctx.getSaveOptions(currentKey) : undefined;
            DB.save(currentKey, snapshotPayload, saveOptions);
            debug(`✅ 数据已自动保存至: ${currentKey}`);
            return { saved: true, key: currentKey };
        } catch (e) {
            console.warn('⚠️ 自动保存快照时遇到非致命错误:', e);
            return { saved: false, reason: 'error', error: e };
        }
    }

    // Teacher-input debounce autosave. Kept as a SEPARATE entry point because its
    // fallback payload shape historically differs from the processData one (it
    // includes TEACHER_STATS / FB_CLASSES and has no partial-cohort guard). That
    // difference is preserved intentionally — this migration does not unify them.
    function saveTeacherInputSnapshot(ctx = {}) {
        const DB = ctx.DB;
        if (!DB) return { saved: false, reason: 'no-db' };
        try {
            const currentKey = readProjectKey();
            const snapshotPayload = typeof window.getCurrentSnapshotPayload === 'function'
                ? window.getCurrentSnapshotPayload()
                : (typeof ctx.buildFallbackPayload === 'function' ? ctx.buildFallbackPayload() : null);
            if (!snapshotPayload) return { saved: false, reason: 'no-payload' };
            const saveOptions = typeof ctx.getSaveOptions === 'function' ? ctx.getSaveOptions(currentKey) : undefined;
            DB.save(currentKey, snapshotPayload, saveOptions);
            return { saved: true, key: currentKey };
        } catch (e) {
            console.warn('⚠️ 教师信息自动保存时遇到非致命错误:', e);
            return { saved: false, reason: 'error', error: e };
        }
    }

    window.AutosaveRuntime = window.AutosaveRuntime || {
        buildAndSaveSnapshot,
        saveTeacherInputSnapshot
    };
})();
