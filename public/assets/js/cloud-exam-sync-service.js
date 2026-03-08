(function() {
    function getExamCatalog() {
        return window.ExamCatalog || {};
    }

    function getCohortDb() {
        if (typeof window.CohortDB !== 'undefined' && typeof window.CohortDB.ensure === 'function') {
            return window.CohortDB.ensure();
        }
        return window.COHORT_DB || null;
    }

    function refreshExamRelatedUi() {
        const examCatalog = getExamCatalog();
        if (typeof window.CohortDB !== 'undefined' && typeof window.CohortDB.renderExamList === 'function') {
            window.CohortDB.renderExamList();
        }
        if (examCatalog && typeof examCatalog.refreshCompareSelectors === 'function') {
            examCatalog.refreshCompareSelectors();
            return;
        }
        if (typeof window.updateMacroMultiExamSelects === 'function') window.updateMacroMultiExamSelects();
        if (typeof window.updateTeacherMultiExamSelects === 'function') window.updateTeacherMultiExamSelects();
        if (typeof window.updateStudentCompareExamSelects === 'function') window.updateStudentCompareExamSelects();
        if (typeof window.updateProgressMultiExamSelects === 'function') window.updateProgressMultiExamSelects();
    }

    function buildExamSnapshot(item, payload) {
        const keyParts = String(item?.key || '').split('_');
        const examLabel = keyParts.length >= 5 ? keyParts.slice(4).join('_') : item.key;
        return {
            examId: item.key,
            examLabel,
            meta: payload.ARCHIVE_META || payload.CONFIG || {},
            data: payload.RAW_DATA || [],
            schools: payload.SCHOOLS || {},
            teacherMap: payload.TEACHER_MAP || {},
            subjects: payload.SUBJECTS || [],
            thresholds: payload.THRESHOLDS || {},
            config: payload.CONFIG || {},
            createdAt: new Date(item.updated_at).getTime() || Date.now()
        };
    }

    function parseCloudPayload(content) {
        let raw = content;
        if (typeof raw === 'string' && raw.startsWith('LZ|')) {
            raw = LZString.decompressFromUTF16(raw.substring(3));
        }
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
    }

    async function fetchStudentExamHistory(options) {
        const opts = options || {};
        const sbClient = opts.sbClient || window.sbClient;
        const student = opts.student;
        if (!sbClient) return { success: false, message: '云端未连接' };
        if (!student || !student.name) return { success: false, message: '学生信息无效' };

        const cohortId = student.cohort || opts.cohortId || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID');
        if (!cohortId) return { success: false, message: '无法确定学生届别' };

        try {
            const { data, error } = await sbClient
                .from('system_data')
                .select('key, content, updated_at')
                .like('key', `${cohortId}级_%`)
                .not('key', 'like', 'TEACHERS_%')
                .not('key', 'like', 'STUDENT_COMPARE_%')
                .order('updated_at', { ascending: true });

            if (error) throw error;
            if (!data || data.length === 0) return { success: false, message: '未找到相关考试记录' };

            const examCatalog = getExamCatalog();
            const isAllowedExamKey = (examCatalog && typeof examCatalog.isSelectableExamKey === 'function')
                ? (key) => examCatalog.isSelectableExamKey(key, cohortId)
                : (key) => !/^(TEACHERS_|STUDENT_COMPARE_|MACRO_COMPARE_|TEACHER_COMPARE_|TOWN_SUB_COMPARE_)/.test(String(key || '').trim());

            const history = [];
            const normalizedTargetName = student.name.trim();
            const targetClassNum = String(student.class || '').replace(/[^0-9]/g, '');

            for (const item of data) {
                try {
                    if (!isAllowedExamKey(item.key)) continue;
                    const payload = parseCloudPayload(item.content);
                    let match = null;
                    const schools = payload.SCHOOLS || {};
                    for (const [schoolName, schoolData] of Object.entries(schools)) {
                        if (student.school && schoolName !== student.school) continue;
                        const stuList = schoolData.students || [];
                        match = stuList.find(row => {
                            if (row.name !== normalizedTargetName) return false;
                            if (!student.class) return true;
                            const classNum = String(row.class || '').replace(/[^0-9]/g, '');
                            return classNum === targetClassNum;
                        });
                        if (match) break;
                    }

                    if (!match) {
                        const stuList = payload.students || payload.RAW_DATA || [];
                        match = stuList.find(row => {
                            if (row.name !== normalizedTargetName) return false;
                            if (!student.class) return true;
                            const classNum = String(row.class || '').replace(/[^0-9]/g, '');
                            return classNum === targetClassNum;
                        });
                    }

                    if (!match) continue;
                    const keyParts = item.key.split('_');
                    const examLabel = keyParts.length >= 5 ? keyParts.slice(4).join('_') : item.key;
                    history.push({
                        examId: examLabel || item.key,
                        examFullKey: item.key,
                        total: match.total,
                        rankClass: match.ranks?.total?.class,
                        rankSchool: match.ranks?.total?.school,
                        rankTown: match.ranks?.total?.township,
                        scores: match.scores,
                        updatedAt: item.updated_at
                    });
                } catch (err) {
                    console.warn(`[CloudHistory] 解析记录 ${item.key} 失败:`, err);
                }
            }

            return { success: true, data: history };
        } catch (error) {
            console.error('[CloudHistory] 检索失败:', error);
            return { success: false, message: error.message };
        }
    }

    async function fetchCohortExamsToLocal(options) {
        const opts = options || {};
        const sbClient = opts.sbClient || window.sbClient;
        if (!sbClient) return { success: false, message: '云端未连接' };

        const cohortId = opts.cohortId || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID');
        if (!cohortId) return { success: false, message: '无法确定届别' };

        const examCatalog = getExamCatalog();
        const db = opts.db || getCohortDb();
        if (!db) return { success: false, message: 'CohortDB 未初始化' };

        const normalizeCohortId = typeof examCatalog.normalizeCohortId === 'function'
            ? examCatalog.normalizeCohortId
            : (raw) => String(raw || '').replace(/\D/g, '');
        const isAllowedExamKey = typeof examCatalog.isSelectableExamKey === 'function'
            ? (key) => examCatalog.isSelectableExamKey(key, cohortId)
            : (key) => {
                const examKey = String(key || '').trim();
                if (!examKey) return false;
                if (/^(TEACHERS_|STUDENT_COMPARE_|MACRO_COMPARE_|TEACHER_COMPARE_|TOWN_SUB_COMPARE_)/.test(examKey)) return false;
                if (/(?:^|_)(?:\u671f\u4e2d\u6807\u51c6|\u671f\u672b\u6807\u51c6)(?:_|$)/.test(examKey)) return false;
                const normalizedCid = normalizeCohortId(cohortId);
                if (!normalizedCid) return true;
                const match = examKey.match(/^(\d{4})\D*_/);
                return match ? match[1] === normalizedCid : false;
            };

        try {
            const normalizedCid = normalizeCohortId(cohortId) || cohortId;
            const cacheKey = `CLOUD_EXAMS_SYNC_TS_${normalizedCid}`;
            const lastSyncTs = Number(localStorage.getItem(cacheKey) || 0);
            const localExamCount = (examCatalog && typeof examCatalog.collectAvailableExams === 'function')
                ? examCatalog.collectAvailableExams({ db, cohortId, currentExamId: '' }).length
                : Object.keys(db.exams || {}).filter(isAllowedExamKey).length;
            const isRecentSync = Date.now() - lastSyncTs < 3 * 60 * 1000;

            if (localExamCount >= 2 && isRecentSync) {
                refreshExamRelatedUi();
                return { success: true, count: 0, skipped: true, reason: 'cache-hit' };
            }

            if (window.UI) UI.toast(`正在从云端加载 ${cohortId} 级历史考试列表...`, 'info');

            const { data: keyRows, error: keyError } = await sbClient
                .from('system_data')
                .select('key, updated_at')
                .like('key', `${cohortId}级_%`)
                .not('key', 'like', 'TEACHERS_%')
                .not('key', 'like', 'STUDENT_COMPARE_%')
                .order('updated_at', { ascending: true });

            if (keyError) throw keyError;

            const remoteExamRows = (keyRows || []).filter(row => isAllowedExamKey(row.key));
            if (remoteExamRows.length === 0) {
                localStorage.setItem(cacheKey, String(Date.now()));
                refreshExamRelatedUi();
                return { success: true, count: 0 };
            }

            const missingKeys = remoteExamRows
                .map(row => row.key)
                .filter(key => !(db.exams && db.exams[key]));

            if (missingKeys.length === 0) {
                localStorage.setItem(cacheKey, String(Date.now()));
                refreshExamRelatedUi();
                return { success: true, count: 0, skipped: true, reason: 'up-to-date' };
            }

            const missingRows = [];
            const chunkSize = 30;
            for (let i = 0; i < missingKeys.length; i += chunkSize) {
                const chunk = missingKeys.slice(i, i + chunkSize);
                const { data: contentRows, error: contentError } = await sbClient
                    .from('system_data')
                    .select('key, content, updated_at')
                    .in('key', chunk);

                if (contentError) throw contentError;
                if (Array.isArray(contentRows)) {
                    missingRows.push(...contentRows.filter(row => isAllowedExamKey(row.key)));
                }
            }

            missingRows.sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

            let loadedCount = 0;
            for (const item of missingRows) {
                try {
                    const payload = parseCloudPayload(item.content);
                    if (!payload || !Array.isArray(payload.RAW_DATA) || payload.RAW_DATA.length === 0) continue;
                    db.exams[item.key] = buildExamSnapshot(item, payload);
                    loadedCount++;
                } catch (err) {
                    console.warn(`[CloudExams] 解析考试 ${item.key} 失败:`, err);
                }
            }

            window.COHORT_DB = db;
            localStorage.setItem(cacheKey, String(Date.now()));
            refreshExamRelatedUi();

            if (loadedCount > 0 && window.UI) {
                UI.toast(`已从云端加载 ${loadedCount} 期历史考试，对比期数已更新`, 'success');
            }

            return { success: true, count: loadedCount };
        } catch (error) {
            console.error('[CloudExams] 拉取历史考试失败:', error);
            return { success: false, message: error.message };
        }
    }

    window.CloudExamSyncService = {
        parseCloudPayload,
        buildExamSnapshot,
        refreshExamRelatedUi,
        fetchStudentExamHistory,
        fetchCohortExamsToLocal
    };
})();