(()=>{if(typeof window=="undefined"||window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__)return;const a=typeof window.teacherToNumber=="function"?window.teacherToNumber:((t,i=0)=>{const l=Number(t);return Number.isFinite(l)?l:i}),x=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((t,i=1)=>`${(a(t,0)*100).toFixed(i)}%`),T=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((t,i=1)=>{const l=a(t,0);return`${l>=0?"+":""}${l.toFixed(i)}`}),n=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(t=>String(t!=null?t:"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i])),j=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>({avg:60,exc:70,pass:70,total:200})),z=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var t;return((t=window.Auth)==null?void 0:t.currentUser)||null}),X=typeof window.normalizeSubject=="function"?window.normalizeSubject:(t=>String(t||"").trim()),M=typeof window.sortSubjects=="function"?window.sortSubjects:((t,i)=>String(t||"").localeCompare(String(i||""),"zh-Hans-CN")),_=typeof window.formatRankDisplay=="function"?window.formatRankDisplay:((t,i,l="school",e=!1)=>`${e?`${(a(t,0)*100).toFixed(2)}%`:a(t,0).toFixed(2)} <span style="font-size:0.9em; color:#94a3b8">(${i})</span>`);function C(){return typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats():window.TEACHER_STATS||{}}function J(t){return typeof window.getVisibleSubjectsForTeacherUser=="function"?window.getVisibleSubjectsForTeacherUser(t):null}function I(t){const i=a(t==null?void 0:t.fairScore,(t==null?void 0:t.finalScore)||0),l=a(t==null?void 0:t.baselineAdjustment,0);return i>=85&&l>=0?{class:"performance-excellent",text:"优秀"}:i>=75?{class:"performance-good",text:"良好"}:i>=65?{class:"performance-average",text:"稳健"}:{class:"performance-poor",text:"待改进"}}function H(t,i,l="",e="guest"){const g=[];Object.keys(t||{}).forEach(s=>{Object.keys(t[s]||{}).forEach(o=>{var p,u;const c=t[s][o],m=I(c),f=((u=(p=i==null?void 0:i[s])==null?void 0:p[o])==null?void 0:u.rank)||"-";g.push({id:`${s}-${o}`,name:s,subject:o,classes:c.classesText||c.classes||"",avg:c.avg,fairScore:a(c.fairScore,0).toFixed(1),leagueScoreRaw:a(c.leagueScoreRaw,0).toFixed(1),leagueScore:a(c.leagueScore,0).toFixed(1),baselineAdjustment:T(c.baselineAdjustment,1),baselineCoverage:c.baselineCoverageText||"0%",sampleSummary:c.sampleSummary||"共同样本待识别",sampleStability:c.sampleStabilityText||"0%",conversionSummary:c.conversionSummary||"暂无转化样本",conversionScore:a(c.conversionScore,50).toFixed(1),excRate:x(c.excellentRate,1),passRate:x(c.passRate,1),lowRate:x(c.lowRate,1),focusSummary:c.focusSummary||"培优0 / 临界0 / 辅差0",count:c.studentCount,rank:f,badgeClass:m.class,badgeText:m.text})})});const d=String(l||"").replace(/\s+/g,"").toLowerCase();return g.sort((s,o)=>{if((e==="teacher"||e==="class_teacher")&&d){const f=String(s.name||"").replace(/\s+/g,"").toLowerCase(),p=String(o.name||"").replace(/\s+/g,"").toLowerCase(),u=f===d||f.startsWith(`${d}(`)||f.startsWith(`${d}（`),r=p===d||p.startsWith(`${d}(`)||p.startsWith(`${d}（`);if(u!==r)return u?-1:1}const c=a(o.fairScore,0)-a(s.fairScore,0);if(c!==0)return c;const m=a(o.leagueScore,0)-a(s.leagueScore,0);return m!==0?m:String(s.name||"").localeCompare(String(o.name||""),"zh-Hans-CN")}),g}function B(){const t=document.getElementById("teacherCardsContainer"),i=z(),l=(i==null?void 0:i.role)||"guest",e=C(),g=window.TEACHER_TOWNSHIP_RANKINGS||{},d=H(e,g,(i==null?void 0:i.name)||"",l);try{if(window.Alpine&&typeof window.Alpine.store=="function"){const s=window.Alpine.store("teacherData");s&&(s.list=d)}}catch(s){console.warn("teacherData store update skipped:",s)}if(t){if(!d.length){t.innerHTML=`
                <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">
                    暂无教师数据，请先完成任课表同步和成绩导入。
                    <div style="margin-top:10px;">
                        <button class="btn btn-orange" onclick="openTeacherSync()">去同步任课表</button>
                    </div>
                </div>
            `;return}t.innerHTML=d.map(s=>`
            <div class="teacher-card">
                <div class="teacher-header">
                    <div>
                        <div class="teacher-name">${n(s.name)} - ${n(s.subject)}</div>
                        <div class="teacher-classes">${n(s.classes)}班</div>
                    </div>
                    <div class="performance-badge ${n(s.badgeClass)}">${n(s.badgeText)}</div>
                </div>
                <div class="teacher-stats">
                    <div class="stat-item">
                        <div class="stat-value">${n(s.avg)}</div>
                        <div class="stat-label">均分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${n(s.leagueScoreRaw)}</div>
                        <div class="stat-label">联考赋分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${n(s.fairScore)}</div>
                        <div class="stat-label">公平绩效</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; padding:0 10px;">
                    <span>优/及/低: ${n(s.excRate)} / ${n(s.passRate)} / ${n(s.lowRate)}</span>
                    <span>镇排: <strong style="color:var(--primary)">${n(s.rank)}</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:6px; padding:0 10px;">
                    <span>基线校正 ${n(s.baselineAdjustment)} · 覆盖 ${n(s.baselineCoverage)}</span>
                    <span>稳定 ${n(s.sampleStability)} · 转化 ${n(s.conversionScore)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:14px; padding:0 10px;">
                    <span>${n(s.sampleSummary)}</span>
                    <span>${n(s.focusSummary)} · ${n(s.conversionSummary)}</span>
                </div>
                <button class="view-details-btn" onclick='showTeacherDetails(${JSON.stringify(s.name)}, ${JSON.stringify(s.subject)})'>查看详情</button>
            </div>
        `).join("")}}function Y(){const t=z(),i=(t==null?void 0:t.role)||"guest",l=i==="teacher"||i==="class_teacher"?J(t):null,e=document.getElementById("teacher-township-ranking-container"),g=document.getElementById("side-nav-teacher-ranks-container");if(g&&(g.innerHTML=""),!e)return;if(!window.TOWNSHIP_RANKING_DATA||!Object.keys(window.TOWNSHIP_RANKING_DATA).length){e.innerHTML='<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';return}const d=window.TEACHER_TOWNSHIP_AVERAGES||{},s=f=>{const p=(f||[]).filter(w=>w.type==="school"&&a(w.studentCount,0)>0),u=p.length?p:(f||[]).filter(w=>a(w.studentCount,0)>0);let r=0,v=0,b=0,h=0;return u.forEach(w=>{const y=a(w.studentCount,0);y<=0||(r+=y,v+=a(w.avg,0)*y,b+=a(w.excellentRate,0)*y,h+=a(w.passRate,0)*y)}),r<=0?null:{avg:v/r,excRate:b/r,passRate:h/r,count:r,source:p.length?"ranking-schools":"ranking-rows"}},o=(f,p)=>{const u=a(f,NaN),r=a(p,NaN);if(!Number.isFinite(u)||!Number.isFinite(r)||Math.abs(r)<1e-9)return{text:"—",value:null};const v=(u-r)/r*100;return{text:`${v>=0?"+":""}${v.toFixed(2)}%`,value:v}},c=f=>!f||f.value===null?"rank-muted":f.value>=0?"positive-percent":"negative-percent";let m="";if((window.SUBJECTS||[]).forEach(f=>{var b;if(l&&l.size>0&&!l.has(X(f)))return;const p=(b=window.TOWNSHIP_RANKING_DATA)==null?void 0:b[f];if(!(p!=null&&p.length))return;const u=d[f]||s(p);let r="";p.forEach(h=>{const w=o(h.avg,u==null?void 0:u.avg),y=o(h.excellentRate,u==null?void 0:u.excRate),$=o(h.passRate,u==null?void 0:u.passRate),A=h.type==="teacher"?"text-blue":"",k=h.type==="teacher"?"analysis-row-emphasis":"",N=h.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school",F=h.type==="teacher"?"教师":"学校";r+=`
                    <tr class="${k}">
                        <td data-label="教师/学校" class="${A}">${n(h.name)}</td>
                        <td data-label="类型"><span class="${N}">${F}</span></td>
                        <td data-label="平均分">${_(h.avg,h.rankAvg,"teacher")}</td>
                        <td data-label="与镇均比" class="${c(w)}">${n(w.text)}</td>
                        <td data-label="镇排">${n(h.rankAvg)}</td>
                        <td data-label="优秀率">${_(h.excellentRate,h.rankExc,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${c(y)}">${n(y.text)}</td>
                        <td data-label="镇排">${n(h.rankExc)}</td>
                        <td data-label="及格率">${_(h.passRate,h.rankPass,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${c($)}">${n($.text)}</td>
                        <td data-label="镇排">${n(h.rankPass)}</td>
                    </tr>
                `});const v=`rank-anchor-${f}`;if(m+=`
                <div id="${v}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>${n(f)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${n(p.length)} 条</span>
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
                            <tbody>${r}</tbody>
                        </table>
                    </div>
                </div>
            `,g){const h=document.createElement("a");h.className="side-nav-sub-link",h.innerText=f,h.onclick=()=>{typeof window.scrollToSubAnchor=="function"&&window.scrollToSubAnchor(v,h)},g.appendChild(h)}}),!m){e.innerHTML='<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';return}e.innerHTML=m}function E(t,i="暂无"){const l=(t||[]).slice(0,8);return l.length?l.map(e=>`${e.name}${e.className?`(${e.className})`:""}${Number.isFinite(e.score)?` ${e.score}`:""}`).join("、"):i}const R={excellentEdges:{label:"培优",title:"培优边缘生",color:"#0f766e",empty:"暂无培优边缘生"},passEdges:{label:"临界",title:"及格临界生",color:"#1d4ed8",empty:"暂无及格临界生"},lowRisk:{label:"辅差",title:"辅差关注生",color:"#b45309",empty:"暂无辅差关注生"}};function S(t){return n(JSON.stringify(String(t||"")))}function L(t,i,l,e){var s;const g=R[l]||R.passEdges,d=((s=e==null?void 0:e.focusTargets)==null?void 0:s[l])||[];return`
            <button
                type="button"
                class="teacher-focus-chip"
                data-teacher="${n(t)}"
                data-subject="${n(i)}"
                data-focus-type="${n(l)}"
                onclick="window.showTeacherFocusTargetsFromButton && window.showTeacherFocusTargetsFromButton(this)"
                title="点击查看${n(g.title)}名单和班级"
                style="border:1px solid ${g.color}; color:${g.color}; background:#fff; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:800; cursor:pointer; margin:2px;"
            >${n(g.label)} ${d.length}</button>
        `}function O(t,i,l){var g,d,s;const e=[`培优: ${(((g=l.focusTargets)==null?void 0:g.excellentEdges)||[]).slice(0,6).map(o=>`${o.name}(${o.className||"-"}/${o.score})`).join("、")||"暂无"}`,`临界: ${(((d=l.focusTargets)==null?void 0:d.passEdges)||[]).slice(0,6).map(o=>`${o.name}(${o.className||"-"}/${o.score})`).join("、")||"暂无"}`,`辅差: ${(((s=l.focusTargets)==null?void 0:s.lowRisk)||[]).slice(0,6).map(o=>`${o.name}(${o.className||"-"}/${o.score})`).join("、")||"暂无"}`].join(" | ");return`
            <div title="${n(e)}" style="display:flex; align-items:center; justify-content:center; gap:3px; flex-wrap:wrap;">
                ${L(t,i,"excellentEdges",l)}
                ${L(t,i,"passEdges",l)}
                ${L(t,i,"lowRisk",l)}
            </div>
        `}function P(t,i,l){var m,f;const e=C(),g=(m=e==null?void 0:e[t])==null?void 0:m[i],d=R[l]||R.passEdges,s=Array.isArray((f=g==null?void 0:g.focusTargets)==null?void 0:f[l])?g.focusTargets[l]:[],o=`${t} / ${i} · ${d.title}`,c=s.length?`
            <div style="text-align:left;">
                <div style="margin-bottom:10px; color:#64748b; font-size:13px;">共 ${s.length} 人。点击姓名可跳转到学生成绩单，便于继续查看个人成绩、排名和家校材料。</div>
                <div class="table-wrap analysis-table-shell" style="max-height:55vh; overflow:auto;">
                    <table class="analysis-generated-table" style="width:100%; font-size:13px;">
                        <thead><tr><th>班级</th><th>姓名</th><th>当前分</th><th>差距</th><th>操作</th></tr></thead>
                        <tbody>
                            ${s.map(p=>{const u=Number.isFinite(p.gap)?Math.abs(p.gap).toFixed(1):"-",r=p.school||window.MY_SCHOOL||"";return`
                                    <tr>
                                        <td>${n(p.className||"-")}</td>
                                        <td><strong>${n(p.name||"-")}</strong></td>
                                        <td>${Number.isFinite(p.score)?n(p.score):"-"}</td>
                                        <td>${u}</td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-blue"
                                                onclick="window.jumpToStudent && window.jumpToStudent(${S(p.name)}, ${S(r)}, ${S(p.className)})">
                                                查看成绩单
                                            </button>
                                        </td>
                                    </tr>
                                `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `:`<div style="padding:24px; color:#64748b;">${n(d.empty)}</div>`;window.Swal&&typeof window.Swal.fire=="function"?window.Swal.fire({title:n(o),html:c,width:760,confirmButtonText:"关闭",confirmButtonColor:d.color}):alert(`${o}
${s.map(p=>{var u;return`${p.className||"-"} ${p.name||"-"} ${(u=p.score)!=null?u:"-"}`}).join(`
`)||d.empty}`)}function K(t){t&&P(t.dataset.teacher||"",t.dataset.subject||"",t.dataset.focusType||"passEdges")}function V(){const t=document.getElementById("teacherComparisonTable"),i=C();if(!t)return;if(!Object.keys(i).length){t.innerHTML='<p style="text-align:center; color:#666;">暂无教师统计数据</p>';return}const l={};Object.keys(i).forEach(d=>{Object.keys(i[d]||{}).forEach(s=>{l[s]||(l[s]=[]),l[s].push({teacher:d,data:i[d][s]})})});let g=`
            <thead>
                <tr>
                    <th rowspan="2">教师</th>
                    <th rowspan="2">班级</th>
                    <th rowspan="2">实考</th>
                    <th rowspan="2">共同样本</th>
                    <th rowspan="2">样本变动</th>
                    <th rowspan="2">均分</th>
                    <th rowspan="2" title="按系统现有两率一分标准折算，同校同学科比较">联考赋分(${j().total})</th>
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
        `;Object.keys(l).sort(M).forEach(d=>{g+=`<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${n(d)}</td></tr>`,l[d].sort((s,o)=>a(o.data.fairScore,0)-a(s.data.fairScore,0)).forEach(s=>{var v;const o=s.data,c=a(o.baselineAdjustment,0)>=0?"text-green":"text-red",m=a(o.lowRate,0)>=.12?"color:#dc2626; font-weight:700;":"color:#334155;",f=o.sampleWarning?"color:#b45309; font-weight:700;":"color:#334155;",p=`基线覆盖 ${o.baselineCoverageText||"0%"}；预计均分 ${a(o.expectedAvg,0).toFixed(2)}；预计优率 ${x(o.expectedExcellentRate,1)}；预计及格率 ${x(o.expectedPassRate,1)}；预计低分率 ${x(o.expectedLowRate,1)}；任课连续性 ${o.teacherContinuityText||"任课连续"}${o.baselineExamId?`；基线 ${o.baselineExamId}`:""}`,u=(o.previousSampleCount||0)>0?`新增 ${o.addedSampleCount||0} / 缺考退出 ${o.exitedSampleCount||0}`:"暂无基线",r=`${a(o.conversionScore,50).toFixed(1)}${a(o.conversionAdjustment,0)?` (${T(o.conversionAdjustment,1)})`:""}`;g+=`
                        <tr>
                            <td><strong>${n(s.teacher)}</strong></td>
                            <td>${n(o.classesText||o.classes||"-")}</td>
                            <td>${n(o.studentCount)}</td>
                            <td title="${n(o.sampleDetailText||"")}" style="${f}">
                                <div>${n((o.previousSampleCount||0)>0?o.commonSampleCount||0:"—")}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${n((o.previousSampleCount||0)>0?o.sampleStabilityText||"0%":"待历史样本")}</div>
                            </td>
                            <td title="${n(o.sampleDetailText||"")}" style="${f}">
                                <div>${n(u)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${n(o.previousSampleCount||0)}</div>
                            </td>
                            <td style="font-weight:700;">${n(o.avg)}</td>
                            <td title="${n(`均分赋分 ${a(o.ratedAvg,0).toFixed(1)}，优率赋分 ${a(o.ratedExc,0).toFixed(1)}，及格赋分 ${a(o.ratedPass,0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${a(o.leagueScoreRaw,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${a(o.leagueScore,0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${c}" title="${n(p)}" style="font-weight:700;">
                                <div>${T(o.baselineAdjustment,1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${n(o.baselineCoverageText||"0%")}</div>
                            </td>
                            <td>${x(o.excellentRate,1)}</td>
                            <td>${x(o.passRate,1)}</td>
                            <td style="${m}">${x(o.lowRate,1)}</td>
                            <td title="${n(`${o.conversionSummary||"暂无转化样本"}；${((v=o.conversionMetrics)==null?void 0:v.detail)||""}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${r}</div>
                                <div style="font-size:11px; color:#64748b;">${n(o.conversionSummary||"暂无转化")}</div>
                            </td>
                            <td style="font-size:12px;">${O(s.teacher,d,o)}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${a(o.fairScore,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${n(o.fairRank||"-")} 名</div>
                            </td>
                        </tr>
                    `})}),g+="</tbody>",t.classList.add("comparison-table"),t.innerHTML=g,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(t.closest(".section")||t)}function U(){return typeof window.ensureLazySectionLoaded=="function"&&window.ensureLazySectionLoaded("teacherModal"),document.getElementById("teacherModal")}function W(){if(window.__TEACHER_ANALYSIS_MODAL_BOUND__)return!0;const t=U(),i=document.getElementById("closeModal");return!t||!i?!1:(i.addEventListener("click",()=>{const l=document.getElementById("teacherModal");l&&(l.style.display="none")}),window.addEventListener("click",l=>{const e=document.getElementById("teacherModal");e&&l.target===e&&(e.style.display="none")}),window.__TEACHER_ANALYSIS_MODAL_BOUND__=!0,!0)}function D(t,i){var A,k,N,F;const l=C(),e=l[t]?l[t][i]:null;if(!e){window.UI&&window.UI.toast("当前筛选范围下暂无该教师该学科数据","warning");return}W();const g=U(),d=document.getElementById("modalSubjectTable"),s=document.getElementById("modalAvgProgress");if(!g||!d||!s)return;const o=document.getElementById("modalTeacherName"),c=document.getElementById("modalAvgScore"),m=document.getElementById("modalExcellentRate"),f=document.getElementById("modalPassRate"),p=document.getElementById("modalAvgComparison");o&&(o.textContent=`${t} - ${i} 教学详情`),c&&(c.textContent=e.avg),m&&(m.textContent=x(e.excellentRate,1)),f&&(f.textContent=x(e.passRate,1));const u=a(e.expectedAvg,NaN),r=a(e.avgValue,NaN),v=Number.isFinite(u)&&u>0&&Number.isFinite(r),b=v?(r-u)/u*100:null;p&&(p.textContent=v?`${b>=0?"+":""}${b.toFixed(1)}%`:"—");const h=v?Math.min(Math.max(50+b,0),100):50;s.style.width=`${h}%`,s.className=v?b>=0?"progress-good":"progress-poor":"progress-neutral",s.style.backgroundColor=v?b>=0?"#22c55e":"#ef4444":"#94a3b8";const w=d.querySelector("thead"),y=d.querySelector("tbody");w&&(w.innerHTML=`
                <tr>
                    <th>学科</th>
                    <th>实际均分</th>
                    <th>预计均分</th>
                    <th>优秀率(实/预)</th>
                    <th>及格率(实/预)</th>
                    <th>低分率(实/预)</th>
                    <th>基线校正</th>
                </tr>
            `),y&&(y.innerHTML=`
                <tr>
                    <td>${n(i)}</td>
                    <td>${a(e.avgValue,0).toFixed(2)}</td>
                    <td>${a(e.expectedAvg,0).toFixed(2)}</td>
                    <td>${x(e.excellentRate,1)} / ${x(e.expectedExcellentRate,1)}</td>
                    <td>${x(e.passRate,1)} / ${x(e.expectedPassRate,1)}</td>
                    <td>${x(e.lowRate,1)} / ${x(e.expectedLowRate,1)}</td>
                    <td class="${a(e.baselineAdjustment,0)>=0?"positive-percent":"negative-percent"}">${T(e.baselineAdjustment,1)}</td>
                </tr>
            `);let $=document.getElementById("teacherModalExtra");!$&&d.parentNode&&($=document.createElement("div"),$.id="teacherModalExtra",$.style.marginBottom="16px",d.parentNode.insertBefore($,d)),$&&($.innerHTML=`
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">联考赋分</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${a(e.leagueScoreRaw,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">折算 ${a(e.leagueScore,0).toFixed(1)} / 100</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">基线校正</div>
                        <div style="font-size:22px; font-weight:800; color:${a(e.baselineAdjustment,0)>=0?"#15803d":"#dc2626"};">${T(e.baselineAdjustment,1)}</div>
                        <div style="font-size:12px; color:#64748b;">覆盖 ${n(e.baselineCoverageText||"0%")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">公平绩效分</div>
                        <div style="font-size:22px; font-weight:800; color:#b45309;">${a(e.fairScore,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">同科第 ${n(e.fairRank||"-")} 名</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">置信 / 工作量</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${a(e.confidenceFactor,1).toFixed(2)}</div>
                        <div style="font-size:12px; color:#64748b;">工作量修正 ${T(e.workloadAdjustment,1)}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">共同样本</div>
                        <div style="font-size:22px; font-weight:800; color:${e.sampleWarning?"#b45309":"#0f172a"};">${n((e.previousSampleCount||0)>0?e.commonSampleCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">稳定 ${n((e.previousSampleCount||0)>0?e.sampleStabilityText||"0%":"待历史样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">样本变动</div>
                        <div style="font-size:22px; font-weight:800; color:${e.sampleWarning?"#b45309":"#0f172a"};">${n((e.previousSampleCount||0)>0?e.sampleShiftCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">${n((e.previousSampleCount||0)>0?`新增 ${e.addedSampleCount||0} · 缺考退出 ${e.exitedSampleCount||0}`:"暂无基线样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">转化分</div>
                        <div style="font-size:22px; font-weight:800; color:#0369a1;">${a(e.conversionScore,50).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">${n(e.conversionSummary||"暂无转化样本")}${a(e.conversionAdjustment,0)?` · 调整 ${T(e.conversionAdjustment,1)}`:""}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">换老师保护</div>
                        <div style="font-size:22px; font-weight:800; color:${e.teacherChangeProtected?"#b45309":"#0f172a"};">${n(e.teacherChangeProtected?"已冻结":"正常")}</div>
                        <div style="font-size:12px; color:#64748b;">${n(e.teacherContinuityText||"任课连续")}</div>
                    </div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px; background:#f8fafc;">
                    <div style="font-size:13px; font-weight:700; color:#334155; margin-bottom:10px;">培优 / 辅差名单</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${S(t)}, ${S(i)}, 'excellentEdges')" style="font-size:12px; color:#0f766e; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">培优边缘生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${n(E((A=e.focusTargets)==null?void 0:A.excellentEdges,"暂无培优边缘生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${S(t)}, ${S(i)}, 'passEdges')" style="font-size:12px; color:#1d4ed8; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">及格临界生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${n(E((k=e.focusTargets)==null?void 0:k.passEdges,"暂无及格临界生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${S(t)}, ${S(i)}, 'lowRisk')" style="font-size:12px; color:#b45309; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">辅差关注生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${n(E((N=e.focusTargets)==null?void 0:N.lowRisk,"暂无辅差关注生"))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${n(e.sampleDetailText||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${n(((F=e.conversionMetrics)==null?void 0:F.detail)||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${n(e.baselineExamId?`历史基线：${e.baselineExamId}`:"未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。")}</div>
                </div>
            `),g.style.display="flex"}function G(){const t=z(),i=(t==null?void 0:t.role)||"guest",l=i==="teacher"||i==="class_teacher"?C():window.TEACHER_STATS||{};if(!Object.keys(l).length){alert("请先进行教师分析");return}const e=new Set;Object.values(l).forEach(c=>Object.keys(c||{}).forEach(m=>e.add(m)));const g=window.XLSX.utils.book_new(),d=j(),s={};Object.keys(l).forEach(c=>{Object.keys(l[c]||{}).forEach(m=>{s[m]||(s[m]=[]),s[m].push({teacherName:c,data:l[c][m]})})}),Object.keys(s).sort(M).forEach(c=>{const m=s[c].sort((u,r)=>a(r.data.fairScore,0)-a(u.data.fairScore,0)),f=[["教师姓名","学科","任教班级","人数","均分",`联考赋分(${d.total})`,"联考赋分(折算100)","基线校正","基线覆盖","上次样本","共同样本","新增样本","缺考/退出","样本稳定度","任课连续性","转化分","转化调整","预计均分","优秀率","预计优秀率","及格率","预计及格率","低分率","预计低分率","工作量修正","置信系数","公平绩效分","同科排名","培优边缘生","及格临界生","辅差关注生"]];m.forEach(({teacherName:u,data:r})=>{var v,b,h;f.push([u,c,r.classesText||r.classes||"",r.studentCount,window.getExcelNum(a(r.avgValue,0)),window.getExcelNum(a(r.leagueScoreRaw,0)),window.getExcelNum(a(r.leagueScore,0)),window.getExcelNum(a(r.baselineAdjustment,0)),r.baselineCoverageText||"0%",r.previousSampleCount||0,r.commonSampleCount||0,r.addedSampleCount||0,r.exitedSampleCount||0,r.sampleStabilityText||"0%",r.teacherContinuityText||"",window.getExcelNum(a(r.conversionScore,50)),window.getExcelNum(a(r.conversionAdjustment,0)),window.getExcelNum(a(r.expectedAvg,0)),window.getExcelPercent(a(r.excellentRate,0)),window.getExcelPercent(a(r.expectedExcellentRate,0)),window.getExcelPercent(a(r.passRate,0)),window.getExcelPercent(a(r.expectedPassRate,0)),window.getExcelPercent(a(r.lowRate,0)),window.getExcelPercent(a(r.expectedLowRate,0)),window.getExcelNum(a(r.workloadAdjustment,0)),window.getExcelNum(a(r.confidenceFactor,1)),window.getExcelNum(a(r.fairScore,0)),r.fairRank||"",E((v=r.focusTargets)==null?void 0:v.excellentEdges,""),E((b=r.focusTargets)==null?void 0:b.passEdges,""),E((h=r.focusTargets)==null?void 0:h.lowRisk,"")])});const p=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName(c,"公平绩效"):String(c||"Sheet").slice(0,31);window.XLSX.utils.book_append_sheet(g,window.XLSX.utils.aoa_to_sheet(f),p)});const o=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,e):new Date().toISOString().slice(0,10);window.XLSX.writeFile(g,`教师公平绩效明细_${o}.xlsx`)}W(),Object.assign(window,{renderTeacherTownshipRanking:Y,teacherBuildCardList:H,teacherFormatFocusList:E,renderTeacherCards:B,renderTeacherCardsV2:B,calculatePerformanceLevel:I,calculatePerformanceLevelV2:I,renderTeacherComparisonTable:V,renderTeacherComparisonTableV2:V,renderTeacherFocusSummaryCell:O,showTeacherFocusTargets:P,showTeacherFocusTargetsFromButton:K,showTeacherDetails:D,showTeacherDetailsV2:D,exportTeacherComparisonExcel:G,exportTeacherComparisonExcelV2:G}),window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__=!0})();
