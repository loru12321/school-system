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
        inputSignature: '',
        rowsRef: null,
        rowsSignature: '',
        rows: [],
        summarySignature: '',
        summaryHtml: '',
        tableSignature: '',
        tableHtml: '',
        generation: 0,
        tableRenderToken: 0
    };

    function buildBlankScoreAuditInputSignature(visibleSubjects) {
        const subjects = Array.isArray(visibleSubjects) ? visibleSubjects : getSubjects();
        const rows = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        return [
            root.__RAW_DATA_VERSION || 0,
            rows.length,
            subjects.join('|')
        ].join('::');
    }

    function collectBlankScoreAuditRows(visibleSubjects, options = {}) {
        const subjects = Array.isArray(visibleSubjects) ? visibleSubjects : getSubjects();
        const sourceRows = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        const inputSignature = buildBlankScoreAuditInputSignature(subjects);
        const force = options && options.force === true;
        if (!force
            && BlankScoreAuditPerfCache.rowsRef === sourceRows
            && BlankScoreAuditPerfCache.inputSignature === inputSignature) {
            return BlankScoreAuditPerfCache.rows;
        }
        const rows = [];
        let blankCount = 0;
        let zeroCount = 0;
        let totalSum = 0;
        sourceRows.forEach(student => {
            totalSum += Number(student?.total) || 0;
            const audit = root.getStudentZeroScoreAuditSubjects(student, subjects);
            blankCount += audit.blankSubjects.length;
            zeroCount += audit.zeroSubjects.length;
            audit.blankSubjects.forEach(subject => rows.push({ student, subject, type: '原始空白，按0分计' }));
            audit.zeroSubjects.forEach(subject => rows.push({ student, subject, type: '0分记录，需核对是否空分' }));
        });
        BlankScoreAuditPerfCache.generation += 1;
        BlankScoreAuditPerfCache.rowsRef = sourceRows;
        BlankScoreAuditPerfCache.inputSignature = inputSignature;
        BlankScoreAuditPerfCache.rowsSignature = [
            inputSignature,
            blankCount,
            zeroCount,
            totalSum.toFixed(2),
            BlankScoreAuditPerfCache.generation
        ].join('::');
        BlankScoreAuditPerfCache.rows = rows;
        return rows;
    }

    function buildBlankScoreAuditRowsHtml(rows, start, end) {
        return rows.slice(start, end).map(({ student, subject, type }) => {
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
    }

    function scheduleBlankScoreAuditChunk(task) {
        if (typeof root.requestIdleCallback === 'function') {
            root.requestIdleCallback(task, { timeout: 500 });
            return;
        }
        root.setTimeout(task, 32);
    }

    function renderBlankScoreAuditTable(tbody, rows, options = {}) {
        if (!tbody) return false;
        const limit = Number(options.limit || 120);
        const initialLimit = Math.max(40, Number(options.initialLimit || limit));
        const chunkSize = Math.max(40, Number(options.chunkSize || initialLimit));
        const targetCount = Math.min(rows.length, limit);
        const tableSignature = `${BlankScoreAuditPerfCache.rowsSignature}::${limit}`;
        if (tbody.dataset.blankScoreAuditSig === tableSignature && BlankScoreAuditPerfCache.tableSignature === tableSignature) {
            if (typeof options.onComplete === 'function') options.onComplete();
            return false;
        }
        if (tbody.dataset.blankScoreAuditTargetSig === tableSignature
            && tbody.dataset.blankScoreAuditComplete === '0') return true;

        const token = ++BlankScoreAuditPerfCache.tableRenderToken;
        const firstEnd = Math.min(targetCount, initialLimit);
        tbody.innerHTML = buildBlankScoreAuditRowsHtml(rows, 0, firstEnd);
        tbody.dataset.blankScoreAuditTargetSig = tableSignature;
        tbody.dataset.blankScoreAuditRendered = String(firstEnd);
        tbody.dataset.blankScoreAuditComplete = firstEnd >= targetCount ? '1' : '0';

        const finish = () => {
            tbody.dataset.blankScoreAuditSig = tableSignature;
            tbody.dataset.blankScoreAuditComplete = '1';
            BlankScoreAuditPerfCache.tableSignature = tableSignature;
            BlankScoreAuditPerfCache.tableHtml = tbody.innerHTML;
            if (typeof options.onComplete === 'function') options.onComplete();
        };
        if (firstEnd >= targetCount) {
            finish();
            return false;
        }

        const appendNext = () => {
            if (token !== BlankScoreAuditPerfCache.tableRenderToken
                || tbody.dataset.blankScoreAuditTargetSig !== tableSignature) return;
            const section = tbody.closest?.('#blank-score-audit');
            if (section && !section.classList.contains('active')) {
                tbody.dataset.blankScoreAuditTargetSig = '';
                tbody.dataset.blankScoreAuditComplete = '0';
                return;
            }
            const start = Number(tbody.dataset.blankScoreAuditRendered || 0);
            const end = Math.min(targetCount, start + chunkSize);
            tbody.insertAdjacentHTML('beforeend', buildBlankScoreAuditRowsHtml(rows, start, end));
            tbody.dataset.blankScoreAuditRendered = String(end);
            if (end >= targetCount) finish();
            else scheduleBlankScoreAuditChunk(appendNext);
        };
        scheduleBlankScoreAuditChunk(appendNext);
        return true;
    }

    function buildBlankScoreAuditSummaryHtml(rows, options = {}) {
        const limit = Number(options.limit || 120);
        const pending = options.pending === true;
        const summarySignature = `${BlankScoreAuditPerfCache.rowsSignature}::${limit}::${pending ? 'pending' : 'complete'}`;
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
        const targetCount = Math.min(rows.length, limit);
        const tail = pending
            ? `名单正在分批显示，本次将加载 ${targetCount} 条，可先查看已出现的记录。`
            : (rows.length > limit ? `当前展示前 ${limit} 条，完整名单请按学校/班级继续筛选。` : '已展示全部核对记录。');
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

    function renderBlankScoreAuditModule(options = {}) {
        const rootEl = root.document.getElementById('blank-score-audit-module-root');
        const summary = root.document.getElementById('blank-score-audit-module-summary');
        const tbody = root.document.getElementById('blank-score-audit-module-body');
        const empty = root.document.getElementById('blank-score-audit-module-empty');
        if (!rootEl || !summary || !tbody) return;
        const rows = collectBlankScoreAuditRows(getSubjects(), options);
        if (!rows.length) {
            BlankScoreAuditPerfCache.tableRenderToken += 1;
            const emptyHtml = '<span><strong>暂无需要单独核对的空分/0分学科。</strong></span><span>如学生单科为空，系统会按 0 分参与排名，并自动在这里生成记录。</span>';
            if (summary.innerHTML !== emptyHtml) summary.innerHTML = emptyHtml;
            if (tbody.innerHTML) tbody.innerHTML = '';
            if (empty) empty.style.display = '';
            return;
        }
        if (empty) empty.style.display = 'none';
        const limit = 500;
        const initialLimit = 80;
        const pending = Math.min(rows.length, limit) > initialLimit;
        const summaryHtml = buildBlankScoreAuditSummaryHtml(rows, { limit, pending });
        if (summary.innerHTML !== summaryHtml) summary.innerHTML = summaryHtml;
        renderBlankScoreAuditTable(tbody, rows, {
            limit,
            initialLimit,
            chunkSize: 80,
            onComplete: () => {
                if (BlankScoreAuditPerfCache.rows !== rows) return;
                const completeHtml = buildBlankScoreAuditSummaryHtml(rows, { limit, pending: false });
                if (summary.innerHTML !== completeHtml) summary.innerHTML = completeHtml;
            }
        });
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
            renderBlankScoreAuditModule({ force: true });
        });
    }
})(typeof window !== 'undefined' ? window : globalThis);
