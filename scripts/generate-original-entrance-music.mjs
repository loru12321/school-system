import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'assets', 'audio', 'entrance');
fs.mkdirSync(outDir, { recursive: true });

const tracks = [
  ['renran-waipoqiao', '任然 - 外婆桥', 'renran-waipoqiao-96k.mp3', 'approved entrance music source (web 96 kbps)']
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
  const isMedia = /\.(mp3|wav|ogg|m4a|mp4|mov|webm)$/i.test(entry.name);
  const isSelectedTrack = tracks.some((track) => track.src === entry.name);
  if (entry.isFile() && isMedia && !isSelectedTrack) {
    fs.unlinkSync(path.join(outDir, entry.name));
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  note: 'Bundled entrance audio/video is supported only when each track is explicitly marked authorizedForEmbedding. Downloaded third-party favorite-video music must not be listed here unless the user has rights to redistribute it inside this system.',
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
