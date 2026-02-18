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
                const meta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
                if (!meta.cohortId || !meta.year || !meta.term || !meta.type) return null;
                const parts = [
                    meta.cohortId + '级',
                    meta.grade ? meta.grade + '年级' : '未知年级',
                    meta.year,
                    meta.term,
                    meta.type,
                    meta.name || '标准考试'
                ];
                return parts.join('_').replace(/[\s\/\\\?]/g, '');
            },

            save: async function() {
                if (!this.check()) return;
                const role = sessionStorage.getItem('CURRENT_ROLE');
                if (role !== 'admin' && role !== 'director' && role !== 'grade_director') {
                    if (window.UI) UI.toast("⛔ 权限不足", "warning");
                    return;
                }
                const key = this.getKey();
                if (!key) return alert("请先完善考试信息");
                if (window.UI) UI.loading(true, `☁️ 正在同步...`);
                try {
                    if (!window.SYS_VARS) window.SYS_VARS = { indicator: { ind1: '', ind2: '' }, targets: {} };
                    const i1 = document.getElementById('dm_ind1_input');
                    const i2 = document.getElementById('dm_ind2_input');
                    if (i1) window.SYS_VARS.indicator.ind1 = i1.value;
                    if (i2) window.SYS_VARS.indicator.ind2 = i2.value;
                    window.SYS_VARS.targets = window.TARGETS || {};

                    const payload = typeof getCurrentSnapshotPayload === 'function' ? getCurrentSnapshotPayload() : {};
                    const json = JSON.stringify(payload);
                    const compressed = "LZ|" + LZString.compressToUTF16(json);

                    const { error } = await sbClient.from('system_data').upsert({
                        key,
                        content: compressed,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'key' });
                    if (error) throw error;

                    localStorage.setItem('CURRENT_PROJECT_KEY', key);
                    if (window.idbKeyval) await idbKeyval.set(`cache_${key}`, payload);
                    if (window.UI) UI.toast("✅ 云端同步成功", "success");
                    localStorage.setItem('CLOUD_SYNC_AT', new Date().toISOString());
                    logAction('云端同步', `全量数据已同步：${key}`);
                    updateStatusPanel();
                } catch (e) {
                    console.error("CloudManager Save Error:", e);
                    alert("同步失败: " + e.message);
                } finally {
                    if (window.UI) UI.loading(false);
                }
            },

            load: async function() {
                if (!this.check()) return;
                const key = this.getKey() || localStorage.getItem('CURRENT_PROJECT_KEY');
                if (!key) return;
                if (window.UI) UI.toast("⏳ 正在检查云端数据...", "info");
                try {
                    const { data, error } = await sbClient
                        .from('system_data')
                        .select('content')
                        .eq('key', key)
                        .maybeSingle();
                    if (error) throw error;
                    if (!data) return;

                    let content = data.content;
                    if (typeof content === 'string' && content.startsWith("LZ|")) {
                        content = LZString.decompressFromUTF16(content.substring(3));
                    }
                    const payload = typeof content === 'string' ? JSON.parse(content) : content;
                    if (typeof applySnapshotPayload === 'function') applySnapshotPayload(payload);
                    if (window.UI) UI.toast("✅ 数据已同步到本地", "success");
                    logAction('云端加载', `已加载全量数据：${key}`);
                } catch (e) {
                    console.error("CloudManager Load Error:", e);
                    if (window.UI) UI.toast("加载失败", "error");
                }
            },

            // 教师任课：学期级同步
            getTeacherKey: () => {
                const termSel = document.getElementById('dm-teacher-term-select');
                const meta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
                
                let termId = termSel?.value;
                if (!termId) termId = localStorage.getItem('CURRENT_TERM_ID');
                if (!termId && typeof getTermId === 'function') termId = getTermId(meta);
                
                // 🟢 改进：从termId中提取基础学期（去掉年级后缀）
                let baseTerm = termId;
                if (termId) {
                    const parts = termId.split('_');
                    if (parts.length >= 3 && parts[2].includes('年级')) {
                        baseTerm = parts.slice(0, 2).join('_'); // "2025-2026_上学期"
                    }
                }

                let cohortId = window.CURRENT_COHORT_ID || window.CURRENT_COHORT_META?.id || meta.cohortId || localStorage.getItem('CURRENT_COHORT_ID');
                
                // 🟢 改进：如果没有cohortId，尝试从termId中的年级信息计算
                if (!cohortId && termId) {
                    const parts = termId.split('_');
                    const gradeInfo = parts[2]; // "9年级" 或 undefined
                    if (gradeInfo) {
                        const gradeMatch = gradeInfo.match(/(\d+)/);
                        const yearMatch = parts[0].match(/(\d{4})/);
                        if (gradeMatch && yearMatch) {
                            const grade = parseInt(gradeMatch[1], 10);
                            const currentYear = parseInt(yearMatch[1], 10);
                            cohortId = currentYear - (grade - 6); // 计算入学年份
                            console.log(`[TeacherSync] 从学期推算届数：${cohortId}级 (${grade}年级)`);
                        }
                    }
                }
                
                if (!cohortId || !baseTerm) {
                    console.warn(`[TeacherSync] 生成Key失败: Cohort=${cohortId}, Term=${baseTerm}`);
                    return null;
                }
                return `TEACHERS_${cohortId}级_${baseTerm}`;
            },

            saveTeachers: async function() {
                console.log("[TeacherSync] 开始执行 saveTeachers...");
                if (!sbClient && typeof window.initSupabase === 'function') window.initSupabase();
                
                if (!this.check()) {
                    console.error("[TeacherSync] Supabase 未连接");
                    alert("云端服务未连接，无法保存！");
                    return false;
                }

                const key = this.getTeacherKey();
                if (!key) {
                    console.error("[TeacherSync] 无法生成 Key");
                    if (window.UI) UI.toast("无法确定学期或年级信息", "error");
                    alert("保存失败：无法确定学期或年级信息（Key生成失败）");
                    return false;
                }

                if (!window.TEACHER_MAP || Object.keys(window.TEACHER_MAP).length === 0) {
                    console.warn("[TeacherSync] TEACHER_MAP 为空");
                    if (window.UI) UI.toast("当前无任课数据", "warning");
                    alert("当前无任课数据，无需保存");
                    return false;
                }

                if (window.UI) UI.loading(true, "☁️ 正在同步任课数据...");
                try {
                    console.log('[TeacherSync] 准备保存任课表 Key:', key);
                    const rawPayload = JSON.stringify({
                        map: window.TEACHER_MAP || {},
                        schoolMap: window.TEACHER_SCHOOL_MAP || {}
                    });
                    const compressed = "LZ|" + LZString.compressToUTF16(rawPayload);
                    
                    let error = null;
                    
                    // 尝试写入 (使用压缩数据)
                    const primary = await sbClient.from('system_data').upsert({
                        key,
                        content: compressed,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'key' });
                    
                    if (primary.error) {
                         console.warn('[TeacherSync] Primary upsert error:', primary.error);
                         throw primary.error;
                    }

                    // 验证写入
                    const verify = await sbClient.from('system_data').select('key').eq('key', key).maybeSingle();
                    if (verify.error) {
                        console.warn('[TeacherSync] 写入后校验 API 报错:', verify.error);
                    } else if (!verify.data) {
                        console.warn('[TeacherSync] 写入后无法查回数据 (RLS BLOCK?)');
                        throw new Error("写入疑似被 RLS 策略拦截，无法查回数据");
                    }

                    console.log('[TeacherSync] 保存成功且校验通过');
                    if (window.UI) UI.toast(`✅ 任课表已同步（${key}）`, "success");
                    localStorage.setItem('TEACHER_SYNC_AT', new Date().toISOString());
                    logAction('任课同步', `任课表已保存：${key}`);
                    updateStatusPanel();
                    
                    if (window.DataManager && typeof DataManager.refreshTeacherAnalysis === 'function') {
                        DataManager.refreshTeacherAnalysis();
                    }
                    return true;
                } catch (e) {
                    console.error('[TeacherSync] 保存异常:', e);
                    alert("任课同步失败: " + (e.message || e.code) + "\nKey: " + key + "\n\n请联系管理员检查 Supabase system_data 表权限。");
                    return false;
                } finally {
                    if (window.UI) UI.loading(false);
                }
            },

            loadTeachers: async function() {
                if (!sbClient && typeof window.initSupabase === 'function') window.initSupabase();
                if (!this.check()) return;
                try {
                    if (window.UI) UI.loading(true, "☁️ 正在从云端拉取学期任课表...");

                    const termSel = document.getElementById('dm-teacher-term-select');
                    const meta = typeof getExamMetaFromUI === 'function' ? getExamMetaFromUI() : {};
                    let termId = termSel?.value || localStorage.getItem('CURRENT_TERM_ID') || (typeof getTermId === 'function' ? getTermId(meta) : '');
                    let baseTerm = termId;
                    if (termId) {
                        const parts = termId.split('_');
                        if (parts.length >= 3 && parts[2].includes('年级')) {
                            baseTerm = parts.slice(0, 2).join('_');
                        }
                    }

                    const user = getCurrentUser();
                    const role = user?.role || 'guest';
                    const teacherNameNorm = String(user?.name || '').replace(/\s+/g, '').toLowerCase();
                    const broadSearchForTeacher = (role === 'teacher' || role === 'class_teacher');
                    const cohortId = String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').replace(/\D/g, '');

                    let loadedKey = this.getTeacherKey();
                    let payloadContent = null;
                    const triedKeys = [];
                    const candidateRows = [];
                    const seenKeys = new Set();

                    const pushCandidates = (rows) => {
                        if (!Array.isArray(rows)) return;
                        rows.forEach(r => {
                            if (!r || !r.key || !r.content || seenKeys.has(r.key)) return;
                            seenKeys.add(r.key);
                            candidateRows.push(r);
                        });
                    };

                    const parseTeacherPayload = (content) => {
                        try {
                            let raw = content;
                            if (typeof raw === 'string' && raw.startsWith('LZ|')) {
                                raw = LZString.decompressFromUTF16(raw.substring(3));
                            }
                            const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
                            const map = parsed?.map && typeof parsed.map === 'object' ? parsed.map : (parsed || {});
                            const schoolMap = parsed?.schoolMap && typeof parsed.schoolMap === 'object' ? parsed.schoolMap : {};
                            return { map, schoolMap };
                        } catch (err) {
                            return null;
                        }
                    };

                    const teacherExistsInMap = (mapObj) => {
                        if (!teacherNameNorm || !mapObj || typeof mapObj !== 'object') return false;
                        return Object.values(mapObj).some(n => {
                            const norm = String(n || '').replace(/\s+/g, '').toLowerCase();
                            return norm === teacherNameNorm || norm.startsWith(teacherNameNorm + '(') || norm.startsWith(teacherNameNorm + '（');
                        });
                    };

                    if (loadedKey) {
                        triedKeys.push(loadedKey);
                        console.log('[TeacherSync] 拉取任课表 Key:', loadedKey);
                        const { data, error } = await sbClient.from('system_data').select('key,content,updated_at').eq('key', loadedKey).maybeSingle();
                        if (error) throw error;
                        if (data && data.content) pushCandidates([data]);
                    }

                    // 优先：按所选届数+学期匹配
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

                    // 次优先：按所选届数匹配（不限制学期）
                    if ((candidateRows.length === 0 || broadSearchForTeacher) && cohortId) {
                        const likePattern = `TEACHERS_${cohortId}级_%`;
                        triedKeys.push(`like:${likePattern}`);
                        const { data: rows, error } = await sbClient
                            .from('system_data')
                            .select('key,content,updated_at')
                            .like('key', likePattern)
                            .order('updated_at', { ascending: false })
                            .limit(30);
                        if (error) throw error;
                        pushCandidates(rows);
                    }

                    // 兜底：按学期匹配
                    if ((candidateRows.length === 0 || broadSearchForTeacher) && baseTerm) {
                        const likePattern = `TEACHERS_%_${baseTerm}`;
                        triedKeys.push(`like:${likePattern}`);
                        const { data: rows, error } = await sbClient
                            .from('system_data')
                            .select('key,content,updated_at')
                            .like('key', likePattern)
                            .order('updated_at', { ascending: false })
                            .limit(30);
                        if (error) throw error;
                        pushCandidates(rows);
                    }

                    // 最后兜底：最新任课表
                    if (candidateRows.length === 0) {
                        triedKeys.push('like:TEACHERS_% (latest)');
                        const { data: rows, error } = await sbClient
                            .from('system_data')
                            .select('key,content,updated_at')
                            .like('key', 'TEACHERS_%')
                            .order('updated_at', { ascending: false })
                            .limit(30);
                        if (error) throw error;
                        pushCandidates(rows);
                    }

                    let selectedRow = candidateRows.length ? candidateRows[0] : null;
                    if (broadSearchForTeacher && teacherNameNorm && candidateRows.length > 0) {
                        const hit = candidateRows.find(row => {
                            const parsed = parseTeacherPayload(row.content);
                            return parsed && teacherExistsInMap(parsed.map);
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
                        console.warn(`☁️ 云端未找到可用任课档案: ${loadedKey || '(无可用key)'}`);
                        const termHint = baseTerm || termId || '未识别学期';
                        const cohortHint = cohortId ? `${cohortId}级` : '未识别届数';
                        const keyHint = triedKeys.length ? triedKeys.join(' | ') : '(无)';
                        if (window.UI) {
                            UI.toast(`☁️ 未找到任课表：届数=${cohortHint}，学期=${termHint}；已尝试=${keyHint}`, "warning");
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
                        const fallbackSchool = (typeof inferDefaultSchoolFromContext === 'function') ? inferDefaultSchoolFromContext() : '';
                        if (fallbackSchool) {
                            schoolMap = {};
                            Object.keys(map).forEach(k => { schoolMap[k] = fallbackSchool; });
                        }
                    }
                    setTeacherMap(map);
                    setTeacherSchoolMap(schoolMap);
                    
                    // 🟢 [修复]：加载后自动同步到本地历史记录
                    if (window.DataManager && DataManager.syncTeacherHistory) DataManager.syncTeacherHistory();
                    if (window.DataManager && DataManager.renderTeachers) DataManager.renderTeachers();
                    if (window.DataManager && typeof DataManager.refreshTeacherAnalysis === 'function') {
                        DataManager.refreshTeacherAnalysis();
                    }
                    updateStatusPanel();
                    
                    if (window.UI) UI.toast(`✅ 已从云端加载本学期任课表（${Object.keys(map).length}条）`, "success");
                    logAction('任课同步', `任课表已加载：${loadedKey || 'fallback-key'}`);
                    console.log(`✅ 云端任课表加载成功: ${loadedKey || 'fallback-key'}, 共 ${Object.keys(map).length} 条记录`);
                } catch (e) {
                    console.error('云端加载失败:', e);
                    const msg = String(e?.message || e?.details || e?.hint || e || '未知错误');
                    const code = String(e?.code || '');
                    let reason = '☁️ 云端数据加载失败';

                    if (code === '42501' || /permission|policy|row-level|rls|权限/i.test(msg)) {
                        reason = '⛔ 权限策略拦截（RLS）：请管理员开放 system_data 的 SELECT 权限';
                    } else if (/network|fetch|failed to fetch|timeout|timed out|网络/i.test(msg)) {
                        reason = '🌐 网络异常：无法连接云端，请检查网络后重试';
                    } else if (/json|parse|unexpected token/i.test(msg)) {
                        reason = '🧩 云端任课表格式异常：请管理员重新同步任课表';
                    }

                    if (window.UI) UI.toast(`${reason}`, 'error');
                } finally {
                    if (window.UI) UI.loading(false);
                }
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
                console.log('%c测试工具（控制台输入）：', 'color: #8b5cf6; font-weight: bold;');
                console.log('• RoleManager.showCurrentPermissions() - 查看当前用户权限');
                console.log('• RoleManager.addRoleToCurrentUser("director") - 临时添加角色（测试用）');
                console.log('%c━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'color: #e5e7eb;');
                
                updateStatusPanel();
                updateRoleHint();
                renderActionLogs();
                scanDataIssues();
                if (!localStorage.getItem('HAS_SEEN_STARTER')) {
                    __guardBypass = true;
                    switchTab('starter-hub');
                    openStarterGuide();
                }
                scheduleTeacherSyncPrompt();
            }, 1000);
        });