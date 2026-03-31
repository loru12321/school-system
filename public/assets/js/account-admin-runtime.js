const AccountExcel = {
    downloadTemplate: function () {
        const wb = XLSX.utils.book_new();
        const headers = ['角色', '学校', '班级', '级部(年级)', '姓名/账号', '密码', '备注'];
        const data = [
            headers,
            ['科任教师', '实验中学', '', '7', '张老师', '123456', '只看自己教的课'],
            ['班主任', '实验中学', '701', '7', '王班头', '123456', '看本班所有'],
            ['级部主任', '实验中学', '', '7', '李级部', '123456', '管理整个七年级'],
            ['家长', '实验中学', '701', '', '张小明', '123456', '只能看自己'],
            ['教务主任', '实验中学', '', '', '赵主任', '123456', '查看全校']
        ];
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 12 }, { wch: 15 }, { wch: 8 }, { wch: 10 }, { wch: 15 }, { wch: 10 }, { wch: 20 }];
        XLSX.utils.book_append_sheet(wb, ws, '账号导入模板');
        XLSX.writeFile(wb, '账号批量导入模板.xlsx');
    },

    upload: function (input) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

                if (json.length === 0) return alert('表格为空');
                if (!confirm(`解析到 ${json.length} 条账号数据，确定要导入云端吗？`)) return;

                UI.loading(true, '正在批量创建云端账号...');

                const roleMap = {
                    科任教师: 'teacher', 教师: 'teacher',
                    班主任: 'class_teacher',
                    级部主任: 'grade_director', 年级主任: 'grade_director',
                    家长: 'parent', 学生: 'parent',
                    教务主任: 'director',
                    管理员: 'admin'
                };

                const batchData = [];

                json.forEach(row => {
                    const roleCN = row['角色'] || '';
                    const role = roleMap[roleCN.trim()] || 'teacher';
                    const user = row['姓名/账号'] || row['姓名'];
                    const pass = row['密码'] || '123456';
                    const school = row['学校'] || window.MY_SCHOOL || '默认学校';
                    const cls = row['班级'] ? String(row['班级']).trim() : '';
                    const grade = row['级部(年级)'] ? String(row['级部(年级)']).trim() : '';

                    if (user) {
                        batchData.push({
                            username: user,
                            password: pass.toString(),
                            role,
                            school,
                            class_name: role === 'class_teacher' || role === 'parent'
                                ? cls
                                : (role === 'grade_director' ? grade : '')
                        });
                    }
                });

                if (!window.EdgeGateway || typeof EdgeGateway.upsertAccounts !== 'function') {
                    throw new Error('账号网关未就绪');
                }
                await EdgeGateway.upsertAccounts(batchData);

                UI.loading(false);
                if (window.Auth && typeof window.Auth.refreshCloudAccountMigrationStatus === 'function') {
                    window.Auth.refreshCloudAccountMigrationStatus();
                }
                alert(`✅ 成功导入 ${batchData.length} 个账号！`);
                input.value = '';
            } catch (err) {
                UI.loading(false);
                alert('导入失败：' + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    }
};

function toggleAdminManualInput() {
    const role = document.getElementById('manual-role').value;
    const clsWrap = document.getElementById('manual-class-wrap');
    const clsInput = document.getElementById('manual-class');
    const nameInp = document.getElementById('manual-name');
    const schoolInp = document.getElementById('manual-school');
    const gradeInp = document.getElementById('manual-grade');

    clsWrap.style.display = 'none';
    gradeInp.style.display = 'none';
    schoolInp.style.display = 'block';

    if (role === 'parent') {
        clsWrap.style.display = 'block';
        clsInput.placeholder = '输入班级 (如: 701，家长必填)';
        nameInp.placeholder = '学生姓名';
    } else if (role === 'class_teacher') {
        clsWrap.style.display = 'block';
        clsInput.placeholder = '管理班级 (如: 701)';
        nameInp.placeholder = '班主任姓名';
    } else if (role === 'grade_director') {
        gradeInp.style.display = 'block';
        nameInp.placeholder = '主任姓名';
    } else if (role === 'director') {
        nameInp.placeholder = '主任姓名';
    } else if (role === 'admin') {
        schoolInp.style.display = 'none';
        nameInp.placeholder = '管理员账号';
    } else {
        nameInp.placeholder = '教师姓名';
    }
}

async function changeAdminPass() {
    const p = document.getElementById('new-admin-pass').value.trim();
    if (!p) return alert('密码不能为空');

    if (typeof Auth !== 'undefined') {
        const maskedPassword = window.AuthState?.MASKED_PASSWORD_DISPLAY || '已设置(不显示明文)';
        Auth.db.admin.pass = maskedPassword;
        if (window.AuthState && typeof window.AuthState.persistLocalAuthDb === 'function') {
            Auth.db = window.AuthState.persistLocalAuthDb(Auth.db);
        } else if (typeof persistLocalAuthDb === 'function') {
            Auth.db = persistLocalAuthDb(Auth.db);
        } else {
            localStorage.setItem('SYS_USERS', JSON.stringify(Auth.db));
        }
    }

    if (window.EdgeGateway && typeof EdgeGateway.resetAccountPassword === 'function') {
        const loader = document.getElementById('global-loader');
        const txt = document.getElementById('loader-text');
        if (loader) {
            loader.classList.remove('hidden');
            if (txt) txt.innerText = '正在更新云端密码...';
        }

        try {
            await EdgeGateway.resetAccountPassword('admin', p);
            if (loader) loader.classList.add('hidden');
            if (window.Auth && typeof window.Auth.refreshCloudAccountMigrationStatus === 'function') {
                window.Auth.refreshCloudAccountMigrationStatus();
            }
            alert('✅ 管理员密码已修改！\n本地与云端已同步更新。');
            document.getElementById('new-admin-pass').value = '';
        } catch (err) {
            if (loader) loader.classList.add('hidden');
            alert('❌ 程序异常：' + err.message);
        }
    } else {
        alert('⚠️ 账号网关未连接，无法修改管理员密码。');
    }
}

function openUserPasswordModal(isForced = false) {
    const user = window.AuthState?.getCurrentUser ? window.AuthState.getCurrentUser() : JSON.parse(sessionStorage.getItem('CURRENT_USER'));
    if (!user) return alert('未检测到登录用户，请刷新页面。');

    document.getElementById('upm-old').value = '';
    document.getElementById('upm-new').value = '';
    document.getElementById('upm-confirm').value = '';

    const modal = document.getElementById('user-password-modal');
    const closeBtn = modal.querySelector('button[onclick*="none"]');

    if (isForced) {
        if (closeBtn) closeBtn.style.display = 'none';
        modal.onclick = (e) => e.stopPropagation();
    } else {
        if (closeBtn) closeBtn.style.display = 'block';
        modal.onclick = (e) => {
            if (e.target === modal) modal.style.display = 'none';
        };
    }

    modal.style.display = 'flex';
}

async function submitUserPasswordChange() {
    if (!window.EdgeGateway || typeof EdgeGateway.changeOwnPassword !== 'function') {
        return alert('❌ 账号网关未连接，无法修改密码。');
    }

    const user = window.AuthState?.getCurrentUser ? window.AuthState.getCurrentUser() : JSON.parse(sessionStorage.getItem('CURRENT_USER'));
    if (!user) return alert('未检测到登录用户，请刷新重试。');

    const oldPass = document.getElementById('upm-old').value.trim();
    const newPass = document.getElementById('upm-new').value.trim();
    const confirmPass = document.getElementById('upm-confirm').value.trim();

    if (!oldPass || !newPass) return alert('密码不能为空');
    if (newPass !== confirmPass) return alert('两次输入的新密码不一致');
    if (newPass.length < 6) return alert('新密码长度至少需要 6 位，建议使用字母+数字组合');
    if (oldPass === newPass) return alert('新密码不能与旧密码相同');

    UI.loading(true, '正在验证并更新密码...');

    try {
        await EdgeGateway.changeOwnPassword(oldPass, newPass);
        UI.loading(false);
        alert('✅ 密码修改成功！\n\n为了安全起见，请使用新密码重新登录。');
        document.getElementById('user-password-modal').style.display = 'none';
        Auth.logout();
    } catch (e) {
        UI.loading(false);
        console.error(e);
        alert('❌ 修改失败：' + e.message);
    }
}

window.AccountExcel = AccountExcel;
window.toggleAdminManualInput = toggleAdminManualInput;
window.changeAdminPass = changeAdminPass;
window.openUserPasswordModal = openUserPasswordModal;
window.submitUserPasswordChange = submitUserPasswordChange;
