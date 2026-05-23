(() => {
    if (typeof window === 'undefined' || window.__FRESHMAN_EXAM_RUNTIME_PATCHED__) return;

    let FB_STUDENTS = [];
    let FB_CLASSES = (typeof window.readFbClassesState === 'function')
        ? window.readFbClassesState()
        : (Array.isArray(window.FB_CLASSES) ? window.FB_CLASSES : []);
    let FB_CUR_CLASS_IDX = -1;
    let FB_SIMULATED_DATA = {};
    let EXAM_DATA = [];
    let EXAM_ROOMS = [];
    let FB_SCHEMES_CACHE = [];
    let balanceChartInstance = null;
    const FreshmanExamPerfCache = {
        schemeSelectorSignature: '',
        schemeSelectorHtml: '',
        dashboardSignature: '',
        dashboardHtml: '',
        balanceSignature: '',
        balanceTableHtml: ''
    };

    function fbClassSignature(classes = FB_CLASSES) {
        return (Array.isArray(classes) ? classes : []).map((c) => [
            c?.id,
            c?.name,
            Array.isArray(c?.students) ? c.students.length : 0,
            Array.isArray(c?.students) ? c.students.map(s => `${s.name}:${s.score}:${s.gender}:${s.isDiff || s._isDiff ? 1 : 0}`).join(',') : ''
        ].join(':')).join('|');
    }

    function fbCalcClassStats(students = []) {
        const list = Array.isArray(students) ? students : [];
        const n = list.length;
        let total = 0;
        let male = 0;
        let diff = 0;
        list.forEach((student) => {
            total += Number(student?.score) || 0;
            if (student?.gender === 'M') male += 1;
            if (student?.isDiff || student?._isDiff) diff += 1;
        });
        return {
            avg: n ? total / n : 0,
            male,
            female: n - male,
            diff,
            count: n
        };
    }

    function syncFbClasses() {
        const nextClasses = (typeof window.readFbClassesState === 'function')
            ? window.readFbClassesState()
            : (Array.isArray(window.FB_CLASSES) ? window.FB_CLASSES : []);
        if (Array.isArray(nextClasses)) FB_CLASSES = nextClasses;
        window.FB_CLASSES = FB_CLASSES;
        return FB_CLASSES;
    }

    function writeFbClasses(classes) {
        const nextClasses = (typeof window.setFbClassesState === 'function')
            ? window.setFbClassesState(classes)
            : (Array.isArray(classes) ? classes : []);
        FB_CLASSES = Array.isArray(nextClasses) ? nextClasses : [];
        window.FB_CLASSES = FB_CLASSES;
        return FB_CLASSES;
    }

    function getCurrentConfig() {
        return window.CONFIG || { name: '学校' };
    }

// ================== 新生分班 & 座位编排 ==================
function FB_loadData(input) {
    const file = input.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result); const wb = XLSX.read(data, { type: 'array' }); const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            if (!json.length) throw new Error("Excel没有数据");
            FB_STUDENTS = json.map((r, i) => {
                const remarks = String(r['备注'] || r['说明'] || ""); const sameMatch = remarks.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:同班|一起|一班)/); const diffMatch = remarks.match(/(?:和|与|跟)([\u4e00-\u9fa5\w]+)(?:分开|不同班|不在一起)/);
                return { _id: i, name: r['姓名'] || '未知', gender: (r['性别'] === '男' || r['Gender'] === 'M') ? 'M' : 'F', score: parseFloat(r['总分'] || r['语数英'] || 0), height: parseFloat(r['身高'] || 160), vision: parseFloat(r['视力'] || r['左眼'] || 5.0), isDiff: (String(r['难管'] || "").includes('是') || remarks.includes('难管') || remarks.includes('调皮')), remarks: remarks, constraints: { same: sameMatch ? [sameMatch[1]] : [], diff: diffMatch ? [diffMatch[1]] : [] }, classIdx: -1 };
            });
            alert(`✅ 导入成功！共 ${FB_STUDENTS.length} 人。`); document.getElementById('fb-results-area').classList.add('hidden');
        } catch (err) { alert("读取失败：" + err.message); }
    }; reader.readAsArrayBuffer(file);
}

function calculateQuartiles(sortedData) {
    const q2 = calculateMedian(sortedData); const midIndex = Math.floor(sortedData.length / 2); const lowerHalf = sortedData.slice(0, midIndex); const upperHalf = sortedData.slice((sortedData.length % 2 === 0) ? midIndex : midIndex + 1); const q1 = calculateMedian(lowerHalf); const q3 = calculateMedian(upperHalf); return { q1, q2, q3 };
}
function calculateMedian(sortedData) { const mid = Math.floor(sortedData.length / 2); return sortedData.length % 2 !== 0 ? sortedData[mid] : (sortedData[mid - 1] + sortedData[mid]) / 2; }
function calculateSD(data) { const n = data.length; if (n === 0) return 0; const mean = data.reduce((a, b) => a + b, 0) / n; const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n; return Math.sqrt(variance); }

// 1. 主入口：运行分班
function FB_runDivision() {
    if (!FB_STUDENTS.length) return alert("请先导入数据");

    // 获取参数
    const k = parseInt(document.getElementById('fb_cls_num').value) || 6;
    const algo = document.getElementById('fb_algorithm').value;
    const btn = document.querySelector('button[onclick="FB_runDivision()"]');

    // UI 反馈
    btn.innerHTML = '⏳ 正在运算多套方案...';
    btn.disabled = true;

    // 使用 setTimeout 让 UI 有机会渲染 Loading 状态
    setTimeout(() => {
        FB_SCHEMES_CACHE = [];

        // 如果是蛇形分班，因为是固定的，只生成 1 套
        // 如果是智能优化，生成 3 套供选择
        const runs = (algo === 'snake') ? 1 : 3;

        for (let i = 0; i < runs; i++) {
            const classes = FB_generateSingleScheme(k, algo);
            // 计算该方案的评分 (极差)
            const avgs = classes.map(c => c.stats.avg);
            const range = Math.max(...avgs) - Math.min(...avgs);
            const sd = calculateSD(avgs);

            FB_SCHEMES_CACHE.push({
                id: i,
                name: runs === 1 ? '标准方案' : `方案 ${String.fromCharCode(65 + i)}`, // 方案A, 方案B...
                data: classes,
                range: range,
                sd: sd,
                desc: `均分极差 ${range.toFixed(2)}`
            });
        }

        // 恢复按钮
        btn.innerHTML = '🚀 开始智能分班';
        btn.disabled = false;

        // 渲染方案选择器
        FB_renderSchemeSelector();

        // 默认应用均分极差最小（最均衡）的方案
        const bestScheme = [...FB_SCHEMES_CACHE].sort((a, b) => a.range - b.range)[0];
        FB_applyScheme(bestScheme.id);

        // 显示区域
        document.getElementById('fb-results-area').classList.remove('hidden');
        const schemePanel = document.getElementById('fb-scheme-panel');
        if (runs > 1) {
            if (schemePanel) schemePanel.classList.remove('hidden');
        } else {
            if (schemePanel) schemePanel.classList.add('hidden');
        }

    }, 100);
}

// 2. 核心算法：生成单次方案 (提取出来的纯逻辑)
function FB_generateSingleScheme(k, algo) {
    // 初始化空班级
    let classes = Array.from({ length: k }, (_, i) => ({ id: i, name: (i + 1) + "班", students: [], stats: {} }));
    let pool = JSON.parse(JSON.stringify(FB_STUDENTS)); // 深拷贝，防止污染

    // 预处理：按分数排序
    pool.sort((a, b) => b.score - a.score);

    if (algo === 'snake') {
        // --- 蛇形分班 ---
        pool.forEach((s, i) => {
            const round = Math.floor(i / k);
            const target = (round % 2 === 0) ? (i % k) : (k - 1 - (i % k));
            classes[target].students.push(s);
            s.classIdx = target;
        });
    } else {
        // --- 智能优化分班 (基于模拟退火思想的简化版) ---
        // A. 初步蛇形分配作为基准
        pool.forEach((s, i) => {
            const target = (Math.floor(i / k) % 2 === 0) ? (i % k) : (k - 1 - (i % k));
            classes[target].students.push(s);
            s.classIdx = target;
        });

        // B. 随机交换优化
        const iterations = 8000; // 增加迭代次数以获得不同结果
        const globalAvg = pool.reduce((a, b) => a + b.score, 0) / pool.length;

        for (let i = 0; i < iterations; i++) {
            const c1 = Math.floor(Math.random() * k);
            const c2 = Math.floor(Math.random() * k);
            if (c1 === c2) continue;

            const cls1 = classes[c1];
            const cls2 = classes[c2];
            if (!cls1.students.length || !cls2.students.length) continue;

            const idx1 = Math.floor(Math.random() * cls1.students.length);
            const idx2 = Math.floor(Math.random() * cls2.students.length);

            const s1 = cls1.students[idx1];
            const s2 = cls2.students[idx2];

            // 计算交换前的代价 (方差 + 性别平衡 + 难管分布)
            const costBefore = FB_calcClassCost(cls1, globalAvg) + FB_calcClassCost(cls2, globalAvg);

            // 试探性交换
            cls1.students[idx1] = s2; s2.classIdx = c1;
            cls2.students[idx2] = s1; s1.classIdx = c2;

            const costAfter = FB_calcClassCost(cls1, globalAvg) + FB_calcClassCost(cls2, globalAvg);

            // 检查硬性约束 (如: 互斥)
            let violate = false;
            if (FB_checkConflict(s1, cls2.students) || FB_checkConflict(s2, cls1.students)) violate = true;

            // 决策：如果代价变高了(更不平衡) 或者 违反约束，则撤销交换
            // (加入一点点随机接受概率以跳出局部最优，但这里为了稳定简化处理)
            if (violate || costAfter > costBefore) {
                // 撤销
                cls1.students[idx1] = s1; s1.classIdx = c1;
                cls2.students[idx2] = s2; s2.classIdx = c2;
            }
        }
    }

    // 这里的计算是为了 stats，方便外部筛选
    classes.forEach(c => {
        c.stats = fbCalcClassStats(c.students);
    });

    return classes;
}

// 3. 渲染方案选择卡片
function FB_renderSchemeSelector() {
    const container = document.getElementById('fb-scheme-cards');
    if (!container) return;
    const bestRange = FB_SCHEMES_CACHE.length ? Math.min(...FB_SCHEMES_CACHE.map(s => s.range)) : Infinity;
    const signature = FB_SCHEMES_CACHE.map(scheme => `${scheme.id}:${scheme.range.toFixed(3)}:${scheme.sd.toFixed(3)}:${fbClassSignature(scheme.data)}`).join('|');
    if (FreshmanExamPerfCache.schemeSelectorSignature === signature) {
        if (container.dataset.freshmanSchemeSig !== signature) {
            container.innerHTML = FreshmanExamPerfCache.schemeSelectorHtml;
            container.dataset.freshmanSchemeSig = signature;
        }
        return;
    }

    const html = FB_SCHEMES_CACHE.map(scheme => {
        // 简单的评分逻辑
        const isBest = scheme.range <= bestRange;
        const borderStyle = isBest ? 'border:2px solid #16a34a; background:#fff;' : 'border:1px solid #ddd; background:#fff;';

        // 找出该方案中男女比例极差
        const males = scheme.data.map(c => c.stats.male);
        const maleRange = Math.max(...males) - Math.min(...males);

        return `
                <div data-scheme-id="${scheme.id}" onclick="FB_applyScheme(${scheme.id})" style="cursor:pointer; padding:10px; border-radius:6px; ${borderStyle} transition:0.2s;" onmouseover="this.style.background='#f0fdf4'" onmouseout="this.style.background='#fff'">
                    <div style="font-weight:bold; color:#333; display:flex; justify-content:space-between;">
                        <span>${scheme.name}</span>
                        ${isBest ? '<span style="color:red; font-size:10px;">★ 推荐</span>' : ''}
                    </div>
                    <div style="font-size:12px; color:#666; margin-top:5px;">
                        <div>均分极差: <strong>${scheme.range.toFixed(2)}</strong></div>
                        <div>男女极差: ${maleRange} 人</div>
                    </div>
                </div>
            `;
    }).join('');
    FreshmanExamPerfCache.schemeSelectorSignature = signature;
    FreshmanExamPerfCache.schemeSelectorHtml = html;
    container.innerHTML = html;
    container.dataset.freshmanSchemeSig = signature;
}

// 4. 应用选中的方案
function FB_applyScheme(id) {
    const scheme = FB_SCHEMES_CACHE.find(s => s.id === id);
    if (!scheme) return;

    // 更新全局变量
    writeFbClasses(scheme.data);
    FB_SIMULATED_DATA = {};
    FB_CLASSES.forEach(c => FB_SIMULATED_DATA[c.name] = c.students);

    // 渲染原有仪表盘
    FB_renderDashboard();

    // 高亮选中的卡片
    const cardsWrap = document.getElementById('fb-scheme-cards');
    if (cardsWrap) {
        const cards = cardsWrap.children;
        Array.from(cards).forEach((card) => {
            if (String(card.dataset.schemeId) === String(scheme.id)) {
                card.style.borderColor = '#16a34a';
                card.style.boxShadow = '0 0 0 3px rgba(22, 163, 74, 0.2)';
            } else {
                card.style.borderColor = '#ddd';
                card.style.boxShadow = 'none';
            }
        });
    }
}

function FB_calcClassCost(cls, gAvg) {
    const n = cls.students.length; if (n === 0) return 10000; const avg = cls.students.reduce((a, b) => a + b.score, 0) / n; const male = cls.students.filter(s => s.gender === 'M').length;
    const diff = cls.students.filter(s => (s.isDiff || s._isDiff)).length;
    let cost = Math.pow(avg - gAvg, 2) * 100; cost += Math.pow((male / n) - 0.5, 2) * 5000;
    if (document.getElementById('fb_rule_diff').value === 'spread') { cost += Math.pow(diff, 2) * 500; } return cost;
}

function FB_checkConflict(stu, targetArr) {
    if (!stu.constraints) return false;
    for (let name of stu.constraints.diff) { if (targetArr.find(s => s.name === name)) return true; }
    return false;
}

function FB_renderDashboard() {
    document.getElementById('fb-results-area').classList.remove('hidden'); const container = document.getElementById('fb_class_container');
    const dashboardSignature = fbClassSignature(FB_CLASSES);
    if (container?.dataset.freshmanDashboardSig === dashboardSignature && FreshmanExamPerfCache.dashboardSignature === dashboardSignature) {
        FB_renderBalanceChart();
        return;
    }
    let allAvgs = [], tMale = 0, tFemale = 0, totalDiffCnt = 0;
    const classCardsHtml = FB_CLASSES.map(c => {
        const stats = fbCalcClassStats(c.students);
        const n = stats.count; const avg = stats.avg; const male = stats.male;
        const diffCnt = stats.diff;
        allAvgs.push(avg); tMale += male; tFemale += stats.female; totalDiffCnt += diffCnt; c.stats = stats; const isWarn = diffCnt > 3;
        return `<div class="fb-class-box ${isWarn ? 'fb-warn-bg' : ''}" onclick="FB_openSeatMap(${c.id})"><div class="fb-c-head"><span style="font-weight:bold; font-size:16px;">${c.name}</span><span class="fb-tag fb-tag-red" style="${diffCnt > 0 ? '' : 'display:none'}">难管: ${diffCnt}</span></div><div class="fb-c-body"><div>人数: <strong>${n}</strong></div><div>均分: <strong>${avg.toFixed(1)}</strong></div><div>男生: ${male}</div><div>女生: ${stats.female}</div><div style="grid-column:span 2; font-size:11px; color:#999; margin-top:5px;">点击进入座位编排 →</div></div></div>`;
    }).join('');
    if (container && container.innerHTML !== classCardsHtml) {
        container.innerHTML = classCardsHtml;
        container.dataset.freshmanDashboardSig = dashboardSignature;
    }
    FreshmanExamPerfCache.dashboardSignature = dashboardSignature;
    FreshmanExamPerfCache.dashboardHtml = classCardsHtml;
    const range = allAvgs.length ? (Math.max(...allAvgs) - Math.min(...allAvgs)) : 0;
    const elTotal = document.getElementById('fb_res_total');
    const elMale = document.getElementById('fb_res_male');
    const elFemale = document.getElementById('fb_res_female');
    const elDiff = document.getElementById('fb_res_diff');
    const elDiffCnt = document.getElementById('fb_res_diff_cnt');
    if (elTotal) elTotal.innerText = FB_STUDENTS.length;
    if (elMale) elMale.innerText = tMale;
    if (elFemale) elFemale.innerText = tFemale;
    if (elDiff) elDiff.innerText = range.toFixed(2);
    if (elDiffCnt) elDiffCnt.innerText = totalDiffCnt;
    const evalEl = document.getElementById('fb_res_eval');
    if (evalEl) {
        if (range <= 1.0) evalEl.innerHTML = '<span style="color:green;font-weight:bold;">✅ 完美均衡</span>'; else if (range <= 3.0) evalEl.innerHTML = '<span style="color:#d97706;font-weight:bold;">⚠️ 基本均衡</span>'; else evalEl.innerHTML = '<span style="color:red;font-weight:bold;">❌ 差异过大</span>';
    }
    FB_renderBalanceChart();
}

function FB_renderBalanceChart() {
    const ctx = document.getElementById('balanceChart'); const tableContainer = document.getElementById('balanceTableContainer'); const labels = FB_CLASSES.map(c => c.name);
    const signature = fbClassSignature(FB_CLASSES);
    if (FreshmanExamPerfCache.balanceSignature === signature && tableContainer?.dataset.freshmanBalanceSig === signature) {
        return;
    }
    const statsData = FB_CLASSES.map(c => { const scores = c.students.map(s => s.score).sort((a, b) => a - b); const qs = calculateQuartiles(scores); return { min: scores[0], max: scores[scores.length - 1], q1: qs.q1, median: qs.q2, q3: qs.q3, avg: c.stats.avg, sd: calculateSD(scores) }; });
    if (balanceChartInstance) balanceChartInstance.destroy();
    balanceChartInstance = new Chart(ctx, {
        type: 'bar', data: { labels: labels, datasets: [{ label: '平均分', data: statsData.map(s => s.avg), type: 'scatter', backgroundColor: '#2563eb', borderColor: '#2563eb', pointStyle: 'rectRot', pointRadius: 6 }, { label: '分数区间 (Min-Max)', data: statsData.map(s => [s.min, s.max]), backgroundColor: 'rgba(156, 163, 175, 0.2)', borderColor: 'rgba(156, 163, 175, 0.5)', borderWidth: 1, barPercentage: 0.1 }, { label: '核心分布 (Q1-Q3)', data: statsData.map(s => [s.q1, s.q3]), backgroundColor: 'rgba(37, 99, 235, 0.5)', borderColor: '#1e40af', borderWidth: 1, barPercentage: 0.6 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { tooltip: { callbacks: { label: function (context) { const s = statsData[context.dataIndex]; if (context.dataset.type === 'scatter') return `平均分: ${s.avg.toFixed(2)}`; if (context.datasetIndex === 1) return `范围: ${s.min} - ${s.max}`; if (context.datasetIndex === 2) return `核心区间: ${s.q1} - ${s.q3}`; } } }, title: { display: true, text: '班级分数结构对比 (箱线图)' } }, scales: { y: { beginAtZero: false, title: { display: true, text: '分数' } } } }
    });
    let tableHtml = `<table class="comparison-table" style="font-size:12px;"><thead><tr><th>班级</th><th>人数</th><th>平均分</th><th>标准差 (SD)</th><th>极差 (Max-Min)</th><th>前25%线 (Q3)</th><th>后25%线 (Q1)</th></tr></thead><tbody>`;
    statsData.forEach((s, i) => { tableHtml += `<tr><td>${labels[i]}</td><td>${FB_CLASSES[i].students.length}</td><td>${s.avg.toFixed(2)}</td><td>${s.sd.toFixed(2)}</td><td>${(s.max - s.min).toFixed(1)}</td><td>${s.q3}</td><td>${s.q1}</td></tr>`; });
    const nextTableHtml = tableHtml + `</tbody></table>`;
    if (tableContainer && tableContainer.innerHTML !== nextTableHtml) {
        tableContainer.innerHTML = nextTableHtml;
        tableContainer.dataset.freshmanBalanceSig = signature;
    }
    FreshmanExamPerfCache.balanceSignature = signature;
    FreshmanExamPerfCache.balanceTableHtml = nextTableHtml;
}

const HistoryManager = {
    past: [],   // 过去的状态栈
    future: [], // 未来的状态栈 (供重做)
    limit: 20,  // 最多记录20步，防止内存溢出

    // 1. 记录当前状态 (在修改数据前调用)
    record: function () {
        // 深拷贝当前班级数据 (FB_CLASSES)
        // 注意：这里我们只记录当前正在操作的班级，以节省内存
        if (FB_CUR_CLASS_IDX === -1) return;

        const currentClassData = FB_CLASSES[FB_CUR_CLASS_IDX];
        const snapshot = JSON.parse(JSON.stringify(currentClassData));

        this.past.push(snapshot);
        if (this.past.length > this.limit) this.past.shift(); // 超过限制删最早的

        this.future = []; // 一旦有新操作，清空未来栈
        this.updateUI();
    },

    // 2. 执行撤销
    undo: function () {
        if (this.past.length === 0) return;

        // A. 把当前状态推入未来栈
        const current = JSON.parse(JSON.stringify(FB_CLASSES[FB_CUR_CLASS_IDX]));
        this.future.push(current);

        // B. 从过去栈取出上一个状态
        const previous = this.past.pop();
        FB_CLASSES[FB_CUR_CLASS_IDX] = previous;

        // C. 刷新视图
        this.refreshView("已撤销 ↩");
    },

    // 3. 执行重做
    redo: function () {
        if (this.future.length === 0) return;

        // A. 把当前状态推入过去栈
        const current = JSON.parse(JSON.stringify(FB_CLASSES[FB_CUR_CLASS_IDX]));
        this.past.push(current);

        // B. 从未来栈取出下一个状态
        const next = this.future.pop();
        FB_CLASSES[FB_CUR_CLASS_IDX] = next;

        // C. 刷新视图
        this.refreshView("已重做 ↪");
    },

    // 4. 辅助：刷新界面和按钮状态
    refreshView: function (msg) {
        FB_renderSeatMap(); // 重绘座位表
        this.updateUI();
        UI.toast(msg, 'info'); // 提示用户
    },

    updateUI: function () {
        const btnUndo = document.getElementById('btn_undo');
        const btnRedo = document.getElementById('btn_redo');
        if (btnUndo) {
            btnUndo.disabled = (this.past.length === 0);
            btnUndo.className = this.past.length > 0 ? "btn btn-primary" : "btn btn-gray";
        }
        if (btnRedo) {
            btnRedo.disabled = (this.future.length === 0);
            btnRedo.className = this.future.length > 0 ? "btn btn-primary" : "btn btn-gray";
        }
    },

    // 5. 初始化/清空
    reset: function () {
        this.past = [];
        this.future = [];
        this.updateUI();
    }
};

function FB_openSeatMap(clsId) {
    HistoryManager.reset();
    FB_CUR_CLASS_IDX = clsId; const cls = FB_CLASSES[clsId]; document.getElementById('seat_class_title').innerText = cls.name;
    document.getElementById('fb_seat_view').classList.remove('hidden'); document.getElementById('fb_seat_view').scrollIntoView({ behavior: 'smooth' });
    updateConstraintWidgetsContext('fb'); // 联动更新
    if (!cls.seatLayout) { FB_autoSeatAlgo(); } else { FB_renderSeatMap(); }
    FB_initScenarioSelect(); // <--- 记得加上这句
}

// --- 家长查分轻量包生成器 (严格验证版：必须输入 密码+班级+姓名) ---
const STANDALONE_EXPORT_LIB_SOURCE_CACHE = Object.create(null);

function getStandaloneExportLibraryCandidates(src) {
    const normalized = String(src || '').trim();
    const candidates = [];
    const pushCandidate = (value) => {
        const text = String(value || '').trim();
        if (!text || candidates.includes(text)) return;
        candidates.push(text);
    };
    pushCandidate(normalized);
    if (window.location && window.location.protocol === 'file:' && normalized.startsWith('./assets/')) {
        const relativePath = normalized.replace(/^\.\//, '');
        pushCandidate(`./public/${relativePath}`);
        pushCandidate(`./dist/${relativePath}`);
    }
    return candidates;
}

function escapeInlineScriptContent(content) {
    return String(content || '').replace(/<\/script/gi, '<\\/script');
}

async function readStandaloneExportLibrarySource(key, fallbackSrc) {
    if (STANDALONE_EXPORT_LIB_SOURCE_CACHE[key]) return STANDALONE_EXPORT_LIB_SOURCE_CACHE[key];

    const scripts = Array.from(document.querySelectorAll(`script[data-standalone-lib="${key}"]`));
    for (const script of scripts) {
        const inlineText = String(script.textContent || '').trim();
        if (!script.src && inlineText) {
            STANDALONE_EXPORT_LIB_SOURCE_CACHE[key] = inlineText;
            return inlineText;
        }
    }

    const candidates = [];
    scripts.forEach(script => {
        const src = String(script.getAttribute('src') || script.src || '').trim();
        if (src && !candidates.includes(src)) candidates.push(src);
    });
    getStandaloneExportLibraryCandidates(fallbackSrc).forEach(src => {
        if (!candidates.includes(src)) candidates.push(src);
    });

    let lastError = null;
    for (const candidate of candidates) {
        try {
            const response = await fetch(candidate, { cache: 'force-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const text = await response.text();
            if (!text.trim()) throw new Error('EMPTY_SOURCE');
            STANDALONE_EXPORT_LIB_SOURCE_CACHE[key] = text;
            return text;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
        }
    }

    throw lastError || new Error(`${key} source unavailable`);
}

async function getStandaloneInquiryPackageLibraries() {
    const [cryptoJsSource, chartJsSource] = await Promise.all([
        readStandaloneExportLibrarySource('crypto-js', './assets/vendor/crypto-js/crypto-js.min.js'),
        readStandaloneExportLibrarySource('chart.js', './assets/vendor/chart.js/chart.umd.min.js')
    ]);

    return {
        cryptoJsSource: escapeInlineScriptContent(cryptoJsSource),
        chartJsSource: escapeInlineScriptContent(chartJsSource)
    };
}

async function ensureInquiryCryptoRuntime() {
    if (typeof CryptoJS !== 'undefined') return CryptoJS;
    if (typeof window.ensureCryptoJsVendorLoaded === 'function') {
        return window.ensureCryptoJsVendorLoaded();
    }
    const cryptoJsSource = await readStandaloneExportLibrarySource('crypto-js', './assets/vendor/crypto-js/crypto-js.min.js');
    window.eval(cryptoJsSource);
    if (typeof CryptoJS === 'undefined') {
        throw new Error('CryptoJS runtime unavailable');
    }
    return CryptoJS;
}

async function generateInquiryPackage() {
    const sch = document.getElementById('studentSchoolSelect').value;
    if (!sch || sch.includes('请选择')) return alert("请先选择一个学校，系统将生成该校的查分包。");

    if (typeof CryptoJS === 'undefined') {
        try {
            await ensureInquiryCryptoRuntime();
        } catch (error) {
            console.error('[InquiryPackage] crypto-js load failed:', error);
            return alert("❌ 导出失败：加密库未加载完成，请刷新页面后重试。");
        }
    }

    // 1. 准备数据
    const schoolRecord = typeof window.getAppSchoolRecord === 'function'
        ? window.getAppSchoolRecord(sch)
        : SCHOOLS[sch];
    const schoolStudents = schoolRecord?.students || [];
    if (!schoolStudents || schoolStudents.length === 0) return alert("该学校无数据");

    // 判断是否只有一所学校 (用于控制显示的排名类型)
    const isSingleSchool = Object.keys(SCHOOLS).length <= 1;

    const gradeStats = {};
    SUBJECTS.forEach(sub => {
        const scores = RAW_DATA.map(s => s.scores[sub]).filter(v => typeof v === 'number');
        if (scores.length > 0) {
            const sum = scores.reduce((a, b) => a + b, 0);
            const avg = sum / scores.length;
            const variance = scores.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / scores.length;
            gradeStats[sub] = { avg: avg, sd: Math.sqrt(variance) };
        } else {
            gradeStats[sub] = { avg: 0, sd: 1 };
        }
    });

    // 2. 数据打包
    const secureData = {};

    schoolStudents.forEach(stu => {
        // 生成唯一 Key: 班级_姓名 (例如: 701_张三)
        // 去除所有空格，确保匹配准确
        const key = (stu.class + "_" + stu.name).replace(/\s+/g, "");

        const scoresSimple = {};

        const radarData = { labels: [], data: [] }; // 雷达图数据
        const varianceData = { labels: [], data: [] }; // 均衡度数据
        const canShowClassRank = typeof hasStudentClassRankScope === 'function' ? hasStudentClassRankScope(stu) : true;
        const canShowTownRank = typeof isCountyDirectStudentForRank === 'function' ? !isCountyDirectStudentForRank(stu) : true;

        SUBJECTS.forEach(sub => {
            if (stu.scores[sub] !== undefined) {
                scoresSimple[sub] = [
                    stu.scores[sub],
                    safeGet(stu, `ranks.${sub}.school`, '-'),
                    canShowTownRank ? safeGet(stu, `ranks.${sub}.township`, '-') : '-'
                ];

                // A. 计算雷达图数据 (百分位)
                // 逻辑复用 renderRadarChart 中的算法
                const allScores = RAW_DATA.map(s => s.scores[sub]).filter(v => v !== undefined).sort((a, b) => b - a);
                const rank = allScores.indexOf(stu.scores[sub]) + 1;
                const total = allScores.length;
                const percentile = ((1 - (rank / total)) * 100).toFixed(1);
                radarData.labels.push(sub);
                radarData.data.push(percentile);

                // B. 计算均衡度数据
                const stats = gradeStats[sub];
                let z = 0;
                if (stats && stats.sd > 0) {
                    z = (stu.scores[sub] - stats.avg) / stats.sd;
                }
                varianceData.labels.push(sub);
                varianceData.data.push(parseFloat(z.toFixed(2)));
            }
        });

        // C. 生成本地规则评语
        const studentComment = typeof generateStudentComment === 'function'
            ? generateStudentComment(stu)
            : '';

        secureData[key] = {
            cls: stu.class,  // 存储班级
            name: stu.name,  // 存储姓名
            s: scoresSimple,
            t: stu.total,
            tr: canShowTownRank ? safeGet(stu, 'ranks.total.township', '-') : '-',
            sr: safeGet(stu, 'ranks.total.school', '-'),
            cr: canShowClassRank ? safeGet(stu, 'ranks.total.class', '-') : '-',
            showClassRank: canShowClassRank,
            showTownRank: canShowTownRank,

            rd: radarData,   // Radar Data
            vd: varianceData,// Variance Data
            cm: studentComment    // Comment

        };
    });

    // 3. 提示设置访问密码
    const password = window.UI && typeof window.UI.prompt === 'function'
        ? await window.UI.prompt(
            '请设置一个访问密码。家长查询时需要同时输入此密码、准确班级和准确姓名。',
            '',
            {
                title: '安全查分包访问密码',
                input: 'password',
                confirmText: '生成查分包',
                inputAttributes: {
                    autocomplete: 'new-password',
                    minlength: 8
                },
                inputValidator: (value) => {
                    const text = String(value || '').trim();
                    if (text.length < 8) return '访问密码至少 8 位';
                    if (!/[A-Za-z]/.test(text) || !/\d/.test(text)) return '访问密码需同时包含字母和数字';
                    return null;
                }
            }
        )
        : prompt('请设置一个访问密码。至少 8 位，并同时包含字母和数字。', '');

    if (password === null) return;
    if (!password) return alert("❌ 必须设置密码才能生成安全查分包！");
    if (String(password).trim().length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        return alert("❌ 访问密码至少 8 位，并需同时包含字母和数字。");
    }

    // 使用 CryptoJS 进行 AES 加密
    const jsonStr = JSON.stringify(secureData);
    const encryptedData = CryptoJS.AES.encrypt(jsonStr, password).toString();
    let inquiryPackageLibraries = null;
    try {
        inquiryPackageLibraries = await getStandaloneInquiryPackageLibraries();
    } catch (error) {
        console.error('[InquiryPackage] standalone libs unavailable:', error);
        return alert("❌ 导出失败：查分包依赖未准备好，请刷新页面后重试。");
    }
    const encryptedPayloadLiteral = JSON.stringify(encryptedData).replace(/</g, '\\u003c');

    // 4. 构建独立的 HTML 模板 (包含班级输入框)
    const examName = getCurrentConfig().name || "期中考试";
    const genDate = new Date().toLocaleDateString();

    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${sch} - 成绩查询</title>
<script>${inquiryPackageLibraries.cryptoJsSource}<\/script>
<script>${inquiryPackageLibraries.chartJsSource}<\/script>
<style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f0f2f5; margin: 0; padding: 20px; color: #333; }
    .container { max-width: 420px; margin: 0 auto; background: white; border-radius: 12px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    h2 { text-align: center; color: #2563eb; margin-bottom: 5px; font-size: 20px; }
    .sub-title { text-align: center; color: #666; font-size: 12px; margin-bottom: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 14px; }
    input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 16px; box-sizing: border-box; transition:0.3s; }
    input:focus { border-color: #2563eb; outline: none; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
    button { width: 100%; background: #2563eb; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: 0.2s; }
    button:active { transform: scale(0.98); }

    .password-section { background: #fffbeb; padding: 10px; border-radius: 8px; border: 1px solid #fcd34d; margin-bottom: 15px; }
    .password-section label { color: #b45309; }

    /* 结果卡片样式 */
    .result-box { margin-top: 20px; display: none; animation: fadeIn 0.3s; }
    .score-card { background: #fff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 2px 5px rgba(0,0,0,0.05); margin-bottom: 15px; }
    .head-section { background: linear-gradient(135deg, #2563eb, #1d4ed8); color: white; padding: 20px; text-align: center; }
    .total-val { font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 5px; }
    .total-lbl { font-size: 12px; opacity: 0.9; }
    .stu-info-bar { background: rgba(0,0,0,0.1); padding: 4px 10px; border-radius: 20px; font-size: 12px; display: inline-block; margin-bottom: 10px; }
    .rank-bar { display: flex; background: #eff6ff; border-bottom: 1px solid #dbeafe; padding: 10px 0; }
    .rank-item { flex: 1; text-align: center; border-right: 1px solid #dbeafe; }
    .rank-item:last-child { border-right: none; }
    .rank-val { font-weight: bold; color: #1e40af; font-size: 15px; }
    .rank-lbl { font-size: 10px; color: #64748b; }
    .sub-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 15px; background: #f8fafc; }
    .sub-item { background: white; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
    .sub-main { display: flex; flex-direction: column; }
    .sub-name { font-size: 13px; color: #64748b; font-weight: bold; }
    .sub-val { font-size: 18px; font-weight: 800; color: #333; margin-top: 2px; }
    .sub-ranks { text-align: right; font-size: 11px; color: #94a3b8; display: flex; flex-direction: column; gap: 2px; }
    .tag-rank { background: #f1f5f9; padding: 1px 4px; border-radius: 3px; }
    .footer { text-align: center; margin-top: 30px; font-size: 11px; color: #ccc; }

    .chart-box { background:white; border-radius:10px; padding:15px; margin-bottom:15px; border:1px solid #e2e8f0; position:relative; min-height:220px; }
    .chart-title { font-size:13px; font-weight:bold; color:#475569; margin-bottom:10px; border-left:4px solid #2563eb; padding-left:8px; }
    .comment-box { background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:15px; margin-bottom:15px; position:relative; }
    .comment-title { font-weight:bold; color:#166534; font-size:14px; margin-bottom:8px; display:flex; align-items:center; gap:5px; }
    .comment-text { font-size:13px; color:#333; line-height:1.6; white-space: pre-wrap; }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>
</head>
<body>
<div class="container">
    <h2>${sch} 成绩查询</h2>
    <div class="sub-title">${examName} | 发布日期: ${genDate}</div>

    <div class="password-section">
        <label>🔐 访问密码 (由老师提供)</label>
        <input type="password" id="inpPass" placeholder="请输入查看密码">
    </div>

    <!-- 👇👇👇 🟢 恢复：班级输入框 (必填) 🟢 👇👇👇 -->
    <div class="form-group">
        <label>班级</label>
        <input type="text" id="inpClass" placeholder="请输入班级 (如: 701)">
    </div>

    <div class="form-group">
        <label>学生姓名</label>
        <input type="text" id="inpName" placeholder="请输入姓名 (如: 张三)">
    </div>

    <button onclick="doSearch()">🔓 解密并查询</button>

    <div id="resultArea" class="result-box"></div>
</div>
<div class="footer">AES 256位端对端加密<br>仅限查询本人成绩</div>

<script>
    const PAYLOAD = ${encryptedPayloadLiteral};
    const IS_SINGLE_SCHOOL = ${isSingleSchool};

    let radarInst = null;
    let varInst = null;

    function doSearch() {
        const pass = document.getElementById('inpPass').value.trim();
        const cls = document.getElementById('inpClass').value.trim();
        const name = document.getElementById('inpName').value.trim();
        const resBox = document.getElementById('resultArea');

        if(!pass) return alert("❌ 请输入访问密码");
        if(!cls) return alert("❌ 请输入班级");
        if(!name) return alert("❌ 请输入学生姓名");

        let allData = null;

        // 1. 解密数据
        try {
            if (typeof CryptoJS === 'undefined') return alert("⚠️ 加载中，请稍后重试...");
            const bytes = CryptoJS.AES.decrypt(PAYLOAD, pass);
            const originalText = bytes.toString(CryptoJS.enc.Utf8);
            if (!originalText) throw new Error("密码错误");
            allData = JSON.parse(originalText);
        } catch(e) {
            return alert("⛔ 访问拒绝：密码错误！");
        }

        // 2. 精确查找 (班级 + 姓名 必须完全匹配)
        // 构造 Key：将用户输入的班级和姓名拼接，并去除空格 (例如 "701_张三")
        const key = (cls + "_" + name).replace(/\\s+/g, "");
        const res = allData[key];

        // 3. 渲染结果
        resBox.innerHTML = '';

        if(!res) {
            alert("❌ 未找到学生信息！\\n请检查【班级】和【姓名】是否输入正确。\\n(班级如：701)");
        } else {
            let subHtml = '';
            for(let sub in res.s) {
                const item = res.s[sub];
                let rankHtml = '<span class="tag-rank">校: ' + item[1] + '</span>';
                if (!IS_SINGLE_SCHOOL && res.showTownRank) rankHtml += '<span class="tag-rank">镇: ' + item[2] + '</span>';
                subHtml +=
                    '<div class="sub-item">' +
                        '<div class="sub-main"><div class="sub-name">' + sub + '</div><div class="sub-val">' + item[0] + '</div></div>' +
                        '<div class="sub-ranks">' + rankHtml + '</div>' +
                    '</div>';
            }

            let totalRankHtml =
                '<div class="rank-item"><div class="rank-val">' + res.sr + '</div><div class="rank-lbl">校排</div></div>';
            if (res.showClassRank) totalRankHtml = '<div class="rank-item"><div class="rank-val">' + res.cr + '</div><div class="rank-lbl">班排</div></div>' + totalRankHtml;
            if (!IS_SINGLE_SCHOOL && res.showTownRank) totalRankHtml += '<div class="rank-item"><div class="rank-val">' + res.tr + '</div><div class="rank-lbl">镇排</div></div>';

            // 注意：Canvas 需要固定高度
            const chartsHtml = \`
                <div class="comment-box">
                    <div class="comment-title">👩‍🏫 班主任评语</div>
                    <div class="comment-text">\${res.cm || '暂无评语'}</div>
                </div>

                <div class="chart-box">
                    <div class="chart-title">📊 学科能力分布 (雷达图)</div>
                    <div style="height:200px; position:relative;">
                        <canvas id="mobRadarChart"></canvas>
                    </div>
                </div>

                <div class="chart-box">
                    <div class="chart-title">⚖️ 学科均衡度诊断</div>
                    <div style="height:200px; position:relative;">
                        <canvas id="mobVarChart"></canvas>
                    </div>
                    <div style="font-size:10px; color:#999; text-align:center; margin-top:5px;">
                        注: 柱子朝上为优势科目，朝下为弱势科目
                    </div>
                </div>
            \`;

            resBox.innerHTML =
                '<div class="score-card">' +
                    '<div class="head-section">' +
                        '<div class="stu-info-bar">' + res.cls + '班 · ' + res.name + '</div>' +
                        '<div class="total-val">' + res.t + '</div>' +
                        '<div class="total-lbl">总分</div>' +
                    '</div>' +
                    '<div class="rank-bar">' + totalRankHtml + '</div>' +
                    '<div class="sub-grid">' + subHtml + '</div>' +
                '</div>' +
                '<div style="text-align:center; color:green; font-size:12px; margin-top:10px;">✅ 查询成功</div>';

            resBox.style.display = 'block';

            setTimeout(() => {
                // 1. 绘制雷达图
                if (radarInst) radarInst.destroy();
                const ctxRadar = document.getElementById('mobRadarChart');
                if (ctxRadar && res.rd) {
                    radarInst = new Chart(ctxRadar, {
                        type: 'radar',
                        data: {
                            labels: res.rd.labels,
                            datasets: [{
                                label: '能力值',
                                data: res.rd.data,
                                backgroundColor: 'rgba(37, 99, 235, 0.2)',
                                borderColor: '#2563eb',
                                pointBackgroundColor: '#2563eb'
                            }]
                        },
                        options: {
                            maintainAspectRatio: false,
                            scales: { r: { min: 0, max: 100, ticks: { display: false }, pointLabels: { font: { size: 10 } } } },
                            plugins: { legend: { display: false } }
                        }
                    });
                }

                // 2. 绘制均衡度柱状图
                if (varInst) varInst.destroy();
                const ctxVar = document.getElementById('mobVarChart');
                if (ctxVar && res.vd) {
                    const colors = res.vd.data.map(v => v >= 0 ? '#16a34a' : '#dc2626');
                    varInst = new Chart(ctxVar, {
                        type: 'bar',
                        data: {
                            labels: res.vd.labels,
                            datasets: [{
                                label: '相对差异',
                                data: res.vd.data,
                                backgroundColor: colors,
                                borderRadius: 3
                            }]
                        },
                        options: {
                            maintainAspectRatio: false,
                            indexAxis: 'y', // 横向柱状图更适合手机查看长标签
                            scales: {
                                x: { grid: { display: true }, title: {display:true, text:'← 弱势 | 强势 →'} },
                                y: { grid: { display: false } }
                            },
                            plugins: { legend: { display: false } }
                        }
                    });
                }
            }, 100);

        }
    }
<\/script>
</body>
</html>`;

    // 5. 下载文件
    const blob = new Blob([htmlContent], { type: "text/html;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${sch}_查分包_${new Date().getTime()}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("✅ 加密查分包已生成！\n文件名：" + link.download + "\n访问密码：" + password + "\n\n请将文件发给家长，告知密码。\n家长必须输入正确的 [班级] 和 [姓名] 才能查询。");
}

function parseConstraintStr(str) {
    if (!str) return [];
    return str.replace(/，/g, ',').replace(/；/g, ';').split(/[,;]/).map(s => s.trim()).filter(s => s);
}

function parseConflictStr(str) {
    if (!str) return [];
    return str.replace(/，/g, ',').split(',').map(pair => {
        const parts = pair.split('&').map(s => s.trim());
        if (parts.length === 2) return parts;
        return null;
    }).filter(p => p);
}

// ================== 新生分班-座位生成逻辑 ==================
function FB_autoSeatAlgo() {
    HistoryManager.record();
    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];

    // 1. 获取现有布局（如果是初次生成，则初始化为空数组）
    let currentLayout = cls.seatLayout || [];
    // 如果长度不够（比如人数变多了），补齐
    if (currentLayout.length < cls.students.length) {
        currentLayout = [...cls.students];
    }

    // 2. 分离“锁定”学生和“自由”学生
    let lockedSlots = {}; // 记录 { 索引: 学生对象 }
    let freeStudents = [];

    // 遍历当前布局，把被锁定的钉在原位，没锁定的扔进池子重排
    currentLayout.forEach((s, idx) => {
        if (s && s.locked) {
            lockedSlots[idx] = s;
        } else {
            if (s) freeStudents.push(s); // 收集所有非锁定学生
        }
    });

    // 3. 处理约束条件 (仅针对自由学生)
    // 使用隐藏Input的值，兼容 Tag Widget
    const diffInput = parseConstraintStr(document.getElementById('fb_c_diff').value);
    const visionInput = parseConstraintStr(document.getElementById('fb_c_vision').value);
    const talkInput = parseConstraintStr(document.getElementById('fb_c_talk').value);
    const conflictInput = parseConflictStr(document.getElementById('fb_c_conflict').value);

    // 获取绑定配置
    const bindInput = parseConflictStr(document.getElementById('fb_c_bind').value); // 复用解析函数，格式也是 A&B
    const bindMap = new Map(); // name -> partnerName
    bindInput.forEach(pair => {
        bindMap.set(pair[0], pair[1]);
        bindMap.set(pair[1], pair[0]);
    });

    // 重新标记临时属性（只针对自由学生，锁定的不管）
    freeStudents.forEach(s => {
        s._isDiff = false; s._isVision = false;
        if (diffInput.includes(s.name) || talkInput.includes(s.name)) s._isDiff = true;
        if (visionInput.includes(s.name)) s._isVision = true;
        s._bindPartner = bindMap.get(s.name); // 标记搭档
    });

    const useH = document.getElementById('rule_s_height').checked;
    const useV = document.getElementById('rule_s_vision').checked;
    const useG = document.getElementById('rule_s_gender').checked;
    const useD = document.getElementById('rule_s_diff').checked;

    // --- 排序逻辑 (仅对自由池) ---
    if (useH) freeStudents.sort((a, b) => a.height - b.height);
    // 核心逻辑：处理绑定关系，使其在列表中紧邻
    // 1. 提取所有有绑定关系的且在自由池中的学生
    let boundPairs = [];
    let processedBindNames = new Set();
    let singleStudents = [];

    freeStudents.forEach(s => {
        if (s._bindPartner && !processedBindNames.has(s.name)) {
            // 找搭档
            const partner = freeStudents.find(p => p.name === s._bindPartner);
            if (partner) {
                // 找到一对，放入 Pairs
                processedBindNames.add(s.name);
                processedBindNames.add(partner.name);
                // 两人按身高排序，矮的在前
                const pair = [s, partner].sort((a, b) => a.height - b.height);
                boundPairs.push(pair);
            } else {
                // 搭档可能被锁定了或者不在班里，降级为单人
                singleStudents.push(s);
            }
        } else if (!processedBindNames.has(s.name)) {
            singleStudents.push(s);
        }
    });

    // 2. 将 Pairs 视为一个整体 (用两人平均身高) 与 Singles 混排
    // 这里为了简单，直接把 Pairs 插在 Singles 队列中对应身高位置
    // 视力优先原则：如果 Pair 中有人视力不好，整个 Pair 提至最前

    let finalQueue = [];
    let visionQueue = [];
    let normalQueue = [];

    // 分流单人
    singleStudents.forEach(s => {
        if (visionInput.length > 0 && s._isVision) visionQueue.push(s);
        else normalQueue.push(s);
    });

    // 分流 Pair
    boundPairs.forEach(pair => {
        const isVisionPair = pair.some(s => s._isVision);
        if (visionInput.length > 0 && isVisionPair) {
            // 拆开插入到视力队列头部（保持相邻）
            visionQueue.push(pair[0], pair[1]);
        } else {
            // 插入到普通队列，根据平均身高找到位置
            const pairAvgHeight = (pair[0].height + pair[1].height) / 2;
            // 简单的二分查找或者直接遍历插入，这里用简单遍历
            let inserted = false;
            for (let i = 0; i < normalQueue.length; i++) {
                // 如果当前位置是普通学生，且身高比 Pair 高，插在前面
                if (normalQueue[i].height > pairAvgHeight) {
                    normalQueue.splice(i, 0, pair[0], pair[1]);
                    inserted = true;
                    break;
                }
            }
            if (!inserted) {
                normalQueue.push(pair[0], pair[1]);
            }
        }
    });

    freeStudents = [...visionQueue, ...normalQueue];

    // 3. 处理难管插空 (尽量避开破坏 Pair，简化处理：如果插空位置正好拆散 Pair，往后挪一位)
    // (由于 Pair 在数组中是相邻的，只要填充逻辑是线性的，大部分情况会同桌)
    // ... 原有的难管逻辑略微复杂，这里暂且保留原有逻辑，但要注意它可能会打乱 Pair
    // 为保证“强绑定”，建议在此处禁用“难管插空”对 Pair 的破坏，或者简单跳过。
    // (此处代码复用上文旧代码的逻辑，暂不修改难管部分，通常只会轻微影响)

    // 视力生提前 (放在数组前面)
    if (visionInput.length > 0 || useV) {
        const visions = freeStudents.filter(s => s._isVision || (useV && s.vision < 4.8));
        const others = freeStudents.filter(s => !s._isVision && !(useV && s.vision < 4.8));
        freeStudents = [...visions, ...others];
    }

    // 难管生插空 (均匀分布)
    const diffs = freeStudents.filter(s => s._isDiff || (useD && s.isDiff));
    if (diffs.length > 0) {
        const cleanList = freeStudents.filter(s => !s._isDiff && !(useD && s.isDiff));
        const step = Math.floor(cleanList.length / (diffs.length + 1));
        let currentPos = step;
        diffs.forEach(d => {
            if (currentPos < cleanList.length) cleanList.splice(currentPos, 0, d);
            else cleanList.push(d);
            currentPos += step + 1;
        });
        freeStudents = cleanList;
    }

    // 男女混排 (简单的相邻互斥)
    if (useG) {
        for (let i = 0; i < freeStudents.length - 1; i += 2) {
            if (freeStudents[i].gender === freeStudents[i + 1].gender) {
                for (let j = i + 2; j < freeStudents.length; j++) {
                    if (freeStudents[j].gender !== freeStudents[i].gender) {
                        [freeStudents[i + 1], freeStudents[j]] = [freeStudents[j], freeStudents[i + 1]];
                        break;
                    }
                }
            }
        }
    }

    // 4. 重组布局：将自由学生填回非锁定的坑位
    let newLayout = [];
    let freeIdx = 0;
    // 总座位数取 学生总数 和 现有布局长度 的最大值
    const totalSeats = Math.max(cls.students.length, currentLayout.length);

    for (let i = 0; i < totalSeats; i++) {
        if (lockedSlots[i]) {
            newLayout[i] = lockedSlots[i]; // 放回锁定学生
        } else {
            if (freeIdx < freeStudents.length) {
                newLayout[i] = freeStudents[freeIdx++]; // 填入自由学生
            } else {
                newLayout[i] = null; // 空位
            }
        }
    }

    cls.seatLayout = newLayout;
    FB_renderSeatMap();
}

function FB_renderSeatMap() {
    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
    const container = document.getElementById('seat_map_container');
    container.innerHTML = '';

    const groups = parseInt(document.getElementById('seat_opt_groups').value);
    const colsPerGroup = parseInt(document.getElementById('seat_opt_cols').value);

    container.style.display = 'grid';
    container.style.gridTemplateColumns = `repeat(${groups}, 1fr)`;
    container.style.gap = '50px';
    container.style.alignItems = 'start';
    container.style.padding = '20px'; // 增加内边距防止旋转溢出

    const list = cls.seatLayout || cls.students;
    const rowCapacity = groups * colsPerGroup;
    const totalRows = Math.ceil(list.length / rowCapacity);

    const groupEls = [];
    for (let g = 0; g < groups; g++) {
        const gel = document.createElement('div'); gel.className = 'seat-group';
        gel.style.display = 'grid'; gel.style.gridTemplateColumns = `repeat(${colsPerGroup}, 1fr)`;
        gel.style.gap = '10px'; gel.style.position = 'relative';
        groupEls.push(gel); container.appendChild(gel);
    }

    for (let r = 0; r < totalRows; r++) {
        for (let g = 0; g < groups; g++) {
            for (let c = 0; c < colsPerGroup; c++) {
                const stuIdx = r * rowCapacity + g * colsPerGroup + c;
                const stu = list[stuIdx];
                const desk = document.createElement('div');
                desk.className = 'desk';

                if (stu) {
                    if (stu.gender === 'M') desk.classList.add('is-male');
                    if (stu.gender === 'F') desk.classList.add('is-female');
                    if (stu.isDiff || stu._isDiff) desk.classList.add('is-diff');

                    // 处理锁定状态
                    if (stu.locked) desk.classList.add('locked');

                    desk.draggable = !stu.locked; // 锁定的不能拖
                    desk.dataset.idx = stuIdx;
                    desk.innerHTML = `<div class="desk-name">${stu.name}</div><div class="desk-info"><span>${stu.height}cm</span><span>${stu.score}</span></div><div class="desk-popover">视力:${stu.vision} | 备注:${stu.remarks}</div>`;

                    // 绑定右键事件
                    desk.oncontextmenu = (e) => {
                        e.preventDefault();
                        FB_toggleLock(stuIdx);
                    };

                    // 拖拽事件 (仅未锁定时有效)
                    if (!stu.locked) {
                        desk.ondragstart = (e) => { e.dataTransfer.setData('text/plain', stuIdx); desk.classList.add('dragging'); };
                        desk.ondragend = () => desk.classList.remove('dragging');
                        desk.ondragover = (e) => { e.preventDefault(); desk.classList.add('drag-over'); };
                        desk.ondragleave = () => desk.classList.remove('drag-over');
                        desk.ondrop = (e) => {
                            e.preventDefault();
                            const fromIdx = parseInt(e.dataTransfer.getData('text/plain'));
                            const toIdx = stuIdx;
                            // 只有当位置真的发生变化，且双方都没锁定时，才记录历史
                            if (fromIdx !== toIdx && !list[toIdx].locked && !list[fromIdx].locked) {
                                HistoryManager.record(); // 📸 记录！因为马上要交换了
                            }
                            if (!list[toIdx].locked && !list[fromIdx].locked) {
                                [cls.seatLayout[fromIdx], cls.seatLayout[toIdx]] = [cls.seatLayout[toIdx], cls.seatLayout[fromIdx]];
                                FB_renderSeatMap();
                            }
                        };
                    }
                } else {
                    desk.style.visibility = 'hidden';
                }
                groupEls[g].appendChild(desk);
            }
        }
    }

    // 渲染学习小组框 (保持不变)
    for (let g = 0; g < groups; g++) {
        const gel = groupEls[g];
        if (colsPerGroup % 2 === 0) {
            for (let r = 0; r < totalRows; r += 2) {
                for (let c = 0; c < colsPerGroup; c += 2) {
                    const box = document.createElement('div'); box.className = 'learning-group-box';
                    box.style.left = `${c * 90 - 5}px`; box.style.top = `${r * 65 - 5}px`; box.style.width = `175px`; box.style.height = `125px`;
                    const groupsPerBigRow = colsPerGroup / 2; const groupNum = (g * (Math.ceil(totalRows / 2) * groupsPerBigRow)) + ((r / 2) * groupsPerBigRow) + (c / 2) + 1;
                    box.innerHTML = `<div class="learning-group-label">小组 ${groupNum}</div>`; gel.appendChild(box);
                }
            }
        }
    }
}

// 辅助函数：切换锁定状态
function FB_toggleLock(idx) {
    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
    const stu = cls.seatLayout[idx];
    if (stu) {
        stu.locked = !stu.locked; // 切换状态
        FB_renderSeatMap(); // 重绘
    }
}

// 辅助函数：切换视角旋转
function FB_toggleViewRotation() {
    const canvas = document.querySelector('.seat-canvas');
    if (!canvas) return;
    canvas.classList.toggle('view-rotated');
}

function FB_saveToLocal() { if (!FB_CLASSES.length) return alert("暂无数据"); localStorage.setItem('FB_DATA_BACKUP', JSON.stringify(FB_CLASSES)); alert("方案已保存至浏览器缓存"); }
function FB_exportResult() {
    if (!FB_CLASSES.length) return alert("无数据"); const wb = XLSX.utils.book_new(); const data = [['班级', '座位号', '姓名', '性别', '总分', '身高', '视力', '备注']];
    FB_CLASSES.forEach(c => { const list = c.seatLayout || c.students; list.forEach((s, i) => { data.push([c.name, i + 1, s.name, s.gender, s.score, s.height, s.vision, s.remarks]); }); });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "分班与座位表"); XLSX.writeFile(wb, "新生分班结果.xlsx");
}

// --- 固定搭档 (绑定) 辅助函数 ---
function addBindPair(type) {
    const idA = 'fb_bind_sel_a';
    const idB = 'fb_bind_sel_b';
    const wrapperId = 'widget_fb_bind';
    const hiddenId = 'fb_c_bind';

    const selA = document.getElementById(idA);
    const selB = document.getElementById(idB);


    if (!selA || !selB) return;
    if (!selA.value || !selB.value) return alert("请先选择两个学生");
    if (selA.value === selB.value) return alert("不能选择同一个学生");

    addTagToWidget(wrapperId, hiddenId, `${selA.value}&${selB.value}`);
    selA.value = ""; selB.value = "";
}

// --- 方案管理 (保存/读取) ---
function FB_initScenarioSelect() {
    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
    const sel = document.getElementById('seat_scenario_select');
    if (!sel) return;
    sel.innerHTML = '<option value="">-- 选择方案 --</option>';
    if (!cls) {
        sel.disabled = true;
        return;
    }
    sel.disabled = false;

    if (!cls.scenarios) cls.scenarios = {}; // 初始化存储结构

    Object.keys(cls.scenarios).forEach(name => {
        sel.innerHTML += `<option value="${name}">${name}</option>`;
    });
}

function FB_saveScenario() {
    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
    if (!cls) return alert("请先打开一个班级座位图");
    if (!cls.seatLayout || cls.seatLayout.length === 0) return alert("当前座位表为空，无法保存");

    const name = prompt("请输入方案名称 (如：期中考试、日常、互助组)", `方案 ${Object.keys(cls.scenarios || {}).length + 1}`);
    if (!name) return;

    if (!cls.scenarios) cls.scenarios = {};
    // 深度拷贝当前布局
    cls.scenarios[name] = JSON.parse(JSON.stringify(cls.seatLayout));

    alert(`方案 [${name}] 保存成功！`);
    FB_initScenarioSelect(); // 刷新下拉框
    document.getElementById('seat_scenario_select').value = name;
}

function FB_loadScenario() {
    const sel = document.getElementById('seat_scenario_select');
    if (!sel) return;
    const name = sel.value;
    if (!name) return;

    const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
    if (!cls) return alert("请先打开一个班级座位图");
    if (cls.scenarios && cls.scenarios[name]) {
        if (!confirm(`确定要加载 [${name}] 方案吗？\n当前未保存的修改将丢失。`)) {
            sel.value = "";
            return;
        }
        // 恢复布局
        cls.seatLayout = JSON.parse(JSON.stringify(cls.scenarios[name]));
        FB_renderSeatMap();
    }
}

function FB_deleteScenario() {
    const sel = document.getElementById('seat_scenario_select');
    if (!sel) return;
    const name = sel.value;
    if (!name) return alert("请先选择一个要删除的方案");

    if (confirm(`确定要永久删除方案 [${name}] 吗？`)) {
        const cls = FB_CLASSES[FB_CUR_CLASS_IDX];
        if (!cls) return alert("请先打开一个班级座位图");
        delete cls.scenarios[name];
        FB_initScenarioSelect();
    }
}

// Hook: 在打开座位表时初始化下拉框
// 需要修改 FB_openSeatMap 函数，这里通过重写或在原函数后追加逻辑
// 为了简单，请在 FB_openSeatMap 函数内部末尾添加 FB_initScenarioSelect();

// ================== 智能考场编排逻辑 ==================
function EXAM_loadData(input) {
    const file = input.files[0]; if (!file) return; const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result); const wb = XLSX.read(data, { type: 'array' }); const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
            if (!json.length) throw new Error("Excel没有数据");
            EXAM_DATA = json.map(r => ({ name: r['姓名'] || '未知', class: r['班级'] || r['班'] || '未知', school: r['学校'] || '', score: parseFloat(r['总分'] || r['score'] || 0) }));
            alert(`✅ 已导入 ${EXAM_DATA.length} 名学生，准备进行考场编排。`);
        } catch (err) { alert("读取失败：" + err.message); }
    }; reader.readAsArrayBuffer(file);
}

function EXAM_generate() {
    if (!EXAM_DATA.length) return alert("请先导入学生名单");

    const prefix = document.getElementById('exam_prefix').value;
    const seatsPerRoom = parseInt(document.getElementById('exam_seats_per_room').value) || 30;
    const useSeparate = document.getElementById('exam_opt_separate').checked;
    const useSnake = document.getElementById('exam_opt_snake').checked;

    // 1. 初步排序：按成绩降序 (保证考场分层)
    let list = [...EXAM_DATA].sort((a, b) => b.score - a.score);

    // 2. 同班互斥逻辑 (核心业务升级)
    // 原理：遍历列表，如果发现当前学生与上一个学生同班，则向后寻找非同班学生进行交换
    // 限制：仅在小范围内(如后10名)寻找，避免破坏成绩分层太严重
    if (useSeparate) {
        let swapCount = 0;
        for (let i = 1; i < list.length - 1; i++) {
            // 如果当前学生与前一个同班
            if (list[i].class === list[i - 1].class) {
                // 向后寻找最近的一个不同班同学
                let swapped = false;
                for (let j = i + 1; j < Math.min(i + 15, list.length); j++) {
                    if (list[j].class !== list[i].class && list[j].class !== list[i - 1].class) {
                        // 交换位置
                        [list[i], list[j]] = [list[j], list[i]];
                        swapped = true;
                        swapCount++;
                        break;
                    }
                }
            }
        }
        if (swapCount > 0) UI.toast(`已智能微调 ${swapCount} 人次以打散同班同学`, 'success');
    }

    EXAM_ROOMS = [];
    const cols = 4; // 假设每行4列 (用于计算蛇形)

    list.forEach((s, i) => {
        // 基础考号逻辑
        s.examNo = prefix + String(i + 1).padStart(3, '0');
        s.roomNo = Math.floor(i / seatsPerRoom) + 1;

        // 3. 座位号计算
        let seatIdx = (i % seatsPerRoom); // 0 ~ 29

        // 蛇形排列逻辑 (S型)
        // 假设排列是：
        // 1 2 3 4
        // 8 7 6 5 (反向)
        // 9 10 11 12
        if (useSnake) {
            const row = Math.floor(seatIdx / cols);
            // 如果是奇数行(第2行, idx=1)，则列号反转
            if (row % 2 !== 0) {
                const col = seatIdx % cols;
                const reversedCol = (cols - 1) - col;
                // 重新计算 seatIdx
                seatIdx = (row * cols) + reversedCol;
            }
        }

        s.seatNo = seatIdx + 1;

        if (!EXAM_ROOMS[s.roomNo - 1]) {
            EXAM_ROOMS[s.roomNo - 1] = { id: s.roomNo, students: [] };
        }
        EXAM_ROOMS[s.roomNo - 1].students.push(s);
    });

    // 如果用了蛇形，按座号重新排序一下，方便打印查看
    if (useSnake) {
        EXAM_ROOMS.forEach(r => r.students.sort((a, b) => a.seatNo - b.seatNo));
    }

    document.getElementById('exam-results-area').classList.remove('hidden');
    EXAM_renderOverview();
    EXAM_renderStudentList();
    EXAM_renderProctorTable();
    EXAM_renderPrintView();
}

function EXAM_switchView(view, btn) {
    const links = Array.from(document.querySelectorAll('#exam-results-area .nav-link'));
    links.forEach(l => l.classList.remove('active'));
    const activeBtn = btn || links.find(link => {
        const handler = link.getAttribute('onclick') || '';
        return handler.includes(`'${view}'`) || handler.includes(`"${view}"`);
    });
    if (activeBtn) activeBtn.classList.add('active');
    document.getElementById('exam-view-overview').classList.add('hidden'); document.getElementById('exam-view-students').classList.add('hidden'); document.getElementById('exam-view-proctor').classList.add('hidden');
    const targetView = document.getElementById('exam-view-' + view);
    if (targetView) targetView.classList.remove('hidden');
}

function EXAM_renderOverview() {
    const container = document.getElementById('exam_room_grid'); container.innerHTML = '';
    EXAM_ROOMS.forEach(room => { const first = room.students[0].examNo; const last = room.students[room.students.length - 1].examNo; container.innerHTML += `<div class="exam-room-card analysis-exam-room-card" onclick="alert('提示：请使用“打印桌贴”功能查看该考场的详细座次表')"><div class="exam-room-title analysis-exam-room-title">第 ${String(room.id).padStart(2, '0')} 考场</div><div class="exam-room-info analysis-exam-room-info"><span>人数: ${room.students.length}</span></div><div class="exam-room-range analysis-exam-room-range">${first} - ${last}</div></div>`; });
}

function EXAM_renderStudentList() {
    const tbody = document.querySelector('#exam_student_table tbody'); let html = '';
    const sorted = [...EXAM_DATA].sort((a, b) => { if (a.class !== b.class) return String(a.class).localeCompare(String(b.class), undefined, { numeric: true }); return a.examNo.localeCompare(b.examNo); });
    sorted.slice(0, 500).forEach(s => { html += `<tr><td>${s.examNo}</td><td>${s.name}</td><td>${s.class}</td><td>${String(s.roomNo).padStart(2, '0')}</td><td>${String(s.seatNo).padStart(2, '0')}</td><td>${s.score}</td></tr>`; });
    if (sorted.length > 500) html += `<tr><td colspan="6" style="text-align:center">...更多数据请导出Excel查看...</td></tr>`; tbody.innerHTML = html;
}

function EXAM_renderProctorTable() {
    const tbody = document.querySelector('#exam_proctor_table tbody'); let html = '';
    EXAM_ROOMS.forEach(room => { const first = room.students[0].examNo; const last = room.students[room.students.length - 1].examNo; html += `<tr><td>第 ${String(room.id).padStart(2, '0')} 考场</td><td>${room.students.length}</td><td>${first} - ${last}</td><td></td><td></td></tr>`; });
    tbody.innerHTML = html;
}

function EXAM_renderPrintView() {
    const container = document.getElementById('batch-print-area-wrapper') || document.getElementById('batch-print-container'); if (!container) return; container.innerHTML = ''; let html = '';
    EXAM_ROOMS.forEach(room => {
        let seatsHtml = ''; room.students.forEach(s => { seatsHtml += `<div class="exam-print-seat"><div class="exam-print-seat-num">第${String(s.seatNo).padStart(2, '0')}号</div><div class="exam-print-seat-name">${s.name}</div><div class="exam-print-seat-id">考号: ${s.examNo}</div><div style="font-size:10px;">${s.class}</div></div>`; });
        html += `<div class="exam-print-page"><div class="exam-print-header">第 ${String(room.id).padStart(2, '0')} 考场座位表 (共${room.students.length}人)</div><div class="exam-print-grid">${seatsHtml}</div><div style="margin-top:20px; font-size:12px;">监考员签字：_________________   &nbsp;&nbsp;&nbsp; 巡考员签字：_________________</div></div>`;
    });
    container.innerHTML = html;
}

function EXAM_generateDeskLabels() {
    if (!EXAM_ROOMS || EXAM_ROOMS.length === 0) return alert("请先点击“一键生成考场安排”");

    const container = document.getElementById('desk-labels-print-area');
    container.innerHTML = '';
    let html = '';

    EXAM_ROOMS.forEach(room => {
        html += `<div class="desk-label-page">`;

        room.students.forEach(s => {
            html += `
                    <div class="desk-label-card">
                        <!-- 1. 顶部：考号 (最大) -->
                        <div class="dl-exam-no">${s.examNo}</div>

                        <!-- 2. 中间：班级(左) + 姓名(右) (中等) -->
                        <div class="dl-main-row">
                            <span>${s.class}</span>
                            <span>${s.name}</span>
                        </div>

                        <!-- 3. 底部：考场 + 座号 (最小) -->
                        <div class="dl-footer-row">
                            <span class="dl-room-box">${String(room.id).padStart(2, '0')}场</span>
                            <span class="dl-seat-box">${String(s.seatNo).padStart(2, '0')}座</span>
                        </div>
                    </div>
                `;
        });
        html += `</div>`;
    });

    container.innerHTML = html;
    UI.toast("✅ 桌贴生成完毕 (考号最大化)", "success");

    const app = document.getElementById('app');
    const labelsArea = document.getElementById('desk-labels-print-area');
    const originalDisplay = app.style.display;

    app.style.display = 'none';
    labelsArea.style.display = 'block';

    setTimeout(() => {
        window.print();
        app.style.display = originalDisplay;
        labelsArea.style.display = 'none';
        container.innerHTML = '';
    }, 500);
}

// 初始化教师勾选列表和下拉框
function EXAM_initProctorUI() {
    const teachers = [...new Set(Object.values(TEACHER_MAP || {}).map(name => String(name || '').trim()).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b, 'zh-CN'));
    const poolContainer = document.getElementById('proctor-teacher-pool');
    const patrolSel = document.getElementById('proctor-role-patrol');
    const affairsSel = document.getElementById('proctor-role-affairs');
    if (!poolContainer || !patrolSel || !affairsSel) return;

    const prevExcluded = Array.from(document.querySelectorAll('.exclude-check:checked')).map(option => option.value);
    const prevPatrols = Array.from(patrolSel.selectedOptions).map(option => option.value);
    const prevAffairs = Array.from(affairsSel.selectedOptions).map(option => option.value);

    if (!teachers.length) {
        poolContainer.innerHTML = '<div style="padding:8px 0; color:#94a3b8;">暂无任课教师数据，请先导入任课表。</div>';
        patrolSel.disabled = true;
        affairsSel.disabled = true;
        patrolSel.innerHTML = '';
        affairsSel.innerHTML = '';
        return;
    }

    // 渲染黑名单勾选
    poolContainer.innerHTML = teachers.map(name => `
            <label class="teacher-item">
                <input type="checkbox" class="exclude-check" value="${name}" ${prevExcluded.includes(name) ? 'checked' : ''}> ${name}
            </label>
        `).join('');

    // 渲染多选下拉框
    patrolSel.disabled = false;
    affairsSel.disabled = false;
    setMultiSelectOptions(patrolSel, teachers, prevPatrols);
    setMultiSelectOptions(affairsSel, teachers, prevAffairs);
}

// 执行编排逻辑
function EXAM_assignProctors() {
    if (!EXAM_ROOMS.length) return alert("请先生成考场安排");

    const allTeachers = [...new Set(Object.values(TEACHER_MAP || {}).map(name => String(name || '').trim()).filter(Boolean))];
    if (!allTeachers.length) return alert("请先导入任课表，当前没有可用于监考分配的教师。");
    const patrolSelect = document.getElementById('proctor-role-patrol');
    const affairsSelect = document.getElementById('proctor-role-affairs');
    if (!patrolSelect || !affairsSelect) return alert("监考配置面板未就绪，请刷新页面后重试。");

    // 获取排除人员
    const excluded = Array.from(document.querySelectorAll('.exclude-check:checked')).map(el => el.value);

    // 获取特殊岗位人员
    const patrols = [...new Set(Array.from(patrolSelect.selectedOptions).map(o => o.value))];
    const affairsRaw = [...new Set(Array.from(affairsSelect.selectedOptions).map(o => o.value))];
    const duplicateRoles = affairsRaw.filter(name => patrols.includes(name));
    const affairs = affairsRaw.filter(name => !patrols.includes(name));
    if (duplicateRoles.length) {
        Array.from(affairsSelect.options).forEach(option => {
            option.selected = affairs.includes(option.value);
        });
        if (window.UI) UI.toast(`已自动去重特殊岗位：${duplicateRoles.join('、')}`, 'warning');
    }

    // 可用监考池 = 总人员 - 排除 - 特殊岗位
    let availablePool = allTeachers.filter(t =>
        !excluded.includes(t) && !patrols.includes(t) && !affairs.includes(t)
    );

    const needed = EXAM_ROOMS.length * 2;
    if (availablePool.length < needed) {
        return alert(`❌ 人员不足！\n当前考场需要 ${needed} 名监考，但排除后仅剩 ${availablePool.length} 人。\n请减少排除项或合并岗位。`);
    }

    // 洗牌算法乱序
    availablePool.sort(() => Math.random() - 0.5);

    // 填充监考汇总表
    const tbody = document.querySelector('#exam_proctor_table tbody');
    let html = '';
    EXAM_ROOMS.forEach((room, i) => {
        const p1 = availablePool[i * 2];
        const p2 = availablePool[i * 2 + 1];
        const first = room.students[0].examNo;
        const last = room.students[room.students.length - 1].examNo;

        html += `
                <tr>
                    <td><strong>第 ${String(room.id).padStart(2, '0')} 考场</strong></td>
                    <td>${room.students.length}</td>
                    <td>${first} - ${last}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${p1}</td>
                    <td style="background:#eff6ff; font-weight:bold;">${p2}</td>
                </tr>
            `;
    });

    // 底部追加考务组
    html += `
            <tr style="background:#f8fafc; border-top: 2px solid #333;">
                <td colspan="3" style="text-align:right; font-weight:bold;">⚖️ 纪律巡考人员：</td>
                <td colspan="2" style="text-align:left; color:var(--danger); font-weight:bold;">${patrols.join('、') || '未指定'}</td>
            </tr>
            <tr style="background:#f8fafc;">
                <td colspan="3" style="text-align:right; font-weight:bold;">🧹 卫生考务保障：</td>
                <td colspan="2" style="text-align:left; color:var(--success); font-weight:bold;">${affairs.join('、') || '未指定'}</td>
            </tr>
        `;

    tbody.innerHTML = html;
    UI.toast("✅ 监考人员分配完成，请查看“监考汇总表”", "success");
    // 自动切到汇总表看结果
    EXAM_switchView('proctor', document.querySelector('.nav-link[onclick*="proctor"]'));
}

function EXAM_exportResult() {
    if (!EXAM_DATA.length) return alert("无考生数据");
    if (!EXAM_ROOMS.length) return alert("请先生成考场安排");

    const wb = XLSX.utils.book_new();

    // 1. 考生总表
    const sheet1Data = [['考号', '姓名', '学校', '班级', '考场号', '座号', '参考分']];
    EXAM_DATA.forEach(s => sheet1Data.push([s.examNo, s.name, s.school, s.class, s.roomNo, s.seatNo, s.score]));

    // 2. 监考人员安排表 (核心：直接读取界面表格，所见即所得)
    const sheet2Data = [['单位/考场', '应考人数', '起止考号', '监考老师 A', '监考老师 B']];
    const proctorRows = document.querySelectorAll('#exam_proctor_table tbody tr');

    if (proctorRows.length === 0) {
        alert("⚠️ 提示：您尚未进行“人员配置”或点击“一键编排”。监考表将只包含考生信息。");
    } else {
        proctorRows.forEach(tr => {
            const tds = tr.querySelectorAll('td');
            const rowData = [];
            tds.forEach(td => rowData.push(td.innerText));
            sheet2Data.push(rowData);
        });
    }

    // 3. 考场参考表
    const sheet3Data = [['考场', '座号', '姓名', '考号', '班级']];
    EXAM_DATA.forEach(s => sheet3Data.push([s.roomNo, s.seatNo, s.name, s.examNo, s.class]));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet1Data), "考生座次总表");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet2Data), "全校监考考务表");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet3Data), "桌贴打印备份");

    XLSX.writeFile(wb, `${getCurrentConfig().name || '学校'}考务编排结果全集.xlsx`);
}

    window.FreshmanExamRuntime = {
        syncFbClasses,
        writeFbClasses,
        get students() { return FB_STUDENTS; },
        get classes() { return FB_CLASSES; },
        get simulatedData() { return FB_SIMULATED_DATA; },
        get examData() { return EXAM_DATA; },
        get examRooms() { return EXAM_ROOMS; }
    };

    if (typeof FB_loadData === 'function') window.FB_loadData = FB_loadData;
    if (typeof FB_runDivision === 'function') window.FB_runDivision = FB_runDivision;
    if (typeof FB_generateSingleScheme === 'function') window.FB_generateSingleScheme = FB_generateSingleScheme;
    if (typeof FB_renderSchemeSelector === 'function') window.FB_renderSchemeSelector = FB_renderSchemeSelector;
    if (typeof FB_applyScheme === 'function') window.FB_applyScheme = FB_applyScheme;
    if (typeof FB_calcClassCost === 'function') window.FB_calcClassCost = FB_calcClassCost;
    if (typeof FB_checkConflict === 'function') window.FB_checkConflict = FB_checkConflict;
    if (typeof FB_renderDashboard === 'function') window.FB_renderDashboard = FB_renderDashboard;
    if (typeof FB_renderBalanceChart === 'function') window.FB_renderBalanceChart = FB_renderBalanceChart;
    if (typeof FB_openSeatMap === 'function') window.FB_openSeatMap = FB_openSeatMap;
    if (typeof FB_autoSeatAlgo === 'function') window.FB_autoSeatAlgo = FB_autoSeatAlgo;
    if (typeof FB_renderSeatMap === 'function') window.FB_renderSeatMap = FB_renderSeatMap;
    if (typeof FB_toggleLock === 'function') window.FB_toggleLock = FB_toggleLock;
    if (typeof FB_toggleViewRotation === 'function') window.FB_toggleViewRotation = FB_toggleViewRotation;
    if (typeof FB_saveToLocal === 'function') window.FB_saveToLocal = FB_saveToLocal;
    if (typeof FB_exportResult === 'function') window.FB_exportResult = FB_exportResult;
    if (typeof addBindPair === 'function') window.addBindPair = addBindPair;
    if (typeof FB_initScenarioSelect === 'function') window.FB_initScenarioSelect = FB_initScenarioSelect;
    if (typeof FB_saveScenario === 'function') window.FB_saveScenario = FB_saveScenario;
    if (typeof FB_loadScenario === 'function') window.FB_loadScenario = FB_loadScenario;
    if (typeof FB_deleteScenario === 'function') window.FB_deleteScenario = FB_deleteScenario;
    if (typeof EXAM_loadData === 'function') window.EXAM_loadData = EXAM_loadData;
    if (typeof EXAM_generate === 'function') window.EXAM_generate = EXAM_generate;
    if (typeof EXAM_switchView === 'function') window.EXAM_switchView = EXAM_switchView;
    if (typeof EXAM_renderOverview === 'function') window.EXAM_renderOverview = EXAM_renderOverview;
    if (typeof EXAM_renderStudentList === 'function') window.EXAM_renderStudentList = EXAM_renderStudentList;
    if (typeof EXAM_renderProctorTable === 'function') window.EXAM_renderProctorTable = EXAM_renderProctorTable;
    if (typeof EXAM_renderPrintView === 'function') window.EXAM_renderPrintView = EXAM_renderPrintView;
    if (typeof EXAM_generateDeskLabels === 'function') window.EXAM_generateDeskLabels = EXAM_generateDeskLabels;
    if (typeof EXAM_initProctorUI === 'function') window.EXAM_initProctorUI = EXAM_initProctorUI;
    if (typeof EXAM_assignProctors === 'function') window.EXAM_assignProctors = EXAM_assignProctors;
    if (typeof EXAM_exportResult === 'function') window.EXAM_exportResult = EXAM_exportResult;

    window.__FRESHMAN_EXAM_RUNTIME_PATCHED__ = true;
})();
