## 变更说明

<!-- 简要描述本 PR 做了什么 -->

## 测试情况

- [ ] `npm run validate` 全绿
- [ ] 若涉及计算逻辑：`npm run check:calculation` 全绿
- [ ] **发布前必须额外运行 `npm run check:release-fast`**（体积预算、Worker 合约、性能预算等只在这里检查，validate 全绿 ≠ 可发布）

## 发布清单

- [ ] 推送前已运行 `npm run build`（或用 `npm run sync` 一键构建+推送）
- [ ] dist/index.html 已更新（`npm run check:dist-fresh` 应通过）
- [ ] 无计划外的 dist 产物变化（`git diff --staged dist/`）
