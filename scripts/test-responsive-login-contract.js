const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const htmlPath = path.join(root, 'src', 'index.html');
const cssPath = path.join(root, 'src', 'assets', 'css', 'responsive-login-final.css');

assert.ok(fs.existsSync(cssPath), 'responsive-login-final.css must exist');

const html = fs.readFileSync(htmlPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');
const stylesheet = './assets/css/responsive-login-final.css';

assert.ok(html.includes(stylesheet), 'index.html must load responsive-login-final.css');
assert.ok(
    html.lastIndexOf(stylesheet) > html.lastIndexOf('rel="stylesheet"'),
    'responsive-login-final.css must be the last stylesheet loaded'
);
assert.match(css, /@media\s*\(min-width:\s*769px\)\s*and\s*\(max-width:\s*960px\)/, 'tablet breakpoint must target 769px through 960px');
assert.match(css, /grid-template-columns:\s*minmax\(220px,\s*40fr\)\s+minmax\(0,\s*60fr\)/, 'tablet shell must use the 40/60 grid contract');
assert.match(css, /@media\s*\(max-width:\s*768px\)/, 'phone breakpoint must target widths up to 768px');
assert.match(css, /min-height:\s*100dvh/, 'phone layout must use the dynamic viewport height');
assert.match(css, /padding-bottom:\s*max\([^;]*env\(safe-area-inset-bottom\)[^;]*\)/, 'phone layout must include safe-area bottom padding');

function readBlock(source, start) {
    const open = source.indexOf('{', start);
    let depth = 0;
    for (let index = open; index < source.length; index += 1) {
        if (source[index] === '{') depth += 1;
        if (source[index] === '}' && --depth === 0) return source.slice(open + 1, index);
    }
    throw new Error('Unclosed CSS block');
}

for (const query of [
    '@media (min-width: 769px) and (max-width: 960px)',
    '@media (max-width: 768px)'
]) {
    const responsiveRules = readBlock(css, css.indexOf(query));
    assert.doesNotMatch(responsiveRules, /\.login-clean-card\s*\{[^}]*position:\s*absolute/s, 'responsive auth panel must not use absolute positioning');
    assert.doesNotMatch(responsiveRules, /\.login-clean-card\s*\{[^}]*margin-top:\s*-/s, 'responsive auth panel must not use a negative top margin');
}

console.log('Responsive login contract passed.');
