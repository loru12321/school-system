(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataManagerArchiveRuntime) return;
    root.DataManagerArchiveRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataManagerArchiveRuntime(root) {
    function readHistoryArchiveRef() {
        if (typeof root.readHistoryArchiveState === 'function') {
            const state = root.readHistoryArchiveState();
            if (state && typeof state === 'object' && !Array.isArray(state)) return state;
        }
        if (root.HISTORY_ARCHIVE && typeof root.HISTORY_ARCHIVE === 'object') return root.HISTORY_ARCHIVE;
        try {
            if (typeof HISTORY_ARCHIVE !== 'undefined' && HISTORY_ARCHIVE && typeof HISTORY_ARCHIVE === 'object') {
                return HISTORY_ARCHIVE;
            }
        } catch (_) { }
        return {};
    }

    function syncHistoryArchiveRef(archive) {
        const nextArchive = archive && typeof archive === 'object' && !Array.isArray(archive) ? archive : {};
        if (typeof root.setHistoryArchiveState === 'function') {
            root.setHistoryArchiveState(nextArchive);
            return;
        }
        root.HISTORY_ARCHIVE = nextArchive;
        try {
            if (typeof HISTORY_ARCHIVE !== 'undefined') HISTORY_ARCHIVE = nextArchive;
        } catch (_) { }
    }

    function safeToast(text, type) {
        if (root.UI && typeof root.UI === 'object' && typeof root.UI.toast === 'function') {
            root.UI.toast(text, type);
        }
    }

    async function confirmAction(message) {
        if (root.UI && typeof root.UI.confirm === 'function') {
            return Boolean(await root.UI.confirm(message));
        }
        return true;
    }

    async function promptAction(message, defaultValue) {
        if (root.UI && typeof root.UI.prompt === 'function') {
            return await root.UI.prompt(message, defaultValue);
        }
        return '';
    }

    function escapeHtml(value) {
        const runtimeEscape = root.SchoolRuntime && typeof root.SchoolRuntime.escapeHtml === 'function'
            ? root.SchoolRuntime.escapeHtml
            : null;
        if (runtimeEscape) return runtimeEscape(value);
        return String(value ?? '').replace(/[&<>"']/g, function (char) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            }[char];
        });
    }

    function bindArchiveRowActions(manager, tbody) {
        if (!tbody || typeof tbody.querySelectorAll !== 'function') return;
        tbody.querySelectorAll('[data-history-exam-action]').forEach((button) => {
            button.addEventListener('click', async () => {
                const examName = button.dataset.historyExamName || '';
                if (button.dataset.historyExamAction === 'rename') {
                    await renameHistoryExam(manager, examName);
                } else if (button.dataset.historyExamAction === 'delete') {
                    await deleteHistoryExam(manager, examName);
                }
            });
        });
    }

    function renderArchives(manager) {
        if (!manager) return;
        const archive = readHistoryArchiveRef();
        const examStats = {};

        Object.keys(archive).forEach((uid) => {
            const records = Array.isArray(archive[uid]) ? archive[uid] : [];
            records.forEach((record) => {
                const examName = String(record && record.exam != null ? record.exam : '').trim();
                if (!examName) return;
                if (!examStats[examName]) examStats[examName] = 0;
                examStats[examName] += 1;
            });
        });

        const doc = root.document;
        const tbody = doc && typeof doc.getElementById === 'function'
            ? doc.getElementById('dm-history-tbody')
            : null;
        if (!tbody) return;

        if (Object.keys(examStats).length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#999;">暂无历史轨迹数据</td></tr>';
        } else {
            let html = '';
            Object.keys(examStats).forEach((examName) => {
                const safeExamName = escapeHtml(examName);
                html += `<tr><td style="font-weight:bold;">${safeExamName}</td><td>${examStats[examName]} 条记录</td><td><button class="btn btn-sm btn-primary" type="button" data-history-exam-action="rename" data-history-exam-name="${safeExamName}" style="padding:2px 6px;">重命名</button> <button class="btn btn-sm btn-danger" type="button" data-history-exam-action="delete" data-history-exam-name="${safeExamName}" style="padding:2px 6px; background:#dc2626;">删除</button></td></tr>`;
            });
            tbody.innerHTML = html;
            bindArchiveRowActions(manager, tbody);
        }

        if (manager.currentTab === 'archive' && typeof manager.loadCloudSnapshots === 'function') {
            manager.loadCloudSnapshots();
        }
    }

    async function deleteHistoryExam(manager, examName) {
        if (!manager) return;
        const target = String(examName || '').trim();
        if (!target) return;

        const confirmed = await confirmAction(`⚠️ 确定要删除【${target}】吗？`);
        if (!confirmed) return;

        const archive = readHistoryArchiveRef();
        Object.keys(archive).forEach((key) => {
            const records = Array.isArray(archive[key]) ? archive[key] : [];
            archive[key] = records.filter((record) => String(record && record.exam != null ? record.exam : '') !== target);
            if (archive[key].length === 0) delete archive[key];
        });
        syncHistoryArchiveRef(archive);

        if (typeof manager.renderArchives === 'function') manager.renderArchives();
        safeToast('已删除', 'success');
    }

    async function renameHistoryExam(manager, oldName) {
        if (!manager) return;
        const sourceName = String(oldName || '').trim();
        if (!sourceName) return;

        const nextName = await promptAction('重命名为：', sourceName);
        if (!nextName) return;

        const archive = readHistoryArchiveRef();
        Object.keys(archive).forEach((key) => {
            const records = Array.isArray(archive[key]) ? archive[key] : [];
            records.forEach((record) => {
                if (record && String(record.exam || '') === sourceName) {
                    record.exam = nextName;
                }
            });
        });
        syncHistoryArchiveRef(archive);

        if (typeof manager.renderArchives === 'function') manager.renderArchives();
    }

    return {
        renderArchives,
        deleteHistoryExam,
        renameHistoryExam
    };
});
