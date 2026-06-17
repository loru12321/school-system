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
  note: 'Bundled entrance audio/video is supported only when each track is explicitly marked authorizedForEmbedding. Downloaded Douyin favorite-video music must not be listed here unless the user has rights to redistribute it inside this system.',
  trackSchema: {
    id: 'stable-track-id',
    name: 'display name',
    src: 'file name under public/assets/audio/entrance or a same-origin URL',
    type: 'audio/mpeg, audio/mp4, video/mp4, video/webm, etc.',
    authorizedForEmbedding: true,
    license: 'rights note or source permission'
  },
  tracks: []
};

fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, outDir, count: 0, mode: 'authorized-bundled-or-imported' }, null, 2));
