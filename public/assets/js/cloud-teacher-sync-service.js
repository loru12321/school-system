(function() {
    function normalizeTeacherName(name) {
        return String(name || '').replace(/\s+/g, '').toLowerCase();
    }

    function getTeacherKey(options) {
        const opts = options || {};
        const termSelect = opts.termSelect || document.getElementById('dm-teacher-term-select');
        const meta = typeof opts.getExamMeta === 'function'
            ? opts.getExamMeta()
            : (typeof window.getExamMetaFromUI === 'function' ? window.getExamMetaFromUI() : {});

        let termId = opts.termId || termSelect?.value || localStorage.getItem('CURRENT_TERM_ID');
        if (!termId && typeof window.getTermId === 'function') {
            termId = window.getTermId(meta);
        }

        let baseTerm = termId;
        if (termId) {
            const parts = termId.split('_');
            if (parts.length >= 3 && parts[2].includes('年级')) {
                baseTerm = parts.slice(0, 2).join('_');
            }
        }

        let cohortId = opts.cohortId || window.CURRENT_COHORT_ID || window.CURRENT_COHORT_META?.id || meta.cohortId || localStorage.getItem('CURRENT_COHORT_ID');
        if (!cohortId && termId) {
            const parts = termId.split('_');
            const gradeInfo = parts[2];
            if (gradeInfo) {
                const gradeMatch = gradeInfo.match(/(\d+)/);
                const yearMatch = parts[0].match(/(\d{4})/);
                if (gradeMatch && yearMatch) {
                    const grade = parseInt(gradeMatch[1], 10);
                    const currentYear = parseInt(yearMatch[1], 10);
                    cohortId = currentYear - (grade - 6);
                    console.log(`[TeacherSync] 从学期推算届数：${cohortId}级 (${grade}年级)`);
                }
            }
        }

        if (!cohortId || !baseTerm) {
            console.warn(`[TeacherSync] 生成Key失败: Cohort=${cohortId}, Term=${baseTerm}`);
            return null;
        }
        return `TEACHERS_${cohortId}级_${baseTerm}`;
    }

    function parseTeacherPayload(content) {
        try {
            let raw = content;
            if (typeof raw === 'string' && raw.startsWith('LZ|')) {
                raw = LZString.decompressFromUTF16(raw.substring(3));
            }
            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
            const map = parsed?.map && typeof parsed.map === 'object' ? parsed.map : (parsed || {});
            const schoolMap = parsed?.schoolMap && typeof parsed.schoolMap === 'object' ? parsed.schoolMap : {};
            return { map, schoolMap };
        } catch (error) {
            return null;
        }
    }

    function teacherExistsInMap(mapObj, teacherName) {
        const teacherNameNorm = normalizeTeacherName(teacherName);
        if (!teacherNameNorm || !mapObj || typeof mapObj !== 'object') return false;
        return Object.values(mapObj).some(name => {
            const normalized = normalizeTeacherName(name);
            return normalized === teacherNameNorm || normalized.startsWith(teacherNameNorm + '(') || normalized.startsWith(teacherNameNorm + '（');
        });
    }

    async function saveTeachers(options) {
        const opts = options || {};
        const sbClient = opts.sbClient || window.sbClient;
        if (!sbClient) return false;

        const key = opts.key || getTeacherKey(opts);
        if (!key) {
            console.error('[TeacherSync] 无法生成 Key');
            if (window.UI) UI.toast('无法确定学期或年级信息', 'error');
            alert('保存失败：无法确定学期或年级信息（Key生成失败）');
            return false;
        }

        const teacherMap = opts.teacherMap || window.TEACHER_MAP || {};
        const teacherSchoolMap = opts.teacherSchoolMap || window.TEACHER_SCHOOL_MAP || {};
        if (!teacherMap || Object.keys(teacherMap).length === 0) {
            console.warn('[TeacherSync] TEACHER_MAP 为空');
            if (window.UI) UI.toast('当前无任课数据', 'warning');
            alert('当前无任课数据，无需保存');
            return false;
        }

        if (window.UI) UI.loading(true, '☁️ 正在同步任课数据...');
        try {
            console.log('[TeacherSync] 准备保存任课表 Key:', key);
            const rawPayload = JSON.stringify({ map: teacherMap, schoolMap: teacherSchoolMap });
            const compressed = 'LZ|' + LZString.compressToUTF16(rawPayload);

            const primary = await sbClient.from('system_data').upsert({
                key,
                content: compressed,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

            if (primary.error) {
                console.warn('[TeacherSync] Primary upsert error:', primary.error);
                throw primary.error;
            }

            const verify = await sbClient.from('system_data').select('key').eq('key', key).maybeSingle();
            if (verify.error) {
                console.warn('[TeacherSync] 写入后校验 API 报错:', verify.error);
            } else if (!verify.data) {
                console.warn('[TeacherSync] 写入后无法查回数据 (RLS BLOCK?)');
                throw new Error('写入疑似被 RLS 策略拦截，无法查回数据');
            }

            console.log('[TeacherSync] 保存成功且校验通过');
            if (window.UI) UI.toast(`✅ 任课表已同步：${key}`, 'success');
            localStorage.setItem('TEACHER_SYNC_AT', new Date().toISOString());
            if (typeof window.logAction === 'function') window.logAction('任课同步', `任课表已保存：${key}`);
            if (typeof window.updateStatusPanel === 'function') window.updateStatusPanel();
            if (window.DataManager && typeof window.DataManager.refreshTeacherAnalysis === 'function') {
                window.DataManager.refreshTeacherAnalysis();
            }
            return true;
        } catch (error) {
            console.error('[TeacherSync] 保存异常:', error);
            alert('任课同步失败: ' + (error.message || error.code) + '\nKey: ' + key + '\n\n请联系管理员检查 Supabase system_data 表权限。');
            return false;
        } finally {
            if (window.UI) UI.loading(false);
        }
    }

    async function loadTeachers(options) {
        const opts = options || {};
        const sbClient = opts.sbClient || window.sbClient;
        if (!sbClient) return;

        try {
            if (window.UI) UI.loading(true, '☁️ 正在从云端拉取学期任课表...');

            const termSelect = opts.termSelect || document.getElementById('dm-teacher-term-select');
            const meta = typeof opts.getExamMeta === 'function'
                ? opts.getExamMeta()
                : (typeof window.getExamMetaFromUI === 'function' ? window.getExamMetaFromUI() : {});
            let termId = opts.termId || termSelect?.value || localStorage.getItem('CURRENT_TERM_ID') || (typeof window.getTermId === 'function' ? window.getTermId(meta) : '');
            let baseTerm = termId;
            if (termId) {
                const parts = termId.split('_');
                if (parts.length >= 3 && parts[2].includes('年级')) {
                    baseTerm = parts.slice(0, 2).join('_');
                }
            }

            const user = typeof window.getCurrentUser === 'function' ? window.getCurrentUser() : null;
            const role = user?.role || 'guest';
            const broadSearchForTeacher = role === 'teacher' || role === 'class_teacher';
            const cohortId = String(opts.cohortId || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').replace(/\D/g, '');

            let loadedKey = opts.key || getTeacherKey({ ...opts, termId, cohortId, getExamMeta: () => meta });
            let payloadContent = null;
            const triedKeys = [];
            const candidateRows = [];
            const seenKeys = new Set();

            const pushCandidates = (rows) => {
                if (!Array.isArray(rows)) return;
                rows.forEach(row => {
                    if (!row || !row.key || !row.content || seenKeys.has(row.key)) return;
                    seenKeys.add(row.key);
                    candidateRows.push(row);
                });
            };

            if (loadedKey) {
                triedKeys.push(loadedKey);
                console.log('[TeacherSync] 拉取任课表 Key:', loadedKey);
                const { data, error } = await sbClient.from('system_data').select('key,content,updated_at').eq('key', loadedKey).maybeSingle();
                if (error) throw error;
                if (data && data.content) pushCandidates([data]);
            }

            if ((candidateRows.length === 0 || broadSearchForTeacher) && cohortId && baseTerm) {
                const likePattern = `TEACHERS_${cohortId}级_${baseTerm}`;
                triedKeys.push(`like:${likePattern}`);
                const { data: rows, error } = await sbClient
                    .from('system_data')
                    .select('key,content,updated_at')
                    .like('key', likePattern)
                    .order('updated_at', { ascending: false })
                    .limit(20);
                if (error) throw error;
                pushCandidates(rows);
            }

            let selectedRow = candidateRows.length ? candidateRows[0] : null;
            if (broadSearchForTeacher && user?.name && candidateRows.length > 0) {
                const hit = candidateRows.find(row => {
                    const parsed = parseTeacherPayload(row.content);
                    return parsed && teacherExistsInMap(parsed.map, user.name);
                });
                if (hit) {
                    selectedRow = hit;
                    console.log(`[TeacherSync] 按教师姓名命中任课表: ${selectedRow.key}`);
                }
            }

            if (selectedRow) {
                loadedKey = selectedRow.key;
                payloadContent = selectedRow.content;
            }

            if (!payloadContent) {
                const termHint = baseTerm || termId || '未识别学期';
                const cohortHint = cohortId ? `${cohortId}级` : '未识别届数';
                const keyHint = triedKeys.length ? triedKeys.join(' | ') : '(无)';
                console.warn(`⚠️ 云端未找到可用任课档案: ${loadedKey || '(无可用key)'}`);
                if (window.UI) {
                    UI.toast(`⚠️ 未找到任课表：届数=${cohortHint}，学期=${termHint}；已尝试=${keyHint}`, 'warning');
                }
                return;
            }

            const payload = parseTeacherPayload(payloadContent);
            if (!payload) {
                throw new Error('任课表解析失败：数据格式异常');
            }

            const map = payload.map;
            let schoolMap = payload.schoolMap;
            if ((!schoolMap || Object.keys(schoolMap).length === 0) && map && Object.keys(map).length > 0) {
                const fallbackSchool = typeof window.inferDefaultSchoolFromContext === 'function'
                    ? window.inferDefaultSchoolFromContext()
                    : '';
                if (fallbackSchool) {
                    schoolMap = {};
                    Object.keys(map).forEach(key => {
                        schoolMap[key] = fallbackSchool;
                    });
                }
            }

            if (typeof window.setTeacherMap === 'function') window.setTeacherMap(map);
            if (typeof window.setTeacherSchoolMap === 'function') window.setTeacherSchoolMap(schoolMap);
            if (window.DataManager && window.DataManager.syncTeacherHistory) window.DataManager.syncTeacherHistory();
            if (window.DataManager && window.DataManager.renderTeachers) window.DataManager.renderTeachers();
            if (window.DataManager && typeof window.DataManager.refreshTeacherAnalysis === 'function') {
                window.DataManager.refreshTeacherAnalysis();
            }
            if (typeof window.updateStatusPanel === 'function') window.updateStatusPanel();

            if (window.UI) UI.toast(`✅ 已从云端加载本学期任课表（${Object.keys(map).length}条）`, 'success');
            if (typeof window.logAction === 'function') window.logAction('任课同步', `任课表已加载：${loadedKey || 'fallback-key'}`);
            console.log(`✅ 云端任课表加载成功: ${loadedKey || 'fallback-key'}, 共 ${Object.keys(map).length} 条记录`);
        } catch (error) {
            console.error('云端加载失败:', error);
            const msg = String(error?.message || error?.details || error?.hint || error || '未知错误');
            const code = String(error?.code || '');
            let reason = '☁️ 云端数据加载失败';

            if (code === '42501' || /permission|policy|row-level|rls|权限/i.test(msg)) {
                reason = '🔒 权限策略拦截（RLS）：请管理员开放 system_data 的 SELECT 权限';
            } else if (/network|fetch|failed to fetch|timeout|timed out|网络/i.test(msg)) {
                reason = '🌐 网络异常：无法连接云端，请检查网络后重试';
            } else if (/json|parse|unexpected token/i.test(msg)) {
                reason = '🧾 云端任课表格式异常：请管理员重新同步任课表';
            }

            if (window.UI) UI.toast(reason, 'error');
        } finally {
            if (window.UI) UI.loading(false);
        }
    }

    window.CloudTeacherSyncService = {
        getTeacherKey,
        parseTeacherPayload,
        saveTeachers,
        loadTeachers
    };
})();