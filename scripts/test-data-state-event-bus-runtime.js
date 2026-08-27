const assert = require('assert');
const fs = require('fs');
const path = require('path');

const file = path.resolve(__dirname, '../public/assets/js/data-state-event-bus-runtime.js');
const source = fs.readFileSync(file, 'utf8');

assert.ok(source.includes('function scheduleCheck('), 'event bus should use a self-rescheduling timeout');
assert.ok(source.includes('setTimeout(() =>'), 'event bus should schedule the next check with setTimeout');
assert.ok(!source.includes('intervalId = setInterval('), 'event bus should not use a fixed setInterval');
assert.ok(source.includes('Object.keys(map).sort()'), 'map signatures should be stable across key order');
assert.ok(source.includes('hash >>> 0'), 'map signatures should include value content, not only entry count');
assert.ok(source.includes('if (intervalId) scheduleCheck(checkInterval);'), 'manual notifications should reschedule the monitor');

console.log('data-state-event-bus-runtime tests passed');
