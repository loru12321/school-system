(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;const q=window.CompareSessionState||null,dt=window.ReportSessionState||null,_t=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>q&&typeof q.getCloudStudentCompareContext=="function"&&q.getCloudStudentCompareContext()||null),re=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>dt&&typeof dt.getCurrentReportStudent=="function"?dt.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),Ft=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>q&&typeof q.getDuplicateCompareExams=="function"?q.getDuplicateCompareExams()||[]:[]),o={signature:"",html:new Map,comparisonStudent:new WeakMap,comparisonStudentByKey:new Map,cloudHint:new WeakMap,cloudHintByKey:new Map,previousRecord:new WeakMap,previousRecordByKey:new Map,examHistory:new WeakMap,examHistoryByKey:new Map,scopeMapRaw:"",scopeMap:{},schoolCandidatesSignature:"",schoolCandidates:[],townshipRank:new Map,countyRank:new Map,countyDirect:new WeakMap};function F(){const e=[window.CURRENT_EXAM_ID||"",window.__RAW_DATA_VERSION||0,Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:0,Array.isArray(window.SUBJECTS)?window.SUBJECTS.join("|"):"",Object.keys(window.SCHOOLS||{}).join("|")].join("::");return o.signature!==e&&(o.signature=e,o.html.clear(),o.comparisonStudent=new WeakMap,o.comparisonStudentByKey.clear(),o.cloudHint=new WeakMap,o.cloudHintByKey.clear(),o.previousRecord=new WeakMap,o.previousRecordByKey.clear(),o.examHistory=new WeakMap,o.examHistoryByKey.clear(),o.townshipRank.clear(),o.countyRank.clear(),o.countyDirect=new WeakMap),e}function Y(e){return[String((e==null?void 0:e.school)||"").trim(),String((e==null?void 0:e.class)||"").trim(),String((e==null?void 0:e.name)||"").trim(),String((e==null?void 0:e.id)||"").trim()].join("::")}function yt(e){if(!e||typeof e!="object")return e;if(F(),o.comparisonStudent.has(e))return o.comparisonStudent.get(e);const n=Y(e);if(o.comparisonStudentByKey.has(n)){const a=o.comparisonStudentByKey.get(n);return o.comparisonStudent.set(e,a),a}const l=typeof getComparisonStudentView=="function"?getComparisonStudentView(e,RAW_DATA):e;return o.comparisonStudent.set(e,l),o.comparisonStudentByKey.set(n,l),l}function vt(e){if(!e||typeof e!="object")return null;if(F(),o.cloudHint.has(e))return o.cloudHint.get(e);const n=Y(e);if(o.cloudHintByKey.has(n)){const a=o.cloudHintByKey.get(n);return o.cloudHint.set(e,a),a}const l=Gt(e);return o.cloudHint.set(e,l||null),o.cloudHintByKey.set(n,l||null),l||null}function It(e){if(!e||typeof e!="object")return null;if(F(),o.previousRecord.has(e))return o.previousRecord.get(e);const n=Y(e);if(o.previousRecordByKey.has(n)){const a=o.previousRecordByKey.get(n);return o.previousRecord.set(e,a),a}const l=typeof findPreviousRecord=="function"?findPreviousRecord(e):null;return o.previousRecord.set(e,l||null),o.previousRecordByKey.set(n,l||null),l||null}function Kt(e){if(!e||typeof e!="object")return[];if(F(),o.examHistory.has(e))return o.examHistory.get(e);const n=Y(e);if(o.examHistoryByKey.has(n)){const x=o.examHistoryByKey.get(n);return o.examHistory.set(e,x),x}const l=typeof getStudentExamHistory=="function"?getStudentExamHistory(e):[],a=Array.isArray(l)?l:[];return o.examHistory.set(e,a),o.examHistoryByKey.set(n,a),a}function tt(e,n){const l=`${F()}::${e}::${(n||[]).join("|")}`,a=e==="township"?o.townshipRank:o.countyRank;if(a.has(l))return a.get(l);const x=e==="township"?typeof hasStudentTownshipRankData=="function"?hasStudentTownshipRankData(RAW_DATA,n):Object.keys(SCHOOLS).length>1:typeof hasStudentCountyRankData=="function"?hasStudentCountyRankData(RAW_DATA,n):null;return a.set(l,x),x}function Ot(){let e="";try{e=localStorage.getItem("COUNTY_ANALYSIS_SCOPE_V1")||""}catch(n){e=""}if(o.scopeMapRaw!==e){o.scopeMapRaw=e;try{o.scopeMap=e?JSON.parse(e):{}}catch(n){o.scopeMap={}}}return o.scopeMap}function Bt(){const e=F();return o.schoolCandidatesSignature===e||(o.schoolCandidatesSignature=e,o.schoolCandidates=Array.from(new Set([...Object.keys(SCHOOLS||{}),...(RAW_DATA||[]).map(n=>n==null?void 0:n.school)].map(n=>String(n||"").trim()).filter(Boolean)))),o.schoolCandidates}function Gt(e){return typeof getCloudCompareHint=="function"?getCloudCompareHint(e):isCloudContextMatchStudent(e)||isCloudContextLikelyCurrentTarget(e)?_t():null}function z(e,n,l="score"){if(n==null||n==="-"||n==="")return"";const a=parseFloat(e),x=parseFloat(n);if(isNaN(a)||isNaN(x))return"";const j=a-x;if(Math.abs(j)<.01)return'<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>';let D="",$="",R="";l==="score"?j>0?(D="#15803d",R="#dcfce7",$="▲"):(D="#b91c1c",R="#fee2e2",$="▼"):j<0?(D="#15803d",R="#dcfce7",$="▲"):(D="#b91c1c",R="#fee2e2",$="▼");const v=Math.abs(j);return`<span style="display:inline-flex; align-items:center; background:${R}; color:${D}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${$} ${l==="score"?v.toFixed(1):v}
        </span>`}function wt(e,n){var zt,Dt,jt,At,kt,Et,Nt,Mt;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),wt(e,"PC");const j=window.innerWidth<=768,D=n==="FULL",$=n==="A4"||n==="PC"||D,R=$,v=R?`${F()}::${Y(e)}::${n||""}::${new Date().toLocaleDateString()}`:"";if(R&&o.html.has(v))return o.html.get(v);if(!$&&j||n==="IG"){const t=St(e);return setTimeout(()=>{typeof renderIGCharts=="function"&&renderIGCharts(e)},50),t}const pt=RAW_DATA.length,ft=new Date().toLocaleDateString(),p=yt(e),T=vt(p),f=(T==null?void 0:T.previousRecord)||It(p),k=Kt(p),et=getEffectiveCurrentExamId(),I=k.filter(t=>{const r=t.examFullKey||t.examId;return!et||!isExamKeyEquivalentForCompare(r,et)&&!isExamKeyEquivalentForCompare(t.examId,et)}).slice(-1)[0]||null,E=I?I.student||I:null,g=E&&E.scores?E:f,J=((zt=g==null?void 0:g.ranks)==null?void 0:zt.total)||{},Ct=t=>typeof t=="number"&&Number.isFinite(t)?t:t&&typeof t=="object"&&typeof t.score=="number"&&Number.isFinite(t.score)?t.score:"-",h=t=>String(t!=null?t:"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),d=(t,r,s="")=>`<td data-label="${h(t)}"${s?` style="${s}"`:""}>${r}</td>`,K=t=>{var r,s,i,b,m,H,A,C;return{class:(s=(r=t==null?void 0:t.class)!=null?r:t==null?void 0:t.rankClass)!=null?s:"-",school:(b=(i=t==null?void 0:t.school)!=null?i:t==null?void 0:t.rankSchool)!=null?b:"-",township:(H=(m=t==null?void 0:t.township)!=null?m:t==null?void 0:t.rankTown)!=null?H:"-",county:(C=(A=t==null?void 0:t.county)!=null?A:t==null?void 0:t.rankCounty)!=null?C:"-"}},ot=(t,r=null)=>{const s=String((t==null?void 0:t.examFullKey)||(t==null?void 0:t.examId)||(r==null?void 0:r._sourceExam)||(r==null?void 0:r.examFullKey)||(r==null?void 0:r.examId)||"").trim();if(!s)return null;const i=Ot();return(i==null?void 0:i[s])||null},Z=(t,r="total",s=null)=>{var m,H,A,C,U,bt,st,lt,ct;if(!t||typeof t!="object")return!1;const i=ot(s,t);if(!i||i.includesCounty!==!0)return!1;const b=r==="total"?(C=(A=(H=(m=t==null?void 0:t.ranks)==null?void 0:m.total)==null?void 0:H.county)!=null?A:t==null?void 0:t.rankCounty)!=null?C:t==null?void 0:t.countyRank:(ct=(bt=(U=t==null?void 0:t.ranks)==null?void 0:U[r])==null?void 0:bt.county)!=null?ct:(lt=(st=t==null?void 0:t.subjectRanks)==null?void 0:st[r])==null?void 0:lt.county;return b!=null&&b!==""},nt=t=>{var i;const r=String((i=t==null?void 0:t.class)!=null?i:"").trim(),s=typeof normalizeClass=="function"?normalizeClass(r):r;return!s||s==="-"?!1:!/^(?:无|未分班|无班级|暂无|undefined|null|nan)$/i.test(s)},$t=t=>{if(typeof isCountyDirectStudentForRank=="function")return isCountyDirectStudentForRank(t);const r=String((t==null?void 0:t.school)||"").trim();if(!r||typeof getCountyDirectSchoolNames!="function"||typeof getTownshipManagedSchoolNames!="function")return!1;if(o.countyDirect.has(t))return o.countyDirect.get(t);const s=Bt();if(!getTownshipManagedSchoolNames(s).length)return o.countyDirect.set(t,!1),!1;const b=getCountyDirectSchoolNames(s).some(m=>m===r||typeof areSchoolNamesEquivalent=="function"&&areSchoolNamesEquivalent(m,r)||typeof areSchoolNamesMatched=="function"&&areSchoolNamesMatched(m,r,!0));return o.countyDirect.set(t,b),b},N=(t,r=!0)=>r?t==null||t===""?"-":t:"-",O=p&&typeof p=="object"&&p.scores&&typeof p.scores=="object"?p.scores:{},rt=[...new Set(SUBJECTS)],B=tt("township",rt),X=tt("county",rt),c=X===null?getStudentCountyRankValue(p,"total")!=="-":X,u=nt(p),w=B&&!$t(p),y=c,Q=N(safeGet(p,"ranks.total.township","-"),w),G=N((jt=(Dt=J.township)!=null?Dt:f==null?void 0:f.townRank)!=null?jt:"-",w),at=N(safeGet(p,"ranks.total.class","-"),u),gt=N((kt=(At=J.class)!=null?At:f==null?void 0:f.classRank)!=null?kt:"-",u),P=safeGet(p,"ranks.total.school","-"),W=(Nt=(Et=J.school)!=null?Et:f==null?void 0:f.schoolRank)!=null?Nt:"-",L=getStudentCountyRankValue(p,"total"),ut=Z(g,"total",I)&&(Mt=J.county)!=null?Mt:"-",Rt=Object.keys(SCHOOLS).length<=1,M=B?"":"display:none !important;",_=y?"":"display:none !important;";let S="";if(CONFIG.name==="9年级"){let t=0,r=0;["语文","数学","英语","物理","化学"].forEach(s=>{O[s]!==void 0&&(t+=O[s],r++)}),r>0&&(S+=`<tr style="background:rgba(248,250,252,0.5);">
                    ${d("科目","🏁 核心五科","font-weight:bold; color:#475569;")}
                    ${d("成绩（对比）",t.toFixed(1),"font-weight:bold; color:#2563eb;")}
                    ${d("班级排名","-")}
                    ${d("校级排名","-")}
                    ${d("全镇排名","-",M)}
                    ${d("全县排名","-",_)}
                </tr>`)}const V=getComparisonTotalSubjects(),mt=getComparisonTotalValue(p,V),xt=CONFIG.name==="9年级"&&V.length?"五科总分":CONFIG.label,Pt=g?recalcPrevTotal(g):"-",Wt=z(mt,Pt,"score"),Vt=u?z(at,gt,"rank"):"",Ut=z(P,W,"rank"),qt=w?z(Q,G,"rank"):"",Jt=y?z(L,ut,"rank"):"";S+=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            ${d("科目",`🏆 ${xt}`,"font-weight:bold; color:#1e3a8a;")}
            ${d("成绩（对比）",`${Number.isFinite(mt)?mt.toFixed(2):"-"} ${Wt}`,"font-weight:800; font-size:16px; color:#1e40af;")}
            ${d("班级排名",`${at} ${Vt}`,"font-weight:bold; color:#334155;")}
            ${d("校级排名",`${P} ${Ut}`,"font-weight:bold; color:#334155;")}
            ${d("全镇排名",`${Q} ${qt}`,`${M} font-weight:bold; color:#334155;`)}
            ${d("全县排名",`${y?L:"-"} ${Jt}`,`${_} font-weight:bold; color:#334155;`)}
        </tr>`,[...new Set(SUBJECTS)].forEach(t=>{if(O[t]!==void 0){const r=g&&g.scores?Ct(g.scores[t]):"-",s=z(O[t],r,"score");let i=K(g&&g.ranks?g.ranks[t]:null);i.class==="-"&&i.school==="-"&&i.township==="-"&&f&&f.ranks&&f.ranks[t]&&(i=K(f.ranks[t]));const b=safeGet(p,`ranks.${t}.school`,"-"),m=z(b,i.school||"-","rank"),H=N(safeGet(p,`ranks.${t}.township`,"-"),w),A=w?z(H,i.township||"-","rank"):"",C=getStudentCountyRankValue(p,t),U=y&&Z(g,t,I)?z(C,i.county||"-","rank"):"";S+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    ${d("科目",t,"font-weight:600; color:#475569;")}
                    ${d("成绩（对比）",`${O[t]} ${s}`,"font-weight:bold; color:#334155;")}
                    ${d("班级排名","-","color:#cbd5e1;")}
                    ${d("校级排名",`${b} <span style="font-size:0.9em;">${m}</span>`,"color:#64748b;")}
                    ${d("全镇排名",`${H} <span style="font-size:0.9em;">${A}</span>`,`color:#64748b; ${M}`)}
                    ${d("全县排名",`${y?C:"-"} <span style="font-size:0.9em;">${U}</span>`,`color:#64748b; ${_}`)}
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
        `,Zt=buildChartNarrative(p),it=buildStudentInsightModel(p,k),Xt=renderStudentInsightOverview(it),Qt=renderStudentActionPlan(it),Lt=renderStudentSubjectBoard(it),te=renderStudentRealityNote(it),ee=T?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${T.prevExamId||"上次"} → ${T.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${T.title||"云端记录"}</span>
            </div>
        </div>`:"",oe=Ft().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",ne=`
        ${Yt}
        <div class="${D?"student-report-shell student-report-shell-full":"student-report-shell"}">
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${e.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${ft}</p>
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
                <tbody>${S}</tbody>
            </table>
        </div>
        </div>`,ht=k;let Tt="";if(ht.length>1){let t="",r=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${xt}</th><th>校排</th>`;B&&(r+="<th>镇排</th>");for(let s=ht.length-1;s>=0;s--){const i=ht[s],b=i.examFullKey||i.examId,m=getEffectiveCurrentExamId(),H=!!m&&(isExamKeyEquivalentForCompare(b,m)||isExamKeyEquivalentForCompare(i.examId,m)),A=H?"background:rgba(239,246,255,0.7); font-weight:bold;":"",C=i.student||i,U=getComparisonTotalValue(C,V),st=Number.isFinite(U)?U.toFixed(1):"-",lt=safeGet(C,"ranks.total.school",i.rankSchool||"-"),ct=safeGet(C,"ranks.total.township",i.rankTown||"-");t+=`<tr style="${A}">
                ${d("考试名称",`${H?"⭐ ":""}${i.examLabel||i.examId||i.examFullKey||"-"}`,"text-align:left; padding-left:20px; color:#475569;")}
                ${d(xt,st,"color:#2563eb;")}
                ${d("校级排名",lt,"color:#64748b;")}
                ${B?d("全镇排名",ct,"color:#64748b;"):""}
            </tr>`}Tt=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${r}</tr></thead>
                <tbody>${t}</tbody>
            </table>
        </div>`}const Ht=`
        ${ne}
        ${Tt}
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
        </div>`;return R&&o.html.set(v,Ht),Ht}function St(e){var B,X;const n=new Date().toLocaleDateString(),l=RAW_DATA.length,a=yt(e),x=getComparisonTotalSubjects(),j=getComparisonTotalValue(a,x),D=tt("township",x),$=tt("county",x),R=$===null?getStudentCountyRankValue(a,"total")!=="-":$,v=D&&!isCountyDirectStudent(a),pt=v?safeGet(a,"ranks.total.township","-"):safeGet(a,"ranks.total.school","-"),ft=(a==null?void 0:a.school)&&((X=(B=SCHOOLS==null?void 0:SCHOOLS[a.school])==null?void 0:B.students)==null?void 0:X.length)||l||1,T=typeof pt=="number"?((1-pt/(v?l||1:ft))*100).toFixed(0):"-",f=e.name.charAt(0),k=vt(a),I=Object.keys(SCHOOLS).length<=1?"全校":v?"全镇":"本校";let E="";T>=90?E="🌟 卓越之星":T>=75?E="🔥 进步飞速":E="📚 持续努力";let g="";x.forEach(c=>{if(a.scores[c]!==void 0){const u=a.scores[c],w=safeGet(a,`ranks.${c}.school`,"-"),y=v?safeGet(a,`ranks.${c}.township`,"-"):"-",Q=getStudentCountyRankValue(a,c),G=[`级#${w}`];v&&G.push(`镇#${y}`),R&&G.push(`县#${Q}`),g+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${c}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${u}</span>
                            <span class="insta-comm-rank">${G.join(" | ")}</span>
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
        `,h=(()=>{let c=[],u=[],w=[],y=[];getComparisonTotalSubjects().forEach(P=>{if(e.scores[P]!==void 0){const W=RAW_DATA.map(S=>S.scores[P]).filter(S=>typeof S=="number");if(W.length<2)return;const L=W.reduce((S,V)=>S+V,0)/W.length,ut=W.reduce((S,V)=>S+Math.pow(V-L,2),0)/W.length,Rt=Math.sqrt(ut)||1,M=(e.scores[P]-L)/Rt;y.push(M);const _=`${P}`;M>=.8?c.push(_):M<=-.8?u.push(_):w.push(_)}});const G=y.length?Math.max(...y):0,at=y.length?Math.min(...y):0,gt=G-at;return{strong:c,weak:u,mid:w,range:gt}})(),K=(c=>c>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:c>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(h.range),ot=`
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${K.bg}; color:${K.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${K.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${K.text}
                </div>
            </div>
        `,Z=(c,u)=>!c||c.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${u}</div>`:c.map(w=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${w}</span>`).join(""),nt=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科
                        <span style="margin-left:auto; font-size:10px; color:#999;">${h.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${Z(h.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${h.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${h.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${Z(h.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,N=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const c=[];if(h.weak.length>0){const u=h.weak.join("、");c.push(`🎯 <strong>精准攻坚：</strong>针对 ${u}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(h.strong.length>0){const u=h.strong.join("、");c.push(`🛡️ <strong>保持自信：</strong>${u} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return h.strong.length===0&&h.weak.length===0&&c.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),c.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),c.map(u=>`<li style="margin-bottom:8px; line-height:1.5;">${u}</li>`).join("")})()}
                </ul>
            </div>
        `,O=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(j)?j.toFixed(1):"-"}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(a,"ranks.total.school","-")}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${I} ${T}% 的考生</div>
                </div>
            </div>
        `,rt=k?`
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
                        <div class="insta-avatar-ring"><div class="insta-avatar">${f}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${e.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${e.school} · ${e.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${O}
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
                    ${typeof ot!="undefined"?ot:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof nt!="undefined"?nt:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${rt}
                    ${J}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${g}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof N!="undefined"?N:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${n}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}Object.assign(window,{getTrendBadge:z,renderSingleReportCardHTML:wt,renderInstagramCard:St}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
