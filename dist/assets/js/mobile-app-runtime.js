(()=>{if(typeof window=="undefined"||window.__MOBILE_APP_RUNTIME_PATCHED__)return;const Ct=960,T=[80,260,900],Tt=[140,420,980,1600],_t={admin:"starter-hub",director:"starter-hub",grade_director:"teacher-analysis",class_teacher:"student-details",teacher:"teacher-analysis"},Lt=["student-details","summary","teacher-analysis","report-generator","progress-analysis","analysis"],Mt={admin:["upload","summary","data-manager","report-generator","teacher-analysis","cohort-growth"],director:["summary","county-analysis","teacher-analysis","report-generator","progress-analysis","cohort-growth"],grade_director:["teacher-analysis","summary","progress-analysis","student-overview","cohort-growth","report-generator"],class_teacher:["student-details","student-overview","progress-analysis","marginal-push","report-generator","summary"],teacher:["teacher-analysis","student-details","student-overview","summary","report-generator","progress-analysis"]},at="apk-recent-modules-v1",D=8,j=6,$t={admin:"管理员",director:"校级管理",grade_director:"级部主任",class_teacher:"班主任",teacher:"教师",parent:"家长",student:"学生",guest:"访客"},ot=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform=="function"&&window.Capacitor.isNativePlatform()||typeof window.Capacitor.getPlatform=="function"&&window.Capacitor.getPlatform()!=="web"));let it=0,d="",u=!1,y="",w=null,v=null,nt=null,F="",H=null,_=new Map;function n(t){const e=window.SchoolRuntime&&typeof window.SchoolRuntime.escapeHtml=="function"?window.SchoolRuntime.escapeHtml:null;return e?e(t):String(t!=null?t:"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function At(t,e){if(!t)return!1;const a=String(e!=null?e:"");return t.textContent===a?!1:(t.textContent=a,!0)}function S(t,e){if(!t)return!1;const a=String(e!=null?e:"");return t.__apkLastHtml===a?!1:(t.innerHTML=a,t.__apkLastHtml=a,!0)}function W(t,e,a){if(!(t!=null&&t.dataset))return!1;const o=String(a!=null?a:"");return t.dataset[e]===o?!1:(t.dataset[e]=o,!0)}function Rt(t,e,a){if(!(t!=null&&t.style))return!1;const o=String(a!=null?a:"");return t.style.getPropertyValue(e)===o?!1:(t.style.setProperty(e,o),!0)}function rt(t=document.getElementById("apk-mobile-shell")){if(!t||!b())return;const e=window.visualViewport,a=Number((e==null?void 0:e.offsetLeft)||0),o=Number((e==null?void 0:e.offsetTop)||0),i=a||o?`translate3d(${a}px, ${o}px, 0)`:"none";t.style.transform!==i&&(t.style.transform=i),t.style.setProperty("--apk-viewport-left",`${a}px`),t.style.setProperty("--apk-viewport-top",`${o}px`)}function It(t,e,a){if(!(t!=null&&t.classList))return!1;const o=!!a;return t.classList.contains(e)===o?!1:(t.classList.toggle(e,o),!0)}function st(){var e,a,o;const t=[Number(window.innerWidth||0),Number(((e=document.documentElement)==null?void 0:e.clientWidth)||0),Number(window.outerWidth||0),Number(((a=window.screen)==null?void 0:a.width)||0),Number(((o=window.screen)==null?void 0:o.availWidth)||0)].filter(i=>Number.isFinite(i)&&i>0);return t.length?Math.min(...t):0}function b(){return st()<=Ct}function lt(){return window.matchMedia?window.matchMedia("(max-width: 900px)").matches:st()<=900}function K(t=document){document.documentElement.classList.toggle("is-compact-viewport",lt()),(t&&typeof t.querySelectorAll=="function"?t:document).querySelectorAll(".analysis-table-shell, .table-wrap").forEach(a=>{a.dataset.mobileHint||(a.dataset.mobileHint="可横向滑动查看完整表格")})}function ct(){K(document)}function Ot(t){var o;const e=(o=t==null?void 0:t.querySelector)==null?void 0:o.call(t,"[data-apk-rail]");if(!e)return;const a=e.querySelector(".apk-rail-chip.is-active");!a||typeof a.scrollIntoView!="function"||a.scrollIntoView({inline:"center",block:"nearest",behavior:"auto"})}function L(){return window.AuthState&&typeof window.AuthState.getCurrentUser=="function"?window.AuthState.getCurrentUser():window.Auth&&window.Auth.currentUser?window.Auth.currentUser:null}function q(){var t,e,a;return window.AuthState&&typeof window.AuthState.getCurrentRole=="function"?window.AuthState.getCurrentRole():String(((t=L())==null?void 0:t.role)||((a=(e=document.body)==null?void 0:e.dataset)==null?void 0:a.role)||"guest").trim()||"guest"}function dt(){if(window.AuthState&&typeof window.AuthState.getCurrentRoles=="function")return window.AuthState.getCurrentRoles();const t=L();return(Array.isArray(t==null?void 0:t.roles)&&t.roles.length?t.roles:[t==null?void 0:t.role].filter(Boolean)).map(a=>String(a||"").trim()).filter(Boolean)}function $e(t){const e=new Set(dt());return t.some(a=>e.has(a))}function z(t=q()){const e=String(t||"").trim();return e==="parent"||e==="student"}function ut(t=q()){return $t[String(t||"").trim()]||String(t||"访客")}function pt(){var t,e;return window.SchoolState&&typeof window.SchoolState.getCurrentSchool=="function"?String(((t=L())==null?void 0:t.school)||window.SchoolState.getCurrentSchool()||"").trim():String(((e=L())==null?void 0:e.school)||window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||"").trim()}function Q(){const t=document.getElementById("login-overlay"),e=!!(t&&getComputedStyle(t).display!=="none");return!!L()&&!e}function qt(){if(window.NAV_STRUCTURE)return window.NAV_STRUCTURE;try{return NAV_STRUCTURE}catch(t){return null}}function Nt(){F="",H=null,_=new Map}function Bt(t,e){const a=dt().join("|"),o=t?Object.keys(t).join("|"):"",i=window.CONFIG&&window.CONFIG.showQuery?"report:1":"report:0";return[e,a,o,i].join("::")}function Pt(t){return!(typeof window.canAccessModule=="function"&&!window.canAccessModule(t)||t==="indicator"&&typeof window.isIndicatorModuleVisible=="function"&&!window.isIndicatorModuleVisible()||t==="report-generator"&&typeof window.CONFIG!="undefined"&&window.CONFIG&&!window.CONFIG.showQuery)}function M(){const t=qt();if(!t)return[];const e=q(),a=Bt(t,e);if(H&&F===a)return H;const o=Object.keys(t).map(i=>{const r=t[i];return{...r,key:i,items:Array.isArray(r==null?void 0:r.items)?r.items.filter(s=>Pt(s.id)):[]}}).filter(i=>i.items.length>0);return F=a,H=o,_=new Map,o}function E(t){if(!t)return null;if(_.has(t))return _.get(t);const e=M();for(const a of e){const o=a.items.find(i=>i.id===t);if(o){const i={...o,categoryKey:a.key,categoryTitle:a.title,categoryColor:a.color};return _.set(t,i),i}}return _.set(t,null),null}function $(){var a,o,i;const t=_t[q()]||"starter-hub",e=E(t);return e?e.id:((i=(o=(a=M()[0])==null?void 0:a.items)==null?void 0:o[0])==null?void 0:i.id)||"starter-hub"}function A(){var t;return((t=document.querySelector(".section.active"))==null?void 0:t.id)||$()}function N(){return E(A())||E($())||null}function Y(){const t=M(),e=N();if(e){const o=t.find(i=>i.key===e.categoryKey);if(o)return o}const a=typeof window.getCurrentNavCategory=="function"?String(window.getCurrentNavCategory()||"").trim():"";return t.find(o=>o.key===a)||t[0]||null}function B(t){const e=new Set;return t.filter(a=>!a||!a.id||e.has(a.id)?!1:(e.add(a.id),!0))}function ht(){try{const t=JSON.parse(localStorage.getItem(at)||"[]");return Array.isArray(t)?t.map(e=>String(e||"").trim()).filter(Boolean):[]}catch(t){return[]}}function Vt(t){try{localStorage.setItem(at,JSON.stringify(t.map(e=>String(e||"").trim()).filter(Boolean).slice(0,D)))}catch(e){}}function Ht(t){const e=E(t);e&&Vt([e.id,...ht().filter(a=>a!==e.id)])}function G(t=D){return B(ht().map(e=>E(e)).filter(Boolean)).slice(0,t)}function bt(t=j){const e=Mt[q()]||[],a=[...G(t),N(),E($()),...e.map(o=>E(o)),...Lt.map(o=>E(o))];return B(a).slice(0,t)}function Ae(){var a;const t=document.getElementById("mode-badge"),e=String((t==null?void 0:t.textContent)||"").trim();return e||String(((a=window.CONFIG)==null?void 0:a.name)||"学校工作台").trim()}function X(){var e;const t=document.getElementById("cohort-selector");return(e=t==null?void 0:t.selectedOptions)!=null&&e[0]&&String(t.selectedOptions[0].textContent||t.value||"届别未选择").trim()||"届别未选择"}function Ut(){const t=document.getElementById("cohort-selector");return t?Array.from(t.options||[]).filter(e=>String(e.value||"").trim()).map(e=>({value:String(e.value||"").trim(),label:String(e.textContent||e.value||"").trim()})):[]}function Dt(){return document.querySelector("main.app-main")}function mt(){const t=Dt();if(t&&typeof t.scrollTo=="function"){t.scrollTo({top:0,behavior:"auto"});return}const e=document.scrollingElement||document.documentElement||document.body;if(e&&typeof e.scrollTo=="function"){e.scrollTo({top:0,behavior:"auto"});return}typeof window.scrollTo=="function"&&window.scrollTo({top:0,behavior:"auto"})}function jt(t=document){if(!b())return;t.querySelectorAll(".table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable").forEach(a=>{const o=Ft(a);o.length&&(a.classList.add("mobile-card-table"),Array.from(a.querySelectorAll("tbody tr")).forEach(i=>{let r=String(i.getAttribute("data-mobile-card-title")||"").trim();Array.from(i.children).forEach((s,c)=>{if(!(s instanceof HTMLElement)||s.hasAttribute("colspan"))return;const f=String(o[c]||`字段${c+1}`).replace(/\s+/g," ").trim(),C=String(s.textContent||"").replace(/\s+/g," ").trim();!r&&C&&c<=1&&(r=C),s.setAttribute("data-label",f)}),r&&i.setAttribute("data-mobile-card-title",r)}))})}function Ft(t){const e=Array.from(t.querySelectorAll("thead tr"));if(!e.length)return[];const a=[];let o=0;return e.forEach((i,r)=>{a[r]||(a[r]=[]);let s=0;Array.from(i.children).forEach(c=>{for(;a[r][s];)s+=1;const f=Math.max(parseInt(c.getAttribute("colspan")||"1",10)||1,1),C=Math.max(parseInt(c.getAttribute("rowspan")||"1",10)||1,1),h=String(c.textContent||"").replace(/\s+/g," ").trim();for(let V=0;V<C;V+=1){a[r+V]||(a[r+V]=[]);for(let et=0;et<f;et+=1)a[r+V][s+et]=h}s+=f,s>o&&(o=s)})}),Array.from({length:o},(i,r)=>{const s=[];return a.forEach(c=>{const f=String((c==null?void 0:c[r])||"").trim();!f||s[s.length-1]===f||s.push(f)}),s.join(" / ")})}function J(t=document){if(!b())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;jt(e)}function ft(t=document){if(!b())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;clearTimeout(window.__RESPONSIVE_TABLE_REFRESH_TIMER__||0),window.__RESPONSIVE_TABLE_REFRESH_TIMER__=window.setTimeout(()=>{J(e)},60)}function Wt(t=document.querySelector(".section.active")||document.getElementById("app")||document.body){if(typeof MutationObserver!="function")return;const e=t instanceof HTMLElement?t:document.querySelector(".section.active")||document.getElementById("app")||document.body||document.documentElement;if(!e||window.__RESPONSIVE_TABLE_OBSERVER__&&nt===e)return;window.__RESPONSIVE_TABLE_OBSERVER__&&typeof window.__RESPONSIVE_TABLE_OBSERVER__.disconnect=="function"&&window.__RESPONSIVE_TABLE_OBSERVER__.disconnect();const a=new MutationObserver(o=>{if(!b())return;o.some(r=>Array.from(r.addedNodes||[]).some(s=>{var c;return s instanceof HTMLElement?s.matches("table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table, .section, #parent-view-container")||!!((c=s.querySelector)!=null&&c.call(s,"table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table")):!1}))&&ft(e)});a.observe(e,{childList:!0,subtree:!0}),window.__RESPONSIVE_TABLE_OBSERVER__=a,nt=e}window.refreshResponsiveMobileTables=J;function Kt(t=document){b()&&(t.querySelectorAll('.section [style*="grid-template-columns"]').forEach(e=>{e.closest("#parent-view-container")||e.classList.add("mobile-stack-grid")}),t.querySelectorAll('.section [style*="display:flex"]').forEach(e=>{e.closest("#parent-view-container")||e.closest("#apk-mobile-shell")||e.children.length<2||e.classList.add("mobile-wrap-row")}))}function zt(t=document){if(!b())return;t.querySelectorAll(".table-wrap").forEach(a=>{if(a.__scrollListenerAttached__)return;const o=()=>{const i=a.scrollLeft+a.clientWidth>=a.scrollWidth-2;a.classList.toggle("scrolled-end",i)};a.addEventListener("scroll",o,{passive:!0}),a.__scrollListenerAttached__=!0,o()})}function Qt(){if(document.getElementById("mobile-experience-styles"))return;const t=document.createElement("style");t.id="mobile-experience-styles",t.textContent=`
            @media screen and (max-width: 960px) {
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell {
                    position: fixed;
                    inset: 0;
                    z-index: 15000;
                    pointer-events: none;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-top {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    right: 0 !important;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-topbar,
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-meta,
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-rail,
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-tabs {
                    pointer-events: auto !important;
                }
                body[data-mobile-architecture="apk-v2"]:not([data-role="parent"]) #starter-hub .starter-status-strip {
                    display: block !important;
                    width: 100% !important;
                    max-width: none !important;
                    min-width: 0 !important;
                    grid-template-columns: none !important;
                    flex: none !important;
                }
                body[data-mobile-architecture="apk-v2"]:not([data-role="parent"]) #starter-hub .starter-status-strip > #starter-status-panel {
                    display: grid !important;
                    grid-template-columns: minmax(0, 1fr) !important;
                    width: 100% !important;
                    max-width: none !important;
                    min-width: 0 !important;
                    flex: 0 0 auto !important;
                    grid-column: 1 / -1 !important;
                    gap: 0 !important;
                }
                body[data-mobile-architecture="apk-v2"]:not([data-role="parent"]) #starter-hub .starter-status-strip .status-item {
                    display: grid !important;
                    grid-template-columns: minmax(88px, 1fr) minmax(108px, 1.35fr) auto !important;
                    align-items: center !important;
                    column-gap: 8px !important;
                    min-width: 0 !important;
                    width: 100% !important;
                    min-height: 72px !important;
                    padding: 12px 14px !important;
                    writing-mode: horizontal-tb !important;
                }
                body[data-mobile-architecture="apk-v2"]:not([data-role="parent"]) #starter-hub .starter-status-strip .status-item > *,
                body[data-mobile-architecture="apk-v2"]:not([data-role="parent"]) #starter-hub .starter-status-strip .status-item strong {
                    writing-mode: horizontal-tb !important;
                    max-width: 100% !important;
                    white-space: normal !important;
                    word-break: keep-all !important;
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
                    opacity: 0;
                    visibility: hidden;
                    transform: translateY(24px);
                    pointer-events: none;
                    overflow-y: auto;
                    -webkit-overflow-scrolling: touch;
                    overscroll-behavior-y: contain;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-content {
                    position: absolute;
                    inset: 0;
                    overflow: hidden;
                    pointer-events: none;
                    visibility: visible;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell .apk-shell-content .app-main {
                    pointer-events: auto;
                }
                body[data-mobile-architecture="apk-v2"] #apk-mobile-shell[data-sheet-open="true"] .apk-shell-sheet {
                    opacity: 1;
                    visibility: visible;
                    transform: none;
                    pointer-events: auto;
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
        `,document.head.appendChild(t)}function yt(){const t=document.querySelector(".section.active")||document;Qt(),K(t),J(t),ft(t),Wt(t),Kt(t),zt(t)}function Yt(t){if(!(t instanceof HTMLElement))return!1;const e=window.getComputedStyle(t);return e.display==="none"||e.visibility==="hidden"||Number(e.opacity||1)===0||t.getAttribute("aria-hidden")==="true"||t.hidden?!1:t.getClientRects().length>0}function wt(){if(gt(),window.Swal&&typeof window.Swal.isVisible=="function"&&window.Swal.isVisible())return!0;const t=[".swal2-container",".modal",'[role="dialog"]','[aria-modal="true"]',".dialog-overlay",".dialog-backdrop"];return Array.from(document.querySelectorAll(t.join(","))).some(e=>{if(!(e instanceof HTMLElement)||e.closest("#apk-mobile-shell")||!Yt(e))return!1;const a=window.getComputedStyle(e),o=Number(a.zIndex||0);return a.position==="fixed"||o>=1e3})}function gt(){const t=document.querySelector(".swal2-container.swal2-backdrop-show");if(!b()||!t||t.querySelector("input,textarea,select,.swal2-cancel,.swal2-deny")||t.querySelector(".swal2-icon-error,.swal2-icon-warning,.swal2-icon-question"))return!1;const e=String(t.innerText||"");return["安全","警告","失败","错误","确认","请确认","未完成","必须","需要完成","删除","覆盖","退出","清空","重置","取消","放弃","丢失","不可恢复","永久","移除","注销"].some(o=>e.includes(o))?!1:(window.Swal&&typeof window.Swal.close=="function"?window.Swal.close():t.remove(),!0)}function Gt(t=document.getElementById("apk-mobile-shell")){t&&(t.dataset.modalOpen=wt()?"true":"false")}function Xt(){Tt.forEach((t,e)=>{window.setTimeout(()=>{const a=document.getElementById("student-details");if(!(!a||!a.classList.contains("active"))){if(typeof window.requestStudentDetailsPrimaryFocus=="function"){window.requestStudentDetailsPrimaryFocus(e);return}typeof window.focusStudentDetailsPrimaryFlow=="function"&&window.focusStudentDetailsPrimaryFlow()}},t)})}function Jt(){["mobile-manager-app","mobile-query-shell"].forEach(t=>{const e=document.getElementById(t);e&&(e.setAttribute("aria-hidden","true"),e.style.display="none")})}function Zt(){const t=document.getElementById("app");if(t){if(!b()){t.classList.remove("hidden"),t.style.display="";return}if(!Q()){t.classList.add("hidden"),t.style.display="none";return}z()||(t.classList.remove("hidden"),t.style.display="")}}function te(){const t=document.querySelector('meta[name="theme-color"]');t&&t.setAttribute("content",document.body.classList.contains("dark-mode")?"#08111d":"#eef3f8")}function ee(){const t=!!(v!=null&&v.matches);document.body.dataset.nativeApp=ot?"true":"false",document.body.dataset.systemTheme=t?"dark":"light",ot&&b()&&(document.body.classList.toggle("dark-mode",t),localStorage.setItem("theme-dark",t?"true":"false")),document.documentElement.style.colorScheme=document.body.classList.contains("dark-mode")?"dark":"light",te()}function ae(t){const e=document.getElementById("cohort-selector");!e||!t||(e.value=t,e.dispatchEvent(new Event("change",{bubbles:!0})),p(""),T.forEach(a=>{window.setTimeout(()=>{mt(),l()},a)}))}function m(){return{workbench:"学校工作台",mobileWorkbench:"移动工作台",mobilePreparing:"移动工作台正在准备中",openLibrary:"打开模块资源库",openSearch:"打开全局搜索",closeSheet:"关闭面板",closeLibrary:"关闭模块资源库",cohortPlaceholder:"届别未选择",home:"工作台",modules:"模块",recent:"最近",account:"我的",openModule:"打开该模块",currentCategoryEmpty:"当前分类暂无可用模块",current:"当前",open:"打开",workspaceNote:"Workspace",moduleOverviewTitle:"模块总览",moduleOverviewCopy:"按分类切换工作模块，减少手机端来回翻找入口的次数。",noModules:"当前账号还没有可切换的模块入口。",quickTitle:"最近与常用",quickCopy:"先给你最近用过的模块，再补高频入口，减少反复进出分类面板。",quickHeroTitle:"跨分类切换先看这里",quickHeroCopy:"默认优先展示最近使用，同时保留完整模块资源库入口。",recentModulesTitle:"最近使用",recentModulesNote:"Recent Modules",suggestedTitle:"高频推荐",suggestedNote:"Suggested",utilitiesTitle:"系统动作",utilitiesNote:"Utilities",noRecent:"还没有可回跳的最近模块，可以先从当前分类或全部模块进入。",appLibraryTitle:"模块资源库",appLibraryCopy:"像 App 资源库一样集中浏览全部模块，支持最近使用、当前分类和快速搜索。",appLibrarySearch:"搜索模块、功能或分类",appLibrarySearchTitle:"搜索结果",appLibrarySearchNote:"Results",appLibrarySearchEmpty:"没有匹配的模块，试试更短的关键词。",appLibraryCurrentTitle:"当前分类",appLibraryCurrentNote:"Now Browsing",appLibraryAllTitle:"全部分类",appLibraryAllNote:"App Library",allModulesTitle:"全部模块",allModulesCopy:"找不到所需功能时，直接打开完整模块总览。",searchTitle:"全局搜索",searchCopy:"快速搜索学生、模块和常用入口。",cohortsTitle:"切换届别",cohortsCopy:"在不同届别工作区之间快速跳转。",passwordTitle:"修改密码",passwordCopy:"直接打开当前账号的密码修改入口。",logoutTitle:"退出登录",logoutCopy:"返回登录页，重新选择账号进入。",accountTitle:"账号与设置",accountCopy:"APK 默认跟随系统主题，并把常用设置集中到这一层。",currentSchool:"当前学校",currentCohort:"当前届别",themeMode:"主题模式",themeDark:"深色",themeLight:"浅色",followSystem:"跟随系统",runtimeEnv:"运行环境",mobileBrowser:"移动浏览器",notLoggedIn:"未登录",unknownSchool:"未识别学校",switchCohortTitle:"切换届别",switchCohortCopy:"统一从这里切届别，避免手机端入口与工作区状态脱节。",noCohorts:"暂无可切换届别。",noCohortChoices:"当前没有可切换的届别，请先完成数据恢复。",usingCurrentCohort:"当前正在使用的届别。",switchToThisCohort:"点击切换到这个届别。"}}function oe(){return document.body.dataset.systemTheme==="dark"?m().themeDark:m().themeLight}function ie(t,e=null){return[t==null?void 0:t.text,t==null?void 0:t.hint,t==null?void 0:t.id,e==null?void 0:e.title,e==null?void 0:e.eyebrow].filter(Boolean).join(" ").toLowerCase()}function ne(){const t=String(y||"").trim().toLowerCase();return t?B(M().flatMap(e=>e.items.filter(a=>ie(a,e).includes(t)).map(a=>({...a,categoryTitle:e.title,categoryKey:e.key,categoryColor:e.color})))):[]}function R(t,e){return`
            <div class="apk-sheet-header">
                <div>
                    <strong>${n(t)}</strong>
                    <span>${n(e)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-sheet" aria-label="${n(m().closeSheet)}">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        `}function k(t,e){return`
            <div class="apk-sheet-section-head">
                <span class="apk-sheet-section-title">${n(t)}</span>
                <span class="apk-sheet-section-note">${n(e)}</span>
            </div>
        `}function U(t,e){const a=m();return`
            <button type="button" class="apk-sheet-card${t.id===e?" is-active":""}" data-apk-module="${n(t.id)}">
                <strong>${n(t.text||t.id)}</strong>
                <span>${n(t.hint||t.categoryTitle||a.openModule)}</span>
            </button>
        `}function g(t,e,a,o,i=""){return`
            <button type="button" class="apk-sheet-card apk-sheet-card--action${i?` ${i}`:""}" data-apk-action="${n(t)}">
                <i class="${n(o)}"></i>
                <strong>${n(e)}</strong>
                <span>${n(a)}</span>
            </button>
        `}function kt(t,e){const a=m(),o=t.id===e;return`
            <button type="button" class="apk-switch-row${o?" is-active":""}" data-apk-module="${n(t.id)}">
                <span class="apk-switch-row-copy">
                    <strong>${n(t.text||t.id)}</strong>
                    <span>${n(t.hint||t.categoryTitle||"跨分类快速直达")}</span>
                </span>
                <span class="apk-switch-row-meta">${o?a.current:a.open}</span>
            </button>
        `}function vt(t,e){const a=String(t.text||t.id||"").trim().slice(0,2)||"模块";return`
            <button type="button" class="apk-library-mini${t.id===e?" is-active":""}" data-apk-module="${n(t.id)}">
                <span class="apk-library-mini-badge">${n(a)}</span>
                <span class="apk-library-mini-copy">
                    <strong>${n(t.text||t.id)}</strong>
                    <span>${n(t.hint||t.categoryTitle||"模块")}</span>
                </span>
            </button>
        `}function re(t,e){return`
            <article class="apk-library-card" style="--apk-library-accent:${n(t.color||"#2563eb")}">
                <div class="apk-library-card-head">
                    <div>
                        <strong>${n(t.title)}</strong>
                        <span>${n(`${t.items.length} 个模块`)}</span>
                    </div>
                    <span class="apk-library-card-count">${n(String(t.items.length).padStart(2,"0"))}</span>
                </div>
                <div class="apk-library-mini-grid">
                    ${t.items.slice(0,4).map(a=>vt({...a,categoryTitle:t.title},e)).join("")}
                </div>
            </article>
        `}function se(){var C;const t=m(),e=A(),a=String(y||"").trim(),o=ne(),i=Y(),r=B([...G(6),N()]).slice(0,6),s=new Set(r.map(h=>h.id)),c=bt(6+s.size).filter(h=>!s.has(h.id)).slice(0,6),f=M();return`
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
                <input type="search" data-apk-library-search value="${n(a)}" placeholder="${n(t.appLibrarySearch)}" autocomplete="off" />
            </label>
            ${a?`
                    <section class="apk-library-section">
                        ${k(t.appLibrarySearchTitle,t.appLibrarySearchNote)}
                        ${o.length?`<div class="apk-sheet-grid apk-library-results">${o.map(h=>U(h,e)).join("")}</div>`:`<div class="apk-sheet-empty">${n(t.appLibrarySearchEmpty)}</div>`}
                    </section>
                `:`
                    <section class="apk-library-section">
                        ${k(t.recentModulesTitle,t.recentModulesNote)}
                        ${r.length?`<div class="apk-switch-list">${r.map(h=>kt(h,e)).join("")}</div>`:`<div class="apk-sheet-empty">${n(t.noRecent)}</div>`}
                    </section>
                    ${c.length?`
                            <section class="apk-library-section">
                                ${k(t.suggestedTitle,t.suggestedNote)}
                                <div class="apk-sheet-grid apk-library-results">
                                    ${c.map(h=>U(h,e)).join("")}
                                </div>
                            </section>
                        `:""}
                    ${(C=i==null?void 0:i.items)!=null&&C.length?`
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
                                        ${i.items.slice(0,4).map(h=>vt({...h,categoryTitle:i.title},e)).join("")}
                                    </div>
                                </article>
                            </section>
                        `:""}
                    <section class="apk-library-section">
                        ${k(t.appLibraryAllTitle,t.appLibraryAllNote)}
                        <div class="apk-library-clusters">
                            ${f.map(h=>re(h,e)).join("")}
                        </div>
                    </section>
                `}
        `}function Z(){let t=document.getElementById("apk-mobile-shell");if(t)return t;const e=m();return t=document.createElement("div"),t.id="apk-mobile-shell",t.setAttribute("aria-hidden","true"),t.innerHTML=`
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
            <div class="apk-shell-content" data-apk-content></div>
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
        `,t.addEventListener("click",ve),t.addEventListener("input",ke),document.body.appendChild(t),t}function le(){const t=m(),e=M(),a=A();return e.length?[R(t.moduleOverviewTitle,t.moduleOverviewCopy),...e.map(o=>`
                <section class="apk-sheet-section">
                    ${k(o.title,o.eyebrow||t.workspaceNote)}
                    <div class="apk-sheet-grid">
                        ${o.items.map(i=>U({...i,categoryTitle:o.title},a)).join("")}
                    </div>
                </section>
            `)].join(""):`${R(t.moduleOverviewTitle,t.noModules)}
                <div class="apk-sheet-empty">${n(t.noModules)}</div>`}function ce(){const t=m(),e=A(),a=B([...G(D),N()]).slice(0,4),o=new Set(a.map(s=>s.id)),i=bt(j+o.size).filter(s=>!o.has(s.id)).slice(0,j),r=[g("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand"),g("search",t.searchTitle,t.searchCopy,"ti ti-search"),g("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2"),typeof window.openUserPasswordModal=="function"?g("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):"",g("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")].filter(Boolean);return`
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
                ${a.length?`<div class="apk-switch-list">${a.map(s=>kt(s,e)).join("")}</div>`:`<div class="apk-sheet-empty">${n(t.noRecent)}</div>`}
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
        `}function de(){const t=m(),e=L();return`
            ${R(t.accountTitle,t.accountCopy)}
            <section class="apk-sheet-section">
                <div class="apk-account-card">
                    <div class="apk-account-name">${n((e==null?void 0:e.name)||t.notLoggedIn)}</div>
                    <div class="apk-account-role">${n(ut())}</div>
                    <div class="apk-account-grid">
                        <div class="apk-account-row">
                            <span>${n(t.currentSchool)}</span>
                            <strong>${n(pt()||t.unknownSchool)}</strong>
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
        `}function ue(){var o;const t=m(),e=Ut(),a=((o=document.getElementById("cohort-selector"))==null?void 0:o.value)||"";return e.length?`
            ${R(t.switchCohortTitle,t.switchCohortCopy)}
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${e.map(i=>`
                        <button type="button" class="apk-sheet-card${i.value===a?" is-active":""}" data-apk-cohort="${n(i.value)}">
                            <strong>${n(i.label)}</strong>
                            <span>${n(i.value===a?t.usingCurrentCohort:t.switchToThisCohort)}</span>
                        </button>
                    `).join("")}
                </div>
            </section>
        `:`${R(t.switchCohortTitle,t.noCohortChoices)}
                <div class="apk-sheet-empty">${n(t.noCohorts)}</div>`}function pe(t){const e=t.querySelector("[data-apk-library-panel]");e&&S(e,u?se():"")}function he(){const e=Z().querySelector("[data-apk-sheet-panel]");if(e){if(!d){S(e,"");return}if(d==="modules"){S(e,le());return}if(d==="quick"){S(e,ce());return}if(d==="account"){S(e,de());return}d==="cohorts"&&S(e,ue())}}function be(t){var s;const e=m(),a=t.querySelector("[data-apk-rail]");if(!a)return;const o=Y(),i=A();if(!((s=o==null?void 0:o.items)!=null&&s.length)){S(a,`<div class="apk-rail-empty">${n(e.currentCategoryEmpty)}</div>`);return}const r=o.items.map(c=>`
            <button type="button" class="apk-rail-chip${c.id===i?" is-active":""}" data-apk-module="${n(c.id)}">
                ${n(c.text||c.id)}
            </button>
        `).join("");S(a,r)&&window.requestAnimationFrame(()=>Ot(t))}function me(t){const e=A(),a=$();t.querySelectorAll(".apk-shell-tab").forEach(o=>{const i=o.getAttribute("data-apk-tab");It(o,"is-active",!u&&(i==="home"&&!d&&e===a||i==="modules"&&d==="modules"||i==="quick"&&d==="quick"||i==="account"&&d==="account"))})}function P(){const t=m(),e=Z(),a=N(),o=Y(),i=[pt()||t.unknownSchool,(o==null?void 0:o.title)||t.workbench,X()].filter(Boolean).join(" · ");Rt(e,"--apk-accent",(a==null?void 0:a.categoryColor)||(o==null?void 0:o.color)||"#2563eb"),e.setAttribute("aria-hidden","false"),W(e,"sheetOpen",d?"true":"false"),W(e,"sheetMode",d||""),W(e,"libraryOpen",u?"true":"false");const r={role:`${ut()}工作台`,title:(a==null?void 0:a.text)||"澄见",subtitle:i,cohort:X(),mode:t.workbench};Object.entries(r).forEach(([s,c])=>{const f=e.querySelector(`[data-apk-field="${s}"]`);At(f,c)}),Gt(e),be(e),he(),pe(e),me(e)}function fe(t,e={}){u=!!t,u&&(d=""),!u&&e.resetQuery!==!1&&(y=""),P()}function I(t){fe(typeof t=="boolean"?t:!u)}function p(t=""){d=t,t&&(u=!1,y=""),P()}function x(t){p(d===t?"":t)}function tt(t){!t||typeof window.switchTab!="function"||(d="",u=!1,y="",P(),mt(),window.switchTab(t),Ht(t),t==="student-details"&&Xt(),T.forEach(e=>{window.setTimeout(()=>{var a;(a=document.getElementById(t))!=null&&a.classList.contains("active")&&(yt(),t==="student-details"&&typeof window.requestStudentDetailsPrimaryFocus=="function"&&window.requestStudentDetailsPrimaryFocus()),l()},e)}))}function ye(){u=!1,y="",p(""),typeof window.openSpotlight=="function"&&window.openSpotlight()}function we(){u=!1,y="",p(""),typeof window.openUserPasswordModal=="function"&&window.openUserPasswordModal()}function ge(t){if(t==="home"){tt($());return}if(t==="modules"){x("modules");return}if(t==="quick"){x("quick");return}t==="account"&&x("account")}function ke(t){const e=t.target.closest("[data-apk-library-search]");if(!e)return;const a=typeof e.selectionStart=="number"?e.selectionStart:String(e.value||"").length;if(y=String(e.value||""),P(),!u)return;const o=document.querySelector("[data-apk-library-search]");o&&(typeof o.focus=="function"&&o.focus({preventScroll:!0}),typeof o.setSelectionRange=="function"&&o.setSelectionRange(a,a))}function ve(t){const e=t.target.closest("[data-apk-action], [data-apk-module], [data-apk-cohort], [data-apk-tab]");if(!e)return;t.preventDefault();const a=e.getAttribute("data-apk-module");if(a){tt(a);return}const o=e.getAttribute("data-apk-cohort");if(o){ae(o);return}const i=e.getAttribute("data-apk-tab");if(i){ge(i);return}const r=e.getAttribute("data-apk-action");if(r==="close-sheet"){p("");return}if(r==="library"){I();return}if(r==="close-library"){I(!1);return}if(r==="modules"){x("modules");return}if(r==="quick"){x("quick");return}if(r==="account"){x("account");return}if(r==="cohorts"){x("cohorts");return}if(r==="search"){ye();return}if(r==="password"){we();return}r==="logout"&&window.Auth&&typeof window.Auth.logout=="function"&&(u=!1,y="",p(""),window.Auth.logout())}function Se(t){var a;if(!b()||!Q()||z()||wt())return;const e=(a=t.touches)==null?void 0:a[0];e&&(w={startX:e.clientX,startY:e.clientY,canOpenLibrary:!u&&!d&&e.clientX<=28,canCloseLibrary:u})}function Ee(t){var i;if(!w)return;const e=(i=t.touches)==null?void 0:i[0];if(!e)return;const a=e.clientX-w.startX,o=e.clientY-w.startY;if(Math.abs(o)>42){w=null;return}if(w.canOpenLibrary&&a>=80){I(!0),w=null;return}w.canCloseLibrary&&a<=-80&&(I(!1),w=null)}function St(){w=null}function O(t,e,a){if(!t||typeof t[e]!="function"||t[e][a])return;const o=t[e],i=function(){const r=o.apply(this,arguments);return l(),T.forEach(s=>{window.setTimeout(l,s)}),r};i[a]=!0,t[e]=i}function xe(){if(window.Swal&&(O(window.Swal,"close","__apkMobileWrapped__"),typeof window.Swal.fire=="function"&&!window.Swal.fire.__apkMobileWrapped__)){const t=window.Swal.fire,e=function(){const a=t.apply(window.Swal,arguments);return l(),window.setTimeout(gt,1200),T.forEach(o=>{window.setTimeout(l,o)}),a&&typeof a.finally=="function"&&a.finally(()=>{T.forEach(o=>{window.setTimeout(l,o)})}),a};e.__apkMobileWrapped__=!0,window.Swal.fire=e}}function Ce(){O(window,"switchTab","__apkMobileWrapped__"),O(window,"renderNavigation","__apkMobileWrapped__"),O(window,"switchNavCategory","__apkMobileWrapped__"),window.Auth&&(O(window.Auth,"applyRoleView","__apkMobileWrapped__"),O(window.Auth,"renderParentView","__apkMobileWrapped__")),xe()}function Te(t){const e=document.querySelector("main.app-main"),a=document.getElementById("app"),o=t.querySelector("[data-apk-content]");!e||!o||t.contains(e)||(e.dataset.originalParent||(e.dataset.originalParent="app"),o.appendChild(e))}function _e(){const t=document.querySelector("main.app-main"),e=document.getElementById("app"),a=document.getElementById("apk-mobile-shell");!t||!e||a&&a.contains(t)&&e.appendChild(t)}function Le(){Nt(),Ce(),ee();const t=b(),e=t&&Q()&&!z();document.body.dataset.mobileQuery=t?"true":"false",e?document.body.dataset.mobileArchitecture="apk-v2":delete document.body.dataset.mobileArchitecture,Zt(),Jt();const a=Z();if(rt(a),a.style.display=e?"block":"none",a.setAttribute("aria-hidden",e?"false":"true"),!e){d="",u=!1,y="",a.dataset.sheetOpen="false",a.dataset.sheetMode="",a.dataset.libraryOpen="false",a.dataset.modalOpen="false",_e();return}Te(a),yt(),P()}function l(){clearTimeout(it),it=window.setTimeout(Le,60)}const Et={switchTab(t){const e={home:$(),students:"student-details",analysis:"summary"};if(t==="me"){p("account");return}const a=e[t]||t;tt(a)},renderStudentList(){l()},showStudentDetail(){l()},renderAnalysis(){l()},openModules(){p("modules")},openLibrary(){I(!0)},openQuickActions(){p("quick")},openAccountSheet(){p("account")},openCohortSheet(){p("cohorts")},refresh:l};window.MobMgr=Et,window.MobileQueryUI={refresh:l,openLibrary:()=>I(!0),openModules:()=>p("modules"),openQuick:()=>p("quick"),openAccount:()=>p("account"),openCohorts:()=>p("cohorts")},window.MobileExperienceRuntime=window.MobileExperienceRuntime||{install:ct,syncCompactState:K,isCompactViewport:lt},window.MobDashboardMgr=window.MobDashboardMgr||{showToast(t){window.UI&&typeof window.UI.toast=="function"?window.UI.toast(t,"info"):typeof window.showToast=="function"?window.showToast(t):window.alert(t)}},window.switchMobileTab=t=>Et.switchTab(t),window.matchMedia&&(v=window.matchMedia("(prefers-color-scheme: dark)"),typeof v.addEventListener=="function"?v.addEventListener("change",l):typeof v.addListener=="function"&&v.addListener(l)),window.addEventListener("cloud-load-state",l),window.addEventListener("resize",l),window.addEventListener("orientationchange",l),window.visualViewport&&(window.visualViewport.addEventListener("resize",l,{passive:!0}),window.visualViewport.addEventListener("scroll",()=>rt(),{passive:!0})),window.addEventListener("load",l);function Me(){const t=document.getElementById("mobile-skeleton");t&&b()&&(t.classList.add("hidden"),setTimeout(()=>{t.remove()},350))}function xt(){b()&&setTimeout(Me,200)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",xt):xt(),window.addEventListener("pageshow",l),window.addEventListener("focus",l),document.addEventListener("touchstart",Se,{passive:!0}),document.addEventListener("touchmove",Ee,{passive:!0}),document.addEventListener("touchend",St,{passive:!0}),document.addEventListener("touchcancel",St,{passive:!0}),document.addEventListener("resume",l,!1),document.addEventListener("visibilitychange",()=>{document.hidden||l()}),ct(),T.forEach(t=>{window.setTimeout(l,t)}),l(),window.__MOBILE_MANAGER_PATCHED__=!0,window.__MOBILE_APP_RUNTIME_PATCHED__=!0})();
