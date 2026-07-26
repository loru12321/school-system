/*
 * 冲刺名单/目标缺口分析（target-gap-analysis）运行时模块
 *
 * 从 app.js 抽出的 analyzeTargetGap：点击指标表某校的划线分数，弹出该校针对指标一/
 * 指标二的「冲刺名单」——按总分排序取线下最接近目标的潜力生，标注建议补救学科
 * （带任课老师姓氏）、与年级均分差、达成率进度条，写入抽屉弹窗并暂存导出数据。
 *
 * 纯只读展示 + DOM——只读 RAW_DATA/SUBJECTS/CONFIG/TEACHER_MAP 与各校学生（经
 * getEquivalentSchoolStudents/getTargetConfigBySchool，均由 school-normalization-runtime
 * 于 app.js 前 Object.assign 到 window），只写抽屉 DOM 与 DrillSystem.exportData
 * （展示/导出缓存，非口径字段）。不写任何 SCHOOLS/RAW_DATA 记录、不参与总分/排名。
 *
 * 调用点不变：指标表内联 onclick（app.js:7001/7015，点击期解析 window.analyzeTargetGap，
 * DEFERRED 加载容错）。抽屉 DOM 懒加载沿用 window.ensureLazySectionLoaded('drill-modal')
 * （原 ensureDrillModalDom 仍留在 app.js，本模块内联等价逻辑，不依赖它）。
 */
(function (root) {
    if (!root) return;

    function ensureDrillModalDom() {
        if (typeof root.ensureLazySectionLoaded === 'function') {
            root.ensureLazySectionLoaded('drill-modal');
        }
        return root.document.getElementById('drill-modal');
    }

    function analyzeTargetGap(schoolName, type, lineScore) {
        const RAW_DATA = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        const SUBJECTS = Array.isArray(root.SUBJECTS) ? root.SUBJECTS : [];
        const CONFIG = root.CONFIG || {};
        const TEACHER_MAP = (root.TEACHER_MAP && typeof root.TEACHER_MAP === 'object') ? root.TEACHER_MAP : {};

        const schoolStudents = root.getEquivalentSchoolStudents(schoolName);
        if (!schoolStudents.length) return;

        const targetConfig = root.getTargetConfigBySchool(schoolName).value || { t1: 0, t2: 0 };
        const targetCount = type === 'ind1' ? parseInt(targetConfig.t1) : parseInt(targetConfig.t2);

        if (!targetCount) return root.alert(`未找到 ${schoolName} 的目标设定，请先导入目标人数Excel。`);

        const allStudents = [...schoolStudents].sort((a, b) => b.total - a.total);
        const reached = allStudents.filter(s => s.total >= lineScore);
        const below = allStudents.filter(s => s.total < lineScore);

        const currentCount = reached.length;
        const gap = targetCount - currentCount; // 缺口人数

        const buffer = Math.ceil(targetCount * 0.1) || 5;

        let countToFetch = 0;
        let strategyText = "";

        if (gap > 0) {
            countToFetch = gap + buffer;
            strategyText = `当前差 <strong style="color:red">${gap}</strong> 人达标。已为您筛选最接近目标的 <strong>${countToFetch}</strong> 名潜力生（含 ${buffer} 名保险备份）。`;
        } else {
            countToFetch = buffer;
            strategyText = `当前已达标 (超 ${Math.abs(gap)} 人)。建议继续关注线下前 <strong>${countToFetch}</strong> 名学生，防止上线生波动下滑。`;
        }

        let candidates = below.slice(0, countToFetch);

        if (candidates.length === 0) {
            return root.alert("线下没有更多学生可供挖掘了。");
        }

        const gradeStatsRows = (typeof root.filterRowsToTownshipSchools === 'function')
            ? root.filterRowsToTownshipSchools(RAW_DATA || [])
            : (Array.isArray(RAW_DATA) ? RAW_DATA : []);
        const gradeStats = {};
        SUBJECTS.forEach(sub => {
            const allScores = gradeStatsRows.map(s => s.scores[sub]).filter(v => typeof v === 'number');
            gradeStats[sub] = allScores.reduce((a, b) => a + b, 0) / (allScores.length || 1);
        });

        candidates = candidates.map(s => {
            const scoreGap = lineScore - s.total;

            let validSubjects = SUBJECTS;
            if (CONFIG && Array.isArray(CONFIG.totalSubs)) {
                validSubjects = CONFIG.totalSubs;
            }

            const getSubWithTeacher = (sub) => {
                const teacherKey = `${s.class}_${sub}`;
                let teacher = TEACHER_MAP[teacherKey];
                if (teacher) {
                    const surname = teacher.charAt(0);
                    return `${sub}<small style="color:#666; font-size:0.9em;">(${surname}师)</small>`;
                }
                return sub;
            };

            let allDiffs = [];  // 存储所有科目差值 (用于挖掘潜力)
            let hardWeakness = []; // 存储明显弱项 (低于均分5分)

            validSubjects.forEach(sub => {
                if (s.scores[sub] !== undefined) {
                    const diff = s.scores[sub] - gradeStats[sub];
                    const item = { name: sub, diff: diff };

                    allDiffs.push(item);

                    if (diff < -5) {
                        hardWeakness.push(item);
                    }
                }
            });

            allDiffs.sort((a, b) => a.diff - b.diff);
            hardWeakness.sort((a, b) => a.diff - b.diff);

            let worstSubName = "";
            let worstSubDiff = "";

            if (hardWeakness.length > 0) {
                const targets = hardWeakness.slice(0, 2);

                worstSubName = targets.map(t => getSubWithTeacher(t.name)).join("、");
                worstSubDiff = targets.map(t => t.diff.toFixed(1)).join(" / ");
            } else {
                const targets = allDiffs.slice(0, 2);

                if (targets.length > 0) {
                    worstSubName = "<span style='font-size:10px; color:#666; border:1px solid #ccc; padding:0 2px; border-radius:2px; margin-right:2px;'>潜力</span>" +
                        targets.map(t => getSubWithTeacher(t.name)).join("、");

                    worstSubDiff = targets.map(t => (t.diff > 0 ? '+' : '') + t.diff.toFixed(1)).join(" / ");
                } else {
                    worstSubName = "数据不足";
                    worstSubDiff = "-";
                }
            }

            return {
                name: s.name,
                class: s.class,
                total: s.total,
                scoreGap: scoreGap, // 距离目标的总分差距
                worstSub: worstSubName, // 建议学科 (已带老师名)
                worstDiff: worstSubDiff // 与年级均分差
            };
        });

        const typeName = type === 'ind1' ? '指标一' : '指标二';
        const title = `${schoolName} - ${typeName} 冲刺名单 (目标:${targetCount}人)`;

        let html = `
            <div class="info-bar">
                <div>🎯 <strong>划线分数：${lineScore} 分</strong></div>
                <div style="margin-top:4px;">📊 现状：已达标 ${currentCount} 人 / 目标 ${targetCount} 人。</div>
                <div style="margin-top:4px; color:#0369a1;">💡 策略：${strategyText}</div>
            </div>
            <div class="table-wrap">
                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>班级</th>
                            <th>姓名</th>
                            <th>当前总分</th>
                            <th>距划线差</th>
                            <th style="background:#fee2e2; color:#b91c1c;">🆘 建议补救学科</th>
                            <th>与年级均分差</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        candidates.forEach(c => {
            const isBalanced = c.worstSub.includes("潜力"); // 匹配"潜力"关键字
            const subStyle = isBalanced ? "color:#64748b; font-size:12px;" : "color:#b91c1c; font-weight:bold;";
            const diffStyle = isBalanced ? "color:#64748b;" : "color:#b91c1c; font-weight:bold;";

            const percent = Math.min(100, (c.total / lineScore) * 100).toFixed(1);

            const barColor = percent >= 98 ? '#f59e0b' : '#3b82f6';

            html += `
                <tr>
                    <td style="vertical-align:middle;">${c.class}</td>
                    <td style="vertical-align:middle;">
                        <div style="font-weight:bold; font-size:14px;">${c.name}</div>
                    </td>

                    <!-- 🟢 改造：当前总分 + 可视化进度条 -->
                    <td style="vertical-align:middle;">
                        <div style="display:flex; justify-content:space-between; align-items:flex-end; font-size:12px; margin-bottom:2px;">
                            <span style="font-weight:800; font-size:15px; color:#333;">${c.total}</span>
                            <span style="color:#94a3b8; transform:scale(0.9);">目标:${lineScore}</span>
                        </div>
                        <div style="width:100%; height:6px; background:#e2e8f0; border-radius:3px; overflow:hidden;" title="达成率: ${percent}%">
                            <div style="width:${percent}%; height:100%; background:${barColor}; border-radius:3px;"></div>
                        </div>
                    </td>

                    <td style="vertical-align:middle;">
                        <span class="badge" style="background:#eff6ff; color:#1d4ed8; border:1px solid #dbeafe; font-size:12px;">
                            -${c.scoreGap.toFixed(1)}
                        </span>
                    </td>

                    <td style="vertical-align:middle; ${subStyle}">
                        ${c.worstSub}
                    </td>

                    <td style="vertical-align:middle; ${diffStyle}">
                        ${c.worstDiff}
                    </td>
                </tr>
            `;
        });

        html += `</tbody></table></div>`;

        ensureDrillModalDom();
        root.document.getElementById('drill-title').innerText = title;
        root.document.getElementById('drill-back-btn').classList.add('hidden');
        root.document.getElementById('drill-content').innerHTML = html;

        const classCount = {};
        candidates.forEach(c => { classCount[c.class] = (classCount[c.class] || 0) + 1; });
        const classSummary = Object.entries(classCount)
            .map(([cls, cnt]) => `${cls}班:${cnt}人`)
            .join('， ');

        root.document.getElementById('drill-footer').innerText = `各班潜力生分布：${classSummary} (请平衡各班指标压力)`;

        if (root.DrillSystem) {
            root.DrillSystem.exportData = {
                type: 'gap',
                fileName: title, // 使用弹窗标题作为文件名
                data: candidates
            };
        }

        const exportBtn = root.document.getElementById('drill-export-btn');
        if (exportBtn) exportBtn.classList.remove('hidden');

        root.document.getElementById('drill-modal').style.display = 'flex';
    }

    // 回挂到 window，供指标表内联 onclick（app.js:7001/7015）调用。
    root.analyzeTargetGap = analyzeTargetGap;
    root.TargetGapAnalysisRuntime = { analyzeTargetGap };
})(typeof window !== 'undefined' ? window : globalThis);
