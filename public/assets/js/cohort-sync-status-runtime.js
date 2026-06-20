(function (global) {
    'use strict';

    const SYNC_AT_PREFIX = 'COHORT_SYNC_AT_';
    const VALID_STATES = new Set(['idle', 'local', 'syncing', 'synced', 'error']);

    function formatTime(value) {
        const timestamp = Number(value || 0);
        if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
        return new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }

    function setStatus(state = 'idle', options = {}) {
        const cohortId = String(options.cohortId || '').trim();
        const chip = document.getElementById('shell-sync-chip');
        const normalizedState = VALID_STATES.has(state) ? state : 'idle';
        let syncedAt = Number(options.syncedAt || 0);

        if (normalizedState === 'synced') {
            syncedAt = syncedAt || Date.now();
            if (cohortId) localStorage.setItem(`${SYNC_AT_PREFIX}${cohortId}`, String(syncedAt));
            localStorage.setItem('CLOUD_SYNC_AT', String(syncedAt));
        } else if (!syncedAt && cohortId) {
            syncedAt = Number(localStorage.getItem(`${SYNC_AT_PREFIX}${cohortId}`) || 0);
        }

        const labels = {
            idle: syncedAt ? `上次同步 ${formatTime(syncedAt)}` : '待同步',
            local: '本地数据',
            syncing: '云端同步中',
            synced: `已同步 ${formatTime(syncedAt)}`,
            error: '同步失败 · 重试'
        };

        if (chip) {
            chip.dataset.syncState = normalizedState;
            chip.dataset.cohortId = cohortId;
            chip.disabled = normalizedState === 'syncing';
            const label = chip.querySelector('[data-sync-label]');
            if (label) label.textContent = labels[normalizedState];
            chip.title = options.detail || (normalizedState === 'error' ? '点击重试当前届别的云端同步' : labels[normalizedState]);
            if (chip.dataset.syncBound !== '1') {
                chip.dataset.syncBound = '1';
                chip.addEventListener('click', () => {
                    if (chip.dataset.syncState === 'error') global.retryCurrentCohortSync?.();
                });
            }
        }
        if (document.body) document.body.dataset.cohortSyncState = normalizedState;
        return { state: normalizedState, cohortId, syncedAt };
    }

    async function retry(options = {}) {
        const cohortId = String(options.cohortId || '').trim();
        if (!cohortId || typeof options.load !== 'function') {
            setStatus('error', { cohortId, detail: '当前届别无法连接云端，请稍后再试' });
            return false;
        }
        setStatus('syncing', { cohortId, detail: '正在重新连接云端并恢复当前届别数据' });
        try {
            await options.load();
            options.restore?.();
            const hasData = options.hasData?.() === true;
            setStatus(hasData ? 'synced' : 'local', { cohortId });
            options.toast?.(hasData ? '云端数据同步完成' : '已连接云端，当前使用本地数据', hasData ? 'success' : 'info');
            return hasData;
        } catch (error) {
            setStatus('error', { cohortId, detail: String(error?.message || '云端同步失败，点击重试') });
            options.toast?.('云端同步失败，可点击顶部状态重试', 'error');
            return false;
        }
    }

    global.CohortSyncStatusRuntime = Object.freeze({ retry, setStatus });
}(window));
