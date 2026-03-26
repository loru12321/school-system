(() => {
    if (typeof window === 'undefined' || window.__MACRO_COMPARE_RESULT_RUNTIME_PATCHED__) return;

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

function setMacroCompareHintState(hintEl, message, state = 'idle') {
    if (!hintEl) return;
    hintEl.textContent = message;
    hintEl.className = `analysis-hint analysis-status-text${state === 'success' ? ' is-success' : state === 'error' ? ' is-error' : ''}`;
}

function renderMacroCompareEmptyState(resultEl, title, message) {
    if (!resultEl) return;
    resultEl.innerHTML = `<div class="analysis-empty-state analysis-empty-state-compact"><strong>${title}</strong>${message}</div>`;
}

function renderMacroMultiPeriodComparison() {
    const hintEl = document.getElementById('macroCompareHint');
    const resultEl = document.getElementById('macroCompareResult');
    const countEl = document.getElementById('macroComparePeriodCount');
    const schoolEl = document.getElementById('macroCompareSchool');
    const e1El = document.getElementById('macroCompareExam1');
    const e2El = document.getElementById('macroCompareExam2');
    const e3El = document.getElementById('macroCompareExam3');
    if (!hintEl || !resultEl || !countEl || !schoolEl || !e1El || !e2El || !e3El) return;

    const periodCount = parseInt(countEl.value || '2');
    const school = schoolEl.value;
    const examIds = periodCount === 3 ? [e1El.value, e2El.value, e3El.value] : [e1El.value, e2El.value];

    if (!school) {
        setMacroCompareHintState(hintEl, '请先选择学校。', 'error');
        renderMacroCompareEmptyState(resultEl, '尚未生成校际对比', '先选择学校后再生成多期结果。');
        return;
    }
    if (examIds.some(x => !x)) {
        setMacroCompareHintState(hintEl, '请完整选择所有考试期次。', 'error');
        renderMacroCompareEmptyState(resultEl, '考试期次未选完整', '补齐所需期次后，系统会生成校际对比结果。');
        return;
    }
    if (new Set(examIds).size !== examIds.length) {
        setMacroCompareHintState(hintEl, '期次不能重复，请选择不同考试。', 'error');
        renderMacroCompareEmptyState(resultEl, '期次配置有冲突', '请使用不同的考试期次进行对比。');
        return;
    }

    const rowsByExam = examIds.map(id => ({ examId: id, rows: getExamRowsForCompare(id) }));
    if (rowsByExam.some(x => !x.rows.length)) {
        setMacroCompareHintState(hintEl, '某些期次没有可用数据，请检查考试数据。', 'error');
        renderMacroCompareEmptyState(resultEl, '缺少可用成绩数据', '至少有一期考试没有可用于校际对比的成绩。');
        return;
    }

    const summaryByExam = rowsByExam.map(x => ({ examId: x.examId, summary: buildSchoolSummaryForExam(x.rows) }));
    const selectedByExam = rowsByExam.map(x => ({ examId: x.examId, rows: filterRowsBySchool(x.rows, school) }));
    if (!selectedByExam.every(x => x.rows.length > 0)) {
        setMacroCompareHintState(hintEl, '所选学校在某些期次中无数据，无法对比。', 'error');
        renderMacroCompareEmptyState(resultEl, '学校数据不完整', '所选学校在部分考试里没有成绩，当前无法生成连续对比。');
        return;
    }

    const calcBottom3Avg = (rows) => {
        const totals = (rows || []).map(r => Number(r.total)).filter(v => Number.isFinite(v)).sort((a, b) => b - a);
        if (!totals.length) return { avg: 0, lowRate: 0 };
        const totalN = totals.length;
        const bottomN = Math.ceil(totalN / 3);
        const excN = Math.ceil(bottomN * (CONFIG?.excRate || 0));
        const bottomGroup = totals.slice(-bottomN);
        const validGroup = bottomGroup.slice(0, Math.max(0, bottomGroup.length - excN));
        const avg = validGroup.length ? validGroup.reduce((a, b) => a + b, 0) / validGroup.length : 0;

        const subjectCount = (SUBJECTS && SUBJECTS.length) ? SUBJECTS.length : 1;
        const lowThreshold = subjectCount * 72 * 0.6;
        const lowRate = totals.filter(v => v < lowThreshold).length / totalN;
        return { avg, lowRate };
    };

    const calcHighScore = (rows) => {
        const totals = (rows || []).map(r => Number(r.total)).filter(v => Number.isFinite(v));
        const count = totals.length;
        if (!count) return { highCount: 0, highRate: 0 };
        const subjectCount = (SUBJECTS && SUBJECTS.length) ? SUBJECTS.length : 1;
        const highThreshold = subjectCount * 90;
        const highCount = totals.filter(v => v >= highThreshold).length;
        return { highCount, highRate: highCount / count };
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

    const moduleSeries = selectedByExam.map((x, idx) => {
        const schoolSummary = getSummaryEntryBySchool(summaryByExam[idx]?.summary, school);
        const m = calcSchoolMetricsFromRows(x.rows);
        const b = calcBottom3Avg(x.rows);
        const h = calcHighScore(x.rows);
        const ind = calcIndicator(x.rows);

        const riskLevel = m.passRate < 0.6
            ? '红色预警'
            : (m.passRate < 0.75 || m.excRate < 0.15 ? '黄色关注' : '绿色稳定');

        return {
            examId: x.examId,
            count: m.count,
            avg: m.avg,
            excRate: m.excRate,
            passRate: m.passRate,
            rankAvg: schoolSummary?.rankAvg || '-',
            riskLevel,
            highCount: h.highCount,
            highRate: h.highRate,
            indicatorCount: ind.indicatorCount,
            indicatorRate: ind.indicatorRate,
            indicatorLabel: ind.label,
            bottom3Avg: b.avg,
            lowRate: b.lowRate
        };
    });

    const schoolRows = moduleSeries.map(s =>
        `<tr><td>${s.examId}</td><td>${s.count}</td><td>${s.avg.toFixed(2)}</td><td>${(s.excRate * 100).toFixed(1)}%</td><td>${(s.passRate * 100).toFixed(1)}%</td><td>${s.rankAvg}</td></tr>`
    ).join('');

    const firstSummary = summaryByExam[0].summary;
    const lastSummary = summaryByExam[summaryByExam.length - 1].summary;
    const allSchoolsChange = Object.keys(lastSummary).map(sName => {
        const a = getSummaryEntryBySchool(firstSummary, sName);
        const b = lastSummary[sName];
        if (!a || !b) return null;
        return {
            school: sName,
            dAvg: b.avg - a.avg,
            dExc: b.excRate - a.excRate,
            dPass: b.passRate - a.passRate,
            dRank: a.rankAvg - b.rankAvg
        };
    }).filter(Boolean).sort((a, b) => Math.abs(b.dAvg) - Math.abs(a.dAvg));

    const allRows = allSchoolsChange.length
        ? allSchoolsChange.map(r => `<tr><td>${r.school}</td><td style="font-weight:bold; color:${r.dAvg >= 0 ? 'var(--success)' : 'var(--danger)'};">${r.dAvg >= 0 ? '+' : ''}${r.dAvg.toFixed(2)}</td><td>${r.dExc >= 0 ? '+' : ''}${(r.dExc * 100).toFixed(1)}%</td><td>${r.dPass >= 0 ? '+' : ''}${(r.dPass * 100).toFixed(1)}%</td><td style="font-weight:bold; color:${r.dRank >= 0 ? 'var(--success)' : 'var(--danger)'};">${r.dRank >= 0 ? '+' : ''}${r.dRank}</td></tr>`).join('')
        : '<tr><td colspan="5" style="text-align:center; color:#999;">无可比数据</td></tr>';

    const changeLabel = `${examIds[0]} → ${examIds[examIds.length - 1]}`;
    const moduleRows = moduleSeries.map(s => `
            <tr>
                <td>${s.examId}</td>
                <td>${s.riskLevel}</td>
                <td>${s.highCount} (${(s.highRate * 100).toFixed(1)}%)</td>
                <td>${s.indicatorCount} (${(s.indicatorRate * 100).toFixed(1)}%)</td>
                <td>${s.bottom3Avg.toFixed(2)}</td>
                <td>${(s.lowRate * 100).toFixed(1)}%</td>
            </tr>
        `).join('');

    resultEl.innerHTML = `
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>🏫 校际联考分析六子模块多期对比（${school}）</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${periodCount} 期对比</span>
                        <span class="analysis-table-tag">${examIds[0]} → ${examIds[examIds.length - 1]}</span>
                    </span>
                </div>
                <div class="analysis-generated-note">先看学校主指标走势，再结合子模块和全镇变化判断站位是否稳定、预警是否缓解。</div>
                <div class="table-wrap analysis-table-shell"><table class="mobile-card-table analysis-generated-table"><thead><tr><th>期次</th><th>人数</th><th>总分均分</th><th>优秀率</th><th>及格率</th><th>校际均分排位</th></tr></thead><tbody>${schoolRows}</tbody></table></div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>📌 子模块指标追踪</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">指标生 ${moduleSeries[0]?.indicatorLabel || '未设置'}</span>
                    </span>
                </div>
                <div class="analysis-generated-note">同步观察预警等级、高分段、指标生与后 1/3 均分，判断学校结构性变化是否真实发生。</div>
                <div class="table-wrap analysis-table-shell"><table class="mobile-card-table analysis-generated-table"><thead><tr><th>期次</th><th>预警等级</th><th>高分段</th><th>指标生(${moduleSeries[0]?.indicatorLabel || '未设置'})</th><th>后1/3均分</th><th>低分率</th></tr></thead><tbody>${moduleRows}</tbody></table></div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>🌍 全镇学校首末期变化</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${changeLabel}</span>
                        <span class="analysis-table-tag">按均分波动排序</span>
                    </span>
                </div>
                <div class="analysis-generated-note">查看本校与其他学校同步拉开还是缩小差距，辅助判断这次变化是个体波动还是全镇性变化。</div>
                <div class="table-wrap analysis-table-shell"><table class="mobile-card-table analysis-generated-table"><thead><tr><th>学校</th><th>均分变化</th><th>优秀率变化</th><th>及格率变化</th><th>排位变化</th></tr></thead><tbody>${allRows}</tbody></table></div>
            </div>
        `;

    setMacroCompareHintState(hintEl, `已完成 ${periodCount} 期校际对比：${examIds.join(' → ')}`, 'success');
    setMacroCompareCacheState({
        school,
        examIds,
        periodCount,
        summaryByExam,
        allSchoolsChange,
        moduleSeries,
        html: resultEl.innerHTML
    });
}

function exportMacroMultiPeriodComparison() {
    const MACRO_MULTI_PERIOD_COMPARE_CACHE = readMacroCompareCacheState();
    if (!MACRO_MULTI_PERIOD_COMPARE_CACHE) return alert('请先生成校际多期对比结果');
    const { school, examIds, summaryByExam, allSchoolsChange, moduleSeries = [] } = MACRO_MULTI_PERIOD_COMPARE_CACHE;
    const wb = XLSX.utils.book_new();

    const schoolData = [['学校', '期次', '人数', '总分均分', '优秀率', '及格率', '校际均分排位']];
    summaryByExam.forEach(x => {
        const s = getSummaryEntryBySchool(x.summary, school);
        if (!s) return;
        schoolData.push([school, x.examId, s.count, s.avg, s.excRate, s.passRate, s.rankAvg]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(schoolData), '指定学校多期');

    const first = examIds[0];
    const last = examIds[examIds.length - 1];
    const allData = [["学校", `${first}→${last}均分变化`, `${first}→${last}优秀率变化`, `${first}→${last}及格率变化`, `${first}→${last}排位变化`]];
    allSchoolsChange.forEach(r => allData.push([r.school, r.dAvg, r.dExc, r.dPass, r.dRank]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(allData), '全镇首末期变化');

    const moduleData = [['期次', '预警等级', '高分段人数', '高分段占比', '指标生人数', '指标生占比', '后1/3均分', '低分率']];
    moduleSeries.forEach(s => moduleData.push([
        s.examId,
        s.riskLevel,
        s.highCount,
        s.highRate,
        s.indicatorCount,
        s.indicatorRate,
        s.bottom3Avg,
        s.lowRate
    ]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(moduleData), '六子模块指标');

    XLSX.writeFile(wb, `校际多期对比_${school}_${examIds.join('_')}.xlsx`);
}

    Object.assign(window, {
        renderMacroMultiPeriodComparison,
        exportMacroMultiPeriodComparison
    });

    window.__MACRO_COMPARE_RESULT_RUNTIME_PATCHED__ = true;
})();
