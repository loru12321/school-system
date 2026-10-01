const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'public', 'sw.js'), 'utf8');
const listeners = new Map();
const entries = new Map();
const cache = {
  async match(request) { return entries.get(request.url)?.clone(); },
  async put(request, response) { entries.set(request.url, response.clone()); }
};
const caches = {
  async open() { return cache; },
  async match(request) { return cache.match(request); },
  async keys() { return []; },
  async delete() { entries.clear(); return true; }
};
const serverResponses = [
  () => new Response('{"content":"private cohort data"}', { status: 200 }),
  () => new Response('{"error":"INSUFFICIENT_ROLE"}', { status: 403 }),
  () => { throw new Error('offline'); },
  () => new Response('{"content":"private cohort data"}', { status: 200 }),
  () => { throw new Error('offline'); }
];
const seenRequests = [];

vm.runInNewContext(source, {
  self: { addEventListener(name, callback) { listeners.set(name, callback); } },
  caches,
  fetch: async (request) => {
    seenRequests.push(request);
    return serverResponses.shift()();
  },
  Request,
  Response,
  URL,
  Promise
}, { filename: 'public/sw.js' });

async function dispatch(request) {
  let responsePromise;
  listeners.get('fetch')({
    request,
    respondWith(value) { responsePromise = Promise.resolve(value); },
    waitUntil() {}
  });
  assert.ok(responsePromise, 'API fetch should be handled by the service worker');
  return responsePromise;
}

(async () => {
  const url = 'https://schoolsystem.com.cn/api/system-data?select=key,content&key=eq.cohort%3A%3A2024';
  const request = new Request(url);
  const first = await dispatch(request);
  assert.strictEqual(first.status, 200, 'the authorized response should be returned');

  const revoked = await dispatch(request);
  assert.strictEqual(revoked.status, 403, 'a revoked session must not receive a cached authorized response');

  const offline = await dispatch(request);
  assert.strictEqual(offline.status, 503, 'offline access must not reveal a previously authorized response');
  const htmlUrl = `${url}&format=html`;
  const htmlRequest = new Request(htmlUrl, { headers: { accept: 'text/html' } });
  assert.strictEqual((await dispatch(htmlRequest)).status, 200);
  assert.strictEqual((await dispatch(htmlRequest)).status, 503, 'HTML Accept headers must not route protected APIs into the page cache');
  assert.strictEqual(entries.has(url), false, 'protected API responses must not enter Cache Storage');
  assert.strictEqual(entries.has(htmlUrl), false, 'protected APIs with HTML Accept headers must not enter Cache Storage');
  assert.ok(seenRequests.every((seen) => seen.cache === 'no-store'), 'protected API requests must bypass the browser HTTP cache');
  console.log('service worker API authorization boundary: ok');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
