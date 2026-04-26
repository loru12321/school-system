(()=>{if(typeof window=="undefined"||window.__FRESHMAN_EXAM_RUNTIME_PATCHED__)return;let F=[],b=typeof window.readFbClassesState=="function"?window.readFbClassesState():Array.isArray(window.FB_CLASSES)?window.FB_CLASSES:[],E=-1,P={},L=[],S=[],$=[],q=null;function Mt(){const t=typeof window.readFbClassesState=="function"?window.readFbClassesState():Array.isArray(window.FB_CLASSES)?window.FB_CLASSES:[];return Array.isArray(t)&&(b=t),window.FB_CLASSES=b,b}function rt(t){const e=typeof window.setFbClassesState=="function"?window.setFbClassesState(t):Array.isArray(t)?t:[];return b=Array.isArray(e)?e:[],window.FB_CLASSES=b,b}function it(){return window.CONFIG||{name:"学校"}}function lt(t){const e=t.files[0];if(!e)return;const a=new FileReader;a.onload=function(s){try{const o=new Uint8Array(s.target.result),n=XLSX.read(o,{type:"array"}),r=XLSX.utils.sheet_to_json(n.Sheets[n.SheetNames[0]]);if(!r.length)throw new Error("Excel没有数据");F=r.map((i,d)=>{const f=String(i.备注||i.说明||""),g=f.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:同班|一起|一班)/),m=f.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:分开|不同班|不在一起)/);return{_id:d,name:i.姓名||"未知",gender:i.性别==="男"||i.Gender==="M"?"M":"F",score:parseFloat(i.总分||i.语数英||0),height:parseFloat(i.身高||160),vision:parseFloat(i.视力||i.左眼||5),isDiff:String(i.难管||"").includes("是")||f.includes("难管")||f.includes("调皮"),remarks:f,constraints:{same:g?[g[1]]:[],diff:m?[m[1]]:[]},classIdx:-1}}),alert(`✅ 导入成功！共 ${F.length} 人。`),document.getElementById("fb-results-area").classList.add("hidden")}catch(o){alert("读取失败："+o.message)}},a.readAsArrayBuffer(e)}function Lt(t){const e=j(t),a=Math.floor(t.length/2),s=t.slice(0,a),o=t.slice(t.length%2===0?a:a+1),n=j(s),r=j(o);return{q1:n,q2:e,q3:r}}function j(t){const e=Math.floor(t.length/2);return t.length%2!==0?t[e]:(t[e-1]+t[e])/2}function ct(t){const e=t.length;if(e===0)return 0;const a=t.reduce((o,n)=>o+n,0)/e,s=t.reduce((o,n)=>o+Math.pow(n-a,2),0)/e;return Math.sqrt(s)}function dt(){if(!F.length)return alert("请先导入数据");const t=parseInt(document.getElementById("fb_cls_num").value)||6,e=document.getElementById("fb_algorithm").value,a=document.querySelector('button[onclick="FB_runDivision()"]');a.innerHTML="⏳ 正在运算多套方案...",a.disabled=!0,setTimeout(()=>{$=[];const s=e==="snake"?1:3;for(let r=0;r<s;r++){const i=z(t,e),d=i.map(m=>m.stats.avg),f=Math.max(...d)-Math.min(...d),g=ct(d);$.push({id:r,name:s===1?"标准方案":`方案 ${String.fromCharCode(65+r)}`,data:i,range:f,sd:g,desc:`均分极差 ${f.toFixed(2)}`})}a.innerHTML="🚀 开始智能分班",a.disabled=!1,J();const o=[...$].sort((r,i)=>r.range-i.range)[0];U(o.id),document.getElementById("fb-results-area").classList.remove("hidden");const n=document.getElementById("fb-scheme-panel");s>1?n&&n.classList.remove("hidden"):n&&n.classList.add("hidden")},100)}function z(t,e){let a=Array.from({length:t},(o,n)=>({id:n,name:n+1+"班",students:[],stats:{}})),s=JSON.parse(JSON.stringify(F));if(s.sort((o,n)=>n.score-o.score),e==="snake")s.forEach((o,n)=>{const i=Math.floor(n/t)%2===0?n%t:t-1-n%t;a[i].students.push(o),o.classIdx=i});else{s.forEach((r,i)=>{const d=Math.floor(i/t)%2===0?i%t:t-1-i%t;a[d].students.push(r),r.classIdx=d});const o=8e3,n=s.reduce((r,i)=>r+i.score,0)/s.length;for(let r=0;r<o;r++){const i=Math.floor(Math.random()*t),d=Math.floor(Math.random()*t);if(i===d)continue;const f=a[i],g=a[d];if(!f.students.length||!g.students.length)continue;const m=Math.floor(Math.random()*f.students.length),c=Math.floor(Math.random()*g.students.length),p=f.students[m],h=g.students[c],u=T(f,n)+T(g,n);f.students[m]=h,h.classIdx=i,g.students[c]=p,p.classIdx=d;const y=T(f,n)+T(g,n);let w=!1;(D(p,g.students)||D(h,f.students))&&(w=!0),(w||y>u)&&(f.students[m]=p,p.classIdx=i,g.students[c]=h,h.classIdx=d)}}return a.forEach(o=>{const n=o.students.length,r=o.students.reduce((i,d)=>i+d.score,0);o.stats.avg=n?r/n:0,o.stats.male=o.students.filter(i=>i.gender==="M").length,o.stats.count=n}),a}function J(){const t=document.getElementById("fb-scheme-cards");if(!t)return;t.innerHTML="";const e=$.length?Math.min(...$.map(a=>a.range)):1/0;$.forEach(a=>{const s=a.range<=e,o=s?"border:2px solid #16a34a; background:#fff;":"border:1px solid #ddd; background:#fff;",n=a.data.map(i=>i.stats.male),r=Math.max(...n)-Math.min(...n);t.innerHTML+=`
                <div data-scheme-id="${a.id}" onclick="FB_applyScheme(${a.id})" style="cursor:pointer; padding:10px; border-radius:6px; ${o} transition:0.2s;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='#fff'">
                    <div style="font-weight:bold; color:#333; display:flex; justify-content:space-between;">
                        <span>${a.name}</span>
                        ${s?'<span style="color:red; font-size:10px;">★ 推荐</span>':""}
                    </div>
                    <div style="font-size:12px; color:#666; margin-top:5px;">
                        <div>均分极差: <strong>${a.range.toFixed(2)}</strong></div>
                        <div>男女极差: ${r} 人</div>
                    </div>
                </div>
            `})}function U(t){const e=$.find(s=>s.id===t);if(!e)return;rt(e.data),P={},b.forEach(s=>P[s.name]=s.students),V();const a=document.getElementById("fb-scheme-cards");if(a){const s=a.children;Array.from(s).forEach(o=>{String(o.dataset.schemeId)===String(e.id)?(o.style.borderColor="#16a34a",o.style.boxShadow="0 0 0 3px rgba(22, 163, 74, 0.2)"):(o.style.borderColor="#ddd",o.style.boxShadow="none")})}}function T(t,e){const a=t.students.length;if(a===0)return 1e4;const s=t.students.reduce((i,d)=>i+d.score,0)/a,o=t.students.filter(i=>i.gender==="M").length,n=t.students.filter(i=>i.isDiff||i._isDiff).length;let r=Math.pow(s-e,2)*100;return r+=Math.pow(o/a-.5,2)*5e3,document.getElementById("fb_rule_diff").value==="spread"&&(r+=Math.pow(n,2)*500),r}function D(t,e){if(!t.constraints)return!1;for(let a of t.constraints.diff)if(e.find(s=>s.name===a))return!0;return!1}function V(){document.getElementById("fb-results-area").classList.remove("hidden");const t=document.getElementById("fb_class_container");t.innerHTML="";let e=[],a=0,s=0,o=0;b.forEach(c=>{const p=c.students.length,h=c.students.reduce((x,k)=>x+k.score,0),u=p?h/p:0,y=c.students.filter(x=>x.gender==="M").length,w=c.students.filter(x=>x.isDiff||x._isDiff).length;e.push(u),a+=y,s+=p-y,o+=w,c.stats={avg:u,male:y,female:p-y,count:p};const B=w>3;t.innerHTML+=`<div class="fb-class-box ${B?"fb-warn-bg":""}" onclick="FB_openSeatMap(${c.id})"><div class="fb-c-head"><span style="font-weight:bold; font-size:16px;">${c.name}</span><span class="fb-tag fb-tag-red" style="${w>0?"":"display:none"}">难管: ${w}</span></div><div class="fb-c-body"><div>人数: <strong>${p}</strong></div><div>均分: <strong>${u.toFixed(1)}</strong></div><div>男生: ${y}</div><div>女生: ${p-y}</div><div style="grid-column:span 2; font-size:11px; color:#999; margin-top:5px;">点击进入座位编排 →</div></div></div>`});const n=e.length?Math.max(...e)-Math.min(...e):0,r=document.getElementById("fb_res_total"),i=document.getElementById("fb_res_male"),d=document.getElementById("fb_res_female"),f=document.getElementById("fb_res_diff"),g=document.getElementById("fb_res_diff_cnt");r&&(r.innerText=F.length),i&&(i.innerText=a),d&&(d.innerText=s),f&&(f.innerText=n.toFixed(2)),g&&(g.innerText=o);const m=document.getElementById("fb_res_eval");m&&(n<=1?m.innerHTML='<span style="color:green;font-weight:bold;">✅ 完美均衡</span>':n<=3?m.innerHTML='<span style="color:#d97706;font-weight:bold;">⚠️ 基本均衡</span>':m.innerHTML='<span style="color:red;font-weight:bold;">❌ 差异过大</span>'),G()}function G(){const t=document.getElementById("balanceChart"),e=document.getElementById("balanceTableContainer"),a=b.map(n=>n.name),s=b.map(n=>{const r=n.students.map(d=>d.score).sort((d,f)=>d-f),i=Lt(r);return{min:r[0],max:r[r.length-1],q1:i.q1,median:i.q2,q3:i.q3,avg:n.stats.avg,sd:ct(r)}});q&&q.destroy(),q=new Chart(t,{type:"bar",data:{labels:a,datasets:[{label:"平均分",data:s.map(n=>n.avg),type:"scatter",backgroundColor:"#2563eb",borderColor:"#2563eb",pointStyle:"rectRot",pointRadius:6},{label:"分数区间 (Min-Max)",data:s.map(n=>[n.min,n.max]),backgroundColor:"rgba(156, 163, 175, 0.2)",borderColor:"rgba(156, 163, 175, 0.5)",borderWidth:1,barPercentage:.1},{label:"核心分布 (Q1-Q3)",data:s.map(n=>[n.q1,n.q3]),backgroundColor:"rgba(37, 99, 235, 0.5)",borderColor:"#1e40af",borderWidth:1,barPercentage:.6}]},options:{responsive:!0,maintainAspectRatio:!1,plugins:{tooltip:{callbacks:{label:function(n){const r=s[n.dataIndex];if(n.dataset.type==="scatter")return`平均分: ${r.avg.toFixed(2)}`;if(n.datasetIndex===1)return`范围: ${r.min} - ${r.max}`;if(n.datasetIndex===2)return`核心区间: ${r.q1} - ${r.q3}`}}},title:{display:!0,text:"班级分数结构对比 (箱线图)"}},scales:{y:{beginAtZero:!1,title:{display:!0,text:"分数"}}}}});let o='<table class="comparison-table" style="font-size:12px;"><thead><tr><th>班级</th><th>人数</th><th>平均分</th><th>标准差 (SD)</th><th>极差 (Max-Min)</th><th>前25%线 (Q3)</th><th>后25%线 (Q1)</th></tr></thead><tbody>';s.forEach((n,r)=>{o+=`<tr><td>${a[r]}</td><td>${b[r].students.length}</td><td>${n.avg.toFixed(2)}</td><td>${n.sd.toFixed(2)}</td><td>${(n.max-n.min).toFixed(1)}</td><td>${n.q3}</td><td>${n.q1}</td></tr>`}),e.innerHTML=o+"</tbody></table>"}const W={past:[],future:[],limit:20,record:function(){if(E===-1)return;const t=b[E],e=JSON.parse(JSON.stringify(t));this.past.push(e),this.past.length>this.limit&&this.past.shift(),this.future=[],this.updateUI()},undo:function(){if(this.past.length===0)return;const t=JSON.parse(JSON.stringify(b[E]));this.future.push(t);const e=this.past.pop();b[E]=e,this.refreshView("已撤销 ↩")},redo:function(){if(this.future.length===0)return;const t=JSON.parse(JSON.stringify(b[E]));this.past.push(t);const e=this.future.pop();b[E]=e,this.refreshView("已重做 ↪")},refreshView:function(t){A(),this.updateUI(),UI.toast(t,"info")},updateUI:function(){const t=document.getElementById("btn_undo"),e=document.getElementById("btn_redo");t&&(t.disabled=this.past.length===0,t.className=this.past.length>0?"btn btn-primary":"btn btn-gray"),e&&(e.disabled=this.future.length===0,e.className=this.future.length>0?"btn btn-primary":"btn btn-gray")},reset:function(){this.past=[],this.future=[],this.updateUI()}};function ft(t){W.reset(),E=t;const e=b[t];document.getElementById("seat_class_title").innerText=e.name,document.getElementById("fb_seat_view").classList.remove("hidden"),document.getElementById("fb_seat_view").scrollIntoView({behavior:"smooth"}),updateConstraintWidgetsContext("fb"),e.seatLayout?A():K(),N()}const R=Object.create(null);function At(t){const e=String(t||"").trim(),a=[],s=o=>{const n=String(o||"").trim();!n||a.includes(n)||a.push(n)};if(s(e),window.location&&window.location.protocol==="file:"&&e.startsWith("./assets/")){const o=e.replace(/^\.\//,"");s(`./public/${o}`),s(`./dist/${o}`)}return a}function ut(t){return String(t||"").replace(/<\/script/gi,"<\\/script")}async function Q(t,e){if(R[t])return R[t];const a=Array.from(document.querySelectorAll(`script[data-standalone-lib="${t}"]`));for(const n of a){const r=String(n.textContent||"").trim();if(!n.src&&r)return R[t]=r,r}const s=[];a.forEach(n=>{const r=String(n.getAttribute("src")||n.src||"").trim();r&&!s.includes(r)&&s.push(r)}),At(e).forEach(n=>{s.includes(n)||s.push(n)});let o=null;for(const n of s)try{const r=await fetch(n,{cache:"force-cache"});if(!r.ok)throw new Error(`HTTP ${r.status}`);const i=await r.text();if(!i.trim())throw new Error("EMPTY_SOURCE");return R[t]=i,i}catch(r){o=r instanceof Error?r:new Error(String(r))}throw o||new Error(`${t} source unavailable`)}async function Ct(){const[t,e]=await Promise.all([Q("crypto-js","./assets/vendor/crypto-js/crypto-js.min.js"),Q("chart.js","./assets/vendor/chart.js/chart.umd.min.js")]);return{cryptoJsSource:ut(t),chartJsSource:ut(e)}}async function Ft(){const t=document.getElementById("studentSchoolSelect").value;if(!t||t.includes("请选择"))return alert("请先选择一个学校，系统将生成该校的查分包。");if(typeof CryptoJS=="undefined")try{const u=await Q("crypto-js","./assets/vendor/crypto-js/crypto-js.min.js");window.eval(u)}catch(u){return console.error("[InquiryPackage] crypto-js load failed:",u),alert("❌ 导出失败：加密库未加载完成，请刷新页面后重试。")}const e=SCHOOLS[t].students;if(!e||e.length===0)return alert("该学校无数据");const a=Object.keys(SCHOOLS).length<=1,s={};SUBJECTS.forEach(u=>{const y=RAW_DATA.map(w=>w.scores[u]).filter(w=>typeof w=="number");if(y.length>0){const B=y.reduce((k,I)=>k+I,0)/y.length,x=y.reduce((k,I)=>k+Math.pow(I-B,2),0)/y.length;s[u]={avg:B,sd:Math.sqrt(x)}}else s[u]={avg:0,sd:1}});const o={};e.forEach(u=>{const y=(u.class+"_"+u.name).replace(/\s+/g,""),w={},B={labels:[],data:[]},x={labels:[],data:[]},k=typeof hasStudentClassRankScope=="function"?hasStudentClassRankScope(u):!0,I=typeof isCountyDirectStudentForRank=="function"?!isCountyDirectStudentForRank(u):!0;SUBJECTS.forEach(l=>{if(u.scores[l]!==void 0){w[l]=[u.scores[l],safeGet(u,`ranks.${l}.school`,"-"),I?safeGet(u,`ranks.${l}.township`,"-"):"-"];const v=RAW_DATA.map(H=>H.scores[l]).filter(H=>H!==void 0).sort((H,$t)=>$t-H),_=v.indexOf(u.scores[l])+1,M=v.length,C=((1-_/M)*100).toFixed(1);B.labels.push(l),B.data.push(C);const O=s[l];let It=0;O&&O.sd>0&&(It=(u.scores[l]-O.avg)/O.sd),x.labels.push(l),x.data.push(parseFloat(It.toFixed(2)))}});const X=`${u.school}_${u.class}_${u.name}`,ot=readBatchAICacheState()[X]||generateAIComment(u);o[y]={cls:u.class,name:u.name,s:w,t:u.total,tr:I?safeGet(u,"ranks.total.township","-"):"-",sr:safeGet(u,"ranks.total.school","-"),cr:k?safeGet(u,"ranks.total.class","-"):"-",showClassRank:k,showTownRank:I,rd:B,vd:x,cm:ot}});const n=prompt(`🔐 安全设置

请设置一个“访问密码” (例如: 123456)。

家长查询时要求：
1. 输入此密码
2. 输入准确的班级
3. 输入准确的姓名`,"123456");if(n===null)return;if(!n)return alert("❌ 必须设置密码才能生成安全查分包！");const r=JSON.stringify(o),i=CryptoJS.AES.encrypt(r,n).toString();let d=null;try{d=await Ct()}catch(u){return console.error("[InquiryPackage] standalone libs unavailable:",u),alert("❌ 导出失败：查分包依赖未准备好，请刷新页面后重试。")}const f=JSON.stringify(i).replace(/</g,"\\u003c"),g=it().name||"期中考试",m=new Date().toLocaleDateString(),c=`
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${t} - 成绩查询</title>
<script>${d.cryptoJsSource}<\/script>
<script>${d.chartJsSource}<\/script>
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
    <h2>${t} 成绩查询</h2>
    <div class="sub-title">${g} | 发布日期: ${m}</div>

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
    const PAYLOAD = ${f};
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
</html>`,p=new Blob([c],{type:"text/html;charset=utf-8"}),h=document.createElement("a");h.href=URL.createObjectURL(p),h.download=`${t}_查分包_${new Date().getTime()}.html`,document.body.appendChild(h),h.click(),document.body.removeChild(h),alert(`✅ 加密查分包已生成！
文件名：`+h.download+`
访问密码：`+n+`

请将文件发给家长，告知密码。
家长必须输入正确的 [班级] 和 [姓名] 才能查询。`)}function Y(t){return t?t.replace(/，/g,",").replace(/；/g,";").split(/[,;]/).map(e=>e.trim()).filter(e=>e):[]}function pt(t){return t?t.replace(/，/g,",").split(",").map(e=>{const a=e.split("&").map(s=>s.trim());return a.length===2?a:null}).filter(e=>e):[]}function K(){W.record();const t=b[E];let e=t.seatLayout||[];e.length<t.students.length&&(e=[...t.students]);let a={},s=[];e.forEach((l,v)=>{l&&l.locked?a[v]=l:l&&s.push(l)});const o=Y(document.getElementById("fb_c_diff").value),n=Y(document.getElementById("fb_c_vision").value),r=Y(document.getElementById("fb_c_talk").value),i=pt(document.getElementById("fb_c_conflict").value),d=pt(document.getElementById("fb_c_bind").value),f=new Map;d.forEach(l=>{f.set(l[0],l[1]),f.set(l[1],l[0])}),s.forEach(l=>{l._isDiff=!1,l._isVision=!1,(o.includes(l.name)||r.includes(l.name))&&(l._isDiff=!0),n.includes(l.name)&&(l._isVision=!0),l._bindPartner=f.get(l.name)});const g=document.getElementById("rule_s_height").checked,m=document.getElementById("rule_s_vision").checked,c=document.getElementById("rule_s_gender").checked,p=document.getElementById("rule_s_diff").checked;g&&s.sort((l,v)=>l.height-v.height);let h=[],u=new Set,y=[];s.forEach(l=>{if(l._bindPartner&&!u.has(l.name)){const v=s.find(_=>_.name===l._bindPartner);if(v){u.add(l.name),u.add(v.name);const _=[l,v].sort((M,C)=>M.height-C.height);h.push(_)}else y.push(l)}else u.has(l.name)||y.push(l)});let w=[],B=[],x=[];if(y.forEach(l=>{n.length>0&&l._isVision?B.push(l):x.push(l)}),h.forEach(l=>{const v=l.some(_=>_._isVision);if(n.length>0&&v)B.push(l[0],l[1]);else{const _=(l[0].height+l[1].height)/2;let M=!1;for(let C=0;C<x.length;C++)if(x[C].height>_){x.splice(C,0,l[0],l[1]),M=!0;break}M||x.push(l[0],l[1])}}),s=[...B,...x],n.length>0||m){const l=s.filter(_=>_._isVision||m&&_.vision<4.8),v=s.filter(_=>!_._isVision&&!(m&&_.vision<4.8));s=[...l,...v]}const k=s.filter(l=>l._isDiff||p&&l.isDiff);if(k.length>0){const l=s.filter(M=>!M._isDiff&&!(p&&M.isDiff)),v=Math.floor(l.length/(k.length+1));let _=v;k.forEach(M=>{_<l.length?l.splice(_,0,M):l.push(M),_+=v+1}),s=l}if(c){for(let l=0;l<s.length-1;l+=2)if(s[l].gender===s[l+1].gender){for(let v=l+2;v<s.length;v++)if(s[v].gender!==s[l].gender){[s[l+1],s[v]]=[s[v],s[l+1]];break}}}let I=[],X=0;const ot=Math.max(t.students.length,e.length);for(let l=0;l<ot;l++)a[l]?I[l]=a[l]:X<s.length?I[l]=s[X++]:I[l]=null;t.seatLayout=I,A()}function A(){const t=b[E],e=document.getElementById("seat_map_container");e.innerHTML="";const a=parseInt(document.getElementById("seat_opt_groups").value),s=parseInt(document.getElementById("seat_opt_cols").value);e.style.display="grid",e.style.gridTemplateColumns=`repeat(${a}, 1fr)`,e.style.gap="50px",e.style.alignItems="start",e.style.padding="20px";const o=t.seatLayout||t.students,n=a*s,r=Math.ceil(o.length/n),i=[];for(let d=0;d<a;d++){const f=document.createElement("div");f.className="seat-group",f.style.display="grid",f.style.gridTemplateColumns=`repeat(${s}, 1fr)`,f.style.gap="10px",f.style.position="relative",i.push(f),e.appendChild(f)}for(let d=0;d<r;d++)for(let f=0;f<a;f++)for(let g=0;g<s;g++){const m=d*n+f*s+g,c=o[m],p=document.createElement("div");p.className="desk",c?(c.gender==="M"&&p.classList.add("is-male"),c.gender==="F"&&p.classList.add("is-female"),(c.isDiff||c._isDiff)&&p.classList.add("is-diff"),c.locked&&p.classList.add("locked"),p.draggable=!c.locked,p.dataset.idx=m,p.innerHTML=`<div class="desk-name">${c.name}</div><div class="desk-info"><span>${c.height}cm</span><span>${c.score}</span></div><div class="desk-popover">视力:${c.vision} | 备注:${c.remarks}</div>`,p.oncontextmenu=h=>{h.preventDefault(),Z(m)},c.locked||(p.ondragstart=h=>{h.dataTransfer.setData("text/plain",m),p.classList.add("dragging")},p.ondragend=()=>p.classList.remove("dragging"),p.ondragover=h=>{h.preventDefault(),p.classList.add("drag-over")},p.ondragleave=()=>p.classList.remove("drag-over"),p.ondrop=h=>{h.preventDefault();const u=parseInt(h.dataTransfer.getData("text/plain")),y=m;u!==y&&!o[y].locked&&!o[u].locked&&W.record(),!o[y].locked&&!o[u].locked&&([t.seatLayout[u],t.seatLayout[y]]=[t.seatLayout[y],t.seatLayout[u]],A())})):p.style.visibility="hidden",i[f].appendChild(p)}for(let d=0;d<a;d++){const f=i[d];if(s%2===0)for(let g=0;g<r;g+=2)for(let m=0;m<s;m+=2){const c=document.createElement("div");c.className="learning-group-box",c.style.left=`${m*90-5}px`,c.style.top=`${g*65-5}px`,c.style.width="175px",c.style.height="125px";const p=s/2,h=d*(Math.ceil(r/2)*p)+g/2*p+m/2+1;c.innerHTML=`<div class="learning-group-label">小组 ${h}</div>`,f.appendChild(c)}}}function Z(t){const a=b[E].seatLayout[t];a&&(a.locked=!a.locked,A())}function mt(){const t=document.querySelector(".seat-canvas");t&&t.classList.toggle("view-rotated")}function gt(){if(!b.length)return alert("暂无数据");localStorage.setItem("FB_DATA_BACKUP",JSON.stringify(b)),alert("方案已保存至浏览器缓存")}function ht(){if(!b.length)return alert("无数据");const t=XLSX.utils.book_new(),e=[["班级","座位号","姓名","性别","总分","身高","视力","备注"]];b.forEach(a=>{(a.seatLayout||a.students).forEach((o,n)=>{e.push([a.name,n+1,o.name,o.gender,o.score,o.height,o.vision,o.remarks])})}),XLSX.utils.book_append_sheet(t,XLSX.utils.aoa_to_sheet(e),"分班与座位表"),XLSX.writeFile(t,"新生分班结果.xlsx")}function bt(t){const e="fb_bind_sel_a",a="fb_bind_sel_b",s="widget_fb_bind",o="fb_c_bind",n=document.getElementById(e),r=document.getElementById(a);if(!(!n||!r)){if(!n.value||!r.value)return alert("请先选择两个学生");if(n.value===r.value)return alert("不能选择同一个学生");addTagToWidget(s,o,`${n.value}&${r.value}`),n.value="",r.value=""}}function N(){const t=b[E],e=document.getElementById("seat_scenario_select");if(e){if(e.innerHTML='<option value="">-- 选择方案 --</option>',!t){e.disabled=!0;return}e.disabled=!1,t.scenarios||(t.scenarios={}),Object.keys(t.scenarios).forEach(a=>{e.innerHTML+=`<option value="${a}">${a}</option>`})}}function yt(){const t=b[E];if(!t)return alert("请先打开一个班级座位图");if(!t.seatLayout||t.seatLayout.length===0)return alert("当前座位表为空，无法保存");const e=prompt("请输入方案名称 (如：期中考试、日常、互助组)",`方案 ${Object.keys(t.scenarios||{}).length+1}`);e&&(t.scenarios||(t.scenarios={}),t.scenarios[e]=JSON.parse(JSON.stringify(t.seatLayout)),alert(`方案 [${e}] 保存成功！`),N(),document.getElementById("seat_scenario_select").value=e)}function vt(){const t=document.getElementById("seat_scenario_select");if(!t)return;const e=t.value;if(!e)return;const a=b[E];if(!a)return alert("请先打开一个班级座位图");if(a.scenarios&&a.scenarios[e]){if(!confirm(`确定要加载 [${e}] 方案吗？
当前未保存的修改将丢失。`)){t.value="";return}a.seatLayout=JSON.parse(JSON.stringify(a.scenarios[e])),A()}}function xt(){const t=document.getElementById("seat_scenario_select");if(!t)return;const e=t.value;if(!e)return alert("请先选择一个要删除的方案");if(confirm(`确定要永久删除方案 [${e}] 吗？`)){const a=b[E];if(!a)return alert("请先打开一个班级座位图");delete a.scenarios[e],N()}}function _t(t){const e=t.files[0];if(!e)return;const a=new FileReader;a.onload=function(s){try{const o=new Uint8Array(s.target.result),n=XLSX.read(o,{type:"array"}),r=XLSX.utils.sheet_to_json(n.Sheets[n.SheetNames[0]]);if(!r.length)throw new Error("Excel没有数据");L=r.map(i=>({name:i.姓名||"未知",class:i.班级||i.班||"未知",school:i.学校||"",score:parseFloat(i.总分||i.score||0)})),alert(`✅ 已导入 ${L.length} 名学生，准备进行考场编排。`)}catch(o){alert("读取失败："+o.message)}},a.readAsArrayBuffer(e)}function wt(){if(!L.length)return alert("请先导入学生名单");const t=document.getElementById("exam_prefix").value,e=parseInt(document.getElementById("exam_seats_per_room").value)||30,a=document.getElementById("exam_opt_separate").checked,s=document.getElementById("exam_opt_snake").checked;let o=[...L].sort((r,i)=>i.score-r.score);if(a){let r=0;for(let i=1;i<o.length-1;i++)if(o[i].class===o[i-1].class){let d=!1;for(let f=i+1;f<Math.min(i+15,o.length);f++)if(o[f].class!==o[i].class&&o[f].class!==o[i-1].class){[o[i],o[f]]=[o[f],o[i]],d=!0,r++;break}}r>0&&UI.toast(`已智能微调 ${r} 人次以打散同班同学`,"success")}S=[];const n=4;o.forEach((r,i)=>{r.examNo=t+String(i+1).padStart(3,"0"),r.roomNo=Math.floor(i/e)+1;let d=i%e;if(s){const f=Math.floor(d/n);if(f%2!==0){const g=d%n,m=n-1-g;d=f*n+m}}r.seatNo=d+1,S[r.roomNo-1]||(S[r.roomNo-1]={id:r.roomNo,students:[]}),S[r.roomNo-1].students.push(r)}),s&&S.forEach(r=>r.students.sort((i,d)=>i.seatNo-d.seatNo)),document.getElementById("exam-results-area").classList.remove("hidden"),et(),nt(),st(),at()}function tt(t,e){const a=Array.from(document.querySelectorAll("#exam-results-area .nav-link"));a.forEach(n=>n.classList.remove("active"));const s=e||a.find(n=>{const r=n.getAttribute("onclick")||"";return r.includes(`'${t}'`)||r.includes(`"${t}"`)});s&&s.classList.add("active"),document.getElementById("exam-view-overview").classList.add("hidden"),document.getElementById("exam-view-students").classList.add("hidden"),document.getElementById("exam-view-proctor").classList.add("hidden");const o=document.getElementById("exam-view-"+t);o&&o.classList.remove("hidden")}function et(){const t=document.getElementById("exam_room_grid");t.innerHTML="",S.forEach(e=>{const a=e.students[0].examNo,s=e.students[e.students.length-1].examNo;t.innerHTML+=`<div class="exam-room-card analysis-exam-room-card" onclick="alert('提示：请使用“打印桌贴”功能查看该考场的详细座次表')"><div class="exam-room-title analysis-exam-room-title">第 ${String(e.id).padStart(2,"0")} 考场</div><div class="exam-room-info analysis-exam-room-info"><span>人数: ${e.students.length}</span></div><div class="exam-room-range analysis-exam-room-range">${a} - ${s}</div></div>`})}function nt(){const t=document.querySelector("#exam_student_table tbody");let e="";const a=[...L].sort((s,o)=>s.class!==o.class?String(s.class).localeCompare(String(o.class),void 0,{numeric:!0}):s.examNo.localeCompare(o.examNo));a.slice(0,500).forEach(s=>{e+=`<tr><td>${s.examNo}</td><td>${s.name}</td><td>${s.class}</td><td>${String(s.roomNo).padStart(2,"0")}</td><td>${String(s.seatNo).padStart(2,"0")}</td><td>${s.score}</td></tr>`}),a.length>500&&(e+='<tr><td colspan="6" style="text-align:center">...更多数据请导出Excel查看...</td></tr>'),t.innerHTML=e}function st(){const t=document.querySelector("#exam_proctor_table tbody");let e="";S.forEach(a=>{const s=a.students[0].examNo,o=a.students[a.students.length-1].examNo;e+=`<tr><td>第 ${String(a.id).padStart(2,"0")} 考场</td><td>${a.students.length}</td><td>${s} - ${o}</td><td></td><td></td></tr>`}),t.innerHTML=e}function at(){const t=document.getElementById("batch-print-area-wrapper");if(!t)return;t.innerHTML="";let e="";S.forEach(a=>{let s="";a.students.forEach(o=>{s+=`<div class="exam-print-seat"><div class="exam-print-seat-num">第${String(o.seatNo).padStart(2,"0")}号</div><div class="exam-print-seat-name">${o.name}</div><div class="exam-print-seat-id">考号: ${o.examNo}</div><div style="font-size:10px;">${o.class}</div></div>`}),e+=`<div class="exam-print-page"><div class="exam-print-header">第 ${String(a.id).padStart(2,"0")} 考场座位表 (共${a.students.length}人)</div><div class="exam-print-grid">${s}</div><div style="margin-top:20px; font-size:12px;">监考员签字：_________________   &nbsp;&nbsp;&nbsp; 巡考员签字：_________________</div></div>`}),t.innerHTML=e}function St(){if(!S||S.length===0)return alert("请先点击“一键生成考场安排”");const t=document.getElementById("desk-labels-print-area");t.innerHTML="";let e="";S.forEach(n=>{e+='<div class="desk-label-page">',n.students.forEach(r=>{e+=`
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
                            <span class="dl-room-box">${String(n.id).padStart(2,"0")}场</span>
                            <span class="dl-seat-box">${String(r.seatNo).padStart(2,"0")}座</span>
                        </div>
                    </div>
                `}),e+="</div>"}),t.innerHTML=e,UI.toast("✅ 桌贴生成完毕 (考号最大化)","success");const a=document.getElementById("app"),s=document.getElementById("desk-labels-print-area"),o=a.style.display;a.style.display="none",s.style.display="block",setTimeout(()=>{window.print(),a.style.display=o,s.style.display="none",t.innerHTML=""},500)}function Et(){const t=[...new Set(Object.values(TEACHER_MAP||{}).map(i=>String(i||"").trim()).filter(Boolean))].sort((i,d)=>i.localeCompare(d,"zh-CN")),e=document.getElementById("proctor-teacher-pool"),a=document.getElementById("proctor-role-patrol"),s=document.getElementById("proctor-role-affairs");if(!e||!a||!s)return;const o=Array.from(document.querySelectorAll(".exclude-check:checked")).map(i=>i.value),n=Array.from(a.selectedOptions).map(i=>i.value),r=Array.from(s.selectedOptions).map(i=>i.value);if(!t.length){e.innerHTML='<div style="padding:8px 0; color:#94a3b8;">暂无任课教师数据，请先导入任课表。</div>',a.disabled=!0,s.disabled=!0,a.innerHTML="",s.innerHTML="";return}e.innerHTML=t.map(i=>`
            <label class="teacher-item">
                <input type="checkbox" class="exclude-check" value="${i}" ${o.includes(i)?"checked":""}> ${i}
            </label>
        `).join(""),a.disabled=!1,s.disabled=!1,setMultiSelectOptions(a,t,n),setMultiSelectOptions(s,t,r)}function Bt(){if(!S.length)return alert("请先生成考场安排");const t=[...new Set(Object.values(TEACHER_MAP||{}).map(c=>String(c||"").trim()).filter(Boolean))];if(!t.length)return alert("请先导入任课表，当前没有可用于监考分配的教师。");const e=document.getElementById("proctor-role-patrol"),a=document.getElementById("proctor-role-affairs");if(!e||!a)return alert("监考配置面板未就绪，请刷新页面后重试。");const s=Array.from(document.querySelectorAll(".exclude-check:checked")).map(c=>c.value),o=[...new Set(Array.from(e.selectedOptions).map(c=>c.value))],n=[...new Set(Array.from(a.selectedOptions).map(c=>c.value))],r=n.filter(c=>o.includes(c)),i=n.filter(c=>!o.includes(c));r.length&&(Array.from(a.options).forEach(c=>{c.selected=i.includes(c.value)}),window.UI&&UI.toast(`已自动去重特殊岗位：${r.join("、")}`,"warning"));let d=t.filter(c=>!s.includes(c)&&!o.includes(c)&&!i.includes(c));const f=S.length*2;if(d.length<f)return alert(`❌ 人员不足！
当前考场需要 ${f} 名监考，但排除后仅剩 ${d.length} 人。
请减少排除项或合并岗位。`);d.sort(()=>Math.random()-.5);const g=document.querySelector("#exam_proctor_table tbody");let m="";S.forEach((c,p)=>{const h=d[p*2],u=d[p*2+1],y=c.students[0].examNo,w=c.students[c.students.length-1].examNo;m+=`
                <tr>
                    <td><strong>第 ${String(c.id).padStart(2,"0")} 考场</strong></td>
                    <td>${c.students.length}</td>
                    <td>${y} - ${w}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${h}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${u}</td>
                </tr>
            `}),m+=`
            <tr style="background:#f8fafc; border-top: 2px solid #333;">
                <td colspan="3" style="text-align:right; font-weight:bold;">⚖️ 纪律巡考人员：</td>
                <td colspan="2" style="text-align:left; color:var(--danger); font-weight:bold;">${o.join("、")||"未指定"}</td>
            </tr>
            <tr style="background:#f8fafc;">
                <td colspan="3" style="text-align:right; font-weight:bold;">🧹 卫生考务保障：</td>
                <td colspan="2" style="text-align:left; color:var(--success); font-weight:bold;">${i.join("、")||"未指定"}</td>
            </tr>
        `,g.innerHTML=m,UI.toast("✅ 监考人员分配完成，请查看“监考汇总表”","success"),tt("proctor",document.querySelector('.nav-link[onclick*="proctor"]'))}function kt(){if(!L.length)return alert("无考生数据");if(!S.length)return alert("请先生成考场安排");const t=XLSX.utils.book_new(),e=[["考号","姓名","学校","班级","考场号","座号","参考分"]];L.forEach(n=>e.push([n.examNo,n.name,n.school,n.class,n.roomNo,n.seatNo,n.score]));const a=[["单位/考场","应考人数","起止考号","监考老师 A","监考老师 B"]],s=document.querySelectorAll("#exam_proctor_table tbody tr");s.length===0?alert("⚠️ 提示：您尚未进行“人员配置”或点击“一键编排”。监考表将只包含考生信息。"):s.forEach(n=>{const r=n.querySelectorAll("td"),i=[];r.forEach(d=>i.push(d.innerText)),a.push(i)});const o=[["考场","座号","姓名","考号","班级"]];L.forEach(n=>o.push([n.roomNo,n.seatNo,n.name,n.examNo,n.class])),XLSX.utils.book_append_sheet(t,XLSX.utils.aoa_to_sheet(e),"考生座次总表"),XLSX.utils.book_append_sheet(t,XLSX.utils.aoa_to_sheet(a),"全校监考考务表"),XLSX.utils.book_append_sheet(t,XLSX.utils.aoa_to_sheet(o),"桌贴打印备份"),XLSX.writeFile(t,`${it().name||"学校"}考务编排结果全集.xlsx`)}window.FreshmanExamRuntime={syncFbClasses:Mt,writeFbClasses:rt,get students(){return F},get classes(){return b},get simulatedData(){return P},get examData(){return L},get examRooms(){return S}},typeof lt=="function"&&(window.FB_loadData=lt),typeof dt=="function"&&(window.FB_runDivision=dt),typeof z=="function"&&(window.FB_generateSingleScheme=z),typeof J=="function"&&(window.FB_renderSchemeSelector=J),typeof U=="function"&&(window.FB_applyScheme=U),typeof T=="function"&&(window.FB_calcClassCost=T),typeof D=="function"&&(window.FB_checkConflict=D),typeof V=="function"&&(window.FB_renderDashboard=V),typeof G=="function"&&(window.FB_renderBalanceChart=G),typeof ft=="function"&&(window.FB_openSeatMap=ft),typeof K=="function"&&(window.FB_autoSeatAlgo=K),typeof A=="function"&&(window.FB_renderSeatMap=A),typeof Z=="function"&&(window.FB_toggleLock=Z),typeof mt=="function"&&(window.FB_toggleViewRotation=mt),typeof gt=="function"&&(window.FB_saveToLocal=gt),typeof ht=="function"&&(window.FB_exportResult=ht),typeof bt=="function"&&(window.addBindPair=bt),typeof N=="function"&&(window.FB_initScenarioSelect=N),typeof yt=="function"&&(window.FB_saveScenario=yt),typeof vt=="function"&&(window.FB_loadScenario=vt),typeof xt=="function"&&(window.FB_deleteScenario=xt),typeof _t=="function"&&(window.EXAM_loadData=_t),typeof wt=="function"&&(window.EXAM_generate=wt),typeof tt=="function"&&(window.EXAM_switchView=tt),typeof et=="function"&&(window.EXAM_renderOverview=et),typeof nt=="function"&&(window.EXAM_renderStudentList=nt),typeof st=="function"&&(window.EXAM_renderProctorTable=st),typeof at=="function"&&(window.EXAM_renderPrintView=at),typeof St=="function"&&(window.EXAM_generateDeskLabels=St),typeof Et=="function"&&(window.EXAM_initProctorUI=Et),typeof Bt=="function"&&(window.EXAM_assignProctors=Bt),typeof kt=="function"&&(window.EXAM_exportResult=kt),window.__FRESHMAN_EXAM_RUNTIME_PATCHED__=!0})();
