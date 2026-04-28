(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;const G=window.CompareSessionState||null,st=window.ReportSessionState||null,zt=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>G&&typeof G.getCloudStudentCompareContext=="function"&&G.getCloudStudentCompareContext()||null),Ut=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>st&&typeof st.getCurrentReportStudent=="function"?st.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),Dt=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>G&&typeof G.getDuplicateCompareExams=="function"?G.getDuplicateCompareExams()||[]:[]);function ut(s){return typeof getCloudCompareHint=="function"?getCloudCompareHint(s):isCloudContextMatchStudent(s)||isCloudContextLikelyCurrentTarget(s)?zt():null}function y(s,g,M="score"){if(g==null||g==="-"||g==="")return"";const d=parseFloat(s),R=parseFloat(g);if(isNaN(d)||isNaN(R))return"";const w=d-R;if(Math.abs(w)<.01)return'<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>';let v="",T="",u="";M==="score"?w>0?(v="#15803d",u="#dcfce7",T="▲"):(v="#b91c1c",u="#fee2e2",T="▼"):w<0?(v="#15803d",u="#dcfce7",T="▲"):(v="#b91c1c",u="#fee2e2",T="▼");const E=Math.abs(w);return`<span style="display:inline-flex; align-items:center; background:${u}; color:${v}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${T} ${M==="score"?E.toFixed(1):E}
        </span>`}function xt(s,g){var yt,vt,wt,St,Ct,$t,Rt,Tt;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),xt(s,"PC");const w=window.innerWidth<=768,v=g==="FULL";if(!(g==="A4"||g==="PC"||v)&&w||g==="IG"){const t=mt(s);return setTimeout(()=>{typeof renderIGCharts=="function"&&renderIGCharts(s)},50),t}const u=RAW_DATA.length,E=new Date().toLocaleDateString(),l=getComparisonStudentView(s,RAW_DATA),z=ut(l),p=(z==null?void 0:z.previousRecord)||findPreviousRecord(l),J=typeof getStudentExamHistory=="function"?getStudentExamHistory(l):[],D=getEffectiveCurrentExamId(),P=J.filter(t=>{const e=t.examFullKey||t.examId;return!D||!isExamKeyEquivalentForCompare(e,D)&&!isExamKeyEquivalentForCompare(t.examId,D)}).slice(-1)[0]||null,Y=P?P.student||P:null,c=Y&&Y.scores?Y:p,H=((yt=c==null?void 0:c.ranks)==null?void 0:yt.total)||{},lt=t=>typeof t=="number"&&Number.isFinite(t)?t:t&&typeof t=="object"&&typeof t.score=="number"&&Number.isFinite(t.score)?t.score:"-",bt=t=>String(t!=null?t:"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),o=(t,e,a="")=>`<td data-label="${bt(t)}"${a?` style="${a}"`:""}>${e}</td>`,dt=t=>{var e,a,n,i,b,h,$,x;return{class:(a=(e=t==null?void 0:t.class)!=null?e:t==null?void 0:t.rankClass)!=null?a:"-",school:(i=(n=t==null?void 0:t.school)!=null?n:t==null?void 0:t.rankSchool)!=null?i:"-",township:(h=(b=t==null?void 0:t.township)!=null?b:t==null?void 0:t.rankTown)!=null?h:"-",county:(x=($=t==null?void 0:t.county)!=null?$:t==null?void 0:t.rankCounty)!=null?x:"-"}},V=(t,e=null)=>{const a=String((t==null?void 0:t.examFullKey)||(t==null?void 0:t.examId)||(e==null?void 0:e._sourceExam)||(e==null?void 0:e.examFullKey)||(e==null?void 0:e.examId)||"").trim();if(!a)return null;try{const n=localStorage.getItem("COUNTY_ANALYSIS_SCOPE_V1"),i=n?JSON.parse(n):{};return(i==null?void 0:i[a])||null}catch(n){return null}},Z=(t,e="total",a=null)=>{var b,h,$,x,_,gt,rt,at,it;if(!t||typeof t!="object")return!1;const n=V(a,t);if(!n||n.includesCounty!==!0)return!1;const i=e==="total"?(x=($=(h=(b=t==null?void 0:t.ranks)==null?void 0:b.total)==null?void 0:h.county)!=null?$:t==null?void 0:t.rankCounty)!=null?x:t==null?void 0:t.countyRank:(it=(gt=(_=t==null?void 0:t.ranks)==null?void 0:_[e])==null?void 0:gt.county)!=null?it:(at=(rt=t==null?void 0:t.subjectRanks)==null?void 0:rt[e])==null?void 0:at.county;return i!=null&&i!==""},X=t=>{var n;const e=String((n=t==null?void 0:t.class)!=null?n:"").trim(),a=typeof normalizeClass=="function"?normalizeClass(e):e;return!a||a==="-"?!1:!/^(?:无|未分班|无班级|暂无|undefined|null|nan)$/i.test(a)},L=t=>{if(typeof isCountyDirectStudentForRank=="function")return isCountyDirectStudentForRank(t);const e=String((t==null?void 0:t.school)||"").trim();if(!e||typeof getCountyDirectSchoolNames!="function"||typeof getTownshipManagedSchoolNames!="function")return!1;const a=Array.from(new Set([...Object.keys(SCHOOLS||{}),...(RAW_DATA||[]).map(i=>i==null?void 0:i.school)].map(i=>String(i||"").trim()).filter(Boolean)));return getTownshipManagedSchoolNames(a).length?getCountyDirectSchoolNames(a).some(i=>i===e||typeof areSchoolNamesEquivalent=="function"&&areSchoolNamesEquivalent(i,e)||typeof areSchoolNamesMatched=="function"&&areSchoolNamesMatched(i,e,!0)):!1},K=(t,e=!0)=>e?t==null||t===""?"-":t:"-",j=l&&typeof l=="object"&&l.scores&&typeof l.scores=="object"?l.scores:{},tt=[...new Set(SUBJECTS)],U=typeof hasStudentTownshipRankData=="function"?hasStudentTownshipRankData(RAW_DATA,tt):Object.keys(SCHOOLS).length>1,et=typeof hasStudentCountyRankData=="function"?hasStudentCountyRankData(RAW_DATA,tt):getStudentCountyRankValue(l,"total")!=="-",W=X(l),r=U&&!L(l),f=et,S=K(safeGet(l,"ranks.total.township","-"),r),C=K((wt=(vt=H.township)!=null?vt:p==null?void 0:p.townRank)!=null?wt:"-",r),Q=K(safeGet(l,"ranks.total.class","-"),W),N=K((Ct=(St=H.class)!=null?St:p==null?void 0:p.classRank)!=null?Ct:"-",W),ot=safeGet(l,"ranks.total.school","-"),pt=(Rt=($t=H.school)!=null?$t:p==null?void 0:p.schoolRank)!=null?Rt:"-",k=getStudentCountyRankValue(l,"total"),F=Z(c,"total",P)&&(Tt=H.county)!=null?Tt:"-",ct=Object.keys(SCHOOLS).length<=1,q=U?"":"display:none !important;",B=f?"":"display:none !important;";let A="";if(CONFIG.name==="9年级"){let t=0,e=0;["语文","数学","英语","物理","化学"].forEach(a=>{j[a]!==void 0&&(t+=j[a],e++)}),e>0&&(A+=`<tr style="background:rgba(248,250,252,0.5);">
                    ${o("科目","🏁 核心五科","font-weight:bold; color:#475569;")}
                    ${o("成绩（对比）",t.toFixed(1),"font-weight:bold; color:#2563eb;")}
                    ${o("班级排名","-")}
                    ${o("校级排名","-")}
                    ${o("全镇排名","-",q)}
                    ${o("全县排名","-",B)}
                </tr>`)}const O=getComparisonTotalSubjects(),m=getComparisonTotalValue(l,O),I=CONFIG.name==="9年级"&&O.length?"五科总分":CONFIG.label,jt=c?recalcPrevTotal(c):"-",At=y(m,jt,"score"),Et=W?y(Q,N,"rank"):"",Ht=y(ot,pt,"rank"),Nt=r?y(S,C,"rank"):"",kt=f?y(k,F,"rank"):"";A+=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            ${o("科目",`🏆 ${I}`,"font-weight:bold; color:#1e3a8a;")}
            ${o("成绩（对比）",`${Number.isFinite(m)?m.toFixed(2):"-"} ${At}`,"font-weight:800; font-size:16px; color:#1e40af;")}
            ${o("班级排名",`${Q} ${Et}`,"font-weight:bold; color:#334155;")}
            ${o("校级排名",`${ot} ${Ht}`,"font-weight:bold; color:#334155;")}
            ${o("全镇排名",`${S} ${Nt}`,`${q} font-weight:bold; color:#334155;`)}
            ${o("全县排名",`${f?k:"-"} ${kt}`,`${B} font-weight:bold; color:#334155;`)}
        </tr>`,[...new Set(SUBJECTS)].forEach(t=>{if(j[t]!==void 0){const e=c&&c.scores?lt(c.scores[t]):"-",a=y(j[t],e,"score");let n=dt(c&&c.ranks?c.ranks[t]:null);n.class==="-"&&n.school==="-"&&n.township==="-"&&p&&p.ranks&&p.ranks[t]&&(n=dt(p.ranks[t]));const i=safeGet(l,`ranks.${t}.school`,"-"),b=y(i,n.school||"-","rank"),h=K(safeGet(l,`ranks.${t}.township`,"-"),r),$=r?y(h,n.township||"-","rank"):"",x=getStudentCountyRankValue(l,t),_=f&&Z(c,t,P)?y(x,n.county||"-","rank"):"";A+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    ${o("科目",t,"font-weight:600; color:#475569;")}
                    ${o("成绩（对比）",`${j[t]} ${a}`,"font-weight:bold; color:#334155;")}
                    ${o("班级排名","-","color:#cbd5e1;")}
                    ${o("校级排名",`${i} <span style="font-size:0.9em;">${b}</span>`,"color:#64748b;")}
                    ${o("全镇排名",`${h} <span style="font-size:0.9em;">${$}</span>`,`color:#64748b; ${q}`)}
                    ${o("全县排名",`${f?x:"-"} <span style="font-size:0.9em;">${_}</span>`,`color:#64748b; ${B}`)}
                </tr>`}});const Ft=`
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
                #single-report-result { width:100%; max-width:none; }
                #report-card-capture-area.student-report-canvas-full {
                    width:100%;
                    max-width:none !important;
                    margin:0 !important;
                    padding:0 !important;
                    display:block;
                }
                .student-report-shell {
                    width:100%;
                    max-width:1160px;
                    margin:0 auto;
                    color:#0f172a;
                }
                .student-report-shell-full {
                    max-width:none;
                    min-height:calc(100vh - 220px);
                    padding:26px clamp(18px, 2.4vw, 42px) 32px;
                    border:1px solid rgba(148, 163, 184, 0.18);
                    border-radius:26px;
                    background:
                        linear-gradient(135deg, rgba(239, 246, 255, 0.92) 0%, rgba(255, 255, 255, 0.96) 38%, rgba(240, 253, 244, 0.82) 100%);
                    box-shadow:0 22px 60px rgba(15, 23, 42, 0.08);
                }
                .student-report-shell-full .report-header {
                    display:grid;
                    grid-template-columns:1fr auto;
                    align-items:end;
                    gap:14px;
                    text-align:left !important;
                    margin-bottom:18px !important;
                }
                .student-report-shell-full .report-header h3 {
                    font-size:clamp(24px, 2.2vw, 36px);
                    line-height:1.18;
                }
                .student-report-shell-full .report-header p {
                    margin:0 !important;
                    justify-self:end;
                    white-space:nowrap;
                }
                .student-report-shell-full .report-student-strip {
                    padding:20px 24px !important;
                    margin-bottom:18px;
                }
                .student-report-shell-full .report-insight-grid {
                    grid-template-columns:repeat(4, minmax(160px, 1fr));
                }
                .student-report-shell-full .report-action-grid {
                    grid-template-columns:repeat(3, minmax(0, 1fr));
                }
                .student-report-shell-full .report-subject-board {
                    grid-template-columns:repeat(3, minmax(0, 1fr));
                }
                .student-report-shell-full .fluent-card {
                    border-color:rgba(203, 213, 225, 0.72);
                    background:rgba(255, 255, 255, 0.86);
                }
                .student-report-shell-full .student-report-main-grid {
                    display:grid;
                    grid-template-columns:minmax(0, 1fr);
                    gap:18px;
                    align-items:start;
                }
                .student-report-shell-full .student-report-main-grid > .fluent-card {
                    height:100%;
                }
                .student-report-shell-full .student-report-hero-card {
                    grid-column:1 / -1;
                }
                .student-report-shell-full .student-report-table-card {
                    grid-column:1 / -1;
                }
                .student-report-shell-full .student-report-chart-grid {
                    display:grid !important;
                    grid-template-columns:repeat(2, minmax(0, 1fr));
                    gap:18px !important;
                }
                .student-report-shell-full .student-report-chart-grid .fluent-card {
                    min-width:0 !important;
                    margin-bottom:0 !important;
                }
                @media (max-width: 1180px) {
                    .student-report-shell-full .student-report-main-grid,
                    .student-report-shell-full .student-report-chart-grid {
                        grid-template-columns:minmax(0, 1fr);
                    }
                    .student-report-shell-full .report-subject-board {
                        grid-template-columns:repeat(2, minmax(0, 1fr));
                    }
                }
                @media (max-width: 768px) {
                    #report-card-capture-area.student-report-canvas-full { padding:0 !important; }
                    .student-report-shell-full {
                        min-height:auto;
                        padding:16px 12px 22px;
                        border-radius:18px;
                    }
                    .student-report-shell-full .report-header {
                        grid-template-columns:minmax(0, 1fr);
                        text-align:left !important;
                    }
                    .student-report-shell-full .report-header p { justify-self:start; }
                    .student-report-shell-full .report-insight-grid,
                    .student-report-shell-full .report-action-grid,
                    .student-report-shell-full .report-subject-board {
                        grid-template-columns:minmax(0, 1fr);
                    }
                    .report-insight-card, .report-action-card, .report-subject-item { padding:14px 16px; }
                }
                @media print { .fluent-card { box-shadow: none; border: 1px solid #ccc; backdrop-filter: none; } }
            </style>
        `,Ot=buildChartNarrative(l),nt=buildStudentInsightModel(l,J),It=renderStudentInsightOverview(nt),_t=renderStudentActionPlan(nt),Gt=renderStudentSubjectBoard(nt),Mt=renderStudentRealityNote(nt),Pt=z?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${z.prevExamId||"上次"} → ${z.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${z.title||"云端记录"}</span>
            </div>
        </div>`:"",Vt=Dt().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",Kt=`
        ${Ft}
        <div class="${v?"student-report-shell student-report-shell-full":"student-report-shell"}">
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${s.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${E}</p>
        </div>
        ${Pt}
        ${Vt}
        <div class="fluent-card report-student-strip" style="padding:15px 25px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:baseline; gap:15px;">
                    <span style="font-size:24px; font-weight:800; color:#1e3a8a;">${s.name}</span>
                    <span style="font-size:14px; color:#475569; background:#fff; padding:2px 8px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${s.class}</span>
                </div>
                <div style="font-size:13px; color:#64748b; font-family:monospace;">考号: ${s.id}</div>
            </div>
        </div>
        <div class="student-report-main-grid">
        <div class="fluent-card student-report-hero-card" style="padding:18px 20px;">
            <div class="fluent-header"><i class="ti ti-badge-4k" style="color:#2563eb;"></i><span class="fluent-title">成绩快照与真实定位</span></div>
            ${It}
            ${_t}
            ${Gt}
            ${Mt}
        </div>
        <div class="fluent-card student-report-table-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩 (对比)</th><th>总分班排</th><th>校排</th><th style="${q}">全镇排名</th><th style="${B}">全县排名</th></tr></thead>
                <tbody>${A}</tbody>
            </table>
        </div>
        </div>`,ft=J;let ht="";if(ft.length>1){let t="",e=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${I}</th><th>校排</th>`;U&&(e+="<th>镇排</th>");for(let a=ft.length-1;a>=0;a--){const n=ft[a],i=n.examFullKey||n.examId,b=getEffectiveCurrentExamId(),h=!!b&&(isExamKeyEquivalentForCompare(i,b)||isExamKeyEquivalentForCompare(n.examId,b)),$=h?"background:rgba(239,246,255,0.7); font-weight:bold;":"",x=n.student||n,_=getComparisonTotalValue(x,O),rt=Number.isFinite(_)?_.toFixed(1):"-",at=safeGet(x,"ranks.total.school",n.rankSchool||"-"),it=safeGet(x,"ranks.total.township",n.rankTown||"-");t+=`<tr style="${$}">
                ${o("考试名称",`${h?"⭐ ":""}${n.examLabel||n.examId||n.examFullKey||"-"}`,"text-align:left; padding-left:20px; color:#475569;")}
                ${o(I,rt,"color:#2563eb;")}
                ${o("校级排名",at,"color:#64748b;")}
                ${U?o("全镇排名",it,"color:#64748b;"):""}
            </tr>`}ht=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${e}</tr></thead>
                <tbody>${t}</tbody>
            </table>
        </div>`}return`
        ${Kt}
        ${ht}
        <div class="student-report-chart-grid" style="display:flex; gap:15px; margin-bottom:15px; flex-wrap:wrap; margin-top:20px;">
            <div class="fluent-card" style="flex:1; min-width:300px; margin-bottom:0; display:flex; flex-direction:column;">
                <div class="fluent-header"><i class="ti ti-radar" style="color:#2563eb;"></i><span class="fluent-title">${CONFIG.name==="9年级"?"五科综合素质评价":"综合素质评价"} (百分位)</span></div>
                <div style="flex:1; position:relative; min-height:220px;"><canvas id="radarChart"></canvas></div>
            </div>            
            <div class="fluent-card" style="flex:1; min-width:300px; margin-bottom:0; display:flex; flex-direction:column;">
                <div class="fluent-header"><i class="ti ti-scale" style="color:#059669;"></i><span class="fluent-title">${CONFIG.name==="9年级"?"五科学科均衡度诊断":"学科均衡度诊断"}</span></div>
                <div style="flex:1; position:relative; min-height:220px;"><canvas id="varianceChart"></canvas></div>
            </div> 
        </div>
        ${Ot}
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>
        </div>`}function mt(s){var et,W;const g=new Date().toLocaleDateString(),M=RAW_DATA.length,d=getComparisonStudentView(s,RAW_DATA),R=getComparisonTotalSubjects(),w=getComparisonTotalValue(d,R),v=typeof hasStudentTownshipRankData=="function"?hasStudentTownshipRankData(RAW_DATA,R):Object.keys(SCHOOLS).length>1,T=typeof hasStudentCountyRankData=="function"?hasStudentCountyRankData(RAW_DATA,R):getStudentCountyRankValue(d,"total")!=="-",u=v&&!isCountyDirectStudent(d),E=u?safeGet(d,"ranks.total.township","-"):safeGet(d,"ranks.total.school","-"),l=(d==null?void 0:d.school)&&((W=(et=SCHOOLS==null?void 0:SCHOOLS[d.school])==null?void 0:et.students)==null?void 0:W.length)||M||1,p=typeof E=="number"?((1-E/(u?M||1:l))*100).toFixed(0):"-",J=s.name.charAt(0),D=ut(d),Y=Object.keys(SCHOOLS).length<=1?"全校":u?"全镇":"本校";let c="";p>=90?c="🌟 卓越之星":p>=75?c="🔥 进步飞速":c="📚 持续努力";let H="";R.forEach(r=>{if(d.scores[r]!==void 0){const f=d.scores[r],S=safeGet(d,`ranks.${r}.school`,"-"),C=u?safeGet(d,`ranks.${r}.township`,"-"):"-",Q=getStudentCountyRankValue(d,r),N=[`级#${S}`];u&&N.push(`镇#${C}`),T&&N.push(`县#${Q}`),H+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${r}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${f}</span>
                            <span class="insta-comm-rank">${N.join(" | ")}</span>
                        </div>
                    </div>
                `}});const lt=`
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
        `,o=(()=>{let r=[],f=[],S=[],C=[];getComparisonTotalSubjects().forEach(k=>{if(s.scores[k]!==void 0){const F=RAW_DATA.map(m=>m.scores[k]).filter(m=>typeof m=="number");if(F.length<2)return;const ct=F.reduce((m,I)=>m+I,0)/F.length,q=F.reduce((m,I)=>m+Math.pow(I-ct,2),0)/F.length,B=Math.sqrt(q)||1,A=(s.scores[k]-ct)/B;C.push(A);const O=`${k}`;A>=.8?r.push(O):A<=-.8?f.push(O):S.push(O)}});const N=C.length?Math.max(...C):0,ot=C.length?Math.min(...C):0,pt=N-ot;return{strong:r,weak:f,mid:S,range:pt}})(),V=(r=>r>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:r>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(o.range),Z=`
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${V.bg}; color:${V.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${V.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${V.text}
                </div>
            </div>
        `,X=(r,f)=>!r||r.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${f}</div>`:r.map(S=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${S}</span>`).join(""),L=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科
                        <span style="margin-left:auto; font-size:10px; color:#999;">${o.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${X(o.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${o.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${o.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${X(o.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,j=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const r=[];if(o.weak.length>0){const f=o.weak.join("、");r.push(`🎯 <strong>精准攻坚：</strong>针对 ${f}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(o.strong.length>0){const f=o.strong.join("、");r.push(`🛡️ <strong>保持自信：</strong>${f} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return o.strong.length===0&&o.weak.length===0&&r.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),r.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),r.map(f=>`<li style="margin-bottom:8px; line-height:1.5;">${f}</li>`).join("")})()}
                </ul>
            </div>
        `,tt=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(w)?w.toFixed(1):"-"}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(d,"ranks.total.school","-")}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${Y} ${p}% 的考生</div>
                </div>
            </div>
        `,U=D?`
            <div style="margin:12px 14px 0 14px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:10px 12px;">
                <div style="font-size:12px; color:#3730a3; line-height:1.5;">
                    <strong>状态：☁️ 云端对比已启用</strong><br>
                    当前对比：${D.prevExamId||"上次"} → ${D.latestExamId||"本次"}
                </div>
                <div style="font-size:11px; color:#6366f1; margin-top:4px;">来源：${D.title||"云端记录"}</div>
            </div>
        `:"";return`
            <div class="insta-view-container" style="background:#fafafa; padding-top:20px;">
                <div class="insta-card">
                    <!-- Header -->
                    <div class="insta-header">
                        <div class="insta-avatar-ring"><div class="insta-avatar">${J}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${s.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${s.school} · ${s.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${tt}
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
                        本次考试成绩已出炉！${c}，请查收您的学习报告。
                        <span class="insta-tags">#期末考试 #${s.school} #学习报告</span>
                    </div>

                    <!-- 2. 🟢 新增：模块④ 学情结构一句话诊断 -->
                    ${typeof Z!="undefined"?Z:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof L!="undefined"?L:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${U}
                    ${lt}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${H}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof j!="undefined"?j:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${g}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}Object.assign(window,{getTrendBadge:y,renderSingleReportCardHTML:xt,renderInstagramCard:mt}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
