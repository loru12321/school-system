(()=>{if(typeof window=="undefined"||window.__MOBILE_MANAGER_PATCHED__)return;const j=960,K=[80,260,900],F=["starter-hub","summary","teacher-analysis","student-details","progress-analysis","report-generator","teaching-warning-center","teaching-rectify-center","analysis","class-comparison"],G={admin:"管理员",director:"校级管理",grade_director:"级部主任",class_teacher:"班主任",teacher:"教师",parent:"家长",student:"学生",guest:"访客"},W={admin:"starter-hub",director:"starter-hub",grade_director:"starter-hub",class_teacher:"student-details",teacher:"teacher-analysis"},Q=["admin","director","grade_director","class_teacher"],Y=["admin","director","grade_director","class_teacher"],z=["admin","director"];let h="";function J(){var e,n,i;const t=[Number(window.innerWidth||0),Number(((e=document.documentElement)==null?void 0:e.clientWidth)||0),Number(window.outerWidth||0),Number(((n=window.screen)==null?void 0:n.width)||0),Number(((i=window.screen)==null?void 0:i.availWidth)||0)].filter(o=>Number.isFinite(o)&&o>0);return t.length?Math.min(...t):0}function w(){return J()<=j}function r(t){return String(t!=null?t:"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function m(t){return String(t||"").replace(/[\u{1F300}-\u{1FAFF}]/gu,"").replace(/\s+/g," ").trim()}function b(){return window.AuthState&&typeof window.AuthState.getCurrentUser=="function"?window.AuthState.getCurrentUser():window.Auth&&window.Auth.currentUser?window.Auth.currentUser:null}function d(){var t;return window.AuthState&&typeof window.AuthState.getCurrentRole=="function"?window.AuthState.getCurrentRole():String(((t=b())==null?void 0:t.role)||document.body.dataset.role||"guest").trim()||"guest"}function L(){if(window.AuthState&&typeof window.AuthState.getCurrentRoles=="function")return window.AuthState.getCurrentRoles();const t=b();return(Array.isArray(t==null?void 0:t.roles)&&t.roles.length?t.roles:[t==null?void 0:t.role].filter(Boolean)).map(n=>String(n||"").trim()).filter(Boolean)}function S(t=d()){const e=String(t||"").trim();return e==="parent"||e==="student"}function C(t){const e=new Set(L());return t.some(n=>e.has(n))}function M(){var t,e;return window.SchoolState&&typeof window.SchoolState.getCurrentSchool=="function"?String(((t=b())==null?void 0:t.school)||window.SchoolState.getCurrentSchool()||"").trim():String(((e=b())==null?void 0:e.school)||window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||"").trim()}function _(t){return G[String(t||"").trim()]||String(t||"访客")}function X(){if(window.NAV_STRUCTURE)return window.NAV_STRUCTURE;try{return NAV_STRUCTURE}catch(t){return null}}function E(){if(typeof window.getCurrentNavCategory=="function")return String(window.getCurrentNavCategory()||"").trim();try{return String(currentCategory||"").trim()}catch(t){return""}}function Z(t){if(t){if(typeof window.switchNavCategory=="function"){window.switchNavCategory(t);return}try{typeof switchCategory=="function"&&switchCategory(t)}catch(e){}}}function tt(t){const e=d();return!((e==="teacher"||e==="class_teacher")&&typeof window.canAccessModule=="function"&&!window.canAccessModule(t)||e==="teacher"&&["single-school-eval","exam-arranger","freshman-simulator"].includes(t)||t==="report-generator"&&typeof window.CONFIG!="undefined"&&window.CONFIG&&!window.CONFIG.showQuery)}function y(){const t=X();if(!t)return[];const e=d(),n=["teacher","class_teacher"].includes(e),i=n;return Object.keys(t).filter(o=>!(n&&(o==="data"||o==="tools")||i&&o==="town")).map(o=>{const a=t[o];return{...a,key:o,items:Array.isArray(a==null?void 0:a.items)?a.items.filter(s=>tt(s.id)):[]}}).filter(o=>o.items.length>0)}function T(t){const e=y();for(const n of e){const i=n.items.find(o=>o.id===t);if(i)return{...i,categoryKey:n.key,categoryTitle:n.title,categoryColor:n.color}}return null}function et(){var t;return((t=document.querySelector(".section.active"))==null?void 0:t.id)||""}function v(){var i,o,a;const t=d(),e=W[t]||"starter-hub",n=T(e);return n?n.id:((a=(o=(i=y()[0])==null?void 0:i.items)==null?void 0:o[0])==null?void 0:a.id)||"starter-hub"}function A(){return T(et())||T(v())||null}function nt(){const t=y(),e=A();if(e){const n=t.find(i=>i.key===e.categoryKey);if(n)return n}return t.find(n=>n.key===E())||t[0]||null}function ot(){const t=new Map,e=[],n=new Set;return y().forEach(i=>{i.items.forEach(o=>{t.set(o.id,{...o,categoryKey:i.key,categoryTitle:i.title,categoryColor:i.color})})}),[v(),...F].forEach(i=>{!i||n.has(i)||!t.has(i)||(n.add(i),e.push(t.get(i)))}),e.slice(0,6)}function it(t,e=""){const n=document.getElementById(t);return!n||!n.selectedOptions||!n.selectedOptions[0]?e:String(n.selectedOptions[0].textContent||"").trim()||e}function at(){var n;const t=document.getElementById("mode-badge"),e=String((t==null?void 0:t.textContent)||"").trim();return e||String(((n=window.CONFIG)==null?void 0:n.name)||"当前模式").trim()}function st(){return it("cohort-selector","请选择届别")}function rt(){const t=document.getElementById("cohort-selector");return t?Array.from(t.options||[]).filter(e=>String(e.value||"").trim()).map(e=>({value:String(e.value||"").trim(),label:String(e.textContent||e.value||"").trim()})):[]}function ct(t){const e=document.getElementById("cohort-selector");!e||!t||(e.value=t,e.dispatchEvent(new Event("change",{bubbles:!0})))}function lt(){const t=document.querySelector('meta[name="viewport"]');t&&t.setAttribute("content","width=device-width, initial-scale=1.0, viewport-fit=cover, user-scalable=yes")}function ut(){const t=document.getElementById("mobile-manager-app");t&&(t.style.display="none")}function dt(t=""){if(S(t))return;const e=document.getElementById("app");e&&(e.classList.remove("hidden"),e.style.display="")}function pt(){const t=document.getElementById("app");t&&(t.classList.add("hidden"),t.style.display="none")}function k(t=document){if(!w())return;t.querySelectorAll(".table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable").forEach(n=>{const i=n.querySelectorAll("thead tr"),o=i.length?Array.from(i[i.length-1].children):[];o.length&&(n.classList.add("mobile-card-table"),Array.from(n.querySelectorAll("tbody tr")).forEach(a=>{let s="";Array.from(a.children).forEach((c,p)=>{var P,D,U;if(!(c instanceof HTMLElement)||c.hasAttribute("colspan"))return;const gt=((D=(P=o[p])==null?void 0:P.textContent)==null?void 0:D.replace(/\s+/g," ").trim())||`字段${p+1}`,V=((U=c.textContent)==null?void 0:U.replace(/\s+/g," ").trim())||"";!s&&V&&p<=1&&(s=V),c.setAttribute("data-label",gt)}),s&&a.setAttribute("data-mobile-card-title",s)}),n.dataset.mobileEnhanced="1")})}function ht(t=document){w()&&(t.querySelectorAll('.section [style*="grid-template-columns"]').forEach(e=>{e.closest("#parent-view-container")||e.classList.add("mobile-stack-grid")}),t.querySelectorAll('.section [style*="display:flex"]').forEach(e=>{e.closest("#parent-view-container")||e.closest("#mobile-query-shell")||e.children.length<2||e.classList.add("mobile-wrap-row")}))}function x(){const t=document.getElementById("login-overlay"),e=!!(t&&getComputedStyle(t).display!=="none");return!!b()&&!e}function mt(){const t=nt();if(!t||!t.items.length)return'<div class="mq-inline-empty">当前分类暂无可用子模块</div>';const e=A();return t.items.map(n=>`
                <button type="button" class="mq-inline-chip ${(e==null?void 0:e.id)===n.id?"is-active":""}" data-mobile-target="module" data-id="${r(n.id)}" data-category="${r(t.key)}">
                    <i class="ti ${r(n.icon||"ti-layout-grid")}"></i>
                    <span>${r(m(n.text||n.id))}</span>
                </button>
            `).join("")}function q(){var e;let t=document.getElementById("mobile-query-shell");return t||(t=document.createElement("div"),t.id="mobile-query-shell",t.setAttribute("aria-hidden","true"),t.innerHTML=`
            <div class="mq-topbar">
                <button type="button" class="mq-icon-btn" data-mobile-action="home" aria-label="返回工作台">
                    <i class="ti ti-layout-grid"></i>
                </button>
                <div class="mq-topbar-copy">
                    <div class="mq-role-line" data-field="role">访客</div>
                    <div class="mq-title-line" data-field="title">手机查询工作台</div>
                    <div class="mq-subtitle-line" data-field="subtitle">完整数据已适配到手机查询界面</div>
                </div>
                <button type="button" class="mq-icon-btn" data-mobile-sheet="modules" aria-label="打开模块面板">
                    <i class="ti ti-category-2"></i>
                </button>
            </div>
            <div class="mq-toolbar">
                <div class="mq-toolbar-row">
                    <div class="mq-mode-badge" data-field="mode">当前模式</div>
                    <button type="button" class="mq-toolbar-pill" data-mobile-sheet="cohorts">
                        <i class="ti ti-folders"></i>
                        <span data-field="cohort">请选择届别</span>
                    </button>
                    <button type="button" class="mq-toolbar-pill" data-mobile-action="search">
                        <i class="ti ti-search"></i>
                        <span>搜索</span>
                    </button>
                </div>
                <div class="mq-inline-subnav"></div>
            </div>
            <div class="mq-backdrop"></div>
            <div class="mq-sheet">
                <div class="mq-sheet-panel"></div>
            </div>
            <div class="mq-tabs">
                <button type="button" class="mq-tab" data-mobile-action="home">
                    <i class="ti ti-home-2"></i>
                    <span>工作台</span>
                </button>
                <button type="button" class="mq-tab" data-mobile-sheet="modules">
                    <i class="ti ti-layout-list"></i>
                    <span>模块</span>
                </button>
                <button type="button" class="mq-tab" data-mobile-sheet="quick">
                    <i class="ti ti-bolt"></i>
                    <span>快捷</span>
                </button>
                <button type="button" class="mq-tab" data-mobile-sheet="account">
                    <i class="ti ti-user-circle"></i>
                    <span>我的</span>
                </button>
            </div>
        `,t.addEventListener("click",H),(e=t.querySelector(".mq-backdrop"))==null||e.addEventListener("click",()=>l("")),document.body.appendChild(t),t)}function g(){return q().querySelector(".mq-sheet-panel")}function l(t=""){const e=q(),n=g();if(h=t,e.dataset.sheetOpen=t?"1":"0",e.dataset.sheetMode=t||"",e.setAttribute("aria-hidden",t?"false":"true"),!t){n.innerHTML="";return}t==="modules"&&R(n),t==="quick"&&N(n),t==="account"&&O(n),t==="cohorts"&&I(n)}function R(t){const e=y();if(!e.length){t.innerHTML=`
                <div class="mq-sheet-head">
                    <div>
                        <strong>模块面板</strong>
                        <span>当前角色还没有可用模块</span>
                    </div>
                    <button type="button" class="mq-close-btn" data-mobile-action="close-sheet"><i class="ti ti-x"></i></button>
                </div>
            `;return}const n=A(),i=t.dataset.categoryKey&&e.some(c=>c.key===t.dataset.categoryKey)?t.dataset.categoryKey:(n==null?void 0:n.categoryKey)||E()||e[0].key,o=e.find(c=>c.key===i)||e[0];t.dataset.categoryKey=o.key;const a=e.map(c=>`
            <button type="button" class="mq-pill ${c.key===o.key?"is-active":""}" data-mobile-target="category" data-key="${r(c.key)}">
                <i class="ti ${r(c.icon||"ti-layout-grid")}"></i>
                <span>${r(m(c.title||"模块"))}</span>
            </button>
        `).join(""),s=o.items.map(c=>{const p=(n==null?void 0:n.id)===c.id;return`
                <button type="button" class="mq-module-card ${p?"is-active":""}" data-mobile-target="module" data-id="${r(c.id)}" data-category="${r(o.key)}">
                    <div class="mq-module-card-head">
                        <span class="mq-module-icon"><i class="ti ${r(c.icon||"ti-layout-grid")}"></i></span>
                        <span class="mq-module-state">${p?"当前子模块":"点击进入"}</span>
                    </div>
                    <strong>${r(m(c.text||c.id))}</strong>
                    <span>${r(m(o.title||"模块分组"))}</span>
                </button>
            `}).join("");t.innerHTML=`
            <div class="mq-sheet-head">
                <div>
                    <strong>模块导航</strong>
                    <span>先选模块分类，再进入对应子模块</span>
                </div>
                <button type="button" class="mq-close-btn" data-mobile-action="close-sheet"><i class="ti ti-x"></i></button>
            </div>
            <div class="mq-pill-row">${a}</div>
            <div class="mq-module-grid">${s}</div>
        `}function N(t){const e=ot(),n=A(),i=M()||"未绑定学校",o=Array.isArray(window.RAW_DATA)?window.RAW_DATA.length:0,a=[`
                <button type="button" class="mq-account-action" data-mobile-action="search">
                    <i class="ti ti-search"></i>
                    <span>全局搜索</span>
                </button>
            `,`
                <button type="button" class="mq-account-action" data-mobile-sheet="cohorts">
                    <i class="ti ti-folders"></i>
                    <span>切换届别</span>
                </button>
            `];C(Q)&&window.IssueManager&&typeof window.IssueManager.openAdminPanel=="function"&&a.push(`
                <button type="button" class="mq-account-action" data-mobile-action="messages">
                    <i class="ti ti-bell"></i>
                    <span>消息中心</span>
                </button>
            `),C(z)&&window.DataManager&&typeof window.DataManager.open=="function"&&a.push(`
                <button type="button" class="mq-account-action" data-mobile-action="data-manager">
                    <i class="ti ti-database-edit"></i>
                    <span>数据中心</span>
                </button>
            `),C(Y)&&window.AccountManager&&typeof window.AccountManager.open=="function"&&a.push(`
                <button type="button" class="mq-account-action" data-mobile-action="account-manager">
                    <i class="ti ti-user-cog"></i>
                    <span>账号权限</span>
                </button>
            `),t.innerHTML=`
            <div class="mq-sheet-head">
                <div>
                    <strong>快捷操作</strong>
                    <span>手机端常用操作和高频入口集中在这里</span>
                </div>
                <button type="button" class="mq-close-btn" data-mobile-action="close-sheet"><i class="ti ti-x"></i></button>
            </div>
            <div class="mq-info-card">
                <div class="mq-info-row">
                    <span>当前子模块</span>
                    <strong>${r(m((n==null?void 0:n.text)||"未进入模块"))}</strong>
                </div>
                <div class="mq-info-row">
                    <span>当前学校</span>
                    <strong>${r(i)}</strong>
                </div>
                <div class="mq-info-row">
                    <span>已载入记录</span>
                    <strong>${r(String(o))}</strong>
                </div>
            </div>
            <div class="mq-utility-grid">${a.join("")}</div>
            <div class="mq-section-title">高频入口</div>
            <div class="mq-shortcut-grid">
                ${e.map(s=>`
                    <button type="button" class="mq-shortcut-card ${(n==null?void 0:n.id)===s.id?"is-active":""}" data-mobile-target="module" data-id="${r(s.id)}" data-category="${r(s.categoryKey||"")}">
                        <i class="ti ${r(s.icon||"ti-bolt")}"></i>
                        <strong>${r(m(s.text||s.id))}</strong>
                        <span>${r(m(s.categoryTitle||"快捷入口"))}</span>
                    </button>
                `).join("")}
            </div>
        `}function O(t){const e=b(),n=L(),i=M()||"未绑定学校",o=n.length?n.map(s=>`<span class="mq-role-chip">${r(_(s))}</span>`).join(""):'<span class="mq-role-chip">访客</span>',a=[];typeof window.showModuleHelp=="function"&&a.push(`
                <button type="button" class="mq-account-action" data-mobile-action="permissions">
                    <i class="ti ti-shield-lock"></i>
                    <span>权限说明</span>
                </button>
            `),typeof window.openSpotlight=="function"&&a.push(`
                <button type="button" class="mq-account-action" data-mobile-action="search">
                    <i class="ti ti-search"></i>
                    <span>全局搜索</span>
                </button>
            `),t.innerHTML=`
            <div class="mq-sheet-head">
                <div>
                    <strong>当前会话</strong>
                    <span>账号、角色和系统操作都集中在这里</span>
                </div>
                <button type="button" class="mq-close-btn" data-mobile-action="close-sheet"><i class="ti ti-x"></i></button>
            </div>
            <div class="mq-account-card">
                <div class="mq-account-name">${r((e==null?void 0:e.name)||"未登录")}</div>
                <div class="mq-account-school">${r(i)}</div>
                <div class="mq-role-chip-row">${o}</div>
            </div>
            <div class="mq-account-actions">
                <button type="button" class="mq-account-action" data-mobile-action="password">
                    <i class="ti ti-key"></i>
                    <span>修改密码</span>
                </button>
                <button type="button" class="mq-account-action" data-mobile-action="theme">
                    <i class="ti ti-moon"></i>
                    <span>深色模式</span>
                </button>
                ${a.join("")}
                <button type="button" class="mq-account-action is-danger" data-mobile-action="logout">
                    <i class="ti ti-logout"></i>
                    <span>退出登录</span>
                </button>
            </div>
        `}function I(t){var i;const e=rt(),n=((i=document.getElementById("cohort-selector"))==null?void 0:i.value)||"";t.innerHTML=`
            <div class="mq-sheet-head">
                <div>
                    <strong>切换届别</strong>
                    <span>手机端也可以直接切换当前届别</span>
                </div>
                <button type="button" class="mq-close-btn" data-mobile-action="close-sheet"><i class="ti ti-x"></i></button>
            </div>
            <div class="mq-cohort-list">
                ${e.map(o=>`
                    <button type="button" class="mq-cohort-option ${o.value===n?"is-active":""}" data-mobile-target="cohort" data-value="${r(o.value)}">
                        <strong>${r(o.label)}</strong>
                        <span>${o.value===n?"当前届别":"点击切换"}</span>
                    </button>
                `).join("")}
            </div>
        `}function ft(t){const e=document.getElementById("parent-view-container");if(!e)return;if(t==="top"){e.scrollTo({top:0,behavior:"smooth"});return}const n=e.querySelector("#tb-query, table.fluent-table, table"),i=e.querySelector("canvas, .fluent-chart, .chart-box");t==="scores"&&n&&n.scrollIntoView({behavior:"smooth",block:"start"}),t==="charts"&&i&&i.scrollIntoView({behavior:"smooth",block:"start"})}function H(t){const e=t.target.closest("[data-mobile-action], [data-mobile-sheet], [data-mobile-target], [data-parent-jump]");if(!e)return;const n=e.getAttribute("data-mobile-sheet");if(n){l(h===n?"":n);return}const i=e.getAttribute("data-mobile-target");if(i==="category"){const s=g();s.dataset.categoryKey=e.getAttribute("data-key")||"",R(s);return}if(i==="module"){const s=e.getAttribute("data-category")||"",c=e.getAttribute("data-id")||"";l("");const p=s&&s!==E();p&&Z(s),typeof window.switchTab=="function"&&c&&(p?setTimeout(()=>window.switchTab(c),90):window.switchTab(c)),u();return}if(i==="cohort"){const s=e.getAttribute("data-value")||"";l(""),ct(s),u();return}const o=e.getAttribute("data-mobile-action");if(o==="close-sheet"){l("");return}if(o==="home"){l(""),typeof window.switchTab=="function"&&window.switchTab(v()),u();return}if(o==="search"&&typeof window.openSpotlight=="function"){l(""),window.openSpotlight();return}if(o==="password"&&typeof window.openUserPasswordModal=="function"){l(""),window.openUserPasswordModal();return}if(o==="theme"&&typeof window.toggleDarkMode=="function"){window.toggleDarkMode(),u();return}if(o==="permissions"&&typeof window.showModuleHelp=="function"){l(""),window.showModuleHelp("permissions");return}if(o==="messages"&&window.IssueManager&&typeof window.IssueManager.openAdminPanel=="function"){l(""),window.IssueManager.openAdminPanel();return}if(o==="data-manager"&&window.DataManager&&typeof window.DataManager.open=="function"){l(""),window.DataManager.open();return}if(o==="account-manager"&&window.AccountManager&&typeof window.AccountManager.open=="function"){l(""),window.AccountManager.open();return}if(o==="logout"&&window.Auth&&typeof window.Auth.logout=="function"){l(""),window.Auth.logout();return}if(o==="refresh-parent"&&window.Auth&&typeof window.Auth.renderParentView=="function"){window.Auth.renderParentView();return}if(o==="logout-parent"&&window.Auth&&typeof window.Auth.logout=="function"){window.Auth.logout();return}const a=e.getAttribute("data-parent-jump");a&&ft(a)}function bt(){const t=q(),e=d(),n=A(),i=M(),o=i?`${i} · 手机端已切到完整查询模式`:"手机端已切到完整查询模式";t.querySelector('[data-field="role"]').textContent=_(e),t.querySelector('[data-field="title"]').textContent=m((n==null?void 0:n.text)||"手机查询工作台"),t.querySelector('[data-field="subtitle"]').textContent=o,t.querySelector('[data-field="mode"]').textContent=at(),t.querySelector('[data-field="cohort"]').textContent=st(),t.querySelector(".mq-inline-subnav").innerHTML=mt(),document.body.dataset.mobileSection=(n==null?void 0:n.id)||"",t.querySelectorAll(".mq-tab").forEach(a=>{a.classList.remove("is-active");const s=a.getAttribute("data-mobile-sheet"),c=a.getAttribute("data-mobile-action");s&&h===s&&a.classList.add("is-active"),c==="home"&&!h&&a.classList.add("is-active")}),h==="modules"&&R(g()),h==="quick"&&N(g()),h==="account"&&O(g()),h==="cohorts"&&I(g())}function $(){const t=q(),e=w()&&x()&&!S(d());if(t.style.display=e?"block":"none",!e){l("");return}bt()}function wt(){const t=document.getElementById("parent-view-container");if(!t||!w()||!S(d()))return;t.dataset.mobileParentBound!=="1"&&(t.addEventListener("click",H),t.dataset.mobileParentBound="1");const e=b();let n=t.querySelector(".mobile-parent-header");n||(n=document.createElement("div"),n.className="mobile-parent-header",t.prepend(n)),n.innerHTML=`
            <div class="mobile-parent-header-top">
                <div>
                    <div class="mobile-parent-role">家长端报告</div>
                    <div class="mobile-parent-name">${r((e==null?void 0:e.name)||"学生")}</div>
                    <div class="mobile-parent-meta">${r((e==null?void 0:e.class)||"未绑定班级")}${e!=null&&e.school?` · ${r(e.school)}`:""}</div>
                </div>
                <button type="button" class="mobile-parent-logout" data-mobile-action="logout-parent">退出</button>
            </div>
            <div class="mobile-parent-chip-row">
                <span class="mobile-parent-chip">手机端展示完整报告</span>
                <span class="mobile-parent-chip">与电脑端保持同一份数据</span>
            </div>
            <div class="mobile-parent-action-row">
                <button type="button" class="mobile-parent-action" data-parent-jump="top">总览</button>
                <button type="button" class="mobile-parent-action" data-parent-jump="scores">成绩表</button>
                <button type="button" class="mobile-parent-action" data-parent-jump="charts">图表</button>
                <button type="button" class="mobile-parent-action" data-mobile-action="refresh-parent">刷新</button>
            </div>
        `,k(t)}function u(){K.forEach(t=>{setTimeout(f,t)})}function f(){if(lt(),ut(),document.body.dataset.mobileQuery=w()?"true":"false",!w()){$();return}if(!x()){pt(),$();return}S(d())||dt(d()),k(document),ht(document),wt(),$()}const B={init(){return f(),!0},switchTab(t){const e={home:v(),students:"student-details",analysis:"summary",me:v()};typeof window.switchTab=="function"&&e[t]&&(window.switchTab(e[t]),setTimeout(f,80))},renderStudentList(){f()},showStudentDetail(){f()},renderAnalysis(){f()},openModules(){l("modules")},openQuickActions(){l("quick")},openAccountSheet(){l("account")},openCohortSheet(){l("cohorts")},refresh:f};if(window.MobMgr=B,window.MobileQueryUI={refresh:f,openModules:()=>l("modules"),openQuick:()=>l("quick"),openAccount:()=>l("account"),openCohorts:()=>l("cohorts")},window.switchMobileTab=function(t){B.switchTab(t)},typeof Auth!="undefined"&&typeof Auth.applyRoleView=="function"){const t=Auth.applyRoleView;Auth.applyRoleView=function(){t.call(this),u()}}if(typeof Auth!="undefined"&&typeof Auth.renderParentView=="function"){const t=Auth.renderParentView;Auth.renderParentView=function(){t.call(this),u()}}if(typeof window.renderNavigation=="function"){const t=window.renderNavigation;window.renderNavigation=function(){const e=t.apply(this,arguments);return u(),e}}if(typeof window.switchTab=="function"){const t=window.switchTab;window.switchTab=function(){const e=t.apply(this,arguments);return u(),e}}if(typeof window.switchCategory=="function"){const t=window.switchCategory;window.switchCategory=function(){const e=t.apply(this,arguments);return u(),e}}window.addEventListener("resize",u),u(),window.__MOBILE_MANAGER_PATCHED__=!0})();
