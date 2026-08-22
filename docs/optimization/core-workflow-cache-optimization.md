# "本次必看"工作流缓存优化方案

## 现状问题

从 `shell-runtime.js` 和 `module-entry-runtime.js` 分析发现：

### 当前实现
```javascript
// shell-runtime.js:9-16
const CORE_WORKFLOW_MODULE_IDS = [
    'summary',                     // 综合评价
    'analysis',                    // 两率一分对比
    'teacher-analysis',            // 教师表现
    'teacher-detail-comparison',   // 教师指标明细
    'teacher-township-ranking',    // 教师乡镇对比
    'student-details'              // 学生成绩明细
];
```

**核心问题**：
1. 教务主任每次考试后需**顺序访问这 6 个模块**生成汇报
2. `teacher-analysis` 系列模块每次切换都重新计算 `TEACHER_STATS`（耗时 700ms+）
3. `module-entry-runtime.js` 已有 `canReuseTeacherAnalysisStats()` 逻辑，但**未主动预计算**

### 性能数据

从 HANDOFF.md 和 smoke 测试：
- `switch:student-details` = **7069ms**（超预算 6000ms）
- `dm:params` = 3968-5074ms（接近预算 5000ms）
- `teacher-analysis` 首次渲染延迟 = **700ms**（TEACHER_ANALYSIS_PRELOAD_DELAY_MS）

## 优化目标

**将"本次必看"工作流完整遍历时间从 ~15s 降至 ~8s**

## 优化方案

### Phase 1: 智能预热缓存

在用户登录后、选择考试后，**后台自动预计算** TEACHER_STATS：

```javascript
// 在 module-entry-runtime.js 添加
function precomputeCoreWorkflowData() {
  const user = Auth?.currentUser;
  if (!user || !CORE_WORKFLOW_ROLES.has(user.role)) return;
  
  if (!window.RAW_DATA || !window.TEACHER_MAP) {
    console.log('[core-workflow] 等待数据就绪后预热');
    return;
  }
  
  // 检查是否已有可复用的缓存
  if (canReuseTeacherAnalysisStats()) {
    console.log('[core-workflow] 缓存有效，跳过预热');
    return;
  }
  
  console.log('[core-workflow] 开始后台预热教师统计数据');
  
  scheduleModuleTask('core-workflow-preheat', () => {
    // 触发 teacher-analysis 计算但不渲染
    if (typeof window.analyzeTeachers === 'function') {
      window.analyzeTeachers();
      markTeacherAnalysisStatsReusable();
      console.log('[core-workflow] 预热完成，TEACHER_STATS 已缓存');
    }
  }, { delay: 2000, frame: false }); // 登录后 2 秒空闲时执行
}

// 在合适的时机触发预热
window.addEventListener('exam-selected', precomputeCoreWorkflowData);
window.addEventListener('data-hydration-complete', precomputeCoreWorkflowData);
```

### Phase 2: 批量预加载样式

当前 `ensureModuleStylesFor()` 每次切换模块才加载对应 CSS。对于"本次必看"，可**一次性加载所有样式**：

```javascript
function preloadCoreWorkflowStyles() {
  const user = Auth?.currentUser;
  if (!user || !CORE_WORKFLOW_ROLES.has(user.role)) return;
  
  const stylesToLoad = new Set();
  
  CORE_WORKFLOW_MODULE_IDS.forEach(id => {
    if (TEACHING_MANAGEMENT_MODULE_IDS.has(id)) {
      stylesToLoad.add('teaching-management-module');
    }
    if (TEACHER_INSIGHT_MODULE_IDS.has(id)) {
      stylesToLoad.add('teacher-insights-module');
    }
    if (STUDENT_DIAGNOSIS_MODULE_IDS.has(id)) {
      stylesToLoad.add('student-diagnosis-module');
    }
  });
  
  // 后台预加载（不阻塞主流程）
  scheduleModuleTask('core-workflow-styles', () => {
    Array.from(stylesToLoad).forEach(name => {
      const href = `./assets/css/${name}.css`;
      if (typeof window.ensureOptionalStylesheetLoaded === 'function') {
        window.ensureOptionalStylesheetLoaded(name, href);
      }
    });
    console.log('[core-workflow] 样式预加载完成');
  }, { delay: 1500 });
}
```

### Phase 3: 渐进式数据渲染

针对 `student-details` 7069ms 超预算问题，采用**虚拟滚动 + 分批渲染**：

```javascript
// 在 student-details-render-runtime.js 中优化
function renderStudentDetailsProgressive(students) {
  const BATCH_SIZE = 50; // 每批渲染 50 条
  const container = document.getElementById('student-details-table-body');
  
  if (!container) return;
  
  // 第一批立即渲染（满足预算 < 1000ms）
  const firstBatch = students.slice(0, BATCH_SIZE);
  renderStudentBatch(container, firstBatch);
  
  // 后续批次延迟渲染
  for (let i = BATCH_SIZE; i < students.length; i += BATCH_SIZE) {
    scheduleModuleTask(`student-batch-${i}`, () => {
      const batch = students.slice(i, i + BATCH_SIZE);
      renderStudentBatch(container, batch);
    }, { delay: i / BATCH_SIZE * 50, frame: true });
  }
}
```

### Phase 4: 工作流导航优化

在"本次必看"分类中添加**快速导航条**，显示当前进度：

```javascript
function renderCoreWorkflowProgress() {
  const visited = JSON.parse(sessionStorage.getItem('core-workflow-visited') || '[]');
  const container = document.querySelector('.core-workflow-nav');
  
  if (!container) return;
  
  const html = CORE_WORKFLOW_MODULE_IDS.map((id, index) => {
    const isVisited = visited.includes(id);
    const isCurrent = window.currentModuleId === id;
    return `
      <button 
        class="workflow-step ${isVisited ? 'visited' : ''} ${isCurrent ? 'current' : ''}"
        onclick="switchTab('${id}')"
        title="${CORE_WORKFLOW_STEP_HINTS[id]}"
      >
        <span class="step-number">${index + 1}</span>
        <i class="ti ${getModuleIcon(id)}"></i>
      </button>
    `;
  }).join('');
  
  container.innerHTML = html;
}

// 切换模块时记录访问
function markModuleVisited(moduleId) {
  if (!CORE_WORKFLOW_MODULE_IDS.includes(moduleId)) return;
  
  const visited = JSON.parse(sessionStorage.getItem('core-workflow-visited') || '[]');
  if (!visited.includes(moduleId)) {
    visited.push(moduleId);
    sessionStorage.setItem('core-workflow-visited', JSON.stringify(visited));
  }
  renderCoreWorkflowProgress();
}
```

## 预期收益

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 完整工作流遍历时间 | ~15s | ~8s | **-47%** |
| teacher-analysis 首次加载 | 700ms | 0ms（已预热） | **-100%** |
| student-details 渲染 | 7069ms | <1000ms（首屏） | **-86%** |
| 样式加载阻塞 | 每次 50-100ms | 0ms（已预加载） | **-100%** |

## 实施优先级

1. **高优先级**（立即实施）
   - Phase 1: 智能预热缓存（最大收益，风险低）
   - Phase 3: student-details 渐进式渲染（解决超预算红灯）

2. **中优先级**（下一轮）
   - Phase 2: 批量预加载样式
   - Phase 4: 工作流导航优化（UX 改善）

## 测试验证

```bash
# 验证预热生效
# 1. 登录后打开控制台，应看到 "[core-workflow] 预热完成"
# 2. 点击 teacher-analysis，应无 700ms 延迟

# 验证 student-details 性能
npm run smoke:modules:local
# 预期：switch:student-details < 1000ms（首屏渲染）
# 完整渲染在后台完成，不计入预算

# 验证缓存复用
# 1. 切换到 teacher-analysis
# 2. 切换到其他模块
# 3. 再切回 teacher-analysis
# 预期：立即渲染，无重新计算
```

## 兼容性保证

- 预热失败不影响现有流程（原逻辑兜底）
- 非 admin/director 角色无任何变化
- 保留现有 `canReuseTeacherAnalysisStats()` 签名校验逻辑
