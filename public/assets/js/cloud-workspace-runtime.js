(() => {
    if (typeof window === 'undefined') return;
    const CloudManager = window.CloudManager;
    const deps = window.CloudWorkspaceRuntimeDeps;
    const WorkspaceState = window.WorkspaceState || null;
    if (!CloudManager || !deps || window.__CLOUD_WORKSPACE_RUNTIME_PATCHED__) return;

    const {
        CLOUD_TABLE,
        AUTO_COHORT_SYNC_COOLDOWN_MS,
        safeToast,
        safeLoading,
        setCloudStatus,
        normalizeCohortId,
        extractCohortIdFromKey,
        getWorkspaceSnapshotKey,
        getCohortSyncCacheKey,
        countCachedCohortExams,
        parsePayload,
        packPayload,
        supplementIndicatorPayload,
        seedCurrentExamToCohortDb,
        deriveExamLabel,
        upsertCloudExamSnapshot,
        hydrateBundledCohortExams,
        resolveCloudSnapshotKey,
        refreshCompareSelectors,
        getCurrentUserRole,
        isIgnoredExamKey
    } = deps;

    function normalizeWorkspacePayload(payload) {
        if (typeof window.normalizeWorkspacePayload === 'function') {
            return window.normalizeWorkspacePayload(payload);
        }
        return payload;
    }

    function getCurrentProjectKey() {
        if (WorkspaceState && typeof WorkspaceState.getCurrentProjectKey === 'function') {
            return String(WorkspaceState.getCurrentProjectKey() || '').trim();
        }
        return String(localStorage.getItem('CURRENT_PROJECT_KEY') || window.CURRENT_PROJECT_KEY || '').trim();
    }

    function getCurrentCohortId() {
        if (WorkspaceState && typeof WorkspaceState.getCurrentCohortId === 'function') {
            return normalizeCohortId(WorkspaceState.getCurrentCohortId());
        }
        return normalizeCohortId(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID'));
    }

    function syncWorkspaceState(patch = {}) {
        if (WorkspaceState && typeof WorkspaceState.syncWorkspaceState === 'function') {
            return WorkspaceState.syncWorkspaceState(patch);
        }
        const next = patch && typeof patch === 'object' ? patch : {};
        if (Object.prototype.hasOwnProperty.call(next, 'currentProjectKey')) {
            const key = String(next.currentProjectKey || '').trim();
            if (key) {
                localStorage.setItem('CURRENT_PROJECT_KEY', key);
                window.CURRENT_PROJECT_KEY = key;
            }
        }
        if (Object.prototype.hasOwnProperty.call(next, 'currentExamId')) {
            const examId = String(next.currentExamId || '').trim();
            if (examId) {
                localStorage.setItem('CURRENT_EXAM_ID', examId);
                window.CURRENT_EXAM_ID = examId;
            }
        }
        return next;
    }

    const WORKSPACE_SYNC_META_PREFIX = 'CLOUD_WORKSPACE_META_V2::';
    const WORKSPACE_SYNC_QUEUE_KEY = 'CLOUD_WORKSPACE_SYNC_QUEUE_V2';

    function hashText(text) {
        const raw = String(text || '');
        let hash = 2166136261;
        for (let i = 0; i < raw.length; i++) {
            hash ^= raw.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return `ws_${(hash >>> 0).toString(16)}`;
    }

    function getWorkspaceMetaStorageKey(key) {
        return `${WORKSPACE_SYNC_META_PREFIX}${encodeURIComponent(String(key || '').trim())}`;
    }

    function readStoredJson(key, fallbackValue) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? (JSON.parse(raw) || fallbackValue) : fallbackValue;
        } catch (_) {
            return fallbackValue;
        }
    }

    function writeStoredJson(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (_) { }
        return value;
    }

    function readWorkspaceSyncMeta(key) {
        return readStoredJson(getWorkspaceMetaStorageKey(key), {});
    }

    function writeWorkspaceSyncMeta(key, patch = {}) {
        const storageKey = getWorkspaceMetaStorageKey(key);
        const next = {
            ...(readWorkspaceSyncMeta(key) || {}),
            ...(patch && typeof patch === 'object' ? patch : {})
        };
        writeStoredJson(storageKey, next);
        return next;
    }

    function readWorkspaceSyncQueue() {
        return readStoredJson(WORKSPACE_SYNC_QUEUE_KEY, {});
    }

    function writeWorkspaceSyncQueue(queue) {
        return writeStoredJson(WORKSPACE_SYNC_QUEUE_KEY, queue && typeof queue === 'object' ? queue : {});
    }

    function dispatchWorkspaceSyncEvent(stage, detail = {}) {
        if (typeof window.CustomEvent !== 'function') return;
        window.dispatchEvent(new CustomEvent('cloud-sync-state', {
            detail: {
                stage,
                ...(detail && typeof detail === 'object' ? detail : {})
            }
        }));
    }

    async function readCachedWorkspaceSnapshot(key) {
        if (!(window.idbKeyval && typeof window.idbKeyval.get === 'function')) return null;
        try {
            const cached = await window.idbKeyval.get(`cache_${key}`);
            return cached && typeof cached === 'object' ? cached : null;
        } catch (error) {
            console.warn('[CloudSync] read cache failed:', error);
            return null;
        }
    }

    async function writeCachedWorkspaceSnapshot(key, payload) {
        if (!(window.idbKeyval && typeof window.idbKeyval.set === 'function')) return false;
        try {
            await window.idbKeyval.set(`cache_${key}`, payload);
            return true;
        } catch (error) {
            console.warn('[CloudSync] write cache failed:', error);
            return false;
        }
    }

    async function applyCachedWorkspaceSnapshot(key, payload, updatedAt = '') {
        if (!payload || typeof payload !== 'object') return false;
        syncWorkspaceState({
            currentProjectKey: key,
            currentExamId: payload?.CURRENT_EXAM_ID || ''
        });
        seedCurrentExamToCohortDb(payload, key, updatedAt);
        if (typeof applySnapshotPayload === 'function') applySnapshotPayload(payload);
        await refreshCompareSelectors();
        return true;
    }

    async function fetchWorkspaceSnapshotMeta(key) {
        const { data, error } = await window.sbClient
            .from(CLOUD_TABLE)
            .select('updated_at')
            .eq('key', key)
            .maybeSingle();
        if (error) throw error;
        return data || null;
    }

    async function fetchWorkspaceSnapshotRow(key) {
        const { data, error } = await window.sbClient
            .from(CLOUD_TABLE)
            .select('content,updated_at')
            .eq('key', key)
            .maybeSingle();
        if (error) throw error;
        return data || null;
    }

    function queueWorkspaceSyncJob(key, job = {}) {
        const queue = readWorkspaceSyncQueue();
        queue[key] = {
            ...(queue[key] || {}),
            key,
            ...(job && typeof job === 'object' ? job : {})
        };
        writeWorkspaceSyncQueue(queue);
        dispatchWorkspaceSyncEvent('queued', queue[key]);
        return queue[key];
    }

    function scheduleBackgroundQueueFlush(manager) {
        setTimeout(() => {
            manager.flushWorkspaceSyncQueue().catch((error) => {
                console.warn('[CloudSync] background flush failed:', error);
            });
        }, 0);
    }

    async function fetchAndApplyWorkspaceSnapshot(manager, key, row) {
        const snapshotRow = row && typeof row === 'object' ? row : await fetchWorkspaceSnapshotRow(key);
        if (!snapshotRow || !snapshotRow.content) return false;

        let payload = parsePayload(snapshotRow.content);
        payload = normalizeWorkspacePayload(payload);
        payload = await supplementIndicatorPayload(key, payload);

        seedCurrentExamToCohortDb(payload, key, snapshotRow.updated_at || '');
        if (typeof applySnapshotPayload === 'function') applySnapshotPayload(payload);

        const contentHash = hashText(snapshotRow.content);
        const cohortId = normalizeCohortId(payload?.CURRENT_COHORT_ID || getCurrentCohortId());

        await writeCachedWorkspaceSnapshot(key, payload);
        writeWorkspaceSyncMeta(key, {
            contentHash,
            lastUploadedHash: contentHash,
            remoteUpdatedAt: snapshotRow.updated_at || '',
            lastSyncedAt: snapshotRow.updated_at || '',
            pendingCloudSync: false,
            pendingSyncSource: '',
            lastCloudError: '',
            currentProjectKey: key,
            currentExamId: payload?.CURRENT_EXAM_ID || ''
        });

        syncWorkspaceState({
            currentProjectKey: key,
            currentExamId: payload?.CURRENT_EXAM_ID || ''
        });
        localStorage.setItem('CLOUD_SYNC_AT', snapshotRow.updated_at || new Date().toISOString());

        await refreshCompareSelectors();
        if (cohortId && typeof manager.fetchCohortExamsToLocal === 'function') {
            manager.fetchCohortExamsToLocal(cohortId, { background: true }).catch((syncError) => {
                console.warn('[CloudExams] background sync failed:', syncError);
            });
        }
        return true;
    }

    Object.assign(CloudManager, {
        save: async function (options = {}) {
            if (!(await this.ensureClientReady())) return false;
            setCloudStatus('syncing', '保存中');

            const role = getCurrentUserRole();
            if (!['admin', 'director', 'grade_director'].includes(role)) {
                safeToast('权限不足', 'warning');
                return false;
            }

            const mode = options?.mode === 'exam' ? 'exam' : 'workspace';
            const key = mode === 'exam'
                ? this.getKey()
                : (getWorkspaceSnapshotKey() || this.getKey());
            if (!key) {
                alert(mode === 'exam' ? '请先完善考试信息' : '请先选择届别');
                return false;
            }

            safeLoading(true, '正在同步云端数据...');
            try {
                const ind1 = document.getElementById('dm_ind1_input');
                const ind2 = document.getElementById('dm_ind2_input');
                if (typeof window.ensureSupportSysVars === 'function') window.ensureSupportSysVars();
                if (typeof window.setIndicatorState === 'function') {
                    const currentIndicator = typeof window.readIndicatorState === 'function'
                        ? window.readIndicatorState()
                        : { ind1: '', ind2: '' };
                    window.setIndicatorState({
                        ind1: ind1 ? ind1.value : currentIndicator.ind1,
                        ind2: ind2 ? ind2.value : currentIndicator.ind2
                    });
                }
                if (typeof window.setTargetsState === 'function') {
                    window.setTargetsState((typeof ensureNormalizedTargets === 'function') ? ensureNormalizedTargets() : (window.TARGETS || {}));
                }
                if (typeof window.setSchoolAliasState === 'function') {
                    window.setSchoolAliasState((typeof ensureSchoolAliasStore === 'function') ? ensureSchoolAliasStore() : (typeof window.readSchoolAliasState === 'function' ? window.readSchoolAliasState() : []));
                }

                const payload = typeof getCurrentSnapshotPayload === 'function' ? getCurrentSnapshotPayload() : {};
                if (mode === 'workspace') normalizeWorkspacePayload(payload);
                const content = packPayload(payload);

                const { error } = await window.sbClient.from(CLOUD_TABLE).upsert({
                    key,
                    content,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
                if (error) throw error;

                if (mode === 'workspace') {
                    syncWorkspaceState({
                        currentProjectKey: key,
                        currentExamId: payload?.CURRENT_EXAM_ID || ''
                    });
                }
                localStorage.setItem('CLOUD_SYNC_AT', new Date().toISOString());
                if (window.idbKeyval) await idbKeyval.set(`cache_${key}`, payload);
                if (typeof logAction === 'function') logAction('云端同步', `全量数据已同步：${key}`);
                if (typeof updateStatusPanel === 'function') updateStatusPanel();
                safeToast('云端同步成功', 'success');
                setCloudStatus('success', '已保存');
                return true;
            } catch (e) {
                console.error('Cloud save error:', e);
                alert(`同步失败: ${e.message || e}`);
                setCloudStatus('error', e?.message ? String(e.message).slice(0, 24) : '保存失败');
                return false;
            } finally {
                safeLoading(false);
            }
        },

        load: async function () {
            if (!(await this.ensureClientReady())) return false;
            setCloudStatus('syncing', '拉取中');

            let key = getWorkspaceSnapshotKey() || getCurrentProjectKey() || this.getKey();
            try {
                key = await resolveCloudSnapshotKey(key);
                if (key) syncWorkspaceState({ currentProjectKey: key });
            } catch (e) {
                console.error('Cloud load key lookup error:', e);
                setCloudStatus('error', e?.message ? String(e.message).slice(0, 24) : '加载失败');
                return false;
            }

            if (!key) return false;

            safeToast('正在检查云端数据...', 'info');
            try {
                const { data, error } = await window.sbClient
                    .from(CLOUD_TABLE)
                    .select('content,updated_at')
                    .eq('key', key)
                    .maybeSingle();
                if (error) throw error;
                if (!data) return false;

                let payload = parsePayload(data.content);
                payload = normalizeWorkspacePayload(payload);
                payload = await supplementIndicatorPayload(key, payload);
                seedCurrentExamToCohortDb(payload, key, data.updated_at);
                if (typeof applySnapshotPayload === 'function') applySnapshotPayload(payload);
                const cohortId = normalizeCohortId(payload?.CURRENT_COHORT_ID || getCurrentCohortId());
                await refreshCompareSelectors();
                if (cohortId && typeof this.fetchCohortExamsToLocal === 'function') {
                    this.fetchCohortExamsToLocal(cohortId, { background: true }).catch((syncError) => {
                        console.warn('[CloudExams] background sync failed:', syncError);
                    });
                }
                if (typeof logAction === 'function') logAction('云端加载', `已加载全量数据：${key}`);
                safeToast('数据已同步到本地', 'success');
                setCloudStatus('success', '已拉取');
                return true;
            } catch (e) {
                console.error('Cloud load error:', e);
                safeToast('加载失败', 'error');
                setCloudStatus('error', e?.message ? String(e.message).slice(0, 24) : '拉取失败');
                return false;
            }
        },

        fetchCohortExamsToLocal: async function (cohortId, options = {}) {
            const cid = normalizeCohortId(cohortId || getCurrentCohortId());
            if (!cid) return { success: false, message: '无法确定届别' };
            const hasSessionUser = !!(window.AuthState && typeof window.AuthState.hasActiveSession === 'function'
                ? window.AuthState.hasActiveSession(window.Auth && Auth.currentUser)
                : (window.Auth && Auth.currentUser));
            if (!hasSessionUser && !options.force) {
                return { success: false, skipped: true, message: '未登录，跳过自动拉取' };
            }
            if (!this._cohortExamSyncTasks) this._cohortExamSyncTasks = {};
            if (this._cohortExamSyncTasks[cid]) return this._cohortExamSyncTasks[cid];

            this._cohortExamSyncTasks[cid] = (async () => {
                if (!(await this.ensureClientReady())) return { success: false, message: '云端未连接' };
                setCloudStatus('syncing', '拉取考试');
                if (typeof CohortDB === 'undefined' || typeof CohortDB.ensure !== 'function') {
                    return { success: false, message: 'CohortDB 未初始化' };
                }

                const db = CohortDB.ensure();
                db.exams = db.exams || {};
                const cacheKey = getCohortSyncCacheKey(cid);
                const forceSync = Boolean(options.force);
                const minCount = Math.max(1, Number(options.minCount || 2));
                const lastSyncAt = Number(localStorage.getItem(cacheKey) || 0);
                const localExamCount = countCachedCohortExams(db, cid);

                if (!forceSync && localExamCount >= minCount && lastSyncAt && (Date.now() - lastSyncAt) < AUTO_COHORT_SYNC_COOLDOWN_MS) {
                    await refreshCompareSelectors();
                    setCloudStatus('success', '使用缓存');
                    return { success: true, count: localExamCount, updated: 0, cached: true };
                }

                try {
                    const chunkSize = 10;
                    const { data: metaRows, error: metaErr } = await window.sbClient
                        .from(CLOUD_TABLE)
                        .select('key, updated_at')
                        .like('key', `${cid}%`)
                        .order('updated_at', { ascending: true });
                    if (metaErr) throw metaErr;

                    const candidates = (metaRows || []).filter(row => {
                        if (isIgnoredExamKey(row.key)) return false;
                        if (extractCohortIdFromKey(row.key) !== cid) return false;
                        return true;
                    });

                    const keysToFetch = [];
                    for (const row of candidates) {
                        const remoteTs = new Date(row.updated_at).getTime() || 0;
                        const localTs = db.exams[row.key] ? Math.max(new Date(db.exams[row.key].updatedAt || 0).getTime(), Number(db.exams[row.key].createdAt || 0)) : 0;
                        if (!db.exams[row.key] || remoteTs > localTs + 1000) {
                            keysToFetch.push(row.key);
                        }
                    }

                    if (keysToFetch.length === 0 && localExamCount < minCount && candidates.length > 0) {
                        keysToFetch.push(candidates[candidates.length - 1].key);
                    }

                    if (keysToFetch.length === 0) {
                        localStorage.setItem(cacheKey, String(Date.now()));
                        await refreshCompareSelectors();
                        setCloudStatus('success', '已最新');
                        return { success: true, count: candidates.length, updated: 0 };
                    }

                    const rowMap = new Map();
                    for (let i = 0; i < keysToFetch.length; i += chunkSize) {
                        const chunk = keysToFetch.slice(i, i + chunkSize);
                        const { data: chunkRows, error: chunkErr } = await window.sbClient
                            .from(CLOUD_TABLE)
                            .select('key, content, updated_at')
                            .in('key', chunk);
                        if (chunkErr) throw chunkErr;
                        (chunkRows || []).forEach(r => rowMap.set(r.key, r));
                    }

                    let loadedCount = 0;
                    for (const key of keysToFetch) {
                        const row = rowMap.get(key);
                        if (!row) continue;
                        try {
                            const payload = parsePayload(row.content);
                            if (!payload) continue;
                            loadedCount += upsertCloudExamSnapshot(db, row.key, payload, row.updated_at, deriveExamLabel(row.key));
                            loadedCount += hydrateBundledCohortExams(db, payload, row.updated_at);
                        } catch (rowErr) {
                            console.warn('[CloudExams] parse row failed:', rowErr);
                        }
                    }

                    window.COHORT_DB = db;
                    localStorage.setItem(cacheKey, String(Date.now()));
                    await refreshCompareSelectors();

                    if (loadedCount > 0) safeToast(`已从云端加载 ${loadedCount} 期历史考试`, 'success');
                    setCloudStatus('success', loadedCount > 0 ? `更新${loadedCount}期` : '已最新');
                    return { success: true, count: candidates.length, updated: loadedCount };
                } catch (e) {
                    console.error('[CloudExams] failed:', e);
                    setCloudStatus('error', '考试拉取失败');
                    return { success: false, message: e.message || String(e) };
                }
            })().finally(() => {
                delete this._cohortExamSyncTasks[cid];
            });

            return this._cohortExamSyncTasks[cid];
        },

        fetchAllCohortExams: async function (options = {}) {
            const hasSessionUser = !!(window.AuthState && typeof window.AuthState.hasActiveSession === 'function'
                ? window.AuthState.hasActiveSession(window.Auth && Auth.currentUser)
                : (window.Auth && Auth.currentUser));
            if (!hasSessionUser && !options.force) {
                return { success: false, skipped: true, message: '未登录，跳过自动拉取' };
            }
            const cid = normalizeCohortId(getCurrentCohortId());
            if (!cid) return;
            return this.fetchCohortExamsToLocal(cid, options);
        }
    });

    CloudManager.save = async function (options = {}) {
        const opts = options && typeof options === 'object' ? { ...options } : {};
        const background = Boolean(opts.background);
        const sourceLabel = String(opts.sourceLabel || '').trim() || (opts.mode === 'exam' ? 'exam-save' : 'workspace-save');

        const role = getCurrentUserRole();
        if (!['admin', 'director', 'grade_director'].includes(role)) {
            safeToast('权限不足', 'warning');
            return false;
        }

        const mode = opts.mode === 'exam' ? 'exam' : 'workspace';
        const key = mode === 'exam'
            ? this.getKey()
            : (getWorkspaceSnapshotKey() || this.getKey());
        if (!key) {
            alert(mode === 'exam' ? '请先完善考试信息' : '请先选择届别');
            return false;
        }

        try {
            setCloudStatus('syncing', background ? '后台同步' : '保存中');

            const ind1 = document.getElementById('dm_ind1_input');
            const ind2 = document.getElementById('dm_ind2_input');
            if (typeof window.ensureSupportSysVars === 'function') window.ensureSupportSysVars();
            if (typeof window.setIndicatorState === 'function') {
                const currentIndicator = typeof window.readIndicatorState === 'function'
                    ? window.readIndicatorState()
                    : { ind1: '', ind2: '' };
                window.setIndicatorState({
                    ind1: ind1 ? ind1.value : currentIndicator.ind1,
                    ind2: ind2 ? ind2.value : currentIndicator.ind2
                });
            }
            if (typeof window.setTargetsState === 'function') {
                window.setTargetsState((typeof ensureNormalizedTargets === 'function') ? ensureNormalizedTargets() : (window.TARGETS || {}));
            }
            if (typeof window.setSchoolAliasState === 'function') {
                window.setSchoolAliasState((typeof ensureSchoolAliasStore === 'function')
                    ? ensureSchoolAliasStore()
                    : (typeof window.readSchoolAliasState === 'function' ? window.readSchoolAliasState() : []));
            }

            const payload = typeof getCurrentSnapshotPayload === 'function' ? getCurrentSnapshotPayload() : {};
            if (mode === 'workspace') normalizeWorkspacePayload(payload);

            const content = packPayload(payload);
            const contentHash = hashText(content);
            const nowIso = new Date().toISOString();
            const currentMeta = readWorkspaceSyncMeta(key);

            await writeCachedWorkspaceSnapshot(key, payload);
            writeWorkspaceSyncMeta(key, {
                contentHash,
                pendingCloudSync: background ? true : Boolean(currentMeta.pendingCloudSync),
                pendingSyncSource: background ? sourceLabel : (currentMeta.pendingSyncSource || ''),
                currentProjectKey: key,
                currentExamId: payload?.CURRENT_EXAM_ID || '',
                lastLocalSaveAt: nowIso
            });

            if (mode === 'workspace') {
                syncWorkspaceState({
                    currentProjectKey: key,
                    currentExamId: payload?.CURRENT_EXAM_ID || ''
                });
            }

            if (!opts.forceUpload && currentMeta.lastUploadedHash && currentMeta.lastUploadedHash === contentHash && !currentMeta.pendingCloudSync) {
                const syncedAt = currentMeta.lastSyncedAt || nowIso;
                writeWorkspaceSyncMeta(key, {
                    pendingCloudSync: false,
                    pendingSyncSource: '',
                    lastCloudError: '',
                    lastSyncedAt: syncedAt
                });
                dispatchWorkspaceSyncEvent('skipped', {
                    key,
                    mode,
                    sourceLabel,
                    syncedAt
                });
                if (typeof updateStatusPanel === 'function') updateStatusPanel();
                setCloudStatus('success', '已同步');
                return true;
            }

            queueWorkspaceSyncJob(key, {
                key,
                mode,
                sourceLabel,
                contentHash,
                queuedAt: nowIso,
                currentExamId: payload?.CURRENT_EXAM_ID || ''
            });

            if (background) {
                if (typeof updateStatusPanel === 'function') updateStatusPanel();
                scheduleBackgroundQueueFlush(this);
                return true;
            }

            const flushOk = await this.flushWorkspaceSyncQueue({ targetKey: key });
            if (!flushOk) {
                const nextMeta = readWorkspaceSyncMeta(key);
                throw new Error(nextMeta.lastCloudError || '云端同步失败');
            }

            if (typeof updateStatusPanel === 'function') updateStatusPanel();
            safeToast('云端同步成功', 'success');
            setCloudStatus('success', '已保存');
            return true;
        } catch (error) {
            console.error('Cloud save error:', error);
            if (!background) {
                alert(`同步失败: ${error?.message || error}`);
            }
            setCloudStatus('error', error?.message ? String(error.message).slice(0, 24) : '保存失败');
            return false;
        }
    };

    CloudManager.flushWorkspaceSyncQueue = async function (options = {}) {
        const opts = options && typeof options === 'object' ? { ...options } : {};
        const targetKey = String(opts.targetKey || '').trim();
        if (this._workspaceSyncFlushTask) return this._workspaceSyncFlushTask;

        this._workspaceSyncFlushTask = (async () => {
            let queue = readWorkspaceSyncQueue();
            const entries = Object.values(queue)
                .filter(item => item && typeof item === 'object' && String(item.key || '').trim())
                .sort((a, b) => String(a.queuedAt || '').localeCompare(String(b.queuedAt || '')));

            if (!entries.length) return !targetKey;
            if (!(await this.ensureClientReady({ silent: true, timeoutMs: 4000 }))) {
                return false;
            }

            let targetOk = !targetKey;
            for (const job of entries) {
                const cacheKey = String(job.key || '').trim();
                if (!cacheKey) continue;

                const payload = await readCachedWorkspaceSnapshot(cacheKey);
                if (!payload) {
                    delete queue[cacheKey];
                    writeWorkspaceSyncQueue(queue);
                    continue;
                }

                const packedContent = packPayload(payload);
                const contentHash = hashText(packedContent);
                const syncedAt = new Date().toISOString();

                try {
                    const { error } = await window.sbClient.from(CLOUD_TABLE).upsert({
                        key: cacheKey,
                        content: packedContent,
                        updated_at: syncedAt
                    }, { onConflict: 'key' });
                    if (error) throw error;

                    delete queue[cacheKey];
                    writeWorkspaceSyncQueue(queue);
                    writeWorkspaceSyncMeta(cacheKey, {
                        contentHash,
                        lastUploadedHash: contentHash,
                        remoteUpdatedAt: syncedAt,
                        lastSyncedAt: syncedAt,
                        lastSyncSource: String(job.sourceLabel || '').trim(),
                        pendingCloudSync: false,
                        pendingSyncSource: '',
                        lastCloudError: '',
                        currentProjectKey: cacheKey,
                        currentExamId: payload?.CURRENT_EXAM_ID || ''
                    });

                    if (job.mode === 'workspace') {
                        syncWorkspaceState({
                            currentProjectKey: cacheKey,
                            currentExamId: payload?.CURRENT_EXAM_ID || ''
                        });
                    }
                    localStorage.setItem('CLOUD_SYNC_AT', syncedAt);
                    if (typeof logAction === 'function') {
                        logAction('云端同步', `全量数据已同步：${cacheKey}`);
                    }
                    if (typeof updateStatusPanel === 'function') updateStatusPanel();
                    setCloudStatus('success', '已保存');
                    dispatchWorkspaceSyncEvent('success', {
                        key: cacheKey,
                        mode: job.mode || 'workspace',
                        sourceLabel: String(job.sourceLabel || '').trim(),
                        syncedAt
                    });
                    if (targetKey && cacheKey === targetKey) targetOk = true;
                } catch (error) {
                    console.error('[CloudSync] queue flush error:', error);
                    const message = error?.message || String(error);
                    writeWorkspaceSyncMeta(cacheKey, {
                        pendingCloudSync: true,
                        pendingSyncSource: String(job.sourceLabel || '').trim(),
                        lastCloudError: message,
                        lastFailedSyncAt: syncedAt
                    });
                    setCloudStatus('error', message ? String(message).slice(0, 24) : '同步失败');
                    dispatchWorkspaceSyncEvent('error', {
                        key: cacheKey,
                        mode: job.mode || 'workspace',
                        sourceLabel: String(job.sourceLabel || '').trim(),
                        message
                    });
                    if (targetKey && cacheKey === targetKey) targetOk = false;
                }
            }

            return targetOk;
        })().finally(() => {
            this._workspaceSyncFlushTask = null;
        });

        return this._workspaceSyncFlushTask;
    };

    CloudManager.load = async function () {
        let requestedKey = getWorkspaceSnapshotKey() || getCurrentProjectKey() || this.getKey();
        let cachedPayload = requestedKey ? await readCachedWorkspaceSnapshot(requestedKey) : null;
        let cachedMeta = requestedKey ? readWorkspaceSyncMeta(requestedKey) : {};
        let appliedCached = false;

        if (requestedKey && cachedPayload) {
            try {
                appliedCached = await applyCachedWorkspaceSnapshot(
                    requestedKey,
                    cachedPayload,
                    cachedMeta.remoteUpdatedAt || cachedMeta.lastSyncedAt || ''
                );
                setCloudStatus('syncing', '本地已就绪');
            } catch (error) {
                console.warn('[CloudLoad] apply cached snapshot failed:', error);
            }
        }

        if (requestedKey && cachedMeta.pendingCloudSync) {
            scheduleBackgroundQueueFlush(this);
            setCloudStatus('success', '本地已就绪');
            return true;
        }

        if (!(await this.ensureClientReady({ silent: appliedCached }))) {
            return appliedCached;
        }

        let key = requestedKey;
        try {
            key = await resolveCloudSnapshotKey(key);
            if (key) syncWorkspaceState({ currentProjectKey: key });
        } catch (error) {
            console.error('Cloud load key lookup error:', error);
            if (appliedCached) {
                setCloudStatus('success', '缓存可用');
                return true;
            }
            setCloudStatus('error', error?.message ? String(error.message).slice(0, 24) : '加载失败');
            return false;
        }

        if (!key) return appliedCached;

        if (key !== requestedKey) {
            requestedKey = key;
            cachedPayload = await readCachedWorkspaceSnapshot(key);
            cachedMeta = readWorkspaceSyncMeta(key);
            if (!appliedCached && cachedPayload) {
                try {
                    appliedCached = await applyCachedWorkspaceSnapshot(
                        key,
                        cachedPayload,
                        cachedMeta.remoteUpdatedAt || cachedMeta.lastSyncedAt || ''
                    );
                    setCloudStatus('syncing', '本地已就绪');
                } catch (error) {
                    console.warn('[CloudLoad] apply resolved cached snapshot failed:', error);
                }
            }
            if (cachedMeta.pendingCloudSync) {
                scheduleBackgroundQueueFlush(this);
                setCloudStatus('success', '本地已就绪');
                return true;
            }
        }

        try {
            const remoteMeta = await fetchWorkspaceSnapshotMeta(key);
            if (!remoteMeta?.updated_at) {
                setCloudStatus('success', appliedCached ? '本地已就绪' : '暂无云端');
                return appliedCached;
            }

            const remoteTs = Date.parse(String(remoteMeta.updated_at || '')) || 0;
            const localTs = Date.parse(String(cachedMeta.remoteUpdatedAt || cachedMeta.lastSyncedAt || '')) || 0;
            const remoteIsNewer = remoteTs > (localTs + 1000);

            if (appliedCached && !remoteIsNewer) {
                const cohortId = normalizeCohortId(cachedPayload?.CURRENT_COHORT_ID || getCurrentCohortId());
                if (cohortId && typeof this.fetchCohortExamsToLocal === 'function') {
                    this.fetchCohortExamsToLocal(cohortId, { background: true }).catch((syncError) => {
                        console.warn('[CloudExams] background sync failed:', syncError);
                    });
                }
                setCloudStatus('success', '已最新');
                return true;
            }

            if (appliedCached && remoteIsNewer) {
                if (!this._workspaceRefreshTasks) this._workspaceRefreshTasks = {};
                if (!this._workspaceRefreshTasks[key]) {
                    this._workspaceRefreshTasks[key] = fetchWorkspaceSnapshotRow(key)
                        .then(row => fetchAndApplyWorkspaceSnapshot(this, key, row))
                        .finally(() => {
                            delete this._workspaceRefreshTasks[key];
                        });
                }
                this._workspaceRefreshTasks[key].catch((error) => {
                    console.warn('[CloudLoad] background refresh failed:', error);
                });
                setCloudStatus('success', '本地已就绪');
                return true;
            }

            const row = await fetchWorkspaceSnapshotRow(key);
            if (!row || !row.content) return appliedCached;

            const loaded = await fetchAndApplyWorkspaceSnapshot(this, key, row);
            if (!loaded) return appliedCached;

            if (typeof logAction === 'function') logAction('云端加载', `已加载全量数据：${key}`);
            safeToast('数据已同步到本地', 'success');
            setCloudStatus('success', '已拉取');
            return true;
        } catch (error) {
            console.error('Cloud load error:', error);
            if (appliedCached) {
                setCloudStatus('success', '缓存可用');
                return true;
            }
            safeToast('加载失败', 'error');
            setCloudStatus('error', error?.message ? String(error.message).slice(0, 24) : '拉取失败');
            return false;
        }
    };

    const originalFetchCohortExamsToLocal = CloudManager.fetchCohortExamsToLocal;
    const originalWorkspaceLoad = CloudManager.load;

    async function runCohortExamSync(manager, cohortId, options = {}) {
        const nextOptions = options && typeof options === 'object' ? { ...options } : {};
        const background = Boolean(nextOptions.background);
        if (!background) {
            return originalFetchCohortExamsToLocal.call(manager, cohortId, nextOptions);
        }

        const previousToast = window.UI && typeof window.UI.toast === 'function'
            ? window.UI.toast
            : null;
        const previousSetCloudSyncStatus = typeof window.setCloudSyncStatus === 'function'
            ? window.setCloudSyncStatus
            : null;

        if (window.UI && typeof window.UI.toast === 'function') {
            window.UI.toast = function () { };
        }
        if (typeof window.setCloudSyncStatus === 'function') {
            window.setCloudSyncStatus = function () { };
        }

        try {
            return await originalFetchCohortExamsToLocal.call(manager, cohortId, nextOptions);
        } finally {
            if (window.UI && previousToast) {
                window.UI.toast = previousToast;
            }
            if (previousSetCloudSyncStatus) {
                window.setCloudSyncStatus = previousSetCloudSyncStatus;
            }
        }
    }

    CloudManager.fetchCohortExamsToLocal = function (cohortId, options = {}) {
        return runCohortExamSync(this, cohortId, options);
    };

    CloudManager.load = async function () {
        const manager = this;
        const previousFetch = manager.fetchCohortExamsToLocal;

        manager.fetchCohortExamsToLocal = function (cohortId, options = {}) {
            runCohortExamSync(manager, cohortId, { ...(options || {}), background: true }).catch((syncError) => {
                console.warn('[CloudExams] background sync failed:', syncError);
            });
            return Promise.resolve({ success: true, queued: true, background: true });
        };

        try {
            return await originalWorkspaceLoad.call(manager);
        } finally {
            manager.fetchCohortExamsToLocal = previousFetch;
        }
    };

    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            if (!Object.keys(readWorkspaceSyncQueue()).length) return;
            CloudManager.flushWorkspaceSyncQueue().catch((error) => {
                console.warn('[CloudSync] startup queue flush failed:', error);
            });
        }, 1200);
    });

    window.__CLOUD_WORKSPACE_RUNTIME_PATCHED__ = true;
})();
