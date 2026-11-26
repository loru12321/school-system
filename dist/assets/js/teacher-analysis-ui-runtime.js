var uiDeclaredAttrs=globalThis.uiDeclaredAttrs||(globalThis.uiDeclaredAttrs=function(x,R,...n){const I=x==="change"?"data-ui-change":x==="input"?"data-ui-input":"data-ui-action",j=F=>String(F).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/'/g,"&#39;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),_=n.length?` data-ui-args="${j(JSON.stringify(n))}"`:"";return`${I}="call" data-ui-call="${j(R)}"${_}`});(()=>{if(typeof window=="undefined"||window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__)return;const i=typeof window.teacherToNumber=="function"?window.teacherToNumber:((e,a=0)=>{const s=Number(e);return Number.isFinite(s)?s:a}),x=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((e,a=1)=>`${(i(e,0)*100).toFixed(a)}%`),R=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((e,a=1)=>{const s=i(e,0);return`${s>=0?"+":""}${s.toFixed(a)}`}),n=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(e=>String(e!=null?e:"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])),I=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>({avg:60,exc:70,pass:70,total:200})),j=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var e;return((e=window.Auth)==null?void 0:e.currentUser)||null}),_=typeof window.normalizeSubject=="function"?window.normalizeSubject:(e=>String(e||"").trim()),F=typeof window.sortSubjects=="function"?window.sortSubjects:((e,a)=>String(e||"").localeCompare(String(a||""),"zh-Hans-CN")),P=typeof window.formatRankDisplay=="function"?window.formatRankDisplay:((e,a,s="school",t=!1)=>`${t?`${(i(e,0)*100).toFixed(2)}%`:i(e,0).toFixed(2)} <span style="font-size:0.9em; color:#94a3b8">(${a})</span>`),v={cardsSignature:"",cardsHtml:"",comparisonSignature:"",comparisonHtml:"",townshipDataRef:null,townshipAveragesRef:null,townshipSignature:"",townshipHtml:"",townshipQuickNavHtml:"",townshipAnchors:[]};function oe(){var t;const e=window.Grade9PoliticsReferenceRuntime,a=typeof window.getTeacherAnalysisDisplaySubjects=="function"?window.getTeacherAnalysisDisplaySubjects():[],s=(t=e==null?void 0:e.getSummary)==null?void 0:t.call(e);!e||typeof e.ensureSummary!="function"||!a.some(d=>_(d)==="政治")||Array.isArray(s==null?void 0:s.referenceSchools)&&s.referenceSchools.length||window.__TEACHER_POLITICS_REFERENCE_PROMISE__||(window.__TEACHER_POLITICS_REFERENCE_PROMISE__=Promise.resolve(e.ensureSummary()).then(d=>{var g;if(!Array.isArray(d==null?void 0:d.referenceSchools)||!d.referenceSchools.length)return;typeof window.calculateTeacherTownshipRanking=="function"&&window.calculateTeacherTownshipRanking({force:!0,teacherMetricScope:"admin"});const c=document.getElementById("teacher-township-ranking");(g=c==null?void 0:c.classList)!=null&&g.contains("active")&&q()}).catch(d=>console.warn("[teacher-township] 政治整理表学校参考读取失败:",(d==null?void 0:d.message)||d)).finally(()=>{window.__TEACHER_POLITICS_REFERENCE_PROMISE__=null}))}function U(e,a=""){const s=[String(a||"")];return Object.keys(e||{}).sort().forEach(t=>{s.push(`T:${t}`),Object.keys(e[t]||{}).sort(F).forEach(d=>{const c=e[t][d]||{};s.push([d,c.classesText||c.classes||"",c.studentCount,c.avg,c.avgValue,c.fairScore,c.fairRank,c.leagueScoreRaw,c.leagueScore,c.baselineAdjustment,c.baselineCoverageText,c.excellentRate,c.passRate,c.lowRate,c.conversionScore,c.conversionAdjustment,c.focusSummary,c.sampleStabilityText,c.teacherContinuityText].join("|"))})}),s.join("::")}function H(){return typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats():window.TEACHER_STATS||{}}function ae(e){return typeof window.getVisibleSubjectsForTeacherUser=="function"?window.getVisibleSubjectsForTeacherUser(e):null}function B(e){const a=i(e==null?void 0:e.fairScore,(e==null?void 0:e.finalScore)||0),s=i(e==null?void 0:e.baselineAdjustment,0);return a>=85&&s>=0?{class:"performance-excellent",text:"优秀"}:a>=75?{class:"performance-good",text:"良好"}:a>=65?{class:"performance-average",text:"稳健"}:{class:"performance-poor",text:"待改进"}}function V(e,a,s="",t="guest"){const d=[];Object.keys(e||{}).forEach(l=>{Object.keys(e[l]||{}).forEach(o=>{var $,u;const h=e[l][o],y=B(h),r=((u=($=a==null?void 0:a[l])==null?void 0:$[o])==null?void 0:u.rank)||"-";d.push({id:`${l}-${o}`,name:l,subject:o,classes:h.classesText||h.classes||"",avg:h.avg,fairScore:i(h.fairScore,0).toFixed(1),leagueScoreRaw:i(h.leagueScoreRaw,0).toFixed(1),leagueScore:i(h.leagueScore,0).toFixed(1),baselineAdjustment:R(h.baselineAdjustment,1),baselineCoverage:h.baselineCoverageText||"0%",sampleSummary:h.sampleSummary||"共同样本待识别",sampleStability:h.sampleStabilityText||"0%",conversionSummary:h.conversionSummary||"暂无转化样本",conversionScore:i(h.conversionScore,50).toFixed(1),excRate:x(h.excellentRate,1),passRate:x(h.passRate,1),lowRate:x(h.lowRate,1),focusSummary:h.focusSummary||"培优0 / 临界0 / 辅差0",count:h.studentCount,rank:r,badgeClass:y.class,badgeText:y.text})})});const c=String(s||"").replace(/\s+/g,"").toLowerCase(),g=l=>{if(!((t==="teacher"||t==="class_teacher")&&c))return!1;const o=String(l||"").replace(/\s+/g,"").toLowerCase();return o===c||o.startsWith(`${c}(`)||o.startsWith(`${c}（`)};return d.forEach(l=>{l.isMine=g(l.name)}),d.sort((l,o)=>{if(l.isMine!==o.isMine)return l.isMine?-1:1;const h=i(o.fairScore,0)-i(l.fairScore,0);if(h!==0)return h;const y=i(o.leagueScore,0)-i(l.leagueScore,0);return y!==0?y:String(l.name||"").localeCompare(String(o.name||""),"zh-Hans-CN")}),d}function W(){const e=document.getElementById("teacherCardsContainer"),a=j(),s=(a==null?void 0:a.role)||"guest",t=s==="teacher"||s==="class_teacher",d=H(),c=window.TEACHER_TOWNSHIP_RANKINGS||{},g=V(d,c,(a==null?void 0:a.name)||"",s);try{if(window.Alpine&&typeof window.Alpine.store=="function"){const r=window.Alpine.store("teacherData");r&&(r.list=g)}}catch(r){console.warn("teacherData store update skipped:",r)}if(!e)return;if(!g.length){e.innerHTML=t?`
                <div style="grid-column:1/-1; text-align:center; color:#64748b; padding:24px;">
                    暂未匹配到您的任课成绩数据，请联系教务同步最新任课表，或自助提交任课变更申请。
                    <div style="margin-top:12px;">
                        <button type="button" class="btn btn-primary" data-ui-action="open-teacher-change-submit">申请变更任课</button>
                    </div>
                </div>
            `:`
                <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">
                    暂无教师数据，请先完成任课表同步和成绩导入。
                    <div style="margin-top:10px;">
                        <button class="btn btn-orange" data-open-teacher-sync>去同步任课表</button>
                    </div>
                </div>
            `;return}const l=U(d,[s,(a==null?void 0:a.name)||"",Object.keys(c||{}).sort().join("|")].join("|"));if(v.cardsSignature===l&&v.cardsHtml){(e.dataset.teacherCardsSignature!==l||!e.querySelector(".teacher-card"))&&(e.innerHTML=v.cardsHtml,e.dataset.teacherCardsSignature=l);return}const o=t?g.filter(r=>r.isMine):[],y=(o.length?`<div class="teacher-personal-banner">
                <div><strong>我的执教速览</strong> ${o.map(r=>`${n(r.subject)}（${n(r.classes)}班 · 均分${n(r.avg)} · 镇排${n(r.rank)}）`).join(" / ")}</div>
                <div class="teacher-personal-banner__actions">
                    <button type="button" class="btn btn-primary" ${uiDeclaredAttrs("click","showTeacherDetails",o[0].name,o[0].subject)}>我的详情</button>
                    <button type="button" class="btn btn-gray" data-ui-action="switch-tab" data-ui-value="student-details">本班明细</button>
                    <button type="button" class="btn btn-gray" data-ui-action="switch-tab" data-ui-value="marginal-push">临界生</button>
                    <button type="button" class="btn btn-gray" data-ui-action="switch-tab" data-ui-value="progress-analysis">进退步</button>
                    <button type="button" class="btn btn-gray" data-ui-action="open-teacher-change-submit">变更任课</button>
                </div>
            </div>`:"")+g.map(r=>`
            <div class="teacher-card"${r.isMine?' style="border:2px solid var(--primary);box-shadow:0 4px 14px rgba(37,99,235,0.12);"':""}>
                <div class="teacher-header">
                    <div>
                        <div class="teacher-name">${n(r.name)} - ${n(r.subject)}${r.isMine?' <span style="display:inline-block;margin-left:4px;padding:1px 6px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:11px;font-weight:600;vertical-align:middle;">我的任课</span>':""}</div>
                        <div class="teacher-classes">${n(r.classes)}班</div>
                    </div>
                    <div class="performance-badge ${n(r.badgeClass)}">${n(r.badgeText)}</div>
                </div>
                <div class="teacher-stats">
                    <div class="stat-item">
                        <div class="stat-value">${n(r.avg)}</div>
                        <div class="stat-label">均分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${n(r.leagueScoreRaw)}</div>
                        <div class="stat-label">联考赋分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${n(r.fairScore)}</div>
                        <div class="stat-label">质量分</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; padding:0 10px;">
                    <span>优/及/低: ${n(r.excRate)} / ${n(r.passRate)} / ${n(r.lowRate)}</span>
                    <span>镇排: <strong style="color:var(--primary)">${n(r.rank)}</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:6px; padding:0 10px;">
                    <span>基线校正 ${n(r.baselineAdjustment)} · 覆盖 ${n(r.baselineCoverage)}</span>
                    <span>稳定 ${n(r.sampleStability)} · 转化 ${n(r.conversionScore)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:14px; padding:0 10px;">
                    <span>${n(r.sampleSummary)}</span>
                    <span>${n(r.focusSummary)} · ${n(r.conversionSummary)}</span>
                </div>
                <button class="view-details-btn" ${uiDeclaredAttrs("click","showTeacherDetails",r.name,r.subject)}>查看详情</button>
            </div>
        `).join("");v.cardsSignature=l,v.cardsHtml=y,e.dataset.teacherCardsSignature=l,e.innerHTML=y;try{typeof window.renderTeacherHighlights=="function"&&window.renderTeacherHighlights()}catch(r){console.warn("[teacher-cards] 本次要点渲染失败（不影响卡片）:",r)}}function q(){const e=j(),a=(e==null?void 0:e.role)||"guest",s=a==="teacher"||a==="class_teacher"?ae(e):null,t=document.getElementById("teacher-township-ranking-container"),d=document.getElementById("side-nav-teacher-ranks-container");if(!t)return;oe(),typeof window.calculateTeacherTownshipRanking=="function"&&window.calculateTeacherTownshipRanking({teacherMetricScope:"admin"});const c=window.TOWNSHIP_RANKING_DATA;if(!c||!Object.keys(c).length){d&&(d.innerHTML=""),t.innerHTML='<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';return}const g=typeof window.getTeacherAnalysisDisplaySubjects=="function"?window.getTeacherAnalysisDisplaySubjects():window.SUBJECTS||[],l=window.TEACHER_TOWNSHIP_AVERAGES||{},o=s instanceof Set?Array.from(s).map(p=>_(p)).sort().join("|"):"",h=[a,(e==null?void 0:e.name)||"",window.MY_SCHOOL||"",o,g.map(p=>_(p)).join("|")].join("::"),y=p=>{d&&(d.innerHTML="",(p||[]).forEach(({subject:m,subjectLabel:T,anchorId:f})=>{const b=document.createElement("a");b.className="side-nav-sub-link",b.innerText=T||m,b.onclick=()=>{typeof window.scrollToSubAnchor=="function"&&window.scrollToSubAnchor(f,b)},d.appendChild(b)}))},r=()=>{t.querySelectorAll("[data-rank-anchor]").forEach(p=>{p.addEventListener("click",()=>{var T;const m=p.getAttribute("data-rank-anchor");if(typeof window.scrollToSubAnchor=="function"){window.scrollToSubAnchor(m,p);return}(T=document.getElementById(m))==null||T.scrollIntoView({behavior:"smooth",block:"start"})})})};if(v.townshipDataRef===c&&v.townshipAveragesRef===l&&v.townshipSignature===h&&v.townshipHtml){y(v.townshipAnchors),t.innerHTML=v.townshipQuickNavHtml+v.townshipHtml,r();return}const $=p=>{const m=(p||[]).filter(C=>C.type==="school"&&i(C.studentCount,0)>0),T=m.length?m:(p||[]).filter(C=>i(C.studentCount,0)>0);let f=0,b=0,z=0,M=0;return T.forEach(C=>{const w=i(C.studentCount,0);w<=0||(f+=w,b+=i(C.avg,0)*w,z+=i(C.excellentRate,0)*w,M+=i(C.passRate,0)*w)}),f<=0?null:{avg:b/f,excRate:z/f,passRate:M/f,count:f,source:m.length?"ranking-schools":"ranking-rows"}},u=(p,m)=>{const T=i(p,NaN),f=i(m,NaN);if(!Number.isFinite(T)||!Number.isFinite(f)||Math.abs(f)<1e-9)return{text:"—",value:null};const b=(T-f)/f*100;return{text:`${b>=0?"+":""}${b.toFixed(2)}%`,value:b}},E=p=>!p||p.value===null?"rank-muted":p.value>=0?"positive-percent":"negative-percent",S=[],N=(p,m)=>{const T=(m||[]).filter(f=>f.type==="teacher").slice().sort((f,b)=>i(f.rankAvg,99999)-i(b.rankAvg,99999)).slice(0,8);return T.length?`
                <div class="teacher-township-quick-view" aria-label="${n(p)}教师排名速览">
                    ${T.map(f=>`
                        <div class="teacher-township-quick-card">
                            <strong>${n(f.name)}</strong>
                            <span>均分镇排 ${n(f.rankAvg)}</span>
                            <span>优秀率 ${n(f.rankExc)}</span>
                            <span>及格率 ${n(f.rankPass)}</span>
                        </div>
                    `).join("")}
                </div>
            `:""};let A="";if(g.forEach(p=>{var C;if(s&&s.size>0&&!s.has(_(p)))return;const m=(C=window.TOWNSHIP_RANKING_DATA)==null?void 0:C[p];if(!(m!=null&&m.length))return;const T=typeof window.getConfiguredDisplaySubjectLabel=="function"?window.getConfiguredDisplaySubjectLabel(p):p,f=typeof window.getConfiguredDisplaySubjectNotice=="function"?window.getConfiguredDisplaySubjectNotice(p):"",b=l[p]||$(m);let z="";m.forEach(w=>{const ee=u(w.avg,b==null?void 0:b.avg),te=u(w.excellentRate,b==null?void 0:b.excRate),ne=u(w.passRate,b==null?void 0:b.passRate),re=w.type==="teacher"?"text-blue":"",ce=w.type==="teacher"?"analysis-row-emphasis":"",le=w.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school",de=w.type==="teacher"?"教师":"学校";z+=`
                    <tr class="${ce}">
                        <td data-label="教师/学校" class="${re}">${n(w.name)}</td>
                        <td data-label="类型"><span class="${le}">${de}</span></td>
                        <td data-label="平均分">${P(w.avg,w.rankAvg,"teacher")}</td>
                        <td data-label="与镇均比" class="${E(ee)}">${n(ee.text)}</td>
                        <td data-label="镇排"><span class="teacher-rank-badge" aria-label="均分镇排 ${n(w.rankAvg)}">${n(w.rankAvg)}</span></td>
                        <td data-label="优秀率">${P(w.excellentRate,w.rankExc,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${E(te)}">${n(te.text)}</td>
                        <td data-label="镇排"><span class="teacher-rank-badge" aria-label="优秀率镇排 ${n(w.rankExc)}">${n(w.rankExc)}</span></td>
                        <td data-label="及格率">${P(w.passRate,w.rankPass,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${E(ne)}">${n(ne.text)}</td>
                        <td data-label="镇排"><span class="teacher-rank-badge" aria-label="及格率镇排 ${n(w.rankPass)}">${n(w.rankPass)}</span></td>
                    </tr>
                `});const M=`rank-anchor-${p}`;S.push({subject:p,anchorId:M,count:m.length}),A+=`
                <div id="${M}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span title="${n(f)}">${n(T)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${n(m.length)} 条</span>
                            <span class="analysis-table-tag">含外校整体数据</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">${n(f||"教师与学校数据同表展示，便于对照镇均水平、乡镇排名和学科整体波动。")}</div>
                    ${N(p,m)}
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
            `}),!A){d&&(d.innerHTML=""),t.innerHTML='<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';return}const L=S.length?`<div class="teacher-township-jumpbar analysis-generated-panel">
                    <div>
                        <strong>教师乡镇排名快速查看</strong>
                        <span>点击学科直接定位，无需逐屏查找。</span>
                    </div>
                    <div class="teacher-township-jumpbar-links">
                        ${S.map(p=>`<button type="button" data-rank-anchor="${n(p.anchorId)}">${n(p.subject)}<em>${n(p.count)}</em></button>`).join("")}
                    </div>
                </div>`:"";d&&y(S.map(p=>({...p,subjectLabel:typeof window.getConfiguredDisplaySubjectLabel=="function"?window.getConfiguredDisplaySubjectLabel(p.subject):p.subject}))),v.townshipDataRef=c,v.townshipAveragesRef=l,v.townshipSignature=h,v.townshipHtml=A,v.townshipQuickNavHtml=L,v.townshipAnchors=S.map(p=>({...p,subjectLabel:typeof window.getConfiguredDisplaySubjectLabel=="function"?window.getConfiguredDisplaySubjectLabel(p.subject):p.subject})),t.innerHTML=L+A,r()}function k(e,a="暂无"){const s=(e||[]).slice(0,8);return s.length?s.map(t=>`${t.name}${t.className?`(${t.className})`:""}${Number.isFinite(t.score)?` ${t.score}`:""}`).join("、"):a}const O={excellentEdges:{label:"培优",title:"培优边缘生",color:"#0f766e",empty:"暂无培优边缘生"},passEdges:{label:"临界",title:"及格临界生",color:"#1d4ed8",empty:"暂无及格临界生"},lowRisk:{label:"辅差",title:"辅差关注生",color:"#b45309",empty:"暂无辅差关注生"}};function pe(e){return n(JSON.stringify(String(e||"")))}function D(e,a,s,t){var g;const d=O[s]||O.passEdges,c=((g=t==null?void 0:t.focusTargets)==null?void 0:g[s])||[];return`
            <button
                type="button"
                class="teacher-focus-chip"
                data-teacher="${n(e)}"
                data-subject="${n(a)}"
                data-focus-type="${n(s)}"
                ${uiDeclaredAttrs("click","showTeacherFocusTargetsFromButton","$this")}
                title="点击查看${n(d.title)}名单和班级"
                style="border:1px solid ${d.color}; color:${d.color}; background:#fff; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:800; cursor:pointer; margin:2px;"
            >${n(d.label)} ${c.length}</button>
        `}function G(e,a,s){var d,c,g;const t=[`培优: ${(((d=s.focusTargets)==null?void 0:d.excellentEdges)||[]).slice(0,6).map(l=>`${l.name}(${l.className||"-"}/${l.score})`).join("、")||"暂无"}`,`临界: ${(((c=s.focusTargets)==null?void 0:c.passEdges)||[]).slice(0,6).map(l=>`${l.name}(${l.className||"-"}/${l.score})`).join("、")||"暂无"}`,`辅差: ${(((g=s.focusTargets)==null?void 0:g.lowRisk)||[]).slice(0,6).map(l=>`${l.name}(${l.className||"-"}/${l.score})`).join("、")||"暂无"}`].join(" | ");return`
            <div title="${n(t)}" style="display:flex; align-items:center; justify-content:center; gap:3px; flex-wrap:wrap;">
                ${D(e,a,"excellentEdges",s)}
                ${D(e,a,"passEdges",s)}
                ${D(e,a,"lowRisk",s)}
            </div>
        `}function X(e,a,s){var h,y;const t=H(),d=(h=t==null?void 0:t[e])==null?void 0:h[a],c=O[s]||O.passEdges,g=Array.isArray((y=d==null?void 0:d.focusTargets)==null?void 0:y[s])?d.focusTargets[s]:[],l=`${e} / ${a} · ${c.title}`,o=g.length?`
            <div style="text-align:left;">
                <div style="margin-bottom:10px; color:#64748b; font-size:13px;">共 ${g.length} 人。点击姓名可跳转到学生成绩单，便于继续查看个人成绩、排名和家校材料。</div>
                <div class="table-wrap analysis-table-shell" style="max-height:55vh; overflow:auto;">
                    <table class="analysis-generated-table" style="width:100%; font-size:13px;">
                        <thead><tr><th>班级</th><th>姓名</th><th>当前分</th><th>差距</th><th>操作</th></tr></thead>
                        <tbody>
                            ${g.map(r=>{const $=Number.isFinite(r.gap)?Math.abs(r.gap).toFixed(1):"-",u=r.school||window.MY_SCHOOL||"";return`
                                    <tr>
                                        <td>${n(r.className||"-")}</td>
                                        <td><strong>${n(r.name||"-")}</strong></td>
                                        <td>${Number.isFinite(r.score)?n(r.score):"-"}</td>
                                        <td>${$}</td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-blue"
                                                ${uiDeclaredAttrs("click","openStudentSubjectDialogOrJump",String(r.name||""),String(u||""),String(r.className||""),String(a||""),{focusLabel:String(c.title||""),gap:Number.isFinite(r.gap)?Number(r.gap):null})}>
                                                查看${n(a)}情况
                                            </button>
                                        </td>
                                    </tr>
                                `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `:`<div style="padding:24px; color:#64748b;">${n(c.empty)}</div>`;window.Swal&&typeof window.Swal.fire=="function"?window.Swal.fire({title:n(l),html:o,width:760,confirmButtonText:"关闭",confirmButtonColor:c.color}):window.UI.alert(`${l}
${g.map(r=>{var $;return`${r.className||"-"} ${r.name||"-"} ${($=r.score)!=null?$:"-"}`}).join(`
`)||c.empty}`)}function se(e,a,s,t,d){if(typeof window.openStudentSubjectDialog=="function")return window.openStudentSubjectDialog(e,a,s,t,d);if(typeof window.jumpToStudent=="function")return window.jumpToStudent(e,a,s)}function ie(e){e&&X(e.dataset.teacher||"",e.dataset.subject||"",e.dataset.focusType||"passEdges")}function J(){const e=document.getElementById("teacherComparisonTable"),a=H();if(!e)return;if(!Object.keys(a).length){e.innerHTML=`
                <tbody>
                    <tr>
                        <td colspan="14">
                            <div class="analysis-empty-state">暂无教师统计数据</div>
                        </td>
                    </tr>
                </tbody>
            `;return}const s=U(a,["comparison",window.innerWidth<=860?"mobile":"desktop"].join("|"));if(v.comparisonSignature===s&&v.comparisonHtml){e.dataset.teacherComparisonSignature!==s&&(e.classList.add("comparison-table"),e.innerHTML=v.comparisonHtml,e.dataset.teacherComparisonSignature=s,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(e.closest(".section")||e));return}const t={};Object.keys(a).forEach(g=>{Object.keys(a[g]||{}).forEach(l=>{t[l]||(t[l]=[]),t[l].push({teacher:g,data:a[g][l]})})});let c=`
            <thead>
                <tr>
                    <th rowspan="2">教师</th>
                    <th rowspan="2">班级</th>
                    <th rowspan="2">实考</th>
                    <th rowspan="2">共同样本</th>
                    <th rowspan="2">样本变动</th>
                    <th rowspan="2">均分</th>
                    <th rowspan="2" title="按系统现有两率一分标准折算，同校同学科比较">联考赋分(${I().total})</th>
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
        `;Object.keys(t).sort(F).forEach(g=>{c+=`<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${n(g)}</td></tr>`,t[g].sort((l,o)=>i(o.data.fairScore,0)-i(l.data.fairScore,0)).forEach(l=>{var S;const o=l.data,h=i(o.baselineAdjustment,0)>=0?"text-green":"text-red",y=i(o.lowRate,0)>=.12?"color:#dc2626; font-weight:700;":"color:#334155;",r=o.sampleWarning?"color:#b45309; font-weight:700;":"color:#334155;",$=`基线覆盖 ${o.baselineCoverageText||"0%"}；预计均分 ${i(o.expectedAvg,0).toFixed(2)}；预计优率 ${x(o.expectedExcellentRate,1)}；预计及格率 ${x(o.expectedPassRate,1)}；预计低分率 ${x(o.expectedLowRate,1)}；任课连续性 ${o.teacherContinuityText||"任课连续"}${o.baselineExamId?`；基线 ${o.baselineExamId}`:""}`,u=(o.previousSampleCount||0)>0?`新增 ${o.addedSampleCount||0} / 缺考退出 ${o.exitedSampleCount||0}`:"暂无基线",E=`${i(o.conversionScore,50).toFixed(1)}${i(o.conversionAdjustment,0)?` (${R(o.conversionAdjustment,1)})`:""}`;c+=`
                        <tr>
                            <td><strong>${n(l.teacher)}</strong></td>
                            <td>${n(o.classesText||o.classes||"-")}</td>
                            <td>${n(o.studentCount)}</td>
                            <td title="${n(o.sampleDetailText||"")}" style="${r}">
                                <div>${n((o.previousSampleCount||0)>0?o.commonSampleCount||0:"—")}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${n((o.previousSampleCount||0)>0?o.sampleStabilityText||"0%":"待历史样本")}</div>
                            </td>
                            <td title="${n(o.sampleDetailText||"")}" style="${r}">
                                <div>${n(u)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${n(o.previousSampleCount||0)}</div>
                            </td>
                            <td style="font-weight:700;">${n(o.avg)}</td>
                            <td title="${n(`均分赋分 ${i(o.ratedAvg,0).toFixed(1)}，优率赋分 ${i(o.ratedExc,0).toFixed(1)}，及格赋分 ${i(o.ratedPass,0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${i(o.leagueScoreRaw,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${i(o.leagueScore,0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${h}" title="${n($)}" style="font-weight:700;">
                                <div>${R(o.baselineAdjustment,1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${n(o.baselineCoverageText||"0%")}</div>
                            </td>
                            <td>${x(o.excellentRate,1)}</td>
                            <td>${x(o.passRate,1)}</td>
                            <td style="${y}">${x(o.lowRate,1)}</td>
                            <td title="${n(`${o.conversionSummary||"暂无转化样本"}；${((S=o.conversionMetrics)==null?void 0:S.detail)||""}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${E}</div>
                                <div style="font-size:11px; color:#64748b;">${n(o.conversionSummary||"暂无转化")}</div>
                            </td>
                            <td style="font-size:12px;">${G(l.teacher,g,o)}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${i(o.fairScore,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${n(o.fairRank||"-")} 名</div>
                            </td>
                        </tr>
                    `})}),c+="</tbody>",v.comparisonSignature=s,v.comparisonHtml=c,e.dataset.teacherComparisonSignature=s,e.classList.add("comparison-table"),e.innerHTML=c,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(e.closest(".section")||e)}function Y(){typeof window.ensureLazySectionLoaded=="function"&&window.ensureLazySectionLoaded("teacherModal");const e=document.getElementById("teacherModal");return e&&document.body&&e.parentElement!==document.body&&document.body.appendChild(e),e}function K(){if(window.__TEACHER_ANALYSIS_MODAL_BOUND__)return!0;const e=Y(),a=document.getElementById("closeModal");return!e||!a?!1:(a.addEventListener("click",()=>{const s=document.getElementById("teacherModal");s&&(s.style.display="none")}),window.addEventListener("click",s=>{const t=document.getElementById("teacherModal");t&&s.target===t&&(t.style.display="none")}),window.__TEACHER_ANALYSIS_MODAL_BOUND__=!0,!0)}function Q(e,a){var m,T,f,b;const s=H(),t=s[e]?s[e][a]:null;if(!t){window.UI&&window.UI.toast("当前筛选范围下暂无该教师该学科数据","warning");return}K();const d=Y(),c=document.getElementById("modalSubjectTable"),g=document.getElementById("modalAvgProgress");if(!d||!c||!g)return;const l=document.getElementById("modalTeacherName"),o=document.getElementById("modalAvgScore"),h=document.getElementById("modalExcellentRate"),y=document.getElementById("modalPassRate"),r=document.getElementById("modalAvgComparison");l&&(l.textContent=`${e} - ${a} 教学详情`),o&&(o.textContent=t.avg),h&&(h.textContent=x(t.excellentRate,1)),y&&(y.textContent=x(t.passRate,1));const $=i(t.expectedAvg,NaN),u=i(t.avgValue,NaN),E=Number.isFinite($)&&$>0&&Number.isFinite(u),S=E?(u-$)/$*100:null;r&&(r.textContent=E?`${S>=0?"+":""}${S.toFixed(1)}%`:"—");const N=E?Math.min(Math.max(50+S,0),100):50;g.style.width=`${N}%`,g.className=E?S>=0?"progress-good":"progress-poor":"progress-neutral",g.style.backgroundColor=E?S>=0?"#22c55e":"#ef4444":"#94a3b8";const A=c.querySelector("thead"),L=c.querySelector("tbody");A&&(A.innerHTML=`
                <tr>
                    <th>学科</th>
                    <th>实际均分</th>
                    <th>预计均分</th>
                    <th>优秀率(实/预)</th>
                    <th>及格率(实/预)</th>
                    <th>低分率(实/预)</th>
                    <th>基线校正</th>
                </tr>
            `),L&&(L.innerHTML=`
                <tr>
                    <td>${n(a)}</td>
                    <td>${i(t.avgValue,0).toFixed(2)}</td>
                    <td>${i(t.expectedAvg,0).toFixed(2)}</td>
                    <td>${x(t.excellentRate,1)} / ${x(t.expectedExcellentRate,1)}</td>
                    <td>${x(t.passRate,1)} / ${x(t.expectedPassRate,1)}</td>
                    <td>${x(t.lowRate,1)} / ${x(t.expectedLowRate,1)}</td>
                    <td class="${i(t.baselineAdjustment,0)>=0?"positive-percent":"negative-percent"}">${R(t.baselineAdjustment,1)}</td>
                </tr>
            `);let p=document.getElementById("teacherModalExtra");!p&&c.parentNode&&(p=document.createElement("div"),p.id="teacherModalExtra",p.style.marginBottom="16px",c.parentNode.insertBefore(p,c)),p&&(p.innerHTML=`
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">联考赋分</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${i(t.leagueScoreRaw,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">折算 ${i(t.leagueScore,0).toFixed(1)} / 100</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">基线校正</div>
                        <div style="font-size:22px; font-weight:800; color:${i(t.baselineAdjustment,0)>=0?"#15803d":"#dc2626"};">${R(t.baselineAdjustment,1)}</div>
                        <div style="font-size:12px; color:#64748b;">覆盖 ${n(t.baselineCoverageText||"0%")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">教学质量分</div>
                        <div style="font-size:22px; font-weight:800; color:#b45309;">${i(t.fairScore,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">同科第 ${n(t.fairRank||"-")} 名</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">置信 / 工作量</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${i(t.confidenceFactor,1).toFixed(2)}</div>
                        <div style="font-size:12px; color:#64748b;">工作量修正 ${R(t.workloadAdjustment,1)}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">共同样本</div>
                        <div style="font-size:22px; font-weight:800; color:${t.sampleWarning?"#b45309":"#0f172a"};">${n((t.previousSampleCount||0)>0?t.commonSampleCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">稳定 ${n((t.previousSampleCount||0)>0?t.sampleStabilityText||"0%":"待历史样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">样本变动</div>
                        <div style="font-size:22px; font-weight:800; color:${t.sampleWarning?"#b45309":"#0f172a"};">${n((t.previousSampleCount||0)>0?t.sampleShiftCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">${n((t.previousSampleCount||0)>0?`新增 ${t.addedSampleCount||0} · 缺考退出 ${t.exitedSampleCount||0}`:"暂无基线样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">转化分</div>
                        <div style="font-size:22px; font-weight:800; color:#0369a1;">${i(t.conversionScore,50).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">${n(t.conversionSummary||"暂无转化样本")}${i(t.conversionAdjustment,0)?` · 调整 ${R(t.conversionAdjustment,1)}`:""}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">换老师保护</div>
                        <div style="font-size:22px; font-weight:800; color:${t.teacherChangeProtected?"#b45309":"#0f172a"};">${n(t.teacherChangeProtected?"已冻结":"正常")}</div>
                        <div style="font-size:12px; color:#64748b;">${n(t.teacherContinuityText||"任课连续")}</div>
                    </div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px; background:#f8fafc;">
                    <div style="font-size:13px; font-weight:700; color:#334155; margin-bottom:10px;">培优 / 辅差名单</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                        <div>
                            <button type="button" ${uiDeclaredAttrs("click","showTeacherFocusTargets",String(e||""),String(a||""),"excellentEdges")} style="font-size:12px; color:#0f766e; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">培优边缘生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${n(k((m=t.focusTargets)==null?void 0:m.excellentEdges,"暂无培优边缘生"))}</div>
                        </div>
                        <div>
                            <button type="button" ${uiDeclaredAttrs("click","showTeacherFocusTargets",String(e||""),String(a||""),"passEdges")} style="font-size:12px; color:#1d4ed8; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">及格临界生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${n(k((T=t.focusTargets)==null?void 0:T.passEdges,"暂无及格临界生"))}</div>
                        </div>
                        <div>
                            <button type="button" ${uiDeclaredAttrs("click","showTeacherFocusTargets",String(e||""),String(a||""),"lowRisk")} style="font-size:12px; color:#b45309; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">辅差关注生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${n(k((f=t.focusTargets)==null?void 0:f.lowRisk,"暂无辅差关注生"))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${n(t.sampleDetailText||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${n(((b=t.conversionMetrics)==null?void 0:b.detail)||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${n(t.baselineExamId?`历史基线：${t.baselineExamId}`:"未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。")}</div>
                </div>
            `),d.style.display="flex"}function Z(){const e=j(),a=(e==null?void 0:e.role)||"guest",s=a==="teacher"||a==="class_teacher"?H():window.TEACHER_STATS||{};if(!Object.keys(s).length){window.UI.alert("请先进行教师分析");return}const t=new Set;Object.values(s).forEach(o=>Object.keys(o||{}).forEach(h=>t.add(h)));const d=window.XLSX.utils.book_new(),c=I(),g={};Object.keys(s).forEach(o=>{Object.keys(s[o]||{}).forEach(h=>{g[h]||(g[h]=[]),g[h].push({teacherName:o,data:s[o][h]})})}),Object.keys(g).sort(F).forEach(o=>{const h=g[o].sort(($,u)=>i(u.data.fairScore,0)-i($.data.fairScore,0)),y=[["教师姓名","学科","任教班级","人数","均分",`联考赋分(${c.total})`,"联考赋分(折算100)","基线校正","基线覆盖","上次样本","共同样本","新增样本","缺考/退出","样本稳定度","任课连续性","转化分","转化调整","预计均分","优秀率","预计优秀率","及格率","预计及格率","低分率","预计低分率","工作量修正","置信系数","教学质量分","同科排名","培优边缘生","及格临界生","辅差关注生"]];h.forEach(({teacherName:$,data:u})=>{var E,S,N;y.push([$,o,u.classesText||u.classes||"",u.studentCount,window.getExcelNum(i(u.avgValue,0)),window.getExcelNum(i(u.leagueScoreRaw,0)),window.getExcelNum(i(u.leagueScore,0)),window.getExcelNum(i(u.baselineAdjustment,0)),u.baselineCoverageText||"0%",u.previousSampleCount||0,u.commonSampleCount||0,u.addedSampleCount||0,u.exitedSampleCount||0,u.sampleStabilityText||"0%",u.teacherContinuityText||"",window.getExcelNum(i(u.conversionScore,50)),window.getExcelNum(i(u.conversionAdjustment,0)),window.getExcelNum(i(u.expectedAvg,0)),window.getExcelPercent(i(u.excellentRate,0)),window.getExcelPercent(i(u.expectedExcellentRate,0)),window.getExcelPercent(i(u.passRate,0)),window.getExcelPercent(i(u.expectedPassRate,0)),window.getExcelPercent(i(u.lowRate,0)),window.getExcelPercent(i(u.expectedLowRate,0)),window.getExcelNum(i(u.workloadAdjustment,0)),window.getExcelNum(i(u.confidenceFactor,1)),window.getExcelNum(i(u.fairScore,0)),u.fairRank||"",k((E=u.focusTargets)==null?void 0:E.excellentEdges,""),k((S=u.focusTargets)==null?void 0:S.passEdges,""),k((N=u.focusTargets)==null?void 0:N.lowRisk,"")])});const r=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName(o,"教学质量"):String(o||"Sheet").slice(0,31);window.XLSX.utils.book_append_sheet(d,window.XLSX.utils.aoa_to_sheet(y),r)});const l=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(e,t):new Date().toISOString().slice(0,10);window.XLSX.writeFile(d,`教师教学质量明细_${l}.xlsx`)}K(),Object.assign(window,{renderTeacherTownshipRanking:q,teacherBuildCardList:V,teacherFormatFocusList:k,renderTeacherCards:W,renderTeacherCardsV2:W,calculatePerformanceLevel:B,calculatePerformanceLevelV2:B,renderTeacherComparisonTable:J,renderTeacherComparisonTableV2:J,renderTeacherFocusSummaryCell:G,showTeacherFocusTargets:X,showTeacherFocusTargetsFromButton:ie,openStudentSubjectDialogOrJump:se,showTeacherDetails:Q,showTeacherDetailsV2:Q,exportTeacherComparisonExcel:Z,exportTeacherComparisonExcelV2:Z}),window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__=!0})();
