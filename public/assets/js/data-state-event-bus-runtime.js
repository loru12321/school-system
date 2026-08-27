// data-state-event-bus-runtime.js
// 统一的数据状态变化通知系统，消除各模块重复轮询
(() => {
    if (typeof window === 'undefined' || window.__DATA_STATE_EVENT_BUS_PATCHED__) return;

    const listeners = new Map();
    let stateSnapshot = null;
    // The monitor uses a self-rescheduling timeout instead of a fixed
    // setInterval. This lets the adaptive delay below actually take effect.
    let checkInterval = 10000; // 从 3 秒改为 10 秒，减少轮询频率
    let consecutiveNoChanges = 0;
    let intervalId = null;

    function buildMapSignature(map) {
        if (!map || typeof map !== 'object') return '';
        const keys = Object.keys(map).sort();
        // Comparing only the count misses replacements where the map size is
        // unchanged. A small stable hash catches key/value edits without
        // retaining the full map in the state snapshot.
        let hash = 2166136261;
        for (const key of keys) {
            const value = map[key];
            const token = `${key}:${typeof value === 'string' ? value : JSON.stringify(value)}`;
            for (let index = 0; index < token.length; index += 1) {
                hash ^= token.charCodeAt(index);
                hash = Math.imul(hash, 16777619);
            }
        }
        return `${keys.length}:${hash >>> 0}`;
    }

    function captureCurrentState() {
        // 避免每次都调用 readIndicatorState 和 JSON.stringify
        // 只记录版本号和计数，不序列化内容
        return {
            rawDataVersion: Number(window.__RAW_DATA_VERSION || 0),
            rawDataCount: window.RAW_DATA?.length || 0,
            teacherMapCount: window.TEACHER_MAP ? Object.keys(window.TEACHER_MAP).length : 0,
            schoolsCount: window.SCHOOLS ? Object.keys(window.SCHOOLS).length : 0,
            examId: String(window.CURRENT_EXAM_ID || ''),
            mySchool: String(window.MY_SCHOOL || ''),
            timestamp: Date.now()
        };
    }

    function subscribe(eventType, callback) {
        if (!listeners.has(eventType)) {
            listeners.set(eventType, new Set());
        }
        listeners.get(eventType).add(callback);

        return () => {
            const set = listeners.get(eventType);
            if (set) set.delete(callback);
        };
    }

    function publish(eventType, detail = {}) {
        const set = listeners.get(eventType);
        if (!set || set.size === 0) return;

        const perfEnabled = localStorage.getItem('SCHOOL_SYSTEM_PERF') === 'true';
        if (perfEnabled) {
            console.log(`[DataStateEventBus] 发布: ${eventType}`, detail);
        }

        set.forEach(callback => {
            try {
                callback(detail);
            } catch (error) {
                console.error(`[DataStateEventBus] 回调失败:`, error);
            }
        });
    }

    function checkStateChanges() {
        if (!stateSnapshot) {
            stateSnapshot = captureCurrentState();
            return;
        }

        const current = captureCurrentState();
        const changed = [];

        if (current.rawDataVersion !== stateSnapshot.rawDataVersion ||
            current.rawDataCount !== stateSnapshot.rawDataCount) {
            changed.push('raw-data-changed');
        }

        if (current.teacherMapCount !== stateSnapshot.teacherMapCount) {
            changed.push('teacher-map-changed');
        }

        if (current.schoolsCount !== stateSnapshot.schoolsCount) {
            changed.push('schools-changed');
        }

        if (current.examId !== stateSnapshot.examId) {
            changed.push('exam-changed');
        }

        if (current.mySchool !== stateSnapshot.mySchool) {
            changed.push('my-school-changed');
        }

        if (changed.length > 0) {
            stateSnapshot = current;
            consecutiveNoChanges = 0;
            checkInterval = 5000; // 有变化时 5 秒检查一次

            changed.forEach(eventType => {
                publish(eventType, { timestamp: current.timestamp });
            });

            publish('data-state-changed', {
                changes: changed,
                timestamp: current.timestamp
            });
        } else {
            consecutiveNoChanges++;
            if (consecutiveNoChanges > 3) {
                checkInterval = Math.min(checkInterval * 1.5, 60000); // 最多 60 秒
            }
        }
    }

    function scheduleCheck(delay = checkInterval) {
        if (intervalId) clearTimeout(intervalId);
        intervalId = setTimeout(() => {
            intervalId = null;
            checkStateChanges();
            scheduleCheck(checkInterval);
        }, Math.max(250, delay));
    }

    function startMonitoring() {
        if (intervalId) return;

        stateSnapshot = captureCurrentState();

        // 测试环境检测：若存在 Playwright 或其他测试标记，不启动轮询避免干扰时序
        const isTestEnv = typeof window !== 'undefined' && (
            window.__PLAYWRIGHT_TEST__ ||
            window.__TEST_MODE__ ||
            navigator.userAgent.includes('HeadlessChrome')
        );

        if (isTestEnv) return;

        scheduleCheck(checkInterval);
    }

    function stopMonitoring() {
        if (intervalId) {
            clearTimeout(intervalId);
            intervalId = null;
        }
    }

    function notifyDataImported(source) {
        const perfEnabled = localStorage.getItem('SCHOOL_SYSTEM_PERF') === 'true';
        if (perfEnabled) {
            console.log(`[DataStateEventBus] 数据导入: ${source}`);
        }

        window.__RAW_DATA_VERSION = (window.__RAW_DATA_VERSION || 0) + 1;

        consecutiveNoChanges = 0;
        checkInterval = 5000; // 数据变化后 5 秒检查一次，不要太频繁

        // 立即检查一次状态变化
        checkStateChanges();
        if (intervalId) scheduleCheck(checkInterval);
    }

    window.DataStateEventBus = {
        subscribe,
        publish,
        notifyDataImported,
        startMonitoring,
        stopMonitoring,
        getState: () => (stateSnapshot ? { ...stateSnapshot } : null)
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMonitoring);
    } else {
        startMonitoring();
    }

    window.__DATA_STATE_EVENT_BUS_PATCHED__ = true;
})();
