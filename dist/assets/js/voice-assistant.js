/**
 * 🟢 智能语音交互助手 (Voice Assistant)
 * 用途：支持教师通过语音指令查询成绩、控制大屏、播报异常数据
 * 
 * 功能：
 * 1. 语音识别：将语音转文本，支持中文和英文
 * 2. 意图识别：理解教师的查询意图（查成绩、查排名、查对比等）
 * 3. 语音播报：将查询结果转为语音播放
 * 4. 指令控制：支持语音控制系统功能（全屏、脱敏、刷新等）
 */

const VoiceAssistant = {
    // 配置
    config: {
        enabled: true,
        language: 'zh-CN',                 // 语言：'zh-CN' 或 'en-US'
        recognition: null,                 // 语音识别实例
        synthesis: null,                   // 语音合成实例
        autoStart: false,                  // 页面加载时自动启动
        feedbackVolume: 0.5,               // 反馈音量（0-1）
        recognitionTimeout: 10000          // 识别超时（ms）
    },

    // 状态
    state: {
        isListening: false,
        isProcessing: false,
        lastQuery: null,
        lastResult: null
    },

    // 意图匹配规则
    intents: {
        queryScore: {
            patterns: ['查.*成绩', '查.*分数', '查.*总分', 'query.*score', 'check.*grade'],
            action: 'queryStudentScore'
        },
        queryRanking: {
            patterns: ['查.*排名', '查.*排位', 'query.*ranking', 'check.*rank'],
            action: 'queryStudentRanking'
        },
        queryComparison: {
            patterns: ['对比.*', '比较.*', 'compare.*', 'contrast.*'],
            action: 'queryComparison'
        },
        toggleFullscreen: {
            patterns: ['全屏', '全屏模式', 'fullscreen', 'full screen'],
            action: 'toggleFullscreen'
        },
        toggleAnonymize: {
            patterns: ['脱敏', '隐私模式', '匿名', 'anonymize', 'privacy'],
            action: 'toggleAnonymize'
        },
        refreshData: {
            patterns: ['刷新', '更新', '重新加载', 'refresh', 'reload'],
            action: 'refreshData'
        },
        help: {
            patterns: ['帮助', '说明', '指令', 'help', 'command'],
            action: 'showHelp'
        }
    },

    /**
     * 初始化语音助手
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };

        // 初始化语音识别
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.config.recognition = new SpeechRecognition();
            this._setupRecognition();
        } else {
            console.warn('⚠️ 浏览器不支持语音识别');
        }

        // 初始化语音合成
        this.config.synthesis = window.speechSynthesis;

        // 如果启用自动启动，则在页面加载后启动
        if (this.config.autoStart) {
            this.start();
        }

        console.log('✅ 语音助手已初始化');
    },

    /**
     * 启动语音识别
     */
    start() {
        if (!this.config.recognition) {
            console.warn('⚠️ 语音识别不可用');
            return;
        }

        if (this.state.isListening) {
            console.warn('⚠️ 语音识别已在进行中');
            return;
        }

        this.state.isListening = true;
        this.config.recognition.start();

        console.log('🎤 语音识别已启动，请说话...');
        this._playFeedback('listening');
    },

    /**
     * 停止语音识别
     */
    stop() {
        if (this.config.recognition) {
            this.config.recognition.stop();
        }

        this.state.isListening = false;
        console.log('🛑 语音识别已停止');
    },

    /**
     * 设置语音识别
     * @private
     */
    _setupRecognition() {
        const recognition = this.config.recognition;

        recognition.language = this.config.language;
        recognition.continuous = false;
        recognition.interimResults = true;

        // 识别成功
        recognition.onresult = (event) => {
            let transcript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const isFinal = event.results[i].isFinal;
                transcript += event.results[i][0].transcript;

                if (isFinal) {
                    this._processQuery(transcript);
                }
            }

            console.log(`🗣️ 识别结果: ${transcript}`);
        };

        // 识别错误
        recognition.onerror = (event) => {
            console.error('❌ 语音识别错误:', event.error);
            this._playFeedback('error');
        };

        // 识别结束
        recognition.onend = () => {
            this.state.isListening = false;
            console.log('🛑 语音识别已结束');
        };
    },

    /**
     * 处理查询
     * @private
     */
    _processQuery(query) {
        this.state.lastQuery = query;
        this.state.isProcessing = true;

        console.log(`📝 处理查询: ${query}`);

        // 识别意图
        const intent = this._recognizeIntent(query);

        if (intent) {
            console.log(`💡 识别意图: ${intent.action}`);
            this._executeAction(intent.action, query);
        } else {
            console.log('❌ 无法识别意图');
            this.speak('抱歉，我没有理解您的意思。请重新说一遍。');
        }

        this.state.isProcessing = false;
    },

    /**
     * 识别意图
     * @private
     */
    _recognizeIntent(query) {
        for (const [intentName, intentConfig] of Object.entries(this.intents)) {
            for (const pattern of intentConfig.patterns) {
                const regex = new RegExp(pattern, 'i');
                if (regex.test(query)) {
                    return intentConfig;
                }
            }
        }

        return null;
    },

    /**
     * 执行动作
     * @private
     */
    _executeAction(action, query) {
        switch (action) {
            case 'queryStudentScore':
                this._queryStudentScore(query);
                break;
            case 'queryStudentRanking':
                this._queryStudentRanking(query);
                break;
            case 'queryComparison':
                this._queryComparison(query);
                break;
            case 'toggleFullscreen':
                this._toggleFullscreen();
                break;
            case 'toggleAnonymize':
                this._toggleAnonymize();
                break;
            case 'refreshData':
                this._refreshData();
                break;
            case 'showHelp':
                this._showHelp();
                break;
            default:
                console.warn(`⚠️ 未知的动作: ${action}`);
        }
    },

    /**
     * 查询学生成绩
     * @private
     */
    _queryStudentScore(query) {
        // 从查询中提取学生名字
        const nameMatch = query.match(/查.*?([A-Za-z\u4e00-\u9fa5]{2,4}).*?成绩/);
        if (!nameMatch) {
            this.speak('请告诉我学生的名字。');
            return;
        }

        const studentName = nameMatch[1];
        const students = window.RAW_DATA || [];
        const student = students.find(s => s.name.includes(studentName));

        if (student) {
            const message = `${student.name}的总分是${student.total}分，班级排名第${student.ranks?.total?.class || '未知'}名。`;
            this.speak(message);
            this.state.lastResult = student;
        } else {
            this.speak(`找不到学生${studentName}的信息。`);
        }
    },

    /**
     * 查询学生排名
     * @private
     */
    _queryStudentRanking(query) {
        const nameMatch = query.match(/查.*?([A-Za-z\u4e00-\u9fa5]{2,4}).*?排名/);
        if (!nameMatch) {
            this.speak('请告诉我学生的名字。');
            return;
        }

        const studentName = nameMatch[1];
        const students = window.RAW_DATA || [];
        const student = students.find(s => s.name.includes(studentName));

        if (student) {
            const classRank = student.ranks?.total?.class || '未知';
            const schoolRank = student.ranks?.total?.school || '未知';
            const message = `${student.name}在班级排名第${classRank}名，在学校排名第${schoolRank}名。`;
            this.speak(message);
            this.state.lastResult = student;
        } else {
            this.speak(`找不到学生${studentName}的排名信息。`);
        }
    },

    /**
     * 查询对比数据
     * @private
     */
    _queryComparison(query) {
        if (window.ComparisonEngineV2) {
            const result = window.ComparisonEngineV2.compareClasses(['高一1班', '高一2班']);
            if (result) {
                const topClass = result.ranking[0];
                const message = `${topClass.className}平均分最高，为${topClass.avgScore.toFixed(2)}分。`;
                this.speak(message);
                this.state.lastResult = result;
            }
        }
    },

    /**
     * 切换全屏
     * @private
     */
    _toggleFullscreen() {
        if (window.AdminDashboard) {
            if (document.fullscreenElement) {
                window.AdminDashboard.exitFullscreen();
                this.speak('已退出全屏模式。');
            } else {
                window.AdminDashboard.enterFullscreen();
                this.speak('已进入全屏模式。');
            }
        }
    },

    /**
     * 切换脱敏模式
     * @private
     */
    _toggleAnonymize() {
        if (window.DataAnonymizer) {
            if (window.DataAnonymizer.config.enabled) {
                window.DataAnonymizer.disable();
                this.speak('已禁用脱敏模式。');
            } else {
                window.DataAnonymizer.enable();
                this.speak('已启用脱敏模式，所有学生信息已隐藏。');
            }
        }
    },

    /**
     * 刷新数据
     * @private
     */
    _refreshData() {
        if (window.AdminDashboard) {
            window.AdminDashboard.refreshData();
            this.speak('数据已刷新。');
        }
    },

    /**
     * 显示帮助
     * @private
     */
    _showHelp() {
        const helpText = `
            我是您的语音助手。您可以说：
            查询成绩：查张三的成绩
            查询排名：查李四的排名
            对比分析：对比班级成绩
            全屏模式：全屏
            脱敏模式：脱敏
            刷新数据：刷新
        `;
        this.speak('我可以帮您查询成绩、排名、对比数据，以及控制系统功能。');
    },

    /**
     * 语音播报
     * @param {String} text - 要播报的文本
     */
    speak(text) {
        if (!this.config.synthesis) {
            console.warn('⚠️ 语音合成不可用');
            return;
        }

        // 取消之前的播报
        this.config.synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.language = this.config.language;
        utterance.volume = this.config.feedbackVolume;

        this.config.synthesis.speak(utterance);

        console.log(`🔊 播报: ${text}`);
    },

    /**
     * 播放反馈音
     * @private
     */
    _playFeedback(type) {
        // 使用 Web Audio API 播放简单的反馈音
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            if (type === 'listening') {
                oscillator.frequency.value = 800;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } else if (type === 'error') {
                oscillator.frequency.value = 300;
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            }
        } catch (error) {
            console.warn('⚠️ 无法播放反馈音:', error);
        }
    },

    /**
     * 获取状态
     */
    getStatus() {
        return {
            enabled: this.config.enabled,
            isListening: this.state.isListening,
            isProcessing: this.state.isProcessing,
            lastQuery: this.state.lastQuery,
            language: this.config.language
        };
    }
};

// 导出到全局作用域
window.VoiceAssistant = VoiceAssistant;

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        VoiceAssistant.init();
    });
} else {
    VoiceAssistant.init();
}
