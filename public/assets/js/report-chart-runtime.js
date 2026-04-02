(() => {
    if (typeof window === 'undefined' || window.__REPORT_CHART_RUNTIME_PATCHED__) return;

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

    Object.assign(window, {
        renderIGCharts,
        renderHistoryChart,
        renderRadarChart,
        renderVarianceChart,
        buildStudentInsightModel,
        renderStudentInsightOverview,
        renderStudentActionPlan,
        renderStudentSubjectBoard,
        renderStudentRealityNote,
        buildChartNarrative,
        analyzeStrengthsAndWeaknesses
    });

    window.__REPORT_CHART_RUNTIME_PATCHED__ = true;
})();
