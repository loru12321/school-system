// 九年级中考政治「只展示、不影响正式口径」的防误读契约测试。
//
// 背景：中考不考政治，包内政治取同届二模成绩，只做单科展示与政治教师分析。
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

// ── 2. 带政治列的工作簿，封面必须有提醒 ──────────────────────────────────────
assert.ok(/function buildPoliticsCoverNotices\(/.test(packageSource),
    'the package runtime must keep the politics cover-notice builder');

// 提醒必须说清「不是同一场考试」和「不计入正式口径」这两点。
assert.ok(/不是同一场考试|排名不可直接互比/.test(packageSource),
    'the politics notice must warn that 政治 comes from a different exam');
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
assert.ok(/【政治怎么看】/.test(packageSource),
    'the package readme must carry a dedicated 政治 section');
assert.ok(/showPolitics \?/.test(packageSource),
    'the readme politics section must be conditional on politics actually being matched');

// 匹配人数取自嵌套的 politics.politics.matched；写错一层会静默变成「不显示」。
assert.ok(/politics\?\.politics\?\.matched/.test(packageSource),
    'the readme must read the matched count from the nested politics payload');

// 五科总的措辞不能松动：这是收件人判断「政治算没算进去」的唯一依据。
assert.ok(/「五科总」始终不含政治/.test(packageSource),
    'the readme must state explicitly that 五科总 never includes 政治');

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
const reportSource = fs.readFileSync(path.join(root, 'public/assets/js/report-render-runtime.js'), 'utf8');

assert.ok(/getConfiguredDisplaySubjectNotice/.test(reportSource),
    'the student report must read the display-only subject notice');
assert.ok(/displayOnlyFootnote/.test(reportSource),
    'the student report must build a visible footnote for display-only subjects');

// 必须真的注入到报告 HTML 里，不能只声明不使用（否则脚注是死代码）。
// 注意不能只搜变量名：声明本身就含变量名，删掉注入点也照样匹配。
const footnoteDeclarations = (reportSource.match(/const displayOnlyFootnote\s*=/g) || []).length;
const footnoteReferences = (reportSource.match(/displayOnlyFootnote/g) || []).length;
assert.strictEqual(footnoteDeclarations, 1,
    'the report should build the display-only footnote exactly once');
assert.ok(footnoteReferences > footnoteDeclarations + 1,
    'the footnote must be referenced in the report template, not just declared');
assert.ok(/<tbody>\$\{tableRows\}<\/tbody>[\s\S]{0,200}displayOnlyFootnote/.test(reportSource),
    'the footnote must be injected right after the subject table so printed reports carry it');

// 只在该学生确实显示了政治时才出现，否则每份报告都挂一句无关脚注。
// 绑定到脚注自己的过滤链上：表格行循环里也有同样的判断，泛匹配会漏掉恒真变异。
assert.ok(/reportSubjectsForRank[\s\S]{0,120}\.filter\(\(sub\) => stuScores\[sub\] !== undefined\)/.test(reportSource),
    'the footnote must only consider subjects the student actually has scores for');

console.log('exam-analysis-package politics display contract passed');
