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

    function setCloudStatus(state, detail = '') {
        if (typeof window.setCloudSyncStatus === 'function') {
            window.setCloudSyncStatus(state, detail);
        }
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

    function computeExamDataFingerprint(rows) {
        const list = Array.isArray(rows) ? rows : [];
        const normalized = list.map(row => ({
            school: String(row?.school || '').trim(),
            class: String(row?.class || '').trim(),
            name: String(row?.name || '').trim(),
            total: Number(row?.total || 0),
            scores: Object.fromEntries(
                Object.entries(row?.scores || {})
                    .map(([subject, score]) => [String(subject), Number(score)])
                    .sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'zh-CN'))
            )
        })).sort((a, b) => {
            const schoolDiff = a.school.localeCompare(b.school, 'zh-CN');
            if (schoolDiff !== 0) return schoolDiff;
            const classDiff = a.class.localeCompare(b.class, 'zh-CN', { numeric: true });
            if (classDiff !== 0) return classDiff;
            return a.name.localeCompare(b.name, 'zh-CN');
        });

        const json = JSON.stringify(normalized);
        let hash = 2166136261;
        for (let i = 0; i < json.length; i++) {
            hash ^= json.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return `fp_${(hash >>> 0).toString(16)}`;
    }

    function seedCurrentExamToCohortDb(payload, fallbackKey, updatedAt) {
        if (typeof CohortDB === 'undefined' || typeof CohortDB.ensure !== 'function') return;
        const examId = String(payload?.CURRENT_EXAM_ID || fallbackKey || '').trim();
        if (!examId) return;

        const rows = Array.isArray(payload?.RAW_DATA) ? payload.RAW_DATA : [];
        if (!rows.length) return;

        const db = CohortDB.ensure();
        db.exams = db.exams || {};

        const keyParts = examId.split('_');
        const examLabel = keyParts.length >= 5 ? keyParts.slice(4).join('_') : examId;
        const remoteTs = updatedAt ? (new Date(updatedAt).getTime() || Date.now()) : Date.now();
        const existing = db.exams[examId];
        const existingCount = Array.isArray(existing?.data) ? existing.data.length : 0;

        if (!existing || existingCount === 0) {
            db.exams[examId] = {
                examId,
                examLabel,
                meta: payload?.ARCHIVE_META || payload?.CONFIG || {},
                data: rows,
                schools: payload?.SCHOOLS || {},
                teacherMap: payload?.TEACHER_MAP || {},
                subjects: payload?.SUBJECTS || [],
                thresholds: payload?.THRESHOLDS || {},
                config: payload?.CONFIG || {},
                fingerprint: payload?.FINGERPRINT || computeExamDataFingerprint(rows),
                createdAt: remoteTs,
                updatedAt: updatedAt || ''
            };
        }

        db.currentExamId = examId;
        window.COHORT_DB = db;
    }

    async function refreshCompareSelectors() {
        if (typeof CohortDB !== 'undefined' && typeof CohortDB.renderExamList === 'function') CohortDB.renderExamList();
        if (typeof updateMacroMultiExamSelects === 'function') updateMacroMultiExamSelects();
        if (typeof updateTeacherMultiExamSelects === 'function') updateTeacherMultiExamSelects();
        if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
        if (typeof updateProgressMultiExamSelects === 'function') updateProgressMultiExamSelects();
        if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
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

            if (this.check(true)) {
                setCloudStatus('connected');
                return true;
            }
            setCloudStatus('connecting');
            if (typeof window.initSupabase === 'function') window.initSupabase();

            const start = Date.now();
            while (Date.now() - start < timeoutMs) {
                if (this.check(true)) {
                    setCloudStatus('connected');
                    return true;
                }
                await sleep(retryMs);
                if (typeof window.initSupabase === 'function') window.initSupabase();
            }
            const ok = this.check(silent);
            if (!ok) setCloudStatus('error', '连接失败');
            return ok;
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
            setCloudStatus('syncing', '保存中');

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
                setCloudStatus('success', '已保存');
                return true;
            } catch (e) {
                console.error('Cloud save error:', e);
                alert(`同步失败: ${e.message || e}`);
                setCloudStatus('error', e?.message ? String(e.message).slice(0, 24) : '保存失败');
                return false;
            } finally {
                safeLoading(false);
            }
        },

        load: async function () {
            if (!(await this.ensureClientReady())) return false;
            setCloudStatus('syncing', '拉取中');

            let key = this.getKey() || localStorage.getItem('CURRENT_PROJECT_KEY');
            if (!key) {
                try {
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
                } catch (e) {
                    console.error('Cloud load key lookup error:', e);
                    setCloudStatus('error', e?.message ? String(e.message).slice(0, 24) : '加载失败');
                    return false;
                }
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
                seedCurrentExamToCohortDb(payload, key, data.updated_at);
                if (typeof applySnapshotPayload === 'function') applySnapshotPayload(payload);
                const cohortId = normalizeCohortId(payload?.CURRENT_COHORT_ID || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID'));
                if (cohortId && typeof this.fetchCohortExamsToLocal === 'function') {
                    await this.fetchCohortExamsToLocal(cohortId);
                }
                await refreshCompareSelectors();
                if (typeof logAction === 'function') logAction('云端加载', `已加载全量数据：${key}`);
                safeToast('数据已同步到本地', 'success');
                setCloudStatus('success', '已拉取');
                return true;
            } catch (e) {
                console.error('Cloud load error:', e);
                safeToast('加载失败', 'error');
                setCloudStatus('error', e?.message ? String(e.message).slice(0, 24) : '拉取失败');
                return false;
            }
        },

        saveTeachers: async function () {
            if (!(await this.ensureClientReady())) return false;
            setCloudStatus('syncing', '同步任课');
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
                setCloudStatus('success', '任课已同步');
                return true;
            } catch (e) {
                console.error('Teacher save error:', e);
                alert(`任课同步失败: ${e.message || e}`);
                setCloudStatus('error', '任课同步失败');
                return false;
            } finally {
                safeLoading(false);
            }
        },

        loadTeachers: async function () {
            if (!(await this.ensureClientReady())) return false;
            setCloudStatus('syncing', '拉取任课');
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
                setCloudStatus('success', '任课已拉取');
                return true;
            } catch (e) {
                console.error('Teacher load error:', e);
                safeToast('任课表加载失败', 'error');
                setCloudStatus('error', '任课拉取失败');
                return false;
            } finally {
                safeLoading(false);
            }
        },

        fetchStudentExamHistory: async function (student) {
            if (!(await this.ensureClientReady())) return { success: false, message: '云端未连接' };
            setCloudStatus('syncing', '拉取历史');
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
                            fingerprint: payload?.FINGERPRINT || computeExamDataFingerprint(payload?.RAW_DATA || []),
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

                setCloudStatus('success', `历史${history.length}条`);
                return { success: true, data: history };
            } catch (e) {
                console.error('[CloudHistory] failed:', e);
                setCloudStatus('error', '历史拉取失败');
                return { success: false, message: e.message || String(e) };
            }
        },

        fetchCohortExamsToLocal: async function (cohortId) {
            const cid = normalizeCohortId(cohortId || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID'));
            if (!cid) return { success: false, message: '无法确定届别' };
            if (!this._cohortExamSyncTasks) this._cohortExamSyncTasks = {};
            if (this._cohortExamSyncTasks[cid]) return this._cohortExamSyncTasks[cid];

            this._cohortExamSyncTasks[cid] = (async () => {
                if (!(await this.ensureClientReady())) return { success: false, message: '云端未连接' };
                setCloudStatus('syncing', '拉取考试');
                if (typeof CohortDB === 'undefined' || typeof CohortDB.ensure !== 'function') {
                    return { success: false, message: 'CohortDB 未初始化' };
                }

                const db = CohortDB.ensure();
                db.exams = db.exams || {};

                try {
                    const cacheKey = `CLOUD_EXAMS_SYNC_TS_${cid}`;
                    const chunkSize = 10;

                    // Step 1: fetch metadata first
                    const { data: metaRows, error: metaErr } = await window.sbClient
                        .from(CLOUD_TABLE)
                        .select('key, updated_at')
                        .like('key', `${cid}%`)
                        .order('updated_at', { ascending: true });
                    if (metaErr) throw metaErr;

                    const candidates = (metaRows || []).filter(row => {
                        if (isIgnoredExamKey(row.key)) return false;
                        if (extractCohortIdFromKey(row.key) !== cid) return false;
                        return true;
                    });

                    const keysToFetch = [];
                    for (const row of candidates) {
                        const remoteTs = new Date(row.updated_at).getTime() || 0;
                        const localTs = db.exams[row.key] ? Math.max(new Date(db.exams[row.key].updatedAt || 0).getTime(), Number(db.exams[row.key].createdAt || 0)) : 0;
                        if (!db.exams[row.key] || remoteTs > localTs + 1000) {
                            keysToFetch.push(row.key);
                        }
                    }

                    if (keysToFetch.length === 0) {
                        localStorage.setItem(cacheKey, String(Date.now()));
                        await refreshCompareSelectors();
                        setCloudStatus('success', '已最新');
                        return { success: true, count: candidates.length, updated: 0 };
                    }

                    const rowMap = new Map();
                    for (let i = 0; i < keysToFetch.length; i += chunkSize) {
                        const chunk = keysToFetch.slice(i, i + chunkSize);
                        const { data: chunkRows, error: chunkErr } = await window.sbClient
                            .from(CLOUD_TABLE)
                            .select('key, content, updated_at')
                            .in('key', chunk);
                        if (chunkErr) throw chunkErr;
                        (chunkRows || []).forEach(r => rowMap.set(r.key, r));
                    }

                    let loadedCount = 0;
                    for (const key of keysToFetch) {
                        const row = rowMap.get(key);
                        if (!row) continue;
                        try {
                            const payload = parsePayload(row.content);
                            if (!payload || !Array.isArray(payload.RAW_DATA) || payload.RAW_DATA.length === 0) continue;

                            const keyParts = String(row.key || '').split('_');
                            const examLabel = keyParts.length >= 5 ? keyParts.slice(4).join('_') : row.key;
                            const remoteTs = new Date(row.updated_at).getTime() || Date.now();

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
                                fingerprint: payload.FINGERPRINT || computeExamDataFingerprint(payload.RAW_DATA || []),
                                createdAt: remoteTs,
                                updatedAt: row.updated_at || ''
                            };
                            loadedCount++;
                        } catch (rowErr) {
                            console.warn('[CloudExams] parse row failed:', rowErr);
                        }
                    }

                    window.COHORT_DB = db;
                    localStorage.setItem(cacheKey, String(Date.now()));
                    await refreshCompareSelectors();

                    if (loadedCount > 0) safeToast(`已从云端加载 ${loadedCount} 期历史考试`, 'success');
                    setCloudStatus('success', loadedCount > 0 ? `更新${loadedCount}期` : '已最新');
                    return { success: true, count: candidates.length, updated: loadedCount };
                } catch (e) {
                    console.error('[CloudExams] failed:', e);
                    setCloudStatus('error', '考试拉取失败');
                    return { success: false, message: e.message || String(e) };
                }
            })().finally(() => {
                delete this._cohortExamSyncTasks[cid];
            });

            return this._cohortExamSyncTasks[cid];
        },

        fetchAllCohortExams: async function () {
            const cid = normalizeCohortId(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID'));
            if (!cid) return;
            return this.fetchCohortExamsToLocal(cid);
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
    window.saveCloudSnapshot = () => CloudManager.save();

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
            if (typeof CloudManager.fetchAllCohortExams === 'function') CloudManager.fetchAllCohortExams();
        }, 800);
    });
})();
