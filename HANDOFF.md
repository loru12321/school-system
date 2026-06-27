# 优化工作交接总结（续接轮）

## 一、基本信息

- **工作日期**：2026-06-27
- **远端**：`loru`（github.com/loru12321/school-system），推送目标 `loru main`
- **当前 HEAD**：`aecbfabd`（已推送到 `loru/main`，工作树干净，零分叉）
- **生产地址**：https://schoolsystem.com.cn
- **线上验收**：生产 smoke 20/20 全部通过

---

## 二、本轮已完成（全部已 push 到 loru/main）

### 1. 线上验收（只读，未改线上）

| 项 | 验证方式 | 结果 |
|----|---------|------|
| 生产 smoke（20项） | `npm run verify:prod-minimal` | 全绿 `ok:true` |
| Session TTL 8h | 读 `src/worker-gateway-d1.js:5` | `LOCAL_SESSION_TTL_SECONDS = 60*60*8` ✅ |
| CSP / CSP-RO | curl 生产首页响应头 | enforcing 含 `unsafe-eval`，Report-Only 去掉，已线上生效 ✅ |
| wrangler observability | `wrangler.jsonc:6` | `"observability":{"enabled":true}` ✅ |
| compatibility_date | `wrangler.jsonc:5` | `2026-06-27` ✅ |
| 后端健康 | curl `/api/health` | D1 primary、gateway ready、D1 bound 全 true ✅ |

### 2. Git 与生产对齐

- 运行时版本是 **内容的确定性 SHA-256**（`scripts/build/update-runtime-cache-version.mjs`，版本令牌在哈希前被归一化）。
- 原 `f0db6761` 的令牌 `runtime-9bd5d97eb348` 相对自身内容是**陈旧**的；实际部署并线上运行的是 `runtime-fb4a741f1e4b`，但产物未提交。
- 已提交重建产物，使 HEAD 精确复现线上。已验证：`update-runtime-cache-version.mjs` 报 `changed:[]`；所有 diff 仅版本令牌（`dist/.../service-worker-runtime.js` 一处为 esbuild 局部变量改名 `S`→`f`，语义等价）。

### 3. Postgres migration 改为非阻塞

- `supabase/sql/007_add_management_query_indexes.sql`：`create index` → `create index concurrently`，加头部注释（不能在事务里跑、无写锁、INVALID 索引恢复方法）。
- D1 文件 `cloudflare/d1/005_add_warning_query_index.sql` 不变（SQLite 无 CONCURRENTLY，sub-ms 构建）。

### 4. 本地权限清理

- `.claude/settings.local.json` 删除危险/过宽授权：`Bash(del *)`、残缺的 `Bash(node -e ' *)`、过宽的 `Bash(npm run *)`。
- 注意：auto-mode 分类器禁止助手直接改该权限文件，本次由用户手动删除并验证 JSON 有效。

---

## 三、推送记录

- 推送前 `loru/main` 已分叉：远端多 1 个 `docs/performance/*` 自动 perf-trend 提交（`9b9191c2`），本地多 3 个。无文件冲突。
- 采用 **rebase**（不强推）保持线性历史，再 fast-forward push。
- 结果：`9b9191c2..aecbfabd main -> main`，`rev-list --left-right --count loru/main...HEAD` = `0 0`。

---

## 四、未完成 / 待你决策（已暂停）

### ⚠️ 数据库 migration —— 已提交脚本，尚未执行（最高价值未上线项）

**等你确认低峰窗口后再执行。在此之前不碰数据库、不跑 `wrangler d1 execute`。**

两个脚本均幂等（`IF NOT EXISTS`），可重复执行；索引只改查询速度，不改计算结果。

**Supabase / Postgres** —— 在 SQL editor 里**逐条**执行（`CONCURRENTLY` 不能在事务里，勿用 "run all"）：

```sql
create index concurrently if not exists idx_warning_records_query
  on public.warning_records (project_key, cohort_id, status, warning_level);
```
```sql
create index concurrently if not exists idx_rectify_tasks_query
  on public.rectify_tasks (project_key, cohort_id, status);
```

**D1**（sub-ms，无锁）：

```bash
npx wrangler d1 execute school-system-gateway --file cloudflare/d1/005_add_warning_query_index.sql
```

**执行后只读核验：**

```sql
-- 1) 不该有任何行返回（无 INVALID 索引）
SELECT indexrelid::regclass AS invalid_index FROM pg_index WHERE NOT indisvalid;
-- 2) 确认索引已建立
SELECT indexname FROM pg_indexes
WHERE tablename IN ('warning_records','rectify_tasks')
  AND indexname IN ('idx_warning_records_query','idx_rectify_tasks_query');
-- 3) EXPLAIN 确认查询走了 idx_*_query（PG）/ EXPLAIN QUERY PLAN（D1）
```

**中断恢复（残留 INVALID 索引）：**

```sql
DROP INDEX IF EXISTS idx_warning_records_query;   -- 或 idx_rectify_tasks_query
-- 然后重跑对应的 create concurrently 语句
```

### 其余 backlog（沿用上一轮 HANDOFF 第五节，本轮未触碰）

- **中风险**：wrangler `4.67 → 4.105` 升级后验证；Supabase `edu-gateway-v2`（v1 wrapper）客户端全切后可下线。
- **高风险（需架构决策）**：R2 大文件存储承接 `cloud_system_data` 大行；去掉 CSP `unsafe-eval`（先用 CSP-RO 报告验证归零再切）；移除 `vite-plugin-singlefile`（需重设计 chunk 与版本管理，建议单独立项）。

---

## 五、被合约测试保护、不可轻动（沿用上一轮记录）

| 项 | 约束位置 | 原因 |
|----|---------|------|
| `workers.dev` CORS 域名 | `test-cloudflare-worker-contract.js:68` | 断言必须保留供诊断 |
| `/api/edu_gateway`、`/api/gateway` 路由 | 同上 :29-30 | 断言这两路由必须存在 |
| `sw.js` sync 骨架 | `test-service-worker-contract.js:89` | 断言 `sync-data` 标签必须保留 |
| `mobile-login.css` | `test-css-hygiene.js` | 断言必须含特定 CSS 注释块 |
| `Content-Security-Policy-Report-Only` | `test-security-hygiene.js`、`test-maintenance-priority-contract.js` | 两处断言该头必须存在 |

---

## 六、下一步（你回来时）

1. 确认低峰窗口后告知，我先读记忆核对状态（脚本仍在、未被改动），再按第四节执行 migration（先 D1 或先 Postgres 均可），执行后做只读核验。
2. 之后再依次评估 backlog 各项。
