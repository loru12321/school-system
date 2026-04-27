(()=>{if(typeof window=="undefined"||window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__)return;const ot="COUNTY_ANALYSIS_SCOPE_V1",G="COUNTY_ANALYSIS_HISTORY_V1",f={promptArmed:!1,lastSignature:"",teacherContextPromise:null,lastTeacherContextSignature:"",lastTeacherContextAt:0,subjectRowCacheSignature:"",subjectRowCache:new Map,horizontalTotalCacheSignature:"",horizontalTotalCache:[],teacherRowsCacheSignature:"",teacherRowsCache:[],teacherSubjectTablesCacheSignature:"",teacherSubjectTablesCache:[],preUploadTownshipSchools:[],isRendering:!1,lastRankSignature:""},at={"county-teacher-portrait":{title:"县域教师画像",badge:"教师县域排名",description:"对照“教师教学质量画像”，把本校教师放到县域所有学校同学科样本中排名，查看学科教师县域站位。"},"county-school-horizontal":{title:"县域学校横向分析",badge:"全县横向对比",description:"对照“两率一分(横向)”，生成五科总综合分析表和各学科明细表，按县域所有学校统一排名。"}},me=["语文","数学","英语","物理","化学","政治"],rt=["语文","数学","英语","物理","化学","历史","地理","生物","政治"];function S(t){return String(t!=null?t:"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function y(t,e=0){const n=Number(t);return Number.isFinite(n)?n:e}function k(t,e,n){if(window.RankingDataService&&typeof window.RankingDataService.assignCompetitionRanks=="function")return window.RankingDataService.assignCompetitionRanks(t,e,n);const o=Array.isArray(t)?t.slice():[];o.sort((r,l)=>Number(e(l)||0)-Number(e(r)||0));let a=null,c=0;return o.forEach((r,l)=>{const s=Number(e(r)),i=a!==null&&Math.abs(s-a)<1e-4?c:l+1;n(r,i),a=s,c=i}),o}function m(t,e=2){const n=Number(t);return Number.isFinite(n)?n.toFixed(e):"-"}function R(t){const e=Number(t);return Number.isFinite(e)?`${(e*100).toFixed(1)}%`:"-"}function Se(t,e,n=!1){const o=Number(t),a=Number.isFinite(o)?n?`${(o*100).toFixed(2)}%`:o.toFixed(2):"-",c=e?` <span style="font-size:0.9em; color:#94a3b8">(${e})</span>`:"";return`${a}${c}`}function V(t){const e=String(t||"").trim();return typeof window.normalizeSubject=="function"?window.normalizeSubject(e):e.replace(/\s+/g,"")}function Re(){var o,a,c;const t=typeof window.getExamMetaFromUI=="function"?window.getExamMetaFromUI():{},e=r=>{try{return localStorage.getItem(r)||""}catch(l){return""}},n=[t==null?void 0:t.grade,(o=window.CURRENT_COHORT_META)==null?void 0:o.grade,(a=window.CONFIG)==null?void 0:a.grade,(c=window.CONFIG)==null?void 0:c.name,e("CURRENT_TEACHER_TERM_ID"),e("CURRENT_TERM_ID")];for(const r of n){const l=String(r||"").match(/([6-9])\s*年?级?/);if(l)return Number(l[1])}return 0}function ct(){const t=Re();return t===9?me:([6,7,8].includes(t),rt)}function F(t){const e=ct().map(V);return Array.from(new Set((t||[]).map(o=>String(o||"").trim()).filter(Boolean))).sort((o,a)=>{const c=B(o),r=B(a);return c!==r?c-r:String(o).localeCompare(String(a),"zh-CN",{numeric:!0})})}function B(t){const n=ct().map(V).indexOf(V(t));return n>=0?n:999}function it(){var e;return String(((e=window.CONFIG)==null?void 0:e.name)||"").trim().includes("9")?{avg:50,excellent:80,pass:50}:{avg:60,excellent:70,pass:70}}function M(t,e=5e3,n=!1){return Promise.race([Promise.resolve(t).catch(()=>n),new Promise(o=>setTimeout(()=>o(n),e))])}function J(t,e){try{const n=localStorage.getItem(t);return n?JSON.parse(n):e}catch(n){return e}}function st(t,e){try{localStorage.setItem(t,JSON.stringify(e))}catch(n){console.warn("[county-analysis] failed to persist state:",n)}}function v(){var t;return String(window.CURRENT_EXAM_ID||(typeof window.readWorkspaceExamId=="function"?window.readWorkspaceExamId():"")||((t=window.COHORT_DB)==null?void 0:t.currentExamId)||"current").trim()||"current"}function b(){return Object.keys(window.SCHOOLS||{}).filter(Boolean).sort((t,e)=>t.localeCompare(e,"zh-CN"))}function lt(t){const e=String(t||"").trim();return/^(?:\u6574\u4f53|\u5168\u90e8|\u6c47\u603b|\u603b\u8868|\u5408\u8ba1|\u5168\u53bf|\u53bf\u57df|Sheet\d*|\u5de5\u4f5c\u8868\d*)$/i.test(e)}function ut(t){return typeof window.normalizeSchoolName=="function"&&window.normalizeSchoolName(t)||String(t||"").trim()}function dt(t){const e=Array.isArray(t)?t.filter(Boolean):b();if(!e.length)return[];if(typeof window.getTownshipManagedSchoolNames=="function"){const r=window.getTownshipManagedSchoolNames(e);if(Array.isArray(r)&&r.length)return r}const n=window.TARGETS&&typeof window.TARGETS=="object"?window.TARGETS:{},o=Object.keys(n);if(!o.length)return[];const a=new Map;e.forEach(r=>{a.set(ut(r),r)});const c=o.map(r=>{if(typeof window.resolveSchoolNameFromCollection=="function"){const l=window.resolveSchoolNameFromCollection(e,r);if(l)return l}if(typeof window.getCanonicalSchoolName=="function"){const l=window.getCanonicalSchoolName(r,e);if(l&&e.includes(l))return l}return a.get(ut(r))||""}).filter(r=>r&&!lt(r));return Array.from(new Set(c)).sort((r,l)=>r.localeCompare(l,"zh-CN"))}function E(){const t=Object.keys(window.TARGETS&&typeof window.TARGETS=="object"?window.TARGETS:{}).sort((n,o)=>String(n).localeCompare(String(o),"zh-CN")),e=Number(window.__RAW_DATA_VERSION||0);return[v(),Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:0,e,b().join("|"),t.join("|")].join("::")}function W(){const t=window.TEACHER_STATS&&typeof window.TEACHER_STATS=="object"?window.TEACHER_STATS:{},e=window.TEACHER_MAP&&typeof window.TEACHER_MAP=="object"?window.TEACHER_MAP:{},n=window.TEACHER_SCHOOL_MAP&&typeof window.TEACHER_SCHOOL_MAP=="object"?window.TEACHER_SCHOOL_MAP:{},o=window.COUNTY_TEACHER_RANKING_DATA&&typeof window.COUNTY_TEACHER_RANKING_DATA=="object"?window.COUNTY_TEACHER_RANKING_DATA:{},a=Object.entries(t).map(([c,r])=>`${c}:${Object.keys(r||{}).sort().join(",")}`).sort().join("|");return[E(),q(),Object.keys(e).length,Object.keys(n).length,Object.keys(t).length,a,Object.keys(o).sort().join(",")].join("::")}function Ce(){f.teacherRowsCacheSignature="",f.teacherRowsCache=[],f.teacherSubjectTablesCacheSignature="",f.teacherSubjectTablesCache=[]}function pt(){const t=J(ot,{});return t&&typeof t=="object"?t:{}}function x(){return pt()[v()]||null}function be(t){const e=pt();e[v()]=t,st(ot,e)}function Le(t){return String(t||"").split(/[,\n，、]+/).map(e=>e.trim()).filter(Boolean)}function ke(t,e=null){const n=Array.isArray(t)?t.filter(Boolean):b();return dt(n)}function H(t){const e=b(),n=dt(e),o=new Set(n),a=s=>o.has(s)?!0:typeof window.isTownshipManagedSchool=="function"?window.isTownshipManagedSchool(s,e):n.some(i=>typeof window.areSchoolNamesMatched=="function"?window.areSchoolNamesMatched(i,s,!0):i===s),c=e.filter(s=>a(s)),r=e.filter(s=>!a(s)),l=!!(t!=null&&t.includesCounty)&&(c.length>0||r.length>0);return{examKey:v(),includesCounty:l,explicitCountyUpload:l&&(t==null?void 0:t.explicitCountyUpload)===!0,townshipSchools:c,countySchools:r,signature:(t==null?void 0:t.signature)||E(),updatedAt:(t==null?void 0:t.updatedAt)||new Date().toISOString()}}function ht(){return Object.values(window.SCHOOLS||{}).slice().sort((t,e)=>(t.countyRank2Rate||9999)-(e.countyRank2Rate||9999))}function ft(){const t=E();if(f.horizontalTotalCacheSignature===t)return f.horizontalTotalCache.map(o=>({...o}));const e=Object.values(window.SCHOOLS||{}).filter(o=>{var a;return(a=o==null?void 0:o.metrics)==null?void 0:a.total}).map(o=>{var c,r,l,s,i;const a=o.metrics.total||{};return{school:o,schoolName:o.name||"",count:y(a.count),avg:y(a.avg),excellentRate:y(a.excRate),passRate:y(a.passRate),ratedAvg:y((c=a.countyRatedAvg)!=null?c:o.countyRatedAvg),ratedExc:y((r=a.countyRatedExc)!=null?r:o.countyRatedExc),ratedPass:y((l=a.countyRatedPass)!=null?l:o.countyRatedPass),score:y((i=(s=a.countyScore2Rate)!=null?s:o.countyScore2Rate)!=null?i:o.score2Rate)}});k(e,o=>o.avg,(o,a)=>{o.rankAvg=a}),k(e,o=>o.excellentRate,(o,a)=>{o.rankExcellent=a}),k(e,o=>o.passRate,(o,a)=>{o.rankPass=a}),k(e,o=>o.score,(o,a)=>{o.rankScore=a});const n=e.sort((o,a)=>(o.rankScore||9999)-(a.rankScore||9999));return f.horizontalTotalCacheSignature=t,f.horizontalTotalCache=n.map(o=>({...o})),n.map(o=>({...o}))}function yt(){const t=b();if(!t.length)return"";const e=[typeof window.readCurrentSchool=="function"?window.readCurrentSchool():"",window.MY_SCHOOL,(()=>{try{return localStorage.getItem("MY_SCHOOL")||""}catch(n){return""}})()].map(n=>String(n||"").trim()).filter(Boolean);for(const n of e){if(t.includes(n))return n;if(typeof window.resolveSchoolNameFromCollection=="function"){const o=window.resolveSchoolNameFromCollection(t,n);if(o)return o}if(typeof window.getCanonicalSchoolName=="function"){const o=window.getCanonicalSchoolName(n,t);if(o&&t.includes(o))return o}}return""}function wt(t,e){const n=it();return{ratedAvg:e.avg?y(t==null?void 0:t.avg)/e.avg*n.avg:0,ratedExc:e.excellent?y(t==null?void 0:t.excRate)/e.excellent*n.excellent:0,ratedPass:e.pass?y(t==null?void 0:t.passRate)/e.pass*n.pass:0}}function gt(t,e,n,o){const a=H(o||x()||{}),c=new Set(a.townshipSchools||[]),r=Object.values(window.SCHOOLS||{}).filter(u=>{var w;return(w=u==null?void 0:u.metrics)==null?void 0:w[t]}).filter(u=>n!=="township"||c.has(u.name));if(!r.length)return null;const l=r.reduce((u,w)=>{var g;const h=((g=w==null?void 0:w.metrics)==null?void 0:g[t])||{};return u.avg=Math.max(u.avg,y(h.avg)),u.excellent=Math.max(u.excellent,y(h.excRate)),u.pass=Math.max(u.pass,y(h.passRate)),u},{avg:0,excellent:0,pass:0}),s=r.map(u=>{var g;const w=((g=u==null?void 0:u.metrics)==null?void 0:g[t])||{},h=wt(w,l);return{name:u.name,metric:w,score:h.ratedAvg+h.ratedExc+h.ratedPass}}).sort((u,w)=>w.score-u.score);let i=s.find(u=>u.name===e);return!i&&typeof window.areSchoolNamesMatched=="function"&&(i=s.find(u=>window.areSchoolNamesMatched(u.name,e,!0))),i?{rank:s.findIndex(u=>u===i)+1,total:s.length,score:i.score,metric:i.metric}:null}function Ue(t){var r,l;const e=yt(),n=e?(window.SCHOOLS||{})[e]:null;if(!n)return'<div class="county-empty">未锁定本校。请先在数据管理里设置本校，县域分析会自动补充本校学科对比。</div>';const o=((r=n.metrics)==null?void 0:r.total)||{},a=n.countyScope!=="county",c=(window.SUBJECTS||[]).map(s=>{var w,h,g;const i=gt(s,e,"county",t),d=a?gt(s,e,"township",t):null;if(!i&&!d)return"";const u=i||d;return`
                    <tr>
                        <td>${S(s)}</td>
                        <td>${m((w=u==null?void 0:u.metric)==null?void 0:w.avg,1)}</td>
                        <td>${R((h=u==null?void 0:u.metric)==null?void 0:h.excRate)}</td>
                        <td>${R((g=u==null?void 0:u.metric)==null?void 0:g.passRate)}</td>
                        <td>${d?`${d.rank}/${d.total}`:"-"}</td>
                        <td>${i?`${i.rank}/${i.total}`:"-"}</td>
                    </tr>
                `}).filter(Boolean).join("");return`
            <div class="county-focus-card">
                <div>
                    <span>本校县域站位</span>
                    <strong>${S(e)}</strong>
                    <p>${a?"本校属于乡镇学校：普通模块只按乡镇计算，县域分析里同时显示县排名。":"本校当前按县直学校处理：仅在县域分析和学生县排名场景参与。"}</p>
                </div>
                <div class="county-focus-metrics">
                    <em>乡镇总排 <b>${a&&n.townshipRank2Rate||"-"}</b></em>
                    <em>县域总排 <b>${n.countyRank2Rate||"-"}</b></em>
                    <em>两率一分 <b>${m((l=n.countyScore2Rate)!=null?l:n.score2Rate)}</b></em>
                    <em>样本 <b>${o.count||0}</b></em>
                </div>
            </div>
            ${c?`
                <div class="table-wrap analysis-table-shell county-focus-table">
                    <table class="analysis-generated-table county-analysis-table">
                        <thead><tr><th>学科</th><th>均分</th><th>优秀率</th><th>及格率</th><th>乡镇学科排</th><th>县域学科排</th></tr></thead>
                        <tbody>${c}</tbody>
                    </table>
                </div>
            `:""}
        `}function mt(){return(window.RAW_DATA||[]).filter(t=>Number.isFinite(Number(t==null?void 0:t.total))).slice().sort((t,e)=>{const n=Number(t.townshipRank||9999),o=Number(e.townshipRank||9999);return n!==o?n-o:(t.countyRank||9999)-(e.countyRank||9999)})}function N(){return Object.keys(Q().map||{}).length>0}function _(){return!!window.TEACHER_STATS&&Object.keys(window.TEACHER_STATS).length>0}function q(){var t;return typeof window.readCurrentSchool=="function"?String(window.readCurrentSchool()||"").trim():String(window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||((t=document.getElementById("mySchoolSelect"))==null?void 0:t.value)||"").trim()}function Q(){const t=window.TEACHER_MAP&&typeof window.TEACHER_MAP=="object"?window.TEACHER_MAP:{},e=window.TEACHER_SCHOOL_MAP&&typeof window.TEACHER_SCHOOL_MAP=="object"?window.TEACHER_SCHOOL_MAP:{},n=q(),o=Object.values(e).map(r=>String(r||"").trim()).filter(Boolean);if(!n||!o.length)return{map:t,schoolMap:e,schoolName:n,scoped:!1,matched:Object.keys(t).length>0};const a={},c={};return Object.entries(t).forEach(([r,l])=>{String(e[r]||"").trim()===n&&(a[r]=l,c[r]=e[r])}),{map:a,schoolMap:c,schoolName:n,scoped:!0,matched:Object.keys(a).length>0}}function St(){const t=Q();return!t.scoped||!t.matched||Object.keys(t.map).length===Object.keys(window.TEACHER_MAP||{}).length||(typeof window.setTeacherMap=="function"?window.setTeacherMap(t.map):window.TEACHER_MAP=t.map,typeof window.setTeacherSchoolMap=="function"?window.setTeacherSchoolMap(t.schoolMap):window.TEACHER_SCHOOL_MAP=t.schoolMap,typeof window.setTeacherStats=="function"?window.setTeacherStats({}):window.TEACHER_STATS={}),t}function xe(){var e;const t=String(((e=window.location)==null?void 0:e.hostname)||"").trim().toLowerCase();return t&&t!=="127.0.0.1"&&t!=="localhost"}async function Te(){if(typeof window.analyzeTeachers=="function")return!0;try{window.SystemRuntimeLoader&&typeof window.SystemRuntimeLoader.load=="function"?await M(window.SystemRuntimeLoader.load("teacher-analysis"),6e3,!1):typeof window.ensureTeacherAnalysisRuntimeLoaded=="function"&&await M(window.ensureTeacherAnalysisRuntimeLoaded(),6e3,!1)}catch(t){console.warn("[county-analysis] teacher runtime load failed:",t)}return typeof window.analyzeTeachers=="function"}async function Rt(t=!1){const e=q(),n=Q(),o=`${E()}::${e}::${Object.keys(n.map||{}).length}::${Object.keys(window.TEACHER_STATS||{}).length}`,a=Date.now();if(!t&&f.lastTeacherContextSignature===o&&a-Number(f.lastTeacherContextAt||0)<3e4&&(N()||_()))return{hasTeacherAssignments:N(),hasTeacherStats:_(),changed:!1,cached:!0};if(!t&&f.teacherContextPromise)return f.teacherContextPromise;f.teacherContextPromise=(async()=>{let c=!1;if(!N()&&!e&&typeof window.tryAutoRestoreTeacherMap=="function")try{c=!!await M(window.tryAutoRestoreTeacherMap(),4e3,!1)||c}catch(r){console.warn("[county-analysis] tryAutoRestoreTeacherMap failed:",r)}if(!N()&&xe()&&window.CloudManager&&typeof window.CloudManager.loadTeachers=="function")try{c=!!await M(window.CloudManager.loadTeachers({background:!0,toast:!1,blocking:!1,schoolName:e}),1e4,!1)||c,!N()&&e&&(c=!!await M(window.CloudManager.loadTeachers({background:!0,toast:!1,blocking:!1,schoolName:""}),1e4,!1)||c)}catch(r){console.warn("[county-analysis] loadTeachers failed:",r)}if(St(),!_()&&N())try{await Te()&&typeof window.analyzeTeachers=="function"&&(window.analyzeTeachers(),c=!0)}catch(r){console.warn("[county-analysis] analyzeTeachers failed:",r)}return _()&&Z(x()),{hasTeacherAssignments:N(),hasTeacherStats:_(),changed:c}})();try{const c=await f.teacherContextPromise;return(c!=null&&c.hasTeacherAssignments||c!=null&&c.hasTeacherStats)&&(f.lastTeacherContextSignature=o,f.lastTeacherContextAt=Date.now()),c}finally{f.teacherContextPromise=null}}function j(t=12){St();const e=W();let n=f.teacherRowsCache;if(f.teacherRowsCacheSignature!==e){const o=window.COUNTY_TEACHER_RANKINGS||{},a=[];Object.entries(window.TEACHER_STATS||{}).forEach(([c,r])=>{Object.entries(r||{}).forEach(([l,s])=>{var d,u,w,h,g,$,T,z,P,L,U,D;const i=((d=o==null?void 0:o[c])==null?void 0:d[l])||{};a.push({teacherName:c,subject:l,score:y((g=(h=(w=(u=s.finalScore)!=null?u:s.fairScore)!=null?w:s.leagueScore)!=null?h:s.avgValue)!=null?g:s.avg),avg:y(($=s.avgValue)!=null?$:s.avg),passRate:y(s.passRate),excellentRate:y((T=s.excellentRate)!=null?T:s.excRate),studentCount:y((z=s.studentCount)!=null?z:s.count),riskLevel:s.riskLevel||"normal",countyRankAvg:(P=i.rankAvg)!=null?P:null,countyRankExc:(L=i.rankExc)!=null?L:null,countyRankPass:(U=i.rankPass)!=null?U:null,benchmarkCount:(D=i.benchmarkCount)!=null?D:0})})}),n=a.sort((c,r)=>{const l=Number.isFinite(c.countyRankAvg)?c.countyRankAvg:9999,s=Number.isFinite(r.countyRankAvg)?r.countyRankAvg:9999;return l!==s?l-s:r.score-c.score}),f.teacherRowsCacheSignature=e,f.teacherRowsCache=n}return!Number.isFinite(t)||t<=0?n.slice():n.slice(0,t)}function Z(t){const e=H(t||x()||{includesCounty:!1,townshipSchools:b()}),n=`${W()}::${(e.townshipSchools||[]).join("|")}::${e.includesCounty?"county":"township"}`;if(f.lastRankSignature===n&&window.COUNTY_TEACHER_RANKINGS&&window.COUNTY_TEACHER_RANKING_DATA)return window.COUNTY_TEACHER_RANKINGS;const o=new Set(e.townshipSchools||[]),a={},c={};return F(window.SUBJECTS||[]).forEach(r=>{const l=[];Object.entries(window.TEACHER_STATS||{}).forEach(([s,i])=>{var u,w,h;const d=i==null?void 0:i[r];d&&l.push({name:s,type:"teacher",subject:r,avg:y((u=d.avgValue)!=null?u:d.avg),excellentRate:y((w=d.excellentRate)!=null?w:d.excRate),passRate:y(d.passRate),studentCount:y((h=d.studentCount)!=null?h:d.count),scope:"teacher"})}),Object.values(window.SCHOOLS||{}).forEach(s=>{var d;const i=(d=s==null?void 0:s.metrics)==null?void 0:d[r];i&&l.push({name:s.name||"",type:"school",subject:r,avg:y(i.avg),excellentRate:y(i.excRate),passRate:y(i.passRate),studentCount:y(i.count),scope:o.has(s.name)?"township":"county"})}),l.length&&(l.sort((s,i)=>i.avg-s.avg),l.forEach((s,i)=>{s.rankAvg=i+1}),l.sort((s,i)=>i.excellentRate-s.excellentRate),l.forEach((s,i)=>{s.rankExc=i+1}),l.sort((s,i)=>i.passRate-s.passRate),l.forEach((s,i)=>{s.rankPass=i+1}),l.sort((s,i)=>(s.rankAvg||9999)!==(i.rankAvg||9999)?(s.rankAvg||9999)-(i.rankAvg||9999):s.type!==i.type?s.type==="teacher"?-1:1:String(s.name||"").localeCompare(String(i.name||""),"zh-CN")),l.forEach(s=>{s.type==="teacher"&&(a[s.name]||(a[s.name]={}),a[s.name][r]={rankAvg:s.rankAvg,rankExc:s.rankExc,rankPass:s.rankPass,benchmarkCount:l.length})}),c[r]=l)}),window.COUNTY_TEACHER_RANKINGS=a,window.COUNTY_TEACHER_RANKING_DATA=c,f.lastRankSignature=n,Ce(),a}function Ct(){return j(Number.POSITIVE_INFINITY).filter(t=>Number.isFinite(t.countyRankAvg)).sort((t,e)=>{const n=B(t.subject)-B(e.subject);return n!==0?n:(t.countyRankAvg||9999)!==(e.countyRankAvg||9999)?(t.countyRankAvg||9999)-(e.countyRankAvg||9999):e.score-t.score})}function bt(){const t=W();if(f.teacherSubjectTablesCacheSignature===t)return f.teacherSubjectTablesCache.map(a=>({subject:a.subject,rows:(a.rows||[]).slice()}));const e=window.COUNTY_TEACHER_RANKING_DATA||{},o=F([...Object.keys(e),...j(Number.POSITIVE_INFINITY).map(a=>a.subject)]).map(a=>{const c=(e[a]||[]).slice().sort((r,l)=>(r.rankAvg||9999)!==(l.rankAvg||9999)?(r.rankAvg||9999)-(l.rankAvg||9999):r.type!==l.type?r.type==="teacher"?-1:1:String(r.name||"").localeCompare(String(l.name||""),"zh-CN",{numeric:!0}));return{subject:a,rows:c}}).filter(a=>a.rows.length);return f.teacherSubjectTablesCacheSignature=t,f.teacherSubjectTablesCache=o,o.map(a=>({subject:a.subject,rows:(a.rows||[]).slice()}))}function Ae(t){const e=(window.SUBJECTS||[]).map(n=>{var a,c;const o=(c=(a=t==null?void 0:t.ranks)==null?void 0:a[n])==null?void 0:c.county;return Number.isFinite(Number(o))?`${n}#${o}`:""}).filter(Boolean);return e.length?e.join(" / "):"-"}function kt(){const t=J(G,[]).filter(a=>{var c;return(c=a==null?void 0:a.schools)==null?void 0:c.length});if(t.length<2)return[];const e=t[t.length-1],n=t[t.length-2],o=new Map((n.schools||[]).map(a=>[a.name,a]));return(e.schools||[]).map(a=>({current:a,previous:o.get(a.name)})).filter(a=>a.previous).sort((a,c)=>(a.current.countyRank||9999)-(c.current.countyRank||9999))}function xt(){return[["学校名称","实考人数","平均分","平均分排名","优秀率","优秀率排名","及格率","及格率排名","平均分赋分","优秀率赋分","及格率赋分","两率一分总分","县域排名"],...ft().map(t=>[t.schoolName||"",t.count||0,m(t.avg),t.rankAvg||"-",R(t.excellentRate),t.rankExcellent||"-",R(t.passRate),t.rankPass||"-",m(t.ratedAvg),m(t.ratedExc),m(t.ratedPass),m(t.score),t.rankScore||"-"])]}function ve(t){return[["学校名称","实考人数","平均分","平均分排名","优秀率","优秀率排名","及格率","及格率排名","平均分赋分","优秀率赋分","及格率赋分","两率一分","县域排名"],...Ot(t).map(e=>[e.schoolName||"",e.count||0,m(e.avg,2),e.rankAvg||"-",R(e.excellentRate),e.rankExcellent||"-",R(e.passRate),e.rankPass||"-",m(e.ratedAvg),m(e.ratedExc),m(e.ratedPass),m(e.score),e.rank||"-"])]}function De(){return[["学校","范围","人数","平均分","优秀率","及格率","两率一分","乡镇排名","县排名"],...ht().map(t=>{var o,a;const e=((o=t.metrics)==null?void 0:o.total)||{},n=t.countyScope!=="county";return[t.name||"",n?"本乡镇":"县域学校",e.count||0,m(e.avg),R(e.excRate),R(e.passRate),m((a=t.countyScore2Rate)!=null?a:t.score2Rate),n&&t.townshipRank2Rate||"-",t.countyRank2Rate||t.rank2Rate||"-"]})]}function Tt(){return[{name:"五科总-综合分析表",rows:xt()},...F(window.SUBJECTS||[]).map(t=>({name:`${t}学科明细`,rows:ve(t)}))]}function At(){return[["序位","教师/学校","类型","学科","综合得分","均分","优秀率","及格率","样本人数","县域均分排","县域优秀率排","县域及格率排","对标总量","风险级别"],...j(Number.POSITIVE_INFINITY).map((t,e)=>{var n,o,a;return[e+1,t.teacherName||"","本校教师",t.subject||"",m(t.score,1),m(t.avg,1),R(t.excellentRate),R(t.passRate),t.studentCount||0,(n=t.countyRankAvg)!=null?n:"-",(o=t.countyRankExc)!=null?o:"-",(a=t.countyRankPass)!=null?a:"-",t.benchmarkCount||"-",t.riskLevel||"normal"]}),[],["同学科完整县域排名"],["学科","排名","教师/学校","类型","均分","优秀率","及格率","样本人数"],...bt().flatMap(t=>t.rows.map(e=>[t.subject,e.rankAvg||"-",e.name||"",e.type==="teacher"?"本校教师":"学校整体",m(e.avg,1),R(e.excellentRate),R(e.passRate),e.studentCount||0]))]}function Fe(){const t=window.SUBJECTS||[];return[["乡镇排名","县排名","学生","学校","班级","总分","学科县排速览",...t.flatMap(e=>[`${e}乡排`,`${e}县排`])],...mt().map(e=>[e.townshipRank||"-",e.countyRank||"-",e.name||"",e.school||"",e.class||"",m(e.total,1),Ae(e),...t.flatMap(n=>{var o,a,c,r,l,s;return[(c=(a=(o=e==null?void 0:e.ranks)==null?void 0:o[n])==null?void 0:a.township)!=null?c:"-",(s=(l=(r=e==null?void 0:e.ranks)==null?void 0:r[n])==null?void 0:l.county)!=null?s:"-"]})])]}function vt(){return[["学校","本次县排名","上次县排名","变化","本次两率一分"],...kt().map(({current:t,previous:e})=>{const n=y(e.countyRank)-y(t.countyRank),o=n>0?`上升 ${n}`:n<0?`下降 ${Math.abs(n)}`:"持平";return[t.name||"",t.countyRank||"-",e.countyRank||"-",o,m(t.score2Rate)]})]}function Ee(t,e){var o;if(!window.XLSX||typeof((o=window.XLSX.utils)==null?void 0:o.book_new)!="function")throw new Error("XLSX export unavailable");const n=window.XLSX.utils.book_new();(Array.isArray(e)?e:[]).forEach((a,c)=>{const r=Array.isArray(a==null?void 0:a.rows)?a.rows:[],l=window.XLSX.utils.aoa_to_sheet(r),s=r.reduce((d,u)=>Math.max(d,Array.isArray(u)?u.length:0),0);s>0&&(l["!cols"]=Array.from({length:s},()=>({wch:16})));const i=String((a==null?void 0:a.name)||`Sheet${c+1}`).trim()||`Sheet${c+1}`;window.XLSX.utils.book_append_sheet(n,l,i.slice(0,31))}),window.XLSX.writeFile(n,t)}function Et(t){var c,r;const e=v(),n=String(t||"").trim();if(n==="student"){(c=window.UI)!=null&&c.toast&&window.UI.toast("学生县排名已移到“学生档案查询”的学生考试明细中，县域分析不再单独导出学生档案县排。","info");return}const o={rank:{fileName:`县域两率一分排名_${e}.xlsx`,sheets:[{name:"县域排名",rows:xt()}]},school:{fileName:`县域学校横向分析_${e}.xlsx`,sheets:Tt()},teacher:{fileName:`县域教师画像_${e}.xlsx`,sheets:[{name:"教师画像",rows:At()}]},history:{fileName:`县域历史对比_${e}.xlsx`,sheets:[{name:"历史对比",rows:vt()}]},all:{fileName:`县域分析_${e}.xlsx`,sheets:[...Tt(),{name:"教师画像",rows:At()},{name:"历史对比",rows:vt()}]}},a=o[n]||o.all;Ee(a.fileName,a.sheets),(r=window.UI)!=null&&r.toast&&window.UI.toast("✅ 县域分析导出完成","success")}async function Nt(){var i;const t=E(),e=b();if(!f.promptArmed||!e.length||t===f.lastSignature)return x();f.promptArmed=!1,f.lastSignature=t;const n=x();if((n==null?void 0:n.signature)===t)return H(n);const o=ke(e,n),a=new Set(o),c=o.length?e.filter(d=>!a.has(d)):[],r=c.length>0,l=o;r&&((i=window.UI)!=null&&i.toast)&&window.UI.toast(`已按目标人数管理自动识别：乡镇 ${l.length} 所，县直/县域 ${c.length} 所`,"info");const s=H({includesCounty:r,explicitCountyUpload:r,townshipSchools:l,signature:t,updatedAt:new Date().toISOString()});return be(s),O(),Y(),I(),Ht(),s}function O(){const t=E();if(t&&t===f.lastRankSignature&&window.COUNTY_ANALYSIS_SCOPE)return window.COUNTY_ANALYSIS_SCOPE;f.lastRankSignature=t;const e=H(x()||{includesCounty:!1,townshipSchools:b()}),n=new Set(e.townshipSchools||[]),o=Object.values(window.SCHOOLS||{}),a=it(),c={avg:0,excellent:0,pass:0};o.forEach(i=>{var u;const d=((u=i==null?void 0:i.metrics)==null?void 0:u.total)||{};c.avg=Math.max(c.avg,y(d.avg)),c.excellent=Math.max(c.excellent,y(d.excRate)),c.pass=Math.max(c.pass,y(d.passRate))}),o.forEach(i=>{var g;const d=((g=i==null?void 0:i.metrics)==null?void 0:g.total)||{},u=c.avg?y(d.avg)/c.avg*a.avg:0,w=c.excellent?y(d.excRate)/c.excellent*a.excellent:0,h=c.pass?y(d.passRate)/c.pass*a.pass:0;i.countyRatedAvg=u,i.countyRatedExc=w,i.countyRatedPass=h,i.countyScore2Rate=u+w+h,d&&(d.countyRatedAvg=u,d.countyRatedExc=w,d.countyRatedPass=h,d.countyScore2Rate=i.countyScore2Rate)}),o.slice().sort((i,d)=>y(d.countyScore2Rate)-y(i.countyScore2Rate)).forEach((i,d)=>{var u;i.countyScope=n.has(i.name)?"township":"county",i.countyRank2Rate=d+1,(u=i.metrics)!=null&&u.total&&(i.metrics.total.countyRank2Rate=d+1)}),o.filter(i=>n.has(i.name)).sort((i,d)=>y(d.score2Rate)-y(i.score2Rate)).forEach((i,d)=>{var u;i.townshipRank2Rate=d+1,(u=i.metrics)!=null&&u.total&&(i.metrics.total.townshipRank2Rate=d+1)});const r=(window.RAW_DATA||[]).filter(i=>Number.isFinite(Number(i==null?void 0:i.total))),s=k(r,i=>i.total,(i,d)=>{i.ranks||(i.ranks={}),i.ranks.total||(i.ranks.total={}),i.countyRank=d,i.countyScope=n.has(i.school)?"township":"county",i.ranks.total.county=d}).filter(i=>n.has(i.school));return k(s,i=>i.total,(i,d)=>{i.townshipRank=d,i.ranks.total||(i.ranks.total={}),i.ranks.total.township=d}),(window.SUBJECTS||[]).forEach(i=>{const d=(window.RAW_DATA||[]).filter(h=>{var g;return Number.isFinite(Number((g=h==null?void 0:h.scores)==null?void 0:g[i]))}),w=k(d,h=>{var g;return(g=h==null?void 0:h.scores)==null?void 0:g[i]},(h,g)=>{h.ranks||(h.ranks={}),h.ranks[i]||(h.ranks[i]={}),h.ranks[i].county=g}).filter(h=>n.has(h.school));k(w,h=>{var g;return(g=h==null?void 0:h.scores)==null?void 0:g[i]},(h,g)=>{h.ranks[i]||(h.ranks[i]={}),h.ranks[i].township=g})}),Z(e),window.COUNTY_ANALYSIS_SCOPE=e,e}function Y(){const t=x(),e=b();if(!t||!e.length)return;const n=E(),o=J(G,[]),a={examKey:v(),signature:n,includesCounty:!!t.includesCounty,at:new Date().toISOString(),schools:Object.values(window.SCHOOLS||{}).map(r=>{var l;return{name:r.name,scope:r.countyScope||"township",score2Rate:y((l=r.countyScore2Rate)!=null?l:r.score2Rate),countyRank:r.countyRank2Rate||r.rank2Rate||0,townshipRank:r.townshipRank2Rate||0}})},c=o.filter(r=>r.signature!==n&&r.examKey!==a.examKey).concat(a).slice(-12);st(G,c)}function Be(){const t=ht();return t.length?`
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
                        ${t.map(e=>{var a,c;const n=((a=e.metrics)==null?void 0:a.total)||{},o=e.countyScope!=="county";return`
                                <tr>
                                    <td>${S(e.name)}</td>
                                    <td><span class="county-scope-badge ${o?"is-township":"is-county"}">${o?"本乡镇":"县域学校"}</span></td>
                                    <td>${n.count||0}</td>
                                    <td>${m(n.avg)}</td>
                                    <td>${R(n.excRate)}</td>
                                    <td>${R(n.passRate)}</td>
                                    <td><strong>${m((c=e.countyScore2Rate)!=null?c:e.score2Rate)}</strong></td>
                                    <td>${o&&e.townshipRank2Rate||"-"}</td>
                                    <td>${e.countyRank2Rate||e.rank2Rate||"-"}</td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        `:'<div class="county-empty">暂无学校成绩数据，请先导入本次成绩。</div>'}function Ne(t){var l,s,i;const e=Array.isArray(t)?t.slice():Ct();if(!e.length)return"";const n=e.slice().sort((d,u)=>(d.countyRankAvg||9999)-(u.countyRankAvg||9999))[0],o=e.slice().sort((d,u)=>(d.countyRankExc||9999)-(u.countyRankExc||9999))[0],a=e.slice().sort((d,u)=>(d.countyRankPass||9999)-(u.countyRankPass||9999))[0],c=new Set(e.map(d=>d.subject).filter(Boolean)),r=e.slice().sort((d,u)=>(d.countyRankAvg||9999)-(u.countyRankAvg||9999)).slice(0,8);return`
            <div class="county-focus-card county-teacher-focus">
                <div>
                    <span>本校教师县域画像</span>
                    <strong>${e.length} 个教师-学科样本</strong>
                    <p>县域口径会把本校任课教师与县直、乡镇所有学校同学科整体表现放在一起对标，普通教师模块仍只看乡镇口径。</p>
                </div>
                <div class="county-focus-metrics">
                    <em>覆盖学科 <b>${c.size}</b></em>
                    <em>均分最好 <b>${S((n==null?void 0:n.teacherName)||"-")} #${(l=n==null?void 0:n.countyRankAvg)!=null?l:"-"}</b></em>
                    <em>优秀率最好 <b>${S((o==null?void 0:o.teacherName)||"-")} #${(s=o==null?void 0:o.countyRankExc)!=null?s:"-"}</b></em>
                    <em>及格率最好 <b>${S((a==null?void 0:a.teacherName)||"-")} #${(i=a==null?void 0:a.countyRankPass)!=null?i:"-"}</b></em>
                </div>
            </div>
            <div class="table-wrap analysis-table-shell county-focus-table">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>教师</th><th>学科</th><th>均分</th><th>优秀率</th><th>及格率</th><th>县均排</th><th>县优排</th><th>县及格排</th></tr></thead>
                    <tbody>
                        ${r.map(d=>{var u,w,h;return`
                            <tr>
                                <td>${S(d.teacherName)}</td>
                                <td>${S(d.subject)}</td>
                                <td>${m(d.avg,1)}</td>
                                <td>${R(d.excellentRate)}</td>
                                <td>${R(d.passRate)}</td>
                                <td>${(u=d.countyRankAvg)!=null?u:"-"}</td>
                                <td>${(w=d.countyRankExc)!=null?w:"-"}</td>
                                <td>${(h=d.countyRankPass)!=null?h:"-"}</td>
                            </tr>
                        `}).join("")}
                    </tbody>
                </table>
            </div>
        `}function $e(){if(!_()&&N()&&typeof window.analyzeTeachers=="function")try{window.analyzeTeachers({render:!1}),_()&&Z(x())}catch(o){console.warn("[county-analysis] sync teacher analysis failed:",o)}const t=j(10);if(!t.length)return'<div class="county-empty">暂无任课表或教师画像数据。导入任课表后，这里会展示县域样本下的教师教学画像。</div>';const e=Ct(),n=bt().map(o=>`
            <div class="analysis-anchor-panel county-teacher-subject-rank">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">${S(o.subject)} 同学科县域排名</div>
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
                            ${o.rows.map(a=>{var c,r,l;return`
                                <tr class="${a.type==="teacher"?"county-teacher-own-row":""}">
                                    <td>${(c=a.rankAvg)!=null?c:"-"}</td>
                                    <td>${S(a.name||"")}</td>
                                    <td>${a.type==="teacher"?"本校教师":"学校整体"}</td>
                                    <td>${m(a.avg,1)}</td>
                                    <td>${(r=a.rankExc)!=null?r:"-"}</td>
                                    <td>${R(a.excellentRate)}</td>
                                    <td>${(l=a.rankPass)!=null?l:"-"}</td>
                                    <td>${R(a.passRate)}</td>
                                    <td>${a.studentCount||0}</td>
                                </tr>
                            `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join("");return`
            <div class="county-portrait-grid">
                ${t.map((o,a)=>{var c,r,l;return`
                    <article class="county-portrait-card ${o.riskLevel==="risk"?"is-risk":""}">
                        <span class="county-portrait-rank">#${a+1}</span>
                        <h4>${S(o.teacherName)} / ${S(o.subject)}</h4>
                        <strong>${m(o.score,1)}</strong>
                        <p>均分 ${m(o.avg,1)} · 优秀率 ${R(o.excellentRate)} · 及格率 ${R(o.passRate)} · 样本 ${o.studentCount}</p>
                        <div class="county-portrait-rankline">
                            <span>县均排 #${(c=o.countyRankAvg)!=null?c:"-"}</span>
                            <span>优排 #${(r=o.countyRankExc)!=null?r:"-"}</span>
                            <span>及排 #${(l=o.countyRankPass)!=null?l:"-"}</span>
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
                                ${e.map(o=>{var a,c,r,l;return`
                                    <td>${((c=(a=n==null?void 0:n.ranks)==null?void 0:a[o])==null?void 0:c.township)||"-"}</td>
                                    <td>${((l=(r=n==null?void 0:n.ranks)==null?void 0:r[o])==null?void 0:l.county)||"-"}</td>
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
                        ${t.map(({current:e,previous:n})=>{const o=y(n.countyRank)-y(e.countyRank);return`
                                <tr>
                                    <td>${S(e.name)}</td>
                                    <td>${e.countyRank||"-"}</td>
                                    <td>${n.countyRank||"-"}</td>
                                    <td class="${o>0?"text-green":o<0?"text-red":""}">${o>0?`上升 ${o}`:o<0?`下降 ${Math.abs(o)}`:"持平"}</td>
                                    <td>${m(e.score2Rate)}</td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        `:'<div class="county-empty">县域历史样本不足。后续再次导入县域成绩后，这里会自动显示县排名变化。</div>'}function $t(){const t=["county-teacher-portrait","county-school-horizontal","county-analysis"].find(e=>{var n,o;return(o=(n=document.getElementById(e))==null?void 0:n.classList)==null?void 0:o.contains("active")});return t==="county-analysis"?"county-teacher-portrait":t||"county-teacher-portrait"}function _e(t=$t()){var n;const e=document.getElementById(t)||document.getElementById("county-analysis");return((n=e==null?void 0:e.querySelector)==null?void 0:n.call(e,".county-analysis-root"))||document.getElementById("county-analysis-root")}function _t(){const t=document.getElementById("county-analysis");!t||t.dataset.countySubmoduleHost==="1"||(t.dataset.countySubmoduleHost="1",Object.entries(at).forEach(([e,n])=>{if(document.getElementById(e))return;const o=document.createElement("div");o.id=e,o.className="section card-box analysis-workspace analysis-workspace-county",o.innerHTML=`
                <div class="module-desc-bar analysis-hero" style="border-color:#0f766e;">
                    <h3><i class="ti ti-map-2"></i> ${S(n.title)} <span class="badge" style="background:#0f766e;">${S(n.badge)}</span></h3>
                    <p>${S(n.description)}</p>
                </div>
                <div class="county-analysis-root">
                    <div class="info-bar analysis-info-band">导入县级成绩后，这里只呈现县域专用分析，不改变联考分析、教学管理和学情诊断的原有口径。</div>
                </div>
            `,t.insertAdjacentElement("afterend",o)}))}function Ot(t){const e=E();if(f.subjectRowCacheSignature!==e&&(f.subjectRowCacheSignature=e,f.subjectRowCache=new Map),f.subjectRowCache.has(t))return(f.subjectRowCache.get(t)||[]).map(c=>({...c}));const n=Object.values(window.SCHOOLS||{}).filter(c=>{var r;return(r=c==null?void 0:c.metrics)==null?void 0:r[t]}).map(c=>({school:c,metric:c.metrics[t]}));if(!n.length)return f.subjectRowCache.set(t,[]),[];const o=n.reduce((c,r)=>(c.avg=Math.max(c.avg,y(r.metric.avg)),c.excellent=Math.max(c.excellent,y(r.metric.excRate)),c.pass=Math.max(c.pass,y(r.metric.passRate)),c),{avg:0,excellent:0,pass:0}),a=n.map(c=>{const r=wt(c.metric,o);return{schoolName:c.school.name||"",count:y(c.metric.count),avg:y(c.metric.avg),excellentRate:y(c.metric.excRate),passRate:y(c.metric.passRate),ratedAvg:r.ratedAvg,ratedExc:r.ratedExc,ratedPass:r.ratedPass,score:r.ratedAvg+r.ratedExc+r.ratedPass}});return k(a,c=>c.avg,(c,r)=>{c.rankAvg=r}),k(a,c=>c.excellentRate,(c,r)=>{c.rankExcellent=r}),k(a,c=>c.passRate,(c,r)=>{c.rankPass=r}),k(a,c=>c.score,(c,r)=>{c.rank=r}),a.sort((c,r)=>(c.rank||9999)-(r.rank||9999)),f.subjectRowCache.set(t,a.map(c=>({...c}))),a.map(c=>({...c}))}function tt(t={}){var s,i,d;const e=t.required!==!1,n=t.silent===!0,o=document.getElementById("countySchoolNameInput"),a=String((o==null?void 0:o.value)||"").trim();if(!a)return e?(!n&&((s=window.UI)!=null&&s.toast)&&window.UI.toast("请输入本校名称","warning"),!1):!0;const c=b();let r=a;if(c.length&&!c.includes(a)&&(typeof window.resolveSchoolNameFromCollection=="function"&&(r=window.resolveSchoolNameFromCollection(c,a)||a),!c.includes(r)&&typeof window.getCanonicalSchoolName=="function"&&(r=window.getCanonicalSchoolName(a,c)||r)),c.length&&!c.includes(r))return!n&&((i=window.UI)!=null&&i.toast)&&window.UI.toast("当前县级成绩中没有匹配到该学校，请核对名称","warning"),!1;window.MY_SCHOOL=r;try{localStorage.setItem("MY_SCHOOL",r)}catch(u){}typeof window.writeCurrentSchool=="function"&&window.writeCurrentSchool(r);const l=document.getElementById("mySchoolSelect");return l&&Array.from(l.options||[]).some(u=>u.value===r)&&(l.value=r),o&&(o.value=r),!n&&((d=window.UI)!=null&&d.toast)&&window.UI.toast(`已锁定本校：${r}`,"success"),!0}function It(){var e;tt({required:!1,silent:!0})&&(f.subjectRowCache=new Map,f.subjectRowCacheSignature="",f.horizontalTotalCache=[],f.horizontalTotalCacheSignature="",O(),Y(),I("county-school-horizontal"),(e=window.UI)!=null&&e.toast&&window.UI.toast("县域学校横向对比表已生成","success"))}function Mt(){return{buildCountyHorizontalTotalRows:ft,buildCountySubjectRows:Ot,sortCountySubjects:F,resolveCurrentCountySchoolName:yt,getExamKey:v,escapeHtml:S,toNumber:y,formatNumber:m,formatCountyRankDisplay:Se}}function Ke(t=""){const e=window.CountySchoolHorizontalRenderer;return!e||typeof e.renderTotalTable!="function"?'<div class="county-empty">县域学校横向分析组件加载中，请稍后重试。</div>':e.renderTotalTable(Mt(),t)}function Oe(){const t=window.CountySchoolHorizontalRenderer;return!t||typeof t.renderSchoolHorizontal!="function"?'<div class="county-empty">县域学校横向分析组件加载中，请稍后重试。</div>':t.renderSchoolHorizontal(Mt())}function Ie(){return`
            <div class="county-kpi-grid">
                <div><span>教师样本</span><strong>${j(Number.POSITIVE_INFINITY).length}</strong><em>本校教师-学科</em></div>
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
                ${$e()}
            </div>
        `}function I(t=$t()){var e,n,o;if(!f.isRendering){f.isRendering=!0;try{_t();const a=t==="county-analysis"?"county-teacher-portrait":t,c=_e(a);if(!c)return;const r=O();a==="county-teacher-portrait"&&window.setTimeout(()=>{Rt().then(w=>{const h=["county-teacher-portrait","county-analysis"].some(g=>{var $,T;return(T=($=document.getElementById(g))==null?void 0:$.classList)==null?void 0:T.contains("active")});w!=null&&w.changed&&h&&!f.isRendering&&I(a)})},0);const l=b(),s=((e=r.countySchools)==null?void 0:e.length)||0,i=((n=r.townshipSchools)==null?void 0:n.length)||0,d=(window.RAW_DATA||[]).length,u=`
            <div class="county-kpi-grid">
                <div><span>本次范围</span><strong>${r.includesCounty?"县域 + 乡镇":"乡镇"}</strong><em>${S(v())}</em></div>
                <div><span>学校数</span><strong>${l.length}</strong><em>乡镇 ${i} · 县域 ${s}</em></div>
                <div><span>学生样本</span><strong>${d}</strong><em>已补充 countyRank / townshipRank</em></div>
                <div><span>当前子模块</span><strong>${S(((o=at[a])==null?void 0:o.title)||"县域教师画像")}</strong><em>不影响其他母模块</em></div>
            </div>
            ${a==="county-school-horizontal"?Oe():Ie()}
        `;c.innerHTML=u}finally{f.isRendering=!1}}}function Me(){}function He(){}function et(t,e){var n;return t!=null&&t.ranks?e==="total"?t.countyRank||"-":((n=t.ranks[e])==null?void 0:n.county)||"-":"-"}function Ge(){var P,L,U,D;if(!(window.RAW_DATA||[]).length){alert("请先上传数据");return}O();const t=typeof window.getCurrentUser=="function"?window.getCurrentUser():null,e=(t==null?void 0:t.role)||"guest",n=e==="teacher",o=e==="class_teacher",a=o&&typeof window.getClassTeacherStudentViewMode=="function"?window.getClassTeacherStudentViewMode():"teaching",r=(n||o&&a==="teaching")&&typeof window.getTeacherScopeForUser=="function"?window.getTeacherScopeForUser(t):null,l=n||o&&a==="teaching"?(window.SUBJECTS||[]).filter(p=>{var C;return(C=r==null?void 0:r.subjects)==null?void 0:C.has(window.normalizeSubject?window.normalizeSubject(p):p)}):window.SUBJECTS||[],s=((P=document.getElementById("studentSchoolSelect"))==null?void 0:P.value)||"",i=((L=document.getElementById("studentClassSelect"))==null?void 0:L.value)||"",d=typeof window.isSingleSchoolMode=="function"?window.isSingleSchoolMode():Object.keys(window.SCHOOLS||{}).length<=1;let u=[...window.RAW_DATA||[]];if((n||o&&a==="teaching")&&((U=r==null?void 0:r.classes)==null?void 0:U.size)>0)u=u.filter(p=>{const C=String(p.class||"").trim(),X=typeof window.normalizeClass=="function"?window.normalizeClass(p.class):C;return r.classes.has(X)||r.classes.has(C)?!0:Array.from(r.classes).some(K=>String(K).replace(/[\s\.]/g,"")===C.replace(/[\s\.]/g,""))});else if(o&&(t!=null&&t.class)&&typeof window.normalizeClass=="function"){const p=window.normalizeClass(t.class);u=u.filter(C=>window.normalizeClass(C.class)===p)}s&&!s.includes("请选择")&&(u=u.filter(p=>p.school===s)),i&&i!=="全部"&&(u=u.filter(p=>p.class===i)),typeof window.getComparisonStudentList=="function"&&(u=window.getComparisonStudentList(u,window.RAW_DATA||[])),u.sort((p,C)=>(Number(C.total)||0)-(Number(p.total)||0));const w=typeof window.hasStudentCountyRankData=="function"?window.hasStudentCountyRankData(u,l):u.some(p=>et(p,"total")!=="-"),h=n||o?["学校","班级","姓名"]:["学校","班级","姓名","考号","考场","相对总分"];l.forEach(p=>{n||o?h.push(`${p} 分数`,`${p} 班排`,`${p} 级排`):h.push(`${p} 分数`,`${p} 相对分`,`${p} 校排`,`${p} 班排`),d||h.push(`${p} 镇排`),w&&h.push(`${p} 县排`)});const g=String(((D=window.CONFIG)==null?void 0:D.name)||"").includes("9")?"五科总分":"总分";n||o?h.push(g,"总分班排","总分级排"):h.push(g,`${g}校排`,`${g}班排`),d||h.push(`${g}镇排`),w&&h.push(`${g}县排`);const $=[h];u.forEach(p=>{var X,K,Pt,Lt,Ut,Dt,Ft,Bt,Yt,Xt,Kt,Gt,Vt,Jt,Wt;const C=n||o?[p.school,p.class,p.name]:[p.school,p.class,p.name,p.id,p.examRoom,p.totalTScore||0];l.forEach(A=>{var qt,Qt,Zt,te,ee,ne,oe,ae,re,ce,ie,se,le,ue,de,pe,he,fe,ye,we,ge;n||o?C.push((Qt=(qt=p.scores)==null?void 0:qt[A])!=null?Qt:"-",(ee=(te=(Zt=p==null?void 0:p.ranks)==null?void 0:Zt[A])==null?void 0:te.class)!=null?ee:"-",(ae=(oe=(ne=p==null?void 0:p.ranks)==null?void 0:ne[A])==null?void 0:oe.school)!=null?ae:"-"):C.push((ce=(re=p.scores)==null?void 0:re[A])!=null?ce:"-",(se=(ie=p==null?void 0:p.tScores)==null?void 0:ie[A])!=null?se:"-",(de=(ue=(le=p==null?void 0:p.ranks)==null?void 0:le[A])==null?void 0:ue.school)!=null?de:"-",(fe=(he=(pe=p==null?void 0:p.ranks)==null?void 0:pe[A])==null?void 0:he.class)!=null?fe:"-"),d||C.push((ge=(we=(ye=p==null?void 0:p.ranks)==null?void 0:ye[A])==null?void 0:we.township)!=null?ge:"-"),w&&C.push(et(p,A))}),n||o?C.push(p.total,(Pt=(K=(X=p==null?void 0:p.ranks)==null?void 0:X.total)==null?void 0:K.class)!=null?Pt:"-",(Dt=(Ut=(Lt=p==null?void 0:p.ranks)==null?void 0:Lt.total)==null?void 0:Ut.school)!=null?Dt:"-"):C.push(p.total,(Yt=(Bt=(Ft=p==null?void 0:p.ranks)==null?void 0:Ft.total)==null?void 0:Bt.school)!=null?Yt:"-",(Gt=(Kt=(Xt=p==null?void 0:p.ranks)==null?void 0:Xt.total)==null?void 0:Kt.class)!=null?Gt:"-"),d||C.push((Wt=(Jt=(Vt=p==null?void 0:p.ranks)==null?void 0:Vt.total)==null?void 0:Jt.township)!=null?Wt:"-"),w&&C.push(et(p,"total")),$.push(C)});const T=window.XLSX.utils.book_new(),z=window.XLSX.utils.aoa_to_sheet($);if(typeof window.decorateExcelSheet=="function"&&window.decorateExcelSheet(z,h),window.XLSX.utils.book_append_sheet(T,z,"学生考试明细"),n||o){const p=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,new Set(l||[])):"teacher";window.XLSX.writeFile(T,`学生考试明细_${p}.xlsx`)}else window.XLSX.writeFile(T,"学生考试明细.xlsx")}function Ht(){const t=document.getElementById("upload-feedback-board");if(!t)return;let e=document.getElementById("upload-county-scope-card");e||(e=document.createElement("div"),e.id="upload-county-scope-card",e.className="upload-feedback-card",t.appendChild(e));const n=x();e.innerHTML=`
            <h4><i class="ti ti-map-2"></i> 县域对比口径</h4>
            <p>${n!=null&&n.includesCounty?`已启用县域排名：乡镇 ${n.townshipSchools.length} 所，县域学校 ${n.countySchools.length} 所。`:"本次暂按乡镇成绩处理。导入新成绩时会询问是否包含县里学校。"}</p>
        `}function nt(t,e){const n=window[t];if(typeof n!="function"||n[`__countyPatched_${t}`])return!1;const o=function(...c){const r=n.apply(this,c),l=s=>(e(...c),s);return r&&typeof r.then=="function"?r.then(l):(l(r),r)};return o[`__countyPatched_${t}`]=!0,window[t]=o,!0}function je(t){const e=window[t];return typeof e=="function"&&!!e[`__countyPatched_${t}`]}function jt(){return nt("processData",()=>{O(),Y(),Nt()}),nt("renderTables",()=>{O()}),nt("switchTab",t=>{(t==="county-analysis"||t==="county-teacher-portrait"||t==="county-school-horizontal")&&setTimeout(()=>I(t),0)}),["processData","renderTables","switchTab"].every(je)}function ze(){document.addEventListener("change",t=>{const e=t.target;!e||e.id!=="fileInput"||e.files&&e.files.length&&(f.preUploadTownshipSchools=b().filter(n=>!lt(n)),f.promptArmed=!0)},!0)}function Pe(){if(document.getElementById("county-analysis-runtime-style"))return;const t=document.createElement("style");t.id="county-analysis-runtime-style",t.textContent=`
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
        `,document.head.appendChild(t)}function zt(){Pe(),_t(),ze();const t=jt();if(Ht(),t)return;let e=0;const n=setInterval(()=>{e+=1,(jt()||e>40)&&clearInterval(n)},300)}window.CountyAnalysisRuntime={applyCountyRanks:O,renderCountyAnalysis:I,ensureTeacherContextForCountyAnalysis:Rt,promptCountyScopeIfNeeded:Nt,decorateAnalysisTable:Me,decorateStudentDetails:He,saveCountySnapshot:Y,getCurrentScope:x,exportCountyAnalysisSection:Et,setCountyAnalysisSchoolNameFromInput:tt,generateCountySchoolHorizontalTable:It},window.renderCountyAnalysis=I,window.exportCountyAnalysisSection=Et,window.setCountyAnalysisSchoolNameFromInput=tt,window.generateCountySchoolHorizontalTable=It,window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__=!0,document.readyState==="loading"?document.addEventListener("DOMContentLoaded",zt,{once:!0}):zt()})();
