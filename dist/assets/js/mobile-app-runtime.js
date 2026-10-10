(()=>{if(typeof window=="undefined"||window.__MOBILE_APP_RUNTIME_PATCHED__)return;const It=960,_=[80,260,900],Rt=[140,420,980,1600],Ot={admin:"starter-hub",director:"starter-hub",grade_director:"teacher-analysis",class_teacher:"student-details",teacher:"teacher-analysis"},qt=["student-details","summary","teacher-analysis","report-generator","progress-analysis","analysis"],Bt={admin:["upload","summary","data-manager","report-generator","teacher-analysis","cohort-growth"],director:["summary","county-analysis","teacher-analysis","report-generator","progress-analysis","cohort-growth"],grade_director:["teacher-analysis","summary","progress-analysis","student-overview","cohort-growth","report-generator"],class_teacher:["student-details","student-overview","progress-analysis","marginal-push","report-generator","summary"],teacher:["teacher-analysis","student-details","student-overview","summary","report-generator","progress-analysis"]},ct="apk-recent-modules-v1",W=8,z=6,Nt={admin:"管理员",director:"校级管理",grade_director:"级部主任",class_teacher:"班主任",teacher:"教师",parent:"家长",student:"学生",guest:"访客"},dt=!!(window.Capacitor&&(typeof window.Capacitor.isNativePlatform=="function"&&window.Capacitor.isNativePlatform()||typeof window.Capacitor.getPlatform=="function"&&window.Capacitor.getPlatform()!=="web"));let ut=0,u="",p=!1,w="",g=null,S=null,pt=null,K="",U=null,A=new Map,C=null,Q=null;function i(t){const e=window.SchoolRuntime&&typeof window.SchoolRuntime.escapeHtml=="function"?window.SchoolRuntime.escapeHtml:null;return e?e(t):String(t!=null?t:"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}function Vt(t,e){if(!t)return!1;const a=String(e!=null?e:"");return t.textContent===a?!1:(t.textContent=a,!0)}function E(t,e){if(!t)return!1;const a=String(e!=null?e:"");return t.__apkLastHtml===a?!1:(t.innerHTML=a,t.__apkLastHtml=a,!0)}function $(t,e,a){if(!(t!=null&&t.dataset))return!1;const o=String(a!=null?a:"");return t.dataset[e]===o?!1:(t.dataset[e]=o,!0)}function Pt(t,e,a){if(!(t!=null&&t.style))return!1;const o=String(a!=null?a:"");return t.style.getPropertyValue(e)===o?!1:(t.style.setProperty(e,o),!0)}function ht(t=document.getElementById("apk-mobile-shell")){if(!t||!f())return;const e=window.visualViewport,a=Number((e==null?void 0:e.offsetLeft)||0),o=Number((e==null?void 0:e.offsetTop)||0),n=a||o?`translate3d(${a}px, ${o}px, 0)`:"none";t.style.transform!==n&&(t.style.transform=n),t.style.setProperty("--apk-viewport-left",`${a}px`),t.style.setProperty("--apk-viewport-top",`${o}px`)}function Ht(t,e,a){if(!(t!=null&&t.classList))return!1;const o=!!a;return t.classList.contains(e)===o?!1:(t.classList.toggle(e,o),!0)}function bt(){var a,o,n,l;const t=[Number(window.innerWidth||0),Number(((a=document.documentElement)==null?void 0:a.clientWidth)||0),Number(((o=window.visualViewport)==null?void 0:o.width)||0),Number(window.outerWidth||0)].filter(r=>Number.isFinite(r)&&r>0);if(t.length)return Math.min(...t);const e=[Number(((n=window.screen)==null?void 0:n.width)||0),Number(((l=window.screen)==null?void 0:l.availWidth)||0)].filter(r=>Number.isFinite(r)&&r>0);return e.length?Math.min(...e):0}function f(){return bt()<=It}function mt(){return window.matchMedia?window.matchMedia("(max-width: 900px)").matches:bt()<=900}function Y(t=document){document.documentElement.classList.toggle("is-compact-viewport",mt()),(t&&typeof t.querySelectorAll=="function"?t:document).querySelectorAll(".analysis-table-shell, .table-wrap").forEach(a=>{a.dataset.mobileHint||(a.dataset.mobileHint="可横向滑动查看完整表格")})}function ft(){Y(document),document.querySelectorAll("[data-mobile-action-bar]").forEach(Z),G(document),X(document),J(document)}const Dt=["upload","summary","teacher-analysis","student-details","report-generator","exam-arranger"];function G(t=document){Dt.forEach(e=>{var n;const a=((n=t.getElementById)==null?void 0:n.call(t,e))||document.getElementById(e);if(!a)return;a.dataset.mobileSurface="core";const o=a.querySelector(".sec-head, .analysis-shell-head, .exam-arranger-head");o!=null&&o.querySelector("button, .btn")&&(o.setAttribute("data-mobile-action-bar",""),Z(o)),a.querySelectorAll(".table-wrap, .analysis-table-shell, .exam-table-scroll").forEach(l=>{!l.dataset.mobileTable&&window.TableScrollIndicators&&window.TableScrollIndicators.setupTableWrap(l)})})}const Ut=["analysis","correlation-analysis","progress-analysis","marginal-push","seat-adjustment","cohort-growth","mutual-aid","county-analysis","teacher-detail-comparison","teacher-pairing","teacher-township-ranking"];function X(t=document){Ut.forEach(e=>{var o;const a=((o=t.getElementById)==null?void 0:o.call(t,e))||document.getElementById(e);a&&(a.dataset.mobileSurface="analysis",a.querySelectorAll(".table-wrap, .analysis-table-shell").forEach(n=>{!n.dataset.mobileTable&&window.TableScrollIndicators&&window.TableScrollIndicators.setupTableWrap(n)}))})}function J(t=document){["data-manager-modal","account-manager-modal","cloud-archive-manager","cloud-workspace-panel"].forEach(e=>{var o;const a=((o=t.getElementById)==null?void 0:o.call(t,e))||document.getElementById(e);a&&(a.dataset.mobileSurface="management",a.querySelectorAll("#dm-tab-strip, .login-tab, .dm-cloud-category-tab").forEach(n=>{n.dataset.mobileActionBar=""}),a.querySelectorAll(".table-wrap, .dm-cloud-table-scroll, .dm-table-scroll").forEach(n=>{!n.dataset.mobileTable&&window.TableScrollIndicators&&window.TableScrollIndicators.setupTableWrap(n)}))})}function Ft(t){var a;if(!t)return null;const e=(a=window.CSS)!=null&&a.escape?window.CSS.escape(String(t)):String(t).replace(/[^a-zA-Z0-9_-]/g,"");return document.querySelector(`[data-mobile-sheet="${e}"]`)||document.getElementById(String(t))}function jt(t,e=document.activeElement){const a=Ft(t);if(!a)return!1;C&&C!==a&&F("replace"),C=a,Q=e instanceof HTMLElement?e:null,a.hidden=!1,a.setAttribute("aria-hidden","false"),a.dataset.mobileSheetState="open",document.body.dataset.mobileSheetOpen="true";const o=a.querySelector('[autofocus], input, select, textarea, button, [tabindex]:not([tabindex="-1"])');return window.requestAnimationFrame(()=>{var n;return(n=o==null?void 0:o.focus)==null?void 0:n.call(o,{preventScroll:!0})}),!0}function F(t="dismiss"){if(!C)return!1;const e=C;C=null,e.dataset.mobileSheetState="closed",e.setAttribute("aria-hidden","true"),e.hidden=!0,delete document.body.dataset.mobileSheetOpen;const a=Q;return Q=null,t!=="replace"&&window.requestAnimationFrame(()=>{var o;return(o=a==null?void 0:a.focus)==null?void 0:o.call(a,{preventScroll:!0})}),!0}function Wt(t=document){var a,o;const e=t.querySelector('[aria-invalid="true"], input:invalid, select:invalid, textarea:invalid');return(a=e==null?void 0:e.focus)==null||a.call(e,{preventScroll:!1}),(o=e==null?void 0:e.scrollIntoView)==null||o.call(e,{block:"center",behavior:"smooth"}),e||null}function Z(t=document){var s,b;const e=(s=t==null?void 0:t.matches)!=null&&s.call(t,"[data-mobile-action-bar]")?t:(b=t==null?void 0:t.querySelector)==null?void 0:b.call(t,"[data-mobile-action-bar]");if(!e)return null;const a=[...e.querySelectorAll('button, .btn, [role="button"]')].filter(d=>!d.matches("[data-mobile-action-more]")),o=a.find(d=>d.matches(".btn-primary, [data-primary-action]"))||a[0],n=a.find(d=>d!==o)||null;a.forEach(d=>{d.toggleAttribute("data-mobile-primary-action",d===o),d.toggleAttribute("data-mobile-secondary-action",d===n),d.toggleAttribute("data-mobile-overflow-action",d!==o&&d!==n)});const l=a.filter(d=>d.hasAttribute("data-mobile-overflow-action"));let r=e.querySelector("[data-mobile-action-more]");return l.length&&!r&&(r=document.createElement("button"),r.type="button",r.className="btn mobile-action-more",r.dataset.mobileActionMore="true",r.textContent="更多",r.addEventListener("click",()=>{e.dataset.mobileOverflowOpen=e.dataset.mobileOverflowOpen==="true"?"false":"true",r.setAttribute("aria-expanded",e.dataset.mobileOverflowOpen)}),e.appendChild(r)),r&&(r.hidden=l.length===0),e}document.addEventListener("click",t=>{t.target.closest("[data-mobile-sheet-dismiss]")&&F("backdrop")}),document.addEventListener("keydown",t=>{t.key==="Escape"&&C&&F("escape")});function zt(t){var o;const e=(o=t==null?void 0:t.querySelector)==null?void 0:o.call(t,"[data-apk-rail]");if(!e)return;const a=e.querySelector(".apk-rail-chip.is-active");!a||typeof a.scrollIntoView!="function"||a.scrollIntoView({inline:"center",block:"nearest",behavior:"auto"})}function I(){return window.AuthState&&typeof window.AuthState.getCurrentUser=="function"?window.AuthState.getCurrentUser():window.Auth&&window.Auth.currentUser?window.Auth.currentUser:null}function N(){var t,e,a;return window.AuthState&&typeof window.AuthState.getCurrentRole=="function"?window.AuthState.getCurrentRole():String(((t=I())==null?void 0:t.role)||((a=(e=document.body)==null?void 0:e.dataset)==null?void 0:a.role)||"guest").trim()||"guest"}function yt(){if(window.AuthState&&typeof window.AuthState.getCurrentRoles=="function")return window.AuthState.getCurrentRoles();const t=I();return(Array.isArray(t==null?void 0:t.roles)&&t.roles.length?t.roles:[t==null?void 0:t.role].filter(Boolean)).map(a=>String(a||"").trim()).filter(Boolean)}function Ue(t){const e=new Set(yt());return t.some(a=>e.has(a))}function tt(t=N()){const e=String(t||"").trim();return e==="parent"||e==="student"}function wt(t=N()){return Nt[String(t||"").trim()]||String(t||"访客")}function gt(){var t,e;return window.SchoolState&&typeof window.SchoolState.getCurrentSchool=="function"?String(((t=I())==null?void 0:t.school)||window.SchoolState.getCurrentSchool()||"").trim():String(((e=I())==null?void 0:e.school)||window.MY_SCHOOL||localStorage.getItem("MY_SCHOOL")||"").trim()}function et(){const t=document.getElementById("login-overlay"),e=!!(t&&getComputedStyle(t).display!=="none");return!!I()&&!e}function Kt(){if(window.NAV_STRUCTURE)return window.NAV_STRUCTURE;try{return NAV_STRUCTURE}catch(t){return null}}function Qt(){K="",U=null,A=new Map}function Yt(t,e){const a=yt().join("|"),o=t?Object.keys(t).join("|"):"",n=window.CONFIG&&window.CONFIG.showQuery?"report:1":"report:0";return[e,a,o,n].join("::")}function Gt(t){return!(typeof window.canAccessModule=="function"&&!window.canAccessModule(t)||t==="indicator"&&typeof window.isIndicatorModuleVisible=="function"&&!window.isIndicatorModuleVisible()||t==="report-generator"&&typeof window.CONFIG!="undefined"&&window.CONFIG&&!window.CONFIG.showQuery)}function R(){const t=Kt();if(!t)return[];const e=N(),a=Yt(t,e);if(U&&K===a)return U;const o=Object.keys(t).map(n=>{const l=t[n];return{...l,key:n,items:Array.isArray(l==null?void 0:l.items)?l.items.filter(r=>Gt(r.id)):[]}}).filter(n=>n.items.length>0);return K=a,U=o,A=new Map,o}function x(t){if(!t)return null;if(A.has(t))return A.get(t);const e=R();for(const a of e){const o=a.items.find(n=>n.id===t);if(o){const n={...o,categoryKey:a.key,categoryTitle:a.title,categoryColor:a.color};return A.set(t,n),n}}return A.set(t,null),null}function O(){var a,o,n;const t=Ot[N()]||"starter-hub",e=x(t);return e?e.id:((n=(o=(a=R()[0])==null?void 0:a.items)==null?void 0:o[0])==null?void 0:n.id)||"starter-hub"}function T(){var t;return((t=document.querySelector(".section.active"))==null?void 0:t.id)||O()}function V(){return x(T())||x(O())||null}function at(){const t=R(),e=V();if(e){const o=t.find(n=>n.key===e.categoryKey);if(o)return o}const a=typeof window.getCurrentNavCategory=="function"?String(window.getCurrentNavCategory()||"").trim():"";return t.find(o=>o.key===a)||t[0]||null}function P(t){const e=new Set;return t.filter(a=>!a||!a.id||e.has(a.id)?!1:(e.add(a.id),!0))}function kt(){try{const t=JSON.parse(localStorage.getItem(ct)||"[]");return Array.isArray(t)?t.map(e=>String(e||"").trim()).filter(Boolean):[]}catch(t){return[]}}function Xt(t){try{localStorage.setItem(ct,JSON.stringify(t.map(e=>String(e||"").trim()).filter(Boolean).slice(0,W)))}catch(e){}}function Jt(t){const e=x(t);e&&Xt([e.id,...kt().filter(a=>a!==e.id)])}function ot(t=W){return P(kt().map(e=>x(e)).filter(Boolean)).slice(0,t)}function vt(t=z){const e=Bt[N()]||[],a=[...ot(t),V(),x(O()),...e.map(o=>x(o)),...qt.map(o=>x(o))];return P(a).slice(0,t)}function Fe(){var a;const t=document.getElementById("mode-badge"),e=String((t==null?void 0:t.textContent)||"").trim();return e||String(((a=window.CONFIG)==null?void 0:a.name)||"学校工作台").trim()}function nt(){var e;const t=document.getElementById("cohort-selector");return(e=t==null?void 0:t.selectedOptions)!=null&&e[0]&&String(t.selectedOptions[0].textContent||t.value||"届别未选择").trim()||"届别未选择"}function Zt(){const t=document.getElementById("cohort-selector");return t?Array.from(t.options||[]).filter(e=>String(e.value||"").trim()).map(e=>({value:String(e.value||"").trim(),label:String(e.textContent||e.value||"").trim()})):[]}function te(){return document.querySelector("main.app-main")}function St(){const t=te();if(t&&typeof t.scrollTo=="function"){t.scrollTo({top:0,behavior:"auto"});return}const e=document.scrollingElement||document.documentElement||document.body;if(e&&typeof e.scrollTo=="function"){e.scrollTo({top:0,behavior:"auto"});return}typeof window.scrollTo=="function"&&window.scrollTo({top:0,behavior:"auto"})}function ee(t=document){if(!f())return;t.querySelectorAll(".table-wrap table, table.comparison-table, table.fluent-table, #tb-query, #studentDetailTable").forEach(a=>{const o=ae(a);o.length&&(a.classList.add("mobile-card-table"),Array.from(a.querySelectorAll("tbody tr")).forEach(n=>{let l=String(n.getAttribute("data-mobile-card-title")||"").trim();Array.from(n.children).forEach((r,s)=>{if(!(r instanceof HTMLElement)||r.hasAttribute("colspan"))return;const b=String(o[s]||`字段${s+1}`).replace(/\s+/g," ").trim(),d=String(r.textContent||"").replace(/\s+/g," ").trim();!l&&d&&s<=1&&(l=d),r.setAttribute("data-label",b)}),l&&n.setAttribute("data-mobile-card-title",l)}))})}function ae(t){const e=Array.from(t.querySelectorAll("thead tr"));if(!e.length)return[];const a=[];let o=0;return e.forEach((n,l)=>{a[l]||(a[l]=[]);let r=0;Array.from(n.children).forEach(s=>{for(;a[l][r];)r+=1;const b=Math.max(parseInt(s.getAttribute("colspan")||"1",10)||1,1),d=Math.max(parseInt(s.getAttribute("rowspan")||"1",10)||1,1),m=String(s.textContent||"").replace(/\s+/g," ").trim();for(let D=0;D<d;D+=1){a[l+D]||(a[l+D]=[]);for(let st=0;st<b;st+=1)a[l+D][r+st]=m}r+=b,r>o&&(o=r)})}),Array.from({length:o},(n,l)=>{const r=[];return a.forEach(s=>{const b=String((s==null?void 0:s[l])||"").trim();!b||r[r.length-1]===b||r.push(b)}),r.join(" / ")})}function it(t=document){if(!f())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;ee(e)}function Et(t=document){if(!f())return;const e=t&&typeof t.querySelectorAll=="function"?t:document.querySelector(".section.active")||document;clearTimeout(window.__RESPONSIVE_TABLE_REFRESH_TIMER__||0),window.__RESPONSIVE_TABLE_REFRESH_TIMER__=window.setTimeout(()=>{it(e)},60)}function oe(t=document.querySelector(".section.active")||document.getElementById("app")||document.body){if(typeof MutationObserver!="function")return;const e=t instanceof HTMLElement?t:document.querySelector(".section.active")||document.getElementById("app")||document.body||document.documentElement;if(!e||window.__RESPONSIVE_TABLE_OBSERVER__&&pt===e)return;window.__RESPONSIVE_TABLE_OBSERVER__&&typeof window.__RESPONSIVE_TABLE_OBSERVER__.disconnect=="function"&&window.__RESPONSIVE_TABLE_OBSERVER__.disconnect();const a=new MutationObserver(o=>{if(!f())return;o.some(l=>Array.from(l.addedNodes||[]).some(r=>{var s;return r instanceof HTMLElement?r.matches("table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table, .section, #parent-view-container")||!!((s=r.querySelector)!=null&&s.call(r,"table, tbody, tr, td, .table-wrap, .comparison-table, .fluent-table")):!1}))&&Et(e)});a.observe(e,{childList:!0,subtree:!0}),window.__RESPONSIVE_TABLE_OBSERVER__=a,pt=e}window.refreshResponsiveMobileTables=it;function ne(t=document){f()&&(t.querySelectorAll('.section [style*="grid-template-columns"]').forEach(e=>{e.closest("#parent-view-container")||e.classList.add("mobile-stack-grid")}),t.querySelectorAll('.section [style*="display:flex"]').forEach(e=>{e.closest("#parent-view-container")||e.closest("#apk-mobile-shell")||e.children.length<2||e.classList.add("mobile-wrap-row")}))}function ie(t=document){if(!f())return;t.querySelectorAll(".table-wrap").forEach(a=>{if(a.__scrollListenerAttached__)return;const o=()=>{const n=a.scrollLeft+a.clientWidth>=a.scrollWidth-2;a.classList.toggle("scrolled-end",n)};a.addEventListener("scroll",o,{passive:!0}),a.__scrollListenerAttached__=!0,o()})}function re(){if(document.getElementById("mobile-experience-styles"))return;const t=document.createElement("style");t.id="mobile-experience-styles",t.textContent=`
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
        `,document.head.appendChild(t)}function xt(){const t=document.querySelector(".section.active")||document;re(),Y(t),it(t),Et(t),oe(t),ne(t),ie(t),G(document),X(document),J(document)}function le(t){if(!(t instanceof HTMLElement))return!1;const e=window.getComputedStyle(t);return e.display==="none"||e.visibility==="hidden"||Number(e.opacity||1)===0||t.getAttribute("aria-hidden")==="true"||t.hidden?!1:t.getClientRects().length>0}function Ct(){if(Tt(),window.Swal&&typeof window.Swal.isVisible=="function"&&window.Swal.isVisible())return!0;const t=[".swal2-container",".modal",'[role="dialog"]','[aria-modal="true"]',".dialog-overlay",".dialog-backdrop"];return Array.from(document.querySelectorAll(t.join(","))).some(e=>{if(!(e instanceof HTMLElement)||e.closest("#apk-mobile-shell")||!le(e))return!1;const a=window.getComputedStyle(e),o=Number(a.zIndex||0);return a.position==="fixed"||o>=1e3})}function Tt(){const t=document.querySelector(".swal2-container.swal2-backdrop-show");if(!f()||!t||t.querySelector("input,textarea,select,.swal2-cancel,.swal2-deny")||t.querySelector(".swal2-icon-error,.swal2-icon-warning,.swal2-icon-question"))return!1;const e=String(t.innerText||"");return["安全","警告","失败","错误","确认","请确认","未完成","必须","需要完成","删除","覆盖","退出","清空","重置","取消","放弃","丢失","不可恢复","永久","移除","注销"].some(o=>e.includes(o))?!1:(window.Swal&&typeof window.Swal.close=="function"?window.Swal.close():t.remove(),!0)}function se(t=document.getElementById("apk-mobile-shell")){t&&(t.dataset.modalOpen=Ct()?"true":"false")}function ce(){Rt.forEach((t,e)=>{window.setTimeout(()=>{const a=document.getElementById("student-details");if(!(!a||!a.classList.contains("active"))){if(typeof window.requestStudentDetailsPrimaryFocus=="function"){window.requestStudentDetailsPrimaryFocus(e);return}typeof window.focusStudentDetailsPrimaryFlow=="function"&&window.focusStudentDetailsPrimaryFlow()}},t)})}function de(){["mobile-manager-app","mobile-query-shell"].forEach(t=>{const e=document.getElementById(t);e&&(e.setAttribute("aria-hidden","true"),e.style.display="none")})}function ue(){const t=document.getElementById("app");if(t){if(!f()){t.classList.remove("hidden"),t.style.display="";return}if(!et()){t.classList.add("hidden"),t.style.display="none";return}tt()||(t.classList.remove("hidden"),t.style.display="")}}function pe(){const t=document.querySelector('meta[name="theme-color"]');t&&t.setAttribute("content",document.body.classList.contains("dark-mode")?"#08111d":"#eef3f8")}function he(){const t=!!(S!=null&&S.matches);document.body.dataset.nativeApp=dt?"true":"false",document.body.dataset.systemTheme=t?"dark":"light",dt&&f()&&(document.body.classList.toggle("dark-mode",t),localStorage.setItem("theme-dark",t?"true":"false")),document.documentElement.style.colorScheme=document.body.classList.contains("dark-mode")?"dark":"light",pe()}function be(t){const e=document.getElementById("cohort-selector");!e||!t||(e.value=t,e.dispatchEvent(new Event("change",{bubbles:!0})),h(""),_.forEach(a=>{window.setTimeout(()=>{St(),c()},a)}))}function y(){return{workbench:"学校工作台",mobileWorkbench:"移动工作台",mobilePreparing:"移动工作台正在准备中",openLibrary:"打开模块资源库",openSearch:"打开全局搜索",closeSheet:"关闭面板",closeLibrary:"关闭模块资源库",cohortPlaceholder:"届别未选择",home:"工作台",modules:"模块",recent:"最近",account:"我的",openModule:"打开该模块",currentCategoryEmpty:"当前分类暂无可用模块",current:"当前",open:"打开",workspaceNote:"Workspace",moduleOverviewTitle:"模块总览",moduleOverviewCopy:"按分类切换工作模块，减少手机端来回翻找入口的次数。",noModules:"当前账号还没有可切换的模块入口。",quickTitle:"最近与常用",quickCopy:"先给你最近用过的模块，再补高频入口，减少反复进出分类面板。",quickHeroTitle:"跨分类切换先看这里",quickHeroCopy:"默认优先展示最近使用，同时保留完整模块资源库入口。",recentModulesTitle:"最近使用",recentModulesNote:"Recent Modules",suggestedTitle:"高频推荐",suggestedNote:"Suggested",utilitiesTitle:"系统动作",utilitiesNote:"Utilities",noRecent:"还没有可回跳的最近模块，可以先从当前分类或全部模块进入。",appLibraryTitle:"模块资源库",appLibraryCopy:"像 App 资源库一样集中浏览全部模块，支持最近使用、当前分类和快速搜索。",appLibrarySearch:"搜索模块、功能或分类",appLibrarySearchTitle:"搜索结果",appLibrarySearchNote:"Results",appLibrarySearchEmpty:"没有匹配的模块，试试更短的关键词。",appLibraryCurrentTitle:"当前分类",appLibraryCurrentNote:"Now Browsing",appLibraryAllTitle:"全部分类",appLibraryAllNote:"App Library",allModulesTitle:"全部模块",allModulesCopy:"找不到所需功能时，直接打开完整模块总览。",searchTitle:"全局搜索",searchCopy:"快速搜索学生、模块和常用入口。",cohortsTitle:"切换届别",cohortsCopy:"在不同届别工作区之间快速跳转。",passwordTitle:"修改密码",passwordCopy:"直接打开当前账号的密码修改入口。",logoutTitle:"退出登录",logoutCopy:"返回登录页，重新选择账号进入。",accountTitle:"账号与设置",accountCopy:"APK 默认跟随系统主题，并把常用设置集中到这一层。",currentSchool:"当前学校",currentCohort:"当前届别",themeMode:"主题模式",themeDark:"深色",themeLight:"浅色",followSystem:"跟随系统",runtimeEnv:"运行环境",mobileBrowser:"移动浏览器",notLoggedIn:"未登录",unknownSchool:"未识别学校",switchCohortTitle:"切换届别",switchCohortCopy:"统一从这里切届别，避免手机端入口与工作区状态脱节。",noCohorts:"暂无可切换届别。",noCohortChoices:"当前没有可切换的届别，请先完成数据恢复。",usingCurrentCohort:"当前正在使用的届别。",switchToThisCohort:"点击切换到这个届别。"}}function me(){return document.body.dataset.systemTheme==="dark"?y().themeDark:y().themeLight}function fe(t,e=null){return[t==null?void 0:t.text,t==null?void 0:t.hint,t==null?void 0:t.id,e==null?void 0:e.title,e==null?void 0:e.eyebrow].filter(Boolean).join(" ").toLowerCase()}function ye(){const t=String(w||"").trim().toLowerCase();return t?P(R().flatMap(e=>e.items.filter(a=>fe(a,e).includes(t)).map(a=>({...a,categoryTitle:e.title,categoryKey:e.key,categoryColor:e.color})))):[]}function q(t,e){return`
            <div class="apk-sheet-header">
                <div>
                    <strong>${i(t)}</strong>
                    <span>${i(e)}</span>
                </div>
                <button type="button" class="apk-shell-icon is-compact" data-apk-action="close-sheet" aria-label="${i(y().closeSheet)}">
                    <i class="ti ti-x"></i>
                </button>
            </div>
        `}function v(t,e){return`
            <div class="apk-sheet-section-head">
                <span class="apk-sheet-section-title">${i(t)}</span>
                <span class="apk-sheet-section-note">${i(e)}</span>
            </div>
        `}function j(t,e){const a=y();return`
            <button type="button" class="apk-sheet-card${t.id===e?" is-active":""}" data-apk-module="${i(t.id)}">
                <strong>${i(t.text||t.id)}</strong>
                <span>${i(t.hint||t.categoryTitle||a.openModule)}</span>
            </button>
        `}function k(t,e,a,o,n=""){return`
            <button type="button" class="apk-sheet-card apk-sheet-card--action${n?` ${n}`:""}" data-apk-action="${i(t)}">
                <i class="${i(o)}"></i>
                <strong>${i(e)}</strong>
                <span>${i(a)}</span>
            </button>
        `}function Mt(t,e){const a=y(),o=t.id===e;return`
            <button type="button" class="apk-switch-row${o?" is-active":""}" data-apk-module="${i(t.id)}">
                <span class="apk-switch-row-copy">
                    <strong>${i(t.text||t.id)}</strong>
                    <span>${i(t.hint||t.categoryTitle||"跨分类快速直达")}</span>
                </span>
                <span class="apk-switch-row-meta">${o?a.current:a.open}</span>
            </button>
        `}function Lt(t,e){const a=String(t.text||t.id||"").trim().slice(0,2)||"模块";return`
            <button type="button" class="apk-library-mini${t.id===e?" is-active":""}" data-apk-module="${i(t.id)}">
                <span class="apk-library-mini-badge">${i(a)}</span>
                <span class="apk-library-mini-copy">
                    <strong>${i(t.text||t.id)}</strong>
                    <span>${i(t.hint||t.categoryTitle||"模块")}</span>
                </span>
            </button>
        `}function we(t,e){return`
            <article class="apk-library-card" style="--apk-library-accent:${i(t.color||"#2563eb")}">
                <div class="apk-library-card-head">
                    <div>
                        <strong>${i(t.title)}</strong>
                        <span>${i(`${t.items.length} 个模块`)}</span>
                    </div>
                    <span class="apk-library-card-count">${i(String(t.items.length).padStart(2,"0"))}</span>
                </div>
                <div class="apk-library-mini-grid">
                    ${t.items.slice(0,4).map(a=>Lt({...a,categoryTitle:t.title},e)).join("")}
                </div>
            </article>
        `}function ge(){var d;const t=y(),e=T(),a=String(w||"").trim(),o=ye(),n=at(),l=P([...ot(6),V()]).slice(0,6),r=new Set(l.map(m=>m.id)),s=vt(6+r.size).filter(m=>!r.has(m.id)).slice(0,6),b=R();return`
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
                        ${v(t.appLibrarySearchTitle,t.appLibrarySearchNote)}
                        ${o.length?`<div class="apk-sheet-grid apk-library-results">${o.map(m=>j(m,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.appLibrarySearchEmpty)}</div>`}
                    </section>
                `:`
                    <section class="apk-library-section">
                        ${v(t.recentModulesTitle,t.recentModulesNote)}
                        ${l.length?`<div class="apk-switch-list">${l.map(m=>Mt(m,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.noRecent)}</div>`}
                    </section>
                    ${s.length?`
                            <section class="apk-library-section">
                                ${v(t.suggestedTitle,t.suggestedNote)}
                                <div class="apk-sheet-grid apk-library-results">
                                    ${s.map(m=>j(m,e)).join("")}
                                </div>
                            </section>
                        `:""}
                    ${(d=n==null?void 0:n.items)!=null&&d.length?`
                            <section class="apk-library-section">
                                ${v(t.appLibraryCurrentTitle,t.appLibraryCurrentNote)}
                                <article class="apk-library-spotlight" style="--apk-library-accent:${i(n.color||"#2563eb")}">
                                    <div class="apk-library-card-head">
                                        <div>
                                            <strong>${i(n.title)}</strong>
                                            <span>${i(`${n.items.length} 个模块`)}</span>
                                        </div>
                                        <span class="apk-library-card-count">${i(String(n.items.length).padStart(2,"0"))}</span>
                                    </div>
                                    <div class="apk-library-mini-grid">
                                        ${n.items.slice(0,4).map(m=>Lt({...m,categoryTitle:n.title},e)).join("")}
                                    </div>
                                </article>
                            </section>
                        `:""}
                    <section class="apk-library-section">
                        ${v(t.appLibraryAllTitle,t.appLibraryAllNote)}
                        <div class="apk-library-clusters">
                            ${b.map(m=>we(m,e)).join("")}
                        </div>
                    </section>
                `}
        `}function rt(){let t=document.getElementById("apk-mobile-shell");if(t)return t;const e=y();return t=document.createElement("div"),t.id="apk-mobile-shell",t.setAttribute("aria-hidden","true"),t.innerHTML=`
            <div class="apk-shell-top">
                <div class="apk-shell-topbar apk-shell-surface">
                    <button type="button" class="apk-shell-icon" data-apk-action="library" aria-label="${i(e.openLibrary)}">
                        <i class="ti ti-layout-sidebar-left-expand"></i>
                    </button>
                    <div class="apk-shell-copy">
                        <span class="apk-shell-kicker" data-apk-field="role">${i(e.workbench)}</span>
                        <strong class="apk-shell-title" data-apk-field="title">澄见</strong>
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
            <div class="apk-shell-content" data-apk-content></div>
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
                <button type="button" class="apk-shell-tab" data-apk-tab="library">
                    <i class="ti ti-apps"></i>
                    <span>${i(e.modules)}</span>
                </button>
                <button type="button" class="apk-shell-tab" data-apk-tab="account">
                    <i class="ti ti-user-circle"></i>
                    <span>${i(e.account)}</span>
                </button>
            </div>
        `,t.addEventListener("click",Re),t.addEventListener("input",Ie),document.body.appendChild(t),t}function ke(){const t=y(),e=R(),a=T();return e.length?[q(t.moduleOverviewTitle,t.moduleOverviewCopy),...e.map(o=>`
                <section class="apk-sheet-section">
                    ${v(o.title,o.eyebrow||t.workspaceNote)}
                    <div class="apk-sheet-grid">
                        ${o.items.map(n=>j({...n,categoryTitle:o.title},a)).join("")}
                    </div>
                </section>
            `)].join(""):`${q(t.moduleOverviewTitle,t.noModules)}
                <div class="apk-sheet-empty">${i(t.noModules)}</div>`}function ve(){const t=y(),e=T(),a=P([...ot(W),V()]).slice(0,4),o=new Set(a.map(r=>r.id)),n=vt(z+o.size).filter(r=>!o.has(r.id)).slice(0,z),l=[k("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand"),k("search",t.searchTitle,t.searchCopy,"ti ti-search"),k("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2"),typeof window.openUserPasswordModal=="function"?k("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):"",k("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")].filter(Boolean);return`
            ${q(t.quickTitle,t.quickCopy)}
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
                ${v(t.recentModulesTitle,t.recentModulesNote)}
                ${a.length?`<div class="apk-switch-list">${a.map(r=>Mt(r,e)).join("")}</div>`:`<div class="apk-sheet-empty">${i(t.noRecent)}</div>`}
            </section>
            ${n.length?`
                    <section class="apk-sheet-section">
                        ${v(t.suggestedTitle,t.suggestedNote)}
                        <div class="apk-sheet-grid">
                            ${n.map(r=>j(r,e)).join("")}
                        </div>
                    </section>
                `:""}
            <section class="apk-sheet-section">
                ${v(t.utilitiesTitle,t.utilitiesNote)}
                <div class="apk-sheet-grid">
                    ${l.join("")}
                </div>
            </section>
        `}function Se(){const t=y(),e=I();return`
            ${q(t.accountTitle,t.accountCopy)}
            <section class="apk-sheet-section">
                <div class="apk-account-card">
                    <div class="apk-account-name">${i((e==null?void 0:e.name)||t.notLoggedIn)}</div>
                    <div class="apk-account-role">${i(wt())}</div>
                    <div class="apk-account-grid">
                        <div class="apk-account-row">
                            <span>${i(t.currentSchool)}</span>
                            <strong>${i(gt()||t.unknownSchool)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.currentCohort)}</span>
                            <strong>${i(nt())}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.themeMode)}</span>
                            <strong>${i(`${t.followSystem} · ${me()}`)}</strong>
                        </div>
                        <div class="apk-account-row">
                            <span>${i(t.runtimeEnv)}</span>
                            <strong>${i(t.mobileBrowser)}</strong>
                        </div>
                    </div>
                </div>
            </section>
            <section class="apk-sheet-section">
                <div class="apk-sheet-grid">
                    ${k("cohorts",t.cohortsTitle,t.cohortsCopy,"ti ti-id-badge-2")}
                    ${k("search",t.searchTitle,t.searchCopy,"ti ti-search")}
                    ${k("library",t.allModulesTitle,t.allModulesCopy,"ti ti-layout-sidebar-left-expand")}
                    ${typeof window.openUserPasswordModal=="function"?k("password",t.passwordTitle,t.passwordCopy,"ti ti-lock"):""}
                    ${k("logout",t.logoutTitle,t.logoutCopy,"ti ti-logout","is-danger")}
                </div>
            </section>
        `}function Ee(){var o;const t=y(),e=Zt(),a=((o=document.getElementById("cohort-selector"))==null?void 0:o.value)||"";return e.length?`
            ${q(t.switchCohortTitle,t.switchCohortCopy)}
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
        `:`${q(t.switchCohortTitle,t.noCohortChoices)}
                <div class="apk-sheet-empty">${i(t.noCohorts)}</div>`}function xe(t){const e=t.querySelector("[data-apk-library-panel]");e&&E(e,p?ge():"")}function Ce(){const e=rt().querySelector("[data-apk-sheet-panel]");if(e){if(!u){E(e,"");return}if(u==="modules"){E(e,ke());return}if(u==="quick"){E(e,ve());return}if(u==="account"){E(e,Se());return}u==="cohorts"&&E(e,Ee())}}function Te(t){var r;const e=y(),a=t.querySelector("[data-apk-rail]");if(!a)return;const o=at(),n=T();if(!((r=o==null?void 0:o.items)!=null&&r.length)){E(a,`<div class="apk-rail-empty">${i(e.currentCategoryEmpty)}</div>`);return}const l=o.items.map(s=>`
            <button type="button" class="apk-rail-chip${s.id===n?" is-active":""}" data-apk-module="${i(s.id)}">
                ${i(s.text||s.id)}
            </button>
        `).join("");E(a,l)&&window.requestAnimationFrame(()=>zt(t))}function Me(t){const e=T(),a=O();t.querySelectorAll(".apk-shell-tab").forEach(o=>{const n=o.getAttribute("data-apk-tab");Ht(o,"is-active",!p&&(n==="home"&&!u&&e===a||n==="modules"&&u==="modules"||n==="quick"&&u==="quick"||n==="library"&&p||n==="account"&&u==="account"))})}function H(){const t=y(),e=rt(),a=V(),o=at(),n=[gt()||t.unknownSchool,(o==null?void 0:o.title)||t.workbench,nt()].filter(Boolean).join(" · ");Pt(e,"--apk-accent",(a==null?void 0:a.categoryColor)||(o==null?void 0:o.color)||"#2563eb"),e.setAttribute("aria-hidden","false"),$(e,"sheetOpen",u?"true":"false"),$(e,"sheetMode",u||""),$(e,"libraryOpen",p?"true":"false"),$(e,"mobileSheetOpen",u?"true":"false"),$(e,"mobileLibraryOpen",p?"true":"false"),$(e,"mobileCurrentModule",(a==null?void 0:a.id)||T()||"");const l={role:`${wt()}工作台`,title:(a==null?void 0:a.text)||"澄见",subtitle:n,cohort:nt(),mode:t.workbench};Object.entries(l).forEach(([r,s])=>{const b=e.querySelector(`[data-apk-field="${r}"]`);Vt(b,s)}),se(e),Te(e),Ce(),xe(e),Me(e)}function Le(t,e={}){p=!!t,p&&(u=""),!p&&e.resetQuery!==!1&&(w=""),H()}function M(t){Le(typeof t=="boolean"?t:!p)}function h(t=""){u=t,t&&(p=!1,w=""),H()}function L(t){h(u===t?"":t)}function lt(t){!t||typeof window.switchTab!="function"||(u="",p=!1,w="",H(),St(),window.switchTab(t),Jt(t),t==="student-details"&&ce(),_.forEach(e=>{window.setTimeout(()=>{var a;(a=document.getElementById(t))!=null&&a.classList.contains("active")&&(xt(),t==="student-details"&&typeof window.requestStudentDetailsPrimaryFocus=="function"&&window.requestStudentDetailsPrimaryFocus()),c()},e)}))}function _e(){p=!1,w="",h(""),typeof window.openSpotlight=="function"&&window.openSpotlight()}function Ae(){p=!1,w="",h(""),typeof window.openUserPasswordModal=="function"&&window.openUserPasswordModal()}function $e(t){if(t==="home"){lt(O());return}if(t==="modules"){L("modules");return}if(t==="quick"){L("quick");return}if(t==="library"){M();return}t==="account"&&L("account")}function Ie(t){const e=t.target.closest("[data-apk-library-search]");if(!e)return;const a=typeof e.selectionStart=="number"?e.selectionStart:String(e.value||"").length;if(w=String(e.value||""),H(),!p)return;const o=document.querySelector("[data-apk-library-search]");o&&(typeof o.focus=="function"&&o.focus({preventScroll:!0}),typeof o.setSelectionRange=="function"&&o.setSelectionRange(a,a))}function Re(t){const e=t.target.closest("[data-apk-action], [data-apk-module], [data-apk-cohort], [data-apk-tab]");if(!e)return;t.preventDefault();const a=e.getAttribute("data-apk-module");if(a){lt(a);return}const o=e.getAttribute("data-apk-cohort");if(o){be(o);return}const n=e.getAttribute("data-apk-tab");if(n){$e(n);return}const l=e.getAttribute("data-apk-action");if(l==="close-sheet"){h("");return}if(l==="library"){M();return}if(l==="close-library"){M(!1);return}if(l==="modules"){L("modules");return}if(l==="quick"){L("quick");return}if(l==="account"){L("account");return}if(l==="cohorts"){L("cohorts");return}if(l==="search"){_e();return}if(l==="password"){Ae();return}l==="logout"&&window.Auth&&typeof window.Auth.logout=="function"&&(p=!1,w="",h(""),window.Auth.logout())}function Oe(t){var a;if(!f()||!et()||tt()||Ct())return;const e=(a=t.touches)==null?void 0:a[0];e&&(g={startX:e.clientX,startY:e.clientY,canOpenLibrary:!p&&!u&&e.clientX<=28,canCloseLibrary:p})}function qe(t){var n;if(!g)return;const e=(n=t.touches)==null?void 0:n[0];if(!e)return;const a=e.clientX-g.startX,o=e.clientY-g.startY;if(Math.abs(o)>42){g=null;return}if(g.canOpenLibrary&&a>=80){M(!0),g=null;return}g.canCloseLibrary&&a<=-80&&(M(!1),g=null)}function _t(){g=null}function B(t,e,a){if(!t||typeof t[e]!="function"||t[e][a])return;const o=t[e],n=function(){const l=o.apply(this,arguments);return c(),_.forEach(r=>{window.setTimeout(c,r)}),l};n[a]=!0,t[e]=n}function Be(){if(window.Swal&&(B(window.Swal,"close","__apkMobileWrapped__"),typeof window.Swal.fire=="function"&&!window.Swal.fire.__apkMobileWrapped__)){const t=window.Swal.fire,e=function(){const a=t.apply(window.Swal,arguments);return c(),window.setTimeout(Tt,1200),_.forEach(o=>{window.setTimeout(c,o)}),a&&typeof a.finally=="function"&&a.finally(()=>{_.forEach(o=>{window.setTimeout(c,o)})}),a};e.__apkMobileWrapped__=!0,window.Swal.fire=e}}function Ne(){B(window,"switchTab","__apkMobileWrapped__"),B(window,"renderNavigation","__apkMobileWrapped__"),B(window,"switchNavCategory","__apkMobileWrapped__"),window.Auth&&(B(window.Auth,"applyRoleView","__apkMobileWrapped__"),B(window.Auth,"renderParentView","__apkMobileWrapped__")),Be()}function Ve(t){const e=document.querySelector("main.app-main"),a=document.getElementById("app"),o=t.querySelector("[data-apk-content]");!e||!o||t.contains(e)||(e.dataset.originalParent||(e.dataset.originalParent="app"),o.appendChild(e))}function Pe(){const t=document.querySelector("main.app-main"),e=document.getElementById("app"),a=document.getElementById("apk-mobile-shell");!t||!e||a&&a.contains(t)&&e.appendChild(t)}function He(){Qt(),Ne(),he();const t=f(),e=t&&et()&&!tt();document.body.dataset.mobileQuery=t?"true":"false",e?document.body.dataset.mobileArchitecture="apk-v2":delete document.body.dataset.mobileArchitecture,ue(),de();const a=rt();if(ht(a),a.style.display=e?"block":"none",a.setAttribute("aria-hidden",e?"false":"true"),!e){u="",p=!1,w="",a.dataset.sheetOpen="false",a.dataset.sheetMode="",a.dataset.libraryOpen="false",a.dataset.mobileSheetOpen="false",a.dataset.mobileLibraryOpen="false",a.dataset.mobileCurrentModule="",a.dataset.modalOpen="false",Pe();return}Ve(a),xt(),H()}function c(){clearTimeout(ut),ut=window.setTimeout(He,60)}const At={switchTab(t){const e={home:O(),students:"student-details",analysis:"summary"};if(t==="me"){h("account");return}const a=e[t]||t;lt(a)},renderStudentList(){c()},showStudentDetail(){c()},renderAnalysis(){c()},openModules(){h("modules")},openLibrary(){M(!0)},openQuickActions(){h("quick")},openAccountSheet(){h("account")},openCohortSheet(){h("cohorts")},refresh:c};window.MobMgr=At,window.MobileQueryUI={refresh:c,openLibrary:()=>M(!0),openModules:()=>h("modules"),openQuick:()=>h("quick"),openAccount:()=>h("account"),openCohorts:()=>h("cohorts")},window.MobileExperienceRuntime=Object.assign(window.MobileExperienceRuntime||{},{install:ft,syncCompactState:Y,isCompactViewport:mt,openSheet:jt,closeSheet:F,syncActionBar:Z,focusFirstInvalid:Wt,annotateCoreMobileModules:G,annotateAnalysisMobileModules:X,annotateManagementMobileSurfaces:J}),window.MobDashboardMgr=window.MobDashboardMgr||{showToast(t){window.UI&&typeof window.UI.toast=="function"?window.UI.toast(t,"info"):typeof window.showToast=="function"?window.showToast(t):window.alert(t)}},window.switchMobileTab=t=>At.switchTab(t),window.matchMedia&&(S=window.matchMedia("(prefers-color-scheme: dark)"),typeof S.addEventListener=="function"?S.addEventListener("change",c):typeof S.addListener=="function"&&S.addListener(c)),window.addEventListener("cloud-load-state",c),window.addEventListener("resize",c),window.addEventListener("orientationchange",c),window.visualViewport&&(window.visualViewport.addEventListener("resize",c,{passive:!0}),window.visualViewport.addEventListener("scroll",()=>ht(),{passive:!0})),window.addEventListener("load",c);function De(){const t=document.getElementById("mobile-skeleton");t&&f()&&(t.classList.add("hidden"),setTimeout(()=>{t.remove()},350))}function $t(){f()&&setTimeout(De,200)}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",$t):$t(),window.addEventListener("pageshow",c),window.addEventListener("focus",c),document.addEventListener("touchstart",Oe,{passive:!0}),document.addEventListener("touchmove",qe,{passive:!0}),document.addEventListener("touchend",_t,{passive:!0}),document.addEventListener("touchcancel",_t,{passive:!0}),document.addEventListener("resume",c,!1),document.addEventListener("visibilitychange",()=>{document.hidden||c()}),ft(),_.forEach(t=>{window.setTimeout(c,t)}),c(),window.__MOBILE_MANAGER_PATCHED__=!0,window.__MOBILE_APP_RUNTIME_PATCHED__=!0})();
