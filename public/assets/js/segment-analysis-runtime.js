/*
 * 分数段分析（segment-analysis）运行时模块
 *
 * 从 app.js 抽出的「分数段直方图」展示模块：按学校/班级/学科筛选，分桶统计
 * 各分数段人数与累计比例，渲染表格 + Chart.js 直方图（点击柱子下钻名单），
 * 以及 Excel 导出。
 *
 * 纯展示逻辑，不涉及任何成绩计算口径（两率一分 / 优秀线 / 排名核算 / 学校归一化
 * 均不在此）。依赖的全局（SUBJECTS / RAW_DATA / SCHOOLS / escapeAppHtml /
 * normalizeClass / getAppSchoolRecord / listAvailableSchoolsForCompare /
 * filterRowsToTownshipSchools / Chart / ensureChartVendorLoaded / DrillSystem /
 * UI / uiAlert / XLSX）都由 app.js、school-normalization-runtime 或 vendor 提供，
 * 本模块在其后（DEFERRED_APP_MODULES）加载，通过 root.* 访问并带 typeof 兜底。
 *
 * segmentChartInstance 同步到 root.segmentChartInstance，供 ui-actions-runtime 的
 * toggleDarkMode 在切换深色模式时重绘图表（沿用 progress-analysis-runtime 的
 * `x = window.x = ...` 图表实例回挂模式）。
 */
(function (root) {
    if (!root) return;

    const esc = (value) => (typeof root.escapeAppHtml === 'function'
        ? root.escapeAppHtml(value)
        : String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char])));

    const getSubjects = () => (Array.isArray(root.SUBJECTS) ? root.SUBJECTS : []);
    const getRawData = () => (Array.isArray(root.RAW_DATA) ? root.RAW_DATA : []);
    const getSchools = () => (root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {});
    const normClass = (value) => (typeof root.normalizeClass === 'function'
        ? root.normalizeClass(value) : String(value ?? ''));
    const townshipRowsOf = (rows) => (typeof root.filterRowsToTownshipSchools === 'function'
        ? root.filterRowsToTownshipSchools(rows || [])
        : (Array.isArray(rows) ? rows : []));

    // Selector option markup is derived from the current cohort snapshot, not
    // from the selected chart values. Reuse it across module re-entry and exam
    // selector refreshes while invalidating whenever the source snapshot changes.
    const SEG_SELECT_OPTIONS_CACHE = {
        schoolSignature: '',
        subjectSignature: '',
        classSignature: '',
        classSchool: ''
    };

    const getDataVersion = () => String(root.__RAW_DATA_VERSION || 0);

    function updateSegmentSelects() {
        const schSel = root.document.getElementById('segSchoolSelect');
        const subSel = root.document.getElementById('segSubjectSelect');
        if (!schSel || !subSel) return;
        const oldSch = schSel.value;
        const schools = getSchools();
        const schoolList = (typeof root.listAvailableSchoolsForCompare === 'function')
            ? root.listAvailableSchoolsForCompare('all')
            : Object.keys(schools);
        const schoolSignature = `${getDataVersion()}::${schoolList.join('|')}`;
        if (SEG_SELECT_OPTIONS_CACHE.schoolSignature !== schoolSignature) {
            schSel.innerHTML = `<option value="ALL">全部学校</option>${schoolList.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}`;
            SEG_SELECT_OPTIONS_CACHE.schoolSignature = schoolSignature;
        }
        if (oldSch && (oldSch === 'ALL' || schools[oldSch])) schSel.value = oldSch;
        const oldSub = subSel.value;
        const subjects = getSubjects();
        const subjectSignature = `${getDataVersion()}::${subjects.join('|')}`;
        if (SEG_SELECT_OPTIONS_CACHE.subjectSignature !== subjectSignature) {
            subSel.innerHTML = `<option value="total">总分</option>${subjects.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}`;
            SEG_SELECT_OPTIONS_CACHE.subjectSignature = subjectSignature;
        }
        if (oldSub) subSel.value = oldSub;
        schSel.onchange = updateSegmentClassSelect;
        updateSegmentClassSelect();
    }

    function updateSegmentClassSelect() {
        const schSel = root.document.getElementById('segSchoolSelect');
        const clsSel = root.document.getElementById('segClassSelect');
        if (!schSel || !clsSel) return;
        const oldClass = clsSel.value;
        const townshipRows = townshipRowsOf(getRawData());
        const schoolRecord = typeof root.getAppSchoolRecord === 'function' ? root.getAppSchoolRecord(schSel.value) : null;
        const students = schSel.value === 'ALL' ? townshipRows : (schoolRecord?.students || []);
        const classes = Array.from(new Set(students.map(s => s.class).filter(Boolean)))
            .sort((a, b) => normClass(a).localeCompare(normClass(b), 'zh-Hans-CN', { numeric: true }));
        const classSignature = `${getDataVersion()}::${schSel.value}::${classes.join('|')}`;
        if (SEG_SELECT_OPTIONS_CACHE.classSignature !== classSignature
            || SEG_SELECT_OPTIONS_CACHE.classSchool !== schSel.value) {
            clsSel.innerHTML = `<option value="ALL">全部班级</option>${classes.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}`;
            SEG_SELECT_OPTIONS_CACHE.classSignature = classSignature;
            SEG_SELECT_OPTIONS_CACHE.classSchool = schSel.value;
        }
        if (oldClass && Array.from(clsSel.options || []).some(option => option.value === oldClass)) clsSel.value = oldClass;
    }

    function renderSegmentAnalysis() {
        if (!root.Chart && typeof root.ensureChartVendorLoaded === 'function') {
            return root.ensureChartVendorLoaded()
                .then(() => renderSegmentAnalysis())
                .catch((error) => {
                    console.warn('[segment-analysis] Chart runtime load failed:', error);
                    if (typeof root.uiAlert === 'function') root.uiAlert('图表组件加载失败，请刷新页面后重试', 'error');
                    else alert('图表组件加载失败，请刷新页面后重试');
                    return false;
                });
        }

        const school = root.document.getElementById('segSchoolSelect').value;
        const selectedClass = root.document.getElementById('segClassSelect')?.value || 'ALL';
        const subject = root.document.getElementById('segSubjectSelect').value;
        const step = parseInt(root.document.getElementById('segStep').value) || 10;

        const schools = getSchools();
        const townshipRows = townshipRowsOf(getRawData());
        let students = school === 'ALL' ? townshipRows : (schools[school] ? schools[school].students : []);
        const normalizedSelectedClass = normClass(selectedClass);
        if (normalizedSelectedClass && normalizedSelectedClass.toLowerCase() !== 'all') {
            students = students.filter(s => normClass(s.class || '') === normalizedSelectedClass);
        }
        const validStudents = students.filter(s => {
            const v = subject === 'total' ? s.total : s.scores[subject];
            return typeof v === 'number';
        }).map(s => ({
            ...s, // 浅拷贝学生信息
            _filterScore: subject === 'total' ? s.total : s.scores[subject]
        }));

        const scores = validStudents.map(s => s._filterScore); // 兼容旧逻辑的 scores 数组用于计算 max/total

        if (!scores.length) { alert('没有找到相关成绩数据'); return; }

        const maxScore = Math.ceil(Math.max(...scores));
        const topCeil = Math.ceil(maxScore / step) * step;

        let html = `<thead><tr><th>分数段</th><th>人数</th><th>累计人数</th><th>比例</th><th>累计比例</th></tr></thead><tbody>`;
        let cumulative = 0, total = scores.length;

        const rowsData = []; // 临时存储数据以便后续给图表使用

        for (let high = topCeil; high > 0; high -= step) {
            const low = high - step;
            const isTopBucket = high === topCeil;
            const bucketList = validStudents.filter(s => {
                const val = s._filterScore;
                return val >= low && (isTopBucket ? val <= high : val < high);
            });
            const count = bucketList.length;

            if (count === 0 && cumulative === 0) continue;

            cumulative += count;

            const label = `${low}-${high}`;

            html += `<tr><td>${label} 分</td><td>${count}</td><td>${cumulative}</td><td>${(count / total * 100).toFixed(2)}%</td><td>${(cumulative / total * 100).toFixed(2)}%</td></tr>`;

            rowsData.unshift({
                label: label,
                count: count,
                studentList: bucketList // 👈 关键：保存该分数段的学生名单
            });
        }

        root.document.getElementById('tb-segment').innerHTML = html + `</tbody>`;

        const ctx = root.document.getElementById('segmentChart');
        if (ctx) {
            if (segmentChartInstance) segmentChartInstance.destroy();

            segmentChartInstance = root.segmentChartInstance = new root.Chart(ctx, {
                type: 'bar',
                data: {
                    labels: rowsData.map(d => d.label),
                    datasets: [{
                        label: '人数分布',
                        data: rowsData.map(d => d.count),
                        backgroundColor: 'rgba(59, 130, 246, 0.6)', // 蓝色柱体
                        borderColor: 'rgba(59, 130, 246, 1)',
                        borderWidth: 1,
                        borderRadius: 4,
                        barPercentage: 0.9, // 让柱子宽一点，更有直方图的感觉
                        categoryPercentage: 0.9,
                        order: 2
                    }, {
                        type: 'line',
                        label: '分布趋势',
                        data: rowsData.map(d => d.count),
                        borderColor: '#f59e0b', // 橙色线条
                        borderWidth: 2,
                        tension: 0.4, // 平滑曲线
                        pointRadius: 0,
                        order: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    onClick: (event, elements) => {
                        if (!elements || elements.length === 0) return;

                        const index = elements[0].index;
                        const dataItem = rowsData[index];

                        if (dataItem && dataItem.count > 0) {
                            const title = `${school === 'ALL' ? '全镇' : school} ${subject} 分数段详情 (${dataItem.label})`;
                            if (root.DrillSystem && typeof root.DrillSystem.open === 'function') root.DrillSystem.open(title, dataItem.studentList);
                        } else {
                            if (root.UI && typeof root.UI.toast === 'function') root.UI.toast('该分数段暂无学生', 'info');
                        }
                    },
                    onHover: (event, chartElement) => {
                        event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                    },
                    plugins: {
                        legend: { display: true },
                        title: {
                            display: true,
                            text: `${school === 'ALL' ? '全镇' : school} ${subject} 成绩分布直方图 (💡点击柱子可查看名单)`,
                            font: { size: 16 }
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: '人数' }
                        },
                        x: {
                            title: { display: true, text: '分数段 (低 → 高)' }
                        }
                    }
                }
            });
        }
    }

    function exportSegmentExcel() {
        const table = root.document.getElementById('tb-segment');
        if (!table || !table.rows.length) return alert("请先生成统计表");
        if (typeof root.XLSX === 'undefined') return alert("导出组件尚未加载完成，请稍后重试。");
        const wb = root.XLSX.utils.table_to_book(table);
        root.XLSX.writeFile(wb, "分数段统计.xlsx");
    }

    // 分数段直方图实例：同步到 root.segmentChartInstance，供 toggleDarkMode 重绘。
    let segmentChartInstance = root.segmentChartInstance || null;

    // 回挂到 window，供 HTML onclick（renderSegmentAnalysis/exportSegmentExcel）
    // 与 module-entry / student-overview / cohort-db-core / data-cloud / shell 等调用点。
    root.updateSegmentSelects = updateSegmentSelects;
    root.updateSegmentClassSelect = updateSegmentClassSelect;
    root.renderSegmentAnalysis = renderSegmentAnalysis;
    root.exportSegmentExcel = exportSegmentExcel;
    root.SegmentAnalysisRuntime = {
        updateSegmentSelects,
        updateSegmentClassSelect,
        renderSegmentAnalysis,
        exportSegmentExcel
    };
})(typeof window !== 'undefined' ? window : globalThis);
