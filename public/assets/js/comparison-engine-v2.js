/**
 * 🟢 多维度对比引擎 V2 (Comparison Engine V2)
 * 用途：支持跨届别、跨班级、跨学科的多维度对比分析
 * 
 * 对比维度：
 * 1. 跨届对比：2022级 vs 2023级 在同期的表现
 * 2. 班级对比：重点班 vs 普通班的成绩差异
 * 3. 学科对比：各学科的难度和学生掌握程度
 * 4. 虚拟班级对比：自定义筛选条件的班级对比
 */

const ComparisonEngineV2 = {
    // 配置
    config: {
        enabled: true,
        comparisonTypes: ['cohort', 'class', 'subject', 'virtual'],
        maxComparisons: 5,                 // 最多同时对比 5 个对象
        cacheResults: true                 // 缓存对比结果
    },

    // 对比结果缓存
    cache: {},

    /**
     * 初始化对比引擎
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };
        console.log('✅ 多维度对比引擎已初始化');
    },

    /**
     * 跨届对比：比较两个届别在同期的表现
     * @param {String} cohort1 - 第一个届别（如 "2022级"）
     * @param {String} cohort2 - 第二个届别（如 "2023级"）
     * @param {String} examPeriod - 考试期数（如 "期中"）
     * @returns {Object} 对比结果
     */
    async compareCohorts(cohort1, cohort2, examPeriod) {
        const cacheKey = `cohort_${cohort1}_${cohort2}_${examPeriod}`;

        // 检查缓存
        if (this.config.cacheResults && this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }

        try {
            // 自动拉取云端数据
            if (window.CloudManager && typeof window.CloudManager.fetchCohortExamsToLocal === 'function') {
                const cid1 = String(cohort1 || '').replace(/\D/g, '');
                const cid2 = String(cohort2 || '').replace(/\D/g, '');
                await window.CloudManager.fetchCohortExamsToLocal(cid1);
                if (cid1 !== cid2) await window.CloudManager.fetchCohortExamsToLocal(cid2);
            }

            const data1 = this._getCohortExamData(cohort1, examPeriod);
            const data2 = this._getCohortExamData(cohort2, examPeriod);

            const result = {
                cohort1: cohort1,
                cohort2: cohort2,
                examPeriod: examPeriod,
                comparison: {
                    avgScore: {
                        [cohort1]: data1.avgScore,
                        [cohort2]: data2.avgScore,
                        diff: data2.avgScore - data1.avgScore,
                        diffPercent: ((data2.avgScore - data1.avgScore) / data1.avgScore * 100).toFixed(2)
                    },
                    passRate: {
                        [cohort1]: data1.passRate,
                        [cohort2]: data2.passRate,
                        diff: data2.passRate - data1.passRate
                    },
                    excellentRate: {
                        [cohort1]: data1.excellentRate,
                        [cohort2]: data2.excellentRate,
                        diff: data2.excellentRate - data1.excellentRate
                    },
                    subjectComparison: this._compareSubjects(data1.subjects, data2.subjects)
                },
                timestamp: new Date().toISOString()
            };

            // 缓存结果
            if (this.config.cacheResults) {
                this.cache[cacheKey] = result;
            }

            return result;
        } catch (error) {
            console.error('❌ 届别对比失败:', error);
            return null;
        }
    },

    /**
     * 班级对比：比较多个班级的成绩
     * @param {Array} classes - 班级数组（如 ["高一1班", "高一2班"]）
     * @returns {Object} 对比结果
     */
    compareClasses(classes) {
        const cacheKey = `class_${classes.join('_')}`;

        if (this.config.cacheResults && this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }

        try {
            const classData = classes.map(cls => ({
                className: cls,
                ...this._getClassData(cls)
            }));

            // 排序
            classData.sort((a, b) => b.avgScore - a.avgScore);

            const result = {
                classes: classes,
                classData: classData,
                ranking: classData.map((cls, idx) => ({
                    rank: idx + 1,
                    className: cls.className,
                    avgScore: cls.avgScore
                })),
                topClass: classData[0],
                bottomClass: classData[classData.length - 1],
                avgDiff: classData[0].avgScore - classData[classData.length - 1].avgScore,
                timestamp: new Date().toISOString()
            };

            if (this.config.cacheResults) {
                this.cache[cacheKey] = result;
            }

            return result;
        } catch (error) {
            console.error('❌ 班级对比失败:', error);
            return null;
        }
    },

    /**
     * 学科对比：比较各学科的成绩
     * @param {Array} subjects - 学科数组（如 ["语文", "数学", "英语"]）
     * @returns {Object} 对比结果
     */
    compareSubjects(subjects) {
        const cacheKey = `subject_${subjects.join('_')}`;

        if (this.config.cacheResults && this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }

        try {
            const subjectData = subjects.map(subject => ({
                subject: subject,
                ...this._getSubjectStats(subject)
            }));

            // 按难度排序
            subjectData.sort((a, b) => a.avgScore - b.avgScore);

            const result = {
                subjects: subjects,
                subjectData: subjectData,
                difficulty: subjectData.map((s, idx) => ({
                    rank: idx + 1,
                    subject: s.subject,
                    difficulty: 'hard',  // 简化处理
                    avgScore: s.avgScore
                })),
                easiest: subjectData[subjectData.length - 1],
                hardest: subjectData[0],
                avgScoreDiff: subjectData[subjectData.length - 1].avgScore - subjectData[0].avgScore,
                timestamp: new Date().toISOString()
            };

            if (this.config.cacheResults) {
                this.cache[cacheKey] = result;
            }

            return result;
        } catch (error) {
            console.error('❌ 学科对比失败:', error);
            return null;
        }
    },

    /**
     * 虚拟班级对比：基于自定义条件创建虚拟班级进行对比
     * @param {Object} virtualClasses - 虚拟班级定义
     * @example
     * {
     *   "实验班": { filter: (s) => s.class.includes("实验") },
     *   "普通班": { filter: (s) => !s.class.includes("实验") }
     * }
     * @returns {Object} 对比结果
     */
    compareVirtualClasses(virtualClasses) {
        const cacheKey = `virtual_${Object.keys(virtualClasses).join('_')}`;

        if (this.config.cacheResults && this.cache[cacheKey]) {
            return this.cache[cacheKey];
        }

        try {
            const students = window.RAW_DATA || [];
            const virtualData = {};

            for (const [name, config] of Object.entries(virtualClasses)) {
                const filtered = students.filter(config.filter);
                const scores = filtered.map(s => s.total || 0).filter(s => s > 0);

                virtualData[name] = {
                    name: name,
                    studentCount: filtered.length,
                    avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
                    maxScore: Math.max(...scores),
                    minScore: Math.min(...scores),
                    passRate: filtered.filter(s => (s.total || 0) > 60).length / filtered.length,
                    excellentRate: filtered.filter(s => (s.total || 0) > 85).length / filtered.length
                };
            }

            // 排序
            const sorted = Object.values(virtualData).sort((a, b) => b.avgScore - a.avgScore);

            const result = {
                virtualClasses: Object.keys(virtualClasses),
                data: virtualData,
                ranking: sorted.map((vc, idx) => ({
                    rank: idx + 1,
                    name: vc.name,
                    avgScore: vc.avgScore
                })),
                timestamp: new Date().toISOString()
            };

            if (this.config.cacheResults) {
                this.cache[cacheKey] = result;
            }

            return result;
        } catch (error) {
            console.error('❌ 虚拟班级对比失败:', error);
            return null;
        }
    },

    /**
     * 生成对比报告（HTML）
     * @param {Object} comparisonResult - 对比结果
     * @returns {String} HTML 报告
     */
    generateComparisonReport(comparisonResult) {
        if (!comparisonResult) return '<p>❌ 对比结果为空</p>';

        let html = `
            <div class="comparison-report">
                <h2>📊 对比分析报告</h2>
                <p>生成时间: ${new Date(comparisonResult.timestamp).toLocaleString('zh-CN')}</p>

                <table class="comparison-table">
                    <thead>
                        <tr>
                            <th>指标</th>
        `;

        // 动态生成表头
        if (comparisonResult.cohort1 && comparisonResult.cohort2) {
            html += `
                            <th>${comparisonResult.cohort1}</th>
                            <th>${comparisonResult.cohort2}</th>
                            <th>差异</th>
            `;
        } else if (comparisonResult.classes) {
            comparisonResult.classes.forEach(cls => {
                html += `<th>${cls}</th>`;
            });
        }

        html += `
                        </tr>
                    </thead>
                    <tbody>
        `;

        // 填充数据行
        if (comparisonResult.comparison) {
            const comp = comparisonResult.comparison;
            html += `
                        <tr>
                            <td>平均分</td>
                            <td>${comp.avgScore[comparisonResult.cohort1]?.toFixed(2) || '-'}</td>
                            <td>${comp.avgScore[comparisonResult.cohort2]?.toFixed(2) || '-'}</td>
                            <td>${comp.avgScore.diff > 0 ? '📈' : '📉'} ${comp.avgScore.diff.toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td>及格率</td>
                            <td>${(comp.passRate[comparisonResult.cohort1] * 100).toFixed(1)}%</td>
                            <td>${(comp.passRate[comparisonResult.cohort2] * 100).toFixed(1)}%</td>
                            <td>${((comp.passRate[comparisonResult.cohort2] - comp.passRate[comparisonResult.cohort1]) * 100).toFixed(1)}%</td>
                        </tr>
            `;
        }

        html += `
                    </tbody>
                </table>

                <h3>📈 主要发现</h3>
                <ul>
                    <li>对比数据已生成，请查看详细表格</li>
                </ul>
            </div>

            <style>
                .comparison-report { padding: 20px; }
                .comparison-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                .comparison-table th, .comparison-table td { 
                    border: 1px solid #ddd; 
                    padding: 12px; 
                    text-align: left;
                }
                .comparison-table th { background-color: #007bff; color: white; }
                .comparison-table tr:nth-child(even) { background-color: #f9f9f9; }
            </style>
        `;

        return html;
    },

    /**
     * 清空缓存
     */
    clearCache() {
        this.cache = {};
        console.log('🗑️ 对比缓存已清空');
    },

    /**
     * 获取届别的考试数据
     * @private
     */
    _getCohortExamData(cohort, examPeriod) {
        const cid = String(cohort || '').replace(/\D/g, '');
        // 从 COHORT_DB 或云端获取数据
        const examsObj = window.COHORT_DB?.exams || {};
        const exams = Object.values(examsObj);

        // 过滤出属于该届别的考试，并匹配期数
        const exam = exams.find(e => {
            const examCid = String(e.examId || '').match(/^(\d{4})/)?.[1];
            return examCid === cid && (e.examLabel?.includes(examPeriod) || e.examId?.includes(examPeriod));
        });

        if (!exam || !exam.data) {
            return { avgScore: 0, passRate: 0, excellentRate: 0, subjects: {} };
        }

        const scores = exam.data.map(s => s.total || 0).filter(s => s > 0);
        const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        return {
            avgScore: avgScore,
            passRate: exam.data.filter(s => (s.total || 0) > 60).length / exam.data.length,
            excellentRate: exam.data.filter(s => (s.total || 0) > 85).length / exam.data.length,
            subjects: this._extractSubjectStats(exam.data)
        };
    },

    /**
     * 获取班级数据
     * @private
     */
    _getClassData(className) {
        const students = (window.RAW_DATA || []).filter(s => s.class === className);
        const scores = students.map(s => s.total || 0).filter(s => s > 0);

        return {
            studentCount: students.length,
            avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
            passRate: students.filter(s => (s.total || 0) > 60).length / students.length,
            excellentRate: students.filter(s => (s.total || 0) > 85).length / students.length
        };
    },

    /**
     * 获取学科统计
     * @private
     */
    _getSubjectStats(subject) {
        const students = window.RAW_DATA || [];
        const scores = students
            .filter(s => s.scores && s.scores[subject])
            .map(s => s.scores[subject])
            .filter(s => s > 0);

        return {
            studentCount: scores.length,
            avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
            maxScore: Math.max(...scores),
            minScore: Math.min(...scores)
        };
    },

    /**
     * 比较两个学科统计
     * @private
     */
    _compareSubjects(subjects1, subjects2) {
        const comparison = {};

        for (const subject in subjects1) {
            if (subjects2[subject]) {
                comparison[subject] = {
                    avgScore1: subjects1[subject].avgScore,
                    avgScore2: subjects2[subject].avgScore,
                    diff: subjects2[subject].avgScore - subjects1[subject].avgScore
                };
            }
        }

        return comparison;
    },

    /**
     * 提取学科统计
     * @private
     */
    _extractSubjectStats(students) {
        const subjects = {};

        students.forEach(s => {
            if (s.scores) {
                Object.entries(s.scores).forEach(([subject, score]) => {
                    if (!subjects[subject]) {
                        subjects[subject] = [];
                    }
                    subjects[subject].push(score);
                });
            }
        });

        const stats = {};
        for (const subject in subjects) {
            const scores = subjects[subject].filter(s => s > 0);
            stats[subject] = {
                avgScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
            };
        }

        return stats;
    }
};

// 导出到全局作用域
window.ComparisonEngineV2 = ComparisonEngineV2;
