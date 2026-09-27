/**
 * check-dist-fresh.js
 *
 * Verifies that dist/index.html exists and is not older than key source files.
 * Run automatically by deploy.ps1 before staging to catch "forgot to build" mistakes.
 *
 * Exit 0 = dist is fresh. Exit 1 = dist is stale or missing.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function mtimeMs(filePath) {
    try {
        return fs.statSync(filePath).mtimeMs;
    } catch {
        return null;
    }
}

const distHtml = path.join(root, 'dist', 'index.html');
const distMtime = mtimeMs(distHtml);

if (distMtime === null) {
    console.error('[check-dist-fresh] ❌ dist/index.html does not exist. Run: npm run build');
    process.exit(1);
}

// Source files that require a rebuild if modified after dist/index.html.
const sourceFiles = [
    'vite.config.js',
    'package.json',
    'package-lock.json',
];

// Runtime JS lives in public/, CSS is nested in src/, and postprocessors
// also affect the shipped output. All of these are build inputs.
function collectSourceFiles(relativeDirectory) {
    const directory = path.join(root, relativeDirectory);
    if (!fs.existsSync(directory)) return;
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const relativePath = path.join(relativeDirectory, entry.name);
        if (entry.isDirectory()) collectSourceFiles(relativePath);
        else if (entry.isFile()) sourceFiles.push(relativePath);
    }
}
['src', 'public', path.join('scripts', 'build'), path.join('scripts', 'vendor')].forEach(collectSourceFiles);

const GRACE_MS = 5000; // 5s — tolerate minor clock skew
const staleFiles = [];

for (const rel of sourceFiles) {
    const abs = path.join(root, rel);
    const srcMtime = mtimeMs(abs);
    if (srcMtime !== null && srcMtime > distMtime + GRACE_MS) {
        const deltaS = ((srcMtime - distMtime) / 1000).toFixed(1);
        staleFiles.push(`  • ${rel}  (+${deltaS}s newer than dist/index.html)`);
    }
}

if (staleFiles.length === 0) {
    const ageMin = ((Date.now() - distMtime) / 60000).toFixed(1);
    console.log(`[check-dist-fresh] ✅ dist/index.html is fresh (built ${ageMin} min ago).`);
    process.exit(0);
} else {
    console.error('[check-dist-fresh] ❌ dist/index.html is STALE. These source files are newer:');
    staleFiles.forEach(l => console.error(l));
    console.error('\nRun:  npm run build   then retry.');
    process.exit(1);
}
