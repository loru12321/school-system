const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'src/index.html'), 'utf8');
const serviceWorkerRuntime = fs.readFileSync(path.join(root, 'public/assets/js/service-worker-runtime.js'), 'utf8');
const serviceWorkerVersion = (serviceWorkerRuntime.match(/const\s+SERVICE_WORKER_VERSION\s*=\s*'([^']+)'/) || [])[1] || '';

function count(pattern) {
    return (html.match(pattern) || []).length;
}

const inlineStyleCount = count(/\sstyle=/g);
const inlineHandlerCount = count(/\son[a-z]+=/g);

assert.ok(html.indexOf('runtime-registry-runtime.js') < html.indexOf(`boot-runtime-${serviceWorkerVersion}.js`), 'runtime registry must load before boot runtime');
assert.ok(html.includes('<meta name="description"'), 'index.html should include a search result description');
assert.ok(html.includes('<meta name="application-name" content="校衡台">'), 'index.html should expose the application name to browsers');
assert.ok(html.includes('学校成绩导入、届别档案、教学分析、教师画像和家校报告'), 'index.html should keep readable search description copy');
assert.ok(html.includes('<meta name="color-scheme" content="light dark">'), 'index.html should declare supported color schemes');
assert.ok(html.includes('<link rel="canonical" href="https://schoolsystem.com.cn/">'), 'index.html should include the canonical production URL');
assert.ok(html.includes('<link rel="alternate" hreflang="zh-CN" href="https://schoolsystem.com.cn/">'), 'index.html should include a zh-CN alternate URL');
assert.ok(html.includes('<link rel="alternate" hreflang="x-default" href="https://schoolsystem.com.cn/">'), 'index.html should include an x-default alternate URL');
assert.ok(html.includes('<link rel="manifest" href="./site.webmanifest">'), 'index.html should link the web app manifest');
assert.ok(html.includes('<link rel="apple-touch-icon" sizes="192x192" href="./assets/brand/app-icon-192.png">'), 'index.html should provide a PNG touch icon');
assert.ok(html.includes('<meta property="og:title" content="校衡台">'), 'index.html should include Open Graph metadata');
assert.ok(html.includes('<meta property="og:site_name" content="校衡台">'), 'index.html should include readable Open Graph site name');
assert.ok(html.includes('<meta name="twitter:title" content="校衡台">'), 'index.html should include readable Twitter metadata');
assert.ok(html.includes('<meta name="apple-mobile-web-app-title" content="校衡台">'), 'index.html should expose readable iOS app title');
assert.ok(html.includes('<meta property="og:locale" content="zh_CN">'), 'index.html should include the Open Graph locale');
assert.ok(html.includes('<meta property="og:image" content="https://schoolsystem.com.cn/icon.svg">'), 'index.html should include a share image');
assert.ok(html.includes('<meta name="twitter:card" content="summary">'), 'index.html should include Twitter card metadata');
assert.ok(html.includes('<meta name="twitter:image" content="https://schoolsystem.com.cn/icon.svg">'), 'index.html should include a Twitter share image');
assert.ok(html.includes('type="image/x-icon"'), 'favicon link should include an explicit content type');
assert.ok(html.includes(`service-worker-runtime-${serviceWorkerVersion}.js`), 'index.html should register the service worker runtime');
assert.ok(html.includes('./assets/css/product-redesign.css?v=20260617-table-anchor-nav-v1'), 'index.html should load the product redesign layer after legacy styles');
assert.ok(html.indexOf('layout-refinement.css') < html.indexOf('product-redesign.css'), 'product redesign should override layout refinement styles');
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
assert.ok(inlineStyleCount <= 879, `inline style count grew: ${inlineStyleCount} > 879`);
// 297: the freshman module's six upload/data-source handlers moved into
// freshman-exam-runtime.js (data-fb-pick / data-fb-change); the 17 modal-close,
// 12 file-pick, 15 showModuleHelp and 11 scrollToAnchor boilerplate handlers all
// moved into the delegated binder in app-foundation-runtime.js.
// Ratchet only downward from here.
assert.ok(inlineHandlerCount <= 297, `inline event handler count grew: ${inlineHandlerCount} > 297`);
assert.ok(!html.includes('sb_publishable_'), 'index.html should not embed Supabase publishable keys');

// The freshman module's upload/data-source controls are bound declaratively in
// freshman-exam-runtime.js. Keep the markup and the binder in sync so neither
// side can drift back to inline attributes or silently drop the listeners.
const freshmanRuntime = fs.readFileSync(path.join(root, 'public/assets/js/freshman-exam-runtime.js'), 'utf8');
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
// help 的取值是帮助键而非元素 id，必须在 getElementById 之前分流，否则永远解析不到。
assert.ok(
    foundationRuntime.indexOf("binding.kind === 'help'")
        < foundationRuntime.indexOf('document.getElementById(binding.id)'),
    'the module-help branch must run before the element lookup'
);
// scrollToAnchor 原本靠 this 做 side-nav 高亮，委托后必须把属性所在元素传回去。
assert.ok(
    /window\.scrollToAnchor\(binding\.id, binding\.holder\)/.test(foundationRuntime),
    'the scroll-anchor branch must pass the attribute holder so side-nav highlighting still works'
);

console.log(`html hygiene tests passed: style=${inlineStyleCount}, handlers=${inlineHandlerCount}`);
