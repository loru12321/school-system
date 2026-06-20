import assert from 'node:assert/strict';
import { handleReleaseDownload } from '../src/worker-release-downloads.mjs';

const map = {
  schemaVersion: 1,
  downloads: [{
    filename: 'school-system-windows-beta.exe',
    contentType: 'application/vnd.microsoft.portable-executable',
    bytes: 6,
    sha256: 'a'.repeat(64),
    chunks: ['packages/beta-20260621-9a362b3/windows/part-0001', 'packages/beta-20260621-9a362b3/windows/part-0002']
  }]
};

function createEnv({ omitSecondChunk = false } = {}) {
  const objects = new Map([
    ['/releases/download-map.json', JSON.stringify(map)],
    ['/releases/packages/beta-20260621-9a362b3/windows/part-0001', 'abc'],
    ['/releases/packages/beta-20260621-9a362b3/windows/part-0002', 'def']
  ]);
  if (omitSecondChunk) objects.delete('/releases/packages/beta-20260621-9a362b3/windows/part-0002');
  return {
    ASSETS: {
      async fetch(request) {
        const value = objects.get(new URL(request.url).pathname);
        if (value === undefined) return new Response('missing', { status: 404 });
        const headers = { 'Content-Length': String(Buffer.byteLength(value)) };
        return request.method === 'HEAD'
          ? new Response(null, { status: 200, headers })
          : new Response(value, { status: 200, headers });
      }
    }
  };
}

const requestUrl = 'https://schoolsystem.com.cn/downloads/school-system-windows-beta.exe';
const getResponse = await handleReleaseDownload(new Request(requestUrl), createEnv());
assert.equal(getResponse.status, 200);
assert.equal(await getResponse.text(), 'abcdef');
assert.equal(getResponse.headers.get('Content-Length'), '6');
assert.equal(getResponse.headers.get('Content-Type'), 'application/vnd.microsoft.portable-executable');
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

const traversalResponse = await handleReleaseDownload(
  new Request('https://schoolsystem.com.cn/downloads/%2E%2E%2Fsecret.exe'),
  createEnv()
);
assert.equal(traversalResponse.status, 404);

const unavailableResponse = await handleReleaseDownload(new Request(requestUrl), createEnv({ omitSecondChunk: true }));
assert.equal(unavailableResponse.status, 503);

const methodResponse = await handleReleaseDownload(
  new Request(requestUrl, { method: 'POST', body: 'x' }),
  createEnv()
);
assert.equal(methodResponse.status, 405);

console.log(JSON.stringify({ ok: true, bytes: 6 }, null, 2));
