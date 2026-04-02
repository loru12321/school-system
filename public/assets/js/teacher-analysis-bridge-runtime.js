(() => {
    if (typeof window === 'undefined' || window.__TEACHER_ANALYSIS_BRIDGE_RUNTIME_PATCHED__) return;

    function updateCorrelationSchoolSelect() {
        const select = document.getElementById('corrSchoolSelect');
        if (!select) return;
        const oldValue = select.value;
        select.innerHTML = '<option value="ALL">全乡镇（All）</option>';
        Object.keys(SCHOOLS || {}).forEach((schoolName) => {
            select.innerHTML += `<option value="${schoolName}">${schoolName}</option>`;
        });
        if (oldValue) select.value = oldValue;
    }

    function calculatePearson(x, y) {
        const size = Math.min(Array.isArray(x) ? x.length : 0, Array.isArray(y) ? y.length : 0);
        if (!size) return 0;
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumX2 = 0;
        let sumY2 = 0;
        for (let index = 0; index < size; index += 1) {
            sumX += x[index];
            sumY += y[index];
            sumXY += x[index] * y[index];
            sumX2 += x[index] * x[index];
            sumY2 += y[index] * y[index];
        }
        const numerator = (size * sumXY) - (sumX * sumY);
        const denominator = Math.sqrt((size * sumX2 - sumX * sumX) * (size * sumY2 - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    }

    function renderCorrelationAnalysis() {
        const schoolSelect = document.getElementById('corrSchoolSelect');
        const scope = schoolSelect?.value || 'ALL';
        const students = scope === 'ALL' ? RAW_DATA : (SCHOOLS?.[scope]?.students || []);
        if (!Array.isArray(students) || students.length < 5) {
            alert('样本数据过少，暂时无法生成有效的相关性分析。');
            return;
        }

        const matrixBody = document.querySelector('#corrMatrixTable tbody');
        if (matrixBody) {
            let matrixHtml = '<tr><th></th>';
            SUBJECTS.forEach((subject) => {
                matrixHtml += `<th>${subject}</th>`;
            });
            matrixHtml += '</tr>';

            SUBJECTS.forEach((rowSubject) => {
                matrixHtml += `<tr><th>${rowSubject}</th>`;
                SUBJECTS.forEach((colSubject) => {
                    if (rowSubject === colSubject) {
                        matrixHtml += '<td style="background:#eee;">-</td>';
                        return;
                    }
                    const commonRows = students.filter((student) => (
                        student?.scores?.[rowSubject] !== undefined && student?.scores?.[colSubject] !== undefined
                    ));
                    const pearson = calculatePearson(
                        commonRows.map((student) => student.scores[rowSubject]),
                        commonRows.map((student) => student.scores[colSubject])
                    );
                    const bg = pearson > 0
                        ? `rgba(220, 38, 38, ${Math.abs(pearson) * 0.8})`
                        : `rgba(37, 99, 235, ${Math.abs(pearson) * 0.8})`;
                    const color = Math.abs(pearson) > 0.5 ? '#fff' : '#333';
                    matrixHtml += `<td class="heatmap-cell" style="background:${bg}; color:${color}" title="${rowSubject} vs ${colSubject} 相关系数: ${pearson.toFixed(3)}">${pearson.toFixed(2)}</td>`;
                });
                matrixHtml += '</tr>';
            });
            matrixBody.innerHTML = matrixHtml;
        }

        const chartContainer = document.getElementById('contributionChartContainer');
        if (chartContainer) {
            chartContainer.innerHTML = '';
            SUBJECTS
                .map((subject) => {
                    const commonRows = students.filter((student) => student?.scores?.[subject] !== undefined);
                    return {
                        subject,
                        value: calculatePearson(
                            commonRows.map((student) => student.scores[subject]),
                            commonRows.map((student) => student.total)
                        )
                    };
                })
                .sort((left, right) => right.value - left.value)
                .forEach((item) => {
                    const width = Math.max(0, item.value * 100);
                    const bg = item.value > 0.8 ? '#16a34a' : (item.value > 0.6 ? '#2563eb' : '#ca8a04');
                    chartContainer.innerHTML += `<div style="display:flex; align-items:center; margin-bottom:5px;"><span style="width:40px; font-size:12px; font-weight:bold;">${item.subject}</span><div style="flex:1; background:#f1f5f9; border-radius:4px; margin-left:10px; height:20px;"><div class="contribution-bar" style="width:${width}%; background:${bg}">${item.value.toFixed(3)}</div></div></div>`;
                });
        }

        const liftDragBody = document.querySelector('#liftDragTable tbody');
        if (liftDragBody) {
            let html = '';
            SUBJECTS.forEach((subject) => {
                let lift = 0;
                let drag = 0;
                let balance = 0;
                let validCount = 0;
                students.forEach((student) => {
                    const totalRank = typeof safeGet === 'function' ? safeGet(student, 'ranks.total.township', 0) : 0;
                    const subjectRank = typeof safeGet === 'function' ? safeGet(student, `ranks.${subject}.township`, 0) : 0;
                    if (!totalRank || !subjectRank) return;
                    validCount += 1;
                    const threshold = students.length * 0.1;
                    if (subjectRank < totalRank - threshold) lift += 1;
                    else if (subjectRank > totalRank + threshold) drag += 1;
                    else balance += 1;
                });
                if (!validCount) return;
                const net = lift - drag;
                html += `<tr><td>${subject}</td><td class="text-green">${lift} 人 (${(lift / validCount * 100).toFixed(0)}%)</td><td class="text-red">${drag} 人 (${(drag / validCount * 100).toFixed(0)}%)</td><td>${balance} 人</td><td style="font-weight:bold; color:${net > 0 ? 'green' : 'red'}">${net > 0 ? '+' : ''}${net}</td></tr>`;
            });
            liftDragBody.innerHTML = html;
        }
    }

    function buildSafeSheetName(base, suffix = '') {
        const raw = `${String(base || '').trim()}${suffix ? `_${String(suffix || '').trim()}` : ''}`;
        const cleaned = raw.replace(/[\\/?*\[\]:]/g, '').trim() || 'Sheet';
        return cleaned.slice(0, 31);
    }

    function resolveTeacherExportTag(user, subjectSet) {
        if (typeof window.buildTeacherExportTag === 'function') {
            return window.buildTeacherExportTag(user, subjectSet);
        }
        return new Date().toISOString().slice(0, 10);
    }

    function exportTeacherTownshipRankExcel() {
        const user = getCurrentUser();
        const role = user?.role || 'guest';
        if (!TOWNSHIP_RANKING_DATA || !Object.keys(TOWNSHIP_RANKING_DATA).length) {
            alert('暂无乡镇排名数据可导出。');
            return;
        }

        const visibleSubjectSet = (role === 'teacher' || role === 'class_teacher')
            ? getVisibleSubjectsForTeacherUser(user)
            : null;
        const workbook = XLSX.utils.book_new();
        const fileSubjectSet = new Set();
        const getExcelNumFn = typeof getExcelNum === 'function' ? getExcelNum : ((value) => value);
        const getExcelPercentFn = typeof getExcelPercent === 'function' ? getExcelPercent : ((value) => value);

        SUBJECTS.forEach((subject) => {
            if (visibleSubjectSet && visibleSubjectSet.size > 0 && !visibleSubjectSet.has(normalizeSubject(subject))) return;
            const rows = TOWNSHIP_RANKING_DATA[subject];
            if (!Array.isArray(rows) || !rows.length) return;
            fileSubjectSet.add(normalizeSubject(subject));
            const wsData = [[
                '教师/学校', '类型', '平均分', '乡镇排名', '优秀率', '乡镇排名', '及格率', '乡镇排名'
            ]];
            rows.forEach((item) => {
                wsData.push([
                    item.name,
                    item.type === 'teacher' ? '教师' : '学校',
                    getExcelNumFn(item.avg),
                    item.rankAvg,
                    getExcelPercentFn(item.excellentRate),
                    item.rankExc,
                    getExcelPercentFn(item.passRate),
                    item.rankPass
                ]);
            });
            XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(wsData), buildSafeSheetName(subject, '乡镇排名'));
        });

        const exportTag = resolveTeacherExportTag(user, fileSubjectSet);
        XLSX.writeFile(workbook, `教师乡镇排名_${exportTag}.xlsx`);
    }

    function refreshTeacherPerformanceCopy() {
        const teacherSection = document.getElementById('teacher-analysis');
        const teacherExplain = teacherSection?.querySelector('.explain-panel .explain-content');
        if (teacherExplain) {
            teacherExplain.innerHTML = `
                <p>联考赋分：按系统现有“两率一分”标准，对同校同学科教师的均分、优秀率、及格率进行赋分。</p>
                <p>滚动基线：系统优先使用最近 3 次历史考试做滚动分层，尽量避免单次考试难度、缺考或样本波动带来的误差。</p>
                <p>换老师保护：如果滚动基线跨学期任教发生变化，系统会冻结基线增益项，避免把换老师因素误算到当前教师头上。</p>
                <p>共同样本与样本波动：页面会明确展示共同样本、新增样本、退出样本和样本稳定度，样本不稳时基线校正会自动降权。</p>
                <p>转化分：系统会单列优秀保持、边缘转优、临界转及格和低分脱低等表现，并以小权重计入公平绩效分。</p>
            `;
        }

        const sseSection = document.getElementById('single-school-eval');
        const sseExplain = sseSection?.querySelector('.explain-panel .explain-content');
        if (sseExplain) {
            sseExplain.innerHTML = `
                <p>本模块仍用于班级层面的公平考核，重点看班级工作量、整体结果和生源变化。</p>
                <p>教师教学质量画像中的“公平绩效分”则是教师学科层面的口径，会额外考虑联考赋分、滚动基线、换老师保护和重点学生转化结构。</p>
                <p>建议班级管理与班主任评价看本模块，任课教师的教学加工效果看“教师教学质量画像”。</p>
            `;
        }
    }

    Object.assign(window, {
        updateCorrelationSchoolSelect,
        renderCorrelationAnalysis,
        buildSafeSheetName,
        exportTeacherTownshipRankExcel,
        refreshTeacherPerformanceCopy
    });

    refreshTeacherPerformanceCopy();
    window.__TEACHER_ANALYSIS_BRIDGE_RUNTIME_PATCHED__ = true;
})();
