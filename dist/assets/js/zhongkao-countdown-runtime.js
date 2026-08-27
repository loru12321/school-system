(function(u){if(u.ZhongkaoCountdownModule)return;const S="SYSTEM_ZHONGKAO_COUNTDOWN_CONFIG_V1",_=1,$=1440*60*1e3,t={config:null,root:null,el:{},autoSaveTimer:null,clockTimer:null,noticeTimer:null,mounted:!1};function b(){return{version:_,examDate:E(),excludeWeekends:!0,holidays:[],officialHolidays:{},lastSyncedAt:""}}function C(e="",a="",n=""){return{id:typeof crypto!="undefined"&&crypto.randomUUID?crypto.randomUUID():`zkc-${Date.now()}-${Math.random().toString(16).slice(2)}`,name:e,start:a,end:n}}function d(e){return typeof e=="string"&&/^\d{4}-\d{2}-\d{2}$/.test(e.trim())?e.trim():""}function p(e){const a=d(e);if(!a)return null;const[n,o,i]=a.split("-").map(Number),r=new Date(n,o-1,i);return r.setHours(0,0,0,0),r.getFullYear()!==n||r.getMonth()!==o-1||r.getDate()!==i?null:r}function E(e=new Date){const a=new Date(e);a.setHours(0,0,0,0);const n=a.getFullYear(),o=new Date(n,5,16);return o.setHours(0,0,0,0),`${a>=o?n+1:n}-06-13`}function J(e){return/^\d{4}-06-13$/.test(String(e||"").trim())}function N(e,a=new Date){const n=d(e),o=E(a);if(!n)return o;const i=p(n),r=new Date(a);return r.setHours(0,0,0,0),J(n)&&i&&i<r?o:n}function v(e){return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,"0")}-${String(e.getDate()).padStart(2,"0")}`}function q(e){const a=p(e);return a?a.toLocaleDateString("zh-CN",{year:"numeric",month:"long",day:"numeric"}):e}function T(e,a){const n=new Date(e);return n.setDate(n.getDate()+a),n}function G(e){if(!e||typeof e!="object")return null;const a=C(typeof e.name=="string"?e.name.trim():"",d(e.start),d(e.end));return typeof e.id=="string"&&e.id.trim()&&(a.id=e.id.trim()),a}function K(e){if(!e||typeof e!="object")return{};const a={};return Object.entries(e).forEach(([n,o])=>{const i=d(n);!i||!o||typeof o!="object"||(a[i]={isHoliday:!!o.isHoliday,name:typeof o.name=="string"&&o.name.trim()?o.name.trim():o.isHoliday?"法定节假日":"调休上课"})}),a}function y(e){const a=b();return!e||typeof e!="object"||(a.examDate=N(e.examDate),a.excludeWeekends=e.excludeWeekends!==!1,a.holidays=Array.isArray(e.holidays)?e.holidays.map(G).filter(Boolean):[],a.officialHolidays=K(e.officialHolidays),a.lastSyncedAt=typeof e.lastSyncedAt=="string"?e.lastSyncedAt:""),a}function V(){if(document.getElementById("zkc-runtime-style"))return;const e=document.createElement("style");e.id="zkc-runtime-style",e.textContent=`
            .zkc-shell{display:grid;gap:18px}
            .zkc-toolbar,.zkc-card,.zkc-stat{background:rgba(255,255,255,.9);border:1px solid rgba(148,163,184,.16);border-radius:24px;box-shadow:0 18px 44px rgba(15,23,42,.06)}
            .zkc-toolbar{position:relative;overflow:hidden;display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:24px;background:linear-gradient(135deg,rgba(255,251,247,.96),rgba(255,244,249,.9) 48%,rgba(235,252,247,.92));border-color:rgba(226,199,190,.56);box-shadow:0 18px 42px rgba(148,93,79,.08)}
            .zkc-toolbar::after{content:"";position:absolute;right:8%;top:16%;width:360px;height:160px;border-radius:999px;background:radial-gradient(circle,rgba(244,114,182,.16),rgba(244,114,182,0) 68%);pointer-events:none}
            .zkc-toolbar-copy{position:relative;z-index:1;display:grid;gap:10px;color:#0f172a;max-width:720px}
            .zkc-kicker{display:inline-flex;align-items:center;gap:8px;width:max-content;padding:8px 14px;border-radius:999px;background:rgba(255,255,255,.72);border:1px solid rgba(203,213,225,.76);font-size:12px;font-weight:800;letter-spacing:.02em;color:#64748b}
            .zkc-toolbar h3{margin:0;font-size:30px;line-height:1.1;color:#0f172a}
            .zkc-toolbar p{margin:0;color:#64748b;line-height:1.8;max-width:680px}
            .zkc-toolbar-actions{display:flex;flex-wrap:wrap;gap:10px;justify-content:flex-end;align-items:center}
            .zkc-clock{position:relative;z-index:1;display:inline-flex;align-items:center;justify-content:center;min-width:124px;padding:11px 14px;border-radius:999px;background:rgba(255,255,255,.78);border:1px solid rgba(203,213,225,.72);font-size:15px;font-weight:800;color:#334155;font-family:"SFMono-Regular","Consolas","Menlo",monospace;box-shadow:0 8px 20px rgba(15,23,42,.05)}
            .zkc-toolbar-actions .btn{position:relative;z-index:1;min-height:42px;border-radius:14px;box-shadow:0 8px 20px rgba(15,23,42,.05)}
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
            @media (max-width: 760px){.zkc-toolbar{padding:20px;flex-direction:column}.zkc-toolbar h3{font-size:24px}.zkc-toolbar-actions{justify-content:flex-start}.zkc-stats{grid-template-columns:1fr}.zkc-form-grid{grid-template-columns:1fr}.zkc-holiday-row{grid-template-columns:1fr}}
        `,document.head.appendChild(e)}function Z(){return`
            <div class="zkc-shell">
                <div class="zkc-toolbar">
                    <div class="zkc-toolbar-copy">
                        <span class="zkc-kicker"><i class="ti ti-calendar-event"></i> 中考时间轴</span>
                        <h3>中考倒计时</h3>
                        <p>每年 6 月 16 日起自动切到下一年 6 月 13 日；可同步法定节假日、扣减普通周末，也支持自定义长假与文件备份。</p>
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
                                <div class="zkc-help">系统按年度自动切换：6 月 15 日前沿用当年目标，6 月 16 日起切到下一年 6 月 13 日。</div>
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
                    <div class="zkc-summary" data-zk="summaryText">默认按年度中考日期自动计算，也可自行修改日期。</div>
                    <div class="zkc-meta" data-zk="summaryMeta"></div>
                    <div class="zkc-footer"><strong>说明：</strong>如果存在调休上课日，系统会优先把它视为上课日，不会再被周末规则扣除；从文件恢复时也会自动兼容旧字段。</div>
                </div>
            </div>
        `}function P(){t.el={noticeBar:t.root.querySelector('[data-zk="noticeBar"]'),totalDays:t.root.querySelector('[data-zk="totalDays"]'),studyDays:t.root.querySelector('[data-zk="studyDays"]'),weekendDays:t.root.querySelector('[data-zk="weekendDays"]'),holidayDays:t.root.querySelector('[data-zk="holidayDays"]'),examDate:t.root.querySelector('[data-zk="examDate"]'),excludeWeekends:t.root.querySelector('[data-zk="excludeWeekends"]'),cacheStatus:t.root.querySelector('[data-zk="cacheStatus"]'),holidayList:t.root.querySelector('[data-zk="holidayList"]'),summaryText:t.root.querySelector('[data-zk="summaryText"]'),summaryMeta:t.root.querySelector('[data-zk="summaryMeta"]'),liveClock:t.root.querySelector('[data-zk="liveClock"]'),fileInput:t.root.querySelector('[data-zk="fileInput"]'),saveBtn:t.root.querySelector('[data-zk-action="save"]'),resetBtn:t.root.querySelector('[data-zk-action="reset"]'),syncBtn:t.root.querySelector('[data-zk-action="sync"]'),exportBtn:t.root.querySelector('[data-zk-action="export"]'),importBtn:t.root.querySelector('[data-zk-action="import"]'),addHolidayBtn:t.root.querySelector('[data-zk-action="addHoliday"]')}}function j(){const e=localStorage.getItem(S);if(!e){t.config=b();return}try{t.config=y(JSON.parse(e))}catch(a){console.error("[zhongkao-countdown] config read failed:",a),t.config=b(),x(),s("本地倒计时配置读取失败，已恢复默认设置。","error",4200)}}function x(){localStorage.setItem(S,JSON.stringify(t.config))}function D(){const e=Array.from(t.el.holidayList.querySelectorAll(".zkc-holiday-row")).map(a=>{var n,o,i;return{id:a.dataset.id||C().id,name:((n=a.querySelector(".zkc-holiday-name"))==null?void 0:n.value.trim())||"",start:d(((o=a.querySelector(".zkc-holiday-start"))==null?void 0:o.value)||""),end:d(((i=a.querySelector(".zkc-holiday-end"))==null?void 0:i.value)||"")}});return{examDate:d(t.el.examDate.value),excludeWeekends:t.el.excludeWeekends.checked,holidays:e}}function A(e){if(t.el.holidayList.replaceChildren(),!e.length){const a=document.createElement("div");a.className="zkc-empty",a.textContent="当前还没有自定义假期，点击“添加假期”即可新增区间。",t.el.holidayList.appendChild(a);return}e.forEach(a=>{const n=document.createElement("div");n.className="zkc-holiday-row",n.dataset.id=a.id;const o=document.createElement("input");o.type="text",o.className="zkc-holiday-name",o.placeholder="假期名称，例如：寒假",o.value=a.name,o.addEventListener("input",z);const i=document.createElement("input");i.type="date",i.className="zkc-holiday-start",i.value=a.start,i.addEventListener("change",z);const r=document.createElement("input");r.type="date",r.className="zkc-holiday-end",r.value=a.end,r.addEventListener("change",z);const c=document.createElement("button");c.type="button",c.className="btn btn-gray",c.textContent="删除",c.addEventListener("click",()=>{n.remove(),h(!1)}),n.append(o,i,r,c),t.el.holidayList.appendChild(n)})}function w(){t.el.examDate.value=t.config.examDate||"",t.el.excludeWeekends.checked=t.config.excludeWeekends,A(t.config.holidays),B()}function B(){const e=Object.keys(t.config.officialHolidays).length;if(!e){t.el.cacheStatus.className="zkc-pill",t.el.cacheStatus.textContent="尚未同步法定节假日";return}const a=t.config.lastSyncedAt?` · ${new Date(t.config.lastSyncedAt).toLocaleString("zh-CN",{hour12:!1})}`:"";t.el.cacheStatus.className="zkc-pill ok",t.el.cacheStatus.textContent=`已缓存 ${e} 天法定数据${a}`}function H(e){if(!e){t.el.totalDays.textContent="--",t.el.studyDays.textContent="--",t.el.weekendDays.textContent="--",t.el.holidayDays.textContent="--";return}t.el.totalDays.textContent=String(e.totalDays),t.el.studyDays.textContent=String(e.studyDays),t.el.weekendDays.textContent=String(e.weekendDays),t.el.holidayDays.textContent=String(e.holidayDays)}function L(e,a){t.el.summaryText.textContent=e,t.el.summaryMeta.replaceChildren(),a.forEach(n=>{const o=document.createElement("span");o.className="zkc-chip",o.textContent=n,t.el.summaryMeta.appendChild(o)})}function s(e,a="info",n=0){window.clearTimeout(t.noticeTimer),t.el.noticeBar.className=`zkc-notice ${a}`,t.el.noticeBar.textContent=e,n>0&&(t.noticeTimer=window.setTimeout(()=>{t.el.noticeBar.textContent===e&&(t.el.noticeBar.className="zkc-notice is-hidden info",t.el.noticeBar.textContent="")},n))}function I(){t.el.liveClock&&(t.el.liveClock.textContent=new Date().toLocaleTimeString("zh-CN",{hour12:!1}))}function Q(){I(),t.clockTimer&&window.clearInterval(t.clockTimer),t.clockTimer=window.setInterval(I,1e3)}function X(e){const a=e.map(o=>{const i=p(o.start),r=p(o.end);return!i||!r?null:{start:Math.min(i.getTime(),r.getTime()),end:Math.max(i.getTime(),r.getTime())}}).filter(Boolean).sort((o,i)=>o.start-i.start);if(!a.length)return[];const n=[a[0]];for(let o=1;o<a.length;o+=1){const i=a[o],r=n[n.length-1];i.start<=r.end+$?r.end=Math.max(r.end,i.end):n.push(i)}return n}function ee(e,a){return a.some(n=>e>=n.start&&e<=n.end)}function M(e,a=new Date){var Y;const n=p(e.examDate),o=new Date(a);if(o.setHours(0,0,0,0),!n)return null;if(n<=o)return{expired:!0,totalDays:0,studyDays:0,weekendDays:0,holidayDays:0,adjustedWorkdays:0,classificationStart:"",classificationEnd:""};const i=X(e.holidays||[]),r=Math.round((n.getTime()-o.getTime())/$);let c=0,l=0,g=0,O=0;const m=T(o,1),W=T(n,-1);for(;m<=W;){const le=m.getTime(),F=v(m),R=m.getDay();let k=!1;ee(le,i)&&(g+=1,k=!0);const U=((Y=t.config)==null?void 0:Y.officialHolidays)||{};!k&&U[F]&&(U[F].isHoliday?g+=1:(O+=1,c+=1),k=!0),!k&&e.excludeWeekends&&(R===0||R===6)&&(l+=1,k=!0),k||(c+=1),m.setDate(m.getDate()+1)}return{expired:!1,totalDays:r,studyDays:c,weekendDays:l,holidayDays:g,adjustedWorkdays:O,classificationStart:v(T(o,1)),classificationEnd:v(W)}}function f(){const e=D(),a=M(e);if(!a){H(null),L("请选择中考日期后开始计算。系统会从明天开始统计，一直算到考试当天。",["支持本地保存","支持保存到文件和从文件恢复","支持联网同步法定节假日"]);return}if(a.expired){H(a),L(`考试日期 ${q(e.examDate)} 已到达或已过去，当前倒计时已归零。`,["如需继续使用，请修改为新的考试日期"]);return}H(a),L(`距离 ${q(e.examDate)} 还有 ${a.totalDays} 天，其中预计可用于高强度复习的时间约为 ${a.studyDays} 天。`,[`复习/休息统计区间：${a.classificationStart} 至 ${a.classificationEnd}`,`普通周末休息：${a.weekendDays} 天`,`假期休息：${a.holidayDays} 天`,`调休上课：${a.adjustedWorkdays} 天`])}function h(e){t.config=y({...t.config,...D()}),x(),B(),f(),e&&s("倒计时设置已保存，并重新计算。","success",2800)}function z(){window.clearTimeout(t.autoSaveTimer),t.autoSaveTimer=window.setTimeout(()=>h(!1),160)}function te(){const e=D().holidays;e.push(C("","","")),t.config=y({...t.config,holidays:e}),A(t.config.holidays),h(!1)}async function ae(){(u.UI&&typeof u.UI.confirm=="function"?await u.UI.confirm("恢复默认设置会清空当前考试日期、假期设置和法定节假日缓存，是否继续？",{title:"恢复默认设置",confirmText:"恢复默认",icon:"warning"}):window.confirm("恢复默认设置会清空当前考试日期、假期设置和法定节假日缓存，是否继续？"))&&(t.config=b(),x(),w(),f(),s("已恢复默认倒计时设置。","success",2800))}function ne(){const e=new Set([new Date().getFullYear()]),a=p(t.el.examDate.value);return e.add(a?a.getFullYear():new Date().getFullYear()+1),Array.from(e).sort((n,o)=>n-o)}async function oe(e){const a=new AbortController,n=window.setTimeout(()=>a.abort(),8e3);try{const o=await fetch(`https://timor.tech/api/holiday/year/${e}`,{signal:a.signal});if(!o.ok)throw new Error(`HTTP ${o.status}`);const i=await o.json();if(i.code!==0||!i.holiday||typeof i.holiday!="object")throw new Error("返回数据格式不符合预期。");const r={};return Object.entries(i.holiday).forEach(([c,l])=>{const g=d(l.date||`${e}-${c}`);g&&(r[g]={isHoliday:!!l.holiday,name:typeof l.name=="string"&&l.name.trim()?l.name.trim():l.holiday?"法定节假日":"调休上课"})}),r}finally{window.clearTimeout(n)}}async function ie(){const e=ne(),a=t.el.syncBtn.textContent;t.el.syncBtn.disabled=!0,t.el.syncBtn.textContent="同步中...",s(`正在同步 ${e.join("、")} 年的法定节假日，请稍候。`,"info");try{const n={...t.config.officialHolidays};for(const o of e)Object.assign(n,await oe(o));t.config=y({...t.config,...D(),officialHolidays:n,lastSyncedAt:new Date().toISOString()}),x(),B(),f(),s(`同步完成，当前已缓存 ${Object.keys(t.config.officialHolidays).length} 天法定节假日数据。`,"success",3800)}catch(n){console.error("[zhongkao-countdown] holiday sync failed:",n),s("同步失败：请检查网络连接或稍后重试。原有缓存已保留。","error",4200)}finally{t.el.syncBtn.disabled=!1,t.el.syncBtn.textContent=a}}function re(){h(!1),u.ConfigTransferRuntime.downloadJson({...t.config,exportedAt:new Date().toISOString()},{fileName:`zhongkao-countdown-settings-${v(new Date)}.json`}),s("当前倒计时设置已保存到文件。","success",2400)}async function ce(e){const a=e.target.files&&e.target.files[0];if(a)try{const n=await u.ConfigTransferRuntime.readJson(a);t.config=y({...t.config,...n}),x(),w(),f(),s("已从文件恢复倒计时设置，并重新计算。","success",3200)}catch(n){console.error("[zhongkao-countdown] import failed:",n),s("恢复失败：文件内容不是有效的设置 JSON。","error",4200)}finally{e.target.value=""}}function se(){t.el.examDate.addEventListener("change",z),t.el.excludeWeekends.addEventListener("change",z),t.el.saveBtn.addEventListener("click",()=>h(!0)),t.el.resetBtn.addEventListener("click",ae),t.el.syncBtn.addEventListener("click",ie),t.el.exportBtn.addEventListener("click",re),t.el.importBtn.addEventListener("click",()=>t.el.fileInput.click()),t.el.fileInput.addEventListener("change",ce),t.el.addHolidayBtn.addEventListener("click",te),window.addEventListener("storage",e=>{e.key===S&&(j(),w(),f(),s("检测到其他页面更新了倒计时配置，当前页面已同步。","info",3200))})}function de(){t.root=document.getElementById("zhongkao-countdown"),t.root&&(V(),t.root.innerHTML=Z(),P(),j(),w(),se(),Q(),f(),t.mounted=!0)}u.ZhongkaoCountdownModule={ensureInitialized(){var e;if(!u.ConfigTransferRuntime){console.warn("[zhongkao-countdown] ConfigTransferRuntime is not ready");return}if(!t.mounted||!((e=document.getElementById("zhongkao-countdown"))!=null&&e.querySelector(".zkc-shell"))){de();return}I(),f()},_test:{computeCountdownMetrics:M,getAnnualExamDate:E,resolveAutoExamDate:N,normalizeConfig:y}}})(window);
