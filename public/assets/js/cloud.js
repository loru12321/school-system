// 统一云端门面：具体能力已拆分到独立服务
        const parseTeacherCloudKey = (key) => {
            const match = String(key || '').match(/^TEACHERS_(\d+)级_(\d{4})-(\d{4})_(上学期|下学期)$/);
            if (!match) return null;
            return {
                cohortId: match[1],
                startYear: parseInt(match[2], 10),
                endYear: parseInt(match[3], 10),
                term: match[4],
                baseTerm: `${match[2]}-${match[3]}_${match[4]}`
            };
        };

        const getTeacherTermAnchor = (meta) => {
            if (!meta) return Number.MAX_SAFE_INTEGER;
            const anchor = meta.term === '上学期'
                ? new Date(meta.startYear, 8, 1)
                : new Date(meta.endYear, 1, 15);
            return anchor.getTime();
        };

        const pickNearestTeacherCloudRow = (rows) => {
            const now = Date.now();
            return (rows || [])
                .map(row => ({ row, meta: parseTeacherCloudKey(row?.key) }))
                .filter(item => item.meta)
                .sort((a, b) => {
                    const diffA = Math.abs(getTeacherTermAnchor(a.meta) - now);
                    const diffB = Math.abs(getTeacherTermAnchor(b.meta) - now);
                    if (diffA !== diffB) return diffA - diffB;
                    return new Date(b.row?.updated_at || 0).getTime() - new Date(a.row?.updated_at || 0).getTime();
                })[0] || null;
        };
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

            getTeacherKey: (options = {}) => {
                if (window.CloudTeacherSyncService && typeof window.CloudTeacherSyncService.getTeacherKey === 'function') {
                    return window.CloudTeacherSyncService.getTeacherKey({
                        ...options,
                        termSelect: options.termSelect || document.getElementById('dm-teacher-term-select'),
                        cohortId: options.cohortId || window.CURRENT_COHORT_ID || window.CURRENT_COHORT_META?.id || localStorage.getItem('CURRENT_COHORT_ID'),
                        getExamMeta: options.getExamMeta || (() => (typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {}))
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

            loadTeachers: async function(options = {}) {
                if (window.CloudCoreService && typeof window.CloudCoreService.ensureSupabase === 'function') {
                    sbClient = window.CloudCoreService.ensureSupabase(window.initSupabase) || sbClient;
                } else if (!sbClient && typeof window.initSupabase === 'function') {
                    window.initSupabase();
                    sbClient = window.sbClient || sbClient;
                }
                if (!this.check()) return { success: false, message: '云端未连接' };
                if (window.CloudTeacherSyncService && typeof window.CloudTeacherSyncService.loadTeachers === 'function') {
                    const cohortId = options.cohortId || window.CURRENT_COHORT_ID || window.CURRENT_COHORT_META?.id || localStorage.getItem('CURRENT_COHORT_ID');
                    const termSelect = options.termSelect || document.getElementById('dm-teacher-term-select');
                    let resolvedKey = options.key || null;
                    let resolvedTermId = options.termId || '';

                    if (options.preferNearestToNow && cohortId) {
                        const likePattern = `TEACHERS_${cohortId}级_%`;
                        const { data: rows, error } = await sbClient
                            .from('system_data')
                            .select('key,updated_at')
                            .like('key', likePattern)
                            .order('updated_at', { ascending: false })
                            .limit(50);
                        if (error) {
                            console.warn('查询最近任课表失败:', error);
                        } else {
                            const picked = pickNearestTeacherCloudRow(rows);
                            if (picked) {
                                resolvedKey = picked.row.key;
                                resolvedTermId = picked.meta.baseTerm;
                                localStorage.setItem('CURRENT_TERM_ID', resolvedTermId);
                                if (termSelect) {
                                    const matched = Array.from(termSelect.options || []).find(option => option.value === resolvedTermId || option.value.startsWith(resolvedTermId + '_'));
                                    if (matched) termSelect.value = matched.value;
                                }
                            }
                        }
                    }

                    return window.CloudTeacherSyncService.loadTeachers({
                        ...options,
                        sbClient,
                        key: resolvedKey || this.getTeacherKey({ ...options, cohortId, termSelect }),
                        termId: resolvedTermId,
                        cohortId,
                        termSelect,
                        getExamMeta: options.getExamMeta || (() => (typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {}))
                    });
                }
                return { success: false, message: 'CloudTeacherSyncService 未初始化' };
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

