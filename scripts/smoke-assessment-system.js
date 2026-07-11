const { chromium } = require('playwright');

const BASE_URL = String(process.env.ASSESSMENT_SMOKE_URL || 'https://loru12321.github.io/teacher-assessment-system/').replace(/\/+$/, '');
const PASSWORD = process.env.ASSESSMENT_SMOKE_PASS || '123456';

const roles = [
  {
    role: 'admin',
    account: process.env.ASSESSMENT_ADMIN_USER || 'admin',
    modules: ['系统首页', '导入与分发', '组长填报', '管理员汇总', '教师个人端', '系统管理与方案'],
    submodules: {
      '导入与分发': ['导入模板', '项目分发', '人员权限'],
      '管理员汇总': ['汇总排名', 'system同步对账', '筛选条件'],
      '教师个人端': ['个人概览', '项目明细'],
      '系统管理与方案': ['系统状态', '教师办法', '班级办法', '角色权限', '年级项目', '管理操作']
    },
    hidden: []
  },
  {
    role: 'leader',
    account: process.env.ASSESSMENT_LEADER_USER || 'g6_leader_1',
    modules: ['组长填报', '系统管理与方案'],
    submodules: {
      '系统管理与方案': ['系统状态', '教师办法', '班级办法', '角色权限', '年级项目', '管理操作']
    },
    hidden: ['系统首页', '导入与分发', '管理员汇总', '教师个人端']
  },
  {
    role: 'teacher',
    account: process.env.ASSESSMENT_TEACHER_USER || 'teacher_hhui8o',
    modules: ['教师个人端', '系统管理与方案'],
    submodules: {
      '教师个人端': ['个人概览', '项目明细'],
      '系统管理与方案': ['系统状态', '教师办法', '班级办法', '角色权限', '年级项目', '管理操作']
    },
    hidden: ['系统首页', '导入与分发', '组长填报', '管理员汇总']
  }
];

async function login(page, account) {
  await page.goto(`${BASE_URL}/sign-in.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('input[type="text"]').fill(account);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await Promise.all([
    page.waitForURL(/app\.html/, { timeout: 30000, waitUntil: 'domcontentloaded' }),
    page.locator('button[type="submit"]').click()
  ]);
  await page.waitForFunction(() => document.body.innerText.includes('考核管理系统'), null, { timeout: 15000 });
  await page.waitForFunction(() => {
    const app = document.getElementById('app');
    return app && !app.hasAttribute('v-cloak') && document.querySelectorAll('nav button').length > 0;
  }, null, { timeout: 20000 });
  await page.waitForTimeout(1000);
  await page.waitForFunction(() => !document.body.innerText.includes('加载用户信息...'), null, { timeout: 20000 });
  await page.waitForFunction(() => !document.body.innerText.includes('初始化视图...'), null, { timeout: 20000 });
  await page.waitForTimeout(300);
}

async function inspectRole(browser, config) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error'
      && !/favicon/i.test(message.text())
      && !/Failed to load resource: the server responded with a status of 404/i.test(message.text())) errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));

  await login(page, config.account);
  const findVisibleButton = async (label, selector = 'button') => {
    const candidates = page.locator(selector).filter({ hasText: label });
    const count = await candidates.count();
    for (let index = 0; index < count; index += 1) {
      const candidate = candidates.nth(index);
      if (await candidate.isVisible().catch(() => false)) return candidate;
    }
    return null;
  };
  const results = [];
  for (const label of config.modules) {
    const button = await findVisibleButton(label, 'nav button');
    if (!button) {
      results.push({ label, ok: false, reason: 'navigation hidden' });
      continue;
    }
    await button.click();
    await page.waitForTimeout(250);
    const active = await button.evaluate((node) => node.classList.contains('bg-china-red'));
    const submoduleResults = [];
    for (const subLabel of config.submodules?.[label] || []) {
      const subButton = await findVisibleButton(subLabel);
      if (!subButton) {
        submoduleResults.push({ label: subLabel, ok: false, reason: 'submodule hidden' });
        continue;
      }
      await subButton.click();
      await page.waitForTimeout(120);
      submoduleResults.push({
        label: subLabel,
        ok: await subButton.evaluate((node) => node.classList.contains('bg-china-red'))
      });
    }
    results.push({ label, ok: active && submoduleResults.every((item) => item.ok), submodules: submoduleResults });
  }

  const hiddenChecks = {};
  for (const label of config.hidden) {
    hiddenChecks[label] = !(await findVisibleButton(label, 'nav button'));
  }
  const state = await page.evaluate(() => ({
    selectedAcademicYear: document.querySelector('select')?.value || '',
    bodyTextLength: document.body.innerText.length,
    bodySample: document.body.innerText.slice(0, 500),
    hasAssessmentProjects: document.body.innerText.includes('教师成绩考核') && document.body.innerText.includes('班级考核')
  }));
  await context.close();
  return {
    role: config.role,
    account: config.account,
    ok: results.every((item) => item.ok) && Object.values(hiddenChecks).every(Boolean) && errors.length === 0,
    modules: results,
    hiddenChecks,
    state,
    errors
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const role of roles) {
      process.stderr.write(`[assessment-smoke] checking ${role.role}\n`);
      results.push(await inspectRole(browser, role));
    }
  } finally {
    await browser.close();
  }
  const summary = { ok: results.every((item) => item.ok), url: BASE_URL, results };
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exit(1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
