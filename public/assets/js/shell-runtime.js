(function () {
    const NAV_STRUCTURE = {
        data: {
            title: '数据管理',
            color: '#334155',
            icon: 'ti-database',
            eyebrow: 'Setup Flow',
            summary: '先把届别、数据、权限和参数校准，再进入分析与执行链路。',
            items: [
                { id: 'starter-hub', icon: 'ti-rocket', text: '新手入口与诊断', hint: '完成初始化检查，快速确认系统是否已经进入可分析状态。' },
                { id: 'upload', icon: 'ti-database-import', text: '数据上传与设置', hint: '管理数据导入、映射、科目与基础配置。' }
            ]
        },
        town: {
            title: '联考分析',
            color: '#b45309',
            icon: 'ti-trophy',
            eyebrow: 'Insight Deck',
            summary: '像看频道总后台一样先看总榜、亮点、风险和关键层次位次。',
            items: [
                { id: 'summary', icon: 'ti-report', text: '综合评价总榜', hint: '先看全局排名、梯队分布和学校位置。' },
                { id: 'analysis', icon: 'ti-chart-pie', text: '两率一分(横向)', hint: '用横向口径查看重点率、及格率和均分变化。' },
                { id: 'macro-watch', icon: 'ti-alert-triangle', text: '预警与亮点看板', hint: '把风险点和高表现项目收敛到一张处置板。' },
                { id: 'high-score', icon: 'ti-trophy', text: '高分段/尖子生', hint: '追踪尖子层和高分段的规模与稳定度。' },
                { id: 'indicator', icon: 'ti-target', text: '指标生达标核算', hint: '快速核对指标生口径、边缘人数和达标压力。' },
                { id: 'bottom3', icon: 'ti-arrow-bar-to-down', text: '低分率/后1/3核算', hint: '定位底部群体波动，提前准备补弱动作。' }
            ]
        },
        class: {
            title: '教学管理',
            color: '#dc2626',
            icon: 'ti-school',
            eyebrow: 'Studio Ops',
            summary: '把教学问题、预警、整改和版本归档统一收进一条执行看板。',
            items: [
                { id: 'teaching-overview', icon: 'ti-layout-dashboard', text: '教学总览', hint: '像工作室总览页一样汇总核心状态和待办动作。' },
                { id: 'teaching-issue-board', icon: 'ti-clipboard-list', text: '教学问题清单', hint: '集中收口课堂、成绩和流程中的异常问题。' },
                { id: 'teaching-warning-center', icon: 'ti-alert-triangle', text: '异常预警中心', hint: '按风险等级查看当前最值得优先处理的提醒。' },
                { id: 'teaching-rectify-center', icon: 'ti-list-check', text: '整改任务列表', hint: '将问题转成可追踪、可验收的整改任务。' },
                { id: 'teaching-version-center', icon: 'ti-stack-2', text: '版本归档中心', hint: '沉淀口径版本、历史决策与回滚节点。' },
                { id: 'teacher-analysis', icon: 'ti-school', text: '教师教学质量画像', hint: '从教师视角查看贡献、波动和结构性问题。' },
                { id: 'single-school-eval', icon: 'ti-scale', text: '绩效公平考核模型', hint: '结合口径和上下文做公平性核算。' },
                { id: 'class-comparison', icon: 'ti-layout-columns', text: '班级横向对比', hint: '横向对比班级表现，快速识别差异来源。' },
                { id: 'class-diagnosis', icon: 'ti-activity', text: '班级分化诊断(SD)', hint: '追踪班级内部离散度，判断分化是否加剧。' }
            ]
        },
        student: {
            title: '学情诊断',
            color: '#059669',
            icon: 'ti-user-scan',
            eyebrow: 'Learner Feed',
            summary: '像刷内容流一样连续查看学生画像、成长轨迹和临界干预点。',
            items: [
                { id: 'zhongkao-countdown', icon: 'ti-calendar-event', text: '中考倒计时', hint: '用时间视角拉齐当前冲刺阶段和节奏。' },
                { id: 'student-overview', icon: 'ti-layout-dashboard', text: '学情总览', hint: '先看整体学情结构、风险分层和关键信号。' },
                { id: 'student-details', icon: 'ti-list-details', text: '学生档案查询', hint: '按学生查看成绩、班级和画像细节。' },
                { id: 'subject-balance', icon: 'ti-scale', text: '优劣势学科透视', hint: '识别学生的拉分学科和短板学科。' },
                { id: 'marginal-push', icon: 'ti-target-arrow', text: '临界生精准干预', hint: '锁定边缘学生，安排最值当的干预资源。' },
                { id: 'progress-analysis', icon: 'ti-trending-up', text: '进退步/增值评价', hint: '判断学生是在稳定上行、停滞还是下滑。' },
                { id: 'cohort-growth', icon: 'ti-timeline', text: '纵向成长档案', hint: '把多次考试串成个人成长轨迹。' },
                { id: 'potential-analysis', icon: 'ti-bulb', text: '偏科潜力挖掘', hint: '抓住潜力学科和被掩盖的提升空间。' },
                { id: 'segment-analysis', icon: 'ti-chart-histogram', text: '分数段统计', hint: '看不同分段的人数密度和迁移趋势。' },
                { id: 'correlation-analysis', icon: 'ti-topology-star-3', text: '学科关联度分析', hint: '判断学科间的联动和迁移机会。' },
                { id: 'report-generator', icon: 'ti-certificate', text: '成绩单/家长查分', hint: '生成面向学生与家长的成绩反馈出口。' }
            ]
        },
        ai: {
            title: 'AI分析',
            color: '#f97316',
            icon: 'ti-brain',
            eyebrow: 'Creator Lab',
            summary: '把分析需求像创作者提示词一样快速转成报告、诊断和批量动作。',
            items: [
                { id: 'ai-analysis', icon: 'ti-sparkles', text: 'AI工作台', hint: '集中处理提问、诊断、总结和批量分析任务。' }
            ]
        },
        tools: {
            title: '考务工具',
            color: '#7c3aed',
            icon: 'ti-briefcase',
            eyebrow: 'Ops Toolkit',
            summary: '把排考、分班、排课和协作工具收进一套执行工具箱。',
            items: [
                { id: 'exam-arranger', icon: 'ti-id-badge-2', text: '智能考场编排', hint: '生成更稳妥的考场、监考与座位安排。' },
                { id: 'freshman-simulator', icon: 'ti-arrows-split', text: '新生均衡分班', hint: '快速模拟均衡分班方案并对比结果。' },
                { id: 'grade-scheduler', icon: 'ti-calendar-time', text: '级部智能排课', hint: '协同安排课程资源和排课节奏。' },
                { id: 'seat-adjustment', icon: 'ti-armchair', text: '考后排座/互助组', hint: '考试后按策略重新排座和组织互助。' },
                { id: 'mutual-aid', icon: 'ti-friends', text: '学科小老师分组', hint: '按学科优势自动形成互助学习小组。' }
            ]
        }
    };

    const ROLE_LABELS = {
        admin: '管理员',
        director: '教务主任',
        grade_director: '级部主任',
        class_teacher: '班主任',
        teacher: '任课教师',
        parent: '家长',
        guest: '访客'
    };

    let currentCategory = 'data';

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
        const role = resolveUserRoleKey();
        return category.items.filter((item) => {
            if ((role === 'teacher' || role === 'class_teacher')
                && typeof canAccessModule === 'function'
                && !canAccessModule(item.id)) {
                return false;
            }
            if (role === 'teacher' && ['single-school-eval', 'exam-arranger', 'freshman-simulator'].includes(item.id)) {
                return false;
            }
            if (item.id === 'report-generator' && typeof CONFIG !== 'undefined' && !CONFIG.showQuery) {
                return false;
            }
            return true;
        });
    }

    function resolveCategoryState() {
        const role = resolveUserRoleKey();
        const restrictedRoles = ['teacher', 'class_teacher'];
        const isRestricted = restrictedRoles.includes(role);
        const isTeacherRole = role === 'teacher' || role === 'class_teacher';

        if (isRestricted && (currentCategory === 'data' || currentCategory === 'tools')) {
            currentCategory = 'town';
        }
        if (isTeacherRole && currentCategory === 'town') {
            currentCategory = 'class';
        }
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

    function updateShellChrome(activeId) {
        resolveCategoryState();
        const category = NAV_STRUCTURE[currentCategory] || NAV_STRUCTURE.data;
        if (!category) return;

        applyCategoryAccent(category);

        const visibleItems = resolveVisibleItems(category);
        const fallbackItem = visibleItems[0] || category.items[0] || null;
        const resolvedActive = findItemById(activeId || getActiveSectionId());
        const activeItem = (resolvedActive && resolvedActive.categoryKey === currentCategory)
            ? resolvedActive.item
            : fallbackItem;

        const activeTitle = activeItem ? activeItem.text : category.title;
        const activeHint = activeItem ? activeItem.hint : category.summary;
        const subtitle = activeItem ? `${category.title} / ${activeItem.text}` : `${category.title} / 模块导航`;

        const appSubtitle = document.getElementById('app-subtitle');
        if (appSubtitle) appSubtitle.textContent = subtitle;

        const currentTitle = document.getElementById('shell-current-title');
        if (currentTitle) currentTitle.textContent = activeTitle;

        const currentDesc = document.getElementById('shell-current-desc');
        if (currentDesc) currentDesc.textContent = activeHint || category.summary;

        const categoryKicker = document.getElementById('shell-category-kicker');
        if (categoryKicker) categoryKicker.textContent = category.eyebrow;

        const categoryTitle = document.getElementById('shell-category-title');
        if (categoryTitle) categoryTitle.textContent = category.title;

        const categoryDesc = document.getElementById('shell-category-desc');
        if (categoryDesc) categoryDesc.textContent = category.summary;

        const moduleCount = document.getElementById('shell-module-count');
        if (moduleCount) moduleCount.textContent = `${visibleItems.length} 个模块`;

        const cohortSelector = document.getElementById('cohort-selector');
        const cohortChip = document.getElementById('shell-cohort-chip');
        if (cohortChip) {
            const selectedText = cohortSelector && cohortSelector.selectedIndex >= 0
                ? String(cohortSelector.options[cohortSelector.selectedIndex].text || '').trim()
                : '';
            cohortChip.textContent = selectedText || '届别未选择';
        }

        const modeChip = document.getElementById('shell-mode-chip');
        if (modeChip) {
            const modeBadge = document.getElementById('mode-badge');
            const modeText = modeBadge ? String(modeBadge.textContent || '').trim() : '';
            modeChip.textContent = modeText ? `${modeText} 模式` : '模式待加载';
        }

        const roleText = `角色：${resolveRoleLabel()}`;
        const roleHint = document.getElementById('role-hint-sidebar');
        if (roleHint) roleHint.textContent = roleText;

        const rolePill = document.getElementById('shell-role-pill');
        if (rolePill) rolePill.textContent = roleText;

        const activeModule = document.getElementById('shell-active-module');
        if (activeModule) activeModule.textContent = activeTitle;

        const activeHintEl = document.getElementById('shell-active-hint');
        if (activeHintEl) activeHintEl.textContent = activeHint || category.summary;
    }

    function renderNavigation() {
        const sidebarNav = document.getElementById('sidebar-nav');
        if (!sidebarNav) return;

        resolveCategoryState();
        sidebarNav.innerHTML = '';

        const role = resolveUserRoleKey();
        const restrictedRoles = ['teacher', 'class_teacher'];
        const isRestricted = restrictedRoles.includes(role);
        const isTeacherRole = role === 'teacher' || role === 'class_teacher';

        Object.keys(NAV_STRUCTURE).forEach((key) => {
            const category = NAV_STRUCTURE[key];
            if (isRestricted && (key === 'data' || key === 'tools')) return;
            if (isTeacherRole && key === 'town') return;

            const visibleItems = resolveVisibleItems(category);
            const item = document.createElement('div');
            item.className = 'sidebar-menu-item';
            if (key === currentCategory) item.classList.add('active');
            item.title = category.title;
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
                        <span class="sidebar-menu-item__meta">${visibleItems.length} 个模块 · ${category.eyebrow}</span>
                    </span>
                </div>
                <span class="sidebar-menu-item__count">${visibleItems.length}</span>
            `;

            item.onclick = function (event) {
                event.stopPropagation();
                if (currentCategory !== key) {
                    switchCategory(key);
                } else {
                    updateShellChrome();
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
    }

    function renderSubNavigation() {
        const subNavContainer = document.getElementById('sub-nav-container');
        if (!subNavContainer) return;

        subNavContainer.innerHTML = '';
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
            card.style.setProperty('--nav-accent', category.color);
            card.style.setProperty('--accent-soft', toSoftColor(category.color, 0.10));

            if (item.id === activeSectionId) {
                card.classList.add('active');
            }

            const orderLabel = `${String(index + 1).padStart(2, '0')} · ${category.eyebrow}`;
            card.innerHTML = `
                <span class="shell-story-card__icon">
                    <i class="ti ${item.icon}"></i>
                </span>
                <span class="shell-story-card__body">
                    <span class="shell-story-card__meta">${orderLabel}</span>
                    <span class="shell-story-card__title">${item.text}</span>
                    <span class="shell-story-card__desc">${item.hint}</span>
                </span>
                <i class="ti ti-chevron-right shell-story-card__chevron"></i>
            `;

            card.onclick = function (event) {
                event.stopPropagation();
                document.documentElement.style.setProperty('--primary', category.color);
                if (typeof switchTab === 'function') switchTab(item.id);
                renderSubNavigation();
                updateShellChrome(item.id);
            };

            subNavContainer.appendChild(card);
        });

        setTimeout(function () {
            const hasActiveSection = document.querySelector('.section.active');
            const firstCard = subNavContainer.querySelector('.shell-story-card');
            if (!hasActiveSection && firstCard) {
                firstCard.click();
            }
        }, 100);

        updateShellChrome(activeSectionId);
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
            const subNavContainer = document.getElementById('sub-nav-container');
            const firstCard = subNavContainer ? subNavContainer.querySelector('.shell-story-card') : null;
            if (firstCard) firstCard.click();
        }, 50);
    }

    window.NAV_STRUCTURE = NAV_STRUCTURE;
    window.renderNavigation = renderNavigation;
    window.renderSubNavigation = renderSubNavigation;
    window.switchNavCategory = switchCategory;
    window.getCurrentNavCategory = function () { return currentCategory; };
    window.setCurrentNavCategorySilently = function (key) {
        if (!NAV_STRUCTURE[key]) return;
        currentCategory = key;
        applyCategoryAccent(NAV_STRUCTURE[key]);
    };
    window.syncShellChrome = updateShellChrome;

    document.addEventListener('DOMContentLoaded', function () {
        updateShellChrome();
    });
})();
