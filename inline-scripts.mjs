import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { collectLazyLoadedJsAssets } from './sync-public-assets.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, 'dist', 'index.html');
const outPath = path.join(__dirname, 'lt.html');

// Keep original script semantics intact; only normalize newlines.
function normalizeScript(content) {
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

export function buildInlineRuntimeRegistry({ projectRoot = __dirname } = {}) {
    const bootRuntimePath = path.join(projectRoot, 'public', 'assets', 'js', 'boot-runtime.js');
    if (!fs.existsSync(bootRuntimePath)) {
        return {};
    }

    const bootRuntime = fs.readFileSync(bootRuntimePath, 'utf8');
    const registry = {};

    for (const assetName of collectLazyLoadedJsAssets(bootRuntime)) {
        const logicalSrc = `./assets/js/${assetName}`;
        const content = readLocalScriptContent(projectRoot, logicalSrc);
        if (!content) continue;
        registry[logicalSrc] = content;
    }

    return registry;
}

export function injectInlineRuntimeRegistry(html, { projectRoot = __dirname } = {}) {
    const registry = buildInlineRuntimeRegistry({ projectRoot });
    const keys = Object.keys(registry);
    if (!keys.length || !html.includes('</head>')) {
        return html;
    }

    const registryPayload = JSON.stringify(registry).replace(/</g, '\\u003c');
    const registryScript = `
    <script>
        window.__INLINE_RUNTIME_SOURCES = Object.assign({}, window.__INLINE_RUNTIME_SOURCES || {}, ${registryPayload});
    </script>
`;

    return html.replace('</head>', registryScript + '\n</head>');
}

// =====================================================================
// viteSingleFile strips external <script> tags from <head>.
// Re-inject them so the deployed build keeps Supabase, XLSX, and other CDNs.
// =====================================================================
const cdnScripts = `
    <!-- Re-injected by inline-scripts.mjs (viteSingleFile strips these) -->
    <script>
        // Fallback Supabase init so sbClient is always available.
        var sbClient = window.sbClient || null;
        window.SUPABASE_URL = localStorage.getItem('SUPABASE_URL') || "https://okwcciujnfvobbwaydiv.supabase.co";
        window.SUPABASE_KEY = localStorage.getItem('SUPABASE_KEY') || "sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4";
        window.EDGE_GATEWAY_URL = localStorage.getItem('EDGE_GATEWAY_URL') || "https://okwcciujnfvobbwaydiv.supabase.co/functions/v1/edu-gateway-v2";
        window.initSupabase = function () {
            if (window.supabase && !sbClient) {
                sbClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
                window.sbClient = sbClient;
                console.log("Supabase initialized");
            }
        };
    </script>
    <script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js" crossorigin="anonymous"
        onload="window.initSupabase()"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/lz-string@1.5.0/libs/lz-string.min.js'"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js'"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js'"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/chart.js@4.4.1/dist/chart.umd.min.js'"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/sweetalert2@11/dist/sweetalert2.all.min.js'"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'"></script>
    <script defer src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'"></script>
`;

function injectCdnScripts(html) {
    if (!html.includes('</head>')) {
        console.warn('Could not find </head> tag to inject CDN scripts.');
        return html;
    }
    console.log('Injected CDN scripts and Supabase init into lt.html');
    return html.replace('</head>', cdnScripts + '\n</head>');
}

export function buildLtHtml(html, { projectRoot = __dirname } = {}) {
    return injectCdnScripts(injectInlineRuntimeRegistry(inlineLocalScripts(html, { projectRoot }), { projectRoot }));
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
