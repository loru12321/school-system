import assert from 'node:assert/strict';
import { handleReleaseDownload } from '../src/worker-release-downloads.mjs';

const map = {
  schemaVersion: 1,
  downloads: [{
    filename: 'school-system-windows-beta-20260624-7e19d7d.exe',
    contentType: 'application/vnd.microsoft.portable-executable',
    bytes: 6,
    sha256: 'a'.repeat(64),
    chunks: ['packages/beta-20260624-7e19d7d/windows/part-0001', 'packages/beta-20260624-7e19d7d/windows/part-0002'],
    chunkBytes: [3, 3]
  }]
};

function createEnv({ omitSecondChunk = false, omitMap = false } = {}) {
  const stats = { chunkGets: 0 };
  const objects = new Map([
    ['/releases/download-map.json', JSON.stringify(map)],
    ['/releases/packages/beta-20260624-7e19d7d/windows/part-0001', 'abc'],
    ['/releases/packages/beta-20260624-7e19d7d/windows/part-0002', 'def']
  ]);
  if (omitMap) objects.delete('/releases/download-map.json');
  if (omitSecondChunk) objects.delete('/releases/packages/beta-20260624-7e19d7d/windows/part-0002');
  return {
    ASSETS: {
      async fetch(request) {
        const pathname = new URL(request.url).pathname;
        const value = objects.get(pathname);
        if (value === undefined) return new Response('missing', { status: 404 });
        if (request.method === 'GET' && pathname.includes('/packages/')) stats.chunkGets += 1;
        const headers = request.method === 'HEAD' ? {} : { 'Content-Length': String(Buffer.byteLength(value)) };
        return request.method === 'HEAD'
          ? new Response(null, { status: 200, headers })
          : new Response(value, { status: 200, headers });
      }
    },
    stats
  };
}

const requestUrl = 'https://schoolsystem.com.cn/downloads/school-system-windows-beta-20260624-7e19d7d.exe';
const getEnv = createEnv();
const getResponse = await handleReleaseDownload(new Request(requestUrl), getEnv);
assert.equal(getResponse.status, 200);
await new Promise((resolve) => setImmediate(resolve));
assert.ok(getEnv.stats.chunkGets <= 1, 'stream should respect backpressure before the body is consumed');
assert.equal(await getResponse.text(), 'abcdef');
assert.equal(getResponse.headers.get('Content-Length'), '6');
assert.equal(getResponse.headers.get('Content-Type'), 'application/vnd.microsoft.portable-executable');
assert.equal(getResponse.headers.get('Cache-Control'), 'public, max-age=31536000, immutable');
assert.match(getResponse.headers.get('Content-Disposition'), /attachment/);
assert.equal(getResponse.headers.get('X-Content-Type-Options'), 'nosniff');

const headResponse = await handleReleaseDownload(new Request(requestUrl, { method: 'HEAD' }), createEnv());
assert.equal(headResponse.status, 200);
assert.equal(await headResponse.text(), '');
assert.equal(headResponse.headers.get('Content-Length'), '6');

const missingResponse = await handleReleaseDownload(
  new Request('https://schoolsystem.com.cn/downloads/unknown.exe'),
  createEnv()
);
assert.equal(missingResponse.status, 404);

const staticFallbackResponse = await handleReleaseDownload(new Request(requestUrl), createEnv({ omitMap: true }));
assert.equal(staticFallbackResponse, null);

const traversalResponse = await handleReleaseDownload(
  new Request('https://schoolsystem.com.cn/downloads/%2E%2E%2Fsecret.exe'),
  createEnv()
);
assert.equal(traversalResponse.status, 404);

const hostedArchiveFallback = await handleReleaseDownload(
  new Request('https://schoolsystem.com.cn/downloads/school-system-windows-legacy.exe'),
  createEnv()
);
assert.equal(hostedArchiveFallback, null);

const unavailableResponse = await handleReleaseDownload(new Request(requestUrl), createEnv({ omitSecondChunk: true }));
assert.equal(unavailableResponse.status, 503);

const methodResponse = await handleReleaseDownload(
  new Request(requestUrl, { method: 'POST', body: 'x' }),
  createEnv()
);
assert.equal(methodResponse.status, 405);

console.log(JSON.stringify({ ok: true, bytes: 6 }, null, 2));
