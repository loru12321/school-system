/*
 * Excel 样式（excel-style）运行时模块
 *
 * 从 app.js 抽出的 decorateExcelSheet() + XLS_STYLES 常量：一键美化 SheetJS worksheet
 * 对象(表头/斑马纹/前三名高亮/低分标红/文本列左对齐/自适应列宽/冻结首行)。
 *
 * 纯函数：入参 (ws, headers)，只 in-place 修改传入的 worksheet 对象，无返回值、零口径、
 * 零 app 状态写、零 DOM。依赖仅 XLSX(window 全局) + 本模块内 XLS_STYLES 常量。
 *
 * CORE 槽模块(boot APP_MODULES，在 school-normalization 之后、app.js 之前)：只在加载时
 * 定义 window.decorateExcelSheet；真正调用发生在用户导出点击时(均在 XLSX.utils.aoa_to_sheet
 * / table_to_sheet 之后)，那时早已加载完。放 CORE 槽是因为 student-details-render-runtime.js
 * 的调用是裸调(无 typeof 守卫)，要求它在 app.js 及所有调用者之前已就位。
 *
 * 5 处外部调用者(均经 window/root)：county-analysis-runtime.js、macro-analysis-compat-runtime.js
 * (×2)、student-details-render-runtime.js、summary-table-export-runtime.js。
 */
(function (root) {
    if (!root) return;

    const XLS_STYLES = {
        HEADER: {
            font: { bold: true, sz: 12, color: { rgb: "333333" }, name: "Microsoft YaHei" },
            fill: { fgColor: { rgb: "E5E7EB" } }, // 浅灰背景
            border: { top: { style: 'thin' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } },
            alignment: { horizontal: "center", vertical: "center", wrapText: true }
        },
        CELL: {
            font: { sz: 11, name: "Arial" },
            border: { top: { style: 'thin', color: { rgb: "E5E7EB" } }, bottom: { style: 'thin', color: { rgb: "E5E7EB" } }, left: { style: 'thin', color: { rgb: "E5E7EB" } }, right: { style: 'thin', color: { rgb: "E5E7EB" } } },
            alignment: { horizontal: "center", vertical: "center" }
        },
        RANK_TOP: {
            font: { bold: true, color: { rgb: "DC2626" } } // 红色
        },
        SCORE_GOOD: {
            font: { color: { rgb: "16A34A" }, bold: true }
        },
        SCORE_BAD: {
            font: { color: { rgb: "DC2626" } }
        }
    };

    /**
     * 一键美化 Worksheet 对象
     * @param {Object} ws SheetJS 的 worksheet 对象
     * @param {Array} headers 表头数组（用于判断列类型）
     */
    function decorateExcelSheet(ws, headers = []) {
        if (!ws['!ref']) return;

        const range = root.XLSX.utils.decode_range(ws['!ref']);
        const colWidths = [];

        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = root.XLSX.utils.encode_cell({ c: C, r: R });
                if (!ws[cellRef]) continue;

                const cell = ws[cellRef];
                const headerName = headers[C] || ""; // 获取当前列的表头名

                let style = JSON.parse(JSON.stringify(R === 0 ? XLS_STYLES.HEADER : XLS_STYLES.CELL));

                if (R === 0) {
                    if (String(cell.v).includes("总分") || String(cell.v).includes("排名")) {
                        style.fill.fgColor = { rgb: "D1FAE5" }; // 浅绿
                    }
                }
                else {
                    if (R % 2 === 0) style.fill = { fgColor: { rgb: "F9FAFB" } };

                    if (headerName.includes("排名") || headerName.includes("名次")) {
                        if (cell.v === 1 || cell.v === 2 || cell.v === 3) {
                            Object.assign(style.font, XLS_STYLES.RANK_TOP.font);
                            style.fill = { fgColor: { rgb: "FEF3C7" } }; // 浅黄底
                        }
                    }

                    if (typeof cell.v === 'number') {
                        if (headerName.includes("率") && cell.v < 0.6) {
                            Object.assign(style.font, XLS_STYLES.SCORE_BAD.font);
                        }
                        if ((headerName.includes("分") || headerName.includes("绩")) && cell.v < 60 && cell.v > 0) {
                            Object.assign(style.font, XLS_STYLES.SCORE_BAD.font);
                        }
                    }

                    if (headerName.includes("姓名") || headerName.includes("学校") || headerName.includes("班级")) {
                        style.alignment.horizontal = "left";
                        style.alignment.indent = 1;
                    }
                }

                cell.s = style;

                const valLen = (cell.v ? String(cell.v).length : 0) * 1.5;
                colWidths[C] = Math.max(colWidths[C] || 5, valLen > 50 ? 50 : valLen); // 限制最大宽度
            }
        }

        ws['!cols'] = colWidths.map(w => ({ wch: w + 2 })); // 加一点padding

        ws['!freeze'] = { xSplit: 0, ySplit: 1 };
    }

    // 回挂到 window：CORE 槽预置 window.decorateExcelSheet，供 app.js 及 5 处外部导出调用者
    // (county-analysis / macro-analysis-compat / student-details-render / summary-table-export)解析。
    root.decorateExcelSheet = decorateExcelSheet;
    root.ExcelStyleRuntime = { decorateExcelSheet, XLS_STYLES };
})(typeof window !== 'undefined' ? window : globalThis);
