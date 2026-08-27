(() => {
    if (typeof window === 'undefined' || window.__PREREQUISITE_STATUS_RUNTIME_PATCHED__) return;

    // 前置条件状态条：把「分析结果是否可信」所依赖的隐式前置条件显式化。
    //
    // 动机：当前依赖链是隐式的 —— 学校名未归一会让县域对比错位；未配置公办高中录取线时
    // 上线率一律显示 0（而 0 既可能是「真的没上线」也可能是「没配线」，用户无法区分）；
    // 本校未识别会让教师画像口径错。用户只能靠经验记住这些顺序。
    //
    // 设计取舍：
    // - 只读现有状态，不触发任何重算，绝不参与成绩计算/赋分口径。
    // - 未满足项用「中性说明 + 后果」呈现，不用告警色，避免长期常态化告警疲劳。
    // - 先在三个最依赖前置条件的模块试点（summary / county-analysis / teacher-analysis），
    //   而不是一次铺开 24 个模块。
    // - 用运行时注入而非静态 HTML：teacher-analysis 是 lazy-section 模板（占位符在
    //   index.html 前部、真实结构在后部），静态插入在水合前不会渲染。

    const PILOT_MODULES = {
        summary: ['schoolAlias', 'mySchool', 'highSchoolLine'],
        'county-analysis': ['schoolAlias', 'mySchool'],
        'teacher-analysis': ['mySchool', 'teacherMap']
    };

    const CONTAINER_CLASS = 'prerequisite-status-bar';

    function escapeHtml(value) {
        const shared = window.SchoolRuntime && typeof window.SchoolRuntime.escapeHtml === 'function'
            ? window.SchoolRuntime.escapeHtml
            : null;
        if (shared) return shared(value);
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function readIndicator() {
        try {
            if (typeof window.readIndicatorState === 'function') return window.readIndicatorState() || {};
        } catch (error) {
            console.warn('[prerequisite] 读取指标参数失败', error);
        }
        return (window.SYS_VARS && window.SYS_VARS.indicator) || {};
    }

    // 每项返回 { label, ok, detail }。detail 在未满足时必须说清「后果」。
    const CHECKS = {
        schoolAlias() {
            const count = Object.keys(window.SCHOOLS || {}).length;
            return {
                label: '学校归一',
                ok: count > 0,
                detail: count > 0 ? `${count} 所` : '尚无学校数据，请先上传成绩'
            };
        },
        mySchool() {
            const name = String(window.MY_SCHOOL || '').trim();
            return {
                label: '本校',
                ok: !!name,
                detail: name || '未识别本校 → 本校相关指标与教师口径可能不准'
            };
        },
        highSchoolLine() {
            const line = Number(readIndicator().highSchoolLine || 0);
            const allowed = typeof window.isHighSchoolAdmissionExamAllowed === 'function'
                ? window.isHighSchoolAdmissionExamAllowed()
                : false;
            // 非「9年级+中考+7月」时上线率本就按 0 处理（口径门禁），此时未配线不是问题，
            // 说明清楚原因即可，避免让用户以为漏配了东西。
            if (!allowed) {
                return {
                    label: '高中上线率',
                    ok: true,
                    detail: '当前考试非 9 年级 7 月中考，按口径不计上线率'
                };
            }
            return {
                label: '高中线',
                ok: line > 0,
                detail: line > 0 ? String(line) : '未配置公办高中录取线 → 上线率显示 0'
            };
        },
        teacherMap() {
            const count = Object.keys(window.TEACHER_MAP || {}).length;
            return {
                label: '任课数据',
                ok: count > 0,
                detail: count > 0 ? `${count} 条` : '未导入任课表 → 教师画像无法归属班级'
            };
        }
    };

    function buildRows(keys) {
        return keys.map((key) => {
            const check = CHECKS[key];
            if (typeof check !== 'function') return null;
            try {
                return check();
            } catch (error) {
                console.warn(`[prerequisite] 检查项 ${key} 执行失败`, error);
                return null;
            }
        }).filter(Boolean);
    }

    function renderBar(section, keys) {
        const rows = buildRows(keys);
        if (!rows.length) return;

        const html = rows.map((row) => {
            const mark = row.ok ? '✓' : '·';
            const markColor = row.ok ? '#16a34a' : '#b45309';
            return `<span class="prerequisite-status-item" style="display:inline-flex; align-items:baseline; gap:4px; margin-right:14px;">
                <span style="color:${markColor}; font-weight:600;">${mark}</span>
                <span style="color:#475569;">${escapeHtml(row.label)}</span>
                <span style="color:#64748b;">${escapeHtml(row.detail)}</span>
            </span>`;
        }).join('');

        let bar = section.querySelector(`:scope > .${CONTAINER_CLASS}`);
        if (!bar) {
            bar = document.createElement('div');
            bar.className = CONTAINER_CLASS;
            bar.setAttribute('role', 'status');
            bar.setAttribute('aria-label', '本模块前置条件');
            bar.style.cssText = [
                'margin:0 0 12px',
                'padding:8px 12px',
                'font-size:12px',
                'line-height:1.7',
                'color:#475569',
                'background:#f8fafc',
                'border:1px dashed #cbd5e1',
                'border-radius:6px'
            ].join(';');
            const hero = section.querySelector(':scope > .module-desc-bar, :scope > .analysis-hero');
            if (hero && hero.parentNode === section) hero.insertAdjacentElement('afterend', bar);
            else section.insertBefore(bar, section.firstChild);
        }

        const next = `<span style="color:#334155; font-weight:600; margin-right:10px;">前置检查</span>${html}`;
        if (bar.innerHTML !== next) bar.innerHTML = next;
    }

    function refresh(moduleId) {
        const keys = PILOT_MODULES[moduleId];
        if (!keys) return;
        // 只取最后一个同 id 节点：teacher-analysis 存在 lazy 占位符与真实结构同 id，
        // 真实结构在文档后部。
        const sections = document.querySelectorAll(`#${moduleId}`);
        const section = sections[sections.length - 1];
        if (!section || section.hasAttribute('data-lazy-section-placeholder')) return;
        try {
            renderBar(section, keys);
        } catch (error) {
            console.warn('[prerequisite] 渲染前置条件状态条失败', { moduleId, error });
        }
    }

    function refreshAll() {
        Object.keys(PILOT_MODULES).forEach(refresh);
    }

    function initAutoRefresh() {
        if (!window.DataStateEventBus) return;

        DataStateEventBus.subscribe('schools-changed', () => {
            Object.keys(PILOT_MODULES).forEach(moduleId => {
                if (PILOT_MODULES[moduleId].includes('schoolAlias')) {
                    refresh(moduleId);
                }
            });
        });

        DataStateEventBus.subscribe('my-school-changed', () => {
            Object.keys(PILOT_MODULES).forEach(moduleId => {
                if (PILOT_MODULES[moduleId].includes('mySchool')) {
                    refresh(moduleId);
                }
            });
        });

        DataStateEventBus.subscribe('indicator-changed', () => {
            refresh('summary');
        });

        DataStateEventBus.subscribe('teacher-map-changed', () => {
            refresh('teacher-analysis');
        });
    }

    window.PrerequisiteStatus = { refresh, refreshAll, modules: Object.keys(PILOT_MODULES) };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutoRefresh);
    } else {
        initAutoRefresh();
    }

    window.__PREREQUISITE_STATUS_RUNTIME_PATCHED__ = true;
})();
