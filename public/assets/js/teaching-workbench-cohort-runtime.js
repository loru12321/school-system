(() => {
    if (typeof window === 'undefined' || window.__TEACHING_WORKBENCH_COHORT_RUNTIME__) return;

    const MODULE_IDS = ['exam-arranger', 'freshman-simulator', 'grade-scheduler', 'seat-adjustment', 'mutual-aid'];
    const readCohortYear = () => {
        const raw = String(window.CURRENT_COHORT_META?.year || window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim();
        const match = raw.match(/\d{4}/);
        return match ? Number(match[0]) : 0;
    };
    const academicYearStart = (date = new Date()) => {
        const d = date instanceof Date ? date : new Date(date);
        if (Number.isNaN(d.getTime())) return new Date().getFullYear();
        return d.getMonth() + 1 >= 9 ? d.getFullYear() : d.getFullYear() - 1;
    };
    // 年级以“当前加载的考试”为准，日期推算只做兜底。否则每年 9 月 1 日学年翻篇后、
    // 新学年第一次考试上传之前，届别会被算高一级：8 年级期末的 8.x 班全被过滤，
    // 座位/排考/排课看不到班级，新生分班也会误判“已到 9 年级”。
    const examGrade = () => {
        const fromExamId = String(window.CURRENT_EXAM_ID || '').match(/([6-9])\s*年级/);
        if (fromExamId) return Number(fromExamId[1]);
        const meta = typeof window.readArchiveMeta === 'function' ? window.readArchiveMeta() : window.ARCHIVE_META;
        const fromMeta = String(meta?.grade || '').match(/[6-9]/);
        if (fromMeta) return Number(fromMeta[0]);
        const fromConfig = String(window.CONFIG?.name || '').match(/^([6-9])年级$/);
        if (fromConfig) return Number(fromConfig[1]);
        return 0;
    };
    const currentGrade = () => {
        // 统一入口在 cohort-exam-meta-runtime.resolveWorkspaceGrade；未加载时用同优先级的本地实现兜底。
        if (typeof window.resolveWorkspaceGrade === 'function') {
            const resolved = Number(window.resolveWorkspaceGrade());
            if (resolved) return resolved;
        }
        const loaded = examGrade();
        if (loaded) return loaded;
        const explicit = String(window.CURRENT_COHORT_META?.grade || '').match(/[6-9]/);
        if (explicit) return Number(explicit[0]);
        const entry = readCohortYear();
        if (!entry) return 0;
        return Math.min(9, Math.max(6, 6 + academicYearStart() - entry));
    };
    const targetGrade = () => {
        const grade = currentGrade();
        return grade >= 6 && grade < 9 ? grade + 1 : 0;
    };
    const getState = () => ({ cohortId: String(window.CURRENT_COHORT_ID || localStorage.getItem('CURRENT_COHORT_ID') || '').trim(), entryYear: readCohortYear(), grade: currentGrade(), targetGrade: targetGrade() });
    const cohortLabel = () => {
        const state = getState();
        if (!state.cohortId) return '未选择届别';
        return `${state.cohortId}级 · ${state.grade ? `${state.grade}年级` : '年级待识别'}`;
    };
    const isAllowedGrade = (value, options = {}) => {
        const grade = String(value || '').match(/[6-9]/)?.[0] || '';
        if (!grade) return true;
        const state = getState();
        const allowed = options.target ? state.targetGrade : state.grade;
        return !allowed || grade === String(allowed);
    };
    const syncFreshmanTarget = () => {
        const select = document.getElementById('fb_target_grade');
        if (!select) return;
        const state = getState();
        const note = document.getElementById('fb_target_grade_note');
        if (state.targetGrade) {
            select.value = String(state.targetGrade);
            select.disabled = true;
            select.setAttribute('aria-readonly', 'true');
            if (note) note.textContent = `已按当前届别锁定：${cohortLabel()} → 新${state.targetGrade}年级`;
        } else {
            select.disabled = true;
            if (note) note.textContent = state.grade >= 9 ? '当前届别已到9年级，不适用新生升年级分班。' : '请先选择有效届别。';
        }
    };
    const decorateModules = () => {
        const label = cohortLabel();
        MODULE_IDS.forEach((id) => {
            const section = document.getElementById(id);
            if (!section) return;
            section.dataset.cohortBound = '1';
            let badge = section.querySelector('[data-teaching-cohort-badge]');
            if (!badge) {
                badge = document.createElement('div');
                badge.setAttribute('data-teaching-cohort-badge', '1');
                badge.style.cssText = 'margin:0 0 10px;padding:7px 10px;border-radius:8px;background:#f1f5f9;color:#334155;font-size:12px;';
                section.insertBefore(badge, section.firstElementChild);
            }
            badge.textContent = `当前届别：${label}（本模块仅使用当前届别数据）`;
        });
    };
    const sync = () => { syncFreshmanTarget(); decorateModules(); };

    window.TeachingWorkbenchCohort = { getState, cohortLabel, currentGrade, targetGrade, isAllowedGrade, syncFreshmanTarget, sync };
    window.__TEACHING_WORKBENCH_COHORT_RUNTIME__ = true;
    window.addEventListener('school:workspace-state-changed', sync);
    window.addEventListener('cloud-load-state', sync);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', sync, { once: true }); else sync();
})();
