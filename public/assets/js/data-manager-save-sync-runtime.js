(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataManagerSaveSyncRuntime) return;
    root.DataManagerSaveSyncRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataManagerSaveSyncRuntime(root) {
    function safeAlert(text) {
        if (typeof root.alert === 'function') root.alert(String(text || ''));
    }

    function withSaveTimeout(promise) {
        const timeoutMs = Math.max(100, Number(root.SAVE_SYNC_TIMEOUT_MS) || 30000);
        const schedule = typeof root.setTimeout === 'function' ? root.setTimeout.bind(root) : setTimeout;
        return Promise.race([
            Promise.resolve(promise),
            new Promise((_, reject) => schedule(() => reject(new Error('云端同步超时，修改已保存在本地并进入重试队列')), timeoutMs))
        ]);
    }

    async function saveAndSync(manager) {
        if (!manager) return;

        if (typeof root.isArchiveLocked === 'function' && root.isArchiveLocked()) {
            safeAlert('⛔ 当前考试已封存，仅支持只读查看');
            return;
        }
        if (typeof root.confirm === 'function') {
            const confirmed = root.confirm('⚠️ 确定要应用所有修改并同步到云端吗？\n\n1. 系统将重算排名\n2. 目标/参数将被保存');
            if (!confirmed) return;
        }

        if (root.UI && typeof root.UI === 'object' && typeof root.UI.loading === 'function') {
            root.UI.loading(true, '正在保存...');
        }

        try {
            if (typeof manager.saveParamsLocally === 'function') {
                await manager.saveParamsLocally(true);
            }
            if (typeof manager.syncTeacherHistory === 'function') {
                manager.syncTeacherHistory();
            }
            if (typeof root.setTargetsState === 'function' && typeof root.ensureNormalizedTargets === 'function') {
                root.setTargetsState(root.ensureNormalizedTargets());
            }
            if (typeof root.setSchoolAliasState === 'function' && typeof root.ensureSchoolAliasStore === 'function') {
                root.setSchoolAliasState(root.ensureSchoolAliasStore());
            }

            if (root.window && Array.isArray(root.window.RAW_DATA) && root.window.RAW_DATA.length > 0) {
                try {
                    if (typeof root.processData === 'function') await root.processData();
                    if (typeof root.renderTables === 'function') root.renderTables();
                } catch (error) {
                    console.warn('重算失败，仍将同步云端：', error);
                }
            }

            if (typeof root.saveCloudData !== 'function') {
                throw new Error('saveCloudData unavailable');
            }
            const ok = await withSaveTimeout(
                root.saveCloudData({ background: false, forceUpload: true, sourceLabel: 'save-and-sync' })
            );
            if (!ok) throw new Error('云端同步失败');

            if (root.UI && typeof root.UI === 'object' && typeof root.UI.loading === 'function') {
                root.UI.loading(false);
            }
            if (root.Swal && typeof root.Swal.fire === 'function') {
                root.Swal.fire('成功', '数据已更新，并已同步到云端。', 'success');
            }

            // 通知数据状态事件总线：数据已保存并同步
            if (root.DataStateEventBus && typeof root.DataStateEventBus.notifyDataImported === 'function') {
                root.DataStateEventBus.notifyDataImported('save-and-sync');
            }
        } catch (error) {
            if (root.UI && typeof root.UI === 'object' && typeof root.UI.loading === 'function') {
                root.UI.loading(false);
            }
            safeAlert(`保存失败: ${error && error.message ? error.message : String(error)}`);
        }
    }

    return {
        saveAndSync
    };
});
