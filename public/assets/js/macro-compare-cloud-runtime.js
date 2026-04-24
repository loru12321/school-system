(() => {
    if (typeof window === 'undefined' || window.__MACRO_COMPARE_CLOUD_RUNTIME_PATCHED__) return;

    const readMacroCompareCacheState = typeof window.readMacroCompareCacheState === 'function'
        ? window.readMacroCompareCacheState
        : (() => (window.MACRO_MULTI_PERIOD_COMPARE_CACHE && typeof window.MACRO_MULTI_PERIOD_COMPARE_CACHE === 'object'
            ? window.MACRO_MULTI_PERIOD_COMPARE_CACHE
            : null));
    const setMacroCompareCacheState = typeof window.setMacroCompareCacheState === 'function'
        ? window.setMacroCompareCacheState
        : ((cache) => {
            const nextCache = cache && typeof cache === 'object' && !Array.isArray(cache) ? cache : null;
            window.MACRO_MULTI_PERIOD_COMPARE_CACHE = nextCache;
            return nextCache;
        });

    async function saveMacroMultiPeriodCompareToCloud() {
        const cache = readMacroCompareCacheState();
        if (!cache) return alert('请先生成县域多期对比结果');
        if (!window.sbClient) return alert('云端服务未连接，无法保存');

        const cohortId = window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || 'unknown';
        const stamp = new Date().toISOString().split('T')[0];
        const rand = Date.now().toString().slice(-4);
        const safeSchool = String(cache.school || '').replace(/[^\w\u4e00-\u9fa5]/g, '');
        const key = `MACRO_COMPARE_${cohortId}_${safeSchool}_${stamp}_${rand}`;
        const title = `${cache.school} 县域多期对比`;

        const payload = {
            school: cache.school,
            examIds: cache.examIds,
            periodCount: cache.periodCount,
            summaryByExam: cache.summaryByExam,
            overviewByExam: cache.overviewByExam,
            allSchoolsChange: cache.allSchoolsChange,
            countyInsightRows: cache.countyInsightRows || [],
            schoolTrendRows: cache.schoolTrendRows || [],
            latestRankMatrix: cache.latestRankMatrix || [],
            rankMatrixHeaders: cache.rankMatrixHeaders || [],
            rankMatrixRows: cache.rankMatrixRows || [],
            countyHorizontalHeaders: cache.countyHorizontalHeaders || [],
            countyHorizontalRows: cache.countyHorizontalRows || [],
            countySubjectPortraitHeaders: cache.countySubjectPortraitHeaders || [],
            countySubjectPortraitRows: cache.countySubjectPortraitRows || [],
            countySubjectSchoolTables: cache.countySubjectSchoolTables || [],
            teacherCountyRows: cache.teacherCountyRows || [],
            teacherCountyCards: cache.teacherCountyCards || [],
            teacherCountySummary: cache.teacherCountySummary || null,
            teacherCountyRankingPanels: cache.teacherCountyRankingPanels || [],
            teacherCountyMessage: cache.teacherCountyMessage || '',
            html: cache.html,
            title,
            createdAt: new Date().toISOString(),
            createdBy: Auth?.currentUser?.username || Auth?.currentUser?.name || Auth?.currentUser?.email || 'unknown'
        };

        try {
            if (window.UI) UI.loading(true, '正在保存县域多期对比...');
            const compressed = 'LZ|' + LZString.compressToUTF16(JSON.stringify(payload));
            const { error } = await sbClient.from('system_data').upsert({
                key,
                content: compressed,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
            if (error) throw error;
            if (window.UI) UI.toast('县域多期对比已保存到云端', 'success');
        } catch (error) {
            console.error(error);
            alert(`保存失败: ${error.message}`);
        } finally {
            if (window.UI) UI.loading(false);
        }
    }

    async function viewCloudMacroCompares() {
        if (!window.sbClient) return alert('云端服务未连接');

        try {
            if (window.UI) UI.loading(true, '正在加载县域多期对比云端列表...');

            const user = getCurrentUser();
            const isAdmin = RoleManager.hasAnyRole(user, ['admin', 'director']);
            const cohortId = window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '';

            let query = sbClient.from('system_data').select('key, updated_at');
            if (!isAdmin && cohortId) {
                query = query.like('key', `MACRO_COMPARE_${cohortId}_%`);
            } else {
                query = query.like('key', 'MACRO_COMPARE_%');
            }

            const { data, error } = await query.order('updated_at', { ascending: false }).limit(50);
            if (error) throw error;
            if (window.UI) UI.loading(false);

            if (!data || data.length === 0) return alert('云端暂无县域多期对比记录');

            const html = data.map((item) => {
                const prefix = 'MACRO_COMPARE_';
                const body = String(item.key || '').startsWith(prefix)
                    ? String(item.key || '').slice(prefix.length)
                    : String(item.key || '');
                const parts = body.split('_');
                const cohort = parts[0] || '未知届别';
                const school = parts[1] || '未知学校';

                return `
                    <div style="padding:12px; border-bottom:1px solid #e2e8f0; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="loadCloudMacroCompare('${item.key}')">
                        <div style="flex:1;">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                <span style="background:#eff6ff; color:#2563eb; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">${cohort}</span>
                                <span style="font-weight:600; color:#334155;">${school}</span>
                            </div>
                            <div style="font-size:11px; color:#94a3b8; font-family:monospace;">${item.key}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:12px; color:#64748b;">${new Date(item.updated_at).toLocaleString('zh-CN')}</div>
                            <div style="font-size:11px; color:#3b82f6; margin-top:2px;">查看详情 &gt;</div>
                        </div>
                    </div>
                `;
            }).join('');

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '县域多期对比云端记录',
                    html: `<div style="max-height:400px; overflow-y:auto; text-align:left;">${html}</div>`,
                    width: 640,
                    showCloseButton: true,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            if (window.UI) UI.loading(false);
            console.error(error);
            alert(`加载失败: ${error.message}`);
        }
    }

    async function loadCloudMacroCompare(key) {
        if (!window.sbClient) return alert('云端服务未连接');

        try {
            if (typeof Swal !== 'undefined') Swal.close();
            if (window.UI) UI.loading(true, '正在加载县域多期对比详情...');
            const { data, error } = await sbClient.from('system_data').select('content').eq('key', key).single();
            if (error) throw error;

            let content = data.content;
            if (typeof content === 'string' && content.startsWith('LZ|')) {
                content = LZString.decompressFromUTF16(content.substring(3));
            }
            const payload = typeof content === 'string' ? JSON.parse(content) : content;

            const hintEl = document.getElementById('macroCompareHint');
            const resultEl = document.getElementById('macroCompareResult');
            if (resultEl) {
                resultEl.innerHTML = payload.html || '<div style="color:#94a3b8;">云端记录缺少展示内容</div>';
            }
            if (hintEl) {
                hintEl.innerHTML = `已加载云端县域对比：${payload.title || key}`;
                hintEl.style.color = '#7c3aed';
            }

            const cache = {
                school: payload.school,
                examIds: payload.examIds,
                periodCount: payload.periodCount,
                summaryByExam: payload.summaryByExam,
                overviewByExam: payload.overviewByExam,
                allSchoolsChange: payload.allSchoolsChange,
                countyInsightRows: payload.countyInsightRows || [],
                schoolTrendRows: payload.schoolTrendRows || [],
                latestRankMatrix: payload.latestRankMatrix || [],
                rankMatrixHeaders: payload.rankMatrixHeaders || [],
                rankMatrixRows: payload.rankMatrixRows || [],
                countyHorizontalHeaders: payload.countyHorizontalHeaders || [],
                countyHorizontalRows: payload.countyHorizontalRows || [],
                countySubjectPortraitHeaders: payload.countySubjectPortraitHeaders || [],
                countySubjectPortraitRows: payload.countySubjectPortraitRows || [],
                countySubjectSchoolTables: payload.countySubjectSchoolTables || [],
                teacherCountyRows: payload.teacherCountyRows || [],
                teacherCountyCards: payload.teacherCountyCards || [],
                teacherCountySummary: payload.teacherCountySummary || null,
                teacherCountyRankingPanels: payload.teacherCountyRankingPanels || [],
                teacherCountyMessage: payload.teacherCountyMessage || '',
                html: payload.html
            };

            window.MACRO_MULTI_PERIOD_COMPARE_CACHE = cache;
            setMacroCompareCacheState(cache);
        } catch (error) {
            console.error(error);
            alert(`加载失败: ${error.message}`);
        } finally {
            if (window.UI) UI.loading(false);
        }
    }

    Object.assign(window, {
        saveMacroMultiPeriodCompareToCloud,
        viewCloudMacroCompares,
        loadCloudMacroCompare
    });

    window.__MACRO_COMPARE_CLOUD_RUNTIME_PATCHED__ = true;
})();
