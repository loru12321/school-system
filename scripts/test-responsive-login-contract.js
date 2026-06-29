const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'src', 'index.html');
const cssPath = path.join(root, 'src', 'assets', 'css', 'responsive-login-final.css');
const liteCssPath = path.join(root, 'src', 'assets', 'css', 'login-workbench-lite.css');
const packagePath = path.join(root, 'package.json');

assert.ok(fs.existsSync(cssPath), 'responsive-login-final.css must exist');
assert.ok(fs.existsSync(liteCssPath), 'login-workbench-lite.css must exist');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const liteCss = fs.readFileSync(liteCssPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const stylesheet = './assets/css/responsive-login-final.css';
const liteStylesheet = './assets/css/login-workbench-lite.css';

assert.strictEqual(
    packageJson.scripts['check:responsive-login'],
    'npm run test:responsive-login-contract && npm run test:login-performance-contract && npm run test:responsive-login-layout',
    'responsive login checks must share one focused gate'
);
for (const gate of ['prevalidate', 'precheck:p1']) {
    assert.strictEqual(packageJson.scripts[gate], 'npm run check:responsive-login', `${gate} must run responsive login verification`);
}

const stylesheetLinks = [...html.matchAll(/<link\b[^>]*>/gi)]
    .filter(match => /\brel\s*=\s*(["'])[^"']*\bstylesheet\b[^"']*\1/i.test(match[0]))
    .map(match => match[0].match(/\bhref\s*=\s*(["'])([^"']+)\1/i)?.[2])
    .filter(Boolean);
assert.ok(stylesheetLinks.some(href => href.split('?')[0] === stylesheet), 'index.html must load responsive-login-final.css');
assert.ok(stylesheetLinks.some(href => href.split('?')[0] === liteStylesheet), 'index.html must load login-workbench-lite.css');
assert.strictEqual(stylesheetLinks.at(-1).split('?')[0], liteStylesheet, 'login-workbench-lite.css must be the last stylesheet loaded');
assert.ok(
    stylesheetLinks.findIndex(href => href.split('?')[0] === stylesheet) < stylesheetLinks.findIndex(href => href.split('?')[0] === liteStylesheet),
    'login-workbench-lite.css must load after responsive-login-final.css'
);
assert.ok(
    /<button\b[^>]*id="login-submit-button"[^>]*data-login-submit="1"[^>]*>/i.test(html),
    'login submit button must keep the runtime submit hook'
);
assert.doesNotMatch(
    html,
    /<button\b[^>]*id="login-submit-button"[^>]*\bonclick=/i,
    'login submit button must not use inline onclick because boot runtime owns single-submit behavior'
);
assert.ok(
    html.includes('id="login-entry-transition"') && html.includes('data-login-transition-title') && html.includes('data-login-transition-copy'),
    'login page must include a visible entry transition region for slow workbench loading'
);
assert.ok(!html.includes('class="login-styleboard"'), 'login page should not ship decorative styleboard cards in the initial DOM');
assert.ok(!fs.readFileSync(path.join(root, 'public', 'assets', 'js', 'login-entry-runtime.js'), 'utf8').includes("dataset.loginSkin = 'passport'"), 'login runtime must not switch the page back to the heavy passport skin');
assert.ok(
    html.includes('id="audio-debug"') && html.includes('data-sound-import="1"') && html.includes('data-sound-preview="1"'),
    'audio debug module must expose system sound preview/import controls'
);

const tabletQuery = /@media\s*\(min-width:\s*769px\)\s*and\s*\(max-width:\s*1180px\)/i;
const phoneQuery = /@media\s*\(max-width:\s*768px\)/i;
assert.match(css, tabletQuery, 'tablet breakpoint must target 769px through 1180px');
assert.match(css, /width:\s*min\(100%,\s*760px\)/, 'tablet shell must keep the form readable instead of stretching too wide');
assert.match(css, /flex-direction:\s*column/, 'tablet shell must use a stacked premium layout');
assert.match(css, /border-radius:\s*28px/, 'tablet shell must remain a polished card');
assert.match(css, phoneQuery, 'phone breakpoint must target widths up to 768px');
assert.match(css, /\.login-styleboard,\s*[\s\S]*?display:\s*none\s*!important/, 'responsive rules must explicitly hide the legacy styleboard');
assert.match(liteCss, /#login-overlay\s*\{[^}]*background:\s*#f6f8fb\s*!important/s, 'lite login theme must use the workspace background');
assert.match(liteCss, /background-image:\s*none\s*!important/, 'lite login theme must clear inherited radial gradients');
assert.match(liteCss, /#login-overlay\s+\*[\s\S]*animation:\s*none\s*!important/, 'lite login theme must disable login page animations');
assert.match(liteCss, /backdrop-filter:\s*none\s*!important/, 'lite login theme must neutralize backdrop filters');
assert.match(liteCss, /body\[data-platform-shell="apple"\]\s+#login-overlay\s+\.login-auth-panel/, 'lite login theme must target apple login panel overrides');
assert.doesNotMatch(liteCss, /backdrop-filter:\s*blur\(/, 'lite login theme must not introduce backdrop blur');
assert.doesNotMatch(liteCss, /box-shadow:\s*0\s+3\dpx\s+8\dpx/, 'lite login theme must not introduce oversized login shadows');

function readBlock(source, start) {
    const open = source.indexOf('{', start);
    let depth = 0;
    for (let index = open; index < source.length; index += 1) {
        if (source[index] === '{') depth += 1;
        if (source[index] === '}' && --depth === 0) return source.slice(open + 1, index);
    }
    throw new Error('Unclosed CSS block');
}

const responsiveBlocks = [tabletQuery, phoneQuery].map(query => {
    const match = query.exec(css);
    assert.ok(match, `missing responsive query: ${query}`);
    return readBlock(css, match.index);
});

for (const responsiveRules of responsiveBlocks) {
    assert.doesNotMatch(responsiveRules, /\.login-clean-card\s*\{[^}]*position:\s*absolute/s, 'responsive auth panel must not use absolute positioning');
    assert.doesNotMatch(responsiveRules, /\.login-clean-card\s*\{[^}]*margin-top:\s*-/s, 'responsive auth panel must not use a negative top margin');
}

const phoneRules = responsiveBlocks[1];
assert.match(phoneRules, /min-height:\s*100vh[^}]*min-height:\s*100svh[^}]*min-height:\s*100dvh/s, 'phone shell must provide ordered viewport-height fallbacks');
assert.match(phoneRules, /padding-bottom:\s*\d+px[^}]*padding-bottom:\s*max\([^;]*env\(safe-area-inset-bottom,\s*0px\)[^;]*\)/s, 'phone shell must provide plain and safe-area bottom padding');
for (const selector of ['login-clean-stage', 'login-clean-card']) {
    const rule = new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`, 's').exec(phoneRules)?.[1] || '';
    assert.match(rule, /padding-left:\s*max\([^;]*env\(safe-area-inset-left,\s*0px\)[^;]*\)/, `${selector} must respect the left safe area`);
    assert.match(rule, /padding-right:\s*max\([^;]*env\(safe-area-inset-right,\s*0px\)[^;]*\)/, `${selector} must respect the right safe area`);
}

console.log('Responsive login contract passed.');
