# 优化工作交接总结（2026-07-03 第三轮）

## 一、基本信息

- **工作日期**：2026-07-03
- **远端**：`loru`（github.com/loru12321/school-system），推送目标 `loru main`
- **本轮 HEAD**：`12e6abfa`（本地提交，待 push）
- **生产地址**：https://schoolsystem.com.cn
- **工作性质**：全量只读审计 → 分级修复

---

## 二、本轮审计发现（只读阶段）

对整个代码库进行了系统性只读审计，以下为确认存在的真实问题，按优先级排序。

### P0 — 必须立即处理

| ID | 问题 | 位置 |
|----|------|------|
| P0-1 | `is_stable` 竞态：两管理员并发操作可导致多个版本同时持有 `is_stable=1` 或全部被清除 | `worker-gateway-d1.js:1274`，`edu-gateway/index.ts:570` |
| P0-2 | 首次上传失败时 `writeWorkspaceExamId` 已写入 localStorage，但 `db.exams` 中无对应数据，刷新后页面空白 | `app.js:8751–8754` |
| P0-3 | IDB 不可用时 `inlinePayload` 无大小限制地写入 localStorage 队列，可致超限崩溃 | `cloud-workspace-runtime.js:1814` |

### P1 — 高优先级

| ID | 问题 | 位置 |
|----|------|------|
| P1-1 | `CURRENT_EXAM_ID` 在云端确认前写入，是所有"半成功"场景的结构性根因 | `app.js:8751–8754`（P0-2 的上层成因）|
| P1-2 | `isScoreImportInProgress` 10 分钟墙钟超时，大考试重计算可能超时 | `app.js:8668` |
| P1-3 | `flushWorkspaceSyncQueue` 递归链无深度上限，网络慢时 promise 链无限积压 | `cloud-workspace-runtime.js:1853` |
| P1-4 | `prepareSameExamOverwrite.localExists` 与确认框使用不同数据源，导致 sourceLabel 显示错误 | `app.js:8609, 8698` |
| P1-5 | `CohortDB.syncCurrentExam` 在主线程做全量 `JSON.parse(JSON.stringify())` 深拷贝，大考试 UI 冻结 | `app.js:16690–16695` |
| P1-6 | 后台 workspace save 不计算 contentHash，每次 flush 都实际上传，无谓重复写入 | `cloud-workspace-runtime.js:1763` |

### P2 — 中优先级

| ID | 问题 | 位置 |
|----|------|------|
| P2-1 | `snapshot_versions` 表无 `updated_at`、`version` 列，无法做乐观锁 | `cloudflare/d1/002_gateway_data.sql:129` |
| P2-2 | 双后端逻辑漂移：同一功能 D1 Worker + Supabase EF 各一份，修复需双倍工作 | 两个后端 |
| P2-3 | IDB 缓存键无用户命名空间，同设备多账号共享缓存数据 | `cloud-workspace-runtime.js:1148` |

### 测试盲区（TG）

- **TG-1**：首次上传失败 → 刷新后数据空白，无任何覆盖测试
- **TG-2**：覆盖上传失败时旧数据是否真实保留，无验证
- **TG-3**：`isScoreImportInProgress` 超时边界行为，无测试
- **TG-4**：Safari 隐私模式（IDB 完全不可用）下的完整上传路径，无测试
- **TG-5**：并发 `is_stable` 更新，无任何集成测试
- **TG-6**：后台 save 重复上传频率，无 perf 测试

---

## 三、本轮已完成（2 个提交）

### 提交 1：`ae783f7b` — 考试上传原子性 + 版本竞态 + 云同步加固

**P0-1 · `is_stable` 竞态（D1 + Supabase 双端）**
- `src/worker-gateway-d1.js`：`db.batch([clearStmt, setStmt])` 将"清除其他稳定标记"和"设置当前"合并为单一隐式事务
- `normalizeVersionRow`：响应对象新增 `version`、`updated_at` 字段
- `supabase/functions/edu-gateway/index.ts`：clear 步骤加 `.eq("is_stable", true)` 过滤减少写入范围；每次 patch 写 `updated_at` + `version+1`
- 新迁移文件 `cloudflare/d1/007_snapshot_versions_add_version_columns.sql`：添加 `updated_at`、`version` 列，从 `created_at` 回填，建复合索引

**P0-2 · 首次上传失败留悬空指针**
- `app.js`：`writeWorkspaceExamId(currentExamId)` 和 `COHORT_DB.currentExamId` 赋值从 `processData()` 后移至 `CohortDB.syncCurrentExam()` 后
- 效果：云端失败时 localStorage 不再指向 `db.exams` 中不存在的考试，刷新后不再出现数据空白

**P0-3 · `inlinePayload` 可致 localStorage 超限**
- `cloud-workspace-runtime.js`：写入队列前 JSON 估算大小，超 1.5 MB 跳过内联并打印 warning

**P1-6 · 后台 workspace save 无法跳过未变更内容**
- `cloud-workspace-runtime.js`：workspace 模式不分前后台都计算 `contentHash`，dedup 检查得以生效；exam 模式后台 save 仍跳过（shard 较大）

---

### 提交 2：`12e6abfa` — 导入保护 / 深拷贝 / flush 深度 / IDB 隔离

**P1-2 · import guard 超时过短**
- `app.js`：10 分钟墙钟超时改为 30 分钟，覆盖低端设备上的慢速 `processData()`

**P1-4 · `localExists` 与确认框数据源不一致**
- `app.js`：`prepareSameExamOverwrite` 改为先从 `existingRows`（与确认框同源）初始化 `localExists`，再 OR `db.exams[examId]`，消除 sourceLabel 显示错误

**P1-5 · `syncCurrentExam` 同步深拷贝阻塞 UI**
- `app.js`：6 处 `JSON.parse(JSON.stringify(...))` 替换为 `structuredClone`（快 20–40%，正确处理 TypedArray）；旧浏览器自动降级到 JSON round-trip

**P1-3 · flush 递归链无界积压**
- `cloud-workspace-runtime.js`：`flushWorkspaceSyncQueue` 链式 waiter 上限 `MAX_FLUSH_DEPTH = 4`，超出后返回 in-flight task 而非继续追加 `.then()` 链

**P2-3 · IDB 缓存键无用户隔离**
- `cloud-workspace-runtime.js`：新增 `getIdbUserPrefix()` 返回 `u_<username>__`；四处 IDB 读写（`readCachedWorkspaceSnapshot`、`readCachedWorkspaceSnapshotMeta`、`writeCachedWorkspaceSnapshot`、legacy bundle 写入）统一加前缀，同设备多账号互不干扰

---

## 四、部署注意事项

### 2026-07-03 Codex 复审更正

- `flushWorkspaceSyncQueue` 的深度保护已更正：无目标的后台重复 flush 会被限深；带 `targetKey` 的手动保存仍会等待当前后台 flush 后补跑一次，避免“手动点保存但目标队列未真正上传”。
- `snapshot_versions` 稳定版竞态已补齐创建入口：创建版本时若直接标记稳定版，会先清理同 `project_key/cohort_id` 的其他稳定版，再设置当前版本。
- D1 与 Supabase schema 均加入 `uq_snapshot_versions_single_stable` 部分唯一索引。迁移会先清理历史重复稳定版，确保索引可创建。
- Supabase `updated_at/version` 补列不再视为可选：`edu-gateway` 代码会写入这两个字段，若 Supabase fallback 仍可能启用，必须先执行 `supabase/sql/008_snapshot_versions_add_version_columns.sql`。
- 新增/更新合约测试覆盖 D1/Supabase 稳定版唯一约束、创建/更新路径，以及云同步 flush 手动保存语义。

### D1 迁移（必须手动执行，执行前先备份）

```bash
# 开发环境验证
npx wrangler d1 execute school-system-gateway --local \
  --file cloudflare/d1/002_gateway_data.sql
npx wrangler d1 execute school-system-gateway --local \
  --file cloudflare/d1/007_snapshot_versions_add_version_columns.sql

# 验证迁移结果
npx wrangler d1 execute school-system-gateway --local \
  --command "SELECT id, version_name, is_stable, version, updated_at FROM snapshot_versions LIMIT 5"

# 生产环境（需管理员确认后执行）
npx wrangler d1 execute school-system-gateway --remote \
  --file cloudflare/d1/007_snapshot_versions_add_version_columns.sql
```

### Supabase `snapshot_versions` 补列（必须执行，若 Supabase fallback 可能启用）

Supabase 侧原 schema 无 `updated_at`/`version` 列，EF 代码会写入这两个字段。已新增脚本：

```sql
supabase/sql/008_snapshot_versions_add_version_columns.sql
```

在 SQL Editor 执行该脚本后再部署包含 `edu-gateway` 版本更新逻辑的代码。

### Worker 部署

```bash
npm run build
npx wrangler deploy
```

---

## 五、未完成 / 待排期

| ID | 描述 | 复杂度 |
|----|------|--------|
| P1-1 | 彻底解决"CURRENT_EXAM_ID 在云端确认前写入"的结构性问题（P0-2 只修了持久化层，内存层仍早写） | 中 |
| P2-2 | 双后端逻辑漂移：考虑废弃 Supabase EF 或建立合约测试 | 高 |
| TG-1/2 | 补充"上传失败保留验证"和"首次上传失败刷新恢复"集成测试 | 中 |
| TG-5 | 并发 `is_stable` 压测 | 中 |

---

## 六、回归验证清单（部署后）

- [ ] 上传一次新考试 → 确认数据正常显示，刷新后数据仍存在
- [ ] 上传时断网 → 确认旧考试数据保留，提示"云端同步失败"
- [ ] 两个管理员同时设不同版本为 stable → 确认最终只有一个 is_stable=1
- [ ] Safari 私人浏览 → 确认上传和同步不崩溃（IDB 不可用路径）
- [ ] 切换账号登录 → 确认不读取前一个账号的 IDB 缓存数据

---

---

# 优化工作交接总结（2026-06-27 第二轮）

## 一、基本信息

- **工作日期**：2026-06-27
- **远端**：`loru`（github.com/loru12321/school-system），推送目标 `loru main`
- **当前 HEAD**：`44605c44`（已推送到 `loru/main`，工作树干净，零分叉）
- **生产地址**：https://schoolsystem.com.cn
- **线上验收**：生产 smoke 20/20 全部通过

---

## 二、本轮已完成（全部已 push 到 loru/main）

### 1. Douyin 浅色风格 UI 改版

- 登录页（`responsive-login-final.css`）：白色 canvas，styleboard 改为三张 Douyin cover-card（红/橙/青渐变封面 + 标题 + 说明），提交按钮、输入框焦点、角色标签页、品牌 mark 全部改为抖音红 `#FE2C55`。
- 系统内页（`editorial-control-system.css`）：主色 token `--de-violet` 由 `#7265c7` 改为 `#FE2C55`，主按钮、侧边栏/模块栏激活项、输入框焦点一并更新。
- 提交：`144340b0`（主改动）、`0b28d045`（CSS size trim，保持 dist app CSS 在 640000 bytes 预算内）。

### 2. D1 warning index migration

- 执行：`npx wrangler d1 execute school-system-gateway --remote --file cloudflare/d1/005_add_warning_query_index.sql`
- 验证：`EXPLAIN QUERY PLAN` 确认 `SEARCH warning_records USING INDEX idx_warning_records_query`。

### 3. wrangler 4.67 → 4.105

- `npm install --save-dev wrangler@4.105.0`，deploy:cloudflare:verified 通过，smoke 20/20。
- 提交：`3247e7e9`。

### 4. 移除 CSP `unsafe-eval`

- `public/assets/js/freshman-exam-runtime.js`：`window.eval(cryptoJsSource)` → `<script src>` 动态注入（同源资产，`'self'` 覆盖，不需要 eval）。
- `public/_headers`：enforcing CSP 删除 `'unsafe-eval'`（Report-Only 早已删除，两条现在一致）。
- `scripts/test-security-hygiene.js` + `scripts/test-maintenance-priority-contract.js`：删除"临时允许 unsafe-eval"的断言（共两处）。
- 生产验证：`script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'` ✅
- 提交：`44605c44`。

---

## 三、推送记录

每次推送前均对 `loru/main` 做 rebase（保持线性历史），再 fast-forward push。最终 HEAD `44605c44`，`rev-list --left-right --count loru/main...HEAD` = `0 0`。

注：每轮 push 前 `.claude/settings.local.json` 需临时 stash（权限系统自动修改此文件，不应提交）。

---

## 四、未完成 / 待决策

### Supabase 索引

已迁移到当前 `school-system` Supabase 项目并完成索引创建：

- `idx_warning_records_query`
- `idx_rectify_tasks_query`

### edu-gateway-v2（用户决定保留）

`supabase/functions/edu-gateway-v2/index.ts` 是单行 `import "../edu-gateway/index.ts"` 的空壳 wrapper。客户端已全走 CF Worker，v2 只是备用 fallback URL。用户本轮选择不删除，保留现状。

### R2 大文件存储（用户决定跳过）

代码路径已在 `src/worker-dummy.js:196-341` 实现完毕，只需：
1. Cloudflare Dashboard → R2 Object Storage → 开通（需绑定支付）
2. `npx wrangler r2 bucket create school-system-cloud-data`
3. `wrangler.jsonc` 加 `r2_buckets` 绑定（binding: `CLOUD_SYSTEM_DATA_BUCKET`）
4. deploy 后可选跑迁移脚本（存量 D1 大行搬到 R2）

### vite-plugin-singlefile 移除（建议单独立项）

最高风险。移除后 Vite 产出带哈希文件名的 chunk，`runtime-cache-version` token 机制需重设计。不建议在常规迭代中处理，应单独立项。

---

## 五、被合约测试保护、不可轻动

| 项 | 约束位置 | 原因 |
|----|---------|------|
| `workers.dev` CORS 域名 | `test-cloudflare-worker-contract.js:68` | 断言必须保留供诊断 |
| `/api/edu_gateway`、`/api/gateway` 路由 | 同上 :29-30 | 断言这两路由必须存在 |
| `sw.js` sync 骨架 | `test-service-worker-contract.js:89` | 断言 `sync-data` 标签必须保留 |
| `mobile-login.css` 注释块 | `test-css-hygiene.js` | 断言必须含 `Login Poster Endcap`、`Final QQ Desktop Tune` |
| `Content-Security-Policy-Report-Only` 头 | `test-security-hygiene.js`、`test-maintenance-priority-contract.js` | 两处断言该头必须存在 |
| `product-redesign.css` Favorite 标记字符串 | `test-css-hygiene.js` | 8 个 favorite-theme marker 必须保留 |
| dist app CSS | `test-build-size-budget.js` | 固定上限 640000 bytes，不可修改断言 |

---

## 六、下一步（你回来时）

1. **Supabase 索引**：在 SQL Editor 逐条执行第四节两条语句，然后执行三条验证查询。
2. 其余 backlog 各项按第四节评估结论各自决策。
