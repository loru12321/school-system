(function () {
    // 教务主任可见模块有 31 个，但考试后真正每次都要走的只有 6 个，且分散在
    // 「联考分析 / 教学改进 / 学生发展」三个分类里，每轮汇报都要跨三处点。
    // 这里把这 6 个聚成一个置顶入口。
    //
    // 刻意做成「新增一个入口」而不是「折叠其余模块」：其余 25 个模块的位置完全不动，
    // 不改变任何既有肌肉记忆，也不影响其他角色。空间成本一个图标，风险最低。
    // 名单由使用者本人指定，不要自行增删。
    const CORE_WORKFLOW_MODULE_IDS = [
        'summary',                     // 综合评价
        'analysis',                    // 两率一分对比
        'teacher-analysis',            // 教师表现
        'teacher-detail-comparison',   // 教师指标明细
        'teacher-township-ranking',    // 教师乡镇对比
        'student-details'              // 学生成绩明细
    ];
    // 只给这两个角色显示：过载问题压在他们身上；教师/班主任本身只有 11 个模块，
    // 再给一个「常用」反而是多余的一层。
    const CORE_WORKFLOW_ROLES = new Set(['admin', 'director']);

    // 「本次必看」里各步的说明。与通用 hint 的区别：通用 hint 说「这个模块是什么」，
    // 这里说「这一步在汇报流程里解决什么、看完往哪走」——新任教务照着走即可成稿。
    const CORE_WORKFLOW_STEP_HINTS = {
        summary: '先定整体站位：本校排第几、和第一名差多少。汇报开头用这个。',
        analysis: '再拆到学科：哪一科拉分、哪一科拖后腿。',
        'teacher-analysis': '看人：各位教师所带班级的表现，注意结合生源判断。',
        'teacher-detail-comparison': '要具体数字时看这里，可直接取数填汇报表。',
        'teacher-township-ranking': '需要对外比较时用：教师在乡镇同学科中的位置。',
        'student-details': '最后落到学生个人，为家长会和补弱名单做准备。'
    };

    const NAV_STRUCTURE = {
        data: {
            title: '数据管理',
            color: '#334155',
            icon: 'ti-database',
            eyebrow: '数据准备',
            summary: '维护考试数据、任课关系与基础设置，确认数据可用于分析。',
            items: [
                { id: 'starter-hub', icon: 'ti-clipboard-check', text: '准备状态', hint: '检查当前届别、考试、成绩和任课表是否齐全。' },
                { id: 'upload', icon: 'ti-database-import', text: '导入与设置', hint: '导入成绩，维护科目、学校映射和基础参数。' },
                { id: 'data-quality', icon: 'ti-stethoscope', text: '数据检查', hint: '检查缺失字段、重复身份、异常分数和科目缺失。' }
            ]
        },
        town: {
            title: '联考分析',
            color: '#b45309',
            icon: 'ti-trophy',
            eyebrow: '联考评价',
            summary: '从整体表现、关键位次和重点群体判断学校当前站位。',
            items: [
                { id: 'summary', icon: 'ti-report', text: '综合评价总览', hint: '先看全局排名、梯队分布和学校站位。' },
                { id: 'analysis', icon: 'ti-chart-pie', text: '两率一分对比', hint: '横向比较重点率、及格率和平均分。' },
                { id: 'high-score', icon: 'ti-trophy', text: '高分学生分析', hint: '追踪高分群体的规模、分布和稳定度。' },
                { id: 'indicator', icon: 'ti-target', text: '指标生达标核算', hint: '快速核对指标生口径、边缘人数和达标压力。' },
                { id: 'bottom3', icon: 'ti-arrow-bar-to-down', text: '后段学生分析', hint: '定位后段群体变化，安排补弱任务。' }
            ]
        },
        county: {
            title: '县域分析',
            color: '#0f766e',
            icon: 'ti-map-2',
            eyebrow: '县域对标',
            summary: '把学校和教师放到县域统一口径中比较，识别相对优势与差距。',
            items: [
                { id: 'county-teacher-portrait', icon: 'ti-school', text: '县域教师画像', hint: '模仿教师教学质量画像，把本校教师放到县域所有学校同学科口径中排名。' },
                { id: 'county-school-horizontal', icon: 'ti-chart-bar', text: '县域学校横向分析', hint: '模仿两率一分横向分析，输出总分和各学科明细的全县学校排名与横向对比表。' }
            ]
        },
        class: {
            title: '教学管理',
            color: '#dc2626',
            icon: 'ti-school',
            eyebrow: '教学改进',
            summary: '查看教师表现、明细差异与协作建议，形成可执行的改进安排。',
            items: [
                { id: 'teacher-analysis', icon: 'ti-school', text: '教师表现总览', hint: '查看教师贡献、波动和结构性问题。' },
                { id: 'teacher-detail-comparison', icon: 'ti-table', text: '教师指标明细', hint: '查看教师明细指标、校内排序并导出结果。' },
                { id: 'teacher-pairing', icon: 'ti-users-group', text: '教师协作建议', hint: '根据数据差异生成校内教师互助建议。' },
                { id: 'teacher-township-ranking', icon: 'ti-trophy', text: '教师乡镇排名', hint: '查看本校教师在镇域同学科中的相对站位。' },
            ]
        },
        student: {
            title: '学情诊断',
            color: '#059669',
            icon: 'ti-user-scan',
            eyebrow: '学生发展',
            summary: '查看学生现状、成长变化和干预重点，为班级教学安排提供依据。',
            items: [
                { id: 'zhongkao-countdown', icon: 'ti-calendar-event', text: '中考倒计时', hint: '用时间视角拉齐当前冲刺阶段和节奏。' },
                { id: 'student-overview', icon: 'ti-layout-dashboard', text: '学情总览', hint: '先看整体学情结构、风险分层和关键信号。' },
                { id: 'student-details', icon: 'ti-list-details', text: '学生档案查询', hint: '按学生查看成绩、班级和画像细节。' },
                { id: 'blank-score-audit', icon: 'ti-alert-circle', text: '空分/0分核对', hint: '单独核对空白学科和 0 分记录，确认它们按 0 分参与排名。' },
                { id: 'subject-balance', icon: 'ti-scale', text: '学科优势与短板', hint: '识别学生的优势学科和薄弱学科。' },
                { id: 'marginal-push', icon: 'ti-target-arrow', text: '临界学生干预', hint: '锁定临界学生，安排重点干预资源。' },
                { id: 'progress-analysis', icon: 'ti-trending-up', text: '进步与增值评价', hint: '判断学生处于上升、停滞还是回落状态。' },
                { id: 'cohort-growth', icon: 'ti-timeline', text: '纵向成长档案', hint: '把多次考试串成个人成长轨迹。' },
                { id: 'potential-analysis', icon: 'ti-bulb', text: '偏科潜力挖掘', hint: '抓住潜力学科和被掩盖的提升空间。' },
                { id: 'segment-analysis', icon: 'ti-chart-histogram', text: '分数段统计', hint: '看不同分段的人数密度和迁移趋势。' },
                { id: 'correlation-analysis', icon: 'ti-topology-star-3', text: '学科关联度分析', hint: '判断学科之间的联动和迁移机会。' },
                { id: 'report-generator', icon: 'ti-certificate', text: '成绩单/家长查分', hint: '生成面向学生与家长的成绩反馈出口。' }
            ]
        },
        tools: {
            title: '考务工具',
            color: '#7c3aed',
            icon: 'ti-briefcase',
            eyebrow: '考务执行',
            summary: '集中完成考场编排、分班、排课和学生协作安排。',
            items: [
                { id: 'exam-arranger', icon: 'ti-id-badge-2', text: '智能考场编排', hint: '生成更稳妥的考场、监考与座位安排。' },
                { id: 'freshman-simulator', icon: 'ti-arrows-split', text: '新生均衡分班', hint: '快速模拟均衡分班方案并比较结果。' },
                { id: 'grade-scheduler', icon: 'ti-calendar-time', text: '级部智能排课', hint: '协同安排课程资源和排课节奏。' },
                { id: 'seat-adjustment', icon: 'ti-armchair', text: '考后排座/互助组', hint: '考试后按策略重新排座和组织互助。' },
                { id: 'mutual-aid', icon: 'ti-friends', text: '学科小老师分组', hint: '按学科优势自动形成互助学习小组。' }
            ]
        }
    };

    // 「本次必看」分类：直接复用上面各分类里的**同一个 item 对象引用**，因此下方
    // language 覆盖 text/hint 时两处自动同步，不会出现常用入口和原入口文案不一致。
    (function installCoreWorkflowCategory() {
        const byId = new Map();
        Object.values(NAV_STRUCTURE).forEach((category) => {
            (category.items || []).forEach((item) => byId.set(item.id, item));
        });
        const items = CORE_WORKFLOW_MODULE_IDS.map((id) => byId.get(id)).filter(Boolean);
        // 名单里的 id 若因改名而失效则跳过；全部失效时不插入空分类。
        if (!items.length) return;

        const core = {
            title: '本次必看',
            color: '#4f46e5',
            icon: 'ti-star',
            eyebrow: '本次必看',
            summary: '考试后每次都要走的 6 个模块，按汇报顺序排列。其余模块仍在原分类中。',
            items,
            // 供 renderNavigation 判断是否对当前角色显示。
            roleGate: (roleKey) => CORE_WORKFLOW_ROLES.has(roleKey)
        };

        // 置顶：重建键顺序，把 core 放在最前，其余分类顺序完全不变。
        const rest = Object.keys(NAV_STRUCTURE).map((key) => [key, NAV_STRUCTURE[key]]);
        Object.keys(NAV_STRUCTURE).forEach((key) => { delete NAV_STRUCTURE[key]; });
        NAV_STRUCTURE.core = core;
        rest.forEach(([key, value]) => { NAV_STRUCTURE[key] = value; });
    })();

    const language = window.SystemLanguage || null;
    if (language) {
        Object.entries(NAV_STRUCTURE).forEach(([categoryId, category]) => {
            const domainCopy = language.getDomain(categoryId);
            if (domainCopy) {
                category.title = domainCopy.title;
                category.eyebrow = domainCopy.title;
                category.summary = domainCopy.summary;
            }
            category.items.forEach((item) => {
                const moduleCopy = language.getModule(item.id);
                if (!moduleCopy) return;
                item.text = moduleCopy.title;
                item.hint = moduleCopy.hint;
            });
        });
    }

    const ROLE_LABELS = language?.roles || {
        admin: '系统管理员',
        director: '教务主任',
        grade_director: '年级主任',
        class_teacher: '班主任',
        teacher: '任课教师',
        parent: '家长',
        guest: '访客'
    };

    let currentCategory = 'data';
    let moduleRailFloatingSyncFrame = 0;
    const globalScopeControlsCache = {
        schoolsSignature: '',
        classesSignature: '',
        rawDataRef: null
    };

    function setWorkspaceDrawerState(isOpen) {
        const drawer = document.getElementById('workspace-drawer');
        if (!drawer) return;

        const shouldOpen = !!isOpen;
        drawer.classList.toggle('is-open', shouldOpen);
        drawer.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');

        if (document.body) {
            document.body.classList.toggle('workspace-drawer-open', shouldOpen);
        }

        document.querySelectorAll('[data-workspace-toggle="true"]').forEach((element) => {
            element.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        });

        if (shouldOpen) {
            const sidebar = document.getElementById('app-sidebar');
            if (sidebar && sidebar.classList.contains('show-mobile')) {
                sidebar.classList.remove('show-mobile');
            }
        }

        notifyShellEnhancements();
    }

    function openWorkspaceDrawer() {
        setWorkspaceDrawerState(true);
    }

    function closeWorkspaceDrawer() {
        setWorkspaceDrawerState(false);
    }

    function toggleWorkspaceDrawer(forceOpen) {
        const drawer = document.getElementById('workspace-drawer');
        const isOpen = !!drawer && drawer.classList.contains('is-open');

        if (typeof forceOpen === 'boolean') {
            setWorkspaceDrawerState(forceOpen);
            return;
        }

        setWorkspaceDrawerState(!isOpen);
    }

    function setTextIfChanged(element, value) {
        if (!element) return;
        const next = value == null ? '' : String(value);
        if (element.textContent !== next) {
            element.textContent = next;
        }
    }

    function setAttrIfChanged(element, name, value) {
        if (!element) return;
        const next = value == null ? '' : String(value);
        if (element.getAttribute(name) !== next) {
            element.setAttribute(name, next);
        }
    }

    function setTextAndTooltip(element, text, tooltip) {
        setTextIfChanged(element, text);
        setAttrIfChanged(element, 'data-shell-tooltip', tooltip == null ? text : tooltip);
    }

    function formatOverviewCohortText(value) {
        if (language) return language.formatCohort(value);
        const text = String(value || '').trim();
        if (!text) return '未选择届别';
        const yearMatch = text.match(/(\d{4})/);
        return yearMatch ? `${yearMatch[1]}级` : text;
    }

    function formatOverviewModeText(value) {
        if (language) return language.formatGrade(value);
        const text = String(value || '').trim();
        if (!text) return '未识别年级';
        const gradeMatch = text.match(/(\d+)\s*年级/);
        return gradeMatch ? `${gradeMatch[1]}年级` : text.replace(/\s*模式$/, '');
    }

    function resolveShellModeText() {
        try {
            if (typeof window.getExamMetaFromUI === 'function' && typeof window.getEffectiveGrade === 'function') {
                const grade = String(window.getEffectiveGrade(window.getExamMetaFromUI()) || '').trim();
                if (grade) return `${grade}年级`;
            }
        } catch (_) { }
        const modeBadge = document.getElementById('mode-badge');
        return modeBadge ? String(modeBadge.textContent || '').trim() : '';
    }

    function normalizeScopeClass(value) {
        if (window.AuthState && typeof window.AuthState.normalizeClassName === 'function') {
            return window.AuthState.normalizeClassName(value || '');
        }
        if (typeof window.normalizeClass === 'function') return window.normalizeClass(value || '');
        return String(value || '').trim().replace(/\s+/g, '');
    }

    function isGlobalAll(value) {
        const text = String(value || '').trim();
        const lower = text.toLowerCase();
        return !text || lower === 'all' || lower === '__all__' || text.includes('全部') || text.includes('全乡') || text.includes('全镇');
    }

    function sameScopeSchool(left, right) {
        const a = String(left || '').trim();
        const b = String(right || '').trim();
        if (!a || !b) return false;
        if (a === b) return true;
        if (typeof window.areSchoolNamesEquivalent === 'function') {
            try {
                return !!window.areSchoolNamesEquivalent(a, b);
            } catch (_) {
                return false;
            }
        }
        return false;
    }

    function getGlobalScopeSchools() {
        if (typeof window.listAvailableSchoolsForCompare === 'function') return window.listAvailableSchoolsForCompare('all');
        return Object.keys(window.SCHOOLS || {});
    }

    function getGlobalScopeRows(school) {
        const rawRows = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
        if (isGlobalAll(school)) return rawRows;
        const schoolRecord = typeof window.getAppSchoolRecord === 'function' ? window.getAppSchoolRecord(school) : null;
        if (Array.isArray(schoolRecord?.students)) return schoolRecord.students;
        return rawRows.filter((row) => sameScopeSchool(row?.school, school));
    }

    function setSelectOptions(select, options, allLabel, oldValue) {
        if (!select) return;
        const values = Array.from(new Set((options || []).map((value) => String(value || '').trim()).filter(Boolean)));
        select.innerHTML = `<option value="ALL">${allLabel}</option>${values.map((value) => `<option value="${value}">${value}</option>`).join('')}`;
        if (oldValue && Array.from(select.options || []).some((option) => option.value === oldValue)) {
            select.value = oldValue;
        }
    }

    function setSelectByValueOrText(id, value, text) {
        const select = document.getElementById(id);
        if (!select || !select.options || !select.options.length) return false;
        const rawValue = String(value || '').trim();
        const rawText = String(text || rawValue).trim();
        const match = Array.from(select.options).find((option) => {
            return option.value === rawValue
                || option.textContent.trim() === rawText
                || sameScopeSchool(option.value, rawValue)
                || sameScopeSchool(option.textContent, rawText);
        });
        if (!match) return false;
        select.value = match.value;
        return true;
    }

    function updateGlobalScopeControls() {
        const schoolSelect = document.getElementById('global-school-scope');
        const classSelect = document.getElementById('global-class-scope');
        if (!schoolSelect || !classSelect) return;

        const oldSchool = schoolSelect.value;
        const oldClass = classSelect.value;
        const schools = Array.from(new Set(getGlobalScopeSchools()
            .map((value) => String(value || '').trim())
            .filter(Boolean)));
        const schoolsSignature = schools.join('|');
        if (globalScopeControlsCache.schoolsSignature !== schoolsSignature) {
            setSelectOptions(schoolSelect, schools, '全部学校', oldSchool);
            globalScopeControlsCache.schoolsSignature = schoolsSignature;
        }

        const rawDataRef = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : null;
        const classesSignature = [
            Number(window.__RAW_DATA_VERSION || 0),
            rawDataRef?.length || 0,
            schoolSelect.value || 'ALL'
        ].join('::');
        if (globalScopeControlsCache.rawDataRef === rawDataRef
            && globalScopeControlsCache.classesSignature === classesSignature) return;

        const classes = Array.from(new Set(getGlobalScopeRows(schoolSelect.value)
            .map((row) => String(row?.class || '').trim())
            .filter(Boolean)))
            .sort((a, b) => normalizeScopeClass(a).localeCompare(normalizeScopeClass(b), 'zh-Hans-CN', { numeric: true }));
        setSelectOptions(classSelect, classes, '全部班级', oldClass);
        globalScopeControlsCache.rawDataRef = rawDataRef;
        globalScopeControlsCache.classesSignature = classesSignature;
    }

    function applyGlobalScopeToModule() {
        const schoolSelect = document.getElementById('global-school-scope');
        const classSelect = document.getElementById('global-class-scope');
        if (!schoolSelect || !classSelect) return;

        const schoolValue = schoolSelect.value || 'ALL';
        const schoolText = schoolSelect.selectedOptions?.[0]?.textContent || schoolValue;
        const classValue = classSelect.value || 'ALL';
        const classText = classSelect.selectedOptions?.[0]?.textContent || classValue;

        [
            'studentSchoolSelect',
            'studentCompareSchool',
            'progressSchoolSelect',
            'progressCompareSchool',
            'marginalSchoolSelect',
            'sbSchoolSelect',
            'potSchoolSelect',
            'segSchoolSelect',
            'corrSchoolSelect',
            'sel-school',
            'cgSchoolSelect'
        ].forEach((id) => setSelectByValueOrText(id, schoolValue, schoolText));

        if (typeof window.updateSegmentClassSelect === 'function') window.updateSegmentClassSelect();
        if (typeof window.updatePotentialClassSelect === 'function') window.updatePotentialClassSelect();
        if (typeof window.updateCorrelationClassSelect === 'function') window.updateCorrelationClassSelect();
        if (window.CohortGrowth && typeof window.CohortGrowth.updateClassSelectForSchool === 'function') {
            window.CohortGrowth.updateClassSelectForSchool(schoolValue);
        }

        [
            'studentClassSelect',
            'studentCompareClass',
            'progressClassSelect',
            'marginalClassSelect',
            'sbClassSelect',
            'potClassSelect',
            'segClassSelect',
            'corrClassSelect',
            'sel-class',
            'cgClassSelect'
        ].forEach((id) => setSelectByValueOrText(id, classValue, classText));
    }

    function onGlobalSchoolScopeChange() {
        updateGlobalScopeControls();
        applyGlobalScopeToModule();
    }

    function notifyShellEnhancements() {
        scheduleFloatingModuleRailSync();
        if (typeof window.refreshShellEnhancements === 'function') {
            window.refreshShellEnhancements();
        }
    }

    function toSoftColor(hex, alpha) {
        const clean = String(hex || '').replace('#', '');
        if (clean.length !== 6) return `rgba(148, 163, 184, ${alpha})`;
        const red = Number.parseInt(clean.slice(0, 2), 16);
        const green = Number.parseInt(clean.slice(2, 4), 16);
        const blue = Number.parseInt(clean.slice(4, 6), 16);
        return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
    }

    function resolveUserRoleKey() {
        return (typeof Auth !== 'undefined' && Auth.currentUser && Auth.currentUser.role)
            ? Auth.currentUser.role
            : 'guest';
    }

    function resolveRoleLabel() {
        const user = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
        if (user && typeof RoleManager !== 'undefined' && typeof RoleManager.getUserRoles === 'function') {
            const roles = RoleManager.getUserRoles(user);
            if (Array.isArray(roles) && roles.length > 0) {
                return roles.map((role) => ROLE_LABELS[role] || role).join(' + ');
            }
        }
        return ROLE_LABELS[resolveUserRoleKey()] || resolveUserRoleKey();
    }

    function resolveVisibleItems(category) {
        if (!category || !Array.isArray(category.items)) return [];
        // 分类级门禁（目前只有「本次必看」用）：不满足时返回空数组，
        // renderNavigation 已有「visibleItems 为空则跳过该分类」的逻辑，自动整块隐藏。
        if (typeof category.roleGate === 'function' && !category.roleGate(resolveUserRoleKey())) {
            return [];
        }
        return category.items.filter((item) => {
            if (typeof canAccessModule === 'function' && !canAccessModule(item.id)) {
                return false;
            }
            if (item.id === 'indicator'
                && typeof window.isIndicatorModuleVisible === 'function'
                && !window.isIndicatorModuleVisible()) {
                return false;
            }
            if (item.id === 'report-generator' && typeof CONFIG !== 'undefined' && !CONFIG.showQuery) {
                return false;
            }
            return true;
        });
    }

    function isVisibleModuleActive(activeSectionId, visibleItems) {
        if (!activeSectionId) return false;
        if (typeof canAccessModule === 'function' && !canAccessModule(activeSectionId)) return false;
        if (activeSectionId === 'indicator'
            && typeof window.isIndicatorModuleVisible === 'function'
            && !window.isIndicatorModuleVisible()) return false;
        return visibleItems.some((item) => item.id === activeSectionId);
    }

    function resolveCategoryState() {
        const current = NAV_STRUCTURE[currentCategory];
        if (current && resolveVisibleItems(current).length > 0) return;

        const orderedKeys = Object.keys(NAV_STRUCTURE);
        const role = resolveUserRoleKey();
        const preferredByRole = {
            admin: ['data', 'town', 'county', 'class', 'student', 'tools', 'apps'],
            director: ['data', 'town', 'class', 'student', 'county', 'tools', 'apps'],
            grade_director: ['town', 'class', 'student', 'apps'],
            class_teacher: ['class', 'student', 'apps'],
            teacher: ['class', 'student', 'apps'],
            parent: ['student', 'apps'],
            student: ['student', 'apps'],
            guest: ['data', 'apps']
        };
        const candidates = [...(preferredByRole[role] || []), ...orderedKeys];
        const nextKey = candidates.find((key) => {
            const category = NAV_STRUCTURE[key];
            return category && resolveVisibleItems(category).length > 0;
        });
        currentCategory = nextKey || orderedKeys[0] || currentCategory;
    }

    function getActiveSectionId() {
        const active = document.querySelector('.section.active');
        return active ? active.id : '';
    }

    function findItemById(id) {
        if (!id) return null;
        for (const key of Object.keys(NAV_STRUCTURE)) {
            const match = NAV_STRUCTURE[key].items.find((item) => item.id === id);
            if (match) return { categoryKey: key, item: match };
        }
        return null;
    }

    function applyCategoryAccent(category) {
        if (!category) return;
        document.documentElement.style.setProperty('--shell-accent', category.color);
        document.documentElement.style.setProperty('--primary', category.color);
    }

    function getModuleRailInstances() {
        return Array.from(document.querySelectorAll('[data-shell-module-rail-shell]'))
            .map(function (shell) {
                const rail = shell.querySelector('[data-shell-module-rail]');
                const title = shell.querySelector('[data-shell-module-rail-title]');
                const status = shell.querySelector('[data-shell-module-rail-status]');
                if (!rail || !title || !status) return null;
                return { shell, rail, title, status };
            })
            .filter(Boolean);
    }

    function getPrimaryModuleRailShell() {
        return document.querySelector('[data-shell-module-rail-shell="primary"]')
            || document.getElementById('shell-module-rail-shell');
    }

    function getFloatingModuleRailShell() {
        return document.querySelector('[data-shell-module-rail-shell="floating"]');
    }

    function getMainScrollContainer() {
        return document.querySelector('main.app-main');
    }

    function isDesktopModuleRailViewport() {
        if (document.body && document.body.dataset.mobileQuery === 'true') return false;
        return !(window.matchMedia && window.matchMedia('(max-width: 960px)').matches);
    }

    function scrollActiveModuleRailChipIntoView(rail) {
        if (!rail) return;
        const activeChip = rail.querySelector('.shell-module-rail-chip.is-active');
        if (!activeChip || typeof activeChip.scrollIntoView !== 'function') return;
        activeChip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'auto' });
    }

    function syncFloatingModuleRailLayout() {
        const floatingShell = getFloatingModuleRailShell();
        const header = document.getElementById('main-header');
        if (!floatingShell || !header || !isDesktopModuleRailViewport()) return;

        const headerRect = header.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const left = Math.max(12, Math.round(headerRect.left));
        const maxWidth = Math.max(280, viewportWidth - left - 12);
        const width = Math.max(280, Math.min(Math.round(headerRect.width), maxWidth));
        const top = Math.max(12, Math.round(headerRect.bottom + 10));

        floatingShell.style.setProperty('--shell-module-rail-floating-top', `${top}px`);
        floatingShell.style.setProperty('--shell-module-rail-floating-left', `${left}px`);
        floatingShell.style.setProperty('--shell-module-rail-floating-width', `${width}px`);
    }

    function syncFloatingModuleRailVisibility() {
        const floatingShell = getFloatingModuleRailShell();
        const sourceShell = getPrimaryModuleRailShell();
        const header = document.getElementById('main-header');
        if (!floatingShell) return;

        let shouldShow = false;
        if (sourceShell && header && isDesktopModuleRailViewport()) {
            const sourceRail = sourceShell.querySelector('[data-shell-module-rail]');
            const hasRailContent = sourceShell.style.display !== 'none'
                && sourceRail
                && sourceRail.childElementCount > 0;

            if (hasRailContent) {
                const headerRect = header.getBoundingClientRect();
                const sourceRect = sourceShell.getBoundingClientRect();
                shouldShow = sourceRect.bottom <= headerRect.bottom + 16;
            }
        }

        floatingShell.classList.toggle('is-visible', shouldShow);
        floatingShell.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
    }

    function scheduleFloatingModuleRailSync() {
        if (moduleRailFloatingSyncFrame) return;
        moduleRailFloatingSyncFrame = window.requestAnimationFrame(function () {
            moduleRailFloatingSyncFrame = 0;
            syncFloatingModuleRailLayout();
            syncFloatingModuleRailVisibility();
        });
    }

    function bindFloatingModuleRailBehavior() {
        const floatingShell = getFloatingModuleRailShell();
        if (!floatingShell) return;

        if (floatingShell.dataset.floatingRailBound === 'true') {
            scheduleFloatingModuleRailSync();
            return;
        }

        floatingShell.dataset.floatingRailBound = 'true';

        const main = getMainScrollContainer();
        const header = document.getElementById('main-header');
        const sourceShell = getPrimaryModuleRailShell();
        const scheduleSync = function () {
            scheduleFloatingModuleRailSync();
        };

        if (main) {
            main.addEventListener('scroll', scheduleSync, { passive: true });
        }
        window.addEventListener('resize', scheduleSync, { passive: true });
        window.addEventListener('scroll', scheduleSync, { passive: true });

        if (typeof ResizeObserver === 'function') {
            const observer = new ResizeObserver(scheduleSync);
            if (main) observer.observe(main);
            if (header) observer.observe(header);
            if (sourceShell) observer.observe(sourceShell);
            floatingShell.__floatingRailResizeObserver = observer;
        }

        scheduleFloatingModuleRailSync();
    }

    function updateHorizontalScrollState(scrollTarget, stateTarget) {
        const target = scrollTarget || stateTarget;
        const host = stateTarget || scrollTarget;
        if (!target || !host) return;

        const maxScrollLeft = Math.max(0, target.scrollWidth - target.clientWidth);
        const currentScrollLeft = Math.max(0, Math.min(maxScrollLeft, Number(target.scrollLeft || 0)));
        const progress = maxScrollLeft > 0 ? (currentScrollLeft / maxScrollLeft) : 0;

        host.dataset.horizontalScrollable = maxScrollLeft > 1 ? 'true' : 'false';
        host.dataset.horizontalScrollStart = currentScrollLeft <= 1 ? 'true' : 'false';
        host.dataset.horizontalScrollEnd = maxScrollLeft <= 1 || currentScrollLeft >= maxScrollLeft - 1 ? 'true' : 'false';
        host.style.setProperty('--horizontal-scroll-progress', progress.toFixed(4));
    }

    function flashHorizontalScrollState(stateTarget) {
        if (!stateTarget) return;

        stateTarget.dataset.horizontalScrolling = 'true';
        clearTimeout(stateTarget.__horizontalScrollFeedbackTimer);
        stateTarget.__horizontalScrollFeedbackTimer = window.setTimeout(function () {
            stateTarget.dataset.horizontalScrolling = 'false';
        }, 220);
    }

    function normalizeHorizontalWheelDelta(event) {
        if (!event) return 0;
        const dominantDelta = Math.abs(event.deltaX) > Math.abs(event.deltaY)
            ? event.deltaX
            : event.deltaY;
        if (!dominantDelta) return 0;

        if (event.deltaMode === 1) return dominantDelta * 24;
        if (event.deltaMode === 2) return dominantDelta * 72;
        return dominantDelta;
    }

    function bindHorizontalWheelScroll(container, scrollTarget, stateTarget) {
        const listenerHost = container || scrollTarget || stateTarget;
        const target = scrollTarget || container;
        const stateHost = stateTarget || listenerHost || target;
        if (!listenerHost || !target || !stateHost) return;

        updateHorizontalScrollState(target, stateHost);
        if (listenerHost.dataset.horizontalWheelBound === 'true') return;

        listenerHost.dataset.horizontalWheelBound = 'true';

        const syncState = function () {
            updateHorizontalScrollState(target, stateHost);
        };

        listenerHost.addEventListener('wheel', function (event) {
            if (!event || event.ctrlKey || event.defaultPrevented) return;
            if (window.matchMedia && window.matchMedia('(max-width: 960px)').matches) return;

            const maxScrollLeft = Math.max(0, target.scrollWidth - target.clientWidth);
            if (maxScrollLeft <= 1) return;

            const delta = normalizeHorizontalWheelDelta(event);
            if (!delta) return;

            const currentScrollLeft = target.scrollLeft;
            const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, currentScrollLeft + delta));
            if (Math.abs(nextScrollLeft - currentScrollLeft) < 1) return;

            event.preventDefault();
            target.scrollLeft = nextScrollLeft;
            flashHorizontalScrollState(stateHost);
            syncState();
        }, { passive: false });

        target.addEventListener('scroll', function () {
            flashHorizontalScrollState(stateHost);
            syncState();
        }, { passive: true });

        window.addEventListener('resize', syncState, { passive: true });

        if (typeof ResizeObserver === 'function') {
            const observer = new ResizeObserver(syncState);
            observer.observe(target);
            if (stateHost !== target) observer.observe(stateHost);
            listenerHost.__horizontalWheelResizeObserver = observer;
        }

        window.requestAnimationFrame(syncState);
    }

    function buildModuleRailSignature(category, visibleItems, activeItem) {
        const categoryKey = [
            category && category.title,
            category && category.color,
            category && category.eyebrow
        ].join('|');
        const itemKey = (Array.isArray(visibleItems) ? visibleItems : [])
            .map((item) => [item.id, item.text, item.hint || ''].join(':'))
            .join('|');
        return [categoryKey, itemKey].join('::');
    }

    function syncModuleRailActiveState(rail, activeId) {
        if (!rail) return;
        rail.querySelectorAll('.shell-module-rail-chip').forEach((button) => {
            const isActive = button.getAttribute('data-module-id') === activeId;
            button.classList.toggle('is-active', isActive);
            button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
    }

    function bindModuleRailDelegatedClick(rail) {
        if (!rail || rail.dataset.moduleRailDelegated === 'true') return;
        rail.dataset.moduleRailDelegated = 'true';
        rail.addEventListener('click', function (event) {
            const target = event.target && event.target.closest
                ? event.target.closest('.shell-module-rail-chip')
                : null;
            if (!target || !rail.contains(target)) return;

            event.preventDefault();
            const moduleId = target.getAttribute('data-module-id');
            if (!moduleId) return;
            if (typeof switchTab === 'function') {
                switchTab(moduleId);
            } else {
                updateShellChrome(moduleId);
            }
        });
    }

    function renderModuleRailShell(instance, category, visibleItems, activeItem) {
        if (!instance || !instance.shell || !instance.rail || !instance.title || !instance.status) return;

        const activeId = activeItem ? activeItem.id : '';
        const activeLabel = activeItem ? activeItem.text : '未选择模块';
        const signature = buildModuleRailSignature(category, visibleItems, activeItem);

        instance.shell.style.display = '';
        instance.shell.style.setProperty('--rail-accent', category.color);
        instance.shell.style.setProperty('--rail-accent-soft', toSoftColor(category.color, 0.12));
        instance.shell.style.setProperty('--rail-accent-strong', toSoftColor(category.color, 0.20));
        instance.title.textContent = `${category.title} · 桌面快切`;
        instance.status.textContent = `当前模块：${activeLabel}`;
        instance.status.setAttribute('data-shell-tooltip', `${category.title} 当前模块：${activeLabel}`);
        bindModuleRailDelegatedClick(instance.rail);

        if (instance.rail.dataset.moduleRailSignature === signature) {
            syncModuleRailActiveState(instance.rail, activeId);
            return;
        }
        instance.rail.dataset.moduleRailSignature = signature;

        instance.rail.innerHTML = visibleItems.map((item) => `
            <button
                type="button"
                class="shell-module-rail-chip${item.id === activeId ? ' is-active' : ''}"
                data-module-id="${item.id}"
                data-shell-summary="${item.hint || item.text}"
                data-shell-tooltip="${item.hint || item.text}"
                aria-pressed="${item.id === activeId ? 'true' : 'false'}"
            >
                <span class="shell-module-rail-chip-index">${String(visibleItems.indexOf(item) + 1).padStart(2, '0')}</span>
                <span class="shell-module-rail-chip-copy">
                    <span class="shell-module-rail-chip-title">${item.text}</span>
                    <span class="shell-module-rail-chip-hint">${item.hint || item.text}</span>
                </span>
            </button>
        `).join('');

        bindHorizontalWheelScroll(instance.shell, instance.rail, instance.shell);
    }

    function renderModuleRail(category, visibleItems, activeItem) {
        const instances = getModuleRailInstances();
        if (instances.length) {
            if (!category || !Array.isArray(visibleItems) || visibleItems.length === 0) {
                instances.forEach(function (instance) {
                    instance.shell.style.display = 'none';
                    instance.rail.innerHTML = '';
                    delete instance.rail.dataset.moduleRailSignature;
                    instance.shell.classList.remove('is-visible');
                    if (instance.shell === getFloatingModuleRailShell()) {
                        instance.shell.setAttribute('aria-hidden', 'true');
                    }
                });
                scheduleFloatingModuleRailSync();
                return;
            }

            instances.forEach(function (instance) {
                renderModuleRailShell(instance, category, visibleItems, activeItem);
            });

            window.requestAnimationFrame(function () {
                instances.forEach(function (instance) {
                    scrollActiveModuleRailChipIntoView(instance.rail);
                    updateHorizontalScrollState(instance.rail, instance.shell);
                });
                scheduleFloatingModuleRailSync();
            });
            return;
        }

        const railShell = document.getElementById('shell-module-rail-shell');
        const rail = document.getElementById('shell-module-rail');
        const railTitle = document.getElementById('shell-module-rail-title');
        const railStatus = document.getElementById('shell-module-rail-status');

        if (!railShell || !rail || !railTitle || !railStatus) return;

        if (!category || !Array.isArray(visibleItems) || visibleItems.length === 0) {
            railShell.style.display = 'none';
            rail.innerHTML = '';
            delete rail.dataset.moduleRailSignature;
            return;
        }

        const activeId = activeItem ? activeItem.id : '';
        const activeLabel = activeItem ? activeItem.text : '未选择模块';
        railShell.style.display = '';
        railShell.style.setProperty('--rail-accent', category.color);
        railShell.style.setProperty('--rail-accent-soft', toSoftColor(category.color, 0.12));
        railShell.style.setProperty('--rail-accent-strong', toSoftColor(category.color, 0.20));
        railTitle.textContent = `${category.title} · 桌面快切`;
        railStatus.textContent = `当前模块：${activeLabel}`;
        railStatus.setAttribute('data-shell-tooltip', `${category.title} 当前模块：${activeLabel}`);
        bindModuleRailDelegatedClick(rail);

        const signature = buildModuleRailSignature(category, visibleItems, activeItem);
        if (rail.dataset.moduleRailSignature === signature) {
            syncModuleRailActiveState(rail, activeId);
            window.requestAnimationFrame(function () {
                scrollActiveModuleRailChipIntoView(rail);
                updateHorizontalScrollState(rail, railShell);
            });
            return;
        }
        rail.dataset.moduleRailSignature = signature;

        rail.innerHTML = visibleItems.map((item) => `
            <button
                type="button"
                class="shell-module-rail-chip${item.id === activeId ? ' is-active' : ''}"
                data-module-id="${item.id}"
                data-shell-summary="${item.hint || item.text}"
                data-shell-tooltip="${item.hint || item.text}"
                aria-pressed="${item.id === activeId ? 'true' : 'false'}"
            >
                <span class="shell-module-rail-chip-index">${String(visibleItems.indexOf(item) + 1).padStart(2, '0')}</span>
                <span class="shell-module-rail-chip-copy">
                    <span class="shell-module-rail-chip-title">${item.text}</span>
                    <span class="shell-module-rail-chip-hint">${item.hint || item.text}</span>
                </span>
            </button>
        `).join('');

        bindHorizontalWheelScroll(railShell, rail, railShell);
        window.requestAnimationFrame(function () {
            scrollActiveModuleRailChipIntoView(rail);
            updateHorizontalScrollState(rail, railShell);
        });
    }

    function updateShellChrome(activeId) {
        resolveCategoryState();
        const category = NAV_STRUCTURE[currentCategory] || NAV_STRUCTURE.data;
        if (!category) return;

        updateGlobalScopeControls();
        applyGlobalScopeToModule();
        applyCategoryAccent(category);

        const visibleItems = resolveVisibleItems(category);
        const fallbackItem = visibleItems[0] || category.items[0] || null;
        // 同一模块可同时出现在「本次必看」和它的原分类中。壳层状态必须以当前
        // 分类的可见项为准，否则 findItemById 会先命中 core 的同名入口，继而
        // 退回到当前分类第一项，造成内容已切换、导航却高亮错误模块。
        const requestedActiveId = activeId || getActiveSectionId();
        const activeItem = visibleItems.find((item) => item.id === requestedActiveId) || fallbackItem;

        const activeTitle = activeItem ? activeItem.text : category.title;
        const activeHint = activeItem ? activeItem.hint : category.summary;
        const subtitle = activeItem ? `${category.title} / ${activeItem.text}` : `${category.title} / 模块导航`;

        setTextIfChanged(document.getElementById('app-subtitle'), subtitle);

        setTextIfChanged(document.getElementById('shell-current-title'), activeTitle);

        setTextIfChanged(document.getElementById('shell-current-desc'), activeHint || category.summary);

        setTextIfChanged(document.getElementById('shell-category-kicker'), category.eyebrow);

        setTextIfChanged(document.getElementById('shell-category-title'), category.title);

        setTextIfChanged(document.getElementById('shell-category-desc'), category.summary);

        const moduleCount = document.getElementById('shell-module-count');
        if (moduleCount) {
            const countText = `${visibleItems.length} 个模块`;
            setTextAndTooltip(moduleCount, countText, `${category.title} 当前可见模块数：${visibleItems.length}`);
        }

        const cohortSelector = document.getElementById('cohort-selector');
        const cohortChip = document.getElementById('shell-cohort-chip');
        if (cohortChip) {
            const selectedText = cohortSelector && cohortSelector.selectedIndex >= 0
                ? String(cohortSelector.options[cohortSelector.selectedIndex].text || '').trim()
                : '';
            const cohortText = selectedText || '届别未选择';
            setTextAndTooltip(cohortChip, formatOverviewCohortText(cohortText), `当前届别：${cohortText}`);
        }

        const modeChip = document.getElementById('shell-mode-chip');
        if (modeChip) {
            const modeText = resolveShellModeText();
            const shellModeText = modeText || language?.states?.modeLoading || '年级待加载';
            setTextAndTooltip(modeChip, formatOverviewModeText(shellModeText), `当前模式：${shellModeText}`);
        }

        const roleText = resolveRoleLabel();
        setTextIfChanged(document.getElementById('workspace-drawer-category'), category.title);

        setTextIfChanged(document.getElementById('workspace-drawer-copy'), category.summary);

        setTextIfChanged(document.getElementById('workspace-drawer-active'), activeTitle);

        const drawerMode = document.getElementById('workspace-drawer-mode');
        if (drawerMode && modeChip) setTextIfChanged(drawerMode, modeChip.textContent || '');

        const drawerCohort = document.getElementById('workspace-drawer-cohort');
        if (drawerCohort && cohortChip) setTextIfChanged(drawerCohort, cohortChip.textContent || '');

        const roleHint = document.getElementById('role-hint-sidebar');
        setTextIfChanged(roleHint, roleText);

        const rolePill = document.getElementById('shell-role-pill');
        if (rolePill) {
            setTextAndTooltip(rolePill, roleText, roleText);
        }

        renderModuleRail(category, visibleItems, activeItem);
        notifyShellEnhancements();
    }

    function renderNavigation() {
        const sidebarNav = document.getElementById('sidebar-nav');
        if (!sidebarNav) return;

        resolveCategoryState();
        sidebarNav.innerHTML = '';

        Object.keys(NAV_STRUCTURE).forEach((key) => {
            const category = NAV_STRUCTURE[key];
            const visibleItems = resolveVisibleItems(category);
            if (visibleItems.length === 0) return;
            const item = document.createElement('div');
            item.className = 'sidebar-menu-item';
            if (key === currentCategory) item.classList.add('active');
            item.title = category.title;
            item.setAttribute('data-shell-summary', category.summary || category.title);
            item.setAttribute('data-shell-tooltip', category.summary || category.title);
            item.style.setProperty('--nav-accent', category.color);
            item.style.setProperty('--accent-soft', toSoftColor(category.color, 0.14));
            item.style.setProperty('--accent-ring', toSoftColor(category.color, 0.20));

            item.innerHTML = `
                <div class="sidebar-menu-item__main">
                    <span class="sidebar-menu-item__icon">
                        <i class="ti ${category.icon}"></i>
                    </span>
                    <span class="sidebar-menu-item__text">
                        <span class="sidebar-menu-item__title">${category.title}</span>
                        <span class="sidebar-menu-item__meta">${visibleItems.length} 个模块</span>
                    </span>
                </div>
            `;

            item.onclick = function (event) {
                event.stopPropagation();
                if (currentCategory !== key) {
                    switchCategory(key);
                } else {
                    activateCurrentCategoryDefaultModule(key);
                }
                const sidebar = document.getElementById('app-sidebar');
                if (sidebar && sidebar.classList.contains('show-mobile')) {
                    sidebar.classList.remove('show-mobile');
                }
            };

            sidebarNav.appendChild(item);
        });

        renderSubNavigation();
        updateShellChrome();
        notifyShellEnhancements();
    }

    function activateSubmodule(item, category) {
        if (!item || !item.id) return;
        document.documentElement.style.setProperty('--primary', category.color);
        syncSubNavigationActiveState(item.id);
        if (typeof switchTab === 'function') switchTab(item.id);
        closeWorkspaceDrawer();
    }

    function syncSubNavigationActiveState(activeId) {
        const subNavContainer = document.getElementById('sub-nav-container');
        if (!subNavContainer) return;
        subNavContainer.querySelectorAll('.shell-story-card[data-module-id]').forEach((card) => {
            const isActive = card.getAttribute('data-module-id') === activeId;
            card.classList.toggle('active', isActive);
            card.setAttribute('aria-current', isActive ? 'page' : 'false');
        });
    }

    function activateCurrentCategoryDefaultModule(key) {
        if (key && NAV_STRUCTURE[key]) currentCategory = key;
        resolveCategoryState();
        const category = NAV_STRUCTURE[currentCategory];
        const visibleItems = resolveVisibleItems(category);
        const firstItem = visibleItems[0] || (category && category.items ? category.items[0] : null);
        if (!category || !firstItem) {
            updateShellChrome();
            return;
        }
        activateSubmodule(firstItem, category);
    }

    // 「本次必看」最后一步的收口提示。只在 core 分类、且当前正停在最后一步时出现，
    // 避免在浏览中途就催用户导出。
    function renderCoreWorkflowFinishHint(container, visibleItems) {
        if (!container || currentCategory !== 'core') return;
        const lastItem = visibleItems[visibleItems.length - 1];
        if (!lastItem || getActiveSectionId() !== lastItem.id) return;

        const hint = document.createElement('div');
        hint.className = 'core-workflow-finish';
        hint.innerHTML = `
            <span class="core-workflow-finish__text">
                <strong>六步走完了。</strong>接下来交材料：分析包给校长和上级，成绩单发给家长。
            </span>
            <span class="core-workflow-finish__actions">
                <button type="button" class="btn btn-green" data-core-finish="package">
                    <i class="ti ti-file-zip"></i> 下载考试分析包
                </button>
                <button type="button" class="btn" data-core-finish="report">
                    <i class="ti ti-certificate"></i> 去生成成绩单
                </button>
            </span>`;

        hint.querySelector('[data-core-finish="package"]').onclick = function (event) {
            event.stopPropagation();
            // 复用综合评价页既有的分析包导出，不新增导出逻辑；未就绪时回到该页让用户手动点。
            if (typeof window.downloadExamAnalysisPackage === 'function') {
                window.downloadExamAnalysisPackage();
            } else if (typeof switchTab === 'function') {
                switchTab('summary');
            }
        };
        hint.querySelector('[data-core-finish="report"]').onclick = function (event) {
            event.stopPropagation();
            if (typeof switchTab === 'function') switchTab('report-generator');
        };

        container.appendChild(hint);
    }

    function renderSubNavigation() {
        const subNavContainer = document.getElementById('sub-nav-container');
        if (!subNavContainer) return;

        subNavContainer.innerHTML = '';
        bindHorizontalWheelScroll(subNavContainer, subNavContainer, subNavContainer);
        resolveCategoryState();
        const category = NAV_STRUCTURE[currentCategory];
        if (!category) return;

        const visibleItems = resolveVisibleItems(category);
        if (visibleItems.length === 0) {
            updateShellChrome();
            return;
        }

        const activeSectionId = getActiveSectionId();

        visibleItems.forEach((item, index) => {
            const card = document.createElement('div');
            card.className = 'shell-story-card';
            card.title = item.text;
            card.setAttribute('data-module-id', item.id);
            card.setAttribute('data-shell-tooltip', item.hint || item.text);
            card.style.setProperty('--nav-accent', category.color);
            card.style.setProperty('--accent-soft', toSoftColor(category.color, 0.10));

            if (item.id === activeSectionId) {
                card.classList.add('active');
            }

            // 「本次必看」是按汇报顺序排的一条流水线，给它的卡片加步骤序号与
            // 「这一步做什么」的说明；其余分类是并列关系，保持原样不加序号。
            const isCoreWorkflow = currentCategory === 'core';
            const stepBadge = isCoreWorkflow
                ? `<span class="shell-story-card__step">${index + 1}</span>`
                : '';
            const desc = isCoreWorkflow
                ? (CORE_WORKFLOW_STEP_HINTS[item.id] || item.hint)
                : item.hint;

            card.innerHTML = `
                ${stepBadge}
                <span class="shell-story-card__icon">
                    <i class="ti ${item.icon}"></i>
                </span>
                <span class="shell-story-card__body">
                    <span class="shell-story-card__title">${item.text}</span>
                    <span class="shell-story-card__desc">${desc}</span>
                </span>
                <i class="ti ti-chevron-right shell-story-card__chevron"></i>
            `;

            card.onclick = function (event) {
                event.stopPropagation();
                activateSubmodule(item, category);
            };

            subNavContainer.appendChild(card);
        });

        // 流程收口：走到「本次必看」最后一步时，明确告诉用户接下来该交什么材料。
        // 产出入口原本只在第 1 步（综合评价页的导出报告 / 下载分析包），走到第 6 步后
        // 用户得自己翻回去找 —— 这条提示把终点补上，按钮直达，不新增任何导出能力。
        renderCoreWorkflowFinishHint(subNavContainer, visibleItems);

        setTimeout(function () {
            const lastAuto = window.__SHELL_LAST_DEFAULT_MODULE_AUTO__ || {};
            const now = Date.now();
            const activeSectionId = getActiveSectionId();
            const activeIsVisible = isVisibleModuleActive(activeSectionId, visibleItems);
            const firstCard = subNavContainer.querySelector('.shell-story-card');
            const firstModuleId = firstCard ? firstCard.getAttribute('data-module-id') : '';
            if (!firstCard || activeIsVisible) return;
            if (firstModuleId && lastAuto.id === firstModuleId && now - Number(lastAuto.time || 0) < 10000) return;
            if (firstModuleId) {
                window.__SHELL_LAST_DEFAULT_MODULE_AUTO__ = { id: firstModuleId, time: now };
                firstCard.click();
            }
        }, 300); // 从 100ms 增加到 300ms，让用户主动切换的 switchTab（及其 500ms 重试）有时间完成，避免自动进入覆盖用户意图

        window.requestAnimationFrame(function () {
            updateHorizontalScrollState(subNavContainer, subNavContainer);
        });
        updateShellChrome(activeSectionId);
        notifyShellEnhancements();
    }

    function switchCategory(key) {
        if (!NAV_STRUCTURE[key]) return;
        currentCategory = key;
        document.documentElement.style.setProperty('--primary', NAV_STRUCTURE[key].color);
        applyCategoryAccent(NAV_STRUCTURE[key]);

        if (typeof forceHideAllSectionsExcept === 'function') forceHideAllSectionsExcept();
        if (typeof resetMainViewport === 'function') resetMainViewport();

        renderNavigation();

        setTimeout(function () {
            activateCurrentCategoryDefaultModule(key);
        }, 50);
    }

    window.NAV_STRUCTURE = NAV_STRUCTURE;
    window.renderNavigation = renderNavigation;
    window.renderSubNavigation = renderSubNavigation;
    window.switchNavCategory = switchCategory;
    window.openWorkspaceDrawer = openWorkspaceDrawer;
    window.closeWorkspaceDrawer = closeWorkspaceDrawer;
    window.toggleWorkspaceDrawer = toggleWorkspaceDrawer;
    window.updateGlobalScopeControls = updateGlobalScopeControls;
    window.applyGlobalScopeToModule = applyGlobalScopeToModule;
    window.onGlobalSchoolScopeChange = onGlobalSchoolScopeChange;
    window.getCurrentNavCategory = function () { return currentCategory; };
    window.setCurrentNavCategorySilently = function (key) {
        if (!NAV_STRUCTURE[key]) return;
        currentCategory = key;
        applyCategoryAccent(NAV_STRUCTURE[key]);
    };
    window.syncShellChrome = updateShellChrome;

    function ensureSidebarNavigationRendered() {
        const sidebarNav = document.getElementById('sidebar-nav');
        if (!sidebarNav) return;
        if (sidebarNav.querySelector('.sidebar-menu-item')) {
            updateShellChrome();
            return;
        }
        renderNavigation();
    }

    document.addEventListener('DOMContentLoaded', function () {
        bindFloatingModuleRailBehavior();
        setWorkspaceDrawerState(false);
        ensureSidebarNavigationRendered();
        scheduleFloatingModuleRailSync();
    });

    window.addEventListener('school:app-modules-ready', ensureSidebarNavigationRendered);
    window.addEventListener('school:login-workbench-ready', ensureSidebarNavigationRendered);

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            closeWorkspaceDrawer();
        }
    });
})();
