# 校级数据脱敏（system_data 打包档案）

日期：2026-11-01

## 背景

`cloud_system_data` 中的届别工作区（`cohort::<届>`）与考试分片按全县打包：所有学校的学生行一起存放，
以便客户端计算县/镇排名、学校对比、增值评价。此前教务主任、年级主任读取时拿到的是**完整档案**，
虽然界面只允许查询本校学生，但其他学校学生的姓名、学号仍随档案下发到其设备。

## 方案

Worker 在把档案返回给非管理员时（`src/worker-school-redaction.js`）：

| 内容 | 本校 | 其他学校 |
| --- | --- | --- |
| 姓名 | 保留 | 替换为稳定匿名标识 `匿名xxxxxxxxxx` |
| 学号 `id` | 保留 | 删除 |
| `uuid` | 保留 | 替换为 `anon-…` |
| 班级、成绩、排名、总分、T 分、状态 | 保留 | 保留（跨校统计、排名不受影响） |
| 其他文本字段（考场、电话等） | 保留 | 删除（数值字段保留） |

- 匿名标识 = `HMAC-SHA-256(APP_SESSION_SECRET, 学校 + 学号 + 姓名)`，同一学生在工作区、各考试分片中一致，
  跨考试的增值/进步计算仍能对上；不知道部署密钥无法反推。
- 本校判定与前端 `school-normalization-runtime.js` 一致（内置别名 + 档案中的 `SCHOOL_ALIAS_SETTINGS`），
  由 `scripts/test-system-data-school-redaction.js` 校验两边规则保持同步。
- 脱敏后的档案以普通 JSON 返回（所有客户端解析器都支持），并带 `__SCHOOL_SCOPE_REDACTED` 标记；
  `cloud.js` / `data-cloud-runtime.js` 打包上传时遇到该标记会直接拒绝，防止脱敏数据覆盖原档案。
- 不包含其他学校学生的档案原样返回（仍为压缩格式）；无法解压的压缩内容不返回（失败即关闭）。
- 覆盖路径：`/api/system-data`、`/sb/rest/v1/system_data` 的 GET/HEAD（D1 与 Supabase 代理）以及
  `/api/system-data-bootstrap`。边缘缓存键附加 `__scope`（按学校哈希），完整视图与脱敏视图互不串用。
- 管理员不受影响。

## 性能

8000 行 × 9 科、含工作区与一个分片的档案，脱敏约 150–250 ms CPU（解压 + 哈希 + JSON）。
带 `cache_version` 的读取会命中边缘缓存，同一版本每个机房只计算一次。
**需要 Workers 付费版的 CPU 配额**（免费版单请求 10 ms 不够）。

## 回滚

`wrangler.jsonc` → `vars.SYSTEM_DATA_SCHOOL_REDACTION` 改为 `"off"` 后重新部署，立即恢复为完整档案。
