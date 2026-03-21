(() => {
    if (typeof window === 'undefined' || window.__STUDENT_COMPARE_GENERATE_RUNTIME_PATCHED__) return;

function renderStudentMultiPeriodComparison() {
    const schoolEl = document.getElementById('studentCompareSchool');
    const hintEl = document.getElementById('studentCompareHint');
    const summaryEl = document.getElementById('studentCompareSummary');
    const resultEl = document.getElementById('studentCompareResult');
    const countEl = document.getElementById('studentComparePeriodCount');
    const e1El = document.getElementById('studentCompareExam1');
    const e2El = document.getElementById('studentCompareExam2');
    const e3El = document.getElementById('studentCompareExam3');

    if (!schoolEl || !hintEl || !resultEl || !countEl || !e1El || !e2El || !e3El) return;

    const periodCount = parseInt(countEl.value || '2');
    const school = schoolEl.value;
    const examIds = periodCount === 3 ? [e1El.value, e2El.value, e3El.value] : [e1El.value, e2El.value];

    // 显示加载状态
    hintEl.innerHTML = '⏳ 正在生成对比数据，请稍候...';
    hintEl.style.color = '#3b82f6';
    resultEl.innerHTML = '';
    if (summaryEl) summaryEl.innerHTML = '';

    if (!school) {
        hintEl.innerHTML = '❌ 请先选择学校。';
        hintEl.style.color = '#dc2626';
        resultEl.innerHTML = '';
        return;
    }

    if (examIds.some(x => !x)) {
        hintEl.innerHTML = '❌ 请完整选择所有考试期次。';
        hintEl.style.color = '#dc2626';
        resultEl.innerHTML = '';
        return;
    }

    if (new Set(examIds).size !== examIds.length) {
        hintEl.innerHTML = '❌ 期次不能重复，请选择不同考试。';
        hintEl.style.color = '#dc2626';
        resultEl.innerHTML = '';
        return;
    }

    if (periodCount >= 2) {
        e1El.value = examIds[0] || '';
        e2El.value = examIds[1] || '';
        if (periodCount === 3) e3El.value = examIds[2] || '';
    }

    // 获取各期数据
    const examDataList = [];
    for (const examId of examIds) {
        const allRows = getExamRowsForCompare(examId);
        const schoolRows = filterRowsBySchool(allRows, school);

        if (schoolRows.length === 0) {
            hintEl.innerHTML = `❌ 在 "${examId}" 中找不到 "${school}" 的数据。`;
            hintEl.style.color = '#dc2626';
            resultEl.innerHTML = '';
            return;
        }

        examDataList.push({ examId, allRows, schoolRows });
    }

    // 判断是6-8年级还是9年级模式
    const is9thGrade = CONFIG.name === '9年级';
    const totalLabel = is9thGrade ? '五科总' : '全科总';

    // 获取科目列表
    const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
    let allSubjects = [];
    examIds.forEach(examId => {
        if (examId === CURRENT_EXAM_ID) {
            if (SUBJECTS && SUBJECTS.length > 0) {
                allSubjects = [...allSubjects, ...SUBJECTS];
            }
        } else if (db?.exams?.[examId]?.subjects) {
            allSubjects = [...allSubjects, ...db.exams[examId].subjects];
        }
    });
    allSubjects = [...new Set(allSubjects)].filter(s => s);

    // 收集所有学生姓名（跨期合并）
    const cleanName = n => String(n || '').replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    const allStudentNames = new Set();
    examDataList.forEach(({ schoolRows }) => {
        schoolRows.forEach(row => {
            const name = cleanName(row.name);
            if (name) allStudentNames.add(name);
        });
    });

    // 构建每个学生的多期数据
    let studentsCompareData = [];
    allStudentNames.forEach(cleanedName => {
        const studentPeriods = [];
        let displayName = cleanedName;
        let studentClass = '';

        examDataList.forEach(({ examId, allRows, schoolRows }) => {
            const studentRow = schoolRows.find(r => cleanName(r.name) === cleanedName);

            if (studentRow) {
                displayName = studentRow.name; // 使用原始姓名
                studentClass = studentRow.class || '';

                const classRows = schoolRows.filter(r => isClassEquivalent(r.class || '', studentClass || ''));
                const comparisonTotalSubjects = getComparisonTotalSubjects();
                const totalOf = (row) => getComparisonTotalValue(row, comparisonTotalSubjects) || 0;
                const normalizedTotal = getComparisonTotalValue(studentRow, comparisonTotalSubjects);
                const rankTownMap = buildCompetitionRankMap(allRows, r => cleanName(r.name), totalOf);
                const rankSchoolMap = buildCompetitionRankMap(schoolRows, r => cleanName(r.name), totalOf);
                const rankClassMap = buildCompetitionRankMap(classRows, r => cleanName(r.name), totalOf);

                const rankTown = rankTownMap.get(cleanedName) ?? null;
                const rankSchool = rankSchoolMap.get(cleanedName) ?? null;
                const rankClass = rankClassMap.get(cleanedName) ?? null;

                // 各科排名
                const subjectRanks = {};
                allSubjects.forEach(subject => {
                    const subScore = parseFloat(studentRow.scores?.[subject]);
                    if (!isNaN(subScore)) {
                        const getSubjectScore = row => parseFloat(row.scores?.[subject]) || 0;
                        const sortedBySub = allRows.filter(r => !isNaN(parseFloat(r.scores?.[subject])));
                        const sortedBySubSchool = schoolRows.filter(r => !isNaN(parseFloat(r.scores?.[subject])));
                        const sortedBySubClass = classRows.filter(r => !isNaN(parseFloat(r.scores?.[subject])));
                        const subjectTownMap = buildCompetitionRankMap(sortedBySub, r => cleanName(r.name), getSubjectScore);
                        const subjectSchoolMap = buildCompetitionRankMap(sortedBySubSchool, r => cleanName(r.name), getSubjectScore);
                        const subjectClassMap = buildCompetitionRankMap(sortedBySubClass, r => cleanName(r.name), getSubjectScore);

                        subjectRanks[subject] = {
                            score: subScore,
                            rankClass: subjectClassMap.get(cleanedName) ?? null,
                            rankTown: subjectTownMap.get(cleanedName) ?? null,
                            rankSchool: subjectSchoolMap.get(cleanedName) ?? null
                        };
                    }
                });

                studentPeriods.push({
                    examId,
                    total: normalizedTotal ?? studentRow.total ?? 0,
                    rankClass,
                    rankTown,
                    rankSchool,
                    subjects: subjectRanks
                });
            } else {
                // 该学生在此期次中不存在
                studentPeriods.push({
                    examId,
                    total: null,
                    rankClass: null,
                    rankTown: null,
                    rankSchool: null,
                    subjects: {}
                });
            }
        });

        // 计算进步幅度等元数据
        let scoreDiff = 0;
        let rankSchoolDiff = 0;
        let rankTownDiff = 0;
        if (studentPeriods.length >= 2) {
            const first = studentPeriods[0];
            const last = studentPeriods[studentPeriods.length - 1];
            if (first.total !== null && last.total !== null) {
                scoreDiff = last.total - first.total;
            }
            if (first.rankSchool !== null && last.rankSchool !== null) {
                rankSchoolDiff = first.rankSchool - last.rankSchool;
            }
            if (first.rankTown !== null && last.rankTown !== null) {
                rankTownDiff = first.rankTown - last.rankTown;
            }
        }

        // 判断进步类型：优先看镇排名，再看校排名，最后看总分
        let progressType = 'stable';
        if (rankTownDiff > 0 || (rankTownDiff === 0 && rankSchoolDiff > 0) || (rankTownDiff === 0 && rankSchoolDiff === 0 && scoreDiff > 1)) {
            progressType = 'improve';
        } else if (rankTownDiff < 0 || (rankTownDiff === 0 && rankSchoolDiff < 0) || (rankTownDiff === 0 && rankSchoolDiff === 0 && scoreDiff < -1)) {
            progressType = 'decline';
        }

        studentsCompareData.push({
            name: displayName,
            cleanName: cleanedName,
            class: studentClass,
            periods: studentPeriods,
            // 元数据
            scoreDiff,
            rankSchoolDiff,
            rankTownDiff,
            latestTotal: studentPeriods[studentPeriods.length - 1]?.total || 0,
            progressType
        });
    });

    // 🔐 权限控制：根据角色筛选班级
    const user = getCurrentUser();
    console.log('[学生对比] 当前用户:', user);

    // 🆕 使用多角色检查
    if (user && RoleManager.hasAnyRole(user, ['teacher', 'class_teacher']) &&
        !RoleManager.hasAnyRole(user, ['admin', 'director', 'grade_director'])) {
        // 纯教师或班主任角色（不含管理员权限）：只能看自己任教的班级
        console.log('[学生对比] 🔒 检测到教师角色，启用权限过滤');
        const scope = getTeacherScopeForUser(user);
        const allowedClasses = scope.classes;

        if (allowedClasses.size > 0) {
            const originalCount = studentsCompareData.length;
            console.log(`[学生对比] 过滤前学生数: ${originalCount}`);
            console.log('[学生对比] 数据中的班级:', [...new Set(studentsCompareData.map(s => s.class))]);

            studentsCompareData = studentsCompareData.filter(s => {
                const cls = normalizeClass(s.class);
                const hasPermission = allowedClasses.has(cls);
                if (!hasPermission) {
                    console.log(`[学生对比] ❌ 过滤掉班级 ${s.class} (规范化: ${cls})`);
                }
                return hasPermission;
            });

            const roles = RoleManager.getUserRoles(user).join(', ');
            console.log(`🔐 权限筛选：${roles} ${user.name} 只能查看 ${allowedClasses.size} 个班级，筛选前${originalCount}人，筛选后${studentsCompareData.length}人`);

            if (studentsCompareData.length === 0) {
                hintEl.innerHTML = `⚠️ 您没有权限查看该校学生数据，或您任教的班级不在此学校。`;
                hintEl.style.color = '#f59e0b';
                resultEl.innerHTML = '';
                console.error('[学生对比] ⚠️ 过滤后无数据');
                return;
            }
        } else {
            hintEl.innerHTML = `⚠️ 未找到您的任课信息，请先在【数据管理 - 教师任课】中配置。`;
            hintEl.style.color = '#dc2626';
            resultEl.innerHTML = '';
            console.error('[学生对比] ⚠️ 未找到任课信息');
            return;
        }
    } else {
        console.log('[学生对比] ℹ️ 管理员或非教师角色，不过滤数据');
    }

    // 按班级和姓名排序（默认）
    studentsCompareData.sort((a, b) => {
        const classCompare = (a.class || '').localeCompare(b.class || '', 'zh-CN');
        if (classCompare !== 0) return classCompare;
        return (a.name || '').localeCompare(b.name || '', 'zh-CN');
    });

    // 延迟渲染避免阻塞UI
    setTimeout(() => {
        STUDENT_MULTI_PERIOD_COMPARE_CACHE = {
            school, examIds, periodCount, studentsCompareData, subjects: allSubjects,
            currentPage: 1,
            pageSize: 20,
            originalStudentsCompareData: [...studentsCompareData],
            activeNameFilters: [],
            activeProgressFilter: '',
            activeClassFilter: ''
        };

        // 🟢 [新增]：更新班级下拉选项
        updateClassGroupOptions();

        // 生成统计概览
        updateStudentCompareSummary();

        renderStudentComparePage(1);
        hintEl.innerHTML = `✅ 已生成 ${school} 的 ${studentsCompareData.length} 名学生 ${periodCount} 期对比`;
        hintEl.style.color = '#16a34a';
    }, 100);
}

    Object.assign(window, {
        renderStudentMultiPeriodComparison
    });

    window.__STUDENT_COMPARE_GENERATE_RUNTIME_PATCHED__ = true;
})();
