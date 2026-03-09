        window.doQuery = async function() {
            const name = document.getElementById('inp-name').value;
            const sch = document.getElementById('sel-school').value;
            const cls = document.getElementById('sel-class').value;
            if (typeof SCHOOLS === 'undefined' || !SCHOOLS[sch]) return alert("数据未就绪");
            let stu = SCHOOLS[sch].students.find(s => s.name === name && (cls === '--请先选择学校--' || s.class === cls));
            if (!stu) return alert("未找到该学生");
            
            // 🆕 自动对比流程：先同步云端历史
            if (window.CloudManager && window.CloudManager.check()) {
                if (window.UI) UI.toast("🔍 正在同步云端历史数据...", "info");
                try {
                    const historyRes = await window.CloudManager.fetchStudentExamHistory(stu);
                    if (historyRes.success && historyRes.data.length > 0) {
                        // ✅ 修复：按照 findPreviousRecord 期望的格式存入 PREV_DATA
                        window.PREV_DATA = historyRes.data.map(h => ({
                            name: stu.name,
                            class: stu.class,
                            school: stu.school || '',
                            total: Number(h.total) || 0,
                            classRank: h.rankClass || '-',
                            schoolRank: h.rankSchool || '-',
                            townRank: h.rankTown || '-',
                            scores: h.scores || {},
                            ranks: {
                                total: {
                                    class: h.rankClass || '-',
                                    school: h.rankSchool || '-',
                                    township: h.rankTown || '-'
                                }
                            },
                            _sourceExam: h.examId
                        }));
                        // 取排除当前考试的历史记录作为对比基准
                        const prevRecords = window.PREV_DATA.filter(h => h._sourceExam !== (window.CURRENT_EXAM_ID || ''));
                        if (prevRecords.length > 0) window.PREV_DATA = prevRecords;
                        if (window.UI) UI.toast(`✅ 已自动匹配 ${historyRes.data.length} 次历史成绩`, "success");
                    }
                } catch (e) {
                    console.warn("[doQuery] 云端历史获取失败:", e);
                }
            }

            if (typeof clearCloudStudentCompareContext === 'function') clearCloudStudentCompareContext();
            if (typeof setCloudCompareTarget === 'function') setCloudCompareTarget(stu);
            window.CURRENT_REPORT_STUDENT = stu;
            document.getElementById('single-report-result').classList.remove('hidden');
            const container = document.getElementById('report-card-capture-area');
            if (typeof renderSingleReportCardHTML === 'function') {
                container.innerHTML = renderSingleReportCardHTML(stu, 'A4');
            }
            
            setTimeout(() => { 
                if (typeof renderRadarChart === 'function') renderRadarChart(stu); 
                if (typeof renderVarianceChart === 'function') renderVarianceChart(stu); 
                
                // 在 lt.html 中额外渲染趋势图
                const history = typeof getStudentExamHistory === 'function' ? getStudentExamHistory(stu) : (window.PREV_DATA || []);
                renderHistoryCharts(history);
            }, 100);
            
            if (typeof analyzeStrengthsAndWeaknesses === 'function') analyzeStrengthsAndWeaknesses(stu);

            // 隐藏对比区域
            const compareSection = document.getElementById('student-multi-period-compare-section');
            if (compareSection) {
                compareSection.style.display = 'none';
            }

            // 自动滚动到成绩单区域
            setTimeout(() => {
                const reportElement = document.getElementById('single-report-result');
                if (reportElement) {
                    reportElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 200);
        };
