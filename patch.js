/**
 * 学生历次成绩对比优化补丁
 * 增加 getHistoryComparisonData 函数，用于获取指定学生的历次成绩对比数据
 */

async function getHistoryComparisonData(studentName, className, schoolName) {
    if (!sbClient) return { success: false, message: '云端服务未连接' };
    
    try {
        // 1. 获取所有包含该学生对比数据的云端记录
        const { data, error } = await sbClient
            .from('system_data')
            .select('key, content, updated_at')
            .like('key', 'STUDENT_COMPARE_%')
            .order('updated_at', { ascending: false });

        if (error) throw error;
        if (!data || data.length === 0) return { success: false, message: '暂无云端对比记录' };

        const history = [];
        const normalizedTargetName = normalizeCompareName(studentName);
        const normalizedTargetClass = String(className || '').trim();

        for (const item of data) {
            let raw = item.content;
            if (typeof raw === 'string' && raw.startsWith('LZ|')) {
                raw = LZString.decompressFromUTF16(raw.substring(3));
            }
            const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
            
            // 在该记录中查找匹配的学生
            const sourceRows = payload.studentsCompareData || [];
            const matched = sourceRows.find(s => {
                const sName = typeof normalizeCompareName === 'function' ? normalizeCompareName(s.name || '') : String(s.name || '').trim();
                const sameName = sName === normalizedTargetName;
                let sameClass = !normalizedTargetClass || (typeof isClassEquivalent === 'function' ? isClassEquivalent(s.class || '', normalizedTargetClass) : s.class === normalizedTargetClass);
                if (!sameClass && normalizedTargetClass && s.class) {
                    sameClass = String(s.class).replace(/[^0-9]/g, '') === normalizedTargetClass.replace(/[^0-9]/g, '');
                }
                const sameSchool = !schoolName || String(s.school || '').trim() === String(schoolName).trim();
                return sameName && (sameClass || !s.class);
            });

            if (matched && matched.periods) {
                // 提取所有期次的数据
                matched.periods.forEach(p => {
                    // 避免重复添加同一场考试的数据
                    if (!history.find(h => h.examId === p.examId)) {
                        history.push({
                            examId: p.examId,
                            total: p.total,
                            rankClass: p.rankClass,
                            rankSchool: p.rankSchool,
                            rankTown: p.rankTown,
                            subjects: p.subjects,
                            updatedAt: item.updated_at
                        });
                    }
                });
            }
        }

        // 按照考试期次排序（假设 examId 包含时间信息或通过 updatedAt 辅助）
        history.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

        return { success: true, data: history };
    } catch (e) {
        console.error('获取历次成绩失败:', e);
        return { success: false, message: e.message };
    }
}

/**
 * 渲染历次成绩对比图表
 */
function renderHistoryCharts(historyData) {
    const containerId = 'history-charts-container';
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'fluent-card';
        container.style.marginTop = '20px';
        const captureArea = document.getElementById('report-card-capture-area');
        if (captureArea) captureArea.appendChild(container);
    }

    if (!historyData || historyData.length < 2) {
        container.innerHTML = '<div style="padding:20px; text-align:center; color:#64748b;">历次成绩数据不足（至少需要2次考试记录）以生成趋势图</div>';
        return;
    }

    container.innerHTML = `
        <div class="fluent-header">
            <i class="ti ti-trending-up" style="color:#2563eb;"></i>
            <span class="fluent-title">历次考试成绩趋势对比</span>
        </div>
        <div style="height:300px; position:relative;">
            <canvas id="historyTrendChart"></canvas>
        </div>
        <div style="margin-top:20px; overflow-x:auto;">
            <table class="fluent-table" style="font-size:12px;">
                <thead>
                    <tr>
                        <th>考试期次</th>
                        <th>总分</th>
                        <th>级排</th>
                        <th>镇排</th>
                    </tr>
                </thead>
                <tbody>
                    ${historyData.map(h => `
                        <tr>
                            <td>${h.examId}</td>
                            <td style="font-weight:bold;">${Number(h.total).toFixed(1)}</td>
                            <td>${h.rankSchool || '-'}</td>
                            <td>${h.rankTown || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;

    const ctx = document.getElementById('historyTrendChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: historyData.map(h => h.examId),
            datasets: [{
                label: '总分趋势',
                data: historyData.map(h => h.total),
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                borderWidth: 3,
                pointBackgroundColor: '#2563eb',
                pointRadius: 5,
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const h = historyData[context.dataIndex];
                            return [\`总分: \${context.parsed.y}\`, \`级排: \${h.rankSchool}\`, \`镇排: \${h.rankTown}\`];
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    grid: { color: '#f1f5f9' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}

// 修改 doQuery 以包含历史对比
const originalDoQuery = window.doQuery;
window.doQuery = async function() {
    // 1. 执行原始查询逻辑
    if (typeof originalDoQuery === 'function') {
        const name = document.getElementById('inp-name').value;
        const sch = document.getElementById('sel-school').value;
        const cls = document.getElementById('sel-class').value;
        
        let stu = SCHOOLS[sch]?.students.find(s => s.name === name && (cls === '--请先选择学校--' || s.class === cls));
        if (!stu) return alert("未找到该学生");
        
        // 调用原始逻辑渲染基本报告
        clearCloudStudentCompareContext();
        setCloudCompareTarget(stu);
        CURRENT_REPORT_STUDENT = stu;
        document.getElementById('single-report-result').classList.remove('hidden');
        const container = document.getElementById('report-card-capture-area');
        container.innerHTML = renderSingleReportCardHTML(stu, 'A4');
        setTimeout(() => { renderRadarChart(stu); renderVarianceChart(stu); }, 100);
        analyzeStrengthsAndWeaknesses(stu);

        // 2. 异步加载并渲染历史对比
        const historyResult = await getHistoryComparisonData(stu.name, stu.class, stu.school);
        if (historyResult.success) {
            renderHistoryCharts(historyResult.data);
        }
    }
};
