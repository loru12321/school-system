(() => {
    if (typeof window === 'undefined') return;
    if (window.MobMgr && window.__MOBILE_MANAGER_PATCHED__) return;

    function hideDesktopApp() {
        const appEl = document.getElementById('app');
        if (appEl) {
            appEl.classList.add('hidden');
            appEl.style.display = 'none';
        }
        const header = document.querySelector('header');
        if (header) header.style.display = 'none';
        const nav = document.querySelector('.nav-wrapper');
        if (nav) nav.style.display = 'none';
        const subNav = document.getElementById('sub-nav-container');
        if (subNav) subNav.style.display = 'none';
        document.querySelectorAll('.section, .card-box').forEach(el => {
            el.style.display = 'none';
        });
    }

    function showDesktopApp() {
        const appEl = document.getElementById('app');
        if (appEl) {
            appEl.classList.remove('hidden');
            appEl.style.display = '';
        }
        const header = document.querySelector('header');
        if (header) header.style.display = '';
        const nav = document.querySelector('.nav-wrapper');
        if (nav) nav.style.display = '';
        const subNav = document.getElementById('sub-nav-container');
        if (subNav) subNav.style.display = '';
    }

    function getEffectiveViewportWidth() {
        const candidates = [
            Number(window.innerWidth || 0),
            Number(document.documentElement?.clientWidth || 0),
            Number(window.outerWidth || 0),
            Number(window.screen?.width || 0),
            Number(window.screen?.availWidth || 0)
        ].filter(value => Number.isFinite(value) && value > 0);
        return candidates.length ? Math.min(...candidates) : 0;
    }

    const MobMgr = {
        currentTab: 'home',

        init: function () {
            const mobApp = document.getElementById('mobile-manager-app');
            if (!mobApp) {
                console.warn('⚠️ #mobile-manager-app 元素不存在，跳过手机端管理初始化');
                return false;
            }

            hideDesktopApp();
            mobApp.style.display = 'block';

            const user = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
            if (user) {
                const roleMap = { admin: '管理员', teacher: '教师', class_teacher: '班主任', grade_director: '级部主任', director: '教务主任' };
                const roleName = roleMap[user.role] || user.role;
                const setTxt = (id, txt) => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = txt;
                };
                setTxt('mob-user-name', user.name);
                setTxt('mob-user-role', roleName);
                setTxt('mob-me-name', user.name);
                setTxt('mob-me-role', roleName);
            }

            const now = new Date();
            const dateEl = document.getElementById('mob-date-text');
            if (dateEl) dateEl.innerText = `${now.getMonth() + 1}月${now.getDate()}日，祝您工作愉快`;

            const savedCohort = localStorage.getItem('CURRENT_COHORT_ID');
            if (savedCohort && typeof window.CURRENT_COHORT_ID === 'undefined') {
                window.CURRENT_COHORT_ID = savedCohort;
            }

            if (savedCohort) {
                setTimeout(() => {
                    const cohortModal = document.getElementById('cohort-entry-modal');
                    if (cohortModal) cohortModal.style.display = 'none';
                    if (typeof Swal !== 'undefined' && Swal.isVisible && Swal.isVisible()) {
                        Swal.close();
                    }
                }, 500);
            }

            setTimeout(() => this.refreshDataOverview(), 2000);
            this.switchTab('home');
            return true;
        },

        refreshDataOverview: function () {
            try {
                const list = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
                const total = list.length;
                const setTxt = (id, txt) => {
                    const el = document.getElementById(id);
                    if (el) el.innerText = txt;
                };
                if (total > 0) {
                    const allTotal = list.map(s => s.total || 0).reduce((a, b) => a + b, 0);
                    const avg = (allTotal / total).toFixed(1);
                    const passLine = 360;
                    const passCount = list.filter(s => (s.total || 0) >= passLine).length;
                    const passRate = ((passCount / total) * 100).toFixed(1) + '%';
                    setTxt('mob-stat-total', total);
                    setTxt('mob-stat-avg', avg);
                    setTxt('mob-stat-pass', passRate);
                }
            } catch (e) {
                console.warn('MobMgr.refreshDataOverview error:', e);
            }
        },

        switchTab: function (tabId) {
            this.currentTab = tabId;
            document.querySelectorAll('.mob-view').forEach(el => el.classList.remove('active'));
            const targetView = document.getElementById(`mob-view-${tabId}`);
            if (targetView) targetView.classList.add('active');

            document.querySelectorAll('.mob-nav-btn').forEach(btn => btn.classList.remove('active'));
            const activeBtn = Array.from(document.querySelectorAll('.mob-nav-btn')).find(btn => {
                const oc = btn.getAttribute('onclick') || '';
                return oc.includes(`'${tabId}'`);
            });
            if (activeBtn) activeBtn.classList.add('active');

            if (tabId === 'students') this.renderStudentList();
            if (tabId === 'analysis') this.renderAnalysis();
        },

        renderStudentList: function () {
            const container = document.getElementById('mob-student-list');
            if (!container) return;
            const keyword = String(document.getElementById('mob-search-input')?.value || '').toLowerCase();
            const user = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;

            let list = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
            if (user) {
                if (user.school) list = list.filter(s => s.school === user.school);
                if (user.role === 'class_teacher' && user.class) {
                    list = list.filter(s => s.class === user.class);
                }
            }

            if (keyword) {
                list = list.filter(s => String(s.name || '').toLowerCase().includes(keyword) || String(s.id || '').includes(keyword));
            }

            const displayList = list.slice(0, 50);
            if (displayList.length === 0) {
                container.innerHTML = '<div style="text-align:center; padding:30px; color:#999;">无匹配学生<br><small>请尝试搜索姓名</small></div>';
                return;
            }

            container.innerHTML = displayList.map(student => {
                const badgeColor = student.total >= 500 ? '#16a34a' : (student.total >= 360 ? '#2563eb' : '#d97706');
                const schoolArg = encodeURIComponent(String(student.school || ''));
                const classArg = encodeURIComponent(String(student.class || ''));
                const nameArg = encodeURIComponent(String(student.name || ''));
                const idArg = encodeURIComponent(String(student.id || ''));
                return `
                    <div class="mob-list-item" onclick="MobMgr.showStudentDetail('${schoolArg}', '${classArg}', '${nameArg}', '${idArg}')">
                        <div class="mob-avatar">${student.name[0]}</div>
                        <div class="mob-info">
                            <div class="mob-name">${student.name}</div>
                            <div class="mob-detail">${student.class} | 考号:${student.id}</div>
                        </div>
                        <div class="mob-score-badge" style="color:${badgeColor}">${student.total}</div>
                    </div>
                `;
            }).join('');
        },

        showStudentDetail: function (schoolEncoded, classEncoded, nameEncoded, idEncoded) {
            const school = decodeURIComponent(String(schoolEncoded || ''));
            const className = decodeURIComponent(String(classEncoded || ''));
            const name = decodeURIComponent(String(nameEncoded || ''));
            const studentId = decodeURIComponent(String(idEncoded || ''));
            const rows = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
            const stu = rows.find(s => {
                if (String(s?.name || '') !== name) return false;
                if (studentId && String(s?.id || '') !== studentId) return false;
                if (school && String(s?.school || '') !== school) return false;
                if (className && typeof isClassEquivalent === 'function' && !isClassEquivalent(String(s?.class || ''), className)) return false;
                return true;
            }) || rows.find(s => {
                if (studentId && String(s?.id || '') === studentId) return true;
                if (String(s?.name || '') !== name) return false;
                if (school && String(s?.school || '') !== school) return false;
                return className && typeof isClassEquivalent === 'function' ? isClassEquivalent(String(s?.class || ''), className) : true;
            });
            if (!stu || typeof renderInstagramCard !== 'function') return;

            const html = renderInstagramCard(stu);
            const modal = document.createElement('div');
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.background = '#fafafa';
            modal.style.zIndex = '20000';
            modal.style.overflowY = 'auto';
            modal.style.animation = 'fadeIn 0.2s ease-out';
            modal.innerHTML = `
                <div style="position:fixed; top:0; width:100%; padding:10px; background:white; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center; z-index:20001;">
                    <div style="font-weight:bold; color:#333;">学生详情</div>
                    <button onclick="this.closest('div').parentElement.remove()" style="padding:6px 15px; background:#f3f4f6; border:none; border-radius:4px; font-weight:bold; color:#333;">关闭</button>
                </div>
                <div style="padding-top:60px; padding-bottom:40px;">${html}</div>
            `;
            document.body.appendChild(modal);
        },

        renderAnalysis: function () {
            const container = document.getElementById('mob-analysis-content');
            if (!container) return;

            let list = Array.isArray(window.RAW_DATA) ? window.RAW_DATA : [];
            const user = (typeof Auth !== 'undefined' && Auth.currentUser) ? Auth.currentUser : null;
            if (user && user.school) {
                list = list.filter(s => s.school === user.school);
            }

            if (!list.length) {
                container.innerHTML = '<div style="padding:20px;text-align:center;">暂无数据</div>';
                return;
            }

            const total = list.length;
            const allTotal = list.map(s => s.total).reduce((a, b) => a + b, 0);
            const avg = (allTotal / total).toFixed(1);
            container.innerHTML = `
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; text-align:center;">
                    <div style="background:#f8fafc; padding:15px; border-radius:8px; border:1px solid #e2e8f0;">
                        <div style="font-size:24px; font-weight:bold; color:#333;">${total}</div>
                        <div style="font-size:12px; color:#64748b;">本校人数</div>
                    </div>
                    <div style="background:#f0f9ff; padding:15px; border-radius:8px; border:1px solid #bae6fd;">
                        <div style="font-size:24px; font-weight:bold; color:#2563eb;">${avg}</div>
                        <div style="font-size:12px; color:#0369a1;">年级均分</div>
                    </div>
                </div>
                <div style="margin-top:20px; text-align:center; font-size:12px; color:#999;">
                    <i class="ti ti-device-desktop"></i><br>更多复杂分析（如进退步、班级对比）<br>请登录电脑端查看
                </div>
            `;
        }
    };

    window.MobMgr = MobMgr;

    window.switchMobileTab = function (tabName) {
        if (window.MobMgr && typeof MobMgr.switchTab === 'function' && document.getElementById('mobile-manager-app')) {
            const mobApp = document.getElementById('mobile-manager-app');
            if (mobApp && getComputedStyle(mobApp).display === 'none') {
                mobApp.style.display = 'block';
                hideDesktopApp();
            }
            MobMgr.switchTab(tabName);
            return;
        }
        const app = document.getElementById('mobile-app');
        if (app && window.Alpine) {
            Alpine.$data(app).activeTab = tabName;
        } else {
            console.warn("⚠️ 未找到可用的移动端容器，已跳过 switchMobileTab");
        }
    };

    if (typeof Auth !== 'undefined' && typeof Auth.applyRoleView === 'function') {
        const originalApplyRoleView = Auth.applyRoleView;
        Auth.applyRoleView = function () {
            const role = this.currentUser.role;
            const mobApp = document.getElementById('mobile-manager-app');
            const useMobileManager = role !== 'parent' && getEffectiveViewportWidth() <= 768 && !!mobApp && typeof MobMgr.init === 'function';

            if (role === 'parent') {
                this.renderParentView();
                return;
            }

            originalApplyRoleView.call(this);
            if (useMobileManager) {
                MobMgr.init();
                return;
            }

            if (mobApp) mobApp.style.display = 'none';
            showDesktopApp();
        };
    }

    window.__MOBILE_MANAGER_PATCHED__ = true;
})();
