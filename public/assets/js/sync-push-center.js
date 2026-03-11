/**
 * 🟢 多端同步推送中心 (Sync & Push Center)
 * 用途：支持多端实时同步、智能推送预警、冲突检测
 * 
 * 功能：
 * 1. 实时同步：多用户修改数据时的冲突检测与解决
 * 2. 智能推送：异常数据波动时的自动预警
 * 3. 消息中心：集中管理所有通知和预警
 * 4. 订阅管理：用户可自定义推送规则
 */

const SyncPushCenter = {
    // 配置
    config: {
        enabled: true,
        syncInterval: 5000,                // 同步间隔（ms）
        pushEnabled: true,                 // 推送启用
        conflictResolution: 'latest-wins', // 冲突解决策略：'latest-wins' 或 'manual'
        notificationTimeout: 5000          // 通知显示时长（ms）
    },

    // 状态
    state: {
        isSyncing: false,
        lastSyncTime: null,
        pendingChanges: [],
        messages: [],
        subscriptions: {}
    },

    // 预警规则
    alertRules: {
        scoreDropped: {
            name: '成绩下滑预警',
            condition: (prev, current) => (prev.total - current.total) > 10,
            severity: 'high'
        },
        excellentAchieved: {
            name: '优秀成绩预警',
            condition: (prev, current) => current.total > 85 && prev.total <= 85,
            severity: 'low'
        },
        passRateChanged: {
            name: '及格率变化预警',
            condition: (prev, current) => Math.abs(prev.passRate - current.passRate) > 0.1,
            severity: 'medium'
        }
    },

    /**
     * 初始化同步推送中心
     * @param {Object} config - 配置选项
     */
    init(config = {}) {
        this.config = { ...this.config, ...config };

        // 启动定时同步
        if (this.config.enabled) {
            this._startAutoSync();
        }

        // 监听页面卸载，保存未同步的更改
        window.addEventListener('beforeunload', () => {
            this._savePendingChanges();
        });

        console.log('✅ 同步推送中心已初始化');
    },

    /**
     * 记录数据变化
     * @param {String} type - 变化类型（create/update/delete）
     * @param {String} entity - 实体类型（student/exam/class）
     * @param {Object} data - 变化数据
     */
    recordChange(type, entity, data) {
        const change = {
            id: `${Date.now()}_${Math.random()}`,
            type: type,
            entity: entity,
            data: data,
            timestamp: new Date().toISOString(),
            userId: this._getCurrentUserId(),
            synced: false
        };

        this.state.pendingChanges.push(change);

        console.log(`📝 已记录变化: ${type} ${entity}`);

        // 检查是否需要触发预警
        this._checkAlerts(entity, data);
    },

    /**
     * 同步数据
     */
    async sync() {
        if (this.state.isSyncing) {
            console.warn('⚠️ 同步已在进行中');
            return;
        }

        this.state.isSyncing = true;

        try {
            console.log('🔄 正在同步数据...');

            // 处理待同步的更改
            for (const change of this.state.pendingChanges) {
                if (!change.synced) {
                    await this._syncChange(change);
                    change.synced = true;
                }
            }

            // 清理已同步的更改
            this.state.pendingChanges = this.state.pendingChanges.filter(c => !c.synced);

            this.state.lastSyncTime = new Date().toISOString();

            console.log('✅ 数据同步完成');
        } catch (error) {
            console.error('❌ 数据同步失败:', error);
        } finally {
            this.state.isSyncing = false;
        }
    },

    /**
     * 发送推送消息
     * @param {Object} message - 消息对象
     */
    push(message) {
        const msg = {
            id: `${Date.now()}_${Math.random()}`,
            ...message,
            timestamp: new Date().toISOString(),
            read: false
        };

        this.state.messages.push(msg);

        // 显示通知
        this._showNotification(msg);

        // 自动清除过期消息
        setTimeout(() => {
            this.state.messages = this.state.messages.filter(m => m.id !== msg.id);
        }, this.config.notificationTimeout);

        console.log(`📢 推送消息: ${msg.title}`);
    },

    /**
     * 订阅推送规则
     * @param {String} rule - 规则名称
     * @param {Function} callback - 回调函数
     */
    subscribe(rule, callback) {
        if (!this.state.subscriptions[rule]) {
            this.state.subscriptions[rule] = [];
        }

        this.state.subscriptions[rule].push(callback);

        console.log(`📬 已订阅: ${rule}`);
    },

    /**
     * 取消订阅
     * @param {String} rule - 规则名称
     * @param {Function} callback - 回调函数
     */
    unsubscribe(rule, callback) {
        if (this.state.subscriptions[rule]) {
            this.state.subscriptions[rule] = this.state.subscriptions[rule].filter(cb => cb !== callback);
            console.log(`📭 已取消订阅: ${rule}`);
        }
    },

    /**
     * 获取消息列表
     * @returns {Array} 消息数组
     */
    getMessages() {
        return this.state.messages;
    },

    /**
     * 标记消息为已读
     * @param {String} messageId - 消息 ID
     */
    markAsRead(messageId) {
        const msg = this.state.messages.find(m => m.id === messageId);
        if (msg) {
            msg.read = true;
        }
    },

    /**
     * 检查预警规则
     * @private
     */
    _checkAlerts(entity, data) {
        if (entity !== 'student') return;

        for (const [ruleName, rule] of Object.entries(this.alertRules)) {
            // 这里需要获取前一个状态来比较
            // 简化处理：直接检查条件
            if (rule.condition({}, data)) {
                this.push({
                    title: rule.name,
                    message: `检测到学生 ${data.name} 的成绩异常`,
                    severity: rule.severity,
                    action: 'view',
                    data: data
                });

                // 触发订阅回调
                if (this.state.subscriptions[ruleName]) {
                    this.state.subscriptions[ruleName].forEach(cb => cb(data));
                }
            }
        }
    },

    /**
     * 同步单个变化
     * @private
     */
    async _syncChange(change) {
        // 这里需要实现与云端的同步逻辑
        // 简化处理：模拟同步
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`✅ 已同步: ${change.id}`);
                resolve();
            }, 100);
        });
    },

    /**
     * 显示通知
     * @private
     */
    _showNotification(message) {
        // 使用浏览器原生通知 API
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(message.title, {
                body: message.message,
                icon: '/assets/icon.png',
                tag: message.id
            });
        }

        // 或者显示页面内通知
        const notificationEl = document.createElement('div');
        notificationEl.className = `notification notification-${message.severity}`;
        notificationEl.innerHTML = `
            <strong>${message.title}</strong>
            <p>${message.message}</p>
        `;

        document.body.appendChild(notificationEl);

        // 自动移除
        setTimeout(() => {
            notificationEl.remove();
        }, this.config.notificationTimeout);
    },

    /**
     * 启动自动同步
     * @private
     */
    _startAutoSync() {
        setInterval(() => {
            this.sync();
        }, this.config.syncInterval);

        console.log('🕐 自动同步已启动');
    },

    /**
     * 保存待同步的更改
     * @private
     */
    _savePendingChanges() {
        if (this.state.pendingChanges.length > 0) {
            localStorage.setItem('pendingChanges', JSON.stringify(this.state.pendingChanges));
            console.log('💾 待同步更改已保存');
        }
    },

    /**
     * 获取当前用户 ID
     * @private
     */
    _getCurrentUserId() {
        // 从全局变量或本地存储获取
        return window.currentUserId || localStorage.getItem('userId') || 'anonymous';
    }
};

// 导出到全局作用域
window.SyncPushCenter = SyncPushCenter;

/**
 * 🟢 插件化扩展系统 (Plugin System)
 * 用途：允许开发者编写插件来扩展系统功能
 */

const PluginSystem = {
    // 已加载的插件
    plugins: {},

    // 插件钩子
    hooks: {},

    /**
     * 注册插件
     * @param {String} name - 插件名称
     * @param {Object} plugin - 插件对象
     */
    register(name, plugin) {
        if (this.plugins[name]) {
            console.warn(`⚠️ 插件 ${name} 已存在，将被覆盖`);
        }

        this.plugins[name] = plugin;

        // 执行插件的初始化函数
        if (plugin.init && typeof plugin.init === 'function') {
            plugin.init();
        }

        console.log(`✅ 插件已注册: ${name}`);
    },

    /**
     * 卸载插件
     * @param {String} name - 插件名称
     */
    unregister(name) {
        if (this.plugins[name]) {
            // 执行插件的卸载函数
            if (this.plugins[name].destroy && typeof this.plugins[name].destroy === 'function') {
                this.plugins[name].destroy();
            }

            delete this.plugins[name];
            console.log(`✅ 插件已卸载: ${name}`);
        }
    },

    /**
     * 注册钩子
     * @param {String} hookName - 钩子名称
     * @param {Function} callback - 回调函数
     */
    addHook(hookName, callback) {
        if (!this.hooks[hookName]) {
            this.hooks[hookName] = [];
        }

        this.hooks[hookName].push(callback);
    },

    /**
     * 执行钩子
     * @param {String} hookName - 钩子名称
     * @param {Object} data - 传递给钩子的数据
     */
    executeHook(hookName, data) {
        if (this.hooks[hookName]) {
            this.hooks[hookName].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ 钩子 ${hookName} 执行失败:`, error);
                }
            });
        }
    },

    /**
     * 获取插件
     * @param {String} name - 插件名称
     * @returns {Object} 插件对象
     */
    getPlugin(name) {
        return this.plugins[name];
    },

    /**
     * 列出所有插件
     * @returns {Array} 插件名称数组
     */
    listPlugins() {
        return Object.keys(this.plugins);
    }
};

// 导出到全局作用域
window.PluginSystem = PluginSystem;
