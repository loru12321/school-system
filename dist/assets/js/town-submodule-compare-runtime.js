(() => {
    if (typeof window === 'undefined' || window.__TOWN_SUBMODULE_COMPARE_RUNTIME_PATCHED__) return;

    const readTownSubmoduleCompareEntryState = typeof window.readTownSubmoduleCompareEntryState === 'function'
        ? window.readTownSubmoduleCompareEntryState
        : ((submoduleId) => {
            const cache = window.TOWN_SUBMODULE_COMPARE_CACHE && typeof window.TOWN_SUBMODULE_COMPARE_CACHE === 'object'
                ? window.TOWN_SUBMODULE_COMPARE_CACHE
                : {};
            return submoduleId && Object.prototype.hasOwnProperty.call(cache, submoduleId)
                ? cache[submoduleId]
                : null;
        });
    const setTownSubmoduleCompareEntryState = typeof window.setTownSubmoduleCompareEntryState === 'function'
        ? window.setTownSubmoduleCompareEntryState
        : ((submoduleId, entry) => {
            const cache = window.TOWN_SUBMODULE_COMPARE_CACHE && typeof window.TOWN_SUBMODULE_COMPARE_CACHE === 'object'
                ? { ...window.TOWN_SUBMODULE_COMPARE_CACHE }
                : {};
            if (!submoduleId) return null;
            if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
                cache[submoduleId] = entry;
            } else {
                delete cache[submoduleId];
            }
            window.TOWN_SUBMODULE_COMPARE_CACHE = cache;
            return Object.prototype.hasOwnProperty.call(cache, submoduleId) ? cache[submoduleId] : null;
        });

const TOWN_SUBMODULE_META = {
    summary: '综合评价总榜',
    analysis: '两率一分(横向)',
    'macro-watch': '预警与亮点看板',
    'high-score': '高分段/尖子生',
    indicator: '指标生达标核算',
    bottom3: '低分率/后1/3核算'
};

function ensureTownSubmoduleCompareUIs() {
    Object.entries(TOWN_SUBMODULE_META).forEach(([submoduleId, title]) => {
        const section = document.getElementById(submoduleId);
        if (!section) return;
        if (section.querySelector(`.town-submodule-compare-panel[data-submodule="${submoduleId}"]`)) return;

        const panel = document.createElement('div');
        panel.className = 'town-submodule-compare-panel';
        panel.setAttribute('data-submodule', submoduleId);
        panel.style.cssText = 'margin:10px 0 14px 0; padding:10px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc;';
        panel.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; gap:10px; flex-wrap:wrap;">
                    <div style="font-weight:600; color:#334155;">🧭 ${title} 多期对比（2期/3期）</div>
                    <div style="display:flex; gap:8px; flex-wrap:wrap;">
                        <button class="btn btn-sm btn-blue" onclick="openTownSubmoduleCompareDialog('${submoduleId}')">生成多期对比</button>
                        <button class="btn btn-sm btn-green" onclick="exportTownSubmoduleCompare('${submoduleId}')">导出多期对比</button>
                        <button class="btn btn-sm" style="background:#8b5cf6; color:white;" onclick="saveTownSubmoduleCompareToCloud('${submoduleId}')">☁️ 保存云端对比</button>
                        <button class="btn btn-sm" style="background:#06b6d4; color:white;" onclick="viewCloudTownSubmoduleCompares('${submoduleId}')">📋 查看云端对比</button>
                    </div>
                </div>
                <div id="town-submodule-compare-hint-${submoduleId}" style="margin-top:6px; font-size:12px; color:#64748b;">请选择学校与考试期次后生成。</div>
                <div id="town-submodule-compare-result-${submoduleId}" style="margin-top:10px;"></div>
            `;

        const secHead = section.querySelector('.sec-head');
        if (secHead && secHead.parentNode) secHead.parentNode.insertBefore(panel, secHead.nextSibling);
        else section.insertBefore(panel, section.firstChild);
    });
}

function getTownSubmoduleSeries(submoduleId, selectedByExam, summaryByExam, school) {
    const calcBottom3Avg = (rows) => {
        const totals = (rows || []).map(r => Number(r.total)).filter(v => Number.isFinite(v)).sort((a, b) => b - a);
        if (!totals.length) return { avg: 0, lowRate: 0, lowCount: 0, totalN: 0 };
        const totalN = totals.length;
        const bottomN = Math.ceil(totalN / 3);
        const excN = Math.ceil(bottomN * (CONFIG?.excRate || 0));
        const bottomGroup = totals.slice(-bottomN);
        const validGroup = bottomGroup.slice(0, Math.max(0, bottomGroup.length - excN));
        const avg = validGroup.length ? validGroup.reduce((a, b) => a + b, 0) / validGroup.length : 0;

        const subjectCount = (SUBJECTS && SUBJECTS.length) ? SUBJECTS.length : 1;
        const lowThreshold = subjectCount * 72 * 0.6;
        const lowCount = totals.filter(v => v < lowThreshold).length;
        const lowRate = lowCount / totalN;
        return { avg, lowRate, lowCount, totalN };
    };

    const calcHighScore = (rows) => {
        const totals = (rows || []).map(r => Number(r.total)).filter(v => Number.isFinite(v));
        const count = totals.length;
        if (!count) return { highCount: 0, highRate: 0, threshold: 0 };
        const subjectCount = (SUBJECTS && SUBJECTS.length) ? SUBJECTS.length : 1;
        const threshold = subjectCount * 90;
        const highCount = totals.filter(v => v >= threshold).length;
        return { highCount, highRate: highCount / count, threshold };
    };

    const calcIndicator = (rows) => {
        const totals = (rows || []).map(r => Number(r.total)).filter(v => Number.isFinite(v));
        const count = totals.length;
        if (!count) return { indicatorCount: 0, indicatorRate: 0, label: '未设置' };
        const ind1 = Number(window.SYS_VARS?.indicator?.ind1);
        const ind2 = Number(window.SYS_VARS?.indicator?.ind2);
        if (Number.isFinite(ind1) && Number.isFinite(ind2)) {
            const minV = Math.min(ind1, ind2);
            const maxV = Math.max(ind1, ind2);
            const indicatorCount = totals.filter(v => v >= minV && v <= maxV).length;
            return { indicatorCount, indicatorRate: indicatorCount / count, label: `${minV}-${maxV}` };
        }
        const high = calcHighScore(rows);
        return { indicatorCount: high.highCount, indicatorRate: high.highRate, label: '未设置(回退高分段)' };
    };

    const series = selectedByExam.map((x, idx) => {
        const schoolSummary = getSummaryEntryBySchool(summaryByExam[idx]?.summary, school);
        const metrics = calcSchoolMetricsFromRows(x.rows);
        const bottom3 = calcBottom3Avg(x.rows);
        const high = calcHighScore(x.rows);
        const indicator = calcIndicator(x.rows);
        const riskLevel = metrics.passRate < 0.6
            ? '红色预警'
            : (metrics.passRate < 0.75 || metrics.excRate < 0.15 ? '黄色关注' : '绿色稳定');
        return {
            examId: x.examId,
            count: metrics.count,
            avg: metrics.avg,
            excRate: metrics.excRate,
            passRate: metrics.passRate,
            rankAvg: schoolSummary?.rankAvg || '-',
            riskLevel,
            highCount: high.highCount,
            highRate: high.highRate,
            highThreshold: high.threshold,
            indicatorCount: indicator.indicatorCount,
            indicatorRate: indicator.indicatorRate,
            indicatorLabel: indicator.label,
            bottom3Avg: bottom3.avg,
            lowRate: bottom3.lowRate,
            lowCount: bottom3.lowCount
        };
    });

    if (submoduleId === 'summary' || submoduleId === 'analysis') {
        return {
            headers: ['期次', '人数', '总分均分', '优秀率', '及格率', '校际均分排位'],
            rows: series.map(s => [s.examId, s.count, s.avg.toFixed(2), `${(s.excRate * 100).toFixed(1)}%`, `${(s.passRate * 100).toFixed(1)}%`, s.rankAvg]),
            note: '口径：综合评价总榜 / 两率一分'
        };
    }
    if (submoduleId === 'macro-watch') {
        return {
            headers: ['期次', '预警等级', '总分均分', '优秀率', '及格率', '校际均分排位'],
            rows: series.map(s => [s.examId, s.riskLevel, s.avg.toFixed(2), `${(s.excRate * 100).toFixed(1)}%`, `${(s.passRate * 100).toFixed(1)}%`, s.rankAvg]),
            note: '口径：预警看板核心阈值'
        };
    }
    if (submoduleId === 'high-score') {
        return {
            headers: ['期次', '高分段阈值', '高分段人数', '高分段占比'],
            rows: series.map(s => [s.examId, s.highThreshold, s.highCount, `${(s.highRate * 100).toFixed(1)}%`]),
            note: '口径：高分段/尖子生'
        };
    }
    if (submoduleId === 'indicator') {
        return {
            headers: ['期次', '指标区间', '指标生人数', '指标生占比'],
            rows: series.map(s => [s.examId, s.indicatorLabel, s.indicatorCount, `${(s.indicatorRate * 100).toFixed(1)}%`]),
            note: '口径：指标生达标核算'
        };
    }
    return {
        headers: ['期次', '后1/3均分', '低分人数', '低分率'],
        rows: series.map(s => [s.examId, s.bottom3Avg.toFixed(2), s.lowCount, `${(s.lowRate * 100).toFixed(1)}%`]),
        note: '口径：低分率/后1/3核算'
    };
}

async function openTownSubmoduleCompareDialog(submoduleId) {
    const schoolList = listAvailableSchoolsForCompare();
    const examList = listAvailableExamsForCompare();
    if (schoolList.length === 0) return alert('暂无可选学校');
    if (examList.length < 2) return alert('考试数量不足，至少2期');

    const title = TOWN_SUBMODULE_META[submoduleId] || submoduleId;
    const schoolOptions = schoolList.map(s => `<option value="${s}">${s}</option>`).join('');
    const examOptions = examList.map(e => `<option value="${e.id}">${e.label}</option>`).join('');

    const defaultIds = getDefaultCompareExamIds(examList, examList.length >= 3 ? 3 : 2, CURRENT_EXAM_ID);
    const schoolDefault = (MY_SCHOOL && schoolList.includes(MY_SCHOOL)) ? MY_SCHOOL : schoolList[0];
    const exam1Default = defaultIds[0] || '';
    const exam2Default = defaultIds[1] || defaultIds[0] || '';
    const exam3Default = defaultIds[2] || defaultIds[defaultIds.length - 1] || '';

    if (typeof Swal === 'undefined') {
        return alert('当前环境不支持弹窗，请升级页面依赖后重试');
    }

    const res = await Swal.fire({
        title: `🧭 ${title} 多期对比`,
        html: `
                <div style="text-align:left; display:flex; flex-direction:column; gap:8px;">
                    <label>学校：<select id="townSubSchool" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:6px;">${schoolOptions}</select></label>
                    <label>期数：
                        <select id="townSubPeriod" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:6px;" onchange="document.getElementById('townSubExam3Wrap').style.display=this.value==='3'?'block':'none'">
                            <option value="2">2期</option>
                            <option value="3">3期</option>
                        </select>
                    </label>
                    <label>第1期：<select id="townSubExam1" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:6px;">${examOptions}</select></label>
                    <label>第2期：<select id="townSubExam2" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:6px;">${examOptions}</select></label>
                    <div id="townSubExam3Wrap" style="display:none;">
                        <label>第3期：<select id="townSubExam3" style="width:100%; padding:6px; border:1px solid #cbd5e1; border-radius:6px;">${examOptions}</select></label>
                    </div>
                </div>
            `,
        showCancelButton: true,
        confirmButtonText: '生成对比',
        cancelButtonText: '取消',
        didOpen: () => {
            document.getElementById('townSubSchool').value = schoolDefault;
            document.getElementById('townSubExam1').value = exam1Default;
            document.getElementById('townSubExam2').value = exam2Default;
            document.getElementById('townSubExam3').value = exam3Default;
        },
        preConfirm: () => {
            const school = document.getElementById('townSubSchool').value;
            const periodCount = parseInt(document.getElementById('townSubPeriod').value || '2');
            const e1 = document.getElementById('townSubExam1').value;
            const e2 = document.getElementById('townSubExam2').value;
            const e3 = document.getElementById('townSubExam3').value;
            const examIds = periodCount === 3 ? [e1, e2, e3] : [e1, e2];
            if (!school || examIds.some(x => !x)) {
                Swal.showValidationMessage('请完整选择学校和考试期次');
                return false;
            }
            if (new Set(examIds).size !== examIds.length) {
                Swal.showValidationMessage('期次不能重复');
                return false;
            }
            return { school, periodCount, examIds };
        }
    });

    if (!res.isConfirmed) return;
    const { school, periodCount, examIds } = res.value;
    renderTownSubmoduleMultiPeriodComparison(submoduleId, school, examIds, periodCount);
}

function renderTownSubmoduleMultiPeriodComparison(submoduleId, school, examIds, periodCount) {
    const hintEl = document.getElementById(`town-submodule-compare-hint-${submoduleId}`);
    const resultEl = document.getElementById(`town-submodule-compare-result-${submoduleId}`);
    if (!hintEl || !resultEl) return;

    const rowsByExam = examIds.map(id => ({ examId: id, rows: getExamRowsForCompare(id) }));
    if (rowsByExam.some(x => !x.rows.length)) {
        hintEl.innerHTML = '❌ 某些期次没有可用数据，请检查考试数据。';
        hintEl.style.color = '#dc2626';
        resultEl.innerHTML = '';
        return;
    }

    const summaryByExam = rowsByExam.map(x => ({ examId: x.examId, summary: buildSchoolSummaryForExam(x.rows) }));
    const selectedByExam = rowsByExam.map(x => ({ examId: x.examId, rows: filterRowsBySchool(x.rows, school) }));
    if (!selectedByExam.every(x => x.rows.length > 0)) {
        hintEl.innerHTML = '❌ 所选学校在某些期次中无数据，无法对比。';
        hintEl.style.color = '#dc2626';
        resultEl.innerHTML = '';
        return;
    }

    const data = getTownSubmoduleSeries(submoduleId, selectedByExam, summaryByExam, school);
    const th = data.headers.map(h => `<th>${h}</th>`).join('');
    const tr = data.rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('');
    const title = TOWN_SUBMODULE_META[submoduleId] || submoduleId;

    const html = `
            <div class="sub-header">📊 ${title} 多期对比（${school}）</div>
            <div class="table-wrap"><table class="mobile-card-table"><thead><tr>${th}</tr></thead><tbody>${tr || `<tr><td colspan="${data.headers.length}" style="text-align:center;color:#94a3b8;">暂无数据</td></tr>`}</tbody></table></div>
            <div style="margin-top:6px; font-size:12px; color:#64748b;">${data.note || ''}</div>
        `;

    resultEl.innerHTML = html;
    hintEl.innerHTML = `✅ 已完成 ${periodCount} 期对比：${examIds.join(' → ')}`;
    hintEl.style.color = '#16a34a';

    setTownSubmoduleCompareEntryState(submoduleId, {
        submoduleId,
        title,
        school,
        examIds,
        periodCount,
        headers: data.headers,
        rows: data.rows,
        note: data.note,
        html
    });
}

function exportTownSubmoduleCompare(submoduleId) {
    const cache = readTownSubmoduleCompareEntryState(submoduleId);
    if (!cache) return alert('请先生成多期对比结果');
    const wb = XLSX.utils.book_new();
    const aoa = [cache.headers, ...cache.rows];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), '多期对比');
    XLSX.writeFile(wb, `${cache.title}_多期对比_${cache.school}_${cache.examIds.join('_')}.xlsx`);
}

async function saveTownSubmoduleCompareToCloud(submoduleId) {
    const cache = readTownSubmoduleCompareEntryState(submoduleId);
    if (!cache) return alert('请先生成多期对比结果');
    if (!sbClient) return alert('☁️ 云端服务未连接，无法保存');

    const cohortId = window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || 'unknown';
    const stamp = new Date().toISOString().split('T')[0];
    const rand = Date.now().toString().slice(-4);
    const safeSchool = String(cache.school || '').replace(/[^\w\u4e00-\u9fa5]/g, '');
    const key = `TOWN_SUB_COMPARE_${submoduleId}_${cohortId}级_${safeSchool}_${stamp}_${rand}`;

    const payload = {
        ...cache,
        createdAt: new Date().toISOString(),
        createdBy: Auth?.currentUser?.username || Auth?.currentUser?.name || Auth?.currentUser?.email || 'unknown'
    };

    try {
        if (window.UI) UI.loading(true, '☁️ 正在保存云端对比...');
        const compressed = 'LZ|' + LZString.compressToUTF16(JSON.stringify(payload));
        const { error } = await sbClient.from('system_data').upsert({ key, content: compressed, updated_at: new Date().toISOString() }, { onConflict: 'key' });
        if (error) throw error;
        if (window.UI) UI.toast('✅ 云端保存成功', 'success');
    } catch (e) {
        console.error(e);
        alert('保存失败: ' + e.message);
    } finally {
        if (window.UI) UI.loading(false);
    }
}

async function viewCloudTownSubmoduleCompares(submoduleId) {
    if (!sbClient) return alert('☁️ 云端服务未连接');
    try {
        if (window.UI) UI.loading(true, '☁️ 正在加载云端列表...');

        const user = getCurrentUser();
        const isAdmin = RoleManager.hasAnyRole(user, ['admin', 'director']);
        const cohortId = window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '';

        let query = sbClient.from('system_data').select('key, updated_at');
        if (!isAdmin && cohortId) {
            query = query.like('key', `TOWN_SUB_COMPARE_${submoduleId}_${cohortId}级_%`);
        } else {
            query = query.like('key', `TOWN_SUB_COMPARE_${submoduleId}_%`);
        }

        const { data, error } = await query.order('updated_at', { ascending: false }).limit(50);
        if (error) throw error;
        if (window.UI) UI.loading(false);
        if (!data || data.length === 0) return alert('☁️ 云端暂无记录');

        const html = data.map((item, idx) => {
            const keyParts = item.key.replace(`TOWN_SUB_COMPARE_${submoduleId}_`, '').split('_');
            const cohort = keyParts[0] || '未知届别';
            const school = keyParts[1] || '未知学校';
            return `
                <div style="padding:12px; border-bottom:1px solid #e2e8f0; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="loadCloudTownSubmoduleCompare('${submoduleId}', '${item.key}')">
                    <div style="flex:1;">
                        <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
                            <span style="background:#f1f5f9; color:#475569; padding:2px 6px; border-radius:4px; font-size:11px; font-weight:600;">${cohort}</span>
                            <span style="font-weight:600; color:#334155;">${school}</span>
                        </div>
                        <div style="font-size:11px; color:#94a3b8; font-family:monospace;">${item.key}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-size:12px; color:#64748b;">${new Date(item.updated_at).toLocaleString('zh-CN')}</div>
                        <div style="font-size:11px; color:#3b82f6; margin-top:2px;">点击加载 &gt;</div>
                    </div>
                </div>
            `;
        }).join('');

        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: `☁️ ${TOWN_SUBMODULE_META[submoduleId] || submoduleId} 云端对比记录`,
                html: `<div style="max-height:400px; overflow-y:auto; text-align:left;">${html}</div>`,
                width: 650,
                showCloseButton: true,
                showConfirmButton: false
            });
        }
    } catch (e) {
        if (window.UI) UI.loading(false);
        console.error(e);
        alert('加载失败: ' + e.message);
    }
}

async function loadCloudTownSubmoduleCompare(submoduleId, key) {
    if (!sbClient) return alert('☁️ 云端服务未连接');
    const hintEl = document.getElementById(`town-submodule-compare-hint-${submoduleId}`);
    const resultEl = document.getElementById(`town-submodule-compare-result-${submoduleId}`);
    if (!hintEl || !resultEl) return;

    try {
        if (typeof Swal !== 'undefined') Swal.close();
        if (window.UI) UI.loading(true, '☁️ 正在加载详情...');
        const { data, error } = await sbClient.from('system_data').select('content').eq('key', key).single();
        if (error) throw error;
        let content = data.content;
        if (typeof content === 'string' && content.startsWith('LZ|')) {
            content = LZString.decompressFromUTF16(content.substring(3));
        }
        const payload = typeof content === 'string' ? JSON.parse(content) : content;
        resultEl.innerHTML = payload.html || '<div style="color:#94a3b8;">云端记录缺少展示内容</div>';
        hintEl.innerHTML = `✅ 已加载云端记录：${payload.title || key}`;
        hintEl.style.color = '#7c3aed';
        setTownSubmoduleCompareEntryState(submoduleId, payload);
    } catch (e) {
        console.error(e);
        alert('加载失败: ' + e.message);
    } finally {
        if (window.UI) UI.loading(false);
    }
}

    Object.assign(window, {
        TOWN_SUBMODULE_META,
        ensureTownSubmoduleCompareUIs,
        getTownSubmoduleSeries,
        openTownSubmoduleCompareDialog,
        renderTownSubmoduleMultiPeriodComparison,
        exportTownSubmoduleCompare,
        saveTownSubmoduleCompareToCloud,
        viewCloudTownSubmoduleCompares,
        loadCloudTownSubmoduleCompare
    });

    window.__TOWN_SUBMODULE_COMPARE_RUNTIME_PATCHED__ = true;
})();
