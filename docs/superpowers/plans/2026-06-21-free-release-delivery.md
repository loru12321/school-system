# Free Release Delivery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver the current Windows and Android Beta packages through the existing Cloudflare Workers free plan without R2 or publicly accessible GitHub Releases.

**Architecture:** A deterministic build script splits each package into immutable chunks below Cloudflare's per-asset limit and writes a strict download map. The Worker validates `/downloads/<filename>` against that map, then streams the ordered static chunks as one response; the public release catalog points at these first-party URLs while iOS remains `awaiting-signing`.

**Tech Stack:** Node.js 24, Cloudflare Workers static assets, Web Streams API, Vite, Wrangler 4, Node `assert` contract tests.

---

## File map

- Create `scripts/prepare-worker-release-chunks.mjs`: trusted-input validation, deterministic chunking, hashes, download map and release catalog generation.
- Create `scripts/test-worker-release-chunks.mjs`: executable behavior tests for chunking and safety rules.
- Create `src/worker-release-downloads.js`: isolated download-map parsing and streamed response construction.
- Create `scripts/test-worker-release-downloads.mjs`: unit tests with an in-memory static-assets binding.
- Modify `src/worker-dummy.js`: route `/downloads/*` before the normal static asset fallback.
- Modify `scripts/test-cloudflare-worker-contract.js`: require the new route and fail-closed behavior.
- Modify `package.json`: expose focused test and preparation commands and include them in `check:release-fast`.
- Modify `public/releases/release-manifest.json`: publish the current Beta metadata with first-party download URLs.
- Modify `README.md`: document the free fallback, local package retention, and GitHub recovery path.

### Task 1: Deterministic package chunk preparation

**Files:**
- Create: `scripts/test-worker-release-chunks.mjs`
- Create: `scripts/prepare-worker-release-chunks.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the failing chunk-preparation test**

Create fixtures in a temporary directory, invoke the exported `prepareWorkerReleaseChunks`, and assert reconstruction and rejection behavior:

```js
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { prepareWorkerReleaseChunks } from './prepare-worker-release-chunks.mjs';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-release-chunks-'));
const input = path.join(root, 'input');
const output = path.join(root, 'dist', 'releases');
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
  const rebuilt = Buffer.concat(entry.chunks.map((relative) => fs.readFileSync(path.join(output, relative))));
  const original = platform === 'windows' ? windows : android;
  assert.deepEqual(rebuilt, original);
  assert.equal(entry.bytes, original.length);
  assert.equal(entry.sha256, crypto.createHash('sha256').update(original).digest('hex'));
  assert.ok(entry.chunks.every((relative) => fs.statSync(path.join(output, relative)).size <= 16));
}

assert.throws(() => prepareWorkerReleaseChunks({
  inputDir: input,
  outputDir: path.join(root, '..', 'escape'),
  releaseTag: 'beta-20260621-9a362b3',
  sourceSha: '9a362b38124ca5a210b4679e95c297ae7afa8f35',
  origin: 'https://schoolsystem.com.cn'
}), /output directory/i);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node scripts/test-worker-release-chunks.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `prepare-worker-release-chunks.mjs`.

- [ ] **Step 3: Implement the minimal chunk preparer**

Export this public interface and keep path checks private:

```js
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function isWithin(parent, target) {
  const relative = path.relative(parent, target);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function assertTrustedDirectory(target, label) {
  const resolved = path.resolve(target);
  const repository = path.resolve(import.meta.dirname, '..');
  const temporary = path.resolve(os.tmpdir());
  if (!isWithin(repository, resolved) && !isWithin(temporary, resolved)) throw new Error(`${label} directory is outside approved roots`);
  let current = path.parse(resolved).root;
  for (const part of resolved.slice(current.length).split(path.sep).filter(Boolean)) {
    current = path.join(current, part);
    if (!fs.existsSync(current)) break;
    if (fs.lstatSync(current).isSymbolicLink()) throw new Error(`${label} directory contains a symbolic link`);
  }
  return resolved;
}

export function prepareWorkerReleaseChunks({
  inputDir,
  outputDir,
  releaseTag,
  sourceSha,
  origin,
  chunkBytes = 20 * 1024 * 1024
}) {
  const inputs = [
    { platform: 'windows', extension: '.exe', contentType: 'application/vnd.microsoft.portable-executable' },
    { platform: 'android', extension: '.apk', contentType: 'application/vnd.android.package-archive' }
  ];
  const trustedInput = assertTrustedDirectory(inputDir, 'input');
  const trustedOutput = assertTrustedDirectory(outputDir, 'output');
  if (!/^beta-\d{8}-[0-9a-f]{7,40}$/.test(releaseTag)) throw new Error('invalid beta release tag');
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error('invalid source SHA');
  const base = new URL(origin);
  if (base.protocol !== 'https:' || base.username || base.password) throw new Error('origin must be HTTPS');
  if (!Number.isSafeInteger(chunkBytes) || chunkBytes < 1 || chunkBytes > 20 * 1024 * 1024) throw new Error('invalid chunk size');
  const names = fs.readdirSync(trustedInput, { withFileTypes: true }).filter((entry) => entry.isFile()).map((entry) => entry.name);
  fs.mkdirSync(trustedOutput, { recursive: true });
  const downloads = [];
  for (const spec of inputs) {
    const matches = names.filter((name) => path.extname(name).toLowerCase() === spec.extension);
    if (matches.length !== 1) throw new Error(`exactly one ${spec.extension} input is required`);
    const source = fs.readFileSync(path.join(trustedInput, matches[0]));
    if (!source.length) throw new Error(`${spec.platform} input is empty`);
    const filename = `school-system-${spec.platform}-${releaseTag}${spec.extension}`;
    const relativeRoot = path.posix.join('packages', releaseTag, spec.platform);
    const absoluteRoot = path.join(trustedOutput, ...relativeRoot.split('/'));
    fs.mkdirSync(absoluteRoot, { recursive: true });
    const chunks = [];
    for (let offset = 0, index = 1; offset < source.length; offset += chunkBytes, index += 1) {
      const partName = `part-${String(index).padStart(4, '0')}`;
      fs.writeFileSync(path.join(absoluteRoot, partName), source.subarray(offset, offset + chunkBytes));
      chunks.push(path.posix.join(relativeRoot, partName));
    }
    downloads.push({
      platform: spec.platform,
      filename,
      contentType: spec.contentType,
      bytes: source.length,
      sha256: crypto.createHash('sha256').update(source).digest('hex'),
      chunks
    });
  }
  const downloadMap = { schemaVersion: 1, releaseTag, sourceSha, downloads };
  const generatedAt = new Date().toISOString();
  const platforms = Object.fromEntries(downloads.map((entry) => [entry.platform, {
    platform: entry.platform,
    version: releaseTag.replace(/^beta-/, ''),
    buildNumber: sourceSha.slice(0, 12),
    status: 'ready',
    signed: entry.platform === 'android' ? 'test-signed' : 'unsigned',
    assetName: entry.filename,
    assetUrl: new URL(`/downloads/${entry.filename}`, base).href,
    bytes: entry.bytes,
    sha256: entry.sha256
  }]));
  platforms.ios = {
    platform: 'ios',
    version: releaseTag.replace(/^beta-/, ''),
    buildNumber: sourceSha.slice(0, 12),
    status: 'awaiting-signing',
    signed: false,
    assetName: '',
    assetUrl: '',
    bytes: 0,
    sha256: ''
  };
  const releaseCatalog = { schemaVersion: 1, releases: [{
    schemaVersion: 1,
    releaseTag,
    channel: 'beta',
    sourceSha,
    generatedAt,
    expiresAt: new Date(Date.parse(generatedAt) + 90 * 86400000).toISOString(),
    releaseUrl: '',
    platforms
  }] };
  fs.writeFileSync(path.join(trustedOutput, 'download-map.json'), `${JSON.stringify(downloadMap, null, 2)}\n`);
  fs.writeFileSync(path.join(trustedOutput, 'release-manifest.json'), `${JSON.stringify(releaseCatalog, null, 2)}\n`);
  return { downloads, releaseCatalog };
}
```

Write `download-map.json` with schema version `1`, exact filenames, byte counts, hashes, content types and ordered relative chunk paths. Write `release-manifest.json` with Windows/Android `ready` and iOS `awaiting-signing`.

- [ ] **Step 4: Verify GREEN and register commands**

Run: `node scripts/test-worker-release-chunks.mjs`

Expected: JSON output containing `"ok": true`.

Add to `package.json`:

```json
"test:worker-release-chunks": "node scripts/test-worker-release-chunks.mjs",
"release:prepare-worker-assets": "node scripts/prepare-worker-release-chunks.mjs"
```

- [ ] **Step 5: Commit Task 1**

```bash
git add package.json scripts/test-worker-release-chunks.mjs scripts/prepare-worker-release-chunks.mjs
git commit -m "feat: prepare free worker release chunks"
```

### Task 2: Fail-closed streamed Worker downloads

**Files:**
- Create: `scripts/test-worker-release-downloads.mjs`
- Create: `src/worker-release-downloads.js`
- Modify: `src/worker-dummy.js`
- Modify: `scripts/test-cloudflare-worker-contract.js`

- [ ] **Step 1: Write the failing Worker download test**

Use an in-memory binding and verify GET, HEAD and unknown filenames:

```js
import assert from 'node:assert/strict';
import { handleReleaseDownload } from '../src/worker-release-downloads.js';

const map = { schemaVersion: 1, downloads: [{
  filename: 'school-system-windows-beta.exe',
  contentType: 'application/vnd.microsoft.portable-executable',
  bytes: 6,
  sha256: 'abc123',
  chunks: ['packages/beta/windows/part-0001', 'packages/beta/windows/part-0002']
}] };
const objects = new Map([
  ['/releases/download-map.json', JSON.stringify(map)],
  ['/releases/packages/beta/windows/part-0001', 'abc'],
  ['/releases/packages/beta/windows/part-0002', 'def']
]);
const env = { ASSETS: { fetch: async (request) => {
  const value = objects.get(new URL(request.url).pathname);
  return value === undefined ? new Response('missing', { status: 404 }) : new Response(value);
} } };

const get = await handleReleaseDownload(new Request('https://schoolsystem.com.cn/downloads/school-system-windows-beta.exe'), env);
assert.equal(get.status, 200);
assert.equal(await get.text(), 'abcdef');
assert.equal(get.headers.get('Content-Length'), '6');
assert.match(get.headers.get('Content-Disposition'), /attachment/);

const head = await handleReleaseDownload(new Request('https://schoolsystem.com.cn/downloads/school-system-windows-beta.exe', { method: 'HEAD' }), env);
assert.equal(head.status, 200);
assert.equal(await head.text(), '');

const missing = await handleReleaseDownload(new Request('https://schoolsystem.com.cn/downloads/unknown.exe'), env);
assert.equal(missing.status, 404);
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node scripts/test-worker-release-downloads.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `worker-release-downloads.js`.

- [ ] **Step 3: Implement the minimal streamed handler**

Implement and export:

```js
export async function handleReleaseDownload(request, env) {
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method Not Allowed', { status: 405 });
  const filename = decodeURIComponent(new URL(request.url).pathname.slice('/downloads/'.length));
  if (!filename || filename.includes('/') || filename.includes('\\')) return new Response('Not Found', { status: 404 });
  const mapResponse = await env.ASSETS.fetch(new Request(new URL('/releases/download-map.json', request.url)));
  if (!mapResponse.ok) return new Response('Release map unavailable', { status: 503 });
  const map = await mapResponse.json();
  const entry = Array.isArray(map.downloads) ? map.downloads.find((item) => item.filename === filename) : null;
  if (!entry) return new Response('Not Found', { status: 404 });
  const validEntry = Number.isSafeInteger(entry.bytes) && entry.bytes > 0
    && /^[0-9a-f]{64}$/.test(entry.sha256)
    && Array.isArray(entry.chunks) && entry.chunks.length > 0
    && entry.chunks.every((chunk) => /^packages\/[A-Za-z0-9._-]+\/(windows|android)\/part-\d{4}$/.test(chunk));
  if (!validEntry) return new Response('Invalid release map', { status: 503 });
  const chunkUrls = entry.chunks.map((chunk) => new URL(`/releases/${chunk}`, request.url));
  const probes = await Promise.all(chunkUrls.map((url) => env.ASSETS.fetch(new Request(url, { method: 'HEAD' }))));
  if (probes.some((response) => !response.ok)) return new Response('Release asset unavailable', { status: 503 });
  const headers = new Headers({
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Content-Length': String(entry.bytes),
    'Content-Type': entry.contentType,
    'ETag': `"sha256-${entry.sha256}"`,
    'X-Content-Type-Options': 'nosniff'
  });
  if (request.method === 'HEAD') return new Response(null, { status: 200, headers });
  const body = new ReadableStream({
    async start(controller) {
      try {
        for (const url of chunkUrls) {
          const response = await env.ASSETS.fetch(new Request(url));
          if (!response.ok || !response.body) throw new Error('release chunk unavailable');
          const reader = response.body.getReader();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });
  return new Response(body, { status: 200, headers });
}
```

Route it in `src/worker-dummy.js` before `env.ASSETS.fetch(request)`:

```js
if (url.pathname.startsWith('/downloads/')) {
  return await handleReleaseDownload(request, env);
}
```

- [ ] **Step 4: Verify GREEN and contract coverage**

Run:

```bash
node scripts/test-worker-release-downloads.mjs
npm run test:cloudflare-worker-contract
```

Expected: both commands PASS; the contract reports `/downloads/*` in `workerRoutes`.

- [ ] **Step 5: Commit Task 2**

```bash
git add src/worker-release-downloads.js src/worker-dummy.js scripts/test-worker-release-downloads.mjs scripts/test-cloudflare-worker-contract.js
git commit -m "feat: stream release packages from worker assets"
```

### Task 3: Publish the current Beta catalog and deployment assets

**Files:**
- Modify: `public/releases/release-manifest.json`
- Modify: `package.json`
- Modify: `README.md`
- Generated only: `dist/releases/download-map.json`
- Generated only: `dist/releases/packages/beta-20260621-9a362b3/**`

- [ ] **Step 1: Add the release-surface assertions first**

Extend `scripts/test-release-manifest.mjs` to assert the checked-in catalog uses first-party HTTPS URLs and keeps iOS unsigned:

```js
const publicCatalog = JSON.parse(fs.readFileSync(path.join(rootDir, 'public/releases/release-manifest.json'), 'utf8'));
const current = publicCatalog.releases.find((release) => release.releaseTag === 'beta-20260621-9a362b3');
assert.ok(current, 'public catalog must include the current beta');
assert.match(current.platforms.windows.assetUrl, /^https:\/\/schoolsystem\.com\.cn\/downloads\//);
assert.match(current.platforms.android.assetUrl, /^https:\/\/schoolsystem\.com\.cn\/downloads\//);
assert.equal(current.platforms.ios.status, 'awaiting-signing');
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:release-manifest`

Expected: FAIL with `public catalog must include the current beta`.

- [ ] **Step 3: Generate and install the release catalog**

Run the preparation command with the verified local packages:

```powershell
$env:RELEASE_INPUT_DIR="$env:TEMP\school-system-worker-input"
$env:RELEASE_OUTPUT_DIR="$PWD\dist\releases"
$env:RELEASE_TAG='beta-20260621-9a362b3'
$env:RELEASE_SOURCE_SHA='9a362b38124ca5a210b4679e95c297ae7afa8f35'
$env:RELEASE_ORIGIN='https://schoolsystem.com.cn'
npm run release:prepare-worker-assets
```

Copy only the generated catalog JSON into `public/releases/release-manifest.json`; keep binary parts in ignored `dist/`.

- [ ] **Step 4: Verify catalog, reconstructed binaries and documentation**

Run:

```bash
npm run test:worker-release-chunks
npm run test:release-manifest
npm run test:app-release-catalog-runtime
```

Expected: all PASS. Document that the free fallback must be regenerated from retained local packages after a clean build and that no paid R2 resource is required.

- [ ] **Step 5: Commit Task 3**

```bash
git add public/releases/release-manifest.json scripts/test-release-manifest.mjs package.json README.md
git commit -m "feat: publish first-party beta downloads"
```

### Task 4: Full verification, deployment and production proof

**Files:**
- Modify only if verification exposes a defect: files from Tasks 1-3

- [ ] **Step 1: Add focused commands to the release gate**

Include both focused tests in `check:release-fast` before the Cloudflare dry run:

Insert the exact segment below immediately before the existing final `npm run check:cloudflare` segment of `check:release-fast`:

```text
npm run test:worker-release-chunks && npm run test:worker-release-downloads &&
```

- [ ] **Step 2: Run local verification**

Run:

```bash
npm run build
npm run release:prepare-worker-assets
npm run check:release-fast
npm run test:calculation-snapshot
```

Expected: all PASS; generated chunks reconstruct to the recorded Windows and Android SHA-256 values.

- [ ] **Step 3: Commit the release gate**

```bash
git add package.json
git commit -m "test: gate free release delivery"
```

- [ ] **Step 4: Push and deploy**

Run:

```bash
git push origin main
npx wrangler deploy
```

Expected: push succeeds and Wrangler reports a new Worker version ID with all release chunks uploaded.

- [ ] **Step 5: Verify production downloads**

Run:

```bash
npm run verify:prod-minimal
curl -I https://schoolsystem.com.cn/downloads/school-system-windows-beta-20260621-9a362b3.exe
curl -I https://schoolsystem.com.cn/downloads/school-system-android-beta-20260621-9a362b3.apk
```

Expected: production verification PASS; both HEAD requests return `200`, correct `Content-Length`, attachment disposition and immutable cache headers. Download both files once, confirm their SHA-256 values match the catalog, then verify the version-center Windows/Android/iOS tabs and history drawer in the in-app browser when browser control is available.

- [ ] **Step 6: Preserve rollback evidence**

Record the new Worker version ID and retain the previous known-good ID `13337156-0bda-4c97-a534-eb4559e325b4`. If any production check fails, run `npx wrangler rollback 13337156-0bda-4c97-a534-eb4559e325b4` and report the failed check.
