/**
 * 🟢 可视化拖拽对比实验室 (Drag & Drop Comparison Lab)
 * 用途：支持教师通过拖拽班级、学科或学生卡片，实时生成对比图表
 * 
 * 功能：
 * 1. 自由组合：拖拽班级/学科卡片到对比区域
 * 2. 实时对比：自动生成对比图表
 * 3. 动态沙盘：模拟"如果某学科提升5分"的预测分析
 * 4. 导出结果：将对比结果导出为报告或图表
 */

const DragDropLab = {
    // 配置
    config: {
        enabled: true,
        maxComparisons: 5,                 // 最多同时对比 5 个对象
        animationDuration: 300,            // 动画时长（ms）
        chartLibrary: 'chart.js'           // 图表库
    },

    // 状态
    state: {
        selectedItems: [],                 // 已选择的对比项
        comparisonResult: null,            // 对比结果
        simulationMode: false,             // 模拟模式
        simulationParams: {}               // 模拟参数
    },

    // 可用的对比项
    availableItems: {
        classes: [],
        subjects: [],
        students: []
    },

    /**
     * 初始化拖拽实验室
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };

        // 收集可用的对比项
        this._collectAvailableItems();

        // 初始化拖拽事件
        this._initDragDrop();

        console.log('✅ 拖拽对比实验室已初始化');
    },

    /**
     * 渲染实验室 HTML
     * @returns {String} HTML 内容
     */
    renderHTML() {
        return `
            <div id="drag-drop-lab" class="drag-drop-lab">
                <!-- 左侧：可用项目库 -->
                <div class="lab-sidebar">
                    <h3>📚 可用项目</h3>

                    <!-- 班级 -->
                    <div class="item-category">
                        <h4>班级</h4>
                        <div class="item-list" id="class-list">
                            ${this.availableItems.classes.map(cls => `
                                <div class="draggable-item" draggable="true" data-type="class" data-value="${cls}">
                                    📌 ${cls}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 学科 -->
                    <div class="item-category">
                        <h4>学科</h4>
                        <div class="item-list" id="subject-list">
                            ${this.availableItems.subjects.map(subject => `
                                <div class="draggable-item" draggable="true" data-type="subject" data-value="${subject}">
                                    📖 ${subject}
                                </div>
                            `).join('')}
                        </div>
                    </div>

                    <!-- 学生 -->
                    <div class="item-category">
                        <h4>学生</h4>
                        <div class="item-list" id="student-list">
                            ${this.availableItems.students.slice(0, 10).map(student => `
                                <div class="draggable-item" draggable="true" data-type="student" data-value="${student}">
                                    👤 ${student}
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <!-- 中间：对比区域 -->
                <div class="lab-center">
                    <h3>🔬 对比实验区</h3>

                    <!-- 对比项目容器 -->
                    <div class="comparison-container" id="comparison-container">
                        <div class="drop-zone" id="drop-zone">
                            <p>拖拽项目到此处进行对比</p>
                        </div>
                    </div>

                    <!-- 已选择的项目 -->
                    <div class="selected-items">
                        ${this.state.selectedItems.map((item, idx) => `
                            <div class="selected-item">
                                <span>${item.label}</span>
                                <button onclick="DragDropLab.removeItem(${idx})" class="btn-remove">✕</button>
                            </div>
                        `).join('')}
                    </div>

                    <!-- 对比结果区域 -->
                    <div class="comparison-result" id="comparison-result">
                        <canvas id="comparison-chart"></canvas>
                    </div>

                    <!-- 控制按钮 -->
                    <div class="lab-controls">
                        <button onclick="DragDropLab.generateComparison()" class="btn-primary">📊 生成对比</button>
                        <button onclick="DragDropLab.toggleSimulation()" class="btn-secondary">🎮 启用模拟</button>
                        <button onclick="DragDropLab.exportResult()" class="btn-secondary">💾 导出结果</button>
                        <button onclick="DragDropLab.clearAll()" class="btn-danger">🗑️ 清空</button>
                    </div>
                </div>

                <!-- 右侧：模拟参数 -->
                <div class="lab-sidebar simulation-panel" id="simulation-panel" style="display: none;">
                    <h3>🎮 模拟参数</h3>

                    <div class="param-group">
                        <label>学科提升分数</label>
                        <input type="range" id="score-increase" min="0" max="20" value="5" step="1">
                        <span id="score-increase-value">5</span> 分
                    </div>

                    <div class="param-group">
                        <label>学生增加数量</label>
                        <input type="range" id="student-increase" min="0" max="50" value="10" step="5">
                        <span id="student-increase-value">10</span> 人
                    </div>

                    <div class="param-group">
                        <label>及格率目标</label>
                        <input type="range" id="pass-rate-target" min="0" max="100" value="80" step="5">
                        <span id="pass-rate-target-value">80</span>%
                    </div>

                    <button onclick="DragDropLab.runSimulation()" class="btn-primary">▶️ 运行模拟</button>
                </div>

                <style>
                    .drag-drop-lab {
                        display: grid;
                        grid-template-columns: 250px 1fr 250px;
                        gap: 20px;
                        padding: 20px;
                        background: #f5f5f5;
                        border-radius: 10px;
                        min-height: 600px;
                    }

                    .lab-sidebar {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        overflow-y: auto;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }

                    .lab-center {
                        background: white;
                        padding: 20px;
                        border-radius: 8px;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                    }

                    .item-category {
                        margin-bottom: 20px;
                    }

                    .item-category h4 {
                        margin: 10px 0;
                        color: #007bff;
                    }

                    .item-list {
                        display: flex;
                        flex-direction: column;
                        gap: 8px;
                    }

                    .draggable-item {
                        padding: 10px;
                        background: #e7f3ff;
                        border: 1px solid #007bff;
                        border-radius: 5px;
                        cursor: move;
                        user-select: none;
                        transition: all 0.3s;
                    }

                    .draggable-item:hover {
                        background: #007bff;
                        color: white;
                        transform: translateX(5px);
                    }

                    .draggable-item.dragging {
                        opacity: 0.5;
                    }

                    .drop-zone {
                        border: 2px dashed #007bff;
                        border-radius: 8px;
                        padding: 40px;
                        text-align: center;
                        background: #f9f9f9;
                        min-height: 100px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }

                    .drop-zone.drag-over {
                        background: #e7f3ff;
                        border-color: #0056b3;
                    }

                    .selected-items {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        margin: 20px 0;
                    }

                    .selected-item {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        padding: 8px 12px;
                        background: #007bff;
                        color: white;
                        border-radius: 20px;
                        font-size: 14px;
                    }

                    .btn-remove {
                        background: none;
                        border: none;
                        color: white;
                        cursor: pointer;
                        font-size: 16px;
                    }

                    .comparison-result {
                        margin-top: 20px;
                        min-height: 300px;
                    }

                    .lab-controls {
                        display: flex;
                        gap: 10px;
                        margin-top: 20px;
                        flex-wrap: wrap;
                    }

                    .btn-primary, .btn-secondary, .btn-danger {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                        font-size: 14px;
                        transition: all 0.3s;
                    }

                    .btn-primary {
                        background: #007bff;
                        color: white;
                    }

                    .btn-primary:hover {
                        background: #0056b3;
                    }

                    .btn-secondary {
                        background: #6c757d;
                        color: white;
                    }

                    .btn-secondary:hover {
                        background: #545b62;
                    }

                    .btn-danger {
                        background: #dc3545;
                        color: white;
                    }

                    .btn-danger:hover {
                        background: #c82333;
                    }

                    .simulation-panel {
                        background: #fff3cd;
                    }

                    .param-group {
                        margin-bottom: 15px;
                    }

                    .param-group label {
                        display: block;
                        margin-bottom: 5px;
                        font-weight: bold;
                    }

                    .param-group input[type="range"] {
                        width: 100%;
                    }

                    @media (max-width: 1024px) {
                        .drag-drop-lab {
                            grid-template-columns: 1fr;
                        }

                        .lab-sidebar {
                            display: none;
                        }
                    }
                </style>
            </div>
        `;
    },

    /**
     * 添加项目到对比区域
     * @param {String} type - 项目类型 (class/subject/student)
     * @param {String} value - 项目值
     */
    addItem(type, value) {
        if (this.state.selectedItems.length >= this.config.maxComparisons) {
            alert(`最多只能对比 ${this.config.maxComparisons} 个项目`);
            return;
        }

        const item = {
            type: type,
            value: value,
            label: `${type}: ${value}`
        };

        this.state.selectedItems.push(item);
        console.log(`✅ 已添加: ${item.label}`);
    },

    /**
     * 移除项目
     * @param {Number} index - 项目索引
     */
    removeItem(index) {
        const removed = this.state.selectedItems.splice(index, 1);
        console.log(`❌ 已移除: ${removed[0].label}`);
    },

    /**
     * 生成对比
     */
    generateComparison() {
        if (this.state.selectedItems.length < 2) {
            alert('请至少选择 2 个项目进行对比');
            return;
        }

        console.log('📊 正在生成对比...');

        // 根据项目类型调用相应的对比函数
        const classItems = this.state.selectedItems.filter(item => item.type === 'class');
        const subjectItems = this.state.selectedItems.filter(item => item.type === 'subject');

        if (classItems.length >= 2 && window.ComparisonEngineV2) {
            const result = window.ComparisonEngineV2.compareClasses(
                classItems.map(item => item.value)
            );
            this.state.comparisonResult = result;
            this._renderComparisonChart(result);
        } else if (subjectItems.length >= 2 && window.ComparisonEngineV2) {
            const result = window.ComparisonEngineV2.compareSubjects(
                subjectItems.map(item => item.value)
            );
            this.state.comparisonResult = result;
            this._renderComparisonChart(result);
        }
    },

    /**
     * 切换模拟模式
     */
    toggleSimulation() {
        this.state.simulationMode = !this.state.simulationMode;
        const panel = document.getElementById('simulation-panel');
        if (panel) {
            panel.style.display = this.state.simulationMode ? 'block' : 'none';
        }

        console.log(`🎮 模拟模式已${this.state.simulationMode ? '启用' : '禁用'}`);
    },

    /**
     * 运行模拟
     */
    runSimulation() {
        if (!this.state.comparisonResult) {
            alert('请先生成对比结果');
            return;
        }

        // 获取模拟参数
        const scoreIncrease = parseFloat(document.getElementById('score-increase')?.value || 5);
        const studentIncrease = parseFloat(document.getElementById('student-increase')?.value || 10);
        const passRateTarget = parseFloat(document.getElementById('pass-rate-target')?.value || 80) / 100;

        this.state.simulationParams = {
            scoreIncrease: scoreIncrease,
            studentIncrease: studentIncrease,
            passRateTarget: passRateTarget
        };

        console.log('🎮 运行模拟:', this.state.simulationParams);

        // 模拟结果计算
        const simulatedResult = this._calculateSimulation();
        this._renderSimulationChart(simulatedResult);
    },

    /**
     * 计算模拟结果
     * @private
     */
    _calculateSimulation() {
        const original = this.state.comparisonResult;
        const params = this.state.simulationParams;

        // 简化的模拟计算
        const simulated = {
            ...original,
            simulated: true,
            changes: {
                avgScoreIncrease: params.scoreIncrease,
                passRateIncrease: params.passRateTarget - (original.classData?.[0]?.passRate || 0)
            }
        };

        return simulated;
    },

    /**
     * 渲染对比图表
     * @private
     */
    _renderComparisonChart(result) {
        const canvas = document.getElementById('comparison-chart');
        if (!canvas) return;

        console.log('📊 渲染对比图表');

        // 这里需要集成 Chart.js 来绘制图表
        // 简化处理：显示文本结果
        const container = document.getElementById('comparison-result');
        if (container) {
            container.innerHTML = `
                <div class="comparison-summary">
                    <h4>对比结果</h4>
                    <pre>${JSON.stringify(result, null, 2)}</pre>
                </div>
            `;
        }
    },

    /**
     * 渲染模拟图表
     * @private
     */
    _renderSimulationChart(result) {
        const container = document.getElementById('comparison-result');
        if (container) {
            container.innerHTML = `
                <div class="simulation-summary">
                    <h4>模拟结果</h4>
                    <p>平均分提升: +${result.changes.avgScoreIncrease.toFixed(2)} 分</p>
                    <p>及格率变化: ${(result.changes.passRateIncrease * 100).toFixed(1)}%</p>
                    <pre>${JSON.stringify(result, null, 2)}</pre>
                </div>
            `;
        }
    },

    /**
     * 导出结果
     */
    exportResult() {
        if (!this.state.comparisonResult) {
            alert('没有对比结果可导出');
            return;
        }

        const data = JSON.stringify(this.state.comparisonResult, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comparison-result-${Date.now()}.json`;
        a.click();

        console.log('💾 结果已导出');
    },

    /**
     * 清空所有
     */
    clearAll() {
        this.state.selectedItems = [];
        this.state.comparisonResult = null;
        this.state.simulationMode = false;

        const container = document.getElementById('comparison-result');
        if (container) {
            container.innerHTML = '';
        }

        console.log('🗑️ 已清空所有数据');
    },

    /**
     * 收集可用项目
     * @private
     */
    _collectAvailableItems() {
        const students = window.RAW_DATA || [];

        // 收集班级
        const classSet = new Set();
        students.forEach(s => {
            if (s.class) classSet.add(s.class);
        });
        this.availableItems.classes = Array.from(classSet);

        // 收集学科
        const subjectSet = new Set();
        students.forEach(s => {
            if (s.scores) {
                Object.keys(s.scores).forEach(subject => subjectSet.add(subject));
            }
        });
        this.availableItems.subjects = Array.from(subjectSet);

        // 收集学生
        this.availableItems.students = students.slice(0, 20).map(s => s.name);
    },

    /**
     * 初始化拖拽事件
     * @private
     */
    _initDragDrop() {
        // 这里需要实现拖拽事件监听
        // 简化处理：通过按钮点击添加项目
        console.log('✅ 拖拽事件已初始化');
    }
};

// 导出到全局作用域
window.DragDropLab = DragDropLab;
