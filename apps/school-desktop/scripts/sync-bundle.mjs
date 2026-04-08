import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..', '..');
const appRoot = path.resolve(__dirname, '..');
const bundleDir = path.join(appRoot, 'bundle');

async function copyFileOrThrow(sourcePath, targetPath) {
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.copyFile(sourcePath, targetPath);
}

async function main() {
    const entryFile = path.join(repoRoot, 'lt.html');
    const iconFile = path.join(repoRoot, 'public', 'favicon.ico');

    await fs.access(entryFile);
    await fs.access(iconFile);
    await fs.mkdir(bundleDir, { recursive: true });

    await copyFileOrThrow(entryFile, path.join(bundleDir, 'lt.html'));
    await copyFileOrThrow(iconFile, path.join(bundleDir, 'favicon.ico'));

    const meta = {
        source: 'school-system',
        copiedAt: new Date().toISOString(),
        entryFile: 'lt.html',
        iconFile: 'favicon.ico'
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
