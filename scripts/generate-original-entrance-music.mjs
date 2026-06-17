import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'public', 'assets', 'audio', 'entrance');
fs.mkdirSync(outDir, { recursive: true });

const sampleRate = 22050;
const tracks = [
  {
    id: 'cinema-white',
    title: '映雪',
    file: 'cinema-white.wav',
    bpm: 92,
    scale: [261.63, 293.66, 329.63, 392.00, 440.00, 493.88],
    progression: [0, 2, 4, 5, 4, 2, 1, 0],
    pad: [261.63, 392.00, 523.25],
    tint: 'soft'
  },
  {
    id: 'sweet-royal-switch',
    title: '清晖',
    file: 'sweet-royal-switch.wav',
    bpm: 104,
    scale: [220.00, 261.63, 329.63, 392.00, 440.00, 523.25],
    progression: [2, 4, 5, 4, 2, 1, 2, 4],
    pad: [220.00, 329.63, 440.00],
    tint: 'pluck'
  },
  {
    id: 'sister-aura',
    title: '云岫',
    file: 'sister-aura.wav',
    bpm: 100,
    scale: [196.00, 246.94, 293.66, 392.00, 493.88, 587.33],
    progression: [0, 2, 4, 2, 5, 4, 2, 1],
    pad: [196.00, 293.66, 493.88],
    tint: 'bold'
  },
  {
    id: 'white-lace',
    title: '栀夏',
    file: 'white-lace.wav',
    bpm: 84,
    scale: [293.66, 329.63, 392.00, 440.00, 493.88, 587.33],
    progression: [0, 1, 2, 4, 5, 4, 2, 1],
    pad: [293.66, 440.00, 587.33],
    tint: 'bell'
  },
  {
    id: 'red-violet',
    title: '绯云',
    file: 'red-violet.wav',
    bpm: 108,
    scale: [174.61, 220.00, 261.63, 349.23, 440.00, 523.25],
    progression: [3, 4, 5, 4, 3, 2, 1, 0],
    pad: [174.61, 261.63, 440.00],
    tint: 'dance'
  },
  {
    id: 'midnight-silk',
    title: '月绡',
    file: 'midnight-silk.wav',
    bpm: 96,
    scale: [164.81, 196.00, 246.94, 329.63, 392.00, 493.88],
    progression: [4, 2, 0, 2, 5, 4, 2, 1],
    pad: [164.81, 246.94, 392.00],
    tint: 'silk'
  },
  {
    id: 'bluegreen-flow',
    title: '青漪',
    file: 'bluegreen-flow.wav',
    bpm: 88,
    scale: [246.94, 293.66, 369.99, 415.30, 493.88, 554.37],
    progression: [0, 2, 3, 4, 5, 4, 3, 1],
    pad: [246.94, 369.99, 493.88],
    tint: 'flow'
  },
  {
    id: 'beat-cut',
    title: '鹿鸣',
    file: 'beat-cut.wav',
    bpm: 118,
    scale: [220.00, 246.94, 293.66, 329.63, 392.00, 440.00],
    progression: [0, 3, 4, 3, 5, 4, 3, 1],
    pad: [220.00, 329.63, 440.00],
    tint: 'beat'
  },
  {
    id: 'jiangnan-lantern',
    title: '南枝',
    file: 'jiangnan-lantern.wav',
    bpm: 78,
    scale: [261.63, 293.66, 349.23, 392.00, 440.00, 523.25],
    progression: [0, 2, 3, 4, 2, 3, 1, 0],
    pad: [261.63, 392.00, 523.25],
    tint: 'guqin'
  },
  {
    id: 'clean-denim',
    title: '风荷',
    file: 'clean-denim.wav',
    bpm: 102,
    scale: [196.00, 246.94, 293.66, 329.63, 392.00, 493.88],
    progression: [1, 2, 4, 5, 4, 2, 3, 1],
    pad: [196.00, 293.66, 392.00],
    tint: 'denim'
  }
];

function envelope(t, start, duration, attack = 0.018, release = 0.12) {
  const local = t - start;
  if (local < 0 || local > duration) return 0;
  if (local < attack) return local / attack;
  if (local > duration - release) return Math.max(0, (duration - local) / release);
  return 1;
}

function osc(freq, t, type) {
  const phase = 2 * Math.PI * freq * t;
  if (type === 'tri') return 2 * Math.asin(Math.sin(phase)) / Math.PI;
  if (type === 'saw') return 2 * ((freq * t) - Math.floor(0.5 + freq * t));
  if (type === 'square') return Math.sin(phase) >= 0 ? 1 : -1;
  return Math.sin(phase);
}

function noise(seed) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function softClip(x) {
  return Math.tanh(x * 1.25);
}

function renderTrack(track) {
  const beat = 60 / track.bpm;
  const duration = Math.max(8, beat * 16);
  const total = Math.floor(duration * sampleRate);
  const samples = new Float32Array(total);

  for (let i = 0; i < total; i += 1) {
    const t = i / sampleRate;
    const beatIndex = Math.floor(t / beat);
    const beatStart = beatIndex * beat;
    const step = beatIndex % track.progression.length;
    const note = track.scale[track.progression[step] % track.scale.length];
    const next = track.scale[track.progression[(step + 2) % track.progression.length] % track.scale.length];
    let value = 0;

    const padEnv = 0.18 + 0.08 * Math.sin(2 * Math.PI * t / duration);
    track.pad.forEach((freq, idx) => {
      value += osc(freq / 2, t, idx % 2 ? 'tri' : 'sine') * 0.035 * padEnv;
    });

    const leadEnv = envelope(t, beatStart, beat * 0.84, 0.012, beat * 0.42);
    const leadType = ['beat', 'dance', 'pluck'].includes(track.tint) ? 'tri' : 'sine';
    value += osc(note, t, leadType) * 0.13 * leadEnv;
    value += osc(next * 2, t, 'sine') * 0.035 * envelope(t, beatStart + beat * 0.36, beat * 0.36, 0.01, beat * 0.2);

    if (['beat', 'dance', 'bold', 'denim'].includes(track.tint)) {
      value += osc(55, t, 'sine') * 0.20 * envelope(t, beatStart, 0.11, 0.004, 0.08);
      if (beatIndex % 2 === 1) value += noise(i + beatIndex) * 0.04 * envelope(t, beatStart + beat * 0.48, 0.06, 0.002, 0.05);
    }

    if (['bell', 'guqin', 'flow', 'soft'].includes(track.tint)) {
      const shimmerStart = beatStart + beat * 0.5;
      value += osc(note * 3, t, 'sine') * 0.038 * envelope(t, shimmerStart, beat * 0.5, 0.01, beat * 0.42);
    }

    if (track.tint === 'guqin') {
      value += osc(note * 0.5, t, 'saw') * 0.028 * envelope(t, beatStart, beat * 0.9, 0.008, beat * 0.7);
    }

    samples[i] = softClip(value);
  }
  return samples;
}

function writeWav(filePath, samples) {
  const bytesPerSample = 2;
  const blockAlign = bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  fs.writeFileSync(filePath, buffer);
}

for (const track of tracks) {
  writeWav(path.join(outDir, track.file), renderTrack(track));
}

fs.writeFileSync(
  path.join(outDir, 'manifest.json'),
  JSON.stringify({
    generatedAt: new Date().toISOString(),
    note: 'Original synthesized entrance music inspired by observed visual rhythm; no source audio was copied.',
    tracks: tracks.map(({ id, title, file, bpm, tint }) => ({ id, title, file, bpm, tint }))
  }, null, 2)
);

console.log(JSON.stringify({ ok: true, outDir, count: tracks.length }, null, 2));
