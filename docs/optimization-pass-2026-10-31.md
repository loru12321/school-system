# 安全加固与工程整理（2026-10-31）

分支：`opt/hardening-2026-10-31`，起点 `b0affa2`。计算公式、权重、排名、空分处理和导出口径均未修改；`test:calculation-output-invariance` 确认 36 组固定数据在源码与发布产物中与基线一致。

## 生产只读核对（Cloudflare D1，2026-10-31）

- `school-system-gateway`：`issues` 0 行、`system_logs` 2 行，未登录可读接口目前没有泄露实际学生数据。
- `login_sessions` 约 1.1 万行，原先没有 `session_id` 索引；`login_rate_limits` 已存在。
- 唯一管理员账号的 `password_source` 为 `supabase_login`（本人沿用的密码），因此管理员强制改密只针对他人下发/重置的密码。
- `system_users` / `system_users_staging` 已无 `password_display` 列，旧 004 清理已生效。

## 修复与优化

| 级别 | 内容 | 验证 |
| --- | --- | --- |
| P0 | `/sb/rest/v1/issues`、`/sb/rest/v1/system_logs` 所有方法都要求登录；问题反馈按管理员/本校/本年级/本班限定范围，日志仅管理员和校领导可读、仅管理员可改删，操作人与时间由服务端写入 | `test:managed-rest-access`（旧代码上复现失败） |
| P0 | 会话可撤销：退出登录、改密、重置、批量导入、停用账号立即生效；角色与学校从账号表实时刷新；续期最长 7 天 | `test:session-revocation`（旧代码上复现失败） |
| P1 | 500 不再回显内部错误；生产 CORS 不再放行任意 localhost；CSP 违规写入日志；管理员需更换他人下发的密码 | worker/security 契约测试 |
| P1 | 带 `?v=runtime-<hash>` 的运行时模块改为一年 immutable 缓存，回访不再重复下载约 170 个模块 | `test-worker-asset-cache-policy` |
| P1 | `src/index.html` 剩余 47 个内联事件全部改为 `data-ui-action="call"` / `data-ui-change="call"` 白名单委托 | `test:html-hygiene`（要求 0）、`test:ui-actions-declared-calls` |
| P1 | 运行时加载器删除两个从未被调用的函数，回到 59,000 字节预算内；修正已删除考场视图遗留的性能缓存断言 | `check:performance`、`test:maintenance-priority-contract` |
| P2 | D1：新增 008 迁移（登录限流表 + `login_sessions(session_id)` 索引）；004 改为可在全新库重放的说明文件，原清理语句移至 `cloudflare/d1/legacy/` | `test:d1-migrations-replay` |
| P2 | 生产入口 `worker-dummy.js` 更名为 `worker.js` | `test:worker-entrypoint-contract` |
| P2 | 删除旧阿里云/ACME 依赖（lockfile 148 项）、9 个未被引入的 CSS、根目录临时脚本与对比页；旧修复报告移入 `docs/archive/`；测试夹具清理加重试，避免残留 `.tmp-*` | `test:css-hygiene`（禁止孤立样式）、`test:npm-audit` |

## 验证

云端干净环境（`npm ci` + `npm run build`）：`validate:hygiene`、`validate:state`、`validate:data`、`validate:build`、`check:release-fast`、`check:p1` 全部通过。

需要在可访问生产站点的机器上补跑：`smoke:layout:local`、`test:calculation-snapshot:local`、`test:ui-copy-integrity`（依赖真实登录与云端数据），以及依赖本机样例文件的 `verify:exam-arranger-sample`。

## 后续建议

- `public/assets/js` 中运行时拼接的 HTML 仍有约 115 处内联事件，以及 12 个内联 `<script>`；迁完后才能去掉 CSP 的 `unsafe-inline`。
- smoke 数据集仍使用已毕业的 2022 级，应迁到在校届别并重置计算快照基线。
- `login_sessions` 没有保留期限，可按 180 天等策略定期归档或清理。
- 校领导和年级主任读取的仍是整届打包数据，按学校分片后才能在服务端限制范围。
