// Values interpolated into generated onclick="fn(...)" attributes must be
// encoded as JS string literals *and* HTML-escaped for the attribute, so
// names containing quotes, backslashes or markup cannot break out.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, 'public/assets/js', file), 'utf8');

function extract(source, pattern, label) {
  const match = pattern.exec(source);
  assert.ok(match, `${label} helper not found`);
  return vm.runInNewContext(`(${match[1]})`);
}

const helpers = {
  'teacher-compare-result teacherDiffAttrArg': extract(read('teacher-compare-result-runtime.js'),
    /(function teacherDiffAttrArg\(value\) \{[\s\S]*?\n\})/, 'teacherDiffAttrArg'),
  'auth-login issueArg': extract(read('auth-login-runtime.js'),
    /const issueArg = (\(value\) => JSON\.stringify[\s\S]*?\.replace\(\/>\/g, '&gt;'\));/, 'issueArg'),
  'student-jump jsStringLiteral': extract(read('student-jump-runtime.js'),
    /(function jsStringLiteral\(value\) \{[\s\S]*?\n    \})/, 'jsStringLiteral')
};

const decodeAttribute = (text) => text
  .replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

const hostile = [
  "O'Brien", 'a"b', 'back\\slash', "\\');alert(1);//", '"><img src=x onerror=alert(1)>', '</script>', '张三', '', 'line\nbreak'
];

for (const [label, encode] of Object.entries(helpers)) {
  for (const value of hostile) {
    const attr = encode(value);
    assert.ok(!attr.includes('"') && !attr.includes('<') && !attr.includes('>'), `${label}: raw " < > must not reach the attribute for ${JSON.stringify(value)}`);
    const received = [];
    vm.runInNewContext(`call(${decodeAttribute(attr)})`, { call: (arg) => received.push(arg) });
    assert.deepStrictEqual(received, [value], `${label}: ${JSON.stringify(value)} must round-trip as one string argument`);
  }
}

// The previously hand-rolled quote replacement and raw interpolations must stay gone.
const auth = read('auth-login-runtime.js');
const details = read('student-details-render-runtime.js');
const teacherDiff = read('teacher-compare-result-runtime.js');
assert.ok(!/replace\(\/'\/g, "\\\\'"\)\.replace\(\/"\/g, '&quot;'\)/.test(auth), 'auth-login must not escape onclick args with a quote-only replace');
assert.ok(!/'\$\{colKey\}'/.test(details), 'student detail filter menus must not interpolate raw column keys into onclick');
assert.ok(!/exportAllTeachersMultiPeriodDiff\('\$\{school\}'/.test(teacherDiff), 'teacher diff export must not interpolate raw school names into onclick');

console.log(`inline argument escaping tests passed (${Object.keys(helpers).length} encoders × ${hostile.length} values)`);
