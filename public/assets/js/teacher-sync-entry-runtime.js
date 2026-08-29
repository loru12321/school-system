(() => {
    if (typeof window === 'undefined' || window.__TEACHER_SYNC_ENTRY_RUNTIME__) return;

    async function openTeacherSync() {
        const user = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null;
        const role = user?.role || 'guest';
        const preferredTerm = (typeof window.getPreferredTeacherTermId === 'function'
            ? window.getPreferredTeacherTermId()
            : '') || (typeof window.pickAutoTeacherTerm === 'function'
            ? window.pickAutoTeacherTerm()
            : '');
        const canManageTeachers = role !== 'teacher' && role !== 'class_teacher';
        const openTeacherManager = () => {
            if (!canManageTeachers) return false;
            if (window.DataManager && typeof window.DataManager.open === 'function') {
                window.DataManager.open('teacher');
                return true;
            }
            return false;
        };
        const applyTerm = (termId) => typeof window.applyTeacherTermWithoutPrompt === 'function'
            ? window.applyTeacherTermWithoutPrompt(termId)
            : false;
        const showStatus = () => {
            if (window.DataManager && typeof window.DataManager.renderDataManagerStatus === 'function') {
                window.DataManager.renderDataManagerStatus();
            }
        };
        const toast = (message, type = 'info') => {
            if (window.UI && typeof window.UI.toast === 'function') window.UI.toast(message, type);
        };

        try {
            if (preferredTerm && applyTerm(preferredTerm)) {
                showStatus();
                toast(`已恢复 ${preferredTerm} 的任课表`, 'success');
                openTeacherManager();
                return;
            }

            if (window.CloudManager && typeof window.CloudManager.loadTeachers === 'function') {
                toast(preferredTerm ? `正在同步 ${preferredTerm} 的任课表...` : '正在同步任课表...', 'info');
                await window.CloudManager.loadTeachers();
                if (preferredTerm && applyTerm(preferredTerm)) {
                    showStatus();
                    toast(`已从云端恢复 ${preferredTerm} 的任课表`, 'success');
                    openTeacherManager();
                    return;
                }
                if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) {
                    showStatus();
                    toast('任课表已同步到当前页面', 'success');
                    openTeacherManager();
                    return;
                }
            }

            if (role === 'teacher' || role === 'class_teacher') {
                toast('当前学期暂无可用任课表，请联系管理员在“教师任课”中导入或同步', 'warning');
                return;
            }

            if (!openTeacherManager() && typeof window.switchTab === 'function') {
                window.switchTab('upload');
            }
        } catch (error) {
            console.error('openTeacherSync failed:', error);
            const message = `任课表同步失败：${error?.message || error}`;
            if (window.UI && typeof window.UI.toast === 'function') {
                window.UI.toast(message, 'error');
                return;
            }
            if (typeof window.alert === 'function') window.alert(message);
        }
    }

    window.openTeacherSync = openTeacherSync;
    window.TeacherSyncEntryRuntime = { openTeacherSync };
    window.__TEACHER_SYNC_ENTRY_RUNTIME__ = true;
})();
