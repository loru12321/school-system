/*
 * 指标生核算（indicator-calc）运行时模块
 *
 * 从 app.js 抽出的 calcIndicators()：9 年级指标生核算 —— 按【划线名次】取参考分，
 * 逐校算达标数、基础分、按最大超额归一的附加分、指标总分与排名，渲染 #tb-indicator
 * 表 + 目标匹配面板，并把指标总分写回 SCHOOLS[].scoreInd（经 syncIndicatorScoreToSchools），
 * 供 calcSummary 的总排名使用。
 *
 * 这是 CORE 槽模块（boot APP_MODULES，在 school-normalization 之后、app.js 之前）：
 * 它只在加载时"定义" window.calcIndicators；真正的核算发生在用户点击"开始计算"时，
 * 那时 app.js 早已加载完，下述所有依赖都已在 window 上就位。核心口径数学与原 app.js
 * 逐字一致，仅把 app.js 脚本作用域内的裸标识符（UI/RAW_DATA/SCHOOLS/MY_SCHOOL/
 * CURRENT_EXAM_ID/ensureNormalizedTargets 等 let/const，跨 <script> 不可裸访问）改为 root.*。
 *
 * 依赖（点击期均在 window 上）：
 *   RAW_DATA / SCHOOLS / TARGETS / MY_SCHOOL / CURRENT_EXAM_ID / __RAW_DATA_VERSION
 *                                        —— app.js setter 镜像到 window
 *   SYS_VARS / INDICATOR_LAST_RESULT / __LAST_INDICATOR_CALC_DATA__ —— window
 *   UI / DataManager                     —— window（app.js:44 / :8243）
 *   isIndicatorPromptAllowed / isIndicatorCalcAllowed / clearIndicatorTargetMatchPanel /
 *   renderIndicatorTargetMatchPanel / getRankHTML / escapeAppHtml / sameAppSchoolName /
 *   markSummaryDataChangedIfDependencyChanged / buildSummaryDependencySignature
 *                                        —— app.js 顶层 function=隐式 window 全局
 *   buildIndicatorSchoolBuckets / getTargetConfigBySchool / syncIndicatorScoreToSchools /
 *   filterRowsToTownshipSchools / ensureNormalizedTargets
 *                                        —— school-normalization-runtime.js（core，早于 app.js）
 *   isTownshipManagedSchool / jsStringLiteral —— window（typeof 守卫 / student-jump-runtime）
 *
 * 私有件随本模块（原 app.js 内零外部引用）：IndicatorCalcPerfCache（缓存）、
 * buildIndicatorCalcSignature、cloneIndicatorCalcRows、normalizeIndicatorTargetNumber。
 *
 * 调用点不变：src/index.html 指标表 onclick、app.js 输入等待流/ saveTargetEditor 裸调
 * calcIndicators()、calcSummary 静默重算、exam-analysis-package/support-metrics 经 window。
 */
(function (root) {
    if (!root) return;

    const IndicatorCalcPerfCache = { signature: '', rows: [] };

    function clearCache() {
        IndicatorCalcPerfCache.signature = '';
        IndicatorCalcPerfCache.rows = [];
    }

    function cloneIndicatorCalcRows(rows) {
        return Array.isArray(rows) ? rows.map((row) => ({ ...row })) : [];
    }

    function normalizeIndicatorTargetNumber(value) {
        const number = Number(value);
        return Number.isFinite(number) && number > 0 ? number : 0;
    }

    function buildIndicatorCalcSignature(rankLine1, rankLine2) {
        const targets = (typeof root.ensureNormalizedTargets === 'function')
            ? root.ensureNormalizedTargets()
            : (root.TARGETS || {});
        const targetSignature = Object.keys(targets || {})
            .sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'))
            .map((name) => {
                const target = targets[name] || {};
                return `${String(name).trim()}:${normalizeIndicatorTargetNumber(target.t1)}:${normalizeIndicatorTargetNumber(target.t2)}`;
            })
            .join('|');
        return [
            root.CURRENT_EXAM_ID || '',
            root.__RAW_DATA_VERSION || 0,
            Array.isArray(root.RAW_DATA) ? root.RAW_DATA.length : 0,
            Object.keys(root.SCHOOLS || {}).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN')).join('|'),
            parseInt(rankLine1, 10) || 0,
            parseInt(rankLine2, 10) || 0,
            targetSignature
        ].join('::');
    }

    function calcIndicators(isSilent = false) {
        if (!root.isIndicatorPromptAllowed()) {
            clearCache();
            if (typeof root.clearIndicatorRuntimeState === 'function') root.clearIndicatorRuntimeState();
            root.clearIndicatorTargetMatchPanel();
            if (!isSilent && root.UI) root.UI.toast('仅 9 年级可使用指标生功能', 'warning');
            return [];
        }
        let val1 = root.SYS_VARS?.indicator?.ind1;
        let val2 = root.SYS_VARS?.indicator?.ind2;

        if (!val1) val1 = root.document.getElementById('dm_ind1_input')?.value;
        if (!val2) val2 = root.document.getElementById('dm_ind2_input')?.value;

        const r1 = parseInt(val1);
        const r2 = parseInt(val2);

        if (!r1 || !r2) {
            root.clearIndicatorTargetMatchPanel();
            if (!isSilent && root.confirm("❌ 检测到【划线名次】尚未设置！\n\n是否立即打开「教务数据综合控制台」进行设置？")) {
                root.DataManager.open('params'); // 打开弹窗并切换到参数设置Tab
            }
            return [];
        }

        if (!root.isIndicatorCalcAllowed()) {
            root.clearIndicatorTargetMatchPanel();
            if (root.UI) root.UI.toast('请先加载当前 9 年级考试成绩后再开始计算', 'warning');
            return [];
        }
        if (!root.isIndicatorCalcAllowed()) {
            root.clearIndicatorTargetMatchPanel();
            if (root.UI) root.UI.toast('仅 9 年级期中/期末考试可开始计算', 'warning');
            return;
        }

        if (!root.TARGETS || Object.keys(root.TARGETS).length === 0) {
            root.clearIndicatorTargetMatchPanel();
            if (!isSilent && root.confirm("❌ 检测到【目标人数】尚未导入！\n\n是否立即打开「教务数据综合控制台」进行导入？")) {
                root.DataManager.open('targets'); // 打开弹窗并切换到目标管理Tab
            }
            return [];
        }

        const calcSignature = buildIndicatorCalcSignature(r1, r2);
        if (
            isSilent
            && IndicatorCalcPerfCache.signature === calcSignature
            && Array.isArray(IndicatorCalcPerfCache.rows)
            && IndicatorCalcPerfCache.rows.length
        ) {
            const cachedRows = cloneIndicatorCalcRows(IndicatorCalcPerfCache.rows);
            root.INDICATOR_LAST_RESULT = cachedRows;
            root.__LAST_INDICATOR_CALC_DATA__ = cachedRows;
            return cachedRows;
        }

        root.clearIndicatorTargetMatchPanel();
        Object.values(root.SCHOOLS || {}).forEach(school => {
            if (school && typeof school === 'object') school.scoreInd = 0;
        });

        const townshipRows = (typeof root.filterRowsToTownshipSchools === 'function')
            ? root.filterRowsToTownshipSchools(root.RAW_DATA || [])
            : (Array.isArray(root.RAW_DATA) ? root.RAW_DATA : []);
        const allScores = townshipRows.map(s => s.total).filter(v => typeof v === 'number').sort((a, b) => b - a);
        if (!allScores.length) {
            root.clearIndicatorTargetMatchPanel();
            if (!isSilent && root.UI) root.UI.toast('暂无可计算的指标生成绩数据', 'warning');
            return [];
        }
        const line1Index = Math.min(Math.max(r1, 1), allScores.length) - 1;
        const line2Index = Math.min(Math.max(r2, 1), allScores.length) - 1;
        const line1 = allScores[line1Index];
        const line2 = allScores[line2Index];

        let calcData = [];
        let maxExcess1 = 0; // 指标一最大超额数
        let maxExcess2 = 0; // 指标二最大超额数

        const indicatorBuckets = root.buildIndicatorSchoolBuckets().filter((bucket) => (
            typeof root.isTownshipManagedSchool === 'function'
                ? root.isTownshipManagedSchool(bucket.name, Object.keys(root.SCHOOLS || {}))
                : true
        ));

        indicatorBuckets.forEach(s => {
            const scores = s.students.map(stu => stu.total);
            const reach1 = scores.filter(v => v >= line1).length; // 实际达标1
            const reach2 = scores.filter(v => v >= line2).length; // 实际达标2

            const targetInfo = root.getTargetConfigBySchool(s.name);
            const studentCount = scores.length;
            const rawT1 = normalizeIndicatorTargetNumber(targetInfo.value?.t1);
            const rawT2 = normalizeIndicatorTargetNumber(targetInfo.value?.t2);
            const invalidTarget1 = rawT1 > 0 && studentCount > 0 && rawT1 > studentCount;
            const invalidTarget2 = rawT2 > 0 && studentCount > 0 && rawT2 > studentCount;
            const t = {
                t1: invalidTarget1 ? 0 : rawT1,
                t2: invalidTarget2 ? 0 : rawT2
            };
            const invalidTarget = invalidTarget1 || invalidTarget2;
            const missingTarget = !targetInfo.key || (!t.t1 && !t.t2);

            let base1 = 0;
            if (t.t1 > 0) {
                if (reach1 < t.t1 * 0.6) base1 = 0;
                else if (reach1 >= t.t1) base1 = 30;
                else base1 = (reach1 / t.t1) * 30;
            }

            const excess1 = t.t1 > 0 ? Math.max(0, reach1 - t.t1) : 0;
            if (excess1 > maxExcess1) maxExcess1 = excess1;

            let base2 = 0;
            if (t.t2 > 0) {
                if (reach2 < t.t2 * 0.6) base2 = 0;
                else if (reach2 >= t.t2) base2 = 30;
                else base2 = (reach2 / t.t2) * 30;
            }

            const excess2 = t.t2 > 0 ? Math.max(0, reach2 - t.t2) : 0;
            if (excess2 > maxExcess2) maxExcess2 = excess2;

            calcData.push({
                name: s.name,
                rawNames: Array.isArray(s.rawNames) ? s.rawNames.slice() : [],
                targetKey: targetInfo.key || '',
                missingTarget,
                invalidTarget,
                studentCount,
                rawT1,
                rawT2,
                t1: t.t1, r1: reach1, base1: base1, excess1: excess1,
                t2: t.t2, r2: reach2, base2: base2, excess2: excess2
            });
        });

        calcData.forEach(d => {
            d.bonus1 = (maxExcess1 > 0) ? (d.excess1 / maxExcess1 * 5) : 0;
            d.score1 = d.base1 + d.bonus1;

            d.bonus2 = (maxExcess2 > 0) ? (d.excess2 / maxExcess2 * 5) : 0;
            d.score2 = d.base2 + d.bonus2;

            d.finalScore = d.score1 + d.score2;

            root.syncIndicatorScoreToSchools(d.name, d.finalScore);
            if (Array.isArray(d.rawNames)) {
                d.rawNames.forEach((rawName) => root.syncIndicatorScoreToSchools(rawName, d.finalScore));
            }
        });

        calcData.sort((a, b) => b.finalScore - a.finalScore).forEach((d, i) => d.rank = i + 1);

        const missingTargetSchools = calcData.filter(d => d.missingTarget).map(d => d.name);
        const invalidTargetSchools = calcData
            .filter(d => d.invalidTarget)
            .map(d => `${d.name}(人数${d.studentCount}, 目标${d.rawT1}/${d.rawT2})`);

        const thead = root.document.querySelector('#tb-indicator thead');
        thead.innerHTML = `
            <tr>
                <th rowspan="2">学校</th>
                <th colspan="4" style="background:#e0f2fe; color:#0369a1;">指标一 (参考分:${line1})</th>
                <th colspan="4" style="background:#fff7ed; color:#b45309;">指标二 (参考分:${line2})</th>
                <th rowspan="2">指标总分</th>
                <th rowspan="2">排名</th>
            </tr>
            <tr>
                <th>目标/达标</th><th>基础分</th><th>附加分</th><th>小计</th>
                <th>目标/达标</th><th>基础分</th><th>附加分</th><th>小计</th>
            </tr>
        `;

        let html = '';
        calcData.forEach(d => {
            const isMySchool = root.sameAppSchoolName(d.name, root.MY_SCHOOL);
            const safeName = root.escapeAppHtml(d.name);
            const safeNameArg = root.jsStringLiteral(d.name);
            const targetTitle = d.targetKey ? `目标人数匹配：${d.targetKey}` : '未匹配目标人数';
            html += `
            <tr class="${isMySchool ? 'bg-highlight' : ''}">
                <td style="font-weight:bold;" title="${root.escapeAppHtml(targetTitle)}">${safeName}${d.invalidTarget ? '<span style="display:block; font-size:11px; color:#d97706; font-weight:600;">目标异常</span>' : (d.missingTarget ? '<span style="display:block; font-size:11px; color:#dc2626; font-weight:600;">未匹配目标人数</span>' : '')}</td>

                <!-- 指标一 -->
                <td>
                    <!-- 👇 新增点击事件：点击目标人数，分析如何达标 -->
                    <span class="clickable-num" style="color:#d97706; border-bottom:1px dashed #d97706;"
                          onclick="analyzeTargetGap(${safeNameArg}, 'ind1', ${line1})"
                          title="点击分析：哪些学生差一点就达标？补哪科？">
                        ${d.t1 || (d.invalidTarget ? '异常' : (d.missingTarget ? '未匹配' : 0))}
                    </span> /
                    <strong class="clickable-num" onclick="handleIndicatorClick(${safeNameArg}, 'ind1')">${d.r1}</strong>
                </td>
                <td>${d.base1.toFixed(2)}</td>
                <td style="color:${d.bonus1 > 0 ? 'green' : '#ccc'}; font-weight:bold;">${d.bonus1 > 0 ? '+' : ''}${d.bonus1.toFixed(2)}</td>
                <td style="background:#f0f9ff; font-weight:bold;">${d.score1.toFixed(2)}</td>

                <!-- 指标二 -->
                <td>

                    <span class="clickable-num" style="color:#d97706; border-bottom:1px dashed #d97706;"
                          onclick="analyzeTargetGap(${safeNameArg}, 'ind2', ${line2})"
                          title="点击分析：哪些学生差一点就达标？补哪科？">
                        ${d.t2 || (d.invalidTarget ? '异常' : (d.missingTarget ? '未匹配' : 0))}
                    </span> /
                    <strong class="clickable-num" onclick="handleIndicatorClick(${safeNameArg}, 'ind2')">${d.r2}</strong>
                </td>
                <td>${d.base2.toFixed(2)}</td>
                <td style="color:${d.bonus2 > 0 ? 'green' : '#ccc'}; font-weight:bold;">${d.bonus2 > 0 ? '+' : ''}${d.bonus2.toFixed(2)}</td>
                <td style="background:#fffaf0; font-weight:bold;">${d.score2.toFixed(2)}</td>

                <!-- 总分 -->
                <td class="text-red" style="font-size:1.1em; font-weight:bold;">${d.finalScore.toFixed(2)}</td>
                ${root.getRankHTML(d.rank)}
            </tr>`;
        });
        root.document.querySelector('#tb-indicator tbody').innerHTML = html;
        root.renderIndicatorTargetMatchPanel(calcData, line1, line2);
        const cachedCalcData = cloneIndicatorCalcRows(calcData);
        IndicatorCalcPerfCache.signature = calcSignature;
        IndicatorCalcPerfCache.rows = cachedCalcData;
        root.INDICATOR_LAST_RESULT = cachedCalcData;
        root.__LAST_INDICATOR_CALC_DATA__ = cachedCalcData;
        root.markSummaryDataChangedIfDependencyChanged(
            'indicator',
            root.buildSummaryDependencySignature('indicator', calcData),
            '指标生核算结果已更新，请重新生成总排名。'
        );

        if (!isSilent && root.UI) {
            root.UI.toast("✅ 指标生核算完成 (含附加分)", "success");
        }
        if (!isSilent && missingTargetSchools.length && root.UI) {
            root.UI.toast(`⚠️ ${missingTargetSchools.length} 所学校未匹配到目标人数，指标基础分已按 0 分处理`, 'warning');
        }
        if (!isSilent && invalidTargetSchools.length && root.UI) {
            root.UI.toast(`⚠️ 以下学校目标人数异常（大于学生总数），已按未匹配处理：${invalidTargetSchools.join('、')}`, 'warning');
        }
        return calcData;
    }

    // 回挂到 window：CORE 槽预置 window.calcIndicators，供 app.js 裸调用者/ calcSummary /
    // support-metrics 猴补丁 / exam-analysis-package 经 window 解析，以及指标表 onclick。
    root.calcIndicators = calcIndicators;
    root.IndicatorCalcRuntime = { calcIndicators, clearCache };
})(typeof window !== 'undefined' ? window : globalThis);
