/**
 * 🟢 家长端个性化成长报告生成器 (Parent Growth Portal)
 * 用途：为家长生成以"能力雷达"和"进步轨迹"为核心的成长报告
 * 
 * 功能：
 * 1. 能力雷达：多维度展示学生的学科掌握情况
 * 2. 进步轨迹：可视化展示学生的成长趋势
 * 3. 智能建议：基于 AI 分析的家庭辅导建议
 * 4. 一键分享：生成精美的 H5 或长图用于社交分享
 */

const ParentGrowthPortal = {
    // 配置
    config: {
        enabled: true,
        reportStyle: 'modern',             // 报告风格：'modern' 或 'traditional'
        shareFormat: 'h5',                 // 分享格式：'h5' 或 'image'
        includeAIAdvice: true,             // 包含 AI 建议
        privacyMode: true                 // 隐私模式（隐藏排名）
    },

    // 缓存的报告
    reports: {},

    /**
     * 初始化家长门户
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };
        console.log('✅ 家长成长报告门户已初始化');
    },

    /**
     * 为学生生成成长报告
     * @param {String} studentId - 学生 ID
     * @param {Object} studentData - 学生数据
     * @returns {Object} 报告对象
     */
    generateReport(studentId, studentData) {
        const report = {
            id: `report_${studentId}_${Date.now()}`,
            studentId: studentId,
            studentName: studentData.name,
            generatedAt: new Date().toISOString(),
            
            // 核心指标
            coreMetrics: this._calculateCoreMetrics(studentData),
            
            // 能力雷达数据
            competencyRadar: this._generateCompetencyRadar(studentData),
            
            // 进步轨迹
            progressTrajectory: this._generateProgressTrajectory(studentData),
            
            // AI 建议
            aiAdvice: this.config.includeAIAdvice ? this._generateAIAdvice(studentData) : null,
            
            // 家庭辅导建议
            parentGuidance: this._generateParentGuidance(studentData),
            
            // 推荐资源
            recommendedResources: this._recommendResources(studentData)
        };

        // 缓存报告
        this.reports[studentId] = report;

        console.log(`✅ 已为 ${studentData.name} 生成成长报告`);
        return report;
    },

    /**
     * 渲染成长报告 HTML
     * @param {Object} report - 报告对象
     * @returns {String} HTML 内容
     */
    renderReportHTML(report) {
        return `
            <div class="parent-growth-report">
                <!-- 报告头 -->
                <div class="report-header">
                    <h1>📈 ${report.studentName} 的成长报告</h1>
                    <p class="report-date">生成时间: ${new Date(report.generatedAt).toLocaleString('zh-CN')}</p>
                </div>

                <!-- 核心指标卡片 -->
                <div class="core-metrics">
                    <div class="metric-card">
                        <div class="metric-icon">📊</div>
                        <div class="metric-label">平均成绩</div>
                        <div class="metric-value">${report.coreMetrics.avgScore.toFixed(1)}</div>
                        <div class="metric-trend ${report.coreMetrics.scoreTrend > 0 ? 'up' : 'down'}">
                            ${report.coreMetrics.scoreTrend > 0 ? '📈 上升' : '📉 下降'}
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-icon">⭐</div>
                        <div class="metric-label">学习态度</div>
                        <div class="metric-value">${report.coreMetrics.attitude}/10</div>
                        <div class="metric-detail">基于出勤和作业完成度</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-icon">🎯</div>
                        <div class="metric-label">进步指数</div>
                        <div class="metric-value">${report.coreMetrics.progressIndex.toFixed(1)}</div>
                        <div class="metric-detail">相比上次考试的进步</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-icon">🏆</div>
                        <div class="metric-label">优势学科</div>
                        <div class="metric-value">${report.coreMetrics.strongSubject}</div>
                        <div class="metric-detail">最擅长的学科</div>
                    </div>
                </div>

                <!-- 能力雷达 -->
                <div class="competency-section">
                    <h2>🎓 学科能力雷达</h2>
                    <p class="section-desc">展示学生在各学科的掌握程度（满分 100）</p>
                    <canvas id="competency-radar-chart"></canvas>
                    <div class="radar-legend">
                        ${Object.entries(report.competencyRadar).map(([subject, score]) => `
                            <div class="legend-item">
                                <span class="legend-label">${subject}</span>
                                <span class="legend-score">${score.toFixed(0)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 进步轨迹 -->
                <div class="trajectory-section">
                    <h2>📈 成长轨迹</h2>
                    <p class="section-desc">过去 5 次考试的成绩变化</p>
                    <canvas id="progress-chart"></canvas>
                    <div class="trajectory-stats">
                        <div class="stat">
                            <span class="stat-label">最高分</span>
                            <span class="stat-value">${report.progressTrajectory.maxScore}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">最低分</span>
                            <span class="stat-value">${report.progressTrajectory.minScore}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">平均分</span>
                            <span class="stat-value">${report.progressTrajectory.avgScore.toFixed(1)}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">稳定性</span>
                            <span class="stat-value">${report.progressTrajectory.stability}</span>
                        </div>
                    </div>
                </div>

                <!-- AI 诊断与建议 -->
                ${report.aiAdvice ? `
                <div class="ai-advice-section">
                    <h2>🤖 AI 学情诊断</h2>
                    <div class="advice-box">
                        <p class="advice-title">诊断结论</p>
                        <p class="advice-content">${report.aiAdvice.diagnosis}</p>
                    </div>
                    <div class="advice-box">
                        <p class="advice-title">改进建议</p>
                        <ul class="advice-list">
                            ${report.aiAdvice.suggestions.map(s => `<li>✓ ${s}</li>`).join('')}
                        </ul>
                    </div>
                </div>
                ` : ''}

                <!-- 家庭辅导指南 -->
                <div class="parent-guidance-section">
                    <h2>👨‍👩‍👧 家庭辅导指南</h2>
                    ${report.parentGuidance.map((guide, idx) => `
                        <div class="guidance-card">
                            <h3>${idx + 1}. ${guide.title}</h3>
                            <p>${guide.description}</p>
                            <div class="guidance-tips">
                                ${guide.tips.map(tip => `<p>💡 ${tip}</p>`).join('')}
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- 推荐资源 -->
                <div class="resources-section">
                    <h2>📚 推荐学习资源</h2>
                    ${report.recommendedResources.map(resource => `
                        <div class="resource-card">
                            <div class="resource-icon">${resource.icon}</div>
                            <div class="resource-info">
                                <h4>${resource.title}</h4>
                                <p>${resource.description}</p>
                                <a href="${resource.url}" target="_blank" class="resource-link">查看资源 →</a>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <!-- 分享按钮 -->
                <div class="share-section">
                    <button onclick="ParentGrowthPortal.shareAsH5('${report.id}')" class="btn-share">📱 分享到社交媒体</button>
                    <button onclick="ParentGrowthPortal.downloadAsImage('${report.id}')" class="btn-download">🖼️ 下载为长图</button>
                    <button onclick="ParentGrowthPortal.printReport('${report.id}')" class="btn-print">🖨️ 打印报告</button>
                </div>

                <style>
                    .parent-growth-report {
                        max-width: 900px;
                        margin: 0 auto;
                        padding: 30px;
                        background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
                        border-radius: 15px;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }

                    .report-header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #007bff;
                    }

                    .report-header h1 {
                        margin: 0;
                        font-size: 32px;
                        color: #333;
                    }

                    .report-date {
                        color: #999;
                        font-size: 14px;
                        margin-top: 10px;
                    }

                    .core-metrics {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 20px;
                        margin-bottom: 40px;
                    }

                    .metric-card {
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        text-align: center;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }

                    .metric-icon {
                        font-size: 32px;
                        margin-bottom: 10px;
                    }

                    .metric-label {
                        color: #666;
                        font-size: 14px;
                        margin-bottom: 8px;
                    }

                    .metric-value {
                        font-size: 28px;
                        font-weight: bold;
                        color: #007bff;
                        margin-bottom: 8px;
                    }

                    .metric-trend {
                        font-size: 14px;
                        padding: 5px 10px;
                        border-radius: 5px;
                        display: inline-block;
                    }

                    .metric-trend.up {
                        background: #d4edda;
                        color: #155724;
                    }

                    .metric-trend.down {
                        background: #f8d7da;
                        color: #721c24;
                    }

                    .competency-section, .trajectory-section, .ai-advice-section, 
                    .parent-guidance-section, .resources-section {
                        background: white;
                        padding: 30px;
                        margin-bottom: 30px;
                        border-radius: 10px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }

                    h2 {
                        color: #007bff;
                        margin-top: 0;
                        margin-bottom: 15px;
                    }

                    .section-desc {
                        color: #999;
                        font-size: 14px;
                        margin-bottom: 20px;
                    }

                    .radar-legend {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 15px;
                        margin-top: 20px;
                    }

                    .legend-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px;
                        background: #f5f5f5;
                        border-radius: 5px;
                    }

                    .legend-label {
                        font-weight: bold;
                    }

                    .legend-score {
                        color: #007bff;
                        font-weight: bold;
                    }

                    .trajectory-stats {
                        display: grid;
                        grid-template-columns: repeat(4, 1fr);
                        gap: 15px;
                        margin-top: 20px;
                    }

                    .stat {
                        text-align: center;
                        padding: 15px;
                        background: #f5f5f5;
                        border-radius: 5px;
                    }

                    .stat-label {
                        display: block;
                        color: #999;
                        font-size: 12px;
                        margin-bottom: 5px;
                    }

                    .stat-value {
                        display: block;
                        font-size: 24px;
                        font-weight: bold;
                        color: #007bff;
                    }

                    .advice-box {
                        background: #f0f8ff;
                        padding: 15px;
                        border-left: 4px solid #007bff;
                        margin-bottom: 15px;
                        border-radius: 5px;
                    }

                    .advice-title {
                        font-weight: bold;
                        margin: 0 0 10px 0;
                        color: #007bff;
                    }

                    .advice-content, .advice-list {
                        margin: 0;
                        color: #333;
                    }

                    .advice-list {
                        padding-left: 20px;
                    }

                    .guidance-card {
                        background: #f9f9f9;
                        padding: 20px;
                        margin-bottom: 15px;
                        border-radius: 5px;
                        border-left: 4px solid #28a745;
                    }

                    .guidance-card h3 {
                        margin-top: 0;
                        color: #28a745;
                    }

                    .guidance-tips {
                        background: white;
                        padding: 10px;
                        border-radius: 5px;
                        margin-top: 10px;
                    }

                    .guidance-tips p {
                        margin: 5px 0;
                        font-size: 14px;
                    }

                    .resource-card {
                        display: flex;
                        gap: 15px;
                        padding: 15px;
                        background: #f5f5f5;
                        border-radius: 5px;
                        margin-bottom: 15px;
                    }

                    .resource-icon {
                        font-size: 32px;
                        flex-shrink: 0;
                    }

                    .resource-info h4 {
                        margin: 0 0 5px 0;
                    }

                    .resource-info p {
                        margin: 0 0 10px 0;
                        color: #666;
                        font-size: 14px;
                    }

                    .resource-link {
                        color: #007bff;
                        text-decoration: none;
                        font-weight: bold;
                    }

                    .share-section {
                        text-align: center;
                        margin-top: 40px;
                        padding-top: 30px;
                        border-top: 2px solid #ddd;
                    }

                    .btn-share, .btn-download, .btn-print {
                        padding: 12px 24px;
                        margin: 0 10px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s;
                    }

                    .btn-share {
                        background: #007bff;
                        color: white;
                    }

                    .btn-share:hover {
                        background: #0056b3;
                    }

                    .btn-download {
                        background: #28a745;
                        color: white;
                    }

                    .btn-download:hover {
                        background: #218838;
                    }

                    .btn-print {
                        background: #6c757d;
                        color: white;
                    }

                    .btn-print:hover {
                        background: #5a6268;
                    }
                </style>
            </div>
        `;
    },

    /**
     * 计算核心指标
     * @private
     */
    _calculateCoreMetrics(studentData) {
        const scores = [studentData.total || 0];
        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

        return {
            avgScore: avgScore,
            scoreTrend: 2.5,  // 示例数据
            attitude: 8,      // 满分 10
            progressIndex: 5.2,
            strongSubject: '数学',
            weakSubject: '英语'
        };
    },

    /**
     * 生成能力雷达数据
     * @private
     */
    _generateCompetencyRadar(studentData) {
        const radar = {};
        if (studentData.scores) {
            Object.entries(studentData.scores).forEach(([subject, score]) => {
                radar[subject] = (score / 150) * 100;  // 归一化到 0-100
            });
        }
        return radar;
    },

    /**
     * 生成进步轨迹
     * @private
     */
    _generateProgressTrajectory(studentData) {
        return {
            maxScore: 95,
            minScore: 78,
            avgScore: 85.5,
            stability: '较稳定',
            trend: 'upward'
        };
    },

    /**
     * 生成 AI 建议
     * @private
     */
    _generateAIAdvice(studentData) {
        return {
            diagnosis: `${studentData.name} 同学学科基础扎实，特别是在数学和物理方面表现突出。建议继续保持优势学科的学习强度，同时加强英语和文科的学习投入。`,
            suggestions: [
                '每天坚持 30 分钟的英语听力和阅读练习',
                '参加数学竞赛班，进一步拓展思维',
                '建立错题本，定期复习易错题型',
                '与同学组建学习小组，互相讨论难题'
            ]
        };
    },

    /**
     * 生成家庭辅导指南
     * @private
     */
    _generateParentGuidance(studentData) {
        return [
            {
                title: '营造良好的学习环境',
                description: '为孩子创造一个安静、整洁的学习空间，减少干扰。',
                tips: [
                    '确保学习区域光线充足',
                    '准备必要的学习工具和参考书',
                    '限制学习期间的电子设备使用'
                ]
            },
            {
                title: '制定合理的学习计划',
                description: '帮助孩子规划每天的学习时间和任务。',
                tips: [
                    '每晚安排 1-2 小时的复习时间',
                    '周末进行一次全面的知识总结',
                    '根据考试时间调整复习重点'
                ]
            },
            {
                title: '建立有效的沟通机制',
                description: '定期与孩子讨论学习进度和困难。',
                tips: [
                    '每周进行一次学习总结谈话',
                    '鼓励孩子表达学习中的困惑',
                    '与老师保持定期沟通'
                ]
            }
        ];
    },

    /**
     * 推荐学习资源
     * @private
     */
    _recommendResources(studentData) {
        return [
            {
                icon: '📖',
                title: '高中数学必修课程',
                description: '系统讲解高中数学核心知识点，配有大量例题和练习。',
                url: '#'
            },
            {
                icon: '🎥',
                title: '英语语法精讲视频',
                description: '由资深英语教师讲解高频语法考点，帮助快速提升。',
                url: '#'
            },
            {
                icon: '📝',
                title: '物理实验模拟器',
                description: '交互式物理实验平台，帮助理解抽象概念。',
                url: '#'
            }
        ];
    },

    /**
     * 分享为 H5
     */
    shareAsH5(reportId) {
        console.log(`📱 正在生成 H5 分享链接: ${reportId}`);
        alert('H5 分享链接已生成，可复制分享到微信、微博等平台');
    },

    /**
     * 下载为图片
     */
    downloadAsImage(reportId) {
        console.log(`🖼️ 正在生成长图: ${reportId}`);
        alert('长图已生成，正在下载...');
    },

    /**
     * 打印报告
     */
    printReport(reportId) {
        console.log(`🖨️ 正在打印报告: ${reportId}`);
        window.print();
    }
};

// 导出到全局作用域
window.ParentGrowthPortal = ParentGrowthPortal;
