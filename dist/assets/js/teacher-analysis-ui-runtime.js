(()=>{if(typeof window=="undefined"||window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__)return;const a=typeof window.teacherToNumber=="function"?window.teacherToNumber:((t,i=0)=>{const r=Number(t);return Number.isFinite(r)?r:i}),v=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((t,i=1)=>`${(a(t,0)*100).toFixed(i)}%`),T=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((t,i=1)=>{const r=a(t,0);return`${r>=0?"+":""}${r.toFixed(i)}`}),s=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(t=>String(t!=null?t:"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i])),L=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>({avg:60,exc:70,pass:70,total:200})),F=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var t;return((t=window.Auth)==null?void 0:t.currentUser)||null}),O=typeof window.normalizeSubject=="function"?window.normalizeSubject:(t=>String(t||"").trim()),M=typeof window.sortSubjects=="function"?window.sortSubjects:((t,i)=>String(t||"").localeCompare(String(i||""),"zh-Hans-CN")),z=typeof window.formatRankDisplay=="function"?window.formatRankDisplay:((t,i,r="school",e=!1)=>`${e?`${(a(t,0)*100).toFixed(2)}%`:a(t,0).toFixed(2)} <span style="font-size:0.9em; color:#94a3b8">(${i})</span>`);function C(){return typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats():window.TEACHER_STATS||{}}function X(t){return typeof window.getVisibleSubjectsForTeacherUser=="function"?window.getVisibleSubjectsForTeacherUser(t):null}function N(t){const i=a(t==null?void 0:t.fairScore,(t==null?void 0:t.finalScore)||0),r=a(t==null?void 0:t.baselineAdjustment,0);return i>=85&&r>=0?{class:"performance-excellent",text:"优秀"}:i>=75?{class:"performance-good",text:"良好"}:i>=65?{class:"performance-average",text:"稳健"}:{class:"performance-poor",text:"待改进"}}function j(t,i,r="",e="guest"){const g=[];Object.keys(t||{}).forEach(n=>{Object.keys(t[n]||{}).forEach(o=>{var p,f;const c=t[n][o],w=N(c),h=((f=(p=i==null?void 0:i[n])==null?void 0:p[o])==null?void 0:f.rank)||"-";g.push({id:`${n}-${o}`,name:n,subject:o,classes:c.classesText||c.classes||"",avg:c.avg,fairScore:a(c.fairScore,0).toFixed(1),leagueScoreRaw:a(c.leagueScoreRaw,0).toFixed(1),leagueScore:a(c.leagueScore,0).toFixed(1),baselineAdjustment:T(c.baselineAdjustment,1),baselineCoverage:c.baselineCoverageText||"0%",sampleSummary:c.sampleSummary||"共同样本待识别",sampleStability:c.sampleStabilityText||"0%",conversionSummary:c.conversionSummary||"暂无转化样本",conversionScore:a(c.conversionScore,50).toFixed(1),excRate:v(c.excellentRate,1),passRate:v(c.passRate,1),lowRate:v(c.lowRate,1),focusSummary:c.focusSummary||"培优0 / 临界0 / 辅差0",count:c.studentCount,rank:h,badgeClass:w.class,badgeText:w.text})})});const d=String(r||"").replace(/\s+/g,"").toLowerCase();return g.sort((n,o)=>{if((e==="teacher"||e==="class_teacher")&&d){const h=String(n.name||"").replace(/\s+/g,"").toLowerCase(),p=String(o.name||"").replace(/\s+/g,"").toLowerCase(),f=h===d||h.startsWith(`${d}(`)||h.startsWith(`${d}（`),l=p===d||p.startsWith(`${d}(`)||p.startsWith(`${d}（`);if(f!==l)return f?-1:1}const c=a(o.fairScore,0)-a(n.fairScore,0);if(c!==0)return c;const w=a(o.leagueScore,0)-a(n.leagueScore,0);return w!==0?w:String(n.name||"").localeCompare(String(o.name||""),"zh-Hans-CN")}),g}function H(){const t=document.getElementById("teacherCardsContainer"),i=F(),r=(i==null?void 0:i.role)||"guest",e=C(),g=window.TEACHER_TOWNSHIP_RANKINGS||{},d=j(e,g,(i==null?void 0:i.name)||"",r);try{if(window.Alpine&&typeof window.Alpine.store=="function"){const n=window.Alpine.store("teacherData");n&&(n.list=d)}}catch(n){console.warn("teacherData store update skipped:",n)}if(t){if(!d.length){t.innerHTML=`
                <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">
                    暂无教师数据，请先完成任课表同步和成绩导入。
                    <div style="margin-top:10px;">
                        <button class="btn btn-orange" onclick="openTeacherSync()">去同步任课表</button>
                    </div>
                </div>
            `;return}t.innerHTML=d.map(n=>`
            <div class="teacher-card">
                <div class="teacher-header">
                    <div>
                        <div class="teacher-name">${s(n.name)} - ${s(n.subject)}</div>
                        <div class="teacher-classes">${s(n.classes)}班</div>
                    </div>
                    <div class="performance-badge ${s(n.badgeClass)}">${s(n.badgeText)}</div>
                </div>
                <div class="teacher-stats">
                    <div class="stat-item">
                        <div class="stat-value">${s(n.avg)}</div>
                        <div class="stat-label">均分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${s(n.leagueScoreRaw)}</div>
                        <div class="stat-label">联考赋分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${s(n.fairScore)}</div>
                        <div class="stat-label">公平绩效</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; padding:0 10px;">
                    <span>优/及/低: ${s(n.excRate)} / ${s(n.passRate)} / ${s(n.lowRate)}</span>
                    <span>镇排: <strong style="color:var(--primary)">${s(n.rank)}</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:6px; padding:0 10px;">
                    <span>基线校正 ${s(n.baselineAdjustment)} · 覆盖 ${s(n.baselineCoverage)}</span>
                    <span>稳定 ${s(n.sampleStability)} · 转化 ${s(n.conversionScore)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:14px; padding:0 10px;">
                    <span>${s(n.sampleSummary)}</span>
                    <span>${s(n.focusSummary)} · ${s(n.conversionSummary)}</span>
                </div>
                <button class="view-details-btn" onclick='showTeacherDetails(${JSON.stringify(n.name)}, ${JSON.stringify(n.subject)})'>查看详情</button>
            </div>
        `).join("")}}function G(){const t=F(),i=(t==null?void 0:t.role)||"guest",r=i==="teacher"||i==="class_teacher"?X(t):null,e=document.getElementById("teacher-township-ranking-container"),g=document.getElementById("side-nav-teacher-ranks-container");if(g&&(g.innerHTML=""),!e)return;if(!window.TOWNSHIP_RANKING_DATA||!Object.keys(window.TOWNSHIP_RANKING_DATA).length){e.innerHTML='<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';return}const d=typeof window.getTownshipManagedSchoolNames=="function",n=new Set(d?window.getTownshipManagedSchoolNames(Object.keys(window.SCHOOLS||{})):Object.keys(window.SCHOOLS||{})),o=h=>d?typeof window.isTownshipManagedSchool=="function"?window.isTownshipManagedSchool(h,Object.keys(window.SCHOOLS||{})):n.has(String(h||"").trim()):!0,c={};(window.SUBJECTS||[]).forEach(h=>{if(r&&r.size>0&&!r.has(O(h)))return;let p=0,f=0,l=0,m=0;Object.keys(window.SCHOOLS||{}).forEach(y=>{var x,$,S;const u=(S=($=(x=window.SCHOOLS)==null?void 0:x[y])==null?void 0:$.metrics)==null?void 0:S[h];!u||y===window.MY_SCHOOL||!o(y)||(p+=a(u.avg,0),f+=a(u.excRate,0),l+=a(u.passRate,0),m+=1)}),m>0&&(c[h]={avg:p/m,excRate:f/m,passRate:l/m})});let w="";if((window.SUBJECTS||[]).forEach(h=>{var y;if(r&&r.size>0&&!r.has(O(h)))return;const p=(y=window.TOWNSHIP_RANKING_DATA)==null?void 0:y[h];if(!(p!=null&&p.length))return;const f=c[h]||{avg:0,excRate:0,passRate:0};let l="";p.forEach(u=>{const x=f.avg?((u.avg-f.avg)/f.avg*100).toFixed(2):"0.00",$=f.excRate?((u.excellentRate-f.excRate)/f.excRate*100).toFixed(2):"0.00",S=f.passRate?((u.passRate-f.passRate)/f.passRate*100).toFixed(2):"0.00",A=u.type==="teacher"?"text-blue":"",k=u.type==="teacher"?"analysis-row-emphasis":"",Y=u.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school",K=u.type==="teacher"?"教师":"学校";l+=`
                    <tr class="${k}">
                        <td data-label="教师/学校" class="${A}">${s(u.name)}</td>
                        <td data-label="类型"><span class="${Y}">${K}</span></td>
                        <td data-label="平均分">${z(u.avg,u.rankAvg,"teacher")}</td>
                        <td data-label="与镇均比" class="${a(x,0)>=0?"positive-percent":"negative-percent"}">${a(x,0)>=0?"+":""}${x}%</td>
                        <td data-label="镇排">${s(u.rankAvg)}</td>
                        <td data-label="优秀率">${z(u.excellentRate,u.rankExc,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${a($,0)>=0?"positive-percent":"negative-percent"}">${a($,0)>=0?"+":""}${$}%</td>
                        <td data-label="镇排">${s(u.rankExc)}</td>
                        <td data-label="及格率">${z(u.passRate,u.rankPass,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${a(S,0)>=0?"positive-percent":"negative-percent"}">${a(S,0)>=0?"+":""}${S}%</td>
                        <td data-label="镇排">${s(u.rankPass)}</td>
                    </tr>
                `});const m=`rank-anchor-${h}`;if(w+=`
                <div id="${m}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>${s(h)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${s(p.length)} 条</span>
                            <span class="analysis-table-tag">含外校整体数据</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">教师与学校数据同表展示，便于对照镇均水平、乡镇排名和学科整体波动。</div>
                    <div class="table-wrap analysis-table-shell">
                        <table class="comparison-table analysis-generated-table">
                            <thead>
                                <tr>
                                    <th>教师/学校</th>
                                    <th>类型</th>
                                    <th>平均分</th>
                                    <th>与镇均比</th>
                                    <th>镇排</th>
                                    <th>优秀率</th>
                                    <th>与镇均比</th>
                                    <th>镇排</th>
                                    <th>及格率</th>
                                    <th>与镇均比</th>
                                    <th>镇排</th>
                                </tr>
                            </thead>
                            <tbody>${l}</tbody>
                        </table>
                    </div>
                </div>
            `,g){const u=document.createElement("a");u.className="side-nav-sub-link",u.innerText=h,u.onclick=()=>{typeof window.scrollToSubAnchor=="function"&&window.scrollToSubAnchor(m,u)},g.appendChild(u)}}),!w){e.innerHTML='<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';return}e.innerHTML=w}function E(t,i="暂无"){const r=(t||[]).slice(0,8);return r.length?r.map(e=>`${e.name}${e.className?`(${e.className})`:""}${Number.isFinite(e.score)?` ${e.score}`:""}`).join("、"):i}const R={excellentEdges:{label:"培优",title:"培优边缘生",color:"#0f766e",empty:"暂无培优边缘生"},passEdges:{label:"临界",title:"及格临界生",color:"#1d4ed8",empty:"暂无及格临界生"},lowRisk:{label:"辅差",title:"辅差关注生",color:"#b45309",empty:"暂无辅差关注生"}};function b(t){return s(JSON.stringify(String(t||"")))}function _(t,i,r,e){var n;const g=R[r]||R.passEdges,d=((n=e==null?void 0:e.focusTargets)==null?void 0:n[r])||[];return`
            <button
                type="button"
                class="teacher-focus-chip"
                data-teacher="${s(t)}"
                data-subject="${s(i)}"
                data-focus-type="${s(r)}"
                onclick="window.showTeacherFocusTargetsFromButton && window.showTeacherFocusTargetsFromButton(this)"
                title="点击查看${s(g.title)}名单和班级"
                style="border:1px solid ${g.color}; color:${g.color}; background:#fff; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:800; cursor:pointer; margin:2px;"
            >${s(g.label)} ${d.length}</button>
        `}function I(t,i,r){var g,d,n;const e=[`培优: ${(((g=r.focusTargets)==null?void 0:g.excellentEdges)||[]).slice(0,6).map(o=>`${o.name}(${o.className||"-"}/${o.score})`).join("、")||"暂无"}`,`临界: ${(((d=r.focusTargets)==null?void 0:d.passEdges)||[]).slice(0,6).map(o=>`${o.name}(${o.className||"-"}/${o.score})`).join("、")||"暂无"}`,`辅差: ${(((n=r.focusTargets)==null?void 0:n.lowRisk)||[]).slice(0,6).map(o=>`${o.name}(${o.className||"-"}/${o.score})`).join("、")||"暂无"}`].join(" | ");return`
            <div title="${s(e)}" style="display:flex; align-items:center; justify-content:center; gap:3px; flex-wrap:wrap;">
                ${_(t,i,"excellentEdges",r)}
                ${_(t,i,"passEdges",r)}
                ${_(t,i,"lowRisk",r)}
            </div>
        `}function B(t,i,r){var w,h;const e=C(),g=(w=e==null?void 0:e[t])==null?void 0:w[i],d=R[r]||R.passEdges,n=Array.isArray((h=g==null?void 0:g.focusTargets)==null?void 0:h[r])?g.focusTargets[r]:[],o=`${t} / ${i} · ${d.title}`,c=n.length?`
            <div style="text-align:left;">
                <div style="margin-bottom:10px; color:#64748b; font-size:13px;">共 ${n.length} 人。点击姓名可跳转到学生成绩单，便于继续查看个人成绩、排名和家校材料。</div>
                <div class="table-wrap analysis-table-shell" style="max-height:55vh; overflow:auto;">
                    <table class="analysis-generated-table" style="width:100%; font-size:13px;">
                        <thead><tr><th>班级</th><th>姓名</th><th>当前分</th><th>差距</th><th>操作</th></tr></thead>
                        <tbody>
                            ${n.map(p=>{const f=Number.isFinite(p.gap)?Math.abs(p.gap).toFixed(1):"-",l=p.school||window.MY_SCHOOL||"";return`
                                    <tr>
                                        <td>${s(p.className||"-")}</td>
                                        <td><strong>${s(p.name||"-")}</strong></td>
                                        <td>${Number.isFinite(p.score)?s(p.score):"-"}</td>
                                        <td>${f}</td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-blue"
                                                onclick="window.jumpToStudent && window.jumpToStudent(${b(p.name)}, ${b(l)}, ${b(p.className)})">
                                                查看成绩单
                                            </button>
                                        </td>
                                    </tr>
                                `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `:`<div style="padding:24px; color:#64748b;">${s(d.empty)}</div>`;window.Swal&&typeof window.Swal.fire=="function"?window.Swal.fire({title:s(o),html:c,width:760,confirmButtonText:"关闭",confirmButtonColor:d.color}):alert(`${o}
${n.map(p=>{var f;return`${p.className||"-"} ${p.name||"-"} ${(f=p.score)!=null?f:"-"}`}).join(`
`)||d.empty}`)}function J(t){t&&B(t.dataset.teacher||"",t.dataset.subject||"",t.dataset.focusType||"passEdges")}function P(){const t=document.getElementById("teacherComparisonTable"),i=C();if(!t)return;if(!Object.keys(i).length){t.innerHTML='<p style="text-align:center; color:#666;">暂无教师统计数据</p>';return}const r={};Object.keys(i).forEach(d=>{Object.keys(i[d]||{}).forEach(n=>{r[n]||(r[n]=[]),r[n].push({teacher:d,data:i[d][n]})})});let g=`
            <thead>
                <tr>
                    <th rowspan="2">教师</th>
                    <th rowspan="2">班级</th>
                    <th rowspan="2">实考</th>
                    <th rowspan="2">共同样本</th>
                    <th rowspan="2">样本变动</th>
                    <th rowspan="2">均分</th>
                    <th rowspan="2" title="按系统现有两率一分标准折算，同校同学科比较">联考赋分(${L().total})</th>
                    <th rowspan="2" title="按最近一次历史考试的匹配学生做超预期修正，范围约 ±20">基线校正</th>
                    <th colspan="3" style="background:#dcfce7; color:#166534;">三率指标</th>
                    <th rowspan="2">转化分</th>
                    <th rowspan="2">重点学生</th>
                    <th rowspan="2" style="background:#fef3c7; color:#92400e;">公平绩效分</th>
                </tr>
                <tr>
                    <th>优秀率</th>
                    <th>及格率</th>
                    <th>低分率</th>
                </tr>
            </thead>
            <tbody>
        `;Object.keys(r).sort(M).forEach(d=>{g+=`<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${s(d)}</td></tr>`,r[d].sort((n,o)=>a(o.data.fairScore,0)-a(n.data.fairScore,0)).forEach(n=>{var m;const o=n.data,c=a(o.baselineAdjustment,0)>=0?"text-green":"text-red",w=a(o.lowRate,0)>=.12?"color:#dc2626; font-weight:700;":"color:#334155;",h=o.sampleWarning?"color:#b45309; font-weight:700;":"color:#334155;",p=`基线覆盖 ${o.baselineCoverageText||"0%"}；预计均分 ${a(o.expectedAvg,0).toFixed(2)}；预计优率 ${v(o.expectedExcellentRate,1)}；预计及格率 ${v(o.expectedPassRate,1)}；预计低分率 ${v(o.expectedLowRate,1)}；任课连续性 ${o.teacherContinuityText||"任课连续"}${o.baselineExamId?`；基线 ${o.baselineExamId}`:""}`,f=(o.previousSampleCount||0)>0?`新增 ${o.addedSampleCount||0} / 缺考退出 ${o.exitedSampleCount||0}`:"暂无基线",l=`${a(o.conversionScore,50).toFixed(1)}${a(o.conversionAdjustment,0)?` (${T(o.conversionAdjustment,1)})`:""}`;g+=`
                        <tr>
                            <td><strong>${s(n.teacher)}</strong></td>
                            <td>${s(o.classesText||o.classes||"-")}</td>
                            <td>${s(o.studentCount)}</td>
                            <td title="${s(o.sampleDetailText||"")}" style="${h}">
                                <div>${s((o.previousSampleCount||0)>0?o.commonSampleCount||0:"—")}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${s((o.previousSampleCount||0)>0?o.sampleStabilityText||"0%":"待历史样本")}</div>
                            </td>
                            <td title="${s(o.sampleDetailText||"")}" style="${h}">
                                <div>${s(f)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${s(o.previousSampleCount||0)}</div>
                            </td>
                            <td style="font-weight:700;">${s(o.avg)}</td>
                            <td title="${s(`均分赋分 ${a(o.ratedAvg,0).toFixed(1)}，优率赋分 ${a(o.ratedExc,0).toFixed(1)}，及格赋分 ${a(o.ratedPass,0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${a(o.leagueScoreRaw,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${a(o.leagueScore,0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${c}" title="${s(p)}" style="font-weight:700;">
                                <div>${T(o.baselineAdjustment,1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${s(o.baselineCoverageText||"0%")}</div>
                            </td>
                            <td>${v(o.excellentRate,1)}</td>
                            <td>${v(o.passRate,1)}</td>
                            <td style="${w}">${v(o.lowRate,1)}</td>
                            <td title="${s(`${o.conversionSummary||"暂无转化样本"}；${((m=o.conversionMetrics)==null?void 0:m.detail)||""}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${l}</div>
                                <div style="font-size:11px; color:#64748b;">${s(o.conversionSummary||"暂无转化")}</div>
                            </td>
                            <td style="font-size:12px;">${I(n.teacher,d,o)}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${a(o.fairScore,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${s(o.fairRank||"-")} 名</div>
                            </td>
                        </tr>
                    `})}),g+="</tbody>",t.classList.add("comparison-table"),t.innerHTML=g,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(t.closest(".section")||t)}function U(){return typeof window.ensureLazySectionLoaded=="function"&&window.ensureLazySectionLoaded("teacherModal"),document.getElementById("teacherModal")}function V(){if(window.__TEACHER_ANALYSIS_MODAL_BOUND__)return!0;const t=U(),i=document.getElementById("closeModal");return!t||!i?!1:(i.addEventListener("click",()=>{const r=document.getElementById("teacherModal");r&&(r.style.display="none")}),window.addEventListener("click",r=>{const e=document.getElementById("teacherModal");e&&r.target===e&&(e.style.display="none")}),window.__TEACHER_ANALYSIS_MODAL_BOUND__=!0,!0)}function W(t,i){var $,S,A,k;const r=C(),e=r[t]?r[t][i]:null;if(!e){window.UI&&window.UI.toast("当前筛选范围下暂无该教师该学科数据","warning");return}V();const g=U(),d=document.getElementById("modalSubjectTable"),n=document.getElementById("modalAvgProgress");if(!g||!d||!n)return;const o=document.getElementById("modalTeacherName"),c=document.getElementById("modalAvgScore"),w=document.getElementById("modalExcellentRate"),h=document.getElementById("modalPassRate"),p=document.getElementById("modalAvgComparison");o&&(o.textContent=`${t} - ${i} 教学详情`),c&&(c.textContent=e.avg),w&&(w.textContent=v(e.excellentRate,1)),h&&(h.textContent=v(e.passRate,1));const f=a(e.expectedAvg,0),l=f>0?(a(e.avgValue,0)-f)/f*100:0;p&&(p.textContent=`${l>=0?"+":""}${l.toFixed(1)}%`);const m=Math.min(Math.max(50+l,0),100);n.style.width=`${m}%`,n.className=l>=0?"progress-good":"progress-poor",n.style.backgroundColor=l>=0?"#22c55e":"#ef4444";const y=d.querySelector("thead"),u=d.querySelector("tbody");y&&(y.innerHTML=`
                <tr>
                    <th>学科</th>
                    <th>实际均分</th>
                    <th>预计均分</th>
                    <th>优秀率(实/预)</th>
                    <th>及格率(实/预)</th>
                    <th>低分率(实/预)</th>
                    <th>基线校正</th>
                </tr>
            `),u&&(u.innerHTML=`
                <tr>
                    <td>${s(i)}</td>
                    <td>${a(e.avgValue,0).toFixed(2)}</td>
                    <td>${a(e.expectedAvg,0).toFixed(2)}</td>
                    <td>${v(e.excellentRate,1)} / ${v(e.expectedExcellentRate,1)}</td>
                    <td>${v(e.passRate,1)} / ${v(e.expectedPassRate,1)}</td>
                    <td>${v(e.lowRate,1)} / ${v(e.expectedLowRate,1)}</td>
                    <td class="${a(e.baselineAdjustment,0)>=0?"positive-percent":"negative-percent"}">${T(e.baselineAdjustment,1)}</td>
                </tr>
            `);let x=document.getElementById("teacherModalExtra");!x&&d.parentNode&&(x=document.createElement("div"),x.id="teacherModalExtra",x.style.marginBottom="16px",d.parentNode.insertBefore(x,d)),x&&(x.innerHTML=`
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">联考赋分</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${a(e.leagueScoreRaw,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">折算 ${a(e.leagueScore,0).toFixed(1)} / 100</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">基线校正</div>
                        <div style="font-size:22px; font-weight:800; color:${a(e.baselineAdjustment,0)>=0?"#15803d":"#dc2626"};">${T(e.baselineAdjustment,1)}</div>
                        <div style="font-size:12px; color:#64748b;">覆盖 ${s(e.baselineCoverageText||"0%")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">公平绩效分</div>
                        <div style="font-size:22px; font-weight:800; color:#b45309;">${a(e.fairScore,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">同科第 ${s(e.fairRank||"-")} 名</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">置信 / 工作量</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${a(e.confidenceFactor,1).toFixed(2)}</div>
                        <div style="font-size:12px; color:#64748b;">工作量修正 ${T(e.workloadAdjustment,1)}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">共同样本</div>
                        <div style="font-size:22px; font-weight:800; color:${e.sampleWarning?"#b45309":"#0f172a"};">${s((e.previousSampleCount||0)>0?e.commonSampleCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">稳定 ${s((e.previousSampleCount||0)>0?e.sampleStabilityText||"0%":"待历史样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">样本变动</div>
                        <div style="font-size:22px; font-weight:800; color:${e.sampleWarning?"#b45309":"#0f172a"};">${s((e.previousSampleCount||0)>0?e.sampleShiftCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">${s((e.previousSampleCount||0)>0?`新增 ${e.addedSampleCount||0} · 缺考退出 ${e.exitedSampleCount||0}`:"暂无基线样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">转化分</div>
                        <div style="font-size:22px; font-weight:800; color:#0369a1;">${a(e.conversionScore,50).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">${s(e.conversionSummary||"暂无转化样本")}${a(e.conversionAdjustment,0)?` · 调整 ${T(e.conversionAdjustment,1)}`:""}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">换老师保护</div>
                        <div style="font-size:22px; font-weight:800; color:${e.teacherChangeProtected?"#b45309":"#0f172a"};">${s(e.teacherChangeProtected?"已冻结":"正常")}</div>
                        <div style="font-size:12px; color:#64748b;">${s(e.teacherContinuityText||"任课连续")}</div>
                    </div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px; background:#f8fafc;">
                    <div style="font-size:13px; font-weight:700; color:#334155; margin-bottom:10px;">培优 / 辅差名单</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${b(t)}, ${b(i)}, 'excellentEdges')" style="font-size:12px; color:#0f766e; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">培优边缘生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${s(E(($=e.focusTargets)==null?void 0:$.excellentEdges,"暂无培优边缘生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${b(t)}, ${b(i)}, 'passEdges')" style="font-size:12px; color:#1d4ed8; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">及格临界生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${s(E((S=e.focusTargets)==null?void 0:S.passEdges,"暂无及格临界生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${b(t)}, ${b(i)}, 'lowRisk')" style="font-size:12px; color:#b45309; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">辅差关注生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${s(E((A=e.focusTargets)==null?void 0:A.lowRisk,"暂无辅差关注生"))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${s(e.sampleDetailText||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${s(((k=e.conversionMetrics)==null?void 0:k.detail)||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${s(e.baselineExamId?`历史基线：${e.baselineExamId}`:"未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。")}</div>
                </div>
            `),g.style.display="flex"}function D(){const t=F(),i=(t==null?void 0:t.role)||"guest",r=i==="teacher"||i==="class_teacher"?C():window.TEACHER_STATS||{};if(!Object.keys(r).length){alert("请先进行教师分析");return}const e=new Set;Object.values(r).forEach(c=>Object.keys(c||{}).forEach(w=>e.add(w)));const g=window.XLSX.utils.book_new(),d=L(),n={};Object.keys(r).forEach(c=>{Object.keys(r[c]||{}).forEach(w=>{n[w]||(n[w]=[]),n[w].push({teacherName:c,data:r[c][w]})})}),Object.keys(n).sort(M).forEach(c=>{const w=n[c].sort((f,l)=>a(l.data.fairScore,0)-a(f.data.fairScore,0)),h=[["教师姓名","学科","任教班级","人数","均分",`联考赋分(${d.total})`,"联考赋分(折算100)","基线校正","基线覆盖","上次样本","共同样本","新增样本","缺考/退出","样本稳定度","任课连续性","转化分","转化调整","预计均分","优秀率","预计优秀率","及格率","预计及格率","低分率","预计低分率","工作量修正","置信系数","公平绩效分","同科排名","培优边缘生","及格临界生","辅差关注生"]];w.forEach(({teacherName:f,data:l})=>{var m,y,u;h.push([f,c,l.classesText||l.classes||"",l.studentCount,window.getExcelNum(a(l.avgValue,0)),window.getExcelNum(a(l.leagueScoreRaw,0)),window.getExcelNum(a(l.leagueScore,0)),window.getExcelNum(a(l.baselineAdjustment,0)),l.baselineCoverageText||"0%",l.previousSampleCount||0,l.commonSampleCount||0,l.addedSampleCount||0,l.exitedSampleCount||0,l.sampleStabilityText||"0%",l.teacherContinuityText||"",window.getExcelNum(a(l.conversionScore,50)),window.getExcelNum(a(l.conversionAdjustment,0)),window.getExcelNum(a(l.expectedAvg,0)),window.getExcelPercent(a(l.excellentRate,0)),window.getExcelPercent(a(l.expectedExcellentRate,0)),window.getExcelPercent(a(l.passRate,0)),window.getExcelPercent(a(l.expectedPassRate,0)),window.getExcelPercent(a(l.lowRate,0)),window.getExcelPercent(a(l.expectedLowRate,0)),window.getExcelNum(a(l.workloadAdjustment,0)),window.getExcelNum(a(l.confidenceFactor,1)),window.getExcelNum(a(l.fairScore,0)),l.fairRank||"",E((m=l.focusTargets)==null?void 0:m.excellentEdges,""),E((y=l.focusTargets)==null?void 0:y.passEdges,""),E((u=l.focusTargets)==null?void 0:u.lowRisk,"")])});const p=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName(c,"公平绩效"):String(c||"Sheet").slice(0,31);window.XLSX.utils.book_append_sheet(g,window.XLSX.utils.aoa_to_sheet(h),p)});const o=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,e):new Date().toISOString().slice(0,10);window.XLSX.writeFile(g,`教师公平绩效明细_${o}.xlsx`)}V(),Object.assign(window,{renderTeacherTownshipRanking:G,teacherBuildCardList:j,teacherFormatFocusList:E,renderTeacherCards:H,renderTeacherCardsV2:H,calculatePerformanceLevel:N,calculatePerformanceLevelV2:N,renderTeacherComparisonTable:P,renderTeacherComparisonTableV2:P,renderTeacherFocusSummaryCell:I,showTeacherFocusTargets:B,showTeacherFocusTargetsFromButton:J,showTeacherDetails:W,showTeacherDetailsV2:W,exportTeacherComparisonExcel:D,exportTeacherComparisonExcelV2:D}),window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__=!0})();
