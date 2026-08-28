/*
 * 偏科潜力生挖掘（potential-analysis）运行时模块
 *
 * 从 app.js 抽出的「偏科潜力生分析」展示模块：按学校/班级/前 N% 范围筛选，
 * 对总分排名靠前但存在明显学科名次落差（或 T 分相对偏离）的学生做偏科诊断，
 * 渲染表格 + Excel 导出。
 *
 * 纯展示逻辑，不涉及任何成绩计算口径（两率一分 / 优秀线 / 排名核算 / 学校归一化
 * 均不在此）。名次只读——通过 RankingDataService.buildStudentRankIndex 构建
 * 「仅本视图」的内存名次索引，不改动成绩、已存名次或任何评价公式（沿用原注释语义）。
 *
 * 依赖的全局（RAW_DATA / SCHOOLS / SUBJECTS / safeGet / normalizeClass /
 * getAppSchoolRecord / filterRowsToTownshipSchools / listAvailableSchoolsForCompare /
 * RankingDataService / XLSX）都由 app.js setter 同步到 window 或由 vendor / 其它
 * runtime 提供，本模块在其后（DEFERRED_APP_MODULES）加载，通过 root.* 访问并带
 * typeof 兜底。formatVal 为 4 行纯格式化函数，此处内联同一份，避免跨模块耦合。
 *
 * POTENTIAL_STUDENTS_CACHE 沿用 app.js 顶层 let 的「裸名」全局词法绑定：本模块以裸名写入，
 * 与 snapshot-system-runtime 的裸名读取保持一致。学情总览通过 app.js 的只读
 * readPotentialStudentsCache() 获取同一份结果；仍不把可变数组直接挂到 window，避免跨模块写入。
 */
(function (root) {
    if (!root) return;

    const esc = (value) => (typeof root.escapeAppHtml === 'function'
        ? root.escapeAppHtml(value)
        : String(value ?? '').replace(/[&<>"']/g, (char) => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[char])));

    // 与 app.js:5725 formatVal 逐字节一致的纯格式化函数（内联，无耦合）。
    function formatVal(val) {
        if (typeof val !== 'number' || isNaN(val)) return '-';
        return val.toFixed(2);
    }

    const showAlert = (message, type = 'info') => {
        if (root.UI && typeof root.UI.alert === 'function') return root.UI.alert(message, type);
        if (typeof root.uiAlert === 'function') return root.uiAlert(message, type);
        return root.alert(message);
    };

    function updatePotentialSchoolSelect() {
        const sel = root.document.getElementById('potSchoolSelect');
        if (!sel) return;
        const old = sel.value;

        const SCHOOLS = (root.SCHOOLS && typeof root.SCHOOLS === 'object') ? root.SCHOOLS : {};
        const schoolList = (typeof root.listAvailableSchoolsForCompare === 'function') ? root.listAvailableSchoolsForCompare('all') : Object.keys(SCHOOLS || {});
        sel.innerHTML = `<option value="ALL">全部学校</option>${schoolList.map(s => `<option value="${esc(s)}">${esc(s)}</option>`).join('')}`;

        if (old && (old === 'ALL' || SCHOOLS[old])) sel.value = old;
        sel.onchange = updatePotentialClassSelect;
        updatePotentialClassSelect();
    }

    function updatePotentialClassSelect() {
        const schoolSelect = root.document.getElementById('potSchoolSelect');
        const classSelect = root.document.getElementById('potClassSelect');
        if (!schoolSelect || !classSelect) return;
        const oldClass = classSelect.value;
        const RAW_DATA = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        const townshipRows = (typeof root.filterRowsToTownshipSchools === 'function') ? root.filterRowsToTownshipSchools(RAW_DATA || []) : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
        const schoolRecord = typeof root.getAppSchoolRecord === 'function' ? root.getAppSchoolRecord(schoolSelect.value) : null;
        const students = schoolSelect.value === 'ALL' ? townshipRows : (schoolRecord?.students || []);
        const normalizeClass = (typeof root.normalizeClass === 'function') ? root.normalizeClass : (v => String(v ?? ''));
        const classes = Array.from(new Set(students.map(s => s.class).filter(Boolean)))
            .sort((a, b) => normalizeClass(a).localeCompare(normalizeClass(b), 'zh-Hans-CN', { numeric: true }));
        classSelect.innerHTML = `<option value="ALL">全部班级</option>${classes.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('')}`;
        if (oldClass && Array.from(classSelect.options || []).some(option => option.value === oldClass)) classSelect.value = oldClass;
    }

    function renderPotentialAnalysis() {
        const RAW_DATA = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        const SCHOOLS = (root.SCHOOLS && typeof root.SCHOOLS === 'object') ? root.SCHOOLS : {};
        const SUBJECTS = Array.isArray(root.SUBJECTS) ? root.SUBJECTS : [];
        const normalizeClass = (typeof root.normalizeClass === 'function') ? root.normalizeClass : (v => String(v ?? ''));
        const safeGet = (typeof root.safeGet === 'function') ? root.safeGet : ((obj, path, dflt) => dflt);
        if (!RAW_DATA.length) return showAlert('请先上传数据');
        const scope = root.document.getElementById('potSchoolSelect').value;
        const selectedClass = root.document.getElementById('potClassSelect')?.value || 'ALL';
        const topRatio = parseFloat(root.document.getElementById('potTopSelect').value);

        let candidates = [];
        const townshipRows = (typeof root.filterRowsToTownshipSchools === 'function')
            ? root.filterRowsToTownshipSchools(RAW_DATA || [])
            : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
        let scopeStudents = (scope === 'ALL') ? townshipRows : (SCHOOLS[scope]?.students || []);
        const normalizedSelectedClass = normalizeClass(selectedClass);
        if (normalizedSelectedClass && normalizedSelectedClass.toLowerCase() !== 'all') {
            scopeStudents = scopeStudents.filter(s => normalizeClass(s.class || '') === normalizedSelectedClass);
        }

        if (!scopeStudents.length) {
            root.document.getElementById('potential-results').innerHTML = '<div class="info-bar">当前学校/班级范围没有可分析的学生成绩。</div>';
            POTENTIAL_STUDENTS_CACHE = [];
            return;
        }

        // The raw cloud rows may omit pre-computed ranks.  Build an in-memory
        // index for this view only so analysis remains available without changing
        // scores, stored ranks, or any published evaluation formula.
        const rankIndex = root.RankingDataService?.buildStudentRankIndex(RAW_DATA, SUBJECTS) || null;
        const rankScope = normalizedSelectedClass && normalizedSelectedClass.toLowerCase() !== 'all'
            ? 'class'
            : (scope === 'ALL' ? 'township' : 'school');
        const rankScopeLabel = rankScope === 'class' ? '班级' : (rankScope === 'school' ? '学校' : '全镇');
        const totalCount = scopeStudents.length;
        const topRankThreshold = Math.max(1, Math.ceil(totalCount * topRatio));
        const rankGapThreshold = Math.max(5, Math.ceil(totalCount * 0.15));
        const readRank = (student, subject) => {
            const stored = Number(safeGet(student, `ranks.${subject}.${rankScope}`, 0));
            if (Number.isFinite(stored) && stored > 0) return stored;
            const computed = Number(rankIndex?.getRank(student, subject, rankScope, 0));
            return Number.isFinite(computed) && computed > 0 ? computed : 0;
        };

        scopeStudents.forEach(stu => {
            const tRank = readRank(stu, 'total');
            if (!tRank || tRank > topRankThreshold) return;

            const useAdvancedMetrics = (stu.tScores && stu.totalTScore);

            SUBJECTS.forEach(sub => {
                const subRank = readRank(stu, sub);
                if (!subRank) return;

                let isPotential = false;
                let gapVal = 0;
                let gapLabel = '';

                if (useAdvancedMetrics) {
                    const subT = stu.tScores[sub];
                    const validSubCount = Object.values(stu.tScores).filter(v => v > 0).length || 1;
                    const selfAvgT = stu.totalTScore / validSubCount;

                    if ((selfAvgT - subT) > 8) {
                        isPotential = true;
                        gapVal = (selfAvgT - subT).toFixed(1);
                        gapLabel = `相对偏离 -${gapVal}`;
                    }
                } else {
                    const gap = subRank - tRank;
                    if (gap >= rankGapThreshold) {
                        isPotential = true;
                        gapVal = gap;
                        gapLabel = `名次落差 ${gap}`;
                    }
                }

                if (isPotential) {
                    candidates.push({
                        school: stu.school, class: stu.class, name: stu.name,
                        totalScore: stu.total, totalRank: tRank, rankScope,
                        subject: sub, subScore: stu.scores[sub], subRank: subRank,
                        gap: gapLabel, // 显示文本
                        sortVal: parseFloat(gapVal) // 用于排序
                    });
                }
            });
        });

        candidates.sort((a, b) => b.sortVal - a.sortVal);
        POTENTIAL_STUDENTS_CACHE = candidates;

        let html = `<div class="info-bar">
                <strong>💡 分析模型升级：</strong>
                系统已自动启用 <b>${candidates.length > 0 && candidates[0].gap.includes('相对偏离') ? '相对偏离模型' : '名次落差模型'}</b>。
                <br>筛选范围：当前${rankScopeLabel}总分前 ${(topRatio * 100).toFixed(0)}%（前 ${topRankThreshold} 名）的学生；名次模型的学科落差阈值为 ${rankGapThreshold} 名。
            </div>
            <div class="table-wrap"><table><thead><tr><th>学校</th><th>班级</th><th>姓名</th><th>总分${rankScopeLabel}排名</th><th>跛脚学科</th><th>学科分数</th><th>学科${rankScopeLabel}排名</th><th>偏科指数</th></tr></thead><tbody>`;

        if (candidates.length === 0) {
            html += `<tr><td colspan="8" style="padding:30px; text-align:center;">当前${rankScopeLabel}范围前 ${(topRatio * 100).toFixed(0)}%（前 ${topRankThreshold} 名）学生中，未命中偏科筛选阈值。</td></tr>`;
        } else {
            candidates.forEach(c => {
                html += `<tr>
                        <td>${esc(c.school)}</td>
                        <td>${esc(c.class)}</td>
                        <td><strong>${esc(c.name)}</strong></td>
                        <td class="text-green">${c.totalRank}</td>
                        <td style="color:var(--primary); font-weight:bold;">${esc(c.subject)}</td>
                        <td>${formatVal(c.subScore)}</td>
                        <td class="text-red">${c.subRank}</td>
                        <td style="color:red; font-weight:bold;">📉 ${c.gap}</td>
                    </tr>`;
            });
        }
        root.document.getElementById('potential-results').innerHTML = html + `</tbody></table></div>`;
    }

    function exportPotentialAnalysis() {
        if (!POTENTIAL_STUDENTS_CACHE.length) { showAlert('请先生成数据或结果为空'); return; }
        if (typeof root.XLSX === 'undefined') return showAlert("导出组件尚未加载完成，请稍后重试。");
        const XLSX = root.XLSX;
        const wb = XLSX.utils.book_new(); const data = [['学校', '班级', '姓名', '总分', '总分排名', '排名口径', '跛脚学科', '学科分数', '学科排名', '名次落差']];
        POTENTIAL_STUDENTS_CACHE.forEach(c => data.push([c.school, c.class, c.name, c.totalScore, c.totalRank, c.rankScope === 'class' ? '班级' : (c.rankScope === 'school' ? '学校' : '全镇'), c.subject, c.subScore, c.subRank, c.gap]));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "偏科生名单"); XLSX.writeFile(wb, "偏科潜力生挖掘名单.xlsx");
    }

    // 回挂到 window，供 HTML onclick（renderPotentialAnalysis/exportPotentialAnalysis）
    // 与 module-entry / student-overview / cohort-db-core / data-cloud / shell 等调用点。
    root.updatePotentialSchoolSelect = updatePotentialSchoolSelect;
    root.updatePotentialClassSelect = updatePotentialClassSelect;
    root.renderPotentialAnalysis = renderPotentialAnalysis;
    root.exportPotentialAnalysis = exportPotentialAnalysis;
    root.PotentialAnalysisRuntime = {
        updatePotentialSchoolSelect,
        updatePotentialClassSelect,
        renderPotentialAnalysis,
        exportPotentialAnalysis
    };
})(typeof window !== 'undefined' ? window : globalThis);
