/**
 * 学生历次成绩对比优化补丁
 * 从云端存档获取历史成绩数据
 */

console.log('🔔 历史成绩模块加载中...');

function normalizeCompareName(name) {
    return String(name || '').trim().replace(/\s+/g, '');
}

function isClassEquivalent(cls1, cls2) {
    if (!cls1 || !cls2) return true;
    const c1 = String(cls1).trim().replace(/[^0-9]/g, '');
    const c2 = String(cls2).trim().replace(/[^0-9]/g, '');
    return c1 === c2 || c1.replace(/0/g, '') === c2.replace(/0/g, '');
}

function getHistoryTotalSubjects() {
    const subsForTotal = (window.CONFIG && window.CONFIG.totalSubs === 'auto') ? window.SUBJECTS : window.CONFIG?.totalSubs;
    return Array.isArray(subsForTotal) ? subsForTotal.filter(Boolean) : [];
}

function getHistoryTotalValue(student, subjects) {
    if (!student || !student.scores || typeof student.scores !== 'object') return Number.isFinite(Number(student?.total)) ? Number(student.total) : null;
    const totalSubjects = Array.isArray(subjects) && subjects.length ? subjects : getHistoryTotalSubjects();
    if (!totalSubjects.length) return Number.isFinite(Number(student.total)) ? Number(student.total) : null;

    let sum = 0;
    let count = 0;
    totalSubjects.forEach(sub => {
        const score = Number(student.scores?.[sub]);
        if (Number.isFinite(score)) {
            sum += score;
            count++;
        }
    });
    if (count === totalSubjects.length) return parseFloat(sum.toFixed(1));
    return Number.isFinite(Number(student.total)) ? Number(student.total) : null;
}

function buildHistorySnapshotView(student, allStudents) {
    if (!student || typeof student !== 'object') return student;
    const totalSubjects = getHistoryTotalSubjects();
    const view = {
        ...student,
        scores: { ...(student.scores || {}) },
        ranks: {
            ...(student.ranks || {}),
            total: { ...((student.ranks && student.ranks.total) || {}) }
        }
    };

    const normalizedTotal = getHistoryTotalValue(student, totalSubjects);
    if (Number.isFinite(normalizedTotal)) view.total = normalizedTotal;

    const rows = Array.isArray(allStudents) ? allStudents.filter(Boolean) : [];
    if (!rows.length || typeof assignCompetitionRanks !== 'function') return view;

    const keyOf = (row) => `${String(row?.school || '').trim()}::${String(row?.class || '').trim()}::${String(row?.name || '').trim()}`;
    const targetKey = keyOf(student);
    const withTotals = rows.map(row => ({ row, total: getHistoryTotalValue(row, totalSubjects) })).filter(item => Number.isFinite(item.total));
    if (!withTotals.length) return view;

    const createRankMap = (items) => {
        const rankMap = new Map();
        assignCompetitionRanks(items, item => item.total, (item, rank) => {
            const key = keyOf(item.row);
            if (key && !rankMap.has(key)) rankMap.set(key, rank);
        });
        return rankMap;
    };

    const townRankMap = createRankMap(withTotals);
    const schoolRankMap = createRankMap(withTotals.filter(item => String(item.row?.school || '').trim() === String(student.school || '').trim()));
    const classRankMap = createRankMap(withTotals.filter(item => String(item.row?.school || '').trim() === String(student.school || '').trim() && isClassEquivalent(item.row?.class || '', student.class || '')));

    view.ranks.total = {
        ...view.ranks.total,
        class: classRankMap.get(targetKey) ?? view.ranks.total.class ?? '-',
        school: schoolRankMap.get(targetKey) ?? view.ranks.total.school ?? '-',
        township: townRankMap.get(targetKey) ?? view.ranks.total.township ?? '-'
    };

    return view;
}

async function getHistoryComparisonData(studentName, className, schoolName) {
    const history = [];
    
    console.log('🔍 开始从云端存档获取历史数据...');
    try {
        if (typeof sbClient !== 'undefined' && sbClient) {
            let queryPrefix = 'cohort::%';
            if (window.CURRENT_COHORT_ID) {
                queryPrefix = `cohort::${window.CURRENT_COHORT_ID}::%`;
            }
            var result = await sbClient
                .from('system_data')
                .select('key, content, updated_at')
                .like('key', queryPrefix)
                .order('updated_at', { ascending: false });

            const { data, error } = result; // Extract data and error from the result object

            console.log('📡 云端存档查询结果:', { count: data?.length, error });

            if (!error && data && data.length > 0) {
                const normalizedTargetName = normalizeCompareName(studentName);
                const normalizedTargetClass = String(className || '').trim();

                for (const item of data) {
                    let raw = item.content;
                    if (typeof raw === 'string' && raw.startsWith('LZ|')) {
                        raw = LZString.decompressFromUTF16(raw.substring(3));
                    }
                    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;
                    const allStudents = Array.isArray(payload.RAW_DATA) && payload.RAW_DATA.length
                        ? payload.RAW_DATA
                        : Object.values(payload.SCHOOLS || {}).flatMap(sch => sch.students || []);
                    
                    const schools = payload.SCHOOLS || {};
                    let matchedStudent = null;
                    
                    for (const [schName, schData] of Object.entries(schools)) {
                        if (!schoolName || schName === schoolName || schName.includes(schoolName)) {
                            const students = schData.students || [];
                            matchedStudent = students.find(s => {
                                const sName = normalizeCompareName(s.name || '');
                                const sameName = sName === normalizedTargetName;
                                const sameClass = !normalizedTargetClass || isClassEquivalent(s.class || '', normalizedTargetClass);
                                return sameName && sameClass;
                            });
                            if (matchedStudent) break;
                        }
                    }
                    
                    if (matchedStudent) {
                        const normalizedStudent = buildHistorySnapshotView(matchedStudent, allStudents);
                        const examName = item.key.replace('cohort::', '考试');
                        console.log('✅ 找到匹配学生:', matchedStudent.name, '考试:', examName);
                        history.push({
                            examId: examName,
                            total: normalizedStudent.total,
                            rankClass: normalizedStudent.ranks?.total?.class,
                            rankSchool: normalizedStudent.ranks?.total?.school,
                            rankTown: normalizedStudent.ranks?.total?.township,
                            subjects: normalizedStudent.scores,
                            updatedAt: item.updated_at
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.log('云端存档获取失败:', e);
    }

    console.log('📊 当前考试数据查询: schoolName=', schoolName, 'studentName=', studentName, 'className=', className);
    if (SCHOOLS && studentName) {
        const currentStudents = Object.values(SCHOOLS).flatMap(sch => sch.students || []);
        for (const [schKey, schData] of Object.entries(SCHOOLS)) {
            const currentStu = schData.students?.find(s => 
                s.name === studentName && (!className || isClassEquivalent(s.class, className))
            );
            if (currentStu) {
                const normalizedCurrent = buildHistorySnapshotView(currentStu, currentStudents);
                console.log('✅ 找到当前学生:', currentStu.name, '学校:', schKey);
                history.push({
                    examId: '本次考试',
                    total: normalizedCurrent.total,
                    rankClass: normalizedCurrent.ranks?.total?.class,
                    rankSchool: normalizedCurrent.ranks?.total?.school,
                    rankTown: normalizedCurrent.ranks?.total?.township,
                    subjects: normalizedCurrent.scores,
                    updatedAt: new Date().toISOString(),
                    isCurrent: true
                });
                break;
            }
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

function getChangeBadge(change, type) {
    if (change === null || change === 0) return '<span style="color:#64748b;">-</span>';
    
    if (type === 'score') {
        if (change > 0) {
            return '<span style="color:#16a34a; font-weight:bold;">↑' + change.toFixed(1) + '</span>';
        } else {
            return '<span style="color:#dc2626; font-weight:bold;">↓' + Math.abs(change).toFixed(1) + '</span>';
        }
    } else {
        if (change < 0) {
            return '<span style="color:#16a34a; font-weight:bold;">↑' + Math.abs(change) + '</span>';
        } else {
            return '<span style="color:#dc2626; font-weight:bold;">↓' + change + '</span>';
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
        if (captureArea && captureArea.parentNode) {
            captureArea.parentNode.insertBefore(container, captureArea.nextSibling);
        } else {
            document.body.appendChild(container);
        }
    }

    if (!historyData || historyData.length === 0) {
        container.innerHTML = '<div class="sec-head"><h2><i class="ti ti-history"></i> 历史成绩记录</h2></div><div style="padding:30px; text-align:center; color:#64748b;"><i class="ti ti-inbox" style="font-size:48px; display:block; margin-bottom:10px;"></i>暂无历史成绩数据</div>';
        return;
    }

    const latest = historyData[historyData.length - 1];
    const previous = historyData.length >= 2 ? historyData[historyData.length - 2] : null;
    
    const totalChange = previous ? calculateChange(latest.total, previous.total) : null;
    const rankClassChange = previous && latest.rankClass && previous.rankClass ? calculateChange(latest.rankClass, previous.rankClass) : null;
    const rankSchoolChange = previous && latest.rankSchool && previous.rankSchool ? calculateChange(latest.rankSchool, previous.rankSchool) : null;
    const rankTownChange = previous && latest.rankTown && previous.rankTown ? calculateChange(latest.rankTown, previous.rankTown) : null;

    let html = '<div class="sec-head" style="padding-bottom:15px; border-bottom:1px solid #e2e8f0;"><h2 style="color:#1e293b; margin:0;"><i class="ti ti-timeline" style="color:#2563eb;"></i> 历史成绩记录与对比分析</h2></div>';
    
    html += '<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:15px; margin:20px 0;">';
    html += '<div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;"><div style="font-size:12px; color:#64748b; margin-bottom:5px;">本次总分</div><div style="font-size:28px; font-weight:bold; color:#1e293b;">' + Number(latest.total).toFixed(1) + '</div>' + (totalChange !== null ? '<div style="font-size:14px; margin-top:5px;">' + getChangeBadge(totalChange, 'score') + '</div>' : '') + '</div>';
    html += '<div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;"><div style="font-size:12px; color:#64748b; margin-bottom:5px;">班级排名</div><div style="font-size:28px; font-weight:bold; color:#3b82f6;">' + (latest.rankClass || '-') + '</div>' + (rankClassChange !== null ? '<div style="font-size:14px; margin-top:5px;">' + getChangeBadge(rankClassChange, 'rank') + '</div>' : '') + '</div>';
    html += '<div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;"><div style="font-size:12px; color:#64748b; margin-bottom:5px;">校级排名</div><div style="font-size:28px; font-weight:bold; color:#8b5cf6;">' + (latest.rankSchool || '-') + '</div>' + (rankSchoolChange !== null ? '<div style="font-size:14px; margin-top:5px;">' + getChangeBadge(rankSchoolChange, 'rank') + '</div>' : '') + '</div>';
    html += '<div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;"><div style="font-size:12px; color:#64748b; margin-bottom:5px;">镇级排名</div><div style="font-size:28px; font-weight:bold; color:#f59e0b;">' + (latest.rankTown || '-') + '</div>' + (rankTownChange !== null ? '<div style="font-size:14px; margin-top:5px;">' + getChangeBadge(rankTownChange, 'rank') + '</div>' : '') + '</div>';
    html += '</div>';

    if (historyData.length >= 2) {
        html += '<div style="margin:20px 0; background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;"><div style="font-size:15px; font-weight:bold; color:#1e293b; margin-bottom:15px;"><i class="ti ti-chart-line" style="color:#2563eb;"></i> 总分趋势图</div><div style="height:280px;"><canvas id="historyTrendChart"></canvas></div></div>';
    }

    html += '<div style="margin:20px 0; overflow-x:auto;"><table style="width:100%; border-collapse:collapse; background:white; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;"><thead><tr style="background:#f8fafc;"><th style="padding:14px 16px; text-align:left; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">考试期次</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">总分</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">班排</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">校排</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">镇排</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">总分变动</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">班排变动</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">校排变动</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">镇排变动</th></tr></thead><tbody>';
    
    historyData.forEach(function(h, idx) {
        const prev = idx > 0 ? historyData[idx - 1] : null;
        const tChange = prev ? calculateChange(h.total, prev.total) : null;
        const classChange = prev && h.rankClass && prev.rankClass ? calculateChange(h.rankClass, prev.rankClass) : null;
        const schoolChange = prev && h.rankSchool && prev.rankSchool ? calculateChange(h.rankSchool, prev.rankSchool) : null;
        const townChange = prev && h.rankTown && prev.rankTown ? calculateChange(h.rankTown, prev.rankTown) : null;
        const bgStyle = h.isCurrent ? 'background:#eff6ff;' : '';
        const fontWeight = h.isCurrent ? 'bold' : 'normal';
        const badge = h.isCurrent ? '<span style="font-size:11px; background:#3b82f6; color:white; padding:2px 8px; border-radius:10px; margin-left:8px;">本次</span>' : '';
        html += '<tr style="' + bgStyle + '"><td style="padding:14px 16px; border-bottom:1px solid #e2e8f0; font-weight:' + fontWeight + ';">' + h.examId + ' ' + badge + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0; font-weight:bold;">' + Number(h.total).toFixed(1) + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + (h.rankClass || '-') + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + (h.rankSchool || '-') + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + (h.rankTown || '-') + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + (tChange !== null ? getChangeBadge(tChange, 'score') : '-') + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + (classChange !== null ? getChangeBadge(classChange, 'rank') : '-') + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + (schoolChange !== null ? getChangeBadge(schoolChange, 'rank') : '-') + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + (townChange !== null ? getChangeBadge(townChange, 'rank') : '-') + '</td></tr>';
    });
    
    html += '</tbody></table></div>';

    if (latest.subjects && Object.keys(latest.subjects).length > 0) {
        html += '<div style="margin:20px 0; background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;"><div style="font-size:15px; font-weight:bold; color:#1e293b; margin-bottom:15px;"><i class="ti ti-list-details" style="color:#10b981;"></i> 各科成绩详情（本次）</div><div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px;">';
        Object.entries(latest.subjects).filter(function(k) { return k[0] && k[0] !== 'total'; }).forEach(function(k) {
            html += '<div style="padding:15px; background:#f8fafc; border-radius:10px; text-align:center;"><div style="font-size:12px; color:#64748b;">' + k[0] + '</div><div style="font-size:20px; font-weight:bold; color:#1e293b; margin-top:5px;">' + Number(k[1]).toFixed(1) + '</div></div>';
        });
        html += '</div></div>';
    }

    container.innerHTML = html;

    if (historyData.length >= 2) {
        setTimeout(function() {
            const ctx = document.getElementById('historyTrendChart');
            if (ctx && window.Chart) {
                new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: historyData.map(function(h) { return h.examId; }),
                        datasets: [{
                            label: '总分',
                            data: historyData.map(function(h) { return h.total; }),
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
                        plugins: { legend: { display: false } },
                        scales: {
                            y: { beginAtZero: false, grid: { color: '#f1f5f9' }, ticks: { font: { size: 12 } } },
                            x: { grid: { display: false }, ticks: { font: { size: 12 } } }
                        }
                    }
                });
            }
        }, 100);
    }
    
    console.log('✅ 历史成绩模块渲染完成!');
}

function initHistoryPatch() {
    console.log('🔄 初始化历史成绩模块...');
    
    if (typeof doQuery === 'undefined') {
        console.log('⚠️ doQuery 尚未定义，等待重试...');
        setTimeout(initHistoryPatch, 500);
        return;
    }
    
    console.log('✅ 找到 doQuery，覆盖...');
    const originalDoQuery = window.doQuery;
    
    window.doQuery = async function() {
        console.log('🎯 调用增强版 doQuery');
        
        if (originalDoQuery) originalDoQuery();
        
        setTimeout(async function() {
            const name = document.getElementById('inp-name').value;
            const sch = document.getElementById('sel-school').value;
            const cls = document.getElementById('sel-class').value;
            
            console.log('📊 获取历史成绩数据...');
            const historyResult = await getHistoryComparisonData(name, cls, sch);
            console.log('📈 历史成绩结果:', historyResult);
            renderHistoryCharts(historyResult.data, null);
        }, 500);
    };
    
    console.log('✅ 历史成绩模块初始化完成！');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHistoryPatch);
} else {
    initHistoryPatch();
}

// 测试功能已移除
