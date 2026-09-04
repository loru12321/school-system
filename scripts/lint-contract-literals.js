// 契约测试“锁源码整行”体检：统计 scripts/test-*.js 里用 includes('...整行代码...') 断言源码的数量。
// 2026-09-03/04 一天内有 6 条这类断言因为无关重构（const→let、口径搬进表、增加一个参数）假红。
// 本脚本只报告、不判失败（历史存量太大）；但**新增**字面量断言超过基线会失败，形成棘轮。
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const scriptsDir = path.join(root, 'scripts');
// 视为“锁整行源码”的特征：includes/indexOf 的字面量里带赋值、分号结尾或函数调用括号且长度较长。
const LITERAL_PATTERN = /\.(?:includes|indexOf)\((['"`])((?:(?!\1)[^\\]|\\.){40,})\1\)/g;
const looksLikeSourceLine = (text) => /[=;{}()]/.test(text) && !/^[一-龥\s，。、：；（）【】“”]+$/.test(text);

const BASELINE_FILE = path.join(root, 'docs', 'optimization', 'contract-literal-baseline.json');
const baseline = fs.existsSync(BASELINE_FILE) ? JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8')) : null;

const report = {};
let total = 0;
fs.readdirSync(scriptsDir)
    .filter((name) => /^test-.*\.js$/.test(name))
    .forEach((name) => {
        const source = fs.readFileSync(path.join(scriptsDir, name), 'utf8');
        let count = 0;
        for (const match of source.matchAll(LITERAL_PATTERN)) {
            if (looksLikeSourceLine(match[2])) count += 1;
        }
        if (count) report[name] = count;
        total += count;
    });

const top = Object.entries(report).sort((a, b) => b[1] - a[1]).slice(0, 10);
console.log(`[contract-literal-lint] ${total} source-line literal assertions across ${Object.keys(report).length} test files`);
top.forEach(([name, count]) => console.log(`  ${String(count).padStart(4)}  ${name}`));

if (process.env.CONTRACT_LITERAL_WRITE_BASELINE === '1') {
    fs.mkdirSync(path.dirname(BASELINE_FILE), { recursive: true });
    fs.writeFileSync(BASELINE_FILE, JSON.stringify({ total, generatedAt: new Date().toISOString(), files: report }, null, 2) + '\n');
    console.log(`[contract-literal-lint] baseline written: ${total}`);
} else if (baseline && Number.isFinite(Number(baseline.total)) && total > Number(baseline.total)) {
    console.error(`[contract-literal-lint] ${total} > baseline ${baseline.total}: new contract tests must assert behaviour fragments/regex, not whole source lines. If a literal is unavoidable, regenerate the baseline with CONTRACT_LITERAL_WRITE_BASELINE=1 and explain why in the commit.`);
    process.exit(1);
} else {
    console.log(`[contract-literal-lint] within baseline (${baseline ? baseline.total : 'none'})`);
}
