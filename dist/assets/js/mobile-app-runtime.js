(()=>{if(typeof window=="undefined"||window.__MOBILE_APP_RUNTIME_PATCHED__)return;const Ct=960,A=[80,260,900],_t=[140,420,980,1600],xt={admin:"starter-hub",director:"starter-hub",grade_director:"starter-hub",class_teacher:"student-details",teacher:"teacher-analysis"},Rt=["student-details","summary","teacher-analysis","report-generator","progress-analysis","analysis","teaching-warning-center"],ft="apk-recent-modules-v1",F=8,U=6,qt={admin:"管理员",director:"校级管理",grade_director:"级部主任",class_teacher:"班主任",teacher:"教师",parent:"家长",student:"学生",guest:"访客"},W=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform=="function"&&window.Capacitor.isNativePlatform()||typeof window.Capacitor.getPlatform=="function"&&window.Capacitor.getPlatform()!=="web"));let bt=0,l="",h=!1,g="",v=null,E=null,mt=null;function i(t){return String(t!=null?t:"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function It(){var e,a,o;const t=[Number(window.innerWidth||0),Number(((e=document.documentElement)==null?void 0:e.clientWidth)||0),Number(window.outerWidth||0),Number(((a=window.screen)==null?void 0:a.width)||0),Number(((o=window.screen)==null?void 0:o.availWidth)||0)].filter(n=>Number.isFinite(n)&&n>0);return t.length?Math.min(...t):0}function $(){return It()<=Ct}function C(){return window.AuthState&&typeof window.AuthState.getCurrentUser=="function"?window.AuthState.getCurrentUser():window.Auth&&window.Auth.currentUser?window.Auth.currentUser:null}function V(){var t,e,a;return window.AuthState&&typeof window.AuthState.getCurrentRole=="function"?window.AuthState.getCurrentRole():String(((t=C())==null?void 0:t.role)||((a=(e=document.body)==null?void 0:e.dataset)==null?void 0:a.role)||"guest").trim()||"guest"}function Ot(){if(window.AuthState&&typeof window.AuthState.getCurrentRoles=="function")return window.AuthState.getCurrentRoles();const t=C();return(Array.isArray(t==null?void 0:t.roles)&&t.roles.length?t.roles:[t==null?void 0:t.role].filter(Boolean)).map(a=>String(a||"").trim()).filter(Boolean)}function ue(t){const e=new Set(Ot());return t.some(a=>e.has(a))}function X(t=V()){const e=String(t||"").trim();return e==="parent"||e==="student"}function Q(t=V()){return qt[String(t||"").trim()]||String(t||"访客")}function K(){var t,e;return window.SchoolState&&typeof window.SchoolState.getCurrentSchool=="function"?String(((t=C())==null?void 0:t.school)||window.SchoolState.getCurrentSchool()||"").trim():String(((e=C())==null?void 0:e.school)||window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||"").trim()}function J(){const t=document.getElementById("login-overlay"),e=!!(t&&getComputedStyle(t).display!=="none");return!!C()&&!e}function Ht(){if(window.NAV_STRUCTURE)return window.NAV_STRUCTURE;try{return NAV_STRUCTURE}catch(t){return null}}function Bt(t){const e=V();return!((e==="teacher"||e==="class_teacher")&&typeof window.canAccessModule=="function"&&!window.canAccessModule(t)||e==="teacher"&&["single-school-eval","exam-arranger","freshman-simulator"].includes(t)||t==="report-generator"&&typeof window.CONFIG!="undefined"&&window.CONFIG&&!window.CONFIG.showQuery)}function _(){const t=Ht();if(!t)return[];const e=V(),a=e==="teacher"||e==="class_teacher";return Object.keys(t).filter(o=>!(a&&(o==="data"||o==="tools")||a&&e==="teacher"&&o==="town")).map(o=>{const n=t[o];return{...n,key:o,items:Array.isArray(n==null?void 0:n.items)?n.items.filter(s=>Bt(s.id)):[]}}).filter(o=>o.items.length>0)}function x(t){if(!t)return null;const e=_();for(const a of e){const o=a.items.find(n=>n.id===t);if(o)return{...o,categoryKey:a.key,categoryTitle:a.title,categoryColor:a.color}}return null}function M(){var a,o,n;const t=xt[V()]||"starter-hub",e=x(t);return e?e.id:((n=(o=(a=_()[0])==null?void 0:a.items)==null?void 0:o[0])==null?void 0:n.id)||"starter-hub"}function w(){var t;return((t=document.querySelector(".section.active"))==null?void 0:t.id)||M()}function R(){return x(w())||x(M())||null}function j(){const t=_(),e=R();if(e){const o=t.find(n=>n.key===e.categoryKey);if(o)return o}const a=typeof window.getCurrentNavCategory=="function"?String(window.getCurrentNavCategory()||"").trim():"";return t.find(o=>o.key===a)||t[0]||null}function I(t){const e=new Set;return t.filter(a=>!a||!a.id||e.has(a.id)?!1:(e.add(a.id),!0))}function yt(){try{const t=JSON.parse(localStorage.getItem(ft)||"[]");return Array.isArray(t)?t.map(e=>String(e||"").trim()).filter(Boolean):[]}catch(t){return[]}}function Pt(t){try{localStorage.setItem(ft,JSON.stringify(t.map(e=>String(e||"").trim()).filter(Boolean).slice(0,F)))}catch(e){}}function kt(t){const e=x(t);e&&Pt([e.id,...yt().filter(a=>a!==e.id)])}function Y(t=F){return I(yt().map(e=>x(e)).filter(Boolean)).slice(0,t)}function z(t=U){const e=[...Y(t),R(),x(M()),...Rt.map(a=>x(a))];return I(e).slice(0,t)}function Nt(){var a;const t=document.getElementById("mode-badge"),e=String((t==null?void 0:t.textContent)||"").trim();return e||String(((a=window.CONFIG)==null?void 0:a.name)||"学校工作台").trim()}function O(){var e;const t=document.getElementById("cohort-selector");return(e=t==null?void 0:t.selectedOptions)!=null&&e[0]&&String(t.selectedOptions[0].textContent||t.value||"届别未选择").trim()||"届别未选择"}function wt(){const t=document.getElementById("cohort-selector");return t?Array.from(t.options||[]).filter(e=>String(e.value||"").trim()).map(e=>({value:String(e.value||"").trim(),label:String(e.textContent||e.value||"").trim()})):[]}function Ut(){return document.querySelector("main.app-main")}function Z(){const t=Ut();if(t&&typeof t.scrollTo=="function"){t.scrollTo({top:0,behavior:"auto"});return}const e=document.scrollingElement||document.documentElement||document.body;if(e&&typeof e.scrollTo=="function"){e.scrollTo({top:0,behavior:"auto"});return}typeof window.scrollTo=="function"&&window.scrollTo({top:0,behavior:"auto"})}function Vt(t=document){if(!$())return;t.querySelectorAll(".table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable").forEach(a=>{const o=jt(a);o.length&&(a.classList.add("mobile-card-table"),Array.from(a.querySelectorAll("tbody tr")).forEach(n=>{let s=String(n.getAttribute("data-mobile-card-title")||"").trim();Array.from(n.children).forEach((r,p)=>{if(!(r instanceof HTMLElement)||r.hasAttribute("colspan"))return;const b=String(o[p]||`字段${p+1}`).replace(/\s+/g," ").trim(),S=String(r.textContent||"").replace(/\s+/g," ").trim();!s&&S&&p<=1&&(s=S),r.setAttribute("data-label",b)}),s&&n.setAttribute("data-mobile-card-title",s)}))})}function jt(t){const e=Array.from(t.querySelectorAll("thead tr"));if(!e.length)return[];const a=[];let o=0;return e.forEach((n,s)=>{a[s]||(a[s]=[]);let r=0;Array.from(n.children).forEach(p=>{for(;a[s][r];)r+=1;const b=Math.max(parseInt(p.getAttribute("colspan")||"1",10)||1,1),S=Math.max(parseInt(p.getAttribute("rowspan")||"1",10)||1,1),m=String(p.textContent||"").replace(/\s+/g," ").trim();for(let D=0;D<S;D+=1){a[s+D]||(a[s+D]=[]);for(let ht=0;ht<b;ht+=1)a[s+D][r+ht]=m}r+=b,r>o&&(o=r)})}),Array.from({length:o},(n,s)=>{const r=[];return a.forEach(p=>{const b=String((p==null?void 0:p[s])||"").trim();!b||r[r.length-1]===b||r.push(b)}),r.join(" / ")})}function tt(t=document){if(!$())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;Vt(e)}function gt(t=document){if(!$())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;clearTimeout(window.__RESPONSIVE_TABLE_REFRESH_TIMER__||0),window.__RESPONSIVE_TABLE_REFRESH_TIMER__=window.setTimeout(()=>{tt(e)},60)}function Dt(t=document.querySelector(".section.active")||document.getElementById("app")||document.body){if(typeof MutationObserver!="function")return;const e=t instanceof HTMLElement?t:document.querySelector(".section.active")||document.getElementById("app")||document.body||document.documentElement;if(!e||window.__RESPONSIVE_TABLE_OBSERVER__&&mt===e)return;window.__RESPONSIVE_TABLE_OBSERVER__&&typeof window.__RESPONSIVE_TABLE_OBSERVER__.disconnect=="function"&&window.__RESPONSIVE_TABLE_OBSERVER__.disconnect();const a=new MutationObserver(o=>{if(!$())return;o.some(s=>Array.from(s.addedNodes||[]).some(r=>{var p;return r instanceof HTMLElement?r.matches("table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table, .section, #parent-view-container")||!!((p=r.querySelector)!=null&&p.call(r,"table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table")):!1}))&&gt(e)});a.observe(e,{childList:!0,subtree:!0}),window.__RESPONSIVE_TABLE_OBSERVER__=a,mt=e}window.refreshResponsiveMobileTables=tt;function Ft(t=document){$()&&(t.querySelectorAll('.section [style*="grid-template-columns"]').forEach(e=>{e.closest("#parent-view-container")||e.classList.add("mobile-stack-grid")}),t.querySelectorAll('.section [style*="display:flex"]').forEach(e=>{e.closest("#parent-view-container")||e.closest("#apk-mobile-shell")||e.children.length<2||e.classList.add("mobile-wrap-row")}))}function Wt(){if(document.getElementById("mobile-experience-styles"))return;const t=document.createElement("style");t.id="mobile-experience-styles",t.textContent=`
            @media screen and (max-width: 960px) {
                body[data-mobile-architecture="apk-v2"] {
                    overflow-x: hidden;
                    overscroll-behavior-y: contain;
                    touch-action: manipulation;
                }
                body[data-mobile-architecture="apk-v2"] #app {
                    max-width: 100vw;
                    overflow-x: hidden;
                }
                body[data-mobile-architecture="apk-v2"] main.app-main {
                    width: 100%;
                    max-width: 100vw;
                    padding: calc(var(--app-safe-top, 0px) + 148px) 10px calc(var(--app-safe-bottom, 0px) + 110px) !important;
                    -webkit-overflow-scrolling: touch;
                    scroll-padding-top: calc(var(--app-safe-top, 0px) + 148px);
                    scroll-padding-bottom: calc(var(--app-safe-bottom, 0px) + 120px);
                }
                body[data-mobile-architecture="apk-v2"] .section.active {
                    max-width: 100%;
                    overflow: visible;
                }
                body[data-mobile-architecture="apk-v2"] .module-desc-bar,
                body[data-mobile-architecture="apk-v2"] .analysis-shell-head,
                body[data-mobile-architecture="apk-v2"] .analysis-inline-panel,
                body[data-mobile-architecture="apk-v2"] .analysis-anchor-panel,
                body[data-mobile-architecture="apk-v2"] .card-box {
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                    border-radius: 18px !important;
                }
                body[data-mobile-architecture="apk-v2"] input,
                body[data-mobile-architecture="apk-v2"] select,
                body[data-mobile-architecture="apk-v2"] textarea {
                    min-height: 44px;
                    font-size: 16px !important;
                }
                body[data-mobile-architecture="apk-v2"] button,
                body[data-mobile-architecture="apk-v2"] .btn {
                    min-height: 44px;
                }
                body[data-mobile-architecture="apk-v2"] .table-wrap {
                    width: 100%;
                    max-width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior-x: contain;
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) {
                    display: block;
                    width: 100%;
                    min-width: 0 !important;
                    border-collapse: separate;
                    border-spacing: 0 10px;
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) thead {
                    display: none !important;
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) tbody,
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) tr,
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) td {
                    display: block;
                    width: 100%;
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) tr {
                    padding: 12px;
                    border: 1px solid rgba(148, 163, 184, .22);
                    border-radius: 16px;
                    background: rgba(255, 255, 255, .92);
                    box-shadow: 0 14px 28px -24px rgba(15, 23, 42, .45);
                }
                body.dark-mode[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) tr {
                    background: rgba(15, 23, 42, .92);
                    border-color: rgba(148, 163, 184, .2);
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) td {
                    padding: 8px 2px !important;
                    border: 0 !important;
                    display: grid;
                    grid-template-columns: minmax(86px, 34%) minmax(0, 1fr);
                    gap: 10px;
                    align-items: start;
                    text-align: right;
                    white-space: normal;
                    word-break: break-word;
                }
                body[data-mobile-architecture="apk-v2"] table.mobile-card-table:not(.student-detail-mobile-table) td::before {
                    content: attr(data-label);
                    color: #64748b;
                    font-weight: 700;
                    font-size: 12px;
                    text-align: left;
                    line-height: 1.45;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-title,
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-subtitle,
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-rail-chip {
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-rail-chip {
                    max-width: 56vw;
                    scroll-snap-align: center;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-rail {
                    scroll-snap-type: x proximity;
                    padding-bottom: 8px;
                }
                body[data-mobile-architecture="apk-v2"] .swal2-popup {
                    width: min(92vw, 420px) !important;
                    max-height: calc(100dvh - var(--app-safe-top, 0px) - var(--app-safe-bottom, 0px) - 24px);
                    overflow: auto;
                }
            }
            @media screen and (max-width: 420px) {
                body[data-mobile-architecture="apk-v2"] main.app-main {
                    padding-left: 8px !important;
                    padding-right: 8px !important;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-topbar {
                    grid-template-columns: 40px minmax(0, 1fr) 40px;
                    gap: 8px;
                    padding: 10px;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-icon {
                    width: 40px;
                    height: 40px;
                }
            }
        `,document.head.appendChild(t)}function et(){const t=document.querySelector(".section.active")||document;Wt(),tt(t),gt(t),Dt(t),Ft(t)}function Qt(t){if(!(t instanceof HTMLElement))return!1;const e=window.getComputedStyle(t);return e.display==="none"||e.visibility==="hidden"||Number(e.opacity||1)===0||t.getAttribute("aria-hidden")==="true"||t.hidden?!1:t.getClientRects().length>0}function vt(){if(window.Swal&&typeof window.Swal.isVisible=="function"&&window.Swal.isVisible())return!0;const t=[".swal2-container",".modal",'[role="dialog"]','[aria-modal="true"]',".dialog-overlay",".dialog-backdrop"];return Array.from(document.querySelectorAll(t.join(","))).some(e=>{if(!(e instanceof HTMLElement)||e.closest("#apk-mobile-shell")||!Qt(e))return!1;const a=window.getComputedStyle(e),o=Number(a.zIndex||0);return a.position==="fixed"||o>=1e3})}function St(t=document.getElementById("apk-mobile-shell")){t&&(t.dataset.modalOpen=vt()?"true":"false")}function $t(){_t.forEach((t,e)=>{window.setTimeout(()=>{const a=document.getElementById("student-details");if(!(!a||!a.classList.contains("active"))){if(typeof window.requestStudentDetailsPrimaryFocus=="function"){window.requestStudentDetailsPrimaryFocus(e);return}typeof window.focusStudentDetailsPrimaryFlow=="function"&&window.focusStudentDetailsPrimaryFlow()}},t)})}function Kt(){["mobile-manager-app","mobile-query-shell"].forEach(t=>{const e=document.getElementById(t);e&&(e.setAttribute("aria-hidden","true"),e.style.display="none")})}function Yt(){const t=document.getElementById("app");if(t){if(!$()){t.classList.remove("hidden"),t.style.display="";return}if(!J()){t.classList.add("hidden"),t.style.display="none";return}X()||(t.classList.remove("hidden"),t.style.display="")}}function zt(){const t=document.querySelector('meta[name="theme-color"]');t&&t.setAttribute("content",document.body.classList.contains("dark-mode")?"#08111d":"#eef3f8")}function Gt(){const t=!!(E!=null&&E.matches);document.body.dataset.nativeApp=W?"true":"false",document.body.dataset.systemTheme=t?"dark":"light",W&&$()&&(document.body.classList.toggle("dark-mode",t),localStorage.setItem("theme-dark",t?"true":"false")),document.documentElement.style.colorScheme=document.body.classList.contains("dark-mode")?"dark":"light",zt()}function de(){const t=w(),e=z(),a=[u("search","全局搜索","快速搜索学生、模块和操作入口。","ti ti-search"),u("cohorts","切换届别","在不同届别工作区之间快速切换。","ti ti-id-badge-2"),typeof window.openUserPasswordModal=="function"?u("password","修改密码","直接打开当前账号的密码修改入口。","ti ti-lock"):"",u("logout","退出登录","返回登录页，重新选择账号进入。","ti ti-logout","is-danger")].filter(Boolean);return`
            ${y("快捷入口","保留高频动作，其余能力统一收进模块总览。")}
            <section class="apk-sheet-section">
                <div class="apk-sheet-section-head">
                    <span class="apk-sheet-section-title">高频模块</span>
                    <span class="apk-sheet-section-note">Quick Access</span>
                </div>
                <div class="apk-sheet-grid">
                    ${e.map(o=>L(o,t)).join("")}
                </div>
            </section>
            <section class="apk-sheet-section">
                <div class="apk-sheet-section-head">
                    <span class="apk-sheet-section-title">系统动作</span>
                    <span class="apk-sheet-section-note">Utilities</span>
                </div>
                <div class="apk-sheet-grid">
                    ${a.join("")}
                </div>
            </section>
        `}function Tt(t){const e=t.querySelector(".apk-rail-chip.is-active");!e||typeof e.scrollIntoView!="function"||e.scrollIntoView({inline:"center",block:"nearest",behavior:"auto"})}function Et(t){const e=document.getElementById("cohort-selector");!e||!t||(e.value=t,e.dispatchEvent(new Event("change",{bubbles:!0})),d(""),A.forEach(a=>{window.setTimeout(()=>{Z(),c()},a)}))}function k(){return{workbench:"学校工作台",mobileWorkbench:"移动工作台",mobilePreparing:"移动工作台正在准备中",openLibrary:"打开模块资源库",openSearch:"打开全局搜索",closeSheet:"关闭面板",closeLibrary:"关闭模块资源库",cohortPlaceholder:"届别未选择",home:"工作台",modules:"模块",recent:"最近",account:"我的",openModule:"打开该模块",currentCategoryEmpty:"当前分类暂无可用模块",current:"当前",open:"打开",workspaceNote:"Workspace",moduleOverviewTitle:"模块总览",moduleOverviewCopy:"按分类切换工作模块，减少手机端来回翻找入口的次数。",noModules:"当前账号还没有可切换的模块入口。",quickTitle:"最近与常用",quickCopy:"先给你最近用过的模块，再补高频入口，减少反复进出分类面板。",quickHeroTitle:"跨分类切换先看这里",quickHeroCopy:"默认优先展示最近使用，同时保留完整模块资源库入口。",recentModulesTitle:"最近使用",recentModulesNote:"Recent Modules",suggestedTitle:"高频推荐",suggestedNote:"Suggested",utilitiesTitle:"系统动作",utilitiesNote:"Utilities",noRecent:"还没有可回跳的最近模块，可以先从当前分类或全部模块进入。",appLibraryTitle:"模块资源库",appLibraryCopy:"像 App 资源库一样集中浏览全部模块，支持最近使用、当前分类和快速搜索。",appLibrarySearch:"搜索模块、功能或分类",appLibrarySearchTitle:"搜索结果",appLibrarySearchNote:"Results",appLibrarySearchEmpty:"没有匹配的模块，试试更短的关键词。",appLibraryCurrentTitle:"当前分类",appLibraryCurrentNote:"Now Browsing",appLibraryAllTitle:"全部分类",appLibraryAllNote:"App Library",allModulesTitle:"全部模块",allModulesCopy:"找不到所需功能时，直接打开完整模块总览。",searchTitle:"全局搜索",searchCopy:"快速搜索学生、模块和常用入口。",cohortsTitle:"切换届别",cohortsCopy:"在不同届别工作区之间快速跳转。",passwordTitle:"修改密码",passwordCopy:"直接打开当前账号的密码修改入口。",logoutTitle:"退出登录",logoutCopy:"返回登录页，重新选择账号进入。",accountTitle:"账号与设置",accountCopy:"APK 默认跟随系统主题，并把常用设置集中到这一层。",currentSchool:"当前学校",currentCohort:"当前届别",themeMode:"主题模式",themeDark:"深色",themeLight:"浅色",followSystem:"跟随系统",runtimeEnv:"运行环境",mobileBrowser:"移动浏览器",notLoggedIn:"未登录",unknownSchool:"未识别学校",switchCohortTitle:"切换届别",switchCohortCopy:"统一从这里切届别，避免手机端入口与工作区状态脱节。",noCohorts:"暂无可切换届别。",noCohortChoices:"当前没有可切换的届别，请先完成数据恢复。",usingCurrentCohort:"当前正在使用的届别。",switchToThisCohort:"点击切换到这个届别。"}}function Xt(){return document.body.dataset.systemTheme==="dark"?k().themeDark:k().themeLight}function Jt(t,e=null){return[t==null?void 0:t.text,t==null?void 0:t.hint,t==null?void 0:t.id,e==null?void 0:e.title,e==null?void 0:e.eyebrow].filter(Boolean).join(" ").toLowerCase()}function Zt(){const t=String(g||"").trim().toLowerCase();return t?I(_().flatMap(e=>e.items.filter(a=>Jt(a,e).includes(t)).map(a=>({...a,categoryTitle:e.title,categoryKey:e.key,categoryColor:e.color})))):[]}function y(t,e){return`
            <div class="apk-sheet-header">
                <div>
                    <strong>${i(t)}</strong>
                    <span>${i(e)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-sheet" aria-label="${i(k().closeSheet)}">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        `}function T(t,e){return`
            <div class="apk-sheet-section-head">
                <span class="apk-sheet-section-title">${i(t)}</span>
                <span class="apk-sheet-section-note">${i(e)}</span>
            </div>
        `}function L(t,e){const a=k();return`
            <button type="button" class="apk-sheet-card${t.id===e?" is-active":""}" data-apk-module="${i(t.id)}">
                <strong>${i(t.text||t.id)}</strong>
                <span>${i(t.hint||t.categoryTitle||a.openModule)}</span>
            </button>
        `}function u(t,e,a,o,n=""){return`
            <button type="button" class="apk-sheet-card apk-sheet-card--action${n?` ${n}`:""}" data-apk-action="${i(t)}">
                <i class="${i(o)}"></i>
                <strong>${i(e)}</strong>
                <span>${i(a)}</span>
            </button>
        `}function G(t,e){const a=k(),o=t.id===e;return`
            <button type="button" class="apk-switch-row${o?" is-active":""}" data-apk-module="${i(t.id)}">
                <span class="apk-switch-row-copy">
                    <strong>${i(t.text||t.id)}</strong>
                    <span>${i(t.hint||t.categoryTitle||"跨分类快速直达")}</span>
                </span>
                <span class="apk-switch-row-meta">${o?a.current:a.open}</span>
            </button>
        `}function Mt(t,e){const a=String(t.text||t.id||"").trim().slice(0,2)||"模块";return`
            <button type="button" class="apk-library-mini${t.id===e?" is-active":""}" data-apk-module="${i(t.id)}">
                <span class="apk-library-mini-badge">${i(a)}</span>
                <span class="apk-library-mini-copy">
                    <strong>${i(t.text||t.id)}</strong>
                    <span>${i(t.hint||t.categoryTitle||"模块")}</span>
                </span>
            </button>
        `}function te(t,e){return`
            <article class="apk-library-card" style="--apk-library-accent:${i(t.color||"#2563eb")}">
                <div class="apk-library-card-head">
                    <div>
                        <strong>${i(t.title)}</strong>
                        <span>${i(`${t.items.length} 个模块`)}</span>
                    </div>
                    <span class="apk-library-card-count">${i(String(t.items.length).padStart(2,"0"))}</span>
                </div>
                <div class="apk-library-mini-grid">
                    ${t.items.slice(0,4).map(a=>Mt({...a,categoryTitle:t.title},e)).join("")}
                </div>
            </article>
        `}function ee(){var S;const t=k(),e=w(),a=String(g||"").trim(),o=Zt(),n=j(),s=I([...Y(6),R()]).slice(0,6),r=new Set(s.map(m=>m.id)),p=z(6+r.size).filter(m=>!r.has(m.id)).slice(0,6),b=_();return`
            <div class="apk-library-head">
                <div class="apk-library-head-copy">
                    <strong>${i(t.appLibraryTitle)}</strong>
                    <span>${i(t.appLibraryCopy)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-library" aria-label="${i(t.closeLibrary)}">
                    <i class="ti ti-arrow-left"></i>
                </button>
            </div>
            <label class="apk-library-search">
                <i class="ti ti-search"></i>
                <input type="search" data-apk-library-search value="${i(a)}" placeholder="${i(t.appLibrarySearch)}" autocomplete="off" />
            </label>
            ${a?`
                    <section class="apk-library-section">
                        ${T(t.appLibrarySearchTitle,t.appLibrarySearchNote)}
                        ${o.length?`<div class="apk-sheet-grid apk-library-results">${o.map(m=>L(m,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.appLibrarySearchEmpty)}</div>`}
                    </section>
                `:`
                    <section class="apk-library-section">
                        ${T(t.recentModulesTitle,t.recentModulesNote)}
                        ${s.length?`<div class="apk-switch-list">${s.map(m=>G(m,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.noRecent)}</div>`}
                    </section>
                    ${p.length?`
                            <section class="apk-library-section">
                                ${T(t.suggestedTitle,t.suggestedNote)}
                                <div class="apk-sheet-grid apk-library-results">
                                    ${p.map(m=>L(m,e)).join("")}
                                </div>
                            </section>
                        `:""}
                    ${(S=n==null?void 0:n.items)!=null&&S.length?`
                            <section class="apk-library-section">
                                ${T(t.appLibraryCurrentTitle,t.appLibraryCurrentNote)}
                                <article class="apk-library-spotlight" style="--apk-library-accent:${i(n.color||"#2563eb")}">
                                    <div class="apk-library-card-head">
                                        <div>
                                            <strong>${i(n.title)}</strong>
                                            <span>${i(`${n.items.length} 个模块`)}</span>
                                        </div>
                                        <span class="apk-library-card-count">${i(String(n.items.length).padStart(2,"0"))}</span>
                                    </div>
                                    <div class="apk-library-mini-grid">
                                        ${n.items.slice(0,4).map(m=>Mt({...m,categoryTitle:n.title},e)).join("")}
                                    </div>
                                </article>
                            </section>
                        `:""}
                    <section class="apk-library-section">
                        ${T(t.appLibraryAllTitle,t.appLibraryAllNote)}
                        <div class="apk-library-clusters">
                            ${b.map(m=>te(m,e)).join("")}
                        </div>
                    </section>
                `}
        `}function H(){let t=document.getElementById("apk-mobile-shell");if(t)return t;const e=k();return t=document.createElement("div"),t.id="apk-mobile-shell",t.setAttribute("aria-hidden","true"),t.innerHTML=`
            <div class="apk-shell-top">
                <div class="apk-shell-topbar apk-shell-surface">
                    <button type="button" class="apk-shell-icon" data-apk-action="library" aria-label="${i(e.openLibrary)}">
                        <i class="ti ti-layout-sidebar-left-expand"></i>
                    </button>
                    <div class="apk-shell-copy">
                        <span class="apk-shell-kicker" data-apk-field="role">${i(e.workbench)}</span>
                        <strong class="apk-shell-title" data-apk-field="title">智慧教务</strong>
                        <span class="apk-shell-subtitle" data-apk-field="subtitle">${i(e.mobilePreparing)}</span>
                    </div>
                    <button type="button" class="apk-shell-icon" data-apk-action="search" aria-label="${i(e.openSearch)}">
                        <i class="ti ti-search"></i>
                    </button>
                </div>
                <div class="apk-shell-meta">
                    <button type="button" class="apk-shell-pill apk-shell-surface" data-apk-action="cohorts">
                        <i class="ti ti-id-badge-2"></i>
                        <span data-apk-field="cohort">${i(e.cohortPlaceholder)}</span>
                    </button>
                    <div class="apk-shell-pill apk-shell-surface is-static">
                        <i class="ti ti-device-imac"></i>
                        <span data-apk-field="mode">${i(e.workbench)}</span>
                    </div>
                </div>
                <div class="apk-shell-rail" data-apk-rail></div>
            </div>
            <button type="button" class="apk-shell-library-backdrop" data-apk-action="close-library" aria-label="${i(e.closeLibrary)}"></button>
            <div class="apk-shell-library">
                <div class="apk-shell-library-panel apk-shell-surface" data-apk-library-panel></div>
            </div>
            <button type="button" class="apk-shell-backdrop" data-apk-action="close-sheet" aria-label="${i(e.closeSheet)}"></button>
            <div class="apk-shell-sheet">
                <div class="apk-shell-sheet-panel apk-shell-surface" data-apk-sheet-panel></div>
            </div>
            <div class="apk-shell-tabs apk-shell-surface">
                <button type="button" class="apk-shell-tab" data-apk-tab="home">
                    <i class="ti ti-home"></i>
                    <span>${i(e.home)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="modules">
                    <i class="ti ti-layout-grid"></i>
                    <span>${i(e.modules)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="quick">
                    <i class="ti ti-history"></i>
                    <span>${i(e.recent)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="account">
                    <i class="ti ti-user-circle"></i>
                    <span>${i(e.account)}</span>
                </button>
            </div>
        `,t.addEventListener("click",pt),t.addEventListener("input",ie),document.body.appendChild(t),t}function at(){const t=k(),e=_(),a=w();return e.length?[y(t.moduleOverviewTitle,t.moduleOverviewCopy),...e.map(o=>`
                <section class="apk-sheet-section">
                    ${T(o.title,o.eyebrow||t.workspaceNote)}
                    <div class="apk-sheet-grid">
                        ${o.items.map(n=>L({...n,categoryTitle:o.title},a)).join("")}
                    </div>
                </section>
            `)].join(""):`${y(t.moduleOverviewTitle,t.noModules)}
                <div class="apk-sheet-empty">${i(t.noModules)}</div>`}function ot(){const t=k(),e=w(),a=I([...Y(F),R()]).slice(0,4),o=new Set(a.map(r=>r.id)),n=z(U+o.size).filter(r=>!o.has(r.id)).slice(0,U),s=[u("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand"),u("search",t.searchTitle,t.searchCopy,"ti ti-search"),u("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2"),typeof window.openUserPasswordModal=="function"?u("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):"",u("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")].filter(Boolean);return`
            ${y(t.quickTitle,t.quickCopy)}
            <section class="apk-quick-hero">
                <div class="apk-quick-hero-copy">
                    <strong>${i(t.quickHeroTitle)}</strong>
                    <span>${i(t.quickHeroCopy)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="library" aria-label="${i(t.openLibrary)}">
                    <i class="ti ti-layout-sidebar-left-expand"></i>
                </button>
            </section>
            <section class="apk-sheet-section">
                ${T(t.recentModulesTitle,t.recentModulesNote)}
                ${a.length?`<div class="apk-switch-list">${a.map(r=>G(r,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.noRecent)}</div>`}
            </section>
            ${n.length?`
                    <section class="apk-sheet-section">
                        ${T(t.suggestedTitle,t.suggestedNote)}
                        <div class="apk-sheet-grid">
                            ${n.map(r=>L(r,e)).join("")}
                        </div>
                    </section>
                `:""}
            <section class="apk-sheet-section">
                ${T(t.utilitiesTitle,t.utilitiesNote)}
                <div class="apk-sheet-grid">
                    ${s.join("")}
                </div>
            </section>
        `}function it(){const t=k(),e=C();return`
            ${y(t.accountTitle,t.accountCopy)}
            <section class="apk-sheet-section">
                <div class="apk-account-card">
                    <div class="apk-account-name">${i((e==null?void 0:e.name)||t.notLoggedIn)}</div>
                    <div class="apk-account-role">${i(Q())}</div>
                    <div class="apk-account-grid">
                        <div class="apk-account-row">
                            <span>${i(t.currentSchool)}</span>
                            <strong>${i(K()||t.unknownSchool)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.currentCohort)}</span>
                            <strong>${i(O())}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.themeMode)}</span>
                            <strong>${i(`${t.followSystem} · ${Xt()}`)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.runtimeEnv)}</span>
                            <strong>${i(W?"Android APK":t.mobileBrowser)}</strong>
                        </div>
                    </div>
                </div>
            </section>
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${u("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2")}
                    ${u("search",t.searchTitle,t.searchCopy,"ti ti-search")}
                    ${u("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand")}
                    ${typeof window.openUserPasswordModal=="function"?u("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):""}
                    ${u("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")}
                </div>
            </section>
        `}function nt(){var o;const t=k(),e=wt(),a=((o=document.getElementById("cohort-selector"))==null?void 0:o.value)||"";return e.length?`
            ${y(t.switchCohortTitle,t.switchCohortCopy)}
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${e.map(n=>`
                        <button type="button" class="apk-sheet-card${n.value===a?" is-active":""}" data-apk-cohort="${i(n.value)}">
                            <strong>${i(n.label)}</strong>
                            <span>${i(n.value===a?t.usingCurrentCohort:t.switchToThisCohort)}</span>
                        </button>
                    `).join("")}
                </div>
            </section>
        `:`${y(t.switchCohortTitle,t.noCohortChoices)}
                <div class="apk-sheet-empty">${i(t.noCohorts)}</div>`}function ae(t){const e=t.querySelector("[data-apk-library-panel]");e&&(e.innerHTML=h?ee():"")}function st(){const e=H().querySelector("[data-apk-sheet-panel]");if(e){if(!l){e.innerHTML="";return}if(l==="modules"){e.innerHTML=at();return}if(l==="quick"){e.innerHTML=ot();return}if(l==="account"){e.innerHTML=it();return}l==="cohorts"&&(e.innerHTML=nt())}}function rt(t){var s;const e=k(),a=t.querySelector("[data-apk-rail]");if(!a)return;const o=j(),n=w();if(!((s=o==null?void 0:o.items)!=null&&s.length)){a.innerHTML=`<div class="apk-rail-empty">${i(e.currentCategoryEmpty)}</div>`;return}a.innerHTML=o.items.map(r=>`
            <button type="button" class="apk-rail-chip${r.id===n?" is-active":""}" data-apk-module="${i(r.id)}">
                ${i(r.text||r.id)}
            </button>
        `).join(""),window.requestAnimationFrame(()=>Tt(t))}function lt(t){const e=w(),a=M();t.querySelectorAll(".apk-shell-tab").forEach(o=>{const n=o.getAttribute("data-apk-tab"),s=!h&&(n==="home"&&!l&&e===a||n==="modules"&&l==="modules"||n==="quick"&&l==="quick"||n==="account"&&l==="account");o.classList.toggle("is-active",s)})}function q(){const t=k(),e=H(),a=R(),o=j(),n=[K()||t.unknownSchool,(o==null?void 0:o.title)||t.workbench,O()].filter(Boolean).join(" · ");e.style.setProperty("--apk-accent",(a==null?void 0:a.categoryColor)||(o==null?void 0:o.color)||"#2563eb"),e.setAttribute("aria-hidden","false"),e.dataset.sheetOpen=l?"true":"false",e.dataset.sheetMode=l||"",e.dataset.libraryOpen=h?"true":"false";const s={role:`${Q()}工作台`,title:(a==null?void 0:a.text)||"智慧教务",subtitle:n,cohort:O(),mode:t.workbench};Object.entries(s).forEach(([r,p])=>{const b=e.querySelector(`[data-apk-field="${r}"]`);b&&(b.textContent=p)}),St(e),rt(e),st(),ae(e),lt(e)}function oe(t,e={}){h=!!t,h&&(l=""),!h&&e.resetQuery!==!1&&(g=""),q()}function B(t){oe(typeof t=="boolean"?t:!h)}function d(t=""){l=t,t&&(h=!1,g=""),q()}function f(t){d(l===t?"":t)}function P(t){!t||typeof window.switchTab!="function"||(l="",h=!1,g="",q(),Z(),window.switchTab(t),kt(t),t==="student-details"&&$t(),A.forEach(e=>{window.setTimeout(()=>{var a;(a=document.getElementById(t))!=null&&a.classList.contains("active")&&(et(),t==="student-details"&&typeof window.requestStudentDetailsPrimaryFocus=="function"&&window.requestStudentDetailsPrimaryFocus()),c()},e)}))}function ct(){h=!1,g="",d(""),typeof window.openSpotlight=="function"&&window.openSpotlight()}function ut(){h=!1,g="",d(""),typeof window.openUserPasswordModal=="function"&&window.openUserPasswordModal()}function dt(t){if(t==="home"){P(M());return}if(t==="modules"){f("modules");return}if(t==="quick"){f("quick");return}t==="account"&&f("account")}function ie(t){const e=t.target.closest("[data-apk-library-search]");if(!e)return;const a=typeof e.selectionStart=="number"?e.selectionStart:String(e.value||"").length;if(g=String(e.value||""),q(),!h)return;const o=document.querySelector("[data-apk-library-search]");o&&(typeof o.focus=="function"&&o.focus({preventScroll:!0}),typeof o.setSelectionRange=="function"&&o.setSelectionRange(a,a))}function pt(t){const e=t.target.closest("[data-apk-action], [data-apk-module], [data-apk-cohort], [data-apk-tab]");if(!e)return;t.preventDefault();const a=e.getAttribute("data-apk-module");if(a){P(a);return}const o=e.getAttribute("data-apk-cohort");if(o){Et(o);return}const n=e.getAttribute("data-apk-tab");if(n){dt(n);return}const s=e.getAttribute("data-apk-action");if(s==="close-sheet"){d("");return}if(s==="library"){B();return}if(s==="close-library"){B(!1);return}if(s==="modules"){f("modules");return}if(s==="quick"){f("quick");return}if(s==="account"){f("account");return}if(s==="cohorts"){f("cohorts");return}if(s==="search"){ct();return}if(s==="password"){ut();return}s==="logout"&&window.Auth&&typeof window.Auth.logout=="function"&&(h=!1,g="",d(""),window.Auth.logout())}function ne(t){var a;if(!$()||!J()||X()||vt())return;const e=(a=t.touches)==null?void 0:a[0];e&&(v={startX:e.clientX,startY:e.clientY,canOpenLibrary:!h&&!l&&e.clientX<=28,canCloseLibrary:h})}function se(t){var n;if(!v)return;const e=(n=t.touches)==null?void 0:n[0];if(!e)return;const a=e.clientX-v.startX,o=e.clientY-v.startY;if(Math.abs(o)>42){v=null;return}if(v.canOpenLibrary&&a>=80){B(!0),v=null;return}v.canCloseLibrary&&a<=-80&&(B(!1),v=null)}function Lt(){v=null}function N(t,e,a){if(!t||typeof t[e]!="function"||t[e][a])return;const o=t[e],n=function(){const s=o.apply(this,arguments);return c(),A.forEach(r=>{window.setTimeout(c,r)}),s};n[a]=!0,t[e]=n}function re(){if(window.Swal&&(N(window.Swal,"close","__apkMobileWrapped__"),typeof window.Swal.fire=="function"&&!window.Swal.fire.__apkMobileWrapped__)){const t=window.Swal.fire,e=function(){const a=t.apply(window.Swal,arguments);return c(),A.forEach(o=>{window.setTimeout(c,o)}),a&&typeof a.finally=="function"&&a.finally(()=>{A.forEach(o=>{window.setTimeout(c,o)})}),a};e.__apkMobileWrapped__=!0,window.Swal.fire=e}}function le(){N(window,"switchTab","__apkMobileWrapped__"),N(window,"renderNavigation","__apkMobileWrapped__"),N(window,"switchNavCategory","__apkMobileWrapped__"),window.Auth&&(N(window.Auth,"applyRoleView","__apkMobileWrapped__"),N(window.Auth,"renderParentView","__apkMobileWrapped__")),re()}function ce(){le(),Gt();const t=$(),e=t&&J()&&!X();document.body.dataset.mobileQuery=t?"true":"false",e?document.body.dataset.mobileArchitecture="apk-v2":delete document.body.dataset.mobileArchitecture,Yt(),Kt();const a=H();if(a.style.display=e?"block":"none",a.setAttribute("aria-hidden",e?"false":"true"),!e){l="",h=!1,g="",a.dataset.sheetOpen="false",a.dataset.sheetMode="",a.dataset.libraryOpen="false",a.dataset.modalOpen="false";return}et(),q()}function c(){clearTimeout(bt),bt=window.setTimeout(ce,60)}const At={switchTab(t){const e={home:M(),students:"student-details",analysis:"summary"};if(t==="me"){d("account");return}const a=e[t]||t;P(a)},renderStudentList(){c()},showStudentDetail(){c()},renderAnalysis(){c()},openModules(){d("modules")},openLibrary(){B(!0)},openQuickActions(){d("quick")},openAccountSheet(){d("account")},openCohortSheet(){d("cohorts")},refresh:c};window.MobMgr=At,window.MobileQueryUI={refresh:c,openLibrary:()=>B(!0),openModules:()=>d("modules"),openQuick:()=>d("quick"),openAccount:()=>d("account"),openCohorts:()=>d("cohorts")},window.switchMobileTab=t=>At.switchTab(t),window.matchMedia&&(E=window.matchMedia("(prefers-color-scheme: dark)"),typeof E.addEventListener=="function"?E.addEventListener("change",c):typeof E.addListener=="function"&&E.addListener(c)),window.addEventListener("cloud-load-state",c),window.addEventListener("resize",c),window.addEventListener("orientationchange",c),window.addEventListener("load",c),window.addEventListener("pageshow",c),window.addEventListener("focus",c),document.addEventListener("touchstart",ne,{passive:!0}),document.addEventListener("touchmove",se,{passive:!0}),document.addEventListener("touchend",Lt,{passive:!0}),document.addEventListener("touchcancel",Lt,{passive:!0}),document.addEventListener("resume",c,!1),document.addEventListener("visibilitychange",()=>{document.hidden||c()}),A.forEach(t=>{window.setTimeout(c,t)}),c(),window.__MOBILE_MANAGER_PATCHED__=!0,window.__MOBILE_APP_RUNTIME_PATCHED__=!0})();
