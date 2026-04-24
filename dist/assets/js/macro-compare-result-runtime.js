(()=>{if(typeof window=="undefined"||window.__MACRO_COMPARE_RESULT_RUNTIME_PATCHED__)return;const ut=typeof window.readMacroCompareCacheState=="function"?window.readMacroCompareCacheState:(()=>window.MACRO_MULTI_PERIOD_COMPARE_CACHE&&typeof window.MACRO_MULTI_PERIOD_COMPARE_CACHE=="object"?window.MACRO_MULTI_PERIOD_COMPARE_CACHE:null),dt=typeof window.setMacroCompareCacheState=="function"?window.setMacroCompareCacheState:(e=>{const a=e&&typeof e=="object"&&!Array.isArray(e)?e:null;return window.MACRO_MULTI_PERIOD_COMPARE_CACHE=a,a}),r=typeof window.teacherToNumber=="function"?window.teacherToNumber:((e,a=0)=>{const l=Number(e);return Number.isFinite(l)?l:a}),tt=typeof window.teacherFormatPercent=="function"?window.teacherFormatPercent:((e,a=1)=>`${(r(e,0)*100).toFixed(a)}%`),et=typeof window.teacherFormatSigned=="function"?window.teacherFormatSigned:((e,a=1)=>{const l=r(e,0);return`${l>=0?"+":""}${l.toFixed(a)}`}),D=typeof window.teacherEscapeHtml=="function"?window.teacherEscapeHtml:(e=>String(e!=null?e:"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])),at=typeof window.teacherFormatFocusList=="function"?window.teacherFormatFocusList:((e,a="暂无")=>{const l=(e||[]).slice(0,8);return l.length?l.map(n=>`${n.name}${n.className?`(${n.className})`:""}${Number.isFinite(n.score)?` ${n.score}`:""}`).join("、"):a}),mt=typeof window.teacherGetWeightConfig=="function"?window.teacherGetWeightConfig:(()=>{var a;return String(((a=window.CONFIG)==null?void 0:a.name)||"").includes("9")?{avg:50,exc:80,pass:50,total:180}:{avg:60,exc:70,pass:70,total:200}}),Dt=typeof window.normalizeSubject=="function"?window.normalizeSubject:(e=>String(e||"").trim()),st=typeof window.sortSubjects=="function"?window.sortSubjects:((e,a)=>String(e||"").localeCompare(String(a||""),"zh-Hans-CN")),ht=typeof window.getCurrentUser=="function"?window.getCurrentUser:(()=>{var e;return((e=window.Auth)==null?void 0:e.currentUser)||null});function f(e,a=NaN){const l=Number(e);return Number.isFinite(l)?l:a}function M(e){const a=(e||[]).map(l=>Number(l)).filter(Number.isFinite);return a.length?a.reduce((l,n)=>l+n,0)/a.length:null}function p(e){return String(e!=null?e:"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function I(e){const a=Number(e);return Number.isFinite(a)?`#${a}`:"-"}function pt(e){const a=Number(e);return!Number.isFinite(a)||a===0?"0":`${a>0?"+":""}${a}`}function H(e,a=2){const l=Number(e);return Number.isFinite(l)?`${l>0?"+":""}${l.toFixed(a)}`:"-"}function _(e,a=2){const l=Number(e);return Number.isFinite(l)?l.toFixed(a):"-"}function L(e,a=1){const l=Number(e);return Number.isFinite(l)?`${(l*100).toFixed(a)}%`:"-"}function U(e,a){const l=Array.isArray(e)?e.map(n=>String(n||"").trim()).filter(Boolean):[];return l.length?l.slice(0,3).join("、"):a}function gt(e,a){const l=Number(e),n=Number(a);if(!Number.isFinite(l)||!Number.isFinite(n)||n<=0)return"-";const d=l/n;return d<=.2?"前列":d<=.5?"中上":d<=.8?"中段":"后段"}function J(e,a,l="idle"){e&&(e.textContent=a,e.className=`analysis-hint analysis-status-text${l==="success"?" is-success":l==="error"?" is-error":""}`)}function q(e,a,l){e&&(e.innerHTML=`<div class="analysis-empty-state analysis-empty-state-compact"><strong>${p(a)}</strong>${p(l)}</div>`)}function nt(){const e=Object.keys(SCHOOLS||{});return e.length?typeof resolveSchoolNameFromCollection=="function"&&resolveSchoolNameFromCollection(e,MY_SCHOOL)||String(MY_SCHOOL||"").trim():""}function bt(e){const a=Object.keys(SCHOOLS||{});return typeof resolveSchoolNameFromCollection=="function"&&resolveSchoolNameFromCollection(a,e)||String(e||"").trim()}function vt(e,a,l){return e.map((n,d)=>{const o=a[d],i=getSchoolRankOverviewEntryBySchool(o,l);return!i||!i.total?null:{examId:n,count:i.total.count,avg:i.total.avg,excRate:i.total.excRate,passRate:i.total.passRate,totalRank:i.total.rankAvg,avgSubjectRank:i.avgSubjectRank,leaderSubjectsText:U(i.leaderSubjects.length?i.leaderSubjects:i.advantageSubjects,"暂无明显领跑学科"),weakSubjectsText:U(i.weakSubjects,"暂无明显短板学科")}}).filter(Boolean)}function ft(e,a,l){return e.map((n,d)=>{var P;const o=a[d],i=getSchoolRankOverviewEntryBySchool(o,l);if(!o||!i||!i.total)return null;const k=Array.isArray(o.schools)?o.schools:[],y=k[0]||null,R=k.length,m=k.length?k.reduce((h,u)=>{var E;return h+Number(((E=u.total)==null?void 0:E.avg)||0)},0)/k.length:null,$=y&&Number.isFinite(Number((P=y.total)==null?void 0:P.avg))?Number(y.total.avg)-Number(i.total.avg||0):null,S=Number.isFinite(Number(m))?Number(i.total.avg||0)-Number(m):null;return{examId:n,totalRank:i.total.rankAvg,avgSubjectRank:i.avgSubjectRank,leaderCount:i.subjectLeaderCount||0,advantageSubjectsText:U(i.advantageSubjects,"暂无明显优势学科"),weakSubjectsText:U(i.weakSubjects,"暂无明显短板学科"),gapToTopAvg:$,gapToCountyAvg:S,rankBand:gt(i.total.rankAvg,R)}}).filter(Boolean)}function yt(e,a,l){const n=getSchoolRankOverviewEntryBySchool(e,l),d=(n==null?void 0:n.school)||String(l||"").trim();return((e==null?void 0:e.schools)||[]).map(o=>{var y,R,m,$,S,P;const i=a?getSchoolRankOverviewEntryBySchool(a,o.school):null,k=Number.isFinite(Number((y=i==null?void 0:i.total)==null?void 0:y.rankAvg))&&Number.isFinite(Number((R=o.total)==null?void 0:R.rankAvg))?Number(i.total.rankAvg)-Number(o.total.rankAvg):null;return{school:o.school,totalRank:($=(m=o.total)==null?void 0:m.rankAvg)!=null?$:null,rankShift:k,avg:(P=(S=o.total)==null?void 0:S.avg)!=null?P:0,avgSubjectRank:o.avgSubjectRank,subjectLeaderCount:o.subjectLeaderCount||0,leaderSubjectsText:U(o.leaderSubjects.length?o.leaderSubjects:o.advantageSubjects,"较均衡"),weakSubjectsText:U(o.weakSubjects,"暂无明显短板"),subjectRanks:((e==null?void 0:e.subjectList)||[]).map(h=>{var u,E;return(E=(u=o.subjects[h])==null?void 0:u.rankAvg)!=null?E:""}),isFocusSchool:o.school===d}})}function St(e,a){const l=Array.isArray(e==null?void 0:e.schools)?e.schools:[];if(!l.length)return[];const n=getSchoolRankOverviewEntryBySchool(e,a),d=(n==null?void 0:n.school)||String(a||"").trim(),o=mt(),i=Math.max(...l.map(h=>{var u;return f((u=h.total)==null?void 0:u.avg,0)}),0),k=Math.max(...l.map(h=>{var u;return f((u=h.total)==null?void 0:u.excRate,0)}),0),y=Math.max(...l.map(h=>{var u;return f((u=h.total)==null?void 0:u.passRate,0)}),0),R=M(l.map(h=>{var u;return(u=h.total)==null?void 0:u.avg})),m=M(l.map(h=>{var u;return(u=h.total)==null?void 0:u.excRate})),$=M(l.map(h=>{var u;return(u=h.total)==null?void 0:u.passRate})),S=l.map(h=>{var T,s,c,b,O,B,v,N,X,z,V,Y;const u=f((T=h.total)==null?void 0:T.avg,0),E=f((s=h.total)==null?void 0:s.excRate,0),A=f((c=h.total)==null?void 0:c.passRate,0),C=i>0?u/i*o.avg:0,j=k>0?E/k*o.exc:0,g=y>0?A/y*o.pass:0;return{school:h.school,count:f((b=h.total)==null?void 0:b.count,0),avg:u,excRate:E,passRate:A,totalRank:(B=(O=h.total)==null?void 0:O.rankAvg)!=null?B:null,avgRank:(N=(v=h.total)==null?void 0:v.rankAvg)!=null?N:null,excRank:(z=(X=h.total)==null?void 0:X.rankExc)!=null?z:null,passRank:(Y=(V=h.total)==null?void 0:V.rankPass)!=null?Y:null,ratedAvg:C,ratedExc:j,ratedPass:g,score2Rate:C+j+g,avgDiff:Number.isFinite(Number(R))?u-Number(R):null,excDiff:Number.isFinite(Number(m))?E-Number(m):null,passDiff:Number.isFinite(Number($))?A-Number($):null,isFocusSchool:h.school===d}}),P=typeof buildCompetitionRankMap=="function"?buildCompetitionRankMap(S,h=>h.school,h=>h.score2Rate):new Map;return S.forEach(h=>{var u;h.scoreRank=(u=P.get(h.school))!=null?u:null}),S.sort((h,u)=>{const E=f(u.score2Rate,0)-f(h.score2Rate,0);if(E!==0)return E;const A=f(u.avg,0)-f(h.avg,0);return A!==0?A:String(h.school||"").localeCompare(String(u.school||""),"zh-CN")}),S}function Rt(e,a){const l=getSchoolRankOverviewEntryBySchool(e,a);return l?((e==null?void 0:e.subjectList)||[]).map(n=>{var $,S,P,h,u,E;const d=($=l.subjects)==null?void 0:$[n];if(!d)return null;const o=((e==null?void 0:e.schools)||[]).filter(A=>{var C;return(C=A.subjects)==null?void 0:C[n]}),i=o.slice().sort((A,C)=>{var T,s,c,b,O,B,v,N;const j=f((s=(T=A.subjects)==null?void 0:T[n])==null?void 0:s.rankAvg,Number.POSITIVE_INFINITY),g=f((b=(c=C.subjects)==null?void 0:c[n])==null?void 0:b.rankAvg,Number.POSITIVE_INFINITY);return j!==g?j-g:f((B=(O=C.subjects)==null?void 0:O[n])==null?void 0:B.avg,0)-f((N=(v=A.subjects)==null?void 0:v[n])==null?void 0:N.avg,0)})[0]||null,k=M(o.map(A=>{var C,j;return(j=(C=A.subjects)==null?void 0:C[n])==null?void 0:j.avg})),y=M(o.map(A=>{var C,j;return(j=(C=A.subjects)==null?void 0:C[n])==null?void 0:j.excRate})),R=M(o.map(A=>{var C,j;return(j=(C=A.subjects)==null?void 0:C[n])==null?void 0:j.passRate})),m=f((P=(S=i==null?void 0:i.subjects)==null?void 0:S[n])==null?void 0:P.avg,NaN);return{subject:n,count:f(d.count,0),avg:f(d.avg,0),excRate:f(d.excRate,0),passRate:f(d.passRate,0),rankAvg:(h=d.rankAvg)!=null?h:null,rankExc:(u=d.rankExc)!=null?u:null,rankPass:(E=d.rankPass)!=null?E:null,countyAvg:k,countyExc:y,countyPass:R,avgDiff:Number.isFinite(Number(k))?Number(d.avg)-Number(k):null,excDiff:Number.isFinite(Number(y))?Number(d.excRate)-Number(y):null,passDiff:Number.isFinite(Number(R))?Number(d.passRate)-Number(R):null,topSchool:(i==null?void 0:i.school)||"",gapToTopAvg:Number.isFinite(m)?m-Number(d.avg||0):null,schoolCount:o.length}}).filter(Boolean).sort((n,d)=>{const o=f(n.rankAvg,Number.POSITIVE_INFINITY)-f(d.rankAvg,Number.POSITIVE_INFINITY);return o!==0?o:st(n.subject,d.subject)}):[]}function $t(e,a){const l=getSchoolRankOverviewEntryBySchool(e,a),n=(l==null?void 0:l.school)||String(a||"").trim();return((e==null?void 0:e.subjectList)||[]).map(d=>{const o=((e==null?void 0:e.schools)||[]).map(m=>{var S,P,h,u;const $=(S=m.subjects)==null?void 0:S[d];return $?{school:m.school,count:f($.count,0),avg:f($.avg,0),excRate:f($.excRate,0),passRate:f($.passRate,0),rankAvg:(P=$.rankAvg)!=null?P:null,rankExc:(h=$.rankExc)!=null?h:null,rankPass:(u=$.rankPass)!=null?u:null,isFocusSchool:m.school===n}:null}).filter(Boolean);if(!o.length)return null;const i=M(o.map(m=>m.avg)),k=M(o.map(m=>m.excRate)),y=M(o.map(m=>m.passRate)),R=o.slice().sort((m,$)=>{const S=f(m.rankAvg,Number.POSITIVE_INFINITY)-f($.rankAvg,Number.POSITIVE_INFINITY);return S!==0?S:f($.avg,0)-f(m.avg,0)})[0]||null;return{subject:d,leaderSchool:(R==null?void 0:R.school)||"",countyAvg:i,countyExc:k,countyPass:y,rows:o.map(m=>({...m,avgDiff:Number.isFinite(Number(i))?m.avg-Number(i):null,excDiff:Number.isFinite(Number(k))?m.excRate-Number(k):null,passDiff:Number.isFinite(Number(y))?m.passRate-Number(y):null})).sort((m,$)=>{const S=f(m.rankAvg,Number.POSITIVE_INFINITY)-f($.rankAvg,Number.POSITIVE_INFINITY);return S!==0?S:f($.avg,0)-f(m.avg,0)})}}).filter(Boolean)}function kt(e,a){const l=[];return Object.keys(e||{}).forEach(n=>{Object.keys(e[n]||{}).forEach(d=>{var i,k;const o=e[n][d];l.push({id:`${n}-${d}`,name:n,subject:d,classes:o.classesText||o.classes||"",avg:r(o.avgValue,0).toFixed(2),fairScore:r(o.fairScore,0).toFixed(1),leagueScoreRaw:r(o.leagueScoreRaw,0).toFixed(1),baselineAdjustment:et(o.baselineAdjustment,1),baselineCoverage:o.baselineCoverageText||"0%",sampleSummary:o.sampleSummary||"暂无历史样本",sampleStability:o.sampleStabilityText||"0%",conversionSummary:o.conversionSummary||"暂无转化样本",conversionScore:r(o.conversionScore,50).toFixed(1),excRate:tt(o.excellentRate,1),passRate:tt(o.passRate,1),lowRate:tt(o.lowRate,1),focusSummary:o.focusSummary||"培优0 / 临界0 / 辅差0",rank:((k=(i=a==null?void 0:a[n])==null?void 0:i[d])==null?void 0:k.rank)||"-"})})}),l.sort((n,d)=>{const o=r(d.fairScore,0)-r(n.fairScore,0);return o!==0?o:String(n.name||"").localeCompare(String(d.name||""),"zh-CN")}),l}function xt(e){const a=bt(e),l=nt();if(!a||!(SCHOOLS!=null&&SCHOOLS[a]))return{school:a,emptyMessage:"当前学校未找到，无法生成教师县域画像。"};if(!l||a!==l)return{school:a,emptyMessage:"教师画像依赖当前已加载本校任课表，请选择本校查看。"};if(!Object.keys(TEACHER_MAP||{}).length)return{school:a,emptyMessage:"当前还没有导入任课表，暂时无法生成教师县域画像。"};if((!window.TEACHER_STATS||!Object.keys(window.TEACHER_STATS).length)&&typeof window.analyzeTeachers=="function")try{window.analyzeTeachers()}catch(d){console.warn("[county-macro] analyzeTeachers failed:",d)}const n=typeof window.getVisibleTeacherStats=="function"?window.getVisibleTeacherStats()||{}:window.TEACHER_STATS||{};return Object.keys(n).length?{school:a,stats:n,rankings:window.TEACHER_TOWNSHIP_RANKINGS||{},rankingTables:window.TOWNSHIP_RANKING_DATA||{},emptyMessage:""}:{school:a,emptyMessage:"当前还没有可用的教师画像数据。"}}function Nt(e){var A,C,j;const a=nt(),l=[String(CURRENT_EXAM_ID||"current"),String(e||""),a,Array.isArray(RAW_DATA)?RAW_DATA.length:0,Object.keys(TEACHER_MAP||{}).length,Object.keys(window.TEACHER_STATS||{}).length].join("|");if(((A=window.__COUNTY_TEACHER_PORTRAIT_CACHE__)==null?void 0:A.key)===l)return window.__COUNTY_TEACHER_PORTRAIT_CACHE__.data;const n=xt(e);if(n.emptyMessage){const g={school:n.school,cards:[],rows:[],rankingPanels:[],summary:null,emptyMessage:n.emptyMessage};return window.__COUNTY_TEACHER_PORTRAIT_CACHE__={key:l,data:g},g}const d=n.school,o=n.stats,i=n.rankings,k=((C=SCHOOLS==null?void 0:SCHOOLS[d])==null?void 0:C.metrics)||{},y=((j=SCHOOLS==null?void 0:SCHOOLS[d])==null?void 0:j.rankings)||{},R=[],m=[];Object.keys(o||{}).forEach(g=>{Object.keys(o[g]||{}).forEach(T=>{var X,z,V,Y,K,Q;const s=o[g][T],c=((X=i==null?void 0:i[g])==null?void 0:X[T])||{},b=M(Object.values(SCHOOLS||{}).map(G=>{var Z,w;return(w=(Z=G==null?void 0:G.metrics)==null?void 0:Z[T])==null?void 0:w.avg}).filter(G=>Number.isFinite(Number(G)))),O=f((z=k==null?void 0:k[T])==null?void 0:z.avg,NaN),B=f((V=y==null?void 0:y[T])==null?void 0:V.avg,NaN),v=Number.isFinite(B)&&Number.isFinite(Number(c.rankAvg))?B-Number(c.rankAvg):null,N=[];Number.isFinite(Number(c.rankAvg))&&Number(c.rankAvg)<=3&&N.push("同学科县域前列"),Number.isFinite(Number(v))&&Number(v)>=2?N.push(`高于本校学科站位${v}名`):Number.isFinite(Number(v))&&Number(v)<=-2&&N.push(`低于本校学科站位${Math.abs(v)}名`),r(s.riskLevel==="risk"?1:0,0)===1?N.push("画像提示重点关注"):r(s.fairScore,0)>=85&&N.push("画像综合状态强势"),N.length||N.push("与本校学科站位接近"),m.push({teacher:g,subject:T,classes:s.classesText||s.classes||"",studentCount:r(s.studentCount,0),previousSampleCount:r(s.previousSampleCount,0),commonSampleCount:r(s.commonSampleCount,0),addedSampleCount:r(s.addedSampleCount,0),exitedSampleCount:r(s.exitedSampleCount,0),sampleStabilityText:s.sampleStabilityText||"0%",sampleWarning:!!s.sampleWarning,sampleDetailText:s.sampleDetailText||"",sampleChangeText:r(s.previousSampleCount,0)>0?`新增 ${r(s.addedSampleCount,0)} / 缺考退出 ${r(s.exitedSampleCount,0)}`:"暂无基线",avg:r(s.avgValue,0),avgText:s.avg||r(s.avgValue,0).toFixed(2),countyAvg:b,schoolSubjectAvg:O,leagueScoreRaw:r(s.leagueScoreRaw,0),leagueScore:r(s.leagueScore,0),baselineAdjustment:r(s.baselineAdjustment,0),baselineCoverageText:s.baselineCoverageText||"0%",excellentRate:r(s.excellentRate,0),passRate:r(s.passRate,0),lowRate:r(s.lowRate,0),conversionScore:r(s.conversionScore,50),conversionAdjustment:r(s.conversionAdjustment,0),conversionSummary:s.conversionSummary||"暂无转化样本",focusSummary:s.focusSummary||"培优0 / 临界0 / 辅差0",focusTargets:s.focusTargets||{},fairScore:r(s.fairScore,0),fairRank:s.fairRank||null,confidenceFactor:r(s.confidenceFactor,1),workloadAdjustment:r(s.workloadAdjustment,0),teacherContinuityText:s.teacherContinuityText||"",expectedAvg:r(s.expectedAvg,0),expectedExcellentRate:r(s.expectedExcellentRate,0),expectedPassRate:r(s.expectedPassRate,0),expectedLowRate:r(s.expectedLowRate,0),rankAvg:(Y=c.rankAvg)!=null?Y:null,rankExc:(K=c.rankExc)!=null?K:null,rankPass:(Q=c.rankPass)!=null?Q:null,schoolRankDelta:v,riskLevel:s.riskLevel||"normal",diagnosis:N.join("，")})})}),m.sort((g,T)=>{const s=st(g.subject,T.subject);if(s!==0)return s;const c=r(T.fairScore,0)-r(g.fairScore,0);return c!==0?c:String(g.teacher||"").localeCompare(String(T.teacher||""),"zh-CN")});const $=new Set(m.map(g=>g.subject));Object.keys(n.rankingTables||{}).sort(st).forEach(g=>{var B;if($.size&&!$.has(g))return;const T=Array.isArray((B=n.rankingTables)==null?void 0:B[g])?n.rankingTables[g].slice():[];if(!T.length)return;const s=T.filter(v=>v.type==="school"),c=M(s.map(v=>v.avg)),b=M(s.map(v=>v.excellentRate)),O=M(s.map(v=>v.passRate));R.push({subject:g,countyAvg:c,countyExc:b,countyPass:O,rows:T.map(v=>{var X,z,V;const N=v.type==="teacher"?m.find(Y=>Y.teacher===v.name&&Y.subject===g):null;return{name:v.name,type:v.type,avg:r(v.avg,0),excellentRate:r(v.excellentRate,0),passRate:r(v.passRate,0),rankAvg:(X=v.rankAvg)!=null?X:null,rankExc:(z=v.rankExc)!=null?z:null,rankPass:(V=v.rankPass)!=null?V:null,fairScore:N?N.fairScore:null,avgDiff:Number.isFinite(Number(c))?r(v.avg,0)-Number(c):null,excDiff:Number.isFinite(Number(b))?r(v.excellentRate,0)-Number(b):null,passDiff:Number.isFinite(Number(O))?r(v.passRate,0)-Number(O):null,isTeacher:v.type==="teacher",isCurrentSchoolTeacher:v.type==="teacher"&&!!N}}).sort((v,N)=>{const X=f(v.rankAvg,Number.POSITIVE_INFINITY)-f(N.rankAvg,Number.POSITIVE_INFINITY);return X!==0?X:r(N.avg,0)-r(v.avg,0)})})});const S=ht(),P=typeof window.teacherBuildCardList=="function"?window.teacherBuildCardList(o,i,(S==null?void 0:S.name)||"",(S==null?void 0:S.role)||"guest"):kt(o,i),h=m[0]||null,u={recordCount:m.length,bestRank:m.reduce((g,T)=>Math.min(g,r(T.rankAvg,Number.POSITIVE_INFINITY)),Number.POSITIVE_INFINITY),aheadCount:m.filter(g=>Number.isFinite(Number(g.schoolRankDelta))&&Number(g.schoolRankDelta)>=1).length,concernCount:m.filter(g=>Number.isFinite(Number(g.schoolRankDelta))&&Number(g.schoolRankDelta)<=-2).length,avgFairScore:M(m.map(g=>g.fairScore)),riskCount:m.filter(g=>g.riskLevel==="risk").length,bestTeacher:h?`${h.teacher} · ${h.subject}`:""},E={school:d,cards:P,rows:m,rankingPanels:R,summary:u,emptyMessage:""};return window.__COUNTY_TEACHER_PORTRAIT_CACHE__={key:l,data:E},E}function Ct(e){return!Array.isArray(e)||!e.length?"":`
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin:14px 0 16px 0;">
                ${e.map(a=>`
                    <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:14px; background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                        <div style="font-size:12px; color:#64748b; margin-bottom:6px;">${p(a.label)}</div>
                        <div style="font-size:20px; font-weight:800; color:#0f172a;">${p(a.value)}</div>
                        <div style="font-size:12px; color:#475569; margin-top:6px;">${p(a.sub)}</div>
                    </div>
                `).join("")}
            </div>
        `}function Tt(e){return!Array.isArray(e)||!e.length?"":`
            <div class="teacher-cards-container" style="margin:10px 0 18px 0;">
                ${e.map(a=>`
                    <div class="teacher-card">
                        <div class="teacher-header">
                            <div>
                                <div class="teacher-name">${D(a.name)} - ${D(a.subject)}</div>
                                <div class="teacher-classes">${D(a.classes)}班</div>
                            </div>
                            <div class="performance-badge ${D(a.badgeClass||"performance-average")}">${D(a.badgeText||"稳健")}</div>
                        </div>
                        <div class="teacher-stats">
                            <div class="stat-item">
                                <div class="stat-value">${D(a.avg)}</div>
                                <div class="stat-label">均分</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${D(a.leagueScoreRaw||"-")}</div>
                                <div class="stat-label">联考赋分</div>
                            </div>
                            <div class="stat-item">
                                <div class="stat-value">${D(a.fairScore||"-")}</div>
                                <div class="stat-label">公平绩效</div>
                            </div>
                        </div>
                        <div style="display:flex; justify-content:space-between; font-size:12px; color:#475569; margin-bottom:8px; padding:0 10px;">
                            <span>优 / 及 / 低: ${D(a.excRate||"-")} / ${D(a.passRate||"-")} / ${D(a.lowRate||"-")}</span>
                            <span>县排: <strong style="color:var(--primary)">${D(a.rank||"-")}</strong></span>
                        </div>
                        <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:6px; padding:0 10px;">
                            <span>基线校正 ${D(a.baselineAdjustment||"-")} · 覆盖 ${D(a.baselineCoverage||"0%")}</span>
                            <span>稳定 ${D(a.sampleStability||"0%")} · 转化 ${D(a.conversionScore||"-")}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; gap:8px; font-size:12px; color:#64748b; margin-bottom:14px; padding:0 10px;">
                            <span>${D(a.sampleSummary||"暂无样本说明")}</span>
                            <span>${D(a.focusSummary||"暂无重点学生")}</span>
                        </div>
                        ${typeof window.showTeacherDetails=="function"?`<button class="view-details-btn" onclick='showTeacherDetails(${JSON.stringify(a.name)}, ${JSON.stringify(a.subject)})'>查看详情</button>`:""}
                    </div>
                `).join("")}
            </div>
        `}function At(e){return!Array.isArray(e)||!e.length?"":e.map(a=>{const l=a.rows.map(n=>{const d=n.type==="teacher"?"教师":"学校",o=n.type==="teacher"?"analysis-row-badge analysis-row-badge-teacher":"analysis-row-badge analysis-row-badge-school";return`
                    <tr class="${n.isCurrentSchoolTeacher?"analysis-row-emphasis":""}">
                        <td>${D(n.name)}</td>
                        <td><span class="${o}">${d}</span></td>
                        <td>${_(n.avg)}</td>
                        <td class="${r(n.avgDiff,0)>=0?"positive-percent":"negative-percent"}">${Number.isFinite(Number(n.avgDiff))?H(n.avgDiff):"-"}</td>
                        <td>${I(n.rankAvg)}</td>
                        <td>${L(n.excellentRate)}</td>
                        <td class="${r(n.excDiff,0)>=0?"positive-percent":"negative-percent"}">${Number.isFinite(Number(n.excDiff))?H(Number(n.excDiff)*100,1)+"%":"-"}</td>
                        <td>${I(n.rankExc)}</td>
                        <td>${L(n.passRate)}</td>
                        <td class="${r(n.passDiff,0)>=0?"positive-percent":"negative-percent"}">${Number.isFinite(Number(n.passDiff))?H(Number(n.passDiff)*100,1)+"%":"-"}</td>
                        <td>${I(n.rankPass)}</td>
                        <td>${n.isTeacher&&Number.isFinite(Number(n.fairScore))?_(n.fairScore,1):"-"}</td>
                    </tr>
                `}).join("");return`
                <div class="analysis-generated-panel analysis-compare-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>${p(a.subject)} 同学科县域对标榜</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">教师 + 学校同表</span>
                            <span class="analysis-table-tag">教师与其他学校同学科对标</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">
                        该表把本校教师与县域内其他学校同学科表现放在同一张榜单里，直接查看均分、优秀率、及格率的真实站位。
                    </div>
                    <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                        <table class="common-table analysis-generated-table" style="font-size:13px;">
                            <thead>
                                <tr>
                                    <th>名称</th>
                                    <th>类型</th>
                                    <th>均分</th>
                                    <th>较县均差</th>
                                    <th>均分排</th>
                                    <th>优秀率</th>
                                    <th>较县均差</th>
                                    <th>优率排</th>
                                    <th>及格率</th>
                                    <th>较县均差</th>
                                    <th>及格排</th>
                                    <th>公平绩效</th>
                                </tr>
                            </thead>
                            <tbody>${l}</tbody>
                        </table>
                    </div>
                </div>
            `}).join("")}function jt(){var lt,ot,it;const e=document.getElementById("macroCompareHint"),a=document.getElementById("macroCompareResult"),l=document.getElementById("macroComparePeriodCount"),n=document.getElementById("macroCompareSchool"),d=document.getElementById("macroCompareExam1"),o=document.getElementById("macroCompareExam2"),i=document.getElementById("macroCompareExam3");if(!e||!a||!l||!n||!d||!o||!i)return;const k=parseInt(l.value||"2",10),y=n.value,R=k===3?[d.value,o.value,i.value]:[d.value,o.value];if(!y){J(e,"请先选择学校。","error"),q(a,"尚未生成县域多期对比","请先选择学校后再生成结果。");return}if(R.some(t=>!t)){J(e,"请完整选择所有考试期次。","error"),q(a,"考试期次未选完整","补齐所需期次后，系统会生成县域多期分析。");return}if(new Set(R).size!==R.length){J(e,"期次不能重复，请选择不同考试。","error"),q(a,"期次配置有冲突","请使用不同的考试期次进行对比。");return}const m=R.map(t=>({examId:t,rows:getExamRowsForCompare(t)}));if(m.some(t=>!t.rows.length)){J(e,"某些期次没有可用成绩数据，请检查考试数据。","error"),q(a,"缺少可用成绩数据","至少有一期考试没有可用于县域分析的成绩。");return}const $=m.map(t=>({examId:t.examId,summary:buildSchoolSummaryForExam(t.rows)})),S=m.map(t=>({examId:t.examId,overview:buildSchoolRankOverviewForRows(t.rows)}));if(S.map(t=>({examId:t.examId,entry:getSchoolRankOverviewEntryBySchool(t.overview,y)})).some(t=>!t.entry||!t.entry.total)){J(e,"所选学校在某些期次中无数据，无法对比。","error"),q(a,"学校数据不完整","所选学校在部分考试里没有成绩，当前无法生成连续对比。");return}const h=vt(R,S.map(t=>t.overview),y),u=ft(R,S.map(t=>t.overview),y),E=h.map(t=>`
            <tr>
                <td>${p(t.examId)}</td>
                <td>${t.count}</td>
                <td>${_(t.avg)}</td>
                <td>${I(t.totalRank)}</td>
                <td>${L(t.excRate)}</td>
                <td>${L(t.passRate)}</td>
                <td>${_(t.avgSubjectRank)}</td>
                <td>${p(t.leaderSubjectsText)}</td>
                <td>${p(t.weakSubjectsText)}</td>
            </tr>
        `).join(""),A=u.map(t=>`
            <tr>
                <td>${p(t.examId)}</td>
                <td>${I(t.totalRank)}</td>
                <td>${_(t.avgSubjectRank)}</td>
                <td>${t.leaderCount}</td>
                <td>${p(t.advantageSubjectsText)}</td>
                <td>${p(t.weakSubjectsText)}</td>
                <td>${_(t.gapToTopAvg)}</td>
                <td>${H(t.gapToCountyAvg)}</td>
                <td>${p(t.rankBand)}</td>
            </tr>
        `).join(""),C=$[0].summary,j=$[$.length-1].summary,g=Object.keys(j).map(t=>{const x=getSummaryEntryBySchool(C,t),W=j[t];return!x||!W?null:{school:t,dAvg:Number(W.avg||0)-Number(x.avg||0),dExc:Number(W.excRate||0)-Number(x.excRate||0),dPass:Number(W.passRate||0)-Number(x.passRate||0),dRank:Number(x.rankAvg||0)-Number(W.rankAvg||0)}}).filter(Boolean).sort((t,x)=>Math.abs(x.dAvg)-Math.abs(t.dAvg)),T=g.length?g.map(t=>`
                <tr>
                    <td>${p(t.school)}</td>
                    <td style="font-weight:bold; color:${t.dAvg>=0?"var(--success)":"var(--danger)"};">${H(t.dAvg)}</td>
                    <td>${H(t.dExc*100,1)}%</td>
                    <td>${H(t.dPass*100,1)}%</td>
                    <td style="font-weight:bold; color:${t.dRank>=0?"var(--success)":"var(--danger)"};">${t.dRank>=0?"+":""}${t.dRank}</td>
                </tr>
            `).join(""):'<tr><td colspan="5" style="text-align:center; color:#999;">暂无可比数据</td></tr>',s=((lt=S[S.length-1])==null?void 0:lt.overview)||null,c=((ot=S[0])==null?void 0:ot.overview)||null,b=s?yt(s,c,y):[],O=s?["学校","总分县排","位次变化","总分均分",...s.subjectList,"学科平均排位","榜首学科数","优势学科","短板学科"]:[],B=b.map(t=>[t.school,t.totalRank,t.rankShift,t.avg,...t.subjectRanks,t.avgSubjectRank,t.subjectLeaderCount,t.leaderSubjectsText,t.weakSubjectsText]),v=s?b.map(t=>`
                <tr class="${t.isFocusSchool?"bg-highlight":""}">
                    <td style="font-weight:${t.isFocusSchool?"700":"600"};">${p(t.school)}</td>
                    <td>${I(t.totalRank)}</td>
                    <td style="font-weight:700; color:${Number(t.rankShift)>0?"var(--success)":Number(t.rankShift)<0?"var(--danger)":"#64748b"};">${pt(t.rankShift)}</td>
                    <td>${_(t.avg)}</td>
                    ${t.subjectRanks.map(x=>`<td>${I(x)}</td>`).join("")}
                    <td>${_(t.avgSubjectRank)}</td>
                    <td>${t.subjectLeaderCount}</td>
                    <td>${p(t.leaderSubjectsText)}</td>
                    <td>${p(t.weakSubjectsText)}</td>
                </tr>
            `).join(""):"",N=s?getSchoolRankOverviewEntryBySchool(s,y):null,X=N?`${N.school} 末期总分县排 ${I((it=N.total)==null?void 0:it.rankAvg)}，优势学科：${U(N.leaderSubjects.length?N.leaderSubjects:N.advantageSubjects,"暂无明显领跑学科")}；短板学科：${U(N.weakSubjects,"暂无明显短板学科")}。`:"末期矩阵把镇所有学校与县级所有学校放进同一张表，便于判断本校在完整学校池中的真实位置。",z=s?St(s,y):[],V=["学校","人数","均分","均分县排","优秀率","优秀率排","及格率","及格率排","均分赋分","优率赋分","及格赋分","两率一分总分","总分排位","较县均差"],Y=z.length?z.map(t=>`
                <tr class="${t.isFocusSchool?"bg-highlight":""}">
                    <td style="font-weight:${t.isFocusSchool?"700":"600"};">${p(t.school)}</td>
                    <td>${t.count}</td>
                    <td>${_(t.avg)}</td>
                    <td>${I(t.avgRank)}</td>
                    <td>${L(t.excRate)}</td>
                    <td>${I(t.excRank)}</td>
                    <td>${L(t.passRate)}</td>
                    <td>${I(t.passRank)}</td>
                    <td>${_(t.ratedAvg)}</td>
                    <td>${_(t.ratedExc)}</td>
                    <td>${_(t.ratedPass)}</td>
                    <td style="font-weight:700; color:#b91c1c;">${_(t.score2Rate)}</td>
                    <td>${I(t.scoreRank)}</td>
                    <td class="${r(t.avgDiff,0)>=0?"positive-percent":"negative-percent"}">${Number.isFinite(Number(t.avgDiff))?H(t.avgDiff):"-"}</td>
                </tr>
            `).join(""):"",K=s?Rt(s,y):[],Q=["学科","人数","均分","均分排","较县均差","优秀率","优率排","较县均差","及格率","及格率排","较县均差","榜首学校","距榜首均分"],G=K.length?K.map(t=>`
                <tr>
                    <td style="font-weight:600;">${p(t.subject)}</td>
                    <td>${t.count}</td>
                    <td>${_(t.avg)}</td>
                    <td>${I(t.rankAvg)}</td>
                    <td class="${r(t.avgDiff,0)>=0?"positive-percent":"negative-percent"}">${Number.isFinite(Number(t.avgDiff))?H(t.avgDiff):"-"}</td>
                    <td>${L(t.excRate)}</td>
                    <td>${I(t.rankExc)}</td>
                    <td class="${r(t.excDiff,0)>=0?"positive-percent":"negative-percent"}">${Number.isFinite(Number(t.excDiff))?H(Number(t.excDiff)*100,1)+"%":"-"}</td>
                    <td>${L(t.passRate)}</td>
                    <td>${I(t.rankPass)}</td>
                    <td class="${r(t.passDiff,0)>=0?"positive-percent":"negative-percent"}">${Number.isFinite(Number(t.passDiff))?H(Number(t.passDiff)*100,1)+"%":"-"}</td>
                    <td>${p(t.topSchool||"-")}</td>
                    <td>${_(t.gapToTopAvg)}</td>
                </tr>
            `).join(""):'<tr><td colspan="13" style="text-align:center; color:#94a3b8;">暂无学科画像数据</td></tr>',Z=s?$t(s,y):[],w=Z.map(t=>`
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>${p(t.subject)} 县域横向排名</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${p(t.leaderSchool||"暂无榜首")}</span>
                        <span class="analysis-table-tag">${t.rows.length} 校</span>
                    </span>
                </div>
                <div class="analysis-generated-note">
                    这里展示末期 ${p(t.subject)} 在完整学校池中的横向结果，可直接查看本校与所有学校的同学科位次差。
                </div>
                <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                    <table class="common-table analysis-generated-table" style="font-size:13px;">
                        <thead>
                            <tr>
                                <th>学校</th>
                                <th>人数</th>
                                <th>均分</th>
                                <th>较县均差</th>
                                <th>均分排</th>
                                <th>优秀率</th>
                                <th>较县均差</th>
                                <th>优率排</th>
                                <th>及格率</th>
                                <th>较县均差</th>
                                <th>及格排</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${t.rows.map(x=>`
                                <tr class="${x.isFocusSchool?"bg-highlight":""}">
                                    <td style="font-weight:${x.isFocusSchool?"700":"600"};">${p(x.school)}</td>
                                    <td>${x.count}</td>
                                    <td>${_(x.avg)}</td>
                                    <td class="${r(x.avgDiff,0)>=0?"positive-percent":"negative-percent"}">${Number.isFinite(Number(x.avgDiff))?H(x.avgDiff):"-"}</td>
                                    <td>${I(x.rankAvg)}</td>
                                    <td>${L(x.excRate)}</td>
                                    <td class="${r(x.excDiff,0)>=0?"positive-percent":"negative-percent"}">${Number.isFinite(Number(x.excDiff))?H(Number(x.excDiff)*100,1)+"%":"-"}</td>
                                    <td>${I(x.rankExc)}</td>
                                    <td>${L(x.passRate)}</td>
                                    <td class="${r(x.passDiff,0)>=0?"positive-percent":"negative-percent"}">${Number.isFinite(Number(x.passDiff))?H(Number(x.passDiff)*100,1)+"%":"-"}</td>
                                    <td>${I(x.rankPass)}</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join(""),F=Nt(y),_t=F.summary?[{label:"本校",value:F.school,sub:`${F.summary.recordCount} 条教师学科画像`},{label:"最佳县排",value:Number.isFinite(Number(F.summary.bestRank))?`#${F.summary.bestRank}`:"-",sub:F.summary.bestTeacher||"暂无最佳记录"},{label:"高于本校站位",value:String(F.summary.aheadCount),sub:"教师表现高于本校对应学科站位"},{label:"重点关注",value:String(F.summary.concernCount),sub:"教师表现低于本校对应学科站位"},{label:"平均公平绩效",value:Number.isFinite(Number(F.summary.avgFairScore))?_(F.summary.avgFairScore,1):"-",sub:`${F.summary.riskCount} 条画像提示风险`}]:[],Ft=F.rows.map(t=>{var x,W,rt;return`
            <tr>
                <td style="font-weight:600;">${p(t.teacher)}</td>
                <td>${p(t.subject)}</td>
                <td>${p(t.classes)}</td>
                <td>${t.studentCount}</td>
                <td title="${p(t.sampleDetailText||"")}" style="${t.sampleWarning?"color:#b45309; font-weight:700;":""}">
                    <div>${t.previousSampleCount>0?t.commonSampleCount:"—"}</div>
                    <div style="font-size:11px; color:#64748b;">稳定 ${p(t.previousSampleCount>0?t.sampleStabilityText:"待历史样本")}</div>
                </td>
                <td title="${p(t.sampleDetailText||"")}" style="${t.sampleWarning?"color:#b45309; font-weight:700;":""}">
                    <div>${p(t.sampleChangeText)}</div>
                    <div style="font-size:11px; color:#64748b;">上次 ${t.previousSampleCount}</div>
                </td>
                <td>${_(t.avg)}</td>
                <td>
                    <div style="font-weight:700; color:#0369a1;">${_(t.leagueScoreRaw,1)}</div>
                    <div style="font-size:11px; color:#64748b;">折算 ${_(t.leagueScore,1)} / 100</div>
                </td>
                <td>
                    <div class="${t.baselineAdjustment>=0?"positive-percent":"negative-percent"}" style="font-weight:700;">${et(t.baselineAdjustment,1)}</div>
                    <div style="font-size:11px; color:#64748b;">覆盖 ${p(t.baselineCoverageText)}</div>
                </td>
                <td>${L(t.excellentRate)}</td>
                <td>${L(t.passRate)}</td>
                <td style="${t.lowRate>=.12?"color:#dc2626; font-weight:700;":""}">${L(t.lowRate)}</td>
                <td title="${p(t.conversionSummary||"")}">
                    <div style="font-weight:700; color:#0369a1;">${_(t.conversionScore,1)}${t.conversionAdjustment?` (${et(t.conversionAdjustment,1)})`:""}</div>
                    <div style="font-size:11px; color:#64748b;">${p(t.conversionSummary)}</div>
                </td>
                <td title="${p([`培优: ${at((x=t.focusTargets)==null?void 0:x.excellentEdges,"暂无")}`,`临界: ${at((W=t.focusTargets)==null?void 0:W.passEdges,"暂无")}`,`辅差: ${at((rt=t.focusTargets)==null?void 0:rt.lowRisk,"暂无")}`].join(" | "))}">${p(t.focusSummary)}</td>
                <td style="background:#fffbeb; font-weight:800; color:#b45309;">
                    <div>${_(t.fairScore,1)}</div>
                    <div style="font-size:11px; color:#92400e;">校内同科第 ${p(t.fairRank||"-")}</div>
                </td>
                <td>${I(t.rankAvg)}</td>
                <td>${I(t.rankExc)}</td>
                <td>${I(t.rankPass)}</td>
                <td>${p(t.diagnosis)}</td>
            </tr>
        `}).join(""),It=F.rows.length?`
                <div class="analysis-generated-panel analysis-compare-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>县域版教师教学质量画像</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">${p(F.school)}</span>
                            <span class="analysis-table-tag">教师与其他学校同学科排名对比</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">
                        教师画像基于当前已加载考试和本校任课表，完整展示联考赋分、基线校正、样本稳定、转化分、公平绩效，以及与其他学校同学科的县域排名。
                    </div>
                    ${Ct(_t)}
                    ${Tt(F.cards)}
                    <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                        <table class="common-table analysis-generated-table" style="font-size:13px;">
                            <thead>
                                <tr>
                                    <th>教师</th>
                                    <th>学科</th>
                                    <th>任教班级</th>
                                    <th>人数</th>
                                    <th>共同样本</th>
                                    <th>样本变动</th>
                                    <th>均分</th>
                                    <th>联考赋分</th>
                                    <th>基线校正</th>
                                    <th>优秀率</th>
                                    <th>及格率</th>
                                    <th>低分率</th>
                                    <th>转化分</th>
                                    <th>重点学生</th>
                                    <th>公平绩效</th>
                                    <th>均分县排</th>
                                    <th>优率排</th>
                                    <th>及格率排</th>
                                    <th>对标解读</th>
                                </tr>
                            </thead>
                            <tbody>${Ft}</tbody>
                        </table>
                    </div>
                </div>
                ${At(F.rankingPanels)}
            `:`
                <div class="analysis-generated-panel analysis-compare-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>县域版教师教学质量画像</span>
                    </div>
                    <div class="analysis-empty-state">${p(F.emptyMessage||"暂无教师县域画像数据")}</div>
                </div>
            `,ct=`${R[0]} -> ${R[R.length-1]}`;a.innerHTML=`
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>县域学校多期趋势（${p(y)}）</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${k} 期对比</span>
                        <span class="analysis-table-tag">${p(ct)}</span>
                    </span>
                </div>
                <div class="analysis-generated-note">学校趋势和后续矩阵都按“镇所有学校 + 县级所有学校”的完整学校池计算，不会只看镇内学校。</div>
                <div class="table-wrap analysis-table-shell">
                    <table class="mobile-card-table analysis-generated-table">
                        <thead>
                            <tr>
                                <th>期次</th>
                                <th>人数</th>
                                <th>总分均分</th>
                                <th>总分县排</th>
                                <th>优秀率</th>
                                <th>及格率</th>
                                <th>学科平均排位</th>
                                <th>优势学科</th>
                                <th>短板学科</th>
                            </tr>
                        </thead>
                        <tbody>${E}</tbody>
                    </table>
                </div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>县域竞争结构追踪</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">不使用高分段 / 指标生 / 后三分之一</span>
                    </span>
                </div>
                <div class="analysis-generated-note">改看县排、与榜首差距、较县均差和学科结构，判断学校在完整县域学校池中的真实位置。</div>
                <div class="table-wrap analysis-table-shell">
                    <table class="mobile-card-table analysis-generated-table">
                        <thead>
                            <tr>
                                <th>期次</th>
                                <th>总分县排</th>
                                <th>学科平均排位</th>
                                <th>榜首学科数</th>
                                <th>优势学科</th>
                                <th>短板学科</th>
                                <th>距榜首均分</th>
                                <th>较县均差</th>
                                <th>县域梯队</th>
                            </tr>
                        </thead>
                        <tbody>${A}</tbody>
                    </table>
                </div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>县域版两率一分（横向）总表</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${p(R[R.length-1])}</span>
                        <span class="analysis-table-tag">${z.length} 校</span>
                    </span>
                </div>
                <div class="analysis-generated-note">对齐“联考分析”的横向口径，在县域模块里直接看所有学校的均分、两率一分总分、总排名，以及和县均的差值。</div>
                <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                    <table class="common-table analysis-generated-table" style="font-size:13px;">
                        <thead>
                            <tr>${V.map(t=>`<th>${p(t)}</th>`).join("")}</tr>
                        </thead>
                        <tbody>${Y||`<tr><td colspan="${V.length}" style="text-align:center; color:#94a3b8;">暂无横向总表数据</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>县域版两率一分（横向）学科画像</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${p(y)}</span>
                        <span class="analysis-table-tag">对齐联考分析子模块</span>
                    </span>
                </div>
                <div class="analysis-generated-note">这里专门展开本校各学科在县域内的均分、优秀率、及格率排名，并给出与县均、榜首学校的差距。</div>
                <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                    <table class="common-table analysis-generated-table" style="font-size:13px;">
                        <thead>
                            <tr>${Q.map(t=>`<th>${p(t)}</th>`).join("")}</tr>
                        </thead>
                        <tbody>${G}</tbody>
                    </table>
                </div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>所有学校首末期变化</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${p(ct)}</span>
                        <span class="analysis-table-tag">覆盖镇所有学校 + 县级所有学校</span>
                    </span>
                </div>
                <div class="analysis-generated-note">查看本校与其他所有学校是同步拉开还是缩小差距，辅助判断变化是个体波动还是整体波动。</div>
                <div class="table-wrap analysis-table-shell">
                    <table class="mobile-card-table analysis-generated-table">
                        <thead>
                            <tr>
                                <th>学校</th>
                                <th>均分变化</th>
                                <th>优秀率变化</th>
                                <th>及格率变化</th>
                                <th>排位变化</th>
                            </tr>
                        </thead>
                        <tbody>${T}</tbody>
                    </table>
                </div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>所有学校总排与学科排位矩阵（末期）</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${p(R[R.length-1])}</span>
                        <span class="analysis-table-tag">${b.length} 校</span>
                    </span>
                </div>
                <div class="analysis-generated-note">${p(X)}</div>
                <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                    <table class="common-table analysis-generated-table" style="font-size:13px;">
                        <thead>
                            <tr>${O.map(t=>`<th>${p(t)}</th>`).join("")}</tr>
                        </thead>
                        <tbody>${v||`<tr><td colspan="${O.length||1}" style="text-align:center; color:#94a3b8;">暂无末期排名数据</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
            ${w}
            ${It}
        `,J(e,`已完成 ${k} 期县域对比：${R.join(" -> ")}`,"success"),dt({school:y,examIds:R,periodCount:k,summaryByExam:$,overviewByExam:S,allSchoolsChange:g,countyInsightRows:u,schoolTrendRows:h,latestRankMatrix:b,rankMatrixHeaders:O,rankMatrixRows:B,countyHorizontalHeaders:V,countyHorizontalRows:z,countySubjectPortraitHeaders:Q,countySubjectPortraitRows:K,countySubjectSchoolTables:Z,teacherCountyRows:F.rows,teacherCountyCards:F.cards,teacherCountySummary:F.summary,teacherCountyRankingPanels:F.rankingPanels,teacherCountyMessage:F.emptyMessage||"",html:a.innerHTML})}function Et(){const e=ut();if(!e)return alert("请先生成县域多期对比结果");const{school:a,examIds:l,allSchoolsChange:n=[],countyInsightRows:d=[],schoolTrendRows:o=[],rankMatrixHeaders:i=[],rankMatrixRows:k=[],countyHorizontalHeaders:y=[],countyHorizontalRows:R=[],countySubjectPortraitHeaders:m=[],countySubjectPortraitRows:$=[],countySubjectSchoolTables:S=[],teacherCountyRows:P=[],teacherCountyRankingPanels:h=[]}=e,u=XLSX.utils.book_new(),E=typeof window.buildSafeSheetName=="function"?window.buildSafeSheetName:((s,c="")=>`${c}${s}`.slice(0,31)),A=[["学校","期次","人数","总分均分","总分县排","优秀率","及格率","学科平均排位","优势学科","短板学科"]];o.forEach(s=>{A.push([a,s.examId,s.count,s.avg,s.totalRank,s.excRate,s.passRate,s.avgSubjectRank,s.leaderSubjectsText,s.weakSubjectsText])}),XLSX.utils.book_append_sheet(u,XLSX.utils.aoa_to_sheet(A),"指定学校多期");const C=l[0],j=l[l.length-1],g=[["学校",`${C}->${j}均分变化`,`${C}->${j}优秀率变化`,`${C}->${j}及格率变化`,`${C}->${j}排位变化`]];n.forEach(s=>g.push([s.school,s.dAvg,s.dExc,s.dPass,s.dRank])),XLSX.utils.book_append_sheet(u,XLSX.utils.aoa_to_sheet(g),"所有学校首末变化");const T=[["期次","总分县排","学科平均排位","榜首学科数","优势学科","短板学科","距榜首均分","较县均差","县域梯队"]];if(d.forEach(s=>{T.push([s.examId,s.totalRank,s.avgSubjectRank,s.leaderCount,s.advantageSubjectsText,s.weakSubjectsText,s.gapToTopAvg,s.gapToCountyAvg,s.rankBand])}),XLSX.utils.book_append_sheet(u,XLSX.utils.aoa_to_sheet(T),"县域结构追踪"),y.length&&R.length){const s=[y];R.forEach(c=>{s.push([c.school,c.count,c.avg,c.avgRank,c.excRate,c.excRank,c.passRate,c.passRank,c.ratedAvg,c.ratedExc,c.ratedPass,c.score2Rate,c.scoreRank,c.avgDiff])}),XLSX.utils.book_append_sheet(u,XLSX.utils.aoa_to_sheet(s),"县域横向总表")}if(m.length&&$.length){const s=[m];$.forEach(c=>{s.push([c.subject,c.count,c.avg,c.rankAvg,c.avgDiff,c.excRate,c.rankExc,c.excDiff,c.passRate,c.rankPass,c.passDiff,c.topSchool,c.gapToTopAvg])}),XLSX.utils.book_append_sheet(u,XLSX.utils.aoa_to_sheet(s),"学科画像")}if(i.length&&k.length&&XLSX.utils.book_append_sheet(u,XLSX.utils.aoa_to_sheet([i,...k]),"学校排名矩阵"),S.forEach(s=>{const c=[["学校","人数","均分","较县均差","均分排","优秀率","较县均差","优率排","及格率","较县均差","及格率排"]];s.rows.forEach(b=>{c.push([b.school,b.count,b.avg,b.avgDiff,b.rankAvg,b.excRate,b.excDiff,b.rankExc,b.passRate,b.passDiff,b.rankPass])}),XLSX.utils.book_append_sheet(u,XLSX.utils.aoa_to_sheet(c),E(s.subject,"横向_"))}),P.length){const s=[["教师","学科","任教班级","人数","共同样本","样本变动","均分","较县均差","联考赋分","联考赋分(折算100)","基线校正","优秀率","及格率","低分率","转化分","重点学生","公平绩效","校内同科排名","均分县排","优率排","及格率排","对标解读"]];P.forEach(c=>{const b=Number.isFinite(Number(c.countyAvg))?Number(c.avg)-Number(c.countyAvg):null;s.push([c.teacher,c.subject,c.classes,c.studentCount,c.commonSampleCount,c.sampleChangeText,c.avg,b,c.leagueScoreRaw,c.leagueScore,c.baselineAdjustment,c.excellentRate,c.passRate,c.lowRate,c.conversionScore,c.focusSummary,c.fairScore,c.fairRank,c.rankAvg,c.rankExc,c.rankPass,c.diagnosis])}),XLSX.utils.book_append_sheet(u,XLSX.utils.aoa_to_sheet(s),"教师县域画像")}h.forEach(s=>{const c=[["名称","类型","均分","较县均差","均分排","优秀率","较县均差","优率排","及格率","较县均差","及格率排","公平绩效"]];s.rows.forEach(b=>{c.push([b.name,b.type,b.avg,b.avgDiff,b.rankAvg,b.excellentRate,b.excDiff,b.rankExc,b.passRate,b.passDiff,b.rankPass,b.fairScore])}),XLSX.utils.book_append_sheet(u,XLSX.utils.aoa_to_sheet(c),E(s.subject,"教师县排_"))}),XLSX.writeFile(u,`县域多期对比_${a}_${l.join("_")}.xlsx`)}Object.assign(window,{renderMacroMultiPeriodComparison:jt,exportMacroMultiPeriodComparison:Et}),window.__MACRO_COMPARE_RESULT_RUNTIME_PATCHED__=!0})();
