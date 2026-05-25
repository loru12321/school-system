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
        'cohort-growth'
    ]);
    const APP_DOWNLOAD_MODULE_IDS = new Set([
        'app-download-center'
    ]);
    const TEACHER_ANALYSIS_RENDER_DELAY_MS = 180;
    const TEACHER_ANALYSIS_PRELOAD_DELAY_MS = 700;
    const TEACHER_ANALYSIS_ENTRY_LABELS = [
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

        if (APP_DOWNLOAD_MODULE_IDS.has(id)) {
            loaders.push(window.ensureOptionalStylesheetLoaded(
                'app-download-module',
                './assets/css/app-download-module.css'
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
        if (reportResult) reportResult.classList.add('hidden');
        const compareSection = document.getElementById('student-multi-period-compare-section');
        if (compareSection) compareSection.style.display = 'none';
        syncModuleDescBar(id, currentCategoryMeta);
        if (typeof syncShellChromeBridge === 'function') syncShellChromeBridge(id);
        if (typeof ensureModuleHelpButton === 'function') ensureModuleHelpButton(id);
        if (currentCategory === 'town' && typeof ensureTownSubmoduleCompareUIs === 'function') {
            ensureTownSubmoduleCompareUIs();
        }
    }

    function isTeacherAnalysisActive() {
        return !!document.getElementById('teacher-analysis')?.classList.contains('active');
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

    function showTeacherAnalysisPendingState() {
        const placeholders = [
            ['teacherCardsContainer', '正在后台生成教师画像。'],
            ['teacherComparisonTable', '正在整理教师对比表。'],
            ['teacher-township-ranking-container', '正在生成教师乡镇排名。']
        ];
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
            if (typeof window.ensureTeacherCompareRuntimeLoaded === 'function'
                && !window.__TEACHER_COMPARE_RESULT_RUNTIME_PATCHED__) {
                window.ensureTeacherCompareRuntimeLoaded()
                    .then(run)
                    .catch((error) => console.warn('[teacher-analysis] teacher compare auto load failed:', error));
                return;
            }
            run();
        }, { label: 'teacher-compare-auto', delay, timeout: 1800 });
    }

    function scheduleTeacherAnalysisRenderWork(delay = TEACHER_ANALYSIS_RENDER_DELAY_MS) {
        clearTeacherAnalysisRenderWork();
        const token = teacherAnalysisRenderToken;
        showTeacherAnalysisPendingState();

        scheduleModuleTask('teacher-analysis-render-work', () => {
            runTeacherAnalysisIfCurrent(token, () => {
                const teacherMapReady = window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0;
                if (!teacherMapReady || typeof window.analyzeTeachers !== 'function') {
                    renderTeacherAnalysisEmptyState();
                    return;
                }

                window.analyzeTeachers({ render: false, township: false, historyLimit: 0 });
                ['teacherCardsContainer', 'teacherComparisonTable', 'teacher-township-ranking-container'].forEach((id) => {
                    const node = document.getElementById(id);
                    if (node) delete node.dataset.released;
                });
                scheduleTeacherAnalysisPhase(token, 'teacher-analysis-render-cards', () => {
                    if (typeof window.renderTeacherCards === 'function') window.renderTeacherCards();
                }, 0);
                scheduleTeacherAnalysisPhase(token, 'teacher-analysis-render-pairing', () => {
                    if (typeof window.generateTeacherPairing === 'function') window.generateTeacherPairing();
                }, 100);
                scheduleTeacherAnalysisPhase(token, 'teacher-analysis-render-overview', () => {
                    if (typeof window.tmScheduleTeachingOverviewRender === 'function') {
                        window.tmScheduleTeachingOverviewRender();
                    } else if (typeof window.renderTeachingOverview === 'function') {
                        window.renderTeachingOverview();
                    }
                }, 160);
                scheduleTeacherAnalysisPhase(token, 'teacher-analysis-render-state-bars', () => {
                    if (typeof window.tmRenderTeachingModuleStateBars === 'function') window.tmRenderTeachingModuleStateBars('teacher-analysis');
                }, 260);
                scheduleTeacherAnalysisPhase(token, 'teacher-analysis-render-comparison', () => {
                    if (typeof window.renderTeacherComparisonTable === 'function') window.renderTeacherComparisonTable();
                }, 420);
                scheduleTeacherAnalysisPhase(token, 'teacher-analysis-render-township', () => {
                    if (typeof window.renderTeacherTownshipRanking === 'function') window.renderTeacherTownshipRanking();
                }, 760);
            });
        }, { delay, idle: true, timeout: 1500 });
    }

    function renderTeacherAnalysisNow() {
        if (!isTeacherAnalysisActive()) return;
        const run = () => {
            if (window.DataManager && typeof DataManager.ensureTeacherMap === 'function') {
                try {
                    DataManager.ensureTeacherMap(true);
                } catch (error) {
                    console.warn('[teacher-analysis] teacher map load failed:', error);
                }
            }
            scheduleTeacherAnalysisRenderWork(0);
        };
        if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function') {
            window.ensureTeacherAnalysisMainRuntimeLoaded().then(run).catch((error) => console.warn(error));
            return;
        }
        run();
    }

    function initStudentDetailsEntry() {
        updateStudentSchoolSelect();
        scheduleModuleTask('student-details-compare-selects', () => {
            if (!document.getElementById('student-details')?.classList.contains('active')) return;
            if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
            if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
        }, { delay: 80, idle: true, timeout: 900 });
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
            if (typeof window.renderStudentDetails === 'function') {
                window.renderStudentDetails(true);
            }
        };

        clearModuleTask('student-details-render-primary');
        clearModuleTask('student-details-render-fallback');
        window.__STUDENT_DETAILS_RENDER_TIMER__ = scheduleModuleTask('student-details-render-primary', triggerRender, {
            delay: 80,
            frame: true
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

        const user = getCurrentUser();
        const role = user?.role || 'guest';
        const multiPeriodSection = document.getElementById('student-multi-period-compare-section');
        if (!multiPeriodSection) return;

        if (role === 'admin' || role === 'director' || role === 'grade_director' || role === 'class_teacher' || role === 'teacher') {
            multiPeriodSection.style.display = 'block';
            const saveCloudBtn = multiPeriodSection.querySelector('[onclick="saveStudentCompareToCloud()"]');
            if (role === 'teacher' || role === 'class_teacher') {
                if (saveCloudBtn) saveCloudBtn.style.display = 'none';
            }
        } else {
            multiPeriodSection.style.display = 'none';
        }
    }

    function initAppDownloadCenterEntry() {
        if (typeof window.ensureLazySectionLoaded === 'function') {
            window.ensureLazySectionLoaded('app-download-center');
        }

        const render = () => {
            if (typeof window.renderAppDownloadCenter === 'function') {
                window.renderAppDownloadCenter();
                return true;
            }
            return false;
        };

        const scheduleRender = (attempt = 0) => {
            if (render()) return true;
            if (attempt >= 8) return false;
            scheduleModuleTask('app-download-render-retry', () => {
                scheduleRender(attempt + 1);
            }, { delay: attempt < 2 ? 80 : 180 });
            return false;
        };

        const loadRuntime = () => {
            if (window.__APP_DOWNLOAD_RUNTIME_PATCHED__ || typeof window.renderAppDownloadCenter === 'function') {
                return Promise.resolve();
            }
            if (typeof window.ensureAppDownloadRuntimeLoaded === 'function') {
                return window.ensureAppDownloadRuntimeLoaded();
            }
            if (window.SystemRuntimeLoader && typeof window.SystemRuntimeLoader.load === 'function') {
                return window.SystemRuntimeLoader.load('app-download');
            }
            return Promise.reject(new Error('app download runtime loader unavailable'));
        };

        if (window.__APP_DOWNLOAD_RUNTIME_PATCHED__ || typeof window.renderAppDownloadCenter === 'function') {
            return Promise.resolve(scheduleRender());
        }

        loadRuntime()
            .then(() => {
                scheduleRender();
                return true;
            })
            .catch((error) => {
                console.warn('initAppDownloadCenterEntry failed:', error);
                scheduleRender();
                return false;
            });
        return Promise.resolve(false);
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
                () => { if (typeof updateSegmentSelects === 'function') updateSegmentSelects(); },
                () => { if (typeof updateCorrelationSchoolSelect === 'function') updateCorrelationSchoolSelect(); }
            ];
            deferredSelectorUpdates.forEach((task, index) => {
                scheduleActiveModuleTask('student-overview', `student-overview-deferred-select:${index}`, task, {
                    delay: 120 + index * 80,
                    idle: true,
                    timeout: 1200
                });
            });
        };

        if (typeof window.ensureTeachingManagementRuntimeLoaded === 'function'
            && !window.__TEACHING_MANAGEMENT_RUNTIME_PATCHED__) {
            window.ensureTeachingManagementRuntimeLoaded()
                .then(() => {
                    if (document.getElementById('student-overview')?.classList.contains('active')) renderNow();
                })
                .catch((error) => console.warn(error));
            renderNow();
            return Promise.resolve(false);
        }

        renderNow();
        return Promise.resolve();
    }

    function renderTeacherAnalysisEmptyState() {
        const compTable = document.getElementById('teacherComparisonTable');
        if (compTable) {
            compTable.innerHTML = `
                <div style="text-align:center; padding:40px; color:#999;">
                    <div style="font-size:48px; margin-bottom:10px;">🏫❓</div>
                    <p style="font-size:16px; font-weight:bold; color:#333;">暂时无法自动识别本校</p>
                    <div style="background:#f9fafb; padding:10px 20px; border-radius:6px; display:inline-block; text-align:left; margin-top:10px; font-size:13px; color:#666; line-height:1.8;">
                        <strong>可能原因：</strong><br>
                        1. 只导入了教师配置，还没有上传学生成绩。<br>
                        <span style="color:#d97706;">系统需要结合学生名单确认班级归属。</span><br>
                        2. 任课表中的班级名与成绩表中的班级名不一致。<br>
                    </div>
                </div>`;
        }
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

    function initTeacherAnalysisEntry() {
        clearTeacherAnalysisDeferredRender();
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

        showTeacherAnalysisPendingState();
        scheduleTeacherCompareAutoRender(16);
        scheduleModuleTask('teacher-analysis-auto-render', () => {
            if (!document.getElementById('teacher-analysis')?.classList.contains('active')) return;
            const teacherMapReady = window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0;
            if (!teacherMapReady) {
                renderTeacherAnalysisEmptyState();
                return;
            }
            const run = () => scheduleTeacherAnalysisRenderWork(0);
            if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function'
                && !window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__) {
                window.ensureTeacherAnalysisMainRuntimeLoaded()
                    .then(() => {
                        if (document.getElementById('teacher-analysis')?.classList.contains('active')) run();
                    })
                    .catch((error) => console.warn('[teacher-analysis] runtime load failed:', error));
                return;
            }
            run();
        }, { delay: 420, idle: true, timeout: 1800 });
        return Promise.resolve();
    }

    function releaseTeacherAnalysisHeavyDom() {
        clearTeacherAnalysisDeferredRender();
        const section = document.getElementById('teacher-analysis');
        if (!section || section.classList.contains('active')) return;
        const heavyTargets = [
            ['teacherCardsContainer', '教师卡片已收起，重新进入本模块后自动刷新。'],
            ['teacherComparisonTable', '教师对比表已收起，重新进入本模块后自动刷新。'],
            ['teacher-township-ranking-container', '教师乡镇排名已收起，重新进入本模块后自动刷新。']
        ];
        heavyTargets.forEach(([id, message]) => {
            const node = document.getElementById(id);
            if (!node || !node.innerHTML) return;
            node.dataset.released = 'true';
            node.innerHTML = `<div class="analysis-empty-state">${message}</div>`;
        });
        const sideNav = document.getElementById('side-nav-teacher-ranks-container');
        if (sideNav) sideNav.innerHTML = '';
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

        if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function'
            && !window.__TEACHER_ANALYSIS_BRIDGE_RUNTIME_PATCHED__) {
            window.ensureTeacherAnalysisMainRuntimeLoaded()
                .then(runAfterLoad)
                .catch((error) => {
                    console.warn('[correlation-analysis] runtime load failed:', error);
                    return false;
                });
            return Promise.resolve(false);
        }

        return Promise.resolve(runAfterLoad());
    }

    function initProgressAnalysisEntry() {
        const runNow = () => {
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

            Promise.resolve(ensureProgressBaselineData({
                allowCloudSync: true,
                rerenderReport: true,
                rerenderAnalysis: !!(progSel && progSel.value)
            })).catch((err) => {
                console.warn('[progress] 自动加载历史基准失败:', err);
                if (typeof setProgressBaselineStatus === 'function') {
                    setProgressBaselineStatus('❌ 自动加载上次考试数据失败，请稍后重试', 'error');
                }
            });
        };

        if (typeof window.ensureProgressAnalysisRuntimeLoaded === 'function'
            && !window.__PROGRESS_ANALYSIS_RUNTIME_PATCHED__) {
            return window.ensureProgressAnalysisRuntimeLoaded()
                .then(() => {
                    if (document.getElementById('progress-analysis')?.classList.contains('active')) runNow();
                })
                .catch((error) => {
                    console.warn('[progress] runtime load failed:', error);
                });
        }

        runNow();
        return Promise.resolve();
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
        if (typeof window.ensureFreshmanExamRuntimeLoaded === 'function'
            && !window.__FRESHMAN_EXAM_RUNTIME_PATCHED__) {
            loaders.push(window.ensureFreshmanExamRuntimeLoaded());
        }
        if (id === 'exam-arranger'
            && typeof window.ensureGradeSchedulerRuntimeLoaded === 'function'
            && !window.__GRADE_SCHEDULER_RUNTIME_PATCHED__) {
            loaders.push(window.ensureGradeSchedulerRuntimeLoaded());
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

    function runModuleSpecificInit(id) {
        if (id === 'student-details') return initStudentDetailsEntry();
        if (id === 'summary') {
            scheduleMacroTablesRender('summary', 'summary-tables');
            if (typeof window.ensureSchoolProfileRuntimeLoaded === 'function'
                && !window.__SCHOOL_PROFILE_RUNTIME_PATCHED__) {
                window.ensureSchoolProfileRuntimeLoaded().catch((error) => console.warn(error));
            }
        }
        if (id === 'app-download-center') return initAppDownloadCenterEntry();
        if (id === 'analysis') {
            scheduleActiveModuleTask('analysis', 'analysis-entry-selects', () => {
                if (typeof updateMacroMultiExamSelects === 'function') updateMacroMultiExamSelects();
                renderSingleSchoolAnalysisHint();
            }, { delay: 40, frame: true });
            scheduleMacroTablesRender('analysis', 'analysis-tables');
        }
        if (TEACHING_MANAGEMENT_MODULE_IDS.has(id)) return initTeachingManagementEntry(id);
        if (id === 'bottom3') scheduleMacroTablesRender('bottom3', 'bottom3-tables');
        if (id === 'indicator' && typeof refreshIndicatorResults === 'function') refreshIndicatorResults(true);
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
        if (id === 'teacher-analysis') return initTeacherAnalysisEntry();
        if (id === 'freshman-simulator' || id === 'exam-arranger') return initFreshmanExamEntry(id);
        if (id === 'grade-scheduler') return initGradeSchedulerEntry();
        if (id === 'report-generator') {
            scheduleActiveModuleTask('report-generator', 'report-generator-selects', () => {
                if (typeof updateSchoolSelect === 'function') updateSchoolSelect();
                if (typeof updateClassSelect === 'function') updateClassSelect();
            }, { delay: 60, frame: true });
        }
        if (id === 'data-quality') {
            if (window.DataQualityRuntime && typeof window.DataQualityRuntime.init === 'function') {
                return Promise.resolve(window.DataQualityRuntime.init());
            }
            return Promise.resolve(false);
        }
        if (id === 'segment-analysis') updateSegmentSelects();
        if (id === 'potential-analysis') updatePotentialSchoolSelect();
        if (id === 'correlation-analysis') return initCorrelationAnalysisEntry();
        if (id === 'seat-adjustment') updateSeatAdjSelects();
        if (id === 'subject-balance') updateSubjectBalanceSelects();
        if (id === 'progress-analysis') return initProgressAnalysisEntry();
        if (id === 'mutual-aid') updateMutualAidSelects();
        if (id === 'marginal-push') updateMpSchoolSelect();
        if (id === 'single-school-eval') return false;
        return Promise.resolve();
    }

    window.runModuleTabEnter = function (context = {}) {
        const id = String(context.id || '').trim();
        if (!id) return Promise.resolve(false);

        syncModuleEnterChrome(context);

        return Promise.resolve()
            .then(() => ensureModuleStylesFor(id))
            .then(() => {
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
    };

    window.activateTeachingManagementModule = activateTeachingManagementModule;
    window.renderSingleSchoolAnalysisHint = renderSingleSchoolAnalysisHint;
    window.releaseTeacherAnalysisHeavyDom = releaseTeacherAnalysisHeavyDom;
    window.renderTeacherAnalysisNow = renderTeacherAnalysisNow;
    window.__MODULE_ENTRY_RUNTIME_PATCHED__ = true;
})();
