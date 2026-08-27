(function installWorkspaceUnloadGuard(root) {
    function hasPendingCloudSync() {
        const syncState = root.DataManager?.readDataManagerSyncState?.()
            || root.readDataManagerSyncStateValue?.()
            || {};
        return syncState.pendingCloudSync === true;
    }

    function shouldWarnBeforeUnload() {
        return hasPendingCloudSync();
    }

    function handleBeforeUnload(event) {
        if (!shouldWarnBeforeUnload()) return undefined;
        const message = '当前修改仍在同步到云端，请等待同步完成后再刷新或关闭页面。';
        event.preventDefault();
        event.returnValue = message;
        return message;
    }

    root.WorkspaceUnloadGuard = {
        hasPendingCloudSync,
        shouldWarnBeforeUnload
    };

    if (root.__WORKSPACE_UNLOAD_GUARD_BOUND__ || typeof root.addEventListener !== 'function') return;
    root.__WORKSPACE_UNLOAD_GUARD_BOUND__ = true;
    root.addEventListener('beforeunload', handleBeforeUnload);
}(window));
