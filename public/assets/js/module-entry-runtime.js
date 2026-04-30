(() => {
    if (typeof window === 'undefined' || window.__MODULE_ENTRY_RUNTIME_PATCHED__) return;

    const TEACHING_MANAGEMENT_MODULE_IDS = new Set([]);
    const TEACHER_INSIGHT_MODULE_IDS = new Set([
        'teacher-analysis',
        'cohort-growth'
    ]);
    const APP_DOWNLOAD_MODULE_IDS = new Set([
        'app-download-center'
    ]);
    const TEACHER_ANALYSIS_RENDER_DELAY_MS = 180;
    const TEACHER_ANALYSIS_PRELOAD_DELAY_MS = 700;
    let teacherAnalysisRenderTimer = 0;
    let teacherAnalysisRenderToken = 0;

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

    function activateTeachingManagementModule() {
        return false;
    }

    function renderSingleSchoolAnalysisHint() {
        const section = document.getElementById('analysis');
        if (!section) return;
        let hint = document.getElementById('analysis-local-hint');
        if (!hint) {
            hint = document.createElement('div');
            hint.id = 'analysis-local-hint';
            hint.className = 'info-bar';
            hint.style.marginBottom = '12px';
            const head = section.querySelector('.sec-head');
            if (head) head.insertAdjacentElement('afterend', hint);
        }
        const user = getCurrentUser();
        const schools = (typeof listAvailableSchoolsForCompare === 'function')
            ? listAvailableSchoolsForCompare()
            : Object.keys(SCHOOLS || {});
        const visibleSchools = (window.PermissionPolicy && typeof PermissionPolicy.getAccessibleSchoolNames === 'function')
            ? PermissionPolicy.getAccessibleSchoolNames(user, schools)
            : schools;
        const schoolCount = Array.isArray(visibleSchools) ? visibleSchools.length : 0;
        hint.textContent = schoolCount <= 1
            ? '当前只有本校数据，校际横向排名口径不适用，请优先看本页趋势和本校执行类模块。'
            : '如果当前处理的是本校月考或校考，请谨慎使用联考横向口径，优先结合本校执行与学情模块判断。';
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
        if (teacherAnalysisRenderTimer) {
            window.clearTimeout(teacherAnalysisRenderTimer);
            teacherAnalysisRenderTimer = 0;
        }
    }

    function runTeacherAnalysisIfCurrent(token, task) {
        if (token !== teacherAnalysisRenderToken || !isTeacherAnalysisActive()) return;
        task();
    }

    function scheduleTeacherAnalysisPhase(token, task, delay = 0) {
        window.setTimeout(() => runTeacherAnalysisIfCurrent(token, task), delay);
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
        window.setTimeout(() => {
            if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
                window.SystemPerformance.scheduleIdle(run, { label, timeout });
            } else if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(run, { timeout });
            } else if (typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(run);
            } else {
                run();
            }
        }, delay);
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
            ['teacherCardsContainer', '正在后台计算教师画像，稍后自动刷新。'],
            ['teacherComparisonTable', '正在整理教师对比表，稍后自动刷新。'],
            ['teacher-township-ranking-container', '正在生成教师乡镇排名，稍后自动刷新。']
        ];
        placeholders.forEach(([id, message]) => {
            const node = document.getElementById(id);
            if (!node) return;
            const currentHtml = String(node.innerHTML || '').trim();
            if (currentHtml && node.dataset.released !== 'true') return;
            node.innerHTML = `
                <div class="analysis-empty-state">
                    ${message}
                    <div style="margin-top:8px; color:#64748b; font-size:12px;">系统会自动生成，无需单独点击。</div>
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
                const requiredIds = [
                    'teacherCompareSchool',
                    'teacherCompareSubject',
                    'teacherCompareTeacher',
                    'teacherCompareExam1',
                    'teacherCompareExam2'
                ];
                const ready = requiredIds.every((id) => String(document.getElementById(id)?.value || '').trim());
                if (!ready || typeof window.renderTeacherMultiPeriodComparison !== 'function') return;
                window.renderTeacherMultiPeriodComparison();
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
        clearTeacherAnalysisDeferredRender();
        const token = teacherAnalysisRenderToken;
        showTeacherAnalysisPendingState();

        teacherAnalysisRenderTimer = window.setTimeout(() => {
            const startWork = () => runTeacherAnalysisIfCurrent(token, () => {
                const teacherMapReady = window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0;
                if (!teacherMapReady || typeof window.analyzeTeachers !== 'function') {
                    renderTeacherAnalysisEmptyState();
                    return;
                }

                window.analyzeTeachers({ render: false });
                ['teacherCardsContainer', 'teacherComparisonTable', 'teacher-township-ranking-container'].forEach((id) => {
                    const node = document.getElementById(id);
                    if (node) delete node.dataset.released;
                });
                scheduleTeacherAnalysisPhase(token, () => {
                    if (typeof window.renderTeacherCards === 'function') window.renderTeacherCards();
                }, 0);
                scheduleTeacherAnalysisPhase(token, () => {
                    if (typeof window.renderTeacherComparisonTable === 'function') window.renderTeacherComparisonTable();
                }, 80);
                scheduleTeacherAnalysisPhase(token, () => {
                    if (typeof window.generateTeacherPairing === 'function') window.generateTeacherPairing();
                }, 140);
                scheduleTeacherAnalysisPhase(token, () => {
                    if (typeof window.tmScheduleTeachingOverviewRender === 'function') {
                        window.tmScheduleTeachingOverviewRender();
                    } else if (typeof window.renderTeachingOverview === 'function') {
                        window.renderTeachingOverview();
                    }
                }, 200);
                scheduleTeacherAnalysisPhase(token, () => {
                    if (typeof window.renderTeacherTownshipRanking === 'function') window.renderTeacherTownshipRanking();
                }, 320);
                scheduleTeacherAnalysisPhase(token, () => {
                    if (typeof window.tmRenderTeachingModuleStateBars === 'function') window.tmRenderTeachingModuleStateBars('teacher-analysis');
                }, 380);
                if (typeof updateTeacherMultiExamSelects === 'function') updateTeacherMultiExamSelects();
                if (typeof updateTeacherCompareTeacherSelect === 'function') updateTeacherCompareTeacherSelect();
                scheduleTeacherCompareAutoRender(260);
            });

            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(startWork, { timeout: 1500 });
            } else if (typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(startWork);
            } else {
                startWork();
            }
        }, delay);
    }

    function renderTeacherAnalysisNow() {
        if (!isTeacherAnalysisActive()) return;
        const run = () => scheduleTeacherAnalysisRenderWork(0);
        if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function') {
            window.ensureTeacherAnalysisMainRuntimeLoaded().then(run).catch((error) => console.warn(error));
            return;
        }
        run();
    }

    function initStudentDetailsEntry() {
        if (typeof window.ensureCountyAnalysisRuntimeLoaded === 'function'
            && !window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__) {
            window.ensureCountyAnalysisRuntimeLoaded().catch((error) => console.warn('student county rank runtime failed:', error));
        }
        updateStudentSchoolSelect();
        if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
        if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
        if (typeof window.renderStudentDetails === 'function') window.renderStudentDetails(true);

        const triggerRender = () => {
            const section = document.getElementById('student-details');
            if (!section || !section.classList.contains('active')) return;
            if (typeof window.renderStudentDetails === 'function') {
                window.renderStudentDetails(true);
            }
        };

        window.clearTimeout(window.__STUDENT_DETAILS_RENDER_TIMER__);
        window.__STUDENT_DETAILS_RENDER_TIMER__ = setTimeout(() => {
            if (typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(triggerRender);
            } else {
                triggerRender();
            }
        }, 80);
        setTimeout(() => {
            const section = document.getElementById('student-details');
            const renderedRows = document.querySelectorAll('#student-details table tbody tr').length;
            if (!section || !section.classList.contains('active')) return;
            if (renderedRows > 1) return;
            if (typeof window.renderStudentDetails === 'function') {
                window.renderStudentDetails(true);
            }
        }, 900);

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
            setTimeout(() => {
                scheduleRender(attempt + 1);
            }, attempt < 2 ? 80 : 180);
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

        return loadRuntime()
            .then(() => {
                scheduleRender();
                return true;
            })
            .catch((error) => {
                console.warn('initAppDownloadCenterEntry failed:', error);
                scheduleRender();
                return false;
            });
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
            setTimeout(() => scheduleRender(attempt + 1), attempt < 2 ? 120 : 260);
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
            if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();
            if (typeof updateMarginalSchoolSelect === 'function') updateMarginalSchoolSelect();
            if (typeof updateSubjectBalanceSelects === 'function') updateSubjectBalanceSelects();
            if (typeof updatePotentialSchoolSelect === 'function') updatePotentialSchoolSelect();
            if (typeof updateSegmentSelects === 'function') updateSegmentSelects();
            if (typeof updateCorrelationSchoolSelect === 'function') updateCorrelationSchoolSelect();
            if (typeof updateClassSelect === 'function') updateClassSelect();
            if (typeof window.smScheduleStudentOverviewRender === 'function') {
                window.smScheduleStudentOverviewRender();
            } else if (typeof window.renderStudentOverview === 'function') {
                window.renderStudentOverview();
            }
        };

        if (typeof window.ensureTeachingManagementRuntimeLoaded === 'function'
            && !window.__TEACHING_MANAGEMENT_RUNTIME_PATCHED__) {
            return window.ensureTeachingManagementRuntimeLoaded()
                .then(() => {
                    if (document.getElementById('student-overview')?.classList.contains('active')) renderNow();
                })
                .catch((error) => console.warn(error));
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
                    const hasClass = SCHOOLS[schoolName].students.some((student) => student.class == cls);
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
                writeCurrentSchool(winner);
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
        if (window.DataManager && typeof DataManager.ensureTeacherMap === 'function') {
            window.setTimeout(() => {
                if (!document.getElementById('teacher-analysis')?.classList.contains('active')) return;
                try {
                    DataManager.ensureTeacherMap(true);
                } catch (error) {
                    console.warn('[teacher-analysis] teacher map preload failed:', error);
                }
            }, TEACHER_ANALYSIS_PRELOAD_DELAY_MS);
        }
        window.setTimeout(() => {
            if (!document.getElementById('teacher-analysis')?.classList.contains('active')) return;
            if (typeof updateTeacherCompareExamSelects === 'function') updateTeacherCompareExamSelects();
        }, 180);

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

        window.setTimeout(() => {
            if (!document.getElementById('teacher-analysis')?.classList.contains('active')) return;
            inferTeacherSchoolIfNeeded();
        }, 220);

        const runAfterLoad = () => {
            if (!document.getElementById('teacher-analysis')?.classList.contains('active')) return;
            const teacherMapReady = window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0;
            if (teacherMapReady && typeof window.analyzeTeachers === 'function') {
                scheduleTeacherAnalysisRenderWork();
            } else {
                renderTeacherAnalysisEmptyState();
                if (typeof updateTeacherMultiExamSelects === 'function') updateTeacherMultiExamSelects();
                if (typeof updateTeacherCompareTeacherSelect === 'function') updateTeacherCompareTeacherSelect();
            }
        };

        if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function'
            && !window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__) {
            showTeacherAnalysisPendingState();
            return window.ensureTeacherAnalysisMainRuntimeLoaded()
                .then(() => {
                    if (document.getElementById('teacher-analysis')?.classList.contains('active')) runAfterLoad();
                })
                .catch((error) => console.warn('[teacher-analysis] runtime load failed:', error));
        }

        runAfterLoad();
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
            if (typeof updateCorrelationSchoolSelect === 'function') updateCorrelationSchoolSelect();
        };

        runAfterLoad();
        return Promise.resolve();
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
                        if (SCHOOLS[schoolName].students.some((student) => student.class == cls)) {
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

    function initClassComparisonEntry() {
        const run = () => {
            if (!document.getElementById('class-comparison')?.classList.contains('active')) return false;
            if (typeof updateClassCompSchoolSelect === 'function') updateClassCompSchoolSelect();
            pickDefaultSelectValue('classCompSchoolSelect', getCurrentSchoolCandidate());
            scheduleModuleAutoRender('class-comparison-auto', () => {
                const school = String(document.getElementById('classCompSchoolSelect')?.value || '').trim();
                if (!document.getElementById('class-comparison')?.classList.contains('active')) return;
                if (!school || !window.SCHOOLS?.[school] || typeof window.renderClassComparison !== 'function') return;
                window.renderClassComparison();
            }, { delay: 100, timeout: 900 });
            return true;
        };
        run();
        return Promise.resolve();
    }

    function initClassDiagnosisEntry() {
        const run = () => {
            if (!document.getElementById('class-diagnosis')?.classList.contains('active')) return false;
            if (typeof updateDiagnosisSelects === 'function') updateDiagnosisSelects();
            pickDefaultSelectValue('diagSchoolSelect', getCurrentSchoolCandidate());
            pickDefaultSelectValue('diagSubjectSelect', 'total');
            scheduleModuleAutoRender('class-diagnosis-auto', () => {
                const school = String(document.getElementById('diagSchoolSelect')?.value || '').trim();
                if (!document.getElementById('class-diagnosis')?.classList.contains('active')) return;
                if (!school || !window.SCHOOLS?.[school] || typeof window.renderClassDiagnosis !== 'function') return;
                window.renderClassDiagnosis();
            }, { delay: 100, timeout: 900 });
            return true;
        };
        run();
        return Promise.resolve();
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
            return Promise.all(loaders)
                .then(() => {
                    if (document.getElementById(id)?.classList.contains('active')) return runAfterLoad();
                    return false;
                })
                .catch((error) => {
                    console.warn('init freshman/exam runtime failed:', error);
                    return false;
                });
        }

        return Promise.resolve(runAfterLoad());
    }

    let macroTablesRenderTimer = 0;

    function scheduleMacroTablesRender(activeModuleId, label = 'macro-entry') {
        if (macroTablesRenderTimer) {
            window.clearTimeout(macroTablesRenderTimer);
            macroTablesRenderTimer = 0;
        }
        const run = () => {
            macroTablesRenderTimer = 0;
            if (activeModuleId && !document.getElementById(activeModuleId)?.classList.contains('active')) return;
            if (typeof window.renderTables === 'function') window.renderTables();
        };
        const start = () => {
            if (window.SystemPerformance && typeof window.SystemPerformance.scheduleIdle === 'function') {
                window.SystemPerformance.scheduleIdle(run, { label, delay: 40, timeout: 900 });
                return;
            }
            if (typeof window.requestIdleCallback === 'function') {
                window.requestIdleCallback(run, { timeout: 900 });
                return;
            }
            window.setTimeout(run, 40);
        };
        macroTablesRenderTimer = window.setTimeout(start, 60);
    }

    function runModuleSpecificInit(id) {
        if (id === 'student-details') return initStudentDetailsEntry();
        if (id === 'summary') {
            scheduleMacroTablesRender('summary', 'summary-tables');
            if (typeof window.ensureSchoolProfileRuntimeLoaded === 'function'
                && !window.__SCHOOL_PROFILE_RUNTIME_PATCHED__) {
                return window.ensureSchoolProfileRuntimeLoaded().catch((error) => console.warn(error));
            }
        }
        if (id === 'app-download-center') return initAppDownloadCenterEntry();
        if (id === 'analysis') {
            if (typeof updateMacroMultiExamSelects === 'function') updateMacroMultiExamSelects();
            renderSingleSchoolAnalysisHint();
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
            if (typeof window.ensureCountyAnalysisRuntimeLoaded === 'function'
                && !window.__COUNTY_ANALYSIS_RUNTIME_PATCHED__) {
                return window.ensureCountyAnalysisRuntimeLoaded()
                    .then(() => {
                        const active = document.getElementById(id)?.classList.contains('active')
                            || (id === 'county-analysis'
                                && (document.getElementById('county-teacher-portrait')?.classList.contains('active')
                                    || document.getElementById('county-school-horizontal')?.classList.contains('active')));
                        if (active) return renderCounty();
                        return false;
                    })
                    .catch((error) => {
                        console.warn('init county analysis failed:', error);
                        return false;
                    });
            }
            return renderCounty();
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
        if (id === 'report-generator') {
            updateSchoolSelect();
            updateClassSelect();
        }
        if (id === 'segment-analysis') updateSegmentSelects();
        if (id === 'class-comparison') return initClassComparisonEntry();
        if (id === 'potential-analysis') updatePotentialSchoolSelect();
        if (id === 'class-diagnosis') return initClassDiagnosisEntry();
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
                    ? new Promise(resolve => setTimeout(() => resolve(runInit()), 40))
                    : runInit();
                if (['class-comparison', 'class-diagnosis'].includes(id)) {
                    setTimeout(() => {
                        if (typeof tmRenderTeachingModuleStateBars === 'function') tmRenderTeachingModuleStateBars(id);
                    }, 0);
                }
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
