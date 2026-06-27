((S,i)=>{const I=i(S||{});S&&!S.DataQualityRuntime&&(S.DataQualityRuntime=I),typeof module!="undefined"&&module.exports&&(module.exports=i)})(typeof globalThis!="undefined"?globalThis:this,function(i){function l(t){return String(t==null?"":t).trim()}function d(t){return l(t).replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])}function r(t){return Array.isArray(t)?t:[]}function _(t){var e,u;if(i&&typeof i.getExamRecordDateSortTimestamp=="function")return i.getExamRecordDateSortTimestamp((t==null?void 0:t.examId)||(t==null?void 0:t.examFullKey)||"",t);const n=((u=String(((e=t==null?void 0:t.meta)==null?void 0:e.date)||(t==null?void 0:t.date)||(t==null?void 0:t.examId)||(t==null?void 0:t.examFullKey)||"").match(/(\d{4}-\d{2}-\d{2})(?!.*\d{4}-\d{2}-\d{2})/))==null?void 0:u[1])||"",s=n?Date.parse(`${n}T00:00:00`):0;if(Number.isFinite(s)&&s>0)return s;if(i&&typeof i.getExamSortTimestamp=="function"){const c=i.getExamSortTimestamp((t==null?void 0:t.examId)||(t==null?void 0:t.examFullKey)||"",Number((t==null?void 0:t.updatedAt)||(t==null?void 0:t.createdAt)||0));if(Number.isFinite(c)&&c>0)return c}return Number((t==null?void 0:t.updatedAt)||(t==null?void 0:t.createdAt)||0)}function k(){const t=r(i.SUBJECTS).map(l).filter(Boolean);if(t.length)return t;const n=r(i.RAW_DATA).length?r(i.RAW_DATA):M(),s=new Set;return n.forEach(e=>{Object.keys(e&&e.scores||{}).forEach(u=>{const c=l(u);c&&s.add(c)})}),Array.from(s)}function M(){const t=i.COHORT_DB||(i.CohortDB&&typeof i.CohortDB.ensure=="function"?i.CohortDB.ensure():null),n=t&&t.exams&&typeof t.exams=="object"?t.exams:{},s=l(i.CURRENT_EXAM_ID||i.currentExamId),e=s&&n[s]&&r(n[s].data);if(e&&e.length)return e;const u=Object.values(n).filter(Boolean).sort((c,p)=>_(p)-_(c)).find(c=>r(c&&c.data).length);return u?r(u.data):[]}function F(t){const n=i.CONFIG||{},s=n.fullScore||n.fullScores||i.FULL_SCORE||{},e=Number(s&&s[t]);return Number.isFinite(e)&&e>0?e:150}function B(){const t=r(i.RAW_DATA);if(t.length)return t;const n=M();if(n.length)return n;const s=i.SCHOOLS&&typeof i.SCHOOLS=="object"?i.SCHOOLS:{};return Object.keys(s).flatMap(e=>{const u=s[e]||{};return r(u.students).map(c=>({school:e,...c}))})}function y(t,n,s,e,u,c=""){t.push({type:n,severity:s,message:u,detail:c,school:l(e&&e.school),className:l(e&&e.class),name:l(e&&e.name),examNo:l(e&&(e.examNo||e.exam_no||e.id||e.uuid))})}function T(t={}){const n=B(),s=k(),e=[],u=new Map,c=new Set,p=new Set,g=new Map;n.forEach((a,b)=>{const f=l(a&&a.school),h=l(a&&a.class),D=l(a&&a.name),K=l(a&&(a.examNo||a.exam_no||a.id||a.uuid));f&&c.add(f),h&&p.add(`${f||"unknown"}::${h}`),f||y(e,"missing-school","high",a,"缺少学校"),h||y(e,"missing-class","medium",a,"缺少班级"),D||y(e,"missing-name","high",a,"缺少姓名");const q=[f,h,D,K||`row-${b}`].join("::");u.has(q)?y(e,"duplicate-identity","high",a,"疑似重复学生记录",`与第 ${u.get(q)+1} 行身份一致`):u.set(q,b);const z=a&&a.scores&&typeof a.scores=="object"?a.scores:{};s.forEach(C=>{const A=z[C],R=Number(A);if(A==null||A===""){g.set(C,(g.get(C)||0)+1);return}if(!Number.isFinite(R)){y(e,"invalid-score","high",a,"分数不是有效数字",C);return}const j=F(C);(R<0||R>j)&&y(e,"score-out-of-range","high",a,"分数超出合理范围",`${C}: ${R}/${j}`)})}),g.forEach((a,b)=>{a>0&&n.length>0&&a/n.length>=.2&&e.push({type:"subject-missing-high",severity:"medium",message:"科目缺失比例偏高",detail:`${b}: ${a}/${n.length}`,school:"",className:"",name:"",examNo:""})});const m={high:0,medium:1,low:2};e.sort((a,b)=>{var f,h;return((f=m[a.severity])!=null?f:9)-((h=m[b.severity])!=null?h:9)});const o=Number(t.limit||300),N=Number.isFinite(o)?e.slice(0,o):e;return{rowCount:n.length,schoolCount:c.size,classCount:p.size,subjectCount:s.length,issueCount:e.length,highCount:e.filter(a=>a.severity==="high").length,mediumCount:e.filter(a=>a.severity==="medium").length,lowCount:e.filter(a=>a.severity==="low").length,visibleIssueCount:N.length,issues:N}}function v(){let t=i.document&&i.document.getElementById("data-quality");if(t)return t;const n=i.document&&i.document.getElementById("upload");return!(n&&n.parentNode)||!i.document?null:(t=i.document.createElement("div"),t.id="data-quality",t.className="section card-box analysis-workspace analysis-workspace-upload",t.innerHTML=`
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
        `,n.insertAdjacentElement("afterend",t),t)}function $(t,n,s=""){if(!t)return;const e=t.querySelector("[data-data-quality-status]");e&&(e.textContent=n||"",e.className=`analysis-status-text ${s}`.trim())}function H(t,n){const s=t&&t.querySelector("[data-data-quality-kpis]");if(!s)return;const e=[["学生记录",n.rowCount],["学校",n.schoolCount],["班级",n.classCount],["科目",n.subjectCount],["高风险",n.highCount],["待处理",n.issueCount]];s.innerHTML=e.map(([u,c])=>`
            <div class="data-quality-kpi">
                <span>${d(u)}</span>
                <strong>${d(c)}</strong>
            </div>
        `).join("")}function U(t,n){const s=t&&t.querySelector("[data-data-quality-tbody]");if(s){if(!n.issues.length){s.innerHTML='<tr><td colspan="6" class="analysis-empty-cell">未发现明显数据问题，可以继续进入分析模块。</td></tr>';return}s.innerHTML=n.issues.map(e=>`
            <tr>
                <td><span class="data-quality-severity is-${d(e.severity)}">${d(e.severity)}</span></td>
                <td>${d(e.message)}</td>
                <td>${d(e.school||"-")}</td>
                <td>${d(e.className||"-")}</td>
                <td>${d(e.name||"-")}</td>
                <td>${d(e.detail||e.examNo||"-")}</td>
            </tr>
        `).join("")}}function L(){const t=v();if(!t)return null;const n=T();t.__dataQualityLastResult=n,H(t,n),U(t,n);const s=n.issueCount>n.visibleIssueCount?`，表格先展示 ${n.visibleIssueCount} 条`:"";return $(t,n.issueCount?`发现 ${n.issueCount} 个问题${s}，导出会包含全部问题。`:"未发现明显数据问题。",n.issueCount?"is-error":"is-success"),typeof i.refreshResponsiveMobileTables=="function"&&i.refreshResponsiveMobileTables(t),n}function O(){const t=v(),n=T({limit:1/0}),s=n&&n.issues||[];if(!s.length)return $(t,"当前没有可导出的问题清单。","is-success"),!1;const e=["级别","问题","学校","班级","姓名","详情"],u=s.map(o=>[o.severity,o.message,o.school,o.className,o.name,o.detail||o.examNo||""]),c=[e,...u].map(o=>o.map(N=>`"${l(N).replace(/"/g,'""')}"`).join(",")).join(`
`),p=new Blob([`\uFEFF${c}`],{type:"text/csv;charset=utf-8"}),g=URL.createObjectURL(p),m=i.document.createElement("a");return m.href=g,m.download="data-quality-issues.csv",m.click(),URL.revokeObjectURL(g),$(t,`已导出 ${s.length} 条问题。`,"is-success"),!0}function E(){var n,s;const t=v();return!t||t.__dataQualityBound||(t.__dataQualityBound=!0,(n=t.querySelector("[data-data-quality-run]"))==null||n.addEventListener("click",L),(s=t.querySelector("[data-data-quality-export]"))==null||s.addEventListener("click",O)),t}function Q(){return E(),L()}return i.document&&(i.document.readyState==="loading"?i.document.addEventListener("DOMContentLoaded",E,{once:!0}):E()),{analyze:T,render:L,init:Q,bind:E,ensureSection:v,exportIssues:O}});
