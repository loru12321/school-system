import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const distReleasesPath = path.join(projectRoot, 'dist', 'releases');
const backupPath = path.join(projectRoot, '.tmp-build-dist-releases');
const command = String(process.argv[2] || '').trim();

function save() {
    fs.rmSync(backupPath, { recursive: true, force: true });
    if (!fs.existsSync(distReleasesPath)) return;
    fs.cpSync(distReleasesPath, backupPath, { recursive: true });
    console.log('Preserved dist release assets before Vite build');
}

function restore() {
    if (!fs.existsSync(backupPath)) return;
    fs.mkdirSync(path.dirname(distReleasesPath), { recursive: true });
    fs.rmSync(distReleasesPath, { recursive: true, force: true });
    fs.cpSync(backupPath, distReleasesPath, { recursive: true });
    fs.rmSync(backupPath, { recursive: true, force: true });
    console.log('Restored dist release assets after Vite build');
}

if (command === 'save') {
    save();
} else if (command === 'restore') {
    restore();
} else {
    throw new Error('Usage: node scripts/build/preserve-dist-release-assets.mjs <save|restore>');
}
