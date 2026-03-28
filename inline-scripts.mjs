import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, 'dist', 'index.html');
const outPath = path.join(__dirname, 'lt.html');

// Keep original script semantics intact; only normalize newlines.
function normalizeScript(content) {
    return String(content || '').replace(/\r\n/g, '\n');
}

function normalizeStyle(content) {
    return String(content || '').replace(/\r\n/g, '\n');
}

// Fix synchronization issues (previously in fix_sync.ps1)
function applySyncFixes(content) {
    // Replace "res.success && res.count > 0" with "res.success"
    return content.replace(/if\s*\(\s*res\.success\s*&&\s*res\.count\s*>\s*0\s*\)/g, 'if (res.success)');
}

function resolvePublicScriptPath(projectRoot, src) {
    const relativeSrc = src.replace(/^(\.\/|\/)/, '').split('?')[0].split('#')[0];
    return path.join(projectRoot, 'public', relativeSrc);
}

function resolveBuiltScriptPath(projectRoot, src) {
    const relativeSrc = src.replace(/^(\.\/|\/)/, '').split('?')[0].split('#')[0];
    return path.join(projectRoot, 'dist', relativeSrc);
}

function normalizeScriptAttrs(beforeSrc = '', afterSrc = '') {
    return `${beforeSrc} ${afterSrc}`.replace(/\s+/g, ' ').trim();
}

function readLocalScriptContent(projectRoot, src) {
    const builtPath = resolveBuiltScriptPath(projectRoot, src);
    const publicPath = resolvePublicScriptPath(projectRoot, src);
    const sourcePath = fs.existsSync(builtPath) ? builtPath : publicPath;
    if (!fs.existsSync(sourcePath)) {
        return '';
    }

    let content = fs.readFileSync(sourcePath, 'utf-8');
    content = applySyncFixes(content);
    return normalizeScript(content);
}

function readLocalStyleContent(projectRoot, href) {
    const builtPath = resolveBuiltScriptPath(projectRoot, href);
    const publicPath = resolvePublicScriptPath(projectRoot, href);
    const sourcePath = fs.existsSync(builtPath) ? builtPath : publicPath;
    if (!fs.existsSync(sourcePath)) {
        return '';
    }
    return normalizeStyle(fs.readFileSync(sourcePath, 'utf-8'));
}

// Use regex to locate tags like <script defer src="./assets/js/cloud.js?v=1"></script>
export function inlineLocalScripts(html, { projectRoot = __dirname } = {}) {
    const scriptRegex = /<script([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/gi;

    return String(html || '').replace(scriptRegex, (match, beforeSrc, src, afterSrc) => {
        if (!(src.startsWith('./') || src.startsWith('/'))) {
            return match;
        }

        const builtPath = resolveBuiltScriptPath(projectRoot, src);
        const publicPath = resolvePublicScriptPath(projectRoot, src);
        const sourcePath = fs.existsSync(builtPath) ? builtPath : publicPath;
        if (!fs.existsSync(sourcePath)) {
            console.warn(`Local script not found: ${publicPath}`);
            return match;
        }

        console.log(`Inlining script: ${sourcePath}`);
        const content = readLocalScriptContent(projectRoot, src);

        const attrs = normalizeScriptAttrs(beforeSrc, afterSrc);
        return attrs
            ? `<script ${attrs}>\n${content}\n</script>`
            : `<script>\n${content}\n</script>`;
    });
}

export function inlineLocalStyles(html, { projectRoot = __dirname } = {}) {
    const styleLinkRegex = /<link([^>]*)\bhref="([^"]+\.css(?:\?[^"]*)?)"([^>]*)>/gi;

    return String(html || '').replace(styleLinkRegex, (match, beforeHref, href, afterHref) => {
        const attrs = `${beforeHref} ${afterHref}`;
        if (!/\brel\s*=\s*["']stylesheet["']/i.test(attrs)) {
            return match;
        }
        if (!(href.startsWith('./') || href.startsWith('/'))) {
            return match;
        }
        if (/\/assets\/vendor\//.test(href)) {
            return match;
        }

        const builtPath = resolveBuiltScriptPath(projectRoot, href);
        const publicPath = resolvePublicScriptPath(projectRoot, href);
        const sourcePath = fs.existsSync(builtPath) ? builtPath : publicPath;
        if (!fs.existsSync(sourcePath)) {
            console.warn(`Local stylesheet not found: ${publicPath}`);
            return match;
        }

        console.log(`Inlining stylesheet: ${sourcePath}`);
        const content = readLocalStyleContent(projectRoot, href);
        return `<style>\n${content}\n</style>`;
    });
}

function rewriteLtAssetPaths(html) {
    return String(html || '').replace(/(\.\/|\/)assets\/vendor\//g, './public/assets/vendor/');
}

export function buildLtHtml(html, { projectRoot = __dirname } = {}) {
    return rewriteLtAssetPaths(
        inlineLocalScripts(
            inlineLocalStyles(html, { projectRoot }),
            { projectRoot }
        )
    );
}

function main() {
    if (!fs.existsSync(htmlPath)) {
        console.error('dist/index.html not found!');
        process.exit(1);
    }

    const html = fs.readFileSync(htmlPath, 'utf-8');
    const output = buildLtHtml(html, { projectRoot: __dirname });
    fs.writeFileSync(outPath, output, 'utf-8');
    console.log('Successfully generated lt.html with inlined local scripts.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    main();
}
