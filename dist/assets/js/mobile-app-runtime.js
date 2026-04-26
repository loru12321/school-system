(()=>{if(typeof window=="undefined"||window.__MOBILE_APP_RUNTIME_PATCHED__)return;const bt=960,_=[80,260,900],ft=[140,420,980,1600],mt={admin:"starter-hub",director:"starter-hub",grade_director:"starter-hub",class_teacher:"student-details",teacher:"teacher-analysis"},yt=["student-details","summary","teacher-analysis","report-generator","progress-analysis","analysis","teaching-warning-center"],Z="apk-recent-modules-v1",V=8,U=6,wt={admin:"管理员",director:"校级管理",grade_director:"级部主任",class_teacher:"班主任",teacher:"教师",parent:"家长",student:"学生",guest:"访客"},D=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform=="function"&&window.Capacitor.isNativePlatform()||typeof window.Capacitor.getPlatform=="function"&&window.Capacitor.getPlatform()!=="web"));let tt=0,d="",u=!1,m="",y=null,v=null,et=null;function i(t){return String(t!=null?t:"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function gt(t,e){if(!t)return!1;const o=String(e!=null?e:"");return t.textContent===o?!1:(t.textContent=o,!0)}function S(t,e){if(!t)return!1;const o=String(e!=null?e:"");return t.__apkLastHtml===o?!1:(t.innerHTML=o,t.__apkLastHtml=o,!0)}function F(t,e,o){if(!(t!=null&&t.dataset))return!1;const a=String(o!=null?o:"");return t.dataset[e]===a?!1:(t.dataset[e]=a,!0)}function kt(t,e,o){if(!(t!=null&&t.style))return!1;const a=String(o!=null?o:"");return t.style.getPropertyValue(e)===a?!1:(t.style.setProperty(e,a),!0)}function vt(t,e,o){if(!(t!=null&&t.classList))return!1;const a=!!o;return t.classList.contains(e)===a?!1:(t.classList.toggle(e,a),!0)}function St(){var e,o,a;const t=[Number(window.innerWidth||0),Number(((e=document.documentElement)==null?void 0:e.clientWidth)||0),Number(window.outerWidth||0),Number(((o=window.screen)==null?void 0:o.width)||0),Number(((a=window.screen)==null?void 0:a.availWidth)||0)].filter(n=>Number.isFinite(n)&&n>0);return t.length?Math.min(...t):0}function g(){return St()<=bt}function L(){return window.AuthState&&typeof window.AuthState.getCurrentUser=="function"?window.AuthState.getCurrentUser():window.Auth&&window.Auth.currentUser?window.Auth.currentUser:null}function O(){var t,e,o;return window.AuthState&&typeof window.AuthState.getCurrentRole=="function"?window.AuthState.getCurrentRole():String(((t=L())==null?void 0:t.role)||((o=(e=document.body)==null?void 0:e.dataset)==null?void 0:o.role)||"guest").trim()||"guest"}function Et(){if(window.AuthState&&typeof window.AuthState.getCurrentRoles=="function")return window.AuthState.getCurrentRoles();const t=L();return(Array.isArray(t==null?void 0:t.roles)&&t.roles.length?t.roles:[t==null?void 0:t.role].filter(Boolean)).map(o=>String(o||"").trim()).filter(Boolean)}function he(t){const e=new Set(Et());return t.some(o=>e.has(o))}function j(t=O()){const e=String(t||"").trim();return e==="parent"||e==="student"}function ot(t=O()){return wt[String(t||"").trim()]||String(t||"访客")}function at(){var t,e;return window.SchoolState&&typeof window.SchoolState.getCurrentSchool=="function"?String(((t=L())==null?void 0:t.school)||window.SchoolState.getCurrentSchool()||"").trim():String(((e=L())==null?void 0:e.school)||window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||"").trim()}function W(){const t=document.getElementById("login-overlay"),e=!!(t&&getComputedStyle(t).display!=="none");return!!L()&&!e}function Tt(){if(window.NAV_STRUCTURE)return window.NAV_STRUCTURE;try{return NAV_STRUCTURE}catch(t){return null}}function Ct(t){const e=O();return!((e==="teacher"||e==="class_teacher")&&typeof window.canAccessModule=="function"&&!window.canAccessModule(t)||e==="teacher"&&["single-school-eval","exam-arranger","freshman-simulator"].includes(t)||t==="report-generator"&&typeof window.CONFIG!="undefined"&&window.CONFIG&&!window.CONFIG.showQuery)}function $(){const t=Tt();if(!t)return[];const e=O(),o=e==="teacher"||e==="class_teacher";return Object.keys(t).filter(a=>!(o&&(a==="data"||a==="tools")||o&&e==="teacher"&&a==="town")).map(a=>{const n=t[a];return{...n,key:a,items:Array.isArray(n==null?void 0:n.items)?n.items.filter(r=>Ct(r.id)):[]}}).filter(a=>a.items.length>0)}function E(t){if(!t)return null;const e=$();for(const o of e){const a=o.items.find(n=>n.id===t);if(a)return{...a,categoryKey:o.key,categoryTitle:o.title,categoryColor:o.color}}return null}function M(){var o,a,n;const t=mt[O()]||"starter-hub",e=E(t);return e?e.id:((n=(a=(o=$()[0])==null?void 0:o.items)==null?void 0:a[0])==null?void 0:n.id)||"starter-hub"}function A(){var t;return((t=document.querySelector(".section.active"))==null?void 0:t.id)||M()}function q(){return E(A())||E(M())||null}function Q(){const t=$(),e=q();if(e){const a=t.find(n=>n.key===e.categoryKey);if(a)return a}const o=typeof window.getCurrentNavCategory=="function"?String(window.getCurrentNavCategory()||"").trim():"";return t.find(a=>a.key===o)||t[0]||null}function N(t){const e=new Set;return t.filter(o=>!o||!o.id||e.has(o.id)?!1:(e.add(o.id),!0))}function it(){try{const t=JSON.parse(localStorage.getItem(Z)||"[]");return Array.isArray(t)?t.map(e=>String(e||"").trim()).filter(Boolean):[]}catch(t){return[]}}function _t(t){try{localStorage.setItem(Z,JSON.stringify(t.map(e=>String(e||"").trim()).filter(Boolean).slice(0,V)))}catch(e){}}function Lt(t){const e=E(t);e&&_t([e.id,...it().filter(o=>o!==e.id)])}function Y(t=V){return N(it().map(e=>E(e)).filter(Boolean)).slice(0,t)}function nt(t=U){const e=[...Y(t),q(),E(M()),...yt.map(o=>E(o))];return N(e).slice(0,t)}function be(){var o;const t=document.getElementById("mode-badge"),e=String((t==null?void 0:t.textContent)||"").trim();return e||String(((o=window.CONFIG)==null?void 0:o.name)||"学校工作台").trim()}function K(){var e;const t=document.getElementById("cohort-selector");return(e=t==null?void 0:t.selectedOptions)!=null&&e[0]&&String(t.selectedOptions[0].textContent||t.value||"届别未选择").trim()||"届别未选择"}function $t(){const t=document.getElementById("cohort-selector");return t?Array.from(t.options||[]).filter(e=>String(e.value||"").trim()).map(e=>({value:String(e.value||"").trim(),label:String(e.textContent||e.value||"").trim()})):[]}function Mt(){return document.querySelector("main.app-main")}function rt(){const t=Mt();if(t&&typeof t.scrollTo=="function"){t.scrollTo({top:0,behavior:"auto"});return}const e=document.scrollingElement||document.documentElement||document.body;if(e&&typeof e.scrollTo=="function"){e.scrollTo({top:0,behavior:"auto"});return}typeof window.scrollTo=="function"&&window.scrollTo({top:0,behavior:"auto"})}function At(t=document){if(!g())return;t.querySelectorAll(".table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable").forEach(o=>{const a=xt(o);a.length&&(o.classList.add("mobile-card-table"),Array.from(o.querySelectorAll("tbody tr")).forEach(n=>{let r=String(n.getAttribute("data-mobile-card-title")||"").trim();Array.from(n.children).forEach((s,c)=>{if(!(s instanceof HTMLElement)||s.hasAttribute("colspan"))return;const f=String(a[c]||`字段${c+1}`).replace(/\s+/g," ").trim(),C=String(s.textContent||"").replace(/\s+/g," ").trim();!r&&C&&c<=1&&(r=C),s.setAttribute("data-label",f)}),r&&n.setAttribute("data-mobile-card-title",r)}))})}function xt(t){const e=Array.from(t.querySelectorAll("thead tr"));if(!e.length)return[];const o=[];let a=0;return e.forEach((n,r)=>{o[r]||(o[r]=[]);let s=0;Array.from(n.children).forEach(c=>{for(;o[r][s];)s+=1;const f=Math.max(parseInt(c.getAttribute("colspan")||"1",10)||1,1),C=Math.max(parseInt(c.getAttribute("rowspan")||"1",10)||1,1),h=String(c.textContent||"").replace(/\s+/g," ").trim();for(let P=0;P<C;P+=1){o[r+P]||(o[r+P]=[]);for(let J=0;J<f;J+=1)o[r+P][s+J]=h}s+=f,s>a&&(a=s)})}),Array.from({length:a},(n,r)=>{const s=[];return o.forEach(c=>{const f=String((c==null?void 0:c[r])||"").trim();!f||s[s.length-1]===f||s.push(f)}),s.join(" / ")})}function z(t=document){if(!g())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;At(e)}function st(t=document){if(!g())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;clearTimeout(window.__RESPONSIVE_TABLE_REFRESH_TIMER__||0),window.__RESPONSIVE_TABLE_REFRESH_TIMER__=window.setTimeout(()=>{z(e)},60)}function Rt(t=document.querySelector(".section.active")||document.getElementById("app")||document.body){if(typeof MutationObserver!="function")return;const e=t instanceof HTMLElement?t:document.querySelector(".section.active")||document.getElementById("app")||document.body||document.documentElement;if(!e||window.__RESPONSIVE_TABLE_OBSERVER__&&et===e)return;window.__RESPONSIVE_TABLE_OBSERVER__&&typeof window.__RESPONSIVE_TABLE_OBSERVER__.disconnect=="function"&&window.__RESPONSIVE_TABLE_OBSERVER__.disconnect();const o=new MutationObserver(a=>{if(!g())return;a.some(r=>Array.from(r.addedNodes||[]).some(s=>{var c;return s instanceof HTMLElement?s.matches("table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table, .section, #parent-view-container")||!!((c=s.querySelector)!=null&&c.call(s,"table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table")):!1}))&&st(e)});o.observe(e,{childList:!0,subtree:!0}),window.__RESPONSIVE_TABLE_OBSERVER__=o,et=e}window.refreshResponsiveMobileTables=z;function It(t=document){g()&&(t.querySelectorAll('.section [style*="grid-template-columns"]').forEach(e=>{e.closest("#parent-view-container")||e.classList.add("mobile-stack-grid")}),t.querySelectorAll('.section [style*="display:flex"]').forEach(e=>{e.closest("#parent-view-container")||e.closest("#apk-mobile-shell")||e.children.length<2||e.classList.add("mobile-wrap-row")}))}function Ot(){if(document.getElementById("mobile-experience-styles"))return;const t=document.createElement("style");t.id="mobile-experience-styles",t.textContent=`
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
        `,document.head.appendChild(t)}function lt(){const t=document.querySelector(".section.active")||document;Ot(),z(t),st(t),Rt(t),It(t)}function qt(t){if(!(t instanceof HTMLElement))return!1;const e=window.getComputedStyle(t);return e.display==="none"||e.visibility==="hidden"||Number(e.opacity||1)===0||t.getAttribute("aria-hidden")==="true"||t.hidden?!1:t.getClientRects().length>0}function ct(){if(window.Swal&&typeof window.Swal.isVisible=="function"&&window.Swal.isVisible())return!0;const t=[".swal2-container",".modal",'[role="dialog"]','[aria-modal="true"]',".dialog-overlay",".dialog-backdrop"];return Array.from(document.querySelectorAll(t.join(","))).some(e=>{if(!(e instanceof HTMLElement)||e.closest("#apk-mobile-shell")||!qt(e))return!1;const o=window.getComputedStyle(e),a=Number(o.zIndex||0);return o.position==="fixed"||a>=1e3})}function Nt(t=document.getElementById("apk-mobile-shell")){t&&(t.dataset.modalOpen=ct()?"true":"false")}function Bt(){ft.forEach((t,e)=>{window.setTimeout(()=>{const o=document.getElementById("student-details");if(!(!o||!o.classList.contains("active"))){if(typeof window.requestStudentDetailsPrimaryFocus=="function"){window.requestStudentDetailsPrimaryFocus(e);return}typeof window.focusStudentDetailsPrimaryFlow=="function"&&window.focusStudentDetailsPrimaryFlow()}},t)})}function Pt(){["mobile-manager-app","mobile-query-shell"].forEach(t=>{const e=document.getElementById(t);e&&(e.setAttribute("aria-hidden","true"),e.style.display="none")})}function Ht(){const t=document.getElementById("app");if(t){if(!g()){t.classList.remove("hidden"),t.style.display="";return}if(!W()){t.classList.add("hidden"),t.style.display="none";return}j()||(t.classList.remove("hidden"),t.style.display="")}}function Vt(){const t=document.querySelector('meta[name="theme-color"]');t&&t.setAttribute("content",document.body.classList.contains("dark-mode")?"#08111d":"#eef3f8")}function Ut(){const t=!!(v!=null&&v.matches);document.body.dataset.nativeApp=D?"true":"false",document.body.dataset.systemTheme=t?"dark":"light",D&&g()&&(document.body.classList.toggle("dark-mode",t),localStorage.setItem("theme-dark",t?"true":"false")),document.documentElement.style.colorScheme=document.body.classList.contains("dark-mode")?"dark":"light",Vt()}function Dt(t){const e=document.getElementById("cohort-selector");!e||!t||(e.value=t,e.dispatchEvent(new Event("change",{bubbles:!0})),p(""),_.forEach(o=>{window.setTimeout(()=>{rt(),l()},o)}))}function b(){return{workbench:"学校工作台",mobileWorkbench:"移动工作台",mobilePreparing:"移动工作台正在准备中",openLibrary:"打开模块资源库",openSearch:"打开全局搜索",closeSheet:"关闭面板",closeLibrary:"关闭模块资源库",cohortPlaceholder:"届别未选择",home:"工作台",modules:"模块",recent:"最近",account:"我的",openModule:"打开该模块",currentCategoryEmpty:"当前分类暂无可用模块",current:"当前",open:"打开",workspaceNote:"Workspace",moduleOverviewTitle:"模块总览",moduleOverviewCopy:"按分类切换工作模块，减少手机端来回翻找入口的次数。",noModules:"当前账号还没有可切换的模块入口。",quickTitle:"最近与常用",quickCopy:"先给你最近用过的模块，再补高频入口，减少反复进出分类面板。",quickHeroTitle:"跨分类切换先看这里",quickHeroCopy:"默认优先展示最近使用，同时保留完整模块资源库入口。",recentModulesTitle:"最近使用",recentModulesNote:"Recent Modules",suggestedTitle:"高频推荐",suggestedNote:"Suggested",utilitiesTitle:"系统动作",utilitiesNote:"Utilities",noRecent:"还没有可回跳的最近模块，可以先从当前分类或全部模块进入。",appLibraryTitle:"模块资源库",appLibraryCopy:"像 App 资源库一样集中浏览全部模块，支持最近使用、当前分类和快速搜索。",appLibrarySearch:"搜索模块、功能或分类",appLibrarySearchTitle:"搜索结果",appLibrarySearchNote:"Results",appLibrarySearchEmpty:"没有匹配的模块，试试更短的关键词。",appLibraryCurrentTitle:"当前分类",appLibraryCurrentNote:"Now Browsing",appLibraryAllTitle:"全部分类",appLibraryAllNote:"App Library",allModulesTitle:"全部模块",allModulesCopy:"找不到所需功能时，直接打开完整模块总览。",searchTitle:"全局搜索",searchCopy:"快速搜索学生、模块和常用入口。",cohortsTitle:"切换届别",cohortsCopy:"在不同届别工作区之间快速跳转。",passwordTitle:"修改密码",passwordCopy:"直接打开当前账号的密码修改入口。",logoutTitle:"退出登录",logoutCopy:"返回登录页，重新选择账号进入。",accountTitle:"账号与设置",accountCopy:"APK 默认跟随系统主题，并把常用设置集中到这一层。",currentSchool:"当前学校",currentCohort:"当前届别",themeMode:"主题模式",themeDark:"深色",themeLight:"浅色",followSystem:"跟随系统",runtimeEnv:"运行环境",mobileBrowser:"移动浏览器",notLoggedIn:"未登录",unknownSchool:"未识别学校",switchCohortTitle:"切换届别",switchCohortCopy:"统一从这里切届别，避免手机端入口与工作区状态脱节。",noCohorts:"暂无可切换届别。",noCohortChoices:"当前没有可切换的届别，请先完成数据恢复。",usingCurrentCohort:"当前正在使用的届别。",switchToThisCohort:"点击切换到这个届别。"}}function Ft(){return document.body.dataset.systemTheme==="dark"?b().themeDark:b().themeLight}function jt(t,e=null){return[t==null?void 0:t.text,t==null?void 0:t.hint,t==null?void 0:t.id,e==null?void 0:e.title,e==null?void 0:e.eyebrow].filter(Boolean).join(" ").toLowerCase()}function Wt(){const t=String(m||"").trim().toLowerCase();return t?N($().flatMap(e=>e.items.filter(o=>jt(o,e).includes(t)).map(o=>({...o,categoryTitle:e.title,categoryKey:e.key,categoryColor:e.color})))):[]}function x(t,e){return`
            <div class="apk-sheet-header">
                <div>
                    <strong>${i(t)}</strong>
                    <span>${i(e)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-sheet" aria-label="${i(b().closeSheet)}">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        `}function k(t,e){return`
            <div class="apk-sheet-section-head">
                <span class="apk-sheet-section-title">${i(t)}</span>
                <span class="apk-sheet-section-note">${i(e)}</span>
            </div>
        `}function H(t,e){const o=b();return`
            <button type="button" class="apk-sheet-card${t.id===e?" is-active":""}" data-apk-module="${i(t.id)}">
                <strong>${i(t.text||t.id)}</strong>
                <span>${i(t.hint||t.categoryTitle||o.openModule)}</span>
            </button>
        `}function w(t,e,o,a,n=""){return`
            <button type="button" class="apk-sheet-card apk-sheet-card--action${n?` ${n}`:""}" data-apk-action="${i(t)}">
                <i class="${i(a)}"></i>
                <strong>${i(e)}</strong>
                <span>${i(o)}</span>
            </button>
        `}function dt(t,e){const o=b(),a=t.id===e;return`
            <button type="button" class="apk-switch-row${a?" is-active":""}" data-apk-module="${i(t.id)}">
                <span class="apk-switch-row-copy">
                    <strong>${i(t.text||t.id)}</strong>
                    <span>${i(t.hint||t.categoryTitle||"跨分类快速直达")}</span>
                </span>
                <span class="apk-switch-row-meta">${a?o.current:o.open}</span>
            </button>
        `}function ut(t,e){const o=String(t.text||t.id||"").trim().slice(0,2)||"模块";return`
            <button type="button" class="apk-library-mini${t.id===e?" is-active":""}" data-apk-module="${i(t.id)}">
                <span class="apk-library-mini-badge">${i(o)}</span>
                <span class="apk-library-mini-copy">
                    <strong>${i(t.text||t.id)}</strong>
                    <span>${i(t.hint||t.categoryTitle||"模块")}</span>
                </span>
            </button>
        `}function Qt(t,e){return`
            <article class="apk-library-card" style="--apk-library-accent:${i(t.color||"#2563eb")}">
                <div class="apk-library-card-head">
                    <div>
                        <strong>${i(t.title)}</strong>
                        <span>${i(`${t.items.length} 个模块`)}</span>
                    </div>
                    <span class="apk-library-card-count">${i(String(t.items.length).padStart(2,"0"))}</span>
                </div>
                <div class="apk-library-mini-grid">
                    ${t.items.slice(0,4).map(o=>ut({...o,categoryTitle:t.title},e)).join("")}
                </div>
            </article>
        `}function Yt(){var C;const t=b(),e=A(),o=String(m||"").trim(),a=Wt(),n=Q(),r=N([...Y(6),q()]).slice(0,6),s=new Set(r.map(h=>h.id)),c=nt(6+s.size).filter(h=>!s.has(h.id)).slice(0,6),f=$();return`
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
                <input type="search" data-apk-library-search value="${i(o)}" placeholder="${i(t.appLibrarySearch)}" autocomplete="off" />
            </label>
            ${o?`
                    <section class="apk-library-section">
                        ${k(t.appLibrarySearchTitle,t.appLibrarySearchNote)}
                        ${a.length?`<div class="apk-sheet-grid apk-library-results">${a.map(h=>H(h,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.appLibrarySearchEmpty)}</div>`}
                    </section>
                `:`
                    <section class="apk-library-section">
                        ${k(t.recentModulesTitle,t.recentModulesNote)}
                        ${r.length?`<div class="apk-switch-list">${r.map(h=>dt(h,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.noRecent)}</div>`}
                    </section>
                    ${c.length?`
                            <section class="apk-library-section">
                                ${k(t.suggestedTitle,t.suggestedNote)}
                                <div class="apk-sheet-grid apk-library-results">
                                    ${c.map(h=>H(h,e)).join("")}
                                </div>
                            </section>
                        `:""}
                    ${(C=n==null?void 0:n.items)!=null&&C.length?`
                            <section class="apk-library-section">
                                ${k(t.appLibraryCurrentTitle,t.appLibraryCurrentNote)}
                                <article class="apk-library-spotlight" style="--apk-library-accent:${i(n.color||"#2563eb")}">
                                    <div class="apk-library-card-head">
                                        <div>
                                            <strong>${i(n.title)}</strong>
                                            <span>${i(`${n.items.length} 个模块`)}</span>
                                        </div>
                                        <span class="apk-library-card-count">${i(String(n.items.length).padStart(2,"0"))}</span>
                                    </div>
                                    <div class="apk-library-mini-grid">
                                        ${n.items.slice(0,4).map(h=>ut({...h,categoryTitle:n.title},e)).join("")}
                                    </div>
                                </article>
                            </section>
                        `:""}
                    <section class="apk-library-section">
                        ${k(t.appLibraryAllTitle,t.appLibraryAllNote)}
                        <div class="apk-library-clusters">
                            ${f.map(h=>Qt(h,e)).join("")}
                        </div>
                    </section>
                `}
        `}function G(){let t=document.getElementById("apk-mobile-shell");if(t)return t;const e=b();return t=document.createElement("div"),t.id="apk-mobile-shell",t.setAttribute("aria-hidden","true"),t.innerHTML=`
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
        `,t.addEventListener("click",se),t.addEventListener("input",re),document.body.appendChild(t),t}function Kt(){const t=b(),e=$(),o=A();return e.length?[x(t.moduleOverviewTitle,t.moduleOverviewCopy),...e.map(a=>`
                <section class="apk-sheet-section">
                    ${k(a.title,a.eyebrow||t.workspaceNote)}
                    <div class="apk-sheet-grid">
                        ${a.items.map(n=>H({...n,categoryTitle:a.title},o)).join("")}
                    </div>
                </section>
            `)].join(""):`${x(t.moduleOverviewTitle,t.noModules)}
                <div class="apk-sheet-empty">${i(t.noModules)}</div>`}function zt(){const t=b(),e=A(),o=N([...Y(V),q()]).slice(0,4),a=new Set(o.map(s=>s.id)),n=nt(U+a.size).filter(s=>!a.has(s.id)).slice(0,U),r=[w("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand"),w("search",t.searchTitle,t.searchCopy,"ti ti-search"),w("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2"),typeof window.openUserPasswordModal=="function"?w("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):"",w("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")].filter(Boolean);return`
            ${x(t.quickTitle,t.quickCopy)}
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
                ${k(t.recentModulesTitle,t.recentModulesNote)}
                ${o.length?`<div class="apk-switch-list">${o.map(s=>dt(s,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.noRecent)}</div>`}
            </section>
            ${n.length?`
                    <section class="apk-sheet-section">
                        ${k(t.suggestedTitle,t.suggestedNote)}
                        <div class="apk-sheet-grid">
                            ${n.map(s=>H(s,e)).join("")}
                        </div>
                    </section>
                `:""}
            <section class="apk-sheet-section">
                ${k(t.utilitiesTitle,t.utilitiesNote)}
                <div class="apk-sheet-grid">
                    ${r.join("")}
                </div>
            </section>
        `}function Gt(){const t=b(),e=L();return`
            ${x(t.accountTitle,t.accountCopy)}
            <section class="apk-sheet-section">
                <div class="apk-account-card">
                    <div class="apk-account-name">${i((e==null?void 0:e.name)||t.notLoggedIn)}</div>
                    <div class="apk-account-role">${i(ot())}</div>
                    <div class="apk-account-grid">
                        <div class="apk-account-row">
                            <span>${i(t.currentSchool)}</span>
                            <strong>${i(at()||t.unknownSchool)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.currentCohort)}</span>
                            <strong>${i(K())}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.themeMode)}</span>
                            <strong>${i(`${t.followSystem} · ${Ft()}`)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.runtimeEnv)}</span>
                            <strong>${i(D?"Android APK":t.mobileBrowser)}</strong>
                        </div>
                    </div>
                </div>
            </section>
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${w("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2")}
                    ${w("search",t.searchTitle,t.searchCopy,"ti ti-search")}
                    ${w("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand")}
                    ${typeof window.openUserPasswordModal=="function"?w("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):""}
                    ${w("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")}
                </div>
            </section>
        `}function Xt(){var a;const t=b(),e=$t(),o=((a=document.getElementById("cohort-selector"))==null?void 0:a.value)||"";return e.length?`
            ${x(t.switchCohortTitle,t.switchCohortCopy)}
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${e.map(n=>`
                        <button type="button" class="apk-sheet-card${n.value===o?" is-active":""}" data-apk-cohort="${i(n.value)}">
                            <strong>${i(n.label)}</strong>
                            <span>${i(n.value===o?t.usingCurrentCohort:t.switchToThisCohort)}</span>
                        </button>
                    `).join("")}
                </div>
            </section>
        `:`${x(t.switchCohortTitle,t.noCohortChoices)}
                <div class="apk-sheet-empty">${i(t.noCohorts)}</div>`}function Jt(t){const e=t.querySelector("[data-apk-library-panel]");e&&S(e,u?Yt():"")}function Zt(){const e=G().querySelector("[data-apk-sheet-panel]");if(e){if(!d){S(e,"");return}if(d==="modules"){S(e,Kt());return}if(d==="quick"){S(e,zt());return}if(d==="account"){S(e,Gt());return}d==="cohorts"&&S(e,Xt())}}function te(t){var s;const e=b(),o=t.querySelector("[data-apk-rail]");if(!o)return;const a=Q(),n=A();if(!((s=a==null?void 0:a.items)!=null&&s.length)){S(o,`<div class="apk-rail-empty">${i(e.currentCategoryEmpty)}</div>`);return}const r=a.items.map(c=>`
            <button type="button" class="apk-rail-chip${c.id===n?" is-active":""}" data-apk-module="${i(c.id)}">
                ${i(c.text||c.id)}
            </button>
        `).join("");S(o,r)&&window.requestAnimationFrame(()=>scrollActiveRailChipIntoView(t))}function ee(t){const e=A(),o=M();t.querySelectorAll(".apk-shell-tab").forEach(a=>{const n=a.getAttribute("data-apk-tab");vt(a,"is-active",!u&&(n==="home"&&!d&&e===o||n==="modules"&&d==="modules"||n==="quick"&&d==="quick"||n==="account"&&d==="account"))})}function B(){const t=b(),e=G(),o=q(),a=Q(),n=[at()||t.unknownSchool,(a==null?void 0:a.title)||t.workbench,K()].filter(Boolean).join(" · ");kt(e,"--apk-accent",(o==null?void 0:o.categoryColor)||(a==null?void 0:a.color)||"#2563eb"),e.setAttribute("aria-hidden","false"),F(e,"sheetOpen",d?"true":"false"),F(e,"sheetMode",d||""),F(e,"libraryOpen",u?"true":"false");const r={role:`${ot()}工作台`,title:(o==null?void 0:o.text)||"智慧教务",subtitle:n,cohort:K(),mode:t.workbench};Object.entries(r).forEach(([s,c])=>{const f=e.querySelector(`[data-apk-field="${s}"]`);gt(f,c)}),Nt(e),te(e),Zt(),Jt(e),ee(e)}function oe(t,e={}){u=!!t,u&&(d=""),!u&&e.resetQuery!==!1&&(m=""),B()}function R(t){oe(typeof t=="boolean"?t:!u)}function p(t=""){d=t,t&&(u=!1,m=""),B()}function T(t){p(d===t?"":t)}function X(t){!t||typeof window.switchTab!="function"||(d="",u=!1,m="",B(),rt(),window.switchTab(t),Lt(t),t==="student-details"&&Bt(),_.forEach(e=>{window.setTimeout(()=>{var o;(o=document.getElementById(t))!=null&&o.classList.contains("active")&&(lt(),t==="student-details"&&typeof window.requestStudentDetailsPrimaryFocus=="function"&&window.requestStudentDetailsPrimaryFocus()),l()},e)}))}function ae(){u=!1,m="",p(""),typeof window.openSpotlight=="function"&&window.openSpotlight()}function ie(){u=!1,m="",p(""),typeof window.openUserPasswordModal=="function"&&window.openUserPasswordModal()}function ne(t){if(t==="home"){X(M());return}if(t==="modules"){T("modules");return}if(t==="quick"){T("quick");return}t==="account"&&T("account")}function re(t){const e=t.target.closest("[data-apk-library-search]");if(!e)return;const o=typeof e.selectionStart=="number"?e.selectionStart:String(e.value||"").length;if(m=String(e.value||""),B(),!u)return;const a=document.querySelector("[data-apk-library-search]");a&&(typeof a.focus=="function"&&a.focus({preventScroll:!0}),typeof a.setSelectionRange=="function"&&a.setSelectionRange(o,o))}function se(t){const e=t.target.closest("[data-apk-action], [data-apk-module], [data-apk-cohort], [data-apk-tab]");if(!e)return;t.preventDefault();const o=e.getAttribute("data-apk-module");if(o){X(o);return}const a=e.getAttribute("data-apk-cohort");if(a){Dt(a);return}const n=e.getAttribute("data-apk-tab");if(n){ne(n);return}const r=e.getAttribute("data-apk-action");if(r==="close-sheet"){p("");return}if(r==="library"){R();return}if(r==="close-library"){R(!1);return}if(r==="modules"){T("modules");return}if(r==="quick"){T("quick");return}if(r==="account"){T("account");return}if(r==="cohorts"){T("cohorts");return}if(r==="search"){ae();return}if(r==="password"){ie();return}r==="logout"&&window.Auth&&typeof window.Auth.logout=="function"&&(u=!1,m="",p(""),window.Auth.logout())}function le(t){var o;if(!g()||!W()||j()||ct())return;const e=(o=t.touches)==null?void 0:o[0];e&&(y={startX:e.clientX,startY:e.clientY,canOpenLibrary:!u&&!d&&e.clientX<=28,canCloseLibrary:u})}function ce(t){var n;if(!y)return;const e=(n=t.touches)==null?void 0:n[0];if(!e)return;const o=e.clientX-y.startX,a=e.clientY-y.startY;if(Math.abs(a)>42){y=null;return}if(y.canOpenLibrary&&o>=80){R(!0),y=null;return}y.canCloseLibrary&&o<=-80&&(R(!1),y=null)}function pt(){y=null}function I(t,e,o){if(!t||typeof t[e]!="function"||t[e][o])return;const a=t[e],n=function(){const r=a.apply(this,arguments);return l(),_.forEach(s=>{window.setTimeout(l,s)}),r};n[o]=!0,t[e]=n}function de(){if(window.Swal&&(I(window.Swal,"close","__apkMobileWrapped__"),typeof window.Swal.fire=="function"&&!window.Swal.fire.__apkMobileWrapped__)){const t=window.Swal.fire,e=function(){const o=t.apply(window.Swal,arguments);return l(),_.forEach(a=>{window.setTimeout(l,a)}),o&&typeof o.finally=="function"&&o.finally(()=>{_.forEach(a=>{window.setTimeout(l,a)})}),o};e.__apkMobileWrapped__=!0,window.Swal.fire=e}}function ue(){I(window,"switchTab","__apkMobileWrapped__"),I(window,"renderNavigation","__apkMobileWrapped__"),I(window,"switchNavCategory","__apkMobileWrapped__"),window.Auth&&(I(window.Auth,"applyRoleView","__apkMobileWrapped__"),I(window.Auth,"renderParentView","__apkMobileWrapped__")),de()}function pe(){ue(),Ut();const t=g(),e=t&&W()&&!j();document.body.dataset.mobileQuery=t?"true":"false",e?document.body.dataset.mobileArchitecture="apk-v2":delete document.body.dataset.mobileArchitecture,Ht(),Pt();const o=G();if(o.style.display=e?"block":"none",o.setAttribute("aria-hidden",e?"false":"true"),!e){d="",u=!1,m="",o.dataset.sheetOpen="false",o.dataset.sheetMode="",o.dataset.libraryOpen="false",o.dataset.modalOpen="false";return}lt(),B()}function l(){clearTimeout(tt),tt=window.setTimeout(pe,60)}const ht={switchTab(t){const e={home:M(),students:"student-details",analysis:"summary"};if(t==="me"){p("account");return}const o=e[t]||t;X(o)},renderStudentList(){l()},showStudentDetail(){l()},renderAnalysis(){l()},openModules(){p("modules")},openLibrary(){R(!0)},openQuickActions(){p("quick")},openAccountSheet(){p("account")},openCohortSheet(){p("cohorts")},refresh:l};window.MobMgr=ht,window.MobileQueryUI={refresh:l,openLibrary:()=>R(!0),openModules:()=>p("modules"),openQuick:()=>p("quick"),openAccount:()=>p("account"),openCohorts:()=>p("cohorts")},window.switchMobileTab=t=>ht.switchTab(t),window.matchMedia&&(v=window.matchMedia("(prefers-color-scheme: dark)"),typeof v.addEventListener=="function"?v.addEventListener("change",l):typeof v.addListener=="function"&&v.addListener(l)),window.addEventListener("cloud-load-state",l),window.addEventListener("resize",l),window.addEventListener("orientationchange",l),window.addEventListener("load",l),window.addEventListener("pageshow",l),window.addEventListener("focus",l),document.addEventListener("touchstart",le,{passive:!0}),document.addEventListener("touchmove",ce,{passive:!0}),document.addEventListener("touchend",pt,{passive:!0}),document.addEventListener("touchcancel",pt,{passive:!0}),document.addEventListener("resume",l,!1),document.addEventListener("visibilitychange",()=>{document.hidden||l()}),_.forEach(t=>{window.setTimeout(l,t)}),l(),window.__MOBILE_MANAGER_PATCHED__=!0,window.__MOBILE_APP_RUNTIME_PATCHED__=!0})();
