(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.AccountManagerRuntime) return;
    root.AccountManagerRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createAccountManagerRuntime(root) {
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

    function escapeHtml(value) {
        const runtimeEscape = root.SchoolRuntime && typeof root.SchoolRuntime.escapeHtml === 'function'
            ? root.SchoolRuntime.escapeHtml
            : null;
        if (runtimeEscape) return runtimeEscape(value);
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function getCurrentUser() {
        if (!root.Auth || typeof root.Auth !== 'object') return null;
        return root.Auth.currentUser || null;
    }

    function getEdgeGateway() {
        return root.EdgeGateway && typeof root.EdgeGateway === 'object' ? root.EdgeGateway : null;
    }

    function getSwal() {
        return root.Swal && typeof root.Swal.fire === 'function' ? root.Swal : null;
    }

    function sameSchool(left, right) {
        const a = String(left || '').trim();
        const b = String(right || '').trim();
        if (!a || !b) return false;
        if (a === b) return true;
        if (root.PermissionPolicy && typeof root.PermissionPolicy.sameSchoolName === 'function') {
            return root.PermissionPolicy.sameSchoolName(a, b);
        }
        if (typeof root.sameAppSchoolName === 'function') return root.sameAppSchoolName(a, b);
        return a === b;
    }

    function getSchoolOptions(currentSchool) {
        const user = getCurrentUser();
        const names = new Set();
        const push = (value) => {
            const clean = String(value || '').trim();
            if (clean && clean !== '系统') names.add(clean);
        };
        push(currentSchool);
        push(user && user.school);
        if (user && user.role === 'director') {
            return Array.from(names);
        }
        const schools = root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {};
        Object.keys(schools).forEach(push);
        if (Array.isArray(root.RAW_DATA)) root.RAW_DATA.forEach(row => push(row && row.school));
        if (root.Auth && typeof root.Auth.getAccountSchoolOptions === 'function') {
            root.Auth.getAccountSchoolOptions().forEach(push);
        }
        return Array.from(names).sort((a, b) => a.localeCompare(b, 'zh-Hans-CN'));
    }

    function roleRequiresClass(role) {
        return role === 'parent' || role === 'class_teacher' || role === 'grade_director';
    }

    function normalizeClassForRole(role, value) {
        if (role === 'teacher') return '教师';
        if (role === 'director' || role === 'admin') return '';
        return String(value || '').trim();
    }

    function setSelectOptions(select, options, selected) {
        if (!select) return;
        select.innerHTML = options.map(option => {
            const value = typeof option === 'string' ? option : option.val;
            const text = typeof option === 'string' ? option : option.txt;
            const isSelected = String(value) === String(selected) || sameSchool(value, selected);
            return `<option value="${escapeHtml(value)}" ${isSelected ? 'selected' : ''}>${escapeHtml(text)}</option>`;
        }).join('');
    }

    function updateInlineClassVisibility() {
        const doc = getDocument();
        if (!doc) return;
        const role = String((doc.getElementById('acc-edit-role') || {}).value || '');
        const wrap = doc.getElementById('acc-edit-class-wrap');
        const label = doc.getElementById('acc-edit-class-label');
        const input = doc.getElementById('acc-edit-class');
        if (!wrap || !input) return;
        if (roleRequiresClass(role)) {
            wrap.style.display = '';
            if (label) label.textContent = role === 'grade_director' ? '级部 / 年级' : '班级';
            input.placeholder = role === 'grade_director' ? '例如: 9' : '例如: 9.1';
        } else {
            wrap.style.display = 'none';
            input.value = '';
        }
    }

    function callManagerMethod(manager, name, args) {
        if (!manager || typeof manager[name] !== 'function') return;
        return manager[name].apply(manager, args || []);
    }

    function getAccountManagerController() {
        return root.AccountManager && typeof root.AccountManager === 'object'
            ? root.AccountManager
            : null;
    }

    function bindTableActions(tbody) {
        if (!tbody || tbody.__accountManagerActionsBound || typeof tbody.addEventListener !== 'function') return;
        tbody.addEventListener('click', (event) => {
            const target = event.target && typeof event.target.closest === 'function'
                ? event.target.closest('[data-account-action]')
                : null;
            if (!target || target.disabled) return;
            const manager = getAccountManagerController();
            if (!manager) return;
            const action = String(target.dataset.accountAction || '').trim();
            const username = String(target.dataset.accountUsername || '').trim();
            if (!username) return;
            if (action === 'edit' && typeof manager.editAttributes === 'function') {
                manager.editAttributes(
                    username,
                    String(target.dataset.accountRole || '').trim(),
                    String(target.dataset.accountClass || '').trim(),
                    String(target.dataset.accountSchool || '').trim()
                );
                return;
            }
            if (action === 'reset-password' && typeof manager.resetPassword === 'function') {
                manager.resetPassword(username);
            }
        });
        tbody.__accountManagerActionsBound = true;
    }

    function open() {
        const user = getCurrentUser();
        if (!user) {
            safeAlert('请先登录');
            return;
        }

        const allowedRoles = ['admin', 'director', 'grade_director', 'class_teacher'];
        if (!allowedRoles.includes(user.role)) {
            safeAlert('⛔ 权限不足：只有管理员、主任或班主任可以使用此功能。');
            return;
        }

        const doc = getDocument();
        if (!doc) return;

        const hintEl = doc.getElementById('acc-permission-hint');
        let hintText = '';
        if (user.role === 'admin') hintText = '👑 管理员权限：可管理系统中【所有】账号。';
        else if (user.role === 'director') hintText = '🎓 教务主任权限：可管理本校【所有】账号。';
        else if (user.role === 'grade_director') hintText = `🚀 级部主任权限：可管理 ${user.class}年级 的【家长】及本校【教师】。`;
        else if (user.role === 'class_teacher') hintText = `📋 班主任权限：仅可管理 ${user.class}班 的【家长】账号。`;

        if (hintEl) {
            hintEl.innerHTML = `<i class="ti ti-shield-lock"></i> ${hintText}`;
        }

        const resultTable = doc.getElementById('acc-result-table');
        const tbody = resultTable && typeof resultTable.querySelector === 'function'
            ? resultTable.querySelector('tbody')
            : null;
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#999;">请输入关键字搜索</td></tr>';
        }

        const input = doc.getElementById('acc-search-input');
        if (input) input.value = '';

        const modal = doc.getElementById('account-manager-modal');
        if (modal) modal.style.display = 'flex';
        if (input && typeof input.focus === 'function') input.focus();
    }

    async function search(manager) {
        const doc = getDocument();
        const input = doc ? doc.getElementById('acc-search-input') : null;
        const keyword = String((input && input.value) || '').trim();
        if (!keyword) {
            safeToast('请输入搜索关键字', 'warning');
            return;
        }

        const user = getCurrentUser();
        if (!user) return;

        const edgeGateway = getEdgeGateway();
        if (!edgeGateway || typeof edgeGateway.searchAccounts !== 'function') {
            safeAlert('❌ 账号网关未就绪，请稍后重试。');
            return;
        }

        safeLoading(true, '正在搜索账号...');
        try {
            const result = await edgeGateway.searchAccounts(keyword, { limit: 50 });
            callManagerMethod(manager, 'renderTable', [result && Array.isArray(result.records) ? result.records : []]);
        } catch (error) {
            safeAlert(`查询失败: ${error && error.message ? error.message : error}`);
        } finally {
            safeLoading(false);
        }
    }

    function renderTable(list) {
        const doc = getDocument();
        const tbody = doc && typeof doc.querySelector === 'function'
            ? doc.querySelector('#acc-result-table tbody')
            : null;
        if (!tbody) return;

        if (!Array.isArray(list) || !list.length) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#999;">未找到匹配的账号 (或无权管理)</td></tr>';
            return;
        }

        const roleMap = {
            admin: '👑 管理员',
            director: '🎓 教务主任',
            grade_director: '🚀 级部主任',
            class_teacher: '📋 班主任',
            teacher: '👨‍🏫 教师',
            parent: '👨‍👩‍👧 家长'
        };
        const currentUser = getCurrentUser();
        const myRole = currentUser ? currentUser.role : 'guest';

        let html = '';
        list.forEach((user) => {
            const roleName = roleMap[user.role] || user.role;
            let canEdit = false;
            if (myRole === 'admin') {
                canEdit = (user.role !== 'admin' || user.username === (currentUser && currentUser.name));
            } else if (myRole === 'director') {
                canEdit = (user.role !== 'admin' && user.role !== 'director');
            } else {
                canEdit = (user.role === 'parent' || user.role === 'teacher');
            }

            const btnClass = canEdit ? 'btn-primary' : 'btn-gray';
            const cursorStyle = canEdit ? '' : 'cursor:not-allowed; opacity:0.6;';
            const disableAttr = canEdit ? '' : 'disabled';
            const safeUser = escapeHtml(user.username || '');
            const safeRole = escapeHtml(user.role || '');
            const safeClass = escapeHtml(user.class_name || '');
            const safeSchool = escapeHtml(user.school || '');

            html += `
                    <tr>
                        <td style="font-weight:bold;">${escapeHtml(user.username || '')}</td>
                        <td><span class="badge" style="background:#e0f2fe; color:#0369a1;">${escapeHtml(roleName)}</span></td>
                        <td>${escapeHtml(user.school || '-')}</td>
                        <td>${escapeHtml(user.class_name || '-')}</td>
                        <td style="font-family:monospace; color:#666;">${escapeHtml(user.password_display || '未设置')}</td>
                        <td>
                            <button class="btn btn-sm btn-purple" ${disableAttr} style="padding:2px 6px; font-size:12px; margin-right:5px; ${cursorStyle}"
                                    data-account-action="edit" data-account-username="${safeUser}" data-account-role="${safeRole}" data-account-class="${safeClass}" data-account-school="${safeSchool}">
                                <i class="ti ti-edit"></i> 修改
                            </button>
                            <button class="btn btn-sm ${btnClass}" ${disableAttr} style="padding:2px 6px; font-size:12px; ${cursorStyle}"
                                    data-account-action="reset-password" data-account-username="${safeUser}">
                                <i class="ti ti-key"></i> 改密
                            </button>
                        </td>
                    </tr>
                `;
        });
        tbody.innerHTML = html;
        bindTableActions(tbody);
    }

    let pendingInlineEdit = null;

    function cancelEdit() {
        const doc = getDocument();
        const panel = doc ? doc.getElementById('account-edit-panel') : null;
        if (panel) panel.style.display = 'none';
        pendingInlineEdit = null;
    }

    function renderInlineEditPanel(manager, username, currentRole, currentClass, currentSchool) {
        const doc = getDocument();
        if (!doc) return false;
        const panel = doc.getElementById('account-edit-panel');
        const title = doc.getElementById('acc-edit-title');
        const roleEl = doc.getElementById('acc-edit-role');
        const schoolEl = doc.getElementById('acc-edit-school');
        const classEl = doc.getElementById('acc-edit-class');
        if (!panel || !roleEl || !schoolEl || !classEl) return false;

        const roleOptions = [
            { val: 'teacher', txt: '👨‍🏫 科任教师' },
            { val: 'class_teacher', txt: '📋 班主任' },
            { val: 'grade_director', txt: '🚀 级部主任' },
            { val: 'parent', txt: '👨‍👩‍👧 家长/学生' },
            { val: 'director', txt: '🎓 教务主任' },
            { val: 'admin', txt: '👑 管理员' }
        ];
        setSelectOptions(roleEl, roleOptions, currentRole || 'teacher');

        const schoolOptions = getSchoolOptions(currentSchool);
        setSelectOptions(schoolEl, schoolOptions.length ? schoolOptions : [currentSchool || ''], currentSchool);
        classEl.value = normalizeClassForRole(currentRole, currentClass) === '教师' ? '' : String(currentClass || '').trim();
        pendingInlineEdit = { manager, username };
        if (title) title.textContent = `修改账号信息：${username}`;
        roleEl.onchange = updateInlineClassVisibility;
        updateInlineClassVisibility();
        panel.style.display = 'block';
        if (typeof panel.scrollIntoView === 'function') panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
    }

    async function saveInlineEdit(manager) {
        const doc = getDocument();
        if (!doc || !pendingInlineEdit) return;
        const role = String((doc.getElementById('acc-edit-role') || {}).value || '').trim();
        const school = String((doc.getElementById('acc-edit-school') || {}).value || '').trim();
        const classValue = String((doc.getElementById('acc-edit-class') || {}).value || '').trim();
        await submitAttributeUpdate(pendingInlineEdit.manager || manager, pendingInlineEdit.username, {
            role,
            school,
            class_name: normalizeClassForRole(role, classValue)
        });
    }

    async function editAttributes(manager, username, currentRole, currentClass, currentSchool) {
        if (renderInlineEditPanel(manager, username, currentRole, currentClass, currentSchool)) return;
        const swal = getSwal();
        if (!swal) {
            safeAlert('❌ 对话框组件未就绪，请稍后重试。');
            return;
        }

        const roleOptions = [
            { val: 'teacher', txt: '👨‍🏫 科任教师 (默认)' },
            { val: 'class_teacher', txt: '📋 班主任 (需填班级)' },
            { val: 'grade_director', txt: '🚀 级部主任 (需填年级)' },
            { val: 'parent', txt: '👨‍👩‍👧 家长/学生 (需填班级)' },
            { val: 'director', txt: '🎓 教务主任' },
            { val: 'admin', txt: '👑 管理员' }
        ].map((option) => `<option value="${option.val}" ${option.val === currentRole ? 'selected' : ''}>${option.txt}</option>`).join('');

        const result = await swal.fire({
            title: `修改账号信息：${String(username || '')}`,
            html: `
                    <div style="text-align:left; font-size:14px;">
                        <label style="display:block; margin-bottom:5px; font-weight:bold;">角色权限</label>
                        <select id="swal-edit-role" class="swal2-input" style="margin:0 0 15px 0; width:100%; font-size:14px;">
                            ${roleOptions}
                        </select>

                        <label style="display:block; margin-bottom:5px; font-weight:bold;">
                            所属学校
                        </label>
                        <select id="swal-edit-school" class="swal2-input" style="margin:0 0 15px 0; width:100%; font-size:14px;">
                            ${getSchoolOptions(currentSchool).map(school => `<option value="${escapeHtml(school)}" ${sameSchool(school, currentSchool) ? 'selected' : ''}>${escapeHtml(school)}</option>`).join('')}
                        </select>

                        <label id="swal-edit-class-label" style="display:block; margin-bottom:5px; font-weight:bold;">
                            班级 / 范围 <small style="color:#666; font-weight:normal;">(家长/班主任填班级，级部主任填年级)</small>
                        </label>
                        <input id="swal-edit-class" class="swal2-input" value="${escapeHtml(currentClass)}" placeholder="例如: 901 或 9" style="margin:0; width:100%; font-size:14px;">
                    </div>
                `,
            showCancelButton: true,
            confirmButtonText: '保存修改',
            cancelButtonText: '取消',
            focusConfirm: false,
            didOpen: () => {
                const liveDoc = getDocument();
                const container = liveDoc && liveDoc.querySelector ? liveDoc.querySelector('.swal2-container') : null;
                if (container) container.style.zIndex = '90000';
                const roleEl = liveDoc ? liveDoc.getElementById('swal-edit-role') : null;
                const label = liveDoc ? liveDoc.getElementById('swal-edit-class-label') : null;
                const input = liveDoc ? liveDoc.getElementById('swal-edit-class') : null;
                const sync = () => {
                    const role = String((roleEl && roleEl.value) || '');
                    const visible = roleRequiresClass(role);
                    if (label) label.style.display = visible ? 'block' : 'none';
                    if (input) {
                        input.style.display = visible ? 'block' : 'none';
                        if (!visible) input.value = '';
                    }
                };
                if (roleEl && typeof roleEl.addEventListener === 'function') roleEl.addEventListener('change', sync);
                sync();
            },
            preConfirm: () => {
                const doc = getDocument();
                const roleEl = doc ? doc.getElementById('swal-edit-role') : null;
                const schoolEl = doc ? doc.getElementById('swal-edit-school') : null;
                const classEl = doc ? doc.getElementById('swal-edit-class') : null;
                const role = String((roleEl && roleEl.value) || '');
                return {
                    role,
                    school: String((schoolEl && schoolEl.value) || '').trim(),
                    class_name: normalizeClassForRole(role, String((classEl && classEl.value) || '').trim())
                };
            }
        });

        const formValues = result ? result.value : null;
        if (!formValues) return;
        await submitAttributeUpdate(manager, username, formValues);
    }

    async function submitAttributeUpdate(manager, username, formValues) {
        const swal = getSwal();
        if (formValues.role !== 'admin' && !formValues.school) {
            if (swal) await swal.fire('错误', '所属学校不能为空！', 'error');
            else safeAlert('所属学校不能为空！');
            return;
        }
        if (roleRequiresClass(formValues.role) && !formValues.class_name) {
            const label = formValues.role === 'grade_director' ? '级部/年级' : '班级';
            if (swal) await swal.fire('错误', `${label}不能为空！`, 'error');
            else safeAlert(`${label}不能为空！`);
            return;
        }

        const edgeGateway = getEdgeGateway();
        if (!edgeGateway || typeof edgeGateway.updateAccount !== 'function') {
            safeAlert('❌ 账号网关未就绪，请稍后重试。');
            return;
        }

        safeLoading(true, '正在更新云端数据...');
        try {
            await edgeGateway.updateAccount({
                username,
                role: formValues.role,
                school: formValues.role === 'admin' ? '系统' : formValues.school,
                class_name: formValues.class_name
            });
            safeLoading(false);
            safeToast(`✅ 账号 [${username}] 信息已更新`, 'success');
            cancelEdit();
            callManagerMethod(manager, 'search');
            if (root.Logger && typeof root.Logger.log === 'function') {
                root.Logger.log('修改账号信息', `修改了 ${username} 的角色为 ${formValues.role}, 学校为 ${formValues.school || '系统'}, 范围为 ${formValues.class_name || '-'}`);
            }
        } catch (error) {
            safeLoading(false);
            safeAlert(`❌ 更新失败: ${error && error.message ? error.message : error}`);
        }
    }

    async function resetPassword(manager, username) {
        const promptImpl = typeof root.prompt === 'function' ? root.prompt.bind(root) : null;
        if (!promptImpl) {
            safeAlert('❌ 浏览器不支持输入弹窗');
            return;
        }

        const newPass = promptImpl(`🔐 正在修改账号 [${username}] 的密码\n\n请输入新密码 (留空则取消):`);
        if (newPass === null) return;
        if (!String(newPass).trim()) {
            safeAlert('密码不能为空');
            return;
        }

        const ok = safeConfirm(`⚠️ 确认重置账号 [${username}] 的密码？\n\n新密码将立即生效。是否继续？`);
        if (!ok) return;

        const edgeGateway = getEdgeGateway();
        if (!edgeGateway || typeof edgeGateway.resetAccountPassword !== 'function') {
            safeAlert('❌ 账号网关未就绪，请稍后重试。');
            return;
        }

        safeLoading(true, '正在更新密码...');
        try {
            await edgeGateway.resetAccountPassword(username, String(newPass).trim());
            safeLoading(false);
            safeToast(`✅ 账号 [${username}] 密码已更新`, 'success');
            callManagerMethod(manager, 'search');
            if (root.Logger && typeof root.Logger.log === 'function') {
                root.Logger.log('修改密码', `修改了用户 ${username} 的密码`);
            }
        } catch (error) {
            safeLoading(false);
            safeAlert(`❌ 修改失败: ${error && error.message ? error.message : error}`);
        }
    }

    return {
        open,
        search,
        renderTable,
        editAttributes,
        saveInlineEdit,
        cancelEdit,
        resetPassword
    };
});
