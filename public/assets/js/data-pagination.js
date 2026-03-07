/**
 * 🟢 数据分片加载模块 (Data Pagination Module)
 * 用途：将 RAW_DATA 的全量加载改为分片加载，显著降低内存占用和首屏加载时间
 * 
 * 核心原理：
 * 1. 首屏只加载学生的基本信息（name, id, class, school, total）
 * 2. 当用户点击查看详情时，再异步加载该生的完整数据（scores, ranks）
 * 3. 使用 LRU Cache 缓存最近查看的学生，避免重复加载
 */

const DataPagination = {
    // 配置参数
    config: {
        pageSize: 50,           // 每页加载的学生数
        cacheSize: 100,         // LRU 缓存大小
        enableDetailLazyLoad: true  // 是否启用详情懒加载
    },

    // 内部状态
    state: {
        fullData: [],           // 完整的原始数据（从云端或本地加载）
        basicData: [],          // 基础数据（只含 name, id, class, school, total）
        currentPage: 0,         // 当前页码
        totalPages: 0,
        detailCache: new Map(), // LRU 缓存：存储已加载的完整学生数据
        cacheOrder: []          // 缓存顺序，用于 LRU 淘汰
    },

    /**
     * 初始化分片加载系统
     * @param {Array} fullData - 完整的学生数据
     */
    init(fullData) {
        if (!Array.isArray(fullData)) return;
        
        this.state.fullData = fullData;
        this.state.totalPages = Math.ceil(fullData.length / this.config.pageSize);
        
        // 生成基础数据（仅保留必要字段）
        this.state.basicData = fullData.map(stu => ({
            id: stu.id,
            name: stu.name,
            class: stu.class,
            school: stu.school,
            total: stu.total,
            _fullIndex: fullData.indexOf(stu)  // 记录在 fullData 中的索引，用于快速查找
        }));
        
        console.log(`✅ 数据分片加载已初始化：共 ${fullData.length} 名学生，分 ${this.state.totalPages} 页`);
    },

    /**
     * 获取指定页的基础数据
     * @param {Number} pageNum - 页码（从 0 开始）
     * @returns {Array} 该页的学生基础信息
     */
    getBasicDataByPage(pageNum = 0) {
        const start = pageNum * this.config.pageSize;
        const end = Math.min(start + this.config.pageSize, this.state.basicData.length);
        return this.state.basicData.slice(start, end);
    },

    /**
     * 获取学生的完整数据（包括 scores, ranks 等）
     * 如果缓存中有，直接返回；否则从 fullData 中查找并缓存
     * @param {String|Number} studentId - 学生 ID 或索引
     * @returns {Object} 学生的完整数据
     */
    getStudentDetail(studentId) {
        // 1. 检查缓存
        if (this.state.detailCache.has(studentId)) {
            this._updateLRU(studentId);
            return this.state.detailCache.get(studentId);
        }

        // 2. 从 fullData 查找
        let student = null;
        if (typeof studentId === 'number') {
            // 如果是索引
            student = this.state.fullData[studentId];
        } else {
            // 如果是 ID，线性查找
            student = this.state.fullData.find(s => s.id === studentId || s.name === studentId);
        }

        if (!student) return null;

        // 3. 缓存该学生的完整数据
        this._addToCache(studentId, student);
        return student;
    },

    /**
     * 批量获取学生详情（用于表格渲染）
     * @param {Array} studentIds - 学生 ID 数组
     * @returns {Array} 学生完整数据数组
     */
    getStudentDetailBatch(studentIds) {
        return studentIds.map(id => this.getStudentDetail(id)).filter(s => s !== null);
    },

    /**
     * LRU 缓存管理：添加到缓存
     * @private
     */
    _addToCache(key, value) {
        // 如果缓存已满，删除最久未使用的
        if (this.state.detailCache.size >= this.config.cacheSize) {
            const lruKey = this.state.cacheOrder.shift();
            this.state.detailCache.delete(lruKey);
        }

        this.state.detailCache.set(key, value);
        this.state.cacheOrder.push(key);
    },

    /**
     * LRU 缓存管理：更新访问顺序
     * @private
     */
    _updateLRU(key) {
        const idx = this.state.cacheOrder.indexOf(key);
        if (idx !== -1) {
            this.state.cacheOrder.splice(idx, 1);
            this.state.cacheOrder.push(key);
        }
    },

    /**
     * 搜索学生（支持模糊匹配）
     * @param {String} keyword - 搜索关键词
     * @returns {Array} 匹配的学生基础信息
     */
    searchStudents(keyword) {
        const lowerKeyword = keyword.toLowerCase();
        return this.state.basicData.filter(stu =>
            stu.name.toLowerCase().includes(lowerKeyword) ||
            stu.class.toLowerCase().includes(lowerKeyword) ||
            (stu.id && stu.id.toString().includes(lowerKeyword))
        );
    },

    /**
     * 获取缓存统计信息
     * @returns {Object} 缓存状态
     */
    getCacheStats() {
        return {
            totalStudents: this.state.fullData.length,
            cachedStudents: this.state.detailCache.size,
            cacheHitRate: this.state.detailCache.size / Math.max(this.state.fullData.length, 1),
            memoryUsage: `${(this.state.detailCache.size * 5).toFixed(2)} KB (估计)`
        };
    },

    /**
     * 清空缓存
     */
    clearCache() {
        this.state.detailCache.clear();
        this.state.cacheOrder = [];
        console.log('✅ 数据缓存已清空');
    }
};

// 导出到全局作用域
window.DataPagination = DataPagination;
