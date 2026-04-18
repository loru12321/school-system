(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.IssueManagerRuntime) return;
    root.IssueManagerRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createIssueManagerRuntime(root) {
    function normalizeText(value) {
        return String(value || '').trim();
    }

    function getDocument() {
        return root.document || null;
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
        if (typeof root.alert === 'function') root.alert(message);
    }

    function safeConfirm(message) {
        if (typeof root.confirm === 'function') return !!root.confirm(message);
        return true;
    }

    function getSupabaseClient() {
        return root.sbClient || null;
    }

    function hasCloudAccess() {
        return !!(root.CloudApi || getSupabaseClient());
    }

    function getCurrentUser() {
        if (root.Auth && typeof root.Auth === 'object') {
            return root.Auth.currentUser || null;
        }
        return null;
    }

    function getIssueScopeQuery(query, user) {
        if (!query || !user) return query;

        const role = normalizeText(user.role);
        const userClass = normalizeText(user.class);
        const school = normalizeText(user.school);

        if (role === 'grade_director') {
            if (userClass && typeof query.ilike === 'function') {
                return query.ilike('student_class', `${userClass}%`);
            }
            return query;
        }

        if (role === 'class_teacher') {
            if (userClass && typeof query.eq === 'function') {
                return query.eq('student_class', userClass);
            }
            return query;
        }

        if (role === 'director') {
            if (school && typeof query.eq === 'function') {
                return query.eq('school', school);
            }
            return query;
        }

        return query;
    }

    function setInputValue(id, value) {
        const doc = getDocument();
        if (!doc) return;
        const el = doc.getElementById(id);
        if (el) el.value = String(value || '');
    }

    function getInputValue(id) {
        const doc = getDocument();
        if (!doc) return '';
        const el = doc.getElementById(id);
        return el ? normalizeText(el.value) : '';
    }

    function showModal(id, display = 'flex') {
        const doc = getDocument();
        if (!doc) return;
        const modal = doc.getElementById(id);
        if (modal) modal.style.display = display;
    }

    function callManagerMethod(manager, name, args) {
        if (!manager || typeof manager[name] !== 'function') return;
        return manager[name].apply(manager, args || []);
    }

    async function openSubmitModal(name, cls, school) {
        setInputValue('issue-student-name', name);
        setInputValue('issue-student-class', cls);
        setInputValue('issue-student-school', school);

        const doc = getDocument();
        const descArea = doc ? doc.getElementById('issue-desc') : null;
        if (descArea) {
            descArea.value = '';
            descArea.style.borderColor = '#d1d5db';
        }

        showModal('issue-submit-modal', 'flex');
    }

    async function submit() {
        const doc = getDocument();
        const name = getInputValue('issue-student-name');
        const cls = getInputValue('issue-student-class');
        const school = getInputValue('issue-student-school');
        const type = getInputValue('issue-type');
        const desc = getInputValue('issue-desc');
        const contact = getInputValue('issue-contact');

        if (!desc) {
            const descEl = doc ? doc.getElementById('issue-desc') : null;
            if (descEl) descEl.style.borderColor = '#ef4444';
            safeAlert('请填写申诉内容');
            return;
        }

        const client = getSupabaseClient();
        if (!client) {
            safeAlert('提交失败：云端服务未初始化');
            return;
        }

        safeLoading(true, '正在提交申请...');
        const { error } = await client
            .from('issues')
            .insert([{
                student_name: name,
                student_class: cls,
                school: school,
                issue_type: type,
                description: desc,
                contact_info: contact,
                status: 'pending'
            }]);
        safeLoading(false);

        if (error) {
            safeAlert(`提交失败：${error.message}`);
            return;
        }

        safeAlert('✅ 申请已提交！\n教务处将尽快核查，请留意后续通知或老师反馈。');
        showModal('issue-submit-modal', 'none');
        const descArea = doc ? doc.getElementById('issue-desc') : null;
        if (descArea) descArea.value = '';
    }

    async function checkIssues() {
        if (!hasCloudAccess()) return;

        const user = getCurrentUser();
        const doc = getDocument();
        if (!user || (doc && doc.hidden)) return;

        const client = getSupabaseClient();
        if (!client) return;

        let query = client
            .from('issues')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending');
        query = getIssueScopeQuery(query, user);

        const { count, error } = await query;
        if (error) return;

        const badge = doc ? doc.getElementById('msg-badge') : null;
        if (!badge) return;

        if (count > 0) {
            badge.innerText = count > 99 ? '99+' : String(count);
            badge.classList.remove('hidden');
            return;
        }

        badge.classList.add('hidden');
    }

    async function openAdminPanel(manager) {
        if (manager) manager.isHistoryMode = false;
        callManagerMethod(manager, 'updateUIState');
        showModal('admin-issue-modal', 'flex');
        return callManagerMethod(manager, 'loadIssues');
    }

    async function toggleHistoryView(manager) {
        if (manager) manager.isHistoryMode = !manager.isHistoryMode;
        callManagerMethod(manager, 'updateUIState');
        return callManagerMethod(manager, 'loadIssues');
    }

    function updateUIState(manager) {
        const doc = getDocument();
        if (!doc) return;

        const titleEl = doc.getElementById('issue-modal-title');
        const btnHistory = doc.getElementById('btn-issue-history');
        const normalActions = doc.getElementById('issue-normal-actions');
        const historyActions = doc.getElementById('issue-history-actions');
        const tipBar = doc.getElementById('issue-tip-bar');
        const checkAll = doc.getElementById('issue-check-all');
        const historyCheckAll = doc.getElementById('issue-history-check-all');

        if (checkAll) checkAll.checked = false;
        if (historyCheckAll) historyCheckAll.checked = false;

        const isHistoryMode = !!(manager && manager.isHistoryMode);

        if (isHistoryMode) {
            if (titleEl) {
                titleEl.innerHTML = '<i class="ti ti-trash"></i> 删除历史记录 (回收站)';
                titleEl.style.color = '#666';
            }
            if (btnHistory) {
                btnHistory.innerHTML = '<i class="ti ti-arrow-back-up"></i> 返回列表';
                btnHistory.className = 'btn btn-sm btn-primary';
            }
            if (normalActions) normalActions.style.display = 'none';
            if (historyActions) historyActions.style.display = 'flex';
            if (tipBar) tipBar.style.display = 'none';
            return;
        }

        if (titleEl) {
            titleEl.innerHTML = '<i class="ti ti-bell"></i> 申诉反馈中心';
            titleEl.style.color = 'var(--primary)';
        }
        if (btnHistory) {
            btnHistory.innerHTML = '<i class="ti ti-history"></i> 查看删除记录';
            btnHistory.className = 'btn btn-sm btn-gray';
        }
        if (normalActions) normalActions.style.display = 'flex';
        if (historyActions) historyActions.style.display = 'none';
        if (tipBar) tipBar.style.display = 'block';
    }

    function toggleSelectAll(_manager, source) {
        const doc = getDocument();
        if (!doc || !source) return;
        const checkboxes = doc.querySelectorAll('.issue-item-check');
        checkboxes.forEach((cb) => {
            cb.checked = !!source.checked;
        });
    }

    function getCheckedIds() {
        const doc = getDocument();
        if (!doc) return [];
        const checkboxes = doc.querySelectorAll('.issue-item-check:checked');
        return Array.from(checkboxes).map((cb) => cb.value);
    }

    async function loadIssues(manager) {
        const doc = getDocument();
        const listEl = doc ? doc.getElementById('admin-issue-list') : null;
        if (!listEl) return;
        listEl.innerHTML = '<div style="text-align:center; padding:20px; color:#666;">⏳ 加载中...</div>';

        const client = getSupabaseClient();
        if (!client) {
            listEl.innerHTML = '<div style="color:red; text-align:center;">加载失败: 云端服务未初始化</div>';
            return;
        }

        const user = getCurrentUser();
        let query = client
            .from('issues')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100);

        if (manager && manager.isHistoryMode) {
            query = query.eq('status', 'deleted');
        } else {
            query = query.neq('status', 'deleted');
        }

        query = getIssueScopeQuery(query, user);

        const { data, error } = await query;
        if (error) {
            listEl.innerHTML = `<div style="color:red; text-align:center;">加载失败: ${error.message}</div>`;
            return;
        }

        if (!Array.isArray(data) || data.length === 0) {
            listEl.innerHTML = '<div style="text-align:center; padding:40px; color:#999;">📭 暂无相关记录</div>';
            return;
        }

        let html = '';
        data.forEach((item) => {
            const time = new Date(item.created_at).toLocaleString();
            const isPending = item.status === 'pending';
            const isDeleted = item.status === 'deleted';

            let statusBadge = '';
            let actionBtn = '';

            if (isDeleted) {
                statusBadge = '<span class="badge" style="background:#9ca3af; color:white;">已删除</span>';
                actionBtn = '<span style="font-size:12px; color:#999;">已删除</span>';
            } else {
                statusBadge = isPending
                    ? '<span class="badge" style="background:#ef4444; color:white;">待处理</span>'
                    : '<span class="badge" style="background:#10b981; color:white;">已解决</span>';
                actionBtn = isPending
                    ? `<button class="btn btn-sm btn-primary" onclick="IssueManager.resolve(${item.id})">✅ 标记已阅/解决</button>`
                    : '<span style="font-size:12px; color:#ccc;">已归档</span>';
            }

            html += `
                    <div style="background:white; border:1px solid #e2e8f0; border-left:4px solid ${isPending ? '#ef4444' : (isDeleted ? '#9ca3af' : '#10b981')}; border-radius:8px; padding:15px; margin-bottom:10px; display:flex; gap:10px;">
                        <div style="display:flex; align-items:center;">
                            <input type="checkbox" class="issue-item-check" value="${item.id}" style="transform:scale(1.2); cursor:pointer;">
                        </div>
                        <div style="flex:1;">
                            <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                                <div style="font-weight:bold; color:#333;">
                                    ${item.school} · ${item.student_class} · ${item.student_name}
                                </div>
                                <div style="font-size:12px; color:#64748b;">${time}</div>
                            </div>
                            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px; font-size:13px;">
                                <span style="background:#f3f4f6; padding:2px 6px; border-radius:4px;">${item.issue_type}</span>
                                ${statusBadge}
                            </div>
                            <div style="background:#f8fafc; padding:10px; border-radius:4px; font-size:14px; color:#475569; margin-bottom:10px;">
                                ${item.description}
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div style="font-size:12px; color:#0369a1;">📞 联系: ${item.contact_info || '无'}</div>
                                <div>${actionBtn}</div>
                            </div>
                        </div>
                    </div>
                `;
        });

        listEl.innerHTML = html;
    }

    async function resolve(manager, id) {
        if (!safeConfirm('确认已核实并处理该问题了吗？\n标记为已解决后，该条目将不再显示红点。')) return;

        const client = getSupabaseClient();
        if (!client) {
            safeAlert('操作失败：云端服务未初始化');
            return;
        }

        const { error } = await client.from('issues').update({ status: 'resolved' }).eq('id', id);
        if (error) {
            safeAlert(`操作失败：${error.message}`);
            return;
        }

        callManagerMethod(manager, 'loadIssues');
        callManagerMethod(manager, 'checkIssues');
    }

    async function batchSoftDelete(manager) {
        const ids = callManagerMethod(manager, 'getCheckedIds') || getCheckedIds();
        if (!ids.length) {
            safeToast('请至少选择一项', 'error');
            return;
        }
        if (!safeConfirm(`确定要删除选中的 ${ids.length} 条记录吗？\n(删除后可在“历史记录”中找回)`)) return;

        const client = getSupabaseClient();
        if (!client) {
            safeAlert('删除失败：云端服务未初始化');
            return;
        }

        safeLoading(true, '正在移除...');
        const { error } = await client.from('issues').update({ status: 'deleted' }).in('id', ids);
        safeLoading(false);

        if (error) {
            safeAlert(`删除失败: ${error.message}`);
            return;
        }

        safeToast(`已删除 ${ids.length} 条记录`, 'success');
        callManagerMethod(manager, 'loadIssues');
        callManagerMethod(manager, 'checkIssues');

        const doc = getDocument();
        const checkAll = doc ? doc.getElementById('issue-check-all') : null;
        if (checkAll) checkAll.checked = false;
    }

    async function batchRestore(manager) {
        const ids = callManagerMethod(manager, 'getCheckedIds') || getCheckedIds();
        if (!ids.length) {
            safeToast('请至少选择一项', 'error');
            return;
        }

        const client = getSupabaseClient();
        if (!client) {
            safeAlert('还原失败：云端服务未初始化');
            return;
        }

        safeLoading(true, '正在还原...');
        const { error } = await client.from('issues').update({ status: 'resolved' }).in('id', ids);
        safeLoading(false);

        if (error) {
            safeAlert(`还原失败: ${error.message}`);
            return;
        }

        safeToast(`已还原 ${ids.length} 条记录`, 'success');
        callManagerMethod(manager, 'loadIssues');

        const doc = getDocument();
        const checkAll = doc ? doc.getElementById('issue-history-check-all') : null;
        if (checkAll) checkAll.checked = false;
    }

    async function batchHardDelete(manager) {
        const ids = callManagerMethod(manager, 'getCheckedIds') || getCheckedIds();
        if (!ids.length) {
            safeToast('请至少选择一项', 'error');
            return;
        }
        if (!safeConfirm(`⚠️ 高能预警 ⚠️\n\n确定要【彻底删除】选中的 ${ids.length} 条记录吗？\n此操作不可恢复！`)) return;

        const client = getSupabaseClient();
        if (!client) {
            safeAlert('删除失败：云端服务未初始化');
            return;
        }

        safeLoading(true, '正在彻底粉碎数据...');
        const { error } = await client.from('issues').delete().in('id', ids);
        safeLoading(false);

        if (error) {
            safeAlert(`删除失败: ${error.message}`);
            return;
        }

        safeToast(`彻底删除了 ${ids.length} 条记录`, 'success');
        callManagerMethod(manager, 'loadIssues');

        const doc = getDocument();
        const checkAll = doc ? doc.getElementById('issue-history-check-all') : null;
        if (checkAll) checkAll.checked = false;
    }

    return {
        openSubmitModal,
        submit,
        checkIssues,
        openAdminPanel,
        toggleHistoryView,
        updateUIState,
        toggleSelectAll,
        getCheckedIds,
        loadIssues,
        resolve,
        batchSoftDelete,
        batchRestore,
        batchHardDelete
    };
});
