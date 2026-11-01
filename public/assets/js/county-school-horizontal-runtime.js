// Declarative replacement for inline on* handlers (CSP without 'unsafe-inline').
// Produces data-ui-action|change|input="call" attributes that ui-actions-runtime.js
// dispatches through its allow-list; arguments travel as JSON data, never as code.
var uiDeclaredAttrs = globalThis.uiDeclaredAttrs || (globalThis.uiDeclaredAttrs = function uiDeclaredAttrs(trigger, name, ...args) {
    const kind = trigger === 'change' ? 'data-ui-change' : (trigger === 'input' ? 'data-ui-input' : 'data-ui-action');
    const escapeAttr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    const argsAttr = args.length ? ` data-ui-args="${escapeAttr(JSON.stringify(args))}"` : '';
    return `${kind}="call" data-ui-call="${escapeAttr(name)}"${argsAttr}`;
});

(() => {
    if (typeof window === 'undefined' || window.CountySchoolHorizontalRenderer) return;

    function isCurrentSchoolRow(ctx, rowSchoolName, currentSchoolName) {
        if (!currentSchoolName) return false;
        if (ctx && typeof ctx.sameSchoolName === 'function') {
            return ctx.sameSchoolName(rowSchoolName, currentSchoolName);
        }
        return String(rowSchoolName || '').trim() === String(currentSchoolName || '').trim();
    }

    function renderTotalTable(ctx, currentSchoolName = '') {
        const rows = ctx.buildCountyHorizontalTotalRows();
        if (!rows.length) return '<div class="county-empty">暂无学校成绩数据，请先导入本次县级成绩。</div>';
        const maxAvg = rows.reduce((max, row) => Math.max(max, ctx.toNumber(row.avg)), 0) || 100;
        return `
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table" data-virtual-table="county-horizontal-total">
                    <thead>
                        <tr>
                            <th>学校名称 <span class="analysis-table-tag">共识别 ${rows.length} 所</span></th>
                            <th>实考人数</th>
                            <th>平均分</th>
                            <th>优秀率</th>
                            <th>及格率</th>
                            <th>平均分赋分</th>
                            <th>优秀率赋分</th>
                            <th>及格率赋分</th>
                            <th>两率一分总分</th>
                            <th>县域排名</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rows.map((row) => {
                            const isCurrent = isCurrentSchoolRow(ctx, row.schoolName, currentSchoolName);
                            const barPercent = row.avg ? Math.min(100, row.avg / maxAvg * 100).toFixed(1) : 0;
                            return `
                                <tr class="${isCurrent ? 'bg-highlight' : ''}">
                                    <td data-label="学校名称">${ctx.escapeHtml(row.schoolName)}</td>
                                    <td data-label="实考人数">${row.count || 0}</td>
                                    <td data-label="平均分" class="data-bar-bg" style="--percent:${barPercent}%">${ctx.formatCountyRankDisplay(row.avg, row.rankAvg)}</td>
                                    <td data-label="优秀率">${ctx.formatCountyRankDisplay(row.excellentRate, row.rankExcellent, true)}</td>
                                    <td data-label="及格率">${ctx.formatCountyRankDisplay(row.passRate, row.rankPass, true)}</td>
                                    <td data-label="平均分赋分">${ctx.formatNumber(row.ratedAvg)}</td>
                                    <td data-label="优秀率赋分">${ctx.formatNumber(row.ratedExc)}</td>
                                    <td data-label="及格率赋分">${ctx.formatNumber(row.ratedPass)}</td>
                                    <td data-label="两率一分总分" class="text-red" style="font-size:1.1em; font-weight:800;">${ctx.formatNumber(row.score)}</td>
                                    <td data-label="县域排名" class="rank-cell">${row.rankScore || '-'}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    function renderSubjectTables(ctx, subjects, currentSchoolName) {
        return subjects.map((subject) => {
            const rows = ctx.buildCountySubjectRows(subject);
            if (!rows.length) return '';
            const anchorId = `county-subject-anchor-${subject}`;
            return `
                <div id="${ctx.escapeHtml(anchorId)}" class="analysis-anchor-panel county-subject-detail anchor-target">
                    <div class="county-section-head">
                        <div class="sub-header analysis-section-head">${ctx.escapeHtml(subject)} 学科明细</div>
                    </div>
                    <div class="table-wrap analysis-table-shell">
                        <table class="analysis-generated-table county-analysis-table" data-virtual-table="county-subject-${ctx.escapeHtml(subject)}">
                            <thead><tr><th>学校名称</th><th>实考人数</th><th>平均分</th><th>优秀率</th><th>及格率</th><th>平均分赋分</th><th>优秀率赋分</th><th>及格率赋分</th><th>两率一分</th><th>县域排名</th></tr></thead>
                            <tbody>
                                ${rows.map((row) => `
                                    <tr class="${isCurrentSchoolRow(ctx, row.schoolName, currentSchoolName) ? 'bg-highlight' : ''}">
                                        <td data-label="学校名称">${ctx.escapeHtml(row.schoolName)}</td>
                                        <td data-label="实考人数">${row.count || 0}</td>
                                        <td data-label="平均分">${ctx.formatCountyRankDisplay(row.avg, row.rankAvg)}</td>
                                        <td data-label="优秀率">${ctx.formatCountyRankDisplay(row.excellentRate, row.rankExcellent, true)}</td>
                                        <td data-label="及格率">${ctx.formatCountyRankDisplay(row.passRate, row.rankPass, true)}</td>
                                        <td data-label="平均分赋分">${ctx.formatNumber(row.ratedAvg)}</td>
                                        <td data-label="优秀率赋分">${ctx.formatNumber(row.ratedExc)}</td>
                                        <td data-label="及格率赋分">${ctx.formatNumber(row.ratedPass)}</td>
                                        <td data-label="两率一分"><strong>${ctx.formatNumber(row.score)}</strong></td>
                                        <td data-label="县域排名" class="rank-cell">${row.rank || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            `;
        }).filter(Boolean).join('');
    }

    function renderAnchorJumpbar(ctx, subjects, totalLabel) {
        const items = [
            { label: totalLabel, anchorId: 'county-total-anchor' },
            ...subjects.map(subject => ({ label: subject, anchorId: `county-subject-anchor-${subject}` }))
        ];
        return `
            <div class="table-anchor-jumpbar table-anchor-jumpbar--inline county-table-anchor-jumpbar" aria-label="县域横向表格快速定位">
                <div class="table-anchor-jumpbar-head">
                    <strong>表格快速定位</strong>
                    <span>按学科跳转到对应排名表。</span>
                </div>
                <div class="table-anchor-jumpbar-links">
                    ${items.map((item, index) => `
                        <button type="button" class="${index === 0 ? 'active' : ''}" data-ui-action="scroll-into-view" data-ui-target="${ctx.escapeHtml(item.anchorId)}">
                            <span>${ctx.escapeHtml(item.label)}</span>
                        </button>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function renderSchoolHorizontal(ctx) {
        const totalRows = ctx.buildCountyHorizontalTotalRows();
        if (!totalRows.length) return '<div class="county-empty">暂无学校成绩数据，请先导入本次县级成绩。</div>';
        const subjects = ctx.sortCountySubjects(window.SUBJECTS || []);
        const currentSchoolName = ctx.resolveCurrentCountySchoolName();
        const totalLabel = typeof window.getTotalSubjectLabel === 'function'
            ? window.getTotalSubjectLabel()
            : '总分';
        const subjectTables = renderSubjectTables(ctx, subjects, currentSchoolName);

        return `
            <div class="county-control-panel">
                <label class="county-control-field">
                    <span>本校名称</span>
                    <input id="countySchoolNameInput" type="text" value="${ctx.escapeHtml(currentSchoolName)}" placeholder="输入本校名称，用于高亮和横向对比">
                </label>
                <div class="county-control-actions">
                    <button class="btn btn-sm btn-green" type="button" ${uiDeclaredAttrs('click', 'generateCountySchoolHorizontalTable')}>生成横向对比表</button>
                    <button class="btn btn-sm btn-blue" type="button" ${uiDeclaredAttrs('click', 'exportCountyAnalysisSection', 'school')}>下载横向对比表</button>
                    <button class="btn btn-sm btn-secondary" type="button" ${uiDeclaredAttrs('click', 'setCountyAnalysisSchoolNameFromInput')}>锁定本校</button>
                </div>
            </div>
            <div class="county-kpi-grid">
                <div><span>学校样本</span><strong>${totalRows.length}</strong><em>县域所有学校</em></div>
                <div><span>学科明细</span><strong>${subjects.length}</strong><em>按两率一分统一折算</em></div>
                <div><span>学生样本</span><strong>${(window.RAW_DATA || []).length}</strong><em>${ctx.escapeHtml(ctx.getExamKey())}</em></div>
                <div><span>输出</span><strong>横向表</strong><em>${ctx.escapeHtml(totalLabel)} + 单科明细</em></div>
            </div>
            ${renderAnchorJumpbar(ctx, subjects, totalLabel)}
            <div id="county-total-anchor" class="analysis-anchor-panel anchor-target">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">${ctx.escapeHtml(totalLabel)} - 综合分析表</div>
                    <div class="county-section-actions">
                        <button class="btn btn-sm btn-green" type="button" ${uiDeclaredAttrs('click', 'exportCountyAnalysisSection', 'school')}>下载Excel</button>
                    </div>
                </div>
                <div class="analysis-table-meta">
                    <span><strong>口径：</strong>参考乡镇“两率一分(横向)”表，按当前导入的全部县级学校统一折算、统一排名。</span>
                </div>
                ${renderTotalTable(ctx, currentSchoolName)}
            </div>
            ${subjectTables || '<div class="county-empty">暂无学科明细数据。</div>'}
        `;
    }

    window.CountySchoolHorizontalRenderer = {
        renderTotalTable,
        renderSchoolHorizontal
    };
})();
