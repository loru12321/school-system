(() => {
    if (typeof window === 'undefined' || window.LoginSessionManager) return;

    // 复用 runtime-registry 的规范实现（与 account-manager / data-manager-* 同一委托模式）；
    // 本地实现仅作加载顺序兜底，行为与规范版一致。
    function escapeHtml(value) {
        const shared = window.SchoolRuntime && typeof window.SchoolRuntime.escapeHtml === 'function'
            ? window.SchoolRuntime.escapeHtml
            : null;
        if (shared) return shared(value);
        return String(value ?? '').replace(/[&<>"']/g, ch => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    }

    function getCurrentUser() {
        return window.Auth?.currentUser || null;
    }

    function formatTime(value) {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return String(value);
        return date.toLocaleString('zh-CN', { hour12: false });
    }

    function formatRole(role) {
        return ({
            admin: '管理员',
            director: '教务主任',
            grade_director: '级部主任',
            class_teacher: '班主任',
            teacher: '教师',
            parent: '家长'
        })[role] || role || '-';
    }

    function renderRows(tbody, records, options = {}) {
        if (!tbody) return;
        const currentId = String(options.currentSessionId || '');
        if (!Array.isArray(records) || !records.length) {
            tbody.innerHTML = `<tr><td colspan="${options.admin ? 8 : 6}" style="text-align:center; padding:28px; color:#94a3b8;">暂无登录记录</td></tr>`;
            return;
        }
        tbody.innerHTML = records.map((row) => {
            const isCurrent = currentId && String(row.session_id || '') === currentId;
            const currentBadge = isCurrent ? '<span class="badge" style="background:#dcfce7; color:#166534;">当前会话</span>' : '';
            const device = row.device_label || [row.browser, row.os, row.screen].filter(Boolean).join(' / ') || '-';
            const baseCells = options.admin ? `
                <td style="font-weight:700;">${escapeHtml(row.username || '-')}</td>
                <td>${escapeHtml(formatRole(row.role))}</td>
            ` : '';
            return `
                <tr>
                    ${baseCells}
                    <td>${escapeHtml(device)} ${currentBadge}</td>
                    <td>${escapeHtml(row.device_type || '-')}</td>
                    <td>${escapeHtml(row.school || '-')}</td>
                    <td>${escapeHtml(row.class_name || '-')}</td>
                    <td>${escapeHtml(formatTime(row.login_at))}</td>
                    <td>${escapeHtml(formatTime(row.session_expires_at))}</td>
                </tr>
            `;
        }).join('');
    }

    async function load(mode) {
        const isAll = mode === 'all';
        const tbody = document.querySelector(isAll ? '#login-session-all-table tbody' : '#login-session-self-table tbody');
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="${isAll ? 8 : 6}" style="text-align:center; padding:28px; color:#64748b;">正在读取登录状态...</td></tr>`;
        if (!window.EdgeGateway || typeof EdgeGateway.listLoginSessions !== 'function') {
            tbody.innerHTML = `<tr><td colspan="${isAll ? 8 : 6}" style="text-align:center; padding:28px; color:#dc2626;">账号网关未就绪</td></tr>`;
            return;
        }
        try {
            const result = await EdgeGateway.listLoginSessions({ mode: isAll ? 'all' : 'self', limit: isAll ? 100 : 20 });
            renderRows(tbody, result.records || [], {
                admin: isAll,
                currentSessionId: result.current_session_id || getCurrentUser()?.session_id || ''
            });
        } catch (error) {
            tbody.innerHTML = `<tr><td colspan="${isAll ? 8 : 6}" style="text-align:center; padding:28px; color:#dc2626;">读取失败：${escapeHtml(error?.message || error)}</td></tr>`;
        }
    }

    function open() {
        const modal = document.getElementById('login-session-modal');
        if (!modal) return;
        const user = getCurrentUser();
        const isAdmin = user?.role === 'admin' || (Array.isArray(user?.roles) && user.roles.includes('admin'));
        const adminPanel = document.getElementById('login-session-admin-panel');
        if (adminPanel) adminPanel.style.display = isAdmin ? 'block' : 'none';
        const subtitle = document.getElementById('login-session-subtitle');
        if (subtitle) {
            subtitle.textContent = isAdmin
                ? '查看当前账号设备记录，并审计全部账号最近登录状态。'
                : '查看当前账号近期在哪些设备上登录。';
        }
        modal.style.display = 'flex';
        load('self');
        if (isAdmin) load('all');
    }

    function close() {
        const modal = document.getElementById('login-session-modal');
        if (modal) modal.style.display = 'none';
    }

    document.addEventListener('click', (event) => {
        const openButton = event.target.closest('[data-login-session-open]');
        if (openButton) {
            event.preventDefault();
            open();
            return;
        }
        const closeButton = event.target.closest('[data-login-session-close]');
        if (closeButton) {
            event.preventDefault();
            close();
            return;
        }
        const loadButton = event.target.closest('[data-login-session-load]');
        if (loadButton) {
            event.preventDefault();
            load(loadButton.getAttribute('data-login-session-load') || 'self');
        }
    });

    window.LoginSessionManager = { open, close, load };
})();
