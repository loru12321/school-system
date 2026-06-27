import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';
import sharp from 'sharp';

const root = process.cwd();
const at = (...parts) => path.join(root, ...parts);
const sha256 = (buffer) => createHash('sha256').update(buffer).digest('hex');
const execFileAsync = promisify(execFile);
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

for (const size of [16, 24, 32, 48, 64, 128, 192, 256, 512, 1024]) {
  await imageInfo(at('public', 'assets', 'brand', `app-icon-${size}.png`), size, size, {
    opaque: true,
    readable: [16, 24, 48].includes(size),
  });
}

const packageJson = JSON.parse(await readFile(at('package.json'), 'utf8'));
assert.equal(packageJson.scripts?.['assets:app-icons'], 'node scripts/generate-app-icon-assets.mjs');
assert.equal(packageJson.scripts?.['test:app-icon-assets'], 'node scripts/test-app-icon-assets.mjs');
assert.match(packageJson.scripts?.['check:release-fast'] || '', /(?:^|&&\s*)npm run test:app-icon-assets(?:\s*&&|$)/, 'fast release checks must verify committed app icon assets');

const status = JSON.parse(await readFile(at('public', 'assets', 'brand', 'app-icon-platform-status.json'), 'utf8'));
assert.equal(status.web.state, 'generated');
assert.equal(status.web.directory, 'public/assets/brand');
assert.equal(status.windows, undefined);
assert.equal(status.android, undefined);
assert.equal(status.ios, undefined);

const generatedFiles = [
  'public/assets/brand/app-icon-source.png',
  ...[16, 24, 32, 48, 64, 128, 192, 256, 512, 1024].map((size) => `public/assets/brand/app-icon-${size}.png`),
  'public/assets/brand/app-icon-platform-status.json'
];
const temporaryRoot = await mkdtemp(path.join(os.tmpdir(), 'school-system-app-icons-'));
try {
  await execFileAsync(process.execPath, [at('scripts', 'generate-app-icon-assets.mjs'), '--output-root', temporaryRoot], { cwd: root });
  for (const relativeFile of generatedFiles) {
    const committed = await mustRead(at(relativeFile));
    const regenerated = await mustRead(path.join(temporaryRoot, relativeFile));
    assert.equal(sha256(committed), sha256(regenerated), `${relativeFile} must match deterministic generated output`);
  }
} finally {
  await rm(temporaryRoot, { recursive: true, force: true });
}

console.log('App icon assets verified.');
