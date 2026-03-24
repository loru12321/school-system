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
function renderIGCharts(stu) {
    // 使用 setTimeout 确保 DOM 元素已经插入页面
    setTimeout(() => {
        const linkedSubjects = getComparisonTotalSubjects();
        // === 绘制雷达图 ===
        const radarCtx = document.getElementById('igRadarChart');
        if (radarCtx) {
            // 防止重复渲染，先销毁旧实例
            if (window.igRadarInstance) window.igRadarInstance.destroy();

            const labels = [];
            const data = [];

            linkedSubjects.forEach(sub => {
                if (stu.scores[sub] !== undefined) {
                    labels.push(sub);

                    // 计算百分位
                    const all = RAW_DATA.map(s => s.scores[sub]).filter(v => typeof v === 'number').sort((a, b) => b - a);
                    const rank = all.indexOf(stu.scores[sub]) + 1;
                    // (1 - 排名/总数) * 100
                    data.push(((1 - rank / all.length) * 100).toFixed(1));
                }
            });

            window.igRadarInstance = new Chart(radarCtx, {
                type: 'radar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '能力值',
                        data: data,
                        backgroundColor: 'rgba(37, 99, 235, 0.2)', // 蓝色填充
                        borderColor: '#2563eb',
                        pointBackgroundColor: '#2563eb',
                        pointBorderColor: '#fff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        r: {
                            min: 0,
                            max: 100,
                            ticks: { display: false }, // 隐藏刻度
                            pointLabels: {
                                font: { size: 11, weight: 'bold' },
                                color: '#333'
                            },
                            grid: { color: 'rgba(0,0,0,0.05)' }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

        // === 绘制均衡度图 (Z-Score) ===
        const varCtx = document.getElementById('igVarianceChart');
        if (varCtx) {
            if (window.igVarianceInstance) window.igVarianceInstance.destroy();

            const labels = [];
            const zData = [];
            const colors = [];

            // 简单的标准差计算函数
            const calcStats = (arr) => {
                const n = arr.length;
                if (n === 0) return { mean: 0, sd: 1 };
                const mean = arr.reduce((a, b) => a + b, 0) / n;
                const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
                return { mean, sd: Math.sqrt(variance) };
            };

            linkedSubjects.forEach(sub => {
                if (stu.scores[sub] !== undefined) {
                    const allArr = RAW_DATA.map(s => s.scores[sub]).filter(v => typeof v === 'number');
                    const stats = calcStats(allArr);

                    let z = 0;
                    if (stats.sd > 0) z = (stu.scores[sub] - stats.mean) / stats.sd;

                    labels.push(sub);
                    zData.push(z);
                    // 正数绿色，负数红色
                    colors.push(z >= 0 ? '#16a34a' : '#dc2626');
                }
            });

            window.igVarianceInstance = new Chart(varCtx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: '标准分 (Z-Score)',
                        data: zData,
                        backgroundColor: colors,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y', // 横向柱状图
                    scales: {
                        x: {
                            grid: { display: true, color: '#f1f5f9' },
                            title: { display: true, text: '← 弱势 | 强势 →', font: { size: 10 }, color: '#94a3b8' }
                        },
                        y: {
                            grid: { display: false }
                        }
                    },
                    plugins: { legend: { display: false } }
                }
            });
        }

    }, 150); // 延时 150ms 确保 HTML 渲染完毕
}

// 移动端管理逻辑已拆分到 public/assets/js/mobile-manager.js




function printSingleReport() {
    const reportContent = document.getElementById('report-card-capture-area');
    if (!reportContent || reportContent.innerHTML.trim() === "") return uiAlert("请先查询生成报告", 'warning');
    const printContainer = document.createElement('div'); printContainer.id = 'temp-print-wrapper';
    const originalCanvas = reportContent.querySelector('canvas');
    let canvasImg = ''; if (originalCanvas) { canvasImg = `<img src="${originalCanvas.toDataURL()}" style="width:100%; height:100%; object-fit:contain;">`; }
    printContainer.innerHTML = reportContent.innerHTML;
    if (originalCanvas) { const tempCanvasContainer = printContainer.querySelector('.chart-wrapper'); if (tempCanvasContainer) tempCanvasContainer.innerHTML = canvasImg; }
    printContainer.className = 'exam-print-page'; document.body.appendChild(printContainer);
    const style = document.createElement('style'); style.id = 'temp-print-style';
    style.innerHTML = `@media print { body > *:not(#temp-print-wrapper) { display: none !important; } #temp-print-wrapper { display: block !important; width: 100%; position: absolute; top: 0; left: 0; } .report-card-container { box-shadow: none; border: 1px solid #ccc; } -webkit-print-color-adjust: exact; print-color-adjust: exact; }`;
    document.head.appendChild(style); window.print();
    setTimeout(() => { document.body.removeChild(printContainer); document.head.removeChild(style); }, 500);
}

async function downloadSingleReportPDF() {
    const reportContent = document.getElementById('report-card-capture-area');
    if (!reportContent || reportContent.innerHTML.trim() === "") return uiAlert("请先查询生成报告", 'warning');
    if (!window.jspdf || !window.jspdf.jsPDF) return uiAlert('PDF 库未加载，请刷新页面重试', 'error');
    if (typeof html2canvas === 'undefined') return uiAlert('截图引擎未加载，请刷新页面重试', 'error');

    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(reportContent, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }
    pdf.save(`成绩单_${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function batchGeneratePDF() {
    const sch = document.getElementById('sel-school').value; const cls = document.getElementById('sel-class').value;
    if (!sch || sch === '--请先选择学校--' || !cls || cls === '--请先选择学校--') { return uiAlert("请先选择学校和班级！", 'warning'); }
    const students = SCHOOLS[sch].students.filter(s => s.class === cls); if (students.length === 0) { return uiAlert("该班级没有学生数据", 'warning'); }
    students.sort((a, b) => b.total - a.total);
    if (window.Swal) {
        const res = await Swal.fire({
            title: '确认批量打印',
            text: `即将生成 ${students.length} 份 A4 报告，是否继续？`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '继续',
            cancelButtonText: '取消'
        });
        if (!res.isConfirmed) return;
    } else if (!confirm(`即将生成 ${students.length} 份 A4 报告。\n\n系统将调用浏览器打印功能，请在打印预览页选择：\n1. 目标打印机：另存为 PDF\n2. 更多设置 -> 勾选“背景图形”\n\n确定继续吗？`)) return;
    const container = document.getElementById('batch-print-container'); container.innerHTML = ''; let batchHtml = '';

    // 清除主报告区，避免 #radarChart 重复 ID 导致 Chart.js 找错画布
    const reportCaptureArea = document.getElementById('report-card-capture-area');
    if (reportCaptureArea) reportCaptureArea.innerHTML = '';
    if (radarChartInstance) { try { radarChartInstance.destroy(); } catch (e) { } radarChartInstance = null; }

    // 创建隐藏的渲染区域，用于逐一渲染并捕获雷达图
    const tempRender = document.createElement('div');
    tempRender.style.cssText = 'position:fixed; left:-9999px; top:0; width:794px; visibility:hidden;';
    document.body.appendChild(tempRender);

    for (const stu of students) {
        tempRender.innerHTML = renderSingleReportCardHTML(stu, 'A4');
        const history = typeof getStudentExamHistory === 'function' ? getStudentExamHistory(stu) : [];
        // 初始化雷达图
        try { if (typeof renderRadarChart === 'function') renderRadarChart(stu, history, tempRender); } catch (e) { console.warn('batch radar chart error:', e); }
        // 等待 Chart.js 绘制完成
        await new Promise(r => setTimeout(r, 200));
        // 将 canvas 转换为 img，确保打印时可见
        const canvas = tempRender.querySelector('canvas');
        if (canvas) {
            try {
                const imgSrc = canvas.toDataURL('image/png');
                const img = document.createElement('img');
                img.src = imgSrc;
                img.style.cssText = 'width:100%; height:100%; object-fit:contain;';
                canvas.parentNode.replaceChild(img, canvas);
            } catch (e) { console.warn('canvas capture error:', e); }
        }
        batchHtml += `<div style="page-break-after: always; padding: 20px; height: 100vh;">${tempRender.innerHTML}</div>`;
    }

    document.body.removeChild(tempRender);
    container.innerHTML = batchHtml; container.style.display = 'block';
    const style = document.createElement('style'); style.id = 'batch-print-style';
    style.innerHTML = `@media print { body > *:not(#batch-print-container) { display: none !important; } #batch-print-container { display: block !important; } .report-card-container { box-shadow: none !important; border: 2px solid #333 !important; } -webkit-print-color-adjust: exact; print-color-adjust: exact; }`;
    document.head.appendChild(style);
    setTimeout(() => { window.print(); setTimeout(() => { container.style.display = 'none'; container.innerHTML = ''; document.head.removeChild(style); }, 2000); }, 500);
}
// 辅助：将 Blob/File 转为 Base64 并自动存入缓存
async function loadHistoricalArchives(input) {
    const files = input.files;
    if (!files.length) return;

    let loadedCount = 0;

    // 遍历所有上传的文件
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const examName = file.name.replace('.xlsx', '').replace('.xls', ''); // 用文件名作为考试名

        await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet); // 读取为对象数组

                // 自动识别列名
                if (json.length > 0) {
                    const sample = json[0];
                    // 寻找关键列：姓名、学校、总分/排名
                    const keyName = Object.keys(sample).find(k => k.includes('姓名') || k.toLowerCase() === 'name');
                    const keySchool = Object.keys(sample).find(k => k.includes('学校') || k.toLowerCase() === 'school');
                    // 优先找排名列，如果没有则找总分列后续自动算排名(简化起见这里假设有总分)
                    const keyRank = Object.keys(sample).find(k => k.includes('排名') || k.includes('名次') || k.includes('Rank'));
                    const keyScore = Object.keys(sample).find(k => k.includes('总分') || k.includes('Total') || k === '得分');

                    if (keyName && (keyRank || keyScore)) {
                        // 如果只有分数没有排名，先进行一次简单的排序计算
                        if (!keyRank && keyScore) {
                            json.sort((a, b) => (b[keyScore] || 0) - (a[keyScore] || 0));
                            json.forEach((row, idx) => row._tempRank = idx + 1);
                        }

                        json.forEach(row => {
                            const name = row[keyName];
                            const school = keySchool ? row[keySchool] : '默认学校'; // 如果没有学校列，视为单校
                            const rank = keyRank ? parseInt(row[keyRank]) : row._tempRank;

                            // 尝试在行数据中找“班级”
                            let className = "";
                            const keyClass = Object.keys(row).find(k => k.includes('班') || k.toLowerCase().includes('class'));
                            if (keyClass) className = normalizeClass(row[keyClass]);

                            if (name && rank) {
                                // 唯一标识加入班级：学校_班级_姓名 (例如: 实验中学_701_张三)
                                // 这样 701的张三 和 702的张三 就会拥有两份不同的档案
                                const uid = school + "_" + className + "_" + name;
                                if (!HISTORY_ARCHIVE[uid]) HISTORY_ARCHIVE[uid] = [];

                                // 避免重复添加同一场考试
                                if (!HISTORY_ARCHIVE[uid].find(x => x.exam === examName)) {
                                    HISTORY_ARCHIVE[uid].push({ exam: examName, rank: rank });
                                }
                            }
                        });
                        loadedCount++;
                    }
                }
                resolve();
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // 计算稳定性并标记过山车学生
    analyzeStability();

    document.getElementById('history-status').innerText = `✅ 已建立 ${Object.keys(HISTORY_ARCHIVE).length} 份学生档案，包含 ${loadedCount} 次历史考试。`;
    input.value = ''; // 清空以允许重复上传
}

function analyzeStability() {
    ROLLER_COASTER_STUDENTS = [];
    Object.keys(HISTORY_ARCHIVE).forEach(uid => {
        const records = HISTORY_ARCHIVE[uid];
        if (records.length < 3) return; // 至少3次考试才算波动

        const ranks = records.map(r => r.rank);
        const n = ranks.length;
        const mean = ranks.reduce((a, b) => a + b, 0) / n;
        // 计算标准差 (Standard Deviation)
        const variance = ranks.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        const sd = Math.sqrt(variance);

        // 阈值设定：如果标准差超过 50 (意味着平均每次排名波动幅度很大)，标记为过山车
        // *也可以根据全镇人数动态调整，这里先设固定值或全校人数的10%
        if (sd > 50) {
            ROLLER_COASTER_STUDENTS.push(uid);
        }
    });
    console.log("检测到波动剧烈学生数:", ROLLER_COASTER_STUDENTS.length);
}
// 1. 保存配置
function saveLLMConfig() {
    const key = document.getElementById('llm_apikey').value;
    const url = document.getElementById('llm_baseurl').value;
    const model = document.getElementById('llm_model').value;

    if (!key) return alert("API Key 不能为空");

    localStorage.setItem('LLM_API_KEY', key);
    localStorage.setItem('LLM_BASE_URL', url);
    localStorage.setItem('LLM_MODEL', model);

    LLM_CONFIG.apiKey = key;
    LLM_CONFIG.baseURL = url;
    LLM_CONFIG.model = model;

    alert("✅ AI 配置已保存！");
}

// 页面加载时填充配置框（若已移除 UI，则跳过）
window.addEventListener('load', () => {
    const apiEl = document.getElementById('llm_apikey');
    const urlEl = document.getElementById('llm_baseurl');
    const modelEl = document.getElementById('llm_model');
    if (!apiEl || !urlEl || !modelEl) return;
    if (LLM_CONFIG.apiKey) apiEl.value = LLM_CONFIG.apiKey;
    urlEl.value = LLM_CONFIG.baseURL;
    modelEl.value = LLM_CONFIG.model;
});

function isLocalAIHost(hostname) {
    const normalized = String(hostname || '').trim().toLowerCase();
    return !normalized
        || normalized === 'localhost'
        || normalized === '127.0.0.1'
        || normalized === '[::1]'
        || normalized.endsWith('.local');
}

function shouldUseSameOriginAIGateway() {
    if (!window.location) return false;
    const protocol = String(window.location.protocol || '').trim().toLowerCase();
    if (protocol !== 'https:' && protocol !== 'http:') return false;
    return !isLocalAIHost(window.location.hostname);
}

function getSameOriginAIChatUrl() {
    if (!window.location || !window.location.origin) return '/api/ai/chat';
    return String(window.location.origin).replace(/\/$/, '') + '/api/ai/chat';
}

// 2. 通用 LLM 请求函数
async function callLLM(prompt, onChunk, onFinish) {
    if (AI_DISABLED) {
        if (onFinish) onFinish("(请求失败)");
        throw new Error('AI 功能已移除');
    }
    const useGateway = shouldUseSameOriginAIGateway();
    if (!LLM_CONFIG.apiKey && !useGateway) return alert("请先在【数据中心】设置 AI API Key");

    try {
        const requestBody = {
            model: LLM_CONFIG.model,
            messages: [
                { role: "system", content: LLM_CONFIG.systemPrompt },
                { role: "user", content: prompt }
            ],
            stream: true
        };
        const headers = {
            "Content-Type": "application/json"
        };
        let endpoint = `${LLM_CONFIG.baseURL}/v1/chat/completions`;
        if (useGateway) {
            endpoint = getSameOriginAIChatUrl();
            requestBody.baseURL = LLM_CONFIG.baseURL;
            requestBody.apiKey = LLM_CONFIG.apiKey;
            requestBody.prompt = prompt;
            requestBody.systemPrompt = LLM_CONFIG.systemPrompt;
        } else {
            headers.Authorization = `Bearer ${LLM_CONFIG.apiKey}`;
        }

        const response = await fetch(endpoint, {
            method: "POST",
            headers,
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            let detail = '';
            try {
                const errorBody = await response.json();
                detail = errorBody?.detail || errorBody?.error || '';
            } catch (e) {
                detail = await response.text().catch(() => '');
            }
            throw new Error(detail || `API Error: ${response.status}`);
        }

        const contentType = String(response.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('application/json')) {
            const data = await response.json();
            const fullText = data?.choices?.[0]?.message?.content || data?.result || data?.diagnosis || '';
            if (onChunk && fullText) onChunk(fullText);
            if (onFinish) onFinish(fullText);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let fullText = "";

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            // 处理 SSE 数据流 (data: {...})
            const lines = chunk.split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                    try {
                        const json = JSON.parse(line.substring(6));
                        const content = json.choices[0].delta.content || "";
                        fullText += content;
                        if (onChunk) onChunk(content);
                    } catch (e) { }
                }
            }
        }
        if (onFinish) onFinish(fullText);

    } catch (error) {
        console.error(error);
        alert("AI 请求失败: " + error.message);
        if (onFinish) onFinish(" (请求失败)");
    }
}

// 3. 生成单个学生评语
function callAIForComment() {
    if (AI_DISABLED) return aiDisabledAlert();
    const stu = readCurrentReportStudentSessionState();
    if (!stu) return alert("请先查询一名学生");

    const box = document.getElementById('ai-comment-box');
    // 增加一个 Loading 动画效果
    box.innerHTML = `
            <div style="text-align:center; padding:20px;">
                <span class="loader-spinner" style="width:20px;height:20px;display:inline-block;vertical-align:middle;"></span>
                <span style="color:#4f46e5; font-weight:bold; margin-left:10px;">AI 正在根据全镇数据深度分析 ${stu.name} 的学情...</span>
            </div>`;

    // 使用上面定义的增强版 Prompt 构建器
    const prompt = buildStudentPrompt(stu);

    let isFirstChunk = true;

    callLLM(prompt, (chunk) => {
        if (isFirstChunk) {
            box.innerHTML = ""; // 清除 Loading
            // 增加 Markdown 样式的简单处理容器
            box.style.fontFamily = '"Segoe UI", system-ui, sans-serif';
            box.style.whiteSpace = 'pre-wrap';
            isFirstChunk = false;
        }

        // 简单的流式追加
        box.innerText += chunk;

    }, (fullText) => {
        // (可选) 生成结束后，可以对文本进行简单的 Markdown 高亮处理
        // 这里为了简单，我们把 [小标题] 加粗
        const formatted = fullText
            .replace(/\[(.*?)\]/g, '<br><strong style="color:#b45309; background:#fff7ed; padding:2px 5px; border-radius:4px;">$1</strong>')
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>'); // 处理 Markdown 加粗

        box.innerHTML = formatted;
    });
}

// 4. 生成年级质量分析报告 (长文) - 智能增强版 (本校 VS 乡镇)
// 功能：专注于本校与全镇对比，提供分层级、分科目的深度诊断与实操建议
function generateAIMacroReport() {
    if (AI_DISABLED) return aiDisabledAlert();
    if (!Object.keys(SCHOOLS).length) return alert("无数据");

    // 1. 强制检查本校设置 (关键逻辑：没有本校就无法做对比)
    if (!MY_SCHOOL || !SCHOOLS[MY_SCHOOL]) {
        return alert("⚠️ 无法生成针对性报告！\n\n请先在页面顶部的【选择本校】下拉框中选中您的学校，系统才能进行“本校 vs 他校”的深度对比分析。");
    }

    // 创建模态框显示报告
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
            <div class="modal-content" style="width:95%; max-width:1600px; height:90vh; display:flex; flex-direction:column;">
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid #eee; padding-bottom:10px;">
                    <h3>🤖 AI 深度质量诊断: ${MY_SCHOOL} (对比分析版)</h3>
                    <button onclick="this.closest('.modal').remove()" style="border:none; bg:none; cursor:pointer; font-size:20px;">&times;</button>
                </div>
                <div id="ai-report-content" style="flex:1; overflow-y:auto; padding:20px; white-space:pre-wrap; line-height:1.8; font-family:serif; font-size:16px;">
                    正在调取 ${MY_SCHOOL} 与全镇其他 ${Object.keys(SCHOOLS).length - 1} 所学校的对比数据...
                    <br>正在分析学科短板与提分空间...
                    <br>正在生成针对 ${CONFIG.name} 的备考建议...
                    <br><br>
                    <span class="loader-spinner" style="width:20px;height:20px;display:inline-block;"></span> AI 正在奋笔疾书，请稍候 (约30秒)...
                </div>
                <div style="border-top:1px solid #eee; padding-top:10px; text-align:right;">
                    <button class="btn btn-blue" onclick="copyReport()">📋 复制全文</button>
                    <button class="btn btn-primary" onclick="exportToWord()" style="background:#2b579a; margin-left:10px;">
                        <i class="ti ti-file-word"></i> 导出为 Word
                    </button>
                </div>
            </div>
        `;
    document.body.appendChild(modal);

    // --- A. 数据准备 (Data Context) ---
    const myData = SCHOOLS[MY_SCHOOL];
    const totalSchools = Object.keys(SCHOOLS).length;
    const myRank = myData.rank2Rate || '-';

    // 计算全镇基准数据
    let subjectComparison = []; // 存储单科对比详情

    // 遍历所有科目进行对比
    SUBJECTS.forEach(sub => {
        if (!myData.metrics[sub]) return;

        // 全镇该科数据收集
        const allSchoolsMetrics = Object.values(SCHOOLS).map(s => s.metrics[sub]).filter(m => m);
        const townSubAvg = allSchoolsMetrics.reduce((a, b) => a + b.avg, 0) / allSchoolsMetrics.length;
        const maxSubAvg = Math.max(...allSchoolsMetrics.map(m => m.avg)); // 第一名均分

        // 本校数据
        const mySub = myData.metrics[sub];
        const diff = mySub.avg - townSubAvg; // 与全镇平均差
        const diffMax = mySub.avg - maxSubAvg; // 与第一名差
        const rank = myData.rankings[sub]?.avg || '-';

        subjectComparison.push({
            subject: sub,
            myAvg: mySub.avg.toFixed(1),
            townAvg: townSubAvg.toFixed(1),
            diff: diff.toFixed(1), // 与均值差
            diffMax: diffMax.toFixed(1), // 与第一名差
            rank: rank,
            excRate: (mySub.excRate * 100).toFixed(1) + '%',
            passRate: (mySub.passRate * 100).toFixed(1) + '%'
        });
    });

    // 区分优势与劣势学科 (简单算法：排名前30%为优，后40%为劣)
    const strongSubjects = subjectComparison.filter(s => s.rank <= Math.ceil(totalSchools * 0.3)).map(s => s.subject).join('、');
    const weakSubjects = subjectComparison.filter(s => s.rank > Math.ceil(totalSchools * 0.6)).map(s => s.subject).join('、');

    // 构建上下文文本，喂给 AI
    const contextText = `
        【基本信息】
        年级模式：${CONFIG.name} (特别注意：如果是9年级则面临中考，如果是7/8年级则处于基础阶段)
        本校：${MY_SCHOOL}
        全镇学校数：${totalSchools}
        本校综合排名：第 ${myRank} 名
        本校综合得分：${myData.score2Rate ? myData.score2Rate.toFixed(2) : '-'}

        【学科详细对比数据】(正数代表高于全镇均分，负数代表低于)：
        ${subjectComparison.map(s => `- ${s.subject}: 均分${s.myAvg} (与全镇差${s.diff}, 与第一名差${s.diffMax}), 排名${s.rank}, 优率${s.excRate}, 及格率${s.passRate}`).join('\n')}
        
        【初步诊断】
        优势学科：${strongSubjects || '无明显优势'}
        薄弱学科：${weakSubjects || '无明显短板'}
        `;

    // --- B. 构建 Prompt (要求 AI 返回 JSON 格式) ---
    const prompt = `
        你是一位资深教育数据分析师。请基于以下 **${MY_SCHOOL}** 的考试数据，进行深度诊断。

        【数据上下文】：
        ${contextText}

        【输出指令】：
        请严格按照以下 **JSON** 格式返回分析结果，不要包含任何 Markdown 标记（如 \`\`\`json），也不要包含任何开场白或结束语，直接返回 JSON 对象：
        {
            "summary": "一句话考情综述（例如：整体稳中有进，但优生断层严重，需警惕两极分化）",
            "score": 85, 
            "highlights": ["亮点1：XX学科均分超全镇平均5分", "亮点2：及格率稳步提升"], 
            "warnings": ["预警1：903班数学出现严重滑坡", "预警2：全校前100名人数偏少"], 
            "strategies": [
                { "title": "学科攻坚", "action": "针对英语薄弱问题，建议早读增加20分钟单词听写..." },
                { "title": "培优辅差", "action": "建立临界生档案，实行导师制..." },
                { "title": "课堂常规", "action": "严抓晚自习纪律，提高作业完成率..." }
            ],
            "slogan": "一句鼓舞人心的短句（10字以内）"
        }
        `;

    const contentDiv = document.getElementById('ai-report-content');
    // 初始化 Loading 界面
    contentDiv.innerHTML = `
            <div style="text-align:center; padding:50px;">
                <div class="loader-spinner" style="width:40px;height:40px;margin:0 auto 15px;display:block;"></div>
                <div style="font-size:16px; color:#4f46e5; font-weight:bold;">🤖 AI 正在进行多维度推理...</div>
                <div style="font-size:12px; color:#64748b; margin-top:5px;">正在对比全镇数据 / 计算学科差异 / 生成提分策略</div>
            </div>`;

    // 调用 AI 接口 (使用累积模式处理 JSON)
    let jsonBuffer = "";

    callLLM(prompt, (chunk) => {
        // 流式接收数据，暂不渲染，只存入 buffer
        jsonBuffer += chunk;
    }, (fullText) => {
        // 生成结束，开始解析与渲染
        try {
            // 1. 清洗数据：去除可能存在的 Markdown 代码块标记
            const cleanJson = jsonBuffer.replace(/```json/g, '').replace(/```/g, '').trim();

            // 2. 解析 JSON
            const data = JSON.parse(cleanJson);

            // 3. 渲染漂亮的 UI
            contentDiv.innerHTML = `
                    <div style="padding:10px;">
                        <!-- 头部评分 -->
                        <div style="text-align:center; margin-bottom:30px; border-bottom:1px dashed #eee; padding-bottom:20px;">
                            <h2 style="color:#1e293b; margin:0 0 10px 0; font-size:24px;">${data.summary}</h2>
                            <div style="display:inline-flex; align-items:center; background:#fefce8; border:1px solid #facc15; padding:5px 15px; border-radius:20px;">
                                <span style="color:#854d0e; font-size:12px;">AI 综合健康指数：</span>
                                <span style="font-size:28px; font-weight:800; color:#d97706; margin-left:8px;">${data.score}</span>
                            </div>
                        </div>

                        <!-- 红绿榜对比 -->
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:25px;">
                            <div style="background:#f0fdf4; padding:20px; border-radius:12px; border:1px solid #bbf7d0;">
                                <h4 style="color:#166534; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-thumb-up" style="margin-right:5px;"></i> 亮点与优势
                                </h4>
                                <ul style="padding-left:20px; color:#14532d; font-size:14px; margin:0; line-height:1.6;">
                                    ${data.highlights.map(h => `<li>${h}</li>`).join('')}
                                </ul>
                            </div>
                            <div style="background:#fef2f2; padding:20px; border-radius:12px; border:1px solid #fecaca;">
                                <h4 style="color:#991b1b; margin:0 0 10px 0; display:flex; align-items:center;">
                                    <i class="ti ti-alert-triangle" style="margin-right:5px;"></i> 风险与预警
                                </h4>
                                <ul style="padding-left:20px; color:#7f1d1d; font-size:14px; margin:0; line-height:1.6;">
                                    ${data.warnings.map(w => `<li>${w}</li>`).join('')}
                                </ul>
                            </div>
                        </div>

                        <!-- 策略清单 -->
                        <div style="background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:20px;">
                            <h4 style="color:#334155; margin:0 0 15px 0; border-left:4px solid var(--primary); padding-left:10px;">
                                🚀 提质增效行动方案
                            </h4>
                            <div style="display:flex; flex-direction:column; gap:15px;">
                                ${data.strategies.map((s, i) => `
                                    <div style="display:flex; align-items:flex-start; gap:12px;">
                                        <div style="background:#eff6ff; color:#1d4ed8; width:28px; height:28px; border-radius:6px; text-align:center; line-height:28px; font-weight:bold; flex-shrink:0;">${i + 1}</div>
                                        <div>
                                            <div style="font-weight:bold; color:#1e293b; font-size:15px;">${s.title}</div>
                                            <div style="font-size:14px; color:#475569; margin-top:4px; line-height:1.5;">${s.action}</div>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <!-- 底部口号 -->
                        <div style="margin-top:30px; text-align:center;">
                            <span style="background:#f1f5f9; color:#64748b; padding:8px 20px; border-radius:50px; font-style:italic; font-size:14px;">
                                “ ${data.slogan} ”
                            </span>
                        </div>
                    </div>
                `;
        } catch (e) {
            // 如果 AI 返回的不是合法 JSON，回退显示原始文本
            console.error("AI JSON 解析失败", e);
            contentDiv.innerHTML = `
                    <div style="padding:20px; color:#333;">
                        <h3 style="color:#d97706;">⚠️ 解析模式降级</h3>
                        <p style="font-size:12px; color:#666;">AI 未返回标准 JSON 格式，已切换为纯文本显示。</p>
                        <hr style="margin:10px 0; border:0; border-top:1px solid #eee;">
                        <pre style="white-space:pre-wrap; font-family:sans-serif; line-height:1.6;">${jsonBuffer}</pre>
                    </div>
                `;
        }
    });
}

function copyReport() {
    const text = document.getElementById('ai-report-content').innerText;
    navigator.clipboard.writeText(text).then(() => alert("已复制到剪贴板"));
}
function exportToWord() {
    const content = document.getElementById('ai-report-content').innerText;
    // 使用我们之前封装的 UI.toast 替代 alert，如果还没加 UI 模块，这里依然可以用 alert
    if (!content || content.includes("正在汇总")) return (window.UI ? UI.toast : alert)("请等待报告生成完毕后再导出");

    const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } = docx;

    // 1. 解析文本：简单按换行符分割
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const docChildren = [];

    // 1.1 添加大标题
    docChildren.push(
        new Paragraph({
            text: `${CONFIG.name} 教学质量分析报告`,
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 }
        })
    );

    // 1.2 添加生成日期
    docChildren.push(
        new Paragraph({
            children: [
                new TextRun({
                    text: `生成日期：${new Date().toLocaleDateString()}`,
                    italics: true,
                    color: "666666",
                    size: 20 // 10pt
                })
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 500 }
        })
    );

    // 1.3 智能识别正文段落结构
    lines.forEach(line => {
        const trimmed = line.trim();

        // 简单的标题识别逻辑：以 "一、" "1." 等开头，或者包含 "【"
        const isHeading = /^[一二三四五六七八九十]、/.test(trimmed) ||
            /^\d+\./.test(trimmed) ||
            /^【.*】$/.test(trimmed);

        if (isHeading) {
            // 小标题格式：加粗，字号稍大，段前段后间距
            docChildren.push(
                new Paragraph({
                    children: [new TextRun({ text: trimmed, bold: true, size: 28 })], // 14pt
                    spacing: { before: 400, after: 200 }
                })
            );
        } else {
            // 普通正文：首行缩进 2 字符，1.5倍行距
            docChildren.push(
                new Paragraph({
                    children: [new TextRun({ text: trimmed, size: 24 })], // 12pt
                    indent: { firstLine: 480 },
                    spacing: { line: 360 }
                })
            );
        }
    });

    // 1.4 底部落款
    docChildren.push(
        new Paragraph({
            children: [new TextRun({ text: "（本报告由智能教务系统自动生成）", color: "999999", size: 18 })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 800 }
        })
    );

    // 2. 创建文档对象
    const doc = new Document({
        sections: [{ properties: {}, children: docChildren }],
    });

    // 3. 生成并下载
    Packer.toBlob(doc).then((blob) => {
        const fileName = `${CONFIG.name}_质量分析报告_${new Date().getTime()}.docx`;
        saveAs(blob, fileName);
        if (window.UI) UI.toast(`✅ 已导出 Word 文档：${fileName}`, "success");
    }).catch(err => {
        console.error(err);
        alert("导出 Word 失败：" + err.message);
    });
}
function loadTeacherStamp(input) {
    const file = input.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function (e) { TEACHER_STAMP_BASE64 = e.target.result; alert("签名/章图片已导入"); }; reader.readAsDataURL(file);
}
function renderHistoryChart(student) {
    const ctx = document.getElementById('historyChart');
    if (!ctx) return;
    if (historyChartInstance) historyChartInstance.destroy();

    // 1. 尝试从历史档案中获取数据
    const uid = student.school + "_" + normalizeClass(student.class || '') + "_" + student.name;
    // 深度拷贝一份，以免修改原数据
    let history = HISTORY_ARCHIVE[uid] ? JSON.parse(JSON.stringify(HISTORY_ARCHIVE[uid])) : [];

    // 2. 将“本次”考试数据加入趋势图
    const currentRank = safeGet(student, 'ranks.total.township', 0);
    if (currentRank) {
        history.push({ exam: '本次期末', rank: currentRank });
    }

    // 如果完全没有数据
    if (history.length === 0) {
        // 画一个空图或者显示文字
        return;
    }

    // --- A. 简单线性回归预测 (Simple Linear Regression) ---
    let prediction = null;

    // 只有当历史数据 >= 3 次时才进行预测，否则样本太少不准确
    if (history.length >= 3) {
        const n = history.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

        // X轴为时间序列索引 (0, 1, 2...), Y轴为排名
        history.forEach((h, i) => {
            sumX += i;
            sumY += h.rank;
            sumXY += i * h.rank;
            sumXX += i * i;
        });

        // 计算斜率 (Slope) 和 截距 (Intercept)
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;

        // 预测下一次 (索引为 n)
        const nextRank = Math.round(slope * n + intercept);

        // 限制预测值合理范围 (排名不能小于1)
        const predictedRank = Math.max(1, nextRank);

        // 判断趋势方向
        const trend = slope < 0 ? '📈 持续进步' : (slope > 0 ? '📉 有下滑风险' : '➡️ 保持稳定');

        prediction = {
            rank: predictedRank,
            label: "下期预测",
            trendText: trend
        };
    }

    // --- B. 准备图表数据 ---
    const labels = history.map(h => h.exam);
    const data = history.map(h => h.rank);

    // 定义点的颜色和大小 (真实数据用蓝色)
    const pointColors = data.map(() => '#2563eb');
    const pointRadii = data.map(() => 5);

    // 如果有预测数据，追加到数组末尾
    if (prediction) {
        labels.push(prediction.label);
        data.push(prediction.rank);
        // 预测点用橙色，且稍微大一点
        pointColors.push('#f59e0b');
        pointRadii.push(6);
    }

    // --- C. 绘制图表 ---
    // 判断是否为波动生 (原有逻辑)
    const isUnstable = ROLLER_COASTER_STUDENTS.includes(uid);

    historyChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: '全镇排名 (越低越好)',
                data: data,
                // 样式配置
                backgroundColor: isUnstable ? 'rgba(220, 38, 38, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                borderWidth: 2,
                pointBackgroundColor: '#fff',
                pointBorderColor: pointColors, // 使用动态颜色数组
                pointRadius: pointRadii,       // 使用动态大小数组
                fill: true,
                tension: 0.3,

                // 关键：利用 segment 配置实现虚线连接预测点
                segment: {
                    borderDash: ctx => {
                        // 如果是连接到最后一点(且有预测)，则设为虚线 [5, 5]
                        if (prediction && ctx.p1DataIndex === data.length - 1) return [6, 4];
                        return undefined; // 实线
                    },
                    borderColor: ctx => {
                        // 预测线段用橙色
                        if (prediction && ctx.p1DataIndex === data.length - 1) return '#f59e0b';
                        // 波动生用红色，普通生用蓝色
                        return isUnstable ? '#dc2626' : '#2563eb';
                    }
                }
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (prediction && context.dataIndex === data.length - 1) {
                                return label + context.raw + " (AI预测值)";
                            }
                            return label + context.raw;
                        }
                    }
                },
                // 动态标题显示预测结果
                title: {
                    display: true,
                    text: prediction
                        ? `历史走势 | 🤖 预测下次: 第 ${prediction.rank} 名 (${prediction.trendText})`
                        : (isUnstable ? '⚠️ 排名波动剧烈，需关注' : '历史排名走势'),
                    color: (prediction && prediction.trendText.includes('风险')) || isUnstable ? '#dc2626' : '#333',
                    font: { size: 13 }
                }
            },
            scales: {
                y: {
                    reverse: true, // 排名反转，越靠上越好
                    title: { display: true, text: '名次' },
                    suggestedMin: 1 // 保证Y轴不为负
                }
            }
        }
    });
}

function renderRadarChart(student, passedHistory = null) {
    const reportStudent = getComparisonStudentView(student, RAW_DATA);
    const ctx = document.getElementById('radarChart'); if (!ctx) return;
    if (!window.Chart) {
        const holder = ctx.parentElement;
        if (holder) holder.innerHTML = '<div style="text-align:center; color:#94a3b8; font-size:12px; padding:20px;">?????????????</div>';
        return;
    }
    if (radarChartInstance) { radarChartInstance.destroy(); }

    const labels = [];
    const currentData = [];
    const linkedSubjects = getComparisonTotalSubjects();

    linkedSubjects.forEach(sub => {
        if (reportStudent.scores[sub] !== undefined) {
            labels.push(sub);
            const allScores = RAW_DATA.map(s => s.scores[sub]).filter(v => typeof v === 'number').sort((a, b) => b - a);
            const rank = allScores.indexOf(reportStudent.scores[sub]) + 1;
            const total = allScores.length;
            currentData.push(total > 0 ? ((1 - (rank / total)) * 100).toFixed(1) : null);
        }
    });

    const datasets = [{
        label: formatComparisonExamLabel(getEffectiveCurrentExamId(), 'Current'),
        data: currentData,
        fill: true,
        backgroundColor: 'rgba(37, 99, 235, 0.2)',
        borderColor: '#2563eb',
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#fff',
        pointRadius: 4,
        borderWidth: 2,
        order: 10
    }];

    const latestHistoryEntry = getLatestHistoryExamEntry(reportStudent, passedHistory);
    const latestHistoryStudent = latestHistoryEntry ? (latestHistoryEntry.student || latestHistoryEntry) : null;
    const latestHistoryRows = Array.isArray(latestHistoryEntry?.allStudents) ? latestHistoryEntry.allStudents : [];

    if (latestHistoryStudent?.scores) {
        const previousData = labels.map(sub => {
            if (latestHistoryStudent.scores[sub] === undefined) return null;
            const prevScores = latestHistoryRows
                .map(row => row?.scores?.[sub])
                .filter(v => typeof v === 'number')
                .sort((a, b) => b - a);
            if (!prevScores.length) return null;
            const prevRank = prevScores.indexOf(latestHistoryStudent.scores[sub]) + 1;
            return prevRank > 0 ? ((1 - (prevRank / prevScores.length)) * 100).toFixed(1) : null;
        });

        if (previousData.some(value => value !== null)) {
            datasets.push({
                label: formatComparisonExamLabel(latestHistoryEntry.examLabel || latestHistoryEntry.examId, 'Previous'),
                data: previousData,
                fill: false,
                borderDash: [6, 4],
                borderColor: '#f97316',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#f97316',
                pointRadius: 4,
                pointStyle: 'rectRot',
                borderWidth: 1.5,
                order: 1
            });
        }
    }

    radarChartInstance = new Chart(ctx, {
        type: 'radar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    min: 0,
                    max: 100,
                    ticks: { display: false },
                    pointLabels: { font: { size: 12, family: 'Microsoft YaHei', weight: 'bold' }, color: '#475569' },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    angleLines: { color: 'rgba(0,0,0,0.05)' }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 15, font: { size: 11 } }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.dataset.label}: Percentile ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

let varianceChartInstance = null;

function renderVarianceChart(student, passedHistory = null) {
    const reportStudent = getComparisonStudentView(student, RAW_DATA);
    const ctx = document.getElementById('varianceChart');
    if (!ctx) return;
    if (!window.Chart) {
        const holder = ctx.parentElement;
        if (holder) holder.innerHTML = '<div style="text-align:center; color:#94a3b8; font-size:12px; padding:20px;">?????????????</div>';
        return;
    }
    if (varianceChartInstance) varianceChartInstance.destroy();

    const labels = [];
    const zScoresCurr = [];
    const zScoresPrev = [];
    const bgColors = [];
    const latestHistoryEntry = getLatestHistoryExamEntry(reportStudent, passedHistory);
    const prevStu = latestHistoryEntry ? (latestHistoryEntry.student || latestHistoryEntry) : null;
    const prevRows = Array.isArray(latestHistoryEntry?.allStudents) ? latestHistoryEntry.allStudents : [];

    const calcStats = (arr) => {
        const n = arr.length;
        if (n === 0) return { mean: 0, sd: 1 };
        const mean = arr.reduce((a, b) => a + b, 0) / n;
        const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        return { mean, sd: Math.sqrt(variance) };
    };

    const linkedSubjects = getComparisonTotalSubjects();
    linkedSubjects.forEach(sub => {
        if (reportStudent.scores[sub] !== undefined) {
            const allScores = RAW_DATA.map(s => s.scores[sub]).filter(v => typeof v === 'number');
            const stats = calcStats(allScores);
            let z = 0;
            if (stats.sd > 0) z = (reportStudent.scores[sub] - stats.mean) / stats.sd;

            labels.push(sub);
            zScoresCurr.push(z);

            if (z >= 0.8) bgColors.push('#16a34a');
            else if (z <= -0.8) bgColors.push('#dc2626');
            else bgColors.push('#3b82f6');

            let prevZ = null;
            if (prevStu && prevStu.scores && prevStu.scores[sub] !== undefined) {
                const prevAllScores = prevRows
                    .map(row => row?.scores?.[sub])
                    .filter(v => typeof v === 'number');
                const prevStats = calcStats(prevAllScores);
                if (prevStats.sd > 0) {
                    prevZ = (prevStu.scores[sub] - prevStats.mean) / prevStats.sd;
                }
            }
            zScoresPrev.push(prevZ);
        }
    });

    const datasets = [{
        label: 'Current',
        data: zScoresCurr,
        backgroundColor: bgColors,
        borderRadius: 3,
        barPercentage: 0.5,
        categoryPercentage: 0.8,
        order: 1
    }];

    if (zScoresPrev.some(d => d !== null)) {
        datasets.push({
            label: formatComparisonExamLabel(latestHistoryEntry?.examLabel || latestHistoryEntry?.examId, 'Previous'),
            data: zScoresPrev,
            backgroundColor: 'rgba(249, 115, 22, 0.4)',
            borderColor: '#f97316',
            borderWidth: 1,
            borderRadius: 3,
            barPercentage: 0.5,
            categoryPercentage: 0.8,
            order: 2
        });
    }

    varianceChartInstance = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: true, position: 'bottom' },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `${ctx.dataset.label} Z-Score: ${ctx.raw ? ctx.raw.toFixed(2) : '-'}`
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: (ctx) => ctx.tick.value === 0 ? '#475569' : '#f1f5f9',
                        lineWidth: (ctx) => ctx.tick.value === 0 ? 1.5 : 1
                    },
                    suggestedMin: -2.5,
                    suggestedMax: 2.5,
                    ticks: { display: false }
                },
                y: { grid: { display: false } }
            }
        }
    });
}

function buildStudentInsightModel(student, passedHistory = null) {
    const reportStudent = getComparisonStudentView(student, RAW_DATA);
    const totalSubjects = getComparisonTotalSubjects();
    const totalScore = getComparisonTotalValue(reportStudent, totalSubjects);
    const totalCount = RAW_DATA.length || 1;
    const isSingleSchool = Object.keys(SCHOOLS).length <= 1;
    const scopeText = isSingleSchool ? '全校' : '全镇';
    const effectiveRank = safeGet(reportStudent, 'ranks.total.township', safeGet(reportStudent, 'ranks.total.school', '-'));
    const percentile = (typeof effectiveRank === 'number' && totalCount > 0)
        ? ((1 - effectiveRank / totalCount) * 100)
        : null;

    const history = Array.isArray(passedHistory) ? passedHistory : (typeof getStudentExamHistory === 'function' ? getStudentExamHistory(reportStudent) : []);
    const latestHistoryEntry = getLatestHistoryExamEntry(reportStudent, history);
    const previousStudent = latestHistoryEntry ? (latestHistoryEntry.student || latestHistoryEntry) : null;
    const previousTotal = previousStudent ? recalcPrevTotal(previousStudent) : null;
    const totalDelta = (Number.isFinite(totalScore) && Number.isFinite(previousTotal)) ? (totalScore - previousTotal) : null;

    const calcStats = (arr) => {
        const count = arr.length;
        if (!count) return { mean: 0, sd: 1 };
        const mean = arr.reduce((sum, value) => sum + value, 0) / count;
        const variance = arr.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / count;
        return { mean, sd: Math.sqrt(variance) || 1 };
    };

    const subjectInsights = [];
    totalSubjects.forEach(subject => {
        const score = reportStudent?.scores?.[subject];
        if (typeof score !== 'number') return;
        const allScores = RAW_DATA
            .map(row => row?.scores?.[subject])
            .filter(value => typeof value === 'number')
            .sort((a, b) => b - a);
        if (!allScores.length) return;

        const rank = allScores.indexOf(score) + 1;
        const percentileValue = rank > 0 ? ((1 - rank / allScores.length) * 100) : null;
        const stats = calcStats(allScores);
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

    const strongSubjects = subjectInsights
        .filter(item => item.zScore >= 0.8)
        .sort((a, b) => b.zScore - a.zScore);
    const weakSubjects = subjectInsights
        .filter(item => item.zScore <= -0.8)
        .sort((a, b) => a.zScore - b.zScore);
    const sortedByRisk = [...subjectInsights].sort((a, b) => a.zScore - b.zScore);
    const sortedByStrength = [...subjectInsights].sort((a, b) => b.zScore - a.zScore);
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
        if (totalDelta >= 5) {
            trendLabel = `较上次提升 ${totalDelta.toFixed(1)} 分`;
            trendTone = 'up';
        } else if (totalDelta >= 0.5) {
            trendLabel = `较上次小幅提升 ${totalDelta.toFixed(1)} 分`;
            trendTone = 'up';
        } else if (totalDelta <= -5) {
            trendLabel = `较上次回落 ${Math.abs(totalDelta).toFixed(1)} 分`;
            trendTone = 'down';
        } else if (totalDelta <= -0.5) {
            trendLabel = `较上次略有回落 ${Math.abs(totalDelta).toFixed(1)} 分`;
            trendTone = 'down';
        } else {
            trendLabel = '与上次基本持平';
            trendTone = 'steady';
        }
    }

    const targetScore = Number.isFinite(totalScore)
        ? totalScore + Math.max(4, Math.min(12, (weakSubjects.length || 1) * 3))
        : null;
    const targetRank = (typeof effectiveRank === 'number')
        ? Math.max(1, effectiveRank - Math.max(1, Math.round(effectiveRank * 0.08)))
        : null;

    const focusSubjects = weakSubjects.slice(0, 2);
    const guardSubjects = strongSubjects.slice(0, 2);

    const actionPlans = [];
    if (focusSubjects.length) {
        actionPlans.push({
            tone: 'warn',
            title: `优先补弱：${focusSubjects.map(item => item.subject).join('、')}`,
            detail: '先做基础概念回顾，再做近两次错题复盘；每天固定 15 到 20 分钟，先稳住容易失分点。'
        });
    } else {
        actionPlans.push({
            tone: 'ok',
            title: '当前没有明显短板',
            detail: '说明整体结构比较稳，可以把更多精力放在提速、审题和规范表达上，争取把稳定优势转成总分。'
        });
    }

    if (guardSubjects.length) {
        actionPlans.push({
            tone: 'info',
            title: `继续守住优势：${guardSubjects.map(item => item.subject).join('、')}`,
            detail: '优势科不要盲目加量，重点保持错题复盘和阶段总结，让强项持续稳定输出。'
        });
    } else {
        actionPlans.push({
            tone: 'info',
            title: '建立自己的稳定科目',
            detail: '从最有把握的一门学科开始，先把基础题和中档题做稳，逐步形成可复制的得分来源。'
        });
    }

    actionPlans.push({
        tone: 'goal',
        title: '下一次目标建议',
        detail: `${targetScore !== null ? `建议先把总分稳定到 ${targetScore.toFixed(1)} 分左右；` : ''}${targetRank !== null ? `争取 ${scopeText}排名提升到前 ${targetRank} 名。` : '先把当前优势延续到下一次考试。'}`
    });

    const realityNotes = [
        `本次解读基于当前成绩库中的 ${totalCount} 名同届样本和 ${Math.max(history.length, 1)} 次考试记录。`,
        '分数、排名、百分位均按已导入的真实成绩计算，不做“估高”处理。',
        '如果学校还没有导入最新一次考试或历史考试，趋势结论会更保守。'
    ];

    return {
        reportStudent,
        totalScore,
        totalCount,
        scopeText,
        effectiveRank,
        percentile,
        previousTotal,
        totalDelta,
        balanceLabel,
        balanceTone,
        trendLabel,
        trendTone,
        focusSubjects,
        guardSubjects,
        actionPlans,
        realityNotes,
        targetScore,
        targetRank,
        subjectInsights,
        strongSubjects,
        weakSubjects
    };
}

function renderStudentInsightOverview(model) {
    const pctText = model.percentile !== null ? `${model.percentile.toFixed(0)}%` : '-';
    const totalText = Number.isFinite(model.totalScore) ? model.totalScore.toFixed(1) : '-';
    const rankText = typeof model.effectiveRank === 'number' ? `${model.effectiveRank}` : '-';
    const prevText = Number.isFinite(model.previousTotal) ? model.previousTotal.toFixed(1) : '-';
    const trendClass = model.trendTone === 'up' ? 'report-pill up' : model.trendTone === 'down' ? 'report-pill down' : 'report-pill';
    const balanceClass = model.balanceTone === 'warn' ? 'report-pill warn' : model.balanceTone === 'info' ? 'report-pill info' : 'report-pill ok';
    const focusText = model.focusSubjects.length
        ? model.focusSubjects.map(item => item.subject).join('、')
        : '暂无明显短板';
    const guardText = model.guardSubjects.length
        ? model.guardSubjects.map(item => item.subject).join('、')
        : '建议先培养一门稳定优势科';

    const igInsightHtml = `
            <div style="margin: 15px 14px 0 14px; display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:10px;">
                <div style="background:#ffffff; border:1px solid #dbeafe; border-radius:12px; padding:12px 14px;">
                    <div style="font-size:11px; color:#64748b; font-weight:700;">真实定位</div>
                    <div style="font-size:18px; font-weight:800; color:#0f172a; margin-top:6px;">${typeof insightModel.effectiveRank === 'number' ? `第 ${insightModel.effectiveRank} 名` : '-'}</div>
                    <div style="font-size:11px; color:#2563eb; margin-top:4px;">${insightModel.scopeText}百分位 ${insightModel.percentile !== null ? insightModel.percentile.toFixed(0) + '%' : '-'}</div>
                </div>
                <div style="background:#ffffff; border:1px solid #fde68a; border-radius:12px; padding:12px 14px;">
                    <div style="font-size:11px; color:#64748b; font-weight:700;">当前走势</div>
                    <div style="font-size:16px; font-weight:800; color:#0f172a; margin-top:6px; line-height:1.45;">${insightModel.trendLabel}</div>
                    <div style="font-size:11px; color:#b45309; margin-top:4px;">结构状态：${insightModel.balanceLabel}</div>
                </div>
            </div>
            <div style="margin: 10px 14px 0 14px; background:#f8fafc; border:1px dashed #cbd5e1; border-radius:12px; padding:12px 14px;">
                <div style="font-size:11px; color:#64748b; font-weight:700; margin-bottom:6px;">下一步怎么调</div>
                <div style="font-size:12px; color:#334155; line-height:1.7;">${insightModel.actionPlans.map(plan => plan.title).join(' · ')}</div>
            </div>
        `;

    return `
        <div class="report-insight-grid">
            <div class="report-insight-card tone-score">
                <span class="report-insight-label">本次总分</span>
                <strong class="report-insight-value">${totalText}</strong>
                <span class="report-insight-sub">上次对比：${prevText}</span>
            </div>
            <div class="report-insight-card tone-rank">
                <span class="report-insight-label">${model.scopeText}定位</span>
                <strong class="report-insight-value">第 ${rankText} 名</strong>
                <span class="report-insight-sub">综合百分位：${pctText}</span>
            </div>
            <div class="report-insight-card tone-balance">
                <span class="report-insight-label">结构状态</span>
                <strong class="report-insight-value">${model.balanceLabel}</strong>
                <span class="${balanceClass}">${model.balanceLabel}</span>
            </div>
            <div class="report-insight-card tone-trend">
                <span class="report-insight-label">阶段走势</span>
                <strong class="report-insight-value">${model.trendLabel}</strong>
                <span class="${trendClass}">${model.trendLabel}</span>
            </div>
        </div>
        <div class="report-chip-row">
            <span class="report-chip report-chip-focus">当前优先调整：${focusText}</span>
            <span class="report-chip report-chip-guard">继续守住优势：${guardText}</span>
        </div>
    `;
}

function renderStudentActionPlan(model) {
    return `
        <div class="report-action-grid">
            ${model.actionPlans.map(plan => `
                <div class="report-action-card tone-${plan.tone}">
                    <div class="report-action-title">${plan.title}</div>
                    <div class="report-action-text">${plan.detail}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function renderStudentSubjectBoard(model) {
    const items = Array.isArray(model.subjectInsights) ? model.subjectInsights : [];
    if (!items.length) return '';

    return `
        <div class="report-subject-board">
            ${items.map(item => {
                const percentile = item.percentile !== null ? Math.max(0, Math.min(100, item.percentile)) : 0;
                const tone = item.zScore >= 0.8 ? 'strong' : item.zScore <= -0.8 ? 'weak' : 'steady';
                const label = tone === 'strong' ? '优势科' : tone === 'weak' ? '优先补弱' : '保持稳定';
                const zText = Number.isFinite(item.zScore) ? item.zScore.toFixed(2) : '-';
                return `
                    <div class="report-subject-item tone-${tone}">
                        <div class="report-subject-head">
                            <strong>${item.subject}</strong>
                            <span>${label}</span>
                        </div>
                        <div class="report-subject-meta">
                            <span>成绩 ${item.score}</span>
                            <span>百分位 ${item.percentile !== null ? item.percentile.toFixed(0) + '%' : '-'}</span>
                            <span>Z ${zText}</span>
                        </div>
                        <div class="report-progress-track">
                            <div class="report-progress-bar tone-${tone}" style="width:${percentile}%;"></div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
    `;
}

function renderStudentRealityNote(model) {
    return `
        <div class="report-reality-note">
            <div class="report-reality-title">真实成绩说明</div>
            <ul class="report-reality-list">
                ${model.realityNotes.map(note => `<li>${note}</li>`).join('')}
            </ul>
        </div>
    `;
}

function buildChartNarrative(student) {
    const isSingleSchool = Object.keys(SCHOOLS).length <= 1;
    const scopeText = isSingleSchool ? '全校' : '全镇';
    const reportStudent = getComparisonStudentView(student, RAW_DATA);
    const rank = safeGet(reportStudent, 'ranks.total.township', safeGet(reportStudent, 'ranks.total.school', '-'));
    const totalCount = RAW_DATA.length || 1;
    const percentile = (typeof rank === 'number') ? ((1 - rank / totalCount) * 100) : null;

    const subjectPercentiles = [];
    const zScores = [];
    const strong = [];
    const weak = [];

    const calcStats = (arr) => {
        const n = arr.length;
        if (n === 0) return { mean: 0, sd: 1 };
        const mean = arr.reduce((a, b) => a + b, 0) / n;
        const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        return { mean, sd: Math.sqrt(variance) };
    };

    const linkedSubjects = getComparisonTotalSubjects();
    linkedSubjects.forEach(sub => {
        if (reportStudent.scores[sub] === undefined) return;
        const allScores = RAW_DATA.map(s => s.scores[sub]).filter(v => typeof v === 'number').sort((a, b) => b - a);
        if (!allScores.length) return;
        const r = allScores.indexOf(reportStudent.scores[sub]) + 1;
        const p = ((1 - r / allScores.length) * 100);
        subjectPercentiles.push(p);

        const stats = calcStats(allScores);
        const z = stats.sd > 0 ? (reportStudent.scores[sub] - stats.mean) / stats.sd : 0;
        zScores.push(z);
        if (z >= 0.8) strong.push(sub);
        if (z <= -0.8) weak.push(sub);
    });

    const avgPct = subjectPercentiles.length ? (subjectPercentiles.reduce((a, b) => a + b, 0) / subjectPercentiles.length) : null;
    const maxZ = zScores.length ? Math.max(...zScores) : 0;
    const minZ = zScores.length ? Math.min(...zScores) : 0;
    const range = maxZ - minZ;

    const balanceText = range >= 2.5 ? '偏科明显' : range >= 1.2 ? '相对均衡' : '结构优秀';
    const strengthText = strong.length ? `优势学科：${strong.join('、')}` : '暂无明显优势学科';
    const weakText = weak.length ? `薄弱学科：${weak.join('、')}` : '暂无明显薄弱学科';

    let advice = [];
    if (weak.length) advice.push(`优先补弱科（${weak.join('、')}），建议每天固定 15 分钟回归基础概念。`);
    if (strong.length) advice.push(`保持优势科（${strong.join('、')}），可通过错题复盘稳住高位。`);
    if (!weak.length && !strong.length) advice.push('整体均衡，建议选择一门兴趣学科进行小幅突破。');
    advice.push('复习建议：先概念后练习，错题当天归档。');

    const pctText = percentile !== null ? `${percentile.toFixed(0)}%` : '-';
    const avgPctText = avgPct !== null ? `${avgPct.toFixed(0)}%` : '-';

    return `
        <div class="fluent-card" style="margin-top:10px;">
            <div class="fluent-header"><i class="ti ti-info-circle" style="color:#6366f1;"></i><span class="fluent-title">图表解读与建议</span></div>
            <div style="font-size:13px; color:#475569; line-height:1.8;">
                <div><strong>${CONFIG.name === '9年级' ? '五科综合素质评价' : '综合素质评价'}（百分位）</strong>：表示学生在${scopeText}的相对位置，数值越高越优秀。</div>
                <div>当前综合排名：${rank} / ${totalCount}，综合百分位约 <strong>${pctText}</strong>；单科平均百分位约 <strong>${avgPctText}</strong>。</div>
                <div style="margin-top:6px;"><strong>${CONFIG.name === '9年级' ? '五科学科均衡度' : '学科均衡度'}（Z-Score）</strong>：正数代表优势、负数代表薄弱，绝对值越大差异越明显。</div>
                <div>均衡度判断：<strong>${balanceText}</strong>；${strengthText}；${weakText}。</div>
                <div style="margin-top:6px;"><strong>学习建议</strong>：${advice.join(' ')}</div>
            </div>
        </div>`;
}

function analyzeStrengthsAndWeaknesses(student) {
    const strengthsContainer = document.getElementById('strengths-container'); const weaknessesContainer = document.getElementById('weaknesses-container'); const suggestionsContainer = document.getElementById('suggestions-container');
    if (!strengthsContainer || !weaknessesContainer || !suggestionsContainer) return;
    const allTotals = RAW_DATA.map(s => s.total).sort((a, b) => b - a); const totalPercentile = (allTotals.indexOf(student.total) + 1) / allTotals.length;
    const strengths = [], weaknesses = [];
    SUBJECTS.forEach(subject => {
        if (student.scores[subject] !== undefined) {
            const allScores = RAW_DATA.map(s => s.scores[subject]).filter(v => v !== undefined).sort((a, b) => b - a); const percentile = (allScores.indexOf(student.scores[subject]) + 1) / allScores.length; if (percentile < totalPercentile - 0.2) strengths.push({ subject, percentile, score: student.scores[subject] }); else if (percentile > totalPercentile + 0.2) weaknesses.push({ subject, percentile, score: student.scores[subject] });
        }
    });
    strengthsContainer.innerHTML = strengths.length ? strengths.map(s => `<span>${s.subject} <small>(${s.score})</small></span>`).join('、') : '无明显优势学科'; weaknessesContainer.innerHTML = weaknesses.length ? weaknesses.map(w => `<span>${w.subject} <small>(${w.score})</small></span>`).join('、') : '无明显劣势学科';
    let suggestions = weaknesses.length ? `<p>建议重点关注：${weaknesses.map(w => w.subject).join('、')}，制定针对性复习计划。</p>` : '<p>各科发展均衡，请继续保持当前的良好状态。</p>'; suggestionsContainer.innerHTML = suggestions;
}

function renderStudentInsightOverview(model) {
    const pctText = model.percentile !== null ? `${model.percentile.toFixed(0)}%` : '-';
    const totalText = Number.isFinite(model.totalScore) ? model.totalScore.toFixed(1) : '-';
    const rankText = typeof model.effectiveRank === 'number' ? `${model.effectiveRank}` : '-';
    const prevText = Number.isFinite(model.previousTotal) ? model.previousTotal.toFixed(1) : '-';
    const trendClass = model.trendTone === 'up' ? 'report-pill up' : model.trendTone === 'down' ? 'report-pill down' : 'report-pill';
    const balanceClass = model.balanceTone === 'warn' ? 'report-pill warn' : model.balanceTone === 'info' ? 'report-pill info' : 'report-pill ok';
    const focusText = model.focusSubjects.length
        ? model.focusSubjects.map(item => item.subject).join('、')
        : '暂无明显短板';
    const guardText = model.guardSubjects.length
        ? model.guardSubjects.map(item => item.subject).join('、')
        : '建议先培养一门稳定优势科';

    return `
        <div class="report-insight-grid">
            <div class="report-insight-card tone-score">
                <span class="report-insight-label">本次总分</span>
                <strong class="report-insight-value">${totalText}</strong>
                <span class="report-insight-sub">上次对比：${prevText}</span>
            </div>
            <div class="report-insight-card tone-rank">
                <span class="report-insight-label">${model.scopeText}定位</span>
                <strong class="report-insight-value">第 ${rankText} 名</strong>
                <span class="report-insight-sub">综合百分位：${pctText}</span>
            </div>
            <div class="report-insight-card tone-balance">
                <span class="report-insight-label">结构状态</span>
                <strong class="report-insight-value">${model.balanceLabel}</strong>
                <span class="${balanceClass}">${model.balanceLabel}</span>
            </div>
            <div class="report-insight-card tone-trend">
                <span class="report-insight-label">阶段走势</span>
                <strong class="report-insight-value">${model.trendLabel}</strong>
                <span class="${trendClass}">${model.trendLabel}</span>
            </div>
        </div>
        <div class="report-chip-row">
            <span class="report-chip report-chip-focus">当前优先调整：${focusText}</span>
            <span class="report-chip report-chip-guard">继续守住优势：${guardText}</span>
        </div>
    `;
}

var igInsightHtml = '';

    Object.assign(window, {
        getTrendBadge,
        renderSingleReportCardHTML,
        renderInstagramCard,
        renderIGCharts,
        saveLLMConfig,
        callLLM,
        callAIForComment,
        generateAIMacroReport,
        copyReport,
        exportToWord,
        printSingleReport,
        downloadSingleReportPDF,
        batchGeneratePDF,
        renderRadarChart,
        renderVarianceChart,
        buildChartNarrative,
        analyzeStrengthsAndWeaknesses
    });

    window.__REPORT_RENDER_RUNTIME_PATCHED__ = true;
})();
