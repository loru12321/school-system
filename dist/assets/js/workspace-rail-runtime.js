(function(){const D="(min-width: 1100px)";let b=0,y=!0;const p=new Map;let f=0,x=!1;function m(){return window.matchMedia(D).matches}function k(){return document.getElementById("app-sidebar")}function T(){return Array.from(document.querySelectorAll('[data-sidebar-toggle="true"]'))}function R(e){T().forEach(t=>{const o=!!e,n=o?"展开左侧工作区":"收起左侧工作区";t.setAttribute("aria-label",n),t.setAttribute("title",n),t.setAttribute("aria-pressed",o?"true":"false");const s=t.querySelector('[data-sidebar-toggle-icon="true"]');s&&(s.className="ti "+(o?"ti-chevrons-right":"ti-chevrons-left"))})}function v(e,t){const o=k();if(!o)return;const n=!t||t.rememberState!==!1,s=!!e,i=s&&m();n&&(y=s),o.classList.toggle("is-collapsed",i),document.body.classList.toggle("shell-sidebar-collapsed",i),m()||(o.classList.remove("is-collapsed"),document.body.classList.remove("shell-sidebar-collapsed")),R(i),typeof window.refreshShellEnhancements=="function"&&window.refreshShellEnhancements()}function q(e){const t=k();if(!t)return;if(!m()){t.classList.toggle("show-mobile");return}const o=typeof e=="boolean"?!!e:!t.classList.contains("is-collapsed");v(o)}function w(){v(y,{rememberState:!1})}function _(e){const t=e.closest(".section[id]");return t&&t.id?t.id:e.id?e.id:"analysis-layout-"+Array.from(document.querySelectorAll(".analysis-results-layout")).indexOf(e)}function B(e){const t=_(e);return p.has(t)||p.set(t,!0),p.get(t)}function $(e){return e?e.querySelectorAll(".side-nav-link").length:0}function S(e){const t=e.__analysisSideNav,o=e.__analysisCollapseButton,n=e.__analysisRevealButton;if(!t||!o||!n)return;const s=e.__analysisRailTitle||"功能导航",i=$(t),l=e.classList.contains("is-side-collapsed"),d=o.querySelector('[data-rail-label="true"]');d&&(d.textContent="收起"+s);const a=n.querySelector('[data-rail-label="true"]');a&&(a.textContent="展开"+s);const r=o.querySelector('[data-rail-count="true"]');r&&(r.textContent=String(i));const u=n.querySelector('[data-rail-count="true"]');u&&(u.textContent=String(i)),o.setAttribute("aria-pressed",l?"true":"false"),n.setAttribute("aria-pressed",l?"true":"false")}function h(e,t,o){if(!e)return;const n=!o||o.rememberState!==!1,s=!!t,i=s&&m(),l=_(e);n&&p.set(l,s),e.classList.toggle("is-side-collapsed",i),S(e)}function A(e,t,o){const n=document.createElement("button");return n.type="button",n.className=e,n.innerHTML='<i class="ti '+o+'"></i><span data-rail-label="true">'+t+'</span><span class="'+(e.indexOf("reveal")>=0?"analysis-side-reveal__count":"analysis-side-toggle__count")+'" data-rail-count="true">0</span>',n}function E(){const e=document.querySelector(".section.active[id]");return e?e.id:""}function M(){if(document.getElementById("module-subnav-dock-style"))return;const e=document.createElement("style");e.id="module-subnav-dock-style",e.textContent=`
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
        `,document.head.appendChild(e)}function I(){const e=window.NAV_STRUCTURE||{},t=typeof window.getCurrentNavCategory=="function"?window.getCurrentNavCategory():"",o=E();if(t&&e[t])return{key:t,category:e[t]};const n=Object.entries(e).find(([,s])=>Array.isArray(s.items)&&s.items.some(i=>i.id===o));return n?{key:n[0],category:n[1]}:null}function C(){M();const e=document.getElementById("app");let t=document.getElementById("module-subnav-dock");const o=I(),n=o&&o.category,s=Array.isArray(n==null?void 0:n.items)?n.items:[];if(!(!!e&&getComputedStyle(e).display!=="none"&&s.length>1)){t&&t.remove();return}t||(t=document.createElement("nav"),t.id="module-subnav-dock",t.className="module-subnav-dock",t.setAttribute("aria-label","当前母模块子模块导航"),document.body.appendChild(t));const l=E(),d=n.color||"#2563eb";t.style.setProperty("--dock-accent",d),t.style.setProperty("--dock-soft",`color-mix(in srgb, ${d} 14%, white)`),t.innerHTML=`
            <div class="module-subnav-dock__head">
                <i class="ti ${n.icon||"ti-layout-grid"}"></i>
                <span class="module-subnav-dock__title">
                    <strong>${n.title||"模块导航"}</strong>
                    <span>${s.length} 个子模块</span>
                </span>
            </div>
            <div class="module-subnav-dock__list">
                ${s.map((a,r)=>`
                    <button type="button"
                        class="module-subnav-dock__item${a.id===l?" is-active":""}"
                        data-dock-module-id="${a.id}"
                        title="${a.text||""}"
                        aria-label="${a.text||""}"
                        aria-current="${a.id===l?"page":"false"}">
                        <span class="module-subnav-dock__icon"><i class="ti ${a.icon||"ti-circle"}"></i></span>
                        <span class="module-subnav-dock__label">
                            <strong>${String(a.text||`子模块 ${r+1}`)}</strong>
                            <span>${String(a.hint||"点击切换")}</span>
                        </span>
                    </button>
                `).join("")}
            </div>
        `,t.querySelectorAll("[data-dock-module-id]").forEach(a=>{a.addEventListener("click",()=>{const r=a.getAttribute("data-dock-module-id");r&&(typeof window.switchTab=="function"&&window.switchTab(r),window.setTimeout(()=>{const u=document.getElementById(r);u&&u.scrollIntoView({block:"start",behavior:"smooth"}),c()},80))})})}function c(){f||(f=window.requestAnimationFrame(()=>{f=0,C()}))}function O(){x||(x=!0,document.addEventListener("click",()=>window.setTimeout(c,30),!0),window.addEventListener("hashchange",c))}function N(e){var r;if(!e||e.dataset.analysisRailReady==="true")return;const t=e.querySelector(".analysis-side-nav"),o=e.querySelector(".content-area");if(!t||!o)return;const n=(((r=t.querySelector(".side-nav-title"))==null?void 0:r.textContent)||"功能导航").trim(),s=document.createElement("div");s.className="analysis-side-toolbar";const i=A("analysis-side-toggle","收起"+n,"ti-chevrons-left");i.addEventListener("click",function(){h(e,!0)}),s.appendChild(i),t.prepend(s);const l=o.querySelector(".analysis-content-stack")||o,d=document.createElement("div");d.className="analysis-side-reveal";const a=A("analysis-side-reveal-btn","展开"+n,"ti-chevrons-right");a.addEventListener("click",function(){h(e,!1)}),d.appendChild(a),l.prepend(d),e.__analysisSideNav=t,e.__analysisCollapseButton=i,e.__analysisRevealButton=a,e.__analysisRailTitle=n,e.dataset.analysisRailReady="true",S(e)}function g(){Array.from(document.querySelectorAll(".analysis-results-layout")).forEach(t=>{N(t),h(t,B(t),{rememberState:!1})}),c()}function L(){b||(b=window.requestAnimationFrame(function(){b=0,g()}))}function P(){w(),g()}window.toggleAppSidebar=q,window.setAppSidebarCollapsed=v,window.refreshAnalysisSideRails=L,window.refreshModuleSubnavDock=c,document.addEventListener("DOMContentLoaded",function(){O(),w(),g(),C(),new MutationObserver(L).observe(document.body,{childList:!0,subtree:!0})}),window.addEventListener("resize",P)})();
