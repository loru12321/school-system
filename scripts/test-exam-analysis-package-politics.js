// 九年级中考政治「只展示、不影响正式口径」的防误读契约测试。
//
// 背景：中考不考政治，包内政治只取最新中考整理表中已有的政治成绩，
// 二模仅作核对，不回填、不补入学生或分数。
// 风险不在算错，而在**误读**：学生明细/教师分析这两份文件常被单独转发给班主任
// 和科任老师，收到的人看不到包外的「阅读说明」，如果封面不写清楚，很容易把政治
// 当成中考科目、或拿政治名次和其他学科名次直接相比。
//
// 这里锁住三件事：
//   1. 政治绝不进 SUBJECTS（从源头隔离，而不是事后过滤）；
//   2. 凡是带政治列的工作簿，封面都必须带政治提醒；
//   3. 包内阅读说明必须有独立的政治段落，且只在真的匹配到人时出现。
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const packageSource = fs.readFileSync(path.join(root, 'public/assets/js/exam-analysis-package-runtime.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'public/assets/js/app.js'), 'utf8');

// ── 1. 政治从源头隔离，不进 SUBJECTS ─────────────────────────────────────────
// 只要政治不在 SUBJECTS 里，五科总/两率一分/指标生/高中上线这些正式口径就读不到它。
// 这是整个设计的根，比在每个计算点各加一次过滤可靠。
assert.ok(/isConfiguredDisplayOnlySubject/.test(appSource),
    'app.js must keep the display-only subject helper that keeps 政治 out of SUBJECTS');
assert.ok(/展示科目不进入 SUBJECTS/.test(appSource),
    'the display-only rationale comment must stay so the isolation is not refactored away');

// 正式口径一律显式剔除政治。
assert.ok(/filter\(\(subject\) => subject !== '政治'\)/.test(packageSource),
    'official subject lists must explicitly exclude 政治');
assert.ok(/function getGrade9LatestPoliticsRows\(/.test(packageSource),
    'package politics display rows must come from the current latest Zhongkao sheet');
assert.ok(!/getGrade9SecondMockPoliticsRows/.test(packageSource),
    'package must never merge second-mock politics into Zhongkao rows');

// ── 2. 带政治列的工作簿，封面必须有提醒 ──────────────────────────────────────
assert.ok(/function buildPoliticsCoverNotices\(/.test(packageSource),
    'the package runtime must keep the politics cover-notice builder');

// 提醒必须显式写明「参考二模数据」、人工整理源和「不计入正式口径」。
assert.ok(/GRADE9_ZHONGKAO_POLITICS_LABEL = '政治（参考二模数据）'/.test(packageSource),
    'the politics label must visibly state that it references second-mock data');
assert.ok(/参考二模数据（以本次中考整理表内人工整理的政治列为准）/.test(packageSource),
    'the politics notice must state that the curated Zhongkao column, not the raw mock sheet, is authoritative');
assert.ok(/原始二模不会自动覆盖该列/.test(packageSource),
    'the politics notice must state that raw second-mock data never overwrites the curated column');
assert.ok(/整理表外学生不补入/.test(packageSource),
    'the politics notice must state that students outside the curated sheet are never backfilled');
assert.ok(/不计入五科总分、两率一分、指标生、高分段与高中上线率/.test(packageSource),
    'the politics notice must enumerate the official metrics 政治 stays out of');

// 只有当政治真的出现在该工作簿的科目里才提醒，避免在不含政治的文件上乱写。
assert.ok(/subjects\.includes\('政治'\)/.test(packageSource),
    'the notice must only be emitted for workbooks that actually carry a 政治 column');

// 三份会出现政治的工作簿（原始成绩、学生明细、教师分析）都要挂上提醒。
const noticeWirings = packageSource.match(/notices: buildPoliticsCoverNotices\(/g) || [];
assert.ok(noticeWirings.length >= 3,
    `all politics-carrying workbooks must wire the notice; found ${noticeWirings.length}`);

// 封面构造器必须真的把 notices 渲染出来，否则上面的接线是空转。
assert.ok(/options\.notices/.test(packageSource) && /'特别提醒'/.test(packageSource),
    'buildCoverRows must render the notices block onto the cover sheet');

// ── 3. 阅读说明里的政治段落 ──────────────────────────────────────────────────
assert.ok(/【政治备注：参考二模数据】/.test(packageSource),
    'the package readme must carry a dedicated visible second-mock reference note');
assert.ok(/showPolitics \?/.test(packageSource),
    'the readme politics section must be conditional on politics actually being matched');

// 匹配人数取自嵌套的 politics.politics.matched；写错一层会静默变成「不显示」。
assert.ok(/politics\?\.politics\?\.matched/.test(packageSource),
    'the readme must read the matched count from the nested politics payload');

// 五科总的措辞不能松动：这是收件人判断「政治算没算进去」的唯一依据。
assert.ok(/「五科总」始终不含政治/.test(packageSource),
    'the readme must state explicitly that 五科总 never includes 政治');

// 压缩包教师乡镇表也必须等待政治整理表学校聚合完成；否则网页已经显示外校学校行，
// 但刚下载的包仍会只剩本校政治教师，形成两套口径。
assert.ok(/Grade9PoliticsReferenceRuntime\?\.ensureSummary/.test(packageSource),
    'package teacher ranking warmup must await the grade-9 politics school reference');
assert.ok(/calculateTeacherTownshipRanking\(\{ force: true, teacherMetricScope: 'admin' \}\)/.test(packageSource),
    'package must rebuild teacher township rankings after politics school reference warmup');

// ── 4. 不要再出现「与系统页面不一致」这种自伤措辞 ────────────────────────────
// 对外材料上写「可能和系统不一致」会让收件人怀疑整份数据；应改为标明数据截止时间。
assert.ok(/数据截至/.test(packageSource),
    'the readme should state the data cutoff instead of undermining its own numbers');
assert.ok(!/如与系统页面显示不一致，请以系统页面为准/.test(packageSource),
    'the self-undermining wording must stay out of the package readme');

// ── 5. 网页端个人报告的政治脚注 ──────────────────────────────────────────────
// 个人报告会被打印/导出 PDF 发给家长，纸上没有 tooltip。学生明细和教师分析用
// title 提示够用（都是交互表格），但个人报告必须是可见文本，否则政治那一行带着
// 班排/校排/镇排出现在家长手里，没有任何说明。
// 脚注 HTML 的构造在 app.js（report-render-runtime.js 贴着体积预算，且文案口径
// 归 app.js 统一），报告层只负责调用并注入。所以这里跨两个文件断言。
//
// 刻意不写死实现细节（变量名、整行代码、参数顺序）：那样的正则会随重构过时，
// 变成假红。渲染层面的回归由 smoke:report-footnote:local 用真实浏览器覆盖。
const reportSource = fs.readFileSync(path.join(root, 'public/assets/js/report-render-runtime.js'), 'utf8');

// 构造侧：读口径文案 + 产出可见正文元素（而不是 title/伪元素，纸面上看不见）。
assert.ok(/function buildDisplayOnlySubjectFootnote/.test(appSource),
    'app.js must provide the display-only subject footnote builder');
assert.ok(/window\.buildDisplayOnlySubjectFootnote\s*=/.test(appSource),
    'the footnote builder must be exposed on window for the report runtime');
// 只取 builder 自己的函数体：从声明处切到下一个顶层 function，否则会把后面
// 别的函数里的同名调用也算进来，让"builder 不读口径文案"这种变异漏网。
const builderStart = appSource.indexOf('function buildDisplayOnlySubjectFootnote');
assert.ok(builderStart >= 0, 'the footnote builder must exist in app.js');
const afterBuilder = appSource.slice(builderStart + 1);
const nextTopLevelFn = afterBuilder.search(/\n(?:function |window\.)/);
const builderBody = nextTopLevelFn >= 0 ? afterBuilder.slice(0, nextTopLevelFn) : afterBuilder;
assert.ok(/getConfiguredDisplaySubjectNotice/.test(builderBody),
    'the footnote builder must read the shared display-only subject notice');
assert.ok(/report-display-note/.test(builderBody),
    'the footnote must render as a visible element carrying the .report-display-note class');

// 报告侧：必须真的调用并注入，不能只声明不使用（否则脚注是死代码）。
assert.ok(/buildDisplayOnlySubjectFootnote\(/.test(reportSource),
    'the student report must call the footnote builder');
const footnoteRefs = (reportSource.match(/displayOnlyFootnote/g) || []).length;
assert.ok(footnoteRefs >= 2,
    'the footnote must be both built and injected in the report template');
assert.ok(/<tbody>\$\{tableRows\}<\/tbody>[\s\S]{0,240}\$\{displayOnlyFootnote\}/.test(reportSource),
    'the footnote must be injected right after the subject table so printed reports carry it');

// 只在该学生确实有该科成绩时才出现，否则每份报告都挂一句无关脚注。
// 绑定到传给 builder 的判定回调，而不是表格行循环里的同名判断。
assert.ok(/buildDisplayOnlySubjectFootnote\([\s\S]{0,160}?stuScores\[[^\]]+\]\s*!==\s*undefined/.test(reportSource),
    'the footnote must only consider subjects the student actually has scores for');

// 报告样式必须真的定义该类，否则脚注拿不到字号/间距，打印出来是裸文本。
assert.ok(/\.report-display-note\s*\{/.test(reportSource),
    'the report must define .report-display-note styling');
// 分页保护：口径说明被截成两半，家长手里就是半句话。
assert.ok(/\.report-display-note\s*\{[^}]*break-inside\s*:\s*avoid/.test(reportSource),
    'the footnote must set break-inside:avoid so print does not split it');

console.log('exam-analysis-package politics display contract passed');
