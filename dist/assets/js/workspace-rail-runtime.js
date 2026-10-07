(function(){const N="(min-width: 1100px)",w="school:sidebar:compact:v1";let g=0,v=!0;try{v=localStorage.getItem(w)!=="expanded"}catch(e){}const y=new Map;let h=0,S=!1,p="";function c(){return window.matchMedia(N).matches}function k(){return document.getElementById("app-sidebar")}function A(){return Array.from(document.querySelectorAll('[data-sidebar-toggle="true"]'))}function E(e){A().forEach(t=>{const o=!!e,n=o?"展开左侧工作区":"收起左侧工作区";t.setAttribute("aria-label",n),t.setAttribute("title",n),t.setAttribute("aria-pressed",o?"true":"false"),t.setAttribute("aria-expanded",String(!o)),t.setAttribute("aria-controls","app-sidebar");const s=t.querySelector('[data-sidebar-toggle-icon="true"]');s&&(s.className="ti ti-menu-2")})}function b(e,t){const o=k();if(!o)return;const n=!t||t.rememberState!==!1,s=!!e,a=s&&c();if(n){v=s;try{localStorage.setItem(w,s?"compact":"expanded")}catch(l){}}o.classList.toggle("is-collapsed",a),document.body.classList.toggle("shell-sidebar-collapsed",a),c()||(o.classList.remove("is-collapsed"),document.body.classList.remove("shell-sidebar-collapsed")),E(c()?a:!o.classList.contains("show-mobile"));const i=document.getElementById("workspace-sidebar-backdrop");i&&(i.hidden=!c()||a),typeof window.refreshShellEnhancements=="function"&&window.refreshShellEnhancements()}function $(e){const t=k();if(!t)return;if(!c()){t.classList.toggle("show-mobile"),E(!t.classList.contains("show-mobile"));return}const o=typeof e=="boolean"?!!e:!t.classList.contains("is-collapsed");b(o)}function L(){b(v,{rememberState:!1})}function O(){var t;if(document.getElementById("workspace-sidebar-backdrop"))return;const e=document.createElement("button");e.id="workspace-sidebar-backdrop",e.type="button",e.hidden=!0,e.tabIndex=-1,e.setAttribute("aria-label","关闭导航"),e.addEventListener("click",()=>b(!0)),(t=document.getElementById("app"))==null||t.append(e),document.addEventListener("keydown",o=>{var s,a,i;if(o.key!=="Escape")return;const n=document.getElementById("shell-account-menu");n!=null&&n.open?(n.open=!1,(s=n.querySelector("summary"))==null||s.focus()):c()&&!((a=k())!=null&&a.classList.contains("is-collapsed"))&&(b(!0),(i=A()[0])==null||i.focus())}),document.addEventListener("click",o=>{const n=document.getElementById("shell-account-menu");n!=null&&n.open&&(!n.contains(o.target)||o.target.closest("#shell-account-panel button"))&&(n.open=!1)},!0)}function C(e){const t=e.closest(".section[id]");return t&&t.id?t.id:e.id?e.id:"analysis-layout-"+Array.from(document.querySelectorAll(".analysis-results-layout")).indexOf(e)}function P(e){const t=C(e);return y.has(t)||y.set(t,!0),y.get(t)}function F(e){return e?e.querySelectorAll(".side-nav-link").length:0}function B(e){const t=e.__analysisSideNav,o=e.__analysisCollapseButton,n=e.__analysisRevealButton;if(!t||!o||!n)return;const s=e.__analysisRailTitle||"功能导航",a=F(t),i=e.classList.contains("is-side-collapsed"),l=o.querySelector('[data-rail-label="true"]');l&&(l.textContent="收起"+s);const d=n.querySelector('[data-rail-label="true"]');d&&(d.textContent="展开"+s);const r=o.querySelector('[data-rail-count="true"]');r&&(r.textContent=String(a));const f=n.querySelector('[data-rail-count="true"]');f&&(f.textContent=String(a)),o.setAttribute("aria-pressed",i?"true":"false"),n.setAttribute("aria-pressed",i?"true":"false")}function _(e,t,o){if(!e)return;const n=!o||o.rememberState!==!1,s=!!t,a=s&&c(),i=C(e);n&&y.set(i,s),e.classList.toggle("is-side-collapsed",a),B(e)}function I(e,t,o){const n=document.createElement("button");return n.type="button",n.className=e,n.innerHTML='<i class="ti '+o+'"></i><span data-rail-label="true">'+t+'</span><span class="'+(e.indexOf("reveal")>=0?"analysis-side-reveal__count":"analysis-side-toggle__count")+'" data-rail-count="true">0</span>',n}function D(){const e=document.querySelector(".section.active[id]");return e?e.id:""}function U(){if(document.getElementById("module-subnav-dock-style"))return;const e=document.createElement("style");e.id="module-subnav-dock-style",e.textContent=`
            .module-subnav-dock {
                position:fixed;
                right:18px;
                top:50%;
                transform:translateY(-50%);
                z-index:760;
                width:58px;
                max-height:min(68vh, 640px);
                padding:10px 8px;
                border:1px solid rgba(148, 163, 184, 0.28);
                border-radius:24px;
                background:rgba(255, 255, 255, 0.88);
                box-shadow:0 18px 46px rgba(15, 23, 42, 0.12);
                backdrop-filter:blur(20px) saturate(160%);
                overflow:hidden;
                transition:width 180ms ease, border-radius 180ms ease, box-shadow 180ms ease;
            }
            .module-subnav-dock:hover,
            .module-subnav-dock:focus-within {
                width:238px;
                border-radius:22px;
                box-shadow:0 24px 68px rgba(15, 23, 42, 0.16);
            }
            .module-subnav-dock__head {
                display:flex;
                align-items:center;
                gap:10px;
                min-height:36px;
                padding:0 5px 8px;
                border-bottom:1px solid rgba(226, 232, 240, 0.86);
                margin-bottom:8px;
                white-space:nowrap;
            }
            .module-subnav-dock__head i {
                width:34px;
                height:34px;
                border-radius:14px;
                display:inline-flex;
                align-items:center;
                justify-content:center;
                color:var(--dock-accent, #2563eb);
                background:var(--dock-soft, rgba(37, 99, 235, 0.10));
                flex:0 0 auto;
            }
            .module-subnav-dock__title {
                min-width:0;
                opacity:0;
                transform:translateX(-4px);
                transition:opacity 160ms ease, transform 160ms ease;
            }
            .module-subnav-dock:hover .module-subnav-dock__title,
            .module-subnav-dock:focus-within .module-subnav-dock__title {
                opacity:1;
                transform:none;
            }
            .module-subnav-dock__title strong {
                display:block;
                font-size:13px;
                line-height:1.25;
                color:#0f172a;
            }
            .module-subnav-dock__title span {
                display:block;
                margin-top:2px;
                font-size:11px;
                color:#64748b;
            }
            .module-subnav-dock__list {
                display:flex;
                flex-direction:column;
                gap:6px;
                max-height:calc(min(68vh, 640px) - 58px);
                overflow-y:auto;
                scrollbar-width:none;
            }
            .module-subnav-dock__list::-webkit-scrollbar { width:0; height:0; }
            .module-subnav-dock__item {
                appearance:none;
                width:100%;
                min-height:42px;
                border:0;
                border-radius:16px;
                background:transparent;
                color:#475569;
                display:grid;
                grid-template-columns:34px minmax(0, 1fr);
                align-items:center;
                gap:10px;
                padding:4px 6px;
                cursor:pointer;
                text-align:left;
                transition:background 140ms ease, color 140ms ease, transform 140ms ease;
            }
            .module-subnav-dock__item:hover {
                background:rgba(241, 245, 249, 0.92);
                transform:translateX(-1px);
            }
            .module-subnav-dock__item.is-active {
                color:var(--dock-accent, #2563eb);
                background:var(--dock-soft, rgba(37, 99, 235, 0.12));
                font-weight:800;
            }
            .module-subnav-dock__icon {
                width:34px;
                height:34px;
                border-radius:14px;
                display:inline-flex;
                align-items:center;
                justify-content:center;
                color:inherit;
                background:rgba(241, 245, 249, 0.88);
                flex:0 0 auto;
            }
            .module-subnav-dock__item.is-active .module-subnav-dock__icon {
                background:rgba(255, 255, 255, 0.76);
            }
            .module-subnav-dock__label {
                min-width:0;
                opacity:0;
                transform:translateX(-4px);
                transition:opacity 160ms ease, transform 160ms ease;
            }
            .module-subnav-dock:hover .module-subnav-dock__label,
            .module-subnav-dock:focus-within .module-subnav-dock__label {
                opacity:1;
                transform:none;
            }
            .module-subnav-dock__label strong {
                display:block;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
                font-size:12px;
                line-height:1.25;
            }
            .module-subnav-dock__label span {
                display:block;
                overflow:hidden;
                text-overflow:ellipsis;
                white-space:nowrap;
                margin-top:2px;
                font-size:10px;
                color:#94a3b8;
            }
            @media (max-width: 1100px) {
                .module-subnav-dock {
                    right:12px;
                    top:auto;
                    bottom:86px;
                    transform:none;
                    width:52px;
                    max-height:50vh;
                    padding:8px 7px;
                }
                .module-subnav-dock:hover,
                .module-subnav-dock:focus-within {
                    width:min(232px, calc(100vw - 28px));
                }
            }
            @media print {
                .module-subnav-dock { display:none !important; }
            }
        `,document.head.appendChild(e)}function z(){const e=window.NAV_STRUCTURE||{},t=typeof window.getCurrentNavCategory=="function"?window.getCurrentNavCategory():"",o=D();if(t&&e[t])return{key:t,category:e[t]};const n=Object.entries(e).find(([,s])=>Array.isArray(s.items)&&s.items.some(a=>a.id===o));return n?{key:n[0],category:n[1]}:null}function K(e,t,o){const n=(e==null?void 0:e.key)||"",s=t.map(a=>a.id).join("|");return[n,o,s].join("::")}function j(e,t){e&&e.querySelectorAll("[data-dock-module-id]").forEach(o=>{const n=o.getAttribute("data-dock-module-id")===t;o.classList.toggle("is-active",n),o.setAttribute("aria-current",n?"page":"false")})}function H(e){!e||e.dataset.clickBound==="true"||(e.dataset.clickBound="true",e.addEventListener("click",t=>{var s,a;const o=(a=(s=t.target)==null?void 0:s.closest)==null?void 0:a.call(s,"[data-dock-module-id]");if(!o||!e.contains(o))return;const n=o.getAttribute("data-dock-module-id");n&&(typeof window.switchTab=="function"&&window.switchTab(n),window.setTimeout(()=>{const i=document.getElementById(n);i&&i.scrollIntoView({block:"start",behavior:"smooth"}),m()},80))}))}function R(){let e=document.getElementById("module-subnav-dock");const t=document.getElementById("module-subnav-dock-style");e&&e.remove(),t&&t.remove(),p=""}function m(){h||(h=window.requestAnimationFrame(()=>{h=0,R()}))}function Y(){S||(S=!0,document.addEventListener("cloud-load-state",m),window.addEventListener("hashchange",m),window.addEventListener("popstate",m))}function V(e){var r;if(!e||e.dataset.analysisRailReady==="true")return;const t=e.querySelector(".analysis-side-nav"),o=e.querySelector(".content-area");if(!t||!o)return;const n=(((r=t.querySelector(".side-nav-title"))==null?void 0:r.textContent)||"功能导航").trim(),s=document.createElement("div");s.className="analysis-side-toolbar";const a=I("analysis-side-toggle","收起"+n,"ti-chevrons-left");a.addEventListener("click",function(){_(e,!0)}),s.appendChild(a),t.prepend(s);const i=o.querySelector(".analysis-content-stack")||o,l=document.createElement("div");l.className="analysis-side-reveal";const d=I("analysis-side-reveal-btn","展开"+n,"ti-chevrons-right");d.addEventListener("click",function(){_(e,!1)}),l.appendChild(d),i.prepend(l),e.__analysisSideNav=t,e.__analysisCollapseButton=a,e.__analysisRevealButton=d,e.__analysisRailTitle=n,e.dataset.analysisRailReady="true",B(e)}function x(){Array.from(document.querySelectorAll(".analysis-results-layout")).forEach(t=>{V(t),_(t,P(t),{rememberState:!1})}),m()}function T(){g||(g=window.requestAnimationFrame(function(){g=0,x()}))}function X(){const e=document.getElementById("cloud-sync-indicator"),t=c()&&document.getElementById("shell-cloud-status-host");e&&e.parentElement!==(t||document.body)&&(t||document.body).append(e),L(),x()}function W(e){var o,n;const t=e.target;return(n=(o=t==null?void 0:t.classList)==null?void 0:o.contains)!=null&&n.call(o,"analysis-results-layout")||(t==null?void 0:t.id)==="app"||(t==null?void 0:t.id)==="sub-nav-container"?!0:Array.from(e.addedNodes||[]).some(s=>{var a,i;return!s||s.nodeType!==1?!1:(a=s.matches)!=null&&a.call(s,".analysis-results-layout, .analysis-side-nav, .content-area")?!0:!!((i=s.querySelector)!=null&&i.call(s,".analysis-results-layout, .analysis-side-nav, .content-area"))})}window.toggleAppSidebar=$,window.setAppSidebarCollapsed=b,window.refreshAnalysisSideRails=T,window.refreshModuleSubnavDock=m;function q(){O(),Y(),L(),x(),R(),new MutationObserver(t=>{t.some(W)&&T()}).observe(document.body,{childList:!0,subtree:!0})}document.readyState==="loading"?document.addEventListener("DOMContentLoaded",q,{once:!0}):q(),window.addEventListener("resize",X)})();
