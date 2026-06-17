import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'assets', 'audio', 'entrance');
fs.mkdirSync(outDir, { recursive: true });

for (const entry of fs.readdirSync(outDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.toLowerCase().endsWith('.wav')) {
    fs.unlinkSync(path.join(outDir, entry.name));
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  note: 'Built-in entrance music has been removed. The system only plays user-imported audio that the user confirms is authorized for use.',
  tracks: []
};

fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, outDir, count: 0, mode: 'authorized-import-only' }, null, 2));
