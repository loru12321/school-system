(()=>{if(typeof window=="undefined"||window.__MOBILE_APP_RUNTIME_PATCHED__)return;const wt=960,_=[80,260,900],gt=[140,420,980,1600],kt={admin:"starter-hub",director:"starter-hub",grade_director:"starter-hub",class_teacher:"student-details",teacher:"teacher-analysis"},vt=["student-details","summary","teacher-analysis","report-generator","progress-analysis","analysis","teaching-warning-center"],ot="apk-recent-modules-v1",D=8,j=6,St={admin:"管理员",director:"校级管理",grade_director:"级部主任",class_teacher:"班主任",teacher:"教师",parent:"家长",student:"学生",guest:"访客"},F=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform=="function"&&window.Capacitor.isNativePlatform()||typeof window.Capacitor.getPlatform=="function"&&window.Capacitor.getPlatform()!=="web"));let at=0,d="",u=!1,m="",y=null,v=null,it=null,W="",V=null,L=new Map;function i(t){return String(t!=null?t:"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function Et(t,e){if(!t)return!1;const o=String(e!=null?e:"");return t.textContent===o?!1:(t.textContent=o,!0)}function S(t,e){if(!t)return!1;const o=String(e!=null?e:"");return t.__apkLastHtml===o?!1:(t.innerHTML=o,t.__apkLastHtml=o,!0)}function K(t,e,o){if(!(t!=null&&t.dataset))return!1;const a=String(o!=null?o:"");return t.dataset[e]===a?!1:(t.dataset[e]=a,!0)}function Ct(t,e,o){if(!(t!=null&&t.style))return!1;const a=String(o!=null?o:"");return t.style.getPropertyValue(e)===a?!1:(t.style.setProperty(e,a),!0)}function Tt(t,e,o){if(!(t!=null&&t.classList))return!1;const a=!!o;return t.classList.contains(e)===a?!1:(t.classList.toggle(e,a),!0)}function _t(){var e,o,a;const t=[Number(window.innerWidth||0),Number(((e=document.documentElement)==null?void 0:e.clientWidth)||0),Number(window.outerWidth||0),Number(((o=window.screen)==null?void 0:o.width)||0),Number(((a=window.screen)==null?void 0:a.availWidth)||0)].filter(n=>Number.isFinite(n)&&n>0);return t.length?Math.min(...t):0}function g(){return _t()<=wt}function $(){return window.AuthState&&typeof window.AuthState.getCurrentUser=="function"?window.AuthState.getCurrentUser():window.Auth&&window.Auth.currentUser?window.Auth.currentUser:null}function q(){var t,e,o;return window.AuthState&&typeof window.AuthState.getCurrentRole=="function"?window.AuthState.getCurrentRole():String(((t=$())==null?void 0:t.role)||((o=(e=document.body)==null?void 0:e.dataset)==null?void 0:o.role)||"guest").trim()||"guest"}function nt(){if(window.AuthState&&typeof window.AuthState.getCurrentRoles=="function")return window.AuthState.getCurrentRoles();const t=$();return(Array.isArray(t==null?void 0:t.roles)&&t.roles.length?t.roles:[t==null?void 0:t.role].filter(Boolean)).map(o=>String(o||"").trim()).filter(Boolean)}function we(t){const e=new Set(nt());return t.some(o=>e.has(o))}function Q(t=q()){const e=String(t||"").trim();return e==="parent"||e==="student"}function rt(t=q()){return St[String(t||"").trim()]||String(t||"访客")}function st(){var t,e;return window.SchoolState&&typeof window.SchoolState.getCurrentSchool=="function"?String(((t=$())==null?void 0:t.school)||window.SchoolState.getCurrentSchool()||"").trim():String(((e=$())==null?void 0:e.school)||window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||"").trim()}function Y(){const t=document.getElementById("login-overlay"),e=!!(t&&getComputedStyle(t).display!=="none");return!!$()&&!e}function Lt(){if(window.NAV_STRUCTURE)return window.NAV_STRUCTURE;try{return NAV_STRUCTURE}catch(t){return null}}function $t(){W="",V=null,L=new Map}function Mt(t,e){const o=nt().join("|"),a=t?Object.keys(t).join("|"):"",n=window.CONFIG&&window.CONFIG.showQuery?"report:1":"report:0";return[e,o,a,n].join("::")}function At(t){const e=q();return!((e==="teacher"||e==="class_teacher")&&typeof window.canAccessModule=="function"&&!window.canAccessModule(t)||e==="teacher"&&["single-school-eval","exam-arranger","freshman-simulator"].includes(t)||t==="report-generator"&&typeof window.CONFIG!="undefined"&&window.CONFIG&&!window.CONFIG.showQuery)}function M(){const t=Lt();if(!t)return[];const e=q(),o=Mt(t,e);if(V&&W===o)return V;const a=e==="teacher"||e==="class_teacher",n=Object.keys(t).filter(r=>!(a&&(r==="data"||r==="tools")||a&&e==="teacher"&&r==="town")).map(r=>{const s=t[r];return{...s,key:r,items:Array.isArray(s==null?void 0:s.items)?s.items.filter(l=>At(l.id)):[]}}).filter(r=>r.items.length>0);return W=o,V=n,L=new Map,n}function E(t){if(!t)return null;if(L.has(t))return L.get(t);const e=M();for(const o of e){const a=o.items.find(n=>n.id===t);if(a){const n={...a,categoryKey:o.key,categoryTitle:o.title,categoryColor:o.color};return L.set(t,n),n}}return L.set(t,null),null}function A(){var o,a,n;const t=kt[q()]||"starter-hub",e=E(t);return e?e.id:((n=(a=(o=M()[0])==null?void 0:o.items)==null?void 0:a[0])==null?void 0:n.id)||"starter-hub"}function x(){var t;return((t=document.querySelector(".section.active"))==null?void 0:t.id)||A()}function N(){return E(x())||E(A())||null}function z(){const t=M(),e=N();if(e){const a=t.find(n=>n.key===e.categoryKey);if(a)return a}const o=typeof window.getCurrentNavCategory=="function"?String(window.getCurrentNavCategory()||"").trim():"";return t.find(a=>a.key===o)||t[0]||null}function B(t){const e=new Set;return t.filter(o=>!o||!o.id||e.has(o.id)?!1:(e.add(o.id),!0))}function lt(){try{const t=JSON.parse(localStorage.getItem(ot)||"[]");return Array.isArray(t)?t.map(e=>String(e||"").trim()).filter(Boolean):[]}catch(t){return[]}}function xt(t){try{localStorage.setItem(ot,JSON.stringify(t.map(e=>String(e||"").trim()).filter(Boolean).slice(0,D)))}catch(e){}}function Rt(t){const e=E(t);e&&xt([e.id,...lt().filter(o=>o!==e.id)])}function G(t=D){return B(lt().map(e=>E(e)).filter(Boolean)).slice(0,t)}function ct(t=j){const e=[...G(t),N(),E(A()),...vt.map(o=>E(o))];return B(e).slice(0,t)}function ge(){var o;const t=document.getElementById("mode-badge"),e=String((t==null?void 0:t.textContent)||"").trim();return e||String(((o=window.CONFIG)==null?void 0:o.name)||"学校工作台").trim()}function X(){var e;const t=document.getElementById("cohort-selector");return(e=t==null?void 0:t.selectedOptions)!=null&&e[0]&&String(t.selectedOptions[0].textContent||t.value||"届别未选择").trim()||"届别未选择"}function It(){const t=document.getElementById("cohort-selector");return t?Array.from(t.options||[]).filter(e=>String(e.value||"").trim()).map(e=>({value:String(e.value||"").trim(),label:String(e.textContent||e.value||"").trim()})):[]}function Ot(){return document.querySelector("main.app-main")}function dt(){const t=Ot();if(t&&typeof t.scrollTo=="function"){t.scrollTo({top:0,behavior:"auto"});return}const e=document.scrollingElement||document.documentElement||document.body;if(e&&typeof e.scrollTo=="function"){e.scrollTo({top:0,behavior:"auto"});return}typeof window.scrollTo=="function"&&window.scrollTo({top:0,behavior:"auto"})}function qt(t=document){if(!g())return;t.querySelectorAll(".table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable").forEach(o=>{const a=Nt(o);a.length&&(o.classList.add("mobile-card-table"),Array.from(o.querySelectorAll("tbody tr")).forEach(n=>{let r=String(n.getAttribute("data-mobile-card-title")||"").trim();Array.from(n.children).forEach((s,l)=>{if(!(s instanceof HTMLElement)||s.hasAttribute("colspan"))return;const f=String(a[l]||`字段${l+1}`).replace(/\s+/g," ").trim(),T=String(s.textContent||"").replace(/\s+/g," ").trim();!r&&T&&l<=1&&(r=T),s.setAttribute("data-label",f)}),r&&n.setAttribute("data-mobile-card-title",r)}))})}function Nt(t){const e=Array.from(t.querySelectorAll("thead tr"));if(!e.length)return[];const o=[];let a=0;return e.forEach((n,r)=>{o[r]||(o[r]=[]);let s=0;Array.from(n.children).forEach(l=>{for(;o[r][s];)s+=1;const f=Math.max(parseInt(l.getAttribute("colspan")||"1",10)||1,1),T=Math.max(parseInt(l.getAttribute("rowspan")||"1",10)||1,1),h=String(l.textContent||"").replace(/\s+/g," ").trim();for(let H=0;H<T;H+=1){o[r+H]||(o[r+H]=[]);for(let et=0;et<f;et+=1)o[r+H][s+et]=h}s+=f,s>a&&(a=s)})}),Array.from({length:a},(n,r)=>{const s=[];return o.forEach(l=>{const f=String((l==null?void 0:l[r])||"").trim();!f||s[s.length-1]===f||s.push(f)}),s.join(" / ")})}function J(t=document){if(!g())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;qt(e)}function ut(t=document){if(!g())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;clearTimeout(window.__RESPONSIVE_TABLE_REFRESH_TIMER__||0),window.__RESPONSIVE_TABLE_REFRESH_TIMER__=window.setTimeout(()=>{J(e)},60)}function Bt(t=document.querySelector(".section.active")||document.getElementById("app")||document.body){if(typeof MutationObserver!="function")return;const e=t instanceof HTMLElement?t:document.querySelector(".section.active")||document.getElementById("app")||document.body||document.documentElement;if(!e||window.__RESPONSIVE_TABLE_OBSERVER__&&it===e)return;window.__RESPONSIVE_TABLE_OBSERVER__&&typeof window.__RESPONSIVE_TABLE_OBSERVER__.disconnect=="function"&&window.__RESPONSIVE_TABLE_OBSERVER__.disconnect();const o=new MutationObserver(a=>{if(!g())return;a.some(r=>Array.from(r.addedNodes||[]).some(s=>{var l;return s instanceof HTMLElement?s.matches("table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table, .section, #parent-view-container")||!!((l=s.querySelector)!=null&&l.call(s,"table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table")):!1}))&&ut(e)});o.observe(e,{childList:!0,subtree:!0}),window.__RESPONSIVE_TABLE_OBSERVER__=o,it=e}window.refreshResponsiveMobileTables=J;function Pt(t=document){g()&&(t.querySelectorAll('.section [style*="grid-template-columns"]').forEach(e=>{e.closest("#parent-view-container")||e.classList.add("mobile-stack-grid")}),t.querySelectorAll('.section [style*="display:flex"]').forEach(e=>{e.closest("#parent-view-container")||e.closest("#apk-mobile-shell")||e.children.length<2||e.classList.add("mobile-wrap-row")}))}function Ht(){if(document.getElementById("mobile-experience-styles"))return;const t=document.createElement("style");t.id="mobile-experience-styles",t.textContent=`
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
        `,document.head.appendChild(t)}function pt(){const t=document.querySelector(".section.active")||document;Ht(),J(t),ut(t),Bt(t),Pt(t)}function Vt(t){if(!(t instanceof HTMLElement))return!1;const e=window.getComputedStyle(t);return e.display==="none"||e.visibility==="hidden"||Number(e.opacity||1)===0||t.getAttribute("aria-hidden")==="true"||t.hidden?!1:t.getClientRects().length>0}function ht(){if(window.Swal&&typeof window.Swal.isVisible=="function"&&window.Swal.isVisible())return!0;const t=[".swal2-container",".modal",'[role="dialog"]','[aria-modal="true"]',".dialog-overlay",".dialog-backdrop"];return Array.from(document.querySelectorAll(t.join(","))).some(e=>{if(!(e instanceof HTMLElement)||e.closest("#apk-mobile-shell")||!Vt(e))return!1;const o=window.getComputedStyle(e),a=Number(o.zIndex||0);return o.position==="fixed"||a>=1e3})}function Ut(t=document.getElementById("apk-mobile-shell")){t&&(t.dataset.modalOpen=ht()?"true":"false")}function Dt(){gt.forEach((t,e)=>{window.setTimeout(()=>{const o=document.getElementById("student-details");if(!(!o||!o.classList.contains("active"))){if(typeof window.requestStudentDetailsPrimaryFocus=="function"){window.requestStudentDetailsPrimaryFocus(e);return}typeof window.focusStudentDetailsPrimaryFlow=="function"&&window.focusStudentDetailsPrimaryFlow()}},t)})}function jt(){["mobile-manager-app","mobile-query-shell"].forEach(t=>{const e=document.getElementById(t);e&&(e.setAttribute("aria-hidden","true"),e.style.display="none")})}function Ft(){const t=document.getElementById("app");if(t){if(!g()){t.classList.remove("hidden"),t.style.display="";return}if(!Y()){t.classList.add("hidden"),t.style.display="none";return}Q()||(t.classList.remove("hidden"),t.style.display="")}}function Wt(){const t=document.querySelector('meta[name="theme-color"]');t&&t.setAttribute("content",document.body.classList.contains("dark-mode")?"#08111d":"#eef3f8")}function Kt(){const t=!!(v!=null&&v.matches);document.body.dataset.nativeApp=F?"true":"false",document.body.dataset.systemTheme=t?"dark":"light",F&&g()&&(document.body.classList.toggle("dark-mode",t),localStorage.setItem("theme-dark",t?"true":"false")),document.documentElement.style.colorScheme=document.body.classList.contains("dark-mode")?"dark":"light",Wt()}function Qt(t){const e=document.getElementById("cohort-selector");!e||!t||(e.value=t,e.dispatchEvent(new Event("change",{bubbles:!0})),p(""),_.forEach(o=>{window.setTimeout(()=>{dt(),c()},o)}))}function b(){return{workbench:"学校工作台",mobileWorkbench:"移动工作台",mobilePreparing:"移动工作台正在准备中",openLibrary:"打开模块资源库",openSearch:"打开全局搜索",closeSheet:"关闭面板",closeLibrary:"关闭模块资源库",cohortPlaceholder:"届别未选择",home:"工作台",modules:"模块",recent:"最近",account:"我的",openModule:"打开该模块",currentCategoryEmpty:"当前分类暂无可用模块",current:"当前",open:"打开",workspaceNote:"Workspace",moduleOverviewTitle:"模块总览",moduleOverviewCopy:"按分类切换工作模块，减少手机端来回翻找入口的次数。",noModules:"当前账号还没有可切换的模块入口。",quickTitle:"最近与常用",quickCopy:"先给你最近用过的模块，再补高频入口，减少反复进出分类面板。",quickHeroTitle:"跨分类切换先看这里",quickHeroCopy:"默认优先展示最近使用，同时保留完整模块资源库入口。",recentModulesTitle:"最近使用",recentModulesNote:"Recent Modules",suggestedTitle:"高频推荐",suggestedNote:"Suggested",utilitiesTitle:"系统动作",utilitiesNote:"Utilities",noRecent:"还没有可回跳的最近模块，可以先从当前分类或全部模块进入。",appLibraryTitle:"模块资源库",appLibraryCopy:"像 App 资源库一样集中浏览全部模块，支持最近使用、当前分类和快速搜索。",appLibrarySearch:"搜索模块、功能或分类",appLibrarySearchTitle:"搜索结果",appLibrarySearchNote:"Results",appLibrarySearchEmpty:"没有匹配的模块，试试更短的关键词。",appLibraryCurrentTitle:"当前分类",appLibraryCurrentNote:"Now Browsing",appLibraryAllTitle:"全部分类",appLibraryAllNote:"App Library",allModulesTitle:"全部模块",allModulesCopy:"找不到所需功能时，直接打开完整模块总览。",searchTitle:"全局搜索",searchCopy:"快速搜索学生、模块和常用入口。",cohortsTitle:"切换届别",cohortsCopy:"在不同届别工作区之间快速跳转。",passwordTitle:"修改密码",passwordCopy:"直接打开当前账号的密码修改入口。",logoutTitle:"退出登录",logoutCopy:"返回登录页，重新选择账号进入。",accountTitle:"账号与设置",accountCopy:"APK 默认跟随系统主题，并把常用设置集中到这一层。",currentSchool:"当前学校",currentCohort:"当前届别",themeMode:"主题模式",themeDark:"深色",themeLight:"浅色",followSystem:"跟随系统",runtimeEnv:"运行环境",mobileBrowser:"移动浏览器",notLoggedIn:"未登录",unknownSchool:"未识别学校",switchCohortTitle:"切换届别",switchCohortCopy:"统一从这里切届别，避免手机端入口与工作区状态脱节。",noCohorts:"暂无可切换届别。",noCohortChoices:"当前没有可切换的届别，请先完成数据恢复。",usingCurrentCohort:"当前正在使用的届别。",switchToThisCohort:"点击切换到这个届别。"}}function Yt(){return document.body.dataset.systemTheme==="dark"?b().themeDark:b().themeLight}function zt(t,e=null){return[t==null?void 0:t.text,t==null?void 0:t.hint,t==null?void 0:t.id,e==null?void 0:e.title,e==null?void 0:e.eyebrow].filter(Boolean).join(" ").toLowerCase()}function Gt(){const t=String(m||"").trim().toLowerCase();return t?B(M().flatMap(e=>e.items.filter(o=>zt(o,e).includes(t)).map(o=>({...o,categoryTitle:e.title,categoryKey:e.key,categoryColor:e.color})))):[]}function R(t,e){return`
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
        `}function U(t,e){const o=b();return`
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
        `}function bt(t,e){const o=b(),a=t.id===e;return`
            <button type="button" class="apk-switch-row${a?" is-active":""}" data-apk-module="${i(t.id)}">
                <span class="apk-switch-row-copy">
                    <strong>${i(t.text||t.id)}</strong>
                    <span>${i(t.hint||t.categoryTitle||"跨分类快速直达")}</span>
                </span>
                <span class="apk-switch-row-meta">${a?o.current:o.open}</span>
            </button>
        `}function ft(t,e){const o=String(t.text||t.id||"").trim().slice(0,2)||"模块";return`
            <button type="button" class="apk-library-mini${t.id===e?" is-active":""}" data-apk-module="${i(t.id)}">
                <span class="apk-library-mini-badge">${i(o)}</span>
                <span class="apk-library-mini-copy">
                    <strong>${i(t.text||t.id)}</strong>
                    <span>${i(t.hint||t.categoryTitle||"模块")}</span>
                </span>
            </button>
        `}function Xt(t,e){return`
            <article class="apk-library-card" style="--apk-library-accent:${i(t.color||"#2563eb")}">
                <div class="apk-library-card-head">
                    <div>
                        <strong>${i(t.title)}</strong>
                        <span>${i(`${t.items.length} 个模块`)}</span>
                    </div>
                    <span class="apk-library-card-count">${i(String(t.items.length).padStart(2,"0"))}</span>
                </div>
                <div class="apk-library-mini-grid">
                    ${t.items.slice(0,4).map(o=>ft({...o,categoryTitle:t.title},e)).join("")}
                </div>
            </article>
        `}function Jt(){var T;const t=b(),e=x(),o=String(m||"").trim(),a=Gt(),n=z(),r=B([...G(6),N()]).slice(0,6),s=new Set(r.map(h=>h.id)),l=ct(6+s.size).filter(h=>!s.has(h.id)).slice(0,6),f=M();return`
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
                        ${a.length?`<div class="apk-sheet-grid apk-library-results">${a.map(h=>U(h,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.appLibrarySearchEmpty)}</div>`}
                    </section>
                `:`
                    <section class="apk-library-section">
                        ${k(t.recentModulesTitle,t.recentModulesNote)}
                        ${r.length?`<div class="apk-switch-list">${r.map(h=>bt(h,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.noRecent)}</div>`}
                    </section>
                    ${l.length?`
                            <section class="apk-library-section">
                                ${k(t.suggestedTitle,t.suggestedNote)}
                                <div class="apk-sheet-grid apk-library-results">
                                    ${l.map(h=>U(h,e)).join("")}
                                </div>
                            </section>
                        `:""}
                    ${(T=n==null?void 0:n.items)!=null&&T.length?`
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
                                        ${n.items.slice(0,4).map(h=>ft({...h,categoryTitle:n.title},e)).join("")}
                                    </div>
                                </article>
                            </section>
                        `:""}
                    <section class="apk-library-section">
                        ${k(t.appLibraryAllTitle,t.appLibraryAllNote)}
                        <div class="apk-library-clusters">
                            ${f.map(h=>Xt(h,e)).join("")}
                        </div>
                    </section>
                `}
        `}function Z(){let t=document.getElementById("apk-mobile-shell");if(t)return t;const e=b();return t=document.createElement("div"),t.id="apk-mobile-shell",t.setAttribute("aria-hidden","true"),t.innerHTML=`
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
        `,t.addEventListener("click",pe),t.addEventListener("input",ue),document.body.appendChild(t),t}function Zt(){const t=b(),e=M(),o=x();return e.length?[R(t.moduleOverviewTitle,t.moduleOverviewCopy),...e.map(a=>`
                <section class="apk-sheet-section">
                    ${k(a.title,a.eyebrow||t.workspaceNote)}
                    <div class="apk-sheet-grid">
                        ${a.items.map(n=>U({...n,categoryTitle:a.title},o)).join("")}
                    </div>
                </section>
            `)].join(""):`${R(t.moduleOverviewTitle,t.noModules)}
                <div class="apk-sheet-empty">${i(t.noModules)}</div>`}function te(){const t=b(),e=x(),o=B([...G(D),N()]).slice(0,4),a=new Set(o.map(s=>s.id)),n=ct(j+a.size).filter(s=>!a.has(s.id)).slice(0,j),r=[w("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand"),w("search",t.searchTitle,t.searchCopy,"ti ti-search"),w("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2"),typeof window.openUserPasswordModal=="function"?w("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):"",w("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")].filter(Boolean);return`
            ${R(t.quickTitle,t.quickCopy)}
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
                ${o.length?`<div class="apk-switch-list">${o.map(s=>bt(s,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.noRecent)}</div>`}
            </section>
            ${n.length?`
                    <section class="apk-sheet-section">
                        ${k(t.suggestedTitle,t.suggestedNote)}
                        <div class="apk-sheet-grid">
                            ${n.map(s=>U(s,e)).join("")}
                        </div>
                    </section>
                `:""}
            <section class="apk-sheet-section">
                ${k(t.utilitiesTitle,t.utilitiesNote)}
                <div class="apk-sheet-grid">
                    ${r.join("")}
                </div>
            </section>
        `}function ee(){const t=b(),e=$();return`
            ${R(t.accountTitle,t.accountCopy)}
            <section class="apk-sheet-section">
                <div class="apk-account-card">
                    <div class="apk-account-name">${i((e==null?void 0:e.name)||t.notLoggedIn)}</div>
                    <div class="apk-account-role">${i(rt())}</div>
                    <div class="apk-account-grid">
                        <div class="apk-account-row">
                            <span>${i(t.currentSchool)}</span>
                            <strong>${i(st()||t.unknownSchool)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.currentCohort)}</span>
                            <strong>${i(X())}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.themeMode)}</span>
                            <strong>${i(`${t.followSystem} · ${Yt()}`)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.runtimeEnv)}</span>
                            <strong>${i(F?"Android APK":t.mobileBrowser)}</strong>
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
        `}function oe(){var a;const t=b(),e=It(),o=((a=document.getElementById("cohort-selector"))==null?void 0:a.value)||"";return e.length?`
            ${R(t.switchCohortTitle,t.switchCohortCopy)}
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
        `:`${R(t.switchCohortTitle,t.noCohortChoices)}
                <div class="apk-sheet-empty">${i(t.noCohorts)}</div>`}function ae(t){const e=t.querySelector("[data-apk-library-panel]");e&&S(e,u?Jt():"")}function ie(){const e=Z().querySelector("[data-apk-sheet-panel]");if(e){if(!d){S(e,"");return}if(d==="modules"){S(e,Zt());return}if(d==="quick"){S(e,te());return}if(d==="account"){S(e,ee());return}d==="cohorts"&&S(e,oe())}}function ne(t){var s;const e=b(),o=t.querySelector("[data-apk-rail]");if(!o)return;const a=z(),n=x();if(!((s=a==null?void 0:a.items)!=null&&s.length)){S(o,`<div class="apk-rail-empty">${i(e.currentCategoryEmpty)}</div>`);return}const r=a.items.map(l=>`
            <button type="button" class="apk-rail-chip${l.id===n?" is-active":""}" data-apk-module="${i(l.id)}">
                ${i(l.text||l.id)}
            </button>
        `).join("");S(o,r)&&window.requestAnimationFrame(()=>scrollActiveRailChipIntoView(t))}function re(t){const e=x(),o=A();t.querySelectorAll(".apk-shell-tab").forEach(a=>{const n=a.getAttribute("data-apk-tab");Tt(a,"is-active",!u&&(n==="home"&&!d&&e===o||n==="modules"&&d==="modules"||n==="quick"&&d==="quick"||n==="account"&&d==="account"))})}function P(){const t=b(),e=Z(),o=N(),a=z(),n=[st()||t.unknownSchool,(a==null?void 0:a.title)||t.workbench,X()].filter(Boolean).join(" · ");Ct(e,"--apk-accent",(o==null?void 0:o.categoryColor)||(a==null?void 0:a.color)||"#2563eb"),e.setAttribute("aria-hidden","false"),K(e,"sheetOpen",d?"true":"false"),K(e,"sheetMode",d||""),K(e,"libraryOpen",u?"true":"false");const r={role:`${rt()}工作台`,title:(o==null?void 0:o.text)||"智慧教务",subtitle:n,cohort:X(),mode:t.workbench};Object.entries(r).forEach(([s,l])=>{const f=e.querySelector(`[data-apk-field="${s}"]`);Et(f,l)}),Ut(e),ne(e),ie(),ae(e),re(e)}function se(t,e={}){u=!!t,u&&(d=""),!u&&e.resetQuery!==!1&&(m=""),P()}function I(t){se(typeof t=="boolean"?t:!u)}function p(t=""){d=t,t&&(u=!1,m=""),P()}function C(t){p(d===t?"":t)}function tt(t){!t||typeof window.switchTab!="function"||(d="",u=!1,m="",P(),dt(),window.switchTab(t),Rt(t),t==="student-details"&&Dt(),_.forEach(e=>{window.setTimeout(()=>{var o;(o=document.getElementById(t))!=null&&o.classList.contains("active")&&(pt(),t==="student-details"&&typeof window.requestStudentDetailsPrimaryFocus=="function"&&window.requestStudentDetailsPrimaryFocus()),c()},e)}))}function le(){u=!1,m="",p(""),typeof window.openSpotlight=="function"&&window.openSpotlight()}function ce(){u=!1,m="",p(""),typeof window.openUserPasswordModal=="function"&&window.openUserPasswordModal()}function de(t){if(t==="home"){tt(A());return}if(t==="modules"){C("modules");return}if(t==="quick"){C("quick");return}t==="account"&&C("account")}function ue(t){const e=t.target.closest("[data-apk-library-search]");if(!e)return;const o=typeof e.selectionStart=="number"?e.selectionStart:String(e.value||"").length;if(m=String(e.value||""),P(),!u)return;const a=document.querySelector("[data-apk-library-search]");a&&(typeof a.focus=="function"&&a.focus({preventScroll:!0}),typeof a.setSelectionRange=="function"&&a.setSelectionRange(o,o))}function pe(t){const e=t.target.closest("[data-apk-action], [data-apk-module], [data-apk-cohort], [data-apk-tab]");if(!e)return;t.preventDefault();const o=e.getAttribute("data-apk-module");if(o){tt(o);return}const a=e.getAttribute("data-apk-cohort");if(a){Qt(a);return}const n=e.getAttribute("data-apk-tab");if(n){de(n);return}const r=e.getAttribute("data-apk-action");if(r==="close-sheet"){p("");return}if(r==="library"){I();return}if(r==="close-library"){I(!1);return}if(r==="modules"){C("modules");return}if(r==="quick"){C("quick");return}if(r==="account"){C("account");return}if(r==="cohorts"){C("cohorts");return}if(r==="search"){le();return}if(r==="password"){ce();return}r==="logout"&&window.Auth&&typeof window.Auth.logout=="function"&&(u=!1,m="",p(""),window.Auth.logout())}function he(t){var o;if(!g()||!Y()||Q()||ht())return;const e=(o=t.touches)==null?void 0:o[0];e&&(y={startX:e.clientX,startY:e.clientY,canOpenLibrary:!u&&!d&&e.clientX<=28,canCloseLibrary:u})}function be(t){var n;if(!y)return;const e=(n=t.touches)==null?void 0:n[0];if(!e)return;const o=e.clientX-y.startX,a=e.clientY-y.startY;if(Math.abs(a)>42){y=null;return}if(y.canOpenLibrary&&o>=80){I(!0),y=null;return}y.canCloseLibrary&&o<=-80&&(I(!1),y=null)}function mt(){y=null}function O(t,e,o){if(!t||typeof t[e]!="function"||t[e][o])return;const a=t[e],n=function(){const r=a.apply(this,arguments);return c(),_.forEach(s=>{window.setTimeout(c,s)}),r};n[o]=!0,t[e]=n}function fe(){if(window.Swal&&(O(window.Swal,"close","__apkMobileWrapped__"),typeof window.Swal.fire=="function"&&!window.Swal.fire.__apkMobileWrapped__)){const t=window.Swal.fire,e=function(){const o=t.apply(window.Swal,arguments);return c(),_.forEach(a=>{window.setTimeout(c,a)}),o&&typeof o.finally=="function"&&o.finally(()=>{_.forEach(a=>{window.setTimeout(c,a)})}),o};e.__apkMobileWrapped__=!0,window.Swal.fire=e}}function me(){O(window,"switchTab","__apkMobileWrapped__"),O(window,"renderNavigation","__apkMobileWrapped__"),O(window,"switchNavCategory","__apkMobileWrapped__"),window.Auth&&(O(window.Auth,"applyRoleView","__apkMobileWrapped__"),O(window.Auth,"renderParentView","__apkMobileWrapped__")),fe()}function ye(){$t(),me(),Kt();const t=g(),e=t&&Y()&&!Q();document.body.dataset.mobileQuery=t?"true":"false",e?document.body.dataset.mobileArchitecture="apk-v2":delete document.body.dataset.mobileArchitecture,Ft(),jt();const o=Z();if(o.style.display=e?"block":"none",o.setAttribute("aria-hidden",e?"false":"true"),!e){d="",u=!1,m="",o.dataset.sheetOpen="false",o.dataset.sheetMode="",o.dataset.libraryOpen="false",o.dataset.modalOpen="false";return}pt(),P()}function c(){clearTimeout(at),at=window.setTimeout(ye,60)}const yt={switchTab(t){const e={home:A(),students:"student-details",analysis:"summary"};if(t==="me"){p("account");return}const o=e[t]||t;tt(o)},renderStudentList(){c()},showStudentDetail(){c()},renderAnalysis(){c()},openModules(){p("modules")},openLibrary(){I(!0)},openQuickActions(){p("quick")},openAccountSheet(){p("account")},openCohortSheet(){p("cohorts")},refresh:c};window.MobMgr=yt,window.MobileQueryUI={refresh:c,openLibrary:()=>I(!0),openModules:()=>p("modules"),openQuick:()=>p("quick"),openAccount:()=>p("account"),openCohorts:()=>p("cohorts")},window.switchMobileTab=t=>yt.switchTab(t),window.matchMedia&&(v=window.matchMedia("(prefers-color-scheme: dark)"),typeof v.addEventListener=="function"?v.addEventListener("change",c):typeof v.addListener=="function"&&v.addListener(c)),window.addEventListener("cloud-load-state",c),window.addEventListener("resize",c),window.addEventListener("orientationchange",c),window.addEventListener("load",c),window.addEventListener("pageshow",c),window.addEventListener("focus",c),document.addEventListener("touchstart",he,{passive:!0}),document.addEventListener("touchmove",be,{passive:!0}),document.addEventListener("touchend",mt,{passive:!0}),document.addEventListener("touchcancel",mt,{passive:!0}),document.addEventListener("resume",c,!1),document.addEventListener("visibilitychange",()=>{document.hidden||c()}),_.forEach(t=>{window.setTimeout(c,t)}),c(),window.__MOBILE_MANAGER_PATCHED__=!0,window.__MOBILE_APP_RUNTIME_PATCHED__=!0})();
