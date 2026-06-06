(()=>{if(typeof window=="undefined"||window.__REPORT_RENDER_RUNTIME_PATCHED__)return;const at=window.CompareSessionState||null,yt=window.ReportSessionState||null,It=typeof window.readCloudStudentCompareContextState=="function"?window.readCloudStudentCompareContextState:(()=>at&&typeof at.getCloudStudentCompareContext=="function"&&at.getCloudStudentCompareContext()||null),he=typeof window.readCurrentReportStudentState=="function"?window.readCurrentReportStudentState:(()=>yt&&typeof yt.getCurrentReportStudent=="function"?yt.getCurrentReportStudent()||null:window.CURRENT_REPORT_STUDENT&&typeof window.CURRENT_REPORT_STUDENT=="object"?window.CURRENT_REPORT_STUDENT:null),Kt=typeof window.readDuplicateCompareExamsState=="function"?window.readDuplicateCompareExamsState:(()=>at&&typeof at.getDuplicateCompareExams=="function"?at.getDuplicateCompareExams()||[]:[]),a={signature:"",html:new Map,comparisonStudent:new WeakMap,comparisonStudentByKey:new Map,cloudHint:new WeakMap,cloudHintByKey:new Map,previousRecord:new WeakMap,previousRecordByKey:new Map,examHistory:new WeakMap,examHistoryByKey:new Map,scopeMapRaw:"",scopeMap:{},schoolCandidatesSignature:"",schoolCandidates:[],townshipRank:new Map,countyRank:new Map,countyDirect:new WeakMap};function Z(){const t=[window.CURRENT_EXAM_ID||"",window.__RAW_DATA_VERSION||0,Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:0,Array.isArray(window.SUBJECTS)?window.SUBJECTS.join("|"):"",Object.keys(window.SCHOOLS||{}).join("|")].join("::");return a.signature!==t&&(a.signature=t,a.html.clear(),a.comparisonStudent=new WeakMap,a.comparisonStudentByKey.clear(),a.cloudHint=new WeakMap,a.cloudHintByKey.clear(),a.previousRecord=new WeakMap,a.previousRecordByKey.clear(),a.examHistory=new WeakMap,a.examHistoryByKey.clear(),a.townshipRank.clear(),a.countyRank.clear(),a.countyDirect=new WeakMap),t}function ct(t){return[String((t==null?void 0:t.school)||"").trim(),String((t==null?void 0:t.class)||"").trim(),String((t==null?void 0:t.name)||"").trim(),String((t==null?void 0:t.id)||(t==null?void 0:t.examNo)||"").trim()].join("::")}function Bt(t,n){if(!Array.isArray(t)||!t.length)return null;for(let o=t.length-1;o>=0;o--){const r=t[o],l=(r==null?void 0:r.examFullKey)||(r==null?void 0:r.examId);if(!n||!isExamKeyEquivalentForCompare(l,n)&&!isExamKeyEquivalentForCompare(r==null?void 0:r.examId,n))return r||null}return null}function vt(t){if(!t||typeof t!="object")return t;if(Z(),a.comparisonStudent.has(t))return a.comparisonStudent.get(t);const n=ct(t);if(a.comparisonStudentByKey.has(n)){const r=a.comparisonStudentByKey.get(n);return a.comparisonStudent.set(t,r),r}const o=typeof getComparisonStudentView=="function"?getComparisonStudentView(t,RAW_DATA):t;return a.comparisonStudent.set(t,o),a.comparisonStudentByKey.set(n,o),o}function Tt(t){if(!t||typeof t!="object")return null;if(Z(),a.cloudHint.has(t))return a.cloudHint.get(t);const n=ct(t);if(a.cloudHintByKey.has(n)){const r=a.cloudHintByKey.get(n);return a.cloudHint.set(t,r),r}const o=Qt(t);return a.cloudHint.set(t,o||null),a.cloudHintByKey.set(n,o||null),o||null}function Gt(t){if(!t||typeof t!="object")return null;if(Z(),a.previousRecord.has(t))return a.previousRecord.get(t);const n=ct(t);if(a.previousRecordByKey.has(n)){const r=a.previousRecordByKey.get(n);return a.previousRecord.set(t,r),r}const o=typeof findPreviousRecord=="function"?findPreviousRecord(t):null;return a.previousRecord.set(t,o||null),a.previousRecordByKey.set(n,o||null),o||null}function At(t){if(!t||typeof t!="object")return[];if(Z(),a.examHistory.has(t))return a.examHistory.get(t);const n=ct(t);if(a.examHistoryByKey.has(n)){const l=a.examHistoryByKey.get(n);return a.examHistory.set(t,l),l}const o=typeof getStudentExamHistory=="function"?getStudentExamHistory(t):[],r=Array.isArray(o)?o:[];return a.examHistory.set(t,r),a.examHistoryByKey.set(n,r),r}function Pt(t){const o=(Array.isArray(window.RAW_DATA)?window.RAW_DATA:[]).map(u=>{var h;return(h=u==null?void 0:u.scores)==null?void 0:h[t]}).filter(u=>typeof u=="number").sort((u,h)=>h-u),r=o.length,l=r?o.reduce((u,h)=>u+h,0)/r:0,C=r?o.reduce((u,h)=>u+Math.pow(h-l,2),0)/r:0;return{scores:o,count:r,mean:l,sd:Math.sqrt(C)||1}}function Wt(t,n){if(!n||!n.count)return null;const o=n.scores.indexOf(t)+1;return o>0?(1-o/n.count)*100:null}function Vt(t,n=null){var f,x;const o=vt(t),r=typeof getComparisonTotalSubjects=="function"?getComparisonTotalSubjects():Array.isArray(window.SUBJECTS)?window.SUBJECTS:[],l=typeof getComparisonTotalValue=="function"?getComparisonTotalValue(o,r):Number((o==null?void 0:o.total)||0),C=Object.keys(window.SCHOOLS||{}).length<=1,u=typeof hasStudentTownshipRankData=="function"?hasStudentTownshipRankData(window.RAW_DATA||[],r):!C,h=typeof isCountyDirectStudentForRank=="function"?isCountyDirectStudentForRank(o):!1,R=u&&!h,y=C?"全校":R?"全镇":"本校",z=R?safeGet(o,"ranks.total.township",safeGet(o,"ranks.total.school","-")):safeGet(o,"ranks.total.school","-"),pt=(o==null?void 0:o.school)&&((x=(f=window.SCHOOLS)==null?void 0:f[o.school])==null?void 0:x.students),X=R?(Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:1)||1:Array.isArray(pt)&&pt.length||(Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:1)||1,g=typeof z=="number"&&X>0?(1-z/X)*100:null,T=Array.isArray(n)?n:At(o),N=typeof getLatestHistoryExamEntry=="function"?getLatestHistoryExamEntry(o,T):Array.isArray(T)&&T.length?T[T.length-1]:null,it=N?N.student||N:null,H=it?typeof recalcPrevTotal=="function"?recalcPrevTotal(it):Number(it.total):null,S=Number.isFinite(l)&&Number.isFinite(H)?l-H:null,K=[];r.forEach(d=>{var et;const $=(et=o==null?void 0:o.scores)==null?void 0:et[d];if(typeof $!="number")return;const M=Pt(d);if(!M.count)return;const D=Wt($,M),O=M.sd>0?($-M.mean)/M.sd:0;K.push({subject:d,score:$,percentile:D,zScore:O,schoolRank:safeGet(o,`ranks.${d}.school`,"-"),townshipRank:safeGet(o,`ranks.${d}.township`,"-")})});const v=K.filter(d=>d.zScore>=.8).sort((d,$)=>$.zScore-d.zScore),w=K.filter(d=>d.zScore<=-.8).sort((d,$)=>d.zScore-$.zScore),m=K.map(d=>d.zScore),dt=m.length?Math.max(...m)-Math.min(...m):0;let B="结构均衡",p="ok";dt>=2.6?(B="偏科明显",p="warn"):dt>=1.4&&(B="有波动",p="info");let F="首次生成",_="neutral";typeof S=="number"&&(S>=.5?(F=`较上次提升 ${S.toFixed(1)} 分`,_="up"):S<=-.5?(F=`较上次回落 ${Math.abs(S).toFixed(1)} 分`,_="down"):(F="与上次基本持平",_="steady"));const Q=w.slice(0,2),V=v.slice(0,2),L=Number.isFinite(l)?l+Math.max(4,Math.min(12,(Q.length||1)*3)):null,tt=typeof z=="number"?Math.max(1,z-Math.max(1,Math.round(z*.08))):null,G=[Q.length?{tone:"warn",title:`优先补弱：${Q.map(d=>d.subject).join("、")}`,detail:"先做基础概念回顾，再做近两次错题复盘；每天固定 15 到 20 分钟，先稳住容易失分点。"}:{tone:"ok",title:"当前没有明显短板",detail:"整体结构比较稳定，可以把更多精力放在提速、审题和规范表达上。"},V.length?{tone:"info",title:`继续守住优势：${V.map(d=>d.subject).join("、")}`,detail:"优势科目重点保持错题复盘和阶段总结，让强项持续稳定输出。"}:{tone:"info",title:"建立稳定优势科目",detail:"从最有把握的一门学科开始，把基础题和中档题做稳。"},{tone:"goal",title:"下一次目标建议",detail:`${L!==null?`建议先把总分稳定到 ${L.toFixed(1)} 分左右；`:""}${tt!==null?`争取 ${y}排名提升到前 ${tt} 名。`:"先把当前优势延续到下一次考试。"}`}],P=[`本次解读基于当前成绩库中的 ${X} 名同届样本和 ${Math.max(T.length,1)} 次考试记录。`,"分数、排名、百分位均按已导入的真实成绩计算，不做估高处理。","如果学校还没有导入最新一次考试或历史考试，趋势结论会更保守。"];return{reportStudent:o,totalScore:l,totalCount:X,scopeText:y,effectiveRank:z,percentile:g,previousTotal:H,totalDelta:S,balanceLabel:B,balanceTone:p,trendLabel:F,trendTone:_,focusSubjects:Q,guardSubjects:V,actionPlans:G,realityNotes:P,targetScore:L,targetRank:tt,subjectInsights:K,strongSubjects:v,weakSubjects:w}}function Ut(t){const n=t.percentile!==null?`${t.percentile.toFixed(0)}%`:"-",o=Number.isFinite(t.totalScore)?t.totalScore.toFixed(1):"-",r=typeof t.effectiveRank=="number"?`${t.effectiveRank}`:"-",l=Number.isFinite(t.previousTotal)?t.previousTotal.toFixed(1):"-",C=t.trendTone==="up"?"report-pill up":t.trendTone==="down"?"report-pill down":"report-pill",u=t.balanceTone==="warn"?"report-pill warn":t.balanceTone==="info"?"report-pill info":"report-pill ok",h=t.focusSubjects.length?t.focusSubjects.map(y=>y.subject).join("、"):"暂无明显短板",R=t.guardSubjects.length?t.guardSubjects.map(y=>y.subject).join("、"):"建议先培养一门稳定优势科目";return`<div class="report-insight-grid"><div class="report-insight-card tone-score"><span class="report-insight-label">本次总分</span><strong class="report-insight-value">${o}</strong><span class="report-insight-sub">上次对比：${l}</span></div><div class="report-insight-card tone-rank"><span class="report-insight-label">${t.scopeText}定位</span><strong class="report-insight-value">第 ${r} 名</strong><span class="report-insight-sub">综合百分位：${n}</span></div><div class="report-insight-card tone-balance"><span class="report-insight-label">结构状态</span><strong class="report-insight-value">${t.balanceLabel}</strong><span class="${u}">${t.balanceLabel}</span></div><div class="report-insight-card tone-trend"><span class="report-insight-label">阶段走势</span><strong class="report-insight-value">${t.trendLabel}</strong><span class="${C}">${t.trendLabel}</span></div></div><div class="report-chip-row"><span class="report-chip report-chip-focus">当前优先调整：${h}</span><span class="report-chip report-chip-guard">继续守住优势：${R}</span></div>`}function qt(t){return`<div class="report-action-grid">${t.actionPlans.map(n=>`<div class="report-action-card tone-${n.tone}"><div class="report-action-title">${n.title}</div><div class="report-action-text">${n.detail}</div></div>`).join("")}</div>`}function Jt(t){const n=Array.isArray(t.subjectInsights)?t.subjectInsights:[];return n.length?`<div class="report-subject-board">${n.map(o=>{const r=o.percentile!==null?Math.max(0,Math.min(100,o.percentile)):0,l=o.zScore>=.8?"strong":o.zScore<=-.8?"weak":"steady",C=l==="strong"?"优势科目":l==="weak"?"优先补弱":"保持稳定",u=Number.isFinite(o.zScore)?o.zScore.toFixed(2):"-";return`<div class="report-subject-item tone-${l}"><div class="report-subject-head"><strong>${o.subject}</strong><span>${C}</span></div><div class="report-subject-meta"><span>成绩 ${o.score}</span><span>百分位 ${o.percentile!==null?o.percentile.toFixed(0)+"%":"-"}</span><span>Z ${u}</span></div><div class="report-progress-track"><div class="report-progress-bar tone-${l}" style="width:${r}%;"></div></div></div>`}).join("")}</div>`:""}function Yt(t){return`<div class="report-reality-note"><div class="report-reality-title">真实成绩说明</div><ul class="report-reality-list">${t.realityNotes.map(n=>`<li>${n}</li>`).join("")}</ul></div>`}function ut(t,n){const o=`${Z()}::${t}::${(n||[]).join("|")}`,r=t==="township"?a.townshipRank:a.countyRank;if(r.has(o))return r.get(o);const l=t==="township"?typeof hasStudentTownshipRankData=="function"?hasStudentTownshipRankData(RAW_DATA,n):Object.keys(SCHOOLS).length>1:typeof hasStudentCountyRankData=="function"?hasStudentCountyRankData(RAW_DATA,n):null;return r.set(o,l),l}function Zt(){let t="";try{t=localStorage.getItem("COUNTY_ANALYSIS_SCOPE_V1")||""}catch(n){t=""}if(a.scopeMapRaw!==t){a.scopeMapRaw=t;try{a.scopeMap=t?JSON.parse(t):{}}catch(n){a.scopeMap={}}}return a.scopeMap}function Xt(){const t=Z();return a.schoolCandidatesSignature===t||(a.schoolCandidatesSignature=t,a.schoolCandidates=Array.from(new Set([...Object.keys(SCHOOLS||{}),...(RAW_DATA||[]).map(n=>n==null?void 0:n.school)].map(n=>String(n||"").trim()).filter(Boolean)))),a.schoolCandidates}function Qt(t){return typeof getCloudCompareHint=="function"?getCloudCompareHint(t):isCloudContextMatchStudent(t)||isCloudContextLikelyCurrentTarget(t)?It():null}function I(t,n,o="score"){if(n==null||n==="-"||n==="")return"";const r=parseFloat(t),l=parseFloat(n);if(isNaN(r)||isNaN(l))return"";const C=r-l;if(Math.abs(C)<.01)return'<span style="color:#94a3b8; font-size:11px; margin-left:4px; font-weight:normal;">(持平)</span>';let u="",h="",R="";o==="score"?C>0?(u="#15803d",R="#dcfce7",h="▲"):(u="#b91c1c",R="#fee2e2",h="▼"):C<0?(u="#15803d",R="#dcfce7",h="▲"):(u="#b91c1c",R="#fee2e2",h="▼");const y=Math.abs(C);return`<span style="display:inline-flex; align-items:center; background:${R}; color:${u}; padding:1px 6px; border-radius:10px; font-size:11px; font-weight:bold; margin-left:5px; vertical-align:middle;">
            ${h} ${o==="score"?y.toFixed(1):y}
        </span>`}function kt(t,n,o={}){var Dt,Nt,Mt,Et,Ft,_t,Ot;if(navigator.userAgent.toLowerCase().includes("android")&&window.innerWidth<=768&&!window.Chart)return console.warn("⚠️ Android Canvas 异常，强制切换 PC 模式"),kt(t,"PC",o);const u=window.innerWidth<=768,h=n==="FULL",R=n==="A4"||n==="PC"||h,y=R,z=y?`${Z()}::${ct(t)}::${n||""}::${new Date().toLocaleDateString()}`:"";if(y&&a.html.has(z))return a.html.get(z);if(!R&&u||n==="IG"){const e=jt(t);return setTimeout(()=>{typeof renderIGCharts=="function"&&renderIGCharts(t)},50),e}const pt=RAW_DATA.length,X=new Date().toLocaleDateString(),g=vt(t),T=Tt(g),N=Array.isArray(o.reportExamHistory)?o.reportExamHistory:At(g),it=getEffectiveCurrentExamId(),H=Bt(N,it),S=H?H.student||H:null,K=!!(S&&S.scores&&S.ranks),v=(T==null?void 0:T.previousRecord)||(K?null:Gt(g)),w=S&&S.scores?S:v,m=((Dt=w==null?void 0:w.ranks)==null?void 0:Dt.total)||{},dt=e=>typeof e=="number"&&Number.isFinite(e)?e:e&&typeof e=="object"&&typeof e.score=="number"&&Number.isFinite(e.score)?e.score:"-",B=e=>String(e!=null?e:"").replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;"),p=(e,i,c="")=>`<td data-label="${B(e)}"${c?` style="${c}"`:""}>${i}</td>`,F=e=>{var i,c,s,k,b,j,E,A;return{class:(c=(i=e==null?void 0:e.class)!=null?i:e==null?void 0:e.rankClass)!=null?c:"-",school:(k=(s=e==null?void 0:e.school)!=null?s:e==null?void 0:e.rankSchool)!=null?k:"-",township:(j=(b=e==null?void 0:e.township)!=null?b:e==null?void 0:e.rankTown)!=null?j:"-",county:(A=(E=e==null?void 0:e.county)!=null?E:e==null?void 0:e.rankCounty)!=null?A:"-"}},_=(e,i,c="total",s="county")=>{var j,E,A,W,Y,ot,nt,rt;const k=c==="total"?((j=i==null?void 0:i.ranks)==null?void 0:j.total)||i||e||{}:((E=i==null?void 0:i.ranks)==null?void 0:E[c])||((A=i==null?void 0:i.subjectRanks)==null?void 0:A[c])||((W=e==null?void 0:e.subjectRanks)==null?void 0:W[c])||{},b=F(k)[s];return b!=null&&b!==""?b:s==="county"&&c==="total"&&(rt=(nt=(ot=(Y=i==null?void 0:i.rankCounty)!=null?Y:i==null?void 0:i.countyRank)!=null?ot:e==null?void 0:e.rankCounty)!=null?nt:e==null?void 0:e.countyRank)!=null?rt:"-"},Q=(e,i=null)=>{const c=String((e==null?void 0:e.examFullKey)||(e==null?void 0:e.examId)||(i==null?void 0:i._sourceExam)||(i==null?void 0:i.examFullKey)||(i==null?void 0:i.examId)||"").trim();if(!c)return null;const s=Zt();return(s==null?void 0:s[c])||null},V=(e,i="total",c=null)=>{var b,j,E,A,W,Y,ot,nt,rt;if(!e||typeof e!="object")return!1;const s=i==="total"?(A=(E=(j=(b=e==null?void 0:e.ranks)==null?void 0:b.total)==null?void 0:j.county)!=null?E:e==null?void 0:e.rankCounty)!=null?A:e==null?void 0:e.countyRank:(rt=(Y=(W=e==null?void 0:e.ranks)==null?void 0:W[i])==null?void 0:Y.county)!=null?rt:(nt=(ot=e==null?void 0:e.subjectRanks)==null?void 0:ot[i])==null?void 0:nt.county;if(s!=null&&s!==""&&s!=="-")return!0;const k=Q(c,e);return!k||k.includesCounty!==!0?!1:s!=null&&s!==""},L=e=>{var s;const i=String((s=e==null?void 0:e.class)!=null?s:"").trim(),c=typeof normalizeClass=="function"?normalizeClass(i):i;return!c||c==="-"?!1:!/^(?:无|未分班|无班级|暂无|undefined|null|nan)$/i.test(c)},tt=e=>{if(typeof isCountyDirectStudentForRank=="function")return isCountyDirectStudentForRank(e);const i=String((e==null?void 0:e.school)||"").trim();if(!i||typeof getCountyDirectSchoolNames!="function"||typeof getTownshipManagedSchoolNames!="function")return!1;if(a.countyDirect.has(e))return a.countyDirect.get(e);const c=Xt();if(!getTownshipManagedSchoolNames(c).length)return a.countyDirect.set(e,!1),!1;const k=getCountyDirectSchoolNames(c).some(b=>b===i||typeof areSchoolNamesEquivalent=="function"&&areSchoolNamesEquivalent(b,i)||typeof areSchoolNamesMatched=="function"&&areSchoolNamesMatched(b,i,!0));return a.countyDirect.set(e,k),k},G=(e,i=!0)=>i?e==null||e===""?"-":e:"-",P=g&&typeof g=="object"&&g.scores&&typeof g.scores=="object"?g.scores:{},f=[...new Set(SUBJECTS)],x=ut("township",f),d=ut("county",f),$=d===null?getStudentCountyRankValue(g,"total")!=="-":d,M=L(g),D=x&&!tt(g),O=$,et=G(safeGet(g,"ranks.total.township","-"),D),st=G((Mt=(Nt=m.township)!=null?Nt:v==null?void 0:v.townRank)!=null?Mt:"-",D),U=G(safeGet(g,"ranks.total.class","-"),M),gt=G((Ft=(Et=m.class)!=null?Et:v==null?void 0:v.classRank)!=null?Ft:"-",M),ht=safeGet(g,"ranks.total.school","-"),wt=(Ot=(_t=m.school)!=null?_t:v==null?void 0:v.schoolRank)!=null?Ot:"-",lt=getStudentCountyRankValue(g,"total"),ft=V(w,"total",H)?_(H,w,"total","county"):"-",q=Object.keys(SCHOOLS).length<=1,J=x?"":"display:none !important;",mt=O?"":"display:none !important;";let xt="";if(CONFIG.name==="9年级"){let e=0,i=0;["语文","数学","英语","物理","化学"].forEach(c=>{P[c]!==void 0&&(e+=P[c],i++)}),i>0&&(xt+=`<tr style="background:rgba(248,250,252,0.5);">
                    ${p("科目","🏁 核心五科","font-weight:bold; color:#475569;")}
                    ${p("成绩（对比）",e.toFixed(1),"font-weight:bold; color:#2563eb;")}
                    ${p("班级排名","-")}
                    ${p("校级排名","-")}
                    ${p("全镇排名","-",J)}
                    ${p("全县排名","-",mt)}
                </tr>`)}const St=getComparisonTotalSubjects(),$t=getComparisonTotalValue(g,St),Ct=CONFIG.name==="9年级"&&St.length?"五科总分":CONFIG.label,Lt=w?recalcPrevTotal(w):"-",te=I($t,Lt,"score"),ee=M?I(U,gt,"rank"):"",oe=I(ht,wt,"rank"),ne=D?I(et,st,"rank"):"",re=O?I(lt,ft,"rank"):"";xt+=`<tr style="background:rgba(239,246,255,0.7); backdrop-filter:blur(4px); border-bottom:2px solid #fff;">
            ${p("科目",`🏆 ${Ct}`,"font-weight:bold; color:#1e3a8a;")}
            ${p("成绩（对比）",`${Number.isFinite($t)?$t.toFixed(2):"-"} ${te}`,"font-weight:800; font-size:16px; color:#1e40af;")}
            ${p("班级排名",`${U} ${ee}`,"font-weight:bold; color:#334155;")}
            ${p("校级排名",`${ht} ${oe}`,"font-weight:bold; color:#334155;")}
            ${p("全镇排名",`${et} ${ne}`,`${J} font-weight:bold; color:#334155;`)}
            ${p("全县排名",`${O?lt:"-"} ${re}`,`${mt} font-weight:bold; color:#334155;`)}
        </tr>`,[...new Set(SUBJECTS)].forEach(e=>{if(P[e]!==void 0){const i=w&&w.scores?dt(w.scores[e]):"-",c=I(P[e],i,"score");let s=F(w&&w.ranks?w.ranks[e]:null);s.class==="-"&&s.school==="-"&&s.township==="-"&&v&&v.ranks&&v.ranks[e]&&(s=F(v.ranks[e]));const k=safeGet(g,`ranks.${e}.school`,"-"),b=I(k,s.school||"-","rank"),j=G(safeGet(g,`ranks.${e}.township`,"-"),D),E=D?I(j,s.township||"-","rank"):"",A=getStudentCountyRankValue(g,e),W=_(H,w,e,"county"),Y=O&&V(w,e,H)?I(A,W||"-","rank"):"";xt+=`<tr style="transition:0.2s;" onmouseover="this.style.background='rgba(241,245,249,0.5)'" onmouseout="this.style.background='transparent'">
                    ${p("科目",e,"font-weight:600; color:#475569;")}
                    ${p("成绩（对比）",`${P[e]} ${c}`,"font-weight:bold; color:#334155;")}
                    ${p("班级排名","-","color:#cbd5e1;")}
                    ${p("校级排名",`${k} <span style="font-size:0.9em;">${b}</span>`,"color:#64748b;")}
                    ${p("全镇排名",`${j} <span style="font-size:0.9em;">${E}</span>`,`color:#64748b; ${J}`)}
                    ${p("全县排名",`${O?A:"-"} <span style="font-size:0.9em;">${Y}</span>`,`color:#64748b; ${mt}`)}
                </tr>`}});const ae=`
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
        `,ie=typeof buildChartNarrative=="function"?buildChartNarrative(g):"",bt=Vt(g,N),se=Ut(bt),le=qt(bt),ce=Jt(bt),pe=Yt(bt),de=T?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#eef2ff; border:1px solid #c7d2fe; color:#3730a3;">
            <div style="display:flex; align-items:center; gap:8px; font-size:12px; flex-wrap:wrap;">
                <span style="font-weight:700;">状态：☁️ 云端对比已启用</span>
                <span>当前对比：${T.prevExamId||"上次"} → ${T.latestExamId||"本次"}</span>
                <span style="color:#6366f1;">来源：${T.title||"云端记录"}</span>
            </div>
        </div>`:"",fe=Kt().length>0?`
        <div class="fluent-card" style="padding:10px 14px; margin-bottom:12px; background:#fff7ed; border:1px solid #fdba74; color:#9a3412;">
            <div style="font-size:12px; line-height:1.7;">
                检测到重复考试快照，系统已自动去重，避免把同一份数据误判为持平。
                如需恢复真实趋势，请重新封存对应考试期数。
            </div>
        </div>`:"",ue=`
        ${ae}
        <div class="${h?"student-report-shell student-report-shell-full":"student-report-shell"}">
        <div class="report-header" style="border-bottom:none; margin-bottom:10px; text-align:center;">
            <h3 style="font-family:'Microsoft YaHei', sans-serif; font-weight:800; color:#1e293b; letter-spacing:1px; margin:0;">${t.school} 学生学业发展报告</h3>
            <p style="color:#94a3b8; font-size:12px; margin-top:5px;">生成日期: ${X}</p>
        </div>
        ${de}
        ${fe}
        <div class="fluent-card report-student-strip" style="padding:15px 25px; background:linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                <div style="display:flex; align-items:baseline; gap:15px;">
                    <span style="font-size:24px; font-weight:800; color:#1e3a8a;">${t.name}</span>
                    <span style="font-size:14px; color:#475569; background:#fff; padding:2px 8px; border-radius:4px; box-shadow:0 1px 2px rgba(0,0,0,0.05);">${t.class}</span>
                </div>
                <div style="font-size:13px; color:#64748b; font-family:monospace;">考号: ${t.id}</div>
            </div>
        </div>
        <div class="student-report-main-grid">
        <div class="fluent-card student-report-hero-card" style="padding:18px 20px;">
            <div class="fluent-header"><i class="ti ti-badge-4k" style="color:#2563eb;"></i><span class="fluent-title">成绩快照与真实定位</span></div>
            ${se}
            ${le}
            ${ce}
            ${pe}
        </div>
        <div class="fluent-card student-report-table-card" style="padding:0; overflow:hidden;">
            <table class="fluent-table" id="tb-query">
                <thead><tr><th style="text-align:left; padding-left:20px;">科目</th><th>成绩 (对比)</th><th>总分班排</th><th>校排</th><th style="${J}">全镇排名</th><th style="${mt}">全县排名</th></tr></thead>
                <tbody>${xt}</tbody>
            </table>
        </div>
        </div>`,Rt=N;let zt="";if(Rt.length>1){let e="",i=`<th style="text-align:left; padding-left:20px;">考试名称</th><th>${Ct}</th><th>校排</th>`;x&&(i+="<th>镇排</th>"),O&&(i+="<th>县排</th>");for(let c=Rt.length-1;c>=0;c--){const s=Rt[c],k=s.examFullKey||s.examId,b=getEffectiveCurrentExamId(),j=!!b&&(isExamKeyEquivalentForCompare(k,b)||isExamKeyEquivalentForCompare(s.examId,b)),E=j?"background:rgba(239,246,255,0.7); font-weight:bold;":"",A=s.student||s,W=getComparisonTotalValue(A,St),ot=Number.isFinite(W)?W.toFixed(1):"-",nt=safeGet(A,"ranks.total.school",s.rankSchool||"-"),rt=safeGet(A,"ranks.total.township",s.rankTown||"-"),ge=_(s,A,"total","county");e+=`<tr style="${E}">
                ${p("考试名称",`${j?"⭐ ":""}${s.examLabel||s.examId||s.examFullKey||"-"}`,"text-align:left; padding-left:20px; color:#475569;")}
                ${p(Ct,ot,"color:#2563eb;")}
                ${p("校级排名",nt,"color:#64748b;")}
                ${x?p("全镇排名",rt,"color:#64748b;"):""}
                ${O?p("全县排名",ge,"color:#64748b;"):""}
            </tr>`}zt=`
        <div class="fluent-card" style="padding:0; overflow:hidden; margin-top:20px;">
            <div class="fluent-header" style="padding: 15px 20px 5px; border-bottom: none;"><i class="ti ti-chart-line" style="color:#f97316;"></i><span class="fluent-title">历次考试趋势记录</span></div>
            <table class="fluent-table">
                <thead><tr>${i}</tr></thead>
                <tbody>${e}</tbody>
            </table>
        </div>`}const Ht=`
        ${ue}
        ${zt}
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
        ${ie}
        <div style="text-align:center; font-size:11px; color:#cbd5e1; margin-top:20px;">系统自动生成 · 仅供家校沟通参考</div>
        </div>`;return y&&a.html.set(z,Ht),Ht}function jt(t){var G,P;const n=new Date().toLocaleDateString(),o=RAW_DATA.length,r=vt(t),l=getComparisonTotalSubjects(),C=getComparisonTotalValue(r,l),u=ut("township",l),h=ut("county",l),R=h===null?getStudentCountyRankValue(r,"total")!=="-":h,y=u&&!isCountyDirectStudent(r),z=y?safeGet(r,"ranks.total.township","-"):safeGet(r,"ranks.total.school","-"),pt=(r==null?void 0:r.school)&&((P=(G=SCHOOLS==null?void 0:SCHOOLS[r.school])==null?void 0:G.students)==null?void 0:P.length)||o||1,g=typeof z=="number"?((1-z/(y?o||1:pt))*100).toFixed(0):"-",T=t.name.charAt(0),N=Tt(r),H=Object.keys(SCHOOLS).length<=1?"全校":y?"全镇":"本校";let S="";g>=90?S="🌟 卓越之星":g>=75?S="🔥 进步飞速":S="📚 持续努力";let K="";l.forEach(f=>{if(r.scores[f]!==void 0){const x=r.scores[f],d=safeGet(r,`ranks.${f}.school`,"-"),$=y?safeGet(r,`ranks.${f}.township`,"-"):"-",M=getStudentCountyRankValue(r,f),D=[`级#${d}`];y&&D.push(`镇#${$}`),R&&D.push(`县#${M}`),K+=`
                    <div class="insta-comment-row">
                        <div>
                            <span class="insta-comm-user">${f}</span>
                            <span class="insta-comm-text">成绩单</span>
                        </div>
                        <div>
                            <span class="insta-comm-score">${x}</span>
                            <span class="insta-comm-rank">${D.join(" | ")}</span>
                        </div>
                    </div>
                `}});const v=`
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
        `,m=(()=>{let f=[],x=[],d=[],$=[];getComparisonTotalSubjects().forEach(st=>{if(t.scores[st]!==void 0){const U=RAW_DATA.map(q=>q.scores[st]).filter(q=>typeof q=="number");if(U.length<2)return;const gt=U.reduce((q,J)=>q+J,0)/U.length,ht=U.reduce((q,J)=>q+Math.pow(J-gt,2),0)/U.length,wt=Math.sqrt(ht)||1,lt=(t.scores[st]-gt)/wt;$.push(lt);const ft=`${st}`;lt>=.8?f.push(ft):lt<=-.8?x.push(ft):d.push(ft)}});const D=$.length?Math.max(...$):0,O=$.length?Math.min(...$):0,et=D-O;return{strong:f,weak:x,mid:d,range:et}})(),B=(f=>f>=2.5?{tag:"⚠️ 严重偏科",color:"#b91c1c",bg:"#fee2e2",text:"不同学科成绩差异极大，存在明显优势科目与薄弱科目，需要针对性调整学习重心，补齐短板。"}:f>=1.2?{tag:"⚖️ 相对均衡",color:"#0369a1",bg:"#e0f2fe",text:"各学科成绩整体较为均衡，个别学科略有波动，保持稳定发挥是关键。"}:{tag:"🌟 结构优秀",color:"#15803d",bg:"#dcfce7",text:"各学科发展极其均衡，无明显短板，心理素质稳定，是冲刺更高目标的理想状态。"})(m.range),p=`
            <div style="margin: 15px 14px 0 14px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span style="font-weight:bold; color:#334155; font-size:14px;">🧠 学情结构诊断</span>
                    <span style="font-size:12px; background:${B.bg}; color:${B.color}; padding:2px 8px; border-radius:12px; font-weight:bold;">
                        ${B.tag}
                    </span>
                </div>
                <div style="font-size:13px; color:#64748b; line-height:1.5;">
                    ${B.text}
                </div>
            </div>
        `,F=(f,x)=>!f||f.length===0?`<div style="font-size:12px; color:#ccc; padding:5px;">${x}</div>`:f.map(d=>`<span style="display:inline-block; background:#f1f5f9; color:#334155; font-size:12px; padding:4px 10px; border-radius:4px; margin:0 5px 5px 0;">${d}</span>`).join(""),_=`
            <div style="margin: 15px 14px 0 14px;">
                <!-- 优势科目 -->
                <details open style="margin-bottom:10px; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#f8fafc; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">☀️</span> 优势学科
                        <span style="margin-left:auto; font-size:10px; color:#999;">${m.strong.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${F(m.strong,"暂无明显优势学科，继续加油")}
                    </div>
                </details>

                <!-- 薄弱科目 -->
                <details ${m.weak.length>0?"open":""} style="background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
                    <summary style="padding:10px 15px; font-size:13px; font-weight:bold; color:#333; cursor:pointer; background:#fff1f2; list-style:none; display:flex; align-items:center;">
                        <span style="margin-right:8px;">🌧️</span> 需关注学科
                        <span style="margin-left:auto; font-size:10px; color:#dc2626;">${m.weak.length}科</span>
                    </summary>
                    <div style="padding:15px;">
                        ${F(m.weak,"暂无明显短板，保持均衡")}
                    </div>
                </details>
            </div>
        `,V=`
            <div style="margin: 15px 14px 20px 14px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px;">
                <div style="font-size:13px; font-weight:bold; color:#b45309; margin-bottom:10px; display:flex; align-items:center;">
                    <i class="ti ti-bulb" style="margin-right:5px; font-size:16px;"></i> 家长行动指南
                </div>
                <ul style="padding-left:15px; margin:0; font-size:12px; color:#78350f;">
                    ${(()=>{const f=[];if(m.weak.length>0){const x=m.weak.join("、");f.push(`🎯 <strong>精准攻坚：</strong>针对 ${x}，建议每天安排 15 分钟回归课本基础概念，不盲目刷题。`)}if(m.strong.length>0){const x=m.strong.join("、");f.push(`🛡️ <strong>保持自信：</strong>${x} 是孩子的信心来源，请多给予具体表扬，稳住优势。`)}return m.strong.length===0&&m.weak.length===0&&f.push("🚀 <strong>寻找突破：</strong>目前成绩非常稳定。建议选定一门孩子最感兴趣的学科，尝试增加 5% 的投入，培养成优势学科。"),f.push("📅 <strong>习惯养成：</strong>检查孩子是否养成了“先复习，后作业”的习惯。"),f.map(x=>`<li style="margin-bottom:8px; line-height:1.5;">${x}</li>`).join("")})()}
                </ul>
            </div>
        `,L=`
            <div class="insta-visual-area">
                <div style="width:100%; height:100%; display:flex; flex-direction:column; justify-content:center; align-items:center; background:linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045); border-radius:8px; color:white; padding:40px 0;">
                    <div style="font-size:16px; opacity:0.9; text-transform:uppercase; letter-spacing:2px;">Total Score</div>
                    <div style="font-size:64px; font-weight:800; text-shadow:0 4px 10px rgba(0,0,0,0.2);">${Number.isFinite(C)?C.toFixed(1):"-"}</div>
                    <div style="margin-top:10px; font-size:18px; font-weight:bold; background:rgba(255,255,255,0.2); padding:5px 15px; border-radius:20px;">
                        全校排名: ${safeGet(r,"ranks.total.school","-")}
                    </div>
                    <div style="margin-top:20px; font-size:12px; opacity:0.8;">击败了${H} ${g}% 的考生</div>
                </div>
            </div>
        `,tt=N?`
            <div style="margin:12px 14px 0 14px; background:#eef2ff; border:1px solid #c7d2fe; border-radius:8px; padding:10px 12px;">
                <div style="font-size:12px; color:#3730a3; line-height:1.5;">
                    <strong>状态：☁️ 云端对比已启用</strong><br>
                    当前对比：${N.prevExamId||"上次"} → ${N.latestExamId||"本次"}
                </div>
                <div style="font-size:11px; color:#6366f1; margin-top:4px;">来源：${N.title||"云端记录"}</div>
            </div>
        `:"";return`
            <div class="insta-view-container" style="background:#fafafa; padding-top:20px;">
                <div class="insta-card">
                    <!-- Header -->
                    <div class="insta-header">
                        <div class="insta-avatar-ring"><div class="insta-avatar">${T}</div></div>
                        <div class="insta-user-info">
                            <div class="insta-username">${t.name} <i class="ti ti-discount-check-filled insta-verified"></i></div>
                            <div class="insta-location">${t.school} · ${t.class}</div>
                        </div>
                        <i class="ti ti-dots"></i>
                    </div>
                    
                    <!-- 1. 核心总分大卡片 (Visual Area - 旧模块) -->
                    ${L}
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
                        <span class="insta-tags">#期末考试 #${t.school} #学习报告</span>
                    </div>

                    <!-- 2. 🟢 新增：模块④ 学情结构一句话诊断 -->
                    ${typeof p!="undefined"?p:""}

                    <!-- 3. 🟢 新增：模块⑤ 优势/短板学科折叠清单 -->
                    ${typeof _!="undefined"?_:""}

                    <!-- 4. 🟢 新增：图表容器 (雷达图/均衡度 - 之前定义的 chartsHtml) -->
                    ${tt}
                    ${v}

                    <!-- 5. 单科成绩列表 (旧模块) -->
                    <div class="insta-comments" style="margin-top:15px;">
                        <div style="color:#8e8e8e; margin-bottom:5px; font-size:12px; font-weight:bold;">📄 单科成绩详情</div>
                        ${K}
                    </div>

                    <!-- 6. 🟢 新增：模块⑥ 家长执行建议 -->
                    ${typeof V!="undefined"?V:""}

                    <!-- Timestamp -->
                    <div class="insta-timestamp">${n}</div>
                </div>
                
                <div style="text-align:center; padding:20px; color:#999; font-size:12px;">
                    <p>已显示全部数据</p>
                    <button class="btn btn-sm btn-gray" onclick="Auth.logout()">退出登录</button>
                </div>
            </div>
        `}Object.assign(window,{getTrendBadge:I,renderSingleReportCardHTML:kt,renderInstagramCard:jt}),window.__REPORT_RENDER_RUNTIME_PATCHED__=!0})();
