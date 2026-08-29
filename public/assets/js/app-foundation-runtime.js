window.onerror = function (msg, url, lineNo, columnNo, error) {
    // 忽略第三方插件的非关键错误
    const message = String(msg || '');
    if (message.includes('Script error')) return false;
    if (!message && !error) return true;

    console.error('全局错误捕获:', error || message, url ? `@ ${url}:${lineNo}` : '');

    // 仅静默已知的启动加载顺序竞态，其他启动错误仍弹出，避免把真实故障藏起来。
    const isKnownStartupRace = window.__APP_MODULES_LOADED__ !== true
        && /renderNavigation is not defined/i.test(message);
    // Safari/WebKit reports a benign layout notification as a window error
    // when ResizeObserver callbacks settle during a reflow. It is not an
    // application failure and must not open the global error dialog.
    const isResizeObserverNoise = /ResizeObserver loop (completed with undelivered notifications|limit exceeded)/i.test(message);
    if (isKnownStartupRace || isResizeObserverNoise) {
        return true;
    }

    // 如果 SweetAlert2 已加载，用它提示
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: 'error',
            title: '程序遇到意外错误',
            html: `<div style="text-align:left; font-size:12px; color:#666;">
                    <strong>错误信息:</strong> ${msg}<br>
                    <strong>位置:</strong> Line ${lineNo}<br><br>
                    建议操作：<br>1. 刷新页面重试<br>2. 检查上传的 Excel 是否格式正确<br>3. 点击下方按钮尝试清空缓存
                   </div>`,
            showCancelButton: true,
            confirmButtonText: '刷新页面',
            cancelButtonText: '清空缓存并刷新',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33'
        }).then((result) => {
            if (result.isDismissed) { // 用户点击了“清空缓存”
                if (window.idbKeyval && typeof idbKeyval.del === 'function') idbKeyval.del('autosave_backup').finally(() => location.reload());
                else location.reload();
            } else {
                location.reload();
            }
        });
        return true; // 阻止默认的控制台报错
    }
    return false;
};

window.addEventListener('unhandledrejection', function (event) {
    const reason = event && event.reason;
    const message = String(reason && reason.message ? reason.message : reason || '');
    console.warn('未处理的 Promise 拒绝:', message || reason);
    const isExpectedStartupProbe = window.__APP_MODULES_LOADED__ !== true
        && /(not authenticated|auth|session|login|abort|network|failed to fetch)/i.test(message);
    if (isExpectedStartupProbe && event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }
});

function isAppDebugEnabled() {
    if (window.LoggerRuntime && typeof window.LoggerRuntime.isDebugEnabled === 'function') {
        return window.LoggerRuntime.isDebugEnabled();
    }
    try {
        return window.APP_DEBUG === true
            || localStorage.getItem('APP_DEBUG') === '1'
            || new URLSearchParams(window.location.search || '').has('debug');
    } catch (e) {
        return window.APP_DEBUG === true;
    }
}

function appDebug(...args) {
    if (window.LoggerRuntime && typeof window.LoggerRuntime.debug === 'function') {
        window.LoggerRuntime.debug(...args);
        return;
    }
    if (!isAppDebugEnabled()) return;
    console.debug(...args);
}

window.AppDebug = window.AppDebug || {
    isEnabled: isAppDebugEnabled,
    log: appDebug
};

const MOJIBAKE_REPLACEMENTS = [
    ['宸ヤ綔鍙?', '工作台'],
    ['閫氳褰?', '通讯录'],
    ['鎴戠殑', '我的'],
    ['绯荤粺鑳藉姏姒傝', '系统能力概览'],
    ['瀹炴椂浜戠鑱斿姩', '实时云端联动'],
    ['鎶婃暀瀛﹀垎鏋愩€佽处鍙峰叆鍙ｄ笌绠＄悊椹鹃┒鑸辨斁杩涘悓涓€鍧楀叏灞忚垶鍙?', '把教学分析、账号入口与管理驾驶舱放进同一块全屏舞台'],
    ['浠庡鏍″ぇ灞忓埌鏁欏笀宸ヤ綔鍙帮紝鐧诲綍鍓嶅厛鐪嬭鍏抽敭鑳藉姏锛岀櫥褰曞悗鐩存帴杩涘叆鏁版嵁鍒嗘瀽銆佽处鍙风鐞嗕笌浜戠鍚屾閾捐矾銆?', '从学校大屏到教师工作台，登录前先看见关键能力，登录后直接进入数据分析、账号管理与云端同步链路。'],
    ['瀛︽儏杩借釜', '学情追踪'],
    ['澶氳鑹插崗鍚?', '多角色协同'],
    ['鏅鸿兘鎬绘帶鍙?', '智能总控台'],
    ['涓€灞忕洿杈炬垚缁╁垎鏋愩€佹暀瀛︾鐞嗐€佽川閲忛璀︿笌鏁版嵁缁存姢', '一屏直达成绩分析、教学管理、质量预警与数据维护'],
    ['鍍忓唴瀹瑰钩鍙伴椤典竴鏍锋妸楂樹环鍊煎叆鍙ｃ€侀噸鐐规ā鍧楀拰瀹炴椂鐘舵€佺洿鎺ラ摵寮€锛屽噺灏戣烦杞笌瀵绘壘鎴愭湰銆?', '像内容平台首页一样把高价值入口、重点模块和实时状态直接铺开，减少跳转与寻找成本。'],
    ['瑙掕壊浣撶郴', '角色体系'],
    ['缁熶竴鍏ュ彛', '统一入口'],
    ['鏁版嵁閾捐矾', '数据链路'],
    ['鐧诲綍鍗冲悓姝?', '登录即同步'],
    ['缁堢浣撻獙', '终端体验'],
    ['鎵嬫満 / 鐢佃剳', '手机 / 电脑'],
    ['瀛︽牎椹鹃┒鑸?', '学校驾驶舱'],
    ['鎴愮哗銆佸垎灞傘€佹暀瀛︺€侀璀?', '成绩、分层、教学、预警'],
    ['鏁版嵁涓彴', '数据中台'],
    ['璐﹀彿銆佹暟鎹€佸弬鏁扮粺涓€缁存姢', '账号、数据、参数统一维护'],
    ['鎴愰暱鎶ュ憡', '成长报告'],
    ['绾靛悜璺熻釜涓庣彮绾у姣?', '纵向跟踪与班级对比'],
    ['韬唤璁よ瘉', '身份认证'],
    ['瀛︽牎 / 瀹堕暱鍙屽叆鍙ｅ垏鎹?', '学校 / 家长双入口切换'],
    ['鍏ュ彛浣撻獙', '入口体验'],
    ['鍏ㄥ睆娌夋蹈寮?', '全屏沉浸式'],
    ['浜戠閾捐矾', '云端链路'],
    ['澶氱涓€鑷?', '多端一致'],
    ['鎵嬫満涓庣數鑴戝悓姝ヤ綋楠?', '手机与电脑同步体验'],
    ['瀛︽牎绔叆鍙?', '学校端入口'],
    ['鏁欏姟銆佸勾绾с€佺彮涓讳换涓庢暀甯堢粺涓€杩涘叆鏁欏鍒嗘瀽涓庣鐞嗗伐浣滃彴銆?', '教务、年级、班主任与教师统一进入教学分析与管理工作台。'],
    ['瀹堕暱绔?', '家长端'],
    ['鎴愰暱鎶ュ憡 / 鎴愮哗鏌ヨ', '成长报告 / 成绩查询'],
    ['璐﹀彿 / 濮撳悕', '账号 / 姓名'],
    ['绠＄悊鍛樿处鍙?/ 鏁欏笀濮撳悕 / 瀛︾敓濮撳悕', '管理员账号 / 教师姓名 / 学生姓名'],
    ['瀛︽牎绔敮鎸佺鐞嗗憳銆佹暀鍔°€佸勾绾с€佺彮涓讳换涓庢暀甯堣处鍙风櫥褰曘€?', '学校端支持管理员、教务、年级、班主任与教师账号登录。'],
    ['鐝骇', '班级'],
    ['瀛︽牎绔棤闇€濉啓', '学校端无需填写'],
    ['璇疯緭鍏ョ彮绾?(浠呭闀?瀛︾敓蹇呭～)', '请输入班级 (仅家长/学生必填)'],
    ['瀵嗙爜', '密码'],
    ['杈撳叆瀵嗙爜', '输入密码'],
    ['瀛︽牎绔敤浜庢垚缁╁垎鏋愩€佹暀瀛︾鐞嗕笌鏁版嵁缁存姢銆?', '学校端用于成绩分析、教学管理与数据维护。'],
    ['杩涘叆瀛︽牎绔?', '进入学校端'],
    ['缁熶竴韬唤璁よ瘉', '统一身份认证'],
    ['浜戠鏁版嵁瀹夊叏', '云端数据安全'],
    ['鐧诲綍鍚庡揩閫熻繘鍏?', '登录后快速进入'],
    ['馃搨', '📂'],
    ['以入学年份为主线建立完整成长周期，系统将自动匹配年级与核算模式', '以“入学年份”为主线建立完整成长周期，系统将自动匹配年级与核算模式'],
    ['00 新教师上手入口', '00 新教师上手入口'],
    ['一句话目的', '一句话目的：'],
    ['鎺ㄨ崘椤哄簭锛', '推荐顺序：'],
    ['鏁版嵁鐘舵€侀潰鏉?', '数据状态面板'],
    ['鏈牎锛?', '本校：'],
    ['鑷姩璇嗗埆', '自动识别'],
    ['浠诲姟娓呭崟', '任务清单'],
    ['閫夋嫨瀛︽湡涓庡眾鍒?', '选择学期与届别'],
    ['瀵煎叆鎴愮哗鏁版嵁', '导入成绩数据'],
    ['瀵煎叆浠昏琛ㄥ苟鍚屾', '导入任课表并同步'],
    ['閫夋嫨鏈牎', '选择本校'],
    ['鏌ョ湅鏁欏笀鐢诲儚', '查看教师画像'],
    ['寮曞鍚戝', '引导向导'],
    ['婕旂ず鏁版嵁', '演示数据'],
    ['缁熶竴鍏ュ彛', '统一入口'],
    ['鏁版嵁瀵煎叆', '数据导入'],
    ['鏁欏笀浠昏', '教师任课'],
    ['鏁欏笀鐢诲儚', '教师画像'],
    ['鏉冮檺璇存槑', '权限说明'],
    ['鑷姩璇婃柇', '自动诊断'],
    ['鐐瑰嚮鎸夐挳寮€濮嬭瘖鏂€?', '点击按钮开始诊断。'],
    ['涓€閿瘖鏂?', '一键诊断'],
    ['鏁版嵁寮傚父涓績', '数据异常中心'],
    ['鐐瑰嚮鎵弿鏌ョ湅寮傚父', '点击扫描查看异常'],
    ['鎵弿寮傚父', '扫描异常'],
    ['鎿嶄綔璁板綍', '操作记录'],
    ['娓呯┖璁板綍', '清空记录'],
    ['澶囦唤涓庢仮澶?', '备份与恢复'],
    ['寤鸿鍦ㄥ垏鎹㈠眾鍒垨澶ф壒閲忎慨鏀瑰墠鎵嬪姩澶囦唤銆?', '建议在切换届别或大批量修改前，先把当前项目保存到文件。'],
    ['涓€閿浠?', '保存到文件'],
    ['涓€閿仮澶?', '从文件恢复'],
    ['妯℃澘涓嬭浇', '模板下载'],
    ['浠昏妯℃澘', '任课模板'],
    ['猸?', '⭐'],
    ['馃摌', '📘'],
    ['馃搳', '📊'],
    ['馃捑', '💾'],
    ['馃搱', '📈'],
    ['鍚?/3学生核算', '后1/3学生核算'],
    ['鍓旈櫎瑙勫垯', '剔除规则'],
    ['(鍓旈櫎鐜? 6%)', '(剔除率: 6%)'],
    ['指标生达标核算', '指标生达标核算'],
    ['开始计算', '开始计算'],
    ['生成总排名', '生成总排名'],
    ['班主任必看', '班主任必看'],
    ['进退步追踪与增值评价', '进退步追踪与增值评价'],
    ['学生发展与家校沟通', '学生发展与家校沟通'],
    ['绠楁硶閫昏緫', '算法逻辑'],
    ['淇濆瓨鏂规', '保存方案'],
    ['设最新为稳定版', '设最新为稳定版'],
    ['查看稳定版差异', '查看稳定版差异'],
    ['只看有差异', '只看有差异']
];

const MOJIBAKE_PATTERNS = MOJIBAKE_REPLACEMENTS
    .map(([bad]) => String(bad || '').trim())
    .filter(Boolean);

const MOJIBAKE_MATCH_RE = new RegExp(
    MOJIBAKE_PATTERNS
        .map((token) => token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
        .join('|')
);

function normalizeMojibakeText(value) {
    let text = String(value ?? '');
    if (!text || !MOJIBAKE_MATCH_RE.test(text)) return text;
    for (const [bad, good] of MOJIBAKE_REPLACEMENTS) {
        if (text.includes(bad)) text = text.split(bad).join(good);
    }
    return text;
}

function normalizeMojibakeElement(el) {
    if (!el || el.nodeType !== 1) return 0;
    if (el.closest && el.closest('[data-mojibake-skip="true"]')) return 0;
    let changeCount = 0;
    ['placeholder', 'title', 'aria-label', 'value'].forEach((attr) => {
        if (!el.hasAttribute(attr)) return;
        const current = el.getAttribute(attr);
        const next = normalizeMojibakeText(current);
        if (next !== current) {
            el.setAttribute(attr, next);
            changeCount += 1;
        }
    });
    return changeCount;
}

function normalizeMojibakeSubtree(root) {
    if (!root) return 0;
    const elementRoot = root.nodeType === 1 ? root : root.parentElement;
    if (elementRoot && /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(elementRoot.tagName)) return 0;
    if (elementRoot && elementRoot.closest && elementRoot.closest('[data-mojibake-skip="true"]')) return 0;

    let changeCount = 0;

    if (root.nodeType === 3) {
        const current = root.nodeValue || '';
        const next = normalizeMojibakeText(current);
        if (next !== current) {
            root.nodeValue = next;
            changeCount += 1;
        }
        return changeCount;
    }

    const base = root.nodeType === 1 ? root : (document.body || document.documentElement);
    if (!base) return 0;

    changeCount += normalizeMojibakeElement(base);
    const walker = document.createTreeWalker(base, NodeFilter.SHOW_TEXT, {
        acceptNode(node) {
            const parent = node.parentElement;
            if (!parent || /^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(parent.tagName)) {
                return NodeFilter.FILTER_REJECT;
            }
            if (parent.closest && parent.closest('[data-mojibake-skip="true"]')) {
                return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    while (walker.nextNode()) {
        const node = walker.currentNode;
        const current = node.nodeValue || '';
        const next = normalizeMojibakeText(current);
        if (next !== current) {
            node.nodeValue = next;
            changeCount += 1;
        }
    }

    if (base.querySelectorAll) {
        base.querySelectorAll('*').forEach((el) => {
            changeCount += normalizeMojibakeElement(el);
        });
    }

    return changeCount;
}

function installMojibakeNormalizer() {
    if (window.__MOJIBAKE_NORMALIZER_INSTALLED__) return;
    window.__MOJIBAKE_NORMALIZER_INSTALLED__ = true;

    let isNormalizing = false;
    let fullDocumentScheduled = false;
    let pendingNormalizeTargets = [];
    let pendingNormalizeScheduled = false;
    const runNormalize = (target) => {
        if (isNormalizing) return 0;
        isNormalizing = true;
        try {
            return normalizeMojibakeSubtree(target || document.documentElement);
        } finally {
            isNormalizing = false;
        }
    };

    const scheduleTask = (callback, timeout = 1200) => {
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(() => callback(), { timeout });
            return;
        }
        window.setTimeout(callback, timeout);
    };

    const scheduleNormalizeDrain = () => {
        if (pendingNormalizeScheduled) return;
        pendingNormalizeScheduled = true;
        scheduleTask(() => {
            pendingNormalizeScheduled = false;
            const targets = pendingNormalizeTargets.splice(0, pendingNormalizeTargets.length);
            targets.slice(0, 80).forEach((targetNode) => runNormalize(targetNode));
            if (targets.length > 80) {
                pendingNormalizeTargets.unshift(...targets.slice(80));
                scheduleNormalizeDrain();
            }
        }, 350);
    };

    const enqueueNormalizeTarget = (target) => {
        if (!target) return;
        if (pendingNormalizeTargets.length < 160) {
            pendingNormalizeTargets.push(target);
        } else if (!pendingNormalizeTargets.includes(document.documentElement)) {
            pendingNormalizeTargets = [document.documentElement];
        }
        scheduleNormalizeDrain();
    };

    const installObserver = () => {
        if (window.__MOJIBAKE_NORMALIZER_OBSERVER__) return;
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'characterData' || mutation.type === 'attributes') {
                    enqueueNormalizeTarget(mutation.target);
                    return;
                }
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 || node.nodeType === 3) enqueueNormalizeTarget(node);
                });
            });
        });
        observer.observe(document.documentElement, {
            subtree: true,
            childList: true,
            characterData: true,
            attributes: true,
            attributeFilter: ['placeholder', 'title', 'aria-label', 'value']
        });
        window.__MOJIBAKE_NORMALIZER_OBSERVER__ = observer;
    };

    const normalizeCriticalUi = () => {
        [
            document.getElementById('login-overlay'),
            document.getElementById('global-loader'),
            document.getElementById('cloud-sync-indicator')
        ].forEach((node) => {
            if (node) runNormalize(node);
        });
    };

    const scheduleFullDocumentStart = () => {
        if (fullDocumentScheduled) return;
        fullDocumentScheduled = true;
        scheduleTask(() => {
            const changeCount = runNormalize(document.documentElement);
            if (changeCount > 0) installObserver();
        });
    };

    window.normalizeMojibakeUi = (target) => {
        const changeCount = runNormalize(target || document.documentElement);
        if (changeCount > 0) installObserver();
        scheduleFullDocumentStart();
        return changeCount;
    };

    const start = () => {
        normalizeCriticalUi();
        if (document.readyState === 'complete') {
            scheduleFullDocumentStart();
            return;
        }
        window.addEventListener('load', scheduleFullDocumentStart, { once: true });
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', start, { once: true });
    } else {
        start();
    }
}

installMojibakeNormalizer();

// 声明式 DOM 管道绑定：把散在 index.html 里两类纯 DOM 样板内联 onclick 收敛为
// 属性 + 一个 document 级委托监听：
//   data-close-modal="<id>" 取代 onclick="document.getElementById('X').style.display='none'"
//   data-pick-file="<id>"   取代 onclick="document.getElementById('X').click()"
// 用事件委托而非逐节点绑定,因此对模块按需渲染/重绘出来的节点同样生效,无需重新绑定。
// 这两类站点原本都不含任何业务逻辑(仅隐藏弹层 / 触发隐藏 file input),行为等价。
function installDeclarativeDomBindings() {
    if (window.__DECLARATIVE_DOM_BINDINGS__) return;
    window.__DECLARATIVE_DOM_BINDINGS__ = true;

    // id 由本仓库自己的静态标记提供,仍做保守校验,避免属性变成任意选择器注入点。
    const isSafeElementId = (value) => /^[A-Za-z][\w-]*$/.test(value);

    // 按「最近祖先」判定,而不是固定先查某一类属性:file-pick 按钮可能嵌在弹层内部
    // (如换肤弹层里的上传 logo),固定顺序会让内层点击误命中外层的关闭意图。
    const resolveBinding = (origin) => {
        const holder = origin.closest('[data-close-modal], [data-pick-file], [data-module-help], [data-scroll-anchor], [data-open-teacher-sync]');
        if (!holder) return null;
        const closeId = String(holder.getAttribute('data-close-modal') || '').trim();
        if (closeId) return { kind: 'close', id: closeId };
        const pickId = String(holder.getAttribute('data-pick-file') || '').trim();
        if (pickId) return { kind: 'pick', id: pickId };
        const helpKey = String(holder.getAttribute('data-module-help') || '').trim();
        if (helpKey) return { kind: 'help', id: helpKey };
        const anchorId = String(holder.getAttribute('data-scroll-anchor') || '').trim();
        if (anchorId) return { kind: 'anchor', id: anchorId, holder };
        if (holder.hasAttribute('data-open-teacher-sync')) return { kind: 'teacher-sync' };
        return null;
    };

    // 用捕获阶段:部分弹层的 .modal-content 上带 onclick="event.stopPropagation()"
    // (用于实现「点遮罩关闭、点内容不关闭」),冒泡阶段的 document 监听会被它掐断,
    // 而内层的关闭按钮正好在其内部。捕获阶段先于任何 stopPropagation 执行。
    document.addEventListener('click', (event) => {
        const origin = event.target instanceof Element ? event.target : null;
        if (!origin) return;

        const binding = resolveBinding(origin);
        if (!binding) return;

        if (binding.kind === 'teacher-sync') {
            if (typeof window.openTeacherSync === 'function') window.openTeacherSync();
            return;
        }
        if (!isSafeElementId(binding.id)) return;

        // help 的取值是模块帮助键(不是元素 id),必须在 getElementById 之前分流。
        // showModuleHelp 由 app.js 提供,帮助运行时按需加载,函数未就绪时静默跳过
        // (与原内联 onclick 的行为一致 —— 那时同样会因函数未定义而无效)。
        if (binding.kind === 'help') {
            if (typeof window.showModuleHelp === 'function') window.showModuleHelp(binding.id);
            return;
        }

        const target = document.getElementById(binding.id);
        if (!target) return;

        // 锚点滚动:原内联写法传 this 用于 side-nav 高亮切换,委托时传「带属性的那个
        // 元素」语义等价(holder 即原来挂 onclick 的节点)。
        if (binding.kind === 'anchor') {
            if (typeof window.scrollToAnchor === 'function') window.scrollToAnchor(binding.id, binding.holder);
            return;
        }

        if (binding.kind === 'close') {
            target.style.display = 'none';
            return;
        }
        // 隐藏的 file input 常常就嵌在 upload-box 内部(如 #fileInput 在
        // #uploadBoxMain 里)。programmatic .click() 会冒泡回到同一个 upload-box,
        // 若不拦下就会无限递归。命中目标自身或其后代时直接放行原生行为。
        if (target === origin || target.contains(origin)) return;
        // 考试封存时 applyArchiveLockUI() 会 disable 这些 file input;与既有 Enter
        // 键路径保持一致,封存状态下不打开选择器。
        if (target.disabled) return;
        target.click();
    }, true);

    // DataManager 调度：把 index.html 里 45 处 onclick/onchange/oninput="DataManager.xxx(...)"
    // 收敛为声明式属性。与上面的 element-id 类绑定关注点不同，故单独走一对监听器。
    //   data-dm-click / data-dm-change / data-dm-input = "<方法名>"
    //   data-dm-arg = "<字符串或数字参数>"（可选）
    //   data-dm-arg-from = "checked" | "value" | "element"（可选，取自触发元素）
    // 参数走独立属性而不是把表达式塞进属性值，避免属性变成 eval 面。
    const DM_ARG_SOURCES = new Set(['checked', 'value', 'element']);
    const isSafeMethodName = (value) => /^[A-Za-z_$][\w$]*$/.test(value);

    const dispatchDataManager = (event, attribute) => {
        const origin = event.target instanceof Element ? event.target : null;
        if (!origin) return;
        const holder = origin.closest(`[${attribute}]`);
        if (!holder) return;

        const method = String(holder.getAttribute(attribute) || '').trim();
        if (!isSafeMethodName(method)) return;
        const manager = window.DataManager;
        // DataManager 由 app.js / data-manager-core-runtime 提供。未就绪时静默跳过，
        // 与原内联 onclick 行为一致（那时同样会因对象未定义而无效）。
        if (!manager || typeof manager[method] !== 'function') return;

        const argSource = String(holder.getAttribute('data-dm-arg-from') || '').trim();
        if (argSource && DM_ARG_SOURCES.has(argSource)) {
            if (argSource === 'checked') return void manager[method](holder.checked);
            if (argSource === 'value') return void manager[method](holder.value);
            return void manager[method](holder);
        }

        if (holder.hasAttribute('data-dm-arg')) {
            const raw = holder.getAttribute('data-dm-arg');
            // 数字型参数（如 changePage(-1)）保持数字语义，其余按字符串传。
            const asNumber = Number(raw);
            const arg = raw !== '' && Number.isFinite(asNumber) && /^-?\d+(?:\.\d+)?$/.test(raw)
                ? asNumber
                : raw;
            return void manager[method](arg);
        }
        manager[method]();
    };

    document.addEventListener('click', (event) => dispatchDataManager(event, 'data-dm-click'), true);
    document.addEventListener('change', (event) => dispatchDataManager(event, 'data-dm-change'), true);
    document.addEventListener('input', (event) => dispatchDataManager(event, 'data-dm-input'), true);
}

installDeclarativeDomBindings();
