(function (root, factory) {
    const runtime = factory(root || {});

    if (typeof module === 'object' && module.exports) {
        const createRuntime = function (overrideRoot) {
            return factory(overrideRoot || root || {});
        };
        createRuntime.runtime = runtime;
        module.exports = createRuntime;
    }

    if (!root || root.HelpSystemRuntime) return;
    root.HelpSystemRuntime = runtime;
})(typeof globalThis !== 'undefined' ? globalThis : this, function createHelpSystemRuntime(root) {
    const TOUR_SEEN_KEY = 'hasSeenV3Tour';

    function getSwal() {
        return root.Swal && typeof root.Swal.fire === 'function' ? root.Swal : null;
    }

    function safeAlert(message) {
        if (typeof root.alert === 'function') root.alert(message);
    }

    function getStorage() {
        try {
            return root.localStorage || null;
        } catch (_) {
            return null;
        }
    }

    function getSeenTour() {
        const storage = getStorage();
        if (!storage || typeof storage.getItem !== 'function') return false;
        try {
            return !!storage.getItem(TOUR_SEEN_KEY);
        } catch (_) {
            return false;
        }
    }

    function markSeenTour() {
        const storage = getStorage();
        if (!storage || typeof storage.setItem !== 'function') return;
        try {
            storage.setItem(TOUR_SEEN_KEY, 'true');
        } catch (_) { }
    }

    function getScheduler() {
        if (typeof root.setTimeout === 'function') return root.setTimeout.bind(root);
        if (typeof setTimeout === 'function') return setTimeout;
        return function (fn) {
            if (typeof fn === 'function') fn();
            return 0;
        };
    }

    function getDocument() {
        return root.document || null;
    }

    function createDefaultContent() {
        return {
            upload: {
                title: '📁 数据上传规范',
                html: `
                    <div style="text-align:left; line-height:1.6;">
                        <p><strong>1. Excel 格式要求：</strong></p>
                        <ul>
                            <li>第一行必须是表头（如：姓名、班级、语文、数学...）。</li>
                            <li>必须包含<strong>姓名</strong>列。</li>
                            <li>如果有多个学校，请使用不同的 Sheet 页，<strong>Sheet名称即为学校名</strong>。</li>
                        </ul>
                        <p style="margin-top:10px;"><strong>2. 常见问题：</strong></p>
                        <ul>
                            <li>缺考/作弊：可填 "0" 或 "缺考"（系统按0分处理）。</li>
                            <li>列名识别：系统支持“语文/语/Chinese”等多种别名自动识别。</li>
                        </ul>
                    </div>
                `,
                icon: 'info'
            },
            macro: {
                title: '📊 两率一分算法说明',
                html: `
                    <div style="text-align:left;">
                        <p><strong>核心公式：</strong></p>
                        <p>总分 = (均分赋分) + (优率赋分) + (及格赋分)</p>
                        <hr style="margin:10px 0; border:0; border-top:1px dashed #eee;">
                        <p><strong>默认权重配置：</strong></p>
                        <ul>
                            <li><strong>6-8年级：</strong> 均分60 + 优率70 + 及格70 = 满分200</li>
                            <li><strong>9年级：</strong> 均分50 + 优率80 + 及格50 = 满分180</li>
                        </ul>
                        <p style="font-size:12px; color:#666; margin-top:5px;">优秀线统一按当前参照范围前15%划定，及格线按前50%划定。</p>
                        <p style="font-size:12px; color:#666; margin-top:5px;"><strong>考核学科口径：</strong>6/7年级 = 语文·数学·英语（三科总）；8/9年级 = 语文·数学·英语·物理·化学（五科总，未考化学时自动按四科）。政治、历史、地理、生物为展示科目：单科可查、同学科教师可对比，但不计入总分、两率一分与任何考核排名。</p>
                        <p style="font-size:12px; color:#666; margin-top:5px;">* 指标计算基准：以全镇最高值为满分进行归一化折算。</p>
                    </div>
                `
            },
            teacher: {
                title: '👨‍🏫 教师评价模型',
                html: `
                    <div style="text-align:left;">
                        <p>系统现在按“联考赋分 + 基线校正 + 置信修正”评价教师学科绩效：</p>
                        <ol>
                            <li><strong>联考赋分：</strong> 按系统现有“两率一分”口径，对同校同学科教师做赋分。</li>
                            <li><strong>基线校正：</strong> 用最近一次历史考试匹配学生，按同基础分层比较“实际值 - 预计值”。</li>
                            <li><strong>重点学生：</strong> 自动给出培优边缘生、及格临界生、辅差关注生名单。</li>
                        </ol>
                        <div class="info-bar" style="margin-top:10px; font-size:12px;">
                            提示：请先完成任课表同步，并尽量加载最近一次历史考试，基线校正才会更稳定。
                        </div>
                    </div>
                `
            }
        };
    }

    function getTourSteps() {
        return [
            {
                title: '👋 欢迎使用智能教务系统',
                html: '只需 3 步完成一次完整流程：<strong>导入 → 分析 → 导出</strong>。',
                icon: 'info',
                confirmButtonText: '下一步: 导入数据'
            },
            {
                title: '1️⃣ 导入',
                html: '进入<strong>【数据枢纽】</strong>上传 Excel。<br><small style="color:#666">系统自动识别学校、班级与学科。</small>',
                icon: 'info',
                confirmButtonText: '下一步: 分析'
            },
            {
                title: '2️⃣ 分析',
                html: '进入<strong>【校际联考分析】</strong>查看横向排名，<br>进入<strong>【班级教学管理】</strong>看教师贡献度。',
                icon: 'success',
                confirmButtonText: '下一步: 导出'
            },
            {
                title: '3️⃣ 导出',
                html: '进入<strong>【综合分析报告】</strong>或<strong>【成绩单/家长查分】</strong>一键导出。',
                icon: 'success',
                confirmButtonText: '开始使用！'
            }
        ];
    }

    function show(manager, key) {
        const content = manager && manager.content && manager.content[key] ? manager.content[key] : null;
        if (!content) return;

        const swal = getSwal();
        if (!swal) {
            safeAlert(String(content.title || '').trim() || '帮助');
            return;
        }

        swal.fire({
            title: content.title,
            html: content.html,
            icon: 'question',
            confirmButtonText: '明白了',
            confirmButtonColor: '#4f46e5'
        });
    }

    function startTour() {
        const swal = getSwal();
        if (!swal) return;

        const steps = getTourSteps();
        const showStep = (index) => {
            if (index >= steps.length) return;
            swal.fire({
                ...steps[index],
                showCancelButton: index < steps.length - 1,
                cancelButtonText: '跳过教程',
                confirmButtonColor: '#4f46e5',
                allowOutsideClick: false
            }).then((result) => {
                if (result && result.isConfirmed) {
                    showStep(index + 1);
                }
            });
        };

        showStep(0);
    }

    function hasSavedWorkspace() {
        const workspaceRuntime = root.WorkspaceState && typeof root.WorkspaceState === 'object' ? root.WorkspaceState : null;
        if (workspaceRuntime && typeof workspaceRuntime.hasSavedWorkspace === 'function') {
            return !!workspaceRuntime.hasSavedWorkspace();
        }

        const examId = typeof root.readWorkspaceExamId === 'function' ? root.readWorkspaceExamId() : '';
        const projectKey = typeof root.readWorkspaceProjectKey === 'function' ? root.readWorkspaceProjectKey() : '';
        return !!(String(examId || '').trim() || String(projectKey || '').trim());
    }

    function isLoginOverlayVisible() {
        const doc = getDocument();
        if (!doc || typeof doc.getElementById !== 'function') return false;
        const loginOverlay = doc.getElementById('login-overlay');
        if (!loginOverlay) return false;

        const getStyle = typeof root.getComputedStyle === 'function' ? root.getComputedStyle.bind(root) : null;
        if (!getStyle) return false;

        try {
            return getStyle(loginOverlay).display !== 'none';
        } catch (_) {
            return false;
        }
    }

    function hasSessionUser() {
        const authState = root.AuthState && typeof root.AuthState === 'object' ? root.AuthState : null;
        if (!authState || typeof authState.hasActiveSession !== 'function') return false;
        return !!authState.hasActiveSession(root.Auth && root.Auth.currentUser);
    }

    function hasRuntimeScores() {
        return Array.isArray(root.RAW_DATA) && root.RAW_DATA.length > 0;
    }

    function checkFirstRun(manager) {
        if (getSeenTour()) return;
        if (isLoginOverlayVisible()) return;

        if (hasSessionUser() || hasSavedWorkspace() || hasRuntimeScores()) {
            markSeenTour();
            return;
        }

        const schedule = getScheduler();
        schedule(() => {
            if (manager && typeof manager.startTour === 'function') {
                manager.startTour();
            } else {
                startTour();
            }
            markSeenTour();
        }, 1000);
    }

    return {
        createDefaultContent,
        show,
        startTour,
        checkFirstRun
    };
});
