// Teaching management runtime: student overview dashboard.
const StudentOverviewPerfCache = {
    schoolListSignature: '',
    schoolList: [],
    uniqueCountSignature: '',
    uniqueCount: 0,
    marginalSignature: '',
    marginalSummary: { classCount: 0, total: 0 },
    progressSignature: '',
    progressSummary: null,
    potentialSignature: '',
    potentialCount: 0,
    renderSignature: ''
};
var SM_OVERVIEW_RENDER_FRAME = 0;

function smScheduleStudentOverviewRender() {
    if (SM_OVERVIEW_RENDER_FRAME) return;
    const runner = () => {
        SM_OVERVIEW_RENDER_FRAME = 0;
        const active = document.getElementById('student-overview');
        if (active && active.classList.contains('active') && typeof renderStudentOverview === 'function') {
            renderStudentOverview();
        }
    };
    if (typeof window.requestAnimationFrame === 'function') {
        SM_OVERVIEW_RENDER_FRAME = window.requestAnimationFrame(runner);
    } else {
        SM_OVERVIEW_RENDER_FRAME = window.setTimeout(runner, 16);
    }
}

function smRowsSignature(rows) {
    const list = Array.isArray(rows) ? rows : [];
    const first = list[0] || {};
    const last = list[list.length - 1] || {};
    return [
        list.length,
        String(first.school || ''),
        String(first.class || ''),
        String(first.name || ''),
        String(last.school || ''),
        String(last.class || ''),
        String(last.name || '')
    ].join('::');
}

function smSchoolMatches(rowSchool, selectedSchool) {
    const useRowSchool = String(rowSchool || '').trim();
    const useSelectedSchool = String(selectedSchool || '').trim();
    const selectedLower = useSelectedSchool.toLowerCase();
    if (!useSelectedSchool) return true;
    if (selectedLower === 'all' || selectedLower === '__all__' || useSelectedSchool === '全部学校' || useSelectedSchool.includes('请选择') || useSelectedSchool.includes('请先选择')) return true;
    if (!useRowSchool) return false;
    if (useRowSchool === useSelectedSchool) return true;
    if (typeof areSchoolNamesEquivalent === 'function') {
        try {
            return !!areSchoolNamesEquivalent(useRowSchool, useSelectedSchool);
        } catch (_) {
            return false;
        }
    }
    return false;
}

function smBuildUniqueStudentCount(rawList, schoolName = '', className = '') {
    const rows = Array.isArray(rawList) ? rawList : [];
    const rawSelectedSchool = String(schoolName || '').trim();
    const selectedLower = rawSelectedSchool.toLowerCase();
    const selectedSchool = (selectedLower === 'all' || selectedLower === '__all__' || rawSelectedSchool === '全部学校' || rawSelectedSchool.includes('请选择') || rawSelectedSchool.includes('请先选择'))
        ? ''
        : rawSelectedSchool;
    const selectedClass = normalizeClass(className || '');
    const signature = `${smRowsSignature(rows)}::${selectedSchool}::${selectedClass}`;
    if (StudentOverviewPerfCache.uniqueCountSignature === signature) {
        return StudentOverviewPerfCache.uniqueCount;
    }
    const seen = new Set();

    rows.forEach((row) => {
        if (!row) return;
        if (selectedSchool && !smSchoolMatches(row.school, selectedSchool)) return;
        const rowClass = normalizeClass(row.class || '');
        if (selectedClass && rowClass !== selectedClass) return;
        const key = [
            String(row.school || '').trim(),
            rowClass,
            String(row.name || '').trim()
        ].join('|');
        if (key !== '||') seen.add(key);
    });

    StudentOverviewPerfCache.uniqueCountSignature = signature;
    StudentOverviewPerfCache.uniqueCount = seen.size;
    return seen.size;
}

function smBuildMarginalSummary() {
    const source = (window.MARGINAL_STUDENTS && typeof window.MARGINAL_STUDENTS === 'object') ? window.MARGINAL_STUDENTS : {};
    let classCount = 0;
    let total = 0;
    const signatureParts = Object.keys(source).sort().map((classKey) => {
        const subjectMap = source[classKey] || {};
        classCount += 1;
        const subjectParts = Object.keys(subjectMap).sort().map((subject) => {
            const subjectData = subjectMap[subject] || {};
            const excellentList = Array.isArray(subjectData?.excellentMarginal) ? subjectData.excellentMarginal : [];
            const passList = Array.isArray(subjectData?.passMarginal) ? subjectData.passMarginal : [];
            const excellentCount = excellentList.length;
            const passCount = passList.length;
            total += excellentCount + passCount;
            return `${subject}:${excellentCount}:${passCount}`;
        });
        return [classKey, ...subjectParts].join('|');
    });
    const signature = signatureParts.join('||');
    if (StudentOverviewPerfCache.marginalSignature === signature) {
        return StudentOverviewPerfCache.marginalSummary;
    }
    StudentOverviewPerfCache.marginalSignature = signature;
    StudentOverviewPerfCache.marginalSummary = { classCount, total };
    return StudentOverviewPerfCache.marginalSummary;
}

function smGetSchoolListCached() {
    const schools = window.SCHOOLS || {};
    const signature = Object.keys(schools).sort().join('|');
    if (StudentOverviewPerfCache.schoolListSignature === signature) {
        return StudentOverviewPerfCache.schoolList;
    }
    StudentOverviewPerfCache.schoolListSignature = signature;
    StudentOverviewPerfCache.schoolList = (typeof listAvailableSchoolsForCompare === 'function')
        ? listAvailableSchoolsForCompare()
        : Object.keys(schools);
    return StudentOverviewPerfCache.schoolList;
}

function smBuildProgressSummary(progressRows, context, selectedClass) {
    const rows = Array.isArray(progressRows) ? progressRows : [];
    const signature = `${smRowsSignature(rows)}::${context.schoolValue || ''}::${selectedClass || ''}`;
    if (StudentOverviewPerfCache.progressSignature === signature && StudentOverviewPerfCache.progressSummary) {
        return StudentOverviewPerfCache.progressSummary;
    }
    let progressCount = 0;
    let improveCount = 0;
    let declineCount = 0;
    let stableCount = 0;
    rows.forEach((row) => {
        if (context.schoolValue && !smSchoolMatches(row.school, context.schoolValue)) return;
        if (selectedClass && normalizeClass(row.class || '') !== selectedClass) return;
        progressCount += 1;
        const changeValue = Number(row.change || 0);
        if (changeValue > 0) improveCount += 1;
        else if (changeValue < 0) declineCount += 1;
        else stableCount += 1;
    });
    StudentOverviewPerfCache.progressSignature = signature;
    StudentOverviewPerfCache.progressSummary = { progressCount, improveCount, declineCount, stableCount };
    return StudentOverviewPerfCache.progressSummary;
}

function smBuildPotentialCount(potentialSourceRows, context, selectedClass) {
    const rows = Array.isArray(potentialSourceRows) ? potentialSourceRows : [];
    const signature = `${smRowsSignature(rows)}::${context.schoolValue || ''}::${selectedClass || ''}`;
    if (StudentOverviewPerfCache.potentialSignature === signature) {
        return StudentOverviewPerfCache.potentialCount;
    }
    let potentialCount = 0;
    rows.forEach((row) => {
        if (context.schoolValue && !smSchoolMatches(row.school, context.schoolValue)) return;
        if (selectedClass && normalizeClass(row.class || '') !== selectedClass) return;
        potentialCount += 1;
    });
    StudentOverviewPerfCache.potentialSignature = signature;
    StudentOverviewPerfCache.potentialCount = potentialCount;
    return potentialCount;
}

function smGetCurrentStudentContext() {
    const fallbackSchool = readCurrentSchool();
    const studentSchoolSelect = document.getElementById('studentSchoolSelect');
    const schoolValue = String(studentSchoolSelect?.value || '').trim();
    const schoolText = String(studentSchoolSelect?.selectedOptions?.[0]?.textContent || schoolValue || fallbackSchool || '未识别').trim();
    const classValue = tmGetSelectRawValue(['studentClassSelect', 'sbClassSelect', 'sel-class'], '');
    const classText = tmGetSelectDisplayValue(['studentClassSelect', 'sbClassSelect', 'sel-class'], '全部班级');
    const exam1Value = tmGetSelectRawValue(['studentCompareExam1', 'progressCompareExam1'], '');
    const exam1Text = tmGetSelectDisplayValue(['studentCompareExam1', 'progressCompareExam1'], '未选择');
    const exam2Value = tmGetSelectRawValue(['studentCompareExam2', 'progressCompareExam2'], '');
    const exam2Text = tmGetSelectDisplayValue(['studentCompareExam2', 'progressCompareExam2'], '未选择');
    const periodValue = tmGetSelectRawValue(['studentComparePeriodCount', 'progressComparePeriodCount'], '2');
    const periodText = tmGetSelectDisplayValue(['studentComparePeriodCount', 'progressComparePeriodCount'], '2期');
    const focusText = tmGetSelectDisplayValue(['segSubjectSelect'], '总分/综合视角');

    return {
        schoolValue,
        schoolText,
        classValue,
        classText,
        exam1Value,
        exam1Text,
        exam2Value,
        exam2Text,
        periodValue,
        periodText,
        focusText
    };
}

function smBuildOverviewModel() {
    const context = smGetCurrentStudentContext();
    const rawData = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
    const exams = tmGetAvailableExamList();
    const schoolList = smGetSchoolListCached();
    const selectedClass = normalizeClass(context.classValue || '');
    const fullProgressRows = readProgressCacheFullState();
    const progressRows = fullProgressRows.length ? fullProgressRows : readProgressCacheState();
    const progressSummary = smBuildProgressSummary(progressRows, context, selectedClass);
    const marginalSummary = smBuildMarginalSummary();
    const potentialSourceRows = Array.isArray(window.POTENTIAL_STUDENTS_CACHE) ? window.POTENTIAL_STUDENTS_CACHE : [];
    const potentialCount = smBuildPotentialCount(potentialSourceRows, context, selectedClass);
    const uniqueStudentCount = smBuildUniqueStudentCount(rawData, context.schoolValue, selectedClass);
    const scoreReady = rawData.length > 0 && exams.length > 0;
    const schoolReady = !!context.schoolText && context.schoolText !== '未识别' && context.schoolText !== '未选择';
    const compareReady = exams.length >= 2 && context.exam1Text !== '未选择' && context.exam2Text !== '未选择' && context.exam1Text !== context.exam2Text;
    const progressReady = progressSummary.progressCount > 0;
    const supportReady = marginalSummary.total > 0 || potentialCount > 0;

    return {
        context,
        exams,
        rawData,
        schoolList,
        uniqueStudentCount,
        scoreReady,
        schoolReady,
        compareReady,
        progressReady,
        supportReady,
        progressCount: progressSummary.progressCount,
        improveCount: progressSummary.improveCount,
        declineCount: progressSummary.declineCount,
        stableCount: progressSummary.stableCount,
        marginalClassCount: marginalSummary.classCount,
        marginalRecordCount: marginalSummary.total,
        potentialCount
    };
}

function smSetQuickEntryState(button, enabled, hint = '') {
    if (!button) return;
    button.disabled = !enabled;
    button.style.opacity = enabled ? '1' : '0.55';
    button.style.cursor = enabled ? 'pointer' : 'not-allowed';
    button.title = enabled ? '' : hint;
}

function smRenderQuickEntries(model) {
    const states = {
        'student-details': {
            enabled: model.scoreReady,
            hint: '需要先有成绩数据'
        },
        'progress-analysis': {
            enabled: model.scoreReady && model.exams.length >= 2,
            hint: '需要至少 2 期考试数据'
        },
        'marginal-push': {
            enabled: model.scoreReady && model.schoolReady,
            hint: '需要先识别学校并加载成绩'
        },
        'subject-balance': {
            enabled: model.scoreReady && model.schoolReady,
            hint: '需要先识别学校并加载成绩'
        },
        'potential-analysis': {
            enabled: model.scoreReady,
            hint: '需要先有成绩数据'
        },
        'segment-analysis': {
            enabled: model.scoreReady,
            hint: '需要先有成绩数据'
        },
        'correlation-analysis': {
            enabled: model.scoreReady,
            hint: '需要先有成绩数据'
        },
        'cohort-growth': {
            enabled: model.scoreReady && model.exams.length >= 2,
            hint: '需要至少 2 期考试数据'
        },
        'report-generator': {
            enabled: model.scoreReady,
            hint: '需要先有成绩数据'
        }
    };

    document.querySelectorAll('#smQuickEntry [data-target]').forEach((btn) => {
        const config = states[btn.dataset.target] || { enabled: true, hint: '' };
        smSetQuickEntryState(btn, config.enabled, config.hint);
    });

    smSetQuickEntryState(document.getElementById('smQuickStudentBtn'), states['student-details'].enabled, states['student-details'].hint);
    smSetQuickEntryState(document.getElementById('smQuickProgressBtn'), states['progress-analysis'].enabled, states['progress-analysis'].hint);
    smSetQuickEntryState(document.getElementById('smQuickReportBtn'), states['report-generator'].enabled, states['report-generator'].hint);
}

function smJumpToStudentModule(targetId) {
    const context = smGetCurrentStudentContext();
    if (typeof switchTab === 'function') switchTab(targetId);

    setTimeout(() => {
        if (targetId === 'student-details') {
            if (typeof updateStudentSchoolSelect === 'function') updateStudentSchoolSelect();
            if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
            tmApplySelectValue('studentSchoolSelect', context.schoolValue, context.schoolText);
            setTimeout(() => {
                tmApplySelectValue('studentClassSelect', context.classValue, context.classText);
                tmApplySelectValue('studentComparePeriodCount', context.periodValue, context.periodText);
                if (typeof onStudentComparePeriodCountChange === 'function') onStudentComparePeriodCountChange();
                if (typeof updateStudentCompareExamSelects === 'function') updateStudentCompareExamSelects();
                tmApplySelectValue('studentCompareExam1', context.exam1Value, context.exam1Text);
                tmApplySelectValue('studentCompareExam2', context.exam2Value, context.exam2Text);
                if (context.schoolValue && typeof renderStudentDetails === 'function') renderStudentDetails(true);
            }, 80);
            return;
        }

        if (targetId === 'progress-analysis') {
            if (typeof updateProgressSchoolSelect === 'function') updateProgressSchoolSelect();
            if (typeof updateProgressBaselineSelect === 'function') updateProgressBaselineSelect();
            if (typeof updateProgressMultiExamSelects === 'function') updateProgressMultiExamSelects();
            tmApplySelectValue('progressSchoolSelect', context.schoolValue, context.schoolText);
            tmApplySelectValue('progressCompareSchool', context.schoolValue, context.schoolText);
            tmApplySelectValue('progressComparePeriodCount', context.periodValue, context.periodText);
            if (typeof onProgressComparePeriodCountChange === 'function') onProgressComparePeriodCountChange();
            if (typeof updateProgressMultiExamSelects === 'function') updateProgressMultiExamSelects();
            tmApplySelectValue('progressCompareExam1', context.exam1Value, context.exam1Text);
            tmApplySelectValue('progressCompareExam2', context.exam2Value, context.exam2Text);
            if (context.schoolValue && typeof renderProgressAnalysis === 'function') renderProgressAnalysis();
            return;
        }

        if (targetId === 'marginal-push') {
            if (typeof updateMarginalSchoolSelect === 'function') updateMarginalSchoolSelect();
            tmApplySelectValue('marginalSchoolSelect', context.schoolValue, context.schoolText);
            if (context.schoolValue && typeof analyzeMarginalStudents === 'function') analyzeMarginalStudents();
            return;
        }

        if (targetId === 'subject-balance') {
            if (typeof updateSubjectBalanceSelects === 'function') updateSubjectBalanceSelects();
            tmApplySelectValue('sbSchoolSelect', context.schoolValue, context.schoolText);
            setTimeout(() => {
                tmApplySelectValue('sbClassSelect', context.classValue, context.classText);
                if (context.schoolValue && typeof SB_renderTable === 'function') SB_renderTable();
            }, 80);
            return;
        }

        if (targetId === 'potential-analysis') {
            if (typeof updatePotentialSchoolSelect === 'function') updatePotentialSchoolSelect();
            tmApplySelectValue('potSchoolSelect', context.schoolValue || 'ALL', context.schoolText || '全乡镇');
            setTimeout(() => {
                tmApplySelectValue('potClassSelect', context.classValue || 'ALL', context.classText || '全部班级');
                if (typeof renderPotentialAnalysis === 'function') renderPotentialAnalysis();
            }, 80);
            return;
        }

        if (targetId === 'segment-analysis') {
            if (typeof updateSegmentSelects === 'function') updateSegmentSelects();
            tmApplySelectValue('segSchoolSelect', context.schoolValue || 'ALL', context.schoolText || '全乡镇');
            if (typeof updateSegmentClassSelect === 'function') updateSegmentClassSelect();
            setTimeout(() => {
                tmApplySelectValue('segClassSelect', context.classValue || 'ALL', context.classText || '全部班级');
                if (typeof renderSegmentAnalysis === 'function') renderSegmentAnalysis();
            }, 80);
            return;
        }

        if (targetId === 'correlation-analysis') {
            if (typeof updateCorrelationSchoolSelect === 'function') updateCorrelationSchoolSelect();
            tmApplySelectValue('corrSchoolSelect', context.schoolValue || 'ALL', context.schoolText || '全乡镇');
            if (typeof updateCorrelationClassSelect === 'function') updateCorrelationClassSelect();
            setTimeout(() => {
                tmApplySelectValue('corrClassSelect', context.classValue || 'ALL', context.classText || '全部班级');
                if (typeof renderCorrelationAnalysis === 'function') renderCorrelationAnalysis();
            }, 80);
            return;
        }

        if (targetId === 'cohort-growth') {
            if (window.CohortGrowth && typeof window.CohortGrowth.updateScopeControls === 'function') window.CohortGrowth.updateScopeControls();
            tmApplySelectValue('cgSchoolSelect', context.schoolValue || 'ALL', context.schoolText || '全乡镇');
            if (window.CohortGrowth && typeof window.CohortGrowth.updateClassSelectForSchool === 'function') {
                window.CohortGrowth.updateClassSelectForSchool(context.schoolValue || 'ALL');
            }
            setTimeout(() => {
                tmApplySelectValue('cgClassSelect', context.classValue || 'ALL', context.classText || '全部班级');
                if (window.CohortGrowth && typeof window.CohortGrowth.render === 'function') window.CohortGrowth.render();
            }, 80);
            return;
        }

        if (targetId === 'report-generator') {
            if (typeof updateClassSelect === 'function') updateClassSelect();
            tmApplySelectValue('sel-school', context.schoolValue, context.schoolText);
            setTimeout(() => {
                tmApplySelectValue('sel-class', context.classValue, context.classText);
            }, 80);
        }
    }, 120);
}

function bindStudentOverviewActions() {
    const rerender = () => smScheduleStudentOverviewRender();

    const watchIds = [
        'studentSchoolSelect',
        'studentClassSelect',
        'studentCompareExam1',
        'studentCompareExam2',
        'studentComparePeriodCount',
        'progressSchoolSelect',
        'progressCompareSchool',
        'progressCompareExam1',
        'progressCompareExam2',
        'progressComparePeriodCount',
        'marginalSchoolSelect',
        'sbSchoolSelect',
        'sbClassSelect',
        'potSchoolSelect',
        'potClassSelect',
        'segSchoolSelect',
        'segClassSelect',
        'corrSchoolSelect',
        'corrClassSelect',
        'cgSchoolSelect',
        'cgClassSelect',
        'sel-school',
        'sel-class'
    ];

    watchIds.forEach((id) => {
        const el = document.getElementById(id);
        if (!el || el.dataset.smOverviewBound === '1') return;
        el.dataset.smOverviewBound = '1';
        el.addEventListener('change', rerender);
    });

    const topActions = {
        smQuickStudentBtn: 'student-details',
        smQuickProgressBtn: 'progress-analysis',
        smQuickReportBtn: 'report-generator'
    };

    Object.entries(topActions).forEach(([id, target]) => {
        const btn = document.getElementById(id);
        if (!btn) return;
        btn.onclick = () => {
            if (!btn.disabled) smJumpToStudentModule(target);
        };
    });

    document.querySelectorAll('#smQuickEntry [data-target]').forEach((btn) => {
        btn.onclick = () => {
            if (!btn.disabled) smJumpToStudentModule(btn.dataset.target || '');
        };
    });
}

function renderStudentOverview() {
    const model = smBuildOverviewModel();
    const { context } = model;
    const renderSignature = JSON.stringify({
        school: context.schoolValue,
        className: context.classValue,
        exam1: context.exam1Value,
        exam2: context.exam2Value,
        period: context.periodValue,
        raw: smRowsSignature(model.rawData),
        exams: model.exams.join('|'),
        progress: model.progressCount,
        improve: model.improveCount,
        decline: model.declineCount,
        marginal: model.marginalRecordCount,
        potential: model.potentialCount,
        schools: model.schoolList.join('|')
    });
    if (StudentOverviewPerfCache.renderSignature === renderSignature) {
        bindStudentOverviewActions();
        return;
    }
    StudentOverviewPerfCache.renderSignature = renderSignature;

    tmSetHtml('smStatScores', tmBuildStatCard(
        '当前成绩库',
        model.scoreReady ? '已接入' : '缺成绩',
        model.scoreReady ? 'ok' : 'warn',
        model.scoreReady ? `${model.exams.length} 期 / ${model.rawData.length} 条` : '待导入成绩',
        model.scoreReady ? '已识别当前届别的成绩与考试期次' : '请先导入成绩后再进行学情分析'
    ));

    tmSetHtml('smStatScope', tmBuildStatCard(
        '分析范围',
        model.schoolReady ? '已识别' : '待选学校',
        model.schoolReady ? 'ok' : 'warn',
        context.schoolText || '未识别',
        `班级：${context.classText || '全部班级'}`
    ));

    tmSetHtml('smStatProgress', tmBuildStatCard(
        '进退步状态',
        model.progressReady ? '已生成' : '待分析',
        model.progressReady ? 'ok' : 'warn',
        model.progressReady ? `${model.progressCount} 条记录` : `${model.progressCount} 条记录`,
        model.progressReady
            ? `进步 ${model.improveCount} 人 / 退步 ${model.declineCount} 人 / 持平 ${model.stableCount} 人`
            : '进入进退步/增值评价后可自动生成结果'
    ));

    tmSetHtml('smStatSupport', tmBuildStatCard(
        '干预准备',
        model.supportReady ? '已准备' : '待补结果',
        model.supportReady ? 'ok' : 'warn',
        model.supportReady
            ? `边缘生 ${model.marginalRecordCount} 人 / 潜力生 ${model.potentialCount} 人`
            : `边缘生 ${model.marginalRecordCount} 人 / 潜力生 ${model.potentialCount} 人`,
        `涉及 ${model.marginalClassCount} 个班级的边缘生缓存`
    ));

    tmSetHtml('smCtxSchool', tmBuildMiniCard('学校', context.schoolText || '未识别'));
    tmSetHtml('smCtxClass', tmBuildMiniCard('班级', context.classText || '全部班级'));
    tmSetHtml('smCtxExam1', tmBuildMiniCard('第1期', context.exam1Text || '未选择'));
    tmSetHtml('smCtxExam2', tmBuildMiniCard('第2期', context.exam2Text || '未选择'));
    tmSetHtml('smCtxPeriod', tmBuildMiniCard('期数', context.periodText || '2期'));
    tmSetHtml('smCtxFocus', tmBuildMiniCard('当前聚焦', context.focusText || '总分/综合视角'));

    tmSetHtml('smReadyScore', tmBuildMiniCard('成绩数据', model.scoreReady ? `已导入 ${model.exams.length} 期考试` : '未导入'));
    tmSetHtml('smReadySchool', tmBuildMiniCard('学校范围', model.schoolReady ? context.schoolText : '未识别'));
    tmSetHtml('smReadyProgress', tmBuildMiniCard('进退步结果', model.progressReady ? `已生成 ${model.progressCount} 条` : '未生成'));
    tmSetHtml('smReadySupport', tmBuildMiniCard('干预名单', model.supportReady ? '边缘生/潜力生已准备' : '待生成'));

    const insights = [];
    if (!model.scoreReady) insights.push('当前届别还没有可用于学情诊断的成绩数据，建议先导入成绩。');
    if (!model.schoolReady) insights.push('当前还没有锁定学校范围，部分学情分析会以全范围口径展示。');
    if (model.exams.length < 2) insights.push('可用于学情对比的考试不足 2 期，进退步和多期对比会受限。');
    if (model.progressReady) {
        insights.push(`当前筛选范围内已生成 ${model.progressCount} 条进退步记录，其中进步 ${model.improveCount} 人、退步 ${model.declineCount} 人。`);
    } else if (model.scoreReady) {
        insights.push('成绩已就绪，但还没有生成进退步结果，建议进入“进退步/增值评价”完成一次分析。');
    }
    if (model.marginalRecordCount > 0) {
        insights.push(`边缘生缓存已覆盖 ${model.marginalClassCount} 个班级，共 ${model.marginalRecordCount} 人，可直接进入“临界生精准干预”。`);
    } else if (model.schoolReady && model.scoreReady) {
        insights.push('当前学校还没有边缘生分析结果，可进入“临界生精准干预”快速生成名单。');
    }
    if (model.potentialCount > 0) {
        insights.push(`当前筛选范围内已识别 ${model.potentialCount} 名偏科潜力生，可结合家校沟通继续跟进。`);
    }
    if (!insights.length) insights.push('当前学情诊断所需的数据已经基本就绪，可以直接进入学生明细、进退步和潜力分析模块。');

    tmSetHtml(
        'smInsightList',
        `<ul class="plain-list">${insights.map((item) => `<li>${tmEscapeHtml(item)}</li>`).join('')}</ul>`
    );

    tmSetHtml('smSummarySchools', tmBuildMiniCard('学校数', `${model.schoolList.length} 所`));
    tmSetHtml('smSummaryStudents', tmBuildMiniCard('学生数', `${model.uniqueStudentCount} 人`));
    tmSetHtml('smSummaryProgress', tmBuildMiniCard('进退步记录', `${model.progressCount} 条`));
    tmSetHtml('smSummaryPotential', tmBuildMiniCard('潜力/边缘', `${model.potentialCount + model.marginalRecordCount} 人`));

    smRenderQuickEntries(model);
    bindStudentOverviewActions();
}

window.smScheduleStudentOverviewRender = smScheduleStudentOverviewRender;
