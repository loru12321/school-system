(() => {
    if (typeof window === 'undefined' || window.__TEACHER_COMPARE_CLOUD_RUNTIME_PATCHED__) return;

    const readTeacherCompareCacheState = typeof window.readTeacherCompareCacheState === 'function'
        ? window.readTeacherCompareCacheState
        : (() => (window.TEACHER_MULTI_PERIOD_COMPARE_CACHE && typeof window.TEACHER_MULTI_PERIOD_COMPARE_CACHE === 'object'
            ? window.TEACHER_MULTI_PERIOD_COMPARE_CACHE
            : null));
    const setTeacherCompareCacheState = typeof window.setTeacherCompareCacheState === 'function'
        ? window.setTeacherCompareCacheState
        : ((cache) => {
            const nextCache = cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : null;
            window.TEACHER_MULTI_PERIOD_COMPARE_CACHE = nextCache;
            return nextCache;
        });

    async function saveTeacherMultiPeriodCompareToCloud() {
        const TEACHER_MULTI_PERIOD_COMPARE_CACHE = readTeacherCompareCacheState();
        window.TEACHER_MULTI_PERIOD_COMPARE_CACHE = TEACHER_MULTI_PERIOD_COMPARE_CACHE;
        if (!window.TEACHER_MULTI_PERIOD_COMPARE_CACHE) {
            return alert('请先生成教师多期对比或全校对比结果');
        }

        if (!window.sbClient) {
            return alert('☁️ 云端服务未连接，无法保存');
        }

        const user = Auth.currentUser;
        if (!user || user.role === 'guest') {
            return alert('⛔ 权限不足：只有登录用户可以保存对比结果到云端');
        }

        const cache = TEACHER_MULTI_PERIOD_COMPARE_CACHE;
        const isBatch = !!cache.isBatchMode;
        const cohortId = window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || 'unknown';
        const timestamp = new Date().toISOString().split('T')[0];
        const rand = Date.now().toString().slice(-4);

        let key, title;
        if (isBatch) {
            const safeSchool = cache.school.replace(/[^\w\u4e00-\u9fa5]/g, '');
            key = `TEACHER_COMPARE_BATCH_${cohortId}级_${safeSchool}_${timestamp}_${rand}`;
            title = `${cache.school} 全校教师多期对比`;
        } else {
            const safeTeacher = cache.teacher.replace(/[^\w\u4e00-\u9fa5]/g, '');
            const subject = cache.subject || '未知学科';
            key = `TEACHER_COMPARE_${cohortId}级_${safeTeacher}_${subject}_${timestamp}_${rand}`;
            title = `${cache.school} ${cache.teacher} ${subject}多期对比`;
        }

        try {
            if (window.UI) UI.loading(true, '☁️ 正在保存到云端...');

            const payload = {
                school: cache.school,
                subject: cache.subject,
                teacher: cache.teacher,
                examIds: cache.examIds,
                periodCount: cache.periodCount,
                delta: cache.delta,
                metricRows: cache.metricRows,
                isBatchMode: isBatch,
                batchResults: cache.batchResults || null,
                thsHtml: cache.thsHtml || null,
                title,
                createdBy: user.username || user.name || user.email,
                createdAt: new Date().toISOString()
            };

            const compressed = 'LZ|' + LZString.compressToUTF16(JSON.stringify(payload));
            const { error } = await sbClient.from('system_data').upsert({
                key,
                content: compressed,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });

            if (error) throw error;
            if (window.UI) UI.toast(`✅ 已保存云端对比: ${title}`, 'success');
        } catch (e) {
            console.error('Teacher Comparison Cloud Save Error:', e);
            alert('保存失败: ' + (e.message || String(e)));
        } finally {
            if (window.UI) UI.loading(false);
        }
    }

    async function viewCloudTeacherCompares() {
        if (!sbClient) return alert('☁️ 云端服务未连接');

        try {
            if (window.UI) UI.loading(true, '☁️ 正在加载云端列表...');

            const user = getCurrentUser();
            const isAdmin = RoleManager.hasAnyRole(user, ['admin', 'director']);
            const cohortId = window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '';

            let query = sbClient.from('system_data').select('key, updated_at');
            if (!isAdmin && cohortId) {
                query = query.or(`key.like.TEACHER_COMPARE_${cohortId}级_%,key.like.TEACHER_COMPARE_BATCH_${cohortId}级_%`);
            } else {
                query = query.like('key', 'TEACHER_COMPARE_%');
            }

            const { data, error } = await query.order('updated_at', { ascending: false }).limit(50);
            if (error) throw error;
            if (window.UI) UI.loading(false);

            if (!data || data.length === 0) {
                return alert('☁️ 云端暂无已保存的教师对比记录');
            }

            const listHtml = data.map((item) => {
                const keyParts = item.key.replace('TEACHER_COMPARE_BATCH_', '').replace('TEACHER_COMPARE_', '').split('_');
                const cohort = keyParts[0] || '未知届别';
                const name = keyParts[1] || '全校/未知';
                const subject = keyParts[2] || '全科/未知';
                const displayDate = new Date(item.updated_at).toLocaleString('zh-CN');
                const isBatch = item.key.includes('_BATCH_');
                return `<div style="padding:12px; border-bottom:1px solid #e2e8f0; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="loadCloudTeacherCompare('${item.key}')">
                        <div style="flex:1;">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                <span style="background:#faf5ff; color:#7c3aed; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">${cohort}</span>
                                <span style="background:#fff7ed; color:#ea580c; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">${isBatch ? '全校' : '个人'}</span>
                                <span style="font-weight:600; color:#334155;">${name} (${subject})</span>
                            </div>
                            <div style="font-size:11px; color:#94a3b8; font-family:monospace;">${item.key}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:12px; color:#64748b;">${displayDate}</div>
                            <div style="font-size:11px; color:#3b82f6; margin-top:2px;">详情 &gt;</div>
                        </div>
                    </div>`;
            }).join('');

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '☁️ 云端教师对比记录',
                    html: `<div style="max-height:400px; overflow-y:auto; text-align:left;">${listHtml}</div>`,
                    width: 600,
                    showCloseButton: true,
                    showConfirmButton: false
                });
            } else if (window.UI) {
                UI.toast('请在支持Swal的环境下使用', 'warning');
            }
        } catch (e) {
            if (window.UI) UI.loading(false);
            console.error('加载列表失败:', e);
            alert('加载失败');
        }
    }

    async function loadCloudTeacherCompare(key) {
        if (typeof Swal !== 'undefined') Swal.close();
        if (window.UI) UI.loading(true, '☁️ 正在下载详情...');

        try {
            const { data, error } = await sbClient
                .from('system_data')
                .select('content')
                .eq('key', key)
                .single();

            if (error) throw error;

            let content = data.content;
            if (typeof content === 'string' && content.startsWith('LZ|')) {
                content = LZString.decompressFromUTF16(content.substring(3));
            }
            const payload = typeof content === 'string' ? JSON.parse(content) : content;
            renderCloudTeacherCompareDetail(payload);

            if (window.UI) {
                UI.loading(false);
                UI.toast('✅ 加载成功', 'success');
            }
        } catch (e) {
            console.error(e);
            if (window.UI) UI.loading(false);
            alert('加载详情失败: ' + e.message);
        }
    }

    function renderCloudTeacherCompareDetail(payload) {
        const resultEl = document.getElementById('teacherCompareResult');
        const hintEl = document.getElementById('teacherCompareHint');
        if (!resultEl) return;

        const { school, examIds, delta, metricRows, title, createdAt, createdBy, isBatchMode, thsHtml, batchResults } = payload;

        if (isBatchMode) {
            if (batchResults) {
                window.ALL_TEACHERS_DIFF_CACHE = { results: batchResults, school, examIds, periodCount: payload.periodCount };
            }
            resultEl.innerHTML = `
                    <div class="sub-header" style="color:#7c3aed;">☁️ [云端存档] ${title}</div>
                    <div class="table-wrap" style="max-height:600px; overflow-y:auto;">
                        <table class="common-table" style="font-size:13px;">
                            <thead style="position:sticky; top:0; z-index:10;"><tr>${thsHtml}</tr></thead>
                            <tbody>${metricRows}</tbody>
                        </table>
                    </div>
                    <div style="margin-top:10px; display:flex; gap:10px;">
                        <button class="btn btn-sm" onclick="exportAllTeachersMultiPeriodDiff('${school}', '${examIds.join('_')}')">📤 导出Excel</button>
                        ${payload.delta === undefined ? '<span style="font-size:12px;color:#64748b;">(表格可左右滑动查看)</span>' : ''}
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#94a3b8; text-align:right;">
                        存档时间: ${new Date(createdAt).toLocaleString()} | 创建人: ${createdBy || '未知'}
                    </div>
                `;
        } else {
            const deltaAvg = (typeof delta?.townshipAvg === 'number') ? delta.townshipAvg : ((typeof delta?.township === 'number') ? delta.township : null);
            const deltaExc = (typeof delta?.townshipExc === 'number') ? delta.townshipExc : null;
            const deltaPass = (typeof delta?.townshipPass === 'number') ? delta.townshipPass : null;
            resultEl.innerHTML = `
                    <div class="sub-header" style="color:#7c3aed;">☁️ [云端存档] ${title}</div>
                    <div class="table-wrap"><table class="mobile-card-table"><thead><tr><th>期次</th><th>均分镇排</th><th>优秀率镇排</th><th>及格率镇排</th></tr></thead><tbody>${metricRows}</tbody></table></div>
                    <div style="margin-top:8px; font-size:12px; color:#475569;">
                        首末期变化（${examIds[0]} → ${examIds[examIds.length - 1]}）：
                        均分镇排 ${deltaAvg === null ? '-' : (deltaAvg >= 0 ? '+' : '') + deltaAvg}，
                        优秀率镇排 ${deltaExc === null ? '-' : (deltaExc >= 0 ? '+' : '') + deltaExc}，
                        及格率镇排 ${deltaPass === null ? '-' : (deltaPass >= 0 ? '+' : '') + deltaPass}
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#94a3b8; text-align:right;">
                        存档时间: ${new Date(createdAt).toLocaleString()} | 创建人: ${createdBy || '未知'}
                    </div>
                `;
        }

        if (hintEl) {
            hintEl.innerHTML = `✅ 已加载云端存档：${title}`;
            hintEl.style.color = '#7c3aed';
        }
        setTeacherCompareCacheState({
            school,
            subject: payload.subject,
            teacher: payload.teacher,
            examIds,
            periodCount: payload.periodCount,
            examStats: payload.examStats || [],
            delta,
            metricRows,
            isBatchMode: !!isBatchMode,
            batchResults: batchResults || null,
            thsHtml: thsHtml || null
        });
    }

    Object.assign(window, {
        saveTeacherMultiPeriodCompareToCloud,
        viewCloudTeacherCompares,
        loadCloudTeacherCompare,
        renderCloudTeacherCompareDetail
    });

    window.__TEACHER_COMPARE_CLOUD_RUNTIME_PATCHED__ = true;
})();
