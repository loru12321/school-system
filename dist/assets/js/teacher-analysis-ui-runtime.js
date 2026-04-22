(()=>{if(typeof window=="undefined"||window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__)return;const o=typeof window.teacherToNumber=="function"?window.teacherToNumber:((n,l=0)=>{const d=Number(n);return Number.isFinite(d)?d:l}),x=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((n,l=1)=>`${(o(n,0)*100).toFixed(l)}%`),$=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((n,l=1)=>{const d=o(n,0);return`${d>=0?"+":""}${d.toFixed(l)}`}),a=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(n=>String(n!=null?n:"").replace(/[&<>"']/g,l=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[l])),_=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>({avg:60,exc:70,pass:70,total:200})),A=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var n;return((n=window.Auth)==null?void 0:n.currentUser)||null}),F=typeof window.normalizeSubject=="function"?window.normalizeSubject:(n=>String(n||"").trim()),N=typeof window.sortSubjects=="function"?window.sortSubjects:((n,l)=>String(n||"").localeCompare(String(l||""),"zh-Hans-CN")),z=typeof window.formatRankDisplay=="function"?window.formatRankDisplay:((n,l,d="school",e=!1)=>`${e?`${(o(n,0)*100).toFixed(2)}%`:o(n,0).toFixed(2)} <span style="font-size:0.9em; color:#94a3b8">(${l})</span>`);function E(){return typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats():window.TEACHER_STATS||{}}function B(n){return typeof window.getVisibleSubjectsForTeacherUser=="function"?window.getVisibleSubjectsForTeacherUser(n):null}function k(n){const l=o(n==null?void 0:n.fairScore,(n==null?void 0:n.finalScore)||0),d=o(n==null?void 0:n.baselineAdjustment,0);return l>=85&&d>=0?{class:"performance-excellent",text:"优秀"}:l>=75?{class:"performance-good",text:"良好"}:l>=65?{class:"performance-average",text:"稳健"}:{class:"performance-poor",text:"待改进"}}function L(n,l,d="",e="guest"){const v=[];Object.keys(n||{}).forEach(s=>{Object.keys(n[s]||{}).forEach(t=>{var w,u;const r=n[s][t],g=k(r),f=((u=(w=l==null?void 0:l[s])==null?void 0:w[t])==null?void 0:u.rank)||"-";v.push({id:`${s}-${t}`,name:s,subject:t,classes:r.classesText||r.classes||"",avg:r.avg,fairScore:o(r.fairScore,0).toFixed(1),leagueScoreRaw:o(r.leagueScoreRaw,0).toFixed(1),leagueScore:o(r.leagueScore,0).toFixed(1),baselineAdjustment:$(r.baselineAdjustment,1),baselineCoverage:r.baselineCoverageText||"0%",sampleSummary:r.sampleSummary||"共同样本待识别",sampleStability:r.sampleStabilityText||"0%",conversionSummary:r.conversionSummary||"暂无转化样本",conversionScore:o(r.conversionScore,50).toFixed(1),excRate:x(r.excellentRate,1),passRate:x(r.passRate,1),lowRate:x(r.lowRate,1),focusSummary:r.focusSummary||"培优0 / 临界0 / 辅差0",count:r.studentCount,rank:f,badgeClass:g.class,badgeText:g.text})})});const p=String(d||"").replace(/\s+/g,"").toLowerCase();return v.sort((s,t)=>{if((e==="teacher"||e==="class_teacher")&&p){const f=String(s.name||"").replace(/\s+/g,"").toLowerCase(),w=String(t.name||"").replace(/\s+/g,"").toLowerCase(),u=f===p||f.startsWith(`${p}(`)||f.startsWith(`${p}（`),i=w===p||w.startsWith(`${p}(`)||w.startsWith(`${p}（`);if(u!==i)return u?-1:1}const r=o(t.fairScore,0)-o(s.fairScore,0);if(r!==0)return r;const g=o(t.leagueScore,0)-o(s.leagueScore,0);return g!==0?g:String(s.name||"").localeCompare(String(t.name||""),"zh-Hans-CN")}),v}function I(){const n=document.getElementById("teacherCardsContainer"),l=A(),d=(l==null?void 0:l.role)||"guest",e=E(),v=window.TEACHER_TOWNSHIP_RANKINGS||{},p=L(e,v,(l==null?void 0:l.name)||"",d);try{if(window.Alpine&&typeof window.Alpine.store=="function"){const s=window.Alpine.store("teacherData");s&&(s.list=p)}}catch(s){console.warn("teacherData store update skipped:",s)}if(n){if(!p.length){n.innerHTML=`
                <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">
                    暂无教师数据，请先完成任课表同步和成绩导入。
                    <div style="margin-top:10px;">
                        <button class="btn btn-orange" onclick="openTeacherSync()">去同步任课表</button>
                    </div>
                </div>
            `;return}n.innerHTML=p.map(s=>`
            <div class="teacher-card">
                <div class="teacher-header">
                    <div>
                        <div class="teacher-name">${a(s.name)} - ${a(s.subject)}</div>
                        <div class="teacher-classes">${a(s.classes)}班</div>
                    </div>
                    <div class="performance-badge ${a(s.badgeClass)}">${a(s.badgeText)}</div>
                </div>
                <div class="teacher-stats">
                    <div class="stat-item">
                        <div class="stat-value">${a(s.avg)}</div>
                        <div class="stat-label">均分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${a(s.leagueScoreRaw)}</div>
                        <div class="stat-label">联考赋分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${a(s.fairScore)}</div>
                        <div class="stat-label">公平绩效</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; padding:0 10px;">
                    <span>优/及/低: ${a(s.excRate)} / ${a(s.passRate)} / ${a(s.lowRate)}</span>
                    <span>镇排: <strong style="color:var(--primary)">${a(s.rank)}</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:6px; padding:0 10px;">
                    <span>基线校正 ${a(s.baselineAdjustment)} · 覆盖 ${a(s.baselineCoverage)}</span>
                    <span>稳定 ${a(s.sampleStability)} · 转化 ${a(s.conversionScore)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:14px; padding:0 10px;">
                    <span>${a(s.sampleSummary)}</span>
                    <span>${a(s.focusSummary)} · ${a(s.conversionSummary)}</span>
                </div>
                <button class="view-details-btn" onclick='showTeacherDetails(${JSON.stringify(s.name)}, ${JSON.stringify(s.subject)})'>查看详情</button>
            </div>
        `).join("")}}function U(){const n=A(),l=(n==null?void 0:n.role)||"guest",d=l==="teacher"||l==="class_teacher"?B(n):null,e=document.getElementById("teacher-township-ranking-container"),v=document.getElementById("side-nav-teacher-ranks-container");if(v&&(v.innerHTML=""),!e)return;if(!window.TOWNSHIP_RANKING_DATA||!Object.keys(window.TOWNSHIP_RANKING_DATA).length){e.innerHTML='<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';return}const p=new Set(typeof window.getTownshipManagedSchoolNames=="function"?window.getTownshipManagedSchoolNames(Object.keys(window.SCHOOLS||{})):Object.keys(window.SCHOOLS||{})),s={};(window.SUBJECTS||[]).forEach(r=>{if(d&&d.size>0&&!d.has(F(r)))return;let g=0,f=0,w=0,u=0;Object.keys(window.SCHOOLS||{}).forEach(i=>{var m,y,h;const c=(h=(y=(m=window.SCHOOLS)==null?void 0:m[i])==null?void 0:y.metrics)==null?void 0:h[r];!c||i===window.MY_SCHOOL||p.size&&!p.has(i)||(g+=o(c.avg,0),f+=o(c.excRate,0),w+=o(c.passRate,0),u+=1)}),u>0&&(s[r]={avg:g/u,excRate:f/u,passRate:w/u})});let t="";if((window.SUBJECTS||[]).forEach(r=>{var i;if(d&&d.size>0&&!d.has(F(r)))return;const g=(i=window.TOWNSHIP_RANKING_DATA)==null?void 0:i[r];if(!(g!=null&&g.length))return;const f=s[r]||{avg:0,excRate:0,passRate:0};let w="";g.forEach(c=>{const m=f.avg?((c.avg-f.avg)/f.avg*100).toFixed(2):"0.00",y=f.excRate?((c.excellentRate-f.excRate)/f.excRate*100).toFixed(2):"0.00",h=f.passRate?((c.passRate-f.passRate)/f.passRate*100).toFixed(2):"0.00",T=c.type==="teacher"?"text-blue":"",b=c.type==="teacher"?"analysis-row-emphasis":"",C=c.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school",R=c.type==="teacher"?"教师":"学校";w+=`
                    <tr class="${b}">
                        <td data-label="教师/学校" class="${T}">${a(c.name)}</td>
                        <td data-label="类型"><span class="${C}">${R}</span></td>
                        <td data-label="平均分">${z(c.avg,c.rankAvg,"teacher")}</td>
                        <td data-label="与镇均比" class="${o(m,0)>=0?"positive-percent":"negative-percent"}">${o(m,0)>=0?"+":""}${m}%</td>
                        <td data-label="镇排">${a(c.rankAvg)}</td>
                        <td data-label="优秀率">${z(c.excellentRate,c.rankExc,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${o(y,0)>=0?"positive-percent":"negative-percent"}">${o(y,0)>=0?"+":""}${y}%</td>
                        <td data-label="镇排">${a(c.rankExc)}</td>
                        <td data-label="及格率">${z(c.passRate,c.rankPass,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${o(h,0)>=0?"positive-percent":"negative-percent"}">${o(h,0)>=0?"+":""}${h}%</td>
                        <td data-label="镇排">${a(c.rankPass)}</td>
                    </tr>
                `});const u=`rank-anchor-${r}`;if(t+=`
                <div id="${u}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>${a(r)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${a(g.length)} 条</span>
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
                            <tbody>${w}</tbody>
                        </table>
                    </div>
                </div>
            `,v){const c=document.createElement("a");c.className="side-nav-sub-link",c.innerText=r,c.onclick=()=>{typeof window.scrollToSubAnchor=="function"&&window.scrollToSubAnchor(u,c)},v.appendChild(c)}}),!t){e.innerHTML='<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';return}e.innerHTML=t}function S(n,l="暂无"){const d=(n||[]).slice(0,8);return d.length?d.map(e=>`${e.name}${e.className?`(${e.className})`:""}${Number.isFinite(e.score)?` ${e.score}`:""}`).join("、"):l}function j(){const n=document.getElementById("teacherComparisonTable"),l=E();if(!n)return;if(!Object.keys(l).length){n.innerHTML='<p style="text-align:center; color:#666;">暂无教师统计数据</p>';return}const d={};Object.keys(l).forEach(p=>{Object.keys(l[p]||{}).forEach(s=>{d[s]||(d[s]=[]),d[s].push({teacher:p,data:l[p][s]})})});let v=`
            <thead>
                <tr>
                    <th rowspan="2">教师</th>
                    <th rowspan="2">班级</th>
                    <th rowspan="2">实考</th>
                    <th rowspan="2">共同样本</th>
                    <th rowspan="2">样本变动</th>
                    <th rowspan="2">均分</th>
                    <th rowspan="2" title="按系统现有两率一分标准折算，同校同学科比较">联考赋分(${_().total})</th>
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
        `;Object.keys(d).sort(N).forEach(p=>{v+=`<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${a(p)}</td></tr>`,d[p].sort((s,t)=>o(t.data.fairScore,0)-o(s.data.fairScore,0)).forEach(s=>{var m,y,h,T;const t=s.data,r=o(t.baselineAdjustment,0)>=0?"text-green":"text-red",g=o(t.lowRate,0)>=.12?"color:#dc2626; font-weight:700;":"color:#334155;",f=t.sampleWarning?"color:#b45309; font-weight:700;":"color:#334155;",w=[`培优: ${(((m=t.focusTargets)==null?void 0:m.excellentEdges)||[]).slice(0,6).map(b=>`${b.name}(${b.score})`).join("、")||"暂无"}`,`临界: ${(((y=t.focusTargets)==null?void 0:y.passEdges)||[]).slice(0,6).map(b=>`${b.name}(${b.score})`).join("、")||"暂无"}`,`辅差: ${(((h=t.focusTargets)==null?void 0:h.lowRisk)||[]).slice(0,6).map(b=>`${b.name}(${b.score})`).join("、")||"暂无"}`].join(" | "),u=`基线覆盖 ${t.baselineCoverageText||"0%"}；预计均分 ${o(t.expectedAvg,0).toFixed(2)}；预计优率 ${x(t.expectedExcellentRate,1)}；预计及格率 ${x(t.expectedPassRate,1)}；预计低分率 ${x(t.expectedLowRate,1)}；任课连续性 ${t.teacherContinuityText||"任课连续"}${t.baselineExamId?`；基线 ${t.baselineExamId}`:""}`,i=(t.previousSampleCount||0)>0?`新增 ${t.addedSampleCount||0} / 缺考退出 ${t.exitedSampleCount||0}`:"暂无基线",c=`${o(t.conversionScore,50).toFixed(1)}${o(t.conversionAdjustment,0)?` (${$(t.conversionAdjustment,1)})`:""}`;v+=`
                        <tr>
                            <td><strong>${a(s.teacher)}</strong></td>
                            <td>${a(t.classesText||t.classes||"-")}</td>
                            <td>${a(t.studentCount)}</td>
                            <td title="${a(t.sampleDetailText||"")}" style="${f}">
                                <div>${a((t.previousSampleCount||0)>0?t.commonSampleCount||0:"—")}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${a((t.previousSampleCount||0)>0?t.sampleStabilityText||"0%":"待历史样本")}</div>
                            </td>
                            <td title="${a(t.sampleDetailText||"")}" style="${f}">
                                <div>${a(i)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${a(t.previousSampleCount||0)}</div>
                            </td>
                            <td style="font-weight:700;">${a(t.avg)}</td>
                            <td title="${a(`均分赋分 ${o(t.ratedAvg,0).toFixed(1)}，优率赋分 ${o(t.ratedExc,0).toFixed(1)}，及格赋分 ${o(t.ratedPass,0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${o(t.leagueScoreRaw,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${o(t.leagueScore,0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${r}" title="${a(u)}" style="font-weight:700;">
                                <div>${$(t.baselineAdjustment,1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${a(t.baselineCoverageText||"0%")}</div>
                            </td>
                            <td>${x(t.excellentRate,1)}</td>
                            <td>${x(t.passRate,1)}</td>
                            <td style="${g}">${x(t.lowRate,1)}</td>
                            <td title="${a(`${t.conversionSummary||"暂无转化样本"}；${((T=t.conversionMetrics)==null?void 0:T.detail)||""}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${c}</div>
                                <div style="font-size:11px; color:#64748b;">${a(t.conversionSummary||"暂无转化")}</div>
                            </td>
                            <td title="${a(w)}" style="font-size:12px;">${a(t.focusSummary||"培优0 / 临界0 / 辅差0")}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${o(t.fairScore,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${a(t.fairRank||"-")} 名</div>
                            </td>
                        </tr>
                    `})}),v+="</tbody>",n.classList.add("comparison-table"),n.innerHTML=v,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(n.closest(".section")||n)}function O(){return typeof window.ensureLazySectionLoaded=="function"&&window.ensureLazySectionLoaded("teacherModal"),document.getElementById("teacherModal")}function M(){if(window.__TEACHER_ANALYSIS_MODAL_BOUND__)return!0;const n=O(),l=document.getElementById("closeModal");return!n||!l?!1:(l.addEventListener("click",()=>{const d=document.getElementById("teacherModal");d&&(d.style.display="none")}),window.addEventListener("click",d=>{const e=document.getElementById("teacherModal");e&&d.target===e&&(e.style.display="none")}),window.__TEACHER_ANALYSIS_MODAL_BOUND__=!0,!0)}function H(n,l){var T,b,C,R;const d=E(),e=d[n]?d[n][l]:null;if(!e){window.UI&&window.UI.toast("当前筛选范围下暂无该教师该学科数据","warning");return}M();const v=O(),p=document.getElementById("modalSubjectTable"),s=document.getElementById("modalAvgProgress");if(!v||!p||!s)return;const t=document.getElementById("modalTeacherName"),r=document.getElementById("modalAvgScore"),g=document.getElementById("modalExcellentRate"),f=document.getElementById("modalPassRate"),w=document.getElementById("modalAvgComparison");t&&(t.textContent=`${n} - ${l} 教学详情`),r&&(r.textContent=e.avg),g&&(g.textContent=x(e.excellentRate,1)),f&&(f.textContent=x(e.passRate,1));const u=o(e.expectedAvg,0),i=u>0?(o(e.avgValue,0)-u)/u*100:0;w&&(w.textContent=`${i>=0?"+":""}${i.toFixed(1)}%`);const c=Math.min(Math.max(50+i,0),100);s.style.width=`${c}%`,s.className=i>=0?"progress-good":"progress-poor",s.style.backgroundColor=i>=0?"#22c55e":"#ef4444";const m=p.querySelector("thead"),y=p.querySelector("tbody");m&&(m.innerHTML=`
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
                    <td>${a(l)}</td>
                    <td>${o(e.avgValue,0).toFixed(2)}</td>
                    <td>${o(e.expectedAvg,0).toFixed(2)}</td>
                    <td>${x(e.excellentRate,1)} / ${x(e.expectedExcellentRate,1)}</td>
                    <td>${x(e.passRate,1)} / ${x(e.expectedPassRate,1)}</td>
                    <td>${x(e.lowRate,1)} / ${x(e.expectedLowRate,1)}</td>
                    <td class="${o(e.baselineAdjustment,0)>=0?"positive-percent":"negative-percent"}">${$(e.baselineAdjustment,1)}</td>
                </tr>
            `);let h=document.getElementById("teacherModalExtra");!h&&p.parentNode&&(h=document.createElement("div"),h.id="teacherModalExtra",h.style.marginBottom="16px",p.parentNode.insertBefore(h,p)),h&&(h.innerHTML=`
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">联考赋分</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${o(e.leagueScoreRaw,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">折算 ${o(e.leagueScore,0).toFixed(1)} / 100</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">基线校正</div>
                        <div style="font-size:22px; font-weight:800; color:${o(e.baselineAdjustment,0)>=0?"#15803d":"#dc2626"};">${$(e.baselineAdjustment,1)}</div>
                        <div style="font-size:12px; color:#64748b;">覆盖 ${a(e.baselineCoverageText||"0%")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">公平绩效分</div>
                        <div style="font-size:22px; font-weight:800; color:#b45309;">${o(e.fairScore,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">同科第 ${a(e.fairRank||"-")} 名</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">置信 / 工作量</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${o(e.confidenceFactor,1).toFixed(2)}</div>
                        <div style="font-size:12px; color:#64748b;">工作量修正 ${$(e.workloadAdjustment,1)}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">共同样本</div>
                        <div style="font-size:22px; font-weight:800; color:${e.sampleWarning?"#b45309":"#0f172a"};">${a((e.previousSampleCount||0)>0?e.commonSampleCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">稳定 ${a((e.previousSampleCount||0)>0?e.sampleStabilityText||"0%":"待历史样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">样本变动</div>
                        <div style="font-size:22px; font-weight:800; color:${e.sampleWarning?"#b45309":"#0f172a"};">${a((e.previousSampleCount||0)>0?e.sampleShiftCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">${a((e.previousSampleCount||0)>0?`新增 ${e.addedSampleCount||0} · 缺考退出 ${e.exitedSampleCount||0}`:"暂无基线样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">转化分</div>
                        <div style="font-size:22px; font-weight:800; color:#0369a1;">${o(e.conversionScore,50).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">${a(e.conversionSummary||"暂无转化样本")}${o(e.conversionAdjustment,0)?` · 调整 ${$(e.conversionAdjustment,1)}`:""}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">换老师保护</div>
                        <div style="font-size:22px; font-weight:800; color:${e.teacherChangeProtected?"#b45309":"#0f172a"};">${a(e.teacherChangeProtected?"已冻结":"正常")}</div>
                        <div style="font-size:12px; color:#64748b;">${a(e.teacherContinuityText||"任课连续")}</div>
                    </div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px; background:#f8fafc;">
                    <div style="font-size:13px; font-weight:700; color:#334155; margin-bottom:10px;">培优 / 辅差名单</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                        <div>
                            <div style="font-size:12px; color:#0f766e; font-weight:700; margin-bottom:4px;">培优边缘生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${a(S((T=e.focusTargets)==null?void 0:T.excellentEdges,"暂无培优边缘生"))}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:#1d4ed8; font-weight:700; margin-bottom:4px;">及格临界生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${a(S((b=e.focusTargets)==null?void 0:b.passEdges,"暂无及格临界生"))}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:#b45309; font-weight:700; margin-bottom:4px;">辅差关注生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${a(S((C=e.focusTargets)==null?void 0:C.lowRisk,"暂无辅差关注生"))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${a(e.sampleDetailText||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${a(((R=e.conversionMetrics)==null?void 0:R.detail)||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${a(e.baselineExamId?`历史基线：${e.baselineExamId}`:"未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。")}</div>
                </div>
            `),v.style.display="flex"}function P(){const n=A(),l=(n==null?void 0:n.role)||"guest",d=l==="teacher"||l==="class_teacher"?E():window.TEACHER_STATS||{};if(!Object.keys(d).length){alert("请先进行教师分析");return}const e=new Set;Object.values(d).forEach(r=>Object.keys(r||{}).forEach(g=>e.add(g)));const v=window.XLSX.utils.book_new(),p=_(),s={};Object.keys(d).forEach(r=>{Object.keys(d[r]||{}).forEach(g=>{s[g]||(s[g]=[]),s[g].push({teacherName:r,data:d[r][g]})})}),Object.keys(s).sort(N).forEach(r=>{const g=s[r].sort((u,i)=>o(i.data.fairScore,0)-o(u.data.fairScore,0)),f=[["教师姓名","学科","任教班级","人数","均分",`联考赋分(${p.total})`,"联考赋分(折算100)","基线校正","基线覆盖","上次样本","共同样本","新增样本","缺考/退出","样本稳定度","任课连续性","转化分","转化调整","预计均分","优秀率","预计优秀率","及格率","预计及格率","低分率","预计低分率","工作量修正","置信系数","公平绩效分","同科排名","培优边缘生","及格临界生","辅差关注生"]];g.forEach(({teacherName:u,data:i})=>{var c,m,y;f.push([u,r,i.classesText||i.classes||"",i.studentCount,window.getExcelNum(o(i.avgValue,0)),window.getExcelNum(o(i.leagueScoreRaw,0)),window.getExcelNum(o(i.leagueScore,0)),window.getExcelNum(o(i.baselineAdjustment,0)),i.baselineCoverageText||"0%",i.previousSampleCount||0,i.commonSampleCount||0,i.addedSampleCount||0,i.exitedSampleCount||0,i.sampleStabilityText||"0%",i.teacherContinuityText||"",window.getExcelNum(o(i.conversionScore,50)),window.getExcelNum(o(i.conversionAdjustment,0)),window.getExcelNum(o(i.expectedAvg,0)),window.getExcelPercent(o(i.excellentRate,0)),window.getExcelPercent(o(i.expectedExcellentRate,0)),window.getExcelPercent(o(i.passRate,0)),window.getExcelPercent(o(i.expectedPassRate,0)),window.getExcelPercent(o(i.lowRate,0)),window.getExcelPercent(o(i.expectedLowRate,0)),window.getExcelNum(o(i.workloadAdjustment,0)),window.getExcelNum(o(i.confidenceFactor,1)),window.getExcelNum(o(i.fairScore,0)),i.fairRank||"",S((c=i.focusTargets)==null?void 0:c.excellentEdges,""),S((m=i.focusTargets)==null?void 0:m.passEdges,""),S((y=i.focusTargets)==null?void 0:y.lowRisk,"")])});const w=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName(r,"公平绩效"):String(r||"Sheet").slice(0,31);window.XLSX.utils.book_append_sheet(v,window.XLSX.utils.aoa_to_sheet(f),w)});const t=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(n,e):new Date().toISOString().slice(0,10);window.XLSX.writeFile(v,`教师公平绩效明细_${t}.xlsx`)}M(),Object.assign(window,{renderTeacherTownshipRanking:U,teacherBuildCardList:L,teacherFormatFocusList:S,renderTeacherCards:I,renderTeacherCardsV2:I,calculatePerformanceLevel:k,calculatePerformanceLevelV2:k,renderTeacherComparisonTable:j,renderTeacherComparisonTableV2:j,showTeacherDetails:H,showTeacherDetailsV2:H,exportTeacherComparisonExcel:P,exportTeacherComparisonExcelV2:P}),window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__=!0})();
