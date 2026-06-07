(()=>{if(typeof window=="undefined"||window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__)return;const a=typeof window.teacherToNumber=="function"?window.teacherToNumber:((t,i=0)=>{const r=Number(t);return Number.isFinite(r)?r:i}),b=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((t,i=1)=>`${(a(t,0)*100).toFixed(i)}%`),k=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((t,i=1)=>{const r=a(t,0);return`${r>=0?"+":""}${r.toFixed(i)}`}),o=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(t=>String(t!=null?t:"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i])),M=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>({avg:60,exc:70,pass:70,total:200})),_=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var t;return((t=window.Auth)==null?void 0:t.currentUser)||null}),J=typeof window.normalizeSubject=="function"?window.normalizeSubject:(t=>String(t||"").trim()),j=typeof window.sortSubjects=="function"?window.sortSubjects:((t,i)=>String(t||"").localeCompare(String(i||""),"zh-Hans-CN")),H=typeof window.formatRankDisplay=="function"?window.formatRankDisplay:((t,i,r="school",n=!1)=>`${n?`${(a(t,0)*100).toFixed(2)}%`:a(t,0).toFixed(2)} <span style="font-size:0.9em; color:#94a3b8">(${i})</span>`),E={cardsSignature:"",cardsHtml:"",comparisonSignature:"",comparisonHtml:""};function B(t,i=""){const r=[String(i||"")];return Object.keys(t||{}).sort().forEach(n=>{r.push(`T:${n}`),Object.keys(t[n]||{}).sort(j).forEach(u=>{const l=t[n][u]||{};r.push([u,l.classesText||l.classes||"",l.studentCount,l.avg,l.avgValue,l.fairScore,l.fairRank,l.leagueScoreRaw,l.leagueScore,l.baselineAdjustment,l.baselineCoverageText,l.excellentRate,l.passRate,l.lowRate,l.conversionScore,l.conversionAdjustment,l.focusSummary,l.sampleStabilityText,l.teacherContinuityText].join("|"))})}),r.join("::")}function A(){return typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats():window.TEACHER_STATS||{}}function Y(t){return typeof window.getVisibleSubjectsForTeacherUser=="function"?window.getVisibleSubjectsForTeacherUser(t):null}function I(t){const i=a(t==null?void 0:t.fairScore,(t==null?void 0:t.finalScore)||0),r=a(t==null?void 0:t.baselineAdjustment,0);return i>=85&&r>=0?{class:"performance-excellent",text:"优秀"}:i>=75?{class:"performance-good",text:"良好"}:i>=65?{class:"performance-average",text:"稳健"}:{class:"performance-poor",text:"待改进"}}function O(t,i,r="",n="guest"){const u=[];Object.keys(t||{}).forEach(c=>{Object.keys(t[c]||{}).forEach(d=>{var p,w;const e=t[c][d],v=I(e),x=((w=(p=i==null?void 0:i[c])==null?void 0:p[d])==null?void 0:w.rank)||"-";u.push({id:`${c}-${d}`,name:c,subject:d,classes:e.classesText||e.classes||"",avg:e.avg,fairScore:a(e.fairScore,0).toFixed(1),leagueScoreRaw:a(e.leagueScoreRaw,0).toFixed(1),leagueScore:a(e.leagueScore,0).toFixed(1),baselineAdjustment:k(e.baselineAdjustment,1),baselineCoverage:e.baselineCoverageText||"0%",sampleSummary:e.sampleSummary||"共同样本待识别",sampleStability:e.sampleStabilityText||"0%",conversionSummary:e.conversionSummary||"暂无转化样本",conversionScore:a(e.conversionScore,50).toFixed(1),excRate:b(e.excellentRate,1),passRate:b(e.passRate,1),lowRate:b(e.lowRate,1),focusSummary:e.focusSummary||"培优0 / 临界0 / 辅差0",count:e.studentCount,rank:x,badgeClass:v.class,badgeText:v.text})})});const l=String(r||"").replace(/\s+/g,"").toLowerCase();return u.sort((c,d)=>{if((n==="teacher"||n==="class_teacher")&&l){const x=String(c.name||"").replace(/\s+/g,"").toLowerCase(),p=String(d.name||"").replace(/\s+/g,"").toLowerCase(),w=x===l||x.startsWith(`${l}(`)||x.startsWith(`${l}（`),s=p===l||p.startsWith(`${l}(`)||p.startsWith(`${l}（`);if(w!==s)return w?-1:1}const e=a(d.fairScore,0)-a(c.fairScore,0);if(e!==0)return e;const v=a(d.leagueScore,0)-a(c.leagueScore,0);return v!==0?v:String(c.name||"").localeCompare(String(d.name||""),"zh-Hans-CN")}),u}function P(){const t=document.getElementById("teacherCardsContainer"),i=_(),r=(i==null?void 0:i.role)||"guest",n=A(),u=window.TEACHER_TOWNSHIP_RANKINGS||{},l=O(n,u,(i==null?void 0:i.name)||"",r);try{if(window.Alpine&&typeof window.Alpine.store=="function"){const e=window.Alpine.store("teacherData");e&&(e.list=l)}}catch(e){console.warn("teacherData store update skipped:",e)}if(!t)return;if(!l.length){t.innerHTML=`
                <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">
                    暂无教师数据，请先完成任课表同步和成绩导入。
                    <div style="margin-top:10px;">
                        <button class="btn btn-orange" onclick="openTeacherSync()">去同步任课表</button>
                    </div>
                </div>
            `;return}const c=B(n,[r,(i==null?void 0:i.name)||"",Object.keys(u||{}).sort().join("|")].join("|"));if(E.cardsSignature===c&&E.cardsHtml){t.dataset.teacherCardsSignature!==c&&(t.innerHTML=E.cardsHtml,t.dataset.teacherCardsSignature=c);return}const d=l.map(e=>`
            <div class="teacher-card">
                <div class="teacher-header">
                    <div>
                        <div class="teacher-name">${o(e.name)} - ${o(e.subject)}</div>
                        <div class="teacher-classes">${o(e.classes)}班</div>
                    </div>
                    <div class="performance-badge ${o(e.badgeClass)}">${o(e.badgeText)}</div>
                </div>
                <div class="teacher-stats">
                    <div class="stat-item">
                        <div class="stat-value">${o(e.avg)}</div>
                        <div class="stat-label">均分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${o(e.leagueScoreRaw)}</div>
                        <div class="stat-label">联考赋分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${o(e.fairScore)}</div>
                        <div class="stat-label">质量分</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; padding:0 10px;">
                    <span>优/及/低: ${o(e.excRate)} / ${o(e.passRate)} / ${o(e.lowRate)}</span>
                    <span>镇排: <strong style="color:var(--primary)">${o(e.rank)}</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:6px; padding:0 10px;">
                    <span>基线校正 ${o(e.baselineAdjustment)} · 覆盖 ${o(e.baselineCoverage)}</span>
                    <span>稳定 ${o(e.sampleStability)} · 转化 ${o(e.conversionScore)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:14px; padding:0 10px;">
                    <span>${o(e.sampleSummary)}</span>
                    <span>${o(e.focusSummary)} · ${o(e.conversionSummary)}</span>
                </div>
                <button class="view-details-btn" onclick='showTeacherDetails(${JSON.stringify(e.name)}, ${JSON.stringify(e.subject)})'>查看详情</button>
            </div>
        `).join("");E.cardsSignature=c,E.cardsHtml=d,t.dataset.teacherCardsSignature=c,t.innerHTML=d}function K(){const t=_(),i=(t==null?void 0:t.role)||"guest",r=i==="teacher"||i==="class_teacher"?Y(t):null,n=document.getElementById("teacher-township-ranking-container"),u=document.getElementById("side-nav-teacher-ranks-container");if(u&&(u.innerHTML=""),!n)return;if(typeof window.calculateTeacherTownshipRanking=="function"&&window.calculateTeacherTownshipRanking({teacherMetricScope:"admin"}),!window.TOWNSHIP_RANKING_DATA||!Object.keys(window.TOWNSHIP_RANKING_DATA).length){n.innerHTML='<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';return}const l=window.TEACHER_TOWNSHIP_AVERAGES||{},c=s=>{const h=(s||[]).filter($=>$.type==="school"&&a($.studentCount,0)>0),f=h.length?h:(s||[]).filter($=>a($.studentCount,0)>0);let m=0,y=0,C=0,g=0;return f.forEach($=>{const T=a($.studentCount,0);T<=0||(m+=T,y+=a($.avg,0)*T,C+=a($.excellentRate,0)*T,g+=a($.passRate,0)*T)}),m<=0?null:{avg:y/m,excRate:C/m,passRate:g/m,count:m,source:h.length?"ranking-schools":"ranking-rows"}},d=(s,h)=>{const f=a(s,NaN),m=a(h,NaN);if(!Number.isFinite(f)||!Number.isFinite(m)||Math.abs(m)<1e-9)return{text:"—",value:null};const y=(f-m)/m*100;return{text:`${y>=0?"+":""}${y.toFixed(2)}%`,value:y}},e=s=>!s||s.value===null?"rank-muted":s.value>=0?"positive-percent":"negative-percent",v=[],x=(s,h)=>{const f=(h||[]).filter(m=>m.type==="teacher").slice().sort((m,y)=>a(m.rankAvg,99999)-a(y.rankAvg,99999)).slice(0,8);return f.length?`
                <div class="teacher-township-quick-view" aria-label="${o(s)}教师排名速览">
                    ${f.map(m=>`
                        <div class="teacher-township-quick-card">
                            <strong>${o(m.name)}</strong>
                            <span>均分镇排 ${o(m.rankAvg)}</span>
                            <span>优秀率 ${o(m.rankExc)}</span>
                            <span>及格率 ${o(m.rankPass)}</span>
                        </div>
                    `).join("")}
                </div>
            `:""};let p="";if((window.SUBJECTS||[]).forEach(s=>{var C;if(r&&r.size>0&&!r.has(J(s)))return;const h=(C=window.TOWNSHIP_RANKING_DATA)==null?void 0:C[s];if(!(h!=null&&h.length))return;const f=l[s]||c(h);let m="";h.forEach(g=>{const $=d(g.avg,f==null?void 0:f.avg),T=d(g.excellentRate,f==null?void 0:f.excRate),N=d(g.passRate,f==null?void 0:f.passRate),z=g.type==="teacher"?"text-blue":"",Z=g.type==="teacher"?"analysis-row-emphasis":"",ee=g.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school",te=g.type==="teacher"?"教师":"学校";m+=`
                    <tr class="${Z}">
                        <td data-label="教师/学校" class="${z}">${o(g.name)}</td>
                        <td data-label="类型"><span class="${ee}">${te}</span></td>
                        <td data-label="平均分">${H(g.avg,g.rankAvg,"teacher")}</td>
                        <td data-label="与镇均比" class="${e($)}">${o($.text)}</td>
                        <td data-label="镇排">${o(g.rankAvg)}</td>
                        <td data-label="优秀率">${H(g.excellentRate,g.rankExc,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${e(T)}">${o(T.text)}</td>
                        <td data-label="镇排">${o(g.rankExc)}</td>
                        <td data-label="及格率">${H(g.passRate,g.rankPass,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${e(N)}">${o(N.text)}</td>
                        <td data-label="镇排">${o(g.rankPass)}</td>
                    </tr>
                `});const y=`rank-anchor-${s}`;if(v.push({subject:s,anchorId:y,count:h.length}),p+=`
                <div id="${y}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>${o(s)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${o(h.length)} 条</span>
                            <span class="analysis-table-tag">含外校整体数据</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">教师与学校数据同表展示，便于对照镇均水平、乡镇排名和学科整体波动。</div>
                    ${x(s,h)}
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
                            <tbody>${m}</tbody>
                        </table>
                    </div>
                </div>
            `,u){const g=document.createElement("a");g.className="side-nav-sub-link",g.innerText=s,g.onclick=()=>{typeof window.scrollToSubAnchor=="function"&&window.scrollToSubAnchor(y,g)},u.appendChild(g)}}),!p){n.innerHTML='<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';return}const w=v.length?`<div class="teacher-township-jumpbar analysis-generated-panel">
                    <div>
                        <strong>教师乡镇排名快速查看</strong>
                        <span>点击学科直接定位，无需逐屏查找。</span>
                    </div>
                    <div class="teacher-township-jumpbar-links">
                        ${v.map(s=>`<button type="button" data-rank-anchor="${o(s.anchorId)}">${o(s.subject)}<em>${o(s.count)}</em></button>`).join("")}
                    </div>
                </div>`:"";n.innerHTML=w+p,n.querySelectorAll("[data-rank-anchor]").forEach(s=>{s.addEventListener("click",()=>{var f;const h=s.getAttribute("data-rank-anchor");if(typeof window.scrollToSubAnchor=="function"){window.scrollToSubAnchor(h,s);return}(f=document.getElementById(h))==null||f.scrollIntoView({behavior:"smooth",block:"start"})})})}function R(t,i="暂无"){const r=(t||[]).slice(0,8);return r.length?r.map(n=>`${n.name}${n.className?`(${n.className})`:""}${Number.isFinite(n.score)?` ${n.score}`:""}`).join("、"):i}const F={excellentEdges:{label:"培优",title:"培优边缘生",color:"#0f766e",empty:"暂无培优边缘生"},passEdges:{label:"临界",title:"及格临界生",color:"#1d4ed8",empty:"暂无及格临界生"},lowRisk:{label:"辅差",title:"辅差关注生",color:"#b45309",empty:"暂无辅差关注生"}};function S(t){return o(JSON.stringify(String(t||"")))}function L(t,i,r,n){var c;const u=F[r]||F.passEdges,l=((c=n==null?void 0:n.focusTargets)==null?void 0:c[r])||[];return`
            <button
                type="button"
                class="teacher-focus-chip"
                data-teacher="${o(t)}"
                data-subject="${o(i)}"
                data-focus-type="${o(r)}"
                onclick="window.showTeacherFocusTargetsFromButton && window.showTeacherFocusTargetsFromButton(this)"
                title="点击查看${o(u.title)}名单和班级"
                style="border:1px solid ${u.color}; color:${u.color}; background:#fff; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:800; cursor:pointer; margin:2px;"
            >${o(u.label)} ${l.length}</button>
        `}function V(t,i,r){var u,l,c;const n=[`培优: ${(((u=r.focusTargets)==null?void 0:u.excellentEdges)||[]).slice(0,6).map(d=>`${d.name}(${d.className||"-"}/${d.score})`).join("、")||"暂无"}`,`临界: ${(((l=r.focusTargets)==null?void 0:l.passEdges)||[]).slice(0,6).map(d=>`${d.name}(${d.className||"-"}/${d.score})`).join("、")||"暂无"}`,`辅差: ${(((c=r.focusTargets)==null?void 0:c.lowRisk)||[]).slice(0,6).map(d=>`${d.name}(${d.className||"-"}/${d.score})`).join("、")||"暂无"}`].join(" | ");return`
            <div title="${o(n)}" style="display:flex; align-items:center; justify-content:center; gap:3px; flex-wrap:wrap;">
                ${L(t,i,"excellentEdges",r)}
                ${L(t,i,"passEdges",r)}
                ${L(t,i,"lowRisk",r)}
            </div>
        `}function U(t,i,r){var v,x;const n=A(),u=(v=n==null?void 0:n[t])==null?void 0:v[i],l=F[r]||F.passEdges,c=Array.isArray((x=u==null?void 0:u.focusTargets)==null?void 0:x[r])?u.focusTargets[r]:[],d=`${t} / ${i} · ${l.title}`,e=c.length?`
            <div style="text-align:left;">
                <div style="margin-bottom:10px; color:#64748b; font-size:13px;">共 ${c.length} 人。点击姓名可跳转到学生成绩单，便于继续查看个人成绩、排名和家校材料。</div>
                <div class="table-wrap analysis-table-shell" style="max-height:55vh; overflow:auto;">
                    <table class="analysis-generated-table" style="width:100%; font-size:13px;">
                        <thead><tr><th>班级</th><th>姓名</th><th>当前分</th><th>差距</th><th>操作</th></tr></thead>
                        <tbody>
                            ${c.map(p=>{const w=Number.isFinite(p.gap)?Math.abs(p.gap).toFixed(1):"-",s=p.school||window.MY_SCHOOL||"";return`
                                    <tr>
                                        <td>${o(p.className||"-")}</td>
                                        <td><strong>${o(p.name||"-")}</strong></td>
                                        <td>${Number.isFinite(p.score)?o(p.score):"-"}</td>
                                        <td>${w}</td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-blue"
                                                onclick="window.openStudentSubjectDialog ? window.openStudentSubjectDialog(${S(p.name)}, ${S(s)}, ${S(p.className)}, ${S(i)}, { focusLabel: ${S(l.title)}, gap: ${Number.isFinite(p.gap)?Number(p.gap):"null"} }) : (window.jumpToStudent && window.jumpToStudent(${S(p.name)}, ${S(s)}, ${S(p.className)}))">
                                                查看${o(i)}情况
                                            </button>
                                        </td>
                                    </tr>
                                `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `:`<div style="padding:24px; color:#64748b;">${o(l.empty)}</div>`;window.Swal&&typeof window.Swal.fire=="function"?window.Swal.fire({title:o(d),html:e,width:760,confirmButtonText:"关闭",confirmButtonColor:l.color}):alert(`${d}
${c.map(p=>{var w;return`${p.className||"-"} ${p.name||"-"} ${(w=p.score)!=null?w:"-"}`}).join(`
`)||l.empty}`)}function Q(t){t&&U(t.dataset.teacher||"",t.dataset.subject||"",t.dataset.focusType||"passEdges")}function W(){const t=document.getElementById("teacherComparisonTable"),i=A();if(!t)return;if(!Object.keys(i).length){t.innerHTML='<p style="text-align:center; color:#666;">暂无教师统计数据</p>';return}const r=B(i,["comparison",window.innerWidth<=860?"mobile":"desktop"].join("|"));if(E.comparisonSignature===r&&E.comparisonHtml){t.dataset.teacherComparisonSignature!==r&&(t.classList.add("comparison-table"),t.innerHTML=E.comparisonHtml,t.dataset.teacherComparisonSignature=r,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(t.closest(".section")||t));return}const n={};Object.keys(i).forEach(c=>{Object.keys(i[c]||{}).forEach(d=>{n[d]||(n[d]=[]),n[d].push({teacher:c,data:i[c][d]})})});let l=`
            <thead>
                <tr>
                    <th rowspan="2">教师</th>
                    <th rowspan="2">班级</th>
                    <th rowspan="2">实考</th>
                    <th rowspan="2">共同样本</th>
                    <th rowspan="2">样本变动</th>
                    <th rowspan="2">均分</th>
                    <th rowspan="2" title="按系统现有两率一分标准折算，同校同学科比较">联考赋分(${M().total})</th>
                    <th rowspan="2" title="按最近一次历史考试的匹配学生做超预期修正，范围约 ±20">基线校正</th>
                    <th colspan="3" style="background:#dcfce7; color:#166534;">三率指标</th>
                    <th rowspan="2">转化分</th>
                    <th rowspan="2">重点学生</th>
                    <th rowspan="2" style="background:#fef3c7; color:#92400e;">教学质量分</th>
                </tr>
                <tr>
                    <th>优秀率</th>
                    <th>及格率</th>
                    <th>低分率</th>
                </tr>
            </thead>
            <tbody>
        `;Object.keys(n).sort(j).forEach(c=>{l+=`<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${o(c)}</td></tr>`,n[c].sort((d,e)=>a(e.data.fairScore,0)-a(d.data.fairScore,0)).forEach(d=>{var f;const e=d.data,v=a(e.baselineAdjustment,0)>=0?"text-green":"text-red",x=a(e.lowRate,0)>=.12?"color:#dc2626; font-weight:700;":"color:#334155;",p=e.sampleWarning?"color:#b45309; font-weight:700;":"color:#334155;",w=`基线覆盖 ${e.baselineCoverageText||"0%"}；预计均分 ${a(e.expectedAvg,0).toFixed(2)}；预计优率 ${b(e.expectedExcellentRate,1)}；预计及格率 ${b(e.expectedPassRate,1)}；预计低分率 ${b(e.expectedLowRate,1)}；任课连续性 ${e.teacherContinuityText||"任课连续"}${e.baselineExamId?`；基线 ${e.baselineExamId}`:""}`,s=(e.previousSampleCount||0)>0?`新增 ${e.addedSampleCount||0} / 缺考退出 ${e.exitedSampleCount||0}`:"暂无基线",h=`${a(e.conversionScore,50).toFixed(1)}${a(e.conversionAdjustment,0)?` (${k(e.conversionAdjustment,1)})`:""}`;l+=`
                        <tr>
                            <td><strong>${o(d.teacher)}</strong></td>
                            <td>${o(e.classesText||e.classes||"-")}</td>
                            <td>${o(e.studentCount)}</td>
                            <td title="${o(e.sampleDetailText||"")}" style="${p}">
                                <div>${o((e.previousSampleCount||0)>0?e.commonSampleCount||0:"—")}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${o((e.previousSampleCount||0)>0?e.sampleStabilityText||"0%":"待历史样本")}</div>
                            </td>
                            <td title="${o(e.sampleDetailText||"")}" style="${p}">
                                <div>${o(s)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${o(e.previousSampleCount||0)}</div>
                            </td>
                            <td style="font-weight:700;">${o(e.avg)}</td>
                            <td title="${o(`均分赋分 ${a(e.ratedAvg,0).toFixed(1)}，优率赋分 ${a(e.ratedExc,0).toFixed(1)}，及格赋分 ${a(e.ratedPass,0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${a(e.leagueScoreRaw,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${a(e.leagueScore,0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${v}" title="${o(w)}" style="font-weight:700;">
                                <div>${k(e.baselineAdjustment,1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${o(e.baselineCoverageText||"0%")}</div>
                            </td>
                            <td>${b(e.excellentRate,1)}</td>
                            <td>${b(e.passRate,1)}</td>
                            <td style="${x}">${b(e.lowRate,1)}</td>
                            <td title="${o(`${e.conversionSummary||"暂无转化样本"}；${((f=e.conversionMetrics)==null?void 0:f.detail)||""}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${h}</div>
                                <div style="font-size:11px; color:#64748b;">${o(e.conversionSummary||"暂无转化")}</div>
                            </td>
                            <td style="font-size:12px;">${V(d.teacher,c,e)}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${a(e.fairScore,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${o(e.fairRank||"-")} 名</div>
                            </td>
                        </tr>
                    `})}),l+="</tbody>",E.comparisonSignature=r,E.comparisonHtml=l,t.dataset.teacherComparisonSignature=r,t.classList.add("comparison-table"),t.innerHTML=l,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(t.closest(".section")||t)}function D(){return typeof window.ensureLazySectionLoaded=="function"&&window.ensureLazySectionLoaded("teacherModal"),document.getElementById("teacherModal")}function G(){if(window.__TEACHER_ANALYSIS_MODAL_BOUND__)return!0;const t=D(),i=document.getElementById("closeModal");return!t||!i?!1:(i.addEventListener("click",()=>{const r=document.getElementById("teacherModal");r&&(r.style.display="none")}),window.addEventListener("click",r=>{const n=document.getElementById("teacherModal");n&&r.target===n&&(n.style.display="none")}),window.__TEACHER_ANALYSIS_MODAL_BOUND__=!0,!0)}function X(t,i){var $,T,N,z;const r=A(),n=r[t]?r[t][i]:null;if(!n){window.UI&&window.UI.toast("当前筛选范围下暂无该教师该学科数据","warning");return}G();const u=D(),l=document.getElementById("modalSubjectTable"),c=document.getElementById("modalAvgProgress");if(!u||!l||!c)return;const d=document.getElementById("modalTeacherName"),e=document.getElementById("modalAvgScore"),v=document.getElementById("modalExcellentRate"),x=document.getElementById("modalPassRate"),p=document.getElementById("modalAvgComparison");d&&(d.textContent=`${t} - ${i} 教学详情`),e&&(e.textContent=n.avg),v&&(v.textContent=b(n.excellentRate,1)),x&&(x.textContent=b(n.passRate,1));const w=a(n.expectedAvg,NaN),s=a(n.avgValue,NaN),h=Number.isFinite(w)&&w>0&&Number.isFinite(s),f=h?(s-w)/w*100:null;p&&(p.textContent=h?`${f>=0?"+":""}${f.toFixed(1)}%`:"—");const m=h?Math.min(Math.max(50+f,0),100):50;c.style.width=`${m}%`,c.className=h?f>=0?"progress-good":"progress-poor":"progress-neutral",c.style.backgroundColor=h?f>=0?"#22c55e":"#ef4444":"#94a3b8";const y=l.querySelector("thead"),C=l.querySelector("tbody");y&&(y.innerHTML=`
                <tr>
                    <th>学科</th>
                    <th>实际均分</th>
                    <th>预计均分</th>
                    <th>优秀率(实/预)</th>
                    <th>及格率(实/预)</th>
                    <th>低分率(实/预)</th>
                    <th>基线校正</th>
                </tr>
            `),C&&(C.innerHTML=`
                <tr>
                    <td>${o(i)}</td>
                    <td>${a(n.avgValue,0).toFixed(2)}</td>
                    <td>${a(n.expectedAvg,0).toFixed(2)}</td>
                    <td>${b(n.excellentRate,1)} / ${b(n.expectedExcellentRate,1)}</td>
                    <td>${b(n.passRate,1)} / ${b(n.expectedPassRate,1)}</td>
                    <td>${b(n.lowRate,1)} / ${b(n.expectedLowRate,1)}</td>
                    <td class="${a(n.baselineAdjustment,0)>=0?"positive-percent":"negative-percent"}">${k(n.baselineAdjustment,1)}</td>
                </tr>
            `);let g=document.getElementById("teacherModalExtra");!g&&l.parentNode&&(g=document.createElement("div"),g.id="teacherModalExtra",g.style.marginBottom="16px",l.parentNode.insertBefore(g,l)),g&&(g.innerHTML=`
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">联考赋分</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${a(n.leagueScoreRaw,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">折算 ${a(n.leagueScore,0).toFixed(1)} / 100</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">基线校正</div>
                        <div style="font-size:22px; font-weight:800; color:${a(n.baselineAdjustment,0)>=0?"#15803d":"#dc2626"};">${k(n.baselineAdjustment,1)}</div>
                        <div style="font-size:12px; color:#64748b;">覆盖 ${o(n.baselineCoverageText||"0%")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">教学质量分</div>
                        <div style="font-size:22px; font-weight:800; color:#b45309;">${a(n.fairScore,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">同科第 ${o(n.fairRank||"-")} 名</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">置信 / 工作量</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${a(n.confidenceFactor,1).toFixed(2)}</div>
                        <div style="font-size:12px; color:#64748b;">工作量修正 ${k(n.workloadAdjustment,1)}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">共同样本</div>
                        <div style="font-size:22px; font-weight:800; color:${n.sampleWarning?"#b45309":"#0f172a"};">${o((n.previousSampleCount||0)>0?n.commonSampleCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">稳定 ${o((n.previousSampleCount||0)>0?n.sampleStabilityText||"0%":"待历史样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">样本变动</div>
                        <div style="font-size:22px; font-weight:800; color:${n.sampleWarning?"#b45309":"#0f172a"};">${o((n.previousSampleCount||0)>0?n.sampleShiftCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">${o((n.previousSampleCount||0)>0?`新增 ${n.addedSampleCount||0} · 缺考退出 ${n.exitedSampleCount||0}`:"暂无基线样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">转化分</div>
                        <div style="font-size:22px; font-weight:800; color:#0369a1;">${a(n.conversionScore,50).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">${o(n.conversionSummary||"暂无转化样本")}${a(n.conversionAdjustment,0)?` · 调整 ${k(n.conversionAdjustment,1)}`:""}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">换老师保护</div>
                        <div style="font-size:22px; font-weight:800; color:${n.teacherChangeProtected?"#b45309":"#0f172a"};">${o(n.teacherChangeProtected?"已冻结":"正常")}</div>
                        <div style="font-size:12px; color:#64748b;">${o(n.teacherContinuityText||"任课连续")}</div>
                    </div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px; background:#f8fafc;">
                    <div style="font-size:13px; font-weight:700; color:#334155; margin-bottom:10px;">培优 / 辅差名单</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${S(t)}, ${S(i)}, 'excellentEdges')" style="font-size:12px; color:#0f766e; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">培优边缘生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(R(($=n.focusTargets)==null?void 0:$.excellentEdges,"暂无培优边缘生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${S(t)}, ${S(i)}, 'passEdges')" style="font-size:12px; color:#1d4ed8; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">及格临界生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(R((T=n.focusTargets)==null?void 0:T.passEdges,"暂无及格临界生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${S(t)}, ${S(i)}, 'lowRisk')" style="font-size:12px; color:#b45309; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">辅差关注生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(R((N=n.focusTargets)==null?void 0:N.lowRisk,"暂无辅差关注生"))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${o(n.sampleDetailText||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${o(((z=n.conversionMetrics)==null?void 0:z.detail)||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${o(n.baselineExamId?`历史基线：${n.baselineExamId}`:"未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。")}</div>
                </div>
            `),u.style.display="flex"}function q(){const t=_(),i=(t==null?void 0:t.role)||"guest",r=i==="teacher"||i==="class_teacher"?A():window.TEACHER_STATS||{};if(!Object.keys(r).length){alert("请先进行教师分析");return}const n=new Set;Object.values(r).forEach(e=>Object.keys(e||{}).forEach(v=>n.add(v)));const u=window.XLSX.utils.book_new(),l=M(),c={};Object.keys(r).forEach(e=>{Object.keys(r[e]||{}).forEach(v=>{c[v]||(c[v]=[]),c[v].push({teacherName:e,data:r[e][v]})})}),Object.keys(c).sort(j).forEach(e=>{const v=c[e].sort((w,s)=>a(s.data.fairScore,0)-a(w.data.fairScore,0)),x=[["教师姓名","学科","任教班级","人数","均分",`联考赋分(${l.total})`,"联考赋分(折算100)","基线校正","基线覆盖","上次样本","共同样本","新增样本","缺考/退出","样本稳定度","任课连续性","转化分","转化调整","预计均分","优秀率","预计优秀率","及格率","预计及格率","低分率","预计低分率","工作量修正","置信系数","教学质量分","同科排名","培优边缘生","及格临界生","辅差关注生"]];v.forEach(({teacherName:w,data:s})=>{var h,f,m;x.push([w,e,s.classesText||s.classes||"",s.studentCount,window.getExcelNum(a(s.avgValue,0)),window.getExcelNum(a(s.leagueScoreRaw,0)),window.getExcelNum(a(s.leagueScore,0)),window.getExcelNum(a(s.baselineAdjustment,0)),s.baselineCoverageText||"0%",s.previousSampleCount||0,s.commonSampleCount||0,s.addedSampleCount||0,s.exitedSampleCount||0,s.sampleStabilityText||"0%",s.teacherContinuityText||"",window.getExcelNum(a(s.conversionScore,50)),window.getExcelNum(a(s.conversionAdjustment,0)),window.getExcelNum(a(s.expectedAvg,0)),window.getExcelPercent(a(s.excellentRate,0)),window.getExcelPercent(a(s.expectedExcellentRate,0)),window.getExcelPercent(a(s.passRate,0)),window.getExcelPercent(a(s.expectedPassRate,0)),window.getExcelPercent(a(s.lowRate,0)),window.getExcelPercent(a(s.expectedLowRate,0)),window.getExcelNum(a(s.workloadAdjustment,0)),window.getExcelNum(a(s.confidenceFactor,1)),window.getExcelNum(a(s.fairScore,0)),s.fairRank||"",R((h=s.focusTargets)==null?void 0:h.excellentEdges,""),R((f=s.focusTargets)==null?void 0:f.passEdges,""),R((m=s.focusTargets)==null?void 0:m.lowRisk,"")])});const p=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName(e,"教学质量"):String(e||"Sheet").slice(0,31);window.XLSX.utils.book_append_sheet(u,window.XLSX.utils.aoa_to_sheet(x),p)});const d=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,n):new Date().toISOString().slice(0,10);window.XLSX.writeFile(u,`教师教学质量明细_${d}.xlsx`)}G(),Object.assign(window,{renderTeacherTownshipRanking:K,teacherBuildCardList:O,teacherFormatFocusList:R,renderTeacherCards:P,renderTeacherCardsV2:P,calculatePerformanceLevel:I,calculatePerformanceLevelV2:I,renderTeacherComparisonTable:W,renderTeacherComparisonTableV2:W,renderTeacherFocusSummaryCell:V,showTeacherFocusTargets:U,showTeacherFocusTargetsFromButton:Q,showTeacherDetails:X,showTeacherDetailsV2:X,exportTeacherComparisonExcel:q,exportTeacherComparisonExcelV2:q}),window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__=!0})();
