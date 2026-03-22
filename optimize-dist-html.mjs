import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { transformSync } from 'esbuild';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distIndexPath = path.join(__dirname, 'dist', 'index.html');

export function minifyInlineScripts(html) {
    const inlineScriptRegex = /<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/gi;
    return String(html || '').replace(inlineScriptRegex, (match, attrs, content) => {
        const code = String(content || '');
        if (!code.trim()) return match;
        try {
            const result = transformSync(code, {
                loader: 'js',
                minify: true,
                legalComments: 'none',
                charset: 'utf8',
                target: 'es2018'
            });
            const normalizedAttrs = String(attrs || '').trim();
            return normalizedAttrs
                ? `<script ${normalizedAttrs}>${result.code}</script>`
                : `<script>${result.code}</script>`;
        } catch (error) {
            console.warn(`[optimize-dist-html] skipped inline script minify: ${error instanceof Error ? error.message : String(error)}`);
            return match;
        }
    });
}

function main() {
    if (!fs.existsSync(distIndexPath)) {
        console.error(`dist/index.html not found: ${distIndexPath}`);
        process.exit(1);
    }
    const html = fs.readFileSync(distIndexPath, 'utf8');
    const optimized = minifyInlineScripts(html);
    fs.writeFileSync(distIndexPath, optimized, 'utf8');
    console.log('Optimized inline scripts in dist/index.html');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    main();
}
