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

    function macroEscapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char]));
    }

    function sanitizeLegacyMacroCompareHtml(value) {
        const template = document.createElement('template');
        template.innerHTML = String(value || '');
        template.content.querySelectorAll('script,iframe,object,embed,base,meta,link,form').forEach((node) => node.remove());
        template.content.querySelectorAll('*').forEach((node) => {
            Array.from(node.attributes || []).forEach((attribute) => {
                const name = String(attribute.name || '').toLowerCase();
                const rawValue = String(attribute.value || '');
                if (name.startsWith('on') || ['src', 'srcset', 'href', 'xlink:href', 'action', 'formaction'].includes(name)) {
                    node.removeAttribute(attribute.name);
                } else if (name === 'style' && /(?:url\s*\(|expression\s*\(|@import|behavior\s*:|-moz-binding)/i.test(rawValue)) {
                    node.removeAttribute(attribute.name);
                }
            });
        });
        return template.innerHTML;
    }

    async function selectCloudMacroCompareRows(options = {}) {
        if (window.CloudDataService && typeof window.CloudDataService.selectSystemData === 'function') {
            return window.CloudDataService.selectSystemData(options);
        }
        if (window.CloudApi && typeof window.CloudApi.selectSystemData === 'function') {
            return window.CloudApi.selectSystemData(options);
        }
        if (!window.sbClient) return { data: [], error: new Error('CLOUD_CLIENT_MISSING') };
        let query = window.sbClient.from('system_data').select(options.select || '*');
        if (options.keyEq) query = query.eq('key', options.keyEq);
        if (options.keyLike) query = query.like('key', options.keyLike);
        if (options.order) query = query.order(options.order, { ascending: options.ascending !== false });
        if (options.limit) query = query.limit(options.limit);
        if (options.maybeSingle && typeof query.maybeSingle === 'function') query = query.maybeSingle();
        return query;
    }

    function hasCloudCompareAccess() {
        return !!(
            window.CloudApi
            || window.cloudClient
            || window.sbClient
        );
    }

    async function upsertCloudMacroCompareRow(row) {
        if (window.CloudDataService && typeof window.CloudDataService.upsertSystemDataRecord === 'function') {
            return window.CloudDataService.upsertSystemDataRecord(row);
        }
        if (window.CloudApi && typeof window.CloudApi.upsertSystemData === 'function') {
            return window.CloudApi.upsertSystemData(row);
        }
        if (typeof window.upsertSystemDataRecord === 'function') {
            return window.upsertSystemDataRecord(row);
        }
        if (!window.sbClient || typeof window.sbClient.from !== 'function') {
            return { data: null, error: new Error('CLOUD_CLIENT_MISSING') };
        }
        return window.sbClient.from('system_data').upsert(row, { onConflict: 'key' });
    }

    async function saveMacroMultiPeriodCompareToCloud() {
        const MACRO_MULTI_PERIOD_COMPARE_CACHE = readMacroCompareCacheState();
        window.MACRO_MULTI_PERIOD_COMPARE_CACHE = MACRO_MULTI_PERIOD_COMPARE_CACHE;
        if (!window.MACRO_MULTI_PERIOD_COMPARE_CACHE) return window.UI.alert('请先生成校际多期对比结果');
        if (!hasCloudCompareAccess()) return window.UI.alert('☁️ 云端服务未连接，无法保存');

        const cache = MACRO_MULTI_PERIOD_COMPARE_CACHE;
        const cohortId = window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || 'unknown';
        const stamp = new Date().toISOString().split('T')[0];
        const rand = Date.now().toString().slice(-4);
        const safeSchool = String(cache.school || '').replace(/[^\w\u4e00-\u9fa5]/g, '');
        const key = `MACRO_COMPARE_${cohortId}级_${safeSchool}_${stamp}_${rand}`;
        const title = `${cache.school} 校际联考六子模块多期对比`;

        const payload = {
            school: cache.school,
            examIds: cache.examIds,
            periodCount: cache.periodCount,
            summaryByExam: cache.summaryByExam,
            allSchoolsChange: cache.allSchoolsChange,
            moduleSeries: cache.moduleSeries,
            html: cache.html,
            title,
            createdAt: new Date().toISOString(),
            createdBy: Auth?.currentUser?.username || Auth?.currentUser?.name || Auth?.currentUser?.email || 'unknown'
        };

        try {
            if (window.UI) UI.loading(true, '☁️ 正在保存校际多期对比...');
            const compressed = 'LZ|' + LZString.compressToUTF16(JSON.stringify(payload));
            const { error } = await upsertCloudMacroCompareRow({
                key,
                content: compressed,
                updated_at: new Date().toISOString()
            });
            if (error) throw error;
            if (window.UI) UI.toast('✅ 校际多期对比已保存到云端', 'success');
        } catch (e) {
            console.error(e);
            window.UI.alert('保存失败: ' + e.message);
        } finally {
            if (window.UI) UI.loading(false);
        }
    }

    async function viewCloudMacroCompares() {
        if (!hasCloudCompareAccess()) return window.UI.alert('☁️ 云端服务未连接');
        try {
            if (window.UI) UI.loading(true, '☁️ 正在加载校际对比云端列表...');

            const user = getCurrentUser();
            const isAdmin = RoleManager.hasAnyRole(user, ['admin', 'director']);
            const cohortId = window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '';

            const { data, error } = await selectCloudMacroCompareRows({
                select: 'key, updated_at',
                keyLike: (!isAdmin && cohortId) ? `MACRO_COMPARE_${cohortId}级_%` : 'MACRO_COMPARE_%',
                order: 'updated_at',
                ascending: false,
                limit: 50
            });
            if (error) throw error;
            if (window.UI) UI.loading(false);

            if (!data || data.length === 0) return window.UI.alert('☁️ 云端暂无校际多期对比记录');

            const html = data.map((item) => {
                const keyParts = item.key.split('_');
                const cohort = keyParts[1] || '未知届别';
                const school = keyParts[2] || '未知学校';
                return `
                    <button type="button" data-macro-compare-key="${macroEscapeHtml(item.key)}" style="width:100%; border:0; padding:12px; border-bottom:1px solid #e2e8f0; cursor:pointer; display:flex; justify-content:space-between; align-items:center; background:#fff; text-align:left;">
                        <div style="flex:1;">
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                                <span style="background:#eff6ff; color:#2563eb; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">${macroEscapeHtml(cohort)}</span>
                                <span style="font-weight:600; color:#334155;">${macroEscapeHtml(school)}</span>
                            </div>
                            <div style="font-size:11px; color:#94a3b8; font-family:monospace;">${macroEscapeHtml(item.key)}</div>
                        </div>
                        <div style="text-align:right;">
                            <div style="font-size:12px; color:#64748b;">${new Date(item.updated_at).toLocaleString('zh-CN')}</div>
                            <div style="font-size:11px; color:#3b82f6; margin-top:2px;">详情 &gt;</div>
                        </div>
                    </button>
                `;
            }).join('');

            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: '☁️ 校际多期对比云端记录',
                    html: `<div style="max-height:400px; overflow-y:auto; text-align:left;">${html}</div>`,
                    width: 640,
                    showCloseButton: true,
                    showConfirmButton: false,
                    didOpen: (popup) => {
                        popup.querySelectorAll('[data-macro-compare-key]').forEach((button) => {
                            button.addEventListener('click', () => loadCloudMacroCompare(String(button.dataset.macroCompareKey || '')));
                        });
                    }
                });
            }
        } catch (e) {
            if (window.UI) UI.loading(false);
            console.error(e);
            window.UI.alert('加载失败: ' + e.message);
        }
    }

    async function loadCloudMacroCompare(key) {
        if (!hasCloudCompareAccess()) return window.UI.alert('☁️ 云端服务未连接');
        try {
            if (typeof Swal !== 'undefined') Swal.close();
            if (window.UI) UI.loading(true, '☁️ 正在加载校际对比详情...');
            const { data, error } = await selectCloudMacroCompareRows({
                select: 'content',
                keyEq: key,
                maybeSingle: true
            });
            if (error) throw error;

            let content = data.content;
            if (typeof content === 'string' && content.startsWith('LZ|')) {
                content = LZString.decompressFromUTF16(content.substring(3));
            }
            const payload = typeof content === 'string' ? JSON.parse(content) : content;

            const hintEl = document.getElementById('macroCompareHint');
            const resultEl = document.getElementById('macroCompareResult');
            const safeHtml = sanitizeLegacyMacroCompareHtml(payload?.html);
            if (resultEl) resultEl.innerHTML = safeHtml || '<div style="color:#94a3b8;">云端记录缺少展示内容</div>';
            if (hintEl) {
                hintEl.textContent = `✅ 已加载云端校际对比：${payload?.title || key}`;
                hintEl.style.color = '#7c3aed';
            }

            window.MACRO_MULTI_PERIOD_COMPARE_CACHE = {
                school: payload.school,
                examIds: payload.examIds,
                periodCount: payload.periodCount,
                summaryByExam: payload.summaryByExam,
                allSchoolsChange: payload.allSchoolsChange,
                moduleSeries: payload.moduleSeries,
                html: safeHtml
            };
            setMacroCompareCacheState(window.MACRO_MULTI_PERIOD_COMPARE_CACHE);
        } catch (e) {
            console.error(e);
            window.UI.alert('加载失败: ' + e.message);
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
