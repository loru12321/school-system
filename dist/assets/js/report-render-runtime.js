(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;const M=window.CompareSessionState||null,lt=window.ReportSessionState||null,zt=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>M&&typeof M.getCloudStudentCompareContext=="function"&&M.getCloudStudentCompareContext()||null),Kt=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>lt&&typeof lt.getCurrentReportStudent=="function"?lt.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),Dt=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>M&&typeof M.getDuplicateCompareExams=="function"?M.getDuplicateCompareExams()||[]:[]);function ut(s){return typeof getCloudCompareHint=="function"?getCloudCompareHint(s):isCloudContextMatchStudent(s)||isCloudContextLikelyCurrentTarget(s)?zt():null}function v(s,x,P="score"){if(x==null||x==="-"||x==="")return"";const d=parseFloat(s),z=parseFloat(x);if(isNaN(d)||isNaN(z))return"";const C=d-z;if(Math.abs(C)<.01)return'<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>';let D="",A="",u="";P==="score"?C>0?(D="#15803d",u="#dcfce7",A="▲"):(D="#b91c1c",u="#fee2e2",A="▼"):C<0?(D="#15803d",u="#dcfce7",A="▲"):(D="#b91c1c",u="#fee2e2",A="▼");const a=Math.abs(C);return`<span style="display:inline-flex; align-items:center; background:${u}; color:${D}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${A} ${P==="score"?a.toFixed(1):a}
        </span>`}function xt(s,x){var yt,vt,wt,St,Ct,$t,Rt,Tt;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),xt(s,"PC");const C=window.innerWidth<=768;if(!(x==="A4"||x==="PC"||x==="FULL")&&C||x==="IG"){const t=bt(s);return setTimeout(()=>{typeof renderIGCharts=="function"&&renderIGCharts(s)},50),t}const A=RAW_DATA.length,u=new Date().toLocaleDateString(),a=getComparisonStudentView(s,RAW_DATA),$=ut(a),c=($==null?void 0:$.previousRecord)||findPreviousRecord(a),k=typeof getStudentExamHistory=="function"?getStudentExamHistory(a):[],Y=getEffectiveCurrentExamId(),w=k.filter(t=>{const e=t.examFullKey||t.examId;return!Y||!isExamKeyEquivalentForCompare(e,Y)&&!isExamKeyEquivalentForCompare(t.examId,Y)}).slice(-1)[0]||null,X=w?w.student||w:null,p=X&&X.scores?X:c,R=((yt=p==null?void 0:p.ranks)==null?void 0:yt.total)||{},L=t=>typeof t=="number"&&Number.isFinite(t)?t:t&&typeof t=="object"&&typeof t.score=="number"&&Number.isFinite(t.score)?t.score:"-",dt=t=>String(t!=null?t:"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),l=(t,e,r="")=>`<td data-label="${dt(t)}"${r?` style="${r}"`:""}>${e}</td>`,f=t=>{var e,r,o,i,h,y,T,b;return{class:(r=(e=t==null?void 0:t.class)!=null?e:t==null?void 0:t.rankClass)!=null?r:"-",school:(i=(o=t==null?void 0:t.school)!=null?o:t==null?void 0:t.rankSchool)!=null?i:"-",township:(y=(h=t==null?void 0:t.township)!=null?h:t==null?void 0:t.rankTown)!=null?y:"-",county:(b=(T=t==null?void 0:t.county)!=null?T:t==null?void 0:t.rankCounty)!=null?b:"-"}},mt=(t,e=null)=>{const r=String((t==null?void 0:t.examFullKey)||(t==null?void 0:t.examId)||(e==null?void 0:e._sourceExam)||(e==null?void 0:e.examFullKey)||(e==null?void 0:e.examId)||"").trim();if(!r)return null;try{const o=localStorage.getItem("COUNTY_ANALYSIS_SCOPE_V1"),i=o?JSON.parse(o):{};return(i==null?void 0:i[r])||null}catch(o){return null}},F=(t,e="total",r=null)=>{var h,y,T,b,G,gt,rt,it,st;if(!t||typeof t!="object")return!1;const o=mt(r,t);if(!o||o.includesCounty!==!0)return!1;const i=e==="total"?(b=(T=(y=(h=t==null?void 0:t.ranks)==null?void 0:h.total)==null?void 0:y.county)!=null?T:t==null?void 0:t.rankCounty)!=null?b:t==null?void 0:t.countyRank:(st=(gt=(G=t==null?void 0:t.ranks)==null?void 0:G[e])==null?void 0:gt.county)!=null?st:(it=(rt=t==null?void 0:t.subjectRanks)==null?void 0:rt[e])==null?void 0:it.county;return i!=null&&i!==""},tt=t=>{var o;const e=String((o=t==null?void 0:t.class)!=null?o:"").trim(),r=typeof normalizeClass=="function"?normalizeClass(e):e;return!r||r==="-"?!1:!/^(?:无|未分班|无班级|暂无|undefined|null|nan)$/i.test(r)},et=t=>{if(typeof isCountyDirectStudentForRank=="function")return isCountyDirectStudentForRank(t);const e=String((t==null?void 0:t.school)||"").trim();if(!e||typeof getCountyDirectSchoolNames!="function"||typeof getTownshipManagedSchoolNames!="function")return!1;const r=Array.from(new Set([...Object.keys(SCHOOLS||{}),...(RAW_DATA||[]).map(i=>i==null?void 0:i.school)].map(i=>String(i||"").trim()).filter(Boolean)));return getTownshipManagedSchoolNames(r).length?getCountyDirectSchoolNames(r).some(i=>i===e||typeof areSchoolNamesEquivalent=="function"&&areSchoolNamesEquivalent(i,e)||typeof areSchoolNamesMatched=="function"&&areSchoolNamesMatched(i,e,!0)):!1},E=(t,e=!0)=>e?t==null||t===""?"-":t:"-",V=a&&typeof a=="object"&&a.scores&&typeof a.scores=="object"?a.scores:{},Z=[...new Set(SUBJECTS)],K=typeof hasStudentTownshipRankData=="function"?hasStudentTownshipRankData(RAW_DATA,Z):Object.keys(SCHOOLS).length>1,ct=typeof hasStudentCountyRankData=="function"?hasStudentCountyRankData(RAW_DATA,Z):getStudentCountyRankValue(a,"total")!=="-",U=tt(a),j=K&&!et(a),n=ct,g=E(safeGet(a,"ranks.total.township","-"),j),H=E((wt=(vt=R.township)!=null?vt:c==null?void 0:c.townRank)!=null?wt:"-",j),S=E(safeGet(a,"ranks.total.class","-"),U),ot=E((Ct=(St=R.class)!=null?St:c==null?void 0:c.classRank)!=null?Ct:"-",U),N=safeGet(a,"ranks.total.school","-"),pt=(Rt=($t=R.school)!=null?$t:c==null?void 0:c.schoolRank)!=null?Rt:"-",nt=getStudentCountyRankValue(a,"total"),W=F(p,"total",w)&&(Tt=R.county)!=null?Tt:"-",q=Object.keys(SCHOOLS).length<=1,O=K?"":"display:none !important;",B=n?"":"display:none !important;";let J="";if(CONFIG.name==="9年级"){let t=0,e=0;["语文","数学","英语","物理","化学"].forEach(r=>{V[r]!==void 0&&(t+=V[r],e++)}),e>0&&(J+=`<tr style="background:rgba(248,250,252,0.5);">
                    ${l("科目","🏁 核心五科","font-weight:bold; color:#475569;")}
                    ${l("成绩（对比）",t.toFixed(1),"font-weight:bold; color:#2563eb;")}
                    ${l("班级排名","-")}
                    ${l("校级排名","-")}
                    ${l("全镇排名","-",O)}
                    ${l("全县排名","-",B)}
                </tr>`)}const I=getComparisonTotalSubjects(),_=getComparisonTotalValue(a,I),m=CONFIG.name==="9年级"&&I.length?"五科总分":CONFIG.label,Q=p?recalcPrevTotal(p):"-",At=v(_,Q,"score"),Et=U?v(S,ot,"rank"):"",jt=v(N,pt,"rank"),Ht=j?v(g,H,"rank"):"",Nt=n?v(nt,W,"rank"):"";J+=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            ${l("科目",`🏆 ${m}`,"font-weight:bold; color:#1e3a8a;")}
            ${l("成绩（对比）",`${Number.isFinite(_)?_.toFixed(2):"-"} ${At}`,"font-weight:800; font-size:16px; color:#1e40af;")}
            ${l("班级排名",`${S} ${Et}`,"font-weight:bold; color:#334155;")}
            ${l("校级排名",`${N} ${jt}`,"font-weight:bold; color:#334155;")}
            ${l("全镇排名",`${g} ${Ht}`,`${O} font-weight:bold; color:#334155;`)}
            ${l("全县排名",`${n?nt:"-"} ${Nt}`,`${B} font-weight:bold; color:#334155;`)}
        </tr>`,[...new Set(SUBJECTS)].forEach(t=>{if(V[t]!==void 0){const e=p&&p.scores?L(p.scores[t]):"-",r=v(V[t],e,"score");let o=f(p&&p.ranks?p.ranks[t]:null);o.class==="-"&&o.school==="-"&&o.township==="-"&&c&&c.ranks&&c.ranks[t]&&(o=f(c.ranks[t]));const i=safeGet(a,`ranks.${t}.school`,"-"),h=v(i,o.school||"-","rank"),y=E(safeGet(a,`ranks.${t}.township`,"-"),j),T=j?v(y,o.township||"-","rank"):"",b=getStudentCountyRankValue(a,t),G=n&&F(p,t,w)?v(b,o.county||"-","rank"):"";J+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    ${l("科目",t,"font-weight:600; color:#475569;")}
                    ${l("成绩（对比）",`${V[t]} ${r}`,"font-weight:bold; color:#334155;")}
                    ${l("总分班排","-","color:#cbd5e1;")}
                    ${l("校级排名",`${i} <span style="font-size:0.9em;">${h}</span>`,"color:#64748b;")}
                    ${l("全镇排名",`${y} <span style="font-size:0.9em;">${T}</span>`,`color:#64748b; ${O}`)}
                    ${l("全县排名",`${n?b:"-"} <span style="font-size:0.9em;">${G}</span>`,`color:#64748b; ${B}`)}
                </tr>`}});const kt=`
            <style>
                .fluent-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
                .fluent-header { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); }
                .fluent-title { font-size: 15px; font-weight: 700; color: #1e293b; }
                .fluent-subtitle { font-size: 11px; color: #94a3b8; margin-left: auto; }
                .fluent-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .fluent-table th { text-align: center; padding: 10px 5px; color: #64748b; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0; background: rgba(248, 250, 252, 0.5); }
                .fluent-table td { text-align: center; padding: 12px 5px; border-bottom: 1px solid rgba(0,0,0,0.03); font-size: 14px; }
                .fluent-table tr:last-child td { border-bottom: none; }
                .report-insight-grid { display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:12px; margin:16px 0 12px; }
                .report-insight-card { border-radius:18px; padding:16px 18px; border:1px solid #e2e8f0; background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); box-shadow:0 10px 26px rgba(15, 23, 42, 0.04); }
                .report-insight-card.tone-score { border-color:#bfdbfe; background:linear-gradient(180deg, #ffffff 0%, #eff6ff 100%); }
                .report-insight-card.tone-rank { border-color:#fde68a; background:linear-gradient(180deg, #ffffff 0%, #fffbeb 100%); }
                .report-insight-card.tone-balance { border-color:#bbf7d0; background:linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%); }
                .report-insight-card.tone-trend { border-color:#fbcfe8; background:linear-gradient(180deg, #ffffff 0%, #fdf2f8 100%); }
                .report-insight-label { display:block; font-size:12px; font-weight:700; color:#64748b; margin-bottom:8px; }
                .report-insight-value { display:block; font-size:20px; line-height:1.35; color:#0f172a; font-weight:800; }
                .report-insight-sub { display:block; margin-top:6px; font-size:12px; color:#64748b; line-height:1.6; }
                .report-chip-row { display:flex; gap:8px; flex-wrap:wrap; margin:0 0 18px; }
                .report-chip { display:inline-flex; align-items:center; min-height:32px; padding:0 12px; border-radius:999px; font-size:12px; font-weight:700; }
                .report-chip-focus { background:#fff7ed; color:#c2410c; border:1px solid #fdba74; }
                .report-chip-guard { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
                .report-pill { display:inline-flex; align-items:center; min-height:26px; padding:0 10px; border-radius:999px; font-size:11px; font-weight:700; color:#475569; background:#f8fafc; border:1px solid #e2e8f0; margin-top:8px; }
                .report-pill.up { color:#166534; background:#dcfce7; border-color:#86efac; }
                .report-pill.down { color:#b91c1c; background:#fee2e2; border-color:#fca5a5; }
                .report-pill.ok, .report-pill.steady { color:#0369a1; background:#e0f2fe; border-color:#7dd3fc; }
                .report-pill.info { color:#7c2d12; background:#fff7ed; border-color:#fdba74; }
                .report-pill.warn { color:#b91c1c; background:#fff1f2; border-color:#fda4af; }
                .report-action-grid { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:12px; margin:0 0 18px; }
                .report-action-card { border-radius:18px; padding:16px 18px; border:1px solid #e2e8f0; background:#fff; min-height:140px; }
                .report-action-card.tone-warn { background:linear-gradient(180deg, #ffffff 0%, #fff7ed 100%); border-color:#fdba74; }
                .report-action-card.tone-info { background:linear-gradient(180deg, #ffffff 0%, #eff6ff 100%); border-color:#bfdbfe; }
                .report-action-card.tone-ok { background:linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%); border-color:#bbf7d0; }
                .report-action-card.tone-goal { background:linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%); border-color:#ddd6fe; }
                .report-action-title { font-size:14px; font-weight:800; color:#0f172a; margin-bottom:8px; }
                .report-action-text { font-size:13px; color:#475569; line-height:1.8; }
                .report-subject-board { display:grid; grid-template-columns:repeat(2, minmax(0, 1fr)); gap:12px; margin:0 0 18px; }
                .report-subject-item { border-radius:16px; padding:14px 16px; border:1px solid #e2e8f0; background:#fff; }
                .report-subject-item.tone-strong { background:linear-gradient(180deg, #ffffff 0%, #effdf5 100%); border-color:#bbf7d0; }
                .report-subject-item.tone-weak { background:linear-gradient(180deg, #ffffff 0%, #fff7ed 100%); border-color:#fdba74; }
                .report-subject-item.tone-steady { background:linear-gradient(180deg, #ffffff 0%, #eff6ff 100%); border-color:#bfdbfe; }
                .report-subject-head { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
                .report-subject-head strong { font-size:14px; color:#0f172a; }
                .report-subject-head span { font-size:11px; font-weight:700; color:#64748b; }
                .report-subject-meta { display:flex; gap:10px; flex-wrap:wrap; font-size:11px; color:#64748b; margin-bottom:10px; }
                .report-progress-track { height:8px; border-radius:999px; background:#e2e8f0; overflow:hidden; }
                .report-progress-bar { height:100%; border-radius:999px; }
                .report-progress-bar.tone-strong { background:linear-gradient(90deg, #22c55e 0%, #16a34a 100%); }
                .report-progress-bar.tone-weak { background:linear-gradient(90deg, #fb923c 0%, #ea580c 100%); }
                .report-progress-bar.tone-steady { background:linear-gradient(90deg, #60a5fa 0%, #2563eb 100%); }
                .report-reality-note { margin-top:12px; border-radius:18px; border:1px dashed #cbd5e1; padding:14px 16px; background:#f8fafc; }
                .report-reality-title { font-size:12px; font-weight:800; color:#475569; margin-bottom:8px; }
                .report-metric-tipline { margin-top:8px; padding:8px 10px; border-radius:12px; background:#ffffff; color:#475569; font-size:12px; font-weight:700; border:1px solid #dbeafe; }
                .report-reality-list { margin:0; padding-left:18px; font-size:12px; color:#64748b; line-height:1.75; }
                .report-reality-list li { margin-bottom:4px; }
                .report-subject-note { margin-top:10px; font-size:11px; color:#64748b; line-height:1.65; }
                @media (max-width: 768px) { .report-insight-grid, .report-action-grid, .report-subject-board { grid-template-columns:minmax(0, 1fr); } .report-insight-card, .report-action-card, .report-subject-item { padding:14px 16px; } }
                @media print { .fluent-card { box-shadow: none; border: 1px solid #ccc; backdrop-filter: none; } }
            </style>
        `,Ft=buildChartNarrative(a),at=buildStudentInsightModel(a,k),Ot=renderStudentInsightOverview(at),It=renderStudentActionPlan(at),_t=renderStudentSubjectBoard(at),Gt=renderStudentRealityNote(at),Mt=$?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${$.prevExamId||"上次"} → ${$.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${$.title||"云端记录"}</span>
            </div>
        </div>`:"",Pt=Dt().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",Vt=`
        ${kt}
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${s.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${u}</p>
        </div>
        ${Mt}
        ${Pt}
        <div class="fluent-card" style="padding:15px 25px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:baseline; gap:15px;">
                    <span style="font-size:24px; font-weight:800; color:#1e3a8a;">${s.name}</span>
                    <span style="font-size:14px; color:#475569; background:#fff; padding:2px 8px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${s.class}</span>
                </div>
                <div style="font-size:13px; color:#64748b; font-family:monospace;">考号: ${s.id}</div>
            </div>
        </div>
        <div class="fluent-card" style="padding:18px 20px;">
            <div class="fluent-header"><i class="ti ti-badge-4k" style="color:#2563eb;"></i><span class="fluent-title">成绩快照与真实定位</span></div>
            ${Ot}
            ${It}
            ${_t}
            ${Gt}
        </div>
        <div class="fluent-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩 (对比)</th><th>总分班排</th><th>校排</th><th style="${O}">全镇排名</th><th style="${B}">全县排名</th></tr></thead>
                <tbody>${J}</tbody>
            </table>
        </div>`,ft=k;let ht="";if(ft.length>1){let t="",e=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${m}</th><th>校排</th>`;K&&(e+="<th>镇排</th>");for(let r=ft.length-1;r>=0;r--){const o=ft[r],i=o.examFullKey||o.examId,h=getEffectiveCurrentExamId(),y=!!h&&(isExamKeyEquivalentForCompare(i,h)||isExamKeyEquivalentForCompare(o.examId,h)),T=y?"background:rgba(239,246,255,0.7); font-weight:bold;":"",b=o.student||o,G=getComparisonTotalValue(b,I),rt=Number.isFinite(G)?G.toFixed(1):"-",it=safeGet(b,"ranks.total.school",o.rankSchool||"-"),st=safeGet(b,"ranks.total.township",o.rankTown||"-");t+=`<tr style="${T}">
                ${l("考试名称",`${y?"⭐ ":""}${o.examLabel||o.examId||o.examFullKey||"-"}`,"text-align:left; padding-left:20px; color:#475569;")}
                ${l(m,rt,"color:#2563eb;")}
                ${l("校级排名",it,"color:#64748b;")}
                ${K?l("全镇排名",st,"color:#64748b;"):""}
            </tr>`}ht=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${e}</tr></thead>
                <tbody>${t}</tbody>
            </table>
        </div>`}return`
        ${Vt}
        ${ht}
        <div style="display:flex; gap:15px; margin-bottom:15px; flex-wrap:wrap; margin-top:20px;">
            <div class="fluent-card" style="flex:1; min-width:300px; margin-bottom:0; display:flex; flex-direction:column;">
                <div class="fluent-header"><i class="ti ti-radar" style="color:#2563eb;"></i><span class="fluent-title">${CONFIG.name==="9年级"?"五科综合素质评价":"综合素质评价"} (百分位)</span></div>
                <div style="flex:1; position:relative; min-height:220px;"><canvas id="radarChart"></canvas></div>
            </div>            
            <div class="fluent-card" style="flex:1; min-width:300px; margin-bottom:0; display:flex; flex-direction:column;">
                <div class="fluent-header"><i class="ti ti-scale" style="color:#059669;"></i><span class="fluent-title">${CONFIG.name==="9年级"?"五科学科均衡度诊断":"学科均衡度诊断"}</span></div>
                <div style="flex:1; position:relative; min-height:220px;"><canvas id="varianceChart"></canvas></div>
            </div> 
        </div>
        ${Ft}
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>`}function bt(s){var U,j;const x=new Date().toLocaleDateString(),P=RAW_DATA.length,d=getComparisonStudentView(s,RAW_DATA),z=getComparisonTotalSubjects(),C=getComparisonTotalValue(d,z),D=typeof hasStudentTownshipRankData=="function"?hasStudentTownshipRankData(RAW_DATA,z):Object.keys(SCHOOLS).length>1,A=typeof hasStudentCountyRankData=="function"?hasStudentCountyRankData(RAW_DATA,z):getStudentCountyRankValue(d,"total")!=="-",u=D&&!isCountyDirectStudent(d),a=u?safeGet(d,"ranks.total.township","-"):safeGet(d,"ranks.total.school","-"),$=(d==null?void 0:d.school)&&((j=(U=SCHOOLS==null?void 0:SCHOOLS[d.school])==null?void 0:U.students)==null?void 0:j.length)||P||1,k=typeof a=="number"?((1-a/(u?P||1:$))*100).toFixed(0):"-",Y=s.name.charAt(0),w=ut(d),p=Object.keys(SCHOOLS).length<=1?"全校":u?"全镇":"本校";let R="";k>=90?R="🌟 卓越之星":k>=75?R="🔥 进步飞速":R="📚 持续努力";let L="";z.forEach(n=>{if(d.scores[n]!==void 0){const g=d.scores[n],H=safeGet(d,`ranks.${n}.school`,"-"),S=u?safeGet(d,`ranks.${n}.township`,"-"):"-",ot=getStudentCountyRankValue(d,n),N=[`级#${H}`];u&&N.push(`镇#${S}`),A&&N.push(`县#${ot}`),L+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${n}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${g}</span>
                            <span class="insta-comm-rank">${N.join(" | ")}</span>
                        </div>
                    </div>
                `}});const dt=`
            <div style="margin-top: 20px; padding: 0 14px;">
                <!-- 雷达图容器 -->
                <div style="background: #f8fafc; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0; margin-bottom: 15px;">
                    <div style="font-size: 13px; font-weight: bold; color: #475569; margin-bottom: 10px; border-left: 4px solid #2563eb; padding-left: 8px;">
                        📊 ${CONFIG.name==="9年级"?"五科能力雷达图":"学科能力雷达图"}
                    </div>
                    <div style="height: 250px; position: relative;">
                        <canvas id="igRadarChart"></canvas>
                    </div>
                </div>

                <!-- 均衡度容器 -->
                <div style="background: #f8fafc; border-radius: 8px; padding: 15px; border: 1px solid #e2e8f0;">
                    <div style="font-size: 13px; font-weight: bold; color: #475569; margin-bottom: 10px; border-left: 4px solid #059669; padding-left: 8px;">
                        ⚖️ ${CONFIG.name==="9年级"?"五科学科均衡度诊断":"学科均衡度诊断"}
                    </div>
                    <div style="height: 200px; position: relative;">
                        <canvas id="igVarianceChart"></canvas>
                    </div>
                    <div style="font-size: 10px; color: #94a3b8; text-align: center; margin-top: 5px;">
                        注：向右(绿)为优势学科，向左(红)为薄弱学科
                    </div>
                </div>
            </div>
        `,f=(()=>{let n=[],g=[],H=[],S=[];getComparisonTotalSubjects().forEach(W=>{if(s.scores[W]!==void 0){const q=RAW_DATA.map(m=>m.scores[W]).filter(m=>typeof m=="number");if(q.length<2)return;const O=q.reduce((m,Q)=>m+Q,0)/q.length,B=q.reduce((m,Q)=>m+Math.pow(Q-O,2),0)/q.length,J=Math.sqrt(B)||1,I=(s.scores[W]-O)/J;S.push(I);const _=`${W}`;I>=.8?n.push(_):I<=-.8?g.push(_):H.push(_)}});const N=S.length?Math.max(...S):0,pt=S.length?Math.min(...S):0,nt=N-pt;return{strong:n,weak:g,mid:H,range:nt}})(),F=(n=>n>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:n>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(f.range),tt=`
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${F.bg}; color:${F.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${F.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${F.text}
                </div>
            </div>
        `,et=(n,g)=>!n||n.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${g}</div>`:n.map(H=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${H}</span>`).join(""),E=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科
                        <span style="margin-left:auto; font-size:10px; color:#999;">${f.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${et(f.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${f.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${f.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${et(f.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,Z=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const n=[];if(f.weak.length>0){const g=f.weak.join("、");n.push(`🎯 <strong>精准攻坚：</strong>针对 ${g}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(f.strong.length>0){const g=f.strong.join("、");n.push(`🛡️ <strong>保持自信：</strong>${g} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return f.strong.length===0&&f.weak.length===0&&n.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),n.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),n.map(g=>`<li style="margin-bottom:8px; line-height:1.5;">${g}</li>`).join("")})()}
                </ul>
            </div>
        `,K=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(C)?C.toFixed(1):"-"}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(d,"ranks.total.school","-")}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${p} ${k}% 的考生</div>
                </div>
            </div>
        `,ct=w?`
            <div style="margin:12px 14px 0 14px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:10px 12px;">
                <div style="font-size:12px; color:#3730a3; line-height:1.5;">
                    <strong>状态：☁️ 云端对比已启用</strong><br>
                    当前对比：${w.prevExamId||"上次"} → ${w.latestExamId||"本次"}
                </div>
                <div style="font-size:11px; color:#6366f1; margin-top:4px;">来源：${w.title||"云端记录"}</div>
            </div>
        `:"";return`
            <div class="insta-view-container" style="background:#fafafa; padding-top:20px;">
                <div class="insta-card">
                    <!-- Header -->
                    <div class="insta-header">
                        <div class="insta-avatar-ring"><div class="insta-avatar">${Y}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${s.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${s.school} · ${s.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${K}
                    ${igInsightHtml}
                    
                    <!-- Actions (点赞栏 - 旧模块) -->
                    <div class="insta-actions">
                        <div class="insta-action-left">
                            <i class="ti ti-heart insta-icon liked"></i>
                            <i class="ti ti-message-circle-2 insta-icon"></i>
                            <i class="ti ti-send insta-icon"></i>
                        </div>
                        <i class="ti ti-bookmark insta-icon"></i>
                    </div>
                    
                    <!-- Likes -->
                    <div class="insta-likes">${(Math.random()*100+50).toFixed(0)} likes</div>
                    
                    <!-- Caption (文案 - 旧模块) -->
                    <div class="insta-caption">
                        <span class="insta-caption-name">${CONFIG.name}教务处</span>
                        本次考试成绩已出炉！${R}，请查收您的学习报告。
                        <span class="insta-tags">#期末考试 #${s.school} #学习报告</span>
                    </div>

                    <!-- 2. 🟢 新增：模块④ 学情结构一句话诊断 -->
                    ${typeof tt!="undefined"?tt:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof E!="undefined"?E:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${ct}
                    ${dt}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${L}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof Z!="undefined"?Z:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${x}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}Object.assign(window,{getTrendBadge:v,renderSingleReportCardHTML:xt,renderInstagramCard:bt}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
