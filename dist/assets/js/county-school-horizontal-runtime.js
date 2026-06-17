(()=>{if(typeof window=="undefined"||window.CountySchoolHorizontalRenderer)return;function d(t,s,l){return l?t&&typeof t.sameSchoolName=="function"?t.sameSchoolName(s,l):String(s||"").trim()===String(l||"").trim():!1}function r(t,s=""){const l=t.buildCountyHorizontalTotalRows();if(!l.length)return'<div class="county-empty">暂无学校成绩数据，请先导入本次县级成绩。</div>';const n=l.reduce((a,o)=>Math.max(a,t.toNumber(o.avg)),0)||100;return`
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table" data-virtual-table="county-horizontal-total">
                    <thead>
                        <tr>
                            <th>学校名称 <span class="analysis-table-tag">共识别 ${l.length} 所</span></th>
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
                        ${l.map(a=>{const o=d(t,a.schoolName,s),e=a.avg?Math.min(100,a.avg/n*100).toFixed(1):0;return`
                                <tr class="${o?"bg-highlight":""}">
                                    <td data-label="学校名称">${t.escapeHtml(a.schoolName)}</td>
                                    <td data-label="实考人数">${a.count||0}</td>
                                    <td data-label="平均分" class="data-bar-bg" style="--percent:${e}%">${t.formatCountyRankDisplay(a.avg,a.rankAvg)}</td>
                                    <td data-label="优秀率">${t.formatCountyRankDisplay(a.excellentRate,a.rankExcellent,!0)}</td>
                                    <td data-label="及格率">${t.formatCountyRankDisplay(a.passRate,a.rankPass,!0)}</td>
                                    <td data-label="平均分赋分">${t.formatNumber(a.ratedAvg)}</td>
                                    <td data-label="优秀率赋分">${t.formatNumber(a.ratedExc)}</td>
                                    <td data-label="及格率赋分">${t.formatNumber(a.ratedPass)}</td>
                                    <td data-label="两率一分总分" class="text-red" style="font-size:1.1em; font-weight:800;">${t.formatNumber(a.score)}</td>
                                    <td data-label="县域排名" class="rank-cell">${a.rankScore||"-"}</td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        `}function i(t,s,l){return s.map(n=>{const a=t.buildCountySubjectRows(n);if(!a.length)return"";const o=`county-subject-anchor-${n}`;return`
                <div id="${t.escapeHtml(o)}" class="analysis-anchor-panel county-subject-detail anchor-target">
                    <div class="county-section-head">
                        <div class="sub-header analysis-section-head">${t.escapeHtml(n)} 学科明细</div>
                    </div>
                    <div class="table-wrap analysis-table-shell">
                        <table class="analysis-generated-table county-analysis-table" data-virtual-table="county-subject-${t.escapeHtml(n)}">
                            <thead><tr><th>学校名称</th><th>实考人数</th><th>平均分</th><th>优秀率</th><th>及格率</th><th>平均分赋分</th><th>优秀率赋分</th><th>及格率赋分</th><th>两率一分</th><th>县域排名</th></tr></thead>
                            <tbody>
                                ${a.map(e=>`
                                    <tr class="${d(t,e.schoolName,l)?"bg-highlight":""}">
                                        <td data-label="学校名称">${t.escapeHtml(e.schoolName)}</td>
                                        <td data-label="实考人数">${e.count||0}</td>
                                        <td data-label="平均分">${t.formatCountyRankDisplay(e.avg,e.rankAvg)}</td>
                                        <td data-label="优秀率">${t.formatCountyRankDisplay(e.excellentRate,e.rankExcellent,!0)}</td>
                                        <td data-label="及格率">${t.formatCountyRankDisplay(e.passRate,e.rankPass,!0)}</td>
                                        <td data-label="平均分赋分">${t.formatNumber(e.ratedAvg)}</td>
                                        <td data-label="优秀率赋分">${t.formatNumber(e.ratedExc)}</td>
                                        <td data-label="及格率赋分">${t.formatNumber(e.ratedPass)}</td>
                                        <td data-label="两率一分"><strong>${t.formatNumber(e.score)}</strong></td>
                                        <td data-label="县域排名" class="rank-cell">${e.rank||"-"}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            `}).filter(Boolean).join("")}function c(t,s){return`
            <div class="table-anchor-jumpbar table-anchor-jumpbar--inline county-table-anchor-jumpbar" aria-label="县域横向表格快速定位">
                <div class="table-anchor-jumpbar-head">
                    <strong>表格快速定位</strong>
                    <span>按学科跳转到对应排名表。</span>
                </div>
                <div class="table-anchor-jumpbar-links">
                    ${[{label:"五科总",anchorId:"county-total-anchor"},...s.map(n=>({label:n,anchorId:`county-subject-anchor-${n}`}))].map((n,a)=>`
                        <button type="button" class="${a===0?"active":""}" onclick="document.getElementById('${t.escapeHtml(n.anchorId)}')?.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' })">
                            <span>${t.escapeHtml(n.label)}</span>
                        </button>
                    `).join("")}
                </div>
            </div>
        `}function b(t){const s=t.buildCountyHorizontalTotalRows();if(!s.length)return'<div class="county-empty">暂无学校成绩数据，请先导入本次县级成绩。</div>';const l=t.sortCountySubjects(window.SUBJECTS||[]),n=t.resolveCurrentCountySchoolName(),a=i(t,l,n);return`
            <div class="county-control-panel">
                <label class="county-control-field">
                    <span>本校名称</span>
                    <input id="countySchoolNameInput" type="text" value="${t.escapeHtml(n)}" placeholder="输入本校名称，用于高亮和横向对比">
                </label>
                <div class="county-control-actions">
                    <button class="btn btn-sm btn-green" type="button" onclick="generateCountySchoolHorizontalTable()">生成横向对比表</button>
                    <button class="btn btn-sm btn-blue" type="button" onclick="exportCountyAnalysisSection('school')">下载横向对比表</button>
                    <button class="btn btn-sm btn-secondary" type="button" onclick="setCountyAnalysisSchoolNameFromInput()">锁定本校</button>
                </div>
            </div>
            <div class="county-kpi-grid">
                <div><span>学校样本</span><strong>${s.length}</strong><em>县域所有学校</em></div>
                <div><span>学科明细</span><strong>${l.length}</strong><em>按两率一分统一折算</em></div>
                <div><span>学生样本</span><strong>${(window.RAW_DATA||[]).length}</strong><em>${t.escapeHtml(t.getExamKey())}</em></div>
                <div><span>输出</span><strong>横向表</strong><em>五科总 + 单科明细</em></div>
            </div>
            ${c(t,l)}
            <div id="county-total-anchor" class="analysis-anchor-panel anchor-target">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">五科总 - 综合分析表</div>
                    <div class="county-section-actions">
                        <button class="btn btn-sm btn-green" type="button" onclick="exportCountyAnalysisSection('school')">下载Excel</button>
                    </div>
                </div>
                <div class="analysis-table-meta">
                    <span><strong>口径：</strong>参考乡镇“两率一分(横向)”表，按当前导入的全部县级学校统一折算、统一排名。</span>
                </div>
                ${r(t,n)}
            </div>
            ${a||'<div class="county-empty">暂无学科明细数据。</div>'}
        `}window.CountySchoolHorizontalRenderer={renderTotalTable:r,renderSchoolHorizontal:b}})();
