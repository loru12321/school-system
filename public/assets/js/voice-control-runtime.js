(() => {
    if (typeof window === 'undefined' || window.__VOICE_CONTROL_RUNTIME_PATCHED__) return;

// ================== 语音控制系统 (Web Speech API) ==================
const VoiceControl = {
    recognition: null,
    isListening: false,
    hud: null,
    statusEl: null,
    resultEl: null,
    fab: null,

    // 指令映射表 (模糊匹配)
    commands: [
        { keywords: ['总榜', '总排名', '综合排名', '全科'], action: () => switchTab('summary') },
        { keywords: ['两率一分', '横向', '宏观'], action: () => switchTab('analysis') },
        { keywords: ['教师', '老师', '教学'], action: () => switchTab('teacher-analysis') },
        { keywords: ['指标', '达标'], action: () => switchTab('indicator') },
        { keywords: ['后进', '后1/3', '三分之一'], action: () => switchTab('bottom3') },
        { keywords: ['进退', '进步', '退步', '追踪'], action: () => switchTab('progress-analysis') },
        { keywords: ['临界', '边缘'], action: () => switchTab('marginal-push') },
        { keywords: ['考场', '监考'], action: () => switchTab('exam-arranger') },
        { keywords: ['分班', '新生'], action: () => switchTab('freshman-simulator') },
        { keywords: ['全屏', '大屏'], action: () => VoiceControl.toggleFullScreen(true) },
        { keywords: ['退出全屏', '普通', '恢复'], action: () => VoiceControl.toggleFullScreen(false) },
        { keywords: ['关闭', '退出', '停止'], action: () => VoiceControl.stop() }
    ],

    init: function () {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            window.UI.alert("您的浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器。");
            document.getElementById('voice-fab').style.display = 'none';
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.continuous = true; // 连续监听
        this.recognition.interimResults = true; // 实时反馈
        this.recognition.lang = 'zh-CN';

        this.hud = document.getElementById('voice-hud');
        this.statusEl = document.getElementById('voice-status');
        this.resultEl = document.getElementById('voice-result');
        this.fab = document.getElementById('voice-fab');

        // 绑定事件
        this.recognition.onstart = () => {
            this.isListening = true;
            this.fab.classList.add('listening');
            this.hud.classList.add('active');
            this.statusEl.innerText = "正在聆听...";
            this.statusEl.style.color = "white";
        };

        this.recognition.onend = () => {
            // 如果非手动停止，且原本是开启状态，则自动重启（保持常驻）
            if (this.isListening) {
                try { this.recognition.start(); } catch (e) { }
            } else {
                this.fab.classList.remove('listening');
                this.hud.classList.remove('active');
            }
        };

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (interimTranscript) {
                this.statusEl.innerText = interimTranscript;
                this.statusEl.style.color = "#38bdf8"; // 蓝色表示正在输入
            }

            if (finalTranscript) {
                console.log("语音指令:", finalTranscript);
                this.statusEl.innerText = finalTranscript;
                this.statusEl.style.color = "#4ade80"; // 绿色表示已确认
                this.processCommand(finalTranscript);
            }
        };

        this.recognition.onerror = (event) => {
            console.error("语音识别错误", event.error);
            if (event.error === 'not-allowed') {
                window.UI.alert("无法访问麦克风，请检查浏览器权限。");
                this.stop();
            }
        };
    },

    toggle: function () {
        if (!this.recognition) this.init();
        if (!this.recognition) return;

        if (this.isListening) {
            this.stop();
        } else {
            this.isListening = true;
            this.recognition.start();
        }
    },

    stop: function () {
        this.isListening = false;
        if (this.recognition) this.recognition.stop();
        this.fab.classList.remove('listening');
        this.hud.classList.remove('active');
    },

    processCommand: function (text) {
        text = text.replace(/。|？|！/g, ''); // 去标点

        // 1. 匹配预设指令
        const matchedCmd = this.commands.find(cmd =>
            cmd.keywords.some(key => text.includes(key))
        );

        if (matchedCmd) {
            this.resultEl.innerText = "✅ 执行指令...";
            setTimeout(() => {
                matchedCmd.action();
                // 执行后不关闭HUD，方便连续下达指令
                // 如果希望执行后关闭，取消下面注释
                // this.stop();
            }, 500);
            return;
        }

        // 2. 特殊指令：搜索学生/学校
        if (text.includes("搜索") || text.includes("查询") || text.includes("查找")) {
            const keyword = text.replace(/搜索|查询|查找/g, '').trim();
            if (keyword) {
                this.resultEl.innerText = `🔍 正在搜索 "${keyword}"...`;
                this.stop(); // 搜索需要跳转弹窗，关闭 HUD
                openSpotlight();
                const input = document.getElementById('spotlight-input');
                input.value = keyword;
                // 触发 input 事件以运行搜索
                input.dispatchEvent(new Event('input'));
            }
            return;
        }

        // 3. 特殊指令：切换本校
        if (text.startsWith("本校") || text.includes("切换到")) {
            const keyword = text.replace(/本校|切换到/g, '').trim();
            // 在 SCHOOLS 中模糊匹配
            const targetSchool = Object.keys(SCHOOLS).find(s => s.includes(keyword));
            if (targetSchool) {
                this.resultEl.innerText = `🏫 切换本校为：${targetSchool}`;
                document.getElementById('mySchoolSelect').value = targetSchool;
                // 触发 change
                document.getElementById('mySchoolSelect').dispatchEvent(new Event('change'));

                // 如果在教师分析页，重刷数据
                if (document.getElementById('teacher-analysis').classList.contains('active')) {
                    analyzeTeachers();
                }
            } else {
                this.resultEl.innerText = `❌ 未找到学校：${keyword}`;
            }
            return;
        }

        this.resultEl.innerText = "🤔 未识别的指令，请重试";
    },

    // 大屏沉浸模式 (隐藏 Header 和 导航)
    toggleFullScreen: function (enable) {
        const header = document.querySelector('header');
        const nav = document.querySelector('.nav-wrapper');
        const fab = document.getElementById('voice-fab');

        if (enable) {
            if (header) header.style.display = 'none';
            if (nav) nav.style.display = 'none';
            document.documentElement.requestFullscreen().catch(e => { });
            UI.toast("📺 已进入大屏演示模式", "success");
        } else {
            if (header) header.style.display = 'block';
            if (nav) nav.style.display = 'block';
            if (document.fullscreenElement) document.exitFullscreen().catch(e => { });
            UI.toast("已退出大屏模式");
        }
    }
};

    window.VoiceControl = VoiceControl;
    window.__VOICE_CONTROL_RUNTIME_PATCHED__ = true;
})();
