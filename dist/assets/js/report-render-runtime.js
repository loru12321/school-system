(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;function wt(){try{return localStorage.getItem("PARENT_REPORT_SHOW_RANK")==="1"}catch(e){return!1}}window.shouldShowParentReportRank=wt;const G=window.CompareSessionState||null,pt=window.ReportSessionState||null,Pt=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>G&&typeof G.getCloudStudentCompareContext=="function"&&G.getCloudStudentCompareContext()||null),fe=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>pt&&typeof pt.getCurrentReportStudent=="function"?pt.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),Wt=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>G&&typeof G.getDuplicateCompareExams=="function"?G.getDuplicateCompareExams()||[]:[]),o={signature:"",html:new Map,comparisonStudent:new WeakMap,comparisonStudentByKey:new Map,cloudHint:new WeakMap,cloudHintByKey:new Map,previousRecord:new WeakMap,previousRecordByKey:new Map,examHistory:new WeakMap,examHistoryByKey:new Map,im:new Map,scopeMapRaw:"",scopeMap:{},schoolCandidatesSignature:"",schoolCandidates:[],townshipRank:new Map,countyRank:new Map,countyDirect:new WeakMap};function _(){const e=[window.CURRENT_EXAM_ID||"",window.__REPORT_HISTORY_VERSION||0,window.__RAW_DATA_VERSION||0,Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:0,Array.isArray(window.SUBJECTS)?window.SUBJECTS.join("|"):"",Object.keys(window.SCHOOLS||{}).join("|")].join("::");return o.signature!==e&&(o.signature=e,o.html.clear(),o.comparisonStudent=new WeakMap,o.comparisonStudentByKey.clear(),o.cloudHint=new WeakMap,o.cloudHintByKey.clear(),o.previousRecord=new WeakMap,o.previousRecordByKey.clear(),o.examHistory=new WeakMap,o.examHistoryByKey.clear(),o.townshipRank.clear(),o.countyRank.clear(),o.countyDirect=new WeakMap),e}function V(e){return[String((e==null?void 0:e.school)||"").trim(),String((e==null?void 0:e.class)||"").trim(),String((e==null?void 0:e.name)||"").trim(),String((e==null?void 0:e.id)||(e==null?void 0:e.examNo)||"").trim()].join("::")}function Gt(e,r){if(!Array.isArray(e)||!e.length)return null;for(let s=e.length-1;s>=0;s--){const a=e[s],g=(a==null?void 0:a.examFullKey)||(a==null?void 0:a.examId);if(!r||!isExamKeyEquivalentForCompare(g,r)&&!isExamKeyEquivalentForCompare(a==null?void 0:a.examId,r))return a||null}return null}function ft(e){if(!e||typeof e!="object")return e;if(_(),o.comparisonStudent.has(e))return o.comparisonStudent.get(e);const r=V(e);if(o.comparisonStudentByKey.has(r)){const a=o.comparisonStudentByKey.get(r);return o.comparisonStudent.set(e,a),a}const s=typeof getComparisonStudentView=="function"?getComparisonStudentView(e,RAW_DATA):e;return o.comparisonStudent.set(e,s),o.comparisonStudentByKey.set(r,s),s}function vt(e){if(!e||typeof e!="object")return null;if(_(),o.cloudHint.has(e))return o.cloudHint.get(e);const r=V(e);if(o.cloudHintByKey.has(r)){const a=o.cloudHintByKey.get(r);return o.cloudHint.set(e,a),a}const s=Lt(e);return o.cloudHint.set(e,s||null),o.cloudHintByKey.set(r,s||null),s||null}function Vt(e){if(!e||typeof e!="object")return null;if(_(),o.previousRecord.has(e))return o.previousRecord.get(e);const r=V(e);if(o.previousRecordByKey.has(r)){const a=o.previousRecordByKey.get(r);return o.previousRecord.set(e,a),a}const s=typeof findPreviousRecord=="function"?findPreviousRecord(e):null;return o.previousRecord.set(e,s||null),o.previousRecordByKey.set(r,s||null),s||null}function St(e){if(!e||typeof e!="object")return[];if(_(),o.examHistory.has(e))return o.examHistory.get(e);const r=V(e);if(o.examHistoryByKey.has(r)){const g=o.examHistoryByKey.get(r);return o.examHistory.set(e,g),g}const s=typeof getStudentExamHistory=="function"?getStudentExamHistory(e):[],a=Array.isArray(s)?s:[];return o.examHistory.set(e,a),o.examHistoryByKey.set(r,a),a}function Ut(e,r=null){const s=Array.isArray(r)?r:[],a=s[s.length-1]||{},g=`${_()}::${V(e)}::${s.length}:${a.examFullKey||a.examId||""}`;if(o.im.has(g))return o.im.get(g);const U=window.ReportInsightRuntime.buildStudentInsightModel(e,r,{getCachedComparisonStudentView:ft,getCachedStudentExamHistory:St});return o.im.set(g,U),U}function qt(e){return window.ReportInsightRuntime.renderStudentInsightOverview(e)}function Jt(e){return window.ReportInsightRuntime.renderStudentActionPlan(e)}function Yt(e){return window.ReportInsightRuntime.renderStudentSubjectBoard(e)}function Zt(e){return window.ReportInsightRuntime.renderStudentRealityNote(e)}function at(e,r){const s=`${_()}::${e}::${(r||[]).join("|")}`,a=e==="township"?o.townshipRank:o.countyRank;if(a.has(s))return a.get(s);const g=e==="township"?typeof hasStudentTownshipRankData=="function"?hasStudentTownshipRankData(RAW_DATA,r):Object.keys(SCHOOLS).length>1:typeof hasStudentCountyRankData=="function"?hasStudentCountyRankData(RAW_DATA,r):null;return a.set(s,g),g}function Xt(){let e="";try{e=localStorage.getItem("COUNTY_ANALYSIS_SCOPE_V1")||""}catch(r){e=""}if(o.scopeMapRaw!==e){o.scopeMapRaw=e;try{o.scopeMap=e?JSON.parse(e):{}}catch(r){o.scopeMap={}}}return o.scopeMap}function Qt(){const e=_();return o.schoolCandidatesSignature===e||(o.schoolCandidatesSignature=e,o.schoolCandidates=Array.from(new Set([...Object.keys(SCHOOLS||{}),...(RAW_DATA||[]).map(r=>r==null?void 0:r.school)].map(r=>String(r||"").trim()).filter(Boolean)))),o.schoolCandidates}function Lt(e){var r,s;return typeof getCloudCompareHint=="function"?getCloudCompareHint(e):(r=window.isCloudContextMatchStudent)!=null&&r.call(window,e)||(s=window.isCloudContextLikelyCurrentTarget)!=null&&s.call(window,e)?Pt():null}function Rt(e,r,s="score"){return window.ReportInsightRuntime.getTrendBadge(e,r,s)}function Ct(e,r,s={}){var Nt,_t,It,Mt,Kt,Ot,Ft,Bt;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),Ct(e,"PC",s);const gt=window.innerWidth<=768,tt=r==="FULL",it=r==="A4"||r==="PC"||tt,D=it,q=D?`${_()}::${V(e)}::${r||""}::${new Date().toLocaleDateString()}`:"";if(D&&o.html.has(q))return o.html.get(q);if(!it&&gt||r==="IG"){const t=$t(e);return setTimeout(()=>{typeof renderIGCharts=="function"&&renderIGCharts(e)},50),t}const Tt=RAW_DATA.length,Ht=new Date().toLocaleDateString(),d=ft(e),j=vt(d),I=Array.isArray(s.reportExamHistory)?s.reportExamHistory:St(d),At=getEffectiveCurrentExamId(),k=Gt(I,At),C=k?k.student||k:null,st=!!(C&&C.scores&&C.ranks),u=(j==null?void 0:j.previousRecord)||(st?null:Vt(d)),m=C&&C.scores?C:u,b=t=>typeof t=="number"&&Number.isFinite(t)?t:t&&typeof t=="object"&&typeof t.score=="number"&&Number.isFinite(t.score)?t.score:"-",kt=t=>String(t!=null?t:"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),p=(t,n,l="")=>`<td data-label="${kt(t)}"${l?` style="${l}"`:""}>${n}</td>`,J=t=>{var n,l,i,y,f,w,R,x;return{class:(l=(n=t==null?void 0:t.class)!=null?n:t==null?void 0:t.rankClass)!=null?l:"-",school:(y=(i=t==null?void 0:t.school)!=null?i:t==null?void 0:t.rankSchool)!=null?y:"-",township:(w=(f=t==null?void 0:t.township)!=null?f:t==null?void 0:t.rankTown)!=null?w:"-",county:(x=(R=t==null?void 0:t.county)!=null?R:t==null?void 0:t.rankCounty)!=null?x:"-"}},Y=((Nt=m==null?void 0:m.ranks)==null?void 0:Nt.total)||{},Z=(t,n,l="total",i="county")=>{var w,R,x,z,F,E,N,W;const y=l==="total"?((w=n==null?void 0:n.ranks)==null?void 0:w.total)||n||t||{}:((R=n==null?void 0:n.ranks)==null?void 0:R[l])||((x=n==null?void 0:n.subjectRanks)==null?void 0:x[l])||((z=t==null?void 0:t.subjectRanks)==null?void 0:z[l])||{},f=J(y)[i];return f!=null&&f!==""?f:i==="county"&&l==="total"&&(W=(N=(E=(F=n==null?void 0:n.rankCounty)!=null?F:n==null?void 0:n.countyRank)!=null?E:t==null?void 0:t.rankCounty)!=null?N:t==null?void 0:t.countyRank)!=null?W:"-"},zt=(t,n=null)=>{const l=String((t==null?void 0:t.examFullKey)||(t==null?void 0:t.examId)||(n==null?void 0:n._sourceExam)||(n==null?void 0:n.examFullKey)||(n==null?void 0:n.examId)||"").trim();if(!l)return null;const i=Xt();return(i==null?void 0:i[l])||null},et=(t,n="total",l=null)=>{var f,w,R,x,z,F,E,N,W;if(!t||typeof t!="object")return!1;const i=n==="total"?(x=(R=(w=(f=t==null?void 0:t.ranks)==null?void 0:f.total)==null?void 0:w.county)!=null?R:t==null?void 0:t.rankCounty)!=null?x:t==null?void 0:t.countyRank:(W=(F=(z=t==null?void 0:t.ranks)==null?void 0:z[n])==null?void 0:F.county)!=null?W:(N=(E=t==null?void 0:t.subjectRanks)==null?void 0:E[n])==null?void 0:N.county;if(i!=null&&i!==""&&i!=="-")return!0;const y=zt(l,t);return!y||y.includesCounty!==!0?!1:i!=null&&i!==""},lt=t=>{var i;const n=String((i=t==null?void 0:t.class)!=null?i:"").trim(),l=typeof normalizeClass=="function"?normalizeClass(n):n;return!l||l==="-"?!1:!/^(?:无|未分班|无班级|暂无|undefined|null|nan)$/i.test(l)},M=t=>{if(typeof isCountyDirectStudentForRank=="function")return isCountyDirectStudentForRank(t);const n=String((t==null?void 0:t.school)||"").trim();if(!n||typeof getCountyDirectSchoolNames!="function"||typeof getTownshipManagedSchoolNames!="function")return!1;if(o.countyDirect.has(t))return o.countyDirect.get(t);const l=Qt();if(!getTownshipManagedSchoolNames(l).length)return o.countyDirect.set(t,!1),!1;const y=getCountyDirectSchoolNames(l).some(f=>f===n||typeof areSchoolNamesEquivalent=="function"&&areSchoolNamesEquivalent(f,n)||typeof areSchoolNamesMatched=="function"&&areSchoolNamesMatched(f,n,!0));return o.countyDirect.set(t,y),y},$=(t,n=!0)=>n?t==null||t===""?"-":t:"-",v=window.ReportInsightRuntime.renderMetricComparison,ot=d&&typeof d=="object"&&d.scores&&typeof d.scores=="object"?d.scores:{},nt=[...new Set(SUBJECTS)],X=((_t=window.RankingDataService)==null?void 0:_t.buildStudentRankSnapshot(RAW_DATA,d,nt))||null,T=(t,n)=>{var i;const l=safeGet(d,`ranks.${t}.${n}`,"-");return l!=null&&l!==""&&l!=="-"&&l!=="—"?l:(i=X==null?void 0:X.getRank(d,t,n,"-"))!=null?i:"-"},c=at("township",nt),h=at("county",nt),K=h===null?getStudentCountyRankValue(d,"total")!=="-":h,H=lt(d),Q=c&&!M(d),S=K,ut=$(T("total","township"),Q),mt=$((Mt=(It=Y.township)!=null?It:u==null?void 0:u.townRank)!=null?Mt:"-",Q),L=$(T("total","class"),H),B=$((Ot=(Kt=Y.class)!=null?Kt:u==null?void 0:u.classRank)!=null?Ot:"-",H),ct=T("total","school"),ht=(Bt=(Ft=Y.school)!=null?Ft:u==null?void 0:u.schoolRank)!=null?Bt:"-",xt=$(T("total","county"),S),rt=et(m,"total",k)?Z(k,m,"total","county"):"-",P=c?"":"display:none !important;",A=S?"":"display:none !important;",O=getComparisonTotalSubjects(),te=getComparisonTotalValue(d,O),bt=typeof window.getTotalSubjectLabel=="function"?window.getTotalSubjectLabel({subjects:O,withScoreUnit:!0}):CONFIG.name==="9年级"&&O.length?"五科总分":CONFIG.label,ee=m?recalcPrevTotal(m):"-";let Dt=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            ${p("科目",`🏆 ${bt}`,"font-weight:bold; color:#1e3a8a;")}
            ${p("成绩对比",v(te,ee,"score",2),"font-weight:800; color:#1e40af;")}
            ${p("班排对比",v(L,B,"rank"),"font-weight:bold; color:#334155;")}
            ${p("校排对比",v(ct,ht,"rank"),"font-weight:bold; color:#334155;")}
            ${p("镇排对比",v(ut,mt,"rank"),`${P} font-weight:bold; color:#334155;`)}
            ${p("县排对比",v(xt,rt,"rank"),`${A} font-weight:bold; color:#334155;`)}
        </tr>`;[...new Set(SUBJECTS)].forEach(t=>{if(ot[t]!==void 0){const n=m&&m.scores?b(m.scores[t]):"-",l=Rt(ot[t],n,"score");let i=J(m&&m.ranks?m.ranks[t]:null);i.class==="-"&&i.school==="-"&&i.township==="-"&&u&&u.ranks&&u.ranks[t]&&(i=J(u.ranks[t]));const y=$(T(t,"class"),H),f=T(t,"school"),w=$(T(t,"township"),Q),R=$(T(t,"county"),S),x=Z(k,m,t,"county"),z=i.class||"-",F=i.school||"-",E=i.township||"-",N=S&&et(m,t,k)?x:"-";Dt+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    ${p("科目",t,"font-weight:600; color:#475569;")}
                    ${p("成绩对比",v(ot[t],n,"score"),"font-weight:bold;color:#334155;")}
                    ${p("班排对比",v(y,z,"rank"),"color:#64748b;")}
                    ${p("校排对比",v(f,F,"rank"),"color:#64748b;")}
                    ${p("镇排对比",v(w,E,"rank"),`color:#64748b; ${P}`)}
                    ${p("县排对比",v(R,N,"rank"),`color:#64748b; ${A}`)}
                </tr>`}});const oe=`
            <style>
                .fluent-card { background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px) saturate(180%); border: 1px solid rgba(255, 255, 255, 0.6); box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
                .fluent-header { display: flex; align-items: center; gap: 8px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid rgba(0,0,0,0.05); }
                .fluent-title { font-size: 15px; font-weight: 700; color: #1e293b; }
                .fluent-subtitle { font-size: 11px; color: #94a3b8; margin-left: auto; }
                .fluent-table { width: 100%; border-collapse: separate; border-spacing: 0; }
                .fluent-table th { text-align: center; padding: 10px 5px; color: #64748b; font-size: 12px; font-weight: 600; border-bottom: 1px solid #e2e8f0; background: rgba(248, 250, 252, 0.5); }
                .fluent-table td { text-align: center; padding: 12px 5px; border-bottom: 1px solid rgba(0,0,0,0.03); font-size: 14px; }
                .fluent-table tr:last-child td { border-bottom: none; }
                .report-metric-compare { display:grid; gap:3px; min-width:78px; text-align:left; line-height:1.35; }
                .report-metric-compare > div { display:flex; align-items:center; justify-content:space-between; gap:6px; white-space:nowrap; }
                .report-metric-compare > div > span:first-child { color:#94a3b8; font-size:10px; font-weight:600; }
                .report-metric-current strong { color:#1e293b; font-size:14px; }
                .report-metric-previous > span:last-child { color:#64748b; font-size:12px; }
                .report-metric-change { min-height:18px; }
                .report-metric-change > span:last-child { margin-left:0 !important; }
                .report-metric-empty { color:#cbd5e1 !important; font-size:10px !important; font-weight:500 !important; }
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
        `,ne=typeof buildChartNarrative=="function"?buildChartNarrative(d):"",dt=Ut(d,I),re=qt(dt),ae=Jt(dt),ie=Yt(dt),se=Zt(dt),le=j?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${j.prevExamId||"上次"} → ${j.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${j.title||"云端记录"}</span>
            </div>
        </div>`:"",ce=Wt().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",de=`
        ${oe}
        <div class="${tt?"student-report-shell student-report-shell-full":"student-report-shell"}">
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${tmEscapeHtml(e.school)} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${Ht}</p>
        </div>
        ${le}
        ${ce}
        <div class="fluent-card report-student-strip" style="padding:15px 25px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:baseline; gap:15px;">
                    <span style="font-size:24px; font-weight:800; color:#1e3a8a;">${tmEscapeHtml(e.name)}</span>
                    <span style="font-size:14px; color:#475569; background:#fff; padding:2px 8px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${tmEscapeHtml(e.class)}</span>
                </div>
                <div style="font-size:13px; color:#64748b; font-family:monospace;">考号: ${e.id}</div>
            </div>
        </div>
        <div class="student-report-main-grid">
        <div class="fluent-card student-report-hero-card" style="padding:18px 20px;">
            <div class="fluent-header"><i class="ti ti-badge-4k" style="color:#2563eb;"></i><span class="fluent-title">成绩快照与真实定位</span></div>
            ${re}
            ${ae}
            ${ie}
            ${se}
        </div>
        <div class="fluent-card student-report-table-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩对比</th><th>班排对比</th><th>校排对比</th><th style="${P}">镇排对比</th><th style="${A}">县排对比</th></tr></thead>
                <tbody>${Dt}</tbody>
            </table>
        </div>
        </div>`,yt=I;let jt="";if(yt.length>1){let t="",n=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${bt}</th><th>校排</th>`;c&&(n+="<th>镇排</th>"),S&&(n+="<th>县排</th>");for(let l=yt.length-1;l>=0;l--){const i=yt[l],y=i.examFullKey||i.examId,f=getEffectiveCurrentExamId(),w=!!f&&(isExamKeyEquivalentForCompare(y,f)||isExamKeyEquivalentForCompare(i.examId,f)),R=w?"background:rgba(239,246,255,0.7); font-weight:bold;":"",x=i.student||i,z=getComparisonTotalValue(x,O),E=Number.isFinite(z)?z.toFixed(1):"-",N=safeGet(x,"ranks.total.school",i.rankSchool||"-"),W=safeGet(x,"ranks.total.township",i.rankTown||"-"),pe=Z(i,x,"total","county");t+=`<tr style="${R}">
                ${p("考试名称",`${w?"⭐ ":""}${i.examLabel||i.examId||i.examFullKey||"-"}`,"text-align:left; padding-left:20px; color:#475569;")}
                ${p(bt,E,"color:#2563eb;")}
                ${p("校级排名",N,"color:#64748b;")}
                ${c?p("全镇排名",W,"color:#64748b;"):""}
                ${S?p("全县排名",pe,"color:#64748b;"):""}
            </tr>`}jt=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${n}</tr></thead>
                <tbody>${t}</tbody>
            </table>
        </div>`}const Et=`
        ${de}
        ${jt}
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
        ${ne}
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>
        </div>`;return D&&o.html.set(q,Et),Et}function $t(e){var X,T;const r=new Date().toLocaleDateString(),s=RAW_DATA.length,a=ft(e),g=getComparisonTotalSubjects(),U=getComparisonTotalValue(a,g),gt=at("township",g),tt=at("county",g),it=tt===null?getStudentCountyRankValue(a,"total")!=="-":tt,D=gt&&!isCountyDirectStudent(a),q=D?safeGet(a,"ranks.total.township","-"):safeGet(a,"ranks.total.school","-"),Tt=(a==null?void 0:a.school)&&((T=(X=SCHOOLS==null?void 0:SCHOOLS[a.school])==null?void 0:X.students)==null?void 0:T.length)||s||1,d=typeof q=="number"?((1-q/(D?s||1:Tt))*100).toFixed(0):"-",j=e.name.charAt(0),I=vt(a),k=Object.keys(SCHOOLS).length<=1?"全校":D?"全镇":"本校";let C="";d>=90?C="🌟 卓越之星":d>=75?C="🔥 进步飞速":C="📚 持续努力";let st="";g.forEach(c=>{if(a.scores[c]!==void 0){const h=a.scores[c],K=safeGet(a,`ranks.${c}.school`,"-"),H=D?safeGet(a,`ranks.${c}.township`,"-"):"-",Q=getStudentCountyRankValue(a,c),S=[`级#${K}`];D&&S.push(`镇#${H}`),it&&S.push(`县#${Q}`),st+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${c}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${h}</span>
                            <span class="insta-comm-rank">${S.join(" | ")}</span>
                        </div>
                    </div>
                `}});const u=`
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
        `,b=(()=>{let c=[],h=[],K=[],H=[];getComparisonTotalSubjects().forEach(L=>{if(e.scores[L]!==void 0){const B=RAW_DATA.map(A=>A.scores[L]).filter(A=>typeof A=="number");if(B.length<2)return;const ct=B.reduce((A,O)=>A+O,0)/B.length,ht=B.reduce((A,O)=>A+Math.pow(O-ct,2),0)/B.length,xt=Math.sqrt(ht)||1,rt=(e.scores[L]-ct)/xt;H.push(rt);const P=`${L}`;rt>=.8?c.push(P):rt<=-.8?h.push(P):K.push(P)}});const S=H.length?Math.max(...H):0,ut=H.length?Math.min(...H):0,mt=S-ut;return{strong:c,weak:h,mid:K,range:mt}})(),p=(c=>c>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:c>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(b.range),J=`
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${p.bg}; color:${p.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${p.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${p.text}
                </div>
            </div>
        `,Y=(c,h)=>!c||c.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${h}</div>`:c.map(K=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${K}</span>`).join(""),Z=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科
                        <span style="margin-left:auto; font-size:10px; color:#999;">${b.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${Y(b.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${b.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${b.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${Y(b.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,et=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const c=[];if(b.weak.length>0){const h=b.weak.join("、");c.push(`🎯 <strong>精准攻坚：</strong>针对 ${h}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(b.strong.length>0){const h=b.strong.join("、");c.push(`🛡️ <strong>保持自信：</strong>${h} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return b.strong.length===0&&b.weak.length===0&&c.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),c.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),c.map(h=>`<li style="margin-bottom:8px; line-height:1.5;">${h}</li>`).join("")})()}
                </ul>
            </div>
        `,lt="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;",M=Number(d),$=Number.isFinite(M)?M>=90?"年级前 10%":M>=80?"年级前 20%":M>=70?"年级前 30%":M>=50?"年级前 50%":M>=30?"年级中游":"仍有提升空间":"",v=wt()?`<div style="${lt}">${k}排名: ${safeGet(a,"ranks.total.school","-")}</div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${k} ${d}% 的考生</div>`:$?`<div style="${lt}">${$}</div>`:"",ot=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(U)?U.toFixed(1):"-"}</div>
                    ${v}
                </div>
            </div>
        `,nt=I?`
            <div style="margin:12px 14px 0 14px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:10px 12px;">
                <div style="font-size:12px; color:#3730a3; line-height:1.5;">
                    <strong>状态：☁️ 云端对比已启用</strong><br>
                    当前对比：${I.prevExamId||"上次"} → ${I.latestExamId||"本次"}
                </div>
                <div style="font-size:11px; color:#6366f1; margin-top:4px;">来源：${I.title||"云端记录"}</div>
            </div>
        `:"";return`
            <div class="insta-view-container" style="background:#fafafa; padding-top:20px;">
                <div class="insta-card">
                    <!-- Header -->
                    <div class="insta-header">
                        <div class="insta-avatar-ring"><div class="insta-avatar">${j}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${tmEscapeHtml(e.name)} <i class="ti ti-discount-check insta-verified"></i></div>
                            <div class="insta-location">${tmEscapeHtml(e.school)} · ${tmEscapeHtml(e.class)}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${ot}
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
                        本次考试成绩已出炉！${C}，请查收您的学习报告。
                        <span class="insta-tags">#期末考试 #${tmEscapeHtml(e.school)} #学习报告</span>
                    </div>

                    <!-- 2. 🟢 新增：模块④ 学情结构一句话诊断 -->
                    ${typeof J!="undefined"?J:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof Z!="undefined"?Z:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${nt}
                    ${u}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${st}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof et!="undefined"?et:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${r}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}Object.assign(window,{getTrendBadge:Rt,renderSingleReportCardHTML:Ct,renderInstagramCard:$t}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
