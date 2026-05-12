(()=>{if(typeof window=="undefined"||window.__FRESHMAN_EXAM_RUNTIME_PATCHED__)return;let H=[],h=typeof window.readFbClassesState=="function"?window.readFbClassesState():Array.isArray(window.FB_CLASSES)?window.FB_CLASSES:[],E=-1,J={},M=[],S=[],$=[],q=null;const C={schemeSelectorSignature:"",schemeSelectorHtml:"",dashboardSignature:"",dashboardHtml:"",balanceSignature:"",balanceTableHtml:""};function z(e=h){return(Array.isArray(e)?e:[]).map(t=>[t==null?void 0:t.id,t==null?void 0:t.name,Array.isArray(t==null?void 0:t.students)?t.students.length:0,Array.isArray(t==null?void 0:t.students)?t.students.map(n=>`${n.name}:${n.score}:${n.gender}:${n.isDiff||n._isDiff?1:0}`).join(","):""].join(":")).join("|")}function le(e=[]){const t=Array.isArray(e)?e:[],n=t.length;let a=0,s=0,i=0;return t.forEach(r=>{a+=Number(r==null?void 0:r.score)||0,(r==null?void 0:r.gender)==="M"&&(s+=1),(r!=null&&r.isDiff||r!=null&&r._isDiff)&&(i+=1)}),{avg:n?a/n:0,male:s,female:n-s,diff:i,count:n}}function Me(){const e=typeof window.readFbClassesState=="function"?window.readFbClassesState():Array.isArray(window.FB_CLASSES)?window.FB_CLASSES:[];return Array.isArray(e)&&(h=e),window.FB_CLASSES=h,h}function de(e){const t=typeof window.setFbClassesState=="function"?window.setFbClassesState(e):Array.isArray(e)?e:[];return h=Array.isArray(t)?t:[],window.FB_CLASSES=h,h}function ce(){return window.CONFIG||{name:"学校"}}function fe(e){const t=e.files[0];if(!t)return;const n=new FileReader;n.onload=function(a){try{const s=new Uint8Array(a.target.result),i=XLSX.read(s,{type:"array"}),r=XLSX.utils.sheet_to_json(i.Sheets[i.SheetNames[0]]);if(!r.length)throw new Error("Excel没有数据");H=r.map((o,d)=>{const c=String(o.备注||o.说明||""),m=c.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:同班|一起|一班)/),g=c.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:分开|不同班|不在一起)/);return{_id:d,name:o.姓名||"未知",gender:o.性别==="男"||o.Gender==="M"?"M":"F",score:parseFloat(o.总分||o.语数英||0),height:parseFloat(o.身高||160),vision:parseFloat(o.视力||o.左眼||5),isDiff:String(o.难管||"").includes("是")||c.includes("难管")||c.includes("调皮"),remarks:c,constraints:{same:m?[m[1]]:[],diff:g?[g[1]]:[]},classIdx:-1}}),alert(`✅ 导入成功！共 ${H.length} 人。`),document.getElementById("fb-results-area").classList.add("hidden")}catch(s){alert("读取失败："+s.message)}},n.readAsArrayBuffer(t)}function $e(e){const t=U(e),n=Math.floor(e.length/2),a=e.slice(0,n),s=e.slice(e.length%2===0?n:n+1),i=U(a),r=U(s);return{q1:i,q2:t,q3:r}}function U(e){const t=Math.floor(e.length/2);return e.length%2!==0?e[t]:(e[t-1]+e[t])/2}function ue(e){const t=e.length;if(t===0)return 0;const n=e.reduce((s,i)=>s+i,0)/t,a=e.reduce((s,i)=>s+Math.pow(i-n,2),0)/t;return Math.sqrt(a)}function pe(){if(!H.length)return alert("请先导入数据");const e=parseInt(document.getElementById("fb_cls_num").value)||6,t=document.getElementById("fb_algorithm").value,n=document.querySelector('button[onclick="FB_runDivision()"]');n.innerHTML="⏳ 正在运算多套方案...",n.disabled=!0,setTimeout(()=>{$=[];const a=t==="snake"?1:3;for(let r=0;r<a;r++){const o=V(e,t),d=o.map(g=>g.stats.avg),c=Math.max(...d)-Math.min(...d),m=ue(d);$.push({id:r,name:a===1?"标准方案":`方案 ${String.fromCharCode(65+r)}`,data:o,range:c,sd:m,desc:`均分极差 ${c.toFixed(2)}`})}n.innerHTML="🚀 开始智能分班",n.disabled=!1,G();const s=[...$].sort((r,o)=>r.range-o.range)[0];W(s.id),document.getElementById("fb-results-area").classList.remove("hidden");const i=document.getElementById("fb-scheme-panel");a>1?i&&i.classList.remove("hidden"):i&&i.classList.add("hidden")},100)}function V(e,t){let n=Array.from({length:e},(s,i)=>({id:i,name:i+1+"班",students:[],stats:{}})),a=JSON.parse(JSON.stringify(H));if(a.sort((s,i)=>i.score-s.score),t==="snake")a.forEach((s,i)=>{const o=Math.floor(i/e)%2===0?i%e:e-1-i%e;n[o].students.push(s),s.classIdx=o});else{a.forEach((r,o)=>{const d=Math.floor(o/e)%2===0?o%e:e-1-o%e;n[d].students.push(r),r.classIdx=d});const s=8e3,i=a.reduce((r,o)=>r+o.score,0)/a.length;for(let r=0;r<s;r++){const o=Math.floor(Math.random()*e),d=Math.floor(Math.random()*e);if(o===d)continue;const c=n[o],m=n[d];if(!c.students.length||!m.students.length)continue;const g=Math.floor(Math.random()*c.students.length),f=Math.floor(Math.random()*m.students.length),u=c.students[g],y=m.students[f],b=N(c,i)+N(m,i);c.students[g]=y,y.classIdx=o,m.students[f]=u,u.classIdx=d;const p=N(c,i)+N(m,i);let w=!1;(X(u,m.students)||X(y,c.students))&&(w=!0),(w||p>b)&&(c.students[g]=u,u.classIdx=o,m.students[f]=y,y.classIdx=d)}}return n.forEach(s=>{s.stats=le(s.students)}),n}function G(){const e=document.getElementById("fb-scheme-cards");if(!e)return;const t=$.length?Math.min(...$.map(s=>s.range)):1/0,n=$.map(s=>`${s.id}:${s.range.toFixed(3)}:${s.sd.toFixed(3)}:${z(s.data)}`).join("|");if(C.schemeSelectorSignature===n){e.dataset.freshmanSchemeSig!==n&&(e.innerHTML=C.schemeSelectorHtml,e.dataset.freshmanSchemeSig=n);return}const a=$.map(s=>{const i=s.range<=t,r=i?"border:2px solid #16a34a; background:#fff;":"border:1px solid #ddd; background:#fff;",o=s.data.map(c=>c.stats.male),d=Math.max(...o)-Math.min(...o);return`
                <div data-scheme-id="${s.id}" onclick="FB_applyScheme(${s.id})" style="cursor:pointer; padding:10px; border-radius:6px; ${r} transition:0.2s;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='#fff'">
                    <div style="font-weight:bold; color:#333; display:flex; justify-content:space-between;">
                        <span>${s.name}</span>
                        ${i?'<span style="color:red; font-size:10px;">★ 推荐</span>':""}
                    </div>
                    <div style="font-size:12px; color:#666; margin-top:5px;">
                        <div>均分极差: <strong>${s.range.toFixed(2)}</strong></div>
                        <div>男女极差: ${d} 人</div>
                    </div>
                </div>
            `}).join("");C.schemeSelectorSignature=n,C.schemeSelectorHtml=a,e.innerHTML=a,e.dataset.freshmanSchemeSig=n}function W(e){const t=$.find(a=>a.id===e);if(!t)return;de(t.data),J={},h.forEach(a=>J[a.name]=a.students),Q();const n=document.getElementById("fb-scheme-cards");if(n){const a=n.children;Array.from(a).forEach(s=>{String(s.dataset.schemeId)===String(t.id)?(s.style.borderColor="#16a34a",s.style.boxShadow="0 0 0 3px rgba(22, 163, 74, 0.2)"):(s.style.borderColor="#ddd",s.style.boxShadow="none")})}}function N(e,t){const n=e.students.length;if(n===0)return 1e4;const a=e.students.reduce((o,d)=>o+d.score,0)/n,s=e.students.filter(o=>o.gender==="M").length,i=e.students.filter(o=>o.isDiff||o._isDiff).length;let r=Math.pow(a-t,2)*100;return r+=Math.pow(s/n-.5,2)*5e3,document.getElementById("fb_rule_diff").value==="spread"&&(r+=Math.pow(i,2)*500),r}function X(e,t){if(!e.constraints)return!1;for(let n of e.constraints.diff)if(t.find(a=>a.name===n))return!0;return!1}function Q(){document.getElementById("fb-results-area").classList.remove("hidden");const e=document.getElementById("fb_class_container"),t=z(h);if((e==null?void 0:e.dataset.freshmanDashboardSig)===t&&C.dashboardSignature===t){O();return}let n=[],a=0,s=0,i=0;const r=h.map(y=>{const b=le(y.students),p=b.count,w=b.avg,B=b.male,_=b.diff;return n.push(w),a+=B,s+=b.female,i+=_,y.stats=b,`<div class="fb-class-box ${_>3?"fb-warn-bg":""}" onclick="FB_openSeatMap(${y.id})"><div class="fb-c-head"><span style="font-weight:bold; font-size:16px;">${y.name}</span><span class="fb-tag fb-tag-red" style="${_>0?"":"display:none"}">难管: ${_}</span></div><div class="fb-c-body"><div>人数: <strong>${p}</strong></div><div>均分: <strong>${w.toFixed(1)}</strong></div><div>男生: ${B}</div><div>女生: ${b.female}</div><div style="grid-column:span 2; font-size:11px; color:#999; margin-top:5px;">点击进入座位编排 →</div></div></div>`}).join("");e&&e.innerHTML!==r&&(e.innerHTML=r,e.dataset.freshmanDashboardSig=t),C.dashboardSignature=t,C.dashboardHtml=r;const o=n.length?Math.max(...n)-Math.min(...n):0,d=document.getElementById("fb_res_total"),c=document.getElementById("fb_res_male"),m=document.getElementById("fb_res_female"),g=document.getElementById("fb_res_diff"),f=document.getElementById("fb_res_diff_cnt");d&&(d.innerText=H.length),c&&(c.innerText=a),m&&(m.innerText=s),g&&(g.innerText=o.toFixed(2)),f&&(f.innerText=i);const u=document.getElementById("fb_res_eval");u&&(o<=1?u.innerHTML='<span style="color:green;font-weight:bold;">✅ 完美均衡</span>':o<=3?u.innerHTML='<span style="color:#d97706;font-weight:bold;">⚠️ 基本均衡</span>':u.innerHTML='<span style="color:red;font-weight:bold;">❌ 差异过大</span>'),O()}function O(){const e=document.getElementById("balanceChart"),t=document.getElementById("balanceTableContainer"),n=h.map(o=>o.name),a=z(h);if(C.balanceSignature===a&&(t==null?void 0:t.dataset.freshmanBalanceSig)===a)return;const s=h.map(o=>{const d=o.students.map(m=>m.score).sort((m,g)=>m-g),c=$e(d);return{min:d[0],max:d[d.length-1],q1:c.q1,median:c.q2,q3:c.q3,avg:o.stats.avg,sd:ue(d)}});q&&q.destroy(),q=new Chart(e,{type:"bar",data:{labels:n,datasets:[{label:"平均分",data:s.map(o=>o.avg),type:"scatter",backgroundColor:"#2563eb",borderColor:"#2563eb",pointStyle:"rectRot",pointRadius:6},{label:"分数区间 (Min-Max)",data:s.map(o=>[o.min,o.max]),backgroundColor:"rgba(156, 163, 175, 0.2)",borderColor:"rgba(156, 163, 175, 0.5)",borderWidth:1,barPercentage:.1},{label:"核心分布 (Q1-Q3)",data:s.map(o=>[o.q1,o.q3]),backgroundColor:"rgba(37, 99, 235, 0.5)",borderColor:"#1e40af",borderWidth:1,barPercentage:.6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{tooltip:{callbacks:{label:function(o){const d=s[o.dataIndex];if(o.dataset.type==="scatter")return`平均分: ${d.avg.toFixed(2)}`;if(o.datasetIndex===1)return`范围: ${d.min} - ${d.max}`;if(o.datasetIndex===2)return`核心区间: ${d.q1} - ${d.q3}`}}},title:{display:!0,text:"班级分数结构对比 (箱线图)"}},scales:{y:{beginAtZero:!1,title:{display:!0,text:"分数"}}}}});let i='<table class="comparison-table" style="font-size:12px;"><thead><tr><th>班级</th><th>人数</th><th>平均分</th><th>标准差 (SD)</th><th>极差 (Max-Min)</th><th>前25%线 (Q3)</th><th>后25%线 (Q1)</th></tr></thead><tbody>';s.forEach((o,d)=>{i+=`<tr><td>${n[d]}</td><td>${h[d].students.length}</td><td>${o.avg.toFixed(2)}</td><td>${o.sd.toFixed(2)}</td><td>${(o.max-o.min).toFixed(1)}</td><td>${o.q3}</td><td>${o.q1}</td></tr>`});const r=i+"</tbody></table>";t&&t.innerHTML!==r&&(t.innerHTML=r,t.dataset.freshmanBalanceSig=a),C.balanceSignature=a,C.balanceTableHtml=r}const Y={past:[],future:[],limit:20,record:function(){if(E===-1)return;const e=h[E],t=JSON.parse(JSON.stringify(e));this.past.push(t),this.past.length>this.limit&&this.past.shift(),this.future=[],this.updateUI()},undo:function(){if(this.past.length===0)return;const e=JSON.parse(JSON.stringify(h[E]));this.future.push(e);const t=this.past.pop();h[E]=t,this.refreshView("已撤销 ↩")},redo:function(){if(this.future.length===0)return;const e=JSON.parse(JSON.stringify(h[E]));this.past.push(e);const t=this.future.pop();h[E]=t,this.refreshView("已重做 ↪")},refreshView:function(e){F(),this.updateUI(),UI.toast(e,"info")},updateUI:function(){const e=document.getElementById("btn_undo"),t=document.getElementById("btn_redo");e&&(e.disabled=this.past.length===0,e.className=this.past.length>0?"btn btn-primary":"btn btn-gray"),t&&(t.disabled=this.future.length===0,t.className=this.future.length>0?"btn btn-primary":"btn btn-gray")},reset:function(){this.past=[],this.future=[],this.updateUI()}};function me(e){Y.reset(),E=e;const t=h[e];document.getElementById("seat_class_title").innerText=t.name,document.getElementById("fb_seat_view").classList.remove("hidden"),document.getElementById("fb_seat_view").scrollIntoView({behavior:"smooth"}),updateConstraintWidgetsContext("fb"),t.seatLayout?F():ee(),D()}const P=Object.create(null);function Fe(e){const t=String(e||"").trim(),n=[],a=s=>{const i=String(s||"").trim();!i||n.includes(i)||n.push(i)};if(a(t),window.location&&window.location.protocol==="file:"&&t.startsWith("./assets/")){const s=t.replace(/^\.\//,"");a(`./public/${s}`),a(`./dist/${s}`)}return n}function ge(e){return String(e||"").replace(/<\/script/gi,"<\\/script")}async function K(e,t){if(P[e])return P[e];const n=Array.from(document.querySelectorAll(`script[data-standalone-lib="${e}"]`));for(const i of n){const r=String(i.textContent||"").trim();if(!i.src&&r)return P[e]=r,r}const a=[];n.forEach(i=>{const r=String(i.getAttribute("src")||i.src||"").trim();r&&!a.includes(r)&&a.push(r)}),Fe(t).forEach(i=>{a.includes(i)||a.push(i)});let s=null;for(const i of a)try{const r=await fetch(i,{cache:"force-cache"});if(!r.ok)throw new Error(`HTTP ${r.status}`);const o=await r.text();if(!o.trim())throw new Error("EMPTY_SOURCE");return P[e]=o,o}catch(r){s=r instanceof Error?r:new Error(String(r))}throw s||new Error(`${e} source unavailable`)}async function Te(){const[e,t]=await Promise.all([K("crypto-js","./assets/vendor/crypto-js/crypto-js.min.js"),K("chart.js","./assets/vendor/chart.js/chart.umd.min.js")]);return{cryptoJsSource:ge(e),chartJsSource:ge(t)}}async function He(){if(typeof CryptoJS!="undefined")return CryptoJS;if(typeof window.ensureCryptoJsVendorLoaded=="function")return window.ensureCryptoJsVendorLoaded();const e=await K("crypto-js","./assets/vendor/crypto-js/crypto-js.min.js");if(window.eval(e),typeof CryptoJS=="undefined")throw new Error("CryptoJS runtime unavailable");return CryptoJS}async function De(){const e=document.getElementById("studentSchoolSelect").value;if(!e||e.includes("请选择"))return alert("请先选择一个学校，系统将生成该校的查分包。");if(typeof CryptoJS=="undefined")try{await He()}catch(p){return console.error("[InquiryPackage] crypto-js load failed:",p),alert("❌ 导出失败：加密库未加载完成，请刷新页面后重试。")}const t=typeof window.getAppSchoolRecord=="function"?window.getAppSchoolRecord(e):SCHOOLS[e],n=(t==null?void 0:t.students)||[];if(!n||n.length===0)return alert("该学校无数据");const a=Object.keys(SCHOOLS).length<=1,s={};SUBJECTS.forEach(p=>{const w=RAW_DATA.map(B=>B.scores[p]).filter(B=>typeof B=="number");if(w.length>0){const _=w.reduce((I,L)=>I+L,0)/w.length,A=w.reduce((I,L)=>I+Math.pow(L-_,2),0)/w.length;s[p]={avg:_,sd:Math.sqrt(A)}}else s[p]={avg:0,sd:1}});const i={};n.forEach(p=>{const w=(p.class+"_"+p.name).replace(/\s+/g,""),B={},_={labels:[],data:[]},A={labels:[],data:[]},I=typeof hasStudentClassRankScope=="function"?hasStudentClassRankScope(p):!0,L=typeof isCountyDirectStudentForRank=="function"?!isCountyDirectStudentForRank(p):!0;SUBJECTS.forEach(l=>{if(p.scores[l]!==void 0){B[l]=[p.scores[l],safeGet(p,`ranks.${l}.school`,"-"),L?safeGet(p,`ranks.${l}.township`,"-"):"-"];const v=RAW_DATA.map(R=>R.scores[l]).filter(R=>R!==void 0).sort((R,Ne)=>Ne-R),x=v.indexOf(p.scores[l])+1,k=v.length,T=((1-x/k)*100).toFixed(1);_.labels.push(l),_.data.push(T);const j=s[l];let Le=0;j&&j.sd>0&&(Le=(p.scores[l]-j.avg)/j.sd),A.labels.push(l),A.data.push(parseFloat(Le.toFixed(2)))}});const ie=typeof generateStudentComment=="function"?generateStudentComment(p):"";i[w]={cls:p.class,name:p.name,s:B,t:p.total,tr:L?safeGet(p,"ranks.total.township","-"):"-",sr:safeGet(p,"ranks.total.school","-"),cr:I?safeGet(p,"ranks.total.class","-"):"-",showClassRank:I,showTownRank:L,rd:_,vd:A,cm:ie}});const r=prompt(`🔐 安全设置

请设置一个“访问密码” (例如: 123456)。

家长查询时要求：
1. 输入此密码
2. 输入准确的班级
3. 输入准确的姓名`,"123456");if(r===null)return;if(!r)return alert("❌ 必须设置密码才能生成安全查分包！");const o=JSON.stringify(i),d=CryptoJS.AES.encrypt(o,r).toString();let c=null;try{c=await Te()}catch(p){return console.error("[InquiryPackage] standalone libs unavailable:",p),alert("❌ 导出失败：查分包依赖未准备好，请刷新页面后重试。")}const m=JSON.stringify(d).replace(/</g,"\\u003c"),g=ce().name||"期中考试",f=new Date().toLocaleDateString(),u=`
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
    <div class="sub-title">${g} | 发布日期: ${f}</div>

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
    const PAYLOAD = ${m};
    const IS_SINGLE_SCHOOL = ${a};

    let radarInst = null;
    let varInst = null;

    function doSearch() {
        const pass = document.getElementById('inpPass').value.trim();
        const cls = document.getElementById('inpClass').value.trim();
        const name = document.getElementById('inpName').value.trim();
        const resBox = document.getElementById('resultArea');

        if(!pass) return alert("❌ 请输入访问密码");
        if(!cls) return alert("❌ 请输入班级");
        if(!name) return alert("❌ 请输入学生姓名");

        let allData = null;

        // 1. 解密数据
        try {
            if (typeof CryptoJS === 'undefined') return alert("⚠️ 加载中，请稍后重试...");
            const bytes = CryptoJS.AES.decrypt(PAYLOAD, pass);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (!originalText) throw new Error("密码错误");
            allData = JSON.parse(originalText);
        } catch(e) {
            return alert("⛔ 访问拒绝：密码错误！");
        }

        // 2. 精确查找 (班级 + 姓名 必须完全匹配)
        // 构造 Key：将用户输入的班级和姓名拼接，并去除空格 (例如 "701_张三")
        const key = (cls + "_" + name).replace(/\\s+/g, "");
        const res = allData[key];

        // 3. 渲染结果
        resBox.innerHTML = '';

        if(!res) {
            alert("❌ 未找到学生信息！\\n请检查【班级】和【姓名】是否输入正确。\\n(班级如：701)");
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
</html>`,y=new Blob([u],{type:"text/html;charset=utf-8"}),b=document.createElement("a");b.href=URL.createObjectURL(y),b.download=`${e}_查分包_${new Date().getTime()}.html`,document.body.appendChild(b),b.click(),document.body.removeChild(b),alert(`✅ 加密查分包已生成！
文件名：`+b.download+`
访问密码：`+r+`

请将文件发给家长，告知密码。
家长必须输入正确的 [班级] 和 [姓名] 才能查询。`)}function Z(e){return e?e.replace(/，/g,",").replace(/；/g,";").split(/[,;]/).map(t=>t.trim()).filter(t=>t):[]}function he(e){return e?e.replace(/，/g,",").split(",").map(t=>{const n=t.split("&").map(a=>a.trim());return n.length===2?n:null}).filter(t=>t):[]}function ee(){Y.record();const e=h[E];let t=e.seatLayout||[];t.length<e.students.length&&(t=[...e.students]);let n={},a=[];t.forEach((l,v)=>{l&&l.locked?n[v]=l:l&&a.push(l)});const s=Z(document.getElementById("fb_c_diff").value),i=Z(document.getElementById("fb_c_vision").value),r=Z(document.getElementById("fb_c_talk").value),o=he(document.getElementById("fb_c_conflict").value),d=he(document.getElementById("fb_c_bind").value),c=new Map;d.forEach(l=>{c.set(l[0],l[1]),c.set(l[1],l[0])}),a.forEach(l=>{l._isDiff=!1,l._isVision=!1,(s.includes(l.name)||r.includes(l.name))&&(l._isDiff=!0),i.includes(l.name)&&(l._isVision=!0),l._bindPartner=c.get(l.name)});const m=document.getElementById("rule_s_height").checked,g=document.getElementById("rule_s_vision").checked,f=document.getElementById("rule_s_gender").checked,u=document.getElementById("rule_s_diff").checked;m&&a.sort((l,v)=>l.height-v.height);let y=[],b=new Set,p=[];a.forEach(l=>{if(l._bindPartner&&!b.has(l.name)){const v=a.find(x=>x.name===l._bindPartner);if(v){b.add(l.name),b.add(v.name);const x=[l,v].sort((k,T)=>k.height-T.height);y.push(x)}else p.push(l)}else b.has(l.name)||p.push(l)});let w=[],B=[],_=[];if(p.forEach(l=>{i.length>0&&l._isVision?B.push(l):_.push(l)}),y.forEach(l=>{const v=l.some(x=>x._isVision);if(i.length>0&&v)B.push(l[0],l[1]);else{const x=(l[0].height+l[1].height)/2;let k=!1;for(let T=0;T<_.length;T++)if(_[T].height>x){_.splice(T,0,l[0],l[1]),k=!0;break}k||_.push(l[0],l[1])}}),a=[...B,..._],i.length>0||g){const l=a.filter(x=>x._isVision||g&&x.vision<4.8),v=a.filter(x=>!x._isVision&&!(g&&x.vision<4.8));a=[...l,...v]}const A=a.filter(l=>l._isDiff||u&&l.isDiff);if(A.length>0){const l=a.filter(k=>!k._isDiff&&!(u&&k.isDiff)),v=Math.floor(l.length/(A.length+1));let x=v;A.forEach(k=>{x<l.length?l.splice(x,0,k):l.push(k),x+=v+1}),a=l}if(f){for(let l=0;l<a.length-1;l+=2)if(a[l].gender===a[l+1].gender){for(let v=l+2;v<a.length;v++)if(a[v].gender!==a[l].gender){[a[l+1],a[v]]=[a[v],a[l+1]];break}}}let I=[],L=0;const ie=Math.max(e.students.length,t.length);for(let l=0;l<ie;l++)n[l]?I[l]=n[l]:L<a.length?I[l]=a[L++]:I[l]=null;e.seatLayout=I,F()}function F(){const e=h[E],t=document.getElementById("seat_map_container");t.innerHTML="";const n=parseInt(document.getElementById("seat_opt_groups").value),a=parseInt(document.getElementById("seat_opt_cols").value);t.style.display="grid",t.style.gridTemplateColumns=`repeat(${n}, 1fr)`,t.style.gap="50px",t.style.alignItems="start",t.style.padding="20px";const s=e.seatLayout||e.students,i=n*a,r=Math.ceil(s.length/i),o=[];for(let d=0;d<n;d++){const c=document.createElement("div");c.className="seat-group",c.style.display="grid",c.style.gridTemplateColumns=`repeat(${a}, 1fr)`,c.style.gap="10px",c.style.position="relative",o.push(c),t.appendChild(c)}for(let d=0;d<r;d++)for(let c=0;c<n;c++)for(let m=0;m<a;m++){const g=d*i+c*a+m,f=s[g],u=document.createElement("div");u.className="desk",f?(f.gender==="M"&&u.classList.add("is-male"),f.gender==="F"&&u.classList.add("is-female"),(f.isDiff||f._isDiff)&&u.classList.add("is-diff"),f.locked&&u.classList.add("locked"),u.draggable=!f.locked,u.dataset.idx=g,u.innerHTML=`<div class="desk-name">${f.name}</div><div class="desk-info"><span>${f.height}cm</span><span>${f.score}</span></div><div class="desk-popover">视力:${f.vision} | 备注:${f.remarks}</div>`,u.oncontextmenu=y=>{y.preventDefault(),te(g)},f.locked||(u.ondragstart=y=>{y.dataTransfer.setData("text/plain",g),u.classList.add("dragging")},u.ondragend=()=>u.classList.remove("dragging"),u.ondragover=y=>{y.preventDefault(),u.classList.add("drag-over")},u.ondragleave=()=>u.classList.remove("drag-over"),u.ondrop=y=>{y.preventDefault();const b=parseInt(y.dataTransfer.getData("text/plain")),p=g;b!==p&&!s[p].locked&&!s[b].locked&&Y.record(),!s[p].locked&&!s[b].locked&&([e.seatLayout[b],e.seatLayout[p]]=[e.seatLayout[p],e.seatLayout[b]],F())})):u.style.visibility="hidden",o[c].appendChild(u)}for(let d=0;d<n;d++){const c=o[d];if(a%2===0)for(let m=0;m<r;m+=2)for(let g=0;g<a;g+=2){const f=document.createElement("div");f.className="learning-group-box",f.style.left=`${g*90-5}px`,f.style.top=`${m*65-5}px`,f.style.width="175px",f.style.height="125px";const u=a/2,y=d*(Math.ceil(r/2)*u)+m/2*u+g/2+1;f.innerHTML=`<div class="learning-group-label">小组 ${y}</div>`,c.appendChild(f)}}}function te(e){const n=h[E].seatLayout[e];n&&(n.locked=!n.locked,F())}function be(){const e=document.querySelector(".seat-canvas");e&&e.classList.toggle("view-rotated")}function ye(){if(!h.length)return alert("暂无数据");localStorage.setItem("FB_DATA_BACKUP",JSON.stringify(h)),alert("方案已保存至浏览器缓存")}function ve(){if(!h.length)return alert("无数据");const e=XLSX.utils.book_new(),t=[["班级","座位号","姓名","性别","总分","身高","视力","备注"]];h.forEach(n=>{(n.seatLayout||n.students).forEach((s,i)=>{t.push([n.name,i+1,s.name,s.gender,s.score,s.height,s.vision,s.remarks])})}),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(t),"分班与座位表"),XLSX.writeFile(e,"新生分班结果.xlsx")}function xe(e){const t="fb_bind_sel_a",n="fb_bind_sel_b",a="widget_fb_bind",s="fb_c_bind",i=document.getElementById(t),r=document.getElementById(n);if(!(!i||!r)){if(!i.value||!r.value)return alert("请先选择两个学生");if(i.value===r.value)return alert("不能选择同一个学生");addTagToWidget(a,s,`${i.value}&${r.value}`),i.value="",r.value=""}}function D(){const e=h[E],t=document.getElementById("seat_scenario_select");if(t){if(t.innerHTML='<option value="">-- 选择方案 --</option>',!e){t.disabled=!0;return}t.disabled=!1,e.scenarios||(e.scenarios={}),Object.keys(e.scenarios).forEach(n=>{t.innerHTML+=`<option value="${n}">${n}</option>`})}}function _e(){const e=h[E];if(!e)return alert("请先打开一个班级座位图");if(!e.seatLayout||e.seatLayout.length===0)return alert("当前座位表为空，无法保存");const t=prompt("请输入方案名称 (如：期中考试、日常、互助组)",`方案 ${Object.keys(e.scenarios||{}).length+1}`);t&&(e.scenarios||(e.scenarios={}),e.scenarios[t]=JSON.parse(JSON.stringify(e.seatLayout)),alert(`方案 [${t}] 保存成功！`),D(),document.getElementById("seat_scenario_select").value=t)}function Se(){const e=document.getElementById("seat_scenario_select");if(!e)return;const t=e.value;if(!t)return;const n=h[E];if(!n)return alert("请先打开一个班级座位图");if(n.scenarios&&n.scenarios[t]){if(!confirm(`确定要加载 [${t}] 方案吗？
当前未保存的修改将丢失。`)){e.value="";return}n.seatLayout=JSON.parse(JSON.stringify(n.scenarios[t])),F()}}function we(){const e=document.getElementById("seat_scenario_select");if(!e)return;const t=e.value;if(!t)return alert("请先选择一个要删除的方案");if(confirm(`确定要永久删除方案 [${t}] 吗？`)){const n=h[E];if(!n)return alert("请先打开一个班级座位图");delete n.scenarios[t],D()}}function Ee(e){const t=e.files[0];if(!t)return;const n=new FileReader;n.onload=function(a){try{const s=new Uint8Array(a.target.result),i=XLSX.read(s,{type:"array"}),r=XLSX.utils.sheet_to_json(i.Sheets[i.SheetNames[0]]);if(!r.length)throw new Error("Excel没有数据");M=r.map(o=>({name:o.姓名||"未知",class:o.班级||o.班||"未知",school:o.学校||"",score:parseFloat(o.总分||o.score||0)})),alert(`✅ 已导入 ${M.length} 名学生，准备进行考场编排。`)}catch(s){alert("读取失败："+s.message)}},n.readAsArrayBuffer(t)}function Be(){if(!M.length)return alert("请先导入学生名单");const e=document.getElementById("exam_prefix").value,t=parseInt(document.getElementById("exam_seats_per_room").value)||30,n=document.getElementById("exam_opt_separate").checked,a=document.getElementById("exam_opt_snake").checked;let s=[...M].sort((r,o)=>o.score-r.score);if(n){let r=0;for(let o=1;o<s.length-1;o++)if(s[o].class===s[o-1].class){let d=!1;for(let c=o+1;c<Math.min(o+15,s.length);c++)if(s[c].class!==s[o].class&&s[c].class!==s[o-1].class){[s[o],s[c]]=[s[c],s[o]],d=!0,r++;break}}r>0&&UI.toast(`已智能微调 ${r} 人次以打散同班同学`,"success")}S=[];const i=4;s.forEach((r,o)=>{r.examNo=e+String(o+1).padStart(3,"0"),r.roomNo=Math.floor(o/t)+1;let d=o%t;if(a){const c=Math.floor(d/i);if(c%2!==0){const m=d%i,g=i-1-m;d=c*i+g}}r.seatNo=d+1,S[r.roomNo-1]||(S[r.roomNo-1]={id:r.roomNo,students:[]}),S[r.roomNo-1].students.push(r)}),a&&S.forEach(r=>r.students.sort((o,d)=>o.seatNo-d.seatNo)),document.getElementById("exam-results-area").classList.remove("hidden"),ae(),se(),oe(),re()}function ne(e,t){const n=Array.from(document.querySelectorAll("#exam-results-area .nav-link"));n.forEach(i=>i.classList.remove("active"));const a=t||n.find(i=>{const r=i.getAttribute("onclick")||"";return r.includes(`'${e}'`)||r.includes(`"${e}"`)});a&&a.classList.add("active"),document.getElementById("exam-view-overview").classList.add("hidden"),document.getElementById("exam-view-students").classList.add("hidden"),document.getElementById("exam-view-proctor").classList.add("hidden");const s=document.getElementById("exam-view-"+e);s&&s.classList.remove("hidden")}function ae(){const e=document.getElementById("exam_room_grid");e.innerHTML="",S.forEach(t=>{const n=t.students[0].examNo,a=t.students[t.students.length-1].examNo;e.innerHTML+=`<div class="exam-room-card analysis-exam-room-card" onclick="alert('提示：请使用“打印桌贴”功能查看该考场的详细座次表')"><div class="exam-room-title analysis-exam-room-title">第 ${String(t.id).padStart(2,"0")} 考场</div><div class="exam-room-info analysis-exam-room-info"><span>人数: ${t.students.length}</span></div><div class="exam-room-range analysis-exam-room-range">${n} - ${a}</div></div>`})}function se(){const e=document.querySelector("#exam_student_table tbody");let t="";const n=[...M].sort((a,s)=>a.class!==s.class?String(a.class).localeCompare(String(s.class),void 0,{numeric:!0}):a.examNo.localeCompare(s.examNo));n.slice(0,500).forEach(a=>{t+=`<tr><td>${a.examNo}</td><td>${a.name}</td><td>${a.class}</td><td>${String(a.roomNo).padStart(2,"0")}</td><td>${String(a.seatNo).padStart(2,"0")}</td><td>${a.score}</td></tr>`}),n.length>500&&(t+='<tr><td colspan="6" style="text-align:center">...更多数据请导出Excel查看...</td></tr>'),e.innerHTML=t}function oe(){const e=document.querySelector("#exam_proctor_table tbody");let t="";S.forEach(n=>{const a=n.students[0].examNo,s=n.students[n.students.length-1].examNo;t+=`<tr><td>第 ${String(n.id).padStart(2,"0")} 考场</td><td>${n.students.length}</td><td>${a} - ${s}</td><td></td><td></td></tr>`}),e.innerHTML=t}function re(){const e=document.getElementById("batch-print-area-wrapper")||document.getElementById("batch-print-container");if(!e)return;e.innerHTML="";let t="";S.forEach(n=>{let a="";n.students.forEach(s=>{a+=`<div class="exam-print-seat"><div class="exam-print-seat-num">第${String(s.seatNo).padStart(2,"0")}号</div><div class="exam-print-seat-name">${s.name}</div><div class="exam-print-seat-id">考号: ${s.examNo}</div><div style="font-size:10px;">${s.class}</div></div>`}),t+=`<div class="exam-print-page"><div class="exam-print-header">第 ${String(n.id).padStart(2,"0")} 考场座位表 (共${n.students.length}人)</div><div class="exam-print-grid">${a}</div><div style="margin-top:20px; font-size:12px;">监考员签字：_________________   &nbsp;&nbsp;&nbsp; 巡考员签字：_________________</div></div>`}),e.innerHTML=t}function ke(){if(!S||S.length===0)return alert("请先点击“一键生成考场安排”");const e=document.getElementById("desk-labels-print-area");e.innerHTML="";let t="";S.forEach(i=>{t+='<div class="desk-label-page">',i.students.forEach(r=>{t+=`
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
                            <span class="dl-room-box">${String(i.id).padStart(2,"0")}场</span>
                            <span class="dl-seat-box">${String(r.seatNo).padStart(2,"0")}座</span>
                        </div>
                    </div>
                `}),t+="</div>"}),e.innerHTML=t,UI.toast("✅ 桌贴生成完毕 (考号最大化)","success");const n=document.getElementById("app"),a=document.getElementById("desk-labels-print-area"),s=n.style.display;n.style.display="none",a.style.display="block",setTimeout(()=>{window.print(),n.style.display=s,a.style.display="none",e.innerHTML=""},500)}function Ie(){const e=[...new Set(Object.values(TEACHER_MAP||{}).map(o=>String(o||"").trim()).filter(Boolean))].sort((o,d)=>o.localeCompare(d,"zh-CN")),t=document.getElementById("proctor-teacher-pool"),n=document.getElementById("proctor-role-patrol"),a=document.getElementById("proctor-role-affairs");if(!t||!n||!a)return;const s=Array.from(document.querySelectorAll(".exclude-check:checked")).map(o=>o.value),i=Array.from(n.selectedOptions).map(o=>o.value),r=Array.from(a.selectedOptions).map(o=>o.value);if(!e.length){t.innerHTML='<div style="padding:8px 0; color:#94a3b8;">暂无任课教师数据，请先导入任课表。</div>',n.disabled=!0,a.disabled=!0,n.innerHTML="",a.innerHTML="";return}t.innerHTML=e.map(o=>`
            <label class="teacher-item">
                <input type="checkbox" class="exclude-check" value="${o}" ${s.includes(o)?"checked":""}> ${o}
            </label>
        `).join(""),n.disabled=!1,a.disabled=!1,setMultiSelectOptions(n,e,i),setMultiSelectOptions(a,e,r)}function Ce(){if(!S.length)return alert("请先生成考场安排");const e=[...new Set(Object.values(TEACHER_MAP||{}).map(f=>String(f||"").trim()).filter(Boolean))];if(!e.length)return alert("请先导入任课表，当前没有可用于监考分配的教师。");const t=document.getElementById("proctor-role-patrol"),n=document.getElementById("proctor-role-affairs");if(!t||!n)return alert("监考配置面板未就绪，请刷新页面后重试。");const a=Array.from(document.querySelectorAll(".exclude-check:checked")).map(f=>f.value),s=[...new Set(Array.from(t.selectedOptions).map(f=>f.value))],i=[...new Set(Array.from(n.selectedOptions).map(f=>f.value))],r=i.filter(f=>s.includes(f)),o=i.filter(f=>!s.includes(f));r.length&&(Array.from(n.options).forEach(f=>{f.selected=o.includes(f.value)}),window.UI&&UI.toast(`已自动去重特殊岗位：${r.join("、")}`,"warning"));let d=e.filter(f=>!a.includes(f)&&!s.includes(f)&&!o.includes(f));const c=S.length*2;if(d.length<c)return alert(`❌ 人员不足！
当前考场需要 ${c} 名监考，但排除后仅剩 ${d.length} 人。
请减少排除项或合并岗位。`);d.sort(()=>Math.random()-.5);const m=document.querySelector("#exam_proctor_table tbody");let g="";S.forEach((f,u)=>{const y=d[u*2],b=d[u*2+1],p=f.students[0].examNo,w=f.students[f.students.length-1].examNo;g+=`
                <tr>
                    <td><strong>第 ${String(f.id).padStart(2,"0")} 考场</strong></td>
                    <td>${f.students.length}</td>
                    <td>${p} - ${w}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${y}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${b}</td>
                </tr>
            `}),g+=`
            <tr style="background:#f8fafc; border-top: 2px solid #333;">
                <td colspan="3" style="text-align:right; font-weight:bold;">⚖️ 纪律巡考人员：</td>
                <td colspan="2" style="text-align:left; color:var(--danger); font-weight:bold;">${s.join("、")||"未指定"}</td>
            </tr>
            <tr style="background:#f8fafc;">
                <td colspan="3" style="text-align:right; font-weight:bold;">🧹 卫生考务保障：</td>
                <td colspan="2" style="text-align:left; color:var(--success); font-weight:bold;">${o.join("、")||"未指定"}</td>
            </tr>
        `,m.innerHTML=g,UI.toast("✅ 监考人员分配完成，请查看“监考汇总表”","success"),ne("proctor",document.querySelector('.nav-link[onclick*="proctor"]'))}function Ae(){if(!M.length)return alert("无考生数据");if(!S.length)return alert("请先生成考场安排");const e=XLSX.utils.book_new(),t=[["考号","姓名","学校","班级","考场号","座号","参考分"]];M.forEach(i=>t.push([i.examNo,i.name,i.school,i.class,i.roomNo,i.seatNo,i.score]));const n=[["单位/考场","应考人数","起止考号","监考老师 A","监考老师 B"]],a=document.querySelectorAll("#exam_proctor_table tbody tr");a.length===0?alert("⚠️ 提示：您尚未进行“人员配置”或点击“一键编排”。监考表将只包含考生信息。"):a.forEach(i=>{const r=i.querySelectorAll("td"),o=[];r.forEach(d=>o.push(d.innerText)),n.push(o)});const s=[["考场","座号","姓名","考号","班级"]];M.forEach(i=>s.push([i.roomNo,i.seatNo,i.name,i.examNo,i.class])),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(t),"考生座次总表"),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(n),"全校监考考务表"),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(s),"桌贴打印备份"),XLSX.writeFile(e,`${ce().name||"学校"}考务编排结果全集.xlsx`)}window.FreshmanExamRuntime={syncFbClasses:Me,writeFbClasses:de,get students(){return H},get classes(){return h},get simulatedData(){return J},get examData(){return M},get examRooms(){return S}},typeof fe=="function"&&(window.FB_loadData=fe),typeof pe=="function"&&(window.FB_runDivision=pe),typeof V=="function"&&(window.FB_generateSingleScheme=V),typeof G=="function"&&(window.FB_renderSchemeSelector=G),typeof W=="function"&&(window.FB_applyScheme=W),typeof N=="function"&&(window.FB_calcClassCost=N),typeof X=="function"&&(window.FB_checkConflict=X),typeof Q=="function"&&(window.FB_renderDashboard=Q),typeof O=="function"&&(window.FB_renderBalanceChart=O),typeof me=="function"&&(window.FB_openSeatMap=me),typeof ee=="function"&&(window.FB_autoSeatAlgo=ee),typeof F=="function"&&(window.FB_renderSeatMap=F),typeof te=="function"&&(window.FB_toggleLock=te),typeof be=="function"&&(window.FB_toggleViewRotation=be),typeof ye=="function"&&(window.FB_saveToLocal=ye),typeof ve=="function"&&(window.FB_exportResult=ve),typeof xe=="function"&&(window.addBindPair=xe),typeof D=="function"&&(window.FB_initScenarioSelect=D),typeof _e=="function"&&(window.FB_saveScenario=_e),typeof Se=="function"&&(window.FB_loadScenario=Se),typeof we=="function"&&(window.FB_deleteScenario=we),typeof Ee=="function"&&(window.EXAM_loadData=Ee),typeof Be=="function"&&(window.EXAM_generate=Be),typeof ne=="function"&&(window.EXAM_switchView=ne),typeof ae=="function"&&(window.EXAM_renderOverview=ae),typeof se=="function"&&(window.EXAM_renderStudentList=se),typeof oe=="function"&&(window.EXAM_renderProctorTable=oe),typeof re=="function"&&(window.EXAM_renderPrintView=re),typeof ke=="function"&&(window.EXAM_generateDeskLabels=ke),typeof Ie=="function"&&(window.EXAM_initProctorUI=Ie),typeof Ce=="function"&&(window.EXAM_assignProctors=Ce),typeof Ae=="function"&&(window.EXAM_exportResult=Ae),window.__FRESHMAN_EXAM_RUNTIME_PATCHED__=!0})();
