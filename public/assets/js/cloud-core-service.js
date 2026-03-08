(function() {
    function ensureSupabase(initFn) {
        if (!window.sbClient && typeof initFn === 'function') {
            initFn();
        }
        return window.sbClient || null;
    }

    function checkConnection(sbClient) {
        if (!sbClient) {
            if (window.UI) UI.toast('云端未连接(Supabase Disconnected)', 'error');
            return false;
        }
        return true;
    }

    function attachGlobals(manager) {
        window.CloudManager = manager;
        window.saveCloudData = () => manager.save();
        window.loadCloudData = () => manager.load();
        window.getUniqueExamKey = () => manager.getKey();
        window.saveCloudSnapshot = () => {};
    }

    function runStartupDiagnostics() {
        setTimeout(() => {
            if (typeof XLSX === 'undefined') {
                console.error('XLSX库加载失败，Excel导入导出功能将不可用');
            } else {
                console.log('XLSX库加载成功，版本:', XLSX.version);
            }

            console.log('%c多角色权限系统已启用', 'color: #10b981; font-weight: bold; font-size: 14px;');
            console.log('%c如何设置多角色：', 'color: #3b82f6; font-weight: bold;');
            console.log('1. 在账号管理中，修改用户数据，保留 role 字段，并添加 roles 数组');
            console.log('2. 例如：{ "role": "teacher", "roles": ["teacher", "class_teacher", "director"] }');
            console.log('3. 用户将拥有所有角色的权限并叠加');
            console.log('%c角色优先级（从高到低）：', 'color: #f59e0b; font-weight: bold;');
            console.log('admin > director > grade_director > class_teacher > teacher > parent > guest');
            console.log('%c测试工具（控制台输入）：', 'color: #8b5cf6; font-weight: bold;');
            console.log('RoleManager.showCurrentPermissions() - 查看当前用户权限');
            console.log('RoleManager.addRoleToCurrentUser("director") - 临时添加角色（测试用）');

            if (typeof updateStatusPanel === 'function') updateStatusPanel();
            if (typeof updateRoleHint === 'function') updateRoleHint();
            if (typeof renderActionLogs === 'function') renderActionLogs();
            if (typeof scanDataIssues === 'function') scanDataIssues();
            if (!localStorage.getItem('HAS_SEEN_STARTER') && typeof switchTab === 'function' && typeof openStarterGuide === 'function') {
                if (typeof __guardBypass !== 'undefined') __guardBypass = true;
                switchTab('starter-hub');
                openStarterGuide();
            }
            if (typeof scheduleTeacherSyncPrompt === 'function') scheduleTeacherSyncPrompt();
        }, 1000);
    }

    function registerStartupDiagnostics() {
        window.addEventListener('DOMContentLoaded', runStartupDiagnostics);
    }

    window.CloudCoreService = {
        ensureSupabase,
        checkConnection,
        attachGlobals,
        runStartupDiagnostics,
        registerStartupDiagnostics
    };
})();