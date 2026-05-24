((v,i)=>{const _=i(v||{});v&&!v.DataQualityRuntime&&(v.DataQualityRuntime=_),typeof module!="undefined"&&module.exports&&(module.exports=i)})(typeof globalThis!="undefined"?globalThis:this,function(i){function u(t){return String(t==null?"":t).trim()}function d(t){return u(t).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[s])}function r(t){return Array.isArray(t)?t:[]}function j(){const t=r(i.SUBJECTS).map(u).filter(Boolean);if(t.length)return t;const s=r(i.RAW_DATA).length?r(i.RAW_DATA):I(),n=new Set;return s.forEach(e=>{Object.keys(e&&e.scores||{}).forEach(l=>{const c=u(l);c&&n.add(c)})}),Array.from(n)}function I(){const t=i.COHORT_DB||(i.CohortDB&&typeof i.CohortDB.ensure=="function"?i.CohortDB.ensure():null),s=t&&t.exams&&typeof t.exams=="object"?t.exams:{},n=u(i.CURRENT_EXAM_ID||i.currentExamId),e=n&&s[n]&&r(s[n].data);if(e&&e.length)return e;const l=Object.values(s).filter(Boolean).sort((c,y)=>Number(y.createdAt||0)-Number(c.createdAt||0)).find(c=>r(c&&c.data).length);return l?r(l.data):[]}function k(t){const s=i.CONFIG||{},n=s.fullScore||s.fullScores||i.FULL_SCORE||{},e=Number(n&&n[t]);return Number.isFinite(e)&&e>0?e:150}function B(){const t=r(i.RAW_DATA);if(t.length)return t;const s=I();if(s.length)return s;const n=i.SCHOOLS&&typeof i.SCHOOLS=="object"?i.SCHOOLS:{};return Object.keys(n).flatMap(e=>{const l=n[e]||{};return r(l.students).map(c=>({school:e,...c}))})}function f(t,s,n,e,l,c=""){t.push({type:s,severity:n,message:l,detail:c,school:u(e&&e.school),className:u(e&&e.class),name:u(e&&e.name),examNo:u(e&&(e.examNo||e.exam_no||e.id||e.uuid))})}function q(t={}){const s=B(),n=j(),e=[],l=new Map,c=new Set,y=new Set,p=new Map;s.forEach((a,g)=>{const m=u(a&&a.school),h=u(a&&a.class),O=u(a&&a.name),U=u(a&&(a.examNo||a.exam_no||a.id||a.uuid));m&&c.add(m),h&&y.add(`${m||"unknown"}::${h}`),m||f(e,"missing-school","high",a,"缺少学校"),h||f(e,"missing-class","medium",a,"缺少班级"),O||f(e,"missing-name","high",a,"缺少姓名");const R=[m,h,O,U||`row-${g}`].join("::");l.has(R)?f(e,"duplicate-identity","high",a,"疑似重复学生记录",`与第 ${l.get(R)+1} 行身份一致`):l.set(R,g);const Q=a&&a.scores&&typeof a.scores=="object"?a.scores:{};n.forEach(C=>{const N=Q[C],$=Number(N);if(N==null||N===""){p.set(C,(p.get(C)||0)+1);return}if(!Number.isFinite($)){f(e,"invalid-score","high",a,"分数不是有效数字",C);return}const T=k(C);($<0||$>T)&&f(e,"score-out-of-range","high",a,"分数超出合理范围",`${C}: ${$}/${T}`)})}),p.forEach((a,g)=>{a>0&&s.length>0&&a/s.length>=.2&&e.push({type:"subject-missing-high",severity:"medium",message:"科目缺失比例偏高",detail:`${g}: ${a}/${s.length}`,school:"",className:"",name:"",examNo:""})});const b={high:0,medium:1,low:2};e.sort((a,g)=>{var m,h;return((m=b[a.severity])!=null?m:9)-((h=b[g.severity])!=null?h:9)});const o=Number(t.limit||300),L=Number.isFinite(o)?e.slice(0,o):e;return{rowCount:s.length,schoolCount:c.size,classCount:y.size,subjectCount:n.length,issueCount:e.length,highCount:e.filter(a=>a.severity==="high").length,mediumCount:e.filter(a=>a.severity==="medium").length,lowCount:e.filter(a=>a.severity==="low").length,visibleIssueCount:L.length,issues:L}}function S(){let t=i.document&&i.document.getElementById("data-quality");if(t)return t;const s=i.document&&i.document.getElementById("upload");return!(s&&s.parentNode)||!i.document?null:(t=i.document.createElement("div"),t.id="data-quality",t.className="section card-box analysis-workspace analysis-workspace-upload",t.innerHTML=`
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
        `,s.insertAdjacentElement("afterend",t),t)}function x(t,s,n=""){if(!t)return;const e=t.querySelector("[data-data-quality-status]");e&&(e.textContent=s||"",e.className=`analysis-status-text ${n}`.trim())}function D(t,s){const n=t&&t.querySelector("[data-data-quality-kpis]");if(!n)return;const e=[["学生记录",s.rowCount],["学校",s.schoolCount],["班级",s.classCount],["科目",s.subjectCount],["高风险",s.highCount],["待处理",s.issueCount]];n.innerHTML=e.map(([l,c])=>`
            <div class="data-quality-kpi">
                <span>${d(l)}</span>
                <strong>${d(c)}</strong>
            </div>
        `).join("")}function F(t,s){const n=t&&t.querySelector("[data-data-quality-tbody]");if(n){if(!s.issues.length){n.innerHTML='<tr><td colspan="6" class="analysis-empty-cell">未发现明显数据问题，可以继续进入分析模块。</td></tr>';return}n.innerHTML=s.issues.map(e=>`
            <tr>
                <td><span class="data-quality-severity is-${d(e.severity)}">${d(e.severity)}</span></td>
                <td>${d(e.message)}</td>
                <td>${d(e.school||"-")}</td>
                <td>${d(e.className||"-")}</td>
                <td>${d(e.name||"-")}</td>
                <td>${d(e.detail||e.examNo||"-")}</td>
            </tr>
        `).join("")}}function A(){const t=S();if(!t)return null;const s=q();t.__dataQualityLastResult=s,D(t,s),F(t,s);const n=s.issueCount>s.visibleIssueCount?`，表格先展示 ${s.visibleIssueCount} 条`:"";return x(t,s.issueCount?`发现 ${s.issueCount} 个问题${n}，导出会包含全部问题。`:"未发现明显数据问题。",s.issueCount?"is-error":"is-success"),typeof i.refreshResponsiveMobileTables=="function"&&i.refreshResponsiveMobileTables(t),s}function M(){const t=S(),s=q({limit:1/0}),n=s&&s.issues||[];if(!n.length)return x(t,"当前没有可导出的问题清单。","is-success"),!1;const e=["级别","问题","学校","班级","姓名","详情"],l=n.map(o=>[o.severity,o.message,o.school,o.className,o.name,o.detail||o.examNo||""]),c=[e,...l].map(o=>o.map(L=>`"${u(L).replace(/"/g,'""')}"`).join(",")).join(`
`),y=new Blob([`\uFEFF${c}`],{type:"text/csv;charset=utf-8"}),p=URL.createObjectURL(y),b=i.document.createElement("a");return b.href=p,b.download="data-quality-issues.csv",b.click(),URL.revokeObjectURL(p),x(t,`已导出 ${n.length} 条问题。`,"is-success"),!0}function E(){var s,n;const t=S();return!t||t.__dataQualityBound||(t.__dataQualityBound=!0,(s=t.querySelector("[data-data-quality-run]"))==null||s.addEventListener("click",A),(n=t.querySelector("[data-data-quality-export]"))==null||n.addEventListener("click",M)),t}function H(){return E(),A()}return i.document&&(i.document.readyState==="loading"?i.document.addEventListener("DOMContentLoaded",E,{once:!0}):E()),{analyze:q,render:A,init:H,bind:E,ensureSection:S,exportIssues:M}});
