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
assert.match(html, /runtime-loader-runtime-runtime-[0-9a-f]{12}\.js/, 'runtime loader should use a content-versioned filename');
assert.ok(html.includes(`boot-runtime-${serviceWorkerVersion}.js`), 'boot runtime should load from a content-versioned pathname');
assert.ok(html.includes(`service-worker-runtime-${serviceWorkerVersion}.js`), 'service worker runtime should load from a content-versioned pathname');
assert.ok(!/\.\/assets\/js\/[^"']+\.js\?v=/.test(html), 'index.html should not query-version runtime JS entries');
assert.ok(!/[�锟鏅烘収]/.test(html.slice(0, html.indexOf('</head>'))), 'index head metadata should not contain mojibake');
assert.ok(inlineStyleCount <= 879, `inline style count grew: ${inlineStyleCount} > 879`);
assert.ok(inlineHandlerCount <= 356, `inline event handler count grew: ${inlineHandlerCount} > 356`);
assert.ok(!html.includes('sb_publishable_'), 'index.html should not embed Supabase publishable keys');

console.log(`html hygiene tests passed: style=${inlineStyleCount}, handlers=${inlineHandlerCount}`);
