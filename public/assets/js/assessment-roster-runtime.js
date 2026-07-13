// On-demand renderer for the 95% teacher-assessment roster administration view.
(function () {
    const root = window;
    const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[char]));

    function renderDataManagerPanel() {
        const panel = document.getElementById('dm-assessment-roster-area');
        const core = root.AssessmentRosterCore;
        if (!panel || !core?.getPanelState) return;
        const state = core.getPanelState();
        const rows = (state.classes || []).map((entry) => {
            const statuses = Object.entries(entry.status_counts || {}).map(([key, count]) => `${key}:${count}`).join('，') || '-';
            const locked = entry.snapshot?.locked;
            return `<tr>
                <td><strong>${escapeHtml(entry.class_name)}</strong></td>
                <td>${escapeHtml(entry.initial_count)}</td><td>${escapeHtml(entry.target_count)}</td><td>${escapeHtml(entry.valid_count)}</td><td>${escapeHtml(entry.zero_fill)}</td>
                <td>${escapeHtml(statuses)}</td>
                <td>${locked ? `<span class="status-chip ok">已锁定</span><div class="tm-assessment-sync-mini">${escapeHtml(entry.snapshot.locked_at || '')}</div>` : '<span class="status-chip warn">未锁定</span>'}</td>
                <td>${locked ? `<button type="button" class="btn btn-sm btn-gray" data-assessment-roster-unlock="${escapeHtml(entry.class_name)}">解锁</button>` : '-'}</td>
            </tr>`;
        }).join('') || '<tr><td colspan="8" style="text-align:center;padding:20px;">当前考试没有可锁定的本校班级成绩。</td></tr>';
        panel.innerHTML = `
            <div class="info-bar" style="margin:0 0 12px;"><i class="ti ti-users-group"></i><strong>考核名册（95%去尾）</strong>&nbsp; ${escapeHtml(state.academicYear)} · ${escapeHtml(state.grade)} · ${escapeHtml(state.school)}。锁定后，正常、转入、辍学/借读计入；未报到、已转出不计入。实考低于目标人数时自动补零。</div>
            <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap;"><span class="tm-assessment-sync-mini">目标人数 = floor(初始人数 × 95%)。解锁后不会写入新的教师自动分，直到重新锁定。</span><button type="button" class="btn btn-blue" id="dmAssessmentRosterLockBtn"><i class="ti ti-lock"></i> 根据当前成绩锁定名册</button></div>
            <div class="table-wrap analysis-table-shell"><table class="analysis-table-dense"><thead><tr><th>班级</th><th>初始人数</th><th>95%目标</th><th>有效实考</th><th>补零</th><th>学生状态</th><th>锁定状态</th><th>操作</th></tr></thead><tbody>${rows}</tbody></table></div>`;
        const lockButton = panel.querySelector('#dmAssessmentRosterLockBtn');
        if (lockButton) lockButton.onclick = async () => {
            if (!confirm(`确认锁定 ${state.academicYear} ${state.grade} 的考核名册吗？锁定后教师自动分将按此95%人数和补零规则计算。`)) return;
            try {
                lockButton.disabled = true;
                await core.lockCurrentRoster();
                renderDataManagerPanel();
            } catch (error) {
                alert(`锁定失败：${error?.message || error}`);
            } finally {
                lockButton.disabled = false;
            }
        };
        panel.querySelectorAll('[data-assessment-roster-unlock]').forEach((button) => {
            button.onclick = async () => {
                const className = button.dataset.assessmentRosterUnlock;
                if (!confirm(`确认解锁 ${className} 的考核名册吗？解锁后该班不会参与新的教师自动同步。`)) return;
                await core.unlockRoster(className);
                renderDataManagerPanel();
            };
        });
    }

    root.AssessmentRoster = { renderDataManagerPanel };
})();
