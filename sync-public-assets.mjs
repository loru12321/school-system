import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourceDir = path.join(__dirname, 'public', 'assets', 'js');
const targetDir = path.join(__dirname, 'dist', 'assets', 'js');
const rootPublicFiles = ['favicon.ico'];

if (!fs.existsSync(sourceDir)) {
  console.error(`Source JS directory not found: ${sourceDir}`);
  process.exit(1);
}

fs.mkdirSync(targetDir, { recursive: true });

for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
  const sourcePath = path.join(sourceDir, entry.name);
  const targetPath = path.join(targetDir, entry.name);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Synced asset: ${sourcePath} -> ${targetPath}`);
}

for (const fileName of rootPublicFiles) {
  const sourcePath = path.join(__dirname, 'public', fileName);
  if (!fs.existsSync(sourcePath)) continue;
  const targetPath = path.join(__dirname, 'dist', fileName);
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`Synced root asset: ${sourcePath} -> ${targetPath}`);
}
