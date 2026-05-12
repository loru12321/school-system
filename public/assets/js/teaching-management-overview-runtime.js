// Teaching management runtime: teaching overview cards and module state bars.
function tmGetOverviewContext() {
    return {
        schoolValue: tmGetSelectRawValue(['teacherCompareSchool', 'mySchoolSelect', 'studentSchoolSelect'], String(window.MY_SCHOOL || '').trim()),
        schoolText: tmGetSelectDisplayValue(['teacherCompareSchool', 'mySchoolSelect', 'studentSchoolSelect'], String(window.MY_SCHOOL || '').trim() || '未识别'),
        subjectValue: tmGetSelectRawValue(['teacherCompareSubject', 'subjectSelect'], ''),
        subjectText: tmGetSelectDisplayValue(['teacherCompareSubject', 'subjectSelect'], '全部学科'),
        teacherValue: tmGetSelectRawValue(['teacherCompareTeacher', 'teacherNameSelect'], ''),
        teacherText: tmGetSelectDisplayValue(['teacherCompareTeacher', 'teacherNameSelect'], '全部教师'),
        exam1Value: tmGetSelectRawValue(['teacherCompareExam1', 'studentCompareExam1'], ''),
        exam1Text: tmGetSelectDisplayValue(['teacherCompareExam1', 'studentCompareExam1'], '未选择'),
        exam2Value: tmGetSelectRawValue(['teacherCompareExam2', 'studentCompareExam2'], ''),
        exam2Text: tmGetSelectDisplayValue(['teacherCompareExam2', 'studentCompareExam2'], '未选择'),
        periodValue: tmGetSelectRawValue(['teacherComparePeriodCount', 'studentComparePeriodCount'], '2'),
        periodText: tmGetSelectDisplayValue(['teacherComparePeriodCount', 'studentComparePeriodCount'], '2期')
    };
}

function tmJumpToTeachingModule(targetId) {
    const context = tmGetOverviewContext();
    if (typeof switchTab === 'function') switchTab(targetId);

    setTimeout(() => {
        if (targetId === 'teacher-analysis') {
            tmApplySelectValue('teacherCompareSchool', context.schoolValue, context.schoolText);
            tmApplySelectValue('teacherCompareSubject', context.subjectValue, context.subjectText);
            if (typeof updateTeacherCompareTeacherSelect === 'function') updateTeacherCompareTeacherSelect();
            tmApplySelectValue('teacherCompareTeacher', context.teacherValue, context.teacherText);
            tmApplySelectValue('teacherComparePeriodCount', context.periodValue, context.periodText);
            if (typeof updateTeacherCompareExamSelects === 'function') updateTeacherCompareExamSelects();
            tmApplySelectValue('teacherCompareExam1', context.exam1Value, context.exam1Text);
            tmApplySelectValue('teacherCompareExam2', context.exam2Value, context.exam2Text);
            return;
        }

        if (targetId === 'class-comparison') {
            if (typeof updateClassCompSchoolSelect === 'function') updateClassCompSchoolSelect();
            const ok = tmApplySelectValue('classCompSchoolSelect', context.schoolValue, context.schoolText);
            if (ok && typeof renderClassComparison === 'function') renderClassComparison();
            return;
        }

    }, 60);
}

function tmBuildQuickEntryHtml(icon, title, desc, stateText, tone = 'neutral') {
    return `
        <div class="tm-quick-head">
            <span class="tm-quick-title"><i class="${tmEscapeHtml(icon)}"></i> ${tmEscapeHtml(title)}</span>
            ${tmBuildStatusChip(stateText, tone)}
        </div>
        <div class="tm-quick-desc">${tmEscapeHtml(desc)}</div>
    `;
}

function tmSetQuickEntryState(targetId, icon, title, desc, stateText, tone = 'neutral') {
    const btn = document.querySelector(`#tmQuickEntry [data-target="${targetId}"]`);
    if (!btn) return;
    btn.classList.add('tm-quick-entry-btn');
    btn.innerHTML = tmBuildQuickEntryHtml(icon, title, desc, stateText, tone);
}

function tmRenderQuickEntries(model) {
    tmSetQuickEntryState(
        'teacher-analysis',
        'ti ti-school',
        '教师画像',
        model.teacherReady
            ? (model.teacherInsight.riskTeacherCount > 0 ? `已发现 ${model.teacherInsight.riskTeacherCount} 位风险教师，建议优先查看。` : '任课表和教师画像数据已可直接查看。')
            : '需先同步任课表并生成教师画像。',
        model.teacherReady ? '已就绪' : '待补数据',
        model.teacherReady ? 'ok' : 'warn'
    );
    tmSetQuickEntryState(
        'class-comparison',
        'ti ti-layout-columns',
        '班级对比',
        model.scoreReady && model.schoolReady
            ? `已锁定 ${model.schoolText}，可直接查看班级横向对比。`
            : '需先识别学校并接入成绩数据。',
        model.scoreReady && model.schoolReady ? '可进入' : '待学校',
        model.scoreReady && model.schoolReady ? 'ok' : 'warn'
    );
}

function tmRenderNextAction(model) {
    const targetMap = {
        teacher: 'teacher-analysis',
        teacher_sync: 'teacher-analysis',
        score_import: 'teacher-analysis',
        class: 'class-comparison',
    };

    let title = '教学入口已就绪';
    let desc = '当前成绩、学校和任课表状态已经满足基本使用条件，可以直接进入分析页面。';
    let stateText = '可直接使用';
    let tone = 'ok';
    let targetKey = 'teacher';

    if (!model.scoreReady) {
        title = '优先补成绩数据';
        desc = '当前届别还没有可用于教学管理的成绩数据，建议先打开教务控制台导入成绩，再进行教师画像和班级分析。';
        stateText = '先导入成绩';
        tone = 'warn';
        targetKey = 'score_import';
    } else if (!model.teacherReady) {
        title = '优先同步任课表';
        desc = '成绩已经到位，但任课表还没有恢复到当前学期。先同步任课表，教师画像和班级诊断口径会更完整。';
        stateText = '先同步任课表';
        tone = 'warn';
        targetKey = 'teacher_sync';
    } else if (model.teacherInsight.riskTeacherCount > 0) {
        title = '优先查看教师画像';
        desc = `当前筛选范围内有 ${model.teacherInsight.riskTeacherCount} 位教师出现风险信号，建议先进入教师教学质量画像定位问题班级与学科。`;
        stateText = '先看教师画像';
        tone = 'warn';
        targetKey = 'teacher';
    } else if (model.schoolReady) {
        title = '优先查看班级横向对比';
        desc = '当前学校已经识别完成，虽然多期条件还未满足，但已经可以先做单次考试的班级横向对比。';
        stateText = '先看班级对比';
        tone = 'info';
        targetKey = 'class';
    }

    tmSetHtml(
        'tmNextAction',
        `
            <div class="tm-next-card">
                <div>
                    <div class="tm-next-title">${tmEscapeHtml(title)}</div>
                    <div class="tm-next-desc">${tmEscapeHtml(desc)}</div>
                    <div class="tm-next-meta">
                        ${tmBuildStatusChip(stateText, tone)}
                        ${model.schoolText ? `<span class="status-chip neutral">${tmEscapeHtml(model.schoolText)}</span>` : ''}
                        ${model.compareReady ? `<span class="status-chip ok">已满足多期条件</span>` : ''}
                    </div>
                </div>
                <button type="button" class="btn tm-next-btn" data-target="${tmEscapeHtml(targetMap[targetKey])}">
                    立即前往
                </button>
            </div>
        `
    );

    const nextBtn = document.querySelector('#tmNextAction .tm-next-btn');
    if (nextBtn) {
        nextBtn.onclick = () => {
            if (targetKey === 'teacher_sync') {
                const syncBtn = document.getElementById('tmQuickSyncTeacherBtn');
                if (syncBtn) syncBtn.click();
                return;
            }
            if (targetKey === 'score_import') {
                const consoleBtn = document.getElementById('tmQuickOpenConsoleBtn');
                if (consoleBtn) consoleBtn.click();
                return;
            }
            tmJumpToTeachingModule(nextBtn.dataset.target);
        };
    }
}

function tmNormalizeFocusIds(focusIds) {
    if (!focusIds) return [];
    const raw = Array.isArray(focusIds) ? focusIds : [focusIds];
    return raw
        .flatMap((item) => String(item || '').split('|'))
        .map((item) => String(item || '').trim())
        .filter(Boolean);
}

function tmIsFocusTargetVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle ? window.getComputedStyle(el) : null;
    if (style && (style.display === 'none' || style.visibility === 'hidden')) return false;
    if (el.closest('[hidden]')) return false;
    return true;
}

function tmPulseField(el) {
    if (!el) return;
    el.classList.remove('tm-field-flash');
    void el.offsetWidth;
    el.classList.add('tm-field-flash');
    setTimeout(() => el.classList.remove('tm-field-flash'), 1400);
}

function tmFocusStateTarget(focusIds) {
    const ids = tmNormalizeFocusIds(focusIds);
    if (!ids.length) return false;

    const targets = ids.map((id) => document.getElementById(id)).filter(Boolean);
    if (!targets.length) return false;
    const target = targets.find(tmIsFocusTargetVisible) || targets[0];
    if (!target) return false;

    const details = target.closest('details');
    if (details && !details.open) details.open = true;

    target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
    setTimeout(() => {
        if (typeof target.focus === 'function') {
            try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
        }
        if (target.tagName === 'INPUT' && typeof target.select === 'function') {
            try { target.select(); } catch (_) { }
        }
        tmPulseField(target);
    }, 120);
    return true;
}

function tmBindModuleStateActions(container) {
    if (!container) return;
    container.querySelectorAll('.tm-module-state-item[data-focus-ids]').forEach((item) => {
        if (item.dataset.tmStateBound === '1') return;
        item.dataset.tmStateBound = '1';
        item.addEventListener('click', () => tmFocusStateTarget(item.dataset.focusIds));
    });
}

function tmBuildModuleStateItem(label, value, meta = '', focusIds = null, tone = 'neutral') {
    const ids = tmNormalizeFocusIds(focusIds);
    const isInteractive = ids.length > 0;
    const tag = isInteractive ? 'button' : 'div';
    const attrs = isInteractive
        ? `type="button" class="tm-module-state-item is-interactive tone-${tone}" data-focus-ids="${tmEscapeHtml(ids.join('|'))}" title="点击定位到对应筛选项"`
        : `class="tm-module-state-item tone-${tone}"`;

    return `
        <${tag} ${attrs}>
            <div class="tm-module-state-label">${tmEscapeHtml(label)}</div>
            <div class="tm-module-state-value">${tmEscapeHtml(value || '未设置')}</div>
            ${meta ? `<div class="tm-module-state-meta">${tmEscapeHtml(meta)}</div>` : ''}
            ${isInteractive ? `<div class="tm-module-state-action">点击定位</div>` : ''}
        </${tag}>
    `;
}

function tmRenderModuleStateBar(moduleId) {
    const container = document.getElementById(`tmModuleState-${moduleId}`);
    if (!container) return;

    const statusModel = (window.DataManager && typeof DataManager.getDataManagerStatusModel === 'function')
        ? DataManager.getDataManagerStatusModel()
        : null;
    const exams = tmGetAvailableExamList();
    const teacherCoverage = tmGetTeacherCoverageFromMap();
    const fallbackSchool = readCurrentSchool() || '未识别';
    const teacherStateMap = {
        synced: { text: '已同步并加载', tone: 'ok' },
        synced_unloaded: { text: '已同步待恢复', tone: 'warn' },
        pending: { text: '已导入待同步', tone: 'warn' },
        unknown: { text: '已导入待确认', tone: 'info' },
        missing: { text: '缺任课表', tone: 'warn' }
    };
    const teacherState = teacherStateMap[statusModel?.teachersState]
        || { text: teacherCoverage.mappingCount > 0 ? '已加载' : '缺任课表', tone: teacherCoverage.mappingCount > 0 ? 'ok' : 'warn' };
    const teacherTerm = String(
        statusModel?.teacherSnapshot?.termId
        || readCurrentTeacherTermId()
        || (typeof getPreferredTeacherTermId === 'function' ? getPreferredTeacherTermId() : '')
        || (typeof pickAutoTeacherTerm === 'function' ? pickAutoTeacherTerm() : '')
        || ''
    ).trim() || '未识别';

    let badgeText = '待补数据';
    let badgeTone = 'warn';
    let summary = '当前模块筛选尚未完整';
    let items = [];

    if (moduleId === 'teacher-analysis') {
        const school = tmGetSelectDisplayValue(['teacherCompareSchool', 'mySchoolSelect', 'studentSchoolSelect'], fallbackSchool);
        const subject = tmGetSelectDisplayValue(['teacherCompareSubject', 'subjectSelect'], '全部学科');
        const teacher = tmGetSelectDisplayValue(['teacherCompareTeacher', 'teacherNameSelect'], '全部教师');
        const exam1 = tmGetSelectDisplayValue(['teacherCompareExam1', 'studentCompareExam1'], '未选择');
        const exam2 = tmGetSelectDisplayValue(['teacherCompareExam2', 'studentCompareExam2'], '未选择');
        const period = tmGetSelectDisplayValue(['teacherComparePeriodCount', 'studentComparePeriodCount'], '2期');
        let hintText = '当前可直接生成教师画像';
        let hintTone = 'ok';
        let hintFocus = ['teacherCompareSchool', 'teacherCompareExam1'];

        if (!teacherCoverage.mappingCount) {
            hintText = '缺任课表，请先同步任课表';
            hintTone = 'warn';
            hintFocus = ['teacher-sync-cta', 'teacherCompareSchool'];
        } else if (!school || school === '未识别' || school === '未选择') {
            hintText = '缺学校口径，请先选择本校';
            hintTone = 'warn';
            hintFocus = ['teacherCompareSchool', 'mySchoolSelect'];
        } else if (exams.length < 2) {
            hintText = '可对比考试不足 2 期，多期分析会受限';
            hintTone = 'warn';
        }

        badgeText = teacherCoverage.mappingCount > 0 ? '教师画像已就绪' : '待同步任课表';
        badgeTone = teacherCoverage.mappingCount > 0 ? 'ok' : 'warn';
        summary = `任课表 ${teacherCoverage.mappingCount} 条记录，可用考试 ${exams.length} 期`;
        items = [
            tmBuildModuleStateItem('学校', school, school && school !== '未识别' ? '当前教师画像基于该校口径' : '请先识别本校', ['teacherCompareSchool', 'mySchoolSelect']),
            tmBuildModuleStateItem('学科', subject, teacher === '全部教师' ? '当前按学科聚合' : '当前已下钻到教师', 'teacherCompareSubject'),
            tmBuildModuleStateItem('教师', teacher, `当前期数：${period}`, 'teacherCompareTeacher'),
            tmBuildModuleStateItem('第1期 / 第2期', `${exam1} / ${exam2}`, exams.length >= 2 ? `成绩库共 ${exams.length} 期` : '当前可对比考试不足 2 期', ['teacherCompareExam1', 'teacherCompareExam2']),
            tmBuildModuleStateItem('任课表', teacherTerm, `${teacherState.text} · ${statusModel?.teacherSnapshot?.count ?? teacherCoverage.mappingCount} 条记录`, ['teacher-sync-cta', 'teacherCompareSchool']),
            tmBuildModuleStateItem('当前提示', hintText, '点击可回到最相关的筛选项', hintFocus, hintTone)
        ];
    } else if (moduleId === 'class-comparison') {
        const school = tmGetSelectDisplayValue(['classCompSchoolSelect', 'teacherCompareSchool', 'mySchoolSelect'], fallbackSchool);
        const ready = !!school && school !== '未选择' && school !== '未识别' && exams.length > 0;
        const hintText = ready ? '可直接开始对比' : (!school || school === '未识别' || school === '未选择' ? '缺学校，请先选择学校' : '缺成绩库，请先确认成绩数据');

        badgeText = ready ? '班级对比可用' : '待选学校';
        badgeTone = ready ? 'ok' : 'warn';
        summary = ready ? `当前将按 ${school} 的单次成绩做横向对比` : '请先选择学校并确认成绩库';
        items = [
            tmBuildModuleStateItem('学校', school, school && school !== '未识别' ? '班级横向对比仅在校内进行' : '请先选择学校', 'classCompSchoolSelect'),
            tmBuildModuleStateItem('当前成绩库', exams.length ? `${exams.length} 期考试` : '无可用考试', exams.length ? '将优先使用当前考试批次' : '请先导入成绩', 'classCompSchoolSelect'),
            tmBuildModuleStateItem('对比方式', '单次横向对比', '不依赖第1期 / 第2期选择', 'classCompSchoolSelect'),
            tmBuildModuleStateItem('当前提示', hintText, ready ? '点击可回到学校筛选后直接开始对比' : '点击可回到学校筛选项', 'classCompSchoolSelect', ready ? 'ok' : 'warn')
        ];
    }

    container.innerHTML = `
        <div class="tm-module-statebar">
            <div class="tm-module-state-head">
                <div class="tm-module-state-title">当前分析依据</div>
                ${tmBuildStatusChip(badgeText, badgeTone)}
            </div>
            <div class="tm-module-state-meta" style="margin-bottom:12px;">${tmEscapeHtml(summary)}</div>
            <div class="tm-module-state-grid">
                ${items.join('')}
            </div>
        </div>
    `;
    tmBindModuleStateActions(container);
}

function tmRenderTeachingModuleStateBars(targetModuleId = '') {
    bindTeachingOverviewWatchers();
    const supportedModules = ['teacher-analysis', 'class-comparison'];
    const requestedId = String(targetModuleId || '').trim();
    if (supportedModules.includes(requestedId)) {
        tmRenderModuleStateBar(requestedId);
        return;
    }
    const activeId = String(document.querySelector('.section.active')?.id || '').trim();
    if (supportedModules.includes(activeId)) {
        tmRenderModuleStateBar(activeId);
        return;
    }
    supportedModules
        .filter((moduleId) => document.getElementById(`tmModuleState-${moduleId}`))
        .forEach(tmRenderModuleStateBar);
}

function bindTeachingOverviewWatchers() {
    const watchedIds = [
        'teacherCompareSchool',
        'mySchoolSelect',
        'studentSchoolSelect',
        'teacherCompareSubject',
        'subjectSelect',
        'teacherCompareTeacher',
        'teacherNameSelect',
        'teacherCompareExam1',
        'studentCompareExam1',
        'teacherCompareExam2',
        'studentCompareExam2',
        'teacherComparePeriodCount',
        'studentComparePeriodCount',
        'classCompSchoolSelect'
    ];

    watchedIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.tmOverviewBound === '1') return;
        el.dataset.tmOverviewBound = '1';
        el.addEventListener('change', () => {
            tmScheduleTeachingOverviewRender();
        });
    });
}

function bindTeachingOverviewActions() {
    tmRepairVersionToolbarLayout();

    bindTeachingOverviewWatchers();

    const refreshCloudBtn = document.getElementById('tmRefreshCloudOpsBtn');
    if (refreshCloudBtn && refreshCloudBtn.dataset.tmBound !== '1') {
        refreshCloudBtn.dataset.tmBound = '1';
        refreshCloudBtn.onclick = () => {
            tmRefreshCloudOps(true);
        };
    }

    const syncBtn = document.getElementById('tmQuickSyncTeacherBtn');
    if (syncBtn) {
        syncBtn.onclick = async () => {
            if (typeof openTeacherSync === 'function') await openTeacherSync();
            tmScheduleTeachingOverviewRender();
        };
    }

    const consoleBtn = document.getElementById('tmQuickOpenConsoleBtn');
    if (consoleBtn) {
        consoleBtn.onclick = () => {
            if (window.DataManager && typeof DataManager.open === 'function') {
                DataManager.open();
                if (typeof DataManager.switchTab === 'function') DataManager.switchTab('teacher');
                return;
            }
            if (typeof switchTab === 'function') switchTab('teacher-analysis');
        };
    }

    const exportBtn = document.getElementById('tmQuickExportBtn');
    if (exportBtn) {
        exportBtn.onclick = () => {
            if (typeof switchTab === 'function') switchTab('teacher-analysis');
            setTimeout(() => {
                if (typeof exportTeacherAnalysis === 'function') exportTeacherAnalysis();
            }, 120);
        };
    }

    document.querySelectorAll('#tmQuickEntry [data-target]').forEach((btn) => {
        btn.onclick = () => {
            tmJumpToTeachingModule(btn.dataset.target);
        };
    });

    const warningRefreshBtn = document.getElementById('tmWarningCenterRefreshBtn');
    if (warningRefreshBtn && warningRefreshBtn.dataset.tmBound !== '1') {
        warningRefreshBtn.dataset.tmBound = '1';
        warningRefreshBtn.onclick = () => {
            tmRefreshCloudOps(true);
        };
    }

    const rectifyRefreshBtn = document.getElementById('tmRectifyCenterRefreshBtn');
    if (rectifyRefreshBtn && rectifyRefreshBtn.dataset.tmBound !== '1') {
        rectifyRefreshBtn.dataset.tmBound = '1';
        rectifyRefreshBtn.onclick = () => {
            tmRefreshCloudOps(true);
        };
    }

    const rectifyCreateBtn = document.getElementById('tmRectifyCreateBtn');
    if (rectifyCreateBtn && rectifyCreateBtn.dataset.tmBound !== '1') {
        rectifyCreateBtn.dataset.tmBound = '1';
        rectifyCreateBtn.onclick = () => {
            tmCreateManualRectifyTask();
        };
    }

    const issueRefreshBtn = document.getElementById('tmIssueBoardRefreshBtn');
    if (issueRefreshBtn && issueRefreshBtn.dataset.tmBound !== '1') {
        issueRefreshBtn.dataset.tmBound = '1';
        issueRefreshBtn.onclick = () => {
            tmRefreshCloudOps(true);
            tmRenderIssueBoard();
        };
    }

    const versionRefreshBtn = document.getElementById('tmVersionRefreshBtn');
    if (versionRefreshBtn && versionRefreshBtn.dataset.tmBound !== '1') {
        versionRefreshBtn.dataset.tmBound = '1';
        versionRefreshBtn.onclick = () => {
            tmRefreshVersionCenter(true);
        };
    }

    const versionCreateBtn = document.getElementById('tmVersionCreateBtn');
    if (versionCreateBtn && versionCreateBtn.dataset.tmBound !== '1') {
        versionCreateBtn.dataset.tmBound = '1';
        versionCreateBtn.onclick = () => {
            tmCreateCurrentVersionSnapshot();
        };
    }

    const versionCompareStableBtn = document.getElementById('tmVersionCompareStableBtn');
    if (versionCompareStableBtn && versionCompareStableBtn.dataset.tmBound !== '1') {
        versionCompareStableBtn.dataset.tmBound = '1';
        versionCompareStableBtn.onclick = () => {
            const versionId = String(versionCompareStableBtn.dataset.versionId || '').trim();
            if (!versionId) return;
            tmShowVersionDiff(versionId);
        };
    }

    const versionMarkLatestStableBtn = document.getElementById('tmVersionMarkLatestStableBtn');
    if (versionMarkLatestStableBtn && versionMarkLatestStableBtn.dataset.tmBound !== '1') {
        versionMarkLatestStableBtn.dataset.tmBound = '1';
        versionMarkLatestStableBtn.onclick = () => {
            tmMarkLatestVersionStable();
        };
    }

    const versionSearchInput = document.getElementById('tmVersionSearchInput');
    if (versionSearchInput && versionSearchInput.dataset.tmBound !== '1') {
        versionSearchInput.dataset.tmBound = '1';
        versionSearchInput.addEventListener('input', () => {
            tmRenderVersionCenter();
        });
    }

    const versionStableFilter = document.getElementById('tmVersionStableFilter');
    if (versionStableFilter && versionStableFilter.dataset.tmBound !== '1') {
        versionStableFilter.dataset.tmBound = '1';
        versionStableFilter.addEventListener('change', () => {
            tmRenderVersionCenter();
        });
    }

    const versionSortOrder = document.getElementById('tmVersionSortOrder');
    if (versionSortOrder && versionSortOrder.dataset.tmBound !== '1') {
        versionSortOrder.dataset.tmBound = '1';
        versionSortOrder.addEventListener('change', () => {
            tmRenderVersionCenter();
        });
    }

    const versionDiffOnlyBtn = document.getElementById('tmVersionDiffOnlyBtn');
    if (versionDiffOnlyBtn && versionDiffOnlyBtn.dataset.tmBound !== '1') {
        versionDiffOnlyBtn.dataset.tmBound = '1';
        versionDiffOnlyBtn.dataset.active = versionDiffOnlyBtn.dataset.active || '0';
        tmUpdateVersionDiffOnlyButton();
        tmUpdateVersionNormalDiffButton();
        versionDiffOnlyBtn.addEventListener('click', () => {
            versionDiffOnlyBtn.dataset.active = versionDiffOnlyBtn.dataset.active === '1' ? '0' : '1';
            tmUpdateVersionDiffOnlyButton();
            tmUpdateVersionNormalDiffButton();
            tmRenderVersionCenter();
        });
    }

    const versionNormalDiffBtn = document.getElementById('tmVersionNormalDiffBtn');
    if (versionNormalDiffBtn && versionNormalDiffBtn.dataset.tmBound !== '1') {
        versionNormalDiffBtn.dataset.tmBound = '1';
        tmUpdateVersionNormalDiffButton();
        versionNormalDiffBtn.addEventListener('click', () => {
            const stableFilter = document.getElementById('tmVersionStableFilter');
            const versionDiffOnly = document.getElementById('tmVersionDiffOnlyBtn');
            const active = tmUpdateVersionNormalDiffButton();
            if (stableFilter) stableFilter.value = active ? 'all' : 'normal';
            if (versionDiffOnly) versionDiffOnly.dataset.active = active ? '0' : '1';
            tmUpdateVersionDiffOnlyButton();
            tmUpdateVersionNormalDiffButton();
            tmRenderVersionCenter();
        });
    }

    [
        ['tmWarningLevelFilter', tmRenderWarningCenter],
        ['tmWarningStatusFilter', tmRenderWarningCenter],
        ['tmWarningTypeFilter', tmRenderWarningCenter],
        ['tmRectifyStatusFilter', tmRenderRectifyCenter],
        ['tmRectifyPriorityFilter', tmRenderRectifyCenter],
        ['tmRectifyOwnerFilter', tmRenderRectifyCenter]
    ].forEach(([id, handler]) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.tmBound !== '1') {
            if (!el) return;
            el.dataset.tmBound = '1';
            el.addEventListener('change', () => {
                if (typeof handler === 'function') handler();
            });
        }
    });
}

function tmRepairVersionToolbarLayout() {
    const versionToolbar = document.querySelector('#teaching-version-center .tm-center-toolbar');
    if (!versionToolbar) return;

    const sortSelect = document.getElementById('tmVersionSortOrder');
    if (sortSelect && !versionToolbar.contains(sortSelect)) {
        const wrap = document.createElement('div');
        const label = document.createElement('label');
        label.textContent = '时间排序';
        wrap.appendChild(label);
        wrap.appendChild(sortSelect);
        versionToolbar.appendChild(wrap);
    }

    const diffBtn = document.getElementById('tmVersionDiffOnlyBtn');
    const normalBtn = document.getElementById('tmVersionNormalDiffBtn');
    if (diffBtn && normalBtn && !versionToolbar.contains(diffBtn)) {
        const outer = document.createElement('div');
        outer.style.display = 'flex';
        outer.style.alignItems = 'flex-end';
        const inner = document.createElement('div');
        inner.style.display = 'flex';
        inner.style.gap = '8px';
        inner.style.flexWrap = 'wrap';
        inner.appendChild(diffBtn);
        inner.appendChild(normalBtn);
        outer.appendChild(inner);
        versionToolbar.appendChild(outer);
    }
}

function renderTeachingOverview() {
    const statusModel = (window.DataManager && typeof DataManager.getDataManagerStatusModel === 'function')
        ? DataManager.getDataManagerStatusModel()
        : null;
    const teacherCoverage = tmGetTeacherCoverageFromMap();
    const exams = tmGetAvailableExamList();
    const selectedSubjectValue = tmGetSelectRawValue(['teacherCompareSubject', 'subjectSelect'], '');
    const selectedTeacherValue = tmGetSelectRawValue(['teacherCompareTeacher', 'teacherNameSelect'], '');
    const teacherInsight = tmBuildTeacherInsight(selectedSubjectValue, selectedTeacherValue);
    const versionDrift = tmBuildVersionDriftState();

    const school = tmGetSelectDisplayValue(
        ['teacherCompareSchool', 'mySchoolSelect', 'studentSchoolSelect'],
        String(window.MY_SCHOOL || '').trim() || '未识别'
    );
    const subject = tmGetSelectDisplayValue(['teacherCompareSubject', 'subjectSelect'], '全部学科');
    const teacher = tmGetSelectDisplayValue(['teacherCompareTeacher', 'teacherNameSelect'], '全部教师');
    const exam1 = tmGetSelectDisplayValue(['teacherCompareExam1', 'studentCompareExam1'], '未选择');
    const exam2 = tmGetSelectDisplayValue(['teacherCompareExam2', 'studentCompareExam2'], '未选择');
    const period = tmGetSelectDisplayValue(['teacherComparePeriodCount', 'studentComparePeriodCount'], '2期');
    const examMeta = typeof getExamMetaFromUI === 'function' ? (getExamMetaFromUI() || {}) : {};
    const currentExamText = [
        examMeta.cohortLabel || examMeta.cohortId || '',
        examMeta.gradeLabel || examMeta.grade || '',
        examMeta.year || '',
        examMeta.term || '',
        examMeta.examName || examMeta.name || ''
    ].filter(Boolean).join(' ');
    const currentExam = currentExamText
        || exam1
        || String(readWorkspaceExamId() || window.CURRENT_EXAM_ID || '').trim()
        || '未选择';
    const teacherTerm = String(
        statusModel?.teacherSnapshot?.termId
        || readCurrentTeacherTermId()
        || (typeof getPreferredTeacherTermId === 'function' ? getPreferredTeacherTermId() : '')
        || (typeof pickAutoTeacherTerm === 'function' ? pickAutoTeacherTerm() : '')
        || readCurrentTermId()
        || ''
    ).trim() || '未识别';
    const lastSyncText = String(statusModel?.lastSyncText || '').trim() || '尚未记录';
    const lastSyncSource = String(statusModel?.lastSyncSource || '').trim() || '暂无云端同步记录';

    const versionAuthState = String(TM_VERSION_CACHE?.authState || 'unknown');
    const canShowStableState = tmCanManageVersions() && versionAuthState === 'ready';
    const stableSummary = tmCanManageVersions()
        ? (canShowStableState
            ? (versionDrift.hasStable
                ? (versionDrift.changedCount ? `稳定版有 ${versionDrift.changedCount} 项变化` : '已与稳定版对齐')
                : '尚未设置稳定版')
            : (versionAuthState === 'missing_token' ? '重新登录后可查看稳定版' : '稳定版状态待刷新'))
        : '稳定版状态仅管理角色可见';
    const scoreReady = exams.length > 0;
    const teacherReady = teacherCoverage.mappingCount > 0;
    const schoolReady = !!school && school !== '未识别' && school !== '未选择';
    const compareReady = exams.length >= 2 && exam1 !== '未选择' && exam2 !== '未选择' && exam1 !== exam2;
    const overviewModel = {
        scoreReady,
        teacherReady,
        schoolReady,
        compareReady,
        schoolText: school,
        subjectText: subject,
        teacherInsight
    };

    const teacherStateMap = {
        synced: { text: '已同步并加载', tone: 'ok' },
        synced_unloaded: { text: '已同步待恢复', tone: 'warn' },
        pending: { text: '已导入待同步', tone: 'warn' },
        unknown: { text: '已导入待确认', tone: 'info' },
        missing: { text: '缺任课表', tone: 'warn' }
    };
    const teacherState = teacherStateMap[statusModel?.teachersState] || { text: teacherReady ? '已加载' : '缺任课表', tone: teacherReady ? 'ok' : 'warn' };

    tmSetHtml('tmStatExam', tmBuildStatCard(
        '当前成绩库',
        scoreReady ? '已接入' : '缺成绩',
        scoreReady ? 'ok' : 'warn',
        currentExam,
        `当前届别已识别 ${exams.length} 期考试`
    ));
    tmSetHtml('tmStatTeacher', tmBuildStatCard(
        '当前学期任课表',
        teacherState.text,
        teacherState.tone,
        teacherTerm,
        `任课记录 ${statusModel?.teacherSnapshot?.count ?? teacherCoverage.mappingCount} 条`
    ));
    tmSetHtml('tmStatCompare', tmBuildStatCard(
        '多期对比',
        compareReady ? '可分析' : '待补期数',
        compareReady ? 'ok' : 'warn',
        compareReady ? `${exam1} vs ${exam2}` : '未完成选择',
        `当前可用考试 ${exams.length} 期`
    ));
    tmSetHtml('tmStatSync', tmBuildStatCard(
        '最近同步',
        lastSyncText === '尚未记录' ? '未记录' : '已记录',
        lastSyncText === '尚未记录' ? 'neutral' : 'info',
        lastSyncText,
        `${lastSyncSource} · ${stableSummary}`
    ));

    tmSetHtml('tmCtxSchool', tmBuildMiniCard('学校', school));
    tmSetHtml('tmCtxSubject', tmBuildMiniCard('学科', subject));
    tmSetHtml('tmCtxTeacher', tmBuildMiniCard('教师', teacher));
    tmSetHtml('tmCtxExam1', tmBuildMiniCard('第1期', exam1));
    tmSetHtml('tmCtxExam2', tmBuildMiniCard('第2期', exam2));
    tmSetHtml('tmCtxPeriod', tmBuildMiniCard('期数', period));

    tmSetHtml('tmReadyScore', tmBuildMiniCard('成绩数据', scoreReady ? `已导入 ${exams.length} 期考试` : '未导入'));
    tmSetHtml('tmReadyTeacherMap', tmBuildMiniCard('任课表', teacherReady ? `已加载 ${teacherCoverage.mappingCount} 条记录` : '未加载'));
    tmSetHtml('tmReadySchool', tmBuildMiniCard('本校识别', schoolReady ? school : '未识别'));
    tmSetHtml('tmReadyCompareExam', tmBuildMiniCard('多期对比', compareReady ? '条件已满足' : '还不能对比'));

    const alerts = [];
    if (canShowStableState) {
        if (!versionDrift.hasStable) {
            alerts.push('当前还没有稳定版基线，建议在本轮成绩、任课表和目标人数确认无误后标记一版稳定版。');
        } else if (versionDrift.changedCount > 0) {
            const changeText = versionDrift.topChanges.length
                ? `，主要变化包括：${versionDrift.topChanges.join('、')}${versionDrift.changedCount > versionDrift.topChanges.length ? ' 等' : ''}`
                : '';
            alerts.push(`当前环境相对稳定版已有 ${versionDrift.changedCount} 项变化${changeText}。如需确认影响，可到“版本归档中心”查看差异。`);
        } else {
            alerts.push('当前环境与稳定版保持一致，适合作为日常分析和导出基线。');
        }
    } else if (tmCanManageVersions() && versionAuthState === 'missing_token') {
        alerts.push('当前浏览器还没有云端网关会话，重新登录后可查看稳定版基线和版本差异。');
    }
    if (!scoreReady) alerts.push('当前届别还没有成绩数据，建议先导入成绩。');
    if (!teacherReady) alerts.push('当前学期任课表未加载，建议先同步任课表。');
    if (!schoolReady) alerts.push('当前本校尚未识别完成，部分教学分析会缺少本校口径。');
    if (statusModel?.teachersState === 'synced_unloaded') alerts.push('任课表已经同步成功，但还没有恢复到当前分析页面，可以点击“同步任课表”。');
    if (exams.length < 2) alerts.push('可用于教学对比的考试不足 2 期，多期对比会受限。');
    if (teacherInsight.teacherCount > 0) {
        if (teacherInsight.riskTeacherCount > 0) {
            alerts.push(`当前筛选范围内有 ${teacherInsight.riskTeacherCount} 位教师存在风险信号，其中低分率偏高 ${teacherInsight.lowRiskTeacherCount} 位、教学质量分偏低或基线校正为负 ${teacherInsight.scoreRiskTeacherCount} 位。`);
        } else {
            alerts.push(`当前筛选范围内 ${teacherInsight.teacherCount} 位教师已完成画像分析，暂未发现明显风险信号。`);
        }
        if (teacherInsight.focusSubject && teacherInsight.subjectCount > 1 && teacherInsight.focusSubject.riskCount > 0) {
            alerts.push(`风险更集中在 ${teacherInsight.focusSubject.subjectName}，当前均值低分率约 ${(teacherInsight.focusSubject.avgLowRate * 100).toFixed(1)}%。`);
        }
    } else if (scoreReady && teacherReady) {
        alerts.push('当前核心数据已就绪，但教师画像还未生成，切换到教师教学质量画像后会自动分析。');
    }
    if (!alerts.length) alerts.push('当前教学管理所需的核心数据已就绪，可以直接进入各分析页使用。');

    tmSetHtml(
        'tmAlertList',
        `<ul class="plain-list">${alerts.map((item) => `<li>${tmEscapeHtml(item)}</li>`).join('')}</ul>`
    );

    tmSetHtml('tmSummaryTeacherCount', tmBuildMiniCard('可分析教师', `${teacherInsight.teacherCount || teacherCoverage.teacherCount} 人`));
    tmSetHtml('tmSummaryClassCount', tmBuildMiniCard('覆盖班级', `${teacherInsight.classCount || teacherCoverage.classCount} 个`));
    tmSetHtml('tmSummarySubjectCount', tmBuildMiniCard('风险教师', `${teacherInsight.riskTeacherCount} 人`));
    tmSetHtml('tmSummaryExamCount', tmBuildMiniCard('考试期数', `${exams.length} 期`));

    tmRenderNextAction(overviewModel);
    tmRenderQuickEntries(overviewModel);
    tmRenderTeachingModuleStateBars();
    bindTeachingOverviewActions();
    if (typeof tmScheduleCloudOpsRefresh === 'function') {
        tmScheduleCloudOpsRefresh(false, 900);
    }
}
