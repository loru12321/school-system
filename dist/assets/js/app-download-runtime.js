(()=>{if(typeof window=="undefined"||window.__APP_DOWNLOAD_RUNTIME_PATCHED__)return;const d=String(window.PUBLIC_DOWNLOAD_RELEASE_PAGE_URL||"https://github.com/loru12321/school-system/releases/latest").trim(),s={android:{key:"android",label:"安卓下载",shortLabel:"Android APK",badge:"手机 / 平板",icon:"ti-brand-android",accent:"#22c55e",url:"https://github.com/loru12321/school-system/releases/latest/download/school-system-android-latest.apk",fileName:"school-system-android-latest.apk",heroTitle:"安卓版下载与分发入口",heroCopy:"适合教师、班主任、家长与学生在手机上直接安装，安装后沿用现有账号体系登录。",summary:"当前选中 Android APK，适合移动端安装与群聊分发。",releaseStamp:"Latest · Android",primaryActionLabel:"下载 Android APK",secondaryActionLabel:"打开安卓下载",details:[{label:"当前平台",value:"Android APK"},{label:"推荐设备",value:"安卓手机 / 平板"},{label:"分发方式",value:"群聊链接 / 浏览器直下 / GitHub release"},{label:"登录方式",value:"沿用网页端现有账号与权限"}],features:[{icon:"ti-device-mobile",title:"移动端直接安装",body:"适合在手机浏览器里直接下载安装包，安装完成后就能进入系统。"},{icon:"ti-link",title:"链接统一分发",body:"只需要把当前链接转发出去，就能避免群里反复传不同版本的 APK。"},{icon:"ti-user-check",title:"沿用同一套账号",body:"与网页端共用登录身份、权限边界和核心模块入口，无需单独再建账号。"},{icon:"ti-rotate-2",title:"跟随 release 更新",body:"后续只要替换最新 release 资产，原有入口就能继续分发最新安装包。"}],scenes:[{title:"班主任 / 教师手机",body:"在教室、办公室、巡课或家校沟通现场，直接打开安卓端查看系统。"},{title:"家长 / 学生移动端",body:"需要在手机里直接进入查询或成长报告入口时，可统一使用安卓版安装包。"},{title:"学校统一转发",body:"适合由教务统一把链接发到群里，减少重复解释哪个安装包才是最新版本。"}],installSteps:["点击当前 Android 下载按钮，建议直接在安卓浏览器里完成下载。","如果系统提示“安装未知应用”，在浏览器对应的系统设置里临时允许安装。","安装完成后打开应用，使用现有账号密码登录即可进入系统。","后续若 release 更新，继续使用当前页面或 release 页面里的最新版链接覆盖安装即可。"],specNote:"若系统拦截安装，请在设备设置中允许当前浏览器安装未知应用。"},desktop:{key:"desktop",label:"桌面端下载",shortLabel:"Windows EXE",badge:"Windows 10 / 11",icon:"ti-brand-windows",accent:"#60a5fa",url:"https://github.com/loru12321/school-system/releases/latest/download/smartedu-desktop-windows-latest.exe",fileName:"smartedu-desktop-windows-latest.exe",heroTitle:"桌面端 EXE 下载与分发入口",heroCopy:"适合教务办公室、年级组电脑与固定工位使用，双击 EXE 即可直接打开桌面端。",summary:"当前选中 Windows EXE，适合电脑端直接运行与办公室统一装机。",releaseStamp:"Latest · Desktop",primaryActionLabel:"下载 Windows EXE",secondaryActionLabel:"打开桌面端下载",details:[{label:"当前平台",value:"Windows Desktop EXE"},{label:"推荐设备",value:"办公室电脑 / 机房 / 固定工位"},{label:"分发方式",value:"GitHub release 直链 / 内网转发 / 统一装机"},{label:"运行方式",value:"下载后双击 EXE，本地单实例运行"}],features:[{icon:"ti-device-desktop",title:"电脑端一键打开",body:"下载 EXE 后即可在 Windows 电脑上直接运行，不需要再额外找浏览器入口。"},{icon:"ti-stack-2",title:"内置桌面壳",body:"桌面端已经内置系统页面与资源，适合固定办公桌面环境长期使用。"},{icon:"ti-copy-check",title:"与网页口径一致",body:"桌面端和网页端共用同一套登录逻辑、模块结构和成绩口径。"},{icon:"ti-app-window",title:"避免重复打开",body:"桌面端使用单实例策略，再次打开会直接回到当前窗口，不会重复弹多个壳。"}],scenes:[{title:"教务办公室电脑",body:"适合固定桌面使用，减少每天先打开浏览器再输入地址的步骤。"},{title:"年级组 / 会议电脑",body:"在年级组、会议室或机房环境中，可直接通过 EXE 启动系统。"},{title:"统一装机与维护",body:"如果学校需要在多台电脑上统一部署，可直接分发 release 中的 EXE。"}],installSteps:["点击当前 Desktop 下载按钮，获取 Windows EXE 安装包。","下载完成后双击 EXE；如果 Windows SmartScreen 提示，请选择“更多信息 / 仍要运行”。","桌面端启动后会直接载入系统页面，使用现有账号密码登录即可。","如后续需要升级，只需重新下载最新 release 中的 EXE 并替换使用。"],specNote:"若 Windows 弹出 SmartScreen，请选择“更多信息”后继续运行当前 EXE。"}},b=[{version:"2026-04-08",date:"2026-04-08",title:"双端下载中心上线",bullets:["应用下载入口升级为安卓与桌面端二选一的统一下载中心。","登录页右上角“应用下载”不再直接下 APK，而是先展示双端入口与对应链接。","网页版下载中心与 GitHub release 资产保持同一套链接逻辑。"]},{version:"Android",date:"2026-04-08",title:"最新版 APK 已同步到 release",bullets:["安卓包会随本次 release 一起上传，避免 release 里还是旧版 APK。","下载入口默认指向最新 release 中的 Android 资产。","后续继续沿用同一入口即可分发新版 APK。"]},{version:"Desktop",date:"2026-04-08",title:"Windows EXE 加入统一发布",bullets:["新生成的桌面端 EXE 会一起进入最新 release。","网页端“应用下载”现在可以直接切到桌面端链接。","适合办公室电脑、会议电脑与固定工位使用。"]}];let n="android";function m(o){try{return new URL(String(o||"").trim(),window.location.href).toString()}catch(e){return String(o||"").trim()}}function c(o="android"){const e=o==="desktop"?"desktop":"android",a=window.PUBLIC_DOWNLOAD_CHANNELS&&typeof window.PUBLIC_DOWNLOAD_CHANNELS=="object"&&window.PUBLIC_DOWNLOAD_CHANNELS[e]&&typeof window.PUBLIC_DOWNLOAD_CHANNELS[e]=="object"?window.PUBLIC_DOWNLOAD_CHANNELS[e]:{},t={...s[e],...a};return{...t,key:e,url:m(t.url||s[e].url),fileName:String(t.fileName||s[e].fileName||"").trim(),notes:Array.isArray(t.notes)&&t.notes.length?t.notes:s[e].notes,details:Array.isArray(t.details)&&t.details.length?t.details:s[e].details,features:Array.isArray(t.features)&&t.features.length?t.features:s[e].features,scenes:Array.isArray(t.scenes)&&t.scenes.length?t.scenes:s[e].scenes,installSteps:Array.isArray(t.installSteps)&&t.installSteps.length?t.installSteps:s[e].installSteps}}function p(o,e="success"){if(window.UI&&typeof window.UI.toast=="function"){window.UI.toast(o,e);return}if(window.Swal&&typeof window.Swal.fire=="function"){window.Swal.fire({toast:!0,position:"top",icon:e==="error"?"error":"success",title:o,showConfirmButton:!1,timer:1800});return}console.log(o)}async function i(o,e){const a=String(o||"").trim();if(!a)return p("暂无可复制内容","error"),!1;try{if(navigator.clipboard&&typeof navigator.clipboard.writeText=="function")return await navigator.clipboard.writeText(a),p(e||"已复制"),!0}catch(l){console.warn("copy failed:",l)}const t=document.createElement("textarea");t.value=a,t.setAttribute("readonly","readonly"),t.style.position="fixed",t.style.opacity="0",document.body.appendChild(t),t.select();try{return document.execCommand("copy"),p(e||"已复制"),!0}catch(l){return console.warn("execCommand copy failed:",l),p("复制失败，请手动复制","error"),!1}finally{t.remove()}}function w(o){return[`${o.label}: ${o.url}`,`文件名: ${o.fileName}`,`发布页: ${d}`,`说明: ${o.specNote||o.helper||""}`].join(`
`)}function A(o,e){const a=o.querySelector("#app-download-platform-grid");if(!a)return;const t=["android","desktop"].map(l=>c(l));a.innerHTML=t.map(l=>`
            <button
                type="button"
                class="app-download-platform-card${l.key===e?" is-active":""}"
                data-app-download-platform="${l.key}"
                style="--download-accent:${l.accent||"#22c55e"};"
            >
                <span class="app-download-platform-orb">
                    <i class="ti ${l.icon||"ti-download"}"></i>
                </span>
                <span class="app-download-platform-label">${l.shortLabel}</span>
                <span class="app-download-platform-note">${l.badge||""}</span>
            </button>
        `).join(""),a.querySelectorAll("[data-app-download-platform]").forEach(l=>{l.onclick=()=>{n=(l.getAttribute("data-app-download-platform")||"android")==="desktop"?"desktop":"android",u(n)}})}function L(o,e){const a=o.querySelector("#app-download-meta-grid");a&&(a.innerHTML=(e.details||[]).map(t=>`
            <article class="app-download-meta-card">
                <span class="app-download-meta-label">${t.label}</span>
                <strong class="app-download-meta-value">${t.value}</strong>
            </article>
        `).join(""))}function E(o,e){const a=o.querySelector("#app-download-feature-grid");a&&(a.innerHTML=(e.features||[]).map(t=>`
            <article class="app-download-feature-card">
                <div class="app-download-feature-icon" style="color:${e.accent||"#22c55e"};"><i class="ti ${t.icon}"></i></div>
                <div>
                    <h4>${t.title}</h4>
                    <p>${t.body}</p>
                </div>
            </article>
        `).join(""))}function S(o,e){const a=o.querySelector("#app-download-scene-list");a&&(a.innerHTML=(e.scenes||[]).map(t=>`
            <article class="app-download-scene-card">
                <h4>${t.title}</h4>
                <p>${t.body}</p>
            </article>
        `).join(""))}function k(o,e){const a=o.querySelector("#app-download-install-list");a&&(a.innerHTML=(e.installSteps||[]).map((t,l)=>`
            <li class="app-download-step-item">
                <span class="app-download-step-index">${l+1}</span>
                <span>${t}</span>
            </li>
        `).join(""))}function v(o,e){const a=o.querySelector("#app-download-release-list");a&&(a.innerHTML=b.map(t=>`
            <article class="app-download-release-card${t.version.toLowerCase().includes(e)?" is-active":""}" data-app-release-item="true">
                <div class="app-download-release-head">
                    <span class="app-download-release-badge">${t.version}</span>
                    <span class="app-download-release-date">${t.date}</span>
                </div>
                <h4>${t.title}</h4>
                <ul>
                    ${t.bullets.map(l=>`<li>${l}</li>`).join("")}
                </ul>
            </article>
        `).join(""))}function $(o,e){const a=o.querySelector("#app-download-spec-grid");if(!a)return;const t=[{label:"当前平台",value:e.shortLabel},{label:"下载文件",value:e.fileName},{label:"下载链接",value:e.url,code:!0,copyValue:e.url,copyLabel:"复制链接"},{label:"Release 页面",value:d,code:!0,copyValue:d,copyLabel:"复制发布页"},{label:"打开说明",value:e.specNote||e.helper||""},{label:"分发建议",value:e.key==="desktop"?"适合办公室电脑、会议电脑与固定工位统一装机。":"适合手机浏览器直下、群聊转发与移动端统一安装。"}];a.innerHTML=t.map((l,r)=>`
            <article class="app-download-spec-card">
                <span class="app-download-spec-label">${l.label}</span>
                <div class="app-download-spec-row">
                    <div class="${l.code?"app-download-spec-code":"app-download-spec-value"}">${l.value}</div>
                    ${l.copyValue?`<button type="button" class="btn btn-gray app-download-mini-btn" data-copy-index="${r}">${l.copyLabel}</button>`:""}
                </div>
            </article>
        `).join(""),a.querySelectorAll("[data-copy-index]").forEach(l=>{l.onclick=()=>{const r=t[Number(l.getAttribute("data-copy-index"))];i(r==null?void 0:r.copyValue,`${(r==null?void 0:r.label)||"内容"}已复制`)}})}function g(o,e){const a=o.querySelector("#app-download-primary-link"),t=o.querySelector("#app-download-secondary-link"),l=o.querySelector("#app-download-release-link"),r=o.querySelector("#app-download-copy-link"),y=o.querySelector("#app-download-link-input"),f=o.querySelector("#app-download-copy-checksum");a&&(a.href=e.url,a.setAttribute("download",e.fileName),a.innerHTML=`<i class="ti ti-download"></i> ${e.primaryActionLabel}`),t&&(t.href=e.url,t.setAttribute("download",e.fileName),t.innerHTML=`<i class="ti ti-download"></i> ${e.secondaryActionLabel}`),l&&(l.href=d),y&&(y.value=e.url),r&&(r.onclick=()=>i(e.url,`${e.label}链接已复制`)),f&&(f.onclick=()=>i(w(e),`${e.shortLabel}说明已复制`))}function N(o,e){const a=o.querySelector("#app-download-hero-title"),t=o.querySelector("#app-download-hero-copy"),l=o.querySelector("#app-download-summary"),r=o.querySelector("#app-download-short-checksum");a&&(a.textContent=e.heroTitle),t&&(t.textContent=e.heroCopy),l&&(l.textContent=e.summary),r&&(r.textContent=`${e.releaseStamp} / ${e.badge}`)}function u(o=n){const e=document.getElementById("app-download-center");if(!e)return!1;n=o==="desktop"?"desktop":"android";const a=c(n);return A(e,n),N(e,a),L(e,a),E(e,a),S(e,a),k(e,a),v(e,n),$(e,a),g(e,a),!0}window.renderAppDownloadCenter=u,window.setAppDownloadPlatform=function(o="android"){return n=o==="desktop"?"desktop":"android",u(n)},window.copyAppDownloadLink=function(o=n){const e=c(o);return i(e.url,`${e.label}链接已复制`)},window.copyAppDownloadChecksum=function(o=n){const e=c(o);return i(w(e),`${e.shortLabel}说明已复制`)},window.__APP_DOWNLOAD_RUNTIME_PATCHED__=!0})();
