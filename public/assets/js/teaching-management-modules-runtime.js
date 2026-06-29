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

    function findTeacherTownshipRankingPanel() {
        const slot = document.getElementById('teacher-township-ranking-slot');
        const panels = Array.from(document.querySelectorAll('.analysis-ranking-panel'));
        return panels.find((panel) => (
            !panel.classList.contains('teacher-split-placeholder')
            && panel.querySelector('#teacher-township-ranking-container')
        )) || panels.find((panel) => (
            panel.parentElement === slot
            && panel.querySelector('#teacher-township-ranking-container')
        )) || null;
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
        moveNodeToSlot(findTeacherTownshipRankingPanel(), 'teacher-township-ranking-slot');
        ensureTeacherAnalysisSplitPlaceholder(teacherSection);

        if (typeof window.refreshResponsiveMobileTables === 'function') {
            SUBMODULE_IDS.forEach((id) => window.refreshResponsiveMobileTables(document.getElementById(id)));
        }
        if (typeof window.applyRoleAllowVisibility === 'function') window.applyRoleAllowVisibility(document);
        return true;
    }

    function ensureTeacherTownshipRankingSlotReady(attempt = 0) {
        const relocated = relocateTeacherBlocks();
        const slot = document.getElementById('teacher-township-ranking-slot');
        const panel = slot?.querySelector('.analysis-ranking-panel');
        const container = panel?.querySelector('#teacher-township-ranking-container');
        if (relocated && panel && container && !panel.classList.contains('teacher-split-placeholder')) {
            container.hidden = false;
            container.style.display = 'block';
            return true;
        }
        if (attempt >= 8) return false;
        window.setTimeout(() => ensureTeacherTownshipRankingSlotReady(attempt + 1), 120);
        return false;
    }

    function ensureTeacherAnalysisSplitPlaceholder(teacherSection) {
        if (!teacherSection || teacherSection.querySelector('.analysis-ranking-panel')) return;
        const contentArea = teacherSection.querySelector('.analysis-content-stack') || teacherSection;
        const placeholder = document.createElement('div');
        placeholder.className = 'analysis-anchor-panel analysis-ranking-panel teacher-split-placeholder';
        const needsRankingContainer = !document.getElementById('teacher-township-ranking-container');
        placeholder.innerHTML = `
            <div class="analysis-section-head">
                <span>教师乡镇排名已拆分为独立子模块</span>
                <button type="button" class="btn btn-secondary" onclick="switchTab('teacher-township-ranking')">打开乡镇排名</button>
            </div>
            ${needsRankingContainer ? '<div id="teacher-township-ranking-container" hidden></div>' : ''}
            <div class="analysis-generated-note">教师画像页只保留概况入口，完整乡镇排名、导出和快速学科定位请进入“教师乡镇排名”子模块。</div>
        `;
        contentArea.appendChild(placeholder);
    }

    function ensureTeacherAnalysisLoaded() {
        let loaded = null;
        if (typeof window.ensureLazySectionLoaded === 'function') {
            loaded = window.ensureLazySectionLoaded('teacher-analysis');
        }
        relocateTeacherBlocks();
        return loaded || document.getElementById('teacher-analysis') || null;
    }

    function refreshTeacherAnalysisPortrait() {
        const section = ensureTeacherAnalysisLoaded();
        if (!section || section.dataset.lazySectionPlaceholder === '1') return false;

        if (typeof window.syncTeacherAnalysisSchoolContext === 'function') {
            window.syncTeacherAnalysisSchoolContext();
        }
        if (typeof window.hydrateTeacherDataStore === 'function') {
            window.hydrateTeacherDataStore();
        } else if (typeof window.ensureTeacherDataStore === 'function') {
            window.ensureTeacherDataStore();
        }

        if (typeof window.renderTeacherAnalysisState === 'function') {
            window.renderTeacherAnalysisState();
        } else if (typeof window.analyzeTeachers === 'function') {
            window.analyzeTeachers();
        }
        if (typeof window.renderTeacherCards === 'function') {
            window.renderTeacherCards();
        }
        if (typeof window.updateTeacherMultiExamSelects === 'function') {
            window.updateTeacherMultiExamSelects();
        }
        if (typeof window.updateTeacherCompareTeacherSelect === 'function') {
            window.updateTeacherCompareTeacherSelect();
        }
        if (typeof window.applyRoleAllowVisibility === 'function') {
            window.applyRoleAllowVisibility(section);
        }
        return true;
    }

    function refreshTeachingManagementAfterSwitch(moduleId) {
        markActiveGroup(moduleId);
        ensureTeacherAnalysisLoaded();
        if (typeof window.tmRenderTeachingModuleStateBars === 'function') {
            window.tmRenderTeachingModuleStateBars(moduleId === 'teacher-analysis' ? 'teacher-analysis' : '');
        }
        if (moduleId === 'teacher-analysis') {
            window.setTimeout(refreshTeacherAnalysisPortrait, 80);
            window.setTimeout(refreshTeacherAnalysisPortrait, 260);
            return;
        }
        const renderers = {
            'teacher-detail-comparison': window.renderTeacherComparisonTable,
            'teacher-pairing': window.generateTeacherPairing,
            'teacher-township-ranking': window.renderTeacherTownshipRanking
        };
        const renderer = renderers[moduleId];
        if (typeof renderer === 'function') {
            window.setTimeout(() => {
                if (moduleId === 'teacher-township-ranking') {
                    ensureTeacherTownshipRankingSlotReady();
                } else {
                    relocateTeacherBlocks();
                }
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
                if (MODULE_META[moduleId]) {
                    ensureTeacherAnalysisLoaded();
                }
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
        ensureTeacherTownshipRankingSlotReady,
        refreshTeacherAnalysisPortrait,
        install
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', install, { once: true });
    } else {
        install();
    }
})();
