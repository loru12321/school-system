import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'assets', 'audio', 'entrance');
fs.mkdirSync(outDir, { recursive: true });

const tracks = [
  ['daylight-breeze', '晴光流动', 'daylight-breeze-7635891699847597818.mp3', '7635891699847597818'],
  ['summer-flow', '夏日微风', 'summer-flow-7651197220167522670.mp3', '7651197220167522670'],
  ['quiet-time', '时光留白', 'quiet-time-7564305455088078138.mp3', '7564305455088078138'],
  ['calm-campus', '岁月从容', 'calm-campus-7640353084556289522.mp3', '7640353084556289522']
].map(([id, name, src, sourceRef]) => ({
  id,
  name,
  src,
  type: 'audio/mpeg',
  authorizedForEmbedding: true,
  license: 'User-selected project audio; embedding explicitly authorized by the project owner on 2026-06-18.',
  sourceRef
}));

for (const track of tracks) {
  if (!fs.existsSync(path.join(outDir, track.src))) {
    throw new Error(`Missing authorized entrance audio: ${track.src}`);
  }
}

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
  tracks
};

fs.writeFileSync(path.join(outDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({ ok: true, outDir, count: tracks.length, mode: 'authorized-bundled-or-imported' }, null, 2));
