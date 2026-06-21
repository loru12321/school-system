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
assert.ok(ico.readUInt16LE(4) >= 5, 'ICO must contain multiple image sizes');

const android = [
  ['mdpi', 48, 108], ['hdpi', 72, 162], ['xhdpi', 96, 216],
  ['xxhdpi', 144, 324], ['xxxhdpi', 192, 432],
];
for (const [density, legacySize, foregroundSize] of android) {
  await imageInfo(at('android', 'app', 'src', 'main', 'res', `mipmap-${density}`, 'ic_launcher.png'), legacySize, legacySize, { opaque: true });
  await imageInfo(at('android', 'app', 'src', 'main', 'res', `mipmap-${density}`, 'ic_launcher_round.png'), legacySize, legacySize, { opaque: true });
  await imageInfo(at('android', 'app', 'src', 'main', 'res', `mipmap-${density}`, 'ic_launcher_foreground.png'), foregroundSize, foregroundSize);
}
const adaptiveXml = await readFile(at('android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26', 'ic_launcher.xml'), 'utf8');
assert.match(adaptiveXml, /@color\/ic_launcher_background/);
assert.match(adaptiveXml, /@mipmap\/ic_launcher_foreground/);
await stat(at('android', 'app', 'src', 'main', 'res', 'mipmap-anydpi-v26', 'ic_launcher_round.xml'));

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
