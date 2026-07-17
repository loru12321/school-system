// ====== 历史成绩对比功能代码 ======

function debugHistoryCompare() {
    if (window.DEBUG_HISTORY_COMPARE && window.console && typeof window.console.debug === 'function') {
        window.console.debug.apply(window.console, arguments);
    }
}

function escapeHistoryHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, function (char) {
        return {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char];
    });
}

function formatHistoryNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric.toFixed(1) : '-';
}

function formatHistoryRank(value) {
    const text = String(value ?? '').trim();
    return text ? escapeHistoryHtml(text) : '-';
}

debugHistoryCompare('历史成绩模块加载中...');

function normalizeCompareName(name) {
    return String(name || '').trim().replace(/\s+/g, '');
}

function isClassEquivalent(cls1, cls2) {
    if (!cls1 || !cls2) return true;
    const c1 = String(cls1).trim().replace(/[^0-9]/g, '');
    const c2 = String(cls2).trim().replace(/[^0-9]/g, '');
    return c1 === c2 || c1.replace(/0/g, '') === c2.replace(/0/g, '');
}

function getHistoryCompareCurrentExamId() {
    if (typeof getEffectiveCurrentExamId === 'function') return String(getEffectiveCurrentExamId() || '').trim();
    return String(window.CURRENT_EXAM_ID || '').trim();
}

function isHistoryCompareCurrentExam(entry) {
    const currentExamId = getHistoryCompareCurrentExamId();
    const entryExamId = String(entry?.examFullKey || entry?.examId || entry?._sourceExam || '').trim();
    if (!currentExamId || !entryExamId) return false;
    if (typeof examKeyEq === 'function') return examKeyEq(entryExamId, currentExamId);
    return entryExamId === currentExamId;
}

function getHistoryCompareTimestamp(entry) {
    const value = entry?.updatedAt || entry?.createdAt || entry?.student?.updatedAt || 0;
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 0) return numeric;
    const date = new Date(value).getTime();
    return Number.isFinite(date) ? date : 0;
}

function getLocalHistoryComparisonEntries(student) {
    if (!student || typeof getStudentExamHistory !== 'function') return [];
    try {
        return getStudentExamHistory(student)
            // CohortDB entries carry a nested student.  Do not treat a stale
            // PREV_DATA row as local cohort history.
            .filter(entry => entry?.student && !isHistoryCompareCurrentExam(entry))
            .map(entry => {
                const historyStudent = entry.student || {};
                const ranks = historyStudent.ranks || {};
                return {
                    examId: entry.examLabel || entry.examFullKey || entry.examId || '历史考试',
                    total: Number(historyStudent.total) || 0,
                    rankClass: ranks.total?.class ?? historyStudent.rankClass ?? '-',
                    rankSchool: ranks.total?.school ?? historyStudent.rankSchool ?? '-',
                    rankTown: ranks.total?.township ?? historyStudent.rankTown ?? '-',
                    subjects: historyStudent.scores || {},
                    updatedAt: getHistoryCompareTimestamp(entry),
                    source: 'cohort-db'
                };
            })
            .filter(entry => entry.examId && (entry.total || Object.keys(entry.subjects).length > 0))
            .sort((left, right) => getHistoryCompareTimestamp(left) - getHistoryCompareTimestamp(right));
    } catch (error) {
        console.warn('[history-compare] local cohort history lookup failed:', error);
        return [];
    }
}

function mapCloudHistoryToPreviousData(student, historyRows = []) {
    return (Array.isArray(historyRows) ? historyRows : []).map(history => ({
        name: student.name,
        class: student.class,
        school: student.school || '',
        total: Number(history.total) || 0,
        classRank: history.rankClass || '-',
        schoolRank: history.rankSchool || '-',
        townRank: history.rankTown || '-',
        scores: history.scores || {},
        ranks: {
            total: {
                class: history.rankClass || '-',
                school: history.rankSchool || '-',
                township: history.rankTown || '-'
            }
        },
        _sourceExam: history.examFullKey || history.examId || '',
        updatedAt: history.updatedAt || history.createdAt || 0
    }));
}

function mapCloudHistoryComparisonEntries(historyRows = []) {
    return (Array.isArray(historyRows) ? historyRows : [])
        .filter(entry => !isHistoryCompareCurrentExam(entry))
        .map(entry => ({
            examId: entry.examLabel || entry.examFullKey || entry.examId || '历史考试',
            total: Number(entry.total) || 0,
            rankClass: entry.rankClass ?? entry.ranks?.total?.class ?? '-',
            rankSchool: entry.rankSchool ?? entry.ranks?.total?.school ?? '-',
            rankTown: entry.rankTown ?? entry.ranks?.total?.township ?? '-',
            subjects: entry.scores || {},
            updatedAt: getHistoryCompareTimestamp(entry),
            source: 'cloud-history'
        }))
        .filter(entry => entry.examId && (entry.total || Object.keys(entry.subjects).length > 0))
        .sort((left, right) => getHistoryCompareTimestamp(left) - getHistoryCompareTimestamp(right));
}

function buildHistoryComparisonResult(student, historyEntries = []) {
    const history = Array.isArray(historyEntries) ? historyEntries.slice() : [];
    if (student) {
        history.push({
            examId: '本次考试',
            total: Number(student.total) || 0,
            rankClass: student.ranks?.total?.class ?? student.rankClass ?? '-',
            rankSchool: student.ranks?.total?.school ?? student.rankSchool ?? '-',
            rankTown: student.ranks?.total?.township ?? student.rankTown ?? '-',
            subjects: student.scores || {},
            updatedAt: Date.now(),
            isCurrent: true
        });
    }
    history.sort((left, right) => getHistoryCompareTimestamp(left) - getHistoryCompareTimestamp(right));
    return history.length > 0
        ? { success: true, data: history }
        : { success: false, message: '暂无历史成绩数据' };
}

async function getHistoryComparisonData(studentName, className, schoolName) {
    const history = [];

    // 尝试从云端存档获取历史数据
    debugHistoryCompare('开始从云端存档获取历史数据...');
    try {
        if (sbClient) {
            // ✅ 修复：实际存储 key 格式为 `{cohortId}级_{...}`，而非 `cohort::` 前缀
            const cohortId = window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID');
            let queryPrefix = '%';
            if (cohortId) {
                queryPrefix = `${cohortId}级_%`;
            }

            const { data, error } = await sbClient
                .from('system_data')
                .select('key, content, updated_at')
                .like('key', queryPrefix)
                .not('key', 'like', 'TEACHERS_%')
                .not('key', 'like', 'STUDENT_COMPARE_%')
                .order('updated_at', { ascending: true });

            debugHistoryCompare(`云端存档查询结果 (${queryPrefix}):`, { count: data?.length, error });

            if (data && data.length > 0) {
                const normalizedTargetName = normalizeCompareName(studentName);
                const normalizedTargetClass = String(className || '').trim();

                for (const item of data) {
                    let raw = item.content;
                    if (typeof raw === 'string' && raw.startsWith('LZ|')) {
                        raw = LZString.decompressFromUTF16(raw.substring(3));
                    }
                    const payload = typeof raw === 'string' ? JSON.parse(raw) : raw;

                    // 从存档中获取学生数据
                    const schools = payload.SCHOOLS || {};
                    let matchedStudent = null;
                    let matchedSchool = null;

                    for (const [schName, schData] of Object.entries(schools)) {
                        if (!schoolName || schName === schoolName || schName.includes(schoolName)) {
                            const students = schData.students || [];
                            matchedStudent = students.find(s => {
                                const sName = normalizeCompareName(s.name || '');
                                const sameName = sName === normalizedTargetName;
                                const sameClass = !normalizedTargetClass || isClassEquivalent(s.class || '', normalizedTargetClass);
                                return sameName && sameClass;
                            });
                            if (matchedStudent) {
                                matchedSchool = schName;
                                break;
                            }
                        }
                    }
                    // 如果 SCHOOLS 中未找到，尝试直接从 RAW_DATA 中查找
                    if (!matchedStudent) {
                        const stuList = payload.RAW_DATA || payload.students || [];
                        matchedStudent = stuList.find(s => {
                            const sName = normalizeCompareName(s.name || '');
                            const sameName = sName === normalizedTargetName;
                            const sameClass = !normalizedTargetClass || isClassEquivalent(s.class || '', normalizedTargetClass);
                            return sameName && sameClass;
                        });
                    }

                    if (matchedStudent) {
                        // ✅ 修复：从实际 key 格式提取考试名称
                        const keyParts = item.key.split('_');
                        const examName = keyParts.length >= 5 ? keyParts.slice(4).join('_') : item.key;

                        debugHistoryCompare('找到匹配学生:', matchedStudent.name, '考试:', examName);

                        history.push({
                            examId: examName,
                            total: matchedStudent.total,
                            rankClass: matchedStudent.ranks?.total?.class,
                            rankSchool: matchedStudent.ranks?.total?.school,
                            rankTown: matchedStudent.ranks?.total?.township,
                            subjects: matchedStudent.scores,
                            updatedAt: item.updated_at
                        });
                    }
                }
            }
        }
    } catch (e) {
        console.warn('[history-compare] cloud archive lookup failed:', e);
    }

    // 尝试从本地历史数据获取
    try {
        if (window.PREV_DATA && window.PREV_DATA.length > 0) {
            const cleanStr = (str) => String(str || '').trim().replace(/\s+/g, '');
            const normalizeClass = (cls) => String(cls || '').trim().replace(/[班级\(\)\.\-gradeclass]/gi, '');

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
        console.warn('[history-compare] local history lookup failed:', e);
    }

    // 添加当前考试数据
    debugHistoryCompare('当前考试数据查询:', { schoolName, studentName, className });
    if (SCHOOLS && studentName) {
        // 遍历所有学校查找学生
        for (const [schKey, schData] of Object.entries(SCHOOLS)) {
            const currentStu = schData.students?.find(s =>
                s.name === studentName && (!className || isClassEquivalent(s.class, className))
            );
            if (currentStu) {
                debugHistoryCompare('找到当前学生:', currentStu.name, '学校:', schKey);
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
    if (window.historyTrendChartInstance && typeof window.historyTrendChartInstance.destroy === 'function') {
        window.historyTrendChartInstance.destroy();
        window.historyTrendChartInstance = null;
    }

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
    const rankSchoolChange = previous && latest.rankSchool && previous.rankSchool ? calculateChange(latest.rankSchool, previous.rankSchool) : null;
    const rankTownChange = previous && latest.rankTown && previous.rankTown ? calculateChange(latest.rankTown, previous.rankTown) : null;

    let html = '<div class="sec-head" style="padding-bottom:15px; border-bottom:1px solid #e2e8f0;"><h2 style="color:#1e293b; margin:0;"><i class="ti ti-timeline" style="color:#2563eb;"></i> 历史成绩记录与对比分析</h2></div>';

    html += '<div style="display:grid; grid-template-columns:repeat(4,1fr); gap:15px; margin:20px 0;">';
    html += '<div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;"><div style="font-size:12px; color:#64748b; margin-bottom:5px;">本次总分</div><div style="font-size:28px; font-weight:bold; color:#1e293b;">' + formatHistoryNumber(latest.total) + '</div>' + (totalChange !== null ? '<div style="font-size:14px; margin-top:5px;">' + getChangeBadge(totalChange, 'score') + '</div>' : '') + '</div>';
    html += '<div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;"><div style="font-size:12px; color:#64748b; margin-bottom:5px;">班级排名</div><div style="font-size:28px; font-weight:bold; color:#3b82f6;">' + formatHistoryRank(latest.rankClass) + '</div></div>';
    html += '<div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;"><div style="font-size:12px; color:#64748b; margin-bottom:5px;">校级排名</div><div style="font-size:28px; font-weight:bold; color:#8b5cf6;">' + formatHistoryRank(latest.rankSchool) + '</div>' + (rankSchoolChange !== null ? '<div style="font-size:14px; margin-top:5px;">' + getChangeBadge(rankSchoolChange, 'rank') + '</div>' : '') + '</div>';
    html += '<div style="background:white; padding:20px; border-radius:12px; text-align:center; border:1px solid #e2e8f0;"><div style="font-size:12px; color:#64748b; margin-bottom:5px;">镇级排名</div><div style="font-size:28px; font-weight:bold; color:#f59e0b;">' + formatHistoryRank(latest.rankTown) + '</div>' + (rankTownChange !== null ? '<div style="font-size:14px; margin-top:5px;">' + getChangeBadge(rankTownChange, 'rank') + '</div>' : '') + '</div>';
    html += '</div>';

    if (historyData.length >= 2) {
        html += '<div style="margin:20px 0; background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;"><div style="font-size:15px; font-weight:bold; color:#1e293b; margin-bottom:15px;"><i class="ti ti-chart-line" style="color:#2563eb;"></i> 总分趋势图</div><div style="height:280px;"><canvas id="historyTrendChart"></canvas></div></div>';
    }

    html += '<div style="margin:20px 0; overflow-x:auto;"><table style="width:100%; border-collapse:collapse; background:white; border-radius:12px; overflow:hidden; border:1px solid #e2e8f0;"><thead><tr style="background:#f8fafc;"><th style="padding:14px 16px; text-align:left; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">考试期次</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">总分</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">班排</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">校排</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">镇排</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">总分变动</th><th style="padding:14px 16px; text-align:center; font-size:13px; font-weight:600; color:#475569; border-bottom:1px solid #e2e8f0;">校排变动</th></tr></thead><tbody>';

    historyData.forEach(function (h, idx) {
        const prev = idx > 0 ? historyData[idx - 1] : null;
        const tChange = prev ? calculateChange(h.total, prev.total) : null;
        const rChange = prev && h.rankSchool && prev.rankSchool ? calculateChange(h.rankSchool, prev.rankSchool) : null;
        const bgStyle = h.isCurrent ? 'background:#eff6ff;' : '';
        const fontWeight = h.isCurrent ? 'bold' : 'normal';
        const badge = h.isCurrent ? '<span style="font-size:11px; background:#3b82f6; color:white; padding:2px 8px; border-radius:10px; margin-left:8px;">本次</span>' : '';
        html += '<tr style="' + bgStyle + '"><td style="padding:14px 16px; border-bottom:1px solid #e2e8f0; font-weight:' + fontWeight + ';">' + escapeHistoryHtml(h.examId) + ' ' + badge + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0; font-weight:bold;">' + formatHistoryNumber(h.total) + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + formatHistoryRank(h.rankClass) + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + formatHistoryRank(h.rankSchool) + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + formatHistoryRank(h.rankTown) + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + (tChange !== null ? getChangeBadge(tChange, 'score') : '-') + '</td><td style="padding:14px 16px; text-align:center; border-bottom:1px solid #e2e8f0;">' + (rChange !== null ? getChangeBadge(rChange, 'rank') : '-') + '</td></tr>';
    });

    html += '</tbody></table></div>';

    if (latest.subjects && Object.keys(latest.subjects).length > 0) {
        html += '<div style="margin:20px 0; background:white; padding:20px; border-radius:12px; border:1px solid #e2e8f0;"><div style="font-size:15px; font-weight:bold; color:#1e293b; margin-bottom:15px;"><i class="ti ti-list-details" style="color:#10b981;"></i> 各科成绩详情（本次）</div><div style="display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:12px;">';
        Object.entries(latest.subjects).filter(function (k) { return k[0] && k[0] !== 'total'; }).forEach(function (k) {
            html += '<div style="padding:15px; background:#f8fafc; border-radius:10px; text-align:center;"><div style="font-size:12px; color:#64748b;">' + escapeHistoryHtml(k[0]) + '</div><div style="font-size:20px; font-weight:bold; color:#1e293b; margin-top:5px;">' + formatHistoryNumber(k[1]) + '</div></div>';
        });
        html += '</div></div>';
    }

    container.innerHTML = html;

    if (historyData.length >= 2) {
        setTimeout(function () {
            const ctx = document.getElementById('historyTrendChart');
            if (ctx && window.Chart) {
                if (window.historyTrendChartInstance && typeof window.historyTrendChartInstance.destroy === 'function') {
                    window.historyTrendChartInstance.destroy();
                    window.historyTrendChartInstance = null;
                }
                if (typeof Chart.getChart === 'function') {
                    const chartInRegistry = Chart.getChart(ctx);
                    if (chartInRegistry) chartInRegistry.destroy();
                }
                window.historyTrendChartInstance = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: historyData.map(function (h) { return h.examId; }),
                        datasets: [{
                            label: '总分',
                            data: historyData.map(function (h) { return h.total; }),
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

    debugHistoryCompare('历史成绩模块渲染完成');
}

function initHistoryComparePatch() {
    debugHistoryCompare('初始化历史成绩模块');

    const patchDoQuery = async function () {
        debugHistoryCompare('调用增强版 doQuery');

        const name = document.getElementById('inp-name').value;
        const sch = document.getElementById('sel-school').value;
        const cls = document.getElementById('sel-class').value;

        let stu = SCHOOLS[sch]?.students.find(function (s) { return s.name === name && (cls === '--请先选择学校--' || s.class === cls); });
        if (!stu) return window.UI.alert('未找到该学生');

        const localHistory = getLocalHistoryComparisonEntries(stu);
        let historyResult = localHistory.length > 0
            ? buildHistoryComparisonResult(stu, localHistory)
            : null;

        if (!historyResult && window.CloudManager && window.CloudManager.check()) {
            if (window.UI) UI.toast('🔍 正在同步云端历史数据...', 'info');
            try {
                const historyRes = await window.CloudManager.fetchStudentExamHistory(stu);
                if (historyRes.success && historyRes.data.length > 0) {
                    const prevRecords = mapCloudHistoryToPreviousData(stu, historyRes.data)
                        .filter(entry => !isHistoryCompareCurrentExam(entry));
                    if (prevRecords.length > 0) window.PREV_DATA = prevRecords;
                    const cloudHistory = mapCloudHistoryComparisonEntries(historyRes.data);
                    if (cloudHistory.length > 0) {
                        historyResult = buildHistoryComparisonResult(stu, cloudHistory);
                        if (window.UI) UI.toast(`✅ 已自动匹配 ${cloudHistory.length} 次历史成绩`, 'success');
                    }
                }
            } catch (e) {
                console.warn('[doQuery] 云端历史获取失败:', e);
            }
        }

        clearCloudStudentCompareContext();
        setCloudCompareTarget(stu);
        if (typeof window.setCurrentReportStudentState === 'function') window.setCurrentReportStudentState(stu);
        else window.CURRENT_REPORT_STUDENT = stu;

        if (typeof window.ensureReportRenderRuntimeLoaded === 'function') {
            try {
                await window.ensureReportRenderRuntimeLoaded();
            } catch (error) {
                console.error('Failed to load report render runtime before history compare query:', error);
                window.UI.alert('报告渲染模块加载失败，请刷新后重试。');
                return;
            }
        }

        document.getElementById('single-report-result').classList.remove('hidden');
        const container = document.getElementById('report-card-capture-area');
        container.classList.add('student-report-canvas-full');
        const reportHtml = await Promise.resolve(renderSingleReportCardHTML(stu, 'FULL'));
        container.innerHTML = typeof reportHtml === 'string' ? reportHtml : '';
        setTimeout(function () { renderRadarChart(stu); renderVarianceChart(stu); }, 100);
        analyzeStrengthsAndWeaknesses(stu);

        const compareSection = document.getElementById('student-multi-period-compare-section');
        if (compareSection) {
            compareSection.style.display = 'none';
        }

        setTimeout(() => {
            const reportElement = document.getElementById('single-report-result');
            if (reportElement) {
                reportElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 200);

        debugHistoryCompare('获取历史成绩数据');
        if (!historyResult) {
            historyResult = await getHistoryComparisonData(stu.name, stu.class, stu.school);
        }
        debugHistoryCompare('历史成绩结果:', historyResult);
        renderHistoryCharts(historyResult.data, stu);
    };

    window.doQuery = patchDoQuery;
    debugHistoryCompare('历史成绩模块初始化完成');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHistoryComparePatch);
} else {
    initHistoryComparePatch();
}

// ====== 历史成绩对比功能代码结束 ======
