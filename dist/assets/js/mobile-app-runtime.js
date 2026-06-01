(()=>{if(typeof window=="undefined"||window.__MOBILE_APP_RUNTIME_PATCHED__)return;const St=960,_=[80,260,900],Et=[140,420,980,1600],Ct={admin:"starter-hub",director:"starter-hub",grade_director:"starter-hub",class_teacher:"student-details",teacher:"teacher-analysis"},Tt=["student-details","summary","teacher-analysis","report-generator","progress-analysis","analysis"],it="apk-recent-modules-v1",D=8,j=6,_t={admin:"管理员",director:"校级管理",grade_director:"级部主任",class_teacher:"班主任",teacher:"教师",parent:"家长",student:"学生",guest:"访客"},F=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform=="function"&&window.Capacitor.isNativePlatform()||typeof window.Capacitor.getPlatform=="function"&&window.Capacitor.getPlatform()!=="web"));let at=0,d="",u=!1,m="",y=null,v=null,nt=null,W="",H=null,M=new Map;function a(t){return String(t!=null?t:"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function Mt(t,e){if(!t)return!1;const o=String(e!=null?e:"");return t.textContent===o?!1:(t.textContent=o,!0)}function S(t,e){if(!t)return!1;const o=String(e!=null?e:"");return t.__apkLastHtml===o?!1:(t.innerHTML=o,t.__apkLastHtml=o,!0)}function K(t,e,o){if(!(t!=null&&t.dataset))return!1;const i=String(o!=null?o:"");return t.dataset[e]===i?!1:(t.dataset[e]=i,!0)}function Lt(t,e,o){if(!(t!=null&&t.style))return!1;const i=String(o!=null?o:"");return t.style.getPropertyValue(e)===i?!1:(t.style.setProperty(e,i),!0)}function $t(t,e,o){if(!(t!=null&&t.classList))return!1;const i=!!o;return t.classList.contains(e)===i?!1:(t.classList.toggle(e,i),!0)}function rt(){var e,o,i;const t=[Number(window.innerWidth||0),Number(((e=document.documentElement)==null?void 0:e.clientWidth)||0),Number(window.outerWidth||0),Number(((o=window.screen)==null?void 0:o.width)||0),Number(((i=window.screen)==null?void 0:i.availWidth)||0)].filter(n=>Number.isFinite(n)&&n>0);return t.length?Math.min(...t):0}function g(){return rt()<=St}function st(){return window.matchMedia?window.matchMedia("(max-width: 900px)").matches:rt()<=900}function Q(t=document){document.documentElement.classList.toggle("is-compact-viewport",st()),(t&&typeof t.querySelectorAll=="function"?t:document).querySelectorAll(".analysis-table-shell, .table-wrap").forEach(o=>{o.dataset.mobileHint||(o.dataset.mobileHint="可横向滑动查看完整表格")})}function lt(){Q(document)}function At(t){var i;const e=(i=t==null?void 0:t.querySelector)==null?void 0:i.call(t,"[data-apk-rail]");if(!e)return;const o=e.querySelector(".apk-rail-chip.is-active");!o||typeof o.scrollIntoView!="function"||o.scrollIntoView({inline:"center",block:"nearest",behavior:"auto"})}function L(){return window.AuthState&&typeof window.AuthState.getCurrentUser=="function"?window.AuthState.getCurrentUser():window.Auth&&window.Auth.currentUser?window.Auth.currentUser:null}function V(){var t,e,o;return window.AuthState&&typeof window.AuthState.getCurrentRole=="function"?window.AuthState.getCurrentRole():String(((t=L())==null?void 0:t.role)||((o=(e=document.body)==null?void 0:e.dataset)==null?void 0:o.role)||"guest").trim()||"guest"}function ct(){if(window.AuthState&&typeof window.AuthState.getCurrentRoles=="function")return window.AuthState.getCurrentRoles();const t=L();return(Array.isArray(t==null?void 0:t.roles)&&t.roles.length?t.roles:[t==null?void 0:t.role].filter(Boolean)).map(o=>String(o||"").trim()).filter(Boolean)}function Se(t){const e=new Set(ct());return t.some(o=>e.has(o))}function Y(t=V()){const e=String(t||"").trim();return e==="parent"||e==="student"}function dt(t=V()){return _t[String(t||"").trim()]||String(t||"访客")}function ut(){var t,e;return window.SchoolState&&typeof window.SchoolState.getCurrentSchool=="function"?String(((t=L())==null?void 0:t.school)||window.SchoolState.getCurrentSchool()||"").trim():String(((e=L())==null?void 0:e.school)||window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||"").trim()}function z(){const t=document.getElementById("login-overlay"),e=!!(t&&getComputedStyle(t).display!=="none");return!!L()&&!e}function xt(){if(window.NAV_STRUCTURE)return window.NAV_STRUCTURE;try{return NAV_STRUCTURE}catch(t){return null}}function Rt(){W="",H=null,M=new Map}function It(t,e){const o=ct().join("|"),i=t?Object.keys(t).join("|"):"",n=window.CONFIG&&window.CONFIG.showQuery?"report:1":"report:0";return[e,o,i,n].join("::")}function Ot(t){return!(typeof window.canAccessModule=="function"&&!window.canAccessModule(t)||t==="report-generator"&&typeof window.CONFIG!="undefined"&&window.CONFIG&&!window.CONFIG.showQuery)}function $(){const t=xt();if(!t)return[];const e=V(),o=It(t,e);if(H&&W===o)return H;const i=Object.keys(t).map(n=>{const r=t[n];return{...r,key:n,items:Array.isArray(r==null?void 0:r.items)?r.items.filter(s=>Ot(s.id)):[]}}).filter(n=>n.items.length>0);return W=o,H=i,M=new Map,i}function E(t){if(!t)return null;if(M.has(t))return M.get(t);const e=$();for(const o of e){const i=o.items.find(n=>n.id===t);if(i){const n={...i,categoryKey:o.key,categoryTitle:o.title,categoryColor:o.color};return M.set(t,n),n}}return M.set(t,null),null}function A(){var o,i,n;const t=Ct[V()]||"starter-hub",e=E(t);return e?e.id:((n=(i=(o=$()[0])==null?void 0:o.items)==null?void 0:i[0])==null?void 0:n.id)||"starter-hub"}function x(){var t;return((t=document.querySelector(".section.active"))==null?void 0:t.id)||A()}function q(){return E(x())||E(A())||null}function G(){const t=$(),e=q();if(e){const i=t.find(n=>n.key===e.categoryKey);if(i)return i}const o=typeof window.getCurrentNavCategory=="function"?String(window.getCurrentNavCategory()||"").trim():"";return t.find(i=>i.key===o)||t[0]||null}function N(t){const e=new Set;return t.filter(o=>!o||!o.id||e.has(o.id)?!1:(e.add(o.id),!0))}function pt(){try{const t=JSON.parse(localStorage.getItem(it)||"[]");return Array.isArray(t)?t.map(e=>String(e||"").trim()).filter(Boolean):[]}catch(t){return[]}}function qt(t){try{localStorage.setItem(it,JSON.stringify(t.map(e=>String(e||"").trim()).filter(Boolean).slice(0,D)))}catch(e){}}function Nt(t){const e=E(t);e&&qt([e.id,...pt().filter(o=>o!==e.id)])}function X(t=D){return N(pt().map(e=>E(e)).filter(Boolean)).slice(0,t)}function ht(t=j){const e=[...X(t),q(),E(A()),...Tt.map(o=>E(o))];return N(e).slice(0,t)}function Ee(){var o;const t=document.getElementById("mode-badge"),e=String((t==null?void 0:t.textContent)||"").trim();return e||String(((o=window.CONFIG)==null?void 0:o.name)||"学校工作台").trim()}function J(){var e;const t=document.getElementById("cohort-selector");return(e=t==null?void 0:t.selectedOptions)!=null&&e[0]&&String(t.selectedOptions[0].textContent||t.value||"届别未选择").trim()||"届别未选择"}function Bt(){const t=document.getElementById("cohort-selector");return t?Array.from(t.options||[]).filter(e=>String(e.value||"").trim()).map(e=>({value:String(e.value||"").trim(),label:String(e.textContent||e.value||"").trim()})):[]}function Pt(){return document.querySelector("main.app-main")}function bt(){const t=Pt();if(t&&typeof t.scrollTo=="function"){t.scrollTo({top:0,behavior:"auto"});return}const e=document.scrollingElement||document.documentElement||document.body;if(e&&typeof e.scrollTo=="function"){e.scrollTo({top:0,behavior:"auto"});return}typeof window.scrollTo=="function"&&window.scrollTo({top:0,behavior:"auto"})}function Ht(t=document){if(!g())return;t.querySelectorAll(".table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable").forEach(o=>{const i=Vt(o);i.length&&(o.classList.add("mobile-card-table"),Array.from(o.querySelectorAll("tbody tr")).forEach(n=>{let r=String(n.getAttribute("data-mobile-card-title")||"").trim();Array.from(n.children).forEach((s,c)=>{if(!(s instanceof HTMLElement)||s.hasAttribute("colspan"))return;const f=String(i[c]||`字段${c+1}`).replace(/\s+/g," ").trim(),T=String(s.textContent||"").replace(/\s+/g," ").trim();!r&&T&&c<=1&&(r=T),s.setAttribute("data-label",f)}),r&&n.setAttribute("data-mobile-card-title",r)}))})}function Vt(t){const e=Array.from(t.querySelectorAll("thead tr"));if(!e.length)return[];const o=[];let i=0;return e.forEach((n,r)=>{o[r]||(o[r]=[]);let s=0;Array.from(n.children).forEach(c=>{for(;o[r][s];)s+=1;const f=Math.max(parseInt(c.getAttribute("colspan")||"1",10)||1,1),T=Math.max(parseInt(c.getAttribute("rowspan")||"1",10)||1,1),h=String(c.textContent||"").replace(/\s+/g," ").trim();for(let P=0;P<T;P+=1){o[r+P]||(o[r+P]=[]);for(let ot=0;ot<f;ot+=1)o[r+P][s+ot]=h}s+=f,s>i&&(i=s)})}),Array.from({length:i},(n,r)=>{const s=[];return o.forEach(c=>{const f=String((c==null?void 0:c[r])||"").trim();!f||s[s.length-1]===f||s.push(f)}),s.join(" / ")})}function Z(t=document){if(!g())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;Ht(e)}function ft(t=document){if(!g())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;clearTimeout(window.__RESPONSIVE_TABLE_REFRESH_TIMER__||0),window.__RESPONSIVE_TABLE_REFRESH_TIMER__=window.setTimeout(()=>{Z(e)},60)}function Ut(t=document.querySelector(".section.active")||document.getElementById("app")||document.body){if(typeof MutationObserver!="function")return;const e=t instanceof HTMLElement?t:document.querySelector(".section.active")||document.getElementById("app")||document.body||document.documentElement;if(!e||window.__RESPONSIVE_TABLE_OBSERVER__&&nt===e)return;window.__RESPONSIVE_TABLE_OBSERVER__&&typeof window.__RESPONSIVE_TABLE_OBSERVER__.disconnect=="function"&&window.__RESPONSIVE_TABLE_OBSERVER__.disconnect();const o=new MutationObserver(i=>{if(!g())return;i.some(r=>Array.from(r.addedNodes||[]).some(s=>{var c;return s instanceof HTMLElement?s.matches("table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table, .section, #parent-view-container")||!!((c=s.querySelector)!=null&&c.call(s,"table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table")):!1}))&&ft(e)});o.observe(e,{childList:!0,subtree:!0}),window.__RESPONSIVE_TABLE_OBSERVER__=o,nt=e}window.refreshResponsiveMobileTables=Z;function Dt(t=document){g()&&(t.querySelectorAll('.section [style*="grid-template-columns"]').forEach(e=>{e.closest("#parent-view-container")||e.classList.add("mobile-stack-grid")}),t.querySelectorAll('.section [style*="display:flex"]').forEach(e=>{e.closest("#parent-view-container")||e.closest("#apk-mobile-shell")||e.children.length<2||e.classList.add("mobile-wrap-row")}))}function jt(){if(document.getElementById("mobile-experience-styles"))return;const t=document.createElement("style");t.id="mobile-experience-styles",t.textContent=`
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
        `,document.head.appendChild(t)}function mt(){const t=document.querySelector(".section.active")||document;jt(),Q(t),Z(t),ft(t),Ut(t),Dt(t)}function Ft(t){if(!(t instanceof HTMLElement))return!1;const e=window.getComputedStyle(t);return e.display==="none"||e.visibility==="hidden"||Number(e.opacity||1)===0||t.getAttribute("aria-hidden")==="true"||t.hidden?!1:t.getClientRects().length>0}function yt(){if(window.Swal&&typeof window.Swal.isVisible=="function"&&window.Swal.isVisible())return!0;const t=[".swal2-container",".modal",'[role="dialog"]','[aria-modal="true"]',".dialog-overlay",".dialog-backdrop"];return Array.from(document.querySelectorAll(t.join(","))).some(e=>{if(!(e instanceof HTMLElement)||e.closest("#apk-mobile-shell")||!Ft(e))return!1;const o=window.getComputedStyle(e),i=Number(o.zIndex||0);return o.position==="fixed"||i>=1e3})}function Wt(t=document.getElementById("apk-mobile-shell")){t&&(t.dataset.modalOpen=yt()?"true":"false")}function Kt(){Et.forEach((t,e)=>{window.setTimeout(()=>{const o=document.getElementById("student-details");if(!(!o||!o.classList.contains("active"))){if(typeof window.requestStudentDetailsPrimaryFocus=="function"){window.requestStudentDetailsPrimaryFocus(e);return}typeof window.focusStudentDetailsPrimaryFlow=="function"&&window.focusStudentDetailsPrimaryFlow()}},t)})}function Qt(){["mobile-manager-app","mobile-query-shell"].forEach(t=>{const e=document.getElementById(t);e&&(e.setAttribute("aria-hidden","true"),e.style.display="none")})}function Yt(){const t=document.getElementById("app");if(t){if(!g()){t.classList.remove("hidden"),t.style.display="";return}if(!z()){t.classList.add("hidden"),t.style.display="none";return}Y()||(t.classList.remove("hidden"),t.style.display="")}}function zt(){const t=document.querySelector('meta[name="theme-color"]');t&&t.setAttribute("content",document.body.classList.contains("dark-mode")?"#08111d":"#eef3f8")}function Gt(){const t=!!(v!=null&&v.matches);document.body.dataset.nativeApp=F?"true":"false",document.body.dataset.systemTheme=t?"dark":"light",F&&g()&&(document.body.classList.toggle("dark-mode",t),localStorage.setItem("theme-dark",t?"true":"false")),document.documentElement.style.colorScheme=document.body.classList.contains("dark-mode")?"dark":"light",zt()}function Xt(t){const e=document.getElementById("cohort-selector");!e||!t||(e.value=t,e.dispatchEvent(new Event("change",{bubbles:!0})),p(""),_.forEach(o=>{window.setTimeout(()=>{bt(),l()},o)}))}function b(){return{workbench:"学校工作台",mobileWorkbench:"移动工作台",mobilePreparing:"移动工作台正在准备中",openLibrary:"打开模块资源库",openSearch:"打开全局搜索",closeSheet:"关闭面板",closeLibrary:"关闭模块资源库",cohortPlaceholder:"届别未选择",home:"工作台",modules:"模块",recent:"最近",account:"我的",openModule:"打开该模块",currentCategoryEmpty:"当前分类暂无可用模块",current:"当前",open:"打开",workspaceNote:"Workspace",moduleOverviewTitle:"模块总览",moduleOverviewCopy:"按分类切换工作模块，减少手机端来回翻找入口的次数。",noModules:"当前账号还没有可切换的模块入口。",quickTitle:"最近与常用",quickCopy:"先给你最近用过的模块，再补高频入口，减少反复进出分类面板。",quickHeroTitle:"跨分类切换先看这里",quickHeroCopy:"默认优先展示最近使用，同时保留完整模块资源库入口。",recentModulesTitle:"最近使用",recentModulesNote:"Recent Modules",suggestedTitle:"高频推荐",suggestedNote:"Suggested",utilitiesTitle:"系统动作",utilitiesNote:"Utilities",noRecent:"还没有可回跳的最近模块，可以先从当前分类或全部模块进入。",appLibraryTitle:"模块资源库",appLibraryCopy:"像 App 资源库一样集中浏览全部模块，支持最近使用、当前分类和快速搜索。",appLibrarySearch:"搜索模块、功能或分类",appLibrarySearchTitle:"搜索结果",appLibrarySearchNote:"Results",appLibrarySearchEmpty:"没有匹配的模块，试试更短的关键词。",appLibraryCurrentTitle:"当前分类",appLibraryCurrentNote:"Now Browsing",appLibraryAllTitle:"全部分类",appLibraryAllNote:"App Library",allModulesTitle:"全部模块",allModulesCopy:"找不到所需功能时，直接打开完整模块总览。",searchTitle:"全局搜索",searchCopy:"快速搜索学生、模块和常用入口。",cohortsTitle:"切换届别",cohortsCopy:"在不同届别工作区之间快速跳转。",passwordTitle:"修改密码",passwordCopy:"直接打开当前账号的密码修改入口。",logoutTitle:"退出登录",logoutCopy:"返回登录页，重新选择账号进入。",accountTitle:"账号与设置",accountCopy:"APK 默认跟随系统主题，并把常用设置集中到这一层。",currentSchool:"当前学校",currentCohort:"当前届别",themeMode:"主题模式",themeDark:"深色",themeLight:"浅色",followSystem:"跟随系统",runtimeEnv:"运行环境",mobileBrowser:"移动浏览器",notLoggedIn:"未登录",unknownSchool:"未识别学校",switchCohortTitle:"切换届别",switchCohortCopy:"统一从这里切届别，避免手机端入口与工作区状态脱节。",noCohorts:"暂无可切换届别。",noCohortChoices:"当前没有可切换的届别，请先完成数据恢复。",usingCurrentCohort:"当前正在使用的届别。",switchToThisCohort:"点击切换到这个届别。"}}function Jt(){return document.body.dataset.systemTheme==="dark"?b().themeDark:b().themeLight}function Zt(t,e=null){return[t==null?void 0:t.text,t==null?void 0:t.hint,t==null?void 0:t.id,e==null?void 0:e.title,e==null?void 0:e.eyebrow].filter(Boolean).join(" ").toLowerCase()}function te(){const t=String(m||"").trim().toLowerCase();return t?N($().flatMap(e=>e.items.filter(o=>Zt(o,e).includes(t)).map(o=>({...o,categoryTitle:e.title,categoryKey:e.key,categoryColor:e.color})))):[]}function R(t,e){return`
            <div class="apk-sheet-header">
                <div>
                    <strong>${a(t)}</strong>
                    <span>${a(e)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-sheet" aria-label="${a(b().closeSheet)}">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        `}function k(t,e){return`
            <div class="apk-sheet-section-head">
                <span class="apk-sheet-section-title">${a(t)}</span>
                <span class="apk-sheet-section-note">${a(e)}</span>
            </div>
        `}function U(t,e){const o=b();return`
            <button type="button" class="apk-sheet-card${t.id===e?" is-active":""}" data-apk-module="${a(t.id)}">
                <strong>${a(t.text||t.id)}</strong>
                <span>${a(t.hint||t.categoryTitle||o.openModule)}</span>
            </button>
        `}function w(t,e,o,i,n=""){return`
            <button type="button" class="apk-sheet-card apk-sheet-card--action${n?` ${n}`:""}" data-apk-action="${a(t)}">
                <i class="${a(i)}"></i>
                <strong>${a(e)}</strong>
                <span>${a(o)}</span>
            </button>
        `}function wt(t,e){const o=b(),i=t.id===e;return`
            <button type="button" class="apk-switch-row${i?" is-active":""}" data-apk-module="${a(t.id)}">
                <span class="apk-switch-row-copy">
                    <strong>${a(t.text||t.id)}</strong>
                    <span>${a(t.hint||t.categoryTitle||"跨分类快速直达")}</span>
                </span>
                <span class="apk-switch-row-meta">${i?o.current:o.open}</span>
            </button>
        `}function gt(t,e){const o=String(t.text||t.id||"").trim().slice(0,2)||"模块";return`
            <button type="button" class="apk-library-mini${t.id===e?" is-active":""}" data-apk-module="${a(t.id)}">
                <span class="apk-library-mini-badge">${a(o)}</span>
                <span class="apk-library-mini-copy">
                    <strong>${a(t.text||t.id)}</strong>
                    <span>${a(t.hint||t.categoryTitle||"模块")}</span>
                </span>
            </button>
        `}function ee(t,e){return`
            <article class="apk-library-card" style="--apk-library-accent:${a(t.color||"#2563eb")}">
                <div class="apk-library-card-head">
                    <div>
                        <strong>${a(t.title)}</strong>
                        <span>${a(`${t.items.length} 个模块`)}</span>
                    </div>
                    <span class="apk-library-card-count">${a(String(t.items.length).padStart(2,"0"))}</span>
                </div>
                <div class="apk-library-mini-grid">
                    ${t.items.slice(0,4).map(o=>gt({...o,categoryTitle:t.title},e)).join("")}
                </div>
            </article>
        `}function oe(){var T;const t=b(),e=x(),o=String(m||"").trim(),i=te(),n=G(),r=N([...X(6),q()]).slice(0,6),s=new Set(r.map(h=>h.id)),c=ht(6+s.size).filter(h=>!s.has(h.id)).slice(0,6),f=$();return`
            <div class="apk-library-head">
                <div class="apk-library-head-copy">
                    <strong>${a(t.appLibraryTitle)}</strong>
                    <span>${a(t.appLibraryCopy)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-library" aria-label="${a(t.closeLibrary)}">
                    <i class="ti ti-arrow-left"></i>
                </button>
            </div>
            <label class="apk-library-search">
                <i class="ti ti-search"></i>
                <input type="search" data-apk-library-search value="${a(o)}" placeholder="${a(t.appLibrarySearch)}" autocomplete="off" />
            </label>
            ${o?`
                    <section class="apk-library-section">
                        ${k(t.appLibrarySearchTitle,t.appLibrarySearchNote)}
                        ${i.length?`<div class="apk-sheet-grid apk-library-results">${i.map(h=>U(h,e)).join("")}</div>`:`<div class="apk-sheet-empty">${a(t.appLibrarySearchEmpty)}</div>`}
                    </section>
                `:`
                    <section class="apk-library-section">
                        ${k(t.recentModulesTitle,t.recentModulesNote)}
                        ${r.length?`<div class="apk-switch-list">${r.map(h=>wt(h,e)).join("")}</div>`:`<div class="apk-sheet-empty">${a(t.noRecent)}</div>`}
                    </section>
                    ${c.length?`
                            <section class="apk-library-section">
                                ${k(t.suggestedTitle,t.suggestedNote)}
                                <div class="apk-sheet-grid apk-library-results">
                                    ${c.map(h=>U(h,e)).join("")}
                                </div>
                            </section>
                        `:""}
                    ${(T=n==null?void 0:n.items)!=null&&T.length?`
                            <section class="apk-library-section">
                                ${k(t.appLibraryCurrentTitle,t.appLibraryCurrentNote)}
                                <article class="apk-library-spotlight" style="--apk-library-accent:${a(n.color||"#2563eb")}">
                                    <div class="apk-library-card-head">
                                        <div>
                                            <strong>${a(n.title)}</strong>
                                            <span>${a(`${n.items.length} 个模块`)}</span>
                                        </div>
                                        <span class="apk-library-card-count">${a(String(n.items.length).padStart(2,"0"))}</span>
                                    </div>
                                    <div class="apk-library-mini-grid">
                                        ${n.items.slice(0,4).map(h=>gt({...h,categoryTitle:n.title},e)).join("")}
                                    </div>
                                </article>
                            </section>
                        `:""}
                    <section class="apk-library-section">
                        ${k(t.appLibraryAllTitle,t.appLibraryAllNote)}
                        <div class="apk-library-clusters">
                            ${f.map(h=>ee(h,e)).join("")}
                        </div>
                    </section>
                `}
        `}function tt(){let t=document.getElementById("apk-mobile-shell");if(t)return t;const e=b();return t=document.createElement("div"),t.id="apk-mobile-shell",t.setAttribute("aria-hidden","true"),t.innerHTML=`
            <div class="apk-shell-top">
                <div class="apk-shell-topbar apk-shell-surface">
                    <button type="button" class="apk-shell-icon" data-apk-action="library" aria-label="${a(e.openLibrary)}">
                        <i class="ti ti-layout-sidebar-left-expand"></i>
                    </button>
                    <div class="apk-shell-copy">
                        <span class="apk-shell-kicker" data-apk-field="role">${a(e.workbench)}</span>
                        <strong class="apk-shell-title" data-apk-field="title">智慧教务</strong>
                        <span class="apk-shell-subtitle" data-apk-field="subtitle">${a(e.mobilePreparing)}</span>
                    </div>
                    <button type="button" class="apk-shell-icon" data-apk-action="search" aria-label="${a(e.openSearch)}">
                        <i class="ti ti-search"></i>
                    </button>
                </div>
                <div class="apk-shell-meta">
                    <button type="button" class="apk-shell-pill apk-shell-surface" data-apk-action="cohorts">
                        <i class="ti ti-id-badge-2"></i>
                        <span data-apk-field="cohort">${a(e.cohortPlaceholder)}</span>
                    </button>
                    <div class="apk-shell-pill apk-shell-surface is-static">
                        <i class="ti ti-device-imac"></i>
                        <span data-apk-field="mode">${a(e.workbench)}</span>
                    </div>
                </div>
                <div class="apk-shell-rail" data-apk-rail></div>
            </div>
            <button type="button" class="apk-shell-library-backdrop" data-apk-action="close-library" aria-label="${a(e.closeLibrary)}"></button>
            <div class="apk-shell-library">
                <div class="apk-shell-library-panel apk-shell-surface" data-apk-library-panel></div>
            </div>
            <button type="button" class="apk-shell-backdrop" data-apk-action="close-sheet" aria-label="${a(e.closeSheet)}"></button>
            <div class="apk-shell-sheet">
                <div class="apk-shell-sheet-panel apk-shell-surface" data-apk-sheet-panel></div>
            </div>
            <div class="apk-shell-tabs apk-shell-surface">
                <button type="button" class="apk-shell-tab" data-apk-tab="home">
                    <i class="ti ti-home"></i>
                    <span>${a(e.home)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="modules">
                    <i class="ti ti-layout-grid"></i>
                    <span>${a(e.modules)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="quick">
                    <i class="ti ti-history"></i>
                    <span>${a(e.recent)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="account">
                    <i class="ti ti-user-circle"></i>
                    <span>${a(e.account)}</span>
                </button>
            </div>
        `,t.addEventListener("click",me),t.addEventListener("input",fe),document.body.appendChild(t),t}function ie(){const t=b(),e=$(),o=x();return e.length?[R(t.moduleOverviewTitle,t.moduleOverviewCopy),...e.map(i=>`
                <section class="apk-sheet-section">
                    ${k(i.title,i.eyebrow||t.workspaceNote)}
                    <div class="apk-sheet-grid">
                        ${i.items.map(n=>U({...n,categoryTitle:i.title},o)).join("")}
                    </div>
                </section>
            `)].join(""):`${R(t.moduleOverviewTitle,t.noModules)}
                <div class="apk-sheet-empty">${a(t.noModules)}</div>`}function ae(){const t=b(),e=x(),o=N([...X(D),q()]).slice(0,4),i=new Set(o.map(s=>s.id)),n=ht(j+i.size).filter(s=>!i.has(s.id)).slice(0,j),r=[w("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand"),w("search",t.searchTitle,t.searchCopy,"ti ti-search"),w("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2"),typeof window.openUserPasswordModal=="function"?w("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):"",w("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")].filter(Boolean);return`
            ${R(t.quickTitle,t.quickCopy)}
            <section class="apk-quick-hero">
                <div class="apk-quick-hero-copy">
                    <strong>${a(t.quickHeroTitle)}</strong>
                    <span>${a(t.quickHeroCopy)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="library" aria-label="${a(t.openLibrary)}">
                    <i class="ti ti-layout-sidebar-left-expand"></i>
                </button>
            </section>
            <section class="apk-sheet-section">
                ${k(t.recentModulesTitle,t.recentModulesNote)}
                ${o.length?`<div class="apk-switch-list">${o.map(s=>wt(s,e)).join("")}</div>`:`<div class="apk-sheet-empty">${a(t.noRecent)}</div>`}
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
        `}function ne(){const t=b(),e=L();return`
            ${R(t.accountTitle,t.accountCopy)}
            <section class="apk-sheet-section">
                <div class="apk-account-card">
                    <div class="apk-account-name">${a((e==null?void 0:e.name)||t.notLoggedIn)}</div>
                    <div class="apk-account-role">${a(dt())}</div>
                    <div class="apk-account-grid">
                        <div class="apk-account-row">
                            <span>${a(t.currentSchool)}</span>
                            <strong>${a(ut()||t.unknownSchool)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${a(t.currentCohort)}</span>
                            <strong>${a(J())}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${a(t.themeMode)}</span>
                            <strong>${a(`${t.followSystem} · ${Jt()}`)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${a(t.runtimeEnv)}</span>
                            <strong>${a(F?"Android APK":t.mobileBrowser)}</strong>
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
        `}function re(){var i;const t=b(),e=Bt(),o=((i=document.getElementById("cohort-selector"))==null?void 0:i.value)||"";return e.length?`
            ${R(t.switchCohortTitle,t.switchCohortCopy)}
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${e.map(n=>`
                        <button type="button" class="apk-sheet-card${n.value===o?" is-active":""}" data-apk-cohort="${a(n.value)}">
                            <strong>${a(n.label)}</strong>
                            <span>${a(n.value===o?t.usingCurrentCohort:t.switchToThisCohort)}</span>
                        </button>
                    `).join("")}
                </div>
            </section>
        `:`${R(t.switchCohortTitle,t.noCohortChoices)}
                <div class="apk-sheet-empty">${a(t.noCohorts)}</div>`}function se(t){const e=t.querySelector("[data-apk-library-panel]");e&&S(e,u?oe():"")}function le(){const e=tt().querySelector("[data-apk-sheet-panel]");if(e){if(!d){S(e,"");return}if(d==="modules"){S(e,ie());return}if(d==="quick"){S(e,ae());return}if(d==="account"){S(e,ne());return}d==="cohorts"&&S(e,re())}}function ce(t){var s;const e=b(),o=t.querySelector("[data-apk-rail]");if(!o)return;const i=G(),n=x();if(!((s=i==null?void 0:i.items)!=null&&s.length)){S(o,`<div class="apk-rail-empty">${a(e.currentCategoryEmpty)}</div>`);return}const r=i.items.map(c=>`
            <button type="button" class="apk-rail-chip${c.id===n?" is-active":""}" data-apk-module="${a(c.id)}">
                ${a(c.text||c.id)}
            </button>
        `).join("");S(o,r)&&window.requestAnimationFrame(()=>At(t))}function de(t){const e=x(),o=A();t.querySelectorAll(".apk-shell-tab").forEach(i=>{const n=i.getAttribute("data-apk-tab");$t(i,"is-active",!u&&(n==="home"&&!d&&e===o||n==="modules"&&d==="modules"||n==="quick"&&d==="quick"||n==="account"&&d==="account"))})}function B(){const t=b(),e=tt(),o=q(),i=G(),n=[ut()||t.unknownSchool,(i==null?void 0:i.title)||t.workbench,J()].filter(Boolean).join(" · ");Lt(e,"--apk-accent",(o==null?void 0:o.categoryColor)||(i==null?void 0:i.color)||"#2563eb"),e.setAttribute("aria-hidden","false"),K(e,"sheetOpen",d?"true":"false"),K(e,"sheetMode",d||""),K(e,"libraryOpen",u?"true":"false");const r={role:`${dt()}工作台`,title:(o==null?void 0:o.text)||"智慧教务",subtitle:n,cohort:J(),mode:t.workbench};Object.entries(r).forEach(([s,c])=>{const f=e.querySelector(`[data-apk-field="${s}"]`);Mt(f,c)}),Wt(e),ce(e),le(),se(e),de(e)}function ue(t,e={}){u=!!t,u&&(d=""),!u&&e.resetQuery!==!1&&(m=""),B()}function I(t){ue(typeof t=="boolean"?t:!u)}function p(t=""){d=t,t&&(u=!1,m=""),B()}function C(t){p(d===t?"":t)}function et(t){!t||typeof window.switchTab!="function"||(d="",u=!1,m="",B(),bt(),window.switchTab(t),Nt(t),t==="student-details"&&Kt(),_.forEach(e=>{window.setTimeout(()=>{var o;(o=document.getElementById(t))!=null&&o.classList.contains("active")&&(mt(),t==="student-details"&&typeof window.requestStudentDetailsPrimaryFocus=="function"&&window.requestStudentDetailsPrimaryFocus()),l()},e)}))}function pe(){u=!1,m="",p(""),typeof window.openSpotlight=="function"&&window.openSpotlight()}function he(){u=!1,m="",p(""),typeof window.openUserPasswordModal=="function"&&window.openUserPasswordModal()}function be(t){if(t==="home"){et(A());return}if(t==="modules"){C("modules");return}if(t==="quick"){C("quick");return}t==="account"&&C("account")}function fe(t){const e=t.target.closest("[data-apk-library-search]");if(!e)return;const o=typeof e.selectionStart=="number"?e.selectionStart:String(e.value||"").length;if(m=String(e.value||""),B(),!u)return;const i=document.querySelector("[data-apk-library-search]");i&&(typeof i.focus=="function"&&i.focus({preventScroll:!0}),typeof i.setSelectionRange=="function"&&i.setSelectionRange(o,o))}function me(t){const e=t.target.closest("[data-apk-action], [data-apk-module], [data-apk-cohort], [data-apk-tab]");if(!e)return;t.preventDefault();const o=e.getAttribute("data-apk-module");if(o){et(o);return}const i=e.getAttribute("data-apk-cohort");if(i){Xt(i);return}const n=e.getAttribute("data-apk-tab");if(n){be(n);return}const r=e.getAttribute("data-apk-action");if(r==="close-sheet"){p("");return}if(r==="library"){I();return}if(r==="close-library"){I(!1);return}if(r==="modules"){C("modules");return}if(r==="quick"){C("quick");return}if(r==="account"){C("account");return}if(r==="cohorts"){C("cohorts");return}if(r==="search"){pe();return}if(r==="password"){he();return}r==="logout"&&window.Auth&&typeof window.Auth.logout=="function"&&(u=!1,m="",p(""),window.Auth.logout())}function ye(t){var o;if(!g()||!z()||Y()||yt())return;const e=(o=t.touches)==null?void 0:o[0];e&&(y={startX:e.clientX,startY:e.clientY,canOpenLibrary:!u&&!d&&e.clientX<=28,canCloseLibrary:u})}function we(t){var n;if(!y)return;const e=(n=t.touches)==null?void 0:n[0];if(!e)return;const o=e.clientX-y.startX,i=e.clientY-y.startY;if(Math.abs(i)>42){y=null;return}if(y.canOpenLibrary&&o>=80){I(!0),y=null;return}y.canCloseLibrary&&o<=-80&&(I(!1),y=null)}function kt(){y=null}function O(t,e,o){if(!t||typeof t[e]!="function"||t[e][o])return;const i=t[e],n=function(){const r=i.apply(this,arguments);return l(),_.forEach(s=>{window.setTimeout(l,s)}),r};n[o]=!0,t[e]=n}function ge(){if(window.Swal&&(O(window.Swal,"close","__apkMobileWrapped__"),typeof window.Swal.fire=="function"&&!window.Swal.fire.__apkMobileWrapped__)){const t=window.Swal.fire,e=function(){const o=t.apply(window.Swal,arguments);return l(),_.forEach(i=>{window.setTimeout(l,i)}),o&&typeof o.finally=="function"&&o.finally(()=>{_.forEach(i=>{window.setTimeout(l,i)})}),o};e.__apkMobileWrapped__=!0,window.Swal.fire=e}}function ke(){O(window,"switchTab","__apkMobileWrapped__"),O(window,"renderNavigation","__apkMobileWrapped__"),O(window,"switchNavCategory","__apkMobileWrapped__"),window.Auth&&(O(window.Auth,"applyRoleView","__apkMobileWrapped__"),O(window.Auth,"renderParentView","__apkMobileWrapped__")),ge()}function ve(){Rt(),ke(),Gt();const t=g(),e=t&&z()&&!Y();document.body.dataset.mobileQuery=t?"true":"false",e?document.body.dataset.mobileArchitecture="apk-v2":delete document.body.dataset.mobileArchitecture,Yt(),Qt();const o=tt();if(o.style.display=e?"block":"none",o.setAttribute("aria-hidden",e?"false":"true"),!e){d="",u=!1,m="",o.dataset.sheetOpen="false",o.dataset.sheetMode="",o.dataset.libraryOpen="false",o.dataset.modalOpen="false";return}mt(),B()}function l(){clearTimeout(at),at=window.setTimeout(ve,60)}const vt={switchTab(t){const e={home:A(),students:"student-details",analysis:"summary"};if(t==="me"){p("account");return}const o=e[t]||t;et(o)},renderStudentList(){l()},showStudentDetail(){l()},renderAnalysis(){l()},openModules(){p("modules")},openLibrary(){I(!0)},openQuickActions(){p("quick")},openAccountSheet(){p("account")},openCohortSheet(){p("cohorts")},refresh:l};window.MobMgr=vt,window.MobileQueryUI={refresh:l,openLibrary:()=>I(!0),openModules:()=>p("modules"),openQuick:()=>p("quick"),openAccount:()=>p("account"),openCohorts:()=>p("cohorts")},window.MobileExperienceRuntime=window.MobileExperienceRuntime||{install:lt,syncCompactState:Q,isCompactViewport:st},window.MobDashboardMgr=window.MobDashboardMgr||{showToast(t){window.UI&&typeof window.UI.toast=="function"?window.UI.toast(t,"info"):typeof window.showToast=="function"?window.showToast(t):window.alert(t)}},window.switchMobileTab=t=>vt.switchTab(t),window.matchMedia&&(v=window.matchMedia("(prefers-color-scheme: dark)"),typeof v.addEventListener=="function"?v.addEventListener("change",l):typeof v.addListener=="function"&&v.addListener(l)),window.addEventListener("cloud-load-state",l),window.addEventListener("resize",l),window.addEventListener("orientationchange",l),window.addEventListener("load",l),window.addEventListener("pageshow",l),window.addEventListener("focus",l),document.addEventListener("touchstart",ye,{passive:!0}),document.addEventListener("touchmove",we,{passive:!0}),document.addEventListener("touchend",kt,{passive:!0}),document.addEventListener("touchcancel",kt,{passive:!0}),document.addEventListener("resume",l,!1),document.addEventListener("visibilitychange",()=>{document.hidden||l()}),lt(),_.forEach(t=>{window.setTimeout(l,t)}),l(),window.__MOBILE_MANAGER_PATCHED__=!0,window.__MOBILE_APP_RUNTIME_PATCHED__=!0})();
