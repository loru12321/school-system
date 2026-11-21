var uiDeclaredAttrs=globalThis.uiDeclaredAttrs||(globalThis.uiDeclaredAttrs=function(x,R,...o){const M=x==="change"?"data-ui-change":x==="input"?"data-ui-input":"data-ui-action",j=F=>String(F).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),N=o.length?` data-ui-args="${j(JSON.stringify(o))}"`:"";return`${M}="call" data-ui-call="${j(R)}"${N}`});(()=>{if(typeof window=="undefined"||window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__)return;const i=typeof window.teacherToNumber=="function"?window.teacherToNumber:((t,s=0)=>{const a=Number(t);return Number.isFinite(a)?a:s}),x=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((t,s=1)=>`${(i(t,0)*100).toFixed(s)}%`),R=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((t,s=1)=>{const a=i(t,0);return`${a>=0?"+":""}${a.toFixed(s)}`}),o=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(t=>String(t!=null?t:"").replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s])),M=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>({avg:60,exc:70,pass:70,total:200})),j=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var t;return((t=window.Auth)==null?void 0:t.currentUser)||null}),N=typeof window.normalizeSubject=="function"?window.normalizeSubject:(t=>String(t||"").trim()),F=typeof window.sortSubjects=="function"?window.sortSubjects:((t,s)=>String(t||"").localeCompare(String(s||""),"zh-Hans-CN")),P=typeof window.formatRankDisplay=="function"?window.formatRankDisplay:((t,s,a="school",n=!1)=>`${n?`${(i(t,0)*100).toFixed(2)}%`:i(t,0).toFixed(2)} <span style="font-size:0.9em; color:#94a3b8">(${s})</span>`),v={cardsSignature:"",cardsHtml:"",comparisonSignature:"",comparisonHtml:"",townshipDataRef:null,townshipAveragesRef:null,townshipSignature:"",townshipHtml:"",townshipQuickNavHtml:"",townshipAnchors:[]};function oe(){var n;const t=window.Grade9PoliticsReferenceRuntime,s=typeof window.getTeacherAnalysisDisplaySubjects=="function"?window.getTeacherAnalysisDisplaySubjects():[],a=(n=t==null?void 0:t.getSummary)==null?void 0:n.call(t);!t||typeof t.ensureSummary!="function"||!s.some(c=>N(c)==="政治")||Array.isArray(a==null?void 0:a.referenceSchools)&&a.referenceSchools.length||window.__TEACHER_POLITICS_REFERENCE_PROMISE__||(window.__TEACHER_POLITICS_REFERENCE_PROMISE__=Promise.resolve(t.ensureSummary()).then(c=>{var l;if(!Array.isArray(c==null?void 0:c.referenceSchools)||!c.referenceSchools.length)return;typeof window.calculateTeacherTownshipRanking=="function"&&window.calculateTeacherTownshipRanking({force:!0,teacherMetricScope:"admin"});const r=document.getElementById("teacher-township-ranking");(l=r==null?void 0:r.classList)!=null&&l.contains("active")&&q()}).catch(c=>console.warn("[teacher-township] 政治整理表学校参考读取失败:",(c==null?void 0:c.message)||c)).finally(()=>{window.__TEACHER_POLITICS_REFERENCE_PROMISE__=null}))}function U(t,s=""){const a=[String(s||"")];return Object.keys(t||{}).sort().forEach(n=>{a.push(`T:${n}`),Object.keys(t[n]||{}).sort(F).forEach(c=>{const r=t[n][c]||{};a.push([c,r.classesText||r.classes||"",r.studentCount,r.avg,r.avgValue,r.fairScore,r.fairRank,r.leagueScoreRaw,r.leagueScore,r.baselineAdjustment,r.baselineCoverageText,r.excellentRate,r.passRate,r.lowRate,r.conversionScore,r.conversionAdjustment,r.focusSummary,r.sampleStabilityText,r.teacherContinuityText].join("|"))})}),a.join("::")}function L(){return typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats():window.TEACHER_STATS||{}}function se(t){return typeof window.getVisibleSubjectsForTeacherUser=="function"?window.getVisibleSubjectsForTeacherUser(t):null}function B(t){const s=i(t==null?void 0:t.fairScore,(t==null?void 0:t.finalScore)||0),a=i(t==null?void 0:t.baselineAdjustment,0);return s>=85&&a>=0?{class:"performance-excellent",text:"优秀"}:s>=75?{class:"performance-good",text:"良好"}:s>=65?{class:"performance-average",text:"稳健"}:{class:"performance-poor",text:"待改进"}}function V(t,s,a="",n="guest"){const c=[];Object.keys(t||{}).forEach(l=>{Object.keys(t[l]||{}).forEach(p=>{var g,y;const e=t[l][p],m=B(e),S=((y=(g=s==null?void 0:s[l])==null?void 0:g[p])==null?void 0:y.rank)||"-";c.push({id:`${l}-${p}`,name:l,subject:p,classes:e.classesText||e.classes||"",avg:e.avg,fairScore:i(e.fairScore,0).toFixed(1),leagueScoreRaw:i(e.leagueScoreRaw,0).toFixed(1),leagueScore:i(e.leagueScore,0).toFixed(1),baselineAdjustment:R(e.baselineAdjustment,1),baselineCoverage:e.baselineCoverageText||"0%",sampleSummary:e.sampleSummary||"共同样本待识别",sampleStability:e.sampleStabilityText||"0%",conversionSummary:e.conversionSummary||"暂无转化样本",conversionScore:i(e.conversionScore,50).toFixed(1),excRate:x(e.excellentRate,1),passRate:x(e.passRate,1),lowRate:x(e.lowRate,1),focusSummary:e.focusSummary||"培优0 / 临界0 / 辅差0",count:e.studentCount,rank:S,badgeClass:m.class,badgeText:m.text})})});const r=String(a||"").replace(/\s+/g,"").toLowerCase();return c.sort((l,p)=>{if((n==="teacher"||n==="class_teacher")&&r){const S=String(l.name||"").replace(/\s+/g,"").toLowerCase(),g=String(p.name||"").replace(/\s+/g,"").toLowerCase(),y=S===r||S.startsWith(`${r}(`)||S.startsWith(`${r}（`),u=g===r||g.startsWith(`${r}(`)||g.startsWith(`${r}（`);if(y!==u)return y?-1:1}const e=i(p.fairScore,0)-i(l.fairScore,0);if(e!==0)return e;const m=i(p.leagueScore,0)-i(l.leagueScore,0);return m!==0?m:String(l.name||"").localeCompare(String(p.name||""),"zh-Hans-CN")}),c}function W(){const t=document.getElementById("teacherCardsContainer"),s=j(),a=(s==null?void 0:s.role)||"guest",n=L(),c=window.TEACHER_TOWNSHIP_RANKINGS||{},r=V(n,c,(s==null?void 0:s.name)||"",a);try{if(window.Alpine&&typeof window.Alpine.store=="function"){const e=window.Alpine.store("teacherData");e&&(e.list=r)}}catch(e){console.warn("teacherData store update skipped:",e)}if(!t)return;if(!r.length){t.innerHTML=`
                <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">
                    暂无教师数据，请先完成任课表同步和成绩导入。
                    <div style="margin-top:10px;">
                        <button class="btn btn-orange" data-open-teacher-sync>去同步任课表</button>
                    </div>
                </div>
            `;return}const l=U(n,[a,(s==null?void 0:s.name)||"",Object.keys(c||{}).sort().join("|")].join("|"));if(v.cardsSignature===l&&v.cardsHtml){(t.dataset.teacherCardsSignature!==l||!t.querySelector(".teacher-card"))&&(t.innerHTML=v.cardsHtml,t.dataset.teacherCardsSignature=l);return}const p=r.map(e=>`
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
                <button class="view-details-btn" ${uiDeclaredAttrs("click","showTeacherDetails",Number(JSON.stringify(e.name)),Number(JSON.stringify(e.subject)))}>查看详情</button>
            </div>
        `).join("");v.cardsSignature=l,v.cardsHtml=p,t.dataset.teacherCardsSignature=l,t.innerHTML=p;try{typeof window.renderTeacherHighlights=="function"&&window.renderTeacherHighlights()}catch(e){console.warn("[teacher-cards] 本次要点渲染失败（不影响卡片）:",e)}}function q(){const t=j(),s=(t==null?void 0:t.role)||"guest",a=s==="teacher"||s==="class_teacher"?se(t):null,n=document.getElementById("teacher-township-ranking-container"),c=document.getElementById("side-nav-teacher-ranks-container");if(!n)return;oe(),typeof window.calculateTeacherTownshipRanking=="function"&&window.calculateTeacherTownshipRanking({teacherMetricScope:"admin"});const r=window.TOWNSHIP_RANKING_DATA;if(!r||!Object.keys(r).length){c&&(c.innerHTML=""),n.innerHTML='<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';return}const l=typeof window.getTeacherAnalysisDisplaySubjects=="function"?window.getTeacherAnalysisDisplaySubjects():window.SUBJECTS||[],p=window.TEACHER_TOWNSHIP_AVERAGES||{},e=a instanceof Set?Array.from(a).map(d=>N(d)).sort().join("|"):"",m=[s,(t==null?void 0:t.name)||"",window.MY_SCHOOL||"",e,l.map(d=>N(d)).join("|")].join("::"),S=d=>{c&&(c.innerHTML="",(d||[]).forEach(({subject:b,subjectLabel:T,anchorId:f})=>{const h=document.createElement("a");h.className="side-nav-sub-link",h.innerText=T||b,h.onclick=()=>{typeof window.scrollToSubAnchor=="function"&&window.scrollToSubAnchor(f,h)},c.appendChild(h)}))},g=()=>{n.querySelectorAll("[data-rank-anchor]").forEach(d=>{d.addEventListener("click",()=>{var T;const b=d.getAttribute("data-rank-anchor");if(typeof window.scrollToSubAnchor=="function"){window.scrollToSubAnchor(b,d);return}(T=document.getElementById(b))==null||T.scrollIntoView({behavior:"smooth",block:"start"})})})};if(v.townshipDataRef===r&&v.townshipAveragesRef===p&&v.townshipSignature===m&&v.townshipHtml){S(v.townshipAnchors),n.innerHTML=v.townshipQuickNavHtml+v.townshipHtml,g();return}const y=d=>{const b=(d||[]).filter(C=>C.type==="school"&&i(C.studentCount,0)>0),T=b.length?b:(d||[]).filter(C=>i(C.studentCount,0)>0);let f=0,h=0,z=0,I=0;return T.forEach(C=>{const w=i(C.studentCount,0);w<=0||(f+=w,h+=i(C.avg,0)*w,z+=i(C.excellentRate,0)*w,I+=i(C.passRate,0)*w)}),f<=0?null:{avg:h/f,excRate:z/f,passRate:I/f,count:f,source:b.length?"ranking-schools":"ranking-rows"}},u=(d,b)=>{const T=i(d,NaN),f=i(b,NaN);if(!Number.isFinite(T)||!Number.isFinite(f)||Math.abs(f)<1e-9)return{text:"—",value:null};const h=(T-f)/f*100;return{text:`${h>=0?"+":""}${h.toFixed(2)}%`,value:h}},E=d=>!d||d.value===null?"rank-muted":d.value>=0?"positive-percent":"negative-percent",$=[],_=(d,b)=>{const T=(b||[]).filter(f=>f.type==="teacher").slice().sort((f,h)=>i(f.rankAvg,99999)-i(h.rankAvg,99999)).slice(0,8);return T.length?`
                <div class="teacher-township-quick-view" aria-label="${o(d)}教师排名速览">
                    ${T.map(f=>`
                        <div class="teacher-township-quick-card">
                            <strong>${o(f.name)}</strong>
                            <span>均分镇排 ${o(f.rankAvg)}</span>
                            <span>优秀率 ${o(f.rankExc)}</span>
                            <span>及格率 ${o(f.rankPass)}</span>
                        </div>
                    `).join("")}
                </div>
            `:""};let k="";if(l.forEach(d=>{var C;if(a&&a.size>0&&!a.has(N(d)))return;const b=(C=window.TOWNSHIP_RANKING_DATA)==null?void 0:C[d];if(!(b!=null&&b.length))return;const T=typeof window.getConfiguredDisplaySubjectLabel=="function"?window.getConfiguredDisplaySubjectLabel(d):d,f=typeof window.getConfiguredDisplaySubjectNotice=="function"?window.getConfiguredDisplaySubjectNotice(d):"",h=p[d]||y(b);let z="";b.forEach(w=>{const ee=u(w.avg,h==null?void 0:h.avg),te=u(w.excellentRate,h==null?void 0:h.excRate),ne=u(w.passRate,h==null?void 0:h.passRate),re=w.type==="teacher"?"text-blue":"",ce=w.type==="teacher"?"analysis-row-emphasis":"",le=w.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school",de=w.type==="teacher"?"教师":"学校";z+=`
                    <tr class="${ce}">
                        <td data-label="教师/学校" class="${re}">${o(w.name)}</td>
                        <td data-label="类型"><span class="${le}">${de}</span></td>
                        <td data-label="平均分">${P(w.avg,w.rankAvg,"teacher")}</td>
                        <td data-label="与镇均比" class="${E(ee)}">${o(ee.text)}</td>
                        <td data-label="镇排"><span class="teacher-rank-badge" aria-label="均分镇排 ${o(w.rankAvg)}">${o(w.rankAvg)}</span></td>
                        <td data-label="优秀率">${P(w.excellentRate,w.rankExc,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${E(te)}">${o(te.text)}</td>
                        <td data-label="镇排"><span class="teacher-rank-badge" aria-label="优秀率镇排 ${o(w.rankExc)}">${o(w.rankExc)}</span></td>
                        <td data-label="及格率">${P(w.passRate,w.rankPass,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${E(ne)}">${o(ne.text)}</td>
                        <td data-label="镇排"><span class="teacher-rank-badge" aria-label="及格率镇排 ${o(w.rankPass)}">${o(w.rankPass)}</span></td>
                    </tr>
                `});const I=`rank-anchor-${d}`;$.push({subject:d,anchorId:I,count:b.length}),k+=`
                <div id="${I}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span title="${o(f)}">${o(T)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${o(b.length)} 条</span>
                            <span class="analysis-table-tag">含外校整体数据</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">${o(f||"教师与学校数据同表展示，便于对照镇均水平、乡镇排名和学科整体波动。")}</div>
                    ${_(d,b)}
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
                            <tbody>${z}</tbody>
                        </table>
                    </div>
                </div>
            `}),!k){c&&(c.innerHTML=""),n.innerHTML='<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';return}const H=$.length?`<div class="teacher-township-jumpbar analysis-generated-panel">
                    <div>
                        <strong>教师乡镇排名快速查看</strong>
                        <span>点击学科直接定位，无需逐屏查找。</span>
                    </div>
                    <div class="teacher-township-jumpbar-links">
                        ${$.map(d=>`<button type="button" data-rank-anchor="${o(d.anchorId)}">${o(d.subject)}<em>${o(d.count)}</em></button>`).join("")}
                    </div>
                </div>`:"";c&&S($.map(d=>({...d,subjectLabel:typeof window.getConfiguredDisplaySubjectLabel=="function"?window.getConfiguredDisplaySubjectLabel(d.subject):d.subject}))),v.townshipDataRef=r,v.townshipAveragesRef=p,v.townshipSignature=m,v.townshipHtml=k,v.townshipQuickNavHtml=H,v.townshipAnchors=$.map(d=>({...d,subjectLabel:typeof window.getConfiguredDisplaySubjectLabel=="function"?window.getConfiguredDisplaySubjectLabel(d.subject):d.subject})),n.innerHTML=H+k,g()}function A(t,s="暂无"){const a=(t||[]).slice(0,8);return a.length?a.map(n=>`${n.name}${n.className?`(${n.className})`:""}${Number.isFinite(n.score)?` ${n.score}`:""}`).join("、"):s}const O={excellentEdges:{label:"培优",title:"培优边缘生",color:"#0f766e",empty:"暂无培优边缘生"},passEdges:{label:"临界",title:"及格临界生",color:"#1d4ed8",empty:"暂无及格临界生"},lowRisk:{label:"辅差",title:"辅差关注生",color:"#b45309",empty:"暂无辅差关注生"}};function pe(t){return o(JSON.stringify(String(t||"")))}function D(t,s,a,n){var l;const c=O[a]||O.passEdges,r=((l=n==null?void 0:n.focusTargets)==null?void 0:l[a])||[];return`
            <button
                type="button"
                class="teacher-focus-chip"
                data-teacher="${o(t)}"
                data-subject="${o(s)}"
                data-focus-type="${o(a)}"
                ${uiDeclaredAttrs("click","showTeacherFocusTargetsFromButton","$this")}
                title="点击查看${o(c.title)}名单和班级"
                style="border:1px solid ${c.color}; color:${c.color}; background:#fff; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:800; cursor:pointer; margin:2px;"
            >${o(c.label)} ${r.length}</button>
        `}function J(t,s,a){var c,r,l;const n=[`培优: ${(((c=a.focusTargets)==null?void 0:c.excellentEdges)||[]).slice(0,6).map(p=>`${p.name}(${p.className||"-"}/${p.score})`).join("、")||"暂无"}`,`临界: ${(((r=a.focusTargets)==null?void 0:r.passEdges)||[]).slice(0,6).map(p=>`${p.name}(${p.className||"-"}/${p.score})`).join("、")||"暂无"}`,`辅差: ${(((l=a.focusTargets)==null?void 0:l.lowRisk)||[]).slice(0,6).map(p=>`${p.name}(${p.className||"-"}/${p.score})`).join("、")||"暂无"}`].join(" | ");return`
            <div title="${o(n)}" style="display:flex; align-items:center; justify-content:center; gap:3px; flex-wrap:wrap;">
                ${D(t,s,"excellentEdges",a)}
                ${D(t,s,"passEdges",a)}
                ${D(t,s,"lowRisk",a)}
            </div>
        `}function G(t,s,a){var m,S;const n=L(),c=(m=n==null?void 0:n[t])==null?void 0:m[s],r=O[a]||O.passEdges,l=Array.isArray((S=c==null?void 0:c.focusTargets)==null?void 0:S[a])?c.focusTargets[a]:[],p=`${t} / ${s} · ${r.title}`,e=l.length?`
            <div style="text-align:left;">
                <div style="margin-bottom:10px; color:#64748b; font-size:13px;">共 ${l.length} 人。点击姓名可跳转到学生成绩单，便于继续查看个人成绩、排名和家校材料。</div>
                <div class="table-wrap analysis-table-shell" style="max-height:55vh; overflow:auto;">
                    <table class="analysis-generated-table" style="width:100%; font-size:13px;">
                        <thead><tr><th>班级</th><th>姓名</th><th>当前分</th><th>差距</th><th>操作</th></tr></thead>
                        <tbody>
                            ${l.map(g=>{const y=Number.isFinite(g.gap)?Math.abs(g.gap).toFixed(1):"-",u=g.school||window.MY_SCHOOL||"";return`
                                    <tr>
                                        <td>${o(g.className||"-")}</td>
                                        <td><strong>${o(g.name||"-")}</strong></td>
                                        <td>${Number.isFinite(g.score)?o(g.score):"-"}</td>
                                        <td>${y}</td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-blue"
                                                ${uiDeclaredAttrs("click","openStudentSubjectDialogOrJump",String(g.name||""),String(u||""),String(g.className||""),String(s||""),{focusLabel:String(r.title||""),gap:Number.isFinite(g.gap)?Number(g.gap):null})}>
                                                查看${o(s)}情况
                                            </button>
                                        </td>
                                    </tr>
                                `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `:`<div style="padding:24px; color:#64748b;">${o(r.empty)}</div>`;window.Swal&&typeof window.Swal.fire=="function"?window.Swal.fire({title:o(p),html:e,width:760,confirmButtonText:"关闭",confirmButtonColor:r.color}):window.UI.alert(`${p}
${l.map(g=>{var y;return`${g.className||"-"} ${g.name||"-"} ${(y=g.score)!=null?y:"-"}`}).join(`
`)||r.empty}`)}function ae(t,s,a,n,c){if(typeof window.openStudentSubjectDialog=="function")return window.openStudentSubjectDialog(t,s,a,n,c);if(typeof window.jumpToStudent=="function")return window.jumpToStudent(t,s,a)}function ie(t){t&&G(t.dataset.teacher||"",t.dataset.subject||"",t.dataset.focusType||"passEdges")}function X(){const t=document.getElementById("teacherComparisonTable"),s=L();if(!t)return;if(!Object.keys(s).length){t.innerHTML=`
                <tbody>
                    <tr>
                        <td colspan="14">
                            <div class="analysis-empty-state">暂无教师统计数据</div>
                        </td>
                    </tr>
                </tbody>
            `;return}const a=U(s,["comparison",window.innerWidth<=860?"mobile":"desktop"].join("|"));if(v.comparisonSignature===a&&v.comparisonHtml){t.dataset.teacherComparisonSignature!==a&&(t.classList.add("comparison-table"),t.innerHTML=v.comparisonHtml,t.dataset.teacherComparisonSignature=a,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(t.closest(".section")||t));return}const n={};Object.keys(s).forEach(l=>{Object.keys(s[l]||{}).forEach(p=>{n[p]||(n[p]=[]),n[p].push({teacher:l,data:s[l][p]})})});let r=`
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
        `;Object.keys(n).sort(F).forEach(l=>{r+=`<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${o(l)}</td></tr>`,n[l].sort((p,e)=>i(e.data.fairScore,0)-i(p.data.fairScore,0)).forEach(p=>{var $;const e=p.data,m=i(e.baselineAdjustment,0)>=0?"text-green":"text-red",S=i(e.lowRate,0)>=.12?"color:#dc2626; font-weight:700;":"color:#334155;",g=e.sampleWarning?"color:#b45309; font-weight:700;":"color:#334155;",y=`基线覆盖 ${e.baselineCoverageText||"0%"}；预计均分 ${i(e.expectedAvg,0).toFixed(2)}；预计优率 ${x(e.expectedExcellentRate,1)}；预计及格率 ${x(e.expectedPassRate,1)}；预计低分率 ${x(e.expectedLowRate,1)}；任课连续性 ${e.teacherContinuityText||"任课连续"}${e.baselineExamId?`；基线 ${e.baselineExamId}`:""}`,u=(e.previousSampleCount||0)>0?`新增 ${e.addedSampleCount||0} / 缺考退出 ${e.exitedSampleCount||0}`:"暂无基线",E=`${i(e.conversionScore,50).toFixed(1)}${i(e.conversionAdjustment,0)?` (${R(e.conversionAdjustment,1)})`:""}`;r+=`
                        <tr>
                            <td><strong>${o(p.teacher)}</strong></td>
                            <td>${o(e.classesText||e.classes||"-")}</td>
                            <td>${o(e.studentCount)}</td>
                            <td title="${o(e.sampleDetailText||"")}" style="${g}">
                                <div>${o((e.previousSampleCount||0)>0?e.commonSampleCount||0:"—")}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${o((e.previousSampleCount||0)>0?e.sampleStabilityText||"0%":"待历史样本")}</div>
                            </td>
                            <td title="${o(e.sampleDetailText||"")}" style="${g}">
                                <div>${o(u)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${o(e.previousSampleCount||0)}</div>
                            </td>
                            <td style="font-weight:700;">${o(e.avg)}</td>
                            <td title="${o(`均分赋分 ${i(e.ratedAvg,0).toFixed(1)}，优率赋分 ${i(e.ratedExc,0).toFixed(1)}，及格赋分 ${i(e.ratedPass,0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${i(e.leagueScoreRaw,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${i(e.leagueScore,0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${m}" title="${o(y)}" style="font-weight:700;">
                                <div>${R(e.baselineAdjustment,1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${o(e.baselineCoverageText||"0%")}</div>
                            </td>
                            <td>${x(e.excellentRate,1)}</td>
                            <td>${x(e.passRate,1)}</td>
                            <td style="${S}">${x(e.lowRate,1)}</td>
                            <td title="${o(`${e.conversionSummary||"暂无转化样本"}；${(($=e.conversionMetrics)==null?void 0:$.detail)||""}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${E}</div>
                                <div style="font-size:11px; color:#64748b;">${o(e.conversionSummary||"暂无转化")}</div>
                            </td>
                            <td style="font-size:12px;">${J(p.teacher,l,e)}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${i(e.fairScore,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${o(e.fairRank||"-")} 名</div>
                            </td>
                        </tr>
                    `})}),r+="</tbody>",v.comparisonSignature=a,v.comparisonHtml=r,t.dataset.teacherComparisonSignature=a,t.classList.add("comparison-table"),t.innerHTML=r,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(t.closest(".section")||t)}function Y(){return typeof window.ensureLazySectionLoaded=="function"&&window.ensureLazySectionLoaded("teacherModal"),document.getElementById("teacherModal")}function K(){if(window.__TEACHER_ANALYSIS_MODAL_BOUND__)return!0;const t=Y(),s=document.getElementById("closeModal");return!t||!s?!1:(s.addEventListener("click",()=>{const a=document.getElementById("teacherModal");a&&(a.style.display="none")}),window.addEventListener("click",a=>{const n=document.getElementById("teacherModal");n&&a.target===n&&(n.style.display="none")}),window.__TEACHER_ANALYSIS_MODAL_BOUND__=!0,!0)}function Q(t,s){var b,T,f,h;const a=L(),n=a[t]?a[t][s]:null;if(!n){window.UI&&window.UI.toast("当前筛选范围下暂无该教师该学科数据","warning");return}K();const c=Y(),r=document.getElementById("modalSubjectTable"),l=document.getElementById("modalAvgProgress");if(!c||!r||!l)return;const p=document.getElementById("modalTeacherName"),e=document.getElementById("modalAvgScore"),m=document.getElementById("modalExcellentRate"),S=document.getElementById("modalPassRate"),g=document.getElementById("modalAvgComparison");p&&(p.textContent=`${t} - ${s} 教学详情`),e&&(e.textContent=n.avg),m&&(m.textContent=x(n.excellentRate,1)),S&&(S.textContent=x(n.passRate,1));const y=i(n.expectedAvg,NaN),u=i(n.avgValue,NaN),E=Number.isFinite(y)&&y>0&&Number.isFinite(u),$=E?(u-y)/y*100:null;g&&(g.textContent=E?`${$>=0?"+":""}${$.toFixed(1)}%`:"—");const _=E?Math.min(Math.max(50+$,0),100):50;l.style.width=`${_}%`,l.className=E?$>=0?"progress-good":"progress-poor":"progress-neutral",l.style.backgroundColor=E?$>=0?"#22c55e":"#ef4444":"#94a3b8";const k=r.querySelector("thead"),H=r.querySelector("tbody");k&&(k.innerHTML=`
                <tr>
                    <th>学科</th>
                    <th>实际均分</th>
                    <th>预计均分</th>
                    <th>优秀率(实/预)</th>
                    <th>及格率(实/预)</th>
                    <th>低分率(实/预)</th>
                    <th>基线校正</th>
                </tr>
            `),H&&(H.innerHTML=`
                <tr>
                    <td>${o(s)}</td>
                    <td>${i(n.avgValue,0).toFixed(2)}</td>
                    <td>${i(n.expectedAvg,0).toFixed(2)}</td>
                    <td>${x(n.excellentRate,1)} / ${x(n.expectedExcellentRate,1)}</td>
                    <td>${x(n.passRate,1)} / ${x(n.expectedPassRate,1)}</td>
                    <td>${x(n.lowRate,1)} / ${x(n.expectedLowRate,1)}</td>
                    <td class="${i(n.baselineAdjustment,0)>=0?"positive-percent":"negative-percent"}">${R(n.baselineAdjustment,1)}</td>
                </tr>
            `);let d=document.getElementById("teacherModalExtra");!d&&r.parentNode&&(d=document.createElement("div"),d.id="teacherModalExtra",d.style.marginBottom="16px",r.parentNode.insertBefore(d,r)),d&&(d.innerHTML=`
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">联考赋分</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${i(n.leagueScoreRaw,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">折算 ${i(n.leagueScore,0).toFixed(1)} / 100</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">基线校正</div>
                        <div style="font-size:22px; font-weight:800; color:${i(n.baselineAdjustment,0)>=0?"#15803d":"#dc2626"};">${R(n.baselineAdjustment,1)}</div>
                        <div style="font-size:12px; color:#64748b;">覆盖 ${o(n.baselineCoverageText||"0%")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">教学质量分</div>
                        <div style="font-size:22px; font-weight:800; color:#b45309;">${i(n.fairScore,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">同科第 ${o(n.fairRank||"-")} 名</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">置信 / 工作量</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${i(n.confidenceFactor,1).toFixed(2)}</div>
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
                        <div style="font-size:22px; font-weight:800; color:#0369a1;">${i(n.conversionScore,50).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">${o(n.conversionSummary||"暂无转化样本")}${i(n.conversionAdjustment,0)?` · 调整 ${R(n.conversionAdjustment,1)}`:""}</div>
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
                            <button type="button" ${uiDeclaredAttrs("click","showTeacherFocusTargets",String(t||""),String(s||""),"excellentEdges")} style="font-size:12px; color:#0f766e; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">培优边缘生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(A((b=n.focusTargets)==null?void 0:b.excellentEdges,"暂无培优边缘生"))}</div>
                        </div>
                        <div>
                            <button type="button" ${uiDeclaredAttrs("click","showTeacherFocusTargets",String(t||""),String(s||""),"passEdges")} style="font-size:12px; color:#1d4ed8; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">及格临界生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(A((T=n.focusTargets)==null?void 0:T.passEdges,"暂无及格临界生"))}</div>
                        </div>
                        <div>
                            <button type="button" ${uiDeclaredAttrs("click","showTeacherFocusTargets",String(t||""),String(s||""),"lowRisk")} style="font-size:12px; color:#b45309; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">辅差关注生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(A((f=n.focusTargets)==null?void 0:f.lowRisk,"暂无辅差关注生"))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${o(n.sampleDetailText||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${o(((h=n.conversionMetrics)==null?void 0:h.detail)||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${o(n.baselineExamId?`历史基线：${n.baselineExamId}`:"未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。")}</div>
                </div>
            `),c.style.display="flex"}function Z(){const t=j(),s=(t==null?void 0:t.role)||"guest",a=s==="teacher"||s==="class_teacher"?L():window.TEACHER_STATS||{};if(!Object.keys(a).length){window.UI.alert("请先进行教师分析");return}const n=new Set;Object.values(a).forEach(e=>Object.keys(e||{}).forEach(m=>n.add(m)));const c=window.XLSX.utils.book_new(),r=M(),l={};Object.keys(a).forEach(e=>{Object.keys(a[e]||{}).forEach(m=>{l[m]||(l[m]=[]),l[m].push({teacherName:e,data:a[e][m]})})}),Object.keys(l).sort(F).forEach(e=>{const m=l[e].sort((y,u)=>i(u.data.fairScore,0)-i(y.data.fairScore,0)),S=[["教师姓名","学科","任教班级","人数","均分",`联考赋分(${r.total})`,"联考赋分(折算100)","基线校正","基线覆盖","上次样本","共同样本","新增样本","缺考/退出","样本稳定度","任课连续性","转化分","转化调整","预计均分","优秀率","预计优秀率","及格率","预计及格率","低分率","预计低分率","工作量修正","置信系数","教学质量分","同科排名","培优边缘生","及格临界生","辅差关注生"]];m.forEach(({teacherName:y,data:u})=>{var E,$,_;S.push([y,e,u.classesText||u.classes||"",u.studentCount,window.getExcelNum(i(u.avgValue,0)),window.getExcelNum(i(u.leagueScoreRaw,0)),window.getExcelNum(i(u.leagueScore,0)),window.getExcelNum(i(u.baselineAdjustment,0)),u.baselineCoverageText||"0%",u.previousSampleCount||0,u.commonSampleCount||0,u.addedSampleCount||0,u.exitedSampleCount||0,u.sampleStabilityText||"0%",u.teacherContinuityText||"",window.getExcelNum(i(u.conversionScore,50)),window.getExcelNum(i(u.conversionAdjustment,0)),window.getExcelNum(i(u.expectedAvg,0)),window.getExcelPercent(i(u.excellentRate,0)),window.getExcelPercent(i(u.expectedExcellentRate,0)),window.getExcelPercent(i(u.passRate,0)),window.getExcelPercent(i(u.expectedPassRate,0)),window.getExcelPercent(i(u.lowRate,0)),window.getExcelPercent(i(u.expectedLowRate,0)),window.getExcelNum(i(u.workloadAdjustment,0)),window.getExcelNum(i(u.confidenceFactor,1)),window.getExcelNum(i(u.fairScore,0)),u.fairRank||"",A((E=u.focusTargets)==null?void 0:E.excellentEdges,""),A(($=u.focusTargets)==null?void 0:$.passEdges,""),A((_=u.focusTargets)==null?void 0:_.lowRisk,"")])});const g=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName(e,"教学质量"):String(e||"Sheet").slice(0,31);window.XLSX.utils.book_append_sheet(c,window.XLSX.utils.aoa_to_sheet(S),g)});const p=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,n):new Date().toISOString().slice(0,10);window.XLSX.writeFile(c,`教师教学质量明细_${p}.xlsx`)}K(),Object.assign(window,{renderTeacherTownshipRanking:q,teacherBuildCardList:V,teacherFormatFocusList:A,renderTeacherCards:W,renderTeacherCardsV2:W,calculatePerformanceLevel:B,calculatePerformanceLevelV2:B,renderTeacherComparisonTable:X,renderTeacherComparisonTableV2:X,renderTeacherFocusSummaryCell:J,showTeacherFocusTargets:G,showTeacherFocusTargetsFromButton:ie,openStudentSubjectDialogOrJump:ae,showTeacherDetails:Q,showTeacherDetailsV2:Q,exportTeacherComparisonExcel:Z,exportTeacherComparisonExcelV2:Z}),window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__=!0})();
