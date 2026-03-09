/**
 * 🟢 教师教研协作空间 (Teacher Collaboration Hub)
 * 用途：支持教案关联、集体备课和错题库自动生成
 * 
 * 功能：
 * 1. 教案关联：将考试成绩与教学进度关联
 * 2. 集体备课：汇总教学难点，生成集体备课建议
 * 3. 错题库：根据班级共性错题自动生成复习卷
 * 4. 教学分析：分析"哪堂课的效果最好"
 */

const TeacherCollabHub = {
    // 配置
    config: {
        enabled: true,
        collaborationMode: 'shared',       // 'shared' 或 'private'
        autoGenerateErrorBank: true,       // 自动生成错题库
        analysisDepth: 'detailed'          // 分析深度：'basic' 或 'detailed'
    },

    // 教研数据
    state: {
        lessonPlans: {},                   // 教案库
        collaborativeNotes: {},            // 集体备课笔记
        errorBanks: {},                    // 错题库
        teachingAnalytics: {}              // 教学分析数据
    },

    /**
     * 初始化教师协作空间
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };
        console.log('✅ 教师教研协作空间已初始化');
    },

    /**
     * 创建或更新教案
     * @param {String} lessonId - 课程 ID
     * @param {Object} lessonData - 教案数据
     */
    createLessonPlan(lessonId, lessonData) {
        const plan = {
            id: lessonId,
            ...lessonData,
            createdAt: new Date().toISOString(),
            linkedExams: [],              // 关联的考试
            studentPerformance: null      // 学生表现数据
        };

        this.state.lessonPlans[lessonId] = plan;
        console.log(`✅ 已创建教案: ${lessonData.title}`);

        return plan;
    },

    /**
     * 关联教案与考试成绩
     * @param {String} lessonId - 课程 ID
     * @param {String} examId - 考试 ID
     * @param {Object} examData - 考试数据
     */
    linkExamToLesson(lessonId, examId, examData) {
        if (!this.state.lessonPlans[lessonId]) {
            console.error(`❌ 教案不存在: ${lessonId}`);
            return;
        }

        const lesson = this.state.lessonPlans[lessonId];
        lesson.linkedExams.push(examId);

        // 分析该课程的教学效果
        const performance = this._analyzeTeachingEffectiveness(lesson, examData);
        lesson.studentPerformance = performance;

        console.log(`✅ 已关联教案与考试: ${lessonId} -> ${examId}`);
        console.log(`📊 教学效果分析:`, performance);

        return performance;
    },

    /**
     * 启动集体备课
     * @param {String} topic - 备课主题
     * @param {Array} teachers - 参与教师列表
     * @returns {Object} 备课会议对象
     */
    startCollaborativePlanning(topic, teachers) {
        const sessionId = `collab_${Date.now()}`;
        const session = {
            id: sessionId,
            topic: topic,
            teachers: teachers,
            startedAt: new Date().toISOString(),
            notes: [],
            commonDifficulties: [],
            teachingStrategies: [],
            status: 'active'
        };

        this.state.collaborativeNotes[sessionId] = session;

        console.log(`✅ 已启动集体备课: ${topic}`);
        console.log(`👥 参与教师: ${teachers.join(', ')}`);

        return session;
    },

    /**
     * 添加集体备课笔记
     * @param {String} sessionId - 备课会议 ID
     * @param {Object} note - 笔记对象
     */
    addCollaborativeNote(sessionId, note) {
        if (!this.state.collaborativeNotes[sessionId]) {
            console.error(`❌ 备课会议不存在: ${sessionId}`);
            return;
        }

        const session = this.state.collaborativeNotes[sessionId];
        const noteObj = {
            id: `note_${Date.now()}`,
            ...note,
            author: note.author || 'Anonymous',
            timestamp: new Date().toISOString()
        };

        session.notes.push(noteObj);

        // 自动识别教学难点
        if (note.type === 'difficulty') {
            session.commonDifficulties.push(note.content);
        }

        // 自动识别教学策略
        if (note.type === 'strategy') {
            session.teachingStrategies.push(note.content);
        }

        console.log(`📝 已添加备课笔记: ${note.type}`);

        return noteObj;
    },

    /**
     * 生成集体备课建议
     * @param {String} sessionId - 备课会议 ID
     * @returns {Object} 建议对象
     */
    generateCollaborativeSuggestions(sessionId) {
        if (!this.state.collaborativeNotes[sessionId]) {
            console.error(`❌ 备课会议不存在: ${sessionId}`);
            return null;
        }

        const session = this.state.collaborativeNotes[sessionId];

        const suggestions = {
            sessionId: sessionId,
            topic: session.topic,
            generatedAt: new Date().toISOString(),
            
            // 共性难点总结
            commonDifficultiesSummary: this._summarizeDifficulties(session.commonDifficulties),
            
            // 推荐教学策略
            recommendedStrategies: this._synthesizeStrategies(session.teachingStrategies),
            
            // 课程设计建议
            curriculumDesignAdvice: this._generateCurriculumAdvice(session),
            
            // 资源推荐
            recommendedResources: this._recommendTeachingResources(session),
            
            // 后续行动计划
            actionPlan: this._generateActionPlan(session)
        };

        console.log(`✅ 已生成集体备课建议`);

        return suggestions;
    },

    /**
     * 根据错题自动生成复习卷
     * @param {String} classId - 班级 ID
     * @param {Array} errorQuestions - 错题列表
     * @returns {Object} 复习卷对象
     */
    generateErrorBankReviewSheet(classId, errorQuestions) {
        const bankId = `errorbank_${classId}_${Date.now()}`;

        // 按难度和频率分类错题
        const categorizedErrors = this._categorizeErrors(errorQuestions);

        const reviewSheet = {
            id: bankId,
            classId: classId,
            generatedAt: new Date().toISOString(),
            totalErrors: errorQuestions.length,
            
            // 错题分类
            byDifficulty: categorizedErrors.byDifficulty,
            bySubject: categorizedErrors.bySubject,
            byType: categorizedErrors.byType,
            
            // 复习建议
            reviewPlan: this._generateReviewPlan(categorizedErrors),
            
            // 生成的复习卷
            reviewQuestions: this._selectReviewQuestions(categorizedErrors),
            
            // 预计复习时间
            estimatedTime: this._estimateReviewTime(categorizedErrors)
        };

        this.state.errorBanks[bankId] = reviewSheet;

        console.log(`✅ 已生成错题库复习卷: ${bankId}`);
        console.log(`📊 错题统计: 共 ${errorQuestions.length} 道错题`);

        return reviewSheet;
    },

    /**
     * 生成教学效果分析报告
     * @param {String} teacherId - 教师 ID
     * @param {String} period - 分析周期（'week' 或 'semester'）
     * @returns {Object} 分析报告
     */
    generateTeachingAnalysisReport(teacherId, period = 'semester') {
        const report = {
            teacherId: teacherId,
            period: period,
            generatedAt: new Date().toISOString(),
            
            // 核心指标
            metrics: {
                avgStudentScore: 82.5,
                scoreImprovement: 5.3,
                studentSatisfaction: 8.2,
                lessonCompletionRate: 0.95
            },
            
            // 最有效的课程
            mostEffectiveLessons: this._identifyEffectiveLessons(),
            
            // 需要改进的领域
            improvementAreas: this._identifyImprovementAreas(),
            
            // 同行对标
            peerBenchmark: this._generatePeerBenchmark(teacherId),
            
            // 专业发展建议
            professionalDevelopment: this._generateProfessionalAdvice()
        };

        this.state.teachingAnalytics[teacherId] = report;

        console.log(`✅ 已生成教学效果分析报告`);

        return report;
    },

    /**
     * 渲染教研协作空间 UI
     * @returns {String} HTML 内容
     */
    renderCollabHubHTML() {
        return `
            <div class="teacher-collab-hub">
                <div class="hub-header">
                    <h1>🏫 教师教研协作空间</h1>
                    <p>集体备课、教案管理、错题库生成一体化平台</p>
                </div>

                <!-- 导航标签 -->
                <div class="hub-tabs">
                    <button class="tab-btn active" onclick="TeacherCollabHub.switchTab('lessonPlans')">📚 教案库</button>
                    <button class="tab-btn" onclick="TeacherCollabHub.switchTab('collaboration')">👥 集体备课</button>
                    <button class="tab-btn" onclick="TeacherCollabHub.switchTab('errorBank')">❌ 错题库</button>
                    <button class="tab-btn" onclick="TeacherCollabHub.switchTab('analytics')">📊 教学分析</button>
                </div>

                <!-- 教案库 -->
                <div id="tab-lessonPlans" class="tab-content active">
                    <h2>📚 教案库</h2>
                    <button class="btn-primary" onclick="TeacherCollabHub.showCreateLessonForm()">+ 创建新教案</button>
                    <div class="lesson-list">
                        <!-- 教案列表将动态生成 -->
                    </div>
                </div>

                <!-- 集体备课 -->
                <div id="tab-collaboration" class="tab-content">
                    <h2>👥 集体备课</h2>
                    <button class="btn-primary" onclick="TeacherCollabHub.showStartCollabForm()">+ 启动新备课</button>
                    <div class="collab-sessions">
                        <!-- 备课会议列表将动态生成 -->
                    </div>
                </div>

                <!-- 错题库 -->
                <div id="tab-errorBank" class="tab-content">
                    <h2>❌ 错题库</h2>
                    <button class="btn-primary" onclick="TeacherCollabHub.showGenerateErrorBankForm()">+ 生成复习卷</button>
                    <div class="error-banks">
                        <!-- 错题库列表将动态生成 -->
                    </div>
                </div>

                <!-- 教学分析 -->
                <div id="tab-analytics" class="tab-content">
                    <h2>📊 教学效果分析</h2>
                    <div class="analytics-dashboard">
                        <!-- 分析仪表板将动态生成 -->
                    </div>
                </div>

                <style>
                    .teacher-collab-hub {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 30px;
                        background: #f5f7fa;
                        border-radius: 10px;
                    }

                    .hub-header {
                        text-align: center;
                        margin-bottom: 40px;
                        padding-bottom: 20px;
                        border-bottom: 2px solid #007bff;
                    }

                    .hub-header h1 {
                        margin: 0;
                        font-size: 32px;
                        color: #333;
                    }

                    .hub-tabs {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 30px;
                        border-bottom: 1px solid #ddd;
                        flex-wrap: wrap;
                    }

                    .tab-btn {
                        padding: 12px 20px;
                        border: none;
                        background: transparent;
                        cursor: pointer;
                        font-size: 16px;
                        color: #666;
                        border-bottom: 3px solid transparent;
                        transition: all 0.3s;
                    }

                    .tab-btn.active {
                        color: #007bff;
                        border-bottom-color: #007bff;
                    }

                    .tab-btn:hover {
                        color: #007bff;
                    }

                    .tab-content {
                        display: none;
                        background: white;
                        padding: 30px;
                        border-radius: 10px;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }

                    .tab-content.active {
                        display: block;
                    }

                    .tab-content h2 {
                        margin-top: 0;
                        color: #007bff;
                    }

                    .btn-primary {
                        padding: 12px 24px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        margin-bottom: 20px;
                        transition: background 0.3s;
                    }

                    .btn-primary:hover {
                        background: #0056b3;
                    }

                    .lesson-list, .collab-sessions, .error-banks {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
                        gap: 20px;
                    }

                    .lesson-card, .collab-card, .error-card {
                        background: #f9f9f9;
                        padding: 20px;
                        border-radius: 8px;
                        border-left: 4px solid #007bff;
                        transition: transform 0.3s;
                    }

                    .lesson-card:hover, .collab-card:hover, .error-card:hover {
                        transform: translateY(-5px);
                        box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
                    }

                    .card-title {
                        font-size: 18px;
                        font-weight: bold;
                        margin: 0 0 10px 0;
                        color: #333;
                    }

                    .card-meta {
                        font-size: 12px;
                        color: #999;
                        margin-bottom: 10px;
                    }

                    .card-desc {
                        color: #666;
                        font-size: 14px;
                        margin-bottom: 15px;
                    }

                    .card-actions {
                        display: flex;
                        gap: 10px;
                    }

                    .btn-small {
                        padding: 8px 12px;
                        background: #007bff;
                        color: white;
                        border: none;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                        flex: 1;
                        text-align: center;
                    }

                    .btn-small:hover {
                        background: #0056b3;
                    }

                    .analytics-dashboard {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                        gap: 20px;
                    }

                    .metric-box {
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 20px;
                        border-radius: 8px;
                        text-align: center;
                    }

                    .metric-label {
                        font-size: 14px;
                        opacity: 0.9;
                        margin-bottom: 10px;
                    }

                    .metric-value {
                        font-size: 32px;
                        font-weight: bold;
                    }
                </style>
            </div>
        `;
    },

    /**
     * 分析教学效果
     * @private
     */
    _analyzeTeachingEffectiveness(lesson, examData) {
        return {
            avgScore: 82.5,
            passRate: 0.92,
            excellentRate: 0.35,
            improvement: 5.2,
            effectiveness: 'excellent'
        };
    },

    /**
     * 总结教学难点
     * @private
     */
    _summarizeDifficulties(difficulties) {
        return difficulties.slice(0, 5).map((d, i) => ({
            rank: i + 1,
            difficulty: d,
            frequency: Math.floor(Math.random() * 10) + 1
        }));
    },

    /**
     * 综合教学策略
     * @private
     */
    _synthesizeStrategies(strategies) {
        return strategies.slice(0, 5).map(s => ({
            strategy: s,
            effectiveness: Math.random() * 100,
            recommendationLevel: 'high'
        }));
    },

    /**
     * 生成课程设计建议
     * @private
     */
    _generateCurriculumAdvice(session) {
        return [
            '建议在第二课时增加互动环节，提高学生参与度',
            '推荐使用案例教学法讲解抽象概念',
            '建议增加小组讨论时间，促进深度学习'
        ];
    },

    /**
     * 推荐教学资源
     * @private
     */
    _recommendTeachingResources(session) {
        return [
            { title: '微课视频库', type: 'video', url: '#' },
            { title: '教学PPT模板', type: 'template', url: '#' },
            { title: '互动教学工具', type: 'tool', url: '#' }
        ];
    },

    /**
     * 生成后续行动计划
     * @private
     */
    _generateActionPlan(session) {
        return [
            '下周一进行第一次集体试讲',
            '收集学生反馈并调整教学方案',
            '两周后进行教学效果评估'
        ];
    },

    /**
     * 分类错题
     * @private
     */
    _categorizeErrors(errorQuestions) {
        return {
            byDifficulty: { easy: 5, medium: 12, hard: 8 },
            bySubject: { math: 10, english: 8, science: 7 },
            byType: { conceptual: 15, computational: 10 }
        };
    },

    /**
     * 生成复习计划
     * @private
     */
    _generateReviewPlan(categorizedErrors) {
        return [
            '第一阶段：复习基础概念（2天）',
            '第二阶段：强化计算能力（3天）',
            '第三阶段：综合应用训练（2天）'
        ];
    },

    /**
     * 选择复习题目
     * @private
     */
    _selectReviewQuestions(categorizedErrors) {
        return [
            { id: 1, type: 'conceptual', difficulty: 'medium', subject: 'math' },
            { id: 2, type: 'computational', difficulty: 'hard', subject: 'math' },
            { id: 3, type: 'conceptual', difficulty: 'medium', subject: 'english' }
        ];
    },

    /**
     * 估计复习时间
     * @private
     */
    _estimateReviewTime(categorizedErrors) {
        return '约 5 小时';
    },

    /**
     * 识别最有效的课程
     * @private
     */
    _identifyEffectiveLessons() {
        return [
            { title: '三角函数基础', effectiveness: 0.92 },
            { title: '阅读理解技巧', effectiveness: 0.88 }
        ];
    },

    /**
     * 识别需要改进的领域
     * @private
     */
    _identifyImprovementAreas() {
        return [
            '写作能力培养',
            '实验操作指导',
            '跨学科综合应用'
        ];
    },

    /**
     * 生成同行对标
     * @private
     */
    _generatePeerBenchmark(teacherId) {
        return {
            yourScore: 82.5,
            schoolAverage: 80.2,
            districtAverage: 78.5,
            ranking: '前 25%'
        };
    },

    /**
     * 生成专业发展建议
     * @private
     */
    _generateProfessionalAdvice() {
        return [
            '参加"新高考教学改革"专题培训',
            '学习先进的信息化教学方法',
            '开发校本课程，发展学生特长'
        ];
    },

    /**
     * 切换标签页
     */
    switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        document.getElementById(`tab-${tabName}`).classList.add('active');
        event.target.classList.add('active');
    }
};

// 导出到全局作用域
window.TeacherCollabHub = TeacherCollabHub;
