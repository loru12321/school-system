(function() {
    const payloadCache = new Map();
    const examSyncInflight = new Map();
    const historyInflight = new Map();

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

    function normalizeCohortId(raw) {
        return String(raw || '').replace(/\D/g, '');
    }

    function normalizeName(name) {
        return String(name || '').trim().replace(/\s+/g, '').toLowerCase();
    }

    function normalizeClassToken(cls) {
        return String(cls || '').trim().replace(/[^0-9A-Za-z]/g, '').toLowerCase();
    }

    function isClassEquivalent(a, b) {
        const c1 = normalizeClassToken(a);
        const c2 = normalizeClassToken(b);
        if (!c1 || !c2) return false;
        if (c1 === c2) return true;
        return c1.replace(/^0+/, '') === c2.replace(/^0+/, '');
    }

    function defaultIsAllowedExamKey(key, cohortId) {
        const examKey = String(key || '').trim();
        if (!examKey) return false;
        if (/^(TEACHERS_|STUDENT_COMPARE_|MACRO_COMPARE_|TEACHER_COMPARE_|TOWN_SUB_COMPARE_)/.test(examKey)) return false;
        if (/(?:^|_)(?:\u671f\u4e2d\u6807\u51c6|\u671f\u672b\u6807\u51c6)(?:_|$)/.test(examKey)) return false;

        const normalizedCid = normalizeCohortId(cohortId);
        if (!normalizedCid) return true;
        const match = examKey.match(/^(\d{4})\D*_/);
        return match ? match[1] === normalizedCid : false;
    }

    function resolveExamKeyFilter(cohortId) {
        const examCatalog = getExamCatalog();
        if (examCatalog && typeof examCatalog.isSelectableExamKey === 'function') {
            return function(key) {
                return examCatalog.isSelectableExamKey(key, cohortId);
            };
        }
        return function(key) {
            return defaultIsAllowedExamKey(key, cohortId);
        };
    }

    function buildExamLabel(examKey) {
        const keyParts = String(examKey || '').split('_');
        return keyParts.length >= 5 ? keyParts.slice(4).join('_') : String(examKey || '');
    }

    function buildExamSnapshot(item, payload) {
        return {
            examId: item.key,
            examLabel: buildExamLabel(item.key),
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

    function parseCloudPayload(content, cacheKey) {
        const key = String(cacheKey || '').trim();
        if (key && payloadCache.has(key)) {
            return payloadCache.get(key);
        }

        let raw = content;
        if (typeof raw === 'string' && raw.startsWith('LZ|')) {
            if (typeof window.LZString === 'undefined') {
                throw new Error('LZString not ready');
            }
            raw = window.LZString.decompressFromUTF16(raw.substring(3));
        }

        const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (key) payloadCache.set(key, payload);
        return payload;
    }

    function findStudentInList(rows, student) {
        const list = Array.isArray(rows) ? rows : [];
        const targetName = normalizeName(student && student.name);
        const targetClass = String(student && student.class || '').trim();
        if (!targetName) return null;

        for (const row of list) {
            if (normalizeName(row && row.name) !== targetName) continue;
            if (!targetClass) return row;
            if (isClassEquivalent(row && row.class, targetClass)) return row;
        }

        return null;
    }

    function findStudentInPayload(payload, student) {
        const data = payload || {};

        const schools = data.SCHOOLS || {};
        const targetSchool = String(student && student.school || '').trim();
        for (const schoolName of Object.keys(schools)) {
            if (targetSchool && String(schoolName || '').trim() !== targetSchool) continue;
            const schoolData = schools[schoolName] || {};
            const found = findStudentInList(schoolData.students || [], student);
            if (found) return found;
        }

        return findStudentInList(data.students || data.RAW_DATA || [], student);
    }

    function buildHistoryRow(examKey, updatedAt, match) {
        const examLabel = buildExamLabel(examKey);
        return {
            examId: examLabel || examKey,
            examFullKey: examKey,
            total: match.total,
            rankClass: match.ranks && match.ranks.total ? match.ranks.total.class : undefined,
            rankSchool: match.ranks && match.ranks.total ? match.ranks.total.school : undefined,
            rankTown: match.ranks && match.ranks.total ? match.ranks.total.township : undefined,
            scores: match.scores,
            updatedAt: updatedAt
        };
    }

    function dedupeHistoryRows(rows) {
        const map = new Map();
        (rows || []).forEach(function(item) {
            const key = String(item && item.examFullKey || '');
            if (!key) return;
            map.set(key, item);
        });
        return Array.from(map.values()).sort(function(a, b) {
            return new Date(a.updatedAt || 0).getTime() - new Date(b.updatedAt || 0).getTime();
        });
    }

    function collectHistoryFromLocalExams(db, student, isAllowedExamKey) {
        if (!db || !db.exams) return [];
        const rows = [];

        Object.values(db.exams).forEach(function(exam) {
            const examId = exam && exam.examId;
            if (!examId || !isAllowedExamKey(examId)) return;
            const found = findStudentInList(exam && exam.data, student);
            if (!found) return;

            rows.push(buildHistoryRow(
                examId,
                exam && exam.createdAt ? new Date(exam.createdAt).toISOString() : new Date().toISOString(),
                found
            ));
        });

        return dedupeHistoryRows(rows);
    }

    async function fetchStudentExamHistory(options) {
        const opts = options || {};
        const sbClient = opts.sbClient || window.sbClient;
        const student = opts.student;
        if (!sbClient) return { success: false, message: '云端未连接' };
        if (!student || !student.name) return { success: false, message: '学生信息无效' };

        const cohortId = student.cohort || opts.cohortId || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID');
        if (!cohortId) return { success: false, message: '无法确定学生届别' };

        const inflightKey = [String(cohortId), String(student.school || ''), String(student.class || ''), normalizeName(student.name)].join('|');
        if (historyInflight.has(inflightKey)) {
            return historyInflight.get(inflightKey);
        }

        const task = (async function() {
            try {
                const db = opts.db || getCohortDb();
                const isAllowedExamKey = resolveExamKeyFilter(cohortId);

                let history = collectHistoryFromLocalExams(db, student, isAllowedExamKey);
                if (history.length > 0) {
                    return { success: true, data: history, source: 'local' };
                }

                await fetchCohortExamsToLocal({
                    sbClient: sbClient,
                    cohortId: cohortId,
                    db: db,
                    quiet: true
                });

                history = collectHistoryFromLocalExams(db, student, isAllowedExamKey);
                if (history.length > 0) {
                    return { success: true, data: history, source: 'local-synced' };
                }

                const { data, error } = await sbClient
                    .from('system_data')
                    .select('key, content, updated_at')
                    .like('key', `${cohortId}级_%`)
                    .order('updated_at', { ascending: true });

                if (error) throw error;
                if (!Array.isArray(data) || data.length === 0) {
                    return { success: false, message: '未找到相关考试记录' };
                }

                const rows = [];
                for (const item of data) {
                    try {
                        if (!isAllowedExamKey(item.key)) continue;
                        const payload = parseCloudPayload(item.content, item.key);
                        const match = findStudentInPayload(payload, student);
                        if (!match) continue;

                        rows.push(buildHistoryRow(item.key, item.updated_at, match));

                        if (db && db.exams && !db.exams[item.key] && Array.isArray(payload.RAW_DATA) && payload.RAW_DATA.length > 0) {
                            db.exams[item.key] = buildExamSnapshot(item, payload);
                        }
                    } catch (innerErr) {
                        console.warn('[CloudExamSyncService] parse student history row failed:', item && item.key, innerErr);
                    }
                }

                if (db) {
                    window.COHORT_DB = db;
                }

                const deduped = dedupeHistoryRows(rows);
                if (!deduped.length) {
                    return { success: false, message: '未匹配到该学生的历史成绩' };
                }
                return { success: true, data: deduped, source: 'remote-fallback' };
            } catch (error) {
                console.error('[CloudExamSyncService] fetchStudentExamHistory failed:', error);
                return { success: false, message: error && error.message ? error.message : '拉取失败' };
            }
        })();

        historyInflight.set(inflightKey, task);
        try {
            return await task;
        } finally {
            historyInflight.delete(inflightKey);
        }
    }

    async function fetchCohortExamsToLocal(options) {
        const opts = options || {};
        const sbClient = opts.sbClient || window.sbClient;
        if (!sbClient) return { success: false, message: '云端未连接' };

        const cohortId = opts.cohortId || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID');
        if (!cohortId) return { success: false, message: '无法确定届别' };

        const db = opts.db || getCohortDb();
        if (!db) return { success: false, message: 'CohortDB 未初始化' };

        const normalizedCid = normalizeCohortId(cohortId) || String(cohortId);
        const inflightKey = `cohort:${normalizedCid}`;
        if (examSyncInflight.has(inflightKey)) {
            return examSyncInflight.get(inflightKey);
        }

        const task = (async function() {
            try {
                const isAllowedExamKey = resolveExamKeyFilter(cohortId);
                const cacheKey = `CLOUD_EXAMS_SYNC_TS_${normalizedCid}`;
                const lastSyncTs = Number(localStorage.getItem(cacheKey) || 0);
                const localExamCount = Object.keys(db.exams || {}).filter(isAllowedExamKey).length;
                const isRecentSync = Date.now() - lastSyncTs < 3 * 60 * 1000;

                if (!opts.force && localExamCount >= 2 && isRecentSync) {
                    refreshExamRelatedUi();
                    return { success: true, count: 0, skipped: true, reason: 'cache-hit' };
                }

                if (!opts.quiet && window.UI) {
                    UI.toast(`正在从云端加载 ${cohortId} 级历史考试列表...`, 'info');
                }

                const { data: keyRows, error: keyError } = await sbClient
                    .from('system_data')
                    .select('key, updated_at')
                    .like('key', `${cohortId}级_%`)
                    .not('key', 'like', 'TEACHERS_%')
                    .not('key', 'like', 'STUDENT_COMPARE_%')
                    .order('updated_at', { ascending: true });

                if (keyError) throw keyError;

                const remoteExamRows = (keyRows || []).filter(function(row) { return isAllowedExamKey(row.key); });
                if (!remoteExamRows.length) {
                    localStorage.setItem(cacheKey, String(Date.now()));
                    refreshExamRelatedUi();
                    return { success: true, count: 0 };
                }

                const missingKeys = remoteExamRows
                    .map(function(row) { return row.key; })
                    .filter(function(key) { return !(db.exams && db.exams[key]); });

                if (!missingKeys.length) {
                    localStorage.setItem(cacheKey, String(Date.now()));
                    refreshExamRelatedUi();
                    return { success: true, count: 0, skipped: true, reason: 'up-to-date' };
                }

                const chunkSize = 30;
                const chunks = [];
                for (let i = 0; i < missingKeys.length; i += chunkSize) {
                    chunks.push(missingKeys.slice(i, i + chunkSize));
                }

                const batchResults = await Promise.all(chunks.map(async function(chunk) {
                    const { data: contentRows, error: contentError } = await sbClient
                        .from('system_data')
                        .select('key, content, updated_at')
                        .in('key', chunk);
                    if (contentError) throw contentError;
                    return Array.isArray(contentRows) ? contentRows : [];
                }));

                const missingRows = [];
                batchResults.forEach(function(rows) {
                    rows.forEach(function(row) {
                        if (isAllowedExamKey(row.key)) {
                            missingRows.push(row);
                        }
                    });
                });

                missingRows.sort(function(a, b) {
                    return new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime();
                });

                let loadedCount = 0;
                for (const item of missingRows) {
                    try {
                        const payload = parseCloudPayload(item.content, item.key);
                        if (!payload || !Array.isArray(payload.RAW_DATA) || payload.RAW_DATA.length === 0) continue;
                        db.exams[item.key] = buildExamSnapshot(item, payload);
                        loadedCount += 1;
                    } catch (innerErr) {
                        console.warn('[CloudExamSyncService] parse exam snapshot failed:', item && item.key, innerErr);
                    }
                }

                window.COHORT_DB = db;
                localStorage.setItem(cacheKey, String(Date.now()));
                refreshExamRelatedUi();

                if (loadedCount > 0 && !opts.quiet && window.UI) {
                    UI.toast(`已从云端加载 ${loadedCount} 期历史考试，期数下拉已更新`, 'success');
                }

                return { success: true, count: loadedCount };
            } catch (error) {
                console.error('[CloudExamSyncService] fetchCohortExamsToLocal failed:', error);
                return { success: false, message: error && error.message ? error.message : '拉取失败' };
            }
        })();

        examSyncInflight.set(inflightKey, task);
        try {
            return await task;
        } finally {
            examSyncInflight.delete(inflightKey);
        }
    }

    function clearPayloadCache() {
        payloadCache.clear();
    }

    window.CloudExamSyncService = {
        parseCloudPayload,
        buildExamSnapshot,
        refreshExamRelatedUi,
        fetchStudentExamHistory,
        fetchCohortExamsToLocal,
        clearPayloadCache
    };
})();
