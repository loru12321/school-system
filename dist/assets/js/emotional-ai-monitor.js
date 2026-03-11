/**
 * 💭 智能情感与心理预警系统
 * 
 * 功能：
 * - 分析学生的非学术特征识别心理压力
 * - 预测学生的厌学情绪和心理危机
 * - 生成温情谈话指南
 * - 提供心理健康干预建议
 * 
 * 依赖：无外部库
 * 
 * @author AI Education Team
 * @version 1.0.0
 */

const EmotionalAIMonitor = (() => {
    // 学生心理档案
    let psychologicalProfiles = new Map();
    let warningRecords = [];
    let interventionHistory = [];
    
    // 配置
    const config = {
        warningThresholds: {
            stress: 0.7,
            burnout: 0.75,
            depression: 0.8,
            anxiety: 0.65
        },
        checkInterval: 7 * 24 * 60 * 60 * 1000, // 7天
        enableAutoAlert: true,
        interventionStrategies: ['counseling', 'mentoring', 'parentCommunication', 'activityParticipation', 'peerSupport']
    };
    
    /**
     * 分析学生的心理指标
     */
    function analyzeEmotionalIndicators(studentData) {
        const indicators = {
            // 作业提交行为
            homeworkSubmissionRate: calculateHomeworkSubmissionRate(studentData),
            homeworkQualityTrend: calculateHomeworkQualityTrend(studentData),
            
            // 出勤行为
            attendanceRate: studentData.attendance || 0,
            latenessFrequency: studentData.latenessCount || 0,
            absenceFrequency: studentData.absenceCount || 0,
            
            // 成绩波动
            scoreVolatility: calculateScoreVolatility(studentData),
            recentScoreTrend: calculateRecentScoreTrend(studentData),
            
            // 课堂表现
            classParticipation: studentData.classParticipation || 0,
            raisingHandFrequency: studentData.raisingHandCount || 0,
            
            // 社交行为
            peerInteraction: studentData.peerInteractionScore || 0,
            groupWorkParticipation: studentData.groupWorkScore || 0,
            
            // 行为记录
            disciplinaryRecords: studentData.disciplinaryRecords || 0,
            behaviorScore: studentData.behavior || 0,
            
            // 心理自评
            selfReportedStress: studentData.stressLevel || 0,
            selfReportedMood: studentData.moodScore || 0,
            sleepQuality: studentData.sleepQuality || 0
        };
        
        return indicators;
    }
    
    /**
     * 计算作业提交率
     */
    function calculateHomeworkSubmissionRate(studentData) {
        const submitted = studentData.homeworkSubmitted || 0;
        const total = studentData.homeworkAssigned || 1;
        return Math.min(100, (submitted / total) * 100);
    }
    
    /**
     * 计算作业质量趋势
     */
    function calculateHomeworkQualityTrend(studentData) {
        const history = studentData.homeworkHistory || [];
        if (history.length < 2) return 0;
        
        let trend = 0;
        for (let i = 1; i < history.length; i++) {
            trend += (history[i].quality || 0) - (history[i - 1].quality || 0);
        }
        
        return trend / (history.length - 1);
    }
    
    /**
     * 计算成绩波动性
     */
    function calculateScoreVolatility(studentData) {
        const history = studentData.examHistory || [];
        if (history.length < 2) return 0;
        
        const scores = history.map(h => h.score || 0);
        const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
        const variance = scores.reduce((sum, score) => sum + (score - mean) ** 2, 0) / scores.length;
        
        return Math.sqrt(variance);
    }
    
    /**
     * 计算最近成绩趋势
     */
    function calculateRecentScoreTrend(studentData) {
        const history = studentData.examHistory || [];
        if (history.length < 2) return 0;
        
        const recent = history.slice(-5); // 最近5次
        let trend = 0;
        for (let i = 1; i < recent.length; i++) {
            trend += (recent[i].score || 0) - (recent[i - 1].score || 0);
        }
        
        return trend / (recent.length - 1);
    }
    
    /**
     * 评估心理健康状态
     */
    function assessPsychologicalHealth(studentData) {
        const indicators = analyzeEmotionalIndicators(studentData);
        
        // 计算各个心理指标的风险分数 (0-1)
        const stressScore = calculateStressScore(indicators);
        const burnoutScore = calculateBurnoutScore(indicators);
        const depressionScore = calculateDepressionScore(indicators);
        const anxietyScore = calculateAnxietyScore(indicators);
        
        // 综合评估
        const overallScore = (stressScore + burnoutScore + depressionScore + anxietyScore) / 4;
        
        // 确定风险等级
        let riskLevel = 'normal';
        if (overallScore > 0.8) riskLevel = 'critical';
        else if (overallScore > 0.7) riskLevel = 'high';
        else if (overallScore > 0.5) riskLevel = 'medium';
        
        return {
            overallScore: overallScore,
            riskLevel: riskLevel,
            indicators: {
                stress: stressScore,
                burnout: burnoutScore,
                depression: depressionScore,
                anxiety: anxietyScore
            },
            assessedAt: new Date()
        };
    }
    
    /**
     * 计算压力分数
     */
    function calculateStressScore(indicators) {
        const factors = [
            (100 - indicators.homeworkSubmissionRate) / 100 * 0.2,
            Math.abs(indicators.scoreVolatility) / 100 * 0.3,
            (100 - indicators.classParticipation) / 100 * 0.2,
            indicators.latenessFrequency / 10 * 0.15,
            (100 - indicators.selfReportedMood) / 100 * 0.15
        ];
        
        return Math.min(1, factors.reduce((a, b) => a + b, 0));
    }
    
    /**
     * 计算倦怠分数
     */
    function calculateBurnoutScore(indicators) {
        const factors = [
            (100 - indicators.homeworkQualityTrend) / 100 * 0.25,
            Math.max(0, -indicators.recentScoreTrend) / 100 * 0.3,
            indicators.absenceFrequency / 10 * 0.25,
            (100 - indicators.classParticipation) / 100 * 0.2
        ];
        
        return Math.min(1, factors.reduce((a, b) => a + b, 0));
    }
    
    /**
     * 计算抑郁分数
     */
    function calculateDepressionScore(indicators) {
        const factors = [
            (100 - indicators.peerInteraction) / 100 * 0.3,
            (100 - indicators.groupWorkParticipation) / 100 * 0.25,
            (100 - indicators.selfReportedMood) / 100 * 0.3,
            (100 - indicators.sleepQuality) / 100 * 0.15
        ];
        
        return Math.min(1, factors.reduce((a, b) => a + b, 0));
    }
    
    /**
     * 计算焦虑分数
     */
    function calculateAnxietyScore(indicators) {
        const factors = [
            Math.abs(indicators.scoreVolatility) / 100 * 0.35,
            indicators.latenessFrequency / 10 * 0.25,
            (100 - indicators.selfReportedMood) / 100 * 0.25,
            indicators.disciplinaryRecords / 5 * 0.15
        ];
        
        return Math.min(1, factors.reduce((a, b) => a + b, 0));
    }
    
    /**
     * 生成温情谈话指南
     */
    function generateCompassionateTalkingGuide(studentData, assessment) {
        const guide = {
            studentName: studentData.name,
            riskLevel: assessment.riskLevel,
            generatedAt: new Date(),
            openingStatement: generateOpeningStatement(assessment),
            keyTopics: generateKeyTopics(assessment),
            questions: generateSupportiveQuestions(assessment),
            resources: generateResources(assessment),
            followUpActions: generateFollowUpActions(assessment)
        };
        
        return guide;
    }
    
    /**
     * 生成开场白
     */
    function generateOpeningStatement(assessment) {
        const statements = {
            critical: '我注意到你最近可能在经历一些困难。我想让你知道，我很关心你的情况，我们可以一起找到解决方案。',
            high: '我想和你聊一下最近的情况。我注意到一些变化，我想确保你一切都好。',
            medium: '我想和你有一个友好的谈话。我想了解你最近的感受。',
            normal: '我很高兴看到你的进步。我想继续支持你的成长。'
        };
        
        return statements[assessment.riskLevel] || statements.normal;
    }
    
    /**
     * 生成关键话题
     */
    function generateKeyTopics(assessment) {
        const topics = [];
        
        if (assessment.indicators.stress > 0.6) {
            topics.push({
                topic: '学业压力',
                description: '讨论最近的学业挑战和压力来源',
                priority: 'high'
            });
        }
        
        if (assessment.indicators.burnout > 0.6) {
            topics.push({
                topic: '学习动力',
                description: '探讨对学习的热情和动力',
                priority: 'high'
            });
        }
        
        if (assessment.indicators.depression > 0.6) {
            topics.push({
                topic: '社交与情感',
                description: '了解与同学的关系和情感状态',
                priority: 'high'
            });
        }
        
        if (assessment.indicators.anxiety > 0.6) {
            topics.push({
                topic: '自信与焦虑',
                description: '讨论对未来的担忧和自信心',
                priority: 'high'
            });
        }
        
        return topics;
    }
    
    /**
     * 生成支持性问题
     */
    function generateSupportiveQuestions(assessment) {
        const questions = [
            '最近你感到怎么样？',
            '你认为哪些方面最具挑战性？',
            '你有什么特别擅长或喜欢的事情吗？',
            '你感到被支持吗？',
            '如果我们可以改变一件事，你希望改变什么？',
            '你认为哪些资源或支持对你最有帮助？',
            '你有什么目标或梦想吗？'
        ];
        
        if (assessment.riskLevel === 'critical') {
            questions.push('你是否有过伤害自己的想法？');
            questions.push('你信任谁？你可以和谁谈论你的感受？');
        }
        
        return questions;
    }
    
    /**
     * 生成资源建议
     */
    function generateResources(assessment) {
        const resources = [];
        
        resources.push({
            type: '学术支持',
            options: ['一对一辅导', '学习小组', '在线资源']
        });
        
        if (assessment.riskLevel !== 'normal') {
            resources.push({
                type: '心理支持',
                options: ['学校心理咨询师', '心理热线', '冥想应用']
            });
            
            resources.push({
                type: '家庭支持',
                options: ['与家长沟通', '家庭辅导', '亲子活动']
            });
        }
        
        return resources;
    }
    
    /**
     * 生成后续行动
     */
    function generateFollowUpActions(assessment) {
        const actions = [];
        
        if (assessment.riskLevel === 'critical') {
            actions.push({
                action: '立即通知家长',
                timeline: '24小时内',
                responsible: '班主任'
            });
            
            actions.push({
                action: '安排心理咨询',
                timeline: '本周内',
                responsible: '学校心理咨询师'
            });
        } else if (assessment.riskLevel === 'high') {
            actions.push({
                action: '与家长沟通',
                timeline: '本周内',
                responsible: '班主任'
            });
            
            actions.push({
                action: '制定支持计划',
                timeline: '2周内',
                responsible: '班主任和科任教师'
            });
        }
        
        return actions;
    }
    
    /**
     * 识别高风险学生
     */
    function identifyHighRiskStudents(classData) {
        const atRiskStudents = [];
        
        classData.forEach(student => {
            const assessment = assessPsychologicalHealth(student);
            
            if (assessment.riskLevel !== 'normal') {
                atRiskStudents.push({
                    student: student,
                    assessment: assessment,
                    identifiedAt: new Date()
                });
                
                // 记录预警
                if (config.enableAutoAlert) {
                    warningRecords.push({
                        studentId: student.id,
                        studentName: student.name,
                        riskLevel: assessment.riskLevel,
                        timestamp: new Date()
                    });
                }
            }
        });
        
        return atRiskStudents.sort((a, b) => b.assessment.overallScore - a.assessment.overallScore);
    }
    
    /**
     * 记录干预
     */
    function recordIntervention(studentId, interventionType, notes = '') {
        const intervention = {
            studentId: studentId,
            type: interventionType,
            notes: notes,
            timestamp: new Date(),
            status: 'ongoing'
        };
        
        interventionHistory.push(intervention);
        console.log(`✅ 已记录干预: ${interventionType}`);
        
        return intervention;
    }
    
    /**
     * 生成心理健康报告
     */
    function generateHealthReport(classData) {
        const atRiskStudents = identifyHighRiskStudents(classData);
        
        const report = {
            generatedAt: new Date(),
            totalStudents: classData.length,
            atRiskCount: atRiskStudents.length,
            atRiskPercentage: (atRiskStudents.length / classData.length) * 100,
            riskDistribution: {
                critical: atRiskStudents.filter(s => s.assessment.riskLevel === 'critical').length,
                high: atRiskStudents.filter(s => s.assessment.riskLevel === 'high').length,
                medium: atRiskStudents.filter(s => s.assessment.riskLevel === 'medium').length
            },
            atRiskStudents: atRiskStudents,
            recommendations: generateRecommendations(atRiskStudents)
        };
        
        return report;
    }
    
    /**
     * 生成建议
     */
    function generateRecommendations(atRiskStudents) {
        const recommendations = [];
        
        const criticalCount = atRiskStudents.filter(s => s.assessment.riskLevel === 'critical').length;
        if (criticalCount > 0) {
            recommendations.push({
                priority: 'urgent',
                action: `立即关注 ${criticalCount} 名处于危机状态的学生`,
                details: '建议立即通知家长并安排心理咨询'
            });
        }
        
        const highCount = atRiskStudents.filter(s => s.assessment.riskLevel === 'high').length;
        if (highCount > 0) {
            recommendations.push({
                priority: 'high',
                action: `加强对 ${highCount} 名高风险学生的支持`,
                details: '建议制定个性化支持计划'
            });
        }
        
        return recommendations;
    }
    
    // ==================== 公开 API ====================
    
    return {
        /**
         * 初始化系统
         */
        init(options = {}) {
            Object.assign(config, options);
            console.log('✅ 智能情感与心理预警系统初始化成功');
            return true;
        },
        
        /**
         * 分析学生的情感指标
         */
        analyze(studentData) {
            return analyzeEmotionalIndicators(studentData);
        },
        
        /**
         * 评估心理健康
         */
        assess(studentData) {
            const assessment = assessPsychologicalHealth(studentData);
            psychologicalProfiles.set(studentData.id, assessment);
            return assessment;
        },
        
        /**
         * 生成谈话指南
         */
        generateGuide(studentData, assessment) {
            return generateCompassionateTalkingGuide(studentData, assessment);
        },
        
        /**
         * 识别高风险学生
         */
        identifyAtRisk(classData) {
            return identifyHighRiskStudents(classData);
        },
        
        /**
         * 记录干预
         */
        recordIntervention(studentId, interventionType, notes) {
            return recordIntervention(studentId, interventionType, notes);
        },
        
        /**
         * 生成心理健康报告
         */
        generateReport(classData) {
            return generateHealthReport(classData);
        },
        
        /**
         * 获取预警记录
         */
        getWarnings() {
            return warningRecords;
        },
        
        /**
         * 获取干预历史
         */
        getInterventionHistory() {
            return interventionHistory;
        },
        
        /**
         * 获取学生心理档案
         */
        getProfile(studentId) {
            return psychologicalProfiles.get(studentId);
        }
    };
})();

// 自动注册到全局
if (typeof window !== 'undefined') {
    window.EmotionalAIMonitor = EmotionalAIMonitor;
}
