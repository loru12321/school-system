import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepareWorkerReleaseChunks } from './prepare-worker-release-chunks.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-release-chunks-'));
const input = path.join(root, 'input');
const output = path.join(root, 'dist', 'releases');

try {
  fs.mkdirSync(input, { recursive: true });
  const windows = Buffer.alloc(43, 0x57);
  const android = Buffer.alloc(29, 0x41);
  fs.writeFileSync(path.join(input, 'app.exe'), windows);
  fs.writeFileSync(path.join(input, 'app.apk'), android);

  const result = prepareWorkerReleaseChunks({
    inputDir: input,
    outputDir: output,
    releaseTag: 'beta-20260621-9a362b3',
    sourceSha: '9a362b38124ca5a210b4679e95c297ae7afa8f35',
    origin: 'https://schoolsystem.com.cn',
    chunkBytes: 16
  });

  for (const platform of ['windows', 'android']) {
    const entry = result.downloads.find((item) => item.platform === platform);
    assert.ok(entry, `${platform} entry should exist`);
    const rebuilt = Buffer.concat(entry.chunks.map((relative) => fs.readFileSync(path.join(output, relative))));
    const original = platform === 'windows' ? windows : android;
    assert.deepEqual(rebuilt, original);
    assert.equal(entry.bytes, original.length);
    assert.equal(entry.sha256, crypto.createHash('sha256').update(original).digest('hex'));
    assert.ok(entry.chunks.every((relative) => fs.statSync(path.join(output, relative)).size <= 16));
    assert.deepEqual(entry.chunkBytes, entry.chunks.map((relative) => fs.statSync(path.join(output, relative)).size));
    assert.equal(entry.chunkBytes.reduce((sum, bytes) => sum + bytes, 0), entry.bytes);
  }

  const catalog = JSON.parse(fs.readFileSync(path.join(output, 'release-manifest.json'), 'utf8'));
  assert.equal(catalog.releases[0].platforms.windows.status, 'ready');
  assert.equal(catalog.releases[0].platforms.android.status, 'ready');
  assert.equal(catalog.releases[0].platforms.ios.status, 'awaiting-signing');
  assert.match(catalog.releases[0].platforms.windows.assetUrl, /^https:\/\/schoolsystem\.com\.cn\/downloads\//);

  assert.throws(() => prepareWorkerReleaseChunks({
    inputDir: input,
    outputDir: path.join(path.parse(root).root, 'worker-release-escape'),
    releaseTag: 'beta-20260621-9a362b3',
    sourceSha: '9a362b38124ca5a210b4679e95c297ae7afa8f35',
    origin: 'https://schoolsystem.com.cn'
  }), /output directory/i);

  console.log(JSON.stringify({ ok: true, downloads: result.downloads.length }, null, 2));
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
