(() => {
    if (typeof window === 'undefined' || window.ReportInsightRuntime) return;

function getReportInsightScoreStats(subject) {
    const rows = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
    const scores = rows
        .map(row => row?.scores?.[subject])
        .filter(value => typeof value === 'number')
        .sort((a, b) => b - a);
    const count = scores.length;
    const mean = count ? scores.reduce((sum, value) => sum + value, 0) / count : 0;
    const variance = count ? scores.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / count : 0;
    return { scores, count, mean, sd: Math.sqrt(variance) || 1 };
}

function getReportInsightPercentile(score, stats) {
    if (!stats || !stats.count) return null;
    const rank = stats.scores.indexOf(score) + 1;
    return rank > 0 ? ((1 - rank / stats.count) * 100) : null;
}

function buildStudentInsightModel(student, passedHistory = null, helpers = {}) {
    const reportStudent = typeof helpers.getCachedComparisonStudentView === 'function' ? helpers.getCachedComparisonStudentView(student) : student;
    const totalSubjects = typeof getComparisonTotalSubjects === 'function'
        ? getComparisonTotalSubjects()
        : (Array.isArray(window.SUBJECTS) ? window.SUBJECTS : []);
    const totalScore = typeof getComparisonTotalValue === 'function'
        ? getComparisonTotalValue(reportStudent, totalSubjects)
        : Number(reportStudent?.total || 0);
    const isSingleSchool = Object.keys(window.SCHOOLS || {}).length <= 1;
    const hasTownshipRankData = typeof hasStudentTownshipRankData === 'function'
        ? hasStudentTownshipRankData(window.RAW_DATA || [], totalSubjects)
        : !isSingleSchool;
    const isCountyDirect = typeof isCountyDirectStudentForRank === 'function'
        ? isCountyDirectStudentForRank(reportStudent)
        : false;
    const useTownshipRank = hasTownshipRankData && !isCountyDirect;
    const scopeText = isSingleSchool ? '全校' : (useTownshipRank ? '全镇' : '本校');
    const effectiveRank = !useTownshipRank
        ? safeGet(reportStudent, 'ranks.total.school', '-')
        : safeGet(reportStudent, 'ranks.total.township', safeGet(reportStudent, 'ranks.total.school', '-'));
    const schoolRows = reportStudent?.school && window.SCHOOLS?.[reportStudent.school]?.students;
    const totalCount = !useTownshipRank
        ? ((Array.isArray(schoolRows) && schoolRows.length) || (Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 1) || 1)
        : ((Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 1) || 1);
    const percentile = (typeof effectiveRank === 'number' && totalCount > 0)
        ? ((1 - effectiveRank / totalCount) * 100)
        : null;
    const history = Array.isArray(passedHistory) ? passedHistory : (typeof helpers.getCachedStudentExamHistory === 'function' ? helpers.getCachedStudentExamHistory(reportStudent) : []);
    const latestHistoryEntry = typeof getLatestHistoryExamEntry === 'function'
        ? getLatestHistoryExamEntry(reportStudent, history)
        : (Array.isArray(history) && history.length ? history[history.length - 1] : null);
    const previousStudent = latestHistoryEntry ? (latestHistoryEntry.student || latestHistoryEntry) : null;
    const previousTotal = previousStudent
        ? (typeof recalcPrevTotal === 'function' ? recalcPrevTotal(previousStudent) : Number(previousStudent.total))
        : null;
    const totalDelta = (Number.isFinite(totalScore) && Number.isFinite(previousTotal)) ? (totalScore - previousTotal) : null;
    const subjectInsights = [];
    totalSubjects.forEach(subject => {
        const score = reportStudent?.scores?.[subject];
        if (typeof score !== 'number') return;
        const stats = getReportInsightScoreStats(subject);
        if (!stats.count) return;
        const percentileValue = getReportInsightPercentile(score, stats);
        const zScore = stats.sd > 0 ? (score - stats.mean) / stats.sd : 0;
        subjectInsights.push({
            subject,
            score,
            percentile: percentileValue,
            zScore,
            schoolRank: safeGet(reportStudent, `ranks.${subject}.school`, '-'),
            townshipRank: safeGet(reportStudent, `ranks.${subject}.township`, '-')
        });
    });
    const strongSubjects = subjectInsights.filter(item => item.zScore >= 0.8).sort((a, b) => b.zScore - a.zScore);
    const weakSubjects = subjectInsights.filter(item => item.zScore <= -0.8).sort((a, b) => a.zScore - b.zScore);
    const zValues = subjectInsights.map(item => item.zScore);
    const zRange = zValues.length ? (Math.max(...zValues) - Math.min(...zValues)) : 0;
    let balanceLabel = '结构均衡';
    let balanceTone = 'ok';
    if (zRange >= 2.6) {
        balanceLabel = '偏科明显';
        balanceTone = 'warn';
    } else if (zRange >= 1.4) {
        balanceLabel = '有波动';
        balanceTone = 'info';
    }
    let trendLabel = '首次生成';
    let trendTone = 'neutral';
    if (typeof totalDelta === 'number') {
        if (totalDelta >= 0.5) {
            trendLabel = `较上次提升 ${totalDelta.toFixed(1)} 分`;
            trendTone = 'up';
        } else if (totalDelta <= -0.5) {
            trendLabel = `较上次回落 ${Math.abs(totalDelta).toFixed(1)} 分`;
            trendTone = 'down';
        } else {
            trendLabel = '与上次基本持平';
            trendTone = 'steady';
        }
    }
    const focusSubjects = weakSubjects.slice(0, 2);
    const guardSubjects = strongSubjects.slice(0, 2);
    const targetScore = Number.isFinite(totalScore)
        ? totalScore + Math.max(4, Math.min(12, (focusSubjects.length || 1) * 3))
        : null;
    const targetRank = (typeof effectiveRank === 'number')
        ? Math.max(1, effectiveRank - Math.max(1, Math.round(effectiveRank * 0.08)))
        : null;
    const actionPlans = [
        focusSubjects.length
            ? { tone: 'warn', title: `优先补弱：${focusSubjects.map(item => item.subject).join('、')}`, detail: '先做基础概念回顾，再做近两次错题复盘；每天固定 15 到 20 分钟，先稳住容易失分点。' }
            : { tone: 'ok', title: '当前没有明显短板', detail: '整体结构比较稳定，可以把更多精力放在提速、审题和规范表达上。' },
        guardSubjects.length
            ? { tone: 'info', title: `继续守住优势：${guardSubjects.map(item => item.subject).join('、')}`, detail: '优势科目重点保持错题复盘和阶段总结，让强项持续稳定输出。' }
            : { tone: 'info', title: '建立稳定优势科目', detail: '从最有把握的一门学科开始，把基础题和中档题做稳。' },
        { tone: 'goal', title: '下一次目标建议', detail: `${targetScore !== null ? `建议先把总分稳定到 ${targetScore.toFixed(1)} 分左右；` : ''}${targetRank !== null ? `争取 ${scopeText}排名提升到前 ${targetRank} 名。` : '先把当前优势延续到下一次考试。'}` }
    ];
    const realityNotes = [
        `本次解读基于当前成绩库中的 ${totalCount} 名同届样本和 ${Math.max(history.length, 1)} 次考试记录。`,
        '分数、排名、百分位均按已导入的真实成绩计算，不做估高处理。',
        '如果学校还没有导入最新一次考试或历史考试，趋势结论会更保守。'
    ];
    return { reportStudent, totalScore, totalCount, scopeText, effectiveRank, percentile, previousTotal, totalDelta, balanceLabel, balanceTone, trendLabel, trendTone, focusSubjects, guardSubjects, actionPlans, realityNotes, targetScore, targetRank, subjectInsights, strongSubjects, weakSubjects };
}

function renderStudentInsightOverview(model) {
    const pctText = model.percentile !== null ? `${model.percentile.toFixed(0)}%` : '-';
    const totalText = Number.isFinite(model.totalScore) ? model.totalScore.toFixed(1) : '-';
    const rankText = typeof model.effectiveRank === 'number' ? `${model.effectiveRank}` : '-';
    const prevText = Number.isFinite(model.previousTotal) ? model.previousTotal.toFixed(1) : '-';
    const trendClass = model.trendTone === 'up' ? 'report-pill up' : model.trendTone === 'down' ? 'report-pill down' : 'report-pill';
    const balanceClass = model.balanceTone === 'warn' ? 'report-pill warn' : model.balanceTone === 'info' ? 'report-pill info' : 'report-pill ok';
    const focusText = model.focusSubjects.length ? model.focusSubjects.map(item => item.subject).join('、') : '暂无明显短板';
    const guardText = model.guardSubjects.length ? model.guardSubjects.map(item => item.subject).join('、') : '建议先培养一门稳定优势科目';
    return `<div class="report-insight-grid"><div class="report-insight-card tone-score"><span class="report-insight-label">本次总分</span><strong class="report-insight-value">${totalText}</strong><span class="report-insight-sub">上次对比：${prevText}</span></div><div class="report-insight-card tone-rank"><span class="report-insight-label">${model.scopeText}定位</span><strong class="report-insight-value">第 ${rankText} 名</strong><span class="report-insight-sub">综合百分位：${pctText}</span></div><div class="report-insight-card tone-balance"><span class="report-insight-label">结构状态</span><strong class="report-insight-value">${model.balanceLabel}</strong><span class="${balanceClass}">${model.balanceLabel}</span></div><div class="report-insight-card tone-trend"><span class="report-insight-label">阶段走势</span><strong class="report-insight-value">${model.trendLabel}</strong><span class="${trendClass}">${model.trendLabel}</span></div></div><div class="report-chip-row"><span class="report-chip report-chip-focus">当前优先调整：${focusText}</span><span class="report-chip report-chip-guard">继续守住优势：${guardText}</span></div>`;
}

function renderStudentActionPlan(model) {
    return `<div class="report-action-grid">${model.actionPlans.map(plan => `<div class="report-action-card tone-${plan.tone}"><div class="report-action-title">${plan.title}</div><div class="report-action-text">${plan.detail}</div></div>`).join('')}</div>`;
}

function renderStudentSubjectBoard(model) {
    const items = Array.isArray(model.subjectInsights) ? model.subjectInsights : [];
    if (!items.length) return '';
    return `<div class="report-subject-board">${items.map(item => {
        const percentile = item.percentile !== null ? Math.max(0, Math.min(100, item.percentile)) : 0;
        const tone = item.zScore >= 0.8 ? 'strong' : item.zScore <= -0.8 ? 'weak' : 'steady';
        const label = tone === 'strong' ? '优势科目' : tone === 'weak' ? '优先补弱' : '保持稳定';
        const zText = Number.isFinite(item.zScore) ? item.zScore.toFixed(2) : '-';
        return `<div class="report-subject-item tone-${tone}"><div class="report-subject-head"><strong>${item.subject}</strong><span>${label}</span></div><div class="report-subject-meta"><span>成绩 ${item.score}</span><span>百分位 ${item.percentile !== null ? item.percentile.toFixed(0) + '%' : '-'}</span><span>Z ${zText}</span></div><div class="report-progress-track"><div class="report-progress-bar tone-${tone}" style="width:${percentile}%;"></div></div></div>`;
    }).join('')}</div>`;
}

function renderStudentRealityNote(model) {
    return `<div class="report-reality-note"><div class="report-reality-title">真实成绩说明</div><ul class="report-reality-list">${model.realityNotes.map(note => `<li>${note}</li>`).join('')}</ul></div>`;
}


function getTrendBadge(current, previous, type = 'score') {
    if (previous === undefined || previous === null || previous === '-' || previous === '') return '';

    // 确保数值类型
    const currVal = parseFloat(current);
    const prevVal = parseFloat(previous);
    if (isNaN(currVal) || isNaN(prevVal)) return '';

    const diff = currVal - prevVal;
    if (Math.abs(diff) < 0.01) return `<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>`;

    let color = '';
    let icon = '';
    let bg = '';

    if (type === 'score') {
        // 分数：正数=进步(绿), 负数=退步(红/橙)
        if (diff > 0) { color = '#15803d'; bg = '#dcfce7'; icon = '▲'; }
        else { color = '#b91c1c'; bg = '#fee2e2'; icon = '▼'; }
    } else {
        // 排名：负数=进步(名次变小), 正数=退步(名次变大)
        if (diff < 0) { color = '#15803d'; bg = '#dcfce7'; icon = '▲'; } // 排名上升
        else { color = '#b91c1c'; bg = '#fee2e2'; icon = '▼'; }          // 排名下降
    }

    const absDiff = Math.abs(diff);
    // Windows 11 风格圆角胶囊
    return `<span style="display:inline-flex; align-items:center; background:${bg}; color:${color}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${icon} ${type === 'score' ? absDiff.toFixed(1) : absDiff}
        </span>`;
}


    window.ReportInsightRuntime = {
        buildStudentInsightModel,
        renderStudentInsightOverview,
        renderStudentActionPlan,
        renderStudentSubjectBoard,
        renderStudentRealityNote,
        getTrendBadge
    };
})();
