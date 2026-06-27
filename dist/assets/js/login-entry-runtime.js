(()=>{if(typeof window=="undefined"||window.__LOGIN_ENTRY_RUNTIME_PATCHED__)return;const _={school:{userPrefix:"User",userPlaceholder:"管理员账号 / 教师姓名",passPrefix:"Password",submit:"进入学校工作台",helper:"当前为学校端，验证通过后进入届别选择和工作台。"},parent:{userPrefix:"Student",userPlaceholder:"请输入学生姓名",passPrefix:"Password",submit:"家长端登录",helper:"家长端统一承接原学生端与家长端入口：填写学生姓名、班级和密码。首次使用默认密钥会被强制修改。"}};function $(){return window.Auth&&typeof window.Auth.getLoginPortal=="function"?window.Auth.getLoginPortal()==="parent"?"parent":"school":localStorage.getItem("LOGIN_PORTAL_V1")==="parent"?"parent":"school"}function A(t,e,o){if(!t)return null;let a=t.closest(".login-entry-field");a||(a=document.createElement("div"),a.className="login-entry-field",a.dataset.loginField=e,t.parentNode.insertBefore(a,t),a.appendChild(t));let n=a.querySelector(".login-entry-prefix");return n||(n=document.createElement("span"),n.className="login-entry-prefix",a.insertBefore(n,a.firstChild)),n.textContent!==o&&(n.textContent=o),a}function E(t=new Date){return String(R(t)-3)}function R(t=new Date){return t.getMonth()>=8?t.getFullYear():t.getFullYear()-1}function N(t=new Date){const e=Number(E(t)),o=[];for(let a=0;a<5;a+=1)o.push(String(e+a));return o}const I="LOGIN_GRADUATE_COHORT_TARGET_V1";function H(t=new Date){const e=Number(E(t)),o=new Set;for(let a=1;a<=6;a+=1){const n=e-a;n>=2e3&&o.add(String(n))}try{const a=JSON.parse(localStorage.getItem("COHORT_LIST")||"[]");(Array.isArray(a)?a:[]).forEach(n=>{var s;const l=((s=String((n==null?void 0:n.id)||(n==null?void 0:n.year)||"").match(/\d{4}/))==null?void 0:s[0])||"";l&&Number(l)<e&&o.add(l)})}catch(a){}return Array.from(o).sort((a,n)=>Number(n)-Number(a))}function D(){try{const t=sessionStorage.getItem(I)||"";return/^\d{4}$/.test(t)?t:""}catch(t){return""}}function x(t){const e=String(t||"").trim();try{/^\d{4}$/.test(e)?sessionStorage.setItem(I,e):sessionStorage.removeItem(I)}catch(o){}return/^\d{4}$/.test(e)?e:""}function Z(){var t;return D()||String(((t=document.getElementById("login-cohort-select"))==null?void 0:t.value)||"").trim()}function tt(t){const e=document.getElementById("login-graduate-cohort-panel"),o=document.getElementById("login-graduate-cohort-select");if(!e||!o)return;const a=H(),n=t!=="parent"&&a.length>0;if(e.hidden=!n,e.style.display=n?"":"none",e.setAttribute("aria-hidden",n?"false":"true"),!n){x("");return}const l=a.join("|");o.dataset.cohortYears!==l&&(o.innerHTML=a.map(r=>`<option value="${r}">${r}届 · 已毕业</option>`).join(""),o.dataset.cohortYears=l);const s=D();e.classList.toggle("is-selected",!!s&&a.includes(s)),s&&a.includes(s)&&(o.value=s)}function et(){const t=document.getElementById("login-graduate-cohort-button"),e=document.getElementById("login-graduate-cohort-select"),o=document.getElementById("login-graduate-cohort-helper"),a=document.getElementById("login-cohort-select");a&&a.dataset.graduateResetBound!=="1"&&(a.dataset.graduateResetBound="1",a.addEventListener("change",()=>{var n;x(""),(n=document.getElementById("login-graduate-cohort-panel"))==null||n.classList.remove("is-selected")})),!(!t||t.dataset.graduateBound==="1")&&(t.dataset.graduateBound="1",t.addEventListener("click",()=>{var s;const n=x((e==null?void 0:e.value)||"");(s=document.getElementById("login-graduate-cohort-panel"))==null||s.classList.toggle("is-selected",!!n),o&&(o.textContent=n?`已选择 ${n}届毕业生档案，登录后进入该届成绩。`:"请选择毕业届。");const l=document.getElementById("login-portal-helper");l&&n&&(l.textContent=`已选择 ${n}届毕业生成绩档案，请完成登录。`)}))}function at(t){var u;const e=(u=document.getElementById("login-pass"))==null?void 0:u.closest(".login-entry-field"),o=document.getElementById("login-form");if(!e||!o)return;let a=document.getElementById("login-cohort-group");a||(a=document.createElement("div"),a.id="login-cohort-group",a.className="login-clean-cohort",a.innerHTML=['<label for="login-cohort-select" class="login-clean-label">选择届别</label>','<div class="login-entry-field login-entry-field--select" data-login-field="cohort">','<span class="login-entry-prefix">Cohort</span>','<select id="login-cohort-select" data-login-cohort-select="1"></select>',"</div>"].join(""),e.insertAdjacentElement("afterend",a));const n=document.getElementById("login-cohort-select");if(!n)return;const l=N(),s=E(),d=n.dataset.cohortInitialized==="1"&&l.includes(n.value)?n.value:s,p=l.map(h=>`<option value="${h}">${h}届</option>`).join("");n.dataset.cohortYears!==l.join("|")&&(n.innerHTML=p,n.dataset.cohortYears=l.join("|")),n.value=d,n.dataset.cohortInitialized="1",a.style.display=t==="parent"?"none":"",a.setAttribute("aria-hidden",t==="parent"?"true":"false"),et(),tt(t)}function nt(){document.querySelectorAll(["#role-student",'label[for="role-student"]',"#form-student",'[data-portal="student"]','[data-login-open="student"]'].join(",")).forEach(t=>t.remove())}function ot(t){const e=document.querySelectorAll('#btn-role-school, [data-portal="school"], [data-login-open="school"]'),o=document.querySelectorAll('#btn-role-parent, [data-portal="parent"], [data-login-open="parent"]');e.forEach(a=>{a.textContent!=="学校端"&&(a.textContent="学校端"),a.classList.toggle("active",t==="school"),a.setAttribute("aria-pressed",t==="school"?"true":"false")}),o.forEach(a=>{a.textContent!=="家长端登录"&&(a.textContent="家长端登录"),a.classList.toggle("active",t==="parent"),a.setAttribute("aria-pressed",t==="parent"?"true":"false")})}function f(){const t=document.getElementById("login-overlay");if(!t)return;const e=$(),o=_[e]||_.school;nt(),ot(e),t.dataset.loginPortal=e,document.querySelectorAll("#login-overlay .advanced-input-group i, #login-overlay .login-field-icon").forEach(p=>p.remove());const a=document.getElementById("login-user"),n=document.getElementById("login-class"),l=document.getElementById("login-pass");A(a,"user",o.userPrefix),A(n,"class","Class"),A(l,"password",o.passPrefix),at(e),a&&(a.placeholder=o.userPlaceholder),n&&(n.placeholder="请输入学生班级，如 701"),l&&(l.placeholder="输入密码");const s=document.getElementById("login-class-group");if(s){const p=e==="parent";s.style.display=p?"block":"none",s.setAttribute("aria-hidden",p?"false":"true")}const r=document.getElementById("login-submit-button");r&&r.dataset.bootBusy!=="1"&&r.textContent!==o.submit&&(r.textContent=o.submit);const d=document.getElementById("login-portal-helper");d&&!String(d.textContent||"").includes("正在")&&d.textContent!==o.helper&&(d.textContent=o.helper)}const lt={getLoginPortal:function(){return window.Auth&&typeof window.Auth.getLoginPortal=="function"?window.Auth.getLoginPortal():$()},ensureSystemIntroModal:function(){return window.Auth&&typeof window.Auth.ensureSystemIntroModal=="function"?window.Auth.ensureSystemIntroModal():null},rebuildInstagramLoginShell:function(){const t=document.getElementById("login-overlay");if(!t)return null;if(t.dataset.igRebuilt==="true")return t;const e=t.dataset.loginPortal==="parent"?"parent":"school";t.dataset.loginPortal=e;const o=`
                <div class="login-shell login-shell--instagram">
                    <section class="login-stage login-stage--instagram" aria-label="系统首页">
                        <nav class="login-stage-nav login-stage-nav--instagram" aria-label="首页导航">
                            <a class="login-stage-brand" href="#login-hero">
                                <span class="login-stage-brand-mark">SE</span>
                                <span class="login-stage-brand-copy">
                                    <strong>校衡台</strong>
                                    <small>教学数据工作台</small>
                                </span>
                            </a>
                            <div class="login-stage-nav-links">
                                <a href="#login-hero" class="active">首页</a>
                                <a href="#login-portal-hub">登录</a>
                                <button type="button" class="login-stage-nav-login" onclick="window.Auth?.openLoginPortalModal('school')">打开学校端</button>
                            </div>
                        </nav>

                        <div id="login-hero" class="login-stage-hero login-stage-hero--instagram">
                            <span id="login-stage-kicker" class="login-stage-hero-kicker">School Command Center</span>
                            <h1 id="login-stage-title">
                                <span class="login-stage-title-line">学校工作台与家长入口</span>
                                <span class="login-stage-title-line login-stage-title-line--accent">在同一张首页里打开登录窗口</span>
                            </h1>
                            <p id="login-stage-copy">把系统说明与登录动作拆开，让首页先呈现品牌感和唯一主入口，再进入真正的登录表单。</p>
                            <div class="login-stage-actions">
                                <button type="button" class="login-stage-primary-action" onclick="window.Auth?.openLoginPortalModal('school')">
                                    <i class="ti ti-building-community"></i> 学校端登录
                                </button>
                                <button type="button" class="login-stage-secondary-action" onclick="window.Auth?.openLoginPortalModal('parent')">
                                    <i class="ti ti-heart-handshake"></i> 家长端登录
                                </button>
                            </div>
                            <div class="login-stage-meta">
                                <span><i class="ti ti-layout-dashboard"></i> 教学分析 / 数据维护 / 学校工作台</span>
                                <span><i class="ti ti-devices"></i> Web / 客户端共用登录入口</span>
                                <span><i class="ti ti-sparkles"></i> 当前稳定版 v1.0 · 2026-04-08</span>
                            </div>
                            <div class="login-stage-platforms" aria-label="支持终端">
                                <span><i class="ti ti-device-desktop"></i> Web</span>
                                <span><i class="ti ti-device-mobile"></i> Android</span>
                                <span><i class="ti ti-brand-windows"></i> Desktop</span>
                            </div>
                        </div>

                        <div class="login-stage-spotlight login-stage-spotlight--instagram">
                            <div class="login-stage-spotlight-grid login-stage-phone-stack">
                                <article class="login-stage-spotlight-item">
                                    <span>学校驾驶舱</span>
                                    <strong>分析、预警、教学联动</strong>
                                </article>
                                <article class="login-stage-spotlight-item">
                                    <span>统一登录窗口</span>
                                    <strong>唯一表单，唯一验证入口</strong>
                                </article>
                                <article class="login-stage-spotlight-item">
                                    <span>家长端</span>
                                    <strong>成长报告、成绩与家校提醒</strong>
                                </article>
                            </div>
                            <div class="login-stage-spotlight-copy">
                                <span class="login-stage-featured-label">Instagram-inspired Entry</span>
                                <strong id="login-stage-featured-title" class="login-stage-featured-title">一屏直达成绩分析、教学管理、质量预警与数据维护</strong>
                                <p id="login-stage-featured-copy" class="login-stage-featured-copy">左侧只负责品牌和场景感，右侧只负责角色选择和打开表单，减少视觉噪音，让登录动作更集中。</p>
                            </div>
                        </div>
                    </section>

                    <section class="login-auth-panel login-auth-panel--instagram" id="login-portal-hub" aria-label="统一登录入口">
                        <div class="login-auth-panel-inner login-auth-panel-inner--instagram">
                            <div class="login-auth-card login-auth-card--portal">
                                <div class="login-auth-head">
                                    <div class="login-brand-block">
                                        <div id="login-portal-badge" class="login-portal-badge">学校工作台</div>
                                        <span class="login-brand-kicker">Login Center</span>
                                        <h2 class="login-auth-title">统一登录入口</h2>
                                        <p id="login-portal-copy">选择学校端或家长端，然后打开唯一登录窗口完成验证。</p>
                                    </div>
                                </div>

                                <div class="login-portal-launch-head">
                                    <span>Choose Portal</span>
                                    <p>先切换角色，再进入唯一登录窗口；学校端与家长端共用同一套视觉与验证路径。</p>
                                </div>

                                <div class="login-portal-grid" aria-label="登录入口选择">
                                    <button type="button" class="login-portal-card active" data-portal="school" data-login-open="school" onclick="window.Auth?.openLoginPortalModal('school')">
                                        <span class="login-portal-icon"><i class="ti ti-building-community"></i></span>
                                        <span class="login-portal-title">学校端</span>
                                        <span class="login-portal-desc">适用于教务、年级、班主任与教师的统一工作台。</span>
                                        <span class="login-portal-meta">Analysis / Data / Workspace</span>
                                        <span class="login-portal-action">打开学校端窗口</span>
                                    </button>
                                    <button type="button" class="login-portal-card" data-portal="parent" data-login-open="parent" onclick="window.Auth?.openLoginPortalModal('parent')">
                                        <span class="login-portal-icon"><i class="ti ti-heart-handshake"></i></span>
                                        <span class="login-portal-title">家长端</span>
                                        <span class="login-portal-desc">输入学生姓名、班级与密码，查看成长报告、成绩与提醒。</span>
                                        <span class="login-portal-meta">Report / Score / Reminder</span>
                                        <span class="login-portal-action">打开家长端窗口</span>
                                    </button>
                                </div>

                                <div class="login-portal-note">
                                    <i class="ti ti-hand-click"></i> 首页只保留角色选择，真正的账号验证统一在登录窗口中完成。
                                </div>
                            </div>

                            <div class="login-auth-footer">
                                <span>Web / Android / Desktop</span>
                                <span>统一账号逻辑</span>
                                <span>更接近 Instagram 的简洁登录骨架</span>
                            </div>
                        </div>
                    </section>
                </div>

                <div id="login-modal-backdrop" class="login-modal-backdrop" style="display:none;" aria-hidden="true" onclick="if(event.target===this) window.Auth?.closeLoginPortalModal()">
                    <div class="login-modal-dialog login-modal-dialog--instagram" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
                        <div class="login-modal-head login-modal-head--instagram">
                            <div class="login-modal-head-top">
                                <span id="login-modal-chip" class="login-modal-chip">学校端登录窗口</span>
                                <button type="button" class="login-modal-close" onclick="window.Auth?.closeLoginPortalModal()" aria-label="关闭登录窗口">
                                    <i class="ti ti-x"></i>
                                </button>
                            </div>
                            <h2 id="login-modal-title" class="login-modal-title">进入学校工作台</h2>
                            <p id="login-modal-copy" class="login-modal-copy">输入账号与密码后，直接进入教学分析、数据维护与学校工作台。</p>
                            <div class="login-modal-visuals">
                                <div class="login-modal-visual-card">
                                    <span>Single Login Window</span>
                                    <strong>唯一表单，减少跳转与干扰</strong>
                                </div>
                                <div class="login-modal-visual-card">
                                    <span>School / Parent</span>
                                    <strong>切换角色，但保持同一套入口体验</strong>
                                </div>
                            </div>
                        </div>

                        <div class="login-auth-card login-auth-card--modal">
                            <div class="login-auth-card-brand">
                                <div class="login-auth-card-logo">SE</div>
                                <div class="login-auth-card-copy">
                                    <strong>登录工作台</strong>
                                    <span>简洁表单、清晰层级、唯一主动作</span>
                                </div>
                            </div>

                            <div id="login-form">
                                <div class="form-group">
                                    <label id="login-user-label" for="login-user">账号 / 姓名</label>
                                    <input type="text" id="login-user" placeholder="管理员账号 / 教师姓名" data-login-submit-on-enter="1">
                                    <div id="login-user-helper" class="login-inline-tip">支持管理员、教务、年级、班主任与教师账号登录。</div>
                                </div>

                                <div id="login-class-group" class="form-group">
                                    <label for="login-class">班级 <span id="login-class-label-note">(学校端无需填写)</span></label>
                                    <input type="text" id="login-class" placeholder="请输入学生班级，如 701" data-login-submit-on-enter="1">
                                </div>

                                <div class="form-group">
                                    <label for="login-pass">密码</label>
                                    <input type="password" id="login-pass" placeholder="输入密码" data-login-submit-on-enter="1">
                                </div>

                                <button id="login-submit-button" data-login-submit="1">进入学校工作台</button>

                                <div id="login-portal-helper" class="login-portal-helper">当前为学校端，验证通过后直达教学分析与数据维护。</div>

                                <div class="login-trust-strip">
                                    <span><i class="ti ti-shield-lock"></i> 统一身份认证</span>
                                    <span><i class="ti ti-cloud-lock"></i> 云端安全校验</span>
                                    <span><i class="ti ti-bolt"></i> 验证后直达工作台</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;return t.dataset.igRebuilt="true",t},rebuildCommandDeckLoginShell:function(){const t=document.getElementById("login-overlay");if(!t)return null;if(t.dataset.commanddeckRebuilt==="true")return t;const e=t.dataset.loginPortal==="parent"?"parent":"school";return t.dataset.loginPortal=e,t.dataset.loginLayout="commanddeck",t.dataset.loginSkin="commanddeck",t.innerHTML=`
                <div class="login-shell login-shell--commanddeck">
                    <section class="login-stage login-stage--commanddeck" aria-label="系统首页">
                        <nav class="login-stage-nav login-stage-nav--commanddeck" aria-label="首页导航">
                            <a class="login-stage-brand" href="#login-hero">
                                <span class="login-stage-brand-mark">SE</span>
                                <span class="login-stage-brand-copy">
                                    <strong>校衡台</strong>
                                    <small>教学数据工作台</small>
                                </span>
                            </a>
                            <div class="login-stage-nav-links">
                                <a href="#login-hero" class="active">首页</a>
                                <a href="#login-portal-hub">登录</a>
                                <button type="button" class="login-stage-nav-login" onclick="window.Auth?.openLoginPortalModal('school')">打开学校端</button>
                            </div>
                        </nav>

                        <div id="login-hero" class="login-stage-hero login-stage-hero--commanddeck">
                            <span id="login-stage-kicker" class="login-stage-hero-kicker">School Command Center</span>
                            <h1 id="login-stage-title">
                                <span class="login-stage-title-line">一个登录入口</span>
                                <span class="login-stage-title-line login-stage-title-line--accent">直达学校工作台与家长成长端</span>
                            </h1>
                            <p id="login-stage-copy">把登录和系统说明拆分成清晰的工作台入口。首屏只负责方向感，登录动作集中在同一张认证面板里完成。</p>
                            <div class="login-stage-actions">
                                <button type="button" class="login-stage-primary-action" onclick="window.Auth?.openLoginPortalModal('school')">
                                    <i class="ti ti-building-community"></i> 进入学校端
                                </button>
                                <button type="button" class="login-stage-secondary-action" onclick="window.Auth?.openLoginPortalModal('parent')">
                                    <i class="ti ti-heart-handshake"></i> 进入家长端
                                </button>
                            </div>
                            <div class="login-stage-meta">
                                <span><i class="ti ti-layout-dashboard"></i> 教学分析 / 数据维护 / 学校工作台</span>
                                <span><i class="ti ti-devices"></i> Web / 客户端统一入口</span>
                                <span><i class="ti ti-sparkles"></i> 新版登录工作台 · 2026-04-19</span>
                            </div>
                            <div class="login-stage-platforms" aria-label="支持终端">
                                <span><i class="ti ti-device-desktop"></i> Web</span>
                                <span><i class="ti ti-device-mobile"></i> Android</span>
                                <span><i class="ti ti-brand-windows"></i> Desktop</span>
                            </div>
                            <div class="login-stage-scanline">
                                <article class="login-stage-data-card">
                                    <span class="login-stage-data-label">工作台能力</span>
                                    <strong>分析、预警、整改、账号</strong>
                                    <p>把老师常用的数据链路集中在一张首页里，不再四处找入口。</p>
                                </article>
                                <article class="login-stage-data-card">
                                    <span class="login-stage-data-label">统一认证</span>
                                    <strong>学校端与家长端共用同一套登录面板</strong>
                                    <p>切换角色时只变更内容，不再切页面，使用路径更稳定。</p>
                                </article>
                                <article class="login-stage-data-card">
                                    <span class="login-stage-data-label">多端同步</span>
                                    <strong>网页、安卓、桌面保持同一操作习惯</strong>
                                    <p>入口和身份逻辑一致，登录后自动进入对应工作区。</p>
                                </article>
                            </div>
                            <div class="login-stage-spotlight login-stage-spotlight--commanddeck">
                                <div class="login-stage-spotlight-copy">
                                    <span class="login-stage-featured-label">Command Deck</span>
                                    <strong id="login-stage-featured-title" class="login-stage-featured-title">先看清入口，再完成身份验证</strong>
                                    <p id="login-stage-featured-copy" class="login-stage-featured-copy">左侧聚焦系统价值和工作流，右侧负责角色切换与登录动作，避免旧版首屏信息拥挤、登录位置不明确的问题。</p>
                                </div>
                                <div class="login-stage-status-grid">
                                    <div class="login-stage-status-pill"><span>01</span><strong>选择端口</strong></div>
                                    <div class="login-stage-status-pill"><span>02</span><strong>验证身份</strong></div>
                                    <div class="login-stage-status-pill"><span>03</span><strong>进入模块</strong></div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="login-auth-panel login-auth-panel--commanddeck" id="login-portal-hub" aria-label="统一登录入口">
                        <div class="login-auth-panel-inner login-auth-panel-inner--commanddeck">
                            <div class="login-auth-card login-auth-card--portal">
                                <div class="login-auth-head">
                                    <div class="login-brand-block">
                                        <div id="login-portal-badge" class="login-portal-badge">学校工作台</div>
                                        <span class="login-brand-kicker">Login Center</span>
                                        <h2 class="login-auth-title">统一登录入口</h2>
                                        <p id="login-portal-copy">先选角色，再在同一张面板里完成验证。登录后会自动进入对应工作区，不需要额外跳转。</p>
                                    </div>
                                </div>

                                <div class="login-portal-launch-head">
                                    <span>Choose Portal</span>
                                    <p>学校端和家长端共享同一套认证逻辑，但保留各自的引导文案和入口说明。</p>
                                </div>

                                <div class="login-portal-grid" aria-label="登录入口选择">
                                    <button type="button" class="login-portal-card active" data-portal="school" data-login-open="school" onclick="window.Auth?.openLoginPortalModal('school')">
                                        <span class="login-portal-icon"><i class="ti ti-building-community"></i></span>
                                        <span class="login-portal-title">学校端</span>
                                        <span class="login-portal-desc">面向管理员、教务、年级主任、班主任和教师的统一工作台。</span>
                                        <span class="login-portal-meta">Analysis / Data / Workspace</span>
                                        <span class="login-portal-action">打开学校端窗口</span>
                                    </button>
                                    <button type="button" class="login-portal-card" data-portal="parent" data-login-open="parent" onclick="window.Auth?.openLoginPortalModal('parent')">
                                        <span class="login-portal-icon"><i class="ti ti-heart-handshake"></i></span>
                                        <span class="login-portal-title">家长端</span>
                                        <span class="login-portal-desc">输入学生姓名、班级和密码后，直接查看成长报告、成绩与提醒。</span>
                                        <span class="login-portal-meta">Report / Score / Reminder</span>
                                        <span class="login-portal-action">打开家长端窗口</span>
                                    </button>
                                </div>

                                <div class="login-portal-note">
                                    <i class="ti ti-hand-click"></i> 首页只保留角色选择和关键动作，真实账号验证统一在登录窗口中完成。
                                </div>
                            </div>

                            <div class="login-auth-footer">
                                <span>Web / Android / Desktop</span>
                                <span>统一账号逻辑</span>
                                <span>新的工作台式登录体验</span>
                            </div>
                        </div>
                    </section>
                </div>

                <div id="login-modal-backdrop" class="login-modal-backdrop" style="display:none;" aria-hidden="true" onclick="if(event.target===this) window.Auth?.closeLoginPortalModal()">
                    <div class="login-modal-dialog login-modal-dialog--commanddeck" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">
                        <div class="login-modal-head login-modal-head--commanddeck">
                            <div class="login-modal-head-top">
                                <span id="login-modal-chip" class="login-modal-chip">学校端登录窗口</span>
                                <button type="button" class="login-modal-close" onclick="window.Auth?.closeLoginPortalModal()" aria-label="关闭登录窗口">
                                    <i class="ti ti-x"></i>
                                </button>
                            </div>
                            <h2 id="login-modal-title" class="login-modal-title">进入学校工作台</h2>
                            <p id="login-modal-copy" class="login-modal-copy">输入账号与密码后，直接进入教学分析、数据维护与学校工作台。</p>
                            <div class="login-modal-visuals">
                                <div class="login-modal-visual-card">
                                    <span>Single Login Window</span>
                                    <strong>唯一认证面板，减少跳转与干扰</strong>
                                </div>
                                <div class="login-modal-visual-card">
                                    <span>School / Parent</span>
                                    <strong>切换角色，但保持同一套入口体验</strong>
                                </div>
                            </div>
                        </div>

                        <div class="login-auth-card login-auth-card--modal">
                            <div class="login-auth-card-brand">
                                <div class="login-auth-card-logo">SE</div>
                                <div class="login-auth-card-copy">
                                    <strong>登录工作台</strong>
                                    <span>清晰表单、明确角色、统一认证动作</span>
                                </div>
                            </div>

                            <div id="login-form">
                                <div class="form-group">
                                    <label id="login-user-label" for="login-user">账号 / 姓名</label>
                                    <input type="text" id="login-user" placeholder="管理员账号 / 教师姓名" data-login-submit-on-enter="1">
                                    <div id="login-user-helper" class="login-inline-tip">支持管理员、教务、年级、班主任与教师账号登录。</div>
                                </div>

                                <div id="login-class-group" class="form-group">
                                    <label for="login-class">班级 <span id="login-class-label-note">(学校端无需填写)</span></label>
                                    <input type="text" id="login-class" placeholder="请输入学生班级，如 701" data-login-submit-on-enter="1">
                                </div>

                                <div class="form-group">
                                    <label for="login-pass">密码</label>
                                    <input type="password" id="login-pass" placeholder="输入密码" data-login-submit-on-enter="1">
                                </div>

                                <button id="login-submit-button" data-login-submit="1">进入学校工作台</button>

                                <div id="login-portal-helper" class="login-portal-helper">当前为学校端，验证通过后直达教学分析与数据维护。</div>

                                <div class="login-trust-strip">
                                    <span><i class="ti ti-shield-lock"></i> 统一身份认证</span>
                                    <span><i class="ti ti-cloud-lock"></i> 云端安全校验</span>
                                    <span><i class="ti ti-bolt"></i> 验证后直达工作台</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,t.dataset.igRebuilt="true",t.dataset.commanddeckRebuilt="true",t},rebuildPassportLoginShell:function(){const t=document.getElementById("login-overlay");if(!t)return null;const e=this.getLoginPortal();return t.dataset.loginPortal=e,t.dataset.loginLayout="passport",t.dataset.loginSkin="passport",t.innerHTML=`
                <div class="login-shell login-shell--passport">
                    <section class="login-stage login-stage--passport" aria-label="系统登录说明">
                        <nav class="login-stage-nav login-stage-nav--passport" aria-label="登录辅助导航">
                            <a class="login-stage-brand" href="#login-hero">
                                <span class="login-stage-brand-mark">SE</span>
                                <span class="login-stage-brand-copy">
                                    <strong>校衡台</strong>
                                    <small>教学数据工作台</small>
                                </span>
                            </a>
                            <div class="login-stage-nav-links">
                                <a href="#login-hero" class="active">登录验证</a>
                                <a href="#login-portal-hub">流程说明</a>
                                <button type="button" class="login-stage-nav-login" onclick="window.Auth?.openLoginPortalModal('school')">切到学校端</button>
                            </div>
                        </nav>

                        <div id="login-hero" class="login-stage-hero login-stage-hero--passport">
                            <span id="login-stage-kicker" class="login-stage-hero-kicker">Step 1 / Login</span>
                            <h1 id="login-stage-title">
                                <span class="login-stage-title-line">选择届别并登录</span>
                                <span class="login-stage-title-line login-stage-title-line--accent">一次进入学校工作台</span>
                            </h1>
                            <p id="login-stage-copy">学校端在登录页直接选择届别，验证成功后进入对应届别工作区，不再多一次确认。</p>
                            <div class="login-stage-meta">
                                <span><i class="ti ti-shield-lock"></i> 登录验证与工作区选择拆开</span>
                                <span><i class="ti ti-route-2"></i> 学校端登录后固定进入届别选择</span>
                                <span><i class="ti ti-devices"></i> Web / Android / Desktop 共用同一套流程</span>
                            </div>
                            <div class="login-stage-status-grid login-stage-status-grid--passport">
                                <div class="login-stage-status-pill"><span>01</span><strong>选择届别</strong><p>在登录页确认目标届别。</p></div>
                                <div class="login-stage-status-pill"><span>02</span><strong>验证身份</strong><p>账号与密码一次提交。</p></div>
                                <div class="login-stage-status-pill"><span>03</span><strong>进入工作台</strong><p>云端数据就绪后直接打开。</p></div>
                            </div>
                            <div class="login-stage-spotlight login-stage-spotlight--passport">
                                <div class="login-stage-spotlight-copy">
                                    <span class="login-stage-featured-label">One-step Entry</span>
                                    <strong id="login-stage-featured-title" class="login-stage-featured-title">登录页完成届别选择和身份验证</strong>
                                    <p id="login-stage-featured-copy" class="login-stage-featured-copy">学校端采用“选择届别 → 验证身份 → 工作台”的路径，避免重复点击，也避免落进空数据或错误届别。</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section class="login-auth-panel login-auth-panel--passport" id="login-portal-hub" aria-label="统一登录入口">
                        <div class="login-auth-panel-inner login-auth-panel-inner--passport">
                            <div class="login-auth-card login-auth-card--passport">
                                <div class="login-auth-head login-auth-head--passport">
                                    <div class="login-brand-block">
                                        <div id="login-portal-badge" class="login-portal-badge">学校身份验证</div>
                                        <span class="login-brand-kicker">Inline Login</span>
                                        <h2 class="login-auth-title">登录验证</h2>
                                        <p id="login-portal-copy">学校端验证成功后进入届别选择，家长端保持直接进入成长查看界面。</p>
                                    </div>
                                </div>

                                <div class="login-portal-launch-head">
                                    <span>Switch Portal</span>
                                    <p>学校端与家长端共用一张内联登录页，但学校端会在验证后进入届别选择，家长端保持直接查看成长数据。</p>
                                </div>

                                <div class="login-portal-switch" aria-label="登录入口选择">
                                    <button type="button" class="login-portal-chip active" data-portal="school" data-login-open="school" onclick="window.Auth?.openLoginPortalModal('school')">学校端</button>
                                    <button type="button" class="login-portal-chip" data-portal="parent" data-login-open="parent" onclick="window.Auth?.openLoginPortalModal('parent')">家长端</button>
                                </div>

                                <div class="login-portal-note">
                                    登录页已改为内联表单，不再打开单独的登录弹窗。
                                </div>

                                <div id="login-form">
                                    <div class="form-group">
                                        <label id="login-user-label" for="login-user">账号 / 姓名</label>
                                        <input type="text" id="login-user" placeholder="管理员账号 / 教师姓名" data-login-submit-on-enter="1">
                                        <div id="login-user-helper" class="login-inline-tip">支持管理员、教务、年级主任、班主任和教师账号登录。</div>
                                    </div>

                                    <div id="login-class-group" class="form-group">
                                        <label for="login-class">班级 <span id="login-class-label-note">(学校端无需填写)</span></label>
                                        <input type="text" id="login-class" placeholder="请输入学生班级，如 701" data-login-submit-on-enter="1">
                                    </div>

                                    <div class="form-group">
                                        <label for="login-pass">密码</label>
                                        <input type="password" id="login-pass" placeholder="输入密码" data-login-submit-on-enter="1">
                                    </div>

                                    <button id="login-submit-button" data-login-submit="1">进入学校工作台</button>

                                    <div id="login-portal-helper" class="login-portal-helper">当前为学校端，选择届别并验证成功后直接进入工作台。</div>

                                    <div class="login-form-actions">
                                        <button type="button" class="login-form-alt" onclick="window.Auth?.openSystemIntroModal(window.Auth?.getLoginPortal?.())">
                                            <i class="ti ti-file-text"></i> 查看系统说明
                                        </button>
                                    </div>

                                    <div class="login-trust-strip">
                                        <span><i class="ti ti-shield-lock"></i> 统一身份认证</span>
                                        <span><i class="ti ti-layers-subtract"></i> 登录与届别选择分步完成</span>
                                        <span><i class="ti ti-database-export"></i> 模块按届别加载</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div id="login-modal-backdrop" class="login-modal-backdrop" style="display:none;" aria-hidden="true"></div>
            `,t.dataset.passportRebuilt="true",t},getSystemIntroContent:function(t=this.getLoginPortal()){const e=t==="parent"?"parent":"school";return{chip:e==="parent"?"家长端说明":"学校端说明",title:"校衡台如何使用",copy:"系统介绍集中说明使用流程、模块结构、角色权限、成绩计算和绩效比较规则，首页不再直接展开这些说明。",spotlight:e==="parent"?{label:"当前入口重点",title:"家长端只看学生个人成绩、成长报告与关键提醒",copy:"无论从家长端还是学校端进入，系统都使用同一份成绩数据、同一套比较口径与统一权限边界。"}:{label:"当前入口重点",title:"学校端覆盖数据维护、教学分析、绩效比较与结果输出",copy:"管理员、教务、班主任与教师都在同一套口径下工作，网页端与 Android 端看到的核心结果保持一致。"},quickStats:[{label:"适用角色",value:"管理员 / 教务 / 年级负责人 / 班主任 / 教师 / 家长"},{label:"核心模块",value:"数据导入、综合分析、教师分析、成长报告、绩效比较"},{label:"统一口径",value:"Web、客户端与家长端共用同一套数据和规则"}],sections:[{title:"系统如何使用",copy:"建议按“导入数据 -> 校验参数 -> 进入分析 -> 生成结果 -> 导出或同步”的顺序使用。",type:"steps",items:[{label:"1. 导入与建档",text:"在数据枢纽上传原始成绩、班级名册、任课表与历史考试，系统会自动识别学校、班级和学科。"},{label:"2. 校验口径",text:"按考试或年级配置总分、优良及格线、分层阈值和比较参数，确保不同批次结果可直接对照。"},{label:"3. 进入分析",text:"进入综合分析、教师分析、进退步追踪、学生详情和横向对比模块查看结果。"},{label:"4. 输出结果",text:"生成成绩单、成长报告、整改任务、绩效比较结果，并按需要同步云端或分发移动端。"}]},{title:"系统有哪些模块",copy:"工作区按“数据、分析、管理、报告、服务”组织，常用模块会围绕同一份成绩库联动。",type:"grid",items:[{label:"数据枢纽",text:"导入成绩、历史档案、任课表和基础配置，是全部分析的起点。"},{label:"综合分析 / 两率一分",text:"查看均分、优秀率、及格率、总分、排名、分层和质量预警。"},{label:"教师分析 / 教学评价",text:"结合任课表、历史基线和联考口径比较教师学科绩效。"},{label:"学生详情 / 成长报告",text:"查看单个学生成绩、排名变化、报告卡和家长端展示结果。"},{label:"横向对比 / 绩效比较",text:"按学校、班级、教师、学科和多次考试做同口径比较。"},{label:"系统维护",text:"维护账号、权限、版本信息与云端同步。"}]},{title:"不同角色有哪些权限",copy:"系统按职责分层授权，用户只会看到与自己职责相关的模块和数据范围。",type:"roles",items:[{label:"管理员 / 教务",text:"维护账号与权限、导入全校数据、管理考试参数、查看全部分析和导出结果。"},{label:"年级负责人",text:"查看本年级质量分析、横向比较、分层名单、整改任务和汇总结果。"},{label:"班主任",text:"查看本班学生成绩、成长报告、临界生名单、班级比较和家校提醒。"},{label:"学科教师",text:"聚焦本人任课班级与学科，查看教学绩效、进退步和培优辅差名单。"},{label:"家长 / 学生",text:"只查看个人成绩、成长报告、排名变化与提醒，不参与后台维护。"}]},{title:"如何计算成绩",copy:"所有结果都基于导入成绩与当前参数自动计算，不依赖人工手工拼表。",type:"metrics",items:[{label:"基础汇总",text:"系统会按科目自动生成单科分、总分、均分、班级/年级/镇域排名，并保留缺考、作弊等特殊值处理口径。"},{label:"等级与达线",text:"根据优良及格线、目标线或分层线自动生成优秀率、及格率、达线人数与临界名单。"},{label:"进退步",text:"把本次考试和历史考试按学生或班级匹配，比对总分、单科、排名和达线变化。"},{label:"统一结果",text:"同一套配置会同时作用于网页端、Android 和家长端，保证查看和导出结果一致。"}]},{title:"如何比较绩效",copy:"绩效比较强调同条件、同口径、同维度，避免只看单次原始分数。",type:"metrics",items:[{label:"横向比较",text:"在同年级、同学科、同考试条件下比较学校、班级和教师的均分、两率一分与达线情况。"},{label:"纵向比较",text:"按多次考试连续比较进退步、稳定性、目标达成率和阶段改善幅度。"},{label:"基线校正",text:"教师绩效会结合历史基础或同基础学生分层，比较实际表现与预期表现，减少生源差异影响。"},{label:"结果落地",text:"比较结果会继续联动到培优辅差、整改任务、学生详情和报告生成，形成闭环。"}]},{title:"数据同步与结果输出",copy:"系统既适合办公室 Web，也支持移动端与外部查看。",type:"grid",items:[{label:"Web / 客户端",text:"网页端与客户端共用统一登录入口与主要工作流，便于办公室电脑、手机和本地桌面端切换。"},{label:"导出与分发",text:"可输出成绩单、成长报告、对比结果与分发版页面，便于班主任或家长查看。"},{label:"云端协同",text:"支持账号同步、数据同步与结果一致性校验，版本更新后继续沿用同一套业务规则。"},{label:"使用建议",text:"每次新考试先导入原始数据并核对阈值，再做分析和绩效比较，结果会更稳定。"}]}]}},renderSystemIntroModal:function(t=this.getLoginPortal()){var h,k,w;const e=this.ensureSystemIntroModal();if(!e)return null;const o=this.getSystemIntroContent(t),a=e.querySelector("[data-intro-chip]"),n=e.querySelector("[data-intro-title]"),l=e.querySelector("[data-intro-copy]"),s=e.querySelector("[data-intro-focus-label]"),r=e.querySelector("[data-intro-focus-title]"),d=e.querySelector("[data-intro-focus-copy]"),p=e.querySelector("[data-intro-quickstats]"),u=e.querySelector("[data-intro-body]");if(a&&(a.textContent=o.chip),n&&(n.textContent=o.title),l&&(l.textContent=o.copy),s&&(s.textContent=((h=o.spotlight)==null?void 0:h.label)||""),r&&(r.textContent=((k=o.spotlight)==null?void 0:k.title)||""),d&&(d.textContent=((w=o.spotlight)==null?void 0:w.copy)||""),p&&(p.innerHTML=(o.quickStats||[]).map(v=>`
                        <article class="login-system-intro-stat">
                            <span>${v.label}</span>
                            <strong>${v.value}</strong>
                        </article>
                    `).join("")),u){const v=g=>{const y=Array.isArray(g.items)?g.items:[];if(g.type==="roles")return`
                            <div class="login-system-intro-role-list">
                                ${y.map(m=>`
                                    <div class="login-system-intro-role-row">
                                        <strong>${m.label}</strong>
                                        <p>${m.text}</p>
                                    </div>
                                `).join("")}
                            </div>
                        `;const S=g.type==="steps"?"login-system-intro-step":"login-system-intro-metric";return`
                        <div class="${g.type==="steps"?"login-system-intro-flow":"login-system-intro-grid"}">
                            ${y.map(m=>`
                                <article class="${S}">
                                    <strong>${m.label}</strong>
                                    <p>${m.text}</p>
                                </article>
                            `).join("")}
                        </div>
                    `};u.innerHTML=(o.sections||[]).map((g,y)=>`
                        <article class="login-system-intro-section login-system-intro-section--${g.type||"grid"}">
                            <div class="login-system-intro-section-head">
                                <span class="login-system-intro-section-index">${String(y+1).padStart(2,"0")}</span>
                                <div>
                                    <h3>${g.title}</h3>
                                    <p>${g.copy}</p>
                                </div>
                            </div>
                            ${v(g)}
                        </article>
                    `).join("")}return e},syncLoginPortalUI:function(t=this.getLoginPortal()){const e=t==="parent"?"parent":"school",o=document.getElementById("login-overlay");o&&(o.dataset.loginPortal=e);const a=document.getElementById("login-portal-hub");a&&(a.dataset.loginPortal=e),document.querySelectorAll(".login-portal-card[data-portal], .login-portal-chip[data-portal]").forEach(c=>{c.classList.toggle("active",c.dataset.portal===e),c.setAttribute("aria-pressed",c.dataset.portal===e?"true":"false")});const n=document.getElementById("login-portal-badge"),l=document.getElementById("login-portal-copy"),s=document.getElementById("login-user"),r=document.getElementById("login-class"),d=document.getElementById("login-class-group"),p=document.getElementById("login-user-helper"),u=document.getElementById("login-portal-helper"),h=document.getElementById("login-submit-button"),k=document.getElementById("login-user-label"),w=document.getElementById("login-class-label-note"),v=document.getElementById("login-stage-kicker"),g=document.getElementById("login-stage-title"),y=document.getElementById("login-stage-copy"),S=document.querySelector(".login-stage-meta"),P=document.getElementById("login-stage-featured-title"),m=document.getElementById("login-stage-featured-copy"),W=document.getElementById("login-modal-chip"),j=document.getElementById("login-modal-title"),K=document.getElementById("login-modal-copy"),U=document.querySelector(".login-auth-title"),z=document.querySelector(".login-portal-launch-head span"),V=document.querySelector(".login-portal-launch-head p"),J=document.querySelector(".login-portal-note"),Q=document.getElementById("login-auth-facts");Q&&Q.remove();const i=e==="parent"?{badge:"家长成长入口",authTitle:"登录入口",copy:"",userLabel:"学生姓名",userPlaceholder:"请输入学生姓名",userHelper:"建议使用学生姓名登录，并完整填写班级信息。",classNote:"(家长端必填，如 701)",classPlaceholder:"请输入学生班级，如 701",helper:"当前为家长端，验证后进入成长报告与成绩视图。",submit:"进入家长端",stageKicker:"Family Growth Portal",stageTitle:'<span class="login-stage-title-line">查看成长报告</span><span class="login-stage-title-line login-stage-title-line--accent">更轻、更清楚、更直接</span>',stageCopy:"像 Instagram 一样把入口和动作分清楚，让家长端登录页更聚焦，也更适合移动端。",stageMeta:[{icon:"ti ti-heart-handshake",text:"成长报告 / 成绩查询 / 家校提醒"},{icon:"ti ti-devices",text:"手机、安卓与桌面端共用同一套入口"},{icon:"ti ti-sparkles",text:"当前稳定版 v1.0 · 2026-04-08"}],launchKicker:"登录窗口",launchCopy:"先选择家长端，再打开唯一登录窗口；表单和说明各归其位。",launchNote:"系统介绍会说明角色权限、流程和成绩规则。",stageFeatureTitle:"家长端聚焦成绩、报告与提醒",stageFeatureCopy:"首页只留下最重要的入口和价值点，避免像旧版那样把所有信息都堆在首屏。",modalChip:"家长端登录窗口",modalTitle:"进入家长端",modalCopy:"输入学生姓名、班级与密码后，直接查看成长报告、成绩与家校提醒。",navButton:"打开家长端"}:{badge:"学校工作台",authTitle:"登录入口",copy:"",userLabel:"账号 / 姓名",userPlaceholder:"管理员账号 / 教师姓名",userHelper:"支持管理员、教务、年级、班主任与教师账号登录。",classNote:"(学校端无需填写)",classPlaceholder:"学校端无需填写",helper:"当前为学校端，验证通过后直达教学分析与数据维护。",submit:"进入学校工作台",stageKicker:"School Command Center",stageTitle:'<span class="login-stage-title-line">统一登录</span><span class="login-stage-title-line login-stage-title-line--accent">把学校端和家长端放在一张首页里</span>',stageCopy:"借鉴 Instagram 的左右双栏逻辑，把品牌、入口和表单层级重新理顺。",stageMeta:[{icon:"ti ti-layout-dashboard",text:"教学分析 / 数据维护 / 学校工作台"},{icon:"ti ti-devices",text:"Web、Android 与 Desktop 共用入口逻辑"},{icon:"ti ti-sparkles",text:"当前稳定版 v1.0 · 2026-04-08"}],launchKicker:"登录窗口",launchCopy:"先选学校端或家长端，再在唯一登录窗口里完成验证，减少跳转和视觉噪音。",launchNote:"系统介绍会说明模块结构、角色权限和核心逻辑。",stageFeatureTitle:"登录与系统说明各自独立",stageFeatureCopy:"首屏只负责建立品牌感和主入口，不再把所有解释文字都堆到同一块大面板里。",modalChip:"学校端登录窗口",modalTitle:"进入学校端",modalCopy:"输入账号与密码后，直接进入教学分析、数据维护与学校工作台。",navButton:"打开学校端"};if(e==="parent"?Object.assign(i,{badge:"家长身份验证",authTitle:"家长登录",copy:"家长端验证成功后，直接进入成长报告、成绩与提醒页面。",helper:"当前为家长端，验证成功后直接进入成长查看界面。",submit:"进入家长端",stageKicker:"Family Portal",stageTitle:'<span class="login-stage-title-line">家长端登录</span><span class="login-stage-title-line login-stage-title-line--accent">验证后直接查看成长数据</span>',stageCopy:"家长端保持轻量路径，输入学生姓名、班级和密码后，直接查看成长报告、成绩与提醒。",stageFeatureTitle:"家长端保持直接进入成长视图",stageFeatureCopy:"学校端与家长端共用同一张登录页，但家长端不进入届别选择，验证后直接打开成长数据。",launchKicker:"Switch Portal",launchCopy:"切换到家长端后，内联表单会自动改成学生姓名、班级和密码验证。",launchNote:"家长端仍然保留直接进入成长查看的短路径。"}):Object.assign(i,{badge:"学校身份验证",authTitle:"登录验证",copy:"学校端验证成功后，会直接进入当前选择的届别工作台。",helper:"当前为学校端，选择届别并验证成功后直接进入工作台。",submit:"进入学校工作台",stageKicker:"Step 1 / Login",stageTitle:'<span class="login-stage-title-line">选择届别并登录</span><span class="login-stage-title-line login-stage-title-line--accent">一次进入学校工作台</span>',stageCopy:"登录页直接完成届别选择和身份验证，验证成功后打开对应届别工作区。",stageFeatureTitle:"一次点击完成登录和届别进入",stageFeatureCopy:"学校端固定采用“选择届别 → 验证身份 → 工作台”的路径，避免重复点击，也避免直接落到错误届别或空模块。",launchKicker:"One-step Entry",launchCopy:"学校端与家长端共用内联登录页，学校端在表单里直接确认届别。",launchNote:"下载与系统说明都留在辅助入口里，登录动作负责验证并进入工作台。"}),Object.entries({school:{title:"学校端",desc:"教学分析、数据维护与学校管理入口。",meta:"Analysis / Data / Workspace",action:"打开学校端窗口"},parent:{title:"家长端",desc:"成长报告、成绩查询与家校提醒入口。",meta:"Report / Score / Reminder",action:"打开家长端窗口"}}).forEach(([c,C])=>{const b=document.querySelector(`.login-portal-card[data-portal="${c}"], .login-portal-chip[data-portal="${c}"]`);if(!b)return;const B=b.querySelector(".login-portal-title"),T=b.querySelector(".login-portal-desc"),M=b.querySelector(".login-portal-meta"),q=b.querySelector(".login-portal-action");B&&(B.textContent=C.title),T&&(T.textContent=C.desc),M&&(M.textContent=C.meta),q&&(q.textContent=C.action),!B&&!T&&!M&&!q&&(b.textContent=C.title)}),n&&(n.textContent=i.badge),l){const c=String(i.copy||"").trim();l.textContent=c,l.style.display=c?"":"none",l.setAttribute("aria-hidden",c?"false":"true")}k&&(k.textContent=i.userLabel),s&&(s.placeholder=i.userPlaceholder),p&&(p.textContent=i.userHelper),w&&(w.textContent=i.classNote),r&&(r.placeholder=i.classPlaceholder),d&&(d.style.display=e==="parent"?"block":"none",d.setAttribute("aria-hidden",e==="parent"?"false":"true")),u&&(u.textContent=i.helper),h&&(h.textContent=i.submit),v&&(v.textContent=i.stageKicker),g&&(g.innerHTML=i.stageTitle),y&&(y.textContent=i.stageCopy),S&&(S.innerHTML=(i.stageMeta||[]).map(c=>`<span><i class="${c.icon}"></i> ${c.text}</span>`).join("")),P&&(P.textContent=i.stageFeatureTitle),m&&(m.textContent=i.stageFeatureCopy),U&&(U.textContent=i.authTitle),z&&(z.textContent=i.launchKicker),V&&(V.textContent=i.launchCopy),J&&(J.textContent=i.launchNote),W&&(W.textContent=i.modalChip),j&&(j.textContent=i.modalTitle),K&&(K.textContent=i.modalCopy);const X=document.querySelector(".login-stage-nav-login");X&&(X.textContent=i.navButton||"打开登录窗口"),this.renderSystemIntroModal(e)}};window.LoginEntryRuntime=lt;function L(t){if(!window.Auth||window.Auth[`__loginEntryPatched_${t}`])return!1;const e=window.Auth[t];return typeof e!="function"?!1:(window.Auth[t]=function(...a){const n=e.apply(this,a);return setTimeout(f,0),n},window.Auth[`__loginEntryPatched_${t}`]=!0,!0)}function F(){window.Auth&&(L("syncLoginPortalUI"),L("setLoginPortal"),L("rebuildPassportLoginShell"),L("ensureLoginWorkbench"))}function G(){window.Auth&&typeof window.Auth.login=="function"&&window.Auth.login()}function O(){document.querySelectorAll("[data-login-portal-action]").forEach(t=>{t.dataset.loginEntryBound!=="1"&&(t.dataset.loginEntryBound="1",t.addEventListener("click",()=>{const e=t.dataset.loginPortalAction==="parent"?"parent":"school";window.Auth&&typeof window.Auth.setLoginPortal=="function"&&window.Auth.setLoginPortal(e)}))}),document.querySelectorAll("[data-login-submit]").forEach(t=>{t.dataset.loginEntryBound!=="1"&&(t.dataset.loginEntryBound="1",t.addEventListener("click",G))}),document.querySelectorAll("[data-login-submit-on-enter]").forEach(t=>{t.dataset.loginEntryBound!=="1"&&(t.dataset.loginEntryBound="1",t.addEventListener("keydown",e=>{e.key==="Enter"&&G()}))})}function Y(){f(),O(),F();const t=new MutationObserver(()=>f()),e=document.getElementById("login-overlay");e&&t.observe(e,{childList:!0,subtree:!0});let o=0;const a=setInterval(()=>{o+=1,F(),f(),O(),o>80&&clearInterval(a)},250)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Y,{once:!0}):Y(),window.polishLoginEntryShell=f,window.BootCohortLifecycle=window.BootCohortLifecycle||{getAcademicYear:R,getCurrentGrade9CohortYear:E,getLoginCohortYears:N,getGraduatedCohortYears:H,getSelectedLoginCohortYear:Z,clearGraduateTarget:()=>x("")},window.__LOGIN_ENTRY_RUNTIME_PATCHED__=!0})();
