(()=>{if(typeof window=="undefined"||window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__)return;const s=typeof window.teacherToNumber=="function"?window.teacherToNumber:((t,a=0)=>{const i=Number(t);return Number.isFinite(i)?i:a}),$=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((t,a=1)=>`${(s(t,0)*100).toFixed(a)}%`),R=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((t,a=1)=>{const i=s(t,0);return`${i>=0?"+":""}${i.toFixed(a)}`}),o=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(t=>String(t!=null?t:"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])),M=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>({avg:60,exc:70,pass:70,total:200})),z=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var t;return((t=window.Auth)==null?void 0:t.currentUser)||null}),K=typeof window.normalizeSubject=="function"?window.normalizeSubject:(t=>String(t||"").trim()),_=typeof window.sortSubjects=="function"?window.sortSubjects:((t,a)=>String(t||"").localeCompare(String(a||""),"zh-Hans-CN")),H=typeof window.formatRankDisplay=="function"?window.formatRankDisplay:((t,a,i="school",n=!1)=>`${n?`${(s(t,0)*100).toFixed(2)}%`:s(t,0).toFixed(2)} <span style="font-size:0.9em; color:#94a3b8">(${a})</span>`),C={cardsSignature:"",cardsHtml:"",comparisonSignature:"",comparisonHtml:""};function B(t,a=""){const i=[String(a||"")];return Object.keys(t||{}).sort().forEach(n=>{i.push(`T:${n}`),Object.keys(t[n]||{}).sort(_).forEach(u=>{const r=t[n][u]||{};i.push([u,r.classesText||r.classes||"",r.studentCount,r.avg,r.avgValue,r.fairScore,r.fairRank,r.leagueScoreRaw,r.leagueScore,r.baselineAdjustment,r.baselineCoverageText,r.excellentRate,r.passRate,r.lowRate,r.conversionScore,r.conversionAdjustment,r.focusSummary,r.sampleStabilityText,r.teacherContinuityText].join("|"))})}),i.join("::")}function N(){return typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats():window.TEACHER_STATS||{}}function Q(t){return typeof window.getVisibleSubjectsForTeacherUser=="function"?window.getVisibleSubjectsForTeacherUser(t):null}function L(t){const a=s(t==null?void 0:t.fairScore,(t==null?void 0:t.finalScore)||0),i=s(t==null?void 0:t.baselineAdjustment,0);return a>=85&&i>=0?{class:"performance-excellent",text:"优秀"}:a>=75?{class:"performance-good",text:"良好"}:a>=65?{class:"performance-average",text:"稳健"}:{class:"performance-poor",text:"待改进"}}function O(t,a,i="",n="guest"){const u=[];Object.keys(t||{}).forEach(c=>{Object.keys(t[c]||{}).forEach(l=>{var g,v;const e=t[c][l],m=L(e),y=((v=(g=a==null?void 0:a[c])==null?void 0:g[l])==null?void 0:v.rank)||"-";u.push({id:`${c}-${l}`,name:c,subject:l,classes:e.classesText||e.classes||"",avg:e.avg,fairScore:s(e.fairScore,0).toFixed(1),leagueScoreRaw:s(e.leagueScoreRaw,0).toFixed(1),leagueScore:s(e.leagueScore,0).toFixed(1),baselineAdjustment:R(e.baselineAdjustment,1),baselineCoverage:e.baselineCoverageText||"0%",sampleSummary:e.sampleSummary||"共同样本待识别",sampleStability:e.sampleStabilityText||"0%",conversionSummary:e.conversionSummary||"暂无转化样本",conversionScore:s(e.conversionScore,50).toFixed(1),excRate:$(e.excellentRate,1),passRate:$(e.passRate,1),lowRate:$(e.lowRate,1),focusSummary:e.focusSummary||"培优0 / 临界0 / 辅差0",count:e.studentCount,rank:y,badgeClass:m.class,badgeText:m.text})})});const r=String(i||"").replace(/\s+/g,"").toLowerCase();return u.sort((c,l)=>{if((n==="teacher"||n==="class_teacher")&&r){const y=String(c.name||"").replace(/\s+/g,"").toLowerCase(),g=String(l.name||"").replace(/\s+/g,"").toLowerCase(),v=y===r||y.startsWith(`${r}(`)||y.startsWith(`${r}（`),d=g===r||g.startsWith(`${r}(`)||g.startsWith(`${r}（`);if(v!==d)return v?-1:1}const e=s(l.fairScore,0)-s(c.fairScore,0);if(e!==0)return e;const m=s(l.leagueScore,0)-s(c.leagueScore,0);return m!==0?m:String(c.name||"").localeCompare(String(l.name||""),"zh-Hans-CN")}),u}function P(){const t=document.getElementById("teacherCardsContainer"),a=z(),i=(a==null?void 0:a.role)||"guest",n=N(),u=window.TEACHER_TOWNSHIP_RANKINGS||{},r=O(n,u,(a==null?void 0:a.name)||"",i);try{if(window.Alpine&&typeof window.Alpine.store=="function"){const e=window.Alpine.store("teacherData");e&&(e.list=r)}}catch(e){console.warn("teacherData store update skipped:",e)}if(!t)return;if(!r.length){t.innerHTML=`
                <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">
                    暂无教师数据，请先完成任课表同步和成绩导入。
                    <div style="margin-top:10px;">
                        <button class="btn btn-orange" onclick="openTeacherSync()">去同步任课表</button>
                    </div>
                </div>
            `;return}const c=B(n,[i,(a==null?void 0:a.name)||"",Object.keys(u||{}).sort().join("|")].join("|"));if(C.cardsSignature===c&&C.cardsHtml){(t.dataset.teacherCardsSignature!==c||!t.querySelector(".teacher-card"))&&(t.innerHTML=C.cardsHtml,t.dataset.teacherCardsSignature=c);return}const l=r.map(e=>`
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
        `).join("");C.cardsSignature=c,C.cardsHtml=l,t.dataset.teacherCardsSignature=c,t.innerHTML=l;try{typeof window.renderTeacherHighlights=="function"&&window.renderTeacherHighlights()}catch(e){console.warn("[teacher-cards] 本次要点渲染失败（不影响卡片）:",e)}}function Z(){const t=z(),a=(t==null?void 0:t.role)||"guest",i=a==="teacher"||a==="class_teacher"?Q(t):null,n=document.getElementById("teacher-township-ranking-container"),u=document.getElementById("side-nav-teacher-ranks-container");if(u&&(u.innerHTML=""),!n)return;if(typeof window.calculateTeacherTownshipRanking=="function"&&window.calculateTeacherTownshipRanking({teacherMetricScope:"admin"}),!window.TOWNSHIP_RANKING_DATA||!Object.keys(window.TOWNSHIP_RANKING_DATA).length){n.innerHTML='<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';return}const r=window.TEACHER_TOWNSHIP_AVERAGES||{},c=p=>{const h=(p||[]).filter(S=>S.type==="school"&&s(S.studentCount,0)>0),x=h.length?h:(p||[]).filter(S=>s(S.studentCount,0)>0);let w=0,b=0,E=0,k=0;return x.forEach(S=>{const f=s(S.studentCount,0);f<=0||(w+=f,b+=s(S.avg,0)*f,E+=s(S.excellentRate,0)*f,k+=s(S.passRate,0)*f)}),w<=0?null:{avg:b/w,excRate:E/w,passRate:k/w,count:w,source:h.length?"ranking-schools":"ranking-rows"}},l=(p,h)=>{const x=s(p,NaN),w=s(h,NaN);if(!Number.isFinite(x)||!Number.isFinite(w)||Math.abs(w)<1e-9)return{text:"—",value:null};const b=(x-w)/w*100;return{text:`${b>=0?"+":""}${b.toFixed(2)}%`,value:b}},e=p=>!p||p.value===null?"rank-muted":p.value>=0?"positive-percent":"negative-percent",m=[],y=(p,h)=>{const x=(h||[]).filter(w=>w.type==="teacher").slice().sort((w,b)=>s(w.rankAvg,99999)-s(b.rankAvg,99999)).slice(0,8);return x.length?`
                <div class="teacher-township-quick-view" aria-label="${o(p)}教师排名速览">
                    ${x.map(w=>`
                        <div class="teacher-township-quick-card">
                            <strong>${o(w.name)}</strong>
                            <span>均分镇排 ${o(w.rankAvg)}</span>
                            <span>优秀率 ${o(w.rankExc)}</span>
                            <span>及格率 ${o(w.rankPass)}</span>
                        </div>
                    `).join("")}
                </div>
            `:""},g=typeof window.getTeacherAnalysisDisplaySubjects=="function"?window.getTeacherAnalysisDisplaySubjects():window.SUBJECTS||[];let v="";if(g.forEach(p=>{var S;if(i&&i.size>0&&!i.has(K(p)))return;const h=(S=window.TOWNSHIP_RANKING_DATA)==null?void 0:S[p];if(!(h!=null&&h.length))return;const x=typeof window.getConfiguredDisplaySubjectLabel=="function"?window.getConfiguredDisplaySubjectLabel(p):p,w=typeof window.getConfiguredDisplaySubjectNotice=="function"?window.getConfiguredDisplaySubjectNotice(p):"",b=r[p]||c(h);let E="";h.forEach(f=>{const F=l(f.avg,b==null?void 0:b.avg),J=l(f.excellentRate,b==null?void 0:b.excRate),Y=l(f.passRate,b==null?void 0:b.passRate),te=f.type==="teacher"?"text-blue":"",ne=f.type==="teacher"?"analysis-row-emphasis":"",oe=f.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school",se=f.type==="teacher"?"教师":"学校";E+=`
                    <tr class="${ne}">
                        <td data-label="教师/学校" class="${te}">${o(f.name)}</td>
                        <td data-label="类型"><span class="${oe}">${se}</span></td>
                        <td data-label="平均分">${H(f.avg,f.rankAvg,"teacher")}</td>
                        <td data-label="与镇均比" class="${e(F)}">${o(F.text)}</td>
                        <td data-label="镇排">${o(f.rankAvg)}</td>
                        <td data-label="优秀率">${H(f.excellentRate,f.rankExc,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${e(J)}">${o(J.text)}</td>
                        <td data-label="镇排">${o(f.rankExc)}</td>
                        <td data-label="及格率">${H(f.passRate,f.rankPass,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${e(Y)}">${o(Y.text)}</td>
                        <td data-label="镇排">${o(f.rankPass)}</td>
                    </tr>
                `});const k=`rank-anchor-${p}`;if(m.push({subject:p,anchorId:k,count:h.length}),v+=`
                <div id="${k}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span title="${o(w)}">${o(x)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${o(h.length)} 条</span>
                            <span class="analysis-table-tag">含外校整体数据</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">${o(w||"教师与学校数据同表展示，便于对照镇均水平、乡镇排名和学科整体波动。")}</div>
                    ${y(p,h)}
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
                            <tbody>${E}</tbody>
                        </table>
                    </div>
                </div>
            `,u){const f=document.createElement("a");f.className="side-nav-sub-link",f.innerText=x,f.onclick=()=>{typeof window.scrollToSubAnchor=="function"&&window.scrollToSubAnchor(k,f)},u.appendChild(f)}}),!v){n.innerHTML='<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';return}const d=m.length?`<div class="teacher-township-jumpbar analysis-generated-panel">
                    <div>
                        <strong>教师乡镇排名快速查看</strong>
                        <span>点击学科直接定位，无需逐屏查找。</span>
                    </div>
                    <div class="teacher-township-jumpbar-links">
                        ${m.map(p=>`<button type="button" data-rank-anchor="${o(p.anchorId)}">${o(p.subject)}<em>${o(p.count)}</em></button>`).join("")}
                    </div>
                </div>`:"";n.innerHTML=d+v,n.querySelectorAll("[data-rank-anchor]").forEach(p=>{p.addEventListener("click",()=>{var x;const h=p.getAttribute("data-rank-anchor");if(typeof window.scrollToSubAnchor=="function"){window.scrollToSubAnchor(h,p);return}(x=document.getElementById(h))==null||x.scrollIntoView({behavior:"smooth",block:"start"})})})}function A(t,a="暂无"){const i=(t||[]).slice(0,8);return i.length?i.map(n=>`${n.name}${n.className?`(${n.className})`:""}${Number.isFinite(n.score)?` ${n.score}`:""}`).join("、"):a}const j={excellentEdges:{label:"培优",title:"培优边缘生",color:"#0f766e",empty:"暂无培优边缘生"},passEdges:{label:"临界",title:"及格临界生",color:"#1d4ed8",empty:"暂无及格临界生"},lowRisk:{label:"辅差",title:"辅差关注生",color:"#b45309",empty:"暂无辅差关注生"}};function T(t){return o(JSON.stringify(String(t||"")))}function I(t,a,i,n){var c;const u=j[i]||j.passEdges,r=((c=n==null?void 0:n.focusTargets)==null?void 0:c[i])||[];return`
            <button
                type="button"
                class="teacher-focus-chip"
                data-teacher="${o(t)}"
                data-subject="${o(a)}"
                data-focus-type="${o(i)}"
                onclick="window.showTeacherFocusTargetsFromButton && window.showTeacherFocusTargetsFromButton(this)"
                title="点击查看${o(u.title)}名单和班级"
                style="border:1px solid ${u.color}; color:${u.color}; background:#fff; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:800; cursor:pointer; margin:2px;"
            >${o(u.label)} ${r.length}</button>
        `}function U(t,a,i){var u,r,c;const n=[`培优: ${(((u=i.focusTargets)==null?void 0:u.excellentEdges)||[]).slice(0,6).map(l=>`${l.name}(${l.className||"-"}/${l.score})`).join("、")||"暂无"}`,`临界: ${(((r=i.focusTargets)==null?void 0:r.passEdges)||[]).slice(0,6).map(l=>`${l.name}(${l.className||"-"}/${l.score})`).join("、")||"暂无"}`,`辅差: ${(((c=i.focusTargets)==null?void 0:c.lowRisk)||[]).slice(0,6).map(l=>`${l.name}(${l.className||"-"}/${l.score})`).join("、")||"暂无"}`].join(" | ");return`
            <div title="${o(n)}" style="display:flex; align-items:center; justify-content:center; gap:3px; flex-wrap:wrap;">
                ${I(t,a,"excellentEdges",i)}
                ${I(t,a,"passEdges",i)}
                ${I(t,a,"lowRisk",i)}
            </div>
        `}function V(t,a,i){var m,y;const n=N(),u=(m=n==null?void 0:n[t])==null?void 0:m[a],r=j[i]||j.passEdges,c=Array.isArray((y=u==null?void 0:u.focusTargets)==null?void 0:y[i])?u.focusTargets[i]:[],l=`${t} / ${a} · ${r.title}`,e=c.length?`
            <div style="text-align:left;">
                <div style="margin-bottom:10px; color:#64748b; font-size:13px;">共 ${c.length} 人。点击姓名可跳转到学生成绩单，便于继续查看个人成绩、排名和家校材料。</div>
                <div class="table-wrap analysis-table-shell" style="max-height:55vh; overflow:auto;">
                    <table class="analysis-generated-table" style="width:100%; font-size:13px;">
                        <thead><tr><th>班级</th><th>姓名</th><th>当前分</th><th>差距</th><th>操作</th></tr></thead>
                        <tbody>
                            ${c.map(g=>{const v=Number.isFinite(g.gap)?Math.abs(g.gap).toFixed(1):"-",d=g.school||window.MY_SCHOOL||"";return`
                                    <tr>
                                        <td>${o(g.className||"-")}</td>
                                        <td><strong>${o(g.name||"-")}</strong></td>
                                        <td>${Number.isFinite(g.score)?o(g.score):"-"}</td>
                                        <td>${v}</td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-blue"
                                                onclick="window.openStudentSubjectDialog ? window.openStudentSubjectDialog(${T(g.name)}, ${T(d)}, ${T(g.className)}, ${T(a)}, { focusLabel: ${T(r.title)}, gap: ${Number.isFinite(g.gap)?Number(g.gap):"null"} }) : (window.jumpToStudent && window.jumpToStudent(${T(g.name)}, ${T(d)}, ${T(g.className)}))">
                                                查看${o(a)}情况
                                            </button>
                                        </td>
                                    </tr>
                                `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `:`<div style="padding:24px; color:#64748b;">${o(r.empty)}</div>`;window.Swal&&typeof window.Swal.fire=="function"?window.Swal.fire({title:o(l),html:e,width:760,confirmButtonText:"关闭",confirmButtonColor:r.color}):window.UI.alert(`${l}
${c.map(g=>{var v;return`${g.className||"-"} ${g.name||"-"} ${(v=g.score)!=null?v:"-"}`}).join(`
`)||r.empty}`)}function ee(t){t&&V(t.dataset.teacher||"",t.dataset.subject||"",t.dataset.focusType||"passEdges")}function D(){const t=document.getElementById("teacherComparisonTable"),a=N();if(!t)return;if(!Object.keys(a).length){t.innerHTML=`
                <tbody>
                    <tr>
                        <td colspan="14">
                            <div class="analysis-empty-state">暂无教师统计数据</div>
                        </td>
                    </tr>
                </tbody>
            `;return}const i=B(a,["comparison",window.innerWidth<=860?"mobile":"desktop"].join("|"));if(C.comparisonSignature===i&&C.comparisonHtml){t.dataset.teacherComparisonSignature!==i&&(t.classList.add("comparison-table"),t.innerHTML=C.comparisonHtml,t.dataset.teacherComparisonSignature=i,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(t.closest(".section")||t));return}const n={};Object.keys(a).forEach(c=>{Object.keys(a[c]||{}).forEach(l=>{n[l]||(n[l]=[]),n[l].push({teacher:c,data:a[c][l]})})});let r=`
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
        `;Object.keys(n).sort(_).forEach(c=>{r+=`<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${o(c)}</td></tr>`,n[c].sort((l,e)=>s(e.data.fairScore,0)-s(l.data.fairScore,0)).forEach(l=>{var h;const e=l.data,m=s(e.baselineAdjustment,0)>=0?"text-green":"text-red",y=s(e.lowRate,0)>=.12?"color:#dc2626; font-weight:700;":"color:#334155;",g=e.sampleWarning?"color:#b45309; font-weight:700;":"color:#334155;",v=`基线覆盖 ${e.baselineCoverageText||"0%"}；预计均分 ${s(e.expectedAvg,0).toFixed(2)}；预计优率 ${$(e.expectedExcellentRate,1)}；预计及格率 ${$(e.expectedPassRate,1)}；预计低分率 ${$(e.expectedLowRate,1)}；任课连续性 ${e.teacherContinuityText||"任课连续"}${e.baselineExamId?`；基线 ${e.baselineExamId}`:""}`,d=(e.previousSampleCount||0)>0?`新增 ${e.addedSampleCount||0} / 缺考退出 ${e.exitedSampleCount||0}`:"暂无基线",p=`${s(e.conversionScore,50).toFixed(1)}${s(e.conversionAdjustment,0)?` (${R(e.conversionAdjustment,1)})`:""}`;r+=`
                        <tr>
                            <td><strong>${o(l.teacher)}</strong></td>
                            <td>${o(e.classesText||e.classes||"-")}</td>
                            <td>${o(e.studentCount)}</td>
                            <td title="${o(e.sampleDetailText||"")}" style="${g}">
                                <div>${o((e.previousSampleCount||0)>0?e.commonSampleCount||0:"—")}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${o((e.previousSampleCount||0)>0?e.sampleStabilityText||"0%":"待历史样本")}</div>
                            </td>
                            <td title="${o(e.sampleDetailText||"")}" style="${g}">
                                <div>${o(d)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${o(e.previousSampleCount||0)}</div>
                            </td>
                            <td style="font-weight:700;">${o(e.avg)}</td>
                            <td title="${o(`均分赋分 ${s(e.ratedAvg,0).toFixed(1)}，优率赋分 ${s(e.ratedExc,0).toFixed(1)}，及格赋分 ${s(e.ratedPass,0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${s(e.leagueScoreRaw,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${s(e.leagueScore,0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${m}" title="${o(v)}" style="font-weight:700;">
                                <div>${R(e.baselineAdjustment,1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${o(e.baselineCoverageText||"0%")}</div>
                            </td>
                            <td>${$(e.excellentRate,1)}</td>
                            <td>${$(e.passRate,1)}</td>
                            <td style="${y}">${$(e.lowRate,1)}</td>
                            <td title="${o(`${e.conversionSummary||"暂无转化样本"}；${((h=e.conversionMetrics)==null?void 0:h.detail)||""}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${p}</div>
                                <div style="font-size:11px; color:#64748b;">${o(e.conversionSummary||"暂无转化")}</div>
                            </td>
                            <td style="font-size:12px;">${U(l.teacher,c,e)}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${s(e.fairScore,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${o(e.fairRank||"-")} 名</div>
                            </td>
                        </tr>
                    `})}),r+="</tbody>",C.comparisonSignature=i,C.comparisonHtml=r,t.dataset.teacherComparisonSignature=i,t.classList.add("comparison-table"),t.innerHTML=r,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(t.closest(".section")||t)}function W(){return typeof window.ensureLazySectionLoaded=="function"&&window.ensureLazySectionLoaded("teacherModal"),document.getElementById("teacherModal")}function q(){if(window.__TEACHER_ANALYSIS_MODAL_BOUND__)return!0;const t=W(),a=document.getElementById("closeModal");return!t||!a?!1:(a.addEventListener("click",()=>{const i=document.getElementById("teacherModal");i&&(i.style.display="none")}),window.addEventListener("click",i=>{const n=document.getElementById("teacherModal");n&&i.target===n&&(n.style.display="none")}),window.__TEACHER_ANALYSIS_MODAL_BOUND__=!0,!0)}function G(t,a){var k,S,f,F;const i=N(),n=i[t]?i[t][a]:null;if(!n){window.UI&&window.UI.toast("当前筛选范围下暂无该教师该学科数据","warning");return}q();const u=W(),r=document.getElementById("modalSubjectTable"),c=document.getElementById("modalAvgProgress");if(!u||!r||!c)return;const l=document.getElementById("modalTeacherName"),e=document.getElementById("modalAvgScore"),m=document.getElementById("modalExcellentRate"),y=document.getElementById("modalPassRate"),g=document.getElementById("modalAvgComparison");l&&(l.textContent=`${t} - ${a} 教学详情`),e&&(e.textContent=n.avg),m&&(m.textContent=$(n.excellentRate,1)),y&&(y.textContent=$(n.passRate,1));const v=s(n.expectedAvg,NaN),d=s(n.avgValue,NaN),p=Number.isFinite(v)&&v>0&&Number.isFinite(d),h=p?(d-v)/v*100:null;g&&(g.textContent=p?`${h>=0?"+":""}${h.toFixed(1)}%`:"—");const x=p?Math.min(Math.max(50+h,0),100):50;c.style.width=`${x}%`,c.className=p?h>=0?"progress-good":"progress-poor":"progress-neutral",c.style.backgroundColor=p?h>=0?"#22c55e":"#ef4444":"#94a3b8";const w=r.querySelector("thead"),b=r.querySelector("tbody");w&&(w.innerHTML=`
                <tr>
                    <th>学科</th>
                    <th>实际均分</th>
                    <th>预计均分</th>
                    <th>优秀率(实/预)</th>
                    <th>及格率(实/预)</th>
                    <th>低分率(实/预)</th>
                    <th>基线校正</th>
                </tr>
            `),b&&(b.innerHTML=`
                <tr>
                    <td>${o(a)}</td>
                    <td>${s(n.avgValue,0).toFixed(2)}</td>
                    <td>${s(n.expectedAvg,0).toFixed(2)}</td>
                    <td>${$(n.excellentRate,1)} / ${$(n.expectedExcellentRate,1)}</td>
                    <td>${$(n.passRate,1)} / ${$(n.expectedPassRate,1)}</td>
                    <td>${$(n.lowRate,1)} / ${$(n.expectedLowRate,1)}</td>
                    <td class="${s(n.baselineAdjustment,0)>=0?"positive-percent":"negative-percent"}">${R(n.baselineAdjustment,1)}</td>
                </tr>
            `);let E=document.getElementById("teacherModalExtra");!E&&r.parentNode&&(E=document.createElement("div"),E.id="teacherModalExtra",E.style.marginBottom="16px",r.parentNode.insertBefore(E,r)),E&&(E.innerHTML=`
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">联考赋分</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${s(n.leagueScoreRaw,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">折算 ${s(n.leagueScore,0).toFixed(1)} / 100</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">基线校正</div>
                        <div style="font-size:22px; font-weight:800; color:${s(n.baselineAdjustment,0)>=0?"#15803d":"#dc2626"};">${R(n.baselineAdjustment,1)}</div>
                        <div style="font-size:12px; color:#64748b;">覆盖 ${o(n.baselineCoverageText||"0%")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">教学质量分</div>
                        <div style="font-size:22px; font-weight:800; color:#b45309;">${s(n.fairScore,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">同科第 ${o(n.fairRank||"-")} 名</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">置信 / 工作量</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${s(n.confidenceFactor,1).toFixed(2)}</div>
                        <div style="font-size:12px; color:#64748b;">工作量修正 ${R(n.workloadAdjustment,1)}</div>
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
                        <div style="font-size:22px; font-weight:800; color:#0369a1;">${s(n.conversionScore,50).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">${o(n.conversionSummary||"暂无转化样本")}${s(n.conversionAdjustment,0)?` · 调整 ${R(n.conversionAdjustment,1)}`:""}</div>
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
                            <button type="button" onclick="window.showTeacherFocusTargets(${T(t)}, ${T(a)}, 'excellentEdges')" style="font-size:12px; color:#0f766e; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">培优边缘生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(A((k=n.focusTargets)==null?void 0:k.excellentEdges,"暂无培优边缘生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${T(t)}, ${T(a)}, 'passEdges')" style="font-size:12px; color:#1d4ed8; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">及格临界生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(A((S=n.focusTargets)==null?void 0:S.passEdges,"暂无及格临界生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${T(t)}, ${T(a)}, 'lowRisk')" style="font-size:12px; color:#b45309; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">辅差关注生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(A((f=n.focusTargets)==null?void 0:f.lowRisk,"暂无辅差关注生"))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${o(n.sampleDetailText||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${o(((F=n.conversionMetrics)==null?void 0:F.detail)||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${o(n.baselineExamId?`历史基线：${n.baselineExamId}`:"未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。")}</div>
                </div>
            `),u.style.display="flex"}function X(){const t=z(),a=(t==null?void 0:t.role)||"guest",i=a==="teacher"||a==="class_teacher"?N():window.TEACHER_STATS||{};if(!Object.keys(i).length){window.UI.alert("请先进行教师分析");return}const n=new Set;Object.values(i).forEach(e=>Object.keys(e||{}).forEach(m=>n.add(m)));const u=window.XLSX.utils.book_new(),r=M(),c={};Object.keys(i).forEach(e=>{Object.keys(i[e]||{}).forEach(m=>{c[m]||(c[m]=[]),c[m].push({teacherName:e,data:i[e][m]})})}),Object.keys(c).sort(_).forEach(e=>{const m=c[e].sort((v,d)=>s(d.data.fairScore,0)-s(v.data.fairScore,0)),y=[["教师姓名","学科","任教班级","人数","均分",`联考赋分(${r.total})`,"联考赋分(折算100)","基线校正","基线覆盖","上次样本","共同样本","新增样本","缺考/退出","样本稳定度","任课连续性","转化分","转化调整","预计均分","优秀率","预计优秀率","及格率","预计及格率","低分率","预计低分率","工作量修正","置信系数","教学质量分","同科排名","培优边缘生","及格临界生","辅差关注生"]];m.forEach(({teacherName:v,data:d})=>{var p,h,x;y.push([v,e,d.classesText||d.classes||"",d.studentCount,window.getExcelNum(s(d.avgValue,0)),window.getExcelNum(s(d.leagueScoreRaw,0)),window.getExcelNum(s(d.leagueScore,0)),window.getExcelNum(s(d.baselineAdjustment,0)),d.baselineCoverageText||"0%",d.previousSampleCount||0,d.commonSampleCount||0,d.addedSampleCount||0,d.exitedSampleCount||0,d.sampleStabilityText||"0%",d.teacherContinuityText||"",window.getExcelNum(s(d.conversionScore,50)),window.getExcelNum(s(d.conversionAdjustment,0)),window.getExcelNum(s(d.expectedAvg,0)),window.getExcelPercent(s(d.excellentRate,0)),window.getExcelPercent(s(d.expectedExcellentRate,0)),window.getExcelPercent(s(d.passRate,0)),window.getExcelPercent(s(d.expectedPassRate,0)),window.getExcelPercent(s(d.lowRate,0)),window.getExcelPercent(s(d.expectedLowRate,0)),window.getExcelNum(s(d.workloadAdjustment,0)),window.getExcelNum(s(d.confidenceFactor,1)),window.getExcelNum(s(d.fairScore,0)),d.fairRank||"",A((p=d.focusTargets)==null?void 0:p.excellentEdges,""),A((h=d.focusTargets)==null?void 0:h.passEdges,""),A((x=d.focusTargets)==null?void 0:x.lowRisk,"")])});const g=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName(e,"教学质量"):String(e||"Sheet").slice(0,31);window.XLSX.utils.book_append_sheet(u,window.XLSX.utils.aoa_to_sheet(y),g)});const l=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,n):new Date().toISOString().slice(0,10);window.XLSX.writeFile(u,`教师教学质量明细_${l}.xlsx`)}q(),Object.assign(window,{renderTeacherTownshipRanking:Z,teacherBuildCardList:O,teacherFormatFocusList:A,renderTeacherCards:P,renderTeacherCardsV2:P,calculatePerformanceLevel:L,calculatePerformanceLevelV2:L,renderTeacherComparisonTable:D,renderTeacherComparisonTableV2:D,renderTeacherFocusSummaryCell:U,showTeacherFocusTargets:V,showTeacherFocusTargetsFromButton:ee,showTeacherDetails:G,showTeacherDetailsV2:G,exportTeacherComparisonExcel:X,exportTeacherComparisonExcelV2:X}),window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__=!0})();
