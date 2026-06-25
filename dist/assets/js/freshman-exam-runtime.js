(()=>{if(typeof window=="undefined"||window.__FRESHMAN_EXAM_RUNTIME_PATCHED__)return;let F=[],h=typeof window.readFbClassesState=="function"?window.readFbClassesState():Array.isArray(window.FB_CLASSES)?window.FB_CLASSES:[],I=-1,J={},C=[],_=[],$=[],q=null;const y={schemeSelectorSignature:"",schemeSelectorHtml:"",dashboardSignature:"",dashboardHtml:"",balanceSignature:"",balanceTableHtml:"",examOverviewSignature:"",examOverviewHtml:"",examStudentListSignature:"",examStudentListHtml:"",examProctorSignature:"",examProctorHtml:"",examPrintSignature:"",examPrintHtml:""};function z(e=h){return(Array.isArray(e)?e:[]).map(t=>[t==null?void 0:t.id,t==null?void 0:t.name,Array.isArray(t==null?void 0:t.students)?t.students.length:0,Array.isArray(t==null?void 0:t.students)?t.students.map(n=>`${n.name}:${n.score}:${n.gender}:${n.isDiff||n._isDiff?1:0}`).join(","):""].join(":")).join("|")}function de(e=[]){const t=Array.isArray(e)?e:[],n=t.length;let o=0,a=0,r=0;return t.forEach(i=>{o+=Number(i==null?void 0:i.score)||0,(i==null?void 0:i.gender)==="M"&&(a+=1),(i!=null&&i.isDiff||i!=null&&i._isDiff)&&(r+=1)}),{avg:n?o/n:0,male:a,female:n-a,diff:r,count:n}}function R(){return(Array.isArray(_)?_:[]).map(e=>{const t=Array.isArray(e==null?void 0:e.students)?e.students:[];return[e==null?void 0:e.id,t.length,t.map(n=>[n==null?void 0:n.examNo,n==null?void 0:n.name,n==null?void 0:n.class,n==null?void 0:n.roomNo,n==null?void 0:n.seatNo,n==null?void 0:n.score].join(":")).join(",")].join("|")}).join("||")}function $e(){const e=typeof window.readFbClassesState=="function"?window.readFbClassesState():Array.isArray(window.FB_CLASSES)?window.FB_CLASSES:[];return Array.isArray(e)&&(h=e),window.FB_CLASSES=h,h}function ce(e){const t=typeof window.setFbClassesState=="function"?window.setFbClassesState(e):Array.isArray(e)?e:[];return h=Array.isArray(t)?t:[],window.FB_CLASSES=h,h}function fe(){return window.CONFIG||{name:"学校"}}function ue(e){const t=e.files[0];if(!t)return;const n=new FileReader;n.onload=function(o){try{const a=new Uint8Array(o.target.result),r=XLSX.read(a,{type:"array"}),i=XLSX.utils.sheet_to_json(r.Sheets[r.SheetNames[0]]);if(!i.length)throw new Error("Excel没有数据");F=i.map((s,d)=>{const c=String(s.备注||s.说明||""),m=c.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:同班|一起|一班)/),g=c.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:分开|不同班|不在一起)/);return{_id:d,name:s.姓名||"未知",gender:s.性别==="男"||s.Gender==="M"?"M":"F",score:parseFloat(s.总分||s.语数英||0),height:parseFloat(s.身高||160),vision:parseFloat(s.视力||s.左眼||5),isDiff:String(s.难管||"").includes("是")||c.includes("难管")||c.includes("调皮"),remarks:c,constraints:{same:m?[m[1]]:[],diff:g?[g[1]]:[]},classIdx:-1}}),window.UI.alert(`✅ 导入成功！共 ${F.length} 人。`),document.getElementById("fb-results-area").classList.add("hidden")}catch(a){window.UI.alert("读取失败："+a.message)}},n.readAsArrayBuffer(t)}function Te(e){const t=V(e),n=Math.floor(e.length/2),o=e.slice(0,n),a=e.slice(e.length%2===0?n:n+1),r=V(o),i=V(a);return{q1:r,q2:t,q3:i}}function V(e){const t=Math.floor(e.length/2);return e.length%2!==0?e[t]:(e[t-1]+e[t])/2}function pe(e){const t=e.length;if(t===0)return 0;const n=e.reduce((a,r)=>a+r,0)/t,o=e.reduce((a,r)=>a+Math.pow(r-n,2),0)/t;return Math.sqrt(o)}function me(){if(!F.length)return window.UI.alert("请先导入数据");const e=parseInt(document.getElementById("fb_cls_num").value)||6,t=document.getElementById("fb_algorithm").value,n=document.querySelector('button[onclick="FB_runDivision()"]');n.innerHTML="⏳ 正在运算多套方案...",n.disabled=!0,setTimeout(()=>{$=[];const o=t==="snake"?1:3;for(let i=0;i<o;i++){const s=G(e,t),d=s.map(g=>g.stats.avg),c=Math.max(...d)-Math.min(...d),m=pe(d);$.push({id:i,name:o===1?"标准方案":`方案 ${String.fromCharCode(65+i)}`,data:s,range:c,sd:m,desc:`均分极差 ${c.toFixed(2)}`})}n.innerHTML="🚀 开始智能分班",n.disabled=!1,W();const a=[...$].sort((i,s)=>i.range-s.range)[0];Q(a.id),document.getElementById("fb-results-area").classList.remove("hidden");const r=document.getElementById("fb-scheme-panel");o>1?r&&r.classList.remove("hidden"):r&&r.classList.add("hidden")},100)}function G(e,t){let n=Array.from({length:e},(a,r)=>({id:r,name:r+1+"班",students:[],stats:{}})),o=JSON.parse(JSON.stringify(F));if(o.sort((a,r)=>r.score-a.score),t==="snake")o.forEach((a,r)=>{const s=Math.floor(r/e)%2===0?r%e:e-1-r%e;n[s].students.push(a),a.classIdx=s});else{o.forEach((i,s)=>{const d=Math.floor(s/e)%2===0?s%e:e-1-s%e;n[d].students.push(i),i.classIdx=d});const a=8e3,r=o.reduce((i,s)=>i+s.score,0)/o.length;for(let i=0;i<a;i++){const s=Math.floor(Math.random()*e),d=Math.floor(Math.random()*e);if(s===d)continue;const c=n[s],m=n[d];if(!c.students.length||!m.students.length)continue;const g=Math.floor(Math.random()*c.students.length),f=Math.floor(Math.random()*m.students.length),p=c.students[g],w=m.students[f],b=N(c,r)+N(m,r);c.students[g]=w,w.classIdx=s,m.students[f]=p,p.classIdx=d;const u=N(c,r)+N(m,r);let v=!1;(P(p,m.students)||P(w,c.students))&&(v=!0),(v||u>b)&&(c.students[g]=p,p.classIdx=s,m.students[f]=w,w.classIdx=d)}}return n.forEach(a=>{a.stats=de(a.students)}),n}function W(){const e=document.getElementById("fb-scheme-cards");if(!e)return;const t=$.length?Math.min(...$.map(a=>a.range)):1/0,n=$.map(a=>`${a.id}:${a.range.toFixed(3)}:${a.sd.toFixed(3)}:${z(a.data)}`).join("|");if(y.schemeSelectorSignature===n){e.dataset.freshmanSchemeSig!==n&&(e.innerHTML=y.schemeSelectorHtml,e.dataset.freshmanSchemeSig=n);return}const o=$.map(a=>{const r=a.range<=t,i=r?"border:2px solid #16a34a; background:#fff;":"border:1px solid #ddd; background:#fff;",s=a.data.map(c=>c.stats.male),d=Math.max(...s)-Math.min(...s);return`
                <div data-scheme-id="${a.id}" onclick="FB_applyScheme(${a.id})" style="cursor:pointer; padding:10px; border-radius:6px; ${i} transition:0.2s;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='#fff'">
                    <div style="font-weight:bold; color:#333; display:flex; justify-content:space-between;">
                        <span>${a.name}</span>
                        ${r?'<span style="color:red; font-size:10px;">★ 推荐</span>':""}
                    </div>
                    <div style="font-size:12px; color:#666; margin-top:5px;">
                        <div>均分极差: <strong>${a.range.toFixed(2)}</strong></div>
                        <div>男女极差: ${d} 人</div>
                    </div>
                </div>
            `}).join("");y.schemeSelectorSignature=n,y.schemeSelectorHtml=o,e.innerHTML=o,e.dataset.freshmanSchemeSig=n}function Q(e){const t=$.find(o=>o.id===e);if(!t)return;ce(t.data),J={},h.forEach(o=>J[o.name]=o.students),Y();const n=document.getElementById("fb-scheme-cards");if(n){const o=n.children;Array.from(o).forEach(a=>{String(a.dataset.schemeId)===String(t.id)?(a.style.borderColor="#16a34a",a.style.boxShadow="0 0 0 3px rgba(22, 163, 74, 0.2)"):(a.style.borderColor="#ddd",a.style.boxShadow="none")})}}function N(e,t){const n=e.students.length;if(n===0)return 1e4;const o=e.students.reduce((s,d)=>s+d.score,0)/n,a=e.students.filter(s=>s.gender==="M").length,r=e.students.filter(s=>s.isDiff||s._isDiff).length;let i=Math.pow(o-t,2)*100;return i+=Math.pow(a/n-.5,2)*5e3,document.getElementById("fb_rule_diff").value==="spread"&&(i+=Math.pow(r,2)*500),i}function P(e,t){if(!e.constraints)return!1;for(let n of e.constraints.diff)if(t.find(o=>o.name===n))return!0;return!1}function Y(){document.getElementById("fb-results-area").classList.remove("hidden");const e=document.getElementById("fb_class_container"),t=z(h);if((e==null?void 0:e.dataset.freshmanDashboardSig)===t&&y.dashboardSignature===t){X();return}let n=[],o=0,a=0,r=0;const i=h.map(w=>{const b=de(w.students),u=b.count,v=b.avg,B=b.male,E=b.diff;return n.push(v),o+=B,a+=b.female,r+=E,w.stats=b,`<div class="fb-class-box ${E>3?"fb-warn-bg":""}" onclick="FB_openSeatMap(${w.id})"><div class="fb-c-head"><span style="font-weight:bold; font-size:16px;">${w.name}</span><span class="fb-tag fb-tag-red" style="${E>0?"":"display:none"}">难管: ${E}</span></div><div class="fb-c-body"><div>人数: <strong>${u}</strong></div><div>均分: <strong>${v.toFixed(1)}</strong></div><div>男生: ${B}</div><div>女生: ${b.female}</div><div style="grid-column:span 2; font-size:11px; color:#999; margin-top:5px;">点击进入座位编排 →</div></div></div>`}).join("");e&&e.innerHTML!==i&&(e.innerHTML=i,e.dataset.freshmanDashboardSig=t),y.dashboardSignature=t,y.dashboardHtml=i;const s=n.length?Math.max(...n)-Math.min(...n):0,d=document.getElementById("fb_res_total"),c=document.getElementById("fb_res_male"),m=document.getElementById("fb_res_female"),g=document.getElementById("fb_res_diff"),f=document.getElementById("fb_res_diff_cnt");d&&(d.innerText=F.length),c&&(c.innerText=o),m&&(m.innerText=a),g&&(g.innerText=s.toFixed(2)),f&&(f.innerText=r);const p=document.getElementById("fb_res_eval");p&&(s<=1?p.innerHTML='<span style="color:green;font-weight:bold;">✅ 完美均衡</span>':s<=3?p.innerHTML='<span style="color:#d97706;font-weight:bold;">⚠️ 基本均衡</span>':p.innerHTML='<span style="color:red;font-weight:bold;">❌ 差异过大</span>'),X()}function X(){const e=document.getElementById("balanceChart"),t=document.getElementById("balanceTableContainer"),n=h.map(s=>s.name),o=z(h);if(y.balanceSignature===o&&(t==null?void 0:t.dataset.freshmanBalanceSig)===o)return;const a=h.map(s=>{const d=s.students.map(m=>m.score).sort((m,g)=>m-g),c=Te(d);return{min:d[0],max:d[d.length-1],q1:c.q1,median:c.q2,q3:c.q3,avg:s.stats.avg,sd:pe(d)}});q&&q.destroy(),q=new Chart(e,{type:"bar",data:{labels:n,datasets:[{label:"平均分",data:a.map(s=>s.avg),type:"scatter",backgroundColor:"#2563eb",borderColor:"#2563eb",pointStyle:"rectRot",pointRadius:6},{label:"分数区间 (Min-Max)",data:a.map(s=>[s.min,s.max]),backgroundColor:"rgba(156, 163, 175, 0.2)",borderColor:"rgba(156, 163, 175, 0.5)",borderWidth:1,barPercentage:.1},{label:"核心分布 (Q1-Q3)",data:a.map(s=>[s.q1,s.q3]),backgroundColor:"rgba(37, 99, 235, 0.5)",borderColor:"#1e40af",borderWidth:1,barPercentage:.6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{tooltip:{callbacks:{label:function(s){const d=a[s.dataIndex];if(s.dataset.type==="scatter")return`平均分: ${d.avg.toFixed(2)}`;if(s.datasetIndex===1)return`范围: ${d.min} - ${d.max}`;if(s.datasetIndex===2)return`核心区间: ${d.q1} - ${d.q3}`}}},title:{display:!0,text:"班级分数结构对比 (箱线图)"}},scales:{y:{beginAtZero:!1,title:{display:!0,text:"分数"}}}}});let r='<table class="comparison-table" style="font-size:12px;"><thead><tr><th>班级</th><th>人数</th><th>平均分</th><th>标准差 (SD)</th><th>极差 (Max-Min)</th><th>前25%线 (Q3)</th><th>后25%线 (Q1)</th></tr></thead><tbody>';a.forEach((s,d)=>{r+=`<tr><td>${n[d]}</td><td>${h[d].students.length}</td><td>${s.avg.toFixed(2)}</td><td>${s.sd.toFixed(2)}</td><td>${(s.max-s.min).toFixed(1)}</td><td>${s.q3}</td><td>${s.q1}</td></tr>`});const i=r+"</tbody></table>";t&&t.innerHTML!==i&&(t.innerHTML=i,t.dataset.freshmanBalanceSig=o),y.balanceSignature=o,y.balanceTableHtml=i}const Z={past:[],future:[],limit:20,record:function(){if(I===-1)return;const e=h[I],t=JSON.parse(JSON.stringify(e));this.past.push(t),this.past.length>this.limit&&this.past.shift(),this.future=[],this.updateUI()},undo:function(){if(this.past.length===0)return;const e=JSON.parse(JSON.stringify(h[I]));this.future.push(e);const t=this.past.pop();h[I]=t,this.refreshView("已撤销 ↩")},redo:function(){if(this.future.length===0)return;const e=JSON.parse(JSON.stringify(h[I]));this.past.push(e);const t=this.future.pop();h[I]=t,this.refreshView("已重做 ↪")},refreshView:function(e){T(),this.updateUI(),UI.toast(e,"info")},updateUI:function(){const e=document.getElementById("btn_undo"),t=document.getElementById("btn_redo");e&&(e.disabled=this.past.length===0,e.className=this.past.length>0?"btn btn-primary":"btn btn-gray"),t&&(t.disabled=this.future.length===0,t.className=this.future.length>0?"btn btn-primary":"btn btn-gray")},reset:function(){this.past=[],this.future=[],this.updateUI()}};function ge(e){Z.reset(),I=e;const t=h[e];document.getElementById("seat_class_title").innerText=t.name,document.getElementById("fb_seat_view").classList.remove("hidden"),document.getElementById("fb_seat_view").scrollIntoView({behavior:"smooth"}),updateConstraintWidgetsContext("fb"),t.seatLayout?T():te(),U()}const O=Object.create(null);function He(e){const t=String(e||"").trim(),n=[],o=a=>{const r=String(a||"").trim();!r||n.includes(r)||n.push(r)};if(o(t),window.location&&window.location.protocol==="file:"&&t.startsWith("./assets/")){const a=t.replace(/^\.\//,"");o(`./public/${a}`),o(`./dist/${a}`)}return n}function he(e){return String(e||"").replace(/<\/script/gi,"<\\/script")}async function K(e,t){if(O[e])return O[e];const n=Array.from(document.querySelectorAll(`script[data-standalone-lib="${e}"]`));for(const r of n){const i=String(r.textContent||"").trim();if(!r.src&&i)return O[e]=i,i}const o=[];n.forEach(r=>{const i=String(r.getAttribute("src")||r.src||"").trim();i&&!o.includes(i)&&o.push(i)}),He(t).forEach(r=>{o.includes(r)||o.push(r)});let a=null;for(const r of o)try{const i=await fetch(r,{cache:"force-cache"});if(!i.ok)throw new Error(`HTTP ${i.status}`);const s=await i.text();if(!s.trim())throw new Error("EMPTY_SOURCE");return O[e]=s,s}catch(i){a=i instanceof Error?i:new Error(String(i))}throw a||new Error(`${e} source unavailable`)}async function Fe(){const[e,t]=await Promise.all([K("crypto-js","./assets/vendor/crypto-js/crypto-js.min.js"),K("chart.js","./assets/vendor/chart.js/chart.umd.min.js")]);return{cryptoJsSource:he(e),chartJsSource:he(t)}}async function Ne(){if(typeof CryptoJS!="undefined")return CryptoJS;if(typeof window.ensureCryptoJsVendorLoaded=="function")return window.ensureCryptoJsVendorLoaded();const e=await K("crypto-js","./assets/vendor/crypto-js/crypto-js.min.js");if(window.eval(e),typeof CryptoJS=="undefined")throw new Error("CryptoJS runtime unavailable");return CryptoJS}async function De(){const e=document.getElementById("studentSchoolSelect").value;if(!e||e.includes("请选择"))return window.UI.alert("请先选择一个学校，系统将生成该校的查分包。");if(typeof CryptoJS=="undefined")try{await Ne()}catch(u){return console.error("[InquiryPackage] crypto-js load failed:",u),window.UI.alert("❌ 导出失败：加密库未加载完成，请刷新页面后重试。")}const t=typeof window.getAppSchoolRecord=="function"?window.getAppSchoolRecord(e):SCHOOLS[e],n=(t==null?void 0:t.students)||[];if(!n||n.length===0)return window.UI.alert("该学校无数据");const o=Object.keys(SCHOOLS).length<=1,a={};SUBJECTS.forEach(u=>{const v=RAW_DATA.map(B=>B.scores[u]).filter(B=>typeof B=="number");if(v.length>0){const E=v.reduce((L,M)=>L+M,0)/v.length,A=v.reduce((L,M)=>L+Math.pow(M-E,2),0)/v.length;a[u]={avg:E,sd:Math.sqrt(A)}}else a[u]={avg:0,sd:1}});const r={};n.forEach(u=>{const v=(u.class+"_"+u.name).replace(/\s+/g,""),B={},E={labels:[],data:[]},A={labels:[],data:[]},L=typeof hasStudentClassRankScope=="function"?hasStudentClassRankScope(u):!0,M=typeof isCountyDirectStudentForRank=="function"?!isCountyDirectStudentForRank(u):!0;SUBJECTS.forEach(l=>{if(u.scores[l]!==void 0){B[l]=[u.scores[l],safeGet(u,`ranks.${l}.school`,"-"),M?safeGet(u,`ranks.${l}.township`,"-"):"-"];const x=RAW_DATA.map(D=>D.scores[l]).filter(D=>D!==void 0).sort((D,Ue)=>Ue-D),S=x.indexOf(u.scores[l])+1,k=x.length,H=((1-S/k)*100).toFixed(1);E.labels.push(l),E.data.push(H);const j=a[l];let Ce=0;j&&j.sd>0&&(Ce=(u.scores[l]-j.avg)/j.sd),A.labels.push(l),A.data.push(parseFloat(Ce.toFixed(2)))}});const le=typeof generateStudentComment=="function"?generateStudentComment(u):"";r[v]={cls:u.class,name:u.name,s:B,t:u.total,tr:M?safeGet(u,"ranks.total.township","-"):"-",sr:safeGet(u,"ranks.total.school","-"),cr:L?safeGet(u,"ranks.total.class","-"):"-",showClassRank:L,showTownRank:M,rd:E,vd:A,cm:le}});const i=window.UI&&typeof window.UI.prompt=="function"?await window.UI.prompt("请设置一个访问密码。家长查询时需要同时输入此密码、准确班级和准确姓名。","",{title:"安全查分包访问密码",input:"password",confirmText:"生成查分包",inputAttributes:{autocomplete:"new-password",minlength:8},inputValidator:u=>{const v=String(u||"").trim();return v.length<8?"访问密码至少 8 位":!/[A-Za-z]/.test(v)||!/\d/.test(v)?"访问密码需同时包含字母和数字":null}}):window.prompt("请设置一个访问密码。至少 8 位，并同时包含字母和数字。","");if(i===null)return;if(!i)return window.UI.alert("❌ 必须设置密码才能生成安全查分包！");if(String(i).trim().length<8||!/[A-Za-z]/.test(i)||!/\d/.test(i))return window.UI.alert("❌ 访问密码至少 8 位，并需同时包含字母和数字。");const s=JSON.stringify(r),d=CryptoJS.AES.encrypt(s,i).toString();let c=null;try{c=await Fe()}catch(u){return console.error("[InquiryPackage] standalone libs unavailable:",u),window.UI.alert("❌ 导出失败：查分包依赖未准备好，请刷新页面后重试。")}const m=JSON.stringify(d).replace(/</g,"\\u003c"),g=fe().name||"期中考试",f=new Date().toLocaleDateString(),p=`
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
</html>`,w=new Blob([p],{type:"text/html;charset=utf-8"}),b=document.createElement("a");b.href=URL.createObjectURL(w),b.download=`${e}_查分包_${new Date().getTime()}.html`,document.body.appendChild(b),b.click(),document.body.removeChild(b),window.UI.alert(`✅ 加密查分包已生成！
文件名：`+b.download+`
访问密码：`+i+`

请将文件发给家长，告知密码。
家长必须输入正确的 [班级] 和 [姓名] 才能查询。`)}function ee(e){return e?e.replace(/，/g,",").replace(/；/g,";").split(/[,;]/).map(t=>t.trim()).filter(t=>t):[]}function ye(e){return e?e.replace(/，/g,",").split(",").map(t=>{const n=t.split("&").map(o=>o.trim());return n.length===2?n:null}).filter(t=>t):[]}function te(){Z.record();const e=h[I];let t=e.seatLayout||[];t.length<e.students.length&&(t=[...e.students]);let n={},o=[];t.forEach((l,x)=>{l&&l.locked?n[x]=l:l&&o.push(l)});const a=ee(document.getElementById("fb_c_diff").value),r=ee(document.getElementById("fb_c_vision").value),i=ee(document.getElementById("fb_c_talk").value),s=ye(document.getElementById("fb_c_conflict").value),d=ye(document.getElementById("fb_c_bind").value),c=new Map;d.forEach(l=>{c.set(l[0],l[1]),c.set(l[1],l[0])}),o.forEach(l=>{l._isDiff=!1,l._isVision=!1,(a.includes(l.name)||i.includes(l.name))&&(l._isDiff=!0),r.includes(l.name)&&(l._isVision=!0),l._bindPartner=c.get(l.name)});const m=document.getElementById("rule_s_height").checked,g=document.getElementById("rule_s_vision").checked,f=document.getElementById("rule_s_gender").checked,p=document.getElementById("rule_s_diff").checked;m&&o.sort((l,x)=>l.height-x.height);let w=[],b=new Set,u=[];o.forEach(l=>{if(l._bindPartner&&!b.has(l.name)){const x=o.find(S=>S.name===l._bindPartner);if(x){b.add(l.name),b.add(x.name);const S=[l,x].sort((k,H)=>k.height-H.height);w.push(S)}else u.push(l)}else b.has(l.name)||u.push(l)});let v=[],B=[],E=[];if(u.forEach(l=>{r.length>0&&l._isVision?B.push(l):E.push(l)}),w.forEach(l=>{const x=l.some(S=>S._isVision);if(r.length>0&&x)B.push(l[0],l[1]);else{const S=(l[0].height+l[1].height)/2;let k=!1;for(let H=0;H<E.length;H++)if(E[H].height>S){E.splice(H,0,l[0],l[1]),k=!0;break}k||E.push(l[0],l[1])}}),o=[...B,...E],r.length>0||g){const l=o.filter(S=>S._isVision||g&&S.vision<4.8),x=o.filter(S=>!S._isVision&&!(g&&S.vision<4.8));o=[...l,...x]}const A=o.filter(l=>l._isDiff||p&&l.isDiff);if(A.length>0){const l=o.filter(k=>!k._isDiff&&!(p&&k.isDiff)),x=Math.floor(l.length/(A.length+1));let S=x;A.forEach(k=>{S<l.length?l.splice(S,0,k):l.push(k),S+=x+1}),o=l}if(f){for(let l=0;l<o.length-1;l+=2)if(o[l].gender===o[l+1].gender){for(let x=l+2;x<o.length;x++)if(o[x].gender!==o[l].gender){[o[l+1],o[x]]=[o[x],o[l+1]];break}}}let L=[],M=0;const le=Math.max(e.students.length,t.length);for(let l=0;l<le;l++)n[l]?L[l]=n[l]:M<o.length?L[l]=o[M++]:L[l]=null;e.seatLayout=L,T()}function T(){const e=h[I],t=document.getElementById("seat_map_container");t.innerHTML="";const n=parseInt(document.getElementById("seat_opt_groups").value),o=parseInt(document.getElementById("seat_opt_cols").value);t.style.display="grid",t.style.gridTemplateColumns=`repeat(${n}, 1fr)`,t.style.gap="50px",t.style.alignItems="start",t.style.padding="20px";const a=e.seatLayout||e.students,r=n*o,i=Math.ceil(a.length/r),s=[];for(let d=0;d<n;d++){const c=document.createElement("div");c.className="seat-group",c.style.display="grid",c.style.gridTemplateColumns=`repeat(${o}, 1fr)`,c.style.gap="10px",c.style.position="relative",s.push(c),t.appendChild(c)}for(let d=0;d<i;d++)for(let c=0;c<n;c++)for(let m=0;m<o;m++){const g=d*r+c*o+m,f=a[g],p=document.createElement("div");p.className="desk",f?(f.gender==="M"&&p.classList.add("is-male"),f.gender==="F"&&p.classList.add("is-female"),(f.isDiff||f._isDiff)&&p.classList.add("is-diff"),f.locked&&p.classList.add("locked"),p.draggable=!f.locked,p.dataset.idx=g,p.innerHTML=`<div class="desk-name">${f.name}</div><div class="desk-info"><span>${f.height}cm</span><span>${f.score}</span></div><div class="desk-popover">视力:${f.vision} | 备注:${f.remarks}</div>`,p.oncontextmenu=w=>{w.preventDefault(),ne(g)},f.locked||(p.ondragstart=w=>{w.dataTransfer.setData("text/plain",g),p.classList.add("dragging")},p.ondragend=()=>p.classList.remove("dragging"),p.ondragover=w=>{w.preventDefault(),p.classList.add("drag-over")},p.ondragleave=()=>p.classList.remove("drag-over"),p.ondrop=w=>{w.preventDefault();const b=parseInt(w.dataTransfer.getData("text/plain")),u=g;b!==u&&!a[u].locked&&!a[b].locked&&Z.record(),!a[u].locked&&!a[b].locked&&([e.seatLayout[b],e.seatLayout[u]]=[e.seatLayout[u],e.seatLayout[b]],T())})):p.style.visibility="hidden",s[c].appendChild(p)}for(let d=0;d<n;d++){const c=s[d];if(o%2===0)for(let m=0;m<i;m+=2)for(let g=0;g<o;g+=2){const f=document.createElement("div");f.className="learning-group-box",f.style.left=`${g*90-5}px`,f.style.top=`${m*65-5}px`,f.style.width="175px",f.style.height="125px";const p=o/2,w=d*(Math.ceil(i/2)*p)+m/2*p+g/2+1;f.innerHTML=`<div class="learning-group-label">小组 ${w}</div>`,c.appendChild(f)}}}function ne(e){const n=h[I].seatLayout[e];n&&(n.locked=!n.locked,T())}function be(){const e=document.querySelector(".seat-canvas");e&&e.classList.toggle("view-rotated")}function we(){if(!h.length)return window.UI.alert("暂无数据");localStorage.setItem("FB_DATA_BACKUP",JSON.stringify(h)),window.UI.alert("方案已保存至浏览器缓存")}function xe(){if(!h.length)return window.UI.alert("无数据");const e=XLSX.utils.book_new(),t=[["班级","座位号","姓名","性别","总分","身高","视力","备注"]];h.forEach(n=>{(n.seatLayout||n.students).forEach((a,r)=>{t.push([n.name,r+1,a.name,a.gender,a.score,a.height,a.vision,a.remarks])})}),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(t),"分班与座位表"),XLSX.writeFile(e,"新生分班结果.xlsx")}function ve(e){const t="fb_bind_sel_a",n="fb_bind_sel_b",o="widget_fb_bind",a="fb_c_bind",r=document.getElementById(t),i=document.getElementById(n);if(!(!r||!i)){if(!r.value||!i.value)return window.UI.alert("请先选择两个学生");if(r.value===i.value)return window.UI.alert("不能选择同一个学生");addTagToWidget(o,a,`${r.value}&${i.value}`),r.value="",i.value=""}}function U(){const e=h[I],t=document.getElementById("seat_scenario_select");if(t){if(t.innerHTML='<option value="">-- 选择方案 --</option>',!e){t.disabled=!0;return}t.disabled=!1,e.scenarios||(e.scenarios={}),Object.keys(e.scenarios).forEach(n=>{t.innerHTML+=`<option value="${n}">${n}</option>`})}}async function Se(){const e=h[I];if(!e)return window.UI.alert("请先打开一个班级座位图");if(!e.seatLayout||e.seatLayout.length===0)return window.UI.alert("当前座位表为空，无法保存");const t=await window.UI.prompt("请输入方案名称 (如：期中考试、日常、互助组)",`方案 ${Object.keys(e.scenarios||{}).length+1}`,{title:"保存座位方案",confirmText:"保存"});t&&(e.scenarios||(e.scenarios={}),e.scenarios[t]=JSON.parse(JSON.stringify(e.seatLayout)),window.UI.alert(`方案 [${t}] 保存成功！`),U(),document.getElementById("seat_scenario_select").value=t)}async function _e(){const e=document.getElementById("seat_scenario_select");if(!e)return;const t=e.value;if(!t)return;const n=h[I];if(!n)return window.UI.alert("请先打开一个班级座位图");if(n.scenarios&&n.scenarios[t]){if(!await window.UI.confirm(`确定要加载 [${t}] 方案吗？
当前未保存的修改将丢失。`)){e.value="";return}n.seatLayout=JSON.parse(JSON.stringify(n.scenarios[t])),T()}}async function Ee(){const e=document.getElementById("seat_scenario_select");if(!e)return;const t=e.value;if(!t)return window.UI.alert("请先选择一个要删除的方案");if(await window.UI.confirm(`确定要永久删除方案 [${t}] 吗？`)){const n=h[I];if(!n)return window.UI.alert("请先打开一个班级座位图");delete n.scenarios[t],U()}}function Ie(e){const t=e.files[0];if(!t)return;const n=new FileReader;n.onload=function(o){try{const a=new Uint8Array(o.target.result),r=XLSX.read(a,{type:"array"}),i=XLSX.utils.sheet_to_json(r.Sheets[r.SheetNames[0]]);if(!i.length)throw new Error("Excel没有数据");C=i.map(s=>({name:s.姓名||"未知",class:s.班级||s.班||"未知",school:s.学校||"",score:parseFloat(s.总分||s.score||0)})),window.UI.alert(`✅ 已导入 ${C.length} 名学生，准备进行考场编排。`)}catch(a){window.UI.alert("读取失败："+a.message)}},n.readAsArrayBuffer(t)}function Be(){if(!C.length)return window.UI.alert("请先导入学生名单");const e=document.getElementById("exam_prefix").value,t=parseInt(document.getElementById("exam_seats_per_room").value)||30,n=document.getElementById("exam_opt_separate").checked,o=document.getElementById("exam_opt_snake").checked;let a=[...C].sort((i,s)=>s.score-i.score);if(n){let i=0;for(let s=1;s<a.length-1;s++)if(a[s].class===a[s-1].class){let d=!1;for(let c=s+1;c<Math.min(s+15,a.length);c++)if(a[c].class!==a[s].class&&a[c].class!==a[s-1].class){[a[s],a[c]]=[a[c],a[s]],d=!0,i++;break}}i>0&&UI.toast(`已智能微调 ${i} 人次以打散同班同学`,"success")}_=[];const r=4;a.forEach((i,s)=>{i.examNo=e+String(s+1).padStart(3,"0"),i.roomNo=Math.floor(s/t)+1;let d=s%t;if(o){const c=Math.floor(d/r);if(c%2!==0){const m=d%r,g=r-1-m;d=c*r+g}}i.seatNo=d+1,_[i.roomNo-1]||(_[i.roomNo-1]={id:i.roomNo,students:[]}),_[i.roomNo-1].students.push(i)}),o&&_.forEach(i=>i.students.sort((s,d)=>s.seatNo-d.seatNo)),document.getElementById("exam-results-area").classList.remove("hidden"),oe(),se(),re(),ie()}function ae(e,t){const n=Array.from(document.querySelectorAll("#exam-results-area .nav-link"));n.forEach(r=>r.classList.remove("active"));const o=t||n.find(r=>{const i=r.getAttribute("onclick")||"";return i.includes(`'${e}'`)||i.includes(`"${e}"`)});o&&o.classList.add("active"),document.getElementById("exam-view-overview").classList.add("hidden"),document.getElementById("exam-view-students").classList.add("hidden"),document.getElementById("exam-view-proctor").classList.add("hidden");const a=document.getElementById("exam-view-"+e);a&&a.classList.remove("hidden")}function oe(){const e=document.getElementById("exam_room_grid");if(!e)return;const t=R();if(y.examOverviewSignature===t){e.innerHTML!==y.examOverviewHtml&&(e.innerHTML=y.examOverviewHtml);return}const n=_.map(o=>{const a=o.students[0].examNo,r=o.students[o.students.length-1].examNo;return`<div class="exam-room-card analysis-exam-room-card" onclick="window.UI.alert('提示：请使用“打印桌贴”功能查看该考场的详细座次表')"><div class="exam-room-title analysis-exam-room-title">第 ${String(o.id).padStart(2,"0")} 考场</div><div class="exam-room-info analysis-exam-room-info"><span>人数: ${o.students.length}</span></div><div class="exam-room-range analysis-exam-room-range">${a} - ${r}</div></div>`}).join("");y.examOverviewSignature=t,y.examOverviewHtml=n,e.innerHTML!==n&&(e.innerHTML=n)}function se(){const e=document.querySelector("#exam_student_table tbody");if(!e)return;const t=R();if(y.examStudentListSignature===t){e.innerHTML!==y.examStudentListHtml&&(e.innerHTML=y.examStudentListHtml);return}let n="";const o=[...C].sort((a,r)=>a.class!==r.class?String(a.class).localeCompare(String(r.class),void 0,{numeric:!0}):a.examNo.localeCompare(r.examNo));o.slice(0,500).forEach(a=>{n+=`<tr><td>${a.examNo}</td><td>${a.name}</td><td>${a.class}</td><td>${String(a.roomNo).padStart(2,"0")}</td><td>${String(a.seatNo).padStart(2,"0")}</td><td>${a.score}</td></tr>`}),o.length>500&&(n+='<tr><td colspan="6" style="text-align:center">...更多数据请导出Excel查看...</td></tr>'),y.examStudentListSignature=t,y.examStudentListHtml=n,e.innerHTML!==n&&(e.innerHTML=n)}function re(){const e=document.querySelector("#exam_proctor_table tbody");if(!e)return;const t=R();if(y.examProctorSignature===t){e.innerHTML!==y.examProctorHtml&&(e.innerHTML=y.examProctorHtml);return}let n="";_.forEach(o=>{const a=o.students[0].examNo,r=o.students[o.students.length-1].examNo;n+=`<tr><td>第 ${String(o.id).padStart(2,"0")} 考场</td><td>${o.students.length}</td><td>${a} - ${r}</td><td></td><td></td></tr>`}),y.examProctorSignature=t,y.examProctorHtml=n,e.innerHTML!==n&&(e.innerHTML=n)}function ie(){const e=document.getElementById("batch-print-area-wrapper")||document.getElementById("batch-print-container");if(!e)return;const t=R();if(y.examPrintSignature===t){e.innerHTML!==y.examPrintHtml&&(e.innerHTML=y.examPrintHtml);return}let n="";_.forEach(o=>{let a="";o.students.forEach(r=>{a+=`<div class="exam-print-seat"><div class="exam-print-seat-num">第${String(r.seatNo).padStart(2,"0")}号</div><div class="exam-print-seat-name">${r.name}</div><div class="exam-print-seat-id">考号: ${r.examNo}</div><div style="font-size:10px;">${r.class}</div></div>`}),n+=`<div class="exam-print-page"><div class="exam-print-header">第 ${String(o.id).padStart(2,"0")} 考场座位表 (共${o.students.length}人)</div><div class="exam-print-grid">${a}</div><div style="margin-top:20px; font-size:12px;">监考员签字：_________________   &nbsp;&nbsp;&nbsp; 巡考员签字：_________________</div></div>`}),y.examPrintSignature=t,y.examPrintHtml=n,e.innerHTML!==n&&(e.innerHTML=n)}function ke(){if(!_||_.length===0)return window.UI.alert("请先点击“一键生成考场安排”");const e=document.getElementById("desk-labels-print-area");e.innerHTML="";let t="";_.forEach(r=>{t+='<div class="desk-label-page">',r.students.forEach(i=>{t+=`
                    <div class="desk-label-card">
                        <!-- 1. 顶部：考号 (最大) -->
                        <div class="dl-exam-no">${i.examNo}</div>

                        <!-- 2. 中间：班级(左) + 姓名(右) (中等) -->
                        <div class="dl-main-row">
                            <span>${i.class}</span>
                            <span>${i.name}</span>
                        </div>

                        <!-- 3. 底部：考场 + 座号 (最小) -->
                        <div class="dl-footer-row">
                            <span class="dl-room-box">${String(r.id).padStart(2,"0")}场</span>
                            <span class="dl-seat-box">${String(i.seatNo).padStart(2,"0")}座</span>
                        </div>
                    </div>
                `}),t+="</div>"}),e.innerHTML=t,UI.toast("✅ 桌贴生成完毕 (考号最大化)","success");const n=document.getElementById("app"),o=document.getElementById("desk-labels-print-area"),a=n.style.display;n.style.display="none",o.style.display="block",setTimeout(()=>{window.print(),n.style.display=a,o.style.display="none",e.innerHTML=""},500)}function Le(){const e=[...new Set(Object.values(TEACHER_MAP||{}).map(s=>String(s||"").trim()).filter(Boolean))].sort((s,d)=>s.localeCompare(d,"zh-CN")),t=document.getElementById("proctor-teacher-pool"),n=document.getElementById("proctor-role-patrol"),o=document.getElementById("proctor-role-affairs");if(!t||!n||!o)return;const a=Array.from(document.querySelectorAll(".exclude-check:checked")).map(s=>s.value),r=Array.from(n.selectedOptions).map(s=>s.value),i=Array.from(o.selectedOptions).map(s=>s.value);if(!e.length){t.innerHTML='<div style="padding:8px 0; color:#94a3b8;">暂无任课教师数据，请先导入任课表。</div>',n.disabled=!0,o.disabled=!0,n.innerHTML="",o.innerHTML="";return}t.innerHTML=e.map(s=>`
            <label class="teacher-item">
                <input type="checkbox" class="exclude-check" value="${s}" ${a.includes(s)?"checked":""}> ${s}
            </label>
        `).join(""),n.disabled=!1,o.disabled=!1,setMultiSelectOptions(n,e,r),setMultiSelectOptions(o,e,i)}function Ae(){if(!_.length)return window.UI.alert("请先生成考场安排");const e=[...new Set(Object.values(TEACHER_MAP||{}).map(f=>String(f||"").trim()).filter(Boolean))];if(!e.length)return window.UI.alert("请先导入任课表，当前没有可用于监考分配的教师。");const t=document.getElementById("proctor-role-patrol"),n=document.getElementById("proctor-role-affairs");if(!t||!n)return window.UI.alert("监考配置面板未就绪，请刷新页面后重试。");const o=Array.from(document.querySelectorAll(".exclude-check:checked")).map(f=>f.value),a=[...new Set(Array.from(t.selectedOptions).map(f=>f.value))],r=[...new Set(Array.from(n.selectedOptions).map(f=>f.value))],i=r.filter(f=>a.includes(f)),s=r.filter(f=>!a.includes(f));i.length&&(Array.from(n.options).forEach(f=>{f.selected=s.includes(f.value)}),window.UI&&UI.toast(`已自动去重特殊岗位：${i.join("、")}`,"warning"));let d=e.filter(f=>!o.includes(f)&&!a.includes(f)&&!s.includes(f));const c=_.length*2;if(d.length<c)return window.UI.alert(`❌ 人员不足！
当前考场需要 ${c} 名监考，但排除后仅剩 ${d.length} 人。
请减少排除项或合并岗位。`);d.sort(()=>Math.random()-.5);const m=document.querySelector("#exam_proctor_table tbody");let g="";_.forEach((f,p)=>{const w=d[p*2],b=d[p*2+1],u=f.students[0].examNo,v=f.students[f.students.length-1].examNo;g+=`
                <tr>
                    <td><strong>第 ${String(f.id).padStart(2,"0")} 考场</strong></td>
                    <td>${f.students.length}</td>
                    <td>${u} - ${v}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${w}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${b}</td>
                </tr>
            `}),g+=`
            <tr style="background:#f8fafc; border-top: 2px solid #333;">
                <td colspan="3" style="text-align:right; font-weight:bold;">⚖️ 纪律巡考人员：</td>
                <td colspan="2" style="text-align:left; color:var(--danger); font-weight:bold;">${a.join("、")||"未指定"}</td>
            </tr>
            <tr style="background:#f8fafc;">
                <td colspan="3" style="text-align:right; font-weight:bold;">🧹 卫生考务保障：</td>
                <td colspan="2" style="text-align:left; color:var(--success); font-weight:bold;">${s.join("、")||"未指定"}</td>
            </tr>
        `,m.innerHTML=g,UI.toast("✅ 监考人员分配完成，请查看“监考汇总表”","success"),ae("proctor",document.querySelector('.nav-link[onclick*="proctor"]'))}function Me(){if(!C.length)return window.UI.alert("无考生数据");if(!_.length)return window.UI.alert("请先生成考场安排");const e=XLSX.utils.book_new(),t=[["考号","姓名","学校","班级","考场号","座号","参考分"]];C.forEach(r=>t.push([r.examNo,r.name,r.school,r.class,r.roomNo,r.seatNo,r.score]));const n=[["单位/考场","应考人数","起止考号","监考老师 A","监考老师 B"]],o=document.querySelectorAll("#exam_proctor_table tbody tr");o.length===0?window.UI.alert("⚠️ 提示：您尚未进行“人员配置”或点击“一键编排”。监考表将只包含考生信息。"):o.forEach(r=>{const i=r.querySelectorAll("td"),s=[];i.forEach(d=>s.push(d.innerText)),n.push(s)});const a=[["考场","座号","姓名","考号","班级"]];C.forEach(r=>a.push([r.roomNo,r.seatNo,r.name,r.examNo,r.class])),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(t),"考生座次总表"),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(n),"全校监考考务表"),XLSX.utils.book_append_sheet(e,XLSX.utils.aoa_to_sheet(a),"桌贴打印备份"),XLSX.writeFile(e,`${fe().name||"学校"}考务编排结果全集.xlsx`)}window.FreshmanExamRuntime={syncFbClasses:$e,writeFbClasses:ce,get students(){return F},get classes(){return h},get simulatedData(){return J},get examData(){return C},get examRooms(){return _}},typeof ue=="function"&&(window.FB_loadData=ue),typeof me=="function"&&(window.FB_runDivision=me),typeof G=="function"&&(window.FB_generateSingleScheme=G),typeof W=="function"&&(window.FB_renderSchemeSelector=W),typeof Q=="function"&&(window.FB_applyScheme=Q),typeof N=="function"&&(window.FB_calcClassCost=N),typeof P=="function"&&(window.FB_checkConflict=P),typeof Y=="function"&&(window.FB_renderDashboard=Y),typeof X=="function"&&(window.FB_renderBalanceChart=X),typeof ge=="function"&&(window.FB_openSeatMap=ge),typeof te=="function"&&(window.FB_autoSeatAlgo=te),typeof T=="function"&&(window.FB_renderSeatMap=T),typeof ne=="function"&&(window.FB_toggleLock=ne),typeof be=="function"&&(window.FB_toggleViewRotation=be),typeof we=="function"&&(window.FB_saveToLocal=we),typeof xe=="function"&&(window.FB_exportResult=xe),typeof ve=="function"&&(window.addBindPair=ve),typeof U=="function"&&(window.FB_initScenarioSelect=U),typeof Se=="function"&&(window.FB_saveScenario=Se),typeof _e=="function"&&(window.FB_loadScenario=_e),typeof Ee=="function"&&(window.FB_deleteScenario=Ee),typeof Ie=="function"&&(window.EXAM_loadData=Ie),typeof Be=="function"&&(window.EXAM_generate=Be),typeof ae=="function"&&(window.EXAM_switchView=ae),typeof oe=="function"&&(window.EXAM_renderOverview=oe),typeof se=="function"&&(window.EXAM_renderStudentList=se),typeof re=="function"&&(window.EXAM_renderProctorTable=re),typeof ie=="function"&&(window.EXAM_renderPrintView=ie),typeof ke=="function"&&(window.EXAM_generateDeskLabels=ke),typeof Le=="function"&&(window.EXAM_initProctorUI=Le),typeof Ae=="function"&&(window.EXAM_assignProctors=Ae),typeof Me=="function"&&(window.EXAM_exportResult=Me),window.__FRESHMAN_EXAM_RUNTIME_PATCHED__=!0})();
