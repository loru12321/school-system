import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../');
const distRoot = path.join(projectRoot, 'dist');
const distIndexPath = path.join(distRoot, 'index.html');

const prunablePaths = [];

function isReferenced(relativePath, html) {
    const normalized = String(relativePath || '').replace(/\\/g, '/');
    return String(html || '').includes(normalized);
}

function prunePath(relativePath, html) {
    const targetPath = path.join(distRoot, relativePath);
    if (!fs.existsSync(targetPath)) return false;
    if (isReferenced(relativePath, html)) {
        throw new Error(`Refusing to prune referenced dist asset path: ${relativePath}`);
    }
    fs.rmSync(targetPath, { recursive: true, force: true });
    console.log(`Pruned dist asset path: ${relativePath}`);
    return true;
}

function main() {
    if (!fs.existsSync(distRoot)) {
        throw new Error(`dist not found: ${distRoot}`);
    }
    const html = fs.existsSync(distIndexPath) ? fs.readFileSync(distIndexPath, 'utf8') : '';
    prunablePaths.forEach((relativePath) => prunePath(relativePath, html));
}

main();
