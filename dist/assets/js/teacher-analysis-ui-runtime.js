(()=>{if(typeof window=="undefined"||window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__)return;const n=typeof window.teacherToNumber=="function"?window.teacherToNumber:((s,r=0)=>{const d=Number(s);return Number.isFinite(d)?d:r}),x=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((s,r=1)=>`${(n(s,0)*100).toFixed(r)}%`),$=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((s,r=1)=>{const d=n(s,0);return`${d>=0?"+":""}${d.toFixed(r)}`}),i=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(s=>String(s!=null?s:"").replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])),k=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>({avg:60,exc:70,pass:70,total:200})),R=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var s;return((s=window.Auth)==null?void 0:s.currentUser)||null}),_=typeof window.normalizeSubject=="function"?window.normalizeSubject:(s=>String(s||"").trim()),F=typeof window.sortSubjects=="function"?window.sortSubjects:((s,r)=>String(s||"").localeCompare(String(r||""),"zh-Hans-CN")),A=typeof window.formatRankDisplay=="function"?window.formatRankDisplay:((s,r,d="school",t=!1)=>`${t?`${(n(s,0)*100).toFixed(2)}%`:n(s,0).toFixed(2)} <span style="font-size:0.9em; color:#94a3b8">(${r})</span>`);function T(){return typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats():window.TEACHER_STATS||{}}function P(s){return typeof window.getVisibleSubjectsForTeacherUser=="function"?window.getVisibleSubjectsForTeacherUser(s):null}function z(s){const r=n(s==null?void 0:s.fairScore,(s==null?void 0:s.finalScore)||0),d=n(s==null?void 0:s.baselineAdjustment,0);return r>=85&&d>=0?{class:"performance-excellent",text:"优秀"}:r>=75?{class:"performance-good",text:"良好"}:r>=65?{class:"performance-average",text:"稳健"}:{class:"performance-poor",text:"待改进"}}function N(s,r,d="",t="guest"){const g=[];Object.keys(s||{}).forEach(a=>{Object.keys(s[a]||{}).forEach(e=>{var v,f;const l=s[a][e],c=z(l),u=((f=(v=r==null?void 0:r[a])==null?void 0:v[e])==null?void 0:f.rank)||"-";g.push({id:`${a}-${e}`,name:a,subject:e,classes:l.classesText||l.classes||"",avg:l.avg,fairScore:n(l.fairScore,0).toFixed(1),leagueScoreRaw:n(l.leagueScoreRaw,0).toFixed(1),leagueScore:n(l.leagueScore,0).toFixed(1),baselineAdjustment:$(l.baselineAdjustment,1),baselineCoverage:l.baselineCoverageText||"0%",sampleSummary:l.sampleSummary||"共同样本待识别",sampleStability:l.sampleStabilityText||"0%",conversionSummary:l.conversionSummary||"暂无转化样本",conversionScore:n(l.conversionScore,50).toFixed(1),excRate:x(l.excellentRate,1),passRate:x(l.passRate,1),lowRate:x(l.lowRate,1),focusSummary:l.focusSummary||"培优0 / 临界0 / 辅差0",count:l.studentCount,rank:u,badgeClass:c.class,badgeText:c.text})})});const p=String(d||"").replace(/\s+/g,"").toLowerCase();return g.sort((a,e)=>{if((t==="teacher"||t==="class_teacher")&&p){const u=String(a.name||"").replace(/\s+/g,"").toLowerCase(),v=String(e.name||"").replace(/\s+/g,"").toLowerCase(),f=u===p||u.startsWith(`${p}(`)||u.startsWith(`${p}（`),o=v===p||v.startsWith(`${p}(`)||v.startsWith(`${p}（`);if(f!==o)return f?-1:1}const l=n(e.fairScore,0)-n(a.fairScore,0);if(l!==0)return l;const c=n(e.leagueScore,0)-n(a.leagueScore,0);return c!==0?c:String(a.name||"").localeCompare(String(e.name||""),"zh-Hans-CN")}),g}function I(){const s=document.getElementById("teacherCardsContainer"),r=R(),d=(r==null?void 0:r.role)||"guest",t=T(),g=window.TEACHER_TOWNSHIP_RANKINGS||{},p=N(t,g,(r==null?void 0:r.name)||"",d);try{if(window.Alpine&&typeof window.Alpine.store=="function"){const a=window.Alpine.store("teacherData");a&&(a.list=p)}}catch(a){console.warn("teacherData store update skipped:",a)}if(s){if(!p.length){s.innerHTML=`
                <div style="grid-column:1/-1; text-align:center; color:#999; padding:20px;">
                    暂无教师数据，请先完成任课表同步和成绩导入。
                    <div style="margin-top:10px;">
                        <button class="btn btn-orange" onclick="openTeacherSync()">去同步任课表</button>
                    </div>
                </div>
            `;return}s.innerHTML=p.map(a=>`
            <div class="teacher-card">
                <div class="teacher-header">
                    <div>
                        <div class="teacher-name">${i(a.name)} - ${i(a.subject)}</div>
                        <div class="teacher-classes">${i(a.classes)}班</div>
                    </div>
                    <div class="performance-badge ${i(a.badgeClass)}">${i(a.badgeText)}</div>
                </div>
                <div class="teacher-stats">
                    <div class="stat-item">
                        <div class="stat-value">${i(a.avg)}</div>
                        <div class="stat-label">均分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${i(a.leagueScoreRaw)}</div>
                        <div class="stat-label">联考赋分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${i(a.fairScore)}</div>
                        <div class="stat-label">公平绩效</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; padding:0 10px;">
                    <span>优/及/低: ${i(a.excRate)} / ${i(a.passRate)} / ${i(a.lowRate)}</span>
                    <span>镇排: <strong style="color:var(--primary)">${i(a.rank)}</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:6px; padding:0 10px;">
                    <span>基线校正 ${i(a.baselineAdjustment)} · 覆盖 ${i(a.baselineCoverage)}</span>
                    <span>稳定 ${i(a.sampleStability)} · 转化 ${i(a.conversionScore)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:14px; padding:0 10px;">
                    <span>${i(a.sampleSummary)}</span>
                    <span>${i(a.focusSummary)} · ${i(a.conversionSummary)}</span>
                </div>
                <button class="view-details-btn" onclick='showTeacherDetails(${JSON.stringify(a.name)}, ${JSON.stringify(a.subject)})'>查看详情</button>
            </div>
        `).join("")}}function M(){const s=R(),r=(s==null?void 0:s.role)||"guest",d=r==="teacher"||r==="class_teacher"?P(s):null,t=document.getElementById("teacher-township-ranking-container"),g=document.getElementById("side-nav-teacher-ranks-container");if(g&&(g.innerHTML=""),!t)return;if(!window.TOWNSHIP_RANKING_DATA||!Object.keys(window.TOWNSHIP_RANKING_DATA).length){t.innerHTML='<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';return}const p={};(window.SUBJECTS||[]).forEach(e=>{if(d&&d.size>0&&!d.has(_(e)))return;let l=0,c=0,u=0,v=0;Object.keys(window.SCHOOLS||{}).forEach(f=>{var h,m,w;const o=(w=(m=(h=window.SCHOOLS)==null?void 0:h[f])==null?void 0:m.metrics)==null?void 0:w[e];!o||f===window.MY_SCHOOL||(l+=n(o.avg,0),c+=n(o.excRate,0),u+=n(o.passRate,0),v+=1)}),v>0&&(p[e]={avg:l/v,excRate:c/v,passRate:u/v})});let a="";if((window.SUBJECTS||[]).forEach(e=>{var f;if(d&&d.size>0&&!d.has(_(e)))return;const l=(f=window.TOWNSHIP_RANKING_DATA)==null?void 0:f[e];if(!(l!=null&&l.length))return;const c=p[e]||{avg:0,excRate:0,passRate:0};let u="";l.forEach(o=>{const h=c.avg?((o.avg-c.avg)/c.avg*100).toFixed(2):"0.00",m=c.excRate?((o.excellentRate-c.excRate)/c.excRate*100).toFixed(2):"0.00",w=c.passRate?((o.passRate-c.passRate)/c.passRate*100).toFixed(2):"0.00",b=o.type==="teacher"?"text-blue":"",E=o.type==="teacher"?"analysis-row-emphasis":"",y=o.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school",C=o.type==="teacher"?"教师":"学校";u+=`
                    <tr class="${E}">
                        <td data-label="教师/学校" class="${b}">${i(o.name)}</td>
                        <td data-label="类型"><span class="${y}">${C}</span></td>
                        <td data-label="平均分">${A(o.avg,o.rankAvg,"teacher")}</td>
                        <td data-label="与镇均比" class="${n(h,0)>=0?"positive-percent":"negative-percent"}">${n(h,0)>=0?"+":""}${h}%</td>
                        <td data-label="镇排">${i(o.rankAvg)}</td>
                        <td data-label="优秀率">${A(o.excellentRate,o.rankExc,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${n(m,0)>=0?"positive-percent":"negative-percent"}">${n(m,0)>=0?"+":""}${m}%</td>
                        <td data-label="镇排">${i(o.rankExc)}</td>
                        <td data-label="及格率">${A(o.passRate,o.rankPass,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${n(w,0)>=0?"positive-percent":"negative-percent"}">${n(w,0)>=0?"+":""}${w}%</td>
                        <td data-label="镇排">${i(o.rankPass)}</td>
                    </tr>
                `});const v=`rank-anchor-${e}`;if(a+=`
                <div id="${v}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>${i(e)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${i(l.length)} 条</span>
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
                            <tbody>${u}</tbody>
                        </table>
                    </div>
                </div>
            `,g){const o=document.createElement("a");o.className="side-nav-sub-link",o.innerText=e,o.onclick=()=>{typeof window.scrollToSubAnchor=="function"&&window.scrollToSubAnchor(v,o)},g.appendChild(o)}}),!a){t.innerHTML='<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';return}t.innerHTML=a}function S(s,r="暂无"){const d=(s||[]).slice(0,8);return d.length?d.map(t=>`${t.name}${t.className?`(${t.className})`:""}${Number.isFinite(t.score)?` ${t.score}`:""}`).join("、"):r}function L(){const s=document.getElementById("teacherComparisonTable"),r=T();if(!s)return;if(!Object.keys(r).length){s.innerHTML='<p style="text-align:center; color:#666;">暂无教师统计数据</p>';return}const d={};Object.keys(r).forEach(p=>{Object.keys(r[p]||{}).forEach(a=>{d[a]||(d[a]=[]),d[a].push({teacher:p,data:r[p][a]})})});let g=`
            <thead>
                <tr>
                    <th rowspan="2">教师</th>
                    <th rowspan="2">班级</th>
                    <th rowspan="2">实考</th>
                    <th rowspan="2">共同样本</th>
                    <th rowspan="2">样本变动</th>
                    <th rowspan="2">均分</th>
                    <th rowspan="2" title="按系统现有两率一分标准折算，同校同学科比较">联考赋分(${k().total})</th>
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
        `;Object.keys(d).sort(F).forEach(p=>{g+=`<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${i(p)}</td></tr>`,d[p].sort((a,e)=>n(e.data.fairScore,0)-n(a.data.fairScore,0)).forEach(a=>{var m,w,b,E;const e=a.data,l=n(e.baselineAdjustment,0)>=0?"text-green":"text-red",c=n(e.lowRate,0)>=.12?"color:#dc2626; font-weight:700;":"color:#334155;",u=e.sampleWarning?"color:#b45309; font-weight:700;":"color:#334155;",v=[`培优: ${(((m=e.focusTargets)==null?void 0:m.excellentEdges)||[]).slice(0,6).map(y=>`${y.name}(${y.score})`).join("、")||"暂无"}`,`临界: ${(((w=e.focusTargets)==null?void 0:w.passEdges)||[]).slice(0,6).map(y=>`${y.name}(${y.score})`).join("、")||"暂无"}`,`辅差: ${(((b=e.focusTargets)==null?void 0:b.lowRisk)||[]).slice(0,6).map(y=>`${y.name}(${y.score})`).join("、")||"暂无"}`].join(" | "),f=`基线覆盖 ${e.baselineCoverageText||"0%"}；预计均分 ${n(e.expectedAvg,0).toFixed(2)}；预计优率 ${x(e.expectedExcellentRate,1)}；预计及格率 ${x(e.expectedPassRate,1)}；预计低分率 ${x(e.expectedLowRate,1)}；任课连续性 ${e.teacherContinuityText||"任课连续"}${e.baselineExamId?`；基线 ${e.baselineExamId}`:""}`,o=(e.previousSampleCount||0)>0?`新增 ${e.addedSampleCount||0} / 缺考退出 ${e.exitedSampleCount||0}`:"暂无基线",h=`${n(e.conversionScore,50).toFixed(1)}${n(e.conversionAdjustment,0)?` (${$(e.conversionAdjustment,1)})`:""}`;g+=`
                        <tr>
                            <td><strong>${i(a.teacher)}</strong></td>
                            <td>${i(e.classesText||e.classes||"-")}</td>
                            <td>${i(e.studentCount)}</td>
                            <td title="${i(e.sampleDetailText||"")}" style="${u}">
                                <div>${i((e.previousSampleCount||0)>0?e.commonSampleCount||0:"—")}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${i((e.previousSampleCount||0)>0?e.sampleStabilityText||"0%":"待历史样本")}</div>
                            </td>
                            <td title="${i(e.sampleDetailText||"")}" style="${u}">
                                <div>${i(o)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${i(e.previousSampleCount||0)}</div>
                            </td>
                            <td style="font-weight:700;">${i(e.avg)}</td>
                            <td title="${i(`均分赋分 ${n(e.ratedAvg,0).toFixed(1)}，优率赋分 ${n(e.ratedExc,0).toFixed(1)}，及格赋分 ${n(e.ratedPass,0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${n(e.leagueScoreRaw,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${n(e.leagueScore,0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${l}" title="${i(f)}" style="font-weight:700;">
                                <div>${$(e.baselineAdjustment,1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${i(e.baselineCoverageText||"0%")}</div>
                            </td>
                            <td>${x(e.excellentRate,1)}</td>
                            <td>${x(e.passRate,1)}</td>
                            <td style="${c}">${x(e.lowRate,1)}</td>
                            <td title="${i(`${e.conversionSummary||"暂无转化样本"}；${((E=e.conversionMetrics)==null?void 0:E.detail)||""}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${h}</div>
                                <div style="font-size:11px; color:#64748b;">${i(e.conversionSummary||"暂无转化")}</div>
                            </td>
                            <td title="${i(v)}" style="font-size:12px;">${i(e.focusSummary||"培优0 / 临界0 / 辅差0")}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${n(e.fairScore,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${i(e.fairRank||"-")} 名</div>
                            </td>
                        </tr>
                    `})}),g+="</tbody>",s.classList.add("comparison-table"),s.innerHTML=g}function j(s,r){var E,y,C,O;const d=T(),t=d[s]?d[s][r]:null;if(!t){window.UI&&window.UI.toast("当前筛选范围下暂无该教师该学科数据","warning");return}const g=document.getElementById("teacherModal"),p=document.getElementById("modalSubjectTable"),a=document.getElementById("modalAvgProgress");if(!g||!p||!a)return;const e=document.getElementById("modalTeacherName"),l=document.getElementById("modalAvgScore"),c=document.getElementById("modalExcellentRate"),u=document.getElementById("modalPassRate"),v=document.getElementById("modalAvgComparison");e&&(e.textContent=`${s} - ${r} 教学详情`),l&&(l.textContent=t.avg),c&&(c.textContent=x(t.excellentRate,1)),u&&(u.textContent=x(t.passRate,1));const f=n(t.expectedAvg,0),o=f>0?(n(t.avgValue,0)-f)/f*100:0;v&&(v.textContent=`${o>=0?"+":""}${o.toFixed(1)}%`);const h=Math.min(Math.max(50+o,0),100);a.style.width=`${h}%`,a.className=o>=0?"progress-good":"progress-poor",a.style.backgroundColor=o>=0?"#22c55e":"#ef4444";const m=p.querySelector("thead"),w=p.querySelector("tbody");m&&(m.innerHTML=`
                <tr>
                    <th>学科</th>
                    <th>实际均分</th>
                    <th>预计均分</th>
                    <th>优秀率(实/预)</th>
                    <th>及格率(实/预)</th>
                    <th>低分率(实/预)</th>
                    <th>基线校正</th>
                </tr>
            `),w&&(w.innerHTML=`
                <tr>
                    <td>${i(r)}</td>
                    <td>${n(t.avgValue,0).toFixed(2)}</td>
                    <td>${n(t.expectedAvg,0).toFixed(2)}</td>
                    <td>${x(t.excellentRate,1)} / ${x(t.expectedExcellentRate,1)}</td>
                    <td>${x(t.passRate,1)} / ${x(t.expectedPassRate,1)}</td>
                    <td>${x(t.lowRate,1)} / ${x(t.expectedLowRate,1)}</td>
                    <td class="${n(t.baselineAdjustment,0)>=0?"positive-percent":"negative-percent"}">${$(t.baselineAdjustment,1)}</td>
                </tr>
            `);let b=document.getElementById("teacherModalExtra");!b&&p.parentNode&&(b=document.createElement("div"),b.id="teacherModalExtra",b.style.marginBottom="16px",p.parentNode.insertBefore(b,p)),b&&(b.innerHTML=`
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">联考赋分</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${n(t.leagueScoreRaw,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">折算 ${n(t.leagueScore,0).toFixed(1)} / 100</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">基线校正</div>
                        <div style="font-size:22px; font-weight:800; color:${n(t.baselineAdjustment,0)>=0?"#15803d":"#dc2626"};">${$(t.baselineAdjustment,1)}</div>
                        <div style="font-size:12px; color:#64748b;">覆盖 ${i(t.baselineCoverageText||"0%")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">公平绩效分</div>
                        <div style="font-size:22px; font-weight:800; color:#b45309;">${n(t.fairScore,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">同科第 ${i(t.fairRank||"-")} 名</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">置信 / 工作量</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${n(t.confidenceFactor,1).toFixed(2)}</div>
                        <div style="font-size:12px; color:#64748b;">工作量修正 ${$(t.workloadAdjustment,1)}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">共同样本</div>
                        <div style="font-size:22px; font-weight:800; color:${t.sampleWarning?"#b45309":"#0f172a"};">${i((t.previousSampleCount||0)>0?t.commonSampleCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">稳定 ${i((t.previousSampleCount||0)>0?t.sampleStabilityText||"0%":"待历史样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">样本变动</div>
                        <div style="font-size:22px; font-weight:800; color:${t.sampleWarning?"#b45309":"#0f172a"};">${i((t.previousSampleCount||0)>0?t.sampleShiftCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">${i((t.previousSampleCount||0)>0?`新增 ${t.addedSampleCount||0} · 缺考退出 ${t.exitedSampleCount||0}`:"暂无基线样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">转化分</div>
                        <div style="font-size:22px; font-weight:800; color:#0369a1;">${n(t.conversionScore,50).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">${i(t.conversionSummary||"暂无转化样本")}${n(t.conversionAdjustment,0)?` · 调整 ${$(t.conversionAdjustment,1)}`:""}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">换老师保护</div>
                        <div style="font-size:22px; font-weight:800; color:${t.teacherChangeProtected?"#b45309":"#0f172a"};">${i(t.teacherChangeProtected?"已冻结":"正常")}</div>
                        <div style="font-size:12px; color:#64748b;">${i(t.teacherContinuityText||"任课连续")}</div>
                    </div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px; background:#f8fafc;">
                    <div style="font-size:13px; font-weight:700; color:#334155; margin-bottom:10px;">培优 / 辅差名单</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                        <div>
                            <div style="font-size:12px; color:#0f766e; font-weight:700; margin-bottom:4px;">培优边缘生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${i(S((E=t.focusTargets)==null?void 0:E.excellentEdges,"暂无培优边缘生"))}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:#1d4ed8; font-weight:700; margin-bottom:4px;">及格临界生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${i(S((y=t.focusTargets)==null?void 0:y.passEdges,"暂无及格临界生"))}</div>
                        </div>
                        <div>
                            <div style="font-size:12px; color:#b45309; font-weight:700; margin-bottom:4px;">辅差关注生</div>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${i(S((C=t.focusTargets)==null?void 0:C.lowRisk,"暂无辅差关注生"))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${i(t.sampleDetailText||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${i(((O=t.conversionMetrics)==null?void 0:O.detail)||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${i(t.baselineExamId?`历史基线：${t.baselineExamId}`:"未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。")}</div>
                </div>
            `),g.style.display="flex"}function H(){const s=R(),r=(s==null?void 0:s.role)||"guest",d=r==="teacher"||r==="class_teacher"?T():window.TEACHER_STATS||{};if(!Object.keys(d).length){alert("请先进行教师分析");return}const t=new Set;Object.values(d).forEach(l=>Object.keys(l||{}).forEach(c=>t.add(c)));const g=window.XLSX.utils.book_new(),p=k(),a={};Object.keys(d).forEach(l=>{Object.keys(d[l]||{}).forEach(c=>{a[c]||(a[c]=[]),a[c].push({teacherName:l,data:d[l][c]})})}),Object.keys(a).sort(F).forEach(l=>{const c=a[l].sort((f,o)=>n(o.data.fairScore,0)-n(f.data.fairScore,0)),u=[["教师姓名","学科","任教班级","人数","均分",`联考赋分(${p.total})`,"联考赋分(折算100)","基线校正","基线覆盖","上次样本","共同样本","新增样本","缺考/退出","样本稳定度","任课连续性","转化分","转化调整","预计均分","优秀率","预计优秀率","及格率","预计及格率","低分率","预计低分率","工作量修正","置信系数","公平绩效分","同科排名","培优边缘生","及格临界生","辅差关注生"]];c.forEach(({teacherName:f,data:o})=>{var h,m,w;u.push([f,l,o.classesText||o.classes||"",o.studentCount,window.getExcelNum(n(o.avgValue,0)),window.getExcelNum(n(o.leagueScoreRaw,0)),window.getExcelNum(n(o.leagueScore,0)),window.getExcelNum(n(o.baselineAdjustment,0)),o.baselineCoverageText||"0%",o.previousSampleCount||0,o.commonSampleCount||0,o.addedSampleCount||0,o.exitedSampleCount||0,o.sampleStabilityText||"0%",o.teacherContinuityText||"",window.getExcelNum(n(o.conversionScore,50)),window.getExcelNum(n(o.conversionAdjustment,0)),window.getExcelNum(n(o.expectedAvg,0)),window.getExcelPercent(n(o.excellentRate,0)),window.getExcelPercent(n(o.expectedExcellentRate,0)),window.getExcelPercent(n(o.passRate,0)),window.getExcelPercent(n(o.expectedPassRate,0)),window.getExcelPercent(n(o.lowRate,0)),window.getExcelPercent(n(o.expectedLowRate,0)),window.getExcelNum(n(o.workloadAdjustment,0)),window.getExcelNum(n(o.confidenceFactor,1)),window.getExcelNum(n(o.fairScore,0)),o.fairRank||"",S((h=o.focusTargets)==null?void 0:h.excellentEdges,""),S((m=o.focusTargets)==null?void 0:m.passEdges,""),S((w=o.focusTargets)==null?void 0:w.lowRisk,"")])});const v=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName(l,"公平绩效"):String(l||"Sheet").slice(0,31);window.XLSX.utils.book_append_sheet(g,window.XLSX.utils.aoa_to_sheet(u),v)});const e=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(s,t):new Date().toISOString().slice(0,10);window.XLSX.writeFile(g,`教师公平绩效明细_${e}.xlsx`)}if(!window.__TEACHER_ANALYSIS_MODAL_BOUND__){const s=document.getElementById("closeModal");s&&s.addEventListener("click",()=>{const r=document.getElementById("teacherModal");r&&(r.style.display="none")}),window.addEventListener("click",r=>{const d=document.getElementById("teacherModal");d&&r.target===d&&(d.style.display="none")}),window.__TEACHER_ANALYSIS_MODAL_BOUND__=!0}Object.assign(window,{renderTeacherTownshipRanking:M,teacherBuildCardList:N,teacherFormatFocusList:S,renderTeacherCards:I,renderTeacherCardsV2:I,calculatePerformanceLevel:z,calculatePerformanceLevelV2:z,renderTeacherComparisonTable:L,renderTeacherComparisonTableV2:L,showTeacherDetails:j,showTeacherDetailsV2:j,exportTeacherComparisonExcel:H,exportTeacherComparisonExcelV2:H}),window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__=!0})();
