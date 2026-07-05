(function(){"use strict";const s=(e,a=0)=>{const n=window.teacherToNumber;if(typeof n=="function")return n(e,a);const d=Number(e);return Number.isFinite(d)?d:a},p=e=>{const a=window.teacherEscapeHtml;return typeof a=="function"?a(e):String(e!=null?e:"").replace(/[&<>"']/g,n=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[n])},h=(e,a=1)=>{const n=window.teacherFormatPercent;return typeof n=="function"?n(e,a):`${(s(e,0)*100).toFixed(a)}%`};function f(e){return typeof window.teacherGetSchoolRecord=="function"?window.teacherGetSchoolRecord(e):(window.SCHOOLS&&typeof window.SCHOOLS=="object"?window.SCHOOLS:{})[e]||null}function g(e,a,n){return`${[e.name,a.name].sort().join("-")}-${n}`}function m(e,a,n){const d=[...a].sort((o,i)=>{var t,c;return s((t=i.data.avgValue)!=null?t:i.data.avg,0)-s((c=o.data.avgValue)!=null?c:o.data.avg,0)});return{id:`subject-advice-${e}`,kind:"subject-advice",subject:e,teacher1:d[0]||null,teacher2:d[1]||null,reason:n,teacherNames:d.slice(0,3).map(o=>o.name).join("、"),score:0,source:"subject-advice"}}function R(e){const a=window.TEACHER_STATS||{};return Object.keys(a).filter(n=>{var d;return(d=a[n])==null?void 0:d[e]}).map(n=>({name:n,data:a[n][e]}))}function w(e,a,n){if(a.length<2)return[m(e,a,a.length?"该学科当前可用于结对的教师数量不足，建议先补全同学科任课数据，再做互助结对。":"该学科暂无可用任课教师数据，建议先检查任课表与成绩学科映射。")];const d=a.filter(t=>n&&t.data.passRate>n.passRate&&t.data.excellentRate<n.excRate),o=a.filter(t=>n&&t.data.excellentRate>n.excRate&&t.data.passRate<n.passRate),i=[];if(d.forEach(t=>{o.forEach(c=>{t.name!==c.name&&i.push({id:g(t,c,e),subject:e,teacher1:t,teacher2:c,score:Math.abs(s(t.data.passRate,0)-s(c.data.passRate,0))+Math.abs(s(c.data.excellentRate,0)-s(t.data.excellentRate,0)),source:"baseline"})})}),i.length||a.forEach(t=>{a.forEach(c=>{if(t.name===c.name)return;const r=s(t.data.passRate,0)-s(c.data.passRate,0),u=s(c.data.excellentRate,0)-s(t.data.excellentRate,0),l=Math.abs(Math.sqrt(Math.max(s(t.data.studentCount,0),0))-Math.sqrt(Math.max(s(c.data.studentCount,0),0)))*.01,v=r+u-l;v<=.015||r<=0||u<=0||i.push({id:g(t,c,e),subject:e,teacher1:t,teacher2:c,score:v,source:"complement"})})}),!i.length){const t=[...a].sort((l,v)=>s(v.data.passRate,0)-s(l.data.passRate,0)||s(v.data.studentCount,0)-s(l.data.studentCount,0)),c=[...a].sort((l,v)=>s(v.data.excellentRate,0)-s(l.data.excellentRate,0)||s(v.data.studentCount,0)-s(l.data.studentCount,0)),r=t[0],u=c.find(l=>l.name!==(r==null?void 0:r.name));r&&u?i.push({id:g(r,u,e),subject:e,teacher1:r,teacher2:u,score:Math.abs(s(r.data.passRate,0)-s(u.data.passRate,0))+Math.abs(s(u.data.excellentRate,0)-s(r.data.excellentRate,0)),source:"coverage"}):i.push(m(e,a,"该学科教师表现接近，建议以同课异构、作业面批和临界生跟踪作为本轮教研重点。"))}return i.sort((t,c)=>c.score-t.score)}function x(e){const a=document.createElement("div");return a.className="pairing-card",e.kind==="subject-advice"?(a.innerHTML=`
                <div class="pairing-side">
                    <div class="pairing-role">学科建议</div>
                    <div class="pairing-name">${p(e.subject)}</div>
                    <div class="pairing-skill">${p(e.teacherNames||"暂无可配对教师")}</div>
                    <div class="pairing-need">${p(e.reason||"建议补全任课与成绩数据后再生成结对。")}</div>
                </div>
                <div class="pairing-arrow">
                    <div style="text-align:center;">
                        <i class="ti ti-bulb"></i>
                        <div class="pairing-tag">${p(e.subject)}</div>
                    </div>
                </div>
                <div class="pairing-side" style="text-align:right;">
                    <div class="pairing-role">下一步</div>
                    <div class="pairing-name">教研组跟进</div>
                    <div class="pairing-skill">覆盖本届别学科</div>
                    <div class="pairing-need">形成学科行动清单</div>
                </div>
            `,a):(a.innerHTML=`
            <div class="pairing-side">
                <div class="pairing-role">基础扎实型</div>
                <div class="pairing-name">${p(e.teacher1.name)}</div>
                <div class="pairing-skill">及格率高 (${h(e.teacher1.data.passRate,1)})</div>
                <div class="pairing-need">需提升优秀率</div>
            </div>
            <div class="pairing-arrow">
                <div style="text-align:center;">
                    <i class="ti ti-arrows-left-right"></i>
                    <div class="pairing-tag">${p(e.subject)}</div>
                </div>
            </div>
            <div class="pairing-side" style="text-align:right;">
                <div class="pairing-role">培优拔尖型</div>
                <div class="pairing-name">${p(e.teacher2.name)}</div>
                <div class="pairing-skill">优秀率高 (${h(e.teacher2.data.excellentRate,1)})</div>
                <div class="pairing-need">需提升及格率</div>
            </div>
        `,a)}function S(){const e=document.getElementById("teacher-pairing-suggestions");if(!e)return;e.innerHTML="";const a=f(window.MY_SCHOOL);if(!window.MY_SCHOOL||!a)return;const n=[],d=new Set,o=i=>{i&&(i.kind!=="subject-advice"&&(!i.teacher1||!i.teacher2||i.teacher1.name===i.teacher2.name)||d.has(i.id)||(d.add(i.id),n.push(i)))};if((window.SUBJECTS||[]).forEach(i=>{var c;const t=w(i,R(i),(c=a.metrics)==null?void 0:c[i]);o(t[0]),t.slice(1,2).forEach(o)}),!n.length){e.innerHTML='<div style="text-align:center; color:#999; grid-column:1/-1;">暂无可用结对建议，请先检查当前届别学科、任课表和成绩数据。</div>';return}n.forEach(i=>e.appendChild(x(i)))}window.generateTeacherPairing=S,window.__TEACHER_PAIRING_RUNTIME_PATCHED__=!0})();
