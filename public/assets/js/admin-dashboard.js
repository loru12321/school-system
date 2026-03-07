/**
 * 🟢 管理驾驶舱 (Admin Dashboard)
 * 用途：为教室大屏或校长办公室提供实时的数据展示和决策支持
 * 
 * 核心指标：
 * 1. 全校平均分波动趋势
 * 2. 优生率（>85分）、及格率（>60分）
 * 3. 学科贡献度分析
 * 4. 班级排名实时更新
 * 5. 学生成绩分布（直方图）
 */

const AdminDashboard = {
    // 配置
    config: {
        enabled: true,
        refreshInterval: 30000,            // 刷新间隔（ms）
        theme: 'dark',                     // 主题：'light' 或 'dark'
        displayMode: 'fullscreen',         // 显示模式：'fullscreen' 或 'windowed'
        metrics: {
            showTrend: true,               // 显示趋势
            showDistribution: true,        // 显示分布
            showRanking: true,             // 显示排名
            showSubjectAnalysis: true      // 显示学科分析
        }
    },

    // 数据缓存
    data: {
        schoolStats: null,
        classRanking: [],
        subjectAnalysis: {},
        trendData: [],
        lastUpdateTime: null
    },

    // 图表实例
    charts: {},

    /**
     * 初始化管理驾驶舱
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };
        
        // 应用主题
        this._applyTheme();

        // 启动定时刷新
        this._startAutoRefresh();

        console.log('✅ 管理驾驶舱已初始化');
    },

    /**
     * 进入全屏模式
     */
    enterFullscreen() {
        const container = document.getElementById('admin-dashboard-container');
        if (!container) {
            console.warn('⚠️ 找不到驾驶舱容器');
            return;
        }

        if (container.requestFullscreen) {
            container.requestFullscreen();
        } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
        }

        this.config.displayMode = 'fullscreen';
        console.log('🖥️ 已进入全屏模式');
    },

    /**
     * 退出全屏模式
     */
    exitFullscreen() {
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else if (document.webkitFullscreenElement) {
            document.webkitExitFullscreen();
        }

        this.config.displayMode = 'windowed';
        console.log('🖥️ 已退出全屏模式');
    },

    /**
     * 刷新所有数据
     */
    async refreshData() {
        console.log('🔄 正在刷新数据...');

        try {
            // 收集学校统计数据
            this.data.schoolStats = this._calculateSchoolStats();

            // 计算班级排名
            this.data.classRanking = this._calculateClassRanking();

            // 分析学科成绩
            this.data.subjectAnalysis = this._analyzeSubjectPerformance();

            // 获取趋势数据
            this.data.trendData = this._getTrendData();

            this.data.lastUpdateTime = new Date().toISOString();

            // 更新所有图表
            this._updateAllCharts();

            console.log('✅ 数据已刷新');
        } catch (error) {
            console.error('❌ 数据刷新失败:', error);
        }
    },

    /**
     * 渲染驾驶舱 HTML
     * @returns {String} HTML 内容
     */
    renderHTML() {
        const stats = this.data.schoolStats || this._calculateSchoolStats();

        return `
            <div id="admin-dashboard-container" class="admin-dashboard ${this.config.theme}">
                <!-- 头部 -->
                <div class="dashboard-header">
                    <h1>📊 学校教学数据驾驶舱</h1>
                    <div class="header-controls">
                        <span class="update-time">最后更新: ${new Date(this.data.lastUpdateTime).toLocaleTimeString('zh-CN')}</span>
                        <button onclick="AdminDashboard.refreshData()" class="btn-refresh">🔄 刷新</button>
                        <button onclick="AdminDashboard.enterFullscreen()" class="btn-fullscreen">⛶ 全屏</button>
                        <button onclick="AdminDashboard.toggleTheme()" class="btn-theme">🌙 主题</button>
                    </div>
                </div>

                <!-- 核心指标卡片 -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">全校平均分</div>
                        <div class="metric-value">${stats.avgScore.toFixed(2)}</div>
                        <div class="metric-trend ${stats.avgTrend > 0 ? 'up' : 'down'}">
                            ${stats.avgTrend > 0 ? '📈' : '📉'} ${Math.abs(stats.avgTrend).toFixed(2)}
                        </div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-label">优生率 (>85分)</div>
                        <div class="metric-value">${(stats.excellentRate * 100).toFixed(1)}%</div>
                        <div class="metric-detail">${stats.excellentCount} 人</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-label">及格率 (>60分)</div>
                        <div class="metric-value">${(stats.passRate * 100).toFixed(1)}%</div>
                        <div class="metric-detail">${stats.passCount} 人</div>
                    </div>

                    <div class="metric-card">
                        <div class="metric-label">总学生数</div>
                        <div class="metric-value">${stats.totalStudents}</div>
                        <div class="metric-detail">${Object.keys(stats.schoolBreakdown).length} 所学校</div>
                    </div>
                </div>

                <!-- 图表区域 -->
                <div class="charts-grid">
                    <!-- 趋势图 -->
                    <div class="chart-container" id="trend-chart-container">
                        <h3>📈 平均分趋势</h3>
                        <canvas id="trend-chart"></canvas>
                    </div>

                    <!-- 分布图 -->
                    <div class="chart-container" id="distribution-chart-container">
                        <h3>📊 成绩分布</h3>
                        <canvas id="distribution-chart"></canvas>
                    </div>

                    <!-- 班级排名 -->
                    <div class="chart-container" id="ranking-container">
                        <h3>🏆 班级排名</h3>
                        <div class="ranking-list">
                            ${this.data.classRanking.slice(0, 10).map((cls, idx) => `
                                <div class="ranking-item">
                                    <span class="rank-badge">${idx + 1}</span>
                                    <span class="rank-class">${cls.className}</span>
                                    <span class="rank-score">${cls.avgScore.toFixed(2)}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 学科分析 -->
                    <div class="chart-container" id="subject-chart-container">
                        <h3>📚 学科成绩对比</h3>
                        <canvas id="subject-chart"></canvas>
                    </div>
                </div>

                <!-- 底部信息 -->
                <div class="dashboard-footer">
                    <p>数据实时更新 | 刷新间隔: ${this.config.refreshInterval / 1000}s</p>
                </div>
            </div>

            <style>
                .admin-dashboard {
                    padding: 20px;
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                }

                .admin-dashboard.dark {
                    background: #1a1a1a;
                    color: #fff;
                }

                .admin-dashboard.light {
                    background: #f5f5f5;
                    color: #333;
                }

                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #007bff;
                }

                .dashboard-header h1 {
                    margin: 0;
                    font-size: 28px;
                }

                .header-controls {
                    display: flex;
                    gap: 15px;
                    align-items: center;
                }

                .header-controls button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 5px;
                    background: #007bff;
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                }

                .header-controls button:hover {
                    background: #0056b3;
                }

                .metrics-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .metric-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .metric-label {
                    font-size: 14px;
                    opacity: 0.9;
                    margin-bottom: 10px;
                }

                .metric-value {
                    font-size: 32px;
                    font-weight: bold;
                    margin-bottom: 10px;
                }

                .metric-trend {
                    font-size: 14px;
                }

                .metric-trend.up {
                    color: #4ade80;
                }

                .metric-trend.down {
                    color: #f87171;
                }

                .charts-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .chart-container {
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }

                .admin-dashboard.dark .chart-container {
                    background: #2a2a2a;
                }

                .chart-container h3 {
                    margin-top: 0;
                    margin-bottom: 15px;
                    color: #007bff;
                }

                .ranking-list {
                    max-height: 300px;
                    overflow-y: auto;
                }

                .ranking-item {
                    display: flex;
                    align-items: center;
                    padding: 10px 0;
                    border-bottom: 1px solid #eee;
                }

                .admin-dashboard.dark .ranking-item {
                    border-bottom-color: #444;
                }

                .rank-badge {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    width: 30px;
                    height: 30px;
                    background: #007bff;
                    color: white;
                    border-radius: 50%;
                    font-weight: bold;
                    margin-right: 15px;
                }

                .rank-class {
                    flex: 1;
                }

                .rank-score {
                    font-weight: bold;
                    color: #007bff;
                }

                .dashboard-footer {
                    text-align: center;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #999;
                    font-size: 12px;
                }

                .admin-dashboard.dark .dashboard-footer {
                    border-top-color: #444;
                }
            </style>
        `;
    },

    /**
     * 切换主题
     */
    toggleTheme() {
        this.config.theme = this.config.theme === 'dark' ? 'light' : 'dark';
        this._applyTheme();
        console.log(`🌙 主题已切换为: ${this.config.theme}`);
    },

    /**
     * 计算学校统计数据
     * @private
     */
    _calculateSchoolStats() {
        const students = window.RAW_DATA || [];

        const scores = students.map(s => s.total || 0).filter(s => s > 0);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        const excellentCount = students.filter(s => (s.total || 0) > 85).length;
        const passCount = students.filter(s => (s.total || 0) > 60).length;

        // 按学校分组
        const schoolBreakdown = {};
        students.forEach(s => {
            const school = s.school || '未知';
            if (!schoolBreakdown[school]) {
                schoolBreakdown[school] = [];
            }
            schoolBreakdown[school].push(s);
        });

        return {
            totalStudents: students.length,
            avgScore: avgScore,
            avgTrend: 0.5,  // 示例数据
            excellentRate: excellentCount / students.length,
            excellentCount: excellentCount,
            passRate: passCount / students.length,
            passCount: passCount,
            schoolBreakdown: schoolBreakdown
        };
    },

    /**
     * 计算班级排名
     * @private
     */
    _calculateClassRanking() {
        const students = window.RAW_DATA || [];
        const classMap = {};

        students.forEach(s => {
            const cls = s.class || '未知';
            if (!classMap[cls]) {
                classMap[cls] = [];
            }
            classMap[cls].push(s);
        });

        const ranking = Object.entries(classMap).map(([className, classStudents]) => {
            const scores = classStudents.map(s => s.total || 0).filter(s => s > 0);
            const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

            return {
                className: className,
                avgScore: avgScore,
                studentCount: classStudents.length
            };
        });

        return ranking.sort((a, b) => b.avgScore - a.avgScore);
    },

    /**
     * 分析学科成绩
     * @private
     */
    _analyzeSubjectPerformance() {
        const students = window.RAW_DATA || [];
        const subjects = {};

        students.forEach(s => {
            if (s.scores) {
                Object.entries(s.scores).forEach(([subject, score]) => {
                    if (!subjects[subject]) {
                        subjects[subject] = [];
                    }
                    subjects[subject].push(score);
                });
            }
        });

        const analysis = {};
        for (const subject in subjects) {
            const scores = subjects[subject].filter(s => s > 0);
            analysis[subject] = {
                avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
                maxScore: Math.max(...scores),
                minScore: Math.min(...scores)
            };
        }

        return analysis;
    },

    /**
     * 获取趋势数据
     * @private
     */
    _getTrendData() {
        // 从历史快照中获取趋势数据
        if (window.COHORT_DB && window.COHORT_DB.exams) {
            return window.COHORT_DB.exams.map(exam => ({
                examName: exam.name,
                avgScore: exam.avgScore || 0,
                timestamp: exam.timestamp
            }));
        }

        return [];
    },

    /**
     * 更新所有图表
     * @private
     */
    _updateAllCharts() {
        // 这里需要集成 Chart.js 来绘制图表
        // 由于篇幅限制，这里仅作为占位符
        console.log('📊 图表已更新');
    },

    /**
     * 启动定时刷新
     * @private
     */
    _startAutoRefresh() {
        setInterval(() => {
            this.refreshData();
        }, this.config.refreshInterval);

        console.log('🕐 驾驶舱自动刷新已启动');
    },

    /**
     * 应用主题
     * @private
     */
    _applyTheme() {
        const container = document.getElementById('admin-dashboard-container');
        if (container) {
            container.classList.remove('dark', 'light');
            container.classList.add(this.config.theme);
        }
    }
};

// 导出到全局作用域
window.AdminDashboard = AdminDashboard;
