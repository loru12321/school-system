(()=>{if(typeof window=="undefined"||window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__)return;const a=typeof window.teacherToNumber=="function"?window.teacherToNumber:((t,s=0)=>{const i=Number(t);return Number.isFinite(i)?i:s}),$=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((t,s=1)=>`${(a(t,0)*100).toFixed(s)}%`),k=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((t,s=1)=>{const i=a(t,0);return`${i>=0?"+":""}${i.toFixed(s)}`}),o=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(t=>String(t!=null?t:"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s])),M=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>({avg:60,exc:70,pass:70,total:200})),j=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var t;return((t=window.Auth)==null?void 0:t.currentUser)||null}),P=typeof window.normalizeSubject=="function"?window.normalizeSubject:(t=>String(t||"").trim()),z=typeof window.sortSubjects=="function"?window.sortSubjects:((t,s)=>String(t||"").localeCompare(String(s||""),"zh-Hans-CN")),I=typeof window.formatRankDisplay=="function"?window.formatRankDisplay:((t,s,i="school",n=!1)=>`${n?`${(a(t,0)*100).toFixed(2)}%`:a(t,0).toFixed(2)} <span style="font-size:0.9em; color:#94a3b8">(${s})</span>`),C={cardsSignature:"",cardsHtml:"",comparisonSignature:"",comparisonHtml:""};function Z(){var n;const t=window.Grade9PoliticsReferenceRuntime,s=typeof window.getTeacherAnalysisDisplaySubjects=="function"?window.getTeacherAnalysisDisplaySubjects():[],i=(n=t==null?void 0:t.getSummary)==null?void 0:n.call(t);!t||typeof t.ensureSummary!="function"||!s.some(l=>P(l)==="政治")||Array.isArray(i==null?void 0:i.referenceSchools)&&i.referenceSchools.length||window.__TEACHER_POLITICS_REFERENCE_PROMISE__||(window.__TEACHER_POLITICS_REFERENCE_PROMISE__=Promise.resolve(t.ensureSummary()).then(l=>{var c;if(!Array.isArray(l==null?void 0:l.referenceSchools)||!l.referenceSchools.length)return;typeof window.calculateTeacherTownshipRanking=="function"&&window.calculateTeacherTownshipRanking({force:!0,teacherMetricScope:"admin"});const r=document.getElementById("teacher-township-ranking");(c=r==null?void 0:r.classList)!=null&&c.contains("active")&&V()}).catch(l=>console.warn("[teacher-township] 政治整理表学校参考读取失败:",(l==null?void 0:l.message)||l)).finally(()=>{window.__TEACHER_POLITICS_REFERENCE_PROMISE__=null}))}function O(t,s=""){const i=[String(s||"")];return Object.keys(t||{}).sort().forEach(n=>{i.push(`T:${n}`),Object.keys(t[n]||{}).sort(z).forEach(l=>{const r=t[n][l]||{};i.push([l,r.classesText||r.classes||"",r.studentCount,r.avg,r.avgValue,r.fairScore,r.fairRank,r.leagueScoreRaw,r.leagueScore,r.baselineAdjustment,r.baselineCoverageText,r.excellentRate,r.passRate,r.lowRate,r.conversionScore,r.conversionAdjustment,r.focusSummary,r.sampleStabilityText,r.teacherContinuityText].join("|"))})}),i.join("::")}function N(){return typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats():window.TEACHER_STATS||{}}function ee(t){return typeof window.getVisibleSubjectsForTeacherUser=="function"?window.getVisibleSubjectsForTeacherUser(t):null}function L(t){const s=a(t==null?void 0:t.fairScore,(t==null?void 0:t.finalScore)||0),i=a(t==null?void 0:t.baselineAdjustment,0);return s>=85&&i>=0?{class:"performance-excellent",text:"优秀"}:s>=75?{class:"performance-good",text:"良好"}:s>=65?{class:"performance-average",text:"稳健"}:{class:"performance-poor",text:"待改进"}}function B(t,s,i="",n="guest"){const l=[];Object.keys(t||{}).forEach(c=>{Object.keys(t[c]||{}).forEach(d=>{var f,v;const e=t[c][d],w=L(e),y=((v=(f=s==null?void 0:s[c])==null?void 0:f[d])==null?void 0:v.rank)||"-";l.push({id:`${c}-${d}`,name:c,subject:d,classes:e.classesText||e.classes||"",avg:e.avg,fairScore:a(e.fairScore,0).toFixed(1),leagueScoreRaw:a(e.leagueScoreRaw,0).toFixed(1),leagueScore:a(e.leagueScore,0).toFixed(1),baselineAdjustment:k(e.baselineAdjustment,1),baselineCoverage:e.baselineCoverageText||"0%",sampleSummary:e.sampleSummary||"共同样本待识别",sampleStability:e.sampleStabilityText||"0%",conversionSummary:e.conversionSummary||"暂无转化样本",conversionScore:a(e.conversionScore,50).toFixed(1),excRate:$(e.excellentRate,1),passRate:$(e.passRate,1),lowRate:$(e.lowRate,1),focusSummary:e.focusSummary||"培优0 / 临界0 / 辅差0",count:e.studentCount,rank:y,badgeClass:w.class,badgeText:w.text})})});const r=String(i||"").replace(/\s+/g,"").toLowerCase();return l.sort((c,d)=>{if((n==="teacher"||n==="class_teacher")&&r){const y=String(c.name||"").replace(/\s+/g,"").toLowerCase(),f=String(d.name||"").replace(/\s+/g,"").toLowerCase(),v=y===r||y.startsWith(`${r}(`)||y.startsWith(`${r}（`),p=f===r||f.startsWith(`${r}(`)||f.startsWith(`${r}（`);if(v!==p)return v?-1:1}const e=a(d.fairScore,0)-a(c.fairScore,0);if(e!==0)return e;const w=a(d.leagueScore,0)-a(c.leagueScore,0);return w!==0?w:String(c.name||"").localeCompare(String(d.name||""),"zh-Hans-CN")}),l}function U(){const t=document.getElementById("teacherCardsContainer"),s=j(),i=(s==null?void 0:s.role)||"guest",n=N(),l=window.TEACHER_TOWNSHIP_RANKINGS||{},r=B(n,l,(s==null?void 0:s.name)||"",i);try{if(window.Alpine&&typeof window.Alpine.store=="function"){const e=window.Alpine.store("teacherData");e&&(e.list=r)}}catch(e){console.warn("teacherData store update skipped:",e)}if(!t)return;if(!r.length){t.innerHTML=`
                <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">
                    暂无教师数据，请先完成任课表同步和成绩导入。
                    <div style="margin-top:10px;">
                        <button class="btn btn-orange" onclick="openTeacherSync()">去同步任课表</button>
                    </div>
                </div>
            `;return}const c=O(n,[i,(s==null?void 0:s.name)||"",Object.keys(l||{}).sort().join("|")].join("|"));if(C.cardsSignature===c&&C.cardsHtml){(t.dataset.teacherCardsSignature!==c||!t.querySelector(".teacher-card"))&&(t.innerHTML=C.cardsHtml,t.dataset.teacherCardsSignature=c);return}const d=r.map(e=>`
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
        `).join("");C.cardsSignature=c,C.cardsHtml=d,t.dataset.teacherCardsSignature=c,t.innerHTML=d;try{typeof window.renderTeacherHighlights=="function"&&window.renderTeacherHighlights()}catch(e){console.warn("[teacher-cards] 本次要点渲染失败（不影响卡片）:",e)}}function V(){const t=j(),s=(t==null?void 0:t.role)||"guest",i=s==="teacher"||s==="class_teacher"?ee(t):null,n=document.getElementById("teacher-township-ranking-container"),l=document.getElementById("side-nav-teacher-ranks-container");if(l&&(l.innerHTML=""),!n)return;if(Z(),typeof window.calculateTeacherTownshipRanking=="function"&&window.calculateTeacherTownshipRanking({teacherMetricScope:"admin"}),!window.TOWNSHIP_RANKING_DATA||!Object.keys(window.TOWNSHIP_RANKING_DATA).length){n.innerHTML='<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';return}const r=window.TEACHER_TOWNSHIP_AVERAGES||{},c=u=>{const h=(u||[]).filter(S=>S.type==="school"&&a(S.studentCount,0)>0),x=h.length?h:(u||[]).filter(S=>a(S.studentCount,0)>0);let m=0,b=0,E=0,R=0;return x.forEach(S=>{const g=a(S.studentCount,0);g<=0||(m+=g,b+=a(S.avg,0)*g,E+=a(S.excellentRate,0)*g,R+=a(S.passRate,0)*g)}),m<=0?null:{avg:b/m,excRate:E/m,passRate:R/m,count:m,source:h.length?"ranking-schools":"ranking-rows"}},d=(u,h)=>{const x=a(u,NaN),m=a(h,NaN);if(!Number.isFinite(x)||!Number.isFinite(m)||Math.abs(m)<1e-9)return{text:"—",value:null};const b=(x-m)/m*100;return{text:`${b>=0?"+":""}${b.toFixed(2)}%`,value:b}},e=u=>!u||u.value===null?"rank-muted":u.value>=0?"positive-percent":"negative-percent",w=[],y=(u,h)=>{const x=(h||[]).filter(m=>m.type==="teacher").slice().sort((m,b)=>a(m.rankAvg,99999)-a(b.rankAvg,99999)).slice(0,8);return x.length?`
                <div class="teacher-township-quick-view" aria-label="${o(u)}教师排名速览">
                    ${x.map(m=>`
                        <div class="teacher-township-quick-card">
                            <strong>${o(m.name)}</strong>
                            <span>均分镇排 ${o(m.rankAvg)}</span>
                            <span>优秀率 ${o(m.rankExc)}</span>
                            <span>及格率 ${o(m.rankPass)}</span>
                        </div>
                    `).join("")}
                </div>
            `:""},f=typeof window.getTeacherAnalysisDisplaySubjects=="function"?window.getTeacherAnalysisDisplaySubjects():window.SUBJECTS||[];let v="";if(f.forEach(u=>{var S;if(i&&i.size>0&&!i.has(P(u)))return;const h=(S=window.TOWNSHIP_RANKING_DATA)==null?void 0:S[u];if(!(h!=null&&h.length))return;const x=typeof window.getConfiguredDisplaySubjectLabel=="function"?window.getConfiguredDisplaySubjectLabel(u):u,m=typeof window.getConfiguredDisplaySubjectNotice=="function"?window.getConfiguredDisplaySubjectNotice(u):"",b=r[u]||c(h);let E="";h.forEach(g=>{const _=d(g.avg,b==null?void 0:b.avg),K=d(g.excellentRate,b==null?void 0:b.excRate),Q=d(g.passRate,b==null?void 0:b.passRate),ne=g.type==="teacher"?"text-blue":"",oe=g.type==="teacher"?"analysis-row-emphasis":"",se=g.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school",ae=g.type==="teacher"?"教师":"学校";E+=`
                    <tr class="${oe}">
                        <td data-label="教师/学校" class="${ne}">${o(g.name)}</td>
                        <td data-label="类型"><span class="${se}">${ae}</span></td>
                        <td data-label="平均分">${I(g.avg,g.rankAvg,"teacher")}</td>
                        <td data-label="与镇均比" class="${e(_)}">${o(_.text)}</td>
                        <td data-label="镇排"><span class="teacher-rank-badge" aria-label="均分镇排 ${o(g.rankAvg)}">${o(g.rankAvg)}</span></td>
                        <td data-label="优秀率">${I(g.excellentRate,g.rankExc,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${e(K)}">${o(K.text)}</td>
                        <td data-label="镇排"><span class="teacher-rank-badge" aria-label="优秀率镇排 ${o(g.rankExc)}">${o(g.rankExc)}</span></td>
                        <td data-label="及格率">${I(g.passRate,g.rankPass,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${e(Q)}">${o(Q.text)}</td>
                        <td data-label="镇排"><span class="teacher-rank-badge" aria-label="及格率镇排 ${o(g.rankPass)}">${o(g.rankPass)}</span></td>
                    </tr>
                `});const R=`rank-anchor-${u}`;if(w.push({subject:u,anchorId:R,count:h.length}),v+=`
                <div id="${R}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span title="${o(m)}">${o(x)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${o(h.length)} 条</span>
                            <span class="analysis-table-tag">含外校整体数据</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">${o(m||"教师与学校数据同表展示，便于对照镇均水平、乡镇排名和学科整体波动。")}</div>
                    ${y(u,h)}
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
            `,l){const g=document.createElement("a");g.className="side-nav-sub-link",g.innerText=x,g.onclick=()=>{typeof window.scrollToSubAnchor=="function"&&window.scrollToSubAnchor(R,g)},l.appendChild(g)}}),!v){n.innerHTML='<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';return}const p=w.length?`<div class="teacher-township-jumpbar analysis-generated-panel">
                    <div>
                        <strong>教师乡镇排名快速查看</strong>
                        <span>点击学科直接定位，无需逐屏查找。</span>
                    </div>
                    <div class="teacher-township-jumpbar-links">
                        ${w.map(u=>`<button type="button" data-rank-anchor="${o(u.anchorId)}">${o(u.subject)}<em>${o(u.count)}</em></button>`).join("")}
                    </div>
                </div>`:"";n.innerHTML=p+v,n.querySelectorAll("[data-rank-anchor]").forEach(u=>{u.addEventListener("click",()=>{var x;const h=u.getAttribute("data-rank-anchor");if(typeof window.scrollToSubAnchor=="function"){window.scrollToSubAnchor(h,u);return}(x=document.getElementById(h))==null||x.scrollIntoView({behavior:"smooth",block:"start"})})})}function A(t,s="暂无"){const i=(t||[]).slice(0,8);return i.length?i.map(n=>`${n.name}${n.className?`(${n.className})`:""}${Number.isFinite(n.score)?` ${n.score}`:""}`).join("、"):s}const F={excellentEdges:{label:"培优",title:"培优边缘生",color:"#0f766e",empty:"暂无培优边缘生"},passEdges:{label:"临界",title:"及格临界生",color:"#1d4ed8",empty:"暂无及格临界生"},lowRisk:{label:"辅差",title:"辅差关注生",color:"#b45309",empty:"暂无辅差关注生"}};function T(t){return o(JSON.stringify(String(t||"")))}function H(t,s,i,n){var c;const l=F[i]||F.passEdges,r=((c=n==null?void 0:n.focusTargets)==null?void 0:c[i])||[];return`
            <button
                type="button"
                class="teacher-focus-chip"
                data-teacher="${o(t)}"
                data-subject="${o(s)}"
                data-focus-type="${o(i)}"
                onclick="window.showTeacherFocusTargetsFromButton && window.showTeacherFocusTargetsFromButton(this)"
                title="点击查看${o(l.title)}名单和班级"
                style="border:1px solid ${l.color}; color:${l.color}; background:#fff; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:800; cursor:pointer; margin:2px;"
            >${o(l.label)} ${r.length}</button>
        `}function D(t,s,i){var l,r,c;const n=[`培优: ${(((l=i.focusTargets)==null?void 0:l.excellentEdges)||[]).slice(0,6).map(d=>`${d.name}(${d.className||"-"}/${d.score})`).join("、")||"暂无"}`,`临界: ${(((r=i.focusTargets)==null?void 0:r.passEdges)||[]).slice(0,6).map(d=>`${d.name}(${d.className||"-"}/${d.score})`).join("、")||"暂无"}`,`辅差: ${(((c=i.focusTargets)==null?void 0:c.lowRisk)||[]).slice(0,6).map(d=>`${d.name}(${d.className||"-"}/${d.score})`).join("、")||"暂无"}`].join(" | ");return`
            <div title="${o(n)}" style="display:flex; align-items:center; justify-content:center; gap:3px; flex-wrap:wrap;">
                ${H(t,s,"excellentEdges",i)}
                ${H(t,s,"passEdges",i)}
                ${H(t,s,"lowRisk",i)}
            </div>
        `}function W(t,s,i){var w,y;const n=N(),l=(w=n==null?void 0:n[t])==null?void 0:w[s],r=F[i]||F.passEdges,c=Array.isArray((y=l==null?void 0:l.focusTargets)==null?void 0:y[i])?l.focusTargets[i]:[],d=`${t} / ${s} · ${r.title}`,e=c.length?`
            <div style="text-align:left;">
                <div style="margin-bottom:10px; color:#64748b; font-size:13px;">共 ${c.length} 人。点击姓名可跳转到学生成绩单，便于继续查看个人成绩、排名和家校材料。</div>
                <div class="table-wrap analysis-table-shell" style="max-height:55vh; overflow:auto;">
                    <table class="analysis-generated-table" style="width:100%; font-size:13px;">
                        <thead><tr><th>班级</th><th>姓名</th><th>当前分</th><th>差距</th><th>操作</th></tr></thead>
                        <tbody>
                            ${c.map(f=>{const v=Number.isFinite(f.gap)?Math.abs(f.gap).toFixed(1):"-",p=f.school||window.MY_SCHOOL||"";return`
                                    <tr>
                                        <td>${o(f.className||"-")}</td>
                                        <td><strong>${o(f.name||"-")}</strong></td>
                                        <td>${Number.isFinite(f.score)?o(f.score):"-"}</td>
                                        <td>${v}</td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-blue"
                                                onclick="window.openStudentSubjectDialog ? window.openStudentSubjectDialog(${T(f.name)}, ${T(p)}, ${T(f.className)}, ${T(s)}, { focusLabel: ${T(r.title)}, gap: ${Number.isFinite(f.gap)?Number(f.gap):"null"} }) : (window.jumpToStudent && window.jumpToStudent(${T(f.name)}, ${T(p)}, ${T(f.className)}))">
                                                查看${o(s)}情况
                                            </button>
                                        </td>
                                    </tr>
                                `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `:`<div style="padding:24px; color:#64748b;">${o(r.empty)}</div>`;window.Swal&&typeof window.Swal.fire=="function"?window.Swal.fire({title:o(d),html:e,width:760,confirmButtonText:"关闭",confirmButtonColor:r.color}):window.UI.alert(`${d}
${c.map(f=>{var v;return`${f.className||"-"} ${f.name||"-"} ${(v=f.score)!=null?v:"-"}`}).join(`
`)||r.empty}`)}function te(t){t&&W(t.dataset.teacher||"",t.dataset.subject||"",t.dataset.focusType||"passEdges")}function G(){const t=document.getElementById("teacherComparisonTable"),s=N();if(!t)return;if(!Object.keys(s).length){t.innerHTML=`
                <tbody>
                    <tr>
                        <td colspan="14">
                            <div class="analysis-empty-state">暂无教师统计数据</div>
                        </td>
                    </tr>
                </tbody>
            `;return}const i=O(s,["comparison",window.innerWidth<=860?"mobile":"desktop"].join("|"));if(C.comparisonSignature===i&&C.comparisonHtml){t.dataset.teacherComparisonSignature!==i&&(t.classList.add("comparison-table"),t.innerHTML=C.comparisonHtml,t.dataset.teacherComparisonSignature=i,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(t.closest(".section")||t));return}const n={};Object.keys(s).forEach(c=>{Object.keys(s[c]||{}).forEach(d=>{n[d]||(n[d]=[]),n[d].push({teacher:c,data:s[c][d]})})});let r=`
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
        `;Object.keys(n).sort(z).forEach(c=>{r+=`<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${o(c)}</td></tr>`,n[c].sort((d,e)=>a(e.data.fairScore,0)-a(d.data.fairScore,0)).forEach(d=>{var h;const e=d.data,w=a(e.baselineAdjustment,0)>=0?"text-green":"text-red",y=a(e.lowRate,0)>=.12?"color:#dc2626; font-weight:700;":"color:#334155;",f=e.sampleWarning?"color:#b45309; font-weight:700;":"color:#334155;",v=`基线覆盖 ${e.baselineCoverageText||"0%"}；预计均分 ${a(e.expectedAvg,0).toFixed(2)}；预计优率 ${$(e.expectedExcellentRate,1)}；预计及格率 ${$(e.expectedPassRate,1)}；预计低分率 ${$(e.expectedLowRate,1)}；任课连续性 ${e.teacherContinuityText||"任课连续"}${e.baselineExamId?`；基线 ${e.baselineExamId}`:""}`,p=(e.previousSampleCount||0)>0?`新增 ${e.addedSampleCount||0} / 缺考退出 ${e.exitedSampleCount||0}`:"暂无基线",u=`${a(e.conversionScore,50).toFixed(1)}${a(e.conversionAdjustment,0)?` (${k(e.conversionAdjustment,1)})`:""}`;r+=`
                        <tr>
                            <td><strong>${o(d.teacher)}</strong></td>
                            <td>${o(e.classesText||e.classes||"-")}</td>
                            <td>${o(e.studentCount)}</td>
                            <td title="${o(e.sampleDetailText||"")}" style="${f}">
                                <div>${o((e.previousSampleCount||0)>0?e.commonSampleCount||0:"—")}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${o((e.previousSampleCount||0)>0?e.sampleStabilityText||"0%":"待历史样本")}</div>
                            </td>
                            <td title="${o(e.sampleDetailText||"")}" style="${f}">
                                <div>${o(p)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${o(e.previousSampleCount||0)}</div>
                            </td>
                            <td style="font-weight:700;">${o(e.avg)}</td>
                            <td title="${o(`均分赋分 ${a(e.ratedAvg,0).toFixed(1)}，优率赋分 ${a(e.ratedExc,0).toFixed(1)}，及格赋分 ${a(e.ratedPass,0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${a(e.leagueScoreRaw,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${a(e.leagueScore,0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${w}" title="${o(v)}" style="font-weight:700;">
                                <div>${k(e.baselineAdjustment,1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${o(e.baselineCoverageText||"0%")}</div>
                            </td>
                            <td>${$(e.excellentRate,1)}</td>
                            <td>${$(e.passRate,1)}</td>
                            <td style="${y}">${$(e.lowRate,1)}</td>
                            <td title="${o(`${e.conversionSummary||"暂无转化样本"}；${((h=e.conversionMetrics)==null?void 0:h.detail)||""}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${u}</div>
                                <div style="font-size:11px; color:#64748b;">${o(e.conversionSummary||"暂无转化")}</div>
                            </td>
                            <td style="font-size:12px;">${D(d.teacher,c,e)}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${a(e.fairScore,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${o(e.fairRank||"-")} 名</div>
                            </td>
                        </tr>
                    `})}),r+="</tbody>",C.comparisonSignature=i,C.comparisonHtml=r,t.dataset.teacherComparisonSignature=i,t.classList.add("comparison-table"),t.innerHTML=r,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(t.closest(".section")||t)}function q(){return typeof window.ensureLazySectionLoaded=="function"&&window.ensureLazySectionLoaded("teacherModal"),document.getElementById("teacherModal")}function X(){if(window.__TEACHER_ANALYSIS_MODAL_BOUND__)return!0;const t=q(),s=document.getElementById("closeModal");return!t||!s?!1:(s.addEventListener("click",()=>{const i=document.getElementById("teacherModal");i&&(i.style.display="none")}),window.addEventListener("click",i=>{const n=document.getElementById("teacherModal");n&&i.target===n&&(n.style.display="none")}),window.__TEACHER_ANALYSIS_MODAL_BOUND__=!0,!0)}function J(t,s){var R,S,g,_;const i=N(),n=i[t]?i[t][s]:null;if(!n){window.UI&&window.UI.toast("当前筛选范围下暂无该教师该学科数据","warning");return}X();const l=q(),r=document.getElementById("modalSubjectTable"),c=document.getElementById("modalAvgProgress");if(!l||!r||!c)return;const d=document.getElementById("modalTeacherName"),e=document.getElementById("modalAvgScore"),w=document.getElementById("modalExcellentRate"),y=document.getElementById("modalPassRate"),f=document.getElementById("modalAvgComparison");d&&(d.textContent=`${t} - ${s} 教学详情`),e&&(e.textContent=n.avg),w&&(w.textContent=$(n.excellentRate,1)),y&&(y.textContent=$(n.passRate,1));const v=a(n.expectedAvg,NaN),p=a(n.avgValue,NaN),u=Number.isFinite(v)&&v>0&&Number.isFinite(p),h=u?(p-v)/v*100:null;f&&(f.textContent=u?`${h>=0?"+":""}${h.toFixed(1)}%`:"—");const x=u?Math.min(Math.max(50+h,0),100):50;c.style.width=`${x}%`,c.className=u?h>=0?"progress-good":"progress-poor":"progress-neutral",c.style.backgroundColor=u?h>=0?"#22c55e":"#ef4444":"#94a3b8";const m=r.querySelector("thead"),b=r.querySelector("tbody");m&&(m.innerHTML=`
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
                    <td>${o(s)}</td>
                    <td>${a(n.avgValue,0).toFixed(2)}</td>
                    <td>${a(n.expectedAvg,0).toFixed(2)}</td>
                    <td>${$(n.excellentRate,1)} / ${$(n.expectedExcellentRate,1)}</td>
                    <td>${$(n.passRate,1)} / ${$(n.expectedPassRate,1)}</td>
                    <td>${$(n.lowRate,1)} / ${$(n.expectedLowRate,1)}</td>
                    <td class="${a(n.baselineAdjustment,0)>=0?"positive-percent":"negative-percent"}">${k(n.baselineAdjustment,1)}</td>
                </tr>
            `);let E=document.getElementById("teacherModalExtra");!E&&r.parentNode&&(E=document.createElement("div"),E.id="teacherModalExtra",E.style.marginBottom="16px",r.parentNode.insertBefore(E,r)),E&&(E.innerHTML=`
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
                            <button type="button" onclick="window.showTeacherFocusTargets(${T(t)}, ${T(s)}, 'excellentEdges')" style="font-size:12px; color:#0f766e; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">培优边缘生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(A((R=n.focusTargets)==null?void 0:R.excellentEdges,"暂无培优边缘生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${T(t)}, ${T(s)}, 'passEdges')" style="font-size:12px; color:#1d4ed8; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">及格临界生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(A((S=n.focusTargets)==null?void 0:S.passEdges,"暂无及格临界生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${T(t)}, ${T(s)}, 'lowRisk')" style="font-size:12px; color:#b45309; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">辅差关注生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(A((g=n.focusTargets)==null?void 0:g.lowRisk,"暂无辅差关注生"))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${o(n.sampleDetailText||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${o(((_=n.conversionMetrics)==null?void 0:_.detail)||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${o(n.baselineExamId?`历史基线：${n.baselineExamId}`:"未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。")}</div>
                </div>
            `),l.style.display="flex"}function Y(){const t=j(),s=(t==null?void 0:t.role)||"guest",i=s==="teacher"||s==="class_teacher"?N():window.TEACHER_STATS||{};if(!Object.keys(i).length){window.UI.alert("请先进行教师分析");return}const n=new Set;Object.values(i).forEach(e=>Object.keys(e||{}).forEach(w=>n.add(w)));const l=window.XLSX.utils.book_new(),r=M(),c={};Object.keys(i).forEach(e=>{Object.keys(i[e]||{}).forEach(w=>{c[w]||(c[w]=[]),c[w].push({teacherName:e,data:i[e][w]})})}),Object.keys(c).sort(z).forEach(e=>{const w=c[e].sort((v,p)=>a(p.data.fairScore,0)-a(v.data.fairScore,0)),y=[["教师姓名","学科","任教班级","人数","均分",`联考赋分(${r.total})`,"联考赋分(折算100)","基线校正","基线覆盖","上次样本","共同样本","新增样本","缺考/退出","样本稳定度","任课连续性","转化分","转化调整","预计均分","优秀率","预计优秀率","及格率","预计及格率","低分率","预计低分率","工作量修正","置信系数","教学质量分","同科排名","培优边缘生","及格临界生","辅差关注生"]];w.forEach(({teacherName:v,data:p})=>{var u,h,x;y.push([v,e,p.classesText||p.classes||"",p.studentCount,window.getExcelNum(a(p.avgValue,0)),window.getExcelNum(a(p.leagueScoreRaw,0)),window.getExcelNum(a(p.leagueScore,0)),window.getExcelNum(a(p.baselineAdjustment,0)),p.baselineCoverageText||"0%",p.previousSampleCount||0,p.commonSampleCount||0,p.addedSampleCount||0,p.exitedSampleCount||0,p.sampleStabilityText||"0%",p.teacherContinuityText||"",window.getExcelNum(a(p.conversionScore,50)),window.getExcelNum(a(p.conversionAdjustment,0)),window.getExcelNum(a(p.expectedAvg,0)),window.getExcelPercent(a(p.excellentRate,0)),window.getExcelPercent(a(p.expectedExcellentRate,0)),window.getExcelPercent(a(p.passRate,0)),window.getExcelPercent(a(p.expectedPassRate,0)),window.getExcelPercent(a(p.lowRate,0)),window.getExcelPercent(a(p.expectedLowRate,0)),window.getExcelNum(a(p.workloadAdjustment,0)),window.getExcelNum(a(p.confidenceFactor,1)),window.getExcelNum(a(p.fairScore,0)),p.fairRank||"",A((u=p.focusTargets)==null?void 0:u.excellentEdges,""),A((h=p.focusTargets)==null?void 0:h.passEdges,""),A((x=p.focusTargets)==null?void 0:x.lowRisk,"")])});const f=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName(e,"教学质量"):String(e||"Sheet").slice(0,31);window.XLSX.utils.book_append_sheet(l,window.XLSX.utils.aoa_to_sheet(y),f)});const d=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,n):new Date().toISOString().slice(0,10);window.XLSX.writeFile(l,`教师教学质量明细_${d}.xlsx`)}X(),Object.assign(window,{renderTeacherTownshipRanking:V,teacherBuildCardList:B,teacherFormatFocusList:A,renderTeacherCards:U,renderTeacherCardsV2:U,calculatePerformanceLevel:L,calculatePerformanceLevelV2:L,renderTeacherComparisonTable:G,renderTeacherComparisonTableV2:G,renderTeacherFocusSummaryCell:D,showTeacherFocusTargets:W,showTeacherFocusTargetsFromButton:te,showTeacherDetails:J,showTeacherDetailsV2:J,exportTeacherComparisonExcel:Y,exportTeacherComparisonExcelV2:Y}),window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__=!0})();
