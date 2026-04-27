(()=>{if(typeof window=="undefined"||window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__)return;const tt="COUNTY_ANALYSIS_SCOPE_V1",V="COUNTY_ANALYSIS_HISTORY_V1",m={promptArmed:!1,lastSignature:"",teacherContextPromise:null,lastTeacherContextSignature:"",lastTeacherContextAt:0,subjectRowCacheSignature:"",subjectRowCache:new Map,preUploadTownshipSchools:[],isRendering:!1,lastRankSignature:""},et={"county-teacher-portrait":{title:"县域教师画像",badge:"教师县域排名",description:"对照“教师教学质量画像”，把本校教师放到县域所有学校同学科样本中排名，查看学科教师县域站位。"},"county-school-horizontal":{title:"县域学校横向分析",badge:"全县横向对比",description:"对照“两率一分(横向)”，生成五科总综合分析表和各学科明细表，按县域所有学校统一排名。"}},me=["语文","数学","英语","物理","化学","政治"],nt=["语文","数学","英语","物理","化学","历史","地理","生物","政治"];function S(t){return String(t!=null?t:"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function y(t,e=0){const n=Number(t);return Number.isFinite(n)?n:e}function x(t,e,n){if(window.RankingDataService&&typeof window.RankingDataService.assignCompetitionRanks=="function")return window.RankingDataService.assignCompetitionRanks(t,e,n);const r=Array.isArray(t)?t.slice():[];r.sort((o,s)=>Number(e(s)||0)-Number(e(o)||0));let i=null,a=0;return r.forEach((o,s)=>{const u=Number(e(o)),c=i!==null&&Math.abs(u-i)<1e-4?a:s+1;n(o,c),i=u,a=c}),r}function g(t,e=2){const n=Number(t);return Number.isFinite(n)?n.toFixed(e):"-"}function R(t){const e=Number(t);return Number.isFinite(e)?`${(e*100).toFixed(1)}%`:"-"}function ge(t,e,n=!1){const r=Number(t),i=Number.isFinite(r)?n?`${(r*100).toFixed(2)}%`:r.toFixed(2):"-",a=e?` <span style="font-size:0.9em; color:#94a3b8">(${e})</span>`:"";return`${i}${a}`}function J(t){const e=String(t||"").trim();return typeof window.normalizeSubject=="function"?window.normalizeSubject(e):e.replace(/\s+/g,"")}function Se(){var r,i,a;const t=typeof window.getExamMetaFromUI=="function"?window.getExamMetaFromUI():{},e=o=>{try{return localStorage.getItem(o)||""}catch(s){return""}},n=[t==null?void 0:t.grade,(r=window.CURRENT_COHORT_META)==null?void 0:r.grade,(i=window.CONFIG)==null?void 0:i.grade,(a=window.CONFIG)==null?void 0:a.name,e("CURRENT_TEACHER_TERM_ID"),e("CURRENT_TERM_ID")];for(const o of n){const s=String(o||"").match(/([6-9])\s*年?级?/);if(s)return Number(s[1])}return 0}function ot(){const t=Se();return t===9?me:([6,7,8].includes(t),nt)}function F(t){const e=ot().map(J);return Array.from(new Set((t||[]).map(r=>String(r||"").trim()).filter(Boolean))).sort((r,i)=>{const a=D(r),o=D(i);return a!==o?a-o:String(r).localeCompare(String(i),"zh-CN",{numeric:!0})})}function D(t){const n=ot().map(J).indexOf(J(t));return n>=0?n:999}function at(){var e;return String(((e=window.CONFIG)==null?void 0:e.name)||"").trim().includes("9")?{avg:50,excellent:80,pass:50}:{avg:60,excellent:70,pass:70}}function M(t,e=5e3,n=!1){return Promise.race([Promise.resolve(t).catch(()=>n),new Promise(r=>setTimeout(()=>r(n),e))])}function K(t,e){try{const n=localStorage.getItem(t);return n?JSON.parse(n):e}catch(n){return e}}function rt(t,e){try{localStorage.setItem(t,JSON.stringify(e))}catch(n){console.warn("[county-analysis] failed to persist state:",n)}}function T(){var t;return String(window.CURRENT_EXAM_ID||(typeof window.readWorkspaceExamId=="function"?window.readWorkspaceExamId():"")||((t=window.COHORT_DB)==null?void 0:t.currentExamId)||"current").trim()||"current"}function b(){return Object.keys(window.SCHOOLS||{}).filter(Boolean).sort((t,e)=>t.localeCompare(e,"zh-CN"))}function it(t){const e=String(t||"").trim();return/^(?:\u6574\u4f53|\u5168\u90e8|\u6c47\u603b|\u603b\u8868|\u5408\u8ba1|\u5168\u53bf|\u53bf\u57df|Sheet\d*|\u5de5\u4f5c\u8868\d*)$/i.test(e)}function st(t){return typeof window.normalizeSchoolName=="function"&&window.normalizeSchoolName(t)||String(t||"").trim()}function ct(t){const e=Array.isArray(t)?t.filter(Boolean):b();if(!e.length)return[];if(typeof window.getTownshipManagedSchoolNames=="function"){const o=window.getTownshipManagedSchoolNames(e);if(Array.isArray(o)&&o.length)return o}const n=window.TARGETS&&typeof window.TARGETS=="object"?window.TARGETS:{},r=Object.keys(n);if(!r.length)return[];const i=new Map;e.forEach(o=>{i.set(st(o),o)});const a=r.map(o=>{if(typeof window.resolveSchoolNameFromCollection=="function"){const s=window.resolveSchoolNameFromCollection(e,o);if(s)return s}if(typeof window.getCanonicalSchoolName=="function"){const s=window.getCanonicalSchoolName(o,e);if(s&&e.includes(s))return s}return i.get(st(o))||""}).filter(o=>o&&!it(o));return Array.from(new Set(a)).sort((o,s)=>o.localeCompare(s,"zh-CN"))}function O(){const t=Object.keys(window.TARGETS&&typeof window.TARGETS=="object"?window.TARGETS:{}).sort((n,r)=>String(n).localeCompare(String(r),"zh-CN")),e=Number(window.__RAW_DATA_VERSION||0);return[T(),Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:0,e,b().join("|"),t.join("|")].join("::")}function lt(){const t=K(tt,{});return t&&typeof t=="object"?t:{}}function C(){return lt()[T()]||null}function Re(t){const e=lt();e[T()]=t,rt(tt,e)}function ze(t){return String(t||"").split(/[,\n，、]+/).map(e=>e.trim()).filter(Boolean)}function ke(t,e=null){const n=Array.isArray(t)?t.filter(Boolean):b();return ct(n)}function H(t){const e=b(),n=ct(e),r=new Set(n),i=u=>r.has(u)?!0:typeof window.isTownshipManagedSchool=="function"?window.isTownshipManagedSchool(u,e):n.some(c=>typeof window.areSchoolNamesMatched=="function"?window.areSchoolNamesMatched(c,u,!0):c===u),a=e.filter(u=>i(u)),o=e.filter(u=>!i(u)),s=!!(t!=null&&t.includesCounty)&&(a.length>0||o.length>0);return{examKey:T(),includesCounty:s,explicitCountyUpload:s&&(t==null?void 0:t.explicitCountyUpload)===!0,townshipSchools:a,countySchools:o,signature:(t==null?void 0:t.signature)||O(),updatedAt:(t==null?void 0:t.updatedAt)||new Date().toISOString()}}function ut(){return Object.values(window.SCHOOLS||{}).slice().sort((t,e)=>(t.countyRank2Rate||9999)-(e.countyRank2Rate||9999))}function dt(){const t=Object.values(window.SCHOOLS||{}).filter(e=>{var n;return(n=e==null?void 0:e.metrics)==null?void 0:n.total}).map(e=>{var r,i,a,o,s;const n=e.metrics.total||{};return{school:e,schoolName:e.name||"",count:y(n.count),avg:y(n.avg),excellentRate:y(n.excRate),passRate:y(n.passRate),ratedAvg:y((r=n.countyRatedAvg)!=null?r:e.countyRatedAvg),ratedExc:y((i=n.countyRatedExc)!=null?i:e.countyRatedExc),ratedPass:y((a=n.countyRatedPass)!=null?a:e.countyRatedPass),score:y((s=(o=n.countyScore2Rate)!=null?o:e.countyScore2Rate)!=null?s:e.score2Rate)}});return x(t,e=>e.avg,(e,n)=>{e.rankAvg=n}),x(t,e=>e.excellentRate,(e,n)=>{e.rankExcellent=n}),x(t,e=>e.passRate,(e,n)=>{e.rankPass=n}),x(t,e=>e.score,(e,n)=>{e.rankScore=n}),t.sort((e,n)=>(e.rankScore||9999)-(n.rankScore||9999))}function pt(){const t=b();if(!t.length)return"";const e=[typeof window.readCurrentSchool=="function"?window.readCurrentSchool():"",window.MY_SCHOOL,(()=>{try{return localStorage.getItem("MY_SCHOOL")||""}catch(n){return""}})()].map(n=>String(n||"").trim()).filter(Boolean);for(const n of e){if(t.includes(n))return n;if(typeof window.resolveSchoolNameFromCollection=="function"){const r=window.resolveSchoolNameFromCollection(t,n);if(r)return r}if(typeof window.getCanonicalSchoolName=="function"){const r=window.getCanonicalSchoolName(n,t);if(r&&t.includes(r))return r}}return""}function ft(t,e){const n=at();return{ratedAvg:e.avg?y(t==null?void 0:t.avg)/e.avg*n.avg:0,ratedExc:e.excellent?y(t==null?void 0:t.excRate)/e.excellent*n.excellent:0,ratedPass:e.pass?y(t==null?void 0:t.passRate)/e.pass*n.pass:0}}function yt(t,e,n,r){const i=H(r||C()||{}),a=new Set(i.townshipSchools||[]),o=Object.values(window.SCHOOLS||{}).filter(l=>{var h;return(h=l==null?void 0:l.metrics)==null?void 0:h[t]}).filter(l=>n!=="township"||a.has(l.name));if(!o.length)return null;const s=o.reduce((l,h)=>{var w;const f=((w=h==null?void 0:h.metrics)==null?void 0:w[t])||{};return l.avg=Math.max(l.avg,y(f.avg)),l.excellent=Math.max(l.excellent,y(f.excRate)),l.pass=Math.max(l.pass,y(f.passRate)),l},{avg:0,excellent:0,pass:0}),u=o.map(l=>{var w;const h=((w=l==null?void 0:l.metrics)==null?void 0:w[t])||{},f=ft(h,s);return{name:l.name,metric:h,score:f.ratedAvg+f.ratedExc+f.ratedPass}}).sort((l,h)=>h.score-l.score);let c=u.find(l=>l.name===e);return!c&&typeof window.areSchoolNamesMatched=="function"&&(c=u.find(l=>window.areSchoolNamesMatched(l.name,e,!0))),c?{rank:u.findIndex(l=>l===c)+1,total:u.length,score:c.score,metric:c.metric}:null}function Pe(t){var o,s;const e=pt(),n=e?(window.SCHOOLS||{})[e]:null;if(!n)return'<div class="county-empty">未锁定本校。请先在数据管理里设置本校，县域分析会自动补充本校学科对比。</div>';const r=((o=n.metrics)==null?void 0:o.total)||{},i=n.countyScope!=="county",a=(window.SUBJECTS||[]).map(u=>{var h,f,w;const c=yt(u,e,"county",t),d=i?yt(u,e,"township",t):null;if(!c&&!d)return"";const l=c||d;return`
                    <tr>
                        <td>${S(u)}</td>
                        <td>${g((h=l==null?void 0:l.metric)==null?void 0:h.avg,1)}</td>
                        <td>${R((f=l==null?void 0:l.metric)==null?void 0:f.excRate)}</td>
                        <td>${R((w=l==null?void 0:l.metric)==null?void 0:w.passRate)}</td>
                        <td>${d?`${d.rank}/${d.total}`:"-"}</td>
                        <td>${c?`${c.rank}/${c.total}`:"-"}</td>
                    </tr>
                `}).filter(Boolean).join("");return`
            <div class="county-focus-card">
                <div>
                    <span>本校县域站位</span>
                    <strong>${S(e)}</strong>
                    <p>${i?"本校属于乡镇学校：普通模块只按乡镇计算，县域分析里同时显示县排名。":"本校当前按县直学校处理：仅在县域分析和学生县排名场景参与。"}</p>
                </div>
                <div class="county-focus-metrics">
                    <em>乡镇总排 <b>${i&&n.townshipRank2Rate||"-"}</b></em>
                    <em>县域总排 <b>${n.countyRank2Rate||"-"}</b></em>
                    <em>两率一分 <b>${g((s=n.countyScore2Rate)!=null?s:n.score2Rate)}</b></em>
                    <em>样本 <b>${r.count||0}</b></em>
                </div>
            </div>
            ${a?`
                <div class="table-wrap analysis-table-shell county-focus-table">
                    <table class="analysis-generated-table county-analysis-table">
                        <thead><tr><th>学科</th><th>均分</th><th>优秀率</th><th>及格率</th><th>乡镇学科排</th><th>县域学科排</th></tr></thead>
                        <tbody>${a}</tbody>
                    </table>
                </div>
            `:""}
        `}function ht(){return(window.RAW_DATA||[]).filter(t=>Number.isFinite(Number(t==null?void 0:t.total))).slice().sort((t,e)=>{const n=Number(t.townshipRank||9999),r=Number(e.townshipRank||9999);return n!==r?n-r:(t.countyRank||9999)-(e.countyRank||9999)})}function E(){return Object.keys(G().map||{}).length>0}function N(){return!!window.TEACHER_STATS&&Object.keys(window.TEACHER_STATS).length>0}function wt(){var t;return typeof window.readCurrentSchool=="function"?String(window.readCurrentSchool()||"").trim():String(window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||((t=document.getElementById("mySchoolSelect"))==null?void 0:t.value)||"").trim()}function G(){const t=window.TEACHER_MAP&&typeof window.TEACHER_MAP=="object"?window.TEACHER_MAP:{},e=window.TEACHER_SCHOOL_MAP&&typeof window.TEACHER_SCHOOL_MAP=="object"?window.TEACHER_SCHOOL_MAP:{},n=wt(),r=Object.values(e).map(o=>String(o||"").trim()).filter(Boolean);if(!n||!r.length)return{map:t,schoolMap:e,schoolName:n,scoped:!1,matched:Object.keys(t).length>0};const i={},a={};return Object.entries(t).forEach(([o,s])=>{String(e[o]||"").trim()===n&&(i[o]=s,a[o]=e[o])}),{map:i,schoolMap:a,schoolName:n,scoped:!0,matched:Object.keys(i).length>0}}function mt(){const t=G();return!t.scoped||!t.matched||Object.keys(t.map).length===Object.keys(window.TEACHER_MAP||{}).length||(typeof window.setTeacherMap=="function"?window.setTeacherMap(t.map):window.TEACHER_MAP=t.map,typeof window.setTeacherSchoolMap=="function"?window.setTeacherSchoolMap(t.schoolMap):window.TEACHER_SCHOOL_MAP=t.schoolMap,typeof window.setTeacherStats=="function"?window.setTeacherStats({}):window.TEACHER_STATS={}),t}function be(){var e;const t=String(((e=window.location)==null?void 0:e.hostname)||"").trim().toLowerCase();return t&&t!=="127.0.0.1"&&t!=="localhost"}async function xe(){if(typeof window.analyzeTeachers=="function")return!0;try{window.SystemRuntimeLoader&&typeof window.SystemRuntimeLoader.load=="function"?await M(window.SystemRuntimeLoader.load("teacher-analysis"),6e3,!1):typeof window.ensureTeacherAnalysisRuntimeLoaded=="function"&&await M(window.ensureTeacherAnalysisRuntimeLoaded(),6e3,!1)}catch(t){console.warn("[county-analysis] teacher runtime load failed:",t)}return typeof window.analyzeTeachers=="function"}async function gt(t=!1){const e=wt(),n=G(),r=`${O()}::${e}::${Object.keys(n.map||{}).length}::${Object.keys(window.TEACHER_STATS||{}).length}`,i=Date.now();if(!t&&m.lastTeacherContextSignature===r&&i-Number(m.lastTeacherContextAt||0)<3e4&&(E()||N()))return{hasTeacherAssignments:E(),hasTeacherStats:N(),changed:!1,cached:!0};if(!t&&m.teacherContextPromise)return m.teacherContextPromise;m.teacherContextPromise=(async()=>{let a=!1;if(!E()&&!e&&typeof window.tryAutoRestoreTeacherMap=="function")try{a=!!await M(window.tryAutoRestoreTeacherMap(),4e3,!1)||a}catch(o){console.warn("[county-analysis] tryAutoRestoreTeacherMap failed:",o)}if(!E()&&be()&&window.CloudManager&&typeof window.CloudManager.loadTeachers=="function")try{a=!!await M(window.CloudManager.loadTeachers({background:!0,toast:!1,blocking:!1,schoolName:e}),1e4,!1)||a,!E()&&e&&(a=!!await M(window.CloudManager.loadTeachers({background:!0,toast:!1,blocking:!1,schoolName:""}),1e4,!1)||a)}catch(o){console.warn("[county-analysis] loadTeachers failed:",o)}if(mt(),!N()&&E())try{await xe()&&typeof window.analyzeTeachers=="function"&&(window.analyzeTeachers(),a=!0)}catch(o){console.warn("[county-analysis] analyzeTeachers failed:",o)}return N()&&W(C()),{hasTeacherAssignments:E(),hasTeacherStats:N(),changed:a}})();try{const a=await m.teacherContextPromise;return(a!=null&&a.hasTeacherAssignments||a!=null&&a.hasTeacherStats)&&(m.lastTeacherContextSignature=r,m.lastTeacherContextAt=Date.now()),a}finally{m.teacherContextPromise=null}}function L(t=12){mt();const e=window.COUNTY_TEACHER_RANKINGS||{},n=[];Object.entries(window.TEACHER_STATS||{}).forEach(([i,a])=>{Object.entries(a||{}).forEach(([o,s])=>{var c,d,l,h,f,w,$,v,z,P,U,j;const u=((c=e==null?void 0:e[i])==null?void 0:c[o])||{};n.push({teacherName:i,subject:o,score:y((f=(h=(l=(d=s.finalScore)!=null?d:s.fairScore)!=null?l:s.leagueScore)!=null?h:s.avgValue)!=null?f:s.avg),avg:y((w=s.avgValue)!=null?w:s.avg),passRate:y(s.passRate),excellentRate:y(($=s.excellentRate)!=null?$:s.excRate),studentCount:y((v=s.studentCount)!=null?v:s.count),riskLevel:s.riskLevel||"normal",countyRankAvg:(z=u.rankAvg)!=null?z:null,countyRankExc:(P=u.rankExc)!=null?P:null,countyRankPass:(U=u.rankPass)!=null?U:null,benchmarkCount:(j=u.benchmarkCount)!=null?j:0})})});const r=n.sort((i,a)=>{const o=Number.isFinite(i.countyRankAvg)?i.countyRankAvg:9999,s=Number.isFinite(a.countyRankAvg)?a.countyRankAvg:9999;return o!==s?o-s:a.score-i.score});return!Number.isFinite(t)||t<=0?r:r.slice(0,t)}function W(t){const e=H(t||C()||{includesCounty:!1,townshipSchools:b()}),n=new Set(e.townshipSchools||[]),r={},i={};return F(window.SUBJECTS||[]).forEach(a=>{const o=[];Object.entries(window.TEACHER_STATS||{}).forEach(([s,u])=>{var d,l,h;const c=u==null?void 0:u[a];c&&o.push({name:s,type:"teacher",subject:a,avg:y((d=c.avgValue)!=null?d:c.avg),excellentRate:y((l=c.excellentRate)!=null?l:c.excRate),passRate:y(c.passRate),studentCount:y((h=c.studentCount)!=null?h:c.count),scope:"teacher"})}),Object.values(window.SCHOOLS||{}).forEach(s=>{var c;const u=(c=s==null?void 0:s.metrics)==null?void 0:c[a];u&&o.push({name:s.name||"",type:"school",subject:a,avg:y(u.avg),excellentRate:y(u.excRate),passRate:y(u.passRate),studentCount:y(u.count),scope:n.has(s.name)?"township":"county"})}),o.length&&(o.sort((s,u)=>u.avg-s.avg),o.forEach((s,u)=>{s.rankAvg=u+1}),o.sort((s,u)=>u.excellentRate-s.excellentRate),o.forEach((s,u)=>{s.rankExc=u+1}),o.sort((s,u)=>u.passRate-s.passRate),o.forEach((s,u)=>{s.rankPass=u+1}),o.sort((s,u)=>(s.rankAvg||9999)!==(u.rankAvg||9999)?(s.rankAvg||9999)-(u.rankAvg||9999):s.type!==u.type?s.type==="teacher"?-1:1:String(s.name||"").localeCompare(String(u.name||""),"zh-CN")),o.forEach(s=>{s.type==="teacher"&&(r[s.name]||(r[s.name]={}),r[s.name][a]={rankAvg:s.rankAvg,rankExc:s.rankExc,rankPass:s.rankPass,benchmarkCount:o.length})}),i[a]=o)}),window.COUNTY_TEACHER_RANKINGS=r,window.COUNTY_TEACHER_RANKING_DATA=i,r}function St(){return L(Number.POSITIVE_INFINITY).filter(t=>Number.isFinite(t.countyRankAvg)).sort((t,e)=>{const n=D(t.subject)-D(e.subject);return n!==0?n:(t.countyRankAvg||9999)!==(e.countyRankAvg||9999)?(t.countyRankAvg||9999)-(e.countyRankAvg||9999):e.score-t.score})}function Rt(){const t=window.COUNTY_TEACHER_RANKING_DATA||{};return F([...Object.keys(t),...L(Number.POSITIVE_INFINITY).map(n=>n.subject)]).map(n=>{const r=(t[n]||[]).slice().sort((i,a)=>(i.rankAvg||9999)!==(a.rankAvg||9999)?(i.rankAvg||9999)-(a.rankAvg||9999):i.type!==a.type?i.type==="teacher"?-1:1:String(i.name||"").localeCompare(String(a.name||""),"zh-CN",{numeric:!0}));return{subject:n,rows:r}}).filter(n=>n.rows.length)}function Ce(t){const e=(window.SUBJECTS||[]).map(n=>{var i,a;const r=(a=(i=t==null?void 0:t.ranks)==null?void 0:i[n])==null?void 0:a.county;return Number.isFinite(Number(r))?`${n}#${r}`:""}).filter(Boolean);return e.length?e.join(" / "):"-"}function kt(){const t=K(V,[]).filter(i=>{var a;return(a=i==null?void 0:i.schools)==null?void 0:a.length});if(t.length<2)return[];const e=t[t.length-1],n=t[t.length-2],r=new Map((n.schools||[]).map(i=>[i.name,i]));return(e.schools||[]).map(i=>({current:i,previous:r.get(i.name)})).filter(i=>i.previous).sort((i,a)=>(i.current.countyRank||9999)-(a.current.countyRank||9999))}function bt(){return[["学校名称","实考人数","平均分","平均分排名","优秀率","优秀率排名","及格率","及格率排名","平均分赋分","优秀率赋分","及格率赋分","两率一分总分","县域排名"],...dt().map(t=>[t.schoolName||"",t.count||0,g(t.avg),t.rankAvg||"-",R(t.excellentRate),t.rankExcellent||"-",R(t.passRate),t.rankPass||"-",g(t.ratedAvg),g(t.ratedExc),g(t.ratedPass),g(t.score),t.rankScore||"-"])]}function ve(t){return[["学校名称","实考人数","平均分","平均分排名","优秀率","优秀率排名","及格率","及格率排名","平均分赋分","优秀率赋分","及格率赋分","两率一分","县域排名"],...Nt(t).map(e=>[e.schoolName||"",e.count||0,g(e.avg,2),e.rankAvg||"-",R(e.excellentRate),e.rankExcellent||"-",R(e.passRate),e.rankPass||"-",g(e.ratedAvg),g(e.ratedExc),g(e.ratedPass),g(e.score),e.rank||"-"])]}function Ue(){return[["学校","范围","人数","平均分","优秀率","及格率","两率一分","乡镇排名","县排名"],...ut().map(t=>{var r,i;const e=((r=t.metrics)==null?void 0:r.total)||{},n=t.countyScope!=="county";return[t.name||"",n?"本乡镇":"县域学校",e.count||0,g(e.avg),R(e.excRate),R(e.passRate),g((i=t.countyScore2Rate)!=null?i:t.score2Rate),n&&t.townshipRank2Rate||"-",t.countyRank2Rate||t.rank2Rate||"-"]})]}function xt(){return[{name:"五科总-综合分析表",rows:bt()},...F(window.SUBJECTS||[]).map(t=>({name:`${t}学科明细`,rows:ve(t)}))]}function Ct(){return[["序位","教师/学校","类型","学科","综合得分","均分","优秀率","及格率","样本人数","县域均分排","县域优秀率排","县域及格率排","对标总量","风险级别"],...L(Number.POSITIVE_INFINITY).map((t,e)=>{var n,r,i;return[e+1,t.teacherName||"","本校教师",t.subject||"",g(t.score,1),g(t.avg,1),R(t.excellentRate),R(t.passRate),t.studentCount||0,(n=t.countyRankAvg)!=null?n:"-",(r=t.countyRankExc)!=null?r:"-",(i=t.countyRankPass)!=null?i:"-",t.benchmarkCount||"-",t.riskLevel||"normal"]}),[],["同学科完整县域排名"],["学科","排名","教师/学校","类型","均分","优秀率","及格率","样本人数"],...Rt().flatMap(t=>t.rows.map(e=>[t.subject,e.rankAvg||"-",e.name||"",e.type==="teacher"?"本校教师":"学校整体",g(e.avg,1),R(e.excellentRate),R(e.passRate),e.studentCount||0]))]}function je(){const t=window.SUBJECTS||[];return[["乡镇排名","县排名","学生","学校","班级","总分","学科县排速览",...t.flatMap(e=>[`${e}乡排`,`${e}县排`])],...ht().map(e=>[e.townshipRank||"-",e.countyRank||"-",e.name||"",e.school||"",e.class||"",g(e.total,1),Ce(e),...t.flatMap(n=>{var r,i,a,o,s,u;return[(a=(i=(r=e==null?void 0:e.ranks)==null?void 0:r[n])==null?void 0:i.township)!=null?a:"-",(u=(s=(o=e==null?void 0:e.ranks)==null?void 0:o[n])==null?void 0:s.county)!=null?u:"-"]})])]}function vt(){return[["学校","本次县排名","上次县排名","变化","本次两率一分"],...kt().map(({current:t,previous:e})=>{const n=y(e.countyRank)-y(t.countyRank),r=n>0?`上升 ${n}`:n<0?`下降 ${Math.abs(n)}`:"持平";return[t.name||"",t.countyRank||"-",e.countyRank||"-",r,g(t.score2Rate)]})]}function Ae(t,e){var r;if(!window.XLSX||typeof((r=window.XLSX.utils)==null?void 0:r.book_new)!="function")throw new Error("XLSX export unavailable");const n=window.XLSX.utils.book_new();(Array.isArray(e)?e:[]).forEach((i,a)=>{const o=Array.isArray(i==null?void 0:i.rows)?i.rows:[],s=window.XLSX.utils.aoa_to_sheet(o),u=o.reduce((d,l)=>Math.max(d,Array.isArray(l)?l.length:0),0);u>0&&(s["!cols"]=Array.from({length:u},()=>({wch:16})));const c=String((i==null?void 0:i.name)||`Sheet${a+1}`).trim()||`Sheet${a+1}`;window.XLSX.utils.book_append_sheet(n,s,c.slice(0,31))}),window.XLSX.writeFile(n,t)}function At(t){var a,o;const e=T(),n=String(t||"").trim();if(n==="student"){(a=window.UI)!=null&&a.toast&&window.UI.toast("学生县排名已移到“学生档案查询”的学生考试明细中，县域分析不再单独导出学生档案县排。","info");return}const r={rank:{fileName:`县域两率一分排名_${e}.xlsx`,sheets:[{name:"县域排名",rows:bt()}]},school:{fileName:`县域学校横向分析_${e}.xlsx`,sheets:xt()},teacher:{fileName:`县域教师画像_${e}.xlsx`,sheets:[{name:"教师画像",rows:Ct()}]},history:{fileName:`县域历史对比_${e}.xlsx`,sheets:[{name:"历史对比",rows:vt()}]},all:{fileName:`县域分析_${e}.xlsx`,sheets:[...xt(),{name:"教师画像",rows:Ct()},{name:"历史对比",rows:vt()}]}},i=r[n]||r.all;Ae(i.fileName,i.sheets),(o=window.UI)!=null&&o.toast&&window.UI.toast("✅ 县域分析导出完成","success")}async function Tt(){var c;const t=O(),e=b();if(!m.promptArmed||!e.length||t===m.lastSignature)return C();m.promptArmed=!1,m.lastSignature=t;const n=C();if((n==null?void 0:n.signature)===t)return H(n);const r=ke(e,n),i=new Set(r),a=r.length?e.filter(d=>!i.has(d)):[],o=a.length>0,s=r;o&&((c=window.UI)!=null&&c.toast)&&window.UI.toast(`已按目标人数管理自动识别：乡镇 ${s.length} 所，县直/县域 ${a.length} 所`,"info");const u=H({includesCounty:o,explicitCountyUpload:o,townshipSchools:s,signature:t,updatedAt:new Date().toISOString()});return Re(u),_(),B(),I(),It(),u}function _(){const t=O();if(t&&t===m.lastRankSignature&&window.COUNTY_ANALYSIS_SCOPE)return window.COUNTY_ANALYSIS_SCOPE;m.lastRankSignature=t;const e=H(C()||{includesCounty:!1,townshipSchools:b()}),n=new Set(e.townshipSchools||[]),r=Object.values(window.SCHOOLS||{}),i=at(),a={avg:0,excellent:0,pass:0};r.forEach(c=>{var l;const d=((l=c==null?void 0:c.metrics)==null?void 0:l.total)||{};a.avg=Math.max(a.avg,y(d.avg)),a.excellent=Math.max(a.excellent,y(d.excRate)),a.pass=Math.max(a.pass,y(d.passRate))}),r.forEach(c=>{var w;const d=((w=c==null?void 0:c.metrics)==null?void 0:w.total)||{},l=a.avg?y(d.avg)/a.avg*i.avg:0,h=a.excellent?y(d.excRate)/a.excellent*i.excellent:0,f=a.pass?y(d.passRate)/a.pass*i.pass:0;c.countyRatedAvg=l,c.countyRatedExc=h,c.countyRatedPass=f,c.countyScore2Rate=l+h+f,d&&(d.countyRatedAvg=l,d.countyRatedExc=h,d.countyRatedPass=f,d.countyScore2Rate=c.countyScore2Rate)}),r.slice().sort((c,d)=>y(d.countyScore2Rate)-y(c.countyScore2Rate)).forEach((c,d)=>{var l;c.countyScope=n.has(c.name)?"township":"county",c.countyRank2Rate=d+1,(l=c.metrics)!=null&&l.total&&(c.metrics.total.countyRank2Rate=d+1)}),r.filter(c=>n.has(c.name)).sort((c,d)=>y(d.score2Rate)-y(c.score2Rate)).forEach((c,d)=>{var l;c.townshipRank2Rate=d+1,(l=c.metrics)!=null&&l.total&&(c.metrics.total.townshipRank2Rate=d+1)});const o=(window.RAW_DATA||[]).filter(c=>Number.isFinite(Number(c==null?void 0:c.total))),u=x(o,c=>c.total,(c,d)=>{c.ranks||(c.ranks={}),c.ranks.total||(c.ranks.total={}),c.countyRank=d,c.countyScope=n.has(c.school)?"township":"county",c.ranks.total.county=d}).filter(c=>n.has(c.school));return x(u,c=>c.total,(c,d)=>{c.townshipRank=d,c.ranks.total||(c.ranks.total={}),c.ranks.total.township=d}),(window.SUBJECTS||[]).forEach(c=>{const d=(window.RAW_DATA||[]).filter(f=>{var w;return Number.isFinite(Number((w=f==null?void 0:f.scores)==null?void 0:w[c]))}),h=x(d,f=>{var w;return(w=f==null?void 0:f.scores)==null?void 0:w[c]},(f,w)=>{f.ranks||(f.ranks={}),f.ranks[c]||(f.ranks[c]={}),f.ranks[c].county=w}).filter(f=>n.has(f.school));x(h,f=>{var w;return(w=f==null?void 0:f.scores)==null?void 0:w[c]},(f,w)=>{f.ranks[c]||(f.ranks[c]={}),f.ranks[c].township=w})}),W(e),window.COUNTY_ANALYSIS_SCOPE=e,e}function B(){const t=C(),e=b();if(!t||!e.length)return;const n=O(),r=K(V,[]),i={examKey:T(),signature:n,includesCounty:!!t.includesCounty,at:new Date().toISOString(),schools:Object.values(window.SCHOOLS||{}).map(o=>{var s;return{name:o.name,scope:o.countyScope||"township",score2Rate:y((s=o.countyScore2Rate)!=null?s:o.score2Rate),countyRank:o.countyRank2Rate||o.rank2Rate||0,townshipRank:o.townshipRank2Rate||0}})},a=r.filter(o=>o.signature!==n&&o.examKey!==i.examKey).concat(i).slice(-12);rt(V,a)}function Fe(){const t=ut();return t.length?`
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead>
                        <tr>
                            <th>学校</th>
                            <th>范围</th>
                            <th>人数</th>
                            <th>平均分</th>
                            <th>优秀率</th>
                            <th>及格率</th>
                            <th>两率一分</th>
                            <th>乡镇排名</th>
                            <th>县排名</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${t.map(e=>{var i,a;const n=((i=e.metrics)==null?void 0:i.total)||{},r=e.countyScope!=="county";return`
                                <tr>
                                    <td>${S(e.name)}</td>
                                    <td><span class="county-scope-badge ${r?"is-township":"is-county"}">${r?"本乡镇":"县域学校"}</span></td>
                                    <td>${n.count||0}</td>
                                    <td>${g(n.avg)}</td>
                                    <td>${R(n.excRate)}</td>
                                    <td>${R(n.passRate)}</td>
                                    <td><strong>${g((a=e.countyScore2Rate)!=null?a:e.score2Rate)}</strong></td>
                                    <td>${r&&e.townshipRank2Rate||"-"}</td>
                                    <td>${e.countyRank2Rate||e.rank2Rate||"-"}</td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        `:'<div class="county-empty">暂无学校成绩数据，请先导入本次成绩。</div>'}function Te(t){var s,u,c;const e=Array.isArray(t)?t.slice():St();if(!e.length)return"";const n=e.slice().sort((d,l)=>(d.countyRankAvg||9999)-(l.countyRankAvg||9999))[0],r=e.slice().sort((d,l)=>(d.countyRankExc||9999)-(l.countyRankExc||9999))[0],i=e.slice().sort((d,l)=>(d.countyRankPass||9999)-(l.countyRankPass||9999))[0],a=new Set(e.map(d=>d.subject).filter(Boolean)),o=e.slice().sort((d,l)=>(d.countyRankAvg||9999)-(l.countyRankAvg||9999)).slice(0,8);return`
            <div class="county-focus-card county-teacher-focus">
                <div>
                    <span>本校教师县域画像</span>
                    <strong>${e.length} 个教师-学科样本</strong>
                    <p>县域口径会把本校任课教师与县直、乡镇所有学校同学科整体表现放在一起对标，普通教师模块仍只看乡镇口径。</p>
                </div>
                <div class="county-focus-metrics">
                    <em>覆盖学科 <b>${a.size}</b></em>
                    <em>均分最好 <b>${S((n==null?void 0:n.teacherName)||"-")} #${(s=n==null?void 0:n.countyRankAvg)!=null?s:"-"}</b></em>
                    <em>优秀率最好 <b>${S((r==null?void 0:r.teacherName)||"-")} #${(u=r==null?void 0:r.countyRankExc)!=null?u:"-"}</b></em>
                    <em>及格率最好 <b>${S((i==null?void 0:i.teacherName)||"-")} #${(c=i==null?void 0:i.countyRankPass)!=null?c:"-"}</b></em>
                </div>
            </div>
            <div class="table-wrap analysis-table-shell county-focus-table">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>教师</th><th>学科</th><th>均分</th><th>优秀率</th><th>及格率</th><th>县均排</th><th>县优排</th><th>县及格排</th></tr></thead>
                    <tbody>
                        ${o.map(d=>{var l,h,f;return`
                            <tr>
                                <td>${S(d.teacherName)}</td>
                                <td>${S(d.subject)}</td>
                                <td>${g(d.avg,1)}</td>
                                <td>${R(d.excellentRate)}</td>
                                <td>${R(d.passRate)}</td>
                                <td>${(l=d.countyRankAvg)!=null?l:"-"}</td>
                                <td>${(h=d.countyRankExc)!=null?h:"-"}</td>
                                <td>${(f=d.countyRankPass)!=null?f:"-"}</td>
                            </tr>
                        `}).join("")}
                    </tbody>
                </table>
            </div>
        `}function Ee(){if(!N()&&E()&&typeof window.analyzeTeachers=="function")try{window.analyzeTeachers({render:!1}),N()&&W(C())}catch(r){console.warn("[county-analysis] sync teacher analysis failed:",r)}const t=L(10);if(!t.length)return'<div class="county-empty">暂无任课表或教师画像数据。导入任课表后，这里会展示县域样本下的教师教学画像。</div>';const e=St(),n=Rt().map(r=>`
            <div class="analysis-anchor-panel county-teacher-subject-rank">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">${S(r.subject)} 同学科县域排名</div>
                </div>
                <div class="table-wrap analysis-table-shell county-teacher-rank-table">
                    <table class="analysis-generated-table county-analysis-table">
                        <thead>
                            <tr>
                                <th>县均分排</th>
                                <th>对象</th>
                                <th>类型</th>
                                <th>均分</th>
                                <th>县优率排</th>
                                <th>优秀率</th>
                                <th>县及格排</th>
                                <th>及格率</th>
                                <th>样本人数</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${r.rows.map(i=>{var a,o,s;return`
                                <tr class="${i.type==="teacher"?"county-teacher-own-row":""}">
                                    <td>${(a=i.rankAvg)!=null?a:"-"}</td>
                                    <td>${S(i.name||"")}</td>
                                    <td>${i.type==="teacher"?"本校教师":"学校整体"}</td>
                                    <td>${g(i.avg,1)}</td>
                                    <td>${(o=i.rankExc)!=null?o:"-"}</td>
                                    <td>${R(i.excellentRate)}</td>
                                    <td>${(s=i.rankPass)!=null?s:"-"}</td>
                                    <td>${R(i.passRate)}</td>
                                    <td>${i.studentCount||0}</td>
                                </tr>
                            `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join("");return`
            <div class="county-portrait-grid">
                ${t.map((r,i)=>{var a,o,s;return`
                    <article class="county-portrait-card ${r.riskLevel==="risk"?"is-risk":""}">
                        <span class="county-portrait-rank">#${i+1}</span>
                        <h4>${S(r.teacherName)} / ${S(r.subject)}</h4>
                        <strong>${g(r.score,1)}</strong>
                        <p>均分 ${g(r.avg,1)} · 优秀率 ${R(r.excellentRate)} · 及格率 ${R(r.passRate)} · 样本 ${r.studentCount}</p>
                        <div class="county-portrait-rankline">
                            <span>县均排 #${(a=r.countyRankAvg)!=null?a:"-"}</span>
                            <span>优排 #${(o=r.countyRankExc)!=null?o:"-"}</span>
                            <span>及排 #${(s=r.countyRankPass)!=null?s:"-"}</span>
                        </div>
                    </article>
                `}).join("")}
            </div>
            ${Te(e)}
            ${n?`
                <div class="analysis-table-meta">
                    <span><strong>同学科完整排名：</strong>每个学科单独成表，本校教师与其他学校同学科整体放在同一张县域榜里。</span>
                </div>
                ${n}
            `:""}
        `}function De(){const t=ht().slice(0,40);if(!t.length)return'<div class="county-empty">暂无学生成绩数据。</div>';const e=window.SUBJECTS||[];return`
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead>
                        <tr>
                            <th>乡镇排名</th>
                            <th>县排名</th>
                            <th>学生</th>
                            <th>学校</th>
                            <th>班级</th>
                            <th>总分</th>
                            ${e.map(n=>`<th>${n}乡排</th><th>${n}县排</th>`).join("")}
                        </tr>
                    </thead>
                    <tbody>
                        ${t.map(n=>`
                            <tr>
                                <td>${n.townshipRank||"-"}</td>
                                <td>${n.countyRank||"-"}</td>
                                <td>${S(n.name)}</td>
                                <td>${S(n.school)}</td>
                                <td>${S(n.class||"")}</td>
                                <td>${g(n.total,1)}</td>
                                ${e.map(r=>{var i,a,o,s;return`
                                    <td>${((a=(i=n==null?void 0:n.ranks)==null?void 0:i[r])==null?void 0:a.township)||"-"}</td>
                                    <td>${((s=(o=n==null?void 0:n.ranks)==null?void 0:o[r])==null?void 0:s.county)||"-"}</td>
                                `}).join("")}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `}function Be(){const t=kt().slice(0,20);return t.length?`
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>学校</th><th>本次县排名</th><th>上次县排名</th><th>变化</th><th>本次两率一分</th></tr></thead>
                    <tbody>
                        ${t.map(({current:e,previous:n})=>{const r=y(n.countyRank)-y(e.countyRank);return`
                                <tr>
                                    <td>${S(e.name)}</td>
                                    <td>${e.countyRank||"-"}</td>
                                    <td>${n.countyRank||"-"}</td>
                                    <td class="${r>0?"text-green":r<0?"text-red":""}">${r>0?`上升 ${r}`:r<0?`下降 ${Math.abs(r)}`:"持平"}</td>
                                    <td>${g(e.score2Rate)}</td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        `:'<div class="county-empty">县域历史样本不足。后续再次导入县域成绩后，这里会自动显示县排名变化。</div>'}function Et(){const t=["county-teacher-portrait","county-school-horizontal","county-analysis"].find(e=>{var n,r;return(r=(n=document.getElementById(e))==null?void 0:n.classList)==null?void 0:r.contains("active")});return t==="county-analysis"?"county-teacher-portrait":t||"county-teacher-portrait"}function $e(t=Et()){var n;const e=document.getElementById(t)||document.getElementById("county-analysis");return((n=e==null?void 0:e.querySelector)==null?void 0:n.call(e,".county-analysis-root"))||document.getElementById("county-analysis-root")}function $t(){const t=document.getElementById("county-analysis");!t||t.dataset.countySubmoduleHost==="1"||(t.dataset.countySubmoduleHost="1",Object.entries(et).forEach(([e,n])=>{if(document.getElementById(e))return;const r=document.createElement("div");r.id=e,r.className="section card-box analysis-workspace analysis-workspace-county",r.innerHTML=`
                <div class="module-desc-bar analysis-hero" style="border-color:#0f766e;">
                    <h3><i class="ti ti-map-2"></i> ${S(n.title)} <span class="badge" style="background:#0f766e;">${S(n.badge)}</span></h3>
                    <p>${S(n.description)}</p>
                </div>
                <div class="county-analysis-root">
                    <div class="info-bar analysis-info-band">导入县级成绩后，这里只呈现县域专用分析，不改变联考分析、教学管理和学情诊断的原有口径。</div>
                </div>
            `,t.insertAdjacentElement("afterend",r)}))}function Nt(t){const e=O();if(m.subjectRowCacheSignature!==e&&(m.subjectRowCacheSignature=e,m.subjectRowCache=new Map),m.subjectRowCache.has(t))return m.subjectRowCache.get(t);const n=Object.values(window.SCHOOLS||{}).filter(a=>{var o;return(o=a==null?void 0:a.metrics)==null?void 0:o[t]}).map(a=>({school:a,metric:a.metrics[t]}));if(!n.length)return m.subjectRowCache.set(t,[]),[];const r=n.reduce((a,o)=>(a.avg=Math.max(a.avg,y(o.metric.avg)),a.excellent=Math.max(a.excellent,y(o.metric.excRate)),a.pass=Math.max(a.pass,y(o.metric.passRate)),a),{avg:0,excellent:0,pass:0}),i=n.map(a=>{const o=ft(a.metric,r);return{schoolName:a.school.name||"",count:y(a.metric.count),avg:y(a.metric.avg),excellentRate:y(a.metric.excRate),passRate:y(a.metric.passRate),ratedAvg:o.ratedAvg,ratedExc:o.ratedExc,ratedPass:o.ratedPass,score:o.ratedAvg+o.ratedExc+o.ratedPass}});return x(i,a=>a.avg,(a,o)=>{a.rankAvg=o}),x(i,a=>a.excellentRate,(a,o)=>{a.rankExcellent=o}),x(i,a=>a.passRate,(a,o)=>{a.rankPass=o}),x(i,a=>a.score,(a,o)=>{a.rank=o}),i.sort((a,o)=>(a.rank||9999)-(o.rank||9999)),m.subjectRowCache.set(t,i),i}function q(t={}){var u,c,d;const e=t.required!==!1,n=t.silent===!0,r=document.getElementById("countySchoolNameInput"),i=String((r==null?void 0:r.value)||"").trim();if(!i)return e?(!n&&((u=window.UI)!=null&&u.toast)&&window.UI.toast("请输入本校名称","warning"),!1):!0;const a=b();let o=i;if(a.length&&!a.includes(i)&&(typeof window.resolveSchoolNameFromCollection=="function"&&(o=window.resolveSchoolNameFromCollection(a,i)||i),!a.includes(o)&&typeof window.getCanonicalSchoolName=="function"&&(o=window.getCanonicalSchoolName(i,a)||o)),a.length&&!a.includes(o))return!n&&((c=window.UI)!=null&&c.toast)&&window.UI.toast("当前县级成绩中没有匹配到该学校，请核对名称","warning"),!1;window.MY_SCHOOL=o;try{localStorage.setItem("MY_SCHOOL",o)}catch(l){}typeof window.writeCurrentSchool=="function"&&window.writeCurrentSchool(o);const s=document.getElementById("mySchoolSelect");return s&&Array.from(s.options||[]).some(l=>l.value===o)&&(s.value=o),r&&(r.value=o),!n&&((d=window.UI)!=null&&d.toast)&&window.UI.toast(`已锁定本校：${o}`,"success"),!0}function _t(){var e;q({required:!1,silent:!0})&&(m.subjectRowCache=new Map,_(),B(),I("county-school-horizontal"),(e=window.UI)!=null&&e.toast&&window.UI.toast("县域学校横向对比表已生成","success"))}function Ot(){return{buildCountyHorizontalTotalRows:dt,buildCountySubjectRows:Nt,sortCountySubjects:F,resolveCurrentCountySchoolName:pt,getExamKey:T,escapeHtml:S,toNumber:y,formatNumber:g,formatCountyRankDisplay:ge}}function Ye(t=""){const e=window.CountySchoolHorizontalRenderer;return!e||typeof e.renderTotalTable!="function"?'<div class="county-empty">县域学校横向分析组件加载中，请稍后重试。</div>':e.renderTotalTable(Ot(),t)}function Ne(){const t=window.CountySchoolHorizontalRenderer;return!t||typeof t.renderSchoolHorizontal!="function"?'<div class="county-empty">县域学校横向分析组件加载中，请稍后重试。</div>':t.renderSchoolHorizontal(Ot())}function _e(){return`
            <div class="county-kpi-grid">
                <div><span>教师样本</span><strong>${L(Number.POSITIVE_INFINITY).length}</strong><em>本校教师-学科</em></div>
                <div><span>对标范围</span><strong>${b().length}</strong><em>县域所有学校</em></div>
                <div><span>学科数</span><strong>${(window.SUBJECTS||[]).length}</strong><em>同学科排名</em></div>
                <div><span>输出</span><strong>画像表</strong><em>均分 / 优率 / 及格率</em></div>
            </div>
            <div class="analysis-anchor-panel">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">县域教师教学质量画像</div>
                    <div class="county-section-actions">
                        <button class="btn btn-sm btn-green" type="button" onclick="exportCountyAnalysisSection('teacher')">下载Excel</button>
                    </div>
                </div>
                <div class="analysis-table-meta">
                    <span><strong>口径：</strong>本校教师按任教学科，与县域所有学校该学科整体表现同表排名。</span>
                </div>
                ${Ee()}
            </div>
        `}function I(t=Et()){var e,n,r;if(!m.isRendering){m.isRendering=!0;try{$t();const i=t==="county-analysis"?"county-teacher-portrait":t,a=$e(i);if(!a)return;const o=_();i==="county-teacher-portrait"&&window.setTimeout(()=>{gt().then(h=>{const f=["county-teacher-portrait","county-analysis"].some(w=>{var $,v;return(v=($=document.getElementById(w))==null?void 0:$.classList)==null?void 0:v.contains("active")});h!=null&&h.changed&&f&&!m.isRendering&&I(i)})},0);const s=b(),u=((e=o.countySchools)==null?void 0:e.length)||0,c=((n=o.townshipSchools)==null?void 0:n.length)||0,d=(window.RAW_DATA||[]).length,l=`
            <div class="county-kpi-grid">
                <div><span>本次范围</span><strong>${o.includesCounty?"县域 + 乡镇":"乡镇"}</strong><em>${S(T())}</em></div>
                <div><span>学校数</span><strong>${s.length}</strong><em>乡镇 ${c} · 县域 ${u}</em></div>
                <div><span>学生样本</span><strong>${d}</strong><em>已补充 countyRank / townshipRank</em></div>
                <div><span>当前子模块</span><strong>${S(((r=et[i])==null?void 0:r.title)||"县域教师画像")}</strong><em>不影响其他母模块</em></div>
            </div>
            ${i==="county-school-horizontal"?Ne():_e()}
        `;a.innerHTML=l}finally{m.isRendering=!1}}}function Oe(){}function Ie(){}function Q(t,e){var n;return t!=null&&t.ranks?e==="total"?t.countyRank||"-":((n=t.ranks[e])==null?void 0:n.county)||"-":"-"}function Xe(){var P,U,j,Lt;if(!(window.RAW_DATA||[]).length){alert("请先上传数据");return}_();const t=typeof window.getCurrentUser=="function"?window.getCurrentUser():null,e=(t==null?void 0:t.role)||"guest",n=e==="teacher",r=e==="class_teacher",i=r&&typeof window.getClassTeacherStudentViewMode=="function"?window.getClassTeacherStudentViewMode():"teaching",o=(n||r&&i==="teaching")&&typeof window.getTeacherScopeForUser=="function"?window.getTeacherScopeForUser(t):null,s=n||r&&i==="teaching"?(window.SUBJECTS||[]).filter(p=>{var k;return(k=o==null?void 0:o.subjects)==null?void 0:k.has(window.normalizeSubject?window.normalizeSubject(p):p)}):window.SUBJECTS||[],u=((P=document.getElementById("studentSchoolSelect"))==null?void 0:P.value)||"",c=((U=document.getElementById("studentClassSelect"))==null?void 0:U.value)||"",d=typeof window.isSingleSchoolMode=="function"?window.isSingleSchoolMode():Object.keys(window.SCHOOLS||{}).length<=1;let l=[...window.RAW_DATA||[]];if((n||r&&i==="teaching")&&((j=o==null?void 0:o.classes)==null?void 0:j.size)>0)l=l.filter(p=>{const k=String(p.class||"").trim(),Y=typeof window.normalizeClass=="function"?window.normalizeClass(p.class):k;return o.classes.has(Y)||o.classes.has(k)?!0:Array.from(o.classes).some(X=>String(X).replace(/[\s\.]/g,"")===k.replace(/[\s\.]/g,""))});else if(r&&(t!=null&&t.class)&&typeof window.normalizeClass=="function"){const p=window.normalizeClass(t.class);l=l.filter(k=>window.normalizeClass(k.class)===p)}u&&!u.includes("请选择")&&(l=l.filter(p=>p.school===u)),c&&c!=="全部"&&(l=l.filter(p=>p.class===c)),typeof window.getComparisonStudentList=="function"&&(l=window.getComparisonStudentList(l,window.RAW_DATA||[])),l.sort((p,k)=>(Number(k.total)||0)-(Number(p.total)||0));const h=typeof window.hasStudentCountyRankData=="function"?window.hasStudentCountyRankData(l,s):l.some(p=>Q(p,"total")!=="-"),f=n||r?["学校","班级","姓名"]:["学校","班级","姓名","考号","考场","相对总分"];s.forEach(p=>{n||r?f.push(`${p} 分数`,`${p} 班排`,`${p} 级排`):f.push(`${p} 分数`,`${p} 相对分`,`${p} 校排`,`${p} 班排`),d||f.push(`${p} 镇排`),h&&f.push(`${p} 县排`)});const w=String(((Lt=window.CONFIG)==null?void 0:Lt.name)||"").includes("9")?"五科总分":"总分";n||r?f.push(w,"总分班排","总分级排"):f.push(w,`${w}校排`,`${w}班排`),d||f.push(`${w}镇排`),h&&f.push(`${w}县排`);const $=[f];l.forEach(p=>{var Y,X,zt,Pt,Ut,jt,Ft,Dt,Bt,Yt,Xt,Vt,Jt,Kt,Gt;const k=n||r?[p.school,p.class,p.name]:[p.school,p.class,p.name,p.id,p.examRoom,p.totalTScore||0];s.forEach(A=>{var Wt,qt,Qt,Zt,te,ee,ne,oe,ae,re,ie,se,ce,le,ue,de,pe,fe,ye,he,we;n||r?k.push((qt=(Wt=p.scores)==null?void 0:Wt[A])!=null?qt:"-",(te=(Zt=(Qt=p==null?void 0:p.ranks)==null?void 0:Qt[A])==null?void 0:Zt.class)!=null?te:"-",(oe=(ne=(ee=p==null?void 0:p.ranks)==null?void 0:ee[A])==null?void 0:ne.school)!=null?oe:"-"):k.push((re=(ae=p.scores)==null?void 0:ae[A])!=null?re:"-",(se=(ie=p==null?void 0:p.tScores)==null?void 0:ie[A])!=null?se:"-",(ue=(le=(ce=p==null?void 0:p.ranks)==null?void 0:ce[A])==null?void 0:le.school)!=null?ue:"-",(fe=(pe=(de=p==null?void 0:p.ranks)==null?void 0:de[A])==null?void 0:pe.class)!=null?fe:"-"),d||k.push((we=(he=(ye=p==null?void 0:p.ranks)==null?void 0:ye[A])==null?void 0:he.township)!=null?we:"-"),h&&k.push(Q(p,A))}),n||r?k.push(p.total,(zt=(X=(Y=p==null?void 0:p.ranks)==null?void 0:Y.total)==null?void 0:X.class)!=null?zt:"-",(jt=(Ut=(Pt=p==null?void 0:p.ranks)==null?void 0:Pt.total)==null?void 0:Ut.school)!=null?jt:"-"):k.push(p.total,(Bt=(Dt=(Ft=p==null?void 0:p.ranks)==null?void 0:Ft.total)==null?void 0:Dt.school)!=null?Bt:"-",(Vt=(Xt=(Yt=p==null?void 0:p.ranks)==null?void 0:Yt.total)==null?void 0:Xt.class)!=null?Vt:"-"),d||k.push((Gt=(Kt=(Jt=p==null?void 0:p.ranks)==null?void 0:Jt.total)==null?void 0:Kt.township)!=null?Gt:"-"),h&&k.push(Q(p,"total")),$.push(k)});const v=window.XLSX.utils.book_new(),z=window.XLSX.utils.aoa_to_sheet($);if(typeof window.decorateExcelSheet=="function"&&window.decorateExcelSheet(z,f),window.XLSX.utils.book_append_sheet(v,z,"学生考试明细"),n||r){const p=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,new Set(s||[])):"teacher";window.XLSX.writeFile(v,`学生考试明细_${p}.xlsx`)}else window.XLSX.writeFile(v,"学生考试明细.xlsx")}function It(){const t=document.getElementById("upload-feedback-board");if(!t)return;let e=document.getElementById("upload-county-scope-card");e||(e=document.createElement("div"),e.id="upload-county-scope-card",e.className="upload-feedback-card",t.appendChild(e));const n=C();e.innerHTML=`
            <h4><i class="ti ti-map-2"></i> 县域对比口径</h4>
            <p>${n!=null&&n.includesCounty?`已启用县域排名：乡镇 ${n.townshipSchools.length} 所，县域学校 ${n.countySchools.length} 所。`:"本次暂按乡镇成绩处理。导入新成绩时会询问是否包含县里学校。"}</p>
        `}function Z(t,e){const n=window[t];if(typeof n!="function"||n[`__countyPatched_${t}`])return!1;const r=function(...a){const o=n.apply(this,a),s=u=>(e(...a),u);return o&&typeof o.then=="function"?o.then(s):(s(o),o)};return r[`__countyPatched_${t}`]=!0,window[t]=r,!0}function Me(t){const e=window[t];return typeof e=="function"&&!!e[`__countyPatched_${t}`]}function Mt(){return Z("processData",()=>{_(),B(),Tt()}),Z("renderTables",()=>{_()}),Z("switchTab",t=>{(t==="county-analysis"||t==="county-teacher-portrait"||t==="county-school-horizontal")&&setTimeout(()=>I(t),0)}),["processData","renderTables","switchTab"].every(Me)}function He(){document.addEventListener("change",t=>{const e=t.target;!e||e.id!=="fileInput"||e.files&&e.files.length&&(m.preUploadTownshipSchools=b().filter(n=>!it(n)),m.promptArmed=!0)},!0)}function Le(){if(document.getElementById("county-analysis-runtime-style"))return;const t=document.createElement("style");t.id="county-analysis-runtime-style",t.textContent=`
            .county-module-nav{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:10px 0 14px;padding:12px 14px;border:1px solid #99f6e4;border-radius:16px;background:linear-gradient(135deg,#ecfeff,#f8fafc)}
            .county-module-nav a{display:inline-flex;align-items:center;justify-content:center;padding:7px 12px;border-radius:999px;background:#0f766e;color:#fff;font-size:12px;font-weight:900;text-decoration:none}
            .county-module-nav span{color:#475569;font-size:12px;font-weight:700}
            .county-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}
            .county-kpi-grid>div{padding:16px;border:1px solid #ccfbf1;border-radius:18px;background:linear-gradient(135deg,#f0fdfa,#fff)}
            .county-kpi-grid span,.county-kpi-grid em{display:block;color:#64748b;font-size:12px;font-style:normal}
            .county-kpi-grid strong{display:block;margin:8px 0 4px;color:#0f766e;font-size:24px}
            .county-focus-card{display:flex;align-items:stretch;justify-content:space-between;gap:16px;margin:12px 0;padding:16px;border:1px solid #bfdbfe;border-radius:18px;background:linear-gradient(135deg,#eff6ff,#fff)}
            .county-focus-card span{display:block;color:#2563eb;font-size:12px;font-weight:900;letter-spacing:.08em;text-transform:uppercase}
            .county-focus-card strong{display:block;margin:6px 0;color:#0f172a;font-size:20px}
            .county-focus-card p{margin:0;color:#64748b;font-size:13px;line-height:1.7}
            .county-focus-metrics{display:grid;grid-template-columns:repeat(2,minmax(120px,1fr));gap:8px;min-width:280px}
            .county-focus-metrics em{display:block;padding:10px 12px;border:1px solid rgba(148,163,184,.28);border-radius:14px;background:#fff;color:#64748b;font-size:12px;font-style:normal}
            .county-focus-metrics b{display:block;margin-top:4px;color:#0f766e;font-size:16px}
            .county-focus-table{margin:12px 0}
            .county-teacher-focus{border-color:#ddd6fe;background:linear-gradient(135deg,#f5f3ff,#fff)}
            .county-scope-badge{display:inline-flex;padding:4px 9px;border-radius:999px;font-size:12px;font-weight:800}
            .county-scope-badge.is-township{background:#dcfce7;color:#166534}
            .county-scope-badge.is-county{background:#dbeafe;color:#1d4ed8}
            .county-empty{padding:14px 16px;border:1px dashed #cbd5e1;border-radius:14px;background:#f8fafc;color:#64748b}
            .county-portrait-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
            .county-portrait-card{position:relative;padding:16px;border:1px solid #dbeafe;border-radius:18px;background:#fff}
            .county-portrait-card.is-risk{border-color:#fecaca;background:#fff7f7}
            .county-portrait-card h4{margin:0 0 8px;color:#0f172a}
            .county-portrait-card strong{font-size:28px;color:#0f766e}
            .county-portrait-card p{margin:8px 0 0;color:#64748b;font-size:12px;line-height:1.6}
            .county-portrait-rank{position:absolute;right:14px;top:12px;color:#94a3b8;font-weight:900}
            .county-portrait-rankline{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;color:#0f172a;font-size:12px}
            .county-portrait-rankline span{background:#f8fafc;border:1px solid rgba(148,163,184,.35);border-radius:999px;padding:4px 10px}
            .county-section-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
            .county-section-actions{display:flex;gap:8px;flex-wrap:wrap}
            .county-control-panel{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:12px 0 16px;padding:14px 16px;border:1px solid #bfdbfe;border-radius:18px;background:#f8fafc}
            .county-control-field{display:grid;gap:6px;min-width:min(420px,100%);color:#334155;font-size:12px;font-weight:900}
            .county-control-field input{width:100%;height:38px;border:1px solid #cbd5e1;border-radius:12px;padding:0 12px;background:#fff;color:#0f172a;font-size:13px;font-weight:700}
            .county-control-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
            .county-teacher-own-row{background:#f0fdfa}
            @media(max-width:900px){.county-kpi-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.county-focus-card{display:block}.county-focus-metrics{grid-template-columns:1fr;min-width:0;margin-top:12px}}
            @media(max-width:560px){.county-kpi-grid{grid-template-columns:1fr}}
        `,document.head.appendChild(t)}function Ht(){Le(),$t(),He();const t=Mt();if(It(),t)return;let e=0;const n=setInterval(()=>{e+=1,(Mt()||e>40)&&clearInterval(n)},300)}window.CountyAnalysisRuntime={applyCountyRanks:_,renderCountyAnalysis:I,ensureTeacherContextForCountyAnalysis:gt,promptCountyScopeIfNeeded:Tt,decorateAnalysisTable:Oe,decorateStudentDetails:Ie,saveCountySnapshot:B,getCurrentScope:C,exportCountyAnalysisSection:At,setCountyAnalysisSchoolNameFromInput:q,generateCountySchoolHorizontalTable:_t},window.renderCountyAnalysis=I,window.exportCountyAnalysisSection=At,window.setCountyAnalysisSchoolNameFromInput=q,window.generateCountySchoolHorizontalTable=_t,window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__=!0,document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Ht,{once:!0}):Ht()})();
