import { copyFile, mkdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import pngToIco from 'png-to-ico';
import sharp from 'sharp';

const root = process.cwd();
const at = (...parts) => path.join(root, ...parts);
const source = at('docs', 'design-assets', 'app-icon-knowledge-bloom-reference.png');
const brandDir = at('public', 'assets', 'brand');
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

async function adaptiveForeground(size, output) {
  const artworkSize = Math.round(size * 0.66);
  const resizedArtwork = await sharp(artwork)
    .resize(artworkSize, artworkSize, { fit: 'contain' })
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toBuffer();
  await ensureDir(path.dirname(output));
  await sharp({ create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: resizedArtwork, gravity: 'center' }])
    .png({ compressionLevel: 9, adaptiveFiltering: false, palette: false })
    .toFile(output);
}

await ensureDir(brandDir);
await copyFile(source, path.join(brandDir, 'app-icon-source.png'));

const webSizes = [16, 24, 32, 48, 64, 128, 256, 512, 1024];
for (const size of webSizes) await flattenedPng(size, path.join(brandDir, `app-icon-${size}.png`));

const icoInputs = [16, 24, 32, 48, 64, 128, 256].map((size) => path.join(brandDir, `app-icon-${size}.png`));
const ico = await pngToIco(icoInputs);
const desktopDir = at('desktop', 'assets');
await ensureDir(desktopDir);
await writeFile(path.join(desktopDir, 'icon.ico'), ico);

const androidRoot = at('android', 'app', 'src', 'main', 'res');
const densities = [
  ['mdpi', 48, 108], ['hdpi', 72, 162], ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324], ['xxxhdpi', 192, 432],
];
for (const [density, legacySize, foregroundSize] of densities) {
  const dir = path.join(androidRoot, `mipmap-${density}`);
  await flattenedPng(legacySize, path.join(dir, 'ic_launcher.png'));
  await flattenedPng(legacySize, path.join(dir, 'ic_launcher_round.png'));
  await adaptiveForeground(foregroundSize, path.join(dir, 'ic_launcher_foreground.png'));
}

const adaptiveDir = path.join(androidRoot, 'mipmap-anydpi-v26');
await ensureDir(adaptiveDir);
const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">\n    <background android:drawable="@color/ic_launcher_background" />\n    <foreground android:drawable="@mipmap/ic_launcher_foreground" />\n</adaptive-icon>\n`;
await writeFile(path.join(adaptiveDir, 'ic_launcher.xml'), adaptiveXml);
await writeFile(path.join(adaptiveDir, 'ic_launcher_round.xml'), adaptiveXml);
const colorsDir = path.join(androidRoot, 'values');
await ensureDir(colorsDir);
await writeFile(path.join(colorsDir, 'ic_launcher_colors.xml'), `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${background}</color>\n</resources>\n`);

const iosProject = at('ios', 'App', 'App.xcodeproj');
let iosPresent = true;
try { await stat(iosProject); } catch { iosPresent = false; }
const status = {
  schemaVersion: 1,
  source: 'public/assets/brand/app-icon-source.png',
  ios: iosPresent
    ? { state: 'generated', assetSet: 'ios/App/App/Assets.xcassets/AppIcon.appiconset' }
    : { state: 'ready-for-macos', source: 'public/assets/brand/app-icon-1024.png' },
};
if (iosPresent) {
  const appIconDir = at('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  await ensureDir(appIconDir);
  await flattenedPng(1024, path.join(appIconDir, 'AppIcon-512@2x.png'));
  const contents = {
    images: [{ filename: 'AppIcon-512@2x.png', idiom: 'universal', platform: 'ios', size: '1024x1024' }],
    info: { author: 'xcode', version: 1 },
  };
  await writeFile(path.join(appIconDir, 'Contents.json'), `${JSON.stringify(contents, null, 2)}\n`);
}
await writeFile(path.join(brandDir, 'app-icon-platform-status.json'), `${JSON.stringify(status, null, 2)}\n`);

console.log('Knowledge Bloom app icon assets generated.');
