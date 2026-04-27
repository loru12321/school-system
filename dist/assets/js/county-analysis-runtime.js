(()=>{if(typeof window=="undefined"||window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__)return;const ot="COUNTY_ANALYSIS_SCOPE_V1",G="COUNTY_ANALYSIS_HISTORY_V1",y={promptArmed:!1,lastSignature:"",teacherContextPromise:null,lastTeacherContextSignature:"",lastTeacherContextAt:0,subjectRowCacheSignature:"",subjectRowCache:new Map,teacherRowsCacheSignature:"",teacherRowsCache:[],teacherSubjectTablesCacheSignature:"",teacherSubjectTablesCache:[],preUploadTownshipSchools:[],isRendering:!1,lastRankSignature:""},at={"county-teacher-portrait":{title:"县域教师画像",badge:"教师县域排名",description:"对照“教师教学质量画像”，把本校教师放到县域所有学校同学科样本中排名，查看学科教师县域站位。"},"county-school-horizontal":{title:"县域学校横向分析",badge:"全县横向对比",description:"对照“两率一分(横向)”，生成五科总综合分析表和各学科明细表，按县域所有学校统一排名。"}},me=["语文","数学","英语","物理","化学","政治"],rt=["语文","数学","英语","物理","化学","历史","地理","生物","政治"];function S(t){return String(t!=null?t:"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function h(t,e=0){const n=Number(t);return Number.isFinite(n)?n:e}function k(t,e,n){if(window.RankingDataService&&typeof window.RankingDataService.assignCompetitionRanks=="function")return window.RankingDataService.assignCompetitionRanks(t,e,n);const a=Array.isArray(t)?t.slice():[];a.sort((o,l)=>Number(e(l)||0)-Number(e(o)||0));let c=null,r=0;return a.forEach((o,l)=>{const s=Number(e(o)),i=c!==null&&Math.abs(s-c)<1e-4?r:l+1;n(o,i),c=s,r=i}),a}function m(t,e=2){const n=Number(t);return Number.isFinite(n)?n.toFixed(e):"-"}function R(t){const e=Number(t);return Number.isFinite(e)?`${(e*100).toFixed(1)}%`:"-"}function Se(t,e,n=!1){const a=Number(t),c=Number.isFinite(a)?n?`${(a*100).toFixed(2)}%`:a.toFixed(2):"-",r=e?` <span style="font-size:0.9em; color:#94a3b8">(${e})</span>`:"";return`${c}${r}`}function V(t){const e=String(t||"").trim();return typeof window.normalizeSubject=="function"?window.normalizeSubject(e):e.replace(/\s+/g,"")}function Re(){var a,c,r;const t=typeof window.getExamMetaFromUI=="function"?window.getExamMetaFromUI():{},e=o=>{try{return localStorage.getItem(o)||""}catch(l){return""}},n=[t==null?void 0:t.grade,(a=window.CURRENT_COHORT_META)==null?void 0:a.grade,(c=window.CONFIG)==null?void 0:c.grade,(r=window.CONFIG)==null?void 0:r.name,e("CURRENT_TEACHER_TERM_ID"),e("CURRENT_TERM_ID")];for(const o of n){const l=String(o||"").match(/([6-9])\s*年?级?/);if(l)return Number(l[1])}return 0}function ct(){const t=Re();return t===9?me:([6,7,8].includes(t),rt)}function F(t){const e=ct().map(V);return Array.from(new Set((t||[]).map(a=>String(a||"").trim()).filter(Boolean))).sort((a,c)=>{const r=B(a),o=B(c);return r!==o?r-o:String(a).localeCompare(String(c),"zh-CN",{numeric:!0})})}function B(t){const n=ct().map(V).indexOf(V(t));return n>=0?n:999}function it(){var e;return String(((e=window.CONFIG)==null?void 0:e.name)||"").trim().includes("9")?{avg:50,excellent:80,pass:50}:{avg:60,excellent:70,pass:70}}function M(t,e=5e3,n=!1){return Promise.race([Promise.resolve(t).catch(()=>n),new Promise(a=>setTimeout(()=>a(n),e))])}function J(t,e){try{const n=localStorage.getItem(t);return n?JSON.parse(n):e}catch(n){return e}}function st(t,e){try{localStorage.setItem(t,JSON.stringify(e))}catch(n){console.warn("[county-analysis] failed to persist state:",n)}}function v(){var t;return String(window.CURRENT_EXAM_ID||(typeof window.readWorkspaceExamId=="function"?window.readWorkspaceExamId():"")||((t=window.COHORT_DB)==null?void 0:t.currentExamId)||"current").trim()||"current"}function C(){return Object.keys(window.SCHOOLS||{}).filter(Boolean).sort((t,e)=>t.localeCompare(e,"zh-CN"))}function lt(t){const e=String(t||"").trim();return/^(?:\u6574\u4f53|\u5168\u90e8|\u6c47\u603b|\u603b\u8868|\u5408\u8ba1|\u5168\u53bf|\u53bf\u57df|Sheet\d*|\u5de5\u4f5c\u8868\d*)$/i.test(e)}function ut(t){return typeof window.normalizeSchoolName=="function"&&window.normalizeSchoolName(t)||String(t||"").trim()}function dt(t){const e=Array.isArray(t)?t.filter(Boolean):C();if(!e.length)return[];if(typeof window.getTownshipManagedSchoolNames=="function"){const o=window.getTownshipManagedSchoolNames(e);if(Array.isArray(o)&&o.length)return o}const n=window.TARGETS&&typeof window.TARGETS=="object"?window.TARGETS:{},a=Object.keys(n);if(!a.length)return[];const c=new Map;e.forEach(o=>{c.set(ut(o),o)});const r=a.map(o=>{if(typeof window.resolveSchoolNameFromCollection=="function"){const l=window.resolveSchoolNameFromCollection(e,o);if(l)return l}if(typeof window.getCanonicalSchoolName=="function"){const l=window.getCanonicalSchoolName(o,e);if(l&&e.includes(l))return l}return c.get(ut(o))||""}).filter(o=>o&&!lt(o));return Array.from(new Set(r)).sort((o,l)=>o.localeCompare(l,"zh-CN"))}function $(){const t=Object.keys(window.TARGETS&&typeof window.TARGETS=="object"?window.TARGETS:{}).sort((n,a)=>String(n).localeCompare(String(a),"zh-CN")),e=Number(window.__RAW_DATA_VERSION||0);return[v(),Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:0,e,C().join("|"),t.join("|")].join("::")}function W(){const t=window.TEACHER_STATS&&typeof window.TEACHER_STATS=="object"?window.TEACHER_STATS:{},e=window.TEACHER_MAP&&typeof window.TEACHER_MAP=="object"?window.TEACHER_MAP:{},n=window.TEACHER_SCHOOL_MAP&&typeof window.TEACHER_SCHOOL_MAP=="object"?window.TEACHER_SCHOOL_MAP:{},a=window.COUNTY_TEACHER_RANKING_DATA&&typeof window.COUNTY_TEACHER_RANKING_DATA=="object"?window.COUNTY_TEACHER_RANKING_DATA:{},c=Object.entries(t).map(([r,o])=>`${r}:${Object.keys(o||{}).sort().join(",")}`).sort().join("|");return[$(),q(),Object.keys(e).length,Object.keys(n).length,Object.keys(t).length,c,Object.keys(a).sort().join(",")].join("::")}function be(){y.teacherRowsCacheSignature="",y.teacherRowsCache=[],y.teacherSubjectTablesCacheSignature="",y.teacherSubjectTablesCache=[]}function pt(){const t=J(ot,{});return t&&typeof t=="object"?t:{}}function x(){return pt()[v()]||null}function Ce(t){const e=pt();e[v()]=t,st(ot,e)}function Ue(t){return String(t||"").split(/[,\n，、]+/).map(e=>e.trim()).filter(Boolean)}function ke(t,e=null){const n=Array.isArray(t)?t.filter(Boolean):C();return dt(n)}function H(t){const e=C(),n=dt(e),a=new Set(n),c=s=>a.has(s)?!0:typeof window.isTownshipManagedSchool=="function"?window.isTownshipManagedSchool(s,e):n.some(i=>typeof window.areSchoolNamesMatched=="function"?window.areSchoolNamesMatched(i,s,!0):i===s),r=e.filter(s=>c(s)),o=e.filter(s=>!c(s)),l=!!(t!=null&&t.includesCounty)&&(r.length>0||o.length>0);return{examKey:v(),includesCounty:l,explicitCountyUpload:l&&(t==null?void 0:t.explicitCountyUpload)===!0,townshipSchools:r,countySchools:o,signature:(t==null?void 0:t.signature)||$(),updatedAt:(t==null?void 0:t.updatedAt)||new Date().toISOString()}}function ft(){return Object.values(window.SCHOOLS||{}).slice().sort((t,e)=>(t.countyRank2Rate||9999)-(e.countyRank2Rate||9999))}function ht(){const t=Object.values(window.SCHOOLS||{}).filter(e=>{var n;return(n=e==null?void 0:e.metrics)==null?void 0:n.total}).map(e=>{var a,c,r,o,l;const n=e.metrics.total||{};return{school:e,schoolName:e.name||"",count:h(n.count),avg:h(n.avg),excellentRate:h(n.excRate),passRate:h(n.passRate),ratedAvg:h((a=n.countyRatedAvg)!=null?a:e.countyRatedAvg),ratedExc:h((c=n.countyRatedExc)!=null?c:e.countyRatedExc),ratedPass:h((r=n.countyRatedPass)!=null?r:e.countyRatedPass),score:h((l=(o=n.countyScore2Rate)!=null?o:e.countyScore2Rate)!=null?l:e.score2Rate)}});return k(t,e=>e.avg,(e,n)=>{e.rankAvg=n}),k(t,e=>e.excellentRate,(e,n)=>{e.rankExcellent=n}),k(t,e=>e.passRate,(e,n)=>{e.rankPass=n}),k(t,e=>e.score,(e,n)=>{e.rankScore=n}),t.sort((e,n)=>(e.rankScore||9999)-(n.rankScore||9999))}function yt(){const t=C();if(!t.length)return"";const e=[typeof window.readCurrentSchool=="function"?window.readCurrentSchool():"",window.MY_SCHOOL,(()=>{try{return localStorage.getItem("MY_SCHOOL")||""}catch(n){return""}})()].map(n=>String(n||"").trim()).filter(Boolean);for(const n of e){if(t.includes(n))return n;if(typeof window.resolveSchoolNameFromCollection=="function"){const a=window.resolveSchoolNameFromCollection(t,n);if(a)return a}if(typeof window.getCanonicalSchoolName=="function"){const a=window.getCanonicalSchoolName(n,t);if(a&&t.includes(a))return a}}return""}function wt(t,e){const n=it();return{ratedAvg:e.avg?h(t==null?void 0:t.avg)/e.avg*n.avg:0,ratedExc:e.excellent?h(t==null?void 0:t.excRate)/e.excellent*n.excellent:0,ratedPass:e.pass?h(t==null?void 0:t.passRate)/e.pass*n.pass:0}}function gt(t,e,n,a){const c=H(a||x()||{}),r=new Set(c.townshipSchools||[]),o=Object.values(window.SCHOOLS||{}).filter(u=>{var w;return(w=u==null?void 0:u.metrics)==null?void 0:w[t]}).filter(u=>n!=="township"||r.has(u.name));if(!o.length)return null;const l=o.reduce((u,w)=>{var g;const f=((g=w==null?void 0:w.metrics)==null?void 0:g[t])||{};return u.avg=Math.max(u.avg,h(f.avg)),u.excellent=Math.max(u.excellent,h(f.excRate)),u.pass=Math.max(u.pass,h(f.passRate)),u},{avg:0,excellent:0,pass:0}),s=o.map(u=>{var g;const w=((g=u==null?void 0:u.metrics)==null?void 0:g[t])||{},f=wt(w,l);return{name:u.name,metric:w,score:f.ratedAvg+f.ratedExc+f.ratedPass}}).sort((u,w)=>w.score-u.score);let i=s.find(u=>u.name===e);return!i&&typeof window.areSchoolNamesMatched=="function"&&(i=s.find(u=>window.areSchoolNamesMatched(u.name,e,!0))),i?{rank:s.findIndex(u=>u===i)+1,total:s.length,score:i.score,metric:i.metric}:null}function ze(t){var o,l;const e=yt(),n=e?(window.SCHOOLS||{})[e]:null;if(!n)return'<div class="county-empty">未锁定本校。请先在数据管理里设置本校，县域分析会自动补充本校学科对比。</div>';const a=((o=n.metrics)==null?void 0:o.total)||{},c=n.countyScope!=="county",r=(window.SUBJECTS||[]).map(s=>{var w,f,g;const i=gt(s,e,"county",t),d=c?gt(s,e,"township",t):null;if(!i&&!d)return"";const u=i||d;return`
                    <tr>
                        <td>${S(s)}</td>
                        <td>${m((w=u==null?void 0:u.metric)==null?void 0:w.avg,1)}</td>
                        <td>${R((f=u==null?void 0:u.metric)==null?void 0:f.excRate)}</td>
                        <td>${R((g=u==null?void 0:u.metric)==null?void 0:g.passRate)}</td>
                        <td>${d?`${d.rank}/${d.total}`:"-"}</td>
                        <td>${i?`${i.rank}/${i.total}`:"-"}</td>
                    </tr>
                `}).filter(Boolean).join("");return`
            <div class="county-focus-card">
                <div>
                    <span>本校县域站位</span>
                    <strong>${S(e)}</strong>
                    <p>${c?"本校属于乡镇学校：普通模块只按乡镇计算，县域分析里同时显示县排名。":"本校当前按县直学校处理：仅在县域分析和学生县排名场景参与。"}</p>
                </div>
                <div class="county-focus-metrics">
                    <em>乡镇总排 <b>${c&&n.townshipRank2Rate||"-"}</b></em>
                    <em>县域总排 <b>${n.countyRank2Rate||"-"}</b></em>
                    <em>两率一分 <b>${m((l=n.countyScore2Rate)!=null?l:n.score2Rate)}</b></em>
                    <em>样本 <b>${a.count||0}</b></em>
                </div>
            </div>
            ${r?`
                <div class="table-wrap analysis-table-shell county-focus-table">
                    <table class="analysis-generated-table county-analysis-table">
                        <thead><tr><th>学科</th><th>均分</th><th>优秀率</th><th>及格率</th><th>乡镇学科排</th><th>县域学科排</th></tr></thead>
                        <tbody>${r}</tbody>
                    </table>
                </div>
            `:""}
        `}function mt(){return(window.RAW_DATA||[]).filter(t=>Number.isFinite(Number(t==null?void 0:t.total))).slice().sort((t,e)=>{const n=Number(t.townshipRank||9999),a=Number(e.townshipRank||9999);return n!==a?n-a:(t.countyRank||9999)-(e.countyRank||9999)})}function E(){return Object.keys(Q().map||{}).length>0}function _(){return!!window.TEACHER_STATS&&Object.keys(window.TEACHER_STATS).length>0}function q(){var t;return typeof window.readCurrentSchool=="function"?String(window.readCurrentSchool()||"").trim():String(window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||((t=document.getElementById("mySchoolSelect"))==null?void 0:t.value)||"").trim()}function Q(){const t=window.TEACHER_MAP&&typeof window.TEACHER_MAP=="object"?window.TEACHER_MAP:{},e=window.TEACHER_SCHOOL_MAP&&typeof window.TEACHER_SCHOOL_MAP=="object"?window.TEACHER_SCHOOL_MAP:{},n=q(),a=Object.values(e).map(o=>String(o||"").trim()).filter(Boolean);if(!n||!a.length)return{map:t,schoolMap:e,schoolName:n,scoped:!1,matched:Object.keys(t).length>0};const c={},r={};return Object.entries(t).forEach(([o,l])=>{String(e[o]||"").trim()===n&&(c[o]=l,r[o]=e[o])}),{map:c,schoolMap:r,schoolName:n,scoped:!0,matched:Object.keys(c).length>0}}function St(){const t=Q();return!t.scoped||!t.matched||Object.keys(t.map).length===Object.keys(window.TEACHER_MAP||{}).length||(typeof window.setTeacherMap=="function"?window.setTeacherMap(t.map):window.TEACHER_MAP=t.map,typeof window.setTeacherSchoolMap=="function"?window.setTeacherSchoolMap(t.schoolMap):window.TEACHER_SCHOOL_MAP=t.schoolMap,typeof window.setTeacherStats=="function"?window.setTeacherStats({}):window.TEACHER_STATS={}),t}function xe(){var e;const t=String(((e=window.location)==null?void 0:e.hostname)||"").trim().toLowerCase();return t&&t!=="127.0.0.1"&&t!=="localhost"}async function Te(){if(typeof window.analyzeTeachers=="function")return!0;try{window.SystemRuntimeLoader&&typeof window.SystemRuntimeLoader.load=="function"?await M(window.SystemRuntimeLoader.load("teacher-analysis"),6e3,!1):typeof window.ensureTeacherAnalysisRuntimeLoaded=="function"&&await M(window.ensureTeacherAnalysisRuntimeLoaded(),6e3,!1)}catch(t){console.warn("[county-analysis] teacher runtime load failed:",t)}return typeof window.analyzeTeachers=="function"}async function Rt(t=!1){const e=q(),n=Q(),a=`${$()}::${e}::${Object.keys(n.map||{}).length}::${Object.keys(window.TEACHER_STATS||{}).length}`,c=Date.now();if(!t&&y.lastTeacherContextSignature===a&&c-Number(y.lastTeacherContextAt||0)<3e4&&(E()||_()))return{hasTeacherAssignments:E(),hasTeacherStats:_(),changed:!1,cached:!0};if(!t&&y.teacherContextPromise)return y.teacherContextPromise;y.teacherContextPromise=(async()=>{let r=!1;if(!E()&&!e&&typeof window.tryAutoRestoreTeacherMap=="function")try{r=!!await M(window.tryAutoRestoreTeacherMap(),4e3,!1)||r}catch(o){console.warn("[county-analysis] tryAutoRestoreTeacherMap failed:",o)}if(!E()&&xe()&&window.CloudManager&&typeof window.CloudManager.loadTeachers=="function")try{r=!!await M(window.CloudManager.loadTeachers({background:!0,toast:!1,blocking:!1,schoolName:e}),1e4,!1)||r,!E()&&e&&(r=!!await M(window.CloudManager.loadTeachers({background:!0,toast:!1,blocking:!1,schoolName:""}),1e4,!1)||r)}catch(o){console.warn("[county-analysis] loadTeachers failed:",o)}if(St(),!_()&&E())try{await Te()&&typeof window.analyzeTeachers=="function"&&(window.analyzeTeachers(),r=!0)}catch(o){console.warn("[county-analysis] analyzeTeachers failed:",o)}return _()&&Z(x()),{hasTeacherAssignments:E(),hasTeacherStats:_(),changed:r}})();try{const r=await y.teacherContextPromise;return(r!=null&&r.hasTeacherAssignments||r!=null&&r.hasTeacherStats)&&(y.lastTeacherContextSignature=a,y.lastTeacherContextAt=Date.now()),r}finally{y.teacherContextPromise=null}}function j(t=12){St();const e=W();let n=y.teacherRowsCache;if(y.teacherRowsCacheSignature!==e){const a=window.COUNTY_TEACHER_RANKINGS||{},c=[];Object.entries(window.TEACHER_STATS||{}).forEach(([r,o])=>{Object.entries(o||{}).forEach(([l,s])=>{var d,u,w,f,g,N,T,P,L,U,z,D;const i=((d=a==null?void 0:a[r])==null?void 0:d[l])||{};c.push({teacherName:r,subject:l,score:h((g=(f=(w=(u=s.finalScore)!=null?u:s.fairScore)!=null?w:s.leagueScore)!=null?f:s.avgValue)!=null?g:s.avg),avg:h((N=s.avgValue)!=null?N:s.avg),passRate:h(s.passRate),excellentRate:h((T=s.excellentRate)!=null?T:s.excRate),studentCount:h((P=s.studentCount)!=null?P:s.count),riskLevel:s.riskLevel||"normal",countyRankAvg:(L=i.rankAvg)!=null?L:null,countyRankExc:(U=i.rankExc)!=null?U:null,countyRankPass:(z=i.rankPass)!=null?z:null,benchmarkCount:(D=i.benchmarkCount)!=null?D:0})})}),n=c.sort((r,o)=>{const l=Number.isFinite(r.countyRankAvg)?r.countyRankAvg:9999,s=Number.isFinite(o.countyRankAvg)?o.countyRankAvg:9999;return l!==s?l-s:o.score-r.score}),y.teacherRowsCacheSignature=e,y.teacherRowsCache=n}return!Number.isFinite(t)||t<=0?n.slice():n.slice(0,t)}function Z(t){const e=H(t||x()||{includesCounty:!1,townshipSchools:C()}),n=`${W()}::${(e.townshipSchools||[]).join("|")}::${e.includesCounty?"county":"township"}`;if(y.lastRankSignature===n&&window.COUNTY_TEACHER_RANKINGS&&window.COUNTY_TEACHER_RANKING_DATA)return window.COUNTY_TEACHER_RANKINGS;const a=new Set(e.townshipSchools||[]),c={},r={};return F(window.SUBJECTS||[]).forEach(o=>{const l=[];Object.entries(window.TEACHER_STATS||{}).forEach(([s,i])=>{var u,w,f;const d=i==null?void 0:i[o];d&&l.push({name:s,type:"teacher",subject:o,avg:h((u=d.avgValue)!=null?u:d.avg),excellentRate:h((w=d.excellentRate)!=null?w:d.excRate),passRate:h(d.passRate),studentCount:h((f=d.studentCount)!=null?f:d.count),scope:"teacher"})}),Object.values(window.SCHOOLS||{}).forEach(s=>{var d;const i=(d=s==null?void 0:s.metrics)==null?void 0:d[o];i&&l.push({name:s.name||"",type:"school",subject:o,avg:h(i.avg),excellentRate:h(i.excRate),passRate:h(i.passRate),studentCount:h(i.count),scope:a.has(s.name)?"township":"county"})}),l.length&&(l.sort((s,i)=>i.avg-s.avg),l.forEach((s,i)=>{s.rankAvg=i+1}),l.sort((s,i)=>i.excellentRate-s.excellentRate),l.forEach((s,i)=>{s.rankExc=i+1}),l.sort((s,i)=>i.passRate-s.passRate),l.forEach((s,i)=>{s.rankPass=i+1}),l.sort((s,i)=>(s.rankAvg||9999)!==(i.rankAvg||9999)?(s.rankAvg||9999)-(i.rankAvg||9999):s.type!==i.type?s.type==="teacher"?-1:1:String(s.name||"").localeCompare(String(i.name||""),"zh-CN")),l.forEach(s=>{s.type==="teacher"&&(c[s.name]||(c[s.name]={}),c[s.name][o]={rankAvg:s.rankAvg,rankExc:s.rankExc,rankPass:s.rankPass,benchmarkCount:l.length})}),r[o]=l)}),window.COUNTY_TEACHER_RANKINGS=c,window.COUNTY_TEACHER_RANKING_DATA=r,y.lastRankSignature=n,be(),c}function bt(){return j(Number.POSITIVE_INFINITY).filter(t=>Number.isFinite(t.countyRankAvg)).sort((t,e)=>{const n=B(t.subject)-B(e.subject);return n!==0?n:(t.countyRankAvg||9999)!==(e.countyRankAvg||9999)?(t.countyRankAvg||9999)-(e.countyRankAvg||9999):e.score-t.score})}function Ct(){const t=W();if(y.teacherSubjectTablesCacheSignature===t)return y.teacherSubjectTablesCache.map(c=>({subject:c.subject,rows:(c.rows||[]).slice()}));const e=window.COUNTY_TEACHER_RANKING_DATA||{},a=F([...Object.keys(e),...j(Number.POSITIVE_INFINITY).map(c=>c.subject)]).map(c=>{const r=(e[c]||[]).slice().sort((o,l)=>(o.rankAvg||9999)!==(l.rankAvg||9999)?(o.rankAvg||9999)-(l.rankAvg||9999):o.type!==l.type?o.type==="teacher"?-1:1:String(o.name||"").localeCompare(String(l.name||""),"zh-CN",{numeric:!0}));return{subject:c,rows:r}}).filter(c=>c.rows.length);return y.teacherSubjectTablesCacheSignature=t,y.teacherSubjectTablesCache=a,a.map(c=>({subject:c.subject,rows:(c.rows||[]).slice()}))}function Ae(t){const e=(window.SUBJECTS||[]).map(n=>{var c,r;const a=(r=(c=t==null?void 0:t.ranks)==null?void 0:c[n])==null?void 0:r.county;return Number.isFinite(Number(a))?`${n}#${a}`:""}).filter(Boolean);return e.length?e.join(" / "):"-"}function kt(){const t=J(G,[]).filter(c=>{var r;return(r=c==null?void 0:c.schools)==null?void 0:r.length});if(t.length<2)return[];const e=t[t.length-1],n=t[t.length-2],a=new Map((n.schools||[]).map(c=>[c.name,c]));return(e.schools||[]).map(c=>({current:c,previous:a.get(c.name)})).filter(c=>c.previous).sort((c,r)=>(c.current.countyRank||9999)-(r.current.countyRank||9999))}function xt(){return[["学校名称","实考人数","平均分","平均分排名","优秀率","优秀率排名","及格率","及格率排名","平均分赋分","优秀率赋分","及格率赋分","两率一分总分","县域排名"],...ht().map(t=>[t.schoolName||"",t.count||0,m(t.avg),t.rankAvg||"-",R(t.excellentRate),t.rankExcellent||"-",R(t.passRate),t.rankPass||"-",m(t.ratedAvg),m(t.ratedExc),m(t.ratedPass),m(t.score),t.rankScore||"-"])]}function ve(t){return[["学校名称","实考人数","平均分","平均分排名","优秀率","优秀率排名","及格率","及格率排名","平均分赋分","优秀率赋分","及格率赋分","两率一分","县域排名"],...Ot(t).map(e=>[e.schoolName||"",e.count||0,m(e.avg,2),e.rankAvg||"-",R(e.excellentRate),e.rankExcellent||"-",R(e.passRate),e.rankPass||"-",m(e.ratedAvg),m(e.ratedExc),m(e.ratedPass),m(e.score),e.rank||"-"])]}function De(){return[["学校","范围","人数","平均分","优秀率","及格率","两率一分","乡镇排名","县排名"],...ft().map(t=>{var a,c;const e=((a=t.metrics)==null?void 0:a.total)||{},n=t.countyScope!=="county";return[t.name||"",n?"本乡镇":"县域学校",e.count||0,m(e.avg),R(e.excRate),R(e.passRate),m((c=t.countyScore2Rate)!=null?c:t.score2Rate),n&&t.townshipRank2Rate||"-",t.countyRank2Rate||t.rank2Rate||"-"]})]}function Tt(){return[{name:"五科总-综合分析表",rows:xt()},...F(window.SUBJECTS||[]).map(t=>({name:`${t}学科明细`,rows:ve(t)}))]}function At(){return[["序位","教师/学校","类型","学科","综合得分","均分","优秀率","及格率","样本人数","县域均分排","县域优秀率排","县域及格率排","对标总量","风险级别"],...j(Number.POSITIVE_INFINITY).map((t,e)=>{var n,a,c;return[e+1,t.teacherName||"","本校教师",t.subject||"",m(t.score,1),m(t.avg,1),R(t.excellentRate),R(t.passRate),t.studentCount||0,(n=t.countyRankAvg)!=null?n:"-",(a=t.countyRankExc)!=null?a:"-",(c=t.countyRankPass)!=null?c:"-",t.benchmarkCount||"-",t.riskLevel||"normal"]}),[],["同学科完整县域排名"],["学科","排名","教师/学校","类型","均分","优秀率","及格率","样本人数"],...Ct().flatMap(t=>t.rows.map(e=>[t.subject,e.rankAvg||"-",e.name||"",e.type==="teacher"?"本校教师":"学校整体",m(e.avg,1),R(e.excellentRate),R(e.passRate),e.studentCount||0]))]}function Fe(){const t=window.SUBJECTS||[];return[["乡镇排名","县排名","学生","学校","班级","总分","学科县排速览",...t.flatMap(e=>[`${e}乡排`,`${e}县排`])],...mt().map(e=>[e.townshipRank||"-",e.countyRank||"-",e.name||"",e.school||"",e.class||"",m(e.total,1),Ae(e),...t.flatMap(n=>{var a,c,r,o,l,s;return[(r=(c=(a=e==null?void 0:e.ranks)==null?void 0:a[n])==null?void 0:c.township)!=null?r:"-",(s=(l=(o=e==null?void 0:e.ranks)==null?void 0:o[n])==null?void 0:l.county)!=null?s:"-"]})])]}function vt(){return[["学校","本次县排名","上次县排名","变化","本次两率一分"],...kt().map(({current:t,previous:e})=>{const n=h(e.countyRank)-h(t.countyRank),a=n>0?`上升 ${n}`:n<0?`下降 ${Math.abs(n)}`:"持平";return[t.name||"",t.countyRank||"-",e.countyRank||"-",a,m(t.score2Rate)]})]}function Ee(t,e){var a;if(!window.XLSX||typeof((a=window.XLSX.utils)==null?void 0:a.book_new)!="function")throw new Error("XLSX export unavailable");const n=window.XLSX.utils.book_new();(Array.isArray(e)?e:[]).forEach((c,r)=>{const o=Array.isArray(c==null?void 0:c.rows)?c.rows:[],l=window.XLSX.utils.aoa_to_sheet(o),s=o.reduce((d,u)=>Math.max(d,Array.isArray(u)?u.length:0),0);s>0&&(l["!cols"]=Array.from({length:s},()=>({wch:16})));const i=String((c==null?void 0:c.name)||`Sheet${r+1}`).trim()||`Sheet${r+1}`;window.XLSX.utils.book_append_sheet(n,l,i.slice(0,31))}),window.XLSX.writeFile(n,t)}function Et(t){var r,o;const e=v(),n=String(t||"").trim();if(n==="student"){(r=window.UI)!=null&&r.toast&&window.UI.toast("学生县排名已移到“学生档案查询”的学生考试明细中，县域分析不再单独导出学生档案县排。","info");return}const a={rank:{fileName:`县域两率一分排名_${e}.xlsx`,sheets:[{name:"县域排名",rows:xt()}]},school:{fileName:`县域学校横向分析_${e}.xlsx`,sheets:Tt()},teacher:{fileName:`县域教师画像_${e}.xlsx`,sheets:[{name:"教师画像",rows:At()}]},history:{fileName:`县域历史对比_${e}.xlsx`,sheets:[{name:"历史对比",rows:vt()}]},all:{fileName:`县域分析_${e}.xlsx`,sheets:[...Tt(),{name:"教师画像",rows:At()},{name:"历史对比",rows:vt()}]}},c=a[n]||a.all;Ee(c.fileName,c.sheets),(o=window.UI)!=null&&o.toast&&window.UI.toast("✅ 县域分析导出完成","success")}async function Nt(){var i;const t=$(),e=C();if(!y.promptArmed||!e.length||t===y.lastSignature)return x();y.promptArmed=!1,y.lastSignature=t;const n=x();if((n==null?void 0:n.signature)===t)return H(n);const a=ke(e,n),c=new Set(a),r=a.length?e.filter(d=>!c.has(d)):[],o=r.length>0,l=a;o&&((i=window.UI)!=null&&i.toast)&&window.UI.toast(`已按目标人数管理自动识别：乡镇 ${l.length} 所，县直/县域 ${r.length} 所`,"info");const s=H({includesCounty:o,explicitCountyUpload:o,townshipSchools:l,signature:t,updatedAt:new Date().toISOString()});return Ce(s),O(),Y(),I(),Ht(),s}function O(){const t=$();if(t&&t===y.lastRankSignature&&window.COUNTY_ANALYSIS_SCOPE)return window.COUNTY_ANALYSIS_SCOPE;y.lastRankSignature=t;const e=H(x()||{includesCounty:!1,townshipSchools:C()}),n=new Set(e.townshipSchools||[]),a=Object.values(window.SCHOOLS||{}),c=it(),r={avg:0,excellent:0,pass:0};a.forEach(i=>{var u;const d=((u=i==null?void 0:i.metrics)==null?void 0:u.total)||{};r.avg=Math.max(r.avg,h(d.avg)),r.excellent=Math.max(r.excellent,h(d.excRate)),r.pass=Math.max(r.pass,h(d.passRate))}),a.forEach(i=>{var g;const d=((g=i==null?void 0:i.metrics)==null?void 0:g.total)||{},u=r.avg?h(d.avg)/r.avg*c.avg:0,w=r.excellent?h(d.excRate)/r.excellent*c.excellent:0,f=r.pass?h(d.passRate)/r.pass*c.pass:0;i.countyRatedAvg=u,i.countyRatedExc=w,i.countyRatedPass=f,i.countyScore2Rate=u+w+f,d&&(d.countyRatedAvg=u,d.countyRatedExc=w,d.countyRatedPass=f,d.countyScore2Rate=i.countyScore2Rate)}),a.slice().sort((i,d)=>h(d.countyScore2Rate)-h(i.countyScore2Rate)).forEach((i,d)=>{var u;i.countyScope=n.has(i.name)?"township":"county",i.countyRank2Rate=d+1,(u=i.metrics)!=null&&u.total&&(i.metrics.total.countyRank2Rate=d+1)}),a.filter(i=>n.has(i.name)).sort((i,d)=>h(d.score2Rate)-h(i.score2Rate)).forEach((i,d)=>{var u;i.townshipRank2Rate=d+1,(u=i.metrics)!=null&&u.total&&(i.metrics.total.townshipRank2Rate=d+1)});const o=(window.RAW_DATA||[]).filter(i=>Number.isFinite(Number(i==null?void 0:i.total))),s=k(o,i=>i.total,(i,d)=>{i.ranks||(i.ranks={}),i.ranks.total||(i.ranks.total={}),i.countyRank=d,i.countyScope=n.has(i.school)?"township":"county",i.ranks.total.county=d}).filter(i=>n.has(i.school));return k(s,i=>i.total,(i,d)=>{i.townshipRank=d,i.ranks.total||(i.ranks.total={}),i.ranks.total.township=d}),(window.SUBJECTS||[]).forEach(i=>{const d=(window.RAW_DATA||[]).filter(f=>{var g;return Number.isFinite(Number((g=f==null?void 0:f.scores)==null?void 0:g[i]))}),w=k(d,f=>{var g;return(g=f==null?void 0:f.scores)==null?void 0:g[i]},(f,g)=>{f.ranks||(f.ranks={}),f.ranks[i]||(f.ranks[i]={}),f.ranks[i].county=g}).filter(f=>n.has(f.school));k(w,f=>{var g;return(g=f==null?void 0:f.scores)==null?void 0:g[i]},(f,g)=>{f.ranks[i]||(f.ranks[i]={}),f.ranks[i].township=g})}),Z(e),window.COUNTY_ANALYSIS_SCOPE=e,e}function Y(){const t=x(),e=C();if(!t||!e.length)return;const n=$(),a=J(G,[]),c={examKey:v(),signature:n,includesCounty:!!t.includesCounty,at:new Date().toISOString(),schools:Object.values(window.SCHOOLS||{}).map(o=>{var l;return{name:o.name,scope:o.countyScope||"township",score2Rate:h((l=o.countyScore2Rate)!=null?l:o.score2Rate),countyRank:o.countyRank2Rate||o.rank2Rate||0,townshipRank:o.townshipRank2Rate||0}})},r=a.filter(o=>o.signature!==n&&o.examKey!==c.examKey).concat(c).slice(-12);st(G,r)}function Be(){const t=ft();return t.length?`
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
                        ${t.map(e=>{var c,r;const n=((c=e.metrics)==null?void 0:c.total)||{},a=e.countyScope!=="county";return`
                                <tr>
                                    <td>${S(e.name)}</td>
                                    <td><span class="county-scope-badge ${a?"is-township":"is-county"}">${a?"本乡镇":"县域学校"}</span></td>
                                    <td>${n.count||0}</td>
                                    <td>${m(n.avg)}</td>
                                    <td>${R(n.excRate)}</td>
                                    <td>${R(n.passRate)}</td>
                                    <td><strong>${m((r=e.countyScore2Rate)!=null?r:e.score2Rate)}</strong></td>
                                    <td>${a&&e.townshipRank2Rate||"-"}</td>
                                    <td>${e.countyRank2Rate||e.rank2Rate||"-"}</td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        `:'<div class="county-empty">暂无学校成绩数据，请先导入本次成绩。</div>'}function Ne(t){var l,s,i;const e=Array.isArray(t)?t.slice():bt();if(!e.length)return"";const n=e.slice().sort((d,u)=>(d.countyRankAvg||9999)-(u.countyRankAvg||9999))[0],a=e.slice().sort((d,u)=>(d.countyRankExc||9999)-(u.countyRankExc||9999))[0],c=e.slice().sort((d,u)=>(d.countyRankPass||9999)-(u.countyRankPass||9999))[0],r=new Set(e.map(d=>d.subject).filter(Boolean)),o=e.slice().sort((d,u)=>(d.countyRankAvg||9999)-(u.countyRankAvg||9999)).slice(0,8);return`
            <div class="county-focus-card county-teacher-focus">
                <div>
                    <span>本校教师县域画像</span>
                    <strong>${e.length} 个教师-学科样本</strong>
                    <p>县域口径会把本校任课教师与县直、乡镇所有学校同学科整体表现放在一起对标，普通教师模块仍只看乡镇口径。</p>
                </div>
                <div class="county-focus-metrics">
                    <em>覆盖学科 <b>${r.size}</b></em>
                    <em>均分最好 <b>${S((n==null?void 0:n.teacherName)||"-")} #${(l=n==null?void 0:n.countyRankAvg)!=null?l:"-"}</b></em>
                    <em>优秀率最好 <b>${S((a==null?void 0:a.teacherName)||"-")} #${(s=a==null?void 0:a.countyRankExc)!=null?s:"-"}</b></em>
                    <em>及格率最好 <b>${S((c==null?void 0:c.teacherName)||"-")} #${(i=c==null?void 0:c.countyRankPass)!=null?i:"-"}</b></em>
                </div>
            </div>
            <div class="table-wrap analysis-table-shell county-focus-table">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>教师</th><th>学科</th><th>均分</th><th>优秀率</th><th>及格率</th><th>县均排</th><th>县优排</th><th>县及格排</th></tr></thead>
                    <tbody>
                        ${o.map(d=>{var u,w,f;return`
                            <tr>
                                <td>${S(d.teacherName)}</td>
                                <td>${S(d.subject)}</td>
                                <td>${m(d.avg,1)}</td>
                                <td>${R(d.excellentRate)}</td>
                                <td>${R(d.passRate)}</td>
                                <td>${(u=d.countyRankAvg)!=null?u:"-"}</td>
                                <td>${(w=d.countyRankExc)!=null?w:"-"}</td>
                                <td>${(f=d.countyRankPass)!=null?f:"-"}</td>
                            </tr>
                        `}).join("")}
                    </tbody>
                </table>
            </div>
        `}function $e(){if(!_()&&E()&&typeof window.analyzeTeachers=="function")try{window.analyzeTeachers({render:!1}),_()&&Z(x())}catch(a){console.warn("[county-analysis] sync teacher analysis failed:",a)}const t=j(10);if(!t.length)return'<div class="county-empty">暂无任课表或教师画像数据。导入任课表后，这里会展示县域样本下的教师教学画像。</div>';const e=bt(),n=Ct().map(a=>`
            <div class="analysis-anchor-panel county-teacher-subject-rank">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">${S(a.subject)} 同学科县域排名</div>
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
                            ${a.rows.map(c=>{var r,o,l;return`
                                <tr class="${c.type==="teacher"?"county-teacher-own-row":""}">
                                    <td>${(r=c.rankAvg)!=null?r:"-"}</td>
                                    <td>${S(c.name||"")}</td>
                                    <td>${c.type==="teacher"?"本校教师":"学校整体"}</td>
                                    <td>${m(c.avg,1)}</td>
                                    <td>${(o=c.rankExc)!=null?o:"-"}</td>
                                    <td>${R(c.excellentRate)}</td>
                                    <td>${(l=c.rankPass)!=null?l:"-"}</td>
                                    <td>${R(c.passRate)}</td>
                                    <td>${c.studentCount||0}</td>
                                </tr>
                            `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join("");return`
            <div class="county-portrait-grid">
                ${t.map((a,c)=>{var r,o,l;return`
                    <article class="county-portrait-card ${a.riskLevel==="risk"?"is-risk":""}">
                        <span class="county-portrait-rank">#${c+1}</span>
                        <h4>${S(a.teacherName)} / ${S(a.subject)}</h4>
                        <strong>${m(a.score,1)}</strong>
                        <p>均分 ${m(a.avg,1)} · 优秀率 ${R(a.excellentRate)} · 及格率 ${R(a.passRate)} · 样本 ${a.studentCount}</p>
                        <div class="county-portrait-rankline">
                            <span>县均排 #${(r=a.countyRankAvg)!=null?r:"-"}</span>
                            <span>优排 #${(o=a.countyRankExc)!=null?o:"-"}</span>
                            <span>及排 #${(l=a.countyRankPass)!=null?l:"-"}</span>
                        </div>
                    </article>
                `}).join("")}
            </div>
            ${Ne(e)}
            ${n?`
                <div class="analysis-table-meta">
                    <span><strong>同学科完整排名：</strong>每个学科单独成表，本校教师与其他学校同学科整体放在同一张县域榜里。</span>
                </div>
                ${n}
            `:""}
        `}function Ye(){const t=mt().slice(0,40);if(!t.length)return'<div class="county-empty">暂无学生成绩数据。</div>';const e=window.SUBJECTS||[];return`
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
                                <td>${m(n.total,1)}</td>
                                ${e.map(a=>{var c,r,o,l;return`
                                    <td>${((r=(c=n==null?void 0:n.ranks)==null?void 0:c[a])==null?void 0:r.township)||"-"}</td>
                                    <td>${((l=(o=n==null?void 0:n.ranks)==null?void 0:o[a])==null?void 0:l.county)||"-"}</td>
                                `}).join("")}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `}function Xe(){const t=kt().slice(0,20);return t.length?`
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>学校</th><th>本次县排名</th><th>上次县排名</th><th>变化</th><th>本次两率一分</th></tr></thead>
                    <tbody>
                        ${t.map(({current:e,previous:n})=>{const a=h(n.countyRank)-h(e.countyRank);return`
                                <tr>
                                    <td>${S(e.name)}</td>
                                    <td>${e.countyRank||"-"}</td>
                                    <td>${n.countyRank||"-"}</td>
                                    <td class="${a>0?"text-green":a<0?"text-red":""}">${a>0?`上升 ${a}`:a<0?`下降 ${Math.abs(a)}`:"持平"}</td>
                                    <td>${m(e.score2Rate)}</td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        `:'<div class="county-empty">县域历史样本不足。后续再次导入县域成绩后，这里会自动显示县排名变化。</div>'}function $t(){const t=["county-teacher-portrait","county-school-horizontal","county-analysis"].find(e=>{var n,a;return(a=(n=document.getElementById(e))==null?void 0:n.classList)==null?void 0:a.contains("active")});return t==="county-analysis"?"county-teacher-portrait":t||"county-teacher-portrait"}function _e(t=$t()){var n;const e=document.getElementById(t)||document.getElementById("county-analysis");return((n=e==null?void 0:e.querySelector)==null?void 0:n.call(e,".county-analysis-root"))||document.getElementById("county-analysis-root")}function _t(){const t=document.getElementById("county-analysis");!t||t.dataset.countySubmoduleHost==="1"||(t.dataset.countySubmoduleHost="1",Object.entries(at).forEach(([e,n])=>{if(document.getElementById(e))return;const a=document.createElement("div");a.id=e,a.className="section card-box analysis-workspace analysis-workspace-county",a.innerHTML=`
                <div class="module-desc-bar analysis-hero" style="border-color:#0f766e;">
                    <h3><i class="ti ti-map-2"></i> ${S(n.title)} <span class="badge" style="background:#0f766e;">${S(n.badge)}</span></h3>
                    <p>${S(n.description)}</p>
                </div>
                <div class="county-analysis-root">
                    <div class="info-bar analysis-info-band">导入县级成绩后，这里只呈现县域专用分析，不改变联考分析、教学管理和学情诊断的原有口径。</div>
                </div>
            `,t.insertAdjacentElement("afterend",a)}))}function Ot(t){const e=$();if(y.subjectRowCacheSignature!==e&&(y.subjectRowCacheSignature=e,y.subjectRowCache=new Map),y.subjectRowCache.has(t))return y.subjectRowCache.get(t);const n=Object.values(window.SCHOOLS||{}).filter(r=>{var o;return(o=r==null?void 0:r.metrics)==null?void 0:o[t]}).map(r=>({school:r,metric:r.metrics[t]}));if(!n.length)return y.subjectRowCache.set(t,[]),[];const a=n.reduce((r,o)=>(r.avg=Math.max(r.avg,h(o.metric.avg)),r.excellent=Math.max(r.excellent,h(o.metric.excRate)),r.pass=Math.max(r.pass,h(o.metric.passRate)),r),{avg:0,excellent:0,pass:0}),c=n.map(r=>{const o=wt(r.metric,a);return{schoolName:r.school.name||"",count:h(r.metric.count),avg:h(r.metric.avg),excellentRate:h(r.metric.excRate),passRate:h(r.metric.passRate),ratedAvg:o.ratedAvg,ratedExc:o.ratedExc,ratedPass:o.ratedPass,score:o.ratedAvg+o.ratedExc+o.ratedPass}});return k(c,r=>r.avg,(r,o)=>{r.rankAvg=o}),k(c,r=>r.excellentRate,(r,o)=>{r.rankExcellent=o}),k(c,r=>r.passRate,(r,o)=>{r.rankPass=o}),k(c,r=>r.score,(r,o)=>{r.rank=o}),c.sort((r,o)=>(r.rank||9999)-(o.rank||9999)),y.subjectRowCache.set(t,c),c}function tt(t={}){var s,i,d;const e=t.required!==!1,n=t.silent===!0,a=document.getElementById("countySchoolNameInput"),c=String((a==null?void 0:a.value)||"").trim();if(!c)return e?(!n&&((s=window.UI)!=null&&s.toast)&&window.UI.toast("请输入本校名称","warning"),!1):!0;const r=C();let o=c;if(r.length&&!r.includes(c)&&(typeof window.resolveSchoolNameFromCollection=="function"&&(o=window.resolveSchoolNameFromCollection(r,c)||c),!r.includes(o)&&typeof window.getCanonicalSchoolName=="function"&&(o=window.getCanonicalSchoolName(c,r)||o)),r.length&&!r.includes(o))return!n&&((i=window.UI)!=null&&i.toast)&&window.UI.toast("当前县级成绩中没有匹配到该学校，请核对名称","warning"),!1;window.MY_SCHOOL=o;try{localStorage.setItem("MY_SCHOOL",o)}catch(u){}typeof window.writeCurrentSchool=="function"&&window.writeCurrentSchool(o);const l=document.getElementById("mySchoolSelect");return l&&Array.from(l.options||[]).some(u=>u.value===o)&&(l.value=o),a&&(a.value=o),!n&&((d=window.UI)!=null&&d.toast)&&window.UI.toast(`已锁定本校：${o}`,"success"),!0}function It(){var e;tt({required:!1,silent:!0})&&(y.subjectRowCache=new Map,O(),Y(),I("county-school-horizontal"),(e=window.UI)!=null&&e.toast&&window.UI.toast("县域学校横向对比表已生成","success"))}function Mt(){return{buildCountyHorizontalTotalRows:ht,buildCountySubjectRows:Ot,sortCountySubjects:F,resolveCurrentCountySchoolName:yt,getExamKey:v,escapeHtml:S,toNumber:h,formatNumber:m,formatCountyRankDisplay:Se}}function Ke(t=""){const e=window.CountySchoolHorizontalRenderer;return!e||typeof e.renderTotalTable!="function"?'<div class="county-empty">县域学校横向分析组件加载中，请稍后重试。</div>':e.renderTotalTable(Mt(),t)}function Oe(){const t=window.CountySchoolHorizontalRenderer;return!t||typeof t.renderSchoolHorizontal!="function"?'<div class="county-empty">县域学校横向分析组件加载中，请稍后重试。</div>':t.renderSchoolHorizontal(Mt())}function Ie(){return`
            <div class="county-kpi-grid">
                <div><span>教师样本</span><strong>${j(Number.POSITIVE_INFINITY).length}</strong><em>本校教师-学科</em></div>
                <div><span>对标范围</span><strong>${C().length}</strong><em>县域所有学校</em></div>
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
                ${$e()}
            </div>
        `}function I(t=$t()){var e,n,a;if(!y.isRendering){y.isRendering=!0;try{_t();const c=t==="county-analysis"?"county-teacher-portrait":t,r=_e(c);if(!r)return;const o=O();c==="county-teacher-portrait"&&window.setTimeout(()=>{Rt().then(w=>{const f=["county-teacher-portrait","county-analysis"].some(g=>{var N,T;return(T=(N=document.getElementById(g))==null?void 0:N.classList)==null?void 0:T.contains("active")});w!=null&&w.changed&&f&&!y.isRendering&&I(c)})},0);const l=C(),s=((e=o.countySchools)==null?void 0:e.length)||0,i=((n=o.townshipSchools)==null?void 0:n.length)||0,d=(window.RAW_DATA||[]).length,u=`
            <div class="county-kpi-grid">
                <div><span>本次范围</span><strong>${o.includesCounty?"县域 + 乡镇":"乡镇"}</strong><em>${S(v())}</em></div>
                <div><span>学校数</span><strong>${l.length}</strong><em>乡镇 ${i} · 县域 ${s}</em></div>
                <div><span>学生样本</span><strong>${d}</strong><em>已补充 countyRank / townshipRank</em></div>
                <div><span>当前子模块</span><strong>${S(((a=at[c])==null?void 0:a.title)||"县域教师画像")}</strong><em>不影响其他母模块</em></div>
            </div>
            ${c==="county-school-horizontal"?Oe():Ie()}
        `;r.innerHTML=u}finally{y.isRendering=!1}}}function Me(){}function He(){}function et(t,e){var n;return t!=null&&t.ranks?e==="total"?t.countyRank||"-":((n=t.ranks[e])==null?void 0:n.county)||"-":"-"}function Ge(){var L,U,z,D;if(!(window.RAW_DATA||[]).length){alert("请先上传数据");return}O();const t=typeof window.getCurrentUser=="function"?window.getCurrentUser():null,e=(t==null?void 0:t.role)||"guest",n=e==="teacher",a=e==="class_teacher",c=a&&typeof window.getClassTeacherStudentViewMode=="function"?window.getClassTeacherStudentViewMode():"teaching",o=(n||a&&c==="teaching")&&typeof window.getTeacherScopeForUser=="function"?window.getTeacherScopeForUser(t):null,l=n||a&&c==="teaching"?(window.SUBJECTS||[]).filter(p=>{var b;return(b=o==null?void 0:o.subjects)==null?void 0:b.has(window.normalizeSubject?window.normalizeSubject(p):p)}):window.SUBJECTS||[],s=((L=document.getElementById("studentSchoolSelect"))==null?void 0:L.value)||"",i=((U=document.getElementById("studentClassSelect"))==null?void 0:U.value)||"",d=typeof window.isSingleSchoolMode=="function"?window.isSingleSchoolMode():Object.keys(window.SCHOOLS||{}).length<=1;let u=[...window.RAW_DATA||[]];if((n||a&&c==="teaching")&&((z=o==null?void 0:o.classes)==null?void 0:z.size)>0)u=u.filter(p=>{const b=String(p.class||"").trim(),X=typeof window.normalizeClass=="function"?window.normalizeClass(p.class):b;return o.classes.has(X)||o.classes.has(b)?!0:Array.from(o.classes).some(K=>String(K).replace(/[\s\.]/g,"")===b.replace(/[\s\.]/g,""))});else if(a&&(t!=null&&t.class)&&typeof window.normalizeClass=="function"){const p=window.normalizeClass(t.class);u=u.filter(b=>window.normalizeClass(b.class)===p)}s&&!s.includes("请选择")&&(u=u.filter(p=>p.school===s)),i&&i!=="全部"&&(u=u.filter(p=>p.class===i)),typeof window.getComparisonStudentList=="function"&&(u=window.getComparisonStudentList(u,window.RAW_DATA||[])),u.sort((p,b)=>(Number(b.total)||0)-(Number(p.total)||0));const w=typeof window.hasStudentCountyRankData=="function"?window.hasStudentCountyRankData(u,l):u.some(p=>et(p,"total")!=="-"),f=n||a?["学校","班级","姓名"]:["学校","班级","姓名","考号","考场","相对总分"];l.forEach(p=>{n||a?f.push(`${p} 分数`,`${p} 班排`,`${p} 级排`):f.push(`${p} 分数`,`${p} 相对分`,`${p} 校排`,`${p} 班排`),d||f.push(`${p} 镇排`),w&&f.push(`${p} 县排`)});const g=String(((D=window.CONFIG)==null?void 0:D.name)||"").includes("9")?"五科总分":"总分";n||a?f.push(g,"总分班排","总分级排"):f.push(g,`${g}校排`,`${g}班排`),d||f.push(`${g}镇排`),w&&f.push(`${g}县排`);const N=[f];u.forEach(p=>{var X,K,Lt,Ut,zt,Dt,Ft,Bt,Yt,Xt,Kt,Gt,Vt,Jt,Wt;const b=n||a?[p.school,p.class,p.name]:[p.school,p.class,p.name,p.id,p.examRoom,p.totalTScore||0];l.forEach(A=>{var qt,Qt,Zt,te,ee,ne,oe,ae,re,ce,ie,se,le,ue,de,pe,fe,he,ye,we,ge;n||a?b.push((Qt=(qt=p.scores)==null?void 0:qt[A])!=null?Qt:"-",(ee=(te=(Zt=p==null?void 0:p.ranks)==null?void 0:Zt[A])==null?void 0:te.class)!=null?ee:"-",(ae=(oe=(ne=p==null?void 0:p.ranks)==null?void 0:ne[A])==null?void 0:oe.school)!=null?ae:"-"):b.push((ce=(re=p.scores)==null?void 0:re[A])!=null?ce:"-",(se=(ie=p==null?void 0:p.tScores)==null?void 0:ie[A])!=null?se:"-",(de=(ue=(le=p==null?void 0:p.ranks)==null?void 0:le[A])==null?void 0:ue.school)!=null?de:"-",(he=(fe=(pe=p==null?void 0:p.ranks)==null?void 0:pe[A])==null?void 0:fe.class)!=null?he:"-"),d||b.push((ge=(we=(ye=p==null?void 0:p.ranks)==null?void 0:ye[A])==null?void 0:we.township)!=null?ge:"-"),w&&b.push(et(p,A))}),n||a?b.push(p.total,(Lt=(K=(X=p==null?void 0:p.ranks)==null?void 0:X.total)==null?void 0:K.class)!=null?Lt:"-",(Dt=(zt=(Ut=p==null?void 0:p.ranks)==null?void 0:Ut.total)==null?void 0:zt.school)!=null?Dt:"-"):b.push(p.total,(Yt=(Bt=(Ft=p==null?void 0:p.ranks)==null?void 0:Ft.total)==null?void 0:Bt.school)!=null?Yt:"-",(Gt=(Kt=(Xt=p==null?void 0:p.ranks)==null?void 0:Xt.total)==null?void 0:Kt.class)!=null?Gt:"-"),d||b.push((Wt=(Jt=(Vt=p==null?void 0:p.ranks)==null?void 0:Vt.total)==null?void 0:Jt.township)!=null?Wt:"-"),w&&b.push(et(p,"total")),N.push(b)});const T=window.XLSX.utils.book_new(),P=window.XLSX.utils.aoa_to_sheet(N);if(typeof window.decorateExcelSheet=="function"&&window.decorateExcelSheet(P,f),window.XLSX.utils.book_append_sheet(T,P,"学生考试明细"),n||a){const p=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,new Set(l||[])):"teacher";window.XLSX.writeFile(T,`学生考试明细_${p}.xlsx`)}else window.XLSX.writeFile(T,"学生考试明细.xlsx")}function Ht(){const t=document.getElementById("upload-feedback-board");if(!t)return;let e=document.getElementById("upload-county-scope-card");e||(e=document.createElement("div"),e.id="upload-county-scope-card",e.className="upload-feedback-card",t.appendChild(e));const n=x();e.innerHTML=`
            <h4><i class="ti ti-map-2"></i> 县域对比口径</h4>
            <p>${n!=null&&n.includesCounty?`已启用县域排名：乡镇 ${n.townshipSchools.length} 所，县域学校 ${n.countySchools.length} 所。`:"本次暂按乡镇成绩处理。导入新成绩时会询问是否包含县里学校。"}</p>
        `}function nt(t,e){const n=window[t];if(typeof n!="function"||n[`__countyPatched_${t}`])return!1;const a=function(...r){const o=n.apply(this,r),l=s=>(e(...r),s);return o&&typeof o.then=="function"?o.then(l):(l(o),o)};return a[`__countyPatched_${t}`]=!0,window[t]=a,!0}function je(t){const e=window[t];return typeof e=="function"&&!!e[`__countyPatched_${t}`]}function jt(){return nt("processData",()=>{O(),Y(),Nt()}),nt("renderTables",()=>{O()}),nt("switchTab",t=>{(t==="county-analysis"||t==="county-teacher-portrait"||t==="county-school-horizontal")&&setTimeout(()=>I(t),0)}),["processData","renderTables","switchTab"].every(je)}function Pe(){document.addEventListener("change",t=>{const e=t.target;!e||e.id!=="fileInput"||e.files&&e.files.length&&(y.preUploadTownshipSchools=C().filter(n=>!lt(n)),y.promptArmed=!0)},!0)}function Le(){if(document.getElementById("county-analysis-runtime-style"))return;const t=document.createElement("style");t.id="county-analysis-runtime-style",t.textContent=`
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
        `,document.head.appendChild(t)}function Pt(){Le(),_t(),Pe();const t=jt();if(Ht(),t)return;let e=0;const n=setInterval(()=>{e+=1,(jt()||e>40)&&clearInterval(n)},300)}window.CountyAnalysisRuntime={applyCountyRanks:O,renderCountyAnalysis:I,ensureTeacherContextForCountyAnalysis:Rt,promptCountyScopeIfNeeded:Nt,decorateAnalysisTable:Me,decorateStudentDetails:He,saveCountySnapshot:Y,getCurrentScope:x,exportCountyAnalysisSection:Et,setCountyAnalysisSchoolNameFromInput:tt,generateCountySchoolHorizontalTable:It},window.renderCountyAnalysis=I,window.exportCountyAnalysisSection=Et,window.setCountyAnalysisSchoolNameFromInput=tt,window.generateCountySchoolHorizontalTable=It,window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__=!0,document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Pt,{once:!0}):Pt()})();
