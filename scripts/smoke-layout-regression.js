try {
    require.resolve('playwright');
} catch (error) {
    console.error('playwright is required for smoke-layout-regression. Run: npm install --no-save playwright');
    process.exit(1);
}

const assert = require('assert');
const { chromium } = require('playwright');

const url = process.env.SMOKE_URL || 'https://schoolsystem.com.cn/';
const user = process.env.SMOKE_USER || 'admin';
const pass = process.env.SMOKE_PASS || 'admin123';
const cohortYear = process.env.SMOKE_COHORT_YEAR || '2022';

function isIgnorableMessage(text) {
    return /favicon|GitHub release API|fetch releases|cloudflareinsights|beacon\.min\.js|Failed to load resource/i.test(String(text || ''));
}

async function loginAndEnterCohort(page) {
    await page.goto(url, { waitUntil: 'commit', timeout: 90000 });
    await page.waitForSelector('#login-user', { state: 'visible', timeout: 90000 });
    await page.fill('#login-user', user);
    await page.fill('#login-pass', pass);
    await page.click('#login-submit-button');

    await page.waitForFunction(() => {
        const overlay = document.getElementById('login-overlay');
        const mask = document.getElementById('mode-mask');
        const app = document.getElementById('app');
        return (!overlay || getComputedStyle(overlay).display === 'none')
            && (!!mask || !!app || document.body?.dataset?.authState === 'logged_in');
    }, null, { timeout: 90000 });

    await page.waitForFunction(() => typeof window.enterCohortFromMask === 'function', null, { timeout: 30000 }).catch(() => {});
    const maskVisible = await page.evaluate(() => {
        const mask = document.getElementById('mode-mask');
        return !!mask && getComputedStyle(mask).display !== 'none';
    });
    if (maskVisible) {
        const input = page.locator('#entry-cohort-year');
        if (await input.count()) await input.fill(cohortYear);
        await page.evaluate(async () => {
            if (typeof window.enterCohortFromMask === 'function') {
                await window.enterCohortFromMask();
                return;
            }
            document.querySelector('button[onclick="enterCohortFromMask()"]')?.click();
        });
    }

    await page.waitForFunction(() => {
        const cohortId = String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
        const rawDataLen = Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0;
        return !!cohortId && rawDataLen > 0;
    }, null, { timeout: 90000 });
}

async function openUploadModule(page) {
    await page.waitForFunction(() => typeof window.switchTab === 'function', null, { timeout: 60000 });
    await page.evaluate(() => window.switchTab('upload'));
    await page.waitForFunction(() => {
        const upload = document.getElementById('upload');
        return !!upload && upload.classList.contains('active') && getComputedStyle(upload).display !== 'none';
    }, null, { timeout: 30000 });
    await page.waitForTimeout(500);
}

async function openModule(page, id) {
    await page.waitForFunction(() => typeof window.switchTab === 'function', null, { timeout: 60000 });
    await page.evaluate((moduleId) => window.switchTab(moduleId), id);
    await page.waitForFunction((moduleId) => {
        const section = document.getElementById(moduleId);
        return !!section && section.classList.contains('active') && getComputedStyle(section).display !== 'none';
    }, id, { timeout: 45000 });
    await page.waitForTimeout(500);
}

async function openStudentDetailsModule(page) {
    await openModule(page, 'student-details');
    await page.evaluate(() => {
        if (typeof window.renderStudentDetails === 'function') window.renderStudentDetails();
    }).catch(() => {});
    await page.waitForFunction(() => {
        const section = document.getElementById('student-details');
        const table = document.getElementById('studentDetailTable');
        const rows = table ? table.querySelectorAll('tbody tr').length : 0;
        return !!section && !!table && rows > 0;
    }, null, { timeout: 45000 });
    await page.waitForTimeout(500);
}

async function openReportGeneratorModule(page) {
    await openModule(page, 'report-generator');
    await page.evaluate(() => {
        if (typeof window.updateSchoolSelect === 'function') window.updateSchoolSelect();
        if (typeof window.updateReportCompareExamSelects === 'function') window.updateReportCompareExamSelects();
    }).catch(() => {});
    await page.waitForFunction(() => {
        const section = document.getElementById('report-generator');
        const school = document.getElementById('sel-school');
        const name = document.getElementById('inp-name');
        return !!section && !!school && !!name && section.classList.contains('active');
    }, null, { timeout: 45000 });
    await page.waitForTimeout(500);
}

async function openSummaryModule(page) {
    await openModule(page, 'summary');
    await page.evaluate(async () => {
        if (typeof window.ensureTownSubmoduleCompareRuntimeLoaded === 'function') {
            await window.ensureTownSubmoduleCompareRuntimeLoaded();
        }
        if (typeof window.ensureTownSubmoduleCompareUIs === 'function') {
            await window.ensureTownSubmoduleCompareUIs();
        }
        if (typeof window.calcSummary === 'function') {
            window.calcSummary(true);
        }
    }).catch(() => {});
    await page.waitForFunction(() => {
        const section = document.getElementById('summary');
        const rows = document.querySelectorAll('#tb-summary tbody tr').length;
        const panel = document.querySelector('#summary .town-submodule-compare-panel[data-submodule="summary"]');
        return !!section && section.classList.contains('active') && rows > 0 && !!panel;
    }, null, { timeout: 45000 });
    await page.waitForTimeout(500);
}

async function openTeacherAnalysisModule(page) {
    await openModule(page, 'teacher-analysis');
    await page.evaluate(async () => {
        if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function') {
            await window.ensureTeacherAnalysisMainRuntimeLoaded();
        }
        if (typeof window.ensureTeacherCompareRuntimeLoaded === 'function') {
            await window.ensureTeacherCompareRuntimeLoaded().catch(() => {});
        }
        if (typeof window.updateTeacherCompareExamSelects === 'function') window.updateTeacherCompareExamSelects();
        if (typeof window.pickTeacherCompareDefaultSubjectAndTeacher === 'function') window.pickTeacherCompareDefaultSubjectAndTeacher();
        if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP || {}).length && typeof window.analyzeTeachers === 'function') {
            window.analyzeTeachers({ render: false });
        }
        if (typeof window.renderTeacherCards === 'function') window.renderTeacherCards();
        if (typeof window.renderTeacherComparisonTable === 'function') window.renderTeacherComparisonTable();
        if (typeof window.generateTeacherPairing === 'function') window.generateTeacherPairing();
        if (typeof window.renderTeacherTownshipRanking === 'function') window.renderTeacherTownshipRanking();
        if (typeof window.refreshResponsiveMobileTables === 'function') {
            window.refreshResponsiveMobileTables(document.getElementById('teacher-analysis'));
        }
    }).catch(() => {});
    await page.waitForFunction(() => {
        const section = document.getElementById('teacher-analysis');
        const cards = document.querySelectorAll('#teacherCardsContainer .teacher-card').length;
        const comparisonCells = document.querySelectorAll('#teacherComparisonTable tbody td').length;
        const compareSchool = document.getElementById('teacherCompareSchool');
        return !!section
            && section.classList.contains('active')
            && !!compareSchool
            && (cards > 0 || comparisonCells > 0);
    }, null, { timeout: 90000 });
    await page.waitForTimeout(500);
}

async function openCorrelationAnalysisModule(page) {
    await openModule(page, 'correlation-analysis');
    await page.evaluate(async () => {
        if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function') {
            await window.ensureTeacherAnalysisMainRuntimeLoaded();
        }
        if (typeof window.updateCorrelationSchoolSelect === 'function') window.updateCorrelationSchoolSelect();
        if (typeof window.renderCorrelationAnalysis === 'function') window.renderCorrelationAnalysis();
        if (typeof window.refreshResponsiveMobileTables === 'function') {
            window.refreshResponsiveMobileTables(document.getElementById('correlation-analysis'));
        }
    }).catch(() => {});
    await page.waitForFunction(() => {
        const section = document.getElementById('correlation-analysis');
        const matrixCells = document.querySelectorAll('#corrMatrixTable .heatmap-cell').length;
        const bars = document.querySelectorAll('#contributionChartContainer .contribution-bar').length;
        const liftRows = document.querySelectorAll('#liftDragTable tbody tr').length;
        return !!section
            && section.classList.contains('active')
            && matrixCells > 0
            && bars > 0
            && liftRows > 0;
    }, null, { timeout: 90000 });
    await page.waitForTimeout(500);
}

async function openProgressAnalysisModule(page) {
    await openModule(page, 'progress-analysis');
    await page.evaluate(async () => {
        const ensureProgressSmokeExamArchive = () => {
            const rawRows = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
            if (!rawRows.length) return false;
            const db = (typeof window.CohortDB !== 'undefined' && typeof window.CohortDB.ensure === 'function')
                ? window.CohortDB.ensure()
                : (window.COHORT_DB || {});
            db.exams = db.exams || {};
            const existingExams = Object.values(db.exams).filter(exam => Array.isArray(exam?.data) && exam.data.length);
            if (existingExams.length >= 2) return true;

            const currentExamId = String(window.CURRENT_EXAM_ID || localStorage.getItem('CURRENT_EXAM_ID') || db.currentExamId || '').trim()
                || 'smoke-layout-current';
            const baselineExamId = `${currentExamId}-baseline`;
            const cloneRows = () => rawRows.map(row => ({ ...row }));
            if (!db.exams[baselineExamId]) {
                db.exams[baselineExamId] = {
                    examId: baselineExamId,
                    examFullKey: baselineExamId,
                    createdAt: Date.now() - 86400000,
                    updatedAt: Date.now() - 86400000,
                    data: cloneRows()
                };
            }
            if (!db.exams[currentExamId]) {
                db.exams[currentExamId] = {
                    examId: currentExamId,
                    examFullKey: currentExamId,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                    data: cloneRows()
                };
            }
            db.currentExamId = currentExamId;
            window.COHORT_DB = db;
            window.CURRENT_EXAM_ID = currentExamId;
            try { CURRENT_EXAM_ID = currentExamId; } catch (_) {}
            try { localStorage.setItem('CURRENT_EXAM_ID', currentExamId); } catch (_) {}
            window.__PROGRESS_BASELINE_LOADING = false;
            return true;
        };

        if (typeof window.ensureProgressAnalysisRuntimeLoaded === 'function') {
            await window.ensureProgressAnalysisRuntimeLoaded();
        }
        ensureProgressSmokeExamArchive();
        if (typeof window.updateProgressSchoolSelect === 'function') window.updateProgressSchoolSelect();
        if (typeof window.updateProgressBaselineSelect === 'function') window.updateProgressBaselineSelect();
        if (typeof window.updateProgressMultiExamSelects === 'function') window.updateProgressMultiExamSelects();

        const selectFirstValue = (select, exclude = '') => {
            const options = Array.from(select?.options || []).map(option => option.value).filter(Boolean);
            const value = options.find(optionValue => optionValue !== exclude) || '';
            if (value) select.value = value;
            return value;
        };
        const progressSchool = document.getElementById('progressSchoolSelect');
        if (progressSchool && !progressSchool.value) selectFirstValue(progressSchool);
        if (typeof window.ensureProgressBaselineData === 'function') {
            await window.ensureProgressBaselineData({
                allowCloudSync: true,
                rerenderReport: true,
                rerenderAnalysis: !!progressSchool?.value
            });
        }
        if (typeof window.renderProgressAnalysis === 'function') window.renderProgressAnalysis();
        if (typeof window.renderValueAddedReport === 'function') window.renderValueAddedReport(true);

        const compareSchool = document.getElementById('progressCompareSchool');
        const compareExam1 = document.getElementById('progressCompareExam1');
        const compareExam2 = document.getElementById('progressCompareExam2');
        if (compareSchool && !compareSchool.value) selectFirstValue(compareSchool);
        if (compareExam1 && !compareExam1.value) selectFirstValue(compareExam1);
        if (compareExam2 && (!compareExam2.value || compareExam2.value === compareExam1?.value)) {
            selectFirstValue(compareExam2, compareExam1?.value || '');
        }
        if (compareSchool?.value && compareExam1?.value && compareExam2?.value && compareExam1.value !== compareExam2.value
            && typeof window.renderMultiPeriodComparison === 'function') {
            window.renderMultiPeriodComparison();
        }
        if (typeof window.applyProgressFilter === 'function') {
            window.applyProgressFilter();
        }
        if (typeof window.refreshResponsiveMobileTables === 'function') {
            window.refreshResponsiveMobileTables(document.getElementById('progress-analysis'));
        }
    }).catch(() => {});
    try {
        await page.waitForFunction(() => {
        const section = document.getElementById('progress-analysis');
        const valueRows = document.querySelectorAll('#tb-value-added tbody tr').length;
        let progressRows = document.querySelectorAll('#progressTable tbody tr').length;
        const fullProgressRows = typeof window.readProgressCacheFullState === 'function'
            ? window.readProgressCacheFullState()
            : (Array.isArray(window.PROGRESS_CACHE_FULL) ? window.PROGRESS_CACHE_FULL : []);
        const visibleProgressRows = typeof window.readProgressCacheState === 'function'
            ? window.readProgressCacheState()
            : (Array.isArray(window.PROGRESS_CACHE) ? window.PROGRESS_CACHE : []);
        if (progressRows === 0 && (fullProgressRows.length || visibleProgressRows.length)) {
            if (typeof window.applyProgressFilter === 'function') {
                window.applyProgressFilter();
            } else if (typeof window.renderProgressTable === 'function') {
                window.renderProgressTable(visibleProgressRows.length ? visibleProgressRows : fullProgressRows);
            }
            progressRows = document.querySelectorAll('#progressTable tbody tr').length;
        }
        return !!section
            && section.classList.contains('active')
            && !!document.getElementById('progressSchoolSelect')
            && !!document.getElementById('progressBaselineSelect')
            && !!document.getElementById('progressCompareSchool')
            && !!document.getElementById('progressCompareExam1')
            && !!document.getElementById('progressCompareExam2')
            && valueRows > 0
            && progressRows > 0;
        }, null, { timeout: 90000 });
    } catch (error) {
        const diagnostics = await page.evaluate(() => ({
            sectionActive: !!document.getElementById('progress-analysis')?.classList.contains('active'),
            baselineLoading: !!window.__PROGRESS_BASELINE_LOADING,
            rawRows: Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : -1,
            prevRows: Array.isArray(window.PREV_DATA) ? window.PREV_DATA.length : -1,
            valueRows: document.querySelectorAll('#tb-value-added tbody tr').length,
            progressRows: document.querySelectorAll('#progressTable tbody tr').length,
            progressCacheRows: typeof window.readProgressCacheState === 'function'
                ? window.readProgressCacheState().length
                : (Array.isArray(window.PROGRESS_CACHE) ? window.PROGRESS_CACHE.length : -1),
            progressCacheFullRows: typeof window.readProgressCacheFullState === 'function'
                ? window.readProgressCacheFullState().length
                : (Array.isArray(window.PROGRESS_CACHE_FULL) ? window.PROGRESS_CACHE_FULL.length : -1),
            selectedSchool: document.getElementById('progressSchoolSelect')?.value || '',
            selectedBaseline: document.getElementById('progressBaselineSelect')?.value || '',
            compareSchool: document.getElementById('progressCompareSchool')?.value || '',
            compareExam1: document.getElementById('progressCompareExam1')?.value || '',
            compareExam2: document.getElementById('progressCompareExam2')?.value || ''
        })).catch(() => null);
        console.error('[smoke-layout] progress-analysis readiness diagnostics:', diagnostics);
        throw error;
    }
    await page.waitForTimeout(500);
}

async function openCohortGrowthModule(page) {
    await openModule(page, 'cohort-growth');
    await page.evaluate(() => {
        if (typeof window.CohortGrowth?.render === 'function') {
            window.CohortGrowth.render();
        }
        if (typeof window.refreshResponsiveMobileTables === 'function') {
            window.refreshResponsiveMobileTables(document.getElementById('cohort-growth'));
        }
    }).catch(() => {});
    await page.waitForFunction(() => {
        const section = document.getElementById('cohort-growth');
        const volatilityRows = document.querySelectorAll('#cohort-volatility-table tbody tr').length;
        const growthRows = document.querySelectorAll('#cohort-growth-table tbody tr').length;
        return !!section
            && section.classList.contains('active')
            && typeof window.CohortGrowth?.compute === 'function'
            && !!document.getElementById('cohort-volatility-table')
            && !!document.getElementById('cohort-growth-table')
            && volatilityRows > 0
            && growthRows > 0;
    }, null, { timeout: 90000 });
    await page.waitForTimeout(500);
}

async function openMarginalPushModule(page) {
    await openModule(page, 'marginal-push');
    await page.evaluate(() => {
        if (typeof window.updateMpSchoolSelect === 'function') window.updateMpSchoolSelect();
        const schoolSelect = document.getElementById('mpSchoolSelect');
        const subjectSelect = document.getElementById('mpSubjectSelect');
        const gapInput = document.getElementById('mpGap');
        const typeSelect = document.getElementById('mpType');
        const schoolOptions = Array.from(schoolSelect?.options || []).map(option => option.value).filter(Boolean);
        const gaps = [5, 10, 20, 999];
        let result = null;
        for (const school of schoolOptions) {
            schoolSelect.value = school;
            if (typeof window.updateMpClassSelect === 'function') window.updateMpClassSelect();
            if (subjectSelect) subjectSelect.value = 'ALL';
            if (typeSelect) typeSelect.value = 'both';
            for (const gap of gaps) {
                if (gapInput) gapInput.value = String(gap);
                if (typeof window.generateMarginalTickets === 'function') {
                    result = window.generateMarginalTickets();
                }
                if (result && Number(result.count || 0) > 0) return result;
            }
        }
        return result;
    }).catch(() => {});
    await page.waitForFunction(() => {
        const section = document.getElementById('marginal-push');
        const tickets = document.querySelectorAll('#mp-tickets-container .task-ticket').length;
        const empty = !!document.querySelector('#mp-tickets-container .marginal-empty-state');
        return !!section
            && section.classList.contains('active')
            && typeof window.generateMarginalTickets === 'function'
            && !!document.getElementById('mpSchoolSelect')
            && !!document.getElementById('mpClassSelect')
            && !!document.getElementById('mpSubjectSelect')
            && !!document.getElementById('mpGap')
            && (tickets > 0 || empty);
    }, null, { timeout: 90000 });
    await page.waitForTimeout(500);
}

async function openSeatAdjustmentModule(page) {
    await openModule(page, 'seat-adjustment');
    await page.evaluate(() => {
        if (typeof window.updateSeatAdjSelects === 'function') window.updateSeatAdjSelects();
        const schoolSelect = document.getElementById('seatAdjSchoolSelect');
        const classSelect = document.getElementById('seatAdjClassSelect');
        const groupsInput = document.getElementById('seatAdjGroups');
        const colsInput = document.getElementById('seatAdjCols');
        const strategySelect = document.getElementById('seatAdjStrategy');
        const schoolOptions = Array.from(schoolSelect?.options || []).map(option => option.value).filter(Boolean);
        let result = null;
        for (const school of schoolOptions) {
            schoolSelect.value = school;
            if (typeof window.updateSeatAdjSelects === 'function') window.updateSeatAdjSelects();
            const classOptions = Array.from(classSelect?.options || []).map(option => option.value).filter(Boolean);
            for (const className of classOptions) {
                classSelect.value = className;
                if (typeof window.updateConstraintWidgetsContext === 'function') window.updateConstraintWidgetsContext('adj');
                if (groupsInput) groupsInput.value = '2';
                if (colsInput) colsInput.value = '4';
                if (strategySelect) strategySelect.value = 'conversion';
                if (typeof window.generateSeatSuggestions === 'function') {
                    result = window.generateSeatSuggestions();
                }
                if (result && Number(result.count || 0) > 0) return result;
            }
        }
        return result;
    }).catch(() => {});
    await page.waitForFunction(() => {
        const section = document.getElementById('seat-adjustment');
        const desks = document.querySelectorAll('#seat-adj-container .desk:not(.desk-empty)').length;
        return !!section
            && section.classList.contains('active')
            && typeof window.generateSeatSuggestions === 'function'
            && !!window.SeatAdjustmentRuntime
            && !!document.getElementById('seatAdjSchoolSelect')
            && !!document.getElementById('seatAdjClassSelect')
            && !!document.getElementById('seatAdjGroups')
            && !!document.getElementById('seatAdjCols')
            && desks > 0;
    }, null, { timeout: 90000 });
    await page.waitForTimeout(500);
}

async function ensureMobileShell(page) {
    await page.evaluate(() => window.ensureMobileManagerRuntimeLoaded?.()).catch(() => {});
    await page.evaluate(() => window.MobileQueryUI?.refresh?.()).catch(() => {});
    await page.waitForFunction(() => {
        const shell = document.getElementById('apk-mobile-shell');
        return document.body?.dataset?.mobileQuery === 'true'
            && document.body?.dataset?.mobileArchitecture === 'apk-v2'
            && !!shell
            && shell.getAttribute('aria-hidden') === 'false';
    }, null, { timeout: 30000 });
}

async function inspectSectionLayout(page, mode, options = {}) {
    const sectionId = options.sectionId || 'upload';
    const targetSelector = options.targetSelector || '#uploadBox';
    await page.locator(targetSelector).scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(({ layoutMode, focusSelector }) => {
        const target = document.querySelector(focusSelector);
        if (!target) return;
        target.scrollIntoView({ block: 'start', inline: 'nearest' });
        const shell = layoutMode === 'mobile' ? document.querySelector('#apk-mobile-shell .apk-shell-top') : null;
        const shellRect = shell?.getBoundingClientRect?.();
        const targetRect = target.getBoundingClientRect();
        const desiredTop = Math.round(layoutMode === 'mobile' && shellRect ? shellRect.bottom + 12 : 36);
        const desiredBottom = Math.round((window.innerHeight || document.documentElement.clientHeight || 0) - 48);
        if (targetRect.top >= desiredTop && targetRect.bottom <= desiredBottom) return;
        const appMain = document.querySelector('.app-main');
        const delta = Math.round(targetRect.top - desiredTop);
        if (appMain && appMain.scrollHeight > appMain.clientHeight) {
            appMain.scrollTop += delta;
            return;
        }
        window.scrollBy(0, delta);
    }, { layoutMode: mode, focusSelector: targetSelector }).catch(() => {});
    await page.waitForFunction(({ layoutMode, focusSelector }) => {
        const target = document.querySelector(focusSelector);
        if (!target) return false;
        const rect = target.getBoundingClientRect();
        if (rect.width <= 1 || rect.height <= 1) return false;
        const viewportHeight = Math.round(document.documentElement.clientHeight || window.innerHeight || 0);
        const topShell = document.querySelector('#apk-mobile-shell .apk-shell-top');
        const topbar = document.querySelector('#apk-mobile-shell .apk-shell-topbar');
        const tabs = document.querySelector('#apk-mobile-shell .apk-shell-tabs');
        const topShellRect = topShell?.getBoundingClientRect?.();
        const topbarRect = topbar?.getBoundingClientRect?.();
        const tabsRect = tabs?.getBoundingClientRect?.();
        const safeTop = Math.max(1, topShellRect?.bottom || 1, topbarRect?.bottom || 1) + 6;
        const safeBottom = Math.min(viewportHeight - 2, tabsRect?.top ? tabsRect.top - 6 : viewportHeight - 2);
        const focusInset = Math.min(8, Math.max(2, rect.height / 3));
        const minY = Math.max(rect.top + focusInset, safeTop);
        const maxY = Math.min(rect.bottom - focusInset, safeBottom);
        const preferredY = Math.min(rect.top + 72, rect.top + rect.height / 2);
        const x = Math.min(Math.max(rect.left + rect.width / 2, 1), Math.round(document.documentElement.clientWidth || window.innerWidth || 0) - 2);
        const y = minY <= maxY
            ? Math.min(Math.max(preferredY, minY), maxY)
            : Math.min(Math.max(rect.top + rect.height / 2, 1), viewportHeight - 2);
        const hit = document.elementFromPoint(x, y);
        if (hit === target || target.contains(hit)) return true;
        if (layoutMode === 'mobile') return false;
        const railSelector = '[data-shell-module-rail], [data-shell-module-rail-shell]';
        return !(hit?.matches?.(railSelector) || hit?.closest?.(railSelector));
    }, { layoutMode: mode, focusSelector: targetSelector }, { timeout: 3000 }).catch(() => {});
    await page.waitForTimeout(250);
    return page.evaluate(({ layoutMode, targetSectionId, focusSelector, requiredSelectors }) => {
        function selectorFor(el) {
            if (!el) return '';
            if (el.id) return `#${el.id}`;
            const classes = Array.from(el.classList || []).slice(0, 3).join('.');
            const tag = String(el.tagName || '').toLowerCase();
            return classes ? `${tag}.${classes}` : tag;
        }

        function isVisible(el) {
            if (!el) return false;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            if (rect.right < -100 || rect.bottom < -100 || rect.left > window.innerWidth + 100 || rect.top > window.innerHeight + 100) return false;
            return rect.width > 1 && rect.height > 1;
        }

        function hasManagedHorizontalScroll(el, boundary) {
            let node = el.parentElement;
            while (node && node !== boundary && node !== document.body && node !== document.documentElement) {
                const style = getComputedStyle(node);
                const managesOverflow = ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX);
                if (managesOverflow && node.scrollWidth > node.clientWidth + 2) return true;
                node = node.parentElement;
            }
            return false;
        }

        function rectOf(selector) {
            const el = document.querySelector(selector);
            if (!isVisible(el)) return null;
            const rect = el.getBoundingClientRect();
            return {
                selector,
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                top: Math.round(rect.top),
                bottom: Math.round(rect.bottom),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            };
        }

        function intersects(a, b) {
            if (!a || !b) return false;
            return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
        }

        function containsPoint(rect, point) {
            if (!rect || !point) return false;
            return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
        }

        function clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }

        const viewportWidth = Math.round(document.documentElement.clientWidth || window.innerWidth || 0);
        const viewportHeight = Math.round(document.documentElement.clientHeight || window.innerHeight || 0);
        const appMain = document.querySelector('.app-main');
        const scrollRoot = layoutMode === 'mobile' && appMain ? appMain : document.scrollingElement;
        const rootOverflow = scrollRoot ? Math.round(scrollRoot.scrollWidth - scrollRoot.clientWidth) : 0;
        const documentOverflow = Math.round(document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const activeSection = document.querySelector(`#${CSS.escape(targetSectionId)}.section.active`);
        const scope = activeSection || document.getElementById(targetSectionId) || document.body;

        const overflowIssues = Array.from(scope.querySelectorAll('*'))
            .filter(isVisible)
            .map((el) => {
                const rect = el.getBoundingClientRect();
                const style = getComputedStyle(el);
                return {
                    selector: selectorFor(el),
                    width: Math.round(rect.width),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    position: style.position,
                    tag: String(el.tagName || '').toLowerCase(),
                    scrollManaged: hasManagedHorizontalScroll(el, scope)
                };
            })
            .filter((item) => {
                if (item.position === 'fixed') return false;
                if (item.scrollManaged) return false;
                if (item.right <= viewportWidth + 2 && item.left >= -2) return false;
                if (/table|thead|tbody|tr|th|td/.test(item.tag)) return false;
                return true;
            })
            .slice(0, 12);

        const tabsRect = rectOf('#apk-mobile-shell .apk-shell-tabs');
        const topShellRect = rectOf('#apk-mobile-shell .apk-shell-top');
        const topbarRect = rectOf('#apk-mobile-shell .apk-shell-topbar');
        const focusTarget = document.querySelector(focusSelector);
        const focusRect = rectOf(focusSelector);
        let focusHitOk = false;
        let focusHitSelector = '';
        let focusHitPoint = null;
        if (focusRect && focusTarget) {
            const safeTop = Math.max(1, topShellRect?.bottom || 1, topbarRect?.bottom || 1) + 6;
            const safeBottom = Math.min(viewportHeight - 2, tabsRect?.top ? tabsRect.top - 6 : viewportHeight - 2);
            const focusInset = Math.min(8, Math.max(2, focusRect.height / 3));
            const minFocusY = focusRect.top + focusInset;
            const maxFocusY = focusRect.bottom - focusInset;
            const minY = Math.max(minFocusY, safeTop);
            const maxY = Math.min(maxFocusY, safeBottom);
            const preferredY = Math.min(focusRect.top + 72, focusRect.top + focusRect.height / 2);
            const x = clamp(focusRect.left + focusRect.width / 2, 1, viewportWidth - 2);
            const y = minY <= maxY
                ? clamp(preferredY, minY, maxY)
                : clamp(focusRect.top + focusRect.height / 2, 1, viewportHeight - 2);
            focusHitPoint = { x: Math.round(x), y: Math.round(y) };
            const hit = document.elementFromPoint(x, y);
            focusHitSelector = selectorFor(hit);
            focusHitOk = hit === focusTarget || focusTarget.contains(hit);
            if (!focusHitOk && layoutMode !== 'mobile') {
                const railSelector = '[data-shell-module-rail], [data-shell-module-rail-shell]';
                focusHitOk = !!(hit?.matches?.(railSelector) || hit?.closest?.(railSelector));
            }
        }

        const requiredPieces = {};
        Object.entries(requiredSelectors || {}).forEach(([key, selector]) => {
            requiredPieces[key] = !!document.querySelector(selector);
        });

        return {
            mode: layoutMode,
            sectionId: targetSectionId,
            viewportWidth,
            bodyMobileQuery: String(document.body?.dataset?.mobileQuery || ''),
            bodyMobileArchitecture: String(document.body?.dataset?.mobileArchitecture || ''),
            sectionActive: !!activeSection,
            viewportHeight,
            rootOverflow,
            documentOverflow,
            overflowIssues,
            requiredPieces,
            focusRect,
            focusHitPoint,
            focusHitOk,
            focusHitSelector,
            tabsRect,
            topShellRect,
            topbarRect,
            tabsOverlapFocus: containsPoint(tabsRect, focusHitPoint),
            topShellOverlapFocus: containsPoint(topShellRect, focusHitPoint),
            topbarOverlapFocus: containsPoint(topbarRect, focusHitPoint)
        };
    }, {
        layoutMode: mode,
        targetSectionId: sectionId,
        focusSelector: targetSelector,
        requiredSelectors: options.requiredSelectors || {}
    });
}

async function inspectUploadLayout(page, mode) {
    return inspectSectionLayout(page, mode, {
        sectionId: 'upload',
        targetSelector: '#uploadBox',
        requiredSelectors: {
            summary: '#upload-summary-strip',
            notice: '#upload-flow-notice',
            workbench: '#upload .upload-workbench-grid',
            intake: '#upload .upload-intake-grid',
            ops: '#upload .upload-ops-grid',
            uploadBox: '#uploadBox'
        }
    });
}

async function inspectStudentDetailsLayout(page, mode) {
    return inspectSectionLayout(page, mode, {
        sectionId: 'student-details',
        targetSelector: '#student-details .student-details-primary-flow',
        requiredSelectors: {
            schoolSelect: '#studentSchoolSelect',
            classSelect: '#studentClassSelect',
            detailTable: '#studentDetailTable',
            detailRows: '#studentDetailTable tbody tr',
            compareToolbar: '#student-details .student-compare-toolbar'
        }
    });
}

async function inspectReportGeneratorLayout(page, mode) {
    return inspectSectionLayout(page, mode, {
        sectionId: 'report-generator',
        targetSelector: '#report-generator .report-query-panel',
        requiredSelectors: {
            queryCopy: '#report-generator .report-query-copy',
            queryPanel: '#report-generator .report-query-panel',
            schoolSelect: '#sel-school',
            classSelect: '#sel-class',
            nameInput: '#inp-name',
            comparePanel: '#report-generator .analysis-inline-panel',
            comparePeriod: '#reportComparePeriodCount',
            compareExam1: '#reportCompareExam1',
            resultSlot: '#single-report-result',
            marginalSelect: '#marginalSchoolSelect'
        }
    });
}

async function inspectSummaryLayout(page, mode) {
    return inspectSectionLayout(page, mode, {
        sectionId: 'summary',
        targetSelector: '#summary .analysis-summary-table',
        requiredSelectors: {
            shellHead: '#summary .analysis-shell-head',
            actions: '#summary .analysis-actions .btn',
            meta: '#summary .analysis-table-meta',
            comparePanel: '#summary .town-submodule-compare-panel[data-submodule="summary"]',
            compareResult: '#town-submodule-compare-result-summary',
            summaryTable: '#tb-summary',
            summaryRows: '#tb-summary tbody tr',
            mobileLabels: '#tb-summary tbody td[data-label="学校名称"]',
            rankLabels: '#tb-summary tbody td[data-label="总排名"]'
        }
    });
}

async function inspectTeacherAnalysisLayout(page, mode) {
    const mobileOnlySelectors = mode === 'mobile'
        ? {
            mobileLabels: '#teacherComparisonTable tbody td[data-label]',
            mobileCardTable: '#teacherComparisonTable.mobile-card-table'
        }
        : {};
    return inspectSectionLayout(page, mode, {
        sectionId: 'teacher-analysis',
        targetSelector: '#teacher-analysis .analysis-inline-panel',
        requiredSelectors: {
            shellHead: '#teacher-analysis .analysis-shell-head',
            syncCta: '#teacher-sync-cta',
            comparePanel: '#teacher-analysis .analysis-inline-panel',
            compareSchool: '#teacherCompareSchool',
            compareSubject: '#teacherCompareSubject',
            compareTeacher: '#teacherCompareTeacher',
            compareExam1: '#teacherCompareExam1',
            compareResult: '#teacherCompareResult',
            stateBars: '#tmModuleState-teacher-analysis',
            cards: '#teacherCardsContainer .teacher-card',
            comparisonTable: '#teacherComparisonTable',
            comparisonRows: '#teacherComparisonTable tbody td',
            pairBox: '#teacher-pairing-box',
            rankingContainer: '#teacher-township-ranking-container',
            rankingPanel: '#teacher-analysis .analysis-ranking-panel',
            ...mobileOnlySelectors
        }
    });
}

async function inspectCorrelationAnalysisLayout(page, mode) {
    const mobileOnlySelectors = mode === 'mobile'
        ? {
            liftMobileLabels: '#liftDragTable tbody td[data-label]',
            liftMobileCardTable: '#liftDragTable.mobile-card-table'
        }
        : {};
    return inspectSectionLayout(page, mode, {
        sectionId: 'correlation-analysis',
        targetSelector: '#correlation-analysis',
        requiredSelectors: {
            shellHead: '#correlation-analysis .analysis-shell-head',
            controlPanel: '#correlation-analysis .control-panel',
            scopeSelect: '#corrSchoolSelect',
            flow: '#correlation-analysis .analysis-flow-step',
            matrixPanel: '#correlation-analysis .corr-board-grid .analysis-anchor-panel',
            matrixTable: '#corrMatrixTable',
            matrixCells: '#corrMatrixTable .heatmap-cell',
            contributionChart: '#contributionChartContainer',
            contributionBars: '#contributionChartContainer .contribution-bar',
            liftDragTable: '#liftDragTable',
            liftDragRows: '#liftDragTable tbody tr',
            ...mobileOnlySelectors
        }
    });
}

async function inspectProgressAnalysisLayout(page, mode) {
    const mobileOnlySelectors = mode === 'mobile'
        ? {
            progressMobileLabels: '#progressTable tbody td[data-label]',
            progressMobileCardTable: '#progressTable.mobile-card-table'
        }
        : {};
    return inspectSectionLayout(page, mode, {
        sectionId: 'progress-analysis',
        targetSelector: '#progress-analysis',
        requiredSelectors: {
            shellHead: '#progress-analysis .analysis-shell-head',
            viewActions: '#progress-analysis .progress-view-actions',
            statusBand: '#va-data-status',
            statusNote: '#progress-analysis .progress-status-note',
            flow: '#progress-analysis .analysis-flow-step',
            valueAddedPanel: '#anchor-va-report',
            valueAddedTable: '#tb-value-added',
            valueAddedRows: '#tb-value-added tbody tr',
            detailPanel: '#anchor-va-trend',
            detailHead: '#progress-analysis .progress-detail-head',
            detailTools: '#progress-analysis .progress-detail-tools',
            progressSchool: '#progressSchoolSelect',
            progressBaseline: '#progressBaselineSelect',
            inlinePanel: '#progress-analysis .analysis-inline-panel',
            compareSchool: '#progressCompareSchool',
            compareExam1: '#progressCompareExam1',
            compareExam2: '#progressCompareExam2',
            compareResult: '#multiPeriodCompareResult',
            chartGrid: '#progress-analysis .analysis-chart-grid',
            trendChart: '#trendChart',
            sankeyChart: '#sankeyChart',
            filterStrip: '#progress-analysis .analysis-filter-strip',
            filterSummary: '#progressFilterSummary',
            progressTable: '#progressTable',
            progressRows: '#progressTable tbody tr',
            ...mobileOnlySelectors
        }
    });
}

function assertSectionLayout(state, label) {
    assert.ok(state.sectionActive, `${state.mode} ${label} section is not active`);
    for (const [key, exists] of Object.entries(state.requiredPieces)) {
        assert.ok(exists, `${state.mode} ${label} required piece missing: ${key}`);
    }
    assert.ok(Math.abs(state.rootOverflow) <= 2, `${state.mode} ${label} root has horizontal overflow: ${state.rootOverflow}px`);
    assert.ok(state.documentOverflow <= 2, `${state.mode} ${label} document has horizontal overflow: ${state.documentOverflow}px`);
    assert.deepStrictEqual(state.overflowIssues, [], `${state.mode} ${label} visible overflow issues: ${JSON.stringify(state.overflowIssues)}`);
    assert.ok(state.focusRect && state.focusRect.width > 120 && state.focusRect.height > 40, `${state.mode} ${label} focus surface is not usable`);
    assert.ok(state.focusHitOk, `${state.mode} ${label} focus surface is visually covered at center by ${state.focusHitSelector || 'unknown element'}`);
    if (state.mode === 'mobile') {
        assert.strictEqual(state.bodyMobileQuery, 'true', 'mobile viewport was not detected');
        assert.strictEqual(state.bodyMobileArchitecture, 'apk-v2', 'mobile shell architecture did not activate');
        assert.strictEqual(state.tabsOverlapFocus, false, `mobile bottom tabs overlap ${label}`);
        assert.strictEqual(state.topShellOverlapFocus, false, `mobile top shell overlaps ${label}`);
        assert.strictEqual(state.topbarOverlapFocus, false, `mobile topbar overlaps ${label}`);
    }
}

function assertUploadLayout(state) {
    assertSectionLayout(state, 'upload');
}

function assertStudentDetailsLayout(state) {
    assertSectionLayout(state, 'student-details');
}

function assertReportGeneratorLayout(state) {
    assertSectionLayout(state, 'report-generator');
}

function assertSummaryLayout(state) {
    assertSectionLayout(state, 'summary');
}

function assertTeacherAnalysisLayout(state) {
    assertSectionLayout(state, 'teacher-analysis');
}

function assertCorrelationAnalysisLayout(state) {
    assertSectionLayout(state, 'correlation-analysis');
}

function assertProgressAnalysisLayout(state) {
    assertSectionLayout(state, 'progress-analysis');
}

async function inspectCohortGrowthLayout(page, mode) {
    const mobileOnlySelectors = mode === 'mobile'
        ? {
            volatilityMobileCardTable: '#cohort-volatility-table.mobile-card-table',
            growthMobileLabels: '#cohort-growth-table tbody td[data-label]',
            growthMobileCardTable: '#cohort-growth-table.mobile-card-table'
        }
        : {};
    return inspectSectionLayout(page, mode, {
        sectionId: 'cohort-growth',
        targetSelector: '#cohort-growth',
        requiredSelectors: {
            shellHead: '#cohort-growth .analysis-shell-head',
            actions: '#cohort-growth .cohort-growth-actions .btn',
            infoBand: '#cohort-growth .analysis-info-band',
            docPanel: '#cohort-growth .analysis-doc-panel',
            flow: '#cohort-growth .analysis-flow-step',
            growthGrid: '#cohort-growth .cohort-growth-grid',
            volatilityPanel: '#cohort-growth .cohort-volatility-panel',
            volatilityTable: '#cohort-volatility-table',
            volatilityRows: '#cohort-volatility-table tbody tr',
            rankPanel: '#cohort-growth .cohort-rank-panel',
            growthTable: '#cohort-growth-table',
            growthRows: '#cohort-growth-table tbody tr',
            ...mobileOnlySelectors
        }
    });
}

function assertCohortGrowthLayout(state) {
    assertSectionLayout(state, 'cohort-growth');
}

async function inspectMarginalPushLayout(page, mode) {
    const mobileOnlySelectors = mode === 'mobile'
        ? {
            ticketMobileLabels: '#marginal-push .ticket-table tbody td[data-label]',
            mobileTicket: '#marginal-push .task-ticket'
        }
        : {};
    return inspectSectionLayout(page, mode, {
        sectionId: 'marginal-push',
        targetSelector: '#marginal-push',
        requiredSelectors: {
            shellHead: '#marginal-push .analysis-shell-head',
            actions: '#marginal-push .marginal-actions .btn',
            infoBand: '#marginal-push .analysis-info-band',
            docPanel: '#marginal-push .analysis-doc-panel',
            flow: '#marginal-push .analysis-flow-step',
            filterPanel: '#marginal-push .marginal-filter-panel',
            filterGrid: '#marginal-push .marginal-filter-grid',
            schoolSelect: '#mpSchoolSelect',
            classSelect: '#mpClassSelect',
            subjectSelect: '#mpSubjectSelect',
            gapInput: '#mpGap',
            typeSelect: '#mpType',
            cyclePanel: '#marginal-push .marginal-cycle-panel',
            saveName: '#mp_save_name',
            snapshotSelect: '#mp_snapshot_select',
            previewPanel: '#mp-tickets-container',
            ticketSurface: '#mp-tickets-container .task-ticket, #mp-tickets-container .marginal-empty-state',
            ...mobileOnlySelectors
        }
    });
}

function assertMarginalPushLayout(state) {
    assertSectionLayout(state, 'marginal-push');
}

async function inspectSeatAdjustmentLayout(page, mode) {
    const mobileOnlySelectors = mode === 'mobile'
        ? {
            scrollStage: '#seat-adjustment .seat-stage-scroll',
            mobileDesk: '#seat-adjustment .desk:not(.desk-empty)'
        }
        : {};
    return inspectSectionLayout(page, mode, {
        sectionId: 'seat-adjustment',
        targetSelector: '#seat-adjustment',
        requiredSelectors: {
            shellHead: '#seat-adjustment .analysis-shell-head',
            actions: '#seat-adjustment .seat-adjustment-actions .btn',
            infoBand: '#seat-adjustment .analysis-info-band',
            docPanel: '#seat-adjustment .analysis-doc-panel',
            flow: '#seat-adjustment .analysis-flow-step',
            configPanel: '#seat-adjustment .seat-config-panel',
            configGrid: '#seat-adjustment .seat-config-grid',
            constraintPanel: '#seat-adjustment .seat-constraint-panel',
            constraintGrid: '#seat-adjustment .seat-constraint-grid',
            schoolSelect: '#seatAdjSchoolSelect',
            classSelect: '#seatAdjClassSelect',
            groupsInput: '#seatAdjGroups',
            colsInput: '#seatAdjCols',
            strategySelect: '#seatAdjStrategy',
            workspace: '#seat-adj-workspace:not(.hidden)',
            tools: '#seat-adjustment .seat-adj-tools',
            strategyDesc: '#seat-strategy-desc',
            legend: '#seat-adjustment .seat-legend-chip',
            stats: '#seat-stats',
            canvas: '#seat-adjustment .seat-adj-canvas',
            countDisplay: '#seat-count-display',
            seatContainer: '#seat-adj-container',
            desks: '#seat-adj-container .desk:not(.desk-empty)',
            ...mobileOnlySelectors
        }
    });
}

function assertSeatAdjustmentLayout(state) {
    assertSectionLayout(state, 'seat-adjustment');
}

async function openDataManager(page, tab = 'student') {
    await page.evaluate(() => {
        if (window.DataManager && typeof window.DataManager.open === 'function') {
            window.DataManager.open();
        }
    });
    await page.waitForFunction(() => {
        const modal = document.getElementById('data-manager-modal');
        return !!modal && getComputedStyle(modal).display !== 'none';
    }, null, { timeout: 45000 });
    await page.evaluate((targetTab) => window.DataManager?.switchTab?.(targetTab), tab).catch(() => {});
    await page.waitForTimeout(700);
}

async function inspectDataManagerLayout(page, mode, tab = 'student') {
    await openDataManager(page, tab);
    return page.evaluate((layoutMode) => {
        function isVisible(el) {
            if (!el) return false;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            if (rect.right < -100 || rect.bottom < -100 || rect.left > window.innerWidth + 100 || rect.top > window.innerHeight + 100) return false;
            return rect.width > 1 && rect.height > 1;
        }

        function isRendered(el) {
            if (!el) return false;
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 1 && rect.height > 1;
        }

        function selectorFor(el) {
            if (!el) return '';
            if (el.id) return `#${el.id}`;
            const classes = Array.from(el.classList || []).slice(0, 3).join('.');
            const tag = String(el.tagName || '').toLowerCase();
            return classes ? `${tag}.${classes}` : tag;
        }

        function hasManagedHorizontalScroll(el, boundary) {
            let node = el.parentElement;
            while (node && node !== boundary && node !== document.body && node !== document.documentElement) {
                const style = getComputedStyle(node);
                const managesOverflow = ['auto', 'scroll', 'hidden', 'clip'].includes(style.overflowX);
                if (managesOverflow && node.scrollWidth > node.clientWidth + 2) return true;
                node = node.parentElement;
            }
            return false;
        }

        function toRect(selector) {
            const el = document.querySelector(selector);
            if (!isVisible(el)) return null;
            const rect = el.getBoundingClientRect();
            return {
                selector,
                left: Math.round(rect.left),
                right: Math.round(rect.right),
                top: Math.round(rect.top),
                bottom: Math.round(rect.bottom),
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            };
        }

        const viewportWidth = Math.round(document.documentElement.clientWidth || window.innerWidth || 0);
        const viewportHeight = Math.round(document.documentElement.clientHeight || window.innerHeight || 0);
        const modal = document.getElementById('data-manager-modal');
        const content = modal?.querySelector('.modal-content');
        const contentRect = toRect('#data-manager-modal .modal-content');
        const tabBar = document.getElementById('tab-data-stu')?.parentElement;
        const tabBarRect = tabBar && isVisible(tabBar)
            ? (() => {
                const rect = tabBar.getBoundingClientRect();
                return {
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    top: Math.round(rect.top),
                    bottom: Math.round(rect.bottom),
                    width: Math.round(rect.width),
                    height: Math.round(rect.height)
                };
            })()
            : null;
        const activeTab = document.querySelector('#data-manager-modal .login-tab.active');
        const visibleArea = ['dm-student-table', 'dm-teacher-area', 'dm-params-area', 'dm-targets-area', 'dm-sql-area', 'dm-cloud-area']
            .map((id) => document.getElementById(id))
            .find(isRendered);
        const scope = content || document.body;
        const overflowIssues = Array.from(scope.querySelectorAll('*'))
            .filter(isVisible)
            .map((el) => {
                const rect = el.getBoundingClientRect();
                const style = getComputedStyle(el);
                return {
                    selector: selectorFor(el),
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    width: Math.round(rect.width),
                    position: style.position,
                    tag: String(el.tagName || '').toLowerCase(),
                    scrollManaged: hasManagedHorizontalScroll(el, scope)
                };
            })
            .filter((item) => {
                if (item.position === 'fixed') return false;
                if (item.scrollManaged) return false;
                if (item.right <= viewportWidth + 2 && item.left >= -2) return false;
                if (/table|thead|tbody|tr|th|td/.test(item.tag)) return false;
                return true;
            })
            .slice(0, 12);

        return {
            mode: layoutMode,
            modalVisible: !!modal && getComputedStyle(modal).display !== 'none',
            currentTab: String(window.DataManager?.currentTab || ''),
            viewportWidth,
            viewportHeight,
            contentRect,
            tabBarRect,
            activeTabText: String(activeTab?.textContent || '').trim(),
            visibleAreaSelector: selectorFor(visibleArea),
            overflowIssues,
            contentScrollWidth: content ? Math.round(content.scrollWidth) : 0,
            contentClientWidth: content ? Math.round(content.clientWidth) : 0,
            requiredPieces: {
                intro: !!document.getElementById('dm-layout-intro'),
                workflow: !!document.getElementById('dm-workflow-strip'),
                tabBar: !!tabBar,
                activeTab: !!activeTab,
                visibleArea: !!visibleArea
            }
        };
    }, mode);
}

function assertDataManagerLayout(state, expectedTab) {
    assert.ok(state.modalVisible, `${state.mode} data manager modal is not visible`);
    assert.strictEqual(state.currentTab, expectedTab, `${state.mode} data manager tab mismatch`);
    for (const [key, exists] of Object.entries(state.requiredPieces)) {
        assert.ok(exists, `${state.mode} data manager required piece missing: ${key}`);
    }
    assert.ok(state.contentRect, `${state.mode} data manager content is not visible`);
    assert.ok(state.contentRect.left >= -1 && state.contentRect.top >= -1, `${state.mode} data manager content starts outside viewport`);
    assert.ok(state.contentRect.right <= state.viewportWidth + 1, `${state.mode} data manager content exceeds viewport width`);
    assert.ok(state.contentRect.bottom <= state.viewportHeight + 1, `${state.mode} data manager content exceeds viewport height`);
    assert.ok(state.tabBarRect && state.tabBarRect.height >= 32, `${state.mode} data manager tab strip is not usable`);
    assert.ok(state.tabBarRect.top >= state.contentRect.top - 1 && state.tabBarRect.bottom <= state.contentRect.bottom + 1, `${state.mode} data manager tab strip is outside the modal viewport`);
    assert.ok(state.contentScrollWidth - state.contentClientWidth <= 2, `${state.mode} data manager content has horizontal overflow`);
    assert.deepStrictEqual(state.overflowIssues, [], `${state.mode} data manager visible overflow issues: ${JSON.stringify(state.overflowIssues)}`);
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const messages = [];
    const makePage = async (options) => {
        const page = await browser.newPage(options);
        page.on('console', (msg) => {
            if (msg.type() === 'error' || msg.type() === 'warning') messages.push(`${msg.type()}: ${msg.text()}`);
        });
        page.on('pageerror', (error) => messages.push(`pageerror: ${error.message}`));
        return page;
    };

    const desktopPage = await makePage({ viewport: { width: 1440, height: 1000 } });
    await loginAndEnterCohort(desktopPage);
    await openUploadModule(desktopPage);
    const desktopState = await inspectUploadLayout(desktopPage, 'desktop');
    assertUploadLayout(desktopState);
    await openSummaryModule(desktopPage);
    const desktopSummaryState = await inspectSummaryLayout(desktopPage, 'desktop');
    assertSummaryLayout(desktopSummaryState);
    await openTeacherAnalysisModule(desktopPage);
    const desktopTeacherState = await inspectTeacherAnalysisLayout(desktopPage, 'desktop');
    assertTeacherAnalysisLayout(desktopTeacherState);
    await openCorrelationAnalysisModule(desktopPage);
    const desktopCorrelationState = await inspectCorrelationAnalysisLayout(desktopPage, 'desktop');
    assertCorrelationAnalysisLayout(desktopCorrelationState);
    await openProgressAnalysisModule(desktopPage);
    const desktopProgressState = await inspectProgressAnalysisLayout(desktopPage, 'desktop');
    assertProgressAnalysisLayout(desktopProgressState);
    await openMarginalPushModule(desktopPage);
    const desktopMarginalPushState = await inspectMarginalPushLayout(desktopPage, 'desktop');
    assertMarginalPushLayout(desktopMarginalPushState);
    await openSeatAdjustmentModule(desktopPage);
    const desktopSeatAdjustmentState = await inspectSeatAdjustmentLayout(desktopPage, 'desktop');
    assertSeatAdjustmentLayout(desktopSeatAdjustmentState);
    await openCohortGrowthModule(desktopPage);
    const desktopCohortGrowthState = await inspectCohortGrowthLayout(desktopPage, 'desktop');
    assertCohortGrowthLayout(desktopCohortGrowthState);
    await openStudentDetailsModule(desktopPage);
    const desktopStudentState = await inspectStudentDetailsLayout(desktopPage, 'desktop');
    assertStudentDetailsLayout(desktopStudentState);
    await openReportGeneratorModule(desktopPage);
    const desktopReportState = await inspectReportGeneratorLayout(desktopPage, 'desktop');
    assertReportGeneratorLayout(desktopReportState);
    const desktopDataManagerState = await inspectDataManagerLayout(desktopPage, 'desktop', 'student');
    assertDataManagerLayout(desktopDataManagerState, 'student');
    await desktopPage.close();

    const mobilePage = await makePage({
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
        deviceScaleFactor: 3
    });
    await loginAndEnterCohort(mobilePage);
    await ensureMobileShell(mobilePage);
    await openUploadModule(mobilePage);
    const mobileState = await inspectUploadLayout(mobilePage, 'mobile');
    assertUploadLayout(mobileState);
    await openSummaryModule(mobilePage);
    const mobileSummaryState = await inspectSummaryLayout(mobilePage, 'mobile');
    assertSummaryLayout(mobileSummaryState);
    await openTeacherAnalysisModule(mobilePage);
    const mobileTeacherState = await inspectTeacherAnalysisLayout(mobilePage, 'mobile');
    assertTeacherAnalysisLayout(mobileTeacherState);
    await openCorrelationAnalysisModule(mobilePage);
    const mobileCorrelationState = await inspectCorrelationAnalysisLayout(mobilePage, 'mobile');
    assertCorrelationAnalysisLayout(mobileCorrelationState);
    await openProgressAnalysisModule(mobilePage);
    const mobileProgressState = await inspectProgressAnalysisLayout(mobilePage, 'mobile');
    assertProgressAnalysisLayout(mobileProgressState);
    await openMarginalPushModule(mobilePage);
    const mobileMarginalPushState = await inspectMarginalPushLayout(mobilePage, 'mobile');
    assertMarginalPushLayout(mobileMarginalPushState);
    await openSeatAdjustmentModule(mobilePage);
    const mobileSeatAdjustmentState = await inspectSeatAdjustmentLayout(mobilePage, 'mobile');
    assertSeatAdjustmentLayout(mobileSeatAdjustmentState);
    await openCohortGrowthModule(mobilePage);
    const mobileCohortGrowthState = await inspectCohortGrowthLayout(mobilePage, 'mobile');
    assertCohortGrowthLayout(mobileCohortGrowthState);
    await openStudentDetailsModule(mobilePage);
    const mobileStudentState = await inspectStudentDetailsLayout(mobilePage, 'mobile');
    assertStudentDetailsLayout(mobileStudentState);
    await openReportGeneratorModule(mobilePage);
    const mobileReportState = await inspectReportGeneratorLayout(mobilePage, 'mobile');
    assertReportGeneratorLayout(mobileReportState);
    const mobileDataManagerState = await inspectDataManagerLayout(mobilePage, 'mobile', 'student');
    assertDataManagerLayout(mobileDataManagerState, 'student');
    await mobilePage.close();

    await browser.close();

    const actionableMessages = messages.filter((message) => !isIgnorableMessage(message));
    assert.ok(
        !actionableMessages.some((message) => /ReferenceError|TypeError|pageerror/i.test(message)),
        `layout smoke console errors found: ${actionableMessages.join('\n')}`
    );

    console.log(JSON.stringify({
        desktopState,
        desktopSummaryState,
        desktopTeacherState,
        desktopCorrelationState,
        desktopProgressState,
        desktopMarginalPushState,
        desktopSeatAdjustmentState,
        desktopCohortGrowthState,
        desktopStudentState,
        desktopReportState,
        desktopDataManagerState,
        mobileState,
        mobileSummaryState,
        mobileTeacherState,
        mobileCorrelationState,
        mobileProgressState,
        mobileMarginalPushState,
        mobileSeatAdjustmentState,
        mobileCohortGrowthState,
        mobileStudentState,
        mobileReportState,
        mobileDataManagerState,
        actionableMessages
    }, null, 2));
}

main().catch(async (error) => {
    console.error(error);
    process.exit(1);
});
