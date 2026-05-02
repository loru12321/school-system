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

    function getSchools() {
        try {
            if (root.SCHOOLS && typeof root.SCHOOLS === 'object') return root.SCHOOLS;
            if (typeof SCHOOLS !== 'undefined' && SCHOOLS && typeof SCHOOLS === 'object') return SCHOOLS;
        } catch (_) {}
        return {};
    }

    function getSubjects() {
        try {
            if (Array.isArray(root.SUBJECTS)) return root.SUBJECTS;
            if (typeof SUBJECTS !== 'undefined' && Array.isArray(SUBJECTS)) return SUBJECTS;
        } catch (_) {}
        return [];
    }

    function getThresholds() {
        try {
            if (root.THRESHOLDS && typeof root.THRESHOLDS === 'object') return root.THRESHOLDS;
            if (typeof THRESHOLDS !== 'undefined' && THRESHOLDS && typeof THRESHOLDS === 'object') return THRESHOLDS;
        } catch (_) {}
        return {};
    }

    function getTeacherMap() {
        try {
            if (root.TEACHER_MAP && typeof root.TEACHER_MAP === 'object') return root.TEACHER_MAP;
            if (typeof TEACHER_MAP !== 'undefined' && TEACHER_MAP && typeof TEACHER_MAP === 'object') return TEACHER_MAP;
        } catch (_) {}
        return {};
    }

    function getRollerCoasterStudents() {
        try {
            if (Array.isArray(root.ROLLER_COASTER_STUDENTS)) return root.ROLLER_COASTER_STUDENTS;
            if (typeof ROLLER_COASTER_STUDENTS !== 'undefined' && Array.isArray(ROLLER_COASTER_STUDENTS)) return ROLLER_COASTER_STUDENTS;
        } catch (_) {}
        return [];
    }

    function readMpDataCache() {
        try {
            if (typeof MP_DATA_CACHE !== 'undefined' && Array.isArray(MP_DATA_CACHE)) return MP_DATA_CACHE;
        } catch (_) {}
        return Array.isArray(root.MP_DATA_CACHE) ? root.MP_DATA_CACHE : [];
    }

    function writeMpDataCache(rows) {
        const nextRows = Array.isArray(rows) ? rows : [];
        try {
            if (typeof MP_DATA_CACHE !== 'undefined') MP_DATA_CACHE = nextRows;
        } catch (_) {}
        root.MP_DATA_CACHE = nextRows;
        return nextRows;
    }

    function readMpSnapshots() {
        try {
            if (typeof MP_SNAPSHOTS !== 'undefined' && MP_SNAPSHOTS && typeof MP_SNAPSHOTS === 'object') return MP_SNAPSHOTS;
        } catch (_) {}
        return root.MP_SNAPSHOTS && typeof root.MP_SNAPSHOTS === 'object' ? root.MP_SNAPSHOTS : {};
    }

    function writeMpSnapshots(value) {
        const next = value && typeof value === 'object' ? value : {};
        try {
            if (typeof MP_SNAPSHOTS !== 'undefined') MP_SNAPSHOTS = next;
        } catch (_) {}
        root.MP_SNAPSHOTS = next;
        return next;
    }

    function toFiniteNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }

    function sortChinese(values) {
        return values.slice().sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }));
    }

    function getSchoolOptions() {
        const schools = getSchools();
        if (typeof root.listAvailableSchoolsForCompare === 'function') {
            try {
                return root.listAvailableSchoolsForCompare().filter((name) => schools[name]);
            } catch (_) {}
        }
        return sortChinese(Object.keys(schools || {}));
    }

    function setSelectOptions(select, options, placeholder, preferredValue) {
        if (!select) return '';
        const validOptions = options.map((value) => String(value || '').trim()).filter(Boolean);
        select.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${validOptions
            .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
            .join('')}`;
        if (preferredValue && validOptions.includes(preferredValue)) select.value = preferredValue;
        return select.value || '';
    }

    function updateMpSchoolSelect() {
        const select = root.document?.getElementById('mpSchoolSelect');
        if (!select) return;
        const oldSchool = select.value;
        setSelectOptions(select, getSchoolOptions(), '--请选择学校--', oldSchool);
        updateMpClassSelect();

        const subjectSelect = root.document?.getElementById('mpSubjectSelect');
        if (subjectSelect) {
            const oldSubject = subjectSelect.value;
            subjectSelect.innerHTML = `<option value="ALL">全部学科</option>${getSubjects()
                .map((subject) => `<option value="${escapeHtml(subject)}">${escapeHtml(subject)}</option>`)
                .join('')}`;
            if (oldSubject && (oldSubject === 'ALL' || getSubjects().includes(oldSubject))) subjectSelect.value = oldSubject;
        }
        MP_initSnapshotSelect();
    }

    function updateMpClassSelect() {
        const schoolSelect = root.document?.getElementById('mpSchoolSelect');
        const classSelect = root.document?.getElementById('mpClassSelect');
        if (!schoolSelect || !classSelect) return;
        const schools = getSchools();
        const schoolName = String(schoolSelect.value || '').trim();
        const oldClass = classSelect.value;
        const classes = schoolName && schools[schoolName]
            ? sortChinese([...new Set((schools[schoolName].students || []).map((student) => String(student.class || '').trim()).filter(Boolean))])
            : [];
        setSelectOptions(classSelect, classes, '全部班级', oldClass);
        if (!oldClass) classSelect.value = '';
    }

    function getMarginalConfig() {
        const school = String(root.document?.getElementById('mpSchoolSelect')?.value || '').trim();
        const className = String(root.document?.getElementById('mpClassSelect')?.value || '').trim();
        const subject = String(root.document?.getElementById('mpSubjectSelect')?.value || 'ALL').trim() || 'ALL';
        const rawGap = toFiniteNumber(root.document?.getElementById('mpGap')?.value);
        const gap = Math.max(0.1, rawGap === null ? 5 : rawGap);
        const type = String(root.document?.getElementById('mpType')?.value || 'both').trim() || 'both';
        return { school, className, subject, gap, type };
    }

    function buildTaskRows(config) {
        const schools = getSchools();
        const thresholds = getThresholds();
        const subjects = config.subject === 'ALL' ? getSubjects() : [config.subject];
        const school = schools[config.school];
        if (!school) return { rows: [], taskMap: {} };
        const students = (school.students || []).filter((student) => !config.className || student.class === config.className);
        const taskMap = {};
        const rows = [];

        students.forEach((student) => {
            subjects.forEach((subject) => {
                const score = toFiniteNumber(student?.scores?.[subject]);
                const excLine = toFiniteNumber(thresholds?.[subject]?.exc);
                const passLine = toFiniteNumber(thresholds?.[subject]?.pass);
                if (score === null || excLine === null || passLine === null) return;

                let category = null;
                let targetScore = 0;
                let diff = 0;
                if (config.type !== 'pass' && score >= excLine - config.gap && score < excLine) {
                    category = '拟优';
                    targetScore = excLine;
                    diff = excLine - score;
                }
                if (!category && config.type !== 'exc' && score >= passLine - config.gap && score < passLine) {
                    category = '拟合格';
                    targetScore = passLine;
                    diff = passLine - score;
                }
                if (!category) return;

                const className = String(student.class || '未分班');
                if (!taskMap[className]) taskMap[className] = {};
                if (!taskMap[className][subject]) taskMap[className][subject] = [];
                const row = {
                    school: config.school,
                    class: className,
                    subject,
                    name: String(student.name || ''),
                    score,
                    category,
                    target: Number(targetScore.toFixed(1)),
                    diff: Number(diff.toFixed(1)),
                    rank: typeof root.safeGet === 'function' ? root.safeGet(student, `ranks.${subject}.class`, '-') : '-'
                };
                taskMap[className][subject].push(row);
                rows.push(row);
            });
        });

        return { rows, taskMap };
    }

    function renderGapClass(diff, gap) {
        if (diff > gap * 0.8) return 'gap-red';
        if (diff > gap / 2) return 'gap-orange';
        return 'gap-green';
    }

    function renderTicketTableRow(item, gap, schoolName) {
        const isRollerCoaster = getRollerCoasterStudents().includes(`${schoolName}_${item.name}`);
        const warningTag = isRollerCoaster
            ? '<span class="marginal-warning-tag">需心理干预</span>'
            : '';
        const categoryClass = item.category === '拟优' ? 'is-excellent' : 'is-pass';
        const gapClass = renderGapClass(item.diff, gap);
        return `<tr>
            <td data-label="学生姓名" class="ticket-student-name">${escapeHtml(item.name)}${warningTag}</td>
            <td data-label="当前分">${escapeHtml(item.score)}</td>
            <td data-label="目标"><span class="marginal-category ${categoryClass}">${escapeHtml(item.category)}</span></td>
            <td data-label="差距"><span class="tag-gap ${gapClass}">差 ${escapeHtml(item.diff)}分</span></td>
            <td data-label="班排">${escapeHtml(item.rank)}</td>
            <td data-label="辅导"><span class="chk-box" aria-hidden="true"></span></td>
        </tr>`;
    }

    function renderEmptyState(container, title, note = '') {
        if (!container) return;
        container.innerHTML = `<div class="marginal-empty-state">
            <i class="ti ti-clipboard-list" aria-hidden="true"></i>
            <p>${escapeHtml(title)}</p>
            ${note ? `<span>${escapeHtml(note)}</span>` : ''}
        </div>`;
    }

    function generateMarginalTickets() {
        const container = root.document?.getElementById('mp-tickets-container');
        const config = getMarginalConfig();
        const schools = getSchools();
        if (!container) return { ok: false, reason: 'missing-container', count: 0 };
        if (!config.school || !schools[config.school]) {
            if (root.alert) root.alert('请先选择学校');
            return { ok: false, reason: 'missing-school', count: 0 };
        }

        const { rows, taskMap } = buildTaskRows(config);
        const cacheRows = rows.map((row) => ({
            school: row.school,
            class: row.class,
            subject: row.subject,
            name: row.name,
            score: row.score,
            category: row.category,
            target: row.target.toFixed(1),
            diff: row.diff
        }));
        writeMpDataCache(cacheRows);

        const ticketHtml = [];
        const teacherMap = getTeacherMap();
        Object.keys(taskMap).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true })).forEach((className) => {
            Object.keys(taskMap[className]).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true })).forEach((subject) => {
                const list = taskMap[className][subject].sort((a, b) => a.diff - b.diff || String(a.name).localeCompare(String(b.name), 'zh-CN'));
                if (!list.length) return;
                const teacherName = teacherMap[`${className}_${subject}`] || '科任老师';
                const threshold = getThresholds()[subject] || {};
                const excLine = toFiniteNumber(threshold.exc);
                const passLine = toFiniteNumber(threshold.pass);
                ticketHtml.push(`<div class="task-ticket">
                    <div class="ticket-header">
                        <div>
                            <div class="ticket-title">${escapeHtml(subject)} · ${escapeHtml(className)}</div>
                            <div class="ticket-sub">教师: ${escapeHtml(teacherName)} | 目标人数: ${list.length}人</div>
                        </div>
                        <i class="ti ti-clipboard-check" aria-hidden="true"></i>
                    </div>
                    <div class="ticket-body">
                        <table class="ticket-table">
                            <thead>
                                <tr>
                                    <th>学生姓名</th>
                                    <th>当前分</th>
                                    <th>目标</th>
                                    <th>差距</th>
                                    <th>班排</th>
                                    <th>辅导</th>
                                </tr>
                            </thead>
                            <tbody>${list.map((item) => renderTicketTableRow(item, config.gap, config.school)).join('')}</tbody>
                        </table>
                        <div class="ticket-footer">目标线参考: 优秀>=${excLine === null ? '-' : excLine.toFixed(1)} / 及格>=${passLine === null ? '-' : passLine.toFixed(1)}</div>
                    </div>
                </div>`);
            });
        });

        if (ticketHtml.length) {
            container.innerHTML = ticketHtml.join('');
        } else {
            renderEmptyState(
                container,
                `在当前设定范围内（${config.gap}分）未找到符合条件的临界生。`,
                '请尝试增大临界分值或切换目标类型。'
            );
        }
        return { ok: true, count: cacheRows.length, ticketCount: ticketHtml.length };
    }

    function printMarginalTickets() {
        const ticketCount = root.document?.querySelectorAll('#mp-tickets-container .task-ticket').length || 0;
        if (!ticketCount) {
            if (root.alert) root.alert('请先生成任务单');
            return;
        }
        root.print?.();
    }

    function exportMarginalTasks() {
        const rows = readMpDataCache();
        if (!rows.length) {
            if (root.alert) root.alert('请先生成数据');
            return;
        }
        const xlsx = root.XLSX;
        if (!xlsx?.utils?.book_new || !xlsx?.writeFile) {
            if (root.alert) root.alert('导出组件尚未加载，请稍后重试');
            return;
        }
        const data = [['学校', '班级', '学科', '姓名', '当前分数', '临界类型', '目标分数', '分差']];
        rows.forEach((row) => {
            data.push([row.school, row.class, row.subject, row.name, row.score, row.category, row.target, row.diff]);
        });
        const worksheet = xlsx.utils.aoa_to_sheet(data);
        worksheet['!cols'] = [{ wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, '临界生辅导名单');
        xlsx.writeFile(workbook, '临界生精准辅导任务单.xlsx');
    }

    function MP_initSnapshotSelect() {
        const select = root.document?.getElementById('mp_snapshot_select');
        if (!select) return;
        const snapshots = readMpSnapshots();
        const options = Object.keys(snapshots).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN', { numeric: true }))
            .map((key) => {
                const snapshot = snapshots[key] || {};
                const date = snapshot.timestamp ? new Date(snapshot.timestamp).toLocaleDateString() : '-';
                return `<option value="${escapeHtml(key)}">${escapeHtml(key)} (${escapeHtml(snapshot.count || 0)}人, ${escapeHtml(date)})</option>`;
            });
        select.innerHTML = `<option value="">-- 选择历史任务 --</option>${options.join('')}`;
    }

    function MP_analyzeConversion() {
        const select = root.document?.getElementById('mp_snapshot_select');
        const key = String(select?.value || '').trim();
        const snapshots = readMpSnapshots();
        if (!key) {
            if (root.alert) root.alert('请选择一个历史任务进行对比');
            return { ok: false, reason: 'missing-snapshot' };
        }
        if (!Array.isArray(root.RAW_DATA) || !root.RAW_DATA.length) {
            if (root.alert) root.alert('请先上传【本次考试】的成绩数据');
            return { ok: false, reason: 'missing-data' };
        }
        const snapshot = snapshots[key];
        const oldList = Array.isArray(snapshot?.data) ? snapshot.data : [];
        const schools = getSchools();
        const thresholds = getThresholds();
        const teacherMap = getTeacherMap();
        const stats = {};

        oldList.forEach((task) => {
            const teacherName = teacherMap[`${task.class}_${task.subject}`] || '未配置';
            const groupKey = `${task.school}::${task.class}::${teacherName}::${task.subject}::${task.category}`;
            if (!stats[groupKey]) {
                stats[groupKey] = {
                    school: task.school,
                    className: task.class,
                    teacher: teacherName,
                    subject: task.subject,
                    category: task.category,
                    total: 0,
                    success: 0
                };
            }
            stats[groupKey].total += 1;
            const currentStudent = schools[task.school]?.students?.find((student) => student.name === task.name);
            const score = toFiniteNumber(currentStudent?.scores?.[task.subject]);
            const threshold = thresholds?.[task.subject] || {};
            const excLine = toFiniteNumber(threshold.exc);
            const passLine = toFiniteNumber(threshold.pass);
            if (score === null) return;
            if (task.category === '拟优' && excLine !== null && score >= excLine) stats[groupKey].success += 1;
            if (task.category === '拟合格' && passLine !== null && score >= passLine) stats[groupKey].success += 1;
        });

        const tbody = root.document?.querySelector('#mp_conversion_table tbody');
        if (!tbody) return { ok: false, reason: 'missing-table' };
        const rows = Object.keys(stats).sort().map((statKey) => {
            const row = stats[statKey];
            const rate = row.total > 0 ? row.success / row.total : 0;
            let badgeClass = 'is-danger';
            let badgeText = '需反思';
            if (rate >= 0.8) {
                badgeClass = 'is-great';
                badgeText = '卓越';
            } else if (rate >= 0.5) {
                badgeClass = 'is-good';
                badgeText = '良好';
            } else if (rate >= 0.2) {
                badgeClass = 'is-normal';
                badgeText = '一般';
            }
            return `<tr>
                <td data-label="教师/班级"><strong>${escapeHtml(row.teacher)}</strong><span>${escapeHtml(row.className)}</span></td>
                <td data-label="学科">${escapeHtml(row.subject)}</td>
                <td data-label="目标类型"><span class="marginal-category ${row.category === '拟优' ? 'is-excellent' : 'is-pass'}">${escapeHtml(row.category)}</span></td>
                <td data-label="追踪人数">${escapeHtml(row.total)}</td>
                <td data-label="上线人数"><strong>${escapeHtml(row.success)}</strong></td>
                <td data-label="转化率"><strong>${(rate * 100).toFixed(1)}%</strong></td>
                <td data-label="评价"><span class="conversion-badge ${badgeClass}">${badgeText}</span></td>
            </tr>`;
        });
        tbody.innerHTML = rows.length
            ? rows.join('')
            : '<tr><td colspan="7" class="analysis-empty-cell">未匹配到任何学生，请检查姓名是否一致。</td></tr>';
        root.document?.getElementById('mp-conversion-result')?.classList.remove('hidden');
        if (typeof root.refreshResponsiveMobileTables === 'function') {
            root.refreshResponsiveMobileTables(root.document.getElementById('marginal-push'));
        }
        return { ok: true, rows: rows.length };
    }

    function MP_saveSnapshot() {
        const rows = readMpDataCache();
        if (!rows.length) {
            if (root.alert) root.alert("当前没有生成的临界生名单，请先设置参数并点击'生成辅导单'");
            return;
        }
        const input = root.document?.getElementById('mp_save_name');
        const name = String(input?.value || '').trim();
        if (!name) {
            if (root.alert) root.alert('请输入任务名称（例如：初一上期中临界生）');
            return;
        }
        const snapshots = readMpSnapshots();
        if (snapshots[name] && !root.confirm?.(`任务名 [${name}] 已存在，是否覆盖？`)) return;
        snapshots[name] = {
            timestamp: Date.now(),
            count: rows.length,
            data: rows
        };
        writeMpSnapshots(snapshots);
        root.localStorage?.setItem('MP_SNAPSHOTS', JSON.stringify(snapshots));
        if (root.alert) root.alert('存档成功！下次考试导入数据后，可选择此任务进行转化率分析。');
        MP_initSnapshotSelect();
        if (input) input.value = '';
    }

    function MP_deleteSnapshot() {
        const select = root.document?.getElementById('mp_snapshot_select');
        const key = String(select?.value || '').trim();
        if (!key) return;
        if (!root.confirm?.(`确定删除历史任务 [${key}] 吗？`)) return;
        const snapshots = readMpSnapshots();
        delete snapshots[key];
        writeMpSnapshots(snapshots);
        root.localStorage?.setItem('MP_SNAPSHOTS', JSON.stringify(snapshots));
        MP_initSnapshotSelect();
    }

    root.updateMpSchoolSelect = updateMpSchoolSelect;
    root.updateMpClassSelect = updateMpClassSelect;
    root.generateMarginalTickets = generateMarginalTickets;
    root.printMarginalTickets = printMarginalTickets;
    root.exportMarginalTasks = exportMarginalTasks;
    root.MP_initSnapshotSelect = MP_initSnapshotSelect;
    root.MP_analyzeConversion = MP_analyzeConversion;
    root.MP_saveSnapshot = MP_saveSnapshot;
    root.MP_deleteSnapshot = MP_deleteSnapshot;
    root.MarginalPushRuntime = {
        updateMpSchoolSelect,
        updateMpClassSelect,
        generateMarginalTickets,
        exportMarginalTasks,
        MP_initSnapshotSelect,
        MP_analyzeConversion,
        buildTaskRows
    };

    root.addEventListener?.('load', () => {
        MP_initSnapshotSelect();
    });
})(typeof globalThis !== 'undefined' ? globalThis : this);
