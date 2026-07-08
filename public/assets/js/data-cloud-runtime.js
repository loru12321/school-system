(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataCloudRuntime) return;
    root.DataCloudRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataCloudRuntime(root) {
    function normalizeText(value) {
        return String(value || '').trim();
    }

    function debugLog(...args) {
        try {
            if (root.SCHOOL_SYSTEM_DEBUG === true || root.localStorage?.getItem('SCHOOL_SYSTEM_DEBUG') === 'true') {
                root.console?.debug?.(...args);
            }
        } catch (_) {}
    }

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getUi() {
        return root.UI && typeof root.UI === 'object' ? root.UI : null;
    }

    function safeLoading(show, text) {
        const ui = getUi();
        if (ui && typeof ui.loading === 'function') ui.loading(show, text);
    }

    function safeToast(text, type) {
        const ui = getUi();
        if (ui && typeof ui.toast === 'function') ui.toast(text, type);
    }

    function safeAlert(message) {
        if (typeof root.alert === 'function') {
            root.alert(message);
        }
    }

    function safeConfirm(message) {
        if (typeof root.confirm === 'function') {
            return !!root.confirm(message);
        }
        return true;
    }

    function bindCloudBackupRowActions(manager, tbody) {
        if (!tbody || typeof tbody.querySelectorAll !== 'function') return;
        tbody.querySelectorAll('.dm-cloud-select[data-key]').forEach((input) => {
            input.addEventListener('change', () => api.toggleCloudSelection(manager, input));
        });
        tbody.querySelectorAll('[data-cloud-backup-action]').forEach((button) => {
            button.addEventListener('click', () => {
                const key = normalizeText(button.dataset && button.dataset.key);
                if (!key) return;
                const action = button.dataset.cloudBackupAction;
                if (action === 'load') {
                    api.loadCloudBackup(manager, key);
                } else if (action === 'download') {
                    api.downloadCloudBackup(manager, key);
                } else if (action === 'delete') {
                    api.deleteCloudBackup(manager, key);
                }
            });
        });
    }

    function bindCloudSnapshotRowActions(manager, tbody) {
        if (!tbody || typeof tbody.querySelectorAll !== 'function') return;
        tbody.querySelectorAll('[data-cloud-snapshot-key]').forEach((button) => {
            button.addEventListener('click', () => {
                const key = normalizeText(button.dataset && button.dataset.cloudSnapshotKey);
                if (key) api.deleteCloudSnapshot(manager, key);
            });
        });
    }

    function getDocument() {
        return root.document || null;
    }

    function getSelectSystemDataRecords() {
        if (root.CloudDataService && typeof root.CloudDataService.selectSystemDataRecords === 'function') {
            return root.CloudDataService.selectSystemDataRecords.bind(root.CloudDataService);
        }
        return typeof root.selectSystemDataRecords === 'function'
            ? root.selectSystemDataRecords.bind(root)
            : null;
    }

    function getReadSystemDataRecord() {
        if (root.CloudDataService && typeof root.CloudDataService.readSystemDataRecord === 'function') {
            return root.CloudDataService.readSystemDataRecord.bind(root.CloudDataService);
        }
        return typeof root.readSystemDataRecord === 'function'
            ? root.readSystemDataRecord.bind(root)
            : null;
    }

    function getUpsertSystemDataRecord() {
        if (root.CloudDataService && typeof root.CloudDataService.upsertSystemDataRecord === 'function') {
            return root.CloudDataService.upsertSystemDataRecord.bind(root.CloudDataService);
        }
        return typeof root.upsertSystemDataRecord === 'function'
            ? root.upsertSystemDataRecord.bind(root)
            : null;
    }

    function getDeleteSystemDataRecords() {
        if (root.CloudDataService && typeof root.CloudDataService.deleteSystemDataRecords === 'function') {
            return root.CloudDataService.deleteSystemDataRecords.bind(root.CloudDataService);
        }
        return typeof root.deleteSystemDataRecords === 'function'
            ? root.deleteSystemDataRecords.bind(root)
            : null;
    }

    function ensureCloudAccess() {
        return !!(root.CloudApi || root.cloudClient || root.sbClient);
    }

    function getWorkspaceProjectKey() {
        if (typeof root.readWorkspaceProjectKey === 'function') {
            return normalizeText(root.readWorkspaceProjectKey());
        }
        return normalizeText(root.CURRENT_PROJECT_KEY);
    }

    function getCurrentExamKey() {
        if (root.WorkspaceState && typeof root.WorkspaceState.getCurrentExamId === 'function') {
            return normalizeText(root.WorkspaceState.getCurrentExamId());
        }
        return normalizeText(root.CURRENT_EXAM_ID || (root.localStorage && root.localStorage.getItem('CURRENT_EXAM_ID')) || '');
    }

    function getCurrentCloudCohortId() {
        const raw = normalizeText(
            root.CURRENT_COHORT_ID
            || (root.readWorkspaceCohortId && root.readWorkspaceCohortId())
            || getWorkspaceProjectKey()
        );
        if (!raw) return '';
        if (typeof root.normalizeCompareCohortId === 'function') {
            return normalizeText(root.normalizeCompareCohortId(raw));
        }
        const match = raw.match(/20\d{2}/);
        return match ? match[0] : raw;
    }

    const MAX_CLOUD_BACKUP_RENDER_ROWS = 80;
    const CLOUD_BACKUP_LIST_CACHE_MS = 45 * 1000;
    const DATA_MANAGER_STATUS_MODEL_CACHE_MS = 1200;

    function nowMs() {
        return root.performance && typeof root.performance.now === 'function'
            ? root.performance.now()
            : Date.now();
    }

    function shouldLogPerf(durationMs) {
        if (durationMs >= 250) return true;
        try {
            return root.localStorage && root.localStorage.getItem('SCHOOL_SYSTEM_PERF') === 'true';
        } catch (_) {
            return false;
        }
    }

    function rememberDataCloudPerf(manager, name, startedAt, detail = {}) {
        const durationMs = Math.round((nowMs() - startedAt) * 10) / 10;
        const entry = {
            name,
            durationMs,
            at: new Date().toISOString(),
            ...detail
        };
        if (manager && typeof manager === 'object') {
            manager.cloudPerfTimings = Array.isArray(manager.cloudPerfTimings) ? manager.cloudPerfTimings : [];
            manager.cloudPerfTimings.push(entry);
            while (manager.cloudPerfTimings.length > 80) manager.cloudPerfTimings.shift();
        }
        if (root.__SCHOOL_PERF_TIMINGS__ && Array.isArray(root.__SCHOOL_PERF_TIMINGS__)) {
            root.__SCHOOL_PERF_TIMINGS__.push(entry);
            while (root.__SCHOOL_PERF_TIMINGS__.length > 120) root.__SCHOOL_PERF_TIMINGS__.shift();
        } else {
            root.__SCHOOL_PERF_TIMINGS__ = [entry];
        }
        if (shouldLogPerf(durationMs)) {
            root.console?.info?.('[school-perf]', entry);
        }
        return entry;
    }

    function getCloudBackupListQueryOptions(filterCurrent) {
        const options = {
            order: 'updated_at',
            limit: filterCurrent ? 800 : 500
        };
        if (!filterCurrent) return options;
        const keys = new Set();
        const workspaceKey = getWorkspaceProjectKey();
        const currentExamKey = getCurrentExamKey();
        const cohortId = getCurrentCloudCohortId();
        if (workspaceKey) keys.add(workspaceKey);
        if (currentExamKey) keys.add(currentExamKey);
        if (cohortId) keys.add(`cohort::${cohortId}`);
        if (keys.size) options.keyIn = Array.from(keys);
        return options;
    }

    function getCloudBackupListCacheKey(filterCurrent, filterSnapshotsOnly) {
        const options = getCloudBackupListQueryOptions(filterCurrent);
        return JSON.stringify({
            filterCurrent: !!filterCurrent,
            filterSnapshotsOnly: !!filterSnapshotsOnly,
            workspaceKey: getWorkspaceProjectKey(),
            currentExamKey: getCurrentExamKey(),
            cohortId: getCurrentCloudCohortId(),
            options
        });
    }

    function clearCloudBackupListCache(manager) {
        if (manager && typeof manager === 'object') {
            manager.cloudBackupListCache = null;
        }
    }

    function getCachedCloudBackupList(manager, cacheKey) {
        const cached = manager && manager.cloudBackupListCache;
        if (!cached || cached.key !== cacheKey) return null;
        if (Date.now() - Number(cached.at || 0) > CLOUD_BACKUP_LIST_CACHE_MS) return null;
        return cached;
    }

    function setCachedCloudBackupList(manager, cacheKey, payload) {
        if (!manager || typeof manager !== 'object') return payload;
        manager.cloudBackupListCache = {
            key: cacheKey,
            at: Date.now(),
            ...payload
        };
        return manager.cloudBackupListCache;
    }

    function getCurrentCohortDb() {
        if (root.WorkspaceState && typeof root.WorkspaceState.getCohortDb === 'function') {
            return root.WorkspaceState.getCohortDb();
        }
        return root.COHORT_DB && typeof root.COHORT_DB === 'object' ? root.COHORT_DB : null;
    }

    function syncWorkspaceState(patch = {}) {
        if (root.WorkspaceState && typeof root.WorkspaceState.syncWorkspaceState === 'function') {
            return root.WorkspaceState.syncWorkspaceState(patch);
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'cohortDb')) {
            root.COHORT_DB = patch.cohortDb && typeof patch.cohortDb === 'object' ? patch.cohortDb : null;
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'currentExamId')) {
            const nextExamId = normalizeText(patch.currentExamId);
            root.CURRENT_EXAM_ID = nextExamId;
            if (root.localStorage) {
                if (nextExamId) root.localStorage.setItem('CURRENT_EXAM_ID', nextExamId);
                else root.localStorage.removeItem('CURRENT_EXAM_ID');
            }
        }
        if (Object.prototype.hasOwnProperty.call(patch, 'currentProjectKey')) {
            writeWorkspaceProjectKey(patch.currentProjectKey);
        }
        return patch;
    }

    function writeWorkspaceProjectKey(key) {
        if (typeof root.writeWorkspaceProjectKey === 'function') {
            root.writeWorkspaceProjectKey(key);
            return;
        }
        root.CURRENT_PROJECT_KEY = normalizeText(key);
    }

    function shouldPreferMetadataQuery() {
        if (typeof root.shouldUseCloudProxy === 'function') {
            return !!root.shouldUseCloudProxy();
        }
        if (typeof root.shouldUseSupabaseProxy === 'function') {
            return !!root.shouldUseSupabaseProxy();
        }
        if (typeof root.shouldUseSameOriginCloudProxy === 'function') {
            return !!root.shouldUseSameOriginCloudProxy();
        }
        if (typeof root.shouldUseSameOriginSupabaseProxy === 'function') {
            return !!root.shouldUseSameOriginSupabaseProxy();
        }
        return false;
    }

    function revokeUrlLater(url) {
        if (!url || !(root.URL && typeof root.URL.revokeObjectURL === 'function')) return;
        setTimeout(() => root.URL.revokeObjectURL(url), 1000);
    }

    function appendTempLink(link) {
        const doc = getDocument();
        if (doc && doc.body && typeof doc.body.appendChild === 'function') {
            doc.body.appendChild(link);
        }
    }

    function removeTempLink(link) {
        if (link && typeof link.remove === 'function') link.remove();
    }

    function ensureMap(value) {
        return value instanceof Map ? value : new Map();
    }

    function ensureSelection(value) {
        return value instanceof Set ? value : new Set();
    }

    const cloudSyncInflight = new Map();
    const deferredDbCloudSaves = new Map();

    function getCurrentExamLabel(key) {
        const normalizedKey = normalizeText(key);
        if (!normalizedKey) return '';
        if (typeof root.deriveExamLabel === 'function') {
            const label = normalizeText(root.deriveExamLabel(normalizedKey, normalizedKey));
            if (label) return label;
        }
        if (root.CloudWorkspaceRuntimeDeps && typeof root.CloudWorkspaceRuntimeDeps.deriveExamLabel === 'function') {
            const label = normalizeText(root.CloudWorkspaceRuntimeDeps.deriveExamLabel(normalizedKey, normalizedKey));
            if (label) return label;
        }
        const parts = normalizedKey.split('_').filter(Boolean);
        return parts.length >= 5 ? parts.slice(4).join('_') : normalizedKey;
    }

    function getExamSortTimestamp(exam) {
        if (!exam || typeof exam !== 'object') return 0;
        if (root && typeof root.getExamRecordDateSortTimestamp === 'function') {
            return root.getExamRecordDateSortTimestamp(exam.examId || exam.examFullKey || '', exam);
        }
        const dateText = String(exam?.meta?.date || exam?.date || exam?.examId || exam?.examFullKey || '').match(/(\d{4}-\d{2}-\d{2})(?!.*\d{4}-\d{2}-\d{2})/)?.[1] || '';
        const dateTs = dateText ? Date.parse(`${dateText}T00:00:00`) : 0;
        if (Number.isFinite(dateTs) && dateTs > 0) return dateTs;
        const updatedTs = Date.parse(String(exam.updatedAt || '')) || Number(exam.updatedAt || 0) || 0;
        const createdTs = Date.parse(String(exam.createdAt || '')) || Number(exam.createdAt || 0) || 0;
        return Math.max(updatedTs, createdTs);
    }

    function pickFallbackExamId(db, removedExamId) {
        const exams = db && db.exams && typeof db.exams === 'object' ? db.exams : {};
        return Object.values(exams)
            .filter((exam) => exam && typeof exam === 'object' && normalizeText(exam.examId) && normalizeText(exam.examId) !== normalizeText(removedExamId))
            .sort((left, right) => {
                const delta = getExamSortTimestamp(right) - getExamSortTimestamp(left);
                if (delta !== 0) return delta;
                return String(right.examId || '').localeCompare(String(left.examId || ''), 'zh-CN');
            })[0]?.examId || '';
    }

    function refreshExamWorkspaceUi() {
        if (root.CohortDB && typeof root.CohortDB.renderExamList === 'function') root.CohortDB.renderExamList();
        if (typeof root.applyExamMetaUI === 'function') root.applyExamMetaUI();
        if (typeof root.renderTables === 'function') root.renderTables();
        if (typeof root.updateSchoolSelect === 'function') root.updateSchoolSelect();
        if (typeof root.updateMySchoolSelect === 'function') root.updateMySchoolSelect();
        if (typeof root.updateStudentSchoolSelect === 'function') root.updateStudentSchoolSelect();
        if (typeof root.updateMarginalSchoolSelect === 'function') root.updateMarginalSchoolSelect();
        if (typeof root.updateClassSelect === 'function') root.updateClassSelect();
        if (typeof root.updateSegmentSelects === 'function') root.updateSegmentSelects();
        if (typeof root.updateClassCompSchoolSelect === 'function') root.updateClassCompSchoolSelect();
        if (typeof root.updatePotentialSchoolSelect === 'function') root.updatePotentialSchoolSelect();
        if (typeof root.updateCorrelationSchoolSelect === 'function') root.updateCorrelationSchoolSelect();
        if (typeof root.updateGlobalScopeControls === 'function') root.updateGlobalScopeControls();
        if (root.CohortGrowth && typeof root.CohortGrowth.updateScopeControls === 'function') {
            root.CohortGrowth.updateScopeControls();
        }
        if (typeof root.updateSeatAdjSelects === 'function') root.updateSeatAdjSelects();
        if (typeof root.updateProgressSchoolSelect === 'function') root.updateProgressSchoolSelect();
        if (typeof root.updateMutualAidSelects === 'function') root.updateMutualAidSelects();
        if (typeof root.updateMpSchoolSelect === 'function') root.updateMpSchoolSelect();
        if (typeof root.updateStatusPanel === 'function') root.updateStatusPanel();
        if (root.DataManager && typeof root.DataManager.renderDataManagerStatus === 'function') {
            root.DataManager.renderDataManagerStatus();
        }
    }

    function clearCurrentExamWorkspace(db) {
        if (typeof root.clearDataRuntimeState === 'function') {
            root.clearDataRuntimeState({ keepConfig: true });
        }
        if (typeof root.clearExamRuntimeState === 'function') {
            root.clearExamRuntimeState();
        }
        if (typeof root.clearTeacherRuntimeState === 'function') {
            root.clearTeacherRuntimeState();
        } else if (typeof root.setTeacherMap === 'function') {
            root.setTeacherMap({});
        }
        syncWorkspaceState({
            cohortDb: db,
            currentExamId: ''
        });
        if (db && typeof db === 'object') db.currentExamId = '';
        refreshExamWorkspaceUi();
    }

    function removeExamFromLocalState(examId) {
        const normalizedExamId = normalizeText(examId);
        const db = getCurrentCohortDb();
        if (!db || !db.exams || typeof db.exams !== 'object' || !normalizedExamId) {
            return { removed: false, fallbackExamId: '' };
        }
        if (!db.exams[normalizedExamId]) {
            if (getCurrentExamKey() === normalizedExamId) {
                clearCurrentExamWorkspace(db);
                return { removed: true, fallbackExamId: '' };
            }
            return { removed: false, fallbackExamId: normalizeText(db.currentExamId) };
        }

        delete db.exams[normalizedExamId];
        if (Array.isArray(db.resetPoints)) {
            db.resetPoints = db.resetPoints.filter((item) => normalizeText(item) !== normalizedExamId);
        }

        const fallbackExamId = pickFallbackExamId(db, normalizedExamId);
        db.currentExamId = fallbackExamId;
        syncWorkspaceState({
            cohortDb: db,
            currentExamId: fallbackExamId
        });

        if (fallbackExamId && root.CohortDB && typeof root.CohortDB.applyExamToWorkspace === 'function') {
            root.CohortDB.applyExamToWorkspace(fallbackExamId);
            refreshExamWorkspaceUi();
            return { removed: true, fallbackExamId };
        }

        clearCurrentExamWorkspace(db);
        return { removed: true, fallbackExamId: '' };
    }

    async function deleteLocalCache(key) {
        const store = getIdbKeyval();
        if (!store || typeof store.del !== 'function') return false;
        await store.del(getLocalCacheStorageKey(key));
        await store.del(getLocalCacheStorageKey(key, '_meta'));
        return true;
    }

    function buildCurrentExamCloudActions(manager) {
        manager.cloudBackupRows = ensureMap(manager.cloudBackupRows);
        const currentExamKey = getCurrentExamKey();
        const workspaceKey = getWorkspaceProjectKey();
        const currentExamRow = currentExamKey ? manager.cloudBackupRows.get(currentExamKey) : null;
        const currentExamLabel = getCurrentExamLabel(currentExamKey);
        const hasCurrentExam = !!currentExamKey;
        const currentExamStatus = !hasCurrentExam
            ? '当前还没有选中的考试批次。'
            : currentExamRow
                ? `已找到当前考试的独立云端快照，最近更新时间：${new Date(currentExamRow.updated_at || currentExamRow.created_at).toLocaleString()}。`
                : '当前考试没有独立快照记录，但仍会同步清理本地届别库和工作区快照中的该考试。';
        const currentExamScope = workspaceKey
            ? `工作区快照：${workspaceKey}`
            : '工作区快照：未识别';
        const disabledAttr = hasCurrentExam ? '' : 'disabled';
        const disabledStyle = hasCurrentExam ? '' : 'opacity:0.55; cursor:not-allowed;';

        return `
            <div style="margin-top:10px; padding:10px 12px; border-radius:10px; border:1px solid #fecaca; background:#fff7ed; display:flex; justify-content:space-between; gap:12px; align-items:center; flex-wrap:wrap;">
                <div style="min-width:260px; flex:1;">
                    <div style="font-size:12px; color:#9a3412; font-weight:700;">当前考试数据删除</div>
                    <div style="margin-top:4px; font-size:13px; color:#7c2d12;">
                        当前考试：<strong>${escapeHtml(currentExamKey || '未选择')}</strong>${currentExamLabel ? ` <span style="color:#9a3412;">(${escapeHtml(currentExamLabel)})</span>` : ''}
                    </div>
                    <div style="margin-top:4px; font-size:12px; color:#9a3412; line-height:1.7;">${escapeHtml(currentExamStatus)}</div>
                    <div style="margin-top:4px; font-size:11px; color:#c2410c; line-height:1.6;">${escapeHtml(currentExamScope)}</div>
                </div>
                <button class="btn btn-sm btn-danger" ${disabledAttr} style="${disabledStyle}" onclick="window.DataCloudRuntime.deleteCurrentExamCloudBackup(window.DataManager)" title="删除当前考试的本地届别库数据、工作区快照引用和独立云端考试快照">
                    <i class="ti ti-trash"></i> 删除当前考试数据
                </button>
            </div>
        `;
    }

    function getIdbKeyval() {
        return root.idbKeyval && typeof root.idbKeyval === 'object' ? root.idbKeyval : null;
    }

    function getIdbUserPrefix() {
        try {
            const user = typeof root.getCurrentUser === 'function'
                ? root.getCurrentUser()
                : (root.Auth && root.Auth.currentUser ? root.Auth.currentUser : null);
            const username = normalizeText(user?.username || '').toLowerCase().replace(/[^a-z0-9_-]/g, '_');
            return username ? `u_${username}__` : '';
        } catch (_) {
            return '';
        }
    }

    function getLocalCacheStorageKey(key, suffix = '') {
        const prefix = getIdbUserPrefix();
        return `${prefix}cache${suffix}_${key}`;
    }

    async function writeLocalCache(key, value, meta = {}) {
        const store = getIdbKeyval();
        if (!store || typeof store.set !== 'function') return false;
        await store.set(getLocalCacheStorageKey(key), value);
        if (meta && typeof meta === 'object' && Object.keys(meta).length > 0) {
            await store.set(getLocalCacheStorageKey(key, '_meta'), {
                key,
                updatedAt: normalizeText(meta.updatedAt || meta.updated_at),
                cachedAt: new Date().toISOString()
            });
        }
        return true;
    }

    async function readLocalCache(key) {
        const store = getIdbKeyval();
        if (!store || typeof store.get !== 'function') return null;
        return store.get(getLocalCacheStorageKey(key));
    }

    async function readLocalCacheMeta(key) {
        const store = getIdbKeyval();
        if (!store || typeof store.get !== 'function') return null;
        const meta = await store.get(getLocalCacheStorageKey(key, '_meta'));
        return meta && typeof meta === 'object' ? meta : null;
    }

    function isLocalCacheFresh(localMeta, remoteUpdatedAt) {
        const localTs = new Date(normalizeText(localMeta && localMeta.updatedAt)).getTime() || 0;
        const remoteTs = new Date(normalizeText(remoteUpdatedAt)).getTime() || 0;
        return !!localTs && !!remoteTs && localTs >= remoteTs - 1000;
    }

    function parseCloudPayload(content) {
        if (root.CloudWorkspaceRuntimeDeps && typeof root.CloudWorkspaceRuntimeDeps.parsePayload === 'function') {
            return root.CloudWorkspaceRuntimeDeps.parsePayload(content);
        }

        let parsed = content;
        if (typeof parsed === 'string' && parsed.startsWith('LZB64|')) {
            if (!root.LZString || typeof root.LZString.decompressFromBase64 !== 'function') {
                throw new Error('LZString 未加载，无法解压云端内容');
            }
            const decompressed = root.LZString.decompressFromBase64(parsed.substring(6));
            parsed = JSON.parse(decompressed);
        } else if (typeof parsed === 'string' && parsed.startsWith('LZ|')) {
            if (!root.LZString || typeof root.LZString.decompressFromUTF16 !== 'function') {
                throw new Error('LZString 未加载，无法解压云端内容');
            }
            const decompressed = root.LZString.decompressFromUTF16(parsed.substring(3));
            parsed = JSON.parse(decompressed);
        } else if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
        }

        return parsed;
    }

    function deepClone(value) {
        if (value == null) return value;
        return JSON.parse(JSON.stringify(value));
    }

    function isSplitWorkspacePayload(payload) {
        return payload && typeof payload === 'object'
            && payload.__CLOUD_WORKSPACE_SPLIT_VERSION === 'workspace-split-v1';
    }

    function getSplitCurrentExamKey(payload) {
        return normalizeText(
            payload && (
                payload.__CURRENT_EXAM_KEY
                || payload.CURRENT_EXAM_ID
                || (payload.COHORT_DB && payload.COHORT_DB.currentExamId)
            )
        );
    }

    function extractSplitCohortId(key, payload) {
        if (root.CloudWorkspaceRuntimeDeps && typeof root.CloudWorkspaceRuntimeDeps.extractCohortIdFromKey === 'function') {
            return normalizeText(
                root.CloudWorkspaceRuntimeDeps.extractCohortIdFromKey(key)
                || root.CloudWorkspaceRuntimeDeps.extractCohortIdFromKey(payload && payload.CURRENT_COHORT_ID)
            );
        }
        const text = normalizeText(key || (payload && payload.CURRENT_COHORT_ID));
        const match = text.match(/(\d{4})/);
        return match ? match[1] : '';
    }

    function mergeSplitWorkspacePayload(metaPayload, examPayload, fallbackExamKey) {
        const merged = deepClone(metaPayload || {});
        delete merged.__CLOUD_WORKSPACE_SPLIT_VERSION;
        delete merged.__CURRENT_EXAM_KEY;
        delete merged.__EXAM_KEYS;
        delete merged.__META_UPDATED_AT;

        const current = examPayload && typeof examPayload === 'object' ? examPayload : {};
        [
            'RAW_DATA',
            'SCHOOLS',
            'SUBJECTS',
            'THRESHOLDS',
            'TEACHER_MAP',
            'TEACHER_SCHOOL_MAP',
            'CONFIG',
            'MY_SCHOOL',
            'TARGETS',
            'INDICATOR_PARAMS',
            'SCHOOL_ALIAS_SETTINGS',
            'FINGERPRINT',
            'ARCHIVE_META',
            'ARCHIVE_LOCKED',
            'ARCHIVE_LOCKED_KEY',
            'CURRENT_TERM_ID',
            'CURRENT_TEACHER_TERM_ID'
        ].forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(current, field)) {
                merged[field] = deepClone(current[field]);
            }
        });

        const examKey = normalizeText(current.CURRENT_EXAM_ID || fallbackExamKey || getSplitCurrentExamKey(metaPayload));
        const metaDb = merged.COHORT_DB && typeof merged.COHORT_DB === 'object' ? merged.COHORT_DB : {};
        const currentDb = current.COHORT_DB && typeof current.COHORT_DB === 'object' ? current.COHORT_DB : {};
        merged.COHORT_DB = {
            ...metaDb,
            ...currentDb,
            exams: {
                ...(metaDb.exams || {}),
                ...(currentDb.exams || {})
            },
            currentExamId: examKey || currentDb.currentExamId || metaDb.currentExamId || ''
        };
        merged.CURRENT_EXAM_ID = examKey || merged.COHORT_DB.currentExamId || '';
        return merged;
    }

    async function readSplitExamPayload(examKey, metaPayload) {
        const readSystemDataRecord = getReadSystemDataRecord();
        if (readSystemDataRecord && examKey) {
            const localMeta = await readLocalCacheMeta(examKey).catch(() => null);
            const localPayload = localMeta ? await readLocalCache(examKey).catch(() => null) : null;
            const metaOnly = await readSystemDataRecord(examKey, 'updated_at').catch(() => null);
            const remoteUpdatedAt = metaOnly && !metaOnly.error ? metaOnly.data?.updated_at : '';
            if (localPayload) {
                if (isLocalCacheFresh(localMeta, remoteUpdatedAt)) {
                    return { key: examKey, payload: localPayload, cached: true };
                }
            }

            const direct = await readSystemDataRecord(examKey, 'content,updated_at', remoteUpdatedAt ? { cacheVersion: remoteUpdatedAt } : {}).catch(() => null);
            if (direct && !direct.error && direct.data && direct.data.content) {
                const payload = parseCloudPayload(direct.data.content);
                await writeLocalCache(examKey, payload, { updatedAt: direct.data.updated_at }).catch(() => false);
                return { key: examKey, payload };
            }
        }

        const selectSystemDataRecords = getSelectSystemDataRecords();
        const cohortId = extractSplitCohortId(examKey, metaPayload);
        if (!selectSystemDataRecords || !cohortId) return null;

        const { data, error } = await selectSystemDataRecords({
            select: 'key,content,updated_at',
            kind: 'exam',
            cohortId,
            order: 'updated_at',
            ascending: false,
            limit: 12
        });
        if (error) throw error;

        const rows = Array.isArray(data) ? data : [];
        const selected = rows.find(row => normalizeText(row && row.key) === examKey) || rows[0] || null;
        if (!selected || !selected.content) return null;
        const payload = parseCloudPayload(selected.content);
        if (selected.key) {
            await writeLocalCache(selected.key, payload, { updatedAt: selected.updated_at }).catch(() => false);
        }
        return { key: selected.key, payload };
    }

    async function hydrateSplitWorkspacePayload(key, payload) {
        if (!isSplitWorkspacePayload(payload)) return payload;
        const examKey = getSplitCurrentExamKey(payload);
        const exam = await readSplitExamPayload(examKey, payload);
        if (!exam || !exam.payload) return payload;
        return mergeSplitWorkspacePayload(payload, exam.payload, exam.key || examKey);
    }

    function packCloudPayload(value) {
        if (root.CloudWorkspaceRuntimeDeps && typeof root.CloudWorkspaceRuntimeDeps.packPayload === 'function') {
            return root.CloudWorkspaceRuntimeDeps.packPayload(value);
        }
        if (!root.LZString || typeof root.LZString.compressToBase64 !== 'function') {
            throw new Error('LZString 未加载，无法压缩云端内容');
        }
        return `LZB64|${root.LZString.compressToBase64(JSON.stringify(value))}`;
    }

    function scheduleIdleTask(task, options = {}) {
        const delay = Number.isFinite(Number(options.delay)) ? Number(options.delay) : 0;
        const timeout = Number.isFinite(Number(options.timeout)) ? Number(options.timeout) : 8000;
        const run = () => {
            if (root.SystemPerformance && typeof root.SystemPerformance.scheduleIdle === 'function') {
                root.SystemPerformance.scheduleIdle(task, { timeout });
                return;
            }
            if (typeof root.requestIdleCallback === 'function') {
                root.requestIdleCallback(task, { timeout });
                return;
            }
            root.setTimeout(task, 0);
        };
        root.setTimeout(run, Math.max(0, delay));
    }

    async function pushDbSaveToCloud(key, value) {
        if (!ensureCloudAccess()) return true;
        const upsertSystemDataRecord = getUpsertSystemDataRecord();
        if (!upsertSystemDataRecord) return true;

        try {
            const compressedStr = packCloudPayload(value);
            const { error } = await upsertSystemDataRecord({ key, content: compressedStr });
            if (error) {
                logCloudSyncIssue('云端备份失败:', error);
                return false;
            }
            const doc = getDocument();
            const statusEl = doc ? doc.getElementById('auto-backup-status') : null;
            if (statusEl) statusEl.innerHTML = '<span style="color:#16a34a;">☁️ 云端已同步</span>';
            return true;
        } catch (e) {
            logCloudSyncIssue('云端同步出错:', e);
            return false;
        }
    }

    function scheduleDeferredDbCloudSave(key, value, options = {}) {
        const normalizedKey = normalizeText(key);
        if (!normalizedKey) return true;
        const existing = deferredDbCloudSaves.get(normalizedKey) || {};
        deferredDbCloudSaves.set(normalizedKey, {
            key: normalizedKey,
            value,
            timer: existing.timer || null
        });
        if (existing.timer) return true;

        const delayMs = Number.isFinite(Number(options.deferMs)) ? Number(options.deferMs) : 8000;
        const timer = root.setTimeout(() => {
            const pending = deferredDbCloudSaves.get(normalizedKey);
            if (!pending) return;
            pending.timer = null;
            deferredDbCloudSaves.set(normalizedKey, pending);
            scheduleIdleTask(() => {
                const latest = deferredDbCloudSaves.get(normalizedKey);
                if (!latest) return;
                deferredDbCloudSaves.delete(normalizedKey);
                pushDbSaveToCloud(latest.key, latest.value).catch((error) => {
                    logCloudSyncIssue('云端延迟同步出错:', error);
                });
            }, { timeout: 12000 });
        }, Math.max(0, delayMs));

        const next = deferredDbCloudSaves.get(normalizedKey);
        if (next) {
            next.timer = timer;
            deferredDbCloudSaves.set(normalizedKey, next);
        }
        return true;
    }

    function logCloudSyncIssue(label, error) {
        if (typeof root.logCloudSyncIssue === 'function') {
            root.logCloudSyncIssue(label, error);
            return;
        }
        console.error(label, error);
    }

    const CLOUD_TABLE_STATES = {
        loading: { title: '正在读取云端存档', message: '请稍候，正在连接云端数据库。' },
        empty: { title: '暂无存档记录', message: '云端数据库目前没有可显示的存档。' },
        'filtered-empty': { title: '没有匹配的存档', message: '当前筛选条件下暂无可显示的工作区快照。' },
        error: { title: '云端存档加载失败', message: '暂时无法读取云端存档，请重试。' }
    };

    function renderCloudTableState(tbody, shell, state, options = {}) {
        const normalizedState = state === 'ready' || CLOUD_TABLE_STATES[state] ? state : 'error';
        if (shell && shell.dataset) shell.dataset.cloudState = normalizedState;
        if (normalizedState === 'ready' || !tbody) return;

        const copy = CLOUD_TABLE_STATES[normalizedState];
        const title = escapeHtml(options.title || copy.title);
        const message = escapeHtml(options.message || copy.message);
        const retry = normalizedState === 'error' && options.retry !== false
            ? '<button type="button" class="btn btn-sm btn-primary dm-cloud-retry-button" data-cloud-retry>重新加载</button>'
            : '';
        tbody.innerHTML = `<tr class="dm-cloud-state-row"><td class="dm-cloud-state-cell" colspan="5"><span class="dm-cloud-state-title">${title}</span><span class="dm-cloud-state-message">${message}</span>${retry}</td></tr>`;

        const summaryEl = options.summaryEl;
        if (summaryEl && options.summaryText) summaryEl.textContent = String(options.summaryText);
    }

    async function retryCloudBackups(manager) {
        clearCloudBackupListCache(manager);
        return api.renderCloudBackups(manager, { force: true });
    }

    function bindCloudTableRetry(manager, shell) {
        if (!shell || typeof shell.addEventListener !== 'function' || shell.dataset.cloudRetryBound === 'true') return;
        shell.dataset.cloudRetryBound = 'true';
        shell.addEventListener('click', (event) => {
            const target = event && event.target;
            const retryButton = target && typeof target.closest === 'function' ? target.closest('[data-cloud-retry]') : null;
            if (retryButton) api.retryCloudBackups(manager);
        });
    }

    async function renderCloudBackups(manager, options = {}) {
        const renderStartedAt = nowMs();
        if (!root.sbClient && !root.CloudApi) return;
        const doc = getDocument();
        const tbody = doc ? doc.querySelector('#dm-cloud-table tbody') : null;
        const shell = doc ? doc.getElementById('dm-cloud-table-shell') : null;
        const summaryEl = doc ? doc.getElementById('dm-cloud-summary') : null;
        const filterCurrent = doc ? doc.getElementById('cloud-filter-current')?.checked !== false : true;
        const filterSnapshotsOnly = doc ? doc.getElementById('cloud-filter-snapshots')?.checked !== false : true;
        bindCloudTableRetry(manager, shell);

        // 检测演示模式 (Demo Mode)
        const isDemoMode = (root.sessionStorage?.getItem('EDGE_GATEWAY_TOKEN_V1') === 'DEMO_TOKEN') ||
                          (root.localStorage?.getItem('DEV_MODE') === 'true');

        if (isDemoMode) {
            renderCloudTableState(tbody, shell, 'error', {
                title: '演示模式无法访问云端存档',
                message: '请恢复网络连接并使用真实账号登录。',
                retry: false
            });
            if (summaryEl) {
                summaryEl.style.display = 'block';
                summaryEl.innerHTML = '⚠️ 演示模式：云端同步功能已禁用';
                summaryEl.style.color = '#e11d48';
            }
            return;
        }

        renderCloudTableState(tbody, shell, 'loading');
        if (summaryEl) {
            summaryEl.style.display = 'block';
            summaryEl.innerHTML = '⏳ 正在分析数据...';
        }

        try {
            let data = null;
            let error = null;
            const selectSystemDataRecords = getSelectSystemDataRecords();
            if (!selectSystemDataRecords) throw new Error('selectSystemDataRecords unavailable');

            const listQueryOptions = getCloudBackupListQueryOptions(filterCurrent);
            const cacheKey = getCloudBackupListCacheKey(filterCurrent, filterSnapshotsOnly);
            const cachedList = !options.force ? getCachedCloudBackupList(manager, cacheKey) : null;
            let allRows = null;
            let visibleRows = null;

            if (cachedList) {
                allRows = cachedList.allRows;
                visibleRows = cachedList.visibleRows;
                rememberDataCloudPerf(manager, 'DataCloud.renderCloudBackups.fetchMetadata', renderStartedAt, {
                    cache: 'hit',
                    rows: Array.isArray(allRows) ? allRows.length : 0,
                    visibleRows: Array.isArray(visibleRows) ? visibleRows.length : 0,
                    filterCurrent: !!filterCurrent,
                    filterSnapshotsOnly: !!filterSnapshotsOnly
                });
            } else {
                const fetchStartedAt = nowMs();
                const metaResult = await selectSystemDataRecords({
                    select: 'key, created_at, updated_at',
                    ...listQueryOptions
                }, { force: !!options.force });
                rememberDataCloudPerf(manager, 'DataCloud.renderCloudBackups.fetchMetadata', fetchStartedAt, {
                    cache: options.force ? 'force' : 'miss',
                    rows: Array.isArray(metaResult?.data) ? metaResult.data.length : 0,
                    filterCurrent: !!filterCurrent,
                    filterSnapshotsOnly: !!filterSnapshotsOnly,
                    limit: Number(listQueryOptions.limit) || 0,
                    keyMode: Array.isArray(listQueryOptions.keyIn) && listQueryOptions.keyIn.length ? 'in' : 'all'
                });
                data = metaResult?.data || null;
                error = metaResult?.error || null;

                if (error) throw error;

                const computeStartedAt = nowMs();
                allRows = (Array.isArray(data) ? data : []).map((item) => ({
                    ...item,
                    size_bytes: Number(item?.size_bytes) || (typeof item?.content === 'string' ? item.content.length : 0)
                }));

                manager.cloudBackupRows = new Map(allRows.map((item) => [normalizeText(item.key), item]));
                manager.cloudSelection = ensureSelection(manager.cloudSelection);

                visibleRows = allRows.filter((item) => {
                    if (filterSnapshotsOnly && typeof manager.isCloudWorkspaceSnapshotKey === 'function' && !manager.isCloudWorkspaceSnapshotKey(item.key)) return false;
                    if (filterCurrent && typeof manager.isCloudRecordInCurrentWorkspace === 'function' && !manager.isCloudRecordInCurrentWorkspace(item.key)) return false;
                    return true;
                });
                setCachedCloudBackupList(manager, cacheKey, { allRows, visibleRows });
                rememberDataCloudPerf(manager, 'DataCloud.renderCloudBackups.computeVisibleRows', computeStartedAt, {
                    rows: allRows.length,
                    visibleRows: visibleRows.length,
                    filterCurrent: !!filterCurrent,
                    filterSnapshotsOnly: !!filterSnapshotsOnly
                });
            }

            manager.cloudBackupRows = new Map(allRows.map((item) => [normalizeText(item.key), item]));
            manager.cloudSelection = ensureSelection(manager.cloudSelection);

            if (!allRows.length) {
                manager.cloudSelection.clear();
                renderCloudTableState(tbody, shell, 'empty');
                if (summaryEl) {
                    summaryEl.innerHTML = `
                        <div>📌 暂无存档记录</div>
                        ${buildCurrentExamCloudActions(manager)}
                    `;
                }
                api.updateCloudSelectionUI(manager);
                return;
            }

            if (!visibleRows.length) {
                manager.cloudSelection.clear();
                renderCloudTableState(tbody, shell, 'filtered-empty');
                if (summaryEl) {
                    const filterText = [
                        filterCurrent ? '当前届别/工作区' : '',
                        filterSnapshotsOnly ? '工作区快照' : ''
                    ].filter(Boolean).join(' + ') || '全部记录';
                    summaryEl.innerHTML = `
                        <div>📌 当前云端共 ${allRows.length} 条记录，已按「${filterText}」过滤。</div>
                        ${buildCurrentExamCloudActions(manager)}
                    `;
                }
                api.updateCloudSelectionUI(manager);
                return;
            }

            const displayRows = visibleRows.slice(0, MAX_CLOUD_BACKUP_RENDER_ROWS);
            const keySet = new Set(displayRows.map((item) => item.key));
            manager.cloudSelection.forEach((key) => {
                if (!keySet.has(key)) manager.cloudSelection.delete(key);
            });

            const totalSize = visibleRows.reduce((acc, item) => acc + (Number(item.size_bytes) || 0), 0);
            const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
            if (summaryEl) {
                const suffix = displayRows.length !== visibleRows.length || visibleRows.length !== allRows.length
                    ? `<span style="font-size:11px; color:#94a3b8;">当前渲染 ${displayRows.length} / 匹配 ${visibleRows.length} / 云端 ${allRows.length} 条</span>`
                    : '<span style="font-size:11px; color:#94a3b8;">当前显示全部匹配记录</span>';
                summaryEl.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span>📌 当前云端清单 <b>${visibleRows.length}</b> 条 | 占用约 <b>${totalSizeMB} MB</b></span>
                        ${suffix}
                    </div>
                    ${buildCurrentExamCloudActions(manager)}
                `;
            }

            const currentKey = getWorkspaceProjectKey();
            let rows = '';
            displayRows.forEach((item) => {
                const isCurrent = item.key === currentKey;
                const sizeKB = ((Number(item.size_bytes) || 0) / 1024).toFixed(1);
                const time = escapeHtml(new Date(item.updated_at || item.created_at).toLocaleString());
                const safeKey = escapeHtml(item.key);
                let displayName = safeKey;
                let tags = '';
                const parts = String(item.key || '').split('_');

                if (parts.length >= 5) {
                    const safeParts = parts.map(escapeHtml);
                    displayName = `<b>${safeParts[0]} ${safeParts[1]}</b><br><span style="color:#64748b; font-size:11px;">${safeParts[2]} ${safeParts[3]} ${safeParts[5] || ''}</span>`;
                    tags = `<span class="badge" style="background:${parts[4] === '期末' ? '#ef4444' : '#3b82f6'}; color:white; padding:2px 6px; border-radius:4px; font-size:10px;">${safeParts[4]}</span>`;
                }

                rows += `
                    <tr style="${isCurrent ? 'background:#f0fdf4;' : ''}">
                        <td style="text-align:center; width:44px;">
                            <input type="checkbox" class="dm-cloud-select" data-key="${safeKey}" ${manager.cloudSelection.has(item.key) ? 'checked' : ''}>
                        </td>
                        <td>
                            <div style="display:flex; align-items:center; gap:8px;">
                                ${isCurrent ? '<i class="ti ti-current-location" style="color:#16a34a;" title="当前项目"></i>' : ''}
                                <div>${displayName}</div>
                                ${tags}
                            </div>
                        </td>
                        <td style="font-size:12px; color:#64748b;">${time}</td>
                        <td style="font-size:12px;">${sizeKB} KB</td>
                        <td>
                            <div style="display:flex; gap:6px;">
                                <button class="btn btn-sm btn-primary" type="button" data-cloud-backup-action="load" data-key="${safeKey}" title="读取此存档">
                                    <i class="ti ti-download"></i> 读取
                                </button>
                                <button class="btn btn-sm btn-green" type="button" data-cloud-backup-action="download" data-key="${safeKey}" title="下载此存档文档">
                                    <i class="ti ti-file-download"></i> 下载存档
                                </button>
                                <button class="btn btn-sm btn-danger" type="button" data-cloud-backup-action="delete" data-key="${safeKey}" title="永久删除">
                                    <i class="ti ti-trash"></i>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            });

            if (tbody) {
                renderCloudTableState(tbody, shell, 'ready');
                tbody.innerHTML = rows;
                bindCloudBackupRowActions(manager, tbody);
            }
            api.updateCloudSelectionUI(manager);
            rememberDataCloudPerf(manager, 'DataCloud.renderCloudBackups.total', renderStartedAt, {
                rows: allRows.length,
                visibleRows: visibleRows.length,
                renderedRows: displayRows.length,
                cache: cachedList ? 'hit' : options.force ? 'force' : 'miss'
            });
        } catch (error) {
            root.console?.error?.(error);
            manager.cloudBackupRows = new Map();
            renderCloudTableState(tbody, shell, 'error', {
                message: error && error.message ? error.message : '未知错误',
                summaryEl,
                summaryText: '云端存档加载失败。请检查连接后重试。'
            });
            api.updateCloudSelectionUI(manager);
        }
    }

    function toggleCloudSelection(manager, inputEl) {
        if (!inputEl) return;
        const key = normalizeText(inputEl.dataset && inputEl.dataset.key);
        if (!key) return;
        manager.cloudSelection = ensureSelection(manager.cloudSelection);
        if (inputEl.checked) manager.cloudSelection.add(key);
        else manager.cloudSelection.delete(key);
        api.updateCloudSelectionUI(manager);
    }

    function toggleCloudSelectAll(manager, checked) {
        const doc = getDocument();
        manager.cloudSelection = ensureSelection(manager.cloudSelection);
        const boxes = doc ? Array.from(doc.querySelectorAll('#dm-cloud-table tbody .dm-cloud-select')) : [];
        boxes.forEach((box) => {
            box.checked = !!checked;
            const key = normalizeText(box.dataset && box.dataset.key);
            if (!key) return;
            if (checked) manager.cloudSelection.add(key);
            else manager.cloudSelection.delete(key);
        });
        api.updateCloudSelectionUI(manager);
    }

    function updateCloudSelectionUI(manager) {
        const doc = getDocument();
        const boxes = doc ? Array.from(doc.querySelectorAll('#dm-cloud-table tbody .dm-cloud-select')) : [];
        const headerBox = doc ? doc.getElementById('dm-cloud-select-all') : null;
        const countEl = doc ? doc.getElementById('cloud-selected-count') : null;
        const batchBtn = doc ? doc.getElementById('btn-cloud-batch-delete') : null;
        manager.cloudSelection = ensureSelection(manager.cloudSelection);

        let visibleSelected = 0;
        boxes.forEach((box) => {
            if (manager.cloudSelection.has(box.dataset.key)) {
                box.checked = true;
                visibleSelected++;
            }
        });

        if (headerBox) {
            headerBox.indeterminate = visibleSelected > 0 && visibleSelected < boxes.length;
            headerBox.checked = boxes.length > 0 && visibleSelected === boxes.length;
        }
        if (countEl) countEl.textContent = `已选 ${manager.cloudSelection.size} 项`;
        if (batchBtn) {
            batchBtn.disabled = manager.cloudSelection.size === 0;
            batchBtn.style.opacity = manager.cloudSelection.size === 0 ? '0.6' : '1';
            batchBtn.title = manager.cloudSelection.size === 0 ? '请先勾选需要删除的存档' : '删除当前勾选的云端存档';
        }
    }

    async function deleteSelectedCloudBackups(manager) {
        manager.cloudSelection = ensureSelection(manager.cloudSelection);
        const keys = Array.from(manager.cloudSelection);
        if (!keys.length) {
            safeAlert('请先勾选要删除的云端存档');
            return;
        }
        if (!safeConfirm(`🧨 危险操作！\n\n确定要永久删除选中的 ${keys.length} 个存档吗？\n删除后无法恢复！`)) return;

        const deleteSystemDataRecords = getDeleteSystemDataRecords();
        if (!deleteSystemDataRecords) throw new Error('deleteSystemDataRecords unavailable');

        safeLoading(true, `正在批量删除 ${keys.length} 项...`);
        try {
            const { error } = await deleteSystemDataRecords({ keyIn: keys });
            if (error) throw error;
            clearCloudBackupListCache(manager);
            manager.cloudSelection.clear();
            safeToast(`✅ 批量删除成功（${keys.length}项）`, 'success');
            await api.renderCloudBackups(manager, { force: true });
        } catch (e) {
            safeAlert(`批量删除失败: ${e.message}`);
        } finally {
            safeLoading(false);
        }
    }

    async function getCloudBackupRow(manager, key) {
        const normalizedKey = normalizeText(key);
        if (!normalizedKey) throw new Error('存档 Key 不能为空');

        manager.cloudBackupRows = ensureMap(manager.cloudBackupRows);
        const cached = manager.cloudBackupRows.get(normalizedKey);
        if (cached && Object.prototype.hasOwnProperty.call(cached, 'content')) return cached;

        const readSystemDataRecord = getReadSystemDataRecord();
        if (!readSystemDataRecord) throw new Error('readSystemDataRecord unavailable');

        const { data, error } = await readSystemDataRecord(normalizedKey, 'key, created_at, updated_at, content');
        if (error) throw error;
        if (!data) throw new Error(`未找到存档：${normalizedKey}`);

        const merged = cached && typeof cached === 'object'
            ? { ...cached, ...data }
            : data;
        manager.cloudBackupRows.set(normalizedKey, merged);
        return merged;
    }

    function buildCloudArchiveExportPayload(item) {
        return {
            format: 'school-system-cloud-archive',
            version: 1,
            key: normalizeText(item && item.key),
            content: Object.prototype.hasOwnProperty.call(item || {}, 'content') ? item.content : null,
            created_at: item && item.created_at ? item.created_at : null,
            updated_at: item && item.updated_at ? item.updated_at : null,
            exported_at: new Date().toISOString()
        };
    }

    function getCloudArchiveDownloadName(key) {
        const base = normalizeText(key || 'cloud-archive')
            .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
            .replace(/\s+/g, '_')
            .slice(0, 96) || 'cloud-archive';
        return `${base}.school-archive.json`;
    }

    async function downloadCloudBackup(manager, key) {
        const doc = getDocument();
        safeLoading(true, `正在准备下载 ${key}...`);
        try {
            const item = await api.getCloudBackupRow(manager, key);
            const payload = api.buildCloudArchiveExportPayload(item);
            if (!root.Blob || !root.URL || typeof root.URL.createObjectURL !== 'function') {
                throw new Error('当前环境不支持文件下载');
            }
            const blob = new root.Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
            const url = root.URL.createObjectURL(blob);
            const link = doc && typeof doc.createElement === 'function' ? doc.createElement('a') : null;
            if (!link) throw new Error('当前环境不支持文件下载');
            link.href = url;
            link.download = api.getCloudArchiveDownloadName(payload.key);
            appendTempLink(link);
            if (typeof link.click === 'function') link.click();
            removeTempLink(link);
            revokeUrlLater(url);
            safeToast(`✅ 已下载存档：${payload.key}`, 'success');
        } catch (e) {
            safeAlert(`下载存档失败: ${e.message}`);
        } finally {
            safeLoading(false);
        }
    }

    function triggerCloudArchiveUpload() {
        if (!ensureCloudAccess()) {
            safeAlert('云端连接未就绪，暂时无法上传存档文档');
            return;
        }
        const doc = getDocument();
        const input = doc ? doc.getElementById('dm-cloud-upload-input') : null;
        if (!input) {
            safeAlert('上传控件未初始化');
            return;
        }
        input.value = '';
        if (typeof input.click === 'function') input.click();
    }

    function parseCloudArchiveImportRecords(rawText, fallbackName = '') {
        let parsed = null;
        try {
            parsed = JSON.parse(normalizeText(rawText));
        } catch (_) {
            throw new Error('文件不是有效的 JSON 存档文档');
        }

        const items = Array.isArray(parsed) ? parsed : [parsed];
        const fallbackKey = normalizeText(fallbackName)
            .replace(/\.school-archive\.json$/i, '')
            .replace(/\.json$/i, '');

        return items.map((entry, index) => {
            const source = entry && typeof entry.record === 'object' ? entry.record : entry;
            const key = normalizeText(source && source.key) || fallbackKey;
            if (!key) {
                throw new Error(`第 ${index + 1} 条记录缺少存档 Key`);
            }
            if (!Object.prototype.hasOwnProperty.call(source || {}, 'content')) {
                throw new Error(`第 ${index + 1} 条记录缺少 content 字段`);
            }
            return { key, content: source.content };
        });
    }

    async function handleCloudArchiveUpload(manager, input) {
        const files = Array.from(input && input.files ? input.files : []);
        if (!files.length) return;

        const upsertSystemDataRecord = getUpsertSystemDataRecord();
        if (!upsertSystemDataRecord) throw new Error('upsertSystemDataRecord unavailable');

        try {
            safeLoading(true, `正在解析 ${files.length} 个上传文档...`);
            const parsedRecords = [];

            for (const file of files) {
                const text = await file.text();
                const records = api.parseCloudArchiveImportRecords(text, file.name);
                records.forEach((record) => parsedRecords.push(record));
            }

            const dedupeMap = new Map();
            parsedRecords.forEach((record) => dedupeMap.set(record.key, record));
            const recordsToUpload = Array.from(dedupeMap.values());
            if (!recordsToUpload.length) throw new Error('没有可上传的有效存档记录');

            const shouldContinue = safeConfirm(`确定上传 ${recordsToUpload.length} 份存档到云端吗？\n若 Key 已存在，将直接覆盖同名存档。`);
            if (!shouldContinue) return;

            const { error } = await upsertSystemDataRecord(recordsToUpload);
            if (error) throw error;
            clearCloudBackupListCache(manager);

            safeToast(`✅ 已上传 ${recordsToUpload.length} 份存档文档`, 'success');
            await api.renderCloudBackups(manager, { force: true });
        } catch (e) {
            console.error(e);
            safeAlert(`上传存档文档失败: ${e.message}`);
        } finally {
            if (input) input.value = '';
            safeLoading(false);
        }
    }

    async function loadCloudBackup(manager, key) {
        if (typeof manager.isCloudWorkspaceSnapshotKey === 'function' && !manager.isCloudWorkspaceSnapshotKey(key)) {
            safeAlert('该记录不是工作区快照。教师任课和各类对比请在对应模块中查看。');
            return;
        }
        if (!safeConfirm(`⚠️ 确定要切换到存档 [${key}] 吗？\n当前未保存的工作将会丢失。`)) return;
        writeWorkspaceProjectKey(key);
        clearCloudBackupListCache(manager);
        if (root.CloudManager && typeof root.CloudManager.load === 'function') {
            await root.CloudManager.load();
        }
        await api.renderCloudBackups(manager, { force: true });
    }

    async function deleteCloudBackup(manager, key) {
        if (!safeConfirm(`🧨 危险操作！\n\n确定要永久删除 [${key}] 吗？\n删除后无法恢复！`)) return;

        const deleteSystemDataRecords = getDeleteSystemDataRecords();
        if (!deleteSystemDataRecords) throw new Error('deleteSystemDataRecords unavailable');

        safeLoading(true, `正在删除 ${key}...`);
        try {
            const { error } = await deleteSystemDataRecords({ keyEq: key });
            if (error) throw error;

            manager.cloudSelection = ensureSelection(manager.cloudSelection);
            manager.cloudSelection.delete(key);
            safeToast('✅ 删除成功', 'success');
            await api.renderCloudBackups(manager, { force: true });
        } catch (e) {
            safeAlert(`删除失败: ${e.message}`);
        } finally {
            safeLoading(false);
        }
    }

    async function deleteCurrentExamCloudBackup(manager) {
        const currentExamKey = getCurrentExamKey();
        if (!currentExamKey) {
            safeAlert('当前还没有可删除的考试批次，请先切换到目标考试。');
            return;
        }

        const currentExamLabel = getCurrentExamLabel(currentExamKey);
        const deleteSystemDataRecords = getDeleteSystemDataRecords();
        if (!deleteSystemDataRecords) throw new Error('deleteSystemDataRecords unavailable');

        const promptLines = [
            '危险操作：',
            '',
            `确定要删除当前考试 [${currentExamKey}] 吗？`,
            currentExamLabel ? `考试标签：${currentExamLabel}` : '',
            '',
            '系统会同时处理：',
            '1. 本地届别库中的该次考试数据',
            '2. 当前工作区快照中的该次考试引用',
            '3. 云端独立考试快照（如果存在）',
            '',
            '删除后不可恢复。'
        ].filter(Boolean);
        if (!safeConfirm(promptLines.join('\n'))) return;

        safeLoading(true, `正在删除当前考试 ${currentExamKey}...`);
        try {
            manager.cloudBackupRows = ensureMap(manager.cloudBackupRows);
            const hadRemoteExamSnapshot = manager.cloudBackupRows.has(currentExamKey);

            removeExamFromLocalState(currentExamKey);

            if (root.CloudManager && typeof root.CloudManager.save === 'function') {
                const synced = await root.CloudManager.save({
                    mode: 'workspace',
                    forceUpload: true,
                    sourceLabel: 'delete-current-exam'
                });
                if (!synced) {
                    throw new Error('工作区快照更新失败，请稍后重试。');
                }
            }

            let remoteDeleteError = null;
            if (hadRemoteExamSnapshot) {
                const { error } = await deleteSystemDataRecords({ keyEq: currentExamKey });
                if (error) remoteDeleteError = error;
                else await deleteLocalCache(currentExamKey);
            }

            manager.cloudSelection = ensureSelection(manager.cloudSelection);
            manager.cloudSelection.delete(currentExamKey);
            manager.cloudBackupRows.delete(currentExamKey);
            clearCloudBackupListCache(manager);

            if (remoteDeleteError) {
                safeAlert(`当前考试已从本地届别库和工作区快照中移除，但独立云端考试快照删除失败：${remoteDeleteError.message || remoteDeleteError}`);
            } else {
                safeToast(
                    hadRemoteExamSnapshot
                        ? `已删除当前考试：${currentExamLabel || currentExamKey}`
                        : `已移除当前考试：${currentExamLabel || currentExamKey}`,
                    'success'
                );
            }

            await api.renderCloudBackups(manager, { force: true });
        } catch (e) {
            safeAlert(`删除当前考试失败: ${e.message || e}`);
        } finally {
            safeLoading(false);
        }
    }

    async function loadCloudSnapshots() {
        if (!ensureCloudAccess()) return;
        const doc = getDocument();
        const tbody = doc ? doc.getElementById('dm-cloud-tbody') : null;
        if (!tbody) return;

        const selectSystemDataRecords = getSelectSystemDataRecords();
        if (!selectSystemDataRecords) throw new Error('selectSystemDataRecords unavailable');

        tbody.innerHTML = '<tr><td colspan="3">⏳ 加载中...</td></tr>';
        const { data } = await selectSystemDataRecords({
            select: 'key, created_at',
            order: 'created_at'
        });

        if (!data || !data.length) {
            tbody.innerHTML = '<tr><td colspan="3">无备份</td></tr>';
            return;
        }

        tbody.innerHTML = data.map((item) => {
            const safeKey = escapeHtml(item.key);
            const time = escapeHtml(new Date(item.created_at).toLocaleString());
            return `<tr><td>${safeKey}</td><td>${time}</td><td><button class="btn btn-sm btn-danger" type="button" data-cloud-snapshot-key="${safeKey}">删除</button></td></tr>`;
        }).join('');
        bindCloudSnapshotRowActions(null, tbody);
    }

    async function deleteCloudSnapshot(manager, key) {
        if (!safeConfirm('确定删除？')) return;
        const deleteSystemDataRecords = getDeleteSystemDataRecords();
        if (!deleteSystemDataRecords) throw new Error('deleteSystemDataRecords unavailable');
        await deleteSystemDataRecords({ keyEq: key });
        return api.loadCloudSnapshots(manager);
    }

    async function dbGetLocal(key) {
        try {
            const localData = await readLocalCache(key);
            if (localData) {
                debugLog(`cache hit: ${key}`);
                return localData;
            }
        } catch (e) {
            console.warn('读取本地缓存失败:', e);
        }
        return null;
    }

    async function dbSave(key, value, options = {}) {
        const saveOptions = options && typeof options === 'object' ? options : {};
        try {
            const wrote = await writeLocalCache(key, value);
            if (wrote) debugLog(`cache updated: ${key}`);
        } catch (e) {
            console.warn('本地缓存失败:', e);
        }

        if (saveOptions.localOnly || saveOptions.cloud === false) return true;
        if (saveOptions.deferCloud || saveOptions.background) {
            return scheduleDeferredDbCloudSave(key, value, saveOptions);
        }
        return pushDbSaveToCloud(key, value);
    }

    async function dbGet(key, options = {}) {
        const localOnly = !!options.localOnly;
        try {
            const localData = await readLocalCache(key);
            if (localData) {
                debugLog(`cache ready: ${key}`);
                if (!localOnly) {
                    api.dbSyncFromCloud(key, { background: true }).catch((error) => {
                        console.warn('后台云端同步失败:', error);
                    });
                }
                return localData;
            }
        } catch (e) {
            console.warn('读取本地缓存失败:', e);
        }

        if (localOnly) return null;
        return api.dbSyncFromCloud(key);
    }

    async function dbSyncFromCloud(key, options = {}) {
        if (!ensureCloudAccess()) return null;
        const normalizedKey = normalizeText(key);
        if (!normalizedKey) return null;
        if (cloudSyncInflight.has(normalizedKey)) {
            return cloudSyncInflight.get(normalizedKey);
        }
        const readSystemDataRecord = getReadSystemDataRecord();
        if (!readSystemDataRecord) return null;

        const task = (async () => {
            const { data, error } = await readSystemDataRecord(normalizedKey, 'content,updated_at');
            if (error) throw error;
            if (data && data.content) {
                const db = await hydrateSplitWorkspacePayload(normalizedKey, parseCloudPayload(data.content));
                await writeLocalCache(normalizedKey, db, { updatedAt: data.updated_at });
                return db;
            }
            return null;
        })();

        cloudSyncInflight.set(normalizedKey, task);
        try {
            return await task;
        } catch (e) {
            if (options.background) console.warn('云端同步失败:', e);
            else console.error('云端同步失败:', e);
            return null;
        } finally {
            cloudSyncInflight.delete(normalizedKey);
        }
    }

    async function dbClear(key) {
        if (!ensureCloudAccess()) return;
        const deleteSystemDataRecords = getDeleteSystemDataRecords();
        if (!deleteSystemDataRecords) return;
        try {
            await deleteSystemDataRecords({ keyEq: key });
        } catch (e) {
            console.error('清除数据失败', e);
        }
    }

    function getDataManagerSyncStorageKey() {
        return 'DM_SYNC_STATUS_V1';
    }

    function getDataManagerSyncScope() {
        const projectKey = typeof root.readWorkspaceProjectKey === 'function' ? root.readWorkspaceProjectKey() : '';
        const cohortId = typeof root.readWorkspaceCohortId === 'function' ? root.readWorkspaceCohortId() : '';
        const configName = root.CONFIG && root.CONFIG.name ? root.CONFIG.name : '';
        return normalizeText(projectKey || cohortId || configName || 'default');
    }

    function readDataManagerSyncState() {
        const storageKey = api.getDataManagerSyncStorageKey();
        const scope = api.getDataManagerSyncScope();
        let all = {};
        try {
            all = JSON.parse((root.localStorage && root.localStorage.getItem(storageKey)) || '{}') || {};
        } catch (_) { }
        const scoped = all && typeof all[scope] === 'object' ? all[scope] : null;
        if (scoped) return scoped;
        if (typeof root.readDataManagerSyncStateValue === 'function') {
            return root.readDataManagerSyncStateValue();
        }
        return {};
    }

    function writeDataManagerSyncState(patch) {
        const storageKey = api.getDataManagerSyncStorageKey();
        const scope = api.getDataManagerSyncScope();
        let all = {};
        try {
            all = JSON.parse((root.localStorage && root.localStorage.getItem(storageKey)) || '{}') || {};
        } catch (_) { }
        const current = all && typeof all[scope] === 'object' ? all[scope] : {};
        const next = Object.assign({}, current, patch || {});
        all[scope] = next;
        try {
            if (root.localStorage) root.localStorage.setItem(storageKey, JSON.stringify(all));
        } catch (_) { }
        if (typeof root.setDataManagerSyncStateValue === 'function') {
            return root.setDataManagerSyncStateValue(next);
        }
        return next;
    }

    function getCurrentIndicatorValues() {
        const indicator = typeof root.readIndicatorState === 'function' ? root.readIndicatorState() : {};
        const doc = getDocument();
        const input1 = doc ? (doc.getElementById('dm_ind1_input') || doc.getElementById('ind1')) : null;
        const input2 = doc ? (doc.getElementById('dm_ind2_input') || doc.getElementById('ind2')) : null;
        const highSchoolLineInput = doc ? doc.getElementById('dm_high_school_line_input') : null;
        const ind1 = normalizeText((input1 && input1.value) || indicator.ind1 || '');
        const ind2 = normalizeText((input2 && input2.value) || indicator.ind2 || '');
        const highSchoolLine = normalizeText((highSchoolLineInput && highSchoolLineInput.value) || indicator.highSchoolLine || indicator.graduateHighSchoolLine || '');
        return { ind1, ind2, highSchoolLine };
    }

    function getParamsSyncSignature() {
        const current = api.getCurrentIndicatorValues();
        return current.ind1 || current.ind2 || current.highSchoolLine
            ? `${current.ind1}::${current.ind2}::${current.highSchoolLine}`
            : '';
    }

    function getTargetsSyncSignature() {
        const targets = typeof root.ensureNormalizedTargets === 'function'
            ? (root.ensureNormalizedTargets() || {})
            : (typeof root.readTargetsState === 'function' ? root.readTargetsState() : (root.TARGETS || {}));
        return Object.keys(targets)
            .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'))
            .map((name) => {
                const item = targets[name] || {};
                const normalized = typeof root.normalizeSchoolName === 'function'
                    ? (root.normalizeSchoolName(name) || name)
                    : name;
                return `${normalized}:${parseInt(item.t1, 10) || 0}:${parseInt(item.t2, 10) || 0}`;
            })
            .join('|');
    }

    function buildTeacherSignature(teacherMap, schoolMap) {
        const map = teacherMap && typeof teacherMap === 'object' ? teacherMap : {};
        const schools = schoolMap && typeof schoolMap === 'object' ? schoolMap : {};
        return Object.keys(map)
            .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }))
            .map((key) => `${key}:${normalizeText(map[key])}:${normalizeText(schools[key])}`)
            .join('|');
    }

    function getTeacherStatusSnapshot() {
        const preferredTermId = typeof root.getPreferredTeacherTermId === 'function' ? (root.getPreferredTeacherTermId() || '') : '';
        const resolved = typeof root.resolveTeacherHistoryEntry === 'function'
            ? root.resolveTeacherHistoryEntry(preferredTermId)
            : null;
        const localMap = resolved && resolved.map && typeof resolved.map === 'object'
            ? resolved.map
            : (root.TEACHER_MAP || {});
        const localSchoolMap = resolved && resolved.schoolMap && typeof resolved.schoolMap === 'object'
            ? resolved.schoolMap
            : (root.TEACHER_SCHOOL_MAP || {});
        const liveMap = root.TEACHER_MAP && typeof root.TEACHER_MAP === 'object' ? root.TEACHER_MAP : {};
        const liveSchoolMap = root.TEACHER_SCHOOL_MAP && typeof root.TEACHER_SCHOOL_MAP === 'object' ? root.TEACHER_SCHOOL_MAP : {};
        const termId = (resolved && resolved.key) || preferredTermId;
        const loadedTermId = typeof root.readCurrentTeacherTermId === 'function' ? root.readCurrentTeacherTermId() : '';
        const localSignature = api.buildTeacherSignature(localMap, localSchoolMap);
        const liveSignature = api.buildTeacherSignature(liveMap, liveSchoolMap);
        const localCount = Object.keys(localMap || {}).length;
        const liveCount = Object.keys(liveMap || {}).length;
        const termBase = typeof root.getTeacherTermBase === 'function' ? root.getTeacherTermBase : (value) => value;
        const loadedMatches = !!liveCount
            && (!termId || !loadedTermId || termBase(loadedTermId) === termBase(termId))
            && (!localSignature || liveSignature === localSignature);

        return {
            termId,
            loadedTermId,
            count: localCount,
            loadedCount: liveCount,
            signature: localSignature || liveSignature,
            loadedSignature: liveSignature,
            loadedMatches
        };
    }

    function rememberDataManagerSyncSnapshot(_manager, sourceLabel = 'save-and-sync') {
        const teacherSnapshot = api.getTeacherStatusSnapshot();
        return api.writeDataManagerSyncState({
            paramsSignature: api.getParamsSyncSignature(),
            targetsSignature: api.getTargetsSyncSignature(),
            teacherSignature: teacherSnapshot.signature || '',
            teacherTermId: teacherSnapshot.termId || '',
            teacherCount: teacherSnapshot.count || 0,
            lastCloudSyncAt: Date.now(),
            lastSyncSource: sourceLabel,
            pendingCloudSync: false,
            pendingSyncSource: '',
            lastCloudError: ''
        });
    }

    function getDataManagerStatusModel() {
        const indicator = api.getCurrentIndicatorValues();
        const syncState = api.readDataManagerSyncState();
        const teacherKey = [
            normalizeText(root.CURRENT_TEACHER_TERM_ID || (root.getPreferredTeacherTermId && root.getPreferredTeacherTermId()) || ''),
            root.TEACHER_MAP ? Object.keys(root.TEACHER_MAP).length : 0,
            root.TEACHER_SCHOOL_MAP ? Object.keys(root.TEACHER_SCHOOL_MAP).length : 0
        ].join('|');
        const cacheKey = JSON.stringify({
            rawVersion: root.__RAW_DATA_VERSION || 0,
            cohortId: root.CURRENT_COHORT_ID || '',
            examId: root.CURRENT_EXAM_ID || '',
            ind1: indicator.ind1 || '',
            ind2: indicator.ind2 || '',
            highSchoolLine: indicator.highSchoolLine || '',
            targetsVersion: root.__TARGETS_VERSION || 0,
            targetRefSize: root.TARGETS ? Object.keys(root.TARGETS).length : 0,
            teacherKey,
            syncState
        });
        const cached = root.__DATA_MANAGER_STATUS_MODEL_CACHE__;
        if (cached && cached.key === cacheKey && Date.now() - Number(cached.at || 0) < DATA_MANAGER_STATUS_MODEL_CACHE_MS) {
            return cached.model;
        }
        const paramsNeeded = typeof root.isIndicatorPromptAllowed === 'function' ? !!root.isIndicatorPromptAllowed() : true;
        const paramsFilledCount = [indicator.ind1, indicator.ind2].filter(Boolean).length;
        const paramsSignature = api.getParamsSyncSignature();
        const targets = typeof root.ensureNormalizedTargets === 'function'
            ? (root.ensureNormalizedTargets() || {})
            : (root.TARGETS || {});
        const targetNames = Object.keys(targets).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'));
        const targetsSignature = api.getTargetsSyncSignature();
        const teacherSnapshot = api.getTeacherStatusSnapshot();
        const hasBaseline = !!(syncState.paramsSignature || syncState.targetsSignature || syncState.lastCloudSyncAt);
        const pendingCloudSync = !!syncState.pendingCloudSync;
        const pendingSyncSource = normalizeText(syncState.pendingSyncSource);
        const lastCloudError = normalizeText(syncState.lastCloudError);
        const lastQueuedSyncAt = Number(syncState.lastQueuedSyncAt || 0);

        let paramsState = 'missing';
        if (!paramsNeeded) paramsState = 'not_needed';
        else if (paramsFilledCount === 0) paramsState = 'missing';
        else if (paramsFilledCount < 2) paramsState = 'partial';
        else if (!hasBaseline) paramsState = 'unknown';
        else paramsState = paramsSignature === syncState.paramsSignature ? 'synced' : 'pending';

        let targetsState = 'missing';
        if (targetNames.length === 0) targetsState = 'missing';
        else if (!hasBaseline) targetsState = 'unknown';
        else targetsState = targetsSignature === syncState.targetsSignature ? 'synced' : 'pending';

        const teacherBaselineTerm = normalizeText(syncState.teacherTermId);
        const teacherBaselineSignature = normalizeText(syncState.teacherSignature);
        const teacherHasBaseline = !!teacherBaselineSignature && !!teacherBaselineTerm;
        const teacherMatchesBaseline = !!teacherSnapshot.signature
            && teacherSnapshot.signature === teacherBaselineSignature
            && !!teacherSnapshot.termId
            && teacherBaselineTerm === teacherSnapshot.termId;

        let teachersState = 'missing';
        if (teacherSnapshot.count === 0) teachersState = 'missing';
        else if (!teacherHasBaseline) teachersState = 'unknown';
        else if (!teacherMatchesBaseline) teachersState = 'pending';
        else teachersState = teacherSnapshot.loadedMatches ? 'synced' : 'synced_unloaded';

        const model = {
            paramsNeeded,
            indicator,
            paramsFilledCount,
            paramsState,
            targetNames,
            targetCount: targetNames.length,
            targetsState,
            teacherSnapshot,
            teachersState,
            syncState,
            hasBaseline,
            pendingCloudSync,
            lastCloudError,
            lastSyncText: pendingCloudSync && lastQueuedSyncAt
                ? `后台同步中 · ${new Date(lastQueuedSyncAt).toLocaleString('zh-CN')}`
                : (syncState.lastCloudSyncAt
                    ? new Date(syncState.lastCloudSyncAt).toLocaleString('zh-CN')
                    : '尚未记录'),
            lastSyncSource: pendingCloudSync
                ? (pendingSyncSource || '本地已暂存，正在后台同步云端')
                : (lastCloudError
                    ? `最近失败：${lastCloudError}`
                    : (syncState.lastSyncSource || ''))
        };
        root.__DATA_MANAGER_STATUS_MODEL_CACHE__ = {
            key: cacheKey,
            at: Date.now(),
            model
        };
        return model;
    }

    function renderDataManagerStatus() {
        const doc = getDocument();
        const summaryEl = doc ? doc.getElementById('dm-status-overview-summary') : null;
        const tipEl = doc ? doc.getElementById('dm-status-overview-tip') : null;
        const paramsEl = doc ? doc.getElementById('dm-params-status') : null;
        const targetsEl = doc ? doc.getElementById('dm-targets-status') : null;
        if (!summaryEl && !tipEl && !paramsEl && !targetsEl) return;

        const model = api.getDataManagerStatusModel();
        const toneMap = {
            success: { bg: '#dcfce7', color: '#166534', border: '#86efac' },
            warning: { bg: '#fff7ed', color: '#9a3412', border: '#fdba74' },
            error: { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' },
            info: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
            neutral: { bg: '#f8fafc', color: '#475569', border: '#cbd5e1' }
        };
        const pill = (text, tone = 'neutral') => {
            const theme = toneMap[tone] || toneMap.neutral;
            return `<span style="display:inline-flex; align-items:center; gap:6px; padding:4px 10px; border-radius:999px; border:1px solid ${theme.border}; background:${theme.bg}; color:${theme.color}; font-size:12px; font-weight:700;">${text}</span>`;
        };

        const paramsMetaMap = {
            not_needed: { tone: 'neutral', title: '当前考试无需参数', detail: '当前场景不会使用优生线/普高线参与指标计算。' },
            missing: { tone: 'error', title: '未填写', detail: '请先填写优生线和普高线名次。' },
            partial: { tone: 'warning', title: `已填写 ${model.paramsFilledCount}/2`, detail: '还有参数未填完，暂时不建议开始计算。' },
            unknown: { tone: 'info', title: '已填写，建议同步确认', detail: '已检测到参数，但还没有同步基线记录，建议点一次右上角保存。' },
            pending: { tone: 'warning', title: '已暂存，待同步', detail: '参数已经变化，请在完成修改后点右上角统一同步。' },
            synced: { tone: 'success', title: '已同步', detail: '当前参数和最近一次云端同步记录一致。' }
        };
        const targetsMetaMap = {
            missing: { tone: 'error', title: '未导入', detail: '只保存参数不会自动生成目标人数，请在本页导入目标人数 Excel。' },
            unknown: { tone: 'info', title: '已导入，建议同步确认', detail: `已检测到 ${model.targetCount} 所学校的目标人数，建议点一次右上角保存建立同步记录。` },
            pending: { tone: 'warning', title: '已导入，待同步', detail: `已导入 ${model.targetCount} 所学校的目标人数，但还有修改未同步。` },
            synced: { tone: 'success', title: '已导入并同步', detail: `已导入 ${model.targetCount} 所学校的目标人数，并已和最近一次云端同步保持一致。` }
        };
        const teacherTermText = model.teacherSnapshot.termId
            || (typeof root.getPreferredTeacherTermId === 'function' ? root.getPreferredTeacherTermId() : '')
            || '未选择学期';
        const teachersMetaMap = {
            missing: { tone: 'error', title: '未导入', detail: `当前学期 ${teacherTermText} 还没有任课表。请在“教师任课”导入 Excel 或从云端拉取。` },
            unknown: { tone: 'info', title: '已导入，建议同步确认', detail: `当前学期 ${teacherTermText} 已识别 ${model.teacherSnapshot.count} 条任课记录，建议同步一次建立基线。` },
            pending: { tone: 'warning', title: '已导入，待同步', detail: `当前学期 ${teacherTermText} 的任课表有修改，尚未和最近一次云端同步保持一致。` },
            synced_unloaded: { tone: 'warning', title: '已同步，未加载', detail: `当前学期 ${teacherTermText} 的任课表已同步，但还没恢复到当前分析页面。点击“去同步任课表”即可恢复。` },
            synced: { tone: 'success', title: '已同步并加载', detail: `当前学期 ${teacherTermText} 的任课表已同步，当前页面正在使用这份任课表。` }
        };

        const paramsMeta = paramsMetaMap[model.paramsState] || paramsMetaMap.missing;
        const targetsMeta = targetsMetaMap[model.targetsState] || targetsMetaMap.missing;
        const teachersMeta = teachersMetaMap[model.teachersState] || teachersMetaMap.missing;

        let tipTone = 'success';
        let tipText = '当前参数、目标人数和任课表状态已经清晰，可以直接回到分析页面使用。';
        if (model.pendingCloudSync) {
            tipTone = 'info';
            tipText = '修改已经先写入本地，系统正在后台同步云端。你可以继续操作，不需要原地等待。';
        } else if (model.teachersState === 'missing') {
            tipTone = 'warning';
            tipText = '教师分析页依赖“当前学期任课表”。先在“教师任课”导入或拉取本学期任课表，再回到教师画像。';
        } else if (model.teachersState === 'synced_unloaded') {
            tipTone = 'info';
            tipText = '任课表其实已经同步成功，只是还没恢复到当前页面。点击“去同步任课表”或重新进入“教师任课”即可自动恢复。';
        } else if (model.targetsState === 'missing' && model.paramsState !== 'missing' && model.paramsState !== 'partial') {
            tipTone = 'warning';
            tipText = '你已经设置了年级指标参数，但【目标人数】仍未导入。只保存参数不会自动生成目标人数，请切换到“目标人数管理”导入 Excel。';
        } else if (model.paramsNeeded && (model.paramsState === 'missing' || model.paramsState === 'partial')) {
            tipTone = 'warning';
            tipText = '请先补齐优生线和普高线名次，再进行统一保存和指标相关计算。';
        } else if (
            model.paramsState === 'unknown' || model.paramsState === 'pending'
            || model.targetsState === 'unknown' || model.targetsState === 'pending'
            || model.teachersState === 'unknown' || model.teachersState === 'pending'
        ) {
            tipTone = 'info';
            tipText = '当前存在尚未确认同步的内容。建议完成修改后点右上角【保存修改并同步云端】。';
        }

        if (summaryEl) {
            const summaryHtml = `
                <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:stretch;">
                    <div style="flex:1; min-width:220px; background:#ffffff; border:1px solid #dbeafe; border-radius:10px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
                            <strong style="color:#0f172a;">年级指标参数</strong>
                            ${pill(paramsMeta.title, paramsMeta.tone)}
                        </div>
                        <div style="margin-top:8px; font-size:12px; color:#475569;">优生线：${model.indicator.ind1 || '未填写'} | 普高线：${model.indicator.ind2 || '未填写'}</div>
                        <div style="margin-top:6px; font-size:12px; color:#64748b;">${paramsMeta.detail}</div>
                    </div>
                    <div style="flex:1; min-width:220px; background:#ffffff; border:1px solid #dcfce7; border-radius:10px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
                            <strong style="color:#0f172a;">目标人数</strong>
                            ${pill(targetsMeta.title, targetsMeta.tone)}
                        </div>
                        <div style="margin-top:8px; font-size:12px; color:#475569;">已识别学校：${model.targetCount} 所</div>
                        <div style="margin-top:6px; font-size:12px; color:#64748b;">${targetsMeta.detail}</div>
                    </div>
                    <div style="flex:1; min-width:220px; background:#ffffff; border:1px solid #fde68a; border-radius:10px; padding:12px;">
                        <div style="display:flex; justify-content:space-between; gap:10px; align-items:center;">
                            <strong style="color:#0f172a;">当前学期任课表</strong>
                            ${pill(teachersMeta.title, teachersMeta.tone)}
                        </div>
                        <div style="margin-top:8px; font-size:12px; color:#475569;">学期：${teacherTermText}</div>
                        <div style="margin-top:4px; font-size:12px; color:#475569;">记录：${model.teacherSnapshot.count || 0} 条，本页已加载：${model.teacherSnapshot.loadedCount || 0} 条</div>
                        <div style="margin-top:6px; font-size:12px; color:#64748b;">${teachersMeta.detail}</div>
                    </div>
                    <div style="flex:1; min-width:220px; background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:12px;">
                        <strong style="color:#0f172a;">最近云端同步</strong>
                        <div style="margin-top:8px; font-size:13px; color:#0f172a; font-weight:700;">${model.lastSyncText}</div>
                        <div style="margin-top:6px; font-size:12px; color:#64748b;">${model.lastSyncSource || '尚未建立同步记录，建议完成修改后保存一次。'}</div>
                    </div>
                </div>
            `;
            if (summaryEl.dataset.dmStatusSig !== summaryHtml) {
                summaryEl.innerHTML = summaryHtml;
                summaryEl.dataset.dmStatusSig = summaryHtml;
            }
        }

        if (tipEl) {
            const tipTheme = toneMap[tipTone] || toneMap.info;
            const tipHtml = `
                <div style="padding:10px 12px; border-radius:10px; border:1px solid ${tipTheme.border}; background:${tipTheme.bg}; color:${tipTheme.color}; font-size:12px; line-height:1.8;">
                    <strong>当前提醒：</strong>${tipText}
                </div>
            `;
            if (tipEl.dataset.dmStatusSig !== tipHtml) {
                tipEl.innerHTML = tipHtml;
                tipEl.dataset.dmStatusSig = tipHtml;
            }
        }

        if (paramsEl) {
            const paramsHtml = `
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap;">
                    <div><strong>参数状态：</strong>${paramsMeta.title}</div>
                    ${pill(paramsMeta.title, paramsMeta.tone)}
                </div>
                <div style="margin-top:6px; line-height:1.8;">${paramsMeta.detail}</div>
            `;
            if (paramsEl.dataset.dmStatusSig !== paramsHtml) {
                paramsEl.innerHTML = paramsHtml;
                paramsEl.dataset.dmStatusSig = paramsHtml;
            }
        }

        if (targetsEl) {
            const targetsHtml = `
                <div style="display:flex; justify-content:space-between; gap:10px; align-items:center; flex-wrap:wrap;">
                    <div><strong>目标人数状态：</strong>${targetsMeta.title}</div>
                    ${pill(targetsMeta.title, targetsMeta.tone)}
                </div>
                <div style="margin-top:6px; line-height:1.8;">${targetsMeta.detail}</div>
            `;
            if (targetsEl.dataset.dmStatusSig !== targetsHtml) {
                targetsEl.innerHTML = targetsHtml;
                targetsEl.dataset.dmStatusSig = targetsHtml;
            }
        }
    }

    const api = {
        renderCloudBackups,
        renderCloudTableState,
        retryCloudBackups,
        toggleCloudSelection,
        toggleCloudSelectAll,
        updateCloudSelectionUI,
        deleteSelectedCloudBackups,
        getCloudBackupRow,
        buildCloudArchiveExportPayload,
        getCloudArchiveDownloadName,
        downloadCloudBackup,
        triggerCloudArchiveUpload,
        parseCloudArchiveImportRecords,
        handleCloudArchiveUpload,
        loadCloudBackup,
        deleteCloudBackup,
        deleteCurrentExamCloudBackup,
        loadCloudSnapshots,
        deleteCloudSnapshot,
        dbGetLocal,
        dbSave,
        dbGet,
        dbSyncFromCloud,
        dbClear,
        getDataManagerSyncStorageKey,
        getDataManagerSyncScope,
        readDataManagerSyncState,
        writeDataManagerSyncState,
        getCurrentIndicatorValues,
        getParamsSyncSignature,
        getTargetsSyncSignature,
        buildTeacherSignature,
        getTeacherStatusSnapshot,
        rememberDataManagerSyncSnapshot,
        getDataManagerStatusModel,
        renderDataManagerStatus
    };

    return api;
});
