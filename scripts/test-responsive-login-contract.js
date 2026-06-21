const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'src', 'index.html');
const cssPath = path.join(root, 'src', 'assets', 'css', 'responsive-login-final.css');
const packagePath = path.join(root, 'package.json');

assert.ok(fs.existsSync(cssPath), 'responsive-login-final.css must exist');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const stylesheet = './assets/css/responsive-login-final.css';

assert.strictEqual(
    packageJson.scripts['check:responsive-login'],
    'npm run test:responsive-login-contract && npm run test:responsive-login-layout',
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
assert.strictEqual(stylesheetLinks.at(-1).split('?')[0], stylesheet, 'responsive-login-final.css must be the last stylesheet loaded');

const tabletQuery = /@media\s*\(min-width:\s*769px\)\s*and\s*\(max-width:\s*960px\)/i;
const phoneQuery = /@media\s*\(max-width:\s*768px\)/i;
assert.match(css, tabletQuery, 'tablet breakpoint must target 769px through 960px');
assert.match(css, /grid-template-columns:\s*minmax\(220px,\s*40fr\)\s+minmax\(0,\s*60fr\)/, 'tablet shell must use the 40/60 grid contract');
assert.match(css, phoneQuery, 'phone breakpoint must target widths up to 768px');

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
