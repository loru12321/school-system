import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import sharp from 'sharp';

const root = process.cwd();
const at = (...parts) => path.join(root, ...parts);
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
async function mustRead(file, encoding) {
  try { return await readFile(file, encoding); }
  catch (error) { assert.fail(`required icon asset is missing: ${file} (${error.code})`); }
}

async function imageInfo(file, width, height = width, { opaque = false, readable = false } = {}) {
  const image = sharp(file);
  const metadata = await image.metadata();
  assert.equal(metadata.format, 'png', `${file} must be PNG`);
  assert.equal(metadata.width, width, `${file} width`);
  assert.equal(metadata.height, height, `${file} height`);
  if (opaque) {
    assert.equal(metadata.hasAlpha, false, `${file} must be flattened to prevent black corners`);
    const corners = await image.clone().removeAlpha().raw().toBuffer();
    const indexes = [0, (width - 1) * 3, (height - 1) * width * 3, (width * height - 1) * 3];
    for (const index of indexes) {
      const luminance = (corners[index] + corners[index + 1] + corners[index + 2]) / 3;
      assert.ok(luminance > 200, `${file} must not contain black corner pixels`);
    }
  }
  if (readable) {
    const { data, info } = await image.removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const colors = new Set();
    let darkOrSaturated = 0;
    for (let i = 0; i < data.length; i += info.channels) {
      const r = data[i]; const g = data[i + 1]; const b = data[i + 2];
      colors.add(`${r >> 4},${g >> 4},${b >> 4}`);
      if (Math.max(r, g, b) - Math.min(r, g, b) > 28 || (r + g + b) / 3 < 205) darkOrSaturated++;
    }
    assert.ok(colors.size >= 12, `${file} has insufficient tonal entropy (${colors.size})`);
    assert.ok(darkOrSaturated / (width * height) >= 0.015, `${file} has insufficient visible detail`);
  }
}

const source = await mustRead(at('docs', 'design-assets', 'app-icon-knowledge-bloom-reference.png'));
const copiedSource = await mustRead(at('public', 'assets', 'brand', 'app-icon-source.png'));
assert.equal(sha256(copiedSource), sha256(source), 'approved source must be copied byte-for-byte');

for (const size of [16, 24, 32, 48, 64, 128, 256, 512, 1024]) {
  await imageInfo(at('public', 'assets', 'brand', `app-icon-${size}.png`), size, size, {
    opaque: true,
    readable: [16, 24, 48].includes(size),
  });
}

const ico = await readFile(at('desktop', 'assets', 'icon.ico'));
assert.ok(ico.length > 1_000, 'desktop ICO must be nonempty');
assert.equal(ico.readUInt16LE(0), 0, 'ICO reserved header');
assert.equal(ico.readUInt16LE(2), 1, 'ICO image type');
const icoCount = ico.readUInt16LE(4);
const icoSizes = [];
for (let index = 0; index < icoCount; index++) {
  const directoryOffset = 6 + index * 16;
  assert.ok(directoryOffset + 16 <= ico.length, `ICO directory entry ${index} must be within the file`);
  const width = ico[directoryOffset] || 256;
  const height = ico[directoryOffset + 1] || 256;
  const dataLength = ico.readUInt32LE(directoryOffset + 8);
  const dataOffset = ico.readUInt32LE(directoryOffset + 12);
  assert.equal(height, width, `ICO entry ${index} must be square`);
  assert.ok(dataLength > 0, `ICO entry ${index} data must be nonempty`);
  assert.ok(dataOffset >= 6 + icoCount * 16, `ICO entry ${index} data must follow the directory`);
  assert.ok(dataOffset + dataLength <= ico.length, `ICO entry ${index} data must be within the file`);
  assert.ok(ico.subarray(dataOffset, dataOffset + dataLength).some((byte) => byte !== 0), `ICO entry ${index} must contain image data`);
  icoSizes.push(width);
}
assert.deepEqual(icoSizes, [16, 24, 32, 48, 64, 128, 256], 'ICO must contain the exact required sizes');

const android = [
  ['mdpi', 48, 108], ['hdpi', 72, 162], ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324], ['xxxhdpi', 192, 432],
];
for (const [density, legacySize, foregroundSize] of android) {
  await imageInfo(at('android', 'app', 'src', 'main', 'res', `mipmap-${density}`, 'ic_launcher.png'), legacySize, legacySize, { opaque: true });
  await imageInfo(at('android', 'app', 'src', 'main', 'res', `mipmap-${density}`, 'ic_launcher_round.png'), legacySize, legacySize, { opaque: true });
  const foreground = at('android', 'app', 'src', 'main', 'res', `mipmap-${density}`, 'ic_launcher_foreground.png');
  await imageInfo(foreground, foregroundSize, foregroundSize);
  const { data, info } = await sharp(foreground).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width; let minY = info.height; let maxX = -1; let maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      if (data[(y * info.width + x) * info.channels + 3] > 8) {
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      }
    }
  }
  assert.ok(maxX >= minX && maxY >= minY, `${density} adaptive foreground must contain artwork`);
  const widthFraction = (maxX - minX + 1) / foregroundSize;
  const heightFraction = (maxY - minY + 1) / foregroundSize;
  assert.ok(widthFraction >= 0.64 && widthFraction <= 0.68, `${density} artwork width must occupy the intended ~66% safe zone`);
  assert.ok(heightFraction >= 0.64 && heightFraction <= 0.68, `${density} artwork height must occupy the intended ~66% safe zone`);
  assert.ok(minX / foregroundSize >= 0.15 && minY / foregroundSize >= 0.15, `${density} foreground must retain transparent top/left margins`);
  assert.ok((foregroundSize - 1 - maxX) / foregroundSize >= 0.15 && (foregroundSize - 1 - maxY) / foregroundSize >= 0.15, `${density} foreground must retain transparent bottom/right margins`);
}
for (const file of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  const adaptiveXml = await readFile(at('android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26', file), 'utf8');
  assert.match(adaptiveXml, /<background android:drawable="@color\/ic_launcher_background"\s*\/>/, `${file} background resource`);
  assert.match(adaptiveXml, /<foreground android:drawable="@mipmap\/ic_launcher_foreground"\s*\/>/, `${file} foreground resource`);
}

const packageJson = JSON.parse(await readFile(at('package.json'), 'utf8'));
assert.equal(packageJson.scripts?.['assets:app-icons'], 'node scripts/generate-app-icon-assets.mjs');
assert.equal(packageJson.scripts?.['test:app-icon-assets'], 'node scripts/test-app-icon-assets.mjs');

const iosProject = at('ios', 'App', 'App.xcodeproj');
let iosPresent = true;
try { await stat(iosProject); } catch { iosPresent = false; }
const status = JSON.parse(await readFile(at('public', 'assets', 'brand', 'app-icon-platform-status.json'), 'utf8'));
if (iosPresent) {
  assert.equal(status.ios.state, 'generated');
  const appIconDir = at('ios', 'App', 'App', 'Assets.xcassets', 'AppIcon.appiconset');
  const contents = JSON.parse(await readFile(path.join(appIconDir, 'Contents.json'), 'utf8'));
  const universal = contents.images.find((image) => image.platform === 'ios' && image.size === '1024x1024');
  assert.ok(universal?.filename, 'iOS AppIcon must declare the universal 1024 slot');
  await imageInfo(path.join(appIconDir, universal.filename), 1024, 1024, { opaque: true });
} else {
  assert.equal(status.ios.state, 'ready-for-macos');
  assert.equal(status.ios.source, 'public/assets/brand/app-icon-1024.png');
}

console.log('App icon assets verified.');
