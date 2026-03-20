/**
 * 🟢 PWA 注册模块
 * 用途：在应用启动时注册 Service Worker，启用离线能力
 */

const PWARegister = {
    /**
     * 初始化 PWA
     */
    async init() {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ 浏览器不支持 Service Worker，PWA 功能不可用');
            return false;
        }

        if (!window.isSecureContext && !/^(localhost|127\.0\.0\.1)$/i.test(window.location.hostname)) {
            console.warn('⚠️ 当前上下文不是安全环境，Service Worker 无法注册');
            return false;
        }

        try {
            const swUrl = new URL('./sw.js', window.location.href);
            const scopeUrl = new URL('./', window.location.href);
            const registration = await navigator.serviceWorker.register(swUrl.pathname, {
                scope: scopeUrl.pathname
            });

            console.log('✅ Service Worker 已注册:', registration);

            // 监听 Service Worker 更新
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('🔄 Service Worker 有新版本可用');
                        this._notifyUpdate();
                    }
                });
            });

            return true;
        } catch (error) {
            console.error('❌ Service Worker 注册失败:', error);
            return false;
        }
    },

    /**
     * 通知用户有新版本可用
     * @private
     */
    _notifyUpdate() {
        if (window.UI && window.UI.toast) {
            window.UI.toast('🔄 系统有新版本，请刷新页面', 'info');
        } else {
            console.log('🔄 系统有新版本可用，请刷新页面');
        }
    },

    /**
     * 获取 Service Worker 状态
     */
    getStatus() {
        if (!('serviceWorker' in navigator)) {
            return { available: false, reason: '浏览器不支持' };
        }

        return {
            available: true,
            controller: navigator.serviceWorker.controller ? '已激活' : '未激活',
            ready: '检查中'
        };
    },

    /**
     * 卸载 Service Worker（用于调试）
     */
    async unregister() {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (let registration of registrations) {
                await registration.unregister();
                console.log('✅ Service Worker 已卸载');
            }
        } catch (error) {
            console.error('❌ 卸载 Service Worker 失败:', error);
        }
    }
};

// 页面加载完成后自动初始化 PWA
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PWARegister.init();
    });
} else {
    PWARegister.init();
}

// 导出到全局作用域
window.PWARegister = PWARegister;
