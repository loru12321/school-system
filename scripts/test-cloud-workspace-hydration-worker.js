const assert = require('assert');
const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../public/assets/js/cloud-workspace-runtime.js');
const source = fs.readFileSync(file, 'utf8');

assert.ok(source.includes('function parsePayloadOffMainThread('), 'cloud workspace should expose async payload parsing');
assert.ok(source.includes('new window.Worker('), 'large payloads should use a Worker when available');
assert.ok(source.includes('LZString.decompressFromBase64'), 'the worker should decompress base64 payloads');
assert.ok(source.includes('raw.length < 100000'), 'small payloads should keep the synchronous fast path');
assert.ok(source.includes('await parsePayloadOffMainThread(row.content)'), 'cohort hydration should await worker parsing');

console.log('cloud-workspace hydration worker tests passed');
