# 数据准备模块状态同步优化方案

## 现状问题

截图显示"数据准备"状态面板（准备状态、导入与设置、数据检查）有：
- **同步时间戳**："已同步 07/31 08:28"
- **状态检查**：考试届别、科目数、任课表等前置条件
- **实时更新需求**：用户导入数据后需立即看到状态变化

### 当前架构问题

从代码分析发现多个独立的状态轮询系统：

1. **prerequisite-status-runtime.js**  
   - 检查 `schoolAlias`, `mySchool`, `highSchoolLine`, `teacherMap`
   - 仅在模块切换时触发 `refresh()`
   - **无自动同步机制**

2. **data-manager-core-runtime.js** (122KB)  
   - 管理学生/教师/参数/云端数据
   - 有独立的 `scheduleDataManagerStatusRender()` 调度
   - **与 prerequisite 状态不联动**

3. **cloud-workspace-runtime.js** (128KB)  
   - 云端同步状态："已同步 07/31 08:28"
   - 独立轮询云端变化
   - **重复读取相同的本地数据**

4. **data-quality-runtime.js**  
   - 数据检查（缺失字段、重复身份、异常分数）
   - 每次打开"数据检查"模块重新扫描全量数据
   - **无增量检查机制**

**核心问题**：多个系统重复读取 `RAW_DATA`、`TEACHER_MAP`、`SCHOOLS` 等全局状态，造成：
- CPU 浪费（重复计算）
- 状态不一致（A 模块已更新，B 模块还显示旧值）
- 用户困惑（导入数据后不知道何时生效）

## 优化目标

**建立统一的数据状态广播机制，所有模块订阅变化而非轮询**

## 优化方案

### Phase 1: 中央事件总线

创建统一的数据变化通知系统：

```javascript
// public/assets/js/data-state-event-bus-runtime.js
(() => {
    if (window.__DATA_STATE_EVENT_BUS_PATCHED__) return;

    const listeners = new Map(); // key: eventType, value: Set<callback>
    let stateSnapshot = captureCurrentState();

    // 捕获当前数据状态指纹
    function captureCurrentState() {
        return {
            rawDataVersion: Number(window.__RAW_DATA_VERSION || 0),
            rawDataCount: window.RAW_DATA?.length || 0,
            teacherMapSignature: buildMapSignature(window.TEACHER_MAP),
            schoolsSignature: buildMapSignature(window.SCHOOLS),
            examId: window.CURRENT_EXAM_ID,
            mySchool: window.MY_SCHOOL,
            indicatorSignature: JSON.stringify(readIndicatorState?.() || {}),
            timestamp: Date.now()
        };
    }

    function buildMapSignature(map) {
        if (!map || typeof map !== 'object') return '';
        return `${Object.keys(map).length}:${Object.values(map).slice(0, 3).join(',')}`;
    }

    // 订阅数据变化
    function subscribe(eventType, callback) {
        if (!listeners.has(eventType)) {
            listeners.set(eventType, new Set());
        }
        listeners.get(eventType).add(callback);
        
        return () => unsubscribe(eventType, callback);
    }

    function unsubscribe(eventType, callback) {
        const set = listeners.get(eventType);
        if (set) set.delete(callback);
    }

    // 发布数据变化事件
    function publish(eventType, detail = {}) {
        const set = listeners.get(eventType);
        if (!set || set.size === 0) return;

        console.log(`[DataStateEventBus] 发布事件: ${eventType}`, detail);
        
        const event = new CustomEvent(eventType, { detail });
        set.forEach(callback => {
            try {
                callback(detail);
            } catch (error) {
                console.error(`[DataStateEventBus] 回调执行失败:`, error);
            }
        });
    }

    // 自动检测数据变化
    function checkStateChanges() {
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
            changed.forEach(eventType => {
                publish(eventType, { timestamp: current.timestamp });
            });
            publish('data-state-changed', { 
                changes: changed, 
                timestamp: current.timestamp 
            });
        }
    }

    // 智能轮询：有变化时高频检查，稳定后降频
    let checkInterval = 3000; // 初始 3 秒
    let consecutiveNoChanges = 0;
    let intervalId = null;

    function startMonitoring() {
        if (intervalId) return;

        intervalId = setInterval(() => {
            checkStateChanges();

            // 自适应轮询频率
            const hasListeners = Array.from(listeners.values()).some(set => set.size > 0);
            if (!hasListeners) {
                consecutiveNoChanges++;
                if (consecutiveNoChanges > 5) {
                    checkInterval = Math.min(checkInterval * 1.5, 30000); // 最多 30 秒
                }
            }
        }, checkInterval);
    }

    function stopMonitoring() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    // 手动触发检查（用于数据导入后立即通知）
    function notifyDataImported(source) {
        console.log(`[DataStateEventBus] 数据导入通知: ${source}`);
        checkStateChanges();
        consecutiveNoChanges = 0;
        checkInterval = 1000; // 重置为高频
    }

    window.DataStateEventBus = {
        subscribe,
        unsubscribe,
        publish,
        notifyDataImported,
        startMonitoring,
        stopMonitoring,
        getState: () => ({ ...stateSnapshot })
    };

    // 自动启动监控
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startMonitoring);
    } else {
        startMonitoring();
    }

    window.__DATA_STATE_EVENT_BUS_PATCHED__ = true;
})();
```

### Phase 2: 改造现有模块订阅机制

#### 2.1 prerequisite-status-runtime.js

```javascript
// 从轮询改为订阅
function initAutoRefresh() {
    if (!window.DataStateEventBus) return;

    // 订阅相关数据变化
    DataStateEventBus.subscribe('schools-changed', () => {
        Object.keys(PILOT_MODULES).forEach(moduleId => {
            if (PILOT_MODULES[moduleId].includes('schoolAlias')) {
                refresh(moduleId);
            }
        });
    });

    DataStateEventBus.subscribe('my-school-changed', () => {
        Object.keys(PILOT_MODULES).forEach(moduleId => {
            if (PILOT_MODULES[moduleId].includes('mySchool')) {
                refresh(moduleId);
            }
        });
    });

    DataStateEventBus.subscribe('indicator-changed', () => {
        refresh('summary'); // 只有 summary 关心 highSchoolLine
    });

    DataStateEventBus.subscribe('teacher-map-changed', () => {
        refresh('teacher-analysis');
    });
}

// 在 runtime 末尾调用
initAutoRefresh();
```

#### 2.2 data-manager-core-runtime.js

```javascript
// 在数据保存/导入后通知总线
DataManager.saveStudents = function() {
    // ... 原有保存逻辑 ...
    
    // 通知数据变化
    if (window.DataStateEventBus) {
        window.DataStateEventBus.notifyDataImported('student-data');
    }
};

DataManager.importScores = function() {
    // ... 原有导入逻辑 ...
    
    window.__RAW_DATA_VERSION = (window.__RAW_DATA_VERSION || 0) + 1;
    
    if (window.DataStateEventBus) {
        window.DataStateEventBus.notifyDataImported('score-import');
    }
};
```

#### 2.3 cloud-workspace-runtime.js

```javascript
// 云端同步完成后通知
async function syncCloudToLocal(examId) {
    // ... 原有同步逻辑 ...
    
    window.__RAW_DATA_VERSION = (window.__RAW_DATA_VERSION || 0) + 1;
    
    if (window.DataStateEventBus) {
        window.DataStateEventBus.notifyDataImported('cloud-sync');
        window.DataStateEventBus.publish('cloud-sync-complete', {
            examId,
            timestamp: new Date().toISOString(),
            recordCount: window.RAW_DATA?.length || 0
        });
    }
    
    // 更新 UI 显示的同步时间
    updateSyncTimestamp();
}
```

### Phase 3: 数据质量增量检查

当前 `data-quality-runtime.js` 每次全量扫描，改为增量：

```javascript
let lastQualityCheck = {
    rawDataVersion: 0,
    issues: []
};

function runDataQualityCheck() {
    const currentVersion = Number(window.__RAW_DATA_VERSION || 0);
    
    // 版本未变化，复用缓存
    if (currentVersion === lastQualityCheck.rawDataVersion) {
        console.log('[data-quality] 使用缓存的检查结果');
        renderQualityIssues(lastQualityCheck.issues);
        return;
    }
    
    console.log('[data-quality] 数据已变化，重新检查');
    const issues = performFullQualityCheck(window.RAW_DATA);
    
    lastQualityCheck = {
        rawDataVersion: currentVersion,
        issues,
        timestamp: Date.now()
    };
    
    renderQualityIssues(issues);
}

// 订阅数据变化，自动失效缓存
if (window.DataStateEventBus) {
    DataStateEventBus.subscribe('raw-data-changed', () => {
        console.log('[data-quality] 检测到数据变化，缓存已失效');
    });
}
```

### Phase 4: 统一的状态指示器

在"数据准备"分类顶部显示实时状态：

```javascript
function renderDataPreparationStatus() {
    const state = window.DataStateEventBus?.getState();
    if (!state) return;
    
    const statusHTML = `
        <div class="data-prep-status-bar">
            <span class="status-item">
                <i class="ti ti-database"></i>
                <span>${state.rawDataCount} 条成绩</span>
            </span>
            <span class="status-item">
                <i class="ti ti-school"></i>
                <span>${Object.keys(window.SCHOOLS || {}).length} 所学校</span>
            </span>
            <span class="status-item">
                <i class="ti ti-users"></i>
                <span>${Object.keys(window.TEACHER_MAP || {}).length} 条任课</span>
            </span>
            <span class="status-timestamp">
                <i class="ti ti-clock"></i>
                <span>更新于 ${formatTimestamp(state.timestamp)}</span>
            </span>
        </div>
    `;
    
    const container = document.querySelector('.data-category-header');
    if (container) {
        container.insertAdjacentHTML('afterend', statusHTML);
    }
}

// 订阅任意数据变化，实时更新显示
if (window.DataStateEventBus) {
    DataStateEventBus.subscribe('data-state-changed', renderDataPreparationStatus);
}
```

## 预期收益

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 状态检查CPU占用 | 每模块独立轮询 | 统一监控 | **-60%** |
| 数据导入后UI更新延迟 | 3-5秒（下次轮询） | <100ms（即时通知） | **-95%** |
| 重复数据扫描次数 | 每模块1次 | 共享1次 | **-75%** |
| data-quality 模块切换速度 | 每次全量扫描 | 缓存复用 | **2-5倍提升** |

## 副作用与风险

1. **内存增加**  
   - 增加事件监听器和状态快照（约 10KB）
   - 可接受，换取显著性能提升

2. **事件风暴**  
   - 短时间内多次数据变化可能触发大量回调
   - 对策：使用防抖（100ms 内合并相同事件）

3. **兼容性**  
   - 旧模块未订阅时仍按原逻辑工作
   - 渐进式迁移，无破坏性变更

## 实施步骤

1. ✅ 完成现状分析（本文档）
2. ⏳ 实现 `data-state-event-bus-runtime.js`
3. ⏳ 改造 `prerequisite-status-runtime.js` 订阅机制
4. ⏳ 在 `data-manager-core-runtime.js` 插入通知调用
5. ⏳ 添加 `data-quality` 增量检查缓存
6. ⏳ 实现统一状态指示器 UI
7. ⏳ 测试验证 + smoke 通过
8. ⏳ 生产发布

## 测试验证

```bash
# 验证事件总线生效
# 1. 打开控制台
# 2. 执行：window.DataStateEventBus.subscribe('raw-data-changed', (d) => console.log('收到通知', d))
# 3. 导入成绩数据
# 预期：立即看到 "收到通知" 日志

# 验证状态实时更新
# 1. 打开"准备状态"模块
# 2. 导入任课表
# 预期：<100ms 内看到"任课数据"状态从红色变绿色

# 验证性能改善
npm run smoke:modules:local
# 预期：dm:params 从 4000ms+ 降至 3000ms 以内

# 验证缓存生效
# 1. 打开"数据检查"模块（首次全量扫描）
# 2. 切换到其他模块
# 3. 再切回"数据检查"
# 预期：立即显示结果，无重新扫描
```

## 后续扩展

建立事件总线后，可进一步优化：

1. **跨模块数据共享**  
   - `TEACHER_STATS` 计算结果广播给所有教师相关模块
   - 避免每个模块重新计算

2. **离线变更队列**  
   - 用户在无网络时的修改暂存
   - 恢复网络后批量同步

3. **操作撤销/重做**  
   - 捕获状态变化历史
   - 支持撤销数据导入操作
