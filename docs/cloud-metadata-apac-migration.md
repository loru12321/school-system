# 成绩数据库迁移到亚太区域（school-system-cloud-metadata → APAC）

状态：**新库已建（`school-system-cloud-metadata-apac`，`71236bbb-cccf-4e3d-8f3f-881026464b81`，实际位于香港 HKG），切换排期在北京时间 2026-11-01（周日）05:00**。登录库 `school-system-gateway` 已在大阪（KIX），不需要迁移。

## 为什么迁

- `school-system-cloud-metadata`（`4ce32844-…`）建在美国西部（SJC）。每次加载成绩、届别、考试数据，Worker 都要跨太平洋访问，国内用户每个请求多 100 ms 以上。
- D1 建库后不能更换区域，只能新建 `primary_location_hint = apac` 的库，把数据搬过去，再把 Worker 绑定切过去。

## 数据规模（2026-10-31 只读核对）

| 项 | 数值 |
| --- | --- |
| `cloud_system_data` 行数 | 7,714（考试 16、学生历史等 7,686、教师映射 6、工作区 5、备份 1） |
| 库文件大小 | 约 15.7 MB |
| 最大单行 | 约 2.0 MB（6 月 27 日的一次性备份），最大考试约 411 KB |
| 最近写入 | 考试 2026-07-30，教师映射 2026-09-19（写入很少） |
| 附表 | `cloud_system_data_quarantine` 1 行（乱码重复考试的备份） |

单行远超 D1 单条 SQL 100 KB 的限制，所以不能用 `wrangler d1 export` + `execute --file` 回放，改用临时 Worker 以绑定参数逐行复制。

## 工具

- `scripts/ops/d1-copy/worker.js`：临时 Worker，同时绑定旧库（SRC）和新库（DST）。建表与 `cloudflare/d1/001 + 006` 一致；分页复制（每页 ≤25 行、≤6 MB）；逐行对所有列做 SHA-256 比对；`delta` 模式只复制某时间点之后更新的行，且不会覆盖新库里更新的行。
- `scripts/ops/d1-copy/run.mjs`：驱动 schema → copy → verify → summary，任何不一致都会让作业失败。
- `.github/workflows/d1-copy-cloud-metadata.yml`：手动触发。用仓库已有的 `CLOUDFLARE_API_TOKEN` 部署临时 Worker（随机 64 位十六进制令牌，日志中已屏蔽），跑完无论成败都删除该 Worker。**不修改生产 Worker 和 `wrangler.jsonc`。**
- `test:d1-copy-worker`：用 SQLite 模拟两库，覆盖 450 KB 大行、特殊字符键、附表幂等、增量复制、校验发现漂移、切换后新库写入不被覆盖。

## 维护窗口

按 9—10 月登录记录统计（北京时间），真人登录集中在 13—16 点和 19—20 点；01—03 点、05 点几乎为零（只有 CI 冒烟）。成绩数据写入以月计。建议选**周末北京时间 05:00—06:00**，并避开 GitHub Actions 的定时任务。

## 执行步骤

1. **建新库**：`school-system-cloud-metadata-apac`，`primary_location_hint = apac`。记录新库 id。
2. **演练（不影响线上）**：手动运行 `D1 copy cloud metadata` 工作流，`mode = full`，`target_database_id = 新库 id`。必须看到 `copy verified: every source row is present and identical in the destination`。此后可以随时重跑。
3. **切换**（维护窗口内）：
   1. 记下当前 UTC 时间 `T0`。
   2. 再跑一次工作流：`mode = delta`，`since = 演练开始时间`，补齐演练之后的写入。
   3. 合并只改 `wrangler.jsonc` 中 `CLOUD_SYSTEM_DATA_DB.database_id` 的 PR，`deploy-cloudflare.yml` 自动部署。
   4. 部署成功后立即再跑一次 `mode = delta`，`since = T0`，补齐切换期间落在旧库的写入。新库中更新的行会被保留并报告为 `destination newer`。
4. **验证**：`/api/health` 显示 `cloudSystemDataReady: true`；管理员登录后打开最近一场考试，成绩条数与切换前一致；对新库执行 `SELECT COUNT(*) FROM cloud_system_data`，应等于旧库行数。
5. **保留旧库 30 天**，不再写入。确认无误后再删除。

## 演练记录

- 2026-10-31 01:39 UTC（`D1 copy cloud metadata` run 41156361203，`mode = full`）：`cloud_system_data` 7,714 行、10,326,519 字节，`cloud_system_data_quarantine` 1 行，全部复制并逐行 SHA-256 校验一致；新库 6 个索引齐全；复制加校验约 5 分钟，临时 Worker 已删除。
- 切换时第一次 delta 的 `since` 用演练开始时间 `2026-10-31T01:39:05Z`。

## 回滚

- 切换后出现问题：把 `wrangler.jsonc` 的 `database_id` 改回 `4ce32844-b42d-45ff-b436-818ffe714a08` 并部署。如果切换后新库已有写入，先用同一工作流把新库反向复制回旧库（SRC 和 DST 互换，`mode = delta`，`since = T0`）。
- D1 Time Travel 可以把任一库恢复到 30 天内任意时间点，作为最后手段。
