(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;const B=window.CompareSessionState||null,dt=window.ReportSessionState||null,Mt=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>B&&typeof B.getCloudStudentCompareContext=="function"&&B.getCloudStudentCompareContext()||null),re=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>dt&&typeof dt.getCurrentReportStudent=="function"?dt.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),_t=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>B&&typeof B.getDuplicateCompareExams=="function"?B.getDuplicateCompareExams()||[]:[]),o={signature:"",html:new Map,comparisonStudent:new WeakMap,cloudHint:new WeakMap,previousRecord:new WeakMap,examHistory:new WeakMap,scopeMapRaw:"",scopeMap:{},schoolCandidatesSignature:"",schoolCandidates:[],townshipRank:new Map,countyRank:new Map,countyDirect:new WeakMap};function F(){const e=[window.CURRENT_EXAM_ID||"",window.__RAW_DATA_VERSION||0,Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:0,Array.isArray(window.SUBJECTS)?window.SUBJECTS.join("|"):"",Object.keys(window.SCHOOLS||{}).join("|")].join("::");return o.signature!==e&&(o.signature=e,o.html.clear(),o.comparisonStudent=new WeakMap,o.cloudHint=new WeakMap,o.previousRecord=new WeakMap,o.examHistory=new WeakMap,o.townshipRank.clear(),o.countyRank.clear(),o.countyDirect=new WeakMap),e}function Ft(e){return[String((e==null?void 0:e.school)||"").trim(),String((e==null?void 0:e.class)||"").trim(),String((e==null?void 0:e.name)||"").trim(),String((e==null?void 0:e.id)||"").trim()].join("::")}function bt(e){if(!e||typeof e!="object")return e;if(F(),o.comparisonStudent.has(e))return o.comparisonStudent.get(e);const r=typeof getComparisonStudentView=="function"?getComparisonStudentView(e,RAW_DATA):e;return o.comparisonStudent.set(e,r),r}function yt(e){if(!e||typeof e!="object")return null;if(F(),o.cloudHint.has(e))return o.cloudHint.get(e);const r=Wt(e);return o.cloudHint.set(e,r||null),r||null}function It(e){if(!e||typeof e!="object")return null;if(F(),o.previousRecord.has(e))return o.previousRecord.get(e);const r=typeof findPreviousRecord=="function"?findPreviousRecord(e):null;return o.previousRecord.set(e,r||null),r||null}function Ot(e){if(!e||typeof e!="object")return[];if(F(),o.examHistory.has(e))return o.examHistory.get(e);const r=typeof getStudentExamHistory=="function"?getStudentExamHistory(e):[],h=Array.isArray(r)?r:[];return o.examHistory.set(e,h),h}function L(e,r){const h=`${F()}::${e}::${(r||[]).join("|")}`,s=e==="township"?o.townshipRank:o.countyRank;if(s.has(h))return s.get(h);const S=e==="township"?typeof hasStudentTownshipRankData=="function"?hasStudentTownshipRankData(RAW_DATA,r):Object.keys(SCHOOLS).length>1:typeof hasStudentCountyRankData=="function"?hasStudentCountyRankData(RAW_DATA,r):null;return s.set(h,S),S}function Gt(){let e="";try{e=localStorage.getItem("COUNTY_ANALYSIS_SCOPE_V1")||""}catch(r){e=""}if(o.scopeMapRaw!==e){o.scopeMapRaw=e;try{o.scopeMap=e?JSON.parse(e):{}}catch(r){o.scopeMap={}}}return o.scopeMap}function Pt(){const e=F();return o.schoolCandidatesSignature===e||(o.schoolCandidatesSignature=e,o.schoolCandidates=Array.from(new Set([...Object.keys(SCHOOLS||{}),...(RAW_DATA||[]).map(r=>r==null?void 0:r.school)].map(r=>String(r||"").trim()).filter(Boolean)))),o.schoolCandidates}function Wt(e){return typeof getCloudCompareHint=="function"?getCloudCompareHint(e):isCloudContextMatchStudent(e)||isCloudContextLikelyCurrentTarget(e)?Mt():null}function D(e,r,h="score"){if(r==null||r==="-"||r==="")return"";const s=parseFloat(e),S=parseFloat(r);if(isNaN(s)||isNaN(S))return"";const A=s-S;if(Math.abs(A)<.01)return'<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>';let j="",$="",R="";h==="score"?A>0?(j="#15803d",R="#dcfce7",$="▲"):(j="#b91c1c",R="#fee2e2",$="▼"):A<0?(j="#15803d",R="#dcfce7",$="▲"):(j="#b91c1c",R="#fee2e2",$="▼");const y=Math.abs(A);return`<span style="display:inline-flex; align-items:center; background:${R}; color:${j}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${$} ${h==="score"?y.toFixed(1):y}
        </span>`}function wt(e,r){var zt,Dt,jt,At,Ht,kt,Et,Nt;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),wt(e,"PC");const A=window.innerWidth<=768,j=r==="FULL",$=r==="A4"||r==="PC"||j,R=$,y=R?`${F()}::${Ft(e)}::${r||""}::${new Date().toLocaleDateString()}`:"";if(R&&o.html.has(y))return o.html.get(y);if(!$&&A||r==="IG"){const t=vt(e);return setTimeout(()=>{typeof renderIGCharts=="function"&&renderIGCharts(e)},50),t}const ct=RAW_DATA.length,pt=new Date().toLocaleDateString(),c=bt(e),T=yt(c),p=(T==null?void 0:T.previousRecord)||It(c),k=Ot(c),tt=getEffectiveCurrentExamId(),I=k.filter(t=>{const n=t.examFullKey||t.examId;return!tt||!isExamKeyEquivalentForCompare(n,tt)&&!isExamKeyEquivalentForCompare(t.examId,tt)}).slice(-1)[0]||null,E=I?I.student||I:null,f=E&&E.scores?E:p,J=((zt=f==null?void 0:f.ranks)==null?void 0:zt.total)||{},Ct=t=>typeof t=="number"&&Number.isFinite(t)?t:t&&typeof t=="object"&&typeof t.score=="number"&&Number.isFinite(t.score)?t.score:"-",m=t=>String(t!=null?t:"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),d=(t,n,i="")=>`<td data-label="${m(t)}"${i?` style="${i}"`:""}>${n}</td>`,O=t=>{var n,i,a,x,u,z,H,C;return{class:(i=(n=t==null?void 0:t.class)!=null?n:t==null?void 0:t.rankClass)!=null?i:"-",school:(x=(a=t==null?void 0:t.school)!=null?a:t==null?void 0:t.rankSchool)!=null?x:"-",township:(z=(u=t==null?void 0:t.township)!=null?u:t==null?void 0:t.rankTown)!=null?z:"-",county:(C=(H=t==null?void 0:t.county)!=null?H:t==null?void 0:t.rankCounty)!=null?C:"-"}},et=(t,n=null)=>{const i=String((t==null?void 0:t.examFullKey)||(t==null?void 0:t.examId)||(n==null?void 0:n._sourceExam)||(n==null?void 0:n.examFullKey)||(n==null?void 0:n.examId)||"").trim();if(!i)return null;const a=Gt();return(a==null?void 0:a[i])||null},Y=(t,n="total",i=null)=>{var u,z,H,C,q,ht,it,st,lt;if(!t||typeof t!="object")return!1;const a=et(i,t);if(!a||a.includesCounty!==!0)return!1;const x=n==="total"?(C=(H=(z=(u=t==null?void 0:t.ranks)==null?void 0:u.total)==null?void 0:z.county)!=null?H:t==null?void 0:t.rankCounty)!=null?C:t==null?void 0:t.countyRank:(lt=(ht=(q=t==null?void 0:t.ranks)==null?void 0:q[n])==null?void 0:ht.county)!=null?lt:(st=(it=t==null?void 0:t.subjectRanks)==null?void 0:it[n])==null?void 0:st.county;return x!=null&&x!==""},ot=t=>{var a;const n=String((a=t==null?void 0:t.class)!=null?a:"").trim(),i=typeof normalizeClass=="function"?normalizeClass(n):n;return!i||i==="-"?!1:!/^(?:无|未分班|无班级|暂无|undefined|null|nan)$/i.test(i)},St=t=>{if(typeof isCountyDirectStudentForRank=="function")return isCountyDirectStudentForRank(t);const n=String((t==null?void 0:t.school)||"").trim();if(!n||typeof getCountyDirectSchoolNames!="function"||typeof getTownshipManagedSchoolNames!="function")return!1;if(o.countyDirect.has(t))return o.countyDirect.get(t);const i=Pt();if(!getTownshipManagedSchoolNames(i).length)return o.countyDirect.set(t,!1),!1;const x=getCountyDirectSchoolNames(i).some(u=>u===n||typeof areSchoolNamesEquivalent=="function"&&areSchoolNamesEquivalent(u,n)||typeof areSchoolNamesMatched=="function"&&areSchoolNamesMatched(u,n,!0));return o.countyDirect.set(t,x),x},N=(t,n=!0)=>n?t==null||t===""?"-":t:"-",G=c&&typeof c=="object"&&c.scores&&typeof c.scores=="object"?c.scores:{},nt=[...new Set(SUBJECTS)],P=L("township",nt),Z=L("county",nt),l=Z===null?getStudentCountyRankValue(c,"total")!=="-":Z,g=ot(c),w=P&&!St(c),b=l,X=N(safeGet(c,"ranks.total.township","-"),w),W=N((jt=(Dt=J.township)!=null?Dt:p==null?void 0:p.townRank)!=null?jt:"-",w),rt=N(safeGet(c,"ranks.total.class","-"),g),ft=N((Ht=(At=J.class)!=null?At:p==null?void 0:p.classRank)!=null?Ht:"-",g),V=safeGet(c,"ranks.total.school","-"),U=(Et=(kt=J.school)!=null?kt:p==null?void 0:p.schoolRank)!=null?Et:"-",Q=getStudentCountyRankValue(c,"total"),gt=Y(f,"total",I)&&(Nt=J.county)!=null?Nt:"-",$t=Object.keys(SCHOOLS).length<=1,M=P?"":"display:none !important;",_=b?"":"display:none !important;";let v="";if(CONFIG.name==="9年级"){let t=0,n=0;["语文","数学","英语","物理","化学"].forEach(i=>{G[i]!==void 0&&(t+=G[i],n++)}),n>0&&(v+=`<tr style="background:rgba(248,250,252,0.5);">
                    ${d("科目","🏁 核心五科","font-weight:bold; color:#475569;")}
                    ${d("成绩（对比）",t.toFixed(1),"font-weight:bold; color:#2563eb;")}
                    ${d("班级排名","-")}
                    ${d("校级排名","-")}
                    ${d("全镇排名","-",M)}
                    ${d("全县排名","-",_)}
                </tr>`)}const K=getComparisonTotalSubjects(),ut=getComparisonTotalValue(c,K),mt=CONFIG.name==="9年级"&&K.length?"五科总分":CONFIG.label,Vt=f?recalcPrevTotal(f):"-",Ut=D(ut,Vt,"score"),Kt=g?D(rt,ft,"rank"):"",qt=D(V,U,"rank"),Bt=w?D(X,W,"rank"):"",Jt=b?D(Q,gt,"rank"):"";v+=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            ${d("科目",`🏆 ${mt}`,"font-weight:bold; color:#1e3a8a;")}
            ${d("成绩（对比）",`${Number.isFinite(ut)?ut.toFixed(2):"-"} ${Ut}`,"font-weight:800; font-size:16px; color:#1e40af;")}
            ${d("班级排名",`${rt} ${Kt}`,"font-weight:bold; color:#334155;")}
            ${d("校级排名",`${V} ${qt}`,"font-weight:bold; color:#334155;")}
            ${d("全镇排名",`${X} ${Bt}`,`${M} font-weight:bold; color:#334155;`)}
            ${d("全县排名",`${b?Q:"-"} ${Jt}`,`${_} font-weight:bold; color:#334155;`)}
        </tr>`,[...new Set(SUBJECTS)].forEach(t=>{if(G[t]!==void 0){const n=f&&f.scores?Ct(f.scores[t]):"-",i=D(G[t],n,"score");let a=O(f&&f.ranks?f.ranks[t]:null);a.class==="-"&&a.school==="-"&&a.township==="-"&&p&&p.ranks&&p.ranks[t]&&(a=O(p.ranks[t]));const x=safeGet(c,`ranks.${t}.school`,"-"),u=D(x,a.school||"-","rank"),z=N(safeGet(c,`ranks.${t}.township`,"-"),w),H=w?D(z,a.township||"-","rank"):"",C=getStudentCountyRankValue(c,t),q=b&&Y(f,t,I)?D(C,a.county||"-","rank"):"";v+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    ${d("科目",t,"font-weight:600; color:#475569;")}
                    ${d("成绩（对比）",`${G[t]} ${i}`,"font-weight:bold; color:#334155;")}
                    ${d("班级排名","-","color:#cbd5e1;")}
                    ${d("校级排名",`${x} <span style="font-size:0.9em;">${u}</span>`,"color:#64748b;")}
                    ${d("全镇排名",`${z} <span style="font-size:0.9em;">${H}</span>`,`color:#64748b; ${M}`)}
                    ${d("全县排名",`${b?C:"-"} <span style="font-size:0.9em;">${q}</span>`,`color:#64748b; ${_}`)}
                </tr>`}});const Yt=`
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
        `,Zt=buildChartNarrative(c),at=buildStudentInsightModel(c,k),Xt=renderStudentInsightOverview(at),Qt=renderStudentActionPlan(at),Lt=renderStudentSubjectBoard(at),te=renderStudentRealityNote(at),ee=T?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${T.prevExamId||"上次"} → ${T.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${T.title||"云端记录"}</span>
            </div>
        </div>`:"",oe=_t().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",ne=`
        ${Yt}
        <div class="${j?"student-report-shell student-report-shell-full":"student-report-shell"}">
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${e.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${pt}</p>
        </div>
        ${ee}
        ${oe}
        <div class="fluent-card report-student-strip" style="padding:15px 25px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:baseline; gap:15px;">
                    <span style="font-size:24px; font-weight:800; color:#1e3a8a;">${e.name}</span>
                    <span style="font-size:14px; color:#475569; background:#fff; padding:2px 8px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${e.class}</span>
                </div>
                <div style="font-size:13px; color:#64748b; font-family:monospace;">考号: ${e.id}</div>
            </div>
        </div>
        <div class="student-report-main-grid">
        <div class="fluent-card student-report-hero-card" style="padding:18px 20px;">
            <div class="fluent-header"><i class="ti ti-badge-4k" style="color:#2563eb;"></i><span class="fluent-title">成绩快照与真实定位</span></div>
            ${Xt}
            ${Qt}
            ${Lt}
            ${te}
        </div>
        <div class="fluent-card student-report-table-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩 (对比)</th><th>总分班排</th><th>校排</th><th style="${M}">全镇排名</th><th style="${_}">全县排名</th></tr></thead>
                <tbody>${v}</tbody>
            </table>
        </div>
        </div>`,xt=k;let Rt="";if(xt.length>1){let t="",n=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${mt}</th><th>校排</th>`;P&&(n+="<th>镇排</th>");for(let i=xt.length-1;i>=0;i--){const a=xt[i],x=a.examFullKey||a.examId,u=getEffectiveCurrentExamId(),z=!!u&&(isExamKeyEquivalentForCompare(x,u)||isExamKeyEquivalentForCompare(a.examId,u)),H=z?"background:rgba(239,246,255,0.7); font-weight:bold;":"",C=a.student||a,q=getComparisonTotalValue(C,K),it=Number.isFinite(q)?q.toFixed(1):"-",st=safeGet(C,"ranks.total.school",a.rankSchool||"-"),lt=safeGet(C,"ranks.total.township",a.rankTown||"-");t+=`<tr style="${H}">
                ${d("考试名称",`${z?"⭐ ":""}${a.examLabel||a.examId||a.examFullKey||"-"}`,"text-align:left; padding-left:20px; color:#475569;")}
                ${d(mt,it,"color:#2563eb;")}
                ${d("校级排名",st,"color:#64748b;")}
                ${P?d("全镇排名",lt,"color:#64748b;"):""}
            </tr>`}Rt=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${n}</tr></thead>
                <tbody>${t}</tbody>
            </table>
        </div>`}const Tt=`
        ${ne}
        ${Rt}
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
        ${Zt}
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>
        </div>`;return R&&o.html.set(y,Tt),Tt}function vt(e){var P,Z;const r=new Date().toLocaleDateString(),h=RAW_DATA.length,s=bt(e),S=getComparisonTotalSubjects(),A=getComparisonTotalValue(s,S),j=L("township",S),$=L("county",S),R=$===null?getStudentCountyRankValue(s,"total")!=="-":$,y=j&&!isCountyDirectStudent(s),ct=y?safeGet(s,"ranks.total.township","-"):safeGet(s,"ranks.total.school","-"),pt=(s==null?void 0:s.school)&&((Z=(P=SCHOOLS==null?void 0:SCHOOLS[s.school])==null?void 0:P.students)==null?void 0:Z.length)||h||1,T=typeof ct=="number"?((1-ct/(y?h||1:pt))*100).toFixed(0):"-",p=e.name.charAt(0),k=yt(s),I=Object.keys(SCHOOLS).length<=1?"全校":y?"全镇":"本校";let E="";T>=90?E="🌟 卓越之星":T>=75?E="🔥 进步飞速":E="📚 持续努力";let f="";S.forEach(l=>{if(s.scores[l]!==void 0){const g=s.scores[l],w=safeGet(s,`ranks.${l}.school`,"-"),b=y?safeGet(s,`ranks.${l}.township`,"-"):"-",X=getStudentCountyRankValue(s,l),W=[`级#${w}`];y&&W.push(`镇#${b}`),R&&W.push(`县#${X}`),f+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${l}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${g}</span>
                            <span class="insta-comm-rank">${W.join(" | ")}</span>
                        </div>
                    </div>
                `}});const J=`
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
        `,m=(()=>{let l=[],g=[],w=[],b=[];getComparisonTotalSubjects().forEach(V=>{if(e.scores[V]!==void 0){const U=RAW_DATA.map(v=>v.scores[V]).filter(v=>typeof v=="number");if(U.length<2)return;const Q=U.reduce((v,K)=>v+K,0)/U.length,gt=U.reduce((v,K)=>v+Math.pow(K-Q,2),0)/U.length,$t=Math.sqrt(gt)||1,M=(e.scores[V]-Q)/$t;b.push(M);const _=`${V}`;M>=.8?l.push(_):M<=-.8?g.push(_):w.push(_)}});const W=b.length?Math.max(...b):0,rt=b.length?Math.min(...b):0,ft=W-rt;return{strong:l,weak:g,mid:w,range:ft}})(),O=(l=>l>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:l>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(m.range),et=`
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${O.bg}; color:${O.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${O.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${O.text}
                </div>
            </div>
        `,Y=(l,g)=>!l||l.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${g}</div>`:l.map(w=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${w}</span>`).join(""),ot=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科
                        <span style="margin-left:auto; font-size:10px; color:#999;">${m.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${Y(m.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${m.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${m.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${Y(m.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,N=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const l=[];if(m.weak.length>0){const g=m.weak.join("、");l.push(`🎯 <strong>精准攻坚：</strong>针对 ${g}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(m.strong.length>0){const g=m.strong.join("、");l.push(`🛡️ <strong>保持自信：</strong>${g} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return m.strong.length===0&&m.weak.length===0&&l.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),l.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),l.map(g=>`<li style="margin-bottom:8px; line-height:1.5;">${g}</li>`).join("")})()}
                </ul>
            </div>
        `,G=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(A)?A.toFixed(1):"-"}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(s,"ranks.total.school","-")}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${I} ${T}% 的考生</div>
                </div>
            </div>
        `,nt=k?`
            <div style="margin:12px 14px 0 14px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:10px 12px;">
                <div style="font-size:12px; color:#3730a3; line-height:1.5;">
                    <strong>状态：☁️ 云端对比已启用</strong><br>
                    当前对比：${k.prevExamId||"上次"} → ${k.latestExamId||"本次"}
                </div>
                <div style="font-size:11px; color:#6366f1; margin-top:4px;">来源：${k.title||"云端记录"}</div>
            </div>
        `:"";return`
            <div class="insta-view-container" style="background:#fafafa; padding-top:20px;">
                <div class="insta-card">
                    <!-- Header -->
                    <div class="insta-header">
                        <div class="insta-avatar-ring"><div class="insta-avatar">${p}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${e.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${e.school} · ${e.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${G}
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
                        本次考试成绩已出炉！${E}，请查收您的学习报告。
                        <span class="insta-tags">#期末考试 #${e.school} #学习报告</span>
                    </div>

                    <!-- 2. 🟢 新增：模块④ 学情结构一句话诊断 -->
                    ${typeof et!="undefined"?et:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof ot!="undefined"?ot:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${nt}
                    ${J}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${f}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof N!="undefined"?N:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${r}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}Object.assign(window,{getTrendBadge:D,renderSingleReportCardHTML:wt,renderInstagramCard:vt}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
