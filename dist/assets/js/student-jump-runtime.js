(()=>{if(typeof window=="undefined"||window.__STUDENT_JUMP_RUNTIME_PATCHED__)return;function j(t){return JSON.stringify(String(t!=null?t:"")).replace(/&/g,"&amp;").replace(/"/g,"&quot;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function b(t){return typeof window.normalizeClass=="function"?window.normalizeClass(t):String(t||"").trim()}function g(t,o){const n=String(t||"").trim(),e=String(o||"").trim();return!n||!e?!1:n===e?!0:window.PermissionPolicy&&typeof window.PermissionPolicy.sameSchoolName=="function"?window.PermissionPolicy.sameSchoolName(n,e):typeof window.areSchoolNamesEquivalent=="function"?window.areSchoolNamesEquivalent(n,e):typeof areSchoolNamesEquivalent=="function"?areSchoolNamesEquivalent(n,e):typeof window.normalizeSchoolName=="function"?window.normalizeSchoolName(n)===window.normalizeSchoolName(e):!1}function S(t){var r,s;const o=String(t||"").trim(),n=window.SCHOOLS||{};if(!o)return null;if(Array.isArray((r=n==null?void 0:n[o])==null?void 0:r.students))return n[o].students;const e=Object.entries(n||{}).find(([l,d])=>g(l,o)||g(d==null?void 0:d.name,o));return Array.isArray((s=e==null?void 0:e[1])==null?void 0:s.students)?e[1].students:null}function w(t,o,n=o){if(!t)return;const e=String(o||"").trim();if(!e)return;let r=Array.from(t.options||[]).find(s=>String(s.value||"").trim()===e);r||(r=document.createElement("option"),r.value=e,r.textContent=String(n||e),t.appendChild(r)),t.value=r.value}function h(t,o,n){var p;const e=String(t||"").trim(),r=String(o||"").trim(),s=b(n);if(!e)return null;const l=i=>!(!i||String(i.name||"").trim()!==e||r&&String(i.school||"").trim()&&!g(i.school,r)||s&&b(i.class)!==s),d=window.SCHOOLS||{},f=window.RAW_DATA||[],c=S(r);if(Array.isArray(c)){const i=c.find(l);if(i)return i}if(Array.isArray(f)){const i=f.find(l);if(i)return i}for(const i of Object.values(d||{})){const u=(p=i==null?void 0:i.students)==null?void 0:p.find(l);if(u)return u}return null}function a(t){return String(t!=null?t:"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;")}function m(t,o){if(!t||typeof t!="object")return"-";const n={class:["class","rankClass","classRank"],school:["school","rankSchool","schoolRank"],township:["township","rankTown","townRank","townshipRank"],county:["county","rankCounty","countyRank"]}[o]||[o];for(const e of n){const r=t[e];if(r!=null&&r!=="")return r}return"-"}function v(t,o=1){const n=Number(t);return Number.isFinite(n)?n.toFixed(o).replace(/\.0$/,""):"-"}function N(t,o,n={}){var i,u,_,y;const e=String(o||"").trim(),r=e?(i=t==null?void 0:t.scores)==null?void 0:i[e]:null,s=e?((u=t==null?void 0:t.ranks)==null?void 0:u[e])||((_=t==null?void 0:t.subjectRanks)==null?void 0:_[e])||{}:{},l=((y=t==null?void 0:t.ranks)==null?void 0:y.total)||{},d=Number.isFinite(Number(n.gap))?`${Math.abs(Number(n.gap)).toFixed(1)} 分`:"-",f=n.focusLabel?String(n.focusLabel):"学科关注",c=v(r,1),p=[["班级排名",m(s,"class")],["校内排名",m(s,"school")],["乡镇排名",m(s,"township")],["总分校排",m(l,"school")]];return`
            <div class="student-subject-dialog">
                <div class="student-subject-dialog__hero">
                    <div>
                        <div class="student-subject-dialog__eyebrow">${a(f)}</div>
                        <h3>${a((t==null?void 0:t.name)||"-")} · ${a(e||"当前学科")}</h3>
                        <p>${a((t==null?void 0:t.school)||"")} ${a((t==null?void 0:t.class)||"")}</p>
                    </div>
                    <div class="student-subject-dialog__score">
                        <span>${a(e||"学科")}</span>
                        <strong>${a(c)}</strong>
                    </div>
                </div>
                <div class="student-subject-dialog__grid">
                    ${p.map(([E,$])=>`
                        <div class="student-subject-dialog__metric">
                            <span>${a(E)}</span>
                            <strong>${a($)}</strong>
                        </div>
                    `).join("")}
                </div>
                <div class="student-subject-dialog__note">
                    <strong>边缘差距</strong>
                    <span>${a(d)}</span>
                </div>
                <div class="student-subject-dialog__footer">
                    <span>这里只展示该学生在当前科目的关键情况；需要完整成绩单时，可进入“成绩单/家长查分”模块继续查看。</span>
                </div>
            </div>
        `}function k(){if(document.getElementById("student-subject-dialog-style"))return;const t=document.createElement("style");t.id="student-subject-dialog-style",t.textContent=`
            .student-subject-dialog{font-family:Inter,"Microsoft YaHei",system-ui,sans-serif;text-align:left;color:#111827}
            .student-subject-dialog__hero{display:flex;align-items:stretch;justify-content:space-between;gap:18px;padding:18px;border:1px solid #f2d9df;border-radius:18px;background:linear-gradient(135deg,#fff7f4 0%,#fff 48%,#f4fbf8 100%)}
            .student-subject-dialog__eyebrow{font-size:12px;font-weight:900;letter-spacing:.08em;color:#be123c;text-transform:uppercase;margin-bottom:8px}
            .student-subject-dialog__hero h3{margin:0;font-size:26px;line-height:1.25;color:#111827}
            .student-subject-dialog__hero p{margin:8px 0 0;color:#64748b;font-weight:700}
            .student-subject-dialog__score{min-width:132px;border:1px solid #f0a3b4;border-radius:16px;background:linear-gradient(135deg,#fff1f4,#fffaf0);color:#9f1239;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14px 16px}
            .student-subject-dialog__score span{font-size:12px;font-weight:800;color:#be123c}
            .student-subject-dialog__score strong{font-size:32px;line-height:1.1;margin-top:4px}
            .student-subject-dialog__grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin-top:14px}
            .student-subject-dialog__metric{border:1px solid #e8edf3;border-radius:14px;padding:14px;background:#fff}
            .student-subject-dialog__metric span{display:block;color:#64748b;font-size:12px;font-weight:800;margin-bottom:8px}
            .student-subject-dialog__metric strong{font-size:22px;color:#0f172a}
            .student-subject-dialog__note{display:flex;align-items:center;justify-content:space-between;margin-top:14px;border:1px dashed #f0a3b4;border-radius:14px;padding:12px 14px;background:#fff5f7;color:#9f1239;font-weight:900}
            .student-subject-dialog__footer{margin-top:12px;color:#64748b;font-size:13px;line-height:1.6}
            .student-subject-dialog-popup{z-index:97000!important}
            @media(max-width:720px){.student-subject-dialog__hero{flex-direction:column}.student-subject-dialog__grid{grid-template-columns:repeat(2,minmax(0,1fr))}.student-subject-dialog__score{min-width:0}}
        `,document.head.appendChild(t)}function C(t,o,n,e,r={}){const s=h(t,o,n);if(!s){alert(`未找到该学生：${t||""}`);return}k();const l=String(e||"").trim(),d=`${s.name||"-"} / ${l||"当前学科"}`,f=N(s,l,r);if(window.Swal&&typeof window.Swal.fire=="function"){window.Swal.fire({title:a(d),html:f,width:760,confirmButtonText:"关闭",confirmButtonColor:"#be123c",customClass:{popup:"student-subject-dialog-popup"},backdrop:!0});return}const c=document.createElement("div");c.style.cssText="position:fixed;inset:0;z-index:97000;background:rgba(15,23,42,.42);display:flex;align-items:center;justify-content:center;padding:20px;",c.innerHTML=`<div style="width:min(760px,96vw);max-height:88vh;overflow:auto;background:#fff;border-radius:20px;padding:22px;box-shadow:0 24px 70px rgba(15,23,42,.24);">${f}<div style="text-align:center;margin-top:16px;"><button type="button" class="btn btn-blue" data-close-student-subject-dialog>关闭</button></div></div>`,c.addEventListener("click",p=>{var i,u;(p.target===c||(u=(i=p.target)==null?void 0:i.hasAttribute)!=null&&u.call(i,"data-close-student-subject-dialog"))&&c.remove()}),document.body.appendChild(c)}function x(t){if(!t)return;const o=document.getElementById("sel-school"),n=document.getElementById("sel-class"),e=document.getElementById("inp-name");w(o,t.school||""),typeof window.updateClassSelect=="function"&&window.updateClassSelect(),w(n,t.class||""),e&&(e.value=t.name||"")}function T(t,o,n){typeof window.closeSpotlight=="function"&&window.closeSpotlight();const e=h(t,o,n);if(!e){alert(`未找到该学生：${t||""}`);return}typeof window.switchTab=="function"&&window.switchTab("report-generator"),setTimeout(()=>{x(e),typeof window.doQuery=="function"&&window.doQuery(e)},80)}Object.assign(window,{jsStringLiteral:j,normalizeJumpClass:b,sameJumpSchoolName:g,getJumpSchoolStudents:S,ensureSelectValue:w,findStudentForJump:h,syncReportControlsToStudent:x,jumpToStudent:T,openStudentSubjectDialog:C}),window.__STUDENT_JUMP_RUNTIME_PATCHED__=!0})();
