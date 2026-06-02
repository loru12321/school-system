(() => {
    if (typeof window === 'undefined' || window.TeachingManagementModulesRuntime) return;

    const MODULE_GROUPS = {
        portrait: ['teacher-analysis'],
        detail: ['teacher-detail-comparison'],
        pairing: ['teacher-pairing'],
        township: ['teacher-township-ranking']
    };

    const MODULE_META = {
        'teacher-detail-comparison': {
            title: '教师教学详细数据对比表',
            icon: 'ti-table',
            desc: '独立查看教师明细指标、校内排序和导出结果。'
        },
        'teacher-pairing': {
            title: '校内教师结对子建议',
            icon: 'ti-users-group',
            desc: '基于数据分析生成同校教师互助建议。'
        },
        'teacher-township-ranking': {
            title: '教师乡镇排名',
            icon: 'ti-trophy',
            desc: '查看本校教师在镇域同学科中的相对站位。'
        }
    };

    const SUBMODULE_IDS = Object.keys(MODULE_META);

    function getGroupForModule(id) {
        const moduleId = String(id || '').trim();
        return Object.entries(MODULE_GROUPS).find(([, ids]) => ids.includes(moduleId))?.[0] || 'portrait';
    }

    function markActiveGroup(id) {
        const group = getGroupForModule(id);
        document.body.dataset.teachingManagementGroup = group;
        return group;
    }

    function escapeHtml(value) {
        return String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[char]));
    }

    function buildSection(id) {
        const meta = MODULE_META[id];
        const section = document.createElement('div');
        section.id = id;
        section.className = 'section card-box analysis-workspace analysis-workspace-teacher analysis-workspace-management';
        section.dataset.teachingTeacherSubmodule = 'true';
        section.innerHTML = `
            <div class="module-desc-bar analysis-hero" style="border-color:#dc2626;">
                <h3><i class="ti ${escapeHtml(meta.icon)}"></i> ${escapeHtml(meta.title)}</h3>
                <p>${escapeHtml(meta.desc)}</p>
                <div class="analysis-actions">
                    <button type="button" class="btn btn-secondary" onclick="switchTab('teacher-analysis')">回到教师概况</button>
                </div>
            </div>
            <div class="sec-head analysis-shell-head">
                <h2><i class="ti ${escapeHtml(meta.icon)}"></i> ${escapeHtml(meta.title)}</h2>
            </div>
            <div id="${id}-slot" class="analysis-content-stack">
                <div class="analysis-empty-state">正在加载${escapeHtml(meta.title)}...</div>
            </div>
        `;
        return section;
    }

    function findAnchor() {
        return document.getElementById('teacher-analysis') || document.querySelector('.section');
    }

    function ensureTeachingManagementSections() {
        const anchor = findAnchor();
        if (!anchor || !anchor.parentNode) return false;
        let previous = anchor;
        SUBMODULE_IDS.forEach((id) => {
            let section = document.getElementById(id);
            if (!section) {
                section = buildSection(id);
                previous.parentNode.insertBefore(section, previous.nextSibling);
            }
            previous = section;
        });
        return true;
    }

    function moveNodeToSlot(node, slotId) {
        const slot = document.getElementById(slotId);
        if (!node || !slot) return false;
        if (node.parentElement === slot) return true;
        slot.innerHTML = '';
        slot.appendChild(node);
        return true;
    }

    function removeTeacherAnalysisOldNavigation() {
        const teacherSection = document.getElementById('teacher-analysis');
        if (!teacherSection || teacherSection.dataset.teacherSubmodulesCleaned === '1') return;
        teacherSection.dataset.teacherSubmodulesCleaned = '1';
        teacherSection.querySelector('.side-nav.analysis-side-nav')?.remove();
        teacherSection.querySelector('.analysis-flow-banner')?.remove();
        const desc = teacherSection.querySelector('.module-desc-bar p:nth-of-type(2)');
        if (desc) desc.innerHTML = '<strong>推荐顺序：</strong>先同步任课表，在本模块查看教师概况；明细表、结对子建议和乡镇排名请从教学管理子模块进入。';
        teacherSection.querySelectorAll('.analysis-scan-item').forEach((item) => {
            if (String(item.textContent || '').includes('多期')) item.remove();
        });
    }

    function relocateTeacherBlocks() {
        ensureTeachingManagementSections();
        const teacherSection = document.getElementById('teacher-analysis');
        if (!teacherSection || teacherSection.dataset.lazySectionPlaceholder === '1') return false;

        removeTeacherAnalysisOldNavigation();
        const contentArea = teacherSection.querySelector('.analysis-content-stack');
        const resultsLayout = teacherSection.querySelector('.analysis-results-layout-teacher');
        if (resultsLayout && contentArea && resultsLayout.parentElement !== teacherSection) {
            teacherSection.appendChild(contentArea);
            resultsLayout.remove();
        }

        moveNodeToSlot(document.getElementById('anchor-detail'), 'teacher-detail-comparison-slot');
        moveNodeToSlot(document.getElementById('anchor-pair'), 'teacher-pairing-slot');
        moveNodeToSlot(document.querySelector('.analysis-ranking-panel'), 'teacher-township-ranking-slot');

        if (typeof window.refreshResponsiveMobileTables === 'function') {
            SUBMODULE_IDS.forEach((id) => window.refreshResponsiveMobileTables(document.getElementById(id)));
        }
        if (typeof window.applyRoleAllowVisibility === 'function') window.applyRoleAllowVisibility(document);
        return true;
    }

    function ensureTeacherAnalysisLoaded() {
        if (typeof window.ensureLazySectionLoaded === 'function') {
            window.ensureLazySectionLoaded('teacher-analysis');
        }
        relocateTeacherBlocks();
    }

    function refreshTeachingManagementAfterSwitch(moduleId) {
        markActiveGroup(moduleId);
        ensureTeacherAnalysisLoaded();
        if (typeof window.tmRenderTeachingModuleStateBars === 'function') {
            window.tmRenderTeachingModuleStateBars(moduleId === 'teacher-analysis' ? 'teacher-analysis' : '');
        }
        const renderers = {
            'teacher-detail-comparison': window.renderTeacherComparisonTable,
            'teacher-pairing': window.generateTeacherPairing,
            'teacher-township-ranking': window.renderTeacherTownshipRanking
        };
        const renderer = renderers[moduleId];
        if (typeof renderer === 'function') {
            window.setTimeout(() => {
                relocateTeacherBlocks();
                renderer();
            }, 80);
        }
    }

    function install() {
        ensureTeachingManagementSections();
        if (window.__TEACHING_MANAGEMENT_MODULES_INSTALLED__) return;
        window.__TEACHING_MANAGEMENT_MODULES_INSTALLED__ = true;
        const originalSwitchTab = window.switchTab;
        if (typeof originalSwitchTab === 'function') {
            window.switchTab = function patchedTeachingSwitchTab(id, ...rest) {
                const moduleId = String(id || '').trim();
                ensureTeachingManagementSections();
                const result = originalSwitchTab.call(this, id, ...rest);
                if (moduleId === 'teacher-analysis' || MODULE_META[moduleId]) {
                    refreshTeachingManagementAfterSwitch(moduleId);
                }
                return result;
            };
        }
        document.addEventListener('lazy-section-loaded', relocateTeacherBlocks);
        window.setTimeout(relocateTeacherBlocks, 300);
    }

    window.TeachingManagementModulesRuntime = {
        MODULE_GROUPS,
        getGroupForModule,
        markActiveGroup,
        ensureTeachingManagementSections,
        relocateTeacherBlocks,
        install
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install, { once: true });
    } else {
        install();
    }
})();
