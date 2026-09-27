// Frozen synthetic baseline captured from e818952 before the 2026-09-27 audit.
// No student records, cloud connection or login are needed for this regression.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createHash } = require('node:crypto');
const root = path.resolve(__dirname, '..');

function fixture(grade, variant) {
    const SUBJECTS = grade < 8 ? ['语文', '数学', '英语'] : ['语文', '数学', '英语', '物理', '化学'];
    if (variant === 'noncore') SUBJECTS.push('政治', '历史', '地理', '生物');
    const schools = ['甲校', '乙校', '丙校'];
    const count = variant === 'empty' ? 0 : variant === 'single' ? 1 : 36;
    const RAW_DATA = schools.flatMap((school, schoolIndex) => Array.from({ length: count }, (_, i) => {
        const scores = Object.fromEntries(SUBJECTS.map((subject, j) => [subject,
            variant === 'ties' ? 80 : variant === 'zeros' ? 0 :
                variant === 'blanks' && (i + j) % 5 === 0 ? null : (i * 17 + j * 23 + schoolIndex * 11) % 121
        ]));
        return { school, class: String(i % 3 + 1), name: `fixture-${schoolIndex}-${i}`, scores,
            total: Object.values(scores).reduce((sum, score) => sum + (score || 0), 0),
            ranks: Object.fromEntries([...SUBJECTS, 'total'].map(s => [s, {}])) };
    }));
    return { RAW_DATA, SUBJECTS, CONFIG: { name: `${grade}年级`, excRate: 0.1 },
        THRESHOLDS: Object.fromEntries([...SUBJECTS, 'total'].map(s => [s, { exc: s === 'total' ? 400 : 96, pass: s === 'total' ? 300 : 72 }])),
        SCHOOLS_LITE: Object.fromEntries(schools.map(name => [name, { name, metrics: {}, rankings: {} }])),
        HIGH_SCHOOL_LINE: 420, HIGH_SCHOOL_ADMISSION_ALLOWED: variant === 'admission',
        ...(variant === 'township' ? { TOWNSHIP_SCHOOL_NAMES: ['甲校', '乙校'] } : {}) };
}

function capture(source) {
    const hashes = {};
    for (const grade of [6, 7, 8, 9]) {
        for (const variant of ['normal', 'empty', 'single', 'ties', 'zeros', 'blanks', 'township', 'admission', 'noncore']) {
            let output;
            const self = { postMessage(value) { output = value; } };
            vm.runInNewContext(source, { self }, { timeout: 5000 });
            self.onmessage({ data: { cmd: 'PROCESS_ALL', data: fixture(grade, variant) } });
            assert.equal(output?.status, 'ok', `${grade}/${variant}: ${output?.msg}`);
            hashes[`${grade}/${variant}`] = createHash('sha256').update(JSON.stringify(output)).digest('hex');
        }
    }
    return hashes;
}

function main() {
    const baseline = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures/calculation-output-baseline.json'), 'utf8'));
    for (const target of ['public/assets/js/data-processing-worker.js', 'dist/assets/js/data-processing-worker.js']) {
        assert.deepEqual(capture(fs.readFileSync(path.join(root, target), 'utf8')), baseline.outputs, `${target}: calculation results changed`);
    }
    console.log(`Calculation outputs unchanged: ${Object.keys(baseline.outputs).length} fixtures × source/build; baseline ${baseline.commit}`);
}

if (require.main === module) main();
module.exports = { capture };
