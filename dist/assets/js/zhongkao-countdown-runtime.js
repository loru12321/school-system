(function(y){if(y.ZhongkaoCountdownModule)return;const w="SYSTEM_ZHONGKAO_COUNTDOWN_CONFIG_V1",M=1,L=1440*60*1e3,e={config:null,root:null,el:{},autoSaveTimer:null,clockTimer:null,noticeTimer:null,mounted:!1};function b(){return{version:M,examDate:"2026-06-13",excludeWeekends:!0,holidays:[],officialHolidays:{},lastSyncedAt:""}}function S(t="",a="",n=""){return{id:typeof crypto!="undefined"&&crypto.randomUUID?crypto.randomUUID():`zkc-${Date.now()}-${Math.random().toString(16).slice(2)}`,name:t,start:a,end:n}}function s(t){return typeof t=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(t.trim())?t.trim():""}function g(t){const a=s(t);if(!a)return null;const[n,o,i]=a.split("-").map(Number),c=new Date(n,o-1,i);return c.setHours(0,0,0,0),c.getFullYear()!==n||c.getMonth()!==o-1||c.getDate()!==i?null:c}function C(t){return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}function I(t){const a=g(t);return a?a.toLocaleDateString("zh-CN",{year:"numeric",month:"long",day:"numeric"}):t}function O(t,a){const n=new Date(t);return n.setDate(n.getDate()+a),n}function A(t){if(!t||typeof t!="object")return null;const a=S(typeof t.name=="string"?t.name.trim():"",s(t.start),s(t.end));return typeof t.id=="string"&&t.id.trim()&&(a.id=t.id.trim()),a}function W(t){if(!t||typeof t!="object")return{};const a={};return Object.entries(t).forEach(([n,o])=>{const i=s(n);!i||!o||typeof o!="object"||(a[i]={isHoliday:!!o.isHoliday,name:typeof o.name=="string"&&o.name.trim()?o.name.trim():o.isHoliday?"法定节假日":"调休上课"})}),a}function k(t){const a=b();return!t||typeof t!="object"||(a.examDate=s(t.examDate)||a.examDate,a.excludeWeekends=t.excludeWeekends!==!1,a.holidays=Array.isArray(t.holidays)?t.holidays.map(A).filter(Boolean):[],a.officialHolidays=W(t.officialHolidays),a.lastSyncedAt=typeof t.lastSyncedAt=="string"?t.lastSyncedAt:""),a}function F(){if(document.getElementById("zkc-runtime-style"))return;const t=document.createElement("style");t.id="zkc-runtime-style",t.textContent=`
            .zkc-shell{display:grid;gap:18px}
            .zkc-toolbar,.zkc-card,.zkc-stat{background:rgba(255,255,255,.9);border:1px solid rgba(148,163,184,.16);border-radius:24px;box-shadow:0 18px 44px rgba(15,23,42,.06)}
            .zkc-toolbar{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:24px;background:linear-gradient(135deg,rgba(17,24,39,.96),rgba(31,41,55,.92) 45%,rgba(244,114,182,.84))}
            .zkc-toolbar-copy{display:grid;gap:10px;color:#fff;max-width:620px}
            .zkc-kicker{display:inline-flex;align-items:center;gap:8px;width:max-content;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.16);font-size:12px;font-weight:700;letter-spacing:.04em}
            .zkc-toolbar h3{margin:0;font-size:30px;line-height:1.1;color:#fff}
            .zkc-toolbar p{margin:0;color:rgba(255,255,255,.84);line-height:1.7}
            .zkc-toolbar-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;align-items:center}
            .zkc-clock{display:inline-flex;align-items:center;justify-content:center;min-width:124px;padding:11px 14px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.18);font-size:15px;font-weight:700;color:#fff;font-family:"SFMono-Regular","Consolas","Menlo",monospace}
            .zkc-toolbar-actions .btn{min-height:42px}
            .zkc-notice{padding:14px 16px;border-radius:18px;font-size:14px;line-height:1.6}
            .zkc-notice.is-hidden{display:none}
            .zkc-notice.info{background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe}
            .zkc-notice.success{background:#ecfdf5;color:#047857;border:1px solid #a7f3d0}
            .zkc-notice.error{background:#fff1f2;color:#be123c;border:1px solid #fecdd3}
            .zkc-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
            .zkc-stat{padding:20px}
            .zkc-stat-label{font-size:13px;font-weight:700;color:#64748b}
            .zkc-stat-value{margin-top:10px;font-size:42px;line-height:1;font-weight:800;color:#0f172a}
            .zkc-stat-tip{margin-top:8px;font-size:13px;line-height:1.7;color:#64748b}
            .zkc-grid{display:grid;grid-template-columns:1.04fr .96fr;gap:18px}
            .zkc-card{padding:22px}
            .zkc-card-head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;margin-bottom:18px}
            .zkc-card-head h4{margin:0;font-size:20px;color:#0f172a}
            .zkc-card-head p{margin:6px 0 0;color:#64748b;line-height:1.7}
            .zkc-pill{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:12px;font-weight:700}
            .zkc-pill.ok{background:#ecfdf5;border-color:#a7f3d0;color:#047857}
            .zkc-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
            .zkc-field{display:grid;gap:8px}
            .zkc-field label{font-size:13px;font-weight:700;color:#334155}
            .zkc-field input[type="date"],.zkc-field input[type="text"]{width:100%;min-height:44px;padding:12px 14px;border-radius:14px;border:1px solid #dbe3ef;background:#fff;color:#0f172a;font:inherit}
            .zkc-help{font-size:12px;line-height:1.7;color:#64748b}
            .zkc-check{display:grid;gap:10px;padding:14px;border-radius:18px;background:#f8fafc;border:1px solid #e2e8f0}
            .zkc-check label{display:flex;gap:10px;align-items:flex-start;font-weight:700;color:#334155}
            .zkc-check input{margin-top:3px}
            .zkc-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}
            .zkc-holidays{display:grid;gap:12px}
            .zkc-empty{padding:16px;border-radius:18px;border:1px dashed #cbd5e1;background:#f8fafc;color:#64748b;line-height:1.7}
            .zkc-holiday-row{display:grid;grid-template-columns:minmax(0,1.2fr) repeat(2,minmax(0,1fr)) auto;gap:10px;align-items:center;padding:14px;border-radius:20px;background:#f8fafc;border:1px solid #e2e8f0}
            .zkc-holiday-row .btn{min-height:44px}
            .zkc-summary{font-size:16px;line-height:1.9;color:#0f172a}
            .zkc-meta{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
            .zkc-chip{display:inline-flex;align-items:center;padding:8px 12px;border-radius:999px;background:#f8fafc;border:1px solid #e2e8f0;color:#475569;font-size:13px;font-weight:700}
            .zkc-footer{margin-top:18px;font-size:13px;line-height:1.8;color:#64748b}
            @media (max-width: 1100px){.zkc-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.zkc-grid{grid-template-columns:1fr}}
            @media (max-width: 760px){.zkc-toolbar{padding:20px}.zkc-toolbar h3{font-size:24px}.zkc-toolbar-actions{justify-content:flex-start}.zkc-stats{grid-template-columns:1fr}.zkc-form-grid{grid-template-columns:1fr}.zkc-holiday-row{grid-template-columns:1fr}}
        `,document.head.appendChild(t)}function R(){return`
            <div class="zkc-shell">
                <div class="zkc-toolbar">
                    <div class="zkc-toolbar-copy">
                        <span class="zkc-kicker"><i class="ti ti-calendar-event"></i> 中考冲刺工具</span>
                        <h3>中考倒计时</h3>
                        <p>默认按 2026-06-13 计算，支持普通周末扣减、法定节假日同步、自定义长假，以及通过文件保存和恢复设置。</p>
                    </div>
                    <div class="zkc-toolbar-actions">
                        <div class="zkc-clock" data-zk="liveClock">--:--:--</div>
                        <button type="button" class="btn btn-gray" data-zk-action="export">保存到文件</button>
                        <button type="button" class="btn btn-gray" data-zk-action="import">从文件恢复</button>
                        <button type="button" class="btn btn-orange" data-zk-action="sync">同步节假日</button>
                        <input type="file" hidden accept=".json,application/json" data-zk="fileInput">
                    </div>
                </div>

                <div class="zkc-notice is-hidden info" data-zk="noticeBar" role="status" aria-live="polite"></div>

                <div class="zkc-stats">
                    <div class="zkc-stat"><div class="zkc-stat-label">自然日倒计时</div><div class="zkc-stat-value" data-zk="totalDays">--</div><div class="zkc-stat-tip">从明天开始，统计到考试当天。</div></div>
                    <div class="zkc-stat"><div class="zkc-stat-label">预计有效学习日</div><div class="zkc-stat-value" data-zk="studyDays">--</div><div class="zkc-stat-tip">已按假期、法定节假日和普通周末扣减。</div></div>
                    <div class="zkc-stat"><div class="zkc-stat-label">普通周末休息</div><div class="zkc-stat-value" data-zk="weekendDays">--</div><div class="zkc-stat-tip">不会与调休上课或自定义假期重复扣减。</div></div>
                    <div class="zkc-stat"><div class="zkc-stat-label">假期休息</div><div class="zkc-stat-value" data-zk="holidayDays">--</div><div class="zkc-stat-tip">包含自定义长假与法定节假日。</div></div>
                </div>

                <div class="zkc-grid">
                    <div class="zkc-card">
                        <div class="zkc-card-head">
                            <div>
                                <h4>基础设置</h4>
                                <p>系统按“自定义假期 &gt; 法定节假日/调休 &gt; 普通周末”的优先级计算。</p>
                            </div>
                            <span class="zkc-pill" data-zk="cacheStatus">尚未同步法定节假日</span>
                        </div>
                        <div class="zkc-form-grid">
                            <div class="zkc-field">
                                <label for="zkcExamDate">中考日期</label>
                                <input id="zkcExamDate" type="date" data-zk="examDate">
                                <div class="zkc-help">默认：2026-06-13。日期按本地时区解析，避免偏移一天。</div>
                            </div>
                            <div class="zkc-check">
                                <label for="zkcExcludeWeekends">
                                    <input id="zkcExcludeWeekends" type="checkbox" checked data-zk="excludeWeekends">
                                    <span>将普通周末计为休息日</span>
                                </label>
                                <div class="zkc-help">若学校存在常态化周末上课，可以关闭这一项。</div>
                            </div>
                        </div>
                        <div class="zkc-actions">
                            <button type="button" class="btn btn-primary" data-zk-action="save">保存并重新计算</button>
                            <button type="button" class="btn btn-gray" data-zk-action="reset">恢复默认设置</button>
                        </div>
                    </div>

                    <div class="zkc-card">
                        <div class="zkc-card-head">
                            <div>
                                <h4>自定义长假</h4>
                                <p>适合填写寒假、暑假、校庆放假或本地统一放假区间。</p>
                            </div>
                            <button type="button" class="btn btn-gray" data-zk-action="addHoliday">添加假期</button>
                        </div>
                        <div class="zkc-holidays" data-zk="holidayList"></div>
                    </div>
                </div>

                <div class="zkc-card">
                    <div class="zkc-card-head">
                        <div>
                            <h4>计算摘要</h4>
                            <p>输入会实时预览，保存后会持久写入当前浏览器本地。适合快速看剩余时间和复习节奏。</p>
                        </div>
                    </div>
                    <div class="zkc-summary" data-zk="summaryText">默认按 2026-06-13 计算，可自行修改日期。</div>
                    <div class="zkc-meta" data-zk="summaryMeta"></div>
                    <div class="zkc-footer"><strong>说明：</strong>如果存在调休上课日，系统会优先把它视为上课日，不会再被周末规则扣除；从文件恢复时也会自动兼容旧字段。</div>
                </div>
            </div>
        `}function Y(){e.el={noticeBar:e.root.querySelector('[data-zk="noticeBar"]'),totalDays:e.root.querySelector('[data-zk="totalDays"]'),studyDays:e.root.querySelector('[data-zk="studyDays"]'),weekendDays:e.root.querySelector('[data-zk="weekendDays"]'),holidayDays:e.root.querySelector('[data-zk="holidayDays"]'),examDate:e.root.querySelector('[data-zk="examDate"]'),excludeWeekends:e.root.querySelector('[data-zk="excludeWeekends"]'),cacheStatus:e.root.querySelector('[data-zk="cacheStatus"]'),holidayList:e.root.querySelector('[data-zk="holidayList"]'),summaryText:e.root.querySelector('[data-zk="summaryText"]'),summaryMeta:e.root.querySelector('[data-zk="summaryMeta"]'),liveClock:e.root.querySelector('[data-zk="liveClock"]'),fileInput:e.root.querySelector('[data-zk="fileInput"]'),saveBtn:e.root.querySelector('[data-zk-action="save"]'),resetBtn:e.root.querySelector('[data-zk-action="reset"]'),syncBtn:e.root.querySelector('[data-zk-action="sync"]'),exportBtn:e.root.querySelector('[data-zk-action="export"]'),importBtn:e.root.querySelector('[data-zk-action="import"]'),addHolidayBtn:e.root.querySelector('[data-zk-action="addHoliday"]')}}function N(){const t=localStorage.getItem(w);if(!t){e.config=b();return}try{e.config=k(JSON.parse(t))}catch(a){console.error("[zhongkao-countdown] config read failed:",a),e.config=b(),m(),d("本地倒计时配置读取失败，已恢复默认设置。","error",4200)}}function m(){localStorage.setItem(w,JSON.stringify(e.config))}function v(){const t=Array.from(e.el.holidayList.querySelectorAll(".zkc-holiday-row")).map(a=>{var n,o,i;return{id:a.dataset.id||S().id,name:((n=a.querySelector(".zkc-holiday-name"))==null?void 0:n.value.trim())||"",start:s(((o=a.querySelector(".zkc-holiday-start"))==null?void 0:o.value)||""),end:s(((i=a.querySelector(".zkc-holiday-end"))==null?void 0:i.value)||"")}});return{examDate:s(e.el.examDate.value),excludeWeekends:e.el.excludeWeekends.checked,holidays:t}}function $(t){if(e.el.holidayList.replaceChildren(),!t.length){const a=document.createElement("div");a.className="zkc-empty",a.textContent="当前还没有自定义假期，点击“添加假期”即可新增区间。",e.el.holidayList.appendChild(a);return}t.forEach(a=>{const n=document.createElement("div");n.className="zkc-holiday-row",n.dataset.id=a.id;const o=document.createElement("input");o.type="text",o.className="zkc-holiday-name",o.placeholder="假期名称，例如：寒假",o.value=a.name,o.addEventListener("input",x);const i=document.createElement("input");i.type="date",i.className="zkc-holiday-start",i.value=a.start,i.addEventListener("change",x);const c=document.createElement("input");c.type="date",c.className="zkc-holiday-end",c.value=a.end,c.addEventListener("change",x);const r=document.createElement("button");r.type="button",r.className="btn btn-gray",r.textContent="删除",r.addEventListener("click",()=>{n.remove(),h(!1)}),n.append(o,i,c,r),e.el.holidayList.appendChild(n)})}function D(){e.el.examDate.value=e.config.examDate||"",e.el.excludeWeekends.checked=e.config.excludeWeekends,$(e.config.holidays),E()}function E(){const t=Object.keys(e.config.officialHolidays).length;if(!t){e.el.cacheStatus.className="zkc-pill",e.el.cacheStatus.textContent="尚未同步法定节假日";return}const a=e.config.lastSyncedAt?` · ${new Date(e.config.lastSyncedAt).toLocaleString("zh-CN",{hour12:!1})}`:"";e.el.cacheStatus.className="zkc-pill ok",e.el.cacheStatus.textContent=`已缓存 ${t} 天法定数据${a}`}function T(t){if(!t){e.el.totalDays.textContent="--",e.el.studyDays.textContent="--",e.el.weekendDays.textContent="--",e.el.holidayDays.textContent="--";return}e.el.totalDays.textContent=String(t.totalDays),e.el.studyDays.textContent=String(t.studyDays),e.el.weekendDays.textContent=String(t.weekendDays),e.el.holidayDays.textContent=String(t.holidayDays)}function B(t,a){e.el.summaryText.textContent=t,e.el.summaryMeta.replaceChildren(),a.forEach(n=>{const o=document.createElement("span");o.className="zkc-chip",o.textContent=n,e.el.summaryMeta.appendChild(o)})}function d(t,a="info",n=0){window.clearTimeout(e.noticeTimer),e.el.noticeBar.className=`zkc-notice ${a}`,e.el.noticeBar.textContent=t,n>0&&(e.noticeTimer=window.setTimeout(()=>{e.el.noticeBar.textContent===t&&(e.el.noticeBar.className="zkc-notice is-hidden info",e.el.noticeBar.textContent="")},n))}function H(){e.el.liveClock&&(e.el.liveClock.textContent=new Date().toLocaleTimeString("zh-CN",{hour12:!1}))}function _(){H(),e.clockTimer&&window.clearInterval(e.clockTimer),e.clockTimer=window.setInterval(H,1e3)}function J(t){const a=t.map(o=>{const i=g(o.start),c=g(o.end);return!i||!c?null:{start:Math.min(i.getTime(),c.getTime()),end:Math.max(i.getTime(),c.getTime())}}).filter(Boolean).sort((o,i)=>o.start-i.start);if(!a.length)return[];const n=[a[0]];for(let o=1;o<a.length;o+=1){const i=a[o],c=n[n.length-1];i.start<=c.end+L?c.end=Math.max(c.end,i.end):n.push(i)}return n}function U(t,a){return a.some(n=>t>=n.start&&t<=n.end)}function f(){const t=v(),a=g(t.examDate),n=new Date;if(n.setHours(0,0,0,0),!a){T(null),B("请选择中考日期后开始计算。系统会从明天开始统计，一直算到考试当天。",["支持本地保存","支持保存到文件和从文件恢复","支持联网同步法定节假日"]);return}if(a<=n){T({totalDays:0,studyDays:0,weekendDays:0,holidayDays:0}),B(`考试日期 ${I(t.examDate)} 已到达或已过去，当前倒计时已归零。`,["如需继续使用，请修改为新的考试日期"]);return}const o=J(t.holidays),i=Math.round((a.getTime()-n.getTime())/L);let c=0,r=0,l=0,z=0;const u=new Date(n);for(u.setDate(u.getDate()+1);u<=a;){const ae=u.getTime(),q=C(u),j=u.getDay();let p=!1;U(ae,o)&&(l+=1,p=!0),!p&&e.config.officialHolidays[q]&&(e.config.officialHolidays[q].isHoliday?l+=1:(z+=1,c+=1),p=!0),!p&&t.excludeWeekends&&(j===0||j===6)&&(r+=1,p=!0),p||(c+=1),u.setDate(u.getDate()+1)}T({totalDays:i,studyDays:c,weekendDays:r,holidayDays:l}),B(`距离 ${I(t.examDate)} 还有 ${i} 天，其中预计可用于高强度复习的时间约为 ${c} 天。`,[`统计区间：${C(O(n,1))} 至 ${t.examDate}`,`普通周末休息：${r} 天`,`假期休息：${l} 天`,`调休上课：${z} 天`])}function h(t){e.config=k({...e.config,...v()}),m(),E(),f(),t&&d("倒计时设置已保存，并重新计算。","success",2800)}function x(){window.clearTimeout(e.autoSaveTimer),e.autoSaveTimer=window.setTimeout(()=>h(!1),160)}function G(){const t=v().holidays;t.push(S("","","")),e.config=k({...e.config,holidays:t}),$(e.config.holidays),h(!1)}function K(){window.confirm("恢复默认设置会清空当前考试日期、假期设置和法定节假日缓存，是否继续？")&&(e.config=b(),m(),D(),f(),d("已恢复默认倒计时设置。","success",2800))}function V(){const t=new Set([new Date().getFullYear()]),a=g(e.el.examDate.value);return t.add(a?a.getFullYear():new Date().getFullYear()+1),Array.from(t).sort((n,o)=>n-o)}async function Z(t){const a=new AbortController,n=window.setTimeout(()=>a.abort(),8e3);try{const o=await fetch(`https://timor.tech/api/holiday/year/${t}`,{signal:a.signal});if(!o.ok)throw new Error(`HTTP ${o.status}`);const i=await o.json();if(i.code!==0||!i.holiday||typeof i.holiday!="object")throw new Error("返回数据格式不符合预期。");const c={};return Object.entries(i.holiday).forEach(([r,l])=>{const z=s(l.date||`${t}-${r}`);z&&(c[z]={isHoliday:!!l.holiday,name:typeof l.name=="string"&&l.name.trim()?l.name.trim():l.holiday?"法定节假日":"调休上课"})}),c}finally{window.clearTimeout(n)}}async function P(){const t=V(),a=e.el.syncBtn.textContent;e.el.syncBtn.disabled=!0,e.el.syncBtn.textContent="同步中...",d(`正在同步 ${t.join("、")} 年的法定节假日，请稍候。`,"info");try{const n={...e.config.officialHolidays};for(const o of t)Object.assign(n,await Z(o));e.config=k({...e.config,...v(),officialHolidays:n,lastSyncedAt:new Date().toISOString()}),m(),E(),f(),d(`同步完成，当前已缓存 ${Object.keys(e.config.officialHolidays).length} 天法定节假日数据。`,"success",3800)}catch(n){console.error("[zhongkao-countdown] holiday sync failed:",n),d("同步失败：请检查网络连接或稍后重试。原有缓存已保留。","error",4200)}finally{e.el.syncBtn.disabled=!1,e.el.syncBtn.textContent=a}}function Q(){h(!1),y.ConfigTransferRuntime.downloadJson({...e.config,exportedAt:new Date().toISOString()},{fileName:`zhongkao-countdown-settings-${C(new Date)}.json`}),d("当前倒计时设置已保存到文件。","success",2400)}async function X(t){const a=t.target.files&&t.target.files[0];if(a)try{const n=await y.ConfigTransferRuntime.readJson(a);e.config=k({...e.config,...n}),m(),D(),f(),d("已从文件恢复倒计时设置，并重新计算。","success",3200)}catch(n){console.error("[zhongkao-countdown] import failed:",n),d("恢复失败：文件内容不是有效的设置 JSON。","error",4200)}finally{t.target.value=""}}function ee(){e.el.examDate.addEventListener("change",x),e.el.excludeWeekends.addEventListener("change",x),e.el.saveBtn.addEventListener("click",()=>h(!0)),e.el.resetBtn.addEventListener("click",K),e.el.syncBtn.addEventListener("click",P),e.el.exportBtn.addEventListener("click",Q),e.el.importBtn.addEventListener("click",()=>e.el.fileInput.click()),e.el.fileInput.addEventListener("change",X),e.el.addHolidayBtn.addEventListener("click",G),window.addEventListener("storage",t=>{t.key===w&&(N(),D(),f(),d("检测到其他页面更新了倒计时配置，当前页面已同步。","info",3200))})}function te(){e.root=document.getElementById("zhongkao-countdown"),e.root&&(F(),e.root.innerHTML=R(),Y(),N(),D(),ee(),_(),f(),e.mounted=!0)}y.ZhongkaoCountdownModule={ensureInitialized(){var t;if(!y.ConfigTransferRuntime){console.warn("[zhongkao-countdown] ConfigTransferRuntime is not ready");return}if(!e.mounted||!((t=document.getElementById("zhongkao-countdown"))!=null&&t.querySelector(".zkc-shell"))){te();return}H(),f()}}})(window);
