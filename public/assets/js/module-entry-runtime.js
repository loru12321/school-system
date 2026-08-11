(() => {
    if (typeof window === 'undefined' || window.__MODULE_ENTRY_RUNTIME_PATCHED__) return;

    const TEACHING_MANAGEMENT_MODULE_IDS = new Set([
        'teaching-overview',
        'teaching-issue-board',
        'teaching-warning-center',
        'teaching-rectify-center',
        'teaching-version-center'
    ]);
    const TEACHER_INSIGHT_MODULE_IDS = new Set([
        'teacher-analysis',
        'teacher-detail-comparison',
        'teacher-pairing',
        'teacher-township-ranking',
        'cohort-growth'
    ]);
    const STUDENT_DIAGNOSIS_MODULE_IDS = new Set([
        'zhongkao-countdown',
        'student-overview',
        'student-details',
        'blank-score-audit',
        'subject-balance',
        'marginal-push',
        'progress-analysis',
        'cohort-growth',
        'potential-analysis',
        'segment-analysis',
        'correlation-analysis',
        'report-generator'
    ]);
    const TEACHER_ANALYSIS_RENDER_DELAY_MS = 16;
    const TEACHER_ANALYSIS_PRELOAD_DELAY_MS = 700;
    const TEACHER_ANALYSIS_ENTRY_LABELS = [
        'teacher-analysis-auto-render',
        'teacher-analysis-preload-map',
        'teacher-analysis-compare-selects',
        'teacher-analysis-infer-school'
    ];
    const TEACHER_ANALYSIS_RENDER_LABELS = [
        'teacher-analysis-render-work',
        'teacher-analysis-render-cards',
        'teacher-analysis-render-comparison',
        'teacher-analysis-render-pairing',
        'teacher-analysis-render-overview',
        'teacher-analysis-render-township',
        'teacher-analysis-render-state-bars',
        'teacher-compare-auto'
    ];
    const TEACHER_ANALYSIS_PHASE_LABELS = TEACHER_ANALYSIS_ENTRY_LABELS.concat(TEACHER_ANALYSIS_RENDER_LABELS);
    const fallbackScheduledTasks = new Map();
    let teacherAnalysisRenderToken = 0;
    let moduleEntryEpoch = 0;
    let lastModuleEntry = { id: '', at: 0, promise: null };
    let teacherAnalysisReuseState = null;

    function buildTeacherMapReuseSignature(map) {
        if (!map || typeof map !== 'object') return '';
        return Object.entries(map)
            .map(([key, value]) => `${String(key)}:${String(value ?? '')}`)
            .sort((a, b) => a.localeCompare(b, 'zh-CN', { numeric: true }))
            .join('|');
    }

    function readTeacherAnalysisReuseState() {
        const user = typeof window.getCurrentUser === 'function'
            ? window.getCurrentUser()
            : window.Auth?.currentUser;
        return {
            rawData: window.RAW_DATA,
            rawDataVersion: Number(window.__RAW_DATA_VERSION || 0),
            teacherMapSignature: buildTeacherMapReuseSignature(window.TEACHER_MAP),
            teacherSchoolMapSignature: buildTeacherMapReuseSignature(window.TEACHER_SCHOOL_MAP),
            examId: String(window.CURRENT_EXAM_ID || localStorage.getItem('CURRENT_EXAM_ID') || ''),
            school: String(window.MY_SCHOOL || localStorage.getItem('MY_SCHOOL') || ''),
            user: String(user?.username || user?.name || user?.role || '')
        };
    }

    function canReuseTeacherAnalysisStats() {
        if (!teacherAnalysisReuseState || !window.TEACHER_STATS
            || Object.keys(window.TEACHER_STATS).length === 0) return false;
        const current = readTeacherAnalysisReuseState();
        return current.rawData === teacherAnalysisReuseState.rawData
            && current.rawDataVersion === teacherAnalysisReuseState.rawDataVersion
            && current.teacherMapSignature === teacherAnalysisReuseState.teacherMapSignature
            && current.teacherSchoolMapSignature === teacherAnalysisReuseState.teacherSchoolMapSignature
            && current.examId === teacherAnalysisReuseState.examId
            && current.school === teacherAnalysisReuseState.school
            && current.user === teacherAnalysisReuseState.user;
    }

    function markTeacherAnalysisStatsReusable() {
        if (window.TEACHER_STATS && Object.keys(window.TEACHER_STATS).length > 0) {
            teacherAnalysisReuseState = readTeacherAnalysisReuseState();
        }
    }

    function renderReusableTeacherPairingNow(moduleId = 'teacher-analysis') {
        if (moduleId !== 'teacher-pairing'
            || !isTeacherAnalysisModuleActive(moduleId)
            || window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__ !== true
            || window.__TEACHER_PAIRING_RUNTIME_PATCHED__ !== true
            || typeof window.analyzeTeachers !== 'function'
            || typeof window.generateTeacherPairing !== 'function'
            || !canReuseTeacherAnalysisStats()) return false;

        if (typeof window.TeachingManagementModulesRuntime?.relocateTeacherBlocks === 'function') {
            window.TeachingManagementModulesRuntime.relocateTeacherBlocks();
        }
        window.generateTeacherPairing();
        const section = document.getElementById('teacher-pairing');
        if (section) section.dataset.teacherSubmoduleRendered = '1';
        return true;
    }

    function getModuleTaskKey(label) {
        return `module-entry:${String(label || 'task').trim()}`;
    }

    function clearModuleTask(label) {
        const key = getModuleTaskKey(label);
        if (window.SystemPerformance && typeof window.SystemPerformance.clearScheduledTask === 'function') {
            window.SystemPerformance.clearScheduledTask(key);
        }
        if (fallbackScheduledTasks.has(key)) {
            window.clearTimeout(fallbackScheduledTasks.get(key));
            fallbackScheduledTasks.delete(key);
        }
    }

    function scheduleModuleTask(label, task, options = {}) {
        const key = getModuleTaskKey(label);
        if (window.SystemPerformance && typeof window.SystemPerformance.scheduleTask === 'function') {
            return window.SystemPerformance.scheduleTask(key, task, options);
        }
        clearModuleTask(label);
        const delay = Math.max(0, Number(options.delay || 0));
        const run = () => {
            fallbackScheduledTasks.delete(key);
            try {
                task();
            } catch (error) {
                console.warn(`[module-entry:${label}]`, error);
            }
        };
        const timerId = window.setTimeout(() => {
            if (options.frame && typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(run);
            } else {
                run();
            }
        }, delay);
        fallbackScheduledTasks.set(key, timerId);
        return key;
    }

    function scheduleModuleTaskPromise(label, task, options = {}) {
        return new Promise((resolve, reject) => {
            scheduleModuleTask(label, () => {
                try {
                    resolve(task());
                } catch (error) {
                    reject(error);
                }
            }, options);
        });
    }

    function ensureModuleStylesFor(id) {
        if (typeof window.ensureOptionalStylesheetLoaded !== 'function') return Promise.resolve();
        const loaders = [];

        if (TEACHING_MANAGEMENT_MODULE_IDS.has(id)) {
            loaders.push(window.ensureOptionalStylesheetLoaded(
                'teaching-management-module',
                './assets/css/teaching-management-module.css'
            ));
        }

        if (TEACHER_INSIGHT_MODULE_IDS.has(id)) {
            loaders.push(window.ensureOptionalStylesheetLoaded(
                'teacher-insights-module',
                './assets/css/teacher-insights-module.css'
            ));
        }

        if (!loaders.length) return Promise.resolve();
        return Promise.all(loaders).then(() => undefined);
    }

    function activateTeachingManagementModule(id = 'teaching-overview') {
        const moduleId = String(id || 'teaching-overview').trim() || 'teaching-overview';
        if (!TEACHING_MANAGEMENT_MODULE_IDS.has(moduleId)) return false;
        const scheduleTeachingRender = (label, task, options = {}) => {
            scheduleModuleTask(`teaching-management:${label}`, () => {
                if (!document.getElementById(moduleId)?.classList.contains('active')) return;
                task();
            }, { delay: 40, frame: true, ...options });
        };

        if (moduleId === 'teaching-overview') {
            if (typeof window.tmScheduleTeachingOverviewRender === 'function') {
                window.tmScheduleTeachingOverviewRender();
            } else if (typeof window.renderTeachingOverview === 'function') {
                scheduleTeachingRender('overview', window.renderTeachingOverview, { delay: 16 });
            }
            return true;
        }

        if (moduleId === 'teaching-issue-board' && typeof window.tmRenderIssueBoard === 'function') {
            scheduleTeachingRender('issue-board', window.tmRenderIssueBoard);
            return true;
        }
        if (moduleId === 'teaching-warning-center' && typeof window.tmRenderWarningCenter === 'function') {
            scheduleTeachingRender('warning-center', () => {
                window.tmRenderWarningCenter();
                if (typeof window.tmRefreshCloudOps === 'function') window.tmRefreshCloudOps(false);
            });
            return true;
        }
        if (moduleId === 'teaching-rectify-center' && typeof window.tmRenderRectifyCenter === 'function') {
            scheduleTeachingRender('rectify-center', () => {
                window.tmRenderRectifyCenter();
                if (typeof window.tmRefreshCloudOps === 'function') window.tmRefreshCloudOps(false);
            });
            return true;
        }
        if (moduleId === 'teaching-version-center' && typeof window.tmRenderVersionCenter === 'function') {
            scheduleTeachingRender('version-center', window.tmRenderVersionCenter);
            return true;
        }
        return false;
    }

    function renderSingleSchoolAnalysisHint() {
        const hint = document.getElementById('analysis-local-hint');
        if (hint) hint.remove();
    }

    function syncModuleDescBar(sectionId, currentCategoryMeta) {
        const activeSection = document.getElementById(sectionId);
        if (!activeSection || !currentCategoryMeta) return;
        const descBar = activeSection.querySelector('.module-desc-bar');
        if (!descBar) return;
        descBar.style.borderLeftColor = currentCategoryMeta.color;
        const descTitle = descBar.querySelector('h3');
        if (descTitle) descTitle.style.color = '#333';
    }

    function syncModuleEnterChrome(context) {
        const { id, currentCategory, currentCategoryMeta } = context;
        const reportResult = document.getElementById('single-report-result');
        // Entering another module should clear the old report surface. Do not hide
        // it while entering the report module itself: its lazy entry work can run
        // after doQuery() has rendered, which otherwise creates a visible-content
        // race on slower devices.
        if (reportResult && id !== 'report-generator') reportResult.classList.add('hidden');
        const compareSection = document.getElementById('student-multi-period-compare-section');
        if (compareSection) compareSection.style.display = 'none';
        syncModuleDescBar(id, currentCategoryMeta);
        if (typeof syncShellChromeBridge === 'function') syncShellChromeBridge(id);
        if (typeof ensureModuleHelpButton === 'function') ensureModuleHelpButton(id);
        if (currentCategory === 'town' && typeof ensureTownSubmoduleCompareUIs === 'function') {
            scheduleModuleTask('town-submodule-compare-ui', () => {
                if (typeof ensureTownSubmoduleCompareUIs === 'function') ensureTownSubmoduleCompareUIs(id);
            }, { delay: 420, idle: true, timeout: 1800 });
        }
        if (typeof window.applyComparisonPanelCollapses === 'function') {
            scheduleModuleTask('comparison-panel-collapse-enter', () => {
                window.applyComparisonPanelCollapses(document.getElementById(id) || document);
            }, { delay: 120, idle: true, timeout: 800 });
        }
        // 前置条件状态条只读现有状态，不触发重算。摘要页随后会调度一次
        // calcSummary；若仍等到 idle 阶段，重算会先占住主线程，状态条可能在
        // 首屏校验时缺失。摘要页改在下一帧注入，其他试点模块仍保持 idle。
        // 内部按模块 id 过滤，非试点模块直接返回。
        if (window.PrerequisiteStatus && typeof window.PrerequisiteStatus.refresh === 'function') {
            scheduleModuleTask('prerequisite-status-enter', () => {
                window.PrerequisiteStatus.refresh(id);
            }, id === 'summary'
                ? { frame: true }
                : { delay: 160, idle: true, timeout: 1200 });
        }
    }

    function isTeacherAnalysisActive() {
        return !!(
            document.getElementById('teacher-analysis')?.classList.contains('active')
            || document.getElementById('teacher-detail-comparison')?.classList.contains('active')
            || document.getElementById('teacher-pairing')?.classList.contains('active')
            || document.getElementById('teacher-township-ranking')?.classList.contains('active')
        );
    }

    function isTeacherAnalysisModuleActive(moduleId = 'teacher-analysis') {
        return !!document.getElementById(String(moduleId || 'teacher-analysis').trim())?.classList.contains('active');
    }

    function clearTeacherAnalysisDeferredRender() {
        teacherAnalysisRenderToken += 1;
        TEACHER_ANALYSIS_PHASE_LABELS.forEach(clearModuleTask);
    }

    function clearTeacherAnalysisRenderWork() {
        teacherAnalysisRenderToken += 1;
        TEACHER_ANALYSIS_RENDER_LABELS.forEach(clearModuleTask);
    }

    function runTeacherAnalysisIfCurrent(token, task) {
        if (token !== teacherAnalysisRenderToken || !isTeacherAnalysisActive()) return;
        task();
    }

    function scheduleTeacherAnalysisPhase(token, label, task, delay = 0) {
        scheduleModuleTask(label, () => runTeacherAnalysisIfCurrent(token, task), { delay, frame: delay <= 16 });
    }

    function scheduleModuleAutoRender(label, task, options = {}) {
        const delay = Number.isFinite(Number(options.delay)) ? Number(options.delay) : 120;
        const timeout = Number.isFinite(Number(options.timeout)) ? Number(options.timeout) : 1200;
        const run = () => {
            try {
                task();
            } catch (error) {
                console.warn(`[module-entry] ${label} auto render failed:`, error);
            }
        };
        scheduleModuleTask(label, run, { delay, idle: options.idle !== false, timeout });
    }

    function loadCompareSelectorsRuntime() {
        if (window.CompareSelectorsRuntime || typeof window.updateTeacherCompareExamSelects === 'function') {
            return Promise.resolve(true);
        }
        if (window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.loadScriptOnce === 'function') {
            return window.SystemRuntimeLoader.loadScriptOnce('compare-selectors', './assets/js/compare-selectors-runtime.js');
        }
        if (window.__COMPARE_SELECTORS_RUNTIME_PROMISE__) return window.__COMPARE_SELECTORS_RUNTIME_PROMISE__;
        window.__COMPARE_SELECTORS_RUNTIME_PROMISE__ = new Promise((resolve, reject) => {
            const existing = document.querySelector('script[data-runtime-key="compare-selectors"]');
            if (existing) {
                existing.addEventListener('load', () => resolve(true), { once: true });
                existing.addEventListener('error', reject, { once: true });
                return;
            }
            const script = document.createElement('script');
            script.src = './assets/js/compare-selectors-runtime.js';
            script.async = false;
            script.dataset.runtimeKey = 'compare-selectors';
            script.onload = () => resolve(true);
            script.onerror = reject;
            document.head.appendChild(script);
        }).catch((error) => {
            delete window.__COMPARE_SELECTORS_RUNTIME_PROMISE__;
            throw error;
        });
        return window.__COMPARE_SELECTORS_RUNTIME_PROMISE__;
    }

    function pickDefaultSelectValue(selectId, preferredValue = '') {
        const el = document.getElementById(selectId);
        if (!el) return false;
        const options = Array.from(el.options || []).filter(option => String(option.value || '').trim());
        if (!options.length) return false;
        const oldValue = String(el.value || '').trim();
        const preferred = String(preferredValue || '').trim();
        const matched = (preferred && options.find(option => String(option.value || '').trim() === preferred))
            || (oldValue && options.find(option => String(option.value || '').trim() === oldValue))
            || options[0];
        if (!matched) return false;
        const changed = el.value !== matched.value;
        el.value = matched.value;
        if (changed) el.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    function setTeacherComparisonTableState(message, detail = '') {
        const table = document.getElementById('teacherComparisonTable');
        if (!table) return false;
        table.classList.add('comparison-table');
        delete table.dataset.teacherComparisonSignature;
        table.innerHTML = `
            <tbody>
                <tr>
                    <td colspan="14">
                        <div class="analysis-empty-state">
                            ${message}
                            ${detail ? `<div style="margin-top:8px; color:#64748b; font-size:12px;">${detail}</div>` : ''}
                        </div>
                    </td>
                </tr>
            </tbody>
        `;
        return true;
    }

    function showTeacherAnalysisPendingState(moduleId = 'teacher-analysis') {
        const targetModuleId = String(moduleId || 'teacher-analysis').trim();
        const placeholders = targetModuleId === 'teacher-analysis'
            ? [['teacherCardsContainer', '正在后台生成教师画像。']]
            : (targetModuleId === 'teacher-township-ranking'
                ? [['teacher-township-ranking-container', '正在生成教师乡镇排名。']]
                : []);
        if (targetModuleId === 'teacher-detail-comparison') {
            setTeacherComparisonTableState('正在整理教师对比表。', '页面会自动刷新结果，也可点击上方按钮手动刷新。');
        }
        placeholders.forEach(([id, message]) => {
            const node = document.getElementById(id);
            if (!node) return;
            const currentHtml = String(node.innerHTML || '').trim();
            if (currentHtml && node.dataset.released !== 'true') return;
            node.innerHTML = `
                <div class="analysis-empty-state">
                    ${message}
                    <div style="margin-top:8px; color:#64748b; font-size:12px;">页面会自动刷新结果，也可点击上方按钮手动刷新。</div>
                </div>
            `;
        });
    }

    function scheduleTeacherCompareAutoRender(delay = 760) {
        const token = teacherAnalysisRenderToken;
        scheduleModuleAutoRender('teacher-compare-auto', () => {
            if (token !== teacherAnalysisRenderToken || !isTeacherAnalysisActive()) return;
            const run = () => {
                if (token !== teacherAnalysisRenderToken || !isTeacherAnalysisActive()) return;
                if (typeof updateTeacherCompareExamSelects === 'function') updateTeacherCompareExamSelects();
                if (typeof pickTeacherCompareDefaultSubjectAndTeacher === 'function') pickTeacherCompareDefaultSubjectAndTeacher();
                const resultEl = document.getElementById('teacherCompareResult');
                const hintEl = document.getElementById('teacherCompareHint');
                if (resultEl && !resultEl.dataset.teacherCompareManualReady) {
                    resultEl.dataset.teacherCompareManualReady = '1';
                    resultEl.innerHTML = '<div class="analysis-empty-state analysis-empty-state-compact"><strong>教师多期对比待生成</strong>选择学校、学科、教师和期次后点击“重新生成教师对比”。</div>';
                }
                if (hintEl && !hintEl.dataset.teacherCompareManualReady) {
                    hintEl.dataset.teacherCompareManualReady = '1';
                    hintEl.textContent = '已准备好对比条件，点击按钮后生成多期结果。';
                }
            };
            const loaders = [];
            loaders.push(loadCompareSelectorsRuntime());
            if (typeof window.ensureTeacherCompareRuntimeLoaded === 'function'
                && !window.__TEACHER_COMPARE_RESULT_RUNTIME_PATCHED__) {
                loaders.push(window.ensureTeacherCompareRuntimeLoaded());
            }
            if (loaders.length) {
                Promise.all(loaders)
                    .then(run)
                    .catch((error) => console.warn('[teacher-analysis] teacher compare auto load failed:', error));
                return;
            }
            run();
        }, { label: 'teacher-compare-auto', delay, timeout: 1800 });
    }

    function scheduleTeacherAnalysisRenderWork(delay = TEACHER_ANALYSIS_RENDER_DELAY_MS, moduleId = 'teacher-analysis') {
        clearTeacherAnalysisRenderWork();
        const token = teacherAnalysisRenderToken;
        const targetModuleId = String(moduleId || 'teacher-analysis').trim();
        showTeacherAnalysisPendingState(targetModuleId);

        scheduleModuleTask('teacher-analysis-render-work', () => {
            if (!isTeacherAnalysisModuleActive(targetModuleId)) return;
            runTeacherAnalysisIfCurrent(token, () => {
                const teacherMapReady = window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0;
                if (!teacherMapReady || typeof window.analyzeTeachers !== 'function') {
                    renderTeacherAnalysisEmptyState();
                    return;
                }

                if (targetModuleId === 'teacher-township-ranking') {
                    scheduleTeacherAnalysisPhase(token, 'teacher-analysis-render-township', () => {
                        const section = document.getElementById('teacher-township-ranking');
                        const container = document.getElementById('teacher-township-ranking-container');
                        const contentText = String(container?.textContent || '').trim();
                        if (section?.dataset.teacherSubmoduleRendered === '1'
                            && contentText
                            && !/^正在生成|^正在加载/.test(contentText)) return;
                        if (typeof window.TeachingManagementModulesRuntime?.ensureTeacherTownshipRankingSlotReady === 'function') window.TeachingManagementModulesRuntime.ensureTeacherTownshipRankingSlotReady();
                        if (typeof window.renderTeacherTownshipRanking === 'function') {
                            window.renderTeacherTownshipRanking();
                            if (section) section.dataset.teacherSubmoduleRendered = '1';
                        }
                    }, 0);
                    return;
                }

                const reusedTeacherAnalysisStats = canReuseTeacherAnalysisStats();
                if (!reusedTeacherAnalysisStats) {
                    window.analyzeTeachers({ render: false, township: false, historyLimit: 0 });
                    markTeacherAnalysisStatsReusable();
                }
                ['teacherCardsContainer', 'teacherComparisonTable', 'teacher-township-ranking-container'].forEach((id) => {
                    const node = document.getElementById(id);
                    if (node) delete node.dataset.released;
                });
                if (targetModuleId === 'teacher-analysis') scheduleTeacherAnalysisPhase(token, 'teacher-analysis-render-cards', () => {
                    if (typeof window.TeachingManagementModulesRuntime?.relocateTeacherBlocks === 'function') window.TeachingManagementModulesRuntime.relocateTeacherBlocks();
                    if (typeof window.renderTeacherCards === 'function') window.renderTeacherCards();
                }, 0);
                if (targetModuleId === 'teacher-pairing') {
                    const section = document.getElementById('teacher-pairing');
                    const container = document.getElementById('teacher-pairing-suggestions');
                    const contentText = String(container?.textContent || '').trim();
                    if (reusedTeacherAnalysisStats
                        && section?.dataset.teacherSubmoduleRendered === '1'
                        && contentText
                        && !/^正在加载/.test(contentText)) return;
                    if (typeof window.TeachingManagementModulesRuntime?.relocateTeacherBlocks === 'function') window.TeachingManagementModulesRuntime.relocateTeacherBlocks();
                    if (typeof window.generateTeacherPairing === 'function') {
                        window.generateTeacherPairing();
                        if (section) section.dataset.teacherSubmoduleRendered = '1';
                    }
                }
                if (targetModuleId === 'teacher-analysis') scheduleTeacherAnalysisPhase(token, 'teacher-analysis-render-overview', () => {
                    if (typeof window.tmScheduleTeachingOverviewRender === 'function') {
                        window.tmScheduleTeachingOverviewRender();
                    } else if (typeof window.renderTeachingOverview === 'function') {
                        window.renderTeachingOverview();
                    }
                }, 160);
                if (targetModuleId === 'teacher-analysis') scheduleTeacherAnalysisPhase(token, 'teacher-analysis-render-state-bars', () => {
                    if (typeof window.tmRenderTeachingModuleStateBars === 'function') window.tmRenderTeachingModuleStateBars('teacher-analysis');
                }, 260);
                if (targetModuleId === 'teacher-detail-comparison') {
                    const renderComparison = () => {
                        if (typeof window.TeachingManagementModulesRuntime?.relocateTeacherBlocks === 'function') window.TeachingManagementModulesRuntime.relocateTeacherBlocks();
                        if (typeof window.renderTeacherComparisonTable === 'function') {
                            window.renderTeacherComparisonTable();
                            const section = document.getElementById('teacher-detail-comparison');
                            if (section) section.dataset.teacherSubmoduleRendered = '1';
                        }
                    };
                    renderComparison();
                    scheduleTeacherAnalysisPhase(token, 'teacher-analysis-render-comparison', renderComparison, 700);
                }
                if (targetModuleId === 'teacher-analysis') scheduleTeacherAnalysisPhase(token, 'teacher-analysis-refresh-compare-selects', () => {
                    scheduleTeacherCompareAutoRender(0);
                }, 520);
            });
        }, { delay, idle: false, timeout: 700 });
    }

    function restoreTeacherMapFromLocalHistory() {
        if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) return true;

        try {
            if (window.DataManager && typeof window.DataManager.ensureTeacherMap === 'function') {
                window.DataManager.ensureTeacherMap(false);
            }
        } catch (error) {
            console.warn('[teacher-analysis] local teacher history restore failed:', error);
        }
        if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) return true;

        try {
            const preferredTerm = typeof window.getPreferredTeacherTermId === 'function'
                ? window.getPreferredTeacherTermId()
                : (typeof window.pickAutoTeacherTerm === 'function' ? window.pickAutoTeacherTerm() : '');
            if (preferredTerm && typeof window.applyTeacherTermWithoutPrompt === 'function') {
                window.applyTeacherTermWithoutPrompt(preferredTerm);
            }
        } catch (error) {
            console.warn('[teacher-analysis] preferred local teacher term restore failed:', error);
        }
        return !!(window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0);
    }

    function ensureTeacherAnalysisSectionLoaded() {
        let section = document.getElementById('teacher-analysis');
        if (!section) return null;
        if (section.dataset.lazySectionPlaceholder !== '1') return section;

        const wasActive = section.classList.contains('active');
        if (typeof window.ensureLazySectionLoaded === 'function') {
            const loaded = window.ensureLazySectionLoaded('teacher-analysis');
            section = loaded || document.getElementById('teacher-analysis');
        }
        if (!section || section.dataset.lazySectionPlaceholder !== '1') {
            if (wasActive && section) section.classList.add('active');
            return section;
        }

        const templateId = String(section.dataset.lazySectionTemplate || 'lazy-section-template-teacher-analysis').trim();
        const templateNode = document.getElementById(templateId);
        const html = String(templateNode?.textContent || '').trim();
        if (!html) return section;
        const parser = document.createElement('template');
        parser.innerHTML = html;
        const replacement = parser.content.firstElementChild;
        if (!replacement || replacement.id !== 'teacher-analysis') return section;
        if (wasActive) replacement.classList.add('active');
        section.replaceWith(replacement);
        templateNode.remove();
        return replacement;
    }

    function renderTeacherAnalysisAfterRuntimeReady(moduleId = 'teacher-analysis') {
        const targetModuleId = String(moduleId || 'teacher-analysis').trim();
        const render = () => {
            ensureTeacherAnalysisSectionLoaded();
            if (!isTeacherAnalysisModuleActive(targetModuleId)) return false;
            if (typeof window.analyzeTeachers !== 'function') {
                renderTeacherAnalysisEmptyState();
                return false;
            }
            scheduleTeacherAnalysisRenderWork(0, targetModuleId);
            return true;
        };
        const runtimeReady = window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__ === true
            && (targetModuleId !== 'teacher-pairing' || window.__TEACHER_PAIRING_RUNTIME_PATCHED__ === true);
        if (runtimeReady && typeof window.analyzeTeachers === 'function') return Promise.resolve(render());
        if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function') {
            return Promise.resolve(window.ensureTeacherAnalysisMainRuntimeLoaded())
                .then(render)
                .catch((error) => {
                    console.warn('[teacher-analysis] runtime load failed:', error);
                    if (isTeacherAnalysisActive()) renderTeacherAnalysisEmptyState();
                    return false;
                });
        }
        return Promise.resolve(render());
    }

    function waitForTeacherMapReady(options = {}) {
        if (restoreTeacherMapFromLocalHistory()) {
            return Promise.resolve(true);
        }
        if (!window.CloudManager || typeof window.CloudManager.loadTeachers !== 'function') {
            return Promise.resolve(false);
        }
        const timeoutMs = Number(options.timeoutMs || 3500);
        const loadTask = window.CloudManager.loadTeachers({ background: true, toast: false });
        const settledLoadTask = Promise.resolve(loadTask).then(() => restoreTeacherMapFromLocalHistory());
        const timeoutTask = new Promise((resolve) => window.setTimeout(() => resolve(false), timeoutMs));
        return Promise.race([settledLoadTask, timeoutTask]).then((ready) => (
            !!ready || restoreTeacherMapFromLocalHistory()
        )).catch((error) => {
            console.warn('[teacher-analysis] teacher map async load failed:', error);
            return false;
        });
    }

    function renderTeacherAnalysisNow() {
        if (!isTeacherAnalysisActive()) return;
        const run = () => {
            showTeacherAnalysisPendingState();
            waitForTeacherMapReady({ timeoutMs: 5000 }).then((ready) => {
                if (!isTeacherAnalysisActive()) return;
                if (!ready) {
                    renderTeacherAnalysisEmptyState();
                    return;
                }
                scheduleTeacherAnalysisRenderWork(0);
            });
        };
        if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function') {
            window.ensureTeacherAnalysisMainRuntimeLoaded().then(run).catch((error) => console.warn(error));
            return;
        }
        run();
    }

    function initStudentDetailsEntry() {
        updateStudentSchoolSelect();
        const user = getCurrentUser();
        const role = user?.role || 'guest';
        const canUseStudentMultiPeriod = role === 'admin' || role === 'director' || role === 'grade_director';
        const applyStudentDetailsRoleVisibility = () => {
            if (typeof window.applyRoleAllowVisibility === 'function') {
                window.applyRoleAllowVisibility(document.getElementById('student-details') || document);
            }
        };
        applyStudentDetailsRoleVisibility();
        scheduleModuleTask('student-details-compare-selects', () => {
            if (!document.getElementById('student-details')?.classList.contains('active')) return;
            applyStudentDetailsRoleVisibility();
            if (canUseStudentMultiPeriod && typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
            if (canUseStudentMultiPeriod && typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
            if (canUseStudentMultiPeriod
                && typeof window.ensureStudentCompareRuntimeLoaded === 'function'
                && !window.__STUDENT_COMPARE_RESULT_RUNTIME_PATCHED__) {
                window.ensureStudentCompareRuntimeLoaded().catch((error) => console.warn('student compare runtime failed:', error));
            }
        }, { delay: 1400, idle: true, timeout: 3200 });
        if (typeof window.ensureCountyAnalysisRuntimeLoaded === 'function'
            && !window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__) {
            scheduleModuleTask('student-details-county-runtime', () => {
                if (!document.getElementById('student-details')?.classList.contains('active')) return;
                window.ensureCountyAnalysisRuntimeLoaded().catch((error) => console.warn('student county rank runtime failed:', error));
            }, { delay: 260, idle: true, timeout: 1600 });
        }

        const triggerRender = () => {
            const section = document.getElementById('student-details');
            if (!section || !section.classList.contains('active')) return;
            applyStudentDetailsRoleVisibility();
            if (typeof window.renderStudentDetails === 'function') {
                const schoolValue = String(document.getElementById('studentSchoolSelect')?.value || '');
                const classValue = String(document.getElementById('studentClassSelect')?.value || '');
                const modeValue = String(document.getElementById('classTeacherViewMode')?.value || '');
                const entrySignature = [
                    window.__RAW_DATA_VERSION || 0,
                    Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
                    schoolValue,
                    classValue,
                    modeValue,
                    String(user?.role || ''),
                    Array.isArray(user?.roles) ? user.roles.join('|') : '',
                    String(user?.school || ''),
                    String(user?.class_name || user?.class || '')
                ].join('::');
                const renderedRows = document.querySelectorAll('#student-details table tbody tr').length;
                if (section.dataset.studentDetailsEntrySig === entrySignature && renderedRows > 1) {
                    return;
                }
                section.dataset.studentDetailsEntrySig = entrySignature;
                window.renderStudentDetails(true);
                applyStudentDetailsRoleVisibility();
            }
        };

        clearModuleTask('student-details-render-primary');
        clearModuleTask('student-details-render-fallback');
        window.__STUDENT_DETAILS_RENDER_TIMER__ = scheduleModuleTask('student-details-render-primary', triggerRender, {
            delay: 260,
            idle: true,
            timeout: 1800
        });
        scheduleModuleTask('student-details-render-fallback', () => {
            const section = document.getElementById('student-details');
            const renderedRows = document.querySelectorAll('#student-details table tbody tr').length;
            if (!section || !section.classList.contains('active')) return;
            if (renderedRows > 1) return;
            if (typeof window.renderStudentDetails === 'function') {
                window.renderStudentDetails(true);
            }
        }, { delay: 900, idle: true, timeout: 1200 });

        const multiPeriodSection = document.getElementById('student-multi-period-compare-section');
        if (!multiPeriodSection) return;

        if (canUseStudentMultiPeriod) {
            multiPeriodSection.style.display = 'block';
            const saveCloudBtn = multiPeriodSection.querySelector('[onclick="saveStudentCompareToCloud()"]');
            if (saveCloudBtn) saveCloudBtn.style.display = '';
        } else {
            multiPeriodSection.style.display = 'none';
        }
        applyStudentDetailsRoleVisibility();
    }

    function initTeachingManagementEntry(id) {
        const renderNow = () => {
            activateTeachingManagementModule(id);
        };

        const scheduleRender = (attempt = 0) => {
            if (typeof window.renderTeachingOverview === 'function') {
                renderNow();
                return true;
            }
            if (attempt >= 6) return false;
            scheduleModuleTask('teaching-management-render-retry', () => {
                scheduleRender(attempt + 1);
            }, { delay: attempt < 2 ? 120 : 260 });
            return false;
        };

        const loadRuntime = () => {
            if (window.__TEACHING_MANAGEMENT_RUNTIME_PATCHED__ || typeof window.renderTeachingOverview === 'function') {
                return Promise.resolve();
            }
            if (typeof window.ensureTeachingManagementRuntimeLoaded === 'function') {
                return window.ensureTeachingManagementRuntimeLoaded();
            }
            if (window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.load === 'function') {
                return window.SystemRuntimeLoader.load('teaching-management');
            }
            return Promise.reject(new Error('teaching management runtime loader unavailable'));
        };

        if (window.__TEACHING_MANAGEMENT_RUNTIME_PATCHED__ || typeof window.renderTeachingOverview === 'function') {
            scheduleRender();
            return Promise.resolve();
        }

        return loadRuntime()
            .then(() => {
                scheduleRender();
            })
            .catch((error) => {
                console.warn('initTeachingManagementEntry failed:', error);
                scheduleRender();
            });
    }

    function initStudentOverviewEntry() {
        const renderNow = () => {
            if (typeof updateStudentSchoolSelect === 'function') updateStudentSchoolSelect();
            if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
            if (typeof updateClassSelect === 'function') updateClassSelect();
            if (typeof window.smScheduleStudentOverviewRender === 'function') {
                window.smScheduleStudentOverviewRender();
            } else if (typeof window.renderStudentOverview === 'function') {
                window.renderStudentOverview();
            }
            const deferredSelectorUpdates = [
                () => { if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects(); },
                () => { if (typeof updateMarginalSchoolSelect === 'function') updateMarginalSchoolSelect(); },
                () => { if (typeof updateSubjectBalanceSelects === 'function') updateSubjectBalanceSelects(); },
                () => { if (typeof updatePotentialSchoolSelect === 'function') updatePotentialSchoolSelect(); },
                () => { if (typeof updateSegmentSelects === 'function') updateSegmentSelects(); }
            ];
            deferredSelectorUpdates.forEach((task, index) => {
                scheduleActiveModuleTask('student-overview', `student-overview-deferred-select:${index}`, task, {
                    delay: 120 + index * 80,
                    idle: true,
                    timeout: 1200
                });
            });
        };

        const loadRuntime = () => {
            if (window.__TEACHING_MANAGEMENT_RUNTIME_PATCHED__
                || (typeof window.smScheduleStudentOverviewRender === 'function'
                    && typeof window.renderStudentOverview === 'function')) {
                return Promise.resolve();
            }
            if (window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.load === 'function') {
                return window.SystemRuntimeLoader.load('student-overview');
            }
            if (typeof window.ensureStudentOverviewRuntimeLoaded === 'function') {
                return window.ensureStudentOverviewRuntimeLoaded();
            }
            return Promise.reject(new Error('student overview runtime loader unavailable'));
        };

        if (!window.__TEACHING_MANAGEMENT_RUNTIME_PATCHED__
            && (typeof window.smScheduleStudentOverviewRender !== 'function'
                || typeof window.renderStudentOverview !== 'function')) {
            loadRuntime()
                .then(() => {
                    if (document.getElementById('student-overview')?.classList.contains('active')) renderNow();
                })
                .catch((error) => {
                    console.warn(error);
                    renderNow();
                });
            return Promise.resolve(false);
        }

        renderNow();
        return Promise.resolve();
    }

    function renderTeacherAnalysisEmptyState() {
        setTeacherComparisonTableState(
            '暂时无法自动识别本校',
            '可能原因：只导入了教师配置，还没有上传学生成绩；或任课表中的班级名与成绩表中的班级名不一致。'
        );
        const townshipContainer = document.getElementById('teacher-township-ranking-container');
        if (townshipContainer) townshipContainer.innerHTML = '';
    }

    function inferTeacherSchoolIfNeeded() {
        if (MY_SCHOOL || typeof SCHOOLS === 'undefined' || Object.keys(SCHOOLS).length === 0) return;
        const schoolNames = (typeof window.listAvailableSchoolsForCompare === 'function')
            ? window.listAvailableSchoolsForCompare()
            : Object.keys(SCHOOLS);
        if (schoolNames.length === 1) {
            writeCurrentSchool(schoolNames[0]);
        } else if (typeof TEACHER_MAP !== 'undefined' && Object.keys(TEACHER_MAP).length > 0) {
            const schoolCounts = {};
            Object.keys(TEACHER_MAP).forEach((key) => {
                const cls = key.split('_')[0];
                for (const schoolName of schoolNames) {
                    const schoolRecord = typeof window.getAppSchoolRecord === 'function'
                        ? window.getAppSchoolRecord(schoolName)
                        : SCHOOLS[schoolName];
                    const hasClass = (schoolRecord?.students || []).some((student) => student.class == cls);
                    if (hasClass) {
                        schoolCounts[schoolName] = (schoolCounts[schoolName] || 0) + 1;
                        break;
                    }
                }
            });

            let winner = '';
            let max = 0;
            Object.entries(schoolCounts).forEach(([schoolName, count]) => {
                if (count > max) {
                    max = count;
                    winner = schoolName;
                }
            });

            if (winner) {
                if (typeof window.syncTeacherAnalysisSchoolContext === 'function') {
                    window.syncTeacherAnalysisSchoolContext(winner);
                } else {
                    window.MY_SCHOOL = winner;
                    try { localStorage.setItem('MY_SCHOOL', winner); } catch (_) {}
                }
                console.log('🤖 [teacher-analysis] 已根据任课表自动锁定本校:', winner);
            }
        }

        const currentSchool = typeof readCurrentSchool === 'function' ? readCurrentSchool() : '';
        if (currentSchool) {
            const schoolSelect = document.getElementById('mySchoolSelect');
            if (schoolSelect) schoolSelect.value = currentSchool;
        }
    }

    function initTeacherAnalysisEntry(moduleId = 'teacher-analysis') {
        clearTeacherAnalysisDeferredRender();
        ensureTeacherAnalysisSectionLoaded();
        if (moduleId !== 'teacher-analysis') {
            const section = document.getElementById(moduleId);
            if (section) section.dataset.teacherSubmoduleScheduled = '1';
        }
        if (typeof window.TeachingManagementModulesRuntime?.ensureTeacherTownshipRankingSlotReady === 'function') {
            window.TeachingManagementModulesRuntime.ensureTeacherTownshipRankingSlotReady();
        } else if (typeof window.TeachingManagementModulesRuntime?.relocateTeacherBlocks === 'function') {
            window.TeachingManagementModulesRuntime.relocateTeacherBlocks();
        }
        const applyTeacherRoleVisibility = () => {
            if (typeof window.applyRoleAllowVisibility === 'function') {
                window.applyRoleAllowVisibility(document.getElementById('teacher-analysis') || document);
            }
        };
        const cta = document.getElementById('teacher-sync-cta');
        if (cta) cta.style.display = (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) ? 'none' : 'inline-flex';
        const exportBtn = document.querySelector('#teacher-analysis .sec-head button');
        if (exportBtn) exportBtn.style.display = 'inline-flex';
        const detailSection = document.getElementById('anchor-detail');
        const pairSection = document.getElementById('anchor-pair');
        const townshipContainer = document.getElementById('teacher-township-ranking-container');
        if (detailSection) detailSection.style.display = 'block';
        if (pairSection) pairSection.style.display = 'block';
        if (townshipContainer) townshipContainer.style.display = 'block';

        applyTeacherRoleVisibility();
        showTeacherAnalysisPendingState(moduleId);
        renderReusableTeacherPairingNow(moduleId);
        if (moduleId === 'teacher-analysis') scheduleTeacherCompareAutoRender(16);
        const renderDelay = TEACHER_ANALYSIS_RENDER_DELAY_MS;
        scheduleModuleTask('teacher-analysis-auto-render', () => {
            if (!isTeacherAnalysisModuleActive(moduleId)) return;
            applyTeacherRoleVisibility();
            const teacherMapReady = window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0;
            if (!teacherMapReady) {
                waitForTeacherMapReady({ timeoutMs: 5000 }).then((ready) => {
                    if (!isTeacherAnalysisModuleActive(moduleId)) return;
                    if (ready) {
                        renderTeacherAnalysisAfterRuntimeReady(moduleId);
                    } else {
                        renderTeacherAnalysisEmptyState();
                    }
                    applyTeacherRoleVisibility();
                });
                return;
            }
            renderTeacherAnalysisAfterRuntimeReady(moduleId);
            scheduleModuleTask('teacher-analysis-role-visibility', applyTeacherRoleVisibility, { delay: 160, idle: true, timeout: 700 });
        }, { delay: renderDelay, idle: false, timeout: 1800 });
        return Promise.resolve();
    }

    function releaseTeacherAnalysisHeavyDom() {
        const section = document.getElementById('teacher-analysis');
        if (!section || isTeacherAnalysisActive()) return;
        clearTeacherAnalysisDeferredRender();
        const heavyTargets = [
            ['teacherCardsContainer', '教师卡片已收起，重新进入本模块后自动刷新。'],
            ['teacher-township-ranking-container', '教师乡镇排名已收起，重新进入本模块后自动刷新。']
        ];
        const table = document.getElementById('teacherComparisonTable');
        if (table && table.innerHTML && table.dataset.released !== 'true') {
            table.dataset.released = 'true';
            setTeacherComparisonTableState('教师对比表已收起，重新进入本模块后自动刷新。');
        }
        heavyTargets.forEach(([id, message]) => {
            const node = document.getElementById(id);
            if (!node || !node.innerHTML || node.dataset.released === 'true') return;
            node.dataset.released = 'true';
            node.innerHTML = `<div class="analysis-empty-state">${message}</div>`;
        });
        const sideNav = document.getElementById('side-nav-teacher-ranks-container');
        if (sideNav && sideNav.innerHTML) sideNav.innerHTML = '';
    }

    function initCorrelationAnalysisEntry() {
        const runAfterLoad = () => {
            if (!document.getElementById('correlation-analysis')?.classList.contains('active')) return false;
            if (typeof updateCorrelationSchoolSelect === 'function') updateCorrelationSchoolSelect();
            scheduleModuleAutoRender('correlation-analysis-auto', () => {
                if (!document.getElementById('correlation-analysis')?.classList.contains('active')) return;
                if (!Array.isArray(window.RAW_DATA) || window.RAW_DATA.length < 5) return;
                if (typeof window.renderCorrelationAnalysis === 'function') window.renderCorrelationAnalysis();
                if (typeof window.refreshResponsiveMobileTables === 'function') {
                    window.refreshResponsiveMobileTables(document.getElementById('correlation-analysis'));
                }
            }, { delay: 32, idle: false, timeout: 1200 });
            return true;
        };

        if (typeof window.ensureTeacherCorrelationRuntimeLoaded === 'function'
            && !window.__TEACHER_ANALYSIS_BRIDGE_RUNTIME_PATCHED__) {
            window.ensureTeacherCorrelationRuntimeLoaded()
                .then(runAfterLoad)
                .catch((error) => {
                    console.warn('[correlation-analysis] runtime load failed:', error);
                    return false;
                });
            return Promise.resolve(false);
        }

        return Promise.resolve(runAfterLoad());
    }

    function initCohortGrowthEntry() {
        const runAfterLoad = () => {
            if (!document.getElementById('cohort-growth')?.classList.contains('active')) return false;
            if (window.CohortGrowth && typeof window.CohortGrowth.updateScopeControls === 'function') {
                window.CohortGrowth.updateScopeControls();
                if (window.CohortGrowth.cacheSignature) {
                    window.CohortGrowth.renderVolatility(window.CohortGrowth.cache.volatility);
                    window.CohortGrowth.renderGrowth(window.CohortGrowth.cache.growth);
                }
            }
            return true;
        };

        if ((!window.CohortGrowth || typeof window.CohortGrowth.updateScopeControls !== 'function')
            && window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.load === 'function') {
            return window.SystemRuntimeLoader.load('cohort-growth')
                .then(runAfterLoad)
                .catch((error) => {
                    console.warn('[cohort-growth] runtime load failed:', error);
                    return false;
                });
        }

        return Promise.resolve(runAfterLoad());
    }

    function initProgressAnalysisEntry() {
        const section = document.getElementById('progress-analysis');
        const entrySignature = [
            Number(window.__RAW_DATA_VERSION || 0),
            Array.isArray(window.RAW_DATA) ? window.RAW_DATA.length : 0,
            String(window.CURRENT_EXAM_ID || ''),
            String(window.CURRENT_COHORT_ID || ''),
            window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object' ? Object.keys(window.TEACHER_MAP).length : 0
        ].join('::');
        if (section?.dataset.progressEntrySignature === entrySignature) return Promise.resolve(true);
        if (section) section.dataset.progressEntrySignature = entrySignature;

        const prepareControls = () => {
            if (!MY_SCHOOL && typeof TEACHER_MAP !== 'undefined' && Object.keys(TEACHER_MAP).length > 0 && typeof SCHOOLS !== 'undefined') {
                const schoolCounts = {};
                const schoolNames = (typeof window.listAvailableSchoolsForCompare === 'function')
                    ? window.listAvailableSchoolsForCompare()
                    : Object.keys(SCHOOLS);
                Object.keys(TEACHER_MAP).forEach((key) => {
                    const cls = key.split('_')[0];
                    for (const schoolName of schoolNames) {
                        const schoolRecord = typeof window.getAppSchoolRecord === 'function'
                            ? window.getAppSchoolRecord(schoolName)
                            : SCHOOLS[schoolName];
                        if ((schoolRecord?.students || []).some((student) => student.class == cls)) {
                            schoolCounts[schoolName] = (schoolCounts[schoolName] || 0) + 1;
                            break;
                        }
                    }
                });
                let winner = '';
                let max = 0;
                Object.entries(schoolCounts).forEach(([schoolName, count]) => {
                    if (count > max) {
                        max = count;
                        winner = schoolName;
                    }
                });
                if (winner) writeCurrentSchool(winner);
            }

            updateProgressSchoolSelect();
            updateProgressBaselineSelect();
            updateProgressMultiExamSelects();
            if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
            if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
            const progSel = document.getElementById('progressSchoolSelect');
            if (MY_SCHOOL && progSel) progSel.value = MY_SCHOOL;

            scheduleActiveModuleTask('progress-analysis', 'progress-analysis-baseline', () => {
                const activeSchool = document.getElementById('progressSchoolSelect');
                Promise.resolve(ensureProgressBaselineData({
                    allowCloudSync: true,
                    rerenderReport: true,
                    rerenderAnalysis: !!(activeSchool && activeSchool.value)
                })).catch((err) => {
                    console.warn('[progress] 自动加载历史基准失败:', err);
                    if (typeof setProgressBaselineStatus === 'function') {
                        setProgressBaselineStatus('❌ 自动加载上次考试数据失败，请稍后重试', 'error');
                    }
                });
            }, { delay: 80, idle: true, timeout: 1200 });
        };

        const schedulePreparation = () => {
            scheduleActiveModuleTask('progress-analysis', 'progress-analysis-controls', prepareControls, {
                delay: 80,
                idle: true,
                timeout: 900
            });
            return true;
        };

        if (typeof window.ensureProgressAnalysisRuntimeLoaded === 'function'
            && !window.__PROGRESS_ANALYSIS_RUNTIME_PATCHED__) {
            return window.ensureProgressAnalysisRuntimeLoaded()
                .then(() => {
                    if (document.getElementById('progress-analysis')?.classList.contains('active')) return schedulePreparation();
                    return false;
                })
                .catch((error) => {
                    console.warn('[progress] runtime load failed:', error);
                    return false;
                });
        }

        schedulePreparation();
        return Promise.resolve(true);
    }

    function getCurrentSchoolCandidate() {
        return String(
            (typeof readCurrentSchool === 'function' ? readCurrentSchool() : '')
            || window.MY_SCHOOL
            || localStorage.getItem('MY_SCHOOL')
            || ''
        ).trim();
    }

    function initFreshmanExamEntry(id) {
        const runAfterLoad = () => {
            if (window.FreshmanExamRuntime && typeof window.FreshmanExamRuntime.syncFbClasses === 'function') {
                window.FreshmanExamRuntime.syncFbClasses();
            }
            if (id === 'exam-arranger' && typeof window.EXAM_initProctorUI === 'function') {
                window.EXAM_initProctorUI();
            }
            return true;
        };

        const loaders = [];
        const readyLoader = id === 'freshman-simulator'
            ? window.ensureFreshmanSimulatorRuntimeLoaded
            : (window.ensureExamArrangerRuntimeLoaded || window.ensureFreshmanExamRuntimeLoaded);
        // 各入口在模块激活后并行准备实际交互所需的 vendor。即使核心运行时
        // 已被其他入口加载，也要确保 Excel/图表依赖已就绪，避免首个文件
        // 导入动作抢在依赖加载前而变成“只有外壳”。
        if (typeof readyLoader === 'function') {
            loaders.push(readyLoader());
        }
        if (loaders.length) {
            Promise.all(loaders)
                .then(() => {
                    if (document.getElementById(id)?.classList.contains('active')) return runAfterLoad();
                    return false;
                })
                .catch((error) => {
                    console.warn('init freshman/exam runtime failed:', error);
                    return false;
                });
            return Promise.resolve(false);
        }

        return Promise.resolve(runAfterLoad());
    }

    function initGradeSchedulerEntry() {
        const runAfterLoad = () => {
            if (document.getElementById('grade-scheduler')?.classList.contains('active')
                && window.SCHEDULER
                && typeof window.SCHEDULER.renderTable === 'function'
                && window.SCHEDULER.classes
                && window.SCHEDULER.classes.length
                && !document.getElementById('sch_result_area')?.classList.contains('hidden')) {
                window.SCHEDULER.renderTable();
            }
            return true;
        };

        if (typeof window.ensureGradeSchedulerRuntimeLoaded === 'function'
            && !window.__GRADE_SCHEDULER_RUNTIME_PATCHED__) {
            return window.ensureGradeSchedulerRuntimeLoaded()
                .then(() => {
                    if (document.getElementById('grade-scheduler')?.classList.contains('active')) return runAfterLoad();
                    return false;
                })
                .catch((error) => {
                    console.warn('init grade scheduler runtime failed:', error);
                    return false;
                });
        }

        return Promise.resolve(runAfterLoad());
    }

    function scheduleMacroTablesRender(activeModuleId, label = 'macro-entry') {
        const run = () => {
            if (activeModuleId && !document.getElementById(activeModuleId)?.classList.contains('active')) return;
            if (activeModuleId === 'bottom3' && typeof window.renderBottom3TableOnly === 'function') {
                window.renderBottom3TableOnly();
                return;
            }
            if (typeof window.renderTables === 'function') window.renderTables();
        };
        scheduleModuleTask(`macro-tables:${label}`, run, { delay: 60, idle: true, timeout: 900 });
    }

    function scheduleActiveModuleTask(activeModuleId, label, task, options = {}) {
        scheduleModuleTask(label, () => {
            if (activeModuleId && !document.getElementById(activeModuleId)?.classList.contains('active')) return;
            task();
        }, options);
    }

    function prewarmReportGeneratorRuntimes() {
        scheduleActiveModuleTask('report-generator', 'report-generator-runtime-prewarm', () => {
            const loaders = [
                ['report-render', window.ensureReportRenderRuntimeLoaded]
            ];
            loaders.forEach(([label, loader]) => {
                if (typeof loader !== 'function') return;
                Promise.resolve()
                    .then(() => loader.call(window))
                    .catch((error) => console.warn(`[report-generator] ${label} runtime prewarm failed:`, error));
            });
        }, { delay: 40, idle: true, timeout: 1800 });
    }

    function prewarmStudentDiagnosisRuntimes(activeModuleId) {
        if (!STUDENT_DIAGNOSIS_MODULE_IDS.has(activeModuleId)) return;
        scheduleModuleTask('student-diagnosis-runtime-prewarm', () => {
            if (!window.SystemRuntimeLoader || typeof window.SystemRuntimeLoader.load !== 'function') return;
            Promise.resolve(window.SystemRuntimeLoader.load('student-overview'))
                .catch((error) => console.warn('[student-diagnosis] student-overview prewarm failed:', error));
        }, { delay: 500, idle: true, timeout: 2400 });
        scheduleModuleTask('student-diagnosis-report-prewarm', () => {
            if (!window.SystemRuntimeLoader || typeof window.SystemRuntimeLoader.load !== 'function') return;
            Promise.resolve(window.SystemRuntimeLoader.load('report-render'))
                .catch((error) => console.warn('[student-diagnosis] report-render prewarm failed:', error));
        }, { delay: 2600, idle: true, timeout: 5200 });
    }

    function initSummaryEntry() {
        scheduleActiveModuleTask('summary', 'summary-tables', () => {
            if (typeof window.renderTables === 'function') window.renderTables();
        }, { delay: 20, frame: true });
        scheduleActiveModuleTask('summary', 'summary-auto-calculate', () => {
            if (typeof window.calcSummary !== 'function') return;
            Promise.resolve(window.calcSummary(true))
                .catch((error) => console.warn('[summary] automatic calculation failed:', error));
        }, { delay: 80, idle: true, timeout: 1200 });
        return Promise.resolve(true);
    }

    function runModuleSpecificInit(id) {
        prewarmStudentDiagnosisRuntimes(id);
        if (id === 'student-details') return initStudentDetailsEntry();
        if (id === 'summary') return initSummaryEntry();
        if (id === 'analysis') {
            const initializeAnalysis = () => {
                scheduleActiveModuleTask('analysis', 'analysis-entry-selects', () => {
                    if (typeof updateMacroMultiExamSelects === 'function') updateMacroMultiExamSelects();
                    renderSingleSchoolAnalysisHint();
                }, { delay: 40, frame: true });
                scheduleMacroTablesRender('analysis', 'analysis-tables');
                return true;
            };
            // The compatibility runtime used to rely on background hydration.
            // That leaves the analysis shell interactive but its comparison and
            // export actions absent on lazy connections. Load it on entry instead.
            const macroAnalysisRuntimeReady = window.__MACRO_ANALYSIS_COMPAT_RUNTIME_PATCHED__ === true;
            const tableHeatmapRuntimeReady = typeof window.toggleTableHeatmap === 'function';
            if (typeof window.ensureMacroAnalysisCompatRuntimeLoaded === 'function'
                && (!macroAnalysisRuntimeReady || !tableHeatmapRuntimeReady)) {
                return window.ensureMacroAnalysisCompatRuntimeLoaded()
                    .then(initializeAnalysis)
                    .catch((error) => {
                        console.warn('[analysis] macro compatibility runtime failed:', error);
                        return false;
                    });
            }
            return Promise.resolve(initializeAnalysis());
        }
        if (TEACHING_MANAGEMENT_MODULE_IDS.has(id)) return initTeachingManagementEntry(id);
        if (id === 'bottom3') scheduleMacroTablesRender('bottom3', 'bottom3-tables');
        if (id === 'indicator' && typeof refreshIndicatorResults === 'function') {
            scheduleActiveModuleTask('indicator', 'indicator-results', () => refreshIndicatorResults(true, {
                waitForInputs: true,
                timeoutMs: 8000
            }), {
                delay: 80,
                idle: true,
                timeout: 9000
            });
        }
        if (id === 'county-analysis' || id === 'county-teacher-portrait' || id === 'county-school-horizontal') {
            if (window.__SMOKE_LIGHTWEIGHT_MODULE_SWITCH__) {
                if (typeof window.ensureCountySubmoduleSections === 'function') window.ensureCountySubmoduleSections();
                return Promise.resolve(true);
            }
            const renderCounty = () => {
                if (typeof window.renderCountyAnalysis === 'function') {
                    return window.renderCountyAnalysis(id);
                }
                return false;
            };
            const scheduleCountyRender = () => scheduleModuleTaskPromise(`county-analysis-render:${id}`, () => {
                const active = document.getElementById(id)?.classList.contains('active')
                    || (id === 'county-analysis'
                        && (document.getElementById('county-teacher-portrait')?.classList.contains('active')
                            || document.getElementById('county-school-horizontal')?.classList.contains('active')));
                if (active) return renderCounty();
                return false;
            }, { delay: 80, frame: true });
            if (typeof window.ensureCountyAnalysisRuntimeLoaded === 'function'
                && !window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__) {
                return window.ensureCountyAnalysisRuntimeLoaded()
                    .then(scheduleCountyRender)
                    .catch((error) => {
                        console.warn('init county analysis failed:', error);
                        return false;
                    });
            }
            return scheduleCountyRender();
        }
        if (id === 'high-score' && typeof renderHighScoreTable === 'function') renderHighScoreTable();
        if (id === 'student-overview') return initStudentOverviewEntry();
        if (id === 'zhongkao-countdown') {
            const initCountdown = () => {
                if (window.ZhongkaoCountdownModule
                    && typeof window.ZhongkaoCountdownModule.ensureInitialized === 'function') {
                    window.ZhongkaoCountdownModule.ensureInitialized();
                }
            };
            if (typeof window.ensureZhongkaoCountdownRuntimeLoaded === 'function'
                && !window.ZhongkaoCountdownModule) {
                return window.ensureZhongkaoCountdownRuntimeLoaded()
                    .then(initCountdown)
                    .catch((error) => console.warn(error));
            }
            initCountdown();
        }
        if (id === 'teacher-analysis'
            || id === 'teacher-detail-comparison'
            || id === 'teacher-pairing'
            || id === 'teacher-township-ranking') return initTeacherAnalysisEntry(id);
        if (id === 'freshman-simulator' || id === 'exam-arranger') return initFreshmanExamEntry(id);
        if (id === 'grade-scheduler') return initGradeSchedulerEntry();
        if (id === 'report-generator') {
            scheduleActiveModuleTask('report-generator', 'report-generator-selects', () => {
                if (typeof updateSchoolSelect === 'function') updateSchoolSelect();
                if (typeof updateClassSelect === 'function') updateClassSelect();
            }, { delay: 60, frame: true });
            prewarmReportGeneratorRuntimes();
        }
        if (id === 'data-quality') {
            const runtime = window.DataQualityRuntime;
            if (runtime && typeof runtime.bind === 'function') {
                runtime.bind();
            }
            if (runtime && typeof runtime.render === 'function') {
                scheduleActiveModuleTask('data-quality', 'data-quality-render', () => {
                    runtime.render();
                }, { delay: 16, frame: true });
                return Promise.resolve(true);
            }
            return Promise.resolve(false);
        }
        if (id === 'segment-analysis') updateSegmentSelects();
        if (id === 'potential-analysis') updatePotentialSchoolSelect();
        if (id === 'correlation-analysis') return initCorrelationAnalysisEntry();
        if (id === 'cohort-growth') return initCohortGrowthEntry();
        if (id === 'seat-adjustment') updateSeatAdjSelects();
        if (id === 'subject-balance') updateSubjectBalanceSelects();
        if (id === 'progress-analysis') return initProgressAnalysisEntry();
        if (id === 'mutual-aid') updateMutualAidSelects();
        if (id === 'marginal-push') {
            if (typeof updateMpSchoolSelect === 'function') {
                updateMpSchoolSelect();
                return Promise.resolve(true);
            }
            if (typeof window.loadDeferredAppModules === 'function') {
                return Promise.resolve(window.loadDeferredAppModules()).then(() => {
                    if (typeof updateMpSchoolSelect === 'function') updateMpSchoolSelect();
                    return typeof updateMpSchoolSelect === 'function';
                });
            }
            return Promise.resolve(false);
        }
        if (id === 'single-school-eval') return false;
        return Promise.resolve();
    }

    window.runModuleTabEnter = function (context = {}) {
        const id = String(context.id || '').trim();
        if (!id) return Promise.resolve(false);

        const now = Date.now();
        if (lastModuleEntry.id === id && lastModuleEntry.promise && now - lastModuleEntry.at < 250) {
            return lastModuleEntry.promise;
        }
        const entryEpoch = ++moduleEntryEpoch;

        syncModuleEnterChrome(context);

        const entryPromise = Promise.resolve()
            .then(() => ensureModuleStylesFor(id))
            .then(() => {
                const section = document.getElementById(id);
                if (entryEpoch !== moduleEntryEpoch || !section?.classList.contains('active')) return false;
                const runInit = () => runModuleSpecificInit(id);
                const result = id === 'student-details'
                    ? scheduleModuleTaskPromise('student-details-enter-init', runInit, { delay: 40, frame: true })
                    : runInit();
                return result;
            })
            .catch((error) => {
                console.error('runModuleTabEnter failed:', error);
                return Promise.reject(error);
            });
        lastModuleEntry = { id, at: now, promise: entryPromise };
        return entryPromise;
    };

    window.activateTeachingManagementModule = activateTeachingManagementModule;
    window.renderSingleSchoolAnalysisHint = renderSingleSchoolAnalysisHint;
    window.releaseTeacherAnalysisHeavyDom = releaseTeacherAnalysisHeavyDom;
    window.renderTeacherAnalysisNow = renderTeacherAnalysisNow;
    window.addEventListener('school:module-changed', (event) => {
        const moduleId = String(event?.detail?.id || '').trim();
        if (moduleId === 'teacher-pairing') renderReusableTeacherPairingNow(moduleId);
    });
    window.__MODULE_ENTRY_RUNTIME_PATCHED__ = true;
})();
