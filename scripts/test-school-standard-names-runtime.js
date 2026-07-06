const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const context = {
    console,
    RAW_DATA: [],
    SCHOOLS: {},
    TARGETS: {},
    TEACHER_SCHOOL_MAP: {},
    MY_SCHOOL: '银山实验学校',
    localStorage: {
        getItem(key) {
            return key === 'MY_SCHOOL' ? '银山实验学校' : '';
        },
        setItem() {},
        removeItem() {}
    }
};
context.window = context;
context.globalThis = context;

const source = fs.readFileSync(path.resolve(__dirname, '../public/assets/js/school-normalization-runtime.js'), 'utf8');
vm.runInNewContext(source, context, { filename: 'school-normalization-runtime.js' });

assert.strictEqual(context.TOWNSHIP_STANDARD_SCHOOL_NAMES.length, 14, 'township standard school count should be 14');
assert.strictEqual(context.COUNTY_DIRECT_STANDARD_SCHOOL_NAMES.length, 10, 'county-direct standard school count should be 10');
assert.strictEqual(context.COUNTY_STANDARD_SCHOOL_NAMES.length, 24, 'county standard school count should be 24');
assert.strictEqual(new Set(context.COUNTY_STANDARD_SCHOOL_NAMES).size, 24, 'county standard school names should be unique');

assert.strictEqual(context.getCanonicalSchoolName('银山实验学校'), '银山实验');
assert.strictEqual(context.getCanonicalSchoolName('商老庄'), '商老庄中学');
assert.strictEqual(context.getCanonicalSchoolName('彭集'), '彭集中学');
assert.strictEqual(context.getCanonicalSchoolName('接山'), '接山中学');
assert.strictEqual(context.getCanonicalSchoolName('州城'), '州城中学');
assert.strictEqual(context.getCanonicalSchoolName('州城一中'), '州城中学');
assert.strictEqual(context.getCanonicalSchoolName('州城二中'), '州城中学');
assert.strictEqual(context.getCanonicalSchoolName('新湖'), '新湖中学');
assert.strictEqual(context.getCanonicalSchoolName('沙河站'), '沙河站中学');
assert.strictEqual(context.getCanonicalSchoolName('东平实验中学'), '东平县实验中学');
assert.strictEqual(context.getCanonicalSchoolName('泰安市东平佛山中学'), '东平县佛山中学');
assert.strictEqual(context.getCanonicalSchoolName('东平江河实验学校'), '东平县江河实验学校');
assert.strictEqual(context.getCanonicalSchoolName('东平一中'), '东平县第一中学');
assert.notStrictEqual(context.getCanonicalSchoolName('实验中学'), '东平县实验中学');

context.RAW_DATA = [
    { school: '银山实验学校' },
    { school: '旧县乡中心学校' },
    { school: '州城一中' },
    { school: '州城二中' },
    { school: '东平实验中学' },
    { school: '东平一中' }
];
context.SCHOOLS = {
    银山实验学校: { name: '银山实验学校' },
    旧县乡中心学校: { name: '旧县乡中心学校' },
    州城一中: { name: '州城一中' },
    州城二中: { name: '州城二中' },
    东平实验中学: { name: '东平实验中学' },
    东平一中: { name: '东平一中' }
};

const allNames = Object.keys(context.SCHOOLS);
assert.strictEqual(context.isTownshipManagedSchool('银山实验学校', allNames), true);
assert.strictEqual(context.isTownshipManagedSchool('旧县乡中心学校', allNames), true);
assert.strictEqual(context.isTownshipManagedSchool('州城一中', allNames), true);
assert.strictEqual(context.isTownshipManagedSchool('州城二中', allNames), true);
assert.strictEqual(context.isTownshipManagedSchool('东平实验中学', allNames), false);
assert.strictEqual(context.isTownshipManagedSchool('东平一中', allNames), false);
assert.strictEqual(
    JSON.stringify(Array.from(context.getCountyDirectSchoolNames(allNames)).sort((a, b) => a.localeCompare(b, 'zh-CN'))),
    JSON.stringify(['东平实验中学', '东平一中'].sort((a, b) => a.localeCompare(b, 'zh-CN')))
);

console.log('school standard names runtime tests passed');
