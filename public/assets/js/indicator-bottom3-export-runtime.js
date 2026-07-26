/*
 * 后1/3 与 指标生 核算结果导出（indicator-bottom3-export）运行时模块
 *
 * 从 app.js 抽出的 exportExcel(type) 通用导出：把「后1/3核算」表(#tb-bottom3)或
 * 「指标生核算」表(#tb-indicator)导出为 Excel。纯只读 DOM 表格→XLSX，零计算/口径
 * 耦合——只读 RAW_DATA.length 做空数据守卫，只读两张已渲染的结果表格，不改任何
 * 成绩/排名/评价字段。
 *
 * 依赖经 root.* 读取：RAW_DATA(app.js setter 镜像到 window)、document/alert/XLSX
 * (浏览器/窗口全局；bare-XLSX 惯例与 app.js/其它导出模块一致)。
 *
 * 调用点不变：src/index.html:1431 onclick="exportExcel('bottom3')"、
 * src/index.html:1537 onclick="exportExcel('indicator')"。注意与 DrillSystem.exportExcel()
 * 是两个不相干的东西(后者是 DrillSystem 的对象方法)。
 * 已在 runtime-loader 的 XLSX_RUNTIME_FUNCTIONS 懒加载列表中，冷点击会先载 XLSX 再转发。
 */
(function (root) {
    if (!root) return;

    function exportExcel(type) {
        const RAW_DATA = Array.isArray(root.RAW_DATA) ? root.RAW_DATA : [];
        const XLSX = root.XLSX;
        const document = root.document;
        if (!RAW_DATA.length) { root.alert('请先上传数据'); return; }
        if (!XLSX || !document) return;

        if (type === 'bottom3') {
            const table = document.getElementById('tb-bottom3');
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.table_to_sheet(table);
            XLSX.utils.book_append_sheet(wb, ws, "核算结果");
            XLSX.writeFile(wb, '后1_3核算结果.xlsx');
            return;
        }

        if (type === 'indicator') {
            const table = document.getElementById('tb-indicator');
            if (table.rows.length < 3) return root.alert("请先点击【开始计算】");

            const wb = XLSX.utils.book_new();

            const wsData = [];
            wsData.push(["学校",
                "指标一目标", "指标一达标", "指标一基础分", "指标一附加分", "指标一小计",
                "指标二目标", "指标二达标", "指标二基础分", "指标二附加分", "指标二小计",
                "指标总分", "排名"]);

            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(tr => {
                const tds = tr.querySelectorAll('td');
                const parseTargetReach = (str) => {
                    const parts = str.split('/');
                    return { t: parts[0].trim(), r: parts[1].trim() };
                };

                const ind1 = parseTargetReach(tds[1].innerText);
                const ind2 = parseTargetReach(tds[5].innerText);

                wsData.push([
                    tds[0].innerText, // 学校
                    ind1.t, ind1.r, tds[2].innerText, tds[3].innerText, tds[4].innerText, // 指标一
                    ind2.t, ind2.r, tds[6].innerText, tds[7].innerText, tds[8].innerText, // 指标二
                    tds[9].innerText, // 总分
                    tds[10].innerText // 排名
                ]);
            });

            const ws = XLSX.utils.aoa_to_sheet(wsData);
            XLSX.utils.book_append_sheet(wb, ws, "指标生核算详细");
            XLSX.writeFile(wb, '指标生核算结果(含附加分).xlsx');
        }
    }

    // 回挂到 window，供 HTML onclick（src/index.html:1431/1537）调用。
    root.exportExcel = exportExcel;
    root.IndicatorBottom3ExportRuntime = { exportExcel };
})(typeof window !== 'undefined' ? window : globalThis);
