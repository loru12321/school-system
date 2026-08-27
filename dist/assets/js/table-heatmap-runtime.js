/*
 * 表格热力图（table-heatmap）运行时模块
 *
 * 从 app.js 抽出的「表格热力图」展示模块：对指定容器内的表格按列（横向模式按行）
 * 归一化数值，红→黄→绿着色；排名/名次类列反向着色。再次点击关闭并清除背景色。
 *
 * 纯 DOM 展示逻辑，零数据/计算耦合——只读表格单元格文本、写 inline 背景色，不涉及
 * 任何成绩、口径、全局状态（不读 SCHOOLS/RAW_DATA/SUBJECTS，也不调用任何 app.js
 * 辅助函数）。仅用 DOM API，故通过 root.document / root.alert 访问，无需 typeof 兜底。
 *
 * 调用点不变：src/index.html:1272 的 onclick="toggleTableHeatmap('horizontal-table')"。
 */
(function (root) {
    if (!root) return;

    function toggleTableHeatmap(containerId) {
        const container = root.document.getElementById(containerId);
        if (!container) return;
        const tables = container.querySelectorAll('table');
        if (!tables.length) return root.alert("请先生成表格");

        const isHeatmapOn = container.classList.toggle('heatmap-mode');
        const isHorizontalMode = (containerId === 'horizontal-table');

        tables.forEach(table => {
            if (!isHeatmapOn) {
                table.querySelectorAll('td').forEach(td => td.style.removeProperty('background-color'));
                return;
            }

            const rows = Array.from(table.querySelectorAll('tbody tr'));
            if (rows.length === 0) return;

            const getVal = (cell) => {
                const txt = cell.innerText.split('(')[0].replace(/[%+]/g, '').trim();
                return parseFloat(txt);
            };

            const applyColorToGroup = (cells, isRankType) => {
                const values = cells.map(c => c.val);
                const max = Math.max(...values);
                const min = Math.min(...values);
                const range = max - min;
                if (range === 0) return;

                cells.forEach(item => {
                    let ratio = (item.val - min) / range;
                    if (isRankType) ratio = 1 - ratio;

                    let r, g, b;
                    if (ratio < 0.5) { // 红 -> 黄
                        r = 255;
                        g = Math.round(200 + (ratio * 2) * 55);
                        b = 200;
                    } else { // 黄 -> 绿
                        r = Math.round(255 - ((ratio - 0.5) * 2) * 55);
                        g = 255;
                        b = 200;
                    }

                    item.el.style.setProperty('background-color', `rgb(${r}, ${g}, ${b})`, 'important');
                });
            };

            if (isHorizontalMode) {
                rows.forEach(tr => {
                    let cells = [];
                    const label = tr.children[0].innerText;
                    const isRank = label.includes('排名') || label.includes('名次');

                    for (let c = 1; c < tr.children.length; c++) {
                        const cell = tr.children[c];
                        const val = getVal(cell);
                        if (!isNaN(val)) cells.push({ el: cell, val: val });
                    }
                    applyColorToGroup(cells, isRank);
                });

            } else {
                const colCount = rows[0].children.length;
                for (let c = 1; c < colCount; c++) {
                    let cells = [];
                    const headerText = table.querySelector(`thead th:nth-child(${c + 1})`)?.innerText || "";
                    const isRank = headerText.includes('排') || headerText.includes('名');

                    rows.forEach(r => {
                        const cell = r.children[c];
                        const val = getVal(cell);
                        if (!isNaN(val)) cells.push({ el: cell, val: val });
                    });
                    applyColorToGroup(cells, isRank);
                }
            }
        });
    }

    // 回挂到 window，供 HTML onclick（src/index.html:1272）调用。
    root.toggleTableHeatmap = toggleTableHeatmap;
    root.TableHeatmapRuntime = { toggleTableHeatmap };
})(typeof window !== 'undefined' ? window : globalThis);
