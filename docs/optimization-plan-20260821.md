# 系统优化实施计划 - 2026-08-21

## 优化策略

基于系统分析，按照以下原则进行优化：
1. **计算逻辑绝对不变** - 所有优化不触及计算核心，保持 `rawData=2176` 不变
2. **渐进式实施** - 每项优化独立验证，可独立回滚
3. **用户体验优先** - 优先优化首屏加载和交互响应

## Phase 1: 性能快速优化（当前实施）

### 1.1 CSP 策略强制执行 ✓ 准备就绪
- **文件**: `public/_headers`
- **当前状态**: 已有 CSP-RO 监控 `unsafe-eval`
- **行动**: 将 CSP-Report-Only 升级为强制执行（已有主 CSP 策略）
- **影响**: 安全加固，无功能影响
- **验证**: `npm run test:security-hygiene`

### 1.2 Vendor 库延迟加载优化 ✓ 基础设施已完备
- **发现**: runtime-loader-runtime.js 已实现完整的按需加载系统
- **现状分析**:
  - XLSX (864KB): 通过 `ensureXlsxVendorLoaded()` 按需加载
  - jsPDF + html2canvas: 通过 `pdf-export` skill 按需加载
  - Chart.js: 通过 `chart-vendor` skill 按需加载
  - alasql: 通过 `ensureAlasqlVendorLoaded()` 按需加载
- **优化点**: 系统已实现，确保所有调用点正确使用懒加载代理
- **验证**: 检查首屏不加载这些重型库

### 1.3 Runtime 加载策略优化
- **当前**: 系统有 `lazy` / `balanced` / `full` 三种加载模式
- **优化**: 默认 `balanced` 模式已考虑网络、内存、CPU 条件
- **热点预加载**: 已实现 `scheduleHotspotRuntimeWarmup()` 智能预热
- **验证**: 保持现有策略，确认工作正常

### 1.4 CSS 缓存策略优化
- **当前问题**: `/assets/js/*` 设置为 `no-store`
- **分析**: runtime JS 文件实际上有版本控制，可以使用 immutable 缓存
- **行动**: 将 `/assets/js/*` 改为 immutable 缓存（与 vendor 一致）
- **风险**: 需要确认 SW 正确处理版本更新
- **验证**: `npm run test:release-surface`

## Phase 2: 构建优化（下一步）

### 2.1 Vite 构建配置优化
- 启用更激进的代码分割
- 优化 chunk 策略
- 减少 app.js 体积

### 2.2 CSS 优化
- PurgeCSS 移除未使用样式
- Critical CSS 内联
- 继续 Tabler Icons 字体子集化

## Phase 3: 长期优化（后续）

### 3.1 TypeScript 迁移
### 3.2 测试覆盖率提升
### 3.3 可观测性平台

## 验证基准

**计算完整性约束** (绝对不能改变):
```bash
npm run test:calculation-snapshot:local
# 必须输出: "rawData": 2176
```

**完整回归验证**:
```bash
npm run validate
npm run check:release-fast
npm run smoke:modules:local
```

## 回退方案

参见 `ROLLBACK_SNAPSHOT.md`，当前基准:
- Git: 1dde0e2
- Cloudflare: 2026-08-11T02:35:24.050Z
- 计算基准: rawData=2176
