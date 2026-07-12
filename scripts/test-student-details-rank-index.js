const assert = require('assert');
const createRankingDataService = require('../public/assets/js/ranking-data-service-runtime.js');

function buildRows(schoolCount, studentsPerSchool = 2) {
    const rows = [];
    for (let schoolIndex = 1; schoolIndex <= schoolCount; schoolIndex += 1) {
        for (let studentIndex = 1; studentIndex <= studentsPerSchool; studentIndex += 1) {
            const score = 1000 - schoolIndex * 10 - studentIndex;
            rows.push({
                school: `学校${schoolIndex}`,
                class: '9.1',
                id: `${schoolIndex}-${studentIndex}`,
                name: `学生${schoolIndex}-${studentIndex}`,
                total: score,
                scores: {
                    语文: score / 10,
                    数学: score / 10 - studentIndex
                }
            });
        }
    }
    return rows;
}

function createService(townSchoolCount = 14) {
    return createRankingDataService({
        filterRowsToTownshipSchools(rows) {
            return rows.filter((row) => Number(row.school.replace('学校', '')) <= townSchoolCount);
        }
    });
}

const service = createService();

const thirteenRows = buildRows(13);
const thirteenIndex = service.buildStudentRankIndex(thirteenRows, ['语文', '数学']);
assert.strictEqual(thirteenIndex.schoolCount, 13);
assert.strictEqual(thirteenIndex.townRankVisible, false);
assert.strictEqual(thirteenIndex.countyRankVisible, false);
assert.strictEqual(thirteenIndex.getRank(thirteenRows[0], '语文', 'school'), 1);
assert.strictEqual(thirteenIndex.getRank(thirteenRows[0], 'total', 'township'), '-');

const fourteenRows = buildRows(14);
const fourteenIndex = service.buildStudentRankIndex(fourteenRows, ['语文', '数学']);
assert.strictEqual(fourteenIndex.schoolCount, 14);
assert.strictEqual(fourteenIndex.townRankVisible, true);
assert.strictEqual(fourteenIndex.countyRankVisible, false);
assert.strictEqual(fourteenIndex.getRank(fourteenRows[0], 'total', 'school'), 1);
assert.strictEqual(fourteenIndex.getRank(fourteenRows[0], '语文', 'school'), 1);
assert.strictEqual(fourteenIndex.getRank(fourteenRows[0], 'total', 'township'), 1);
assert.strictEqual(fourteenIndex.getRank(fourteenRows[0], 'total', 'county'), '-');
assert.strictEqual(fourteenIndex.getRank(fourteenRows[0], '语文', 'county'), '-');

const twentyFourRows = buildRows(24);
const twentyFourIndex = service.buildStudentRankIndex(twentyFourRows, ['语文', '数学']);
assert.strictEqual(twentyFourIndex.schoolCount, 24);
assert.strictEqual(twentyFourIndex.townRankVisible, true);
assert.strictEqual(twentyFourIndex.countyRankVisible, true);
assert.strictEqual(twentyFourIndex.getRank(twentyFourRows[0], 'total', 'township'), 1);
assert.strictEqual(twentyFourIndex.getRank(twentyFourRows[0], 'total', 'county'), 1);
assert.strictEqual(twentyFourIndex.getRank(twentyFourRows[0], '数学', 'county'), 1);
assert.strictEqual(twentyFourIndex.getRank(twentyFourRows[0], '语文', 'class'), 1);
assert.strictEqual(twentyFourIndex.getRank(twentyFourRows[1], '语文', 'class'), 2);
assert.strictEqual(twentyFourIndex.getRank(twentyFourRows[2], '语文', 'class'), 1, 'class ranks must stay scoped to the school');
const countyDirectStudent = twentyFourRows.find((row) => row.school === '学校24');
assert.strictEqual(twentyFourIndex.getRank(countyDirectStudent, 'total', 'township'), '-');
assert.ok(Number.isInteger(twentyFourIndex.getRank(countyDirectStudent, 'total', 'county')));

const performanceRows = buildRows(24, 325).slice(0, 7790);
const startedAt = Date.now();
const performanceIndex = service.buildStudentRankIndex(performanceRows, ['语文', '数学']);
performanceRows.slice(0, 40).forEach((student) => {
    ['total', '语文', '数学'].forEach((subject) => {
        assert.notStrictEqual(performanceIndex.getRank(student, subject, 'class'), '-');
        assert.notStrictEqual(performanceIndex.getRank(student, subject, 'school'), '-');
        assert.notStrictEqual(performanceIndex.getRank(student, subject, 'county'), '-');
    });
});
const elapsedMs = Date.now() - startedAt;
assert.ok(elapsedMs < 1500, `rank index should stay interactive for 7,790 rows, got ${elapsedMs}ms`);

assert.ok(performanceRows.every((row) => row.ranks === undefined), 'rank index must not mutate calculation rows');

const snapshotStartedAt = Date.now();
const sparseTarget = { ...twentyFourRows[1], ranks: undefined };
const rankSnapshot = service.buildStudentRankSnapshot(twentyFourRows, sparseTarget, ['语文', '数学']);
assert.strictEqual(rankSnapshot.getRank(sparseTarget, '语文', 'class'), 2);
assert.strictEqual(rankSnapshot.getRank(sparseTarget, '语文', 'school'), 2);
assert.strictEqual(rankSnapshot.getRank(sparseTarget, '语文', 'township'), 2);
assert.strictEqual(rankSnapshot.getRank(sparseTarget, '语文', 'county'), 2);
assert.ok(Date.now() - snapshotStartedAt < 200, 'single-student rank snapshot should stay off the long-task threshold');
assert.ok(twentyFourRows.every((row) => row.ranks === undefined), 'rank snapshot must not mutate calculation rows');

console.log(JSON.stringify({
    ok: true,
    boundaries: {
        thirteen: 'school only',
        fourteen: 'school + township',
        twentyFour: 'school + township + county'
    },
    rowCount: performanceRows.length,
    elapsedMs
}, null, 2));
