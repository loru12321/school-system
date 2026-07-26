/*
 * 成绩/任课模板下载（template-download）运行时模块
 *
 * 从 app.js 抽出的 downloadTemplate(type)：根据类型(小学/初中/9年级/教师任课)生成
 * 一份含表头与两行示例数据的标准 Excel 模板并下载。
 *
 * 纯静态模板生成器，零计算/口径/数据耦合——不读 RAW_DATA/SCHOOLS/CONFIG 等任何
 * 业务状态，只用 type 分支里硬编码的表头与示例行拼工作簿。
 *
 * 依赖经 root.* 读取，点击期均在 window 上:
 *   XLSX                 —— 窗口全局(bare-XLSX 惯例)
 *   UI.toast             —— 可选，window.UI 存在时提示
 *   logAction            —— starter-status-runtime.js:1 顶层函数=隐式 window 全局
 *
 * 调用点不变：src/index.html 共 8 处 onclick="downloadTemplate('primary'|'junior'|
 * 'grade9'|'teacher')"。注意 SCHEDULER.downloadTemplate() / AccountExcel.downloadTemplate()
 * 是不相干的对象方法，非本全局函数。
 * 已在 runtime-loader XLSX_RUNTIME_FUNCTIONS 懒加载列表(:797)中，冷点击先载 XLSX 再转发。
 */
(function (root) {
    if (!root) return;

    function downloadTemplate(type) {
        const XLSX = root.XLSX;
        if (!XLSX) return;
        const wb = XLSX.utils.book_new();
        let headers = [];
        let sampleData = [];
        let filename = "模板.xlsx";
        let sheetName = "成绩表";

        switch (type) {
            case 'primary':
                headers = ["学校", "班级", "姓名", "考号", "语文", "数学", "英语"];
                sampleData = [
                    ["实验小学", "601", "张三", "2024001", 95, 98, 92],
                    ["实验小学", "601", "李四", "2024002", 88, 90, 85]
                ];
                filename = "小学期末考试_标准模板.xlsx";
                break;
            case 'junior':
                headers = ["学校", "班级", "姓名", "考号", "语文", "数学", "英语", "物理", "历史", "地理", "生物", "政治"];
                sampleData = [
                    ["镇中", "801", "王五", "2024101", 105, 110, 108, 85, 90, 88, 92, 80],
                    ["镇中", "801", "赵六", "2024102", 98, 102, 95, 78, 85, 80, 88, 75]
                ];
                filename = "初中月考_标准模板.xlsx";
                break;
            case 'grade9':
                headers = ["学校", "班级", "姓名", "考号", "语文", "数学", "英语", "物理", "化学", "政治", "历史", "体育"];
                sampleData = [
                    ["一中", "901", "孙七", "2024901", 112, 115, 110, 68, 48, 55, 58, 40],
                    ["一中", "901", "周八", "2024902", 105, 108, 102, 60, 42, 50, 52, 38]
                ];
                filename = "中考一模_标准模板.xlsx";
                break;
            case 'teacher':
                headers = ["班级", "学科", "教师姓名"];
                sampleData = [
                    ["701", "语文", "张老师"],
                    ["701", "数学", "李老师"],
                    ["702", "语文", "张老师"],
                    ["702", "数学", "王老师"]
                ];
                filename = "教师任课信息_导入模板.xlsx";
                sheetName = "请改为学校名称";
                break;
        }

        const wsData = [headers, ...sampleData];
        const ws = XLSX.utils.aoa_to_sheet(wsData);

        ws['!cols'] = headers.map(() => ({ wch: 15 }));

        XLSX.utils.book_append_sheet(wb, ws, sheetName);
        XLSX.writeFile(wb, filename);

        if (root.UI) root.UI.toast(`✅ 已下载：${filename}`, "success");
        if (typeof root.logAction === 'function') root.logAction('下载模板', filename);
    }

    // 回挂到 window，供 HTML onclick（src/index.html 8 处）调用。
    root.downloadTemplate = downloadTemplate;
    root.TemplateDownloadRuntime = { downloadTemplate };
})(typeof window !== 'undefined' ? window : globalThis);
