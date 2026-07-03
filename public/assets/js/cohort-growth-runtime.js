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

    const ScopeOptionCache = {
        examsSignature: '',
        exams: [],
        schoolListSignature: '',
        schoolList: [],
        allRowsSignature: '',
        allRows: []
    };

    function getRawCohortExams() {
        const db = root.COHORT_DB && typeof root.COHORT_DB === 'object' ? root.COHORT_DB : null;
        return db?.exams || {};
    }

    function getCohortExamsSignature() {
        return Object.entries(getRawCohortExams())
            .map(([key, exam]) => [
                key,
                String(exam?.examId || ''),
                String(exam?.examFullKey || ''),
                Number(exam?.createdAt || 0),
                Number(exam?.updatedAt || 0),
                Array.isArray(exam?.data) ? exam.data.length : 0
            ].join(':'))
            .sort()
            .join('|');
    }

    function getCohortExams() {
        const signature = getCohortExamsSignature();
        if (ScopeOptionCache.examsSignature === signature) return ScopeOptionCache.exams;
        ScopeOptionCache.examsSignature = signature;
        ScopeOptionCache.exams = Object.values(getRawCohortExams())
            .sort((a, b) => Number(a?.createdAt || 0) - Number(b?.createdAt || 0));
        ScopeOptionCache.schoolListSignature = '';
        ScopeOptionCache.allRowsSignature = '';
        return ScopeOptionCache.exams;
    }

    function normalizeText(value) {
        return String(value || '').trim();
    }

    function normalizeClassName(value) {
        if (root.AuthState && typeof root.AuthState.normalizeClassName === 'function') {
            return root.AuthState.normalizeClassName(value || '');
        }
        if (typeof root.normalizeClass === 'function') return root.normalizeClass(value || '');
        return normalizeText(value).replace(/\s+/g, '');
    }

    function isAllSchool(value) {
        const text = normalizeText(value);
        const lower = text.toLowerCase();
        return !text || lower === 'all' || lower === '__all__' || text.includes('全部') || text.includes('全乡') || text.includes('全镇');
    }

    function sameSchool(left, right) {
        const a = normalizeText(left);
        const b = normalizeText(right);
        if (!a || !b) return false;
        if (a === b) return true;
        if (typeof root.areSchoolNamesEquivalent === 'function') {
            try {
                return !!root.areSchoolNamesEquivalent(a, b);
            } catch (_) {
                return false;
            }
        }
        return false;
    }

    function getSchoolList() {
        const examsSignature = ScopeOptionCache.examsSignature || getCohortExamsSignature();
        const rawLength = Array.isArray(root.RAW_DATA) ? root.RAW_DATA.length : 0;
        const schoolKeys = Object.keys(root.SCHOOLS || {}).sort().join('|');
        const signature = `${examsSignature}::${rawLength}::${schoolKeys}`;
        if (ScopeOptionCache.schoolListSignature === signature) return ScopeOptionCache.schoolList;
        const names = new Set();
        const collect = (value) => {
            const school = normalizeText(value);
            if (school) names.add(school);
        };
        if (typeof root.listAvailableSchoolsForCompare === 'function') {
            root.listAvailableSchoolsForCompare('all').forEach(collect);
        }
        Object.keys(root.SCHOOLS || {}).forEach(collect);
        (Array.isArray(root.RAW_DATA) ? root.RAW_DATA : []).forEach((row) => collect(row?.school));
        getCohortExams().forEach((exam) => {
            (Array.isArray(exam?.data) ? exam.data : []).forEach((row) => collect(row?.school));
        });
        ScopeOptionCache.schoolListSignature = signature;
        ScopeOptionCache.schoolList = Array.from(names).sort((left, right) => left.localeCompare(right, 'zh-CN'));
        return ScopeOptionCache.schoolList;
    }

    function getAllCohortRows() {
        const signature = ScopeOptionCache.examsSignature || getCohortExamsSignature();
        if (ScopeOptionCache.allRowsSignature === signature) return ScopeOptionCache.allRows;
        const rows = [];
        getCohortExams().forEach((exam) => {
            if (Array.isArray(exam?.data)) rows.push(...exam.data);
        });
        ScopeOptionCache.allRowsSignature = signature;
        ScopeOptionCache.allRows = rows;
        return rows;
    }

    function getRowsForSchool(school) {
        const rows = getAllCohortRows();
        if (isAllSchool(school)) return rows;
        return rows.filter((row) => sameSchool(row?.school, school));
    }

    function fillSelect(select, options, allLabel, oldValue) {
        if (!select) return;
        const values = Array.from(new Set((options || []).map(normalizeText).filter(Boolean)));
        const signature = `${allLabel}::${values.join('|')}`;
        if (select.dataset.cgOptionsSig === signature) {
            if (oldValue && Array.from(select.options || []).some((option) => option.value === oldValue)) {
                select.value = oldValue;
            }
            return;
        }
        select.innerHTML = `<option value="ALL">${escapeHtml(allLabel)}</option>` + values
            .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
            .join('');
        select.dataset.cgOptionsSig = signature;
        if (oldValue && Array.from(select.options || []).some((option) => option.value === oldValue)) {
            select.value = oldValue;
        }
    }

    function updateClassSelectForSchool(schoolValue) {
        const classSelect = root.document?.getElementById('cgClassSelect');
        if (!classSelect) return;
        const oldClass = classSelect.value;
        const classes = getRowsForSchool(schoolValue)
            .map((row) => row?.class)
            .filter(Boolean)
            .sort((left, right) => normalizeClassName(left).localeCompare(normalizeClassName(right), 'zh-Hans-CN', { numeric: true }));
        fillSelect(classSelect, classes, '全部班级', oldClass);
    }

    function updateScopeControls() {
        const schoolSelect = root.document?.getElementById('cgSchoolSelect');
        if (!schoolSelect) return;
        const oldSchool = schoolSelect.value;
        fillSelect(schoolSelect, getSchoolList(), '全部学校', oldSchool);
        if (!oldSchool) {
            const currentSchool = typeof root.readCurrentSchool === 'function' ? root.readCurrentSchool() : '';
            const match = Array.from(schoolSelect.options || []).find((option) => sameSchool(option.value, currentSchool));
            if (match) schoolSelect.value = match.value;
        }
        updateClassSelectForSchool(schoolSelect.value);
    }

    function getSelectedScope() {
        return {
            school: root.document?.getElementById('cgSchoolSelect')?.value || 'ALL',
            className: root.document?.getElementById('cgClassSelect')?.value || 'ALL'
        };
    }

    function filterRowsByScope(rows, scope) {
        const selectedClass = normalizeClassName(scope?.className || '');
        return (Array.isArray(rows) ? rows : []).filter((row) => {
            if (!isAllSchool(scope?.school) && !sameSchool(row?.school, scope.school)) return false;
            if (selectedClass && selectedClass.toLowerCase() !== 'all' && normalizeClassName(row?.class || '') !== selectedClass) return false;
            return true;
        });
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
        cacheSignature: '',
        updateScopeControls,
        updateClassSelectForSchool,
        getRenderSignature(scope = getSelectedScope()) {
            return [
                getCohortExamsSignature(),
                normalizeText(scope.school || 'ALL'),
                normalizeClassName(scope.className || 'ALL')
            ].join('::');
        },

        render() {
            updateScopeControls();
            if (!getCohortExams().length) {
                return root.alert ? root.alert('当前届别暂无历史考试数据') : undefined;
            }
            const scope = getSelectedScope();
            const signature = this.getRenderSignature(scope);
            let result = this.cache;
            if (this.cacheSignature === signature) {
                result = this.cache;
            } else {
                result = this.compute(scope);
            }
            this.cache = result;
            this.cacheSignature = signature;
            this.renderVolatility(result.volatility);
            this.renderGrowth(result.growth);
            if (typeof root.refreshResponsiveMobileTables === 'function') {
                root.refreshResponsiveMobileTables(root.document?.getElementById('cohort-growth') || root.document);
            }
            return result;
        },

        compute(scope = getSelectedScope()) {
            const studentSeries = {};

            getCohortExams().forEach((exam) => {
                const validRows = Array.isArray(exam?.data)
                    ? filterRowsByScope(exam.data, scope)
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
