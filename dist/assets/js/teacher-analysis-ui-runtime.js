(()=>{if(typeof window=="undefined"||window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__)return;const i=typeof window.teacherToNumber=="function"?window.teacherToNumber:((t,r=0)=>{const l=Number(t);return Number.isFinite(l)?l:r}),b=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((t,r=1)=>`${(i(t,0)*100).toFixed(r)}%`),C=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((t,r=1)=>{const l=i(t,0);return`${l>=0?"+":""}${l.toFixed(r)}`}),o=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(t=>String(t!=null?t:"").replace(/[&<>"']/g,r=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[r])),L=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>({avg:60,exc:70,pass:70,total:200})),z=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var t;return((t=window.Auth)==null?void 0:t.currentUser)||null}),X=typeof window.normalizeSubject=="function"?window.normalizeSubject:(t=>String(t||"").trim()),M=typeof window.sortSubjects=="function"?window.sortSubjects:((t,r)=>String(t||"").localeCompare(String(r||""),"zh-Hans-CN")),_=typeof window.formatRankDisplay=="function"?window.formatRankDisplay:((t,r,l="school",e=!1)=>`${e?`${(i(t,0)*100).toFixed(2)}%`:i(t,0).toFixed(2)} <span style="font-size:0.9em; color:#94a3b8">(${r})</span>`);function R(){return typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats():window.TEACHER_STATS||{}}function q(t){return typeof window.getVisibleSubjectsForTeacherUser=="function"?window.getVisibleSubjectsForTeacherUser(t):null}function I(t){const r=i(t==null?void 0:t.fairScore,(t==null?void 0:t.finalScore)||0),l=i(t==null?void 0:t.baselineAdjustment,0);return r>=85&&l>=0?{class:"performance-excellent",text:"优秀"}:r>=75?{class:"performance-good",text:"良好"}:r>=65?{class:"performance-average",text:"稳健"}:{class:"performance-poor",text:"待改进"}}function H(t,r,l="",e="guest"){const p=[];Object.keys(t||{}).forEach(s=>{Object.keys(t[s]||{}).forEach(n=>{var g,w;const c=t[s][n],m=I(c),x=((w=(g=r==null?void 0:r[s])==null?void 0:g[n])==null?void 0:w.rank)||"-";p.push({id:`${s}-${n}`,name:s,subject:n,classes:c.classesText||c.classes||"",avg:c.avg,fairScore:i(c.fairScore,0).toFixed(1),leagueScoreRaw:i(c.leagueScoreRaw,0).toFixed(1),leagueScore:i(c.leagueScore,0).toFixed(1),baselineAdjustment:C(c.baselineAdjustment,1),baselineCoverage:c.baselineCoverageText||"0%",sampleSummary:c.sampleSummary||"共同样本待识别",sampleStability:c.sampleStabilityText||"0%",conversionSummary:c.conversionSummary||"暂无转化样本",conversionScore:i(c.conversionScore,50).toFixed(1),excRate:b(c.excellentRate,1),passRate:b(c.passRate,1),lowRate:b(c.lowRate,1),focusSummary:c.focusSummary||"培优0 / 临界0 / 辅差0",count:c.studentCount,rank:x,badgeClass:m.class,badgeText:m.text})})});const d=String(l||"").replace(/\s+/g,"").toLowerCase();return p.sort((s,n)=>{if((e==="teacher"||e==="class_teacher")&&d){const x=String(s.name||"").replace(/\s+/g,"").toLowerCase(),g=String(n.name||"").replace(/\s+/g,"").toLowerCase(),w=x===d||x.startsWith(`${d}(`)||x.startsWith(`${d}（`),a=g===d||g.startsWith(`${d}(`)||g.startsWith(`${d}（`);if(w!==a)return w?-1:1}const c=i(n.fairScore,0)-i(s.fairScore,0);if(c!==0)return c;const m=i(n.leagueScore,0)-i(s.leagueScore,0);return m!==0?m:String(s.name||"").localeCompare(String(n.name||""),"zh-Hans-CN")}),p}function B(){const t=document.getElementById("teacherCardsContainer"),r=z(),l=(r==null?void 0:r.role)||"guest",e=R(),p=window.TEACHER_TOWNSHIP_RANKINGS||{},d=H(e,p,(r==null?void 0:r.name)||"",l);try{if(window.Alpine&&typeof window.Alpine.store=="function"){const s=window.Alpine.store("teacherData");s&&(s.list=d)}}catch(s){console.warn("teacherData store update skipped:",s)}if(t){if(!d.length){t.innerHTML=`
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
                        <div class="teacher-name">${o(s.name)} - ${o(s.subject)}</div>
                        <div class="teacher-classes">${o(s.classes)}班</div>
                    </div>
                    <div class="performance-badge ${o(s.badgeClass)}">${o(s.badgeText)}</div>
                </div>
                <div class="teacher-stats">
                    <div class="stat-item">
                        <div class="stat-value">${o(s.avg)}</div>
                        <div class="stat-label">均分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${o(s.leagueScoreRaw)}</div>
                        <div class="stat-label">联考赋分</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${o(s.fairScore)}</div>
                        <div class="stat-label">质量分</div>
                    </div>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; padding:0 10px;">
                    <span>优/及/低: ${o(s.excRate)} / ${o(s.passRate)} / ${o(s.lowRate)}</span>
                    <span>镇排: <strong style="color:var(--primary)">${o(s.rank)}</strong></span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:6px; padding:0 10px;">
                    <span>基线校正 ${o(s.baselineAdjustment)} · 覆盖 ${o(s.baselineCoverage)}</span>
                    <span>稳定 ${o(s.sampleStability)} · 转化 ${o(s.conversionScore)}</span>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:14px; padding:0 10px;">
                    <span>${o(s.sampleSummary)}</span>
                    <span>${o(s.focusSummary)} · ${o(s.conversionSummary)}</span>
                </div>
                <button class="view-details-btn" onclick='showTeacherDetails(${JSON.stringify(s.name)}, ${JSON.stringify(s.subject)})'>查看详情</button>
            </div>
        `).join("")}}function J(){const t=z(),r=(t==null?void 0:t.role)||"guest",l=r==="teacher"||r==="class_teacher"?q(t):null,e=document.getElementById("teacher-township-ranking-container"),p=document.getElementById("side-nav-teacher-ranks-container");if(p&&(p.innerHTML=""),!e)return;if(typeof window.calculateTeacherTownshipRanking=="function"&&window.calculateTeacherTownshipRanking({teacherMetricScope:"admin"}),!window.TOWNSHIP_RANKING_DATA||!Object.keys(window.TOWNSHIP_RANKING_DATA).length){e.innerHTML='<div class="analysis-empty-state">暂无教师乡镇排名数据</div>';return}const d=window.TEACHER_TOWNSHIP_AVERAGES||{},s=a=>{const f=(a||[]).filter($=>$.type==="school"&&i($.studentCount,0)>0),h=f.length?f:(a||[]).filter($=>i($.studentCount,0)>0);let v=0,y=0,E=0,u=0;return h.forEach($=>{const S=i($.studentCount,0);S<=0||(v+=S,y+=i($.avg,0)*S,E+=i($.excellentRate,0)*S,u+=i($.passRate,0)*S)}),v<=0?null:{avg:y/v,excRate:E/v,passRate:u/v,count:v,source:f.length?"ranking-schools":"ranking-rows"}},n=(a,f)=>{const h=i(a,NaN),v=i(f,NaN);if(!Number.isFinite(h)||!Number.isFinite(v)||Math.abs(v)<1e-9)return{text:"—",value:null};const y=(h-v)/v*100;return{text:`${y>=0?"+":""}${y.toFixed(2)}%`,value:y}},c=a=>!a||a.value===null?"rank-muted":a.value>=0?"positive-percent":"negative-percent",m=[],x=(a,f)=>{const h=(f||[]).filter(v=>v.type==="teacher").slice().sort((v,y)=>i(v.rankAvg,99999)-i(y.rankAvg,99999)).slice(0,8);return h.length?`
                <div class="teacher-township-quick-view" aria-label="${o(a)}教师排名速览">
                    ${h.map(v=>`
                        <div class="teacher-township-quick-card">
                            <strong>${o(v.name)}</strong>
                            <span>均分镇排 ${o(v.rankAvg)}</span>
                            <span>优秀率 ${o(v.rankExc)}</span>
                            <span>及格率 ${o(v.rankPass)}</span>
                        </div>
                    `).join("")}
                </div>
            `:""};let g="";if((window.SUBJECTS||[]).forEach(a=>{var E;if(l&&l.size>0&&!l.has(X(a)))return;const f=(E=window.TOWNSHIP_RANKING_DATA)==null?void 0:E[a];if(!(f!=null&&f.length))return;const h=d[a]||s(f);let v="";f.forEach(u=>{const $=n(u.avg,h==null?void 0:h.avg),S=n(u.excellentRate,h==null?void 0:h.excRate),A=n(u.passRate,h==null?void 0:h.passRate),F=u.type==="teacher"?"text-blue":"",K=u.type==="teacher"?"analysis-row-emphasis":"",Q=u.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school",Z=u.type==="teacher"?"教师":"学校";v+=`
                    <tr class="${K}">
                        <td data-label="教师/学校" class="${F}">${o(u.name)}</td>
                        <td data-label="类型"><span class="${Q}">${Z}</span></td>
                        <td data-label="平均分">${_(u.avg,u.rankAvg,"teacher")}</td>
                        <td data-label="与镇均比" class="${c($)}">${o($.text)}</td>
                        <td data-label="镇排">${o(u.rankAvg)}</td>
                        <td data-label="优秀率">${_(u.excellentRate,u.rankExc,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${c(S)}">${o(S.text)}</td>
                        <td data-label="镇排">${o(u.rankExc)}</td>
                        <td data-label="及格率">${_(u.passRate,u.rankPass,"teacher",!0)}</td>
                        <td data-label="与镇均比" class="${c(A)}">${o(A.text)}</td>
                        <td data-label="镇排">${o(u.rankPass)}</td>
                    </tr>
                `});const y=`rank-anchor-${a}`;if(m.push({subject:a,anchorId:y,count:f.length}),g+=`
                <div id="${y}" class="anchor-target analysis-anchor-panel analysis-generated-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>${o(a)} 教师乡镇排名</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">共 ${o(f.length)} 条</span>
                            <span class="analysis-table-tag">含外校整体数据</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">教师与学校数据同表展示，便于对照镇均水平、乡镇排名和学科整体波动。</div>
                    ${x(a,f)}
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
                            <tbody>${v}</tbody>
                        </table>
                    </div>
                </div>
            `,p){const u=document.createElement("a");u.className="side-nav-sub-link",u.innerText=a,u.onclick=()=>{typeof window.scrollToSubAnchor=="function"&&window.scrollToSubAnchor(y,u)},p.appendChild(u)}}),!g){e.innerHTML='<div class="analysis-empty-state">当前角色下暂无可见学科的教师乡镇排名数据</div>';return}const w=m.length?`<div class="teacher-township-jumpbar analysis-generated-panel">
                    <div>
                        <strong>教师乡镇排名快速查看</strong>
                        <span>点击学科直接定位，无需逐屏查找。</span>
                    </div>
                    <div class="teacher-township-jumpbar-links">
                        ${m.map(a=>`<button type="button" data-rank-anchor="${o(a.anchorId)}">${o(a.subject)}<em>${o(a.count)}</em></button>`).join("")}
                    </div>
                </div>`:"";e.innerHTML=w+g,e.querySelectorAll("[data-rank-anchor]").forEach(a=>{a.addEventListener("click",()=>{var h;const f=a.getAttribute("data-rank-anchor");if(typeof window.scrollToSubAnchor=="function"){window.scrollToSubAnchor(f,a);return}(h=document.getElementById(f))==null||h.scrollIntoView({behavior:"smooth",block:"start"})})})}function k(t,r="暂无"){const l=(t||[]).slice(0,8);return l.length?l.map(e=>`${e.name}${e.className?`(${e.className})`:""}${Number.isFinite(e.score)?` ${e.score}`:""}`).join("、"):r}const N={excellentEdges:{label:"培优",title:"培优边缘生",color:"#0f766e",empty:"暂无培优边缘生"},passEdges:{label:"临界",title:"及格临界生",color:"#1d4ed8",empty:"暂无及格临界生"},lowRisk:{label:"辅差",title:"辅差关注生",color:"#b45309",empty:"暂无辅差关注生"}};function T(t){return o(JSON.stringify(String(t||"")))}function j(t,r,l,e){var s;const p=N[l]||N.passEdges,d=((s=e==null?void 0:e.focusTargets)==null?void 0:s[l])||[];return`
            <button
                type="button"
                class="teacher-focus-chip"
                data-teacher="${o(t)}"
                data-subject="${o(r)}"
                data-focus-type="${o(l)}"
                onclick="window.showTeacherFocusTargetsFromButton && window.showTeacherFocusTargetsFromButton(this)"
                title="点击查看${o(p.title)}名单和班级"
                style="border:1px solid ${p.color}; color:${p.color}; background:#fff; border-radius:999px; padding:3px 8px; font-size:12px; font-weight:800; cursor:pointer; margin:2px;"
            >${o(p.label)} ${d.length}</button>
        `}function O(t,r,l){var p,d,s;const e=[`培优: ${(((p=l.focusTargets)==null?void 0:p.excellentEdges)||[]).slice(0,6).map(n=>`${n.name}(${n.className||"-"}/${n.score})`).join("、")||"暂无"}`,`临界: ${(((d=l.focusTargets)==null?void 0:d.passEdges)||[]).slice(0,6).map(n=>`${n.name}(${n.className||"-"}/${n.score})`).join("、")||"暂无"}`,`辅差: ${(((s=l.focusTargets)==null?void 0:s.lowRisk)||[]).slice(0,6).map(n=>`${n.name}(${n.className||"-"}/${n.score})`).join("、")||"暂无"}`].join(" | ");return`
            <div title="${o(e)}" style="display:flex; align-items:center; justify-content:center; gap:3px; flex-wrap:wrap;">
                ${j(t,r,"excellentEdges",l)}
                ${j(t,r,"passEdges",l)}
                ${j(t,r,"lowRisk",l)}
            </div>
        `}function P(t,r,l){var m,x;const e=R(),p=(m=e==null?void 0:e[t])==null?void 0:m[r],d=N[l]||N.passEdges,s=Array.isArray((x=p==null?void 0:p.focusTargets)==null?void 0:x[l])?p.focusTargets[l]:[],n=`${t} / ${r} · ${d.title}`,c=s.length?`
            <div style="text-align:left;">
                <div style="margin-bottom:10px; color:#64748b; font-size:13px;">共 ${s.length} 人。点击姓名可跳转到学生成绩单，便于继续查看个人成绩、排名和家校材料。</div>
                <div class="table-wrap analysis-table-shell" style="max-height:55vh; overflow:auto;">
                    <table class="analysis-generated-table" style="width:100%; font-size:13px;">
                        <thead><tr><th>班级</th><th>姓名</th><th>当前分</th><th>差距</th><th>操作</th></tr></thead>
                        <tbody>
                            ${s.map(g=>{const w=Number.isFinite(g.gap)?Math.abs(g.gap).toFixed(1):"-",a=g.school||window.MY_SCHOOL||"";return`
                                    <tr>
                                        <td>${o(g.className||"-")}</td>
                                        <td><strong>${o(g.name||"-")}</strong></td>
                                        <td>${Number.isFinite(g.score)?o(g.score):"-"}</td>
                                        <td>${w}</td>
                                        <td>
                                            <button type="button" class="btn btn-sm btn-blue"
                                                onclick="window.jumpToStudent && window.jumpToStudent(${T(g.name)}, ${T(a)}, ${T(g.className)})">
                                                查看成绩单
                                            </button>
                                        </td>
                                    </tr>
                                `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `:`<div style="padding:24px; color:#64748b;">${o(d.empty)}</div>`;window.Swal&&typeof window.Swal.fire=="function"?window.Swal.fire({title:o(n),html:c,width:760,confirmButtonText:"关闭",confirmButtonColor:d.color}):alert(`${n}
${s.map(g=>{var w;return`${g.className||"-"} ${g.name||"-"} ${(w=g.score)!=null?w:"-"}`}).join(`
`)||d.empty}`)}function Y(t){t&&P(t.dataset.teacher||"",t.dataset.subject||"",t.dataset.focusType||"passEdges")}function V(){const t=document.getElementById("teacherComparisonTable"),r=R();if(!t)return;if(!Object.keys(r).length){t.innerHTML='<p style="text-align:center; color:#666;">暂无教师统计数据</p>';return}const l={};Object.keys(r).forEach(d=>{Object.keys(r[d]||{}).forEach(s=>{l[s]||(l[s]=[]),l[s].push({teacher:d,data:r[d][s]})})});let p=`
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
                    <th rowspan="2" style="background:#fef3c7; color:#92400e;">教学质量分</th>
                </tr>
                <tr>
                    <th>优秀率</th>
                    <th>及格率</th>
                    <th>低分率</th>
                </tr>
            </thead>
            <tbody>
        `;Object.keys(l).sort(M).forEach(d=>{p+=`<tr style="background:#f1f5f9; font-weight:bold; color:#64748b;"><td colspan="14" style="text-align:left; padding-left:15px;">${o(d)}</td></tr>`,l[d].sort((s,n)=>i(n.data.fairScore,0)-i(s.data.fairScore,0)).forEach(s=>{var f;const n=s.data,c=i(n.baselineAdjustment,0)>=0?"text-green":"text-red",m=i(n.lowRate,0)>=.12?"color:#dc2626; font-weight:700;":"color:#334155;",x=n.sampleWarning?"color:#b45309; font-weight:700;":"color:#334155;",g=`基线覆盖 ${n.baselineCoverageText||"0%"}；预计均分 ${i(n.expectedAvg,0).toFixed(2)}；预计优率 ${b(n.expectedExcellentRate,1)}；预计及格率 ${b(n.expectedPassRate,1)}；预计低分率 ${b(n.expectedLowRate,1)}；任课连续性 ${n.teacherContinuityText||"任课连续"}${n.baselineExamId?`；基线 ${n.baselineExamId}`:""}`,w=(n.previousSampleCount||0)>0?`新增 ${n.addedSampleCount||0} / 缺考退出 ${n.exitedSampleCount||0}`:"暂无基线",a=`${i(n.conversionScore,50).toFixed(1)}${i(n.conversionAdjustment,0)?` (${C(n.conversionAdjustment,1)})`:""}`;p+=`
                        <tr>
                            <td><strong>${o(s.teacher)}</strong></td>
                            <td>${o(n.classesText||n.classes||"-")}</td>
                            <td>${o(n.studentCount)}</td>
                            <td title="${o(n.sampleDetailText||"")}" style="${x}">
                                <div>${o((n.previousSampleCount||0)>0?n.commonSampleCount||0:"—")}</div>
                                <div style="font-size:11px; color:#64748b;">稳定 ${o((n.previousSampleCount||0)>0?n.sampleStabilityText||"0%":"待历史样本")}</div>
                            </td>
                            <td title="${o(n.sampleDetailText||"")}" style="${x}">
                                <div>${o(w)}</div>
                                <div style="font-size:11px; color:#64748b;">上次 ${o(n.previousSampleCount||0)}</div>
                            </td>
                            <td style="font-weight:700;">${o(n.avg)}</td>
                            <td title="${o(`均分赋分 ${i(n.ratedAvg,0).toFixed(1)}，优率赋分 ${i(n.ratedExc,0).toFixed(1)}，及格赋分 ${i(n.ratedPass,0).toFixed(1)}`)}">
                                <div style="font-weight:700; color:#0369a1;">${i(n.leagueScoreRaw,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#64748b;">折算 ${i(n.leagueScore,0).toFixed(1)} / 100</div>
                            </td>
                            <td class="${c}" title="${o(g)}" style="font-weight:700;">
                                <div>${C(n.baselineAdjustment,1)}</div>
                                <div style="font-size:11px; color:#64748b;">覆盖 ${o(n.baselineCoverageText||"0%")}</div>
                            </td>
                            <td>${b(n.excellentRate,1)}</td>
                            <td>${b(n.passRate,1)}</td>
                            <td style="${m}">${b(n.lowRate,1)}</td>
                            <td title="${o(`${n.conversionSummary||"暂无转化样本"}；${((f=n.conversionMetrics)==null?void 0:f.detail)||""}`)}" style="font-size:12px;">
                                <div style="font-weight:700; color:#0369a1;">${a}</div>
                                <div style="font-size:11px; color:#64748b;">${o(n.conversionSummary||"暂无转化")}</div>
                            </td>
                            <td style="font-size:12px;">${O(s.teacher,d,n)}</td>
                            <td style="background:#fffbeb; font-weight:800; color:#b45309; font-size:1.1em;">
                                <div>${i(n.fairScore,0).toFixed(1)}</div>
                                <div style="font-size:11px; color:#92400e;">同科第 ${o(n.fairRank||"-")} 名</div>
                            </td>
                        </tr>
                    `})}),p+="</tbody>",t.classList.add("comparison-table"),t.innerHTML=p,typeof window.refreshResponsiveMobileTables=="function"&&window.refreshResponsiveMobileTables(t.closest(".section")||t)}function U(){return typeof window.ensureLazySectionLoaded=="function"&&window.ensureLazySectionLoaded("teacherModal"),document.getElementById("teacherModal")}function W(){if(window.__TEACHER_ANALYSIS_MODAL_BOUND__)return!0;const t=U(),r=document.getElementById("closeModal");return!t||!r?!1:(r.addEventListener("click",()=>{const l=document.getElementById("teacherModal");l&&(l.style.display="none")}),window.addEventListener("click",l=>{const e=document.getElementById("teacherModal");e&&l.target===e&&(e.style.display="none")}),window.__TEACHER_ANALYSIS_MODAL_BOUND__=!0,!0)}function D(t,r){var $,S,A,F;const l=R(),e=l[t]?l[t][r]:null;if(!e){window.UI&&window.UI.toast("当前筛选范围下暂无该教师该学科数据","warning");return}W();const p=U(),d=document.getElementById("modalSubjectTable"),s=document.getElementById("modalAvgProgress");if(!p||!d||!s)return;const n=document.getElementById("modalTeacherName"),c=document.getElementById("modalAvgScore"),m=document.getElementById("modalExcellentRate"),x=document.getElementById("modalPassRate"),g=document.getElementById("modalAvgComparison");n&&(n.textContent=`${t} - ${r} 教学详情`),c&&(c.textContent=e.avg),m&&(m.textContent=b(e.excellentRate,1)),x&&(x.textContent=b(e.passRate,1));const w=i(e.expectedAvg,NaN),a=i(e.avgValue,NaN),f=Number.isFinite(w)&&w>0&&Number.isFinite(a),h=f?(a-w)/w*100:null;g&&(g.textContent=f?`${h>=0?"+":""}${h.toFixed(1)}%`:"—");const v=f?Math.min(Math.max(50+h,0),100):50;s.style.width=`${v}%`,s.className=f?h>=0?"progress-good":"progress-poor":"progress-neutral",s.style.backgroundColor=f?h>=0?"#22c55e":"#ef4444":"#94a3b8";const y=d.querySelector("thead"),E=d.querySelector("tbody");y&&(y.innerHTML=`
                <tr>
                    <th>学科</th>
                    <th>实际均分</th>
                    <th>预计均分</th>
                    <th>优秀率(实/预)</th>
                    <th>及格率(实/预)</th>
                    <th>低分率(实/预)</th>
                    <th>基线校正</th>
                </tr>
            `),E&&(E.innerHTML=`
                <tr>
                    <td>${o(r)}</td>
                    <td>${i(e.avgValue,0).toFixed(2)}</td>
                    <td>${i(e.expectedAvg,0).toFixed(2)}</td>
                    <td>${b(e.excellentRate,1)} / ${b(e.expectedExcellentRate,1)}</td>
                    <td>${b(e.passRate,1)} / ${b(e.expectedPassRate,1)}</td>
                    <td>${b(e.lowRate,1)} / ${b(e.expectedLowRate,1)}</td>
                    <td class="${i(e.baselineAdjustment,0)>=0?"positive-percent":"negative-percent"}">${C(e.baselineAdjustment,1)}</td>
                </tr>
            `);let u=document.getElementById("teacherModalExtra");!u&&d.parentNode&&(u=document.createElement("div"),u.id="teacherModalExtra",u.style.marginBottom="16px",d.parentNode.insertBefore(u,d)),u&&(u.innerHTML=`
                <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:12px; margin-bottom:14px;">
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">联考赋分</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${i(e.leagueScoreRaw,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">折算 ${i(e.leagueScore,0).toFixed(1)} / 100</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">基线校正</div>
                        <div style="font-size:22px; font-weight:800; color:${i(e.baselineAdjustment,0)>=0?"#15803d":"#dc2626"};">${C(e.baselineAdjustment,1)}</div>
                        <div style="font-size:12px; color:#64748b;">覆盖 ${o(e.baselineCoverageText||"0%")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">教学质量分</div>
                        <div style="font-size:22px; font-weight:800; color:#b45309;">${i(e.fairScore,0).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">同科第 ${o(e.fairRank||"-")} 名</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">置信 / 工作量</div>
                        <div style="font-size:22px; font-weight:800; color:#0f172a;">${i(e.confidenceFactor,1).toFixed(2)}</div>
                        <div style="font-size:12px; color:#64748b;">工作量修正 ${C(e.workloadAdjustment,1)}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">共同样本</div>
                        <div style="font-size:22px; font-weight:800; color:${e.sampleWarning?"#b45309":"#0f172a"};">${o((e.previousSampleCount||0)>0?e.commonSampleCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">稳定 ${o((e.previousSampleCount||0)>0?e.sampleStabilityText||"0%":"待历史样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">样本变动</div>
                        <div style="font-size:22px; font-weight:800; color:${e.sampleWarning?"#b45309":"#0f172a"};">${o((e.previousSampleCount||0)>0?e.sampleShiftCount||0:"—")}</div>
                        <div style="font-size:12px; color:#64748b;">${o((e.previousSampleCount||0)>0?`新增 ${e.addedSampleCount||0} · 缺考退出 ${e.exitedSampleCount||0}`:"暂无基线样本")}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">转化分</div>
                        <div style="font-size:22px; font-weight:800; color:#0369a1;">${i(e.conversionScore,50).toFixed(1)}</div>
                        <div style="font-size:12px; color:#64748b;">${o(e.conversionSummary||"暂无转化样本")}${i(e.conversionAdjustment,0)?` · 调整 ${C(e.conversionAdjustment,1)}`:""}</div>
                    </div>
                    <div class="bg-gray-50" style="padding:12px; border-radius:12px;">
                        <div style="font-size:12px; color:#64748b;">换老师保护</div>
                        <div style="font-size:22px; font-weight:800; color:${e.teacherChangeProtected?"#b45309":"#0f172a"};">${o(e.teacherChangeProtected?"已冻结":"正常")}</div>
                        <div style="font-size:12px; color:#64748b;">${o(e.teacherContinuityText||"任课连续")}</div>
                    </div>
                </div>
                <div style="border:1px solid #e2e8f0; border-radius:12px; padding:14px; background:#f8fafc;">
                    <div style="font-size:13px; font-weight:700; color:#334155; margin-bottom:10px;">培优 / 辅差名单</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px;">
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${T(t)}, ${T(r)}, 'excellentEdges')" style="font-size:12px; color:#0f766e; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">培优边缘生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(k(($=e.focusTargets)==null?void 0:$.excellentEdges,"暂无培优边缘生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${T(t)}, ${T(r)}, 'passEdges')" style="font-size:12px; color:#1d4ed8; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">及格临界生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(k((S=e.focusTargets)==null?void 0:S.passEdges,"暂无及格临界生"))}</div>
                        </div>
                        <div>
                            <button type="button" onclick="window.showTeacherFocusTargets(${T(t)}, ${T(r)}, 'lowRisk')" style="font-size:12px; color:#b45309; font-weight:800; margin-bottom:4px; border:0; background:transparent; cursor:pointer; padding:0;">辅差关注生</button>
                            <div style="font-size:12px; color:#475569; line-height:1.7;">${o(k((A=e.focusTargets)==null?void 0:A.lowRisk,"暂无辅差关注生"))}</div>
                        </div>
                    </div>
                    <div style="margin-top:10px; font-size:12px; color:#64748b;">${o(e.sampleDetailText||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${o(((F=e.conversionMetrics)==null?void 0:F.detail)||"")}</div>
                    <div style="margin-top:6px; font-size:12px; color:#64748b;">${o(e.baselineExamId?`历史基线：${e.baselineExamId}`:"未加载历史基线，当前仅使用本次成绩的联考赋分与当前群体均值进行校正。")}</div>
                </div>
            `),p.style.display="flex"}function G(){const t=z(),r=(t==null?void 0:t.role)||"guest",l=r==="teacher"||r==="class_teacher"?R():window.TEACHER_STATS||{};if(!Object.keys(l).length){alert("请先进行教师分析");return}const e=new Set;Object.values(l).forEach(c=>Object.keys(c||{}).forEach(m=>e.add(m)));const p=window.XLSX.utils.book_new(),d=L(),s={};Object.keys(l).forEach(c=>{Object.keys(l[c]||{}).forEach(m=>{s[m]||(s[m]=[]),s[m].push({teacherName:c,data:l[c][m]})})}),Object.keys(s).sort(M).forEach(c=>{const m=s[c].sort((w,a)=>i(a.data.fairScore,0)-i(w.data.fairScore,0)),x=[["教师姓名","学科","任教班级","人数","均分",`联考赋分(${d.total})`,"联考赋分(折算100)","基线校正","基线覆盖","上次样本","共同样本","新增样本","缺考/退出","样本稳定度","任课连续性","转化分","转化调整","预计均分","优秀率","预计优秀率","及格率","预计及格率","低分率","预计低分率","工作量修正","置信系数","教学质量分","同科排名","培优边缘生","及格临界生","辅差关注生"]];m.forEach(({teacherName:w,data:a})=>{var f,h,v;x.push([w,c,a.classesText||a.classes||"",a.studentCount,window.getExcelNum(i(a.avgValue,0)),window.getExcelNum(i(a.leagueScoreRaw,0)),window.getExcelNum(i(a.leagueScore,0)),window.getExcelNum(i(a.baselineAdjustment,0)),a.baselineCoverageText||"0%",a.previousSampleCount||0,a.commonSampleCount||0,a.addedSampleCount||0,a.exitedSampleCount||0,a.sampleStabilityText||"0%",a.teacherContinuityText||"",window.getExcelNum(i(a.conversionScore,50)),window.getExcelNum(i(a.conversionAdjustment,0)),window.getExcelNum(i(a.expectedAvg,0)),window.getExcelPercent(i(a.excellentRate,0)),window.getExcelPercent(i(a.expectedExcellentRate,0)),window.getExcelPercent(i(a.passRate,0)),window.getExcelPercent(i(a.expectedPassRate,0)),window.getExcelPercent(i(a.lowRate,0)),window.getExcelPercent(i(a.expectedLowRate,0)),window.getExcelNum(i(a.workloadAdjustment,0)),window.getExcelNum(i(a.confidenceFactor,1)),window.getExcelNum(i(a.fairScore,0)),a.fairRank||"",k((f=a.focusTargets)==null?void 0:f.excellentEdges,""),k((h=a.focusTargets)==null?void 0:h.passEdges,""),k((v=a.focusTargets)==null?void 0:v.lowRisk,"")])});const g=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName(c,"教学质量"):String(c||"Sheet").slice(0,31);window.XLSX.utils.book_append_sheet(p,window.XLSX.utils.aoa_to_sheet(x),g)});const n=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,e):new Date().toISOString().slice(0,10);window.XLSX.writeFile(p,`教师教学质量明细_${n}.xlsx`)}W(),Object.assign(window,{renderTeacherTownshipRanking:J,teacherBuildCardList:H,teacherFormatFocusList:k,renderTeacherCards:B,renderTeacherCardsV2:B,calculatePerformanceLevel:I,calculatePerformanceLevelV2:I,renderTeacherComparisonTable:V,renderTeacherComparisonTableV2:V,renderTeacherFocusSummaryCell:O,showTeacherFocusTargets:P,showTeacherFocusTargetsFromButton:Y,showTeacherDetails:D,showTeacherDetailsV2:D,exportTeacherComparisonExcel:G,exportTeacherComparisonExcelV2:G}),window.__TEACHER_ANALYSIS_UI_RUNTIME_PATCHED__=!0})();
