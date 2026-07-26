/*
 * 数据体检（data-doctor）运行时模块
 *
 * 从 app.js 抽出的「数据体检报告」诊断工具：扫描已上传数据，报告关键字段缺失、
 * 重复录入/同名、总分/分数非数值、负分、超满分预警、班级人数异常等问题，用 Swal
 * 弹窗展示报告。
 *
 * 纯只读诊断 + DOM 展示，零计算/口径耦合——只读 RAW_DATA/SCHOOLS/SUBJECTS/CONFIG
 * 与 AnalyticsKernel.getSubjectFullScore，不写任何全局状态、不改成绩/排名/评价。
 * 依赖经 root.* 读取（app.js syncRuntimeStateToWindow 已把这些镜像到 window）。
 *
 * 调用点不变：src/index.html:934 的 onclick="runDataDoctor()"。
 */
(function (root) {
    if (!root) return;

    function runDataDoctor() {
        const RAW_DATA = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        const SCHOOLS = (root.SCHOOLS && typeof root.SCHOOLS === 'object') ? root.SCHOOLS : {};
        const SUBJECTS = Array.isArray(root.SUBJECTS) ? root.SUBJECTS : [];
        const CONFIG = root.CONFIG || {};

        if (!RAW_DATA.length) return root.alert("请先上传数据，医生才能进行诊断！");

        let issues = [];
        let warnings = [];
        let stats = { total: RAW_DATA.length, zeroCount: 0, highCount: 0, emptyFieldCount: 0 };

        const nameMap = {};
        RAW_DATA.forEach((s, idx) => {
            const rowNo = s.__row || (idx + 2); // 默认第2行开始是数据

            if (!s.school || !s.class || !s.name) {
                stats.emptyFieldCount++;
                issues.push(`🔴 <strong>关键字段缺失：</strong> 行 ${rowNo} 学校/班级/姓名为空`);
                return;
            }

            const key = `${s.school}_${s.class}_${s.name}`;
            if (!nameMap[key]) nameMap[key] = [];
            nameMap[key].push(rowNo);
        });

        Object.entries(nameMap).forEach(([key, rows]) => {
            if (rows.length > 1) {
                const [school, cls, name] = key.split('_');
                issues.push(`🔴 <strong>重复录入/同名：</strong> ${school} ${cls}班 "${name}" 行号: ${rows.join('、')}`);
            }
        });

        RAW_DATA.forEach((s, idx) => {
            const rowNo = s.__row || (idx + 2);
            if (typeof s.total === 'number' && s.total <= 0) stats.zeroCount++;
            if (s.total !== undefined && s.total !== null && isNaN(Number(s.total))) {
                issues.push(`🔴 <strong>总分非数值：</strong> 行 ${rowNo} ${s.name || '未知姓名'} (total = ${s.total})`);
            }

            SUBJECTS.forEach(sub => {
                const val = s.scores ? s.scores[sub] : undefined;
                if (val === undefined || val === null || val === '') {
                    warnings.push(`🟠 <strong>科目缺失：</strong> 行 ${rowNo} ${s.name || '未知姓名'} 未填写 ${sub}`);
                    return;
                }
                if (isNaN(Number(val))) {
                    issues.push(`🔴 <strong>分数非数值：</strong> 行 ${rowNo} ${s.name || '未知姓名'} (${sub} = ${val})`);
                    return;
                }
                if (Number(val) < 0) issues.push(`🔴 <strong>负分异常：</strong> 行 ${rowNo} ${s.name || '未知姓名'} (${sub} = ${val})`);
                const configuredFullScore = root.AnalyticsKernel?.getSubjectFullScore?.(sub, { config: CONFIG });
                const maxScore = Number.isFinite(Number(configuredFullScore)) ? Number(configuredFullScore) : 150;
                if (Number(val) > maxScore) warnings.push(`🟠 <strong>超满分预警：</strong> 行 ${rowNo} ${s.name || '未知姓名'} (${sub} = ${val}，满分 ${maxScore}) - 请确认是否录入错误？`);
            });
        });

        Object.values(SCHOOLS).forEach(sch => {
            const clsCounts = {};
            (sch.students || []).forEach(s => clsCounts[s.class] = (clsCounts[s.class] || 0) + 1);
            Object.entries(clsCounts).forEach(([cls, count]) => {
                if (count < 10) warnings.push(`🟠 <strong>班级人数过少：</strong> ${sch.name} ${cls} 仅 ${count} 人。`);
                if (count > 70) warnings.push(`🟠 <strong>班级人数过多：</strong> ${sch.name} ${cls} 达 ${count} 人。`);
            });
        });

        let reportHtml = `<div style="text-align:left; max-height:400px; overflow-y:auto;">`;

        if (issues.length === 0 && warnings.length === 0) {
            reportHtml += `<div style="text-align:center; padding:20px; color:#16a34a;">
                <i class="ti ti-heart-rate-monitor" style="font-size:48px;"></i><br>
                <h3>数据非常健康！</h3>
                <p>共检测 ${stats.total} 条数据，未发现明显异常。</p>
            </div>`;
        } else {
            reportHtml += `<p>共检测 <strong>${stats.total}</strong> 名学生。</p>`;
            if (stats.emptyFieldCount > 0) {
                reportHtml += `<p style="color:#b91c1c;">关键字段缺失：<strong>${stats.emptyFieldCount}</strong> 条</p>`;
            }

            if (issues.length > 0) {
                reportHtml += `<h4 style="color:#dc2626; margin-top:10px;">❌ 必须处理的错误 (${issues.length})</h4>`;
                reportHtml += `<ul style="color:#b91c1c; background:#fee2e2; padding:10px 20px; border-radius:6px;">`;
                issues.slice(0, 10).forEach(i => reportHtml += `<li>${i}</li>`);
                if (issues.length > 10) reportHtml += `<li>...等共 ${issues.length} 项</li>`;
                reportHtml += `</ul>`;
            }

            if (warnings.length > 0) {
                reportHtml += `<h4 style="color:#b45309; margin-top:10px;">⚠️ 值得注意的预警 (${warnings.length})</h4>`;
                reportHtml += `<ul style="color:#92400e; background:#fffbeb; padding:10px 20px; border-radius:6px;">`;
                warnings.slice(0, 10).forEach(w => reportHtml += `<li>${w}</li>`);
                if (warnings.length > 10) reportHtml += `<li>...等共 ${warnings.length} 项</li>`;
                reportHtml += `</ul>`;
            }
        }
        reportHtml += `</div>`;

        if (root.Swal && typeof root.Swal.fire === 'function') {
            root.Swal.fire({
                title: '🏥 数据体检报告',
                html: reportHtml,
                icon: issues.length > 0 ? 'error' : (warnings.length > 0 ? 'warning' : 'success'),
                confirmButtonText: '确定',
                width: 600
            });
        } else {
            root.alert(`数据体检：错误 ${issues.length} 项，预警 ${warnings.length} 项（共 ${stats.total} 条）。`);
        }
    }

    // 回挂到 window，供 HTML onclick（src/index.html:934）调用。
    root.runDataDoctor = runDataDoctor;
    root.DataDoctorRuntime = { runDataDoctor };
})(typeof window !== 'undefined' ? window : globalThis);
