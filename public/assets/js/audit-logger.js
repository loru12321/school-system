/**
 * 🟢 操作审计日志模块 (Audit Logger)
 * 用途：记录系统中的关键操作，支持本地存储和云端同步，提供操作溯源能力
 * 
 * 记录的操作类型：
 * 1. 数据操作：上传、修改、删除成绩数据
 * 2. 权限操作：登录、切换用户、修改权限
 * 3. 导出操作：导出报告、导出 Excel、生成 PDF
 * 4. 系统操作：切换届别、修改设置、清空缓存
 */

const AuditLogger = {
    // 配置
    config: {
        enabled: true,                     // 是否启用审计
        logLevel: 'info',                  // 日志级别：'debug', 'info', 'warn', 'error'
        maxLocalLogs: 1000,                // 本地最多保存日志数
        autoSyncToCloud: true,             // 自动同步到云端
        syncInterval: 60000,               // 同步间隔（ms）
        sensitiveFields: ['password', 'apiKey', 'token']  // 敏感字段（不记录）
    },

    // 日志存储
    logs: [],

    // 同步状态
    syncStatus: {
        lastSyncTime: null,
        pendingLogs: 0,
        isSyncing: false
    },

    /**
     * 初始化审计日志系统
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };
        
        // 从 localStorage 恢复日志
        this._restoreLogsFromStorage();

        // 启动定时同步
        if (this.config.autoSyncToCloud) {
            this._startAutoSync();
        }

        console.log('✅ 操作审计日志已初始化');
    },

    /**
     * 记录操作日志
     * @param {String} action - 操作类型
     * @param {Object} details - 操作详情
     * @param {String} level - 日志级别
     */
    log(action, details = {}, level = 'info') {
        const logEntry = {
            id: this._generateId(),
            timestamp: new Date().toISOString(),
            action: action,
            level: level,
            userId: this._getCurrentUserId(),
            userRole: this._getCurrentUserRole(),
            details: this._sanitizeDetails(details),
            ipAddress: this._getClientIP(),
            userAgent: navigator.userAgent.substring(0, 200)
        };

        this.logs.push(logEntry);

        // 保存到 localStorage
        this._saveLogsToStorage();

        // 如果日志超过限制，删除最旧的
        if (this.logs.length > this.config.maxLocalLogs) {
            this.logs.shift();
        }

        // 根据级别输出到控制台
        const consoleLevel = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        console[consoleLevel](`[${level.toUpperCase()}] ${action}:`, details);

        return logEntry;
    },

    /**
     * 记录数据操作
     * @param {String} operation - 操作类型（upload, modify, delete）
     * @param {String} dataType - 数据类型（exam, score, student）
     * @param {Object} details - 操作详情
     */
    logDataOperation(operation, dataType, details = {}) {
        return this.log(`DATA_${operation.toUpperCase()}_${dataType.toUpperCase()}`, {
            operation: operation,
            dataType: dataType,
            recordCount: details.recordCount || 0,
            affectedFields: details.affectedFields || [],
            ...details
        }, 'info');
    },

    /**
     * 记录权限操作
     * @param {String} operation - 操作类型（login, logout, roleChange）
     * @param {Object} details - 操作详情
     */
    logPermissionOperation(operation, details = {}) {
        return this.log(`PERMISSION_${operation.toUpperCase()}`, {
            operation: operation,
            previousRole: details.previousRole,
            newRole: details.newRole,
            reason: details.reason,
            ...details
        }, 'warn');
    },

    /**
     * 记录导出操作
     * @param {String} exportType - 导出类型（excel, pdf, html）
     * @param {Object} details - 操作详情
     */
    logExportOperation(exportType, details = {}) {
        return this.log(`EXPORT_${exportType.toUpperCase()}`, {
            exportType: exportType,
            recordCount: details.recordCount || 0,
            filters: details.filters || {},
            anonymized: details.anonymized || false,
            ...details
        }, 'info');
    },

    /**
     * 记录系统操作
     * @param {String} operation - 操作类型（switchCohort, clearCache 等）
     * @param {Object} details - 操作详情
     */
    logSystemOperation(operation, details = {}) {
        return this.log(`SYSTEM_${operation.toUpperCase()}`, {
            operation: operation,
            ...details
        }, 'info');
    },

    /**
     * 获取日志列表
     * @param {Object} filters - 过滤条件
     * @returns {Array} 过滤后的日志
     */
    getLogs(filters = {}) {
        let result = [...this.logs];

        // 按操作类型过滤
        if (filters.action) {
            result = result.filter(log => log.action.includes(filters.action));
        }

        // 按用户过滤
        if (filters.userId) {
            result = result.filter(log => log.userId === filters.userId);
        }

        // 按日志级别过滤
        if (filters.level) {
            result = result.filter(log => log.level === filters.level);
        }

        // 按时间范围过滤
        if (filters.startTime) {
            const start = new Date(filters.startTime);
            result = result.filter(log => new Date(log.timestamp) >= start);
        }

        if (filters.endTime) {
            const end = new Date(filters.endTime);
            result = result.filter(log => new Date(log.timestamp) <= end);
        }

        // 按关键词搜索
        if (filters.keyword) {
            const keyword = filters.keyword.toLowerCase();
            result = result.filter(log =>
                log.action.toLowerCase().includes(keyword) ||
                JSON.stringify(log.details).toLowerCase().includes(keyword)
            );
        }

        // 排序（最新优先）
        result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // 分页
        if (filters.limit) {
            result = result.slice(0, filters.limit);
        }

        return result;
    },

    /**
     * 获取特定用户的操作历史
     * @param {String} userId - 用户 ID
     * @param {Number} limit - 限制数量
     */
    getUserOperationHistory(userId, limit = 50) {
        return this.getLogs({
            userId: userId,
            limit: limit
        });
    },

    /**
     * 获取特定时间段内的操作统计
     * @param {String} startTime - 开始时间
     * @param {String} endTime - 结束时间
     */
    getOperationStats(startTime, endTime) {
        const logs = this.getLogs({
            startTime: startTime,
            endTime: endTime
        });

        const stats = {
            totalOperations: logs.length,
            byAction: {},
            byUser: {},
            byLevel: {
                debug: 0,
                info: 0,
                warn: 0,
                error: 0
            }
        };

        logs.forEach(log => {
            // 按操作类型统计
            stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;

            // 按用户统计
            stats.byUser[log.userId] = (stats.byUser[log.userId] || 0) + 1;

            // 按级别统计
            stats.byLevel[log.level]++;
        });

        return stats;
    },

    /**
     * 导出日志为 CSV
     * @param {Object} filters - 过滤条件
     * @returns {String} CSV 内容
     */
    exportLogsAsCSV(filters = {}) {
        const logs = this.getLogs(filters);

        // CSV 头
        const headers = ['时间', '操作', '用户', '角色', '级别', '详情', 'IP 地址'];
        const rows = [headers];

        // CSV 行
        logs.forEach(log => {
            rows.push([
                log.timestamp,
                log.action,
                log.userId || '-',
                log.userRole || '-',
                log.level,
                JSON.stringify(log.details).substring(0, 100),
                log.ipAddress || '-'
            ]);
        });

        // 转换为 CSV 字符串
        return rows.map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');
    },

    /**
     * 下载日志文件
     * @param {Object} filters - 过滤条件
     * @param {String} filename - 文件名
     */
    downloadLogs(filters = {}, filename = 'audit-logs.csv') {
        const csv = this.exportLogsAsCSV(filters);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`✅ 日志已下载: ${filename}`);
    },

    /**
     * 手动同步日志到云端
     */
    async syncToCloud() {
        if (this.syncStatus.isSyncing) {
            console.warn('⚠️ 同步已在进行中');
            return;
        }

        this.syncStatus.isSyncing = true;

        try {
            if (!window.CloudManager || !window.CloudManager.check()) {
                throw new Error('云端服务不可用');
            }

            // 获取待同步的日志
            const logsToSync = this.logs.filter(log =>
                !log.synced || new Date(log.timestamp) > new Date(this.syncStatus.lastSyncTime || 0)
            );

            if (logsToSync.length === 0) {
                console.log('✅ 没有待同步的日志');
                return;
            }

            // 上传到云端
            await window.CloudManager.uploadAuditLogs(logsToSync);

            // 标记为已同步
            logsToSync.forEach(log => {
                log.synced = true;
            });

            this.syncStatus.lastSyncTime = new Date().toISOString();
            this.syncStatus.pendingLogs = 0;

            console.log(`✅ 已同步 ${logsToSync.length} 条日志到云端`);
        } catch (error) {
            console.error('❌ 日志同步失败:', error);
            this.syncStatus.pendingLogs = this.logs.filter(log => !log.synced).length;
        } finally {
            this.syncStatus.isSyncing = false;
        }
    },

    /**
     * 启动定时同步
     * @private
     */
    _startAutoSync() {
        setInterval(() => {
            this.syncToCloud();
        }, this.config.syncInterval);

        console.log('🕐 日志自动同步已启动');
    },

    /**
     * 保存日志到 localStorage
     * @private
     */
    _saveLogsToStorage() {
        try {
            const logsToSave = this.logs.slice(-this.config.maxLocalLogs);
            localStorage.setItem('audit_logs', JSON.stringify(logsToSave));
        } catch (error) {
            console.warn('⚠️ 日志保存失败:', error);
        }
    },

    /**
     * 从 localStorage 恢复日志
     * @private
     */
    _restoreLogsFromStorage() {
        try {
            const stored = localStorage.getItem('audit_logs');
            if (stored) {
                this.logs = JSON.parse(stored);
                console.log(`✅ 已恢复 ${this.logs.length} 条本地日志`);
            }
        } catch (error) {
            console.warn('⚠️ 日志恢复失败:', error);
        }
    },

    /**
     * 清理敏感字段
     * @private
     */
    _sanitizeDetails(details) {
        const sanitized = JSON.parse(JSON.stringify(details));

        const sanitizeObject = (obj) => {
            for (const key in obj) {
                if (this.config.sensitiveFields.some(field => key.toLowerCase().includes(field))) {
                    obj[key] = '***';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    sanitizeObject(obj[key]);
                }
            }
        };

        sanitizeObject(sanitized);
        return sanitized;
    },

    /**
     * 生成唯一 ID
     * @private
     */
    _generateId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * 获取当前用户 ID
     * @private
     */
    _getCurrentUserId() {
        // 从全局变量或 localStorage 获取
        return window.CURRENT_USER?.id || localStorage.getItem('userId') || 'unknown';
    },

    /**
     * 获取当前用户角色
     * @private
     */
    _getCurrentUserRole() {
        return window.CURRENT_USER?.role || localStorage.getItem('userRole') || 'guest';
    },

    /**
     * 获取客户端 IP（仅在服务器支持时有效）
     * @private
     */
    _getClientIP() {
        // 这通常需要服务器支持，前端无法直接获取
        return 'client-ip';
    },

    /**
     * 获取审计状态
     */
    getStatus() {
        return {
            enabled: this.config.enabled,
            totalLogs: this.logs.length,
            pendingLogs: this.syncStatus.pendingLogs,
            lastSyncTime: this.syncStatus.lastSyncTime,
            isSyncing: this.syncStatus.isSyncing
        };
    },

    /**
     * 清空所有日志
     */
    clearAllLogs() {
        this.logs = [];
        localStorage.removeItem('audit_logs');
        console.log('🗑️ 所有日志已清空');
    }
};

// 导出到全局作用域
window.AuditLogger = AuditLogger;

// 页面加载完成后自动初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AuditLogger.init();
    });
} else {
    AuditLogger.init();
}
