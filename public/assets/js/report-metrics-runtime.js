// Low-frequency report presentation helpers kept outside app.js.
(function installReportMetricsRuntime(root) {
    if (!root || root.__REPORT_METRICS_RUNTIME_PATCHED__) return;

    function enhanceStudentReportMetrics(scopeRoot) {
        const scope = scopeRoot || document;
        const board = scope.querySelector('.report-subject-board');
        if (!board) return;
        if (!scope.querySelector('.report-metric-explain')) {
            const explain = document.createElement('div');
            explain.className = 'report-reality-note report-metric-explain';
            explain.style.marginBottom = '16px';
            explain.innerHTML = `
                <div class="report-reality-title">怎么看百分位和 Z 值</div>
                <ul class="report-reality-list">
                    <li><strong>百分位</strong>：可以理解成“这门学科大约超过了多少同届学生”，数值越高越靠前。</li>
                    <li><strong>Z 值</strong>：可以理解成“和平均水平差多远”，0 附近接近平均，正数越大优势越明显，负数越小越要优先补弱。</li>
                </ul>
            `;
            board.parentNode.insertBefore(explain, board);
            const tipline = document.createElement('div');
            tipline.className = 'report-metric-tipline';
            tipline.textContent = '一句话记忆：百分位看位置，Z 值看和平均水平差多远。';
            explain.appendChild(tipline);
        }
        board.querySelectorAll('.report-subject-meta span').forEach((span) => {
            const text = String(span.textContent || '').trim();
            if (!text) return;
            if (text.startsWith('百分位')) {
                span.textContent = `超过同范围 ${text.replace(/^百分位\s*/, '').trim()} 学生`;
            }
            if (/^Z\s*/i.test(text)) {
                span.textContent = `领先指数 Z ${text.replace(/^Z\s*/i, '').trim()}`;
            }
        });
        board.querySelectorAll('.report-subject-item').forEach((item) => {
            if (item.querySelector('.report-subject-note')) return;
            const note = document.createElement('div');
            note.className = 'report-subject-note';
            note.textContent = '百分位看位置，Z 值看和平均水平差异。';
            item.appendChild(note);
        });
    }

    root.enhanceStudentReportMetrics = enhanceStudentReportMetrics;
    root.__REPORT_METRICS_RUNTIME_PATCHED__ = true;
})(window);
