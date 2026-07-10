// data-manager-core-runtime.js — DataManager object (extracted from app.js)
const DataManager = {
    init: function () {
        window.DataManager = this;
    },
    currentTab: 'student', // student | teacher | archive | params | targets
    cloudPanelView: 'list',
    pagination: { page: 1, size: 50, total: 0 },
    cloudSelection: new Set(),
    cloudBackupRows: new Map(),
    studentSelection: new Set(),
    examBatchSelection: new Set(),
    examBatchHydratedCohorts: new Set(),

    isGrade9Context: function () {
        const meta = (typeof getExamMetaFromUI === 'function') ? getExamMetaFromUI() : null;
        if (meta && String(meta.grade || '') === '9') return true;
        if (window.CONFIG && String(CONFIG.name || '').includes('9')) return true;
        return false;
    },

    getGrade9TemplateKey: function (type) {
        const cohortId = CURRENT_COHORT_ID || readWorkspaceCohortId() || 'GLOBAL';
        return `GRADE9_${type}_${cohortId}`;
    },

    restoreGrade9IndicatorTemplate: function () {
        if (!this.isGrade9Context()) return false;
        try {
            const raw = localStorage.getItem(this.getGrade9TemplateKey('INDICATOR'));
            if (!raw) return false;
            const saved = JSON.parse(raw);
            if (!saved || (!saved.ind1 && !saved.ind2 && !saved.highSchoolLine)) return false;
            const current = readIndicatorState();
            setIndicatorState({ ind1: saved.ind1 || '', ind2: saved.ind2 || '', highSchoolLine: saved.highSchoolLine || current.highSchoolLine || '' });
            const main1 = document.getElementById('ind1');
            const main2 = document.getElementById('ind2');
            const highSchoolLineInput = document.getElementById('dm_high_school_line_input');
            if (main1 && !main1.value) main1.value = saved.ind1 || '';
            if (main2 && !main2.value) main2.value = saved.ind2 || '';
            if (highSchoolLineInput && !highSchoolLineInput.value) highSchoolLineInput.value = saved.highSchoolLine || '';
            return true;
        } catch (e) {
            return false;
        }
    },

    persistGrade9IndicatorTemplate: function () {
        if (!this.isGrade9Context()) return;
        const ind = readIndicatorState();
        const payload = { ind1: ind.ind1 || '', ind2: ind.ind2 || '', highSchoolLine: ind.highSchoolLine || '' };
        if (!payload.ind1 && !payload.ind2 && !payload.highSchoolLine) return;
        localStorage.setItem(this.getGrade9TemplateKey('INDICATOR'), JSON.stringify(payload));
    },

    restoreGrade9TargetsTemplate: function () {
        if (!this.isGrade9Context()) return false;
        try {
            const raw = localStorage.getItem(this.getGrade9TemplateKey('TARGETS'));
            if (!raw) return false;
            const saved = JSON.parse(raw);
            if (!saved || !Object.keys(saved).length) return false;
            setTargetsState(saved);
            return true;
        } catch (e) {
            return false;
        }
    },

    persistGrade9TargetsTemplate: function () {
        if (!this.isGrade9Context()) return;
        const targets = readTargetsState();
        const key = this.getGrade9TemplateKey('TARGETS');
        if (!Object.keys(targets).length) {
            localStorage.removeItem(key);
            return;
        }
        localStorage.setItem(key, JSON.stringify(targets));
    },

    open: function (initialTab = 'student') {
        const user = Auth.currentUser;
        if (!user) return alert("请先登录");
        if (user.role !== 'admin' && user.role !== 'director') {
            return alert("⛔ 权限不足：只有管理员或教务主任可操作底层数据。");
        }

        document.getElementById('data-manager-modal').style.display = 'flex';
        this.decorateLayout();
        this.switchTab(initialTab || 'student');
        if ((initialTab || 'student') !== 'cloud' && typeof this.syncSchoolAliasSettingsFromGateway === 'function') {
            this.syncSchoolAliasSettingsFromGateway().catch(err => {
                console.warn('[EdgeGateway] school alias refresh skipped:', err?.message || err);
            });
        }
    },

    ensureCloudManagerModal: function () {
        let modal = document.getElementById('cloud-manager-modal');
        if (modal) return modal;
        modal = document.createElement('div');
        modal.id = 'cloud-manager-modal';
        modal.className = 'modal';
        modal.setAttribute('data-mojibake-skip', 'true');
        modal.style.display = 'none';
        modal.innerHTML = `
            <div class="modal-content" data-mojibake-skip="true" style="width:min(1120px,96vw); height:min(86vh,820px); padding:18px; border-radius:18px; display:flex; flex-direction:column; overflow:hidden;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:12px;">
                    <div>
                        <h3 style="margin:0; display:flex; align-items:center; gap:8px;"><i class="ti ti-cloud-data-connection"></i> 云端数据</h3>
                        <div style="margin-top:4px; font-size:12px; color:#64748b;">只加载云端存档清单，不进入底层数据管理页。</div>
                    </div>
                    <button type="button" class="btn btn-sm btn-gray" onclick="DataManager.closeCloudManager()" title="关闭">
                        <i class="ti ti-x"></i>
                    </button>
                </div>
                <div id="cloud-manager-body" style="flex:1; min-height:0; display:flex; flex-direction:column; overflow:hidden;"></div>
            </div>
        `;
        document.body.appendChild(modal);
        modal.addEventListener('click', (event) => {
            if (event.target === modal) this.closeCloudManager();
        });
        return modal;
    },

    mountCloudAreaInCloudManager: function () {
        const cloudArea = document.getElementById('dm-cloud-area');
        const body = document.getElementById('cloud-manager-body');
        if (!cloudArea || !body) return false;
        if (!this.cloudAreaHome) {
            const placeholder = document.createComment('dm-cloud-area-home');
            cloudArea.parentNode?.insertBefore(placeholder, cloudArea);
            this.cloudAreaHome = placeholder;
        }
        if (cloudArea.parentElement !== body) body.appendChild(cloudArea);
        cloudArea.style.display = 'flex';
        cloudArea.style.padding = '0';
        cloudArea.style.height = '100%';
        cloudArea.setAttribute('data-mojibake-skip', 'true');
        return true;
    },

    openCloudManager: function () {
        const user = Auth.currentUser;
        if (!user) return alert("请先登录");
        if (user.role !== 'admin' && user.role !== 'director') {
            return alert("⛔ 权限不足：只有管理员或教务主任可操作云端数据。");
        }
        // Show the modal FIRST, before any step that could throw (mount/render).
        // A silent early-return here used to leave the click with no visible
        // effect ("云端数据 点击无反应"); now the dialog always appears and any
        // failure downstream is surfaced inside it instead of swallowed.
        const modal = this.ensureCloudManagerModal();
        modal.style.display = 'flex';
        this.currentTab = 'cloud';
        this.cloudPanelView = 'list';
        const mounted = this.mountCloudAreaInCloudManager();
        if (!mounted) {
            const body = document.getElementById('cloud-manager-body');
            if (body) {
                body.innerHTML = '<div style="padding:24px; text-align:center; color:#64748b;">'
                    + '云端数据面板正在初始化，请关闭后重试。</div>';
            }
            return;
        }
        // Defer the (network-bound) list render off the click stack so the modal
        // paints immediately and the button stays actionable.
        window.setTimeout(() => {
            if (this.currentTab !== 'cloud') return;
            Promise.resolve()
                .then(() => this.renderCloudBackups())
                .catch((err) => console.warn('[CloudManager] renderCloudBackups failed:', err));
        }, 0);
    },

    closeCloudManager: function () {
        const modal = document.getElementById('cloud-manager-modal');
        if (modal) modal.style.display = 'none';
        const cloudArea = document.getElementById('dm-cloud-area');
        if (cloudArea && this.cloudAreaHome && this.cloudAreaHome.parentNode && cloudArea.parentElement !== this.cloudAreaHome.parentNode) {
            this.cloudAreaHome.parentNode.insertBefore(cloudArea, this.cloudAreaHome.nextSibling);
            cloudArea.style.display = 'none';
            cloudArea.style.padding = '15px';
        }
        if (this.currentTab === 'cloud') this.currentTab = 'student';
    },

    ensureCloudPanelSwitch: function () {
        const modal = document.getElementById('data-manager-modal');
        const content = modal?.querySelector('.modal-content');
        const tabContainer = document.getElementById('tab-data-stu')?.parentElement;
        if (!content || !tabContainer) return null;

        let switcher = document.getElementById('dm-cloud-panel-switch');
        if (!switcher) {
            switcher = document.createElement('div');
            switcher.id = 'dm-cloud-panel-switch';
            switcher.style.display = 'none';
            switcher.style.marginBottom = '14px';
            switcher.style.padding = '6px';
            switcher.style.border = '1px solid #e2e8f0';
            switcher.style.borderRadius = '16px';
            switcher.style.background = '#f8fafc';
            switcher.style.gap = '8px';
            switcher.style.alignItems = 'center';
            switcher.style.justifyContent = 'space-between';
            switcher.style.flexWrap = 'wrap';
            switcher.innerHTML = `
                <div style="font-size:12px; color:#64748b; padding:0 6px;">左右点击切换显示区域</div>
                <div style="display:flex; gap:8px; flex:1; min-width:260px;">
                    <button type="button" id="dm-cloud-view-overview" onclick="DataManager.setCloudPanelView('overview')"
                        style="flex:1; border:none; border-radius:12px; padding:10px 14px; cursor:pointer; font-weight:700; background:#ffffff; color:#334155;">
                        ① 左侧显示概览
                    </button>
                    <button type="button" id="dm-cloud-view-list" onclick="DataManager.setCloudPanelView('list')"
                        style="flex:1; border:none; border-radius:12px; padding:10px 14px; cursor:pointer; font-weight:700; background:#ffffff; color:#334155;">
                        ② 右侧显示存档
                    </button>
                </div>
            `;
        }

        if (switcher.parentElement !== content) {
            content.insertBefore(switcher, tabContainer.nextSibling);
        }
        return switcher;
    },

    setCloudPanelView: function (view) {
        this.cloudPanelView = view === 'overview' ? 'overview' : 'list';
        this.updateCloudPanelView();
    },

    updateCloudPanelView: function () {
        const workflow = document.getElementById('dm-workflow-strip');
        const statusOverview = document.getElementById('dm-status-overview');
        const cloudArea = document.getElementById('dm-cloud-area');
        const isCloudTab = this.currentTab === 'cloud';
        const isExamBatchTab = this.currentTab === 'exams';
        const existingSwitcher = document.getElementById('dm-cloud-view-switcher');

        if (!isCloudTab) {
            if (existingSwitcher) existingSwitcher.style.display = 'none';
            if (isExamBatchTab) {
                if (workflow) workflow.style.display = 'none';
                if (statusOverview) statusOverview.style.display = 'none';
                if (cloudArea) cloudArea.style.display = 'none';
                return;
            }
            if (workflow) workflow.style.display = 'flex';
            if (statusOverview) statusOverview.style.display = 'block';
            if (cloudArea) cloudArea.style.display = 'none';
            return;
        }

        const switcher = this.ensureCloudPanelSwitch();
        const overviewBtn = document.getElementById('dm-cloud-view-overview');
        const listBtn = document.getElementById('dm-cloud-view-list');
        if (switcher) switcher.style.display = 'flex';

        const showOverview = this.cloudPanelView === 'overview';
        if (workflow) workflow.style.display = showOverview ? 'flex' : 'none';
        if (statusOverview) statusOverview.style.display = showOverview ? 'block' : 'none';
        if (cloudArea) cloudArea.style.display = showOverview ? 'none' : 'flex';

        const activeStyle = {
            background: 'linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%)',
            color: '#ffffff',
            boxShadow: '0 10px 24px rgba(37,99,235,0.18)'
        };
        const idleStyle = {
            background: '#ffffff',
            color: '#334155',
            boxShadow: 'none'
        };
        [overviewBtn, listBtn].forEach(btn => {
            if (!btn) return;
            btn.style.transition = 'all 0.2s ease';
        });
        if (overviewBtn) Object.assign(overviewBtn.style, showOverview ? activeStyle : idleStyle);
        if (listBtn) Object.assign(listBtn.style, showOverview ? idleStyle : activeStyle);
    },

    scheduleDataManagerStatusRender: function (options = {}) {
        const run = () => {
            if (this && typeof this.renderDataManagerStatus === 'function') {
                this.renderDataManagerStatus();
            }
        };
        if (options && options.immediate) {
            run();
            return;
        }
        const delay = Number.isFinite(Number(options.delay)) ? Number(options.delay) : 80;
        const timeout = Number.isFinite(Number(options.timeout)) ? Number(options.timeout) : 1200;
        if (window.SystemPerformance && typeof window.SystemPerformance.scheduleTask === 'function') {
            window.SystemPerformance.scheduleTask('data-manager-status-render', run, {
                delay,
                idle: true,
                timeout
            });
            return;
        }
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(run, { timeout });
            return;
        }
        window.setTimeout(run, delay);
    },

    decorateLayout: function () {
        const modal = document.getElementById('data-manager-modal');
        const content = modal?.querySelector('.modal-content');
        if (!content) return;
        modal.setAttribute('data-mojibake-skip', 'true');
        content.setAttribute('data-mojibake-skip', 'true');
        if (content.dataset.dmLayoutDecorated === '1') {
            this.ensureCloudPanelSwitch();
            return;
        }

        content.style.width = 'min(1480px, 96vw)';
        content.style.maxWidth = '1480px';
        content.style.height = 'min(92vh, 960px)';
        content.style.padding = '22px 24px 18px';
        content.style.borderRadius = '22px';

        const tabContainer = document.getElementById('tab-data-stu')?.parentElement;
        const statusOverview = document.getElementById('dm-status-overview');
        const searchBar = document.getElementById('dm-search-bar');
        const saveBtn = content.querySelector('button[onclick="DataManager.saveAndSync()"]');
        const closeBtn = Array.from(content.querySelectorAll('button'))
            .find(btn => String(btn.getAttribute('onclick') || '').includes('data-manager-modal'));
        const legacyHeader = saveBtn?.parentElement?.parentElement;

        if (tabContainer) {
            tabContainer.id = 'dm-tab-strip';
            tabContainer.setAttribute('role', 'tablist');
            tabContainer.setAttribute('aria-label', '数据管理模块切换');
        }

        if (legacyHeader) {
            legacyHeader.style.display = 'flex';
            legacyHeader.style.justifyContent = 'space-between';
            legacyHeader.style.alignItems = 'flex-start';
            legacyHeader.style.gap = '18px';
            legacyHeader.style.flexWrap = 'wrap';
            legacyHeader.style.borderBottom = '1px solid #e2e8f0';
            legacyHeader.style.paddingBottom = '14px';
            legacyHeader.style.marginBottom = '14px';

            legacyHeader.querySelectorAll('h3').forEach(el => {
                el.style.display = 'none';
            });

            const buttonGroup = saveBtn?.parentElement;
            if (buttonGroup) {
                buttonGroup.style.display = 'flex';
                buttonGroup.style.gap = '10px';
                buttonGroup.style.alignItems = 'center';
            }

            if (saveBtn) {
                saveBtn.style.padding = '10px 16px';
                saveBtn.style.borderRadius = '12px';
            }
            if (closeBtn) {
                closeBtn.style.border = 'none';
                closeBtn.style.background = '#f8fafc';
                closeBtn.style.color = '#475569';
                closeBtn.style.width = '40px';
                closeBtn.style.height = '40px';
                closeBtn.style.borderRadius = '12px';
                closeBtn.style.fontSize = '24px';
                closeBtn.style.cursor = 'pointer';
            }

            let intro = document.getElementById('dm-layout-intro');
            if (!intro) {
                intro = document.createElement('div');
                intro.id = 'dm-layout-intro';
            }
            intro.innerHTML = `
                <div style="display:flex; gap:14px; align-items:flex-start;">
                    <div style="width:46px; height:46px; border-radius:14px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%); color:#1d4ed8; box-shadow:0 10px 24px rgba(59,130,246,0.14);">
                        <i class="ti ti-cloud-cog" style="font-size:22px;"></i>
                    </div>
                    <div>
                        <div style="color:#0f172a; font-size:24px; font-weight:800; line-height:1.2;">云端教务数据综合控制台</div>
                        <div style="margin-top:6px; font-size:12px; color:#64748b; line-height:1.7;">
                            建议顺序：导入成绩 -> 任课/目标人数 -> 设置指标参数 -> 保存并同步云端
                        </div>
                    </div>
                </div>
            `;
            if (buttonGroup) legacyHeader.insertBefore(intro, buttonGroup);
        }

        if (statusOverview && tabContainer && statusOverview.previousElementSibling === tabContainer) {
            content.insertBefore(statusOverview, tabContainer);
        }
        if (statusOverview) {
            statusOverview.style.marginBottom = '14px';
            statusOverview.style.borderRadius = '16px';
        }

        let workflow = document.getElementById('dm-workflow-strip');
        if (!workflow) {
            workflow = document.createElement('div');
            workflow.id = 'dm-workflow-strip';
        }
        workflow.innerHTML = `
            <span style="display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; background:#ecfdf5; color:#166534; font-size:12px; font-weight:700;"><i class="ti ti-file-import"></i> 1. 导入基础数据</span>
            <span style="display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:700;"><i class="ti ti-target-arrow"></i> 2. 配置目标与参数</span>
            <span style="display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; background:#fff7ed; color:#9a3412; font-size:12px; font-weight:700;"><i class="ti ti-cloud-up"></i> 3. 统一保存同步</span>
            <span style="display:inline-flex; align-items:center; gap:6px; padding:5px 10px; border-radius:999px; background:#f8fafc; color:#475569; font-size:12px; font-weight:700;"><i class="ti ti-chart-bar"></i> 4. 返回分析页面使用</span>
        `;
        workflow.style.display = 'flex';
        workflow.style.gap = '8px';
        workflow.style.flexWrap = 'wrap';
        workflow.style.marginBottom = '14px';
        workflow.style.padding = '10px 12px';
        workflow.style.border = '1px solid #e2e8f0';
        workflow.style.borderRadius = '14px';
        workflow.style.background = '#fafcff';

        if (tabContainer) {
            content.insertBefore(workflow, statusOverview || tabContainer);
            tabContainer.style.display = 'flex';
            tabContainer.style.gap = '10px';
            tabContainer.style.marginBottom = '14px';
            tabContainer.style.padding = '6px';
            tabContainer.style.border = '1px solid #e2e8f0';
            tabContainer.style.borderRadius = '14px';
            tabContainer.style.background = '#f8fafc';
            tabContainer.style.flexWrap = 'wrap';
            tabContainer.style.overflowX = 'auto';

            ['tab-data-stu', 'tab-data-exams', 'tab-data-tea', 'tab-data-targets', 'tab-data-params', 'tab-data-cloud', 'tab-data-sql']
                .forEach(id => {
                    const tab = document.getElementById(id);
                    if (tab && tab.parentElement === tabContainer) {
                        tab.style.minWidth = '132px';
                        tab.style.flex = '1 1 132px';
                        tab.style.textAlign = 'center';
                        tab.style.justifyContent = 'center';
                        tabContainer.appendChild(tab);
                    }
                });
        }

        if (searchBar) {
            searchBar.style.background = '#f8fafc';
            searchBar.style.padding = '12px';
            searchBar.style.borderRadius = '12px';
            searchBar.style.border = '1px solid #e2e8f0';
            searchBar.style.marginBottom = '12px';
            searchBar.style.gap = '10px';
            searchBar.style.flexWrap = 'wrap';
            searchBar.style.alignItems = 'center';
            const searchInput = document.getElementById('dm-search-input');
            if (searchInput) {
                searchInput.style.minWidth = '260px';
                searchInput.style.padding = '10px 12px';
                searchInput.style.borderRadius = '10px';
            }
        }

        this.ensureCloudPanelSwitch();
        content.dataset.dmLayoutDecorated = '1';
    },

    switchTab: function (tab) {
        if (tab === 'history') tab = 'student';
        this.currentTab = tab;
        this.pagination.page = 1;
        this.decorateLayout();
        const searchInput = document.getElementById('dm-search-input');
        if (searchInput) searchInput.value = '';

        document.querySelectorAll('.login-tab').forEach(el => el.classList.remove('active'));

        let tabId = 'tab-data-stu';
        if (tab === 'exams') tabId = 'tab-data-exams';
        if (tab === 'teacher') tabId = 'tab-data-tea';
        if (tab === 'archive') tabId = 'tab-data-arch';
        if (tab === 'params') tabId = 'tab-data-params';
        if (tab === 'targets') tabId = 'tab-data-targets';
        if (tab === 'sql') tabId = 'tab-data-sql';
        if (tab === 'cloud') tabId = 'tab-data-cloud';
        const el = document.getElementById(tabId);
        if (el) el.classList.add('active');


        const stuTable = document.getElementById('dm-student-table');
        if (stuTable) stuTable.style.display = tab === 'student' ? 'table' : 'none';

        const examsArea = document.getElementById('dm-exams-area');
        if (examsArea) examsArea.style.display = tab === 'exams' ? 'flex' : 'none';

        const teaArea = document.getElementById('dm-teacher-area');
        if (teaArea) teaArea.style.display = tab === 'teacher' ? 'block' : 'none';

        const oldTeaTable = document.getElementById('dm-teacher-table');
        if (oldTeaTable && !teaArea) oldTeaTable.style.display = tab === 'teacher' ? 'table' : 'none';

        const archArea = document.getElementById('dm-archive-area');
        if (archArea) archArea.style.display = tab === 'archive' ? 'block' : 'none';

        const paramArea = document.getElementById('dm-params-area');
        if (paramArea) paramArea.style.display = tab === 'params' ? 'block' : 'none';

        const targetArea = document.getElementById('dm-targets-area');
        if (targetArea) targetArea.style.display = tab === 'targets' ? 'block' : 'none';

        const sqlArea = document.getElementById('dm-sql-area');
        if (sqlArea) sqlArea.style.display = tab === 'sql' ? 'flex' : 'none';

        const cloudArea = document.getElementById('dm-cloud-area');
        if (cloudArea) cloudArea.style.display = tab === 'cloud' ? 'flex' : 'none';


        if (tab === 'cloud') {
            const manager = this;
            window.setTimeout(() => {
                if (manager.currentTab === 'cloud') manager.renderCloudBackups();
            }, 0);
        }
        if (tab === 'sql') {
            if (typeof this.renderSQLHistory === 'function') {
                this.renderSQLHistory();
            } else if (typeof window.ensureDataManagerSqlRuntimeLoaded === 'function') {
                window.ensureDataManagerSqlRuntimeLoaded()
                    .then(() => {
                        if (typeof this.renderSQLHistory === 'function') this.renderSQLHistory();
                    })
                    .catch(err => console.warn('[DataManager] sql runtime load failed:', err?.message || err));
            }
        }

        const showSearch = (tab === 'student');
        const searchBar = document.getElementById('dm-search-bar');
        const pageBar = document.getElementById('dm-pagination');
        if (searchBar) searchBar.style.display = showSearch ? 'flex' : 'none';
        if (pageBar) pageBar.style.display = showSearch ? 'flex' : 'none';

        if (tab === 'teacher') {
            if (!window.CURRENT_COHORT_META && window.CURRENT_COHORT_ID) {
                try {
                    const storedMeta = localStorage.getItem('CURRENT_COHORT_META');
                    if (storedMeta) writeWorkspaceCohortMeta(JSON.parse(storedMeta), { syncCohortId: false });
                    else writeWorkspaceCohortMeta({
                        id: window.CURRENT_COHORT_ID,
                        year: inferCohortIdFromValue(window.CURRENT_COHORT_ID) || String(window.CURRENT_COHORT_ID).replace(/\D/g, '').slice(0, 4)
                    }, { syncCohortId: false });
                } catch (e) { }
            }

            this.updateTeacherSchoolSelect();
            this.renderTeacherTermSelect();

            setTimeout(() => {
                const termId = getPreferredTeacherTermId() || buildTeacherTermId(getExamMetaFromUI());
                if (termId) {
                    const sel = document.getElementById('dm-teacher-term-select');
                    if (sel) sel.value = termId;
                    DataManager.switchTeacherTerm(termId);
                }
            }, 50);
        }

        if (tab === 'exams') {
            this.ensureExamBatchesHydrated();
        }

        this.renderCurrentTab();
        if (tab !== 'params') {
            this.scheduleDataManagerStatusRender();
        }
        this.updateCloudPanelView();
    },

    getCloudRecordKind: function (key) {
        const text = String(key || '').trim();
        if (!text) return 'other';
        if (/^cohort::/i.test(text)) return 'cohort';
        if (isLegacyWorkspaceShadowExamId(text)) return 'shadow';
        if (/^TEACHERS_/i.test(text)) return 'teacher';
        if (/^(STUDENT_COMPARE_|MACRO_COMPARE_|TEACHER_COMPARE_|TOWN_SUB_COMPARE_)/.test(text)) return 'compare';
        if (normalizeCompareCohortId(text)) return 'snapshot';
        return 'other';
    },

    isCloudWorkspaceSnapshotKey: function (key) {
        const kind = this.getCloudRecordKind(key);
        return kind === 'cohort' || kind === 'snapshot';
    },

    isCloudRecordInCurrentWorkspace: function (key) {
        const text = String(key || '').trim();
        if (!text) return false;
        const currentKey = readWorkspaceProjectKey();
        if (currentKey && text === currentKey) return true;
        const currentCohortId = normalizeCompareCohortId(
            CURRENT_COHORT_ID
            || window.CURRENT_COHORT_ID
            || readWorkspaceCohortId()
            || currentKey
        );
        if (!currentCohortId) return true;
        if (/^cohort::/i.test(text)) return text === `cohort::${currentCohortId}`;
        return normalizeCompareCohortId(text) === currentCohortId;
    },

    renderCloudBackups: async function () {
        return requireDataCloudRuntime().renderCloudBackups(this);
    },

    toggleCloudSelection: function (inputEl) {
        return requireDataCloudRuntime().toggleCloudSelection(this, inputEl);
    },

    toggleCloudSelectAll: function (checked) {
        return requireDataCloudRuntime().toggleCloudSelectAll(this, checked);
    },

    updateCloudSelectionUI: function () {
        return requireDataCloudRuntime().updateCloudSelectionUI(this);
    },

    deleteSelectedCloudBackups: async function () {
        return requireDataCloudRuntime().deleteSelectedCloudBackups(this);
    },

    getCloudBackupRow: async function (key) {
        return requireDataCloudRuntime().getCloudBackupRow(this, key);
    },

    buildCloudArchiveExportPayload: function (item) {
        return requireDataCloudRuntime().buildCloudArchiveExportPayload(item);
    },

    getCloudArchiveDownloadName: function (key) {
        return requireDataCloudRuntime().getCloudArchiveDownloadName(key);
    },

    downloadCloudBackup: async function (key) {
        return requireDataCloudRuntime().downloadCloudBackup(this, key);
    },

    triggerCloudArchiveUpload: function () {
        return requireDataCloudRuntime().triggerCloudArchiveUpload();
    },

    parseCloudArchiveImportRecords: function (rawText, fallbackName = '') {
        return requireDataCloudRuntime().parseCloudArchiveImportRecords(rawText, fallbackName);
    },

    handleCloudArchiveUpload: async function (input) {
        return requireDataCloudRuntime().handleCloudArchiveUpload(this, input);
    },

    loadCloudBackup: async function (key) {
        return requireDataCloudRuntime().loadCloudBackup(this, key);
    },

    deleteCloudBackup: async function (key) {
        return requireDataCloudRuntime().deleteCloudBackup(this, key);
    },



    handleHistoryUpload: function (input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });

                let parsedHistory = [];
                let calcModeMsg = "";

                wb.SheetNames.forEach(sheetName => {
                    const json = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
                    if (json.length === 0) return;

                    const sample = json[0];
                    const keyName = Object.keys(sample).find(k => k.includes('姓名') || k.toLowerCase() === 'name');
                    const keyClass = Object.keys(sample).find(k => k.includes('班') || k.toLowerCase().includes('class'));
                    const keyScore = Object.keys(sample).find(k => k.includes('总分') || k.includes('得分') || k.includes('Total'));

                    const subjectKeywords = ['语文', '数学', '英语', '物理', '化学', '政治', '历史', '地理', '生物', '科学', '道法'];
                    const subjectColMap = {};

                    Object.keys(sample).forEach(header => {
                        const cleanHeader = header.trim();
                        if (cleanHeader.includes('排') || cleanHeader.includes('赋')) return;
                        const matchedSub = subjectKeywords.find(k => cleanHeader.includes(k));
                        if (matchedSub) {
                            subjectColMap[matchedSub] = header;
                            if (!SUBJECTS.includes(matchedSub)) SUBJECTS.push(matchedSub);
                        }
                    });
                    SUBJECTS.sort(sortSubjects);

                    const isGrade9 = CONFIG.name && CONFIG.name.includes('9');
                    let targetSubjects = isGrade9 ? ['语文', '数学', '英语', '物理', '化学'] : Object.keys(subjectColMap);
                    if (isGrade9) calcModeMsg = "9年级模式"; else calcModeMsg = "全科模式";

                    let schoolStudents = [];

                    json.forEach((row, idx) => {
                        let name = keyName ? row[keyName] : "";
                        if (!name || String(name).trim() === '') name = `${sheetName}_考生_${idx + 1}`;
                        let className = (keyClass && row[keyClass]) ? normalizeClass(row[keyClass]) : "默认班级";

                        let totalScore = 0;
                        let scoresObj = {};

                        Object.keys(subjectColMap).forEach(sub => {
                            const colName = subjectColMap[sub];
                            if (row[colName] !== undefined) {
                                const val = parseFloat(row[colName]);
                                if (!isNaN(val)) scoresObj[sub] = val;
                            }
                        });

                        if (keyScore && row[keyScore] !== undefined) {
                            totalScore = parseFloat(row[keyScore]);
                        } else {
                            let sum = 0; let hasValidSub = false;
                            targetSubjects.forEach(sub => {
                                if (scoresObj[sub] !== undefined) { sum += scoresObj[sub]; hasValidSub = true; }
                            });
                            if (hasValidSub) totalScore = parseFloat(sum.toFixed(2));
                        }

                        schoolStudents.push({
                            name: String(name).trim(),
                            class: className,
                            school: sheetName,
                            total: totalScore || 0,
                            scores: scoresObj,
                            ranks: {} // 初始化排名对象
                        });
                    });
                    parsedHistory = parsedHistory.concat(schoolStudents);
                });

                if (parsedHistory.length === 0) throw new Error("未解析到有效数据");


                const calcRank = (list, scoreGetter, rankSetter) => assignCompetitionRanks(list, scoreGetter, rankSetter);

                calcRank(parsedHistory, s => s.total, (s, r) => { if (!s.ranks.total) s.ranks.total = {}; s.townRank = r; s.ranks.total.township = r; });

                SUBJECTS.forEach(sub => {
                    const validList = parsedHistory.filter(s => s.scores[sub] !== undefined);
                    calcRank(validList, s => s.scores[sub], (s, r) => { if (!s.ranks[sub]) s.ranks[sub] = {}; s.ranks[sub].township = r; });
                });

                const schools = {};
                parsedHistory.forEach(s => { if (!schools[s.school]) schools[s.school] = []; schools[s.school].push(s); });

                Object.values(schools).forEach(group => {
                    calcRank(group, s => s.total, (s, r) => {
                        if (!s.ranks.total) s.ranks.total = {};
                        s.schoolRank = r;
                        s.ranks.total.school = r;
                    });
                    SUBJECTS.forEach(sub => {
                        const validList = group.filter(s => s.scores[sub] !== undefined);
                        calcRank(validList, s => s.scores[sub], (s, r) => { if (!s.ranks[sub]) s.ranks[sub] = {}; s.ranks[sub].school = r; });
                    });
                });

                const classes = {};
                parsedHistory.forEach(s => { const k = s.school + "_" + s.class; if (!classes[k]) classes[k] = []; classes[k].push(s); });

                Object.values(classes).forEach(group => {
                    calcRank(group, s => s.total, (s, r) => {
                        if (!s.ranks.total) s.ranks.total = {};
                        s.classRank = r;
                        s.ranks.total.class = r;
                    });
                    SUBJECTS.forEach(sub => {
                        const validList = group.filter(s => s.scores[sub] !== undefined);
                        calcRank(validList, s => s.scores[sub], (s, r) => { if (!s.ranks[sub]) s.ranks[sub] = {}; s.ranks[sub].class = r; });
                    });
                });

                setPrevDataState(parsedHistory);

                const statusEl = document.getElementById('dm-history-status');
                statusEl.innerHTML = `✅ 已加载 ${parsedHistory.length} 条 | ${calcModeMsg}`;
                statusEl.style.color = "#16a34a";

                DataManager.renderHistoryPreview();
                if (typeof performSilentMatching === 'function') performSilentMatching();
                if (typeof saveCloudData === 'function') {
                    saveCloudData({ background: true, sourceLabel: 'history-import-auto' }).catch(err => {
                        logCloudSyncIssue("历史数据后台同步失败", err);
                    });
                }

                alert(`历史数据导入成功！\n共 ${parsedHistory.length} 人。\n✅ 已自动计算历史总分及单科的三级排名(班/校/镇)。`);
                DataManager.renderDataManagerStatus();
                input.value = '';

            } catch (err) {
                console.error(err);
                alert("解析失败: " + err.message);
            }
        };
        reader.readAsArrayBuffer(file);
    },


    renderHistoryPreview: function () {
        const tbody = document.querySelector('#dm-history-preview-table tbody');
        if (!tbody) return;
        if (!window.PREV_DATA || window.PREV_DATA.length === 0) return;

        const schools = new Set(window.PREV_DATA.map(s => s.school));
        const isSingleSchool = schools.size === 1;

        let html = '';
        window.PREV_DATA.slice(0, 50).forEach(s => {
            const townRankDisplay = isSingleSchool ? '<span style="color:#ccc">-</span>' : s.townRank;
            const schoolText = this.escapeDataManagerHtml(s.school);
            const classText = this.escapeDataManagerHtml(s.class);
            const nameText = this.escapeDataManagerHtml(s.name);
            html += `
                <tr>
                    <td>${schoolText}</td>
                    <td>${classText}</td>
                    <td>${String(s.name || '').includes('无名氏') ? '<span style="color:#999;font-style:italic;">' + nameText + '</span>' : '<strong>' + nameText + '</strong>'}</td>
                    <td style="font-weight:bold; color:#1e3a8a;">${s.total}</td>
                    <td>${s.schoolRank}</td>
                    <td>${townRankDisplay}</td>
                </tr>
            `;
        });

        if (window.PREV_DATA.length > 50) {
            html += `<tr><td colspan="6" style="text-align:center; color:#666;">... 共 ${window.PREV_DATA.length} 条记录 ...</td></tr>`;
        }

        tbody.innerHTML = html;

        const townTh = document.querySelector('#dm-history-preview-table th:last-child');
        if (townTh) {
            if (isSingleSchool) {
                townTh.innerHTML = '<span style="color:#ccc; text-decoration:line-through">全镇排名</span><br><small>(单校已隐藏)</small>';
            } else {
                townTh.innerText = '全镇排名';
            }
        }
    },

    renderCurrentTab: function () {
        const input = document.getElementById('dm-search-input');
        const keyword = input ? input.value.trim().toLowerCase() : '';

        if (this.currentTab === 'student') {
            this.renderStudents(keyword);
        } else if (this.currentTab === 'teacher') {
            this.renderTeachers(); // 教师页独立渲染
        } else if (this.currentTab === 'archive') {
            this.renderArchives();
        } else if (this.currentTab === 'params') {
            this.renderParams();
        } else if (this.currentTab === 'targets') {
            this.renderTargets();
        } else if (this.currentTab === 'exams') {
            this.renderExamBatches();
        }
    },

    escapeDataManagerHtml: function (value) {
        if (window.SchoolRuntime && typeof SchoolRuntime.escapeHtml === 'function') {
            return SchoolRuntime.escapeHtml(value);
        }
        return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        }[ch]));
    },

    dataManagerJsStringLiteral: function (value) {
        if (typeof window.jsStringLiteral === 'function') return window.jsStringLiteral(value);
        return JSON.stringify(String(value ?? ''))
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    },

    getExamBatchDateSortTs: function (examId, meta = {}) {
        return getExamRecordDateSortTimestamp(examId, { meta });
    },

    getExamBatchRows: function () {
        const db = (typeof CohortDB !== 'undefined' && typeof CohortDB.ensure === 'function') ? CohortDB.ensure() : null;
        const exams = db?.exams && typeof db.exams === 'object' ? db.exams : {};
        const currentExamId = String(CURRENT_EXAM_ID || window.CURRENT_EXAM_ID || readWorkspaceExamId?.() || db?.currentExamId || '').trim();
        const rows = Object.entries(exams).map(([examId, exam]) => {
            const meta = exam?.meta || {};
            const rowCount = getUploadExamDataRowCount(exam?.data);
            const grade = String(getEffectiveGrade?.(meta) || meta.grade || '').trim();
            const cohortId = String(meta.cohortId || CURRENT_COHORT_ID || window.CURRENT_COHORT_ID || '').trim();
            const momentKey = [cohortId, meta.year || '', meta.term || '', meta.date || '', grade].map(v => String(v || '').trim()).join('|');
            const examDateTs = this.getExamBatchDateSortTs(examId, meta);
            const updateSortTs = Number(exam?.updatedAt || exam?.createdAt || getExamSortTimestamp?.(examId, 0) || 0);
            return {
                examId,
                exam,
                meta,
                rowCount,
                grade,
                cohortId,
                momentKey,
                examDateTs,
                updateSortTs,
                current: examId === currentExamId,
                selected: this.examBatchSelection.has(examId)
            };
        });
        const duplicateCounts = {};
        rows.forEach(row => {
            if (!row.momentKey.replace(/\|/g, '')) return;
            duplicateCounts[row.momentKey] = (duplicateCounts[row.momentKey] || 0) + 1;
        });
        rows.forEach(row => {
            row.duplicate = duplicateCounts[row.momentKey] > 1;
            row.empty = row.rowCount === 0;
        });
        rows.sort((a, b) => {
            if (b.examDateTs !== a.examDateTs) return b.examDateTs - a.examDateTs;
            if (a.current !== b.current) return a.current ? -1 : 1;
            return b.updateSortTs - a.updateSortTs || a.examId.localeCompare(b.examId, 'zh-CN');
        });
        return rows;
    },

    getFilteredExamBatchRows: function () {
        const keyword = String(document.getElementById('dm-exams-search')?.value || '').trim().toLowerCase();
        const filter = String(document.getElementById('dm-exams-filter')?.value || 'all');
        return this.getExamBatchRows().filter(row => {
            if (filter === 'duplicate' && !row.duplicate) return false;
            if (filter === 'empty' && !row.empty) return false;
            if (filter === 'current' && !row.current) return false;
            if (!keyword) return true;
            const haystack = [
                row.examId,
                row.meta?.year,
                row.meta?.term,
                row.meta?.type,
                row.meta?.name,
                row.meta?.examName,
                row.meta?.date
            ].map(v => String(v || '').toLowerCase()).join(' ');
            return haystack.includes(keyword);
        });
    },

    ensureExamBatchesHydrated: function (options = {}) {
        const force = options.force === true;
        const cohortId = String(CURRENT_COHORT_ID || window.CURRENT_COHORT_ID || (typeof readWorkspaceCohortId === 'function' ? readWorkspaceCohortId() : '') || '').trim();
        if (!cohortId || !window.CloudManager || typeof CloudManager.fetchCohortExamsToLocal !== 'function') return Promise.resolve({ success: false, skipped: true });
        if (!force && this.examBatchHydratedCohorts.has(cohortId)) return Promise.resolve({ success: true, cached: true });
        if (this._examBatchHydrationPromise && !force) return this._examBatchHydrationPromise;

        const summary = document.getElementById('dm-exams-summary');
        if (summary && this.currentTab === 'exams') {
            summary.dataset.loading = 'true';
            const label = force ? '正在补齐云端历史考试...' : '正在后台检查最新云端考试...';
            if (!summary.querySelector('[data-exam-hydration-status]')) {
                summary.insertAdjacentHTML('beforeend', `<div data-exam-hydration-status="true" style="margin-top:6px; color:#2563eb; font-weight:700;">${label}</div>`);
            } else {
                summary.querySelector('[data-exam-hydration-status]').textContent = label;
            }
        }

        this._examBatchHydrationPromise = Promise.resolve(CloudManager.fetchCohortExamsToLocal(cohortId, {
            background: true,
            force,
            latestOnly: !force,
            maxFetch: force ? 0 : 1,
            minCount: force ? 50 : 1,
            refreshSelectors: false
        })).then((result) => {
            this.examBatchHydratedCohorts.add(cohortId);
            if (this.currentTab === 'exams') this.renderExamBatches();
            return result;
        }).catch((error) => {
            console.warn('[DataManager] exam batch cloud hydration failed:', error);
            if (window.UI) UI.toast('云端历史考试补齐失败，请稍后重试', 'warning');
            return { success: false, error };
        }).finally(() => {
            this._examBatchHydrationPromise = null;
        });
        return this._examBatchHydrationPromise;
    },

    refreshExamBatchesFromCloud: function () {
        this.examBatchHydratedCohorts.delete(String(CURRENT_COHORT_ID || window.CURRENT_COHORT_ID || '').trim());
        this.renderExamBatches();
        return this.ensureExamBatchesHydrated({ force: true });
    },

    renderExamBatches: function () {
        const tbody = document.getElementById('dm-exams-tbody');
        const summary = document.getElementById('dm-exams-summary');
        if (!tbody) return;
        const h = (value) => this.escapeDataManagerHtml(value);
        const allRows = this.getExamBatchRows();
        const rows = this.getFilteredExamBatchRows();
        const selected = new Set(this.examBatchSelection);
        this.examBatchSelection = new Set([...selected].filter(id => allRows.some(row => row.examId === id)));
        const duplicateCount = allRows.filter(row => row.duplicate).length;
        const emptyCount = allRows.filter(row => row.empty).length;
        const totalRows = allRows.reduce((sum, row) => sum + row.rowCount, 0);
        if (summary) {
            const cohort = String(CURRENT_COHORT_ID || window.CURRENT_COHORT_ID || '未选择').trim();
            summary.innerHTML = `当前届别：<b>${h(cohort)}</b> · 考试批次 <b>${allRows.length}</b> 个 · 成绩记录 <b>${totalRows}</b> 条 · 疑似重复 <b style="color:#b45309;">${duplicateCount}</b> 个 · 空批次 <b style="color:#dc2626;">${emptyCount}</b> 个`;
        }
        if (!rows.length) {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:22px; color:#64748b;">当前筛选下没有考试批次</td></tr>';
            this.updateExamBatchSelectionUI();
            return;
        }
        tbody.innerHTML = rows.map(row => {
            const meta = row.meta || {};
            const title = meta.examName || meta.name || meta.type || row.examId;
            const encodedExamId = encodeURIComponent(row.examId);
            const statusBadges = [];
            if (row.current) statusBadges.push('<span class="badge" style="background:#dbeafe;color:#1d4ed8;">当前</span>');
            if (row.duplicate) statusBadges.push('<span class="badge" style="background:#fef3c7;color:#92400e;">疑似重复</span>');
            if (row.empty) statusBadges.push('<span class="badge" style="background:#fee2e2;color:#b91c1c;">空数据</span>');
            if (!statusBadges.length) statusBadges.push('<span class="badge" style="background:#dcfce7;color:#166534;">正常</span>');
            const updatedAt = row.exam?.updatedAt || row.exam?.createdAt;
            const updatedText = updatedAt ? new Date(updatedAt).toLocaleString('zh-CN') : '-';
            const termText = [meta.year, meta.term].filter(Boolean).join(' / ') || '-';
            return `
                <tr data-exam-id="${h(row.examId)}">
                    <td style="text-align:center;">
                        <input type="checkbox" class="dm-exams-select" data-exam-id="${h(row.examId)}" ${this.examBatchSelection.has(row.examId) ? 'checked' : ''} onchange="DataManager.toggleExamBatchSelection(this)">
                    </td>
                    <td>
                        <div style="font-weight:700; color:#0f172a;">${h(title)}</div>
                        <div style="font-size:11px; color:#64748b; margin-top:3px;">${h(row.examId)}</div>
                    </td>
                    <td>${h(termText)}${row.grade ? `<div style="font-size:11px; color:#64748b; margin-top:3px;">${h(row.grade)}年级</div>` : ''}</td>
                    <td>${h(meta.date || '-')}</td>
                    <td style="font-weight:700;">${row.rowCount}</td>
                    <td>${statusBadges.join(' ')}</td>
                    <td>${h(updatedText)}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" type="button" onclick="DataManager.switchToExamBatch(decodeURIComponent('${encodedExamId}'))" style="padding:3px 7px;">切换</button>
                        <button class="btn btn-sm btn-danger" type="button" onclick="DataManager.deleteExamBatch(decodeURIComponent('${encodedExamId}'))" style="padding:3px 7px; background:#dc2626;">删除</button>
                    </td>
                </tr>
            `;
        }).join('');
        this.updateExamBatchSelectionUI();
    },

    updateExamBatchSelectionUI: function () {
        const boxes = Array.from(document.querySelectorAll('#dm-exams-tbody .dm-exams-select'));
        const selectedVisible = boxes.filter(box => this.examBatchSelection.has(String(box.dataset.examId || '')));
        boxes.forEach(box => { box.checked = this.examBatchSelection.has(String(box.dataset.examId || '')); });
        const allBox = document.getElementById('dm-exams-select-all');
        if (allBox) {
            allBox.checked = boxes.length > 0 && selectedVisible.length === boxes.length;
            allBox.indeterminate = selectedVisible.length > 0 && selectedVisible.length < boxes.length;
        }
        const countEl = document.getElementById('dm-exams-selected-count');
        if (countEl) countEl.textContent = `已选 ${this.examBatchSelection.size} 项`;
        const deleteBtn = document.getElementById('dm-exams-batch-delete');
        if (deleteBtn) {
            deleteBtn.disabled = this.examBatchSelection.size === 0;
            deleteBtn.style.opacity = this.examBatchSelection.size === 0 ? '0.6' : '1';
        }
    },

    toggleExamBatchSelection: function (inputEl) {
        const examId = String(inputEl?.dataset?.examId || '').trim();
        if (!examId) return;
        if (inputEl.checked) this.examBatchSelection.add(examId);
        else this.examBatchSelection.delete(examId);
        this.updateExamBatchSelectionUI();
    },

    toggleExamBatchSelectAll: function (checked) {
        document.querySelectorAll('#dm-exams-tbody .dm-exams-select').forEach(box => {
            const examId = String(box.dataset.examId || '').trim();
            if (!examId) return;
            if (checked) this.examBatchSelection.add(examId);
            else this.examBatchSelection.delete(examId);
        });
        this.updateExamBatchSelectionUI();
    },

    selectRecognizedExamBatches: function () {
        const rows = this.getFilteredExamBatchRows().filter(row => row.duplicate || row.empty);
        this.examBatchSelection = new Set(rows.map(row => row.examId));
        this.renderExamBatches();
        if (window.UI) UI.toast(`已识别并勾选 ${rows.length} 个疑似项`, rows.length ? 'info' : 'success');
    },

    switchToExamBatch: function (examId) {
        const key = String(examId || '').trim();
        if (!key || !CohortDB?.applyExamToWorkspace) return;
        const ok = CohortDB.applyExamToWorkspace(key, { recalculate: true, renderTables: true });
        if (ok) {
            this.renderExamBatches();
            if (window.UI) UI.toast(`已切换到考试批次：${key}`, 'success');
        } else {
            alert('未找到该考试批次，可能已被删除或尚未同步。');
        }
    },

    getScopedCacheKey: function (key) {
        // Reuse the canonical user-prefix helper from cloud-workspace-runtime if
        // available; fall back to local equivalent. Prevents cross-user PII leaks.
        const prefix = typeof window.getIdbUserCachePrefix === 'function'
            ? window.getIdbUserCachePrefix()
            : '';
        return prefix ? `cache_${prefix}${key}` : `cache_${key}`;
    },

    removeExamBatchLocal: async function (examId) {
        const key = String(examId || '').trim();
        const db = CohortDB?.ensure?.();
        if (!key || !db?.exams) return false;
        delete db.exams[key];
        if (Array.isArray(db.resetPoints)) {
            db.resetPoints = db.resetPoints.filter(item => String(item || '').trim() !== key);
        }
        CohortDB.removeStudentHistoryByExamId?.(key);
        if (window.idbKeyval?.del) {
            try { await window.idbKeyval.del(this.getScopedCacheKey(key)); } catch (e) { console.warn('[DataManager] exam cache delete skipped:', e); }
        }
        if (String(CURRENT_EXAM_ID || window.CURRENT_EXAM_ID || db.currentExamId || '').trim() === key) {
            const fallback = getLatestExamRecordId(db.exams || {});
            db.currentExamId = fallback;
            if (fallback && CohortDB.applyExamToWorkspace) CohortDB.applyExamToWorkspace(fallback, { recalculate: true, renderTables: true });
            else {
                CURRENT_EXAM_ID = '';
                window.CURRENT_EXAM_ID = '';
                if (typeof writeWorkspaceExamId === 'function') writeWorkspaceExamId('');
                if (typeof clearDataRuntimeState === 'function') clearDataRuntimeState({ keepConfig: true });
            }
        }
        if (typeof syncRuntimeStateToWindow === 'function') syncRuntimeStateToWindow();
        if (typeof CohortDB.renderExamList === 'function') CohortDB.renderExamList();
        return true;
    },

    deleteExamBatch: async function (examId) {
        const key = String(examId || '').trim();
        if (!key) return;
        if (!confirm(`危险操作：确定删除考试批次「${key}」吗？\n\n会清理该届别库中的成绩、学生历史引用、本地缓存，并尝试删除同名云端考试快照。`)) return;
        await this.deleteExamBatches([key]);
    },

    deleteSelectedExamBatches: async function () {
        const keys = Array.from(this.examBatchSelection).filter(Boolean);
        if (!keys.length) return alert('请先勾选需要删除的考试批次。');
        if (!confirm(`确定批量删除 ${keys.length} 个考试批次吗？\n\n删除后不可恢复，建议确认已备份。`)) return;
        await this.deleteExamBatches(keys);
    },

    deleteExamBatches: async function (keys) {
        const uniqueKeys = [...new Set((keys || []).map(key => String(key || '').trim()).filter(Boolean))];
        if (!uniqueKeys.length) return;
        if (window.UI) UI.loading(true, `正在删除 ${uniqueKeys.length} 个考试批次...`);
        let localRemoved = 0;
        let cloudRemoved = 0;
        try {
            for (const key of uniqueKeys) {
                if (await this.removeExamBatchLocal(key)) localRemoved += 1;
                if (typeof deleteSystemDataRecords === 'function') {
                    try {
                        const { error } = await deleteSystemDataRecords({ keyEq: key });
                        if (!error) cloudRemoved += 1;
                    } catch (e) {
                        console.warn('[DataManager] cloud exam delete failed:', key, e);
                    }
                }
                this.examBatchSelection.delete(key);
            }
            if (typeof saveCloudData === 'function') {
                try { await saveCloudData({ mode: 'workspace', background: false, sourceLabel: 'data-manager-delete-exam-batches', forceUpload: true }); }
                catch (e) { console.warn('[DataManager] workspace sync after exam delete failed:', e); }
            }
            this.renderExamBatches();
            this.renderDataManagerStatus();
            if (window.UI) UI.toast(`已删除 ${localRemoved} 个本地批次，云端快照删除 ${cloudRemoved} 个`, 'success');
        } finally {
            if (window.UI) UI.loading(false);
        }
    },

    renderStudents: function (keyword) {
        if (!window.RAW_DATA) return;

        let list = keyword
            ? RAW_DATA.filter(s =>
                (s.name && s.name.toLowerCase().includes(keyword)) ||
                (String(s.id) && String(s.id).includes(keyword)) ||
                (s.class && s.class.includes(keyword)) ||
                (s.school && s.school.includes(keyword))
            ).map((item, index) => ({ ...item, _originalIndex: RAW_DATA.indexOf(item) }))
            : RAW_DATA.map((item, index) => ({ ...item, _originalIndex: index }));

        this.pagination.total = list.length;
        const totalPages = Math.ceil(this.pagination.total / this.pagination.size) || 1;

        if (this.pagination.page > totalPages) this.pagination.page = totalPages;
        if (this.pagination.page < 1) this.pagination.page = 1;

        const start = (this.pagination.page - 1) * this.pagination.size;
        const pageData = list.slice(start, start + this.pagination.size);
        const validIndexSet = new Set(list.map(x => x._originalIndex));
        this.studentSelection.forEach(idx => {
            if (!validIndexSet.has(idx)) this.studentSelection.delete(idx);
        });

        const tbody = document.querySelector('#dm-student-table tbody');
        if (!tbody) return;

        if (pageData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px; color:#999;">无数据</td></tr>';
        } else {
            const rows = pageData.map(s => `
                <tr>
                    <td style="text-align:center;"><input type="checkbox" class="dm-stu-select" data-idx="${s._originalIndex}" ${this.studentSelection.has(s._originalIndex) ? 'checked' : ''} onchange="DataManager.toggleStudentSelection(this)"></td>
                    <td>${this.escapeDataManagerHtml(s.school)}</td>
                    <td>${this.escapeDataManagerHtml(s.class)}</td>
                    <td style="font-weight:bold;">${this.escapeDataManagerHtml(s.name)}</td>
                    <td>${this.escapeDataManagerHtml(s.id)}</td>
                    <td>${s.total}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="DataManager.editStudent(${s._originalIndex})" style="padding:2px 6px; font-size:11px;">编辑</button>
                        <button class="btn btn-sm btn-danger" onclick="DataManager.deleteStudent(${s._originalIndex})" style="padding:2px 6px; background:#dc2626; font-size:11px;">删除</button>
                    </td>
                </tr>`);
            tbody.innerHTML = rows.join('');
        }
        this.updateStudentSelectionUI();
        this.updatePaginationUI(totalPages);
    },

    toggleStudentSelection: function (inputEl) {
        if (!inputEl) return;
        const idx = parseInt(inputEl.dataset.idx);
        if (isNaN(idx)) return;
        if (inputEl.checked) this.studentSelection.add(idx);
        else this.studentSelection.delete(idx);
        this.updateStudentSelectionUI();
    },

    toggleStudentSelectAll: function (checked) {
        const boxes = Array.from(document.querySelectorAll('#dm-student-table tbody .dm-stu-select'));
        boxes.forEach(box => {
            box.checked = !!checked;
            const idx = parseInt(box.dataset.idx);
            if (isNaN(idx)) return;
            if (checked) this.studentSelection.add(idx);
            else this.studentSelection.delete(idx);
        });
        this.updateStudentSelectionUI();
    },

    updateStudentSelectionUI: function () {
        const boxes = Array.from(document.querySelectorAll('#dm-student-table tbody .dm-stu-select'));
        const headerBox = document.getElementById('dm-stu-select-all');
        const countEl = document.getElementById('dm-stu-selected-count');
        const batchBtn = document.getElementById('dm-stu-batch-delete');

        let visibleSelected = 0;
        boxes.forEach(box => {
            const idx = parseInt(box.dataset.idx);
            if (!isNaN(idx) && this.studentSelection.has(idx)) {
                box.checked = true;
                visibleSelected++;
            }
        });

        if (headerBox) {
            headerBox.indeterminate = visibleSelected > 0 && visibleSelected < boxes.length;
            headerBox.checked = boxes.length > 0 && visibleSelected === boxes.length;
        }
        if (countEl) countEl.textContent = `已选 ${this.studentSelection.size} 项`;
        if (batchBtn) {
            batchBtn.disabled = this.studentSelection.size === 0;
            batchBtn.style.opacity = this.studentSelection.size === 0 ? '0.6' : '1';
        }
    },

    deleteSelectedStudents: function () {
        const indexes = Array.from(this.studentSelection || []).filter(i => Number.isInteger(i));
        if (!indexes.length) return alert('请先勾选要删除的学生');
        if (!confirm(`⚠️ 确定删除选中的 ${indexes.length} 名学生吗？`)) return;

        indexes.sort((a, b) => b - a).forEach(idx => {
            if (idx >= 0 && idx < RAW_DATA.length) RAW_DATA.splice(idx, 1);
        });
        this.studentSelection.clear();
        this.renderCurrentTab();
        UI.toast(`已暂存删除 ${indexes.length} 项 (请点击保存)`, 'info');
    },

    updatePaginationUI: function (totalPages) {
        const el = document.getElementById('dm-page-info');
        if (el) el.innerText = `${this.pagination.page} / ${totalPages}`;
    },

    changePage: function (delta) {
        this.pagination.page += delta;
        this.renderCurrentTab();
    },




    updateTeacherSchoolSelect: function () {
        const sel = document.getElementById('dm-teacher-school-select');
        if (!sel) return;

        const currentVal = sel.value;
        let schools = new Set();

        const schoolList = (typeof listAvailableSchoolsForCompare === 'function')
            ? listAvailableSchoolsForCompare('all')
            : Object.keys(SCHOOLS || {});
        schoolList.forEach(s => schools.add(s));
        const inferredSchool = (typeof inferDefaultSchoolFromContext === 'function') ? inferDefaultSchoolFromContext() : '';
        if (inferredSchool) schools.add(inferredSchool);

        const schoolOptionsHtml = [...schools]
            .sort((a, b) => a.localeCompare(b, 'zh-CN'))
            .map(s => `<option value="${this.escapeDataManagerHtml(s)}">${this.escapeDataManagerHtml(s)}</option>`)
            .join('');
        sel.innerHTML = `<option value="">-- 显示全部 --</option>${schoolOptionsHtml}`;

        if (currentVal && schools.has(currentVal)) {
            sel.value = currentVal;
        } else if (MY_SCHOOL && schools.has(MY_SCHOOL)) {
            sel.value = MY_SCHOOL;
            appDebug(`✅ 自动选择本校：${MY_SCHOOL}`);
        } else if (inferredSchool) {
            sel.value = inferredSchool;
            appDebug(`✅ 自动推断学校：${inferredSchool}`);
        }
    },

    updateTeacherSchoolFilter: function () {
        const sel = document.getElementById('dm-teacher-school-select');
        const selectedSchool = sel ? sel.value : '';
        if (selectedSchool) {
            writeCurrentSchool(selectedSchool);
            const mainSelect = document.getElementById('mySchoolSelect');
            if (mainSelect) {
                mainSelect.value = selectedSchool;
                mainSelect.dispatchEvent(new Event('change'));
            }
        }
        this.renderTeachers();
    },

    renderTeacherTermSelect: function () {
        const sel = document.getElementById('dm-teacher-term-select');
        if (!sel) return;

        const getEntryYear = () => {
            if (window.CURRENT_COHORT_META && window.CURRENT_COHORT_META.year) {
                return parseInt(window.CURRENT_COHORT_META.year, 10);
            }

            try {
                const metaStr = localStorage.getItem('CURRENT_COHORT_META');
                if (metaStr) {
                    const meta = JSON.parse(metaStr);
                    if (meta && meta.year) return parseInt(meta.year, 10);
                }
            } catch (e) { }

            const id = window.CURRENT_COHORT_ID || readWorkspaceCohortId();
            if (id && /^\d{4}$/.test(String(id))) return parseInt(id, 10);

            const label = document.getElementById('cohort-current-label')?.innerText || '';
            const match = label.match(/(\d{4})级/); // 精确匹配 "xxxx级"
            if (match) return parseInt(match[1], 10);

            return null;
        };

        let years = [];
        const startYear = getEntryYear();

        if (startYear) {
            for (let i = 0; i < 4; i++) years.push(startYear + i);
        } else {
            const currentYear = new Date().getFullYear();
            years = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];
        }

        let options = '';
        years.forEach(year => {
            const yearStr = `${year}-${year + 1}`;
            let gradeLabel = '';
            let gradeNum = null;
            if (startYear) {
                gradeNum = 6 + (year - startYear);
                gradeLabel = ` [${gradeNum}年级]`;
            }
            ['上学期', '下学期'].forEach(term => {
                const termId = gradeNum ? `${yearStr}_${term}_${gradeNum}年级` : `${yearStr}_${term}`;
                options += `<option value="${termId}">${yearStr} ${term}${gradeLabel}</option>`;
            });
        });

        sel.innerHTML = options || '<option value="">暂无学期</option>';

        let prefer = null;
        const preferredCandidates = getTeacherTermCandidates();
        for (const candidate of preferredCandidates) {
            for (let opt of sel.options) {
                if (opt.value === candidate || opt.value.startsWith(candidate + '_')) {
                    prefer = opt.value;
                    break;
                }
            }
            if (prefer) break;
        }

        if (prefer) {
            sel.value = prefer;
            syncTeacherTermStorage(prefer);
        } else if (sel.options.length > 0) sel.value = sel.options[0].value;
    },

    switchTeacherTerm: function (termId) {
        if (!termId) return;

        const parts = termId.split('_');
        const baseTerm = parts.slice(0, 2).join('_'); // "2025-2026_上学期"
        const gradeInfo = parts[2]; // "9年级" 或 undefined

        syncTeacherTermStorage(termId);

        if (gradeInfo) {
            const gradeMatch = gradeInfo.match(/(\d+)/);
            if (gradeMatch) {
                const grade = parseInt(gradeMatch[1], 10);
                const yearMatch = parts[0].match(/(\d{4})/);
                if (yearMatch) {
                    const currentYear = parseInt(yearMatch[1], 10);
                    const entryYear = currentYear - (grade - 6);
                    const cohortId = entryYear;

                    writeWorkspaceCohortId(String(cohortId));
                    appDebug(`📅 已设置届数：${cohortId}级 (${grade}年级)`);
                }
            }
        }

        const db = CohortDB.ensure();
        const history = db.teachingHistory || {};
        const entry = history[termId] || history[baseTerm];
        const localMap = entry?.map && typeof entry.map === 'object' ? entry.map : (entry || {});
        const localSchoolMap = entry?.schoolMap && typeof entry.schoolMap === 'object' ? entry.schoolMap : {};
        const hasLocal = localMap && Object.keys(localMap).length > 0;

        if (hasLocal) {
            if (gradeInfo) {
                const gradeMatch = gradeInfo.match(/(\d+)/);
                if (gradeMatch) {
                    const gradePrefix = String(gradeMatch[1]); // 例如 "8"
                    const cleanedMap = {};
                    let cleanedCount = 0;
                    let droppedCount = 0;

                    Object.entries(localMap).forEach(([k, v]) => {
                        const clsName = String(k.split('_')[0]).replace(/班/g, '');
                        if (clsName.startsWith(gradePrefix)) {
                            cleanedMap[k] = v;
                            cleanedCount++;
                        } else {
                            droppedCount++; // 发现跨届污染数据，准备丢弃
                        }
                    });

                    if (droppedCount > 0) {
                        console.warn(`🧹 [自动清洗] 已从被污染的本地历史 '${baseTerm}' 中清除了 ${droppedCount} 条非 ${gradePrefix} 年级的脏数据`);
                    }
                    localMap = cleanedMap;
                }

                if (localSchoolMap && typeof localSchoolMap === 'object') {
                    let scrubbedSchools = 0;
                    Object.keys(localSchoolMap).forEach(k => {
                        if (/^Sheet\d+$/i.test(localSchoolMap[k])) {
                            delete localSchoolMap[k];
                            scrubbedSchools++;
                        }
                    });
                    if (scrubbedSchools > 0) console.warn(`🧹 [自动清洗] 已清除 ${scrubbedSchools} 条包含 "SheetX" 的错误学校名称`);
                }
            }

            setTeacherMap(JSON.parse(JSON.stringify(localMap)));
            setTeacherSchoolMap(JSON.parse(JSON.stringify(localSchoolMap)));
            this.renderTeachers();
            appDebug(`✅ 已从本地历史加载学期 ${baseTerm} 的任课表，共展示 ${Object.keys(localMap).length} 条`);
            if (typeof this.refreshTeacherAnalysis === 'function') this.refreshTeacherAnalysis();
        } else {
            appDebug(`⚠️ 本地无学期 ${baseTerm} 的任课数据，尝试从云端同步...`);
            setTeacherMap({});
            setTeacherSchoolMap({});
            this.renderTeachers(); // 先渲染空表

            if (window.CloudManager && CloudManager.loadTeachers) {
                if (window.UI) UI.toast('🔄 正在从云端加载教师任课数据...', 'info');
                CloudManager.loadTeachers({ background: true }).then(() => {
                    appDebug('✅ 云端数据加载完成');
                }).catch(err => {
                    console.warn('云端加载失败:', err);
                    if (window.UI) UI.toast('☁️ 云端暂无该学期任课数据', 'warning');
                });
            }
        }
    },

    syncTeacherHistory: function (opts = {}) {
        const termId = opts.termId || readCurrentTermId() || getTermId(getExamMetaFromUI());
        if (!termId) return;
        const db = CohortDB.ensure();
        db.teachingHistory = db.teachingHistory || {};
        const savedAt = (() => {
            const raw = opts.timestamp;
            if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
            if (typeof raw === 'string') {
                const parsed = Date.parse(raw);
                if (!Number.isNaN(parsed)) return parsed;
            }
            return Date.now();
        })();
        db.teachingHistory[termId] = {
            map: JSON.parse(JSON.stringify(TEACHER_MAP || {})),
            schoolMap: JSON.parse(JSON.stringify(TEACHER_SCHOOL_MAP || {})),
            savedAt,
            source: opts.source || 'local'
        };
        if (typeof this.refreshTeacherAnalysis === 'function') this.refreshTeacherAnalysis();
    },

    ensureTeacherMap: function (triggerCloud) {
        const termId = getPreferredTeacherTermId() || buildTeacherTermId(getExamMetaFromUI());
        if (!termId) return false;
        if (window.TEACHER_MAP && Object.keys(window.TEACHER_MAP).length > 0) return true;

        const db = CohortDB.ensure();
        const history = db.teachingHistory || {};
        const entry = history[termId];
        const localMap = entry?.map && typeof entry.map === 'object' ? entry.map : (entry || {});
        const localSchoolMap = entry?.schoolMap && typeof entry.schoolMap === 'object' ? entry.schoolMap : {};
        if (localMap && Object.keys(localMap).length > 0) {
            setTeacherMap(JSON.parse(JSON.stringify(localMap)));
            setTeacherSchoolMap(JSON.parse(JSON.stringify(localSchoolMap)));
            return true;
        }

        if (triggerCloud && window.CloudManager && CloudManager.loadTeachers) {
            CloudManager.loadTeachers({ background: true });
        }
        return false;
    },

    refreshTeacherAnalysis: function () {
        const section = document.getElementById('teacher-analysis');
        syncTeacherAnalysisSchoolContext();
        if (section && section.classList.contains('active')) {
            if (typeof renderTeacherAnalysisState === 'function') renderTeacherAnalysisState();
            else if (typeof analyzeTeachers === 'function') analyzeTeachers();
            if (typeof updateStatusPanel === 'function') updateStatusPanel();
        }
    },

    handleTeacherUpload: function (input) {
        const file = input.files[0];
        if (!file) {
            console.warn('未选择文件');
            return;
        }

        if (typeof XLSX === 'undefined') {
            alert('❌ Excel解析库未加载，请刷新页面后重试');
            return;
        }

        const termId = getPreferredTeacherTermId() || buildTeacherTermId(getExamMetaFromUI()) || readCurrentTermId() || getTermId(getExamMetaFromUI());
        if (!termId) {
            alert('⚠️ 请先选择学期！\n\n点击【学期】下拉框选择一个学期后再导入Excel。');
            return;
        }
        syncTeacherTermStorage(termId);

        appDebug(`开始导入教师Excel: ${file.name}, 学期: ${termId}`);

        if (window.UI) UI.loading(true, '✨ 正在解析Excel...');

        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });

                if (!wb.SheetNames || wb.SheetNames.length === 0) {
                    if (window.UI) UI.loading(false);
                    alert("❌ 表格为空或格式不正确\n\n请确保 Excel 包含至少一个Sheet，且每个Sheet含：班级、学科、教师姓名列");
                    return;
                }

                let totalRows = 0;

                let count = 0;
                const errors = [];
                const teacherAssignments = [];

                wb.SheetNames.forEach(sheetName => {
                    const json = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
                    if (!json || json.length === 0) return;
                    totalRows += json.length;

                    json.forEach((row, idx) => {
                        const classAlias = ['班级', 'class', 'Class', '班级名称', '行政班', '所属班级', '年级班级', '教学班'];
                        const subjectAlias = ['学科', 'subject', '科目', 'Subject', '任教科目', '考试科目'];
                        const teacherAlias = ['教师', 'teacher', '教师姓名', '姓名', 'Teacher', '任课教师', '任课老师', '授课教师', '老师'];
                        const schoolAlias = ['学校', 'school', 'School', '校区', '所属学校'];

                        const getVal = (aliases) => {
                            for (let a of aliases) {
                                if (row[a] !== undefined && row[a] !== null) return String(row[a]).trim();
                            }
                            return '';
                        };

                        const className = normalizeClass(getVal(classAlias));
                        const subject = normalizeSubject(getVal(subjectAlias));
                        const teacher = getVal(teacherAlias);
                        let extractedSchool = getVal(schoolAlias);
                        if (!extractedSchool && !/^Sheet\d+$/i.test(sheetName)) {
                            extractedSchool = sheetName;
                        }
                        const schoolName = String(extractedSchool || '').trim();

                        if (className && subject && teacher) {
                            teacherAssignments.push({
                                key: `${className}_${subject}`,
                                teacher: String(teacher).trim(),
                                school: schoolName
                            });
                        } else {
                            if (errors.length < 5) {
                                errors.push(`[${sheetName}]第${idx + 2}行: 班级=${className || '空'}, 学科=${subject || '空'}, 教师=${teacher || '空'}`);
                            }
                        }
                    });
                });

                const importResult = requireDataManagerTeacherRuntime().buildTeacherImportMaps(teacherAssignments);
                if (importResult.conflicts.length > 0) {
                    if (window.UI) UI.loading(false);
                    alert(requireDataManagerTeacherRuntime().formatTeacherImportConflictMessage(importResult.conflicts));
                    input.value = '';
                    return;
                }

                const newTeacherMap = importResult.teacherMap;
                const newTeacherSchoolMap = importResult.schoolMap;
                count = importResult.count;

                if (count > 0) {
                    setTeacherMap(newTeacherMap);
                    setTeacherSchoolMap(newTeacherSchoolMap);
                }

                if (window.DataManager && typeof DataManager.updateTeacherSchoolSelect === 'function') {
                    DataManager.updateTeacherSchoolSelect();
                }

                appDebug(`导入成功: ${count} 条记录`);
                appDebug(`解析总行数: ${totalRows}`);

                if (count === 0) {
                    if (window.UI) UI.loading(false);
                    alert(`❌ 未能导入任何数据\n\n请检查Excel格式：\n- 必须包含列：【班级】【学科】【教师】\n- 或英文列：class, subject, teacher\n\n${errors.length > 0 ? '错误示例：\n' + errors.join('\n') : ''}`);
                    return;
                }

                DataManager.syncTeacherHistory({ termId, source: 'upload' });
                updateStatusPanel();

                DataManager.renderTeachers();
                logAction('导入', `任课表导入 ${count} 条（${termId}）`);

                if (window.CloudManager && CloudManager.saveTeachers) {
                    try {
                        appDebug('[TeacherSync] 尝试上传任课表到云端...');
                        const ok = await CloudManager.saveTeachers({ termId });
                        if (window.UI) UI.loading(false);
                        if (ok) {
                            if (window.UI) {
                                UI.toast(`✅ 成功导入 ${count} 条任课信息并同步到云端！`, "success");
                            } else {
                                alert(`✅ 成功导入 ${count} 条任课信息并同步到云端！`);
                            }
                        } else {
                            alert(`✅ 成功导入 ${count} 条任课信息！\n\n⚠️ 但云端同步失败，请检查 Cloudflare 数据接口或登录状态。`);
                        }
                    } catch (cloudErr) {
                        if (window.UI) UI.loading(false);
                        logCloudSyncIssue('云端同步失败:', cloudErr);
                        alert(`✅ 成功导入 ${count} 条任课信息！\n\n⚠️ 但云端同步失败：${cloudErr.message}\n\n请手动点击右上角【保存修改并同步云端】按钮。`);
                    }
                } else {
                    if (window.UI) UI.loading(false);
                    alert(`✅ 成功导入 ${count} 条任课信息！`);
                }

                input.value = '';

            } catch (err) {
                if (window.UI) UI.loading(false);
                console.error('Excel导入错误:', err);
                alert("❌ 解析失败：" + err.message + "\n\n请确保：\n1. Excel文件格式正确 (.xlsx 或 .xls)\n2. 包含'班级'、'学科'、'教师'列\n3. 数据格式符合要求");
            }
        };

        reader.onerror = function () {
            if (window.UI) UI.loading(false);
            alert('❌ 文件读取失败，请重试');
        };

        reader.readAsArrayBuffer(file);
    },

    renderTeachers: function () {
        const tbody = document.querySelector('#dm-teacher-table tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        const sel = document.getElementById('dm-teacher-school-select');
        const selectedSchool = sel ? sel.value : "";

        const termSel = document.getElementById('dm-teacher-term-select');
        if (termSel && termSel.options && termSel.options.length <= 1) {
            const txt = termSel.options[0]?.textContent || '';
            if (txt.includes('暂无学期')) {
                this.renderTeacherTermSelect();
            }
        }

        const classSchoolMap = (typeof getClassSchoolMapForAllData === 'function') ? getClassSchoolMapForAllData() : {};
        const inferredSchool = (typeof inferDefaultSchoolFromContext === 'function') ? inferDefaultSchoolFromContext() : '';

        let list = Object.entries(TEACHER_MAP).map(([key, name]) => {
            const parts = key.split('_');
            const clsName = parts[0];
            const subject = parts.length > 1 ? parts[1] : '(未知)';

            let schoolName = "未知/未上传";
            const explicitSchool = String((window.TEACHER_SCHOOL_MAP || {})[key] || '').trim();
            const normalizedClass = normalizeClass(clsName);
            if (explicitSchool) {
                schoolName = explicitSchool;
            } else if (normalizedClass && classSchoolMap[normalizedClass]) {
                schoolName = classSchoolMap[normalizedClass];
            } else if (typeof SCHOOLS !== 'undefined') {
                for (const [schName, schData] of Object.entries(SCHOOLS)) {
                    if (schData.students && schData.students.some(s => normalizeClass(s.class) === normalizedClass)) {
                        schoolName = schName;
                        break;
                    }
                }
            }
            if ((schoolName === '未知/未上传') && inferredSchool) {
                schoolName = inferredSchool;
            }
            return { key, class: clsName, subject, name, school: schoolName };
        });

        if (list.length > 0) {
            const schoolCounts = {};
            list.forEach(t => {
                if (t.school && !t.school.includes("未知")) {
                    schoolCounts[t.school] = (schoolCounts[t.school] || 0) + 1;
                }
            });

            let maxCount = 0;
            let autoDetectedSchool = "";
            for (const [sch, count] of Object.entries(schoolCounts)) {
                if (count > maxCount) {
                    maxCount = count;
                    autoDetectedSchool = sch;
                }
            }

            if (autoDetectedSchool && !readCurrentSchool()) {
                writeCurrentSchool(autoDetectedSchool);
                appDebug(`🤖 系统已自动将本校锁定为：${autoDetectedSchool}`);

                const mainSelect = document.getElementById('mySchoolSelect');
                if (mainSelect) {
                    mainSelect.value = autoDetectedSchool;
                    setTimeout(() => {
                    }, 100);
                }
                updateStatusPanel();

                if (window.UI && list.length > 5) { // 只有数据量足够时才提示
                }
            }
        }

        if (selectedSchool) {
            list = list.filter(t => sameAppSchoolName(t.school, selectedSchool));
        }

        list.sort((a, b) => {
            if (a.school !== b.school) return a.school.localeCompare(b.school);
            if (a.class !== b.class) return a.class.localeCompare(b.class, undefined, { numeric: true });
            return a.subject.localeCompare(b.subject);
        });

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">暂无任课数据 (或未匹配到该校班级)</td></tr>';
        } else {
            const displayList = list.slice(0, 500);

            const teacherRowsHtml = displayList.map(t => {
                const schoolStyle = t.school.includes("未知") ? "color:#94a3b8; font-style:italic;" : "color:#475569;";
                const keyArg = this.dataManagerJsStringLiteral(t.key);
                const nameArg = this.dataManagerJsStringLiteral(t.name);
                return `
                    <tr>
                        <td style="${schoolStyle}">${this.escapeDataManagerHtml(t.school)}</td>
                        <td style="font-weight:bold;">${this.escapeDataManagerHtml(t.class)}</td>
                        <td><span class="badge" style="background:#f1f5f9; color:#475569;">${this.escapeDataManagerHtml(t.subject)}</span></td>
                        <td style="font-weight:bold; color:#1e293b;">${this.escapeDataManagerHtml(t.name)}</td>
                        <td>
                            <button class="btn btn-sm btn-primary" onclick="DataManager.editTeacher(${keyArg}, ${nameArg})" style="padding:2px 6px; font-size:11px;">修改</button>
                            <button class="btn btn-sm btn-danger" onclick="DataManager.deleteTeacher(${keyArg})" style="padding:2px 6px; background:#dc2626; font-size:11px;">删除</button>
                        </td>
                    </tr>`;
            });

            if (list.length > 500) {
                teacherRowsHtml.push(`<tr><td colspan="5" style="text-align:center; color:#999; padding:5px;">... 数据过多，仅显示前 500 条 ...</td></tr>`);
            }
            tbody.innerHTML = teacherRowsHtml.join('');
        }
    },


    deleteStudent: function (index) {
        const s = RAW_DATA[index];
        if (!s) return;
        if (!confirm(`⚠️ 确定要永久删除学生【${s.school} ${s.class}班 ${s.name}】吗？`)) return;
        RAW_DATA.splice(index, 1);
        this.studentSelection.clear();
        this.renderCurrentTab();
        UI.toast("已暂存删除 (请点击保存)", "info");
    },

    editStudent: function (index) {
        const s = RAW_DATA[index];
        const nameValue = this.escapeDataManagerHtml(s.name);
        const classValue = this.escapeDataManagerHtml(s.class);
        const idValue = this.escapeDataManagerHtml(s.id);
        const schoolValue = this.escapeDataManagerHtml(s.school);
        Swal.fire({
            title: '编辑学生信息',
            html: `<div style="text-align:left; font-size:14px; line-height:2.5;">
                <label style="width:50px; display:inline-block;">姓名:</label> <input id="swal-name" class="swal2-input" value="${nameValue}" style="width:200px; height:30px; margin:0;"><br>
                <label style="width:50px; display:inline-block;">班级:</label> <input id="swal-class" class="swal2-input" value="${classValue}" style="width:200px; height:30px; margin:0;"><br>
                <label style="width:50px; display:inline-block;">考号:</label> <input id="swal-id" class="swal2-input" value="${idValue}" style="width:200px; height:30px; margin:0;"><br>
                <label style="width:50px; display:inline-block;">学校:</label> <input id="swal-school" class="swal2-input" value="${schoolValue}" style="width:200px; height:30px; margin:0;"><br>
                <label style="width:50px; display:inline-block;">状态:</label>
                <select id="swal-status" class="swal2-input" style="width:200px; height:30px; margin:0;">
                    <option value="active">正常</option>
                    <option value="transfer_in">转入</option>
                    <option value="transfer_out">转出</option>
                    <option value="leave">休学/借读</option>
                </select>
            </div>`,
            showCancelButton: true,
            confirmButtonText: '暂存修改',
            didOpen: () => {
                const st = document.getElementById('swal-status');
                const saved = (s.status || (COHORT_DB?.students?.[s.uuid]?.status)) || 'active';
                if (st) st.value = saved;
            },
            preConfirm: () => ({
                name: document.getElementById('swal-name').value.trim(),
                class: document.getElementById('swal-class').value.trim(),
                id: document.getElementById('swal-id').value.trim(),
                school: document.getElementById('swal-school').value.trim(),
                status: document.getElementById('swal-status').value
            })
        }).then((result) => {
            if (result.isConfirmed) {
                const n = result.value;
                if (!n.name || !n.class) return;
                Object.assign(s, n);
                if (s.uuid && COHORT_DB && COHORT_DB.students && COHORT_DB.students[s.uuid]) {
                    COHORT_DB.students[s.uuid].status = n.status || 'active';
                }
                this.renderCurrentTab();
                UI.toast("已修改 (请点击保存)", "success");
            }
        });
    },

    editTeacher: function (key, oldName) {
        const newName = prompt(`修改 [${key.replace('_', ' ')}] 的任课教师：`, oldName);
        if (newName && newName.trim()) {
            setTeacherMap({ ...TEACHER_MAP, [key]: newName.trim() });
            this.syncTeacherHistory();
            this.renderTeachers();
            UI.toast("已修改 (需点击保存)", "info");
        }
    },

    deleteTeacher: function (key) {
        if (!confirm(`确定移除【${key.replace('_', ' ')}】的任课信息吗？`)) return;
        delete TEACHER_MAP[key];
        delete TEACHER_SCHOOL_MAP[key];
        setTeacherMap(TEACHER_MAP);
        setTeacherSchoolMap(TEACHER_SCHOOL_MAP);
        this.syncTeacherHistory();
        this.renderTeachers();
        UI.toast("已移除 (需点击保存)", "info");
    },

    addTeacher: function () {
        Swal.fire({
            title: '新增任课',
            html: `<div style="text-align:left; font-size:14px; line-height:2.5;">
                <label style="width:60px;">班级:</label> <input id="add-cls" class="swal2-input" placeholder="如: 701" style="width:180px; height:30px;"><br>
                <label style="width:60px;">学科:</label> <input id="add-sub" class="swal2-input" placeholder="如: 语文" style="width:180px; height:30px;"><br>
                <label style="width:60px;">教师:</label> <input id="add-name" class="swal2-input" placeholder="姓名" style="width:180px; height:30px;">
            </div>`,
            confirmButtonText: '添加', showCancelButton: true,
            preConfirm: () => ({
                cls: document.getElementById('add-cls').value.trim(),
                sub: document.getElementById('add-sub').value.trim(),
                name: document.getElementById('add-name').value.trim()
            })
        }).then((result) => {
            if (result.isConfirmed) {
                const d = result.value;
                if (!d.cls || !d.sub || !d.name) return alert("请填写完整");
                const key = `${normalizeClass(d.cls)}_${normalizeSubject(d.sub)}`;
                const school = String(document.getElementById('dm-teacher-school-select')?.value || readCurrentSchool() || '').trim();
                const previousSchool = String((TEACHER_SCHOOL_MAP || {})[key] || '').trim();
                if (previousSchool && school && !sameAppSchoolName(previousSchool, school)) {
                    return alert(requireDataManagerTeacherRuntime().formatTeacherSchoolOwnershipConflictMessage(key, previousSchool, school));
                }
                setTeacherMap({ ...TEACHER_MAP, [key]: d.name });
                if (school) setTeacherSchoolMap({ ...TEACHER_SCHOOL_MAP, [key]: school });
                this.syncTeacherHistory();
                this.renderTeachers();
                UI.toast("添加成功 (需点击保存)", "success");
            }
        });
    },


    renderArchives: function () {
        const examStats = {};
        if (typeof HISTORY_ARCHIVE !== 'undefined') {
            Object.keys(HISTORY_ARCHIVE).forEach(uid => {
                const records = HISTORY_ARCHIVE[uid];
                records.forEach(r => { if (!examStats[r.exam]) examStats[r.exam] = 0; examStats[r.exam]++; });
            });
        }
        const tbody = document.getElementById('dm-history-tbody');
        if (!tbody) return;

        if (Object.keys(examStats).length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:15px; color:#999;">暂无历史轨迹数据</td></tr>';
        } else {
            let html = '';
            Object.keys(examStats).forEach(examName => {
                const examArg = this.dataManagerJsStringLiteral(examName);
                html += `<tr><td style="font-weight:bold;">${this.escapeDataManagerHtml(examName)}</td><td>${examStats[examName]} 条记录</td><td><button class="btn btn-sm btn-primary" onclick="DataManager.renameHistoryExam(${examArg})" style="padding:2px 6px;">重命名</button> <button class="btn btn-sm btn-danger" onclick="DataManager.deleteHistoryExam(${examArg})" style="padding:2px 6px; background:#dc2626;">删除</button></td></tr>`;
            });
            tbody.innerHTML = html;
        }
        if (this.currentTab === 'archive') { this.loadCloudSnapshots(); }
    },

    deleteHistoryExam: function (examName) {
        if (!confirm(`⚠️ 确定要删除【${examName}】吗？`)) return;
        Object.keys(HISTORY_ARCHIVE).forEach(key => {
            HISTORY_ARCHIVE[key] = HISTORY_ARCHIVE[key].filter(r => r.exam !== examName);
            if (HISTORY_ARCHIVE[key].length === 0) delete HISTORY_ARCHIVE[key];
        });
        this.renderArchives();
        UI.toast("已删除", "success");
    },

    renameHistoryExam: function (oldName) {
        const newName = prompt("重命名为：", oldName);
        if (!newName) return;
        Object.values(HISTORY_ARCHIVE).forEach(records => {
            records.forEach(r => { if (r.exam === oldName) r.exam = newName; });
        });
        this.renderArchives();
    },

    loadCloudSnapshots: async function () {
        return requireDataCloudRuntime().loadCloudSnapshots(this);
    },

    deleteCloudSnapshot: async function (key) {
        return requireDataCloudRuntime().deleteCloudSnapshot(this, key);
    },

    getDataManagerSyncStorageKey: function () {
        return requireDataCloudRuntime().getDataManagerSyncStorageKey();
    },

    getDataManagerSyncScope: function () {
        return requireDataCloudRuntime().getDataManagerSyncScope();
    },

    readDataManagerSyncState: function () {
        return requireDataCloudRuntime().readDataManagerSyncState();
    },

    writeDataManagerSyncState: function (patch) {
        return requireDataCloudRuntime().writeDataManagerSyncState(patch);
    },

    getCurrentIndicatorValues: function () {
        return requireDataCloudRuntime().getCurrentIndicatorValues();
    },

    getParamsSyncSignature: function () {
        return requireDataCloudRuntime().getParamsSyncSignature();
    },

    getTargetsSyncSignature: function () {
        return requireDataCloudRuntime().getTargetsSyncSignature();
    },

    buildTeacherSignature: function (teacherMap, schoolMap) {
        return requireDataCloudRuntime().buildTeacherSignature(teacherMap, schoolMap);
    },

    getTeacherStatusSnapshot: function () {
        return requireDataCloudRuntime().getTeacherStatusSnapshot();
    },

    rememberDataManagerSyncSnapshot: function (sourceLabel = '统一保存同步') {
        return requireDataCloudRuntime().rememberDataManagerSyncSnapshot(this, sourceLabel);
    },

    getDataManagerStatusModel: function () {
        return requireDataCloudRuntime().getDataManagerStatusModel(this);
    },

    renderDataManagerStatus: function () {
        return requireDataCloudRuntime().renderDataManagerStatus(this);
    },

    renderParams: function () {
        if (!isIndicatorPromptAllowed()) {
            const area = document.getElementById('dm-params-area');
            if (area) area.style.display = 'none';
            this.renderDataManagerStatus();
            return;
        }
        ensureSupportSysVars();

        let i1 = readIndicatorState().ind1;
        let i2 = readIndicatorState().ind2;

        if (!i1 && !i2) {
            this.restoreGrade9IndicatorTemplate();
            i1 = readIndicatorState().ind1;
            i2 = readIndicatorState().ind2;
        }

        const mainInput1 = document.getElementById('ind1');
        const mainInput2 = document.getElementById('ind2');

        if (!i1 && mainInput1) i1 = mainInput1.value;
        if (!i2 && mainInput2) i2 = mainInput2.value;

        const el1 = document.getElementById('dm_ind1_input');
        const el2 = document.getElementById('dm_ind2_input');

        if (el1) {
            el1.value = i1 || '';
            el1.oninput = function () {
                setIndicatorState({ ...readIndicatorState(), ind1: this.value });
                if (window.DataManager && typeof DataManager.renderDataManagerStatus === 'function') {
                    DataManager.renderDataManagerStatus();
                }
            };
        }
        if (el2) {
            el2.value = i2 || '';
            el2.oninput = function () {
                setIndicatorState({ ...readIndicatorState(), ind2: this.value });
                if (window.DataManager && typeof DataManager.renderDataManagerStatus === 'function') {
                    DataManager.renderDataManagerStatus();
                }
            };
        }
        this.renderDataManagerStatus();
    },

    saveParamsLocally: async function (skipCloudSync = false) {
        ensureSupportSysVars();

        const currentIndicator = readIndicatorState();
        const v1 = String(document.getElementById('dm_ind1_input')?.value || '').trim() || currentIndicator.ind1 || '';
        const v2 = String(document.getElementById('dm_ind2_input')?.value || '').trim() || currentIndicator.ind2 || '';
        const highSchoolLine = String(document.getElementById('dm_high_school_line_input')?.value || '').trim() || currentIndicator.highSchoolLine || '';
        if (!isIndicatorAllowed() && !highSchoolLine) return;

        setIndicatorState({ ind1: v1, ind2: v2, highSchoolLine });

        const main1 = document.getElementById('ind1');
        const main2 = document.getElementById('ind2');
        if (main1) main1.value = v1;
        if (main2) main2.value = v2;
        this.persistGrade9IndicatorTemplate();

        if (!skipCloudSync && typeof saveCloudData === 'function') {
            UI.toast('💾 参数已暂存，正在同步云端...', 'info');
            const ok = await saveCloudData({ background: false, forceUpload: true, sourceLabel: 'params-save' });
            if (ok) {
                UI.toast('✅ 参数已同步到云端', 'success');
            } else {
                UI.toast('⚠️ 参数已暂存，本次未成功同步到云端', 'warning');
            }
        } else {
            UI.toast('✅ 参数已暂存到内存 (未连接云端)', 'success');
        }
    },

    renderTargets: function () {
        const tbody = document.getElementById('dm-targets-tbody');
        if (!tbody) return;

        readTargetsState();
        ensureNormalizedTargets();
        if (Object.keys(readTargetsState()).length === 0) {
            this.restoreGrade9TargetsTemplate();
            ensureNormalizedTargets();
        }

        const list = Object.keys(readTargetsState()).sort();
        this.renderSchoolAliasMappings();

        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:30px; color:#999;">暂无数据，请先点击上方按钮导入 Excel</td></tr>';
            return;
        }

        let html = '';
        list.forEach(sch => {
            const t = readTargetsState()[sch];
            const schoolArg = this.dataManagerJsStringLiteral(sch);
            html += `<tr><td style="font-weight:bold;">${this.escapeDataManagerHtml(sch)}</td><td>${t.t1}</td><td>${t.t2}</td><td><button class="btn btn-sm btn-primary" onclick="DataManager.editTarget(${schoolArg})" style="padding:2px 6px;">修改</button> <button class="btn btn-sm btn-danger" onclick="DataManager.deleteTarget(${schoolArg})" style="padding:2px 6px;">删除</button></td></tr>`;
        });
        tbody.innerHTML = html;
        this.renderDataManagerStatus();
    },

    renderSchoolAliasMappings: function () {
        const defaultTbody = document.getElementById('dm-default-school-aliases-tbody');
        const customTbody = document.getElementById('dm-custom-school-aliases-tbody');
        const summaryEl = document.getElementById('dm-school-aliases-summary');
        if (!defaultTbody && !customTbody && !summaryEl) return;

        const defaultRows = SCHOOL_ALIAS_GROUPS
            .slice()
            .sort((a, b) => String(a.canonical || '').localeCompare(String(b.canonical || ''), 'zh-CN'));
        const customRows = ensureSchoolAliasStore()
            .slice()
            .map((item, index) => ({ index, canonical: String(item?.canonical || '').trim(), alias: String(item?.alias || '').trim() }))
            .filter(item => item.canonical && item.alias)
            .sort((a, b) => {
                const byCanonical = a.canonical.localeCompare(b.canonical, 'zh-CN');
                return byCanonical !== 0 ? byCanonical : a.alias.localeCompare(b.alias, 'zh-CN');
            });

        if (summaryEl) {
            summaryEl.innerHTML = `默认规则 <strong>${defaultRows.length}</strong> 组，自定义补充 <strong>${customRows.length}</strong> 条。系统会优先保留“实验学校”等关键区分，避免把相近学校误并。`;
        }

        if (defaultTbody) {
            defaultTbody.innerHTML = defaultRows.map(row => `
                <tr>
                    <td style="font-weight:700;">${row.canonical}</td>
                    <td>${(row.aliases || []).join('、') || '-'}</td>
                    <td><span class="badge" style="background:#e2e8f0; color:#475569;">系统默认</span></td>
                </tr>
            `).join('') || '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">暂无默认规则</td></tr>';
        }

        if (customTbody) {
            customTbody.innerHTML = customRows.map(row => `
                <tr>
                    <td style="font-weight:700;">${row.canonical}</td>
                    <td>${row.alias}</td>
                    <td>
                        <button class="btn btn-sm btn-primary" onclick="DataManager.openSchoolAliasEditor(${row.index})" style="padding:2px 8px;">修改</button>
                        <button class="btn btn-sm btn-danger" onclick="DataManager.deleteSchoolAliasMapping(${row.index})" style="padding:2px 8px;">删除</button>
                    </td>
                </tr>
            `).join('') || '<tr><td colspan="3" style="text-align:center; color:#94a3b8;">暂无自定义对应，可点击上方“新增对应”补充。</td></tr>';
        }
        this.renderDataManagerStatus();
    },

    syncSchoolAliasSettingsFromGateway: async function () {
        const user = typeof getCurrentUser === 'function' ? getCurrentUser() : (window.Auth?.currentUser || null);
        const role = String(user?.role || '').trim();
        if (role !== 'admin' && role !== 'director') {
            return false;
        }
        if (!(window.EdgeGateway && typeof EdgeGateway.listAliasRules === 'function' && EdgeGateway.canUseAuthorizedRequests())) {
            return false;
        }
        const data = await EdgeGateway.listAliasRules();
        const remoteRows = mapGatewaySchoolAliasRows(data?.records || []);
        replaceCustomSchoolAliasStore(remoteRows);
        this.renderSchoolAliasMappings();
        return true;
    },

    persistSchoolAliasSettings: async function () {
        ensureSchoolAliasStore();
        persistSchoolAliasSettingsLocal();
        let gatewayOk = false;
        let gatewayError = null;
        if (window.EdgeGateway && typeof EdgeGateway.saveAliasRules === 'function' && EdgeGateway.canUseAuthorizedRequests()) {
            try {
                await EdgeGateway.saveAliasRules(buildSchoolAliasGatewayRows(), { replace_scope: true });
                gatewayOk = true;
            } catch (err) {
                gatewayError = err;
                console.warn('[EdgeGateway] school alias save failed:', err?.message || err);
            }
        }
        let snapshotOk = false;
        if (typeof saveCloudData === 'function') {
            const ok = await saveCloudData({ background: true, sourceLabel: 'school-alias-save' });
            snapshotOk = !!ok;
        }
        this.renderDataManagerStatus();
        if (!(gatewayOk || snapshotOk) && gatewayError) throw gatewayError;
        return gatewayOk || snapshotOk;
    },

    openSchoolAliasEditor: function (index = -1) {
        const list = ensureSchoolAliasStore();
        const current = index >= 0 ? (list[index] || {}) : {};
        Swal.fire({
            title: index >= 0 ? '修改学校名称对应' : '新增学校名称对应',
            html: `
                <div style="text-align:left; line-height:2.2;">
                    <label>规范学校名</label>
                    <input id="swal-school-canonical" class="swal2-input" placeholder="如：银山实验学校" value="${String(current.canonical || '').replace(/"/g, '&quot;')}">
                    <label>别名/导入名称</label>
                    <input id="swal-school-alias" class="swal2-input" placeholder="如：银山镇实验学校" value="${String(current.alias || '').replace(/"/g, '&quot;')}">
                    <div style="font-size:12px; color:#64748b; margin-top:6px;">提示：这里用于补充你自己的学校名称对应。系统默认规则仍会保留，不会把“中学”和“实验学校”混在一起。</div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: '保存',
            cancelButtonText: '取消',
            focusConfirm: false,
            preConfirm: () => {
                const canonical = String(document.getElementById('swal-school-canonical')?.value || '').trim();
                const alias = String(document.getElementById('swal-school-alias')?.value || '').trim();
                if (!canonical || !alias) {
                    Swal.showValidationMessage('规范学校名和别名都不能为空');
                    return false;
                }
                if (sanitizeSchoolText(canonical) === sanitizeSchoolText(alias)) {
                    Swal.showValidationMessage('别名与规范学校名完全相同，无需重复添加');
                    return false;
                }
                const duplicate = list.findIndex((item, idx) =>
                    idx !== index &&
                    sanitizeSchoolText(item?.alias || '') === sanitizeSchoolText(alias)
                );
                if (duplicate >= 0) {
                    Swal.showValidationMessage(`别名“${alias}”已存在于自定义对应表中`);
                    return false;
                }
                return { canonical, alias };
            }
        }).then(async (result) => {
            if (!result.isConfirmed || !result.value) return;
            const next = ensureSchoolAliasStore().slice();
            if (index >= 0) next[index] = result.value;
            else next.push(result.value);
            setSchoolAliasState(next);
            this.renderSchoolAliasMappings();
            try {
                await this.persistSchoolAliasSettings();
                if (window.UI) UI.toast('学校名称对应已保存', 'success');
            } catch (e) {
                if (window.UI) UI.toast('学校名称对应已暂存到本地，云端同步失败', 'warning');
            }
        });
    },

    deleteSchoolAliasMapping: async function (index) {
        const list = ensureSchoolAliasStore().slice();
        const current = list[index];
        if (!current) return;
        if (!confirm(`确定删除对应：${current.alias} → ${current.canonical} 吗？`)) return;
        list.splice(index, 1);
        setSchoolAliasState(list);
        this.renderSchoolAliasMappings();
        try {
            await this.persistSchoolAliasSettings();
            if (window.UI) UI.toast('学校名称对应已删除', 'success');
        } catch (e) {
            if (window.UI) UI.toast('已删除本地对应，但云端同步失败', 'warning');
        }
    },

    handleTargetUpload: function (input) {
        if (isArchiveLocked()) return alert("⛔ 当前考试已封存，禁止导入目标人数");
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async function (e) {
            try {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                if (json.length === 0) return alert("空表格");

                let successCount = 0;
                let errorCount = 0;
                let dupCount = 0;
                const seen = new Set();
                const errors = [];

                json.forEach((row, idx) => {
                    const rowNo = idx + 2;
                    const rawName = row['学校名称'] || row['学校'];
                    const t1Key = Object.keys(row).find(k => k.includes('指标一') || k.includes('目标一'));
                    const t2Key = Object.keys(row).find(k => k.includes('指标二') || k.includes('目标二'));

                    if (!rawName) {
                        errorCount++;
                        errors.push(`第 ${rowNo} 行：学校名称为空`);
                        return;
                    }
                    const existingKey = resolveSchoolNameFromCollection(window.TARGETS || {}, rawName);
                    const name = getCanonicalSchoolName(rawName, [...Object.keys(window.TARGETS || {}), ...Object.keys(SCHOOLS || {}), rawName]);
                    const seenKey = normalizeSchoolName(name) || name;
                    if (seen.has(seenKey)) {
                        dupCount++;
                    }
                    seen.add(seenKey);

                    const t1 = parseInt(row[t1Key] || row['指标一目标人数'] || 0);
                    const t2 = parseInt(row[t2Key] || row['指标二目标人数'] || 0);

                    if (isNaN(t1) || isNaN(t2)) {
                        errorCount++;
                        errors.push(`第 ${rowNo} 行：目标人数非数字 (${name})`);
                        return;
                    }

                    if (existingKey && existingKey !== name) delete window.TARGETS[existingKey];
                    window.TARGETS[name] = { t1, t2 };
                    successCount++;
                });

                DataManager.renderTargets();
                DataManager.persistGrade9TargetsTemplate();

                if (typeof saveCloudData === 'function') {
                    const ok = await saveCloudData({ background: true, sourceLabel: 'targets-upload' });
                    if (window.UI) {
                        UI.toast(ok ? "✅ 目标数据已写入本地缓存，云端正在后台同步" : "⚠️ 目标数据已暂存，本次未成功同步云端", ok ? "success" : "warning");
                    }
                }

                const msg = `✅ 导入完成：成功 ${successCount} 条，重复 ${dupCount} 条，错误 ${errorCount} 条。`;
                if (errors.length > 0 && typeof Swal !== 'undefined') {
                    Swal.fire('导入结果', `<div style="text-align:left; font-size:12px;">${msg}<br><br>${errors.slice(0, 8).join('<br>')}${errors.length > 8 ? '<br>...' : ''}</div>`, errorCount > 0 ? 'warning' : 'success');
                } else {
                    alert(msg);
                }
                input.value = '';
            } catch (err) { alert("失败：" + err.message); }
        };
        reader.readAsArrayBuffer(file);
    },

    editTarget: function (schoolName) {
        const t = window.TARGETS[schoolName] || { t1: 0, t2: 0 };
        Swal.fire({
            title: `编辑目标 - ${schoolName}`,
            html: `<div style="text-align:left;line-height:2.5;"><label>指标一:</label><input id="swal-t1" type="number" class="swal2-input" value="${t.t1}" style="width:100px;height:30px;"><br><label>指标二:</label><input id="swal-t2" type="number" class="swal2-input" value="${t.t2}" style="width:100px;height:30px;"></div>`,
            showCancelButton: true,
            confirmButtonText: '确定',
            preConfirm: () => ({ t1: parseInt(document.getElementById('swal-t1').value) || 0, t2: parseInt(document.getElementById('swal-t2').value) || 0 })
        }).then(async (result) => {
            if (result.isConfirmed) {
                window.TARGETS[schoolName] = result.value;
                this.renderTargets();
                this.persistGrade9TargetsTemplate();
                if (typeof saveCloudData === 'function') {
                    const ok = await saveCloudData({ background: true, sourceLabel: 'targets-edit' });
                    if (window.UI) UI.toast(ok ? "✅ 目标修改已暂存，云端正在后台同步" : "⚠️ 目标修改已暂存，本次未成功同步云端", ok ? "success" : "warning");
                }
            }
        });
    },

    deleteTarget: async function (schoolName) {
        if (!confirm("确定删除？")) return;
        delete window.TARGETS[schoolName];
        this.renderTargets();
        this.persistGrade9TargetsTemplate();
        if (typeof saveCloudData === 'function') {
            const ok = await saveCloudData({ background: true, sourceLabel: 'targets-delete' });
            if (window.UI) UI.toast(ok ? "✅ 目标删除已暂存，云端正在后台同步" : "⚠️ 目标删除已暂存，本次未成功同步云端", ok ? "success" : "warning");
        }
        this.renderDataManagerStatus();
    },

    saveAndSync: async function () {
        if (isArchiveLocked()) return alert("⛔ 当前考试已封存，仅支持只读查看");
        if (!confirm("⚠️ 确定要应用所有修改并同步到云端吗？\n\n1. 系统将重算排名\n2. 目标/参数将被保存")) return;

        UI.loading(true, "正在保存...");

        try {
            await this.saveParamsLocally(true);
            this.syncTeacherHistory();
            setTargetsState(ensureNormalizedTargets());
            setSchoolAliasState(ensureSchoolAliasStore());

            if (window.RAW_DATA && window.RAW_DATA.length) {
                try {
                    await processData();
                    renderTables();
                } catch (e) {
                    console.warn('重算失败，仍将同步云端：', e);
                }
            }

            const ok = await saveCloudData({ background: true, sourceLabel: 'save-and-sync' });
            if (!ok) throw new Error('云端同步任务未能创建');

            UI.loading(false);
            Swal.fire('成功', '数据已更新，本地已秒级生效，云端正在后台同步。', 'success');
        } catch (e) {
            UI.loading(false);
            alert("保存失败: " + e.message);
        }
    }
}; // DataManager 对象结束；SQL 相关逻辑已拆分到 public/assets/js/data-manager-sql.js
