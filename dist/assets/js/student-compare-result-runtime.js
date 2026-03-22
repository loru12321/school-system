(() => {
    if (typeof window === 'undefined' || window.__STUDENT_COMPARE_RESULT_RUNTIME_PATCHED__) return;

    const readStudentCompareCacheState = typeof window.readStudentCompareCacheState === 'function'
        ? window.readStudentCompareCacheState
        : (() => (window.STUDENT_MULTI_PERIOD_COMPARE_CACHE && typeof window.STUDENT_MULTI_PERIOD_COMPARE_CACHE === 'object'
            ? window.STUDENT_MULTI_PERIOD_COMPARE_CACHE
            : null));

function renderStudentComparePage(page) {
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();
    if (!STUDENT_MULTI_PERIOD_COMPARE_CACHE) return;

    const resultEl = document.getElementById('studentCompareResult');
    const paginationEl = document.getElementById('studentComparePagination');
    const paginationInfoEl = document.getElementById('studentComparePaginationInfo');
    const paginationBtnsEl = document.getElementById('studentComparePaginationButtons');

    if (!resultEl) return;

    const { school, examIds, periodCount, studentsCompareData, subjects, pageSize } = STUDENT_MULTI_PERIOD_COMPARE_CACHE;
    STUDENT_MULTI_PERIOD_COMPARE_CACHE.currentPage = page;

    // 判断是6-8年级还是9年级模式
    const is9thGrade = CONFIG.name === '9年级';
    const totalLabel = is9thGrade ? '五科总' : '全科总';

    // 直接使用studentsCompareData（已经包含筛选和排序后的数据）
    const visibleStudents = studentsCompareData;

    // 分页计算
    const totalCount = visibleStudents.length;
    const totalPages = Math.ceil(totalCount / pageSize);
    const startIdx = (page - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, totalCount);
    const pageStudents = visibleStudents.slice(startIdx, endIdx);

    // 生成学生卡片HTML
    let html = '';
    pageStudents.forEach((student, idx) => {
        html += generateStudentCard(student, periodCount, totalLabel, subjects);
    });

    resultEl.innerHTML = html;

    // 更新分页控件
    if (paginationEl && totalCount > 10) {
        paginationEl.style.display = 'flex';

        if (paginationInfoEl) {
            paginationInfoEl.textContent = `显示 ${startIdx + 1}-${endIdx} / 共 ${totalCount} 人`;
        }

        if (paginationBtnsEl) {
            let btnsHtml = '';

            // 上一页
            btnsHtml += `<button class="btn btn-sm" onclick="renderStudentComparePage(${page - 1})" ${page <= 1 ? 'disabled' : ''} style="padding:3px 10px;">◀ 上一页</button>`;

            // 页码按钮
            const maxButtons = 5;
            let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
            let endPage = Math.min(totalPages, startPage + maxButtons - 1);

            if (endPage - startPage < maxButtons - 1) {
                startPage = Math.max(1, endPage - maxButtons + 1);
            }

            if (startPage > 1) {
                btnsHtml += `<button class="btn btn-sm" onclick="renderStudentComparePage(1)" style="padding:3px 10px;">1</button>`;
                if (startPage > 2) btnsHtml += `<span style="padding:3px 8px;">...</span>`;
            }

            for (let i = startPage; i <= endPage; i++) {
                const isActive = i === page;
                btnsHtml += `<button class="btn btn-sm ${isActive ? 'btn-blue' : ''}" onclick="renderStudentComparePage(${i})" style="padding:3px 10px; ${isActive ? 'font-weight:bold;' : ''}">${i}</button>`;
            }

            if (endPage < totalPages) {
                if (endPage < totalPages - 1) btnsHtml += `<span style="padding:3px 8px;">...</span>`;
                btnsHtml += `<button class="btn btn-sm" onclick="renderStudentComparePage(${totalPages})" style="padding:3px 10px;">${totalPages}</button>`;
            }

            // 下一页
            btnsHtml += `<button class="btn btn-sm" onclick="renderStudentComparePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''} style="padding:3px 10px;">下一页 ▶</button>`;

            paginationBtnsEl.innerHTML = btnsHtml;
        }
    } else if (paginationEl) {
        paginationEl.style.display = 'none';
    }

    // 滚动到对比结果区域
    setTimeout(() => {
        const section = document.getElementById('student-multi-period-compare-section');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
}

function generateStudentCard(student, periodCount, totalLabel, subjects) {
    // 视觉高亮背景
    let cardBg = '#f8fafc';
    let badge = '';
    let trendIcon = '';

    if (student.scoreDiff >= 10) {
        cardBg = '#f0fdf4';
        badge = '<span style="background:#16a34a; color:white; padding:2px 8px; border-radius:12px; font-size:11px; margin-left:8px;">⭐大幅进步</span>';
        trendIcon = '↑↑';
    } else if (student.scoreDiff > 1 && student.scoreDiff < 10) {
        trendIcon = '↑';
    } else if (student.scoreDiff <= -10) {
        cardBg = '#fef2f2';
        badge = '<span style="background:#dc2626; color:white; padding:2px 8px; border-radius:12px; font-size:11px; margin-left:8px;">⚠️需关注</span>';
        trendIcon = '↓↓';
    } else if (student.scoreDiff < -1 && student.scoreDiff > -10) {
        trendIcon = '↓';
    } else {
        trendIcon = '→';
    }

    if (student.rankSchoolDiff >= 5 && !badge) {
        badge = '<span style="background:#10b981; color:white; padding:2px 8px; border-radius:12px; font-size:11px; margin-left:8px;">↑排名提升</span>';
    }

    let html = `
            <div class="student-compare-card" data-student-name="${student.cleanName}" data-progress-type="${student.progressType}" style="margin-bottom:15px; border:1px solid #e2e8f0; border-radius:8px; padding:15px; background:${cardBg};">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
                    <div class="sub-header" style="font-size:14px; margin:0;">
                        👤 ${student.name} ${student.class ? `(${student.class})` : ''}${badge}
                        ${periodCount > 1 ? `<span style="font-size:20px; margin-left:8px;">${trendIcon}</span>` : ''}
                    </div>
                    <button class="btn btn-sm btn-gray" onclick="toggleStudentDetail(this)" style="font-size:11px; padding:3px 10px;">展开详情 ▼</button>
                </div>
        `;

    // 总分对比表
    html += `
            <div style="font-weight:bold; margin-top:10px; margin-bottom:5px; font-size:13px;">📈 总分成绩对比</div>
            <div class="table-wrap">
                <table class="mobile-card-table" style="font-size:12px;">
                    <thead>
                        <tr>
                            <th>期次</th>
                            <th>${totalLabel}</th>
                            <th>级部排名</th>
                            <th>镇排名</th>
                            ${periodCount > 1 ? '<th>总分变化</th><th>级排变化</th><th>镇排变化</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
        `;

    student.periods.forEach((p, idx) => {
        const prevPeriod = idx > 0 ? student.periods[idx - 1] : null;
        const scoreDiff = (prevPeriod && p.total !== null && prevPeriod.total !== null) ? (p.total - prevPeriod.total) : 0;
        const schoolRankDiff = (prevPeriod && p.rankSchool !== null && prevPeriod.rankSchool !== null) ? (prevPeriod.rankSchool - p.rankSchool) : 0;
        const townRankDiff = (prevPeriod && p.rankTown !== null && prevPeriod.rankTown !== null) ? (prevPeriod.rankTown - p.rankTown) : 0;

        html += `<tr>
                <td><strong>${p.examId}</strong></td>
                <td>${p.total !== null ? p.total.toFixed(1) : '-'}</td>
                <td>${p.rankSchool !== null ? p.rankSchool : '-'}</td>
                <td>${p.rankTown !== null ? p.rankTown : '-'}</td>`;

        if (periodCount > 1) {
            html += `
                    <td style="color:${scoreDiff >= 0 ? 'var(--success)' : 'var(--danger)'};">
                        ${idx === 0 || p.total === null || prevPeriod.total === null ? '-' : (scoreDiff >= 0 ? '+' : '') + scoreDiff.toFixed(1)}
                    </td>
                    <td style="font-weight:bold; color:${schoolRankDiff >= 0 ? 'var(--success)' : 'var(--danger)'};">
                        ${idx === 0 || p.rankSchool === null || prevPeriod.rankSchool === null ? '-' : (schoolRankDiff >= 0 ? '+' : '') + schoolRankDiff}
                    </td>
                    <td style="font-weight:bold; color:${townRankDiff >= 0 ? 'var(--success)' : 'var(--danger)'};">
                        ${idx === 0 || p.rankTown === null || prevPeriod.rankTown === null ? '-' : (townRankDiff >= 0 ? '+' : '') + townRankDiff}
                    </td>
                `;
        }

        html += `</tr>`;
    });

    html += `</tbody></table></div>`;

    // 各科成绩对比表（默认折叠）
    if (subjects.length > 0) {
        html += `
                <div class="student-detail-section" style="display:none; margin-top:15px;">
                    <div style="font-weight:bold; margin-bottom:5px; font-size:13px;">📚 各科成绩对比</div>
                    <div class="table-wrap">
                        <table class="mobile-card-table" style="font-size:11px;">
                            <thead>
                                <tr>
                                    <th>科目</th>
            `;

        student.periods.forEach(p => {
            html += `<th colspan="3" style="background:#f1f5f9;">${p.examId}</th>`;
        });

        html += `</tr><tr><th></th>`;
        student.periods.forEach(() => {
            html += `<th>成绩</th><th>级排</th><th>镇排</th>`;
        });
        html += `</tr></thead><tbody>`;

        subjects.forEach(subject => {
            html += `<tr><td><strong>${subject}</strong></td>`;

            student.periods.forEach(p => {
                const subData = p.subjects[subject];
                if (subData) {
                    html += `
                            <td>${subData.score}</td>
                            <td>${subData.rankSchool}</td>
                            <td>${subData.rankTown}</td>
                        `;
                } else {
                    html += `<td>-</td><td>-</td><td>-</td>`;
                }
            });

            html += `</tr>`;
        });

        html += `</tbody></table></div></div>`;
    }

    html += `</div>`;
    return html;
}

function showStudentComparePopup(student) {
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();
    if (!student || typeof Swal === 'undefined' || !STUDENT_MULTI_PERIOD_COMPARE_CACHE) return false;

    const { periodCount, subjects } = STUDENT_MULTI_PERIOD_COMPARE_CACHE;
    const totalLabel = CONFIG.name === '9年级' ? '五科总' : '全科总';
    const popupHtml = generateStudentCard(student, periodCount, totalLabel, subjects);

    Swal.fire({
        title: `${student.name}${student.class ? ` (${student.class})` : ''}`,
        html: `<div id="student-compare-popup" style="max-height:70vh; overflow:auto; text-align:left;">${popupHtml}</div>`,
        width: 980,
        showConfirmButton: false,
        showCloseButton: true,
        didOpen: () => {
            const container = document.getElementById('student-compare-popup');
            if (!container) return;
            const detail = container.querySelector('.student-detail-section');
            const btn = container.querySelector('button[onclick^="toggleStudentDetail"]');
            if (detail) detail.style.display = 'block';
            if (btn) btn.remove();
        }
    });

    return true;
}

function changePageSize() {
    const pageSizeEl = document.getElementById('studentComparePageSize');
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();
    if (!pageSizeEl || !STUDENT_MULTI_PERIOD_COMPARE_CACHE) return;

    STUDENT_MULTI_PERIOD_COMPARE_CACHE.pageSize = parseInt(pageSizeEl.value);
    renderStudentComparePage(1);
}

function applyStudentCompareFilters(options = {}) {
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();
    if (!STUDENT_MULTI_PERIOD_COMPARE_CACHE) return [];

    const {
        focusSingleMatch = false
    } = options;

    const cache = STUDENT_MULTI_PERIOD_COMPARE_CACHE;
    const hintEl = document.getElementById('studentCompareHint');
    const originalData = Array.isArray(cache.originalStudentsCompareData)
        ? cache.originalStudentsCompareData
        : [];
    const nameFilters = Array.isArray(cache.activeNameFilters) ? cache.activeNameFilters : [];
    const progressFilter = cache.activeProgressFilter || '';
    const classFilter = cache.activeClassFilter || '';
    const cleanName = n => String(n || '').replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');

    let filteredStudents = [...originalData];

    if (classFilter) {
        filteredStudents = filteredStudents.filter(student => (student.class || '未分班') === classFilter);
    }

    if (progressFilter) {
        filteredStudents = filteredStudents.filter(student => student.progressType === progressFilter);
    }

    if (nameFilters.length > 0) {
        filteredStudents = filteredStudents.filter(student => {
            const normalized = cleanName(student.name);
            return nameFilters.some(keyword => normalized.includes(keyword));
        });
    }

    const sortEl = document.getElementById('studentCompareSortBy');
    const sortBy = sortEl?.value || 'class';
    filteredStudents = getSortedStudentCompareData(filteredStudents, sortBy);

    cache.studentsCompareData = filteredStudents;
    cache.isFiltered = nameFilters.length > 0 || !!progressFilter || !!classFilter;
    cache.currentPage = 1;

    updateClassGroupOptions();
    updateStudentCompareSummary();
    toggleGroupDisplay();

    if (hintEl) {
        if (filteredStudents.length === 0) {
            const classText = classFilter ? 'class=' + classFilter : '';
            const nameText = nameFilters.length > 0 ? 'name=' + nameFilters.join(', ') : '';
            const progressText = progressFilter ? 'progress=' + progressFilter : '';
            const summaryText = [classText, nameText, progressText].filter(Boolean).join(' | ') || 'current filters';
            hintEl.innerHTML = 'No students matched: ' + summaryText;
            hintEl.style.color = '#dc2626';
        } else if (!cache.isFiltered) {
            hintEl.innerHTML = 'Showing all ' + cache.school + ' students across ' + cache.periodCount + ' exams: ' + filteredStudents.length;
            hintEl.style.color = '#16a34a';
        } else {
            const progressLabelMap = { improve: 'improve', decline: 'decline', stable: 'stable' };
            const parts = [];
            if (classFilter) parts.push('class=' + classFilter);
            if (nameFilters.length > 0) parts.push('name=' + nameFilters.join(', '));
            if (progressFilter) parts.push('progress=' + (progressLabelMap[progressFilter] || progressFilter));
            hintEl.innerHTML = 'Filtered ' + filteredStudents.length + ' students: ' + parts.join(' | ');
            hintEl.style.color = '#16a34a';
        }
    }

    if (focusSingleMatch && filteredStudents.length === 1) {
        setTimeout(() => {
            if (showStudentComparePopup(filteredStudents[0])) return;
            const card = document.querySelector('#studentCompareResult .student-compare-card');
            if (!card) return;
            const detail = card.querySelector('.student-detail-section');
            const btn = card.querySelector('button[onclick^="toggleStudentDetail"]');
            if (detail) detail.style.display = 'block';
            if (btn) btn.innerHTML = 'Expand';
            card.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 80);
    }

    return filteredStudents;
}

function filterStudentCompareByName() {
    const nameInput = document.getElementById('studentCompareNameInput');
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();

    if (!nameInput) return;
    if (!STUDENT_MULTI_PERIOD_COMPARE_CACHE) {
        alert('请先生成学生成绩对比数据');
        return;
    }

    const searchText = nameInput.value.trim();
    if (!searchText) {
        alert('请输入学生姓名后再筛选');
        return;
    }

    const cleanName = n => String(n || '').replace(/\s+/g, '').replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '');
    const searchNames = searchText.split(/[,，、\s]+/).map(n => cleanName(n)).filter(Boolean);

    if (searchNames.length === 0) {
        alert('请输入有效的学生姓名');
        return;
    }

    STUDENT_MULTI_PERIOD_COMPARE_CACHE.activeNameFilters = searchNames;
    applyStudentCompareFilters({ focusSingleMatch: true });
}

function filterStudentCompareByClass() {
    const classFilterEl = document.getElementById('studentCompareClassFilter');
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();

    if (!classFilterEl || !STUDENT_MULTI_PERIOD_COMPARE_CACHE) return;

    STUDENT_MULTI_PERIOD_COMPARE_CACHE.activeClassFilter = classFilterEl.value || '';
    applyStudentCompareFilters({ focusSingleMatch: true });
}

function clearStudentCompareFilter() {
    const nameInput = document.getElementById('studentCompareNameInput');
    const classFilterEl = document.getElementById('studentCompareClassFilter');
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();

    if (!STUDENT_MULTI_PERIOD_COMPARE_CACHE) return;
    if (nameInput) nameInput.value = '';
    if (classFilterEl) classFilterEl.value = '';

    STUDENT_MULTI_PERIOD_COMPARE_CACHE.activeNameFilters = [];
    STUDENT_MULTI_PERIOD_COMPARE_CACHE.activeProgressFilter = '';
    STUDENT_MULTI_PERIOD_COMPARE_CACHE.activeClassFilter = '';
    applyStudentCompareFilters();
}

function toggleStudentDetail(btn) {
    const card = btn.closest('.student-compare-card');
    if (!card) return;

    const detailSection = card.querySelector('.student-detail-section');
    if (!detailSection) return;

    if (detailSection.style.display === 'none' || !detailSection.style.display) {
        detailSection.style.display = 'block';
        btn.innerHTML = '???? ?';
    } else {
        detailSection.style.display = 'none';
        btn.innerHTML = '???? ?';
    }
}

function filterByProgress(type) {
    const nameInput = document.getElementById('studentCompareNameInput');
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();

    if (!STUDENT_MULTI_PERIOD_COMPARE_CACHE) return;
    if (nameInput) nameInput.value = '';

    STUDENT_MULTI_PERIOD_COMPARE_CACHE.activeNameFilters = [];
    STUDENT_MULTI_PERIOD_COMPARE_CACHE.activeProgressFilter = type;
    applyStudentCompareFilters();
}

function getSortedStudentCompareData(data, sortBy) {
    const sortedData = Array.isArray(data) ? [...data] : [];

    switch (sortBy) {
        case 'totalDesc':
            sortedData.sort((a, b) => b.latestTotal - a.latestTotal);
            break;
        case 'totalAsc':
            sortedData.sort((a, b) => a.latestTotal - b.latestTotal);
            break;
        case 'improveDesc':
            sortedData.sort((a, b) => b.scoreDiff - a.scoreDiff);
            break;
        case 'improveAsc':
            sortedData.sort((a, b) => a.scoreDiff - b.scoreDiff);
            break;
        case 'rankImprove':
            sortedData.sort((a, b) => b.rankSchoolDiff - a.rankSchoolDiff);
            break;
        case 'class':
        default:
            sortedData.sort((a, b) => {
                const classCompare = (a.class || '').localeCompare(b.class || '', 'zh-CN');
                if (classCompare !== 0) return classCompare;
                return (a.name || '').localeCompare(b.name || '', 'zh-CN');
            });
            break;
    }

    return sortedData;
}

function sortStudentCompare() {
    const sortEl = document.getElementById('studentCompareSortBy');
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();

    if (!sortEl || !STUDENT_MULTI_PERIOD_COMPARE_CACHE) return;

    const sortBy = sortEl.value;
    const { studentsCompareData } = STUDENT_MULTI_PERIOD_COMPARE_CACHE;
    const sortedData = getSortedStudentCompareData(studentsCompareData, sortBy);

    STUDENT_MULTI_PERIOD_COMPARE_CACHE.studentsCompareData = sortedData;
    toggleGroupDisplay();
}

function updateClassGroupOptions() {
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();
    if (!STUDENT_MULTI_PERIOD_COMPARE_CACHE) return;

    const optgroup = document.getElementById('classGroupOptions');
    const classFilterEl = document.getElementById('studentCompareClassFilter');
    if (!optgroup && !classFilterEl) return;

    const { studentsCompareData, originalStudentsCompareData, activeClassFilter } = STUDENT_MULTI_PERIOD_COMPARE_CACHE;

    const buildAllowedClassList = (sourceData = []) => {
        const classSet = new Set();
        sourceData.forEach(student => {
            const className = student.class || '未分班';
            classSet.add(className);
        });

        console.log('[班级下拉框] 数据中的所有班级:', Array.from(classSet));

        const user = getCurrentUser();
        let allowedClasses = classSet;

        if (user && RoleManager.hasAnyRole(user, ['teacher', 'class_teacher']) &&
            !RoleManager.hasAnyRole(user, ['admin', 'director', 'grade_director'])) {
            console.log('[班级下拉框] 🔒 检测到教师角色，过滤班级选项');
            const scope = getTeacherScopeForUser(user);
            if (scope.classes.size > 0) {
                allowedClasses = new Set(
                    Array.from(classSet).filter(cls => {
                        const normalized = normalizeClass(cls);
                        const allowed = scope.classes.has(normalized);
                        console.log(`[班级下拉框] 班级 ${cls} (规范化: ${normalized}) -> ${allowed ? '✅允许' : '❌禁止'}`);
                        return allowed;
                    })
                );
                console.log(`[班级下拉框] 🔐 权限筛选：${user.name} 只能看到 ${allowedClasses.size} 个班级:`, Array.from(allowedClasses));
            } else {
                console.warn('[班级下拉框] ⚠️ 未找到任课信息，显示空列表');
            }
        } else {
            console.log('[班级下拉框] ℹ️ 管理员或非教师角色，显示所有班级');
        }

        return Array.from(allowedClasses).sort((a, b) => a.localeCompare(b, 'zh-CN'));
    };

    const groupClasses = buildAllowedClassList(studentsCompareData);
    if (optgroup) {
        let html = '<option value="class">所有班级（分组显示）</option>';
        groupClasses.forEach(className => {
            html += `<option value="class:${className}">${className}</option>`;
        });
        optgroup.innerHTML = html;
    }

    if (classFilterEl) {
        const filterClasses = buildAllowedClassList(
            Array.isArray(originalStudentsCompareData) ? originalStudentsCompareData : studentsCompareData
        );
        let filterHtml = '<option value="">全部班级</option>';
        filterClasses.forEach(className => {
            filterHtml += `<option value="${className}">${className}</option>`;
        });
        classFilterEl.innerHTML = filterHtml;
        classFilterEl.value = activeClassFilter || '';
        classFilterEl.disabled = filterClasses.length === 0;
    }

    console.log('[班级下拉框] 下拉框已更新，共 ' + groupClasses.length + ' 个分组选项');
}

function toggleGroupDisplay() {
    const groupEl = document.getElementById('studentCompareGroupBy');
    const paginationEl = document.getElementById('studentComparePagination');
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();

    if (!STUDENT_MULTI_PERIOD_COMPARE_CACHE) return;
    if (!groupEl) {
        renderStudentComparePage(STUDENT_MULTI_PERIOD_COMPARE_CACHE.currentPage || 1);
        return;
    }

    const groupBy = groupEl.value;
    const { studentsCompareData, subjects, periodCount } = STUDENT_MULTI_PERIOD_COMPARE_CACHE;

    // 🟢 [改进]：支持单个班级显示
    if (groupBy.startsWith('class:')) {
        // 显示特定班级
        const targetClass = groupBy.substring(6); // 去掉"class:"前缀
        if (paginationEl) paginationEl.style.display = 'none';

        const resultEl = document.getElementById('studentCompareResult');
        if (!resultEl) return;

        // 筛选该班级的学生
        const classStudents = studentsCompareData.filter(s => (s.class || '未分班') === targetClass);

        if (classStudents.length === 0) {
            resultEl.innerHTML = '<div style="padding:20px; text-align:center; color:#64748b;">该班级暂无数据</div>';
            return;
        }

        const is9thGrade = CONFIG.name === '9年级';
        const totalLabel = is9thGrade ? '五科总' : '全科总';

        // 计算班级统计
        const improveCount = classStudents.filter(s => s.progressType === 'improve').length;
        const declineCount = classStudents.filter(s => s.progressType === 'decline').length;
        const avgScoreDiff = classStudents.reduce((sum, s) => sum + s.scoreDiff, 0) / classStudents.length;

        let html = `
                <div class="class-group-section" style="margin-bottom:25px; border:2px solid #0ea5e9; border-radius:10px; overflow:hidden;">
                    <div class="class-group-header" style="background:#0ea5e9; padding:12px 15px; font-weight:600; color:white; display:flex; justify-content:space-between; align-items:center;">
                        <div>
                            <span style="font-size:17px;">📋 ${targetClass}</span>
                            <span style="font-size:14px; margin-left:10px; opacity:0.9;">${classStudents.length}人</span>
                        </div>
                        <div style="font-size:12px; display:flex; gap:12px; opacity:0.95;">
                            <span>平均变化: <strong>${avgScoreDiff >= 0 ? '+' : ''}${avgScoreDiff.toFixed(1)}分</strong></span>
                            <span>↑${improveCount}人</span>
                            <span>↓${declineCount}人</span>
                        </div>
                    </div>
                    <div class="class-students-container" style="padding:15px; background:#ffffff;">
            `;

        classStudents.forEach(student => {
            html += generateStudentCard(student, periodCount, totalLabel, subjects);
        });

        html += `</div></div>`;
        resultEl.innerHTML = html;

    } else if (groupBy === 'class') {
        // 班级分组模式：隐藏分页，显示所有学生
        if (paginationEl) paginationEl.style.display = 'none';

        const resultEl = document.getElementById('studentCompareResult');
        if (!resultEl) return;

        // 按班级分组
        const groupedByClass = {};
        studentsCompareData.forEach(student => {
            const className = student.class || '未分班';
            if (!groupedByClass[className]) groupedByClass[className] = [];
            groupedByClass[className].push(student);
        });

        // 对班级名称排序
        const sortedClasses = Object.keys(groupedByClass).sort((a, b) => a.localeCompare(b, 'zh-CN'));

        // 判断是6-8年级还是9年级模式
        const is9thGrade = CONFIG.name === '9年级';
        const totalLabel = is9thGrade ? '五科总' : '全科总';

        // 生成分组HTML
        let html = '';
        sortedClasses.forEach(className => {
            const students = groupedByClass[className];

            // 计算本班统计
            const improveCount = students.filter(s => s.progressType === 'improve').length;
            const declineCount = students.filter(s => s.progressType === 'decline').length;
            const avgScoreDiff = students.reduce((sum, s) => sum + s.scoreDiff, 0) / students.length;

            html += `
                    <div class="class-group-section" style="margin-bottom:25px; border:2px solid #cbd5e1; border-radius:10px; overflow:hidden;">
                        <div class="class-group-header" style="background:#e0f2fe; padding:10px 15px; font-weight:600; color:#0c4a6e; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" onclick="toggleClassGroup(this)">
                            <div>
                                <span style="font-size:16px;">📋 ${className}</span>
                                <span style="font-size:13px; margin-left:10px; color:#64748b;">${students.length}人</span>
                            </div>
                            <div style="font-size:12px; display:flex; gap:12px;">
                                <span>平均变化: <strong style="color:${avgScoreDiff >= 0 ? '#16a34a' : '#dc2626'};">${avgScoreDiff >= 0 ? '+' : ''}${avgScoreDiff.toFixed(1)}分</strong></span>
                                <span style="color:#16a34a;">↑${improveCount}人</span>
                                <span style="color:#dc2626;">↓${declineCount}人</span>
                                <span class="group-toggle" style="font-weight:bold;">收起 ▲</span>
                            </div>
                        </div>
                        <div class="class-students-container" style="padding:10px; background:#ffffff;">
                `;

            // 添加每个学生卡片
            students.forEach(student => {
                html += generateStudentCard(student, periodCount, totalLabel, subjects);
            });

            html += `</div></div>`;
        });

        resultEl.innerHTML = html;
    } else {
        // 列表模式：使用分页渲染
        renderStudentComparePage(STUDENT_MULTI_PERIOD_COMPARE_CACHE.currentPage || 1);
    }
}

function toggleClassGroup(headerEl) {
    const container = headerEl.nextElementSibling;
    const toggle = headerEl.querySelector('.group-toggle');
    if (!container || !toggle) return;

    if (container.style.display === 'none') {
        container.style.display = 'block';
        toggle.textContent = '收起 ▲';
    } else {
        container.style.display = 'none';
        toggle.textContent = '展开 ▼';
    }
}

function exportStudentMultiPeriodComparison() {
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();
    if (!STUDENT_MULTI_PERIOD_COMPARE_CACHE) return alert('请先生成学生多期对比结果');

    const { school, examIds, periodCount, studentsCompareData, subjects } = STUDENT_MULTI_PERIOD_COMPARE_CACHE;
    const wb = XLSX.utils.book_new();

    // 判断是6-8年级还是9年级模式
    const is9thGrade = CONFIG.name === '9年级';
    const totalLabel = is9thGrade ? '五科总' : '全科总';

    // 检查当前是否有过滤（只导出可见学生）
    const resultEl = document.getElementById('studentCompareResult');
    let visibleStudents = studentsCompareData;
    if (resultEl) {
        const visibleCards = resultEl.querySelectorAll('.student-compare-card');
        const visibleNames = new Set();
        visibleCards.forEach(card => {
            if (card.style.display !== 'none') {
                const studentName = card.getAttribute('data-student-name');
                if (studentName) visibleNames.add(studentName);
            }
        });
        if (visibleNames.size > 0 && visibleNames.size < studentsCompareData.length) {
            visibleStudents = studentsCompareData.filter(s => visibleNames.has(s.cleanName));
        }
    }

    // 工作表1: 总分汇总对比
    const totalHeader = ['学生姓名', '班级'];
    examIds.forEach(examId => {
        totalHeader.push(`${examId}-${totalLabel}`, `${examId}-级排`, `${examId}-镇排`);
    });
    const totalData = [totalHeader];

    visibleStudents.forEach(student => {
        const row = [student.name, student.class];
        student.periods.forEach(p => {
            row.push(
                p.total !== null ? p.total.toFixed(1) : '-',
                p.rankSchool !== null ? p.rankSchool : '-',
                p.rankTown !== null ? p.rankTown : '-'
            );
        });
        totalData.push(row);
    });

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(totalData), '总分汇总');

    // 工作表2-N: 每个科目一个工作表
    subjects.forEach(subject => {
        const subHeader = ['学生姓名', '班级'];
        examIds.forEach(examId => {
            subHeader.push(`${examId}-成绩`, `${examId}-级排`, `${examId}-镇排`);
        });
        const subData = [subHeader];

        visibleStudents.forEach(student => {
            const row = [student.name, student.class];
            student.periods.forEach(p => {
                const subjectData = p.subjects[subject];
                if (subjectData) {
                    row.push(subjectData.score, subjectData.rankSchool, subjectData.rankTown);
                } else {
                    row.push('-', '-', '-');
                }
            });
            subData.push(row);
        });

        // 工作表名称最长31个字符，截取科目名称
        const sheetName = subject.length > 28 ? subject.substring(0, 28) + '...' : subject;
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(subData), sheetName);
    });

    // 工作表N+1: 详细对比（每个学生的完整数据，包含变化趋势）
    if (periodCount > 1) {
        const detailHeader = ['学生姓名', '班级', '数据类型'];
        examIds.forEach((examId, idx) => {
            detailHeader.push(`${examId}`);
            if (idx > 0) {
                detailHeader.push('变化');
            }
        });
        const detailData = [detailHeader];

        visibleStudents.forEach(student => {
            // 总分行
            const totalRow = [student.name, student.class, `${totalLabel}`];
            student.periods.forEach((p, idx) => {
                totalRow.push(p.total !== null ? p.total.toFixed(1) : '-');
                if (idx > 0) {
                    const prevPeriod = student.periods[idx - 1];
                    const diff = (p.total !== null && prevPeriod.total !== null) ? (p.total - prevPeriod.total) : null;
                    totalRow.push(diff !== null ? (diff >= 0 ? '+' : '') + diff.toFixed(1) : '-');
                }
            });
            detailData.push(totalRow);

            // 级部排名行
            const schoolRankRow = [student.name, student.class, '级部排名'];
            student.periods.forEach((p, idx) => {
                schoolRankRow.push(p.rankSchool !== null ? p.rankSchool : '-');
                if (idx > 0) {
                    const prevPeriod = student.periods[idx - 1];
                    const diff = (p.rankSchool !== null && prevPeriod.rankSchool !== null) ? (prevPeriod.rankSchool - p.rankSchool) : null;
                    schoolRankRow.push(diff !== null ? (diff >= 0 ? '+' : '') + diff : '-');
                }
            });
            detailData.push(schoolRankRow);

            // 镇排名行
            const townRankRow = [student.name, student.class, '镇排名'];
            student.periods.forEach((p, idx) => {
                townRankRow.push(p.rankTown !== null ? p.rankTown : '-');
                if (idx > 0) {
                    const prevPeriod = student.periods[idx - 1];
                    const diff = (p.rankTown !== null && prevPeriod.rankTown !== null) ? (prevPeriod.rankTown - p.rankTown) : null;
                    townRankRow.push(diff !== null ? (diff >= 0 ? '+' : '') + diff : '-');
                }
            });
            detailData.push(townRankRow);

            // 空行分隔
            detailData.push([]);
        });

        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(detailData), '详细对比');
    }

    // 工作表N+2: 进退步分析（仅多期）
    if (periodCount > 1) {
        // 进步榜Top20
        const improveList = [...visibleStudents]
            .filter(s => s.scoreDiff > 0)
            .sort((a, b) => b.scoreDiff - a.scoreDiff)
            .slice(0, 20);

        // 退步榜Top20
        const declineList = [...visibleStudents]
            .filter(s => s.scoreDiff < 0)
            .sort((a, b) => a.scoreDiff - b.scoreDiff)
            .slice(0, 20);

        const progressAnalysisData = [];

        // 进步榜
        progressAnalysisData.push(['📈 进步榜 Top20']);
        progressAnalysisData.push(['排名', '学生姓名', '班级', '首期成绩', '末期成绩', '分数提升', '级排提升', '镇排提升']);
        improveList.forEach((s, idx) => {
            const firstPeriod = s.periods[0];
            const lastPeriod = s.periods[s.periods.length - 1];
            progressAnalysisData.push([
                idx + 1,
                s.name,
                s.class,
                firstPeriod.total !== null ? firstPeriod.total.toFixed(1) : '-',
                lastPeriod.total !== null ? lastPeriod.total.toFixed(1) : '-',
                s.scoreDiff.toFixed(1),
                s.rankSchoolDiff,
                s.rankTownDiff
            ]);
        });

        progressAnalysisData.push([]); // 空行

        // 退步榜
        progressAnalysisData.push(['📉 退步榜 Top20']);
        progressAnalysisData.push(['排名', '学生姓名', '班级', '首期成绩', '末期成绩', '分数下降', '级排下降', '镇排下降']);
        declineList.forEach((s, idx) => {
            const firstPeriod = s.periods[0];
            const lastPeriod = s.periods[s.periods.length - 1];
            progressAnalysisData.push([
                idx + 1,
                s.name,
                s.class,
                firstPeriod.total !== null ? firstPeriod.total.toFixed(1) : '-',
                lastPeriod.total !== null ? lastPeriod.total.toFixed(1) : '-',
                s.scoreDiff.toFixed(1),
                s.rankSchoolDiff,
                s.rankTownDiff
            ]);
        });

        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(progressAnalysisData), '进退步分析');
    }

    // 工作表N+3: 全校统计
    if (periodCount > 1) {
        const statData = [];

        // 整体统计
        statData.push(['📊 全校统计概览']);
        statData.push([]);
        statData.push(['统计项目', '数值']);

        const totalCount = visibleStudents.length;
        const improveCount = visibleStudents.filter(s => s.progressType === 'improve').length;
        const declineCount = visibleStudents.filter(s => s.progressType === 'decline').length;
        const stableCount = visibleStudents.filter(s => s.progressType === 'stable').length;
        const avgScoreDiff = visibleStudents.reduce((sum, s) => sum + s.scoreDiff, 0) / totalCount;
        const maxImprove = Math.max(...visibleStudents.map(s => s.scoreDiff));
        const maxDecline = Math.min(...visibleStudents.map(s => s.scoreDiff));

        statData.push(['学生总数', totalCount]);
        statData.push(['进步人数', `${improveCount}人 (${(improveCount / totalCount * 100).toFixed(1)}%)`]);
        statData.push(['退步人数', `${declineCount}人 (${(declineCount / totalCount * 100).toFixed(1)}%)`]);
        statData.push(['持平人数', `${stableCount}人 (${(stableCount / totalCount * 100).toFixed(1)}%)`]);
        statData.push(['平均分变化', avgScoreDiff.toFixed(2)]);
        statData.push(['最大进步幅度', maxImprove.toFixed(1)]);
        statData.push(['最大退步幅度', maxDecline.toFixed(1)]);

        statData.push([]);
        statData.push([]);

        // 各班统计
        statData.push(['📋 各班级统计']);
        statData.push([]);
        statData.push(['班级', '人数', '进步人数', '退步人数', '平均变化', '平均级排变化']);

        const classStat = {};
        visibleStudents.forEach(s => {
            const className = s.class || '未分班';
            if (!classStat[className]) {
                classStat[className] = {
                    count: 0,
                    improveCount: 0,
                    declineCount: 0,
                    totalScoreDiff: 0,
                    totalRankDiff: 0
                };
            }
            classStat[className].count++;
            if (s.progressType === 'improve') classStat[className].improveCount++;
            if (s.progressType === 'decline') classStat[className].declineCount++;
            classStat[className].totalScoreDiff += s.scoreDiff;
            classStat[className].totalRankDiff += s.rankSchoolDiff;
        });

        Object.keys(classStat).sort((a, b) => a.localeCompare(b, 'zh-CN')).forEach(className => {
            const stat = classStat[className];
            statData.push([
                className,
                stat.count,
                stat.improveCount,
                stat.declineCount,
                (stat.totalScoreDiff / stat.count).toFixed(2),
                (stat.totalRankDiff / stat.count).toFixed(2)
            ]);
        });

        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statData), '全校统计');
    }

    const fileName = visibleStudents.length === 1
        ? `学生多期对比_${visibleStudents[0].name}_${examIds.join('_')}.xlsx`
        : `${school}_学生多期对比_${visibleStudents.length}人_${examIds.join('_')}.xlsx`;

    XLSX.writeFile(wb, fileName);
}

// 学生云对比运行时已拆分到 public/assets/js/student-compare-cloud-runtime.js

// 🆕 更新统计面板
function updateStudentCompareSummary() {
    const summaryEl = document.getElementById('studentCompareSummary');
    const STUDENT_MULTI_PERIOD_COMPARE_CACHE = readStudentCompareCacheState();
    if (!summaryEl || !STUDENT_MULTI_PERIOD_COMPARE_CACHE) return;

    const { studentsCompareData, periodCount, activeClassFilter } = STUDENT_MULTI_PERIOD_COMPARE_CACHE;
    if (!studentsCompareData || studentsCompareData.length === 0) {
        summaryEl.innerHTML = '';
        return;
    }

    const totalCount = studentsCompareData.length;
    const classCount = new Set(studentsCompareData.map(s => s.class || '未分班')).size;
    const improveCount = studentsCompareData.filter(s => s.progressType === 'improve').length;
    const declineCount = studentsCompareData.filter(s => s.progressType === 'decline').length;
    const stableCount = studentsCompareData.filter(s => s.progressType === 'stable').length;
    const missingCount = studentsCompareData.filter(s => Array.isArray(s.periods) && s.periods.some(p => p.total === null || p.total === undefined)).length;
    const avgScoreDiff = studentsCompareData.reduce((sum, s) => sum + Number(s.scoreDiff || 0), 0) / totalCount;
    const avgLatestTotal = studentsCompareData.reduce((sum, s) => sum + Number(s.latestTotal || 0), 0) / totalCount;
    const bestImprover = studentsCompareData.slice().sort((a, b) => Number(b.scoreDiff || 0) - Number(a.scoreDiff || 0))[0] || null;
    const topLatest = studentsCompareData.slice().sort((a, b) => Number(b.latestTotal || 0) - Number(a.latestTotal || 0))[0] || null;

    let html = '';

    if (periodCount > 1) {
        html += `
                <div style="padding:12px; background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; margin-bottom:10px;">
                    <div style="font-weight:600; margin-bottom:10px; color:#0369a1; display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap;">
                        <span>当前筛选统计</span>
                        <span style="font-size:12px; color:#64748b; font-weight:500;">${totalCount}人 / ${classCount}个班级</span>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:10px; font-size:13px;">
                        <div style="background:#ffffff; border-radius:8px; padding:10px; border:1px solid #dbeafe;">平均变化<br><strong style="color:${avgScoreDiff >= 0 ? '#16a34a' : '#dc2626'};">${avgScoreDiff >= 0 ? '+' : ''}${avgScoreDiff.toFixed(2)}分</strong></div>
                        <div style="background:#ffffff; border-radius:8px; padding:10px; border:1px solid #dbeafe;">最新均分<br><strong>${avgLatestTotal.toFixed(1)}</strong></div>
                        <div style="background:#ffffff; border-radius:8px; padding:10px; border:1px solid #dcfce7;">进步人数<br><strong style="color:#16a34a;">${improveCount}人</strong></div>
                        <div style="background:#ffffff; border-radius:8px; padding:10px; border:1px solid #fee2e2;">退步人数<br><strong style="color:#dc2626;">${declineCount}人</strong></div>
                        <div style="background:#ffffff; border-radius:8px; padding:10px; border:1px solid #e5e7eb;">持平人数<br><strong>${stableCount}人</strong></div>
                        <div style="background:#ffffff; border-radius:8px; padding:10px; border:1px solid #fef3c7;">缺考/缺科<br><strong style="color:#d97706;">${missingCount}人</strong></div>
                    </div>
                </div>
            `;
    }

    if (activeClassFilter) {
        html += `
                <div style="padding:12px; background:#fffbeb; border:1px solid #fde68a; border-radius:10px; margin-bottom:10px;">
                    <div style="display:flex; justify-content:space-between; gap:12px; flex-wrap:wrap; margin-bottom:8px;">
                        <div style="font-weight:700; color:#92400e;">${activeClassFilter} 班级摘要</div>
                        <div style="font-size:12px; color:#a16207;">排序与筛选实时联动</div>
                    </div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:10px; font-size:13px;">
                        <div style="background:#fff; border-radius:8px; padding:10px; border:1px solid #fde68a;">班级人数<br><strong>${totalCount}人</strong></div>
                        <div style="background:#fff; border-radius:8px; padding:10px; border:1px solid #fde68a;">班级均分变化<br><strong style="color:${avgScoreDiff >= 0 ? '#16a34a' : '#dc2626'};">${avgScoreDiff >= 0 ? '+' : ''}${avgScoreDiff.toFixed(2)}分</strong></div>
                        <div style="background:#fff; border-radius:8px; padding:10px; border:1px solid #fde68a;">班级最新均分<br><strong>${avgLatestTotal.toFixed(1)}</strong></div>
                        <div style="background:#fff; border-radius:8px; padding:10px; border:1px solid #fde68a;">最佳进步<br><strong>${bestImprover ? `${bestImprover.name} (${bestImprover.scoreDiff >= 0 ? '+' : ''}${Number(bestImprover.scoreDiff || 0).toFixed(1)})` : '-'}</strong></div>
                        <div style="background:#fff; border-radius:8px; padding:10px; border:1px solid #fde68a;">当前最高总分<br><strong>${topLatest ? `${topLatest.name} (${Number(topLatest.latestTotal || 0).toFixed(1)})` : '-'}</strong></div>
                        <div style="background:#fff; border-radius:8px; padding:10px; border:1px solid #fde68a;">班级稳定率<br><strong>${((stableCount / totalCount) * 100).toFixed(1)}%</strong></div>
                    </div>
                </div>
            `;
    }

    summaryEl.innerHTML = html;
}

    Object.assign(window, {
        renderStudentComparePage,
        generateStudentCard,
        showStudentComparePopup,
        changePageSize,
        applyStudentCompareFilters,
        filterStudentCompareByName,
        filterStudentCompareByClass,
        clearStudentCompareFilter,
        toggleStudentDetail,
        filterByProgress,
        getSortedStudentCompareData,
        sortStudentCompare,
        updateClassGroupOptions,
        toggleGroupDisplay,
        toggleClassGroup,
        exportStudentMultiPeriodComparison,
        updateStudentCompareSummary
    });

    window.__STUDENT_COMPARE_RESULT_RUNTIME_PATCHED__ = true;
})();
