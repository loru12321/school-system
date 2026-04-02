(() => {
    if (typeof window === 'undefined' || window.__MODULE_ENTRY_RUNTIME_PATCHED__) return;

    const TEACHING_MANAGEMENT_MODULE_IDS = new Set([
        'teaching-overview',
        'teaching-issue-board',
        'teaching-warning-center',
        'teaching-rectify-center',
        'teaching-version-center'
    ]);

    function activateTeachingManagementModule(id) {
        if (id === 'teaching-overview') {
            renderTeachingOverview();
            tmRefreshVersionCenter(false);
            return true;
        }
        if (id === 'teaching-issue-board') {
            bindTeachingOverviewActions();
            tmRenderIssueBoard();
            tmRefreshCloudOps(false);
            return true;
        }
        if (id === 'teaching-warning-center') {
            bindTeachingOverviewActions();
            tmRenderWarningCenter();
            tmRefreshCloudOps(false);
            return true;
        }
        if (id === 'teaching-rectify-center') {
            bindTeachingOverviewActions();
            tmRenderRectifyCenter();
            tmRefreshCloudOps(false);
            return true;
        }
        if (id === 'teaching-version-center') {
            bindTeachingOverviewActions();
            tmRenderVersionCenter();
            tmRefreshVersionCenter(false);
            return true;
        }
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

    function initStudentDetailsEntry() {
        updateStudentSchoolSelect();
        if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
        if (typeof updateReportCompareExamSelects === 'function') updateReportCompareExamSelects();

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

    function initAIAnalysisEntry() {
        if (typeof window.ensureAIHubRuntimeLoaded === 'function' && !window.__AI_HUB_RUNTIME_PATCHED__) {
            return window.ensureAIHubRuntimeLoaded()
                .then(() => {
                    if (document.getElementById('ai-analysis')?.classList.contains('active')
                        && typeof window.renderAIAnalysisHub === 'function') {
                        window.renderAIAnalysisHub();
                    }
                })
                .catch((error) => console.warn(error));
        }
        if (typeof window.renderAIAnalysisHub === 'function') window.renderAIAnalysisHub();
        return Promise.resolve();
    }

    function initTeachingManagementEntry(id) {
        const renderNow = () => {
            activateTeachingManagementModule(id);
        };

        if (typeof window.ensureTeachingManagementRuntimeLoaded === 'function'
            && !window.__TEACHING_MANAGEMENT_RUNTIME_PATCHED__) {
            return window.ensureTeachingManagementRuntimeLoaded()
                .then(() => {
                    const activeSection = document.getElementById(id);
                    if (!activeSection || !activeSection.classList.contains('active')) return;
                    renderNow();
                })
                .catch((error) => console.warn(error));
        }

        renderNow();
        return Promise.resolve();
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
            if (typeof window.renderStudentOverview === 'function') window.renderStudentOverview();
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
        const schoolNames = Object.keys(SCHOOLS);
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
        if (window.DataManager && typeof DataManager.ensureTeacherMap === 'function') {
            DataManager.ensureTeacherMap(true);
        }
        if (typeof updateTeacherCompareExamSelects === 'function') updateTeacherCompareExamSelects();

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

        inferTeacherSchoolIfNeeded();

        const runAfterLoad = () => {
            if (!document.getElementById('teacher-analysis')?.classList.contains('active')) return;
            const teacherMapReady = window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0;
            if (teacherMapReady && typeof window.analyzeTeachers === 'function') {
                window.analyzeTeachers();
                if (typeof window.renderTeacherComparisonTable === 'function') window.renderTeacherComparisonTable();
                if (typeof window.renderTeacherTownshipRanking === 'function') window.renderTeacherTownshipRanking();
            } else {
                renderTeacherAnalysisEmptyState();
            }
            if (typeof updateTeacherMultiExamSelects === 'function') updateTeacherMultiExamSelects();
            if (typeof updateTeacherCompareTeacherSelect === 'function') updateTeacherCompareTeacherSelect();
        };

        if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function') {
            return window.ensureTeacherAnalysisMainRuntimeLoaded()
                .then(runAfterLoad)
                .catch((error) => console.warn(error));
        }

        runAfterLoad();
        return Promise.resolve();
    }

    function initCorrelationAnalysisEntry() {
        const runAfterLoad = () => {
            if (typeof updateCorrelationSchoolSelect === 'function') updateCorrelationSchoolSelect();
        };

        if (typeof window.ensureTeacherAnalysisMainRuntimeLoaded === 'function'
            && !window.__TEACHER_ANALYSIS_MAIN_RUNTIME_PATCHED__) {
            return window.ensureTeacherAnalysisMainRuntimeLoaded()
                .then(() => {
                    if (document.getElementById('correlation-analysis')?.classList.contains('active')) runAfterLoad();
                })
                .catch((error) => console.warn(error));
        }

        runAfterLoad();
        return Promise.resolve();
    }

    function initProgressAnalysisEntry() {
        const runNow = () => {
            if (!MY_SCHOOL && typeof TEACHER_MAP !== 'undefined' && Object.keys(TEACHER_MAP).length > 0 && typeof SCHOOLS !== 'undefined') {
                const schoolCounts = {};
                const schoolNames = Object.keys(SCHOOLS);
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

    function initSingleSchoolEvalEntry() {
        if (typeof window.ensureSingleSchoolEvalRuntimeLoaded === 'function') {
            window.ensureSingleSchoolEvalRuntimeLoaded().catch((error) => console.warn(error));
        }
        if (typeof updateSSESchoolSelect === 'function') {
            return Promise.resolve(updateSSESchoolSelect()).catch((error) => console.warn(error));
        }
        return Promise.resolve();
    }

    function runModuleSpecificInit(id) {
        if (id === 'student-details') return initStudentDetailsEntry();
        if (id === 'summary'
            && typeof window.ensureSchoolProfileRuntimeLoaded === 'function'
            && !window.__SCHOOL_PROFILE_RUNTIME_PATCHED__) {
            return window.ensureSchoolProfileRuntimeLoaded().catch((error) => console.warn(error));
        }
        if (id === 'ai-analysis') return initAIAnalysisEntry();
        if (id === 'analysis') {
            if (typeof updateMacroMultiExamSelects === 'function') updateMacroMultiExamSelects();
            renderSingleSchoolAnalysisHint();
        }
        if (TEACHING_MANAGEMENT_MODULE_IDS.has(id)) return initTeachingManagementEntry(id);
        if (id === 'indicator' && typeof refreshIndicatorResults === 'function') refreshIndicatorResults(true);
        if (id === 'high-score' && typeof renderHighScoreTable === 'function') renderHighScoreTable();
        if (id === 'student-overview') return initStudentOverviewEntry();
        if (id === 'zhongkao-countdown'
            && window.ZhongkaoCountdownModule
            && typeof window.ZhongkaoCountdownModule.ensureInitialized === 'function') {
            window.ZhongkaoCountdownModule.ensureInitialized();
        }
        if (id === 'teacher-analysis') return initTeacherAnalysisEntry();
        if (id === 'exam-arranger') EXAM_initProctorUI();
        if (id === 'report-generator') {
            updateSchoolSelect();
            updateClassSelect();
        }
        if (id === 'segment-analysis') updateSegmentSelects();
        if (id === 'class-comparison') updateClassCompSchoolSelect();
        if (id === 'potential-analysis') updatePotentialSchoolSelect();
        if (id === 'class-diagnosis') updateDiagnosisSelects();
        if (id === 'correlation-analysis') return initCorrelationAnalysisEntry();
        if (id === 'seat-adjustment') updateSeatAdjSelects();
        if (id === 'subject-balance') updateSubjectBalanceSelects();
        if (id === 'progress-analysis') return initProgressAnalysisEntry();
        if (id === 'mutual-aid') updateMutualAidSelects();
        if (id === 'marginal-push') updateMpSchoolSelect();
        if (id === 'single-school-eval') return initSingleSchoolEvalEntry();
        return Promise.resolve();
    }

    window.runModuleTabEnter = function (context = {}) {
        const id = String(context.id || '').trim();
        if (!id) return Promise.resolve(false);

        syncModuleEnterChrome(context);

        try {
            const result = runModuleSpecificInit(id);
            if (['teacher-analysis', 'class-comparison', 'class-diagnosis', 'single-school-eval'].includes(id)) {
                setTimeout(() => {
                    if (typeof tmRenderTeachingModuleStateBars === 'function') tmRenderTeachingModuleStateBars();
                }, 0);
            }
            return Promise.resolve(result);
        } catch (error) {
            console.error('runModuleTabEnter failed:', error);
            return Promise.reject(error);
        }
    };

    window.activateTeachingManagementModule = activateTeachingManagementModule;
    window.renderSingleSchoolAnalysisHint = renderSingleSchoolAnalysisHint;
    window.__MODULE_ENTRY_RUNTIME_PATCHED__ = true;
})();
