(function (global) {
    'use strict';

    const SYNC_AT_PREFIX = 'COHORT_SYNC_AT_';
    const VALID_STATES = new Set(['idle', 'local', 'syncing', 'synced', 'error']);

    function formatTime(value) {
        const timestamp = Number(value || 0);
        if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
        return new Date(timestamp).toLocaleString('zh-CN', {
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    function readStorage(key) {
        try {
            return localStorage.getItem(key) || '';
        } catch (_) {
            return '';
        }
    }

    function resolveSyncMeta(state = 'idle', options = {}) {
        const cohortId = String(
            options.cohortId
            || global.CURRENT_COHORT_ID
            || readStorage('CURRENT_COHORT_ID')
            || ''
        ).trim();
        const examId = String(
            options.examId
            || global.CURRENT_EXAM_ID
            || readStorage('CURRENT_EXAM_ID')
            || ''
        ).trim();
        const source = String(
            options.source
            || (state === 'synced' || state === 'syncing' ? 'cloud' : '')
            || (state === 'local' ? 'local' : '')
            || (readStorage('CLOUD_SYNC_AT') ? 'cache' : 'local')
        ).trim();
        const updatedAt = Number(options.syncedAt || options.updatedAt || readStorage(`${SYNC_AT_PREFIX}${cohortId}`) || readStorage('CLOUD_SYNC_AT') || 0);

        return {
            source: source || 'local',
            cohortId,
            examId,
            updatedAt
        };
    }

    function formatSyncDetail(meta) {
        const sourceLabels = {
            cloud: '云端',
            cache: '缓存',
            local: '本地'
        };
        const source = sourceLabels[meta.source] || '本地';
        const cohort = meta.cohortId ? `${meta.cohortId}届` : '未选届别';
        const exam = meta.examId ? meta.examId.replace(/^(.{18}).+$/, '$1...') : '未选择考试';
        const time = formatTime(meta.updatedAt);
        return time ? `${source} · ${cohort} · ${exam} · ${time}` : `${source} · ${cohort} · ${exam}`;
    }

    function hasCurrentCohortScores(meta) {
        const expectedCohortId = String(meta?.cohortId || '').trim();
        const currentCohortId = String(global.CURRENT_COHORT_ID || readStorage('CURRENT_COHORT_ID') || '').trim();
        const currentExamId = String(global.CURRENT_EXAM_ID || readStorage('CURRENT_EXAM_ID') || '').trim();
        const rows = Array.isArray(global.RAW_DATA) ? global.RAW_DATA : [];
        const db = global.COHORT_DB && typeof global.COHORT_DB === 'object' ? global.COHORT_DB : null;
        if (!rows.length || !currentExamId) return false;
        if (expectedCohortId && currentCohortId && expectedCohortId !== currentCohortId) return false;
        if (db?.cohortId && expectedCohortId && String(db.cohortId) !== expectedCohortId) return false;
        if (db?.exams && Object.keys(db.exams).length && !db.exams[currentExamId]) return false;
        return true;
    }

    function setStatus(state = 'idle', options = {}) {
        let normalizedState = VALID_STATES.has(state) ? state : 'idle';
        const chip = document.getElementById('shell-sync-chip');
        const meta = resolveSyncMeta(normalizedState, options);
        if (normalizedState === 'synced' && !hasCurrentCohortScores(meta)) {
            normalizedState = 'error';
            options = { ...options, detail: options.detail || '当前届别没有可用成绩数据，点击重试云端恢复' };
        }
        let syncedAt = Number(options.syncedAt || meta.updatedAt || 0);

        if (normalizedState === 'synced') {
            syncedAt = syncedAt || Date.now();
            if (meta.cohortId) localStorage.setItem(`${SYNC_AT_PREFIX}${meta.cohortId}`, String(syncedAt));
            localStorage.setItem('CLOUD_SYNC_AT', String(syncedAt));
            meta.updatedAt = syncedAt;
            meta.source = 'cloud';
        } else if (!syncedAt && meta.cohortId) {
            syncedAt = Number(localStorage.getItem(`${SYNC_AT_PREFIX}${meta.cohortId}`) || 0);
            meta.updatedAt = syncedAt;
        }

        const labels = {
            idle: syncedAt ? `上次同步 ${formatTime(syncedAt)}` : '待同步',
            local: '本地数据',
            syncing: '云端同步中',
            synced: `已同步 ${formatTime(syncedAt)}`,
            error: '同步失败 · 重试'
        };

        const detailText = formatSyncDetail(meta);
        if (chip) {
            const dataSyncSource = meta.source;
            const dataSyncExam = meta.examId;
            const dataSyncUpdated = String(meta.updatedAt || '');
            chip.dataset.syncState = normalizedState;
            chip.dataset.cohortId = meta.cohortId;
            chip.dataset.syncSource = dataSyncSource;
            chip.dataset.syncExam = dataSyncExam;
            chip.dataset.syncUpdated = dataSyncUpdated;
            chip.disabled = normalizedState === 'syncing';
            const label = chip.querySelector('[data-sync-label]');
            if (label) label.textContent = labels[normalizedState];
            const metaLabel = chip.querySelector('[data-sync-meta]');
            if (metaLabel) metaLabel.textContent = detailText;
            chip.title = options.detail || (normalizedState === 'error' ? `${detailText}；点击重试当前届别的云端同步` : detailText);
            if (chip.dataset.syncBound !== '1') {
                chip.dataset.syncBound = '1';
                chip.addEventListener('click', () => {
                    if (chip.dataset.syncState === 'error') global.retryCurrentCohortSync?.();
                });
            }
        }
        if (document.body) document.body.dataset.cohortSyncState = normalizedState;
        return { state: normalizedState, cohortId: meta.cohortId, syncedAt, meta };
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
            const summary = typeof global.getCloudRestoreSummary === 'function'
                ? global.getCloudRestoreSummary(cohortId)
                : null;
            const summaryText = summary && typeof global.formatCloudRestoreSummary === 'function'
                ? `：${global.formatCloudRestoreSummary(summary)}`
                : '';
            options.toast?.(
                hasData ? `云端数据同步完成${summaryText}` : '已连接云端，当前使用本地数据',
                hasData ? 'success' : 'info'
            );
            return hasData;
        } catch (error) {
            setStatus('error', { cohortId, detail: String(error?.message || '云端同步失败，点击重试') });
            options.toast?.('云端同步失败，可点击顶部状态重试', 'error');
            return false;
        }
    }

    global.CohortSyncStatusRuntime = Object.freeze({ retry, setStatus, resolveSyncMeta });
}(window));
