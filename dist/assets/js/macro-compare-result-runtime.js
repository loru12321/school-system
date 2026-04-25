(()=>{if(typeof window=="undefined"||window.__MACRO_COMPARE_RESULT_RUNTIME_PATCHED__)return;const W=typeof window.readMacroCompareCacheState=="function"?window.readMacroCompareCacheState:(()=>window.MACRO_MULTI_PERIOD_COMPARE_CACHE&&typeof window.MACRO_MULTI_PERIOD_COMPARE_CACHE=="object"?window.MACRO_MULTI_PERIOD_COMPARE_CACHE:null),q=typeof window.setMacroCompareCacheState=="function"?window.setMacroCompareCacheState:(e=>{const n=e&&typeof e=="object"&&!Array.isArray(e)?e:null;return window.MACRO_MULTI_PERIOD_COMPARE_CACHE=n,n});function I(e,n,s="idle"){e&&(e.textContent=n,e.className=`analysis-hint analysis-status-text${s==="success"?" is-success":s==="error"?" is-error":""}`)}function D(e,n,s){e&&(e.innerHTML=`<div class="analysis-empty-state analysis-empty-state-compact"><strong>${n}</strong>${s}</div>`)}function u(e){return String(e!=null?e:"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function T(e){const n=Number(e);return Number.isFinite(n)?`#${n}`:"-"}function Q(e){const n=Number(e);return!Number.isFinite(n)||n===0?"0":`${n>0?"+":""}${n}`}function U(e,n=2){const s=Number(e);return Number.isFinite(s)?`${s>0?"+":""}${s.toFixed(n)}`:"-"}function L(e,n=2){const s=Number(e);return Number.isFinite(s)?s.toFixed(n):"-"}function F(e,n){const s=Array.isArray(e)?e.map(g=>String(g||"").trim()).filter(Boolean):[];return s.length?s.slice(0,3).join("、"):n}function Z(e,n){const s=Number(e),g=Number(n);if(!Number.isFinite(s)||!Number.isFinite(g)||g<=0)return"-";const R=s/g;return R<=.2?"前列":R<=.5?"中上":R<=.8?"中段":"后段"}function w(){const e=Object.keys(SCHOOLS||{});return e.length?typeof resolveSchoolNameFromCollection=="function"&&resolveSchoolNameFromCollection(e,MY_SCHOOL)||String(MY_SCHOOL||"").trim():""}function tt(e,n,s){return e.map((g,R)=>{const i=n[R],r=getSchoolRankOverviewEntryBySchool(i,s);return!r||!r.total?null:{examId:g,count:r.total.count,avg:r.total.avg,excRate:r.total.excRate,passRate:r.total.passRate,totalRank:r.total.rankAvg,avgSubjectRank:r.avgSubjectRank,leaderSubjectsText:F(r.leaderSubjects.length?r.leaderSubjects:r.advantageSubjects,"暂无明显领跑学科"),weakSubjectsText:F(r.weakSubjects,"暂无明显短板学科")}}).filter(Boolean)}function et(e,n,s){return e.map((g,R)=>{var A;const i=n[R],r=getSchoolRankOverviewEntryBySchool(i,s);if(!i||!r||!r.total)return null;const C=Array.isArray(i.schools)?i.schools:[],d=C[0]||null,c=C.length,y=C.length?C.reduce((_,o)=>{var b;return _+Number(((b=o.total)==null?void 0:b.avg)||0)},0)/C.length:null,f=d&&Number.isFinite(Number((A=d.total)==null?void 0:A.avg))?Number(d.total.avg)-Number(r.total.avg||0):null,p=Number.isFinite(Number(y))?Number(r.total.avg||0)-Number(y):null;return{examId:g,totalRank:r.total.rankAvg,avgSubjectRank:r.avgSubjectRank,leaderCount:r.subjectLeaderCount||0,advantageSubjectsText:F(r.advantageSubjects,"暂无明显优势学科"),weakSubjectsText:F(r.weakSubjects,"暂无明显短板学科"),gapToTopAvg:f,gapToCountyAvg:p,rankBand:Z(r.total.rankAvg,c)}}).filter(Boolean)}function at(e,n,s){const g=getSchoolRankOverviewEntryBySchool(e,s),R=(g==null?void 0:g.school)||String(s||"").trim();return((e==null?void 0:e.schools)||[]).map(i=>{var d,c,y,f,p,A;const r=n?getSchoolRankOverviewEntryBySchool(n,i.school):null,C=Number.isFinite(Number((d=r==null?void 0:r.total)==null?void 0:d.rankAvg))&&Number.isFinite(Number((c=i.total)==null?void 0:c.rankAvg))?Number(r.total.rankAvg)-Number(i.total.rankAvg):null;return{school:i.school,totalRank:(f=(y=i.total)==null?void 0:y.rankAvg)!=null?f:null,rankShift:C,avg:(A=(p=i.total)==null?void 0:p.avg)!=null?A:0,avgSubjectRank:i.avgSubjectRank,subjectLeaderCount:i.subjectLeaderCount||0,leaderSubjectsText:F(i.leaderSubjects.length?i.leaderSubjects:i.advantageSubjects,"较均衡"),weakSubjectsText:F(i.weakSubjects,"暂无明显短板"),subjectRanks:((e==null?void 0:e.subjectList)||[]).map(_=>{var o,b;return(b=(o=i.subjects[_])==null?void 0:o.rankAvg)!=null?b:""}),isFocusSchool:i.school===R}})}function st(e){var o,b,B;const n=Object.keys(SCHOOLS||{}),s=typeof resolveSchoolNameFromCollection=="function"&&resolveSchoolNameFromCollection(n,e)||String(e||"").trim(),g=w(),R=[String(CURRENT_EXAM_ID||"current"),s,g,Array.isArray(RAW_DATA)?RAW_DATA.length:0,Object.keys(TEACHER_MAP||{}).length].join("|");if(((o=window.__COUNTY_TEACHER_BRIDGE_CACHE__)==null?void 0:o.key)===R)return window.__COUNTY_TEACHER_BRIDGE_CACHE__.data;if(!s||!(SCHOOLS!=null&&SCHOOLS[s]))return{school:s,rows:[],summary:null,emptyMessage:"当前学校未找到，无法生成教师同学科对比。"};if(!g||s!==g)return{school:s,rows:[],summary:null,emptyMessage:"教师对标基于当前已加载本校任课表，请选择本校查看。"};if(!Object.keys(TEACHER_MAP||{}).length)return{school:s,rows:[],summary:null,emptyMessage:"当前还没有导入任课表，暂时无法生成教师同学科对比。"};const i=Array.isArray((b=SCHOOLS[s])==null?void 0:b.students)?SCHOOLS[s].students:[];if(!i.length)return{school:s,rows:[],summary:null,emptyMessage:"当前本校没有可用于教师对标的学生数据。"};const r=typeof normalizeSubject=="function"?normalizeSubject:(l=>String(l||"").trim()),C=typeof normalizeClass=="function"?normalizeClass:(l=>String(l||"").trim()),d={};i.forEach(l=>{const m=C((l==null?void 0:l.class)||"");m&&(d[m]||(d[m]=[]),d[m].push(l))});const c={};Object.entries(TEACHER_MAP||{}).forEach(([l,m])=>{var M;const v=String(m||"").trim();if(!v)return;const E=String(l||"").split("_");if(E.length<2)return;const j=E.shift(),H=E.join("_"),a=C(j),h=(SUBJECTS||[]).find($=>r($)===r(H));if(!a||!h||!((M=d[a])!=null&&M.length))return;const N=`${v}__${h}`;c[N]||(c[N]={teacher:v,subject:h,classes:new Set,students:[]}),c[N].classes.add(a),c[N].students.push(...d[a])});const y=Object.values(c).map(l=>{var X,S,Y,z;const m=l.students.map(k=>{var O;return Number((O=k==null?void 0:k.scores)==null?void 0:O[l.subject])}).filter(k=>Number.isFinite(k));if(!m.length)return null;const v=(THRESHOLDS==null?void 0:THRESHOLDS[l.subject])||{},E=Number.isFinite(Number(v.exc))?Number(v.exc):85,j=Number.isFinite(Number(v.pass))?Number(v.pass):60,H=m.reduce((k,O)=>k+O,0)/m.length,a=m.filter(k=>k>=E).length/m.length,h=m.filter(k=>k>=j).length/m.length,N=Number((z=(Y=(S=(X=SCHOOLS[s])==null?void 0:X.rankings)==null?void 0:S[l.subject])==null?void 0:Y.avg)!=null?z:NaN),M=Object.values(SCHOOLS||{}).map(k=>{var O;return(O=k==null?void 0:k.metrics)==null?void 0:O[l.subject]}).filter(Boolean),$=M.length?M.reduce((k,O)=>k+Number(O.avg||0),0)/M.length:null;return{teacher:l.teacher,subject:l.subject,classes:Array.from(l.classes).sort().join("、"),studentCount:m.length,avg:H,excRate:a,passRate:h,countyAvg:$,schoolSubjectRank:N,rankAvg:null,rankExc:null,rankPass:null,schoolRankDelta:null,diagnosis:""}}).filter(Boolean),f={};y.forEach(l=>{f[l.subject]||(f[l.subject]=[]),f[l.subject].push(l)}),Object.entries(f).forEach(([l,m])=>{const v=[...m.map(a=>({key:`teacher:${a.teacher}`,avg:a.avg,excRate:a.excRate,passRate:a.passRate})),...Object.entries(SCHOOLS||{}).filter(([a,h])=>{var N;return a!==s&&((N=h==null?void 0:h.metrics)==null?void 0:N[l])}).map(([a,h])=>({key:`school:${a}`,avg:Number(h.metrics[l].avg||0),excRate:Number(h.metrics[l].excRate||0),passRate:Number(h.metrics[l].passRate||0)}))],E=typeof buildCompetitionRankMap=="function"?buildCompetitionRankMap(v,a=>a.key,a=>a.avg):new Map,j=typeof buildCompetitionRankMap=="function"?buildCompetitionRankMap(v,a=>a.key,a=>a.excRate):new Map,H=typeof buildCompetitionRankMap=="function"?buildCompetitionRankMap(v,a=>a.key,a=>a.passRate):new Map;m.forEach(a=>{var N,M,$;a.rankAvg=(N=E.get(`teacher:${a.teacher}`))!=null?N:null,a.rankExc=(M=j.get(`teacher:${a.teacher}`))!=null?M:null,a.rankPass=($=H.get(`teacher:${a.teacher}`))!=null?$:null,a.schoolRankDelta=Number.isFinite(a.schoolSubjectRank)&&Number.isFinite(Number(a.rankAvg))?Number(a.schoolSubjectRank)-Number(a.rankAvg):null;const h=[];Number.isFinite(Number(a.rankAvg))&&Number(a.rankAvg)<=Math.min(3,v.length)&&h.push("县域前列"),Number.isFinite(Number(a.schoolRankDelta))&&Number(a.schoolRankDelta)>=2?h.push(`高于本校学科站位${a.schoolRankDelta}名`):Number.isFinite(Number(a.schoolRankDelta))&&Number(a.schoolRankDelta)<=-2?h.push(`低于本校学科站位${Math.abs(a.schoolRankDelta)}名`):Number.isFinite(Number(a.schoolRankDelta))&&h.push("与本校学科站位接近"),h.length||h.push("待结合课堂与班级结构复核"),a.diagnosis=h.join("；")})}),y.sort((l,m)=>{const v=Number(l.rankAvg||Number.POSITIVE_INFINITY)-Number(m.rankAvg||Number.POSITIVE_INFINITY);if(v!==0)return v;const E=Number(m.avg||0)-Number(l.avg||0);return E!==0?E:String(l.teacher||"").localeCompare(String(m.teacher||""),"zh-CN")});const p=y[0]||null,A={recordCount:y.length,bestRank:(B=p==null?void 0:p.rankAvg)!=null?B:null,aheadCount:y.filter(l=>Number.isFinite(Number(l.schoolRankDelta))&&Number(l.schoolRankDelta)>=1).length,concernCount:y.filter(l=>Number.isFinite(Number(l.schoolRankDelta))&&Number(l.schoolRankDelta)<=-1).length},_={school:s,rows:y,summary:A,emptyMessage:""};return window.__COUNTY_TEACHER_BRIDGE_CACHE__={key:R,data:_},_}function nt(){var G,J,K;const e=document.getElementById("macroCompareHint"),n=document.getElementById("macroCompareResult"),s=document.getElementById("macroComparePeriodCount"),g=document.getElementById("macroCompareSchool"),R=document.getElementById("macroCompareExam1"),i=document.getElementById("macroCompareExam2"),r=document.getElementById("macroCompareExam3");if(!e||!n||!s||!g||!R||!i||!r)return;const C=parseInt(s.value||"2",10),d=g.value,c=C===3?[R.value,i.value,r.value]:[R.value,i.value];if(!d){I(e,"请先选择学校。","error"),D(n,"尚未生成县域多期对比","请先选择学校后再生成结果。");return}if(c.some(t=>!t)){I(e,"请完整选择所有考试期次。","error"),D(n,"考试期次未选完整","补齐所需期次后，系统会生成县域多期分析。");return}if(new Set(c).size!==c.length){I(e,"期次不能重复，请选择不同考试。","error"),D(n,"期次配置有冲突","请使用不同的考试期次进行对比。");return}const y=c.map(t=>({examId:t,rows:getExamRowsForCompare(t)}));if(y.some(t=>!t.rows.length)){I(e,"某些期次没有可用成绩数据，请检查考试数据。","error"),D(n,"缺少可用成绩数据","至少有一期考试没有可用于县域分析的成绩。");return}const f=y.map(t=>({examId:t.examId,summary:buildSchoolSummaryForExam(t.rows)})),p=y.map(t=>({examId:t.examId,overview:buildSchoolRankOverviewForRows(t.rows)}));if(p.map(t=>({examId:t.examId,entry:getSchoolRankOverviewEntryBySchool(t.overview,d)})).some(t=>!t.entry||!t.entry.total)){I(e,"所选学校在某些期次中无数据，无法对比。","error"),D(n,"学校数据不完整","所选学校在部分考试里没有成绩，当前无法生成连续对比。");return}const _=tt(c,p.map(t=>t.overview),d),o=et(c,p.map(t=>t.overview),d),b=_.map(t=>`
            <tr>
                <td>${u(t.examId)}</td>
                <td>${t.count}</td>
                <td>${L(t.avg)}</td>
                <td>${T(t.totalRank)}</td>
                <td>${(Number(t.excRate||0)*100).toFixed(1)}%</td>
                <td>${(Number(t.passRate||0)*100).toFixed(1)}%</td>
                <td>${L(t.avgSubjectRank)}</td>
                <td>${u(t.leaderSubjectsText)}</td>
                <td>${u(t.weakSubjectsText)}</td>
            </tr>
        `).join(""),B=o.map(t=>`
            <tr>
                <td>${u(t.examId)}</td>
                <td>${T(t.totalRank)}</td>
                <td>${L(t.avgSubjectRank)}</td>
                <td>${t.leaderCount}</td>
                <td>${u(t.advantageSubjectsText)}</td>
                <td>${u(t.weakSubjectsText)}</td>
                <td>${L(t.gapToTopAvg)}</td>
                <td>${U(t.gapToCountyAvg)}</td>
                <td>${u(t.rankBand)}</td>
            </tr>
        `).join(""),l=f[0].summary,m=f[f.length-1].summary,v=Object.keys(m).map(t=>{const x=getSummaryEntryBySchool(l,t),P=m[t];return!x||!P?null:{school:t,dAvg:Number(P.avg||0)-Number(x.avg||0),dExc:Number(P.excRate||0)-Number(x.excRate||0),dPass:Number(P.passRate||0)-Number(x.passRate||0),dRank:Number(x.rankAvg||0)-Number(P.rankAvg||0)}}).filter(Boolean).sort((t,x)=>Math.abs(x.dAvg)-Math.abs(t.dAvg)),E=v.length?v.map(t=>`
                <tr>
                    <td>${u(t.school)}</td>
                    <td style="font-weight:bold; color:${t.dAvg>=0?"var(--success)":"var(--danger)"};">${U(t.dAvg)}</td>
                    <td>${t.dExc>=0?"+":""}${(t.dExc*100).toFixed(1)}%</td>
                    <td>${t.dPass>=0?"+":""}${(t.dPass*100).toFixed(1)}%</td>
                    <td style="font-weight:bold; color:${t.dRank>=0?"var(--success)":"var(--danger)"};">${t.dRank>=0?"+":""}${t.dRank}</td>
                </tr>
            `).join(""):'<tr><td colspan="5" style="text-align:center; color:#999;">暂无可比数据</td></tr>',j=((G=p[p.length-1])==null?void 0:G.overview)||null,H=((J=p[0])==null?void 0:J.overview)||null,a=j?at(j,H,d):[],h=j?["学校","总分县排","位次变化","总分均分",...j.subjectList,"学科平均排位","榜首学科数","优势学科","短板学科"]:[],N=a.map(t=>[t.school,t.totalRank,t.rankShift,t.avg,...t.subjectRanks,t.avgSubjectRank,t.subjectLeaderCount,t.leaderSubjectsText,t.weakSubjectsText]),M=j?a.map(t=>`
                <tr class="${t.isFocusSchool?"bg-highlight":""}">
                    <td style="font-weight:${t.isFocusSchool?"700":"600"};">${u(t.school)}</td>
                    <td>${T(t.totalRank)}</td>
                    <td style="font-weight:700; color:${Number(t.rankShift)>0?"var(--success)":Number(t.rankShift)<0?"var(--danger)":"#64748b"};">${Q(t.rankShift)}</td>
                    <td>${L(t.avg)}</td>
                    ${t.subjectRanks.map(x=>`<td>${T(x)}</td>`).join("")}
                    <td>${L(t.avgSubjectRank)}</td>
                    <td>${t.subjectLeaderCount}</td>
                    <td>${u(t.leaderSubjectsText)}</td>
                    <td>${u(t.weakSubjectsText)}</td>
                </tr>
            `).join(""):"",$=j?getSchoolRankOverviewEntryBySchool(j,d):null,X=$?`${$.school} 末期总分县排 ${T((K=$.total)==null?void 0:K.rankAvg)}，优势学科：${F($.leaderSubjects.length?$.leaderSubjects:$.advantageSubjects,"暂无明显领跑学科")}；短板学科：${F($.weakSubjects,"暂无明显短板学科")}。`:"末期矩阵会把镇所有学校与县级所有学校一起纳入同一张表，便于判断本校在完整学校池中的位置。",S=st(d),z=(S.summary?[{label:"本校",value:S.school,sub:`${S.summary.recordCount} 条教师学科记录`},{label:"最佳县排",value:Number.isFinite(Number(S.summary.bestRank))?`#${S.summary.bestRank}`:"-",sub:S.rows[0]?`${S.rows[0].teacher} · ${S.rows[0].subject}`:"暂无最佳记录"},{label:"高于本校学科站位",value:String(S.summary.aheadCount),sub:"说明教师表现高于学校同科站位"},{label:"需要重点关注",value:String(S.summary.concernCount),sub:"说明教师表现低于学校同科站位"}]:[]).map(t=>`
            <div style="padding:14px 16px; border:1px solid #e2e8f0; border-radius:14px; background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);">
                <div style="font-size:12px; color:#64748b; margin-bottom:6px;">${u(t.label)}</div>
                <div style="font-size:20px; font-weight:800; color:#0f172a;">${u(t.value)}</div>
                <div style="font-size:12px; color:#475569; margin-top:6px;">${u(t.sub)}</div>
            </div>
        `).join(""),k=S.rows.map(t=>{const x=Number.isFinite(Number(t.countyAvg))?Number(t.avg)-Number(t.countyAvg):null;return`
                <tr>
                    <td style="font-weight:600;">${u(t.teacher)}</td>
                    <td>${u(t.subject)}</td>
                    <td>${u(t.classes)}</td>
                    <td>${t.studentCount}</td>
                    <td>${L(t.avg)}</td>
                    <td class="${Number(x)>=0?"positive-percent":"negative-percent"}">${Number.isFinite(Number(x))?U(x):"-"}</td>
                    <td>${T(t.rankAvg)}</td>
                    <td>${T(t.rankExc)}</td>
                    <td>${T(t.rankPass)}</td>
                    <td>${u(t.diagnosis)}</td>
                </tr>
            `}).join(""),O=S.rows.length?`
                <div class="analysis-generated-panel analysis-compare-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>教师与其他学校同学科排名对比</span>
                        <span class="analysis-generated-meta">
                            <span class="analysis-table-tag">${u(S.school)}</span>
                            <span class="analysis-table-tag">覆盖镇所有学校 + 县级所有学校</span>
                        </span>
                    </div>
                    <div class="analysis-generated-note">教师对标基于当前已加载考试和本校任课表，把本校教师直接放到全学校池同学科里比较均分、优秀率和及格率排名。</div>
                    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px; margin:14px 0 16px 0;">
                        ${z}
                    </div>
                    <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                        <table class="common-table analysis-generated-table" style="font-size:13px;">
                            <thead>
                                <tr>
                                    <th>教师</th>
                                    <th>学科</th>
                                    <th>班级</th>
                                    <th>学生数</th>
                                    <th>均分</th>
                                    <th>较县均差</th>
                                    <th>均分排名</th>
                                    <th>优秀率排名</th>
                                    <th>及格率排名</th>
                                    <th>诊断</th>
                                </tr>
                            </thead>
                            <tbody>${k}</tbody>
                        </table>
                    </div>
                </div>
            `:`
                <div class="analysis-generated-panel analysis-compare-panel">
                    <div class="sub-header analysis-section-head analysis-generated-header">
                        <span>教师与其他学校同学科排名对比</span>
                    </div>
                    <div class="analysis-empty-state">${u(S.emptyMessage||"暂无教师同学科对比数据")}</div>
                </div>
            `,V=`${c[0]} → ${c[c.length-1]}`;n.innerHTML=`
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>县域学校多期趋势（${u(d)}）</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${C} 期对比</span>
                        <span class="analysis-table-tag">${u(V)}</span>
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
                        <tbody>${b}</tbody>
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
                        <tbody>${B}</tbody>
                    </table>
                </div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>所有学校首末期变化</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${u(V)}</span>
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
                        <tbody>${E}</tbody>
                    </table>
                </div>
            </div>
            <div class="analysis-generated-panel analysis-compare-panel">
                <div class="sub-header analysis-section-head analysis-generated-header">
                    <span>所有学校总排与学科排位矩阵（末期）</span>
                    <span class="analysis-generated-meta">
                        <span class="analysis-table-tag">${u(c[c.length-1])}</span>
                        <span class="analysis-table-tag">${a.length} 校</span>
                    </span>
                </div>
                <div class="analysis-generated-note">${u(X)}</div>
                <div class="table-wrap analysis-table-shell analysis-scroll-shell">
                    <table class="common-table analysis-generated-table" style="font-size:13px;">
                        <thead>
                            <tr>${h.map(t=>`<th>${u(t)}</th>`).join("")}</tr>
                        </thead>
                        <tbody>${M||`<tr><td colspan="${h.length||1}" style="text-align:center; color:#94a3b8;">暂无末期排名数据</td></tr>`}</tbody>
                    </table>
                </div>
            </div>
            ${O}
        `,I(e,`已完成 ${C} 期县域对比：${c.join(" → ")}`,"success"),q({school:d,examIds:c,periodCount:C,summaryByExam:f,overviewByExam:p,allSchoolsChange:v,countyInsightRows:o,schoolTrendRows:_,latestRankMatrix:a,rankMatrixHeaders:h,rankMatrixRows:N,teacherCountyRows:S.rows,teacherCountySummary:S.summary,teacherCountyMessage:S.emptyMessage||"",html:n.innerHTML})}function lt(){const e=W();if(!e)return alert("请先生成县域多期对比结果");const{school:n,examIds:s,allSchoolsChange:g=[],countyInsightRows:R=[],schoolTrendRows:i=[],rankMatrixHeaders:r=[],rankMatrixRows:C=[],teacherCountyRows:d=[]}=e,c=XLSX.utils.book_new(),y=[["学校","期次","人数","总分均分","总分县排","优秀率","及格率","学科平均排位","优势学科","短板学科"]];i.forEach(o=>{y.push([n,o.examId,o.count,o.avg,o.totalRank,o.excRate,o.passRate,o.avgSubjectRank,o.leaderSubjectsText,o.weakSubjectsText])}),XLSX.utils.book_append_sheet(c,XLSX.utils.aoa_to_sheet(y),"指定学校多期");const f=s[0],p=s[s.length-1],A=[["学校",`${f}→${p}均分变化`,`${f}→${p}优秀率变化`,`${f}→${p}及格率变化`,`${f}→${p}排位变化`]];g.forEach(o=>A.push([o.school,o.dAvg,o.dExc,o.dPass,o.dRank])),XLSX.utils.book_append_sheet(c,XLSX.utils.aoa_to_sheet(A),"所有学校首末期变化");const _=[["期次","总分县排","学科平均排位","榜首学科数","优势学科","短板学科","距榜首均分","较县均差","县域梯队"]];if(R.forEach(o=>{_.push([o.examId,o.totalRank,o.avgSubjectRank,o.leaderCount,o.advantageSubjectsText,o.weakSubjectsText,o.gapToTopAvg,o.gapToCountyAvg,o.rankBand])}),XLSX.utils.book_append_sheet(c,XLSX.utils.aoa_to_sheet(_),"县域结构追踪"),r.length&&C.length&&XLSX.utils.book_append_sheet(c,XLSX.utils.aoa_to_sheet([r,...C]),"所有学校排名矩阵"),d.length){const o=[["教师","学科","班级","学生数","均分","较县均差","均分排名","优秀率排名","及格率排名","诊断"]];d.forEach(b=>{const B=Number.isFinite(Number(b.countyAvg))?Number(b.avg)-Number(b.countyAvg):null;o.push([b.teacher,b.subject,b.classes,b.studentCount,b.avg,B,b.rankAvg,b.rankExc,b.rankPass,b.diagnosis])}),XLSX.utils.book_append_sheet(c,XLSX.utils.aoa_to_sheet(o),"教师同学科对比")}XLSX.writeFile(c,`县域多期对比_${n}_${s.join("_")}.xlsx`)}Object.assign(window,{renderMacroMultiPeriodComparison:nt,exportMacroMultiPeriodComparison:lt}),window.__MACRO_COMPARE_RESULT_RUNTIME_PATCHED__=!0})();
