const { chromium } = require('playwright');

const URL = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/';
const USER = process.env.SMOKE_USER || 'admin';
const PASS = process.env.SMOKE_PASS || 'admin123';
const TARGETS = (process.env.PROFILE_MODULES || 'summary,correlation-analysis,report-generator,freshman-simulator,student-overview')
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);
const CPU_PROFILE = process.env.PROFILE_CPU === 'true';

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
      'ensureTeacherCorrelationRuntimeLoaded',
      'renderCorrelationAnalysis',
      'calculateCorrelationPearson',
      'updateCorrelationSchoolSelect',
      'ensureReportRenderRuntimeLoaded',
      'ensureStudentCompareRuntimeLoaded',
      'ensureHistoryCompareRuntimeLoaded',
      'doQuery',
      'renderSingleReportCardHTML',
      'buildStudentInsightModel',
      'renderStudentInsightOverview',
      'renderStudentActionPlan',
      'renderStudentSubjectBoard',
      'renderStudentRealityNote',
      'hasStudentTownshipRankData',
      'hasStudentCountyRankData',
      'isCountyDirectStudentForRank',
      'getComparisonTotalValue',
      'isExamKeyEquivalentForCompare',
      'getComparisonStudentView',
      'getComparisonStudentList',
      'getStudentExamHistory',
      'findPreviousRecord',
      'renderRadarChart',
      'renderVarianceChart',
      'analyzeStrengthsAndWeaknesses',
      'renderBottom3TableOnly',
      'renderBottom3TableBody',
      'renderTables',
      'refreshBottom3Summary',
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
      'getExamRowsForCompare',
      'filterProgressCompareRowsToTownshipScope',
      'filterRowsBySchool',
      'buildCompetitionRankMap',
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
    const stackSampleNames = new Set(['doQuery', 'renderSingleReportCardHTML', 'renderBottom3TableOnly']);
    const record = (name, duration, status, stack) => {
      const calls = window.__PROD_PROFILE.calls;
      const item = calls[name] || (calls[name] = { count: 0, total: 0, max: 0, errors: 0, samples: [], stacks: [] });
      item.count += 1;
      item.total += duration;
      item.max = Math.max(item.max, duration);
      if (status === 'error') item.errors += 1;
      item.samples.push(Number(duration.toFixed(2)));
      if (item.samples.length > 10) item.samples.shift();
      if (stackSampleNames.has(name) && item.stacks.length < 5) {
        item.stacks.push(String(stack || '').split('\n').slice(1, 6).map(line => line.trim()));
      }
    };
    const wrapOne = (name) => {
      const fn = window[name];
      if (typeof fn !== 'function' || fn.__profileWrapped) return;
      const wrapped = function (...args) {
        const started = performance.now();
        const stack = stackSampleNames.has(name) ? new Error().stack : '';
        try {
          const result = fn.apply(this, args);
          if (result && typeof result.then === 'function') {
            return result.then(
              (value) => {
                record(name, performance.now() - started, 'ok', stack);
                return value;
              },
              (error) => {
                record(name, performance.now() - started, 'error', stack);
                throw error;
              }
            );
          }
          record(name, performance.now() - started, 'ok', stack);
          return result;
        } catch (error) {
          record(name, performance.now() - started, 'error', stack);
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
  await page.waitForFunction((moduleId) => {
    const section = document.getElementById(moduleId);
    return !!section && section.classList.contains('active');
  }, id, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(120);
  await installProfiler(page);
}

async function startCpuProfile(page) {
  const session = await page.context().newCDPSession(page);
  await session.send('Profiler.enable');
  await session.send('Profiler.start');
  return session;
}

async function stopCpuProfile(session) {
  if (!session) return [];
  const { profile } = await session.send('Profiler.stop');
  await session.detach().catch(() => {});
  const nodes = new Map((profile?.nodes || []).map((node) => [node.id, node]));
  const totals = new Map();
  const samples = Array.isArray(profile?.samples) ? profile.samples : [];
  const deltas = Array.isArray(profile?.timeDeltas) ? profile.timeDeltas : [];
  samples.forEach((nodeId, index) => {
    const node = nodes.get(nodeId);
    const frame = node?.callFrame || {};
    const durationUs = Number(deltas[index] || 0);
    if (!Number.isFinite(durationUs) || durationUs <= 0) return;
    const name = String(frame.functionName || '(anonymous)');
    const url = String(frame.url || '');
    const line = Number(frame.lineNumber || 0) + 1;
    const key = `${name}@@${url}@@${line}`;
    const item = totals.get(key) || { name, url, line, totalUs: 0, samples: 0 };
    item.totalUs += durationUs;
    item.samples += 1;
    totals.set(key, item);
  });
  return Array.from(totals.values())
    .map((item) => ({
      name: item.name,
      url: item.url,
      line: item.line,
      totalMs: Number((item.totalUs / 1000).toFixed(2)),
      samples: item.samples
    }))
    .sort((a, b) => b.totalMs - a.totalMs)
    .slice(0, 24);
}

async function profileSummary(page) {
  await page.evaluate(async () => {
    await window.ensureTownSubmoduleCompareRuntimeLoaded?.();
    await window.ensureTownSubmoduleCompareUIs?.('summary');
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
    await (window.ensureTeacherCorrelationRuntimeLoaded?.() || window.ensureTeacherAnalysisMainRuntimeLoaded?.());
    window.updateCorrelationSchoolSelect?.();
    const select = document.getElementById('corrSchoolSelect');
    if (select && !select.value) select.value = 'ALL';
    await Promise.resolve(window.runModuleTabEnter?.({ id: 'correlation-analysis' }) || window.renderCorrelationAnalysis?.());
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
}

async function profileReport(page) {
  await page.evaluate(async () => {
    await Promise.resolve(window.ensureReportRenderRuntimeLoaded?.()).catch(() => null);
    await new Promise((resolve) => setTimeout(resolve, 220));
    window.__installProdProfileWraps?.();
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
    await Promise.resolve(window.ensureStudentOverviewRuntimeLoaded?.()).catch(() => null);
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
    const progressFirstStartedAt = performance.now();
    await Promise.resolve(window.renderMultiPeriodComparison?.()).catch(() => null);
    const progressFirstMs = performance.now() - progressFirstStartedAt;
    const progressRepeatStartedAt = performance.now();
    await Promise.resolve(window.renderMultiPeriodComparison?.()).catch(() => null);
    window.__PROD_PROFILE?.events?.push({
      name: 'progress-multi-period-cache',
      firstMs: Number(progressFirstMs.toFixed(2)),
      repeatMs: Number((performance.now() - progressRepeatStartedAt).toFixed(2))
    });
    window.renderStudentOverview?.();
    await new Promise((resolve) => setTimeout(resolve, 500));
  });
}

async function profileCohortGrowth(page) {
  await page.evaluate(async () => {
    await window.ensureCohortGrowthRuntimeLoaded?.();
    const scopeStarted = performance.now();
    window.CohortGrowth?.updateScopeControls?.();
    const renderStarted = performance.now();
    await Promise.resolve(window.CohortGrowth?.render?.());
    window.__PROD_PROFILE?.events?.push({
      name: 'cohort-growth-action',
      scopeMs: Number((renderStarted - scopeStarted).toFixed(2)),
      renderMs: Number((performance.now() - renderStarted).toFixed(2)),
      signature: String(window.CohortGrowth?.cacheSignature || ''),
      resultCacheSize: Number(window.CohortGrowth?.resultCache?.size || 0)
    });
    await new Promise((resolve) => setTimeout(resolve, 120));
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
  const cpuProfiles = [];
  const actions = {
    summary: profileSummary,
    'correlation-analysis': profileCorrelation,
    'report-generator': profileReport,
    'freshman-simulator': profileFreshman,
    'student-overview': profileStudentOverview,
    'cohort-growth': profileCohortGrowth,
    'marginal-push': profileMarginalPush,
    'seat-adjustment': profileSeatAdjustment
  };
  for (const id of TARGETS) {
    const started = Date.now();
    try {
      await switchModule(page, id);
      const cpuSession = CPU_PROFILE ? await startCpuProfile(page) : null;
      await actions[id]?.(page);
      if (cpuSession) cpuProfiles.push({ id, topFunctions: await stopCpuProfile(cpuSession) });
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
        samples: item.samples,
        stacks: item.stacks || []
      }))
      .sort((a, b) => b.totalMs - a.totalMs);
    return {
      calls,
      longTasks: window.__PROD_PROFILE.longTasks.slice(-40),
      events: window.__PROD_PROFILE.events.slice(-20)
    };
  });
  await browser.close();
  console.log(JSON.stringify({ url: URL, modules: perModule, cpuProfiles, ...profile }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
