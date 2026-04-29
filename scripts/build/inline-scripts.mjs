import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_PROJECT_ROOT = path.resolve(__dirname, '../../');

const htmlPath = path.join(DEFAULT_PROJECT_ROOT, 'dist', 'index.html');
const outPath = path.join(DEFAULT_PROJECT_ROOT, 'lt.html');
const OPTIONAL_INLINE_RUNTIME_PATHS = [
    './assets/js/account-admin-runtime.js',
    './assets/js/history-compare-runtime.js',
    './assets/js/perf-mobile-runtime.js',
    './assets/js/mobile-app-runtime.js',
    './assets/js/data-manager-sql.js',
    './assets/vendor/alasql/alasql.min.js',
    './assets/vendor/jspdf/jspdf.umd.min.js',
    './assets/vendor/html2canvas/html2canvas.min.js',
    './assets/js/report-render-runtime.js',
    './assets/js/report-chart-runtime.js',
    './assets/js/report-export-runtime.js',
    './assets/js/report-ai-runtime.js',
    './assets/js/ai-hub-runtime.js',
    './assets/js/school-profile-runtime.js',
    './assets/js/teaching-management-runtime.js',
    './assets/js/app-download-runtime.js',
    './assets/js/teacher-analysis-core-runtime.js',
    './assets/js/teacher-analysis-ui-runtime.js',
    './assets/js/teacher-analysis-bridge-runtime.js',
    './assets/js/teacher-analysis-main-runtime.js',
    './assets/js/single-school-eval-runtime.js',
    './assets/js/progress-analysis-runtime.js',
    './assets/js/student-compare-result-runtime.js',
    './assets/js/student-compare-generate-runtime.js',
    './assets/js/student-compare-cloud-runtime.js',
    './assets/js/teacher-compare-result-runtime.js',
    './assets/js/teacher-compare-cloud-runtime.js',
    './assets/js/macro-compare-result-runtime.js',
    './assets/js/macro-compare-cloud-runtime.js'
];
const BOOT_RUNTIME_PATH = './assets/js/boot-runtime.js';

// Keep original script semantics intact; only normalize newlines.
function normalizeScript(content) {
    return String(content || '').replace(/\r\n/g, '\n');
}

function normalizeStyle(content) {
    return String(content || '').replace(/\r\n/g, '\n');
}

// Fix synchronization issues
function applySyncFixes(content) {
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

function readLocalScriptContent(projectRoot, src) {
    const builtPath = resolveBuiltScriptPath(projectRoot, src);
    const publicPath = resolvePublicScriptPath(projectRoot, src);

    // For boot-runtime.js, prefer public if it's been recently patched
    const isBootRuntime = src.includes('boot-runtime.js');
    const sourcePath = (isBootRuntime && fs.existsSync(publicPath)) ? publicPath : (fs.existsSync(builtPath) ? builtPath : publicPath);

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

/**
 * Robustly inline scripts by parsing the HTML structure more safely than a single global regex.
 */
export function inlineLocalScripts(html, { projectRoot = DEFAULT_PROJECT_ROOT } = {}) {
    const scriptRegex = /<script([^>]*)\bsrc="([^"]+)"([^>]*)><\/script>/gi;
    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = scriptRegex.exec(html)) !== null) {
        const [fullMatch, beforeSrc, src, afterSrc] = match;

        result += html.substring(lastIndex, match.index);

        if (!(src.startsWith('./') || src.startsWith('/'))) {
            result += fullMatch;
        } else {
            const content = readLocalScriptContent(projectRoot, src);
            if (content) {
                console.log(`Inlining script: ${src}`);
                const attrs = `${beforeSrc} ${afterSrc}`.replace(/\s+/g, ' ').trim();
                result += attrs ? `<script ${attrs}>\n${content}\n</script>` : `<script>\n${content}\n</script>`;
            } else {
                result += fullMatch;
            }
        }
        lastIndex = scriptRegex.lastIndex;
    }
    result += html.substring(lastIndex);
    return result;
}

export function inlineLocalStyles(html, { projectRoot = DEFAULT_PROJECT_ROOT } = {}) {
    const styleLinkRegex = /<link([^>]*)\bhref="([^"]+\.css(?:\?[^"]*)?)"([^>]*)>/gi;
    let result = '';
    let lastIndex = 0;
    let match;

    while ((match = styleLinkRegex.exec(html)) !== null) {
        const [fullMatch, beforeHref, href, afterHref] = match;

        result += html.substring(lastIndex, match.index);

        const attrs = `${beforeHref} ${afterHref}`;
        const isStylesheet = /\brel\s*=\s*["']stylesheet["']/i.test(attrs);
        const isLocal = href.startsWith('./') || href.startsWith('/');
        const isVendor = /\/assets\/vendor\//.test(href);

        if (isStylesheet && isLocal && !isVendor) {
            const content = readLocalStyleContent(projectRoot, href);
            if (content) {
                console.log(`Inlining stylesheet: ${href}`);
                result += `<style>\n${content}\n</style>`;
            } else {
                result += fullMatch;
            }
        } else {
            result += fullMatch;
        }
        lastIndex = styleLinkRegex.lastIndex;
    }
    result += html.substring(lastIndex);
    return result;
}

function rewriteLtAssetPaths(html) {
    let result = String(html || '').replace(/(\.\/|\/)assets\//g, './public/assets/');
    result = result.replace(/favicon\.ico/g, 'public/favicon.ico');
    return result;
}

function buildInlineRuntimeSourceMap(projectRoot) {
    const runtimePaths = collectInlineRuntimePaths(projectRoot);
    const entries = runtimePaths
        .map((src) => {
            const content = readLocalScriptContent(projectRoot, src);
            return content ? [src, content] : null;
        })
        .filter(Boolean);
    return Object.fromEntries(entries);
}

function getBootRuntimeSkillSources(projectRoot) {
    const bootContent = readLocalScriptContent(projectRoot, BOOT_RUNTIME_PATH);
    if (!bootContent) return [];
    const manifestMatch = bootContent.match(/var\s+SYSTEM_RUNTIME_SKILLS\s*=\s*\{([\s\S]*?)\n\};/);
    if (!manifestMatch) return [];
    const manifestSource = manifestMatch[1];
    return Array.from(manifestSource.matchAll(/\bsrc\s*:\s*['"]([^'"]+)['"]/g))
        .map((match) => match[1])
        .filter((src) => /^\.\/assets\/(?:js|vendor)\//.test(src));
}

export function collectInlineRuntimePaths(projectRoot = DEFAULT_PROJECT_ROOT) {
    const merged = new Set([
        ...OPTIONAL_INLINE_RUNTIME_PATHS,
        ...getBootRuntimeSkillSources(projectRoot)
    ]);
    return Array.from(merged).sort();
}

function injectInlineRuntimeSourceMap(html, { projectRoot = DEFAULT_PROJECT_ROOT } = {}) {
    const sourceMap = buildInlineRuntimeSourceMap(projectRoot);
    const keys = Object.keys(sourceMap);
    if (!keys.length) return String(html || '');
    const payload = JSON.stringify(sourceMap).replace(/<\/script>/gi, '<\\/script>');
    const injection = `<script>window.__INLINE_RUNTIME_SOURCES=${payload};</script>`;
    const output = String(html || '');
    if (/<\/head>/i.test(output)) {
        return output.replace(/<\/head>/i, (match) => `${injection}${match}`);
    }
    return `${injection}${output}`;
}

function verifyIntegrity(html) {
    if (!html.includes('</html>')) {
        throw new Error('Integrity check failed: Missing </html> tag.');
    }
    if (html.length < 100000) { // Expected size for lt.html is ~700KB+
        throw new Error(`Integrity check failed: File size too small (${html.length} bytes).`);
    }
    console.log(`Integrity check passed: ${html.length} bytes.`);
}

export function buildLtHtml(html, { projectRoot = DEFAULT_PROJECT_ROOT } = {}) {
    let processed = inlineLocalStyles(html, { projectRoot });
    processed = inlineLocalScripts(processed, { projectRoot });
    processed = rewriteLtAssetPaths(processed);
    processed = injectInlineRuntimeSourceMap(processed, { projectRoot });
    verifyIntegrity(processed);
    return processed;
}

function main() {
    try {
        if (!fs.existsSync(htmlPath)) {
            console.error('dist/index.html not found!');
            process.exit(1);
        }

        const html = fs.readFileSync(htmlPath, 'utf-8');
        const output = buildLtHtml(html, { projectRoot: DEFAULT_PROJECT_ROOT });
        fs.writeFileSync(outPath, output, 'utf-8');
        console.log('Successfully generated lt.html with inlined local scripts.');
    } catch (err) {
        console.error('Build failed:', err.message);
        process.exit(1);
    }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    main();
}
