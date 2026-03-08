import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.join(__dirname, "dist", "index.html");
const outPath = path.join(__dirname, "lt.html");

if (!fs.existsSync(htmlPath)) {
  console.error("dist/index.html not found");
  process.exit(1);
}

let html = fs.readFileSync(htmlPath, "utf-8");

// Inline local script tags that still reference public assets.
const scriptRegex = /<script\s+src="([^"]+)"\s*><\/script>/gi;
html = html.replace(scriptRegex, (match, src) => {
  if (!src.startsWith("./") && !src.startsWith("/")) {
    return match;
  }

  const relativeSrc = src.replace(/^(\.\/|\/)/, "");
  const publicPath = path.join(__dirname, "public", relativeSrc);
  if (!fs.existsSync(publicPath)) {
    console.warn(`Local script not found: ${publicPath}`);
    return match;
  }

  console.log(`Inlining script: ${publicPath}`);
  const content = fs.readFileSync(publicPath, "utf-8");
  return `<script>\n${content}\n<\/script>`;
});

// viteSingleFile removes external head scripts. Re-add runtime CDN dependencies.
const cdnScripts = `
    <!-- Re-injected by inline-scripts.mjs -->
    <script>
        var sbClient = window.sbClient || null;
        window.SUPABASE_URL = localStorage.getItem("SUPABASE_URL") || "https://okwcciujnfvobbwaydiv.supabase.co";
        window.SUPABASE_KEY = localStorage.getItem("SUPABASE_KEY") || "sb_publishable_NQqut_NdTW2z1_R27rJ8jA_S3fTh2r4";
        window.initSupabase = function () {
            if (window.supabase && !sbClient) {
                sbClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_KEY);
                window.sbClient = sbClient;
                console.log("Supabase client initialized");
            }
            return sbClient;
        };
    <\/script>
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js" crossorigin="anonymous"
        onload="window.initSupabase()"
        onerror="this.onerror=null;this.src='https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.min.js';this.onload=function(){window.initSupabase()}"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/lz-string@1.5.0/libs/lz-string.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/lz-string@1.5.0/libs/lz-string.min.js'"><\/script>
    <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/xlsx@0.18.5/dist/xlsx.full.min.js'"><\/script>
    <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js'"><\/script>
    <script defer src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/chart.js@4.4.1/dist/chart.umd.min.js'"><\/script>
    <script defer src="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.all.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/sweetalert2@11/dist/sweetalert2.all.min.js'"><\/script>
    <script defer src="https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'"><\/script>
    <script defer src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js" crossorigin="anonymous"
        onerror="this.onerror=null;this.src='https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'"><\/script>
`;

if (html.includes("</head>")) {
  html = html.replace("</head>", `${cdnScripts}\n</head>`);
  console.log("Injected CDN scripts and Supabase bootstrap into lt.html");
} else {
  console.warn("Could not find </head> to inject CDN scripts");
}

fs.writeFileSync(outPath, html, "utf-8");
console.log("Generated lt.html with inlined local scripts");
