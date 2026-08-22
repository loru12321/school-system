// data-state-event-bus-runtime.js
// 统一的数据状态变化通知系统，消除各模块重复轮询
(() => {
    if (typeof window === 'undefined' || window.__DATA_STATE_EVENT_BUS_PATCHED__) return;

    const listeners = new Map();
    let stateSnapshot = null;
    let checkInterval = 3000;
    let consecutiveNoChanges = 0;
    let intervalId = null;

    function buildMapSignature(map) {
        if (!map || typeof map !== 'object') return '';
        const keys = Object.keys(map);
        return `${keys.length}:${keys.slice(0, 3).join(',')}`;
    }

    function captureCurrentState() {
        const indicator = (typeof window.readIndicatorState === 'function')
            ? window.readIndicatorState()
            : ((window.SYS_VARS && window.SYS_VARS.indicator) || {});

        return {
            rawDataVersion: Number(window.__RAW_DATA_VERSION || 0),
            rawDataCount: window.RAW_DATA?.length || 0,
            teacherMapSignature: buildMapSignature(window.TEACHER_MAP),
            schoolsSignature: buildMapSignature(window.SCHOOLS),
            examId: String(window.CURRENT_EXAM_ID || ''),
            mySchool: String(window.MY_SCHOOL || ''),
            indicatorSignature: JSON.stringify({
                ind1: indicator.ind1 || '',
                ind2: indicator.ind2 || '',
                highSchoolLine: indicator.highSchoolLine || ''
            }),
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

        if (current.teacherMapSignature !== stateSnapshot.teacherMapSignature) {
            changed.push('teacher-map-changed');
        }

        if (current.schoolsSignature !== stateSnapshot.schoolsSignature) {
            changed.push('schools-changed');
        }

        if (current.examId !== stateSnapshot.examId) {
            changed.push('exam-changed');
        }

        if (current.mySchool !== stateSnapshot.mySchool) {
            changed.push('my-school-changed');
        }

        if (current.indicatorSignature !== stateSnapshot.indicatorSignature) {
            changed.push('indicator-changed');
        }

        if (changed.length > 0) {
            stateSnapshot = current;
            consecutiveNoChanges = 0;
            checkInterval = 1000;

            changed.forEach(eventType => {
                publish(eventType, { timestamp: current.timestamp });
            });

            publish('data-state-changed', {
                changes: changed,
                timestamp: current.timestamp
            });
        } else {
            consecutiveNoChanges++;
            if (consecutiveNoChanges > 5) {
                checkInterval = Math.min(checkInterval * 1.5, 30000);
            }
        }
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

        intervalId = setInterval(() => {
            checkStateChanges();
        }, checkInterval);
    }

    function stopMonitoring() {
        if (intervalId) {
            clearInterval(intervalId);
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
        checkInterval = 1000;

        checkStateChanges();
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
