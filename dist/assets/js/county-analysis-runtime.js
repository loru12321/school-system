(()=>{if(typeof window=="undefined"||window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__)return;const tt="COUNTY_ANALYSIS_SCOPE_V1",V="COUNTY_ANALYSIS_HISTORY_V1",w={promptArmed:!1,lastSignature:"",teacherContextPromise:null,lastTeacherContextSignature:"",lastTeacherContextAt:0,subjectRowCacheSignature:"",subjectRowCache:new Map,preUploadTownshipSchools:[],isRendering:!1,lastRankSignature:""},et={"county-teacher-portrait":{title:"县域教师画像",badge:"教师县域排名",description:"对照“教师教学质量画像”，把本校教师放到县域所有学校同学科样本中排名，查看学科教师县域站位。"},"county-school-horizontal":{title:"县域学校横向分析",badge:"全县横向对比",description:"对照“两率一分(横向)”，生成五科总综合分析表和各学科明细表，按县域所有学校统一排名。"}},me=["语文","数学","英语","物理","化学","政治"],nt=["语文","数学","英语","物理","化学","历史","地理","生物","政治"];function S(t){return String(t!=null?t:"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function y(t,e=0){const n=Number(t);return Number.isFinite(n)?n:e}function x(t,e,n){if(window.RankingDataService&&typeof window.RankingDataService.assignCompetitionRanks=="function")return window.RankingDataService.assignCompetitionRanks(t,e,n);const o=Array.isArray(t)?t.slice():[];o.sort((a,i)=>Number(e(i)||0)-Number(e(a)||0));let s=null,r=0;return o.forEach((a,i)=>{const d=Number(e(a)),c=s!==null&&Math.abs(d-s)<1e-4?r:i+1;n(a,c),s=d,r=c}),o}function m(t,e=2){const n=Number(t);return Number.isFinite(n)?n.toFixed(e):"-"}function b(t){const e=Number(t);return Number.isFinite(e)?`${(e*100).toFixed(1)}%`:"-"}function N(t,e,n=!1){const o=Number(t),s=Number.isFinite(o)?n?`${(o*100).toFixed(2)}%`:o.toFixed(2):"-",r=e?` <span style="font-size:0.9em; color:#94a3b8">(${e})</span>`:"";return`${s}${r}`}function J(t){const e=String(t||"").trim();return typeof window.normalizeSubject=="function"?window.normalizeSubject(e):e.replace(/\s+/g,"")}function we(){var o,s,r;const t=typeof window.getExamMetaFromUI=="function"?window.getExamMetaFromUI():{},e=a=>{try{return localStorage.getItem(a)||""}catch(i){return""}},n=[t==null?void 0:t.grade,(o=window.CURRENT_COHORT_META)==null?void 0:o.grade,(s=window.CONFIG)==null?void 0:s.grade,(r=window.CONFIG)==null?void 0:r.name,e("CURRENT_TEACHER_TERM_ID"),e("CURRENT_TERM_ID")];for(const a of n){const i=String(a||"").match(/([6-9])\s*年?级?/);if(i)return Number(i[1])}return 0}function at(){const t=we();return t===9?me:([6,7,8].includes(t),nt)}function F(t){const e=at().map(J);return Array.from(new Set((t||[]).map(o=>String(o||"").trim()).filter(Boolean))).sort((o,s)=>{const r=D(o),a=D(s);return r!==a?r-a:String(o).localeCompare(String(s),"zh-CN",{numeric:!0})})}function D(t){const n=at().map(J).indexOf(J(t));return n>=0?n:999}function ot(){var e;return String(((e=window.CONFIG)==null?void 0:e.name)||"").trim().includes("9")?{avg:50,excellent:80,pass:50}:{avg:60,excellent:70,pass:70}}function rt(t,e=5e3,n=!1){return Promise.race([Promise.resolve(t).catch(()=>n),new Promise(o=>setTimeout(()=>o(n),e))])}function K(t,e){try{const n=localStorage.getItem(t);return n?JSON.parse(n):e}catch(n){return e}}function st(t,e){try{localStorage.setItem(t,JSON.stringify(e))}catch(n){console.warn("[county-analysis] failed to persist state:",n)}}function T(){var t;return String(window.CURRENT_EXAM_ID||(typeof window.readWorkspaceExamId=="function"?window.readWorkspaceExamId():"")||((t=window.COHORT_DB)==null?void 0:t.currentExamId)||"current").trim()||"current"}function k(){return Object.keys(window.SCHOOLS||{}).filter(Boolean).sort((t,e)=>t.localeCompare(e,"zh-CN"))}function it(t){const e=String(t||"").trim();return/^(?:\u6574\u4f53|\u5168\u90e8|\u6c47\u603b|\u603b\u8868|\u5408\u8ba1|\u5168\u53bf|\u53bf\u57df|Sheet\d*|\u5de5\u4f5c\u8868\d*)$/i.test(e)}function ct(t){return typeof window.normalizeSchoolName=="function"&&window.normalizeSchoolName(t)||String(t||"").trim()}function lt(t){const e=Array.isArray(t)?t.filter(Boolean):k();if(!e.length)return[];if(typeof window.getTownshipManagedSchoolNames=="function"){const a=window.getTownshipManagedSchoolNames(e);if(Array.isArray(a)&&a.length)return a}const n=window.TARGETS&&typeof window.TARGETS=="object"?window.TARGETS:{},o=Object.keys(n);if(!o.length)return[];const s=new Map;e.forEach(a=>{s.set(ct(a),a)});const r=o.map(a=>{if(typeof window.resolveSchoolNameFromCollection=="function"){const i=window.resolveSchoolNameFromCollection(e,a);if(i)return i}if(typeof window.getCanonicalSchoolName=="function"){const i=window.getCanonicalSchoolName(a,e);if(i&&e.includes(i))return i}return s.get(ct(a))||""}).filter(a=>a&&!it(a));return Array.from(new Set(r)).sort((a,i)=>a.localeCompare(i,"zh-CN"))}function _(){const t=Object.keys(window.TARGETS&&typeof window.TARGETS=="object"?window.TARGETS:{}).sort((n,o)=>String(n).localeCompare(String(o),"zh-CN")),e=Number(window.__RAW_DATA_VERSION||0);return[T(),Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:0,e,k().join("|"),t.join("|")].join("::")}function dt(){const t=K(tt,{});return t&&typeof t=="object"?t:{}}function v(){return dt()[T()]||null}function Se(t){const e=dt();e[T()]=t,st(tt,e)}function Pe(t){return String(t||"").split(/[,\n，、]+/).map(e=>e.trim()).filter(Boolean)}function be(t,e=null){const n=Array.isArray(t)?t.filter(Boolean):k();return lt(n)}function M(t){const e=k(),n=lt(e),o=new Set(n),s=d=>o.has(d)?!0:typeof window.isTownshipManagedSchool=="function"?window.isTownshipManagedSchool(d,e):n.some(c=>typeof window.areSchoolNamesMatched=="function"?window.areSchoolNamesMatched(c,d,!0):c===d),r=e.filter(d=>s(d)),a=e.filter(d=>!s(d)),i=!!(t!=null&&t.includesCounty)&&(r.length>0||a.length>0);return{examKey:T(),includesCounty:i,explicitCountyUpload:i&&(t==null?void 0:t.explicitCountyUpload)===!0,townshipSchools:r,countySchools:a,signature:(t==null?void 0:t.signature)||_(),updatedAt:(t==null?void 0:t.updatedAt)||new Date().toISOString()}}function ut(){return Object.values(window.SCHOOLS||{}).slice().sort((t,e)=>(t.countyRank2Rate||9999)-(e.countyRank2Rate||9999))}function W(){const t=Object.values(window.SCHOOLS||{}).filter(e=>{var n;return(n=e==null?void 0:e.metrics)==null?void 0:n.total}).map(e=>{var o,s,r,a,i;const n=e.metrics.total||{};return{school:e,schoolName:e.name||"",count:y(n.count),avg:y(n.avg),excellentRate:y(n.excRate),passRate:y(n.passRate),ratedAvg:y((o=n.countyRatedAvg)!=null?o:e.countyRatedAvg),ratedExc:y((s=n.countyRatedExc)!=null?s:e.countyRatedExc),ratedPass:y((r=n.countyRatedPass)!=null?r:e.countyRatedPass),score:y((i=(a=n.countyScore2Rate)!=null?a:e.countyScore2Rate)!=null?i:e.score2Rate)}});return x(t,e=>e.avg,(e,n)=>{e.rankAvg=n}),x(t,e=>e.excellentRate,(e,n)=>{e.rankExcellent=n}),x(t,e=>e.passRate,(e,n)=>{e.rankPass=n}),x(t,e=>e.score,(e,n)=>{e.rankScore=n}),t.sort((e,n)=>(e.rankScore||9999)-(n.rankScore||9999))}function pt(){const t=k();if(!t.length)return"";const e=[typeof window.readCurrentSchool=="function"?window.readCurrentSchool():"",window.MY_SCHOOL,(()=>{try{return localStorage.getItem("MY_SCHOOL")||""}catch(n){return""}})()].map(n=>String(n||"").trim()).filter(Boolean);for(const n of e){if(t.includes(n))return n;if(typeof window.resolveSchoolNameFromCollection=="function"){const o=window.resolveSchoolNameFromCollection(t,n);if(o)return o}if(typeof window.getCanonicalSchoolName=="function"){const o=window.getCanonicalSchoolName(n,t);if(o&&t.includes(o))return o}}return""}function ht(t,e){const n=ot();return{ratedAvg:e.avg?y(t==null?void 0:t.avg)/e.avg*n.avg:0,ratedExc:e.excellent?y(t==null?void 0:t.excRate)/e.excellent*n.excellent:0,ratedPass:e.pass?y(t==null?void 0:t.passRate)/e.pass*n.pass:0}}function yt(t,e,n,o){const s=M(o||v()||{}),r=new Set(s.townshipSchools||[]),a=Object.values(window.SCHOOLS||{}).filter(l=>{var f;return(f=l==null?void 0:l.metrics)==null?void 0:f[t]}).filter(l=>n!=="township"||r.has(l.name));if(!a.length)return null;const i=a.reduce((l,f)=>{var g;const h=((g=f==null?void 0:f.metrics)==null?void 0:g[t])||{};return l.avg=Math.max(l.avg,y(h.avg)),l.excellent=Math.max(l.excellent,y(h.excRate)),l.pass=Math.max(l.pass,y(h.passRate)),l},{avg:0,excellent:0,pass:0}),d=a.map(l=>{var g;const f=((g=l==null?void 0:l.metrics)==null?void 0:g[t])||{},h=ht(f,i);return{name:l.name,metric:f,score:h.ratedAvg+h.ratedExc+h.ratedPass}}).sort((l,f)=>f.score-l.score);let c=d.find(l=>l.name===e);return!c&&typeof window.areSchoolNamesMatched=="function"&&(c=d.find(l=>window.areSchoolNamesMatched(l.name,e,!0))),c?{rank:d.findIndex(l=>l===c)+1,total:d.length,score:c.score,metric:c.metric}:null}function He(t){var a,i;const e=pt(),n=e?(window.SCHOOLS||{})[e]:null;if(!n)return'<div class="county-empty">未锁定本校。请先在数据管理里设置本校，县域分析会自动补充本校学科对比。</div>';const o=((a=n.metrics)==null?void 0:a.total)||{},s=n.countyScope!=="county",r=(window.SUBJECTS||[]).map(d=>{var f,h,g;const c=yt(d,e,"county",t),u=s?yt(d,e,"township",t):null;if(!c&&!u)return"";const l=c||u;return`
                    <tr>
                        <td>${S(d)}</td>
                        <td>${m((f=l==null?void 0:l.metric)==null?void 0:f.avg,1)}</td>
                        <td>${b((h=l==null?void 0:l.metric)==null?void 0:h.excRate)}</td>
                        <td>${b((g=l==null?void 0:l.metric)==null?void 0:g.passRate)}</td>
                        <td>${u?`${u.rank}/${u.total}`:"-"}</td>
                        <td>${c?`${c.rank}/${c.total}`:"-"}</td>
                    </tr>
                `}).filter(Boolean).join("");return`
            <div class="county-focus-card">
                <div>
                    <span>本校县域站位</span>
                    <strong>${S(e)}</strong>
                    <p>${s?"本校属于乡镇学校：普通模块只按乡镇计算，县域分析里同时显示县排名。":"本校当前按县直学校处理：仅在县域分析和学生县排名场景参与。"}</p>
                </div>
                <div class="county-focus-metrics">
                    <em>乡镇总排 <b>${s&&n.townshipRank2Rate||"-"}</b></em>
                    <em>县域总排 <b>${n.countyRank2Rate||"-"}</b></em>
                    <em>两率一分 <b>${m((i=n.countyScore2Rate)!=null?i:n.score2Rate)}</b></em>
                    <em>样本 <b>${o.count||0}</b></em>
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
        `}function ft(){return(window.RAW_DATA||[]).filter(t=>Number.isFinite(Number(t==null?void 0:t.total))).slice().sort((t,e)=>{const n=Number(t.townshipRank||9999),o=Number(e.townshipRank||9999);return n!==o?n-o:(t.countyRank||9999)-(e.countyRank||9999)})}function O(){return Object.keys(G().map||{}).length>0}function P(){return!!window.TEACHER_STATS&&Object.keys(window.TEACHER_STATS).length>0}function gt(){var t;return typeof window.readCurrentSchool=="function"?String(window.readCurrentSchool()||"").trim():String(window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||((t=document.getElementById("mySchoolSelect"))==null?void 0:t.value)||"").trim()}function G(){const t=window.TEACHER_MAP&&typeof window.TEACHER_MAP=="object"?window.TEACHER_MAP:{},e=window.TEACHER_SCHOOL_MAP&&typeof window.TEACHER_SCHOOL_MAP=="object"?window.TEACHER_SCHOOL_MAP:{},n=gt(),o=Object.values(e).map(a=>String(a||"").trim()).filter(Boolean);if(!n||!o.length)return{map:t,schoolMap:e,schoolName:n,scoped:!1,matched:Object.keys(t).length>0};const s={},r={};return Object.entries(t).forEach(([a,i])=>{String(e[a]||"").trim()===n&&(s[a]=i,r[a]=e[a])}),{map:s,schoolMap:r,schoolName:n,scoped:!0,matched:Object.keys(s).length>0}}function mt(){const t=G();return!t.scoped||!t.matched||Object.keys(t.map).length===Object.keys(window.TEACHER_MAP||{}).length||(typeof window.setTeacherMap=="function"?window.setTeacherMap(t.map):window.TEACHER_MAP=t.map,typeof window.setTeacherSchoolMap=="function"?window.setTeacherSchoolMap(t.schoolMap):window.TEACHER_SCHOOL_MAP=t.schoolMap,typeof window.setTeacherStats=="function"?window.setTeacherStats({}):window.TEACHER_STATS={}),t}function Re(){var e;const t=String(((e=window.location)==null?void 0:e.hostname)||"").trim().toLowerCase();return t&&t!=="127.0.0.1"&&t!=="localhost"}async function wt(t=!1){const e=gt(),n=G(),o=`${_()}::${e}::${Object.keys(n.map||{}).length}::${Object.keys(window.TEACHER_STATS||{}).length}`,s=Date.now();if(!t&&w.lastTeacherContextSignature===o&&s-Number(w.lastTeacherContextAt||0)<3e4&&(O()||P()))return{hasTeacherAssignments:O(),hasTeacherStats:P(),changed:!1,cached:!0};if(!t&&w.teacherContextPromise)return w.teacherContextPromise;w.teacherContextPromise=(async()=>{let r=!1;if(!O()&&!e&&typeof window.tryAutoRestoreTeacherMap=="function")try{r=!!await rt(window.tryAutoRestoreTeacherMap(),4e3,!1)||r}catch(a){console.warn("[county-analysis] tryAutoRestoreTeacherMap failed:",a)}if(!O()&&Re()&&window.CloudManager&&typeof window.CloudManager.loadTeachers=="function")try{r=!!await rt(window.CloudManager.loadTeachers({background:!0,toast:!1,blocking:!1,schoolName:e}),1e4,!1)||r}catch(a){console.warn("[county-analysis] loadTeachers failed:",a)}if(mt(),!P()&&O()&&typeof window.analyzeTeachers=="function")try{window.analyzeTeachers(),r=!0}catch(a){console.warn("[county-analysis] analyzeTeachers failed:",a)}return P()&&St(v()),{hasTeacherAssignments:O(),hasTeacherStats:P(),changed:r}})();try{const r=await w.teacherContextPromise;return(r!=null&&r.hasTeacherAssignments||r!=null&&r.hasTeacherStats)&&(w.lastTeacherContextSignature=o,w.lastTeacherContextAt=Date.now()),r}finally{w.teacherContextPromise=null}}function H(t=12){mt();const e=window.COUNTY_TEACHER_RANKINGS||{},n=[];Object.entries(window.TEACHER_STATS||{}).forEach(([s,r])=>{Object.entries(r||{}).forEach(([a,i])=>{var c,u,l,f,h,g,$,C,U,L,z,j;const d=((c=e==null?void 0:e[s])==null?void 0:c[a])||{};n.push({teacherName:s,subject:a,score:y((h=(f=(l=(u=i.finalScore)!=null?u:i.fairScore)!=null?l:i.leagueScore)!=null?f:i.avgValue)!=null?h:i.avg),avg:y((g=i.avgValue)!=null?g:i.avg),passRate:y(i.passRate),excellentRate:y(($=i.excellentRate)!=null?$:i.excRate),studentCount:y((C=i.studentCount)!=null?C:i.count),riskLevel:i.riskLevel||"normal",countyRankAvg:(U=d.rankAvg)!=null?U:null,countyRankExc:(L=d.rankExc)!=null?L:null,countyRankPass:(z=d.rankPass)!=null?z:null,benchmarkCount:(j=d.benchmarkCount)!=null?j:0})})});const o=n.sort((s,r)=>{const a=Number.isFinite(s.countyRankAvg)?s.countyRankAvg:9999,i=Number.isFinite(r.countyRankAvg)?r.countyRankAvg:9999;return a!==i?a-i:r.score-s.score});return!Number.isFinite(t)||t<=0?o:o.slice(0,t)}function St(t){const e=M(t||v()||{includesCounty:!1,townshipSchools:k()}),n=new Set(e.townshipSchools||[]),o={},s={};return F(window.SUBJECTS||[]).forEach(r=>{const a=[];Object.entries(window.TEACHER_STATS||{}).forEach(([i,d])=>{var u,l,f;const c=d==null?void 0:d[r];c&&a.push({name:i,type:"teacher",subject:r,avg:y((u=c.avgValue)!=null?u:c.avg),excellentRate:y((l=c.excellentRate)!=null?l:c.excRate),passRate:y(c.passRate),studentCount:y((f=c.studentCount)!=null?f:c.count),scope:"teacher"})}),Object.values(window.SCHOOLS||{}).forEach(i=>{var c;const d=(c=i==null?void 0:i.metrics)==null?void 0:c[r];d&&a.push({name:i.name||"",type:"school",subject:r,avg:y(d.avg),excellentRate:y(d.excRate),passRate:y(d.passRate),studentCount:y(d.count),scope:n.has(i.name)?"township":"county"})}),a.length&&(a.sort((i,d)=>d.avg-i.avg),a.forEach((i,d)=>{i.rankAvg=d+1}),a.sort((i,d)=>d.excellentRate-i.excellentRate),a.forEach((i,d)=>{i.rankExc=d+1}),a.sort((i,d)=>d.passRate-i.passRate),a.forEach((i,d)=>{i.rankPass=d+1}),a.sort((i,d)=>(i.rankAvg||9999)!==(d.rankAvg||9999)?(i.rankAvg||9999)-(d.rankAvg||9999):i.type!==d.type?i.type==="teacher"?-1:1:String(i.name||"").localeCompare(String(d.name||""),"zh-CN")),a.forEach(i=>{i.type==="teacher"&&(o[i.name]||(o[i.name]={}),o[i.name][r]={rankAvg:i.rankAvg,rankExc:i.rankExc,rankPass:i.rankPass,benchmarkCount:a.length})}),s[r]=a)}),window.COUNTY_TEACHER_RANKINGS=o,window.COUNTY_TEACHER_RANKING_DATA=s,o}function bt(){return H(Number.POSITIVE_INFINITY).filter(t=>Number.isFinite(t.countyRankAvg)).sort((t,e)=>{const n=D(t.subject)-D(e.subject);return n!==0?n:(t.countyRankAvg||9999)!==(e.countyRankAvg||9999)?(t.countyRankAvg||9999)-(e.countyRankAvg||9999):e.score-t.score})}function Rt(){const t=window.COUNTY_TEACHER_RANKING_DATA||{};return F([...Object.keys(t),...H(Number.POSITIVE_INFINITY).map(n=>n.subject)]).map(n=>{const o=(t[n]||[]).slice().sort((s,r)=>(s.rankAvg||9999)!==(r.rankAvg||9999)?(s.rankAvg||9999)-(r.rankAvg||9999):s.type!==r.type?s.type==="teacher"?-1:1:String(s.name||"").localeCompare(String(r.name||""),"zh-CN",{numeric:!0}));return{subject:n,rows:o}}).filter(n=>n.rows.length)}function ke(t){const e=(window.SUBJECTS||[]).map(n=>{var s,r;const o=(r=(s=t==null?void 0:t.ranks)==null?void 0:s[n])==null?void 0:r.county;return Number.isFinite(Number(o))?`${n}#${o}`:""}).filter(Boolean);return e.length?e.join(" / "):"-"}function kt(){const t=K(V,[]).filter(s=>{var r;return(r=s==null?void 0:s.schools)==null?void 0:r.length});if(t.length<2)return[];const e=t[t.length-1],n=t[t.length-2],o=new Map((n.schools||[]).map(s=>[s.name,s]));return(e.schools||[]).map(s=>({current:s,previous:o.get(s.name)})).filter(s=>s.previous).sort((s,r)=>(s.current.countyRank||9999)-(r.current.countyRank||9999))}function xt(){return[["学校名称","实考人数","平均分","平均分排名","优秀率","优秀率排名","及格率","及格率排名","平均分赋分","优秀率赋分","及格率赋分","两率一分总分","县域排名"],...W().map(t=>[t.schoolName||"",t.count||0,m(t.avg),t.rankAvg||"-",b(t.excellentRate),t.rankExcellent||"-",b(t.passRate),t.rankPass||"-",m(t.ratedAvg),m(t.ratedExc),m(t.ratedPass),m(t.score),t.rankScore||"-"])]}function xe(t){return[["学校名称","实考人数","平均分","平均分排名","优秀率","优秀率排名","及格率","及格率排名","平均分赋分","优秀率赋分","及格率赋分","两率一分","县域排名"],..._t(t).map(e=>[e.schoolName||"",e.count||0,m(e.avg,2),e.rankAvg||"-",b(e.excellentRate),e.rankExcellent||"-",b(e.passRate),e.rankPass||"-",m(e.ratedAvg),m(e.ratedExc),m(e.ratedPass),m(e.score),e.rank||"-"])]}function Ue(){return[["学校","范围","人数","平均分","优秀率","及格率","两率一分","乡镇排名","县排名"],...ut().map(t=>{var o,s;const e=((o=t.metrics)==null?void 0:o.total)||{},n=t.countyScope!=="county";return[t.name||"",n?"本乡镇":"县域学校",e.count||0,m(e.avg),b(e.excRate),b(e.passRate),m((s=t.countyScore2Rate)!=null?s:t.score2Rate),n&&t.townshipRank2Rate||"-",t.countyRank2Rate||t.rank2Rate||"-"]})]}function vt(){return[{name:"五科总-综合分析表",rows:xt()},...F(window.SUBJECTS||[]).map(t=>({name:`${t}学科明细`,rows:xe(t)}))]}function Ct(){return[["序位","教师/学校","类型","学科","综合得分","均分","优秀率","及格率","样本人数","县域均分排","县域优秀率排","县域及格率排","对标总量","风险级别"],...H(Number.POSITIVE_INFINITY).map((t,e)=>{var n,o,s;return[e+1,t.teacherName||"","本校教师",t.subject||"",m(t.score,1),m(t.avg,1),b(t.excellentRate),b(t.passRate),t.studentCount||0,(n=t.countyRankAvg)!=null?n:"-",(o=t.countyRankExc)!=null?o:"-",(s=t.countyRankPass)!=null?s:"-",t.benchmarkCount||"-",t.riskLevel||"normal"]}),[],["同学科完整县域排名"],["学科","排名","教师/学校","类型","均分","优秀率","及格率","样本人数"],...Rt().flatMap(t=>t.rows.map(e=>[t.subject,e.rankAvg||"-",e.name||"",e.type==="teacher"?"本校教师":"学校整体",m(e.avg,1),b(e.excellentRate),b(e.passRate),e.studentCount||0]))]}function Le(){const t=window.SUBJECTS||[];return[["乡镇排名","县排名","学生","学校","班级","总分","学科县排速览",...t.flatMap(e=>[`${e}乡排`,`${e}县排`])],...ft().map(e=>[e.townshipRank||"-",e.countyRank||"-",e.name||"",e.school||"",e.class||"",m(e.total,1),ke(e),...t.flatMap(n=>{var o,s,r,a,i,d;return[(r=(s=(o=e==null?void 0:e.ranks)==null?void 0:o[n])==null?void 0:s.township)!=null?r:"-",(d=(i=(a=e==null?void 0:e.ranks)==null?void 0:a[n])==null?void 0:i.county)!=null?d:"-"]})])]}function At(){return[["学校","本次县排名","上次县排名","变化","本次两率一分"],...kt().map(({current:t,previous:e})=>{const n=y(e.countyRank)-y(t.countyRank),o=n>0?`上升 ${n}`:n<0?`下降 ${Math.abs(n)}`:"持平";return[t.name||"",t.countyRank||"-",e.countyRank||"-",o,m(t.score2Rate)]})]}function ve(t,e){var o;if(!window.XLSX||typeof((o=window.XLSX.utils)==null?void 0:o.book_new)!="function")throw new Error("XLSX export unavailable");const n=window.XLSX.utils.book_new();(Array.isArray(e)?e:[]).forEach((s,r)=>{const a=Array.isArray(s==null?void 0:s.rows)?s.rows:[],i=window.XLSX.utils.aoa_to_sheet(a),d=a.reduce((u,l)=>Math.max(u,Array.isArray(l)?l.length:0),0);d>0&&(i["!cols"]=Array.from({length:d},()=>({wch:16})));const c=String((s==null?void 0:s.name)||`Sheet${r+1}`).trim()||`Sheet${r+1}`;window.XLSX.utils.book_append_sheet(n,i,c.slice(0,31))}),window.XLSX.writeFile(n,t)}function Tt(t){var r,a;const e=T(),n=String(t||"").trim();if(n==="student"){(r=window.UI)!=null&&r.toast&&window.UI.toast("学生县排名已移到“学生档案查询”的学生考试明细中，县域分析不再单独导出学生档案县排。","info");return}const o={rank:{fileName:`县域两率一分排名_${e}.xlsx`,sheets:[{name:"县域排名",rows:xt()}]},school:{fileName:`县域学校横向分析_${e}.xlsx`,sheets:vt()},teacher:{fileName:`县域教师画像_${e}.xlsx`,sheets:[{name:"教师画像",rows:Ct()}]},history:{fileName:`县域历史对比_${e}.xlsx`,sheets:[{name:"历史对比",rows:At()}]},all:{fileName:`县域分析_${e}.xlsx`,sheets:[...vt(),{name:"教师画像",rows:Ct()},{name:"历史对比",rows:At()}]}},s=o[n]||o.all;ve(s.fileName,s.sheets),(a=window.UI)!=null&&a.toast&&window.UI.toast("✅ 县域分析导出完成","success")}async function $t(){var c;const t=_(),e=k();if(!w.promptArmed||!e.length||t===w.lastSignature)return v();w.promptArmed=!1,w.lastSignature=t;const n=v();if((n==null?void 0:n.signature)===t)return M(n);const o=be(e,n),s=new Set(o),r=o.length?e.filter(u=>!s.has(u)):[],a=r.length>0,i=o;a&&((c=window.UI)!=null&&c.toast)&&window.UI.toast(`已按目标人数管理自动识别：乡镇 ${i.length} 所，县直/县域 ${r.length} 所`,"info");const d=M({includesCounty:a,explicitCountyUpload:a,townshipSchools:i,signature:t,updatedAt:new Date().toISOString()});return Se(d),E(),B(),I(),It(),d}function E(){const t=_();if(t&&t===w.lastRankSignature&&window.COUNTY_ANALYSIS_SCOPE)return window.COUNTY_ANALYSIS_SCOPE;w.lastRankSignature=t;const e=M(v()||{includesCounty:!1,townshipSchools:k()}),n=new Set(e.townshipSchools||[]),o=Object.values(window.SCHOOLS||{}),s=ot(),r={avg:0,excellent:0,pass:0};o.forEach(c=>{var l;const u=((l=c==null?void 0:c.metrics)==null?void 0:l.total)||{};r.avg=Math.max(r.avg,y(u.avg)),r.excellent=Math.max(r.excellent,y(u.excRate)),r.pass=Math.max(r.pass,y(u.passRate))}),o.forEach(c=>{var g;const u=((g=c==null?void 0:c.metrics)==null?void 0:g.total)||{},l=r.avg?y(u.avg)/r.avg*s.avg:0,f=r.excellent?y(u.excRate)/r.excellent*s.excellent:0,h=r.pass?y(u.passRate)/r.pass*s.pass:0;c.countyRatedAvg=l,c.countyRatedExc=f,c.countyRatedPass=h,c.countyScore2Rate=l+f+h,u&&(u.countyRatedAvg=l,u.countyRatedExc=f,u.countyRatedPass=h,u.countyScore2Rate=c.countyScore2Rate)}),o.slice().sort((c,u)=>y(u.countyScore2Rate)-y(c.countyScore2Rate)).forEach((c,u)=>{var l;c.countyScope=n.has(c.name)?"township":"county",c.countyRank2Rate=u+1,(l=c.metrics)!=null&&l.total&&(c.metrics.total.countyRank2Rate=u+1)}),o.filter(c=>n.has(c.name)).sort((c,u)=>y(u.score2Rate)-y(c.score2Rate)).forEach((c,u)=>{var l;c.townshipRank2Rate=u+1,(l=c.metrics)!=null&&l.total&&(c.metrics.total.townshipRank2Rate=u+1)});const a=(window.RAW_DATA||[]).filter(c=>Number.isFinite(Number(c==null?void 0:c.total))),d=x(a,c=>c.total,(c,u)=>{c.ranks||(c.ranks={}),c.ranks.total||(c.ranks.total={}),c.countyRank=u,c.countyScope=n.has(c.school)?"township":"county",c.ranks.total.county=u}).filter(c=>n.has(c.school));return x(d,c=>c.total,(c,u)=>{c.townshipRank=u,c.ranks.total||(c.ranks.total={}),c.ranks.total.township=u}),(window.SUBJECTS||[]).forEach(c=>{const u=(window.RAW_DATA||[]).filter(h=>{var g;return Number.isFinite(Number((g=h==null?void 0:h.scores)==null?void 0:g[c]))}),f=x(u,h=>{var g;return(g=h==null?void 0:h.scores)==null?void 0:g[c]},(h,g)=>{h.ranks||(h.ranks={}),h.ranks[c]||(h.ranks[c]={}),h.ranks[c].county=g}).filter(h=>n.has(h.school));x(f,h=>{var g;return(g=h==null?void 0:h.scores)==null?void 0:g[c]},(h,g)=>{h.ranks[c]||(h.ranks[c]={}),h.ranks[c].township=g})}),St(e),window.COUNTY_ANALYSIS_SCOPE=e,e}function B(){const t=v(),e=k();if(!t||!e.length)return;const n=_(),o=K(V,[]),s={examKey:T(),signature:n,includesCounty:!!t.includesCounty,at:new Date().toISOString(),schools:Object.values(window.SCHOOLS||{}).map(a=>{var i;return{name:a.name,scope:a.countyScope||"township",score2Rate:y((i=a.countyScore2Rate)!=null?i:a.score2Rate),countyRank:a.countyRank2Rate||a.rank2Rate||0,townshipRank:a.townshipRank2Rate||0}})},r=o.filter(a=>a.signature!==n&&a.examKey!==s.examKey).concat(s).slice(-12);st(V,r)}function ze(){const t=ut();return t.length?`
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
                        ${t.map(e=>{var s,r;const n=((s=e.metrics)==null?void 0:s.total)||{},o=e.countyScope!=="county";return`
                                <tr>
                                    <td>${S(e.name)}</td>
                                    <td><span class="county-scope-badge ${o?"is-township":"is-county"}">${o?"本乡镇":"县域学校"}</span></td>
                                    <td>${n.count||0}</td>
                                    <td>${m(n.avg)}</td>
                                    <td>${b(n.excRate)}</td>
                                    <td>${b(n.passRate)}</td>
                                    <td><strong>${m((r=e.countyScore2Rate)!=null?r:e.score2Rate)}</strong></td>
                                    <td>${o&&e.townshipRank2Rate||"-"}</td>
                                    <td>${e.countyRank2Rate||e.rank2Rate||"-"}</td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        `:'<div class="county-empty">暂无学校成绩数据，请先导入本次成绩。</div>'}function Ce(t){var i,d,c;const e=Array.isArray(t)?t.slice():bt();if(!e.length)return"";const n=e.slice().sort((u,l)=>(u.countyRankAvg||9999)-(l.countyRankAvg||9999))[0],o=e.slice().sort((u,l)=>(u.countyRankExc||9999)-(l.countyRankExc||9999))[0],s=e.slice().sort((u,l)=>(u.countyRankPass||9999)-(l.countyRankPass||9999))[0],r=new Set(e.map(u=>u.subject).filter(Boolean)),a=e.slice().sort((u,l)=>(u.countyRankAvg||9999)-(l.countyRankAvg||9999)).slice(0,8);return`
            <div class="county-focus-card county-teacher-focus">
                <div>
                    <span>本校教师县域画像</span>
                    <strong>${e.length} 个教师-学科样本</strong>
                    <p>县域口径会把本校任课教师与县直、乡镇所有学校同学科整体表现放在一起对标，普通教师模块仍只看乡镇口径。</p>
                </div>
                <div class="county-focus-metrics">
                    <em>覆盖学科 <b>${r.size}</b></em>
                    <em>均分最好 <b>${S((n==null?void 0:n.teacherName)||"-")} #${(i=n==null?void 0:n.countyRankAvg)!=null?i:"-"}</b></em>
                    <em>优秀率最好 <b>${S((o==null?void 0:o.teacherName)||"-")} #${(d=o==null?void 0:o.countyRankExc)!=null?d:"-"}</b></em>
                    <em>及格率最好 <b>${S((s==null?void 0:s.teacherName)||"-")} #${(c=s==null?void 0:s.countyRankPass)!=null?c:"-"}</b></em>
                </div>
            </div>
            <div class="table-wrap analysis-table-shell county-focus-table">
                <table class="analysis-generated-table county-analysis-table">
                    <thead><tr><th>教师</th><th>学科</th><th>均分</th><th>优秀率</th><th>及格率</th><th>县均排</th><th>县优排</th><th>县及格排</th></tr></thead>
                    <tbody>
                        ${a.map(u=>{var l,f,h;return`
                            <tr>
                                <td>${S(u.teacherName)}</td>
                                <td>${S(u.subject)}</td>
                                <td>${m(u.avg,1)}</td>
                                <td>${b(u.excellentRate)}</td>
                                <td>${b(u.passRate)}</td>
                                <td>${(l=u.countyRankAvg)!=null?l:"-"}</td>
                                <td>${(f=u.countyRankExc)!=null?f:"-"}</td>
                                <td>${(h=u.countyRankPass)!=null?h:"-"}</td>
                            </tr>
                        `}).join("")}
                    </tbody>
                </table>
            </div>
        `}function Ae(){const t=H(10);if(!t.length)return'<div class="county-empty">暂无任课表或教师画像数据。导入任课表后，这里会展示县域样本下的教师教学画像。</div>';const e=bt(),n=Rt().map(o=>`
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
                            ${o.rows.map(s=>{var r,a,i;return`
                                <tr class="${s.type==="teacher"?"county-teacher-own-row":""}">
                                    <td>${(r=s.rankAvg)!=null?r:"-"}</td>
                                    <td>${S(s.name||"")}</td>
                                    <td>${s.type==="teacher"?"本校教师":"学校整体"}</td>
                                    <td>${m(s.avg,1)}</td>
                                    <td>${(a=s.rankExc)!=null?a:"-"}</td>
                                    <td>${b(s.excellentRate)}</td>
                                    <td>${(i=s.rankPass)!=null?i:"-"}</td>
                                    <td>${b(s.passRate)}</td>
                                    <td>${s.studentCount||0}</td>
                                </tr>
                            `}).join("")}
                        </tbody>
                    </table>
                </div>
            </div>
        `).join("");return`
            <div class="county-portrait-grid">
                ${t.map((o,s)=>{var r,a,i;return`
                    <article class="county-portrait-card ${o.riskLevel==="risk"?"is-risk":""}">
                        <span class="county-portrait-rank">#${s+1}</span>
                        <h4>${S(o.teacherName)} / ${S(o.subject)}</h4>
                        <strong>${m(o.score,1)}</strong>
                        <p>均分 ${m(o.avg,1)} · 优秀率 ${b(o.excellentRate)} · 及格率 ${b(o.passRate)} · 样本 ${o.studentCount}</p>
                        <div class="county-portrait-rankline">
                            <span>县均排 #${(r=o.countyRankAvg)!=null?r:"-"}</span>
                            <span>优排 #${(a=o.countyRankExc)!=null?a:"-"}</span>
                            <span>及排 #${(i=o.countyRankPass)!=null?i:"-"}</span>
                        </div>
                    </article>
                `}).join("")}
            </div>
            ${Ce(e)}
            ${n?`
                <div class="analysis-table-meta">
                    <span><strong>同学科完整排名：</strong>每个学科单独成表，本校教师与其他学校同学科整体放在同一张县域榜里。</span>
                </div>
                ${n}
            `:""}
        `}function je(){const t=ft().slice(0,40);if(!t.length)return'<div class="county-empty">暂无学生成绩数据。</div>';const e=window.SUBJECTS||[];return`
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
                                ${e.map(o=>{var s,r,a,i;return`
                                    <td>${((r=(s=n==null?void 0:n.ranks)==null?void 0:s[o])==null?void 0:r.township)||"-"}</td>
                                    <td>${((i=(a=n==null?void 0:n.ranks)==null?void 0:a[o])==null?void 0:i.county)||"-"}</td>
                                `}).join("")}
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>
        `}function Fe(){const t=kt().slice(0,20);return t.length?`
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
        `:'<div class="county-empty">县域历史样本不足。后续再次导入县域成绩后，这里会自动显示县排名变化。</div>'}function Et(){const t=["county-teacher-portrait","county-school-horizontal","county-analysis"].find(e=>{var n,o;return(o=(n=document.getElementById(e))==null?void 0:n.classList)==null?void 0:o.contains("active")});return t==="county-analysis"?"county-teacher-portrait":t||"county-teacher-portrait"}function Te(t=Et()){var n;const e=document.getElementById(t)||document.getElementById("county-analysis");return((n=e==null?void 0:e.querySelector)==null?void 0:n.call(e,".county-analysis-root"))||document.getElementById("county-analysis-root")}function Nt(){const t=document.getElementById("county-analysis");!t||t.dataset.countySubmoduleHost==="1"||(t.dataset.countySubmoduleHost="1",Object.entries(et).forEach(([e,n])=>{if(document.getElementById(e))return;const o=document.createElement("div");o.id=e,o.className="section card-box analysis-workspace analysis-workspace-county",o.innerHTML=`
                <div class="module-desc-bar analysis-hero" style="border-color:#0f766e;">
                    <h3><i class="ti ti-map-2"></i> ${S(n.title)} <span class="badge" style="background:#0f766e;">${S(n.badge)}</span></h3>
                    <p>${S(n.description)}</p>
                </div>
                <div class="county-analysis-root">
                    <div class="info-bar analysis-info-band">导入县级成绩后，这里只呈现县域专用分析，不改变联考分析、教学管理和学情诊断的原有口径。</div>
                </div>
            `,t.insertAdjacentElement("afterend",o)}))}function _t(t){const e=_();if(w.subjectRowCacheSignature!==e&&(w.subjectRowCacheSignature=e,w.subjectRowCache=new Map),w.subjectRowCache.has(t))return w.subjectRowCache.get(t);const n=Object.values(window.SCHOOLS||{}).filter(r=>{var a;return(a=r==null?void 0:r.metrics)==null?void 0:a[t]}).map(r=>({school:r,metric:r.metrics[t]}));if(!n.length)return w.subjectRowCache.set(t,[]),[];const o=n.reduce((r,a)=>(r.avg=Math.max(r.avg,y(a.metric.avg)),r.excellent=Math.max(r.excellent,y(a.metric.excRate)),r.pass=Math.max(r.pass,y(a.metric.passRate)),r),{avg:0,excellent:0,pass:0}),s=n.map(r=>{const a=ht(r.metric,o);return{schoolName:r.school.name||"",count:y(r.metric.count),avg:y(r.metric.avg),excellentRate:y(r.metric.excRate),passRate:y(r.metric.passRate),ratedAvg:a.ratedAvg,ratedExc:a.ratedExc,ratedPass:a.ratedPass,score:a.ratedAvg+a.ratedExc+a.ratedPass}});return x(s,r=>r.avg,(r,a)=>{r.rankAvg=a}),x(s,r=>r.excellentRate,(r,a)=>{r.rankExcellent=a}),x(s,r=>r.passRate,(r,a)=>{r.rankPass=a}),x(s,r=>r.score,(r,a)=>{r.rank=a}),s.sort((r,a)=>(r.rank||9999)-(a.rank||9999)),w.subjectRowCache.set(t,s),s}function q(t={}){var d,c,u;const e=t.required!==!1,n=t.silent===!0,o=document.getElementById("countySchoolNameInput"),s=String((o==null?void 0:o.value)||"").trim();if(!s)return e?(!n&&((d=window.UI)!=null&&d.toast)&&window.UI.toast("请输入本校名称","warning"),!1):!0;const r=k();let a=s;if(r.length&&!r.includes(s)&&(typeof window.resolveSchoolNameFromCollection=="function"&&(a=window.resolveSchoolNameFromCollection(r,s)||s),!r.includes(a)&&typeof window.getCanonicalSchoolName=="function"&&(a=window.getCanonicalSchoolName(s,r)||a)),r.length&&!r.includes(a))return!n&&((c=window.UI)!=null&&c.toast)&&window.UI.toast("当前县级成绩中没有匹配到该学校，请核对名称","warning"),!1;window.MY_SCHOOL=a;try{localStorage.setItem("MY_SCHOOL",a)}catch(l){}typeof window.writeCurrentSchool=="function"&&window.writeCurrentSchool(a);const i=document.getElementById("mySchoolSelect");return i&&Array.from(i.options||[]).some(l=>l.value===a)&&(i.value=a),o&&(o.value=a),!n&&((u=window.UI)!=null&&u.toast)&&window.UI.toast(`已锁定本校：${a}`,"success"),!0}function Ot(){var e;q({required:!1,silent:!0})&&(w.subjectRowCache=new Map,E(),B(),I("county-school-horizontal"),(e=window.UI)!=null&&e.toast&&window.UI.toast("县域学校横向对比表已生成","success"))}function $e(t=""){const e=W();if(!e.length)return'<div class="county-empty">暂无学校成绩数据，请先导入本次县级成绩。</div>';const n=e.reduce((o,s)=>Math.max(o,y(s.avg)),0)||100;return`
            <div class="table-wrap analysis-table-shell">
                <table class="analysis-generated-table county-analysis-table">
                    <thead>
                        <tr>
                            <th>学校名称 <span class="analysis-table-tag">共识别 ${e.length} 所</span></th>
                            <th>实考人数</th>
                            <th>平均分</th>
                            <th>优秀率</th>
                            <th>及格率</th>
                            <th>平均分赋分</th>
                            <th>优秀率赋分</th>
                            <th>及格率赋分</th>
                            <th>两率一分总分</th>
                            <th>县域排名</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${e.map(o=>{const s=t&&o.schoolName===t,r=o.avg?Math.min(100,o.avg/n*100).toFixed(1):0;return`
                                <tr class="${s?"bg-highlight":""}">
                                    <td data-label="学校名称">${S(o.schoolName)}</td>
                                    <td data-label="实考人数">${o.count||0}</td>
                                    <td data-label="平均分" class="data-bar-bg" style="--percent:${r}%">${N(o.avg,o.rankAvg)}</td>
                                    <td data-label="优秀率">${N(o.excellentRate,o.rankExcellent,!0)}</td>
                                    <td data-label="及格率">${N(o.passRate,o.rankPass,!0)}</td>
                                    <td data-label="平均分赋分">${m(o.ratedAvg)}</td>
                                    <td data-label="优秀率赋分">${m(o.ratedExc)}</td>
                                    <td data-label="及格率赋分">${m(o.ratedPass)}</td>
                                    <td data-label="两率一分总分" class="text-red" style="font-size:1.1em; font-weight:800;">${m(o.score)}</td>
                                    <td data-label="县域排名" class="rank-cell">${o.rankScore||"-"}</td>
                                </tr>
                            `}).join("")}
                    </tbody>
                </table>
            </div>
        `}function Ee(){const t=W();if(!t.length)return'<div class="county-empty">暂无学校成绩数据，请先导入本次县级成绩。</div>';const e=F(window.SUBJECTS||[]),n=pt(),o=e.map(s=>{const r=_t(s);return r.length?`
                <div class="analysis-anchor-panel county-subject-detail">
                    <div class="county-section-head">
                        <div class="sub-header analysis-section-head">${S(s)} 学科明细</div>
                    </div>
                    <div class="table-wrap analysis-table-shell">
                        <table class="analysis-generated-table county-analysis-table">
                            <thead><tr><th>学校名称</th><th>实考人数</th><th>平均分</th><th>优秀率</th><th>及格率</th><th>平均分赋分</th><th>优秀率赋分</th><th>及格率赋分</th><th>两率一分</th><th>县域排名</th></tr></thead>
                            <tbody>
                                ${r.map(a=>`
                                    <tr class="${n&&a.schoolName===n?"bg-highlight":""}">
                                        <td data-label="学校名称">${S(a.schoolName)}</td>
                                        <td data-label="实考人数">${a.count||0}</td>
                                        <td data-label="平均分">${N(a.avg,a.rankAvg)}</td>
                                        <td data-label="优秀率">${N(a.excellentRate,a.rankExcellent,!0)}</td>
                                        <td data-label="及格率">${N(a.passRate,a.rankPass,!0)}</td>
                                        <td data-label="平均分赋分">${m(a.ratedAvg)}</td>
                                        <td data-label="优秀率赋分">${m(a.ratedExc)}</td>
                                        <td data-label="及格率赋分">${m(a.ratedPass)}</td>
                                        <td data-label="两率一分"><strong>${m(a.score)}</strong></td>
                                        <td data-label="县域排名" class="rank-cell">${a.rank||"-"}</td>
                                    </tr>
                                `).join("")}
                            </tbody>
                        </table>
                    </div>
                </div>
            `:""}).filter(Boolean).join("");return`
            <div class="county-control-panel">
                <label class="county-control-field">
                    <span>本校名称</span>
                    <input id="countySchoolNameInput" type="text" value="${S(n)}" placeholder="输入本校名称，用于高亮和横向对比">
                </label>
                <div class="county-control-actions">
                    <button class="btn btn-sm btn-green" type="button" onclick="generateCountySchoolHorizontalTable()">生成横向对比表</button>
                    <button class="btn btn-sm btn-blue" type="button" onclick="exportCountyAnalysisSection('school')">下载横向对比表</button>
                    <button class="btn btn-sm btn-secondary" type="button" onclick="setCountyAnalysisSchoolNameFromInput()">锁定本校</button>
                </div>
            </div>
            <div class="county-kpi-grid">
                <div><span>学校样本</span><strong>${t.length}</strong><em>县域所有学校</em></div>
                <div><span>学科明细</span><strong>${e.length}</strong><em>按两率一分统一折算</em></div>
                <div><span>学生样本</span><strong>${(window.RAW_DATA||[]).length}</strong><em>${S(T())}</em></div>
                <div><span>输出</span><strong>横向表</strong><em>五科总 + 单科明细</em></div>
            </div>
            <div class="analysis-anchor-panel">
                <div class="county-section-head">
                    <div class="sub-header analysis-section-head">五科总 - 综合分析表</div>
                    <div class="county-section-actions">
                        <button class="btn btn-sm btn-green" type="button" onclick="exportCountyAnalysisSection('school')">下载Excel</button>
                    </div>
                </div>
                <div class="analysis-table-meta">
                    <span><strong>口径：</strong>参考乡镇“两率一分(横向)”表，按当前导入的全部县级学校统一折算、统一排名。</span>
                </div>
                ${$e(n)}
            </div>
            ${o||'<div class="county-empty">暂无学科明细数据。</div>'}
        `}function Ne(){return`
            <div class="county-kpi-grid">
                <div><span>教师样本</span><strong>${H(Number.POSITIVE_INFINITY).length}</strong><em>本校教师-学科</em></div>
                <div><span>对标范围</span><strong>${k().length}</strong><em>县域所有学校</em></div>
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
                ${Ae()}
            </div>
        `}function I(t=Et()){var e,n,o;if(!w.isRendering){w.isRendering=!0;try{Nt();const s=t==="county-analysis"?"county-teacher-portrait":t,r=Te(s);if(!r)return;const a=E();s==="county-teacher-portrait"&&window.setTimeout(()=>{wt().then(f=>{const h=["county-teacher-portrait","county-analysis"].some(g=>{var $,C;return(C=($=document.getElementById(g))==null?void 0:$.classList)==null?void 0:C.contains("active")});f!=null&&f.changed&&h&&!w.isRendering&&I(s)})},0);const i=k(),d=((e=a.countySchools)==null?void 0:e.length)||0,c=((n=a.townshipSchools)==null?void 0:n.length)||0,u=(window.RAW_DATA||[]).length,l=`
            <div class="county-kpi-grid">
                <div><span>本次范围</span><strong>${a.includesCounty?"县域 + 乡镇":"乡镇"}</strong><em>${S(T())}</em></div>
                <div><span>学校数</span><strong>${i.length}</strong><em>乡镇 ${c} · 县域 ${d}</em></div>
                <div><span>学生样本</span><strong>${u}</strong><em>已补充 countyRank / townshipRank</em></div>
                <div><span>当前子模块</span><strong>${S(((o=et[s])==null?void 0:o.title)||"县域教师画像")}</strong><em>不影响其他母模块</em></div>
            </div>
            ${s==="county-school-horizontal"?Ee():Ne()}
        `;r.innerHTML=l}finally{w.isRendering=!1}}}function _e(){}function Oe(){}function Q(t,e){var n;return t!=null&&t.ranks?e==="total"?t.countyRank||"-":((n=t.ranks[e])==null?void 0:n.county)||"-":"-"}function De(){var L,z,j,Ht;if(!(window.RAW_DATA||[]).length){alert("请先上传数据");return}E();const t=typeof window.getCurrentUser=="function"?window.getCurrentUser():null,e=(t==null?void 0:t.role)||"guest",n=e==="teacher",o=e==="class_teacher",s=o&&typeof window.getClassTeacherStudentViewMode=="function"?window.getClassTeacherStudentViewMode():"teaching",a=(n||o&&s==="teaching")&&typeof window.getTeacherScopeForUser=="function"?window.getTeacherScopeForUser(t):null,i=n||o&&s==="teaching"?(window.SUBJECTS||[]).filter(p=>{var R;return(R=a==null?void 0:a.subjects)==null?void 0:R.has(window.normalizeSubject?window.normalizeSubject(p):p)}):window.SUBJECTS||[],d=((L=document.getElementById("studentSchoolSelect"))==null?void 0:L.value)||"",c=((z=document.getElementById("studentClassSelect"))==null?void 0:z.value)||"",u=typeof window.isSingleSchoolMode=="function"?window.isSingleSchoolMode():Object.keys(window.SCHOOLS||{}).length<=1;let l=[...window.RAW_DATA||[]];if((n||o&&s==="teaching")&&((j=a==null?void 0:a.classes)==null?void 0:j.size)>0)l=l.filter(p=>{const R=String(p.class||"").trim(),Y=typeof window.normalizeClass=="function"?window.normalizeClass(p.class):R;return a.classes.has(Y)||a.classes.has(R)?!0:Array.from(a.classes).some(X=>String(X).replace(/[\s\.]/g,"")===R.replace(/[\s\.]/g,""))});else if(o&&(t!=null&&t.class)&&typeof window.normalizeClass=="function"){const p=window.normalizeClass(t.class);l=l.filter(R=>window.normalizeClass(R.class)===p)}d&&!d.includes("请选择")&&(l=l.filter(p=>p.school===d)),c&&c!=="全部"&&(l=l.filter(p=>p.class===c)),typeof window.getComparisonStudentList=="function"&&(l=window.getComparisonStudentList(l,window.RAW_DATA||[])),l.sort((p,R)=>(Number(R.total)||0)-(Number(p.total)||0));const f=typeof window.hasStudentCountyRankData=="function"?window.hasStudentCountyRankData(l,i):l.some(p=>Q(p,"total")!=="-"),h=n||o?["学校","班级","姓名"]:["学校","班级","姓名","考号","考场","相对总分"];i.forEach(p=>{n||o?h.push(`${p} 分数`,`${p} 班排`,`${p} 级排`):h.push(`${p} 分数`,`${p} 相对分`,`${p} 校排`,`${p} 班排`),u||h.push(`${p} 镇排`),f&&h.push(`${p} 县排`)});const g=String(((Ht=window.CONFIG)==null?void 0:Ht.name)||"").includes("9")?"五科总分":"总分";n||o?h.push(g,"总分班排","总分级排"):h.push(g,`${g}校排`,`${g}班排`),u||h.push(`${g}镇排`),f&&h.push(`${g}县排`);const $=[h];l.forEach(p=>{var Y,X,Ut,Lt,zt,jt,Ft,Dt,Bt,Yt,Xt,Vt,Jt,Kt,Wt;const R=n||o?[p.school,p.class,p.name]:[p.school,p.class,p.name,p.id,p.examRoom,p.totalTScore||0];i.forEach(A=>{var Gt,qt,Qt,Zt,te,ee,ne,ae,oe,re,se,ie,ce,le,de,ue,pe,he,ye,fe,ge;n||o?R.push((qt=(Gt=p.scores)==null?void 0:Gt[A])!=null?qt:"-",(te=(Zt=(Qt=p==null?void 0:p.ranks)==null?void 0:Qt[A])==null?void 0:Zt.class)!=null?te:"-",(ae=(ne=(ee=p==null?void 0:p.ranks)==null?void 0:ee[A])==null?void 0:ne.school)!=null?ae:"-"):R.push((re=(oe=p.scores)==null?void 0:oe[A])!=null?re:"-",(ie=(se=p==null?void 0:p.tScores)==null?void 0:se[A])!=null?ie:"-",(de=(le=(ce=p==null?void 0:p.ranks)==null?void 0:ce[A])==null?void 0:le.school)!=null?de:"-",(he=(pe=(ue=p==null?void 0:p.ranks)==null?void 0:ue[A])==null?void 0:pe.class)!=null?he:"-"),u||R.push((ge=(fe=(ye=p==null?void 0:p.ranks)==null?void 0:ye[A])==null?void 0:fe.township)!=null?ge:"-"),f&&R.push(Q(p,A))}),n||o?R.push(p.total,(Ut=(X=(Y=p==null?void 0:p.ranks)==null?void 0:Y.total)==null?void 0:X.class)!=null?Ut:"-",(jt=(zt=(Lt=p==null?void 0:p.ranks)==null?void 0:Lt.total)==null?void 0:zt.school)!=null?jt:"-"):R.push(p.total,(Bt=(Dt=(Ft=p==null?void 0:p.ranks)==null?void 0:Ft.total)==null?void 0:Dt.school)!=null?Bt:"-",(Vt=(Xt=(Yt=p==null?void 0:p.ranks)==null?void 0:Yt.total)==null?void 0:Xt.class)!=null?Vt:"-"),u||R.push((Wt=(Kt=(Jt=p==null?void 0:p.ranks)==null?void 0:Jt.total)==null?void 0:Kt.township)!=null?Wt:"-"),f&&R.push(Q(p,"total")),$.push(R)});const C=window.XLSX.utils.book_new(),U=window.XLSX.utils.aoa_to_sheet($);if(typeof window.decorateExcelSheet=="function"&&window.decorateExcelSheet(U,h),window.XLSX.utils.book_append_sheet(C,U,"学生考试明细"),n||o){const p=typeof window.buildTeacherExportTag=="function"?window.buildTeacherExportTag(t,new Set(i||[])):"teacher";window.XLSX.writeFile(C,`学生考试明细_${p}.xlsx`)}else window.XLSX.writeFile(C,"学生考试明细.xlsx")}function It(){const t=document.getElementById("upload-feedback-board");if(!t)return;let e=document.getElementById("upload-county-scope-card");e||(e=document.createElement("div"),e.id="upload-county-scope-card",e.className="upload-feedback-card",t.appendChild(e));const n=v();e.innerHTML=`
            <h4><i class="ti ti-map-2"></i> 县域对比口径</h4>
            <p>${n!=null&&n.includesCounty?`已启用县域排名：乡镇 ${n.townshipSchools.length} 所，县域学校 ${n.countySchools.length} 所。`:"本次暂按乡镇成绩处理。导入新成绩时会询问是否包含县里学校。"}</p>
        `}function Z(t,e){const n=window[t];if(typeof n!="function"||n[`__countyPatched_${t}`])return!1;const o=function(...r){const a=n.apply(this,r),i=d=>(e(...r),d);return a&&typeof a.then=="function"?a.then(i):(i(a),a)};return o[`__countyPatched_${t}`]=!0,window[t]=o,!0}function Mt(){Z("processData",()=>{E(),B(),$t()}),Z("renderTables",()=>{E()}),Z("switchTab",t=>{(t==="county-analysis"||t==="county-teacher-portrait"||t==="county-school-horizontal")&&setTimeout(()=>I(t),0)})}function Ie(){document.addEventListener("change",t=>{const e=t.target;!e||e.id!=="fileInput"||e.files&&e.files.length&&(w.preUploadTownshipSchools=k().filter(n=>!it(n)),w.promptArmed=!0)},!0)}function Me(){if(document.getElementById("county-analysis-runtime-style"))return;const t=document.createElement("style");t.id="county-analysis-runtime-style",t.textContent=`
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
        `,document.head.appendChild(t)}function Pt(){Me(),Nt(),Ie(),Mt(),It();let t=0;const e=setInterval(()=>{t+=1,Mt(),t>40&&clearInterval(e)},300)}window.CountyAnalysisRuntime={applyCountyRanks:E,renderCountyAnalysis:I,ensureTeacherContextForCountyAnalysis:wt,promptCountyScopeIfNeeded:$t,decorateAnalysisTable:_e,decorateStudentDetails:Oe,saveCountySnapshot:B,getCurrentScope:v,exportCountyAnalysisSection:Tt,setCountyAnalysisSchoolNameFromInput:q,generateCountySchoolHorizontalTable:Ot},window.renderCountyAnalysis=I,window.exportCountyAnalysisSection=Tt,window.setCountyAnalysisSchoolNameFromInput=q,window.generateCountySchoolHorizontalTable=Ot,window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__=!0,document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Pt,{once:!0}):Pt()})();
