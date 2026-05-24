((C,a)=>{const L=a(C||{});C&&!C.DataQualityRuntime&&(C.DataQualityRuntime=L),typeof module!="undefined"&&module.exports&&(module.exports=a)})(typeof globalThis!="undefined"?globalThis:this,function(a){function o(t){return String(t==null?"":t).trim()}function u(t){return o(t).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function d(t){return Array.isArray(t)?t:[]}function M(){const t=d(a.SUBJECTS).map(o).filter(Boolean);if(t.length)return t;const n=d(a.RAW_DATA).length?d(a.RAW_DATA):_(),i=new Set;return n.forEach(e=>{Object.keys(e&&e.scores||{}).forEach(l=>{const c=o(l);c&&i.add(c)})}),Array.from(i)}function _(){const t=a.COHORT_DB||(a.CohortDB&&typeof a.CohortDB.ensure=="function"?a.CohortDB.ensure():null),n=t&&t.exams&&typeof t.exams=="object"?t.exams:{},i=o(a.CURRENT_EXAM_ID||a.currentExamId),e=i&&n[i]&&d(n[i].data);if(e&&e.length)return e;const l=Object.values(n).filter(Boolean).sort((c,y)=>Number(y.createdAt||0)-Number(c.createdAt||0)).find(c=>d(c&&c.data).length);return l?d(l.data):[]}function j(t){const n=a.CONFIG||{},i=n.fullScore||n.fullScores||a.FULL_SCORE||{},e=Number(i&&i[t]);return Number.isFinite(e)&&e>0?e:150}function k(){const t=d(a.RAW_DATA);if(t.length)return t;const n=_();if(n.length)return n;const i=a.SCHOOLS&&typeof a.SCHOOLS=="object"?a.SCHOOLS:{};return Object.keys(i).flatMap(e=>{const l=i[e]||{};return d(l.students).map(c=>({school:e,...c}))})}function f(t,n,i,e,l,c=""){t.push({type:n,severity:i,message:l,detail:c,school:o(e&&e.school),className:o(e&&e.class),name:o(e&&e.name),examNo:o(e&&(e.examNo||e.exam_no||e.id||e.uuid))})}function q(t={}){const n=k(),i=M(),e=[],l=new Map,c=new Set,y=new Set,p=new Map;n.forEach((s,r)=>{const h=o(s&&s.school),m=o(s&&s.class),$=o(s&&s.name),I=o(s&&(s.examNo||s.exam_no||s.id||s.uuid));h&&c.add(h),m&&y.add(`${h||"unknown"}::${m}`),h||f(e,"missing-school","high",s,"缺少学校"),m||f(e,"missing-class","medium",s,"缺少班级"),$||f(e,"missing-name","high",s,"缺少姓名");const E=[h,m,$,I||`row-${r}`].join("::");l.has(E)?f(e,"duplicate-identity","high",s,"疑似重复学生记录",`与第 ${l.get(E)+1} 行身份一致`):l.set(E,r);const H=s&&s.scores&&typeof s.scores=="object"?s.scores:{};i.forEach(b=>{const N=H[b],A=Number(N);if(N==null||N===""){p.set(b,(p.get(b)||0)+1);return}if(!Number.isFinite(A)){f(e,"invalid-score","high",s,"分数不是有效数字",b);return}const O=j(b);(A<0||A>O)&&f(e,"score-out-of-range","high",s,"分数超出合理范围",`${b}: ${A}/${O}`)})}),p.forEach((s,r)=>{s>0&&n.length>0&&s/n.length>=.2&&e.push({type:"subject-missing-high",severity:"medium",message:"科目缺失比例偏高",detail:`${r}: ${s}/${n.length}`,school:"",className:"",name:"",examNo:""})});const g={high:0,medium:1,low:2};return e.sort((s,r)=>{var h,m;return((h=g[s.severity])!=null?h:9)-((m=g[r.severity])!=null?m:9)}),{rowCount:n.length,schoolCount:c.size,classCount:y.size,subjectCount:i.length,issueCount:e.length,highCount:e.filter(s=>s.severity==="high").length,mediumCount:e.filter(s=>s.severity==="medium").length,lowCount:e.filter(s=>s.severity==="low").length,issues:e.slice(0,Number(t.limit||200))}}function v(){let t=a.document&&a.document.getElementById("data-quality");if(t)return t;const n=a.document&&a.document.getElementById("upload");return!(n&&n.parentNode)||!a.document?null:(t=a.document.createElement("div"),t.id="data-quality",t.className="section card-box analysis-workspace analysis-workspace-upload",t.innerHTML=`
            <div class="analysis-shell-head data-quality-head">
                <div>
                    <h2>数据质量体检</h2>
                    <p>上传后先检查缺字段、重复身份、异常分数和科目缺失，再进入分析模块。</p>
                </div>
                <div class="analysis-actions">
                    <button type="button" class="btn btn-blue" data-data-quality-run><i class="ti ti-stethoscope"></i> 开始体检</button>
                    <button type="button" class="btn btn-green" data-data-quality-export><i class="ti ti-download"></i> 导出问题</button>
                </div>
            </div>
            <div class="data-quality-kpis" data-data-quality-kpis></div>
            <div class="table-wrap analysis-table-shell data-quality-table-wrap">
                <table class="analysis-table-dense data-quality-table">
                    <thead>
                        <tr>
                            <th>级别</th>
                            <th>问题</th>
                            <th>学校</th>
                            <th>班级</th>
                            <th>姓名</th>
                            <th>详情</th>
                        </tr>
                    </thead>
                    <tbody data-data-quality-tbody>
                        <tr><td colspan="6" class="analysis-empty-cell">点击“开始体检”后生成数据问题清单。</td></tr>
                    </tbody>
                </table>
            </div>
        `,n.insertAdjacentElement("afterend",t),t)}function T(t,n){const i=t&&t.querySelector("[data-data-quality-kpis]");if(!i)return;const e=[["学生记录",n.rowCount],["学校",n.schoolCount],["班级",n.classCount],["科目",n.subjectCount],["高风险",n.highCount],["待处理",n.issueCount]];i.innerHTML=e.map(([l,c])=>`
            <div class="data-quality-kpi">
                <span>${u(l)}</span>
                <strong>${u(c)}</strong>
            </div>
        `).join("")}function B(t,n){const i=t&&t.querySelector("[data-data-quality-tbody]");if(i){if(!n.issues.length){i.innerHTML='<tr><td colspan="6" class="analysis-empty-cell">未发现明显数据问题，可以继续进入分析模块。</td></tr>';return}i.innerHTML=n.issues.map(e=>`
            <tr>
                <td><span class="data-quality-severity is-${u(e.severity)}">${u(e.severity)}</span></td>
                <td>${u(e.message)}</td>
                <td>${u(e.school||"-")}</td>
                <td>${u(e.className||"-")}</td>
                <td>${u(e.name||"-")}</td>
                <td>${u(e.detail||e.examNo||"-")}</td>
            </tr>
        `).join("")}}function S(){const t=v();if(!t)return null;const n=q();return t.__dataQualityLastResult=n,T(t,n),B(t,n),typeof a.refreshResponsiveMobileTables=="function"&&a.refreshResponsiveMobileTables(t),n}function x(){const t=v(),n=t&&t.__dataQualityLastResult||S(),i=n&&n.issues||[];if(!i.length)return typeof a.alert=="function"&&a.alert("当前没有可导出的问题清单"),!1;const e=["级别","问题","学校","班级","姓名","详情"],l=i.map(s=>[s.severity,s.message,s.school,s.className,s.name,s.detail||s.examNo||""]),c=[e,...l].map(s=>s.map(r=>`"${o(r).replace(/"/g,'""')}"`).join(",")).join(`
`),y=new Blob([`\uFEFF${c}`],{type:"text/csv;charset=utf-8"}),p=URL.createObjectURL(y),g=a.document.createElement("a");return g.href=p,g.download="data-quality-issues.csv",g.click(),URL.revokeObjectURL(p),!0}function R(){var n,i;const t=v();return!t||t.__dataQualityBound||(t.__dataQualityBound=!0,(n=t.querySelector("[data-data-quality-run]"))==null||n.addEventListener("click",S),(i=t.querySelector("[data-data-quality-export]"))==null||i.addEventListener("click",x)),t}function D(){return R(),S()}return a.document&&(a.document.readyState==="loading"?a.document.addEventListener("DOMContentLoaded",R,{once:!0}):R()),{analyze:q,render:S,init:D,bind:R,ensureSection:v,exportIssues:x}});
