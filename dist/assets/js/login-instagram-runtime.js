(function(){function H(){return`
            <div class="login-shell login-shell--instagram">
                <section class="login-stage login-stage--instagram" aria-label="系统首页">
                    <nav class="login-stage-nav login-stage-nav--instagram" aria-label="首页导航">
                        <a class="login-stage-brand" href="#login-hero">
                            <span class="login-stage-brand-mark">SE</span>
                            <span class="login-stage-brand-copy">
                                <strong>智慧教务管理系统</strong>
                                <small>School Intelligence OS</small>
                            </span>
                        </a>
                        <div class="login-stage-nav-links">
                            <a href="#login-hero" class="active">首页</a>
                            <a href="#login-portal-hub">登录</a>
                            <a href="#app-download">下载</a>
                            <button type="button" class="login-stage-nav-login" onclick="window.Auth?.openLoginPortalModal('school')">打开学校端</button>
                        </div>
                    </nav>

                    <div id="login-hero" class="login-stage-hero login-stage-hero--instagram">
                        <span id="login-stage-kicker" class="login-stage-hero-kicker">School Command Center</span>
                        <h1 id="login-stage-title">
                            <span class="login-stage-title-line">统一登录</span>
                            <span class="login-stage-title-line login-stage-title-line--accent">把学校端和家长端放在一张首页里</span>
                        </h1>
                        <p id="login-stage-copy">借鉴 Instagram 的左右双栏逻辑，把品牌、入口和表单层级重新理顺。</p>
                        <div class="login-stage-actions">
                            <button type="button" class="login-stage-primary-action" onclick="window.Auth?.openLoginPortalModal('school')">
                                <i class="ti ti-building-community"></i> 学校端登录
                            </button>
                            <button type="button" class="login-stage-secondary-action" onclick="window.Auth?.openLoginPortalModal('parent')">
                                <i class="ti ti-heart-handshake"></i> 家长端登录
                            </button>
                            <button type="button" class="login-stage-tertiary-action" onclick="window.Auth?.openDownloadHubModal('android')">
                                <i class="ti ti-download"></i> 打开下载中心
                            </button>
                        </div>
                        <div class="login-stage-meta">
                            <span><i class="ti ti-layout-dashboard"></i> 教学分析 / 数据维护 / 学校工作台</span>
                            <span><i class="ti ti-devices"></i> Web / Android / Desktop 共用登录入口</span>
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
                            <strong id="login-stage-featured-title" class="login-stage-featured-title">登录、下载与系统说明各自独立</strong>
                            <p id="login-stage-featured-copy" class="login-stage-featured-copy">首屏只负责建立品牌感和主入口，不再把所有解释文字都堆到同一块大面板里。</p>
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
                                    <h2 class="login-auth-title">登录入口</h2>
                                    <p id="login-portal-copy">先选择学校端或家长端，再在唯一登录窗口里完成验证。</p>
                                </div>
                                <div class="login-auth-utility" id="app-download">
                                    <button type="button" class="login-system-download-link" onclick="window.Auth?.openDownloadHubModal('android')">
                                        <i class="ti ti-download"></i> 应用下载
                                    </button>
                                    <button type="button" class="login-system-download-ghost" onclick="window.copyPublicDownloadLink?.('android')">
                                        <i class="ti ti-link"></i> 复制链接
                                    </button>
                                </div>
                            </div>

                            <div class="login-portal-launch-head">
                                <span>Choose Portal</span>
                                <p>先选端口，再打开唯一登录窗口，减少跳转、遮挡和信息噪音。</p>
                            </div>

                            <div class="login-portal-grid" aria-label="登录入口选择">
                                <button type="button" class="login-portal-card active" data-portal="school" data-login-open="school" onclick="window.Auth?.openLoginPortalModal('school')">
                                    <span class="login-portal-icon"><i class="ti ti-building-community"></i></span>
                                    <span class="login-portal-title">学校端</span>
                                    <span class="login-portal-desc">教学分析、数据维护与学校管理入口。</span>
                                    <span class="login-portal-meta">Analysis / Data / Workspace</span>
                                    <span class="login-portal-action">打开学校端窗口</span>
                                </button>
                                <button type="button" class="login-portal-card" data-portal="parent" data-login-open="parent" onclick="window.Auth?.openLoginPortalModal('parent')">
                                    <span class="login-portal-icon"><i class="ti ti-heart-handshake"></i></span>
                                    <span class="login-portal-title">家长端</span>
                                    <span class="login-portal-desc">成长报告、成绩查询与家校提醒入口。</span>
                                    <span class="login-portal-meta">Report / Score / Reminder</span>
                                    <span class="login-portal-action">打开家长端窗口</span>
                                </button>
                            </div>

                            <div class="login-portal-note">
                                <i class="ti ti-hand-click"></i> 应用下载会打开下载中心，系统介绍会说明模块结构、角色权限和核心逻辑。
                            </div>
                        </div>

                        <div class="login-auth-footer">
                            <span>Web / Android / Desktop</span>
                            <span>统一账号逻辑</span>
                            <span>Instagram 风格双栏入口</span>
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
                        <h2 id="login-modal-title" class="login-modal-title">进入学校端</h2>
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
                                <input type="text" id="login-user" placeholder="管理员账号 / 教师姓名" onkeydown="if(event.key==='Enter') window.Auth?.login()">
                                <div id="login-user-helper" class="login-inline-tip">支持管理员、教务、年级、班主任与教师账号登录。</div>
                            </div>

                            <div id="login-class-group" class="form-group">
                                <label for="login-class">班级 <span id="login-class-label-note">(学校端无需填写)</span></label>
                                <input type="text" id="login-class" placeholder="学校端无需填写" onkeydown="if(event.key==='Enter') window.Auth?.login()">
                            </div>

                            <div class="form-group">
                                <label for="login-pass">密码</label>
                                <input type="password" id="login-pass" placeholder="输入密码" onkeydown="if(event.key==='Enter') window.Auth?.login()">
                            </div>

                            <button id="login-submit-button" onclick="window.Auth?.login()">进入学校工作台</button>

                            <div id="login-portal-helper" class="login-portal-helper">当前为学校端，验证通过后直达教学分析与数据维护。</div>

                            <div class="login-form-divider"><span>or</span></div>

                            <button type="button" class="login-form-alt" onclick="window.Auth?.openDownloadHubModal('android')">
                                <i class="ti ti-download"></i> 下载 Android / Desktop
                            </button>

                            <div class="login-trust-strip">
                                <span><i class="ti ti-shield-lock"></i> 统一身份认证</span>
                                <span><i class="ti ti-cloud-lock"></i> 云端安全校验</span>
                                <span><i class="ti ti-bolt"></i> 验证后直达工作台</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `}function F(a,q){const o=q==="parent"?"parent":"school",t=o==="parent"?{badge:"家长成长入口",authTitle:"登录入口",userLabel:"学生姓名",userPlaceholder:"请输入学生姓名",userHelper:"建议使用学生姓名登录，并完整填写班级信息。",classNote:"(家长端必填，如 701)",classPlaceholder:"请输入学生班级，如 701",helper:"当前为家长端，验证后进入成长报告与成绩视图。",submit:"进入家长端",stageKicker:"Family Growth Portal",stageTitle:'<span class="login-stage-title-line">查看成长报告</span><span class="login-stage-title-line login-stage-title-line--accent">更轻、更清楚、更直接</span>',stageCopy:"像 Instagram 一样把入口和动作分清楚，让家长端登录页更聚焦，也更适合移动端。",stageMeta:[{icon:"ti ti-heart-handshake",text:"成长报告 / 成绩查询 / 家校提醒"},{icon:"ti ti-devices",text:"手机、安卓与桌面端共用同一套入口"},{icon:"ti ti-sparkles",text:"当前稳定版 v1.0 · 2026-04-08"}],launchKicker:"登录窗口",launchCopy:"先选择家长端，再打开唯一登录窗口；表单、说明和下载都各归其位。",launchNote:"应用下载会打开下载中心，系统介绍会说明角色权限、流程和成绩规则。",stageFeatureTitle:"家长端聚焦成绩、报告与提醒",stageFeatureCopy:"首页只留下最重要的入口和价值点，避免像旧版那样把所有信息都堆在首屏。",modalChip:"家长端登录窗口",modalTitle:"进入家长端",modalCopy:"输入学生姓名、班级与密码后，直接查看成长报告、成绩与家校提醒。",navButton:"打开家长端"}:{badge:"学校工作台",authTitle:"登录入口",userLabel:"账号 / 姓名",userPlaceholder:"管理员账号 / 教师姓名",userHelper:"支持管理员、教务、年级、班主任与教师账号登录。",classNote:"(学校端无需填写)",classPlaceholder:"学校端无需填写",helper:"当前为学校端，验证通过后直达教学分析与数据维护。",submit:"进入学校工作台",stageKicker:"School Command Center",stageTitle:'<span class="login-stage-title-line">统一登录</span><span class="login-stage-title-line login-stage-title-line--accent">把学校端和家长端放在一张首页里</span>',stageCopy:"借鉴 Instagram 的左右双栏逻辑，把品牌、入口和表单层级重新理顺。",stageMeta:[{icon:"ti ti-layout-dashboard",text:"教学分析 / 数据维护 / 学校工作台"},{icon:"ti ti-devices",text:"Web、Android 与 Desktop 共用入口逻辑"},{icon:"ti ti-sparkles",text:"当前稳定版 v1.0 · 2026-04-08"}],launchKicker:"登录窗口",launchCopy:"先选学校端或家长端，再在唯一登录窗口里完成验证，减少跳转和视觉噪音。",launchNote:"应用下载会打开双端下载中心，系统介绍会说明模块结构、角色权限和核心逻辑。",stageFeatureTitle:"登录、下载与系统说明各自独立",stageFeatureCopy:"首屏只负责建立品牌感和主入口，不再把所有解释文字都堆到同一块大面板里。",modalChip:"学校端登录窗口",modalTitle:"进入学校端",modalCopy:"输入账号与密码后，直接进入教学分析、数据维护与学校工作台。",navButton:"打开学校端"};Object.entries({school:{title:"学校端",desc:"教学分析、数据维护与学校管理入口。",meta:"Analysis / Data / Workspace",action:"打开学校端窗口"},parent:{title:"家长端",desc:"成长报告、成绩查询与家校提醒入口。",meta:"Report / Score / Reminder",action:"打开家长端窗口"}}).forEach(([e,l])=>{const n=document.querySelector(`.login-portal-card[data-portal="${e}"]`);if(!n)return;const M=n.querySelector(".login-portal-title"),T=n.querySelector(".login-portal-desc"),P=n.querySelector(".login-portal-meta"),D=n.querySelector(".login-portal-action");M&&(M.textContent=l.title),T&&(T.textContent=l.desc),P&&(P.textContent=l.meta),D&&(D.textContent=l.action)});const c=document.getElementById("login-portal-badge"),d=document.getElementById("login-user-label"),r=document.getElementById("login-user"),g=document.getElementById("login-user-helper"),s=document.getElementById("login-class-group"),p=document.getElementById("login-class"),u=document.getElementById("login-class-label-note"),h=document.getElementById("login-portal-helper"),m=document.getElementById("login-submit-button"),v=document.getElementById("login-stage-kicker"),b=document.getElementById("login-stage-title"),y=document.getElementById("login-stage-copy"),f=document.querySelector(".login-stage-meta"),k=document.getElementById("login-stage-featured-title"),w=document.getElementById("login-stage-featured-copy"),C=document.getElementById("login-modal-chip"),x=document.getElementById("login-modal-title"),I=document.getElementById("login-modal-copy"),E=document.querySelector(".login-auth-title"),S=document.querySelector(".login-portal-launch-head span"),A=document.querySelector(".login-portal-launch-head p"),B=document.querySelector(".login-portal-note"),L=document.querySelector(".login-stage-nav-login");c&&(c.textContent=t.badge),d&&(d.textContent=t.userLabel),r&&(r.placeholder=t.userPlaceholder),g&&(g.textContent=t.userHelper),u&&(u.textContent=t.classNote),p&&(p.placeholder=t.classPlaceholder),s&&(s.style.display=o==="parent"?"block":"none",s.setAttribute("aria-hidden",o==="parent"?"false":"true")),h&&(h.textContent=t.helper),m&&(m.textContent=t.submit),v&&(v.textContent=t.stageKicker),b&&(b.innerHTML=t.stageTitle),y&&(y.textContent=t.stageCopy),f&&(f.innerHTML=(t.stageMeta||[]).map(e=>`<span><i class="${e.icon}"></i> ${e.text}</span>`).join("")),k&&(k.textContent=t.stageFeatureTitle),w&&(w.textContent=t.stageFeatureCopy),E&&(E.textContent=t.authTitle),S&&(S.textContent=t.launchKicker),A&&(A.textContent=t.launchCopy),B&&(B.textContent=t.launchNote),C&&(C.textContent=t.modalChip),x&&(x.textContent=t.modalTitle),I&&(I.textContent=t.modalCopy),L&&(L.textContent=t.navButton),a&&typeof a.renderSystemIntroModal=="function"&&a.renderSystemIntroModal(o)}function i(){return!0}i()||document.addEventListener("DOMContentLoaded",()=>{if(i())return;const a=window.setInterval(()=>{i()&&window.clearInterval(a)},80);window.setTimeout(()=>window.clearInterval(a),4e3)},{once:!0})})();
