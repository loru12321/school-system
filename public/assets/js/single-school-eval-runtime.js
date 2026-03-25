(function () {
    if (typeof window === 'undefined' || window.__SINGLE_SCHOOL_EVAL_RUNTIME_PATCHED__) return;

    let sseCache = [];

    function getSchoolMap() {
        return window.SCHOOLS && typeof window.SCHOOLS === 'object' ? window.SCHOOLS : {};
    }

    function getTeacherMap() {
        return window.TEACHER_MAP && typeof window.TEACHER_MAP === 'object' ? window.TEACHER_MAP : {};
    }

    function getPreviousData() {
        return Array.isArray(window.PREV_DATA) ? window.PREV_DATA : [];
    }

    function getProgressCache() {
        if (typeof window.readProgressCacheState === 'function') {
            const cache = window.readProgressCacheState();
            return Array.isArray(cache) ? cache : [];
        }
        return [];
    }

    function updateSSESchoolSelect() {
        const sel = document.getElementById('sse_school_select');
        if (!sel) return;
        const old = sel.value;
        const schools = getSchoolMap();
        sel.innerHTML = '<option value="">-- 请选择考核学校 --</option>';
        Object.keys(schools).forEach((schoolName) => {
            sel.innerHTML += `<option value="${schoolName}">${schoolName}</option>`;
        });
        if (old && schools[old]) sel.value = old;
    }

    function updateHeaderLabels(wExc, wPass, wAvg, wProg) {
        const thead = document.querySelector('#sse_table thead');
        if (!thead) return;
        const ths = thead.querySelectorAll('th');
        if (ths[5]) ths[5].innerHTML = `优秀率(25%)<br><small style="color:#999">权重${wExc}</small>`;
        if (ths[6]) ths[6].innerHTML = `及格率(80%)<br><small style="color:#999">权重${wPass}</small>`;
        if (ths[7]) ths[7].innerHTML = `均分对比<br><small style="color:#999">权重${wAvg}</small>`;
        if (ths[8]) {
            if (wProg === 0) {
                ths[8].style.display = 'none';
            } else {
                ths[8].style.display = 'table-cell';
                ths[8].innerHTML = `生源增值<br><small style="color:#999">权重${wProg}</small>`;
            }
        }
    }

    function SSE_calculate() {
        const schoolSelect = document.getElementById('sse_school_select');
        const schoolName = String(schoolSelect?.value || '').trim();
        if (!schoolName) return alert('请先选择要考核的学校');

        const schools = getSchoolMap();
        const schoolData = schools[schoolName];
        if (!schoolData || !schoolData.metrics || !schoolData.metrics.total) return alert('该学校数据不完整');

        let useProgress = !!document.getElementById('sse_check_prog')?.checked;
        const useExc = !!document.getElementById('sse_check_exc')?.checked;
        const usePass = !!document.getElementById('sse_check_pass')?.checked;
        const useAvg = !!document.getElementById('sse_check_avg')?.checked;

        if (useProgress && getPreviousData().length === 0) {
            useProgress = false;
            const progCheckbox = document.getElementById('sse_check_prog');
            if (progCheckbox) progCheckbox.checked = false;
            if (window.UI && typeof window.UI.toast === 'function') {
                window.UI.toast('ℹ️ 未检测到历史数据，已自动切换为“单次分析模式”（不含生源增值）', 'info');
            }
        }

        let wExc = 35;
        let wPass = 35;
        let wAvg = 20;
        let wProg = 10;

        if (!useProgress) {
            wProg = 0;
            wAvg = 30;
        }
        if (!useExc) wExc = 0;
        if (!usePass) wPass = 0;
        if (!useAvg) wAvg = 0;

        updateHeaderLabels(wExc, wPass, wAvg, wProg);

        if (useProgress) {
            let progressCache = getProgressCache();
            if (getPreviousData().length > 0 && progressCache.length === 0 && typeof window.performSilentMatching === 'function') {
                window.performSilentMatching();
                progressCache = getProgressCache();
            }
            if (progressCache.length === 0 && window.UI && typeof window.UI.toast === 'function') {
                window.UI.toast('⚠️ 未检测到历史数据，增值项将记为0分。如只需本次成绩，请取消勾选“生源增值”。', 'warning');
            }
        }

        const classes = {};
        let totalEnrollment = 0;

        (Array.isArray(schoolData.students) ? schoolData.students : []).forEach((student) => {
            if (!classes[student.class]) classes[student.class] = { name: student.class, allStudents: [], validStudents: [] };
            classes[student.class].allStudents.push(student);
            if (student.hasValidScore || student.total > 0) {
                classes[student.class].validStudents.push(student);
            }
        });

        const classNames = Object.keys(classes);
        classNames.forEach((className) => {
            totalEnrollment += classes[className].allStudents.length;
        });

        const avgClassSize = totalEnrollment / (classNames.length || 1);
        const allValidScores = [];
        classNames.forEach((className) => {
            classes[className].validStudents.forEach((student) => allValidScores.push(student.total));
        });
        allValidScores.sort((a, b) => b - a);

        const excLine = allValidScores[Math.floor(allValidScores.length * 0.25)] || 0;
        const passLine = allValidScores[Math.floor(allValidScores.length * 0.80)] || 0;
        const gradeAvgScore = allValidScores.reduce((sum, score) => sum + score, 0) / (allValidScores.length || 1);

        const metrics = [];

        Object.values(classes).forEach((cls) => {
            const enrollment = cls.allStudents.length;
            const count = cls.validStudents.length;
            const realCount = count > 0 ? count : 1;
            const scores = cls.validStudents.map((student) => student.total);
            const avg = scores.reduce((sum, score) => sum + score, 0) / realCount;
            const excRate = scores.filter((value) => value >= excLine).length / realCount;
            const passRate = scores.filter((value) => value >= passLine).length / realCount;
            const sizeDiff = enrollment - avgClassSize;
            const sizeBonus = sizeDiff * 0.1;

            let avgProgress = 0;
            let matchedCount = 0;
            if (useProgress) {
                const progressCache = getProgressCache();
                let progressSum = 0;
                cls.validStudents.forEach((student) => {
                    const rec = progressCache.find((item) => item.name === student.name && item.class === student.class);
                    if (rec) {
                        progressSum += rec.change;
                        matchedCount += 1;
                    }
                });
                avgProgress = matchedCount > 0 ? (progressSum / matchedCount) : 0;
            }

            metrics.push({
                className: cls.name,
                count,
                enrollment,
                avg,
                excRate,
                passRate,
                avgProgress,
                sizeBonus,
                matchedCount
            });
        });

        const maxExcRate = Math.max(...metrics.map((item) => item.excRate), 0) || 1;
        const maxPassRate = Math.max(...metrics.map((item) => item.passRate), 0) || 1;

        let minProg = 0;
        let progRange = 1;
        if (useProgress) {
            const progressVals = metrics.map((item) => item.avgProgress);
            const maxProg = Math.max(...progressVals);
            minProg = Math.min(...progressVals);
            progRange = maxProg - minProg;
        }

        metrics.forEach((item) => {
            item.scoreExc = (item.excRate / maxExcRate) * wExc;
            item.scorePass = (item.passRate / maxPassRate) * wPass;
            item.scoreAvg = (item.avg / gradeAvgScore) * wAvg;
            item.scoreProg = 0;
            if (useProgress) {
                item.scoreProg = progRange === 0 ? wProg : ((item.avgProgress - minProg) / progRange) * wProg;
            }
            item.finalScore = item.scoreExc + item.scorePass + item.scoreAvg + item.scoreProg + item.sizeBonus;
        });

        metrics.sort((left, right) => right.finalScore - left.finalScore);
        sseCache = metrics;

        const tbody = document.querySelector('#sse_table tbody');
        let html = '';
        const teacherMap = getTeacherMap();

        metrics.forEach((item, index) => {
            const teacherName = teacherMap[`${item.className}_班主任`] || '-';
            let bonusBg = '#f3f4f6';
            let bonusColor = '#666';
            let bonusSign = '';
            if (item.sizeBonus > 0.001) {
                bonusBg = '#dcfce7';
                bonusColor = '#166534';
                bonusSign = '+';
            } else if (item.sizeBonus < -0.001) {
                bonusBg = '#fee2e2';
                bonusColor = '#991b1b';
            }

            const progHtml = useProgress
                ? `<td><div style="font-weight:bold; color:${item.avgProgress >= 0 ? 'green' : 'red'}">${item.scoreProg.toFixed(1)}</div><div style="font-size:10px; color:#666">${item.matchedCount > 0 ? (item.avgProgress > 0 ? '+' : '') + item.avgProgress.toFixed(1) + '名' : '-'}</div></td>`
                : '<td style="display:none"></td>';

            html += `
                <tr>
                    <td class="rank-cell ${index < 3 ? 'r-' + (index + 1) : ''}">${index + 1}</td>
                    <td style="font-weight:bold; font-size:15px;">${item.className}</td>
                    <td>${teacherName}</td>
                    <td>
                        <div style="font-size:13px; font-weight:bold; color:#333;">${item.count} <span style="font-size:10px; font-weight:normal; color:#999;">(实考)</span></div>
                        <div style="font-size:12px; color:#0369a1; background:#f0f9ff; display:inline-block; padding:0 4px; border-radius:3px;">${item.enrollment} <span style="font-size:10px; color:#64748b;">(在籍)</span></div>
                    </td>
                    <td>
                        <span class="badge" style="background:${bonusBg}; color:${bonusColor};">
                            ${bonusSign}${item.sizeBonus.toFixed(2)}
                        </span>
                        <div style="font-size:10px; color:#999; margin-top:2px;">(差均 ${(item.enrollment - avgClassSize).toFixed(1)}人)</div>
                    </td>
                    <td><div style="font-weight:bold;">${item.scoreExc.toFixed(1)}</div><div style="font-size:10px; color:#666">率:${(item.excRate * 100).toFixed(1)}%</div></td>
                    <td><div style="font-weight:bold;">${item.scorePass.toFixed(1)}</div><div style="font-size:10px; color:#666">率:${(item.passRate * 100).toFixed(1)}%</div></td>
                    <td><div style="font-weight:bold;">${item.scoreAvg.toFixed(1)}</div><div style="font-size:10px; color:#666">${item.avg.toFixed(1)}</div></td>
                    ${progHtml}
                    <td style="background:#eff6ff; font-weight:800; font-size:18px; color:#1e3a8a;">${item.finalScore.toFixed(2)}</td>
                </tr>
            `;
        });

        if (tbody) tbody.innerHTML = html;
        const hintDiv = document.getElementById('sse_result_container')?.querySelector('.sub-header');
        if (hintDiv) {
            hintDiv.innerHTML = `<span>📊 绩效赋分排行榜</span> <span style="font-size:11px; margin-left:10px; color:#0369a1; background:#e0f2fe; padding:2px 5px; border-radius:4px;">💡 模式：${useProgress ? '全维度(含增值)' : '单次(权重重组)'} | 在籍人数算补贴，实考人数算成绩。</span>`;
        }
        const resultContainer = document.getElementById('sse_result_container');
        if (resultContainer) resultContainer.classList.remove('hidden');
        if (typeof window.tmRenderTeachingModuleStateBars === 'function') window.tmRenderTeachingModuleStateBars();
    }

    function SSE_export() {
        if (!sseCache.length) return alert('请先进行计算');
        if (typeof window.XLSX === 'undefined') return alert('导出能力尚未就绪，请刷新页面后重试');

        const useProgress = !!document.getElementById('sse_check_prog')?.checked;
        const workbook = window.XLSX.utils.book_new();
        const headers = ['排名', '班级', '实考人数', '在籍人数(名单总数)', '大班补偿分', '优秀率%', '优秀得分', '及格率%', '及格得分', '平均分', '均分得分'];
        if (useProgress) {
            headers.push('进步名次', '增值得分');
        }
        headers.push('最终考核总分');

        const data = [headers];
        sseCache.forEach((item, index) => {
            const row = [
                index + 1,
                item.className,
                item.count,
                item.enrollment,
                item.sizeBonus.toFixed(2),
                (item.excRate * 100).toFixed(2),
                item.scoreExc.toFixed(2),
                (item.passRate * 100).toFixed(2),
                item.scorePass.toFixed(2),
                item.avg.toFixed(2),
                item.scoreAvg.toFixed(2)
            ];

            if (useProgress) {
                row.push(item.avgProgress.toFixed(1), item.scoreProg.toFixed(2));
            }

            row.push(item.finalScore.toFixed(2));
            data.push(row);
        });

        const ws = window.XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{ wch: 6 }, { wch: 10 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 15 }];
        window.XLSX.utils.book_append_sheet(workbook, ws, '绩效考核表');
        const schoolName = String(document.getElementById('sse_school_select')?.value || '本校').trim() || '本校';
        window.XLSX.writeFile(workbook, `${schoolName}_绩效考核表.xlsx`);
    }

    window.updateSSESchoolSelect = updateSSESchoolSelect;
    window.SSE_calculate = SSE_calculate;
    window.SSE_export = SSE_export;
    window.__SINGLE_SCHOOL_EVAL_RUNTIME_PATCHED__ = true;
})();
