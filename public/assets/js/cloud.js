// ✅ 统一云端同步逻辑 (重构版)
        const CloudManager = {
            check: () => {
                if (!sbClient) {
                    if (window.UI) UI.toast("云端未连接 (Supabase Disconnected)", "error");
                    return false;
                }
                return true;
            },

            getKey: () => {
                if (window.CloudSnapshotService && typeof window.CloudSnapshotService.getSnapshotKey === 'function') {
                    return window.CloudSnapshotService.getSnapshotKey({
                        getExamMeta: () => (typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {})
                    });
                }
                return null;
            },

            save: async function() {
                if (!this.check()) return;
                if (window.CloudSnapshotService && typeof window.CloudSnapshotService.saveSnapshot === 'function') {
                    return window.CloudSnapshotService.saveSnapshot({
                        sbClient,
                        key: this.getKey(),
                        getExamMeta: () => (typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {})
                    });
                }
            },

            load: async function() {
                if (!this.check()) return;
                if (window.CloudSnapshotService && typeof window.CloudSnapshotService.loadSnapshot === 'function') {
                    return window.CloudSnapshotService.loadSnapshot({
                        sbClient,
                        key: this.getKey() || localStorage.getItem('CURRENT_PROJECT_KEY'),
                        getExamMeta: () => (typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {})
                    });
                }
            },

            // 教师任课：学期级同步
            getTeacherKey: () => {
                if (window.CloudTeacherSyncService && typeof window.CloudTeacherSyncService.getTeacherKey === 'function') {
                    return window.CloudTeacherSyncService.getTeacherKey({
                        termSelect: document.getElementById('dm-teacher-term-select'),
                        cohortId: window.CURRENT_COHORT_ID || window.CURRENT_COHORT_META?.id || localStorage.getItem('CURRENT_COHORT_ID'),
                        getExamMeta: () => (typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {})
                    });
                }
                return null;
            },

            saveTeachers: async function() {
                console.log('[TeacherSync] 开始执行 saveTeachers...');
                if (!sbClient && typeof window.initSupabase === 'function') window.initSupabase();
                if (!this.check()) {
                    console.error('[TeacherSync] Supabase 未连接');
                    alert('云端服务未连接，无法保存');
                    return false;
                }
                if (window.CloudTeacherSyncService && typeof window.CloudTeacherSyncService.saveTeachers === 'function') {
                    return window.CloudTeacherSyncService.saveTeachers({
                        sbClient,
                        key: this.getTeacherKey(),
                        cohortId: window.CURRENT_COHORT_ID || window.CURRENT_COHORT_META?.id || localStorage.getItem('CURRENT_COHORT_ID'),
                        termSelect: document.getElementById('dm-teacher-term-select'),
                        teacherMap: window.TEACHER_MAP || {},
                        teacherSchoolMap: window.TEACHER_SCHOOL_MAP || {},
                        getExamMeta: () => (typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {})
                    });
                }
                return false;
            },

            loadTeachers: async function() {
                if (!sbClient && typeof window.initSupabase === 'function') window.initSupabase();
                if (!this.check()) return;
                if (window.CloudTeacherSyncService && typeof window.CloudTeacherSyncService.loadTeachers === 'function') {
                    return window.CloudTeacherSyncService.loadTeachers({
                        sbClient,
                        key: this.getTeacherKey(),
                        cohortId: window.CURRENT_COHORT_ID || window.CURRENT_COHORT_META?.id || localStorage.getItem('CURRENT_COHORT_ID'),
                        termSelect: document.getElementById('dm-teacher-term-select'),
                        getExamMeta: () => (typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {})
                    });
                }
            },

            // 🆕 跨考试检索学生历次成绩 (自动对比核心)
            fetchStudentExamHistory: async function(student) {
                if (!this.check()) return { success: false, message: '云端未连接' };
                if (window.CloudExamSyncService && typeof window.CloudExamSyncService.fetchStudentExamHistory === 'function') {
                    return window.CloudExamSyncService.fetchStudentExamHistory({
                        sbClient,
                        student,
                        cohortId: student?.cohort || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID')
                    });
                }
                return { success: false, message: 'CloudExamSyncService 未初始化' };
            },

            // 从云端拉取该届所有历史考试快照，填充到本地 COHORT_DB.exams（对比期数核心）
            fetchCohortExamsToLocal: async function(cohortId) {
                if (!this.check()) return { success: false, message: '云端未连接' };
                if (window.CloudExamSyncService && typeof window.CloudExamSyncService.fetchCohortExamsToLocal === 'function') {
                    return window.CloudExamSyncService.fetchCohortExamsToLocal({
                        sbClient,
                        cohortId,
                        db: (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null
                    });
                }
                return { success: false, message: 'CloudExamSyncService 未初始化' };
            }
        };

        window.CloudManager = CloudManager;
        window.saveCloudData = () => CloudManager.save();
        window.loadCloudData = () => CloudManager.load();
        window.getUniqueExamKey = () => CloudManager.getKey();
        window.saveCloudSnapshot = () => {};
        
        // 🟢 [修复] 页面加载完成后检查关键库
        window.addEventListener('DOMContentLoaded', function() {
            setTimeout(() => {
                if (typeof XLSX === 'undefined') {
                    console.error('❌ XLSX库加载失败，Excel导入导出功能将不可用');
                } else {
                    console.log('✅ XLSX库加载成功，版本:', XLSX.version);
                }
                
                // 🆕 多角色系统初始化
                console.log('%c🎭 多角色权限系统已启用', 'color: #10b981; font-weight: bold; font-size: 14px;');
                console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #e5e7eb;');
                console.log('%c如何设置多角色：', 'color: #3b82f6; font-weight: bold;');
                console.log('1. 在账号管理中，修改用户数据，将 role 字段保留，并添加 roles 数组');
                console.log('2. 例如：{ "role": "teacher", "roles": ["teacher", "class_teacher", "director"] }');
                console.log('3. 用户将拥有所有角色的权限并集（累加，不覆盖）');
                console.log('%c角色优先级（从高到低）：', 'color: #f59e0b; font-weight: bold;');
                console.log('admin > director > grade_director > class_teacher > teacher > parent > guest');
                console.log('%cテスト工具（控制台输入）：', 'color: #8b5cf6; font-weight: bold;');
                console.log('• RoleManager.showCurrentPermissions() - 查看当前用户权限');
                console.log('• RoleManager.addRoleToCurrentUser("director") - 临时添加角色（测试用）');
                console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #e5e7eb;');
                
                // 确保依赖函数已定义
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

        });