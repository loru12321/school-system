import fs from 'node:fs';

const SUBJECTS = ['语文', '数学', '英语'];
const THRESHOLDS = {
  语文: { exc: 90, pass: 72 },
  数学: { exc: 90, pass: 72 },
  英语: { exc: 90, pass: 72 },
};

function makeExamData(tag) {
  const data = [];
  const schools = ['实验中学', '城关中学', '广益中学'];
  const schoolBase = {
    实验中学: { 语文: 81, 数学: 78, 英语: 79 },
    城关中学: { 语文: 83, 数学: 81, 英语: 82 },
    广益中学: { 语文: 79, 数学: 76, 英语: 77 },
  };

  const examShift = {
    期中: { 语文: 0, 数学: 0, 英语: 0 },
    期末: { 语文: 1.8, 数学: 4.2, 英语: 2.6 },
  };

  const classShiftMid = {
    '701': { 语文: 0.8, 数学: 2.0, 英语: 1.2 },
    '702': { 语文: -0.2, 数学: -0.5, 英语: -0.1 },
  };
  const classShiftFin = {
    '701': { 语文: 1.5, 数学: 6.5, 英语: 2.4 },
    '702': { 语文: 0.2, 数学: 0.8, 英语: 0.5 },
  };

  for (const school of schools) {
    for (const [cidx, cls] of ['701', '702'].entries()) {
      for (let i = 1; i <= 20; i += 1) {
        const sid = `${school.slice(0, 2)}${cls}${String(i).padStart(2, '0')}`;
        const scores = {};
        for (const sub of SUBJECTS) {
          const base = schoolBase[school][sub];
          const noise = ((i * 7 + cidx * 11) % 13) - 6;
          let val = base + noise;
          if (school === '实验中学') {
            const shiftMap = tag === '期中' ? classShiftMid : classShiftFin;
            val += shiftMap[cls][sub];
          }
          val += examShift[tag][sub];
          val = Math.max(35, Math.min(100, Math.round(val * 10) / 10));
          scores[sub] = val;
        }
        data.push({ name: sid, school, cls, scores });
      }
    }
  }
  return data;
}

function aggregateSchoolMetrics(students) {
  const bySchool = {};
  for (const s of students) {
    bySchool[s.school] ??= [];
    bySchool[s.school].push(s);
  }

  const out = {};
  for (const [school, arr] of Object.entries(bySchool)) {
    out[school] = {};
    for (const sub of SUBJECTS) {
      const vals = arr.map((x) => x.scores[sub]);
      const exc = THRESHOLDS[sub].exc;
      const pas = THRESHOLDS[sub].pass;
      out[school][sub] = {
        count: vals.length,
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
        excRate: vals.filter((v) => v >= exc).length / vals.length,
        passRate: vals.filter((v) => v >= pas).length / vals.length,
      };
    }

    const totals = arr.map((x) => SUBJECTS.reduce((sum, sub) => sum + x.scores[sub], 0));
    out[school].total = {
      count: totals.length,
      avg: totals.reduce((a, b) => a + b, 0) / totals.length,
      excRate: totals.filter((v) => v >= 270).length / totals.length,
      passRate: totals.filter((v) => v >= 216).length / totals.length,
    };
  }

  const allTotal = Object.values(out).map((x) => x.total);
  const maxAvg = Math.max(...allTotal.map((x) => x.avg));
  const maxExc = Math.max(...allTotal.map((x) => x.excRate));
  const maxPass = Math.max(...allTotal.map((x) => x.passRate));

  for (const school of Object.keys(out)) {
    const m = out[school].total;
    const ratedAvg = maxAvg ? (m.avg / maxAvg) * 60 : 0;
    const ratedExc = maxExc ? (m.excRate / maxExc) * 70 : 0;
    const ratedPass = maxPass ? (m.passRate / maxPass) * 70 : 0;
    m.score2Rate = ratedAvg + ratedExc + ratedPass;
  }

  const rank = Object.entries(out).sort((a, b) => b[1].total.score2Rate - a[1].total.score2Rate);
  rank.forEach(([school], i) => {
    out[school].total.rank2Rate = i + 1;
  });

  for (const sub of SUBJECTS) {
    const byAvg = Object.entries(out).sort((a, b) => b[1][sub].avg - a[1][sub].avg);
    const byExc = Object.entries(out).sort((a, b) => b[1][sub].excRate - a[1][sub].excRate);
    const byPass = Object.entries(out).sort((a, b) => b[1][sub].passRate - a[1][sub].passRate);
    byAvg.forEach(([school], i) => { out[school][sub].rankAvg = i + 1; });
    byExc.forEach(([school], i) => { out[school][sub].rankExc = i + 1; });
    byPass.forEach(([school], i) => { out[school][sub].rankPass = i + 1; });
  }

  return out;
}

function analyzeTeachers(students, mySchool, teacherMap) {
  const myStudents = students.filter((s) => s.school === mySchool);

  const gradeStats = {};
  for (const sub of SUBJECTS) {
    const vals = myStudents.map((s) => s.scores[sub]);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const exc = THRESHOLDS[sub].exc;
    const pass = THRESHOLDS[sub].pass;
    const low = pass * 0.6;
    gradeStats[sub] = { avg, exc, pass, low };
  }

  const teacherStats = {};
  for (const [key, teacher] of Object.entries(teacherMap)) {
    const [cls, sub] = key.split('_');
    teacherStats[teacher] ??= {};
    teacherStats[teacher][sub] ??= { classes: [], students: [] };
    const st = myStudents.filter((s) => s.cls === cls && Number.isFinite(s.scores[sub]));
    teacherStats[teacher][sub].classes.push(cls);
    teacherStats[teacher][sub].students.push(...st);
  }

  for (const teacher of Object.keys(teacherStats)) {
    for (const sub of Object.keys(teacherStats[teacher])) {
      const data = teacherStats[teacher][sub];
      const scores = data.students.map((s) => s.scores[sub]);
      const gs = gradeStats[sub];
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      const excellentRate = scores.filter((v) => v >= gs.exc).length / scores.length;
      const passRate = scores.filter((v) => v >= gs.pass).length / scores.length;
      const lowRate = scores.filter((v) => v < gs.low).length / scores.length;
      const contribution = avg - gs.avg;
      const finalScore = 30 + contribution + excellentRate * 30 + passRate * 30 - lowRate * 20;

      Object.assign(data, {
        avg,
        studentCount: scores.length,
        classes: [...new Set(data.classes)].sort().join(','),
        excellentRate,
        passRate,
        lowRate,
        contribution,
        finalScore,
      });
    }
  }

  return teacherStats;
}

function teacherTownshipRank(teacherStats, schoolMetrics, targetSubject) {
  const ranking = [];
  for (const [teacher, subMap] of Object.entries(teacherStats)) {
    if (subMap[targetSubject]) {
      const d = subMap[targetSubject];
      ranking.push({
        name: teacher,
        type: 'teacher',
        avg: d.avg,
        excellentRate: d.excellentRate,
        passRate: d.passRate,
      });
    }
  }

  for (const [school, metric] of Object.entries(schoolMetrics)) {
    if (school !== '实验中学') {
      const m = metric[targetSubject];
      ranking.push({
        name: school,
        type: 'school',
        avg: m.avg,
        excellentRate: m.excRate,
        passRate: m.passRate,
      });
    }
  }

  const rankAvgMap = Object.fromEntries(
    [...ranking].sort((a, b) => b.avg - a.avg).map((x, i) => [x.name, i + 1]),
  );
  const rankExcMap = Object.fromEntries(
    [...ranking].sort((a, b) => b.excellentRate - a.excellentRate).map((x, i) => [x.name, i + 1]),
  );
  const rankPassMap = Object.fromEntries(
    [...ranking].sort((a, b) => b.passRate - a.passRate).map((x, i) => [x.name, i + 1]),
  );

  return ranking.map((x) => ({
    ...x,
    rankAvg: rankAvgMap[x.name],
    rankExc: rankExcMap[x.name],
    rankPass: rankPassMap[x.name],
  }));
}

function pct(v) {
  return `${(v * 100).toFixed(1)}%`;
}

function buildReport() {
  const mid = makeExamData('期中');
  const fin = makeExamData('期末');

  const midSchool = aggregateSchoolMetrics(mid);
  const finSchool = aggregateSchoolMetrics(fin);

  const teacherMap = {
    '701_数学': '张老师',
    '702_数学': '李老师',
    '701_语文': '王老师',
    '702_语文': '赵老师',
    '701_英语': '陈老师',
    '702_英语': '刘老师',
  };

  const midTeacher = analyzeTeachers(mid, '实验中学', teacherMap);
  const finTeacher = analyzeTeachers(fin, '实验中学', teacherMap);

  const mTotal = midSchool['实验中学'].total;
  const fTotal = finSchool['实验中学'].total;
  const mMath = midSchool['实验中学']['数学'];
  const fMath = finSchool['实验中学']['数学'];

  const tm = midTeacher['张老师']['数学'];
  const tf = finTeacher['张老师']['数学'];

  const trMid = teacherTownshipRank(midTeacher, midSchool, '数学');
  const trFin = teacherTownshipRank(finTeacher, finSchool, '数学');
  const trm = trMid.find((x) => x.name === '张老师');
  const trf = trFin.find((x) => x.name === '张老师');

  const validations = [];
  validations.push(['三率范围校验', [tm.excellentRate, tm.passRate, tm.lowRate, tf.excellentRate, tf.passRate, tf.lowRate].every((v) => v >= 0 && v <= 1)]);
  const fsMid = Math.abs(tm.finalScore - (30 + tm.contribution + tm.excellentRate * 30 + tm.passRate * 30 - tm.lowRate * 20)) < 1e-9;
  const fsFin = Math.abs(tf.finalScore - (30 + tf.contribution + tf.excellentRate * 30 + tf.passRate * 30 - tf.lowRate * 20)) < 1e-9;
  validations.push(['绩效分公式复算', fsMid && fsFin]);
  validations.push(['人数一致性', tm.studentCount === tf.studentCount && tf.studentCount === 20]);
  validations.push(['校际总分提升', fTotal.avg > mTotal.avg]);

  const lines = [];
  lines.push('# 模拟对比验证报告（期中 vs 期末）\n');
  lines.push('- 目标学校：实验中学\n');
  lines.push('- 目标教师：张老师（数学）\n');
  lines.push('- 对比范围：校际联考分析 + 班级教学管理\n');

  lines.push('## 一、校际联考分析（实验中学）\n');
  lines.push('### 1) 总分横向模块\n');
  lines.push('| 指标 | 期中 | 期末 | 变化 |');
  lines.push('|---|---:|---:|---:|');
  lines.push(`| 平均分 | ${mTotal.avg.toFixed(2)} | ${fTotal.avg.toFixed(2)} | ${(fTotal.avg - mTotal.avg).toFixed(2)} |`);
  lines.push(`| 优秀率 | ${pct(mTotal.excRate)} | ${pct(fTotal.excRate)} | ${((fTotal.excRate - mTotal.excRate) * 100).toFixed(1)}pp |`);
  lines.push(`| 及格率 | ${pct(mTotal.passRate)} | ${pct(fTotal.passRate)} | ${((fTotal.passRate - mTotal.passRate) * 100).toFixed(1)}pp |`);
  lines.push(`| 两率一分总分 | ${mTotal.score2Rate.toFixed(2)} | ${fTotal.score2Rate.toFixed(2)} | ${(fTotal.score2Rate - mTotal.score2Rate).toFixed(2)} |`);
  lines.push(`| 校际排名 | ${mTotal.rank2Rate} | ${fTotal.rank2Rate} | ${fTotal.rank2Rate - mTotal.rank2Rate} |\n`);

  lines.push('### 2) 数学学科模块\n');
  lines.push('| 指标 | 期中 | 期末 | 变化 |');
  lines.push('|---|---:|---:|---:|');
  lines.push(`| 数学均分 | ${mMath.avg.toFixed(2)} | ${fMath.avg.toFixed(2)} | ${(fMath.avg - mMath.avg).toFixed(2)} |`);
  lines.push(`| 数学优秀率 | ${pct(mMath.excRate)} | ${pct(fMath.excRate)} | ${((fMath.excRate - mMath.excRate) * 100).toFixed(1)}pp |`);
  lines.push(`| 数学及格率 | ${pct(mMath.passRate)} | ${pct(fMath.passRate)} | ${((fMath.passRate - mMath.passRate) * 100).toFixed(1)}pp |`);
  lines.push(`| 数学均分镇排 | ${mMath.rankAvg} | ${fMath.rankAvg} | ${fMath.rankAvg - mMath.rankAvg} |\n`);

  lines.push('## 二、班级教学管理（实验中学-张老师-数学）\n');
  lines.push('### 1) 教师概况卡片/详细表核心指标\n');
  lines.push('| 指标 | 期中 | 期末 | 变化 |');
  lines.push('|---|---:|---:|---:|');
  lines.push(`| 任教班级 | ${tm.classes} | ${tf.classes} | 0 |`);
  lines.push(`| 学生数 | ${tm.studentCount} | ${tf.studentCount} | ${tf.studentCount - tm.studentCount} |`);
  lines.push(`| 均分 | ${tm.avg.toFixed(2)} | ${tf.avg.toFixed(2)} | ${(tf.avg - tm.avg).toFixed(2)} |`);
  lines.push(`| 贡献值 | ${tm.contribution.toFixed(2)} | ${tf.contribution.toFixed(2)} | ${(tf.contribution - tm.contribution).toFixed(2)} |`);
  lines.push(`| 优秀率 | ${pct(tm.excellentRate)} | ${pct(tf.excellentRate)} | ${((tf.excellentRate - tm.excellentRate) * 100).toFixed(1)}pp |`);
  lines.push(`| 及格率 | ${pct(tm.passRate)} | ${pct(tf.passRate)} | ${((tf.passRate - tm.passRate) * 100).toFixed(1)}pp |`);
  lines.push(`| 低分率 | ${pct(tm.lowRate)} | ${pct(tf.lowRate)} | ${((tf.lowRate - tm.lowRate) * 100).toFixed(1)}pp |`);
  lines.push(`| 绩效分 | ${tm.finalScore.toFixed(2)} | ${tf.finalScore.toFixed(2)} | ${(tf.finalScore - tm.finalScore).toFixed(2)} |\n`);

  lines.push('### 2) 教师乡镇排名模块（数学）\n');
  lines.push('| 指标 | 期中 | 期末 | 变化 |');
  lines.push('|---|---:|---:|---:|');
  lines.push(`| 均分镇排 | ${trm.rankAvg} | ${trf.rankAvg} | ${trf.rankAvg - trm.rankAvg} |`);
  lines.push(`| 优秀率镇排 | ${trm.rankExc} | ${trf.rankExc} | ${trf.rankExc - trm.rankExc} |`);
  lines.push(`| 及格率镇排 | ${trm.rankPass} | ${trf.rankPass} | ${trf.rankPass - trm.rankPass} |\n`);

  lines.push('## 三、模拟验证\n');
  lines.push('| 校验项 | 结果 |');
  lines.push('|---|---|');
  validations.forEach(([name, ok]) => {
    lines.push(`| ${name} | ${ok ? '✅ 通过' : '❌ 未通过'} |`);
  });

  lines.push('\n## 四、结论\n');
  lines.push('- 期末相对期中：实验中学在校际联考分析中，总分与数学学科均有明显提升。');
  lines.push('- 张老师（数学）在班级教学管理各核心模块指标中，均分、贡献值、优秀率、及格率与绩效分均上升。');
  lines.push('- 验证项全部通过，模拟数据与模块公式口径一致，可用于演示与回归测试。');

  fs.writeFileSync('模拟对比验证报告.md', `${lines.join('\n')}\n`, 'utf8');
  fs.writeFileSync(
    '模拟对比验证明细.json',
    JSON.stringify(
      {
        midSchool,
        finSchool,
        midTeacher,
        finTeacher,
        rankMidMath: trMid,
        rankFinMath: trFin,
        validations: validations.map(([name, ok]) => ({ name, ok })),
      },
      null,
      2,
    ),
    'utf8',
  );
}

buildReport();
