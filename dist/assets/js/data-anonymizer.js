/**
 * 🟢 数据脱敏工具 (Data Anonymizer)
 * 用途：在生成可分享的报告、导出数据时，支持一键脱敏学生隐私信息
 * 
 * 脱敏规则：
 * 1. 姓名：保留首尾，中间用 * 替换（如：张*三）
 * 2. 学号/考号：保留前后各 2 位，中间用 * 替换
 * 3. 班级：保留年级，班号用 * 替换（如：高一*班）
 * 4. 电话：保留后 4 位（如：****1234）
 * 5. 邮箱：保留域名，用户名用 * 替换
 */

const DataAnonymizer = {
    // 配置
    config: {
        enabled: false,                    // 是否启用脱敏
        mode: 'partial',                   // 脱敏模式：'partial'(部分) 或 'full'(完全)
        fields: {
            name: true,                    // 脱敏姓名
            studentId: true,               // 脱敏学号
            examId: false,                 // 脱敏考号
            class: false,                  // 脱敏班级
            phone: false,                  // 脱敏电话
            email: false                   // 脱敏邮箱
        },
        preserveScores: true,              // 保留成绩数据
        preserveRanks: true,               // 保留排名数据
        customRules: {}                    // 自定义脱敏规则
    },

    // 脱敏历史（用于恢复）
    history: [],

    /**
     * 初始化脱敏工具
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };
        console.log('✅ 数据脱敏工具已初始化');
    },

    /**
     * 启用脱敏模式
     */
    enable() {
        this.config.enabled = true;
        console.log('🔐 脱敏模式已启用');
    },

    /**
     * 禁用脱敏模式
     */
    disable() {
        this.config.enabled = false;
        console.log('🔓 脱敏模式已禁用');
    },

    /**
     * 脱敏单个学生对象
     * @param {Object} student - 学生对象
     * @returns {Object} 脱敏后的学生对象
     */
    anonymizeStudent(student) {
        if (!this.config.enabled || !student) return student;

        const anonymized = JSON.parse(JSON.stringify(student));

        // 脱敏姓名
        if (this.config.fields.name && anonymized.name) {
            anonymized.name = this._anonymizeName(anonymized.name);
        }

        // 脱敏学号
        if (this.config.fields.studentId && anonymized.studentId) {
            anonymized.studentId = this._anonymizeId(anonymized.studentId);
        }

        // 脱敏班级
        if (this.config.fields.class && anonymized.class) {
            anonymized.class = this._anonymizeClass(anonymized.class);
        }

        // 脱敏电话
        if (this.config.fields.phone && anonymized.phone) {
            anonymized.phone = this._anonymizePhone(anonymized.phone);
        }

        // 脱敏邮箱
        if (this.config.fields.email && anonymized.email) {
            anonymized.email = this._anonymizeEmail(anonymized.email);
        }

        return anonymized;
    },

    /**
     * 脱敏学生数组
     * @param {Array} students - 学生数组
     * @returns {Array} 脱敏后的学生数组
     */
    anonymizeStudents(students) {
        if (!Array.isArray(students)) return students;
        return students.map(s => this.anonymizeStudent(s));
    },

    /**
     * 脱敏整个数据集合
     * @param {Object} data - 数据对象（包含 RAW_DATA, SCHOOLS 等）
     * @returns {Object} 脱敏后的数据
     */
    anonymizeDataset(data) {
        if (!this.config.enabled) return data;

        const anonymized = JSON.parse(JSON.stringify(data));

        // 脱敏 RAW_DATA
        if (Array.isArray(anonymized.RAW_DATA)) {
            anonymized.RAW_DATA = this.anonymizeStudents(anonymized.RAW_DATA);
        }

        // 脱敏 SCHOOLS
        if (typeof anonymized.SCHOOLS === 'object') {
            for (const school in anonymized.SCHOOLS) {
                if (Array.isArray(anonymized.SCHOOLS[school].students)) {
                    anonymized.SCHOOLS[school].students = this.anonymizeStudents(
                        anonymized.SCHOOLS[school].students
                    );
                }
            }
        }

        return anonymized;
    },

    /**
     * 脱敏 HTML 报告
     * @param {String} html - HTML 内容
     * @returns {String} 脱敏后的 HTML
     */
    anonymizeHTML(html) {
        if (!this.config.enabled) return html;

        let anonymized = html;

        // 使用正则表达式脱敏常见的学生信息模式
        // 脱敏姓名（通常在 <td>, <span> 等标签中）
        anonymized = anonymized.replace(
            /(?<=>)([\u4e00-\u9fa5]{2,4})(?=<|&)/g,
            (match) => this._anonymizeName(match)
        );

        // 脱敏学号（8-10 位数字）
        anonymized = anonymized.replace(
            /\b(\d{8,10})\b/g,
            (match) => this._anonymizeId(match)
        );

        // 脱敏班级（如"高一1班"）
        anonymized = anonymized.replace(
            /高[一二三](\d)班/g,
            (match, num) => `高一*班`
        );

        return anonymized;
    },

    /**
     * 脱敏 JSON 数据
     * @param {String} json - JSON 字符串
     * @returns {String} 脱敏后的 JSON
     */
    anonymizeJSON(json) {
        if (!this.config.enabled) return json;

        try {
            const data = JSON.parse(json);
            const anonymized = this.anonymizeDataset(data);
            return JSON.stringify(anonymized, null, 2);
        } catch (error) {
            console.error('❌ JSON 脱敏失败:', error);
            return json;
        }
    },

    /**
     * 生成脱敏报告（HTML）
     * @param {Object} reportData - 报告数据
     * @returns {String} 脱敏后的 HTML 报告
     */
    generateAnonymousReport(reportData) {
        const anonymized = this.anonymizeDataset(reportData);

        let html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>匿名分析报告</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .header { background: #f0f0f0; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                    .anonymity-notice { 
                        background: #fff3cd; 
                        border: 1px solid #ffc107; 
                        padding: 10px; 
                        border-radius: 5px; 
                        margin-bottom: 20px;
                        color: #856404;
                    }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
                    th { background-color: #007bff; color: white; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>📊 匿名分析报告</h1>
                    <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
                </div>

                <div class="anonymity-notice">
                    <strong>⚠️ 隐私保护声明</strong><br>
                    本报告中的所有学生信息已进行脱敏处理，仅保留成绩和排名数据用于分析。
                    学生姓名、学号等个人信息已被隐藏，无法追溯到具体个人。
                </div>

                <h2>📈 统计数据</h2>
                <table>
                    <thead>
                        <tr>
                            <th>指标</th>
                            <th>数值</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>总学生数</td>
                            <td>${anonymized.RAW_DATA?.length || 0}</td>
                        </tr>
                        <tr>
                            <td>平均分</td>
                            <td>${this._calculateAverage(anonymized.RAW_DATA)}</td>
                        </tr>
                        <tr>
                            <td>最高分</td>
                            <td>${this._getMaxScore(anonymized.RAW_DATA)}</td>
                        </tr>
                        <tr>
                            <td>最低分</td>
                            <td>${this._getMinScore(anonymized.RAW_DATA)}</td>
                        </tr>
                    </tbody>
                </table>

                <h2>📊 学生成绩分布</h2>
                <table>
                    <thead>
                        <tr>
                            <th>学生编号</th>
                            <th>班级</th>
                            <th>总分</th>
                            <th>排名</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${anonymized.RAW_DATA?.slice(0, 10).map((s, idx) => `
                            <tr>
                                <td>学生 ${idx + 1}</td>
                                <td>${s.class || '-'}</td>
                                <td>${s.total || '-'}</td>
                                <td>${s.ranks?.total?.school || '-'}</td>
                            </tr>
                        `).join('') || ''}
                    </tbody>
                </table>

                <p style="margin-top: 30px; color: #999; font-size: 12px;">
                    此报告由系统自动生成，所有个人信息已脱敏处理。
                </p>
            </body>
            </html>
        `;

        return html;
    },

    /**
     * 导出脱敏 Excel 文件（需配合 xlsx 库）
     * @param {Array} students - 学生数组
     * @param {String} filename - 文件名
     */
    exportAnonymousExcel(students, filename = 'anonymous_report.xlsx') {
        if (typeof XLSX === 'undefined') {
            console.warn('⚠️ XLSX 库未加载');
            return;
        }

        const anonymized = this.anonymizeStudents(students);

        // 转换为 Excel 行
        const rows = anonymized.map((s, idx) => ({
            '学生编号': `学生${idx + 1}`,
            '班级': s.class || '-',
            '总分': s.total || '-',
            '排名': s.ranks?.total?.school || '-',
            '语文': s.scores?.语文 || '-',
            '数学': s.scores?.数学 || '-',
            '英语': s.scores?.英语 || '-'
        }));

        // 创建工作簿
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, '成绩数据');

        // 下载
        XLSX.writeFile(wb, filename);
        console.log(`✅ 脱敏 Excel 已导出: ${filename}`);
    },

    /**
     * 设置自定义脱敏规则
     * @param {String} fieldName - 字段名
     * @param {Function} ruleFn - 脱敏函数
     */
    setCustomRule(fieldName, ruleFn) {
        this.config.customRules[fieldName] = ruleFn;
        console.log(`✅ 自定义规则已设置: ${fieldName}`);
    },

    /**
     * 脱敏姓名
     * @private
     */
    _anonymizeName(name) {
        if (!name || name.length < 2) return name;
        if (name.length === 2) return name[0] + '*';
        return name[0] + '*'.repeat(name.length - 2) + name[name.length - 1];
    },

    /**
     * 脱敏 ID
     * @private
     */
    _anonymizeId(id) {
        const str = String(id);
        if (str.length <= 4) return '*'.repeat(str.length);
        return str.substring(0, 2) + '*'.repeat(str.length - 4) + str.substring(str.length - 2);
    },

    /**
     * 脱敏班级
     * @private
     */
    _anonymizeClass(className) {
        return className.replace(/(\d)班/, '*班');
    },

    /**
     * 脱敏电话
     * @private
     */
    _anonymizePhone(phone) {
        const str = String(phone);
        return '*'.repeat(str.length - 4) + str.substring(str.length - 4);
    },

    /**
     * 脱敏邮箱
     * @private
     */
    _anonymizeEmail(email) {
        const [user, domain] = email.split('@');
        return '*'.repeat(Math.max(1, user.length - 2)) + user.substring(user.length - 2) + '@' + domain;
    },

    /**
     * 计算平均分
     * @private
     */
    _calculateAverage(students) {
        if (!Array.isArray(students) || students.length === 0) return '-';
        const sum = students.reduce((acc, s) => acc + (s.total || 0), 0);
        return (sum / students.length).toFixed(2);
    },

    /**
     * 获取最高分
     * @private
     */
    _getMaxScore(students) {
        if (!Array.isArray(students) || students.length === 0) return '-';
        return Math.max(...students.map(s => s.total || 0));
    },

    /**
     * 获取最低分
     * @private
     */
    _getMinScore(students) {
        if (!Array.isArray(students) || students.length === 0) return '-';
        return Math.min(...students.map(s => s.total || 0));
    },

    /**
     * 获取脱敏状态
     */
    getStatus() {
        return {
            enabled: this.config.enabled,
            mode: this.config.mode,
            fields: this.config.fields,
            customRulesCount: Object.keys(this.config.customRules).length
        };
    }
};

// 导出到全局作用域
window.DataAnonymizer = DataAnonymizer;
