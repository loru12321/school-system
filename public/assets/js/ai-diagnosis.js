/**
 * 🟢 AI 学情诊断模块
 * 用途：集成 LLM 接口，根据学生的历史成绩趋势和学科均衡度，生成个性化的诊断建议
 * 
 * 支持的 LLM：
 * 1. OpenAI (GPT-4, GPT-3.5)
 * 2. 本地 LLM (通过 API)
 */

const AIDiagnosis = {
    // 配置
    config: {
        apiEndpoint: '/api/ai/diagnose',  // 本地 API 端点
        openaiApiKey: '',                  // OpenAI API Key（从环境变量读取）
        model: 'gpt-3.5-turbo',           // 使用的模型
        maxTokens: 500,                    // 最大 token 数
        temperature: 0.7,                  // 温度（创意度）
        timeout: 10000                     // 超时时间（ms）
    },

    // 缓存诊断结果，避免重复调用
    cache: new Map(),

    /**
     * 初始化 AI 诊断模块
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };
        console.log('✅ AI 诊断模块已初始化');
    },

    /**
     * 生成学生的个性化诊断
     * @param {Object} student - 学生对象
     * @param {Array} historyRecords - 历史成绩记录
     * @returns {Promise<String>} 诊断结果
     */
    async generateDiagnosis(student, historyRecords = []) {
        if (!student || !student.name) {
            return '无法生成诊断：学生信息不完整';
        }

        // 检查缓存
        const cacheKey = `${student.name}_${student.class}`;
        if (this.cache.has(cacheKey)) {
            console.log(`✅ 从缓存读取诊断: ${cacheKey}`);
            return this.cache.get(cacheKey);
        }

        try {
            // 构建诊断上下文
            const context = this._buildContext(student, historyRecords);

            // 调用 LLM
            const diagnosis = await this._callLLM(context);

            // 缓存结果
            this.cache.set(cacheKey, diagnosis);

            return diagnosis;
        } catch (error) {
            console.error('❌ AI 诊断失败:', error);
            return `诊断生成失败: ${error.message}`;
        }
    },

    /**
     * 构建诊断上下文
     * @private
     */
    _buildContext(student, historyRecords) {
        // 计算学科均衡度
        const subjectStats = this._analyzeSubjects(student);

        // 分析历史趋势
        const trendAnalysis = this._analyzeTrend(student, historyRecords);

        return {
            studentName: student.name,
            studentClass: student.class,
            currentScore: student.total,
            currentRank: student.ranks?.total?.school || '-',
            subjects: subjectStats,
            trend: trendAnalysis,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * 分析学科成绩
     * @private
     */
    _analyzeSubjects(student) {
        if (!student.scores) return {};

        const subjects = {};
        for (const [subject, score] of Object.entries(student.scores)) {
            if (typeof score === 'number') {
                subjects[subject] = {
                    score: score,
                    rank: student.ranks?.[subject]?.school || '-'
                };
            }
        }
        return subjects;
    },

    /**
     * 分析成绩趋势
     * @private
     */
    _analyzeTrend(student, historyRecords) {
        if (!Array.isArray(historyRecords) || historyRecords.length === 0) {
            return { status: '无历史数据' };
        }

        // 按时间排序
        const sorted = historyRecords.sort((a, b) => {
            const timeA = new Date(a.student?.updatedAt || a.updatedAt || 0);
            const timeB = new Date(b.student?.updatedAt || b.updatedAt || 0);
            return timeA - timeB;
        });

        const latestHistory = sorted[sorted.length - 1];
        const previousScore = latestHistory.student?.total || 0;
        const currentScore = student.total || 0;
        const scoreDiff = currentScore - previousScore;

        return {
            previousScore: previousScore,
            currentScore: currentScore,
            change: scoreDiff,
            trend: scoreDiff > 5 ? '上升' : scoreDiff < -5 ? '下降' : '稳定',
            periods: sorted.length
        };
    },

    /**
     * 调用 LLM API
     * @private
     */
    async _callLLM(context) {
        const prompt = this._buildPrompt(context);

        // 尝试调用本地 API
        try {
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: prompt,
                    model: this.config.model,
                    maxTokens: this.config.maxTokens,
                    temperature: this.config.temperature
                }),
                timeout: this.config.timeout
            });

            if (response.ok) {
                const data = await response.json();
                return data.diagnosis || data.result || '诊断生成失败';
            }
        } catch (error) {
            console.warn('⚠️ 本地 API 调用失败，尝试 OpenAI:', error);
        }

        // 回退到 OpenAI API
        if (this.config.openaiApiKey) {
            return await this._callOpenAI(prompt);
        }

        throw new Error('未配置 LLM 接口');
    },

    /**
     * 调用 OpenAI API
     * @private
     */
    async _callOpenAI(prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.openaiApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一位资深的教育诊断专家，根据学生的成绩数据提供个性化的学习建议。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API 错误: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '诊断生成失败';
    },

    /**
     * 构建 LLM 提示词
     * @private
     */
    _buildPrompt(context) {
        const { studentName, studentClass, currentScore, currentRank, subjects, trend } = context;

        let prompt = `请为以下学生生成个性化的学情诊断和学习建议：

学生信息：
- 姓名: ${studentName}
- 班级: ${studentClass}
- 当前总分: ${currentScore}
- 校内排名: ${currentRank}

学科成绩：
${Object.entries(subjects).map(([sub, data]) => `  - ${sub}: ${data.score}分 (校排: ${data.rank})`).join('\n')}

成绩趋势：
- 状态: ${trend.trend}
- 上次成绩: ${trend.previousScore}
- 本次成绩: ${trend.currentScore}
- 变化: ${trend.change > 0 ? '+' : ''}${trend.change}分
- 历史记录: ${trend.periods}期

请提供：
1. 学生的优势和劣势分析
2. 针对性的学习建议（3-5条）
3. 家长配合建议
4. 预期目标和时间规划

回答要简洁、具体、可操作。`;

        return prompt;
    },

    /**
     * 清空缓存
     */
    clearCache() {
        this.cache.clear();
        console.log('✅ AI 诊断缓存已清空');
    },

    /**
     * 获取缓存统计
     */
    getCacheStats() {
        return {
            cachedDiagnoses: this.cache.size,
            cacheSize: `${(this.cache.size * 2).toFixed(2)} KB (估计)`
        };
    }
};

// 导出到全局作用域
window.AIDiagnosis = AIDiagnosis;

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AIDiagnosis.init();
    });
} else {
    AIDiagnosis.init();
}
