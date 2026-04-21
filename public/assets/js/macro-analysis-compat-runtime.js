(() => {
    if (typeof window === 'undefined' || window.__MACRO_ANALYSIS_COMPAT_RUNTIME_PATCHED__) return;

    function hasMacroData() {
        return !!(window.SCHOOLS && Object.keys(window.SCHOOLS).length);
    }

    function getSortedSchoolNames() {
        return Object.values(window.SCHOOLS || {})
            .slice()
            .sort((left, right) => {
                const leftRank = Number(left?.rank2Rate || left?.countyRank2Rate || 9999);
                const rightRank = Number(right?.rank2Rate || right?.countyRank2Rate || 9999);
                return leftRank - rightRank || String(left?.name || '').localeCompare(String(right?.name || ''), 'zh-CN');
            })
            .map((school) => school.name)
            .filter(Boolean);
    }

    function getMySchoolName() {
        const input = document.getElementById('mySchool');
        return String(input?.value || '').trim();
    }

    function revealHorizontalBox() {
        const box = document.getElementById('horizontal-box');
        if (box) box.classList.remove('hidden');
        return box;
    }

    function renderHorizontalTable() {
        if (!hasMacroData()) return alert('请先上传数据');
        if (typeof window.renderTables === 'function') window.renderTables();

        const schoolNames = getSortedSchoolNames();
        if (!schoolNames.length) return alert('暂无可展示的学校数据');

        const mySchoolName = getMySchoolName();
        const subjects = Array.isArray(window.SUBJECTS) ? window.SUBJECTS.slice() : [];
        const rows = [];

        subjects.forEach((subject) => {
            rows.push({
                label: `${subject}平均分`,
                values: schoolNames.map((schoolName) => {
                    const school = window.SCHOOLS?.[schoolName];
                    const metric = school?.metrics?.[subject];
                    const ranking = school?.rankings?.[subject] || {};
                    return metric ? window.formatRankDisplay(metric.avg, ranking.avg || 0) : '-';
                })
            });
            rows.push({
                label: `${subject}优秀率`,
                values: schoolNames.map((schoolName) => {
                    const school = window.SCHOOLS?.[schoolName];
                    const metric = school?.metrics?.[subject];
                    const ranking = school?.rankings?.[subject] || {};
                    return metric ? window.formatRankDisplay(metric.excRate, ranking.excRate || 0, 'school', true) : '-';
                })
            });
            rows.push({
                label: `${subject}及格率`,
                values: schoolNames.map((schoolName) => {
                    const school = window.SCHOOLS?.[schoolName];
                    const metric = school?.metrics?.[subject];
                    const ranking = school?.rankings?.[subject] || {};
                    return metric ? window.formatRankDisplay(metric.passRate, ranking.passRate || 0, 'school', true) : '-';
                })
            });
        });

        rows.push({
            label: `${window.CONFIG?.label || '总分'}平均分`,
            values: schoolNames.map((schoolName) => {
                const school = window.SCHOOLS?.[schoolName];
                const metric = school?.metrics?.total;
                const ranking = school?.rankings?.total || {};
                return metric ? window.formatRankDisplay(metric.avg, ranking.avg || 0) : '-';
            })
        });
        rows.push({
            label: `${window.CONFIG?.label || '总分'}优秀率`,
            values: schoolNames.map((schoolName) => {
                const school = window.SCHOOLS?.[schoolName];
                const metric = school?.metrics?.total;
                const ranking = school?.rankings?.total || {};
                return metric ? window.formatRankDisplay(metric.excRate, ranking.excRate || 0, 'school', true) : '-';
            })
        });
        rows.push({
            label: `${window.CONFIG?.label || '总分'}及格率`,
            values: schoolNames.map((schoolName) => {
                const school = window.SCHOOLS?.[schoolName];
                const metric = school?.metrics?.total;
                const ranking = school?.rankings?.total || {};
                return metric ? window.formatRankDisplay(metric.passRate, ranking.passRate || 0, 'school', true) : '-';
            })
        });

        const container = document.getElementById('horizontal-table');
        if (!container) return alert('找不到横向对比容器');

        const html = `
            <table class="comparison-table analysis-generated-table analysis-table-dense">
                <thead>
                    <tr>
                        <th>统计项目 / 学校</th>
                        ${schoolNames.map((schoolName) => `<th class="${schoolName === mySchoolName ? 'bg-highlight' : ''}">${schoolName}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${rows.map((row) => `
                        <tr>
                            <td>${row.label}</td>
                            ${row.values.map((value, index) => `<td class="${schoolNames[index] === mySchoolName ? 'bg-highlight' : ''}">${value}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = html;
        const box = revealHorizontalBox();
        if (box && typeof box.scrollIntoView === 'function') {
            box.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        return true;
    }

    function exportHorizontalExcel() {
        if (!hasMacroData()) return alert('暂无数据可导出');

        const mySchoolName = getMySchoolName();
        const schoolNames = getSortedSchoolNames();
        if (!schoolNames.length) return alert('暂无数据可导出');

        const wb = XLSX.utils.book_new();
        const wsData = [];
        const merges = [];
        let rowIndex = 0;
        let mySchoolIndex = -1;

        const borderStyle = {
            top: { style: 'thin', color: { rgb: 'E2E8F0' } },
            bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
            left: { style: 'thin', color: { rgb: 'E2E8F0' } },
            right: { style: 'thin', color: { rgb: 'E2E8F0' } }
        };
        const styleHeader = {
            font: { bold: true, color: { rgb: '333333' }, sz: 11 },
            fill: { fgColor: { rgb: 'F3F4F6' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderStyle
        };
        const styleSubjectBar = {
            font: { bold: true, color: { rgb: '1E40AF' }, sz: 12 },
            fill: { fgColor: { rgb: 'DBEAFE' } },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: { top: { style: 'medium', color: { rgb: '3B82F6' } }, bottom: { style: 'thin' } }
        };
        const styleNormal = { alignment: { horizontal: 'center', vertical: 'center' }, border: borderStyle };
        const styleHighlight = {
            fill: { fgColor: { rgb: 'FEF9C3' } },
            font: { bold: true, color: { rgb: 'B45309' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                ...borderStyle,
                left: { style: 'medium', color: { rgb: 'FACC15' } },
                right: { style: 'medium', color: { rgb: 'FACC15' } }
            }
        };
        const styleRankRow = {
            font: { color: { rgb: '94A3B8' }, sz: 9 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: borderStyle
        };
        const styleHighlightRank = {
            ...styleHighlight,
            font: { color: { rgb: 'B45309' }, sz: 9 }
        };

        const headerRow = [{ v: '统计项目 / 学校', t: 's', s: styleHeader }];
        schoolNames.forEach((name, index) => {
            const isMySchool = name === mySchoolName;
            if (isMySchool) mySchoolIndex = index;
            headerRow.push({ v: name, t: 's', s: isMySchool ? styleHighlight : styleHeader });
        });
        wsData.push(headerRow);
        rowIndex += 1;

        const createCell = (val, type, format, isRankRow, colIndex) => {
            const isMyCol = colIndex === mySchoolIndex;
            let style = isRankRow ? styleRankRow : styleNormal;
            if (isMyCol) style = isRankRow ? styleHighlightRank : styleHighlight;
            if (val === '-' || val === undefined || val === null || Number.isNaN(val)) {
                return { v: '-', t: 's', s: style };
            }
            return { v: val, t: type, z: format, s: style };
        };

        const allItems = [...(window.SUBJECTS || []), 'total'];
        const totalCols = schoolNames.length + 1;
        allItems.forEach((sub) => {
            const label = sub === 'total' ? (window.CONFIG?.label || '总分') : sub;
            const sepRow = [];
            for (let col = 0; col < totalCols; col += 1) {
                sepRow.push({ v: col === 0 ? `📘 ${label} 数据分析` : '', t: 's', s: styleSubjectBar });
            }
            wsData.push(sepRow);
            merges.push({ s: { r: rowIndex, c: 0 }, e: { r: rowIndex, c: totalCols - 1 } });
            rowIndex += 1;

            const labelStyle = (color) => ({
                font: { color: { rgb: color }, bold: true },
                fill: { fgColor: { rgb: 'F9FAFB' } },
                border: borderStyle
            });
            const rowAvg = [{ v: '平均分', t: 's', s: labelStyle('2563EB') }];
            const rowAvgRank = [{ v: '   ↳ 排名', t: 's', s: styleRankRow }];
            const rowExc = [{ v: '优秀率', t: 's', s: labelStyle('16A34A') }];
            const rowExcRank = [{ v: '   ↳ 排名', t: 's', s: styleRankRow }];
            const rowPass = [{ v: '及格率', t: 's', s: labelStyle('D97706') }];
            const rowPassRank = [{ v: '   ↳ 排名', t: 's', s: styleRankRow }];

            schoolNames.forEach((schoolName, idx) => {
                const school = window.SCHOOLS?.[schoolName];
                const metrics = school?.metrics?.[sub];
                const rankings = school?.rankings?.[sub] || {};
                if (metrics) {
                    rowAvg.push(createCell(Number(metrics.avg?.toFixed?.(2) || metrics.avg), 'n', '0.00', false, idx));
                    rowAvgRank.push(createCell(rankings.avg, 'n', '0', true, idx));
                    rowExc.push(createCell(metrics.excRate, 'n', '0.00%', false, idx));
                    rowExcRank.push(createCell(rankings.excRate, 'n', '0', true, idx));
                    rowPass.push(createCell(metrics.passRate, 'n', '0.00%', false, idx));
                    rowPassRank.push(createCell(rankings.passRate, 'n', '0', true, idx));
                } else {
                    [rowAvg, rowAvgRank, rowExc, rowExcRank, rowPass, rowPassRank].forEach((row) => row.push(createCell('-', 's', null, false, idx)));
                }
            });

            wsData.push(rowAvg, rowAvgRank, rowExc, rowExcRank, rowPass, rowPassRank);
            rowIndex += 6;
        });

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        ws['!merges'] = merges;
        ws['!cols'] = [{ wch: 20 }, ...schoolNames.map(() => ({ wch: 11 }))];
        ws['!freeze'] = { xSplit: 1, ySplit: 1 };
        XLSX.utils.book_append_sheet(wb, ws, '横向对比分析');
        XLSX.writeFile(wb, `乡镇学校横向对比表_${mySchoolName || '全镇'}.xlsx`);
    }

    function exportMacroTables() {
        if (!hasMacroData()) return alert('请先上传数据');

        const wb = XLSX.utils.book_new();
        const isGrade9 = String(window.CONFIG?.name || '').includes('9');
        const headerRow = ['学校名称', '实考人数', '平均分', '优秀率', '及格率'];
        if (isGrade9) headerRow.push('高分人数(≥490)', '高分率', '高分赋分');
        headerRow.push('赋分-均分', '赋分-优率', '赋分-及格', '两率一分总分', '排名');

        const summaryData = [headerRow];
        const list = Object.values(window.SCHOOLS || {}).slice().sort((a, b) => (a.rank2Rate || 9999) - (b.rank2Rate || 9999));
        list.forEach((school) => {
            const metric = school.metrics?.total || {};
            const row = [
                school.name,
                metric.count || 0,
                window.getExcelNum(metric.avg),
                window.getExcelPercent(metric.excRate),
                window.getExcelPercent(metric.passRate)
            ];
            if (isGrade9) {
                const hs = school.highScoreStats || { count: 0, ratio: 0, score: 0 };
                row.push(hs.count, window.getExcelPercent(hs.ratio), window.getExcelNum(hs.score));
            }
            row.push(
                window.getExcelNum(metric.ratedAvg),
                window.getExcelNum(metric.ratedExc),
                window.getExcelNum(metric.ratedPass),
                window.getExcelNum(school.score2Rate),
                school.rank2Rate || ''
            );
            summaryData.push(row);
        });

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
        if (typeof window.decorateExcelSheet === 'function') window.decorateExcelSheet(wsSummary, headerRow);
        XLSX.utils.book_append_sheet(wb, wsSummary, '综合总表');

        (window.SUBJECTS || []).forEach((subject) => {
            const subHeaders = ['学校名称', '实考人数', '平均分', '优秀率', '及格率', '均分排名', '优率排名', '及格排名'];
            const subData = [subHeaders];
            const subList = Object.values(window.SCHOOLS || {})
                .filter((school) => school.metrics?.[subject])
                .sort((a, b) => ((a.rankings?.[subject]?.avg || 9999) - (b.rankings?.[subject]?.avg || 9999)));
            subList.forEach((school) => {
                const metric = school.metrics?.[subject];
                const ranking = school.rankings?.[subject] || {};
                subData.push([
                    school.name,
                    metric.count,
                    window.getExcelNum(metric.avg),
                    window.getExcelPercent(metric.excRate),
                    window.getExcelPercent(metric.passRate),
                    ranking.avg || '',
                    ranking.excRate || '',
                    ranking.passRate || ''
                ]);
            });
            const wsSub = XLSX.utils.aoa_to_sheet(subData);
            if (typeof window.decorateExcelSheet === 'function') window.decorateExcelSheet(wsSub, subHeaders);
            XLSX.utils.book_append_sheet(wb, wsSub, subject);
        });

        try {
            renderHorizontalTable();
        } catch (error) {
            console.warn('[macro-analysis-compat] renderHorizontalTable before export failed:', error);
        }
        const horizontalTable = document.querySelector('#horizontal-table table');
        if (horizontalTable) {
            const wsHorizontal = XLSX.utils.table_to_sheet(horizontalTable);
            XLSX.utils.book_append_sheet(wb, wsHorizontal, '横向对比');
        }

        XLSX.writeFile(wb, `乡镇宏观分析_${window.CONFIG?.name || '当前考试'}.xlsx`);
    }

    Object.assign(window, {
        renderHorizontalTable,
        exportHorizontalExcel,
        exportMacroTables
    });

    window.__MACRO_ANALYSIS_COMPAT_RUNTIME_PATCHED__ = true;
})();
