(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.LoggerRuntime) return;
    root.LoggerRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createLoggerRuntime(root) {
    function getDocument() {
        return root.document || null;
    }

    function getUi() {
        return root.UI && typeof root.UI === 'object' ? root.UI : null;
    }

    function getSupabaseClient() {
        return root.sbClient || null;
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
        if (typeof root.alert === 'function') root.alert(message);
    }

    function safeConfirm(message) {
        if (typeof root.confirm === 'function') return !!root.confirm(message);
        return true;
    }

    function callManagerMethod(manager, name, args) {
        if (!manager || typeof manager[name] !== 'function') return;
        return manager[name].apply(manager, args || []);
    }

    function getCheckedIdsFromDom() {
        const doc = getDocument();
        if (!doc || typeof doc.querySelectorAll !== 'function') return [];
        return Array.from(doc.querySelectorAll('.log-item-check:checked')).map((cb) => cb.value);
    }

    async function log(action, details) {
        const client = getSupabaseClient();
        if (!client) return;

        let operator = '未知/系统';
        try {
            const authState = root.AuthState && typeof root.AuthState === 'object' ? root.AuthState : null;
            const user = authState && typeof authState.getCurrentUser === 'function'
                ? authState.getCurrentUser()
                : null;
            if (user) {
                operator = `${user.name} (${user.role})`;
            }
        } catch (_) { }

        try {
            await client.from('system_logs').insert([{
                operator,
                action,
                details,
                status: 'normal'
            }]);
            console.log(`[Log] ${action}: ${details}`);
        } catch (error) {
            console.error('写日志失败:', error);
        }
    }

    async function view(manager) {
        if (manager) manager.isHistoryMode = false;
        callManagerMethod(manager, 'updateUIState');
        const doc = getDocument();
        const modal = doc ? doc.getElementById('admin-log-modal') : null;
        if (modal) modal.style.display = 'flex';
        return callManagerMethod(manager, 'loadLogs');
    }

    async function toggleHistoryView(manager) {
        if (manager) manager.isHistoryMode = !manager.isHistoryMode;
        callManagerMethod(manager, 'updateUIState');
        return callManagerMethod(manager, 'loadLogs');
    }

    function updateUIState(manager) {
        const doc = getDocument();
        if (!doc) return;

        const titleEl = doc.getElementById('log-modal-title');
        const btnHistory = doc.getElementById('btn-log-history');
        const normalActions = doc.getElementById('log-normal-actions');
        const historyActions = doc.getElementById('log-history-actions');

        const checkAll = doc.getElementById('log-check-all');
        const historyCheckAll = doc.getElementById('log-history-check-all');
        if (checkAll) checkAll.checked = false;
        if (historyCheckAll) historyCheckAll.checked = false;

        if (manager && manager.isHistoryMode) {
            if (titleEl) {
                titleEl.innerHTML = '<i class="ti ti-trash"></i> 日志回收站';
                titleEl.style.color = '#666';
            }
            if (btnHistory) {
                btnHistory.innerHTML = '<i class="ti ti-arrow-back-up"></i> 返回日志列表';
                btnHistory.className = 'btn btn-sm btn-primary';
            }
            if (normalActions) normalActions.style.display = 'none';
            if (historyActions) historyActions.style.display = 'flex';
            return;
        }

        if (titleEl) {
            titleEl.innerHTML = '<i class="ti ti-history"></i> 系统操作日志';
            titleEl.style.color = '#333';
        }
        if (btnHistory) {
            btnHistory.innerHTML = '<i class="ti ti-recycle"></i> 日志回收站';
            btnHistory.className = 'btn btn-sm btn-gray';
        }
        if (normalActions) normalActions.style.display = 'flex';
        if (historyActions) historyActions.style.display = 'none';
    }

    async function loadLogs(manager) {
        const doc = getDocument();
        const listEl = doc ? doc.getElementById('admin-log-list') : null;
        if (!listEl) return;
        listEl.innerHTML = '<div style="padding:20px; text-align:center; color:#666;">⏳ 加载中...</div>';

        const client = getSupabaseClient();
        if (!client) {
            listEl.innerHTML = '<div style="color:red; padding:20px;">加载失败: 云端服务未初始化</div>';
            return;
        }

        let query = client
            .from('system_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (manager && manager.isHistoryMode) {
            query = query.eq('status', 'deleted');
        } else {
            query = query.or('status.eq.normal,status.is.null');
        }

        const { data, error } = await query;
        if (error) {
            listEl.innerHTML = `<div style="color:red; padding:20px;">加载失败: ${error.message}</div>`;
            return;
        }
        if (!Array.isArray(data) || data.length === 0) {
            listEl.innerHTML = '<div style="padding:40px; text-align:center; color:#999;">📭 暂无记录</div>';
            return;
        }

        let html = `
            <table style="width:100%; border-collapse:collapse; font-size:12px;">
                <thead style="position:sticky; top:0; background:#f3f4f6; z-index:1;">
                    <tr style="border-bottom:1px solid #ddd; color:#64748b;">
                        <th style="width:40px; padding:10px; text-align:center;">选</th>
                        <th style="width:140px; padding:10px; text-align:left;">时间</th>
                        <th style="width:120px; padding:10px; text-align:left;">操作人</th>
                        <th style="width:100px; padding:10px; text-align:left;">动作</th>
                        <th style="padding:10px; text-align:left;">详情</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.forEach((logItem) => {
            const time = new Date(logItem.created_at).toLocaleString();
            const action = String(logItem.action || '');
            let color = '#333';
            if (action.includes('删除')) color = '#dc2626';
            if (action.includes('修改')) color = '#d97706';
            if (action.includes('同步')) color = '#2563eb';

            html += `
                <tr style="border-bottom:1px solid #eee; background:white;">
                    <td style="text-align:center;">
                        <input type="checkbox" class="log-item-check" value="${logItem.id}">
                    </td>
                    <td style="padding:8px 10px; color:#666;">${time}</td>
                    <td style="padding:8px 10px; font-weight:bold;">${logItem.operator || '-'}</td>
                    <td style="padding:8px 10px; color:${color}; font-weight:bold;">${logItem.action || ''}</td>
                    <td style="padding:8px 10px; color:#444;">${logItem.details || ''}</td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        listEl.innerHTML = html;
    }

    function toggleSelectAll(_manager, source) {
        const doc = getDocument();
        if (!doc || !source || typeof doc.querySelectorAll !== 'function') return;
        doc.querySelectorAll('.log-item-check').forEach((cb) => {
            cb.checked = !!source.checked;
        });
    }

    function getCheckedIds() {
        return getCheckedIdsFromDom();
    }

    async function batchSoftDelete(manager) {
        const ids = callManagerMethod(manager, 'getCheckedIds') || getCheckedIdsFromDom();
        if (!ids.length) {
            safeToast('请至少选择一项', 'error');
            return;
        }

        const client = getSupabaseClient();
        if (!client) {
            safeAlert('删除失败: 云端服务未初始化');
            return;
        }

        safeLoading(true, '正在删除...');
        const { error } = await client.from('system_logs').update({ status: 'deleted' }).in('id', ids);
        safeLoading(false);

        if (error) {
            safeAlert(`删除失败: ${error.message}`);
            return;
        }

        safeToast(`已删除 ${ids.length} 条日志`, 'success');
        callManagerMethod(manager, 'loadLogs');
        const doc = getDocument();
        const checkAll = doc ? doc.getElementById('log-check-all') : null;
        if (checkAll) checkAll.checked = false;
    }

    async function batchRestore(manager) {
        const ids = callManagerMethod(manager, 'getCheckedIds') || getCheckedIdsFromDom();
        if (!ids.length) {
            safeToast('请至少选择一项', 'error');
            return;
        }

        const client = getSupabaseClient();
        if (!client) {
            safeAlert('还原失败: 云端服务未初始化');
            return;
        }

        safeLoading(true, '正在还原...');
        const { error } = await client.from('system_logs').update({ status: 'normal' }).in('id', ids);
        safeLoading(false);

        if (error) {
            safeAlert(`还原失败: ${error.message}`);
            return;
        }

        safeToast(`已还原 ${ids.length} 条日志`, 'success');
        callManagerMethod(manager, 'loadLogs');
        const doc = getDocument();
        const checkAll = doc ? doc.getElementById('log-history-check-all') : null;
        if (checkAll) checkAll.checked = false;
    }

    async function batchHardDelete(manager) {
        const ids = callManagerMethod(manager, 'getCheckedIds') || getCheckedIdsFromDom();
        if (!ids.length) {
            safeToast('请至少选择一项', 'error');
            return;
        }

        if (!safeConfirm(`⚠️ 确定要【彻底销毁】这 ${ids.length} 条日志吗？\n此操作不可恢复！`)) return;

        const client = getSupabaseClient();
        if (!client) {
            safeAlert('删除失败: 云端服务未初始化');
            return;
        }

        safeLoading(true, '正在粉碎...');
        const { error, count } = await client.from('system_logs').delete({ count: 'exact' }).in('id', ids);
        safeLoading(false);

        if (error) {
            safeAlert(`删除失败: ${error.message}`);
            return;
        }
        if (count === 0) {
            safeAlert('⚠️ 删除失败：权限不足！请在 Supabase 开启 system_logs 的 DELETE 权限。');
            return;
        }

        safeToast(`彻底删除了 ${count} 条日志`, 'success');
        callManagerMethod(manager, 'loadLogs');
        const doc = getDocument();
        const checkAll = doc ? doc.getElementById('log-history-check-all') : null;
        if (checkAll) checkAll.checked = false;
    }

    return {
        log,
        view,
        toggleHistoryView,
        updateUIState,
        loadLogs,
        toggleSelectAll,
        getCheckedIds,
        batchSoftDelete,
        batchRestore,
        batchHardDelete
    };
});
