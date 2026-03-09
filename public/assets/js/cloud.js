(function () {
    const CLOUD_TABLE = 'system_data';
    const KEY_PREFIX_TEACHERS = 'TEACHERS_';
    const KEY_PREFIX_COMPARE = [
        'STUDENT_COMPARE_',
        'MACRO_COMPARE_',
        'TEACHER_COMPARE_',
        'TOWN_SUB_COMPARE_'
    ];

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function safeToast(msg, type) {
        if (window.UI && typeof UI.toast === 'function') UI.toast(msg, type);
    }

    function safeLoading(show, text) {
        if (window.UI && typeof UI.loading === 'function') UI.loading(show, text);
    }

    function normalizeCohortId(raw) {
        return String(raw || '').replace(/\D/g, '');
    }

    function extractCohortIdFromKey(key) {
        const match = String(key || '').match(/^(\d{4})\D*_/);
        return match ? match[1] : '';
    }

    function isIgnoredExamKey(key) {
        const k = String(key || '');
        if (!k) return true;
        if (k.startsWith(KEY_PREFIX_TEACHERS)) return true;
        if (KEY_PREFIX_COMPARE.some(prefix => k.startsWith(prefix))) return true;
        return false;
    }

    function parsePayload(content) {
        let raw = content;
        if (typeof raw === 'string' && raw.startsWith('LZ|')) {
            raw = LZString.decompressFromUTF16(raw.slice(3));
        }
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }

    function packPayload(payload) {
        const json = JSON.stringify(payload || {});
        return 'LZ|' + LZString.compressToUTF16(json);
    }

    function getCurrentUserRole() {
        return sessionStorage.getItem('CURRENT_ROLE') || 'guest';
    }

    const CloudManager = {
        check: (silent = false) => {
            if (!window.sbClient) {
                if (!silent) safeToast('云端未连接 (Supabase Disconnected)', 'error');
                return false;
            }
            return true;
        },

        ensureClientReady: async function (options = {}) {
            const timeoutMs = Number(options.timeoutMs || 8000);
            const retryMs = Number(options.retryMs || 250);
            const silent = Boolean(options.silent);

            if (this.check(true)) return true;
            if (typeof window.initSupabase === 'function') window.initSupabase();

            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                if (this.check(true)) return true;
                await sleep(retryMs);
                if (typeof window.initSupabase === 'function') window.initSupabase();
            }

            return this.check(silent);
        },

        getKey: () => {
            const meta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
            if (!meta.cohortId || !meta.year || !meta.term || !meta.type) return null;
            const parts = [
                `${meta.cohortId}级`,
                meta.grade ? `${meta.grade}年级` : '未知年级',
                meta.year,
                meta.term,
                meta.type,
                meta.name || '标准考试'
            ];
            return parts.join('_').replace(/[\s\/\\?]/g, '');
        },

        getTeacherKey: () => {
            const termSel = document.getElementById('dm-teacher-term-select');
            const meta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
            const termId = termSel?.value || localStorage.getItem('CURRENT_TERM_ID') || (typeof getTermId === 'function' ? getTermId(meta) : '');
            const cohortId = window.CURRENT_COHORT_ID || window.CURRENT_COHORT_META?.id || meta.cohortId || localStorage.getItem('CURRENT_COHORT_ID');
            if (!termId || !cohortId) return null;
            return `${KEY_PREFIX_TEACHERS}${cohortId}级_${termId}`;
        },

        save: async function () {
            if (!(await this.ensureClientReady())) return false;

            const role = getCurrentUserRole();
            if (!['admin', 'director', 'grade_director'].includes(role)) {
                safeToast('权限不足', 'warning');
                return false;
            }

            const key = this.getKey();
            if (!key) {
                alert('请先完善考试信息');
                return false;
            }

            safeLoading(true, '正在同步云端数据...');
            try {
                if (!window.SYS_VARS) window.SYS_VARS = { indicator: { ind1: '', ind2: '' }, targets: {} };
                const ind1 = document.getElementById('dm_ind1_input');
                const ind2 = document.getElementById('dm_ind2_input');
                if (ind1) window.SYS_VARS.indicator.ind1 = ind1.value;
                if (ind2) window.SYS_VARS.indicator.ind2 = ind2.value;
                window.SYS_VARS.targets = window.TARGETS || {};

                const payload = typeof getCurrentSnapshotPayload === 'function' ? getCurrentSnapshotPayload() : {};
                const content = packPayload(payload);

                const { error } = await window.sbClient.from(CLOUD_TABLE).upsert({
                    key,
                    content,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
                if (error) throw error;

                localStorage.setItem('CURRENT_PROJECT_KEY', key);
                localStorage.setItem('CLOUD_SYNC_AT', new Date().toISOString());
                if (window.idbKeyval) await idbKeyval.set(`cache_${key}`, payload);
                if (typeof logAction === 'function') logAction('云端同步', `全量数据已同步：${key}`);
                if (typeof updateStatusPanel === 'function') updateStatusPanel();
                safeToast('云端同步成功', 'success');
                return true;
            } catch (e) {
                console.error('Cloud save error:', e);
                alert(`同步失败: ${e.message || e}`);
                return false;
            } finally {
                safeLoading(false);
            }
        },

        load: async function () {
            if (!(await this.ensureClientReady())) return false;

            let key = this.getKey() || localStorage.getItem('CURRENT_PROJECT_KEY');
            if (!key) {
                const { data: rows, error } = await window.sbClient
                    .from(CLOUD_TABLE)
                    .select('key,updated_at')
                    .not('key', 'like', 'TEACHERS_%')
                    .not('key', 'like', 'STUDENT_COMPARE_%')
                    .order('updated_at', { ascending: false })
                    .limit(1);
                if (error) throw error;
                key = rows?.[0]?.key || null;
                if (key) localStorage.setItem('CURRENT_PROJECT_KEY', key);
            }

            if (!key) return false;

            safeToast('正在检查云端数据...', 'info');
            try {
                const { data, error } = await window.sbClient
                    .from(CLOUD_TABLE)
                    .select('content')
                    .eq('key', key)
                    .maybeSingle();
                if (error) throw error;
                if (!data) return false;

                const payload = parsePayload(data.content);
                if (typeof applySnapshotPayload === 'function') applySnapshotPayload(payload);
                if (typeof logAction === 'function') logAction('云端加载', `已加载全量数据：${key}`);
                safeToast('数据已同步到本地', 'success');
                return true;
            } catch (e) {
                console.error('Cloud load error:', e);
                safeToast('加载失败', 'error');
                return false;
            }
        },

        saveTeachers: async function () {
            if (!(await this.ensureClientReady())) return false;
            const key = this.getTeacherKey();
            if (!key) {
                safeToast('无法确定学期或年级信息', 'error');
                return false;
            }
            if (!window.TEACHER_MAP || Object.keys(window.TEACHER_MAP).length === 0) {
                safeToast('当前无任课数据', 'warning');
                return false;
            }

            safeLoading(true, '正在同步任课数据...');
            try {
                const content = packPayload({
                    map: window.TEACHER_MAP || {},
                    schoolMap: window.TEACHER_SCHOOL_MAP || {}
                });
                const { error } = await window.sbClient.from(CLOUD_TABLE).upsert({
                    key,
                    content,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'key' });
                if (error) throw error;

                localStorage.setItem('TEACHER_SYNC_AT', new Date().toISOString());
                if (typeof logAction === 'function') logAction('任课同步', `任课表已保存：${key}`);
                if (window.DataManager && typeof DataManager.refreshTeacherAnalysis === 'function') {
                    DataManager.refreshTeacherAnalysis();
                }
                if (typeof updateStatusPanel === 'function') updateStatusPanel();
                safeToast('任课表同步成功', 'success');
                return true;
            } catch (e) {
                console.error('Teacher save error:', e);
                alert(`任课同步失败: ${e.message || e}`);
                return false;
            } finally {
                safeLoading(false);
            }
        },

        loadTeachers: async function () {
            if (!(await this.ensureClientReady())) return false;
            safeLoading(true, '正在从云端拉取任课表...');
            try {
                let key = this.getTeacherKey();
                let row = null;

                if (key) {
                    const { data, error } = await window.sbClient.from(CLOUD_TABLE).select('key,content,updated_at').eq('key', key).maybeSingle();
                    if (error) throw error;
                    row = data || null;
                }

                if (!row) {
                    const cohortId = normalizeCohortId(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID'));
                    let query = window.sbClient
                        .from(CLOUD_TABLE)
                        .select('key,content,updated_at')
                        .like('key', `${KEY_PREFIX_TEACHERS}%`)
                        .order('updated_at', { ascending: false })
                        .limit(20);

                    if (cohortId) {
                        query = window.sbClient
                            .from(CLOUD_TABLE)
                            .select('key,content,updated_at')
                            .like('key', `${KEY_PREFIX_TEACHERS}${cohortId}%`)
                            .order('updated_at', { ascending: false })
                            .limit(20);
                    }

                    const { data: rows, error } = await query;
                    if (error) throw error;
                    row = rows?.[0] || null;
                    key = row?.key || key;
                }

                if (!row || !row.content) {
                    safeToast('未找到可用任课表', 'warning');
                    return false;
                }

                const parsed = parsePayload(row.content) || {};
                const map = parsed.map && typeof parsed.map === 'object' ? parsed.map : {};
                const schoolMap = parsed.schoolMap && typeof parsed.schoolMap === 'object' ? parsed.schoolMap : {};

                if (typeof setTeacherMap === 'function') setTeacherMap(map);
                if (typeof setTeacherSchoolMap === 'function') setTeacherSchoolMap(schoolMap);
                if (window.DataManager && typeof DataManager.renderTeachers === 'function') DataManager.renderTeachers();
                if (window.DataManager && typeof DataManager.refreshTeacherAnalysis === 'function') DataManager.refreshTeacherAnalysis();
                if (typeof updateStatusPanel === 'function') updateStatusPanel();

                safeToast(`已加载任课表（${Object.keys(map).length} 条）`, 'success');
                if (typeof logAction === 'function') logAction('任课同步', `任课表已加载：${key || 'latest'}`);
                return true;
            } catch (e) {
                console.error('Teacher load error:', e);
                safeToast('任课表加载失败', 'error');
                return false;
            } finally {
                safeLoading(false);
            }
        },

        fetchStudentExamHistory: async function (student) {
            if (!(await this.ensureClientReady())) return { success: false, message: '云端未连接' };
            if (!student || !student.name) return { success: false, message: '学生信息无效' };

            const cohortId = normalizeCohortId(student.cohort || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID'));
            if (!cohortId) return { success: false, message: '无法确定学生届别' };

            try {
                const { data, error } = await window.sbClient
                    .from(CLOUD_TABLE)
                    .select('key, content, updated_at')
                    .like('key', `${cohortId}%`)
                    .order('updated_at', { ascending: true });
                if (error) throw error;

                const rows = (data || []).filter(row => !isIgnoredExamKey(row.key));
                const targetName = String(student.name || '').trim();
                const targetClassNum = String(student.class || '').replace(/[^0-9]/g, '');
                const history = [];

                for (const row of rows) {
                    try {
                        const payload = parsePayload(row.content) || {};
                        let match = null;

                        const schools = payload.SCHOOLS || {};
                        for (const [schoolName, schoolData] of Object.entries(schools)) {
                            if (student.school && schoolName !== student.school) continue;
                            const list = Array.isArray(schoolData?.students) ? schoolData.students : [];
                            match = list.find(s => {
                                if (String(s?.name || '').trim() !== targetName) return false;
                                if (!targetClassNum) return true;
                                return String(s?.class || '').replace(/[^0-9]/g, '') === targetClassNum;
                            });
                            if (match) break;
                        }

                        if (!match) {
                            const list = payload.students || payload.RAW_DATA || [];
                            match = list.find(s => {
                                if (String(s?.name || '').trim() !== targetName) return false;
                                if (!targetClassNum) return true;
                                return String(s?.class || '').replace(/[^0-9]/g, '') === targetClassNum;
                            });
                        }

                        if (!match) continue;

                        const keyParts = String(row.key || '').split('_');
                        const examLabel = keyParts.length >= 5 ? keyParts.slice(4).join('_') : row.key;

                        history.push({
                            // Use full key as canonical ID to avoid "same exam" false positives.
                            examId: row.key,
                            examFullKey: row.key,
                            examLabel: examLabel || row.key,
                            total: match.total,
                            rankClass: match.ranks?.total?.class,
                            rankSchool: match.ranks?.total?.school,
                            rankTown: match.ranks?.total?.township,
                            subjectRanks: match.ranks || {},
                            scores: match.scores,
                            updatedAt: row.updated_at
                        });
                    } catch (rowErr) {
                        console.warn('[CloudHistory] parse row failed:', rowErr);
                    }
                }

                return { success: true, data: history };
            } catch (e) {
                console.error('[CloudHistory] failed:', e);
                return { success: false, message: e.message || String(e) };
            }
        },

        fetchCohortExamsToLocal: async function (cohortId) {
            if (!(await this.ensureClientReady())) return { success: false, message: '云端未连接' };
            const cid = normalizeCohortId(cohortId || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID'));
            if (!cid) return { success: false, message: '无法确定届别' };
            if (typeof CohortDB === 'undefined' || typeof CohortDB.ensure !== 'function') {
                return { success: false, message: 'CohortDB 未初始化' };
            }

            const db = CohortDB.ensure();
            db.exams = db.exams || {};

            const refreshSelectors = () => {
                if (typeof CohortDB.renderExamList === 'function') CohortDB.renderExamList();
                if (typeof updateMacroMultiExamSelects === 'function') updateMacroMultiExamSelects();
                if (typeof updateTeacherMultiExamSelects === 'function') updateTeacherMultiExamSelects();
                if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
                if (typeof updateProgressMultiExamSelects === 'function') updateProgressMultiExamSelects();
            };

            try {
                const cacheKey = `CLOUD_EXAMS_SYNC_TS_${cid}`;
                const lastSyncTs = Number(localStorage.getItem(cacheKey) || 0);
                const recent = Date.now() - lastSyncTs < 3 * 60 * 1000;
                if (recent) {
                    refreshSelectors();
                    return { success: true, count: 0, skipped: true, reason: 'cache-hit' };
                }

                const { data: rows, error } = await window.sbClient
                    .from(CLOUD_TABLE)
                    .select('key, content, updated_at')
                    .like('key', `${cid}%`)
                    .order('updated_at', { ascending: true });
                if (error) throw error;

                let loadedCount = 0;
                for (const row of (rows || [])) {
                    if (isIgnoredExamKey(row.key)) continue;
                    if (extractCohortIdFromKey(row.key) !== cid) continue;
                    if (db.exams[row.key]) continue;

                    try {
                        const payload = parsePayload(row.content);
                        if (!payload || !Array.isArray(payload.RAW_DATA) || payload.RAW_DATA.length === 0) continue;

                        const keyParts = String(row.key || '').split('_');
                        const examLabel = keyParts.length >= 5 ? keyParts.slice(4).join('_') : row.key;

                        db.exams[row.key] = {
                            examId: row.key,
                            examLabel,
                            meta: payload.ARCHIVE_META || payload.CONFIG || {},
                            data: payload.RAW_DATA || [],
                            schools: payload.SCHOOLS || {},
                            teacherMap: payload.TEACHER_MAP || {},
                            subjects: payload.SUBJECTS || [],
                            thresholds: payload.THRESHOLDS || {},
                            config: payload.CONFIG || {},
                            createdAt: new Date(row.updated_at).getTime() || Date.now()
                        };
                        loadedCount++;
                    } catch (rowErr) {
                        console.warn('[CloudExams] parse row failed:', rowErr);
                    }
                }

                window.COHORT_DB = db;
                localStorage.setItem(cacheKey, String(Date.now()));
                refreshSelectors();

                if (loadedCount > 0) safeToast(`已从云端加载 ${loadedCount} 期历史考试`, 'success');
                return { success: true, count: loadedCount };
            } catch (e) {
                console.error('[CloudExams] failed:', e);
                return { success: false, message: e.message || String(e) };
            }
        }
    };

    window.CloudManager = CloudManager;
    window.saveCloudData = () => CloudManager.save();

    let cloudLoadPromise = null;
    window.loadCloudData = () => {
        if (cloudLoadPromise) return cloudLoadPromise;
        cloudLoadPromise = Promise.resolve(CloudManager.load()).finally(() => {
            cloudLoadPromise = null;
        });
        return cloudLoadPromise;
    };

    window.getUniqueExamKey = () => CloudManager.getKey();
    window.saveCloudSnapshot = () => {};

    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
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
        }, 800);
    });
})();
