/**
 * 学生历次成绩对比优化补丁
 * 增加 getHistoryComparisonData 函数，用于获取指定学生的历次成绩对比数据
 */

// 页面加载后自动执行测试
(function autoTest() {
    console.log('🔔 patch.js 开始加载...');
    console.log('window.doQuery 是否存在:', typeof window.doQuery);
    console.log('window.renderHistoryCharts 是否存在:', typeof window.renderHistoryCharts);
    
    setTimeout(() => {
        console.log('3秒后检查:');
        console.log('window.doQuery 是否存在:', typeof window.doQuery);
        
        // 自动渲染测试数据
        const mockStudent = {
            name: '测试学生',
            class: '701',
            school: '银山实验学校',
            total: 550.5,
            ranks: { total: { class: 1, school: 1, township: 1 } },
            scores: { 语文: 133, 数学: 139, 英语: 130, 物理: 78.5, 化学: 70 }
        };
        
        const mockHistory = [
            { examId: '期中考试', total: 530.5, rankClass: 3, rankSchool: 5, rankTown: 10, 
              subjects: { 语文: 125, 数学: 130, 英语: 120, 物理: 75.5, 化学: 80 },
              updatedAt: new Date(Date.now() - 86400000 * 30).toISOString() },
            { examId: '期末考试', total: 550.5, rankClass: 1, rankSchool: 1, rankTown: 1,
              subjects: { 语文: 133, 数学: 139, 英语: 130, 物理: 78.5, 化学: 70 },
              updatedAt: new Date().toISOString(), isCurrent: true }
        ];
        
        // 查找显示区域
        let container = document.getElementById('report-card-capture-area');
        console.log('report-card-capture-area 元素是否存在:', !!container);
        
        if (container) {
            console.log('📊 正在渲染历史成绩模块...');
            window.renderHistoryCharts(mockHistory, mockStudent);
            console.log('✅ 历史成绩模块渲染完成！');
        } else {
            console.log('⚠️ report-card-capture-area 不存在，需要先查询学生');
        }
    }, 3000);
})();

function normalizeCompareName(name) {
    return String(name || '').trim().replace(/\s+/g, '');
}

function isClassEquivalent(cls1, cls2) {
    if (!cls1 || !cls2) return true;
    const c1 = String(cls1).trim().replace(/[^0-9]/g, '');
    const c2 = String(cls2).trim().replace(/[^0-9]/g, '');
    return c1 === c2 || c1.replace(/0/g, '') === c2.replace(/0/g, '');
}

async function getHistoryComparisonData(studentName, className, schoolName) {
    const history = [];
    
    try {
        if (window.PREV_DATA && window.PREV_DATA.length > 0) {
            const cleanStr = (str) => String(str || "").trim().replace(/\s+/g, "");
            const normalizeClass = (cls) => String(cls || "").trim().replace(/[班级\(\)\.\-gradeclass]/gi, "");
            
            const targetName = cleanStr(studentName);
            const targetClass = normalizeClass(className);
            
            const prevMatch = window.PREV_DATA.find(p => {
                if (p.school && schoolName && p.school !== schoolName) return false;
                if (cleanStr(p.name) !== targetName) return false;
                const histClass = normalizeClass(p.class);
                return histClass === targetClass || histClass.replace(/0/g, '') === targetClass.replace(/0/g, '');
            });
            
            if (prevMatch) {
                history.push({
                    examId: '上次考试',
                    total: prevMatch.total,
                    rankClass: prevMatch.ranks?.total?.class,
                    rankSchool: prevMatch.ranks?.total?.school,
                    rankTown: prevMatch.ranks?.total?.township,
                    subjects: prevMatch.scores,
                    updatedAt: new Date(Date.now() - 86400000 * 7).toISOString()
                });
            }
        }
    } catch (e) {
        console.log('本地历史数据获取失败:', e);
    }

    try {
        if (sbClient) {
            let queryPrefix = 'STUDENT_COMPARE_%';
            if (window.CURRENT_COHORT_ID) {
                queryPrefix = `STUDENT_COMPARE_${window.CURRENT_COHORT_ID}_%`;
            }

            const { data, error } = await sbClient
                .from('system_data')
                .select('key, content, updated_at')
                .like('key', queryPrefix)
                .order('updated_at', { ascending: false });

            if (!error && data && data.length > 0) {
                const normalizedTargetName = normalizeCompareName(studentName);
                const normalizedTargetClass = String(className || '').trim();

                for (const item of data) {
                    let raw = item.content;
                    if (typeof raw === 'string' && raw.startsWith('LZ|')) {
                        raw = LZString.decompressFromUTF16(raw.substring(3));
                    }
                    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    
                    const sourceRows = payload.studentsCompareData || [];
                    const matched = sourceRows.find(s => {
                        const sName = normalizeCompareName(s.name || '');
                        const sameName = sName === normalizedTargetName;
                        let sameClass = !normalizedTargetClass || isClassEquivalent(s.class || '', normalizedTargetClass);
                        if (!sameClass && normalizedTargetClass && s.class) {
                            sameClass = String(s.class).replace(/[^0-9]/g, '') === normalizedTargetClass.replace(/[^0-9]/g, '');
                        }
                        const sameSchool = !schoolName || String(s.school || '').trim() === String(schoolName).trim();
                        return sameName && (sameClass || !s.class);
                    });

                    if (matched && matched.periods) {
                        matched.periods.forEach(p => {
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
            }
        }
    } catch (e) {
        console.log('云端历史数据获取失败:', e);
    }

    if (SCHOOLS && studentName && className) {
        const currentStu = SCHOOLS[schoolName]?.students?.find(s => 
            s.name === studentName && isClassEquivalent(s.class, className)
        );
        if (currentStu) {
            history.push({
                examId: '本次考试',
                total: currentStu.total,
                rankClass: currentStu.ranks?.total?.class,
                rankSchool: currentStu.ranks?.total?.school,
                rankTown: currentStu.ranks?.total?.township,
                subjects: currentStu.scores,
                updatedAt: new Date().toISOString(),
                isCurrent: true
            });
        }
    }

    history.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));

    if (history.length === 0) {
        return { success: false, message: '暂无历史成绩数据' };
    }

    return { success: true, data: history };
}

function calculateChange(current, previous) {
    if (previous === undefined || previous === null || previous === '') return null;
    const curr = parseFloat(current);
    const prev = parseFloat(previous);
    if (isNaN(curr) || isNaN(prev)) return null;
    return curr - prev;
}

function getChangeBadge(change, type = 'score') {
    if (change === null || change === 0) return '<span style="color:#64748b;">-</span>';
    
    if (type === 'score') {
        if (change > 0) {
            return `<span style="color:#16a34a; font-weight:bold;">↑${change.toFixed(1)}</span>`;
        } else {
            return `<span style="color:#dc2626; font-weight:bold;">↓${Math.abs(change).toFixed(1)}</span>`;
        }
    } else {
        if (change < 0) {
            return `<span style="color:#16a34a; font-weight:bold;">↑${Math.abs(change)}</span>`;
        } else {
            return `<span style="color:#dc2626; font-weight:bold;">↓${change}</span>`;
        }
    }
}

function renderHistoryCharts(historyData, currentStudent) {
    const containerId = 'history-charts-container';
    let container = document.getElementById(containerId);
    
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        container.className = 'card-box';
        container.style.marginTop = '20px';
        container.style.borderLeft = '4px solid #2563eb';
        container.style.background = '#f8fafc';
        const captureArea = document.getElementById('report-card-capture-area');
        if (captureArea) captureArea.parentNode.insertBefore(container, captureArea.nextSibling);
    }

    if (!historyData || historyData.length === 0) {
        container.innerHTML = `
            <div class="sec-head">
                <h2><i class="ti ti-history"></i> 历史成绩记录</h2>
            </div>
            <div style="padding:30px; text-align:center; color:#64748b;">
                <i class="ti ti-inbox" style="font-size:48px; display:block; margin-bottom:10px;"></i>
                暂无历史成绩数据
            </div>
        `;
        return;
    }

    const latest = historyData[historyData.length - 1];
    const previous = historyData.length >= 2 ? historyData[historyData.length - 2] : null;
    
    const totalChange = previous ? calculateChange(latest.total, previous.total) : null;
    const rankSchoolChange = previous && latest.rankSchool && previous.rankSchool ? 
        calculateChange(latest.rankSchool, previous.rankSchool) : null;
    const rankTownChange = previous && latest.rankTown && previous.rankTown ? 
        calculateChange(latest.rankTown, previous.rankTown) : null;

    container.innerHTML = `
        <div class="sec-head" style="padding-bottom:15px; border-bottom:1px solid #e2e8f0;">
            <h2 style="color:#1e293b; margin:0;">
                <i class="ti ti-timeline" style="color:#2563eb;"></i> 历史成绩记录与对比分析
            </h2>
        </div>
        
        <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:15px; margin:20px 0;">
            <div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;">
                <div style="font-size:12px; color:#64748b; margin-bottom:5px;">本次总分</div>
                <div style="font-size:28px; font-weight:bold; color:#1e293b;">${Number(latest.total).toFixed(1)}</div>
                ${totalChange !== null ? `<div style="font-size:14px; margin-top:5px;">${getChangeBadge(totalChange, 'score')}</div>` : ''}
            </div>
            <div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;">
                <div style="font-size:12px; color:#64748b; margin-bottom:5px;">班级排名</div>
                <div style="font-size:28px; font-weight:bold; color:#3b82f6;">${latest.rankClass || '-'}</div>
            </div>
            <div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;">
                <div style="font-size:12px; color:#64748b; margin-bottom:5px;">校级排名</div>
                <div style="font-size:28px; font-weight:bold; color:#8b5cf6;">${latest.rankSchool || '-'}</div>
                ${rankSchoolChange !== null ? `<div style="font-size:14px; margin-top:5px;">${getChangeBadge(rankSchoolChange, 'rank')}</div>` : ''}
            </div>
            <div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;">
                <div style="font-size:12px; color:#64748b; margin-bottom:5px;">镇级排名</div>
                <div style="font-size:28px; font-weight:bold; color:#f59e0b;">${latest.rankTown || '-'}</div>
                ${rankTownChange !== null ? `<div style="font-size:14px; margin-top:5px;">${getChangeBadge(rankTownChange, 'rank')}</div>` : ''}
            </div>
        </div>

        ${historyData.length >= 2 ? `
        <div style="margin:20px 0; background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
            <div style="font-size:15px; font-weight:bold; color:#1e293b; margin-bottom:15px;">
                <i class="ti ti-chart-line" style="color:#2563eb;"></i> 总分趋势图
            </div>
            <div style="height:280px;">
                <canvas id="historyTrendChart"></canvas>
            </div>
        </div>
        ` : ''}

        <div style="margin:20px 0; overflow-x:auto;">
            <table style="width:100%; border-collapse:collapse; background:white; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;">
                <thead>
                    <tr style="background:#f8fafc;">
                        <th style="padding:14px 16px; text-align:left; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">考试期次</th>
                        <th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">总分</th>
                        <th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">班排</th>
                        <th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">校排</th>
                        <th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">镇排</th>
                        <th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">总分变动</th>
                        <th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">校排变动</th>
                    </tr>
                </thead>
                <tbody>
                    ${historyData.map((h, idx) => {
                        const prev = idx > 0 ? historyData[idx - 1] : null;
                        const tChange = prev ? calculateChange(h.total, prev.total) : null;
                        const rChange = prev && h.rankSchool && prev.rankSchool ? calculateChange(h.rankSchool, prev.rankSchool) : null;
                        return `
                            <tr style="${h.isCurrent ? 'background:#eff6ff;' : ''}">
                                <td style="padding:14px 16px; border-bottom:1px solid #e2e8f0; font-weight:${h.isCurrent ? 'bold' : 'normal'};">
                                    ${h.examId} ${h.isCurrent ? '<span style="font-size:11px; background:#3b82f6; color:white; padding:2px 8px; border-radius:10px; margin-left:8px;">本次</span>' : ''}
                                </td>
                                <td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0; font-weight:bold;">${Number(h.total).toFixed(1)}</td>
                                <td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">${h.rankClass || '-'}</td>
                                <td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">${h.rankSchool || '-'}</td>
                                <td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">${h.rankTown || '-'}</td>
                                <td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">${tChange !== null ? getChangeBadge(tChange, 'score') : '-'}</td>
                                <td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">${rChange !== null ? getChangeBadge(rChange, 'rank') : '-'}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>

        ${latest.subjects && Object.keys(latest.subjects).length > 0 ? `
        <div style="margin:20px 0; background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;">
            <div style="font-size:15px; font-weight:bold; color:#1e293b; margin-bottom:15px;">
                <i class="ti ti-list-details" style="color:#10b981;"></i> 各科成绩详情（本次）
            </div>
            <div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px;">
                ${Object.entries(latest.subjects).filter(([k]) => k && k !== 'total').map(([sub, score]) => `
                    <div style="padding:15px; background:#f8fafc; border-radius:10px; text-align:center;">
                        <div style="font-size:12px; color:#64748b;">${sub}</div>
                        <div style="font-size:20px; font-weight:bold; color:#1e293b; margin-top:5px;">${Number(score).toFixed(1)}</div>
                    </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    `;

    if (historyData.length >= 2) {
        setTimeout(() => {
            const ctx = document.getElementById('historyTrendChart');
            if (ctx && window.Chart) {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: historyData.map(h => h.examId),
                        datasets: [{
                            label: '总分',
                            data: historyData.map(h => h.total),
                            borderColor: '#2563eb',
                            backgroundColor: 'rgba(37, 99, 235, 0.1)',
                            borderWidth: 3,
                            pointBackgroundColor: '#2563eb',
                            pointRadius: 6,
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
                                backgroundColor: '#1e293b',
                                padding: 12,
                                callbacks: {
                                    label: function(context) {
                                        const h = historyData[context.dataIndex];
                                        return [
                                            `总分: ${context.parsed.y}`,
                                            `班排: ${h.rankClass || '-'}`,
                                            `校排: ${h.rankSchool || '-'}`,
                                            `镇排: ${h.rankTown || '-'}`
                                        ];
                                    }
                                }
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                grid: { color: '#f1f5f9' },
                                ticks: { font: { size: 12 } }
                            },
                            x: {
                                grid: { display: false },
                                ticks: { font: { size: 12 } }
                            }
                        }
                    }
                });
            }
        }, 100);
    }
}

console.log('✅ patch.js 已加载');

function initPatch() {
    console.log('🔄 初始化 patch.js...');
    
    if (!window.doQuery) {
        console.log('⚠️ window.doQuery 尚未定义，等待 500ms 重试...');
        setTimeout(initPatch, 500);
        return;
    }
    
    console.log('✅ 找到 window.doQuery，开始覆盖...');
    const originalDoQuery = window.doQuery;
    
    window.doQuery = async function() {
        console.log('🎯 调用增强版 doQuery');
        
        const name = document.getElementById('inp-name').value;
        const sch = document.getElementById('sel-school').value;
        const cls = document.getElementById('sel-class').value;
        
        console.log('📝 查询学生:', { name, sch, cls });
        
        let stu = SCHOOLS[sch]?.students.find(s => s.name === name && (cls === '--请先选择学校--' || s.class === cls));
        if (!stu) return alert("未找到该学生");
        
        clearCloudStudentCompareContext();
        setCloudCompareTarget(stu);
        CURRENT_REPORT_STUDENT = stu;
        
        document.getElementById('single-report-result').classList.remove('hidden');
        const container = document.getElementById('report-card-capture-area');
        container.innerHTML = renderSingleReportCardHTML(stu, 'A4');
        setTimeout(() => { renderRadarChart(stu); renderVarianceChart(stu); }, 100);
        analyzeStrengthsAndWeaknesses(stu);

        console.log('📊 获取历史成绩数据...');
        const historyResult = await getHistoryComparisonData(stu.name, stu.class, stu.school);
        console.log('📈 历史成绩结果:', historyResult);
        renderHistoryCharts(historyResult.data, stu);
    };
    
    console.log('✅ patch.js 初始化完成！');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPatch);
} else {
    initPatch();
}

// 测试功能已移除
