const { chromium } = require('playwright');

const URL = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/';
const USER = process.env.SMOKE_USER || 'admin';
const PASS = process.env.SMOKE_PASS || 'admin123';
const TARGETS = (process.env.PROFILE_MODULES || 'summary,correlation-analysis,report-generator,freshman-simulator,student-overview')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function login(page) {
  await page.goto(URL, { waitUntil: 'commit', timeout: 90000 });
  await page.waitForFunction(() => !!document.getElementById('login-overlay') || !!document.getElementById('app'), null, { timeout: 90000 });
  await wait(800);
  const state = await page.evaluate(() => {
    const overlay = document.getElementById('login-overlay');
    const app = document.getElementById('app');
    return {
      overlayHidden: !overlay || getComputedStyle(overlay).display === 'none',
      appVisible: !!app && getComputedStyle(app).display !== 'none',
      authState: String(document.body?.dataset?.authState || ''),
      sessionUser: !!sessionStorage.getItem('CURRENT_USER')
    };
  });
  if (!(state.overlayHidden && (state.appVisible || state.authState === 'logged_in' || state.sessionUser))) {
    await page.evaluate(() => window.Auth?.openLoginPortalModal?.('school')).catch(() => {});
    await page.waitForSelector('#login-user', { state: 'visible', timeout: 30000 });
    await page.fill('#login-user', USER);
    await page.fill('#login-pass', PASS);
    await page.click('#login-submit-button');
  }
  await page.waitForFunction(() => {
    const overlay = document.getElementById('login-overlay');
    const app = document.getElementById('app');
    const mask = document.getElementById('mode-mask');
    const overlayHidden = !overlay || getComputedStyle(overlay).display === 'none';
    const appVisible = !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden');
    const maskVisible = !!mask && getComputedStyle(mask).display !== 'none';
    return overlayHidden && (appVisible || maskVisible || document.body?.dataset?.authState === 'logged_in');
  }, null, { timeout: 90000 });
  await ensureCohort(page);
  await page.waitForFunction(() => {
    const app = document.getElementById('app');
    return !!app && getComputedStyle(app).display !== 'none' && !app.classList.contains('hidden') && Array.isArray(window.RAW_DATA) && window.RAW_DATA.length > 0;
  }, null, { timeout: 90000 });
}

async function ensureCohort(page) {
  const visible = await page.evaluate(() => {
    const mask = document.getElementById('mode-mask');
    return !!mask && getComputedStyle(mask).display !== 'none';
  }).catch(() => false);
  if (!visible) return;
  await page.evaluate(async () => {
    const input = document.getElementById('entry-cohort-year');
    if (input && !input.value) input.value = localStorage.getItem('CURRENT_COHORT_ID') || '2022';
    if (typeof window.enterCohortFromMask === 'function') await window.enterCohortFromMask();
  });
  await wait(1000);
}

async function installProfiler(page) {
  await page.evaluate(() => {
    const names = [
      'switchTab',
      'runModuleTabEnter',
      'ensureTownSubmoduleCompareRuntimeLoaded',
      'ensureTownSubmoduleCompareUIs',
      'renderTownSubmoduleMultiPeriodComparison',
      'openTownSubmoduleCompareDialog',
      'ensureSchoolProfileRuntimeLoaded',
      'showSchoolProfile',
      'ensureTeacherAnalysisMainRuntimeLoaded',
      'renderCorrelationAnalysis',
      'calculateCorrelationPearson',
      'updateCorrelationSchoolSelect',
      'ensureReportRenderRuntimeLoaded',
      'ensureStudentCompareRuntimeLoaded',
      'ensureHistoryCompareRuntimeLoaded',
      'doQuery',
      'renderSingleReportCardHTML',
      'getComparisonStudentView',
      'getComparisonStudentList',
      'getStudentExamHistory',
      'findPreviousRecord',
      'renderRadarChart',
      'renderVarianceChart',
      'analyzeStrengthsAndWeaknesses',
      'ensureFreshmanExamRuntimeLoaded',
      'ensureXlsxVendorLoaded',
      'ensureChartVendorLoaded',
      'FB_loadData',
      'FB_runDivision',
      'FB_generateSingleScheme',
      'FB_applyScheme',
      'FB_renderDashboard',
      'FB_renderBalanceTable',
      'ensureTeachingManagementRuntimeLoaded',
      'renderMultiPeriodComparison',
      'renderStudentOverview',
      'smScheduleStudentOverviewRender',
      'smBuildOverviewModel',
      'updateStudentSchoolSelect',
      'updateStudentCompareExamSelects',
      'updateReportCompareExamSelects',
      'updateMarginalSchoolSelect',
      'updateMpSchoolSelect',
      'updateMpClassSelect',
      'generateMarginalTickets',
      'MP_analyzeConversion',
      'updateSeatAdjSelects',
      'updateConstraintWidgetsContext',
      'generateSeatSuggestions',
      'renderSeatGrid',
      'updateSubjectBalanceSelects',
      'updatePotentialSchoolSelect',
      'updateSegmentSelects',
      'updateClassSelect',
      'onStudentComparePeriodCountChange',
      'updateProgressMultiExamSelects',
      'onProgressComparePeriodCountChange'
    ];
    window.__PROD_PROFILE = window.__PROD_PROFILE || { calls: {}, longTasks: [], events: [] };
    const record = (name, duration, status) => {
      const calls = window.__PROD_PROFILE.calls;
      const item = calls[name] || (calls[name] = { count: 0, total: 0, max: 0, errors: 0, samples: [] });
      item.count += 1;
      item.total += duration;
      item.max = Math.max(item.max, duration);
      if (status === 'error') item.errors += 1;
      item.samples.push(Number(duration.toFixed(2)));
      if (item.samples.length > 10) item.samples.shift();
    };
    const wrapOne = (name) => {
      const fn = window[name];
      if (typeof fn !== 'function' || fn.__profileWrapped) return;
      const wrapped = function (...args) {
        const started = performance.now();
        try {
          const result = fn.apply(this, args);
          if (result && typeof result.then === 'function') {
            return result.then(
              (value) => {
                record(name, performance.now() - started, 'ok');
                return value;
              },
              (error) => {
                record(name, performance.now() - started, 'error');
                throw error;
              }
            );
          }
          record(name, performance.now() - started, 'ok');
          return result;
        } catch (error) {
          record(name, performance.now() - started, 'error');
          throw error;
        }
      };
      Object.defineProperty(wrapped, '__profileWrapped', { value: true });
      Object.defineProperty(wrapped, '__profileOriginal', { value: fn });
      window[name] = wrapped;
    };
    window.__installProdProfileWraps = () => names.forEach(wrapOne);
    window.__installProdProfileWraps();
    if (!window.__prodProfileInterval) {
      window.__prodProfileInterval = window.setInterval(window.__installProdProfileWraps, 100);
    }
    if (!window.__prodProfileLongTaskObserver && 'PerformanceObserver' in window) {
      try {
        window.__prodProfileLongTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            window.__PROD_PROFILE.longTasks.push({
              name: entry.name,
              duration: Number(entry.duration.toFixed(2)),
              start: Number(entry.startTime.toFixed(2))
            });
          });
        });
        window.__prodProfileLongTaskObserver.observe({ type: 'longtask', buffered: true });
      } catch (_) {}
    }
  });
}

async function switchModule(page, id) {
  await page.evaluate((moduleId) => window.switchTab?.(moduleId), id);
  await page.waitForTimeout(800);
  await page.waitForFunction((moduleId) => {
    const section = document.getElementById(moduleId);
    return !!section && section.classList.contains('active');
  }, id, { timeout: 30000 }).catch(() => {});
  await installProfiler(page);
}

async function profileSummary(page) {
  await page.evaluate(async () => {
    await window.ensureTownSubmoduleCompareRuntimeLoaded?.();
    await window.ensureTownSubmoduleCompareUIs?.();
    await window.ensureSchoolProfileRuntimeLoaded?.();
    const school = Object.keys(window.SCHOOLS || {})[0] || '';
    const examIds = Object.keys(window.COHORT_DB?.exams || {}).slice(0, 2);
    if (school && examIds.length >= 2) {
      window.renderTownSubmoduleMultiPeriodComparison?.('summary', school, examIds, 2);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
}

async function profileCorrelation(page) {
  await page.evaluate(async () => {
    await window.ensureTeacherAnalysisMainRuntimeLoaded?.();
    window.updateCorrelationSchoolSelect?.();
    const select = document.getElementById('corrSchoolSelect');
    if (select && !select.value) select.value = 'ALL';
    await Promise.resolve(window.runModuleTabEnter?.({ id: 'correlation-analysis' }) || window.renderCorrelationAnalysis?.());
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
}

async function profileReport(page) {
  await page.evaluate(async () => {
    window.updateSchoolSelect?.();
    window.updateReportCompareExamSelects?.();
    const schoolSelect = document.getElementById('sel-school');
    const classSelect = document.getElementById('sel-class');
    const nameInput = document.getElementById('inp-name');
    const schoolOptions = Array.from(schoolSelect?.options || []).map((o) => o.value).filter(Boolean);
    const rows = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
    const sameSchool = (left, right) => {
      const leftName = String(left || '').trim();
      const rightName = String(right || '').trim();
      if (!leftName || !rightName) return false;
      if (window.PermissionPolicy && typeof window.PermissionPolicy.sameSchoolName === 'function') {
        return window.PermissionPolicy.sameSchoolName(leftName, rightName);
      }
      if (typeof window.areSchoolNamesEquivalent === 'function') {
        return window.areSchoolNamesEquivalent(leftName, rightName);
      }
      return leftName === rightName;
    };
    const school = schoolOptions.find((name) => rows.some((item) => sameSchool(item?.school, name)))
      || schoolOptions[0]
      || '';
    const student = school
      ? rows.find((item) => item?.name && sameSchool(item?.school, school))
      : rows.find((item) => item?.name);
    if (!student) throw new Error('sample student not found');
    schoolSelect.value = school;
    window.updateClassSelect?.();
    await new Promise((resolve) => setTimeout(resolve, 120));
    classSelect.value = student.class || '';
    nameInput.value = student.name || '';
    await window.doQuery();
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
}

async function profileFreshman(page) {
  await page.evaluate(async () => {
    await window.ensureFreshmanExamRuntimeLoaded?.();
    await window.ensureXlsxVendorLoaded?.();
    await window.ensureChartVendorLoaded?.();
    const rows = Array.from({ length: 24 }, (_, index) => ({
      姓名: `计时新生${String(index + 1).padStart(2, '0')}`,
      性别: index % 2 === 0 ? '男' : '女',
      总分: 612 - (index * 5),
      身高: 150 + (index % 8) * 3,
      视力: 4.6 + ((index % 4) * 0.1),
      难管: index % 11 === 0 ? '是' : '',
      备注: ''
    }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.json_to_sheet(rows), '学生名单');
    const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const file = new File([bytes], 'profile-freshman.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    window.FB_loadData({ files: [file], value: '' });
    await new Promise((resolve) => setTimeout(resolve, 500));
    const classInput = document.getElementById('fb_cls_num');
    if (classInput) classInput.value = '4';
    window.FB_runDivision();
    await new Promise((resolve) => setTimeout(resolve, 800));
  });
}

async function profileStudentOverview(page) {
  await page.evaluate(async () => {
    await Promise.resolve(window.ensureTeachingManagementRuntimeLoaded?.()).catch(() => null);
    window.updateStudentSchoolSelect?.();
    window.updateStudentCompareExamSelects?.();
    window.updateReportCompareExamSelects?.();
    window.updateMarginalSchoolSelect?.();
    window.updateSubjectBalanceSelects?.();
    window.updatePotentialSchoolSelect?.();
    window.updateSegmentSelects?.();
    window.updateCorrelationSchoolSelect?.();
    window.updateClassSelect?.();
    window.onStudentComparePeriodCountChange?.();
    window.updateProgressMultiExamSelects?.();
    window.onProgressComparePeriodCountChange?.();
    await Promise.resolve(window.renderMultiPeriodComparison?.()).catch(() => null);
    window.renderStudentOverview?.();
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
}

async function profileMarginalPush(page) {
  await page.evaluate(async () => {
    if (typeof window.updateMpSchoolSelect === 'function') window.updateMpSchoolSelect();
    const schoolSelect = document.getElementById('mpSchoolSelect');
    const classSelect = document.getElementById('mpClassSelect');
    const subjectSelect = document.getElementById('mpSubjectSelect');
    const gapInput = document.getElementById('mpGap');
    const school = Array.from(schoolSelect?.options || [])
      .map((option) => option.value)
      .find(Boolean);
    if (schoolSelect && school) schoolSelect.value = school;
    if (typeof window.updateMpClassSelect === 'function') window.updateMpClassSelect();
    if (classSelect) classSelect.value = '';
    if (subjectSelect) subjectSelect.value = 'ALL';
    if (gapInput) gapInput.value = '5';
    await Promise.resolve(window.generateMarginalTickets?.());
    await new Promise((resolve) => setTimeout(resolve, 300));
  });
}

async function profileSeatAdjustment(page) {
  await page.evaluate(async () => {
    const schoolSelect = document.getElementById('seatAdjSchoolSelect');
    const classSelect = document.getElementById('seatAdjClassSelect');
    const groupsInput = document.getElementById('seatAdjGroups');
    const colsInput = document.getElementById('seatAdjCols');
    const strategySelect = document.getElementById('seatAdjStrategy');
    window.updateSeatAdjSelects?.();
    const schools = Array.from(schoolSelect?.options || []).map((option) => option.value).filter(Boolean);
    for (const school of schools) {
      if (schoolSelect) schoolSelect.value = school;
      window.updateSeatAdjSelects?.();
      const classes = Array.from(classSelect?.options || []).map((option) => option.value).filter(Boolean);
      for (const className of classes) {
        if (classSelect) classSelect.value = className;
        window.updateConstraintWidgetsContext?.('adj');
        if (groupsInput) groupsInput.value = '2';
        if (colsInput) colsInput.value = '4';
        if (strategySelect) strategySelect.value = 'conversion';
        const result = window.generateSeatSuggestions?.();
        if (Number(result?.count || 0) > 0) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          return;
        }
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await login(page);
  await installProfiler(page);
  const perModule = [];
  const actions = {
    summary: profileSummary,
    'correlation-analysis': profileCorrelation,
    'report-generator': profileReport,
    'freshman-simulator': profileFreshman,
    'student-overview': profileStudentOverview,
    'marginal-push': profileMarginalPush,
    'seat-adjustment': profileSeatAdjustment
  };
  for (const id of TARGETS) {
    const started = Date.now();
    try {
      await switchModule(page, id);
      await actions[id]?.(page);
      perModule.push({ id, durationMs: Date.now() - started, ok: true });
    } catch (error) {
      perModule.push({ id, durationMs: Date.now() - started, ok: false, error: error?.message || String(error) });
    }
  }
  const profile = await page.evaluate(() => {
    clearInterval(window.__prodProfileInterval);
    const calls = Object.entries(window.__PROD_PROFILE.calls)
      .map(([name, item]) => ({
        name,
        count: item.count,
        totalMs: Number(item.total.toFixed(2)),
        avgMs: Number((item.total / Math.max(1, item.count)).toFixed(2)),
        maxMs: Number(item.max.toFixed(2)),
        errors: item.errors,
        samples: item.samples
      }))
      .sort((a, b) => b.totalMs - a.totalMs);
    return {
      calls,
      longTasks: window.__PROD_PROFILE.longTasks.slice(-40)
    };
  });
  await browser.close();
  console.log(JSON.stringify({ url: URL, modules: perModule, ...profile }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
