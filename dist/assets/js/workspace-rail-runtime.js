(function(){const R="(min-width: 1100px)";let v=0,x=!0;const m=new Map;let h=0,w=!1,b="";function f(){return window.matchMedia(R).matches}function _(){return document.getElementById("app-sidebar")}function B(){return Array.from(document.querySelectorAll('[data-sidebar-toggle="true"]'))}function q(e){B().forEach(t=>{const n=!!e,o=n?"展开左侧工作区":"收起左侧工作区";t.setAttribute("aria-label",o),t.setAttribute("title",o),t.setAttribute("aria-pressed",n?"true":"false");const s=t.querySelector('[data-sidebar-toggle-icon="true"]');s&&(s.className="ti "+(n?"ti-chevrons-right":"ti-chevrons-left"))})}function g(e,t){const n=_();if(!n)return;const o=!t||t.rememberState!==!1,s=!!e,a=s&&f();o&&(x=s),n.classList.toggle("is-collapsed",a),document.body.classList.toggle("shell-sidebar-collapsed",a),f()||(n.classList.remove("is-collapsed"),document.body.classList.remove("shell-sidebar-collapsed")),q(a),typeof window.refreshShellEnhancements=="function"&&window.refreshShellEnhancements()}function M(e){const t=_();if(!t)return;if(!f()){t.classList.toggle("show-mobile");return}const n=typeof e=="boolean"?!!e:!t.classList.contains("is-collapsed");g(n)}function S(){g(x,{rememberState:!1})}function A(e){const t=e.closest(".section[id]");return t&&t.id?t.id:e.id?e.id:"analysis-layout-"+Array.from(document.querySelectorAll(".analysis-results-layout")).indexOf(e)}function $(e){const t=A(e);return m.has(t)||m.set(t,!0),m.get(t)}function I(e){return e?e.querySelectorAll(".side-nav-link").length:0}function E(e){const t=e.__analysisSideNav,n=e.__analysisCollapseButton,o=e.__analysisRevealButton;if(!t||!n||!o)return;const s=e.__analysisRailTitle||"功能导航",a=I(t),i=e.classList.contains("is-side-collapsed"),c=n.querySelector('[data-rail-label="true"]');c&&(c.textContent="收起"+s);const r=o.querySelector('[data-rail-label="true"]');r&&(r.textContent="展开"+s);const l=n.querySelector('[data-rail-count="true"]');l&&(l.textContent=String(a));const p=o.querySelector('[data-rail-count="true"]');p&&(p.textContent=String(a)),n.setAttribute("aria-pressed",i?"true":"false"),o.setAttribute("aria-pressed",i?"true":"false")}function y(e,t,n){if(!e)return;const o=!n||n.rememberState!==!1,s=!!t,a=s&&f(),i=A(e);o&&m.set(i,s),e.classList.toggle("is-side-collapsed",a),E(e)}function C(e,t,n){const o=document.createElement("button");return o.type="button",o.className=e,o.innerHTML='<i class="ti '+n+'"></i><span data-rail-label="true">'+t+'</span><span class="'+(e.indexOf("reveal")>=0?"analysis-side-reveal__count":"analysis-side-toggle__count")+'" data-rail-count="true">0</span>',o}function L(){const e=document.querySelector(".section.active[id]");return e?e.id:""}function O(){if(document.getElementById("module-subnav-dock-style"))return;const e=document.createElement("style");e.id="module-subnav-dock-style",e.textContent=`
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
        `,document.head.appendChild(e)}function N(){const e=window.NAV_STRUCTURE||{},t=typeof window.getCurrentNavCategory=="function"?window.getCurrentNavCategory():"",n=L();if(t&&e[t])return{key:t,category:e[t]};const o=Object.entries(e).find(([,s])=>Array.isArray(s.items)&&s.items.some(a=>a.id===n));return o?{key:o[0],category:o[1]}:null}function P(e,t,n){const o=(e==null?void 0:e.key)||"",s=t.map(a=>a.id).join("|");return[o,n,s].join("::")}function F(e,t){e&&e.querySelectorAll("[data-dock-module-id]").forEach(n=>{const o=n.getAttribute("data-dock-module-id")===t;n.classList.toggle("is-active",o),n.setAttribute("aria-current",o?"page":"false")})}function K(e){!e||e.dataset.clickBound==="true"||(e.dataset.clickBound="true",e.addEventListener("click",t=>{var s,a;const n=(a=(s=t.target)==null?void 0:s.closest)==null?void 0:a.call(s,"[data-dock-module-id]");if(!n||!e.contains(n))return;const o=n.getAttribute("data-dock-module-id");o&&(typeof window.switchTab=="function"&&window.switchTab(o),window.setTimeout(()=>{const i=document.getElementById(o);i&&i.scrollIntoView({block:"start",behavior:"smooth"}),u()},80))}))}function D(){O();const e=document.getElementById("app"),t=document.getElementById("mode-mask");let n=document.getElementById("module-subnav-dock");const o=N(),s=o&&o.category,a=Array.isArray(s==null?void 0:s.items)?s.items:[],i=!t||getComputedStyle(t).display==="none";if(!(!!e&&getComputedStyle(e).display!=="none"&&i&&a.length>1)){n&&n.remove(),b="";return}n||(n=document.createElement("nav"),n.id="module-subnav-dock",n.className="module-subnav-dock",n.setAttribute("aria-label","当前母模块子模块导航"),document.body.appendChild(n),b=""),K(n);const r=L(),l=P(o,a,r);if(b===l){F(n,r);return}b=l;const p=s.color||"#2563eb";n.style.setProperty("--dock-accent",p),n.style.setProperty("--dock-soft",`color-mix(in srgb, ${p} 14%, white)`),n.innerHTML=`
            <div class="module-subnav-dock__head">
                <i class="ti ${s.icon||"ti-layout-grid"}"></i>
                <span class="module-subnav-dock__title">
                    <strong>${s.title||"模块导航"}</strong>
                    <span>${a.length} 个子模块</span>
                </span>
            </div>
            <div class="module-subnav-dock__list">
                ${a.map((d,V)=>`
                    <button type="button"
                        class="module-subnav-dock__item${d.id===r?" is-active":""}"
                        data-dock-module-id="${d.id}"
                        title="${d.text||""}"
                        aria-label="${d.text||""}"
                        aria-current="${d.id===r?"page":"false"}">
                        <span class="module-subnav-dock__icon"><i class="ti ${d.icon||"ti-circle"}"></i></span>
                        <span class="module-subnav-dock__label">
                            <strong>${String(d.text||`子模块 ${V+1}`)}</strong>
                            <span>${String(d.hint||"点击切换")}</span>
                        </span>
                    </button>
                `).join("")}
            </div>
        `}function u(){h||(h=window.requestAnimationFrame(()=>{h=0,D()}))}function U(){w||(w=!0,document.addEventListener("cloud-load-state",u),window.addEventListener("hashchange",u),window.addEventListener("popstate",u))}function j(e){var l;if(!e||e.dataset.analysisRailReady==="true")return;const t=e.querySelector(".analysis-side-nav"),n=e.querySelector(".content-area");if(!t||!n)return;const o=(((l=t.querySelector(".side-nav-title"))==null?void 0:l.textContent)||"功能导航").trim(),s=document.createElement("div");s.className="analysis-side-toolbar";const a=C("analysis-side-toggle","收起"+o,"ti-chevrons-left");a.addEventListener("click",function(){y(e,!0)}),s.appendChild(a),t.prepend(s);const i=n.querySelector(".analysis-content-stack")||n,c=document.createElement("div");c.className="analysis-side-reveal";const r=C("analysis-side-reveal-btn","展开"+o,"ti-chevrons-right");r.addEventListener("click",function(){y(e,!1)}),c.appendChild(r),i.prepend(c),e.__analysisSideNav=t,e.__analysisCollapseButton=a,e.__analysisRevealButton=r,e.__analysisRailTitle=o,e.dataset.analysisRailReady="true",E(e)}function k(){Array.from(document.querySelectorAll(".analysis-results-layout")).forEach(t=>{j(t),y(t,$(t),{rememberState:!1})}),u()}function T(){v||(v=window.requestAnimationFrame(function(){v=0,k()}))}function z(){S(),k()}function H(e){var n,o;const t=e.target;return(o=(n=t==null?void 0:t.classList)==null?void 0:n.contains)!=null&&o.call(n,"analysis-results-layout")||(t==null?void 0:t.id)==="app"||(t==null?void 0:t.id)==="sub-nav-container"?!0:Array.from(e.addedNodes||[]).some(s=>{var a,i;return!s||s.nodeType!==1?!1:(a=s.matches)!=null&&a.call(s,".analysis-results-layout, .analysis-side-nav, .content-area")?!0:!!((i=s.querySelector)!=null&&i.call(s,".analysis-results-layout, .analysis-side-nav, .content-area"))})}window.toggleAppSidebar=M,window.setAppSidebarCollapsed=g,window.refreshAnalysisSideRails=T,window.refreshModuleSubnavDock=u,document.addEventListener("DOMContentLoaded",function(){U(),S(),k(),D(),new MutationObserver(t=>{t.some(H)&&T()}).observe(document.body,{childList:!0,subtree:!0})}),window.addEventListener("resize",z)})();
