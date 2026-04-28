(()=>{if(typeof window=="undefined"||window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__)return;const ot="COUNTY_ANALYSIS_SCOPE_V1",V="COUNTY_ANALYSIS_HISTORY_V1",f={promptArmed:!1,lastSignature:"",teacherContextPromise:null,lastTeacherContextSignature:"",lastTeacherContextAt:0,subjectRowCacheSignature:"",subjectRowCache:new Map,horizontalTotalCacheSignature:"",horizontalTotalCache:[],teacherRowsCacheSignature:"",teacherRowsCache:[],teacherSubjectTablesCacheSignature:"",teacherSubjectTablesCache:[],preUploadTownshipSchools:[],isRendering:!1,teacherContextToken:0,lastDataRankSignature:"",lastTeacherRankSignature:""},rt={"county-teacher-portrait":{title:"县域教师画像",badge:"教师县域排名",description:"对照“教师教学质量画像”，把本校教师放到县域所有学校同学科样本中排名，查看学科教师县域站位。"},"county-school-horizontal":{title:"县域学校横向分析",badge:"全县横向对比",description:"对照“两率一分(横向)”，生成五科总综合分析表和各学科明细表，按县域所有学校统一排名。"}},Se=["语文","数学","英语","物理","化学","政治"],ct=["语文","数学","英语","物理","化学","历史","地理","生物","政治"];function S(t){return String(t!=null?t:"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function y(t,e=0){const n=Number(t);return Number.isFinite(n)?n:e}function k(t,e,n){if(window.RankingDataService&&typeof window.RankingDataService.assignCompetitionRanks=="function")return window.RankingDataService.assignCompetitionRanks(t,e,n);const a=Array.isArray(t)?t.slice():[];a.sort((r,l)=>Number(e(l)||0)-Number(e(r)||0));let o=null,c=0;return a.forEach((r,l)=>{const s=Number(e(r)),i=o!==null&&Math.abs(s-o)<1e-4?c:l+1;n(r,i),o=s,c=i}),a}function m(t,e=2){const n=Number(t);return Number.isFinite(n)?n.toFixed(e):"-"}function R(t){const e=Number(t);return Number.isFinite(e)?`${(e*100).toFixed(1)}%`:"-"}function Re(t,e,n=!1){const a=Number(t),o=Number.isFinite(a)?n?`${(a*100).toFixed(2)}%`:a.toFixed(2):"-",c=e?` <span style="font-size:0.9em; color:#94a3b8">(${e})</span>`:"";return`${o}${c}`}function J(t){const e=String(t||"").trim();return typeof window.normalizeSubject=="function"?window.normalizeSubject(e):e.replace(/\s+/g,"")}function Ce(){var a,o,c;const t=typeof window.getExamMetaFromUI=="function"?window.getExamMetaFromUI():{},e=r=>{try{return localStorage.getItem(r)||""}catch(l){return""}},n=[t==null?void 0:t.grade,(a=window.CURRENT_COHORT_META)==null?void 0:a.grade,(o=window.CONFIG)==null?void 0:o.grade,(c=window.CONFIG)==null?void 0:c.name,e("CURRENT_TEACHER_TERM_ID"),e("CURRENT_TERM_ID")];for(const r of n){const l=String(r||"").match(/([6-9])\s*年?级?/);if(l)return Number(l[1])}return 0}function it(){const t=Ce();return t===9?Se:([6,7,8].includes(t),ct)}function B(t){const e=it().map(J);return Array.from(new Set((t||[]).map(a=>String(a||"").trim()).filter(Boolean))).sort((a,o)=>{const c=Y(a),r=Y(o);return c!==r?c-r:String(a).localeCompare(String(o),"zh-CN",{numeric:!0})})}function Y(t){const n=it().map(J).indexOf(J(t));return n>=0?n:999}function st(){var e;return String(((e=window.CONFIG)==null?void 0:e.name)||"").trim().includes("9")?{avg:50,excellent:80,pass:50}:{avg:60,excellent:70,pass:70}}function M(t,e=5e3,n=!1){return Promise.race([Promise.resolve(t).catch(()=>n),new Promise(a=>setTimeout(()=>a(n),e))])}function W(t,e){try{const n=localStorage.getItem(t);return n?JSON.parse(n):e}catch(n){return e}}function lt(t,e){try{localStorage.setItem(t,JSON.stringify(e))}catch(n){console.warn("[county-analysis] failed to persist state:",n)}}function E(){var t;return String(window.CURRENT_EXAM_ID||(typeof window.readWorkspaceExamId=="function"?window.readWorkspaceExamId():"")||((t=window.COHORT_DB)==null?void 0:t.currentExamId)||"current").trim()||"current"}function b(){return Object.keys(window.SCHOOLS||{}).filter(Boolean).sort((t,e)=>t.localeCompare(e,"zh-CN"))}function ut(t){const e=String(t||"").trim();return/^(?:\u6574\u4f53|\u5168\u90e8|\u6c47\u603b|\u603b\u8868|\u5408\u8ba1|\u5168\u53bf|\u53bf\u57df|Sheet\d*|\u5de5\u4f5c\u8868\d*)$/i.test(e)}function dt(t){return typeof window.normalizeSchoolName=="function"&&window.normalizeSchoolName(t)||String(t||"").trim()}function ht(t){const e=Array.isArray(t)?t.filter(Boolean):b();if(!e.length)return[];if(typeof window.getTownshipManagedSchoolNames=="function"){const r=window.getTownshipManagedSchoolNames(e);if(Array.isArray(r)&&r.length)return r}const n=window.TARGETS&&typeof window.TARGETS=="object"?window.TARGETS:{},a=Object.keys(n);if(!a.length)return[];const o=new Map;e.forEach(r=>{o.set(dt(r),r)});const c=a.map(r=>{if(typeof window.resolveSchoolNameFromCollection=="function"){const l=window.resolveSchoolNameFromCollection(e,r);if(l)return l}if(typeof window.getCanonicalSchoolName=="function"){const l=window.getCanonicalSchoolName(r,e);if(l&&e.includes(l))return l}return o.get(dt(r))||""}).filter(r=>r&&!ut(r));return Array.from(new Set(c)).sort((r,l)=>r.localeCompare(l,"zh-CN"))}function N(){const t=Object.keys(window.TARGETS&&typeof window.TARGETS=="object"?window.TARGETS:{}).sort((n,a)=>String(n).localeCompare(String(a),"zh-CN")),e=Number(window.__RAW_DATA_VERSION||0);return[E(),Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:0,e,b().join("|"),t.join("|")].join("::")}function q(){const t=window.TEACHER_STATS&&typeof window.TEACHER_STATS=="object"?window.TEACHER_STATS:{},e=window.TEACHER_MAP&&typeof window.TEACHER_MAP=="object"?window.TEACHER_MAP:{},n=window.TEACHER_SCHOOL_MAP&&typeof window.TEACHER_SCHOOL_MAP=="object"?window.TEACHER_SCHOOL_MAP:{},a=window.COUNTY_TEACHER_RANKING_DATA&&typeof window.COUNTY_TEACHER_RANKING_DATA=="object"?window.COUNTY_TEACHER_RANKING_DATA:{},o=Object.entries(t).map(([c,r])=>`${c}:${Object.keys(r||{}).sort().join(",")}`).sort().join("|");return[N(),Q(),Object.keys(e).length,Object.keys(n).length,Object.keys(t).length,o,Object.keys(a).sort().join(",")].join("::")}function be(){f.teacherRowsCacheSignature="",f.teacherRowsCache=[],f.teacherSubjectTablesCacheSignature="",f.teacherSubjectTablesCache=[]}function pt(){const t=W(ot,{});return t&&typeof t=="object"?t:{}}function A(){return pt()[E()]||null}function ke(t){const e=pt();e[E()]=t,lt(ot,e)}function Ue(t){return String(t||"").split(/[,\n，、]+/).map(e=>e.trim()).filter(Boolean)}function Te(t,e=null){const n=Array.isArray(t)?t.filter(Boolean):b();return ht(n)}function H(t){const e=b(),n=ht(e),a=new Set(n),o=s=>a.has(s)?!0:typeof window.isTownshipManagedSchool=="function"?window.isTownshipManagedSchool(s,e):n.some(i=>typeof window.areSchoolNamesMatched=="function"?window.areSchoolNamesMatched(i,s,!0):i===s),c=e.filter(s=>o(s)),r=e.filter(s=>!o(s)),l=!!(t!=null&&t.includesCounty)&&(c.length>0||r.length>0);return{examKey:E(),includesCounty:l,explicitCountyUpload:l&&(t==null?void 0:t.explicitCountyUpload)===!0,townshipSchools:c,countySchools:r,signature:(t==null?void 0:t.signature)||N(),updatedAt:(t==null?void 0:t.updatedAt)||new Date().toISOString()}}function ft(){return Object.values(window.SCHOOLS||{}).slice().sort((t,e)=>(t.countyRank2Rate||9999)-(e.countyRank2Rate||9999))}function yt(){const t=N();if(f.horizontalTotalCacheSignature===t)return f.horizontalTotalCache.map(a=>({...a}));const e=Object.values(window.SCHOOLS||{}).filter(a=>{var o;return(o=a==null?void 0:a.metrics)==null?void 0:o.total}).map(a=>{var c,r,l,s,i;const o=a.metrics.total||{};return{school:a,schoolName:a.name||"",count:y(o.count),avg:y(o.avg),excellentRate:y(o.excRate),passRate:y(o.passRate),ratedAvg:y((c=o.countyRatedAvg)!=null?c:a.countyRatedAvg),ratedExc:y((r=o.countyRatedExc)!=null?r:a.countyRatedExc),ratedPass:y((l=o.countyRatedPass)!=null?l:a.countyRatedPass),score:y((i=(s=o.countyScore2Rate)!=null?s:a.countyScore2Rate)!=null?i:a.score2Rate)}});k(e,a=>a.avg,(a,o)=>{a.rankAvg=o}),k(e,a=>a.excellentRate,(a,o)=>{a.rankExcellent=o}),k(e,a=>a.passRate,(a,o)=>{a.rankPass=o}),k(e,a=>a.score,(a,o)=>{a.rankScore=o});const n=e.sort((a,o)=>(a.rankScore||9999)-(o.rankScore||9999));return f.horizontalTotalCacheSignature=t,f.horizontalTotalCache=n.map(a=>({...a})),n.map(a=>({...a}))}function wt(){const t=b();if(!t.length)return"";const e=[typeof window.readCurrentSchool=="function"?window.readCurrentSchool():"",window.MY_SCHOOL,(()=>{try{return localStorage.getItem("MY_SCHOOL")||""}catch(n){return""}})()].map(n=>String(n||"").trim()).filter(Boolean);for(const n of e){if(t.includes(n))return n;if(typeof window.resolveSchoolNameFromCollection=="function"){const a=window.resolveSchoolNameFromCollection(t,n);if(a)return a}if(typeof window.getCanonicalSchoolName=="function"){const a=window.getCanonicalSchoolName(n,t);if(a&&t.includes(a))return a}}return""}function gt(t,e){const n=st();return{ratedAvg:e.avg?y(t==null?void 0:t.avg)/e.avg*n.avg:0,ratedExc:e.excellent?y(t==null?void 0:t.excRate)/e.excellent*n.excellent:0,ratedPass:e.pass?y(t==null?void 0:t.passRate)/e.pass*n.pass:0}}function mt(t,e,n,a){const o=H(a||A()||{}),c=new Set(o.townshipSchools||[]),r=Object.values(window.SCHOOLS||{}).filter(u=>{var w;return(w=u==null?void 0:u.metrics)==null?void 0:w[t]}).filter(u=>n!=="township"||c.has(u.name));if(!r.length)return null;const l=r.reduce((u,w)=>{var g;const p=((g=w==null?void 0:w.metrics)==null?void 0:g[t])||{};return u.avg=Math.max(u.avg,y(p.avg)),u.excellent=Math.max(u.excellent,y(p.excRate)),u.pass=Math.max(u.pass,y(p.passRate)),u},{avg:0,excellent:0,pass:0}),s=r.map(u=>{var g;const w=((g=u==null?void 0:u.metrics)==null?void 0:g[t])||{},p=gt(w,l);return{name:u.name,metric:w,score:p.ratedAvg+p.ratedExc+p.ratedPass}}).sort((u,w)=>w.score-u.score);let i=s.find(u=>u.name===e);return!i&&typeof window.areSchoolNamesMatched=="function"&&(i=s.find(u=>window.areSchoolNamesMatched(u.name,e,!0))),i?{rank:s.findIndex(u=>u===i)+1,total:s.length,score:i.score,metric:i.metric}:null}function De(t){var r,l;const e=wt(),n=e?(window.SCHOOLS||{})[e]:null;if(!n)return'<div class="county-empty">未锁定本校。请先在数据管理里设置本校，县域分析会自动补充本校学科对比。</div>';const a=((r=n.metrics)==null?void 0:r.total)||{},o=n.countyScope!=="county",c=(window.SUBJECTS||[]).map(s=>{var w,p,g;const i=mt(s,e,"county",t),d=o?mt(s,e,"township",t):null;if(!i&&!d)return"";const u=i||d;return`
                    <tr>
                        <td>${S(s)}</td>
                        <td>${m((w=u==null?void 0:u.metric)==null?void 0:w.avg,1)}</td>
                        <td>${R((p=u==null?void 0:u.metric)==null?void 0:p.excRate)}</td>
                        <td>${R((g=u==null?void 0:u.metric)==null?void 0:g.passRate)}</td>
                        <td>${d?`${d.rank}/${d.total}`:"-"}</td>
                        <td>${i?`${i.rank}/${i.total}`:"-"}</td>
                    </tr>
                `}).filter(Boolean).join("");return`
            <div class="county-focus-card">
                <div>
                    <span>本校县域站位</span>
                    <strong>${S(e)}</strong>
                    <p>${o?"本校属于乡镇学校：普通模块只按乡镇计算，县域分析里同时显示县排名。":"本校当前按县直学校处理：仅在县域分析和学生县排名场景参与。"}</p>
                </div>
                <div class="county-focus-metrics">
                    <em>乡镇总排 <b>${o&&n.townshipRank2Rate||"-"}</b></em>
                    <em>县域总排 <b>${n.countyRank2Rate||"-"}</b></em>
                    <em>两率一分 <b>${m((l=n.countyScore2Rate)!=null?l:n.score2Rate)}</b></em>
                    <em>样本 <b>${a.count||0}</b></em>
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
        `}function St(){return(window.RAW_DATA||[]).filter(t=>Number.isFinite(Number(t==null?void 0:t.total))).slice().sort((t,e)=>{const n=Number(t.townshipRank||9999),a=Number(e.townshipRank||9999);return n!==a?n-a:(t.countyRank||9999)-(e.countyRank||9999)})}function T(){return Object.keys(Z().map||{}).length>0}function x(){return!!window.TEACHER_STATS&&Object.keys(window.TEACHER_STATS).length>0}function Q(){var t;return typeof window.readCurrentSchool=="function"?String(window.readCurrentSchool()||"").trim():String(window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||((t=document.getElementById("mySchoolSelect"))==null?void 0:t.value)||"").trim()}function Z(){const t=window.TEACHER_MAP&&typeof window.TEACHER_MAP=="object"?window.TEACHER_MAP:{},e=window.TEACHER_SCHOOL_MAP&&typeof window.TEACHER_SCHOOL_MAP=="object"?window.TEACHER_SCHOOL_MAP:{},n=Q(),a=Object.values(e).map(r=>String(r||"").trim()).filter(Boolean);if(!n||!a.length)return{map:t,schoolMap:e,schoolName:n,scoped:!1,matched:Object.keys(t).length>0};const o={},c={};return Object.entries(t).forEach(([r,l])=>{String(e[r]||"").trim()===n&&(o[r]=l,c[r]=e[r])}),{map:o,schoolMap:c,schoolName:n,scoped:!0,matched:Object.keys(o).length>0}}function Rt(){const t=Z();return!t.scoped||!t.matched||Object.keys(t.map).length===Object.keys(window.TEACHER_MAP||{}).length||(typeof window.setTeacherMap=="function"?window.setTeacherMap(t.map):window.TEACHER_MAP=t.map,typeof window.setTeacherSchoolMap=="function"?window.setTeacherSchoolMap(t.schoolMap):window.TEACHER_SCHOOL_MAP=t.schoolMap,typeof window.setTeacherStats=="function"?window.setTeacherStats({}):window.TEACHER_STATS={}),t}function xe(){var e;const t=String(((e=window.location)==null?void 0:e.hostname)||"").trim().toLowerCase();return t&&t!=="127.0.0.1"&&t!=="localhost"}function _(t){return t&&t!==f.teacherContextToken?!1:["county-teacher-portrait","county-analysis"].some(e=>{var n,a;return(a=(n=document.getElementById(e))==null?void 0:n.classList)==null?void 0:a.contains("active")})}async function Ae(){if(typeof window.analyzeTeachers=="function")return!0;try{window.SystemRuntimeLoader&&typeof window.SystemRuntimeLoader.load=="function"?await M(window.SystemRuntimeLoader.load("teacher-analysis"),6e3,!1):typeof window.ensureTeacherAnalysisRuntimeLoaded=="function"&&await M(window.ensureTeacherAnalysisRuntimeLoaded(),6e3,!1)}catch(t){console.warn("[county-analysis] teacher runtime load failed:",t)}return typeof window.analyzeTeachers=="function"}async function Ct(t=!1,e={}){const n=Number(e.token||f.teacherContextToken||0),a=e.requireActive!==!1;if(a&&!_(n))return{hasTeacherAssignments:T(),hasTeacherStats:x(),changed:!1,cancelled:!0};const o=Q(),c=Z(),r=`${N()}::${o}::${Object.keys(c.map||{}).length}::${Object.keys(window.TEACHER_STATS||{}).length}`,l=Date.now();if(!t&&f.lastTeacherContextSignature===r&&l-Number(f.lastTeacherContextAt||0)<3e4&&(T()||x()))return{hasTeacherAssignments:T(),hasTeacherStats:x(),changed:!1,cached:!0};if(!t&&f.teacherContextPromise)return f.teacherContextPromise;f.teacherContextPromise=(async()=>{let s=!1;if(a&&!_(n))return{hasTeacherAssignments:T(),hasTeacherStats:x(),changed:!1,cancelled:!0};if(!T()&&!o&&typeof window.tryAutoRestoreTeacherMap=="function")try{s=!!await M(window.tryAutoRestoreTeacherMap(),4e3,!1)||s}catch(i){console.warn("[county-analysis] tryAutoRestoreTeacherMap failed:",i)}if(!T()&&xe()&&window.CloudManager&&typeof window.CloudManager.loadTeachers=="function")try{s=!!await M(window.CloudManager.loadTeachers({background:!0,toast:!1,blocking:!1,schoolName:o}),1e4,!1)||s,!T()&&o&&(s=!!await M(window.CloudManager.loadTeachers({background:!0,toast:!1,blocking:!1,schoolName:""}),1e4,!1)||s)}catch(i){console.warn("[county-analysis] loadTeachers failed:",i)}if(Rt(),!x()&&T())try{if(a&&!_(n))return{hasTeacherAssignments:T(),hasTeacherStats:x(),changed:!1,cancelled:!0};const i=await Ae();if(a&&!_(n))return{hasTeacherAssignments:T(),hasTeacherStats:x(),changed:!1,cancelled:!0};i&&typeof window.analyzeTeachers=="function"&&(window.analyzeTeachers({render:!1}),s=!0)}catch(i){console.warn("[county-analysis] analyzeTeachers failed:",i)}return x()&&tt(A()),{hasTeacherAssignments:T(),hasTeacherStats:x(),changed:s}})();try{const s=await f.teacherContextPromise;return(s!=null&&s.hasTeacherAssignments||s!=null&&s.hasTeacherStats)&&(f.lastTeacherContextSignature=r,f.lastTeacherContextAt=Date.now()),s}finally{f.teacherContextPromise=null}}function j(t=12){Rt();const e=q();let n=f.teacherRowsCache;if(f.teacherRowsCacheSignature!==e){const a=window.COUNTY_TEACHER_RANKINGS||{},o=[];Object.entries(window.TEACHER_STATS||{}).forEach(([c,r])=>{Object.entries(r||{}).forEach(([l,s])=>{var d,u,w,p,g,z,I,P,L,U,D,F;const i=((d=a==null?void 0:a[c])==null?void 0:d[l])||{};o.push({teacherName:c,subject:l,score:y((g=(p=(w=(u=s.finalScore)!=null?u:s.fairScore)!=null?w:s.leagueScore)!=null?p:s.avgValue)!=null?g:s.avg),avg:y((z=s.avgValue)!=null?z:s.avg),passRate:y(s.passRate),excellentRate:y((I=s.excellentRate)!=null?I:s.excRate),studentCount:y((P=s.studentCount)!=null?P:s.count),riskLevel:s.riskLevel||"normal",countyRankAvg:(L=i.rankAvg)!=null?L:null,countyRankExc:(U=i.rankExc)!=null?U:null,countyRankPass:(D=i.rankPass)!=null?D:null,benchmarkCount:(F=i.benchmarkCount)!=null?F:0})})}),n=o.sort((c,r)=>{const l=Number.isFinite(c.countyRankAvg)?c.countyRankAvg:9999,s=Number.isFinite(r.countyRankAvg)?r.countyRankAvg:9999;return l!==s?l-s:r.score-c.score}),f.teacherRowsCacheSignature=e,f.teacherRowsCache=n}return!Number.isFinite(t)||t<=0?n.slice():n.slice(0,t)}function tt(t){const e=H(t||A()||{includesCounty:!1,townshipSchools:b()}),n=`${q()}::${(e.townshipSchools||[]).join("|")}::${e.includesCounty?"county":"township"}`;if(f.lastTeacherRankSignature===n&&window.COUNTY_TEACHER_RANKINGS&&window.COUNTY_TEACHER_RANKING_DATA)return window.COUNTY_TEACHER_RANKINGS;const a=new Set(e.townshipSchools||[]),o={},c={};return B(window.SUBJECTS||[]).forEach(r=>{const l=[];Object.entries(window.TEACHER_STATS||{}).forEach(([s,i])=>{var u,w,p;const d=i==null?void 0:i[r];d&&l.push({name:s,type:"teacher",subject:r,avg:y((u=d.avgValue)!=null?u:d.avg),excellentRate:y((w=d.excellentRate)!=null?w:d.excRate),passRate:y(d.passRate),studentCount:y((p=d.studentCount)!=null?p:d.count),scope:"teacher"})}),Object.values(window.SCHOOLS||{}).forEach(s=>{var d;const i=(d=s==null?void 0:s.metrics)==null?void 0:d[r];i&&l.push({name:s.name||"",type:"school",subject:r,avg:y(i.avg),excellentRate:y(i.excRate),passRate:y(i.passRate),studentCount:y(i.count),scope:a.has(s.name)?"township":"county"})}),l.length&&(l.sort((s,i)=>i.avg-s.avg),l.forEach((s,i)=>{s.rankAvg=i+1}),l.sort((s,i)=>i.excellentRate-s.excellentRate),l.forEach((s,i)=>{s.rankExc=i+1}),l.sort((s,i)=>i.passRate-s.passRate),l.forEach((s,i)=>{s.rankPass=i+1}),l.sort((s,i)=>(s.rankAvg||9999)!==(i.rankAvg||9999)?(s.rankAvg||9999)-(i.rankAvg||9999):s.type!==i.type?s.type==="teacher"?-1:1:String(s.name||"").localeCompare(String(i.name||""),"zh-CN")),l.forEach(s=>{s.type==="teacher"&&(o[s.name]||(o[s.name]={}),o[s.name][r]={rankAvg:s.rankAvg,rankExc:s.rankExc,rankPass:s.rankPass,benchmarkCount:l.length})}),c[r]=l)}),window.COUNTY_TEACHER_RANKINGS=o,window.COUNTY_TEACHER_RANKING_DATA=c,f.lastTeacherRankSignature=n,be(),o}function bt(){return j(Number.POSITIVE_INFINITY).filter(t=>Number.isFinite(t.countyRankAvg)).sort((t,e)=>{const n=Y(t.subject)-Y(e.subject);return n!==0?n:(t.countyRankAvg||9999)!==(e.countyRankAvg||9999)?(t.countyRankAvg||9999)-(e.countyRankAvg||9999):e.score-t.score})}function kt(){const t=q();if(f.teacherSubjectTablesCacheSignature===t)return f.teacherSubjectTablesCache.map(o=>({subject:o.subject,rows:(o.rows||[]).slice()}));const e=window.COUNTY_TEACHER_RANKING_DATA||{},a=B([...Object.keys(e),...j(Number.POSITIVE_INFINITY).map(o=>o.subject)]).map(o=>{const c=(e[o]||[]).slice().sort((r,l)=>(r.rankAvg||9999)!==(l.rankAvg||9999)?(r.rankAvg||9999)-(l.rankAvg||9999):r.type!==l.type?r.type==="teacher"?-1:1:String(r.name||"").localeCompare(String(l.name||""),"zh-CN",{numeric:!0}));return{subject:o,rows:c}}).filter(o=>o.rows.length);return f.teacherSubjectTablesCacheSignature=t,f.teacherSubjectTablesCache=a,a.map(o=>({subject:o.subject,rows:(o.rows||[]).slice()}))}function ve(t){const e=(window.SUBJECTS||[]).map(n=>{var o,c;const a=(c=(o=t==null?void 0:t.ranks)==null?void 0:o[n])==null?void 0:c.county;return Number.isFinite(Number(a))?`${n}#${a}`:""}).filter(Boolean);return e.length?e.join(" / "):"-"}function Tt(){const t=W(V,[]).filter(o=>{var c;return(c=o==null?void 0:o.schools)==null?void 0:c.length});if(t.length<2)return[];const e=t[t.length-1],n=t[t.length-2],a=new Map((n.schools||[]).map(o=>[o.name,o]));return(e.schools||[]).map(o=>({current:o,previous:a.get(o.name)})).filter(o=>o.previous).sort((o,c)=>(o.current.countyRank||9999)-(c.current.countyRank||9999))}function xt(){return[["学校名称","实考人数","平均分","平均分排名","优秀率","优秀率排名","及格率","及格率排名","平均分赋分","优秀率赋分","及格率赋分","两率一分总分","县域排名"],...yt().map(t=>[t.schoolName||"",t.count||0,m(t.avg),t.rankAvg||"-",R(t.excellentRate),t.rankExcellent||"-",R(t.passRate),t.rankPass||"-",m(t.ratedAvg),m(t.ratedExc),m(t.ratedPass),m(t.score),t.rankScore||"-"])]}function Ee(t){return[["学校名称","实考人数","平均分","平均分排名","优秀率","优秀率排名","及格率","及格率排名","平均分赋分","优秀率赋分","及格率赋分","两率一分","县域排名"],...It(t).map(e=>[e.schoolName||"",e.count||0,m(e.avg,2),e.rankAvg||"-",R(e.excellentRate),e.rankExcellent||"-",R(e.passRate),e.rankPass||"-",m(e.ratedAvg),m(e.ratedExc),m(e.ratedPass),m(e.score),e.rank||"-"])]}function Fe(){return[["学校","范围","人数","平均分","优秀率","及格率","两率一分","乡镇排名","县排名"],...ft().map(t=>{var a,o;const e=((a=t.metrics)==null?void 0:a.total)||{},n=t.countyScope!=="county";return[t.name||"",n?"本乡镇":"县域学校",e.count||0,m(e.avg),R(e.excRate),R(e.passRate),m((o=t.countyScore2Rate)!=null?o:t.score2Rate),n&&t.townshipRank2Rate||"-",t.countyRank2Rate||t.rank2Rate||"-"]})]}function At(){return[{name:"五科总-综合分析表",rows:xt()},...B(window.SUBJECTS||[]).map(t=>({name:`${t}学科明细`,rows:Ee(t)}))]}function vt(){return[["序位","教师/学校","类型","学科","综合得分","均分","优秀率","及格率","样本人数","县域均分排","县域优秀率排","县域及格率排","对标总量","风险级别"],...j(Number.POSITIVE_INFINITY).map((t,e)=>{var n,a,o;return[e+1,t.teacherName||"","本校教师",t.subject||"",m(t.score,1),m(t.avg,1),R(t.excellentRate),R(t.passRate),t.studentCount||0,(n=t.countyRankAvg)!=null?n:"-",(a=t.countyRankExc)!=null?a:"-",(o=t.countyRankPass)!=null?o:"-",t.benchmarkCount||"-",t.riskLevel||"normal"]}),[],["同学科完整县域排名"],["学科","排名","教师/学校","类型","均分","优秀率","及格率","样本人数"],...kt().flatMap(t=>t.rows.map(e=>[t.subject,e.rankAvg||"-",e.name||"",e.type==="teacher"?"本校教师":"学校整体",m(e.avg,1),R(e.excellentRate),R(e.passRate),e.studentCount||0]))]}function Be(){const t=window.SUBJECTS||[];return[["乡镇排名","县排名","学生","学校","班级","总分","学科县排速览",...t.flatMap(e=>[`${e}乡排`,`${e}县排`])],...St().map(e=>[e.townshipRank||"-",e.countyRank||"-",e.name||"",e.school||"",e.class||"",m(e.total,1),ve(e),...t.flatMap(n=>{var a,o,c,r,l,s;return[(c=(o=(a=e==null?void 0:e.ranks)==null?void 0:a[n])==null?void 0:o.township)!=null?c:"-",(s=(l=(r=e==null?void 0:e.ranks)==null?void 0:r[n])==null?void 0:l.county)!=null?s:"-"]})])]}function Et(){return[["学校","本次县排名","上次县排名","变化","本次两率一分"],...Tt().map(({current:t,previous:e})=>{const n=y(e.countyRank)-y(t.countyRank),a=n>0?`上升 ${n}`:n<0?`下降 ${Math.abs(n)}`:"持平";return[t.name||"",t.countyRank||"-",e.countyRank||"-",a,m(t.score2Rate)]})]}function Ne(t,e){var a;if(!window.XLSX||typeof((a=window.XLSX.utils)==null?void 0:a.book_new)!="function")throw new Error("XLSX export unavailable");const n=window.XLSX.utils.book_new();(Array.isArray(e)?e:[]).forEach((o,c)=>{const r=Array.isArray(o==null?void 0:o.rows)?o.rows:[],l=window.XLSX.utils.aoa_to_sheet(r),s=r.reduce((d,u)=>Math.max(d,Array.isArray(u)?u.length:0),0);s>0&&(l["!cols"]=Array.from({length:s},()=>({wch:16})));const i=String((o==null?void 0:o.name)||`Sheet${c+1}`).trim()||`Sheet${c+1}`;window.XLSX.utils.book_append_sheet(n,l,i.slice(0,31))}),window.XLSX.writeFile(n,t)}function Nt(t){var c,r;const e=E(),n=String(t||"").trim();if(n==="student"){(c=window.UI)!=null&&c.toast&&window.UI.toast("学生县排名已移到“学生档案查询”的学生考试明细中，县域分析不再单独导出学生档案县排。","info");return}const a={rank:{fileName:`县域两率一分排名_${e}.xlsx`,sheets:[{name:"县域排名",rows:xt()}]},school:{fileName:`县域学校横向分析_${e}.xlsx`,sheets:At()},teacher:{fileName:`县域教师画像_${e}.xlsx`,sheets:[{name:"教师画像",rows:vt()}]},history:{fileName:`县域历史对比_${e}.xlsx`,sheets:[{name:"历史对比",rows:Et()}]},all:{fileName:`县域分析_${e}.xlsx`,sheets:[...At(),{name:"教师画像",rows:vt()},{name:"历史对比",rows:Et()}]}},o=a[n]||a.all;Ne(o.fileName,o.sheets),(r=window.UI)!=null&&r.toast&&window.UI.toast("✅ 县域分析导出完成","success")}async function $t(){var i;const t=N(),e=b();if(!f.promptArmed||!e.length||t===f.lastSignature)return A();f.promptArmed=!1,f.lastSignature=t;const n=A();if((n==null?void 0:n.signature)===t)return H(n);const a=Te(e,n),o=new Set(a),c=a.length?e.filter(d=>!o.has(d)):[],r=c.length>0,l=a;r&&((i=window.UI)!=null&&i.toast)&&window.UI.toast(`已按目标人数管理自动识别：乡镇 ${l.length} 所，县直/县域 ${c.length} 所`,"info");const s=H({includesCounty:r,explicitCountyUpload:r,townshipSchools:l,signature:t,updatedAt:new Date().toISOString()});return ke(s),$(),X(),O(),jt(),s}function $(){const t=N();if(t&&t===f.lastDataRankSignature&&window.COUNTY_ANALYSIS_SCOPE)return window.COUNTY_ANALYSIS_SCOPE;f.lastDataRankSignature=t;const e=H(A()||{includesCounty:!1,townshipSchools:b()}),n=new Set(e.townshipSchools||[]),a=Object.values(window.SCHOOLS||{}),o=st(),c={avg:0,excellent:0,pass:0};a.forEach(i=>{var u;const d=((u=i==null?void 0:i.metrics)==null?void 0:u.total)||{};c.avg=Math.max(c.avg,y(d.avg)),c.excellent=Math.max(c.excellent,y(d.excRate)),c.pass=Math.max(c.pass,y(d.passRate))}),a.forEach(i=>{var g;const d=((g=i==null?void 0:i.metrics)==null?void 0:g.total)||{},u=c.avg?y(d.avg)/c.avg*o.avg:0,w=c.excellent?y(d.excRate)/c.excellent*o.excellent:0,p=c.pass?y(d.passRate)/c.pass*o.pass:0;i.countyRatedAvg=u,i.countyRatedExc=w,i.countyRatedPass=p,i.countyScore2Rate=u+w+p,d&&(d.countyRatedAvg=u,d.countyRatedExc=w,d.countyRatedPass=p,d.countyScore2Rate=i.countyScore2Rate)}),a.slice().sort((i,d)=>y(d.countyScore2Rate)-y(i.countyScore2Rate)).forEach((i,d)=>{var u;i.countyScope=n.has(i.name)?"township":"county",i.countyRank2Rate=d+1,(u=i.metrics)!=null&&u.total&&(i.metrics.total.countyRank2Rate=d+1)}),a.filter(i=>n.has(i.name)).sort((i,d)=>y(d.score2Rate)-y(i.score2Rate)).forEach((i,d)=>{var u;i.townshipRank2Rate=d+1,(u=i.metrics)!=null&&u.total&&(i.metrics.total.townshipRank2Rate=d+1)});const r=(window.RAW_DATA||[]).filter(i=>Number.isFinite(Number(i==null?void 0:i.total))),s=k(r,i=>i.total,(i,d)=>{i.ranks||(i.ranks={}),i.ranks.total||(i.ranks.total={}),i.countyRank=d,i.countyScope=n.has(i.school)?"township":"county",i.ranks.total.county=d}).filter(i=>n.has(i.school));return k(s,i=>i.total,(i,d)=>{i.townshipRank=d,i.ranks.total||(i.ranks.total={}),i.ranks.total.township=d}),(window.SUBJECTS||[]).forEach(i=>{const d=(window.RAW_DATA||[]).filter(p=>{var g;return Number.isFinite(Number((g=p==null?void 0:p.scores)==null?void 0:g[i]))}),w=k(d,p=>{var g;return(g=p==null?void 0:p.scores)==null?void 0:g[i]},(p,g)=>{p.ranks||(p.ranks={}),p.ranks[i]||(p.ranks[i]={}),p.ranks[i].county=g}).filter(p=>n.has(p.school));k(w,p=>{var g;return(g=p==null?void 0:p.scores)==null?void 0:g[i]},(p,g)=>{p.ranks[i]||(p.ranks[i]={}),p.ranks[i].township=g})}),x()&&tt(e),window.COUNTY_ANALYSIS_SCOPE=e,e}function X(){const t=A(),e=b();if(!t||!e.length)return;const n=N(),a=W(V,[]),o={examKey:E(),signature:n,includesCounty:!!t.includesCounty,at:new Date().toISOString(),schools:Object.values(window.SCHOOLS||{}).map(r=>{var l;return{name:r.name,scope:r.countyScope||"township",score2Rate:y((l=r.countyScore2Rate)!=null?l:r.score2Rate),countyRank:r.countyRank2Rate||r.rank2Rate||0,townshipRank:r.townshipRank2Rate||0}})},c=a.filter(r=>r.signature!==n&&r.examKey!==o.examKey).concat(o).slice(-12);lt(V,c)}function Ye(){const t=ft();return t.length?`
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
                        ${t.map(e=>{var o,c;const n=((o=e.metrics)==null?void 0:o.total)||{},a=e.countyScope!=="county";return`
                                <tr>
                                    <td>${S(e.name)}</td>
                                    <td><span class="county-scope-badge ${a?"is-township":"is-county"}">${a?"本乡镇":"县域学校"}</span></td>
                                    <td>${n.count||0}</td>
                                    <td>${m(n.avg)}</td>
                                    <td>${R(n.excRate)}</td>
                                    <td>${R(n.passRate)}</td>
                                    <td><strong>${m((c=e.countyScore2Rate)!=null?c:e.score2Rate)}</strong></td>
                                    <td>${a&&e.townshipRank2Rate||"-"}</td>
                                    <td>${e.countyRank2Rate||e.rank2Rate||"-"}</td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        `:'<div class="county-empty">暂无学校成绩数据，请先导入本次成绩。</div>'}function $e(t){var l,s,i;const e=Array.isArray(t)?t.slice():bt();if(!e.length)return"";const n=e.slice().sort((d,u)=>(d.countyRankAvg||9999)-(u.countyRankAvg||9999))[0],a=e.slice().sort((d,u)=>(d.countyRankExc||9999)-(u.countyRankExc||9999))[0],o=e.slice().sort((d,u)=>(d.countyRankPass||9999)-(u.countyRankPass||9999))[0],c=new Set(e.map(d=>d.subject).filter(Boolean)),r=e.slice().sort((d,u)=>(d.countyRankAvg||9999)-(u.countyRankAvg||9999)).slice(0,8);return`
            <div class="county-focus-card county-teacher-focus">
                <div>
                    <span>本校教师县域画像</span>
                    <strong>${e.length} 个教师-学科样本</strong>
                    <p>县域口径会把本校任课教师与县直、乡镇所有学校同学科整体表现放在一起对标，普通教师模块仍只看乡镇口径。</p>
                </div>
                <div class="county-focus-metrics">
                    <em>覆盖学科 <b>${c.size}</b></em>
                    <em>均分最好 <b>${S((n==null?void 0:n.teacherName)||"-")} #${(l=n==null?void 0:n.countyRankAvg)!=null?l:"-"}</b></em>
                    <em>优秀率最好 <b>${S((a==null?void 0:a.teacherName)||"-")} #${(s=a==null?void 0:a.countyRankExc)!=null?s:"-"}</b></em>
                    <em>及格率最好 <b>${S((o==null?void 0:o.teacherName)||"-")} #${(i=o==null?void 0:o.countyRankPass)!=null?i:"-"}</b></em>
                </div>
            </div>
            <div class="table-wrap analysis-table-shell county-focus-table">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>教师</th><th>学科</th><th>均分</th><th>优秀率</th><th>及格率</th><th>县均排</th><th>县优排</th><th>县及格排</th></tr></thead>
                    <tbody>
                        ${r.map(d=>{var u,w,p;return`
                            <tr>
                                <td>${S(d.teacherName)}</td>
                                <td>${S(d.subject)}</td>
                                <td>${m(d.avg,1)}</td>
                                <td>${R(d.excellentRate)}</td>
                                <td>${R(d.passRate)}</td>
                                <td>${(u=d.countyRankAvg)!=null?u:"-"}</td>
                                <td>${(w=d.countyRankExc)!=null?w:"-"}</td>
                                <td>${(p=d.countyRankPass)!=null?p:"-"}</td>
                            </tr>
                        `}).join("")}
                    </tbody>
                </table>
            </div>
        `}function _e(){x()&&tt(A());const t=j(10);if(!t.length)return T()?'<div class="county-empty">教师画像正在后台生成，请稍候。页面可先查看县域学校横向分析，不会再阻塞系统。</div>':'<div class="county-empty">暂无任课表或教师画像数据。导入任课表后，这里会展示县域样本下的教师教学画像。</div>';const e=bt(),n=kt().map(a=>`
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
                            ${a.rows.map(o=>{var c,r,l;return`
                                <tr class="${o.type==="teacher"?"county-teacher-own-row":""}">
                                    <td>${(c=o.rankAvg)!=null?c:"-"}</td>
                                    <td>${S(o.name||"")}</td>
                                    <td>${o.type==="teacher"?"本校教师":"学校整体"}</td>
                                    <td>${m(o.avg,1)}</td>
                                    <td>${(r=o.rankExc)!=null?r:"-"}</td>
                                    <td>${R(o.excellentRate)}</td>
                                    <td>${(l=o.rankPass)!=null?l:"-"}</td>
                                    <td>${R(o.passRate)}</td>
                                    <td>${o.studentCount||0}</td>
                                </tr>
                            `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join("");return`
            <div class="county-portrait-grid">
                ${t.map((a,o)=>{var c,r,l;return`
                    <article class="county-portrait-card ${a.riskLevel==="risk"?"is-risk":""}">
                        <span class="county-portrait-rank">#${o+1}</span>
                        <h4>${S(a.teacherName)} / ${S(a.subject)}</h4>
                        <strong>${m(a.score,1)}</strong>
                        <p>均分 ${m(a.avg,1)} · 优秀率 ${R(a.excellentRate)} · 及格率 ${R(a.passRate)} · 样本 ${a.studentCount}</p>
                        <div class="county-portrait-rankline">
                            <span>县均排 #${(c=a.countyRankAvg)!=null?c:"-"}</span>
                            <span>优排 #${(r=a.countyRankExc)!=null?r:"-"}</span>
                            <span>及排 #${(l=a.countyRankPass)!=null?l:"-"}</span>
                        </div>
                    </article>
                `}).join("")}
            </div>
            ${$e(e)}
            ${n?`
                <div class="analysis-table-meta">
                    <span><strong>同学科完整排名：</strong>每个学科单独成表，本校教师与其他学校同学科整体放在同一张县域榜里。</span>
                </div>
                ${n}
            `:""}
        `}function Xe(){const t=St().slice(0,40);if(!t.length)return'<div class="county-empty">暂无学生成绩数据。</div>';const e=window.SUBJECTS||[];return`
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
                                ${e.map(a=>{var o,c,r,l;return`
                                    <td>${((c=(o=n==null?void 0:n.ranks)==null?void 0:o[a])==null?void 0:c.township)||"-"}</td>
                                    <td>${((l=(r=n==null?void 0:n.ranks)==null?void 0:r[a])==null?void 0:l.county)||"-"}</td>
                                `}).join("")}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `}function Ke(){const t=Tt().slice(0,20);return t.length?`
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>学校</th><th>本次县排名</th><th>上次县排名</th><th>变化</th><th>本次两率一分</th></tr></thead>
                    <tbody>
                        ${t.map(({current:e,previous:n})=>{const a=y(n.countyRank)-y(e.countyRank);return`
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
        `:'<div class="county-empty">县域历史样本不足。后续再次导入县域成绩后，这里会自动显示县排名变化。</div>'}function _t(){const t=["county-teacher-portrait","county-school-horizontal","county-analysis"].find(e=>{var n,a;return(a=(n=document.getElementById(e))==null?void 0:n.classList)==null?void 0:a.contains("active")});return t==="county-analysis"?"county-teacher-portrait":t||"county-teacher-portrait"}function Oe(t=_t()){var n;const e=document.getElementById(t)||document.getElementById("county-analysis");return((n=e==null?void 0:e.querySelector)==null?void 0:n.call(e,".county-analysis-root"))||document.getElementById("county-analysis-root")}function Ot(){const t=document.getElementById("county-analysis");!t||t.dataset.countySubmoduleHost==="1"||(t.dataset.countySubmoduleHost="1",Object.entries(rt).forEach(([e,n])=>{if(document.getElementById(e))return;const a=document.createElement("div");a.id=e,a.className="section card-box analysis-workspace analysis-workspace-county",a.innerHTML=`
                <div class="module-desc-bar analysis-hero" style="border-color:#0f766e;">
                    <h3><i class="ti ti-map-2"></i> ${S(n.title)} <span class="badge" style="background:#0f766e;">${S(n.badge)}</span></h3>
                    <p>${S(n.description)}</p>
                </div>
                <div class="county-analysis-root">
                    <div class="info-bar analysis-info-band">导入县级成绩后，这里只呈现县域专用分析，不改变联考分析、教学管理和学情诊断的原有口径。</div>
                </div>
            `,t.insertAdjacentElement("afterend",a)}))}function It(t){const e=N();if(f.subjectRowCacheSignature!==e&&(f.subjectRowCacheSignature=e,f.subjectRowCache=new Map),f.subjectRowCache.has(t))return(f.subjectRowCache.get(t)||[]).map(c=>({...c}));const n=Object.values(window.SCHOOLS||{}).filter(c=>{var r;return(r=c==null?void 0:c.metrics)==null?void 0:r[t]}).map(c=>({school:c,metric:c.metrics[t]}));if(!n.length)return f.subjectRowCache.set(t,[]),[];const a=n.reduce((c,r)=>(c.avg=Math.max(c.avg,y(r.metric.avg)),c.excellent=Math.max(c.excellent,y(r.metric.excRate)),c.pass=Math.max(c.pass,y(r.metric.passRate)),c),{avg:0,excellent:0,pass:0}),o=n.map(c=>{const r=gt(c.metric,a);return{schoolName:c.school.name||"",count:y(c.metric.count),avg:y(c.metric.avg),excellentRate:y(c.metric.excRate),passRate:y(c.metric.passRate),ratedAvg:r.ratedAvg,ratedExc:r.ratedExc,ratedPass:r.ratedPass,score:r.ratedAvg+r.ratedExc+r.ratedPass}});return k(o,c=>c.avg,(c,r)=>{c.rankAvg=r}),k(o,c=>c.excellentRate,(c,r)=>{c.rankExcellent=r}),k(o,c=>c.passRate,(c,r)=>{c.rankPass=r}),k(o,c=>c.score,(c,r)=>{c.rank=r}),o.sort((c,r)=>(c.rank||9999)-(r.rank||9999)),f.subjectRowCache.set(t,o.map(c=>({...c}))),o.map(c=>({...c}))}function et(t={}){var s,i,d;const e=t.required!==!1,n=t.silent===!0,a=document.getElementById("countySchoolNameInput"),o=String((a==null?void 0:a.value)||"").trim();if(!o)return e?(!n&&((s=window.UI)!=null&&s.toast)&&window.UI.toast("请输入本校名称","warning"),!1):!0;const c=b();let r=o;if(c.length&&!c.includes(o)&&(typeof window.resolveSchoolNameFromCollection=="function"&&(r=window.resolveSchoolNameFromCollection(c,o)||o),!c.includes(r)&&typeof window.getCanonicalSchoolName=="function"&&(r=window.getCanonicalSchoolName(o,c)||r)),c.length&&!c.includes(r))return!n&&((i=window.UI)!=null&&i.toast)&&window.UI.toast("当前县级成绩中没有匹配到该学校，请核对名称","warning"),!1;window.MY_SCHOOL=r;try{localStorage.setItem("MY_SCHOOL",r)}catch(u){}typeof window.writeCurrentSchool=="function"&&window.writeCurrentSchool(r);const l=document.getElementById("mySchoolSelect");return l&&Array.from(l.options||[]).some(u=>u.value===r)&&(l.value=r),a&&(a.value=r),!n&&((d=window.UI)!=null&&d.toast)&&window.UI.toast(`已锁定本校：${r}`,"success"),!0}function Mt(){var e;et({required:!1,silent:!0})&&(f.subjectRowCache=new Map,f.subjectRowCacheSignature="",f.horizontalTotalCache=[],f.horizontalTotalCacheSignature="",$(),X(),O("county-school-horizontal"),(e=window.UI)!=null&&e.toast&&window.UI.toast("县域学校横向对比表已生成","success"))}function Ht(){return{buildCountyHorizontalTotalRows:yt,buildCountySubjectRows:It,sortCountySubjects:B,resolveCurrentCountySchoolName:wt,getExamKey:E,escapeHtml:S,toNumber:y,formatNumber:m,formatCountyRankDisplay:Re}}function Ge(t=""){const e=window.CountySchoolHorizontalRenderer;return!e||typeof e.renderTotalTable!="function"?'<div class="county-empty">县域学校横向分析组件加载中，请稍后重试。</div>':e.renderTotalTable(Ht(),t)}function Ie(){const t=window.CountySchoolHorizontalRenderer;return!t||typeof t.renderSchoolHorizontal!="function"?'<div class="county-empty">县域学校横向分析组件加载中，请稍后重试。</div>':t.renderSchoolHorizontal(Ht())}function Me(){return`
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
                ${_e()}
            </div>
        `}function O(t=_t()){var e,n,a;if(!f.isRendering){f.isRendering=!0;try{f.teacherContextToken+=1;const o=f.teacherContextToken;Ot();const c=t==="county-analysis"?"county-teacher-portrait":t,r=Oe(c);if(!r)return;const l=$();c==="county-teacher-portrait"&&window.setTimeout(()=>{_(o)&&Ct(!1,{token:o,requireActive:!0}).then(p=>{p!=null&&p.changed&&_(o)&&!f.isRendering&&O(c)})},0);const s=b(),i=((e=l.countySchools)==null?void 0:e.length)||0,d=((n=l.townshipSchools)==null?void 0:n.length)||0,u=(window.RAW_DATA||[]).length,w=`
            <div class="county-kpi-grid">
                <div><span>本次范围</span><strong>${l.includesCounty?"县域 + 乡镇":"乡镇"}</strong><em>${S(E())}</em></div>
                <div><span>学校数</span><strong>${s.length}</strong><em>乡镇 ${d} · 县域 ${i}</em></div>
                <div><span>学生样本</span><strong>${u}</strong><em>已补充 countyRank / townshipRank</em></div>
                <div><span>当前子模块</span><strong>${S(((a=rt[c])==null?void 0:a.title)||"县域教师画像")}</strong><em>不影响其他母模块</em></div>
            </div>
            ${c==="county-school-horizontal"?Ie():Me()}
        `;r.innerHTML=w}finally{f.isRendering=!1}}}function He(){}function je(){}function nt(t,e){var n;return t!=null&&t.ranks?e==="total"?t.countyRank||"-":((n=t.ranks[e])==null?void 0:n.county)||"-":"-"}function Ve(){var L,U,D,F;if(!(window.RAW_DATA||[]).length){alert("请先上传数据");return}$();const t=typeof window.getCurrentUser=="function"?window.getCurrentUser():null,e=(t==null?void 0:t.role)||"guest",n=e==="teacher",a=e==="class_teacher",o=a&&typeof window.getClassTeacherStudentViewMode=="function"?window.getClassTeacherStudentViewMode():"teaching",r=(n||a&&o==="teaching")&&typeof window.getTeacherScopeForUser=="function"?window.getTeacherScopeForUser(t):null,l=n||a&&o==="teaching"?(window.SUBJECTS||[]).filter(h=>{var C;return(C=r==null?void 0:r.subjects)==null?void 0:C.has(window.normalizeSubject?window.normalizeSubject(h):h)}):window.SUBJECTS||[],s=((L=document.getElementById("studentSchoolSelect"))==null?void 0:L.value)||"",i=((U=document.getElementById("studentClassSelect"))==null?void 0:U.value)||"",d=typeof window.isSingleSchoolMode=="function"?window.isSingleSchoolMode():Object.keys(window.SCHOOLS||{}).length<=1;let u=[...window.RAW_DATA||[]];if((n||a&&o==="teaching")&&((D=r==null?void 0:r.classes)==null?void 0:D.size)>0)u=u.filter(h=>{const C=String(h.class||"").trim(),K=typeof window.normalizeClass=="function"?window.normalizeClass(h.class):C;return r.classes.has(K)||r.classes.has(C)?!0:Array.from(r.classes).some(G=>String(G).replace(/[\s\.]/g,"")===C.replace(/[\s\.]/g,""))});else if(a&&(t!=null&&t.class)&&typeof window.normalizeClass=="function"){const h=window.normalizeClass(t.class);u=u.filter(C=>window.normalizeClass(C.class)===h)}s&&!s.includes("请选择")&&(u=u.filter(h=>h.school===s)),i&&i!=="全部"&&(u=u.filter(h=>h.class===i)),typeof window.getComparisonStudentList=="function"&&(u=window.getComparisonStudentList(u,window.RAW_DATA||[])),u.sort((h,C)=>(Number(C.total)||0)-(Number(h.total)||0));const w=typeof window.hasStudentCountyRankData=="function"?window.hasStudentCountyRankData(u,l):u.some(h=>nt(h,"total")!=="-"),p=n||a?["学校","班级","姓名"]:["学校","班级","姓名","考号","考场","相对总分"];l.forEach(h=>{n||a?p.push(`${h} 分数`,`${h} 班排`,`${h} 级排`):p.push(`${h} 分数`,`${h} 相对分`,`${h} 校排`,`${h} 班排`),d||p.push(`${h} 镇排`),w&&p.push(`${h} 县排`)});const g=String(((F=window.CONFIG)==null?void 0:F.name)||"").includes("9")?"五科总分":"总分";n||a?p.push(g,"总分班排","总分级排"):p.push(g,`${g}校排`,`${g}班排`),d||p.push(`${g}镇排`),w&&p.push(`${g}县排`);const z=[p];u.forEach(h=>{var K,G,Lt,Ut,Dt,Ft,Bt,Yt,Xt,Kt,Gt,Vt,Jt,Wt,qt;const C=n||a?[h.school,h.class,h.name]:[h.school,h.class,h.name,h.id,h.examRoom,h.totalTScore||0];l.forEach(v=>{var Qt,Zt,te,ee,ne,ae,oe,re,ce,ie,se,le,ue,de,he,pe,fe,ye,we,ge,me;n||a?C.push((Zt=(Qt=h.scores)==null?void 0:Qt[v])!=null?Zt:"-",(ne=(ee=(te=h==null?void 0:h.ranks)==null?void 0:te[v])==null?void 0:ee.class)!=null?ne:"-",(re=(oe=(ae=h==null?void 0:h.ranks)==null?void 0:ae[v])==null?void 0:oe.school)!=null?re:"-"):C.push((ie=(ce=h.scores)==null?void 0:ce[v])!=null?ie:"-",(le=(se=h==null?void 0:h.tScores)==null?void 0:se[v])!=null?le:"-",(he=(de=(ue=h==null?void 0:h.ranks)==null?void 0:ue[v])==null?void 0:de.school)!=null?he:"-",(ye=(fe=(pe=h==null?void 0:h.ranks)==null?void 0:pe[v])==null?void 0:fe.class)!=null?ye:"-"),d||C.push((me=(ge=(we=h==null?void 0:h.ranks)==null?void 0:we[v])==null?void 0:ge.township)!=null?me:"-"),w&&C.push(nt(h,v))}),n||a?C.push(h.total,(Lt=(G=(K=h==null?void 0:h.ranks)==null?void 0:K.total)==null?void 0:G.class)!=null?Lt:"-",(Ft=(Dt=(Ut=h==null?void 0:h.ranks)==null?void 0:Ut.total)==null?void 0:Dt.school)!=null?Ft:"-"):C.push(h.total,(Xt=(Yt=(Bt=h==null?void 0:h.ranks)==null?void 0:Bt.total)==null?void 0:Yt.school)!=null?Xt:"-",(Vt=(Gt=(Kt=h==null?void 0:h.ranks)==null?void 0:Kt.total)==null?void 0:Gt.class)!=null?Vt:"-"),d||C.push((qt=(Wt=(Jt=h==null?void 0:h.ranks)==null?void 0:Jt.total)==null?void 0:Wt.township)!=null?qt:"-"),w&&C.push(nt(h,"total")),z.push(C)});const I=window.XLSX.utils.book_new(),P=window.XLSX.utils.aoa_to_sheet(z);if(typeof window.decorateExcelSheet=="function"&&window.decorateExcelSheet(P,p),window.XLSX.utils.book_append_sheet(I,P,"学生考试明细"),n||a){const h=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,new Set(l||[])):"teacher";window.XLSX.writeFile(I,`学生考试明细_${h}.xlsx`)}else window.XLSX.writeFile(I,"学生考试明细.xlsx")}function jt(){const t=document.getElementById("upload-feedback-board");if(!t)return;let e=document.getElementById("upload-county-scope-card");e||(e=document.createElement("div"),e.id="upload-county-scope-card",e.className="upload-feedback-card",t.appendChild(e));const n=A();e.innerHTML=`
            <h4><i class="ti ti-map-2"></i> 县域对比口径</h4>
            <p>${n!=null&&n.includesCounty?`已启用县域排名：乡镇 ${n.townshipSchools.length} 所，县域学校 ${n.countySchools.length} 所。`:"本次暂按乡镇成绩处理。导入新成绩时会询问是否包含县里学校。"}</p>
        `}function at(t,e){const n=window[t];if(typeof n!="function"||n[`__countyPatched_${t}`])return!1;const a=function(...c){const r=n.apply(this,c),l=s=>(e(...c),s);return r&&typeof r.then=="function"?r.then(l):(l(r),r)};return a[`__countyPatched_${t}`]=!0,window[t]=a,!0}function ze(t){const e=window[t];return typeof e=="function"&&!!e[`__countyPatched_${t}`]}function zt(){return at("processData",()=>{$(),X(),$t()}),at("renderTables",()=>{$()}),at("switchTab",t=>{(t==="county-analysis"||t==="county-teacher-portrait"||t==="county-school-horizontal")&&setTimeout(()=>O(t),0)}),["processData","renderTables","switchTab"].every(ze)}function Pe(){document.addEventListener("change",t=>{const e=t.target;!e||e.id!=="fileInput"||e.files&&e.files.length&&(f.preUploadTownshipSchools=b().filter(n=>!ut(n)),f.promptArmed=!0)},!0)}function Le(){if(document.getElementById("county-analysis-runtime-style"))return;const t=document.createElement("style");t.id="county-analysis-runtime-style",t.textContent=`
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
        `,document.head.appendChild(t)}function Pt(){Le(),Ot(),Pe();const t=zt();if(jt(),t)return;let e=0;const n=setInterval(()=>{e+=1,(zt()||e>40)&&clearInterval(n)},300)}window.CountyAnalysisRuntime={applyCountyRanks:$,renderCountyAnalysis:O,ensureTeacherContextForCountyAnalysis:Ct,promptCountyScopeIfNeeded:$t,decorateAnalysisTable:He,decorateStudentDetails:je,saveCountySnapshot:X,getCurrentScope:A,exportCountyAnalysisSection:Nt,setCountyAnalysisSchoolNameFromInput:et,generateCountySchoolHorizontalTable:Mt},window.renderCountyAnalysis=O,window.exportCountyAnalysisSection=Nt,window.setCountyAnalysisSchoolNameFromInput=et,window.generateCountySchoolHorizontalTable=Mt,window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__=!0,document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Pt,{once:!0}):Pt()})();
