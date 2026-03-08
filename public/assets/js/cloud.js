// 统一云端门面：具体能力已拆分到独立服务
        const CloudManager = {
            check: () => {
                if (window.CloudCoreService && typeof window.CloudCoreService.checkConnection === 'function') {
                    return window.CloudCoreService.checkConnection(sbClient);
                }
                return !!sbClient;
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
                if (window.CloudCoreService && typeof window.CloudCoreService.ensureSupabase === 'function') {
                    sbClient = window.CloudCoreService.ensureSupabase(window.initSupabase) || sbClient;
                } else if (!sbClient && typeof window.initSupabase === 'function') {
                    window.initSupabase();
                    sbClient = window.sbClient || sbClient;
                }
                if (!this.check()) return false;
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
                if (window.CloudCoreService && typeof window.CloudCoreService.ensureSupabase === 'function') {
                    sbClient = window.CloudCoreService.ensureSupabase(window.initSupabase) || sbClient;
                } else if (!sbClient && typeof window.initSupabase === 'function') {
                    window.initSupabase();
                    sbClient = window.sbClient || sbClient;
                }
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

        if (window.CloudCoreService && typeof window.CloudCoreService.attachGlobals === 'function') {
            window.CloudCoreService.attachGlobals(CloudManager);
        } else {
            window.CloudManager = CloudManager;
            window.saveCloudData = () => CloudManager.save();
            window.loadCloudData = () => CloudManager.load();
            window.getUniqueExamKey = () => CloudManager.getKey();
            window.saveCloudSnapshot = () => {};
        }

        if (window.CloudCoreService && typeof window.CloudCoreService.registerStartupDiagnostics === 'function') {
            window.CloudCoreService.registerStartupDiagnostics();
        }