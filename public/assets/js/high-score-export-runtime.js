/*
 * 高分段核算导出（high-score-export）运行时模块
 *
 * 从 app.js 抽出的 exportHighScoreExcel()：把乡镇管辖各校的高分段(≥490)核算结果
 * 导出为 Excel —— 实考人数、高分人数、高分率、按最高高分率归一的高分赋分(50)、排名。
 *
 * 纯只读展示导出，零口径 write —— 只读 SCHOOLS/CONFIG 与各校等效学生，赋分为本视图
 * 内的展示计算(hsRatio/maxHighRatio*50)，不回写任何 SCHOOLS.*Stats/scoreInd，不参与
 * 总分/总排名(与 calc-coupled 的 calculate*ForSummary 不同)。
 *
 * 依赖经 root.* 读取，点击期均在 window 上:
 *   SCHOOLS / CONFIG                      —— app.js setter 镜像到 window
 *   getEquivalentSchoolStudents          —— school-normalization-runtime.js:513(core，早于 app.js)
 *   getTownshipManagedSchoolNames / isTownshipManagedSchool —— window(typeof 守卫，可选)
 *   getExcelPercent / getExcelNum        —— app.js 顶层函数=隐式 window 全局
 *   XLSX / alert                         —— 窗口全局
 *
 * 调用点不变：src/index.html:1365 onclick="exportHighScoreExcel()"。已在 runtime-loader
 * XLSX_RUNTIME_FUNCTIONS 懒加载列表(:785)中，冷点击先载 XLSX 再转发。
 */
(function (root) {
    if (!root) return;

    function exportHighScoreExcel() {
        const SCHOOLS = (root.SCHOOLS && typeof root.SCHOOLS === 'object') ? root.SCHOOLS : {};
        const CONFIG = root.CONFIG || {};
        const XLSX = root.XLSX;
        if (!XLSX) return;

        const hasHighScoreScopeHelper = typeof root.getTownshipManagedSchoolNames === 'function';
        const townshipSchoolNames = hasHighScoreScopeHelper ? root.getTownshipManagedSchoolNames(Object.keys(SCHOOLS || {})) : Object.keys(SCHOOLS || {});
        const townshipSchoolSet = new Set((townshipSchoolNames || []).map(name => String(name || '').trim()).filter(Boolean));
        const townshipSchools = Object.values(SCHOOLS).filter((school) => {
            if (!hasHighScoreScopeHelper) return true;
            const name = String(school?.name || '').trim();
            return typeof root.isTownshipManagedSchool === 'function'
                ? root.isTownshipManagedSchool(name, Object.keys(SCHOOLS || {}))
                : townshipSchoolSet.has(name);
        });
        if (!townshipSchools.length) return root.alert("无数据");
        if (!CONFIG.name || !CONFIG.name.includes('9')) return root.alert("非9年级模式无此数据");

        const getEquivalentSchoolStudents = typeof root.getEquivalentSchoolStudents === 'function'
            ? root.getEquivalentSchoolStudents
            : (() => []);
        const getExcelPercent = typeof root.getExcelPercent === 'function' ? root.getExcelPercent : ((v) => v);
        const getExcelNum = typeof root.getExcelNum === 'function' ? root.getExcelNum : ((v) => v);

        const wb = XLSX.utils.book_new();
        const headers = ["学校名称", "实考人数", "高分人数(≥490)", "高分率", "高分赋分(50)", "排名"];
        const wsData = [headers];

        const baseList = townshipSchools.map(s => {
            const students = getEquivalentSchoolStudents(s.name);
            const count = students.length || (s.metrics && s.metrics.total ? s.metrics.total.count : 0);
            const hsCount = students.filter(stu => Number(stu.total) >= 490).length;
            const hsRatio = count ? hsCount / count : 0;
            return {
                name: s.name,
                count,
                hsCount,
                hsRatio
            };
        });
        const maxHighRatio = Math.max(...baseList.map(d => d.hsRatio), 0);
        const list = baseList.map(d => ({
            ...d,
            score: maxHighRatio ? d.hsRatio / maxHighRatio * 50 : 0
        })).sort((a, b) => b.score - a.score);

        list.forEach((d, i) => {
            wsData.push([
                d.name,
                d.count,
                d.hsCount,
                getExcelPercent(d.hsRatio),
                getExcelNum(d.score),
                i + 1
            ]);
        });

        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "高分段核算");
        XLSX.writeFile(wb, `高分段核算_${CONFIG.name}.xlsx`);
    }

    // 回挂到 window，供 HTML onclick（src/index.html:1365）调用。
    root.exportHighScoreExcel = exportHighScoreExcel;
    root.HighScoreExportRuntime = { exportHighScoreExcel };
})(typeof window !== 'undefined' ? window : globalThis);
