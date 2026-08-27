/*
 * 综合评价总览导出（summary-table-export）运行时模块
 *
 * 从 app.js 抽出的 exportSummaryTable：把「综合评价总览」表(#tb-summary)导出为
 * Excel。纯只读 DOM 表格→XLSX 导出，零计算/口径写入——导出前调用 calcSummary(true)
 * 只是幂等重渲染当前汇总表(与点击「导出报告」前手动刷新等价，不改任何成绩/排名/
 * 评价口径字段)，随后读取已渲染的 #tb-summary 表格生成工作簿。
 *
 * 依赖经 root.* 读取，点击期均在 window 上:
 *   RAW_DATA / SCHOOLS / CONFIG        —— app.js setter 镜像到 window
 *   calcSummary / decorateExcelSheet   —— app.js 顶层函数声明=隐式 window 全局
 *                                         (其它运行时也以 window.calcSummary /
 *                                          window.decorateExcelSheet 调用，已证可达)
 *   XLSX / document / alert            —— 窗口全局(bare-XLSX 惯例与其它导出模块一致)
 *
 * 调用点不变：src/index.html:1652 onclick="exportSummaryTable()"。
 * 已在 runtime-loader XLSX_RUNTIME_FUNCTIONS 懒加载列表(:789)中，冷点击先载 XLSX 再转发。
 */
(function (root) {
    if (!root) return;

    function exportSummaryTable() {
        const RAW_DATA = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        const SCHOOLS = root.SCHOOLS || {};
        const XLSX = root.XLSX;
        const document = root.document;
        if (!RAW_DATA.length || !Object.keys(SCHOOLS).length) {
            root.alert('请先上传成绩数据');
            return;
        }
        if (typeof root.calcSummary === 'function') root.calcSummary(true);
        const table = document && document.getElementById('tb-summary');
        if (!table || !XLSX?.utils?.table_to_sheet) {
            root.alert('综合分析表未就绪，无法导出');
            return;
        }
        const rowCount = table.querySelectorAll('tbody tr').length;
        if (!rowCount) {
            root.alert('暂无乡镇学校综合排名数据，请先确认目标人数管理中的乡镇学校名单。');
            return;
        }
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.table_to_sheet(table);
        if (typeof root.decorateExcelSheet === 'function') {
            const headers = Array.from(table.querySelectorAll('thead th')).map((th) => th.textContent.trim());
            root.decorateExcelSheet(worksheet, headers);
        }
        XLSX.utils.book_append_sheet(workbook, worksheet, '综合评价总览');
        const examLabel = String(root.CONFIG?.name || '当前考试').replace(/[\\/:*?"<>|]/g, '_');
        XLSX.writeFile(workbook, `综合评价总览_${examLabel}.xlsx`);
    }

    // 回挂到 window，供 HTML onclick（src/index.html:1652）调用。
    root.exportSummaryTable = exportSummaryTable;
    root.SummaryTableExportRuntime = { exportSummaryTable };
})(typeof window !== 'undefined' ? window : globalThis);
