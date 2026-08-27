(function(){const T="(min-width: 1100px)";let v=0,_=!1;const b=new Map;let g=0,x=!1,m="";function f(){return window.matchMedia(T).matches}function w(){return document.getElementById("app-sidebar")}function I(){return Array.from(document.querySelectorAll('[data-sidebar-toggle="true"]'))}function q(e){I().forEach(t=>{const n=!!e,s=n?"展开左侧工作区":"收起左侧工作区";t.setAttribute("aria-label",s),t.setAttribute("title",s),t.setAttribute("aria-pressed",n?"true":"false");const o=t.querySelector('[data-sidebar-toggle-icon="true"]');o&&(o.className="ti "+(n?"ti-chevrons-right":"ti-chevrons-left"))})}function y(e,t){const n=w();if(!n)return;const s=!t||t.rememberState!==!1,o=!!e,a=o&&f();s&&(_=o),n.classList.toggle("is-collapsed",a),document.body.classList.toggle("shell-sidebar-collapsed",a),f()||(n.classList.remove("is-collapsed"),document.body.classList.remove("shell-sidebar-collapsed")),q(a),typeof window.refreshShellEnhancements=="function"&&window.refreshShellEnhancements()}function M(e){const t=w();if(!t)return;if(!f()){t.classList.toggle("show-mobile");return}const n=typeof e=="boolean"?!!e:!t.classList.contains("is-collapsed");y(n)}function S(){y(_,{rememberState:!1})}function A(e){const t=e.closest(".section[id]");return t&&t.id?t.id:e.id?e.id:"analysis-layout-"+Array.from(document.querySelectorAll(".analysis-results-layout")).indexOf(e)}function $(e){const t=A(e);return b.has(t)||b.set(t,!0),b.get(t)}function N(e){return e?e.querySelectorAll(".side-nav-link").length:0}function E(e){const t=e.__analysisSideNav,n=e.__analysisCollapseButton,s=e.__analysisRevealButton;if(!t||!n||!s)return;const o=e.__analysisRailTitle||"功能导航",a=N(t),i=e.classList.contains("is-side-collapsed"),l=n.querySelector('[data-rail-label="true"]');l&&(l.textContent="收起"+o);const d=s.querySelector('[data-rail-label="true"]');d&&(d.textContent="展开"+o);const r=n.querySelector('[data-rail-count="true"]');r&&(r.textContent=String(a));const p=s.querySelector('[data-rail-count="true"]');p&&(p.textContent=String(a)),n.setAttribute("aria-pressed",i?"true":"false"),s.setAttribute("aria-pressed",i?"true":"false")}function h(e,t,n){if(!e)return;const s=!n||n.rememberState!==!1,o=!!t,a=o&&f(),i=A(e);s&&b.set(i,o),e.classList.toggle("is-side-collapsed",a),E(e)}function L(e,t,n){const s=document.createElement("button");return s.type="button",s.className=e,s.innerHTML='<i class="ti '+n+'"></i><span data-rail-label="true">'+t+'</span><span class="'+(e.indexOf("reveal")>=0?"analysis-side-reveal__count":"analysis-side-toggle__count")+'" data-rail-count="true">0</span>',s}function C(){const e=document.querySelector(".section.active[id]");return e?e.id:""}function O(){if(document.getElementById("module-subnav-dock-style"))return;const e=document.createElement("style");e.id="module-subnav-dock-style",e.textContent=`
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
        `,document.head.appendChild(e)}function P(){const e=window.NAV_STRUCTURE||{},t=typeof window.getCurrentNavCategory=="function"?window.getCurrentNavCategory():"",n=C();if(t&&e[t])return{key:t,category:e[t]};const s=Object.entries(e).find(([,o])=>Array.isArray(o.items)&&o.items.some(a=>a.id===n));return s?{key:s[0],category:s[1]}:null}function F(e,t,n){const s=(e==null?void 0:e.key)||"",o=t.map(a=>a.id).join("|");return[s,n,o].join("::")}function U(e,t){e&&e.querySelectorAll("[data-dock-module-id]").forEach(n=>{const s=n.getAttribute("data-dock-module-id")===t;n.classList.toggle("is-active",s),n.setAttribute("aria-current",s?"page":"false")})}function j(e){!e||e.dataset.clickBound==="true"||(e.dataset.clickBound="true",e.addEventListener("click",t=>{var o,a;const n=(a=(o=t.target)==null?void 0:o.closest)==null?void 0:a.call(o,"[data-dock-module-id]");if(!n||!e.contains(n))return;const s=n.getAttribute("data-dock-module-id");s&&(typeof window.switchTab=="function"&&window.switchTab(s),window.setTimeout(()=>{const i=document.getElementById(s);i&&i.scrollIntoView({block:"start",behavior:"smooth"}),u()},80))}))}function D(){let e=document.getElementById("module-subnav-dock");const t=document.getElementById("module-subnav-dock-style");e&&e.remove(),t&&t.remove(),m=""}function u(){g||(g=window.requestAnimationFrame(()=>{g=0,D()}))}function z(){x||(x=!0,document.addEventListener("cloud-load-state",u),window.addEventListener("hashchange",u),window.addEventListener("popstate",u))}function K(e){var r;if(!e||e.dataset.analysisRailReady==="true")return;const t=e.querySelector(".analysis-side-nav"),n=e.querySelector(".content-area");if(!t||!n)return;const s=(((r=t.querySelector(".side-nav-title"))==null?void 0:r.textContent)||"功能导航").trim(),o=document.createElement("div");o.className="analysis-side-toolbar";const a=L("analysis-side-toggle","收起"+s,"ti-chevrons-left");a.addEventListener("click",function(){h(e,!0)}),o.appendChild(a),t.prepend(o);const i=n.querySelector(".analysis-content-stack")||n,l=document.createElement("div");l.className="analysis-side-reveal";const d=L("analysis-side-reveal-btn","展开"+s,"ti-chevrons-right");d.addEventListener("click",function(){h(e,!1)}),l.appendChild(d),i.prepend(l),e.__analysisSideNav=t,e.__analysisCollapseButton=a,e.__analysisRevealButton=d,e.__analysisRailTitle=s,e.dataset.analysisRailReady="true",E(e)}function k(){Array.from(document.querySelectorAll(".analysis-results-layout")).forEach(t=>{K(t),h(t,$(t),{rememberState:!1})}),u()}function R(){v||(v=window.requestAnimationFrame(function(){v=0,k()}))}function H(){S(),k()}function V(e){var n,s;const t=e.target;return(s=(n=t==null?void 0:t.classList)==null?void 0:n.contains)!=null&&s.call(n,"analysis-results-layout")||(t==null?void 0:t.id)==="app"||(t==null?void 0:t.id)==="sub-nav-container"?!0:Array.from(e.addedNodes||[]).some(o=>{var a,i;return!o||o.nodeType!==1?!1:(a=o.matches)!=null&&a.call(o,".analysis-results-layout, .analysis-side-nav, .content-area")?!0:!!((i=o.querySelector)!=null&&i.call(o,".analysis-results-layout, .analysis-side-nav, .content-area"))})}window.toggleAppSidebar=M,window.setAppSidebarCollapsed=y,window.refreshAnalysisSideRails=R,window.refreshModuleSubnavDock=u,document.addEventListener("DOMContentLoaded",function(){z(),S(),k(),D(),new MutationObserver(t=>{t.some(V)&&R()}).observe(document.body,{childList:!0,subtree:!0})}),window.addEventListener("resize",H)})();
