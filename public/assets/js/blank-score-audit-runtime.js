/*
 * 空分/0分学科核对（blank-score-audit）运行时模块
 *
 * 从 app.js 抽出的「空分/0分学科核对清单」纯展示模块：集中展示原始 Excel 空白学科
 * 与 0 分记录（这些学科仍按 0 分参与单科/总分/校排/镇排/县排），带 memo 缓存、
 * 表格渲染、汇总文案、以及刷新按钮的事件委托。
 *
 * 纯只读诊断 + DOM 展示，零计算/口径耦合——只读 RAW_DATA/SUBJECTS/__RAW_DATA_VERSION
 * 与每个学生的 blankScoreSubjects/scores/ranks/total，只写 tbody/summary/panel 的
 * innerHTML 与自身 memo 缓存，不写任何全局成绩/排名/评价状态。
 *
 * getStudentBlankScoreSubjects / getStudentZeroScoreAuditSubjects 这两个只读原语
 * 仍留在 app.js（被核心模块 student-details-render-runtime.js 以裸全局方式在渲染期
 * 调用，若移入 DEFERRED 模块会在其加载前抛 ReferenceError）；本模块经
 * root.getStudentZeroScoreAuditSubjects 读取，app.js 的 Object.assign(window,...) 已导出。
 *
 * 调用点不变：switchTab（app.js:3952，typeof 守卫，DEFERRED 容错）+ HTML 刷新按钮
 * [data-blank-score-audit-refresh]（src/index.html:1782，本模块事件委托）。
 */
(function (root) {
    if (!root) return;

    // escapeAppHtml 留在 app.js（未挂 window），此处沿用 segment-analysis/subject-balance
    // 的本地 esc 回退模式。
    function esc(value) {
        if (typeof root.escapeAppHtml === 'function') return root.escapeAppHtml(value);
        return String(value == null ? '' : value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getSubjects() {
        return Array.isArray(root.SUBJECTS) ? root.SUBJECTS : [];
    }

    const BlankScoreAuditPerfCache = {
        rowsSignature: '',
        rows: [],
        summarySignature: '',
        summaryHtml: '',
        tableSignature: '',
        tableHtml: ''
    };

    function buildBlankScoreAuditSignature(visibleSubjects) {
        const subjects = Array.isArray(visibleSubjects) ? visibleSubjects : getSubjects();
        const rows = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        let blankCount = 0;
        let zeroCount = 0;
        let totalSum = 0;
        rows.forEach(student => {
            totalSum += Number(student?.total) || 0;
            const blankSubjects = Array.isArray(student?.blankScoreSubjects) ? student.blankScoreSubjects : [];
            blankCount += blankSubjects.length;
            subjects.forEach(subject => {
                const score = Number(student?.scores?.[subject]);
                if (Number.isFinite(score) && score === 0 && !blankSubjects.includes(subject)) zeroCount += 1;
            });
        });
        return [
            root.__RAW_DATA_VERSION || 0,
            rows.length,
            subjects.join('|'),
            blankCount,
            zeroCount,
            totalSum.toFixed(2)
        ].join('::');
    }

    function collectBlankScoreAuditRows(visibleSubjects) {
        const subjects = Array.isArray(visibleSubjects) ? visibleSubjects : getSubjects();
        const signature = buildBlankScoreAuditSignature(subjects);
        if (BlankScoreAuditPerfCache.rowsSignature === signature) {
            return BlankScoreAuditPerfCache.rows;
        }
        const rows = [];
        (Array.isArray(root.RAW_DATA) ? root.RAW_DATA : []).forEach(student => {
            const audit = root.getStudentZeroScoreAuditSubjects(student, subjects);
            audit.blankSubjects.forEach(subject => rows.push({ student, subject, type: '原始空白，按0分计' }));
            audit.zeroSubjects.forEach(subject => rows.push({ student, subject, type: '0分记录，需核对是否空分' }));
        });
        BlankScoreAuditPerfCache.rowsSignature = signature;
        BlankScoreAuditPerfCache.rows = rows;
        return rows;
    }

    function renderBlankScoreAuditTable(tbody, rows, options = {}) {
        if (!tbody) return;
        const limit = Number(options.limit || 120);
        const tableSignature = `${BlankScoreAuditPerfCache.rowsSignature}::${limit}`;
        if (tbody.dataset.blankScoreAuditSig === tableSignature && BlankScoreAuditPerfCache.tableSignature === tableSignature) return;
        const html = rows.slice(0, limit).map(({ student, subject, type }) => {
            const rank = student?.ranks || {};
            const subjectRank = rank?.[subject] || {};
            const townRank = subjectRank.township ?? subjectRank.town ?? '-';
            return `<tr>
            <td>${esc(student?.school || '-')}</td>
            <td>${esc(student?.class || '-')}</td>
            <td>${esc(student?.name || '-')}</td>
            <td>${esc(student?.id || '-')}</td>
            <td>${esc(subject)}</td>
            <td><span style="display:inline-flex; align-items:center; gap:4px; padding:2px 8px; border-radius:999px; background:#fff7ed; color:#b45309; font-weight:700; font-size:12px;">${esc(type)}</span></td>
            <td>${Number.isFinite(Number(student?.total)) ? Number(student.total).toFixed(1).replace(/\.0$/, '') : '-'}</td>
            <td>${subjectRank.school ?? '-'}</td>
            <td>${townRank}</td>
            <td>${subjectRank.county ?? '-'}</td>
        </tr>`;
        }).join('');
        tbody.innerHTML = html;
        tbody.dataset.blankScoreAuditSig = tableSignature;
        BlankScoreAuditPerfCache.tableSignature = tableSignature;
        BlankScoreAuditPerfCache.tableHtml = html;
    }

    function buildBlankScoreAuditSummaryHtml(rows, options = {}) {
        const limit = Number(options.limit || 120);
        const summarySignature = `${BlankScoreAuditPerfCache.rowsSignature}::${limit}`;
        if (BlankScoreAuditPerfCache.summarySignature === summarySignature) {
            return BlankScoreAuditPerfCache.summaryHtml;
        }
        const subjectCounts = rows.reduce((acc, item) => {
            acc[item.subject] = (acc[item.subject] || 0) + 1;
            return acc;
        }, {});
        const summaryText = Object.entries(subjectCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([subject, count]) => `<span><strong>${esc(subject)}：</strong>${count} 人次</span>`)
            .join('');
        const tail = rows.length > limit ? `当前展示前 ${limit} 条，完整名单请按学校/班级继续筛选。` : '已展示全部核对记录。';
        const html = `<span><strong>共 ${rows.length} 条学科记录</strong></span>${summaryText}<span>${tail}</span>`;
        BlankScoreAuditPerfCache.summarySignature = summarySignature;
        BlankScoreAuditPerfCache.summaryHtml = html;
        return html;
    }

    function renderBlankScoreAuditPanel() {
        const panel = root.document.getElementById('blank-score-audit-panel');
        const tbody = root.document.getElementById('blank-score-audit-body');
        const summary = root.document.getElementById('blank-score-audit-summary');
        if (!panel) return;
        panel.style.display = 'none';
        if (tbody) tbody.innerHTML = '';
        if (summary) summary.innerHTML = '';
    }

    function renderBlankScoreAuditModule() {
        const rootEl = root.document.getElementById('blank-score-audit-module-root');
        const summary = root.document.getElementById('blank-score-audit-module-summary');
        const tbody = root.document.getElementById('blank-score-audit-module-body');
        const empty = root.document.getElementById('blank-score-audit-module-empty');
        if (!rootEl || !summary || !tbody) return;
        const rows = collectBlankScoreAuditRows(getSubjects());
        if (!rows.length) {
            const emptyHtml = '<span><strong>暂无需要单独核对的空分/0分学科。</strong></span><span>如学生单科为空，系统会按 0 分参与排名，并自动在这里生成记录。</span>';
            if (summary.innerHTML !== emptyHtml) summary.innerHTML = emptyHtml;
            if (tbody.innerHTML) tbody.innerHTML = '';
            if (empty) empty.style.display = '';
            return;
        }
        if (empty) empty.style.display = 'none';
        const summaryHtml = buildBlankScoreAuditSummaryHtml(rows, { limit: 500 });
        if (summary.innerHTML !== summaryHtml) summary.innerHTML = summaryHtml;
        renderBlankScoreAuditTable(tbody, rows, { limit: 500 });
    }

    // 回挂到 window，保持既有导出契约（switchTab typeof 守卫 + 其它读取方）。
    root.collectBlankScoreAuditRows = collectBlankScoreAuditRows;
    root.renderBlankScoreAuditPanel = renderBlankScoreAuditPanel;
    root.renderBlankScoreAuditModule = renderBlankScoreAuditModule;
    root.BlankScoreAuditRuntime = {
        collectBlankScoreAuditRows,
        renderBlankScoreAuditPanel,
        renderBlankScoreAuditModule
    };

    // 刷新按钮事件委托（[data-blank-score-audit-refresh]，src/index.html:1782）。
    if (!root.__blankScoreAuditRefreshBound) {
        root.__blankScoreAuditRefreshBound = true;
        root.document.addEventListener('click', (event) => {
            const button = event.target && typeof event.target.closest === 'function'
                ? event.target.closest('[data-blank-score-audit-refresh]')
                : null;
            if (!button) return;
            event.preventDefault();
            renderBlankScoreAuditModule();
        });
    }
})(typeof window !== 'undefined' ? window : globalThis);
