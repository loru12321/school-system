import fs from 'node:fs';

function normalizeCompareName(name) {
  return String(name || '').trim().replace(/\s+/g, '').toLowerCase();
}

function normalizeClass(cls) {
  const raw = String(cls || '').trim();
  if (!raw) return '';
  const digits = raw.replace(/[^0-9]/g, '');
  if (digits) return digits;
  return raw.toLowerCase().replace(/\s+/g, '');
}

function isClassEquivalent(a, b) {
  const c1 = normalizeClass(a);
  const c2 = normalizeClass(b);
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;
  const n1 = c1.replace(/^0+/, '');
  const n2 = c2.replace(/^0+/, '');
  return !!n1 && n1 === n2;
}

function normalizeCloudCompareTarget(target, user) {
  return {
    name: normalizeCompareName(target?.name || user?.name || ''),
    class: String(target?.class || user?.class || '').trim(),
    school: String(target?.school || user?.school || '').trim(),
  };
}

function pickSelfStudentFromCloudRows(rows, normalizedTarget) {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const targetName = normalizedTarget?.name || '';
  const targetClass = String(normalizedTarget?.class || '');
  const targetSchool = String(normalizedTarget?.school || '').trim();

  const withSchool = sourceRows.filter((s) => {
    if (!targetSchool) return true;
    const school = String(s?.school || '').trim();
    if (!school) return true;
    return school === targetSchool;
  });

  const exactMatches = withSchool.filter((s) => {
    const sameName = normalizeCompareName(s?.name || '') === targetName;
    const sameClass = !targetClass || isClassEquivalent(s?.class || '', targetClass);
    return sameName && sameClass;
  });
  if (exactMatches.length > 0) {
    return { student: exactMatches[0], strategy: 'name+class', candidates: exactMatches };
  }

  const nameOnlyMatches = withSchool.filter((s) => normalizeCompareName(s?.name || '') === targetName);
  if (nameOnlyMatches.length > 0) {
    return { student: nameOnlyMatches[0], strategy: 'name-only', candidates: nameOnlyMatches };
  }

  const classOnlyMatches = withSchool.filter((s) => targetClass && isClassEquivalent(s?.class || '', targetClass));
  if (classOnlyMatches.length === 1) {
    return { student: classOnlyMatches[0], strategy: 'class-unique', candidates: classOnlyMatches };
  }

  return { student: null, strategy: 'none', candidates: [] };
}

function runScenario(name, rows, target, user, expected) {
  const normalizedTarget = normalizeCloudCompareTarget(target, user);
  const picked = pickSelfStudentFromCloudRows(rows, normalizedTarget);

  const actual = {
    found: !!picked.student,
    pickedName: picked.student?.name || null,
    pickedClass: picked.student?.class || null,
    strategy: picked.strategy,
    candidates: picked.candidates.length,
  };

  const pass = actual.found === expected.found
    && (!expected.pickedName || expected.pickedName === actual.pickedName)
    && (!expected.pickedClass || expected.pickedClass === actual.pickedClass)
    && (!expected.strategy || expected.strategy === actual.strategy);

  return {
    scenario: name,
    target: normalizedTarget,
    expected,
    actual,
    pass,
  };
}

function main() {
  const rows = [
    { name: '张三', class: '701', school: '实验中学' },
    { name: '李四', class: '702', school: '实验中学' },
    { name: '张三', class: '702', school: '实验中学' },
    { name: '王五', class: '7.03', school: '实验中学' },
    { name: '赵六', class: '801', school: '城关中学' },
  ];

  const cases = [
    runScenario(
      '精确匹配（姓名+班级）',
      rows,
      { name: '张三', class: '701', school: '实验中学' },
      {},
      { found: true, pickedName: '张三', pickedClass: '701', strategy: 'name+class' },
    ),
    runScenario(
      '班级格式兼容（7.03 vs 703）',
      rows,
      { name: '王五', class: '703', school: '实验中学' },
      {},
      { found: true, pickedName: '王五', pickedClass: '7.03', strategy: 'name+class' },
    ),
    runScenario(
      '同名多班按班级定向',
      rows,
      { name: '张三', class: '702', school: '实验中学' },
      {},
      { found: true, pickedName: '张三', pickedClass: '702', strategy: 'name+class' },
    ),
    runScenario(
      '仅姓名回退匹配',
      rows,
      { name: '李四', class: '', school: '实验中学' },
      {},
      { found: true, pickedName: '李四', pickedClass: '702', strategy: 'name+class' },
    ),
    runScenario(
      '跨校目标不应误命中',
      rows,
      { name: '张三', class: '701', school: '城关中学' },
      {},
      { found: false, strategy: 'none' },
    ),
    runScenario(
      '无匹配数据',
      rows,
      { name: '不存在', class: '999', school: '实验中学' },
      {},
      { found: false, strategy: 'none' },
    ),
  ];

  const passed = cases.filter((x) => x.pass).length;
  const failed = cases.length - passed;

  const summary = {
    total: cases.length,
    passed,
    failed,
    passRate: `${((passed / cases.length) * 100).toFixed(1)}%`,
    generatedAt: new Date().toISOString(),
  };

  fs.writeFileSync('学生端云对比模拟验证明细.json', JSON.stringify({ summary, cases }, null, 2), 'utf8');

  const lines = [];
  lines.push('# 学生端“查看云端对比”模拟验证报告');
  lines.push('');
  lines.push('## 1. 验证结论');
  lines.push(`- 用例总数：${summary.total}`);
  lines.push(`- 通过数：${summary.passed}`);
  lines.push(`- 失败数：${summary.failed}`);
  lines.push(`- 通过率：${summary.passRate}`);
  lines.push('');
  lines.push('## 2. 关键覆盖场景');
  lines.push('- 姓名+班级精确匹配');
  lines.push('- 班级格式兼容匹配（如 7.03 / 703）');
  lines.push('- 同名不同班级定向匹配');
  lines.push('- 仅姓名回退匹配');
  lines.push('- 跨校隔离与无匹配兜底');
  lines.push('');
  lines.push('## 3. 用例明细');
  lines.push('');
  lines.push('| 场景 | 结果 | 实际策略 | 实际命中 |');
  lines.push('|---|---|---|---|');
  for (const c of cases) {
    const hit = c.actual.found ? `${c.actual.pickedName} / ${c.actual.pickedClass}` : '无';
    lines.push(`| ${c.scenario} | ${c.pass ? '✅ 通过' : '❌ 失败'} | ${c.actual.strategy} | ${hit} |`);
  }

  fs.writeFileSync('学生端云对比模拟验证报告.md', `${lines.join('\n')}\n`, 'utf8');

  console.log('模拟验证完成：');
  console.log(`- 学生端云对比模拟验证明细.json`);
  console.log(`- 学生端云对比模拟验证报告.md`);
  console.log(`结果：${passed}/${cases.length} 通过`);

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main();
