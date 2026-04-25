(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;const W=window.CompareSessionState||null,rt=window.ReportSessionState||null,Rt=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>W&&typeof W.getCloudStudentCompareContext=="function"&&W.getCloudStudentCompareContext()||null),Vt=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>rt&&typeof rt.getCurrentReportStudent=="function"?rt.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),Tt=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>W&&typeof W.getDuplicateCompareExams=="function"?W.getDuplicateCompareExams()||[]:[]);function gt(i){return typeof getCloudCompareHint=="function"?getCloudCompareHint(i):isCloudContextMatchStudent(i)||isCloudContextLikelyCurrentTarget(i)?Rt():null}function y(i,x,q="score"){if(x==null||x==="-"||x==="")return"";const l=parseFloat(i),k=parseFloat(x);if(isNaN(l)||isNaN(k))return"";const w=l-k;if(Math.abs(w)<.01)return'<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>';let E="",D="",u="";q==="score"?w>0?(E="#15803d",u="#dcfce7",D="▲"):(E="#b91c1c",u="#fee2e2",D="▼"):w<0?(E="#15803d",u="#dcfce7",D="▲"):(E="#b91c1c",u="#fee2e2",D="▼");const n=Math.abs(w);return`<span style="display:inline-flex; align-items:center; background:${u}; color:${E}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${D} ${q==="score"?n.toFixed(1):n}
        </span>`}function ut(i,x){var mt,ht,yt,vt,wt,Ct,St,$t;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),ut(i,"PC");const w=window.innerWidth<=768;if(!(x==="A4"||x==="PC"||x==="FULL")&&w||x==="IG"){const t=xt(i);return setTimeout(()=>{typeof renderIGCharts=="function"&&renderIGCharts(i)},50),t}const D=RAW_DATA.length,u=new Date().toLocaleDateString(),n=getComparisonStudentView(i,RAW_DATA),C=gt(n),c=(C==null?void 0:C.previousRecord)||findPreviousRecord(n),O=typeof getStudentExamHistory=="function"?getStudentExamHistory(n):[],B=getEffectiveCurrentExamId(),A=O.filter(t=>{const e=t.examFullKey||t.examId;return!B||!isExamKeyEquivalentForCompare(e,B)&&!isExamKeyEquivalentForCompare(t.examId,B)}).slice(-1)[0]||null,L=A?A.student||A:null,p=L&&L.scores?L:c,S=((mt=p==null?void 0:p.ranks)==null?void 0:mt.total)||{},tt=t=>typeof t=="number"&&Number.isFinite(t)?t:t&&typeof t=="object"&&typeof t.score=="number"&&Number.isFinite(t.score)?t.score:"-",it=t=>String(t!=null?t:"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),s=(t,e,r="")=>`<td data-label="${it(t)}"${r?` style="${r}"`:""}>${e}</td>`,f=t=>{var e,r,o,d,m,h,z,b;return{class:(r=(e=t==null?void 0:t.class)!=null?e:t==null?void 0:t.rankClass)!=null?r:"-",school:(d=(o=t==null?void 0:t.school)!=null?o:t==null?void 0:t.rankSchool)!=null?d:"-",township:(h=(m=t==null?void 0:t.township)!=null?m:t==null?void 0:t.rankTown)!=null?h:"-",county:(b=(z=t==null?void 0:t.county)!=null?z:t==null?void 0:t.rankCounty)!=null?b:"-"}},st=(t,e="total")=>{var o,d,m,h,z,b,V,ft,at;if(!t||typeof t!="object")return!1;const r=e==="total"?(h=(m=(d=(o=t==null?void 0:t.ranks)==null?void 0:o.total)==null?void 0:d.county)!=null?m:t==null?void 0:t.rankCounty)!=null?h:t==null?void 0:t.countyRank:(at=(b=(z=t==null?void 0:t.ranks)==null?void 0:z[e])==null?void 0:b.county)!=null?at:(ft=(V=t==null?void 0:t.subjectRanks)==null?void 0:V[e])==null?void 0:ft.county;return r!=null&&r!==""},U=t=>{var o;const e=String((o=t==null?void 0:t.class)!=null?o:"").trim(),r=typeof normalizeClass=="function"?normalizeClass(e):e;return!r||r==="-"?!1:!/^(?:无|未分班|无班级|暂无|undefined|null|nan)$/i.test(r)},et=t=>{if(typeof isCountyDirectStudentForRank=="function")return isCountyDirectStudentForRank(t);const e=String((t==null?void 0:t.school)||"").trim();if(!e||typeof getCountyDirectSchoolNames!="function"||typeof getTownshipManagedSchoolNames!="function")return!1;const r=Array.from(new Set([...Object.keys(SCHOOLS||{}),...(RAW_DATA||[]).map(d=>d==null?void 0:d.school)].map(d=>String(d||"").trim()).filter(Boolean)));return getTownshipManagedSchoolNames(r).length?getCountyDirectSchoolNames(r).some(d=>d===e||typeof areSchoolNamesEquivalent=="function"&&areSchoolNamesEquivalent(d,e)||typeof areSchoolNamesMatched=="function"&&areSchoolNamesMatched(d,e,!0)):!1},j=(t,e=!0)=>e?t==null||t===""?"-":t:"-",H=n&&typeof n=="object"&&n.scores&&typeof n.scores=="object"?n.scores:{},lt=[...new Set(SUBJECTS)],I=typeof hasStudentTownshipRankData=="function"?hasStudentTownshipRankData(RAW_DATA,lt):Object.keys(SCHOOLS).length>1,dt=typeof hasStudentCountyRankData=="function"?hasStudentCountyRankData(RAW_DATA,lt):getStudentCountyRankValue(n,"total")!=="-",J=U(n),N=I&&!et(n),F=dt,a=j(safeGet(n,"ranks.total.township","-"),N),g=j((yt=(ht=S.township)!=null?ht:c==null?void 0:c.townRank)!=null?yt:"-",N),$=j(safeGet(n,"ranks.total.class","-"),J),R=j((wt=(vt=S.class)!=null?vt:c==null?void 0:c.classRank)!=null?wt:"-",J),Z=safeGet(n,"ranks.total.school","-"),_=(St=(Ct=S.school)!=null?Ct:c==null?void 0:c.schoolRank)!=null?St:"-",ot=getStudentCountyRankValue(n,"total"),ct=st(p,"total")&&($t=S.county)!=null?$t:"-",Y=Object.keys(SCHOOLS).length<=1,v=I?"":"display:none !important;",G=F?"":"display:none !important;";let K="";if(CONFIG.name==="9年级"){let t=0,e=0;["语文","数学","英语","物理","化学"].forEach(r=>{H[r]!==void 0&&(t+=H[r],e++)}),e>0&&(K+=`<tr style="background:rgba(248,250,252,0.5);">
                    ${s("科目","🏁 核心五科","font-weight:bold; color:#475569;")}
                    ${s("成绩（对比）",t.toFixed(1),"font-weight:bold; color:#2563eb;")}
                    ${s("班级排名","-")}
                    ${s("校级排名","-")}
                    ${s("全镇排名","-",v)}
                    ${s("全县排名","-",G)}
                </tr>`)}const Q=getComparisonTotalSubjects(),M=getComparisonTotalValue(n,Q),P=CONFIG.name==="9年级"&&Q.length?"五科总分":CONFIG.label,T=p?recalcPrevTotal(p):"-",X=y(M,T,"score"),zt=J?y($,R,"rank"):"",kt=y(Z,_,"rank"),Et=N?y(a,g,"rank"):"",Dt=F?y(ot,ct,"rank"):"";K+=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            ${s("科目",`🏆 ${P}`,"font-weight:bold; color:#1e3a8a;")}
            ${s("成绩（对比）",`${Number.isFinite(M)?M.toFixed(2):"-"} ${X}`,"font-weight:800; font-size:16px; color:#1e40af;")}
            ${s("班级排名",`${$} ${zt}`,"font-weight:bold; color:#334155;")}
            ${s("校级排名",`${Z} ${kt}`,"font-weight:bold; color:#334155;")}
            ${s("全镇排名",`${a} ${Et}`,`${v} font-weight:bold; color:#334155;`)}
            ${s("全县排名",`${F?ot:"-"} ${Dt}`,`${G} font-weight:bold; color:#334155;`)}
        </tr>`,[...new Set(SUBJECTS)].forEach(t=>{if(H[t]!==void 0){const e=p&&p.scores?tt(p.scores[t]):"-",r=y(H[t],e,"score");let o=f(p&&p.ranks?p.ranks[t]:null);o.class==="-"&&o.school==="-"&&o.township==="-"&&c&&c.ranks&&c.ranks[t]&&(o=f(c.ranks[t]));const d=safeGet(n,`ranks.${t}.school`,"-"),m=y(d,o.school||"-","rank"),h=j(safeGet(n,`ranks.${t}.township`,"-"),N),z=N?y(h,o.township||"-","rank"):"",b=getStudentCountyRankValue(n,t),V=F&&st(p,t)?y(b,o.county||"-","rank"):"";K+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    ${s("科目",t,"font-weight:600; color:#475569;")}
                    ${s("成绩（对比）",`${H[t]} ${r}`,"font-weight:bold; color:#334155;")}
                    ${s("总分班排","-","color:#cbd5e1;")}
                    ${s("校级排名",`${d} <span style="font-size:0.9em;">${m}</span>`,"color:#64748b;")}
                    ${s("全镇排名",`${h} <span style="font-size:0.9em;">${z}</span>`,`color:#64748b; ${v}`)}
                    ${s("全县排名",`${F?b:"-"} <span style="font-size:0.9em;">${V}</span>`,`color:#64748b; ${G}`)}
                </tr>`}});const At=`
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
        `,jt=buildChartNarrative(n),nt=buildStudentInsightModel(n,O),Ht=renderStudentInsightOverview(nt),Nt=renderStudentActionPlan(nt),Ft=renderStudentSubjectBoard(nt),Ot=renderStudentRealityNote(nt),It=C?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${C.prevExamId||"上次"} → ${C.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${C.title||"云端记录"}</span>
            </div>
        </div>`:"",_t=Tt().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",Gt=`
        ${At}
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${i.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${u}</p>
        </div>
        ${It}
        ${_t}
        <div class="fluent-card" style="padding:15px 25px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:baseline; gap:15px;">
                    <span style="font-size:24px; font-weight:800; color:#1e3a8a;">${i.name}</span>
                    <span style="font-size:14px; color:#475569; background:#fff; padding:2px 8px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${i.class}</span>
                </div>
                <div style="font-size:13px; color:#64748b; font-family:monospace;">考号: ${i.id}</div>
            </div>
        </div>
        <div class="fluent-card" style="padding:18px 20px;">
            <div class="fluent-header"><i class="ti ti-badge-4k" style="color:#2563eb;"></i><span class="fluent-title">成绩快照与真实定位</span></div>
            ${Ht}
            ${Nt}
            ${Ft}
            ${Ot}
        </div>
        <div class="fluent-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩 (对比)</th><th>总分班排</th><th>校排</th><th style="${v}">全镇排名</th><th style="${G}">全县排名</th></tr></thead>
                <tbody>${K}</tbody>
            </table>
        </div>`,pt=O;let bt="";if(pt.length>1){let t="",e=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${P}</th><th>校排</th>`;I&&(e+="<th>镇排</th>");for(let r=pt.length-1;r>=0;r--){const o=pt[r],d=o.examFullKey||o.examId,m=getEffectiveCurrentExamId(),h=!!m&&(isExamKeyEquivalentForCompare(d,m)||isExamKeyEquivalentForCompare(o.examId,m)),z=h?"background:rgba(239,246,255,0.7); font-weight:bold;":"",b=o.student||o,V=getComparisonTotalValue(b,Q),at=Number.isFinite(V)?V.toFixed(1):"-",Mt=safeGet(b,"ranks.total.school",o.rankSchool||"-"),Pt=safeGet(b,"ranks.total.township",o.rankTown||"-");t+=`<tr style="${z}">
                ${s("考试名称",`${h?"⭐ ":""}${o.examLabel||o.examId||o.examFullKey||"-"}`,"text-align:left; padding-left:20px; color:#475569;")}
                ${s(P,at,"color:#2563eb;")}
                ${s("校级排名",Mt,"color:#64748b;")}
                ${I?s("全镇排名",Pt,"color:#64748b;"):""}
            </tr>`}bt=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${e}</tr></thead>
                <tbody>${t}</tbody>
            </table>
        </div>`}return`
        ${Gt}
        ${bt}
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
        ${jt}
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>`}function xt(i){var N,F;const x=new Date().toLocaleDateString(),q=RAW_DATA.length,l=getComparisonStudentView(i,RAW_DATA),k=getComparisonTotalSubjects(),w=getComparisonTotalValue(l,k),E=typeof hasStudentTownshipRankData=="function"?hasStudentTownshipRankData(RAW_DATA,k):Object.keys(SCHOOLS).length>1,D=typeof hasStudentCountyRankData=="function"?hasStudentCountyRankData(RAW_DATA,k):getStudentCountyRankValue(l,"total")!=="-",u=E&&!isCountyDirectStudent(l),n=u?safeGet(l,"ranks.total.township","-"):safeGet(l,"ranks.total.school","-"),C=(l==null?void 0:l.school)&&((F=(N=SCHOOLS==null?void 0:SCHOOLS[l.school])==null?void 0:N.students)==null?void 0:F.length)||q||1,O=typeof n=="number"?((1-n/(u?q||1:C))*100).toFixed(0):"-",B=i.name.charAt(0),A=gt(l),p=Object.keys(SCHOOLS).length<=1?"全校":u?"全镇":"本校";let S="";O>=90?S="🌟 卓越之星":O>=75?S="🔥 进步飞速":S="📚 持续努力";let tt="";k.forEach(a=>{if(l.scores[a]!==void 0){const g=l.scores[a],$=safeGet(l,`ranks.${a}.school`,"-"),R=u?safeGet(l,`ranks.${a}.township`,"-"):"-",Z=getStudentCountyRankValue(l,a),_=[`级#${$}`];u&&_.push(`镇#${R}`),D&&_.push(`县#${Z}`),tt+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${a}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${g}</span>
                            <span class="insta-comm-rank">${_.join(" | ")}</span>
                        </div>
                    </div>
                `}});const it=`
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
        `,f=(()=>{let a=[],g=[],$=[],R=[];getComparisonTotalSubjects().forEach(Y=>{if(i.scores[Y]!==void 0){const v=RAW_DATA.map(T=>T.scores[Y]).filter(T=>typeof T=="number");if(v.length<2)return;const G=v.reduce((T,X)=>T+X,0)/v.length,K=v.reduce((T,X)=>T+Math.pow(X-G,2),0)/v.length,Q=Math.sqrt(K)||1,M=(i.scores[Y]-G)/Q;R.push(M);const P=`${Y}`;M>=.8?a.push(P):M<=-.8?g.push(P):$.push(P)}});const _=R.length?Math.max(...R):0,ot=R.length?Math.min(...R):0,ct=_-ot;return{strong:a,weak:g,mid:$,range:ct}})(),U=(a=>a>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:a>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(f.range),et=`
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${U.bg}; color:${U.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${U.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${U.text}
                </div>
            </div>
        `,j=(a,g)=>!a||a.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${g}</div>`:a.map($=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${$}</span>`).join(""),H=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科
                        <span style="margin-left:auto; font-size:10px; color:#999;">${f.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${j(f.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${f.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${f.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${j(f.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,I=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const a=[];if(f.weak.length>0){const g=f.weak.join("、");a.push(`🎯 <strong>精准攻坚：</strong>针对 ${g}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(f.strong.length>0){const g=f.strong.join("、");a.push(`🛡️ <strong>保持自信：</strong>${g} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return f.strong.length===0&&f.weak.length===0&&a.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),a.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),a.map(g=>`<li style="margin-bottom:8px; line-height:1.5;">${g}</li>`).join("")})()}
                </ul>
            </div>
        `,dt=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(w)?w.toFixed(1):"-"}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(l,"ranks.total.school","-")}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${p} ${O}% 的考生</div>
                </div>
            </div>
        `,J=A?`
            <div style="margin:12px 14px 0 14px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:10px 12px;">
                <div style="font-size:12px; color:#3730a3; line-height:1.5;">
                    <strong>状态：☁️ 云端对比已启用</strong><br>
                    当前对比：${A.prevExamId||"上次"} → ${A.latestExamId||"本次"}
                </div>
                <div style="font-size:11px; color:#6366f1; margin-top:4px;">来源：${A.title||"云端记录"}</div>
            </div>
        `:"";return`
            <div class="insta-view-container" style="background:#fafafa; padding-top:20px;">
                <div class="insta-card">
                    <!-- Header -->
                    <div class="insta-header">
                        <div class="insta-avatar-ring"><div class="insta-avatar">${B}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${i.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${i.school} · ${i.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${dt}
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
                        本次考试成绩已出炉！${S}，请查收您的学习报告。
                        <span class="insta-tags">#期末考试 #${i.school} #学习报告</span>
                    </div>

                    <!-- 2. 🟢 新增：模块④ 学情结构一句话诊断 -->
                    ${typeof et!="undefined"?et:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof H!="undefined"?H:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${J}
                    ${it}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${tt}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof I!="undefined"?I:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${x}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}Object.assign(window,{getTrendBadge:y,renderSingleReportCardHTML:ut,renderInstagramCard:xt}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
