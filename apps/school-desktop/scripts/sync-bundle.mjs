import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const appRoot = path.resolve(__dirname, '..');
const bundleDir = path.join(appRoot, 'bundle');

const externalVendorDirs = [
    'alasql',
    'chart.js',
    'crypto-js',
    'html2canvas',
    'jspdf',
    'tabler-icons',
    'web-llm'
];

async function ensureReadable(targetPath) {
    await fs.access(targetPath);
    return targetPath;
}

async function copyFileOrThrow(sourcePath, targetPath) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
}

async function copyDirectoryOrThrow(sourcePath, targetPath) {
    await fs.rm(targetPath, { recursive: true, force: true });
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.cp(sourcePath, targetPath, { recursive: true, force: true });
}

async function main() {
    const entryFile = await ensureReadable(path.join(repoRoot, 'lt.html'));
    const iconFile = await ensureReadable(path.join(repoRoot, 'public', 'favicon.ico'));
    const distAssetsDir = await ensureReadable(path.join(repoRoot, 'dist', 'assets'));
    const vendorRoot = path.join(repoRoot, 'public', 'assets', 'vendor');

    await fs.mkdir(bundleDir, { recursive: true });

    await copyFileOrThrow(entryFile, path.join(bundleDir, 'lt.html'));
    await copyFileOrThrow(iconFile, path.join(bundleDir, 'favicon.ico'));
    await copyDirectoryOrThrow(distAssetsDir, path.join(bundleDir, 'dist', 'assets'));

    const copiedVendorDirs = [];
    for (const vendorDirName of externalVendorDirs) {
        const sourceDir = await ensureReadable(path.join(vendorRoot, vendorDirName));
        const targetDir = path.join(bundleDir, 'public', 'assets', 'vendor', vendorDirName);
        await copyDirectoryOrThrow(sourceDir, targetDir);
        copiedVendorDirs.push(path.posix.join('public/assets/vendor', vendorDirName));
    }

    const meta = {
        source: 'school-system',
        copiedAt: new Date().toISOString(),
        entryFile: 'lt.html',
        iconFile: 'favicon.ico',
        copiedDirectories: [
            'dist/assets',
            ...copiedVendorDirs
        ]
    };

    await fs.writeFile(
        path.join(bundleDir, 'bundle-meta.json'),
        JSON.stringify(meta, null, 2),
        'utf8'
    );

    console.log(`Desktop bundle synced from ${repoRoot}`);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
