(()=>{if(typeof window=="undefined"||window.__MOBILE_APP_RUNTIME_PATCHED__)return;const Ct=960,M=[80,260,900],Tt=[140,420,980,1600],Mt={admin:"starter-hub",director:"starter-hub",grade_director:"teacher-analysis",class_teacher:"student-details",teacher:"teacher-analysis"},_t=["student-details","summary","teacher-analysis","report-generator","progress-analysis","analysis"],Lt={admin:["upload","summary","data-manager","report-generator","teacher-analysis","cohort-growth"],director:["summary","county-analysis","teacher-analysis","report-generator","progress-analysis","cohort-growth"],grade_director:["teacher-analysis","summary","progress-analysis","student-overview","cohort-growth","report-generator"],class_teacher:["student-details","student-overview","progress-analysis","marginal-push","report-generator","summary"],teacher:["teacher-analysis","student-details","student-overview","summary","report-generator","progress-analysis"]},ot="apk-recent-modules-v1",D=8,j=6,$t={admin:"管理员",director:"校级管理",grade_director:"级部主任",class_teacher:"班主任",teacher:"教师",parent:"家长",student:"学生",guest:"访客"},it=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform=="function"&&window.Capacitor.isNativePlatform()||typeof window.Capacitor.getPlatform=="function"&&window.Capacitor.getPlatform()!=="web"));let nt=0,d="",u=!1,w="",y=null,v=null,at=null,F="",V=null,_=new Map;function n(t){const e=window.SchoolRuntime&&typeof window.SchoolRuntime.escapeHtml=="function"?window.SchoolRuntime.escapeHtml:null;return e?e(t):String(t!=null?t:"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}function At(t,e){if(!t)return!1;const o=String(e!=null?e:"");return t.textContent===o?!1:(t.textContent=o,!0)}function S(t,e){if(!t)return!1;const o=String(e!=null?e:"");return t.__apkLastHtml===o?!1:(t.innerHTML=o,t.__apkLastHtml=o,!0)}function W(t,e,o){if(!(t!=null&&t.dataset))return!1;const i=String(o!=null?o:"");return t.dataset[e]===i?!1:(t.dataset[e]=i,!0)}function xt(t,e,o){if(!(t!=null&&t.style))return!1;const i=String(o!=null?o:"");return t.style.getPropertyValue(e)===i?!1:(t.style.setProperty(e,i),!0)}function Rt(t,e,o){if(!(t!=null&&t.classList))return!1;const i=!!o;return t.classList.contains(e)===i?!1:(t.classList.toggle(e,i),!0)}function rt(){var e,o,i;const t=[Number(window.innerWidth||0),Number(((e=document.documentElement)==null?void 0:e.clientWidth)||0),Number(window.outerWidth||0),Number(((o=window.screen)==null?void 0:o.width)||0),Number(((i=window.screen)==null?void 0:i.availWidth)||0)].filter(a=>Number.isFinite(a)&&a>0);return t.length?Math.min(...t):0}function b(){return rt()<=Ct}function st(){return window.matchMedia?window.matchMedia("(max-width: 900px)").matches:rt()<=900}function K(t=document){document.documentElement.classList.toggle("is-compact-viewport",st()),(t&&typeof t.querySelectorAll=="function"?t:document).querySelectorAll(".analysis-table-shell, .table-wrap").forEach(o=>{o.dataset.mobileHint||(o.dataset.mobileHint="可横向滑动查看完整表格")})}function lt(){K(document)}function It(t){var i;const e=(i=t==null?void 0:t.querySelector)==null?void 0:i.call(t,"[data-apk-rail]");if(!e)return;const o=e.querySelector(".apk-rail-chip.is-active");!o||typeof o.scrollIntoView!="function"||o.scrollIntoView({inline:"center",block:"nearest",behavior:"auto"})}function L(){return window.AuthState&&typeof window.AuthState.getCurrentUser=="function"?window.AuthState.getCurrentUser():window.Auth&&window.Auth.currentUser?window.Auth.currentUser:null}function q(){var t,e,o;return window.AuthState&&typeof window.AuthState.getCurrentRole=="function"?window.AuthState.getCurrentRole():String(((t=L())==null?void 0:t.role)||((o=(e=document.body)==null?void 0:e.dataset)==null?void 0:o.role)||"guest").trim()||"guest"}function ct(){if(window.AuthState&&typeof window.AuthState.getCurrentRoles=="function")return window.AuthState.getCurrentRoles();const t=L();return(Array.isArray(t==null?void 0:t.roles)&&t.roles.length?t.roles:[t==null?void 0:t.role].filter(Boolean)).map(o=>String(o||"").trim()).filter(Boolean)}function Me(t){const e=new Set(ct());return t.some(o=>e.has(o))}function Q(t=q()){const e=String(t||"").trim();return e==="parent"||e==="student"}function dt(t=q()){return $t[String(t||"").trim()]||String(t||"访客")}function ut(){var t,e;return window.SchoolState&&typeof window.SchoolState.getCurrentSchool=="function"?String(((t=L())==null?void 0:t.school)||window.SchoolState.getCurrentSchool()||"").trim():String(((e=L())==null?void 0:e.school)||window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||"").trim()}function Y(){const t=document.getElementById("login-overlay"),e=!!(t&&getComputedStyle(t).display!=="none");return!!L()&&!e}function Ot(){if(window.NAV_STRUCTURE)return window.NAV_STRUCTURE;try{return NAV_STRUCTURE}catch(t){return null}}function qt(){F="",V=null,_=new Map}function Nt(t,e){const o=ct().join("|"),i=t?Object.keys(t).join("|"):"",a=window.CONFIG&&window.CONFIG.showQuery?"report:1":"report:0";return[e,o,i,a].join("::")}function Bt(t){return!(typeof window.canAccessModule=="function"&&!window.canAccessModule(t)||t==="indicator"&&typeof window.isIndicatorModuleVisible=="function"&&!window.isIndicatorModuleVisible()||t==="report-generator"&&typeof window.CONFIG!="undefined"&&window.CONFIG&&!window.CONFIG.showQuery)}function $(){const t=Ot();if(!t)return[];const e=q(),o=Nt(t,e);if(V&&F===o)return V;const i=Object.keys(t).map(a=>{const r=t[a];return{...r,key:a,items:Array.isArray(r==null?void 0:r.items)?r.items.filter(s=>Bt(s.id)):[]}}).filter(a=>a.items.length>0);return F=o,V=i,_=new Map,i}function E(t){if(!t)return null;if(_.has(t))return _.get(t);const e=$();for(const o of e){const i=o.items.find(a=>a.id===t);if(i){const a={...i,categoryKey:o.key,categoryTitle:o.title,categoryColor:o.color};return _.set(t,a),a}}return _.set(t,null),null}function A(){var o,i,a;const t=Mt[q()]||"starter-hub",e=E(t);return e?e.id:((a=(i=(o=$()[0])==null?void 0:o.items)==null?void 0:i[0])==null?void 0:a.id)||"starter-hub"}function x(){var t;return((t=document.querySelector(".section.active"))==null?void 0:t.id)||A()}function N(){return E(x())||E(A())||null}function z(){const t=$(),e=N();if(e){const i=t.find(a=>a.key===e.categoryKey);if(i)return i}const o=typeof window.getCurrentNavCategory=="function"?String(window.getCurrentNavCategory()||"").trim():"";return t.find(i=>i.key===o)||t[0]||null}function B(t){const e=new Set;return t.filter(o=>!o||!o.id||e.has(o.id)?!1:(e.add(o.id),!0))}function pt(){try{const t=JSON.parse(localStorage.getItem(ot)||"[]");return Array.isArray(t)?t.map(e=>String(e||"").trim()).filter(Boolean):[]}catch(t){return[]}}function Pt(t){try{localStorage.setItem(ot,JSON.stringify(t.map(e=>String(e||"").trim()).filter(Boolean).slice(0,D)))}catch(e){}}function Ht(t){const e=E(t);e&&Pt([e.id,...pt().filter(o=>o!==e.id)])}function G(t=D){return B(pt().map(e=>E(e)).filter(Boolean)).slice(0,t)}function ht(t=j){const e=Lt[q()]||[],o=[...G(t),N(),E(A()),...e.map(i=>E(i)),..._t.map(i=>E(i))];return B(o).slice(0,t)}function _e(){var o;const t=document.getElementById("mode-badge"),e=String((t==null?void 0:t.textContent)||"").trim();return e||String(((o=window.CONFIG)==null?void 0:o.name)||"学校工作台").trim()}function X(){var e;const t=document.getElementById("cohort-selector");return(e=t==null?void 0:t.selectedOptions)!=null&&e[0]&&String(t.selectedOptions[0].textContent||t.value||"届别未选择").trim()||"届别未选择"}function Vt(){const t=document.getElementById("cohort-selector");return t?Array.from(t.options||[]).filter(e=>String(e.value||"").trim()).map(e=>({value:String(e.value||"").trim(),label:String(e.textContent||e.value||"").trim()})):[]}function Ut(){return document.querySelector("main.app-main")}function ft(){const t=Ut();if(t&&typeof t.scrollTo=="function"){t.scrollTo({top:0,behavior:"auto"});return}const e=document.scrollingElement||document.documentElement||document.body;if(e&&typeof e.scrollTo=="function"){e.scrollTo({top:0,behavior:"auto"});return}typeof window.scrollTo=="function"&&window.scrollTo({top:0,behavior:"auto"})}function Dt(t=document){if(!b())return;t.querySelectorAll(".table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable").forEach(o=>{const i=jt(o);i.length&&(o.classList.add("mobile-card-table"),Array.from(o.querySelectorAll("tbody tr")).forEach(a=>{let r=String(a.getAttribute("data-mobile-card-title")||"").trim();Array.from(a.children).forEach((s,c)=>{if(!(s instanceof HTMLElement)||s.hasAttribute("colspan"))return;const m=String(i[c]||`字段${c+1}`).replace(/\s+/g," ").trim(),T=String(s.textContent||"").replace(/\s+/g," ").trim();!r&&T&&c<=1&&(r=T),s.setAttribute("data-label",m)}),r&&a.setAttribute("data-mobile-card-title",r)}))})}function jt(t){const e=Array.from(t.querySelectorAll("thead tr"));if(!e.length)return[];const o=[];let i=0;return e.forEach((a,r)=>{o[r]||(o[r]=[]);let s=0;Array.from(a.children).forEach(c=>{for(;o[r][s];)s+=1;const m=Math.max(parseInt(c.getAttribute("colspan")||"1",10)||1,1),T=Math.max(parseInt(c.getAttribute("rowspan")||"1",10)||1,1),h=String(c.textContent||"").replace(/\s+/g," ").trim();for(let H=0;H<T;H+=1){o[r+H]||(o[r+H]=[]);for(let et=0;et<m;et+=1)o[r+H][s+et]=h}s+=m,s>i&&(i=s)})}),Array.from({length:i},(a,r)=>{const s=[];return o.forEach(c=>{const m=String((c==null?void 0:c[r])||"").trim();!m||s[s.length-1]===m||s.push(m)}),s.join(" / ")})}function J(t=document){if(!b())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;Dt(e)}function bt(t=document){if(!b())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;clearTimeout(window.__RESPONSIVE_TABLE_REFRESH_TIMER__||0),window.__RESPONSIVE_TABLE_REFRESH_TIMER__=window.setTimeout(()=>{J(e)},60)}function Ft(t=document.querySelector(".section.active")||document.getElementById("app")||document.body){if(typeof MutationObserver!="function")return;const e=t instanceof HTMLElement?t:document.querySelector(".section.active")||document.getElementById("app")||document.body||document.documentElement;if(!e||window.__RESPONSIVE_TABLE_OBSERVER__&&at===e)return;window.__RESPONSIVE_TABLE_OBSERVER__&&typeof window.__RESPONSIVE_TABLE_OBSERVER__.disconnect=="function"&&window.__RESPONSIVE_TABLE_OBSERVER__.disconnect();const o=new MutationObserver(i=>{if(!b())return;i.some(r=>Array.from(r.addedNodes||[]).some(s=>{var c;return s instanceof HTMLElement?s.matches("table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table, .section, #parent-view-container")||!!((c=s.querySelector)!=null&&c.call(s,"table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table")):!1}))&&bt(e)});o.observe(e,{childList:!0,subtree:!0}),window.__RESPONSIVE_TABLE_OBSERVER__=o,at=e}window.refreshResponsiveMobileTables=J;function Wt(t=document){b()&&(t.querySelectorAll('.section [style*="grid-template-columns"]').forEach(e=>{e.closest("#parent-view-container")||e.classList.add("mobile-stack-grid")}),t.querySelectorAll('.section [style*="display:flex"]').forEach(e=>{e.closest("#parent-view-container")||e.closest("#apk-mobile-shell")||e.children.length<2||e.classList.add("mobile-wrap-row")}))}function Kt(){if(document.getElementById("mobile-experience-styles"))return;const t=document.createElement("style");t.id="mobile-experience-styles",t.textContent=`
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
                body[data-mobile-architecture="apk-v2"] #app main.app-main {
                    width: 100%;
                    max-width: 100vw;
                    padding: calc(var(--app-safe-top, 0px) + 148px) 10px calc(var(--app-safe-bottom, 0px) + 110px) !important;
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    -webkit-overflow-scrolling: touch;
                    scroll-padding-top: calc(var(--app-safe-top, 0px) + 148px);
                    scroll-padding-bottom: calc(var(--app-safe-bottom, 0px) + 120px);
                }
                body[data-mobile-architecture="apk-v2"] #app .app-main > .section.active {
                    width: 100% !important;
                    max-width: none !important;
                    min-width: 0 !important;
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                    align-self: stretch !important;
                    box-sizing: border-box !important;
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
        `,document.head.appendChild(t)}function mt(){const t=document.querySelector(".section.active")||document;Kt(),K(t),J(t),bt(t),Ft(t),Wt(t)}function Qt(t){if(!(t instanceof HTMLElement))return!1;const e=window.getComputedStyle(t);return e.display==="none"||e.visibility==="hidden"||Number(e.opacity||1)===0||t.getAttribute("aria-hidden")==="true"||t.hidden?!1:t.getClientRects().length>0}function wt(){if(yt(),window.Swal&&typeof window.Swal.isVisible=="function"&&window.Swal.isVisible())return!0;const t=[".swal2-container",".modal",'[role="dialog"]','[aria-modal="true"]',".dialog-overlay",".dialog-backdrop"];return Array.from(document.querySelectorAll(t.join(","))).some(e=>{if(!(e instanceof HTMLElement)||e.closest("#apk-mobile-shell")||!Qt(e))return!1;const o=window.getComputedStyle(e),i=Number(o.zIndex||0);return o.position==="fixed"||i>=1e3})}function yt(){const t=document.querySelector(".swal2-container.swal2-backdrop-show");if(!b()||!t||t.querySelector("input,textarea,select,.swal2-cancel,.swal2-deny")||t.querySelector(".swal2-icon-error,.swal2-icon-warning,.swal2-icon-question"))return!1;const e=String(t.innerText||"");return/(安全|警告|失败|错误|确认|请确认|未完成|必须|需要完成|删除|覆盖|退出|清空)/.test(e)?!1:(window.Swal&&typeof window.Swal.close=="function"?window.Swal.close():t.remove(),!0)}function Yt(t=document.getElementById("apk-mobile-shell")){t&&(t.dataset.modalOpen=wt()?"true":"false")}function zt(){Tt.forEach((t,e)=>{window.setTimeout(()=>{const o=document.getElementById("student-details");if(!(!o||!o.classList.contains("active"))){if(typeof window.requestStudentDetailsPrimaryFocus=="function"){window.requestStudentDetailsPrimaryFocus(e);return}typeof window.focusStudentDetailsPrimaryFlow=="function"&&window.focusStudentDetailsPrimaryFlow()}},t)})}function Gt(){["mobile-manager-app","mobile-query-shell"].forEach(t=>{const e=document.getElementById(t);e&&(e.setAttribute("aria-hidden","true"),e.style.display="none")})}function Xt(){const t=document.getElementById("app");if(t){if(!b()){t.classList.remove("hidden"),t.style.display="";return}if(!Y()){t.classList.add("hidden"),t.style.display="none";return}Q()||(t.classList.remove("hidden"),t.style.display="")}}function Jt(){const t=document.querySelector('meta[name="theme-color"]');t&&t.setAttribute("content",document.body.classList.contains("dark-mode")?"#08111d":"#eef3f8")}function Zt(){const t=!!(v!=null&&v.matches);document.body.dataset.nativeApp=it?"true":"false",document.body.dataset.systemTheme=t?"dark":"light",it&&b()&&(document.body.classList.toggle("dark-mode",t),localStorage.setItem("theme-dark",t?"true":"false")),document.documentElement.style.colorScheme=document.body.classList.contains("dark-mode")?"dark":"light",Jt()}function te(t){const e=document.getElementById("cohort-selector");!e||!t||(e.value=t,e.dispatchEvent(new Event("change",{bubbles:!0})),p(""),M.forEach(o=>{window.setTimeout(()=>{ft(),l()},o)}))}function f(){return{workbench:"学校工作台",mobileWorkbench:"移动工作台",mobilePreparing:"移动工作台正在准备中",openLibrary:"打开模块资源库",openSearch:"打开全局搜索",closeSheet:"关闭面板",closeLibrary:"关闭模块资源库",cohortPlaceholder:"届别未选择",home:"工作台",modules:"模块",recent:"最近",account:"我的",openModule:"打开该模块",currentCategoryEmpty:"当前分类暂无可用模块",current:"当前",open:"打开",workspaceNote:"Workspace",moduleOverviewTitle:"模块总览",moduleOverviewCopy:"按分类切换工作模块，减少手机端来回翻找入口的次数。",noModules:"当前账号还没有可切换的模块入口。",quickTitle:"最近与常用",quickCopy:"先给你最近用过的模块，再补高频入口，减少反复进出分类面板。",quickHeroTitle:"跨分类切换先看这里",quickHeroCopy:"默认优先展示最近使用，同时保留完整模块资源库入口。",recentModulesTitle:"最近使用",recentModulesNote:"Recent Modules",suggestedTitle:"高频推荐",suggestedNote:"Suggested",utilitiesTitle:"系统动作",utilitiesNote:"Utilities",noRecent:"还没有可回跳的最近模块，可以先从当前分类或全部模块进入。",appLibraryTitle:"模块资源库",appLibraryCopy:"像 App 资源库一样集中浏览全部模块，支持最近使用、当前分类和快速搜索。",appLibrarySearch:"搜索模块、功能或分类",appLibrarySearchTitle:"搜索结果",appLibrarySearchNote:"Results",appLibrarySearchEmpty:"没有匹配的模块，试试更短的关键词。",appLibraryCurrentTitle:"当前分类",appLibraryCurrentNote:"Now Browsing",appLibraryAllTitle:"全部分类",appLibraryAllNote:"App Library",allModulesTitle:"全部模块",allModulesCopy:"找不到所需功能时，直接打开完整模块总览。",searchTitle:"全局搜索",searchCopy:"快速搜索学生、模块和常用入口。",cohortsTitle:"切换届别",cohortsCopy:"在不同届别工作区之间快速跳转。",passwordTitle:"修改密码",passwordCopy:"直接打开当前账号的密码修改入口。",logoutTitle:"退出登录",logoutCopy:"返回登录页，重新选择账号进入。",accountTitle:"账号与设置",accountCopy:"APK 默认跟随系统主题，并把常用设置集中到这一层。",currentSchool:"当前学校",currentCohort:"当前届别",themeMode:"主题模式",themeDark:"深色",themeLight:"浅色",followSystem:"跟随系统",runtimeEnv:"运行环境",mobileBrowser:"移动浏览器",notLoggedIn:"未登录",unknownSchool:"未识别学校",switchCohortTitle:"切换届别",switchCohortCopy:"统一从这里切届别，避免手机端入口与工作区状态脱节。",noCohorts:"暂无可切换届别。",noCohortChoices:"当前没有可切换的届别，请先完成数据恢复。",usingCurrentCohort:"当前正在使用的届别。",switchToThisCohort:"点击切换到这个届别。"}}function ee(){return document.body.dataset.systemTheme==="dark"?f().themeDark:f().themeLight}function oe(t,e=null){return[t==null?void 0:t.text,t==null?void 0:t.hint,t==null?void 0:t.id,e==null?void 0:e.title,e==null?void 0:e.eyebrow].filter(Boolean).join(" ").toLowerCase()}function ie(){const t=String(w||"").trim().toLowerCase();return t?B($().flatMap(e=>e.items.filter(o=>oe(o,e).includes(t)).map(o=>({...o,categoryTitle:e.title,categoryKey:e.key,categoryColor:e.color})))):[]}function R(t,e){return`
            <div class="apk-sheet-header">
                <div>
                    <strong>${n(t)}</strong>
                    <span>${n(e)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-sheet" aria-label="${n(f().closeSheet)}">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        `}function k(t,e){return`
            <div class="apk-sheet-section-head">
                <span class="apk-sheet-section-title">${n(t)}</span>
                <span class="apk-sheet-section-note">${n(e)}</span>
            </div>
        `}function U(t,e){const o=f();return`
            <button type="button" class="apk-sheet-card${t.id===e?" is-active":""}" data-apk-module="${n(t.id)}">
                <strong>${n(t.text||t.id)}</strong>
                <span>${n(t.hint||t.categoryTitle||o.openModule)}</span>
            </button>
        `}function g(t,e,o,i,a=""){return`
            <button type="button" class="apk-sheet-card apk-sheet-card--action${a?` ${a}`:""}" data-apk-action="${n(t)}">
                <i class="${n(i)}"></i>
                <strong>${n(e)}</strong>
                <span>${n(o)}</span>
            </button>
        `}function gt(t,e){const o=f(),i=t.id===e;return`
            <button type="button" class="apk-switch-row${i?" is-active":""}" data-apk-module="${n(t.id)}">
                <span class="apk-switch-row-copy">
                    <strong>${n(t.text||t.id)}</strong>
                    <span>${n(t.hint||t.categoryTitle||"跨分类快速直达")}</span>
                </span>
                <span class="apk-switch-row-meta">${i?o.current:o.open}</span>
            </button>
        `}function kt(t,e){const o=String(t.text||t.id||"").trim().slice(0,2)||"模块";return`
            <button type="button" class="apk-library-mini${t.id===e?" is-active":""}" data-apk-module="${n(t.id)}">
                <span class="apk-library-mini-badge">${n(o)}</span>
                <span class="apk-library-mini-copy">
                    <strong>${n(t.text||t.id)}</strong>
                    <span>${n(t.hint||t.categoryTitle||"模块")}</span>
                </span>
            </button>
        `}function ne(t,e){return`
            <article class="apk-library-card" style="--apk-library-accent:${n(t.color||"#2563eb")}">
                <div class="apk-library-card-head">
                    <div>
                        <strong>${n(t.title)}</strong>
                        <span>${n(`${t.items.length} 个模块`)}</span>
                    </div>
                    <span class="apk-library-card-count">${n(String(t.items.length).padStart(2,"0"))}</span>
                </div>
                <div class="apk-library-mini-grid">
                    ${t.items.slice(0,4).map(o=>kt({...o,categoryTitle:t.title},e)).join("")}
                </div>
            </article>
        `}function ae(){var T;const t=f(),e=x(),o=String(w||"").trim(),i=ie(),a=z(),r=B([...G(6),N()]).slice(0,6),s=new Set(r.map(h=>h.id)),c=ht(6+s.size).filter(h=>!s.has(h.id)).slice(0,6),m=$();return`
            <div class="apk-library-head">
                <div class="apk-library-head-copy">
                    <strong>${n(t.appLibraryTitle)}</strong>
                    <span>${n(t.appLibraryCopy)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-library" aria-label="${n(t.closeLibrary)}">
                    <i class="ti ti-arrow-left"></i>
                </button>
            </div>
            <label class="apk-library-search">
                <i class="ti ti-search"></i>
                <input type="search" data-apk-library-search value="${n(o)}" placeholder="${n(t.appLibrarySearch)}" autocomplete="off" />
            </label>
            ${o?`
                    <section class="apk-library-section">
                        ${k(t.appLibrarySearchTitle,t.appLibrarySearchNote)}
                        ${i.length?`<div class="apk-sheet-grid apk-library-results">${i.map(h=>U(h,e)).join("")}</div>`:`<div class="apk-sheet-empty">${n(t.appLibrarySearchEmpty)}</div>`}
                    </section>
                `:`
                    <section class="apk-library-section">
                        ${k(t.recentModulesTitle,t.recentModulesNote)}
                        ${r.length?`<div class="apk-switch-list">${r.map(h=>gt(h,e)).join("")}</div>`:`<div class="apk-sheet-empty">${n(t.noRecent)}</div>`}
                    </section>
                    ${c.length?`
                            <section class="apk-library-section">
                                ${k(t.suggestedTitle,t.suggestedNote)}
                                <div class="apk-sheet-grid apk-library-results">
                                    ${c.map(h=>U(h,e)).join("")}
                                </div>
                            </section>
                        `:""}
                    ${(T=a==null?void 0:a.items)!=null&&T.length?`
                            <section class="apk-library-section">
                                ${k(t.appLibraryCurrentTitle,t.appLibraryCurrentNote)}
                                <article class="apk-library-spotlight" style="--apk-library-accent:${n(a.color||"#2563eb")}">
                                    <div class="apk-library-card-head">
                                        <div>
                                            <strong>${n(a.title)}</strong>
                                            <span>${n(`${a.items.length} 个模块`)}</span>
                                        </div>
                                        <span class="apk-library-card-count">${n(String(a.items.length).padStart(2,"0"))}</span>
                                    </div>
                                    <div class="apk-library-mini-grid">
                                        ${a.items.slice(0,4).map(h=>kt({...h,categoryTitle:a.title},e)).join("")}
                                    </div>
                                </article>
                            </section>
                        `:""}
                    <section class="apk-library-section">
                        ${k(t.appLibraryAllTitle,t.appLibraryAllNote)}
                        <div class="apk-library-clusters">
                            ${m.map(h=>ne(h,e)).join("")}
                        </div>
                    </section>
                `}
        `}function Z(){let t=document.getElementById("apk-mobile-shell");if(t)return t;const e=f();return t=document.createElement("div"),t.id="apk-mobile-shell",t.setAttribute("aria-hidden","true"),t.innerHTML=`
            <div class="apk-shell-top">
                <div class="apk-shell-topbar apk-shell-surface">
                    <button type="button" class="apk-shell-icon" data-apk-action="library" aria-label="${n(e.openLibrary)}">
                        <i class="ti ti-layout-sidebar-left-expand"></i>
                    </button>
                    <div class="apk-shell-copy">
                        <span class="apk-shell-kicker" data-apk-field="role">${n(e.workbench)}</span>
                        <strong class="apk-shell-title" data-apk-field="title">澄见</strong>
                        <span class="apk-shell-subtitle" data-apk-field="subtitle">${n(e.mobilePreparing)}</span>
                    </div>
                    <button type="button" class="apk-shell-icon" data-apk-action="search" aria-label="${n(e.openSearch)}">
                        <i class="ti ti-search"></i>
                    </button>
                </div>
                <div class="apk-shell-meta">
                    <button type="button" class="apk-shell-pill apk-shell-surface" data-apk-action="cohorts">
                        <i class="ti ti-id-badge-2"></i>
                        <span data-apk-field="cohort">${n(e.cohortPlaceholder)}</span>
                    </button>
                    <div class="apk-shell-pill apk-shell-surface is-static">
                        <i class="ti ti-device-imac"></i>
                        <span data-apk-field="mode">${n(e.workbench)}</span>
                    </div>
                </div>
                <div class="apk-shell-rail" data-apk-rail></div>
            </div>
            <button type="button" class="apk-shell-library-backdrop" data-apk-action="close-library" aria-label="${n(e.closeLibrary)}"></button>
            <div class="apk-shell-library">
                <div class="apk-shell-library-panel apk-shell-surface" data-apk-library-panel></div>
            </div>
            <button type="button" class="apk-shell-backdrop" data-apk-action="close-sheet" aria-label="${n(e.closeSheet)}"></button>
            <div class="apk-shell-sheet">
                <div class="apk-shell-sheet-panel apk-shell-surface" data-apk-sheet-panel></div>
            </div>
            <div class="apk-shell-tabs apk-shell-surface">
                <button type="button" class="apk-shell-tab" data-apk-tab="home">
                    <i class="ti ti-home"></i>
                    <span>${n(e.home)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="modules">
                    <i class="ti ti-layout-grid"></i>
                    <span>${n(e.modules)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="quick">
                    <i class="ti ti-history"></i>
                    <span>${n(e.recent)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="account">
                    <i class="ti ti-user-circle"></i>
                    <span>${n(e.account)}</span>
                </button>
            </div>
        `,t.addEventListener("click",ge),t.addEventListener("input",ye),document.body.appendChild(t),t}function re(){const t=f(),e=$(),o=x();return e.length?[R(t.moduleOverviewTitle,t.moduleOverviewCopy),...e.map(i=>`
                <section class="apk-sheet-section">
                    ${k(i.title,i.eyebrow||t.workspaceNote)}
                    <div class="apk-sheet-grid">
                        ${i.items.map(a=>U({...a,categoryTitle:i.title},o)).join("")}
                    </div>
                </section>
            `)].join(""):`${R(t.moduleOverviewTitle,t.noModules)}
                <div class="apk-sheet-empty">${n(t.noModules)}</div>`}function se(){const t=f(),e=x(),o=B([...G(D),N()]).slice(0,4),i=new Set(o.map(s=>s.id)),a=ht(j+i.size).filter(s=>!i.has(s.id)).slice(0,j),r=[g("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand"),g("search",t.searchTitle,t.searchCopy,"ti ti-search"),g("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2"),typeof window.openUserPasswordModal=="function"?g("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):"",g("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")].filter(Boolean);return`
            ${R(t.quickTitle,t.quickCopy)}
            <section class="apk-quick-hero">
                <div class="apk-quick-hero-copy">
                    <strong>${n(t.quickHeroTitle)}</strong>
                    <span>${n(t.quickHeroCopy)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="library" aria-label="${n(t.openLibrary)}">
                    <i class="ti ti-layout-sidebar-left-expand"></i>
                </button>
            </section>
            <section class="apk-sheet-section">
                ${k(t.recentModulesTitle,t.recentModulesNote)}
                ${o.length?`<div class="apk-switch-list">${o.map(s=>gt(s,e)).join("")}</div>`:`<div class="apk-sheet-empty">${n(t.noRecent)}</div>`}
            </section>
            ${a.length?`
                    <section class="apk-sheet-section">
                        ${k(t.suggestedTitle,t.suggestedNote)}
                        <div class="apk-sheet-grid">
                            ${a.map(s=>U(s,e)).join("")}
                        </div>
                    </section>
                `:""}
            <section class="apk-sheet-section">
                ${k(t.utilitiesTitle,t.utilitiesNote)}
                <div class="apk-sheet-grid">
                    ${r.join("")}
                </div>
            </section>
        `}function le(){const t=f(),e=L();return`
            ${R(t.accountTitle,t.accountCopy)}
            <section class="apk-sheet-section">
                <div class="apk-account-card">
                    <div class="apk-account-name">${n((e==null?void 0:e.name)||t.notLoggedIn)}</div>
                    <div class="apk-account-role">${n(dt())}</div>
                    <div class="apk-account-grid">
                        <div class="apk-account-row">
                            <span>${n(t.currentSchool)}</span>
                            <strong>${n(ut()||t.unknownSchool)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${n(t.currentCohort)}</span>
                            <strong>${n(X())}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${n(t.themeMode)}</span>
                            <strong>${n(`${t.followSystem} · ${ee()}`)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${n(t.runtimeEnv)}</span>
                            <strong>${n(t.mobileBrowser)}</strong>
                        </div>
                    </div>
                </div>
            </section>
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${g("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2")}
                    ${g("search",t.searchTitle,t.searchCopy,"ti ti-search")}
                    ${g("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand")}
                    ${typeof window.openUserPasswordModal=="function"?g("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):""}
                    ${g("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")}
                </div>
            </section>
        `}function ce(){var i;const t=f(),e=Vt(),o=((i=document.getElementById("cohort-selector"))==null?void 0:i.value)||"";return e.length?`
            ${R(t.switchCohortTitle,t.switchCohortCopy)}
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${e.map(a=>`
                        <button type="button" class="apk-sheet-card${a.value===o?" is-active":""}" data-apk-cohort="${n(a.value)}">
                            <strong>${n(a.label)}</strong>
                            <span>${n(a.value===o?t.usingCurrentCohort:t.switchToThisCohort)}</span>
                        </button>
                    `).join("")}
                </div>
            </section>
        `:`${R(t.switchCohortTitle,t.noCohortChoices)}
                <div class="apk-sheet-empty">${n(t.noCohorts)}</div>`}function de(t){const e=t.querySelector("[data-apk-library-panel]");e&&S(e,u?ae():"")}function ue(){const e=Z().querySelector("[data-apk-sheet-panel]");if(e){if(!d){S(e,"");return}if(d==="modules"){S(e,re());return}if(d==="quick"){S(e,se());return}if(d==="account"){S(e,le());return}d==="cohorts"&&S(e,ce())}}function pe(t){var s;const e=f(),o=t.querySelector("[data-apk-rail]");if(!o)return;const i=z(),a=x();if(!((s=i==null?void 0:i.items)!=null&&s.length)){S(o,`<div class="apk-rail-empty">${n(e.currentCategoryEmpty)}</div>`);return}const r=i.items.map(c=>`
            <button type="button" class="apk-rail-chip${c.id===a?" is-active":""}" data-apk-module="${n(c.id)}">
                ${n(c.text||c.id)}
            </button>
        `).join("");S(o,r)&&window.requestAnimationFrame(()=>It(t))}function he(t){const e=x(),o=A();t.querySelectorAll(".apk-shell-tab").forEach(i=>{const a=i.getAttribute("data-apk-tab");Rt(i,"is-active",!u&&(a==="home"&&!d&&e===o||a==="modules"&&d==="modules"||a==="quick"&&d==="quick"||a==="account"&&d==="account"))})}function P(){const t=f(),e=Z(),o=N(),i=z(),a=[ut()||t.unknownSchool,(i==null?void 0:i.title)||t.workbench,X()].filter(Boolean).join(" · ");xt(e,"--apk-accent",(o==null?void 0:o.categoryColor)||(i==null?void 0:i.color)||"#2563eb"),e.setAttribute("aria-hidden","false"),W(e,"sheetOpen",d?"true":"false"),W(e,"sheetMode",d||""),W(e,"libraryOpen",u?"true":"false");const r={role:`${dt()}工作台`,title:(o==null?void 0:o.text)||"澄见",subtitle:a,cohort:X(),mode:t.workbench};Object.entries(r).forEach(([s,c])=>{const m=e.querySelector(`[data-apk-field="${s}"]`);At(m,c)}),Yt(e),pe(e),ue(),de(e),he(e)}function fe(t,e={}){u=!!t,u&&(d=""),!u&&e.resetQuery!==!1&&(w=""),P()}function I(t){fe(typeof t=="boolean"?t:!u)}function p(t=""){d=t,t&&(u=!1,w=""),P()}function C(t){p(d===t?"":t)}function tt(t){!t||typeof window.switchTab!="function"||(d="",u=!1,w="",P(),ft(),window.switchTab(t),Ht(t),t==="student-details"&&zt(),M.forEach(e=>{window.setTimeout(()=>{var o;(o=document.getElementById(t))!=null&&o.classList.contains("active")&&(mt(),t==="student-details"&&typeof window.requestStudentDetailsPrimaryFocus=="function"&&window.requestStudentDetailsPrimaryFocus()),l()},e)}))}function be(){u=!1,w="",p(""),typeof window.openSpotlight=="function"&&window.openSpotlight()}function me(){u=!1,w="",p(""),typeof window.openUserPasswordModal=="function"&&window.openUserPasswordModal()}function we(t){if(t==="home"){tt(A());return}if(t==="modules"){C("modules");return}if(t==="quick"){C("quick");return}t==="account"&&C("account")}function ye(t){const e=t.target.closest("[data-apk-library-search]");if(!e)return;const o=typeof e.selectionStart=="number"?e.selectionStart:String(e.value||"").length;if(w=String(e.value||""),P(),!u)return;const i=document.querySelector("[data-apk-library-search]");i&&(typeof i.focus=="function"&&i.focus({preventScroll:!0}),typeof i.setSelectionRange=="function"&&i.setSelectionRange(o,o))}function ge(t){const e=t.target.closest("[data-apk-action], [data-apk-module], [data-apk-cohort], [data-apk-tab]");if(!e)return;t.preventDefault();const o=e.getAttribute("data-apk-module");if(o){tt(o);return}const i=e.getAttribute("data-apk-cohort");if(i){te(i);return}const a=e.getAttribute("data-apk-tab");if(a){we(a);return}const r=e.getAttribute("data-apk-action");if(r==="close-sheet"){p("");return}if(r==="library"){I();return}if(r==="close-library"){I(!1);return}if(r==="modules"){C("modules");return}if(r==="quick"){C("quick");return}if(r==="account"){C("account");return}if(r==="cohorts"){C("cohorts");return}if(r==="search"){be();return}if(r==="password"){me();return}r==="logout"&&window.Auth&&typeof window.Auth.logout=="function"&&(u=!1,w="",p(""),window.Auth.logout())}function ke(t){var o;if(!b()||!Y()||Q()||wt())return;const e=(o=t.touches)==null?void 0:o[0];e&&(y={startX:e.clientX,startY:e.clientY,canOpenLibrary:!u&&!d&&e.clientX<=28,canCloseLibrary:u})}function ve(t){var a;if(!y)return;const e=(a=t.touches)==null?void 0:a[0];if(!e)return;const o=e.clientX-y.startX,i=e.clientY-y.startY;if(Math.abs(i)>42){y=null;return}if(y.canOpenLibrary&&o>=80){I(!0),y=null;return}y.canCloseLibrary&&o<=-80&&(I(!1),y=null)}function vt(){y=null}function O(t,e,o){if(!t||typeof t[e]!="function"||t[e][o])return;const i=t[e],a=function(){const r=i.apply(this,arguments);return l(),M.forEach(s=>{window.setTimeout(l,s)}),r};a[o]=!0,t[e]=a}function Se(){if(window.Swal&&(O(window.Swal,"close","__apkMobileWrapped__"),typeof window.Swal.fire=="function"&&!window.Swal.fire.__apkMobileWrapped__)){const t=window.Swal.fire,e=function(){const o=t.apply(window.Swal,arguments);return l(),window.setTimeout(yt,1200),M.forEach(i=>{window.setTimeout(l,i)}),o&&typeof o.finally=="function"&&o.finally(()=>{M.forEach(i=>{window.setTimeout(l,i)})}),o};e.__apkMobileWrapped__=!0,window.Swal.fire=e}}function Ee(){O(window,"switchTab","__apkMobileWrapped__"),O(window,"renderNavigation","__apkMobileWrapped__"),O(window,"switchNavCategory","__apkMobileWrapped__"),window.Auth&&(O(window.Auth,"applyRoleView","__apkMobileWrapped__"),O(window.Auth,"renderParentView","__apkMobileWrapped__")),Se()}function Ce(){qt(),Ee(),Zt();const t=b(),e=t&&Y()&&!Q();document.body.dataset.mobileQuery=t?"true":"false",e?document.body.dataset.mobileArchitecture="apk-v2":delete document.body.dataset.mobileArchitecture,Xt(),Gt();const o=Z();if(o.style.display=e?"block":"none",o.setAttribute("aria-hidden",e?"false":"true"),!e){d="",u=!1,w="",o.dataset.sheetOpen="false",o.dataset.sheetMode="",o.dataset.libraryOpen="false",o.dataset.modalOpen="false";return}mt(),P()}function l(){clearTimeout(nt),nt=window.setTimeout(Ce,60)}const St={switchTab(t){const e={home:A(),students:"student-details",analysis:"summary"};if(t==="me"){p("account");return}const o=e[t]||t;tt(o)},renderStudentList(){l()},showStudentDetail(){l()},renderAnalysis(){l()},openModules(){p("modules")},openLibrary(){I(!0)},openQuickActions(){p("quick")},openAccountSheet(){p("account")},openCohortSheet(){p("cohorts")},refresh:l};window.MobMgr=St,window.MobileQueryUI={refresh:l,openLibrary:()=>I(!0),openModules:()=>p("modules"),openQuick:()=>p("quick"),openAccount:()=>p("account"),openCohorts:()=>p("cohorts")},window.MobileExperienceRuntime=window.MobileExperienceRuntime||{install:lt,syncCompactState:K,isCompactViewport:st},window.MobDashboardMgr=window.MobDashboardMgr||{showToast(t){window.UI&&typeof window.UI.toast=="function"?window.UI.toast(t,"info"):typeof window.showToast=="function"?window.showToast(t):window.alert(t)}},window.switchMobileTab=t=>St.switchTab(t),window.matchMedia&&(v=window.matchMedia("(prefers-color-scheme: dark)"),typeof v.addEventListener=="function"?v.addEventListener("change",l):typeof v.addListener=="function"&&v.addListener(l)),window.addEventListener("cloud-load-state",l),window.addEventListener("resize",l),window.addEventListener("orientationchange",l),window.addEventListener("load",l);function Te(){const t=document.getElementById("mobile-skeleton");t&&b()&&(t.classList.add("hidden"),setTimeout(()=>{t.remove()},350))}function Et(){b()&&setTimeout(Te,200)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Et):Et(),window.addEventListener("pageshow",l),window.addEventListener("focus",l),document.addEventListener("touchstart",ke,{passive:!0}),document.addEventListener("touchmove",ve,{passive:!0}),document.addEventListener("touchend",vt,{passive:!0}),document.addEventListener("touchcancel",vt,{passive:!0}),document.addEventListener("resume",l,!1),document.addEventListener("visibilitychange",()=>{document.hidden||l()}),lt(),M.forEach(t=>{window.setTimeout(l,t)}),l(),window.__MOBILE_MANAGER_PATCHED__=!0,window.__MOBILE_APP_RUNTIME_PATCHED__=!0})();
