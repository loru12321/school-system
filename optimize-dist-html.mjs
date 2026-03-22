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

export function minifyInlineStyles(html) {
    const inlineStyleRegex = /<style([^>]*)>([\s\S]*?)<\/style>/gi;
    return String(html || '').replace(inlineStyleRegex, (match, attrs, content) => {
        const css = String(content || '');
        if (!css.trim()) return match;
        try {
            const result = transformSync(css, {
                loader: 'css',
                minify: true,
                legalComments: 'none',
                charset: 'utf8',
                target: 'es2018'
            });
            const normalizedAttrs = String(attrs || '').trim();
            return normalizedAttrs
                ? `<style ${normalizedAttrs}>${result.code}</style>`
                : `<style>${result.code}</style>`;
        } catch (error) {
            console.warn(`[optimize-dist-html] skipped inline style minify: ${error instanceof Error ? error.message : String(error)}`);
            return match;
        }
    });
}

export function stripHtmlComments(html) {
    const placeholders = [];
    const protectedHtml = String(html || '').replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, (block) => {
        const token = `__HTML_BLOCK_${placeholders.length}__`;
        placeholders.push(block);
        return token;
    });
    const stripped = protectedHtml.replace(/<!--[\s\S]*?-->/g, '');
    return stripped.replace(/__HTML_BLOCK_(\d+)__/g, (_, index) => placeholders[Number(index)] || '');
}

export function optimizeDistHtml(html) {
    return stripHtmlComments(minifyInlineStyles(minifyInlineScripts(html)));
}

function main() {
    if (!fs.existsSync(distIndexPath)) {
        console.error(`dist/index.html not found: ${distIndexPath}`);
        process.exit(1);
    }
    const html = fs.readFileSync(distIndexPath, 'utf8');
    const optimized = optimizeDistHtml(html);
    fs.writeFileSync(distIndexPath, optimized, 'utf8');
    console.log('Optimized inline scripts and styles in dist/index.html');
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
    main();
}
