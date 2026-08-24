(()=>{if(typeof window=="undefined"||window.__MOBILE_APP_RUNTIME_PATCHED__)return;const Ct=960,_=[80,260,900],Tt=[140,420,980,1600],_t={admin:"starter-hub",director:"starter-hub",grade_director:"teacher-analysis",class_teacher:"student-details",teacher:"teacher-analysis"},Lt=["student-details","summary","teacher-analysis","report-generator","progress-analysis","analysis"],Mt={admin:["upload","summary","data-manager","report-generator","teacher-analysis","cohort-growth"],director:["summary","county-analysis","teacher-analysis","report-generator","progress-analysis","cohort-growth"],grade_director:["teacher-analysis","summary","progress-analysis","student-overview","cohort-growth","report-generator"],class_teacher:["student-details","student-overview","progress-analysis","marginal-push","report-generator","summary"],teacher:["teacher-analysis","student-details","student-overview","summary","report-generator","progress-analysis"]},ot="apk-recent-modules-v1",D=8,j=6,xt={admin:"管理员",director:"校级管理",grade_director:"级部主任",class_teacher:"班主任",teacher:"教师",parent:"家长",student:"学生",guest:"访客"},at=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform=="function"&&window.Capacitor.isNativePlatform()||typeof window.Capacitor.getPlatform=="function"&&window.Capacitor.getPlatform()!=="web"));let it=0,d="",u=!1,y="",w=null,v=null,nt=null,F="",V=null,L=new Map;function n(t){const e=window.SchoolRuntime&&typeof window.SchoolRuntime.escapeHtml=="function"?window.SchoolRuntime.escapeHtml:null;return e?e(t):String(t!=null?t:"").replace(/[&<>"']/g,o=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[o])}function $t(t,e){if(!t)return!1;const o=String(e!=null?e:"");return t.textContent===o?!1:(t.textContent=o,!0)}function S(t,e){if(!t)return!1;const o=String(e!=null?e:"");return t.__apkLastHtml===o?!1:(t.innerHTML=o,t.__apkLastHtml=o,!0)}function W(t,e,o){if(!(t!=null&&t.dataset))return!1;const a=String(o!=null?o:"");return t.dataset[e]===a?!1:(t.dataset[e]=a,!0)}function At(t,e,o){if(!(t!=null&&t.style))return!1;const a=String(o!=null?o:"");return t.style.getPropertyValue(e)===a?!1:(t.style.setProperty(e,a),!0)}function Rt(t,e,o){if(!(t!=null&&t.classList))return!1;const a=!!o;return t.classList.contains(e)===a?!1:(t.classList.toggle(e,a),!0)}function rt(){var e,o,a;const t=[Number(window.innerWidth||0),Number(((e=document.documentElement)==null?void 0:e.clientWidth)||0),Number(window.outerWidth||0),Number(((o=window.screen)==null?void 0:o.width)||0),Number(((a=window.screen)==null?void 0:a.availWidth)||0)].filter(i=>Number.isFinite(i)&&i>0);return t.length?Math.min(...t):0}function b(){return rt()<=Ct}function st(){return window.matchMedia?window.matchMedia("(max-width: 900px)").matches:rt()<=900}function K(t=document){document.documentElement.classList.toggle("is-compact-viewport",st()),(t&&typeof t.querySelectorAll=="function"?t:document).querySelectorAll(".analysis-table-shell, .table-wrap").forEach(o=>{o.dataset.mobileHint||(o.dataset.mobileHint="可横向滑动查看完整表格")})}function lt(){K(document)}function It(t){var a;const e=(a=t==null?void 0:t.querySelector)==null?void 0:a.call(t,"[data-apk-rail]");if(!e)return;const o=e.querySelector(".apk-rail-chip.is-active");!o||typeof o.scrollIntoView!="function"||o.scrollIntoView({inline:"center",block:"nearest",behavior:"auto"})}function M(){return window.AuthState&&typeof window.AuthState.getCurrentUser=="function"?window.AuthState.getCurrentUser():window.Auth&&window.Auth.currentUser?window.Auth.currentUser:null}function q(){var t,e,o;return window.AuthState&&typeof window.AuthState.getCurrentRole=="function"?window.AuthState.getCurrentRole():String(((t=M())==null?void 0:t.role)||((o=(e=document.body)==null?void 0:e.dataset)==null?void 0:o.role)||"guest").trim()||"guest"}function ct(){if(window.AuthState&&typeof window.AuthState.getCurrentRoles=="function")return window.AuthState.getCurrentRoles();const t=M();return(Array.isArray(t==null?void 0:t.roles)&&t.roles.length?t.roles:[t==null?void 0:t.role].filter(Boolean)).map(o=>String(o||"").trim()).filter(Boolean)}function xe(t){const e=new Set(ct());return t.some(o=>e.has(o))}function Q(t=q()){const e=String(t||"").trim();return e==="parent"||e==="student"}function dt(t=q()){return xt[String(t||"").trim()]||String(t||"访客")}function ut(){var t,e;return window.SchoolState&&typeof window.SchoolState.getCurrentSchool=="function"?String(((t=M())==null?void 0:t.school)||window.SchoolState.getCurrentSchool()||"").trim():String(((e=M())==null?void 0:e.school)||window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||"").trim()}function z(){const t=document.getElementById("login-overlay"),e=!!(t&&getComputedStyle(t).display!=="none");return!!M()&&!e}function Ot(){if(window.NAV_STRUCTURE)return window.NAV_STRUCTURE;try{return NAV_STRUCTURE}catch(t){return null}}function qt(){F="",V=null,L=new Map}function Nt(t,e){const o=ct().join("|"),a=t?Object.keys(t).join("|"):"",i=window.CONFIG&&window.CONFIG.showQuery?"report:1":"report:0";return[e,o,a,i].join("::")}function Bt(t){return!(typeof window.canAccessModule=="function"&&!window.canAccessModule(t)||t==="indicator"&&typeof window.isIndicatorModuleVisible=="function"&&!window.isIndicatorModuleVisible()||t==="report-generator"&&typeof window.CONFIG!="undefined"&&window.CONFIG&&!window.CONFIG.showQuery)}function x(){const t=Ot();if(!t)return[];const e=q(),o=Nt(t,e);if(V&&F===o)return V;const a=Object.keys(t).map(i=>{const r=t[i];return{...r,key:i,items:Array.isArray(r==null?void 0:r.items)?r.items.filter(s=>Bt(s.id)):[]}}).filter(i=>i.items.length>0);return F=o,V=a,L=new Map,a}function E(t){if(!t)return null;if(L.has(t))return L.get(t);const e=x();for(const o of e){const a=o.items.find(i=>i.id===t);if(a){const i={...a,categoryKey:o.key,categoryTitle:o.title,categoryColor:o.color};return L.set(t,i),i}}return L.set(t,null),null}function $(){var o,a,i;const t=_t[q()]||"starter-hub",e=E(t);return e?e.id:((i=(a=(o=x()[0])==null?void 0:o.items)==null?void 0:a[0])==null?void 0:i.id)||"starter-hub"}function A(){var t;return((t=document.querySelector(".section.active"))==null?void 0:t.id)||$()}function N(){return E(A())||E($())||null}function Y(){const t=x(),e=N();if(e){const a=t.find(i=>i.key===e.categoryKey);if(a)return a}const o=typeof window.getCurrentNavCategory=="function"?String(window.getCurrentNavCategory()||"").trim():"";return t.find(a=>a.key===o)||t[0]||null}function B(t){const e=new Set;return t.filter(o=>!o||!o.id||e.has(o.id)?!1:(e.add(o.id),!0))}function pt(){try{const t=JSON.parse(localStorage.getItem(ot)||"[]");return Array.isArray(t)?t.map(e=>String(e||"").trim()).filter(Boolean):[]}catch(t){return[]}}function Pt(t){try{localStorage.setItem(ot,JSON.stringify(t.map(e=>String(e||"").trim()).filter(Boolean).slice(0,D)))}catch(e){}}function Ht(t){const e=E(t);e&&Pt([e.id,...pt().filter(o=>o!==e.id)])}function G(t=D){return B(pt().map(e=>E(e)).filter(Boolean)).slice(0,t)}function ht(t=j){const e=Mt[q()]||[],o=[...G(t),N(),E($()),...e.map(a=>E(a)),...Lt.map(a=>E(a))];return B(o).slice(0,t)}function $e(){var o;const t=document.getElementById("mode-badge"),e=String((t==null?void 0:t.textContent)||"").trim();return e||String(((o=window.CONFIG)==null?void 0:o.name)||"学校工作台").trim()}function X(){var e;const t=document.getElementById("cohort-selector");return(e=t==null?void 0:t.selectedOptions)!=null&&e[0]&&String(t.selectedOptions[0].textContent||t.value||"届别未选择").trim()||"届别未选择"}function Vt(){const t=document.getElementById("cohort-selector");return t?Array.from(t.options||[]).filter(e=>String(e.value||"").trim()).map(e=>({value:String(e.value||"").trim(),label:String(e.textContent||e.value||"").trim()})):[]}function Ut(){return document.querySelector("main.app-main")}function bt(){const t=Ut();if(t&&typeof t.scrollTo=="function"){t.scrollTo({top:0,behavior:"auto"});return}const e=document.scrollingElement||document.documentElement||document.body;if(e&&typeof e.scrollTo=="function"){e.scrollTo({top:0,behavior:"auto"});return}typeof window.scrollTo=="function"&&window.scrollTo({top:0,behavior:"auto"})}function Dt(t=document){if(!b())return;t.querySelectorAll(".table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable").forEach(o=>{const a=jt(o);a.length&&(o.classList.add("mobile-card-table"),Array.from(o.querySelectorAll("tbody tr")).forEach(i=>{let r=String(i.getAttribute("data-mobile-card-title")||"").trim();Array.from(i.children).forEach((s,c)=>{if(!(s instanceof HTMLElement)||s.hasAttribute("colspan"))return;const m=String(a[c]||`字段${c+1}`).replace(/\s+/g," ").trim(),T=String(s.textContent||"").replace(/\s+/g," ").trim();!r&&T&&c<=1&&(r=T),s.setAttribute("data-label",m)}),r&&i.setAttribute("data-mobile-card-title",r)}))})}function jt(t){const e=Array.from(t.querySelectorAll("thead tr"));if(!e.length)return[];const o=[];let a=0;return e.forEach((i,r)=>{o[r]||(o[r]=[]);let s=0;Array.from(i.children).forEach(c=>{for(;o[r][s];)s+=1;const m=Math.max(parseInt(c.getAttribute("colspan")||"1",10)||1,1),T=Math.max(parseInt(c.getAttribute("rowspan")||"1",10)||1,1),h=String(c.textContent||"").replace(/\s+/g," ").trim();for(let H=0;H<T;H+=1){o[r+H]||(o[r+H]=[]);for(let et=0;et<m;et+=1)o[r+H][s+et]=h}s+=m,s>a&&(a=s)})}),Array.from({length:a},(i,r)=>{const s=[];return o.forEach(c=>{const m=String((c==null?void 0:c[r])||"").trim();!m||s[s.length-1]===m||s.push(m)}),s.join(" / ")})}function J(t=document){if(!b())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;Dt(e)}function ft(t=document){if(!b())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;clearTimeout(window.__RESPONSIVE_TABLE_REFRESH_TIMER__||0),window.__RESPONSIVE_TABLE_REFRESH_TIMER__=window.setTimeout(()=>{J(e)},60)}function Ft(t=document.querySelector(".section.active")||document.getElementById("app")||document.body){if(typeof MutationObserver!="function")return;const e=t instanceof HTMLElement?t:document.querySelector(".section.active")||document.getElementById("app")||document.body||document.documentElement;if(!e||window.__RESPONSIVE_TABLE_OBSERVER__&&nt===e)return;window.__RESPONSIVE_TABLE_OBSERVER__&&typeof window.__RESPONSIVE_TABLE_OBSERVER__.disconnect=="function"&&window.__RESPONSIVE_TABLE_OBSERVER__.disconnect();const o=new MutationObserver(a=>{if(!b())return;a.some(r=>Array.from(r.addedNodes||[]).some(s=>{var c;return s instanceof HTMLElement?s.matches("table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table, .section, #parent-view-container")||!!((c=s.querySelector)!=null&&c.call(s,"table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table")):!1}))&&ft(e)});o.observe(e,{childList:!0,subtree:!0}),window.__RESPONSIVE_TABLE_OBSERVER__=o,nt=e}window.refreshResponsiveMobileTables=J;function Wt(t=document){b()&&(t.querySelectorAll('.section [style*="grid-template-columns"]').forEach(e=>{e.closest("#parent-view-container")||e.classList.add("mobile-stack-grid")}),t.querySelectorAll('.section [style*="display:flex"]').forEach(e=>{e.closest("#parent-view-container")||e.closest("#apk-mobile-shell")||e.children.length<2||e.classList.add("mobile-wrap-row")}))}function Kt(t=document){if(!b())return;t.querySelectorAll(".table-wrap").forEach(o=>{if(o.__scrollListenerAttached__)return;const a=()=>{const i=o.scrollLeft+o.clientWidth>=o.scrollWidth-2;o.classList.toggle("scrolled-end",i)};o.addEventListener("scroll",a,{passive:!0}),o.__scrollListenerAttached__=!0,a()})}function Qt(){if(document.getElementById("mobile-experience-styles"))return;const t=document.createElement("style");t.id="mobile-experience-styles",t.textContent=`
            @media screen and (max-width: 960px) {
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell {
                    position: fixed;
                    inset: 0;
                    z-index: 15000;
                    pointer-events: none;
                }
                body[data-mobile-architecture="apk-v2"] {
                    overflow: hidden;
                    overscroll-behavior-y: contain;
                    touch-action: manipulation;
                }
                body[data-mobile-architecture="apk-v2"] #app {
                    max-width: 100vw;
                    overflow: hidden;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-sheet {
                    position: absolute;
                    left: 0;
                    right: 0;
                    top: calc(var(--app-safe-top, 0px) + 136px);
                    bottom: calc(var(--app-safe-bottom, 0px) + 70px);
                    opacity: 1;
                    visibility: visible;
                    transform: none;
                    pointer-events: auto;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior-y: contain;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-sheet main.app-main {
                    width: 100%;
                    max-width: 100vw;
                    min-height: 100%;
                    padding: 16px 10px 20px !important;
                    margin: 0 !important;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                }
                body[data-mobile-architecture="apk-v2"] main.app-main > .section.active {
                    width: 100% !important;
                    max-width: none !important;
                    min-width: 0 !important;
                    margin: 0 !important;
                    padding: 0 !important;
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
                    border-radius: 16px !important;
                }
                body[data-mobile-architecture="apk-v2"] .table-wrap {
                    position: relative;
                    width: 100%;
                    max-width: 100%;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior-x: contain;
                }
                body[data-mobile-architecture="apk-v2"] .table-wrap::after {
                    content: '';
                    position: absolute;
                    top: 0;
                    right: 0;
                    bottom: 0;
                    width: 40px;
                    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95));
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s;
                }
                body[data-mobile-architecture="apk-v2"] .table-wrap:not(.scrolled-end)::after {
                    opacity: 1;
                }
                body.dark-mode[data-mobile-architecture="apk-v2"] .table-wrap::after {
                    background: linear-gradient(90deg, transparent, rgba(15, 23, 42, 0.95));
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
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-topbar {
                    height: 64px;
                    padding: 10px 12px;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-meta {
                    height: 40px;
                    padding: 0 12px 8px;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-rail {
                    min-height: 44px;
                    padding: 0 12px 8px;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-tabs {
                    height: 62px;
                    padding: 8px 12px calc(var(--app-safe-bottom, 0px) + 8px);
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-title,
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-subtitle,
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-rail-chip {
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
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
        `,document.head.appendChild(t)}function mt(){const t=document.querySelector(".section.active")||document;Qt(),K(t),J(t),ft(t),Ft(t),Wt(t),Kt(t)}function zt(t){if(!(t instanceof HTMLElement))return!1;const e=window.getComputedStyle(t);return e.display==="none"||e.visibility==="hidden"||Number(e.opacity||1)===0||t.getAttribute("aria-hidden")==="true"||t.hidden?!1:t.getClientRects().length>0}function yt(){if(wt(),window.Swal&&typeof window.Swal.isVisible=="function"&&window.Swal.isVisible())return!0;const t=[".swal2-container",".modal",'[role="dialog"]','[aria-modal="true"]',".dialog-overlay",".dialog-backdrop"];return Array.from(document.querySelectorAll(t.join(","))).some(e=>{if(!(e instanceof HTMLElement)||e.closest("#apk-mobile-shell")||!zt(e))return!1;const o=window.getComputedStyle(e),a=Number(o.zIndex||0);return o.position==="fixed"||a>=1e3})}function wt(){const t=document.querySelector(".swal2-container.swal2-backdrop-show");if(!b()||!t||t.querySelector("input,textarea,select,.swal2-cancel,.swal2-deny")||t.querySelector(".swal2-icon-error,.swal2-icon-warning,.swal2-icon-question"))return!1;const e=String(t.innerText||"");return["安全","警告","失败","错误","确认","请确认","未完成","必须","需要完成","删除","覆盖","退出","清空","重置","取消","放弃","丢失","不可恢复","永久","移除","注销"].some(a=>e.includes(a))?!1:(window.Swal&&typeof window.Swal.close=="function"?window.Swal.close():t.remove(),!0)}function Yt(t=document.getElementById("apk-mobile-shell")){t&&(t.dataset.modalOpen=yt()?"true":"false")}function Gt(){Tt.forEach((t,e)=>{window.setTimeout(()=>{const o=document.getElementById("student-details");if(!(!o||!o.classList.contains("active"))){if(typeof window.requestStudentDetailsPrimaryFocus=="function"){window.requestStudentDetailsPrimaryFocus(e);return}typeof window.focusStudentDetailsPrimaryFlow=="function"&&window.focusStudentDetailsPrimaryFlow()}},t)})}function Xt(){["mobile-manager-app","mobile-query-shell"].forEach(t=>{const e=document.getElementById(t);e&&(e.setAttribute("aria-hidden","true"),e.style.display="none")})}function Jt(){const t=document.getElementById("app");if(t){if(!b()){t.classList.remove("hidden"),t.style.display="";return}if(!z()){t.classList.add("hidden"),t.style.display="none";return}Q()||(t.classList.remove("hidden"),t.style.display="")}}function Zt(){const t=document.querySelector('meta[name="theme-color"]');t&&t.setAttribute("content",document.body.classList.contains("dark-mode")?"#08111d":"#eef3f8")}function te(){const t=!!(v!=null&&v.matches);document.body.dataset.nativeApp=at?"true":"false",document.body.dataset.systemTheme=t?"dark":"light",at&&b()&&(document.body.classList.toggle("dark-mode",t),localStorage.setItem("theme-dark",t?"true":"false")),document.documentElement.style.colorScheme=document.body.classList.contains("dark-mode")?"dark":"light",Zt()}function ee(t){const e=document.getElementById("cohort-selector");!e||!t||(e.value=t,e.dispatchEvent(new Event("change",{bubbles:!0})),p(""),_.forEach(o=>{window.setTimeout(()=>{bt(),l()},o)}))}function f(){return{workbench:"学校工作台",mobileWorkbench:"移动工作台",mobilePreparing:"移动工作台正在准备中",openLibrary:"打开模块资源库",openSearch:"打开全局搜索",closeSheet:"关闭面板",closeLibrary:"关闭模块资源库",cohortPlaceholder:"届别未选择",home:"工作台",modules:"模块",recent:"最近",account:"我的",openModule:"打开该模块",currentCategoryEmpty:"当前分类暂无可用模块",current:"当前",open:"打开",workspaceNote:"Workspace",moduleOverviewTitle:"模块总览",moduleOverviewCopy:"按分类切换工作模块，减少手机端来回翻找入口的次数。",noModules:"当前账号还没有可切换的模块入口。",quickTitle:"最近与常用",quickCopy:"先给你最近用过的模块，再补高频入口，减少反复进出分类面板。",quickHeroTitle:"跨分类切换先看这里",quickHeroCopy:"默认优先展示最近使用，同时保留完整模块资源库入口。",recentModulesTitle:"最近使用",recentModulesNote:"Recent Modules",suggestedTitle:"高频推荐",suggestedNote:"Suggested",utilitiesTitle:"系统动作",utilitiesNote:"Utilities",noRecent:"还没有可回跳的最近模块，可以先从当前分类或全部模块进入。",appLibraryTitle:"模块资源库",appLibraryCopy:"像 App 资源库一样集中浏览全部模块，支持最近使用、当前分类和快速搜索。",appLibrarySearch:"搜索模块、功能或分类",appLibrarySearchTitle:"搜索结果",appLibrarySearchNote:"Results",appLibrarySearchEmpty:"没有匹配的模块，试试更短的关键词。",appLibraryCurrentTitle:"当前分类",appLibraryCurrentNote:"Now Browsing",appLibraryAllTitle:"全部分类",appLibraryAllNote:"App Library",allModulesTitle:"全部模块",allModulesCopy:"找不到所需功能时，直接打开完整模块总览。",searchTitle:"全局搜索",searchCopy:"快速搜索学生、模块和常用入口。",cohortsTitle:"切换届别",cohortsCopy:"在不同届别工作区之间快速跳转。",passwordTitle:"修改密码",passwordCopy:"直接打开当前账号的密码修改入口。",logoutTitle:"退出登录",logoutCopy:"返回登录页，重新选择账号进入。",accountTitle:"账号与设置",accountCopy:"APK 默认跟随系统主题，并把常用设置集中到这一层。",currentSchool:"当前学校",currentCohort:"当前届别",themeMode:"主题模式",themeDark:"深色",themeLight:"浅色",followSystem:"跟随系统",runtimeEnv:"运行环境",mobileBrowser:"移动浏览器",notLoggedIn:"未登录",unknownSchool:"未识别学校",switchCohortTitle:"切换届别",switchCohortCopy:"统一从这里切届别，避免手机端入口与工作区状态脱节。",noCohorts:"暂无可切换届别。",noCohortChoices:"当前没有可切换的届别，请先完成数据恢复。",usingCurrentCohort:"当前正在使用的届别。",switchToThisCohort:"点击切换到这个届别。"}}function oe(){return document.body.dataset.systemTheme==="dark"?f().themeDark:f().themeLight}function ae(t,e=null){return[t==null?void 0:t.text,t==null?void 0:t.hint,t==null?void 0:t.id,e==null?void 0:e.title,e==null?void 0:e.eyebrow].filter(Boolean).join(" ").toLowerCase()}function ie(){const t=String(y||"").trim().toLowerCase();return t?B(x().flatMap(e=>e.items.filter(o=>ae(o,e).includes(t)).map(o=>({...o,categoryTitle:e.title,categoryKey:e.key,categoryColor:e.color})))):[]}function R(t,e){return`
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
        `}function g(t,e,o,a,i=""){return`
            <button type="button" class="apk-sheet-card apk-sheet-card--action${i?` ${i}`:""}" data-apk-action="${n(t)}">
                <i class="${n(a)}"></i>
                <strong>${n(e)}</strong>
                <span>${n(o)}</span>
            </button>
        `}function gt(t,e){const o=f(),a=t.id===e;return`
            <button type="button" class="apk-switch-row${a?" is-active":""}" data-apk-module="${n(t.id)}">
                <span class="apk-switch-row-copy">
                    <strong>${n(t.text||t.id)}</strong>
                    <span>${n(t.hint||t.categoryTitle||"跨分类快速直达")}</span>
                </span>
                <span class="apk-switch-row-meta">${a?o.current:o.open}</span>
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
        `}function re(){var T;const t=f(),e=A(),o=String(y||"").trim(),a=ie(),i=Y(),r=B([...G(6),N()]).slice(0,6),s=new Set(r.map(h=>h.id)),c=ht(6+s.size).filter(h=>!s.has(h.id)).slice(0,6),m=x();return`
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
                        ${a.length?`<div class="apk-sheet-grid apk-library-results">${a.map(h=>U(h,e)).join("")}</div>`:`<div class="apk-sheet-empty">${n(t.appLibrarySearchEmpty)}</div>`}
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
                    ${(T=i==null?void 0:i.items)!=null&&T.length?`
                            <section class="apk-library-section">
                                ${k(t.appLibraryCurrentTitle,t.appLibraryCurrentNote)}
                                <article class="apk-library-spotlight" style="--apk-library-accent:${n(i.color||"#2563eb")}">
                                    <div class="apk-library-card-head">
                                        <div>
                                            <strong>${n(i.title)}</strong>
                                            <span>${n(`${i.items.length} 个模块`)}</span>
                                        </div>
                                        <span class="apk-library-card-count">${n(String(i.items.length).padStart(2,"0"))}</span>
                                    </div>
                                    <div class="apk-library-mini-grid">
                                        ${i.items.slice(0,4).map(h=>kt({...h,categoryTitle:i.title},e)).join("")}
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
        `,t.addEventListener("click",ke),t.addEventListener("input",ge),document.body.appendChild(t),t}function se(){const t=f(),e=x(),o=A();return e.length?[R(t.moduleOverviewTitle,t.moduleOverviewCopy),...e.map(a=>`
                <section class="apk-sheet-section">
                    ${k(a.title,a.eyebrow||t.workspaceNote)}
                    <div class="apk-sheet-grid">
                        ${a.items.map(i=>U({...i,categoryTitle:a.title},o)).join("")}
                    </div>
                </section>
            `)].join(""):`${R(t.moduleOverviewTitle,t.noModules)}
                <div class="apk-sheet-empty">${n(t.noModules)}</div>`}function le(){const t=f(),e=A(),o=B([...G(D),N()]).slice(0,4),a=new Set(o.map(s=>s.id)),i=ht(j+a.size).filter(s=>!a.has(s.id)).slice(0,j),r=[g("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand"),g("search",t.searchTitle,t.searchCopy,"ti ti-search"),g("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2"),typeof window.openUserPasswordModal=="function"?g("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):"",g("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")].filter(Boolean);return`
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
            ${i.length?`
                    <section class="apk-sheet-section">
                        ${k(t.suggestedTitle,t.suggestedNote)}
                        <div class="apk-sheet-grid">
                            ${i.map(s=>U(s,e)).join("")}
                        </div>
                    </section>
                `:""}
            <section class="apk-sheet-section">
                ${k(t.utilitiesTitle,t.utilitiesNote)}
                <div class="apk-sheet-grid">
                    ${r.join("")}
                </div>
            </section>
        `}function ce(){const t=f(),e=M();return`
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
                            <strong>${n(`${t.followSystem} · ${oe()}`)}</strong>
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
        `}function de(){var a;const t=f(),e=Vt(),o=((a=document.getElementById("cohort-selector"))==null?void 0:a.value)||"";return e.length?`
            ${R(t.switchCohortTitle,t.switchCohortCopy)}
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${e.map(i=>`
                        <button type="button" class="apk-sheet-card${i.value===o?" is-active":""}" data-apk-cohort="${n(i.value)}">
                            <strong>${n(i.label)}</strong>
                            <span>${n(i.value===o?t.usingCurrentCohort:t.switchToThisCohort)}</span>
                        </button>
                    `).join("")}
                </div>
            </section>
        `:`${R(t.switchCohortTitle,t.noCohortChoices)}
                <div class="apk-sheet-empty">${n(t.noCohorts)}</div>`}function ue(t){const e=t.querySelector("[data-apk-library-panel]");e&&S(e,u?re():"")}function pe(){const e=Z().querySelector("[data-apk-sheet-panel]");if(e){if(!d){S(e,"");return}if(d==="modules"){S(e,se());return}if(d==="quick"){S(e,le());return}if(d==="account"){S(e,ce());return}d==="cohorts"&&S(e,de())}}function he(t){var s;const e=f(),o=t.querySelector("[data-apk-rail]");if(!o)return;const a=Y(),i=A();if(!((s=a==null?void 0:a.items)!=null&&s.length)){S(o,`<div class="apk-rail-empty">${n(e.currentCategoryEmpty)}</div>`);return}const r=a.items.map(c=>`
            <button type="button" class="apk-rail-chip${c.id===i?" is-active":""}" data-apk-module="${n(c.id)}">
                ${n(c.text||c.id)}
            </button>
        `).join("");S(o,r)&&window.requestAnimationFrame(()=>It(t))}function be(t){const e=A(),o=$();t.querySelectorAll(".apk-shell-tab").forEach(a=>{const i=a.getAttribute("data-apk-tab");Rt(a,"is-active",!u&&(i==="home"&&!d&&e===o||i==="modules"&&d==="modules"||i==="quick"&&d==="quick"||i==="account"&&d==="account"))})}function P(){const t=f(),e=Z(),o=N(),a=Y(),i=[ut()||t.unknownSchool,(a==null?void 0:a.title)||t.workbench,X()].filter(Boolean).join(" · ");At(e,"--apk-accent",(o==null?void 0:o.categoryColor)||(a==null?void 0:a.color)||"#2563eb"),e.setAttribute("aria-hidden","false"),W(e,"sheetOpen",d?"true":"false"),W(e,"sheetMode",d||""),W(e,"libraryOpen",u?"true":"false");const r={role:`${dt()}工作台`,title:(o==null?void 0:o.text)||"澄见",subtitle:i,cohort:X(),mode:t.workbench};Object.entries(r).forEach(([s,c])=>{const m=e.querySelector(`[data-apk-field="${s}"]`);$t(m,c)}),Yt(e),he(e),pe(),ue(e),be(e)}function fe(t,e={}){u=!!t,u&&(d=""),!u&&e.resetQuery!==!1&&(y=""),P()}function I(t){fe(typeof t=="boolean"?t:!u)}function p(t=""){d=t,t&&(u=!1,y=""),P()}function C(t){p(d===t?"":t)}function tt(t){!t||typeof window.switchTab!="function"||(d="",u=!1,y="",P(),bt(),window.switchTab(t),Ht(t),t==="student-details"&&Gt(),_.forEach(e=>{window.setTimeout(()=>{var o;(o=document.getElementById(t))!=null&&o.classList.contains("active")&&(mt(),t==="student-details"&&typeof window.requestStudentDetailsPrimaryFocus=="function"&&window.requestStudentDetailsPrimaryFocus()),l()},e)}))}function me(){u=!1,y="",p(""),typeof window.openSpotlight=="function"&&window.openSpotlight()}function ye(){u=!1,y="",p(""),typeof window.openUserPasswordModal=="function"&&window.openUserPasswordModal()}function we(t){if(t==="home"){tt($());return}if(t==="modules"){C("modules");return}if(t==="quick"){C("quick");return}t==="account"&&C("account")}function ge(t){const e=t.target.closest("[data-apk-library-search]");if(!e)return;const o=typeof e.selectionStart=="number"?e.selectionStart:String(e.value||"").length;if(y=String(e.value||""),P(),!u)return;const a=document.querySelector("[data-apk-library-search]");a&&(typeof a.focus=="function"&&a.focus({preventScroll:!0}),typeof a.setSelectionRange=="function"&&a.setSelectionRange(o,o))}function ke(t){const e=t.target.closest("[data-apk-action], [data-apk-module], [data-apk-cohort], [data-apk-tab]");if(!e)return;t.preventDefault();const o=e.getAttribute("data-apk-module");if(o){tt(o);return}const a=e.getAttribute("data-apk-cohort");if(a){ee(a);return}const i=e.getAttribute("data-apk-tab");if(i){we(i);return}const r=e.getAttribute("data-apk-action");if(r==="close-sheet"){p("");return}if(r==="library"){I();return}if(r==="close-library"){I(!1);return}if(r==="modules"){C("modules");return}if(r==="quick"){C("quick");return}if(r==="account"){C("account");return}if(r==="cohorts"){C("cohorts");return}if(r==="search"){me();return}if(r==="password"){ye();return}r==="logout"&&window.Auth&&typeof window.Auth.logout=="function"&&(u=!1,y="",p(""),window.Auth.logout())}function ve(t){var o;if(!b()||!z()||Q()||yt())return;const e=(o=t.touches)==null?void 0:o[0];e&&(w={startX:e.clientX,startY:e.clientY,canOpenLibrary:!u&&!d&&e.clientX<=28,canCloseLibrary:u})}function Se(t){var i;if(!w)return;const e=(i=t.touches)==null?void 0:i[0];if(!e)return;const o=e.clientX-w.startX,a=e.clientY-w.startY;if(Math.abs(a)>42){w=null;return}if(w.canOpenLibrary&&o>=80){I(!0),w=null;return}w.canCloseLibrary&&o<=-80&&(I(!1),w=null)}function vt(){w=null}function O(t,e,o){if(!t||typeof t[e]!="function"||t[e][o])return;const a=t[e],i=function(){const r=a.apply(this,arguments);return l(),_.forEach(s=>{window.setTimeout(l,s)}),r};i[o]=!0,t[e]=i}function Ee(){if(window.Swal&&(O(window.Swal,"close","__apkMobileWrapped__"),typeof window.Swal.fire=="function"&&!window.Swal.fire.__apkMobileWrapped__)){const t=window.Swal.fire,e=function(){const o=t.apply(window.Swal,arguments);return l(),window.setTimeout(wt,1200),_.forEach(a=>{window.setTimeout(l,a)}),o&&typeof o.finally=="function"&&o.finally(()=>{_.forEach(a=>{window.setTimeout(l,a)})}),o};e.__apkMobileWrapped__=!0,window.Swal.fire=e}}function Ce(){O(window,"switchTab","__apkMobileWrapped__"),O(window,"renderNavigation","__apkMobileWrapped__"),O(window,"switchNavCategory","__apkMobileWrapped__"),window.Auth&&(O(window.Auth,"applyRoleView","__apkMobileWrapped__"),O(window.Auth,"renderParentView","__apkMobileWrapped__")),Ee()}function Te(t){const e=document.querySelector("main.app-main"),o=document.getElementById("app"),a=t.querySelector(".apk-shell-sheet");!e||!a||t.contains(e)||(e.dataset.originalParent||(e.dataset.originalParent="app"),a.appendChild(e))}function _e(){const t=document.querySelector("main.app-main"),e=document.getElementById("app"),o=document.getElementById("apk-mobile-shell");!t||!e||o&&o.contains(t)&&e.appendChild(t)}function Le(){qt(),Ce(),te();const t=b(),e=t&&z()&&!Q();document.body.dataset.mobileQuery=t?"true":"false",e?document.body.dataset.mobileArchitecture="apk-v2":delete document.body.dataset.mobileArchitecture,Jt(),Xt();const o=Z();if(o.style.display=e?"block":"none",o.setAttribute("aria-hidden",e?"false":"true"),!e){d="",u=!1,y="",o.dataset.sheetOpen="false",o.dataset.sheetMode="",o.dataset.libraryOpen="false",o.dataset.modalOpen="false",_e();return}Te(o),mt(),P()}function l(){clearTimeout(it),it=window.setTimeout(Le,60)}const St={switchTab(t){const e={home:$(),students:"student-details",analysis:"summary"};if(t==="me"){p("account");return}const o=e[t]||t;tt(o)},renderStudentList(){l()},showStudentDetail(){l()},renderAnalysis(){l()},openModules(){p("modules")},openLibrary(){I(!0)},openQuickActions(){p("quick")},openAccountSheet(){p("account")},openCohortSheet(){p("cohorts")},refresh:l};window.MobMgr=St,window.MobileQueryUI={refresh:l,openLibrary:()=>I(!0),openModules:()=>p("modules"),openQuick:()=>p("quick"),openAccount:()=>p("account"),openCohorts:()=>p("cohorts")},window.MobileExperienceRuntime=window.MobileExperienceRuntime||{install:lt,syncCompactState:K,isCompactViewport:st},window.MobDashboardMgr=window.MobDashboardMgr||{showToast(t){window.UI&&typeof window.UI.toast=="function"?window.UI.toast(t,"info"):typeof window.showToast=="function"?window.showToast(t):window.alert(t)}},window.switchMobileTab=t=>St.switchTab(t),window.matchMedia&&(v=window.matchMedia("(prefers-color-scheme: dark)"),typeof v.addEventListener=="function"?v.addEventListener("change",l):typeof v.addListener=="function"&&v.addListener(l)),window.addEventListener("cloud-load-state",l),window.addEventListener("resize",l),window.addEventListener("orientationchange",l),window.addEventListener("load",l);function Me(){const t=document.getElementById("mobile-skeleton");t&&b()&&(t.classList.add("hidden"),setTimeout(()=>{t.remove()},350))}function Et(){b()&&setTimeout(Me,200)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",Et):Et(),window.addEventListener("pageshow",l),window.addEventListener("focus",l),document.addEventListener("touchstart",ve,{passive:!0}),document.addEventListener("touchmove",Se,{passive:!0}),document.addEventListener("touchend",vt,{passive:!0}),document.addEventListener("touchcancel",vt,{passive:!0}),document.addEventListener("resume",l,!1),document.addEventListener("visibilitychange",()=>{document.hidden||l()}),lt(),_.forEach(t=>{window.setTimeout(l,t)}),l(),window.__MOBILE_MANAGER_PATCHED__=!0,window.__MOBILE_APP_RUNTIME_PATCHED__=!0})();
