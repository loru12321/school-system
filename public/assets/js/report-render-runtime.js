(() => {
    if (typeof window === 'undefined' || window.__REPORT_RENDER_RUNTIME_PATCHED__) return;

const CompareSessionStateRuntime = window.CompareSessionState || null;
const ReportSessionStateRuntime = window.ReportSessionState || null;
const readCloudStudentCompareContextSessionState = typeof window.readCloudStudentCompareContextState === 'function'
    ? window.readCloudStudentCompareContextState
    : (() => {
        if (CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getCloudStudentCompareContext === 'function') {
            return CompareSessionStateRuntime.getCloudStudentCompareContext() || null;
        }
        return null;
    });
const readCurrentReportStudentSessionState = typeof window.readCurrentReportStudentState === 'function'
    ? window.readCurrentReportStudentState
    : (() => {
        if (ReportSessionStateRuntime && typeof ReportSessionStateRuntime.getCurrentReportStudent === 'function') {
            return ReportSessionStateRuntime.getCurrentReportStudent() || null;
        }
        return window.CURRENT_REPORT_STUDENT && typeof window.CURRENT_REPORT_STUDENT === 'object'
            ? window.CURRENT_REPORT_STUDENT
            : null;
    });
const readDuplicateCompareExamsState = typeof window.readDuplicateCompareExamsState === 'function'
    ? window.readDuplicateCompareExamsState
    : (() => {
        if (CompareSessionStateRuntime && typeof CompareSessionStateRuntime.getDuplicateCompareExams === 'function') {
            return CompareSessionStateRuntime.getDuplicateCompareExams() || [];
        }
        return [];
    });

function resolveCloudCompareHint(student) {
    if (typeof getCloudCompareHint === 'function') {
        return getCloudCompareHint(student);
    }
    return (isCloudContextMatchStudent(student) || isCloudContextLikelyCurrentTarget(student))
        ? readCloudStudentCompareContextSessionState()
        : null;
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

// 1. 综合渲染入口：根据设备类型自动选择模板
function renderSingleReportCardHTML(stu, mode) {
    // 1. 安卓 Canvas 兼容性兜底 (部分低版本安卓 WebView 无法渲染 Chart.js)
    // 如果是安卓且屏幕小，且没有 window.Chart 对象(极少数情况)，强制回退到 PC 版 HTML 表格
    const ua = navigator.userAgent.toLowerCase();
    const isAndroid = ua.includes('android');
    const isProblemAndroid = isAndroid && window.innerWidth <= 768 && !window.Chart;

    if (isProblemAndroid) {
        console.warn('⚠️ Android Canvas 异常，强制切换 PC 模式');
        // 递归调用自己，传入 'PC' 模式以跳过下方的 Mobile 判断
        return renderSingleReportCardHTML(stu, 'PC');
    }

    // 2. 判断是否为手机端 (或显式请求 IG 模式)
    const isMobile = window.innerWidth <= 768;

    const forceFullLayout = mode === 'A4' || mode === 'PC' || mode === 'FULL';
    if ((!forceFullLayout && isMobile) || mode === 'IG') {
        // A. 获取 HTML 字符串
        const html = renderInstagramCard(stu);

        // B. 关键：设置延时回调，在 HTML 插入 DOM 后绘制 Canvas 图表
        // 必须使用 setTimeout，否则此时 canvas 元素还不存在于页面上
        setTimeout(() => {
            if (typeof renderIGCharts === 'function') {
                renderIGCharts(stu);
            }
        }, 50);

        // C. 返回 HTML 字符串
        return html;
    }

    // --- 否则：渲染原有的 PC 端 Fluent Design 风格 (A4打印版) ---
    const totalStudentsCount = RAW_DATA.length;
    const genDate = new Date().toLocaleDateString();
    const reportStu = getComparisonStudentView(stu, RAW_DATA);

    // 获取对比数据（云端上下文优先，避免回退导致“看不到对比”）
    const cloudHint = resolveCloudCompareHint(reportStu);
    const prevStu = cloudHint?.previousRecord || findPreviousRecord(reportStu);
    const reportExamHistory = typeof getStudentExamHistory === 'function' ? getStudentExamHistory(reportStu) : [];
    const currentExamId = getEffectiveCurrentExamId();
    const prevHistoryEntry = reportExamHistory.filter(h => {
        const matchKey = h.examFullKey || h.examId;
        return !currentExamId || (!isExamKeyEquivalentForCompare(matchKey, currentExamId) && !isExamKeyEquivalentForCompare(h.examId, currentExamId));
    }).slice(-1)[0] || null;
    const prevHistoryStu = prevHistoryEntry ? (prevHistoryEntry.student || prevHistoryEntry) : null;
    const compareStu = (prevHistoryStu && prevHistoryStu.scores) ? prevHistoryStu : prevStu;
    const compareTotalRanks = compareStu?.ranks?.total || {};
    const readScoreValue = (scoreLike) => {
        if (typeof scoreLike === 'number' && Number.isFinite(scoreLike)) return scoreLike;
        if (scoreLike && typeof scoreLike === 'object' && typeof scoreLike.score === 'number' && Number.isFinite(scoreLike.score)) return scoreLike.score;
        return '-';
    };
    const normalizeRankInfo = (rankLike) => ({
        class: rankLike?.class ?? rankLike?.rankClass ?? '-',
        school: rankLike?.school ?? rankLike?.rankSchool ?? '-',
        township: rankLike?.township ?? rankLike?.rankTown ?? '-'
    });

    // 数据容错（云端简版对象可能缺少scores）
    const stuScores = (reportStu && typeof reportStu === 'object' && reportStu.scores && typeof reportStu.scores === 'object') ? reportStu.scores : {};

    // 排名数据准备
    const curTownRank = safeGet(reportStu, 'ranks.total.township', '-');
    const prevTownRank = compareTotalRanks.township ?? prevStu?.townRank ?? '-';
    const curClassRank = safeGet(reportStu, 'ranks.total.class', '-');
    const prevClassRank = compareTotalRanks.class ?? prevStu?.classRank ?? '-';
    const curSchoolRank = safeGet(reportStu, 'ranks.total.school', '-');
    const prevSchoolRank = compareTotalRanks.school ?? prevStu?.schoolRank ?? '-';

    // 单校判断
    const isSingleSchool = Object.keys(SCHOOLS).length <= 1;
    const townColStyle = isSingleSchool ? 'display:none !important;' : '';

    // 构建表格行
    let tableRows = '';

    // A. 9年级五科总分行 (逻辑保持不变)
    if (CONFIG.name === '9年级') {
        let fiveTotal = 0, count = 0;
        ['语文', '数学', '英语', '物理', '化学'].forEach(sub => {
            if (stuScores[sub] !== undefined) { fiveTotal += stuScores[sub]; count++; }
        });
        if (count > 0) {
            tableRows += `<tr style="background:rgba(248,250,252,0.5);">
                    <td style="font-weight:bold; color:#475569;">🏁 核心五科</td>
                    <td style="font-weight:bold; color:#2563eb;">${fiveTotal.toFixed(1)}</td>
                    <td>-</td><td>-</td><td style="${townColStyle}">-</td>
                </tr>`;
        }
    }

        // B. 总分行 — 用统一的联动科目集展示总分，避免把政治混入9年级总分口径
        const comparisonTotalSubjects = getComparisonTotalSubjects();
        const currentTotal = getComparisonTotalValue(reportStu, comparisonTotalSubjects);
        const totalLabel = (CONFIG.name === '9年级' && comparisonTotalSubjects.length) ? '五科总分' : CONFIG.label;
        const prevTotal = compareStu ? recalcPrevTotal(compareStu) : '-';
        const trendTotal = getTrendBadge(currentTotal, prevTotal, 'score');
    const trendClass = getTrendBadge(curClassRank, prevClassRank, 'rank');
    const trendSchool = getTrendBadge(curSchoolRank, prevSchoolRank, 'rank');
    const trendTown = getTrendBadge(curTownRank, prevTownRank, 'rank');

    tableRows += `<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            <td style="font-weight:bold; color:#1e3a8a;">🏆 ${totalLabel}</td>
            <td style="font-weight:800; font-size:16px; color:#1e40af;">${Number.isFinite(currentTotal) ? currentTotal.toFixed(2) : '-'} ${trendTotal}</td>
            <td style="font-weight:bold; color:#334155;">${curClassRank} ${trendClass}</td>
            <td style="font-weight:bold; color:#334155;">${curSchoolRank} ${trendSchool}</td>
            <td style="${townColStyle} font-weight:bold; color:#334155;">${curTownRank} ${trendTown}</td>
        </tr>`;

    // C. 单科行
    const uniqueSubjects = [...new Set(SUBJECTS)];
    uniqueSubjects.forEach(sub => {
        if (stuScores[sub] !== undefined) {
            const prevSubScore = compareStu && compareStu.scores ? readScoreValue(compareStu.scores[sub]) : '-';
            const subTrend = getTrendBadge(stuScores[sub], prevSubScore, 'score');

            let prevRanks = normalizeRankInfo(compareStu && compareStu.ranks ? compareStu.ranks[sub] : null);
            if (prevRanks.class === '-' && prevRanks.school === '-' && prevRanks.township === '-' && prevStu && prevStu.ranks && prevStu.ranks[sub]) {
                prevRanks = normalizeRankInfo(prevStu.ranks[sub]);
            }

            const curCR = safeGet(reportStu, `ranks.${sub}.class`, '-');
            const tC = getTrendBadge(curCR, prevRanks.class || '-', 'rank');
            const curSR = safeGet(reportStu, `ranks.${sub}.school`, '-');
            const tS = getTrendBadge(curSR, prevRanks.school || '-', 'rank');
            const curTR = safeGet(reportStu, `ranks.${sub}.township`, '-');
            const tT = getTrendBadge(curTR, prevRanks.township || '-', 'rank');

            tableRows += `<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    <td style="font-weight:600; color:#475569;">${sub}</td>
                    <td style="font-weight:bold; color:#334155;">${stuScores[sub]} ${subTrend}</td>
                    <td style="color:#64748b;">${curCR} <span style="font-size:0.9em;">${tC}</span></td>
                    <td style="color:#64748b;">${curSR} <span style="font-size:0.9em;">${tS}</span></td>
                    <td style="color:#64748b; ${townColStyle}">${curTR} <span style="font-size:0.9em;">${tT}</span></td>
                </tr>`;
        }
    });

    const fluentStyle = `
            <style>
                .fluent-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
                .fluent-header { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); }
                .fluent-title { font-size: 15px; font-weight: 700; color: #1e293b; }
                .fluent-subtitle { font-size: 11px; color: #94a3b8; margin-left: auto; }
                .fluent-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .fluent-table th { text-align: center; padding: 10px 5px; color: #64748b; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0; background: rgba(248, 250, 252, 0.5); }
                .fluent-table td { text-align: center; padding: 12px 5px; border-bottom: 1px solid rgba(0,0,0,0.03); font-size: 14px; }
                .fluent-table tr:last-child td { border-bottom: none; }
                .report-insight-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; margin:16px 0 12px; }
                .report-insight-card { border-radius:18px; padding:16px 18px; border:1px solid #e2e8f0; background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); box-shadow:0 10px 26px rgba(15, 23, 42, 0.04); }
                .report-insight-card.tone-score { border-color:#bfdbfe; background:linear-gradient(180deg, #ffffff 0%, #eff6ff 100%); }
                .report-insight-card.tone-rank { border-color:#fde68a; background:linear-gradient(180deg, #ffffff 0%, #fffbeb 100%); }
                .report-insight-card.tone-balance { border-color:#bbf7d0; background:linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%); }
                .report-insight-card.tone-trend { border-color:#fbcfe8; background:linear-gradient(180deg, #ffffff 0%, #fdf2f8 100%); }
                .report-insight-label { display:block; font-size:12px; font-weight:700; color:#64748b; margin-bottom:8px; }
                .report-insight-value { display:block; font-size:20px; line-height:1.35; color:#0f172a; font-weight:800; }
                .report-insight-sub { display:block; margin-top:6px; font-size:12px; color:#64748b; line-height:1.6; }
                .report-chip-row { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 18px; }
                .report-chip { display:inline-flex; align-items:center; min-height:32px; padding:0 12px; border-radius:999px; font-size:12px; font-weight:700; }
                .report-chip-focus { background:#fff7ed; color:#c2410c; border:1px solid #fdba74; }
                .report-chip-guard { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
                .report-pill { display:inline-flex; align-items:center; min-height:26px; padding:0 10px; border-radius:999px; font-size:11px; font-weight:700; color:#475569; background:#f8fafc; border:1px solid #e2e8f0; margin-top:8px; }
                .report-pill.up { color:#166534; background:#dcfce7; border-color:#86efac; }
                .report-pill.down { color:#b91c1c; background:#fee2e2; border-color:#fca5a5; }
                .report-pill.ok, .report-pill.steady { color:#0369a1; background:#e0f2fe; border-color:#7dd3fc; }
                .report-pill.info { color:#7c2d12; background:#fff7ed; border-color:#fdba74; }
                .report-pill.warn { color:#b91c1c; background:#fff1f2; border-color:#fda4af; }
                .report-action-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; margin:0 0 18px; }
                .report-action-card { border-radius:18px; padding:16px 18px; border:1px solid #e2e8f0; background:#fff; min-height:140px; }
                .report-action-card.tone-warn { background:linear-gradient(180deg, #ffffff 0%, #fff7ed 100%); border-color:#fdba74; }
                .report-action-card.tone-info { background:linear-gradient(180deg, #ffffff 0%, #eff6ff 100%); border-color:#bfdbfe; }
                .report-action-card.tone-ok { background:linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%); border-color:#bbf7d0; }
                .report-action-card.tone-goal { background:linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%); border-color:#ddd6fe; }
                .report-action-title { font-size:14px; font-weight:800; color:#0f172a; margin-bottom:8px; }
                .report-action-text { font-size:13px; color:#475569; line-height:1.8; }
                .report-subject-board { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; margin:0 0 18px; }
                .report-subject-item { border-radius:16px; padding:14px 16px; border:1px solid #e2e8f0; background:#fff; }
                .report-subject-item.tone-strong { background:linear-gradient(180deg, #ffffff 0%, #effdf5 100%); border-color:#bbf7d0; }
                .report-subject-item.tone-weak { background:linear-gradient(180deg, #ffffff 0%, #fff7ed 100%); border-color:#fdba74; }
                .report-subject-item.tone-steady { background:linear-gradient(180deg, #ffffff 0%, #eff6ff 100%); border-color:#bfdbfe; }
                .report-subject-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
                .report-subject-head strong { font-size:14px; color:#0f172a; }
                .report-subject-head span { font-size:11px; font-weight:700; color:#64748b; }
                .report-subject-meta { display:flex; gap:10px; flex-wrap:wrap; font-size:11px; color:#64748b; margin-bottom:10px; }
                .report-progress-track { height:8px; border-radius:999px; background:#e2e8f0; overflow:hidden; }
                .report-progress-bar { height:100%; border-radius:999px; }
                .report-progress-bar.tone-strong { background:linear-gradient(90deg, #22c55e 0%, #16a34a 100%); }
                .report-progress-bar.tone-weak { background:linear-gradient(90deg, #fb923c 0%, #ea580c 100%); }
                .report-progress-bar.tone-steady { background:linear-gradient(90deg, #60a5fa 0%, #2563eb 100%); }
                .report-reality-note { margin-top:12px; border-radius:18px; border:1px dashed #cbd5e1; padding:14px 16px; background:#f8fafc; }
                .report-reality-title { font-size:12px; font-weight:800; color:#475569; margin-bottom:8px; }
                .report-metric-tipline { margin-top:8px; padding:8px 10px; border-radius:12px; background:#ffffff; color:#475569; font-size:12px; font-weight:700; border:1px solid #dbeafe; }
                .report-reality-list { margin:0; padding-left:18px; font-size:12px; color:#64748b; line-height:1.75; }
                .report-reality-list li { margin-bottom:4px; }
                .report-subject-note { margin-top:10px; font-size:11px; color:#64748b; line-height:1.65; }
                @media (max-width: 768px) { .report-insight-grid, .report-action-grid, .report-subject-board { grid-template-columns:minmax(0, 1fr); } .report-insight-card, .report-action-card, .report-subject-item { padding:14px 16px; } }
                @media print { .fluent-card { box-shadow: none; border: 1px solid #ccc; backdrop-filter: none; } }
            </style>
        `;

    const chartNarrativeHtml = buildChartNarrative(reportStu);
    const insightModel = buildStudentInsightModel(reportStu, reportExamHistory);
    const insightOverviewHtml = renderStudentInsightOverview(insightModel);
    const actionPlanHtml = renderStudentActionPlan(insightModel);
    const subjectBoardHtml = renderStudentSubjectBoard(insightModel);
    const realityNoteHtml = renderStudentRealityNote(insightModel);
    const cloudCompareHintHtml = cloudHint ? `
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${cloudHint.prevExamId || '上次'} → ${cloudHint.latestExamId || '本次'}</span>
                <span style="color:#6366f1;">来源：${cloudHint.title || '云端记录'}</span>
            </div>
        </div>` : '';

    const duplicateCompareGroups = readDuplicateCompareExamsState();
    const duplicateCompareHintHtml = duplicateCompareGroups.length > 0 ? `
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>` : '';

    const baseHtml = `
        ${fluentStyle}
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${stu.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${genDate}</p>
        </div>
        ${cloudCompareHintHtml}
        ${duplicateCompareHintHtml}
        <div class="fluent-card" style="padding:15px 25px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:baseline; gap:15px;">
                    <span style="font-size:24px; font-weight:800; color:#1e3a8a;">${stu.name}</span>
                    <span style="font-size:14px; color:#475569; background:#fff; padding:2px 8px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${stu.class}</span>
                </div>
                <div style="font-size:13px; color:#64748b; font-family:monospace;">考号: ${stu.id}</div>
            </div>
        </div>
        <div class="fluent-card" style="padding:18px 20px;">
            <div class="fluent-header"><i class="ti ti-badge-4k" style="color:#2563eb;"></i><span class="fluent-title">成绩快照与真实定位</span></div>
            ${insightOverviewHtml}
            ${actionPlanHtml}
            ${subjectBoardHtml}
            ${realityNoteHtml}
        </div>
        <div class="fluent-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩 (对比)</th><th>班排</th><th>校排</th><th style="${townColStyle}">全镇排名</th></tr></thead>
                <tbody>${tableRows}</tbody>
            </table>
        </div>`;

    // 🟢 [Bug #5 修复] 补充渲染多期考试趋势表格 (如果是多期数据可用)
    const examHistory = reportExamHistory;
    let historyHtml = '';
    if (examHistory.length > 1) {
        let historyRows = '';
        let thHtml = `<th style="text-align:left; padding-left:20px;">考试名称</th><th>${totalLabel}</th><th>校排</th>`;
        if (!isSingleSchool) thHtml += `<th>镇排</th>`;

        for (let i = examHistory.length - 1; i >= 0; i--) {
            const h = examHistory[i];
            const matchKey = h.examFullKey || h.examId;
            const currentExamId = getEffectiveCurrentExamId();
            const isCurrent = !!currentExamId && (isExamKeyEquivalentForCompare(matchKey, currentExamId) || isExamKeyEquivalentForCompare(h.examId, currentExamId));
            const bgStyle = isCurrent ? 'background:rgba(239,246,255,0.7); font-weight:bold;' : '';

            // 安全读取学生对象和成绩（兼容旧结构和不同来源）
            const stuObj = h.student || h;
            const normalizedDisplayTotal = getComparisonTotalValue(stuObj, comparisonTotalSubjects);
            const displayTotal = Number.isFinite(normalizedDisplayTotal) ? normalizedDisplayTotal.toFixed(1) : '-';
            const tScore = displayTotal;
            const sRank = safeGet(stuObj, 'ranks.total.school', h.rankSchool || '-');
            const tRank = safeGet(stuObj, 'ranks.total.township', h.rankTown || '-');

            historyRows += `<tr style="${bgStyle}">
                <td style="text-align:left; padding-left:20px; color:#475569;">${isCurrent ? '⭐ ' : ''}${h.examLabel || h.examId || h.examFullKey || '-'}</td>
                <td style="color:#2563eb;">${tScore}</td>
                <td style="color:#64748b;">${sRank}</td>
                ${!isSingleSchool ? `<td style="color:#64748b;">${tRank}</td>` : ''}
            </tr>`;
        }

        historyHtml = `
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${thHtml}</tr></thead>
                <tbody>${historyRows}</tbody>
            </table>
        </div>`;
    }

    const finalHtml = `
        ${baseHtml}
        ${historyHtml}
        <div style="display:flex; gap:15px; margin-bottom:15px; flex-wrap:wrap; margin-top:20px;">
            <div class="fluent-card" style="flex:1; min-width:300px; margin-bottom:0; display:flex; flex-direction:column;">
                <div class="fluent-header"><i class="ti ti-radar" style="color:#2563eb;"></i><span class="fluent-title">${CONFIG.name === '9年级' ? '五科综合素质评价' : '综合素质评价'} (百分位)</span></div>
                <div style="flex:1; position:relative; min-height:220px;"><canvas id="radarChart"></canvas></div>
            </div>            
            <div class="fluent-card" style="flex:1; min-width:300px; margin-bottom:0; display:flex; flex-direction:column;">
                <div class="fluent-header"><i class="ti ti-scale" style="color:#059669;"></i><span class="fluent-title">${CONFIG.name === '9年级' ? '五科学科均衡度诊断' : '学科均衡度诊断'} (Z-Score)</span></div>
                <div style="flex:1; position:relative; min-height:220px;"><canvas id="varianceChart"></canvas></div>
            </div> 
        </div>
        ${chartNarrativeHtml}
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>`;

    return finalHtml;
}

// 2. 🟢 新增：生成 Instagram 风格卡片的函数 (Mobile Only)
function renderInstagramCard(stu) {
    const genDate = new Date().toLocaleDateString();
    const totalStudents = RAW_DATA.length;
    const reportStu = getComparisonStudentView(stu, RAW_DATA);
    const comparisonTotalSubjects = getComparisonTotalSubjects();
    const currentTotal = getComparisonTotalValue(reportStu, comparisonTotalSubjects);
    const rank = safeGet(reportStu, 'ranks.total.township', '-');
    const pct = (typeof rank === 'number') ? ((1 - rank / totalStudents) * 100).toFixed(0) : '-';
    const avatarLetter = stu.name.charAt(0); // 头像取首字
    const cloudHint = resolveCloudCompareHint(reportStu);

    // 判断是否为单校模式
    const isSingleSchool = Object.keys(SCHOOLS).length <= 1;
    const scopeText = isSingleSchool ? "全校" : "全镇";

    let statusTag = '';
    if (pct >= 90) statusTag = '🌟 卓越之星';
    else if (pct >= 75) statusTag = '🔥 进步飞速';
    else statusTag = '📚 持续努力';

    // 3. 构建单科评论行
    let commentsHtml = '';
    comparisonTotalSubjects.forEach(sub => {
        if (reportStu.scores[sub] !== undefined) {
            const score = reportStu.scores[sub];

            // 修改点 1：获取校内排名 (即年级排名/级排) 而不是班级排名 (.class)
            const subRank = safeGet(reportStu, `ranks.${sub}.school`, '-');

            commentsHtml += `
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${sub}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${score}</span>
                            <!-- 修改点 2：显示文字改为 级排 -->
                            <span class="insta-comm-rank">级排#${subRank}</span>
                        </div>
                    </div>
                `;
        }
    });

    // 新增：雷达图和均衡度图表的 Canvas 容器
    // 注意：这里只是占位，具体的图表将在 renderIGCharts 函数中绘制
    const chartsHtml = `
            <div style="margin-top: 20px; padding: 0 14px;">
                <!-- 雷达图容器 -->
                <div style="background: #f8fafc; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
                    <div style="font-size: 13px; font-weight: bold; color: #475569; margin-bottom: 10px; border-left: 4px solid #2563eb; padding-left: 8px;">
                        📊 ${CONFIG.name === '9年级' ? '五科能力雷达图' : '学科能力雷达图'}
                    </div>
                    <div style="height: 250px; position: relative;">
                        <canvas id="igRadarChart"></canvas>
                    </div>
                </div>

                <!-- 均衡度容器 -->
                <div style="background: #f8fafc; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 13px; font-weight: bold; color: #475569; margin-bottom: 10px; border-left: 4px solid #059669; padding-left: 8px;">
                        ⚖️ ${CONFIG.name === '9年级' ? '五科学科均衡度诊断' : '学科均衡度诊断'}
                    </div>
                    <div style="height: 200px; position: relative;">
                        <canvas id="igVarianceChart"></canvas>
                    </div>
                    <div style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 5px;">
                        注：向右(绿)为优势学科，向左(红)为薄弱学科
                    </div>
                </div>
            </div>
        `;

    // 1. 定义一个内部函数，用于计算 Z-Score 并对科目进行分层 (强/中/弱)
    // 目的：为后续的“一句话诊断”、“优势清单”、“家长建议”提供数据支撑
    const getSubjectLevels = () => {
        let strong = [], weak = [], mid = [], zScores = [];
        const linkedSubjects = getComparisonTotalSubjects();

        linkedSubjects.forEach(sub => {
            if (stu.scores[sub] !== undefined) {
                // A. 获取该科全镇数据 (用于计算标准分)
                const allScores = RAW_DATA.map(s => s.scores[sub]).filter(v => typeof v === 'number');
                if (allScores.length < 2) return;

                // B. 计算均值与标准差 (Standard Deviation)
                const avg = allScores.reduce((a, b) => a + b, 0) / allScores.length;
                const variance = allScores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / allScores.length;
                const sd = Math.sqrt(variance) || 1; // 防止除以0

                // C. 计算标准分 Z-Score (反映该生在全体考生中的相对位置)
                const z = (stu.scores[sub] - avg) / sd;
                zScores.push(z);

                // D. 分类 (阈值 0.8，约等于前20%和后20%)
                const item = `${sub}`; // 仅存科目名
                if (z >= 0.8) strong.push(item);      // 强科
                else if (z <= -0.8) weak.push(item);  // 弱科
                else mid.push(item);                  // 中等
            }
        });

        // 计算极差 (Range)，用于判断整体结构是“均衡”还是“偏科”
        const maxZ = zScores.length ? Math.max(...zScores) : 0;
        const minZ = zScores.length ? Math.min(...zScores) : 0;
        const range = maxZ - minZ;

        return { strong, weak, mid, range };
    };

    // 2. 执行计算，获取分层结果
    const levels = getSubjectLevels();

    // 3. 生成【模块④】一句话诊断文案
    const getDiagnosisText = (range) => {
        if (range >= 2.5) {
            // 极差大：严重偏科
            return {
                tag: '⚠️ 严重偏科',
                color: '#b91c1c', bg: '#fee2e2',
                text: '不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。'
            };
        } else if (range >= 1.2) {
            // 极差中：相对均衡
            return {
                tag: '⚖️ 相对均衡',
                color: '#0369a1', bg: '#e0f2fe',
                text: '各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。'
            };
        } else {
            // 极差小：结构优秀
            return {
                tag: '🌟 结构优秀',
                color: '#15803d', bg: '#dcfce7',
                text: '各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。'
            };
        }
    };

    const diag = getDiagnosisText(levels.range);

    // --- 生成【模块④】HTML：一句话诊断 ---
    const igDiagnosisHtml = `
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${diag.bg}; color:${diag.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${diag.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${diag.text}
                </div>
            </div>
        `;

    // --- 生成【模块⑤】HTML：优势/短板折叠清单 ---
    // 辅助函数：生成列表项
    const renderListItems = (arr, emptyText) => {
        if (!arr || arr.length === 0) return `<div style="font-size:12px; color:#ccc; padding:5px;">${emptyText}</div>`;
        return arr.map(sub =>
            `<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${sub}</span>`
        ).join('');
    };

    const igSubjectListHtml = `
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科 (Z≥0.8)
                        <span style="margin-left:auto; font-size:10px; color:#999;">${levels.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${renderListItems(levels.strong, '暂无明显优势学科，继续加油')}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${levels.weak.length > 0 ? 'open' : ''} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科 (Z≤-0.8)
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${levels.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${renderListItems(levels.weak, '暂无明显短板，保持均衡')}
                    </div>
                </details>
            </div>
        `;

    // --- 生成【模块⑥】HTML：家长执行建议 ---
    const getParentAdvice = () => {
        const adv = [];
        // 策略1：有弱科
        if (levels.weak.length > 0) {
            const subStr = levels.weak.join('、');
            adv.push(`🎯 <strong>精准攻坚：</strong>针对 ${subStr}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`);
        }
        // 策略2：有强科
        if (levels.strong.length > 0) {
            const subStr = levels.strong.join('、');
            adv.push(`🛡️ <strong>保持自信：</strong>${subStr} 是孩子的信心来源，请多给予具体表扬，稳住优势。`);
        }
        // 策略3：全是中间 (均衡)
        if (levels.strong.length === 0 && levels.weak.length === 0) {
            adv.push(`🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。`);
        }
        // 通用建议
        adv.push(`📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。`);

        return adv.map(t => `<li style="margin-bottom:8px; line-height:1.5;">${t}</li>`).join('');
    };

    const igAdviceHtml = `
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${getParentAdvice()}
                </ul>
            </div>
        `;

    // 模拟图表区域 (使用CSS渐变背景代替 Canvas，确保渲染稳定)
    const visualAreaHtml = `
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(currentTotal) ? currentTotal.toFixed(1) : '-'}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(reportStu, 'ranks.total.school', '-')}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${scopeText} ${pct}% 的考生</div>
                </div>
            </div>
        `;

    const igCloudCompareHintHtml = cloudHint ? `
            <div style="margin:12px 14px 0 14px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:10px 12px;">
                <div style="font-size:12px; color:#3730a3; line-height:1.5;">
                    <strong>状态：☁️ 云端对比已启用</strong><br>
                    当前对比：${cloudHint.prevExamId || '上次'} → ${cloudHint.latestExamId || '本次'}
                </div>
                <div style="font-size:11px; color:#6366f1; margin-top:4px;">来源：${cloudHint.title || '云端记录'}</div>
            </div>
        ` : '';

    return `
            <div class="insta-view-container" style="background:#fafafa; padding-top:20px;">
                <div class="insta-card">
                    <!-- Header -->
                    <div class="insta-header">
                        <div class="insta-avatar-ring"><div class="insta-avatar">${avatarLetter}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${stu.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${stu.school} · ${stu.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${visualAreaHtml}
                    ${igInsightHtml}
                    
                    <!-- Actions (点赞栏 - 旧模块) -->
                    <div class="insta-actions">
                        <div class="insta-action-left">
                            <i class="ti ti-heart insta-icon liked"></i>
                            <i class="ti ti-message-circle-2 insta-icon"></i>
                            <i class="ti ti-send insta-icon"></i>
                        </div>
                        <i class="ti ti-bookmark insta-icon"></i>
                    </div>
                    
                    <!-- Likes -->
                    <div class="insta-likes">${(Math.random() * 100 + 50).toFixed(0)} likes</div>
                    
                    <!-- Caption (文案 - 旧模块) -->
                    <div class="insta-caption">
                        <span class="insta-caption-name">${CONFIG.name}教务处</span>
                        本次考试成绩已出炉！${statusTag}，请查收您的学习报告。
                        <span class="insta-tags">#期末考试 #${stu.school} #学习报告</span>
                    </div>

                    <!-- 2. 🟢 新增：模块④ 学情结构一句话诊断 -->
                    ${typeof igDiagnosisHtml !== 'undefined' ? igDiagnosisHtml : ''}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof igSubjectListHtml !== 'undefined' ? igSubjectListHtml : ''}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${igCloudCompareHintHtml}
                    ${chartsHtml}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${commentsHtml}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof igAdviceHtml !== 'undefined' ? igAdviceHtml : ''}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${genDate}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `;
}

// 3. 🟢 新增：专门用于渲染 IG 风格卡片内 Canvas 的函数 (手机端图表核心逻辑)

    Object.assign(window, {
        getTrendBadge,
        renderSingleReportCardHTML,
        renderInstagramCard
    });

    window.__REPORT_RENDER_RUNTIME_PATCHED__ = true;
})();
