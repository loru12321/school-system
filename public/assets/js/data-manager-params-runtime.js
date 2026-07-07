(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.DataManagerParamsRuntime) return;
    root.DataManagerParamsRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createDataManagerParamsRuntime(root) {
    let pendingStatusRender = false;

    function call(fn, fallback) {
        if (typeof fn !== 'function') return fallback;
        return fn();
    }

    function getIndicatorState() {
        return call(root.readIndicatorState, { ind1: '', ind2: '', highSchoolLine: '' }) || { ind1: '', ind2: '', highSchoolLine: '' };
    }

    function setIndicatorState(nextState) {
        if (typeof root.setIndicatorState === 'function') root.setIndicatorState(nextState || { ind1: '', ind2: '' });
    }

    function readInputValue(id) {
        const doc = root.document;
        if (!doc || typeof doc.getElementById !== 'function') return '';
        const el = doc.getElementById(id);
        return el ? String(el.value || '') : '';
    }

    function mergeParamValue(value, fallback = '') {
        const text = String(value || '').trim();
        return text || String(fallback || '').trim();
    }

    function writeInputValue(id, value) {
        const doc = root.document;
        if (!doc || typeof doc.getElementById !== 'function') return null;
        const el = doc.getElementById(id);
        if (el) el.value = value || '';
        return el;
    }

    function safeToast(text, type) {
        if (root.UI && typeof root.UI === 'object' && typeof root.UI.toast === 'function') {
            root.UI.toast(text, type);
        }
    }

    function renderStatus(manager) {
        if (manager && typeof manager.renderDataManagerStatus === 'function') {
            manager.renderDataManagerStatus();
            return;
        }
        const globalManager = root.window && root.window.DataManager ? root.window.DataManager : null;
        if (globalManager && typeof globalManager.renderDataManagerStatus === 'function') {
            globalManager.renderDataManagerStatus();
        }
    }

    function scheduleStatusRender(manager) {
        const raf = typeof root.requestAnimationFrame === 'function' ? root.requestAnimationFrame : null;
        const timer = typeof root.setTimeout === 'function' ? root.setTimeout : null;
        if (!raf && !timer) {
            renderStatus(manager);
            return;
        }
        if (pendingStatusRender) return;
        pendingStatusRender = true;
        const run = function () {
            pendingStatusRender = false;
            renderStatus(manager);
        };
        if (raf) raf(run);
        else timer(run, 0);
    }

    function renderParams(manager) {
        if (!manager) return;

        const indicatorPromptAllowed = typeof root.isIndicatorPromptAllowed === 'function'
            ? root.isIndicatorPromptAllowed()
            : false;
        if (!indicatorPromptAllowed) {
            const doc = root.document;
            const area = doc && typeof doc.getElementById === 'function' ? doc.getElementById('dm-params-area') : null;
            if (area && area.style) area.style.display = 'none';
            renderStatus(manager);
            return;
        }

        if (typeof root.ensureSupportSysVars === 'function') root.ensureSupportSysVars();

        let i1 = getIndicatorState().ind1;
        let i2 = getIndicatorState().ind2;
        if (!i1 && !i2 && typeof manager.restoreGrade9IndicatorTemplate === 'function') {
            manager.restoreGrade9IndicatorTemplate();
            i1 = getIndicatorState().ind1;
            i2 = getIndicatorState().ind2;
        }

        const mainInput1 = writeInputValue('ind1', readInputValue('ind1'));
        const mainInput2 = writeInputValue('ind2', readInputValue('ind2'));
        if (!i1 && mainInput1) i1 = mainInput1.value;
        if (!i2 && mainInput2) i2 = mainInput2.value;

        const el1 = writeInputValue('dm_ind1_input', i1 || '');
        const el2 = writeInputValue('dm_ind2_input', i2 || '');
        const highSchoolLine = getIndicatorState().highSchoolLine || '';
        const highSchoolLineEl = writeInputValue('dm_high_school_line_input', highSchoolLine);

        if (el1) {
            el1.oninput = function () {
                setIndicatorState({ ...getIndicatorState(), ind1: this.value });
                scheduleStatusRender(manager);
            };
        }
        if (el2) {
            el2.oninput = function () {
                setIndicatorState({ ...getIndicatorState(), ind2: this.value });
                scheduleStatusRender(manager);
            };
        }
        if (highSchoolLineEl) {
            const updateHighSchoolSummary = function () {
                setIndicatorState({ ...getIndicatorState(), highSchoolLine: this.value });
                renderHighSchoolLineSummary();
                scheduleStatusRender(manager);
            };
            highSchoolLineEl.oninput = updateHighSchoolSummary;
            renderHighSchoolLineSummary();
        }

        scheduleStatusRender(manager);
    }

    async function saveParamsLocally(manager, skipCloudSync = false) {
        const indicatorAllowed = typeof root.isIndicatorAllowed === 'function'
            ? root.isIndicatorAllowed()
            : false;
        if (typeof root.ensureSupportSysVars === 'function') root.ensureSupportSysVars();

        const currentIndicator = getIndicatorState();
        const v1 = mergeParamValue(readInputValue('dm_ind1_input'), currentIndicator.ind1);
        const v2 = mergeParamValue(readInputValue('dm_ind2_input'), currentIndicator.ind2);
        const highSchoolLine = mergeParamValue(readInputValue('dm_high_school_line_input'), currentIndicator.highSchoolLine);
        if (!indicatorAllowed && !highSchoolLine) {
            safeToast('当前考试不需要指标参数；如需保存中考高中过线分数，请先填写分数。', 'warning');
            return;
        }
        setIndicatorState({ ind1: v1, ind2: v2, highSchoolLine });

        writeInputValue('ind1', v1);
        writeInputValue('ind2', v2);
        renderHighSchoolLineSummary();

        if (manager && typeof manager.persistGrade9IndicatorTemplate === 'function') {
            manager.persistGrade9IndicatorTemplate();
        }

        if (!skipCloudSync && typeof root.saveCloudData === 'function') {
            safeToast('💾 参数已暂存，正在同步云端...', 'info');
            const ok = await root.saveCloudData({ background: false, forceUpload: true, sourceLabel: 'params-save' });
            if (ok) safeToast('✅ 参数已同步到云端', 'success');
            else safeToast('⚠️ 参数已暂存，本次未成功同步到云端', 'warning');
            return;
        }
        safeToast('✅ 参数已暂存到内存 (未连接云端)', 'success');
    }

    function getTotal(row) {
        const total = Number(row?.total ?? row?.总分 ?? row?.score ?? row?.总成绩);
        if (Number.isFinite(total)) return total;
        const scores = row?.scores && typeof row.scores === 'object' ? Object.values(row.scores) : [];
        const sum = scores.reduce((acc, value) => {
            const number = Number(value);
            return Number.isFinite(number) ? acc + number : acc;
        }, 0);
        return sum > 0 ? sum : NaN;
    }

    function renderHighSchoolLineSummary() {
        const doc = root.document;
        const summary = doc && typeof doc.getElementById === 'function' ? doc.getElementById('dm_high_school_line_summary') : null;
        if (!summary) return;
        const line = Number(readInputValue('dm_high_school_line_input') || getIndicatorState().highSchoolLine || 0);
        const rows = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        const isGrade9July = isCurrentGrade9JulyExam(rows);
        if (!isGrade9July) {
            summary.innerHTML = '此项仅用于 9 年级 7 月中考成绩。当前考试不会计算高中过线人数/率，但分数会随云端参数保存。';
            return;
        }
        const ownRows = filterOwnSchoolRows(rows);
        const totals = ownRows.map(getTotal).filter(Number.isFinite);
        const over = Number.isFinite(line) && line > 0 ? totals.filter((value) => value >= line).length : 0;
        const rate = totals.length ? ((over / totals.length) * 100).toFixed(1) : '0.0';
        summary.innerHTML = line > 0
            ? `本校9年级7月中考：考籍人数 <strong>${totals.length}</strong>，高中过线 <strong>${over}</strong>，过线率 <strong>${rate}%</strong>`
            : '填写 9 年级 7 月中考高中过线分数后，自动计算过线人数和过线率。';
    }

    function sameSchool(left, right) {
        const normalize = typeof root.normalizeSchoolName === 'function'
            ? root.normalizeSchoolName
            : (value) => String(value || '').replace(/学校$/, '').trim();
        return !!left && !!right && normalize(left) === normalize(right);
    }

    function filterOwnSchoolRows(rows) {
        const ownSchool = root.MY_SCHOOL || root.CURRENT_SCHOOL || '银山实验学校';
        return (rows || []).filter((row) => sameSchool(row?.school || row?.学校, ownSchool));
    }

    function isCurrentGrade9JulyExam(rows) {
        const examId = String(root.CURRENT_EXAM_ID || root.__CURRENT_EXAM_KEY || '').trim();
        const exam = root.CohortDB && typeof root.CohortDB.ensure === 'function'
            ? root.CohortDB.ensure()?.exams?.[examId]
            : null;
        const haystack = [
            examId,
            exam?.date,
            exam?.examDate,
            exam?.name,
            exam?.title,
            exam?.label,
            exam?.meta?.grade,
            exam?.meta?.gradeLabel
        ].filter(Boolean).join(' ');
        const monthMatch = haystack.match(/20\d{2}[-_/年.](\d{1,2})(?:[-_/月.]|月)/) || haystack.match(/(?:^|[^0-9])(\d{1,2})\s*月/);
        const month = monthMatch ? Number(monthMatch[1]) : 0;
        const hasGrade9Meta = /9年级|九年级|(^|[^0-9])9([^0-9]|$)/.test(haystack);
        const hasGrade9Class = (rows || []).some((row) => /(^|[^0-9])9[.\-班]?/.test(String(row?.class || row?.班级 || '')));
        return month === 7 && (hasGrade9Meta || hasGrade9Class);
    }

    return {
        renderParams,
        saveParamsLocally,
        renderHighSchoolLineSummary
    };
});
