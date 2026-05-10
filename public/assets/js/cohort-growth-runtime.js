(function (root) {
    if (!root) return;

    const escapeHtml = root.SchoolRuntime && typeof root.SchoolRuntime.escapeHtml === 'function'
        ? root.SchoolRuntime.escapeHtml
        : (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));

    function toFiniteNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function getCohortExams() {
        const db = root.COHORT_DB && typeof root.COHORT_DB === 'object' ? root.COHORT_DB : null;
        return Object.values(db?.exams || {}).sort((a, b) => Number(a?.createdAt || 0) - Number(b?.createdAt || 0));
    }

    function renderEmptyRow(tbody, colspan, message) {
        if (!tbody) return;
        tbody.innerHTML = `<tr><td colspan="${colspan}" class="analysis-empty-cell">${escapeHtml(message)}</td></tr>`;
    }

    function renderCell(label, value, className = '') {
        const classAttr = className ? ` class="${className}"` : '';
        return `<td data-label="${escapeHtml(label)}"${classAttr}>${value}</td>`;
    }

    const CohortGrowthRuntime = {
        cache: { volatility: [], growth: [] },

        render() {
            if (!getCohortExams().length) {
                return root.alert ? root.alert('当前届别暂无历史考试数据') : undefined;
            }
            const result = this.compute();
            this.cache = result;
            this.renderVolatility(result.volatility);
            this.renderGrowth(result.growth);
            if (typeof root.refreshResponsiveMobileTables === 'function') {
                root.refreshResponsiveMobileTables(root.document?.getElementById('cohort-growth') || root.document);
            }
            return result;
        },

        compute() {
            const studentSeries = {};

            getCohortExams().forEach((exam) => {
                const validRows = Array.isArray(exam?.data)
                    ? exam.data
                        .map((student, index) => ({ student, index, total: toFiniteNumber(student?.total) }))
                        .filter((row) => row.student && row.total !== null)
                    : [];
                if (!validRows.length) return;

                const totals = validRows.map((row) => row.total);
                const mean = totals.reduce((sum, total) => sum + total, 0) / totals.length;
                const variance = totals.reduce((sum, total) => sum + Math.pow(total - mean, 2), 0) / totals.length;
                const std = Math.sqrt(variance) || 1;

                const sorted = validRows.slice().sort((a, b) => {
                    const scoreDiff = b.total - a.total;
                    return scoreDiff || a.index - b.index;
                });
                const rankMap = new Map();
                for (let index = 0; index < sorted.length;) {
                    const rank = index + 1;
                    const total = sorted[index].total;
                    let next = index + 1;
                    while (next < sorted.length && sorted[next].total === total) next += 1;
                    for (let cursor = index; cursor < next; cursor += 1) {
                        const key = this.getStudentKey(sorted[cursor].student);
                        if (key && !rankMap.has(key)) rankMap.set(key, rank);
                    }
                    index = next;
                }

                validRows.forEach(({ student, total }) => {
                    const key = this.getStudentKey(student);
                    if (!key) return;
                    if (!studentSeries[key]) studentSeries[key] = { name: student.name, class: student.class, z: [], p: [] };
                    studentSeries[key].name = student.name || studentSeries[key].name;
                    studentSeries[key].class = student.class || studentSeries[key].class;
                    const rank = rankMap.get(key) || null;
                    const percentile = rank && sorted.length > 1 ? (1 - (rank - 1) / (sorted.length - 1)) : 0.5;
                    studentSeries[key].z.push((total - mean) / std);
                    studentSeries[key].p.push(percentile);
                });
            });

            const volatility = [];
            const growth = [];

            Object.values(studentSeries).forEach((student) => {
                const finiteZ = student.z.filter(Number.isFinite);
                const finiteP = student.p.filter(Number.isFinite);
                if (finiteZ.length >= 4) {
                    volatility.push({
                        name: student.name,
                        class: student.class,
                        count: finiteZ.length,
                        sigma: this.std(finiteZ)
                    });
                }
                if (finiteP.length >= 2) {
                    const start = finiteP[0];
                    const end = finiteP[finiteP.length - 1];
                    growth.push({
                        name: student.name,
                        class: student.class,
                        start,
                        end,
                        delta: end - start
                    });
                }
            });

            volatility.sort((a, b) => b.sigma - a.sigma);
            growth.sort((a, b) => b.delta - a.delta);

            return { volatility: volatility.slice(0, 50), growth: growth.slice(0, 50) };
        },

        renderVolatility(list) {
            const tbody = root.document?.querySelector('#cohort-volatility-table tbody');
            if (!tbody) return;
            if (!Array.isArray(list) || !list.length) {
                renderEmptyRow(tbody, 4, '暂无足够数据');
                return;
            }
            tbody.innerHTML = list.map((student) => `
                <tr>
                    ${renderCell('姓名', escapeHtml(student.name))}
                    ${renderCell('班级', escapeHtml(student.class || '-'))}
                    ${renderCell('考试次数', escapeHtml(student.count))}
                    ${renderCell('波动率(σ)', escapeHtml(Number(student.sigma).toFixed(2)), 'cohort-growth-metric cohort-growth-metric-volatility')}
                </tr>
            `).join('');
        },

        renderGrowth(list) {
            const tbody = root.document?.querySelector('#cohort-growth-table tbody');
            if (!tbody) return;
            if (!Array.isArray(list) || !list.length) {
                renderEmptyRow(tbody, 5, '暂无足够数据');
                return;
            }
            tbody.innerHTML = list.map((student) => {
                const delta = Number(student.delta) || 0;
                const trendClass = delta >= 0 ? 'is-up' : 'is-down';
                return `
                    <tr>
                        ${renderCell('姓名', escapeHtml(student.name))}
                        ${renderCell('班级', escapeHtml(student.class || '-'))}
                        ${renderCell('起始百分位', `${(Number(student.start) * 100).toFixed(1)}%`)}
                        ${renderCell('最新百分位', `${(Number(student.end) * 100).toFixed(1)}%`)}
                        ${renderCell('变化', `${(delta * 100).toFixed(1)}%`, `cohort-growth-metric ${trendClass}`)}
                    </tr>
                `;
            }).join('');
        },

        exportVolatility() {
            if (!this.cache.volatility || !this.cache.volatility.length) {
                return root.alert ? root.alert('暂无可导出数据') : undefined;
            }
            const rows = [['姓名', '班级', '考试次数', '波动率(σ)']];
            this.cache.volatility.forEach((student) => {
                rows.push([student.name, student.class || '-', student.count, Number(student.sigma.toFixed(3))]);
            });
            const xlsx = root.XLSX;
            if (!xlsx?.utils?.book_new || !xlsx?.writeFile) {
                return root.alert ? root.alert('导出组件尚未加载，请稍后重试') : undefined;
            }
            const workbook = xlsx.utils.book_new();
            xlsx.utils.book_append_sheet(workbook, xlsx.utils.aoa_to_sheet(rows), 'Z-Score波动率');
            xlsx.writeFile(workbook, `纵向成长档案_波动率_${root.CURRENT_COHORT_ID || 'cohort'}.xlsx`);
            return undefined;
        },

        std(values) {
            const finiteValues = (values || []).filter(Number.isFinite);
            if (!finiteValues.length) return 0;
            const mean = finiteValues.reduce((sum, value) => sum + value, 0) / finiteValues.length;
            const variance = finiteValues.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / finiteValues.length;
            return Math.sqrt(variance);
        },

        getStudentKey(student) {
            if (!student) return '';
            return student.uuid || `${student.name || ''}|${student.class || ''}|${student.school || ''}`;
        }
    };

    root.CohortGrowth = CohortGrowthRuntime;
    if (root.SchoolRuntime && typeof root.SchoolRuntime.expose === 'function') {
        root.SchoolRuntime.expose('CohortGrowth', CohortGrowthRuntime);
    }
})(typeof globalThis !== 'undefined' ? globalThis : this);
