/**
 * 🟢 图表联动与交互模块
 * 用途：实现图表之间的联动，支持点击下钻和多维数据探索
 * 
 * 功能：
 * 1. 点击雷达图的学科，下方自动显示该学科的历次成绩趋势
 * 2. 点击柱状图的柱子，显示详细的分数分布
 * 3. 支持多个图表的同步交互
 */

const ChartInteractivity = {
    // 已初始化的图表实例
    charts: new Map(),

    // 当前选中的维度
    selectedDimension: null,

    /**
     * 注册一个图表实例
     * @param {String} chartId - 图表容器 ID
     * @param {Object} chartInstance - Chart.js 图表实例
     * @param {Object} options - 配置选项
     */
    registerChart(chartId, chartInstance, options = {}) {
        if (!chartInstance) {
            console.warn(`⚠️ 图表实例为空: ${chartId}`);
            return;
        }

        this.charts.set(chartId, {
            instance: chartInstance,
            options: options,
            data: chartInstance.data,
            originalData: JSON.parse(JSON.stringify(chartInstance.data))
        });

        // 添加点击事件监听
        this._attachClickListener(chartId, chartInstance);

        console.log(`✅ 图表已注册: ${chartId}`);
    },

    /**
     * 为图表添加点击事件监听
     * @private
     */
    _attachClickListener(chartId, chartInstance) {
        const canvas = chartInstance.canvas;

        canvas.addEventListener('click', (event) => {
            const points = chartInstance.getElementsAtEventForMode(
                event,
                'nearest',
                { intersect: true },
                true
            );

            if (points.length > 0) {
                const point = points[0];
                const label = chartInstance.data.labels[point.index];
                const value = chartInstance.data.datasets[point.datasetIndex].data[point.index];

                console.log(`📊 点击了: ${label} (值: ${value})`);

                // 触发自定义事件
                this._triggerInteraction(chartId, {
                    label: label,
                    value: value,
                    index: point.index,
                    datasetIndex: point.datasetIndex
                });
            }
        });
    },

    /**
     * 触发图表交互事件
     * @private
     */
    _triggerInteraction(sourceChartId, data) {
        const event = new CustomEvent('chartInteraction', {
            detail: {
                sourceChart: sourceChartId,
                selectedLabel: data.label,
                selectedValue: data.value,
                selectedIndex: data.index
            }
        });

        document.dispatchEvent(event);

        // 更新其他相关图表
        this._updateRelatedCharts(sourceChartId, data);
    },

    /**
     * 更新相关的图表
     * @private
     */
    _updateRelatedCharts(sourceChartId, data) {
        // 遍历所有已注册的图表
        for (const [chartId, chartData] of this.charts.entries()) {
            if (chartId === sourceChartId) continue;

            // 根据配置决定是否更新此图表
            if (chartData.options.linkedTo && chartData.options.linkedTo.includes(sourceChartId)) {
                this._highlightRelatedData(chartId, data.label);
            }
        }
    },

    /**
     * 高亮相关的数据
     * @private
     */
    _highlightRelatedData(chartId, label) {
        const chartData = this.charts.get(chartId);
        if (!chartData) return;

        const chart = chartData.instance;
        const matchingIndex = chart.data.labels.indexOf(label);

        if (matchingIndex !== -1) {
            // 高亮匹配的数据点
            chart.data.datasets.forEach(dataset => {
                if (!dataset.backgroundColor) {
                    dataset.backgroundColor = [];
                }
                dataset.backgroundColor[matchingIndex] = '#ff6b6b';
            });

            chart.update('none');
        }
    },

    /**
     * 重置所有图表的高亮状态
     */
    resetHighlight() {
        for (const [chartId, chartData] of this.charts.entries()) {
            const chart = chartData.instance;
            chart.data = JSON.parse(JSON.stringify(chartData.originalData));
            chart.update();
        }
        this.selectedDimension = null;
    },

    /**
     * 创建学科成绩趋势图（用于下钻）
     * @param {String} containerId - 容器 ID
     * @param {String} subject - 学科名称
     * @param {Array} historyData - 历史数据
     */
    createSubjectTrendChart(containerId, subject, historyData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 提取该学科的历次成绩
        const labels = [];
        const scores = [];

        historyData.forEach(record => {
            const examLabel = record.examId || record.examLabel || '未知考试';
            const score = record.student?.scores?.[subject] || record.scores?.[subject];

            if (typeof score === 'number') {
                labels.push(examLabel);
                scores.push(score);
            }
        });

        if (scores.length === 0) {
            container.innerHTML = `<p style="text-align: center; color: #999;">暂无 ${subject} 的历史数据</p>`;
            return;
        }

        // 创建 Canvas
        const canvas = document.createElement('canvas');
        container.innerHTML = '';
        container.appendChild(canvas);

        // 使用 Chart.js 绘制折线图
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js 未加载');
            return;
        }

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `${subject} 成绩趋势`,
                    data: scores,
                    borderColor: '#2563eb',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointBackgroundColor: '#2563eb',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    title: {
                        display: true,
                        text: `${subject} 历次成绩趋势`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 150,
                        ticks: {
                            callback: function(value) {
                                return value + '分';
                            }
                        }
                    }
                }
            }
        });

        // 注册此图表
        this.registerChart(`${subject}-trend`, chart, { type: 'trend' });
    },

    /**
     * 创建学科分布柱状图（用于下钻）
     * @param {String} containerId - 容器 ID
     * @param {String} subject - 学科名称
     * @param {Array} allStudentsData - 全班学生数据
     */
    createSubjectDistributionChart(containerId, subject, allStudentsData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // 统计分数分布
        const distribution = {};
        allStudentsData.forEach(student => {
            const score = student.scores?.[subject];
            if (typeof score === 'number') {
                const bucket = Math.floor(score / 10) * 10;
                distribution[bucket] = (distribution[bucket] || 0) + 1;
            }
        });

        const labels = Object.keys(distribution).sort((a, b) => a - b).map(k => `${k}-${k + 9}`);
        const data = Object.keys(distribution).sort((a, b) => a - b).map(k => distribution[k]);

        // 创建 Canvas
        const canvas = document.createElement('canvas');
        container.innerHTML = '';
        container.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: `${subject} 分数分布`,
                    data: data,
                    backgroundColor: '#16a34a',
                    borderColor: '#15803d',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: `${subject} 班级分数分布`
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value + '人';
                            }
                        }
                    }
                }
            }
        });

        this.registerChart(`${subject}-distribution`, chart, { type: 'distribution' });
    },

    /**
     * 获取已注册的所有图表
     */
    getRegisteredCharts() {
        return Array.from(this.charts.keys());
    },

    /**
     * 销毁指定图表
     */
    destroyChart(chartId) {
        const chartData = this.charts.get(chartId);
        if (chartData) {
            chartData.instance.destroy();
            this.charts.delete(chartId);
            console.log(`✅ 图表已销毁: ${chartId}`);
        }
    }
};

// 导出到全局作用域
window.ChartInteractivity = ChartInteractivity;

// 监听图表交互事件
document.addEventListener('chartInteraction', (event) => {
    console.log('📊 图表交互事件:', event.detail);
});
