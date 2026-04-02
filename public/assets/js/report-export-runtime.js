(() => {
    if (typeof window === 'undefined' || window.__REPORT_EXPORT_RUNTIME_PATCHED__) return;

function printSingleReport() {
    const reportContent = document.getElementById('report-card-capture-area');
    if (!reportContent || reportContent.innerHTML.trim() === "") return uiAlert("请先查询生成报告", 'warning');
    const printContainer = document.createElement('div'); printContainer.id = 'temp-print-wrapper';
    const originalCanvas = reportContent.querySelector('canvas');
    let canvasImg = ''; if (originalCanvas) { canvasImg = `<img src="${originalCanvas.toDataURL()}" style="width:100%; height:100%; object-fit:contain;">`; }
    printContainer.innerHTML = reportContent.innerHTML;
    if (originalCanvas) { const tempCanvasContainer = printContainer.querySelector('.chart-wrapper'); if (tempCanvasContainer) tempCanvasContainer.innerHTML = canvasImg; }
    printContainer.className = 'exam-print-page'; document.body.appendChild(printContainer);
    const style = document.createElement('style'); style.id = 'temp-print-style';
    style.innerHTML = `@media print { body > *:not(#temp-print-wrapper) { display: none !important; } #temp-print-wrapper { display: block !important; width: 100%; position: absolute; top: 0; left: 0; } .report-card-container { box-shadow: none; border: 1px solid #ccc; } -webkit-print-color-adjust: exact; print-color-adjust: exact; }`;
    document.head.appendChild(style); window.print();
    setTimeout(() => { document.body.removeChild(printContainer); document.head.removeChild(style); }, 500);
}

async function downloadSingleReportPDF() {
    const reportContent = document.getElementById('report-card-capture-area');
    if ((!window.jspdf || !window.jspdf.jsPDF || typeof html2canvas === 'undefined') && typeof window.ensurePdfExportVendorsLoaded === 'function') {
        try {
            await window.ensurePdfExportVendorsLoaded();
        } catch (error) {
            return uiAlert('PDF 导出依赖加载失败，请刷新页面后重试', 'error');
        }
    }
    if (!reportContent || reportContent.innerHTML.trim() === "") return uiAlert("请先查询生成报告", 'warning');
    if (!window.jspdf || !window.jspdf.jsPDF) return uiAlert('PDF 库未加载，请刷新页面重试', 'error');
    if (typeof html2canvas === 'undefined') return uiAlert('截图引擎未加载，请刷新页面重试', 'error');

    const { jsPDF } = window.jspdf;
    const canvas = await html2canvas(reportContent, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
    }
    pdf.save(`成绩单_${new Date().toISOString().slice(0, 10)}.pdf`);
}

async function batchGeneratePDF() {
    if ((!window.jspdf || !window.jspdf.jsPDF || typeof html2canvas === 'undefined') && typeof window.ensurePdfExportVendorsLoaded === 'function') {
        try {
            await window.ensurePdfExportVendorsLoaded();
        } catch (error) {
            return uiAlert('PDF 导出依赖加载失败，请刷新页面后重试', 'error');
        }
    }
    const sch = document.getElementById('sel-school').value; const cls = document.getElementById('sel-class').value;
    if (!sch || sch === '--请先选择学校--' || !cls || cls === '--请先选择学校--') { return uiAlert("请先选择学校和班级！", 'warning'); }
    const students = SCHOOLS[sch].students.filter(s => s.class === cls); if (students.length === 0) { return uiAlert("该班级没有学生数据", 'warning'); }
    students.sort((a, b) => b.total - a.total);
    if (window.Swal) {
        const res = await Swal.fire({
            title: '确认批量打印',
            text: `即将生成 ${students.length} 份 A4 报告，是否继续？`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '继续',
            cancelButtonText: '取消'
        });
        if (!res.isConfirmed) return;
    } else if (!confirm(`即将生成 ${students.length} 份 A4 报告。\n\n系统将调用浏览器打印功能，请在打印预览页选择：\n1. 目标打印机：另存为 PDF\n2. 更多设置 -> 勾选“背景图形”\n\n确定继续吗？`)) return;
    const container = document.getElementById('batch-print-container'); container.innerHTML = ''; let batchHtml = '';

    // 清除主报告区，避免 #radarChart 重复 ID 导致 Chart.js 找错画布
    const reportCaptureArea = document.getElementById('report-card-capture-area');
    if (reportCaptureArea) reportCaptureArea.innerHTML = '';
    if (radarChartInstance) { try { radarChartInstance.destroy(); } catch (e) { } radarChartInstance = null; }

    // 创建隐藏的渲染区域，用于逐一渲染并捕获雷达图
    const tempRender = document.createElement('div');
    tempRender.style.cssText = 'position:fixed; left:-9999px; top:0; width:794px; visibility:hidden;';
    document.body.appendChild(tempRender);

    for (const stu of students) {
        tempRender.innerHTML = renderSingleReportCardHTML(stu, 'A4');
        const history = typeof getStudentExamHistory === 'function' ? getStudentExamHistory(stu) : [];
        // 初始化雷达图
        try { if (typeof renderRadarChart === 'function') renderRadarChart(stu, history, tempRender); } catch (e) { console.warn('batch radar chart error:', e); }
        // 等待 Chart.js 绘制完成
        await new Promise(r => setTimeout(r, 200));
        // 将 canvas 转换为 img，确保打印时可见
        const canvas = tempRender.querySelector('canvas');
        if (canvas) {
            try {
                const imgSrc = canvas.toDataURL('image/png');
                const img = document.createElement('img');
                img.src = imgSrc;
                img.style.cssText = 'width:100%; height:100%; object-fit:contain;';
                canvas.parentNode.replaceChild(img, canvas);
            } catch (e) { console.warn('canvas capture error:', e); }
        }
        batchHtml += `<div style="page-break-after: always; padding: 20px; height: 100vh;">${tempRender.innerHTML}</div>`;
    }

    document.body.removeChild(tempRender);
    container.innerHTML = batchHtml; container.style.display = 'block';
    const style = document.createElement('style'); style.id = 'batch-print-style';
    style.innerHTML = `@media print { body > *:not(#batch-print-container) { display: none !important; } #batch-print-container { display: block !important; } .report-card-container { box-shadow: none !important; border: 2px solid #333 !important; } -webkit-print-color-adjust: exact; print-color-adjust: exact; }`;
    document.head.appendChild(style);
    setTimeout(() => { window.print(); setTimeout(() => { container.style.display = 'none'; container.innerHTML = ''; document.head.removeChild(style); }, 2000); }, 500);
}
// 辅助：将 Blob/File 转为 Base64 并自动存入缓存
async function loadHistoricalArchives(input) {
    const files = input.files;
    if (!files.length) return;

    let loadedCount = 0;

    // 遍历所有上传的文件
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const examName = file.name.replace('.xlsx', '').replace('.xls', ''); // 用文件名作为考试名

        await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const wb = XLSX.read(data, { type: 'array' });
                const sheet = wb.Sheets[wb.SheetNames[0]];
                const json = XLSX.utils.sheet_to_json(sheet); // 读取为对象数组

                // 自动识别列名
                if (json.length > 0) {
                    const sample = json[0];
                    // 寻找关键列：姓名、学校、总分/排名
                    const keyName = Object.keys(sample).find(k => k.includes('姓名') || k.toLowerCase() === 'name');
                    const keySchool = Object.keys(sample).find(k => k.includes('学校') || k.toLowerCase() === 'school');
                    // 优先找排名列，如果没有则找总分列后续自动算排名(简化起见这里假设有总分)
                    const keyRank = Object.keys(sample).find(k => k.includes('排名') || k.includes('名次') || k.includes('Rank'));
                    const keyScore = Object.keys(sample).find(k => k.includes('总分') || k.includes('Total') || k === '得分');

                    if (keyName && (keyRank || keyScore)) {
                        // 如果只有分数没有排名，先进行一次简单的排序计算
                        if (!keyRank && keyScore) {
                            json.sort((a, b) => (b[keyScore] || 0) - (a[keyScore] || 0));
                            json.forEach((row, idx) => row._tempRank = idx + 1);
                        }

                        json.forEach(row => {
                            const name = row[keyName];
                            const school = keySchool ? row[keySchool] : '默认学校'; // 如果没有学校列，视为单校
                            const rank = keyRank ? parseInt(row[keyRank]) : row._tempRank;

                            // 尝试在行数据中找“班级”
                            let className = "";
                            const keyClass = Object.keys(row).find(k => k.includes('班') || k.toLowerCase().includes('class'));
                            if (keyClass) className = normalizeClass(row[keyClass]);

                            if (name && rank) {
                                // 唯一标识加入班级：学校_班级_姓名 (例如: 实验中学_701_张三)
                                // 这样 701的张三 和 702的张三 就会拥有两份不同的档案
                                const uid = school + "_" + className + "_" + name;
                                if (!HISTORY_ARCHIVE[uid]) HISTORY_ARCHIVE[uid] = [];

                                // 避免重复添加同一场考试
                                if (!HISTORY_ARCHIVE[uid].find(x => x.exam === examName)) {
                                    HISTORY_ARCHIVE[uid].push({ exam: examName, rank: rank });
                                }
                            }
                        });
                        loadedCount++;
                    }
                }
                resolve();
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // 计算稳定性并标记过山车学生
    analyzeStability();

    document.getElementById('history-status').innerText = `✅ 已建立 ${Object.keys(HISTORY_ARCHIVE).length} 份学生档案，包含 ${loadedCount} 次历史考试。`;
    input.value = ''; // 清空以允许重复上传
}

function analyzeStability() {
    ROLLER_COASTER_STUDENTS = [];
    Object.keys(HISTORY_ARCHIVE).forEach(uid => {
        const records = HISTORY_ARCHIVE[uid];
        if (records.length < 3) return; // 至少3次考试才算波动

        const ranks = records.map(r => r.rank);
        const n = ranks.length;
        const mean = ranks.reduce((a, b) => a + b, 0) / n;
        // 计算标准差 (Standard Deviation)
        const variance = ranks.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
        const sd = Math.sqrt(variance);

        // 阈值设定：如果标准差超过 50 (意味着平均每次排名波动幅度很大)，标记为过山车
        // *也可以根据全镇人数动态调整，这里先设固定值或全校人数的10%
        if (sd > 50) {
            ROLLER_COASTER_STUDENTS.push(uid);
        }
    });
    console.log("检测到波动剧烈学生数:", ROLLER_COASTER_STUDENTS.length);
}
// 1. 保存配置

    Object.assign(window, {
        printSingleReport,
        downloadSingleReportPDF,
        batchGeneratePDF
    });

    window.__REPORT_EXPORT_RUNTIME_PATCHED__ = true;
})();
