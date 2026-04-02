(() => {
    if (typeof window === 'undefined' || window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__) return;

    const teacherToNumber = typeof window.teacherToNumber === 'function'
        ? window.teacherToNumber
        : ((value, fallback = 0) => {
            const num = Number(value);
            return Number.isFinite(num) ? num : fallback;
        });
    const teacherFormatPercent = typeof window.teacherFormatPercent === 'function'
        ? window.teacherFormatPercent
        : ((value, digits = 1) => `${(teacherToNumber(value, 0) * 100).toFixed(digits)}%`);
    const teacherFormatSigned = typeof window.teacherFormatSigned === 'function'
        ? window.teacherFormatSigned
        : ((value, digits = 1) => {
            const num = teacherToNumber(value, 0);
            return `${num >= 0 ? '+' : ''}${num.toFixed(digits)}`;
        });
    const teacherEscapeHtml = typeof window.teacherEscapeHtml === 'function'
        ? window.teacherEscapeHtml
        : ((value) => String(value ?? '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            '\'': '&#39;'
        }[ch])));
    const teacherGetWeightConfig = typeof window.teacherGetWeightConfig === 'function'
        ? window.teacherGetWeightConfig
        : (() => ({ avg: 60, exc: 70, pass: 70, total: 200 }));
    const getCurrentUserFn = typeof window.getCurrentUser === 'function'
        ? window.getCurrentUser
        : (() => (window.Auth?.currentUser || null));
    const normalizeSubjectFn = typeof window.normalizeSubject === 'function'
        ? window.normalizeSubject
        : ((value) => String(value || '').trim());
    const sortSubjectsFn = typeof window.sortSubjects === 'function'
        ? window.sortSubjects
        : ((left, right) => String(left || '').localeCompare(String(right || ''), 'zh-Hans-CN'));
    const formatRankDisplayFn = typeof window.formatRankDisplay === 'function'
        ? window.formatRankDisplay
        : ((value, rank, type = 'school', isPercent = false) => {
            const displayValue = isPercent
                ? `${(teacherToNumber(value, 0) * 100).toFixed(2)}%`
                : teacherToNumber(value, 0).toFixed(2);
            return `${displayValue} <span style="font-size:0.9em; color:#94a3b8">(${rank})</span>`;
        });

    function getTeacherStats() {
        if (typeof window.getVisibleTeacherStats === 'function') return window.getVisibleTeacherStats();
        return window.TEACHER_STATS || {};
    }

    function getVisibleSubjectSet(user) {
        if (typeof window.getVisibleSubjectsForTeacherUser === 'function') {
            return window.getVisibleSubjectsForTeacherUser(user);
        }
        return null;
    }

    function calculatePerformanceLevelV2(teacherData) {
        const fairScore = teacherToNumber(teacherData?.fairScore, teacherData?.finalScore || 0);
        const baselineAdjustment = teacherToNumber(teacherData?.baselineAdjustment, 0);
        if (fairScore >= 85 && baselineAdjustment >= 0) return { class: 'performance-excellent', text: '优秀' };
        if (fairScore >= 75) return { class: 'performance-good', text: '良好' };
        if (fairScore >= 65) return { class: 'performance-average', text: '稳健' };
        return { class: 'performance-poor', text: '待改进' };
    }

    function teacherBuildCardList(stats, rankings, currentUserName = '', currentRole = 'guest') {
        const list = [];
        Object.keys(stats || {}).forEach((teacherName) => {
            Object.keys(stats[teacherName] || {}).forEach((subject) => {
                const data = stats[teacherName][subject];
                const level = calculatePerformanceLevelV2(data);
                const rank = rankings?.[teacherName]?.[subject]?.rank || '-';
                list.push({
                    id: `${teacherName}-${subject}`,
                    name: teacherName,
                    subject,
                    classes: data.classesText || data.classes || '',
                    avg: data.avg,
                    fairScore: teacherToNumber(data.fairScore, 0).toFixed(1),
                    leagueScoreRaw: teacherToNumber(data.leagueScoreRaw, 0).toFixed(1),
                    leagueScore: teacherToNumber(data.leagueScore, 0).toFixed(1),
                    baselineAdjustment: teacherFormatSigned(data.baselineAdjustment, 1),
                    baselineCoverage: data.baselineCoverageText || '0%',
                    sampleSummary: data.sampleSummary || '共同样本待识别',
                    sampleStability: data.sampleStabilityText || '0%',
                    conversionSummary: data.conversionSummary || '暂无转化样本',
                    conversionScore: teacherToNumber(data.conversionScore, 50).toFixed(1),
                    excRate: teacherFormatPercent(data.excellentRate, 1),
                    passRate: teacherFormatPercent(data.passRate, 1),
                    lowRate: teacherFormatPercent(data.lowRate, 1),
                    focusSummary: data.focusSummary || '培优0 / 临界0 / 辅差0',
                    count: data.studentCount,
                    rank,
                    badgeClass: level.class,
                    badgeText: level.text
                });
            });
        });

        const normalizedCurrent = String(currentUserName || '').replace(/\s+/g, '').toLowerCase();
        list.sort((left, right) => {
            if ((currentRole === 'teacher' || currentRole === 'class_teacher') && normalizedCurrent) {
                const leftName = String(left.name || '').replace(/\s+/g, '').toLowerCase();
                const rightName = String(right.name || '').replace(/\s+/g, '').toLowerCase();
                const leftMine = leftName === normalizedCurrent || leftName.startsWith(`${normalizedCurrent}(`) || leftName.startsWith(`${normalizedCurrent}（`);
                const rightMine = rightName === normalizedCurrent || rightName.startsWith(`${normalizedCurrent}(`) || rightName.startsWith(`${normalizedCurrent}（`);
                if (leftMine !== rightMine) return leftMine ? -1 : 1;
            }
            const fairDiff = teacherToNumber(right.fairScore, 0) - teacherToNumber(left.fairScore, 0);
            if (fairDiff !== 0) return fairDiff;
            const leagueDiff = teacherToNumber(right.leagueScore, 0) - teacherToNumber(left.leagueScore, 0);
            if (leagueDiff !== 0) return leagueDiff;
            return String(left.name || '').localeCompare(String(right.name || ''), 'zh-Hans-CN');
        });
        return list;
    }

    function renderTeacherCardsV2() {
        const container = document.getElementById('teacherCardsContainer');
        const user = getCurrentUserFn();
        const role = user?.role || 'guest';
        const stats = getTeacherStats();
        const rankings = window.TEACHER_TOWNSHIP_RANKINGS || {};
        const list = teacherBuildCardList(stats, rankings, user?.name || '', role);

        try {
            if (window.Alpine && typeof window.Alpine.store === 'function') {
                const store = window.Alpine.store('teacherData');
                if (store) store.list = list;
            }
        } catch (error) {
            console.warn('teacherData store update skipped:', error);
        }

        if (!container) return;
        if (!list.length) {
            container.innerHTML = `
                <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">
                    暂无教师数据，请先完成任课表同步和成绩导入。
                    <div style="margin-top:10px;">
                        <button class="btn btn-orange" onclick="openTeacherSync()">去同步任课表</button>
                    </div>
                </div>
            `;
            return;
        }

        container.innerHTML = list.map((item) => `
            <div class="teacher-card">
                <div class="teacher-header">
                    <div>
                        <div class="teacher-name">${teacherEscapeHtml(item.name)} - ${teacherEscapeHtml(item.subject)}</div>
                        <div class="teacher-classes">${teacherEscapeHtml(item.classes)}班</div>
                    </div>
                    <div class="performance-badge ${teacherEscapeHtml(item.badgeClass)}">${teacherEscapeHtml(item.badgeText)}</div>
                </div>
                <div class="teacher-stats">
                    <div class="stat-item">
                        <div class="stat-value">${teacherEscapeHtml(item.avg)}</div>
                        <div class="stat-label">均分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${teacherEscapeHtml(item.leagueScoreRaw)}</div>
                        <div class="stat-label">联考赋分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${teacherEscapeHtml(item.fairScore)}</div>
                        <div class="stat-label">公平绩效</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; padding:0 10px;">
                    <span>优/及/低: ${teacherEscapeHtml(item.excRate)} / ${teacherEscapeHtml(item.passRate)} / ${teacherEscapeHtml(item.lowRate)}</span>
                    <span>镇排: <strong style="color:var(--primary)">${teacherEscapeHtml(item.rank)}</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:6px; padding:0 10px;">
                    <span>基线校正 ${teacherEscapeHtml(item.baselineAdjustment)} · 覆盖 ${teacherEscapeHtml(item.baselineCoverage)}</span>
                    <span>稳定 ${teacherEscapeHtml(item.sampleStability)} · 转化 ${teacherEscapeHtml(item.conversionScore)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:14px; padding:0 10px;">
                    <span>${teacherEscapeHtml(item.sampleSummary)}</span>
                    <span>${teacherEscapeHtml(item.focusSummary)} · ${teacherEscapeHtml(item.conversionSummary)}</span>
                </div>
                <button class="view-details-btn" onclick='showTeacherDetails(${JSON.stringify(item.name)}, ${JSON.stringify(item.subject)})'>查看详情</button>
            </div>
        `).join('');
    }

    function renderTeacherTownshipRanking() {
        const user = getCurrentUserFn();
        const role = user?.role || 'guest';
        const visibleSubjectSet = (role === 'teacher' || role === 'class_teacher') ? getVisibleSubjectSet(user) : null;
        const container = document.getElementById('teacher-township-ranking-container');
        const sideNav = document.getElementById('side-nav-teacher-ranks-container');
        if (sideNav) sideNav.innerHTML = '';
        if (!container) return;
        if (!window.TOWNSHIP_RANKING_DATA || !Object.keys(window.TOWNSHIP_RANKING_DATA).length) {
            container.innerHTML = '<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';
            return;
        }

        const townshipAverages = {};
        (window.SUBJECTS || []).forEach((subject) => {
            if (visibleSubjectSet && visibleSubjectSet.size > 0 && !visibleSubjectSet.has(normalizeSubjectFn(subject))) return;
            let totalAvg = 0;
            let totalExc = 0;
            let totalPass = 0;
            let count = 0;
            Object.keys(window.SCHOOLS || {}).forEach((schoolName) => {
                const metrics = window.SCHOOLS?.[schoolName]?.metrics?.[subject];
                if (!metrics || schoolName === window.MY_SCHOOL) return;
                totalAvg += teacherToNumber(metrics.avg, 0);
                totalExc += teacherToNumber(metrics.excRate, 0);
                totalPass += teacherToNumber(metrics.passRate, 0);
                count += 1;
            });
            if (count > 0) townshipAverages[subject] = {
                avg: totalAvg / count,
                excRate: totalExc / count,
                passRate: totalPass / count
            };
        });

        let htmlAll = '';
        (window.SUBJECTS || []).forEach((subject) => {
            if (visibleSubjectSet && visibleSubjectSet.size > 0 && !visibleSubjectSet.has(normalizeSubjectFn(subject))) return;
            const rankingData = window.TOWNSHIP_RANKING_DATA?.[subject];
            if (!rankingData?.length) return;
            const townshipAvg = townshipAverages[subject] || { avg: 0, excRate: 0, passRate: 0 };
            let tbodyHtml = '';
            rankingData.forEach((item) => {
                const avgComparison = townshipAvg.avg ? ((item.avg - townshipAvg.avg) / townshipAvg.avg * 100).toFixed(2) : '0.00';
                const excComparison = townshipAvg.excRate ? ((item.excellentRate - townshipAvg.excRate) / townshipAvg.excRate * 100).toFixed(2) : '0.00';
                const passComparison = townshipAvg.passRate ? ((item.passRate - townshipAvg.passRate) / townshipAvg.passRate * 100).toFixed(2) : '0.00';
                const typeClass = item.type === 'teacher' ? 'text-blue' : '';
                const rowClass = item.type === 'teacher' ? 'analysis-row-emphasis' : '';
                const badgeClass = item.type === 'teacher'
                    ? 'analysis-row-badge analysis-row-badge-teacher'
                    : 'analysis-row-badge analysis-row-badge-school';
                const typeText = item.type === 'teacher' ? '教师' : '学校';
                tbodyHtml += `
                    <tr class="${rowClass}">
                        <td data-label="教师/学校" class="${typeClass}">${teacherEscapeHtml(item.name)}</td>
                        <td data-label="类型"><span class="${badgeClass}">${typeText}</span></td>
                        <td data-label="平均分">${formatRankDisplayFn(item.avg, item.rankAvg, 'teacher')}</td>
                        <td data-label="与镇均比" class="${teacherToNumber(avgComparison, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${teacherToNumber(avgComparison, 0) >= 0 ? '+' : ''}${avgComparison}%</td>
                        <td data-label="镇排">${teacherEscapeHtml(item.rankAvg)}</td>
                        <td data-label="优秀率">${formatRankDisplayFn(item.excellentRate, item.rankExc, 'teacher', true)}</td>
                        <td data-label="与镇均比" class="${teacherToNumber(excComparison, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${teacherToNumber(excComparison, 0) >= 0 ? '+' : ''}${excComparison}%</td>
                        <td data-label="镇排">${teacherEscapeHtml(item.rankExc)}</td>
                        <td data-label="及格率">${formatRankDisplayFn(item.passRate, item.rankPass, 'teacher', true)}</td>
                        <td data-label="与镇均比" class="${teacherToNumber(passComparison, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${teacherToNumber(passComparison, 0) >= 0 ? '+' : ''}${passComparison}%</td>
                        <td data-label="镇排">${teacherEscapeHtml(item.rankPass)}</td>
                    </tr>
                `;
            });
            const anchorId = `rank-anchor-${subject}`;
            htmlAll += `
                <div id="${anchorId}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>${teacherEscapeHtml(subject)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${teacherEscapeHtml(rankingData.length)} 条</span>
                            <span class="analysis-table-tag">含外校整体数据</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">教师与学校数据同表展示，便于对照镇均水平、乡镇排名和学科整体波动。</div>
                    <div class="table-wrap analysis-table-shell">
                        <table class="comparison-table analysis-generated-table">
                            <thead>
                                <tr>
                                    <th>教师/学校</th>
                                    <th>类型</th>
                                    <th>平均分</th>
                                    <th>与镇均比</th>
                                    <th>镇排</th>
                                    <th>优秀率</th>
                                    <th>与镇均比</th>
                                    <th>镇排</th>
                                    <th>及格率</th>
                                    <th>与镇均比</th>
                                    <th>镇排</th>
                                </tr>
                            </thead>
                            <tbody>${tbodyHtml}</tbody>
                        </table>
                    </div>
                </div>
            `;
            if (sideNav) {
                const navLink = document.createElement('a');
                navLink.className = 'side-nav-sub-link';
                navLink.innerText = subject;
                navLink.onclick = () => {
                    if (typeof window.scrollToSubAnchor === 'function') window.scrollToSubAnchor(anchorId, navLink);
                };
                sideNav.appendChild(navLink);
            }
        });

        if (!htmlAll) {
            container.innerHTML = '<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';
            return;
        }
        container.innerHTML = htmlAll;
    }

    function teacherFormatFocusList(list, emptyText = '暂无') {
        const rows = (list || []).slice(0, 8);
        if (!rows.length) return emptyText;
        return rows
            .map((row) => `${row.name}${row.className ? `(${row.className})` : ''}${Number.isFinite(row.score) ? ` ${row.score}` : ''}`)
            .join('、');
    }

    function renderTeacherComparisonTableV2() {
        const container = document.getElementById('teacherComparisonTable');
        const stats = getTeacherStats();
        if (!container) return;
        if (!Object.keys(stats).length) {
            container.innerHTML = '<p style="text-align:center; color:#666;">暂无教师统计数据</p>';
            return;
        }

        const subjectTeachers = {};
        Object.keys(stats).forEach((teacherName) => {
            Object.keys(stats[teacherName] || {}).forEach((subject) => {
                if (!subjectTeachers[subject]) subjectTeachers[subject] = [];
                subjectTeachers[subject].push({ teacher: teacherName, data: stats[teacherName][subject] });
            });
        });

        const weightConfig = teacherGetWeightConfig();
        let tableHtml = `
            <thead>
                <tr>
                    <th rowspan="2">教师</th>
                    <th rowspan="2">班级</th>
                    <th rowspan="2">实考</th>
                    <th rowspan="2">共同样本</th>
                    <th rowspan="2">样本变动</th>
                    <th rowspan="2">均分</th>
                    <th rowspan="2" title="按系统现有两率一分标准折算，同校同学科比较">联考赋分(${weightConfig.total})</th>
                    <th rowspan="2" title="按最近一次历史考试的匹配学生做超预期修正，范围约 ±20">基线校正</th>
                    <th colspan="3" style="background:#dcfce7; color:#166534;">三率指标</th>
                    <th rowspan="2">转化分</th>
                    <th rowspan="2">重点学生</th>
                    <th rowspan="2" style="background:#fef3c7; color:#92400e;">公平绩效分</th>
                </tr>
                <tr>
                    <th>优秀率</th>
                    <th>及格率</th>
                    <th>低分率</th>
                </tr>
            </thead>
            <tbody>
        `;

        Object.keys(subjectTeachers).sort(sortSubjectsFn).forEach((subject) => {
            tableHtml += `<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${teacherEscapeHtml(subject)}</td></tr>`;
            subjectTeachers[subject]
                .sort((left, right) => teacherToNumber(right.data.fairScore, 0) - teacherToNumber(left.data.fairScore, 0))
                .forEach((item) => {
                    const data = item.data;
                    const baselineClass = teacherToNumber(data.baselineAdjustment, 0) >= 0 ? 'text-green' : 'text-red';
                    const lowStyle = teacherToNumber(data.lowRate, 0) >= 0.12 ? 'color:#dc2626; font-weight:700;' : 'color:#334155;';
                    const sampleTone = data.sampleWarning ? 'color:#b45309; font-weight:700;' : 'color:#334155;';
                    const focusTitle = [
                        `培优: ${(data.focusTargets?.excellentEdges || []).slice(0, 6).map((row) => `${row.name}(${row.score})`).join('、') || '暂无'}`,
                        `临界: ${(data.focusTargets?.passEdges || []).slice(0, 6).map((row) => `${row.name}(${row.score})`).join('、') || '暂无'}`,
                        `辅差: ${(data.focusTargets?.lowRisk || []).slice(0, 6).map((row) => `${row.name}(${row.score})`).join('、') || '暂无'}`
                    ].join(' | ');
                    const baselineTitle = `基线覆盖 ${data.baselineCoverageText || '0%'}；预计均分 ${teacherToNumber(data.expectedAvg, 0).toFixed(2)}；预计优率 ${teacherFormatPercent(data.expectedExcellentRate, 1)}；预计及格率 ${teacherFormatPercent(data.expectedPassRate, 1)}；预计低分率 ${teacherFormatPercent(data.expectedLowRate, 1)}；任课连续性 ${data.teacherContinuityText || '任课连续'}${data.baselineExamId ? `；基线 ${data.baselineExamId}` : ''}`;
                    const sampleChangeText = (data.previousSampleCount || 0) > 0
                        ? `新增 ${data.addedSampleCount || 0} / 缺考退出 ${data.exitedSampleCount || 0}`
                        : '暂无基线';
                    const conversionText = `${teacherToNumber(data.conversionScore, 50).toFixed(1)}${teacherToNumber(data.conversionAdjustment, 0) ? ` (${teacherFormatSigned(data.conversionAdjustment, 1)})` : ''}`;
                    tableHtml += `
                        <tr>
                            <td><strong>${teacherEscapeHtml(item.teacher)}</strong></td>
                            <td>${teacherEscapeHtml(data.classesText || data.classes || '-')}</td>
                            <td>${teacherEscapeHtml(data.studentCount)}</td>
                            <td title="${teacherEscapeHtml(data.sampleDetailText || '')}" style="${sampleTone}">
                                <div>${teacherEscapeHtml((data.previousSampleCount || 0) > 0 ? (data.commonSampleCount || 0) : '—')}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${teacherEscapeHtml((data.previousSampleCount || 0) > 0 ? (data.sampleStabilityText || '0%') : '待历史样本')}</div>
                            </td>
                            <td title="${teacherEscapeHtml(data.sampleDetailText || '')}" style="${sampleTone}">
                                <div>${teacherEscapeHtml(sampleChangeText)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${teacherEscapeHtml(data.previousSampleCount || 0)}</div>
                            </td>
                            <td style="font-weight:700;">${teacherEscapeHtml(data.avg)}</td>
                            <td title="${teacherEscapeHtml(`均分赋分 ${teacherToNumber(data.ratedAvg, 0).toFixed(1)}，优率赋分 ${teacherToNumber(data.ratedExc, 0).toFixed(1)}，及格赋分 ${teacherToNumber(data.ratedPass, 0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${teacherToNumber(data.leagueScoreRaw, 0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${teacherToNumber(data.leagueScore, 0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${baselineClass}" title="${teacherEscapeHtml(baselineTitle)}" style="font-weight:700;">
                                <div>${teacherFormatSigned(data.baselineAdjustment, 1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${teacherEscapeHtml(data.baselineCoverageText || '0%')}</div>
                            </td>
                            <td>${teacherFormatPercent(data.excellentRate, 1)}</td>
                            <td>${teacherFormatPercent(data.passRate, 1)}</td>
                            <td style="${lowStyle}">${teacherFormatPercent(data.lowRate, 1)}</td>
                            <td title="${teacherEscapeHtml(`${data.conversionSummary || '暂无转化样本'}；${data.conversionMetrics?.detail || ''}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${conversionText}</div>
                                <div style="font-size:11px; color:#64748b;">${teacherEscapeHtml(data.conversionSummary || '暂无转化')}</div>
                            </td>
                            <td title="${teacherEscapeHtml(focusTitle)}" style="font-size:12px;">${teacherEscapeHtml(data.focusSummary || '培优0 / 临界0 / 辅差0')}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${teacherToNumber(data.fairScore, 0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${teacherEscapeHtml(data.fairRank || '-')} 名</div>
                            </td>
                        </tr>
                    `;
                });
        });

        tableHtml += '</tbody>';
        container.classList.add('comparison-table');
        container.innerHTML = tableHtml;
    }

    function showTeacherDetailsV2(teacher, subject) {
        const stats = getTeacherStats();
        const data = stats[teacher] ? stats[teacher][subject] : null;
        if (!data) {
            if (window.UI) window.UI.toast('当前筛选范围下暂无该教师该学科数据', 'warning');
            return;
        }
        const modal = document.getElementById('teacherModal');
        const table = document.getElementById('modalSubjectTable');
        const progressEl = document.getElementById('modalAvgProgress');
        if (!modal || !table || !progressEl) return;

        const nameEl = document.getElementById('modalTeacherName');
        const avgEl = document.getElementById('modalAvgScore');
        const excEl = document.getElementById('modalExcellentRate');
        const passEl = document.getElementById('modalPassRate');
        const avgCompareEl = document.getElementById('modalAvgComparison');
        if (nameEl) nameEl.textContent = `${teacher} - ${subject} 教学详情`;
        if (avgEl) avgEl.textContent = data.avg;
        if (excEl) excEl.textContent = teacherFormatPercent(data.excellentRate, 1);
        if (passEl) passEl.textContent = teacherFormatPercent(data.passRate, 1);

        const expectedAvg = teacherToNumber(data.expectedAvg, 0);
        const avgComparison = expectedAvg > 0 ? ((teacherToNumber(data.avgValue, 0) - expectedAvg) / expectedAvg) * 100 : 0;
        if (avgCompareEl) avgCompareEl.textContent = `${avgComparison >= 0 ? '+' : ''}${avgComparison.toFixed(1)}%`;
        const avgProgress = Math.min(Math.max(50 + avgComparison, 0), 100);
        progressEl.style.width = `${avgProgress}%`;
        progressEl.className = avgComparison >= 0 ? 'progress-good' : 'progress-poor';
        progressEl.style.backgroundColor = avgComparison >= 0 ? '#22c55e' : '#ef4444';

        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        if (thead) {
            thead.innerHTML = `
                <tr>
                    <th>学科</th>
                    <th>实际均分</th>
                    <th>预计均分</th>
                    <th>优秀率(实/预)</th>
                    <th>及格率(实/预)</th>
                    <th>低分率(实/预)</th>
                    <th>基线校正</th>
                </tr>
            `;
        }
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td>${teacherEscapeHtml(subject)}</td>
                    <td>${teacherToNumber(data.avgValue, 0).toFixed(2)}</td>
                    <td>${teacherToNumber(data.expectedAvg, 0).toFixed(2)}</td>
                    <td>${teacherFormatPercent(data.excellentRate, 1)} / ${teacherFormatPercent(data.expectedExcellentRate, 1)}</td>
                    <td>${teacherFormatPercent(data.passRate, 1)} / ${teacherFormatPercent(data.expectedPassRate, 1)}</td>
                    <td>${teacherFormatPercent(data.lowRate, 1)} / ${teacherFormatPercent(data.expectedLowRate, 1)}</td>
                    <td class="${teacherToNumber(data.baselineAdjustment, 0) >= 0 ? 'positive-percent' : 'negative-percent'}">${teacherFormatSigned(data.baselineAdjustment, 1)}</td>
                </tr>
            `;
        }

        let extra = document.getElementById('teacherModalExtra');
        if (!extra && table.parentNode) {
            extra = document.createElement('div');
            extra.id = 'teacherModalExtra';
            extra.style.marginBottom = '16px';
            table.parentNode.insertBefore(extra, table);
        }
        if (extra) {
            extra.innerHTML = `
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">联考赋分</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${teacherToNumber(data.leagueScoreRaw, 0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">折算 ${teacherToNumber(data.leagueScore, 0).toFixed(1)} / 100</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">基线校正</div>
                        <div style="font-size:22px; font-weight:800; color:${teacherToNumber(data.baselineAdjustment, 0) >= 0 ? '#15803d' : '#dc2626'};">${teacherFormatSigned(data.baselineAdjustment, 1)}</div>
                        <div style="font-size:12px; color:#64748b;">覆盖 ${teacherEscapeHtml(data.baselineCoverageText || '0%')}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">公平绩效分</div>
                        <div style="font-size:22px; font-weight:800; color:#b45309;">${teacherToNumber(data.fairScore, 0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">同科第 ${teacherEscapeHtml(data.fairRank || '-')} 名</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">置信 / 工作量</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${teacherToNumber(data.confidenceFactor, 1).toFixed(2)}</div>
                        <div style="font-size:12px; color:#64748b;">工作量修正 ${teacherFormatSigned(data.workloadAdjustment, 1)}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">共同样本</div>
                        <div style="font-size:22px; font-weight:800; color:${data.sampleWarning ? '#b45309' : '#0f172a'};">${teacherEscapeHtml((data.previousSampleCount || 0) > 0 ? (data.commonSampleCount || 0) : '—')}</div>
                        <div style="font-size:12px; color:#64748b;">稳定 ${teacherEscapeHtml((data.previousSampleCount || 0) > 0 ? (data.sampleStabilityText || '0%') : '待历史样本')}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">样本变动</div>
                        <div style="font-size:22px; font-weight:800; color:${data.sampleWarning ? '#b45309' : '#0f172a'};">${teacherEscapeHtml((data.previousSampleCount || 0) > 0 ? (data.sampleShiftCount || 0) : '—')}</div>
                        <div style="font-size:12px; color:#64748b;">${teacherEscapeHtml((data.previousSampleCount || 0) > 0 ? `新增 ${data.addedSampleCount || 0} · 缺考退出 ${data.exitedSampleCount || 0}` : '暂无基线样本')}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">转化分</div>
                        <div style="font-size:22px; font-weight:800; color:#0369a1;">${teacherToNumber(data.conversionScore, 50).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">${teacherEscapeHtml(data.conversionSummary || '暂无转化样本')}${teacherToNumber(data.conversionAdjustment, 0) ? ` · 调整 ${teacherFormatSigned(data.conversionAdjustment, 1)}` : ''}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">换老师保护</div>
                        <div style="font-size:22px; font-weight:800; color:${data.teacherChangeProtected ? '#b45309' : '#0f172a'};">${teacherEscapeHtml(data.teacherChangeProtected ? '已冻结' : '正常')}</div>
                        <div style="font-size:12px; color:#64748b;">${teacherEscapeHtml(data.teacherContinuityText || '任课连续')}</div>
                    </div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px; background:#f8fafc;">
                    <div style="font-size:13px; font-weight:700; color:#334155; margin-bottom:10px;">培优 / 辅差名单</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                        <div>
                            <div style="font-size:12px; color:#0f766e; font-weight:700; margin-bottom:4px;">培优边缘生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${teacherEscapeHtml(teacherFormatFocusList(data.focusTargets?.excellentEdges, '暂无培优边缘生'))}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:#1d4ed8; font-weight:700; margin-bottom:4px;">及格临界生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${teacherEscapeHtml(teacherFormatFocusList(data.focusTargets?.passEdges, '暂无及格临界生'))}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:#b45309; font-weight:700; margin-bottom:4px;">辅差关注生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${teacherEscapeHtml(teacherFormatFocusList(data.focusTargets?.lowRisk, '暂无辅差关注生'))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${teacherEscapeHtml(data.sampleDetailText || '')}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${teacherEscapeHtml(data.conversionMetrics?.detail || '')}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${teacherEscapeHtml(data.baselineExamId ? `历史基线：${data.baselineExamId}` : '未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。')}</div>
                </div>
            `;
        }

        modal.style.display = 'flex';
    }

    function exportTeacherComparisonExcelV2() {
        const user = getCurrentUserFn();
        const role = user?.role || 'guest';
        const exportStats = (role === 'teacher' || role === 'class_teacher') ? getTeacherStats() : (window.TEACHER_STATS || {});
        if (!Object.keys(exportStats).length) {
            alert('请先进行教师分析');
            return;
        }

        const subjectSet = new Set();
        Object.values(exportStats).forEach((subjectMap) => Object.keys(subjectMap || {}).forEach((subject) => subjectSet.add(subject)));
        const workbook = window.XLSX.utils.book_new();
        const weightConfig = teacherGetWeightConfig();
        const rowsBySubject = {};

        Object.keys(exportStats).forEach((teacherName) => {
            Object.keys(exportStats[teacherName] || {}).forEach((subject) => {
                if (!rowsBySubject[subject]) rowsBySubject[subject] = [];
                rowsBySubject[subject].push({ teacherName, data: exportStats[teacherName][subject] });
            });
        });

        Object.keys(rowsBySubject).sort(sortSubjectsFn).forEach((subject) => {
            const rows = rowsBySubject[subject].sort((left, right) => teacherToNumber(right.data.fairScore, 0) - teacherToNumber(left.data.fairScore, 0));
            const wsData = [[
                '教师姓名', '学科', '任教班级', '人数', '均分',
                `联考赋分(${weightConfig.total})`, '联考赋分(折算100)', '基线校正', '基线覆盖',
                '上次样本', '共同样本', '新增样本', '缺考/退出', '样本稳定度',
                '任课连续性', '转化分', '转化调整',
                '预计均分', '优秀率', '预计优秀率', '及格率', '预计及格率', '低分率', '预计低分率',
                '工作量修正', '置信系数', '公平绩效分', '同科排名',
                '培优边缘生', '及格临界生', '辅差关注生'
            ]];
            rows.forEach(({ teacherName, data }) => {
                wsData.push([
                    teacherName,
                    subject,
                    data.classesText || data.classes || '',
                    data.studentCount,
                    window.getExcelNum(teacherToNumber(data.avgValue, 0)),
                    window.getExcelNum(teacherToNumber(data.leagueScoreRaw, 0)),
                    window.getExcelNum(teacherToNumber(data.leagueScore, 0)),
                    window.getExcelNum(teacherToNumber(data.baselineAdjustment, 0)),
                    data.baselineCoverageText || '0%',
                    data.previousSampleCount || 0,
                    data.commonSampleCount || 0,
                    data.addedSampleCount || 0,
                    data.exitedSampleCount || 0,
                    data.sampleStabilityText || '0%',
                    data.teacherContinuityText || '',
                    window.getExcelNum(teacherToNumber(data.conversionScore, 50)),
                    window.getExcelNum(teacherToNumber(data.conversionAdjustment, 0)),
                    window.getExcelNum(teacherToNumber(data.expectedAvg, 0)),
                    window.getExcelPercent(teacherToNumber(data.excellentRate, 0)),
                    window.getExcelPercent(teacherToNumber(data.expectedExcellentRate, 0)),
                    window.getExcelPercent(teacherToNumber(data.passRate, 0)),
                    window.getExcelPercent(teacherToNumber(data.expectedPassRate, 0)),
                    window.getExcelPercent(teacherToNumber(data.lowRate, 0)),
                    window.getExcelPercent(teacherToNumber(data.expectedLowRate, 0)),
                    window.getExcelNum(teacherToNumber(data.workloadAdjustment, 0)),
                    window.getExcelNum(teacherToNumber(data.confidenceFactor, 1)),
                    window.getExcelNum(teacherToNumber(data.fairScore, 0)),
                    data.fairRank || '',
                    teacherFormatFocusList(data.focusTargets?.excellentEdges, ''),
                    teacherFormatFocusList(data.focusTargets?.passEdges, ''),
                    teacherFormatFocusList(data.focusTargets?.lowRisk, '')
                ]);
            });
            const sheetName = typeof window.buildSafeSheetName === 'function'
                ? window.buildSafeSheetName(subject, '公平绩效')
                : String(subject || 'Sheet').slice(0, 31);
            window.XLSX.utils.book_append_sheet(workbook, window.XLSX.utils.aoa_to_sheet(wsData), sheetName);
        });

        const exportTag = typeof window.buildTeacherExportTag === 'function'
            ? window.buildTeacherExportTag(user, subjectSet)
            : new Date().toISOString().slice(0, 10);
        window.XLSX.writeFile(workbook, `教师公平绩效明细_${exportTag}.xlsx`);
    }

    if (!window.__TEACHER_ANALYSIS_MODAL_BOUND__) {
        const closeButton = document.getElementById('closeModal');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                const modal = document.getElementById('teacherModal');
                if (modal) modal.style.display = 'none';
            });
        }
        window.addEventListener('click', (event) => {
            const modal = document.getElementById('teacherModal');
            if (modal && event.target === modal) modal.style.display = 'none';
        });
        window.__TEACHER_ANALYSIS_MODAL_BOUND__ = true;
    }

    Object.assign(window, {
        renderTeacherTownshipRanking,
        teacherBuildCardList,
        teacherFormatFocusList,
        renderTeacherCards: renderTeacherCardsV2,
        renderTeacherCardsV2,
        calculatePerformanceLevel: calculatePerformanceLevelV2,
        calculatePerformanceLevelV2,
        renderTeacherComparisonTable: renderTeacherComparisonTableV2,
        renderTeacherComparisonTableV2,
        showTeacherDetails: showTeacherDetailsV2,
        showTeacherDetailsV2,
        exportTeacherComparisonExcel: exportTeacherComparisonExcelV2,
        exportTeacherComparisonExcelV2
    });

    window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__ = true;
})();
