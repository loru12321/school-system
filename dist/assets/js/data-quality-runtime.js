((C,i)=>{const A=i(C||{});C&&!C.DataQualityRuntime&&(C.DataQualityRuntime=A),typeof module!="undefined"&&module.exports&&(module.exports=i)})(typeof globalThis!="undefined"?globalThis:this,function(i){function u(t){return String(t==null?"":t).trim()}function o(t){return u(t).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function d(t){return Array.isArray(t)?t:[]}function T(){const t=d(i.SUBJECTS).map(u).filter(Boolean);if(t.length)return t;const n=d(i.RAW_DATA).length?d(i.RAW_DATA):N(),a=new Set;return n.forEach(e=>{Object.keys(e&&e.scores||{}).forEach(l=>{const c=u(l);c&&a.add(c)})}),Array.from(a)}function N(){const t=i.COHORT_DB||(i.CohortDB&&typeof i.CohortDB.ensure=="function"?i.CohortDB.ensure():null),n=t&&t.exams&&typeof t.exams=="object"?t.exams:{},a=u(i.CURRENT_EXAM_ID||i.currentExamId),e=a&&n[a]&&d(n[a].data);if(e&&e.length)return e;const l=Object.values(n).filter(Boolean).sort((c,y)=>Number(y.createdAt||0)-Number(c.createdAt||0)).find(c=>d(c&&c.data).length);return l?d(l.data):[]}function j(t){const n=i.CONFIG||{},a=n.fullScore||n.fullScores||i.FULL_SCORE||{},e=Number(a&&a[t]);return Number.isFinite(e)&&e>0?e:150}function k(){const t=d(i.RAW_DATA);if(t.length)return t;const n=N();if(n.length)return n;const a=i.SCHOOLS&&typeof i.SCHOOLS=="object"?i.SCHOOLS:{};return Object.keys(a).flatMap(e=>{const l=a[e]||{};return d(l.students).map(c=>({school:e,...c}))})}function f(t,n,a,e,l,c=""){t.push({type:n,severity:a,message:l,detail:c,school:u(e&&e.school),className:u(e&&e.class),name:u(e&&e.name),examNo:u(e&&(e.examNo||e.exam_no||e.id||e.uuid))})}function _(t={}){const n=k(),a=T(),e=[],l=new Map,c=new Set,y=new Set,p=new Map;n.forEach((s,r)=>{const h=u(s&&s.school),m=u(s&&s.class),M=u(s&&s.name),F=u(s&&(s.examNo||s.exam_no||s.id||s.uuid));h&&c.add(h),m&&y.add(`${h||"unknown"}::${m}`),h||f(e,"missing-school","high",s,"缺少学校"),m||f(e,"missing-class","medium",s,"缺少班级"),M||f(e,"missing-name","high",s,"缺少姓名");const x=[h,m,M,F||`row-${r}`].join("::");l.has(x)?f(e,"duplicate-identity","high",s,"疑似重复学生记录",`与第 ${l.get(x)+1} 行身份一致`):l.set(x,r);const H=s&&s.scores&&typeof s.scores=="object"?s.scores:{};a.forEach(b=>{const E=H[b],R=Number(E);if(E==null||E===""){p.set(b,(p.get(b)||0)+1);return}if(!Number.isFinite(R)){f(e,"invalid-score","high",s,"分数不是有效数字",b);return}const O=j(b);(R<0||R>O)&&f(e,"score-out-of-range","high",s,"分数超出合理范围",`${b}: ${R}/${O}`)})}),p.forEach((s,r)=>{s>0&&n.length>0&&s/n.length>=.2&&e.push({type:"subject-missing-high",severity:"medium",message:"科目缺失比例偏高",detail:`${r}: ${s}/${n.length}`,school:"",className:"",name:"",examNo:""})});const g={high:0,medium:1,low:2};return e.sort((s,r)=>{var h,m;return((h=g[s.severity])!=null?h:9)-((m=g[r.severity])!=null?m:9)}),{rowCount:n.length,schoolCount:c.size,classCount:y.size,subjectCount:a.length,issueCount:e.length,highCount:e.filter(s=>s.severity==="high").length,mediumCount:e.filter(s=>s.severity==="medium").length,lowCount:e.filter(s=>s.severity==="low").length,issues:e.slice(0,Number(t.limit||300))}}function v(){let t=i.document&&i.document.getElementById("data-quality");if(t)return t;const n=i.document&&i.document.getElementById("upload");return!(n&&n.parentNode)||!i.document?null:(t=i.document.createElement("div"),t.id="data-quality",t.className="section card-box analysis-workspace analysis-workspace-upload",t.innerHTML=`
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
            <div class="analysis-status-text" data-data-quality-status></div>
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
        `,n.insertAdjacentElement("afterend",t),t)}function q(t,n,a=""){if(!t)return;const e=t.querySelector("[data-data-quality-status]");e&&(e.textContent=n||"",e.className=`analysis-status-text ${a}`.trim())}function I(t,n){const a=t&&t.querySelector("[data-data-quality-kpis]");if(!a)return;const e=[["学生记录",n.rowCount],["学校",n.schoolCount],["班级",n.classCount],["科目",n.subjectCount],["高风险",n.highCount],["待处理",n.issueCount]];a.innerHTML=e.map(([l,c])=>`
            <div class="data-quality-kpi">
                <span>${o(l)}</span>
                <strong>${o(c)}</strong>
            </div>
        `).join("")}function B(t,n){const a=t&&t.querySelector("[data-data-quality-tbody]");if(a){if(!n.issues.length){a.innerHTML='<tr><td colspan="6" class="analysis-empty-cell">未发现明显数据问题，可以继续进入分析模块。</td></tr>';return}a.innerHTML=n.issues.map(e=>`
            <tr>
                <td><span class="data-quality-severity is-${o(e.severity)}">${o(e.severity)}</span></td>
                <td>${o(e.message)}</td>
                <td>${o(e.school||"-")}</td>
                <td>${o(e.className||"-")}</td>
                <td>${o(e.name||"-")}</td>
                <td>${o(e.detail||e.examNo||"-")}</td>
            </tr>
        `).join("")}}function S(){const t=v();if(!t)return null;const n=_();return t.__dataQualityLastResult=n,I(t,n),B(t,n),q(t,n.issueCount?`发现 ${n.issueCount} 个问题，建议导出后修正源数据。`:"未发现明显数据问题。",n.issueCount?"is-error":"is-success"),typeof i.refreshResponsiveMobileTables=="function"&&i.refreshResponsiveMobileTables(t),n}function $(){const t=v(),n=t&&t.__dataQualityLastResult||S(),a=n&&n.issues||[];if(!a.length)return q(t,"当前没有可导出的问题清单。","is-success"),!1;const e=["级别","问题","学校","班级","姓名","详情"],l=a.map(s=>[s.severity,s.message,s.school,s.className,s.name,s.detail||s.examNo||""]),c=[e,...l].map(s=>s.map(r=>`"${u(r).replace(/"/g,'""')}"`).join(",")).join(`
`),y=new Blob([`\uFEFF${c}`],{type:"text/csv;charset=utf-8"}),p=URL.createObjectURL(y),g=i.document.createElement("a");return g.href=p,g.download="data-quality-issues.csv",g.click(),URL.revokeObjectURL(p),q(t,`已导出 ${a.length} 条问题。`,"is-success"),!0}function L(){var n,a;const t=v();return!t||t.__dataQualityBound||(t.__dataQualityBound=!0,(n=t.querySelector("[data-data-quality-run]"))==null||n.addEventListener("click",S),(a=t.querySelector("[data-data-quality-export]"))==null||a.addEventListener("click",$)),t}function D(){return L(),S()}return i.document&&(i.document.readyState==="loading"?i.document.addEventListener("DOMContentLoaded",L,{once:!0}):L()),{analyze:_,render:S,init:D,bind:L,ensureSection:v,exportIssues:$}});
