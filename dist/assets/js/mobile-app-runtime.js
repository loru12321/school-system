(()=>{if(typeof window=="undefined"||window.__MOBILE_APP_RUNTIME_PATCHED__)return;const At=960,A=[80,260,900],Ct=[140,420,980,1600],_t={admin:"starter-hub",director:"starter-hub",grade_director:"starter-hub",class_teacher:"student-details",teacher:"teacher-analysis"},Rt=["student-details","summary","teacher-analysis","report-generator","progress-analysis","analysis","teaching-warning-center"],ht="apk-recent-modules-v1",F=8,x=6,qt={admin:"管理员",director:"校级管理",grade_director:"级部主任",class_teacher:"班主任",teacher:"教师",parent:"家长",student:"学生",guest:"访客"},W=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform=="function"&&window.Capacitor.isNativePlatform()||typeof window.Capacitor.getPlatform=="function"&&window.Capacitor.getPlatform()!=="web"));let bt=0,c="",h=!1,g="",v=null,M=null;function a(t){return String(t!=null?t:"").replace(/[&<>"']/g,e=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[e])}function It(){var e,n,o;const t=[Number(window.innerWidth||0),Number(((e=document.documentElement)==null?void 0:e.clientWidth)||0),Number(window.outerWidth||0),Number(((n=window.screen)==null?void 0:n.width)||0),Number(((o=window.screen)==null?void 0:o.availWidth)||0)].filter(i=>Number.isFinite(i)&&i>0);return t.length?Math.min(...t):0}function $(){return It()<=At}function C(){return window.AuthState&&typeof window.AuthState.getCurrentUser=="function"?window.AuthState.getCurrentUser():window.Auth&&window.Auth.currentUser?window.Auth.currentUser:null}function j(){var t,e,n;return window.AuthState&&typeof window.AuthState.getCurrentRole=="function"?window.AuthState.getCurrentRole():String(((t=C())==null?void 0:t.role)||((n=(e=document.body)==null?void 0:e.dataset)==null?void 0:n.role)||"guest").trim()||"guest"}function Ot(){if(window.AuthState&&typeof window.AuthState.getCurrentRoles=="function")return window.AuthState.getCurrentRoles();const t=C();return(Array.isArray(t==null?void 0:t.roles)&&t.roles.length?t.roles:[t==null?void 0:t.role].filter(Boolean)).map(n=>String(n||"").trim()).filter(Boolean)}function ce(t){const e=new Set(Ot());return t.some(n=>e.has(n))}function X(t=j()){const e=String(t||"").trim();return e==="parent"||e==="student"}function Q(t=j()){return qt[String(t||"").trim()]||String(t||"访客")}function K(){var t,e;return window.SchoolState&&typeof window.SchoolState.getCurrentSchool=="function"?String(((t=C())==null?void 0:t.school)||window.SchoolState.getCurrentSchool()||"").trim():String(((e=C())==null?void 0:e.school)||window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||"").trim()}function J(){const t=document.getElementById("login-overlay"),e=!!(t&&getComputedStyle(t).display!=="none");return!!C()&&!e}function Ht(){if(window.NAV_STRUCTURE)return window.NAV_STRUCTURE;try{return NAV_STRUCTURE}catch(t){return null}}function Pt(t){const e=j();return!((e==="teacher"||e==="class_teacher")&&typeof window.canAccessModule=="function"&&!window.canAccessModule(t)||e==="teacher"&&["single-school-eval","exam-arranger","freshman-simulator"].includes(t)||t==="report-generator"&&typeof window.CONFIG!="undefined"&&window.CONFIG&&!window.CONFIG.showQuery)}function _(){const t=Ht();if(!t)return[];const e=j(),n=e==="teacher"||e==="class_teacher";return Object.keys(t).filter(o=>!(n&&(o==="data"||o==="tools")||n&&e==="teacher"&&o==="town")).map(o=>{const i=t[o];return{...i,key:o,items:Array.isArray(i==null?void 0:i.items)?i.items.filter(s=>Pt(s.id)):[]}}).filter(o=>o.items.length>0)}function R(t){if(!t)return null;const e=_();for(const n of e){const o=n.items.find(i=>i.id===t);if(o)return{...o,categoryKey:n.key,categoryTitle:n.title,categoryColor:n.color}}return null}function L(){var n,o,i;const t=_t[j()]||"starter-hub",e=R(t);return e?e.id:((i=(o=(n=_()[0])==null?void 0:n.items)==null?void 0:o[0])==null?void 0:i.id)||"starter-hub"}function m(){var t;return((t=document.querySelector(".section.active"))==null?void 0:t.id)||L()}function q(){return R(m())||R(L())||null}function D(){const t=_(),e=q();if(e){const o=t.find(i=>i.key===e.categoryKey);if(o)return o}const n=typeof window.getCurrentNavCategory=="function"?String(window.getCurrentNavCategory()||"").trim():"";return t.find(o=>o.key===n)||t[0]||null}function O(t){const e=new Set;return t.filter(n=>!n||!n.id||e.has(n.id)?!1:(e.add(n.id),!0))}function yt(){try{const t=JSON.parse(localStorage.getItem(ht)||"[]");return Array.isArray(t)?t.map(e=>String(e||"").trim()).filter(Boolean):[]}catch(t){return[]}}function Nt(t){try{localStorage.setItem(ht,JSON.stringify(t.map(e=>String(e||"").trim()).filter(Boolean).slice(0,F)))}catch(e){}}function kt(t){const e=R(t);e&&Nt([e.id,...yt().filter(n=>n!==e.id)])}function Y(t=F){return O(yt().map(e=>R(e)).filter(Boolean)).slice(0,t)}function z(t=x){const e=[...Y(t),q(),R(L()),...Rt.map(n=>R(n))];return O(e).slice(0,t)}function Bt(){var n;const t=document.getElementById("mode-badge"),e=String((t==null?void 0:t.textContent)||"").trim();return e||String(((n=window.CONFIG)==null?void 0:n.name)||"学校工作台").trim()}function H(){var e;const t=document.getElementById("cohort-selector");return(e=t==null?void 0:t.selectedOptions)!=null&&e[0]&&String(t.selectedOptions[0].textContent||t.value||"届别未选择").trim()||"届别未选择"}function wt(){const t=document.getElementById("cohort-selector");return t?Array.from(t.options||[]).filter(e=>String(e.value||"").trim()).map(e=>({value:String(e.value||"").trim(),label:String(e.textContent||e.value||"").trim()})):[]}function Ut(){return document.querySelector("main.app-main")}function Z(){const t=Ut();if(t&&typeof t.scrollTo=="function"){t.scrollTo({top:0,behavior:"auto"});return}const e=document.scrollingElement||document.documentElement||document.body;if(e&&typeof e.scrollTo=="function"){e.scrollTo({top:0,behavior:"auto"});return}typeof window.scrollTo=="function"&&window.scrollTo({top:0,behavior:"auto"})}function xt(t=document){if(!$())return;t.querySelectorAll(".table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable").forEach(n=>{const o=jt(n);o.length&&(n.classList.add("mobile-card-table"),Array.from(n.querySelectorAll("tbody tr")).forEach(i=>{let s=String(i.getAttribute("data-mobile-card-title")||"").trim();Array.from(i.children).forEach((r,d)=>{if(!(r instanceof HTMLElement)||r.hasAttribute("colspan"))return;const f=String(o[d]||`字段${d+1}`).replace(/\s+/g," ").trim(),S=String(r.textContent||"").replace(/\s+/g," ").trim();!s&&S&&d<=1&&(s=S),r.setAttribute("data-label",f)}),s&&i.setAttribute("data-mobile-card-title",s)}))})}function jt(t){const e=Array.from(t.querySelectorAll("thead tr"));if(!e.length)return[];const n=[];let o=0;return e.forEach((i,s)=>{n[s]||(n[s]=[]);let r=0;Array.from(i.children).forEach(d=>{for(;n[s][r];)r+=1;const f=Math.max(parseInt(d.getAttribute("colspan")||"1",10)||1,1),S=Math.max(parseInt(d.getAttribute("rowspan")||"1",10)||1,1),y=String(d.textContent||"").replace(/\s+/g," ").trim();for(let V=0;V<S;V+=1){n[s+V]||(n[s+V]=[]);for(let ft=0;ft<f;ft+=1)n[s+V][r+ft]=y}r+=f,r>o&&(o=r)})}),Array.from({length:o},(i,s)=>{const r=[];return n.forEach(d=>{const f=String((d==null?void 0:d[s])||"").trim();!f||r[r.length-1]===f||r.push(f)}),r.join(" / ")})}function tt(t=document){if(!$())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;xt(e)}function mt(t=document){if(!$())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;clearTimeout(window.__RESPONSIVE_TABLE_REFRESH_TIMER__||0),window.__RESPONSIVE_TABLE_REFRESH_TIMER__=window.setTimeout(()=>{tt(e)},60)}function Dt(){if(window.__RESPONSIVE_TABLE_OBSERVER__||typeof MutationObserver!="function")return;const t=document.body||document.documentElement;if(!t)return;const e=new MutationObserver(n=>{if(!$())return;n.some(i=>{var s,r;return i.type==="attributes"?i.target instanceof HTMLElement&&(i.target.matches("table, tbody, tr, td, .section, #parent-view-container")||!!((r=(s=i.target).closest)!=null&&r.call(s,"table, .section, #parent-view-container"))):Array.from(i.addedNodes||[]).some(d=>{var f;return d instanceof HTMLElement?d.matches("table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table, .section, #parent-view-container")||!!((f=d.querySelector)!=null&&f.call(d,"table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table")):!1})})&&mt(document)});e.observe(t,{childList:!0,subtree:!0,attributes:!0,attributeFilter:["class","style"]}),window.__RESPONSIVE_TABLE_OBSERVER__=e}window.refreshResponsiveMobileTables=tt;function Vt(t=document){$()&&(t.querySelectorAll('.section [style*="grid-template-columns"]').forEach(e=>{e.closest("#parent-view-container")||e.classList.add("mobile-stack-grid")}),t.querySelectorAll('.section [style*="display:flex"]').forEach(e=>{e.closest("#parent-view-container")||e.closest("#apk-mobile-shell")||e.children.length<2||e.classList.add("mobile-wrap-row")}))}function et(){const t=document.querySelector(".section.active")||document;tt(t),mt(t),Dt(),Vt(t)}function Ft(t){if(!(t instanceof HTMLElement))return!1;const e=window.getComputedStyle(t);return e.display==="none"||e.visibility==="hidden"||Number(e.opacity||1)===0||t.getAttribute("aria-hidden")==="true"||t.hidden?!1:t.getClientRects().length>0}function gt(){if(window.Swal&&typeof window.Swal.isVisible=="function"&&window.Swal.isVisible())return!0;const t=[".swal2-container",".modal",'[role="dialog"]','[aria-modal="true"]',".dialog-overlay",".dialog-backdrop"];return Array.from(document.querySelectorAll(t.join(","))).some(e=>{if(!(e instanceof HTMLElement)||e.closest("#apk-mobile-shell")||!Ft(e))return!1;const n=window.getComputedStyle(e),o=Number(n.zIndex||0);return n.position==="fixed"||o>=1e3})}function vt(t=document.getElementById("apk-mobile-shell")){t&&(t.dataset.modalOpen=gt()?"true":"false")}function St(){Ct.forEach((t,e)=>{window.setTimeout(()=>{const n=document.getElementById("student-details");if(!(!n||!n.classList.contains("active"))){if(typeof window.requestStudentDetailsPrimaryFocus=="function"){window.requestStudentDetailsPrimaryFocus(e);return}typeof window.focusStudentDetailsPrimaryFlow=="function"&&window.focusStudentDetailsPrimaryFlow()}},t)})}function Wt(){["mobile-manager-app","mobile-query-shell"].forEach(t=>{const e=document.getElementById(t);e&&(e.setAttribute("aria-hidden","true"),e.style.display="none")})}function Qt(){const t=document.getElementById("app");if(t){if(!$()){t.classList.remove("hidden"),t.style.display="";return}if(!J()){t.classList.add("hidden"),t.style.display="none";return}X()||(t.classList.remove("hidden"),t.style.display="")}}function Kt(){const t=document.querySelector('meta[name="theme-color"]');t&&t.setAttribute("content",document.body.classList.contains("dark-mode")?"#08111d":"#eef3f8")}function Yt(){const t=!!(M!=null&&M.matches);document.body.dataset.nativeApp=W?"true":"false",document.body.dataset.systemTheme=t?"dark":"light",W&&$()&&(document.body.classList.toggle("dark-mode",t),localStorage.setItem("theme-dark",t?"true":"false")),document.documentElement.style.colorScheme=document.body.classList.contains("dark-mode")?"dark":"light",Kt()}function le(){const t=m(),e=z(),n=[u("search","全局搜索","快速搜索学生、模块和操作入口。","ti ti-search"),u("cohorts","切换届别","在不同届别工作区之间快速切换。","ti ti-id-badge-2"),typeof window.openUserPasswordModal=="function"?u("password","修改密码","直接打开当前账号的密码修改入口。","ti ti-lock"):"",u("logout","退出登录","返回登录页，重新选择账号进入。","ti ti-logout","is-danger")].filter(Boolean);return`
            ${k("快捷入口","保留高频动作，其余能力统一收进模块总览。")}
            <section class="apk-sheet-section">
                <div class="apk-sheet-section-head">
                    <span class="apk-sheet-section-title">高频模块</span>
                    <span class="apk-sheet-section-note">Quick Access</span>
                </div>
                <div class="apk-sheet-grid">
                    ${e.map(o=>E(o,t)).join("")}
                </div>
            </section>
            <section class="apk-sheet-section">
                <div class="apk-sheet-section-head">
                    <span class="apk-sheet-section-title">系统动作</span>
                    <span class="apk-sheet-section-note">Utilities</span>
                </div>
                <div class="apk-sheet-grid">
                    ${n.join("")}
                </div>
            </section>
        `}function $t(t){const e=t.querySelector(".apk-rail-chip.is-active");!e||typeof e.scrollIntoView!="function"||e.scrollIntoView({inline:"center",block:"nearest",behavior:"auto"})}function Tt(t){const e=document.getElementById("cohort-selector");!e||!t||(e.value=t,e.dispatchEvent(new Event("change",{bubbles:!0})),p(""),A.forEach(n=>{window.setTimeout(()=>{Z(),l()},n)}))}function w(){return{workbench:"学校工作台",mobileWorkbench:"移动工作台",mobilePreparing:"移动工作台正在准备中",openLibrary:"打开模块资源库",openSearch:"打开全局搜索",closeSheet:"关闭面板",closeLibrary:"关闭模块资源库",cohortPlaceholder:"届别未选择",home:"工作台",modules:"模块",recent:"最近",account:"我的",openModule:"打开该模块",currentCategoryEmpty:"当前分类暂无可用模块",current:"当前",open:"打开",workspaceNote:"Workspace",moduleOverviewTitle:"模块总览",moduleOverviewCopy:"按分类切换工作模块，减少手机端来回翻找入口的次数。",noModules:"当前账号还没有可切换的模块入口。",quickTitle:"最近与常用",quickCopy:"先给你最近用过的模块，再补高频入口，减少反复进出分类面板。",quickHeroTitle:"跨分类切换先看这里",quickHeroCopy:"默认优先展示最近使用，同时保留完整模块资源库入口。",recentModulesTitle:"最近使用",recentModulesNote:"Recent Modules",suggestedTitle:"高频推荐",suggestedNote:"Suggested",utilitiesTitle:"系统动作",utilitiesNote:"Utilities",noRecent:"还没有可回跳的最近模块，可以先从当前分类或全部模块进入。",appLibraryTitle:"模块资源库",appLibraryCopy:"像 App 资源库一样集中浏览全部模块，支持最近使用、当前分类和快速搜索。",appLibrarySearch:"搜索模块、功能或分类",appLibrarySearchTitle:"搜索结果",appLibrarySearchNote:"Results",appLibrarySearchEmpty:"没有匹配的模块，试试更短的关键词。",appLibraryCurrentTitle:"当前分类",appLibraryCurrentNote:"Now Browsing",appLibraryAllTitle:"全部分类",appLibraryAllNote:"App Library",allModulesTitle:"全部模块",allModulesCopy:"找不到所需功能时，直接打开完整模块总览。",searchTitle:"全局搜索",searchCopy:"快速搜索学生、模块和常用入口。",cohortsTitle:"切换届别",cohortsCopy:"在不同届别工作区之间快速跳转。",passwordTitle:"修改密码",passwordCopy:"直接打开当前账号的密码修改入口。",logoutTitle:"退出登录",logoutCopy:"返回登录页，重新选择账号进入。",accountTitle:"账号与设置",accountCopy:"APK 默认跟随系统主题，并把常用设置集中到这一层。",currentSchool:"当前学校",currentCohort:"当前届别",themeMode:"主题模式",themeDark:"深色",themeLight:"浅色",followSystem:"跟随系统",runtimeEnv:"运行环境",mobileBrowser:"移动浏览器",notLoggedIn:"未登录",unknownSchool:"未识别学校",switchCohortTitle:"切换届别",switchCohortCopy:"统一从这里切届别，避免手机端入口与工作区状态脱节。",noCohorts:"暂无可切换届别。",noCohortChoices:"当前没有可切换的届别，请先完成数据恢复。",usingCurrentCohort:"当前正在使用的届别。",switchToThisCohort:"点击切换到这个届别。"}}function zt(){return document.body.dataset.systemTheme==="dark"?w().themeDark:w().themeLight}function Gt(t,e=null){return[t==null?void 0:t.text,t==null?void 0:t.hint,t==null?void 0:t.id,e==null?void 0:e.title,e==null?void 0:e.eyebrow].filter(Boolean).join(" ").toLowerCase()}function Xt(){const t=String(g||"").trim().toLowerCase();return t?O(_().flatMap(e=>e.items.filter(n=>Gt(n,e).includes(t)).map(n=>({...n,categoryTitle:e.title,categoryKey:e.key,categoryColor:e.color})))):[]}function k(t,e){return`
            <div class="apk-sheet-header">
                <div>
                    <strong>${a(t)}</strong>
                    <span>${a(e)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-sheet" aria-label="${a(w().closeSheet)}">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        `}function T(t,e){return`
            <div class="apk-sheet-section-head">
                <span class="apk-sheet-section-title">${a(t)}</span>
                <span class="apk-sheet-section-note">${a(e)}</span>
            </div>
        `}function E(t,e){const n=w();return`
            <button type="button" class="apk-sheet-card${t.id===e?" is-active":""}" data-apk-module="${a(t.id)}">
                <strong>${a(t.text||t.id)}</strong>
                <span>${a(t.hint||t.categoryTitle||n.openModule)}</span>
            </button>
        `}function u(t,e,n,o,i=""){return`
            <button type="button" class="apk-sheet-card apk-sheet-card--action${i?` ${i}`:""}" data-apk-action="${a(t)}">
                <i class="${a(o)}"></i>
                <strong>${a(e)}</strong>
                <span>${a(n)}</span>
            </button>
        `}function G(t,e){const n=w(),o=t.id===e;return`
            <button type="button" class="apk-switch-row${o?" is-active":""}" data-apk-module="${a(t.id)}">
                <span class="apk-switch-row-copy">
                    <strong>${a(t.text||t.id)}</strong>
                    <span>${a(t.hint||t.categoryTitle||"跨分类快速直达")}</span>
                </span>
                <span class="apk-switch-row-meta">${o?n.current:n.open}</span>
            </button>
        `}function Mt(t,e){const n=String(t.text||t.id||"").trim().slice(0,2)||"模块";return`
            <button type="button" class="apk-library-mini${t.id===e?" is-active":""}" data-apk-module="${a(t.id)}">
                <span class="apk-library-mini-badge">${a(n)}</span>
                <span class="apk-library-mini-copy">
                    <strong>${a(t.text||t.id)}</strong>
                    <span>${a(t.hint||t.categoryTitle||"模块")}</span>
                </span>
            </button>
        `}function Jt(t,e){return`
            <article class="apk-library-card" style="--apk-library-accent:${a(t.color||"#2563eb")}">
                <div class="apk-library-card-head">
                    <div>
                        <strong>${a(t.title)}</strong>
                        <span>${a(`${t.items.length} 个模块`)}</span>
                    </div>
                    <span class="apk-library-card-count">${a(String(t.items.length).padStart(2,"0"))}</span>
                </div>
                <div class="apk-library-mini-grid">
                    ${t.items.slice(0,4).map(n=>Mt({...n,categoryTitle:t.title},e)).join("")}
                </div>
            </article>
        `}function Zt(){var S;const t=w(),e=m(),n=String(g||"").trim(),o=Xt(),i=D(),s=O([...Y(6),q()]).slice(0,6),r=new Set(s.map(y=>y.id)),d=z(6+r.size).filter(y=>!r.has(y.id)).slice(0,6),f=_();return`
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
                <input type="search" data-apk-library-search value="${a(n)}" placeholder="${a(t.appLibrarySearch)}" autocomplete="off" />
            </label>
            ${n?`
                    <section class="apk-library-section">
                        ${T(t.appLibrarySearchTitle,t.appLibrarySearchNote)}
                        ${o.length?`<div class="apk-sheet-grid apk-library-results">${o.map(y=>E(y,e)).join("")}</div>`:`<div class="apk-sheet-empty">${a(t.appLibrarySearchEmpty)}</div>`}
                    </section>
                `:`
                    <section class="apk-library-section">
                        ${T(t.recentModulesTitle,t.recentModulesNote)}
                        ${s.length?`<div class="apk-switch-list">${s.map(y=>G(y,e)).join("")}</div>`:`<div class="apk-sheet-empty">${a(t.noRecent)}</div>`}
                    </section>
                    ${d.length?`
                            <section class="apk-library-section">
                                ${T(t.suggestedTitle,t.suggestedNote)}
                                <div class="apk-sheet-grid apk-library-results">
                                    ${d.map(y=>E(y,e)).join("")}
                                </div>
                            </section>
                        `:""}
                    ${(S=i==null?void 0:i.items)!=null&&S.length?`
                            <section class="apk-library-section">
                                ${T(t.appLibraryCurrentTitle,t.appLibraryCurrentNote)}
                                <article class="apk-library-spotlight" style="--apk-library-accent:${a(i.color||"#2563eb")}">
                                    <div class="apk-library-card-head">
                                        <div>
                                            <strong>${a(i.title)}</strong>
                                            <span>${a(`${i.items.length} 个模块`)}</span>
                                        </div>
                                        <span class="apk-library-card-count">${a(String(i.items.length).padStart(2,"0"))}</span>
                                    </div>
                                    <div class="apk-library-mini-grid">
                                        ${i.items.slice(0,4).map(y=>Mt({...y,categoryTitle:i.title},e)).join("")}
                                    </div>
                                </article>
                            </section>
                        `:""}
                    <section class="apk-library-section">
                        ${T(t.appLibraryAllTitle,t.appLibraryAllNote)}
                        <div class="apk-library-clusters">
                            ${f.map(y=>Jt(y,e)).join("")}
                        </div>
                    </section>
                `}
        `}function P(){let t=document.getElementById("apk-mobile-shell");if(t)return t;const e=w();return t=document.createElement("div"),t.id="apk-mobile-shell",t.setAttribute("aria-hidden","true"),t.innerHTML=`
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
        `,t.addEventListener("click",pt),t.addEventListener("input",ne),document.body.appendChild(t),t}function nt(){const t=w(),e=_(),n=m();return e.length?[k(t.moduleOverviewTitle,t.moduleOverviewCopy),...e.map(o=>`
                <section class="apk-sheet-section">
                    ${T(o.title,o.eyebrow||t.workspaceNote)}
                    <div class="apk-sheet-grid">
                        ${o.items.map(i=>E({...i,categoryTitle:o.title},n)).join("")}
                    </div>
                </section>
            `)].join(""):`${k(t.moduleOverviewTitle,t.noModules)}
                <div class="apk-sheet-empty">${a(t.noModules)}</div>`}function ot(){const t=w(),e=m(),n=O([...Y(F),q()]).slice(0,4),o=new Set(n.map(r=>r.id)),i=z(x+o.size).filter(r=>!o.has(r.id)).slice(0,x),s=[u("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand"),u("search",t.searchTitle,t.searchCopy,"ti ti-search"),u("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2"),typeof window.openUserPasswordModal=="function"?u("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):"",u("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")].filter(Boolean);return`
            ${k(t.quickTitle,t.quickCopy)}
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
                ${T(t.recentModulesTitle,t.recentModulesNote)}
                ${n.length?`<div class="apk-switch-list">${n.map(r=>G(r,e)).join("")}</div>`:`<div class="apk-sheet-empty">${a(t.noRecent)}</div>`}
            </section>
            ${i.length?`
                    <section class="apk-sheet-section">
                        ${T(t.suggestedTitle,t.suggestedNote)}
                        <div class="apk-sheet-grid">
                            ${i.map(r=>E(r,e)).join("")}
                        </div>
                    </section>
                `:""}
            <section class="apk-sheet-section">
                ${T(t.utilitiesTitle,t.utilitiesNote)}
                <div class="apk-sheet-grid">
                    ${s.join("")}
                </div>
            </section>
        `}function at(){const t=w(),e=C();return`
            ${k(t.accountTitle,t.accountCopy)}
            <section class="apk-sheet-section">
                <div class="apk-account-card">
                    <div class="apk-account-name">${a((e==null?void 0:e.name)||t.notLoggedIn)}</div>
                    <div class="apk-account-role">${a(Q())}</div>
                    <div class="apk-account-grid">
                        <div class="apk-account-row">
                            <span>${a(t.currentSchool)}</span>
                            <strong>${a(K()||t.unknownSchool)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${a(t.currentCohort)}</span>
                            <strong>${a(H())}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${a(t.themeMode)}</span>
                            <strong>${a(`${t.followSystem} · ${zt()}`)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${a(t.runtimeEnv)}</span>
                            <strong>${a(W?"Android APK":t.mobileBrowser)}</strong>
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
        `}function it(){var o;const t=w(),e=wt(),n=((o=document.getElementById("cohort-selector"))==null?void 0:o.value)||"";return e.length?`
            ${k(t.switchCohortTitle,t.switchCohortCopy)}
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${e.map(i=>`
                        <button type="button" class="apk-sheet-card${i.value===n?" is-active":""}" data-apk-cohort="${a(i.value)}">
                            <strong>${a(i.label)}</strong>
                            <span>${a(i.value===n?t.usingCurrentCohort:t.switchToThisCohort)}</span>
                        </button>
                    `).join("")}
                </div>
            </section>
        `:`${k(t.switchCohortTitle,t.noCohortChoices)}
                <div class="apk-sheet-empty">${a(t.noCohorts)}</div>`}function te(t){const e=t.querySelector("[data-apk-library-panel]");e&&(e.innerHTML=h?Zt():"")}function st(){const e=P().querySelector("[data-apk-sheet-panel]");if(e){if(!c){e.innerHTML="";return}if(c==="modules"){e.innerHTML=nt();return}if(c==="quick"){e.innerHTML=ot();return}if(c==="account"){e.innerHTML=at();return}c==="cohorts"&&(e.innerHTML=it())}}function rt(t){var s;const e=w(),n=t.querySelector("[data-apk-rail]");if(!n)return;const o=D(),i=m();if(!((s=o==null?void 0:o.items)!=null&&s.length)){n.innerHTML=`<div class="apk-rail-empty">${a(e.currentCategoryEmpty)}</div>`;return}n.innerHTML=o.items.map(r=>`
            <button type="button" class="apk-rail-chip${r.id===i?" is-active":""}" data-apk-module="${a(r.id)}">
                ${a(r.text||r.id)}
            </button>
        `).join(""),window.requestAnimationFrame(()=>$t(t))}function ct(t){const e=m(),n=L();t.querySelectorAll(".apk-shell-tab").forEach(o=>{const i=o.getAttribute("data-apk-tab"),s=!h&&(i==="home"&&!c&&e===n||i==="modules"&&c==="modules"||i==="quick"&&c==="quick"||i==="account"&&c==="account");o.classList.toggle("is-active",s)})}function I(){const t=w(),e=P(),n=q(),o=D(),i=[K()||t.unknownSchool,(o==null?void 0:o.title)||t.workbench,H()].filter(Boolean).join(" · ");e.style.setProperty("--apk-accent",(n==null?void 0:n.categoryColor)||(o==null?void 0:o.color)||"#2563eb"),e.setAttribute("aria-hidden","false"),e.dataset.sheetOpen=c?"true":"false",e.dataset.sheetMode=c||"",e.dataset.libraryOpen=h?"true":"false";const s={role:`${Q()}工作台`,title:(n==null?void 0:n.text)||"智慧教务",subtitle:i,cohort:H(),mode:t.workbench};Object.entries(s).forEach(([r,d])=>{const f=e.querySelector(`[data-apk-field="${r}"]`);f&&(f.textContent=d)}),vt(e),rt(e),st(),te(e),ct(e)}function ee(t,e={}){h=!!t,h&&(c=""),!h&&e.resetQuery!==!1&&(g=""),I()}function N(t){ee(typeof t=="boolean"?t:!h)}function p(t=""){c=t,t&&(h=!1,g=""),I()}function b(t){p(c===t?"":t)}function B(t){!t||typeof window.switchTab!="function"||(c="",h=!1,g="",I(),Z(),window.switchTab(t),kt(t),t==="student-details"&&St(),A.forEach(e=>{window.setTimeout(()=>{var n;(n=document.getElementById(t))!=null&&n.classList.contains("active")&&(et(),t==="student-details"&&typeof window.requestStudentDetailsPrimaryFocus=="function"&&window.requestStudentDetailsPrimaryFocus()),l()},e)}))}function lt(){h=!1,g="",p(""),typeof window.openSpotlight=="function"&&window.openSpotlight()}function ut(){h=!1,g="",p(""),typeof window.openUserPasswordModal=="function"&&window.openUserPasswordModal()}function dt(t){if(t==="home"){B(L());return}if(t==="modules"){b("modules");return}if(t==="quick"){b("quick");return}t==="account"&&b("account")}function ne(t){const e=t.target.closest("[data-apk-library-search]");if(!e)return;const n=typeof e.selectionStart=="number"?e.selectionStart:String(e.value||"").length;if(g=String(e.value||""),I(),!h)return;const o=document.querySelector("[data-apk-library-search]");o&&(typeof o.focus=="function"&&o.focus({preventScroll:!0}),typeof o.setSelectionRange=="function"&&o.setSelectionRange(n,n))}function pt(t){const e=t.target.closest("[data-apk-action], [data-apk-module], [data-apk-cohort], [data-apk-tab]");if(!e)return;t.preventDefault();const n=e.getAttribute("data-apk-module");if(n){B(n);return}const o=e.getAttribute("data-apk-cohort");if(o){Tt(o);return}const i=e.getAttribute("data-apk-tab");if(i){dt(i);return}const s=e.getAttribute("data-apk-action");if(s==="close-sheet"){p("");return}if(s==="library"){N();return}if(s==="close-library"){N(!1);return}if(s==="modules"){b("modules");return}if(s==="quick"){b("quick");return}if(s==="account"){b("account");return}if(s==="cohorts"){b("cohorts");return}if(s==="search"){lt();return}if(s==="password"){ut();return}s==="logout"&&window.Auth&&typeof window.Auth.logout=="function"&&(h=!1,g="",p(""),window.Auth.logout())}function oe(t){var n;if(!$()||!J()||X()||gt())return;const e=(n=t.touches)==null?void 0:n[0];e&&(v={startX:e.clientX,startY:e.clientY,canOpenLibrary:!h&&!c&&e.clientX<=28,canCloseLibrary:h})}function ae(t){var i;if(!v)return;const e=(i=t.touches)==null?void 0:i[0];if(!e)return;const n=e.clientX-v.startX,o=e.clientY-v.startY;if(Math.abs(o)>42){v=null;return}if(v.canOpenLibrary&&n>=80){N(!0),v=null;return}v.canCloseLibrary&&n<=-80&&(N(!1),v=null)}function Lt(){v=null}function U(t,e,n){if(!t||typeof t[e]!="function"||t[e][n])return;const o=t[e],i=function(){const s=o.apply(this,arguments);return l(),A.forEach(r=>{window.setTimeout(l,r)}),s};i[n]=!0,t[e]=i}function ie(){if(window.Swal&&(U(window.Swal,"close","__apkMobileWrapped__"),typeof window.Swal.fire=="function"&&!window.Swal.fire.__apkMobileWrapped__)){const t=window.Swal.fire,e=function(){const n=t.apply(window.Swal,arguments);return l(),A.forEach(o=>{window.setTimeout(l,o)}),n&&typeof n.finally=="function"&&n.finally(()=>{A.forEach(o=>{window.setTimeout(l,o)})}),n};e.__apkMobileWrapped__=!0,window.Swal.fire=e}}function se(){U(window,"switchTab","__apkMobileWrapped__"),U(window,"renderNavigation","__apkMobileWrapped__"),U(window,"switchNavCategory","__apkMobileWrapped__"),window.Auth&&(U(window.Auth,"applyRoleView","__apkMobileWrapped__"),U(window.Auth,"renderParentView","__apkMobileWrapped__")),ie()}function re(){se(),Yt();const t=$(),e=t&&J()&&!X();document.body.dataset.mobileQuery=t?"true":"false",e?document.body.dataset.mobileArchitecture="apk-v2":delete document.body.dataset.mobileArchitecture,Qt(),Wt();const n=P();if(n.style.display=e?"block":"none",n.setAttribute("aria-hidden",e?"false":"true"),!e){c="",h=!1,g="",n.dataset.sheetOpen="false",n.dataset.sheetMode="",n.dataset.libraryOpen="false",n.dataset.modalOpen="false";return}et(),I()}function l(){clearTimeout(bt),bt=window.setTimeout(re,60)}const Et={switchTab(t){const e={home:L(),students:"student-details",analysis:"summary"};if(t==="me"){p("account");return}const n=e[t]||t;B(n)},renderStudentList(){l()},showStudentDetail(){l()},renderAnalysis(){l()},openModules(){p("modules")},openLibrary(){N(!0)},openQuickActions(){p("quick")},openAccountSheet(){p("account")},openCohortSheet(){p("cohorts")},refresh:l};window.MobMgr=Et,window.MobileQueryUI={refresh:l,openLibrary:()=>N(!0),openModules:()=>p("modules"),openQuick:()=>p("quick"),openAccount:()=>p("account"),openCohorts:()=>p("cohorts")},window.switchMobileTab=t=>Et.switchTab(t),window.matchMedia&&(M=window.matchMedia("(prefers-color-scheme: dark)"),typeof M.addEventListener=="function"?M.addEventListener("change",l):typeof M.addListener=="function"&&M.addListener(l)),window.addEventListener("cloud-load-state",l),window.addEventListener("resize",l),window.addEventListener("orientationchange",l),window.addEventListener("load",l),window.addEventListener("pageshow",l),window.addEventListener("focus",l),document.addEventListener("touchstart",oe,{passive:!0}),document.addEventListener("touchmove",ae,{passive:!0}),document.addEventListener("touchend",Lt,{passive:!0}),document.addEventListener("touchcancel",Lt,{passive:!0}),document.addEventListener("resume",l,!1),document.addEventListener("visibilitychange",()=>{document.hidden||l()}),A.forEach(t=>{window.setTimeout(l,t)}),l(),window.__MOBILE_MANAGER_PATCHED__=!0,window.__MOBILE_APP_RUNTIME_PATCHED__=!0})();
