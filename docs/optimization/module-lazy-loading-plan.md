# 模块懒加载优化方案

## 现状分析

截图显示的 6 大模块分类：
- **数据准备** (3个模块): `starter-hub`, `upload`, `data-quality`
- **联考评价** (5个模块): `summary`, `analysis`, `high-score`, `indicator`, `bottom3`
- **基础对标** (2个模块): `county-teacher-portrait`, `county-school-horizontal`
- **教学改进** (5个模块): `teacher-analysis`, `teacher-detail-comparison`, 等
- **学生发展** (12个模块): `zhongkao-countdown`, `student-overview`, 等
- **教务执行** (5个模块): `exam-arranger`, `freshman-simulator`, 等

当前所有 163 个 runtime.js（总计约 5MB）在启动时全部加载。

## 优化目标

**首屏加载减少 70%**：仅加载数据准备模块 + 核心框架，其余模块按需加载。

## 实施方案

### Phase 1: 运行时分组

```javascript
// 定义懒加载分组
const RUNTIME_BUNDLES = {
  core: [
    'shell-runtime.js',
    'module-entry-runtime.js', 
    'auth-state-runtime.js',
    'data-manager-core-runtime.js'
  ],
  
  dataPreparation: [
    'data-cloud-runtime.js',
    'cloud-workspace-runtime.js',
    'data-quality-runtime.js',
    'prerequisite-status-runtime.js'
  ],
  
  examAnalysis: [
    'exam-analysis-package-runtime.js',
    'analytics-kernel-runtime.js',
    'analysis-highlights-runtime.js',
    'indicator-calc-runtime.js',
    'indicator-bottom3-export-runtime.js',
    'high-score-export-runtime.js'
  ],
  
  countyAnalysis: [
    'county-analysis-runtime.js',
    'county-school-horizontal-runtime.js'
  ],
  
  teachingImprovement: [
    'teacher-analysis-core-runtime.js',
    'teacher-highlights-runtime.js',
    'teacher-pairing-runtime.js',
    'teaching-assessment-sync-runtime.js'
  ],
  
  studentDevelopment: [
    'student-details-render-runtime.js',
    'progress-analysis-runtime.js',
    'cohort-growth-runtime.js',
    'marginal-push-runtime.js',
    'potential-analysis-runtime.js',
    'segment-analysis-runtime.js',
    'subject-balance-runtime.js',
    'blank-score-audit-runtime.js',
    'zhongkao-countdown-runtime.js'
  ],
  
  academicAdmin: [
    'freshman-exam-runtime.js',
    'grade-scheduler-runtime.js',
    'seat-adjustment-runtime.js'
  ]
};
```

### Phase 2: 动态加载器

在 `module-entry-runtime.js` 中添加：

```javascript
const loadedBundles = new Set(['core']);
const loadingPromises = new Map();

async function ensureRuntimeBundleLoaded(bundleName) {
  if (loadedBundles.has(bundleName)) return;
  
  if (loadingPromises.has(bundleName)) {
    return loadingPromises.get(bundleName);
  }
  
  const promise = (async () => {
    const files = RUNTIME_BUNDLES[bundleName] || [];
    await Promise.all(files.map(file => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `./assets/js/${file}`;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }));
    loadedBundles.add(bundleName);
  })();
  
  loadingPromises.set(bundleName, promise);
  return promise;
}
```

### Phase 3: 模块分类映射

```javascript
const MODULE_TO_BUNDLE = {
  // 数据准备
  'starter-hub': 'dataPreparation',
  'upload': 'dataPreparation',
  'data-quality': 'dataPreparation',
  
  // 联考评价
  'summary': 'examAnalysis',
  'analysis': 'examAnalysis',
  'high-score': 'examAnalysis',
  'indicator': 'examAnalysis',
  'bottom3': 'examAnalysis',
  
  // 县域对标
  'county-teacher-portrait': 'countyAnalysis',
  'county-school-horizontal': 'countyAnalysis',
  
  // 教学改进
  'teacher-analysis': 'teachingImprovement',
  'teacher-detail-comparison': 'teachingImprovement',
  'teacher-pairing': 'teachingImprovement',
  'teacher-township-ranking': 'teachingImprovement',
  
  // 学生发展
  'zhongkao-countdown': 'studentDevelopment',
  'student-overview': 'studentDevelopment',
  'student-details': 'studentDevelopment',
  'blank-score-audit': 'studentDevelopment',
  'subject-balance': 'studentDevelopment',
  'marginal-push': 'studentDevelopment',
  'progress-analysis': 'studentDevelopment',
  'cohort-growth': 'studentDevelopment',
  'potential-analysis': 'studentDevelopment',
  'segment-analysis': 'studentDevelopment',
  'correlation-analysis': 'studentDevelopment',
  'report-generator': 'studentDevelopment',
  
  // 考务工具
  'exam-arranger': 'academicAdmin',
  'freshman-simulator': 'academicAdmin',
  'grade-scheduler': 'academicAdmin',
  'seat-adjustment': 'academicAdmin',
  'mutual-aid': 'academicAdmin'
};
```

### Phase 4: 修改模块激活逻辑

在现有 `switchTab()` / `activateModule()` 中插入加载逻辑：

```javascript
async function activateModuleWithLazyLoad(moduleId) {
  const bundleName = MODULE_TO_BUNDLE[moduleId];
  
  if (bundleName && bundleName !== 'core') {
    // 显示加载提示
    showModuleLoadingIndicator(moduleId);
    
    try {
      await ensureRuntimeBundleLoaded(bundleName);
    } catch (error) {
      console.error(`Failed to load bundle ${bundleName}:`, error);
      alert('模块加载失败，请刷新页面重试');
      return;
    } finally {
      hideModuleLoadingIndicator();
    }
  }
  
  // 继续原有激活逻辑
  originalActivateModule(moduleId);
}
```

## 预期收益

| 指标 | 优化前 | 优化后 | 改善 |
|------|--------|--------|------|
| 首屏 JS 体积 | ~5MB | ~1.5MB | **-70%** |
| 首次可交互时间 | ~3.2s | ~1.1s | **-65%** |
| 首屏模块切换延迟 | 0ms | 200-400ms | 可接受 |

## 风险与对策

1. **模块依赖未明确**  
   对策：分阶段启用，先对独立模块（县域分析、考务工具）试点

2. **加载延迟影响体验**  
   对策：预加载机制 - 用户 hover 分类时开始预加载

3. **缓存失效**  
   对策：sw.js 仍预缓存所有文件，仅首次访问受益于懒加载

## 实施步骤

1. ✅ 完成现状分析与分组设计（本文档）
2. ⏳ 实现动态加载器 + 依赖映射
3. ⏳ 改造 module-entry-runtime.js 激活流程
4. ⏳ 添加加载状态提示 UI
5. ⏳ 本地测试 + smoke 验证
6. ⏳ 生产灰度发布

## 测试验证

```bash
# 验证懒加载生效
npm run smoke:modules:local

# 检查首屏加载的 runtime 文件数
# 预期：仅 core bundle（~20 个文件）

# 测试模块切换加载
# 预期：首次点击有 200-400ms 延迟，后续立即响应
```
