(() => {
    if (typeof window === 'undefined' || window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__) return;

function analyzeTeachers() {
    const resolveRowsForTeacherAnalysis = () => {
        if (Array.isArray(RAW_DATA) && RAW_DATA.length > 0) return RAW_DATA;
        const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
        if (!db?.exams) return [];
        const currentId = CURRENT_EXAM_ID || db.currentExamId || '';
        let exam = currentId ? db.exams[currentId] : null;
        if (!exam) {
            const list = Object.values(db.exams).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
            exam = list[0] || null;
        }
        return Array.isArray(exam?.data) ? exam.data : [];
    };

    const rows = resolveRowsForTeacherAnalysis();
    const schools = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare() : Object.keys(SCHOOLS || {});
    let inferredSchool = (typeof inferDefaultSchoolFromContext === 'function') ? inferDefaultSchoolFromContext() : '';
    const scopedUser = getCurrentUser();
    const accessibleSchools = (window.PermissionPolicy && typeof PermissionPolicy.getAccessibleSchoolNames === 'function')
        ? PermissionPolicy.getAccessibleSchoolNames(scopedUser, schools)
        : schools.slice();
    let activeSchool = syncTeacherAnalysisSchoolContext(
        document.getElementById('mySchoolSelect')?.value
        || MY_SCHOOL
        || localStorage.getItem('MY_SCHOOL')
        || inferredSchool
    );

    // --- 🟢 Fix Teacher School Detection ---
    const user = getCurrentUser();
    // 如果是教师角色，强制推断任教学校
    if (user && user.role === 'teacher') {
        const userNameNorm = String(user.name || '').replace(/\s+/g, '').toLowerCase();
        let targetSchool = activeSchool;
        let foundMatch = false;

        // Iterate map to find school
        const c_map = (typeof getClassSchoolMapForAllData === 'function') ? getClassSchoolMapForAllData() : {};

        const tMap = window.TEACHER_MAP || {};
        for (const [key, tName] of Object.entries(tMap)) {
            const tNameNorm = String(tName).replace(/\s+/g, '').toLowerCase();
            // Match normalized name OR name with suffix
            if (tNameNorm === userNameNorm || tNameNorm.startsWith(userNameNorm + '(') || tNameNorm.startsWith(userNameNorm + '（')) {
                foundMatch = true;

                if (window.TEACHER_SCHOOL_MAP && window.TEACHER_SCHOOL_MAP[key]) {
                    targetSchool = window.TEACHER_SCHOOL_MAP[key];
                    break;
                }

                const [rawCls] = key.split('_');
                const cls = normalizeClass(rawCls);
                if (c_map[cls]) {
                    targetSchool = c_map[cls];
                    break;
                }
            }
        }

        // Update activeSchool if detected differently
        if (targetSchool && targetSchool !== activeSchool) {
            console.log(`[TeacherAnalysis] Auto-switching teacher school to: ${targetSchool}`);
            activeSchool = targetSchool;
            MY_SCHOOL = targetSchool;
            window.MY_SCHOOL = targetSchool;
            localStorage.setItem('MY_SCHOOL', targetSchool);
        }
    }
    // ----------------------------------------


    if (activeSchool && accessibleSchools.length && !accessibleSchools.includes(activeSchool)) activeSchool = '';
    if (!activeSchool && accessibleSchools.length === 1) activeSchool = syncTeacherAnalysisSchoolContext(accessibleSchools[0]);
    if (!activeSchool) {
        const firstFromRows = rows.find(r => accessibleSchools.includes(String(r?.school || '').trim()));
        if (firstFromRows) activeSchool = syncTeacherAnalysisSchoolContext(String(firstFromRows.school).trim());
    }

    if (!activeSchool) { alert('请先选择本校'); return; }
    syncTeacherAnalysisSchoolContext(activeSchool);

    if (window.DataManager && typeof DataManager.ensureTeacherMap === 'function') {
        const ok = DataManager.ensureTeacherMap(true);
        if (!ok) {
            if (window.UI) UI.toast('请先同步教师任课表后再分析', 'warning');
            return;
        }
    }
    TEACHER_STATS = {};
    const classSchoolMap = (typeof getClassSchoolMapForAllData === 'function') ? getClassSchoolMapForAllData() : {};
    const normalizedRows = rows.map(s => ({
        ...s,
        school: String(s?.school || '').trim(),
        class: normalizeClass(s?.class),
        scores: s?.scores || {}
    }));

    const teacherClassSet = new Set(Object.keys(TEACHER_MAP || {}).map(key => normalizeClass(String(key).split('_')[0])).filter(Boolean));
    let mySchoolStudents = normalizedRows.filter(s => s.school === activeSchool);
    if (!mySchoolStudents.length) {
        mySchoolStudents = normalizedRows.filter(s => {
            const cls = normalizeClass(s.class);
            if (!cls || !teacherClassSet.has(cls)) return false;
            const mappedSchool = classSchoolMap[cls];
            return mappedSchool === activeSchool;
        });
    }
    const queryMode = window.PermissionPolicy && PermissionPolicy.isClassTeacher(user) ? 'homeroom' : 'teaching';
    if (window.PermissionPolicy && typeof PermissionPolicy.filterStudentRows === 'function') {
        mySchoolStudents = PermissionPolicy.filterStudentRows(user, mySchoolStudents, { mode: queryMode });
    }
    if (!mySchoolStudents.length) return;

    const subjectList = (SUBJECTS && SUBJECTS.length)
        ? SUBJECTS
        : [...new Set(mySchoolStudents.flatMap(s => Object.keys(s.scores || {})).map(normalizeSubject))];

    // 1. 预计算年级基准
    const gradeStats = {};
    subjectList.forEach(sub => {
        const scores = mySchoolStudents.map(s => parseFloat(s.scores?.[sub])).filter(v => !isNaN(v));
        if (scores.length > 0) {
            const sum = scores.reduce((a, b) => a + b, 0);
            const avg = sum / scores.length;
            const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;

            gradeStats[sub] = {
                avg: avg,
                sd: Math.sqrt(variance),
                exc: THRESHOLDS[sub]?.exc || 0,
                pass: THRESHOLDS[sub]?.pass || 0,
                low: (THRESHOLDS[sub]?.pass || 60) * 0.6
            };
        }
    });

    // 2. 归集教师数据
    Object.entries(TEACHER_MAP).forEach(([key, teacherName]) => {
        const [rawClass, rawSubject] = key.split('_');
        const className = normalizeClass(rawClass);
        const subject = normalizeSubject(rawSubject);
        if (!subjectList.includes(subject)) {
            const matched = subjectList.find(s => normalizeSubject(s) === subject);
            if (!matched) return;
        }

        if (!TEACHER_STATS[teacherName]) TEACHER_STATS[teacherName] = {};
        const useSubject = subjectList.find(s => normalizeSubject(s) === subject) || subject;
        if (!TEACHER_STATS[teacherName][useSubject]) {
            TEACHER_STATS[teacherName][useSubject] = {
                classes: [], students: []
            };
        }

        const teacherStudents = mySchoolStudents.filter(s => normalizeClass(s.class) === className && s.scores?.[useSubject] !== undefined);
        TEACHER_STATS[teacherName][useSubject].classes.push(className);
        TEACHER_STATS[teacherName][useSubject].students.push(...teacherStudents);
    });

    // 3. 计算多维指标 (已移除增值项)
    Object.keys(TEACHER_STATS).forEach(teacher => {
        Object.keys(TEACHER_STATS[teacher]).forEach(subject => {
            const data = TEACHER_STATS[teacher][subject];
            const students = data.students;
            const gs = gradeStats[subject] || { avg: 0, low: 0 };

            if (students.length > 0) {
                // 基础指标
                data.totalScore = students.reduce((sum, s) => sum + s.scores[subject], 0);
                data.avg = (data.totalScore / students.length).toFixed(2);
                data.studentCount = students.length;
                data.classes = [...new Set(data.classes)].sort().join(',');

                // 三率
                data.excellentCount = students.filter(s => s.scores[subject] >= gs.exc).length;
                data.passCount = students.filter(s => s.scores[subject] >= gs.pass).length;
                data.lowCount = students.filter(s => s.scores[subject] < gs.low).length;

                data.excellentRate = (data.excellentCount / students.length);
                data.passRate = (data.passCount / students.length);
                data.lowRate = (data.lowCount / students.length);

                // 贡献值
                data.contribution = (parseFloat(data.avg) - gs.avg).toFixed(2);

                // ★ 综合绩效分 (移除增值分，提高优良率权重)
                // 新算法：基准30 + 贡献值 + 优率(30) + 及格(30) - 低分惩罚
                let score = 30;
                score += parseFloat(data.contribution);
                score += (data.excellentRate * 30); // 权重由25提至30
                score += (data.passRate * 30);      // 权重由25提至30
                score -= (data.lowRate * 20);

                data.finalScore = score.toFixed(1);

            } else {
                Object.assign(data, {
                    avg: "0.00", excellentRate: 0, passRate: 0, lowRate: 0,
                    contribution: 0, finalScore: 0, classes: "无成绩"
                });
            }
        });
    });

    calculateTeacherTownshipRanking();
    renderTeacherCards();
    renderTeacherComparisonTable();
    generateTeacherPairing();
    if (typeof renderTeachingOverview === 'function') renderTeachingOverview();
    if (typeof tmRenderTeachingModuleStateBars === 'function') tmRenderTeachingModuleStateBars();
}

function generateTeacherPairing() {
    const container = document.getElementById('teacher-pairing-suggestions'); container.innerHTML = '';
    if (!MY_SCHOOL || !SCHOOLS[MY_SCHOOL]) return;
    const schoolMetrics = SCHOOLS[MY_SCHOOL].metrics; let pairs = [];
    SUBJECTS.forEach(sub => {
        const baseline = schoolMetrics[sub]; if (!baseline) return;
        const teachers = []; Object.keys(TEACHER_STATS).forEach(tName => { if (TEACHER_STATS[tName][sub]) { teachers.push({ name: tName, data: TEACHER_STATS[tName][sub] }); } });
        if (teachers.length < 2) return;
        const typeA = teachers.filter(t => t.data.passRate > baseline.passRate && t.data.excellentRate < baseline.excRate);
        const typeB = teachers.filter(t => t.data.excellentRate > baseline.excRate && t.data.passRate < baseline.passRate);
        typeA.forEach(a => { typeB.forEach(b => { const id = [a.name, b.name].sort().join('-'); if (!pairs.find(p => p.id === id + sub)) { pairs.push({ id: id + sub, subject: sub, teacher1: a, teacher2: b }); } }); });
    });
    if (pairs.length === 0) { container.innerHTML = '<div style="text-align:center; color:#999; grid-column:1/-1;">暂无明显的互补型结对建议，说明各位老师发展较为均衡或差异不大。</div>'; return; }
    pairs.forEach(p => {
        const card = document.createElement('div'); card.className = 'pairing-card';
        card.innerHTML = `<div class="pairing-side"><div class="pairing-role">基础扎实型</div><div class="pairing-name">${p.teacher1.name}</div><div class="pairing-skill">✅ 及格率高 (${(p.teacher1.data.passRate * 100).toFixed(1)}%)</div><div class="pairing-need">🔻 需提升优秀率</div></div><div class="pairing-arrow"><div style="text-align:center;"><i class="ti ti-arrows-left-right"></i><div class="pairing-tag">${p.subject}</div></div></div><div class="pairing-side" style="text-align:right;"><div class="pairing-role">培优拔尖型</div><div class="pairing-name">${p.teacher2.name}</div><div class="pairing-skill">✅ 优秀率高 (${(p.teacher2.data.excellentRate * 100).toFixed(1)}%)</div><div class="pairing-need">🔻 需提升及格率</div></div>`; container.appendChild(card);
    });
}

function calculateTeacherTownshipRanking() {
    TEACHER_TOWNSHIP_RANKINGS = {}; TOWNSHIP_RANKING_DATA = {};
    SUBJECTS.forEach(subject => {
        let rankingData = [];
        Object.keys(TEACHER_STATS).forEach(teacher => {
            if (TEACHER_STATS[teacher][subject]) { const data = TEACHER_STATS[teacher][subject]; rankingData.push({ name: teacher, type: 'teacher', subject: subject, avg: parseFloat(data.avg) || 0, excellentRate: data.excellentRate || 0, passRate: data.passRate || 0, studentCount: data.studentCount }); }
        });
        Object.keys(SCHOOLS).forEach(school => {
            if (school !== MY_SCHOOL && SCHOOLS[school].metrics[subject]) { const metrics = SCHOOLS[school].metrics[subject]; rankingData.push({ name: school, type: 'school', subject: subject, avg: parseFloat(metrics.avg) || 0, excellentRate: metrics.excRate || 0, passRate: metrics.passRate || 0, studentCount: metrics.count }); }
        });
        rankingData.sort((a, b) => b.avg - a.avg); rankingData.forEach((item, index) => item.rankAvg = index + 1);
        rankingData.sort((a, b) => b.excellentRate - a.excellentRate); rankingData.forEach((item, index) => item.rankExc = index + 1);
        rankingData.sort((a, b) => b.passRate - a.passRate); rankingData.forEach((item, index) => item.rankPass = index + 1);
        rankingData.sort((a, b) => b.avg - a.avg);
        rankingData.forEach(item => { if (item.type === 'teacher') { if (!TEACHER_TOWNSHIP_RANKINGS[item.name]) TEACHER_TOWNSHIP_RANKINGS[item.name] = {}; TEACHER_TOWNSHIP_RANKINGS[item.name][subject] = { avg: item.avg, rankAvg: item.rankAvg, excellentRate: item.excellentRate, rankExc: item.rankExc, passRate: item.passRate, rankPass: item.rankPass, rank: item.rankAvg }; } });
        TOWNSHIP_RANKING_DATA[subject] = rankingData;
    });
}

function renderTeacherCards() {
    const container = document.getElementById('teacherCardsContainer');
    const user = getCurrentUser();
    const role = user?.role || 'guest';
    const stats = getVisibleTeacherStats();
    const rankings = TEACHER_TOWNSHIP_RANKINGS;
    const list = buildTeacherCardList(stats, rankings, user?.name || '', role);

    try {
        if (window.Alpine && Alpine.store) {
            const store = Alpine.store('teacherData');
            if (store && typeof store.update === 'function') store.update(stats, rankings, user?.name || '', role);
            else if (store) store.list = list;
        }
    } catch (err) {
        console.warn('teacherData store update skipped:', err);
    }

    if (!container) return;

    if (!list.length) {
        container.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; color:#999; padding:20px;">
                暂无教师数据，请先在上方配置并导入。
                <div style="margin-top:10px;">
                    <button class="btn btn-orange" onclick="openTeacherSync()">去同步任课表</button>
                </div>
            </div>
        `;
        return;
    }

    container.innerHTML = list.map(item => `
        <div class="teacher-card">
            <div class="teacher-header">
                <div>
                    <div class="teacher-name">${escapeTeacherCardHtml(item.name)} - ${escapeTeacherCardHtml(item.subject)}</div>
                    <div class="teacher-classes">${escapeTeacherCardHtml(item.classes)}班</div>
                </div>
                <div class="performance-badge ${escapeTeacherCardHtml(item.badgeClass)}">${escapeTeacherCardHtml(item.badgeText)}</div>
            </div>
            <div class="teacher-stats">
                <div class="stat-item">
                    <div class="stat-value">${escapeTeacherCardHtml(item.avg)}</div>
                    <div class="stat-label">平均分</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${escapeTeacherCardHtml(item.excRate)}</div>
                    <div class="stat-label">优秀率</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${escapeTeacherCardHtml(item.passRate)}</div>
                    <div class="stat-label">及格率</div>
                </div>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12px; color:#666; margin-bottom:15px; padding:0 10px;">
                <span>学生: ${escapeTeacherCardHtml(item.count)}人</span>
                <span>镇排: <strong style="color:var(--primary)">${escapeTeacherCardHtml(item.rank)}</strong></span>
            </div>
            <button class="view-details-btn" onclick='showTeacherDetails(${JSON.stringify(item.name)}, ${JSON.stringify(item.subject)})'>查看详情</button>
        </div>
    `).join('');
}

function calculatePerformanceLevel(teacherData) {
    const avg = parseFloat(teacherData.avg), excellentRate = teacherData.excellentRate * 100, passRate = teacherData.passRate * 100;
    if (avg >= 85 && excellentRate >= 30 && passRate >= 90) return { class: 'performance-excellent', text: '优秀' };
    else if (avg >= 80 && excellentRate >= 25 && passRate >= 85) return { class: 'performance-good', text: '良好' };
    else if (avg >= 75 && excellentRate >= 20 && passRate >= 80) return { class: 'performance-average', text: '中等' };
    else return { class: 'performance-poor', text: '需改进' };
}

// [修改] 渲染教师详细对比表 (增加贡献值、增值、低分率等列)
function renderTeacherComparisonTable() {
    const container = document.getElementById('teacherComparisonTable');
    const stats = getVisibleTeacherStats();
    if (Object.keys(stats).length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">暂无教师统计数据</p>'; return;
    }

    // 1. 准备数据
    const subjectTeachers = {};
    Object.keys(stats).forEach(teacher => {
        Object.keys(stats[teacher]).forEach(subject => {
            if (!subjectTeachers[subject]) subjectTeachers[subject] = [];
            subjectTeachers[subject].push({
                teacher,
                data: stats[teacher][subject]
            });
        });
    });

    // 2. 构建 HTML (已移除增值列)
    let tableHtml = `
        <thead>
            <tr>
                <th rowspan="2">教师</th>
                <th rowspan="2">班级</th>
                <th rowspan="2">人数</th>
                <th colspan="2" style="background:#e0f2fe; color:#0369a1;">教学实绩</th>
                <th colspan="3" style="background:#dcfce7; color:#166534;">三率指标</th>
                <th style="background:#fef9c3; color:#b45309;">考核</th>
            </tr>
            <tr>
                <th>均分</th>
                <th>贡献值</th>
                <th>优秀率</th>
                <th>及格率</th>
                <th>低分率</th>
                <th title="综合绩效分">绩效分</th>
            </tr>
        </thead>
        <tbody>`;

    const existingSubjects = Object.keys(subjectTeachers).sort(sortSubjects);

    existingSubjects.forEach(subject => {
        tableHtml += `<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="9" style="text-align:left; padding-left:15px;">📘 ${subject}</td></tr>`;
        const arr = subjectTeachers[subject].sort((a, b) => b.data.finalScore - a.data.finalScore);

        arr.forEach((item, idx) => {
            const d = item.data;
            const contribClass = d.contribution >= 0 ? 'text-green' : 'text-red';
            const contribSign = d.contribution >= 0 ? '+' : '';
            const lowStyle = d.lowRate > 0.1 ? 'color:red; font-weight:bold;' : 'color:#333;';

            tableHtml += `
                <tr>
                    <td><strong>${item.teacher}</strong></td>
                    <td>${d.classes}</td>
                    <td>${d.studentCount}</td>
                    
                    <td style="font-weight:bold;">${d.avg}</td>
                    <td class="${contribClass}" style="font-weight:bold;">${contribSign}${d.contribution}</td>
                    
                    <td>${(d.excellentRate * 100).toFixed(1)}%</td>
                    <td>${(d.passRate * 100).toFixed(1)}%</td>
                    <td style="${lowStyle}">${(d.lowRate * 100).toFixed(1)}%</td>
                    
                    <td style="background:#fffbeb; font-weight:bold; color:#b45309; font-size:1.1em;">${d.finalScore}</td>
                </tr>`;
        });
    });

    tableHtml += `</tbody>`;
    container.innerHTML = `<table class="comparison-table">${tableHtml}</table>`;
}


function renderTeacherTownshipRanking() {
    const user = getCurrentUser();
    const role = user?.role || 'guest';
    const visibleSubjectSet = (role === 'teacher' || role === 'class_teacher') ? getVisibleSubjectsForTeacherUser(user) : null;
    const container = document.getElementById('teacher-township-ranking-container');
    const sideNavTeacherRanks = document.getElementById('side-nav-teacher-ranks-container'); sideNavTeacherRanks.innerHTML = '';
    if (!TOWNSHIP_RANKING_DATA || Object.keys(TOWNSHIP_RANKING_DATA).length === 0) { container.innerHTML = '<p style="text-align: center; color: #666;">暂无教师乡镇排名数据</p>'; return; }
    const townshipAverages = {};
    SUBJECTS.forEach(subject => {
        if (visibleSubjectSet && visibleSubjectSet.size > 0 && !visibleSubjectSet.has(normalizeSubject(subject))) return;
        let totalAvg = 0, totalExc = 0, totalPass = 0, count = 0;
        Object.keys(SCHOOLS).forEach(school => { if (school !== MY_SCHOOL && SCHOOLS[school].metrics[subject]) { const metrics = SCHOOLS[school].metrics[subject]; totalAvg += metrics.avg; totalExc += metrics.excRate; totalPass += metrics.passRate; count++; } });
        if (count > 0) townshipAverages[subject] = { avg: totalAvg / count, excRate: totalExc / count, passRate: totalPass / count };
    });
    let htmlAll = '';
    SUBJECTS.forEach(subject => {
        if (visibleSubjectSet && visibleSubjectSet.size > 0 && !visibleSubjectSet.has(normalizeSubject(subject))) return;
        const rankingData = TOWNSHIP_RANKING_DATA[subject]; if (!rankingData || rankingData.length === 0) return;
        const townshipAvg = townshipAverages[subject] || { avg: 0, excRate: 0, passRate: 0 }; let tbodyHtml = '';
        rankingData.forEach((item) => {
            const avgComparison = townshipAvg.avg ? ((item.avg - townshipAvg.avg) / townshipAvg.avg * 100).toFixed(2) : 0; const excComparison = townshipAvg.excRate ? ((item.excellentRate - townshipAvg.excRate) / townshipAvg.excRate * 100).toFixed(2) : 0; const passComparison = townshipAvg.passRate ? ((item.passRate - townshipAvg.passRate) / townshipAvg.passRate * 100).toFixed(2) : 0; const typeClass = item.type === 'teacher' ? 'text-blue' : ''; const typeText = item.type === 'teacher' ? '教师' : '学校';
            tbodyHtml += `<tr><td class="${typeClass}">${item.name}</td><td>${typeText}</td><td>${formatRankDisplay(item.avg, item.rankAvg, 'teacher')}</td><td class="${avgComparison >= 0 ? 'positive-percent' : 'negative-percent'}">${avgComparison >= 0 ? '+' : ''}${avgComparison}%</td><td>${item.rankAvg}</td><td>${formatRankDisplay(item.excellentRate, item.rankExc, 'teacher', true)}</td><td class="${excComparison >= 0 ? 'positive-percent' : 'negative-percent'}">${excComparison >= 0 ? '+' : ''}${excComparison}%</td><td>${item.rankExc}</td><td>${formatRankDisplay(item.passRate, item.rankPass, 'teacher', true)}</td><td class="${passComparison >= 0 ? 'positive-percent' : 'negative-percent'}">${passComparison >= 0 ? '+' : ''}${passComparison}%</td><td>${item.rankPass}</td></tr>`;
        });
        const anchorId = `rank-anchor-${subject}`; htmlAll += `<div id="${anchorId}" class="anchor-target" style="padding-top:20px;"><div class="sub-header">🏅 ${subject} 教师乡镇排名 <span style="font-size:12px; font-weight:normal; margin-left:10px;">(含外校整体数据)</span></div><div class="table-wrap"><table class="comparison-table"><thead><tr><th>教师/学校</th><th>类型</th><th>平均分</th><th>与镇均比</th><th>镇排</th><th>优秀率</th><th>与镇均比</th><th>镇排</th><th>及格率</th><th>与镇均比</th><th>镇排</th></tr></thead><tbody>${tbodyHtml}</tbody></table></div></div>`;
        const navLink = document.createElement('a'); navLink.className = 'side-nav-sub-link'; navLink.innerText = subject; navLink.onclick = () => scrollToSubAnchor(anchorId, navLink); sideNavTeacherRanks.appendChild(navLink);
    });
    container.innerHTML = htmlAll;
}

function showTeacherDetails(teacher, subject) {
    const stats = getVisibleTeacherStats();
    const data = stats[teacher] ? stats[teacher][subject] : null;
    if (!data) {
        if (window.UI) UI.toast('当前筛选范围下暂无该教师该学科数据', 'warning');
        return;
    }
    document.getElementById('modalTeacherName').textContent = `${teacher} - ${subject} 教学详情`;
    document.getElementById('modalAvgScore').textContent = data.avg; document.getElementById('modalExcellentRate').textContent = (data.excellentRate * 100).toFixed(2) + '%'; document.getElementById('modalPassRate').textContent = (data.passRate * 100).toFixed(2) + '%';
    const subjectAvg = THRESHOLDS[subject] ? (THRESHOLDS[subject].exc + THRESHOLDS[subject].pass) / 2 : 0; const avgComparison = subjectAvg ? ((parseFloat(data.avg) - subjectAvg) / subjectAvg * 100).toFixed(1) : 0;
    document.getElementById('modalAvgComparison').textContent = (avgComparison >= 0 ? '+' : '') + avgComparison + '%';
    const avgProgress = Math.min(Math.max(50 + (avgComparison / 2), 0), 100);
    document.getElementById('modalAvgProgress').style.width = avgProgress + '%'; document.getElementById('modalAvgProgress').className = avgComparison >= 0 ? 'progress-good' : 'progress-poor'; document.getElementById('modalAvgProgress').style.backgroundColor = avgComparison >= 0 ? '#22c55e' : '#ef4444';
    const tableBody = document.querySelector('#modalSubjectTable tbody');
    tableBody.innerHTML = `<tr><td>${subject}</td><td>${data.avg}</td><td class="${avgComparison >= 0 ? 'positive-percent' : 'negative-percent'}">${avgComparison >= 0 ? '+' : ''}${avgComparison}%</td><td>${(data.excellentRate * 100).toFixed(2)}%</td><td>-</td><td>${(data.passRate * 100).toFixed(2)}%</td><td>-</td></tr>`;
    document.getElementById('teacherModal').style.display = 'flex';
}

document.getElementById('closeModal').addEventListener('click', () => document.getElementById('teacherModal').style.display = 'none');
window.addEventListener('click', (e) => { if (e.target === document.getElementById('teacherModal')) document.getElementById('teacherModal').style.display = 'none'; });

// ================= 关联分析逻辑 =================
function updateCorrelationSchoolSelect() {
    const sel = document.getElementById('corrSchoolSelect'); const old = sel.value;
    sel.innerHTML = '<option value="ALL">全乡镇 (All)</option>';
    Object.keys(SCHOOLS).forEach(s => sel.innerHTML += `<option value="${s}">${s}</option>`);
    if (old) sel.value = old;
}

function calculatePearson(x, y) {
    let n = x.length; if (n === 0) return 0;
    let sum_x = 0, sum_y = 0, sum_xy = 0, sum_x2 = 0, sum_y2 = 0;
    for (let i = 0; i < n; i++) { sum_x += x[i]; sum_y += y[i]; sum_xy += x[i] * y[i]; sum_x2 += x[i] * x[i]; sum_y2 += y[i] * y[i]; }
    let numerator = (n * sum_xy) - (sum_x * sum_y); let denominator = Math.sqrt((n * sum_x2 - sum_x * sum_x) * (n * sum_y2 - sum_y * sum_y));
    return (denominator === 0) ? 0 : numerator / denominator;
}

function renderCorrelationAnalysis() {
    const scope = document.getElementById('corrSchoolSelect').value;
    const students = (scope === 'ALL') ? RAW_DATA : (SCHOOLS[scope]?.students || []);
    if (students.length < 5) return alert('样本数据太少，无法进行有效分析');

    const matrixBody = document.querySelector('#corrMatrixTable tbody');
    let mHtml = '<tr><th></th>'; SUBJECTS.forEach(s => mHtml += `<th>${s}</th>`); mHtml += '</tr>';
    SUBJECTS.forEach(rowSub => {
        mHtml += `<tr><th>${rowSub}</th>`;
        SUBJECTS.forEach(colSub => {
            if (rowSub === colSub) { mHtml += '<td style="background:#eee;">-</td>'; } else {
                const common = students.filter(s => s.scores[rowSub] !== undefined && s.scores[colSub] !== undefined);
                const r = calculatePearson(common.map(s => s.scores[rowSub]), common.map(s => s.scores[colSub]));
                let bg = '#fff'; if (r > 0) bg = `rgba(220, 38, 38, ${r * 0.8})`; else bg = `rgba(37, 99, 235, ${Math.abs(r) * 0.8})`;
                let color = Math.abs(r) > 0.5 ? '#fff' : '#333';
                mHtml += `<td class="heatmap-cell" style="background:${bg}; color:${color}" title="${rowSub} vs ${colSub} 相关系数: ${r.toFixed(3)}">${r.toFixed(2)}</td>`;
            }
        });
        mHtml += '</tr>';
    });
    matrixBody.innerHTML = mHtml;

    const contribData = SUBJECTS.map(sub => {
        const common = students.filter(s => s.scores[sub] !== undefined);
        const r = calculatePearson(common.map(s => s.scores[sub]), common.map(s => s.total));
        return { sub, r };
    }).sort((a, b) => b.r - a.r);

    const chartContainer = document.getElementById('contributionChartContainer');
    chartContainer.innerHTML = '';
    contribData.forEach(item => {
        const w = Math.max(0, item.r * 100);
        chartContainer.innerHTML += `<div style="display:flex; align-items:center; margin-bottom:5px;"><span style="width:40px; font-size:12px; font-weight:bold;">${item.sub}</span><div style="flex:1; background:#f1f5f9; border-radius:4px; margin-left:10px; height:20px;"><div class="contribution-bar" style="width:${w}%; background:${item.r > 0.8 ? '#16a34a' : (item.r > 0.6 ? '#2563eb' : '#ca8a04')}">${item.r.toFixed(3)}</div></div></div>`;
    });

    const liftDragBody = document.querySelector('#liftDragTable tbody'); let ldHtml = '';
    SUBJECTS.forEach(sub => {
        let lift = 0, drag = 0, balance = 0; let validCount = 0;
        students.forEach(s => {
            const tRank = safeGet(s, 'ranks.total.township', 0); const sRank = safeGet(s, `ranks.${sub}.township`, 0);
            if (!tRank || !sRank) return;
            validCount++; const threshold = students.length * 0.1;
            if (sRank < tRank - threshold) lift++; else if (sRank > tRank + threshold) drag++; else balance++;
        });
        if (validCount > 0) {
            const net = lift - drag;
            ldHtml += `<tr><td>${sub}</td><td class="text-green">${lift} 人 (${(lift / validCount * 100).toFixed(0)}%)</td><td class="text-red">${drag} 人 (${(drag / validCount * 100).toFixed(0)}%)</td><td>${balance} 人</td><td style="font-weight:bold; color:${net > 0 ? 'green' : 'red'}">${net > 0 ? '+' : ''}${net}</td></tr>`;
        }
    });
    liftDragBody.innerHTML = ldHtml;
}

// ================= 进退步分析逻辑 =================
function updateProgressSchoolSelect() {
    const sel = document.getElementById('progressSchoolSelect');
    sel.innerHTML = '<option value="">--请选择本校--</option>';
    Object.keys(SCHOOLS).forEach(s => sel.innerHTML += `<option value="${s}">${s}</option>`);

    const user = getCurrentUser();
    const role = user?.role || 'guest';
    if (role === 'teacher' || role === 'class_teacher') {
        const school = user.school || MY_SCHOOL || '';
        if (school) {
            sel.value = school;
            sel.disabled = true;
        }
    }

    requestAnimationFrame(() => {
        const active = document.getElementById('progress-analysis');
        if (active && active.classList.contains('active')) {
            enforceSectionIsolation('progress-analysis');
        }
    });
}

function updateProgressBaselineSelect() {
    const sel = document.getElementById('progressBaselineSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">--请选择历史考试--</option>';
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const exams = Object.values(db?.exams || {}).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    exams.forEach(ex => {
        if (ex.examId && ex.examId !== CURRENT_EXAM_ID) {
            sel.innerHTML += `<option value="${ex.examId}">${ex.examId}</option>`;
        }
    });
    sel.onchange = () => { window.PROGRESS_CACHE = []; };
}

function getBaselineDataFromExam(examId) {
    if (!examId) return [];
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const exam = db?.exams?.[examId];
    if (!exam || !exam.data) return [];
    return exam.data.map(s => ({
        name: s.name,
        school: s.school,
        class: normalizeClass(s.class),
        total: s.total
    })).filter(s => typeof s.total === 'number');
}

let MULTI_PERIOD_COMPARE_CACHE = null;
// 多期对比选择器运行时已拆分到 public/assets/js/compare-selectors-runtime.js

function setProgressBaselineStatus(message, tone = 'info') {
    const statusEl = document.getElementById('va-data-status');
    if (!statusEl) return;
    const palette = {
        success: { color: '#16a34a', weight: 'bold' },
        error: { color: '#dc2626', weight: 'bold' },
        loading: { color: '#2563eb', weight: 'bold' },
        info: { color: '#475569', weight: 'normal' }
    };
    const style = palette[tone] || palette.info;
    statusEl.innerHTML = message;
    statusEl.style.color = style.color;
    statusEl.style.fontWeight = style.weight;
}

function getProgressBaselineExamList() {
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    return Object.values(db?.exams || {})
        .filter(ex => ex?.examId && Array.isArray(ex.data) && ex.data.length > 0)
        .map(ex => ({
            id: ex.examId,
            key: ex.examFullKey || ex.examId,
            createdAt: Number(ex.createdAt || 0),
            dataCount: ex.data.length
        }))
        .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

function resolveProgressBaselineExamEntry(examId) {
    if (!examId) return null;
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    const entries = Object.entries(db?.exams || {});
    if (!entries.length) return null;

    const direct = entries.find(([key, exam]) => {
        const fullKey = String(exam?.examFullKey || '').trim();
        const storedId = String(exam?.examId || '').trim();
        return String(key).trim() === String(examId).trim()
            || fullKey === String(examId).trim()
            || storedId === String(examId).trim()
            || (typeof isExamKeyEquivalentForCompare === 'function'
                && (
                    isExamKeyEquivalentForCompare(key, examId)
                    || isExamKeyEquivalentForCompare(fullKey, examId)
                    || isExamKeyEquivalentForCompare(storedId, examId)
                ));
    });

    if (!direct) return null;
    const [key, exam] = direct;
    return {
        key,
        examId: exam?.examId || key,
        examFullKey: exam?.examFullKey || exam?.examId || key,
        createdAt: Number(exam?.createdAt || 0),
        data: Array.isArray(exam?.data) ? exam.data : []
    };
}

function pickDefaultProgressBaselineExamId(examList) {
    const historicalList = (examList || []).filter(ex => !CURRENT_EXAM_ID || !isExamKeyEquivalentForCompare(ex.id, CURRENT_EXAM_ID));
    if (!historicalList.length) return '';
    if (CURRENT_EXAM_ID) {
        const currentIndex = (examList || []).findIndex(ex => isExamKeyEquivalentForCompare(ex.id, CURRENT_EXAM_ID));
        if (currentIndex > 0) return examList[currentIndex - 1].id;
    }
    return historicalList[historicalList.length - 1].id;
}

function normalizeProgressBaselineRows(rows, examId = '') {
    const normalized = (rows || []).map(row => {
        const student = row?.student || {};
        const total = Number(
            row?.total ??
            row?.totalScore ??
            row?.score ??
            student?.total ??
            student?.totalScore ??
            NaN
        );
        const rankValue = Number(
            row?.rank ??
            row?.townRank ??
            row?.prevRank ??
            row?.ranks?.total?.township ??
            student?.ranks?.total?.township ??
            NaN
        );
        return {
            name: row?.name || student?.name || '',
            school: row?.school || student?.school || '',
            class: normalizeClass(row?.class || student?.class || ''),
            total,
            rank: Number.isFinite(rankValue) && rankValue > 0 ? rankValue : null,
            examId: examId || row?.examId || row?.examFullKey || row?._sourceExam || ''
        };
    }).filter(item => item.name && Number.isFinite(item.total));

    if (!normalized.length) return [];
    const needsRank = normalized.some(item => !Number.isFinite(item.rank) || item.rank <= 0);
    if (needsRank) {
        const ranked = normalized.slice().sort((a, b) => (b.total || 0) - (a.total || 0));
        let lastRank = 0;
        let lastTotal = null;
        ranked.forEach((item, index) => {
            if (index > 0 && lastTotal !== null && Math.abs((item.total || 0) - lastTotal) < 0.001) {
                item.rank = lastRank;
            } else {
                item.rank = index + 1;
                lastRank = item.rank;
            }
            lastTotal = item.total || 0;
        });
    }
    return normalized;
}

function updateProgressBaselineSelect() {
    const sel = document.getElementById('progressBaselineSelect');
    if (!sel) return;
    const currentValue = sel.value || '';
    const examList = getProgressBaselineExamList();
    const baselineList = examList.filter(ex => !CURRENT_EXAM_ID || !isExamKeyEquivalentForCompare(ex.id, CURRENT_EXAM_ID));

    sel.innerHTML = '<option value="">--请选择历史考试--</option>';
    baselineList.forEach(ex => {
        sel.innerHTML += `<option value="${ex.id}">${ex.id}</option>`;
    });

    const preferredId = baselineList.some(ex => ex.id === currentValue)
        ? currentValue
        : pickDefaultProgressBaselineExamId(examList);
    if (preferredId) sel.value = preferredId;

    sel.onchange = () => {
        window.PROGRESS_CACHE = [];
        window.__PROGRESS_BASELINE_ACTIVE_ID = '';
        Promise.resolve(ensureProgressBaselineData({
            allowCloudSync: false,
            rerenderReport: true,
            rerenderAnalysis: true
        })).catch(err => {
            console.warn('[progress] 切换历史基准失败:', err);
            setProgressBaselineStatus('❌ 切换历史基准失败，请稍后重试', 'error');
        });
    };
}

function getBaselineDataFromExam(examId) {
    if (!examId) return [];
    const exam = resolveProgressBaselineExamEntry(examId);
    if (!exam || !Array.isArray(exam.data) || exam.data.length === 0) return [];
    return normalizeProgressBaselineRows(exam.data, exam.examFullKey || exam.examId || examId);
}

function syncProgressBaselineExamOptions() {
    const rawCohortId = CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID');
    const cohortId = typeof normalizeCompareCohortId === 'function'
        ? normalizeCompareCohortId(rawCohortId)
        : rawCohortId;
    if (!cohortId || !window.CloudManager || typeof window.CloudManager.fetchCohortExamsToLocal !== 'function') {
        return Promise.resolve(false);
    }
    if (!window.__PROGRESS_BASELINE_SYNC_STATE) window.__PROGRESS_BASELINE_SYNC_STATE = {};
    const state = window.__PROGRESS_BASELINE_SYNC_STATE[cohortId] || { pending: false, lastAttempt: 0, promise: null };
    window.__PROGRESS_BASELINE_SYNC_STATE[cohortId] = state;
    if (state.pending && state.promise) return state.promise;
    if (Date.now() - Number(state.lastAttempt || 0) < 5000) return Promise.resolve(false);

    state.pending = true;
    state.lastAttempt = Date.now();
    state.promise = Promise.resolve(window.CloudManager.fetchCohortExamsToLocal(cohortId, { minCount: 2 }))
        .then(() => {
            if (typeof updateProgressBaselineSelect === 'function') updateProgressBaselineSelect();
            if (typeof refreshCompareExamSelectors === 'function') refreshCompareExamSelectors();
            return true;
        })
        .catch(err => {
            console.warn('[progress-sync] fetchCohortExamsToLocal failed:', err);
            return false;
        })
        .finally(() => {
            state.pending = false;
            state.promise = null;
        });
    return state.promise;
}

async function ensureProgressBaselineData(options = {}) {
    const {
        allowCloudSync = false,
        rerenderReport = true,
        rerenderAnalysis = true
    } = options;
    if (window.__PROGRESS_BASELINE_LOADING) {
        return Array.isArray(PREV_DATA) ? PREV_DATA : [];
    }
    window.__PROGRESS_BASELINE_LOADING = true;
    const baselineSel = document.getElementById('progressBaselineSelect');
    const progressSchoolSel = document.getElementById('progressSchoolSelect');
    let baselineId = baselineSel?.value || '';
    if (!baselineId) {
        const examList = getProgressBaselineExamList();
        baselineId = pickDefaultProgressBaselineExamId(examList);
        if (baselineSel && baselineId) baselineSel.value = baselineId;
    }
    let baselineData = baselineId
        ? getBaselineDataFromExam(baselineId)
        : normalizeProgressBaselineRows(PREV_DATA || window.PREV_DATA || []);

    if (!baselineData.length) {
        const fallbackId = pickDefaultProgressBaselineExamId(getProgressBaselineExamList());
        if (fallbackId) {
            baselineId = fallbackId;
            if (baselineSel) baselineSel.value = fallbackId;
            baselineData = getBaselineDataFromExam(fallbackId);
        }
    }

    if (!baselineData.length && allowCloudSync) {
        setProgressBaselineStatus('⏳ 正在自动加载上次考试数据...', 'loading');
        const synced = await syncProgressBaselineExamOptions();
        if (synced) {
            const fallbackId = baselineSel?.value || pickDefaultProgressBaselineExamId(getProgressBaselineExamList());
            if (fallbackId) {
                baselineId = fallbackId;
                if (baselineSel) baselineSel.value = fallbackId;
                baselineData = getBaselineDataFromExam(fallbackId);
            }
        }
    }

    if (!baselineData.length) {
        setProgressBaselineStatus('❌ 未找到可用上次考试数据，请先同步当前届别考试或导入历史成绩', 'error');
        return [];
    }

    const baselineChanged = String(window.__PROGRESS_BASELINE_ACTIVE_ID || '') !== String(baselineId || '');
    if (baselineChanged) window.PROGRESS_CACHE = [];
    window.__PROGRESS_BASELINE_ACTIVE_ID = baselineId || '';
    PREV_DATA = baselineData;
    window.PREV_DATA = baselineData;
    setProgressBaselineStatus(`✅ 已自动加载上次考试数据（${baselineData.length} 条）${baselineId ? `：${baselineId}` : ''}`, 'success');

    try {
        if (!window.PROGRESS_CACHE || window.PROGRESS_CACHE.length === 0) {
            if (typeof performSilentMatching === 'function') performSilentMatching();
        }
        if (rerenderReport && typeof renderValueAddedReport === 'function') {
            renderValueAddedReport(true);
        }
        if (rerenderAnalysis && progressSchoolSel?.value && typeof renderProgressAnalysis === 'function') {
            renderProgressAnalysis();
        }
    } catch (renderErr) {
        console.warn('[progress] 历史基准已加载，但后续渲染失败:', renderErr);
        setProgressBaselineStatus(`⚠️ 已加载上次考试数据（${baselineData.length} 条），但页面刷新失败，请稍后重试`, 'error');
    } finally {
        window.__PROGRESS_BASELINE_LOADING = false;
    }
    return baselineData;
}

// Compare shared runtime moved to public/assets/js/compare-shared-runtime.js

// School normalization runtime moved to public/assets/js/school-normalization-runtime.js


function renderMultiPeriodComparison() {
    const hintEl = document.getElementById('multiPeriodCompareHint');
    const resultEl = document.getElementById('multiPeriodCompareResult');
    const countEl = document.getElementById('progressComparePeriodCount');
    const schoolEl = document.getElementById('progressCompareSchool');
    const e1El = document.getElementById('progressCompareExam1');
    const e2El = document.getElementById('progressCompareExam2');
    const e3El = document.getElementById('progressCompareExam3');
    if (!hintEl || !resultEl || !countEl || !schoolEl || !e1El || !e2El || !e3El) return;

    const periodCount = parseInt(countEl.value || '2');
    const school = schoolEl.value;
    const selectedExamIds = periodCount === 3 ? [e1El.value, e2El.value, e3El.value] : [e1El.value, e2El.value];
    const examIds = sortExamIdsChronologically(selectedExamIds);

    if (!school) {
        hintEl.innerHTML = '❌ 请先选择学校。';
        resultEl.innerHTML = '';
        return;
    }
    if (examIds.some(x => !x)) {
        hintEl.innerHTML = '❌ 请完整选择所有考试期次。';
        resultEl.innerHTML = '';
        return;
    }
    if (new Set(examIds).size !== examIds.length) {
        hintEl.innerHTML = '❌ 期次不能重复，请选择不同考试。';
        resultEl.innerHTML = '';
        return;
    }

    const rowsByExam = examIds.map(id => ({ examId: id, rows: getExamRowsForCompare(id) }));
    if (rowsByExam.some(x => !x.rows.length)) {
        hintEl.innerHTML = '❌ 某些期次没有可用数据，请检查考试数据。';
        resultEl.innerHTML = '';
        return;
    }

    const summaryByExam = rowsByExam.map(x => ({ examId: x.examId, summary: buildSchoolSummaryForExam(x.rows) }));
    const selectedByExam = rowsByExam.map(x => ({ examId: x.examId, rows: filterRowsBySchool(x.rows, school) }));
    if (!selectedByExam.every(x => x.rows.length > 0)) {
        hintEl.innerHTML = '❌ 所选学校在某些期次中无数据，无法对比。';
        resultEl.innerHTML = '';
        return;
    }

    const cleanName = n => String(n || '').replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    const schoolMaps = rowsByExam.map(x => {
        const map = {};
        filterRowsBySchool(x.rows, school).forEach(r => {
            map[cleanName(r.name)] = r;
        });
        return map;
    });

    let studentRows = [];
    if (periodCount === 2) {
        const [m1, m2] = schoolMaps;
        Object.keys(m2).forEach(k => {
            if (!m1[k]) return;
            const a = m1[k], b = m2[k];
            studentRows.push({
                class: b.class,
                name: b.name,
                r1: a.rankSchool,
                r2: b.rankSchool,
                t1: a.total,
                t2: b.total,
                dRank12: a.rankSchool - b.rankSchool,
                dScore12: b.total - a.total
            });
        });
        studentRows.sort((a, b) => Math.abs(b.dRank12) - Math.abs(a.dRank12));
    } else {
        const [m1, m2, m3] = schoolMaps;
        Object.keys(m3).forEach(k => {
            if (!m1[k] || !m2[k]) return;
            const a = m1[k], b = m2[k], c = m3[k];
            studentRows.push({
                class: c.class,
                name: c.name,
                r1: a.rankSchool,
                r2: b.rankSchool,
                r3: c.rankSchool,
                t1: a.total,
                t2: b.total,
                t3: c.total,
                dRank12: a.rankSchool - b.rankSchool,
                dRank23: b.rankSchool - c.rankSchool,
                dRank13: a.rankSchool - c.rankSchool,
                dScore13: c.total - a.total
            });
        });
        studentRows.sort((a, b) => Math.abs(b.dRank13) - Math.abs(a.dRank13));
    }

    const schoolTableRows = selectedByExam.map((x, idx) => {
        const s = calcSchoolMetricsFromRows(x.rows);
        const rankAvg = getSummaryEntryBySchool(summaryByExam[idx]?.summary, school)?.rankAvg || '-';
        return `<tr><td>${x.examId}</td><td>${s.count}</td><td>${s.avg.toFixed(2)}</td><td>${(s.excRate * 100).toFixed(1)}%</td><td>${(s.passRate * 100).toFixed(1)}%</td><td>${rankAvg}</td></tr>`;
    }).join('');

    let detailHtml = '';
    if (periodCount === 2) {
        detailHtml = `<table class="mobile-card-table"><thead><tr><th>班级</th><th>姓名</th><th>第1期校排</th><th>第2期校排</th><th>名次变化</th><th>分数变化</th></tr></thead><tbody>` +
            (studentRows.length ? studentRows.slice(0, 200).map(r => `<tr><td>${r.class}</td><td>${r.name}</td><td>${r.r1}</td><td>${r.r2}</td><td style="font-weight:bold; color:${r.dRank12 >= 0 ? 'var(--success)' : 'var(--danger)'};">${r.dRank12 >= 0 ? '+' : ''}${r.dRank12}</td><td>${r.dScore12 >= 0 ? '+' : ''}${r.dScore12.toFixed(1)}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center; color:#999;">无可匹配学生数据</td></tr>') +
            `</tbody></table>`;
    } else {
        detailHtml = `<table class="mobile-card-table"><thead><tr><th>班级</th><th>姓名</th><th>第1期校排</th><th>第2期校排</th><th>第3期校排</th><th>1→2</th><th>2→3</th><th>1→3</th><th>总分1→3</th></tr></thead><tbody>` +
            (studentRows.length ? studentRows.slice(0, 200).map(r => `<tr><td>${r.class}</td><td>${r.name}</td><td>${r.r1}</td><td>${r.r2}</td><td>${r.r3}</td><td>${r.dRank12 >= 0 ? '+' : ''}${r.dRank12}</td><td>${r.dRank23 >= 0 ? '+' : ''}${r.dRank23}</td><td style="font-weight:bold; color:${r.dRank13 >= 0 ? 'var(--success)' : 'var(--danger)'};">${r.dRank13 >= 0 ? '+' : ''}${r.dRank13}</td><td>${r.dScore13 >= 0 ? '+' : ''}${r.dScore13.toFixed(1)}</td></tr>`).join('') : '<tr><td colspan="9" style="text-align:center; color:#999;">无可匹配学生数据</td></tr>') +
            `</tbody></table>`;
    }

    const avgChangeText = periodCount === 2
        ? (() => {
            const avg = studentRows.length ? studentRows.reduce((a, b) => a + b.dRank12, 0) / studentRows.length : 0;
            return `平均名次变化：${avg >= 0 ? '+' : ''}${avg.toFixed(2)} 名`;
        })()
        : (() => {
            const avg = studentRows.length ? studentRows.reduce((a, b) => a + b.dRank13, 0) / studentRows.length : 0;
            return `跨三期平均名次变化(1→3)：${avg >= 0 ? '+' : ''}${avg.toFixed(2)} 名`;
        })();

    resultEl.innerHTML = `
            <div class="sub-header">🏫 学校多期指标对比（${school}）</div>
            <div class="table-wrap"><table class="mobile-card-table"><thead><tr><th>期次</th><th>人数</th><th>总分均分</th><th>优秀率</th><th>及格率</th><th>校际均分排位</th></tr></thead><tbody>${schoolTableRows}</tbody></table></div>
            <div style="margin:8px 0; font-size:12px; color:#475569;">${avgChangeText}；匹配学生数：${studentRows.length}</div>
            <div class="sub-header">👤 学生多期排名变化明细</div>
            <div class="table-wrap">${detailHtml}</div>
        `;

    hintEl.innerHTML = `✅ 已完成 ${periodCount} 期对比：${examIds.join(' → ')}`;
    hintEl.style.color = '#16a34a';
    MULTI_PERIOD_COMPARE_CACHE = { school, examIds, periodCount, summaryByExam, studentRows };
}

function exportMultiPeriodComparison() {
    if (!MULTI_PERIOD_COMPARE_CACHE) return alert('请先生成多期对比结果');
    const { school, examIds, periodCount, summaryByExam, studentRows } = MULTI_PERIOD_COMPARE_CACHE;
    const wb = XLSX.utils.book_new();

    const sumHeader = ['学校', '期次', '人数', '总分均分', '优秀率', '及格率', '校际均分排位'];
    const sumData = [sumHeader];
    summaryByExam.forEach(x => {
        const s = getSummaryEntryBySchool(x.summary, school);
        if (!s) return;
        sumData.push([school, x.examId, s.count, s.avg, s.excRate, s.passRate, s.rankAvg]);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sumData), '学校多期指标');

    let detailHeader = [];
    let detailData = [];
    if (periodCount === 2) {
        detailHeader = ['班级', '姓名', `${examIds[0]}校排`, `${examIds[1]}校排`, '名次变化', `${examIds[0]}总分`, `${examIds[1]}总分`, '分数变化'];
        detailData = studentRows.map(r => [r.class, r.name, r.r1, r.r2, r.dRank12, r.t1, r.t2, r.dScore12]);
    } else {
        detailHeader = ['班级', '姓名', `${examIds[0]}校排`, `${examIds[1]}校排`, `${examIds[2]}校排`, '1→2', '2→3', '1→3', `${examIds[0]}总分`, `${examIds[2]}总分`, '总分1→3'];
        detailData = studentRows.map(r => [r.class, r.name, r.r1, r.r2, r.r3, r.dRank12, r.dRank23, r.dRank13, r.t1, r.t3, r.dScore13]);
    }
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([detailHeader, ...detailData]), '学生多期变化');

    XLSX.writeFile(wb, `多期对比_${school}_${examIds.join('_')}.xlsx`);
}

let MACRO_MULTI_PERIOD_COMPARE_CACHE = null;
let TEACHER_MULTI_PERIOD_COMPARE_CACHE = null;
let STUDENT_MULTI_PERIOD_COMPARE_CACHE = null;
let CLOUD_STUDENT_COMPARE_CONTEXT = null;
let CLOUD_COMPARE_TARGET = null;
let CLOUD_COMPARE_PREV_DATA_BACKUP = null;

function normalizeCompareName(name) {
    return String(name || '').trim().replace(/\s+/g, '').toLowerCase();
}

function setCloudCompareTarget(targetOrName, className, schoolName) {
    if (!targetOrName) {
        CLOUD_COMPARE_TARGET = null;
        return null;
    }
    if (typeof targetOrName === 'object') {
        CLOUD_COMPARE_TARGET = {
            name: String(targetOrName.name || '').trim(),
            class: String(targetOrName.class || '').trim(),
            school: String(targetOrName.school || '').trim()
        };
        return CLOUD_COMPARE_TARGET;
    }
    CLOUD_COMPARE_TARGET = {
        name: String(targetOrName || '').trim(),
        class: String(className || '').trim(),
        school: String(schoolName || '').trim()
    };
    return CLOUD_COMPARE_TARGET;
}

function resolveCloudCompareTarget(user) {
    if (CLOUD_COMPARE_TARGET && CLOUD_COMPARE_TARGET.name) {
        return CLOUD_COMPARE_TARGET;
    }
    if (CURRENT_REPORT_STUDENT) {
        return {
            name: String(CURRENT_REPORT_STUDENT.name || '').trim(),
            class: String(CURRENT_REPORT_STUDENT.class || '').trim(),
            school: String(CURRENT_REPORT_STUDENT.school || '').trim()
        };
    }
    const bound = getCurrentBoundStudentFromUser(user);
    if (bound) {
        return {
            name: String(bound.name || '').trim(),
            class: String(bound.class || '').trim(),
            school: String(bound.school || '').trim()
        };
    }
    return {
        name: String(user?.name || '').trim(),
        class: String(user?.class || '').trim(),
        school: String(user?.school || '').trim()
    };
}

function isClassEquivalent(a, b) {
    const c1 = normalizeClass(a || '');
    const c2 = normalizeClass(b || '');
    if (!c1 || !c2) return false;
    if (c1 === c2) return true;
    const n1 = c1.replace(/0/g, '');
    const n2 = c2.replace(/0/g, '');
    return n1.length > 0 && n1 === n2;
}

function getCurrentBoundStudentFromUser(user) {
    if (!user || !RAW_DATA || RAW_DATA.length === 0) return null;
    const uname = normalizeCompareName(user.name || '');
    const uclass = String(user.class || '');
    const uschool = String(user.school || '').trim();
    return RAW_DATA.find(s => {
        if (normalizeCompareName(s?.name || '') !== uname) return false;
        if (uclass && !isClassEquivalent(s?.class || '', uclass)) return false;
        if (uschool && String(s?.school || '').trim() && String(s?.school || '').trim() !== uschool) return false;
        return true;
    }) || null;
}

function restorePrevDataFromCloudCompare() {
    if (CLOUD_COMPARE_PREV_DATA_BACKUP !== null) {
        PREV_DATA = JSON.parse(JSON.stringify(CLOUD_COMPARE_PREV_DATA_BACKUP));
        CLOUD_COMPARE_PREV_DATA_BACKUP = null;
        if (typeof performSilentMatching === 'function') {
            try { performSilentMatching(); } catch (e) { console.warn('恢复历史匹配失败:', e); }
        }
    }
}

function syncCloudContextToPrevData() {
    const ctx = CLOUD_STUDENT_COMPARE_CONTEXT;
    const prev = ctx?.previousRecord;
    if (!prev) return false;

    if (CLOUD_COMPARE_PREV_DATA_BACKUP === null) {
        CLOUD_COMPARE_PREV_DATA_BACKUP = JSON.parse(JSON.stringify(PREV_DATA || []));
    }

    const historyRow = {
        examId: String(ctx?.prevExamId || ''),
        examFullKey: String(ctx?.prevExamId || ''),
        examLabel: String(ctx?.prevExamId || '').replace(/_/g, ' '),
        school: String(prev.school || ctx?.owner?.school || ''),
        class: String(prev.class || ctx?.owner?.class || ''),
        name: String(prev.name || ctx?.owner?.name || ''),
        total: Number(prev.total) || 0,
        classRank: prev.classRank ?? '-',
        schoolRank: prev.schoolRank ?? '-',
        townRank: prev.townRank ?? '-',
        ranks: JSON.parse(JSON.stringify(prev.ranks || {})),
        scores: JSON.parse(JSON.stringify(prev.scores || {})),
        student: {
            school: String(prev.school || ctx?.owner?.school || ''),
            class: String(prev.class || ctx?.owner?.class || ''),
            name: String(prev.name || ctx?.owner?.name || ''),
            total: Number(prev.total) || 0,
            ranks: JSON.parse(JSON.stringify(prev.ranks || {})),
            scores: JSON.parse(JSON.stringify(prev.scores || {}))
        }
    };

    if (!historyRow.ranks.total) {
        historyRow.ranks.total = {
            class: historyRow.classRank,
            school: historyRow.schoolRank,
            township: historyRow.townRank
        };
    }

    PREV_DATA = [historyRow];
    if (typeof performSilentMatching === 'function') {
        try { performSilentMatching(); } catch (e) { console.warn('云端历史匹配失败:', e); }
    }
    return true;
}

function clearCloudStudentCompareContext() {
    CLOUD_STUDENT_COMPARE_CONTEXT = null;
    restorePrevDataFromCloudCompare();
}

function applyCloudStudentCompareContext(payload, compareStudent, allCompareStudents) {
    if (!compareStudent || !Array.isArray(compareStudent.periods) || compareStudent.periods.length < 2) {
        clearCloudStudentCompareContext();
        return null;
    }

    const periods = compareStudent.periods;
    const isExamKeyMatch = (a, b) => isExamKeyEquivalentForCompare(a, b);
    const currentExamId = String(getEffectiveCurrentExamId() || '').trim();
    let latestIndex = periods.length - 1;
    if (currentExamId) {
        const idx = periods.findIndex(p => isExamKeyMatch(p?.examId, currentExamId));
        if (idx >= 0) latestIndex = idx;
    }
    if (latestIndex < 0 && Array.isArray(payload?.examIds) && payload.examIds.length > 0) {
        const expectLatest = payload.examIds[payload.examIds.length - 1];
        const idx = periods.findIndex(p => isExamKeyMatch(p?.examId, expectLatest));
        if (idx >= 0) latestIndex = idx;
    }

    let prevIndex = latestIndex - 1;
    if (prevIndex < 0) {
        // If latest is the first one, try the next one (for 2-period comparisons where latest is manually set)
        prevIndex = (latestIndex + 1 < periods.length) ? latestIndex + 1 : -1;
    }
    // If still invalid or out of bounds, fallback to any other period
    if (prevIndex < 0 || prevIndex >= periods.length || prevIndex === latestIndex) {
        prevIndex = periods.findIndex((_, i) => i !== latestIndex);
    }

    const prevPeriod = periods[prevIndex] || null;
    const latestPeriod = periods[latestIndex] || null;
    if (!prevPeriod || !latestPeriod) {
        clearCloudStudentCompareContext();
        return null;
    }

    const prevScores = {};
    const prevRanks = { total: { class: prevPeriod.rankClass ?? '-', school: prevPeriod.rankSchool ?? '-', township: prevPeriod.rankTown ?? '-' } };
    Object.entries(prevPeriod.subjects || {}).forEach(([subject, info]) => {
        const score = Number(info?.score);
        if (Number.isFinite(score)) prevScores[subject] = score;
        prevRanks[subject] = {
            class: info?.rankClass ?? '-',
            school: info?.rankSchool ?? '-',
            township: info?.rankTown ?? '-'
        };
    });

    const previousSubjectScores = {};
    (allCompareStudents || []).forEach(stu => {
        const period = (stu?.periods || []).find(p => isExamKeyMatch(p?.examId, prevPeriod.examId));
        if (!period) return;
        Object.entries(period.subjects || {}).forEach(([subject, info]) => {
            const score = Number(info?.score);
            if (!Number.isFinite(score)) return;
            if (!previousSubjectScores[subject]) previousSubjectScores[subject] = [];
            previousSubjectScores[subject].push(score);
        });
    });

    CLOUD_STUDENT_COMPARE_CONTEXT = {
        key: payload?.key || '',
        title: payload?.title || '',
        owner: {
            name: String(compareStudent.name || '').trim(),
            class: normalizeClass(compareStudent.class || ''),
            school: String(payload?.school || '').trim()
        },
        prevExamId: prevPeriod.examId || '',
        latestExamId: latestPeriod.examId || '',
        previousSubjectScores,
        previousRecord: {
            name: compareStudent.name,
            class: compareStudent.class,
            school: payload?.school || '',
            total: Number(prevPeriod.total) || 0,
            classRank: prevPeriod.rankClass ?? '-',
            schoolRank: prevPeriod.rankSchool ?? '-',
            townRank: prevPeriod.rankTown ?? '-',
            scores: prevScores,
            ranks: prevRanks,
            _sourceExam: prevPeriod.examId || ''
        }
    };
    return CLOUD_STUDENT_COMPARE_CONTEXT;
}

function isCloudContextMatchStudent(student) {
    if (!CLOUD_STUDENT_COMPARE_CONTEXT || !student) return false;

    const owner = CLOUD_STUDENT_COMPARE_CONTEXT.owner || {};
    const targetName = normalizeCompareName(student.name || '');
    const targetClass = String(student.class || '');
    const ownerName = normalizeCompareName(owner.name || '');
    const ownerClass = String(owner.class || '');

    const nameMatch = targetName === ownerName;
    const classMatch = isClassEquivalent(targetClass, ownerClass);

    if (!nameMatch || !classMatch) {
        // 仅在调试时开启，避免刷屏
        // console.debug(`[云端对比] 上下文不匹配: 目标(${targetName}, ${targetClass}) vs 所有者(${ownerName}, ${ownerClass})`);
    }
    return nameMatch && classMatch;
}

function isCloudContextLikelyCurrentTarget(student) {
    if (!CLOUD_STUDENT_COMPARE_CONTEXT || !student) return false;
    const owner = CLOUD_STUDENT_COMPARE_CONTEXT.owner || {};
    const target = resolveCloudCompareTarget(getCurrentUser());
    const stuName = normalizeCompareName(student?.name || '');
    const ownerName = normalizeCompareName(owner?.name || '');
    const targetName = normalizeCompareName(target?.name || '');
    const ownerClass = String(owner?.class || '');
    const targetClass = String(target?.class || '');
    const stuClass = String(student?.class || '');

    const nameMatchByOwner = !!ownerName && stuName === ownerName;
    const nameMatchByTarget = !!targetName && stuName === targetName;
    const classMatchByOwner = !!ownerClass && isClassEquivalent(stuClass, ownerClass);
    const classMatchByTarget = !!targetClass && isClassEquivalent(stuClass, targetClass);

    if (nameMatchByOwner && (classMatchByOwner || !ownerClass)) return true;
    if (nameMatchByTarget && (classMatchByTarget || !targetClass)) return true;
    if (nameMatchByOwner || nameMatchByTarget) return true;
    return false;
}

// Report compare runtime moved to public/assets/js/report-compare-runtime.js


function listAvailableSchoolsForCompare() {
    const names = new Map();
    const collectName = (rawName) => {
        const school = String(rawName || '').trim();
        if (!school) return;
        const key = normalizeSchoolName(school) || school;
        const existing = names.get(key);
        names.set(key, existing ? pickPreferredSchoolDisplayName(existing, school) : school);
    };
    Object.keys(SCHOOLS || {}).forEach(collectName);

    (RAW_DATA || []).forEach(row => {
        collectName(row?.school);
    });

    Object.values(window.TEACHER_SCHOOL_MAP || {}).forEach(collectName);

    const persistedSchool = String(localStorage.getItem('MY_SCHOOL') || '').trim();
    const runtimeSchool = String(MY_SCHOOL || '').trim();
    if (persistedSchool) collectName(persistedSchool);
    if (runtimeSchool) collectName(runtimeSchool);

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    if (db?.exams) {
        Object.values(db.exams).forEach(ex => {
            (ex?.data || []).forEach(row => {
                collectName(row?.school);
            });
        });
    }

    // 🟢 [修复]：增加黑名单，过滤掉教育局、管理员等非教学单位，防止污染下拉框
    const blockList = ['教育局', '教体局', '市局', '区局', '市直属', '区直属', 'admin', '测试', '默认'];
    const filteredNames = [...names.values()].filter(name => {
        if (/^Sheet\d+$/i.test(name)) return false; // 过滤残留的旧假表名
        for (let blocked of blockList) {
            if (name.includes(blocked) || name.toLowerCase() === blocked) return false;
        }
        return true;
    });

    return filteredNames.sort((a, b) => a.localeCompare(b, 'zh-CN'));
}

function getClassSchoolMapForAllData() {
    const map = {};

    Object.entries(window.TEACHER_SCHOOL_MAP || {}).forEach(([key, school]) => {
        const cls = normalizeClass(String(key || '').split('_')[0]);
        const sch = String(school || '').trim();
        if (cls && sch) map[cls] = sch;
    });

    Object.entries(SCHOOLS || {}).forEach(([school, payload]) => {
        (payload?.students || []).forEach(stu => {
            const cls = normalizeClass(stu?.class);
            if (cls && school && !map[cls]) map[cls] = school;
        });
    });

    (RAW_DATA || []).forEach(row => {
        const school = String(row?.school || '').trim();
        const cls = normalizeClass(row?.class);
        if (cls && school && !map[cls]) map[cls] = school;
    });

    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    if (db?.exams) {
        Object.values(db.exams).forEach(ex => {
            (ex?.data || []).forEach(row => {
                const school = String(row?.school || '').trim();
                const cls = normalizeClass(row?.class);
                if (cls && school && !map[cls]) map[cls] = school;
            });
        });
    }

    return map;
}

function inferDefaultSchoolFromContext() {
    const saved = String(MY_SCHOOL || localStorage.getItem('MY_SCHOOL') || '').trim();
    if (saved) return saved;
    const list = (typeof listAvailableSchoolsForCompare === 'function') ? listAvailableSchoolsForCompare() : [];
    return list.length === 1 ? list[0] : '';
}

// Macro compare result runtime moved to public/assets/js/macro-compare-result-runtime.js

// 校际云对比运行时已拆分到 public/assets/js/macro-compare-cloud-runtime.js

// Teacher compare result runtime moved to public/assets/js/teacher-compare-result-runtime.js


function loadPreviousData(input) {
    const file = input.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const wb = XLSX.read(data, { type: 'array' });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });

            if (json.length < 2) throw new Error("表格数据太少");

            const headers = json[0].map(h => String(h).trim());
            let idxName = -1, idxSchool = -1, idxTotal = -1, idxClass = -1;

            // 1. 识别基础列
            headers.forEach((h, i) => {
                if (h.includes('姓名')) idxName = i;
                if (h.includes('学校')) idxSchool = i;
                if (h.includes('班级') || h.toLowerCase() === 'class') idxClass = i;
                if (h.includes('总分') || h.includes('Total') || h === '得分') idxTotal = i;
            });

            // 🔥🔥 [核心修改点开始]：智能判断要累加哪些科目 🔥🔥
            let subjectIndices = [];
            let calcModeInfo = "全科累加";

            // 如果表格里没有“总分”列，我们需要自己算
            if (idxTotal === -1) {
                let targetSubjects = [];

                // 读取全局配置 CONFIG，判断当前是 9年级模式 还是 6-8年级模式
                if (CONFIG && Array.isArray(CONFIG.totalSubs)) {
                    // 👉 9年级模式：只寻找 ['语文','数学','英语','物理','化学']
                    targetSubjects = CONFIG.totalSubs;
                    calcModeInfo = "9年级五科";
                } else {
                    // 👉 其他模式：寻找所有常见科目
                    targetSubjects = ['语文', '数学', '英语', '物理', '化学', '政治', '历史', '地理', '生物', '科学', '道法'];
                }

                // 遍历表头，记录符合要求的列索引
                headers.forEach((h, i) => {
                    if (targetSubjects.some(sub => h.includes(sub))) {
                        subjectIndices.push(i);
                    }
                });
            }
            // 🔥🔥 [核心修改点结束] 🔥🔥

            if (idxName === -1) { alert('上传失败：无法识别“姓名”列。'); return; }

            // 3. 开始解析数据
            PREV_DATA = [];
            for (let i = 1; i < json.length; i++) {
                const r = json[i];
                if (!r[idxName]) continue;

                const school = idxSchool !== -1 ? r[idxSchool] : '默认学校';
                const className = idxClass !== -1 ? normalizeClass(r[idxClass]) : '';

                let score = 0;

                // 策略A: 优先信赖Excel自带的总分
                if (idxTotal !== -1) {
                    score = parseFloat(r[idxTotal]);
                }
                // 策略B: 自动求和 (受控于上面的 9年级 逻辑)
                else if (subjectIndices.length > 0) {
                    let tempSum = 0;
                    let hasVal = false;
                    subjectIndices.forEach(idx => {
                        const val = parseFloat(r[idx]);
                        if (!isNaN(val)) {
                            tempSum += val;
                            hasVal = true;
                        }
                    });
                    if (hasVal) score = tempSum;
                    else score = NaN;
                } else {
                    alert('上传失败：未找到总分列，也未匹配到当前模式所需的学科列。');
                    return;
                }

                if (!isNaN(score)) {
                    PREV_DATA.push({ name: r[idxName], school: school, class: className, total: score });
                }
            }

            if (PREV_DATA.length === 0) { alert('未读取到有效数据'); return; }

            // 4. 重新计算排名
            PREV_DATA.sort((a, b) => b.total - a.total);
            PREV_DATA.forEach((s, i) => {
                if (i > 0 && Math.abs(s.total - PREV_DATA[i - 1].total) < 0.001) {
                    s.rank = PREV_DATA[i - 1].rank;
                } else {
                    s.rank = i + 1;
                }
            });

            let msg = `✅ 上次考试数据加载成功！共 ${PREV_DATA.length} 条。`;
            if (idxTotal === -1) msg += `\n(注：未提供总分，已按【${calcModeInfo}】模式自动累加 ${subjectIndices.length} 科成绩)`;

            alert(msg);

            // 刷新可能存在的状态提示
            const statusDiv = document.getElementById('va-data-status');
            if (statusDiv) statusDiv.innerHTML = '✅ 数据就绪 (已更新)';

        } catch (err) {
            console.error(err);
            alert("解析出错：" + err.message);
        }
    };
    reader.readAsArrayBuffer(file);
}
// --- 进退步分析 (含同名/转班智能拦截) ---

// 进退步/增值评价运行时已拆分到 public/assets/js/progress-analysis-runtime.js

function exportSummaryTable() {
    if (!Object.keys(SCHOOLS).length) return alert("无数据");

    const isGrade9 = CONFIG.name && CONFIG.name.includes('9');

    // 1. 准备数据
    const list = Object.values(SCHOOLS).map(s => {
        const s1 = s.score2Rate || 0;
        const s2 = s.scoreBottom || 0;
        const s3 = isGrade9 ? (s.scoreInd || 0) : 0;
        // 获取高分赋分
        const s4 = (isGrade9 && s.highScoreStats) ? (s.highScoreStats.score || 0) : 0;
        // 计算包含高分赋分的总分
        const total = s1 + s2 + s3 + s4;

        return { name: s.name, s1, s2, s3, s4, total };
    });

    // 2. 排序
    list.sort((a, b) => b.total - a.total).forEach((d, i) => d.rank = i + 1);

    const wb = XLSX.utils.book_new();

    // 3. 构建表头
    const headers = ["学校名称", "两率一分得分", "后1/3得分", "指标生得分"];
    if (isGrade9) headers.push("高分段赋分(50)");
    headers.push("综合总分", "总排名");

    const wsData = [headers];

    // 4. 填充数据
    list.forEach(d => {
        const row = [
            d.name,
            getExcelNum(d.s1),
            getExcelNum(d.s2),
            getExcelNum(d.s3)
        ];

        // 如果是9年级，插入高分赋分列数据
        if (isGrade9) row.push(getExcelNum(d.s4));

        row.push(getExcelNum(d.total), d.rank);

        wsData.push(row);
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "综合分析报告");
    XLSX.writeFile(wb, `综合分析报告_${CONFIG.name}.xlsx`);
}

async function exportPPTReportLegacy() {
    if (!Object.keys(SCHOOLS).length || !Object.values(SCHOOLS)[0].score2Rate) {
        alert("请先上传数据并点击【生成总排名】按钮，确保所有指标已计算。"); return;
    }
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9'; pptx.author = '成绩分析系统'; pptx.title = `${CONFIG.name} 成绩分析报告`;
    const COLORS = { primary: "2563EB", light: "EFF6FF", header: "1E293B", text: "333333" };

    // 母版
    pptx.defineSlideMaster({
        title: 'MASTER_SLIDE', background: { color: "FFFFFF" },
        objects: [
            { rect: { x: 0, y: 0, w: "100%", h: 0.15, fill: COLORS.primary } },
            { text: { text: "内部资料 · 仅供教研", x: 0.5, y: 7.2, w: 3, h: 0.3, fontSize: 10, color: "94A3B8" } },
            { text: { text: "生成日期: " + new Date().toLocaleDateString(), x: 10.5, y: 7.2, w: 2.5, h: 0.3, fontSize: 10, color: "94A3B8", align: 'right' } }
        ], slideNumber: { x: 12.8, y: 7.2, fontSize: 10, color: "94A3B8" }
    });

    // 1. 封面
    let slide = pptx.addSlide(); slide.background = { color: COLORS.light };
    slide.addText(`${CONFIG.name} 教学质量分析报告`, { x: 1, y: 2.5, w: "80%", h: 1, fontSize: 36, bold: true, color: COLORS.primary, align: 'center', fontFace: "微软雅黑" });
    slide.addText(`数据范围：${Object.keys(SCHOOLS).length} 所学校 | ${RAW_DATA.length} 名学生`, { x: 1, y: 3.5, w: "80%", h: 0.5, fontSize: 18, color: COLORS.header, align: 'center' });
    slide.addText("教务处 / 自动生成", { x: 1, y: 6, w: "80%", h: 0.5, fontSize: 14, color: "64748b", align: 'center' });

    // 2. 总排名表
    slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    slide.addText("🏆 综合考核总排名", { x: 0.5, y: 0.5, fontSize: 20, bold: true, color: COLORS.primary });
    const summaryList = Object.values(SCHOOLS).sort((a, b) => (a.rank2Rate || 999) - (b.rank2Rate || 999));
    const headers = [
        { text: "排名", options: { fill: COLORS.primary, color: "FFFFFF", bold: true, align: 'center' } },
        { text: "学校", options: { fill: COLORS.primary, color: "FFFFFF", bold: true } },
        { text: "参考人数", options: { fill: COLORS.primary, color: "FFFFFF", bold: true, align: 'center' } },
        { text: "综合均分", options: { fill: COLORS.primary, color: "FFFFFF", bold: true, align: 'center' } },
        { text: "优秀率", options: { fill: COLORS.primary, color: "FFFFFF", bold: true, align: 'center' } },
        { text: "及格率", options: { fill: COLORS.primary, color: "FFFFFF", bold: true, align: 'center' } },
        { text: "总考核分", options: { fill: COLORS.primary, color: "FFFFFF", bold: true, align: 'center' } }
    ];
    const rows = [headers];
    summaryList.forEach((s, i) => {
        const m = s.metrics.total || {}; const bg = (i % 2 !== 0) ? "F8FAFC" : "FFFFFF"; const rankColor = i < 3 ? "DC2626" : "333333";
        rows.push([
            { text: i + 1, options: { fill: bg, color: rankColor, bold: i < 3, align: 'center' } },
            { text: s.name, options: { fill: bg, color: "333333", bold: true } },
            { text: m.count || 0, options: { fill: bg, align: 'center' } },
            { text: m.avg ? m.avg.toFixed(2) : '-', options: { fill: bg, align: 'center' } },
            { text: m.excRate ? (m.excRate * 100).toFixed(2) + '%' : '-', options: { fill: bg, align: 'center' } },
            { text: m.passRate ? (m.passRate * 100).toFixed(2) + '%' : '-', options: { fill: bg, align: 'center' } },
            { text: (s.score2Rate || 0).toFixed(2), options: { fill: bg, color: "B45309", bold: true, align: 'center' } }
        ]);
    });
    slide.addTable(rows, { x: 0.5, y: 1.2, w: 12.3, fontSize: 11, border: { pt: 1, color: "E2E8F0" } });

    // 3. 全科对比图
    slide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
    slide.addText("📊 全镇各校平均分对比", { x: 0.5, y: 0.5, fontSize: 20, bold: true, color: COLORS.primary });
    slide.addChart(pptx.ChartType.bar, [{ name: "平均分", labels: summaryList.map(s => s.name), values: summaryList.map(s => s.metrics.total ? Number(s.metrics.total.avg.toFixed(2)) : 0) }], { x: 0.5, y: 1.2, w: 12.3, h: 5.5, barDir: 'col', barGapWidthPct: 50, chartColors: [COLORS.primary], dataLabelFormatCode: "0.0", dataLabelPosition: "outEnd", showValue: true, showLegend: false });

    // 4. 各科循环
    SUBJECTS.forEach(sub => {
        const subSlide = pptx.addSlide({ masterName: 'MASTER_SLIDE' });
        subSlide.addText(`📘 学科分析：${sub}`, { x: 0.5, y: 0.5, fontSize: 20, bold: true, color: COLORS.primary });
        const subData = Object.values(SCHOOLS).filter(s => s.metrics[sub]).sort((a, b) => b.metrics[sub].avg - a.metrics[sub].avg);
        if (subData.length === 0) return;
        // 表格
        const subHeaders = [{ text: "排名", options: { fill: "E0F2FE", color: "0369A1", bold: true } }, { text: "学校", options: { fill: "E0F2FE", color: "0369A1", bold: true } }, { text: "均分", options: { fill: "E0F2FE", color: "0369A1", bold: true } }, { text: "优率%", options: { fill: "E0F2FE", color: "0369A1", bold: true } }, { text: "及格%", options: { fill: "E0F2FE", color: "0369A1", bold: true } }];
        const subRows = [subHeaders];
        subData.forEach((s, i) => { const m = s.metrics[sub]; subRows.push([i + 1, s.name, m.avg.toFixed(1), (m.excRate * 100).toFixed(1), (m.passRate * 100).toFixed(1)]); });
        subSlide.addTable(subRows, { x: 0.5, y: 1.2, w: 6, fontSize: 10, rowH: 0.4, border: { color: "CBD5E1" } });
        // 图表
        subSlide.addChart(pptx.ChartType.bar, [{ name: "均分", labels: subData.map(s => s.name), values: subData.map(s => s.metrics[sub].avg) }], { x: 7, y: 1.2, w: 5.8, h: 5, barDir: 'bar', chartColors: ["16A34A"], showValue: true, dataLabelPosition: "outEnd", showLegend: false, title: { text: `${sub} - 校际排名`, fontSize: 12 } });
        // 诊断
        const top = subData[0], bot = subData[subData.length - 1];
        subSlide.addText(`诊断：${sub}最高分 ${top.name}(${top.metrics[sub].avg.toFixed(1)})，最低分 ${bot.name}，极差 ${(top.metrics[sub].avg - bot.metrics[sub].avg).toFixed(1)}分。`, { x: 0.5, y: 6.5, w: 12, h: 0.5, fontSize: 11, color: "666666", italic: true, fill: "F1F5F9" });
    });

    pptx.writeFile({ fileName: `${CONFIG.name}_成绩汇报_${new Date().toISOString().slice(0, 10)}.pptx` });
}

function buildTeacherExportTag(user, subjectSet) {
    const dateStr = new Date().toISOString().slice(0, 10);
    const role = user?.role || 'guest';
    if (!(role === 'teacher' || role === 'class_teacher')) return dateStr;

    const safeName = String(user?.name || '教师')
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, '')
        .trim() || '教师';
    const subjects = Array.from(subjectSet || [])
        .map(s => normalizeSubject(s))
        .filter(Boolean);
    const subLabel = subjects.length === 0
        ? '本学科'
        : (subjects.length === 1 ? subjects[0] : `${subjects[0]}等${subjects.length}科`);
    return `${safeName}_${subLabel}_${dateStr}`;
}

function buildSafeSheetName(base, suffix = '') {
    const raw = `${String(base || '').trim()}${suffix ? '_' + String(suffix || '').trim() : ''}`;
    const cleaned = raw.replace(/[\\\/?*\[\]:]/g, '').trim() || 'Sheet';
    return cleaned.slice(0, 31);
}

function exportTeacherComparisonExcel() {
    const user = getCurrentUser();
    const role = user?.role || 'guest';
    const exportStats = (role === 'teacher' || role === 'class_teacher') ? getVisibleTeacherStats() : TEACHER_STATS;
    if (Object.keys(exportStats).length === 0) return alert("请先进行教师分析");
    const subjectSet = new Set();
    Object.values(exportStats).forEach(subMap => Object.keys(subMap || {}).forEach(s => subjectSet.add(s)));
    const gradeAverages = {};
    Array.from(subjectSet).forEach(subject => {
        if (SCHOOLS[MY_SCHOOL] && SCHOOLS[MY_SCHOOL].metrics[subject]) {
            gradeAverages[subject] = SCHOOLS[MY_SCHOOL].metrics[subject];
        }
    });
    const wb = XLSX.utils.book_new();
    const headerRow = ["教师姓名", "学科", "任教班级", "人数", "平均分(实际)", "与级比", "校排", "优秀率(实际)", "与级比", "校排", "及格率(实际)", "与级比", "校排", "综合得分", "综合排名"];
    const subjectTeachers = {};
    Object.keys(exportStats).forEach(teacher => {
        Object.keys(exportStats[teacher]).forEach(subject => {
            if (!subjectTeachers[subject]) subjectTeachers[subject] = [];
            const data = exportStats[teacher][subject]; const gradeAvg = gradeAverages[subject] || { avg: 0, excRate: 0, passRate: 0 };
            const avgComparison = gradeAvg.avg ? ((parseFloat(data.avg) - gradeAvg.avg) / gradeAvg.avg) : 0;
            const excComparison = gradeAvg.excRate ? ((data.excellentRate - gradeAvg.excRate) / gradeAvg.excRate) : 0;
            const passComparison = gradeAvg.passRate ? ((data.passRate - gradeAvg.passRate) / gradeAvg.passRate) : 0;
            subjectTeachers[subject].push({ teacher, data, avgComparison, excComparison, passComparison });
        });
    });
    Object.keys(subjectTeachers).sort(sortSubjects).forEach(subject => {
        const arr = subjectTeachers[subject];
        const setRank = (key, rankKey) => { arr.sort((a, b) => parseFloat(b.data[key]) - parseFloat(a.data[key])).forEach((item, i) => item[rankKey] = i + 1); };
        setRank('avg', 'avgRank'); setRank('excellentRate', 'excRank'); setRank('passRate', 'passRank');
        arr.forEach(item => { item.compositeScore = ((1 - (item.avgRank - 1) / arr.length) * 50 + (1 - (item.excRank - 1) / arr.length) * 30 + (1 - (item.passRank - 1) / arr.length) * 20); });
        arr.sort((a, b) => b.compositeScore - a.compositeScore).forEach((item, index) => { item.compositeRank = index + 1; });
        const wsData = [headerRow];
        arr.forEach(item => {
            const data = item.data;
            wsData.push([item.teacher, subject, data.classes, data.studentCount, getExcelNum(parseFloat(data.avg)), getExcelPercent(item.avgComparison), item.avgRank, getExcelPercent(data.excellentRate), getExcelPercent(item.excComparison), item.excRank, getExcelPercent(data.passRate), getExcelPercent(item.passComparison), item.passRank, getExcelNum(item.compositeScore), item.compositeRank]);
        });
        const comparisonSheetName = buildSafeSheetName(subject, '详细对比');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), comparisonSheetName);
    });
    const exportTag = buildTeacherExportTag(user, subjectSet);
    XLSX.writeFile(wb, `教师详细数据对比表_${exportTag}.xlsx`);
    if ((role === 'teacher' || role === 'class_teacher') && window.UI) {
        const subjectLabel = Array.from(subjectSet).map(s => normalizeSubject(s)).filter(Boolean).join('、') || '本学科';
        UI.toast(`✅ 已导出本学科范围：${subjectLabel}`, 'success');
    }
}

function exportTeacherTownshipRankExcel() {
    const user = getCurrentUser();
    const role = user?.role || 'guest';
    if (!Object.keys(TOWNSHIP_RANKING_DATA).length) return alert("无排名数据");
    const visibleSubjectSet = (role === 'teacher' || role === 'class_teacher') ? getVisibleSubjectsForTeacherUser(user) : null;
    const wb = XLSX.utils.book_new();
    const fileSubjectSet = new Set();
    SUBJECTS.forEach(sub => {
        if (visibleSubjectSet && visibleSubjectSet.size > 0 && !visibleSubjectSet.has(normalizeSubject(sub))) return;
        const data = TOWNSHIP_RANKING_DATA[sub];
        if (!data) return;
        fileSubjectSet.add(normalizeSubject(sub));
        const wsData = [["教师/学校", "类型", "平均分", "镇排", "优秀率", "镇排", "及格率", "镇排"]];
        data.forEach(item => { wsData.push([item.name, item.type === 'teacher' ? '教师' : '学校', getExcelNum(item.avg), item.rankAvg, getExcelPercent(item.excellentRate), item.rankExc, getExcelPercent(item.passRate), item.rankPass]); });
        const sheetName = buildSafeSheetName(sub, '乡镇排名');
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), sheetName);
    });
    const exportTag = buildTeacherExportTag(user, fileSubjectSet);
    XLSX.writeFile(wb, `教师乡镇排名_${exportTag}.xlsx`);
}

// ================= 报告查询逻辑（打印增强） =================

    Object.assign(window, {
        analyzeTeachers,
        generateTeacherPairing,
        calculateTeacherTownshipRanking,
        renderTeacherCards,
        showTeacherDetails,
        calculatePerformanceLevel,
        renderTeacherComparisonTable,
        renderTeacherTownshipRanking,
        updateCorrelationSchoolSelect,
        renderCorrelationAnalysis,
        buildTeacherExportTag,
        buildSafeSheetName,
        exportTeacherComparisonExcel,
        exportTeacherTownshipRankExcel
    });

    window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__ = true;
})();
