((root, factory) => {
    const runtime = factory(root || {});
    if (root && !root.DataQualityRuntime) root.DataQualityRuntime = runtime;
    if (typeof module !== 'undefined' && module.exports) module.exports = factory;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataQualityRuntime(root) {
    const SCORE_MIN = 0;
    const SCORE_MAX_FALLBACK = 150;
    const DEFAULT_LIMIT = 300;

    function normalizeText(value) {
        return String(value == null ? '' : value).trim();
    }

    function escapeHtml(value) {
        return normalizeText(value).replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function asArray(value) {
        return Array.isArray(value) ? value : [];
    }

    function getExamDateSortTimestamp(exam) {
        if (root && typeof root.getExamRecordDateSortTimestamp === 'function') {
            return root.getExamRecordDateSortTimestamp(exam?.examId || exam?.examFullKey || '', exam);
        }
        const dateText = String(exam?.meta?.date || exam?.date || exam?.examId || exam?.examFullKey || '').match(/(\d{4}-\d{2}-\d{2})(?!.*\d{4}-\d{2}-\d{2})/)?.[1] || '';
        const dateTs = dateText ? Date.parse(`${dateText}T00:00:00`) : 0;
        if (Number.isFinite(dateTs) && dateTs > 0) return dateTs;
        if (root && typeof root.getExamSortTimestamp === 'function') {
            const ts = root.getExamSortTimestamp(exam?.examId || exam?.examFullKey || '', Number(exam?.updatedAt || exam?.createdAt || 0));
            if (Number.isFinite(ts) && ts > 0) return ts;
        }
        return Number(exam?.updatedAt || exam?.createdAt || 0);
    }

    function getSubjects() {
        const subjects = asArray(root.SUBJECTS).map(normalizeText).filter(Boolean);
        if (subjects.length) return subjects;
        const rows = asArray(root.RAW_DATA).length ? asArray(root.RAW_DATA) : getCohortExamRows();
        const set = new Set();
        rows.forEach((row) => {
            Object.keys(row && row.scores || {}).forEach((subject) => {
                const name = normalizeText(subject);
                if (name) set.add(name);
            });
        });
        return Array.from(set);
    }

    function getCohortExamRows() {
        const db = root.COHORT_DB || (root.CohortDB && typeof root.CohortDB.ensure === 'function' ? root.CohortDB.ensure() : null);
        const exams = db && db.exams && typeof db.exams === 'object' ? db.exams : {};
        const preferredId = normalizeText(root.CURRENT_EXAM_ID || root.currentExamId);
        const preferred = preferredId && exams[preferredId] && asArray(exams[preferredId].data);
        if (preferred && preferred.length) return preferred;
        const latest = Object.values(exams)
            .filter(Boolean)
            .sort((left, right) => getExamDateSortTimestamp(right) - getExamDateSortTimestamp(left))
            .find((exam) => asArray(exam && exam.data).length);
        return latest ? asArray(latest.data) : [];
    }

    function getFullScore(subject) {
        const config = root.CONFIG || {};
        const fullScoreMap = config.fullScore || config.fullScores || root.FULL_SCORE || {};
        const raw = Number(fullScoreMap && fullScoreMap[subject]);
        return Number.isFinite(raw) && raw > 0 ? raw : SCORE_MAX_FALLBACK;
    }

    function getRows() {
        const rows = asArray(root.RAW_DATA);
        if (rows.length) return rows;
        const cohortRows = getCohortExamRows();
        if (cohortRows.length) return cohortRows;
        const schools = root.SCHOOLS && typeof root.SCHOOLS === 'object' ? root.SCHOOLS : {};
        return Object.keys(schools).flatMap((schoolName) => {
            const school = schools[schoolName] || {};
            return asArray(school.students).map((student) => ({ school: schoolName, ...student }));
        });
    }

    function pushIssue(issues, type, severity, row, message, detail = '') {
        issues.push({
            type,
            severity,
            message,
            detail,
            school: normalizeText(row && row.school),
            className: normalizeText(row && row.class),
            name: normalizeText(row && row.name),
            examNo: normalizeText(row && (row.examNo || row.exam_no || row.id || row.uuid))
        });
    }

    function analyze(options = {}) {
        const rows = getRows();
        const subjects = getSubjects();
        const issues = [];
        const identityMap = new Map();
        const schoolSet = new Set();
        const classSet = new Set();
        const subjectMissingCount = new Map();

        rows.forEach((row, index) => {
            const school = normalizeText(row && row.school);
            const className = normalizeText(row && row.class);
            const name = normalizeText(row && row.name);
            const examNo = normalizeText(row && (row.examNo || row.exam_no || row.id || row.uuid));

            if (school) schoolSet.add(school);
            if (className) classSet.add(`${school || 'unknown'}::${className}`);

            if (!school) pushIssue(issues, 'missing-school', 'high', row, '缺少学校');
            if (!className) pushIssue(issues, 'missing-class', 'medium', row, '缺少班级');
            if (!name) pushIssue(issues, 'missing-name', 'high', row, '缺少姓名');

            const identity = [school, className, name, examNo || `row-${index}`].join('::');
            if (identityMap.has(identity)) {
                pushIssue(issues, 'duplicate-identity', 'high', row, '疑似重复学生记录', `与第 ${identityMap.get(identity) + 1} 行身份一致`);
            } else {
                identityMap.set(identity, index);
            }

            const scores = row && row.scores && typeof row.scores === 'object' ? row.scores : {};
            subjects.forEach((subject) => {
                const raw = scores[subject];
                const score = Number(raw);
                if (raw === undefined || raw === null || raw === '') {
                    subjectMissingCount.set(subject, (subjectMissingCount.get(subject) || 0) + 1);
                    return;
                }
                if (!Number.isFinite(score)) {
                    pushIssue(issues, 'invalid-score', 'high', row, '分数不是有效数字', subject);
                    return;
                }
                const fullScore = getFullScore(subject);
                if (score < SCORE_MIN || score > fullScore) {
                    pushIssue(issues, 'score-out-of-range', 'high', row, '分数超出合理范围', `${subject}: ${score}/${fullScore}`);
                }
            });
        });

        subjectMissingCount.forEach((count, subject) => {
            if (count > 0 && rows.length > 0 && count / rows.length >= 0.2) {
                issues.push({
                    type: 'subject-missing-high',
                    severity: 'medium',
                    message: '科目缺失比例偏高',
                    detail: `${subject}: ${count}/${rows.length}`,
                    school: '',
                    className: '',
                    name: '',
                    examNo: ''
                });
            }
        });

        const severityRank = { high: 0, medium: 1, low: 2 };
        issues.sort((a, b) => (severityRank[a.severity] ?? 9) - (severityRank[b.severity] ?? 9));

        const limit = Number(options.limit || DEFAULT_LIMIT);
        const visibleIssues = Number.isFinite(limit) ? issues.slice(0, limit) : issues;

        return {
            rowCount: rows.length,
            schoolCount: schoolSet.size,
            classCount: classSet.size,
            subjectCount: subjects.length,
            issueCount: issues.length,
            highCount: issues.filter((issue) => issue.severity === 'high').length,
            mediumCount: issues.filter((issue) => issue.severity === 'medium').length,
            lowCount: issues.filter((issue) => issue.severity === 'low').length,
            visibleIssueCount: visibleIssues.length,
            issues: visibleIssues
        };
    }

    function ensureSection() {
        let section = root.document && root.document.getElementById('data-quality');
        if (section) return section;
        const upload = root.document && root.document.getElementById('upload');
        const container = upload && upload.parentNode;
        if (!container || !root.document) return null;
        section = root.document.createElement('div');
        section.id = 'data-quality';
        section.className = 'section card-box analysis-workspace analysis-workspace-upload';
        section.innerHTML = `
            <div class="analysis-shell-head data-quality-head">
                <div>
                    <h2>数据质量体检</h2>
                    <p>上传后先检查缺字段、重复身份、异常分数和科目缺失，再进入分析模块。</p>
                </div>
                <div class="analysis-actions">
                    <button type="button" class="btn btn-blue" data-data-quality-run><i class="ti ti-stethoscope"></i> 开始体检</button>
                    <button type="button" class="btn btn-green" data-data-quality-export><i class="ti ti-download"></i> 导出问题</button>
                </div>
            </div>
            <div class="analysis-status-text" data-data-quality-status></div>
            <div class="data-quality-kpis" data-data-quality-kpis></div>
            <div class="table-wrap analysis-table-shell data-quality-table-wrap">
                <table class="analysis-table-dense data-quality-table">
                    <thead>
                        <tr>
                            <th>级别</th>
                            <th>问题</th>
                            <th>学校</th>
                            <th>班级</th>
                            <th>姓名</th>
                            <th>详情</th>
                        </tr>
                    </thead>
                    <tbody data-data-quality-tbody>
                        <tr><td colspan="6" class="analysis-empty-cell">点击“开始体检”后生成数据问题清单。</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        upload.insertAdjacentElement('afterend', section);
        return section;
    }

    function setExportState(section, message, type = '') {
        if (!section) return;
        const status = section.querySelector('[data-data-quality-status]');
        if (status) {
            status.textContent = message || '';
            status.className = `analysis-status-text ${type}`.trim();
        }
    }

    function renderSummary(section, result) {
        const kpis = section && section.querySelector('[data-data-quality-kpis]');
        if (!kpis) return;
        const cards = [
            ['学生记录', result.rowCount],
            ['学校', result.schoolCount],
            ['班级', result.classCount],
            ['科目', result.subjectCount],
            ['高风险', result.highCount],
            ['待处理', result.issueCount]
        ];
        kpis.innerHTML = cards.map(([label, value]) => `
            <div class="data-quality-kpi">
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
            </div>
        `).join('');
    }

    function renderIssues(section, result) {
        const tbody = section && section.querySelector('[data-data-quality-tbody]');
        if (!tbody) return;
        if (!result.issues.length) {
            tbody.innerHTML = '<tr><td colspan="6" class="analysis-empty-cell">未发现明显数据问题，可以继续进入分析模块。</td></tr>';
            return;
        }
        tbody.innerHTML = result.issues.map((issue) => `
            <tr>
                <td><span class="data-quality-severity is-${escapeHtml(issue.severity)}">${escapeHtml(issue.severity)}</span></td>
                <td>${escapeHtml(issue.message)}</td>
                <td>${escapeHtml(issue.school || '-')}</td>
                <td>${escapeHtml(issue.className || '-')}</td>
                <td>${escapeHtml(issue.name || '-')}</td>
                <td>${escapeHtml(issue.detail || issue.examNo || '-')}</td>
            </tr>
        `).join('');
    }

    function render() {
        const section = ensureSection();
        if (!section) return null;
        const result = analyze();
        section.__dataQualityLastResult = result;
        renderSummary(section, result);
        renderIssues(section, result);
        const clipped = result.issueCount > result.visibleIssueCount ? `，表格先展示 ${result.visibleIssueCount} 条` : '';
        setExportState(section, result.issueCount ? `发现 ${result.issueCount} 个问题${clipped}，导出会包含全部问题。` : '未发现明显数据问题。', result.issueCount ? 'is-error' : 'is-success');
        if (typeof root.refreshResponsiveMobileTables === 'function') root.refreshResponsiveMobileTables(section);
        return result;
    }

    function exportIssues() {
        const section = ensureSection();
        const result = analyze({ limit: Infinity });
        const issues = result && result.issues || [];
        if (!issues.length) {
            setExportState(section, '当前没有可导出的问题清单。', 'is-success');
            return false;
        }
        const header = ['级别', '问题', '学校', '班级', '姓名', '详情'];
        const rows = issues.map((issue) => [issue.severity, issue.message, issue.school, issue.className, issue.name, issue.detail || issue.examNo || '']);
        const csv = [header, ...rows]
            .map((row) => row.map((cell) => `"${normalizeText(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');
        const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = root.document.createElement('a');
        link.href = url;
        link.download = 'data-quality-issues.csv';
        link.click();
        URL.revokeObjectURL(url);
        setExportState(section, `已导出 ${issues.length} 条问题。`, 'is-success');
        return true;
    }

    function bind() {
        const section = ensureSection();
        if (!section || section.__dataQualityBound) return section;
        section.__dataQualityBound = true;
        section.querySelector('[data-data-quality-run]')?.addEventListener('click', render);
        section.querySelector('[data-data-quality-export]')?.addEventListener('click', exportIssues);
        return section;
    }

    function init() {
        bind();
        return render();
    }

    if (root.document) {
        if (root.document.readyState === 'loading') {
            root.document.addEventListener('DOMContentLoaded', bind, { once: true });
        } else {
            bind();
        }
    }

    return { analyze, render, init, bind, ensureSection, exportIssues };
});
