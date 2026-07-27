(()=>{if(typeof window=="undefined"||window.__FRESHMAN_EXAM_RUNTIME_PATCHED__)return;let M=[],v=typeof window.readFbClassesState=="function"?window.readFbClassesState():Array.isArray(window.FB_CLASSES)?window.FB_CLASSES:[],k=-1,se={},$=[],L=[],F=[],re=null;const x={schemeSelectorSignature:"",schemeSelectorHtml:"",dashboardSignature:"",dashboardHtml:"",balanceSignature:"",balanceChartSignature:"",balanceTableHtml:"",examOverviewSignature:"",examOverviewHtml:"",examStudentListSignature:"",examStudentListHtml:"",examProctorSignature:"",examProctorHtml:"",examPrintSignature:"",examPrintHtml:""};let K=!1;function ie(e=v){return(Array.isArray(e)?e:[]).map(n=>[n==null?void 0:n.id,n==null?void 0:n.name,Array.isArray(n==null?void 0:n.students)?n.students.length:0,Array.isArray(n==null?void 0:n.students)?n.students.map(t=>`${t.name}:${t.score}:${t.gender}:${t.isDiff||t._isDiff?1:0}`).join(","):""].join(":")).join("|")}function Ae(e=[]){const n=Array.isArray(e)?e:[],t=n.length;let o=0,a=0,s=0;return n.forEach(r=>{o+=Number(r==null?void 0:r.score)||0,(r==null?void 0:r.gender)==="M"&&(a+=1),(r!=null&&r.isDiff||r!=null&&r._isDiff)&&(s+=1)}),{avg:t?o/t:0,male:a,female:t-a,diff:s,count:t}}function Q(){return(Array.isArray(L)?L:[]).map(e=>{const n=Array.isArray(e==null?void 0:e.students)?e.students:[];return[e==null?void 0:e.id,n.length,n.map(t=>[t==null?void 0:t.examNo,t==null?void 0:t.name,t==null?void 0:t.class,t==null?void 0:t.roomNo,t==null?void 0:t.seatNo,t==null?void 0:t.score].join(":")).join(",")].join("|")}).join("||")}function et(){const e=typeof window.readFbClassesState=="function"?window.readFbClassesState():Array.isArray(window.FB_CLASSES)?window.FB_CLASSES:[];return Array.isArray(e)&&(v=e),window.FB_CLASSES=v,v}function Le(e){const n=typeof window.setFbClassesState=="function"?window.setFbClassesState(e):Array.isArray(e)?e:[];return v=Array.isArray(n)?n:[],window.FB_CLASSES=v,v}function ke(){return window.CONFIG||{name:"学校"}}const tt=Object.freeze(["语文","数学","英语","物理","化学"]),nt=Object.freeze({语文:1,数学:1,英语:1,物理:.9,化学:.6}),H=Object.freeze(["语文","数学","英语"]),Me=150,le=Me*.85,ce=Me*.6;function j(e){return String(e==null?"":e).replace(/\s+/g,"").trim()}function z(e){return String(e==null?"":e).replace(/\s+/g,"").trim()}function at(e){const n=z(e&&(e.id||e.examNo||e.studentId));return n&&n!=="-"&&n!=="0"?"id:"+n:"name:"+j(e&&e.name)}function ot(e=3){const n=typeof window.COHORT_DB=="object"&&window.COHORT_DB?window.COHORT_DB:null,t=n&&n.exams&&typeof n.exams=="object"?n.exams:null;if(!t)return[];const o=Object.keys(t).map(a=>{const s=t[a]||{},r=s.meta||{},i=String(r.date||r.examDate||"").trim(),l=Date.parse(i)||Number(s.updatedAt)||Number(s.createdAt)||0;return{examId:a,meta:r,data:Array.isArray(s.data)?s.data:[],subjects:Array.isArray(s.subjects)?s.subjects:[],ts:l,dateStr:i,label:String(r.type||r.examName||a)}}).filter(a=>a.data.length>0);return o.sort((a,s)=>s.ts-a.ts),o.slice(0,Math.max(1,Math.min(e,3)))}function st(e,n){const t=e&&e.scores&&typeof e.scores=="object"?e.scores:{};if(String(n)==="9"){let s=0,r=0;return tt.forEach(i=>{const l=Number(t[i]);Number.isFinite(l)&&(s+=l*nt[i],r+=1)}),r>0?{score:s,subjectsGot:r}:null}const o=Number(e&&e.total);if(Number.isFinite(o)&&o>0)return{score:o,subjectsGot:-1};const a=Object.values(t).map(Number).filter(Number.isFinite);return a.length?{score:a.reduce((s,r)=>s+r,0),subjectsGot:a.length}:null}let U={},R={},Y=[],Z=[],J=null;function de(e={}){var h,w;const n=String(e.targetGrade||((h=document.getElementById("fb_target_grade"))==null?void 0:h.value)||"7").trim(),t=Math.max(1,Math.min(Number(e.examLimit||((w=document.getElementById("fb_exam_count"))==null?void 0:w.value)||2),3)),o=ot(t);if(!o.length)return window.UI.alert("未找到本届别的云端考试数据，请先在「数据准备」上传并同步成绩。"),null;const a=o.length>=3?[.5,.3,.2]:o.length===2?[.6,.4]:[1],s=Array.isArray(e.weights)&&e.weights.length===o.length?e.weights:a,r=new Map,i=new Map;o.forEach((m,g)=>{const b=s[g]||0;m.data.forEach(y=>{const S=at(y),E=j(y.name);E&&(i.has(E)||i.set(E,new Set),i.get(E).add(z(y.id||y.examNo||y.studentId)||"(无考号)"));const _=st(y,n);if(!_)return;r.has(S)||r.set(S,{name:y.name||"未知",id:z(y.id||y.examNo||y.studentId),class:y.class||"",wSum:0,scoreSum:0,examsGot:0,subj:{语文:{s:0,w:0},数学:{s:0,w:0},英语:{s:0,w:0}}});const I=r.get(S);I.wSum+=b,I.scoreSum+=_.score*b,I.examsGot+=1;const D=y&&y.scores&&typeof y.scores=="object"?y.scores:{};H.forEach(d=>{const B=Number(D[d]);Number.isFinite(B)&&(I.subj[d].s+=B*b,I.subj[d].w+=b)})})});const l=[];i.forEach((m,g)=>{const b=[...m].filter(y=>y&&y!=="(无考号)");(m.size>1||b.length===0&&[...r.values()].filter(y=>j(y.name)===g).length>1)&&l.push({name:g,ids:[...m]})});let c=0,u=0,p=0;const f=[];return r.forEach((m,g)=>{const b=m.wSum>0?m.scoreSum/m.wSum:0;m.wSum<=0&&(p+=1);let y=U[g];y||(y=U["name:"+j(m.name)]),y||(y="F",u+=1);const S=!!(R[g]||R["name:"+j(m.name)]),E={};H.forEach(_=>{const I=m.subj&&m.subj[_];E[_]=I&&I.w>0?I.s/I.w:null}),f.push({_id:c++,key:g,name:m.name,id:m.id,srcClass:m.class,gender:y,score:parseFloat(b.toFixed(2)),subjAvg:E,examsGot:m.examsGot,examsTotal:o.length,height:160,vision:5,isDiff:S,isViolation:S,remarks:"",constraints:{same:[],diff:[]},classIdx:-1})}),M=f,J={targetGrade:n,examCount:o.length,examLabels:o.map(m=>`${m.label}${m.dateStr?"("+m.dateStr+")":""}`),weights:s,matched:f.length,dupGroups:l,missingGender:u,missingScore:p,violationTotal:f.filter(m=>m.isViolation).length,genderUploaded:Object.keys(U).length>0,violationUploaded:Object.keys(R).length>0},J}function Ce(e){const n=e.files[0];if(!n)return;const t=new FileReader;t.onload=function(o){try{const a=XLSX.read(new Uint8Array(o.target.result),{type:"array"}),s=XLSX.utils.sheet_to_json(a.Sheets[a.SheetNames[0]]);U={},Y=[];const r=new Map;s.forEach(c=>{const u=j(c.姓名||c.名字||c.Name);if(!u)return;const p=String(c.性别||c.Gender||"").trim()==="男"||String(c.性别||c.Gender||"").toUpperCase()==="M"?"M":"F",f=z(c.考号||c.学号||c.准考证号||""),h=f?"id:"+f:"name:"+u;U[h]=p,f||(U["name:"+u]=p),Y.push(u),r.set(u,(r.get(u)||0)+1)});const i=[...r.entries()].filter(([,c])=>c>1).map(([c])=>c);let l=`✅ 性别名单导入 ${Y.length} 人。`;i.length&&(l+=`
⚠️ 检测到 ${i.length} 个重名：${i.slice(0,8).join("、")}${i.length>8?"…":""}
重名建议在名单中补「考号」列以精确匹配。`),window.UI.alert(l),te()}catch(a){window.UI.alert("性别名单读取失败："+a.message)}},t.readAsArrayBuffer(n)}function $e(e){const n=e.files[0];if(!n)return;const t=new FileReader;t.onload=function(o){try{const a=XLSX.read(new Uint8Array(o.target.result),{type:"array"}),s=XLSX.utils.sheet_to_json(a.Sheets[a.SheetNames[0]]);R={},Z=[];const r=new Map;s.forEach(c=>{const u=j(c.姓名||c.名字||c.Name);if(!u)return;const p=z(c.考号||c.学号||c.准考证号||""),f=p?"id:"+p:"name:"+u;R[f]=!0,p||(R["name:"+u]=!0),Z.push(u),r.set(u,(r.get(u)||0)+1)});const i=[...r.entries()].filter(([,c])=>c>1).map(([c])=>c);let l=`✅ 违纪名单导入 ${Z.length} 人。`;i.length&&(l+=`
⚠️ 检测到 ${i.length} 个重名：${i.slice(0,8).join("、")}${i.length>8?"…":""}
重名建议补「考号」列。`),window.UI.alert(l),te()}catch(a){window.UI.alert("违纪名单读取失败："+a.message)}},t.readAsArrayBuffer(n)}function ee(){var o;const e=((o=document.getElementById("fb_data_source"))==null?void 0:o.value)||"cloud",n=document.getElementById("fb_manual_upload_row"),t=document.getElementById("fb_assembly_status");n&&(n.style.display=e==="manual"?"flex":"none"),t&&(t.style.display=e==="manual"?"none":"block")}function fe(e=document){const n=e&&typeof e.querySelectorAll=="function"?e:document;n.querySelectorAll("[data-fb-pick]").forEach(t=>{t.dataset.fbPickBound!=="1"&&(t.dataset.fbPickBound="1",t.addEventListener("click",()=>{const o=document.getElementById(String(t.dataset.fbPick||"").trim());o&&o.click()}))}),n.querySelectorAll("[data-fb-change]").forEach(t=>{t.dataset.fbChangeBound!=="1"&&(t.dataset.fbChangeBound="1",t.addEventListener("change",()=>{const o=String(t.dataset.fbChange||"").trim();if(!/^FB_[A-Za-z0-9_]+$/.test(o))return;const a=window[o];typeof a=="function"&&a(t)}))})}function te(){const e=document.getElementById("fb_assembly_status");if(!e)return;const n=Object.keys(U).length,t=Z.length;e.innerHTML=`已载入性别名单 <strong>${Y.length}</strong> 人 · 违纪名单 <strong>${t}</strong> 人。点击「生成分班方案」将读取本届别最近考试成绩并聚合。`}function Fe(e){const n=e.files[0];if(!n)return;const t=new FileReader;t.onload=function(o){try{const a=new Uint8Array(o.target.result),s=XLSX.read(a,{type:"array"}),r=XLSX.utils.sheet_to_json(s.Sheets[s.SheetNames[0]]);if(!r.length)throw new Error("Excel没有数据");M=r.map((l,c)=>{const u=String(l.备注||l.说明||""),p=u.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:同班|一起|一班)/),f=u.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:分开|不同班|不在一起)/);return{_id:c,name:l.姓名||"未知",gender:l.性别==="男"||l.Gender==="M"?"M":"F",score:parseFloat(l.总分||l.语数英||0),height:parseFloat(l.身高||160),vision:parseFloat(l.视力||l.左眼||5),isDiff:String(l.难管||"").includes("是")||u.includes("难管")||u.includes("调皮"),remarks:u,constraints:{same:p?[p[1]]:[],diff:f?[f[1]]:[]},classIdx:-1}});const i=document.getElementById("fb_data_source");i&&(i.value="manual",typeof ee=="function"&&ee()),window.UI.alert(`✅ 导入成功！共 ${M.length} 人。`),document.getElementById("fb-results-area").classList.add("hidden")}catch(a){window.UI.alert("读取失败："+a.message)}},t.readAsArrayBuffer(n)}function rt(e){const n=ue(e),t=Math.floor(e.length/2),o=e.slice(0,t),a=e.slice(e.length%2===0?t:t+1),s=ue(o),r=ue(a);return{q1:s,q2:n,q3:r}}function ue(e){const n=Math.floor(e.length/2);return e.length%2!==0?e[n]:(e[n-1]+e[n])/2}function Te(e){const n=e.length;if(n===0)return 0;const t=e.reduce((a,s)=>a+s,0)/n,o=e.reduce((a,s)=>a+Math.pow(s-t,2),0)/n;return Math.sqrt(o)}function Ne(){const e=document.getElementById("fb_data_source"),n=e?e.value:"cloud";if(n==="cloud"){const s=de();if(!s)return;if(s.dupGroups&&s.dupGroups.length){const r=s.dupGroups.slice(0,12).map(c=>`· ${c.name}（${c.ids.length} 人）`).join(`
`),i=s.dupGroups.length>12?`
…共 ${s.dupGroups.length} 组`:"";if(!window.confirm(`⚠️ 检测到 ${s.dupGroups.length} 组重名学生，成绩/性别/违纪可能匹配错乱：
${r}${i}

建议在性别/违纪名单中补「考号」列以精确匹配。
是否仍按当前匹配继续分班？`))return}s.missingGender>0&&window.UI&&window.UI.toast&&window.UI.toast(`⚠️ ${s.missingGender} 人未匹配到性别，已暂按女生计入，建议补全性别名单`,"warning")}if(!M.length)return window.UI.alert(n==="cloud"?"云端未聚合到学生成绩，请检查考试数据与名单。":"请先导入数据");const t=parseInt(document.getElementById("fb_cls_num").value)||6,o=document.getElementById("fb_algorithm").value,a=document.querySelector('button[onclick="FB_runDivision()"]');a.innerHTML="⏳ 正在运算多套方案...",a.disabled=!0,setTimeout(()=>{F=[];const s=o==="snake"?1:3;for(let l=0;l<s;l++){const c=me(t,o),u=c.map(h=>h.stats.avg),p=Math.max(...u)-Math.min(...u),f=Te(u);F.push({id:l,name:s===1?"标准方案":`方案 ${String.fromCharCode(65+l)}`,data:c,range:p,sd:f,desc:`均分极差 ${p.toFixed(2)}`})}a.innerHTML="🚀 开始智能分班",a.disabled=!1,pe();const r=[...F].sort((l,c)=>l.range-c.range)[0];ge(r.id),document.getElementById("fb-results-area").classList.remove("hidden");const i=document.getElementById("fb-scheme-panel");s>1?i&&i.classList.remove("hidden"):i&&i.classList.add("hidden")},100)}function me(e,n){window.__FB_K=e,it();let t=Array.from({length:e},(a,s)=>({id:s,name:s+1+"班",students:[],stats:{}})),o=JSON.parse(JSON.stringify(M));if(o.sort((a,s)=>s.score-a.score),o.forEach((a,s)=>{a.globalRank=s+1,a.rankBlock=Math.floor(s/e)}),n==="snake")o.forEach((a,s)=>{const i=Math.floor(s/e)%2===0?s%e:e-1-s%e;t[i].students.push(a),a.classIdx=i});else{o.forEach((r,i)=>{const l=Math.floor(i/e)%2===0?i%e:e-1-i%e;t[l].students.push(r),r.classIdx=l});const a=8e3,s=o.reduce((r,i)=>r+i.score,0)/o.length;for(let r=0;r<a;r++){const i=Math.floor(Math.random()*e),l=Math.floor(Math.random()*e);if(i===l)continue;const c=t[i],u=t[l];if(!c.students.length||!u.students.length)continue;const p=Math.floor(Math.random()*c.students.length),f=Math.floor(Math.random()*u.students.length),h=c.students[p],w=u.students[f],m=G(c,s)+G(u,s);c.students[p]=w,w.classIdx=i,u.students[f]=h,h.classIdx=l;const g=G(c,s)+G(u,s);let b=!1;(ne(h,u.students)||ne(w,c.students))&&(b=!0),(b||g>m)&&(c.students[p]=h,h.classIdx=i,u.students[f]=w,w.classIdx=l)}}return t.forEach(a=>{a.stats=Ae(a.students)}),t}function pe(){const e=document.getElementById("fb-scheme-cards");if(!e)return;const n=F.length?Math.min(...F.map(a=>a.range)):1/0,t=F.map(a=>`${a.id}:${a.range.toFixed(3)}:${a.sd.toFixed(3)}:${ie(a.data)}`).join("|");if(x.schemeSelectorSignature===t){e.dataset.freshmanSchemeSig!==t&&(e.innerHTML=x.schemeSelectorHtml,e.dataset.freshmanSchemeSig=t);return}const o=F.map(a=>{const s=a.range<=n,r=s?"border:2px solid #16a34a; background:#fff;":"border:1px solid #ddd; background:#fff;",i=a.data.map(c=>c.stats.male),l=Math.max(...i)-Math.min(...i);return`
                <div data-scheme-id="${a.id}" onclick="FB_applyScheme(${a.id})" style="cursor:pointer; padding:10px; border-radius:6px; ${r} transition:0.2s;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='#fff'">
                    <div style="font-weight:bold; color:#333; display:flex; justify-content:space-between;">
                        <span>${a.name}</span>
                        ${s?'<span style="color:red; font-size:10px;">★ 推荐</span>':""}
                    </div>
                    <div style="font-size:12px; color:#666; margin-top:5px;">
                        <div>均分极差: <strong>${a.range.toFixed(2)}</strong></div>
                        <div>男女极差: ${l} 人</div>
                    </div>
                </div>
            `}).join("");x.schemeSelectorSignature=t,x.schemeSelectorHtml=o,e.innerHTML=o,e.dataset.freshmanSchemeSig=t}function ge(e){const n=F.find(o=>o.id===e);if(!n)return;Le(n.data),se={},v.forEach(o=>se[o.name]=o.students),be();const t=document.getElementById("fb-scheme-cards");if(t){const o=t.children;Array.from(o).forEach(a=>{String(a.dataset.schemeId)===String(n.id)?(a.style.borderColor="#16a34a",a.style.boxShadow="0 0 0 3px rgba(22, 163, 74, 0.2)"):(a.style.borderColor="#ddd",a.style.boxShadow="none")})}}let O=null,P=null;function it(){var o,a;const e=M.map(s=>s.score).filter(Number.isFinite).sort((s,r)=>r-s);if(!e.length){O=null,P=null;return}const n=(o=e[Math.floor(e.length*.27)])!=null?o:e[0],t=(a=e[Math.floor(e.length*.73)])!=null?a:e[e.length-1];O={high:n,low:t},P={},H.forEach(s=>{const r=M.map(u=>u.subjAvg&&Number.isFinite(u.subjAvg[s])?u.subjAvg[s]:null).filter(u=>u!=null);if(!r.length){P[s]=null;return}const i=r.reduce((u,p)=>u+p,0)/r.length,l=r.filter(u=>u>=le).length/r.length,c=r.filter(u=>u>=ce).length/r.length;P[s]={avg:i,exc:l,pass:c,n:r.length}})}function X(e){return O?e>=O.high?"high":e<=O.low?"low":"mid":"mid"}function G(e,n){var p,f,h,w;const t=e.students.length;if(t===0)return 1e4;const o=e.students.reduce((m,g)=>m+g.score,0)/t,a=e.students.filter(m=>m.gender==="M").length,s=e.students.filter(m=>m.isViolation||m.isDiff||m._isDiff).length;let r=Math.pow(o-n,2)*100;r+=Math.pow(a/t-.5,2)*5e3;const i=((p=document.getElementById("fb_rule_diff"))==null?void 0:p.value)||"spread";if(i==="spread"?r+=Math.pow(s,2)*600:i==="gather"&&(r-=s*100),(((f=document.getElementById("fb_rule_tier"))==null?void 0:f.value)||"on")==="on"&&O&&M.length){const m=typeof window.__FB_K=="number"&&window.__FB_K>0?window.__FB_K:1,g=M.filter(E=>X(E.score)==="high").length/m,b=M.filter(E=>X(E.score)==="low").length/m,y=e.students.filter(E=>X(E.score)==="high").length,S=e.students.filter(E=>X(E.score)==="low").length;r+=(Math.pow(y-g,2)+Math.pow(S-b,2))*300}if((((h=document.getElementById("fb_rule_rank"))==null?void 0:h.value)||"on")==="on"){const m={};e.students.forEach(b=>{typeof b.rankBlock=="number"&&(m[b.rankBlock]=(m[b.rankBlock]||0)+1)});let g=0;Object.values(m).forEach(b=>{b>1&&(g+=(b-1)*(b-1))}),r+=g*1200}return(((w=document.getElementById("fb_rule_subject"))==null?void 0:w.value)||"on")==="on"&&P&&H.forEach(m=>{const g=P[m];if(!g)return;const b=e.students.map(_=>_.subjAvg&&Number.isFinite(_.subjAvg[m])?_.subjAvg[m]:null).filter(_=>_!=null);if(!b.length)return;const y=b.reduce((_,I)=>_+I,0)/b.length,S=b.filter(_=>_>=le).length/b.length,E=b.filter(_=>_>=ce).length/b.length;r+=Math.pow(y-g.avg,2)*40,r+=Math.pow(S-g.exc,2)*4e3,r+=Math.pow(E-g.pass,2)*4e3}),r}function ne(e,n){if(!e.constraints)return!1;for(let t of e.constraints.diff)if(n.find(o=>o.name===t))return!0;return!1}function he(){const e=document.getElementById("fb-results-area");if(!e)return;let n=document.getElementById("fb_assembly_banner");const t=J;if(!t){n&&n.remove();return}n||(n=document.createElement("div"),n.id="fb_assembly_banner",e.insertBefore(n,e.firstChild));const o=t.targetGrade==="9"?"新9年级（语数英物化，物×0.9 化×0.6，不含政治）":t.targetGrade==="8"?"新8年级":"新7年级",a=[];a.push(`口径：${o}`),a.push(`参考考试：${t.examLabels.join(" + ")||t.examCount+" 次"}`),a.push(`匹配学生：${t.matched} 人`),t.violationUploaded&&a.push(`违纪：${t.violationTotal} 人`),t.missingGender>0&&a.push(`⚠️ 缺性别 ${t.missingGender} 人`);const s=t.dupGroups&&t.dupGroups.length?`<div style="margin-top:8px; color:#b91c1c; font-weight:600;">
             ⚠️ 存在 ${t.dupGroups.length} 组重名学生（${t.dupGroups.slice(0,10).map(l=>l.name).join("、")}${t.dupGroups.length>10?"…":""}），
             成绩/性别/违纪匹配可能有误，请务必人工核对；建议名单补「考号」列以精确匹配。
           </div>`:"",r=t.dupGroups&&t.dupGroups.length?"#fef2f2":"#f0f9ff",i=t.dupGroups&&t.dupGroups.length?"#fecaca":"#bae6fd";n.style.cssText=`background:${r}; border:1px solid ${i}; border-radius:8px; padding:12px 14px; margin-bottom:15px; font-size:13px; color:#334155;`,n.innerHTML=`<div><i class="ti ti-info-circle"></i> <strong>分班数据摘要</strong>（仅本次分班使用，不影响云端成绩）</div>
        <div style="margin-top:6px;">${a.join(" · ")}</div>${s}`}function be(){document.getElementById("fb-results-area").classList.remove("hidden"),he();const e=document.getElementById("fb_class_container"),n=ie(v);if((e==null?void 0:e.dataset.freshmanDashboardSig)===n&&x.dashboardSignature===n){q();return}let t=[],o=0,a=0,s=0;const r=v.map(w=>{const m=Ae(w.students),g=m.count,b=m.avg,y=m.male,S=m.diff;t.push(b),o+=y,a+=m.female,s+=S,w.stats=m;const E=S>3,_=w.students.filter(d=>X(d.score)==="high").length,I=w.students.filter(d=>X(d.score)==="low").length,D=J&&J.violationUploaded?"违纪":"难管";return`<div class="fb-class-box ${E?"fb-warn-bg":""}" onclick="FB_openSeatMap(${w.id})"><div class="fb-c-head"><span style="font-weight:bold; font-size:16px;">${w.name}</span><span class="fb-tag fb-tag-red" style="${S>0?"":"display:none"}">${D}: ${S}</span></div><div class="fb-c-body"><div>人数: <strong>${g}</strong></div><div>均分: <strong>${b.toFixed(1)}</strong></div><div>男生: ${y}</div><div>女生: ${m.female}</div><div>高分段: ${_}</div><div>低分段: ${I}</div><div style="grid-column:span 2; font-size:11px; color:#999; margin-top:5px;">点击进入座位编排 →</div></div></div>`}).join("");e&&e.innerHTML!==r&&(e.innerHTML=r,e.dataset.freshmanDashboardSig=n),x.dashboardSignature=n,x.dashboardHtml=r;const i=t.length?Math.max(...t)-Math.min(...t):0,l=document.getElementById("fb_res_total"),c=document.getElementById("fb_res_male"),u=document.getElementById("fb_res_female"),p=document.getElementById("fb_res_diff"),f=document.getElementById("fb_res_diff_cnt");l&&(l.innerText=M.length),c&&(c.innerText=o),u&&(u.innerText=a),p&&(p.innerText=i.toFixed(2)),f&&(f.innerText=s);const h=document.getElementById("fb_res_eval");h&&(i<=1?h.innerHTML='<span style="color:green;font-weight:bold;">✅ 完美均衡</span>':i<=3?h.innerHTML='<span style="color:#d97706;font-weight:bold;">⚠️ 基本均衡</span>':h.innerHTML='<span style="color:red;font-weight:bold;">❌ 差异过大</span>'),q()}function lt(e){if(!v.some(a=>a.students.some(s=>s.subjAvg&&H.some(r=>Number.isFinite(s.subjAvg[r])))))return"";const t=a=>(a*100).toFixed(0)+"%";let o='<div style="margin-top:16px; font-weight:600; color:#334155;">📚 主科每班均衡（语数英 · 均分 / 优秀率≥127.5 / 及格率≥90）</div>';return o+='<table class="comparison-table" style="font-size:12px; margin-top:6px;"><thead><tr><th>班级</th>',H.forEach(a=>{o+=`<th>${a}均分</th><th>${a}优秀</th><th>${a}及格</th>`}),o+="</tr></thead><tbody>",v.forEach((a,s)=>{o+=`<tr><td>${e[s]}</td>`,H.forEach(r=>{const i=a.students.map(p=>p.subjAvg&&Number.isFinite(p.subjAvg[r])?p.subjAvg[r]:null).filter(p=>p!=null);if(!i.length){o+="<td>-</td><td>-</td><td>-</td>";return}const l=i.reduce((p,f)=>p+f,0)/i.length,c=i.filter(p=>p>=le).length/i.length,u=i.filter(p=>p>=ce).length/i.length;o+=`<td>${l.toFixed(1)}</td><td>${t(c)}</td><td>${t(u)}</td>`}),o+="</tr>"}),o+="</tbody></table>",o}function q(){const e=document.getElementById("balanceChart"),n=document.getElementById("balanceTableContainer"),t=v.map(i=>i.name),o=ie(v);if(x.balanceSignature===o&&(n==null?void 0:n.dataset.freshmanBalanceSig)===o&&x.balanceChartSignature===o)return;const a=v.map(i=>{const l=i.students.map(u=>u.score).sort((u,p)=>u-p),c=rt(l);return{min:l[0],max:l[l.length-1],q1:c.q1,median:c.q2,q3:c.q3,avg:i.stats.avg,sd:Te(l)}});let s='<table class="comparison-table" style="font-size:12px;"><thead><tr><th>班级</th><th>人数</th><th>平均分</th><th>标准差 (SD)</th><th>极差 (Max-Min)</th><th>前25%线 (Q3)</th><th>后25%线 (Q1)</th></tr></thead><tbody>';a.forEach((i,l)=>{s+=`<tr><td>${t[l]}</td><td>${v[l].students.length}</td><td>${i.avg.toFixed(2)}</td><td>${i.sd.toFixed(2)}</td><td>${(i.max-i.min).toFixed(1)}</td><td>${i.q3}</td><td>${i.q1}</td></tr>`});const r=s+"</tbody></table>"+lt(t);if(n&&n.innerHTML!==r&&(n.innerHTML=r,n.dataset.freshmanBalanceSig=o),x.balanceSignature=o,x.balanceTableHtml=r,!!e){if(!window.Chart){!K&&typeof window.ensureChartVendorLoaded=="function"&&(K=!0,window.ensureChartVendorLoaded().then(()=>{var i,l;K=!1,((i=document.getElementById("freshman-simulator"))!=null&&i.classList.contains("active")||(l=document.getElementById("exam-arranger"))!=null&&l.classList.contains("active"))&&(x.balanceChartSignature="",q())}).catch(i=>{K=!1,console.warn("[freshman] chart runtime load failed:",i)}));return}x.balanceChartSignature!==o&&(re&&re.destroy(),re=new Chart(e,{type:"bar",data:{labels:t,datasets:[{label:"平均分",data:a.map(i=>i.avg),type:"scatter",backgroundColor:"#2563eb",borderColor:"#2563eb",pointStyle:"rectRot",pointRadius:6},{label:"分数区间 (Min-Max)",data:a.map(i=>[i.min,i.max]),backgroundColor:"rgba(156, 163, 175, 0.2)",borderColor:"rgba(156, 163, 175, 0.5)",borderWidth:1,barPercentage:.1},{label:"核心分布 (Q1-Q3)",data:a.map(i=>[i.q1,i.q3]),backgroundColor:"rgba(37, 99, 235, 0.5)",borderColor:"#1e40af",borderWidth:1,barPercentage:.6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{tooltip:{callbacks:{label:function(i){const l=a[i.dataIndex];if(i.dataset.type==="scatter")return`平均分: ${l.avg.toFixed(2)}`;if(i.datasetIndex===1)return`范围: ${l.min} - ${l.max}`;if(i.datasetIndex===2)return`核心区间: ${l.q1} - ${l.q3}`}}},title:{display:!0,text:"班级分数结构对比 (箱线图)"}},scales:{y:{beginAtZero:!1,title:{display:!0,text:"分数"}}}}}),x.balanceChartSignature=o)}}const ye={past:[],future:[],limit:20,record:function(){if(k===-1)return;const e=v[k],n=JSON.parse(JSON.stringify(e));this.past.push(n),this.past.length>this.limit&&this.past.shift(),this.future=[],this.updateUI()},undo:function(){if(this.past.length===0)return;const e=JSON.parse(JSON.stringify(v[k]));this.future.push(e);const n=this.past.pop();v[k]=n,this.refreshView("已撤销 ↩")},redo:function(){if(this.future.length===0)return;const e=JSON.parse(JSON.stringify(v[k]));this.past.push(e);const n=this.future.pop();v[k]=n,this.refreshView("已重做 ↪")},refreshView:function(e){T(),this.updateUI(),UI.toast(e,"info")},updateUI:function(){const e=document.getElementById("btn_undo"),n=document.getElementById("btn_redo");e&&(e.disabled=this.past.length===0,e.className=this.past.length>0?"btn btn-primary":"btn btn-gray"),n&&(n.disabled=this.future.length===0,n.className=this.future.length>0?"btn btn-primary":"btn btn-gray")},reset:function(){this.past=[],this.future=[],this.updateUI()}};function He(e){ye.reset(),k=e;const n=v[e];document.getElementById("seat_class_title").innerText=n.name,document.getElementById("fb_seat_view").classList.remove("hidden"),document.getElementById("fb_seat_view").scrollIntoView({behavior:"smooth"}),updateConstraintWidgetsContext("fb"),n.seatLayout?T():ve(),V()}const ae=Object.create(null);function ct(e){const n=String(e||"").trim(),t=[],o=a=>{const s=String(a||"").trim();!s||t.includes(s)||t.push(s)};if(o(n),window.location&&window.location.protocol==="file:"&&n.startsWith("./assets/")){const a=n.replace(/^\.\//,"");o(`./public/${a}`),o(`./dist/${a}`)}return t}function je(e){return String(e||"").replace(/<\/script/gi,"<\\/script")}async function Ue(e,n){if(ae[e])return ae[e];const t=Array.from(document.querySelectorAll(`script[data-standalone-lib="${e}"]`));for(const s of t){const r=String(s.textContent||"").trim();if(!s.src&&r)return ae[e]=r,r}const o=[];t.forEach(s=>{const r=String(s.getAttribute("src")||s.src||"").trim();r&&!o.includes(r)&&o.push(r)}),ct(n).forEach(s=>{o.includes(s)||o.push(s)});let a=null;for(const s of o)try{const r=await fetch(s,{cache:"force-cache"});if(!r.ok)throw new Error(`HTTP ${r.status}`);const i=await r.text();if(!i.trim())throw new Error("EMPTY_SOURCE");return ae[e]=i,i}catch(r){a=r instanceof Error?r:new Error(String(r))}throw a||new Error(`${e} source unavailable`)}async function dt(){const[e,n]=await Promise.all([Ue("crypto-js","./assets/vendor/crypto-js/crypto-js.min.js"),Ue("chart.js","./assets/vendor/chart.js/chart.umd.min.js")]);return{cryptoJsSource:je(e),chartJsSource:je(n)}}async function ft(){if(typeof CryptoJS!="undefined")return CryptoJS;if(typeof window.ensureCryptoJsVendorLoaded=="function")return window.ensureCryptoJsVendorLoaded();if(await new Promise((e,n)=>{const t=document.createElement("script");t.src="./assets/vendor/crypto-js/crypto-js.min.js",t.onload=e,t.onerror=()=>n(new Error("crypto-js load failed")),document.head.appendChild(t)}),typeof CryptoJS=="undefined")throw new Error("CryptoJS runtime unavailable");return CryptoJS}async function mt(){const e=document.getElementById("studentSchoolSelect").value;if(!e||e.includes("请选择"))return window.UI.alert("请先选择一个学校，系统将生成该校的查分包。");if(typeof CryptoJS=="undefined")try{await ft()}catch(g){return console.error("[InquiryPackage] crypto-js load failed:",g),window.UI.alert("❌ 导出失败：加密库未加载完成，请刷新页面后重试。")}const n=typeof window.getAppSchoolRecord=="function"?window.getAppSchoolRecord(e):SCHOOLS[e],t=(n==null?void 0:n.students)||[];if(!t||t.length===0)return window.UI.alert("该学校无数据");const o=Object.keys(SCHOOLS).length<=1,a={};SUBJECTS.forEach(g=>{const b=RAW_DATA.map(y=>y.scores[g]).filter(y=>typeof y=="number");if(b.length>0){const S=b.reduce((_,I)=>_+I,0)/b.length,E=b.reduce((_,I)=>_+Math.pow(I-S,2),0)/b.length;a[g]={avg:S,sd:Math.sqrt(E)}}else a[g]={avg:0,sd:1}});const s={};t.forEach(g=>{const b=(g.class+"_"+g.name).replace(/\s+/g,""),y={},S={labels:[],data:[]},E={labels:[],data:[]},_=typeof hasStudentClassRankScope=="function"?hasStudentClassRankScope(g):!0,I=typeof isCountyDirectStudentForRank=="function"?!isCountyDirectStudentForRank(g):!0;SUBJECTS.forEach(d=>{if(g.scores[d]!==void 0){y[d]=[g.scores[d],safeGet(g,`ranks.${d}.school`,"-"),I?safeGet(g,`ranks.${d}.township`,"-"):"-"];const B=RAW_DATA.map(W=>W.scores[d]).filter(W=>W!==void 0).sort((W,ut)=>ut-W),A=B.indexOf(g.scores[d])+1,C=B.length,N=((1-A/C)*100).toFixed(1);S.labels.push(d),S.data.push(N);const oe=a[d];let Ze=0;oe&&oe.sd>0&&(Ze=(g.scores[d]-oe.avg)/oe.sd),E.labels.push(d),E.data.push(parseFloat(Ze.toFixed(2)))}});const D=typeof generateStudentComment=="function"?generateStudentComment(g):"";s[b]={cls:g.class,name:g.name,s:y,t:g.total,tr:I?safeGet(g,"ranks.total.township","-"):"-",sr:safeGet(g,"ranks.total.school","-"),cr:_?safeGet(g,"ranks.total.class","-"):"-",showClassRank:_,showTownRank:I,rd:S,vd:E,cm:D}});const r=window.UI&&typeof window.UI.prompt=="function"?await window.UI.prompt("请设置一个访问密码。家长查询时需要同时输入此密码、准确班级和准确姓名。","",{title:"安全查分包访问密码",input:"password",confirmText:"生成查分包",inputAttributes:{autocomplete:"new-password",minlength:8},inputValidator:g=>{const b=String(g||"").trim();return b.length<8?"访问密码至少 8 位":!/[A-Za-z]/.test(b)||!/\d/.test(b)?"访问密码需同时包含字母和数字":null}}):window.prompt("请设置一个访问密码。至少 8 位，并同时包含字母和数字。","");if(r===null)return;if(!r)return window.UI.alert("❌ 必须设置密码才能生成安全查分包！");if(String(r).trim().length<8||!/[A-Za-z]/.test(r)||!/\d/.test(r))return window.UI.alert("❌ 访问密码至少 8 位，并需同时包含字母和数字。");const i=JSON.stringify(s),l=CryptoJS.AES.encrypt(i,r).toString();let c=null;try{c=await dt()}catch(g){return console.error("[InquiryPackage] standalone libs unavailable:",g),window.UI.alert("❌ 导出失败：查分包依赖未准备好，请刷新页面后重试。")}const u=JSON.stringify(l).replace(/</g,"\\u003c"),p=ke().name||"期中考试",f=new Date().toLocaleDateString(),h=`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${e} - 成绩查询</title>
<script>${c.cryptoJsSource}<\/script>
<script>${c.chartJsSource}<\/script>
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f2f5; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 420px; margin: 0 auto; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h2 { text-align: center; color: #2563eb; margin-bottom: 5px; font-size: 20px; }
    .sub-title { text-align: center; color: #666; font-size: 12px; margin-bottom: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
    input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; transition:0.3s; }
    input:focus { border-color: #2563eb; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    button { width: 100%; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    button:active { transform: scale(0.98); }

    .password-section { background: #fffbeb; padding: 10px; border-radius: 8px; border: 1px solid #fcd34d; margin-bottom: 15px; }
    .password-section label { color: #b45309; }

    /* 结果卡片样式 */
    .result-box { margin-top: 20px; display: none; animation: fadeIn 0.3s; }
    .score-card { background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 15px; }
    .head-section { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 20px; text-align: center; }
    .total-val { font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 5px; }
    .total-lbl { font-size: 12px; opacity: 0.9; }
    .stu-info-bar { background: rgba(0,0,0,0.1); padding: 4px 10px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
    .rank-bar { display: flex; background: #eff6ff; border-bottom: 1px solid #dbeafe; padding: 10px 0; }
    .rank-item { flex: 1; text-align: center; border-right: 1px solid #dbeafe; }
    .rank-item:last-child { border-right: none; }
    .rank-val { font-weight: bold; color: #1e40af; font-size: 15px; }
    .rank-lbl { font-size: 10px; color: #64748b; }
    .sub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 15px; background: #f8fafc; }
    .sub-item { background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .sub-main { display: flex; flex-direction: column; }
    .sub-name { font-size: 13px; color: #64748b; font-weight: bold; }
    .sub-val { font-size: 18px; font-weight: 800; color: #333; margin-top: 2px; }
    .sub-ranks { text-align: right; font-size: 11px; color: #94a3b8; display: flex; flex-direction: column; gap: 2px; }
    .tag-rank { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #ccc; }

    .chart-box { background:white; border-radius:10px; padding:15px; margin-bottom:15px; border:1px solid #e2e8f0; position:relative; min-height:220px; }
    .chart-title { font-size:13px; font-weight:bold; color:#475569; margin-bottom:10px; border-left:4px solid #2563eb; padding-left:8px; }
    .comment-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:15px; margin-bottom:15px; position:relative; }
    .comment-title { font-weight:bold; color:#166534; font-size:14px; margin-bottom:8px; display:flex; align-items:center; gap:5px; }
    .comment-text { font-size:13px; color:#333; line-height:1.6; white-space: pre-wrap; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
</head>
<body>
<div class="container">
    <h2>${e} 成绩查询</h2>
    <div class="sub-title">${p} | 发布日期: ${f}</div>

    <div class="password-section">
        <label>🔐 访问密码 (由老师提供)</label>
        <input type="password" id="inpPass" placeholder="请输入查看密码">
    </div>

    <!-- 👇👇👇 🟢 恢复：班级输入框 (必填) 🟢 👇👇👇 -->
    <div class="form-group">
        <label>班级</label>
        <input type="text" id="inpClass" placeholder="请输入班级 (如: 701)">
    </div>

    <div class="form-group">
        <label>学生姓名</label>
        <input type="text" id="inpName" placeholder="请输入姓名 (如: 张三)">
    </div>

    <button onclick="doSearch()">🔓 解密并查询</button>

    <div id="resultArea" class="result-box"></div>
</div>
<div class="footer">AES 256位端对端加密<br>仅限查询本人成绩</div>

<script>
    const PAYLOAD = ${u};
    const IS_SINGLE_SCHOOL = ${o};

    let radarInst = null;
    let varInst = null;
    const notify = (message) => window.alert(message);

    function doSearch() {
        const pass = document.getElementById('inpPass').value.trim();
        const cls = document.getElementById('inpClass').value.trim();
        const name = document.getElementById('inpName').value.trim();
        const resBox = document.getElementById('resultArea');

        if(!pass) return notify("❌ 请输入访问密码");
        if(!cls) return notify("❌ 请输入班级");
        if(!name) return notify("❌ 请输入学生姓名");

        let allData = null;

        // 1. 解密数据
        try {
            if (typeof CryptoJS === 'undefined') return notify("⚠️ 加载中，请稍后重试...");
            const bytes = CryptoJS.AES.decrypt(PAYLOAD, pass);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (!originalText) throw new Error("密码错误");
            allData = JSON.parse(originalText);
        } catch(e) {
            return notify("⛔ 访问拒绝：密码错误！");
        }

        // 2. 精确查找 (班级 + 姓名 必须完全匹配)
        // 构造 Key：将用户输入的班级和姓名拼接，并去除空格 (例如 "701_张三")
        const key = (cls + "_" + name).replace(/\\s+/g, "");
        const res = allData[key];

        // 3. 渲染结果
        resBox.innerHTML = '';

        if(!res) {
            notify("❌ 未找到学生信息！\\n请检查【班级】和【姓名】是否输入正确。\\n(班级如：701)");
        } else {
            let subHtml = '';
            for(let sub in res.s) {
                const item = res.s[sub];
                let rankHtml = '<span class="tag-rank">校: ' + item[1] + '</span>';
                if (!IS_SINGLE_SCHOOL && res.showTownRank) rankHtml += '<span class="tag-rank">镇: ' + item[2] + '</span>';
                subHtml +=
                    '<div class="sub-item">' +
                        '<div class="sub-main"><div class="sub-name">' + sub + '</div><div class="sub-val">' + item[0] + '</div></div>' +
                        '<div class="sub-ranks">' + rankHtml + '</div>' +
                    '</div>';
            }

            let totalRankHtml =
                '<div class="rank-item"><div class="rank-val">' + res.sr + '</div><div class="rank-lbl">校排</div></div>';
            if (res.showClassRank) totalRankHtml = '<div class="rank-item"><div class="rank-val">' + res.cr + '</div><div class="rank-lbl">班排</div></div>' + totalRankHtml;
            if (!IS_SINGLE_SCHOOL && res.showTownRank) totalRankHtml += '<div class="rank-item"><div class="rank-val">' + res.tr + '</div><div class="rank-lbl">镇排</div></div>';

            // 注意：Canvas 需要固定高度
            const chartsHtml = \`
                <div class="comment-box">
                    <div class="comment-title">👩‍🏫 班主任评语</div>
                    <div class="comment-text">\${res.cm || '暂无评语'}</div>
                </div>

                <div class="chart-box">
                    <div class="chart-title">📊 学科能力分布 (雷达图)</div>
                    <div style="height:200px; position:relative;">
                        <canvas id="mobRadarChart"></canvas>
                    </div>
                </div>

                <div class="chart-box">
                    <div class="chart-title">⚖️ 学科均衡度诊断</div>
                    <div style="height:200px; position:relative;">
                        <canvas id="mobVarChart"></canvas>
                    </div>
                    <div style="font-size:10px; color:#999; text-align:center; margin-top:5px;">
                        注: 柱子朝上为优势科目，朝下为弱势科目
                    </div>
                </div>
            \`;

            resBox.innerHTML =
                '<div class="score-card">' +
                    '<div class="head-section">' +
                        '<div class="stu-info-bar">' + res.cls + '班 · ' + res.name + '</div>' +
                        '<div class="total-val">' + res.t + '</div>' +
                        '<div class="total-lbl">总分</div>' +
                    '</div>' +
                    '<div class="rank-bar">' + totalRankHtml + '</div>' +
                    '<div class="sub-grid">' + subHtml + '</div>' +
                '</div>' +
                '<div style="text-align:center; color:green; font-size:12px; margin-top:10px;">✅ 查询成功</div>';

            resBox.style.display = 'block';

            setTimeout(() => {
                // 1. 绘制雷达图
                if (radarInst) radarInst.destroy();
                const ctxRadar = document.getElementById('mobRadarChart');
                if (ctxRadar && res.rd) {
                    radarInst = new Chart(ctxRadar, {
                        type: 'radar',
                        data: {
                            labels: res.rd.labels,
                            datasets: [{
                                label: '能力值',
                                data: res.rd.data,
                                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                                borderColor: '#2563eb',
                                pointBackgroundColor: '#2563eb'
                            }]
                        },
                        options: {
                            maintainAspectRatio: false,
                            scales: { r: { min: 0, max: 100, ticks: { display: false }, pointLabels: { font: { size: 10 } } } },
                            plugins: { legend: { display: false } }
                        }
                    });
                }

                // 2. 绘制均衡度柱状图
                if (varInst) varInst.destroy();
                const ctxVar = document.getElementById('mobVarChart');
                if (ctxVar && res.vd) {
                    const colors = res.vd.data.map(v => v >= 0 ? '#16a34a' : '#dc2626');
                    varInst = new Chart(ctxVar, {
                        type: 'bar',
                        data: {
                            labels: res.vd.labels,
                            datasets: [{
                                label: '相对差异',
                                data: res.vd.data,
                                backgroundColor: colors,
                                borderRadius: 3
                            }]
                        },
                        options: {
                            maintainAspectRatio: false,
                            indexAxis: 'y', // 横向柱状图更适合手机查看长标签
                            scales: {
                                x: { grid: { display: true }, title: {display:true, text:'← 弱势 | 强势 →'} },
                                y: { grid: { display: false } }
                            },
                            plugins: { legend: { display: false } }
                        }
                    });
                }
            }, 100);

        }
    }
<\/script>
</body>
</html>`,w=new Blob([h],{type:"text/html;charset=utf-8"}),m=document.createElement("a");m.href=URL.createObjectURL(w),m.download=`${e}_查分包_${new Date().getTime()}.html`,document.body.appendChild(m),m.click(),document.body.removeChild(m),window.UI.alert(`✅ 加密查分包已生成！
文件名：`+m.download+`
访问密码：`+r+`

请将文件发给家长，告知密码。
家长必须输入正确的 [班级] 和 [姓名] 才能查询。`)}function we(e){return e?e.replace(/，/g,",").replace(/；/g,";").split(/[,;]/).map(n=>n.trim()).filter(n=>n):[]}function De(e){return e?e.replace(/，/g,",").split(",").map(n=>{const t=n.split("&").map(o=>o.trim());return t.length===2?t:null}).filter(n=>n):[]}function ve(){ye.record();const e=v[k];let n=e.seatLayout||[];n.length<e.students.length&&(n=[...e.students]);let t={},o=[];n.forEach((d,B)=>{d&&d.locked?t[B]=d:d&&o.push(d)});const a=we(document.getElementById("fb_c_diff").value),s=we(document.getElementById("fb_c_vision").value),r=we(document.getElementById("fb_c_talk").value),i=De(document.getElementById("fb_c_conflict").value),l=De(document.getElementById("fb_c_bind").value),c=new Map;l.forEach(d=>{c.set(d[0],d[1]),c.set(d[1],d[0])}),o.forEach(d=>{d._isDiff=!1,d._isVision=!1,(a.includes(d.name)||r.includes(d.name))&&(d._isDiff=!0),s.includes(d.name)&&(d._isVision=!0),d._bindPartner=c.get(d.name)});const u=document.getElementById("rule_s_height").checked,p=document.getElementById("rule_s_vision").checked,f=document.getElementById("rule_s_gender").checked,h=document.getElementById("rule_s_diff").checked;u&&o.sort((d,B)=>d.height-B.height);let w=[],m=new Set,g=[];o.forEach(d=>{if(d._bindPartner&&!m.has(d.name)){const B=o.find(A=>A.name===d._bindPartner);if(B){m.add(d.name),m.add(B.name);const A=[d,B].sort((C,N)=>C.height-N.height);w.push(A)}else g.push(d)}else m.has(d.name)||g.push(d)});let b=[],y=[],S=[];if(g.forEach(d=>{s.length>0&&d._isVision?y.push(d):S.push(d)}),w.forEach(d=>{const B=d.some(A=>A._isVision);if(s.length>0&&B)y.push(d[0],d[1]);else{const A=(d[0].height+d[1].height)/2;let C=!1;for(let N=0;N<S.length;N++)if(S[N].height>A){S.splice(N,0,d[0],d[1]),C=!0;break}C||S.push(d[0],d[1])}}),o=[...y,...S],s.length>0||p){const d=o.filter(A=>A._isVision||p&&A.vision<4.8),B=o.filter(A=>!A._isVision&&!(p&&A.vision<4.8));o=[...d,...B]}const E=o.filter(d=>d._isDiff||h&&d.isDiff);if(E.length>0){const d=o.filter(C=>!C._isDiff&&!(h&&C.isDiff)),B=Math.floor(d.length/(E.length+1));let A=B;E.forEach(C=>{A<d.length?d.splice(A,0,C):d.push(C),A+=B+1}),o=d}if(f){for(let d=0;d<o.length-1;d+=2)if(o[d].gender===o[d+1].gender){for(let B=d+2;B<o.length;B++)if(o[B].gender!==o[d].gender){[o[d+1],o[B]]=[o[B],o[d+1]];break}}}let _=[],I=0;const D=Math.max(e.students.length,n.length);for(let d=0;d<D;d++)t[d]?_[d]=t[d]:I<o.length?_[d]=o[I++]:_[d]=null;e.seatLayout=_,T()}function T(){const e=v[k],n=document.getElementById("seat_map_container");n.innerHTML="";const t=parseInt(document.getElementById("seat_opt_groups").value),o=parseInt(document.getElementById("seat_opt_cols").value);n.style.display="grid",n.style.gridTemplateColumns=`repeat(${t}, 1fr)`,n.style.gap="50px",n.style.alignItems="start",n.style.padding="20px";const a=e.seatLayout||e.students,s=t*o,r=Math.ceil(a.length/s),i=[];for(let l=0;l<t;l++){const c=document.createElement("div");c.className="seat-group",c.style.display="grid",c.style.gridTemplateColumns=`repeat(${o}, 1fr)`,c.style.gap="10px",c.style.position="relative",i.push(c),n.appendChild(c)}for(let l=0;l<r;l++)for(let c=0;c<t;c++)for(let u=0;u<o;u++){const p=l*s+c*o+u,f=a[p],h=document.createElement("div");h.className="desk",f?(f.gender==="M"&&h.classList.add("is-male"),f.gender==="F"&&h.classList.add("is-female"),(f.isDiff||f._isDiff)&&h.classList.add("is-diff"),f.locked&&h.classList.add("locked"),h.draggable=!f.locked,h.dataset.idx=p,h.innerHTML=`<div class="desk-name">${f.name}</div><div class="desk-info"><span>${f.height}cm</span><span>${f.score}</span></div><div class="desk-popover">视力:${f.vision} | 备注:${f.remarks}</div>`,h.oncontextmenu=w=>{w.preventDefault(),xe(p)},f.locked||(h.ondragstart=w=>{w.dataTransfer.setData("text/plain",p),h.classList.add("dragging")},h.ondragend=()=>h.classList.remove("dragging"),h.ondragover=w=>{w.preventDefault(),h.classList.add("drag-over")},h.ondragleave=()=>h.classList.remove("drag-over"),h.ondrop=w=>{w.preventDefault();const m=parseInt(w.dataTransfer.getData("text/plain")),g=p;m!==g&&!a[g].locked&&!a[m].locked&&ye.record(),!a[g].locked&&!a[m].locked&&([e.seatLayout[m],e.seatLayout[g]]=[e.seatLayout[g],e.seatLayout[m]],T())})):h.style.visibility="hidden",i[c].appendChild(h)}for(let l=0;l<t;l++){const c=i[l];if(o%2===0)for(let u=0;u<r;u+=2)for(let p=0;p<o;p+=2){const f=document.createElement("div");f.className="learning-group-box",f.style.left=`${p*90-5}px`,f.style.top=`${u*65-5}px`,f.style.width="175px",f.style.height="125px";const h=o/2,w=l*(Math.ceil(r/2)*h)+u/2*h+p/2+1;f.innerHTML=`<div class="learning-group-label">小组 ${w}</div>`,c.appendChild(f)}}}function xe(e){const t=v[k].seatLayout[e];t&&(t.locked=!t.locked,T())}function Re(){const e=document.querySelector(".seat-canvas");e&&e.classList.toggle("view-rotated")}function Oe(){if(!v.length)return window.UI.alert("暂无数据");localStorage.setItem("FB_DATA_BACKUP",JSON.stringify(v)),window.UI.alert("方案已保存至浏览器缓存")}function Pe(){if(!v.length)return window.UI.alert("无数据");const e=XLSX.utils.book_new(),n=[["班级","座位号","姓名","性别","总分","身高","视力","备注"]];v.forEach(t=>{(t.seatLayout||t.students).forEach((a,s)=>{n.push([t.name,s+1,a.name,a.gender,a.score,a.height,a.vision,a.remarks])})}),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(n),"分班与座位表"),XLSX.writeFile(e,"新生分班结果.xlsx")}function Xe(e){const n="fb_bind_sel_a",t="fb_bind_sel_b",o="widget_fb_bind",a="fb_c_bind",s=document.getElementById(n),r=document.getElementById(t);if(!(!s||!r)){if(!s.value||!r.value)return window.UI.alert("请先选择两个学生");if(s.value===r.value)return window.UI.alert("不能选择同一个学生");addTagToWidget(o,a,`${s.value}&${r.value}`),s.value="",r.value=""}}function V(){const e=v[k],n=document.getElementById("seat_scenario_select");if(n){if(n.innerHTML='<option value="">-- 选择方案 --</option>',!e){n.disabled=!0;return}n.disabled=!1,e.scenarios||(e.scenarios={}),Object.keys(e.scenarios).forEach(t=>{n.innerHTML+=`<option value="${t}">${t}</option>`})}}async function Ge(){const e=v[k];if(!e)return window.UI.alert("请先打开一个班级座位图");if(!e.seatLayout||e.seatLayout.length===0)return window.UI.alert("当前座位表为空，无法保存");const n=await window.UI.prompt("请输入方案名称 (如：期中考试、日常、互助组)",`方案 ${Object.keys(e.scenarios||{}).length+1}`,{title:"保存座位方案",confirmText:"保存"});n&&(e.scenarios||(e.scenarios={}),e.scenarios[n]=JSON.parse(JSON.stringify(e.seatLayout)),window.UI.alert(`方案 [${n}] 保存成功！`),V(),document.getElementById("seat_scenario_select").value=n)}async function ze(){const e=document.getElementById("seat_scenario_select");if(!e)return;const n=e.value;if(!n)return;const t=v[k];if(!t)return window.UI.alert("请先打开一个班级座位图");if(t.scenarios&&t.scenarios[n]){if(!await window.UI.confirm(`确定要加载 [${n}] 方案吗？
当前未保存的修改将丢失。`)){e.value="";return}t.seatLayout=JSON.parse(JSON.stringify(t.scenarios[n])),T()}}async function Je(){const e=document.getElementById("seat_scenario_select");if(!e)return;const n=e.value;if(!n)return window.UI.alert("请先选择一个要删除的方案");if(await window.UI.confirm(`确定要永久删除方案 [${n}] 吗？`)){const t=v[k];if(!t)return window.UI.alert("请先打开一个班级座位图");delete t.scenarios[n],V()}}function qe(e){const n=e.files[0];if(!n)return;const t=new FileReader;t.onload=function(o){try{const a=new Uint8Array(o.target.result),s=XLSX.read(a,{type:"array"}),r=XLSX.utils.sheet_to_json(s.Sheets[s.SheetNames[0]]);if(!r.length)throw new Error("Excel没有数据");$=r.map(i=>({name:i.姓名||"未知",class:i.班级||i.班||"未知",school:i.学校||"",score:parseFloat(i.总分||i.score||0)})),window.UI.alert(`✅ 已导入 ${$.length} 名学生，准备进行考场编排。`)}catch(a){window.UI.alert("读取失败："+a.message)}},t.readAsArrayBuffer(n)}function Ve(){if(!$.length)return window.UI.alert("请先导入学生名单");const e=document.getElementById("exam_prefix").value,n=parseInt(document.getElementById("exam_seats_per_room").value)||30,t=document.getElementById("exam_opt_separate").checked,o=document.getElementById("exam_opt_snake").checked;let a=[...$].sort((r,i)=>i.score-r.score);if(t){let r=0;for(let i=1;i<a.length-1;i++)if(a[i].class===a[i-1].class){let l=!1;for(let c=i+1;c<Math.min(i+15,a.length);c++)if(a[c].class!==a[i].class&&a[c].class!==a[i-1].class){[a[i],a[c]]=[a[c],a[i]],l=!0,r++;break}}r>0&&UI.toast(`已智能微调 ${r} 人次以打散同班同学`,"success")}L=[];const s=4;a.forEach((r,i)=>{r.examNo=e+String(i+1).padStart(3,"0"),r.roomNo=Math.floor(i/n)+1;let l=i%n;if(o){const c=Math.floor(l/s);if(c%2!==0){const u=l%s,p=s-1-u;l=c*s+p}}r.seatNo=l+1,L[r.roomNo-1]||(L[r.roomNo-1]={id:r.roomNo,students:[]}),L[r.roomNo-1].students.push(r)}),o&&L.forEach(r=>r.students.sort((i,l)=>i.seatNo-l.seatNo)),document.getElementById("exam-results-area").classList.remove("hidden"),Se(),Ee(),Be(),Ie()}function _e(e,n){const t=Array.from(document.querySelectorAll("#exam-results-area .nav-link"));t.forEach(s=>s.classList.remove("active"));const o=n||t.find(s=>{const r=s.getAttribute("onclick")||"";return r.includes(`'${e}'`)||r.includes(`"${e}"`)});o&&o.classList.add("active"),document.getElementById("exam-view-overview").classList.add("hidden"),document.getElementById("exam-view-students").classList.add("hidden"),document.getElementById("exam-view-proctor").classList.add("hidden");const a=document.getElementById("exam-view-"+e);a&&a.classList.remove("hidden")}function Se(){const e=document.getElementById("exam_room_grid");if(!e)return;const n=Q();if(x.examOverviewSignature===n){e.innerHTML!==x.examOverviewHtml&&(e.innerHTML=x.examOverviewHtml);return}const t=L.map(o=>{const a=o.students[0].examNo,s=o.students[o.students.length-1].examNo;return`<div class="exam-room-card analysis-exam-room-card" onclick="window.UI.alert('提示：请使用“打印桌贴”功能查看该考场的详细座次表')"><div class="exam-room-title analysis-exam-room-title">第 ${String(o.id).padStart(2,"0")} 考场</div><div class="exam-room-info analysis-exam-room-info"><span>人数: ${o.students.length}</span></div><div class="exam-room-range analysis-exam-room-range">${a} - ${s}</div></div>`}).join("");x.examOverviewSignature=n,x.examOverviewHtml=t,e.innerHTML!==t&&(e.innerHTML=t)}function Ee(){const e=document.querySelector("#exam_student_table tbody");if(!e)return;const n=Q();if(x.examStudentListSignature===n){e.innerHTML!==x.examStudentListHtml&&(e.innerHTML=x.examStudentListHtml);return}let t="";const o=[...$].sort((a,s)=>a.class!==s.class?String(a.class).localeCompare(String(s.class),void 0,{numeric:!0}):a.examNo.localeCompare(s.examNo));o.slice(0,500).forEach(a=>{t+=`<tr><td>${a.examNo}</td><td>${a.name}</td><td>${a.class}</td><td>${String(a.roomNo).padStart(2,"0")}</td><td>${String(a.seatNo).padStart(2,"0")}</td><td>${a.score}</td></tr>`}),o.length>500&&(t+='<tr><td colspan="6" style="text-align:center">...更多数据请导出Excel查看...</td></tr>'),x.examStudentListSignature=n,x.examStudentListHtml=t,e.innerHTML!==t&&(e.innerHTML=t)}function Be(){const e=document.querySelector("#exam_proctor_table tbody");if(!e)return;const n=Q();if(x.examProctorSignature===n){e.innerHTML!==x.examProctorHtml&&(e.innerHTML=x.examProctorHtml);return}let t="";L.forEach(o=>{const a=o.students[0].examNo,s=o.students[o.students.length-1].examNo;t+=`<tr><td>第 ${String(o.id).padStart(2,"0")} 考场</td><td>${o.students.length}</td><td>${a} - ${s}</td><td></td><td></td></tr>`}),x.examProctorSignature=n,x.examProctorHtml=t,e.innerHTML!==t&&(e.innerHTML=t)}function Ie(){const e=document.getElementById("batch-print-area-wrapper")||document.getElementById("batch-print-container");if(!e)return;const n=Q();if(x.examPrintSignature===n){e.innerHTML!==x.examPrintHtml&&(e.innerHTML=x.examPrintHtml);return}let t="";L.forEach(o=>{let a="";o.students.forEach(s=>{a+=`<div class="exam-print-seat"><div class="exam-print-seat-num">第${String(s.seatNo).padStart(2,"0")}号</div><div class="exam-print-seat-name">${s.name}</div><div class="exam-print-seat-id">考号: ${s.examNo}</div><div style="font-size:10px;">${s.class}</div></div>`}),t+=`<div class="exam-print-page"><div class="exam-print-header">第 ${String(o.id).padStart(2,"0")} 考场座位表 (共${o.students.length}人)</div><div class="exam-print-grid">${a}</div><div style="margin-top:20px; font-size:12px;">监考员签字：_________________   &nbsp;&nbsp;&nbsp; 巡考员签字：_________________</div></div>`}),x.examPrintSignature=n,x.examPrintHtml=t,e.innerHTML!==t&&(e.innerHTML=t)}function We(){if(!L||L.length===0)return window.UI.alert("请先点击“一键生成考场安排”");const e=document.getElementById("desk-labels-print-area");e.innerHTML="";let n="";L.forEach(s=>{n+='<div class="desk-label-page">',s.students.forEach(r=>{n+=`
                    <div class="desk-label-card">
                        <!-- 1. 顶部：考号 (最大) -->
                        <div class="dl-exam-no">${r.examNo}</div>

                        <!-- 2. 中间：班级(左) + 姓名(右) (中等) -->
                        <div class="dl-main-row">
                            <span>${r.class}</span>
                            <span>${r.name}</span>
                        </div>

                        <!-- 3. 底部：考场 + 座号 (最小) -->
                        <div class="dl-footer-row">
                            <span class="dl-room-box">${String(s.id).padStart(2,"0")}场</span>
                            <span class="dl-seat-box">${String(r.seatNo).padStart(2,"0")}座</span>
                        </div>
                    </div>
                `}),n+="</div>"}),e.innerHTML=n,UI.toast("✅ 桌贴生成完毕 (考号最大化)","success");const t=document.getElementById("app"),o=document.getElementById("desk-labels-print-area"),a=t.style.display;t.style.display="none",o.style.display="block",setTimeout(()=>{window.print(),t.style.display=a,o.style.display="none",e.innerHTML=""},500)}function Ke(){const e=[...new Set(Object.values(TEACHER_MAP||{}).map(i=>String(i||"").trim()).filter(Boolean))].sort((i,l)=>i.localeCompare(l,"zh-CN")),n=document.getElementById("proctor-teacher-pool"),t=document.getElementById("proctor-role-patrol"),o=document.getElementById("proctor-role-affairs");if(!n||!t||!o)return;const a=Array.from(document.querySelectorAll(".exclude-check:checked")).map(i=>i.value),s=Array.from(t.selectedOptions).map(i=>i.value),r=Array.from(o.selectedOptions).map(i=>i.value);if(!e.length){n.innerHTML='<div style="padding:8px 0; color:#94a3b8;">暂无任课教师数据，请先导入任课表。</div>',t.disabled=!0,o.disabled=!0,t.innerHTML="",o.innerHTML="";return}n.innerHTML=e.map(i=>`
            <label class="teacher-item">
                <input type="checkbox" class="exclude-check" value="${i}" ${a.includes(i)?"checked":""}> ${i}
            </label>
        `).join(""),t.disabled=!1,o.disabled=!1,setMultiSelectOptions(t,e,s),setMultiSelectOptions(o,e,r)}function Qe(){if(!L.length)return window.UI.alert("请先生成考场安排");const e=[...new Set(Object.values(TEACHER_MAP||{}).map(f=>String(f||"").trim()).filter(Boolean))];if(!e.length)return window.UI.alert("请先导入任课表，当前没有可用于监考分配的教师。");const n=document.getElementById("proctor-role-patrol"),t=document.getElementById("proctor-role-affairs");if(!n||!t)return window.UI.alert("监考配置面板未就绪，请刷新页面后重试。");const o=Array.from(document.querySelectorAll(".exclude-check:checked")).map(f=>f.value),a=[...new Set(Array.from(n.selectedOptions).map(f=>f.value))],s=[...new Set(Array.from(t.selectedOptions).map(f=>f.value))],r=s.filter(f=>a.includes(f)),i=s.filter(f=>!a.includes(f));r.length&&(Array.from(t.options).forEach(f=>{f.selected=i.includes(f.value)}),window.UI&&UI.toast(`已自动去重特殊岗位：${r.join("、")}`,"warning"));let l=e.filter(f=>!o.includes(f)&&!a.includes(f)&&!i.includes(f));const c=L.length*2;if(l.length<c)return window.UI.alert(`❌ 人员不足！
当前考场需要 ${c} 名监考，但排除后仅剩 ${l.length} 人。
请减少排除项或合并岗位。`);l.sort(()=>Math.random()-.5);const u=document.querySelector("#exam_proctor_table tbody");let p="";L.forEach((f,h)=>{const w=l[h*2],m=l[h*2+1],g=f.students[0].examNo,b=f.students[f.students.length-1].examNo;p+=`
                <tr>
                    <td><strong>第 ${String(f.id).padStart(2,"0")} 考场</strong></td>
                    <td>${f.students.length}</td>
                    <td>${g} - ${b}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${w}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${m}</td>
                </tr>
            `}),p+=`
            <tr style="background:#f8fafc; border-top: 2px solid #333;">
                <td colspan="3" style="text-align:right; font-weight:bold;">⚖️ 纪律巡考人员：</td>
                <td colspan="2" style="text-align:left; color:var(--danger); font-weight:bold;">${a.join("、")||"未指定"}</td>
            </tr>
            <tr style="background:#f8fafc;">
                <td colspan="3" style="text-align:right; font-weight:bold;">🧹 卫生考务保障：</td>
                <td colspan="2" style="text-align:left; color:var(--success); font-weight:bold;">${i.join("、")||"未指定"}</td>
            </tr>
        `,u.innerHTML=p,UI.toast("✅ 监考人员分配完成，请查看“监考汇总表”","success"),_e("proctor",document.querySelector('.nav-link[onclick*="proctor"]'))}function Ye(){if(!$.length)return window.UI.alert("无考生数据");if(!L.length)return window.UI.alert("请先生成考场安排");const e=XLSX.utils.book_new(),n=[["考号","姓名","学校","班级","考场号","座号","参考分"]];$.forEach(s=>n.push([s.examNo,s.name,s.school,s.class,s.roomNo,s.seatNo,s.score]));const t=[["单位/考场","应考人数","起止考号","监考老师 A","监考老师 B"]],o=document.querySelectorAll("#exam_proctor_table tbody tr");o.length===0?window.UI.alert("⚠️ 提示：您尚未进行“人员配置”或点击“一键编排”。监考表将只包含考生信息。"):o.forEach(s=>{const r=s.querySelectorAll("td"),i=[];r.forEach(l=>i.push(l.innerText)),t.push(i)});const a=[["考场","座号","姓名","考号","班级"]];$.forEach(s=>a.push([s.roomNo,s.seatNo,s.name,s.examNo,s.class])),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(n),"考生座次总表"),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(t),"全校监考考务表"),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(a),"桌贴打印备份"),XLSX.writeFile(e,`${ke().name||"学校"}考务编排结果全集.xlsx`)}window.FreshmanExamRuntime={syncFbClasses:et,writeFbClasses:Le,get students(){return M},get classes(){return v},get simulatedData(){return se},get examData(){return $},get examRooms(){return L}},typeof Fe=="function"&&(window.FB_loadData=Fe),typeof Ce=="function"&&(window.FB_loadGenderList=Ce),typeof $e=="function"&&(window.FB_loadViolationList=$e),typeof de=="function"&&(window.FB_assembleFromCloud=de),typeof te=="function"&&(window.FB_updateAssemblyStatus=te),typeof ee=="function"&&(window.FB_toggleDataSource=ee),typeof Ne=="function"&&(window.FB_runDivision=Ne),typeof me=="function"&&(window.FB_generateSingleScheme=me),typeof pe=="function"&&(window.FB_renderSchemeSelector=pe),typeof ge=="function"&&(window.FB_applyScheme=ge),typeof G=="function"&&(window.FB_calcClassCost=G),typeof ne=="function"&&(window.FB_checkConflict=ne),typeof be=="function"&&(window.FB_renderDashboard=be),typeof he=="function"&&(window.FB_renderAssemblyBanner=he),typeof q=="function"&&(window.FB_renderBalanceChart=q),typeof He=="function"&&(window.FB_openSeatMap=He),typeof ve=="function"&&(window.FB_autoSeatAlgo=ve),typeof T=="function"&&(window.FB_renderSeatMap=T),typeof xe=="function"&&(window.FB_toggleLock=xe),typeof Re=="function"&&(window.FB_toggleViewRotation=Re),typeof Oe=="function"&&(window.FB_saveToLocal=Oe),typeof Pe=="function"&&(window.FB_exportResult=Pe),typeof Xe=="function"&&(window.addBindPair=Xe),typeof V=="function"&&(window.FB_initScenarioSelect=V),typeof Ge=="function"&&(window.FB_saveScenario=Ge),typeof ze=="function"&&(window.FB_loadScenario=ze),typeof Je=="function"&&(window.FB_deleteScenario=Je),typeof qe=="function"&&(window.EXAM_loadData=qe),typeof Ve=="function"&&(window.EXAM_generate=Ve),typeof _e=="function"&&(window.EXAM_switchView=_e),typeof Se=="function"&&(window.EXAM_renderOverview=Se),typeof Ee=="function"&&(window.EXAM_renderStudentList=Ee),typeof Be=="function"&&(window.EXAM_renderProctorTable=Be),typeof Ie=="function"&&(window.EXAM_renderPrintView=Ie),typeof We=="function"&&(window.EXAM_generateDeskLabels=We),typeof Ke=="function"&&(window.EXAM_initProctorUI=Ke),typeof Qe=="function"&&(window.EXAM_assignProctors=Qe),typeof Ye=="function"&&(window.EXAM_exportResult=Ye),typeof fe=="function"&&(window.FB_bindDeclarativeHandlers=fe);try{fe(document)}catch(e){}window.__FRESHMAN_EXAM_RUNTIME_PATCHED__=!0})();
