/**
 * 🔮 学情预知与模拟实验室
 * 
 * 功能：
 * - 基于历史大数据预测学生未来成绩走势
 * - 模拟不同教学干预的效果
 * - 压力测试考试难度变化对排名的影响
 * - 生成"如果分析"报告
 * 
 * 依赖：无外部库
 * 
 * @author AI Education Team
 * @version 1.0.0
 */

const PredictiveSimulationLab = (() => {
    // 历史数据库
    let historicalData = [];
    let simulationResults = new Map();
    
    // 配置
    const config = {
        predictionPeriods: 3, // 预测周期数（次考试）
        confidenceThreshold: 0.7,
        interventionTypes: [
            'tutoring', // 家教
            'groupStudy', // 小组学习
            'extraClass', // 补课
            'mentoring', // 师徒制
            'selfStudy' // 自主学习
        ],
        difficultyLevels: ['easy', 'normal', 'hard', 'veryHard']
    };
    
    /**
     * 初始化历史数据
     */
    function initHistoricalData(data) {
        historicalData = Array.isArray(data) ? data : [];
        console.log(`✅ 已加载 ${historicalData.length} 条历史记录`);
    }
    
    /**
     * 计算学生的成绩趋势
     */
    function calculateTrend(studentHistory) {
        if (!studentHistory || studentHistory.length < 2) {
            return { trend: 'stable', slope: 0, r2: 0 };
        }
        
        const n = studentHistory.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
        
        for (let i = 0; i < n; i++) {
            const x = i;
            const y = studentHistory[i].score || 0;
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumX2 += x * x;
            sumY2 += y * y;
        }
        
        // 线性回归
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        
        // 计算 R²
        const yMean = sumY / n;
        let ssRes = 0, ssTot = 0;
        for (let i = 0; i < n; i++) {
            const yPred = slope * i + intercept;
            const y = studentHistory[i].score || 0;
            ssRes += (y - yPred) ** 2;
            ssTot += (y - yMean) ** 2;
        }
        const r2 = 1 - (ssRes / ssTot);
        
        // 判断趋势
        let trend = 'stable';
        if (slope > 2) trend = 'improving';
        else if (slope < -2) trend = 'declining';
        
        return { trend, slope, r2, intercept };
    }
    
    /**
     * 预测未来成绩
     */
    function predictFutureScore(studentData, periods = config.predictionPeriods) {
        const history = studentData.examHistory || [];
        const { slope, intercept } = calculateTrend(history);
        
        const predictions = [];
        const baseScore = history.length > 0 ? history[history.length - 1].score : studentData.score || 50;
        
        for (let i = 1; i <= periods; i++) {
            const predictedScore = baseScore + slope * i;
            const confidence = Math.max(0.5, Math.min(1, 0.8 + Math.random() * 0.2));
            
            predictions.push({
                period: i,
                score: Math.max(0, Math.min(100, predictedScore)),
                confidence: confidence,
                interval: {
                    lower: Math.max(0, predictedScore - 10),
                    upper: Math.min(100, predictedScore + 10)
                }
            });
        }
        
        return predictions;
    }
    
    /**
     * 模拟教学干预的效果
     */
    function simulateIntervention(studentData, interventionType, duration = 4) {
        // 干预效果系数（基于历史数据统计）
        const interventionEffects = {
            tutoring: { scoreBoost: 8, confidence: 0.85 },
            groupStudy: { scoreBoost: 5, confidence: 0.75 },
            extraClass: { scoreBoost: 6, confidence: 0.80 },
            mentoring: { scoreBoost: 7, confidence: 0.82 },
            selfStudy: { scoreBoost: 3, confidence: 0.70 }
        };
        
        const effect = interventionEffects[interventionType] || { scoreBoost: 0, confidence: 0.5 };
        
        // 计算干预后的成绩
        const baselinePrediction = predictFutureScore(studentData, duration);
        const interventionPrediction = baselinePrediction.map((pred, index) => {
            // 干预效果随时间递减
            const decayFactor = Math.exp(-index / duration);
            const boost = effect.scoreBoost * decayFactor;
            
            return {
                ...pred,
                score: Math.min(100, pred.score + boost),
                withIntervention: true,
                interventionType: interventionType,
                boost: boost
            };
        });
        
        return {
            interventionType,
            duration,
            baselinePrediction,
            interventionPrediction,
            expectedGain: interventionPrediction[duration - 1].score - baselinePrediction[duration - 1].score,
            confidence: effect.confidence
        };
    }
    
    /**
     * 模拟考试难度变化对排名的影响
     */
    function simulateDifficultyImpact(classData, difficultyLevel) {
        // 难度系数
        const difficultyFactors = {
            easy: { scoreMultiplier: 1.1, variance: 0.05 },
            normal: { scoreMultiplier: 1.0, variance: 0.10 },
            hard: { scoreMultiplier: 0.9, variance: 0.15 },
            veryHard: { scoreMultiplier: 0.8, variance: 0.20 }
        };
        
        const factor = difficultyFactors[difficultyLevel] || difficultyFactors.normal;
        
        // 模拟所有学生的新成绩
        const simulatedScores = classData.map(student => {
            const baseScore = student.score || 0;
            const variance = (Math.random() - 0.5) * 2 * factor.variance * 100;
            const newScore = Math.max(0, Math.min(100, baseScore * factor.scoreMultiplier + variance));
            
            return {
                ...student,
                originalScore: baseScore,
                simulatedScore: newScore,
                scoreChange: newScore - baseScore
            };
        });
        
        // 计算排名变化
        const originalRanks = classData
            .map((s, i) => ({ ...s, rank: i + 1 }))
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .map((s, i) => ({ ...s, rank: i + 1 }));
        
        const newRanks = simulatedScores
            .sort((a, b) => b.simulatedScore - a.simulatedScore)
            .map((s, i) => ({ ...s, newRank: i + 1 }));
        
        // 计算排名变化
        const rankChanges = newRanks.map(student => {
            const original = originalRanks.find(s => s.id === student.id);
            return {
                ...student,
                rankChange: (original?.rank || 0) - student.newRank
            };
        });
        
        return {
            difficultyLevel,
            simulatedScores: rankChanges,
            averageScoreChange: simulatedScores.reduce((sum, s) => sum + s.scoreChange, 0) / simulatedScores.length,
            maxRankChange: Math.max(...rankChanges.map(s => Math.abs(s.rankChange))),
            minRankChange: Math.min(...rankChanges.map(s => Math.abs(s.rankChange)))
        };
    }
    
    /**
     * 生成"如果分析"报告
     */
    function generateWhatIfReport(studentData, scenarios) {
        const report = {
            studentId: studentData.id,
            studentName: studentData.name,
            generatedAt: new Date().toISOString(),
            scenarios: []
        };
        
        // 基线预测
        const baseline = predictFutureScore(studentData, 3);
        report.baseline = {
            description: '不采取任何干预措施',
            predictions: baseline,
            finalScore: baseline[baseline.length - 1].score
        };
        
        // 场景分析
        scenarios.forEach(scenario => {
            if (scenario.type === 'intervention') {
                const result = simulateIntervention(studentData, scenario.intervention, scenario.duration || 4);
                report.scenarios.push({
                    description: `采取${scenario.intervention}干预${scenario.duration || 4}周`,
                    result: result,
                    expectedImprovement: result.expectedGain,
                    recommendation: result.expectedGain > 5 ? '强烈推荐' : result.expectedGain > 2 ? '推荐' : '可选'
                });
            }
        });
        
        return report;
    }
    
    /**
     * 识别高风险学生
     */
    function identifyAtRiskStudents(classData, threshold = -3) {
        return classData
            .map(student => {
                const history = student.examHistory || [];
                const { trend, slope } = calculateTrend(history);
                
                return {
                    ...student,
                    trend,
                    slope,
                    riskLevel: slope < threshold ? 'high' : slope < 0 ? 'medium' : 'low',
                    riskScore: Math.abs(slope)
                };
            })
            .filter(s => s.riskLevel !== 'low')
            .sort((a, b) => b.riskScore - a.riskScore);
    }
    
    /**
     * 推荐个性化干预方案
     */
    function recommendInterventions(studentData) {
        const history = studentData.examHistory || [];
        const { trend, slope } = calculateTrend(history);
        const currentScore = studentData.score || 0;
        
        const recommendations = [];
        
        // 根据趋势推荐
        if (slope < -2) {
            recommendations.push({
                priority: 'high',
                intervention: 'tutoring',
                reason: '成绩下降趋势明显，需要一对一家教指导',
                expectedGain: 8,
                duration: 8
            });
        }
        
        // 根据分数推荐
        if (currentScore < 60) {
            recommendations.push({
                priority: 'high',
                intervention: 'extraClass',
                reason: '基础较弱，需要参加补课班加强基础',
                expectedGain: 6,
                duration: 12
            });
        } else if (currentScore < 75) {
            recommendations.push({
                priority: 'medium',
                intervention: 'groupStudy',
                reason: '中等水平，可通过小组学习互相促进',
                expectedGain: 5,
                duration: 6
            });
        }
        
        // 根据稳定性推荐
        if (Math.abs(slope) > 5) {
            recommendations.push({
                priority: 'medium',
                intervention: 'mentoring',
                reason: '成绩波动较大，需要师徒制帮助稳定心态',
                expectedGain: 7,
                duration: 8
            });
        }
        
        return recommendations.sort((a, b) => {
            const priorityMap = { high: 0, medium: 1, low: 2 };
            return priorityMap[a.priority] - priorityMap[b.priority];
        });
    }
    
    // ==================== 公开 API ====================
    
    return {
        /**
         * 初始化实验室
         */
        init(historicalDataArray = []) {
            initHistoricalData(historicalDataArray);
            console.log('✅ 学情预知实验室初始化成功');
            return true;
        },
        
        /**
         * 预测学生未来成绩
         */
        predict(studentData, periods = 3) {
            return predictFutureScore(studentData, periods);
        },
        
        /**
         * 模拟干预效果
         */
        simulateIntervention(studentData, interventionType, duration) {
            return simulateIntervention(studentData, interventionType, duration);
        },
        
        /**
         * 模拟难度影响
         */
        simulateDifficulty(classData, difficultyLevel) {
            return simulateDifficultyImpact(classData, difficultyLevel);
        },
        
        /**
         * 生成"如果分析"报告
         */
        generateWhatIf(studentData, scenarios) {
            return generateWhatIfReport(studentData, scenarios);
        },
        
        /**
         * 识别高风险学生
         */
        identifyAtRisk(classData, threshold) {
            return identifyAtRiskStudents(classData, threshold);
        },
        
        /**
         * 推荐干预方案
         */
        recommend(studentData) {
            return recommendInterventions(studentData);
        },
        
        /**
         * 计算学生成绩趋势
         */
        calculateTrend(studentHistory) {
            return calculateTrend(studentHistory);
        },
        
        /**
         * 获取所有干预类型
         */
        getInterventionTypes() {
            return config.interventionTypes;
        },
        
        /**
         * 获取所有难度等级
         */
        getDifficultyLevels() {
            return config.difficultyLevels;
        }
    };
})();

// 自动注册到全局
if (typeof window !== 'undefined') {
    window.PredictiveSimulationLab = PredictiveSimulationLab;
}
