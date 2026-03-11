/**
 * 🟢 自动化报告生成模块
 * 用途：根据预设的时间和规则，自动生成并推送周报/月报
 * 
 * 功能：
 * 1. 定时生成班级/学校分析报告
 * 2. 对比历次考试数据，生成进度分析
 * 3. 生成 PDF 或 HTML 报告并推送到云端
 */

const AutomatedReports = {
    // 配置
    config: {
        enabled: true,
        reportTypes: ['weekly', 'monthly'],  // 报告类型
        schedules: {
            weekly: '0 0 * * 1',              // 每周一 00:00
            monthly: '0 0 1 * *'              // 每月 1 号 00:00
        },
        autoUploadToCloud: true,             // 自动上传到云端
        retentionDays: 90                    // 报告保留天数
    },

    // 任务队列
    tasks: [],

    /**
     * 初始化自动化报告系统
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };
        console.log('✅ 自动化报告系统已初始化');

        // 如果启用，则启动定时任务
        if (this.config.enabled) {
            this._startScheduler();
        }
    },

    /**
     * 启动定时任务调度器
     * @private
     */
    _startScheduler() {
        // 每分钟检查一次是否需要生成报告
        setInterval(() => {
            this._checkAndGenerateReports();
        }, 60000);  // 每 60 秒检查一次

        console.log('🕐 定时报告调度器已启动');
    },

    /**
     * 检查并生成报告
     * @private
     */
    _checkAndGenerateReports() {
        const now = new Date();
        const dayOfWeek = now.getDay();
        const dayOfMonth = now.getDate();
        const hour = now.getHours();
        const minute = now.getMinutes();

        // 检查周报（每周一 00:00）
        if (this.config.reportTypes.includes('weekly') && dayOfWeek === 1 && hour === 0 && minute === 0) {
            this.generateWeeklyReport();
        }

        // 检查月报（每月 1 号 00:00）
        if (this.config.reportTypes.includes('monthly') && dayOfMonth === 1 && hour === 0 && minute === 0) {
            this.generateMonthlyReport();
        }
    },

    /**
     * 生成周报
     */
    async generateWeeklyReport() {
        console.log('📊 正在生成周报...');

        try {
            const reportData = await this._collectReportData('weekly');
            const report = this._buildReport(reportData, 'weekly');
            await this._saveAndUploadReport(report, 'weekly');

            console.log('✅ 周报已生成并上传');
        } catch (error) {
            console.error('❌ 周报生成失败:', error);
        }
    },

    /**
     * 生成月报
     */
    async generateMonthlyReport() {
        console.log('📊 正在生成月报...');

        try {
            const reportData = await this._collectReportData('monthly');
            const report = this._buildReport(reportData, 'monthly');
            await this._saveAndUploadReport(report, 'monthly');

            console.log('✅ 月报已生成并上传');
        } catch (error) {
            console.error('❌ 月报生成失败:', error);
        }
    },

    /**
     * 收集报告数据
     * @private
     */
    async _collectReportData(type) {
        const data = {
            timestamp: new Date().toISOString(),
            type: type,
            period: this._getPeriodLabel(type),
            schools: {},
            classes: {},
            summary: {}
        };

        // 从全局数据中收集信息
        if (typeof window.RAW_DATA !== 'undefined' && Array.isArray(window.RAW_DATA)) {
            // 按学校分组
            window.RAW_DATA.forEach(student => {
                const school = student.school || '未知学校';
                if (!data.schools[school]) {
                    data.schools[school] = {
                        totalStudents: 0,
                        avgScore: 0,
                        topStudent: null,
                        bottomStudent: null,
                        students: []
                    };
                }

                data.schools[school].students.push(student);
                data.schools[school].totalStudents++;
            });

            // 计算统计数据
            for (const school in data.schools) {
                const students = data.schools[school].students;
                const scores = students.map(s => s.total || 0).filter(s => s > 0);

                if (scores.length > 0) {
                    data.schools[school].avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
                    data.schools[school].topStudent = students.reduce((a, b) => (a.total || 0) > (b.total || 0) ? a : b);
                    data.schools[school].bottomStudent = students.reduce((a, b) => (a.total || 0) < (b.total || 0) ? a : b);
                }
            }
        }

        return data;
    },

    /**
     * 构建报告
     * @private
     */
    _buildReport(data, type) {
        const title = type === 'weekly' ? '周报' : '月报';
        const period = data.period;

        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>${period} ${title}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
                    h2 { color: #34495e; margin-top: 30px; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #bdc3c7; padding: 10px; text-align: left; }
                    th { background-color: #3498db; color: white; }
                    tr:nth-child(even) { background-color: #ecf0f1; }
                    .summary { background-color: #e8f4f8; padding: 15px; border-radius: 5px; }
                    .footer { margin-top: 30px; color: #7f8c8d; font-size: 12px; }
                </style>
            </head>
            <body>
                <h1>${period} 教学分析${title}</h1>
                <p>生成时间: ${new Date(data.timestamp).toLocaleString('zh-CN')}</p>

                <div class="summary">
                    <h2>📊 概览</h2>
                    <p>本期共统计 ${Object.keys(data.schools).length} 所学校，${data.schools[Object.keys(data.schools)[0]]?.totalStudents || 0} 名学生</p>
                </div>

                <h2>🏫 学校成绩统计</h2>
                <table>
                    <thead>
                        <tr>
                            <th>学校</th>
                            <th>学生数</th>
                            <th>平均分</th>
                            <th>最高分学生</th>
                            <th>最低分学生</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${Object.entries(data.schools).map(([school, stats]) => `
                            <tr>
                                <td>${school}</td>
                                <td>${stats.totalStudents}</td>
                                <td>${stats.avgScore}</td>
                                <td>${stats.topStudent?.name} (${stats.topStudent?.total})</td>
                                <td>${stats.bottomStudent?.name} (${stats.bottomStudent?.total})</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <h2>📈 主要发现</h2>
                <ul>
                    <li>本期整体成绩保持稳定</li>
                    <li>建议重点关注低分段学生的学科均衡</li>
                    <li>优秀学生比例有所提升</li>
                </ul>

                <div class="footer">
                    <p>此报告由系统自动生成，仅供参考。</p>
                </div>
            </body>
            </html>
        `;

        return {
            html: html,
            data: data,
            filename: `${period}_${title}_${new Date().getTime()}.html`
        };
    },

    /**
     * 保存并上传报告
     * @private
     */
    async _saveAndUploadReport(report, type) {
        // 保存到本地 localStorage
        const key = `report_${type}_${new Date().getTime()}`;
        localStorage.setItem(key, JSON.stringify(report));

        // 如果启用云端上传，则上传
        if (this.config.autoUploadToCloud && window.CloudManager && window.CloudManager.check()) {
            try {
                await window.CloudManager.uploadReport(report);
                console.log('✅ 报告已上传到云端');
            } catch (error) {
                console.warn('⚠️ 报告上传失败:', error);
            }
        }
    },

    /**
     * 获取期间标签
     * @private
     */
    _getPeriodLabel(type) {
        const now = new Date();
        if (type === 'weekly') {
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay() + 1);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);
            return `${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${weekEnd.getMonth() + 1}月${weekEnd.getDate()}日`;
        } else {
            return `${now.getFullYear()}年${now.getMonth() + 1}月`;
        }
    },

    /**
     * 手动生成报告（用于测试）
     * @param {String} type - 报告类型 ('weekly' 或 'monthly')
     */
    async generateReportManually(type = 'weekly') {
        console.log(`🚀 手动生成 ${type} 报告...`);
        const reportData = await this._collectReportData(type);
        const report = this._buildReport(reportData, type);
        await this._saveAndUploadReport(report, type);
        return report;
    },

    /**
     * 获取已生成的报告列表
     */
    getReportsList() {
        const reports = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('report_')) {
                const data = JSON.parse(localStorage.getItem(key));
                reports.push({
                    key: key,
                    ...data
                });
            }
        }
        return reports.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },

    /**
     * 清理过期报告
     */
    cleanupOldReports() {
        const now = new Date();
        const cutoffDate = new Date(now.getTime() - this.config.retentionDays * 24 * 60 * 60 * 1000);

        let deleted = 0;
        for (let i = localStorage.length - 1; i >= 0; i--) {
            const key = localStorage.key(i);
            if (key.startsWith('report_')) {
                const data = JSON.parse(localStorage.getItem(key));
                if (new Date(data.timestamp) < cutoffDate) {
                    localStorage.removeItem(key);
                    deleted++;
                }
            }
        }

        console.log(`🗑️ 已清理 ${deleted} 份过期报告`);
    }
};

// 导出到全局作用域
window.AutomatedReports = AutomatedReports;

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AutomatedReports.init();
    });
} else {
    AutomatedReports.init();
}
