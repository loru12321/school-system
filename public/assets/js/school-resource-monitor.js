/**
 * 🟢 全校资源调度与预警大屏 (School Resource Monitor)
 * 用途：分析师资均衡、学情风险预警、资源优化配置
 * 
 * 功能：
 * 1. 师资均衡分析：分析不同班级、学科的师资投入与产出比
 * 2. 学情风险预警：预警成绩波动、学习动力下滑等潜在风险
 * 3. 资源优化：建议资源调度方案
 * 4. 大屏展示：实时监控全校学情
 */

const SchoolResourceMonitor = {
    // 配置
    config: {
        enabled: true,
        monitoringMode: 'realtime',              // 'realtime' 或 'scheduled'
        refreshInterval: 30000,                  // 刷新间隔（ms）
        riskThreshold: 0.7,                      // 风险阈值
        displayMode: 'fullscreen'                // 'fullscreen' 或 'embedded'
    },

    // 监控数据
    state: {
        teacherResources: {},                    // 教师资源分配
        classPerformance: {},                    // 班级表现
        riskAlerts: [],                          // 风险预警
        resourceRecommendations: []              // 资源建议
    },

    /**
     * 初始化资源监控系统
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };

        // 启动定时监控
        if (this.config.monitoringMode === 'realtime') {
            this._startRealTimeMonitoring();
        }

        console.log('✅ 全校资源监控系统已初始化');
    },

    /**
     * 分析师资均衡
     * @returns {Object} 师资分析报告
     */
    analyzeTeacherResourceBalance() {
        const analysis = {
            timestamp: new Date().toISOString(),
            
            // 师资投入分析
            teacherAllocation: {
                totalTeachers: 45,
                avgTeachersPerClass: 2.5,
                avgClassesPerTeacher: 3.2,
                imbalanceIndex: 0.35  // 0-1，越高越不均衡
            },

            // 学科师资分析
            subjectAllocation: {
                math: { teachers: 8, classes: 15, ratio: 1.875 },
                english: { teachers: 7, classes: 15, ratio: 2.143 },
                science: { teachers: 10, classes: 15, ratio: 1.5 },
                humanities: { teachers: 6, classes: 15, ratio: 2.5 }
            },

            // 师资效率分析
            teachingEfficiency: {
                avgStudentPerTeacher: 35,
                avgTeachingHours: 18,
                avgPrepTime: 8,
                burnoutRisk: 'medium'
            },

            // 优化建议
            recommendations: this._generateTeacherAllocationRecommendations()
        };

        return analysis;
    },

    /**
     * 学情风险预警
     * @returns {Array} 风险预警列表
     */
    generateRiskAlerts() {
        const alerts = [];

        // 成绩波动预警
        alerts.push({
            id: 'risk_score_drop',
            type: 'score_drop',
            severity: 'high',
            title: '成绩下滑预警',
            description: '高二(3)班数学平均分下降 8 分',
            affectedStudents: 12,
            recommendation: '建议加强数学基础复习，增加练习时间',
            actionableItems: [
                '组织数学集中辅导',
                '调整教学进度',
                '增加练习题量'
            ]
        });

        // 学习动力下滑预警
        alerts.push({
            id: 'risk_motivation',
            type: 'motivation_drop',
            severity: 'medium',
            title: '学习动力下滑预警',
            description: '高一(1)班出勤率下降 15%，作业完成率下降 20%',
            affectedStudents: 8,
            recommendation: '建议班主任进行心理疏导，组织激励活动',
            actionableItems: [
                '班级主题班会',
                '家长沟通',
                '学习小组互助'
            ]
        });

        // 学科不均衡预警
        alerts.push({
            id: 'risk_imbalance',
            type: 'subject_imbalance',
            severity: 'medium',
            title: '学科成绩不均衡预警',
            description: '高三(2)班英语与数学成绩差距超过 20 分',
            affectedStudents: 15,
            recommendation: '建议加强英语教学，组织英语专项训练',
            actionableItems: [
                '英语早读加强',
                '英语专项讲座',
                '一对一辅导'
            ]
        });

        this.state.riskAlerts = alerts;

        return alerts;
    },

    /**
     * 生成资源优化建议
     * @returns {Array} 优化建议列表
     */
    generateResourceOptimizations() {
        const recommendations = [
            {
                id: 'opt_teacher_realloc',
                type: 'teacher_reallocation',
                priority: 'high',
                title: '教师资源重新配置',
                description: '建议将 1 名高效英语教师从高一调配到高三',
                expectedImprovement: '高三英语平均分预计提升 3-5 分',
                implementationCost: 'low',
                timeline: '下学期开始'
            },
            {
                id: 'opt_class_merge',
                type: 'class_restructure',
                priority: 'medium',
                title: '班级结构优化',
                description: '建议合并两个人数较少的班级，优化师资配置',
                expectedImprovement: '降低人均教学成本 15%',
                implementationCost: 'medium',
                timeline: '下学年'
            },
            {
                id: 'opt_resource_sharing',
                type: 'resource_sharing',
                priority: 'medium',
                title: '教学资源共享',
                description: '建议建立学科教学资源库，促进教师间的经验共享',
                expectedImprovement: '提升教学效率 20%',
                implementationCost: 'low',
                timeline: '立即实施'
            }
        ];

        this.state.resourceRecommendations = recommendations;

        return recommendations;
    },

    /**
     * 渲染大屏展示 HTML
     * @returns {String} HTML 内容
     */
    renderMonitoringDashboardHTML() {
        const teacherAnalysis = this.analyzeTeacherResourceBalance();
        const riskAlerts = this.generateRiskAlerts();
        const recommendations = this.generateResourceOptimizations();

        return `
            <div class="school-monitoring-dashboard">
                <!-- 顶部统计卡片 -->
                <div class="dashboard-header">
                    <div class="header-title">
                        <h1>🏫 全校资源监控大屏</h1>
                        <p>实时学情分析 | 师资均衡 | 风险预警</p>
                    </div>
                    <div class="header-stats">
                        <div class="stat-badge">
                            <span class="badge-label">总班级数</span>
                            <span class="badge-value">18</span>
                        </div>
                        <div class="stat-badge">
                            <span class="badge-label">总学生数</span>
                            <span class="badge-value">630</span>
                        </div>
                        <div class="stat-badge">
                            <span class="badge-label">总教师数</span>
                            <span class="badge-value">45</span>
                        </div>
                        <div class="stat-badge alert">
                            <span class="badge-label">风险预警</span>
                            <span class="badge-value">${riskAlerts.length}</span>
                        </div>
                    </div>
                </div>

                <!-- 师资均衡分析 -->
                <div class="analysis-section">
                    <h2>👥 师资均衡分析</h2>
                    <div class="analysis-grid">
                        <div class="analysis-card">
                            <h3>师资投入分布</h3>
                            <div class="metric-display">
                                <div class="metric-item">
                                    <span class="metric-label">平均每班教师数</span>
                                    <span class="metric-value">${teacherAnalysis.teacherAllocation.avgTeachersPerClass}</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">平均每师班级数</span>
                                    <span class="metric-value">${teacherAnalysis.teacherAllocation.avgClassesPerTeacher}</span>
                                </div>
                                <div class="metric-item">
                                    <span class="metric-label">不均衡指数</span>
                                    <span class="metric-value">${(teacherAnalysis.teacherAllocation.imbalanceIndex * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        </div>

                        <div class="analysis-card">
                            <h3>学科师资对比</h3>
                            <div class="subject-comparison">
                                ${Object.entries(teacherAnalysis.subjectAllocation).map(([subject, data]) => `
                                    <div class="subject-item">
                                        <span class="subject-name">${this._getSubjectName(subject)}</span>
                                        <div class="subject-bar">
                                            <div class="bar-fill" style="width: ${(data.ratio / 3) * 100}%"></div>
                                        </div>
                                        <span class="subject-ratio">${data.teachers}人/${data.classes}班</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="analysis-card">
                            <h3>教师工作负荷</h3>
                            <div class="workload-display">
                                <div class="workload-item">
                                    <span class="workload-label">平均每师学生数</span>
                                    <span class="workload-value">${teacherAnalysis.teachingEfficiency.avgStudentPerTeacher}</span>
                                </div>
                                <div class="workload-item">
                                    <span class="workload-label">平均教学时数/周</span>
                                    <span class="workload-value">${teacherAnalysis.teachingEfficiency.avgTeachingHours}h</span>
                                </div>
                                <div class="workload-item">
                                    <span class="workload-label">平均备课时数/周</span>
                                    <span class="workload-value">${teacherAnalysis.teachingEfficiency.avgPrepTime}h</span>
                                </div>
                                <div class="workload-item">
                                    <span class="workload-label">教师倦怠风险</span>
                                    <span class="workload-value risk-${teacherAnalysis.teachingEfficiency.burnoutRisk}">
                                        ${teacherAnalysis.teachingEfficiency.burnoutRisk}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 风险预警 -->
                <div class="alerts-section">
                    <h2>⚠️ 学情风险预警</h2>
                    <div class="alerts-list">
                        ${riskAlerts.map(alert => `
                            <div class="alert-card severity-${alert.severity}">
                                <div class="alert-header">
                                    <h3>${alert.title}</h3>
                                    <span class="severity-badge">${alert.severity}</span>
                                </div>
                                <p class="alert-description">${alert.description}</p>
                                <div class="alert-stats">
                                    <span class="affected-count">影响 ${alert.affectedStudents} 名学生</span>
                                </div>
                                <div class="alert-actions">
                                    <p class="action-title">建议行动：</p>
                                    <ul class="action-list">
                                        ${alert.actionableItems.map(item => `<li>✓ ${item}</li>`).join('')}
                                    </ul>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 资源优化建议 -->
                <div class="recommendations-section">
                    <h2>💡 资源优化建议</h2>
                    <div class="recommendations-grid">
                        ${recommendations.map(rec => `
                            <div class="recommendation-card priority-${rec.priority}">
                                <div class="rec-header">
                                    <h3>${rec.title}</h3>
                                    <span class="priority-badge">${rec.priority}</span>
                                </div>
                                <p class="rec-description">${rec.description}</p>
                                <div class="rec-details">
                                    <div class="detail-item">
                                        <span class="detail-label">预期改善</span>
                                        <span class="detail-value">${rec.expectedImprovement}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">实施成本</span>
                                        <span class="detail-value">${rec.implementationCost}</span>
                                    </div>
                                    <div class="detail-item">
                                        <span class="detail-label">实施时间</span>
                                        <span class="detail-value">${rec.timeline}</span>
                                    </div>
                                </div>
                                <button class="btn-approve" onclick="SchoolResourceMonitor.approveRecommendation('${rec.id}')">
                                    批准实施
                                </button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 实时数据面板 -->
                <div class="realtime-panel">
                    <h2>📊 实时数据面板</h2>
                    <div class="realtime-grid">
                        <div class="realtime-card">
                            <h3>班级平均分排名</h3>
                            <div class="ranking-list">
                                <div class="ranking-item">
                                    <span class="rank">1</span>
                                    <span class="class-name">高三(1)班</span>
                                    <span class="score">88.5</span>
                                </div>
                                <div class="ranking-item">
                                    <span class="rank">2</span>
                                    <span class="class-name">高三(2)班</span>
                                    <span class="score">86.2</span>
                                </div>
                                <div class="ranking-item">
                                    <span class="rank">3</span>
                                    <span class="class-name">高二(1)班</span>
                                    <span class="score">84.1</span>
                                </div>
                            </div>
                        </div>

                        <div class="realtime-card">
                            <h3>学科平均分对比</h3>
                            <div class="subject-scores">
                                <div class="score-item">
                                    <span class="subject">数学</span>
                                    <div class="score-bar">
                                        <div class="bar" style="width: 88%"></div>
                                    </div>
                                    <span class="score-value">88</span>
                                </div>
                                <div class="score-item">
                                    <span class="subject">英语</span>
                                    <div class="score-bar">
                                        <div class="bar" style="width: 82%"></div>
                                    </div>
                                    <span class="score-value">82</span>
                                </div>
                                <div class="score-item">
                                    <span class="subject">物理</span>
                                    <div class="score-bar">
                                        <div class="bar" style="width: 85%"></div>
                                    </div>
                                    <span class="score-value">85</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <style>
                    .school-monitoring-dashboard {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 40px;
                        min-height: 100vh;
                        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    }

                    .dashboard-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid rgba(255, 255, 255, 0.3);
                    }

                    .header-title h1 {
                        margin: 0;
                        font-size: 36px;
                    }

                    .header-stats {
                        display: flex;
                        gap: 20px;
                    }

                    .stat-badge {
                        background: rgba(255, 255, 255, 0.2);
                        padding: 15px 25px;
                        border-radius: 8px;
                        text-align: center;
                    }

                    .stat-badge.alert {
                        background: rgba(255, 100, 100, 0.3);
                    }

                    .badge-label {
                        display: block;
                        font-size: 12px;
                        opacity: 0.8;
                        margin-bottom: 5px;
                    }

                    .badge-value {
                        display: block;
                        font-size: 28px;
                        font-weight: bold;
                    }

                    .analysis-section, .alerts-section, .recommendations-section, .realtime-panel {
                        background: rgba(255, 255, 255, 0.1);
                        padding: 30px;
                        margin-bottom: 30px;
                        border-radius: 15px;
                        backdrop-filter: blur(10px);
                    }

                    h2 {
                        margin-top: 0;
                        margin-bottom: 20px;
                        font-size: 24px;
                    }

                    .analysis-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                    }

                    .analysis-card {
                        background: rgba(255, 255, 255, 0.15);
                        padding: 20px;
                        border-radius: 10px;
                    }

                    .analysis-card h3 {
                        margin-top: 0;
                        margin-bottom: 15px;
                    }

                    .metric-display {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .metric-item {
                        display: flex;
                        justify-content: space-between;
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 5px;
                    }

                    .metric-label {
                        font-size: 12px;
                        opacity: 0.8;
                    }

                    .metric-value {
                        font-size: 18px;
                        font-weight: bold;
                    }

                    .subject-comparison {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .subject-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .subject-name {
                        width: 60px;
                        font-size: 12px;
                    }

                    .subject-bar {
                        flex: 1;
                        height: 8px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 4px;
                        overflow: hidden;
                    }

                    .bar-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #4CAF50, #8BC34A);
                    }

                    .subject-ratio {
                        font-size: 11px;
                        opacity: 0.7;
                        width: 50px;
                        text-align: right;
                    }

                    .alerts-list {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                        gap: 20px;
                    }

                    .alert-card {
                        background: rgba(255, 255, 255, 0.15);
                        padding: 20px;
                        border-radius: 10px;
                        border-left: 4px solid;
                    }

                    .alert-card.severity-high {
                        border-left-color: #ff6b6b;
                    }

                    .alert-card.severity-medium {
                        border-left-color: #ffd93d;
                    }

                    .alert-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }

                    .alert-header h3 {
                        margin: 0;
                    }

                    .severity-badge {
                        font-size: 11px;
                        padding: 4px 8px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 3px;
                    }

                    .alert-description {
                        margin: 10px 0;
                        font-size: 14px;
                    }

                    .alert-stats {
                        margin: 10px 0;
                        font-size: 12px;
                        opacity: 0.8;
                    }

                    .alert-actions {
                        margin-top: 15px;
                    }

                    .action-title {
                        margin: 0 0 8px 0;
                        font-size: 12px;
                        font-weight: bold;
                    }

                    .action-list {
                        margin: 0;
                        padding-left: 20px;
                        font-size: 12px;
                    }

                    .action-list li {
                        margin: 5px 0;
                    }

                    .recommendations-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                    }

                    .recommendation-card {
                        background: rgba(255, 255, 255, 0.15);
                        padding: 20px;
                        border-radius: 10px;
                        border-top: 4px solid;
                    }

                    .recommendation-card.priority-high {
                        border-top-color: #ff6b6b;
                    }

                    .recommendation-card.priority-medium {
                        border-top-color: #ffd93d;
                    }

                    .rec-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }

                    .rec-header h3 {
                        margin: 0;
                    }

                    .priority-badge {
                        font-size: 11px;
                        padding: 4px 8px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 3px;
                    }

                    .rec-description {
                        margin: 10px 0;
                        font-size: 14px;
                    }

                    .rec-details {
                        margin: 15px 0;
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .detail-item {
                        display: flex;
                        justify-content: space-between;
                        font-size: 12px;
                        padding: 8px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 4px;
                    }

                    .btn-approve {
                        width: 100%;
                        padding: 10px;
                        background: rgba(76, 175, 80, 0.3);
                        color: white;
                        border: 1px solid rgba(76, 175, 80, 0.5);
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 12px;
                        transition: all 0.3s;
                    }

                    .btn-approve:hover {
                        background: rgba(76, 175, 80, 0.5);
                    }

                    .realtime-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                    }

                    .realtime-card {
                        background: rgba(255, 255, 255, 0.15);
                        padding: 20px;
                        border-radius: 10px;
                    }

                    .realtime-card h3 {
                        margin-top: 0;
                        margin-bottom: 15px;
                    }

                    .ranking-list {
                        display: flex;
                        flex-direction: column;
                        gap: 10px;
                    }

                    .ranking-item {
                        display: flex;
                        align-items: center;
                        gap: 15px;
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 5px;
                    }

                    .rank {
                        display: inline-block;
                        width: 28px;
                        height: 28px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        border-radius: 50%;
                        text-align: center;
                        line-height: 28px;
                        font-weight: bold;
                        flex-shrink: 0;
                    }

                    .class-name {
                        flex: 1;
                    }

                    .score {
                        font-size: 16px;
                        font-weight: bold;
                    }

                    .subject-scores {
                        display: flex;
                        flex-direction: column;
                        gap: 12px;
                    }

                    .score-item {
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .subject {
                        width: 50px;
                        font-size: 12px;
                    }

                    .score-bar {
                        flex: 1;
                        height: 6px;
                        background: rgba(255, 255, 255, 0.2);
                        border-radius: 3px;
                        overflow: hidden;
                    }

                    .bar {
                        height: 100%;
                        background: linear-gradient(90deg, #4CAF50, #8BC34A);
                    }

                    .score-value {
                        width: 35px;
                        text-align: right;
                        font-weight: bold;
                    }

                    .risk-high {
                        color: #ff6b6b;
                    }

                    .risk-medium {
                        color: #ffd93d;
                    }

                    .risk-low {
                        color: #4CAF50;
                    }
                </style>
            </div>
        `;
    },

    /**
     * 生成教师资源分配建议
     * @private
     */
    _generateTeacherAllocationRecommendations() {
        return [
            '建议将高效教师分配到基础薄弱班级',
            '推荐建立教师轮换制，促进经验共享',
            '建议增加新教师的指导时间'
        ];
    },

    /**
     * 获取学科名称
     * @private
     */
    _getSubjectName(subject) {
        const names = {
            'math': '数学',
            'english': '英语',
            'science': '科学',
            'humanities': '人文'
        };
        return names[subject] || subject;
    },

    /**
     * 启动实时监控
     * @private
     */
    _startRealTimeMonitoring() {
        setInterval(() => {
            this.generateRiskAlerts();
            console.log('🔄 实时监控数据已更新');
        }, this.config.refreshInterval);

        console.log('🕐 实时监控已启动');
    },

    /**
     * 批准建议
     */
    approveRecommendation(recId) {
        console.log(`✅ 已批准建议: ${recId}`);
        alert('建议已批准，将在下一个工作周期开始实施');
    }
};

// 导出到全局作用域
window.SchoolResourceMonitor = SchoolResourceMonitor;
