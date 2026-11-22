const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const JSZip = require('jszip');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'public/assets/js/quality-meeting-kit-runtime.js'), 'utf8');

const sampleRows = [
  // 本校 2 个班
  { name: '张三', school: '银山实验学校', class: '九.1', total: 520, scores: { 语文: 112, 数学: 118, 英语: 108, 物理: 92, 化学: 90, 历史: 85, 地理: 88, 生物: 90 } },
  { name: '李四', school: '银山实验学校', class: '九.1', total: 455, scores: { 语文: 98, 数学: 95, 英语: 92, 物理: 84, 化学: 86, 历史: 80, 地理: 82, 生物: 81 } },
  { name: '王五', school: '银山实验学校', class: '九.1', total: 395, scores: { 语文: 85, 数学: 72, 英语: 78, 物理: 76, 化学: 84, 历史: 74, 地理: 76, 生物: 75 } },
  { name: '赵六', school: '银山实验学校', class: '九.2', total: 488, scores: { 语文: 104, 数学: 108, 英语: 102, 物理: 88, 化学: 86, 历史: 84, 地理: 86, 生物: 85 } },
  { name: '钱七', school: '银山实验学校', class: '九.2', total: 378, scores: { 语文: 80, 数学: 64, 英语: 74, 物理: 78, 化学: 82, 历史: 70, 地理: 72, 生物: 70 } },
  { name: '孙八', school: '银山实验学校', class: '九.2', total: 310, scores: { 语文: 68, 数学: 52, 英语: 60, 物理: 64, 化学: 66, 历史: 62, 地理: 64, 生物: 62 } },
  // 外校 A（强校）
  { name: '外A1', school: '镇一中', class: '九.1', total: 530, scores: { 语文: 115, 数学: 119, 英语: 110, 物理: 94, 化学: 92, 历史: 88, 地理: 90, 生物: 91 } },
  { name: '外A2', school: '镇一中', class: '九.1', total: 500, scores: { 语文: 109, 数学: 110, 英语: 105, 物理: 88, 化学: 88, 历史: 86, 地理: 87, 生物: 88 } },
  // 外校 B（较弱）
  { name: '外B1', school: '镇二中', class: '九.1', total: 360, scores: { 语文: 76, 数学: 60, 英语: 70, 物理: 74, 化学: 80, 历史: 68, 地理: 70, 生物: 69 } },
  { name: '外B2', school: '镇二中', class: '九.1', total: 320, scores: { 语文: 70, 数学: 55, 英语: 62, 物理: 65, 化学: 68, 历史: 60, 地理: 62, 生物: 61 } }
];

const teacherMap = {
  '九.1_语文': '李老师',
  '九.2_语文': '李老师',
  '九.1_数学': '王老师',
  '九.2_数学': '陈老师'
};

// Mock XLSX for dryRun 10-sheet handbook verification
const fakeXLSX = {
  utils: {
    book_new: () => ({ SheetNames: [], Sheets: {} }),
    aoa_to_sheet: (aoa) => ({ '!ref': 'A1:N10', _aoa: aoa }),
    decode_range: () => ({ s: { r: 0, c: 0 }, e: { r: 3, c: 3 } }),
    encode_cell: ({ r, c }) => `R${r}C${c}`,
    book_append_sheet: (wb, ws, name) => {
      wb.SheetNames.push(name);
      wb.Sheets[name] = ws;
    }
  },
  writeFile: () => {}
};

const win = {
  RAW_DATA: sampleRows,
  MY_SCHOOL: '银山实验学校',
  SUBJECTS: ['语文', '数学'],
  TEACHER_MAP: teacherMap,
  CONFIG: { name: '2026九年级期中考试' },
  __LAST_INDICATOR_CALC_DATA__: [
    { name: '镇一中', t1: 1, r1: 1, score1: 40, t2: 2, r2: 2, score2: 40, finalScore: 80, rank: 1 },
    { name: '银山实验学校', t1: 2, r1: 1, score1: 25, t2: 3, r2: 2, score2: 30, finalScore: 55, rank: 2 },
    { name: '镇二中', t1: 1, r1: 0, score1: 0, t2: 2, r2: 0, score2: 0, finalScore: 0, rank: 3 }
  ],
  JSZip,
  XLSX: fakeXLSX
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

// 2. Grade-Differentiated Profiles (6 / 7 / 8 / 9)
const g9Profile = kit.getGradeAnalysisProfile('9');
const g8Profile = kit.getGradeAnalysisProfile('8');
const g7Profile = kit.getGradeAnalysisProfile('7');
const g6Profile = kit.getGradeAnalysisProfile('6');
assert.strictEqual(g9Profile.weights.total, 180, 'Grade 9 two-rate-one-avg max score is 50+80+50 = 180');
assert.strictEqual(g8Profile.weights.total, 200, 'Grade 8 two-rate-one-avg max score is 60+70+70 = 200');
assert.deepStrictEqual(Array.from(g7Profile.majorSubjects), ['语文', '数学', '英语'], 'Grade 7 major subjects are 语数英');
assert.deepStrictEqual(Array.from(g6Profile.majorSubjects), ['语文', '数学', '英语'], 'Grade 6 major subjects are 语数英');

// 3. Own-school class inserted into township school benchmark (own classes do not rank against each other)
const bench = kit.buildClassTownshipBenchmark(sampleRows, '银山实验学校', '总分', townTh.thresholds['总分'], g9Profile);
const cls1 = bench.find((r) => r.kind === 'own-class' && r.name === '九.1');
const cls2 = bench.find((r) => r.kind === 'own-class' && r.name === '九.2');
const extA = bench.find((r) => r.kind === 'external' && r.name === '镇一中');
const extB = bench.find((r) => r.kind === 'external' && r.name === '镇二中');
assert.ok(cls1 && cls2 && extA && extB);
assert.strictEqual(extA.avgRank, 1, '镇一中 should rank #1 among external schools');
assert.strictEqual(extB.avgRank, 2, '镇二中 should rank #2 among external schools');
assert.strictEqual(cls1.avgRank, 2, '九.1 (avg 456.67) is behind 镇一中 (515) and ahead of 镇二中 (340), so rank #2');
assert.strictEqual(cls2.avgRank, 2, '九.2 (avg 392) is also behind only 镇一中, confirming own classes do not compete with each other');

// 4. Teacher-clustered handbook rows with authentic two-rate-one-avg scoring
const teacherRows = kit.buildTeacherHandbookRows(myRows, ['语文', '数学'], teacherMap, townTh.thresholds, sampleRows, g9Profile);
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

// 6. Grade 9 vs Grade 8 vs Grade 7 Township Matrix & Handbook Differentiation
const townMatrix9 = kit.buildTownshipSchoolMatrix(sampleRows, '银山实验学校', ['语文', '数学'], townTh.thresholds, g9Profile);
assert.strictEqual(townMatrix9.totalSchools, 3);
assert.strictEqual(townMatrix9.ownTotal.comprehensiveRank, 2, '银山实验学校 should rank #2 in Grade 9 comprehensive evaluation');
assert.strictEqual(townMatrix9.ownTotal.highCount490, 1, '银山实验学校 has 1 student >= 490 (张三 520)');
assert.strictEqual(townMatrix9.ownTotal.scoreIndicator, 55, '银山实验学校 indicator score from system is 55');
assert.ok(townMatrix9.ownTotal.scoreBottom > 0, 'Bottom 1/3 score (max 40) should be calculated');

const townMatrix7 = kit.buildTownshipSchoolMatrix(sampleRows, '银山实验学校', ['语文', '数学', '历史'], townTh.thresholds, g7Profile);
assert.strictEqual(townMatrix7.ownTotal.scoreHigh490, 0, 'Grade 7 does not use 490 high score');
assert.ok(townMatrix7.majorSchoolRows.length === 3, 'Grade 7 computes 3-major-subject dual caliber comparison across township schools');

// Verify 10-Sheet Excel Handbook differs between Grade 9 and Grade 7
const hb9 = kit.exportTeacherAnalysisHandbookExcel({ grade: '9', dryRun: true });
const hb7 = kit.exportTeacherAnalysisHandbookExcel({ grade: '7', dryRun: true });
assert.strictEqual(hb9.sheetNames.length, 10, 'Handbook must contain 10 sheets');
assert.ok(hb9.sheetNames.includes('9年级专项核算'), 'Grade 9 handbook includes 9年级专项核算 sheet');
assert.ok(hb7.sheetNames.includes('7年级三科主科与后三分之一'), 'Grade 7 handbook includes 7年级三科主科与后三分之一 sheet');

// 7. Real PPTX OOXML zip generation + Native Bar Charts (<c:chartSpace>) validation across grades
(async () => {
  const fakePngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const ppt9 = await kit.buildMeetingPptxBlob({
    grade: '9',
    outputType: 'nodebuffer',
    chartImages: [{ title: '测试图表', base64: fakePngBase64 }]
  });
  assert.ok(ppt9.slideCount >= 10, `expected at least 10 slides, got ${ppt9.slideCount}`);
  assert.ok(ppt9.chartCount >= 5, `expected at least 5 native OOXML charts, got ${ppt9.chartCount}`);
  assert.ok(ppt9.fileName.includes('9年级中考全维模式'));

  const zip = await JSZip.loadAsync(ppt9.payload);
  assert.ok(zip.file('[Content_Types].xml'), 'PPTX must contain [Content_Types].xml');
  assert.ok(zip.file('ppt/charts/chart1.xml'), 'PPTX must embed native OOXML chart1.xml');
  const chart1Xml = await zip.file('ppt/charts/chart1.xml').async('text');
  assert.ok(chart1Xml.includes('<c:barChart>'), 'chart1.xml must be a valid OOXML barChart');
  assert.ok(chart1Xml.includes('<c:strLit>') && chart1Xml.includes('<c:numLit>'), 'chart1.xml must use inline literals instead of broken Sheet1 refs');
  assert.ok(chart1Xml.indexOf('</c:chart>') < chart1Xml.lastIndexOf('<c:spPr><a:noFill/>'), 'chartSpace spPr must appear after </c:chart> per OOXML XSD');
  const theme1Xml = await zip.file('ppt/theme/theme1.xml').async('text');
  assert.ok((theme1Xml.match(/<a:effectStyle>/g) || []).length >= 3, 'theme1.xml fmtScheme must have at least 3 effectStyle entries for PowerPoint 16.0');
  assert.ok(zip.file('docProps/core.xml') && zip.file('docProps/app.xml'), 'PPTX must include docProps/core.xml and docProps/app.xml');

  const allSlidesXml = await Promise.all(
    Object.keys(zip.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).map((f) => zip.file(f).async('text'))
  );
  assert.ok(allSlidesXml.some((x) => x.includes('九年级专项核算：高分段(≥490) · 指标生 · 后1/3托底')), 'Grade 9 PPTX must include Grade 9 special evaluation slide');

  const ppt8 = await kit.buildMeetingPptxBlob({ grade: '8', outputType: 'nodebuffer' });
  const zip8 = await JSZip.loadAsync(ppt8.payload);
  const slides8Xml = await Promise.all(
    Object.keys(zip8.files).filter((f) => /^ppt\/slides\/slide\d+\.xml$/.test(f)).map((f) => zip8.file(f).async('text'))
  );
  assert.ok(slides8Xml.some((x) => x.includes('八年级专项：')), 'Grade 8 PPTX must include Grade 8 special slide');
  assert.ok(slides8Xml.every((x) => !x.includes('可视化图表快照')), 'Default PPTX without chartImages must not create a blank snapshot slide');
  assert.ok(chart1Xml.includes('<c:dLbls>') && chart1Xml.includes('showVal val="1"'), 'Native OOXML chart must include data value labels');
  assert.ok(chart1Xml.includes('<c:formatCode>General</c:formatCode>'), 'Native OOXML chart must use General formatCode without trailing dots');

  console.log('quality-meeting-kit-runtime tests passed');
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
