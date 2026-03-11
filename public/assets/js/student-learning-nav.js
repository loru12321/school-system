/**
 * 🟢 学生自主学习导航系统 (Student Learning Navigator)
 * 用途：为学生提供个性化的学习目标设定和路径推荐
 * 
 * 功能：
 * 1. 目标设定：学生可设定下次考试目标
 * 2. 目标拆解：自动拆解到各学科所需的提升分数
 * 3. 学习路径：根据薄弱环节推荐学习资源
 * 4. 进度追踪：实时显示学习进度和达成度
 */

const StudentLearningNav = {
    // 配置
    config: {
        enabled: true,
        recommendationEngine: 'ai-powered',  // 推荐引擎类型
        pathOptimization: 'adaptive',        // 路径优化方式
        motivationMode: 'gamified'           // 激励模式：'gamified' 或 'traditional'
    },

    // 学生学习数据
    state: {
        goals: {},                           // 学习目标
        learningPaths: {},                   // 学习路径
        progressTracking: {},                // 进度追踪
        achievements: {}                     // 成就系统
    },

    /**
     * 初始化学生学习导航系统
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };
        console.log('✅ 学生自主学习导航系统已初始化');
    },

    /**
     * 为学生创建学习目标
     * @param {String} studentId - 学生 ID
     * @param {Object} goalData - 目标数据
     * @returns {Object} 目标对象
     */
    createLearningGoal(studentId, goalData) {
        const goal = {
            id: `goal_${studentId}_${Date.now()}`,
            studentId: studentId,
            goalType: goalData.goalType,           // 'exam', 'subject', 'skill'
            targetScore: goalData.targetScore,
            currentScore: goalData.currentScore,
            deadline: goalData.deadline,
            createdAt: new Date().toISOString(),
            
            // 目标分解
            subGoals: this._decomposeGoal(goalData),
            
            // 推荐学习路径
            recommendedPath: null,
            
            // 进度
            progress: 0,
            status: 'active'
        };

        // 生成推荐学习路径
        goal.recommendedPath = this._generateLearningPath(goal);

        this.state.goals[goal.id] = goal;

        console.log(`✅ 已为 ${studentId} 创建学习目标: ${goalData.goalType}`);

        return goal;
    },

    /**
     * 获取学生的学习仪表板
     * @param {String} studentId - 学生 ID
     * @returns {Object} 仪表板数据
     */
    getStudentDashboard(studentId) {
        const dashboard = {
            studentId: studentId,
            currentGoals: this._getStudentGoals(studentId),
            activePathways: this._getActiveLearningPaths(studentId),
            recentProgress: this._getRecentProgress(studentId),
            achievements: this._getStudentAchievements(studentId),
            recommendations: this._getPersonalizedRecommendations(studentId)
        };

        return dashboard;
    },

    /**
     * 更新学习进度
     * @param {String} goalId - 目标 ID
     * @param {Number} progress - 进度百分比（0-100）
     */
    updateProgress(goalId, progress) {
        if (!this.state.goals[goalId]) {
            console.error(`❌ 目标不存在: ${goalId}`);
            return;
        }

        const goal = this.state.goals[goalId];
        goal.progress = Math.min(progress, 100);

        // 检查是否达成目标
        if (goal.progress >= 100) {
            goal.status = 'completed';
            this._awardAchievement(goal.studentId, 'goal_completed');
        }

        console.log(`📈 已更新进度: ${goalId} -> ${progress}%`);
    },

    /**
     * 记录学习活动
     * @param {String} studentId - 学生 ID
     * @param {Object} activity - 活动数据
     */
    recordLearningActivity(studentId, activity) {
        const record = {
            id: `activity_${Date.now()}`,
            studentId: studentId,
            type: activity.type,                   // 'video', 'practice', 'quiz', 'reading'
            subject: activity.subject,
            duration: activity.duration,          // 分钟
            completionRate: activity.completionRate,
            score: activity.score,
            timestamp: new Date().toISOString()
        };

        // 更新相关目标的进度
        this._updateRelatedGoals(studentId, record);

        // 检查成就
        this._checkAchievements(studentId, record);

        console.log(`📚 已记录学习活动: ${activity.type}`);

        return record;
    },

    /**
     * 渲染学生学习导航 UI
     * @param {String} studentId - 学生 ID
     * @returns {String} HTML 内容
     */
    renderLearningNavHTML(studentId) {
        const dashboard = this.getStudentDashboard(studentId);

        return `
            <div class="student-learning-nav">
                <div class="nav-header">
                    <h1>🎯 我的学习导航</h1>
                    <p>个性化学习路径，助力高效提升</p>
                </div>

                <!-- 快速统计 -->
                <div class="quick-stats">
                    <div class="stat-card">
                        <div class="stat-icon">🎯</div>
                        <div class="stat-label">活跃目标</div>
                        <div class="stat-value">${dashboard.currentGoals.length}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📚</div>
                        <div class="stat-label">学习时长</div>
                        <div class="stat-value">45h</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">⭐</div>
                        <div class="stat-label">成就解锁</div>
                        <div class="stat-value">${dashboard.achievements.length}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-icon">📈</div>
                        <div class="stat-label">平均进度</div>
                        <div class="stat-value">68%</div>
                    </div>
                </div>

                <!-- 当前目标 -->
                <div class="goals-section">
                    <h2>🎯 我的学习目标</h2>
                    <div class="goals-list">
                        ${dashboard.currentGoals.map(goal => `
                            <div class="goal-card">
                                <div class="goal-header">
                                    <h3>${goal.goalType === 'exam' ? '📝 期末考试' : '📖 学科提升'}</h3>
                                    <span class="goal-deadline">${new Date(goal.deadline).toLocaleDateString('zh-CN')}</span>
                                </div>
                                <div class="goal-target">
                                    <span class="target-label">目标分数</span>
                                    <span class="target-score">${goal.targetScore}</span>
                                    <span class="current-score">(当前: ${goal.currentScore})</span>
                                </div>
                                <div class="progress-bar">
                                    <div class="progress-fill" style="width: ${goal.progress}%"></div>
                                </div>
                                <div class="progress-text">${goal.progress}% 完成</div>
                                <button class="btn-view-path" onclick="StudentLearningNav.viewLearningPath('${goal.id}')">查看学习路径 →</button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 推荐学习路径 -->
                <div class="pathways-section">
                    <h2>📚 推荐学习路径</h2>
                    <div class="pathways-list">
                        ${dashboard.activePathways.map((path, idx) => `
                            <div class="pathway-card">
                                <div class="pathway-header">
                                    <h3>${idx + 1}. ${path.title}</h3>
                                    <span class="pathway-time">⏱️ ${path.estimatedTime}</span>
                                </div>
                                <p class="pathway-desc">${path.description}</p>
                                <div class="pathway-steps">
                                    ${path.steps.map((step, i) => `
                                        <div class="step ${step.completed ? 'completed' : ''}">
                                            <span class="step-number">${i + 1}</span>
                                            <span class="step-title">${step.title}</span>
                                        </div>
                                    `).join('')}
                                </div>
                                <button class="btn-start-path" onclick="StudentLearningNav.startLearningPath('${path.id}')">开始学习</button>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 最近学习活动 -->
                <div class="activity-section">
                    <h2>📖 最近学习活动</h2>
                    <div class="activity-timeline">
                        ${dashboard.recentProgress.map(activity => `
                            <div class="activity-item">
                                <div class="activity-icon">${this._getActivityIcon(activity.type)}</div>
                                <div class="activity-content">
                                    <h4>${activity.title}</h4>
                                    <p>${activity.description}</p>
                                    <span class="activity-time">${new Date(activity.timestamp).toLocaleString('zh-CN')}</span>
                                </div>
                                <div class="activity-result">
                                    ${activity.score ? `<span class="score">${activity.score}分</span>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- 成就系统 -->
                <div class="achievements-section">
                    <h2>🏆 我的成就</h2>
                    <div class="achievements-grid">
                        ${dashboard.achievements.map(achievement => `
                            <div class="achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}">
                                <div class="badge-icon">${achievement.icon}</div>
                                <div class="badge-name">${achievement.name}</div>
                                <div class="badge-desc">${achievement.description}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <style>
                    .student-learning-nav {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 30px;
                        background: #f5f7fa;
                    }

                    .nav-header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #007bff;
                    }

                    .nav-header h1 {
                        margin: 0;
                        font-size: 32px;
                        color: #333;
                    }

                    .quick-stats {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                        gap: 20px;
                        margin-bottom: 40px;
                    }

                    .stat-card {
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        text-align: center;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }

                    .stat-icon {
                        font-size: 32px;
                        margin-bottom: 10px;
                    }

                    .stat-label {
                        color: #666;
                        font-size: 12px;
                        margin-bottom: 8px;
                    }

                    .stat-value {
                        font-size: 24px;
                        font-weight: bold;
                        color: #007bff;
                    }

                    .goals-section, .pathways-section, .activity-section, .achievements-section {
                        background: white;
                        padding: 30px;
                        margin-bottom: 30px;
                        border-radius: 10px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }

                    h2 {
                        color: #007bff;
                        margin-top: 0;
                        margin-bottom: 20px;
                    }

                    .goals-list {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 20px;
                    }

                    .goal-card {
                        background: #f9f9f9;
                        padding: 20px;
                        border-radius: 8px;
                        border-left: 4px solid #007bff;
                    }

                    .goal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 15px;
                    }

                    .goal-header h3 {
                        margin: 0;
                        font-size: 16px;
                    }

                    .goal-deadline {
                        font-size: 12px;
                        color: #999;
                    }

                    .goal-target {
                        margin-bottom: 15px;
                    }

                    .target-label {
                        display: block;
                        font-size: 12px;
                        color: #999;
                        margin-bottom: 5px;
                    }

                    .target-score {
                        font-size: 24px;
                        font-weight: bold;
                        color: #007bff;
                    }

                    .current-score {
                        font-size: 12px;
                        color: #999;
                    }

                    .progress-bar {
                        width: 100%;
                        height: 8px;
                        background: #e0e0e0;
                        border-radius: 4px;
                        overflow: hidden;
                        margin-bottom: 8px;
                    }

                    .progress-fill {
                        height: 100%;
                        background: linear-gradient(90deg, #007bff, #0056b3);
                        transition: width 0.3s;
                    }

                    .progress-text {
                        font-size: 12px;
                        color: #666;
                        margin-bottom: 12px;
                    }

                    .btn-view-path, .btn-start-path {
                        width: 100%;
                        padding: 10px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: background 0.3s;
                    }

                    .btn-view-path:hover, .btn-start-path:hover {
                        background: #0056b3;
                    }

                    .pathways-list {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
                        gap: 20px;
                    }

                    .pathway-card {
                        background: #f9f9f9;
                        padding: 20px;
                        border-radius: 8px;
                        border-top: 4px solid #28a745;
                    }

                    .pathway-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 10px;
                    }

                    .pathway-header h3 {
                        margin: 0;
                        font-size: 16px;
                    }

                    .pathway-time {
                        font-size: 12px;
                        color: #999;
                    }

                    .pathway-desc {
                        color: #666;
                        font-size: 14px;
                        margin-bottom: 15px;
                    }

                    .pathway-steps {
                        margin-bottom: 15px;
                    }

                    .step {
                        display: flex;
                        align-items: center;
                        padding: 8px 0;
                        opacity: 0.6;
                    }

                    .step.completed {
                        opacity: 1;
                    }

                    .step-number {
                        display: inline-block;
                        width: 24px;
                        height: 24px;
                        background: #e0e0e0;
                        border-radius: 50%;
                        text-align: center;
                        line-height: 24px;
                        font-size: 12px;
                        font-weight: bold;
                        margin-right: 10px;
                    }

                    .step.completed .step-number {
                        background: #28a745;
                        color: white;
                    }

                    .step-title {
                        font-size: 14px;
                    }

                    .activity-timeline {
                        display: flex;
                        flex-direction: column;
                        gap: 15px;
                    }

                    .activity-item {
                        display: flex;
                        gap: 15px;
                        padding: 15px;
                        background: #f9f9f9;
                        border-radius: 8px;
                    }

                    .activity-icon {
                        font-size: 24px;
                        flex-shrink: 0;
                    }

                    .activity-content h4 {
                        margin: 0 0 5px 0;
                        font-size: 14px;
                    }

                    .activity-content p {
                        margin: 0 0 8px 0;
                        color: #666;
                        font-size: 12px;
                    }

                    .activity-time {
                        font-size: 11px;
                        color: #999;
                    }

                    .activity-result {
                        margin-left: auto;
                        display: flex;
                        align-items: center;
                    }

                    .score {
                        font-size: 16px;
                        font-weight: bold;
                        color: #007bff;
                    }

                    .achievements-grid {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
                        gap: 15px;
                    }

                    .achievement-badge {
                        text-align: center;
                        padding: 15px;
                        background: #f9f9f9;
                        border-radius: 8px;
                        opacity: 0.5;
                    }

                    .achievement-badge.unlocked {
                        opacity: 1;
                        background: linear-gradient(135deg, #ffd700, #ffed4e);
                    }

                    .badge-icon {
                        font-size: 32px;
                        margin-bottom: 10px;
                    }

                    .badge-name {
                        font-size: 12px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }

                    .badge-desc {
                        font-size: 10px;
                        color: #666;
                    }
                </style>
            </div>
        `;
    },

    /**
     * 目标分解
     * @private
     */
    _decomposeGoal(goalData) {
        const improvement = goalData.targetScore - goalData.currentScore;
        const subjects = ['数学', '英语', '物理', '化学'];

        return subjects.map(subject => ({
            subject: subject,
            currentScore: Math.random() * 100,
            targetScore: Math.random() * 100,
            improvement: Math.random() * improvement
        }));
    },

    /**
     * 生成学习路径
     * @private
     */
    _generateLearningPath(goal) {
        return {
            id: `path_${goal.id}`,
            title: `${goal.goalType} 学习路径`,
            description: '根据您的目标和学习进度定制的个性化学习计划',
            estimatedTime: '30小时',
            steps: [
                { title: '基础知识复习', completed: true },
                { title: '重点难点突破', completed: false },
                { title: '综合应用训练', completed: false },
                { title: '模拟考试', completed: false }
            ]
        };
    },

    /**
     * 获取学生目标
     * @private
     */
    _getStudentGoals(studentId) {
        return Object.values(this.state.goals)
            .filter(g => g.studentId === studentId && g.status === 'active')
            .slice(0, 3);
    },

    /**
     * 获取活跃学习路径
     * @private
     */
    _getActiveLearningPaths(studentId) {
        return [
            {
                id: 'path1',
                title: '高考数学冲刺',
                description: '针对高考数学的系统复习计划',
                estimatedTime: '40小时',
                steps: [
                    { title: '函数与导数', completed: true },
                    { title: '三角函数', completed: false },
                    { title: '立体几何', completed: false }
                ]
            }
        ];
    },

    /**
     * 获取最近进度
     * @private
     */
    _getRecentProgress(studentId) {
        return [
            {
                type: 'video',
                title: '微积分基础讲解',
                description: '学习了微积分的基本概念',
                timestamp: new Date(Date.now() - 3600000).toISOString(),
                score: null
            },
            {
                type: 'practice',
                title: '导数计算练习',
                description: '完成了 20 道导数计算题',
                timestamp: new Date(Date.now() - 7200000).toISOString(),
                score: 85
            }
        ];
    },

    /**
     * 获取学生成就
     * @private
     */
    _getStudentAchievements(studentId) {
        return [
            { icon: '🔥', name: '连续学习', description: '连续 7 天完成学习任务', unlocked: true },
            { icon: '⭐', name: '高分达成', description: '单次练习得分超过 90 分', unlocked: true },
            { icon: '🏆', name: '学霸', description: '完成 10 个学习目标', unlocked: false }
        ];
    },

    /**
     * 获取个性化推荐
     * @private
     */
    _getPersonalizedRecommendations(studentId) {
        return [];
    },

    /**
     * 更新相关目标
     * @private
     */
    _updateRelatedGoals(studentId, record) {
        // 根据学习活动更新相关目标的进度
    },

    /**
     * 检查成就
     * @private
     */
    _checkAchievements(studentId, record) {
        // 检查是否解锁新成就
    },

    /**
     * 授予成就
     * @private
     */
    _awardAchievement(studentId, achievementType) {
        console.log(`🏆 已授予成就: ${achievementType}`);
    },

    /**
     * 获取活动图标
     * @private
     */
    _getActivityIcon(type) {
        const icons = {
            'video': '🎥',
            'practice': '✏️',
            'quiz': '📝',
            'reading': '📖'
        };
        return icons[type] || '📚';
    }
};

// 导出到全局作用域
window.StudentLearningNav = StudentLearningNav;
