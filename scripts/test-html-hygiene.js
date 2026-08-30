const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const applicationCss = fs.readFileSync(path.join(root, 'src/assets/css/application.css'), 'utf8');
const serviceWorkerRuntime = fs.readFileSync(path.join(root, 'public/assets/js/service-worker-runtime.js'), 'utf8');
const serviceWorkerVersion = (serviceWorkerRuntime.match(/const\s+SERVICE_WORKER_VERSION\s*=\s*'([^']+)'/) || [])[1] || '';

function count(pattern) {
    return (html.match(pattern) || []).length;
}

const inlineStyleCount = count(/\sstyle=/g);
const inlineHandlerCount = count(/\son[a-z]+=/g);

assert.ok(html.indexOf('runtime-registry-runtime.js') < html.indexOf(`boot-runtime-${serviceWorkerVersion}.js`), 'runtime registry must load before boot runtime');
assert.ok(html.includes('<meta name="description"'), 'index.html should include a search result description');
assert.ok(html.includes('<meta name="application-name" content="澄见">'), 'index.html should expose the application name to browsers');
assert.ok(html.includes('学校成绩导入、届别档案、教学分析、教师画像和家校报告'), 'index.html should keep readable search description copy');
assert.ok(html.includes('<meta name="color-scheme" content="light dark">'), 'index.html should declare supported color schemes');
assert.ok(html.includes('<link rel="canonical" href="https://schoolsystem.com.cn/">'), 'index.html should include the canonical production URL');
assert.ok(html.includes('<link rel="alternate" hreflang="zh-CN" href="https://schoolsystem.com.cn/">'), 'index.html should include a zh-CN alternate URL');
assert.ok(html.includes('<link rel="alternate" hreflang="x-default" href="https://schoolsystem.com.cn/">'), 'index.html should include an x-default alternate URL');
assert.ok(html.includes('<link rel="manifest" href="./site.webmanifest">'), 'index.html should link the web app manifest');
assert.ok(html.includes('<link rel="apple-touch-icon" sizes="192x192" href="./assets/brand/app-icon-192.png">'), 'index.html should provide a PNG touch icon');
assert.ok(html.includes('<meta property="og:title" content="澄见">'), 'index.html should include Open Graph metadata');
assert.ok(html.includes('<meta property="og:site_name" content="澄见">'), 'index.html should include readable Open Graph site name');
assert.ok(html.includes('<meta name="twitter:title" content="澄见">'), 'index.html should include readable Twitter metadata');
assert.ok(html.includes('<meta name="apple-mobile-web-app-title" content="澄见">'), 'index.html should expose readable iOS app title');
assert.ok(html.includes('<meta property="og:locale" content="zh_CN">'), 'index.html should include the Open Graph locale');
assert.ok(html.includes('<meta property="og:image" content="https://schoolsystem.com.cn/icon.svg">'), 'index.html should include a share image');
assert.ok(html.includes('<meta name="twitter:card" content="summary">'), 'index.html should include Twitter card metadata');
assert.ok(html.includes('<meta name="twitter:image" content="https://schoolsystem.com.cn/icon.svg">'), 'index.html should include a Twitter share image');
assert.ok(html.includes('type="image/x-icon"'), 'favicon link should include an explicit content type');
assert.ok(html.includes(`service-worker-runtime-${serviceWorkerVersion}.js`), 'index.html should register the service worker runtime');
// Source HTML now loads one application stylesheet entry point. Keep the
// historical cascade contract in that entry point so refactoring the link
// chain cannot silently change which visual layer wins.
assert.ok(html.includes('./assets/css/application.css'), 'index.html should load the consolidated application stylesheet');
assert.ok(applicationCss.includes('@import "./product-redesign.css";'), 'application.css should include the product redesign layer');
assert.ok(applicationCss.indexOf('@import "./layout-refinement.css";') < applicationCss.indexOf('@import "./product-redesign.css";'), 'product redesign should override layout refinement styles');
assert.ok(applicationCss.trim().endsWith('@import "./responsive-login-final.css";'), 'responsive login styles should remain the final application layer');
assert.ok(html.includes('id="critical-visibility-guard"'), 'index.html should inline a critical visibility guard before scripts run');
assert.ok(/\.hidden,\s*\[hidden\]\s*\{\s*display:\s*none\s*!important;\s*\}/.test(html), 'critical visibility guard must keep hidden app content invisible before login');
assert.match(serviceWorkerVersion, /^runtime-[0-9a-f]{12}$/, 'service worker runtime version should be generated from runtime content');
assert.ok(!html.includes('runtimeRefresh'), 'index.html should not rely on runtimeRefresh query churn');
assert.ok(!html.includes('SCHOOL_RUNTIME_REFRESH_VERSION'), 'index.html should not rely on local runtime version stamps');
assert.ok(html.includes('runtime-loader-runtime.js') && !html.includes('runtime-loader-runtime.js?v='), 'runtime loader should load without query-version dependency');
assert.ok(html.includes(`boot-runtime-${serviceWorkerVersion}.js`), 'boot runtime should load from a content-versioned pathname');
assert.ok(html.includes(`service-worker-runtime-${serviceWorkerVersion}.js`), 'service worker runtime should load from a content-versioned pathname');
assert.ok(!/\.\/assets\/js\/[^"']+\.js\?v=/.test(html), 'index.html should not query-version runtime JS entries');
assert.ok(!/[�锟鏅烘収]/.test(html.slice(0, html.indexOf('</head>'))), 'index head metadata should not contain mojibake');
// 2026-08-30: the scheduler's compact mobile manual-project editor adds
// scoped inline layout styles; keep the hygiene cap explicit and bounded.
assert.ok(inlineStyleCount <= 902, `inline style count grew: ${inlineStyleCount} > 902`);
// 139: the freshman module's upload/data-source and seat-operation handlers moved into
// freshman-exam-runtime.js (data-fb-pick / data-fb-change); the 17 modal-close,
// 12 file-pick, 15 showModuleHelp, 11 scrollToAnchor and 44 DataManager
// boilerplate handlers plus the four openTeacherSync entry points all moved
// into delegated bindings in app-foundation-runtime.js. The mobile/search,
// shell, starter-hub and workspace-drawer actions below use the shared
// data-ui-* dispatcher. The analysis toolbar/export actions below use the same
// shared dispatcher. Ratchet only downward from here.
assert.ok(inlineHandlerCount <= 139, `inline event handler count grew: ${inlineHandlerCount} > 139`);
assert.ok(!html.includes('sb_publishable_'), 'index.html should not embed Supabase publishable keys');

// The freshman module's upload/data-source controls are bound declaratively in
// freshman-exam-runtime.js. Keep the markup and the binder in sync so neither
// side can drift back to inline attributes or silently drop the listeners.
const freshmanRuntime = fs.readFileSync(path.join(root, 'public/assets/js/freshman-exam-runtime.js'), 'utf8');
const uiActionsRuntime = fs.readFileSync(path.join(root, 'public/assets/js/ui-actions-runtime.js'), 'utf8');
const freshmanPickTargets = ['fbGenderInput', 'fbViolationInput', 'fbFileInput'];
freshmanPickTargets.forEach((id) => {
    assert.ok(html.includes(`data-fb-pick="${id}"`), `freshman upload box for ${id} should open its file input declaratively`);
    assert.ok(!new RegExp(`onclick="[^"]*${id}`).test(html), `freshman upload box for ${id} should not use an inline onclick`);
});
['FB_loadGenderList', 'FB_loadViolationList', 'FB_loadData', 'FB_toggleDataSource'].forEach((handler) => {
    assert.ok(html.includes(`data-fb-change="${handler}"`), `${handler} should be wired through data-fb-change`);
    assert.ok(!new RegExp(`on(?:change|click)="[^"]*${handler}`).test(html), `${handler} should not be wired through an inline attribute`);
});
assert.ok(
    /function FB_bindDeclarativeHandlers\(/.test(freshmanRuntime)
        && /\[data-fb-pick\]/.test(freshmanRuntime)
        && /\[data-fb-change\]/.test(freshmanRuntime)
        && /FB_bindDeclarativeHandlers\(document\)/.test(freshmanRuntime),
    'freshman runtime must define and invoke the declarative handler binder'
);
assert.ok(
    /\/\^FB_\[A-Za-z0-9_\]\+\$\/\.test\(handlerName\)/.test(freshmanRuntime),
    'the data-fb-change dispatcher must restrict itself to FB_* handlers'
);

// Modal-close and file-pick boilerplate is served by one delegated listener in
// app-foundation-runtime.js. Keep the markup free of the old inline idioms and
// keep the binder's safety guards in place.
const foundationRuntime = fs.readFileSync(path.join(root, 'public/assets/js/app-foundation-runtime.js'), 'utf8');
assert.ok(
    !/onclick="document\.getElementById\('[^']+'\)\.style\.display='none'"/.test(html),
    'modal close buttons should use data-close-modal instead of an inline display toggle'
);
assert.ok(
    !/onclick="document\.getElementById\('[^']+'\)\.click\(\)"/.test(html),
    'file pick triggers should use data-pick-file instead of an inline click proxy'
);
assert.ok(count(/data-close-modal=/g) >= 17, 'declarative modal close bindings should stay wired in the markup');
assert.ok(count(/data-pick-file=/g) >= 12, 'declarative file pick bindings should stay wired in the markup');
assert.ok(
    /function installDeclarativeDomBindings\(/.test(foundationRuntime)
        && /installDeclarativeDomBindings\(\);/.test(foundationRuntime)
        && /\[data-close-modal\], \[data-pick-file\]/.test(foundationRuntime),
    'app foundation runtime must define and invoke the delegated DOM binder'
);
assert.ok(
    /target === origin \|\| target\.contains\(origin\)/.test(foundationRuntime),
    'the file pick binder must not recurse when the hidden input sits inside the upload box'
);
assert.ok(
    /if \(target\.disabled\) return;/.test(foundationRuntime),
    'the file pick binder must respect archive-locked (disabled) file inputs'
);
// Some modals stop propagation on .modal-content to implement click-outside-to-close,
// which would starve a bubble-phase document listener for the close button inside it.
assert.ok(
    /\}, true\);/.test(foundationRuntime),
    'the delegated DOM binder must listen in the capture phase to survive stopPropagation wrappers'
);

// showModuleHelp / scrollToAnchor 同样收敛到该委托 binder。
assert.ok(
    !/onclick="showModuleHelp\(/.test(html),
    'module help buttons should use data-module-help instead of an inline onclick'
);
assert.ok(
    !/onclick="scrollToAnchor\(/.test(html),
    'anchor nav links should use data-scroll-anchor instead of an inline onclick'
);
assert.ok(count(/data-module-help=/g) >= 15, 'declarative module-help bindings should stay wired in the markup');
assert.ok(count(/data-scroll-anchor=/g) >= 11, 'declarative scroll-anchor bindings should stay wired in the markup');
assert.ok(
    /\[data-module-help\], \[data-scroll-anchor\]/.test(foundationRuntime),
    'the delegated binder must resolve the module-help and scroll-anchor attributes'
);
assert.ok(
    /data-open-teacher-sync/.test(html)
        && /kind === 'teacher-sync'/.test(foundationRuntime)
        && /window\.openTeacherSync\(\)/.test(foundationRuntime),
    'teacher sync entry points must use one delegated action binding'
);

// High-frequency shell and starter actions must stay declarative so mobile
// clicks and keyboard activation share one delegated path.
[
    'toggle-dark-mode', 'open-user-password', 'logout', 'toggle-sidebar',
    'open-spotlight', 'open-admin-issues', 'open-admin-accounts',
    'close-workspace-drawer', 'auto-detect-school', 'open-starter-guide',
    'load-demo-data', 'switch-tab', 'run-auto-diagnosis', 'scan-data-issues',
    'run-data-doctor', 'clear-action-logs', 'save-project-snapshot', 'download-template',
    'add-cohort', 'reset-cohort-selection', 'set-current-exam-meta', 'archive-current-exam',
    'unlock-archive', 'load-exam-from-select', 'show-compare-source', 'reset-system',
    'create-auto-snapshot'
].forEach((action) => {
    assert.ok(html.includes(`data-ui-action="${action}"`), `${action} should use data-ui-action`);
});
assert.ok(html.includes('data-ui-change="switch-cohort"'), 'cohort selector should use data-ui-change');
assert.ok(html.includes('data-ui-change="refresh-exam-preview"'), 'exam year/term should use data-ui-change');
assert.ok(html.includes('data-ui-change="load-project-snapshot"'), 'project restore should use data-ui-change');
assert.ok(html.includes('data-ui-input="mobile-student-search"'), 'mobile student search should use data-ui-input');
[
    'render-horizontal-table', 'toggle-horizontal-heatmap', 'export-macro-tables',
    'export-horizontal-excel', 'export-high-score-excel', 'export-bottom3',
    'calc-indicators', 'export-indicator', 'calc-summary', 'export-summary-table',
    'download-exam-analysis-package', 'render-segment-analysis', 'export-segment-excel',
    'switch-value-added-view', 'export-value-added-excel'
].forEach((action) => {
    assert.ok(html.includes(`data-ui-action="${action}"`), `${action} should use data-ui-action`);
});
[
    'open-user-password', 'toggle-sidebar', 'open-spotlight', 'open-admin-issues',
    'open-admin-accounts', 'close-workspace-drawer', 'auto-detect-school',
    'load-demo-data', 'switch-tab', 'run-auto-diagnosis', 'scan-data-issues',
    'run-data-doctor', 'clear-action-logs', 'save-project-snapshot', 'download-template',
    'render-horizontal-table', 'toggle-horizontal-heatmap', 'export-macro-tables',
    'export-horizontal-excel', 'export-high-score-excel', 'export-bottom3',
    'calc-indicators', 'export-indicator', 'calc-summary', 'export-summary-table',
    'download-exam-analysis-package', 'render-segment-analysis', 'export-segment-excel',
    'switch-value-added-view', 'export-value-added-excel'
].forEach((action) => {
    assert.ok(uiActionsRuntime.includes(`'${action}'`), `${action} should have a shared runtime handler`);
});
// help 的取值是帮助键而非元素 id，必须在 getElementById 之前分流，否则永远解析不到。
// 注意两个 indexOf 都要先确认 >= 0：缺失时 indexOf 返回 -1，而 -1 < 任何正数会让
// 顺序断言假通过（本条最初就是这样的空断言，变异验证时才暴露）。
const helpBranchIndex = foundationRuntime.indexOf("binding.kind === 'help'");
const elementLookupIndex = foundationRuntime.indexOf('document.getElementById(binding.id)');
assert.ok(helpBranchIndex >= 0, 'the delegated binder must keep an explicit module-help branch');
assert.ok(elementLookupIndex >= 0, 'the delegated binder must still resolve element ids for the other bindings');
assert.ok(
    helpBranchIndex < elementLookupIndex,
    'the module-help branch must run before the element lookup'
);
// scrollToAnchor 原本靠 this 做 side-nav 高亮，委托后必须把属性所在元素传回去。
assert.ok(
    /window\.scrollToAnchor\(binding\.id, binding\.holder\)/.test(foundationRuntime),
    'the scroll-anchor branch must pass the attribute holder so side-nav highlighting still works'
);

// DataManager 调度：45 处内联里 44 处收敛为 data-dm-* 属性（余 1 处多语句复合刻意保留）。
assert.ok(
    !/on(?:click|change|input)="DataManager\.\w+\((?:'[^']*'|-?[\d.]*|this(?:\.\w+)?)?\)"/.test(html),
    'single-call DataManager handlers should use data-dm-* attributes instead of inline onclick'
);
assert.ok(count(/data-dm-click=/g) >= 31, 'declarative DataManager click bindings should stay wired');
assert.ok(count(/data-dm-change=/g) >= 11, 'declarative DataManager change bindings should stay wired');
assert.ok(
    /data-dm-click'\)/.test(foundationRuntime)
        && /data-dm-change'\)/.test(foundationRuntime)
        && /data-dm-input'\)/.test(foundationRuntime),
    'the foundation runtime must register all three DataManager dispatch listeners'
);
// 方法名必须过白名单，参数走独立属性 —— 属性值不得成为 eval 面。
assert.ok(
    /isSafeMethodName\s*=\s*\(value\)\s*=>\s*\/\^\[A-Za-z_\$\]/.test(foundationRuntime),
    'the DataManager dispatcher must validate the method name against an identifier pattern'
);
assert.ok(
    /typeof manager\[method\] !== 'function'/.test(foundationRuntime),
    'the DataManager dispatcher must verify the method exists before calling it'
);
// this.checked / this.value / this 三种取参必须仍被支持，否则 8 个 change 绑定会静默失效。
assert.ok(
    /DM_ARG_SOURCES[\s\S]{0,80}?'checked', 'value', 'element'/.test(foundationRuntime),
    'the DataManager dispatcher must keep the checked/value/element argument sources'
);
// 数据管理标签页原本是裸 div（键盘不可达）。role=button 让 app.js 的 Enter 处理器
// （role === 'button' → target.click()）能触发，配合 tabindex 才真正可达。
assert.ok(
    count(/role="button" tabindex="0" data-dm-click="switchTab"/g) >= 8,
    'the data-manager tabs must stay keyboard reachable (role=button + tabindex)'
);

// ─── 品牌：校徽与水印 ─────────────────────────────────────────────────────────
// 徽标文件必须存在（登录页会实际请求它），且登录页用的是抠过白底的透明 PNG。
['school-logo-32.png', 'school-logo-64.png', 'school-logo-128.png', 'school-logo-256.png', 'school-logo-512.png']
    .forEach((file) => {
        assert.ok(fs.existsSync(path.join(root, 'public/assets/brand', file)),
            `school logo asset should exist: ${file}`);
    });
assert.ok(
    /<img src="\.\/assets\/brand\/school-logo-128\.png"/.test(html),
    'the login brand mark should render the school logo image'
);
// 放了真实校徽后必须屏蔽那个 ZH/CJ 文字伪元素，否则字会压在徽标上。
assert.ok(
    /login-clean-mark--logo/.test(html),
    'the logo variant class is required so CSS can disable the initials pseudo-element'
);
// 水印三条硬约束：不拦截交互、不参与文档流、打印时隐藏。
assert.ok(html.includes('class="app-brand-watermark"'), 'the app should carry a brand watermark');
const refinementCss = fs.readFileSync(path.join(root, 'src/assets/css/layout-refinement.css'), 'utf8');
assert.ok(
    /\.app-brand-watermark\s*\{[^}]*pointer-events:\s*none/.test(refinementCss),
    'the watermark must never intercept clicks on data areas'
);
assert.ok(
    /\.app-brand-watermark\s*\{[^}]*position:\s*fixed/.test(refinementCss),
    'the watermark must stay out of document flow so it cannot squeeze tables'
);
assert.ok(
    /@media print\s*\{\s*\.app-brand-watermark\s*\{\s*display:\s*none/.test(refinementCss),
    'the watermark should be hidden when printing'
);

console.log(`html hygiene tests passed: style=${inlineStyleCount}, handlers=${inlineHandlerCount}`);
