(()=>{if(typeof window=="undefined"||window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__)return;const t=typeof window.teacherToNumber=="function"?window.teacherToNumber:((n,r=0)=>{const l=Number(n);return Number.isFinite(l)?l:r}),x=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((n,r=1)=>`${(t(n,0)*100).toFixed(r)}%`),S=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((n,r=1)=>{const l=t(n,0);return`${l>=0?"+":""}${l.toFixed(r)}`}),s=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(n=>String(n!=null?n:"").replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])),_=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>({avg:60,exc:70,pass:70,total:200})),A=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var n;return((n=window.Auth)==null?void 0:n.currentUser)||null}),F=typeof window.normalizeSubject=="function"?window.normalizeSubject:(n=>String(n||"").trim()),L=typeof window.sortSubjects=="function"?window.sortSubjects:((n,r)=>String(n||"").localeCompare(String(r||""),"zh-Hans-CN")),z=typeof window.formatRankDisplay=="function"?window.formatRankDisplay:((n,r,l="school",e=!1)=>`${e?`${(t(n,0)*100).toFixed(2)}%`:t(n,0).toFixed(2)} <span style="font-size:0.9em; color:#94a3b8">(${r})</span>`);function E(){return typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats():window.TEACHER_STATS||{}}function B(n){return typeof window.getVisibleSubjectsForTeacherUser=="function"?window.getVisibleSubjectsForTeacherUser(n):null}function k(n){const r=t(n==null?void 0:n.fairScore,(n==null?void 0:n.finalScore)||0),l=t(n==null?void 0:n.baselineAdjustment,0);return r>=85&&l>=0?{class:"performance-excellent",text:"优秀"}:r>=75?{class:"performance-good",text:"良好"}:r>=65?{class:"performance-average",text:"稳健"}:{class:"performance-poor",text:"待改进"}}function N(n,r,l="",e="guest"){const v=[];Object.keys(n||{}).forEach(a=>{Object.keys(n[a]||{}).forEach(o=>{var w,f;const d=n[a][o],u=k(d),g=((f=(w=r==null?void 0:r[a])==null?void 0:w[o])==null?void 0:f.rank)||"-";v.push({id:`${a}-${o}`,name:a,subject:o,classes:d.classesText||d.classes||"",avg:d.avg,fairScore:t(d.fairScore,0).toFixed(1),leagueScoreRaw:t(d.leagueScoreRaw,0).toFixed(1),leagueScore:t(d.leagueScore,0).toFixed(1),baselineAdjustment:S(d.baselineAdjustment,1),baselineCoverage:d.baselineCoverageText||"0%",sampleSummary:d.sampleSummary||"共同样本待识别",sampleStability:d.sampleStabilityText||"0%",conversionSummary:d.conversionSummary||"暂无转化样本",conversionScore:t(d.conversionScore,50).toFixed(1),excRate:x(d.excellentRate,1),passRate:x(d.passRate,1),lowRate:x(d.lowRate,1),focusSummary:d.focusSummary||"培优0 / 临界0 / 辅差0",count:d.studentCount,rank:g,badgeClass:u.class,badgeText:u.text})})});const p=String(l||"").replace(/\s+/g,"").toLowerCase();return v.sort((a,o)=>{if((e==="teacher"||e==="class_teacher")&&p){const g=String(a.name||"").replace(/\s+/g,"").toLowerCase(),w=String(o.name||"").replace(/\s+/g,"").toLowerCase(),f=g===p||g.startsWith(`${p}(`)||g.startsWith(`${p}（`),i=w===p||w.startsWith(`${p}(`)||w.startsWith(`${p}（`);if(f!==i)return f?-1:1}const d=t(o.fairScore,0)-t(a.fairScore,0);if(d!==0)return d;const u=t(o.leagueScore,0)-t(a.leagueScore,0);return u!==0?u:String(a.name||"").localeCompare(String(o.name||""),"zh-Hans-CN")}),v}function O(){const n=document.getElementById("teacherCardsContainer"),r=A(),l=(r==null?void 0:r.role)||"guest",e=E(),v=window.TEACHER_TOWNSHIP_RANKINGS||{},p=N(e,v,(r==null?void 0:r.name)||"",l);try{if(window.Alpine&&typeof window.Alpine.store=="function"){const a=window.Alpine.store("teacherData");a&&(a.list=p)}}catch(a){console.warn("teacherData store update skipped:",a)}if(n){if(!p.length){n.innerHTML=`
                <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">
                    暂无教师数据，请先完成任课表同步和成绩导入。
                    <div style="margin-top:10px;">
                        <button class="btn btn-orange" onclick="openTeacherSync()">去同步任课表</button>
                    </div>
                </div>
            `;return}n.innerHTML=p.map(a=>`
            <div class="teacher-card">
                <div class="teacher-header">
                    <div>
                        <div class="teacher-name">${s(a.name)} - ${s(a.subject)}</div>
                        <div class="teacher-classes">${s(a.classes)}班</div>
                    </div>
                    <div class="performance-badge ${s(a.badgeClass)}">${s(a.badgeText)}</div>
                </div>
                <div class="teacher-stats">
                    <div class="stat-item">
                        <div class="stat-value">${s(a.avg)}</div>
                        <div class="stat-label">均分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${s(a.leagueScoreRaw)}</div>
                        <div class="stat-label">联考赋分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${s(a.fairScore)}</div>
                        <div class="stat-label">公平绩效</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; padding:0 10px;">
                    <span>优/及/低: ${s(a.excRate)} / ${s(a.passRate)} / ${s(a.lowRate)}</span>
                    <span>镇排: <strong style="color:var(--primary)">${s(a.rank)}</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:6px; padding:0 10px;">
                    <span>基线校正 ${s(a.baselineAdjustment)} · 覆盖 ${s(a.baselineCoverage)}</span>
                    <span>稳定 ${s(a.sampleStability)} · 转化 ${s(a.conversionScore)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:14px; padding:0 10px;">
                    <span>${s(a.sampleSummary)}</span>
                    <span>${s(a.focusSummary)} · ${s(a.conversionSummary)}</span>
                </div>
                <button class="view-details-btn" onclick='showTeacherDetails(${JSON.stringify(a.name)}, ${JSON.stringify(a.subject)})'>查看详情</button>
            </div>
        `).join("")}}function U(){const n=A(),r=(n==null?void 0:n.role)||"guest",l=r==="teacher"||r==="class_teacher"?B(n):null,e=document.getElementById("teacher-township-ranking-container"),v=document.getElementById("side-nav-teacher-ranks-container");if(v&&(v.innerHTML=""),!e)return;if(!window.TOWNSHIP_RANKING_DATA||!Object.keys(window.TOWNSHIP_RANKING_DATA).length){e.innerHTML='<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';return}const p=typeof window.getTownshipManagedSchoolNames=="function",a=new Set(p?window.getTownshipManagedSchoolNames(Object.keys(window.SCHOOLS||{})):Object.keys(window.SCHOOLS||{})),o=g=>p?typeof window.isTownshipManagedSchool=="function"?window.isTownshipManagedSchool(g,Object.keys(window.SCHOOLS||{})):a.has(String(g||"").trim()):!0,d={};(window.SUBJECTS||[]).forEach(g=>{if(l&&l.size>0&&!l.has(F(g)))return;let w=0,f=0,i=0,y=0;Object.keys(window.SCHOOLS||{}).forEach(b=>{var m,$,h;const c=(h=($=(m=window.SCHOOLS)==null?void 0:m[b])==null?void 0:$.metrics)==null?void 0:h[g];!c||b===window.MY_SCHOOL||!o(b)||(w+=t(c.avg,0),f+=t(c.excRate,0),i+=t(c.passRate,0),y+=1)}),y>0&&(d[g]={avg:w/y,excRate:f/y,passRate:i/y})});let u="";if((window.SUBJECTS||[]).forEach(g=>{var b;if(l&&l.size>0&&!l.has(F(g)))return;const w=(b=window.TOWNSHIP_RANKING_DATA)==null?void 0:b[g];if(!(w!=null&&w.length))return;const f=d[g]||{avg:0,excRate:0,passRate:0};let i="";w.forEach(c=>{const m=f.avg?((c.avg-f.avg)/f.avg*100).toFixed(2):"0.00",$=f.excRate?((c.excellentRate-f.excRate)/f.excRate*100).toFixed(2):"0.00",h=f.passRate?((c.passRate-f.passRate)/f.passRate*100).toFixed(2):"0.00",C=c.type==="teacher"?"text-blue":"",R=c.type==="teacher"?"analysis-row-emphasis":"",V=c.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school",W=c.type==="teacher"?"教师":"学校";i+=`
                    <tr class="${R}">
                        <td data-label="教师/学校" class="${C}">${s(c.name)}</td>
                        <td data-label="类型"><span class="${V}">${W}</span></td>
                        <td data-label="平均分">${z(c.avg,c.rankAvg,"teacher")}</td>
                        <td data-label="与镇均比" class="${t(m,0)>=0?"positive-percent":"negative-percent"}">${t(m,0)>=0?"+":""}${m}%</td>
                        <td data-label="镇排">${s(c.rankAvg)}</td>
                        <td data-label="优秀率">${z(c.excellentRate,c.rankExc,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${t($,0)>=0?"positive-percent":"negative-percent"}">${t($,0)>=0?"+":""}${$}%</td>
                        <td data-label="镇排">${s(c.rankExc)}</td>
                        <td data-label="及格率">${z(c.passRate,c.rankPass,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${t(h,0)>=0?"positive-percent":"negative-percent"}">${t(h,0)>=0?"+":""}${h}%</td>
                        <td data-label="镇排">${s(c.rankPass)}</td>
                    </tr>
                `});const y=`rank-anchor-${g}`;if(u+=`
                <div id="${y}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>${s(g)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${s(w.length)} 条</span>
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
                            <tbody>${i}</tbody>
                        </table>
                    </div>
                </div>
            `,v){const c=document.createElement("a");c.className="side-nav-sub-link",c.innerText=g,c.onclick=()=>{typeof window.scrollToSubAnchor=="function"&&window.scrollToSubAnchor(y,c)},v.appendChild(c)}}),!u){e.innerHTML='<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';return}e.innerHTML=u}function T(n,r="暂无"){const l=(n||[]).slice(0,8);return l.length?l.map(e=>`${e.name}${e.className?`(${e.className})`:""}${Number.isFinite(e.score)?` ${e.score}`:""}`).join("、"):r}function j(){const n=document.getElementById("teacherComparisonTable"),r=E();if(!n)return;if(!Object.keys(r).length){n.innerHTML='<p style="text-align:center; color:#666;">暂无教师统计数据</p>';return}const l={};Object.keys(r).forEach(p=>{Object.keys(r[p]||{}).forEach(a=>{l[a]||(l[a]=[]),l[a].push({teacher:p,data:r[p][a]})})});let v=`
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
        `;Object.keys(l).sort(L).forEach(p=>{v+=`<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${s(p)}</td></tr>`,l[p].sort((a,o)=>t(o.data.fairScore,0)-t(a.data.fairScore,0)).forEach(a=>{var b,c,m,$;const o=a.data,d=t(o.baselineAdjustment,0)>=0?"text-green":"text-red",u=t(o.lowRate,0)>=.12?"color:#dc2626; font-weight:700;":"color:#334155;",g=o.sampleWarning?"color:#b45309; font-weight:700;":"color:#334155;",w=[`培优: ${(((b=o.focusTargets)==null?void 0:b.excellentEdges)||[]).slice(0,6).map(h=>`${h.name}(${h.score})`).join("、")||"暂无"}`,`临界: ${(((c=o.focusTargets)==null?void 0:c.passEdges)||[]).slice(0,6).map(h=>`${h.name}(${h.score})`).join("、")||"暂无"}`,`辅差: ${(((m=o.focusTargets)==null?void 0:m.lowRisk)||[]).slice(0,6).map(h=>`${h.name}(${h.score})`).join("、")||"暂无"}`].join(" | "),f=`基线覆盖 ${o.baselineCoverageText||"0%"}；预计均分 ${t(o.expectedAvg,0).toFixed(2)}；预计优率 ${x(o.expectedExcellentRate,1)}；预计及格率 ${x(o.expectedPassRate,1)}；预计低分率 ${x(o.expectedLowRate,1)}；任课连续性 ${o.teacherContinuityText||"任课连续"}${o.baselineExamId?`；基线 ${o.baselineExamId}`:""}`,i=(o.previousSampleCount||0)>0?`新增 ${o.addedSampleCount||0} / 缺考退出 ${o.exitedSampleCount||0}`:"暂无基线",y=`${t(o.conversionScore,50).toFixed(1)}${t(o.conversionAdjustment,0)?` (${S(o.conversionAdjustment,1)})`:""}`;v+=`
                        <tr>
                            <td><strong>${s(a.teacher)}</strong></td>
                            <td>${s(o.classesText||o.classes||"-")}</td>
                            <td>${s(o.studentCount)}</td>
                            <td title="${s(o.sampleDetailText||"")}" style="${g}">
                                <div>${s((o.previousSampleCount||0)>0?o.commonSampleCount||0:"—")}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${s((o.previousSampleCount||0)>0?o.sampleStabilityText||"0%":"待历史样本")}</div>
                            </td>
                            <td title="${s(o.sampleDetailText||"")}" style="${g}">
                                <div>${s(i)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${s(o.previousSampleCount||0)}</div>
                            </td>
                            <td style="font-weight:700;">${s(o.avg)}</td>
                            <td title="${s(`均分赋分 ${t(o.ratedAvg,0).toFixed(1)}，优率赋分 ${t(o.ratedExc,0).toFixed(1)}，及格赋分 ${t(o.ratedPass,0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${t(o.leagueScoreRaw,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${t(o.leagueScore,0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${d}" title="${s(f)}" style="font-weight:700;">
                                <div>${S(o.baselineAdjustment,1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${s(o.baselineCoverageText||"0%")}</div>
                            </td>
                            <td>${x(o.excellentRate,1)}</td>
                            <td>${x(o.passRate,1)}</td>
                            <td style="${u}">${x(o.lowRate,1)}</td>
                            <td title="${s(`${o.conversionSummary||"暂无转化样本"}；${(($=o.conversionMetrics)==null?void 0:$.detail)||""}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${y}</div>
                                <div style="font-size:11px; color:#64748b;">${s(o.conversionSummary||"暂无转化")}</div>
                            </td>
                            <td title="${s(w)}" style="font-size:12px;">${s(o.focusSummary||"培优0 / 临界0 / 辅差0")}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${t(o.fairScore,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${s(o.fairRank||"-")} 名</div>
                            </td>
                        </tr>
                    `})}),v+="</tbody>",n.classList.add("comparison-table"),n.innerHTML=v,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(n.closest(".section")||n)}function I(){return typeof window.ensureLazySectionLoaded=="function"&&window.ensureLazySectionLoaded("teacherModal"),document.getElementById("teacherModal")}function M(){if(window.__TEACHER_ANALYSIS_MODAL_BOUND__)return!0;const n=I(),r=document.getElementById("closeModal");return!n||!r?!1:(r.addEventListener("click",()=>{const l=document.getElementById("teacherModal");l&&(l.style.display="none")}),window.addEventListener("click",l=>{const e=document.getElementById("teacherModal");e&&l.target===e&&(e.style.display="none")}),window.__TEACHER_ANALYSIS_MODAL_BOUND__=!0,!0)}function H(n,r){var $,h,C,R;const l=E(),e=l[n]?l[n][r]:null;if(!e){window.UI&&window.UI.toast("当前筛选范围下暂无该教师该学科数据","warning");return}M();const v=I(),p=document.getElementById("modalSubjectTable"),a=document.getElementById("modalAvgProgress");if(!v||!p||!a)return;const o=document.getElementById("modalTeacherName"),d=document.getElementById("modalAvgScore"),u=document.getElementById("modalExcellentRate"),g=document.getElementById("modalPassRate"),w=document.getElementById("modalAvgComparison");o&&(o.textContent=`${n} - ${r} 教学详情`),d&&(d.textContent=e.avg),u&&(u.textContent=x(e.excellentRate,1)),g&&(g.textContent=x(e.passRate,1));const f=t(e.expectedAvg,0),i=f>0?(t(e.avgValue,0)-f)/f*100:0;w&&(w.textContent=`${i>=0?"+":""}${i.toFixed(1)}%`);const y=Math.min(Math.max(50+i,0),100);a.style.width=`${y}%`,a.className=i>=0?"progress-good":"progress-poor",a.style.backgroundColor=i>=0?"#22c55e":"#ef4444";const b=p.querySelector("thead"),c=p.querySelector("tbody");b&&(b.innerHTML=`
                <tr>
                    <th>学科</th>
                    <th>实际均分</th>
                    <th>预计均分</th>
                    <th>优秀率(实/预)</th>
                    <th>及格率(实/预)</th>
                    <th>低分率(实/预)</th>
                    <th>基线校正</th>
                </tr>
            `),c&&(c.innerHTML=`
                <tr>
                    <td>${s(r)}</td>
                    <td>${t(e.avgValue,0).toFixed(2)}</td>
                    <td>${t(e.expectedAvg,0).toFixed(2)}</td>
                    <td>${x(e.excellentRate,1)} / ${x(e.expectedExcellentRate,1)}</td>
                    <td>${x(e.passRate,1)} / ${x(e.expectedPassRate,1)}</td>
                    <td>${x(e.lowRate,1)} / ${x(e.expectedLowRate,1)}</td>
                    <td class="${t(e.baselineAdjustment,0)>=0?"positive-percent":"negative-percent"}">${S(e.baselineAdjustment,1)}</td>
                </tr>
            `);let m=document.getElementById("teacherModalExtra");!m&&p.parentNode&&(m=document.createElement("div"),m.id="teacherModalExtra",m.style.marginBottom="16px",p.parentNode.insertBefore(m,p)),m&&(m.innerHTML=`
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">联考赋分</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${t(e.leagueScoreRaw,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">折算 ${t(e.leagueScore,0).toFixed(1)} / 100</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">基线校正</div>
                        <div style="font-size:22px; font-weight:800; color:${t(e.baselineAdjustment,0)>=0?"#15803d":"#dc2626"};">${S(e.baselineAdjustment,1)}</div>
                        <div style="font-size:12px; color:#64748b;">覆盖 ${s(e.baselineCoverageText||"0%")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">公平绩效分</div>
                        <div style="font-size:22px; font-weight:800; color:#b45309;">${t(e.fairScore,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">同科第 ${s(e.fairRank||"-")} 名</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">置信 / 工作量</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${t(e.confidenceFactor,1).toFixed(2)}</div>
                        <div style="font-size:12px; color:#64748b;">工作量修正 ${S(e.workloadAdjustment,1)}</div>
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
                        <div style="font-size:22px; font-weight:800; color:#0369a1;">${t(e.conversionScore,50).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">${s(e.conversionSummary||"暂无转化样本")}${t(e.conversionAdjustment,0)?` · 调整 ${S(e.conversionAdjustment,1)}`:""}</div>
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
                            <div style="font-size:12px; color:#0f766e; font-weight:700; margin-bottom:4px;">培优边缘生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${s(T(($=e.focusTargets)==null?void 0:$.excellentEdges,"暂无培优边缘生"))}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:#1d4ed8; font-weight:700; margin-bottom:4px;">及格临界生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${s(T((h=e.focusTargets)==null?void 0:h.passEdges,"暂无及格临界生"))}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:#b45309; font-weight:700; margin-bottom:4px;">辅差关注生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${s(T((C=e.focusTargets)==null?void 0:C.lowRisk,"暂无辅差关注生"))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${s(e.sampleDetailText||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${s(((R=e.conversionMetrics)==null?void 0:R.detail)||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${s(e.baselineExamId?`历史基线：${e.baselineExamId}`:"未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。")}</div>
                </div>
            `),v.style.display="flex"}function P(){const n=A(),r=(n==null?void 0:n.role)||"guest",l=r==="teacher"||r==="class_teacher"?E():window.TEACHER_STATS||{};if(!Object.keys(l).length){alert("请先进行教师分析");return}const e=new Set;Object.values(l).forEach(d=>Object.keys(d||{}).forEach(u=>e.add(u)));const v=window.XLSX.utils.book_new(),p=_(),a={};Object.keys(l).forEach(d=>{Object.keys(l[d]||{}).forEach(u=>{a[u]||(a[u]=[]),a[u].push({teacherName:d,data:l[d][u]})})}),Object.keys(a).sort(L).forEach(d=>{const u=a[d].sort((f,i)=>t(i.data.fairScore,0)-t(f.data.fairScore,0)),g=[["教师姓名","学科","任教班级","人数","均分",`联考赋分(${p.total})`,"联考赋分(折算100)","基线校正","基线覆盖","上次样本","共同样本","新增样本","缺考/退出","样本稳定度","任课连续性","转化分","转化调整","预计均分","优秀率","预计优秀率","及格率","预计及格率","低分率","预计低分率","工作量修正","置信系数","公平绩效分","同科排名","培优边缘生","及格临界生","辅差关注生"]];u.forEach(({teacherName:f,data:i})=>{var y,b,c;g.push([f,d,i.classesText||i.classes||"",i.studentCount,window.getExcelNum(t(i.avgValue,0)),window.getExcelNum(t(i.leagueScoreRaw,0)),window.getExcelNum(t(i.leagueScore,0)),window.getExcelNum(t(i.baselineAdjustment,0)),i.baselineCoverageText||"0%",i.previousSampleCount||0,i.commonSampleCount||0,i.addedSampleCount||0,i.exitedSampleCount||0,i.sampleStabilityText||"0%",i.teacherContinuityText||"",window.getExcelNum(t(i.conversionScore,50)),window.getExcelNum(t(i.conversionAdjustment,0)),window.getExcelNum(t(i.expectedAvg,0)),window.getExcelPercent(t(i.excellentRate,0)),window.getExcelPercent(t(i.expectedExcellentRate,0)),window.getExcelPercent(t(i.passRate,0)),window.getExcelPercent(t(i.expectedPassRate,0)),window.getExcelPercent(t(i.lowRate,0)),window.getExcelPercent(t(i.expectedLowRate,0)),window.getExcelNum(t(i.workloadAdjustment,0)),window.getExcelNum(t(i.confidenceFactor,1)),window.getExcelNum(t(i.fairScore,0)),i.fairRank||"",T((y=i.focusTargets)==null?void 0:y.excellentEdges,""),T((b=i.focusTargets)==null?void 0:b.passEdges,""),T((c=i.focusTargets)==null?void 0:c.lowRisk,"")])});const w=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName(d,"公平绩效"):String(d||"Sheet").slice(0,31);window.XLSX.utils.book_append_sheet(v,window.XLSX.utils.aoa_to_sheet(g),w)});const o=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(n,e):new Date().toISOString().slice(0,10);window.XLSX.writeFile(v,`教师公平绩效明细_${o}.xlsx`)}M(),Object.assign(window,{renderTeacherTownshipRanking:U,teacherBuildCardList:N,teacherFormatFocusList:T,renderTeacherCards:O,renderTeacherCardsV2:O,calculatePerformanceLevel:k,calculatePerformanceLevelV2:k,renderTeacherComparisonTable:j,renderTeacherComparisonTableV2:j,showTeacherDetails:H,showTeacherDetailsV2:H,exportTeacherComparisonExcel:P,exportTeacherComparisonExcelV2:P}),window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__=!0})();
