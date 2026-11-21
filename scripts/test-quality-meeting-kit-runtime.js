const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const JSZip = require('jszip');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/quality-meeting-kit-runtime.js'), 'utf8');

const sampleRows = [
  // 本校 2 个班
  { name: '张三', school: '银山实验学校', class: '九.1', total: 520, scores: { 语文: 112, 数学: 118 } },
  { name: '李四', school: '银山实验学校', class: '九.1', total: 455, scores: { 语文: 98, 数学: 95 } },
  { name: '王五', school: '银山实验学校', class: '九.1', total: 395, scores: { 语文: 85, 数学: 72 } },
  { name: '赵六', school: '银山实验学校', class: '九.2', total: 488, scores: { 语文: 104, 数学: 108 } },
  { name: '钱七', school: '银山实验学校', class: '九.2', total: 378, scores: { 语文: 80, 数学: 64 } },
  { name: '孙八', school: '银山实验学校', class: '九.2', total: 310, scores: { 语文: 68, 数学: 52 } },
  // 外校 A（强校）
  { name: '外A1', school: '镇一中', class: '九.1', total: 530, scores: { 语文: 115, 数学: 119 } },
  { name: '外A2', school: '镇一中', class: '九.1', total: 500, scores: { 语文: 109, 数学: 110 } },
  // 外校 B（较弱）
  { name: '外B1', school: '镇二中', class: '九.1', total: 360, scores: { 语文: 76, 数学: 60 } },
  { name: '外B2', school: '镇二中', class: '九.1', total: 320, scores: { 语文: 70, 数学: 55 } }
];

const teacherMap = {
  '九.1_语文': '李老师',
  '九.2_语文': '李老师',
  '九.1_数学': '王老师',
  '九.2_数学': '陈老师'
};

const win = {
  RAW_DATA: sampleRows,
  MY_SCHOOL: '银山实验学校',
  SUBJECTS: ['语文', '数学'],
  TEACHER_MAP: teacherMap,
  CONFIG: { name: '2026九年级期中考试' },
  JSZip
};
const ctx = { window: win, globalThis: win, Date, Map, Set, Array, Object, Number, String, Math, JSON, console };
vm.runInNewContext(source, ctx, { filename: 'quality-meeting-kit-runtime.js' });

const kit = win.QualityMeetingKit;
assert.ok(kit, 'QualityMeetingKit should be exposed on window');

// 1. Threshold calibration: township vs own-school
const myRows = sampleRows.filter((r) => r.school === '银山实验学校');
const townTh = kit.resolveThresholds(sampleRows, myRows, ['语文', '数学'], true);
const schTh = kit.resolveThresholds(sampleRows, myRows, ['语文', '数学'], false);
assert.strictEqual(townTh.source, 'township');
assert.strictEqual(townTh.hasTownship, true);
assert.strictEqual(townTh.schoolCount, 3);
assert.strictEqual(schTh.source, 'school');
assert.ok(townTh.thresholds['总分'].exc > 0 && townTh.thresholds['总分'].pass > 0);

// 2. Inline rank badges
assert.ok(kit.buildInlineRankBadgeHtml(1).includes('qmk-rk-1'));
assert.ok(kit.buildInlineRankBadgeHtml(2).includes('qmk-rk-2'));
assert.ok(kit.buildInlineRankBadgeHtml(3).includes('qmk-rk-3'));
assert.ok(kit.buildInlineRankBadgeHtml(4).includes('qmk-rk-n'));

// 3. Own-school class inserted into township school benchmark (own classes do not rank against each other)
const bench = kit.buildClassTownshipBenchmark(sampleRows, '银山实验学校', '总分', townTh.thresholds['总分']);
const cls1 = bench.find((r) => r.kind === 'own-class' && r.name === '九.1');
const cls2 = bench.find((r) => r.kind === 'own-class' && r.name === '九.2');
const extA = bench.find((r) => r.kind === 'external' && r.name === '镇一中');
const extB = bench.find((r) => r.kind === 'external' && r.name === '镇二中');
assert.ok(cls1 && cls2 && extA && extB);
assert.strictEqual(extA.avgRank, 1, '镇一中 should rank #1 among external schools');
assert.strictEqual(extB.avgRank, 2, '镇二中 should rank #2 among external schools');
assert.strictEqual(cls1.avgRank, 2, '九.1 (avg 456.67) is behind 镇一中 (515) and ahead of 镇二中 (340), so rank #2');
assert.strictEqual(cls2.avgRank, 2, '九.2 (avg 392) is also behind only 镇一中, confirming own classes do not compete with each other');

// 4. Teacher-clustered handbook rows
const teacherRows = kit.buildTeacherHandbookRows(myRows, ['语文', '数学'], teacherMap, townTh.thresholds);
const liChinese = teacherRows.find((r) => r.teacher === '李老师' && r.subject === '语文');
assert.ok(liChinese, '李老师 teaching both 九.1 and 九.2 should be aggregated');
assert.deepStrictEqual(Array.from(liChinese.classes), ['九.1', '九.2']);
assert.strictEqual(liChinese.count, 6);

// 5. Borderline student chips & copy formatting
const chips = kit.buildBorderlineChips(myRows, '总分', { exc: 500, pass: 400 }, 15);
assert.deepStrictEqual(Array.from(chips.excellent, (s) => s.name), ['张三']);
assert.deepStrictEqual(Array.from(chips.excMarginal, (s) => s.name), ['赵六']);
assert.deepStrictEqual(Array.from(chips.passMarginal, (s) => s.name), ['王五']);
const copyText = kit.formatChipsCopyText('优秀边缘生', chips.excMarginal);
assert.ok(copyText.includes('赵六(九.2 488)'), 'copy text should include student name, class, and score');

// 5b. Township school ranking matrix, subject diagnosis, and actionable direction/measures
const townMatrix = kit.buildTownshipSchoolMatrix(sampleRows, '银山实验学校', ['语文', '数学'], townTh.thresholds);
assert.strictEqual(townMatrix.totalSchools, 3);
assert.strictEqual(townMatrix.ownTotal.scoreRank, 2, '银山实验学校 should rank #2 among 3 township schools');
assert.strictEqual(townMatrix.targetAhead.name, '镇一中', '追赶目标校应为前一名 镇一中');
assert.ok(townMatrix.gapToAhead > 0, 'gap to target school ahead should be positive');
const subjDiag = kit.buildSubjectDiagnosis(townMatrix, myRows, ['语文', '数学'], townTh.thresholds);
assert.strictEqual(subjDiag.length, 2);
assert.ok(subjDiag.every((d) => d.measure && d.tier), 'every subject must have a tier classification and concrete measure');
const classRows = kit.buildClassRows(myRows, '总分', townTh.thresholds['总分']);
const overall = kit.calcGroupMetrics(myRows, '总分', townTh.thresholds['总分']);
const plan = kit.buildActionPlan(townMatrix, subjDiag, classRows, chips, overall);
assert.strictEqual(plan.actions.length, 4, 'action plan should cover all 4 dimensions');
const planText = kit.formatActionPlanCopyText('2026九年级期中考试', '银山实验学校', plan);
assert.ok(planText.includes('镇一中') && planText.includes('校级镇域追赶方向'), 'copyable meeting speech should include target school and strategy');

// 6. Real PPTX OOXML zip generation + XML validation (including townPosition & actionPlan slides)
(async () => {
  const fakePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const ppt = await kit.buildMeetingPptxBlob({
    outputType: 'nodebuffer',
    chartImages: [{ title: '测试图表', base64: fakePngBase64 }]
  });
  assert.ok(ppt.slideCount >= 10, `expected at least 10 slides with townPosition + actionPlan + closing, got ${ppt.slideCount}`);
  assert.ok(ppt.fileName.endsWith('.pptx'));

  const zip = await JSZip.loadAsync(ppt.payload);
  assert.ok(zip.file('[Content_Types].xml'), 'PPTX must contain [Content_Types].xml');
  assert.ok(zip.file('ppt/presentation.xml'), 'PPTX must contain ppt/presentation.xml');
  assert.ok(zip.file('ppt/media/chart1.png'), 'PPTX must embed captured chart PNG');
  const slide1Xml = await zip.file('ppt/slides/slide1.xml').async('text');
  assert.ok(slide1Xml.includes('2026九年级期中考试'), 'slide 1 must include exam title');
  const slide3Xml = await zip.file('ppt/slides/slide3.xml').async('text');
  assert.ok(slide3Xml.includes('<a:tbl>'), 'town position slide must contain native OOXML table');
  const allSlidesXml = await Promise.all(
    Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).map((f) => zip.file(f).async('text'))
  );
  assert.ok(allSlidesXml.some((x) => x.includes('下阶段提质方向与整改措施')), 'PPTX must include action plan slide');
  assert.ok(allSlidesXml.some((x) => x.includes('全镇校际定位与各科强弱诊断')), 'PPTX must include township positioning slide');

  console.log('quality-meeting-kit-runtime tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
