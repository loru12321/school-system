(function () {
    const esc = (v) => String(v == null ? '' : v)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const getAuthHeaders = () => {
        const headers = { 'Content-Type': 'application/json' };
        const token = window.EdgeGateway?.getSessionToken?.()
            || sessionStorage.getItem('EDGE_SESSION_TOKEN')
            || '';
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    };

    async function callGateway(action, payload = {}) {
        const res = await fetch('/api/edu-gateway', {
            method: 'POST',
            credentials: 'include',
            headers: getAuthHeaders(),
            body: JSON.stringify({ action, payload })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            throw new Error(data.error || `请求失败 (${res.status})`);
        }
        return data;
    }

    const statusMap = {
        pending: '待审核',
        approved: '已通过',
        rejected: '已驳回',
        withdrawn: '已撤回'
    };

    async function openSubmitDialog() {
        if (typeof window.Swal === 'undefined') {
            return window.UI?.alert?.('弹窗组件未就绪，请刷新页面后重试');
        }
        let myRows = [];
        try {
            const listRes = await callGateway('teacher_change.list', { limit: 10 });
            myRows = Array.isArray(listRes.rows) ? listRes.rows : [];
        } catch (_) {
            myRows = [];
        }
        const user = window.AuthState?.getCurrentUser?.() || {};
        const pendingHtml = myRows.length
            ? `<div style="margin-top:12px;text-align:left;max-height:150px;overflow:auto;border-top:1px solid #e2e8f0;padding-top:8px;">
                <div style="font-size:12px;color:#64748b;margin-bottom:6px;">最近申请记录</div>
                ${myRows.map((row) => `<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:6px 8px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:6px;font-size:12px;">
                    <div>
                        <div><strong>${esc(row.current_class_name || '未填')} → ${esc(row.proposed_class_name || '未填')}</strong> (${esc(statusMap[row.status] || row.status)})</div>
                        <div style="color:#64748b;">学科：${esc((row.proposed_subjects || []).join('、') || '未变更')}</div>
                    </div>
                    ${row.status === 'pending' ? `<button type="button" class="btn btn-gray" data-tcr-withdraw="${esc(row.id)}" style="padding:3px 8px;font-size:11px;">撤回</button>` : ''}
                </div>`).join('')}
            </div>`
            : '';

        const result = await window.Swal.fire({
            title: '提交任课/班级变更申请',
            width: 520,
            html: `<div style="text-align:left;font-size:13px;">
                <label style="display:block;margin-bottom:4px;font-weight:600;">拟变更班级</label>
                <input id="tcr-proposed-class" class="swal2-input" style="margin:0 0 10px 0;width:100%;box-sizing:border-box;" placeholder="例如：8.1、8.2" value="${esc(user.class_name || '')}">
                <label style="display:block;margin-bottom:4px;font-weight:600;">拟变更任教学科（逗号或顿号分隔）</label>
                <input id="tcr-proposed-subjects" class="swal2-input" style="margin:0 0 10px 0;width:100%;box-sizing:border-box;" placeholder="例如：语文、道法">
                <label style="display:block;margin-bottom:4px;font-weight:600;">变更说明</label>
                <textarea id="tcr-reason" class="swal2-textarea" style="margin:0;width:100%;height:72px;box-sizing:border-box;" placeholder="简述新学期调班或学科调整原因"></textarea>
                ${pendingHtml}
            </div>`,
            showCancelButton: true,
            confirmButtonText: '提交审核',
            cancelButtonText: '取消',
            didOpen: (popup) => {
                popup.addEventListener('click', async (ev) => {
                    const btn = ev.target.closest('[data-tcr-withdraw]');
                    if (!btn) return;
                    const id = btn.getAttribute('data-tcr-withdraw');
                    btn.disabled = true;
                    try {
                        await callGateway('teacher_change.withdraw', { id });
                        window.Swal.close();
                        window.UI?.toast?.('已撤回变更申请', 'success');
                        openSubmitDialog();
                    } catch (err) {
                        btn.disabled = false;
                        window.UI?.alert?.('撤回失败：' + err.message);
                    }
                });
            },
            preConfirm: () => {
                const proposed_class_name = document.getElementById('tcr-proposed-class')?.value.trim() || '';
                const proposed_subjects = document.getElementById('tcr-proposed-subjects')?.value.trim() || '';
                const reason = document.getElementById('tcr-reason')?.value.trim() || '';
                if (!proposed_class_name && !proposed_subjects) {
                    window.Swal.showValidationMessage('请至少填写拟变更的班级或任教学科');
                    return false;
                }
                return { proposed_class_name, proposed_subjects, reason };
            }
        });

        if (!result.isConfirmed || !result.value) return;
        try {
            await callGateway('teacher_change.submit', result.value);
            window.UI?.toast?.('✅ 变更申请已提交，等待管理员审核', 'success');
        } catch (err) {
            window.UI?.alert?.('提交失败：' + err.message);
        }
    }

    async function openReviewDialog() {
        if (typeof window.Swal === 'undefined') {
            return window.UI?.alert?.('弹窗组件未就绪，请刷新页面后重试');
        }
        let rows = [];
        try {
            const res = await callGateway('teacher_change.list', { status: 'pending', limit: 50 });
            rows = Array.isArray(res.rows) ? res.rows : [];
        } catch (err) {
            return window.UI?.alert?.('加载待审核申请失败：' + err.message);
        }

        const listHtml = rows.length
            ? `<div style="text-align:left;max-height:380px;overflow:auto;">
                ${rows.map((row) => `
                    <div data-tcr-card="${esc(row.id)}" style="border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;margin-bottom:10px;background:#f8fafc;font-size:13px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                            <strong>${esc(row.teacher_name || row.username)}</strong>
                            <span style="font-size:12px;color:#64748b;">${esc(row.school || '本校')} · ${esc((row.created_at || '').slice(0, 16).replace('T', ' '))}</span>
                        </div>
                        <div style="margin-bottom:4px;">班级：<span style="color:#64748b;">${esc(row.current_class_name || '空')}</span> → <strong style="color:#0f766e;">${esc(row.proposed_class_name || '空')}</strong></div>
                        <div style="margin-bottom:4px;">学科：<span style="color:#64748b;">${esc((row.current_subjects || []).join('、') || '空')}</span> → <strong style="color:#0f766e;">${esc((row.proposed_subjects || []).join('、') || '未变更')}</strong></div>
                        ${row.reason ? `<div style="color:#475569;font-size:12px;margin-bottom:8px;">说明：${esc(row.reason)}</div>` : ''}
                        <div style="display:flex;gap:8px;justify-content:flex-end;">
                            <button type="button" class="btn btn-green" data-tcr-decision="approved" data-tcr-id="${esc(row.id)}" style="padding:4px 12px;font-size:12px;">通过并同步</button>
                            <button type="button" class="btn btn-red" data-tcr-decision="rejected" data-tcr-id="${esc(row.id)}" style="padding:4px 12px;font-size:12px;">驳回</button>
                        </div>
                    </div>
                `).join('')}
            </div>`
            : '<div style="padding:24px 0;color:#64748b;font-size:13px;">当前没有待审核的教师变更申请</div>';

        await window.Swal.fire({
            title: `教师变更申请审核 (${rows.length})`,
            width: 580,
            html: listHtml,
            showConfirmButton: true,
            confirmButtonText: '关闭',
            didOpen: (popup) => {
                popup.addEventListener('click', async (ev) => {
                    const btn = ev.target.closest('[data-tcr-decision]');
                    if (!btn) return;
                    const id = btn.getAttribute('data-tcr-id');
                    const decision = btn.getAttribute('data-tcr-decision');
                    btn.disabled = true;
                    try {
                        await callGateway('teacher_change.review', { id, decision });
                        const card = popup.querySelector(`[data-tcr-card="${CSS.escape(id)}"]`);
                        if (card) {
                            card.innerHTML = `<div style="color:${decision === 'approved' ? '#047857' : '#b91c1c'};font-weight:600;">${decision === 'approved' ? '✅ 已审核通过并同步至账号' : '已驳回该申请'}</div>`;
                        }
                        window.UI?.toast?.(decision === 'approved' ? '已审核通过' : '已驳回', 'success');
                    } catch (err) {
                        btn.disabled = false;
                        window.UI?.alert?.('审核失败：' + err.message);
                    }
                });
            }
        });
    }

    window.TeacherChangeRequestUI = { openSubmitDialog, openReviewDialog, __loaded: true };
})();
