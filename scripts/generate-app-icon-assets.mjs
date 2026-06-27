import { copyFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const root = process.cwd();
const at = (...parts) => path.join(root, ...parts);
const outputRootArgument = process.argv.indexOf('--output-root');
if (outputRootArgument >= 0 && !process.argv[outputRootArgument + 1]) {
  throw new Error('--output-root requires a directory');
}
const outputRoot = outputRootArgument >= 0 ? path.resolve(process.argv[outputRootArgument + 1]) : root;
const outputAt = (...parts) => path.join(outputRoot, ...parts);
const source = at('docs', 'design-assets', 'app-icon-knowledge-bloom-reference.png');
const brandDir = outputAt('public', 'assets', 'brand');
const background = '#f8f5ee';

async function artworkWithoutDarkCornerMatte() {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0; let tail = 0;
  const isMatte = (pixel) => {
    const offset = pixel * channels;
    return Math.max(data[offset], data[offset + 1], data[offset + 2]) < 48;
  };
  const enqueue = (pixel) => {
    if (!visited[pixel] && isMatte(pixel)) { visited[pixel] = 1; queue[tail++] = pixel; }
  };
  for (let x = 0; x < width; x++) { enqueue(x); enqueue((height - 1) * width + x); }
  for (let y = 0; y < height; y++) { enqueue(y * width); enqueue(y * width + width - 1); }
  while (head < tail) {
    const pixel = queue[head++];
    const x = pixel % width; const y = Math.floor(pixel / width);
    if (x > 0) enqueue(pixel - 1);
    if (x + 1 < width) enqueue(pixel + 1);
    if (y > 0) enqueue(pixel - width);
    if (y + 1 < height) enqueue(pixel + width);
  }
  for (let pixel = 0; pixel < visited.length; pixel++) {
    if (visited[pixel]) data[pixel * channels + 3] = 0;
  }
  return sharp(data, { raw: info }).png({ compressionLevel: 9, adaptiveFiltering: false, palette: false }).toBuffer();
}

const artwork = await artworkWithoutDarkCornerMatte();

async function ensureDir(dir) { await mkdir(dir, { recursive: true }); }

async function flattenedPng(size, output) {
  await ensureDir(path.dirname(output));
  await sharp(artwork)
    .resize(size, size, { fit: 'contain', background })
    .flatten({ background })
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toFile(output);
}

await ensureDir(brandDir);
await copyFile(source, path.join(brandDir, 'app-icon-source.png'));

const webSizes = [16, 24, 32, 48, 64, 128, 192, 256, 512, 1024];
for (const size of webSizes) await flattenedPng(size, path.join(brandDir, `app-icon-${size}.png`));

const status = {
  schemaVersion: 1,
  source: 'public/assets/brand/app-icon-source.png',
  web: { state: 'generated', directory: 'public/assets/brand' }
};
await writeFile(path.join(brandDir, 'app-icon-platform-status.json'), `${JSON.stringify(status, null, 2)}\n`);

console.log('Knowledge Bloom app icon assets generated.');
