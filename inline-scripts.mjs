import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, 'dist', 'index.html');
const outPath = path.join(__dirname, 'lt.html');

if (!fs.existsSync(htmlPath)) {
    console.error('dist/index.html not found!');
    process.exit(1);
}

let html = fs.readFileSync(htmlPath, 'utf-8');

// Use regex to locate tags like <script src="./assets/js/cloud.js"></script>
const scriptRegex = /<script\s+src="([^"]+)"\s*><\/script>/gi;

html = html.replace(scriptRegex, (match, src) => {
    // Check if it's a local file
    if (src.startsWith('./') || src.startsWith('/')) {
        // Strip leading ./ or /
        const relativeSrc = src.replace(/^(\.\/|\/)/, '');
        // Search in public folder directly 
        const publicPath = path.join(__dirname, 'public', relativeSrc);

        if (fs.existsSync(publicPath)) {
            console.log(`Inlining script: ${publicPath}`);
            const content = fs.readFileSync(publicPath, 'utf-8');
            return `<script>\n${content}\n</script>`;
        } else {
            console.warn(`Local script not found: ${publicPath}`);
        }
    }
    return match; // Return unchanged if not found or if it's external (e.g. CDN)
});

// =====================================================================
// 🔴 FIX: viteSingleFile strips ALL external <script> tags from <head>.
// We must re-inject them so the deployed build has Supabase, XLSX, etc.
// =====================================================================
const cdnScripts = `
    <!-- 🔧 Re-injected by inline-scripts.mjs (viteSingleFile strips these) -->
    <script>
        // ✅ 兜底初始化 Supabase，防止 sbClient 未定义
        var sbClient = window.sbClient || null;
        window.SUPABASE_URL = localStorage.getItem('SUPABASE_URL') || "https://okwcciujnfvobbwaydiv.supabase.co";
        window.SUPABASE_KEY = localStorage.getItem('SUPABASE_KEY') || "sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4";
        window.initSupabase = function () {
            if (window.supabase && !sbClient) {
                sbClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
                window.sbClient = sbClient;
                console.log("✅ Supabase 连接初始化成功");
            }
        };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js" crossorigin="anonymous"
        onload="window.initSupabase()"></script>
    <script src="https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/lz-string@1.5.0/libs/lz-string.min.js'"></script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" crossorigin="anonymous"
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

// Inject right before </head>
if (html.includes('</head>')) {
    html = html.replace('</head>', cdnScripts + '\n</head>');
    console.log('✅ Injected CDN scripts and Supabase init into lt.html');
} else {
    console.warn('⚠️ Could not find </head> tag to inject CDN scripts!');
}

fs.writeFileSync(outPath, html, 'utf-8');
console.log('Successfully generated lt.html with inlined local scripts.');
