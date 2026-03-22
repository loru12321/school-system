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
                if (cohortId && typeof this.fetchCohortExamsToLocal === 'function') {
                    await this.fetchCohortExamsToLocal(cohortId);
                }
                await refreshCompareSelectors();
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

    window.__CLOUD_WORKSPACE_RUNTIME_PATCHED__ = true;
})();
